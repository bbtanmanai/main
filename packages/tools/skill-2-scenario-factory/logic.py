#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
skill-2-scenario-factory — 시나리오 팩토리
==========================================
크롤 데이터(7점+) → 토픽 추출 → Gemini 시나리오 생성 → Supabase 저장

실행 방법:
  python logic.py --mode init        초기 전체 생성 (템플릿×스타일×200개)
  python logic.py --mode replenish   부족분 보충만
  python logic.py --mode monitor     무한 루프 재고 감시 (프로덕션용)
  python logic.py --mode status      현재 재고 현황 출력
  python logic.py --mode collect     크롤 데이터 → topic_pool 수집만
  python logic.py --mode test        단건 생성 테스트
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import io
import time
from pathlib import Path

# Windows CP949 한글 출력 보장
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ── .env 로드 ─────────────────────────────────────────────────────────────────
_ROOT_ENV = Path(__file__).parent.parent.parent.parent / ".env"
if _ROOT_ENV.exists():
    for _line in _ROOT_ENV.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

# ── 내부 모듈 ─────────────────────────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent))
import supabase_client
import topic_collector
import scenario_generator
import drive_client
from monitor import replenish, print_stock_table, run_monitor_loop

CONFIG_PATH = Path(__file__).parent / "config" / "production_config.json"


def load_config() -> dict:
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


# ── MODE: collect ─────────────────────────────────────────────────────────────

def mode_collect(config: dict) -> None:
    """크롤 DB → topic_pool 수집."""
    src = config["topic_source"]
    drive_cfg = config["google_drive"]

    print("\n[1단계] 크롤 데이터 수집 중...")
    raw = supabase_client.fetch_viral_crawl_data(
        min_score=src["min_viral_score"],
        limit=src["max_topics_per_run"],
    )

    if not raw:
        print("  크롤 데이터 없음. 크롤러를 먼저 실행하세요.")
        return

    # Google Drive 백업
    if drive_cfg.get("backup_enabled"):
        drive_client.backup_crawl_data(
            raw,
            folder_name=drive_cfg.get("backup_folder_name", "LinkDrop-ScenarioFactory")
        )

    # topic_pool 변환 + 저장
    topics = topic_collector.collect_topics_from_crawl(
        min_score=src["min_viral_score"],
        max_age_days=src["max_topic_age_days"],
        limit=src["max_topics_per_run"],
    )
    saved = topic_collector.save_topics_to_pool(topics)
    print(f"[1단계] 완료: {saved}개 토픽 저장")


# ── MODE: init ────────────────────────────────────────────────────────────────

def mode_init(config: dict) -> None:
    """최초 1회 전체 생성."""
    templates  = config["templates"]
    styles     = config["styles"]
    targets    = config["targets"]
    gen_cfg    = config["generation"]
    drive_cfg  = config["google_drive"]

    per_tmpl   = targets["initial_count_per_template"]
    per_style  = max(1, per_tmpl // len(styles))   # 스타일별 균등 분배

    print("\n" + "=" * 60)
    print("시나리오 팩토리 — 초기 전체 생성")
    print(f"  템플릿: {len(templates)}개 × 스타일: {len(styles)}개 × {per_style}개")
    print(f"  총 목표: {len(templates) * len(styles) * per_style}개")
    print("=" * 60)

    # 토픽 수집 먼저
    mode_collect(config)

    total_inserted = 0
    start_time = time.time()

    for tmpl in templates:
        print(f"\n▶ 템플릿: {tmpl}")
        topics = topic_collector.get_topics_for_template(tmpl, count=per_style * len(styles))
        tmpl_scenarios: list[dict] = []

        for style in styles:
            scenarios = scenario_generator.batch_generate(
                template_id=tmpl,
                style=style,
                topics=topics,
                count=per_style,
                workers=gen_cfg["parallel_workers"],
                delay_sec=gen_cfg["request_delay_sec"],
            )
            tmpl_scenarios.extend(scenarios)

        # Supabase 저장
        inserted = supabase_client.insert_scenarios(tmpl_scenarios)
        total_inserted += inserted
        print(f"  {tmpl}: {inserted}개 저장 완료")

        # Drive 백업
        if drive_cfg.get("backup_enabled") and tmpl_scenarios:
            drive_client.backup_scenarios(
                tmpl_scenarios, tmpl,
                folder_name=drive_cfg.get("backup_folder_name", "LinkDrop-ScenarioFactory")
            )

    elapsed = round(time.time() - start_time, 1)
    print(f"\n{'=' * 60}")
    print(f"초기 생성 완료: 총 {total_inserted}개 ({elapsed}초 소요)")
    print(f"예상 비용: ${total_inserted * 0.00071:.2f} (약 {int(total_inserted * 0.00071 * 1400)}원)")
    print("=" * 60)


# ── MODE: replenish ───────────────────────────────────────────────────────────

def mode_replenish(config: dict) -> None:
    """재고 부족 템플릿·스타일만 선별 보충."""
    templates = config["templates"]
    styles    = config["styles"]
    threshold = config["targets"]["min_stock_threshold"]

    stocks = supabase_client.get_stock_levels(templates, styles)
    print_stock_table(stocks, threshold)

    replenished = 0
    for tmpl in templates:
        for style in styles:
            if stocks.get(tmpl, {}).get(style, 0) < threshold:
                replenished += replenish(tmpl, style, config)

    if replenished == 0:
        print("\n모든 템플릿 재고 충분. 보충 불필요.")
    else:
        print(f"\n보충 완료: 총 {replenished}개 추가")


# ── MODE: status ──────────────────────────────────────────────────────────────

def mode_status(config: dict) -> None:
    """재고 현황 출력."""
    templates = config["templates"]
    styles    = config["styles"]
    threshold = config["targets"]["min_stock_threshold"]

    stocks = supabase_client.get_stock_levels(templates, styles)
    print_stock_table(stocks, threshold)

    total = sum(c for s in stocks.values() for c in s.values())
    low   = [(t, s, c) for t, sv in stocks.items()
             for s, c in sv.items() if c < threshold]

    print(f"\n  총 재고: {total}개")
    if low:
        print(f"  ⚠️  재고 부족 항목 {len(low)}개 → 'python logic.py --mode replenish' 실행 권장")
    else:
        print("  ✅ 모든 항목 재고 정상")


# ── MODE: test ────────────────────────────────────────────────────────────────

def mode_test(config: dict) -> None:
    """단건 생성 테스트 (DB 저장 없음)."""
    print("\n[테스트] 단건 시나리오 생성")
    result = scenario_generator.generate_one(
        topic="혈압에 좋은 음식 TOP5",
        style="ranking",
        template_id="health-senior",
        viral_seed=8.4,
    )
    if result:
        print(f"\n씬 수: {result['scene_count']}개")
        print(f"예상 시간: {result['estimated_sec']}초")
        print("\n--- 시나리오 미리보기 (앞 3씬) ---")
        import re
        scenes = re.findall(r"\[씬\d+\].*?(?=\[씬\d+\]|$)", result["script"], re.DOTALL)
        for s in scenes[:3]:
            print(s.strip())
    else:
        print("[테스트] 생성 실패")


# ── 진입점 ────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="skill-2-scenario-factory")
    parser.add_argument(
        "--mode",
        choices=["init", "replenish", "monitor", "status", "collect", "test"],
        default="status",
        help="실행 모드"
    )
    args = parser.parse_args()
    config = load_config()

    mode_map = {
        "init":      lambda: mode_init(config),
        "replenish": lambda: mode_replenish(config),
        "monitor":   run_monitor_loop,
        "status":    lambda: mode_status(config),
        "collect":   lambda: mode_collect(config),
        "test":      lambda: mode_test(config),
    }

    try:
        mode_map[args.mode]()
        return 0
    except KeyboardInterrupt:
        print("\n[중단] 사용자 인터럽트")
        return 0
    except Exception as e:
        print(f"\n[오류] {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
