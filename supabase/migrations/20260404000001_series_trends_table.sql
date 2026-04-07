-- series_trends 테이블: 트랜드 수집 결과 저장 (4시간 주기 자동 수집)
create table if not exists public.series_trends (
  id            uuid        primary key default gen_random_uuid(),
  collected_at  timestamptz not null,
  keywords      jsonb       not null,
  source_status jsonb       not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- 최신순 조회 인덱스
create index if not exists series_trends_collected_at_idx
  on public.series_trends (collected_at desc);

-- RLS 활성화
alter table public.series_trends enable row level security;

-- 정책: 전체 읽기 허용
create policy "series_trends_select_all" on public.series_trends
  for select using (true);

-- 정책: service_role 삽입만 허용 (Cron API에서만 insert)
create policy "series_trends_insert_service" on public.series_trends
  for insert with check (true);
