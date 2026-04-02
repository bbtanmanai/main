"""Gemini accent 타입 정의 — translate.py / browser.py 공용.
새 accent 타입 추가 시 이 파일만 수정하면 두 경로 모두 자동 반영.
"""

# ── 씬 역할 분류 → 허용 타입 매핑 ───────────────────────────────────────────
# Gemini가 먼저 씬의 서사적 역할을 선언하면 선택 가능한 타입 공간이 좁아진다.
SCENE_ROLE_ALLOWED: dict[str, list[str]] = {
    "hook":      ["key_point", "contrast_statement", "num", "bar"],
    "explain":   ["flow", "list", "icon_grid", "bar", "timeline"],
    "contrast":  ["contrast_statement", "split_screen", "bar", "comparison_table"],
    "evidence":  ["num", "stat_card", "bar", "ranking_list"],
    "emotional": ["key_point", "quote_hero"],
    "cta":       [],                      # 행동 유도 씬 → accent 없음
    "summary":   ["list", "flow", "key_point"],
}

# ── Gemini 프롬프트용 씬 역할 설명 ────────────────────────────────────────────
SCENE_ROLE_PROMPT = """\
STEP 1 — Classify the scene's narrative role (pick exactly ONE):
- "hook":      grabs attention, poses a shocking question, states a striking fact
- "explain":   explains a concept, reason, process, or background
- "contrast":  before/after, old vs new, misconception vs reality
- "evidence":  provides data, statistics, or cited proof
- "emotional": empathy, personal story, reflection, philosophical statement
- "cta":       calls to subscribe, follow, comment, or share
- "summary":   wraps up, lists key takeaways

STEP 2 — Based on the role, pick 0-2 visual accents from the ALLOWED TYPES only:
- hook      → key_point, contrast_statement, num (ONLY if a stat IS the hook)
- explain   → flow, list, icon_grid, bar, timeline
- contrast  → contrast_statement, split_screen, bar, comparison_table
- evidence  → num, stat_card, bar, ranking_list
- emotional → key_point, quote_hero
- cta       → [] (return empty array, NO exceptions)
- summary   → list, flow, key_point"""

# ── Gemini 프롬프트에 삽입되는 타입 정의 블록 ─────────────────────────────────
ACCENT_TYPES_PROMPT = """\
TYPE DEFINITIONS (use ONLY types allowed for the scene role above):

NARRATIVE TYPES (preferred — use these first):
- "key_point":          [hook/emotional/summary] One powerful sentence as the hero visual.
  NO numbers required. Use when the sentence itself IS the message.
  {"type":"key_point", "text":"지금 당신의 선택이 10년 후를 바꿉니다", "emphasis":"선택", "hint":"당신의 선택이"}

- "contrast_statement": [hook/contrast] Unexpected reversal or misconception correction.
  Pattern: "알고 보니 / 사실은 / 놀랍게도 / 반대로".
  {"type":"contrast_statement", "before":"우리가 믿어온 상식", "after":"실제로는 정반대입니다", "hint":"사실은"}

- "flow":               [explain] 3-5 ordered steps or phases.
  {"type":"flow", "steps":["준비","실행","확인"], "hint":"먼저"}

- "list":               [explain/summary] 3+ parallel items without strict order.
  {"type":"list", "items":["항목1","항목2","항목3"], "hint":"세 가지"}

- "split_screen":       [contrast] Two contrasting states (before/after, past/now).
  {"type":"split_screen", "splitTitle":"변화", "splitLeft":{"label":"예전","value":"3시간","points":["설명"]}, "splitRight":{"label":"지금","value":"15분","points":["설명"]}, "hint":"예전에는"}

- "icon_grid":          [explain] 4-8 features or concepts with emoji icons.
  {"type":"icon_grid", "iconGridTitle":"핵심 기능", "iconGridItems":[{"icon":"💡","label":"아이디어","desc":"설명","highlight":true}], "hint":"핵심"}

- "quote_hero":         [emotional] A memorable quote from a named person.
  {"type":"quote_hero", "quote":"인용 문장", "speaker":"이름", "role":"직책", "hint":"말했습니다"}

DATA TYPES (use ONLY when numbers are the core of the scene's message):
- "num":                [evidence only] ONE impactful statistic. Value MUST be a number/%.
  CRITICAL: Do NOT use if a number merely appears in passing — the stat must BE the point.
  {"type":"num", "value":"49만개", "label":"사업장 폐업", "hint":"49만 개의"}

- "bar":                [evidence/contrast] Two numeric values compared head-to-head.
  {"type":"bar", "left":{"label":"A그룹","value":"91%"}, "right":{"label":"B그룹","value":"61%"}, "hint":"비해"}

- "stat_card":          [evidence] 3+ key metrics together as a dashboard.
  {"type":"stat_card", "title":"핵심 지표", "stats":[{"value":"94%","label":"만족도","trend":"↑"}], "hint":"세 가지 수치"}

- "comparison_table":   [contrast] Multi-row structured comparison of 2 options.
  Use ONLY when the scene explicitly contrasts two named options across multiple criteria.
  {"type":"comparison_table", "leftLabel":"A안", "rightLabel":"B안", "rows":[{"label":"가격","left":"저렴","right":"비쌈","winner":"left"}], "hint":"비교하면"}

- "ranking_list":       [evidence] TOP-N ranking with explicit rank values.
  {"type":"ranking_list", "rankingTitle":"TOP 순위", "rankingUnit":"위", "rankingItems":[{"label":"항목","value":"1위","desc":"설명"}], "hint":"1위"}

- "timeline":           [explain] Events in chronological order (years/dates present).
  {"type":"timeline", "timelineItems":[{"year":"2020","title":"사건","desc":"설명"}], "hint":"년에"}

- "flowchart":          [explain] Process with explicit decision/branch points.
  Use only if "만약/그렇다면/아니라면" branching is present in the scene.
  {"type":"flowchart", "flowchartTitle":"흐름", "flowchartNodes":[{"label":"시작","type":"start"},{"label":"조건?","type":"decision"},{"label":"완료","type":"end"}], "hint":"만약"}"""

# ── 유효 타입 집합 — Gemini 응답 검증에 사용 ────────────────────────────────────
VALID_ACCENT_TYPES = {
    # 서사 타입 (신규 포함)
    "key_point", "contrast_statement",
    # 기존 구조 타입
    "flow", "list", "split_screen", "icon_grid", "quote_hero",
    # 데이터 타입
    "num", "bar", "stat_card", "comparison_table", "ranking_list",
    "timeline", "flowchart",
}
