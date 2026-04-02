'use client';

import React from 'react';
import Link from 'next/link';
import videoToolsData from '@/data/video-tools.json';
import keyframeStyleData from '@/data/keyframe_style.json';
import { supabase } from '@/lib/supabase';

interface ArtStyleEntry { id: string; customPrompt?: string; colorPalette?: string; flat2d?: boolean; }
const ART_STYLE_MAP: Record<string, ArtStyleEntry> = Object.fromEntries(
  (keyframeStyleData.artStyles as ArtStyleEntry[]).map(s => [s.id, s])
);

interface MotionOption { id: string; label: string; prompt: string; desc: string; }
interface NegOption    { id: string; label: string; prompt: string; }

// ── 캐릭터 Supabase 로드 ─────────────────────────────────────────────────────
interface CharAsset { id: string; name: string; imageDataUrl: string; promptEn: string; registeredAt: string; registeredBy?: string; }
async function loadCharAssetsForMp4(): Promise<CharAsset[]> {
  let sessionKey = localStorage.getItem('ld_session_key');
  if (!sessionKey) { sessionKey = crypto.randomUUID(); localStorage.setItem('ld_session_key', sessionKey); }
  const admin = !!localStorage.getItem('ld_admin_token');

  const { data, error } = await supabase
    .from('characters')
    .select('id, name, image_data_url, prompt_compact, registered_at, registered_by')
    .order('registered_by', { ascending: false })
    .order('registered_at', { ascending: false });

  if (error || !data) return [];

  const all: CharAsset[] = data.map(row => ({
    id:           row.id,
    name:         row.name,
    imageDataUrl: row.image_data_url,
    promptEn:     row.prompt_compact,
    registeredAt: row.registered_at,
    registeredBy: row.registered_by,
  }));

  return admin ? all : all.filter(c => !c.registeredBy || c.registeredBy === 'admin' || c.registeredBy === sessionKey);
}

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
  { id: 'dust-float',    label: '먼지·입자',    prompt: 'dust particles floating in light, bokeh shimmer',             desc: '빛 속에 먼지나 입자가 유영합니다.' },
  { id: 'snow-fall',     label: '눈 내림',      prompt: 'snow falling softly, snowflakes drifting down',               desc: '눈송이가 조용히 내려앉습니다.' },
  { id: 'fog-drift',     label: '안개',          prompt: 'thick fog drifting slowly, misty atmosphere',                 desc: '안개가 천천히 흘러 신비로운 분위기를 만듭니다.' },
  { id: 'petals-fall',   label: '꽃잎 낙하',    prompt: 'flower petals falling gently, floating in the breeze',        desc: '꽃잎이 바람에 실려 부드럽게 흩날립니다.' },
  { id: 'ocean-waves',   label: '파도',          prompt: 'ocean waves rolling in, foam washing over shore',             desc: '파도가 밀려와 해안을 적십니다.' },
  { id: 'lightning',     label: '번개',          prompt: 'lightning flashing in distance, dramatic storm illumination', desc: '번개가 번쩍이며 하늘을 가릅니다.' },
  { id: 'despair',       label: '절망·붕괴',     prompt: 'dark storm clouds gathering, ash raining down, flickering dying light, oppressive silence',          desc: '먹구름이 몰려오고 재가 내리며 빛이 꺼져가는 절망적인 분위기입니다.' },
  { id: 'longing',       label: '그리움·향수',   prompt: 'golden hour light fading, dust motes drifting, long shadows stretching, warm haze dissolving',        desc: '저무는 노을빛 속에 먼지가 유영하며 그리움과 향수를 자아냅니다.' },
  { id: 'solitude',      label: '고독·적막',     prompt: 'empty desolate space, stillness, single flickering candle, silence, cold blue ambient light',          desc: '텅 빈 공간에 촛불 하나만 흔들리는 고독하고 적막한 분위기입니다.' },
  { id: 'hope',          label: '희망·여명',     prompt: 'first light breaking through clouds, warm golden rays piercing darkness, mist lifting slowly',          desc: '구름 사이로 빛이 뚫고 들어오며 희망과 여명의 기운이 퍼집니다.' },
  { id: 'rage',          label: '분노·격렬함',   prompt: 'violent wind tearing through, debris flying, crashing thunder, turbulent churning atmosphere',          desc: '거센 바람이 휩쓸고 파편이 날리는 폭발적이고 격렬한 분위기입니다.' },
  { id: 'comfort',       label: '위로·평온',      prompt: 'soft warm light filtering through curtains, gentle breeze, slow swaying, peaceful ambient glow',              desc: '따뜻한 빛과 부드러운 바람이 감싸는 위로와 평온의 분위기입니다.' },
  // ── 자연현상 ──
  { id: 'aurora',        label: '오로라',         prompt: 'aurora borealis shimmering, curtains of green and violet light dancing across night sky',                      desc: '밤하늘을 수놓는 오로라가 초록·보라빛으로 일렁입니다.' },
  { id: 'meteor',        label: '유성·별빛',      prompt: 'shooting stars streaking across starry sky, meteor shower, milky way glowing',                                 desc: '유성이 밤하늘을 가르며 별빛이 쏟아집니다.' },
  { id: 'sandstorm',     label: '모래폭풍',       prompt: 'sandstorm swirling, wall of dust engulfing landscape, choking haze',                                           desc: '모래폭풍이 몰아쳐 대지를 삼키는 압도적인 장면입니다.' },
  { id: 'waterfall',     label: '폭포',           prompt: 'waterfall cascading down, mist rising, rushing white water, roaring current',                                  desc: '폭포가 쏟아지며 물안개가 피어오릅니다.' },
  { id: 'thunderstorm',  label: '폭풍우',         prompt: 'heavy rain pouring, thunder rumbling, lightning splitting sky, trees bending in gale',                         desc: '폭풍우가 몰아치며 번개와 천둥이 하늘을 가릅니다.' },
  { id: 'autumn-leaves', label: '가을 단풍',      prompt: 'autumn leaves swirling down, red and gold foliage drifting, crisp wind carrying leaves',                       desc: '붉고 금빛인 단풍잎이 바람에 흩날립니다.' },
  { id: 'heat-haze',     label: '열기·아지랑이',  prompt: 'heat haze shimmering over surface, mirage-like distortion, scorching summer air wavering',                     desc: '뜨거운 지면 위로 아지랑이가 일렁입니다.' },
  { id: 'eclipse',       label: '일식·암전',      prompt: 'solar eclipse darkening sky, eerie twilight at midday, corona glowing around moon shadow',                     desc: '일식으로 하늘이 어두워지며 코로나 빛이 번집니다.' },
  // ── 도시·공간 ──
  { id: 'neon-flicker',  label: '네온·도시',      prompt: 'neon signs flickering in rain-soaked city street, reflections shimmering on wet pavement',                     desc: '빗물에 젖은 도시 거리, 네온사인이 반사되며 명멸합니다.' },
  { id: 'city-lights',   label: '도시 야경',      prompt: 'city lights twinkling below, slow aerial drift, glittering urban sprawl at night',                             desc: '빛나는 도시 야경이 서서히 펼쳐집니다.' },
  { id: 'steam-pipes',   label: '증기·수증기',    prompt: 'steam rising from vents, drifting vapour clouds, industrial haze diffusing light',                              desc: '환기구에서 증기가 피어오르며 빛을 부드럽게 퍼뜨립니다.' },
  { id: 'crack-spread',  label: '균열·붕괴',      prompt: 'cracks spreading slowly across surface, ground fracturing, debris crumbling, structural collapse',              desc: '균열이 서서히 번지며 구조물이 무너져 내립니다.' },
  // ── 감정·분위기 ──
  { id: 'joy',           label: '기쁨·축제',      prompt: 'confetti bursting, colorful streamers falling, bright celebratory light, joyful energy',                       desc: '색종이와 리본이 터지며 기쁨이 넘치는 축제 분위기입니다.' },
  { id: 'tension',       label: '긴장·서스펜스',  prompt: 'shadows creeping, single swinging light bulb, unsettling stillness, barely perceptible movement',               desc: '흔들리는 전구 하나, 기어드는 그림자, 긴장감이 고조됩니다.' },
  { id: 'sorrow',        label: '슬픔·눈물',      prompt: 'slow rain on glass, blurred reflections, grey desaturated world, dim fading light',                            desc: '유리창을 타고 내리는 빗물처럼 채도 잃은 슬픔이 흐릅니다.' },
  { id: 'chaos',         label: '혼돈·카오스',    prompt: 'swirling vortex of debris, chaotic overlapping motion, clashing elements, visual noise and disorder',           desc: '모든 것이 뒤엉키는 혼돈의 소용돌이 속 장면입니다.' },
  { id: 'triumph',       label: '승리·영광',      prompt: 'golden light flooding scene, triumphant rays breaking through clouds, dust settling after battle',              desc: '황금빛이 쏟아지며 승리와 영광의 순간을 표현합니다.' },
  { id: 'mystery',       label: '신비·환상',      prompt: 'ethereal glowing particles drifting, surreal soft light, dreamlike haze, floating luminescent orbs',            desc: '몽환적인 빛 입자가 유영하는 신비롭고 환상적인 분위기입니다.' },
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
  // ── 기본 품질 ──
  { id: 'blur',         label: '흔들림·흐림',   prompt: 'blurry, out of focus, shaky camera' },
  { id: 'lowqual',      label: '저화질',         prompt: 'low quality, pixelated, compressed artifacts' },
  { id: 'overexp',      label: '과노출',         prompt: 'overexposed, washed out, blown highlights' },
  { id: 'underexp',     label: '노출 부족',      prompt: 'underexposed, too dark, crushed blacks, muddy shadows' },
  { id: 'noise',        label: '노이즈·그레인',  prompt: 'noise, grain, film grain, static' },
  { id: 'overblur',     label: '모션 블러',      prompt: 'excessive motion blur, smearing, ghosting, motion trails' },
  { id: 'color-shift',  label: '색상 이탈',      prompt: 'unnatural color shift, color banding, hue flickering, color noise' },
  // ── 화면 구성 ──
  { id: 'text',         label: '텍스트',          prompt: 'text, letters, words, typography, captions' },
  { id: 'watermark',    label: '워터마크',        prompt: 'watermark, text overlay, subtitles' },
  { id: 'logo',         label: '로고·상표',       prompt: 'brand logo, corporate branding, product placement, commercial overlay' },
  { id: 'split',        label: '분할 화면',       prompt: 'split screen, multiple panels, collage, picture-in-picture' },
  // ── 카메라·컷 ──
  { id: 'fastcut',      label: '빠른 컷',         prompt: 'fast cuts, jump cuts, abrupt transitions' },
  { id: 'flash',        label: '플래시·깜빡임',   prompt: 'flash, strobe effect, flickering light, blinking' },
  { id: 'frozen',       label: '정지화면',        prompt: 'frozen frame, still image, no motion' },
  // ── 피사체·캐릭터 ──
  { id: 'duplicate',    label: '캐릭터 복수',     prompt: 'duplicate subjects, cloned figures, multiple copies' },
  { id: 'bad-face',     label: '얼굴 손상',       prompt: 'distorted face, deformed facial features, uncanny valley, broken face' },
  { id: 'deformed-body',label: '신체 왜곡',       prompt: 'deformed body, extra limbs, bad anatomy, mutated hands, missing limbs' },
  { id: 'distort',      label: '왜곡·변형',       prompt: 'distorted, warped, morphing faces, deformed' },
  // ── 스타일 ──
  { id: 'cgi',          label: '인위적·CG',       prompt: 'artificial, CGI, unnatural, plastic look' },
  { id: 'cartoon',      label: '만화·애니',       prompt: 'cartoon style, anime, illustrated, painted, 2D animation' },
  { id: '3d',           label: '3D·렌더링',       prompt: '3D render, 3D animation, computer generated 3D, CGI 3D, virtual 3D environment' },
  // ── 배경 ──
  { id: 'morph-bg',     label: '배경 변형',       prompt: 'morphing background, unstable environment, shifting scene, dissolving objects' },
];

// ── 자동 네거티브 추천 ────────────────────────────────────────────────────────
// flat2d: true 플래그 또는 customPrompt에 "flat" 포함인 스타일 자동 감지
const FLAT_2D_STYLE_IDS = new Set(
  (keyframeStyleData.artStyles as ArtStyleEntry[])
    .filter(s => s.flat2d || (s.customPrompt ?? '').toLowerCase().includes('flat'))
    .map(s => s.id)
);

function computeAutoNeg(
  hasSubject: boolean,
  hook: string,
  move: string,
  speed: string,
  subjectAction: string,
  envMotion: string,
  artStyleId?: string,
): Set<string> {
  const ids = new Set<string>();

  ids.add('watermark');
  ids.add('text');
  ids.add('logo');
  ids.add('split');
  ids.add('frozen');

  // 2D 플랫 화풍이면 3D 네거티브 무조건 선택
  if (artStyleId && FLAT_2D_STYLE_IDS.has(artStyleId)) {
    ids.add('3d');
  }

  if (hasSubject) {
    ids.add('duplicate');
    ids.add('bad-face');
    ids.add('deformed-body');
  } else {
    ids.add('duplicate');
  }

  if (hook === 'impact') {
    ids.add('blur');
    ids.add('overblur');
  }
  if (hook === 'tension') {
    ids.add('flash');
    ids.add('noise');
  }
  if (hook === 'mystery') {
    ids.add('cgi');
    ids.add('cartoon');
  }

  if (move === 'static') {
    ids.add('fastcut');
    ids.add('blur');
    ids.add('flash');
  }
  if (move === 'aerial-drift') {
    ids.add('blur');
    ids.add('noise');
    ids.add('overexp');
  }

  if (speed === 'very-slow' || speed === 'slow') {
    ids.add('fastcut');
    ids.add('flash');
    ids.add('overblur');
  }
  if (speed === 'fast') {
    ids.add('overblur');
    ids.add('noise');
  }

  if (['walking', 'head-turn', 'look-down-up'].includes(subjectAction)) {
    ids.add('frozen');
    ids.add('deformed-body');
  }
  if (subjectAction === 'trembling') {
    ids.add('overblur');
  }

  const moodMotions = ['despair','longing','solitude','hope','rage','comfort','triumph','mystery','sorrow','tension','chaos','joy'];
  if (moodMotions.includes(envMotion)) {
    ids.add('cgi');
    ids.add('cartoon');
    ids.add('noise');
  }
  const naturalMotions = ['aurora','meteor','sandstorm','waterfall','thunderstorm','lightning','eclipse','heat-haze','autumn-leaves'];
  if (naturalMotions.includes(envMotion)) {
    ids.add('distort');
    ids.add('color-shift');
  }
  const cityMotions = ['neon-flicker','city-lights','steam-pipes','crack-spread'];
  if (cityMotions.includes(envMotion)) {
    ids.add('overexp');
    ids.add('blur');
  }

  return ids;
}

// ── 조명/색조/렌즈 자동 추론 ──────────────────────────────────────────────────
function computeAutoVisual(
  hasSubject: boolean | null,
  hook: string,
  speed: string,
  subjectAction: string,
  envMotion: string,
  artStyleId?: string,
): string {
  const lighting:   string[] = [];
  const colorGrade: string[] = [];
  const lens:       string[] = [];

  // ── 화풍 기반 ──
  const warmStyles  = ['ghibli-real','ghibli-night','health-senior-1','health-senior-2','wisdom-quotes-1','wisdom-quotes-2','lifestyle-1','lifestyle-2'];
  const coolStyles  = ['anime-sf','tech-trend-1','tech-trend-2','econ-dark-drama'];
  const darkStyles  = ['econ-dark-drama','econ-corporate','stock-news-1','stock-news-2','news-anchor'];
  const brightStyles= ['pixar-3d','econ-infographic','health-senior-1','lifestyle-1'];
  if (artStyleId) {
    if (warmStyles.includes(artStyleId))   { lighting.push('warm golden-hour lighting'); colorGrade.push('warm amber tone'); }
    else if (darkStyles.includes(artStyleId))  { lighting.push('dramatic low-key lighting, deep shadows'); colorGrade.push('desaturated cinematic grade'); }
    else if (brightStyles.includes(artStyleId)){ lighting.push('soft diffused daylight'); colorGrade.push('vibrant clean colors'); }
    else if (coolStyles.includes(artStyleId))  { lighting.push('cool blue ambient light'); colorGrade.push('cool teal-blue grade'); }
  }

  // ── 후크 기반 ──
  if (hook === 'impact') {
    lighting.push('high-contrast harsh lighting');
    colorGrade.push('punchy saturated grade');
    lens.push('wide-angle 16mm lens, slight distortion');
  } else if (hook === 'mystery') {
    lighting.push('low-key side lighting, deep shadows');
    colorGrade.push('desaturated muted palette, subtle fog');
    lens.push('telephoto 85mm lens, compressed depth');
  } else if (hook === 'tension') {
    lighting.push('raking side light, harsh rim light');
    colorGrade.push('cold steel-blue grade, high contrast');
    lens.push('50mm lens, neutral perspective');
  } else if (hook === 'emotion') {
    lighting.push('soft warm fill light, gentle diffusion');
    colorGrade.push('warm honey grade');
  }

  // ── 씬 유형(캐릭터 유무) 기반 ──
  if (hasSubject === true) {
    lens.push('85mm portrait lens, shallow depth of field, subject-focused bokeh');
    if (!lighting.length) lighting.push('soft studio-style key light with gentle fill');
  } else if (hasSubject === false) {
    lens.push('wide-angle 24mm lens, deep focus, full-scene sharpness');
  }

  // ── 환경 모션 기반 ──
  const naturalNight = ['aurora','meteor','eclipse','lightning'];
  const naturalDay   = ['waterfall','autumn-leaves','heat-haze','sandstorm','thunderstorm'];
  const neonCity     = ['neon-flicker','city-lights','steam-pipes'];
  const moodSad      = ['despair','longing','solitude','sorrow'];
  const moodWarm     = ['hope','comfort','triumph','joy'];
  const moodIntense  = ['rage','chaos','tension'];

  if (naturalNight.includes(envMotion)) {
    lighting.push('long-exposure night sky lighting, astral glow');
    colorGrade.push('deep indigo night palette, wide dynamic range');
  } else if (naturalDay.includes(envMotion)) {
    if (!lighting.length) lighting.push('natural ambient daylight');
    colorGrade.push('naturalistic color grade, high clarity');
  } else if (neonCity.includes(envMotion)) {
    lighting.push('neon-lit urban bounce light');
    colorGrade.push('cyberpunk neon grade, teal-orange split');
    lens.push('city bokeh, anamorphic lens flare');
  } else if (moodSad.includes(envMotion)) {
    if (!lighting.length) lighting.push('overcast diffused light, low saturation');
    colorGrade.push('cool desaturated grade, faded matte');
  } else if (moodWarm.includes(envMotion)) {
    if (!lighting.length) lighting.push('golden-hour backlight, soft halo');
    colorGrade.push('warm golden grade, lifted shadows');
  } else if (moodIntense.includes(envMotion)) {
    if (!lighting.length) lighting.push('stark directional light, deep shadow pools');
    colorGrade.push('high-contrast dramatic grade');
  }

  // ── 속도 기반 ──
  if (speed === 'very-slow' || speed === 'slow') {
    if (!lens.length) lens.push('medium telephoto lens, soft background separation');
  } else if (speed === 'fast') {
    if (!lens.some(l => l.includes('wide'))) lens.push('wide-angle lens, sharp focus throughout');
  }

  // ── 캐릭터 행동 기반 추가 미세 조정 ──
  if (subjectAction === 'trembling') {
    colorGrade.push('high-contrast anxious grade');
  } else if (subjectAction === 'hair-flow') {
    lighting.push('backlit rim light for hair highlight');
  }

  const parts = [...new Set([...lighting, ...colorGrade, ...lens])];
  return parts.join(', ');
}

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

async function loadAllScenesData(): Promise<Array<{ basePrompt: string; koScene: string }>> {
  const [nlEdits, translated, kfData] = await Promise.all([
    loadStateIDB('nl_edits'),
    loadStateIDB('translated_scenes'),
    loadStateIDB('keyframe_data'),
  ]);
  const koScenes: string[] = kfData?.scenes ?? [];

  // nlEdits can be Record<number|string, string> or string[] — handle both
  const nlEditsIsRecord = nlEdits && !Array.isArray(nlEdits) && typeof nlEdits === 'object';
  const nlEditsCount = Array.isArray(nlEdits)
    ? nlEdits.length
    : nlEditsIsRecord
      ? (Object.keys(nlEdits).length > 0 ? Math.max(...Object.keys(nlEdits).map(Number)) + 1 : 0)
      : 0;

  const count = Math.max(
    koScenes.length,
    nlEditsCount,
    Array.isArray(translated) ? translated.length : 0,
  );
  if (count === 0) return [];

  const cleanScene = (s: string) =>
    s.replace(/\[씬\s*\d+\]/gi, '').replace(/^scene\s+\d+[,.]?\s*/i, '').replace(/^[,\s]+/, '').trim();

  return Array.from({ length: count }, (_, i) => {
    let basePrompt = '';
    if (nlEditsIsRecord) {
      const v = (nlEdits as Record<string, string>)[String(i)];
      if (typeof v === 'string' && v.trim()) basePrompt = cleanScene(v.trim());
    } else if (Array.isArray(nlEdits) && typeof nlEdits[i] === 'string' && nlEdits[i].trim()) {
      basePrompt = cleanScene(nlEdits[i].trim());
    }
    if (!basePrompt && Array.isArray(translated) && typeof translated[i] === 'string' && translated[i].trim()) {
      basePrompt = cleanScene(translated[i].trim());
    }
    const koScene = typeof koScenes[i] === 'string'
      ? koScenes[i].replace(/\[씬\s*\d+\]/g, '').trim()
      : '';
    return { basePrompt, koScene };
  });
}

// ── 단일 선택 옵션 그룹 ───────────────────────────────────────────────────────
function OptionGroup({ title, icon, options, value, onChange, color, dark }: {
  title: string; icon: string; options: MotionOption[]; value: string;
  onChange: (id: string) => void;
  color: 'indigo' | 'amber';
  dark?: boolean;
}) {
  const activeMap = {
    indigo: dark
      ? { bg: 'rgba(99,102,241,0.28)', border: 'rgba(99,102,241,0.65)', text: '#a5b4fc', shadow: '0 0 14px rgba(99,102,241,0.35)' }
      : { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.55)', text: '#4338ca', shadow: '0 0 12px rgba(99,102,241,0.2)' },
    amber: dark
      ? { bg: 'rgba(245,158,11,0.28)', border: 'rgba(245,158,11,0.55)', text: '#fcd34d', shadow: '0 0 14px rgba(245,158,11,0.30)' }
      : { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.55)', text: '#92400e', shadow: '0 0 12px rgba(245,158,11,0.2)' },
  };
  const active = activeMap[color];
  const inactiveStyle = dark
    ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(8px)' }
    : { background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(15,23,42,0.12)', color: '#374151', backdropFilter: 'blur(6px)' };
  return (
    <div>
      <p className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${dark ? 'text-gray-300' : 'text-gray-500'}`}>
        <span>{icon}</span>{title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            title={o.desc}
            className="px-3 py-1.5 rounded-lg text-[12px] font-normal transition-all"
            style={value === o.id ? {
              background: active.bg,
              border: `1px solid ${active.border}`,
              color: active.text,
              boxShadow: active.shadow,
              backdropFilter: 'blur(8px)',
            } : inactiveStyle}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 다중 선택 네거티브 그룹 ───────────────────────────────────────────────────
function NegativeGroup({ selected, autoSelected, onToggle, dark }: {
  selected: Set<string>;
  autoSelected: Set<string>;
  onToggle: (id: string) => void;
  dark?: boolean;
}) {
  const inactiveStyle = dark
    ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)' }
    : { background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(15,23,42,0.12)', color: '#374151', backdropFilter: 'blur(6px)' };
  const manualStyle = dark
    ? { background: 'rgba(239,68,68,0.22)', border: '1px solid rgba(239,68,68,0.55)', color: '#fca5a5', boxShadow: '0 0 12px rgba(239,68,68,0.25)', backdropFilter: 'blur(8px)' }
    : { background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.5)', color: '#b91c1c', boxShadow: '0 0 10px rgba(239,68,68,0.15)', backdropFilter: 'blur(8px)' };
  const autoStyle = dark
    ? { background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.45)', color: '#fcd34d', boxShadow: '0 0 10px rgba(245,158,11,0.18)', backdropFilter: 'blur(8px)' }
    : { background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.40)', color: '#92400e', boxShadow: '0 0 8px rgba(245,158,11,0.12)', backdropFilter: 'blur(8px)' };
  return (
    <div>
      <p className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${dark ? 'text-gray-300' : 'text-gray-500'}`}>
        <span>🚫</span>네거티브 프롬프트
        <span className={`font-normal ${dark ? 'text-gray-400' : 'text-gray-400'}`}>(다중 선택)</span>
        {autoSelected.size > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={dark
              ? { color: '#fcd34d', background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)' }
              : { color: '#92400e', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
            자동 {autoSelected.size}개
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {NEGATIVE_OPTIONS.map(o => {
          const isManual = selected.has(o.id);
          const isAuto   = autoSelected.has(o.id);
          const isActive = isManual || isAuto;
          void isActive;
          return (
            <button
              key={o.id}
              onClick={() => onToggle(o.id)}
              title={o.prompt}
              className="px-3 py-1.5 rounded-lg text-[12px] font-normal transition-all flex items-center gap-1"
              style={isManual ? manualStyle : isAuto ? autoStyle : inactiveStyle}
            >
              {isManual ? '✕ ' : ''}{o.label}
              {isAuto && !isManual && (
                <span className="text-[9px] font-black px-1 py-0.5 rounded"
                  style={dark
                    ? { background: 'rgba(245,158,11,0.25)', color: '#fde68a' }
                    : { background: 'rgba(245,158,11,0.18)', color: '#b45309' }}>자동</span>
              )}
            </button>
          );
        })}
      </div>
      {(selected.size > 0 || autoSelected.size > 0) && (
        <div className="mt-2 flex items-center gap-3">
          {selected.size > 0 && (
            <button
              onClick={() => NEGATIVE_OPTIONS.forEach(o => selected.has(o.id) && onToggle(o.id))}
              className={`text-[10px] font-bold transition-colors ${dark ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
            >
              수동 선택 해제
            </button>
          )}
          <span className="text-[10px] text-gray-400">
            총 {new Set(Array.from(selected).concat(Array.from(autoSelected))).size}개 적용 중
          </span>
        </div>
      )}
    </div>
  );
}

// ── Mp4PromptPanel ────────────────────────────────────────────────────────────
interface Mp4PromptPanelProps {
  embedded?: boolean;
  selectedIdx?: number; // embedded 모드에서 IDB 씬 인덱스로 직접 동기화
  sceneKo?: string;    // 선택된 씬 한글 텍스트 (레거시 — selectedIdx 우선)
  sceneEn?: string;    // 선택된 씬 영문 번역 프롬프트 (레거시 — selectedIdx 우선)
  artStyleId?: string; // 현재 선택된 화풍 ID
  // embedded 전용: 부모에서 캐릭터 상태 주입
  injectedCharAssets?: CharAsset[];
  injectedCharId?: string;
  onCharIdChange?: (id: string) => void;
}

export default function Mp4PromptPanel({ embedded = false, selectedIdx, sceneKo, sceneEn, artStyleId, injectedCharAssets, injectedCharId, onCharIdChange }: Mp4PromptPanelProps) {
  const [translating,   setTranslating]   = React.useState(false);
  const [hasSubject,    setHasSubject]    = React.useState<boolean>(false);
  const [hook,          setHook]          = React.useState('none');
  const [move,          setMove]          = React.useState('push-in');
  const [speed,         setSpeed]         = React.useState('slow');
  const [subjectAction, setSubjectAction] = React.useState('breathing');
  const [envMotion,     setEnvMotion]     = React.useState('wind-leaves');
  const [negSelected,   setNegSelected]   = React.useState<Set<string>>(new Set());
  const [copied,        setCopied]        = React.useState(false);
  const [copiedNeg,     setCopiedNeg]     = React.useState(false);
  // embedded 모드에서는 props로 초기값 지정 (key={selectedIdx}로 remount 보장)
  const [basePrompt,    setBasePrompt]    = React.useState(embedded ? (sceneEn ?? '') : '');
  const [koScene,       setKoScene]       = React.useState(embedded ? (sceneKo ?? '') : '');
  const [baseInput,     setBaseInput]     = React.useState('');
  const [charInput,     setCharInput]     = React.useState('');
  const [_charAssets,   setCharAssets]    = React.useState<CharAsset[]>([]);
  const charAssets = injectedCharAssets ?? _charAssets;
  const [_selectedCharId, _setSelectedCharId] = React.useState(injectedCharId ?? '');
  const selectedCharId = injectedCharId !== undefined ? injectedCharId : _selectedCharId;
  const setSelectedCharId = (id: string) => {
    _setSelectedCharId(id);
    onCharIdChange?.(id);
  };
  const [loadingScene,   setLoadingScene]   = React.useState(false);
  const [loadedScene,    setLoadedScene]    = React.useState(false);
  const [allScenes,      setAllScenes]      = React.useState<Array<{ basePrompt: string; koScene: string }>>([]);
  const [activeSceneIdx, setActiveSceneIdx] = React.useState(0);
  const [idbArtStyleId,  setIdbArtStyleId]  = React.useState<string | undefined>(undefined);

  // full-page 모드에서 IDB 화풍 ID 로드
  React.useEffect(() => {
    if (embedded) return;
    loadStateIDB('art_style_id').then(id => { if (typeof id === 'string') setIdbArtStyleId(id); });
  }, [embedded]);

  // artStyleId: prop 우선, 없으면 IDB에서 읽은 값
  const resolvedArtStyleId = artStyleId ?? idbArtStyleId;

  // injected가 없을 때만 직접 로드
  React.useEffect(() => { if (!injectedCharAssets) loadCharAssetsForMp4().then(setCharAssets); }, []);// eslint-disable-line react-hooks/exhaustive-deps

  // injectedCharId 변경 시 charInput 동기화
  React.useEffect(() => {
    if (injectedCharId !== undefined) {
      const found = charAssets.find(c => c.id === injectedCharId);
      setCharInput(found ? found.promptEn : '');
    }
  }, [injectedCharId, charAssets]);// eslint-disable-line react-hooks/exhaustive-deps

  // embedded 모드에서 씬 선택 시 프롬프트 동기화
  // sceneEn이 있으면 바로 사용, 없으면 sceneKo를 자체 번역하여 basePrompt 설정
  React.useEffect(() => {
    if (!embedded) return;
    const koText = sceneKo ?? '';
    if (koText) setKoScene(koText);
    setBaseInput('');

    if (sceneEn && sceneEn.trim()) {
      // 번역값이 이미 있음 — 바로 사용
      setBasePrompt(sceneEn.trim());
    } else if (koText.trim()) {
      // 번역값 없음 → 패널이 직접 번역
      setBasePrompt('');  // 번역 중 초기화
      fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(koText.trim())}&langpair=ko|en`)
        .then(r => r.json())
        .then(data => {
          const t = data.responseData?.translatedText?.trim() ?? '';
          setBasePrompt(t || koText);
        })
        .catch(() => setBasePrompt(koText));
    } else {
      setBasePrompt('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedded, sceneKo, sceneEn]);

  React.useEffect(() => {
    loadAllScenesData().then(scenes => {
      setAllScenes(scenes);
      if (!embedded && scenes[0]) {
        setBasePrompt(scenes[0].basePrompt);
        setKoScene(scenes[0].koScene);
        if (scenes[0].basePrompt) setLoadedScene(true);
      }
    }).catch(e => console.error('[mp4] 씬 초기 로드 실패:', e));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedded]); // 마운트 1회만 실행

  // selectedIdx 변경 시 allScenes 캐시로 동기화 — full-page 모드 전용
  // embedded 모드에서는 props(sceneKo/sceneEn)가 source of truth이므로 IDB 캐시로 덮어쓰지 않음
  React.useEffect(() => {
    if (embedded || selectedIdx === undefined) return; // embedded면 건너뜀
    const s = allScenes[selectedIdx];
    if (s) {
      setBasePrompt(s.basePrompt);
      setKoScene(s.koScene);
      setBaseInput('');
    }
  }, [embedded, selectedIdx, allScenes]);

  const handleLoadScene1 = async () => {
    setLoadingScene(true);
    try {
      const scenes = await loadAllScenesData();
      setAllScenes(scenes);
      if (scenes[0]) {
        setBasePrompt(scenes[0].basePrompt);
        setKoScene(scenes[0].koScene);
      }
      setLoadedScene(true);
      setTimeout(() => setLoadedScene(false), 2000);
    } catch (e) {
      console.error('[mp4] 씬 로드 실패:', e);
    } finally {
      setLoadingScene(false);
    }
  };

  const handleSelectScene = (idx: number) => {
    const s = allScenes[idx];
    if (!s) return;
    setActiveSceneIdx(idx);
    setBasePrompt(s.basePrompt);
    setKoScene(s.koScene);
    setBaseInput('');
  };

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

  // 화풍 스타일 프롬프트 (customPrompt 압축 + colorPalette)
  const styleEntry  = resolvedArtStyleId ? ART_STYLE_MAP[resolvedArtStyleId] : undefined;
  const stylePrompt = styleEntry
    ? [styleEntry.customPrompt, styleEntry.colorPalette].filter(Boolean).join(', ')
    : '';

  // 조명/색조/렌즈 자동 추론
  const visualPrompt = computeAutoVisual(hasSubject, hook, speed, subjectAction, envMotion, resolvedArtStyleId);

  const finalPrompt = hasSubject
    ? [basePrompt, charInput.trim(), actionPrompt, hookPrompt, motionPart, stylePrompt, visualPrompt, baseInput.trim()].filter(Boolean).join(', ')
    : [basePrompt, actionPrompt, hookPrompt, motionPart, stylePrompt, visualPrompt, baseInput.trim()].filter(Boolean).join(', ');
  const autoNegIds = computeAutoNeg(hasSubject, hook, move, speed, subjectAction, envMotion, resolvedArtStyleId);
  const effectiveNegIds = new Set(Array.from(autoNegIds).concat(Array.from(negSelected)));
  const negativePrompt = Array.from(effectiveNegIds)
    .map(id => NEGATIVE_OPTIONS.find(o => o.id === id)?.prompt || '')
    .filter(Boolean)
    .join(', ');

  const translateText = async (text: string): Promise<string> => {
    if (!text.trim()) return text;
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=ko|en`
    );
    const data = await res.json();
    return data.responseData?.translatedText?.trim() ?? text;
  };

  const handleTranslate = async () => {
    if (!baseInput.trim()) {
      alert('번역할 한글 내용을 먼저 입력하세요.');
      return;
    }
    setTranslating(true);
    try {
      const translatedBase = await translateText(baseInput);
      if (translatedBase) setBaseInput(translatedBase);
    } catch {
      alert('번역 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setTranslating(false);
    }
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

  const TOOLS = videoToolsData.tools;

  // ── embedded 모드: 2컬럼 (모션&옵션 40% + 프롬프트 60%) ──
  if (embedded) {
    return (
      <div className="flex items-start w-full">

        {/* CENTER: 모션 & 옵션 (40%) */}
        <div className="w-[40%] shrink-0 sticky top-0 self-start p-3">
          <div className="lg-glass rounded-2xl overflow-hidden">
            <div className="relative z-[2] px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white">1</span>
                <span className="text-sm font-black text-white">모션 &amp; 옵션 설정</span>
              </div>
            </div>
            <div className="relative z-[2] p-3 flex flex-col gap-3">
              {/* 캐릭터 선택 */}
              {hasSubject && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.30)', background: 'rgba(99,102,241,0.10)' }}>
                  <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                    <span className="text-xs">🧑</span>
                    <span className="text-xs font-black text-indigo-300">캐릭터 선택</span>
                    {charAssets.length === 0 && (
                      <a href="/content/characterimage" target="_blank" className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300">등록하기 →</a>
                    )}
                  </div>
                  <div className="p-2">
                    <select
                      value={selectedCharId}
                      onChange={e => {
                        const id = e.target.value;
                        setSelectedCharId(id);
                        const found = charAssets.find(c => c.id === id);
                        setCharInput(found ? found.promptEn : '');
                      }}
                      className="w-full text-xs text-gray-100 rounded-lg px-2 py-1.5 focus:outline-none"
                      style={{ border: '1px solid rgba(99,102,241,0.30)', background: 'rgba(15,23,42,0.5)' }}
                    >
                      <option value="">캐릭터 없음</option>
                      {charAssets.map(c => (
                        <option key={c.id} value={c.id}>{c.registeredBy === 'admin' ? '⭐ ' : ''}{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-gray-300 mb-2">🎯 씬 유형</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setHasSubject(true); setMove('push-in'); }}
                    className="py-2.5 rounded-xl text-xs font-black transition-all"
                    style={hasSubject === true ? {
                      border: '2px solid rgba(99,102,241,0.65)', background: 'rgba(99,102,241,0.22)', color: '#a5b4fc',
                      boxShadow: '0 0 18px rgba(99,102,241,0.30)', backdropFilter: 'blur(10px)',
                    } : {
                      border: '2px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)',
                    }}
                  >
                    <div className="text-base mb-0.5">🧑</div>
                    주요 캐릭터 있음
                    <div className="text-[10px] font-normal mt-0.5 opacity-70">인물 · 사물</div>
                  </button>
                  <button
                    onClick={() => { setHasSubject(false); setMove('push-in'); }}
                    className="py-2.5 rounded-xl text-xs font-black transition-all"
                    style={hasSubject === false ? {
                      border: '2px solid rgba(16,185,129,0.65)', background: 'rgba(16,185,129,0.20)', color: '#6ee7b7',
                      boxShadow: '0 0 18px rgba(16,185,129,0.25)', backdropFilter: 'blur(10px)',
                    } : {
                      border: '2px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)',
                    }}
                  >
                    <div className="text-base mb-0.5">🌿</div>
                    주요 캐릭터 없음
                    <div className="text-[10px] font-normal mt-0.5 opacity-70">배경 · 자연 · 공간</div>
                  </button>
                </div>
              </div>

              <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              <OptionGroup icon="🪝" title="후크 강도" options={HOOK_OPTIONS} value={hook} onChange={setHook} color="indigo" dark />

              {hasSubject === true && (
                <>
                  <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                  <OptionGroup icon="🤸" title="캐릭터 행동" options={SUBJECT_ACTION_OPTIONS} value={subjectAction} onChange={setSubjectAction} color="indigo" dark />
                </>
              )}
              {hasSubject === false && (
                <>
                  <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                  <OptionGroup icon="🌊" title="환경 모션" options={ENV_MOTION_OPTIONS} value={envMotion} onChange={setEnvMotion} color="amber" dark />
                </>
              )}

              <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              <OptionGroup icon="🎥" title={hasSubject ? '카메라 타겟: 캐릭터' : '카메라 이동'} options={activeMoveOptions} value={move} onChange={setMove} color="indigo" dark />
              <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              <OptionGroup icon="⚡" title={hasSubject ? '동작 속도 (캐릭터)' : '카메라 속도'} options={activeSpeedOptions} value={speed} onChange={setSpeed} color="amber" dark />
              <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              <NegativeGroup selected={negSelected} autoSelected={autoNegIds} onToggle={handleNegToggle} dark />
            </div>
          </div>
        </div>

        {/* RIGHT: 영상 제작 프롬프트 (60%) */}
          <div className="w-[60%] flex flex-col gap-3 p-3">
            <div className="lg-glass rounded-2xl overflow-hidden">
              <div className="relative z-[2] px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white">2</span>
                  <span className="text-sm font-black text-white">영상 제작 프롬프트</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-4 py-1.5 rounded-lg text-xs font-black transition-all"
                  style={copied ? {
                    background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', color: '#065f46',
                  } : {
                    background: 'rgba(99,102,241,0.85)', color: '#fff', border: '1px solid rgba(99,102,241,0.5)',
                    boxShadow: '0 2px 12px rgba(99,102,241,0.25)',
                  }}
                >
                  {copied ? '✓ 복사됨' : '복사'}
                </button>
              </div>
              <div className="relative z-[2] px-4 py-3 font-mono text-xs leading-6 bg-gray-950 rounded-none">
                {basePrompt       && <p className="mb-1"><span className="text-green-300 font-bold">{basePrompt}</span><span className="text-gray-500">, </span></p>}
                {hasSubject && charInput.trim() && <p className="mb-1"><span className="text-sky-400 font-bold">{charInput.trim()}</span><span className="text-gray-500">, </span></p>}
                {actionPrompt && <p className="mb-1"><span className={hasSubject ? 'text-pink-400 font-bold' : 'text-teal-400 font-bold'}>{actionPrompt}</span><span className="text-gray-500">, </span></p>}
                {hookPrompt   && <p className="mb-1"><span className="text-orange-400 font-bold">{hookPrompt}</span><span className="text-gray-500">, </span></p>}
                <p className="mb-1">
                  {[movePrompt, speedPrompt].filter(Boolean).map((seg, i, arr) => (
                    <span key={i}>
                      <span className={i === 0 ? 'text-indigo-400 font-bold' : 'text-amber-400 font-semibold'}>{seg}</span>
                      {i < arr.length - 1 && <span className="text-gray-500">, </span>}
                    </span>
                  ))}
                  {(stylePrompt || baseInput.trim()) && <span className="text-gray-500">, </span>}
                </p>
                {stylePrompt      && <p className="mb-1"><span className="text-fuchsia-400 font-bold">{stylePrompt}</span><span className="text-gray-500">, </span></p>}
                {visualPrompt     && <p className="mb-1"><span className="text-cyan-400 font-bold">{visualPrompt}</span>{baseInput.trim() && <span className="text-gray-500">, </span>}</p>}
                {baseInput.trim() && <p className="mb-1"><span className="text-violet-400 font-bold">{baseInput.trim()}</span></p>}
              </div>
              <div className="relative z-[2] px-4 pb-2 flex flex-wrap items-center gap-3 text-[10px] text-gray-400">
                <span className="font-black text-gray-300 mr-1">AI 보조 →</span>
                {basePrompt   && <span><span className="inline-block w-2 h-2 rounded-sm bg-emerald-500 mr-1" />씬 기본</span>}
                {hasSubject && charInput.trim() && <span><span className="inline-block w-2 h-2 rounded-sm bg-sky-500 mr-1" />캐릭터 묘사</span>}
                {stylePrompt  && <span><span className="inline-block w-2 h-2 rounded-sm bg-fuchsia-500 mr-1" />화풍</span>}
                {visualPrompt && <span><span className="inline-block w-2 h-2 rounded-sm bg-cyan-500 mr-1" />조명·색조·렌즈</span>}
                <span className="font-black text-gray-300 mx-1">수동 →</span>
                {actionPrompt && <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{background: hasSubject ? '#ec4899' : '#14b8a6'}} />{hasSubject ? '캐릭터 행동' : '환경 모션'}</span>}
                {hookPrompt   && <span><span className="inline-block w-2 h-2 rounded-sm bg-orange-500 mr-1" />후크</span>}
                <span><span className="inline-block w-2 h-2 rounded-sm bg-indigo-500 mr-1" />카메라</span>
                <span><span className="inline-block w-2 h-2 rounded-sm bg-amber-500 mr-1" />속도</span>
              </div>
              <div className="relative z-[2] mx-4 mb-3 px-3 py-2.5 rounded-xl flex flex-col gap-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[10px] font-black text-gray-400">씬 한글 설명</p>
                {(() => {
                  const hookDesc   = HOOK_OPTIONS.find(o => o.id === hook)?.desc;
                  const actionDesc = hasSubject
                    ? SUBJECT_ACTION_OPTIONS.find(o => o.id === subjectAction)?.desc
                    : ENV_MOTION_OPTIONS.find(o => o.id === envMotion)?.desc;
                  const moveDesc  = activeMoveOptions.find(o => o.id === move)?.desc;
                  const speedDesc = activeSpeedOptions.find(o => o.id === speed)?.desc;
                  const rows: { color: string; label: string; text: string }[] = [];
                  if (hook !== 'none' && hookDesc)  rows.push({ color: 'bg-orange-500', label: '후크',    text: hookDesc });
                  if (koScene)                       rows.push({ color: 'bg-emerald-500', label: '씬 내용', text: koScene });
                  if (actionDesc)                    rows.push({ color: hasSubject ? 'bg-pink-500' : 'bg-teal-500', label: hasSubject ? '캐릭터 행동' : '환경 모션', text: actionDesc });
                  if (moveDesc)                      rows.push({ color: 'bg-indigo-500', label: '카메라',  text: moveDesc });
                  if (speedDesc)                     rows.push({ color: 'bg-amber-500',  label: '속도',    text: speedDesc });
                  if (rows.length === 0) return <p className="text-xs text-gray-400">씬 프롬프트를 가져오면 여기에 표시됩니다.</p>;
                  return rows.map((r, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-sm ${r.color}`} />
                      <p className="text-xs text-gray-200 leading-relaxed">
                        <span className="font-bold text-gray-400 mr-1">[{r.label}]</span>{r.text}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {effectiveNegIds.size > 0 && (
              <div className="lg-glass rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(239,68,68,0.35)', boxShadow: '0 4px 24px rgba(239,68,68,0.15)' }}>
                <div className="relative z-[2] px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: '1px solid rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.08)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🚫</span>
                    <span className="text-sm font-black text-white">네거티브 프롬프트</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.40)' }}>
                      {effectiveNegIds.size}개 ({autoNegIds.size}자동+{negSelected.size}수동)
                    </span>
                  </div>
                  <button
                    onClick={handleCopyNeg}
                    className="px-4 py-1.5 rounded-lg text-xs font-black transition-all"
                    style={copiedNeg ? {
                      background: 'rgba(16,185,129,0.20)', border: '1px solid rgba(16,185,129,0.5)', color: '#6ee7b7',
                    } : {
                      background: 'rgba(239,68,68,0.75)', color: '#fff', border: '1px solid rgba(239,68,68,0.5)',
                      boxShadow: '0 2px 14px rgba(239,68,68,0.30)',
                    }}
                  >
                    {copiedNeg ? '✓ 복사됨' : '복사'}
                  </button>
                </div>
                <div className="relative z-[2] px-4 py-3">
                  <p className="font-mono text-sm text-red-300 leading-7">{negativePrompt}</p>
                </div>
              </div>
            )}

        </div>
      </div>
    );
  }

  // ── full-page 모드 (기존 레이아웃) ──
  return (
    <div className="min-h-screen flex flex-col page-slide-in relative" style={{ background: '#eef2ff' }}>

      {/* ── 배경 블롭 (라이트) ── */}
      <div className="lg-scene" aria-hidden="true">
        <div className="lg-blob lg-blob-light-1" />
        <div className="lg-blob lg-blob-light-2" />
        <div className="lg-blob lg-blob-light-3" />
      </div>

      {/* ── 헤더 — Glass light ── */}
      <header
        className="relative z-10 shrink-0"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(255,255,255,0.70)',
          borderBottom: '1px solid rgba(15,23,42,0.08)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.9), 0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-[1160px] mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/content/keyframe" className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium">
            ← 키프레임
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-lg">🎬</span>
          <h1 className="text-base font-black text-gray-900">MP4 프롬프트 생성기</h1>
          <button
            onClick={handleLoadScene1}
            disabled={loadingScene}
            className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            style={loadedScene ? {
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', color: '#065f46',
            } : {
              background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.35)', color: '#3730a3',
              backdropFilter: 'blur(8px)',
            }}
          >
            {loadingScene ? '⏳' : loadedScene ? `✓ ${allScenes.length}개 씬 가져옴` : '↓ 씬 목록 가져오기'}
          </button>
        </div>
      </header>

      {/* ── 스펙 안내 배너 — Glass amber ── */}
      <div
        className="relative z-10 px-6 py-2.5"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          background: 'rgba(255,251,235,0.80)',
          borderBottom: '1px solid rgba(245,158,11,0.25)',
        }}
      >
        <div className="max-w-[1160px] mx-auto flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="shrink-0 text-[11px] font-black text-gray-500">📋 씬 목록</span>
            {allScenes.length === 0 ? (
              <span className="text-[11px] text-gray-400 italic">← 씬 목록 가져오기 버튼을 눌러주세요</span>
            ) : allScenes.map((s, i) => {
              const isActive = i === activeSceneIdx;
              return (
                <button
                  key={i}
                  onClick={() => handleSelectScene(i)}
                  title={s.koScene ? `씬${i + 1}: ${s.koScene} — 클릭하여 프롬프트 로드` : `씬${i + 1} 선택`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all"
                  style={isActive ? {
                    background: 'rgba(99,102,241,0.22)',
                    border: '1px solid rgba(99,102,241,0.60)',
                    backdropFilter: 'blur(6px)',
                    boxShadow: '0 0 10px rgba(99,102,241,0.20)',
                  } : {
                    background: 'rgba(99,102,241,0.07)',
                    border: '1px solid rgba(99,102,241,0.20)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <span className={`font-black ${isActive ? 'text-indigo-700' : 'text-indigo-400'}`}>씬{i + 1}</span>
                  {s.koScene && (
                    <>
                      <span className="text-indigo-300">·</span>
                      <span className={`max-w-[160px] truncate ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>{s.koScene}</span>
                    </>
                  )}
                  {isActive && <span className="text-indigo-500 text-[10px]">✓</span>}
                </button>
              );
            })}
            {allScenes.length > 0 && (
              <span className="text-[11px] font-black text-indigo-500 ml-1">총 {allScenes.length}개</span>
            )}
          </div>
        </div>
      </div>

      {/* ── 본문 3컬럼 ── */}
      <div className="relative z-10 flex-1 max-w-[1160px] w-full mx-auto flex gap-5 p-5 items-start">

        {/* ── LEFT ── */}
        <div className="w-[300px] shrink-0 flex flex-col gap-4">

          {/* 캐릭터 선택 */}
          {hasSubject && (
            <div className="lg-glass-light lg-card-light rounded-2xl overflow-hidden">
              <div className="relative z-[2] px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)', background: 'rgba(99,102,241,0.05)' }}>
                <span className="text-sm">🧑</span>
                <span className="text-xs font-black text-indigo-900">캐릭터 선택</span>
                {charAssets.length === 0 && (
                  <a href="/content/characterimage" target="_blank" className="text-[10px] text-indigo-400 font-bold hover:text-indigo-600">캐릭터 등록하기 →</a>
                )}
              </div>
              <div className="relative z-[2] p-4">
                <select
                  value={selectedCharId}
                  onChange={e => {
                    const id = e.target.value;
                    setSelectedCharId(id);
                    const found = charAssets.find(c => c.id === id);
                    setCharInput(found ? found.promptEn : '');
                  }}
                  className="w-full text-xs text-gray-800 rounded-xl px-3 py-2 focus:outline-none"
                  style={{ border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.06)', backdropFilter: 'blur(6px)' }}
                >
                  <option value="">캐릭터 없음</option>
                  {charAssets.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.registeredBy === 'admin' ? '⭐ ' : ''}{c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 씬 설명 입력 */}
          <div className="lg-glass-light lg-card-light rounded-2xl overflow-hidden">
            <div className="relative z-[2] px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
              <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-black text-white">1</span>
              <span className="text-xs font-black text-gray-900">씬 설명 입력</span>
              <span className="text-[10px] text-gray-400 font-medium">한글로 작성하세요</span>
            </div>
            <div className="relative z-[2] p-4">
              <textarea
                value={baseInput}
                onChange={e => setBaseInput(e.target.value)}
                className="w-full text-xs text-gray-800 rounded-xl p-3 resize-none leading-relaxed focus:outline-none transition-all"
                style={{ border: '1px solid rgba(15,23,42,0.12)', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(6px)' }}
                rows={5}
                placeholder="예) 주식 폭락 뉴스를 전하는 앵커, 화면에 가득 찬 빨간 그래프, 불안한 분위기"
              />
            </div>
          </div>

          {/* 번역 버튼 */}
          <button
            onClick={handleTranslate}
            disabled={translating}
            className="lg-btn w-full py-3.5 rounded-2xl text-sm font-black text-white active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.85) 0%, rgba(37,99,235,0.85) 100%)',
              border: '1px solid rgba(59,130,246,0.5)',
              boxShadow: '0 4px 20px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            {translating ? (
              <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />번역 중...</>
            ) : <>🌐 한→영 번역</>}
          </button>
          <p className="text-[10px] text-gray-400 text-center -mt-2">한글 입력 → 영문으로 자동 번역 (무료)</p>
        </div>

        {/* ── CENTER: 모션 + 네거티브 ── */}
        <div className="lg-glass-light lg-card-light w-[380px] shrink-0 rounded-2xl overflow-hidden">
          <div className="relative z-[2] px-5 py-4" style={{ borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-black text-white">2</span>
              <span className="text-sm font-black text-gray-900">모션 &amp; 옵션 설정</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 pl-8">씬 유형에 따라 최적화된 옵션을 선택하세요.</p>
          </div>
          <div className="relative z-[2] p-4 flex flex-col gap-3">

            {/* 씬 유형 */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">🎯 씬 유형</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setHasSubject(true); setMove('push-in'); }}
                  className="py-3 rounded-xl text-xs font-black transition-all"
                  style={hasSubject === true ? {
                    border: '2px solid rgba(99,102,241,0.55)', background: 'rgba(99,102,241,0.10)', color: '#3730a3',
                    boxShadow: '0 0 16px rgba(99,102,241,0.15)', backdropFilter: 'blur(8px)',
                  } : {
                    border: '2px solid rgba(15,23,42,0.10)', background: 'rgba(255,255,255,0.5)', color: '#374151', backdropFilter: 'blur(6px)',
                  }}
                >
                  <div className="text-lg mb-1">🧑</div>
                  주요 캐릭터 있음
                  <div className="text-[10px] font-normal mt-0.5 opacity-70">인물 · 사물</div>
                </button>
                <button
                  onClick={() => { setHasSubject(false); setMove('push-in'); }}
                  className="py-3 rounded-xl text-xs font-black transition-all"
                  style={hasSubject === false ? {
                    border: '2px solid rgba(16,185,129,0.55)', background: 'rgba(16,185,129,0.10)', color: '#065f46',
                    boxShadow: '0 0 16px rgba(16,185,129,0.15)', backdropFilter: 'blur(8px)',
                  } : {
                    border: '2px solid rgba(15,23,42,0.10)', background: 'rgba(255,255,255,0.5)', color: '#374151', backdropFilter: 'blur(6px)',
                  }}
                >
                  <div className="text-lg mb-1">🌿</div>
                  주요 캐릭터 없음
                  <div className="text-[10px] font-normal mt-0.5 opacity-70">배경 · 자연 · 공간</div>
                </button>
              </div>
            </div>

            <hr style={{ borderColor: 'rgba(15,23,42,0.07)' }} />
            <OptionGroup icon="🪝" title="후크 강도" options={HOOK_OPTIONS} value={hook} onChange={setHook} color="indigo" />

            {hasSubject === true && (
              <>
                <hr style={{ borderColor: 'rgba(15,23,42,0.07)' }} />
                <OptionGroup icon="🤸" title="캐릭터 행동" options={SUBJECT_ACTION_OPTIONS} value={subjectAction} onChange={setSubjectAction} color="indigo" />
              </>
            )}
            {hasSubject === false && (
              <>
                <hr style={{ borderColor: 'rgba(15,23,42,0.07)' }} />
                <OptionGroup icon="🌊" title="환경 모션" options={ENV_MOTION_OPTIONS} value={envMotion} onChange={setEnvMotion} color="amber" />
              </>
            )}

            <hr style={{ borderColor: 'rgba(15,23,42,0.07)' }} />
            <OptionGroup icon="🎥" title={hasSubject ? '카메라 타겟: 캐릭터' : '카메라 이동'} options={activeMoveOptions} value={move} onChange={setMove} color="indigo" />
            <hr style={{ borderColor: 'rgba(15,23,42,0.07)' }} />
            <OptionGroup icon="⚡" title={hasSubject ? '동작 속도 (캐릭터)' : '카메라 속도'} options={activeSpeedOptions} value={speed} onChange={setSpeed} color="amber" />
            <hr style={{ borderColor: 'rgba(15,23,42,0.07)' }} />
            <NegativeGroup selected={negSelected} autoSelected={autoNegIds} onToggle={handleNegToggle} />
          </div>
        </div>

        {/* ── RIGHT: 프롬프트 출력 ── */}
        <div className="flex-1 flex flex-col gap-4">

          {/* 최종 프롬프트 */}
          <div className="lg-glass-light lg-card-light rounded-2xl overflow-hidden">
            <div className="relative z-[2] px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-black text-white">3</span>
                <span className="text-sm font-black text-gray-900">영상 제작 프롬프트</span>
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-1.5 rounded-lg text-xs font-black transition-all"
                style={copied ? {
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', color: '#065f46',
                } : {
                  background: 'rgba(99,102,241,0.85)', color: '#fff', border: '1px solid rgba(99,102,241,0.5)',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.25)',
                }}
              >
                {copied ? '✓ 복사됨' : '복사'}
              </button>
            </div>
            <div className="relative z-[2] px-5 py-4 font-mono text-sm leading-7 bg-gray-950 rounded-none">
              {basePrompt       && <p className="mb-1"><span className="text-green-300 font-bold">{basePrompt}</span><span className="text-gray-500">, </span></p>}
              {hasSubject && charInput.trim() && <p className="mb-1"><span className="text-sky-400 font-bold">{charInput.trim()}</span><span className="text-gray-500">, </span></p>}
              {actionPrompt && <p className="mb-1"><span className={hasSubject ? 'text-pink-400 font-bold' : 'text-teal-400 font-bold'}>{actionPrompt}</span><span className="text-gray-500">, </span></p>}
              {hookPrompt   && <p className="mb-1"><span className="text-orange-400 font-bold">{hookPrompt}</span><span className="text-gray-500">, </span></p>}
              <p className="mb-1">
                {[movePrompt, speedPrompt].filter(Boolean).map((seg, i, arr) => (
                  <span key={i}>
                    <span className={i === 0 ? 'text-indigo-400 font-bold' : 'text-amber-400 font-semibold'}>{seg}</span>
                    {i < arr.length - 1 && <span className="text-gray-500">, </span>}
                  </span>
                ))}
                {(stylePrompt || baseInput.trim()) && <span className="text-gray-500">, </span>}
              </p>
              {stylePrompt      && <p className="mb-1"><span className="text-fuchsia-400 font-bold">{stylePrompt}</span><span className="text-gray-500">, </span></p>}
              {visualPrompt     && <p className="mb-1"><span className="text-cyan-400 font-bold">{visualPrompt}</span>{baseInput.trim() && <span className="text-gray-500">, </span>}</p>}
              {baseInput.trim() && <p className="mb-1"><span className="text-violet-400 font-bold">{baseInput.trim()}</span></p>}
            </div>
            <div className="relative z-[2] px-5 pb-3 flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
              <span className="font-black text-gray-400 mr-1">AI 보조 →</span>
              {basePrompt   && <span><span className="inline-block w-2 h-2 rounded-sm bg-emerald-500 mr-1" />씬 기본</span>}
              {hasSubject && charInput.trim() && <span><span className="inline-block w-2 h-2 rounded-sm bg-sky-500 mr-1" />캐릭터 묘사</span>}
              {stylePrompt  && <span><span className="inline-block w-2 h-2 rounded-sm bg-fuchsia-500 mr-1" />화풍</span>}
              {visualPrompt && <span><span className="inline-block w-2 h-2 rounded-sm bg-cyan-500 mr-1" />조명·색조·렌즈</span>}
              <span className="font-black text-gray-400 mx-1">수동 →</span>
              {actionPrompt && <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{background: hasSubject ? '#ec4899' : '#14b8a6'}} />{hasSubject ? '캐릭터 행동' : '환경 모션'}</span>}
              {hookPrompt   && <span><span className="inline-block w-2 h-2 rounded-sm bg-orange-500 mr-1" />후크</span>}
              <span><span className="inline-block w-2 h-2 rounded-sm bg-indigo-500 mr-1" />카메라</span>
              <span><span className="inline-block w-2 h-2 rounded-sm bg-amber-500 mr-1" />속도</span>
              {baseInput.trim() && <span><span className="inline-block w-2 h-2 rounded-sm bg-violet-500 mr-1" />씬 설명</span>}
            </div>
            {/* 한글 설명 */}
            <div className="relative z-[2] mx-5 mb-4 px-4 py-3 rounded-xl flex flex-col gap-2"
              style={{ background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.07)' }}>
              <p className="text-[10px] font-black text-gray-500">씬1 한글 설명</p>
              {(() => {
                const hookDesc   = HOOK_OPTIONS.find(o => o.id === hook)?.desc;
                const actionDesc = hasSubject
                  ? SUBJECT_ACTION_OPTIONS.find(o => o.id === subjectAction)?.desc
                  : ENV_MOTION_OPTIONS.find(o => o.id === envMotion)?.desc;
                const moveDesc  = activeMoveOptions.find(o => o.id === move)?.desc;
                const speedDesc = activeSpeedOptions.find(o => o.id === speed)?.desc;
                const rows: { color: string; label: string; text: string }[] = [];
                if (hook !== 'none' && hookDesc)  rows.push({ color: 'bg-orange-500', label: '후크',    text: hookDesc });
                if (koScene)                       rows.push({ color: 'bg-emerald-500', label: '씬 내용', text: koScene });
                if (actionDesc)                    rows.push({ color: hasSubject ? 'bg-pink-500' : 'bg-teal-500', label: hasSubject ? '캐릭터 행동' : '환경 모션', text: actionDesc });
                if (moveDesc)                      rows.push({ color: 'bg-indigo-500', label: '카메라',  text: moveDesc });
                if (speedDesc)                     rows.push({ color: 'bg-amber-500',  label: '속도',    text: speedDesc });
                if (rows.length === 0) return <p className="text-xs text-gray-400">씬1 프롬프트를 가져오면 여기에 표시됩니다.</p>;
                return rows.map((r, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-sm ${r.color}`} />
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <span className="font-bold text-gray-500 mr-1">[{r.label}]</span>{r.text}
                    </p>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* 네거티브 프롬프트 */}
          {effectiveNegIds.size > 0 && (
            <div className="lg-glass-light rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 4px 24px rgba(239,68,68,0.08)' }}>
              <div className="relative z-[2] px-5 py-3.5 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(239,68,68,0.12)', background: 'rgba(239,68,68,0.04)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">🚫</span>
                  <span className="text-sm font-black text-gray-900">네거티브 프롬프트</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ color: '#b91c1c', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    {effectiveNegIds.size}개 적용 ({autoNegIds.size}자동+{negSelected.size}수동)
                  </span>
                </div>
                <button
                  onClick={handleCopyNeg}
                  className="px-4 py-1.5 rounded-lg text-xs font-black transition-all"
                  style={copiedNeg ? {
                    background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', color: '#065f46',
                  } : {
                    background: 'rgba(239,68,68,0.80)', color: '#fff', border: '1px solid rgba(239,68,68,0.4)',
                    boxShadow: '0 2px 12px rgba(239,68,68,0.2)',
                  }}
                >
                  {copiedNeg ? '✓ 복사됨' : '복사'}
                </button>
              </div>
              <div className="relative z-[2] px-5 py-4">
                <p className="font-mono text-sm text-red-700 leading-7">{negativePrompt}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 하단 도구 표 ── */}
      <div className="relative z-10 max-w-[1160px] w-full mx-auto px-5 pb-8">
        <div className="lg-glass-light rounded-2xl overflow-hidden">
          <div className="relative z-[2] px-5 py-3.5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
            <p className="text-xs font-black text-gray-700">🎞 이미지 → 영상 도구</p>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ color: '#065f46', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
              무료 우선순위 정렬
            </span>
          </div>
          <div className="relative z-[2] grid grid-cols-2 divide-x" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
            <table className="w-full text-xs">
              <tbody>
                {TOOLS.slice(0, Math.ceil(TOOLS.length / 2)).map(t => (
                  <tr key={t.name} className="transition-colors" style={{ borderBottom: '1px solid rgba(15,23,42,0.05)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td className="px-5 py-3 w-[160px]">
                      <a href={t.url} target="_blank" rel="noopener noreferrer"
                        className="font-black text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                        {t.name}
                      </a>
                    </td>
                    <td className="px-3 py-3 text-gray-500">{t.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-full text-xs">
              <tbody>
                {TOOLS.slice(Math.ceil(TOOLS.length / 2)).map(t => (
                  <tr key={t.name} className="transition-colors" style={{ borderBottom: '1px solid rgba(15,23,42,0.05)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td className="px-5 py-3 w-[160px]">
                      <a href={t.url} target="_blank" rel="noopener noreferrer"
                        className="font-black text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                        {t.name}
                      </a>
                    </td>
                    <td className="px-3 py-3 text-gray-500">{t.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
