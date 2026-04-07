#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
트랜드 수집기
=============
YouTube 인기영상 + Naver DataLab에서
한국 트랜드 키워드 상위 5개를 수집하여 JSON으로 출력합니다.

실행:
  python -X utf8 collect_trends.py
"""
from __future__ import annotations

import io
import json
import os
import random
import re
import sys
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

# ── stdout UTF-8 강제 ─────────────────────────────────────────────────────────
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ── .env 로드 ─────────────────────────────────────────────────────────────────
_ROOT_ENV = Path(__file__).parent.parent.parent.parent / ".env"
if _ROOT_ENV.exists():
    for _line in _ROOT_ENV.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            _v = _v.strip().strip('"').strip("'")
            os.environ.setdefault(_k.strip(), _v)

YOUTUBE_API_KEY     = os.environ.get("YOUTUBE_API_KEY", "")
NAVER_CLIENT_ID     = os.environ.get("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.environ.get("NAVER_CLIENT_SECRET", "")

_HERE = Path(__file__).parent
_STOPWORDS_FILE     = _HERE / "collect_trends_stopwords.json"
_NAVER_KW_FILE      = _HERE / "naver_datalab_keywords.json"
_WORLD_TMPL_FILE    = _HERE / "world_templates.json"

# ── 불용어 로드 ───────────────────────────────────────────────────────────────
def _load_stopwords() -> set[str]:
    if _STOPWORDS_FILE.exists():
        return set(json.loads(_STOPWORDS_FILE.read_text(encoding="utf-8")))
    return set()

STOPWORDS = _load_stopwords()

# ── 조사/어미 제거 ────────────────────────────────────────────────────────────
# 우선순위: 긴 것부터 매칭 (에서 > 에, 으로 > 로)
_PARTICLES = [
    "에서", "에게", "으로", "이라", "이란", "이고", "이며",
    "하니", "하고", "하며", "하여", "에도", "에만", "에는", "이나",
    "에", "를", "을", "도", "만", "은", "는", "와", "과", "나",
    "로", "서", "의", "며", "고", "니",
]

def _strip_particle(word: str) -> str:
    """단어 끝 조사/어미 제거 → 명사 형태로 정규화"""
    for p in _PARTICLES:
        if word.endswith(p) and len(word) - len(p) >= 3:
            return word[: -len(p)]
    return word


# ── 키워드 추출 (YouTube 제목용) ──────────────────────────────────────────────
def extract_keywords(texts: list[str], top_n: int = 20) -> list[str]:
    """제목 목록 → unigram(4글자 가중) + bigram(복합명사) 혼합 키워드 추출"""
    clean_re = re.compile(r'\[.*?\]|\(.*?\)|【.*?】|「.*?」|《.*?》')
    dash_re  = re.compile(r'\s*[-|]\s*.+$')
    word_re  = re.compile(r'[가-힣]{2,}')   # 2글자 이상 추출 (bigram 재료)
    valid_re = re.compile(r'^[가-힣]+$')

    # Step A: 제목 정제
    cleaned = []
    for t in texts:
        t = clean_re.sub('', t)
        t = dash_re.sub('', t)
        cleaned.append(t)

    unigram_cnt: Counter = Counter()
    bigram_cnt:  Counter = Counter()

    for t in cleaned:
        words = [w for w in word_re.findall(t) if valid_re.match(w)]

        # Step B: unigram — 조사 제거 후 불용어/길이 필터
        for w in words:
            w = _strip_particle(w)
            if len(w) < 3 or w in STOPWORDS:
                continue
            # 4글자 이상 복합명사는 2점, 3글자는 1점
            unigram_cnt[w] += 2 if len(w) >= 4 else 1

        # Step C: bigram — 인접 2단어 쌍 (각 단어 2글자 이상, 합 5글자 이상)
        for i in range(len(words) - 1):
            w1 = _strip_particle(words[i])
            w2 = _strip_particle(words[i + 1])
            if (len(w1) >= 2 and len(w2) >= 2
                    and w1 not in STOPWORDS and w2 not in STOPWORDS
                    and len(w1) + len(w2) >= 5):
                bigram_cnt[f"{w1} {w2}"] += 3   # bigram 가중치 3점

    # Step D: bigram 우선 선발 → 구성 단어는 unigram에서 제외
    results:      list[str] = []
    seen:         set[str]  = set()
    bigram_parts: set[str]  = set()

    for kw, _ in bigram_cnt.most_common(top_n):
        if len(results) >= top_n:
            break
        if kw not in seen:
            results.append(kw)
            seen.add(kw)
            bigram_parts.update(kw.split())

    # Step E: unigram으로 나머지 채움 (bigram 구성 단어 제외)
    for kw, _ in unigram_cnt.most_common(top_n * 3):
        if len(results) >= top_n:
            break
        if kw not in seen and kw not in bigram_parts:
            results.append(kw)
            seen.add(kw)

    return results


# ── YouTube 주제 검색 수집 ────────────────────────────────────────────────────
# 사회·경제·심리 분야 검색어 — 이 키워드로 YouTube를 검색해 인기 영상 제목 수집
_YT_SEARCH_QUERIES = [
    "부동산 경제",
    "청년 취업",
    "심리 상담",
    "가족 갈등",
    "1인 가구",
    "노후 준비",
    "물가 상승",
    "이혼 법률",
    "직장 스트레스",
    "세대 갈등",
]

def fetch_youtube_trends() -> tuple[list[str], str]:
    """YouTube Search API로 사회·경제·심리 주제 검색 → 인기 영상 제목 키워드 추출"""
    if not YOUTUBE_API_KEY:
        return [], "no_key"
    try:
        from googleapiclient.discovery import build
        youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

        titles: list[str] = []
        for query in _YT_SEARCH_QUERIES:
            try:
                res = youtube.search().list(
                    part="snippet",
                    q=query,
                    type="video",
                    regionCode="KR",
                    relevanceLanguage="ko",
                    order="viewCount",   # 조회수 높은 순
                    maxResults=5,
                ).execute()
                titles += [
                    item["snippet"]["title"]
                    for item in res.get("items", [])
                    if item.get("id", {}).get("kind") == "youtube#video"
                ]
            except Exception:
                continue

        if not titles:
            return [], "error: 모든 검색어 수집 실패"

        keywords = extract_keywords(titles, top_n=25)
        return keywords, "ok"
    except Exception as e:
        return [], f"error: {e}"


# ── Naver DataLab 수집 ────────────────────────────────────────────────────────
def fetch_naver_trends() -> tuple[list[str], str]:
    """Naver DataLab 검색어트랜드 API → 분야별 상위 키워드"""
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        return [], "no_key"

    naver_kw: dict = {}
    if _NAVER_KW_FILE.exists():
        naver_kw = json.loads(_NAVER_KW_FILE.read_text(encoding="utf-8"))

    if not naver_kw:
        return [], "error: naver_datalab_keywords.json 없음"

    url = "https://openapi.naver.com/v1/datalab/search"
    headers = {
        "X-Naver-Client-Id":     NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
        "Content-Type":          "application/json"
    }

    # 분야별로 키워드 그룹 묶어서 한 번에 비교
    keyword_scores: dict[str, float] = {}

    for category, keywords in naver_kw.items():
        # DataLab API: 최대 5개 keywordGroups — 키워드 5개씩 나눠 요청
        chunks = [keywords[i:i+5] for i in range(0, len(keywords), 5)]
        for chunk in chunks:
            groups = [{"groupName": kw, "keywords": [kw]} for kw in chunk]
            payload = json.dumps({
                "startDate": _date_n_days_ago(30),
                "endDate":   _today(),
                "timeUnit":  "date",
                "keywordGroups": groups
            }).encode("utf-8")

            try:
                req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode("utf-8"))

                # 각 키워드의 최근 7일 평균 ratio 계산
                for result in data.get("results", []):
                    name = result["title"]
                    ratios = [d["ratio"] for d in result.get("data", [])[-7:]]
                    avg = sum(ratios) / len(ratios) if ratios else 0
                    keyword_scores[name] = keyword_scores.get(name, 0) + avg

            except Exception as e:
                print(f"  [Naver DataLab] {category} 오류: {e}", file=sys.stderr)
                continue

    if not keyword_scores:
        return [], "error: 모든 분야 수집 실패"

    # 점수 내림차순 정렬 → 상위 15개
    sorted_kw = sorted(keyword_scores.items(), key=lambda x: x[1], reverse=True)
    top_keywords = [kw for kw, _ in sorted_kw[:15]]
    return top_keywords, "ok"


# ── 중복 병합 ─────────────────────────────────────────────────────────────────
def merge_keywords(
    youtube_kw: list[str],
    naver_kw:   list[str],
    top_n: int = 5
) -> list[dict]:
    """2개 소스 키워드 병합 → 두 소스 교차 우선 → 상위 N개"""
    source_map: dict[str, set[str]] = {}

    for kw in youtube_kw:
        kw = kw.strip()
        if kw:
            source_map.setdefault(kw, set()).add("유튜브")

    for kw in naver_kw:
        kw = kw.strip()
        if not kw:
            continue
        # 이미 YouTube에 동일 키워드 있으면 소스만 추가
        if kw in source_map:
            source_map[kw].add("네이버")
        else:
            source_map[kw] = {"네이버"}

    # 두 소스 모두 있는 것 → 우선
    both   = [(k, v) for k, v in source_map.items() if len(v) == 2]
    yt_only = [(k, v) for k, v in source_map.items() if v == {"유튜브"}]
    nv_only = [(k, v) for k, v in source_map.items() if v == {"네이버"}]

    # 결과 구성: both → YouTube/Naver 교차
    result: list[dict] = []
    for kw, sources in both:
        result.append({"keyword": kw, "sources": sorted(sources)})

    # 나머지 슬롯: YouTube와 Naver 번갈아 채움
    yt_iter = iter(yt_only)
    nv_iter = iter(nv_only)
    toggle = True
    while len(result) < top_n:
        if toggle:
            item = next(yt_iter, None) or next(nv_iter, None)
        else:
            item = next(nv_iter, None) or next(yt_iter, None)
        if item is None:
            break
        result.append({"keyword": item[0], "sources": sorted(item[1])})
        toggle = not toggle

    return result[:top_n]


# ── 세계관 제목/주제 생성 (순수 Python 템플릿) ────────────────────────────────
_world_templates_cache: dict | None = None

def _load_world_templates() -> dict:
    global _world_templates_cache
    if _world_templates_cache is not None:
        return _world_templates_cache
    if _WORLD_TMPL_FILE.exists():
        _world_templates_cache = json.loads(_WORLD_TMPL_FILE.read_text(encoding="utf-8"))
    else:
        _world_templates_cache = {"title_patterns": [], "subject_patterns": []}
    return _world_templates_cache


def _has_bachim(char: str) -> bool:
    """한글 문자의 받침(종성) 여부"""
    if not char or not ('\uAC00' <= char <= '\uD7A3'):
        return False
    return (ord(char) - 0xAC00) % 28 != 0


def _apply_josa(keyword: str, template: str) -> str:
    """템플릿의 조사 플레이스홀더를 키워드 받침에 맞게 치환
    {K이}→이/가  {K을}→을/를  {K은}→은/는  {K과}→과/와
    {K으로}→으로/로  {K이었다}→이었다/였다  {K이라}→이라/라
    """
    last = keyword[-1] if keyword else ''
    has_b = _has_bachim(last)

    result = template.replace('{keyword}', keyword)
    result = result.replace('{K이}',      '이' if has_b else '가')
    result = result.replace('{K을}',      '을' if has_b else '를')
    result = result.replace('{K은}',      '은' if has_b else '는')
    result = result.replace('{K과}',      '과' if has_b else '와')
    result = result.replace('{K으로}',    '으로' if has_b else '로')
    result = result.replace('{K이었다}',  '이었다' if has_b else '였다')
    result = result.replace('{K이라}',    '이라' if has_b else '라')
    return result


def generate_world_for_keyword(keyword: str) -> dict:
    """키워드 1개 → 웹소설 제목 10개 + 주제 10개 (템플릿 기반, API 호출 없음)"""
    templates = _load_world_templates()
    title_patterns   = templates.get("title_patterns",   [])
    subject_patterns = templates.get("subject_patterns", [])

    titles   = [_apply_josa(keyword, p) for p in random.sample(title_patterns,   min(10, len(title_patterns)))]
    subjects = [_apply_josa(keyword, p) for p in random.sample(subject_patterns, min(10, len(subject_patterns)))]
    return {"titles": titles, "subjects": subjects}


def generate_world_data(keywords: list[dict]) -> dict:
    """키워드 목록 → keyword별 제목/주제 생성 (템플릿 기반)"""
    world_data: dict[str, dict] = {}
    for item in keywords:
        kw = item["keyword"]
        world_data[kw] = generate_world_for_keyword(kw)
        print(f"  [templates] '{kw}' 생성 완료", file=sys.stderr)
    return world_data


# ── 날짜 헬퍼 ─────────────────────────────────────────────────────────────────
def _today() -> str:
    return datetime.now().strftime("%Y-%m-%d")

def _date_n_days_ago(n: int) -> str:
    from datetime import timedelta
    return (datetime.now() - timedelta(days=n)).strftime("%Y-%m-%d")


# ── 메인 ──────────────────────────────────────────────────────────────────────
def main():
    print("트랜드 수집 시작...", file=sys.stderr)

    source_status: dict[str, str] = {}
    youtube_kw: list[str] = []
    naver_kw:   list[str] = []
    # 2개 소스 병렬 수집
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {
            executor.submit(fetch_youtube_trends): "youtube",
            executor.submit(fetch_naver_trends):   "naver_datalab",
        }
        for future in as_completed(futures):
            source = futures[future]
            try:
                keywords, status = future.result()
                source_status[source] = status
                if source == "youtube":
                    youtube_kw = keywords
                elif source == "naver_datalab":
                    naver_kw = keywords
                print(f"  [{source}] {status} — {len(keywords)}개", file=sys.stderr)
            except Exception as e:
                source_status[source] = f"error: {e}"
                print(f"  [{source}] 오류: {e}", file=sys.stderr)

    # 전체 실패 체크
    if not youtube_kw and not naver_kw:
        result = {"error": "모든 소스 수집 실패", "source_status": source_status}
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(1)

    # 병합
    merged = merge_keywords(youtube_kw, naver_kw, top_n=20)

    # 키워드별 제목/주제 사전 생성 (템플릿, API 호출 없음)
    print("세계관 데이터 생성 중 (템플릿)...", file=sys.stderr)
    world_data = generate_world_data(merged)

    result = {
        "keywords":      merged,
        "collected_at":  datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_status": source_status,
        "world_data":    world_data,
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
