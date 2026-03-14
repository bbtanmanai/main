"""
skill-2-video-longform1 — 파이프라인 오케스트레이터
=====================================================
설계 기준: docs/product/102_영상_제작_공정_설계안.md

공정 순서:
  [0] 인증 확인        (Opal Auth)
  [1] 주제 입력        (User Input)
  [2] 시나리오 추출    (NotebookLM → 씬 파싱 → 65초 이하 검증)
  [3] 조각 영상 병렬 생산  (Opal 세밀 노드 × 씬 수, 동적 결정)
  [4] 서버 통합 조립   (FFmpeg Merge + BGM)

핵심 설계 원칙:
  - 씬(클립) 수는 시나리오 내용에 따라 동적으로 결정 (고정 10개 아님)
  - 단, 최종 완성 영상 총 길이는 65초 이하여야 함
  - 씬당 예상 길이 = len(text) / TTS_CHARS_PER_SEC (한국어 TTS 기준)
"""

from __future__ import annotations

import subprocess
import sys
import io
import re
import tempfile
import threading
import time

# Windows CP949 환경에서 한글 출력 보장
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# .env 자동 로드 (루트 또는 부모 폴더)
from pathlib import Path as _Path
for _env in [
    _Path(__file__).parent / ".env",
    _Path(__file__).parent.parent.parent.parent / ".env",
    _Path(__file__).parent.parent.parent.parent.parent / ".env",
]:
    if _env.exists():
        for _line in _env.read_text(encoding="utf-8").splitlines():
            if "=" in _line and not _line.strip().startswith("#"):
                _k, _v = _line.split("=", 1)
                import os as _os
                _os.environ.setdefault(_k.strip(), _v.strip())
        break

import httpx
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

# ── 인증 모듈 (opal-access) ──────────────────────────────────────────────────
OPAL_ACCESS_DIR = Path(__file__).parent.parent / "opal-access"
sys.path.insert(0, str(OPAL_ACCESS_DIR))
from opal_auth import OpalAuthManager  # noqa: E402

import os

# ── Supabase 시나리오 재고 클라이언트 ────────────────────────────────────────
_SCENARIO_FACTORY_DIR = Path(__file__).parent.parent.parent / "skill-2-scenario-factory"
if str(_SCENARIO_FACTORY_DIR) not in sys.path:
    sys.path.insert(0, str(_SCENARIO_FACTORY_DIR))

# ── 영상 길이 제약 ────────────────────────────────────────────────────────────
MAX_VIDEO_SEC   = 200.0  # 최종 영상 최대 길이 (초, 씬 20개 × 10초)
MIN_SCENE_COUNT = 3      # 최소 씬 수
MAX_SCENE_COUNT = 20     # 최대 씬 수 (Opal App 병렬 풀 한도)
TTS_CHARS_PER_SEC = 4.5  # 한국어 TTS 평균 속도 (글자/초)
TARGET_SCENE_SEC  = 10.0 # 씬당 목표 재생 시간 (초)
TARGET_SCENE_CHARS = int(TARGET_SCENE_SEC * TTS_CHARS_PER_SEC)  # 45자

# ── 클립 렌더링 ───────────────────────────────────────────────────────────────
CLIP_TIMEOUT  = 120   # 초: 단일 클립 렌더링 최대 대기
MAX_RETRY     = 2     # 클립당 최대 재시도 횟수
UPLOAD_ENDPOINT = "https://api.linkdrop.io/v1/clips/upload"
MERGE_ENDPOINT  = "https://api.linkdrop.io/v1/clips/merge"

# Reporter 출력 보호용 락
_reporter_lock = threading.Lock()

# ── 스타일별 프롬프트 지시문 (scenario-factory 전용 — 참조용 보존) ────────────
STYLE_DIRECTIVES: dict[str, str] = {
    "ranking": """구성 방식: TOP N 랭킹형 (시청자를 끝까지 붙잡는 역순 공개)

씬 구성 규칙:
  [씬1] 반드시 충격적인 사실이나 강한 질문으로 시작 (호기심 갭 전략)
         예) "의사들이 60대에게 절대 먹지 말라고 경고한 식품이 있습니다."
         예) "하루 한 컵으로 혈압이 15% 낮아진 식품, 무엇일까요?"
  [씬2~3] 낮은 순위부터 시작. 각 순위마다 ① 이름 발표 ② 핵심 성분/수치 ③ 체감 효과 3단 구조.
           단순 나열 금지 — 반드시 수치나 연구명 포함.
           나쁜 예) "3위는 달걀입니다. 단백질이 풍부합니다."
           좋은 예) "3위, 달걀입니다. 하루 2개가 근육 손실을 37% 늦춘다는 서울대병원 연구 결과가 있습니다."
  [중반] 반전 씬 1개 필수: "사실 많은 분이 이 식품을 잘못 먹고 있습니다."
  [씬N-1] 1위 발표 직전 빌드업: "드디어 1위, 이것을 들으면 깜짝 놀라실 겁니다."
  [씬N] 클로징: 요약 + 시청자 행동 유도 (댓글/실천 다짐)
         예) "오늘 알려드린 5가지 중 하나라도 오늘 저녁 식탁에 올려보세요. 댓글로 알려주시면 응원합니다!"
""",
    "storytelling": """구성 방식: 감성 스토리텔링형 (시청자가 주인공에 감정 이입하게 만드는 구조)

씬 구성 규칙:
  [씬1] 실제 인물(할머니·아버지·이웃 어르신 등) 등장 + 고통의 장면으로 즉시 시작.
         예) "72세 어머니는 아침마다 무릎이 너무 아파 계단을 못 내려오셨습니다."
         예) "퇴직 후 아버지, 6개월 만에 체중이 11킬로 불었습니다."
  [씬2~3] 문제 심화: 병원·약·민간요법 시도 → 효과 없음. 절망감 표현.
  [씬4] 전환점: 우연히 알게 된 방법 또는 전문가의 한 마디. 구체적으로 묘사.
  [씬5~N-2] 변화 과정: 1주일 후, 2주일 후, 1달 후 순차 변화. 수치로 표현 필수.
              예) "3주가 지나자 무릎 통증이 절반으로 줄었고, 혈압도 128까지 내려갔습니다."
  [씬N-1] 감동 클라이맥스: 가족의 반응 또는 의사 소견.
  [씬N] 시청자에게 직접 말 걸기: "혹시 지금 비슷한 상황이신가요? 댓글에 고민 남겨주세요."
""",
    "qa": """구성 방식: 질문·답변형 (시청자의 머릿속 의문을 정확히 짚어 해소)

씬 구성 규칙:
  [씬1] 반드시 시청자가 속으로 궁금해했을 질문으로 시작. 단정적이고 짧게.
         예) "두부, 매일 먹으면 오히려 독이 될까요?"
         예) "걷기 운동, 하루 몇 분이어야 진짜 효과가 있을까요?"
  [씬2] 많은 사람의 오해 또는 잘못된 상식 지적 → 긴장감 유발.
  [씬3~4] 핵심 답변 공개 + 근거 수치. 반드시 "~에 따르면", "연구 결과" 포함.
  [씬5~N-2] 심화 Q: 연속으로 이어지는 세부 질문들. 각 씬이 하나의 Q&A 단위.
              예) "그렇다면 두부 단백질과 고기 단백질, 차이가 있을까요? 사실 거의 동일합니다."
  [반전 씬] 전문가조차 놀란 뜻밖의 팩트 1개 필수.
  [씬N] 마무리 질문 + 댓글 유도: "여러분은 어떻게 생각하시나요? 댓글로 알려주세요!"
""",
    "comparison": """구성 방식: A vs B 비교형 (명확한 대결 구도로 몰입 유도)

씬 구성 규칙:
  [씬1] 대결 구도를 강렬하게 선언. 두 대상의 이름 즉시 공개.
         예) "달걀 vs 두부, 60대 건강에는 무엇이 진짜 이길까요? 오늘 완전히 결론 냅니다."
  [씬2] A의 최대 강점 소개 (수치 포함)
  [씬3] B의 최대 강점 소개 (수치 포함)
  [씬4~5] 카테고리별 교차 비교: 단백질 / 흡수율 / 가격 / 조리법 각 씬마다 승자 발표.
           예) "단백질 함량은? 달걀 완승입니다. 흡수율은? 두부가 오히려 앞섭니다."
  [반전 씬] 예상 밖 결과: "그런데 60대에 한해서는 결과가 달라집니다."
  [씬N-1] 최종 종합 판정 + 상황별 추천 (누구에게 무엇이 맞는지)
  [씬N] 시청자 투표 유도: "여러분의 선택은 무엇인가요? 댓글로 A 또는 B 남겨주세요!"
""",
    "expert": """구성 방식: 전문가 권위형 (신뢰와 근거로 시청자를 설득)

씬 구성 규칙:
  [씬1] 권위 있는 발언으로 시작. 반드시 직함/기관명 포함.
         예) "세계보건기구(WHO)가 60대 이상에게 강력 권고한 습관이 있습니다."
         예) "서울대학교병원 내과 교수가 환자들에게 첫 번째로 조언하는 것이 있습니다."
  [씬2~3] 문제 규모 수치화: "국내 60대 중 68%가 이 사실을 모릅니다."
  [씬4~N-2] 근거 기반 설명. 각 씬마다 ① 주장 ② 메커니즘(왜?) ③ 수치 증거 3단 구조 유지.
              예) "하루 30분 걷기는 혈압을 평균 8mmHg 낮춥니다. 심장이 펌프질을 더 효율적으로 하기 때문입니다.
                   실제로 미국심장학회 8,000명 연구에서 심혈관 사망률 35% 감소가 확인됐습니다."
  [씬N-1] 주의사항 1~2개: "단, 이런 분들은 반드시 의사와 상담 후 실천하세요."
  [씬N] 행동 촉구: "오늘 당장 시작할 수 있는 첫 번째 한 가지만 선택하세요."
""",
    "before_after": """구성 방식: 비포/애프터형 (극적 대비로 변화의 가능성을 보여줌)

씬 구성 규칙:
  [씬1] Before 상황을 가장 강렬한 고통 장면으로 시작.
         예) "3년 전 저는 하루에 진통제를 4알씩 먹었습니다. 무릎이 너무 아파서요."
         예) "아침에 일어나는 게 두려웠습니다. 온몸이 납처럼 무거웠거든요."
  [씬2~3] Before 심화: 일상생활의 구체적인 불편함. 가족의 걱정. 포기했던 것들.
  [씬4] 전환점: 딱 하나의 변화 시작. 거창하지 않게.
         예) "그러다 우연히 유튜브에서 본 영상 하나가 모든 것을 바꿨습니다."
  [씬5~N-2] After 과정: 1주, 1달, 3달 변화를 구체적 수치와 함께. 감정 표현 포함.
              예) "한 달이 지나자 아침이 달라졌습니다. 체중이 4.2킬로 빠졌고, 무릎 통증은 절반으로 줄었습니다."
              예) "3개월 후, 15년 만에 처음으로 손자와 함께 등산을 했습니다."
  [씬N-1] 현재: 구체적인 삶의 변화 + 감사 표현.
  [씬N] 시청자에게 직접 건네는 따뜻한 한 마디 + 다음 행동 제안.
         예) "여러분도 충분히 할 수 있습니다. 오늘 저녁, 딱 10분만 시작해보세요."
""",
}

DEFAULT_STYLE = "ranking"


def build_script_prompt(topic: str, style: str = DEFAULT_STYLE) -> str:
    """스타일을 반영한 시나리오 생성 프롬프트를 조립합니다."""
    directive = STYLE_DIRECTIVES.get(style, STYLE_DIRECTIVES[DEFAULT_STYLE])
    total_chars = int(MAX_VIDEO_SEC * TTS_CHARS_PER_SEC)   # 1,372자
    scene_count = int(MAX_VIDEO_SEC / TARGET_SCENE_SEC)    # 30씬
    return f"""당신은 유튜브 구독자 100만 채널의 수석 영상 시나리오 작가입니다.
아래 주제로 시청자가 영상을 끝까지 보게 만드는 고품질 나레이션 스크립트를 작성하세요.

━━━ 주제 ━━━
{topic}

━━━ 구성 방식 ━━━
{directive}

━━━ 품질 기준 (반드시 준수) ━━━
① 첫 씬은 반드시 '후크(Hook)' — 충격적 사실, 반전 질문, 강한 공감 중 하나로 시작
   • 금지: "오늘은 ~에 대해 알아보겠습니다" 같은 교과서식 오프닝
   • 필수: 첫 문장을 들은 순간 시청자가 계속 보고 싶어지는 문장

② 매 씬마다 구체적 수치·이름·근거 중 하나 이상 포함
   • 나쁜 예: "달걀은 단백질이 풍부합니다."
   • 좋은 예: "달걀 하나에 단백질 6.3g. 60대 하루 권장량의 12%를 한 번에 채웁니다."

③ 감정 곡선 설계 — 다음 순서로 시청자 감정을 이끌 것
   호기심(첫 씬) → 공감/불안(전반부) → 정보 흡수(중반) → 놀라움/안도(후반) → 행동 의지(마지막 씬)

④ 각 씬은 독립적으로 완결되지만 다음 씬이 궁금해지도록 끝맺음
   • 각 씬 마지막 문장은 다음 씬을 기대하게 만드는 '열린 끝' 또는 '다음 정보 예고' 활용

⑤ 마지막 씬에는 반드시 시청자 행동 유도 포함
   (댓글 남기기 / 실천 다짐 / 주변 공유 / 구독 요청 중 하나)

━━━ 형식 제약 ━━━
- 씬 수: {scene_count}개 내외 (최소 20개, 최대 35개)
- 씬당 텍스트: 40~50자 (성우 낭독 시 약 10초 분량, 2~3문장)
- 전체 합산: 최대 {total_chars}자
- 대상: 60대 이상 시니어 — 한자어·영어 전문용어 최소화, 짧고 명확한 문장
- 출력: [씬N] 나레이션 텍스트만 (BGM 지시, 화면 설명, 주석, 안내문 일절 금지)

━━━ 출력 형식 ━━━
[씬1] (후크 문장). (이어지는 문장).
[씬2] (내용 문장). (수치/근거 포함 문장).
[씬3] ...
(이하 계속)"""


# ── 데이터 클래스 ────────────────────────────────────────────────────────────
@dataclass
class SceneTiming:
    """씬별 예상 재생 시간."""
    index: int
    text: str
    estimated_sec: float   # len(text) / TTS_CHARS_PER_SEC


@dataclass
class ClipStatus:
    index: int                 # 0-based
    scene_text: str = ""       # 해당 씬의 나레이션 텍스트
    estimated_sec: float = 0.0 # 예상 재생 시간 (초)
    progress: float = 0.0      # 렌더링 진행률 0~100
    state: str = "pending"     # pending | rendering | uploading | done | failed
    error: str = ""
    retry_count: int = 0
    local_path: Optional[Path] = None
    upload_url: Optional[str] = None
    keyframe_path: Optional[Path] = None  # 키프레임 PNG
    tts_path: Optional[Path] = None       # TTS MP3


@dataclass
class PipelineJob:
    app_id: str
    topic: str
    voice: str = "ko-KR-Wavenet-D"
    style: str = "ranking"             # 시나리오 구성 스타일
    art_prompt: str = ""               # 화풍 프롬프트 (NotebookLM 슬라이드 주입용)
    clips: list[ClipStatus] = field(default_factory=list)
    script: str = ""
    scenes_json: list[dict] = field(default_factory=list)  # [{index, text, estimated_sec}]
    hook: str = ""                     # [씬1] 텍스트 — 최종 영상 상단 오버레이용
    aspect: str = "16:9"              # 출력 종횡비: "16:9" | "9:16"
    estimated_total_sec: float = 0.0
    final_url: Optional[str] = None
    started_at: float = field(default_factory=time.time)
    work_dir: Optional[Path] = None    # 클립 저장 작업 디렉터리

    @property
    def clip_count(self) -> int:
        return len(self.clips)


# ── 씬 파싱 & 길이 추정 ───────────────────────────────────────────────────────
def parse_script_scenes(script: str) -> list[SceneTiming]:
    """
    '[씬N] 텍스트' 형식 스크립트를 씬 리스트로 파싱.
    씬 수는 동적 — 내용에 따라 6~13개 등 자유롭게 결정됨.
    """
    pattern = re.compile(r"\[씬(\d+)\]\s*(.+?)(?=\[씬\d+\]|$)", re.DOTALL)
    matches = pattern.findall(script)
    if not matches:
        return []

    scenes = []
    for num_str, text in sorted(matches, key=lambda m: int(m[0])):
        text = text.strip()
        if not text:
            continue
        est = len(text) / TTS_CHARS_PER_SEC
        scenes.append(SceneTiming(index=int(num_str) - 1, text=text, estimated_sec=round(est, 1)))
    return scenes


def validate_scenes(scenes: list[SceneTiming]) -> tuple[list[SceneTiming], float]:
    """
    씬 리스트 유효성 검증 + 자동 트림.
    - 씬 수 부족 시 RuntimeError
    - 씬 수 초과 시: 앞 MAX_SCENE_COUNT개만 사용 (자동 트림)
    - 총 길이 초과 시: 뒤에서부터 씬 제거해 MAX_VIDEO_SEC 이하로 맞춤
    반환: (검증된 씬 리스트, 예상 총 재생 시간)
    """
    if len(scenes) < MIN_SCENE_COUNT:
        raise RuntimeError(
            f"씬이 너무 적습니다 ({len(scenes)}개). "
            f"최소 {MIN_SCENE_COUNT}개 이상이어야 합니다."
        )

    # 씬 수 상한 트림 (Opal App Pool 최대 슬롯 = 20개)
    trimmed = list(scenes)
    if len(trimmed) > MAX_SCENE_COUNT:
        print(f"[2] 씬 수 트림: {len(trimmed)}개 → {MAX_SCENE_COUNT}개")
        trimmed = trimmed[:MAX_SCENE_COUNT]

    # 총 길이 초과 → 뒤에서부터 씬 제거 (자동 트림)
    total_sec = sum(s.estimated_sec for s in trimmed)

    if total_sec > MAX_VIDEO_SEC:
        original_count = len(trimmed)
        while trimmed and total_sec > MAX_VIDEO_SEC:
            removed = trimmed.pop()
            total_sec -= removed.estimated_sec
        trimmed_count = original_count - len(trimmed)
        print(
            f"[2] 자동 트림: {original_count}개 씬 중 뒤 {trimmed_count}개 제거 "
            f"({total_sec:.1f}초 → {MAX_VIDEO_SEC}초 이하)"
        )

        if len(trimmed) < MIN_SCENE_COUNT:
            raise RuntimeError(
                f"트림 후 씬이 {len(trimmed)}개로 너무 적습니다. "
                "시나리오를 다시 생성하세요."
            )

    return trimmed, round(total_sec, 1)


# ── 진행률 리포터 ─────────────────────────────────────────────────────────────
def default_reporter(job: PipelineJob) -> None:
    """콘솔 기본 진행률 출력 (스레드 안전, 평균 진행률 기반)."""
    with _reporter_lock:
        n = job.clip_count
        if n == 0:
            return
        done = sum(1 for c in job.clips if c.state == "done")
        avg_pct = sum(c.progress for c in job.clips) / n
        filled = int(avg_pct / 10)
        bar = "█" * filled + "░" * (10 - filled)
        print(f"\r  [{bar}] {avg_pct:4.0f}%  완료 {done}/{n}", end="", flush=True)


# ── 단계별 함수 ──────────────────────────────────────────────────────────────

def step0_check_auth() -> OpalAuthManager:
    """[0단계] 오팔 세션 인증 확인."""
    auth = OpalAuthManager()
    if not auth.is_authenticated():
        raise RuntimeError(
            "오팔 세션이 없습니다.\n"
            "  python opal-access/scripts/login.py"
        )
    token = auth.ensure_token()
    if not token:
        raise RuntimeError(
            "Bearer Token 갱신 실패. Chrome에서 오팔 편집기를 열어두고 다시 실행하세요."
        )
    print("[0] 인증 확인 완료")
    return auth


def step1_get_script(job: PipelineJob) -> str:
    """[1단계] Supabase 시나리오 재고에서 랜덤 1개 추출."""
    from supabase_client import pop_random_scenario

    print(f"[1] Supabase 시나리오 조회 중... (template={job.app_id}, style={job.style})")
    row = pop_random_scenario(job.app_id, style=job.style or None)

    if not row and job.style:
        print(f"[1] 스타일 '{job.style}' 재고 없음 → 전체 스타일 조회")
        row = pop_random_scenario(job.app_id, style=None)

    if not row:
        raise RuntimeError(
            f"시나리오 재고가 없습니다. (template={job.app_id})\n"
            "skill-2-scenario-factory로 시나리오를 먼저 생성하세요."
        )

    script = row.get("script", "").strip()
    if not script:
        raise RuntimeError("Supabase에서 가져온 시나리오가 비어 있습니다.")

    # scenes_json 있으면 job에 직접 주입 (step2 파싱 스킵용)
    job.scenes_json = row.get("scenes_json") or []

    # hook: 영상 상단 검정 바에 전체 구간 오버레이할 문장
    job.hook = (row.get("hook") or "").strip()
    if not job.hook and job.scenes_json:
        job.hook = job.scenes_json[0].get("text", "").strip()

    print(f"[1] 시나리오 로드 완료 (topic={row.get('topic')}, {len(script)}자, scenes={len(job.scenes_json)}개)")
    return script


def step2_parse_and_validate(job: PipelineJob) -> None:
    """
    [2→3 브릿지] 씬 파싱 → 검증 → job.clips 동적 생성.
    scenes_json이 있으면 파싱 스킵 (Supabase에서 사전 파싱된 데이터 직접 사용).
    """
    if job.scenes_json:
        scenes = [
            SceneTiming(
                index=s["index"],
                text=s["text"],
                estimated_sec=s.get("estimated_sec", round(len(s["text"]) / TTS_CHARS_PER_SEC, 1)),
            )
            for s in job.scenes_json
            if s.get("text", "").strip()
        ]
        print(f"[2] scenes_json 직접 사용: {len(scenes)}개 씬")
    else:
        scenes = parse_script_scenes(job.script)
        if not scenes:
            raise RuntimeError(
                "스크립트에서 씬을 파싱할 수 없습니다.\n"
                "형식 예시: [씬1] 나레이션 텍스트"
            )

    scenes, total_sec = validate_scenes(scenes)
    job.estimated_total_sec = total_sec

    # ClipStatus 동적 생성 (씬 수 = 클립 수)
    job.clips = [
        ClipStatus(
            index=s.index,
            scene_text=s.text,
            estimated_sec=s.estimated_sec,
        )
        for s in scenes
    ]

    print(
        f"[2] 시나리오 파싱 완료: {job.clip_count}개 씬, "
        f"예상 {total_sec:.1f}초 (≤{MAX_VIDEO_SEC}초 OK)"
    )


def _render_single_clip(
    clip: ClipStatus,
    auth: OpalAuthManager,
    job: PipelineJob,
    reporter: Callable[[PipelineJob], None],
) -> ClipStatus:
    """
    단일 클립 렌더링 + 즉시 업로드.
    clip.scene_text 와 clip.estimated_sec 을 Opal 노드에 투입.
    실패 시 MAX_RETRY 까지 재시도.
    """
    for attempt in range(MAX_RETRY + 1):
        try:
            clip.state = "rendering"
            clip.progress = 0.0
            reporter(job)

            _real_render(clip, reporter, job)

            clip.state = "uploading"
            reporter(job)
            _upload_clip(clip)

            clip.state = "done"
            clip.progress = 100.0
            reporter(job)
            return clip

        except Exception as e:
            clip.retry_count = attempt + 1
            clip.error = str(e)
            if attempt < MAX_RETRY:
                with _reporter_lock:
                    print(
                        f"\n  [씬{clip.index + 1}] 장인이 잠시 쉬고 있습니다... "
                        f"(재시도 {attempt + 1}/{MAX_RETRY})"
                    )
                time.sleep(5)
            else:
                clip.state = "failed"

    return clip


def _real_render(
    clip: ClipStatus,
    reporter: Callable[[PipelineJob], None],
    job: PipelineJob,
) -> None:
    """
    실제 클립 렌더링:
      1. Google Cloud TTS / edge-tts → tts_N.mp3
      2. 키프레임 PNG (pre-generated, clip.keyframe_path)
      3. FFmpeg zoompan Ken Burns → clip_N.mp4
    """
    import os
    from tts_client import synthesize_to_mp3, get_mp3_duration

    work_dir = job.work_dir or Path(tempfile.gettempdir())
    work_dir.mkdir(parents=True, exist_ok=True)

    # ── Step A: TTS ──────────────────────────────────────────────────────────
    clip.progress = 10.0
    reporter(job)

    tts_path = work_dir / f"tts_{clip.index:02d}.mp3"
    if not tts_path.exists():
        api_key = os.environ.get("GOOGLE_API_KEY", "")
        synthesize_to_mp3(clip.scene_text, job.voice, tts_path, api_key)
    clip.tts_path = tts_path

    clip.progress = 40.0
    reporter(job)

    # ── Step B: 키프레임 PNG 확인 ───────────────────────────────────────────
    keyframe = clip.keyframe_path
    if not keyframe or not keyframe.exists():
        # 키프레임이 없는 경우 단색 PNG 생성 (비상 폴백)
        from PIL import Image
        keyframe = work_dir / f"keyframe_{clip.index:02d}.png"
        img = Image.new("RGB", (KEYFRAME_W, KEYFRAME_H), (20, 30, 60))
        img.save(str(keyframe))
        clip.keyframe_path = keyframe

    clip.progress = 55.0
    reporter(job)

    # ── Step C: FFmpeg zoompan → clip_N.mp4 (16:9, 무자막) ──────────────────
    clip_path = work_dir / f"clip_{clip.index:02d}.mp4"
    _ffmpeg_make_clip(keyframe, tts_path, clip_path)

    clip.local_path = clip_path
    clip.progress = 100.0
    reporter(job)


# ── 키프레임 크기 상수 ────────────────────────────────────────────────────────
KEYFRAME_W = 1920
KEYFRAME_H = 1080


def _ffmpeg_make_clip(
    keyframe: Path,
    tts_mp3: Path,
    output: Path,
    fps: int = 25,
) -> None:
    """
    키프레임 PNG + TTS MP3 → Ken Burns zoompan → clip_N.mp4 (16:9, 무자막).

    텍스트는 2차 9:16 영상 제작 시 FFmpeg drawtext 레이어로 추가됨.
    """
    output.parent.mkdir(parents=True, exist_ok=True)

    # TTS 길이 측정 (FFprobe)
    duration = _ffprobe_duration(tts_mp3)
    if duration <= 0:
        duration = 10.0

    frames = max(int(duration * fps), fps)

    zoom_filter = (
        f"scale={KEYFRAME_W}:{KEYFRAME_H}:force_original_aspect_ratio=decrease,"
        f"pad={KEYFRAME_W}:{KEYFRAME_H}:(ow-iw)/2:(oh-ih)/2,"
        f"zoompan="
        f"z='min(zoom+0.001,1.05)':"
        f"x='iw/2-(iw/zoom/2)':"
        f"y='ih/2-(ih/zoom/2)':"
        f"d={frames}:s={KEYFRAME_W}x{KEYFRAME_H}:fps={fps},"
        f"format=yuv420p"
    )

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", str(keyframe),
        "-i", str(tts_mp3),
        "-vf", zoom_filter,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest", "-t", str(duration + 0.5),  # TTS 길이 + 0.5초 여유
        str(output),
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"FFmpeg 클립 생성 실패 (씬{output.stem}): {result.stderr[-300:]}"
        )


def _ffprobe_duration(mp3_path: Path) -> float:
    """ffprobe로 MP3 재생 시간(초)을 반환."""
    import json
    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        str(mp3_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return float(json.loads(result.stdout)["format"]["duration"])
    except Exception:
        return 0.0


def _upload_clip(clip: ClipStatus) -> None:
    """완성된 클립을 링크드랍 서버로 업로드."""
    if not clip.local_path or not clip.local_path.exists():
        # mock 모드
        clip.upload_url = f"https://cdn.linkdrop.io/clips/mock_{clip.index:02d}.mp4"
        return

    # TODO: LinkDrop API 토큰 확정 후 인증 헤더 추가
    headers = {
        "X-Clip-Index": str(clip.index),
        "Content-Type": "application/octet-stream",
    }
    with httpx.Client(timeout=CLIP_TIMEOUT) as client:
        with open(clip.local_path, "rb") as f:
            r = client.post(UPLOAD_ENDPOINT, content=f, headers=headers)
        r.raise_for_status()
        clip.upload_url = r.json().get("url", "")
        if not clip.upload_url:
            raise RuntimeError(f"업로드 응답에 URL이 없습니다 (씬{clip.index + 1})")


def step3_parallel_render(
    job: PipelineJob,
    auth: OpalAuthManager,
    reporter: Callable[[PipelineJob], None] = default_reporter,
) -> None:
    """[3단계] 키프레임 사전 생성 → 씬 수만큼 클립 병렬 생성 + 즉시 업로드."""
    import tempfile
    from keyframe_generator import generate_keyframes

    n = job.clip_count

    # 작업 디렉터리 생성 (job당 고정)
    if not job.work_dir:
        ts = int(job.started_at)
        job.work_dir = Path(tempfile.gettempdir()) / f"linkdrop_{job.app_id}_{ts}"
    job.work_dir.mkdir(parents=True, exist_ok=True)

    # ── 키프레임 사전 생성 (기본: Pillow) ────
    print(f"[3-a] 키프레임 {n}개 생성 중...")
    keyframes = generate_keyframes(job, job.work_dir, use_opal=True)

    # 각 ClipStatus에 keyframe_path 할당
    for i, clip in enumerate(job.clips):
        if i < len(keyframes):
            clip.keyframe_path = keyframes[i]

    print(f"[3] 조각 영상 {n}개 병렬 생성 시작 (예상 {job.estimated_total_sec:.1f}초)")

    with ThreadPoolExecutor(max_workers=n) as pool:
        futures = {
            pool.submit(_render_single_clip, clip, auth, job, reporter): clip.index
            for clip in job.clips
        }
        for future in as_completed(futures):
            completed = future.result()
            job.clips[completed.index] = completed

    print()

    failed = [c for c in job.clips if c.state == "failed"]
    if failed:
        # 로컬 파일이 있으면 업로드 실패는 무시하고 step4 로컬 병합으로 진행
        failed_no_local = [c for c in failed if not (c.local_path and c.local_path.exists())]
        if failed_no_local:
            labels = [f"씬{c.index + 1}" for c in failed_no_local]
            raise RuntimeError(
                f"지금은 비디오 생성을 할 수 없습니다.\n"
                f"실패한 조각: {', '.join(labels)}\n"
                "네트워크 상태를 확인하고 다시 시도해주세요."
            )
        print(f"[3] 업로드 실패 {len(failed)}개 — 로컬 파일 존재 → step4 로컬 병합으로 진행")

    done = sum(1 for c in job.clips if c.state == "done")
    local_ok = sum(1 for c in job.clips if c.local_path and c.local_path.exists())
    print(f"[3] 완료: {done}/{n} 서버 전송, {local_ok}/{n} 로컬 클립 준비")


def step4_merge(job: PipelineJob) -> dict[str, str]:
    """
    [4단계] 1차(16:9 무자막) + 2차(9:16 자막) 동시 생산.

    Returns:
        {"url_16x9": "...", "url_9x16": "..."}
    """
    import datetime
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    print("[4] 영상 조립 시작 (1차 16:9 + 2차 9:16)...")

    local_clips = [c for c in sorted(job.clips, key=lambda c: c.index)
                   if c.local_path and c.local_path.exists()]

    if not local_clips:
        raise RuntimeError("로컬 클립이 없습니다. 파이프라인을 다시 실행하세요.")

    # 1차: 16:9 무자막 (성우 더빙 포함)
    url_16x9 = _step4_local_merge(job, local_clips, ts)

    # 2차: 9:16 자막 포함
    url_9x16 = _step4_9x16_make(job, local_clips, ts)

    elapsed = round(time.time() - job.started_at, 1)
    print(f"[4] 완성! ({elapsed}초 소요)")
    print(f"    16:9 → {url_16x9}")
    print(f"    9:16 → {url_9x16}")

    job.final_url = url_16x9
    return {"url_16x9": url_16x9, "url_9x16": url_9x16}


def _escape_drawtext(text: str) -> str:
    """FFmpeg drawtext 텍스트 이스케이프 (콜론·역슬래시·따옴표)."""
    text = text.replace("\\", "\\\\")
    text = text.replace("'",  "\u2019")   # 작은따옴표 → 오른쪽 단일인용부호
    text = text.replace(":",  "\\:")
    text = text.replace("[",  "\\[").replace("]", "\\]")
    return text


def _find_korean_font() -> str | None:
    """Bold 우선으로 한글 폰트 경로를 탐색합니다."""
    candidates = [
        "C:/Windows/Fonts/malgunbd.ttf",     # 맑은 고딕 Bold (우선)
        "C:/Windows/Fonts/malgun.ttf",       # 맑은 고딕
        "C:/Windows/Fonts/NanumGothicBold.ttf",
        "C:/Windows/Fonts/NanumGothic.ttf",
        "C:/Windows/Fonts/gulim.ttf",
    ]
    for f in candidates:
        if Path(f).exists():
            return f
    return None


def _font_esc(font_path: str) -> str:
    """FFmpeg filter_complex 용 폰트 경로 이스케이프 (Windows C:/ → C\:/)."""
    p = font_path.replace("\\", "/")
    if len(p) > 1 and p[1] == ":":
        p = p[0] + "\\:" + p[2:]
    return p


def _split_hook_lines(text: str, max_len: int = 14) -> list[str]:
    """
    hook 텍스트를 2줄로 분할.
    max_len 이하이면 1줄. 초과 시 공백/구두점 기준으로 분할.
    """
    if len(text) <= max_len:
        return [text]
    # 중간 앞뒤 공백·쉼표·마침표 탐색
    mid = len(text) // 2
    for offset in range(0, mid):
        for pos in [mid - offset, mid + offset]:
            if pos <= 0 or pos >= len(text):
                continue
            if text[pos] in (" ", ",", ".", "·", "!", "?"):
                return [text[:pos].strip(), text[pos:].strip().lstrip(",. ")]
    # 공백 없으면 그냥 반반
    return [text[:mid].strip(), text[mid:].strip()]


# 9:16 레이아웃 상수
_P_W          = 1080   # 출력 너비
_P_H          = 1920   # 출력 높이
_P_CONTENT_H  = 608    # 16:9 콘텐츠 높이 (1080 × 9/16 = 607.5 → 608, 짝수)
_P_CONTENT_Y  = 310    # 콘텐츠 시작 Y (상단 hook 영역 아래)
_P_BLUR       = "20:3" # boxblur 강도:반복

# 16:9 상단 바 높이
_HOOK_BAR_H = 90


def _drawtext_filter(fe: str, line: str, size: int, color: str, y: int | str) -> str:
    """단일 drawtext 필터 조각 (filter_complex 내 스트림 라벨 없이 반환)."""
    return (
        f"drawtext=fontfile='{fe}':"
        f"text='{_escape_drawtext(line)}':"
        f"fontsize={size}:fontcolor={color}:"
        f"x=(w-tw)/2:y={y}"
    )


def _split_caption_lines(text: str, max_len: int = 22) -> list[str]:
    """씬 텍스트를 최대 2줄로 분할 (한글 기준 22자/줄)."""
    text = text.strip()
    if not text or len(text) <= max_len:
        return [text] if text else []
    mid = len(text) // 2
    for offset in range(mid + 1):
        for pos in [mid - offset, mid + offset]:
            if 0 < pos < len(text) and text[pos] == " ":
                return [text[:pos].strip(), text[pos:].strip()]
    return [text[:mid], text[mid:max_len * 2]]


def _make_9x16_clip(clip: ClipStatus, work_dir: Path) -> Path:
    """
    16:9 클립 → 9:16 블러배경 + 씬 캡션 변환.

    레이아웃 (1080×1920):
      ┌──────────────┐  0
      │  [블러 배경] │  ← 상단 여백 310px (hook 오버레이는 concat 후 step4에서)
      │──────────────│  310
      │ [16:9 영상]  │  ← 1080×608
      │──────────────│  918
      │  [캡션 텍스트]│  ← 씬 텍스트 (하단 블러 영역 중앙)
      │  [블러 배경] │
      └──────────────┘  1920
    """
    out = work_dir / f"clip_{clip.index:02d}_portrait.mp4"
    if not clip.local_path or not clip.local_path.exists():
        raise RuntimeError(f"씬{clip.index + 1} 로컬 클립 없음")

    font_path = _find_korean_font()
    fe = _font_esc(font_path) if font_path else None

    # ── filter_complex 구성 ──────────────────────────────────────────────────
    fc_parts = [
        f"[0:v]split=2[main][bg]",
        f"[bg]scale={_P_W}:{_P_H}:force_original_aspect_ratio=increase,"
        f"crop={_P_W}:{_P_H},boxblur={_P_BLUR}[blurred]",
        f"[main]scale={_P_W}:{_P_CONTENT_H}[content]",
        f"[blurred][content]overlay=0:{_P_CONTENT_Y}[base]",
    ]

    # 씬 캡션: 콘텐츠 아래 블러 영역 중앙
    content_bottom = _P_CONTENT_Y + _P_CONTENT_H   # 918
    bottom_area_h  = _P_H - content_bottom           # 1002

    if fe and clip.scene_text.strip():
        lines     = _split_caption_lines(clip.scene_text)
        font_size = 52
        line_gap  = 12
        total_h   = len(lines) * font_size + (len(lines) - 1) * line_gap
        y_start   = content_bottom + (bottom_area_h - total_h) // 2

        cur = "[base]"
        for i, line in enumerate(lines):
            safe = _escape_drawtext(line[:22])
            y    = y_start + i * (font_size + line_gap)
            nxt  = "[vout]" if i == len(lines) - 1 else f"[cap{i}]"
            fc_parts.append(
                f"{cur}drawtext=fontfile='{fe}':"
                f"text='{safe}':"
                f"fontsize={font_size}:fontcolor=white:"
                f"shadowcolor=black:shadowx=2:shadowy=2:"
                f"box=1:boxcolor=black@0.5:boxborderw=10:"
                f"x=(w-tw)/2:y={y}{nxt}"
            )
            cur = nxt
    else:
        fc_parts.append("[base]copy[vout]")

    cmd = [
        "ffmpeg", "-y", "-i", str(clip.local_path),
        "-filter_complex", ";\n".join(fc_parts),
        "-map", "[vout]", "-map", "0:a",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "copy",
        str(out),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"9:16 변환 실패 (씬{clip.index + 1}): {r.stderr[-300:]}")
    return out


def _apply_hook_and_bgm(
    src: Path,
    dst: Path,
    fe: str,
    hook_lines: list[str],
    hook_sizes: list[int],
    hook_colors: list[str],
    hook_y_start: int,
    bgm_path: Path | None,
) -> None:
    """병합된 영상에 hook 텍스트 + BGM 을 한 패스로 적용."""
    bgm_fc = (
        "[1:a]volume=0.15,aloop=loop=-1:size=2e+09[bgm];\n"
        "[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]"
    )

    # hook drawtext 체인
    if hook_lines:
        vf_parts: list[str] = []
        cur = "[0:v]"
        y = hook_y_start
        for i, line in enumerate(hook_lines):
            nxt = "[vout]" if i == len(hook_lines) - 1 else f"[hk{i}]"
            vf_parts.append(
                f"{cur}{_drawtext_filter(fe, line, hook_sizes[i], hook_colors[i], y)}{nxt}"
            )
            y += hook_sizes[i] + 16
            cur = nxt
        vf = ";\n".join(vf_parts)
    else:
        vf = "[0:v]copy[vout]"

    if bgm_path and bgm_path.exists():
        fc = vf + ";\n" + bgm_fc
        cmd = [
            "ffmpeg", "-y",
            "-i", str(src), "-i", str(bgm_path),
            "-filter_complex", fc,
            "-map", "[vout]", "-map", "[aout]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            str(dst),
        ]
    else:
        cmd = [
            "ffmpeg", "-y", "-i", str(src),
            "-filter_complex", vf,
            "-map", "[vout]", "-map", "0:a",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "copy",
            str(dst),
        ]

    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"hook/BGM 렌더 실패: {r.stderr[-300:]}")


def _concat_clips(clip_paths: list[Path], filelist: Path, out: Path) -> None:
    """클립 목록을 stream-copy로 연결."""
    with open(filelist, "w", encoding="utf-8") as f:
        for p in clip_paths:
            f.write(f"file '{p.as_posix()}'\n")
    r = subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(filelist), "-c", "copy", str(out)],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        raise RuntimeError(f"FFmpeg concat 실패: {r.stderr[-400:]}")


def _step4_local_merge(job: PipelineJob, clips: list[ClipStatus], ts: str) -> str:
    """
    [4-1차] 16:9 클립 concat → hook 상단 검정바 + BGM → final_16x9.mp4
    성우 더빙 포함, 자막 없음.
    """
    work_dir = job.work_dir or Path(tempfile.gettempdir())

    merged = work_dir / f"merged_{ts}.mp4"
    _concat_clips([c.local_path for c in clips], work_dir / "filelist.txt", merged)
    print(f"[4-1차] 클립 {len(clips)}개 병합 완료 → {merged.name}")

    font_path  = _find_korean_font()
    fe         = _font_esc(font_path) if font_path else ""
    hook_text  = job.hook.strip()
    hook_lines = _split_hook_lines(hook_text) if hook_text and font_path else []

    # 16:9: 상단 검정 바 + hook 텍스트
    content_h = KEYFRAME_H - _HOOK_BAR_H  # 990
    sizes  = [42, 36]
    colors = ["white", "#FFD700"]
    total_text_h = sum(sizes[i] + 8 for i in range(len(hook_lines)))
    y_start = max(6, (_HOOK_BAR_H - total_text_h) // 2)

    # scale+pad → 검정바 추가 후 hook drawtext
    if hook_lines:
        pad_filter = f"[0:v]scale={KEYFRAME_W}:{content_h},pad={KEYFRAME_W}:{KEYFRAME_H}:0:{_HOOK_BAR_H}:black"
        vf_parts: list[str] = []
        cur = pad_filter
        y   = y_start
        for i, line in enumerate(hook_lines):
            nxt = "[vout]" if i == len(hook_lines) - 1 else f"[hk{i}]"
            vf_parts.append(
                f"{cur},{_drawtext_filter(fe, line, sizes[i], colors[i], y)}{nxt}"
            )
            y   += sizes[i] + 8
            cur  = nxt
        vf = ";\n".join(vf_parts)
    else:
        vf = f"[0:v]scale={KEYFRAME_W}:{KEYFRAME_H}[vout]"

    if hook_lines:
        print(f"[4-1차] hook: \"{hook_text[:24]}...\" ({len(hook_lines)}줄)")
    print(f"[4-1차] 출력: 16:9 {KEYFRAME_W}×{KEYFRAME_H}")

    bgm_path = _find_bgm()
    final_16x9 = work_dir / f"final_16x9_{ts}.mp4"

    # BGM + 비디오 필터 한 패스
    bgm_fc = (
        "[1:a]volume=0.15,aloop=loop=-1:size=2e+09[bgm];\n"
        "[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]"
    )
    if bgm_path and bgm_path.exists():
        fc = vf + ";\n" + bgm_fc
        cmd_final = [
            "ffmpeg", "-y", "-i", str(merged), "-i", str(bgm_path),
            "-filter_complex", fc,
            "-map", "[vout]", "-map", "[aout]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            str(final_16x9),
        ]
    else:
        cmd_final = [
            "ffmpeg", "-y", "-i", str(merged),
            "-filter_complex", vf,
            "-map", "[vout]", "-map", "0:a",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "copy",
            str(final_16x9),
        ]

    r2 = subprocess.run(cmd_final, capture_output=True, text=True)
    if r2.returncode != 0:
        print(f"[4-1차] 렌더 실패 → merged 사용: {r2.stderr[-200:]}")
        final_16x9 = merged
    else:
        print(f"[4-1차] 완료 → {final_16x9.name}")

    return final_16x9.as_posix()


def _step4_9x16_make(job: PipelineJob, clips: list[ClipStatus], ts: str) -> str:
    """
    [4-2차] 16:9 클립 → 9:16 변환(캡션 포함) → concat → hook 오버레이 → final_9x16.mp4.
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed as _as_completed
    work_dir = job.work_dir or Path(tempfile.gettempdir())
    n = len(clips)

    print(f"[4-2차] {n}개 클립 9:16 변환 중 (병렬)...")
    portrait_map: dict[int, Path] = {}

    with ThreadPoolExecutor(max_workers=n) as pool:
        futures = {pool.submit(_make_9x16_clip, clip, work_dir): clip.index for clip in clips}
        for fut in _as_completed(futures):
            idx = futures[fut]
            try:
                portrait_map[idx] = fut.result()
                print(f"  [2차] 씬{idx + 1}/{n} 9:16 변환 완료")
            except Exception as e:
                print(f"  [2차] 씬{idx + 1} 변환 실패: {e}")

    portrait_clips = [portrait_map[i] for i in sorted(portrait_map)]
    if not portrait_clips:
        raise RuntimeError("9:16 클립 변환 모두 실패")

    merged_p = work_dir / f"merged_portrait_{ts}.mp4"
    _concat_clips(portrait_clips, work_dir / "filelist_portrait.txt", merged_p)
    print(f"[4-2차] {len(portrait_clips)}개 9:16 클립 병합 완료 → {merged_p.name}")

    # hook 오버레이 + BGM
    font_path  = _find_korean_font()
    fe         = _font_esc(font_path) if font_path else ""
    hook_text  = job.hook.strip()
    hook_lines = _split_hook_lines(hook_text) if hook_text and font_path else []
    sizes      = [68, 62]
    colors     = ["white", "#FFD700"]
    y_start    = max(20, (_P_CONTENT_Y - sum(s + 16 for s in sizes[:len(hook_lines)])) // 2)

    final_9x16 = work_dir / f"final_9x16_{ts}.mp4"
    bgm_path   = _find_bgm()

    if hook_lines:
        vf_parts: list[str] = []
        cur = "[0:v]"
        y   = y_start
        for i, line in enumerate(hook_lines):
            nxt = "[vout]" if i == len(hook_lines) - 1 else f"[hk{i}]"
            vf_parts.append(
                f"{cur}{_drawtext_filter(fe, line, sizes[i], colors[i], y)}{nxt}"
            )
            y   += sizes[i] + 16
            cur  = nxt
        vf = ";\n".join(vf_parts)
        print(f"[4-2차] hook: \"{hook_text[:24]}...\" ({len(hook_lines)}줄)")
    else:
        vf = "[0:v]copy[vout]"

    bgm_fc = (
        "[1:a]volume=0.15,aloop=loop=-1:size=2e+09[bgm];\n"
        "[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]"
    )
    if bgm_path and bgm_path.exists():
        fc = vf + ";\n" + bgm_fc
        cmd = [
            "ffmpeg", "-y", "-i", str(merged_p), "-i", str(bgm_path),
            "-filter_complex", fc,
            "-map", "[vout]", "-map", "[aout]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            str(final_9x16),
        ]
    else:
        cmd = [
            "ffmpeg", "-y", "-i", str(merged_p),
            "-filter_complex", vf,
            "-map", "[vout]", "-map", "0:a",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "copy",
            str(final_9x16),
        ]

    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"[4-2차] 렌더 실패 → merged_portrait 사용: {r.stderr[-200:]}")
        final_9x16 = merged_p
    else:
        print(f"[4-2차] 완료 → {final_9x16.name}")

    return final_9x16.as_posix()


def _step4_server_merge(job: PipelineJob) -> str:
    """원격 LinkDrop API 서버로 병합 요청."""
    upload_urls = [c.upload_url for c in job.clips if c.upload_url]
    if len(upload_urls) < job.clip_count:
        raise RuntimeError(
            f"업로드 완료 클립 {len(upload_urls)}/{job.clip_count}개. 병합 불가."
        )

    payload = {
        "clips": upload_urls,
        "bgm": "default",
        "voice": job.voice,
        "app_id": job.app_id,
        "script": job.script,
        "estimated_sec": job.estimated_total_sec,
    }

    try:
        with httpx.Client(timeout=300) as client:
            r = client.post(MERGE_ENDPOINT, json=payload)
            r.raise_for_status()
            final_url = r.json().get("video_url", "")
    except httpx.ConnectError:
        raise RuntimeError(
            f"병합 서버({MERGE_ENDPOINT})에 연결할 수 없습니다.\n"
            "  api.linkdrop.io 서버가 아직 미배포 상태입니다."
        )
    except httpx.HTTPStatusError as e:
        raise RuntimeError(f"병합 서버 오류 ({e.response.status_code}): {e.response.text[:200]}")

    if not final_url:
        raise RuntimeError("병합 서버가 최종 URL을 반환하지 않았습니다.")

    job.final_url = final_url
    elapsed = round(time.time() - job.started_at, 1)
    print(f"[4] 완성! ({elapsed}초 소요) → {final_url}")
    return final_url


def _find_bgm() -> Optional[Path]:
    """BGM 파일을 찾아 반환합니다."""
    bgm_dirs = [
        Path(__file__).parent / "assets" / "bgm",
        Path(__file__).parent / "assets",
    ]
    candidates = ["upbeat_light.mp3", "calm_ambient.mp3", "bgm.mp3"]
    for d in bgm_dirs:
        for name in candidates:
            p = d / name
            if p.exists():
                return p
    return None


# ── 메인 파이프라인 ──────────────────────────────────────────────────────────

def run_pipeline(
    app_id: str,
    topic: str,
    voice: str = "ko-KR-Wavenet-D",
    reporter: Callable[[PipelineJob], None] = default_reporter,
) -> str:
    """
    전체 파이프라인 실행 (Zero-Hands).

    씬(클립) 수는 시나리오 내용에 따라 동적으로 결정됩니다.
    최종 영상 총 길이 65초 이하 조건만 만족하면 됩니다.

    Returns:
        최종 완성 영상 다운로드 URL
    """
    print("=" * 60)
    print("LinkDrop 영상 생산 공정 시작")
    print(f"  주제: {topic}  |  앱: {app_id}")
    print("=" * 60)

    ts = int(time.time())
    work_dir = Path(tempfile.gettempdir()) / f"linkdrop_{app_id}_{ts}"
    work_dir.mkdir(parents=True, exist_ok=True)

    job = PipelineJob(app_id=app_id, topic=topic, voice=voice, work_dir=work_dir)

    # [0] 인증
    auth = step0_check_auth()

    # [1~2] 시나리오 추출
    if not job.script:
        job.script = step1_get_script(job)

    # [2→3 브릿지] 씬 파싱 + 65초 이하 검증 + clips 동적 생성
    step2_parse_and_validate(job)

    # [3] 병렬 렌더링 (씬 수만큼)
    step3_parallel_render(job, auth, reporter)

    # [4] 서버 병합
    return step4_merge(job)


# ── CLI 진입점 ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="skill-2-video-longform1 파이프라인 실행")
    parser.add_argument("topic", help="영상 주제")
    parser.add_argument("--app", default="health-senior", help="Opal 앱 ID")
    parser.add_argument("--voice", default="ko-KR-Wavenet-D", help="Google TTS 음성 ID")
    args = parser.parse_args()

    try:
        url = run_pipeline(app_id=args.app, topic=args.topic, voice=args.voice)
        print(f"\n[완성] {url}")
        sys.exit(0)
    except RuntimeError as e:
        print(f"\n[오류] {e}")
        sys.exit(1)
