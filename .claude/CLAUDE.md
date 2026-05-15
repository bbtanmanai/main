# LinkDrop V2 — Claude 프로젝트 지침

> **이 파일은 목차(인덱스)다. 내용을 직접 쓰지 말 것.**
> 규칙 추가·수정 시 `.claude/rules/` 에 별도 문서를 생성하고 아래 표에 경로만 기록한다.

---

## ★★★★★ 대화 시작 즉시 — SESSION_START.md 하나만 읽을 것
## ★★★★★ 어떠한 경우에도 파일 삭제 금지( 파일 삭제가 필요한 경우 사용자에게 제안만 가능)


```
.claude/SESSION_START.md   ← 현재 작업 + 잠금 결정 요약 + 추가 읽기 안내
```

이 파일을 읽기 전까지 코드 수정 제안을 하지 말 것.

---

## 운영 규칙 문서 (.claude/rules/) — 자동 로드 유지

| 문서 | 내용 |
|------|------|
| `rules/LOCKED_DECISIONS.md` | V2 잠금 결정 레지스트리 (LD-001~012) |
| `rules/ai-behavior.md` | 코드 확인 우선·Lock Protocol·서브에이전트·Skill Routing |
| `rules/design-principles.md` | Zero-API·CSS 아키텍처·인라인 style 금지·테마 정의·콤보 색상·Left Border 금지 |
| `rules/member-structure.md` | 역할 5단계·후원 트리(직라인 3명 한도·깊이 무제한)·referrals DB 스키마·수당 현황 |

## 디자인 시스템 — 루트 직속 (V3 구조 동일)

| 문서 | 내용 |
|------|------|
| `DESIGN.md` | **디자인 시스템 정식 파일** — 색상 토큰·Glass·Blob·타이포·Z-index·접근성 |

## 참조 문서 (.claude/archives/) — 필요 시 수동 Read

| 문서 | 내용 |
|------|------|
| `archives/project-overview.md` | 프로젝트 정의·V3 참조 규칙·라우트 구조·기술 스택 |
| `archives/DESIGN.md` | ⚠️ 아카이브 사본 — 정식 파일은 루트 `DESIGN.md` 참조 |
| `archives/gnb.md` | GNB 설계 규칙 — Glass 배경·라우터별 props·top padding |
| `archives/BACKLOG.md` | V2 개발 백로그 (Phase 0~7, 미완료 항목) |
| `archives/debugging.md` | 디버깅 체크리스트 |
| `archives/windows.md` | Windows bat/cmd 작성 규칙 |
| `archives/file-edit-protocol.md` | null bytes 방지·Edit 도구 사용 기준·Python heredoc 패턴 |

---

## 스킬 인덱스 (.claude/skills/)

> 사용 가능한 스킬 전체 목록: [skills/SKILLS.md](skills/SKILLS.md)
> V2 코드 작업(디버그·리팩터·리뷰) + 디자인·UX + 비즈니스 스킬 분류 포함

## 커맨드 인덱스 (.claude/commands/)

> 사용 가능한 커맨드 전체 목록: [commands/COMMANDS.md](commands/COMMANDS.md)
> `/checkpoint` · `/save-session` · `/verify` + 비즈니스·제품 커맨드 분류 포함

---

## 설계 아카이브 (.claude/archives/)

| 문서 | 내용 |
|------|------|
| `archives/01_V2_프론트_설계_확정.md` | 라우트 구조·컴포넌트·데이터·테마 토큰 전체 확정 |
| `archives/02_라우트그룹_404_원인분석.md` | Route Group 404 원인·수정 기록 |
| `archives/03_V2_회원구분 및 역할.md` | role 체계·진입 조건·수당 구조·Supabase 스펙 |
| `archives/04_마스코트_캐릭터_배치_설계.md` | 우주인 마스코트 2회 배치 설계 스펙 |
| `archives/05_랜딩페이지_작성원칙.md` | 랜딩페이지 6대 작성 원칙·콤보 색상 10종·마스코트 기준 |
| `archives/50_GEO_블로그_전략_인사이트.md` | GEO(생성형 검색 최적화) 블로그 전략 |
| `archives/51_V2_마케팅_채널_전략.md` | 마케팅 채널 전략·Facebook 자동화 설계·미구현 목록 (MKT-001~002) |
