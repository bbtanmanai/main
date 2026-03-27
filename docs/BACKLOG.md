# LinkDrop 개발 백로그

> 최종 업데이트: 2026-03-26
> 규칙: 새 항목 발견 시 즉시 여기에 추가. 완료 시 ✅ 체크. 대화마다 이 파일 확인.

---

## 🔵 추후 구현 (보류 중)

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| F-1 | Whisper 기반 영상 정밀 분석 (script 페이지) | ⬜ | 현재: YouTube URL → NLM 자동자막 기반 분석 (표면적). 개선: yt-dlp 오디오 추출 → faster-whisper STT → 전체 발화 텍스트 → NLM 주입 → 심층 분석. 인프라 준비 완료(`whisper-stt` 엔드포인트, `text_content` 파라미터 존재). **보류 이유: CPU 환경 기준 10분 영상 → +4~5분 대기 발생. GPU 서버 도입 또는 앞 5분 제한 방식으로 대기 2~3분 억제 후 구현 검토** |

---

## 🚨 긴급 해결 (YouTube 품질 대응)

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| U-1 | ★ SceneRenderer 비주얼타입 전용 컴포넌트 교체 | ⬜ | **핵심 품질 문제** — 현재 10종 visual_type 모두 TextCard 1개로 출력됨. JSON 데이터 완전 낭비. SceneRenderer를 타입별 전용 컴포넌트 라우터로 교체: StatCard(숫자+트렌드) / ComparisonTable(2열 실제 표) / Timeline(단계 연결선) / IconGrid(그리드 레이아웃) / RankingList(순위 표시) / QuoteHero(대형 인용구) / SplitScreen(좌우 분할) / Flowchart(노드 흐름도) / KeyPoint(핵심 강조) / FullVisual(텍스트 최소). YouTube "자동 생성 슬라이드쇼" 판단 핵심 원인 |
| U-2 | Remotion 역할 분리 — 씬 클립 전용 렌더러로 전환 | ⬜ | 현재: Remotion이 전체 영상 1개 Composition 렌더 (배경+오디오+자막 전부 포함) → 잘못된 구조. 변경: Remotion = 씬별 비주얼 오버레이만 렌더(clip_N_visual.webm, 투명배경, 병렬처리) / FFmpeg = 배경+오버레이+TTS+자막 합성 → concat → final.mp4. 5~10분 영상 확장 전제 조건 |
| U-3 | 데스크톱 앱 폐기 → 웹 전용 전환 | 🔄 | **Electron 파일 삭제 완료(2026-03-24)**. 남은 작업: 렌더링 서버(FastAPI+FFmpeg+Remotion) + R2 결과물 저장 + Supabase render_jobs 테이블(job queue) + 프론트 5초 폴링. UX: "생성 중 — 다른 작업을 하셔도 됩니다" 진행률 표시 + 완료 시 토스트 알림. U-1·U-2 구조 개편과 동시 진행 |
| U-4 | ★ longform 시나리오 → NLM 템플릿 라이브러리 전환 | ⬜ | 문서: `docs/product/119-nlm-template-library.md` | 현재: Gemini 즉석 생성(부실, 근거 없음) → 변경: LinkDrop이 NLM-05로 주제별 고품질 시나리오 사전 대량 생성 → Supabase scenarios 테이블 저장(지식 템플릿 라이브러리) → 사용자가 주제 선택 시 NLM 시나리오 매칭 → 씬별 검토·수정(창작자 목소리 주입) → 영상 생성. 기존 Gemini 생성 5,917개는 NLM 생성분으로 점진 교체. M-8 방향 확정 |
| U-5 | longform 훅 하이브리드 구조 (첫 15초 수동 + 이후 자동) | ⬜ | 씬 0 (0~15초): 사용자가 Google Flow 이미지 or 직접 촬영 영상 업로드 (120UI 사이드 패널에서 프롬프트 제공) → 씬 1~N: 기존 자동 파이프라인(R2 배경+visual_type+TTS). YouTube 첫 15초 고품질 → 알고리즘 통과 전략 |
| U-5b | longform 씬별 검토·수정 UI 강제화 | ⬜ | 시나리오 생성 후 모든 씬 1회 검토 필수(영상 제작 버튼 조건). 씬별: "내 말로 바꾸기(직접편집)" / "AI 재작성 요청(힌트 1줄 입력)" / "OK 그대로" 3가지 액션. 창작자 목소리 주입 핵심 단계 |
| U-6 | Supertone TTS 연동 (LF-12) | ⬜ | edge-tts 기계음 → YouTube 자동생성 콘텐츠 감지 1순위. c13=Andrew(Supertone), c6=injoon, c3=sunhi 매핑 확정 |

---

## 🔴 현재 집중 (114, 115 문서)

### 115 — SVG 비디오용 캐릭터 표준화
| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| 115-1 | ★ 115 문서 v3.0 재설계 | ✅ | 5-Grid 파츠 분리 체계 + 좌표 JSON + SVG 애니메이션 사양 + 립싱크 |
| 115-2 | eyes_Grid / arm_Grid / head_Grid 프롬프트 | ✅ | 115 문서에 영문 프롬프트 4종 포함 |
| 115-3 | c3 캐릭터 5-Grid 생성 | ⬜ | AI 이미지 생성 (사용자 작업) |
| 115-4 | 캘리브레이션 GUI 도구 | ✅ | 프로그램 [🎯 캐릭터 설정] → 이미지 클릭으로 6파츠 좌표 지정 → calibration.json 저장 |
| 115-5 | 슬라이싱 스크립트 v3.0 | ✅ | `slice_character_grids.py` — 5-Grid 대응, calibration.json 우선 로드 |
| 115-6 | Remotion 캐릭터 컴포넌트 v3.0 | ✅ | `Character.tsx` — 6파츠 구조, 호흡/흔들림/깜빡임/립싱크/포즈 전환. 캘리브레이션 후 파츠 분리 활성화 |

### 114 — Idea 설계도 (biz/idea)
| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| 114-1 | 유사 시나리오 매칭 고도화 (Jaccard → 임베딩) | ⬜ | 현재 단순 유사도 |
| 114-2 | 씬 편집 메타 확장 (B-roll/CTA/컷 길이) | ⬜ | |
| 114-3 | 내보내기 기능 (촬영 대본/SRT/편집 가이드) | ⬜ | |
| 114-4 | 화풍/성우 드롭다운 실제 로직 연결 | ⬜ | UI만 존재 |

---

## 🟡 키프레임 페이지 (진행 중 / 미완료)

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| KF-1 | 외부 이미지 생성 도구 연동 | 🔄 | `keyframe_tools.json` 생성 완료(6개 도구: Firefly/Midjourney/ImageFX/Ideogram/Leonardo/Bing). 키프레임 페이지 내 도구 섹션 UI 구현 미완 — 클릭 시 프롬프트 자동 복사 + 외부 사이트 새 탭 오픈 |
| KF-2 | 화풍 아코디언 + 자동 선택 | ✅ | `keyframe_style.json` 22종 화풍, niche 기반 자동선택, 접힘 기본값 |
| KF-3 | 씬 이미지 IndexedDB 저장 | ✅ | Blob 직접 저장(base64 없음), sessionStorage UUID 키, 로그아웃 전까지 유지 |
| KF-4 | 해상도 선택 (9:16 / 16:9) | ✅ | 제목 카드 옆 2-column 배치 |
| KF-5 | 영상 수동 제작 팁 서브페이지 | ✅ | `/content/keyframe/tips` — 120UI 카드그리드+패널. tips 배너 키프레임 페이지 중앙 배치 |

## 🟡 이번 대화에서 발견된 미완료 (longform 페이지)

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| LF-1 | 데스크톱 앱 ↔ 웹 연동 검증 | ✅ | 20씬 전체 플로우 테스트 완료. 시나리오→프로그램→비주얼타입→TTS→Remotion→MP4 (70초, 2.5MB, 50초 영상) |
| LF-2 | 데스크톱 앱 2단계 영상 로직 (16:9 → 9:16+자막) | ✅ | `convert_9x16.py` — 블러배경+크롭+자막번인. 1차 완료 후 자동 실행. 3씬 테스트 통과 |
| LF-3 | tone/emotion이 데스크톱 파이프라인에 미반영 | ⬜ | 시나리오 생성에만 반영, 키프레임/영상에는 미반영 |
| LF-4 | voice 미리듣기 URL 검증 + 에러 피드백 | ⬜ | previewUrl 잘못되면 무반응 |
| LF-5 | Step 3 직접입력 모드에서 "스타일" 빈 배지 | ⬜ | style null일 때 처리 |
| LF-6 | 동의 모달 네트워크 실패 시 Supabase 기록 누락 | ⬜ | 법적 증빙 구멍 |
| LF-12 | 외부 TTS MP3 + Whisper 타이밍 | ⬜ | 현재 edge-tts 품질 부족 → 외부 TTS(ElevenLabs 등) MP3 + faster-whisper 로컬 타이밍 추출. A방식 확정. 추후 수정 |
| LF-13 | 캐릭터별 성우 지정 | ⬜ | 캐릭터 JSON에 voice_id 필드 추가. 캐릭터 선택 시 성우 자동 연동. characterimage.json + 프로그램 UI |
| LF-7 | ★ Remotion 영상 렌더링 전환 | ✅ | 3씬 테스트 완료. 시나리오→Gemini 비주얼타입→TTS→Remotion→MP4 (60초, 2.8MB). `/api/render-remotion` 엔드포인트 |
| LF-8 | Remotion 비주얼타입 컴포넌트 개발 | ✅ | 10개 타입: StatCard, QuoteHero, ComparisonTable, KeyPoint, Timeline, SplitScreen, IconGrid, RankingList, Flowchart, FullVisual |
| LF-9 | Remotion 화풍 CSS 테마 시스템 | ✅ | 9개 테마: ghibli-real, hollywood-sf, anime-sf, neo-noir, pop-art, ink-wash, pixar-3d, reality, sticker-cutout |
| LF-10 | edge-tts SRT 타이밍 출력 | ✅ | tts_client.py — MP3 + SRT(문장별 타임스탬프) + word_timings JSON 동시 출력 |
| LF-11 | Gemini 비주얼타입 JSON 생성 프롬프트 | ✅ | `visual_type_generator.py` — 20씬 테스트 완료. gemini-2.5-flash 사용. |

---

## 🟣 자동화 인프라

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| 117 | 미드저니 배경이미지 자동 생성 & R2 업로드 | ⬜ | Playwright 웹뷰 + 5분 주기 + 화풍별 프롬프트 → R2 자동 저장. 문서: `docs/product/117-midjourney-bg-automation.md` |
| 118 | skill-2-notebooklm-video 스킬 구현 | ⬜ | NLM-MCP만 사용. YouTube URL → NLM 소스 → 대본 생성 → Audio Overview + FFmpeg → MP4. 문서: `docs/product/118-notebooklm-video-skill.md` |

---

## 🟢 중장기 (메모리 기준)

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| M-1 | executeStep 바디 캡처 | ⬜ | `opal_test/capture_execute_step.py` |
| M-2 | 로컬 Agent 웹소켓 통신 구조 설계 | ⬜ | 현재 HTTP 폴링 |
| M-3 | 9:16 영상 변환 파이프라인 (1차→2차) | ⬜ | FFmpeg crop+pad+자막 |
| M-4 | Google Cloud TTS API 활성화 | ⬜ | 현재 edge-tts 무료 사용 중 |
| M-5 | BGM 파일 준비 (assets/bgm/) | ⬜ | |
| M-6 | 사용자 분산 아키텍처 (OAuth + BGL 배포) | ⬜ | |
| M-7 | Opal AI 타이머 실제 토큰 TTL 연동 | ⬜ | 현재 페이지 로드 시 60분 고정 |
| M-8 | ★ 시나리오 수집/구성 전면 개편 | ⬜ | 영상제작 플로우 완성 후 착수. NotebookLM 컨텍스트 + Gemini 생성 + Supabase scenarios 테이블 전체 재설계 예정 |
| M-9 | 데스크톱 앱 올인원 패키징 | ~~폐기~~ | Electron 앱 삭제(2026-03-24). U-3 웹 전용 전환으로 대체. 불필요 |
| M-10 | 웹 → 프로그램 자동 실행 (Custom Protocol) | ~~폐기~~ | 데스크톱 앱 폐기로 불필요. `linkdrop://` 프로토콜도 삭제 대상 |
| M-11 | NLM 오디오 기반 영상 재구성 파이프라인 | ⬜ | NLM Video Overview → MP3 추출 → Whisper STT → SRT 자막 생성(오디오 싱크 완벽) → R2 배경이미지 + 자막 → FFmpeg 합성 → 고품질 MP4. 시나리오 텍스트 미사용(타이밍 불일치 문제). NLM 우수 오디오 품질 × LinkDrop 시각 파이프라인 결합 |
| M-12 | NLM-01 → 소스 자동 수집 → NLM-05 → 시나리오 고도화 파이프라인 | ⬜ | NLM-01 채널 벤치마킹으로 주제 선택 → YouTube 검색+웹크롤링으로 관련 자료 10개 자동 수집 → NLM-05 소스 주입(실제 데이터/사례/근거 포함 대본 생성) → Gemini가 NLM 대본을 visual_type JSON으로 구조화 변환 → Remotion+FFmpeg 영상 생성. 현재 Gemini 단독 시나리오 대비 내용 품질 대폭 향상. 전제: 소스 자동 수집 레이어 구현 필요 |

---

## ✅ 완료

| # | 항목 | 완료일 | 비고 |
|---|------|--------|------|
| D-1 | 해상도 선택 제거 → 자동 2단계 | 2026-03-18 | page.tsx + pipeline_server.py + logic.py |
| D-2 | 감정 & 톤앤매너 필수 선택 | 2026-03-18 | step1Done 조건 변경 |
| D-3 | TextStylePicker UI 제거 | 2026-03-18 | 기본값 box 유지 |
| D-4 | 웹 → 데스크톱 앱 전환 (서버 파이프라인 제거) | 2026-03-18 | /api/load-scenario |
| D-5 | FastAPI body: dict → Request.json() 수정 | 2026-03-18 | Pydantic v2 호환 |
| D-6 | 데스크톱 앱 포트 정리 로직 추가 | 2026-03-18 | main.js killPortProcess |
| D-7 | 시나리오 스타일 필수 선택 UI 강화 | 2026-03-18 | ★ 배지 + 안내 문구 |
| D-8 | 성우/시나리오 레이아웃 변경 (1/3:2/3) | 2026-03-18 | |
| D-9 | 시나리오 편집 auto-resize (스크롤바 제거) | 2026-03-18 | |
| D-10 | tone/emotion 라벨+설명 전달 (시나리오 생성) | 2026-03-18 | ID → 풀 설명 |
| D-11 | 115 문서 v2.0 최종 (2-Grid 체계) | 2026-03-18 | face_Grid 폐기 |
| D-12 | body_Grid / mouth_Grid 프롬프트 수정 | 2026-03-18 | 측면뷰 방지, 눈 감김 방지 |
| D-13 | c3 캐릭터 소스 3장 품질 검증 통과 | 2026-03-18 | |
| D-14 | apps/desktop Electron 앱 전체 삭제 | 2026-03-24 | U-3 웹 전용 전환 결정에 따라 폐기 |
| D-15 | keyframe_style.json 화풍 22종 + nicheCompat | 2026-03-24 | 사용자 직접 편집 가능 외부 JSON. 인물 중심 → 환경/주제 키워드 전환 완료 |
