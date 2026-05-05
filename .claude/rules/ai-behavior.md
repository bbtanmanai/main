# AI 행동 규칙 — Claude 작업 지침

> 작성: 2026-05-06
> 이 파일은 Claude가 LinkDrop V2 프로젝트에서 따라야 할 행동 원칙을 정의한다.

---

## 1. 코드 확인 우선 원칙

코드에 대해 답하기 전에 반드시 해당 파일을 먼저 읽을 것.  
확인하지 않은 코드에 대해 추측하지 말고 **"확인하겠습니다"로 시작**할 것.

---

## 2. 아카이브 문서 선행 확인

**신규 컴포넌트 설계 또는 기존 설계 변경** 시에만 적용한다.  
(단순 버그 수정, 텍스트/색상 조정, 기존 파일의 소규모 수정은 해당 없음)

1. `C:\LinkDropV2\.claude\archives\01_V2_프론트_설계_확정.md` — 설계 전체 레퍼런스
2. 없으면 `C:\LinkDropV2\docs\` 의 관련 설계 문서를 읽을 것

읽은 후: 사용자 요구와 문서 내용 간 불일치 발견 시 즉시 멈추고 질문으로 확인.

---

## 3. Lock Protocol — 잠금된 결정 변경 절차

아래 항목 중 하나에 **직접** 해당할 때만 발동한다.  
무관한 단순 수정(텍스트, 레이아웃, 버그 수정, 새 컴포넌트 등)은 확인 없이 바로 진행한다.

### 발동 트리거 (9가지)

| 트리거 | 관련 LD |
|--------|---------|
| ThemeProvider defaultTheme / enableSystem 변경 | LD-001 |
| V3 경로 import 추가 | LD-003 |
| LdStatusStepper 색상 변경 | LD-004 |
| 랜딩 콘텐츠를 Supabase/API에서 조회 | LD-005 |
| liquid-glass를 JS 분기로 처리 | LD-006 |
| 한글에 Anton 폰트 적용 | LD-007 |
| checkout에 data-theme 강제 | LD-008 |
| 이메일+비밀번호 인증 복구 | LD-009 |
| users.role 명칭·체계 변경 | LD-011 |

### 발동 시 절차

1. 관련 `rules/LOCKED_DECISIONS.md` 해당 LD 내용을 사용자에게 보여준다
2. `"⚠️ LD-XXX 번복하시려면 'LD-XXX 번복 확인'이라고 말씀해주세요."` 출력
3. 사용자 명시적 허가 후에만 진행

---

## 4. 서브에이전트 사용 기준

서브에이전트(Agent 도구)는 아래 조건에서만 사용한다:

- 독립적으로 병렬 처리 가능한 작업
- 메인 컨텍스트와 격리가 필요한 작업
- grep/glob으로 충분하지 않은 3회 이상의 넓은 범위 탐색

**서브에이전트 사용 금지:**
- 단순 작업
- 단일 파일 수정
- grep/glob으로 충분한 검색

---

## 5. Skill Routing

사용자 요청이 아래 패턴과 일치하면 Skill 도구로 먼저 호출한다.

| 요청 패턴 | Skill |
|-----------|-------|
| 버그, 오류, "왜 안 되나", "이상하다" | `investigate` |
| 배포, 푸시, PR 생성 | `ship` |
| QA, 사이트 테스트 | `qa` |
| 코드 리뷰 | `review` |
| 아키텍처 리뷰 | `plan-eng-review` |
| 작업 저장, 체크포인트 | `checkpoint` |
| UI 컴포넌트 신규 제작, 스타일링, "더 예쁘게", 레이아웃·폼·대시보드 | `refactoring-ui` |
| 디자인 시스템 생성, 랜딩 디자인 방향 결정 | `ui-ux-pro-max` |
| 랜딩·캠페인 페이지 크리에이티브 UX | `bencium-innovative-ux-designer` |
| 기업·결제·회원 페이지 체계적 UX, WCAG 접근성 설계 | `bencium-controlled-ux-designer` |
| 프로덕션급 프론트엔드 인터페이스 제작 | `bencium-impact-designer` |
| 기존 UI/UX 감사, "이 화면 어때?", "UI 검토" | `design-audit` |
| Next.js/React/TypeScript/Supabase 코드 컨벤션 점검 | `bencium-code-conventions` |
