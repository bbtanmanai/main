# LinkDrop — UI/UX 설계 문서 패키지

> **버전** : 2.0 (senior-pivot)
> **작성일** : 2026-04-20
> **원본 플랜** : [`LinkDrop_프로젝트_계획서.md`](LinkDrop_프로젝트_계획서.md)

## 이 패키지는 무엇인가

**시니어(40대 이상)를 위한 AI 부업 교육·수익화 플랫폼 "LinkDrop"의 UI/UX 설계 문서 묶음**이다.
Figma 실파일을 만들기 전, 디자이너·개발자·사업자가 **같은 그림**을 볼 수 있도록 마크다운으로만 작성되었다.

### 최종 산출물 핵심

- **9개 니즈별 랜딩 페이지** (웹소설·쇼츠·블로그·재테크 등) — 방문자가 공감하는 페이지에서 ₩59,000 전자책 구매
- **시니어 친화 UX**: 본문 18px / 수익금 24px Bold / 48dp 터치 / 1.6 행간 / 신뢰 색(파랑+주황)
- **4단계 성장 경로**: 구매자 → 실습자 → 리셀러 → 🎓 강사
- **마이페이지**: 수익 대시보드 · 정산 투명 공개 · 리셀러 링크 발급

### 본 문서와 코드 저장소의 관계

- 본 `C:\LinkDrop`은 **설계 문서 전용 작업 공간**
- 실제 제품 구현은 **LinkDropV3** 레포(`C:\LinkDropV3`)에서 진행 (Next.js 14 + FastAPI + Supabase)
- V3는 본 설계 문서를 참조하여 UI를 구현한다. 본 문서는 V3 코드를 직접 수정하지 않는다.

---

## 문서 네비게이션

### 00 · 개요 (먼저 읽기)
- [프로젝트 브리핑](docs/00-overview/project-brief.md) — 왜 만드는가 · 누구를 위한가 · 비즈니스 구조
- [디자인 5대 원칙](docs/00-overview/design-principles.md) — Trust First · Senior Legibility · Calm Motion · Earnings Clarity · A11y++

### 01 · 정보 구조 (IA)
- [사이트맵](docs/01-ia/sitemap.md) — 9개 랜딩 + 구매 · 학습 · 대시보드 · 강사 양성 라우트
- [정보 구조 전략](docs/01-ia/information-architecture.md) — 퍼널 단계별 정보 배치 전략
- [적응형 네비게이션](docs/01-ia/navigation-adaptive.md) — 모바일/태블릿/데스크톱별 네비 변형
- [핵심 사용자 플로우](docs/01-ia/user-flows.md) — 랜딩→구매→실습→강사 4대 여정

### 02 · 와이어프레임
- [랜딩 페이지 공통 템플릿](docs/02-wireframes/landing-template.md) — 10개 공통 섹션 구조
- [9개 랜딩 변형](docs/02-wireframes/landing-variations.md) — 주제별 카피·히어로·CTA 특화
- [결제 플로우](docs/02-wireframes/checkout.md) — ₩59,000 스타터 + ₩29,000/월 강사 툴
- [마이페이지 대시보드](docs/02-wireframes/mypage.md) — 학습 진도 · 수익 · 리셀러 링크
- [강사 양성 과정](docs/02-wireframes/instructor-program.md) — 인증 4단계 · 강의 Kit · 원데이클래스

### 03 · 디자인 시스템
- [색상 토큰](docs/03-design-system/tokens-color.md) — 신뢰 파랑(#0055FF) + 수익 주황(#FF8800)
- [타이포그래피 토큰](docs/03-design-system/tokens-typography.md) — Pretendard · 본문 18px 기준
- [간격 · 8pt 그리드](docs/03-design-system/tokens-spacing.md) — 48dp 터치 타깃
- [엘리베이션 · 카드 그림자](docs/03-design-system/tokens-elevation.md) — 라이트 모드 우선
- [모션 가이드라인](docs/03-design-system/motion-guidelines.md) — Calm Motion · 과도한 패럴랙스 금지
- [접근성 WCAG 2.2 AA+](docs/03-design-system/accessibility-wcag.md) — 시니어 관점 체크리스트
- [컴포넌트 인벤토리](docs/03-design-system/component-inventory.md) — LdButton · LdCard · LdEarningsCard 등

### 04 · 사용자 스토리보드
- [시니어 페르소나 × 시나리오](docs/04-user-stories/storyboards.md) — 4명 페르소나의 구매~강사 여정

### 05 · 반응형
- [브레이크포인트](docs/05-responsive/breakpoints.md) — 360/768/1280/1920

### 06 · 인터랙션·프로토타입 사양
- [마이크로·페이지 전환 사양](docs/06-prototype-spec/interactions.md) — 타이밍 · 이징 · reduced-motion

---

## 상위 설계 결정 (Locked)

| 항목 | 결정 | 근거 |
|------|------|------|
| 기본 모드 | **라이트 기본** + 다크 옵션 | 시니어 가독성 · 신뢰감 |
| 포인트 컬러 | 신뢰 파랑 `#0055FF` + 수익 주황 `#FF8800` | 계획서 §5-4 |
| 본문 기본 폰트 | **18px** (소형 기기도 16px 이하 금지) | 시력 저하 대응 |
| 수익 금액 표기 | **24px Bold** 이상 | 계획서 §5-4 |
| 터치 타깃 | **최소 48×48dp** | 오터치 방지 |
| 행간 | **1.6 이상** | 가독성 |
| 대비비 | **WCAG AA 4.5:1 이상** (본문 7:1 권장 — AAA) | 시니어 대상 상향 |
| 모션 | **Calm** — 스크롤 패럴랙스 최소화 · 자동재생 금지 | 어지러움 방지 |
| 디바이스 우선 | 모바일 (스마트폰 시니어 70%+) → 데스크톱 | 계획서 §2 |
| 레이아웃 기준 | 1120px 컨테이너 · 모바일 16px 좌우 패딩 | 글 중심 문서 가독 |

---

## 범위 밖 (Out of Scope)

- 실제 Figma/XD 파일 생성 — 디자이너가 본 MD를 원본으로 제작
- Next.js·FastAPI 코드 구현 — LinkDropV3 레포 담당
- 결제(토스페이먼츠)·정산·수당 계산 **로직** — 백엔드 설계 문서 범위
- 세무·법무·공정위 사전 상담 문구 — 법무팀 확정 후 반영

---

## 변경 이력

| 버전 | 날짜 | 변경 |
|------|------|------|
| 1.0 | 2026-04-19 | 최초 작성 (당시 애니 스트리밍 가정) |
| 2.0 | 2026-04-20 | 실제 프로젝트 정체성(시니어 AI 교육·9 랜딩)에 맞춰 전면 재작성 |
