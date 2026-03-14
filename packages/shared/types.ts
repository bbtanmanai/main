/**
 * 10대 핵심 주제 정의 및 고품질 전문 소스 설정
 */
export const CORE_THEMES = {
  SHORT_FORM: {
    id: "01",
    name: "쇼츠트렌드_바이럴대본",
    keywords: ["쇼츠 트렌드", "숏폼 바이럴", "유튜브 쇼츠 공식"],
    rss: "https://news.google.com/rss/search?q=site:youtube.com+Shorts+Trend+Viral&hl=en-US&gl=US&ceid=US:en" // 유튜브 사이트 제한
  },
  AI_YOUTUBE_FACTORY: {
    id: "09",
    name: "[AI유튜브] 100% 자동화 제작공장",
    keywords: ["AI 유튜브 자동화", "자동 영상 제작", "유튜브 수익화"],
    rss: "https://news.google.com/rss/search?q=site:youtube.com+AI+YouTube+Automation+Video+Production&hl=en-US&gl=US&ceid=US:en" // 유튜브 롱폼 타겟
  },
  AI_VIDEO: {
    id: "04",
    name: "AI영상제작_광고영상",
    keywords: ["AI 비디오 제작", "Runway Gen-2", "Luma AI"],
    rss: "https://news.google.com/rss/search?q=site:youtube.com+AI+Video+Production+Tools+Runway+Luma&hl=en-US&gl=US&ceid=US:en"
  },
  INSTA_MARKETING: {
    id: "02",
    name: "인스타마케팅_카드뉴스",
    keywords: ["인스타그램 마케팅", "카드뉴스 디자인", "인스타툰 스토리텔링"],
    rss: "https://news.google.com/rss/search?q=Instagram+Marketing+Strategy+Trends&hl=en-US&gl=US&ceid=US:en"
  },
  BLOG_SEO: {
    id: "03",
    name: "블로그수익화_SEO전략",
    keywords: ["블로그 수익화", "SEO 최적화", "고단가 키워드"],
    rss: "https://news.google.com/rss/search?q=Blogging+SEO+Monetization+Strategy&hl=en-US&gl=US&ceid=US:en"
  },
  WEB_NOVEL: {
    id: "05",
    name: "웹소설플롯_캐릭터",
    keywords: ["웹소설 작법", "인기 웹소설 클리셰", "웹소설 플롯"],
    rss: "https://news.google.com/rss/search?q=Web+Novel+Writing+Techniques+Trends&hl=ko&gl=KR&ceid=KR:ko"
  },
  AI_BIZ_MODEL: {
    id: "06",
    name: "AI비즈니스모델_창업",
    keywords: ["AI 비즈니스 모델", "AI 1인 창업", "AI 수익 사례"],
    rss: "https://news.google.com/rss/search?q=site:youtube.com+AI+SaaS+Solopreneur+Business+Model&hl=en-US&gl=US&ceid=US:en"
  },
  PROMPT_LIB: {
    id: "07",
    name: "프롬프트라이브러리",
    keywords: ["고성능 프롬프트", "마케팅 프롬프트", "AI 명령어"],
    rss: "https://news.google.com/rss/search?q=Advanced+Prompt+Engineering+Library&hl=en-US&gl=US&ceid=US:en"
  },
  DIGITAL_PRODUCT: {
    id: "08",
    name: "디지털상품기획_전자책",
    keywords: ["전자책 기획", "지식 창업", "디지털 상품 판매"],
    rss: "https://news.google.com/rss/search?q=Digital+Product+Ebook+Knowledge+Commerce&hl=en-US&gl=US&ceid=US:en"
  },
  WORK_AUTO: {
    id: "10",
    name: "업무자동화_워크플로우",
    keywords: ["업무 자동화", "Make 활용", "Zapier 자동화"],
    rss: "https://news.google.com/rss/search?q=Workflow+Automation+Make+Zapier+Tutorial&hl=en-US&gl=US&ceid=US:en"
  }
} as const;

export interface CollectedData {
  source: string;
  title: string;
  link: string;
  content: string;
  pubDate: string;
  theme: keyof typeof CORE_THEMES;
}

export interface RefinedData extends CollectedData {
  score: number;
  insight: string;
  summary: string;
  type: 'insight' | 'script' | 'general';
  multiFormats?: MultiFormatScript; // [101] 4대 포맷 변환 결과
}

/**
 * [101] 4대 포맷 대본 변환 결과
 * Script-Mass-Scout 에이전트의 핵심 출력물
 */
export interface MultiFormatScript {
  /** 카드뉴스형: 핵심 요약 + 슬라이드별 문구 중심 */
  cardNews: {
    headline: string;          // 1슬라이드 후킹 헤드라인
    slides: string[];          // 2~6슬라이드 핵심 문구 (최대 5개)
    cta: string;               // 마지막 슬라이드 CTA 문구
  };
  /** 인스타툰형: 대화체 + 장면 묘사 중심 */
  instaToon: {
    setup: string;             // 상황 설정 (scene 1)
    conflict: string;          // 갈등/문제 제시 (scene 2)
    resolution: string;        // 해결/반전 (scene 3)
    closing: string;           // 마무리 메시지 (scene 4)
  };
  /** 숏폼영상형: 3초 후킹 + 빠른 호흡 나레이션 중심 */
  shortForm: {
    hook: string;              // 첫 3초 후킹 문구 (20자 이내)
    body: string[];            // 본문 나레이션 (5~7개 포인트)
    outro: string;             // 마무리 + 구독 유도
  };
  /** 메시지형: 카톡/밴드 공유용 정보성 문구 중심 */
  message: {
    opening: string;           // 첫 줄 관심 유도
    content: string;           // 핵심 내용 (3~5줄)
    closing: string;           // 링크/행동 유도
  };
}

export interface UsageLog {
  date: string;
  theme: string;
  totalItems: number;
  refinedItems: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
}
