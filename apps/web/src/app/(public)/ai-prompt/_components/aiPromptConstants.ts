export type Tab = 'prompts' | 'dark' | 'brand' | 'image';

export type Category = { id: string; icon: string; label: string };

export type Prompt = {
  code: string;
  cat: string;
  title: string;
  description: string;
  body?: string | null;
  is_premium: boolean;
};

export const BRAND_SUBCATEGORIES = [
  { id: 'brand-kit',      icon: '🏷️', label: '브랜드 시스템' },
  { id: 'brand-digital',  icon: '📱', label: '디지털 채널' },
  { id: 'brand-campaign', icon: '📣', label: '캠페인·경험' },
];

export const BRAND_SUBCAT: Record<string, string> = {
  M01: 'brand-kit', M08: 'brand-kit', M10: 'brand-kit',
  M03: 'brand-digital', M05: 'brand-digital', M07: 'brand-digital', M11: 'brand-digital',
  M02: 'brand-campaign', M04: 'brand-campaign', M06: 'brand-campaign',
  M09: 'brand-campaign', M12: 'brand-campaign',
};

export const BUYER_ROLES = new Set(['partner', 'gold_partner', 'instructor', 'admin']);

export function getHintColors(activeTab: Tab) {
  if (activeTab === 'brand') return { bg: 'rgba(248,184,77,0.08)', border: 'rgba(248,184,77,0.28)', text: 'rgba(248,184,77,0.85)' };
  if (activeTab === 'dark')  return { bg: 'rgba(207,81,72,0.08)',  border: 'rgba(207,81,72,0.28)',  text: 'rgba(230,100,90,0.85)' };
  return { bg: 'rgba(94,231,223,0.06)', border: 'rgba(94,231,223,0.15)', text: 'rgba(255,255,255,0.45)' };
}

export function getHintText(activeTab: Tab) {
  if (activeTab === 'dark')  return '⚠️ 비공개 전용 프롬프트\n외부 공유 시 주의하세요';
  if (activeTab === 'brand') return '📷 ChatGPT 4o 전용\n이미지를 먼저 업로드한\n후 프롬프트를 붙여넣으세요';
  return '[ ] 안에 구체적으로\n채울수록 결과가 달라진다';
}
