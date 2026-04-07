'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import charactersData from '@/data/series_characters.json';

const A4_W = 794;
const A4_H = 1123;
const PAD_H = 72;
const PAD_V = 60;

const GENRES = ['액션', '드라마/멜로', '코메디', '가족', 'SF/판타지', '공포/호러', '범죄/스릴러', '다큐'];
const STYLES = ['내레이션(3인칭)', '혼합형', '드라마형'];
const RELATIONSHIPS = ['부부', '이웃', '직장동료', '모르는사이', '친척', '전연인'];
// 1:1 대립 구조 — 같은 사건을 두 시선으로 읽는다
const CONFLICT_PAIRS: { a: string; b: string }[] = [
  { a: '불륜·배신',     b: '사랑·로맨스'     },
  { a: '경제적 파탄',   b: '새 출발·도전'     },
  { a: '세대 충돌',     b: '세대 공감·연대'   },
  { a: '가정 해체',     b: '가정 회복·화해'   },
  { a: '계층 갈등',     b: '계층 이동·성공'   },
  { a: '복수·응징',     b: '용서·치유'        },
  { a: '생존·절박함',   b: '희망·극복'        },
  { a: '고립·단절',     b: '연결·관계 회복'   },
  { a: '비밀·거짓',     b: '고백·진실'        },
  { a: '집착·통제',     b: '독립·해방'        },
  { a: '감금·위협',     b: '헌신·보호'        },
];

// 감정선 타입 — 어두운/밝은 양면 모두 포함
const EMOTION_TYPES = [
  { label: '로맨스',     color: '#db2777', bg: '#fdf2f8' },
  { label: '짝사랑',     color: '#9333ea', bg: '#faf5ff' },
  { label: '착각',       color: '#7c3aed', bg: '#f5f3ff' },
  { label: '불륜',       color: '#dc2626', bg: '#fff1f2' },
  { label: '금지된 감정', color: '#ea580c', bg: '#fff7ed' },
  { label: '위로·의지',  color: '#0369a1', bg: '#f0f9ff' },
  { label: '집착',       color: '#4f46e5', bg: '#eef2ff' },
  { label: '경쟁·질투',  color: '#b45309', bg: '#fefce8' },
];

const LABEL_BASE = 'text-[10px] font-black text-gray-400 tracking-[0.15em] uppercase';

// 전체 캐릭터 그룹 (주연 + 조연)
const ALL_CHAR_GROUPS = [
  ...charactersData.families.map(f => ({ group: f.name, members: f.members })),
  ...charactersData.supporting.map(s => ({ group: s.group, members: s.members })),
];
const ALL_MEMBERS_FLAT = ALL_CHAR_GROUPS.flatMap(g => g.members as unknown as Member[]);

function NeuPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`neu-btn px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
        selected ? 'neu-inset text-purple-700 font-bold' : 'neu-raised-sm text-gray-600'
      }`}
    >
      {label}
    </button>
  );
}

function SectionLabel({ label, done, required = true }: { label: string; done: boolean; required?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={LABEL_BASE}>{label}</span>
      {required && (
        <span className={`w-1.5 h-1.5 rounded-full transition-colors ${done ? 'bg-green-400' : 'bg-red-300'}`} />
      )}
    </div>
  );
}

type AppearanceFreq = '1회성' | '2~3회' | '주요 조연';
const FREQ_OPTIONS: { label: AppearanceFreq; desc: string; color: string; bg: string }[] = [
  { label: '1회성',   desc: '한 장면만 등장',      color: '#6b7280', bg: '#f9fafb' },
  { label: '2~3회',  desc: '중간중간 재등장',      color: '#0369a1', bg: '#f0f9ff' },
  { label: '주요 조연', desc: '스토리에 깊이 관여', color: '#7c3aed', bg: '#faf5ff' },
];

interface SupportAppearance {
  id: string;
  frequency: AppearanceFreq;
}

interface EmotionLine {
  id: string;
  fromId: string;
  toId: string;
  type: string;
}

interface Member {
  id: string;
  name: string;
  gender: string;
  age: number;
  age_group: string;
  occupation: string;
  personality: string;
  speaking_style: string;
  concern: string;
  voice_id: string | null;
  role_in_story: string;
  situations: string[];
}

// 개별 캐릭터 파일 (data/characters/{id}.json) 구조
interface CharCore {
  public_face?: string;
  shadow?: string;
  personality: string;
  speaking_style: string;
  concern?: string;
  fear?: string;
  lie_to_self?: string;
  under_stress?: string;
  speaking_examples?: string[];
}
interface CharDetailFile {
  id: string;
  name: string;
  core: CharCore;
  situations: string[];
}

function CharCard({
  member,
  roleA,
  roleB,
  onSelectA,
  onSelectB,
}: {
  member: Member;
  roleA: boolean;
  roleB: boolean;
  onSelectA: () => void;
  onSelectB: () => void;
}) {
  const highlight = roleA ? 'ring-2 ring-purple-400' : roleB ? 'ring-2 ring-pink-400' : '';
  return (
    <div className={`relative neu-btn rounded-xl p-3 transition-all ${roleA || roleB ? 'neu-inset' : 'neu-raised-sm'} ${highlight}`}>
      {/* A/B 선택 버튼 */}
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          onClick={onSelectA}
          title="등장인물 A로 선택"
          className={`w-5 h-5 rounded-full text-[8px] font-black flex items-center justify-center transition-colors ${
            roleA ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-purple-100 hover:text-purple-600'
          }`}
        >A</button>
        <button
          onClick={onSelectB}
          title="등장인물 B로 선택"
          className={`w-5 h-5 rounded-full text-[8px] font-black flex items-center justify-center transition-colors ${
            roleB ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-pink-100 hover:text-pink-500'
          }`}
        >B</button>
      </div>

      <div className="pr-12">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-sm font-black text-gray-800">{member.name}</span>
          <span className="text-[9px] text-gray-400">{member.age}세</span>
          <span className={`text-[8px] font-bold px-1 rounded ${member.gender === 'male' ? 'text-blue-400 bg-blue-50' : 'text-pink-400 bg-pink-50'}`}>
            {member.gender === 'male' ? '남' : '여'}
          </span>
        </div>
        <p className="text-[10px] text-purple-600 font-bold mb-1 leading-tight">{member.occupation}</p>
        <p className="text-[9px] text-gray-500 leading-relaxed line-clamp-2">{member.personality}</p>
        <p className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{member.concern}</p>
        {!member.voice_id && (
          <span className="text-[8px] text-amber-400 mt-1 block">성우 미지정</span>
        )}
      </div>
    </div>
  );
}

function SupportingCharCard({
  member,
  appearance,
  onToggle,
  onSetFreq,
  onSelectA,
  onSelectB,
  roleA,
  roleB,
}: {
  member: Member;
  appearance: SupportAppearance | undefined;
  onToggle: () => void;
  onSetFreq: (freq: AppearanceFreq) => void;
  onSelectA: () => void;
  onSelectB: () => void;
  roleA: boolean;
  roleB: boolean;
}) {
  const isAdded = !!appearance;
  const freq = appearance?.frequency;
  const isMainCast = freq === '주요 조연';

  return (
    <div className={`rounded-xl p-3 transition-all neu-btn ${isAdded ? 'neu-inset' : 'neu-raised-sm'}`}
      style={isAdded ? { border: `1.5px solid ${FREQ_OPTIONS.find(f => f.label === freq)?.color ?? '#d1d5db'}44` } : {}}>
      {/* 이름 + 등장 토글 */}
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex-1 pr-1">
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <span className="text-sm font-black text-gray-800">{member.name}</span>
            <span className="text-[9px] text-gray-400">{member.age}세</span>
            <span className={`text-[8px] font-bold px-1 rounded ${member.gender === 'male' ? 'text-blue-400 bg-blue-50' : 'text-pink-400 bg-pink-50'}`}>
              {member.gender === 'male' ? '남' : '여'}
            </span>
          </div>
          <p className="text-[10px] text-purple-600 font-bold leading-tight">{member.occupation}</p>
        </div>
        <button
          onClick={onToggle}
          className="shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black transition-all"
          style={isAdded
            ? { background: '#faf5ff', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.3)' }
            : { background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb' }}
        >
          {isAdded ? '등장 ✓' : '등장'}
        </button>
      </div>

      {/* 등장 빈도 선택 */}
      {isAdded && (
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex gap-1">
            {FREQ_OPTIONS.map(opt => (
              <button
                key={opt.label}
                onClick={() => onSetFreq(opt.label)}
                className="flex-1 py-1 rounded-lg text-[9px] font-bold transition-all text-center"
                style={freq === opt.label
                  ? { background: opt.color, color: 'white' }
                  : { background: opt.bg, color: opt.color, border: `1px solid ${opt.color}44` }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 주요 조연 선택 시 A/B 승격 버튼 */}
          {isMainCast && (
            <div className="flex items-center gap-1.5 mt-1 pt-1.5"
              style={{ borderTop: '1px dashed rgba(124,58,237,0.2)' }}>
              <span className="text-[8px] text-purple-400 font-black">주연 승격:</span>
              <button
                onClick={onSelectA}
                className="flex-1 py-1 rounded-lg text-[9px] font-black transition-all"
                style={roleA
                  ? { background: '#7c3aed', color: 'white' }
                  : { background: '#faf5ff', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.3)' }}
              >A 주연</button>
              <button
                onClick={onSelectB}
                className="flex-1 py-1 rounded-lg text-[9px] font-black transition-all"
                style={roleB
                  ? { background: '#ec4899', color: 'white' }
                  : { background: '#fdf2f8', color: '#db2777', border: '1px solid rgba(219,39,119,0.2)' }}
              >B 주연</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SeriesWorldInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [topic, setTopic] = useState('');
  const [selGenre, setSelGenre] = useState<string | null>(null);
  const [selStyle, setSelStyle] = useState<string | null>(null);
  const [selRelationship, setSelRelationship] = useState<string | null>(null);
  const [selConflictTypes, setSelConflictTypes] = useState<string[]>([]);
  const [chapters, setChapters] = useState(6);
  const [selCharA, setSelCharA] = useState<string | null>(null);
  const [selCharB, setSelCharB] = useState<string | null>(null);
  const [charASituation, setCharASituation] = useState('');
  const [charBSituation, setCharBSituation] = useState('');
  const [emotionLines, setEmotionLines] = useState<EmotionLine[]>([]);
  const [openSupportGroup, setOpenSupportGroup] = useState<string | null>(null);
  const [supportingCast, setSupportingCast] = useState<SupportAppearance[]>([]);
  const [charASecret, setCharASecret] = useState('');   // A가 모르는 사실 (B는 앎)
  const [charBSecret, setCharBSecret] = useState('');   // B가 모르는 사실 (A는 앎)
  const [charAGoal, setCharAGoal] = useState('');       // A의 이 시리즈 목표
  const [charBGoal, setCharBGoal] = useState('');       // B의 이 시리즈 목표
  const [trendTitles, setTrendTitles]   = useState<string[]>([]);   // 트랜드 제목 후보
  const [trendSubjects, setTrendSubjects] = useState<string[]>([]); // 트랜드 주제 후보
  const [charACoreDetail, setCharACoreDetail] = useState<CharDetailFile | null>(null);
  const [charBCoreDetail, setCharBCoreDetail] = useState<CharDetailFile | null>(null);

  // ── 마운트 시 draft 복원 ──────────────────────────────────────────
  useEffect(() => {
    const urlTopic = searchParams.get('topic') ?? '';
    try {
      const raw = sessionStorage.getItem('series_world_draft');
      const draft = raw ? JSON.parse(raw) : null;

      // draft가 있고, URL topic과 같은 주제면 draft 복원
      if (draft && (!urlTopic || draft.topic === urlTopic)) {
        if (draft.topic)            setTopic(draft.topic);
        if (draft.selGenre)         setSelGenre(draft.selGenre);
        if (draft.selStyle)         setSelStyle(draft.selStyle);
        if (draft.selRelationship)  setSelRelationship(draft.selRelationship);
        if (draft.selConflictTypes) setSelConflictTypes(draft.selConflictTypes);
        if (draft.chapters)         setChapters(draft.chapters);
        if (draft.selCharA)         setSelCharA(draft.selCharA);
        if (draft.selCharB)         setSelCharB(draft.selCharB);
        if (draft.charASituation)   setCharASituation(draft.charASituation);
        if (draft.charBSituation)   setCharBSituation(draft.charBSituation);
        if (draft.charASecret)      setCharASecret(draft.charASecret);
        if (draft.charBSecret)      setCharBSecret(draft.charBSecret);
        if (draft.charAGoal)        setCharAGoal(draft.charAGoal);
        if (draft.charBGoal)        setCharBGoal(draft.charBGoal);
        if (draft.trendTitles)      setTrendTitles(draft.trendTitles);
        if (draft.trendSubjects)    setTrendSubjects(draft.trendSubjects);
        if (draft.supportingCast)   setSupportingCast(draft.supportingCast);
        return; // draft 복원 완료 — URL 파라미터 무시
      }
    } catch { /* ignore */ }

    // draft 없거나 topic이 다름 → URL 파라미터로 새로 시작
    if (!urlTopic) return;
    setTopic(urlTopic);
    setSelCharA(null); setSelCharB(null);
    setCharASituation(''); setCharBSituation('');
    setSelRelationship(null); setSelConflictTypes([]);
    setCharASecret(''); setCharBSecret('');
    setCharAGoal(''); setCharBGoal('');
    setSupportingCast([]);
    try {
      const rawTitles = searchParams.get('titles');
      const rawSubjects = searchParams.get('subjects');
      if (rawTitles) setTrendTitles(JSON.parse(rawTitles) as string[]);
      if (rawSubjects) setTrendSubjects(JSON.parse(rawSubjects) as string[]);
    } catch { /* ignore */ }
  }, []); // 마운트 1회만 실행

  // ── 상태 변경 시마다 draft 자동 저장 ────────────────────────────
  useEffect(() => {
    if (!topic) return; // topic 없으면 저장 안 함
    sessionStorage.setItem('series_world_draft', JSON.stringify({
      topic, selGenre, selStyle, selRelationship, selConflictTypes,
      chapters, selCharA, selCharB, charASituation, charBSituation,
      charASecret, charBSecret, charAGoal, charBGoal,
      trendTitles, trendSubjects, supportingCast,
    }));
  }, [
    topic, selGenre, selStyle, selRelationship, selConflictTypes,
    chapters, selCharA, selCharB, charASituation, charBSituation,
    charASecret, charBSecret, charAGoal, charBGoal,
    trendTitles, trendSubjects, supportingCast,
  ]);

  // ── 개별 캐릭터 파일 로더 (core 심층 필드 획득) ───────────────
  const loadCharDetail = async (id: string): Promise<CharDetailFile | null> => {
    try {
      const mod = await import(`@/data/characters/${id}.json`);
      return mod.default as CharDetailFile;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!selCharA) { setCharACoreDetail(null); return; }
    void loadCharDetail(selCharA).then(setCharACoreDetail);
  }, [selCharA]);

  useEffect(() => {
    if (!selCharB) { setCharBCoreDetail(null); return; }
    void loadCharDetail(selCharB).then(setCharBCoreDetail);
  }, [selCharB]);

  // ── 인물 에디터에서 저장한 감정선 불러오기 ──────────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('series_edges');
      if (!raw) return;
      const parsed: { id: string; fromId: string; toId: string; type: string }[] = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      setEmotionLines(parsed.map(e => ({ id: e.id, fromId: e.fromId, toId: e.toId, type: e.type })));
    } catch {
      // ignore
    }
  }, []);

  const getCharDetails = (id: string) => ALL_MEMBERS_FLAT.find(m => m.id === id) ?? null;

  const handleSelectA = (id: string) => {
    setSelCharA(prev => prev === id ? null : id);
    setCharASituation('');
  };
  const handleSelectB = (id: string) => {
    setSelCharB(prev => prev === id ? null : id);
    setCharBSituation('');
  };

  const toggleConflict = (type: string) => {
    setSelConflictTypes(prev => {
      if (prev.includes(type)) return prev.filter(t => t !== type);
      if (prev.length >= 2) return prev;
      return [...prev, type];
    });
  };

  const toggleSupportAppearance = (id: string) => {
    setSupportingCast(prev =>
      prev.find(s => s.id === id)
        ? prev.filter(s => s.id !== id)
        : [...prev, { id, frequency: '1회성' }]
    );
  };
  const setSupportFreq = (id: string, freq: AppearanceFreq) => {
    setSupportingCast(prev => prev.map(s => s.id === id ? { ...s, frequency: freq } : s));
  };

  const EMOTION_LINE_MAX = Math.max(4, emotionLines.length);
  const addEmotionLine = () => {
    if (emotionLines.length >= EMOTION_LINE_MAX) return;
    setEmotionLines(prev => [...prev, { id: Date.now().toString(), fromId: '', toId: '', type: '' }]);
  };
  const removeEmotionLine = (id: string) => setEmotionLines(prev => prev.filter(l => l.id !== id));
  const updateEmotionLine = (id: string, patch: Partial<EmotionLine>) =>
    setEmotionLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));

  const steps = [
    { label: 'topic',  done: !!topic },
    { label: '장르',   done: selGenre !== null },
    { label: '문체',   done: selStyle !== null },
    { label: '관계',   done: selRelationship !== null },
    { label: '갈등',   done: selConflictTypes.length > 0 },
    { label: '인물A',  done: selCharA !== null && charASituation !== '' },
    { label: '인물B',  done: selCharB !== null && charBSituation !== '' },
  ];
  const completedCount = steps.filter(s => s.done).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);
  const canProceed = steps.every(s => s.done);

  const charADetail = selCharA ? getCharDetails(selCharA) : null;
  const charBDetail = selCharB ? getCharDetails(selCharB) : null;

  const handleProceed = () => {
    if (!canProceed) return;
    sessionStorage.setItem('series_world', JSON.stringify({
      topic,
      genre: selGenre,
      style: selStyle,
      relationship: selRelationship,
      conflictTypes: selConflictTypes,
      chapters,
      charA: selCharA,
      charAName: charADetail?.name ?? '',
      charAOccupation: charADetail?.occupation ?? '',
      charAPublicFace: charACoreDetail?.core?.public_face ?? '',
      charAShadow: charACoreDetail?.core?.shadow ?? '',
      charAPersonality: charACoreDetail?.core?.personality ?? charADetail?.personality ?? '',
      charASpeakingStyle: charACoreDetail?.core?.speaking_style ?? charADetail?.speaking_style ?? '',
      charASituation,
      charAFear: charACoreDetail?.core?.fear ?? '',
      charALieToSelf: charACoreDetail?.core?.lie_to_self ?? '',
      charAUnderStress: charACoreDetail?.core?.under_stress ?? '',
      charASpeakingExamples: charACoreDetail?.core?.speaking_examples ?? [],
      charB: selCharB,
      charBName: charBDetail?.name ?? '',
      charBOccupation: charBDetail?.occupation ?? '',
      charBPublicFace: charBCoreDetail?.core?.public_face ?? '',
      charBShadow: charBCoreDetail?.core?.shadow ?? '',
      charBPersonality: charBCoreDetail?.core?.personality ?? charBDetail?.personality ?? '',
      charBSpeakingStyle: charBCoreDetail?.core?.speaking_style ?? charBDetail?.speaking_style ?? '',
      charBSituation,
      charBFear: charBCoreDetail?.core?.fear ?? '',
      charBLieToSelf: charBCoreDetail?.core?.lie_to_self ?? '',
      charBUnderStress: charBCoreDetail?.core?.under_stress ?? '',
      charBSpeakingExamples: charBCoreDetail?.core?.speaking_examples ?? [],
      emotionLines,
      supportingCast,
      charASecret,
      charBSecret,
      charAGoal,
      charBGoal,
      charAWant: '',
      charANeed: '',
      charAEmotionArc: [],
      charBWant: '',
      charBNeed: '',
      charBEmotionArc: [],
      coreWound: '',
      trendTitles,
      trendSubjects,
    }));
    sessionStorage.removeItem('series_world_draft'); // 확정 후 draft 클리어
    router.push('/series/script');
  };

  return (
    <div className="neu-bg min-h-screen flex flex-col">

      {/* 툴바 */}
      <div
        className="sticky top-[52px] z-50 border-b border-[#b8bcc2]"
        style={{ background: 'linear-gradient(145deg, #e6e9ef, #d1d5db)', boxShadow: '0 4px 12px rgba(184,188,194,0.4)' }}
      >
        <div className="flex items-center gap-3" style={{ width: A4_W, margin: '0 auto', paddingLeft: 8, paddingRight: 8, minHeight: 44 }}>
          <div className="flex items-center gap-2 shrink-0 px-2">
            <span style={{ background: '#7c3aed', color: 'white', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, letterSpacing: '0.06em' }}>02</span>
            <span className="text-sm font-bold text-gray-700">세계관</span>
          </div>
          <div className="flex-1 flex items-center gap-1.5">
            {steps.map(s => (
              <div key={s.label} title={s.label}
                className={`flex-1 h-1.5 rounded-full transition-colors ${s.done ? 'bg-purple-500' : 'bg-gray-200'}`} />
            ))}
            <span className="text-[10px] font-black ml-1 shrink-0" style={{ color: progressPct === 100 ? '#7c3aed' : '#9ca3af' }}>
              {progressPct}%
            </span>
          </div>
          <button
            disabled={!canProceed}
            onClick={handleProceed}
            className="neu-primary-btn neu-btn px-4 py-1.5 rounded-xl text-xs font-bold disabled:opacity-30 shrink-0"
          >
            대본 만들기로 →
          </button>
        </div>
      </div>

      {/* A4 */}
      <div className="flex-1 flex justify-center py-10">
        <div className="relative neu-raised" style={{ width: A4_W, minHeight: A4_H, borderRadius: 2 }}>
          <div style={{ padding: `${PAD_V}px ${PAD_H}px`, paddingBottom: PAD_V * 2 }}>

            {/* 1. TOPIC */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <SectionLabel label="topic" done={!!topic} />
              {topic
                ? <span className="neu-inset px-4 py-2 rounded-2xl text-sm font-bold text-purple-700 inline-block">{topic}</span>
                : <span className="text-sm text-gray-400">트랜드 찾기에서 주제를 선택해주세요</span>}

              {/* 트랜드 참고 패널 */}
              {(trendTitles.length > 0 || trendSubjects.length > 0) && (
                <div className="mt-5 grid grid-cols-2 gap-4">
                  {trendTitles.length > 0 && (
                    <div className="neu-raised-sm rounded-2xl p-4">
                      <div className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-3">
                        트랜드 제목 후보 ({trendTitles.length})
                      </div>
                      <ul className="flex flex-col gap-1.5">
                        {trendTitles.map((t, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="shrink-0 text-[10px] font-black text-purple-300 mt-0.5">{i + 1}</span>
                            <span className="text-[11px] text-gray-600 leading-relaxed">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {trendSubjects.length > 0 && (
                    <div className="neu-raised-sm rounded-2xl p-4">
                      <div className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-3">
                        트랜드 주제 후보 ({trendSubjects.length})
                      </div>
                      <ul className="flex flex-col gap-1.5">
                        {trendSubjects.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="shrink-0 text-[10px] font-black text-indigo-300 mt-0.5">{i + 1}</span>
                            <span className="text-[11px] text-gray-600 leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. 장르 */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <SectionLabel label="장르" done={selGenre !== null} />
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => <NeuPill key={g} label={g} selected={selGenre === g} onClick={() => setSelGenre(p => p === g ? null : g)} />)}
              </div>
            </div>

            {/* 3. 문체 */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <SectionLabel label="문체" done={selStyle !== null} />
              <div className="flex flex-wrap gap-2">
                {STYLES.map(s => <NeuPill key={s} label={s} selected={selStyle === s} onClick={() => setSelStyle(p => p === s ? null : s)} />)}
              </div>
            </div>

            {/* 4. A·B 관계 */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <SectionLabel label="A · B 관계" done={selRelationship !== null} />
              <p className="text-[11px] text-gray-400 mb-3">두 주인공이 처음 어떤 관계로 시작하는지 선택하세요</p>
              <div className="flex flex-wrap gap-2">
                {RELATIONSHIPS.map(r => <NeuPill key={r} label={r} selected={selRelationship === r} onClick={() => setSelRelationship(p => p === r ? null : r)} />)}
              </div>
            </div>

            {/* 5. 갈등 유형 */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <SectionLabel label="갈등 유형" done={selConflictTypes.length > 0} />
              <p className="text-[11px] text-gray-400 mb-3">
                같은 사건, 두 가지 해석 — 각 행에서 하나를 선택하세요
                <span className="ml-2 text-purple-400 font-bold">최대 2개</span>
                {selConflictTypes.length > 0 && <span className="ml-2 text-gray-500">({selConflictTypes.length}/2)</span>}
              </p>
              <div className="flex flex-col gap-1.5">
                {CONFLICT_PAIRS.map(pair => {
                  const aOn = selConflictTypes.includes(pair.a);
                  const bOn = selConflictTypes.includes(pair.b);
                  return (
                    <div key={pair.a} className="flex items-center gap-2">
                      {/* A — 어두운 톤 */}
                      <button
                        onClick={() => toggleConflict(pair.a)}
                        className="flex-1 py-2 rounded-2xl text-sm font-bold transition-all text-center"
                        style={aOn ? {
                          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                          color: 'white',
                          boxShadow: '0 2px 10px rgba(124,58,237,0.3)',
                        } : {
                          background: '#faf5ff',
                          color: '#6b21a8',
                          border: '1px solid rgba(124,58,237,0.18)',
                        }}
                      >
                        {pair.a}
                      </button>

                      {/* 구분선 */}
                      <span className="text-[10px] text-gray-300 font-black shrink-0">↔</span>

                      {/* B — 밝은 톤 */}
                      <button
                        onClick={() => toggleConflict(pair.b)}
                        className="flex-1 py-2 rounded-2xl text-sm font-bold transition-all text-center"
                        style={bOn ? {
                          background: 'linear-gradient(135deg, #059669, #047857)',
                          color: 'white',
                          boxShadow: '0 2px 10px rgba(5,150,105,0.3)',
                        } : {
                          background: '#f0fdf4',
                          color: '#065f46',
                          border: '1px solid rgba(5,150,105,0.18)',
                        }}
                      >
                        {pair.b}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. 챕터 수 */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <SectionLabel label="챕터 수" done={true} required={false} />
              <div className="flex items-center gap-3">
                <button onClick={() => setChapters(c => Math.max(4, c - 1))} disabled={chapters <= 4}
                  className="neu-raised-sm neu-btn w-10 h-10 rounded-2xl flex items-center justify-center text-gray-600 font-bold text-lg disabled:opacity-40">−</button>
                <span className="neu-inset w-14 h-10 rounded-2xl flex items-center justify-center font-black text-gray-700 text-lg">{chapters}</span>
                <button onClick={() => setChapters(c => Math.min(12, c + 1))} disabled={chapters >= 12}
                  className="neu-raised-sm neu-btn w-10 h-10 rounded-2xl flex items-center justify-center text-gray-600 font-bold text-lg disabled:opacity-40">+</button>
                <span className="text-xs text-gray-400 ml-1">챕터 (4~12)</span>
                <a
                  href="/series/characters-emoline"
                  className="ml-4 neu-raised-sm neu-btn px-4 py-2 rounded-2xl text-xs font-bold text-purple-600 transition-all"
                  style={{ border: '1.5px solid rgba(124,58,237,0.25)' }}
                >
                  캐릭터 관계도 →
                </a>
              </div>
            </div>

            {/* 7. 등장인물 선택 */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <SectionLabel
                label="등장인물"
                done={selCharA !== null && charASituation !== '' && selCharB !== null && charBSituation !== ''}
              />
              <p className="text-[11px] text-gray-400 mb-1">
                각 캐릭터 카드에서
                <span className="mx-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-500 text-white text-[8px] font-black">A</span>
                또는
                <span className="mx-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-pink-500 text-white text-[8px] font-black">B</span>
                를 눌러 주연을 지정하세요
              </p>
              {(selCharA || selCharB) && (
                <div className="flex gap-3 mb-4 mt-2">
                  {selCharA && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl neu-inset text-xs font-bold text-purple-700">
                      <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-[8px] font-black flex items-center justify-center">A</span>
                      {getCharDetails(selCharA)?.name}
                    </span>
                  )}
                  {selCharB && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl neu-inset text-xs font-bold text-pink-600">
                      <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[8px] font-black flex items-center justify-center">B</span>
                      {getCharDetails(selCharB)?.name}
                    </span>
                  )}
                </div>
              )}

              {/* 캐릭터 그룹별 그리드 */}
              <div className="flex flex-col gap-5">
                {/* 주연 — 항상 펼침 */}
                {charactersData.families.map(f => (
                  <div key={f.id}>
                    <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-2">{f.name}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {f.members.map(member => (
                        <CharCard
                          key={member.id}
                          member={member as Member}
                          roleA={selCharA === member.id}
                          roleB={selCharB === member.id}
                          onSelectA={() => handleSelectA(member.id)}
                          onSelectB={() => handleSelectB(member.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* 조연 — 드롭다운 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">조연</p>
                    {supportingCast.length > 0 && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-purple-100 text-purple-600">
                        {supportingCast.length}명 등장 예정
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
                    시나리오에 등장시킬 조연을 선택하고 출현 빈도를 정하세요.
                    <span className="ml-1 text-purple-500 font-bold">&apos;주요 조연&apos;</span>은 주연으로 승격할 수 있습니다.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {charactersData.supporting.map(s => {
                      const isOpen = openSupportGroup === s.group;
                      const addedCount = s.members.filter(m => supportingCast.find(sc => sc.id === m.id)).length;
                      return (
                        <div key={s.group} className="rounded-2xl overflow-hidden"
                          style={{ border: isOpen ? '1.5px solid rgba(124,58,237,0.25)' : '1px solid #e5e7eb' }}>
                          {/* 헤더 */}
                          <button
                            onClick={() => setOpenSupportGroup(prev => prev === s.group ? null : s.group)}
                            className="w-full flex items-center justify-between px-4 py-3 transition-all"
                            style={{ background: isOpen ? '#faf5ff' : '#fafafa' }}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${isOpen ? 'text-purple-700' : 'text-gray-700'}`}>{s.group}</span>
                              <span className="text-[10px] text-gray-400">{s.members.length}명</span>
                              {addedCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-purple-100 text-purple-600">
                                  {addedCount}명 등장
                                </span>
                              )}
                            </div>
                            <span className={`text-xs text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ display: 'inline-block' }}>▼</span>
                          </button>
                          {/* 설명 + 멤버 그리드 */}
                          {isOpen && (
                            <div className="px-4 pb-4 pt-2" style={{ background: '#fdfcff' }}>
                              <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">{s.description}</p>
                              <div className="grid grid-cols-3 gap-2">
                                {s.members.map(member => (
                                  <SupportingCharCard
                                    key={member.id}
                                    member={member as Member}
                                    appearance={supportingCast.find(sc => sc.id === member.id)}
                                    onToggle={() => toggleSupportAppearance(member.id)}
                                    onSetFreq={(freq) => setSupportFreq(member.id, freq)}
                                    roleA={selCharA === member.id}
                                    roleB={selCharB === member.id}
                                    onSelectA={() => handleSelectA(member.id)}
                                    onSelectB={() => handleSelectB(member.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 상황 선택 */}
              {(selCharA || selCharB) && (
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {/* A 상황 */}
                  <div>
                    {selCharA && charADetail ? (
                      <div className="flex flex-col gap-2">
                        <div className="neu-inset rounded-xl px-3 py-2.5">
                          <p className="text-[9px] font-black text-purple-400 mb-1">
                            <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-[8px] font-black inline-flex items-center justify-center mr-1">A</span>
                            {charADetail.name} — 기본 설정
                          </p>
                          <p className="text-[9px] text-gray-500 leading-relaxed">
                            {charACoreDetail?.core?.personality ?? charADetail.personality}
                          </p>
                          <p className="text-[9px] text-gray-400 mt-0.5">
                            {charACoreDetail?.core?.speaking_style ?? charADetail.speaking_style}
                          </p>
                          {charACoreDetail?.core?.fear && (
                            <p className="text-[9px] text-red-400 mt-0.5">두려움: {charACoreDetail.core.fear}</p>
                          )}
                          {charACoreDetail?.core?.lie_to_self && (
                            <p className="text-[9px] text-amber-500 mt-0.5">자기기만: {charACoreDetail.core.lie_to_self}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-purple-600 mb-2">이번 시리즈 상황 선택</p>
                          <div className="flex flex-col gap-1.5">
                            {(charACoreDetail?.situations ?? (charADetail as Member).situations).map(sit => (
                              <button
                                key={sit}
                                onClick={() => setCharASituation(prev => prev === sit ? '' : sit)}
                                className={`w-full text-left px-3 py-2 rounded-xl text-[10px] leading-relaxed neu-btn transition-all ${
                                  charASituation === sit
                                    ? 'neu-inset text-purple-700 font-bold'
                                    : 'neu-raised-sm text-gray-600'
                                }`}
                              >
                                {sit}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="neu-inset rounded-xl px-4 py-6 flex items-center justify-center">
                        <p className="text-[11px] text-gray-300 text-center">
                          위 캐릭터 카드에서<br />
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-200 text-purple-500 text-[8px] font-black mx-1">A</span>
                          를 눌러 주연을 선택하세요
                        </p>
                      </div>
                    )}
                  </div>

                  {/* B 상황 */}
                  <div>
                    {selCharB && charBDetail ? (
                      <div className="flex flex-col gap-2">
                        <div className="neu-inset rounded-xl px-3 py-2.5">
                          <p className="text-[9px] font-black text-pink-500 mb-1">
                            <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[8px] font-black inline-flex items-center justify-center mr-1">B</span>
                            {charBDetail.name} — 기본 설정
                          </p>
                          <p className="text-[9px] text-gray-500 leading-relaxed">
                            {charBCoreDetail?.core?.personality ?? charBDetail.personality}
                          </p>
                          <p className="text-[9px] text-gray-400 mt-0.5">
                            {charBCoreDetail?.core?.speaking_style ?? charBDetail.speaking_style}
                          </p>
                          {charBCoreDetail?.core?.fear && (
                            <p className="text-[9px] text-red-400 mt-0.5">두려움: {charBCoreDetail.core.fear}</p>
                          )}
                          {charBCoreDetail?.core?.lie_to_self && (
                            <p className="text-[9px] text-amber-500 mt-0.5">자기기만: {charBCoreDetail.core.lie_to_self}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-pink-500 mb-2">이번 시리즈 상황 선택</p>
                          <div className="flex flex-col gap-1.5">
                            {(charBCoreDetail?.situations ?? (charBDetail as Member).situations).map(sit => (
                              <button
                                key={sit}
                                onClick={() => setCharBSituation(prev => prev === sit ? '' : sit)}
                                className={`w-full text-left px-3 py-2 rounded-xl text-[10px] leading-relaxed neu-btn transition-all ${
                                  charBSituation === sit
                                    ? 'neu-inset text-pink-600 font-bold'
                                    : 'neu-raised-sm text-gray-600'
                                }`}
                              >
                                {sit}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="neu-inset rounded-xl px-4 py-6 flex items-center justify-center">
                        <p className="text-[11px] text-gray-300 text-center">
                          위 캐릭터 카드에서<br />
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-pink-200 text-pink-400 text-[8px] font-black mx-1">B</span>
                          를 눌러 주연을 선택하세요
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 8. 감정선 구조 */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <div className="flex items-center justify-between mb-3">
                <SectionLabel label="감정선 구조" done={emotionLines.some(l => l.fromId && l.toId && l.type)} required={false} />
                <a
                  href="/series/characters-emoline"
                  className="neu-raised-sm neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-purple-600 transition-all"
                  style={{ border: '1.5px solid rgba(124,58,237,0.25)' }}
                >
                  캐릭터 관계도 →
                </a>
              </div>
              <p className="text-[11px] text-gray-400 mb-4">
                등장인물 간 숨겨진 감정을 설계하세요 — 같은 사건이 입장에 따라 다르게 읽힙니다
                <span className="ml-2 text-purple-400 font-bold">최대 4개</span>
              </p>

              {/* 기존 감정선 목록 */}
              <div className="flex flex-col gap-3 mb-3">
                {emotionLines.map((line, idx) => {
                  const fromMember = ALL_MEMBERS_FLAT.find(m => m.id === line.fromId);
                  const toMember   = ALL_MEMBERS_FLAT.find(m => m.id === line.toId);
                  const emotionDef = EMOTION_TYPES.find(e => e.label === line.type);
                  return (
                    <div key={line.id} className="neu-raised-sm rounded-2xl p-3">
                      {/* 헤더 */}
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase">감정선 {idx + 1}</span>
                        <button onClick={() => removeEmotionLine(line.id)}
                          className="text-[10px] text-gray-300 hover:text-red-400 transition-colors">✕ 삭제</button>
                      </div>

                      {/* FROM → TO 선택 */}
                      <div className="flex items-center gap-2 mb-3">
                        <select
                          value={line.fromId}
                          onChange={e => updateEmotionLine(line.id, { fromId: e.target.value })}
                          className="flex-1 text-xs font-bold text-gray-700 rounded-xl px-3 py-2 outline-none"
                          style={{ background: '#f0edff', border: '1px solid rgba(124,58,237,0.2)' }}
                        >
                          <option value="">인물 선택 (FROM)</option>
                          {ALL_MEMBERS_FLAT.filter(m => m.id !== line.toId).map(m => (
                            <option key={m.id} value={m.id}>{(m as Member).name} ({m.age}세)</option>
                          ))}
                        </select>

                        <span className="text-gray-300 font-black shrink-0 text-sm">→</span>

                        <select
                          value={line.toId}
                          onChange={e => updateEmotionLine(line.id, { toId: e.target.value })}
                          className="flex-1 text-xs font-bold text-gray-700 rounded-xl px-3 py-2 outline-none"
                          style={{ background: '#fdf2f8', border: '1px solid rgba(219,39,119,0.2)' }}
                        >
                          <option value="">인물 선택 (TO)</option>
                          {ALL_MEMBERS_FLAT.filter(m => m.id !== line.fromId).map(m => (
                            <option key={m.id} value={m.id}>{(m as Member).name} ({m.age}세)</option>
                          ))}
                        </select>
                      </div>

                      {/* 감정 타입 선택 */}
                      <div className="flex flex-wrap gap-1.5">
                        {EMOTION_TYPES.map(et => (
                          <button
                            key={et.label}
                            onClick={() => updateEmotionLine(line.id, { type: line.type === et.label ? '' : et.label })}
                            className="px-3 py-1 rounded-full text-[10px] font-bold transition-all"
                            style={line.type === et.label ? {
                              background: et.color,
                              color: 'white',
                              boxShadow: `0 2px 8px ${et.color}55`,
                            } : {
                              background: et.bg,
                              color: et.color,
                              border: `1px solid ${et.color}33`,
                            }}
                          >
                            {et.label}
                          </button>
                        ))}
                      </div>

                      {/* 완성된 감정선 미리보기 */}
                      {fromMember && toMember && line.type && emotionDef && (
                        <div className="mt-2.5 px-3 py-2 rounded-xl flex items-center gap-2"
                          style={{ background: emotionDef.bg, border: `1px solid ${emotionDef.color}22` }}>
                          <span className="text-xs font-black text-gray-700">{(fromMember as Member).name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: emotionDef.color, color: 'white' }}>
                            {line.type}
                          </span>
                          <span className="text-[10px] text-gray-400">→</span>
                          <span className="text-xs font-black text-gray-700">{(toMember as Member).name}</span>
                          <span className="text-[9px] text-gray-400 ml-auto">
                            {(fromMember as Member).age}세 → {(toMember as Member).age}세
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 추가 버튼 */}
              {emotionLines.length < EMOTION_LINE_MAX && (
                <button onClick={addEmotionLine}
                  className="w-full py-2.5 rounded-2xl text-xs font-bold text-purple-500 transition-all neu-btn neu-raised-sm"
                  style={{ borderStyle: 'dashed', border: '1.5px dashed rgba(124,58,237,0.3)' }}>
                  + 감정선 추가 ({emotionLines.length}/{EMOTION_LINE_MAX})
                </button>
              )}
            </div>

            {/* 9. 정보 구조 */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <SectionLabel label="정보 구조" done={!!(charAGoal && charBGoal)} required={false} />
              <p className="text-[11px] text-gray-400 mb-5 leading-relaxed">
                누가 무엇을 알고 모르는지, 각자 무엇을 원하는지 설계하세요.<br />
                <span className="text-purple-500 font-bold">정보 비대칭</span>은 모든 대화를 이중 의미로 만들고,
                <span className="text-purple-500 font-bold"> 목표 충돌</span>은 사랑할수록 파괴하는 구조를 만듭니다.
              </p>

              {/* 정보 비대칭 */}
              <div className="mb-5">
                <p className="text-[10px] font-black text-gray-500 tracking-widest uppercase mb-3">🔒 정보 비대칭</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* A가 모르는 것 */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-[8px] font-black flex items-center justify-center">A</span>
                      <span className="text-[10px] font-bold text-purple-600">
                        {(charADetail as Member | null)?.name ?? 'A'} 가 모르는 사실
                      </span>
                      <span className="text-[9px] text-gray-300 ml-1">(B는 알고 있음)</span>
                    </div>
                    <textarea
                      value={charASecret}
                      onChange={e => setCharASecret(e.target.value)}
                      placeholder="예) 이수진이 이민준과 과거 연인이었다는 사실을 박준혁은 모른다. 이수진은 박준혁이 이미 알고 있다고 착각한다."
                      rows={4}
                      className="w-full text-[10px] leading-relaxed text-gray-700 rounded-xl px-3 py-2.5 outline-none resize-none placeholder:text-gray-200"
                      style={{ background: '#f5f3ff', border: '1px solid rgba(124,58,237,0.2)' }}
                    />
                  </div>
                  {/* B가 모르는 것 */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[8px] font-black flex items-center justify-center">B</span>
                      <span className="text-[10px] font-bold text-pink-600">
                        {(charBDetail as Member | null)?.name ?? 'B'} 가 모르는 사실
                      </span>
                      <span className="text-[9px] text-gray-300 ml-1">(A는 알고 있음)</span>
                    </div>
                    <textarea
                      value={charBSecret}
                      onChange={e => setCharBSecret(e.target.value)}
                      placeholder="예) 김태호가 사실 이 동네로 이사 온 것이 우연이 아님을 이수진은 모른다."
                      rows={4}
                      className="w-full text-[10px] leading-relaxed text-gray-700 rounded-xl px-3 py-2.5 outline-none resize-none placeholder:text-gray-200"
                      style={{ background: '#fdf2f8', border: '1px solid rgba(219,39,119,0.2)' }}
                    />
                  </div>
                </div>
              </div>

              {/* 목표 충돌 */}
              <div>
                <p className="text-[10px] font-black text-gray-500 tracking-widest uppercase mb-3">🎯 이 시리즈에서의 목표</p>
                <p className="text-[10px] text-gray-400 mb-3">두 목표가 서로를 방해할수록 긴장감이 올라갑니다</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* A 목표 */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-[8px] font-black flex items-center justify-center">A</span>
                      <span className="text-[10px] font-bold text-purple-600">
                        {(charADetail as Member | null)?.name ?? 'A'} 의 목표
                      </span>
                    </div>
                    <textarea
                      value={charAGoal}
                      onChange={e => setCharAGoal(e.target.value)}
                      placeholder="예) 지금 이 안정된 일상을 유지하며 아무것도 바꾸지 않는 것. 모든 비밀이 그대로 묻히길 바란다."
                      rows={3}
                      className="w-full text-[10px] leading-relaxed text-gray-700 rounded-xl px-3 py-2.5 outline-none resize-none placeholder:text-gray-200"
                      style={{ background: '#f5f3ff', border: '1px solid rgba(124,58,237,0.2)' }}
                    />
                  </div>
                  {/* B 목표 */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[8px] font-black flex items-center justify-center">B</span>
                      <span className="text-[10px] font-bold text-pink-600">
                        {(charBDetail as Member | null)?.name ?? 'B'} 의 목표
                      </span>
                    </div>
                    <textarea
                      value={charBGoal}
                      onChange={e => setCharBGoal(e.target.value)}
                      placeholder="예) 이 관계를 통해 완전히 다른 삶으로 도약하는 것. A를 사랑할수록 A가 원하는 현상 유지가 깨진다."
                      rows={3}
                      className="w-full text-[10px] leading-relaxed text-gray-700 rounded-xl px-3 py-2.5 outline-none resize-none placeholder:text-gray-200"
                      style={{ background: '#fdf2f8', border: '1px solid rgba(219,39,119,0.2)' }}
                    />
                  </div>
                </div>

                {/* 충돌 미리보기 */}
                {charAGoal && charBGoal && (
                  <div className="mt-3 px-4 py-3 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, #faf5ff, #fdf2f8)', border: '1px solid rgba(124,58,237,0.15)' }}>
                    <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-2">목표 충돌 구조</p>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 text-[10px] text-gray-600 leading-relaxed">{charAGoal}</div>
                      <span className="text-gray-300 font-black mt-1 shrink-0">⚡</span>
                      <div className="flex-1 text-[10px] text-gray-600 leading-relaxed">{charBGoal}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 미완성 항목 안내 */}
            {!canProceed && (
              <div className="py-6">
                <div className="neu-inset rounded-2xl px-4 py-3">
                  <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-2">아직 설정이 필요한 항목</p>
                  <div className="flex flex-wrap gap-2">
                    {steps.filter(s => !s.done).map(s => (
                      <span key={s.label} className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-red-400 bg-red-50">
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* 하단 페이지 번호 */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between"
            style={{ padding: `0 ${PAD_H}px 32px`, color: '#c4c8ce', fontSize: 10 }}>
            <span>세계관 설정</span>
            <span>1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SeriesWorldPage() {
  return (
    <Suspense>
      <SeriesWorldInner />
    </Suspense>
  );
}
