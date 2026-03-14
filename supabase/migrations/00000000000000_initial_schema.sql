-- 📑 LinkDrop V2: Initial Schema Migration
-- Designed for Supabase (PostgreSQL)

-- [1] Profiles: 사용자 기본 정보
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'writer', -- 'writer', 'grand_writer'
  is_business BOOLEAN DEFAULT false,
  bank_account JSONB, -- { "bank_name": "", "account_no": "", "owner": "" }
  template_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- [2] Design Assets: 디자인 창고 리소스
CREATE TABLE IF NOT EXISTS public.design_assets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  download_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- [3] Referrals: 3xN 매트릭스 계보
CREATE TABLE IF NOT EXISTS public.referrals (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  referrer_id UUID REFERENCES public.profiles(id), -- 직접 추천인
  parent_id UUID REFERENCES public.profiles(id),   -- 매트릭스 부모
  position INTEGER CHECK (position BETWEEN 1 AND 3),
  depth INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- [4] Sales: 매출 기록
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  product_price NUMERIC(10, 2) NOT NULL DEFAULT 59000.00,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'refunded'
  payment_method TEXT, -- 'card', 'trans', 'vbank', 'phone'
  card_issuer_name TEXT,
  card_issuer_code TEXT,
  payment_gateway_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- [5] Earnings: 수당 및 정산 관리
CREATE TABLE IF NOT EXISTS public.earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL, -- 'direct', 'upline_bonus'
  display_label TEXT, -- '직접 판매 수익', '팀 후원 보너스'
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'paid', 'cancelled'
  scheduled_payout_date DATE,
  actual_payout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 비즈니스 로직: 정산일 자동 계산 함수 (매출 발생 주 일요일 + 17일 = 3주차 수요일) ──
CREATE OR REPLACE FUNCTION calculate_payout_date(sale_timestamp TIMESTAMPTZ)
RETURNS DATE AS $$
BEGIN
  -- 1. 해당 주의 일요일을 구함 (date_trunc('week', ...)는 월요일을 반환하므로 -1일 + 6일 처리)
  -- 2. 일요일로부터 17일(2주 + 3일)을 더해 수요일을 만듦
  RETURN (date_trunc('week', sale_timestamp) + INTERVAL '6 days')::DATE + INTERVAL '17 days';
END;
$$ LANGUAGE plpgsql;

-- ── 비즈니스 로직: Earnings 생성 트리거 함수 ──
CREATE OR REPLACE FUNCTION on_earning_created()
RETURNS TRIGGER AS $$
DECLARE
    seller_name TEXT;
BEGIN
    -- 판매자 실명 가져오기 (Description용)
    SELECT full_name INTO seller_name FROM public.profiles WHERE id = (SELECT seller_id FROM public.sales WHERE id = NEW.sale_id);

    -- [1] 수요일 정산일 자동 계산
    NEW.scheduled_payout_date := calculate_payout_date(NEW.created_at);

    -- [2] 시니어 유저용 표시 라벨 및 설명 자동 생성
    IF NEW.type = 'direct' THEN
        NEW.display_label := '직접 판매 수익';
        NEW.description := '본인의 전자책 판매 수익';
    ELSIF NEW.type = 'upline_bonus' THEN
        NEW.display_label := '팀 후원 보너스';
        NEW.description := seller_name || ' 님의 전자책 판매 지원비';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_earning_created
BEFORE INSERT ON public.earnings
FOR EACH ROW EXECUTE FUNCTION on_earning_created();

-- ── Row Level Security (RLS) 설정 ──
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view their own earnings" ON public.earnings FOR SELECT USING (auth.uid() = user_id);
