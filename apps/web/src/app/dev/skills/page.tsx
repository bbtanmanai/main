// ============================================================
// [DEV ONLY] Claude Skills 가이드 — /dev/skills
// 개발 기간 임시 라우터. 프로덕션 배포 전 삭제 또는 접근 제한 필요.
//
// ★ 자동 업데이트: .claude/skills/ 디렉토리를 파일시스템에서 직접 읽음.
//   새 스킬 추가 시 페이지 코드 수정 없이 자동 반영.
//   CLAUDE.md Skill routing 섹션에서 트리거 조건도 자동 추출.
// ============================================================

import fs from "fs";
import path from "path";
import Link from "next/link";
import type { Metadata } from "next";

// 항상 최신 파일을 읽도록 동적 렌더링 강제
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "[DEV] Claude Skills 가이드 — LinkDrop",
  robots: { index: false, follow: false },
};

// ── 경로 설정 ─────────────────────────────────────────────────
// process.cwd() = C:\LinkDropV2\apps\web  (Next.js 프로젝트 루트)
const SKILLS_DIR = path.join(process.cwd(), "..", "..", ".claude", "skills");
const CLAUDE_MD  = path.join(process.cwd(), "..", "..", ".claude", "CLAUDE.md");

// ── 타입 ──────────────────────────────────────────────────────
interface DiscoveredSkill {
  command: string;       // /skillname
  dirName: string;       // 폴더명 또는 파일명
  name: string;          // frontmatter name
  description: string;   // frontmatter description
  version?: string;      // frontmatter metadata.version
  routingTrigger?: string; // CLAUDE.md Skill routing 섹션에서 추출
  bodyPreview: string;   // SKILL.md 본문 첫 단락 (설명 보완)
  isFolder: boolean;
}

// ── 한글 메타 오버라이드 ──────────────────────────────────────
// SKILL.md frontmatter는 영문 — 여기서 한글 이름·설명으로 덮어씀.
// 새 스킬 추가 시 command 키를 추가하면 한글 표시.
const KOREAN_META: Record<string, { name: string; description: string }> = {
  // gstack 스킬
  "/investigate":      { name: "버그 조사",         description: "에러·버그의 근본 원인을 체계적으로 추적하는 전용 워크플로우" },
  "/ship":             { name: "배포",               description: "커밋·PR·배포까지 출시 전 과정을 한 번에 처리" },
  "/qa":               { name: "QA 테스트",          description: "사이트 전체를 자동으로 테스트하고 버그 리포트 생성" },
  "/review":           { name: "코드 리뷰",          description: "git diff 기준으로 코드 품질·보안·컨벤션을 점검" },
  "/plan-eng-review":  { name: "아키텍처 리뷰",      description: "신규 기능 설계 방향을 시니어 엔지니어 관점으로 검토" },
  "/checkpoint":       { name: "체크포인트 저장",    description: "현재 작업 진행 상황을 저장하고 세션 간 연속성 확보" },
  // 신규 개발 스킬
  "/code-reviewer":    { name: "코드 리뷰어",        description: "TypeScript·React·Next.js·Python PR 리뷰, 보안 취약점 탐지, 성능 분석, 코딩 표준 검사" },
  "/senior-frontend":  { name: "시니어 프론트엔드",  description: "React·Next.js 15·TypeScript·Tailwind CSS 기반 컴포넌트 생성, 번들 분석, 프로젝트 구조 점검" },
  // 디자인 스킬
  "/refactoring-ui":                  { name: "UI 리팩터링",         description: "기존 컴포넌트 스타일을 계층·간격·색상 원칙으로 체계적으로 개선" },
  "/ui-ux-pro-max":                   { name: "UI/UX 프로 맥스",    description: "디자인 시스템 생성, 산업별 UI 스타일 추천, 랜딩 방향 결정" },
  "/bencium-innovative-ux-designer":  { name: "이노베이티브 디자이너", description: "랜딩·캠페인 페이지에서 기억에 남는 대담한 크리에이티브 UX 구현" },
  "/bencium-controlled-ux-designer":  { name: "컨트롤드 디자이너",  description: "결제·회원·기업 페이지에서 WCAG 2.1 AA 준수 체계적 UX 설계" },
  "/bencium-impact-designer":         { name: "임팩트 디자이너",     description: "제네릭 AI 미학을 회피한 프로덕션급 고품질 인터페이스 제작" },
  "/design-audit":                    { name: "디자인 감사",         description: "기존 화면의 UI/UX 문제를 체계적으로 감사하고 우선순위별 개선 계획 수립" },
  "/bencium-code-conventions":        { name: "코드 컨벤션",         description: "Next.js·React·TypeScript·Supabase 코드 컨벤션 점검 및 스타일 가이드 적용" },
  // 문서 스킬
  "/pdf":   { name: "PDF 생성",   description: "문서를 PDF 형식으로 변환하고 내보내기" },
  "/docx":  { name: "DOCX 생성",  description: "Word 문서 형식으로 변환하고 내보내기" },
  "/pptx":  { name: "PPTX 생성",  description: "PowerPoint 프레젠테이션 형식으로 변환하고 내보내기" },
  "/xlsx":  { name: "XLSX 생성",  description: "Excel 스프레드시트 형식으로 변환하고 내보내기" },
  // React/코드 스킬
  "/react-best-practices":    { name: "React 모범 사례",     description: "React 컴포넌트 패턴, 서버/클라이언트 직렬화 규칙 점검" },
  "/web-design-guidelines":   { name: "웹 디자인 가이드라인", description: "웹 디자인 표준 원칙과 접근성 기준 적용" },
  "/react-view-transitions":  { name: "React 뷰 전환",        description: "React View Transitions API를 활용한 페이지 전환 애니메이션 구현" },
  "/composition-patterns":    { name: "컴포지션 패턴",        description: "React 컴포넌트 합성 패턴, 상태 리프팅 구조 설계" },
  // 기타 스킬
  "/debug-issue":      { name: "이슈 디버깅",    description: "코드 이슈를 단계적으로 분석하고 해결책 제시" },
  "/explore-codebase": { name: "코드베이스 탐색", description: "프로젝트 구조를 파악하고 핵심 파일·패턴 설명" },
  "/refactor-safely":  { name: "안전한 리팩터링", description: "기존 동작을 보장하면서 코드 구조를 개선" },
  "/review-changes":   { name: "변경사항 리뷰",   description: "최근 변경된 코드를 검토하고 잠재적 문제 식별" },
  "/obsidian":         { name: "Obsidian 연동",   description: "Obsidian 노트와 연동하여 문서 관리" },

  // ── PM 데이터 분석
  "/ab-test-analysis": { name: "A/B 테스트 분석",  description: "통계적 유의성·신뢰구간·표본 검증으로 A/B 테스트 결과를 분석하고 출시·연장·중단 권고를 도출" },
  "/cohort-analysis":  { name: "코호트 분석",       description: "사용자 집단별 리텐션 곡선·기능 채택 추이·이탈 패턴을 분석해 인게이지먼트 트렌드 파악" },
  "/sql-queries":      { name: "SQL 쿼리 생성",     description: "자연어 설명을 BigQuery·PostgreSQL·MySQL 등 방언별 SQL로 변환. 스키마 다이어그램 업로드 지원" },

  // ── PM 실행
  "/brainstorm-okrs":             { name: "OKR 브레인스토밍",       description: "회사 목표에 정렬된 팀 레벨 OKR — 정성적 목표와 측정 가능한 핵심 결과를 분기별로 수립" },
  "/create-prd":                  { name: "PRD 작성",                description: "문제·목표·세그먼트·가치 제안·솔루션·출시 계획을 포함한 8개 섹션 제품 요구사항 문서 작성" },
  "/dummy-dataset":               { name: "더미 데이터셋 생성",      description: "CSV·JSON·SQL·Python 스크립트 형식으로 컬럼과 제약 조건을 커스터마이징한 현실적인 테스트 데이터 생성" },
  "/job-stories":                 { name: "잡 스토리 작성",          description: "'상황이 ~할 때, ~하고 싶다, 그래서 ~할 수 있다' 형식의 잡 스토리와 상세 인수 기준 작성" },
  "/outcome-roadmap":             { name: "아웃컴 로드맵 전환",      description: "기능 중심 로드맵을 사용자·비즈니스 임팩트를 담은 아웃컴 중심 전략 로드맵으로 재구성" },
  "/pre-mortem":                  { name: "사전 부검 (프리모텀)",    description: "출시 계획의 리스크를 Tigers·Paper Tigers·Elephants로 분류하고 출시 차단·빠른 후속·모니터링으로 우선순위화" },
  "/prioritization-frameworks":  { name: "우선순위 프레임워크 가이드", description: "RICE·ICE·Kano·MoSCoW·Opportunity Score 등 9가지 우선순위 방법론 공식·적용 시점·템플릿 참조" },
  "/release-notes":               { name: "릴리즈 노트 작성",        description: "티켓·PRD·변경 로그에서 신기능·개선·버그 수정 카테고리로 정리된 사용자 대상 릴리즈 노트 생성" },
  "/retro":                       { name: "스프린트 회고",            description: "잘된 점·개선점·담당자·기한이 포함된 액션 아이템으로 구조화된 스프린트 회고 진행" },
  "/sprint-plan":                 { name: "스프린트 계획",            description: "팀 용량 산정·스토리 선정·의존성 매핑·리스크 식별로 스프린트를 체계적으로 계획" },
  "/stakeholder-map":             { name: "이해관계자 맵",            description: "파워/관심도 그리드로 이해관계자를 분류하고 분면별 소통 전략과 커뮤니케이션 계획 수립" },
  "/summarize-meeting":           { name: "회의록 요약",              description: "회의 녹취록을 날짜·참석자·핵심 결정·요약·액션 아이템이 포함된 구조화된 회의록으로 변환" },
  "/test-scenarios":              { name: "테스트 시나리오 작성",    description: "유저 스토리에서 테스트 목표·시작 조건·사용자 역할·단계별 액션·예상 결과를 포함한 QA 시나리오 생성" },
  "/user-stories":                { name: "유저 스토리 작성",         description: "3C(카드·대화·확인)와 INVEST 기준을 따르는 설명·디자인 링크·인수 기준 포함 유저 스토리 작성" },
  "/wwas":                        { name: "WWA 백로그 항목",          description: "Why-What-Acceptance 형식으로 독립적·가치 있는·테스트 가능한 전략적 맥락을 담은 백로그 항목 작성" },

  // ── GTM (시장 진출)
  "/beachhead-segment":    { name: "교두보 시장 선정",    description: "첫 진입 시장 세그먼트를 절박한 문제·지불 의향·시장 점유 가능성·추천 잠재력 기준으로 평가해 선정" },
  "/competitive-battlecard": { name: "경쟁사 배틀카드",  description: "특정 경쟁사 대비 포지셔닝·기능 비교·이의 처리·승패 패턴을 담은 영업팀용 배틀카드 작성" },
  "/growth-loops":         { name: "성장 루프 설계",      description: "바이럴·사용량·협업·UGC·추천 등 5가지 성장 루프 유형을 분석해 지속 가능한 트랙션 메커니즘 식별" },
  "/gtm-motions":          { name: "GTM 모션 선택",       description: "인바운드·아웃바운드·유료 광고·커뮤니티·파트너·ABM·PLG 7가지 GTM 모션과 최적 채널·도구 선정" },
  "/gtm-strategy":         { name: "GTM 전략 수립",       description: "마케팅 채널·메시지·성공 지표·출시 타임라인을 포함한 제품 출시 전략 수립" },
  "/ideal-customer-profile": { name: "이상적 고객 프로필(ICP)", description: "리서치 데이터에서 인구통계·행동·JTBD·니즈를 기반으로 ICP를 정의" },

  // ── 시장 리서치
  "/competitor-analysis":   { name: "경쟁사 분석",        description: "직접 경쟁사의 강점·약점·차별화 기회를 분석하고 경쟁 지형 맵 작성" },
  "/customer-journey-map":  { name: "고객 여정 맵",        description: "단계·터치포인트·감정·페인 포인트·기회를 포함한 엔드투엔드 고객 여정 맵 작성" },
  "/market-segments":       { name: "시장 세그먼트 탐색",  description: "인구통계·JTBD·제품 적합도 분석으로 3~5개 잠재 고객 세그먼트 식별" },
  "/market-sizing":         { name: "시장 규모 산정",      description: "탑다운·바텀업 방식으로 TAM·SAM·SOM을 산정해 시장 진입 기회 평가" },
  "/sentiment-analysis":    { name: "감정 분석",           description: "사용자 피드백 데이터를 세그먼트별 감정 점수·JTBD·제품 만족도 인사이트로 분석" },
  "/user-personas":         { name: "사용자 페르소나",     description: "리서치 데이터에서 JTBD·페인·게인·예상치 못한 인사이트를 포함한 3개 사용자 페르소나 생성" },
  "/user-segmentation":     { name: "사용자 세그멘테이션", description: "피드백 데이터에서 행동·JTBD·니즈 기반으로 최소 3개 이상 뚜렷한 사용자 세그먼트 도출" },

  // ── 마케팅·성장
  "/marketing-ideas":       { name: "마케팅 아이디어",    description: "채널·메시지·참여 근거를 포함한 5가지 창의적이고 비용 효율적인 마케팅 캠페인 아이디어 생성" },
  "/north-star-metric":     { name: "노스스타 지표 정의",  description: "비즈니스 유형(어텐션·트랜잭션·생산성)을 분류하고 7가지 기준으로 검증된 노스스타 지표와 3~5개 인풋 지표 정의" },
  "/positioning-ideas":     { name: "포지셔닝 아이디어",  description: "경쟁사 대비 차별화된 제품 포지셔닝 아이디어와 포지셔닝 문구·근거 생성" },
  "/product-name":          { name: "제품명 브레인스토밍", description: "브랜드 가치와 타겟 오디언스에 정렬된 기억에 남는 5개 제품명 아이디어와 근거 제시" },
  "/value-prop-statements": { name: "가치 제안 문구 생성", description: "기존 가치 제안에서 마케팅·영업·온보딩용 문구를 다양하게 생성" },

  // ── 제품 디스커버리
  "/analyze-feature-requests":       { name: "기능 요청 분석",          description: "기능 요청 목록을 테마·전략적 정렬·임팩트·노력·리스크 기준으로 분석하고 우선순위화" },
  "/brainstorm-experiments-existing": { name: "기존 제품 실험 설계",     description: "기존 제품의 가정을 검증하는 프로토타입·A/B 테스트·스파이크 등 저비용 실험 방법 설계" },
  "/brainstorm-experiments-new":      { name: "신제품 실험 설계",        description: "린 스타트업 방식의 XYZ 가설과 랜딩페이지·영상·선주문 등 신제품 검증 실험 설계" },
  "/brainstorm-ideas-existing":       { name: "기존 제품 아이디어",      description: "PM·디자이너·엔지니어 관점에서 기존 제품의 신규 기능 아이디어를 멀티 시각으로 브레인스토밍" },
  "/brainstorm-ideas-new":            { name: "신제품 아이디어",         description: "PM·디자이너·엔지니어 3가지 관점에서 새로운 제품의 초기 기능 아이디어 발굴" },
  "/identify-assumptions-existing":   { name: "기존 제품 가정 식별",     description: "기존 제품 기능 아이디어의 가치·사용성·실행 가능성·기술적 타당성 리스크 가정 식별" },
  "/identify-assumptions-new":        { name: "신제품 가정 식별",        description: "GTM·전략·팀 등 8가지 리스크 카테고리로 신제품 아이디어의 위험 가정 식별" },
  "/interview-script":                { name: "인터뷰 스크립트",         description: "The Mom Test 원칙에 따른 JTBD 탐색 질문·워밍업·핵심 탐색·마무리 구조의 고객 인터뷰 스크립트 작성" },
  "/metrics-dashboard":               { name: "지표 대시보드 설계",      description: "핵심 지표·데이터 소스·시각화 유형·알림 임계값을 포함한 제품 지표 대시보드 정의" },
  "/opportunity-solution-tree":       { name: "기회·솔루션 트리",        description: "Teresa Torres의 지속적 디스커버리 방식으로 목표→기회→솔루션→실험을 구조화한 OST 작성" },
  "/prioritize-assumptions":          { name: "가정 우선순위화",         description: "임팩트×리스크 매트릭스로 가정을 우선순위화하고 각 가정에 대한 검증 실험 제안" },
  "/prioritize-features":             { name: "기능 우선순위화",         description: "임팩트·노력·리스크·전략적 정렬 기준으로 기능 백로그를 평가하고 Top 5 권고안 도출" },
  "/summarize-interview":             { name: "인터뷰 요약",             description: "고객 인터뷰 녹취록을 JTBD·만족 신호·액션 아이템이 포함된 구조화된 요약본으로 변환" },

  // ── 제품 전략
  "/ansoff-matrix":       { name: "안소프 매트릭스",      description: "시장 침투·시장 개발·제품 개발·다각화 4가지 축으로 성장 전략 옵션을 매핑해 분석" },
  "/business-model":      { name: "비즈니스 모델 캔버스", description: "9개 구성 요소로 비즈니스가 어떻게 가치를 창출·전달·포착하는지 문서화하는 BMC 작성" },
  "/lean-canvas":         { name: "린 캔버스",            description: "문제·솔루션·지표·비용 구조·UVP·경쟁 우위·채널·세그먼트·수익 모델을 포함한 린 캔버스 생성" },
  "/monetization-strategy": { name: "수익화 전략",         description: "오디언스 적합도·리스크·검증 실험을 포함한 3~5가지 수익 모델 옵션 브레인스토밍" },
  "/pestle-analysis":     { name: "PESTLE 분석",          description: "정치·경제·사회·기술·법률·환경 6가지 거시 환경 요인을 분석해 전략 기획 지원" },
  "/porters-five-forces": { name: "포터의 5가지 힘",      description: "경쟁 강도·공급자 파워·구매자 파워·대체재 위협·신규 진입자 위협으로 산업 구조와 매력도 분석" },
  "/pricing-strategy":    { name: "가격 전략 설계",        description: "가격 모델·경쟁사 가격 분석·지불 의향 추정·가격 탄력성을 분석해 최적 가격 전략 수립" },
  "/product-strategy":    { name: "제품 전략 캔버스",      description: "비전·세그먼트·비용·가치 제안·트레이드오프·지표·성장·역량·방어성을 담은 9개 섹션 제품 전략 수립" },
  "/product-vision":      { name: "제품 비전 수립",        description: "팀을 동기부여하고 이해관계자를 정렬하는 영감을 주는 제품 비전 문구 브레인스토밍" },
  "/startup-canvas":      { name: "스타트업 캔버스",       description: "제품 전략(9개 섹션)과 비즈니스 모델(비용·수익)을 결합한 신제품·스타트업용 통합 캔버스 작성" },
  "/swot-analysis":       { name: "SWOT 분석",             description: "강점·약점·기회·위협을 분석하고 실행 가능한 전략적 권고안 도출" },
  "/value-proposition":   { name: "가치 제안 설계",        description: "누구에게·왜·현재 상태·어떻게·미래 상태·대안을 담은 6파트 JTBD 템플릿으로 가치 제안 문서화" },

  // ── PM 툴킷
  "/draft-nda":      { name: "NDA 초안 작성",          description: "정보 유형·관할권·검토 필요 조항을 포함한 비밀유지계약서(NDA) 초안 작성" },
  "/grammar-check":  { name: "문법·논리 검사",          description: "전체 텍스트를 재작성하지 않고 문법·논리·흐름 오류를 식별하고 표적 수정안 제시" },
  "/privacy-policy": { name: "개인정보처리방침 작성",   description: "데이터 유형·관할권·GDPR 준수 사항·검토 필요 조항이 포함된 개인정보처리방침 초안 작성" },
  "/review-resume":  { name: "이력서 검토",             description: "XYZ+S 공식·키워드 최적화·직무 맞춤화·구조 등 10가지 모범 사례로 PM 이력서 종합 검토 및 개선" },
};

// ── 카테고리 분류 ──────────────────────────────────────────────
// 사용자 편의를 위한 9개 카테고리. 순서대로 렌더링됨.
interface SkillCategory {
  id: string;
  title: string;
  color: string;
  desc: string;
  commands: string[];
}

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "dev",
    title: "개발·코드",
    color: "#6fff00",
    desc: "버그 조사·배포·QA·리뷰 — 개발 워크플로우 핵심",
    commands: [
      "/investigate", "/ship", "/qa", "/review", "/plan-eng-review", "/checkpoint",
      "/code-reviewer", "/senior-frontend", "/bencium-code-conventions",
      "/react-best-practices", "/react-view-transitions", "/composition-patterns",
      "/web-design-guidelines", "/debug-issue", "/explore-codebase",
      "/refactor-safely", "/review-changes",
    ],
  },
  {
    id: "design",
    title: "디자인·UI",
    color: "#a855f7",
    desc: "UI 리팩터링·디자인 시스템·랜딩·감사",
    commands: [
      "/refactoring-ui", "/ui-ux-pro-max",
      "/bencium-innovative-ux-designer", "/bencium-controlled-ux-designer",
      "/bencium-impact-designer", "/design-audit",
    ],
  },
  {
    id: "document",
    title: "문서 생성",
    color: "#3b82f6",
    desc: "PDF·Word·PowerPoint·Excel 변환 출력",
    commands: ["/pdf", "/docx", "/pptx", "/xlsx"],
  },
  {
    id: "pm-execution",
    title: "PM 실행",
    color: "#f59e0b",
    desc: "백로그·스프린트·릴리즈·회고·스토리 작성",
    commands: [
      "/brainstorm-okrs", "/create-prd", "/dummy-dataset", "/job-stories",
      "/outcome-roadmap", "/pre-mortem", "/prioritization-frameworks", "/release-notes",
      "/retro", "/sprint-plan", "/stakeholder-map", "/summarize-meeting",
      "/test-scenarios", "/user-stories", "/wwas",
    ],
  },
  {
    id: "pm-data",
    title: "PM 데이터·분석",
    color: "#ec4899",
    desc: "A/B 테스트·코호트·SQL 쿼리 분석",
    commands: ["/ab-test-analysis", "/cohort-analysis", "/sql-queries"],
  },
  {
    id: "discovery",
    title: "제품 디스커버리",
    color: "#06b6d4",
    desc: "가정 식별·실험 설계·기회 트리·인터뷰",
    commands: [
      "/analyze-feature-requests",
      "/brainstorm-experiments-existing", "/brainstorm-experiments-new",
      "/brainstorm-ideas-existing", "/brainstorm-ideas-new",
      "/identify-assumptions-existing", "/identify-assumptions-new",
      "/interview-script", "/metrics-dashboard", "/opportunity-solution-tree",
      "/prioritize-assumptions", "/prioritize-features", "/summarize-interview",
    ],
  },
  {
    id: "market",
    title: "시장·GTM",
    color: "#10b981",
    desc: "시장 진출 전략·경쟁 분석·리서치·마케팅",
    commands: [
      "/beachhead-segment", "/competitive-battlecard", "/growth-loops",
      "/gtm-motions", "/gtm-strategy", "/ideal-customer-profile",
      "/competitor-analysis", "/customer-journey-map", "/market-segments",
      "/market-sizing", "/sentiment-analysis", "/user-personas", "/user-segmentation",
      "/marketing-ideas", "/north-star-metric", "/positioning-ideas",
      "/product-name", "/value-prop-statements",
    ],
  },
  {
    id: "strategy",
    title: "제품 전략",
    color: "#f97316",
    desc: "BMC·린 캔버스·SWOT·가격·비전 수립",
    commands: [
      "/ansoff-matrix", "/business-model", "/lean-canvas", "/monetization-strategy",
      "/pestle-analysis", "/porters-five-forces", "/pricing-strategy",
      "/product-strategy", "/product-vision", "/startup-canvas",
      "/swot-analysis", "/value-proposition",
    ],
  },
  {
    id: "toolkit",
    title: "툴킷·기타",
    color: "#94a3b8",
    desc: "문서 검토·법무·문법·Obsidian 연동",
    commands: ["/draft-nda", "/grammar-check", "/privacy-policy", "/review-resume", "/obsidian"],
  },
];

// ── 수동 보강 데이터 (기존 스킬 상세 설명) ────────────────────
// 파일시스템에서 자동 감지된 스킬에 추가 상세 정보를 덧붙임.
// 새 스킬은 여기 추가하지 않아도 자동으로 카드가 생성됨.
interface ManualDetail {
  triggers?: string[];
  outputs?: string[];
  examplePrompts?: string[];
  note?: string;
}

const MANUAL_DETAILS: Record<string, ManualDetail> = {
  "/investigate": {
    triggers: [
      '"왜 안 되지", "에러 원인이 뭐야", "버그 찾아줘"',
      "예상과 다르게 동작하는 UI/로직",
      "빌드 에러, 런타임 에러, 타입 에러",
      "같은 버그가 재발하거나 원인 불명일 때",
    ],
    outputs: ["git diff/log 기반 원인 분류", "단일 가설 → 단일 테스트로 특정", "수정 코드 + 재발 방지 설명"],
    examplePrompts: ['"로그인 후 /member 리다이렉트가 안 돼"', '"결제 페이지에서 흰 화면만 나와"'],
    note: "gstack 스킬. 3회 이상 같은 에러가 반복되면 반드시 이 스킬 먼저 호출.",
  },
  "/ship": {
    triggers: ['"배포해줘", "PR 만들어줘", "push해줘"', "기능 완성 후 메인 브랜치 합치기"],
    outputs: ["git commit + PR 생성 (GitHub)", "배포 환경별 build/deploy 실행", "배포 결과 URL"],
    examplePrompts: ['"오늘 작업 PR 만들어줘"', '"Vercel에 배포해줘"'],
    note: "gstack 스킬.",
  },
  "/qa": {
    triggers: ['"QA해줘", "사이트 테스트해줘"', "기능 완료 후 배포 전 검증"],
    outputs: ["라우트별 통과/실패 체크리스트", "버그 목록 + 심각도 분류"],
    examplePrompts: ['"랜딩 9개 페이지 전부 QA해줘"', '"결제 플로우 테스트해줘"'],
    note: "gstack 스킬.",
  },
  "/review": {
    triggers: ['"코드 리뷰해줘", "이 코드 괜찮아?"', "PR 머지 전 코드 품질 확인"],
    outputs: ["변경 파일별 리뷰 코멘트", "보안 취약점 / 컨벤션 위반 분류", "개선 제안 스니펫"],
    examplePrompts: ['"오늘 수정한 파일들 코드 리뷰해줘"'],
    note: "gstack 스킬.",
  },
  "/plan-eng-review": {
    triggers: ['"이 구조 괜찮아?", "어떻게 설계할까?"', "200줄 이상 작업 전 구조 확인"],
    outputs: ["현재 설계 문제점 + trade-off 분석", "권장 구조 + 이유", "LOCKED_DECISIONS 후보 요약"],
    examplePrompts: ['"골드파트너 월결제 어떻게 추가할까?"', '"추천 링크 트래킹 아키텍처 리뷰해줘"'],
    note: "gstack 스킬. 큰 작업 전 반드시 실행.",
  },
  "/checkpoint": {
    triggers: ['"저장해줘", "체크포인트 만들어줘"', "세션 전환 전 현재 상태 기록"],
    outputs: ["SESSION_START.md 업데이트", "다음 세션 이어받기용 컨텍스트"],
    examplePrompts: ['"오늘 작업 체크포인트 저장해줘"'],
    note: "gstack 스킬.",
  },
  "/refactoring-ui": {
    triggers: ["UI 컴포넌트 신규 제작·스타일링", '"더 예쁘게", "디자인 개선", "레이아웃 고쳐줘"', "폼·대시보드·카드·테이블 UI 작업"],
    outputs: ["계층·간격·색상·타이포 개선 코드", "리팩토링 전/후 비교 설명"],
    examplePrompts: ['"LdPricingSection 카드 디자인 개선해줘"', '"FAQ 아코디언 스타일 리팩터링해줘"'],
    note: "Steve Schoger Refactoring UI 원칙 기반.",
  },
  "/ui-ux-pro-max": {
    triggers: ["디자인 시스템·토큰 체계 신규 생성", "랜딩페이지 전체 방향 결정"],
    outputs: ["산업별 색상/타이포/레이아웃 시스템 권장안", "CSS 토큰 초안"],
    examplePrompts: ['"시니어 교육 플랫폼 디자인 시스템 만들어줘"'],
  },
  "/bencium-innovative-ux-designer": {
    triggers: ["랜딩·캠페인 페이지 신규 변형 제작", '"임팩트 있게", "기억에 남게", "독특하게"', "히어로 섹션, 인터랙티브 섹션"],
    outputs: ["Brutalist·Editorial 등 극단적 미학 방향", "완전한 컴포넌트 코드 (인터랙션 포함)", "모션 스펙 + 반응형 레이아웃"],
    examplePrompts: ['"landing3 신규 변형 — 강렬한 인상 남겨야 해"', '"시니어들이 감탄할 랜딩 만들어줘"'],
    note: "코딩 전 반드시 톤·방향 질문 먼저. innovative vs controlled 구분 중요.",
  },
  "/bencium-controlled-ux-designer": {
    triggers: ["결제(checkout)·회원(member)·파트너(partner) 페이지", "WCAG 2.1 AA 준수 폼·대시보드", '"신뢰감 있게", "안정적으로", "전문적으로"'],
    outputs: ["ARIA 속성 포함 접근성 컴포넌트", "색상 대비비 4.5:1 이상 팔레트", "키보드 탐색·스크린리더 지원"],
    examplePrompts: ['"결제 폼 접근성 개선해줘"', '"partner 수당 대시보드 신뢰감 있게 설계해줘"'],
    note: "innovative와 반대. 창의성보다 안전·신뢰·일관성 우선.",
  },
  "/bencium-impact-designer": {
    triggers: ['"AI 느낌 나지 않게", "진짜 제품처럼", "고급스럽게"', "프로덕션 품질이 필요한 핵심 UI 섹션"],
    outputs: ["세밀한 shadow/spacing/micro-interaction", "generic 패턴 탈피 설계 결정 근거", "Liquid Glass 프리미엄 강화 코드"],
    examplePrompts: ['"LdHeroSection 프로덕션 품질로 올려줘"', '"증거 섹션 AI 냄새 없이 고급지게"'],
    note: "innovative와 비슷하지만 완성도·세련미 집중.",
  },
  "/design-audit": {
    triggers: ['"이 화면 어때?", "UI 검토해줘", "개선할 게 뭐야?"', "기존 페이지 전반 품질 점검"],
    outputs: ["Critical/Major/Minor 우선순위 감사 리포트", "즉시 수정 vs 장기 개선 로드맵"],
    examplePrompts: ['"landing1 전체 화면 감사해줘"', '"홈페이지 어디 먼저 개선할까?"'],
    note: "수정 제안 전 감사 리포트만 먼저 출력.",
  },
  "/bencium-code-conventions": {
    triggers: ['"컨벤션 맞아?", "코드 스타일 확인해줘"', "PR 전 코드 스타일 자동 정리", "TypeScript 타입·컴포넌트 구조 표준화"],
    outputs: ["컨벤션 위반 항목 목록 (파일·라인)", "자동 수정 코드 패치", "V2 LD 체계 준수 여부 체크"],
    examplePrompts: ['"오늘 만든 컴포넌트 컨벤션 점검해줘"', '"useSession 훅 코드 스타일 맞아?"'],
    note: "V2 LOCKED_DECISIONS 준수 여부도 함께 체크.",
  },

  // ── 개발·코드 (신규)
  "/code-reviewer": {
    triggers: ["TypeScript·React·Next.js·Python PR 파일 리뷰", "배포 전 코드 품질 검증", "보안 취약점·성능 병목 탐지"],
    outputs: ["파일별 코드 리뷰 코멘트", "보안 취약점 목록 (심각도 분류)", "성능 개선 제안 스니펫"],
    examplePrompts: ['"오늘 추가한 auth 관련 파일 전체 리뷰해줘"', '"이 컴포넌트 보안 이슈 있어?"'],
  },
  "/senior-frontend": {
    triggers: ["React·Next.js 15 컴포넌트 새로 만들 때", "번들 크기 분석이 필요할 때", "프로젝트 구조·아키텍처 개선"],
    outputs: ["프로덕션 수준의 컴포넌트 코드", "번들 최적화 제안", "아키텍처 권고 및 구조 개선안"],
    examplePrompts: ['"usePaymentForm 훅 시니어 수준으로 만들어줘"', '"이 컴포넌트 Next.js 15 모범 사례로 리팩터링해줘"'],
  },
  "/react-best-practices": {
    triggers: ["서버/클라이언트 컴포넌트 구분이 헷갈릴 때", '"use client" 배치 고민', "직렬화 오류 발생"],
    outputs: ["서버/클라이언트 분리 권장안", "직렬화 규칙 체크리스트", "리팩터링 코드"],
    examplePrompts: ['"이 컴포넌트 서버 컴포넌트로 바꿀 수 있어?"', '"prop 직렬화 오류 왜 나?"'],
  },
  "/react-view-transitions": {
    triggers: ["페이지 전환 애니메이션 추가", "View Transitions API 구현", "SPA 느낌의 부드러운 라우팅 효과"],
    outputs: ["View Transitions API 적용 코드", "부드러운 페이지 전환 구현 (애니메이션 포함)"],
    examplePrompts: ['"랜딩페이지 전환 애니메이션 추가해줘"', '"View Transitions API로 슬라이드 효과 만들어줘"'],
  },
  "/composition-patterns": {
    triggers: ["컴포넌트 재사용성이 낮을 때", "상태가 불필요하게 위에 있을 때", "복잡한 컴포넌트 구조 분리"],
    outputs: ["Compound Component·Render Props·Custom Hook 패턴 적용 코드", "상태 리프팅 없이 공유하는 구조"],
    examplePrompts: ['"이 거대한 컴포넌트 어떻게 나눠?"', '"상태 리프팅 없이 공유하는 방법 없어?"'],
  },
  "/web-design-guidelines": {
    triggers: ["접근성 기준 확인", "색상 대비·여백·타이포 표준 검토", "WCAG 준수 여부 점검"],
    outputs: ["WCAG 기준 준수 여부 체크리스트", "디자인 표준 개선안"],
    examplePrompts: ['"이 버튼 색상 접근성 기준 통과해?"', '"폼 여백 표준 알려줘"'],
  },
  "/debug-issue": {
    triggers: ["에러 메시지 해석·단계별 분석", "원인 불명 이슈 추적", "특정 이슈를 단계적으로 파고들 때"],
    outputs: ["단계별 디버깅 결과", "근본 원인 분류", "해결 코드"],
    examplePrompts: ['"TypeError: Cannot read properties of undefined 이 에러 왜 나?"', '"콘솔 에러 해석해줘"'],
  },
  "/explore-codebase": {
    triggers: ["낯선 코드베이스 파악이 필요할 때", "특정 기능이 어디 있는지 모를 때", "신규 합류 시 프로젝트 온보딩"],
    outputs: ["프로젝트 구조 요약", "핵심 파일 목록", "데이터 흐름 설명"],
    examplePrompts: ['"결제 플로우가 어떻게 돌아가는지 설명해줘"', '"인증 관련 코드 어디 있어?"'],
  },
  "/refactor-safely": {
    triggers: ["동작 변경 없이 코드 구조를 개선할 때", "기술 부채 해소", "리팩터링 범위를 안전하게 잡고 싶을 때"],
    outputs: ["단계별 리팩터링 계획", "안전한 변경 범위 명세", "리팩터링 코드"],
    examplePrompts: ['"이 함수 로직은 그대로고 구조만 개선해줘"', '"중복 코드 줄이고 싶은데 기능은 유지해야 해"'],
  },
  "/review-changes": {
    triggers: ["최근 커밋·git diff 검토", "의도치 않은 변경 확인", "머지 전 최종 점검"],
    outputs: ["변경 파일 목록 + 변경 요약", "잠재적 문제 식별", "누락된 변경 체크"],
    examplePrompts: ['"오늘 수정한 내용 전체 리뷰해줘"', '"이 diff에서 문제될 부분 있어?"'],
  },

  // ── 문서 생성
  "/pdf": {
    triggers: ["마크다운·HTML을 PDF로 저장", "인쇄용 문서 출력", "공식 문서 배포"],
    outputs: ["스타일드 레이아웃 포함 PDF 파일"],
    examplePrompts: ['"이 사업계획서 PDF로 내보내줘"', '"랜딩 내용 PDF 문서로 만들어줘"'],
  },
  "/docx": {
    triggers: ["Word 형식 문서 제출", "협업자에게 편집 가능한 문서 전달"],
    outputs: [".docx 파일 (스타일 포함)"],
    examplePrompts: ['"계약서 초안 Word 파일로 만들어줘"', '"이 내용 DOCX로 내보내줘"'],
  },
  "/pptx": {
    triggers: ["프레젠테이션 제출", "투자자 덱", "교육 자료"],
    outputs: [".pptx 파일 (슬라이드 레이아웃 포함)"],
    examplePrompts: ['"이 전략 문서 PPT 슬라이드로 만들어줘"', '"투자자 덱 PPTX로 내보내줘"'],
  },
  "/xlsx": {
    triggers: ["데이터 정리·표·스프레드시트 필요", "팀 공유용 데이터 파일"],
    outputs: [".xlsx 파일 (셀 포맷 포함)"],
    examplePrompts: ['"스프린트 백로그 엑셀로 만들어줘"', '"이 분석 결과 XLSX로 내보내줘"'],
  },

  // ── PM 실행
  "/brainstorm-okrs": {
    triggers: ["분기 시작 시 팀 목표 설정", "회사 전략과 팀 OKR 정렬"],
    outputs: ["정성적 Objective 3개 + Objective당 측정 가능한 Key Results 3개"],
    examplePrompts: ['"2분기 프로덕트팀 OKR — 목표 유저 리텐션 개선"', '"성장팀 OKR 브레인스토밍해줘"'],
  },
  "/create-prd": {
    triggers: ["신규 기능 개발 시작 전", "이해관계자 정렬이 필요할 때", "기능 범위 명확히 해야 할 때"],
    outputs: ["문제·목표·세그먼트·가치 제안·솔루션·성공 지표·출시 계획 포함 8섹션 PRD"],
    examplePrompts: ['"결제 구독 기능 PRD 작성해줘"', '"파트너 대시보드 PRD 만들어줘"'],
  },
  "/dummy-dataset": {
    triggers: ["개발·테스트용 가짜 데이터 필요", "디자인 프로토타입에 사실적인 데이터 삽입"],
    outputs: ["CSV·JSON·SQL 형식의 커스터마이징된 테스트 데이터"],
    examplePrompts: ['"users 테이블 기반 50명 더미 데이터 CSV로 만들어줘"', '"결제 내역 더미 JSON 100건 만들어줘"'],
  },
  "/job-stories": {
    triggers: ["유저 스토리가 너무 추상적일 때", "사용 맥락 중심 요구사항 작성"],
    outputs: ["'상황~하고 싶다~할 수 있다' 형식의 잡 스토리 + 인수 기준"],
    examplePrompts: ['"파트너 수당 확인 기능 잡 스토리 써줘"', '"모바일 알림 잡 스토리 작성해줘"'],
  },
  "/outcome-roadmap": {
    triggers: ["기능 중심 로드맵을 임팩트 중심으로 재구성할 때", "로드맵에 전략적 Why가 없을 때"],
    outputs: ["아웃컴 중심 분기별 로드맵 (비즈니스·사용자 임팩트 포함)"],
    examplePrompts: ['"우리 로드맵 아웃컴 기반으로 다시 정리해줘"', '"기능 로드맵을 왜 만드는지 중심으로 재구성해줘"'],
  },
  "/pre-mortem": {
    triggers: ["출시 전 리스크 평가", "팀이 낙관적일 때 현실적 시각 추가"],
    outputs: ["Tigers·Paper Tigers·Elephants 분류 리스크 목록 + 출시 차단·빠른 후속·모니터링 전략"],
    examplePrompts: ['"파트너 모집 캠페인 출시 전 프리모텀 해줘"', '"새 결제 기능 출시 리스크 뭐야?"'],
  },
  "/prioritization-frameworks": {
    triggers: ["백로그 우선순위를 정할 때", "여러 기능 중 무엇을 먼저 할지 결정"],
    outputs: ["RICE·ICE·Kano·MoSCoW 등 9개 방법론 설명 + 적합 상황"],
    examplePrompts: ['"우리 상황에 어떤 우선순위 프레임워크가 맞아?"', '"RICE vs ICE 차이 설명해줘"'],
  },
  "/release-notes": {
    triggers: ["배포 후 사용자 커뮤니케이션", "변경 이력 문서화"],
    outputs: ["신기능·개선·버그수정 카테고리로 정리된 릴리즈 노트"],
    examplePrompts: ['"이번 스프린트 배포 내용으로 릴리즈 노트 써줘"', '"v1.2.0 릴리즈 노트 만들어줘"'],
  },
  "/retro": {
    triggers: ["스프린트 종료 시 팀 성과·개선점 정리", "회고 미팅 전 준비"],
    outputs: ["잘된 점·개선점·액션 아이템(담당자+기한) 구조화된 회고록"],
    examplePrompts: ['"지난 2주 스프린트 회고 정리해줘"', '"우리 팀 회고 문서 만들어줘"'],
    note: "gstack 스킬.",
  },
  "/sprint-plan": {
    triggers: ["스프린트 시작 전 팀 용량 산정과 백로그 선정"],
    outputs: ["용량 산정·스토리포인트 배분·의존성 맵·리스크 식별 포함 스프린트 계획"],
    examplePrompts: ['"다음 2주 스프린트 계획 짜줘 — 팀 4명, 각 70% 용량"', '"이 백로그에서 스프린트에 뭘 넣을지 골라줘"'],
  },
  "/stakeholder-map": {
    triggers: ["신규 프로젝트 시작 시 이해관계자 파악", "소통 전략 수립"],
    outputs: ["파워/관심도 그리드 + 분면별 소통 전략 + 커뮤니케이션 계획"],
    examplePrompts: ['"새 유료화 기능의 이해관계자 맵 만들어줘"', '"이 프로젝트 관련된 사람들 정리해줘"'],
  },
  "/summarize-meeting": {
    triggers: ["미팅 후 회의록 정리", "결정 사항·액션 아이템 문서화"],
    outputs: ["날짜·참석자·핵심 결정·요약·액션 아이템 포함 회의록"],
    examplePrompts: ['"이 회의 녹취 요약해줘"', '"오늘 기획 미팅 회의록 만들어줘"'],
  },
  "/test-scenarios": {
    triggers: ["QA 시나리오 문서화", "유저 스토리 기반 테스트 케이스 작성"],
    outputs: ["테스트 목표·조건·단계·예상 결과 포함 QA 시나리오"],
    examplePrompts: ['"결제 완료 플로우 테스트 시나리오 써줘"', '"파트너 가입 QA 케이스 만들어줘"'],
  },
  "/user-stories": {
    triggers: ["개발팀에 요구사항 전달", "기능 범위를 명확히 할 때"],
    outputs: ["INVEST 기준 유저 스토리 + 인수 기준"],
    examplePrompts: ['"파트너 수당 조회 유저 스토리 써줘"', '"로그인 기능 유저 스토리 만들어줘"'],
  },
  "/wwas": {
    triggers: ["전략적 맥락이 담긴 백로그 항목 작성", "Why가 명확한 작업 카드 필요"],
    outputs: ["Why·What·Acceptance 형식의 백로그 항목"],
    examplePrompts: ['"추천인 링크 클릭 트래킹 WWA 백로그 항목 써줘"', '"이 기능 왜 만드는지 포함한 작업 카드 작성해줘"'],
  },

  // ── PM 데이터·분석
  "/ab-test-analysis": {
    triggers: ["A/B 테스트 결과 해석", "출시·연장·중단 결정"],
    outputs: ["통계적 유의성·신뢰구간·표본 크기 분석", "출시 권고 (Go/No-Go/Extend)"],
    examplePrompts: ['"CTA 버튼 A/B 테스트 (대조군 CTR 2.3%, 실험군 2.8%, n=5000) 분석해줘"', '"이 테스트 결과 출시해도 돼?"'],
  },
  "/cohort-analysis": {
    triggers: ["신규 기능 이후 리텐션 변화 추적", "가입 월별 사용자 행동 패턴 분석"],
    outputs: ["코호트별 리텐션 곡선", "기능 채택 추이", "이탈 구간 식별"],
    examplePrompts: ['"1월 가입자 vs 3월 가입자 리텐션 비교해줘"', '"신규 대시보드 출시 전후 코호트 분석해줘"'],
  },
  "/sql-queries": {
    triggers: ["데이터 분석을 위한 SQL 작성", "자연어로 데이터 질문"],
    outputs: ["방언별(PostgreSQL·BigQuery·MySQL) SQL 쿼리 + 설명"],
    examplePrompts: ['"지난 30일 파트너별 추천 건수 상위 10명 뽑아줘 — PostgreSQL"', '"이 스키마로 MAU 쿼리 써줘"'],
  },

  // ── 제품 디스커버리
  "/analyze-feature-requests": {
    triggers: ["사용자 피드백·지원 티켓에서 기능 패턴 파악", "로드맵 우선순위 결정"],
    outputs: ["테마 분류·전략 정렬도·임팩트·노력·리스크 평가된 기능 요청 분석표"],
    examplePrompts: ['"지난 분기 사용자 피드백 기능 요청 분석해줘"', '"이 지원 티켓 목록에서 패턴 뽑아줘"'],
  },
  "/brainstorm-experiments-existing": {
    triggers: ["가정 검증을 위한 저비용 실험 기획", "빌드 전에 확인하고 싶을 때"],
    outputs: ["프로토타입·A/B 테스트·스파이크 등 검증 실험 설계"],
    examplePrompts: ['"파트너 추천 리워드 증가 가정 실험 설계해줘"', '"이 가정을 1주일 안에 검증하는 방법은?"'],
  },
  "/brainstorm-experiments-new": {
    triggers: ["린 스타트업 방식 신제품 아이디어 검증", "빌드 전 시장 반응 확인"],
    outputs: ["랜딩페이지·영상·선주문 등 XYZ 가설 기반 신제품 검증 실험"],
    examplePrompts: ['"AI 홈페이지 생성 서비스 아이디어 검증 실험 설계해줘"', '"이 신제품 가정 어떻게 검증해?"'],
  },
  "/brainstorm-ideas-existing": {
    triggers: ["기존 제품의 성장 정체 타개", "신규 기능 아이디어 발굴"],
    outputs: ["PM·디자이너·엔지니어 3가지 관점의 신규 기능 아이디어"],
    examplePrompts: ['"LinkDrop 파트너 대시보드 개선 아이디어 브레인스토밍해줘"', '"리텐션 높이는 기능 아이디어 뭐가 있어?"'],
  },
  "/brainstorm-ideas-new": {
    triggers: ["새 프로덕트 라인 발굴", "멀티 시각 초기 기능 아이디어 발굴"],
    outputs: ["PM·디자이너·엔지니어 3가지 관점의 초기 기능 아이디어 목록"],
    examplePrompts: ['"시니어 디지털 교육 플랫폼 아이디어 브레인스토밍해줘"', '"교육 SaaS 신제품 기능 아이디어 발굴해줘"'],
  },
  "/identify-assumptions-existing": {
    triggers: ["기존 기능 아이디어의 리스크 파악", "개발 전 가정 명확히 할 때"],
    outputs: ["가치·사용성·실행 가능성·기술 리스크 가정 목록"],
    examplePrompts: ['"파트너 자동 수당 지급 기능의 위험 가정 뭐야?"', '"이 아이디어 무엇을 믿어야 동작해?"'],
  },
  "/identify-assumptions-new": {
    triggers: ["신제품·신사업 아이디어의 위험 가정 파악"],
    outputs: ["GTM·전략·팀 등 8가지 리스크 카테고리별 가정 목록"],
    examplePrompts: ['"B2B SaaS 세금 자동화 신제품의 위험 가정 식별해줘"', '"이 아이디어 어떤 게 틀릴 수 있어?"'],
  },
  "/interview-script": {
    triggers: ["고객 발견 인터뷰 준비", "The Mom Test 원칙 기반 질문 설계"],
    outputs: ["워밍업·JTBD 탐색·핵심 질문·마무리 구조의 인터뷰 스크립트"],
    examplePrompts: ['"왜 파트너 등록을 안 하는지 인터뷰 스크립트 써줘"', '"시니어 타겟 고객 발견 인터뷰 준비해줘"'],
  },
  "/metrics-dashboard": {
    triggers: ["제품 지표를 체계적으로 추적할 때", "대시보드 신규 설계"],
    outputs: ["핵심 지표·데이터 소스·시각화 유형·알림 임계값 포함 대시보드 정의"],
    examplePrompts: ['"파트너 성장 지표 대시보드 설계해줘"', '"사용자 리텐션 대시보드 어떻게 만들어?"'],
  },
  "/opportunity-solution-tree": {
    triggers: ["디스커버리를 구조화할 때", "Teresa Torres 방식 OST 작성"],
    outputs: ["목표→기회→솔루션→실험 계층 구조의 OST"],
    examplePrompts: ['"파트너 수 증가 목표 OST 만들어줘"', '"이 OKR을 OST로 펼쳐줘"'],
  },
  "/prioritize-assumptions": {
    triggers: ["여러 가정 중 어떤 것을 먼저 검증할지 결정"],
    outputs: ["임팩트×리스크 매트릭스 + 검증 실험 우선순위"],
    examplePrompts: ['"이 가정 목록 중 어떤 걸 먼저 검증해야 해?"', '"리스크 높은 가정 먼저 정렬해줘"'],
  },
  "/prioritize-features": {
    triggers: ["백로그에서 다음 스프린트에 넣을 기능 선정"],
    outputs: ["임팩트·노력·리스크·전략 정렬 기준 기능 우선순위 + Top 5 권고"],
    examplePrompts: ['"이 기능 목록 우선순위 정해줘"', '"다음 분기에 뭘 먼저 만들어야 해?"'],
  },
  "/summarize-interview": {
    triggers: ["고객 인터뷰 후 핵심 인사이트 정리"],
    outputs: ["JTBD·만족 신호·불만·액션 아이템 포함 구조화된 인터뷰 요약"],
    examplePrompts: ['"이 인터뷰 녹취록 요약해줘"', '"고객 인터뷰에서 핵심 인사이트 뽑아줘"'],
  },

  // ── 시장·GTM
  "/beachhead-segment": {
    triggers: ["첫 진입 시장 선택", "여러 세그먼트 중 어디서 시작할지 결정"],
    outputs: ["세그먼트별 평가 스코어카드 + 권장 교두보 시장 + 근거"],
    examplePrompts: ['"LinkDrop 교두보 세그먼트 어디가 좋아?"', '"이 4개 세그먼트 중 어디서 시작해야 해?"'],
  },
  "/competitive-battlecard": {
    triggers: ["영업·마케팅 자료 준비", "경쟁사 대비 포지셔닝 명확히 할 때"],
    outputs: ["포지셔닝·기능 비교·이의 처리·승패 패턴 포함 배틀카드"],
    examplePrompts: ['"링크트리 vs LinkDrop 배틀카드 써줘"', '"클래스101 대비 우리 강점 정리해줘"'],
  },
  "/growth-loops": {
    triggers: ["지속 가능한 성장 메커니즘 설계", "바이럴·추천 루프 구조화"],
    outputs: ["바이럴·사용량·협업·UGC·추천 루프 유형별 분석 + 권장 루프"],
    examplePrompts: ['"LinkDrop에 맞는 성장 루프 설계해줘"', '"추천인 바이럴 루프 어떻게 만들어?"'],
  },
  "/gtm-motions": {
    triggers: ["제품 출시 채널 전략 결정", "PLG vs SLG 선택"],
    outputs: ["7가지 GTM 모션 평가 + 현재 단계에 맞는 최적 모션 + 채널·도구"],
    examplePrompts: ['"LinkDrop에 맞는 GTM 모션 뭐야?"', '"PLG로 가야 해, SLG로 가야 해?"'],
  },
  "/gtm-strategy": {
    triggers: ["신규 기능·제품 출시 전 전략 수립"],
    outputs: ["마케팅 채널·메시지·성공 지표·출시 타임라인 포함 GTM 전략 문서"],
    examplePrompts: ['"골드파트너 승급 기능 GTM 전략 만들어줘"', '"이번 분기 파트너 모집 GTM 전략 짜줘"'],
  },
  "/ideal-customer-profile": {
    triggers: ["타겟 고객 명확화", "세일즈·마케팅 메시지 정렬"],
    outputs: ["인구통계·행동·JTBD·니즈 기반 ICP 정의"],
    examplePrompts: ['"LinkDrop 파트너 ICP 정의해줘"', '"우리 최적 고객이 누구야?"'],
  },
  "/competitor-analysis": {
    triggers: ["시장 진입 전 경쟁 지형 파악", "차별화 기회 발굴"],
    outputs: ["직접 경쟁사 강점·약점·차별화 기회 + 경쟁 지형 맵"],
    examplePrompts: ['"교육 링크인바이오 시장 경쟁사 분석해줘"', '"링크트리·스타터 vs LinkDrop 비교해줘"'],
  },
  "/customer-journey-map": {
    triggers: ["사용자 경험 전체 파악", "이탈 지점·페인 포인트 발굴"],
    outputs: ["단계·터치포인트·감정·페인 포인트·기회 포함 엔드투엔드 여정 맵"],
    examplePrompts: ['"신규 파트너 가입 ~ 첫 수당 여정 맵 만들어줘"', '"고객 온보딩 경험 맵 그려줘"'],
  },
  "/market-segments": {
    triggers: ["타겟 시장을 세분화할 때", "새로운 세그먼트 발굴"],
    outputs: ["3~5개 잠재 고객 세그먼트 (인구통계·JTBD·적합도 포함)"],
    examplePrompts: ['"교육 플랫폼 시장 세그먼트 뭐가 있어?"', '"50대 타겟 세그먼트 더 세분화해줘"'],
  },
  "/market-sizing": {
    triggers: ["시장 기회 규모 파악", "투자자 피칭 자료 준비"],
    outputs: ["TAM·SAM·SOM 탑다운·바텀업 방식 산정"],
    examplePrompts: ['"한국 중장년 디지털 교육 시장 TAM 산정해줘"', '"우리 SOM이 얼마나 돼?"'],
  },
  "/sentiment-analysis": {
    triggers: ["사용자 리뷰·피드백 데이터 분석", "제품 만족도 파악"],
    outputs: ["세그먼트별 감정 점수·JTBD·제품 만족도 인사이트"],
    examplePrompts: ['"이 앱스토어 리뷰 감정 분석해줘"', '"사용자 피드백에서 긍/부정 패턴 뽑아줘"'],
  },
  "/user-personas": {
    triggers: ["제품 설계·마케팅 메시지 정렬", "팀 공통 사용자 이해"],
    outputs: ["JTBD·페인·게인·예상치 못한 인사이트 포함 3개 페르소나"],
    examplePrompts: ['"LinkDrop 파트너 3가지 페르소나 만들어줘"', '"시니어 사용자 페르소나 생성해줘"'],
  },
  "/user-segmentation": {
    triggers: ["사용자 그룹별 행동 패턴 이해", "타겟팅 기반 마케팅 준비"],
    outputs: ["최소 3개 뚜렷한 사용자 세그먼트 (행동·JTBD·니즈 기반)"],
    examplePrompts: ['"우리 파트너 회원 세그먼트 나눠줘"', '"활성/비활성 사용자 세그멘테이션해줘"'],
  },
  "/marketing-ideas": {
    triggers: ["예산 제한 속 창의적 캠페인 아이디어 발굴"],
    outputs: ["채널·메시지·참여 근거 포함 5가지 마케팅 캠페인 아이디어"],
    examplePrompts: ['"파트너 모집 마케팅 아이디어 5개 줘"', '"저예산 SNS 바이럴 캠페인 아이디어 줘"'],
  },
  "/north-star-metric": {
    triggers: ["팀 전체가 집중할 단일 지표 정의", "OKR 수립 전 북극성 설정"],
    outputs: ["비즈니스 유형 분류 + 검증된 노스스타 지표 + 3~5개 인풋 지표"],
    examplePrompts: ['"LinkDrop 노스스타 지표 정의해줘"', '"우리 팀이 집중해야 할 핵심 지표 하나 뭐야?"'],
  },
  "/positioning-ideas": {
    triggers: ["경쟁사 대비 차별화된 포지셔닝 필요", "브랜드 메시지 방향 결정"],
    outputs: ["3~5가지 포지셔닝 아이디어 + 각 문구 + 타겟 세그먼트"],
    examplePrompts: ['"링크트리 대비 LinkDrop 차별화 포지셔닝 아이디어 줘"', '"시니어 타겟 포지셔닝 어떻게 할까?"'],
  },
  "/product-name": {
    triggers: ["신규 제품·기능·캠페인 이름 결정"],
    outputs: ["기억에 남는 5개 이름 아이디어 + 브랜드 가치 정렬 근거"],
    examplePrompts: ['"파트너 등급 업그레이드 기능 이름 아이디어 줘"', '"새 멤버십 프로그램 이름 뭐가 좋아?"'],
  },
  "/value-prop-statements": {
    triggers: ["마케팅 카피 작성", "랜딩페이지·이메일·세일즈 자료 문구 필요"],
    outputs: ["마케팅·영업·온보딩용 다양한 가치 제안 문구"],
    examplePrompts: ['"LinkDrop 파트너십 가치 제안 문구 5개 써줘"', '"시니어 타겟 마케팅 카피 만들어줘"'],
  },

  // ── 제품 전략
  "/ansoff-matrix": {
    triggers: ["성장 전략 옵션 탐색", "신시장/신제품 방향 결정"],
    outputs: ["시장침투·시장개발·제품개발·다각화 4가지 전략 옵션 매핑"],
    examplePrompts: ['"LinkDrop 성장 전략 안소프 매트릭스로 분석해줘"', '"신시장 진출 전략 뭐가 있어?"'],
  },
  "/business-model": {
    triggers: ["비즈니스 모델 전체 문서화", "투자자·파트너에게 비즈니스 설명"],
    outputs: ["9개 구성 요소(고객·채널·관계·수익·자원·활동·파트너·비용·가치 제안) BMC"],
    examplePrompts: ['"LinkDrop 비즈니스 모델 캔버스 만들어줘"', '"우리 수익 구조 BMC로 정리해줘"'],
  },
  "/lean-canvas": {
    triggers: ["스타트업·신제품 아이디어 빠른 문서화", "투자자 커뮤니케이션"],
    outputs: ["문제·솔루션·UVP·경쟁 우위·채널·세그먼트·수익 모델·비용 구조 린 캔버스"],
    examplePrompts: ['"LinkDrop V2 린 캔버스 만들어줘"', '"새 웹소설 기능 린 캔버스로 정리해줘"'],
  },
  "/monetization-strategy": {
    triggers: ["수익 모델 다각화", "새로운 수익원 탐색"],
    outputs: ["3~5가지 수익 모델 옵션 + 오디언스 적합도·리스크·검증 실험"],
    examplePrompts: ['"LinkDrop 추가 수익화 전략 브레인스토밍해줘"', '"프리미엄 기능 가격 모델 어떻게 설계할까?"'],
  },
  "/pestle-analysis": {
    triggers: ["거시 환경 리스크 파악", "전략 기획 시 외부 환경 분석"],
    outputs: ["정치·경제·사회·기술·법률·환경 6가지 요인 분석"],
    examplePrompts: ['"한국 디지털 교육 시장 PESTLE 분석해줘"', '"MLM 규제 리스크 법적 요인으로 분석해줘"'],
  },
  "/porters-five-forces": {
    triggers: ["산업 매력도 평가", "진입 장벽·경쟁 강도 파악"],
    outputs: ["경쟁·공급자·구매자·대체재·신규 진입자 5가지 힘 분석 + 전략적 시사점"],
    examplePrompts: ['"교육 링크인바이오 시장 포터 5 힘 분석해줘"', '"우리 시장 진입 장벽 높아?"'],
  },
  "/pricing-strategy": {
    triggers: ["신규 기능 가격 결정", "경쟁사 가격 비교", "가격 인상 검토"],
    outputs: ["가격 모델 옵션·경쟁사 비교·지불 의향 추정·권장 전략"],
    examplePrompts: ['"파트너 이용권 가격 전략 어떻게 설계해?"', '"프리미엄 플랜 얼마가 적당해?"'],
  },
  "/product-strategy": {
    triggers: ["제품 전략 전체 정렬", "연간 전략 문서화"],
    outputs: ["비전·세그먼트·가치 제안·트레이드오프·지표·성장·역량·방어성 9섹션 전략 캔버스"],
    examplePrompts: ['"LinkDrop V2 제품 전략 캔버스 만들어줘"', '"내년 제품 방향성 전략 문서로 정리해줘"'],
  },
  "/product-vision": {
    triggers: ["팀 동기부여용 비전 문구 작성", "이해관계자 정렬"],
    outputs: ["영감을 주는 제품 비전 문구 3~5개 후보 + 각 근거"],
    examplePrompts: ['"LinkDrop 제품 비전 문구 써줘"', '"시니어 디지털 교육의 미래 비전 표현해줘"'],
  },
  "/startup-canvas": {
    triggers: ["신규 스타트업·제품 라인의 통합 문서화"],
    outputs: ["제품 전략 9섹션 + 비즈니스 모델(비용·수익) 결합 통합 캔버스"],
    examplePrompts: ['"LinkDrop V2 스타트업 캔버스 작성해줘"', '"웹소설 플랫폼 신사업 캔버스 만들어줘"'],
  },
  "/swot-analysis": {
    triggers: ["경쟁 포지셔닝 파악", "전략적 의사결정 전 상황 분석"],
    outputs: ["강점·약점·기회·위협 분석 + 실행 가능한 전략적 권고"],
    examplePrompts: ['"LinkDrop SWOT 분석해줘"', '"이 신기능 출시 전 SWOT 체크해줘"'],
  },
  "/value-proposition": {
    triggers: ["제품 가치 제안을 체계적으로 문서화", "JTBD 기반 포지셔닝"],
    outputs: ["누구에게·왜·현재 상태·어떻게·미래 상태·대안 포함 6파트 가치 제안 문서"],
    examplePrompts: ['"파트너 회원 가치 제안 6파트로 써줘"', '"LinkDrop 핵심 가치 제안 문서화해줘"'],
  },

  // ── 툴킷·기타
  "/draft-nda": {
    triggers: ["파트너십·외주 계약 전 NDA 준비"],
    outputs: ["정보 유형·관할권·검토 필요 조항 포함 NDA 초안"],
    examplePrompts: ['"강사 파트너 계약 NDA 초안 써줘"', '"외주 개발자용 비밀유지계약서 만들어줘"'],
  },
  "/grammar-check": {
    triggers: ["공식 문서·이메일·블로그 발행 전 문법 검토"],
    outputs: ["문법·논리·흐름 오류 목록 + 표적 수정안 (전체 재작성 없이)"],
    examplePrompts: ['"이 랜딩 카피 문법 확인해줘"', '"블로그 포스트 논리 흐름 맞아?"'],
  },
  "/privacy-policy": {
    triggers: ["서비스 출시 전 법적 의무 문서 준비", "GDPR·개인정보법 준수"],
    outputs: ["데이터 유형·관할권·GDPR 준수·검토 필요 조항 포함 방침 초안"],
    examplePrompts: ['"LinkDrop 개인정보처리방침 초안 써줘"', '"GDPR 준수 프라이버시 정책 만들어줘"'],
  },
  "/review-resume": {
    triggers: ["PM 직무 이력서 개선", "취업 지원 전 최종 검토"],
    outputs: ["XYZ+S 공식·키워드·직무 맞춤화 10가지 기준 종합 검토 + 개선안"],
    examplePrompts: ['"이 PM 이력서 검토해줘"', '"이력서에서 가장 먼저 고쳐야 할 것 뭐야?"'],
  },
  "/obsidian": {
    triggers: ["Obsidian 노트와 연동한 문서 관리", "링크드 노트 시스템 구축"],
    outputs: ["Obsidian 형식 마크다운 파일", "내부 링크 구조"],
    examplePrompts: ['"이 회의록 Obsidian 형식으로 저장해줘"', '"Obsidian 연동해서 프로젝트 노트 정리해줘"'],
  },
};

// ── 파일시스템 유틸 ────────────────────────────────────────────

function parseFrontmatter(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { name: "", description: "", version: undefined };
  const fm = match[1];
  const get = (key: string) => fm.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? "";
  return {
    name: get("name"),
    description: get("description"),
    version: fm.match(/version:\s*(.+)$/m)?.[1]?.trim(),
  };
}

function extractBodyPreview(content: string): string {
  // frontmatter 이후 본문에서 첫 번째 의미있는 단락 추출
  const body = content.replace(/^---[\s\S]*?---\r?\n/, "").trim();
  const lines = body.split(/\r?\n/);
  const para: string[] = [];
  for (const line of lines) {
    const clean = line.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
    if (!clean || clean.startsWith("```") || clean.startsWith("##")) {
      if (para.length > 0) break;
      continue;
    }
    para.push(clean);
    if (para.length >= 2) break;
  }
  return para.join(" ").slice(0, 200);
}

function parseRoutingRules(): Record<string, string> {
  try {
    const content = fs.readFileSync(CLAUDE_MD, "utf-8");
    const section = content.match(/## Skill routing\n([\s\S]*?)(?:\n##|$)/)?.[1] ?? "";
    const rules: Record<string, string> = {};
    for (const line of section.split("\n")) {
      const m = line.match(/^-\s+(.+?)\s+→\s+invoke\s+(\S+)/);
      if (m) rules[`/${m[2]}`] = m[1].replace(/^["']|["']$/g, "").trim();
    }
    return rules;
  } catch {
    return {};
  }
}

function discoverSkills(): DiscoveredSkill[] {
  const skills: DiscoveredSkill[] = [];
  const routingRules = parseRoutingRules();

  try {
    const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // 폴더 기반 스킬 (SKILL.md 포함 여부 확인)
        const skillMdPath = path.join(SKILLS_DIR, entry.name, "SKILL.md");
        if (!fs.existsSync(skillMdPath)) continue;
        const content = fs.readFileSync(skillMdPath, "utf-8");
        const { name, description, version } = parseFrontmatter(content);
        const command = `/${entry.name}`;
        skills.push({
          command,
          dirName: entry.name,
          name: name || entry.name,
          description,
          version,
          routingTrigger: routingRules[command],
          bodyPreview: extractBodyPreview(content),
          isFolder: true,
        });
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        // 단일 파일 스킬
        const content = fs.readFileSync(path.join(SKILLS_DIR, entry.name), "utf-8");
        const { name, description, version } = parseFrontmatter(content);
        const dirName = entry.name.replace(/\.md$/, "");
        const command = `/${dirName}`;
        skills.push({
          command,
          dirName,
          name: name || dirName,
          description,
          version,
          routingTrigger: routingRules[command],
          bodyPreview: extractBodyPreview(content),
          isFolder: false,
        });
      }
    }
  } catch {
    // SKILLS_DIR 접근 불가 시 빈 배열 반환
  }

  return skills;
}

// ── 페이지 컴포넌트 ────────────────────────────────────────────
export default async function DevSkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const skills = discoverSkills();
  const activeCat = cat ?? "all";

  // command → skill 맵
  const skillMap = new Map(skills.map((s) => [s.command, s]));

  // 카테고리별 그룹 구성
  const categorizedCommands = new Set(SKILL_CATEGORIES.flatMap((c) => c.commands));
  const uncategorized = skills.filter((s) => !categorizedCommands.has(s.command));

  const routingRulesCount = skills.filter((s) => s.routingTrigger).length;
  const categoryCount = SKILL_CATEGORIES.length + (uncategorized.length > 0 ? 1 : 0);

  // 필터 적용: activeCat이 "all"이면 전체, 아니면 해당 카테고리만
  const visibleCategories =
    activeCat === "all"
      ? SKILL_CATEGORIES
      : SKILL_CATEGORIES.filter((c) => c.id === activeCat);
  const showUncategorized = activeCat === "all" || activeCat === "etc";

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0a0a0f",
      color: "#e4e4f0",
      fontFamily: "Pretendard Variable, Pretendard, -apple-system, sans-serif",
      padding: "0 0 80px",
    }}>
      {/* 헤더 */}
      <div style={{
        background: "linear-gradient(180deg, #13132a 0%, #0a0a0f 100%)",
        borderBottom: "1px solid rgba(111,255,0,0.15)",
        padding: "32px 24px 28px",
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#6fff00",
              border: "1px solid rgba(111,255,0,0.4)", borderRadius: 4,
              padding: "2px 8px", letterSpacing: "0.08em", textTransform: "uppercase",
            }}>DEV ONLY</span>
            <span style={{ color: "rgba(228,228,240,0.3)", fontSize: 13 }}>
              파일시스템 자동 감지 — 새 스킬 추가 시 자동 반영
            </span>
          </div>
          <h1 style={{
            fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 800,
            color: "#ffffff", margin: "0 0 6px", letterSpacing: "-0.02em",
          }}>
            Claude Skills 사용 가이드
          </h1>
          {/* 통계 배지 */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
            <Stat label="전체 스킬" value={skills.length} color="#6fff00" />
            <Stat label="카테고리" value={categoryCount} color="#a855f7" />
            <Stat label="라우팅 연결" value={routingRulesCount} color="#3b82f6" />
            <Stat label="상세 문서" value={Object.keys(MANUAL_DETAILS).length} color="#f59e0b" />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 0" }}>

        {/* ── 카테고리 필터 탭 ── */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 40,
          padding: "16px 20px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
        }}>
          {/* 전체 버튼 */}
          <Link
            href="/dev/skills"
            style={{
              fontSize: 13, fontWeight: 700,
              padding: "6px 14px", borderRadius: 20,
              textDecoration: "none",
              background: activeCat === "all" ? "rgba(111,255,0,0.18)" : "rgba(255,255,255,0.05)",
              color: activeCat === "all" ? "#6fff00" : "rgba(228,228,240,0.5)",
              border: activeCat === "all" ? "1px solid rgba(111,255,0,0.4)" : "1px solid rgba(255,255,255,0.08)",
              transition: "all 0.15s",
            }}
          >
            전체 <span style={{ opacity: 0.6, fontWeight: 400 }}>{skills.length}</span>
          </Link>

          {/* 카테고리별 버튼 */}
          {SKILL_CATEGORIES.map((cat) => {
            const count = cat.commands.filter((cmd) => skillMap.has(cmd)).length;
            if (count === 0) return null;
            const isActive = activeCat === cat.id;
            return (
              <Link
                key={cat.id}
                href={`/dev/skills?cat=${cat.id}`}
                style={{
                  fontSize: 13, fontWeight: 700,
                  padding: "6px 14px", borderRadius: 20,
                  textDecoration: "none",
                  background: isActive ? `${cat.color}22` : "rgba(255,255,255,0.05)",
                  color: isActive ? cat.color : "rgba(228,228,240,0.5)",
                  border: isActive ? `1px solid ${cat.color}55` : "1px solid rgba(255,255,255,0.08)",
                  transition: "all 0.15s",
                }}
              >
                {cat.title} <span style={{ opacity: 0.6, fontWeight: 400 }}>{count}</span>
              </Link>
            );
          })}

          {/* 미분류 버튼 */}
          {uncategorized.length > 0 && (
            <Link
              href="/dev/skills?cat=etc"
              style={{
                fontSize: 13, fontWeight: 700,
                padding: "6px 14px", borderRadius: 20,
                textDecoration: "none",
                background: activeCat === "etc" ? "rgba(100,116,139,0.25)" : "rgba(255,255,255,0.05)",
                color: activeCat === "etc" ? "#94a3b8" : "rgba(228,228,240,0.5)",
                border: activeCat === "etc" ? "1px solid rgba(100,116,139,0.4)" : "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.15s",
              }}
            >
              미분류 <span style={{ opacity: 0.6, fontWeight: 400 }}>{uncategorized.length}</span>
            </Link>
          )}
        </div>

        {/* 카테고리별 섹션 */}
        {visibleCategories.map((cat) => {
          const catSkills = cat.commands
            .map((cmd) => skillMap.get(cmd))
            .filter((s): s is DiscoveredSkill => s !== undefined);

          if (catSkills.length === 0) return null;

          return (
            <section key={cat.id} style={{ marginBottom: 56 }}>
              <SectionHeader
                title={cat.title}
                count={catSkills.length}
                color={cat.color}
                desc={cat.desc}
              />
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 20,
              }}>
                {catSkills.map((skill) => (
                  <SkillCard key={skill.command} skill={skill} detail={MANUAL_DETAILS[skill.command]} />
                ))}
              </div>
            </section>
          );
        })}

        {/* 미분류 스킬 */}
        {showUncategorized && uncategorized.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <SectionHeader
              title="미분류"
              count={uncategorized.length}
              color="#64748b"
              desc="카테고리 미지정 — SKILL_CATEGORIES에 추가 권장"
            />
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 20,
            }}>
              {uncategorized.map((skill) => (
                <SkillCard key={skill.command} skill={skill} detail={MANUAL_DETAILS[skill.command]} />
              ))}
            </div>
          </section>
        )}

        {skills.length === 0 && (
          <div style={{
            textAlign: "center", padding: "60px 0",
            color: "rgba(228,228,240,0.3)", fontSize: 15,
          }}>
            스킬을 찾을 수 없습니다 — {SKILLS_DIR}
          </div>
        )}

        {/* 사용법 요약 */}
        <div style={{
          background: "rgba(111,255,0,0.05)",
          border: "1px solid rgba(111,255,0,0.15)",
          borderRadius: 12, padding: "24px 28px",
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#6fff00", margin: "0 0 16px" }}>
            스킬 호출 방법
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16, fontSize: 14, color: "rgba(228,228,240,0.65)", lineHeight: 1.8,
          }}>
            <div>
              <strong style={{ color: "#e4e4f0", display: "block", marginBottom: 4 }}>직접 입력</strong>
              채팅창에 <code style={{ color: "#6fff00" }}>/skillname</code> 입력 → AI가 SKILL.md 로드 후 워크플로우 시작
            </div>
            <div>
              <strong style={{ color: "#e4e4f0", display: "block", marginBottom: 4 }}>AI 자동 판단</strong>
              CLAUDE.md 라우팅 규칙에 따라 맥락을 보고 자동 선택·호출
            </div>
            <div>
              <strong style={{ color: "#e4e4f0", display: "block", marginBottom: 4 }}>스킬 경로</strong>
              <code style={{ color: "#f59e0b", fontSize: 12 }}>.claude/skills/[name]/SKILL.md</code>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <Link href="/" style={{ fontSize: 14, color: "rgba(228,228,240,0.35)", textDecoration: "none" }}>
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontSize: 22, fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: 13, color: "rgba(228,228,240,0.45)" }}>{label}</span>
    </div>
  );
}

function SectionHeader({ title, count, color, desc }: {
  title: string; count: number; color: string; desc: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
      paddingBottom: 14, borderBottom: `1px solid ${color}22`,
    }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
      <h2 style={{ fontSize: 18, fontWeight: 700, color, margin: 0 }}>{title}</h2>
      <span style={{ fontSize: 12, color: "rgba(228,228,240,0.3)" }}>{count}개</span>
      <span style={{ fontSize: 13, color: "rgba(228,228,240,0.35)", fontWeight: 400 }}>— {desc}</span>
    </div>
  );
}

function SkillCard({ skill, detail }: { skill: DiscoveredSkill; detail: ManualDetail | undefined }) {
  const hasDetail = !!detail;

  return (
    <article style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${hasDetail ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 14,
      padding: "22px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
    }}>
      {/* 헤더: 커맨드 + 버전 + 자동감지 배지 */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <code style={{
            fontSize: 14, fontWeight: 700,
            color: hasDetail ? "#a855f7" : "#f59e0b",
            background: hasDetail ? "rgba(168,85,247,0.12)" : "rgba(245,158,11,0.1)",
            border: `1px solid ${hasDetail ? "rgba(168,85,247,0.3)" : "rgba(245,158,11,0.25)"}`,
            borderRadius: 6, padding: "3px 10px",
            fontFamily: '"JetBrains Mono","Fira Code",monospace',
          }}>
            {skill.command}
          </code>
          {skill.version && (
            <span style={{ fontSize: 11, color: "rgba(228,228,240,0.3)", fontWeight: 600 }}>
              v{skill.version}
            </span>
          )}
          {!hasDetail && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: "rgba(245,158,11,0.7)",
              border: "1px solid rgba(245,158,11,0.2)", borderRadius: 3,
              padding: "1px 6px", letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              자동 감지
            </span>
          )}
        </div>

        {/* 이름 */}
        <p style={{ fontSize: 13, color: "rgba(228,228,240,0.4)", margin: "0 0 6px", fontWeight: 600 }}>
          {KOREAN_META[skill.command]?.name || skill.name}
        </p>

        {/* 설명 — 한글 메타 우선, 없으면 영문 frontmatter */}
        <p style={{ fontSize: 14, color: "#e4e4f0", margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
          {KOREAN_META[skill.command]?.description || skill.description || skill.bodyPreview || "설명 없음"}
        </p>
      </div>

      {/* CLAUDE.md 라우팅 트리거 */}
      {skill.routingTrigger && (
        <div>
          <Label>CLAUDE.md 라우팅 트리거</Label>
          <div style={{
            fontSize: 13, color: "#6fff00",
            background: "rgba(111,255,0,0.06)",
            border: "1px solid rgba(111,255,0,0.12)",
            borderRadius: 6, padding: "7px 12px", lineHeight: 1.6,
          }}>
            {skill.routingTrigger}
          </div>
        </div>
      )}

      {/* 수동 상세: 언제 사용 */}
      {detail?.triggers && (
        <div>
          <Label>언제 사용하나</Label>
          <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 3 }}>
            {detail.triggers.map((t, i) => (
              <li key={i} style={{ fontSize: 13, color: "rgba(228,228,240,0.65)", lineHeight: 1.6 }}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 수동 상세: 출력물 */}
      {detail?.outputs && (
        <div>
          <Label>출력물</Label>
          <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 3 }}>
            {detail.outputs.map((o, i) => (
              <li key={i} style={{ fontSize: 13, color: "rgba(228,228,240,0.65)", lineHeight: 1.6 }}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 수동 상세: 예시 프롬프트 */}
      {detail?.examplePrompts && (
        <div>
          <Label>예시 프롬프트</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {detail.examplePrompts.map((p, i) => (
              <div key={i} style={{
                fontSize: 12, color: "rgba(228,228,240,0.55)",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 6, padding: "6px 10px",
                fontStyle: "italic", lineHeight: 1.5,
              }}>{p}</div>
            ))}
          </div>
        </div>
      )}

      {/* 노트 */}
      {detail?.note && (
        <div style={{
          fontSize: 12, color: "rgba(245,158,11,0.8)",
          background: "rgba(245,158,11,0.07)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 8, padding: "7px 12px", lineHeight: 1.6,
        }}>
          ⚠️ {detail.note}
        </div>
      )}

      {/* 자동 감지 스킬에 상세 추가 안내 */}
      {!hasDetail && (
        <div style={{
          fontSize: 12, color: "rgba(59,130,246,0.7)",
          background: "rgba(59,130,246,0.06)",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 8, padding: "7px 12px", lineHeight: 1.6,
        }}>
          💡 상세 설명 추가: <code style={{ fontSize: 11 }}>page.tsx</code>의{" "}
          <code style={{ fontSize: 11 }}>MANUAL_DETAILS</code>에{" "}
          <code style={{ fontSize: 11 }}>&quot;{skill.command}&quot;</code> 키로 추가
        </div>
      )}
    </article>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700, color: "rgba(228,228,240,0.28)",
      textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 7px",
    }}>
      {children}
    </p>
  );
}
