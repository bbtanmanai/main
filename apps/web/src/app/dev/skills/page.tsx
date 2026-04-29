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

  // 알파벳 순 정렬 (수동 상세 있는 스킬 우선)
  return skills.sort((a, b) => {
    const aHas = !!MANUAL_DETAILS[a.command];
    const bHas = !!MANUAL_DETAILS[b.command];
    if (aHas !== bHas) return aHas ? -1 : 1;
    return a.command.localeCompare(b.command);
  });
}

// ── 페이지 컴포넌트 ────────────────────────────────────────────
export default function DevSkillsPage() {
  const skills = discoverSkills();
  const withDetail = skills.filter((s) => !!MANUAL_DETAILS[s.command]);
  const autoOnly   = skills.filter((s) => !MANUAL_DETAILS[s.command]);
  const routingRulesCount = skills.filter((s) => s.routingTrigger).length;

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
            <Stat label="상세 문서" value={withDetail.length} color="#a855f7" />
            <Stat label="자동 감지" value={autoOnly.length} color="#f59e0b" />
            <Stat label="라우팅 연결" value={routingRulesCount} color="#3b82f6" />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 0" }}>

        {/* 상세 문서 있는 스킬 */}
        {withDetail.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <SectionHeader
              title="상세 문서 스킬"
              count={withDetail.length}
              color="#a855f7"
              desc="트리거·출력물·예시 프롬프트가 수동으로 작성된 스킬"
            />
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 20,
            }}>
              {withDetail.map((skill) => (
                <SkillCard key={skill.command} skill={skill} detail={MANUAL_DETAILS[skill.command]} />
              ))}
            </div>
          </section>
        )}

        {/* 자동 감지만 된 스킬 */}
        {autoOnly.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <SectionHeader
              title="자동 감지 스킬"
              count={autoOnly.length}
              color="#f59e0b"
              desc=".claude/skills/에서 발견됨 — CLAUDE.md에 라우팅 규칙 추가 권장"
            />
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 20,
            }}>
              {autoOnly.map((skill) => (
                <SkillCard key={skill.command} skill={skill} detail={undefined} />
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
