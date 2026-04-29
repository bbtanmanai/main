# LinkDrop V2 — Claude 프로젝트 지침

## ★★★★★ 대화 시작 즉시 — SESSION_START.md 하나만 읽을 것

```
.claude/SESSION_START.md   ← 현재 작업 + 잠금 결정 요약 + 추가 읽기 안내 (전부 포함)
```

**이 파일을 읽기 전까지 코드 수정 제안을 하지 말 것.**
추가 정보가 필요한 경우는 SESSION_START.md의 "추가 읽기" 표를 참조할 것.

---

## 프로젝트 개요

LinkDrop V2는 **소비자 접점 앱**이다. V3가 콘텐츠를 생산하면 V2가 판다.

- **역할**: 랜딩·결제·회원·파트너·강사·CRM 소비자 접점 전담
- **작업 경로**: `C:\LinkDropV2\apps\web\` (Next.js App Router)
- **설계 문서**: `C:\LinkDropV2\docs\` (00-overview ~ 06-prototype-spec)
- **아카이브**: `C:\LinkDropV2\.claude\archives\`

### V3 참조 규칙
- `C:\LinkDropV3` 파일은 **Read만 허용** (설계 참고용)
- V3 코드 수정·V3 모듈 import 절대 금지
- V3 LOCKED_DECISIONS(LD-001~016)는 V2와 무관 — 참조 금지

---

## ★ CLAUDE.md 작성 원칙

> **이 파일은 목차(인덱스)다. 내용을 직접 쓰지 말 것.**

- 새로운 규칙·결정·설명을 추가할 때는 반드시 `.claude/rules/` 에 별도 문서를 생성한다
- CLAUDE.md에는 해당 문서의 **경로와 한 줄 설명**만 기록한다
- 기존 규칙을 수정할 때도 해당 문서를 직접 수정하고, CLAUDE.md는 경로만 유지한다

---

## 설계 원칙 (항상 적용)

1. **Zero-API**: 마케팅 사이트는 외부 API 호출 없음 — 모든 콘텐츠는 `src/data/*.json`에서
2. **프론트 JSON 우선**: 코드 수정 없이 콘텐츠 편집 가능하도록 데이터 분리
3. **DB 최소화**: 마케팅 페이지에서 Supabase 직접 호출 금지 — 정적 데이터만 사용
4. **iframe 절대 금지**: 외부 링크는 `window.open()` 팝업 또는 `<a target="_blank">`
5. **서킷 브레이커**: 외부 CTA 링크 실패 시 대체 연락처(전화·이메일) 노출

### UI/UX 원칙
- **테마**: 라이트 기본 (`color-scheme: light`), 다크는 사용자 선택 (토글 옵션)
- **index 페이지**: 디자인·애니메이션 완성도 최우선
- **폰트**: Pretendard Variable (한글·영문 통합), Anton 금지 (V3 영역)
- **본문 최소**: 18px (시니어 가독성 — 이하 절대 금지)
- **터치 최소**: 48×48dp (CTA는 56~64)
- **Purposeful Animation**: 장식 모션 금지, `prefers-reduced-motion` 감지 시 즉시 정지

---

## 운영 규칙 문서 (.claude/rules/)

| 문서 | 내용 |
|------|------|
| `.claude/rules/LOCKED_DECISIONS.md` | V2 잠금 결정 레지스트리 (LD-001~007) |
| `.claude/rules/BACKLOG.md` | V2 개발 백로그 (Phase 0~7) |
| `.claude/rules/debugging.md` | 디버깅 체크리스트 |
| `.claude/rules/windows.md` | Windows bat/cmd 작성 규칙 |
| `.claude/rules/gnb.md` | GNB 설계 규칙 — Glass 배경·테마별 색상·라우터별 props·top padding |

## 설계 아카이브 문서 (.claude/archives/)

| 문서 | 내용 |
|------|------|
| `.claude/archives/01_V2_프론트_설계_확정.md` | 라우트 구조·컴포넌트·데이터·테마 토큰 전체 확정 |
| `.claude/archives/02_라우트그룹_404_원인분석.md` | Route Group `(member)` 등이 URL을 생성하지 않아 발생한 404 원인·수정 기록 |
| `.claude/archives/03_V2_회원구분 및 역할.md` | role 체계 (guest/partner/instructor/admin), 진입 조건, 수당 구조, Supabase 스펙 |
| `.claude/archives/04_마스코트_캐릭터_배치_설계.md` | 우주인 마스코트 2회 배치 설계 — LdMascotFloat 컴포넌트·위치·애니메이션 스펙 |
| `.claude/archives/05_랜딩페이지_작성원칙.md` | 랜딩페이지 6대 작성 원칙 — 콤보 색상 10종·구조·동영상·용어 해설·챕터·마스코트 기준 |

---

<investigate_before_answering>
코드에 대해 답하기 전에 반드시 해당 파일을 먼저 읽을 것.
확인하지 않은 코드에 대해 추측하지 말고 "확인하겠습니다"로 시작할 것.
</investigate_before_answering>

<MANDATORY>

## 아카이브 문서 선행 확인

**신규 컴포넌트 설계 또는 기존 설계 변경** 시에만 아래를 따른다.
(단순 버그 수정, 텍스트/색상 조정, 기존 파일의 소규모 수정은 해당 없음)

- `C:\LinkDropV2\.claude\archives\01_V2_프론트_설계_확정.md` — 설계 전체 레퍼런스
- 없으면 `C:\LinkDropV2\docs\` 의 관련 설계 문서를 읽을 것

읽은 후: 사용자 요구와 문서 내용 간 불일치 발견 시 즉시 멈추고 질문으로 확인.

</MANDATORY>

<important if="you are about to modify, delete, refactor, or propose changes to any code or file">

## Lock Protocol — 잠금된 결정 변경 절차

1. `.claude/rules/LOCKED_DECISIONS.md` 확인
2. 코드에서 `# 🔒 LD-` 주석 검색
3. 잠금 항목 변경 시: 해당 LD-XXX 내용을 사용자에게 보여주고
   `"⚠️ LD-XXX 번복하시려면 'LD-XXX 번복 확인'이라고 말씀해주세요."` 출력
4. 사용자 명시적 허가 후에만 진행

"개선처럼 보이는 것"이 잠금된 결정일 수 있다. 매 세션마다 같은 제안을 반복하지 말 것.

</important>

<subagent_usage>
독립 병렬 작업·격리 컨텍스트·3회 이상 탐색이 필요한 넓은 범위 조사에만 서브에이전트 사용.
단순 작업·단일 파일 수정·grep/glob으로 충분한 경우엔 직접 수행할 것.
</subagent_usage>

## Skill routing

When the user's request matches an available skill, invoke it via Skill tool FIRST.

- Bugs, errors, "why is this broken" → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site → invoke qa
- Code review → invoke review
- Architecture review → invoke plan-eng-review
- Save progress / checkpoint → invoke checkpoint
- UI 컴포넌트 신규 제작, 스타일링, "더 예쁘게", "디자인 개선", 레이아웃·폼·대시보드 작업 → invoke refactoring-ui
- 디자인 시스템 생성, 산업별 UI 스타일 추천, 랜딩페이지 디자인 방향 결정 → invoke ui-ux-pro-max
- 랜딩페이지·캠페인 페이지 대담한 크리에이티브 UX, 개성있는 디자인 방향 → invoke bencium-innovative-ux-designer
- 기업·결제·회원 페이지 체계적 UX, WCAG 2.1 AA 접근성 준수 설계 → invoke bencium-controlled-ux-designer
- 제네릭 AI 미학 회피, 프로덕션급 프론트엔드 인터페이스 제작 → invoke bencium-impact-designer
- 기존 UI/UX 감사, 단계별 개선 계획 수립 ("이 화면 어때?", "UI 검토해줘") → invoke design-audit
- Next.js/React/TypeScript/Supabase 코드 컨벤션 점검, 코드 스타일 가이드 적용 → invoke bencium-code-conventions
