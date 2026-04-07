'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import charIndex from '@/data/characters/_index.json';

const GOOGLE_API_KEY_STORAGE = 'ld_google_api_key';

/* ── 캐릭터 타입 ── */
interface CharIndexEntry {
  id: string;
  name: string;
  gender: string;
  age: number;
  age_group: string;
  occupation: string;
  family_group: string;
  role: string;
}
interface CharCore {
  public_face?: string;
  shadow?: string;
  personality: string;
  speaking_style: string;
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

/* ── 시놉시스 타입 ── */
interface SynopsisCard {
  title: string;
  logline: string;
  charA_summary: string;
  charB_summary: string;
  conflict_summary: string;
  genre: string;
  mood: string;
}
const MOOD_MAP: Record<string, { color: string; bg: string }> = {
  '긴장': { color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
  '갈등': { color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
  '로맨스': { color: '#db2777', bg: 'rgba(219,39,119,0.12)' },
  '복수': { color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  '배신': { color: '#1d4ed8', bg: 'rgba(29,78,216,0.12)' },
};
function getMood(mood: string) {
  for (const [k, v] of Object.entries(MOOD_MAP)) {
    if (mood.includes(k)) return v;
  }
  return { color: '#6b7280', bg: 'rgba(107,114,128,0.12)' };
}

/* ── 트랜드 타입 ── */
interface TrendCard {
  keyword: string;
  sources: string[];
}
interface TrendsResponse {
  keywords: TrendCard[];
  collected_at: string | null;
  source_status: Record<string, string>;
  age_hours: number | null;
}

/* ── 뉴스 타입 ── */
interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}
interface NewsData {
  economy: NewsItem[];
  society: NewsItem[];
  fetched_at: string;
}

/* ── 바이럴 타입 ── */
interface RisingKeyword {
  keyword: string;
  source: string;
}
interface ViralVideo {
  video_id: string;
  title: string;
  channel_title: string;
  query: string;
  views: number;
  subscribers: number;
  viral_score: number;
  url: string;
}
interface Concept {
  concept: string;
  count: number;
  examples: string[];
}
interface ViralData {
  rising_keywords: RisingKeyword[];
  viral_videos: ViralVideo[];
  concepts: Concept[];
  collected_at: string | null;
  age_hours: number | null;
  source_status: Record<string, string>;
}

/* ── 유틸 ── */
function formatViralScore(score: number): string {
  if (score >= 100) return `${Math.round(score)}x`;
  if (score >= 10)  return `${score.toFixed(1)}x`;
  return `${score.toFixed(2)}x`;
}

function formatViews(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}천만`;
  if (n >= 10000)    return `${Math.round(n / 10000)}만`;
  if (n >= 1000)     return `${(n / 1000).toFixed(1)}천`;
  return String(n);
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 50 ? 'bg-red-500' : score >= 20 ? 'bg-orange-400' : score >= 10 ? 'bg-yellow-400' : 'bg-gray-300';
  const textColor = score >= 10 ? 'text-white' : 'text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black ${color} ${textColor}`}>
      {formatViralScore(score)}
    </span>
  );
}

type TabKey = 'trend' | 'viral' | 'keywords' | 'concepts' | 'news' | 'synopsis';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'trend',    label: '트랜드' },
  { key: 'viral',    label: '바이럴 영상' },
  { key: 'keywords', label: '급상승 검색어' },
  { key: 'concepts', label: '컨셉 패턴 분석' },
  { key: 'news',     label: '이시각 최신뉴스' },
  { key: 'synopsis', label: '시놉시스' },
];

export default function TrendPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('trend');

  /* ── 시놉시스 상태 ── */
  const [synopsisKeyword, setSynopsisKeyword] = useState('');
  const [synopses, setSynopses] = useState<SynopsisCard[]>([]);
  const [synopsisLoading, setSynopsisLoading] = useState(false);
  const [synopsisSelected, setSynopsisSelected] = useState<number | null>(null);
  const [worldLoading, setWorldLoading] = useState(false);
  const [synopsisError, setSynopsisError] = useState('');

  /* ── 캐릭터 선택 상태 ── */
  const allChars = (charIndex as { characters: CharIndexEntry[] }).characters;
  const maleChars = allChars.filter(c => c.gender === 'male');
  const femaleChars = allChars.filter(c => c.gender === 'female');
  const [selCharA, setSelCharA] = useState<string | null>(null);
  const [selCharB, setSelCharB] = useState<string | null>(null);
  const [charACoreDetail, setCharACoreDetail] = useState<CharDetailFile | null>(null);
  const [charBCoreDetail, setCharBCoreDetail] = useState<CharDetailFile | null>(null);

  const loadCharDetail = async (id: string): Promise<CharDetailFile | null> => {
    try {
      const mod = await import(`@/data/characters/${id}.json`);
      return mod.default as CharDetailFile;
    } catch { return null; }
  };

  useEffect(() => {
    if (selCharA) loadCharDetail(selCharA).then(d => setCharACoreDetail(d));
    else setCharACoreDetail(null);
  }, [selCharA]);

  useEffect(() => {
    if (selCharB) loadCharDetail(selCharB).then(d => setCharBCoreDetail(d));
    else setCharBCoreDetail(null);
  }, [selCharB]);

  function handleKeywordToSynopsis(keyword: string) {
    setSynopsisKeyword(keyword);
    setSynopses([]);
    setSynopsisSelected(null);
    setSynopsisError('');
    setActiveTab('synopsis');
  }

  async function handleGenerateSynopsis() {
    const apiKey = localStorage.getItem(GOOGLE_API_KEY_STORAGE) ?? '';
    if (!apiKey) { setSynopsisError('GOOGLE_API_KEY가 없습니다. 설정(⚙)에서 입력하세요.'); return; }
    if (!synopsisKeyword.trim()) { setSynopsisError('키워드를 입력하세요.'); return; }
    setSynopsisError(''); setSynopsisLoading(true); setSynopses([]); setSynopsisSelected(null);
    try {
      // 선택된 캐릭터의 shadow/fear를 프로필로 구성
      const buildProfile = (id: string | null, detail: CharDetailFile | null) => {
        if (!id) return null;
        const entry = allChars.find(c => c.id === id);
        if (!entry) return null;
        return { id, name: entry.name, occupation: entry.occupation, core: detail?.core ?? {} };
      };
      const res = await fetch('/api/series/synopsis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: synopsisKeyword.trim(),
          api_key: apiKey,
          charA_profile: buildProfile(selCharA, charACoreDetail),
          charB_profile: buildProfile(selCharB, charBCoreDetail),
        }),
      });
      if (!res.ok) {
        let detail = '생성 실패';
        try { detail = (await res.json()).detail ?? detail; } catch {}
        throw new Error(detail);
      }
      const data = await res.json();
      setSynopses(data.synopses ?? []);
    } catch (e) { setSynopsisError(String(e)); }
    finally { setSynopsisLoading(false); }
  }

  async function handleSelectSynopsis(idx: number) {
    const apiKey = localStorage.getItem(GOOGLE_API_KEY_STORAGE) ?? '';
    if (!apiKey) { setSynopsisError('GOOGLE_API_KEY가 없습니다.'); return; }
    setSynopsisSelected(idx); setWorldLoading(true); setSynopsisError('');
    try {
      const res = await fetch('/api/series/expand-world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          synopsis: synopses[idx],
          keyword: synopsisKeyword.trim(),
          api_key: apiKey,
          pre_selected_charA: selCharA ?? undefined,
          pre_selected_charB: selCharB ?? undefined,
        }),
      });
      if (!res.ok) {
        let detail = '세계관 생성 실패';
        try { detail = (await res.json()).detail ?? detail; } catch {}
        throw new Error(detail);
      }
      const world = await res.json();
      // 시리즈 고유 ID 생성 — 이후 모든 챕터 대본 저장의 기준 키
      const seriesId = `series_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      world.seriesId = seriesId;
      sessionStorage.removeItem('series_world_draft');
      sessionStorage.setItem('series_world', JSON.stringify(world));
      router.push('/series/script');
    } catch (e) { setSynopsisError(String(e)); setSynopsisSelected(null); }
    finally { setWorldLoading(false); }
  }

  /* ── 트랜드 상태 ── */
  const [trendLoading, setTrendLoading]     = useState(true);
  const [trendCollecting, setTrendCollecting] = useState(false);
  const [trendCards, setTrendCards]         = useState<TrendCard[]>([]);
  const [trendAge, setTrendAge]             = useState<number | null>(null);
  const [trendStatus, setTrendStatus]       = useState<Record<string, string>>({});
  const [trendError, setTrendError]         = useState<string | null>(null);

  /* ── 뉴스 상태 ── */
  const [newsData, setNewsData]     = useState<NewsData | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);

  const loadNews = async () => {
    setNewsLoading(true);
    try {
      const res = await fetch('/api/series/news');
      if (res.ok) setNewsData(await res.json());
    } catch { /* ignore */ } finally {
      setNewsLoading(false);
    }
  };

  /* ── 바이럴 상태 ── */
  const [viralData, setViralData]           = useState<ViralData | null>(null);
  const [viralLoading, setViralLoading]     = useState(true);
  const [viralCollecting, setViralCollecting] = useState(false);
  const [viralError, setViralError]         = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo]   = useState<ViralVideo | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCollectedAt = useRef<string | null>(null);

  /* ── 트랜드 로드 ── */
  async function loadLatestTrends() {
    setTrendLoading(true);
    setTrendError(null);
    try {
      const res = await fetch('/api/series/latest-trends');
      const data: TrendsResponse = await res.json();
      if (data.keywords?.length) {
        setTrendCards(data.keywords);
        setTrendAge(data.age_hours);
        setTrendStatus(data.source_status ?? {});
      } else {
        setTrendCards([]);
      }
    } catch {
      setTrendError('트랜드 조회 중 오류가 발생했습니다');
    } finally {
      setTrendLoading(false);
    }
  }

  async function handleTrendCollect() {
    setTrendCollecting(true);
    setTrendError(null);
    try {
      const res = await fetch('/api/series/cron-trends', { headers: {} });
      if (!res.ok) {
        const body = await res.json();
        setTrendError(body.error ?? '수집 실패');
        return;
      }
      await loadLatestTrends();
    } catch {
      setTrendError('수집 요청 중 오류가 발생했습니다');
    } finally {
      setTrendCollecting(false);
    }
  }

  /* ── 바이럴 로드 ── */
  const fetchLatestViral = async (): Promise<ViralData | null> => {
    try {
      const res = await fetch('/api/series/viral-concepts/latest');
      if (!res.ok) return null;
      return await res.json() as ViralData;
    } catch {
      return null;
    }
  };

  async function handleViralCollect() {
    setViralError(null);
    setViralCollecting(true);
    prevCollectedAt.current = viralData?.collected_at ?? null;

    fetch('/api/series/viral-concepts/collect').catch(() => {});

    pollRef.current = setInterval(async () => {
      const d = await fetchLatestViral();
      if (d && d.collected_at && d.collected_at !== prevCollectedAt.current) {
        setViralData(d);
        setViralCollecting(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);

    setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      setViralCollecting(false);
      setViralError('수집 시간이 초과되었습니다. 다시 시도해 주세요.');
    }, 90000);
  }

  // 뉴스 탭 활성화 시 자동 로드
  useEffect(() => {
    if (activeTab === 'news' && !newsData && !newsLoading) loadNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  /* ── 초기 로드 ── */
  useEffect(() => {
    loadLatestTrends();
    fetchLatestViral().then(d => {
      if (d) {
        setViralData(d);
        prevCollectedAt.current = d.collected_at;
      }
      setViralLoading(false);
    });
  }, []);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  /* ── 탭별 카운트 배지 ── */
  const newsTotal = newsData ? newsData.economy.length + newsData.society.length : undefined;
  const tabCount: Partial<Record<TabKey, number>> = {
    trend:    trendCards.length || undefined,
    viral:    viralData?.viral_videos.length || undefined,
    keywords: viralData?.rising_keywords.length || undefined,
    concepts: viralData?.concepts.length || undefined,
    news:     newsTotal,
  };

  /* ── 탭별 수집 버튼 ── */
  const isTrendTab   = activeTab === 'trend';
  const isViralGroup = activeTab === 'viral' || activeTab === 'keywords' || activeTab === 'concepts';

  const PAPER_W = 920; // 트랜드 탭
  const VIRAL_W = 1160; // 바이럴 영상 탭 (4열)

  return (
    <div className="min-h-screen relative overflow-hidden -mt-[52px]"
      style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 40%, #f0fdf4 100%)' }}>

      {/* 배경 블롭 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full lg-blob lg-blob-light-1" style={{ opacity: 0.6 }} />
        <div className="absolute rounded-full lg-blob lg-blob-light-2" style={{ opacity: 0.5 }} />
        <div className="absolute rounded-full lg-blob lg-blob-light-3" style={{ opacity: 0.4 }} />
      </div>

      {/* ── 세계관 생성 중 오버레이 ── */}
      {worldLoading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center"
          style={{ zIndex: 9999, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)' }}>
          <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
            {/* 외부 회전 링 */}
            <svg className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }} viewBox="0 0 180 180" fill="none">
              <circle cx="90" cy="90" r="80" stroke="rgba(124,58,237,0.12)" strokeWidth="8" />
              <circle cx="90" cy="90" r="80"
                stroke="url(#worldGrad)" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="220 282"
                strokeDashoffset="0"
              />
              <defs>
                <linearGradient id="worldGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
            {/* 내부 느린 역방향 링 */}
            <svg className="absolute inset-0 animate-spin" style={{ width: 130, height: 130, top: 25, left: 25, animationDuration: '3s', animationDirection: 'reverse' }} viewBox="0 0 130 130" fill="none">
              <circle cx="65" cy="65" r="55" stroke="rgba(167,139,250,0.15)" strokeWidth="5" />
              <circle cx="65" cy="65" r="55"
                stroke="#c4b5fd" strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="80 265"
              />
            </svg>
            {/* 중앙 아이콘 */}
            <div className="relative flex flex-col items-center gap-1">
              <span style={{ fontSize: 32 }}>✦</span>
            </div>
          </div>
          <p className="mt-6 text-base font-bold text-gray-700">세계관 생성 중</p>
          <p className="mt-1 text-xs text-gray-400">캐릭터와 이야기 구조를 설계하고 있습니다</p>
        </div>
      )}

      {/* ── 툴바 ── */}
      <div className="sticky top-[52px] z-40 border-b"
        style={{
          background: 'rgba(255,255,255,0.80)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(15,23,42,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}>

        <div className="flex items-center justify-between px-6" style={{ minHeight: 44 }}>
          <div className="flex items-center gap-4">
            {/* 페이지 타이틀 */}
            <div className="flex items-center gap-2 shrink-0">
              <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, letterSpacing: '0.06em' }}>01</span>
              <span className="text-sm font-bold text-gray-700">트랜드 찾기</span>
            </div>
            <div className="w-px h-4 bg-gray-200 shrink-0" />
            {trendAge !== null && (
              <span className="text-[10px] text-gray-400">
                트랜드: {trendAge === 0 ? '방금 수집' : `${trendAge}시간 전`}
                {Object.entries(trendStatus).map(([src, st]) => (
                  <span key={src} className={`ml-1.5 font-bold ${st === 'ok' ? 'text-green-500' : 'text-red-400'}`}>
                    ● {src === 'youtube' ? 'YT' : 'NV'}
                  </span>
                ))}
              </span>
            )}
            {viralData?.collected_at && (
              <span className="text-[10px] text-gray-400">
                바이럴: {viralData.age_hours !== null && viralData.age_hours < 1
                  ? '방금 수집'
                  : viralData.age_hours !== null ? `${viralData.age_hours}시간 전` : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isTrendTab && (
              <button
                onClick={handleTrendCollect}
                disabled={trendCollecting || trendLoading}
                className="relative overflow-hidden px-4 py-1.5 rounded-xl text-xs font-bold text-purple-700 transition-all disabled:opacity-40"
                style={{
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {trendCollecting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                    수집 중...
                  </span>
                ) : '트랜드 수집'}
              </button>
            )}
            {isViralGroup && (
              <button
                onClick={handleViralCollect}
                disabled={viralCollecting}
                className="relative overflow-hidden px-4 py-1.5 rounded-xl text-xs font-bold text-purple-700 transition-all disabled:opacity-40"
                style={{
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {viralCollecting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                    수집 중...
                  </span>
                ) : '바이럴 수집'}
              </button>
            )}
          </div>
        </div>

        {/* 탭 — Neuromorphic Stepper */}
        <div className="flex items-center justify-center px-6 py-4" style={{ borderTop: '1px solid rgba(15,23,42,0.06)', background: '#e8eaf0' }}>
          <div className="flex items-center">
            {TABS.map((tab, idx) => {
              const isActive = activeTab === tab.key;
              const isLast = idx === TABS.length - 1;
              return (
                <div key={tab.key} className="flex items-center">
                  {/* 스텝 버튼 */}
                  <button
                    onClick={() => setActiveTab(tab.key)}
                    className="flex flex-col items-center gap-1.5 transition-all"
                    style={{ minWidth: 60 }}
                  >
                    <div
                      style={isActive ? {
                        width: 36, height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        boxShadow: '4px 4px 10px #b8bcc2, -4px -4px 10px #ffffff, 0 0 0 3px rgba(124,58,237,0.18)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 13, fontWeight: 800,
                        transition: 'all 0.2s',
                      } : {
                        width: 36, height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(145deg, #eef0f5, #e0e3ea)',
                        boxShadow: '4px 4px 8px #c0c3cb, -4px -4px 8px #ffffff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#9ca3af', fontSize: 13, fontWeight: 700,
                        transition: 'all 0.2s',
                      }}
                    >
                      {tabCount[tab.key] ? (
                        <span style={{ fontSize: 10, fontWeight: 900 }}>{tabCount[tab.key]}</span>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: isActive ? 800 : 600,
                      color: isActive ? '#7c3aed' : '#9ca3af',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}>
                      {tab.label}
                    </span>
                  </button>

                  {/* 연결선 */}
                  {!isLast && (
                    <div style={{
                      width: 32, height: 3, margin: '0 4px', marginBottom: 18, borderRadius: 99,
                      background: isActive
                        ? 'linear-gradient(90deg, #7c3aed, #a78bfa)'
                        : 'linear-gradient(145deg, #d0d3da, #e8eaf0)',
                      boxShadow: isActive
                        ? 'none'
                        : 'inset 2px 2px 4px #c0c3cb, inset -2px -2px 4px #ffffff',
                      transition: 'all 0.2s',
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div className="relative pt-4 pb-10 px-4" style={{ zIndex: 1 }}>

        {/* ── 트랜드 탭 ── */}
        {activeTab === 'trend' && (
          <div style={{ width: PAPER_W, margin: '0 auto' }}>
            <div className="rounded-sm"
              style={{
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid rgba(15,23,42,0.06)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.08), inset 0 1px 0 #fff',
                minHeight: 400,
                padding: '40px 64px 56px',
              }}>
              {/* 페이지 헤더 */}
              <div className="flex items-baseline gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <span className="text-[11px] font-black text-purple-400 tracking-widest uppercase">Trend Keywords</span>
                {trendCards.length > 0 && (
                  <span className="text-[11px] text-gray-300">{trendCards.length}개 키워드</span>
                )}
              </div>

              {trendLoading && (
                <div className="flex items-center justify-center h-48 text-gray-300 text-sm gap-2">
                  <span className="w-4 h-4 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                  불러오는 중...
                </div>
              )}
              {trendError && <p className="text-sm text-red-400 mb-4">{trendError}</p>}
              {!trendLoading && trendCards.length === 0 && !trendError && (
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                  <p className="text-gray-300 text-sm">수집된 트랜드가 없습니다</p>
                  <button onClick={handleTrendCollect} disabled={trendCollecting}
                    className="px-6 py-2.5 rounded-2xl text-sm font-bold text-purple-700 disabled:opacity-40"
                    style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    {trendCollecting ? '수집 중...' : '지금 수집하기'}
                  </button>
                </div>
              )}
              {!trendLoading && trendCards.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {trendCards.map((card) => (
                    <button key={card.keyword}
                      onClick={() => handleKeywordToSynopsis(card.keyword)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:shadow-md"
                      style={{
                        background: '#f8f7ff',
                        border: '1px solid rgba(124,58,237,0.12)',
                        color: '#374151',
                      }}
                    >
                      {card.keyword}
                      <span className="flex gap-1">
                        {card.sources.map((src) => (
                          <span key={src} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              background: src === '유튜브' ? '#fff0f0' : '#f0fdf4',
                              color: src === '유튜브' ? '#dc2626' : '#15803d',
                            }}>
                            {src}
                          </span>
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 페이지 하단 */}
              <div className="flex items-center justify-between mt-10 pt-4" style={{ borderTop: '1px solid #f5f5f5', color: '#d1d5db', fontSize: 10 }}>
                <span>Trend Keywords</span>
                <span>{trendCards.length > 0 ? `${trendCards.length}개` : '—'}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── 바이럴 영상 탭 ── */}
        {activeTab === 'viral' && (
          <div style={{ width: VIRAL_W, margin: '0 auto' }}>
            <div className="flex gap-5 items-start">
              {/* 메인 종이 */}
              <div className="flex-1 rounded-sm"
                style={{
                  background: 'rgba(255,255,255,0.96)',
                  border: '1px solid rgba(15,23,42,0.06)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.08), inset 0 1px 0 #fff',
                  minHeight: 400,
                  padding: '40px 40px 56px',
                }}>
                <div className="flex items-baseline gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <span className="text-[11px] font-black text-purple-400 tracking-widest uppercase">Viral Videos</span>
                  {viralData && <span className="text-[11px] text-gray-300">TOP {viralData.viral_videos.length}</span>}
                </div>
                {viralError && (
                  <div className="mb-4 px-4 py-2.5 rounded-xl text-xs font-semibold text-orange-600"
                    style={{ background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.2)' }}>
                    {viralError}
                  </div>
                )}
                {viralLoading && (
                  <div className="flex items-center justify-center h-48 text-gray-300 text-sm gap-2">
                    <span className="w-4 h-4 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                    불러오는 중...
                  </div>
                )}
                {!viralLoading && (!viralData || viralData.viral_videos.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-48 gap-4">
                    <p className="text-gray-300 text-sm">수집된 데이터가 없습니다</p>
                    <button onClick={handleViralCollect} disabled={viralCollecting}
                      className="px-6 py-2.5 rounded-2xl text-sm font-bold text-purple-700 disabled:opacity-40"
                      style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                      {viralCollecting ? '수집 중...' : '지금 수집하기'}
                    </button>
                  </div>
                )}
                {!viralLoading && viralData && viralData.viral_videos.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {viralData.viral_videos.map((v, i) => (
                      <button key={v.video_id}
                        onClick={() => setSelectedVideo(prev => prev?.video_id === v.video_id ? null : v)}
                        className="w-full text-left rounded-xl overflow-hidden transition-all"
                        style={selectedVideo?.video_id === v.video_id ? {
                          background: '#f5f0ff',
                          border: '1.5px solid rgba(124,58,237,0.25)',
                          boxShadow: '0 0 0 3px rgba(124,58,237,0.08)',
                        } : {
                          background: '#fafafa',
                          border: '1px solid #f0f0f0',
                        }}>
                        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                          <img src={`https://img.youtube.com/vi/${v.video_id}/mqdefault.jpg`} alt={v.title}
                            className="w-full h-full object-cover" loading="lazy" />
                          <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 text-white text-[10px] font-black flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="absolute top-2 right-2"><ScoreBadge score={v.viral_score} /></span>
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-2 mb-1">{v.title}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 truncate max-w-[58%]">{v.channel_title}</span>
                            <span className="text-[10px] text-gray-400 shrink-0">{formatViews(v.views)}</span>
                          </div>
                          <span className="text-[10px] text-purple-400 font-bold mt-0.5 block">#{v.query}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: '1px solid #f5f5f5', color: '#d1d5db', fontSize: 10 }}>
                  <span>Viral Videos</span>
                  <span>{viralData ? `${viralData.viral_videos.length}개` : '—'}</span>
                </div>
              </div>

              {/* 상세 패널 — 별도 종이 */}
              {selectedVideo && (
                <div className="w-72 shrink-0 rounded-sm sticky top-[140px]"
                  style={{
                    background: 'rgba(255,255,255,0.96)',
                    border: '1px solid rgba(15,23,42,0.06)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.08), inset 0 1px 0 #fff',
                    maxHeight: 'calc(100vh - 160px)',
                    overflowY: 'auto',
                    padding: '32px 28px 40px',
                  }}>
                  <div className="flex items-baseline gap-3 mb-5 pb-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <span className="text-[11px] font-black text-purple-400 tracking-widest uppercase">Detail</span>
                    <button onClick={() => setSelectedVideo(null)} className="ml-auto text-[10px] text-gray-300 hover:text-gray-500 transition-colors">✕</button>
                  </div>
                  <div className="flex flex-col gap-4">
                    <a href={selectedVideo.url} target="_blank" rel="noopener noreferrer"
                      className="block relative rounded-lg overflow-hidden group">
                      <img src={`https://img.youtube.com/vi/${selectedVideo.video_id}/hqdefault.jpg`} alt={selectedVideo.title}
                        className="w-full object-cover" style={{ aspectRatio: '16/9' }} />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold">▶ YouTube에서 보기</span>
                      </div>
                    </a>
                    <div className="text-center py-3 rounded-xl" style={{ background: '#f8f5ff', border: '1px solid rgba(124,58,237,0.12)' }}>
                      <p className="text-[9px] font-black text-purple-300 tracking-widest uppercase mb-0.5">바이럴 지수</p>
                      <p className="text-2xl font-black text-purple-600">{formatViralScore(selectedVideo.viral_score)}</p>
                      <p className="text-[9px] text-gray-300 mt-0.5">구독자 대비 조회 배율</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-300 tracking-widest uppercase mb-2">영상 정보</p>
                      <p className="text-xs font-bold text-gray-800 leading-relaxed mb-1">{selectedVideo.title}</p>
                      <p className="text-[10px] text-purple-500 font-bold">{selectedVideo.channel_title}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          { label: '조회수', value: formatViews(selectedVideo.views) },
                          { label: '구독자', value: formatViews(selectedVideo.subscribers) },
                        ].map(item => (
                          <div key={item.label} className="rounded-lg p-2 text-center" style={{ background: '#fafafa', border: '1px solid #f0f0f0' }}>
                            <p className="text-[8px] text-gray-300">{item.label}</p>
                            <p className="text-sm font-black text-gray-700">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-300 tracking-widest uppercase mb-1.5">수집 키워드</p>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold"
                        style={{ background: '#f5f0ff', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.15)' }}>
                        #{selectedVideo.query}
                      </span>
                    </div>
                    <a href={selectedVideo.url} target="_blank" rel="noopener noreferrer"
                      className="block text-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                      style={{ background: '#fff5f5', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>
                      YouTube에서 보기 →
                    </a>
                    <button
                      onClick={() => handleKeywordToSynopsis(selectedVideo.query)}
                      className="block w-full text-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white' }}
                    >
                      ✦ 시놉시스 생성
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 급상승 검색어 탭 ── */}
        {activeTab === 'keywords' && (
          <div style={{ width: PAPER_W, margin: '0 auto' }}>
            <div className="rounded-sm"
              style={{
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid rgba(15,23,42,0.06)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.08), inset 0 1px 0 #fff',
                minHeight: 400,
                padding: '40px 64px 56px',
              }}>
              <div className="flex items-baseline gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <span className="text-[11px] font-black text-purple-400 tracking-widest uppercase">Rising Keywords</span>
                {viralData && <span className="text-[11px] text-gray-300">{viralData.rising_keywords.length}개</span>}
              </div>
              {viralLoading && (
                <div className="flex items-center justify-center h-48 text-gray-300 text-sm gap-2">
                  <span className="w-4 h-4 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                  불러오는 중...
                </div>
              )}
              {!viralLoading && (!viralData || viralData.rising_keywords.length === 0) && (
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                  <p className="text-gray-300 text-sm">수집된 데이터가 없습니다</p>
                  <button onClick={handleViralCollect} disabled={viralCollecting}
                    className="px-6 py-2.5 rounded-2xl text-sm font-bold text-purple-700 disabled:opacity-40"
                    style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    {viralCollecting ? '수집 중...' : '지금 수집하기'}
                  </button>
                </div>
              )}
              {!viralLoading && viralData && viralData.rising_keywords.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {viralData.rising_keywords.map((k, i) => (
                    <button key={k.keyword} onClick={() => handleKeywordToSynopsis(k.keyword)}
                      className="px-4 py-3 rounded-xl flex items-center gap-3 text-left transition-all hover:shadow-md"
                      style={{ background: '#fafafa', border: '1px solid #f0f0f0' }}>
                      <span className="text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: '#f5f0ff', color: '#7c3aed' }}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-bold text-gray-700 truncate">{k.keyword}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-10 pt-4" style={{ borderTop: '1px solid #f5f5f5', color: '#d1d5db', fontSize: 10 }}>
                <span>Rising Keywords</span>
                <span>{viralData ? `${viralData.rising_keywords.length}개` : '—'}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── 컨셉 패턴 분석 탭 ── */}
        {activeTab === 'concepts' && (
          <div style={{ maxWidth: 1480, margin: '0 auto' }}>
            <div className="rounded-sm"
              style={{
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid rgba(15,23,42,0.06)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.08), inset 0 1px 0 #fff',
                minHeight: 400,
                padding: '40px 64px 56px',
              }}>
              <div className="flex items-baseline gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <span className="text-[11px] font-black text-purple-400 tracking-widest uppercase">Concept Patterns</span>
                {viralData && <span className="text-[11px] text-gray-300">{viralData.concepts.length}개 패턴</span>}
              </div>
              {viralLoading && (
                <div className="flex items-center justify-center h-48 text-gray-300 text-sm gap-2">
                  <span className="w-4 h-4 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                  불러오는 중...
                </div>
              )}
              {!viralLoading && (!viralData || viralData.concepts.length === 0) && (
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                  <p className="text-gray-300 text-sm">수집된 데이터가 없습니다</p>
                  <button onClick={handleViralCollect} disabled={viralCollecting}
                    className="px-6 py-2.5 rounded-2xl text-sm font-bold text-purple-700 disabled:opacity-40"
                    style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    {viralCollecting ? '수집 중...' : '지금 수집하기'}
                  </button>
                </div>
              )}
              {!viralLoading && viralData && viralData.concepts.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {viralData.concepts.map(c => (
                    <div key={c.concept} className="rounded-xl p-5" style={{ background: '#fafafa', border: '1px solid #f0f0f0' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <button onClick={() => handleKeywordToSynopsis(c.concept)}
                          className="text-base font-black text-purple-700 hover:text-purple-500 transition-colors text-left">
                          {c.concept}
                        </button>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                          style={{ background: '#f5f0ff', color: '#7c3aed' }}>
                          {c.count}개 영상
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {c.examples.map((ex, idx) => (
                          <p key={idx} className="text-xs text-gray-600 leading-relaxed pl-3"
                            style={{ borderLeft: '2px solid rgba(124,58,237,0.2)' }}>
                            {ex}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-10 pt-4" style={{ borderTop: '1px solid #f5f5f5', color: '#d1d5db', fontSize: 10 }}>
                <span>Concept Patterns</span>
                <span>{viralData ? `${viralData.concepts.length}개` : '—'}</span>
              </div>
            </div>

          </div>
        )}

        {/* ── 이시각 최신뉴스 탭 ── */}
        {activeTab === 'news' && (
          <div style={{ width: PAPER_W, margin: '0 auto' }}>
            <div className="rounded-sm"
              style={{
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid rgba(15,23,42,0.06)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.08), inset 0 1px 0 #fff',
                minHeight: 400,
                padding: '40px 64px 56px',
              }}>
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <div className="flex items-baseline gap-3">
                  <span className="text-[11px] font-black text-rose-500 tracking-widest uppercase">이시각 최신뉴스</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse inline-block" />
                  {newsData && (
                    <span className="text-[11px] text-gray-300">
                      경제 {newsData.economy.length}건 · 사회 {newsData.society.length}건
                    </span>
                  )}
                </div>
                <button
                  onClick={loadNews}
                  disabled={newsLoading}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}
                >
                  {newsLoading ? '로딩 중...' : '새로고침'}
                </button>
              </div>

              {newsLoading && (
                <div className="flex items-center justify-center h-48 text-gray-300 text-sm gap-2">
                  <span className="w-4 h-4 border-2 border-rose-200 border-t-rose-400 rounded-full animate-spin" />
                  뉴스 불러오는 중...
                </div>
              )}

              {!newsLoading && newsData && (
                <div className="grid grid-cols-2 gap-10">
                  {/* 경제 */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-black text-blue-700"
                        style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>경제면</span>
                    </div>
                    <div className="flex flex-col divide-y" style={{ borderColor: '#f5f5f5' }}>
                      {newsData.economy.map((item, i) => (
                        <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                          className="group py-3 block">
                          <div className="flex items-start gap-2.5">
                            <span className="shrink-0 text-[10px] font-black text-gray-300 mt-0.5 w-4">{i + 1}</span>
                            <div>
                              <p className="text-sm text-gray-700 leading-relaxed group-hover:text-purple-600 transition-colors">
                                {item.title}
                              </p>
                              {item.pubDate && (
                                <span className="text-[10px] text-gray-300 mt-1 block">
                                  {new Date(item.pubDate).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* 사회 */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-black text-emerald-700"
                        style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>사회면</span>
                    </div>
                    <div className="flex flex-col divide-y" style={{ borderColor: '#f5f5f5' }}>
                      {newsData.society.map((item, i) => (
                        <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                          className="group py-3 block">
                          <div className="flex items-start gap-2.5">
                            <span className="shrink-0 text-[10px] font-black text-gray-300 mt-0.5 w-4">{i + 1}</span>
                            <div>
                              <p className="text-sm text-gray-700 leading-relaxed group-hover:text-purple-600 transition-colors">
                                {item.title}
                              </p>
                              {item.pubDate && (
                                <span className="text-[10px] text-gray-300 mt-1 block">
                                  {new Date(item.pubDate).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!newsLoading && !newsData && (
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                  <p className="text-gray-300 text-sm">뉴스를 불러올 수 없습니다</p>
                  <button onClick={loadNews}
                    className="px-6 py-2.5 rounded-2xl text-sm font-bold disabled:opacity-40"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>
                    다시 시도
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mt-10 pt-4" style={{ borderTop: '1px solid #f5f5f5', color: '#d1d5db', fontSize: 10 }}>
                <span>이시각 최신뉴스 — 네이버 뉴스 경제·사회면</span>
                {newsData && <span>{new Date(newsData.fetched_at).toLocaleString('ko-KR')}</span>}
              </div>
            </div>
          </div>
        )}

        {/* ── 시놉시스 탭 ── */}
        {activeTab === 'synopsis' && (
          <div style={{ width: PAPER_W, margin: '0 auto' }}>
            <div className="rounded-sm"
              style={{
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid rgba(15,23,42,0.06)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.08), inset 0 1px 0 #fff',
                minHeight: 400,
                padding: '40px 64px 56px',
              }}>
              <div className="flex items-baseline gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <span className="text-[11px] font-black text-purple-400 tracking-widest uppercase">Synopsis</span>
                <span className="text-[11px] text-gray-300">트랜드 키워드로 시놉시스 생성</span>
              </div>

              {/* 캐릭터 선택 */}
              <div className="mb-8">
                <div className="text-[10px] font-black text-purple-400 tracking-widest uppercase mb-3">
                  주인공 선택 <span className="text-gray-300 font-normal normal-case tracking-normal">(선택 시 캐릭터 shadow/fear가 시놉시스에 반영됩니다)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* charA — 남성 */}
                  <div>
                    <div className="text-[9px] font-bold text-blue-400 tracking-widest uppercase mb-2">남자 주인공 (A)</div>
                    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                      {maleChars.map(c => (
                        <button key={c.id}
                          onClick={() => setSelCharA(selCharA === c.id ? null : c.id)}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all"
                          style={{
                            background: selCharA === c.id ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'rgba(248,250,255,0.9)',
                            color: selCharA === c.id ? '#fff' : '#374151',
                            border: selCharA === c.id ? '1.5px solid #3b82f6' : '1px solid rgba(59,130,246,0.15)',
                            boxShadow: selCharA === c.id ? '0 2px 12px rgba(59,130,246,0.3)' : '2px 2px 6px #d0d5df, -2px -2px 6px #ffffff',
                          }}>
                          <span className="font-bold">{c.name}</span>
                          <span className="ml-1.5 opacity-70">{c.age}세 · {c.occupation}</span>
                        </button>
                      ))}
                    </div>
                    {selCharA && charACoreDetail?.core.shadow && (
                      <div className="mt-2 p-2.5 rounded-xl text-[10px] leading-relaxed text-gray-600"
                        style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)', borderLeft: '3px solid #3b82f6' }}>
                        <span className="text-[9px] font-black text-blue-400 block mb-1">속모습</span>
                        {charACoreDetail.core.shadow}
                      </div>
                    )}
                  </div>

                  {/* charB — 여성 */}
                  <div>
                    <div className="text-[9px] font-bold text-pink-400 tracking-widest uppercase mb-2">여자 주인공 (B)</div>
                    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                      {femaleChars.map(c => (
                        <button key={c.id}
                          onClick={() => setSelCharB(selCharB === c.id ? null : c.id)}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all"
                          style={{
                            background: selCharB === c.id ? 'linear-gradient(135deg,#ec4899,#db2777)' : 'rgba(255,248,252,0.9)',
                            color: selCharB === c.id ? '#fff' : '#374151',
                            border: selCharB === c.id ? '1.5px solid #ec4899' : '1px solid rgba(236,72,153,0.15)',
                            boxShadow: selCharB === c.id ? '0 2px 12px rgba(236,72,153,0.3)' : '2px 2px 6px #d0d5df, -2px -2px 6px #ffffff',
                          }}>
                          <span className="font-bold">{c.name}</span>
                          <span className="ml-1.5 opacity-70">{c.age}세 · {c.occupation}</span>
                        </button>
                      ))}
                    </div>
                    {selCharB && charBCoreDetail?.core.shadow && (
                      <div className="mt-2 p-2.5 rounded-xl text-[10px] leading-relaxed text-gray-600"
                        style={{ background: 'rgba(236,72,153,0.04)', border: '1px solid rgba(236,72,153,0.12)', borderLeft: '3px solid #ec4899' }}>
                        <span className="text-[9px] font-black text-pink-400 block mb-1">속모습</span>
                        {charBCoreDetail.core.shadow}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 키워드 입력 + 생성 버튼 */}
              <div className="flex flex-col gap-4 max-w-2xl mb-8">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={synopsisKeyword}
                    onChange={e => setSynopsisKeyword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !synopsisLoading && handleGenerateSynopsis()}
                    placeholder="키워드를 입력하거나 탭에서 선택하세요"
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-gray-800 outline-none transition-all"
                    style={{ background: '#f8f7ff', border: '1.5px solid rgba(124,58,237,0.2)' }}
                    onFocus={e => { e.target.style.border = '1.5px solid rgba(124,58,237,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
                    onBlur={e => { e.target.style.border = '1.5px solid rgba(124,58,237,0.2)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    onClick={handleGenerateSynopsis}
                    disabled={synopsisLoading || !synopsisKeyword.trim()}
                    className="shrink-0 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}
                  >
                    {synopsisLoading
                      ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />생성 중</>
                      : '✦ 시놉시스 생성'}
                  </button>
                </div>

                {!synopsisKeyword.trim() && trendCards.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {trendCards.slice(0, 6).map(c => (
                      <button key={c.keyword} onClick={() => setSynopsisKeyword(c.keyword)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:shadow-sm"
                        style={{ background: '#f5f0ff', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.15)' }}>
                        {c.keyword}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 에러 */}
              {synopsisError && (
                <div className="mb-6 px-4 py-3 rounded-xl text-sm font-semibold text-red-600"
                  style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
                  {synopsisError}
                </div>
              )}

              {/* 시놉시스 카드 목록 */}
              {synopses.length > 0 && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-black text-purple-400 tracking-widest uppercase">
                      시놉시스 선택 — 하나를 골라주세요
                    </div>
                    <button
                      onClick={handleGenerateSynopsis}
                      disabled={synopsisLoading || worldLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                      style={{ background: '#f5f0ff', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)' }}
                    >
                      {synopsisLoading
                        ? <><span className="w-3 h-3 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />재생성 중</>
                        : '↺ 재생성'}
                    </button>
                  </div>
                  {synopses.map((s, i) => {
                    const isSelected = synopsisSelected === i;
                    const isLoading = isSelected && worldLoading;
                    const mood = getMood(s.mood);
                    return (
                      <button key={i}
                        onClick={() => !worldLoading && handleSelectSynopsis(i)}
                        disabled={worldLoading}
                        className="w-full text-left rounded-2xl p-6 transition-all"
                        style={{
                          background: isSelected ? 'linear-gradient(145deg, #e0e3ea, #eef0f5)' : 'rgba(248,247,255,0.8)',
                          border: isSelected ? '1.5px solid rgba(124,58,237,0.3)' : '1px solid rgba(124,58,237,0.08)',
                          boxShadow: isSelected
                            ? 'inset 4px 4px 10px #c0c3d0, inset -4px -4px 10px #f5f0ff, 0 0 0 2px rgba(124,58,237,0.18)'
                            : '4px 4px 12px #d0d3da, -4px -4px 12px #ffffff',
                          opacity: worldLoading && !isSelected ? 0.45 : 1,
                          cursor: worldLoading ? 'default' : 'pointer',
                        }}>
                        {/* 헤더 */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                              style={{
                                background: isSelected ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#f5f0ff',
                                color: isSelected ? '#fff' : '#7c3aed',
                              }}>
                              {i + 1}
                            </span>
                            <span className="text-base font-black text-gray-800 leading-snug">{s.title}</span>
                          </div>
                          <div className="flex gap-2 shrink-0 ml-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-purple-600"
                              style={{ background: '#f5f0ff' }}>{s.genre}</span>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                              style={{ background: mood.bg, color: mood.color }}>{s.mood}</span>
                          </div>
                        </div>

                        {/* 로그라인 */}
                        <p className="text-sm text-gray-700 leading-relaxed mb-4 px-3 py-2.5 rounded-lg"
                          style={{ background: 'rgba(0,0,0,0.03)', borderLeft: '3px solid rgba(124,58,237,0.25)' }}>
                          {s.logline}
                        </p>

                        {/* 인물 + 갈등 */}
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: '남자 주인공', value: s.charA_summary },
                            { label: '여자 주인공', value: s.charB_summary },
                            { label: '핵심 갈등', value: s.conflict_summary },
                          ].map(item => (
                            <div key={item.label} className="rounded-xl p-3"
                              style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(124,58,237,0.08)' }}>
                              <div className="text-[9px] font-black text-purple-400 tracking-widest uppercase mb-1.5">{item.label}</div>
                              <p className="text-xs text-gray-600 leading-relaxed">{item.value}</p>
                            </div>
                          ))}
                        </div>

                        {isLoading && (
                          <div className="flex items-center gap-2 mt-4 text-xs font-bold text-purple-500">
                            <span className="w-3.5 h-3.5 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                            세계관 생성 중...
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between mt-10 pt-4" style={{ borderTop: '1px solid #f5f5f5', color: '#d1d5db', fontSize: 10 }}>
                <span>Synopsis Generator</span>
                <span>{synopsisKeyword ? `키워드: ${synopsisKeyword}` : '—'}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
