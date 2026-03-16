'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTv, faSearch, faPlus, faTrash, faArrowRight,
  faSync, faCheckCircle, faSpinner, faLink, faBolt,
  faCircleNodes, faNetworkWired, faDatabase, faUsers,
  faEye, faThumbsUp, faComment, faExternalLinkAlt,
  faTimes, faChevronLeft, faChevronRight, faInfoCircle,
  faFileAlt, faRobot, faKey, faChartLine, faHashtag,
  faStar, faTag
} from '@fortawesome/free-solid-svg-icons';

// --- Step Component ---
const Step = ({ label, desc, active = false }: { label: string; desc: string; active?: boolean }) => (
  <div className={`flex items-start gap-4 transition-all duration-500 ${active ? 'opacity-100 translate-x-0' : 'opacity-30 -translate-x-2'}`}>
    <div className={`w-2 h-2 rounded-full mt-1.5 z-10 ${active ? 'bg-[#a78bfa] ring-4 ring-[#a78bfa]/20' : 'bg-slate-600'}`} />
    <div>
      <div className={`text-xs font-black ${active ? 'text-white' : 'text-slate-500'}`}>{label}</div>
      <div className="text-[10px] font-bold text-slate-500 leading-tight">{desc}</div>
    </div>
  </div>
);

// --- Viral Score Helpers ---
function parseKorNum(s: string): number {
  if (!s) return 0;
  const n = parseFloat(s);
  if (s.includes('만')) return n * 10000;
  if (s.toLowerCase().includes('k')) return n * 1000;
  return n || 0;
}

function calcViralScore(video: { subscribers: string; views: string; likes: string; comments: string }): number {
  const views = parseKorNum(video.views);
  const subs  = parseKorNum(video.subscribers);
  const likes = parseKorNum(video.likes);
  const comments = parseKorNum(video.comments);
  if (!subs || !views) return 0;
  const viewRatio  = (views / subs) * 100;
  const engagement = ((likes + comments * 5) / views) * 100;
  return Math.round(viewRatio * (1 + engagement * 0.05) * 10) / 10;
}

function getScoreTier(score: number): { emoji: string; color: string; label: string } {
  if (score >= 30) return { emoji: '🔥', color: 'bg-red-500/80 text-white border-red-400/50', label: '떡상' };
  if (score >= 15) return { emoji: '⚡', color: 'bg-yellow-500/80 text-black border-yellow-400/50', label: '상승중' };
  if (score >= 8)  return { emoji: '📈', color: 'bg-green-500/80 text-white border-green-400/50', label: '관심' };
  return { emoji: '💤', color: 'bg-slate-600/80 text-slate-300 border-slate-500/50', label: '보통' };
}

function isRecent3Months(video: { published_at?: string; created_at?: string }): boolean {
  const ts = video.published_at || video.created_at;
  if (!ts) return false;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return false;
  const days90 = 90 * 24 * 60 * 60 * 1000;
  return Date.now() - d.getTime() <= days90;
}

function getErrorInfo(message: string) {
  const m = (message || '').toLowerCase();
  if (m.includes('pgrst204') || (m.includes('schema cache') && m.includes('column'))) {
    return {
      kind: 'db_schema',
      title: 'DB 스키마 불일치',
      reason: 'Supabase 테이블 컬럼이 코드에서 보내는 필드와 다름',
      action: 'Supabase에 컬럼 추가 또는 코드에서 해당 필드 제거',
    } as const;
  }
  if (m.includes('quota') || m.includes('쿼터')) {
    return {
      kind: 'quota',
      title: 'YouTube API 쿼터 초과',
      reason: 'Google API 일일 할당량이 소진되어 요청이 차단됨',
      action: '내일 다시 시도하거나, 새 API 키로 교체/쿼터 증액',
    } as const;
  }
  if (m.includes('cannot resolve channel id') || m.includes('channel id')) {
    return {
      kind: 'resolve_channel',
      title: '채널 식별 실패',
      reason: 'URL에서 채널/영상 정보를 식별하지 못함(비공개/제한/URL 오류 가능)',
      action: '채널 홈 URL 또는 접근 가능한 영상 URL로 재시도',
    } as const;
  }
  if (m.includes('supabase_url') || m.includes('service_role') || m.includes('환경변수')) {
    return {
      kind: 'env',
      title: '서버 설정 누락',
      reason: '서버 환경변수(Supabase/YouTube 키)가 설정되지 않음',
      action: '.env 또는 배포 환경변수 설정 후 재시도',
    } as const;
  }
  if (m.includes('api request failed') || m.includes('fetch')) {
    return {
      kind: 'api',
      title: '서버 요청 실패',
      reason: '서버가 정상 응답을 주지 못함(일시 장애/네트워크 문제 가능)',
      action: '잠시 후 재시도 또는 서버 로그 확인',
    } as const;
  }
  return {
    kind: 'unknown',
    title: '알 수 없는 오류',
    reason: '예상하지 못한 오류가 발생함',
    action: '오류 메시지/키워드를 확인하고 재시도',
  } as const;
}

// --- Types ---
type VideoItem = {
  created_at?: string;
  published_at?: string;
  id: number;
  video_id?: string;
  keyword: string;
  channelName: string;
  videoTitle: string;
  description?: string;
  thumbnail: string;
  url: string;
  subscribers: string;
  views: string;
  likes: string;
  comments: string;
  status: string;
  collectedAt: string;
  viral_score?: number;
  is_analyzed?: boolean;
  quality_score?: number;
  content_type?: string;
  summary?: string;
  viral_reason?: string;
};

type CommentItem = {
  author: string;
  authorChannelUrl?: string;
  text: string;
  likeCount: number;
  publishedAt?: string;
  updatedAt?: string;
  replyCount?: number;
};

const COUNTRIES = ['전체', 'Korea', 'USA', 'Japan', 'India'];
const REGION_MAP: Record<string, string> = {
  Korea: 'KR', USA: 'US', Japan: 'JP', India: 'IN',
};

export default function KeywordCrawlingPage() {
  const [videos, setVideos]           = useState<VideoItem[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [isFetching, setIsFetching]   = useState(false);
  const [newKeywords, setNewKeywords] = useState<string[]>(['', '']);
  const [selectedCountry, setSelectedCountry] = useState('전체');
  const [isLoading, setIsLoading]     = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [crawlErrors, setCrawlErrors] = useState<Array<{ keyword: string; message: string }>>([]);
  const [sortMode, setSortMode] = useState<'latest' | 'benchmark' | 'viral'>('latest');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [commentsVideoId, setCommentsVideoId] = useState<string>('');
  const errorHints = (() => {
    const map = new Map<string, ReturnType<typeof getErrorInfo>>();
    for (const e of crawlErrors) {
      const info = getErrorInfo(e.message);
      if (!map.has(info.kind)) map.set(info.kind, info);
    }
    return Array.from(map.values());
  })();
  const [currentPage, setCurrentPage]     = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const limit = 20;

  const loadVideos = useCallback(async (page: number, sort: 'latest' | 'benchmark' | 'viral' = 'latest') => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        source: 'keyword',
        sort,
      });
      const res  = await fetch(`/api/youtube/videos?${params.toString()}`);
      const data = await res.json();
      setVideos(data.videos || []);
      setTotalVideos(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);
    } catch (e) {
      console.error('loadVideos error:', e);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => { loadVideos(1, sortMode); }, [loadVideos, sortMode]);

  useEffect(() => {
    const vid = selectedVideo?.video_id ?? '';
    setCommentsVideoId(vid);
    setCommentsList([]);
    setCommentsError('');
    setCommentsLoading(false);
  }, [selectedVideo?.video_id]);

  const fetchComments = async (videoId: string) => {
    if (!videoId) return;
    if (commentsLoading) return;
    setCommentsLoading(true);
    setCommentsError('');
    try {
      const params = new URLSearchParams({ video_id: videoId, max_results: '20' });
      const res = await fetch(`/api/youtube/comments?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '댓글 조회 실패');
      setCommentsList(Array.isArray(json?.comments) ? json.comments : []);
    } catch (e) {
      setCommentsError(e instanceof Error ? e.message : '댓글 조회 실패');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    loadVideos(page, sortMode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeywordChange = (index: number, value: string) => {
    const updated = [...newKeywords];
    updated[index] = value;
    setNewKeywords(updated);
  };

  const handleAddKeywords = async () => {
    const activeKeywords = newKeywords.map(k => k.trim()).filter(Boolean);
    if (activeKeywords.length === 0) return alert('최소 하나의 키워드를 입력해주세요.');

    setIsLoading(true);
    setCrawlErrors([]);
    setProgressMsg('수집 준비 중...');

    let errorsCount = 0;
    try {
      const regionCode = REGION_MAP[selectedCountry] || '';
      const res = await fetch('/api/youtube/keyword-crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: activeKeywords, max_results: 50, regionCode }),
      });

      if (!res.ok || !res.body) throw new Error('API 요청 실패');

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let totalSaved = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim().startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.trim().slice(6));
            if (ev.type === 'progress') {
              setProgressMsg(`"${ev.keyword}" 수집 중... (${ev.count}/${ev.total}) ${ev.saved ?? 0}개 저장`);
            } else if (ev.type === 'done') {
              totalSaved = ev.total_saved ?? 0;
            } else if (ev.type === 'error') {
              const keyword = String(ev.keyword || '');
              const message = String(ev.message || '알 수 없는 오류');
              errorsCount += 1;
              setCrawlErrors(prev => [...prev, { keyword, message }]);
              setProgressMsg(`오류: ${message}`);
            }
          } catch { /* skip */ }
        }
      }

      setNewKeywords(['', '']);
      await loadVideos(1);
      if (errorsCount > 0) {
        setProgressMsg(`완료! 총 ${totalSaved}개 저장, ${errorsCount}개 실패`);
      } else {
        setProgressMsg(`완료! 총 ${totalSaved}개 저장`);
      }
    } catch (e) {
      console.error('handleAddKeywords error:', e);
      const message = e instanceof Error ? e.message : '수집 중 오류가 발생했습니다.';
      errorsCount += 1;
      setCrawlErrors(prev => [...prev, { keyword: '요청', message }]);
      setProgressMsg(`오류: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0f0f1a] min-h-screen text-white pb-24 font-sans antialiased">
      {/* Hero Header */}
      <header
        className="relative pt-24 pb-32 text-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/img/crawling/keyword/keyword.webp')" }}
      >
        <div className="absolute inset-0 bg-[#0f0f1a]/70" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#6366f1_0%,transparent_70%)]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[#a78bfa] text-xs font-bold tracking-wider mb-6 uppercase">
            <FontAwesomeIcon icon={faHashtag} /> YouTube Keyword Scout
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tighter">
            유튜브 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] to-[#6366f1]">키워드 수집기</span>
          </h1>

          <div className="max-w-2xl mx-auto mt-2 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-left">
            <p className="text-[11px] font-black text-[#a78bfa] uppercase tracking-widest mb-3">📊 떡상 점수 산출 공식</p>
            <div className="font-mono text-sm text-white/90 bg-black/30 rounded-xl px-4 py-3 mb-4 leading-relaxed">
              점수 = (조회수 ÷ 구독자수 × 100) × (1 + 참여율 × 0.05)<br />
              <span className="text-slate-400 text-xs">참여율 = (좋아요 + 댓글×5) ÷ 조회수 × 100</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-bold mb-4">
              <div className="flex items-center gap-2 bg-red-500/15 border border-red-400/30 rounded-xl px-3 py-2">
                <span>🔥</span><div><div className="text-red-400">30점 이상</div><div className="text-slate-500 font-medium">떡상</div></div>
              </div>
              <div className="flex items-center gap-2 bg-yellow-500/15 border border-yellow-400/30 rounded-xl px-3 py-2">
                <span>⚡</span><div><div className="text-yellow-400">15점 이상</div><div className="text-slate-500 font-medium">상승중</div></div>
              </div>
              <div className="flex items-center gap-2 bg-green-500/15 border border-green-400/30 rounded-xl px-3 py-2">
                <span>📈</span><div><div className="text-green-400">8점 이상</div><div className="text-slate-500 font-medium">관심</div></div>
              </div>
              <div className="flex items-center gap-2 bg-slate-700/50 border border-slate-600/30 rounded-xl px-3 py-2">
                <span>💤</span><div><div className="text-slate-400">8점 미만</div><div className="text-slate-500 font-medium">보통</div></div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <span className="text-lg">🔥</span>
              <p className="text-[11px] font-black text-red-300 leading-snug">
                <span className="text-red-400">30점 이상 떡상 영상만 수집 대상</span>입니다.
                낮은 점수 영상은 AI 분석 버튼이 표시되지 않습니다.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 space-y-12">

        {/* Registration Section */}
        <section className="bg-[#1c1c2e] rounded-[32px] border border-white/5 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-10 lg:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/5">
              <h3 className="text-3xl font-black leading-tight mb-6">
                키워드 기반<br />
                <span className="text-[#a78bfa]">트렌드 자동 포착</span>
              </h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
                원하는 키워드만 입력하세요.<br />
                해당 키워드로 유튜브에서 가장 높은 반응을 얻고 있는<br />
                핵심 영상들을 AI가 자동으로 수집하고 분석합니다.
              </p>
              <div className="bg-white/5 p-6 rounded-2xl border border-dashed border-white/10">
                <div className="flex items-center gap-2 text-[#a78bfa] font-black text-[10px] uppercase tracking-widest mb-6">
                  <FontAwesomeIcon icon={faBolt} /> 키워드 자동화 프로세스
                </div>
                <div className="space-y-5 relative">
                  <div className="absolute left-[3.5px] top-2 bottom-2 w-[1px] bg-white/5" />
                  <Step label="Keyword Discovery"  desc="유튜브 인기 검색어 및 관련어 분석" active />
                  <Step label="Trend Ranking"      desc="떡상 점수 기반 고효율 영상 필터링" active />
                  <Step label="Data Harvesting"    desc="영상 메타데이터 및 분석 정보 수집" active />
                  <Step label="AI Insight"         desc="Gemini AI 자막 분석 및 품질 평가" />
                </div>
              </div>
            </div>

            <div className="p-10 lg:p-12 bg-white/[0.02]">
              <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                <FontAwesomeIcon icon={faPlus} className="text-[#a78bfa]" />
                수집 키워드 추가
              </h3>

              <div className="space-y-6">
                {/* Country Selection */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">대상 국가</label>
                  <div className="flex flex-wrap gap-2">
                    {COUNTRIES.map(country => (
                      <button
                        key={country}
                        onClick={() => setSelectedCountry(country)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          selectedCountry === country
                            ? 'bg-[#a78bfa] border-[#a78bfa] text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                        }`}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Keywords (Max 2)</label>
                  <div className="space-y-3">
                    {newKeywords.map((kw, index) => (
                      <div key={index} className="relative">
                        <input
                          type="text"
                          value={kw}
                          onChange={(e) => handleKeywordChange(index, e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleAddKeywords(); }}
                          placeholder={`키워드 ${index + 1} (예: 챗GPT 수익화)`}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-sm font-bold text-white placeholder:text-slate-600 focus:ring-2 focus:ring-[#a78bfa] focus:border-transparent outline-none transition-all pl-12"
                        />
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 font-black text-xs">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAddKeywords}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#a78bfa] to-[#6366f1] hover:from-[#b79cff] hover:to-[#7477ff] text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mt-4"
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      <span className="text-sm truncate max-w-[260px]">{progressMsg || '수집 중...'}</span>
                    </>
                  ) : (
                    <>
                      <span>키워드 수집 시작</span>
                      <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    </>
                  )}
                </button>

                {(progressMsg || crawlErrors.length > 0) && (
                  <div className={`p-5 rounded-2xl border ${crawlErrors.length > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`text-[10px] font-black uppercase tracking-widest ${crawlErrors.length > 0 ? 'text-red-300' : 'text-slate-400'}`}>
                        {crawlErrors.length > 0 ? 'ERROR' : 'STATUS'}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setProgressMsg(''); setCrawlErrors([]); }}
                        className="ml-auto w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-400"
                        title="메시지 지우기"
                      >
                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                      </button>
                    </div>

                    {progressMsg && (
                      <div className="mt-2 text-xs font-bold text-slate-200 leading-relaxed break-words">
                        {progressMsg}
                      </div>
                    )}

                    {crawlErrors.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-[11px] font-black text-red-300">
                          실패 내역 ({crawlErrors.length})
                        </div>
                        {errorHints.length > 0 && (
                          <div className="space-y-2">
                            {errorHints.map(h => (
                              <div key={h.kind} className="p-4 rounded-xl bg-black/20 border border-white/10">
                                <div className="text-[11px] font-black text-white">{h.title}</div>
                                <div className="text-[11px] font-bold text-slate-300 mt-1 leading-relaxed">
                                  이유: {h.reason}
                                </div>
                                <div className="text-[11px] font-bold text-slate-300 mt-1 leading-relaxed">
                                  해결: {h.action}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="max-h-40 overflow-auto rounded-xl border border-red-500/20 bg-black/20">
                          {crawlErrors.map((e, i) => (
                            <div key={`${e.keyword}-${i}`} className="px-4 py-3 border-b border-white/5 last:border-b-0">
                              <div className="text-[10px] font-black text-slate-300 break-all">{e.keyword || '(키워드 없음)'}</div>
                              <div className="text-[11px] font-bold text-red-200/90 mt-1 break-words">{e.message}</div>
                              <div className="text-[10px] font-bold text-slate-400 mt-1 break-words">
                                {getErrorInfo(e.message).action}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-5 bg-[#a78bfa]/5 rounded-2xl border border-[#a78bfa]/10">
                  <h4 className="text-xs font-black text-[#a78bfa] mb-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} /> 수집 팁
                  </h4>
                  <ul className="text-[11px] font-bold text-slate-500 space-y-1.5 list-disc list-inside">
                    <li>구체적인 키워드일수록 정확한 영상이 수집됩니다.</li>
                    <li>현재 가장 핫한 키워드를 입력해 트렌드를 파악하세요.</li>
                    <li>최대 2개까지 동시 처리 가능합니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#1c1c2e] p-10 rounded-[32px] shadow-xl border border-white/5">
          <div className="flex flex-wrap items-center justify-between mb-8 px-2 gap-4">
            <h3 className="text-xl font-black flex items-center gap-3">
              <FontAwesomeIcon icon={faTv} className="text-[#a78bfa]" />
              현재 수집된 유튜브 영상
              <span className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-black text-slate-500 border border-white/10">
                TOTAL {totalVideos}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              {([
                { key: 'latest', label: '최신순' },
                { key: 'benchmark', label: '벤치마킹' },
                { key: 'viral', label: '떡상' },
              ] as const).map((it) => (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => {
                    setSortMode(it.key);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${
                    sortMode === it.key
                      ? 'bg-[#a78bfa] text-white border-[#a78bfa]/50'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {it.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading skeleton */}
          {isFetching && (
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4 mb-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 overflow-hidden">
                  <div className="h-32 md:h-48 bg-white/5 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-2 bg-white/5 rounded animate-pulse w-2/3" />
                    <div className="h-2 bg-white/5 rounded animate-pulse w-full" />
                    <div className="h-2 bg-white/5 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isFetching && videos.length === 0 && (
            <div className="text-center py-24 text-slate-600">
              <FontAwesomeIcon icon={faHashtag} className="text-5xl mb-4 opacity-30" />
              <p className="font-black text-lg">수집된 영상이 없습니다</p>
              <p className="text-sm mt-2">위 입력창에 키워드를 입력하고 수집을 시작하세요.</p>
            </div>
          )}

          {/* Video cards */}
          {!isFetching && videos.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {videos.map((video) => {
                const vid    = video.video_id ?? String(video.id);
                const score  = video.viral_score ?? calcViralScore(video);
                const tier   = getScoreTier(score);

                return (
                  <div key={video.id} className="group bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 transition-all overflow-hidden flex flex-col shadow-lg hover:border-white/10">
                    <div className="relative h-32 md:h-48 overflow-hidden cursor-pointer" onClick={() => setSelectedVideo(video)}>
                      <img
                        src={video.thumbnail}
                        alt={video.videoTitle}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c2e] to-transparent opacity-60" />

                      {/* Viral score badge */}
                      <div className={`absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border backdrop-blur-sm ${tier.color}`}>
                        <span>{tier.emoji}</span>
                        <span>{score}</span>
                      </div>

                      {score >= 30 && isRecent3Months(video) && (
                        <div className="absolute bottom-10 left-12 z-30 px-2 py-0.5 rounded-full text-[9px] font-black border backdrop-blur-sm bg-[#a78bfa]/80 text-white border-[#a78bfa]/50">
                          벤치마킹 1순위
                        </div>
                      )}
                      {score >= 30 && isRecent3Months(video) && (
                        <div className="absolute bottom-10 left-2 z-30 w-8 h-8 rounded-full bg-white/90 text-[#a78bfa] border border-white/50 backdrop-blur-sm flex items-center justify-center shadow-md">
                          <FontAwesomeIcon icon={faThumbsUp} className="text-xs" />
                        </div>
                      )}

                      <div className="absolute top-2 md:top-4 right-2 md:right-4 flex gap-1.5 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          title="동기화"
                          onClick={(e) => { e.stopPropagation(); }}
                          className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-[#a78bfa] transition-all shadow-sm"
                        >
                          <FontAwesomeIcon icon={faSync} className="text-[10px] md:text-xs" />
                        </button>
                        <button
                          title="삭제"
                          onClick={(e) => { e.stopPropagation(); }}
                          className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-red-500 transition-all shadow-sm"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-[10px] md:text-xs" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-center -mt-3 relative z-10">
                      <span className="px-2 md:px-4 py-0.5 md:py-1 bg-[#1c1c2e] border border-white/10 rounded-full text-[7px] md:text-[9px] font-black text-[#a78bfa] shadow-2xl backdrop-blur-md">
                        수집일: {video.collectedAt}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 px-3 pt-1.5">
                      {video.is_analyzed && video.viral_reason ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[7px] md:text-[8px] font-black bg-red-500/20 text-red-400 border border-red-500/30">
                          🔥 떡상분석완료
                        </span>
                      ) : video.is_analyzed ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[7px] md:text-[8px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          분석완료
                        </span>
                      ) : null}
                      {video.is_analyzed && video.quality_score != null && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[7px] md:text-[8px] font-black border ${
                          video.quality_score >= 7
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : video.quality_score >= 4
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {video.quality_score.toFixed(1)}점
                        </span>
                      )}
                      {video.is_analyzed && video.content_type && video.content_type !== 'unknown' && (
                        <span className="px-1.5 py-0.5 rounded-full text-[7px] md:text-[8px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {video.content_type}
                        </span>
                      )}
                      {video.keyword && (
                        <span className="px-1.5 py-0.5 rounded-full text-[7px] md:text-[8px] font-black bg-white/5 text-slate-400 border border-white/10 truncate max-w-[160px]">
                          #{video.keyword}
                        </span>
                      )}
                    </div>

                    <div className="p-3 md:p-6 flex flex-col flex-grow">
                      <div className="flex items-center justify-between mb-1.5 md:mb-2">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#a78bfa]/20 flex items-center justify-center text-[#a78bfa] text-[6px] md:text-[8px]">
                            <FontAwesomeIcon icon={faLink} />
                          </div>
                          <span className="text-[7px] md:text-[10px] font-black text-[#a78bfa] tracking-wider uppercase truncate max-w-[80px] md:max-w-[120px]">
                            {video.channelName}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-white/5 rounded text-[6px] md:text-[8px] font-black text-slate-500 border border-white/10 uppercase truncate max-w-[60px]">
                          keyword
                        </span>
                      </div>

                      <h4 className="text-[11px] md:text-sm font-black text-white group-hover:text-[#a78bfa] transition-colors line-clamp-2 mb-2 md:mb-3 leading-snug">
                        {video.videoTitle}
                      </h4>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-y-2 md:gap-y-3 gap-x-2 md:gap-x-4 mb-3 md:mb-4 pt-2 md:pt-3 border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faUsers}    className="text-slate-600 text-[8px]" />
                          <div className="flex flex-col">
                            <span className="text-[6px] font-black text-slate-600 uppercase leading-none mb-0.5">Subs</span>
                            <span className="text-[9px] md:text-[11px] font-bold text-slate-300">{video.subscribers}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faEye}      className="text-slate-600 text-[8px]" />
                          <div className="flex flex-col">
                            <span className="text-[6px] font-black text-slate-600 uppercase leading-none mb-0.5">Views</span>
                            <span className="text-[9px] md:text-[11px] font-bold text-slate-300">{video.views}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faThumbsUp} className="text-slate-600 text-[8px]" />
                          <div className="flex flex-col">
                            <span className="text-[6px] font-black text-slate-600 uppercase leading-none mb-0.5">Likes</span>
                            <span className="text-[9px] md:text-[11px] font-bold text-slate-300">{video.likes}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faComment}  className="text-slate-600 text-[8px]" />
                          <div className="flex flex-col">
                            <span className="text-[6px] font-black text-slate-600 uppercase leading-none mb-0.5">Comments</span>
                            <span className="text-[9px] md:text-[11px] font-bold text-slate-300">{video.comments}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-col gap-1.5 pt-2 md:pt-3 border-t border-white/5">
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-[#a78bfa]/10 hover:bg-[#a78bfa] text-[#a78bfa] hover:text-white rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black transition-all group/btn"
                        >
                          영상 바로가기
                          <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[6px] md:text-[8px] group-hover/btn:translate-x-0.5 transition-transform" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-[#a78bfa]/10 hover:text-[#a78bfa] disabled:opacity-30 transition-all"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <div className="flex gap-2">
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-xl border font-black text-xs transition-all ${
                        currentPage === page
                          ? 'bg-[#a78bfa] border-[#a78bfa] text-white shadow-lg shadow-[#a78bfa]/20'
                          : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-[#a78bfa]/10 hover:text-[#a78bfa] disabled:opacity-30 transition-all"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          )}
        </section>

        {/* Guide */}
        <section className="bg-[#1c1c2e] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <h4 className="text-xl font-black mb-8 flex items-center justify-center gap-3">
            <FontAwesomeIcon icon={faDatabase} className="text-[#a78bfa]" /> 키워드 수집 운영 가이드
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-[#a78bfa] font-black text-xs mb-3 uppercase">Rule 01. 키워드 전략</div>
              <p className="text-slate-400 text-xs leading-relaxed font-bold">광범위한 키워드보다 롱테일 키워드를 사용하여 세분화된 트렌드를 포착하세요.</p>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-[#a78bfa] font-black text-xs mb-3 uppercase">Rule 02. 수집 빈도</div>
              <p className="text-slate-400 text-xs leading-relaxed font-bold">급상승 키워드는 매시간 수집을 통해 실시간 반응을 모니터링하는 것이 좋습니다.</p>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-[#a78bfa] font-black text-xs mb-3 uppercase">Rule 03. 데이터 활용</div>
              <p className="text-slate-400 text-xs leading-relaxed font-bold">수집된 고효율 영상의 썸네일과 제목 패턴을 분석하여 자신의 콘텐츠에 적용하세요.</p>
            </div>
          </div>
        </section>
      </main>

      {selectedVideo && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]" onClick={() => setSelectedVideo(null)} />
          <aside className="fixed top-0 right-0 w-full md:w-[560px] h-full bg-[#0f0f1a] border-l border-white/10 z-[10001] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] flex flex-col">

            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-[#1c1c2e]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/10 flex items-center justify-center text-[#a78bfa]">
                  <FontAwesomeIcon icon={faTv} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-none mb-1">영상 상세 분석</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#a78bfa] tracking-widest uppercase">{selectedVideo.channelName}</span>
                    {selectedVideo.keyword && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/5 text-slate-400 border border-white/10">
                        #{selectedVideo.keyword}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="w-10 h-10 rounded-full bg-white/5 text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                <img src={selectedVideo.thumbnail} alt={selectedVideo.videoTitle} className="w-full object-cover aspect-video" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] to-transparent opacity-40"></div>
                <a
                  href={selectedVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="w-16 h-16 rounded-full bg-[#a78bfa] text-white flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xl" />
                  </div>
                </a>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white leading-tight">{selectedVideo.videoTitle}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                  {selectedVideo.description || "영상 설명이 없습니다."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1c1c2e] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Subscribers</div>
                    <div className="text-lg font-black text-white">{selectedVideo.subscribers}</div>
                  </div>
                </div>
                <div className="bg-[#1c1c2e] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <FontAwesomeIcon icon={faEye} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Total Views</div>
                    <div className="text-lg font-black text-white">{selectedVideo.views}</div>
                  </div>
                </div>
                <div className="bg-[#1c1c2e] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                    <FontAwesomeIcon icon={faThumbsUp} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Likes</div>
                    <div className="text-lg font-black text-white">{selectedVideo.likes}</div>
                  </div>
                </div>
                <div className="bg-[#1c1c2e] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <FontAwesomeIcon icon={faComment} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Comments</div>
                    <div className="text-lg font-black text-white">{selectedVideo.comments}</div>
                  </div>
                </div>
              </div>

              {(() => {
                const score = selectedVideo.viral_score != null ? selectedVideo.viral_score : calcViralScore(selectedVideo);
                const vid = selectedVideo.video_id ?? commentsVideoId;
                if (score < 30) return null;
                return (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <FontAwesomeIcon icon={faComment} className="text-[#a78bfa]" />
                      Comments (Top 20)
                    </label>
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => fetchComments(vid)}
                          disabled={commentsLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl border border-white/10 transition-all disabled:opacity-50"
                        >
                          {commentsLoading
                            ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /><span>불러오는 중...</span></>
                            : <><FontAwesomeIcon icon={faComment} /><span>댓글 불러오기</span></>
                          }
                        </button>
                        {commentsList.length > 0 && (
                          <div className="text-[10px] font-black text-slate-500">
                            {commentsList.length}개
                          </div>
                        )}
                      </div>

                      {commentsError && (
                        <div className="text-[11px] font-bold text-red-300 break-words">
                          {commentsError}
                        </div>
                      )}

                      {commentsList.length > 0 && (
                        <div className="max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/20">
                          {commentsList.map((c, i) => (
                            <div key={`${c.author}-${i}`} className="px-4 py-3 border-b border-white/5 last:border-b-0">
                              <div className="flex items-center gap-2">
                                {c.authorChannelUrl ? (
                                  <a
                                    href={c.authorChannelUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-black text-slate-200 hover:text-white"
                                  >
                                    {c.author || 'unknown'}
                                  </a>
                                ) : (
                                  <div className="text-[10px] font-black text-slate-200">{c.author || 'unknown'}</div>
                                )}
                                {typeof c.likeCount === 'number' && (
                                  <div className="ml-auto text-[10px] font-black text-slate-500">
                                    👍 {c.likeCount}
                                  </div>
                                )}
                              </div>
                              <div className="text-[11px] font-bold text-slate-300 mt-2 leading-relaxed break-words whitespace-pre-wrap">
                                {c.text}
                              </div>
                              {(c.replyCount != null || c.publishedAt) && (
                                <div className="text-[10px] font-bold text-slate-600 mt-2 flex items-center gap-3">
                                  {c.replyCount != null && <span>답글 {c.replyCount}</span>}
                                  {c.publishedAt && <span>{c.publishedAt}</span>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <FontAwesomeIcon icon={faRobot} className="text-[#a78bfa]" />
                  AI Analysis Content
                </label>
                <div className="space-y-4">
                  {selectedVideo.is_analyzed && selectedVideo.viral_reason && (
                    <div className="bg-red-500/5 rounded-2xl p-6 border border-red-500/20 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 text-xs">
                          🔥
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">왜 떡상했나</h4>
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/30">
                          성공 방정식 기반
                        </span>
                      </div>
                      <p className="text-red-200/80 text-xs leading-relaxed font-bold pl-11">
                        {selectedVideo.viral_reason}
                      </p>
                    </div>
                  )}

                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/20 flex items-center justify-center text-[#a78bfa] text-xs">
                        <FontAwesomeIcon icon={faInfoCircle} />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">영상 핵심 요약</h4>
                      {selectedVideo.is_analyzed && selectedVideo.quality_score != null && (
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[9px] font-black border ${
                          selectedVideo.quality_score >= 7
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : selectedVideo.quality_score >= 4
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          품질 {selectedVideo.quality_score.toFixed(1)}점
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed font-bold pl-11">
                      {selectedVideo.is_analyzed
                        ? (selectedVideo.summary || '요약 없음')
                        : '분석 전입니다. 30점 이상 영상만 AI 분석이 가능합니다.'}
                    </p>
                  </div>

                  {selectedVideo.is_analyzed && (
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                          <FontAwesomeIcon icon={faFileAlt} />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">콘텐츠 분석</h4>
                        {selectedVideo.content_type && selectedVideo.content_type !== 'unknown' && (
                          <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {selectedVideo.content_type}
                          </span>
                        )}
                      </div>
                      <div className="pl-11">
                        {selectedVideo.summary === '자막 없음' && (
                          <p className="text-slate-500 text-xs font-bold">자막을 사용할 수 없는 영상입니다.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-white/10 bg-[#1c1c2e]">
              <div className="flex gap-3">
                <a
                  href={selectedVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gradient-to-r from-[#a78bfa] to-[#6366f1] hover:from-[#b79cff] hover:to-[#7477ff] text-white font-black py-4 rounded-xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  유튜브에서 보기
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
                </a>
                <button className="px-6 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-xl border border-white/10 transition-all active:scale-[0.98]">
                  데이터 다운로드
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
