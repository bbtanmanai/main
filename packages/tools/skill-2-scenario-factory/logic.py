#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
skill-2-scenario-factory — 시나리오 팩토리
==========================================
[신규 파이프라인]
  1. --mode formula  전 세계 YouTube 수집(30점+) → 공통+템플릿별 성공 방정식 추출 → DB 저장
  2. --mode init     성공 방정식 로드 → 토픽 수집 → 방정식 기반 시나리오 생성 → DB 저장

실행 방법:
  python logic.py --mode formula     YouTube 직접 수집 → 성공 방정식 추출 (init 전 필수)
  python logic.py --mode init        초기 전체 생성 (템플릿×스타일×200개, 방정식 자동 활용)
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
import formula_collector
import formula_analyzer
import drive_client
from monitor import replenish, print_stock_table, run_monitor_loop

CONFIG_PATH = Path(__file__).parent / "config" / "production_config.json"


def load_config() -> dict:
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


# ── MODE: formula ─────────────────────────────────────────────────────────────

def mode_formula(config: dict) -> None:
    """
    [1단계] 전 세계 YouTube에서 템플릿별 상위 바이럴 영상 수집 (30점+, 상위 100개)
    [2단계] Gemini로 공통 + 템플릿별 성공 방정식 분석
    [3단계] success_formulas 테이블에 저장

    이 모드 실행 후 --mode init 을 실행하세요.
    수집된 영상은 crawl_videos 테이블에도 자동 저장됩니다.
    """
    api_key = os.environ.get("YOUTUBE_API_KEY", "")
    if not api_key:
        print("[오류] YOUTUBE_API_KEY 환경변수가 없습니다.")
        return

    formula_cfg = config.get("formula", {})
    min_score        = formula_cfg.get("min_viral_score",      30.0)
    fallback_score   = formula_cfg.get("fallback_min_score",   15.0)
    max_per_keyword  = formula_cfg.get("max_per_keyword",      50)
    top_n            = formula_cfg.get("top_n_per_template",   100)

    print("\n" + "=" * 60)
    print("성공 방정식 추출 파이프라인")
    print(f"  수집 기준: 바이럴 점수 {min_score}점+ (폴백: {fallback_score}점+)")
    print(f"  키워드당 최대 {max_per_keyword}개 검색 → 템플릿별 상위 {top_n}개 선별")
    print("=" * 60)

    import time
    start = time.time()

    # ── 1단계: 수집 ─────────────────────────────────────────────────────────
    print("\n[1단계] YouTube 전 세계 수집 시작...")
    template_videos = formula_collector.collect_all_templates(
        api_key=api_key,
        min_score=min_score,
        max_per_keyword=max_per_keyword,
        top_n=top_n,
        fallback_min_score=fallback_score,
    )

    total_collected = sum(len(v) for v in template_videos.values())
    print(f"\n[1단계 완료] 총 {total_collected}개 영상 수집")

    if total_collected == 0:
        print("[경고] 수집된 영상이 없습니다. YouTube API 키를 확인하세요.")
        return

    # ── 2단계: 분석 ─────────────────────────────────────────────────────────
    print("\n[2단계] Gemini 성공 방정식 분석 시작...")
    common_formula, template_formulas = formula_analyzer.analyze_all(template_videos)

    # ── 3단계: 저장 ─────────────────────────────────────────────────────────
    print("\n[3단계] success_formulas 테이블 저장 중...")

    supabase_client.upsert_success_formula(
        scope="common",
        formula=common_formula,
        sample_size=common_formula.get("_sample_size", total_collected),
    )
    print(f"  [공통 방정식] 저장 완료")

    for tmpl_id, tmpl_formula in template_formulas.items():
        if not tmpl_formula:
            continue
        supabase_client.upsert_success_formula(
            scope=tmpl_id,
            formula=tmpl_formula,
            sample_size=tmpl_formula.get("_sample_size", 0),
        )
        print(f"  [{tmpl_id}] 저장 완료 (샘플 {tmpl_formula.get('_sample_size', 0)}개)")

    elapsed = round(time.time() - start, 1)
    saved_count = 1 + len([f for f in template_formulas.values() if f])
    print(f"\n{'=' * 60}")
    print(f"성공 방정식 추출 완료: {saved_count}개 저장 ({elapsed}초 소요)")
    print(f"다음 단계: python logic.py --mode init")
    print("=" * 60)


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
    """
    최초 1회 전체 생성.
    success_formulas 테이블에 방정식이 있으면 자동 주입.
    없으면 경고 후 방정식 없이 진행 (기존 방식).
    """
    templates  = config["templates"]
    styles     = config["styles"]
    targets    = config["targets"]
    gen_cfg    = config["generation"]
    drive_cfg  = config["google_drive"]

    per_tmpl  = targets["initial_count_per_template"]
    per_style = max(1, per_tmpl // len(styles))

    # ── 성공 방정식 로드 ──────────────────────────────────────────────────
    print("\n[방정식 로드] success_formulas 조회 중...")
    all_formulas    = supabase_client.get_all_formulas()
    common_formula  = all_formulas.get("common")
    has_formula     = bool(common_formula)

    if has_formula:
        tmpl_count = len([k for k in all_formulas if k != "common"])
        print(f"  ✅ 공통 방정식 + 템플릿 방정식 {tmpl_count}개 로드 완료")
    else:
        print("  ⚠️  성공 방정식 없음 → 방정식 없이 생성 진행")
        print("     (먼저 --mode formula 실행 권장)")

    print("\n" + "=" * 60)
    print("시나리오 팩토리 — 초기 전체 생성")
    print(f"  템플릿: {len(templates)}개 × 스타일: {len(styles)}개 × {per_style}개")
    print(f"  총 목표: {len(templates) * len(styles) * per_style}개")
    print(f"  성공 방정식: {'적용' if has_formula else '미적용'}")
    print("=" * 60)

    # 토픽 수집
    mode_collect(config)

    total_inserted = 0
    start_time = time.time()

    for tmpl in templates:
        print(f"\n▶ 템플릿: {tmpl}")
        topics = topic_collector.get_topics_for_template(tmpl, count=per_style * len(styles))

        # 해당 템플릿 방정식 로드
        template_formula = all_formulas.get(tmpl) if has_formula else None
        if has_formula:
            print(f"  [{tmpl}] 템플릿 방정식: {'있음' if template_formula else '없음 (공통만 적용)'}")

        tmpl_scenarios: list[dict] = []
        for style in styles:
            scenarios = scenario_generator.batch_generate(
                template_id=tmpl,
                style=style,
                topics=topics,
                count=per_style,
                workers=gen_cfg["parallel_workers"],
                delay_sec=gen_cfg["request_delay_sec"],
                common_formula=common_formula,
                template_formula=template_formula,
            )
            tmpl_scenarios.extend(scenarios)

        inserted = supabase_client.insert_scenarios(tmpl_scenarios)
        total_inserted += inserted
        print(f"  {tmpl}: {inserted}개 저장 완료")

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
        choices=["formula", "init", "replenish", "monitor", "status", "collect", "test"],
        default="status",
        help="실행 모드 (formula → init 순서 권장)"
    )
    args = parser.parse_args()
    config = load_config()

    mode_map = {
        "formula":   lambda: mode_formula(config),
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
