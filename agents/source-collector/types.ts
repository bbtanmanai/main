
/**
 * 10대 핵심 주제 정의 및 수집 설정
 */
export const CORE_THEMES = {
  SHORT_FORM: {
    id: "01",
    name: "01_쇼츠트렌드_바이럴대본",
    keywords: ["쇼츠 트렌드", "숏폼 바이럴", "유튜브 쇼츠 공식"],
    folderId: "" // 사용자 입력 필요
  },
  INSTA_MARKETING: {
    id: "02",
    name: "02_인스타마케팅_카드뉴스",
    keywords: ["인스타그램 마케팅", "카드뉴스 디자인", "인스타툰 스토리텔링"],
    folderId: ""
  },
  BLOG_SEO: {
    id: "03",
    name: "03_블로그수익화_SEO전략",
    keywords: ["블로그 수익화", "SEO 최적화", "고단가 키워드"],
    folderId: ""
  },
  AI_VIDEO: {
    id: "04",
    name: "04_AI영상제작_광고영상",
    keywords: ["AI 비디오 제작", "Runway Gen-2", "Luma AI"],
    folderId: ""
  },
  WEB_NOVEL: {
    id: "05",
    name: "05_웹소설플롯_캐릭터",
    keywords: ["웹소설 작법", "인기 웹소설 클리셰", "웹소설 플롯"],
    folderId: ""
  },
  AI_BIZ_MODEL: {
    id: "06",
    name: "06_AI비즈니스모델_창업",
    keywords: ["AI 비즈니스 모델", "AI 1인 창업", "AI 수익 사례"],
    folderId: ""
  },
  PROMPT_LIB: {
    id: "07",
    name: "07_프롬프트라이브러리",
    keywords: ["고성능 프롬프트", "마케팅 프롬프트", "AI 명령어"],
    folderId: ""
  },
  DIGITAL_PRODUCT: {
    id: "08",
    name: "08_디지털상품기획_전자책",
    keywords: ["전자책 기획", "지식 창업", "디지털 상품 판매"],
    folderId: ""
  },
  GLOBAL_AI_TECH: {
    id: "09",
    name: "09_글로벌AI테크뉴스",
    keywords: ["AI 최신 기술", "글로벌 AI 트렌드", "OpenAI 뉴스"],
    folderId: ""
  },
  WORK_AUTO: {
    id: "10",
    name: "10_업무자동화_워크플로우",
    keywords: ["업무 자동화", "Make 활용", "Zapier 자동화"],
    folderId: ""
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
}
