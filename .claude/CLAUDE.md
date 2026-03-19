# LinkDrop V2 — Claude 프로젝트 지침

## 프로젝트 구조

```
C:\LinkDropV2\
├── apps/
│   ├── api/          # FastAPI 백엔드 (Python)
│   └── web/          # Next.js 프론트엔드 (TypeScript)
├── packages/tools/
│   ├── skill-0-youtube-fetcher/      # YouTube 크롤러
│   ├── skill-0-vault-source-fetcher/ # NotebookLM 소스 주입
│   ├── skill-2-scenario-factory/     # 시나리오 대량 생성
│   ├── skill-2-video-longform1/      # 롱폼 영상 생산 공정
│   │   ├── opal-access/              # CDP 인증 (Bearer Token)
│   │   └── opal-manager/            # 파이프라인 오케스트레이터
│   └── skill-3-opalvideo/           # Opal 영상 도구
├── docs/
│   ├── product/     # 기획 문서
│   └── rules/       # 에이전트 규칙
└── .claude/         # Claude 설정 (이 파일)
```

## 기술 스택

- **백엔드**: FastAPI, Python 3.11+, Supabase (supabase-py 2.x)
- **프론트엔드**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **AI**: Google Gemini API (`GOOGLE_API_KEY`), NotebookLM (`notebooklm_tools`)
- **영상**: FFmpeg, edge-tts, Pillow, PyMuPDF
- **인증**: Opal CDP Bearer Token (`~/.linkdrop-opal/profiles/default/session.json`)

## 환경 변수

`.env` (루트), `apps/web/.env.local` 사용.
절대 `.env` 파일을 git에 커밋하지 말 것.

## 코딩 규칙

- Python: `python -X utf8` 플래그 사용 (Windows CP949 인코딩 문제 방지)
- Python 가상환경: `apps/api/.venv` 사용
- API 라우트: `apps/api/services/` 하위에 서비스 분리
- 프론트엔드 데이터: `apps/web/src/data/*.json` (코드 수정 없이 편집 가능)

## 금지 사항

- `settings.local.json`에 API 키, 토큰, 시크릿을 직접 작성하지 말 것
- `git push --force` 금지
- `--no-verify` 플래그 사용 금지
- UI에서 "세션" 표현 금지 → "AI 연결", "AI 사용 가능 시간" 등 일반 언어 사용

## 모델 역할 분담

| 별칭 | 모델 | 용도 |
|------|------|------|
| haiku | claude-haiku-4-5 | 파일 탐색, 간단한 수정, 테스트 |
| sonnet | claude-sonnet-4-6 | 코드 리뷰, 기능 구현 |
| opus | claude-opus-4-6 | 아키텍처 설계, 큰 구조 결정 |

## 개발 백로그

- **`docs/BACKLOG.md`** — 모든 미완료 항목, 발견된 이슈, 우선순위 밀린 작업 기록
- 대화 시작 시 반드시 확인, 새 이슈 발견 시 즉시 추가, 완료 시 ✅ 섹션으로 이동

## 설계 원칙

- **Zero-Hands 자동화**: 사용자는 주제만 입력, 결과만 수신
- **시니어 친화 UI**: Gmarket Sans, 큰 폰트, 감성 안내 문구
- **저비용 우선**: edge-tts(무료) > Google TTS, Pillow 키프레임 > Opal HTML
- **클립별 재시도**: 실패 클립만 선택 재생성, 전체 재시작 없음
