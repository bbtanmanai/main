# LinkDrop 개발 백로그

> 최종 업데이트: 2026-03-18
> 규칙: 새 항목 발견 시 즉시 여기에 추가. 완료 시 ✅ 체크. 대화마다 이 파일 확인.

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
| M-9 | 데스크톱 앱 올인원 패키징 | ⬜ | Electron + Python Embedded + FFmpeg 정적빌드 + pip 패키지 전부 번들. 사용자 PC에 Python/FFmpeg 설치 불필요. 예상 크기 250~300MB |
| M-10 | 웹 → 프로그램 자동 실행 (Custom Protocol) | ✅ | `linkdrop://` 프로토콜 등록 + 웹 자동 실행 시도 구현 완료 |

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
