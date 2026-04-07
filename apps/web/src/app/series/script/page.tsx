'use client';

import React, { useCallback } from 'react';

const GOOGLE_API_KEY_STORAGE = 'ld_google_api_key';

// ── IndexedDB 헬퍼 ────────────────────────────────────────────────
const IDB_NAME = 'linkdrop_series';
const IDB_STORE = 'scripts';
const IDB_SCENES_STORE = 'scenes';

// ── 서브씬 (씬 내 세분화 단위) ──────────────────────────────────────
const SUB_TARGET = 45;  // 목표 글자수 (공백 제외) ≈ 10초
const SUB_MIN    = 20;  // 최소 글자수 ≈ 4초
const SUB_MAX    = 72;  // 최대 글자수 ≈ 16초
const SUB_LIMIT  = 15;  // 씬당 안전 상한 (정상 경로에서는 작동 안 함)

interface SubScene {
  subIndex: number;
  cutCode: string;          // 마스터코드 ch##s##[h|n]c## (예: ch01s03hc02)
  text: string;
  charCount: number;
  estimatedSec: number;
  imageHint: string;
  splitReason: 'sentence' | 'dialogue_turn' | 'forced';
}

interface SceneParsed {
  index: number;          // 표시 순서 (hook이면 0, 나머지 순차)
  originalIndex: number;  // 대본 원래 순서
  sceneCode: string;      // 마스터코드 ch##s##[h|n] (예: ch01s03h)
  text: string;
  imageHint: string;
  isHook: boolean;
  type: 'narration' | 'dialogue' | 'mixed';
  charCount: number;
  estimatedSec: number;
  imageUrl: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  subScenes: SubScene[];
}

function openScriptDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(IDB_SCENES_STORE)) {
        db.createObjectStore(IDB_SCENES_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveScenesToDB(seriesId: string, chapter: number, scenes: SceneParsed[]) {
  try {
    const db = await openScriptDB();
    const tx = db.transaction(IDB_SCENES_STORE, 'readwrite');
    tx.objectStore(IDB_SCENES_STORE).put({ id: `${seriesId}__ch${chapter}__scenes`, seriesId, chapter, scenes, savedAt: new Date().toISOString() });
    await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
    db.close();
  } catch (e) { console.warn('[IDB] scenes 저장 실패:', e); }
}

function stripMetaTags(text: string): string {
  return text
    .replace(/^\[HOOK\]\s*\n?/gim, '')
    .replace(/^\[IMAGE:[^\]]*\]\s*\n?/gim, '')
    .replace(/^\[IMAGE_\d+:[^\]]*\]\s*\n?/gim, '')   // 서브씬 이미지 힌트 제거
    .replace(/^\/\/\/[ \t]*\n?/gim, '')               // 컷 구분자 제거
    .replace(/\n[ \t]*---[ \t]*\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const p2 = (n: number) => String(n).padStart(2, '0');

function splitToSubScenes(text: string, imageHint: string, sceneCode: string, subImageHints: string[] = []): SubScene[] {
  // ── 모드 1: /// 컷 구분자 기반 분할 (최우선 — 의미 단위 보장) ──────────────
  if (/^\/\/\/[ \t]*$/m.test(text)) {
    const cutBlocks = text.split(/^\/\/\/[ \t]*$/m).map(b => b.trim()).filter(Boolean);
    const groups = cutBlocks.slice(0, SUB_LIMIT);
    return groups.map((block, i) => {
      // 블록 내 [IMAGE_N:] 태그 추출 및 제거 (새 포맷: 각 컷 블록 앞에 태그 위치)
      let cleanBlock = block;
      let inlineHint = '';
      const inlineImgRe = /^\[IMAGE_\d+:\s*(.+?)\]\s*/;
      let inlineMatch: RegExpMatchArray | null;
      while ((inlineMatch = cleanBlock.match(inlineImgRe)) !== null) {
        if (!inlineHint) inlineHint = inlineMatch[1].trim();
        cleanBlock = cleanBlock.slice(inlineMatch[0].length);
      }
      // 블록 중간에 남은 [IMAGE_N:] 태그 전체 제거 (Gemini 비정형 출력 대비)
      cleanBlock = cleanBlock.replace(/\[IMAGE_\d+:[^\]]*\]\s*/g, '');
      const t = cleanBlock.trim();
      const cc = t.replace(/\s/g, '').length;
      // 우선순위: parseScenes 추출 subImageHints[i] > 블록 내 [IMAGE_N:] > 씬 imageHint 폴백
      const hint = subImageHints[i] ?? (inlineHint || imageHint);
      return {
        subIndex: i,
        cutCode: `${sceneCode}c${p2(i + 1)}`,
        text: t,
        charCount: cc,
        estimatedSec: Math.round(cc / 4.5),
        imageHint: hint,
        splitReason: 'sentence' as const,
      };
    });
  }

  // ── 문장 분리 (모드 2, 3 공통) ─────────────────────────────────────────────
  // 모드 2/3에서 [IMAGE_N:] 태그가 text에 남아 있을 경우 전체 제거
  const safeText = text.replace(/\[IMAGE_\d+:[^\]]*\]\s*/g, '');
  const sentenceRe = /([^.!?。！？…—"]*[.!?。！？…—](?:")?|"[^"]*"|\n)/g;
  const sentences: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = sentenceRe.exec(safeText)) !== null) {
    const seg = safeText.slice(last, m.index + m[0].length).trim();
    if (seg) sentences.push(seg);
    last = m.index + m[0].length;
  }
  const tail = safeText.slice(last).trim();
  if (tail) sentences.push(tail);
  if (sentences.length === 0) sentences.push(safeText);

  // ── 모드 2: IMAGE 태그 수 기반 균등 분배 (폴백 1 — 구버전 대본 호환) ────────
  const targetCount = subImageHints.length >= 2
    ? Math.min(subImageHints.length, SUB_LIMIT)
    : 0;

  const groups: Array<{ texts: string[]; reason: SubScene['splitReason'] }> = [];

  if (targetCount > 0) {
    const perGroup = Math.ceil(sentences.length / targetCount);
    for (let i = 0; i < targetCount; i++) {
      const slice = sentences.slice(i * perGroup, (i + 1) * perGroup);
      if (slice.length > 0) groups.push({ texts: slice, reason: 'sentence' });
    }
  } else {
    // ── 모드 3: 글자수 기반 분할 (폴백 2) ──────────────────────────────────────
    let cur: string[] = [];
    let curChars = 0;

    const flush = (reason: SubScene['splitReason']) => {
      if (cur.length) { groups.push({ texts: [...cur], reason }); cur = []; curChars = 0; }
    };

    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      const sc = s.replace(/\s/g, '').length;

      if (curChars + sc > SUB_MAX && curChars >= SUB_MIN) flush('sentence');

      const isDialogueStart = s.trimStart().startsWith('"');
      if (isDialogueStart && curChars >= SUB_MIN) flush('dialogue_turn');

      cur.push(s);
      curChars += sc;

      if (curChars >= SUB_TARGET) flush('sentence');
    }
    flush('sentence');

    // 너무 짧은 마지막 그룹 병합
    if (groups.length >= 2) {
      const last = groups[groups.length - 1];
      const lastChars = last.texts.join('').replace(/\s/g, '').length;
      if (lastChars < SUB_MIN) {
        groups[groups.length - 2].texts.push(...last.texts);
        groups.pop();
      }
    }

    // 안전 상한 초과 시 병합
    while (groups.length > SUB_LIMIT) {
      let minIdx = 0;
      let minChars = Infinity;
      for (let i = 0; i < groups.length - 1; i++) {
        const combined = [...groups[i].texts, ...groups[i + 1].texts].join('').replace(/\s/g, '').length;
        if (combined < minChars) { minChars = combined; minIdx = i; }
      }
      groups[minIdx].texts.push(...groups[minIdx + 1].texts);
      groups.splice(minIdx + 1, 1);
    }
  }

  // SubScene 배열 생성
  // 서브씬 imageHint 우선순위: subImageHints[i] > imageHint(씬 레벨 폴백) > ''
  return groups.map((g, i) => {
    const t = g.texts.join(' ').replace(/\s+/g, ' ').trim();
    const cc = t.replace(/\s/g, '').length;
    const hint = subImageHints[i] ?? imageHint;  // 옵션A: 빈 경우 씬 imageHint로 폴백
    return {
      subIndex: i,
      cutCode: `${sceneCode}c${p2(i + 1)}`,
      text: t,
      charCount: cc,
      estimatedSec: Math.round(cc / 4.5),
      imageHint: hint,
      splitReason: g.reason,
    };
  });
}

function parseScenes(raw: string, chapter: number): SceneParsed[] {
  const chPfx = `ch${p2(chapter)}`;
  const blocks = raw.split(/\n[ \t]*---[ \t]*\n/);
  const parsed: Array<Omit<SceneParsed, 'index'>> = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // [HOOK] 감지
    const isHook = /^\[HOOK\]\s*\n/i.test(trimmed);
    const withoutHook = isHook ? trimmed.replace(/^\[HOOK\]\s*\n/i, '') : trimmed;

    // [IMAGE: ...] 감지 (씬 전체 힌트)
    const imageMatch = withoutHook.match(/^\[IMAGE:\s*(.+?)\]\n?/);
    const imageHint = imageMatch ? imageMatch[1].trim() : '';
    let afterImage = imageMatch ? withoutHook.slice(imageMatch[0].length) : withoutHook;

    // [IMAGE_1:], [IMAGE_2:], ... 감지 (서브씬별 힌트) — IMAGE 바로 다음 줄들
    // trimStart()로 같은 줄 공백 구분도 처리
    const subImageHints: string[] = [];
    const subImgRe = /^\[IMAGE_(\d+):\s*(.+?)\]\n?/;
    let subMatch: RegExpMatchArray | null;
    while ((subMatch = afterImage.match(subImgRe)) !== null) {
      subImageHints[parseInt(subMatch[1], 10) - 1] = subMatch[2].trim();
      afterImage = afterImage.slice(subMatch[0].length).trimStart();
    }

    const text = afterImage.trim();
    if (!text) continue;

    const quoteCount = (text.match(/"/g) ?? []).length;
    const type: SceneParsed['type'] = quoteCount >= 6 ? 'dialogue' : quoteCount === 0 ? 'narration' : 'mixed';
    const charCount = text.replace(/\s/g, '').length;
    const origIdx = parsed.length;
    const sceneCode = `${chPfx}s${p2(origIdx + 1)}${isHook ? 'h' : 'n'}`;  // 예: ch01s03h
    const subScenes = splitToSubScenes(text, imageHint, sceneCode, subImageHints);
    parsed.push({ originalIndex: origIdx, sceneCode, text, imageHint, isHook, type, charCount, estimatedSec: Math.round(charCount / 4.5), imageUrl: '', status: 'pending', subScenes });
  }

  // 폴백: 씬이 3개 미만이면 빈줄 2개 기준으로 재분할
  if (parsed.length < 3) {
    const fallbackBlocks = raw.split(/\n{2,}/).filter(b => b.replace(/\s/g, '').length > 20);
    return fallbackBlocks.map((b, i) => {
      const text = b.replace(/^\[HOOK\]\s*\n/i, '').replace(/^\[IMAGE:.+?\]\n?/, '').trim();
      const charCount = text.replace(/\s/g, '').length;
      const sc = `${chPfx}s${p2(i + 1)}n`;
      return { index: i, originalIndex: i, sceneCode: sc, text, imageHint: '', isHook: false, type: 'mixed' as const, charCount, estimatedSec: Math.round(charCount / 4.5), imageUrl: '', status: 'pending' as const, subScenes: splitToSubScenes(text, '', sc) };
    });
  }

  // HOOK 씬을 맨 앞으로 복사 (원본 위치 유지)
  // S3이 HOOK이면 → [S3(hook), S1, S2, S3(copy), S4, S5, S6]
  const hookIdx = parsed.findIndex(s => s.isHook);
  if (hookIdx > 0) {
    const hook = parsed[hookIdx];
    // 원본 위치의 씬은 isHook:false 복사본으로 교체 (일반 씬으로 표시)
    parsed[hookIdx] = { ...hook, isHook: false };
    // 맨 앞에 훅 씬 삽입 (isHook:true 유지)
    parsed.unshift(hook);
  }

  // index = display 순서, sceneCode는 originalIndex 기반으로 이미 확정
  return parsed.map((s, i) => ({ ...s, index: i }));
}

async function saveScriptToDB(seriesId: string, topic: string, chapter: number, content: string, nlmFact: string) {
  try {
    const db = await openScriptDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({
      id: `${seriesId}__ch${chapter}`,
      seriesId,
      topic,
      chapter,
      content,
      nlmFact,
      savedAt: new Date().toISOString(),
    });
    await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
    db.close();
  } catch (e) {
    console.warn('[IDB] 저장 실패:', e);
  }
}

async function loadAllFromDB(seriesId: string, chapters: number): Promise<{
  contents: Record<number, string>;
  facts: Record<number, string>;
  scenes: Record<number, SceneParsed[]>;
} | null> {
  try {
    const db = await openScriptDB();
    const results: { contents: Record<number, string>; facts: Record<number, string>; scenes: Record<number, SceneParsed[]> } =
      { contents: {}, facts: {}, scenes: {} };

    for (let ch = 1; ch <= chapters; ch++) {
      await new Promise<void>(resolve => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(`${seriesId}__ch${ch}`);
        req.onsuccess = () => {
          const r = req.result;
          if (r?.content) {
            results.contents[ch] = r.content;
            if (r.nlmFact) results.facts[ch] = r.nlmFact;
          }
          resolve();
        };
        req.onerror = () => resolve();
      });

      await new Promise<void>(resolve => {
        const tx = db.transaction(IDB_SCENES_STORE, 'readonly');
        const req = tx.objectStore(IDB_SCENES_STORE).get(`${seriesId}__ch${ch}__scenes`);
        req.onsuccess = () => {
          const r = req.result;
          if (r?.scenes?.length) results.scenes[ch] = r.scenes;
          resolve();
        };
        req.onerror = () => resolve();
      });
    }

    db.close();
    return results;
  } catch {
    return null;
  }
}

const A4_W  = 794;
const A4_H  = 1123;
const PAD_V = 60;
const PAD_H = 72;
const MIN_CHAPTERS = 4;
const MAX_CHAPTERS = 12;
const DEFAULT_CHAPTERS = 6;

function getChapterSub(num: number, total: number): string {
  if (num === 1) return '도입부';
  if (num === total) return '결말';
  if (num === total - 1) return '클라이맥스';
  return `전개${'①②③④⑤⑥⑦⑧'.charAt(num - 2) || num - 1}`;
}

function buildChapterLabels(total: number) {
  return Array.from({ length: total }, (_, i) => ({
    num: i + 1,
    title: `${i + 1}챕터`,
    sub: getChapterSub(i + 1, total),
  }));
}

interface EmotionLine {
  id?: string;
  fromId?: string;
  toId?: string;
  type?: string;
  color?: string;
}

interface WorldData {
  seriesId?: string;
  topic?: string;
  genre?: string;
  style?: string;
  relationship?: string;
  conflictTypes?: string[];
  chapters?: number;
  charAName?: string;
  charAOccupation?: string;
  charAPersonality?: string;
  charASpeakingStyle?: string;
  charASituation?: string;
  charASecret?: string;
  charAGoal?: string;
  charAWant?: string;
  charANeed?: string;
  charAEmotionArc?: string[];
  charBName?: string;
  charBOccupation?: string;
  charBPersonality?: string;
  charBSpeakingStyle?: string;
  charBSituation?: string;
  charBSecret?: string;
  charBGoal?: string;
  charBWant?: string;
  charBNeed?: string;
  charBEmotionArc?: string[];
  coreWound?: string;
  emotionLines?: EmotionLine[];
  supportingCast?: string[];
  trendTitles?: string[];
  trendSubjects?: string[];
}

export default function SeriesScriptPage() {
  const [world, setWorld] = React.useState<WorldData | null>(null);
  const [totalChapters, setTotalChapters] = React.useState(DEFAULT_CHAPTERS);
  const [activeChapter, setActiveChapter] = React.useState(1);
  const [contents, setContents] = React.useState<Record<number, string>>({});
  const [nlmFacts, setNlmFacts] = React.useState<Record<number, string>>({});
  const [title, setTitle] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [genError, setGenError] = React.useState('');
  const [scenes, setScenes] = React.useState<Record<number, SceneParsed[]>>({});
  const [subHintsPending, setSubHintsPending] = React.useState(false);
  const [panelTop, setPanelTop] = React.useState(212);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const scenesRef = React.useRef<Record<number, SceneParsed[]>>({});
  const saveSceneDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const worldBarRef = React.useRef<HTMLDivElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const tabBarRef = React.useRef<HTMLDivElement>(null);

  const autoResize = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(600, el.scrollHeight)}px`;
  }, []);
  const contentsRef = React.useRef<Record<number, string>>({});
  const nlmFactsRef = React.useRef<Record<number, string>>({});

  React.useEffect(() => {
    let data: WorldData | null = null;
    try {
      const raw = sessionStorage.getItem('series_world');
      if (raw) {
        data = JSON.parse(raw);
        setWorld(data);
        if (data!.chapters) setTotalChapters(Number(data!.chapters));
      }
    } catch { /* ignore */ }

    const savedTitle = sessionStorage.getItem('series_title');
    if (savedTitle) setTitle(savedTitle);

    // IDB 복원
    if (!data) return;
    const seriesId = data.seriesId ?? data.topic ?? '';
    if (!seriesId) return;

    // 위키 초기화 — wiki/{series_id}/ 폴더가 없을 때만 생성 (Gemini 호출 0회)
    fetch('/api/wiki/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ series_id: seriesId, world: data }),
    }).catch(e => console.warn('[wiki/init] 실패:', e));
    const chapters = data.chapters ? Number(data.chapters) : DEFAULT_CHAPTERS;

    loadAllFromDB(seriesId, chapters).then(result => {
      if (!result) return;
      if (Object.keys(result.contents).length > 0) {
        setContents(prev => { const next = { ...prev, ...result.contents }; contentsRef.current = next; return next; });
      }
      if (Object.keys(result.facts).length > 0) {
        setNlmFacts(prev => { const next = { ...prev, ...result.facts }; nlmFactsRef.current = next; return next; });
      }
      if (Object.keys(result.scenes).length > 0) {
        setScenes(prev => { const next = { ...prev, ...result.scenes }; scenesRef.current = next; return next; });
      }
    });
  }, []);

  const chapterLabels = React.useMemo(() => buildChapterLabels(totalChapters), [totalChapters]);

  const CHAR_MIN = 2500;
  const CHAR_MAX = 4000;
  const charCount = (contents[activeChapter] ?? '').replace(/\s/g, '').length;
  const totalCharCount = Object.values(contents).reduce((acc, v) => acc + v.replace(/\s/g, '').length, 0);

  const handleContentChange = (val: string) => {
    setContents(prev => {
      const next = { ...prev, [activeChapter]: val };
      contentsRef.current = next;
      return next;
    });
    autoResize();
  };

  const handleTotalChaptersChange = (val: number) => {
    const next = Math.min(MAX_CHAPTERS, Math.max(MIN_CHAPTERS, val));
    setTotalChapters(next);
    if (activeChapter > next) setActiveChapter(next);
  };

  const handleGenerate = useCallback(async () => {
    if (!world || generating) return;
    setGenError('');
    const apiKey = localStorage.getItem(GOOGLE_API_KEY_STORAGE) ?? '';
    if (!apiKey) {
      setGenError('GOOGLE_API_KEY가 없습니다. 상단 설정(⚙)에서 입력하세요.');
      return;
    }
    const chapterRole = chapterLabels[activeChapter - 1]?.sub ?? '';

    // 이전 스트림 강제 종료
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setGenerating(true);
    setContents(prev => ({ ...prev, [activeChapter]: '' }));

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    try {
      const res = await fetch('/api/series/script/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          world,
          chapter: activeChapter,
          chapterRole,
          apiKey,
          prev_chapter_ending: activeChapter > 1
            ? (contents[activeChapter - 1] ?? '').slice(-500)
            : undefined,
          series_id: world?.seriesId ?? world?.topic ?? '',
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        setGenError(err.error ?? 'AI 생성 실패');
        return;
      }

      reader = res.body?.getReader() ?? null;
      if (!reader) return;
      const decoder = new TextDecoder();
      let buf = '';
      let isDone = false;

      while (!isDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.error) {
              setGenError(`생성 오류: ${payload.error}`);
              isDone = true;
              break;
            }
            if (payload.nlm_facts) {
              setNlmFacts(prev => {
                const next = { ...prev, [activeChapter]: payload.nlm_facts };
                nlmFactsRef.current = next;
                return next;
              });
            }
            if (payload.done) {
              const finalContent = contentsRef.current[activeChapter] ?? '';
              const finalFact = nlmFactsRef.current[activeChapter] ?? '';
              // 씬 파싱은 태그 포함 원본으로
              const parsed = parseScenes(finalContent, activeChapter);
              setScenes(prev => { const next = { ...prev, [activeChapter]: parsed }; scenesRef.current = next; return next; });
              saveScenesToDB(world?.seriesId ?? world?.topic ?? '', activeChapter, parsed);

              // 2차 서브씬 이미지 힌트 — 별도 API 호출 (모든 컷 대상, c01 포함)
              // c01: 씬 imageHint(1차) + 컷 세부(2차) 합산
              // c02+: 씬 imageHint + 컷 세부 합산
              const subHintItems = parsed.flatMap((scene, si) =>
                scene.subScenes.map(sub => ({
                  sceneIndex: si,
                  subIndex: sub.subIndex,
                  text: sub.text,
                  parentImageHint: scene.imageHint,
                }))
              );
              if (subHintItems.length > 0) {
                const seriesKey = world?.seriesId ?? world?.topic ?? '';
                const chapterSnap = activeChapter;
                setSubHintsPending(true);
                fetch('/api/series/sub-image-hints', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ items: subHintItems, apiKey }),
                })
                  .then(r => r.json())
                  .then(({ results }) => {
                    if (!results?.length) return;
                    setScenes(prev => {
                      const arr = [...(prev[chapterSnap] ?? [])];
                      results.forEach(({ sceneIndex, subIndex, imageHint }: { sceneIndex: number; subIndex: number; imageHint: string }) => {
                        const scene = arr[sceneIndex];
                        if (!scene) return;
                        const subs = [...scene.subScenes];
                        if (subs[subIndex]) {
                          const combined = scene.imageHint
                            ? `${scene.imageHint}, ${imageHint}`
                            : imageHint;
                          subs[subIndex] = { ...subs[subIndex], imageHint: combined };
                        }
                        arr[sceneIndex] = { ...scene, subScenes: subs };
                      });
                      saveScenesToDB(seriesKey, chapterSnap, arr);
                      const next = { ...prev, [chapterSnap]: arr }; scenesRef.current = next; return next;
                    });
                  })
                  .then(() => setSubHintsPending(false))
                  .catch(err => { console.warn('[sub-image-hints] 실패:', err); setSubHintsPending(false); });
              }

              // 대본 저장·표시는 태그 제거 버전으로
              const cleanContent = stripMetaTags(finalContent);
              setContents(prev => {
                const next = { ...prev, [activeChapter]: cleanContent };
                contentsRef.current = next;
                return next;
              });
              saveScriptToDB(world?.seriesId ?? world?.topic ?? '', world?.topic ?? '', activeChapter, cleanContent, finalFact);

              // wiki ingest는 서버 백그라운드에서 자동 처리 (series_generate.py _ingest_after_stream)

              isDone = true;
              break;
            }
            if (payload.text) {
              setContents(prev => {
                const next = { ...prev, [activeChapter]: (prev[activeChapter] ?? '') + payload.text };
                contentsRef.current = next;
                return next;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setGenError(`네트워크 오류: ${e.message}`);
      }
    } finally {
      reader?.cancel();
      setGenerating(false);
      textareaRef.current?.focus();
    }
  }, [world, generating, activeChapter, chapterLabels]);

  const handleDownloadScript = useCallback(() => {
    const content = contents[activeChapter] ?? '';
    if (!content.trim()) return;
    const chRole = chapterLabels[activeChapter - 1]?.sub ?? '';
    const header = `[ ${title || '제목 없음'} ] — 챕터 ${activeChapter} (${chRole})\n${'='.repeat(40)}\n\n`;
    const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `대본_ch${activeChapter}_${world?.topic ?? title ?? '시리즈'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [title, chapterLabels, contents, world, activeChapter]);

  const handleDownloadScenario = useCallback(() => {
    const chScenes = scenes[activeChapter];
    if (!chScenes?.length) return;
    const payload = {
      seriesId: world?.seriesId ?? world?.topic ?? '',
      topic: world?.topic ?? '',
      title,
      chapter: activeChapter,
      role: chapterLabels[activeChapter - 1]?.sub ?? '',
      exportedAt: new Date().toISOString(),
      scenes: chScenes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `씬구성_ch${activeChapter}_${world?.topic ?? title ?? '시리즈'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [scenes, world, title, chapterLabels, activeChapter]);

  const handleKeyframe = useCallback(() => {
    const ch1Scenes = scenes[1];
    if (!ch1Scenes?.length) {
      alert('챕터 1 대본을 먼저 생성하세요.');
      return;
    }
    sessionStorage.setItem('series_keyframe_scenes', JSON.stringify(ch1Scenes));
    sessionStorage.setItem('series_keyframe_chapter', '1');
    sessionStorage.setItem('series_world', JSON.stringify(world));
    window.location.href = '/series/keyframe';
  }, [scenes, world]);

  React.useEffect(() => {
    textareaRef.current?.focus();
    autoResize();
  }, [activeChapter, autoResize]);

  // 콘텐츠 변경 시 (스트리밍 포함) 자동 높이 확장
  React.useEffect(() => {
    autoResize();
  }, [contents[activeChapter], autoResize]);

  // sticky top 동적 계산 (ResizeObserver)
  React.useEffect(() => {
    const GNB_H = 52;
    const FLEX_PAD = 24;
    const elements = [worldBarRef.current, toolbarRef.current, tabBarRef.current].filter(Boolean) as HTMLElement[];
    const calc = () => {
      const stackH = elements.reduce((sum, el) => sum + el.offsetHeight, 0);
      setPanelTop(GNB_H + stackH + FLEX_PAD);
    };
    calc();
    if (!elements.length) return;
    const ro = new ResizeObserver(calc);
    elements.forEach(el => ro.observe(el));
    return () => ro.disconnect();
  }, [world]); // world 변경 시 세계관 바 등장/사라짐 → 재계산

  // 언마운트 시 진행 중 스트림 정리
  React.useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const filledCount = chapterLabels.filter(ch => (contents[ch.num] ?? '').replace(/\s/g, '').length > 0).length;
  const progressPct = Math.round((totalCharCount / (CHAR_MAX * totalChapters)) * 100);

  return (
    <div className="relative overflow-x-hidden -mt-[52px]"
      style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 40%, #f0fdf4 100%)', minHeight: '100vh' }}>

      {/* ── 대본 생성 중 오버레이 ── */}
      {generating && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(240,244,255,0.72)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}>
          <div style={{ position: 'relative', width: 160, height: 160 }}>
            {/* 외곽 링 */}
            <svg width="160" height="160" style={{ position: 'absolute', inset: 0, animation: 'spin 2.2s linear infinite' }}>
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth="6" />
              <circle cx="80" cy="80" r="70" fill="none"
                stroke="url(#grad-outer)" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="180 260"
                strokeDashoffset="0"
              />
              <defs>
                <linearGradient id="grad-outer" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#c4b5fd" />
                </linearGradient>
              </defs>
            </svg>
            {/* 내부 링 */}
            <svg width="160" height="160" style={{ position: 'absolute', inset: 0, animation: 'spin 3.4s linear infinite reverse' }}>
              <circle cx="80" cy="80" r="52" fill="none" stroke="rgba(124,58,237,0.1)" strokeWidth="4" />
              <circle cx="80" cy="80" r="52" fill="none"
                stroke="url(#grad-inner)" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="100 228"
                strokeDashoffset="0"
              />
              <defs>
                <linearGradient id="grad-inner" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
              </defs>
            </svg>
            {/* 중앙 아이콘 */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>✦</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.04em' }}>
                Ch{activeChapter}
              </span>
            </div>
          </div>
          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#5b21b6', marginBottom: 6 }}>
              대본 생성 중
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.7 }}>
              {chapterLabels[activeChapter - 1]?.sub} 챕터를 집필하고 있습니다<br />
              잠시만 기다려 주세요
            </div>
          </div>
        </div>
      )}

      {/* 배경 블롭 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full lg-blob lg-blob-light-1" style={{ opacity: 0.6 }} />
        <div className="absolute rounded-full lg-blob lg-blob-light-2" style={{ opacity: 0.5 }} />
        <div className="absolute rounded-full lg-blob lg-blob-light-3" style={{ opacity: 0.4 }} />
      </div>

      {/* ── 세계관 컨텍스트 바 ── */}
      {world && (
        <div ref={worldBarRef} className="sticky z-50 border-b"
          style={{
            top: '52px',
            background: 'rgba(237,233,254,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderColor: 'rgba(167,139,250,0.3)',
            boxShadow: '0 2px 16px rgba(124,58,237,0.08)',
          }}>
          <div className="flex items-center gap-2 flex-wrap px-6 py-2" style={{ maxWidth: A4_W + 48, margin: '0 auto' }}>
            {world.topic && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black text-purple-700"
                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
                {world.topic}
              </span>
            )}
            {world.genre && (
              <span className="text-[11px] text-purple-500 font-medium">· {world.genre}</span>
            )}
            {world.style && (
              <span className="text-[11px] text-purple-400">· {world.style}</span>
            )}
            {world.relationship && (
              <span className="text-[11px] text-purple-500 font-medium">· {world.relationship}</span>
            )}
            {world.conflictTypes && world.conflictTypes.length > 0 && (
              <div className="flex gap-1">
                {world.conflictTypes.map(c => (
                  <span key={c} className="text-[10px] px-2 py-0.5 rounded-full font-medium text-purple-600"
                    style={{ background: 'rgba(124,58,237,0.08)' }}>
                    {c}
                  </span>
                ))}
              </div>
            )}
            {world.charAName && world.charBName && (
              <span className="ml-auto text-[11px] font-bold text-purple-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[9px] font-black">A</span>
                {world.charAName}
                <span className="text-purple-300">↔</span>
                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-black">B</span>
                {world.charBName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── 상단 툴바 ── */}
      <div ref={toolbarRef} className="sticky z-50 border-b"
        style={{
          top: world ? '96px' : '52px',
          background: 'rgba(255,255,255,0.80)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(15,23,42,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}>
        <div className="flex items-center gap-3" style={{ maxWidth: A4_W + 48, margin: '0 auto', paddingLeft: 24, paddingRight: 24, minHeight: 48 }}>

          {/* 페이지 타이틀 */}
          <div className="flex items-center gap-2 shrink-0">
            <span style={{ background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, letterSpacing: '0.06em' }}>05</span>
            <span className="text-sm font-bold text-gray-700 shrink-0">대본 만들기</span>
          </div>
          <div className="w-px h-4 bg-gray-200 shrink-0" />

          {/* 제목 입력 */}
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); sessionStorage.setItem('series_title', e.target.value); }}
            placeholder="시리즈 제목을 입력하세요"
            className="flex-1 text-sm font-bold text-gray-800 bg-transparent outline-none placeholder:text-gray-300"
          />

          {/* 챕터 수 조정 */}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pl-3 border-l border-gray-100">
            <span>챕터</span>
            <button
              onClick={() => handleTotalChaptersChange(totalChapters - 1)}
              disabled={totalChapters <= MIN_CHAPTERS}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-base font-bold transition-all hover:bg-gray-100 disabled:opacity-30"
            >−</button>
            <span className="font-black text-gray-700 w-4 text-center">{totalChapters}</span>
            <button
              onClick={() => handleTotalChaptersChange(totalChapters + 1)}
              disabled={totalChapters >= MAX_CHAPTERS}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-base font-bold transition-all hover:bg-gray-100 disabled:opacity-30"
            >+</button>
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-3 text-[11px] text-gray-400 pl-3 border-l border-gray-100">
            <span>
              전체 <strong className="text-gray-700">{totalCharCount.toLocaleString()}</strong>자
            </span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1">
              <span className="font-black text-purple-600">{filledCount}</span>
              <span>/ {totalChapters} 챕터</span>
            </span>
          </div>

          {/* AI 생성 버튼 */}
          {world && (() => {
            // 앞의 모든 챕터가 채워져 있어야 현재 챕터 생성 가능
            const prevFilled = activeChapter === 1
              || Array.from({ length: activeChapter - 1 }, (_, i) => i + 1)
                   .every(n => (contents[n] ?? '').replace(/\s/g, '').length > 0);
            const isLocked = !prevFilled;
            const isDisabled = generating || isLocked;
            return (
              <button
                onClick={isDisabled ? undefined : handleGenerate}
                title={isLocked ? `챕터 ${activeChapter - 1}을 먼저 완성하세요` : ''}
                className="flex items-center gap-1.5 pl-3 border-l border-gray-100"
                style={{
                  background: isDisabled
                    ? 'rgba(124,58,237,0.08)'
                    : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: isDisabled ? '#9ca3af' : 'white',
                  border: isDisabled ? '1px solid rgba(124,58,237,0.2)' : 'none',
                  borderRadius: 8,
                  padding: '5px 14px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: isDisabled ? 'default' : 'pointer',
                  boxShadow: isDisabled ? 'none' : '0 2px 8px rgba(124,58,237,0.35)',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  opacity: isLocked ? 0.5 : 1,
                }}
              >
                {generating ? (
                  <span className="flex items-center gap-1.5">
                    <span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid #9ca3af', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    생성 중…
                  </span>
                ) : isLocked ? (
                  <>🔒 챕터 {activeChapter - 1} 먼저</>
                ) : (
                  <>✦ AI 대본 생성</>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* ── 에러 배너 ── */}
      {genError && (
        <div className="flex items-center gap-3 px-5 py-2.5"
          style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.18)' }}>
          <span style={{ color: '#dc2626', fontSize: 13, flex: 1 }}>⚠ {genError}</span>
          <button onClick={() => setGenError('')}
            style={{ color: '#dc2626', fontSize: 16, lineHeight: 1, opacity: 0.6 }}>✕</button>
        </div>
      )}

      {/* ── 챕터 탭 ── */}
      <div ref={tabBarRef} className="sticky z-40 border-b"
        style={{
          top: world ? '144px' : '100px',
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderColor: 'rgba(15,23,42,0.06)',
        }}>
        <div className="flex" style={{ maxWidth: A4_W + 48, margin: '0 auto' }}>
          {chapterLabels.map(ch => {
            const chCount = (contents[ch.num] ?? '').replace(/\s/g, '').length;
            const isActive = activeChapter === ch.num;
            const isFilled = chCount > 0;
            const isOver = chCount > CHAR_MAX;
            const isReady = chCount >= CHAR_MIN && chCount <= CHAR_MAX;
            return (
              <button
                key={ch.num}
                onClick={() => setActiveChapter(ch.num)}
                className="flex-1 flex flex-col items-center py-2.5 transition-all relative"
                style={{
                  borderBottom: isActive ? '2.5px solid #7c3aed' : '2.5px solid transparent',
                }}
              >
                <span className={`text-[11px] font-black transition-colors ${isActive ? 'text-purple-700' : 'text-gray-400'}`}>
                  {ch.title}
                </span>
                <span className={`text-[9px] mt-0.5 transition-colors ${isActive ? 'text-purple-400' : 'text-gray-300'}`}>
                  {ch.sub}
                </span>
                {isFilled && (
                  <span className={`absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full ${isReady ? 'bg-purple-400' : isOver ? 'bg-amber-400' : 'bg-gray-300'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 좌측 패널 + A4 본문 + 우측 패널 ── */}
      <div className="flex justify-center gap-5" style={{ position: 'relative', zIndex: 1, padding: '24px 24px 80px', alignItems: 'flex-start' }}>
        {/* ── 좌측 주연 캐릭터 패널 ── */}
        {world && (
          <div className="no-scrollbar" style={{ width: 220, flexShrink: 0, position: 'sticky', top: panelTop, alignSelf: 'flex-start' }}>
            <div style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(124,58,237,0.12)',
              borderRadius: 14,
              boxShadow: '0 4px 24px rgba(124,58,237,0.08)',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#7c3aed', letterSpacing: '0.08em' }}>주연 캐릭터</div>

              {/* 인물 A */}
              {world.charAName && (
                <div style={{ background: 'rgba(124,58,237,0.04)', borderRadius: 10, padding: '10px 10px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#7c3aed', color: 'white', fontSize: 9, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>A</span>
                    {world.charAName}
                  </div>
                  {[world.charAOccupation, world.charAPersonality, world.charASituation].filter(Boolean).map((v, i) => (
                    <div key={i} style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.6, paddingLeft: 4 }}>· {v}</div>
                  ))}
                  {world.charAGoal && <div style={{ fontSize: 10, color: '#7c3aed', marginTop: 5, paddingLeft: 4, borderTop: '1px solid rgba(124,58,237,0.08)', paddingTop: 5 }}>목표: {world.charAGoal}</div>}
                  {world.charASecret && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 3, paddingLeft: 4 }}>비밀: {world.charASecret}</div>}
                  {world.charAWant && <div style={{ fontSize: 10, color: '#7c3aed', marginTop: 3, paddingLeft: 4 }}>Want: {world.charAWant}</div>}
                  {world.charANeed && <div style={{ fontSize: 10, color: '#9333ea', marginTop: 2, paddingLeft: 4 }}>Need: {world.charANeed}</div>}
                  {(() => {
                    const arc = world.charAEmotionArc?.[activeChapter - 1];
                    return arc ? (
                      <div style={{ fontSize: 10, color: '#db2777', marginTop: 5, paddingLeft: 4, borderTop: '1px solid rgba(124,58,237,0.08)', paddingTop: 5 }}>
                        Ch{activeChapter}: {arc}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* 인물 B */}
              {world.charBName && (
                <div style={{ background: 'rgba(79,70,229,0.04)', borderRadius: 10, padding: '10px 10px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#4f46e5', color: 'white', fontSize: 9, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>B</span>
                    {world.charBName}
                  </div>
                  {[world.charBOccupation, world.charBPersonality, world.charBSituation].filter(Boolean).map((v, i) => (
                    <div key={i} style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.6, paddingLeft: 4 }}>· {v}</div>
                  ))}
                  {world.charBGoal && <div style={{ fontSize: 10, color: '#4f46e5', marginTop: 5, paddingLeft: 4, borderTop: '1px solid rgba(79,70,229,0.08)', paddingTop: 5 }}>목표: {world.charBGoal}</div>}
                  {world.charBSecret && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 3, paddingLeft: 4 }}>비밀: {world.charBSecret}</div>}
                  {world.charBWant && <div style={{ fontSize: 10, color: '#4f46e5', marginTop: 3, paddingLeft: 4 }}>Want: {world.charBWant}</div>}
                  {world.charBNeed && <div style={{ fontSize: 10, color: '#6366f1', marginTop: 2, paddingLeft: 4 }}>Need: {world.charBNeed}</div>}
                  {(() => {
                    const arc = world.charBEmotionArc?.[activeChapter - 1];
                    return arc ? (
                      <div style={{ fontSize: 10, color: '#db2777', marginTop: 5, paddingLeft: 4, borderTop: '1px solid rgba(79,70,229,0.08)', paddingTop: 5 }}>
                        Ch{activeChapter}: {arc}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* coreWound */}
              {world.coreWound && (
                <div style={{ background: 'rgba(220,38,38,0.04)', borderRadius: 10, padding: '8px 10px', border: '1px solid rgba(220,38,38,0.1)' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#dc2626', letterSpacing: '0.08em', marginBottom: 4 }}>CORE WOUND</div>
                  <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.6 }}>{world.coreWound}</div>
                </div>
              )}

              {/* 감정선 */}
              {world.emotionLines && world.emotionLines.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 6 }}>감정선</div>
                  {world.emotionLines.map((el, i) => (
                    <div key={i} style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.7, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: el.color ?? '#9ca3af', flexShrink: 0 }} />
                      <span style={{ color: el.color ?? '#6b7280', fontWeight: 600 }}>{el.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── A4 대본 편집 영역 ── */}
        <div
          style={{
            width: A4_W,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255,255,255,0.96)',
            borderRadius: 4,
            border: '1px solid rgba(15,23,42,0.06)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,1) inset',
          }}
        >
          {/* 챕터 헤더 */}
          <div style={{ padding: `${PAD_V * 0.6}px ${PAD_H}px ${PAD_V * 0.3}px`, borderBottom: '1px solid #f0f0f0' }}>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-[11px] font-black text-purple-400 tracking-widest uppercase">
                  Chapter {activeChapter}
                </span>
                <span className="text-[11px] text-gray-300">
                  {chapterLabels[activeChapter - 1]?.sub}
                </span>
              </div>
              <div className="text-[11px] text-gray-400">
                {charCount > 0
                  ? <>
                      <strong className={charCount >= CHAR_MIN ? 'text-purple-600' : 'text-gray-600'}>
                        {charCount.toLocaleString()}
                      </strong>
                      <span className="text-gray-300"> / {CHAR_MIN.toLocaleString()}~{CHAR_MAX.toLocaleString()}자</span>
                      {charCount >= CHAR_MIN && charCount <= CHAR_MAX && (
                        <span className="ml-2 text-purple-500 font-bold">✓ 완성</span>
                      )}
                      {charCount > CHAR_MAX && (
                        <span className="ml-2 text-amber-500 font-bold">⚠ +{(charCount - CHAR_MAX).toLocaleString()}자</span>
                      )}
                    </>
                  : <span className="text-gray-300">목표 {CHAR_MIN.toLocaleString()}~{CHAR_MAX.toLocaleString()}자</span>
                }
              </div>
            </div>
          </div>

          {/* 편집 영역 */}
          <div style={{ padding: `${PAD_V * 0.8}px ${PAD_H}px ${PAD_V}px`, flex: 1 }}>
            <textarea
              ref={textareaRef}
              value={contents[activeChapter] ?? ''}
              onChange={e => handleContentChange(e.target.value)}
              placeholder={`챕터 ${activeChapter} — ${chapterLabels[activeChapter - 1]?.sub}\n\n내용을 입력하세요...`}
              className="w-full outline-none resize-none text-gray-800 placeholder:text-gray-200"
              style={{
                minHeight: 600,
                height: 'auto',
                overflow: 'hidden',
                fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                fontSize: 14,
                lineHeight: 2.0,
                letterSpacing: '0.01em',
                border: 'none',
                background: 'transparent',
              }}
            />
          </div>

          {/* 페이지 하단 */}
          <div className="flex items-center justify-between px-6 pb-5"
            style={{ color: '#d1d5db', fontSize: 10 }}>
            <span>{title || '제목 없음'}</span>
            <span>{activeChapter} / {totalChapters}</span>
          </div>
        </div>

        {/* ── 우측 패널: 조연 + NLM 팩트 + 제목/주제 후보 ── */}
        {world && (
          <div className="no-scrollbar" style={{ width: 220, flexShrink: 0, position: 'sticky', top: panelTop, alignSelf: 'flex-start' }}>
            <div style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(124,58,237,0.12)',
              borderRadius: 14,
              boxShadow: '0 4px 24px rgba(124,58,237,0.08)',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#9ca3af', letterSpacing: '0.08em' }}>챕터 참고</div>

              {/* 조연 */}
              {world.supportingCast && world.supportingCast.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 6 }}>조연</div>
                  {world.supportingCast.map((s, i) => (
                    <div key={i} style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.6 }}>· {s}</div>
                  ))}
                </div>
              )}

              {/* NLM 팩트 */}
              {nlmFacts[activeChapter] && (
                <div style={{ borderTop: world.supportingCast?.length ? '1px solid rgba(124,58,237,0.08)' : 'none', paddingTop: world.supportingCast?.length ? 14 : 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(124,58,237,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: '#7c3aed' }}>N</span>
                    NLM 팩트 — Ch{activeChapter}
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {nlmFacts[activeChapter]}
                  </div>
                </div>
              )}

              {/* 제목 후보 */}
              {world.trendTitles && world.trendTitles.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(124,58,237,0.08)', paddingTop: 14 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 6 }}>제목 후보</div>
                  {world.trendTitles.map((t, i) => (
                    <div key={i} style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.7, display: 'flex', gap: 4 }}>
                      <span style={{ color: '#c4b5fd', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 주제 후보 */}
              {world.trendSubjects && world.trendSubjects.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(124,58,237,0.08)', paddingTop: 14 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 6 }}>주제 후보</div>
                  {world.trendSubjects.map((s, i) => (
                    <div key={i} style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.7, display: 'flex', gap: 4 }}>
                      <span style={{ color: '#a5b4fc', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 데이터 없을 때 */}
              {!world.supportingCast?.length && !nlmFacts[activeChapter] && !world.trendTitles?.length && (
                <div style={{ fontSize: 10, color: '#d1d5db', textAlign: 'center', padding: '20px 0' }}>
                  AI 대본 생성 후<br />팩트가 표시됩니다
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 씬 구성 시나리오 — 씬 1개 = A4 1장 ── */}
      {scenes[activeChapter] && scenes[activeChapter].length > 0 && (
        <div style={{ position: 'relative', zIndex: 1, padding: '0 24px 32px' }}>
          {scenes[activeChapter].map((scene, idx) => {
            const typeBadge = scene.type === 'dialogue'
              ? { label: '대화', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' }
              : scene.type === 'narration'
              ? { label: '나레이션', color: '#059669', bg: 'rgba(5,150,105,0.08)' }
              : { label: '혼합', color: '#d97706', bg: 'rgba(217,119,6,0.08)' };

            const accentColor = scene.isHook ? '#dc2626' : '#7c3aed';
            const accentLight = scene.isHook ? 'rgba(220,38,38,0.06)' : 'rgba(124,58,237,0.04)';
            const accentBorder = scene.isHook ? 'rgba(220,38,38,0.14)' : 'rgba(124,58,237,0.10)';

            return (
              <div
                key={`${scene.originalIndex}_${scene.isHook}`}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 20,
                  alignItems: 'flex-start',
                  marginBottom: 24,
                }}
              >
                {/* 좌측 여백 */}
                {world && <div style={{ width: 220, flexShrink: 0 }} />}

                {/* A4 씬 용지 1장 */}
                <div style={{
                  width: A4_W,
                  background: 'rgba(255,255,255,0.97)',
                  borderRadius: 4,
                  border: `1px solid ${scene.isHook ? 'rgba(220,38,38,0.18)' : 'rgba(15,23,42,0.06)'}`,
                  boxShadow: scene.isHook
                    ? '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(220,38,38,0.07), inset 0 1px 0 rgba(255,255,255,1)'
                    : '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)',
                }}>

                  {/* 용지 헤더 */}
                  <div style={{
                    padding: `${PAD_V * 0.5}px ${PAD_H}px ${PAD_V * 0.3}px`,
                    borderBottom: `1px solid ${scene.isHook ? 'rgba(220,38,38,0.12)' : '#f0f0f0'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* 씬 번호 */}
                      <span style={{
                        fontSize: 11, fontWeight: 900, letterSpacing: '0.08em',
                        color: 'white',
                        background: accentColor,
                        padding: '3px 10px', borderRadius: 5,
                      }}>
                        S{scene.index + 1}
                      </span>
                      {scene.isHook && (
                        <span style={{
                          fontSize: 10, fontWeight: 900, color: '#dc2626',
                          background: 'rgba(220,38,38,0.08)', borderRadius: 4,
                          padding: '2px 8px', letterSpacing: '0.05em',
                        }}>
                          HOOK
                        </span>
                      )}
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        color: typeBadge.color, background: typeBadge.bg,
                        borderRadius: 4, padding: '2px 8px',
                      }}>
                        {typeBadge.label}
                      </span>
                      <span style={{ fontSize: 10, color: '#d1d5db' }}>
                        Chapter {activeChapter} · {chapterLabels[activeChapter - 1]?.sub}
                      </span>
                      {scene.isHook && scene.originalIndex > 0 && (
                        <span style={{ fontSize: 9, color: '#9ca3af' }}>
                          원래 {scene.originalIndex + 1}번째 씬
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: '#9ca3af' }}>
                      {/* 씬 마스터코드 — Neuromorphic pill badge */}
                      <span style={{
                        fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
                        color: '#fff',
                        background: 'linear-gradient(145deg, #7c3aed, #6d28d9)',
                        borderRadius: 9999,
                        padding: '3px 12px',
                        letterSpacing: '0.06em',
                        boxShadow: '0 2px 8px rgba(124,58,237,0.45), 0 1px 3px rgba(0,0,0,0.25)',
                        display: 'inline-block',
                      }}>
                        {scene.sceneCode}
                      </span>
                      <span style={{
                        fontWeight: 700, color: accentColor,
                        background: accentLight, borderRadius: 4, padding: '1px 7px',
                      }}>
                        {scene.subScenes.length} cuts
                      </span>
                      <span>{scene.charCount.toLocaleString()}자</span>
                      <span>·</span>
                      <span>{scene.estimatedSec}초</span>
                      <span style={{ color: '#e5e7eb' }}>|</span>
                      <span>{idx + 1} / {scenes[activeChapter].length}</span>
                    </div>
                  </div>

                  {/* 용지 본문 */}
                  <div style={{ padding: `${PAD_V * 0.5}px ${PAD_H}px ${PAD_V * 0.6}px` }}>

                    {/* IMAGE HINT — 씬 전체 */}
                    {scene.imageHint && (
                      <div style={{
                        marginBottom: 14,
                        background: accentLight,
                        border: `1px solid ${accentBorder}`,
                        borderRadius: 6, padding: '8px 12px',
                      }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: accentColor, letterSpacing: '0.1em', marginBottom: 4 }}>
                          IMAGE HINT
                        </div>
                        <textarea
                          value={scene.imageHint}
                          rows={2}
                          onChange={e => {
                            const newHint = e.target.value;
                            let updatedArr: SceneParsed[] = [];
                            setScenes(prev => {
                              const arr = [...(prev[activeChapter] ?? [])];
                              arr[scene.index] = { ...arr[scene.index], imageHint: newHint };
                              updatedArr = arr;
                              const next = { ...prev, [activeChapter]: arr };
                              scenesRef.current = next;
                              return next;
                            });
                            if (saveSceneDebounceRef.current) clearTimeout(saveSceneDebounceRef.current);
                            saveSceneDebounceRef.current = setTimeout(() => {
                              if (updatedArr.length) saveScenesToDB(world?.seriesId ?? world?.topic ?? '', activeChapter, updatedArr);
                            }, 500);
                          }}
                          style={{
                            width: '100%', fontSize: 11, color: '#6b7280',
                            background: 'transparent', border: 'none',
                            resize: 'none', fontFamily: 'inherit',
                            lineHeight: 1.7, outline: 'none',
                          }}
                        />
                      </div>
                    )}

                    {/* 서브씬 목록 */}
                    <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(124,58,237,0.08)' }}>
                      {scene.subScenes.map((sub, si) => {
                        const isEven = si % 2 === 0;
                        return (
                          <div key={sub.cutCode} style={{
                              background: isEven ? 'rgba(249,250,251,0.8)' : 'rgba(255,255,255,0.6)',
                              borderBottom: si < scene.subScenes.length - 1 ? '1px solid rgba(124,58,237,0.06)' : 'none',
                            }}>
                            {/* ── 마스터코드 배지 바 ── */}
                            {(() => {
                              const m = sub.cutCode.match(/^(ch\d+)(s\d+)([hn])(c\d+)$/);
                              const isHookCut = m?.[3] === 'h';
                              return (
                                <div style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  padding: '6px 16px 0',
                                }}>
                                  {/* 세그먼트 배지 */}
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'stretch',
                                    borderRadius: 9999, overflow: 'hidden',
                                    fontFamily: 'monospace', fontWeight: 800,
                                    fontSize: 11,
                                    boxShadow: '0 2px 8px rgba(109,40,217,0.4), 0 1px 3px rgba(0,0,0,0.2)',
                                    letterSpacing: '0.04em',
                                    userSelect: 'all',
                                  }}>
                                    {m ? (
                                      <>
                                        <span style={{ background: '#4c1d95', color: '#c4b5fd', padding: '3px 8px' }}>{m[1]}</span>
                                        <span style={{ background: '#5b21b6', color: '#ddd6fe', padding: '3px 7px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{m[2]}</span>
                                        <span style={{
                                          background: isHookCut ? '#92400e' : '#6d28d9',
                                          color: isHookCut ? '#fde68a' : '#ede9fe',
                                          padding: '3px 6px',
                                          borderLeft: '1px solid rgba(255,255,255,0.1)',
                                        }}>{m[3]}</span>
                                        <span style={{ background: '#7c3aed', color: '#fff', padding: '3px 10px', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>{m[4]}</span>
                                      </>
                                    ) : (
                                      <span style={{ background: '#7c3aed', color: '#fff', padding: '3px 12px' }}>{sub.cutCode}</span>
                                    )}
                                  </span>
                                  {/* 예상 시간 */}
                                  <span style={{ fontSize: 9, color: '#9ca3af' }}>{sub.estimatedSec}초</span>
                                  {/* 대화 레이블 */}
                                  {sub.splitReason === 'dialogue_turn' && (
                                    <span style={{
                                      fontSize: 8, color: '#7c3aed', fontWeight: 700,
                                      background: 'rgba(124,58,237,0.1)', borderRadius: 4, padding: '1px 6px',
                                    }}>대화</span>
                                  )}
                                </div>
                              );
                            })()}

                            {/* 콘텐츠 영역 */}
                            <div style={{ padding: '8px 16px 12px' }}>
                              {/* 서브씬 imageHint */}
                              {sub.imageHint && (
                                <div style={{
                                  fontSize: 9, color: '#a78bfa', fontWeight: 600,
                                  letterSpacing: '0.03em', marginBottom: 6,
                                  paddingBottom: 5,
                                  borderBottom: '1px dashed rgba(167,139,250,0.25)',
                                }}>
                                  ✦ {sub.imageHint}
                                </div>
                              )}
                              <div style={{
                                fontSize: 13, color: '#374151', lineHeight: 2.0,
                                fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                                letterSpacing: '0.01em',
                              }}>
                                {sub.text}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 용지 푸터 */}
                  <div style={{
                    padding: `0 ${PAD_H}px 14px`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderTop: '1px solid #f5f5f5', paddingTop: 10,
                  }}>
                    <span style={{ fontSize: 10, color: '#e5e7eb' }}>
                      {title || '제목 없음'} — Scene Breakdown
                    </span>
                    <span style={{ fontSize: 10, color: '#e5e7eb' }}>
                      Ch{activeChapter} · S{scene.index + 1}
                    </span>
                  </div>
                </div>

                {/* 우측 여백 */}
                {world && <div style={{ width: 220, flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 액션 버튼 바 ── */}
      <div style={{ maxWidth: A4_W + 48, margin: '0 auto', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>

          {/* 대본 다운로드 (현재 챕터) */}
          {(() => {
            const active = !!(contents[activeChapter] ?? '').trim();
            return (
              <button
                onClick={handleDownloadScript}
                disabled={!active}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 18px', borderRadius: 10,
                  background: active ? 'rgba(255,255,255,0.92)' : 'rgba(243,244,246,0.7)',
                  border: '1px solid rgba(124,58,237,0.18)',
                  boxShadow: active ? '0 2px 12px rgba(124,58,237,0.08)' : 'none',
                  backdropFilter: 'blur(12px)',
                  fontSize: 12, fontWeight: 700,
                  color: active ? '#5b21b6' : '#9ca3af',
                  cursor: active ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 15 }}>📄</span>
                Ch{activeChapter} 대본.txt
              </button>
            );
          })()}

          {/* 씬 시나리오 다운로드 (현재 챕터) */}
          {(() => {
            const active = !!(scenes[activeChapter]?.length);
            return (
              <button
                onClick={handleDownloadScenario}
                disabled={!active || subHintsPending}
                title={subHintsPending ? '이미지 힌트 생성 중... 완료 후 다운로드하세요' : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 18px', borderRadius: 10,
                  background: active ? 'rgba(255,255,255,0.92)' : 'rgba(243,244,246,0.7)',
                  border: '1px solid rgba(124,58,237,0.18)',
                  boxShadow: active ? '0 2px 12px rgba(124,58,237,0.08)' : 'none',
                  backdropFilter: 'blur(12px)',
                  fontSize: 12, fontWeight: 700,
                  color: active ? '#5b21b6' : '#9ca3af',
                  cursor: active ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 15 }}>{subHintsPending ? '⏳' : '🎬'}</span>
                {subHintsPending ? '힌트 생성 중...' : `Ch${activeChapter} 씬구성.json`}
              </button>
            );
          })()}

          {/* 챕터1 키프레임 제작 */}
          <button
            onClick={handleKeyframe}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px',
              borderRadius: 10,
              background: scenes[1]?.length
                ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                : 'rgba(243,244,246,0.7)',
              border: scenes[1]?.length ? 'none' : '1px solid rgba(124,58,237,0.15)',
              boxShadow: scenes[1]?.length ? '0 4px 16px rgba(124,58,237,0.35)' : 'none',
              fontSize: 12, fontWeight: 700,
              color: scenes[1]?.length ? 'white' : '#9ca3af',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 15 }}>🖼️</span>
            챕터1 키프레임 제작
          </button>
        </div>
      </div>

      {/* ── 하단 진행 바 ── */}
      <div className="sticky bottom-0 z-50 border-t"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderColor: 'rgba(15,23,42,0.07)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.04)',
        }}>
        <div className="flex items-center gap-3 py-2.5" style={{ maxWidth: A4_W + 48, margin: '0 auto', paddingLeft: 24, paddingRight: 24 }}>
          <span className="text-[11px] text-gray-400 shrink-0">진행률</span>
          <div className="flex gap-1 flex-1">
            {chapterLabels.map(ch => {
              const cnt = (contents[ch.num] ?? '').replace(/\s/g, '').length;
              const pct = Math.min(100, Math.round((cnt / CHAR_MAX) * 100));
              const isActive = activeChapter === ch.num;
              return (
                <div key={ch.num} className="flex-1">
                  <div className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: isActive ? 'rgba(124,58,237,0.12)' : '#f0f0f4' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? 'linear-gradient(90deg, #7c3aed, #6d28d9)' : 'linear-gradient(90deg, #c4b5fd, #a78bfa)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <span className="text-[11px] font-black shrink-0"
            style={{ color: progressPct >= 100 ? '#7c3aed' : '#9ca3af' }}>
            {progressPct}%
          </span>
        </div>
      </div>
    </div>
  );
}
