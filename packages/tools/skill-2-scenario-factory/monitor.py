#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
재고 감시 + 자동 보충 워커
---------------------------
주기적으로 시나리오 재고를 확인하고,
임계값 미만 시 자동으로 보충 생성합니다.

실행: python monitor.py  (무한 루프)
"""
from __future__ import annotations

import json
import time
from pathlib import Path

import supabase_client
import topic_collector
import scenario_generator
import drive_client

CONFIG_PATH = Path(__file__).parent / "config" / "production_config.json"


def load_config() -> dict:
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def print_stock_table(stocks: dict[str, dict[str, int]], threshold: int) -> None:
    """재고 현황 테이블 출력."""
    print("\n" + "=" * 60)
    print(f"{'템플릿':<22} {'스타일':<14} {'재고':>6}  {'상태'}")
    print("-" * 60)
    for tmpl, styles in stocks.items():
        for style, count in styles.items():
            status = "✅ 정상" if count >= threshold else f"🔴 부족 (<{threshold})"
            print(f"  {tmpl:<20} {style:<14} {count:>5}  {status}")
    print("=" * 60)


def replenish(template_id: str, style: str, config: dict) -> int:
    """단일 템플릿·스타일 재고 보충. 반환: 생성된 수."""
    targets    = config["targets"]
    gen_cfg    = config["generation"]
    drive_cfg  = config["google_drive"]
    count      = targets["replenish_count"]

    print(f"\n[보충] {template_id}/{style} {count}개 생성 시작...")

    # 1. 토픽 확보
    topics = topic_collector.get_topics_for_template(template_id, count=count)

    # 2. 시나리오 생성
    scenarios = scenario_generator.batch_generate(
        template_id=template_id,
        style=style,
        topics=topics,
        count=count,
        workers=gen_cfg["parallel_workers"],
        delay_sec=gen_cfg["request_delay_sec"],
    )

    if not scenarios:
        print(f"[보충] {template_id}/{style} — 생성 실패")
        return 0

    # 3. Supabase 저장
    inserted = supabase_client.insert_scenarios(scenarios)
    print(f"[보충] {template_id}/{style} — {inserted}개 Supabase 저장 완료")

    # 4. Drive 백업 (선택)
    if drive_cfg.get("backup_enabled") and inserted > 0:
        drive_client.backup_scenarios(
            scenarios, template_id,
            folder_name=drive_cfg.get("backup_folder_name", "LinkDrop-ScenarioFactory")
        )

    return inserted


def run_monitor_loop() -> None:
    """무한 루프: 재고 감시 + 자동 보충."""
    config    = load_config()
    templates = config["templates"]
    styles    = config["styles"]
    threshold = config["targets"]["min_stock_threshold"]
    interval  = config["schedule"]["stock_check_interval_minutes"] * 60

    print("=" * 60)
    print("시나리오 팩토리 — 재고 감시 시작")
    print(f"  체크 주기: {interval // 60}분")
    print(f"  임계값:    재고 < {threshold}개 시 자동 보충")
    print("=" * 60)

    while True:
        config    = load_config()   # 매 루프마다 설정 재로드 (실시간 반영)
        threshold = config["targets"]["min_stock_threshold"]

        print(f"\n[감시] 재고 확인 중... ({time.strftime('%Y-%m-%d %H:%M:%S')})")
        stocks = supabase_client.get_stock_levels(templates, styles)
        print_stock_table(stocks, threshold)

        # 부족분 보충
        for tmpl in templates:
            for style in styles:
                count = stocks.get(tmpl, {}).get(style, 0)
                if count < threshold:
                    replenish(tmpl, style, config)

        print(f"\n[감시] 다음 체크: {interval // 60}분 후")
        time.sleep(interval)


if __name__ == "__main__":
    run_monitor_loop()
