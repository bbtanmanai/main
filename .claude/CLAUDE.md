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

## 운영 규칙 문서 (.claude/rules/)

| 문서 | 내용 |
|------|------|
| `rules/project-overview.md` | 프로젝트 정의·V3 참조 규칙·라우트 구조·기술 스택 |
| `rules/LOCKED_DECISIONS.md` | V2 잠금 결정 레지스트리 (LD-001~011) |
| `rules/ai-behavior.md` | 코드 확인 우선·아카이브 선행 확인·Lock Protocol·서브에이전트·Skill Routing |
| `rules/design-principles.md` | Zero-API·CSS 아키텍처·인라인 style 금지·테마 정의·콤보 색상·Left Border 금지 |
| `rules/gnb.md` | GNB 설계 규칙 — Glass 배경·테마별 색상·라우터별 props·top padding |
| `rules/BACKLOG.md` | V2 개발 백로그 (Phase 0~7, 미완료 항목) |
| `rules/debugging.md` | 디버깅 체크리스트 |
| `rules/windows.md` | Windows bat/cmd 작성 규칙 |
| `rules/file-edit-protocol.md` | null bytes 방지·Edit 도구 사용 기준·Python heredoc 패턴 |
| `rules/DESIGN.md` | 디자인 시스템 레퍼런스 |

---

## 스킬 인덱스 (.claude/skills/)

> 사용 가능한 스킬 전체 목록: [skills/SKILLS.md](skills/SKILLS.md)
> V2 코드 작업(디버그·리팩터·리뷰) + 디자인·UX + 비즈니스 스킬 분류 포함

## 커맨드 인덱스 (.claude/commands/)

> 사용 가능한 커맨드 전체 목록: [commands/COMMANDS.md](commands/COMMANDS.md)
> `/checkpoint` · `/save-session` · `/verify` + 비즈니스·제품 커맨드 분류 포함

---

## 메모리 시스템 (.claude/memory/)

> Claude 행동 학습 기록. 인덱스는 시스템이 자동 로드: `C:\Users\User\.claude\projects\c--LinkDropV2\memory\MEMORY.md`
> 개별 파일 위치: `.claude/memory/*.md`

---

## 설계 아카이브 (.claude/archives/)

| 문서 | 내용 |
|------|------|
| `archives/01_V2_프론트_설계_확정.md` | 라우트 구조·컴포넌트·데이터·테마 토큰 전체 확정 |
| `archives/02_라우트그룹_404_원인분석.md` | Route Group 404 원인·수정 기록 |
| `archives/03_V2_회원구분 및 역할.md` | role 체계·진입 조건·수당 구조·Supabase 스펙 |
| `archives/04_마스코트_캐릭터_배치_설계.md` | 우주인 마스코트 2회 배치 설계 스펙 |
| `archives/05_랜딩페이지_작성원칙.md` | 랜딩페이지 6대 작성 원칙·콤보 색상 10종·마스코트 기준 |
