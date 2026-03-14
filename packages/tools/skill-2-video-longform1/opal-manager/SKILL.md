---
name: opal-manager
description: >
  skill-2-video-longform1 의 핵심 파이프라인 오케스트레이터.
  [0] 인증 → [1~2] 시나리오 → [3] 10개 클립 병렬 렌더링 → [4] FFmpeg 서버 병합까지
  Zero-Hands 전체 공정을 총괄합니다.
  설계 기준: docs/product/102_영상_제작_공정_설계안.md
---

# 🎬 Opal Manager Skill (오팔 매니저 스킬) v2

## 1. 개요 (Overview)

LinkDrop V2 영상 생산 공정의 **메인 오케스트레이터**입니다.
사용자가 주제 한 줄을 입력하면, 전체 공정이 Zero-Hands로 자동 완주되어 최종 영상 URL을 반환합니다.

- **엔트리포인트**: `opal-manager/logic.py`
- **인증 의존**: `../opal-access/opal_auth.py` (CDP + Bearer Token)
- **시니어 친화**: 기술 용어 없음, 감성적 안내 문구, 원클릭 완결

---

## 2. 5단계 공정 (Pipeline Overview)

```
[0단계] 인증 확인         opal-access → OpalAuthManager.ensure_token()
    ↓
[1단계] 사용자 주제 입력  topic: str (단 하나의 입력)
    ↓
[2단계] 시나리오 추출     notebooklm-cli MCP → 60초 분량 더빙 스크립트
    ↓
[3단계] 조각 영상 생성    Opal 세밀 노드 × 10개 병렬 (ThreadPoolExecutor)
                          각 클립 완성 즉시 링크드랍 서버로 스트리밍 업로드
    ↓
[4단계] 서버 통합 조립    FFmpeg 병합 + BGM/효과음 믹싱 → 최종 고화질 영상
    ↓
         사용자에게 다운로드 URL 제공
```

---

## 3. 빠른 시작 (Quick Start)

### 사전 조건
1. 오팔 로그인 완료 (opal-access)
2. notebooklm-cli 설정 완료 (NotebookLM MCP)

### 실행
```bash
# 전체 파이프라인 실행
python opal-manager/logic.py "치매 예방 습관 5가지" --app health-senior

# 특정 음성 지정
python opal-manager/logic.py "주식 뉴스 브리핑" --app stock-news --voice ko-KR-Wavenet-B
```

### 세션 점검 (렌더링 전 권장)
```bash
python opal-access/scripts/check_session.py --validate
```

### 오팔 동결 복구
```bash
python opal-manager/scripts/recover_opal.py
```

### 노드 규격 점검
```bash
python opal-manager/scripts/check_nodes.py
```

---

## 4. 파일 구조

```
skill-2-video-longform1/
├── manifest.json                 ← 스킬 메타데이터
├── opal-access/
│   ├── opal_auth.py              ← CDP 인증 코어 (쿠키 + Bearer Token)
│   ├── requirements.txt
│   └── scripts/
│       ├── login.py              ← 최초 로그인 (CDP 자동 / 수동)
│       ├── check_session.py      ← 세션 상태 확인
│       └── run_render.py         ← 단독 렌더 트리거 (디버깅용)
└── opal-manager/
    ├── logic.py                  ← ★ 메인 파이프라인 오케스트레이터
    ├── SKILL.md                  ← 이 문서
    ├── references/
    │   └── standards.md          ← 노드 규격 표준 (TextNode/Audio/Motion/Grade)
    └── scripts/
        ├── check_nodes.py        ← Opal 노드 규격 준수 여부 점검
        └── recover_opal.py       ← 동결 복구 (좀비 프로세스 제거 + 재시도)
```

---

## 5. 핵심 로직 (`logic.py`) API

### 파이프라인 전체 실행
```python
from opal_manager.logic import run_pipeline

# 기본 실행
url = run_pipeline(app_id="health-senior", topic="치매 예방 습관 5가지")

# 진행률 콜백 연동 (WebSocket 등)
def my_reporter(job):
    for clip in job.clips:
        ws.send({"index": clip.index, "progress": clip.progress, "state": clip.state})

url = run_pipeline(app_id="health-senior", topic="...", reporter=my_reporter)
```

### PipelineJob 데이터 구조
```python
@dataclass
class PipelineJob:
    app_id: str          # Opal 앱 ID
    topic: str           # 사용자 입력 주제
    voice: str           # Google TTS 음성 ID
    clips: list[ClipStatus]  # 10개 클립 상태 목록
    script: str          # NotebookLM 추출 시나리오
    final_url: str | None    # 최종 완성 영상 URL

@dataclass
class ClipStatus:
    index: int           # 0-based (0~9)
    progress: float      # 0.0 ~ 100.0
    state: str           # pending | rendering | uploading | done | failed
    retry_count: int     # 재시도 횟수
    upload_url: str | None   # 서버 업로드 완료 URL
```

---

## 6. 진행률 UI 연동 (프론트엔드)

프론트엔드는 10개 **'개별 카드형 목록'**을 노출하며, 각 카드에는:
- **원통형(Circular) 프로그레스 바**: `clip.progress` (0~100)
- **상태 텍스트**: 시니어 친화 문구로 변환

| `state` | 사용자 표시 문구 |
|---------|----------------|
| `pending` | "대기 중..." |
| `rendering` | "AI 장인이 그림을 고르는 중입니다" |
| `uploading` | "완성본을 전달하는 중입니다" |
| `done` | "생성 완료 ✓" |
| `failed` → retry | "장인이 잠시 쉬고 있습니다..." |
| `failed` (최종) | "지금은 비디오 생성을 할 수 없습니다" |

---

## 7. 오류 처리 및 복구 (Error Handling)

### 클립별 선택적 재시도
- 10개 중 1개 실패 시 **전체 재생성 없음** — 해당 클립만 최대 2회 재시도
- 모든 재시도 소진 시 사용자에게 오류 메시지 노출

### 네트워크 단절
- `step3_parallel_render()` 내 각 `_upload_clip()` 에서 `httpx.TimeoutException` 캐치
- `recover_opal.py` 로 오팔 프로세스 재기동 후 마지막 정상 씬부터 재시도

### Bearer Token 만료
- `OpalAuthManager.ensure_token()` 이 자동 갱신 (CDP 페이지 리로드 방식)
- Chrome이 닫혀 있으면 "Chrome에서 오팔 편집기를 열어두세요" 안내

---

## 8. Opal 노드 규격 표준 (references/standards.md 요약)

| 노드 | 핵심 규격 |
|------|----------|
| TextNode | Gmarket Sans, 72pt 이상, 하단 안전영역 15%, 검정 반투명 배경바 |
| AudioNode | BGM 0.0 볼륨, 음성 `ko-KR-Wavenet-D`, SE: whoosh/ding/pop |
| MotionNode | Ken-Burns-Zoom (Slow), 흔들림 0.0 |
| GradeNode | LUT는 씬 분위기 기반 (`opal_service.py` 표준화) |

---

## 9. 운영 원칙 (Design Principles)

- **최소 입력**: 사용자는 '주제' 하나만 입력. 복잡한 옵션 없음.
- **완전 은폐형 자동화**: 사용자는 아무것도 모르는 상태에서 결과물만 수신.
- **시니어 최우선**: TextNode 18px+(72pt) 고대비, Gmarket Sans 고정.
- **명료한 보고**: 성공/실패/복구 로그를 이감독님께 투명하게 보고.
- **백엔드 엔진**: Python (데이터 브릿지, 자동 트리거, 실시간 진행률 모니터링).

---

## 10. TODO (향후 연동 과제)

- [ ] `logic.py` → `apps/api/services/opal_service.py` 실제 노드 렌더링 API 연동
- [ ] `step1_get_script()` → `notebooklm-cli` MCP RPC 연동
- [ ] `_upload_clip()` → `api.linkdrop.io` 실 엔드포인트 확정
- [ ] 프론트엔드 WebSocket 진행률 콜백 연동
- [ ] CapCut 온라인 대체 시 `step4_merge()` 교체

---

*본 스킬은 LinkDrop V2 명품 영상 생산 공정의 핵심 오케스트레이터입니다.*
*설계 기준: `docs/product/102_영상_제작_공정_설계안.md`*
