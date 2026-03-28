'use client';

import React from 'react';
import Link from 'next/link';

interface MotionOption { id: string; label: string; prompt: string; desc: string; }
interface NegOption    { id: string; label: string; prompt: string; }

// 캐릭터 없음: 공간·배경 중심 카메라
const MOVE_OPTIONS: MotionOption[] = [
  { id: 'push-in',      label: '슬로우 푸시인',  prompt: 'slow push-in toward subject',            desc: '피사체를 향해 천천히 밀고 들어갑니다.' },
  { id: 'pull-out',     label: '줌아웃',          prompt: 'slow pull-out, reveal environment',       desc: '물러나며 배경 전체를 서서히 드러냅니다.' },
  { id: 'pan-left',     label: '팬 우→좌',        prompt: 'smooth pan from right to left',           desc: '오른쪽에서 왼쪽으로 부드럽게 훑습니다.' },
  { id: 'pan-right',    label: '팬 좌→우',        prompt: 'smooth pan from left to right',           desc: '왼쪽에서 오른쪽으로 부드럽게 훑습니다.' },
  { id: 'tilt-down',    label: '틸트 위→아래',    prompt: 'slow tilt down from sky',                 desc: '하늘에서 아래로 천천히 내려옵니다.' },
  { id: 'tilt-up',      label: '틸트 아래→위',    prompt: 'slow tilt up, reveal sky',                desc: '아래에서 위로 올라가 하늘을 드러냅니다.' },
  { id: 'aerial-drift', label: '공중 드리프트',   prompt: "aerial drift forward, bird's eye glide",  desc: '공중에서 앞으로 흘러가는 드론 샷입니다.' },
  { id: 'static',       label: '정지',            prompt: 'static hold, no camera movement',         desc: '카메라 고정. 정적인 긴장감을 만듭니다.' },
];

// 캐릭터 있음: 피사체를 향한 카메라
const SUBJECT_MOVE_OPTIONS: MotionOption[] = [
  { id: 'push-in',      label: '슬로우 푸시인',  prompt: 'slow push-in toward subject',                       desc: '캐릭터를 향해 천천히 밀고 들어갑니다.' },
  { id: 'orbit',        label: '오빗',            prompt: 'slow orbit around subject, circular movement',      desc: '캐릭터 주위를 천천히 공전합니다.' },
  { id: 'pull-out',     label: '풀아웃',          prompt: 'slow pull-out revealing subject in environment',    desc: '캐릭터에서 물러나며 주변을 드러냅니다.' },
  { id: 'tilt-down',    label: '틸트 위→아래',    prompt: 'slow tilt down from sky to subject',               desc: '하늘에서 내려오며 캐릭터를 발견합니다.' },
  { id: 'tilt-up',      label: '틸트 아래→위',    prompt: 'slow tilt up from subject to sky, low angle',      desc: '로우앵글에서 캐릭터를 올려다봅니다.' },
  { id: 'handheld',     label: '핸드헬드',        prompt: 'subtle handheld shake following subject',          desc: '캐릭터를 따라가는 현장감 있는 흔들림입니다.' },
  { id: 'static',       label: '정지',            prompt: 'static hold focused on subject, no camera movement', desc: '캐릭터를 고정 프레임으로 담습니다.' },
];

// 캐릭터 없음: 카메라 이동 속도
const SPEED_OPTIONS: MotionOption[] = [
  { id: 'very-slow', label: '매우 느리게', prompt: 'extremely slow camera movement, barely perceptible', desc: '카메라가 거의 느껴지지 않을 정도로 미세하게 움직입니다.' },
  { id: 'slow',      label: '느리게',     prompt: 'slow and deliberate camera movement',                 desc: '카메라가 의도적으로 느리게 움직여 무게감을 더합니다.' },
  { id: 'medium',    label: '보통',       prompt: 'steady medium camera pace',                           desc: '자연스럽고 안정적인 카메라 속도입니다.' },
  { id: 'fast',      label: '빠르게',     prompt: 'fast energetic camera movement',                      desc: '카메라가 빠르게 움직여 역동적인 에너지를 전달합니다.' },
];

// 캐릭터 있음: 캐릭터 동작 속도
const SUBJECT_SPEED_OPTIONS: MotionOption[] = [
  { id: 'very-slow', label: '매우 느리게', prompt: 'extremely slow body movement, nearly frozen in time', desc: '동작이 거의 정지에 가까운 느린 움직임입니다.' },
  { id: 'slow',      label: '느리게',     prompt: 'slow languid movement, unhurried and deliberate',     desc: '여유롭고 의도적인 느린 동작으로 무게감이 느껴집니다.' },
  { id: 'medium',    label: '보통',       prompt: 'natural pace, relaxed and fluid movement',            desc: '자연스럽고 편안한 일반적인 동작 속도입니다.' },
  { id: 'fast',      label: '빠르게',     prompt: 'quick brisk movement, energetic and dynamic',         desc: '빠르고 힘찬 동작으로 에너지가 넘칩니다.' },
];

// ── 주요 캐릭터 있음: 행동 옵션 ─────────────────────────────────────────────
const SUBJECT_ACTION_OPTIONS: MotionOption[] = [
  { id: 'breathing',   label: '호흡',       prompt: 'breathing slowly, subtle chest movement',        desc: '가슴이 미세하게 오르내리며 살아있는 느낌을 줍니다.' },
  { id: 'head-turn',   label: '시선 이동',  prompt: 'slow head turn toward camera',                    desc: '카메라 쪽으로 천천히 고개를 돌립니다.' },
  { id: 'hair-flow',   label: '머리카락',   prompt: 'hair flowing gently in the wind',                 desc: '바람에 머리카락이 부드럽게 흩날립니다.' },
  { id: 'walking',     label: '걷기',       prompt: 'walking slowly forward',                          desc: '천천히 앞으로 걸어갑니다.' },
  { id: 'hand-gesture',label: '손 동작',    prompt: 'subtle hand gesture, natural arm movement',       desc: '손이나 팔이 자연스럽게 움직입니다.' },
  { id: 'look-down-up',label: '시선 변화',  prompt: 'looking down, then slowly raising gaze',          desc: '고개를 숙였다가 천천히 들어 올립니다.' },
  { id: 'trembling',   label: '미세 떨림',  prompt: 'subtle trembling, nervous micro-movement',        desc: '긴장감이나 두려움이 느껴지는 미세한 떨림입니다.' },
  { id: 'still',       label: '최소 움직임',prompt: 'standing still, minimal movement, rigid posture', desc: '거의 움직이지 않는 정적인 존재감입니다.' },
];

// ── 주요 캐릭터 없음: 환경 모션 옵션 ────────────────────────────────────────
const ENV_MOTION_OPTIONS: MotionOption[] = [
  { id: 'wind-leaves',  label: '나뭇잎 바람',  prompt: 'wind blowing through leaves, branches swaying',     desc: '바람에 나뭇잎과 가지가 흔들립니다.' },
  { id: 'water-ripple', label: '수면 파동',    prompt: 'water surface rippling, gentle waves',               desc: '수면에 잔물결이 퍼져 나갑니다.' },
  { id: 'clouds-drift', label: '구름 이동',    prompt: 'clouds drifting slowly across sky',                  desc: '구름이 하늘을 천천히 가로질러 흐릅니다.' },
  { id: 'smoke-rise',   label: '연기 상승',    prompt: 'smoke rising gradually, curling wisps',              desc: '연기가 천천히 피어오르며 흩어집니다.' },
  { id: 'rain-fall',    label: '빗방울',       prompt: 'rain falling gently, raindrops on surface',          desc: '빗방울이 부드럽게 내려앉습니다.' },
  { id: 'fire-flicker', label: '불꽃',         prompt: 'fire flickering, flame dancing',                     desc: '불꽃이 살랑살랑 춤을 춥니다.' },
  { id: 'light-shift',  label: '빛 변화',      prompt: 'sunlight shifting, light rays moving through scene', desc: '햇빛이 공간을 가로지르며 변화합니다.' },
  { id: 'dust-float',   label: '먼지·입자',    prompt: 'dust particles floating in light, bokeh shimmer',    desc: '빛 속에 먼지나 입자가 유영합니다.' },
];

// ── 후크 강도 ─────────────────────────────────────────────────────────────────
const HOOK_OPTIONS: MotionOption[] = [
  { id: 'none',     label: '없음',      prompt: '',                                                                           desc: '후크 효과 없이 일반 씬으로 제작합니다.' },
  { id: 'impact',   label: '시각 충격', prompt: 'extreme close-up, crash zoom, sudden reveal, fill frame',                    desc: '극단적 클로즈업과 급격한 줌으로 순간 시선을 빼앗습니다.' },
  { id: 'tension',  label: '긴장감',    prompt: 'suspenseful atmosphere, tense moment, foreboding shadows, held breath',      desc: '긴장감 있는 분위기로 다음 장면에 대한 기대를 높입니다.' },
  { id: 'dramatic', label: '드라마틱',  prompt: 'cinematic reveal, high contrast lighting, epic scale, wide establishing',    desc: '시네마틱 드라마틱 리빌로 스케일을 강조합니다.' },
  { id: 'mystery',  label: '미스터리',  prompt: 'mysterious atmosphere, obscured details, curiosity-evoking, half-revealed',  desc: '정보를 숨겨 궁금증을 유발하는 미스터리한 분위기입니다.' },
];

const NEGATIVE_OPTIONS: NegOption[] = [
  { id: 'blur',       label: '흔들림·흐림',   prompt: 'blurry, out of focus, shaky camera' },
  { id: 'lowqual',    label: '저화질',         prompt: 'low quality, pixelated, compressed artifacts' },
  { id: 'text',       label: '텍스트',          prompt: 'text, letters, words, typography, captions' },
  { id: 'watermark',  label: '워터마크',       prompt: 'watermark, text overlay, logo, subtitles' },
  { id: 'distort',    label: '왜곡·변형',      prompt: 'distorted, warped, morphing faces, deformed' },
  { id: 'fastcut',    label: '빠른 컷',        prompt: 'fast cuts, jump cuts, abrupt transitions' },
  { id: 'noise',      label: '노이즈·그레인',  prompt: 'noise, grain, film grain, static' },
  { id: 'overexp',    label: '과노출',         prompt: 'overexposed, washed out, blown highlights' },
  { id: 'duplicate',  label: '캐릭터 복수',    prompt: 'duplicate subjects, cloned figures, multiple copies' },
  { id: 'frozen',     label: '정지화면',       prompt: 'frozen frame, still image, no motion' },
  { id: 'cgi',        label: '인위적·CG',      prompt: 'artificial, CGI, unnatural, plastic look' },
];

// ── IDB 헬퍼 ─────────────────────────────────────────────────────────────────
const IDB_NAME    = 'ld_keyframe';
const IDB_VERSION = 2;

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('scene_images')) db.createObjectStore('scene_images');
      if (!db.objectStoreNames.contains('state'))        db.createObjectStore('state');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function loadStateIDB(key: string): Promise<any> {
  const db = await openIDB();
  return new Promise(res => {
    const tx  = db.transaction('state', 'readonly');
    const req = tx.objectStore('state').get(key);
    req.onsuccess = () => res(req.result ?? null);
    req.onerror   = () => res(null);
  });
}

async function loadScene0Data(): Promise<{ basePrompt: string; koScene: string }> {
  const nlEdits = await loadStateIDB('nl_edits');
  let basePrompt = '';
  if (nlEdits && typeof nlEdits[0] === 'string' && nlEdits[0].trim()) {
    basePrompt = nlEdits[0].trim();
  } else {
    const translated = await loadStateIDB('translated_scenes');
    if (Array.isArray(translated) && typeof translated[0] === 'string' && translated[0].trim()) {
      basePrompt = translated[0].trim();
    }
  }
  let koScene = '';
  const kfData = await loadStateIDB('keyframe_data');
  if (kfData?.scenes?.[0] && typeof kfData.scenes[0] === 'string') {
    koScene = kfData.scenes[0].replace(/\[씬\s*\d+\]/g, '').trim();
  }
  return { basePrompt, koScene };
}

// ── 단일 선택 옵션 그룹 ───────────────────────────────────────────────────────
function OptionGroup({ title, icon, options, value, onChange, color }: {
  title: string; icon: string; options: MotionOption[]; value: string;
  onChange: (id: string) => void;
  color: 'indigo' | 'amber';
}) {
  const activeMap = {
    indigo: 'bg-indigo-600 border-indigo-600 text-white',
    amber:  'bg-amber-500  border-amber-500  text-white',
  };
  return (
    <div>
      <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
        <span>{icon}</span>{title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            title={o.desc}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
              value === o.id
                ? activeMap[color]
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 다중 선택 네거티브 그룹 ───────────────────────────────────────────────────
function NegativeGroup({ selected, onToggle }: {
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
        <span>🚫</span>네거티브 프롬프트 <span className="text-gray-400 font-normal">(다중 선택)</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {NEGATIVE_OPTIONS.map(o => {
          const active = selected.has(o.id);
          return (
            <button
              key={o.id}
              onClick={() => onToggle(o.id)}
              title={o.prompt}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
                active
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-600'
              }`}
            >
              {active ? '✕ ' : ''}{o.label}
            </button>
          );
        })}
      </div>
      {selected.size > 0 && (
        <button
          onClick={() => NEGATIVE_OPTIONS.forEach(o => selected.has(o.id) && onToggle(o.id))}
          className="mt-2 text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors"
        >
          전체 해제
        </button>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Mp4PromptGeneratorPage() {
  const [imgUrl,        setImgUrl]        = React.useState<string | null>(null);
  const [imgFile,       setImgFile]       = React.useState<File | null>(null);
  const [analyzing,     setAnalyzing]     = React.useState(false);
  const [hasSubject,    setHasSubject]    = React.useState<boolean>(false); // 기본: 주요 캐릭터 없음
  const [hook,          setHook]          = React.useState('none');
  const [move,          setMove]          = React.useState('push-in');
  const [speed,         setSpeed]         = React.useState('slow');
  const [subjectAction, setSubjectAction] = React.useState('breathing');
  const [envMotion,     setEnvMotion]     = React.useState('wind-leaves');
  const [negSelected,   setNegSelected]   = React.useState<Set<string>>(new Set());
  const [copied,        setCopied]        = React.useState(false);
  const [copiedNeg,     setCopiedNeg]     = React.useState(false);
  const [basePrompt,    setBasePrompt]    = React.useState('');
  const [koScene,       setKoScene]       = React.useState('');
  const [baseInput,     setBaseInput]     = React.useState('');
  const [charInput,     setCharInput]     = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    loadScene0Data().then(({ basePrompt: p, koScene: ko }) => {
      setBasePrompt(p);   // 출력에만 채움
      // baseInput 은 빈 상태 유지 (사용자가 직접 입력)
      setKoScene(ko);
    });
  }, []);

  const activeMoveOptions  = hasSubject ? SUBJECT_MOVE_OPTIONS : MOVE_OPTIONS;
  const activeSpeedOptions = hasSubject ? SUBJECT_SPEED_OPTIONS : SPEED_OPTIONS;
  const hookPrompt    = HOOK_OPTIONS.find(o => o.id === hook)?.prompt            || '';
  const movePrompt    = activeMoveOptions.find(o => o.id === move)?.prompt       || '';
  const speedPrompt   = activeSpeedOptions.find(o => o.id === speed)?.prompt     || '';
  const actionPrompt  = hasSubject === true
    ? (SUBJECT_ACTION_OPTIONS.find(o => o.id === subjectAction)?.prompt || '')
    : hasSubject === false
    ? (ENV_MOTION_OPTIONS.find(o => o.id === envMotion)?.prompt || '')
    : '';
  const motionPart    = [movePrompt, speedPrompt].filter(Boolean).join(', ');

  // 후크 → 캐릭터 묘사 → 캐릭터 행동 → 사용자 입력 → 기본 프롬프트 → 카메라+속도
  // 후크 → 사용자 입력 → 환경 모션 → 기본 프롬프트 → 카메라+속도
  const finalPrompt = hasSubject
    ? [hookPrompt, charInput.trim(), actionPrompt, baseInput.trim(), basePrompt, motionPart].filter(Boolean).join(', ')
    : [hookPrompt, baseInput.trim(), actionPrompt, basePrompt, motionPart].filter(Boolean).join(', ');
  const negativePrompt = Array.from(negSelected)
    .map(id => NEGATIVE_OPTIONS.find(o => o.id === id)?.prompt || '')
    .filter(Boolean)
    .join(', ');

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImgUrl(URL.createObjectURL(file));
    setImgFile(file);
  };

  const handleAiAnalyze = async () => {
    const apiKey = localStorage.getItem('ld_google_api_key') ?? '';
    if (!apiKey) { alert('Google API Key가 필요합니다. 키프레임 페이지에서 설정하세요.'); return; }
    if (!imgFile && !charInput.trim() && !baseInput.trim()) { alert('이미지 또는 한글 설명을 먼저 입력하세요.'); return; }

    setAnalyzing(true);
    try {
      const parts: any[] = [];

      // 이미지 base64 변환
      if (imgFile) {
        const base64 = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload  = () => res((reader.result as string).split(',')[1]);
          reader.onerror = rej;
          reader.readAsDataURL(imgFile);
        });
        parts.push({ inlineData: { data: base64, mimeType: imgFile.type } });
      }

      const prompt = `You are a visual prompt specialist for Kling AI image-to-video generation.

Analyze the image (if provided) and translate/enhance the Korean descriptions into English visual keywords.

Output ONLY a JSON object:
{
  "char_en": "comma-separated English visual keywords for the CHARACTER (appearance, clothing, expression, pose). Empty string if no character.",
  "scene_en": "comma-separated English visual keywords for the SCENE/ENVIRONMENT (location, lighting, atmosphere, mood, colors)."
}

Rules:
- Use comma-separated keywords, NOT full sentences
- Be specific and vivid (e.g. "warm golden hour backlight" not just "light")
- Extract every visual detail from the image that helps recreate the scene
- Translate Korean input accurately, adding image-based details${hasSubject && charInput.trim() ? `\n\nKorean character description: ${charInput.trim()}` : ''}${baseInput.trim() ? `\n\nKorean scene description: ${baseInput.trim()}` : ''}${!imgFile ? '\n\nNo image provided — translate Korean text only.' : ''}

JSON:`;

      parts.push({ text: prompt });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }] }) }
      );
      const data = await res.json();
      const raw  = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '')
        .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(raw);
      if (parsed.char_en?.trim())  setCharInput(parsed.char_en.trim());
      if (parsed.scene_en?.trim()) setBaseInput(parsed.scene_en.trim());
    } catch (e) {
      alert('AI 분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(finalPrompt).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyNeg = () => {
    navigator.clipboard.writeText(negativePrompt).catch(() => {});
    setCopiedNeg(true);
    setTimeout(() => setCopiedNeg(false), 2000);
  };

  const handleNegToggle = (id: string) => {
    setNegSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const TOOLS = [
    { name: 'Kling AI', url: 'https://klingai.com',    badge: '추천',  color: 'bg-emerald-500', desc: '이미지+모션 프롬프트' },
    { name: 'Runway',   url: 'https://runwayml.com',   badge: 'Gen-3', color: 'bg-violet-500',  desc: '고품질 영상 생성' },
    { name: 'Hailuo',  url: 'https://hailuoai.video',  badge: '무료',  color: 'bg-amber-500',   desc: '무료 티어 제공' },
    { name: 'Pika',    url: 'https://pika.art',         badge: '',      color: 'bg-sky-500',     desc: '직관적인 UI' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ── 헤더 ── */}
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="max-w-[1160px] mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/content/keyframe" className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium">
            ← 키프레임
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-lg">🎬</span>
          <h1 className="text-base font-black text-gray-900">MP4 프롬프트 생성기</h1>
        </div>
      </header>

      {/* ── 본문 3컬럼 ── */}
      <div className="flex-1 max-w-[1160px] w-full mx-auto flex gap-5 p-5 items-start">

        {/* ── LEFT: 이미지 + 씬 입력 ── */}
        <div className="w-[300px] shrink-0 flex flex-col gap-4">

          {/* 이미지 업로드 */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-black text-white">1</span>
                <span className="text-sm font-black text-gray-900">이미지 업로드</span>
              </div>
              <p className="text-xs text-gray-600 mt-1 pl-8">styleimage로 만든 이미지를 올려주세요.</p>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed overflow-hidden transition-all aspect-video flex items-center justify-center ${
                  imgUrl ? 'border-indigo-400' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
              >
                {imgUrl ? (
                  <>
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center">
                      <span className="opacity-0 hover:opacity-100 text-xs font-black text-white bg-black/50 px-3 py-1 rounded-lg">교체</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <span className="text-4xl opacity-30">📷</span>
                    <p className="text-sm font-bold text-gray-600">클릭 또는 드래그</p>
                    <p className="text-xs text-gray-500">JPG · PNG · WEBP</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
              {imgUrl && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700">이미지 준비 완료</span>
                  <button onClick={() => setImgUrl(null)} className="ml-auto text-[10px] text-gray-400 hover:text-red-500 transition-colors font-bold">삭제</button>
                </div>
              )}
            </div>
          </div>

          {/* 캐릭터 묘사 — 캐릭터 있을 때만 표시 */}
          {hasSubject && (
            <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-indigo-100 bg-indigo-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🧑</span>
                  <span className="text-xs font-black text-indigo-900">캐릭터 묘사</span>
                  <span className="text-[10px] text-indigo-400 font-medium">1순위</span>
                </div>
              </div>
              <div className="p-4">
                <textarea
                  value={charInput}
                  onChange={e => setCharInput(e.target.value)}
                  className="w-full text-xs text-gray-800 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 leading-relaxed"
                  rows={3}
                  placeholder="예) middle-aged Korean man in dark suit, tense expression"
                />
              </div>
            </div>
          )}

          {/* 씬 설명 직접 입력 */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm">📝</span>
                <span className="text-xs font-black text-gray-900">씬 설명 입력</span>
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={baseInput}
                onChange={e => setBaseInput(e.target.value)}
                className="w-full text-xs text-gray-800 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 leading-relaxed"
                rows={4}
                placeholder="예) distressed financial anchor, digital stock market crash, falling gold coins, ominous shadows"
              />
            </div>
          </div>

          {/* AI 분석 첨가 버튼 */}
          <button
            onClick={handleAiAnalyze}
            disabled={analyzing}
            title="API 사용으로 비용이 발생됩니다"
            className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AI 분석 중...
              </>
            ) : (
              <>✨ AI 분석 첨가</>
            )}
          </button>
          <p className="text-[10px] text-gray-400 text-center -mt-2">이미지 + 한글 설명 → 영문 키워드 자동 변환</p>
        </div>

        {/* ── CENTER: 모션 + 네거티브 ── */}
        <div className="w-[380px] shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-black text-white">2</span>
              <span className="text-sm font-black text-gray-900">모션 &amp; 옵션 설정</span>
            </div>
            <p className="text-xs text-gray-600 mt-1 pl-8">씬 유형에 따라 최적화된 옵션을 선택하세요.</p>
          </div>
          <div className="p-4 flex flex-col gap-3">

            {/* 피사체 유무 선택 */}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">🎯 씬 유형</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setHasSubject(true); setMove('push-in'); }}
                  className={`py-3 rounded-xl border-2 text-xs font-black transition-all ${
                    hasSubject === true
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'
                  }`}
                >
                  <div className="text-lg mb-1">🧑</div>
                  주요 캐릭터 있음
                  <div className="text-[10px] font-normal mt-0.5 opacity-70">인물 · 사물</div>
                </button>
                <button
                  onClick={() => { setHasSubject(false); setMove('push-in'); }}
                  className={`py-3 rounded-xl border-2 text-xs font-black transition-all ${
                    hasSubject === false
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
                  }`}
                >
                  <div className="text-lg mb-1">🌿</div>
                  주요 캐릭터 없음
                  <div className="text-[10px] font-normal mt-0.5 opacity-70">배경 · 자연 · 공간</div>
                </button>
              </div>
            </div>

            <hr className="border-gray-100" />
            <OptionGroup icon="🪝" title="후크 강도" options={HOOK_OPTIONS} value={hook} onChange={setHook} color="indigo" />

            {/* 주요 캐릭터 있음: 행동 옵션 */}
            {hasSubject === true && (
              <>
                <hr className="border-gray-100" />
                <OptionGroup icon="🤸" title="캐릭터 행동" options={SUBJECT_ACTION_OPTIONS} value={subjectAction} onChange={setSubjectAction} color="indigo" />
              </>
            )}

            {/* 주요 캐릭터 없음: 환경 모션 */}
            {hasSubject === false && (
              <>
                <hr className="border-gray-100" />
                <OptionGroup icon="🌊" title="환경 모션" options={ENV_MOTION_OPTIONS} value={envMotion} onChange={setEnvMotion} color="amber" />
              </>
            )}

            <hr className="border-gray-100" />
            <OptionGroup
              icon="🎥"
              title={hasSubject ? '카메라 이동 (캐릭터 향)' : '카메라 이동'}
              options={activeMoveOptions}
              value={move}
              onChange={setMove}
              color="indigo"
            />
            <hr className="border-gray-100" />
            <OptionGroup
              icon="⚡"
              title={hasSubject ? '동작 속도 (캐릭터)' : '카메라 속도'}
              options={activeSpeedOptions}
              value={speed}
              onChange={setSpeed}
              color="amber"
            />
            <hr className="border-gray-100" />
            <NegativeGroup selected={negSelected} onToggle={handleNegToggle} />
          </div>
        </div>

        {/* ── RIGHT: 프롬프트 출력 ── */}
        <div className="flex-1 flex flex-col gap-4">

          {/* 최종 프롬프트 */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-black text-white">3</span>
                <span className="text-sm font-black text-gray-900">영상 제작 프롬프트</span>
              </div>
              <button
                onClick={handleCopy}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  copied ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {copied ? '✓ 복사됨' : '복사'}
              </button>
            </div>
            <div className="px-5 py-4 font-mono text-sm leading-7 bg-gray-950 rounded-none">
              {/* 후크 — 항상 최상단 */}
              {hookPrompt && <p className="mb-1"><span className="text-orange-400 font-bold">{hookPrompt}</span><span className="text-gray-500">, </span></p>}
              {hasSubject ? (
                // ── 캐릭터 있음: 후크 → 묘사 → 행동 → 사용자 → 기본 → 카메라+속도
                <>
                  {charInput.trim() && <p className="mb-1"><span className="text-sky-400 font-bold">{charInput.trim()}</span><span className="text-gray-500">, </span></p>}
                  {actionPrompt     && <p className="mb-1"><span className="text-pink-400 font-bold">{actionPrompt}</span><span className="text-gray-500">, </span></p>}
                  {baseInput.trim() && <p className="mb-1"><span className="text-violet-400 font-bold">{baseInput.trim()}</span><span className="text-gray-500">, </span></p>}
                  {basePrompt       && <p className="mb-1"><span className="text-green-300 font-bold">{basePrompt}</span><span className="text-gray-500">, </span></p>}
                </>
              ) : (
                // ── 캐릭터 없음: 후크 → 사용자 → 환경모션 → 기본 → 카메라+속도
                <>
                  {baseInput.trim() && <p className="mb-1"><span className="text-violet-400 font-bold">{baseInput.trim()}</span><span className="text-gray-500">, </span></p>}
                  {actionPrompt     && <p className="mb-1"><span className="text-teal-400 font-bold">{actionPrompt}</span><span className="text-gray-500">, </span></p>}
                  {basePrompt       && <p className="mb-1"><span className="text-green-300 font-bold">{basePrompt}</span><span className="text-gray-500">, </span></p>}
                </>
              )}
              <p>
                {[movePrompt, speedPrompt].filter(Boolean).map((seg, i, arr) => (
                  <span key={i}>
                    <span className={i === 0 ? 'text-indigo-400 font-bold' : 'text-amber-400 font-semibold'}>{seg}</span>
                    {i < arr.length - 1 && <span className="text-gray-500">, </span>}
                  </span>
                ))}
              </p>
            </div>
            <div className="px-5 pb-3 flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
              {hookPrompt   && <span><span className="inline-block w-2 h-2 rounded-sm bg-orange-500 mr-1" />후크</span>}
              {hasSubject ? (
                <>
                  {charInput.trim() && <span><span className="inline-block w-2 h-2 rounded-sm bg-sky-500 mr-1" />캐릭터 묘사</span>}
                  {actionPrompt     && <span><span className="inline-block w-2 h-2 rounded-sm bg-pink-500 mr-1" />캐릭터 행동</span>}
                  {baseInput.trim() && <span><span className="inline-block w-2 h-2 rounded-sm bg-violet-500 mr-1" />사용자 입력</span>}
                </>
              ) : (
                <>
                  {baseInput.trim() && <span><span className="inline-block w-2 h-2 rounded-sm bg-violet-500 mr-1" />사용자 입력</span>}
                  {actionPrompt     && <span><span className="inline-block w-2 h-2 rounded-sm bg-teal-500 mr-1" />환경 모션</span>}
                </>
              )}
              {basePrompt && <span><span className="inline-block w-2 h-2 rounded-sm bg-emerald-500 mr-1" />기본 프롬프트</span>}
              <span><span className="inline-block w-2 h-2 rounded-sm bg-indigo-500 mr-1" />카메라</span>
              <span><span className="inline-block w-2 h-2 rounded-sm bg-amber-500 mr-1" />속도</span>
            </div>
            {/* 한글 설명 */}
            <div className="mx-5 mb-4 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-2.5">
              <p className="text-[10px] font-black text-gray-500">한글 설명</p>
              {koScene && (
                <div className="flex gap-2">
                  <span className="mt-0.5 shrink-0 w-2 h-2 rounded-sm bg-emerald-500" />
                  <p className="text-xs text-gray-700 leading-relaxed">{koScene}</p>
                </div>
              )}
              <div className="flex gap-2">
                <span className="mt-0.5 shrink-0 w-2 h-2 rounded-sm bg-indigo-500" />
                <p className="text-xs text-gray-700 leading-relaxed">{activeMoveOptions.find(o => o.id === move)?.desc}</p>
              </div>
              <div className="flex gap-2">
                <span className="mt-0.5 shrink-0 w-2 h-2 rounded-sm bg-amber-500" />
                <p className="text-xs text-gray-700 leading-relaxed">{activeSpeedOptions.find(o => o.id === speed)?.desc}</p>
              </div>
            </div>
          </div>

          {/* 네거티브 프롬프트 */}
          {negSelected.size > 0 && (
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-red-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🚫</span>
                  <span className="text-sm font-black text-gray-900">네거티브 프롬프트</span>
                  <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">{negSelected.size}개 선택</span>
                </div>
                <button
                  onClick={handleCopyNeg}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                    copiedNeg ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {copiedNeg ? '✓ 복사됨' : '복사'}
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="font-mono text-sm text-red-700 leading-7">{negativePrompt}</p>
              </div>
            </div>
          )}

          {/* 도구 링크 */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <p className="text-xs font-black text-gray-700">🎞 이미지 → 영상 도구</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {TOOLS.map(t => (
                <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all group"
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${t.color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-gray-900">{t.name}</span>
                      {t.badge && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{t.badge}</span>}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">{t.desc}</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 transition-colors text-sm">↗</span>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
