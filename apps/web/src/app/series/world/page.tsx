'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const A4_W = 794;
const A4_H = 1123;
const PAD_H = 72;
const PAD_V = 60;

// TODO: Claude API 호출로 교체 — 트랜드 키워드 기반 제목/주제/등장인물 자동 생성
function buildMockFromTopic(topic: string) {
  return {
    titles: [
      `${topic}의 민낯`,
      `${topic} — 두 사람의 이야기`,
      `무너지는 ${topic}`,
    ],
    subjects: [
      `${topic}의 구조적 원인과 피해 실태`,
      `${topic} 속 개인의 선택과 고통`,
      `시스템이 외면한 ${topic}의 진실`,
    ],
    keywords: topic.split(' ').slice(0, 3),
    charA: [
      { label: '30대 직장인', sub: `${topic}의 최전선에서 생존을 위해 싸우는 가장` },
      { label: '40대 자영업자', sub: `${topic}로 인해 사업 기반이 무너지는 현실` },
      { label: '50대 관리자', sub: `조직 내부에서 ${topic}의 실체를 목격한 내부자` },
      { label: '60대 은퇴자', sub: `평생 모은 자산이 ${topic}에 잠식당하는 노년` },
    ],
    charB: [
      { label: '30대 직장인', sub: `${topic} 피해의 구조 속에서 선택을 강요받는 여성` },
      { label: '40대 주부', sub: `가족을 지키려다 ${topic}의 덫에 걸린 어머니` },
      { label: '30대 전문직', sub: `${topic}의 공범으로 몰리며 삶이 무너지는 전문가` },
      { label: '50대 공무원', sub: `${topic}를 막으려다 시스템과 충돌한 내부고발자` },
    ],
  };
}

const GENRES = ['액션', '드라마/멜로', '코메디', '가족', 'SF/판타지', '공포/호러', '범죄/스릴러', '다큐'];
const STYLES = ['내레이션(3인칭)', '혼합형', '드라마형'];

const LABEL = 'text-[10px] font-black text-gray-400 tracking-[0.15em] uppercase mb-3 block';

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

function Spinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <span className="w-3.5 h-3.5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
      Claude 분석 중...
    </div>
  );
}

function SeriesWorldInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [topic, setTopic] = useState('');

  // Claude 생성 결과
  const [genLoading, setGenLoading] = useState(false);
  const [titleOptions, setTitleOptions] = useState<string[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [charAOptions, setCharAOptions] = useState<{ label: string; sub: string }[]>([]);
  const [charBOptions, setCharBOptions] = useState<{ label: string; sub: string }[]>([]);

  const [selTitle, setSelTitle] = useState<string | null>(null);
  const [selSubject, setSelSubject] = useState<string | null>(null);
  const [outline, setOutline] = useState('');
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [selGenre, setSelGenre] = useState<string | null>(null);
  const [selStyle, setSelStyle] = useState<string | null>(null);
  const [chapters, setChapters] = useState(6);
  const [selCharA, setSelCharA] = useState<string | null>(null);
  const [selCharB, setSelCharB] = useState<string | null>(null);

  // URL 파라미터에서 topic 수신
  useEffect(() => {
    const t = searchParams.get('topic');
    if (t) setTopic(t);
  }, [searchParams]);

  // topic 도착 시 Claude로 제목/주제/등장인물 자동 생성
  useEffect(() => {
    if (!topic) return;
    setGenLoading(true);
    setTitleOptions([]); setSubjectOptions([]);
    setCharAOptions([]); setCharBOptions([]);
    setSelTitle(null); setSelSubject(null);
    setSelCharA(null); setSelCharB(null);

    const timer = setTimeout(() => {
      // TODO: Claude API 호출 — POST /api/series/generate { topic }
      const mock = buildMockFromTopic(topic);
      setTitleOptions(mock.titles);
      setSubjectOptions(mock.subjects);
      setCharAOptions(mock.charA);
      setCharBOptions(mock.charB);
      setGenLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [topic]);

  // 제목 + 주제 선택 시 개요 자동 생성
  useEffect(() => {
    if (!selTitle || !selSubject) { setOutline(''); return; }
    setOutlineLoading(true);
    setOutline('');

    const timer = setTimeout(() => {
      // TODO: Claude API 호출
      setOutline(
        `"${selTitle}"은 ${selSubject}를 두 인물의 시각으로 추적하는 팩트기반 시리즈입니다. ` +
        `등장인물 A(남성)는 시스템 붕괴의 최전선에서 생존을 위해 싸우고, ` +
        `등장인물 B(여성)는 구조적 모순 속에서 자신의 선택을 강요받습니다. ` +
        `두 사람의 교차 서사는 사건의 실체와 인간의 고통을 동시에 드러내며, ` +
        `"이건 남의 이야기가 아니다"라는 감각을 시청자에게 전달합니다.`
      );
      setOutlineLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [selTitle, selSubject]);

  const canProceed = selTitle !== null && selSubject !== null && selGenre !== null
    && selCharA !== null && selCharB !== null;

  return (
    <div className="neu-bg min-h-screen flex flex-col">

      {/* 상단 툴바 */}
      <div
        className="sticky top-[52px] z-50 border-b border-[#b8bcc2]"
        style={{ background: 'linear-gradient(145deg, #e6e9ef, #d1d5db)', boxShadow: '0 4px 12px rgba(184,188,194,0.4)' }}
      >
        <div
          className="flex items-center justify-between"
          style={{ width: A4_W, margin: '0 auto', paddingLeft: 8, paddingRight: 8, minHeight: 44 }}
        >
          <span className="text-sm font-black text-gray-700 px-2">세계관 설정</span>
          <button
            disabled={!canProceed}
            onClick={() => router.push('/series/script')}
            className="neu-primary-btn neu-btn px-4 py-1.5 rounded-xl text-xs font-bold disabled:opacity-30"
          >
            대본 만들기로 →
          </button>
        </div>
      </div>

      {/* A4 용지 */}
      <div className="flex-1 flex justify-center py-10">
        <div
          className="relative neu-raised"
          style={{ width: A4_W, minHeight: A4_H, borderRadius: 2 }}
        >
          <div style={{ padding: `${PAD_V}px ${PAD_H}px`, paddingBottom: PAD_V * 2 }}>

            {/* 1. TOPIC */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <span className={LABEL}>topic</span>
              {topic ? (
                <span className="neu-inset px-4 py-2 rounded-2xl text-sm font-bold text-purple-700 inline-block">
                  {topic}
                </span>
              ) : (
                <span className="text-sm text-gray-400">트랜드 찾기에서 주제를 선택해주세요</span>
              )}
            </div>

            {/* 2. 제목 */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <span className={LABEL}>제목</span>
              {genLoading ? <Spinner /> : titleOptions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {titleOptions.map(t => (
                    <NeuPill key={t} label={t} selected={selTitle === t}
                      onClick={() => setSelTitle(prev => prev === t ? null : t)} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-300">트랜드 주제를 선택하면 자동 생성됩니다</p>
              )}
            </div>

            {/* 3. 주제 */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <span className={LABEL}>주제</span>
              {genLoading ? <Spinner /> : subjectOptions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {subjectOptions.map(s => (
                    <NeuPill key={s} label={s} selected={selSubject === s}
                      onClick={() => setSelSubject(prev => prev === s ? null : s)} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-300">트랜드 주제를 선택하면 자동 생성됩니다</p>
              )}
            </div>

            {/* 4. 개요 */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <span className={LABEL}>개요</span>
              <div className="neu-inset rounded-2xl px-5 py-4 min-h-[80px] flex items-center">
                {outlineLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="w-3.5 h-3.5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                    세계관을 분석하는 중...
                  </div>
                ) : outline ? (
                  <p className="text-sm text-gray-700 leading-relaxed">{outline}</p>
                ) : (
                  <p className="text-sm text-gray-300">제목과 주제를 선택하면 자동 생성됩니다</p>
                )}
              </div>
            </div>

            {/* 5. 장르 */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <span className={LABEL}>장르</span>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => (
                  <NeuPill key={g} label={g} selected={selGenre === g}
                    onClick={() => setSelGenre(prev => prev === g ? null : g)} />
                ))}
              </div>
            </div>

            {/* 6. 문체 */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <span className={LABEL}>문체</span>
              <div className="flex flex-wrap gap-2">
                {STYLES.map(s => (
                  <NeuPill key={s} label={s} selected={selStyle === s}
                    onClick={() => setSelStyle(prev => prev === s ? null : s)} />
                ))}
              </div>
            </div>

            {/* 7. 챕터 수 */}
            <div style={{ borderBottom: '1.5px solid #d1d5db' }} className="py-6">
              <span className={LABEL}>챕터 수</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setChapters(c => Math.max(4, c - 1))}
                  disabled={chapters <= 4}
                  className="neu-raised-sm neu-btn w-10 h-10 rounded-2xl flex items-center justify-center text-gray-600 font-bold text-lg disabled:opacity-40"
                >−</button>
                <span className="neu-inset w-14 h-10 rounded-2xl flex items-center justify-center font-black text-gray-700 text-lg">
                  {chapters}
                </span>
                <button
                  onClick={() => setChapters(c => Math.min(12, c + 1))}
                  disabled={chapters >= 12}
                  className="neu-raised-sm neu-btn w-10 h-10 rounded-2xl flex items-center justify-center text-gray-600 font-bold text-lg disabled:opacity-40"
                >+</button>
                <span className="text-xs text-gray-400 ml-1">챕터 (4~12)</span>
              </div>
            </div>

            {/* 8. 등장인물 */}
            <div className="py-6">
              <span className={LABEL}>등장인물</span>
              <p className="text-[11px] text-gray-400 mb-4">
                두 인물의 교차 서사 — 트랜드한 팩트를 인간의 고통으로 연결합니다
              </p>
              {genLoading ? (
                <Spinner />
              ) : charAOptions.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* 등장인물 A */}
                  <div className="neu-inset rounded-2xl p-4">
                    <div className="mb-3">
                      <span className="text-xs font-black text-purple-600">등장인물 A</span>
                      <span className="text-[10px] text-gray-400 ml-2">남성</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {charAOptions.map(opt => (
                        <button
                          key={opt.label}
                          onClick={() => setSelCharA(prev => prev === opt.label ? null : opt.label)}
                          className={`w-full text-left neu-btn px-3 py-3 rounded-xl transition-all ${
                            selCharA === opt.label ? 'neu-inset text-purple-700' : 'neu-raised-sm text-gray-600'
                          }`}
                        >
                          <span className="text-xs font-bold block">{opt.label}</span>
                          <span className="text-[10px] text-gray-400 mt-0.5 block leading-relaxed">{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 등장인물 B */}
                  <div className="neu-inset rounded-2xl p-4">
                    <div className="mb-3">
                      <span className="text-xs font-black text-purple-600">등장인물 B</span>
                      <span className="text-[10px] text-gray-400 ml-2">여성</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {charBOptions.map(opt => (
                        <button
                          key={opt.label}
                          onClick={() => setSelCharB(prev => prev === opt.label ? null : opt.label)}
                          className={`w-full text-left neu-btn px-3 py-3 rounded-xl transition-all ${
                            selCharB === opt.label ? 'neu-inset text-purple-700' : 'neu-raised-sm text-gray-600'
                          }`}
                        >
                          <span className="text-xs font-bold block">{opt.label}</span>
                          <span className="text-[10px] text-gray-400 mt-0.5 block leading-relaxed">{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-300">트랜드 주제를 선택하면 자동 생성됩니다</p>
              )}
            </div>

          </div>

          {/* 페이지 하단 번호 */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between"
            style={{ padding: `0 ${PAD_H}px 32px`, color: '#c4c8ce', fontSize: 10 }}
          >
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
