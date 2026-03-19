#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
파이프라인 JSON 이벤트 스트리머
--------------------------------
stdout에 JSON 줄 이벤트를 출력합니다 (Next.js SSE 라우트에서 소비).

이벤트 형식:
  {"type":"step",   "step":0, "message":"인증 확인 중..."}
  {"type":"init",   "clip_count":8, "estimated_sec":55.3}
  {"type":"progress","clip_id":0, "state":"rendering","progress":40,"scene_text":"..."}
  {"type":"done",   "url":"https://..."}
  {"type":"error",  "message":"오류 메시지"}

사용법:
  python pipeline_server.py --topic "건강 식품 추천" --app health-senior --voice ko-KR-Wavenet-D
"""

import sys
import json
import argparse
import threading
from pathlib import Path

# logic.py 가 sys.stdout 을 UTF-8로 래핑하므로 여기서는 path만 추가
sys.path.insert(0, str(Path(__file__).parent))

from logic import (  # noqa: E402
    PipelineJob,
    step0_check_auth,
    step1_get_script,
    step2_parse_and_validate,
    step3_parallel_render,
    step4_merge,
)


def emit(event: dict) -> None:
    """JSON 이벤트를 stdout에 한 줄로 출력 (flush 보장)."""
    print(json.dumps(event, ensure_ascii=False), flush=True)


def make_reporter(prev_states: dict):
    """클립 상태 변화 시 JSON progress 이벤트 출력 (thread-safe)."""
    _lock = threading.Lock()

    def reporter(job: PipelineJob) -> None:
        with _lock:
            for clip in job.clips:
                # (state, progress 10단위) 조합이 바뀔 때만 이벤트 발행
                key = (clip.state, round(clip.progress, -1))
                if prev_states.get(clip.index) != key:
                    prev_states[clip.index] = key
                    evt: dict = {
                        "type": "progress",
                        "clip_id": clip.index,
                        "state": clip.state,
                        "progress": round(clip.progress),
                        "scene_text": clip.scene_text,
                    }
                    if clip.keyframe_path and clip.keyframe_path.exists():
                        evt["keyframe"] = str(clip.keyframe_path)
                    emit(evt)
    return reporter


def main() -> int:
    parser = argparse.ArgumentParser(description="파이프라인 JSON 이벤트 스트리머")
    parser.add_argument("--app",    default="health-senior",   help="Opal 앱 ID")
    parser.add_argument("--topic",  required=True,             help="영상 주제")
    parser.add_argument("--voice",  default="ko-KR-Wavenet-D", help="Google TTS 음성 ID")
    parser.add_argument("--script",     default="", help="사전 편집된 시나리오 (전달 시 NotebookLM 건너뜀)")
    parser.add_argument("--art_prompt", default="", help="화풍 프롬프트 (Opal HTML 키프레임용)")
    parser.add_argument("--tts_speed",  type=float, default=1.2, help="TTS 더빙 속도 (기본: 1.2)")
    # 해상도: 1차 16:9(재사용 소재) → 2차 9:16(최종 완성본) 자동 2단계
    # --aspect 인자 제거됨 — 파이프라인이 자동으로 16:9 → 9:16 순차 생성
    args = parser.parse_args()

    prev_states: dict = {}
    reporter = make_reporter(prev_states)

    try:
        job = PipelineJob(app_id=args.app, topic=args.topic, voice=args.voice, tts_speed=args.tts_speed, art_prompt=args.art_prompt)

        # [0] 인증
        emit({"type": "step", "step": 0, "message": "인증 확인 중..."})
        auth = step0_check_auth()

        # [1~2] 시나리오: 사전 편집본 있으면 NotebookLM 건너뜀
        if args.script.strip():
            job.script = args.script.strip()
            emit({"type": "step", "step": 1, "message": "편집된 시나리오 사용 중..."})
        else:
            emit({"type": "step", "step": 1, "message": "시나리오 로드 중..."})
            job.script = step1_get_script(job)

        # [2→3] 씬 파싱 + 검증 + clips 생성
        emit({"type": "step", "step": 2, "message": "씬 파싱 및 길이 검증 중..."})
        step2_parse_and_validate(job)

        # clip 수 확정 → 프론트에 슬롯 초기화 신호
        emit({
            "type": "init",
            "clip_count": job.clip_count,
            "estimated_sec": job.estimated_total_sec,
        })

        # [3] 병렬 렌더링
        emit({
            "type": "step",
            "step": 3,
            "message": f"{job.clip_count}개 조각 영상 병렬 생성 중...",
        })
        step3_parallel_render(job, auth, reporter)

        # [4] 서버 병합
        emit({"type": "step", "step": 4, "message": "서버 통합 조립 중..."})
        urls = step4_merge(job)

        emit({"type": "done", "url_16x9": urls["url_16x9"], "url_9x16": urls["url_9x16"]})
        return 0

    except RuntimeError as e:
        emit({"type": "error", "message": str(e)})
        return 1
    except Exception as e:
        emit({"type": "error", "message": f"예기치 않은 오류: {e}"})
        return 1


if __name__ == "__main__":
    sys.exit(main())
