'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTv, faSearch, faPlus, faTrash, faArrowRight, 
  faSync, faCheckCircle, faSpinner, faLink, faBolt,
  faCircleNodes,
  faNetworkWired,
  faDatabase,
  faUsers,
  faEye,
  faThumbsUp,
  faComment,
  faExternalLinkAlt,
  faTimes,
  faChevronRight,
  faInfoCircle,
  faFileAlt,
  faRobot,
  faChevronLeft,
  faChevronRight as faChevronRightSolid
} from '@fortawesome/free-solid-svg-icons';

// --- Step Component for Visual Flow ---
const Step = ({ label, desc, active = false }: { label: string, desc: string, active?: boolean }) => (
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
  const subs = parseKorNum(video.subscribers);
  const likes = parseKorNum(video.likes);
  const comments = parseKorNum(video.comments);
  if (!subs || !views) return 0;
  const viewRatio = (views / subs) * 100;
  const engagement = ((likes + comments * 5) / views) * 100;
  return Math.round(viewRatio * (1 + engagement * 0.05) * 10) / 10;
}

function getScoreTier(score: number): { emoji: string; color: string; label: string } {
  if (score >= 30) return { emoji: '🔥', color: 'bg-red-500/80 text-white border-red-400/50', label: '떡상' };
  if (score >= 15) return { emoji: '⚡', color: 'bg-yellow-500/80 text-black border-yellow-400/50', label: '상승중' };
  if (score >= 8)  return { emoji: '📈', color: 'bg-green-500/80 text-white border-green-400/50', label: '관심' };
  return { emoji: '💤', color: 'bg-slate-600/80 text-slate-300 border-slate-500/50', label: '보통' };
}

// --- Video type ---
type VideoItem = {
  id: number;
  channelName: string;
  videoTitle: string;
  description: string;
  thumbnail: string;
  url: string;
  subscribers: string;
  views: string;
  likes: string;
  comments: string;
  status: 'active';
  collectedAt: string;
  viral_score?: number;
};


export default function ChannelCrawlingPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [isFetching, setIsFetching] = useState(true);
  const [newChannelUrls, setNewChannelUrls] = useState<string[]>(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [progressMsg, setProgressMsg] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(totalVideos / itemsPerPage);

  // Load videos from API
  const loadVideos = useCallback(async (page = 1) => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      const res = await fetch(`/api/youtube/videos?${params.toString()}`);
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      setVideos(json.videos || []);
      setTotalVideos(json.total || 0);
    } catch (e) {
      console.error('Failed to load videos', e);
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadVideos(1);
  }, [loadVideos]);

  // Pagination Effect: current page should not exceed total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadVideos(page);
  };

  const currentVideos = videos;

  const handleUrlChange = (index: number, value: string) => {
    const updated = [...newChannelUrls];
    updated[index] = value;
    setNewChannelUrls(updated);
  };

  const handleAddChannel = async () => {
    const activeUrls = newChannelUrls.filter(url => url.trim() !== '');
    if (activeUrls.length === 0) return alert('최소 하나의 유튜브 URL을 입력해주세요.');

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    const invalidUrls = activeUrls.filter(url => !youtubeRegex.test(url));
    if (invalidUrls.length > 0) {
      return alert(`올바르지 않은 유튜브 URL이 포함되어 있습니다:\n${invalidUrls.join('\n')}`);
    }

    setIsLoading(true);
    setProgressMsg('크롤링 시작 중...');

    try {
      const res = await fetch('/api/youtube/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: activeUrls, genre: 'general', max_results: 30 }),
      });

      if (!res.ok || !res.body) {
        throw new Error('API request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let totalSaved = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(trimmed.slice(6));
            if (event.type === 'progress') {
              setProgressMsg(`처리 중 (${event.count}/${event.total}): ${event.url} — ${event.saved ?? 0}개 저장`);
            } else if (event.type === 'done') {
              totalSaved = event.total_saved ?? 0;
              setProgressMsg(`완료! 총 ${totalSaved}개 영상 저장됨`);
            } else if (event.type === 'error') {
              console.error('Crawl error:', event.message);
              setProgressMsg(`오류: ${event.message}`);
            }
          } catch { /* non-JSON */ }
        }
      }

      setNewChannelUrls(['', '', '', '', '']);
      await loadVideos(1);
      setCurrentPage(1);
      alert(`크롤링 완료! 총 ${totalSaved}개 영상이 저장되었습니다.`);
    } catch (e) {
      console.error('handleAddChannel error:', e);
      alert('크롤링 중 오류가 발생했습니다. 콘솔을 확인해 주세요.');
    } finally {
      setIsLoading(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="bg-[#0f0f1a] min-h-screen text-white pb-24 font-sans antialiased">
      {/* Hero Header */}
      <header 
        className="relative pt-24 pb-32 text-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/img/crawling/channel/youtube_top_bg.webp')" }}
      >
        {/* Background Overlay for readability */}
        <div className="absolute inset-0 bg-[#0f0f1a]/70"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#6366f1_0%,transparent_70%)]"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[#a78bfa] text-xs font-bold tracking-wider mb-6 uppercase">
            <FontAwesomeIcon icon={faCircleNodes} /> YouTube Video Collector
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tighter">
            유튜브 영상(채널별) <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] to-[#6366f1]">수집기</span>
          </h1>
          {/* Viral Score Formula */}
          <div className="max-w-2xl mx-auto mt-2 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-left">
            <p className="text-[11px] font-black text-[#a78bfa] uppercase tracking-widest mb-3">📊 떡상 점수 산출 공식</p>
            <div className="font-mono text-sm text-white/90 bg-black/30 rounded-xl px-4 py-3 mb-4 leading-relaxed">
              점수 = (조회수 ÷ 구독자수 × 100) × (1 + 참여율 × 0.05)<br />
              <span className="text-slate-400 text-xs">참여율 = (좋아요 + 댓글×5) ÷ 조회수 × 100</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-bold">
              <div className="flex items-center gap-2 bg-red-500/15 border border-red-400/30 rounded-xl px-3 py-2">
                <span>🔥</span>
                <div>
                  <div className="text-red-400">30점 이상</div>
                  <div className="text-slate-500 font-medium">떡상</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-yellow-500/15 border border-yellow-400/30 rounded-xl px-3 py-2">
                <span>⚡</span>
                <div>
                  <div className="text-yellow-400">15점 이상</div>
                  <div className="text-slate-500 font-medium">상승중</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-500/15 border border-green-400/30 rounded-xl px-3 py-2">
                <span>📈</span>
                <div>
                  <div className="text-green-400">8점 이상</div>
                  <div className="text-slate-500 font-medium">관심</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-700/50 border border-slate-600/30 rounded-xl px-3 py-2">
                <span>💤</span>
                <div>
                  <div className="text-slate-400">8점 미만</div>
                  <div className="text-slate-500 font-medium">보통</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 space-y-12">
        
        {/* 1. Intro & Registration Section (1 Column) */}
        <section className="bg-[#1c1c2e] rounded-[32px] border border-white/5 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Intro Content */}
            <div className="p-10 lg:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/5">
              <h3 className="text-3xl font-black leading-tight mb-6">
                유튜브 채널<br/>
                <span className="text-[#a78bfa]">데이터 수집 자동화</span>
              </h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
                일일이 채널을 방문할 필요 없습니다. <br/>
                수집할 유튜브 채널이나 영상 주소만 등록하면 <br/>
                AI가 실시간으로 데이터를 추출하고 분석합니다.
              </p>

              {/* Flow Visual */}
              <div className="bg-white/5 p-6 rounded-2xl border border-dashed border-white/10">
                <div className="flex items-center gap-2 text-[#a78bfa] font-black text-[10px] uppercase tracking-widest mb-6">
                  <FontAwesomeIcon icon={faBolt} />
                  유튜브 전용 자동화 프로세스
                </div>
                <div className="space-y-5 relative">
                  <div className="absolute left-[3.5px] top-2 bottom-2 w-[1px] bg-white/5" />
                  <Step label="YouTube Monitoring" desc="구독 채널 신규 콘텐츠 감시" active />
                  <Step label="Channel Detection" desc="영상 기반 채널 정보 자동 추출" active />
                  <Step label="Deep Extraction" desc="메타데이터 및 미디어 추출" />
                  <Step label="Dashboard Sync" desc="수집 데이터 통합 보고" />
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <div className="p-10 lg:p-12 bg-white/[0.02]">
              <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                <FontAwesomeIcon icon={faPlus} className="text-[#a78bfa]" />
                수집 채널/영상 추가
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">YouTube URLs (Max 5)</label>
                  <div className="space-y-3">
                    {newChannelUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <input 
                          type="text" 
                          value={url}
                          onChange={(e) => handleUrlChange(index, e.target.value)}
                          placeholder={`유튜브 URL ${index + 1}`}
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
                  onClick={handleAddChannel}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#a78bfa] to-[#6366f1] hover:from-[#b79cff] hover:to-[#7477ff] text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mt-4"
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      <span className="text-sm truncate max-w-[260px]">{progressMsg || '처리 중...'}</span>
                    </>
                  ) : (
                    <>
                      <span>일괄 분석 및 등록</span>
                      <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    </>
                  )}
                </button>

                <div className="p-5 bg-[#a78bfa]/5 rounded-2xl border border-[#a78bfa]/10">
                  <h4 className="text-xs font-black text-[#a78bfa] mb-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    수집 팁
                  </h4>
                  <ul className="text-[11px] font-bold text-slate-500 space-y-1.5 list-disc list-inside">
                    <li>유튜브 채널 홈 주소를 입력해 주세요.</li>
                    <li>특정 영상 주소(shorts 포함) 입력 시 채널을 자동 감지합니다.</li>
                    <li>최대 5개까지 동시 처리가 가능합니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Managed Videos Section (Full Width) */}
        <section className="bg-[#1c1c2e] p-10 rounded-[32px] shadow-xl border border-white/5">
          <div className="flex flex-wrap items-center justify-between mb-8 px-2 gap-4">
            <h3 className="text-xl font-black flex items-center gap-3">
              <FontAwesomeIcon icon={faTv} className="text-[#a78bfa]" />
              현재 수집된 유튜브 영상
              <span className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-black text-slate-500 border border-white/10">
                TOTAL {totalVideos}
              </span>
            </h3>
          </div>

          {/* Loading skeleton */}
          {isFetching && (
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4 mb-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 overflow-hidden">
                  <div className="h-32 md:h-48 bg-white/5 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-2 bg-white/5 rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 bg-white/5 rounded animate-pulse w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={`grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4 ${isFetching ? 'opacity-40 pointer-events-none' : ''}`}>
            {currentVideos.map((video) => (
              <div key={video.id} className="group bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 transition-all overflow-hidden flex flex-col shadow-lg">
                {/* Thumbnail Area - Click to open details */}
                <div 
                  className="relative h-32 md:h-48 overflow-hidden cursor-pointer" 
                  onClick={() => setSelectedVideo(video)}
                >
                  <img 
                    src={video.thumbnail} 
                    alt={video.videoTitle}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c2e] to-transparent opacity-60"></div>
                  {/* Viral Score Badge */}
                  {(() => {
                    const score = video.viral_score != null ? video.viral_score : calcViralScore(video);
                    const tier = getScoreTier(score);
                    return (
                      <div className={`absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border backdrop-blur-sm ${tier.color}`}>
                        <span>{tier.emoji}</span>
                        <span>{score}</span>
                      </div>
                    );
                  })()}
                  <div className="absolute top-2 md:top-4 right-2 md:right-4 flex gap-1.5 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      title="동기화" 
                      onClick={(e) => { e.stopPropagation(); /* Sync Logic */ }}
                      className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-[#a78bfa] transition-all shadow-sm"
                    >
                      <FontAwesomeIcon icon={faSync} className="text-[10px] md:text-xs" />
                    </button>
                    <button 
                      title="삭제" 
                      onClick={(e) => { e.stopPropagation(); /* Delete Logic */ }}
                      className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-red-500 transition-all shadow-sm"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-[10px] md:text-xs" />
                    </button>
                  </div>
                </div>

                {/* Collected Date Badge - Centered below thumbnail */}
                <div className="flex justify-center -mt-3 relative z-10">
                  <span className="px-2 md:px-4 py-0.5 md:py-1 bg-[#1c1c2e] border border-white/10 rounded-full text-[7px] md:text-[9px] font-black text-[#a78bfa] shadow-2xl backdrop-blur-md">
                    수집일: {video.collectedAt}
                  </span>
                </div>
                
                {/* Content Area */}
                <div className="p-3 md:p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                    <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#a78bfa]/20 flex items-center justify-center text-[#a78bfa] text-[6px] md:text-[8px]">
                      <FontAwesomeIcon icon={faLink} />
                    </div>
                    <span className="text-[7px] md:text-[10px] font-black text-[#a78bfa] tracking-wider uppercase truncate">{video.channelName}</span>
                  </div>
                  
                  <h4 className="text-[11px] md:text-sm font-black text-white group-hover:text-[#a78bfa] transition-colors line-clamp-2 mb-3 md:mb-4 leading-snug">
                    {video.videoTitle}
                  </h4>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-y-2 md:gap-y-3 gap-x-2 md:gap-x-4 mb-4 md:mb-6 pt-3 md:pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <FontAwesomeIcon icon={faUsers} className="text-slate-600 text-[8px] md:text-[10px]" />
                      <div className="flex flex-col">
                        <span className="text-[6px] md:text-[8px] font-black text-slate-600 uppercase leading-none mb-0.5">Subs</span>
                        <span className="text-[9px] md:text-[11px] font-bold text-slate-300">{video.subscribers}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <FontAwesomeIcon icon={faEye} className="text-slate-600 text-[8px] md:text-[10px]" />
                      <div className="flex flex-col">
                        <span className="text-[6px] md:text-[8px] font-black text-slate-600 uppercase leading-none mb-0.5">Views</span>
                        <span className="text-[9px] md:text-[11px] font-bold text-slate-300">{video.views}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <FontAwesomeIcon icon={faThumbsUp} className="text-slate-600 text-[8px] md:text-[10px]" />
                      <div className="flex flex-col">
                        <span className="text-[6px] md:text-[8px] font-black text-slate-600 uppercase leading-none mb-0.5">Likes</span>
                        <span className="text-[9px] md:text-[11px] font-bold text-slate-300">{video.likes}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <FontAwesomeIcon icon={faComment} className="text-slate-600 text-[8px] md:text-[10px]" />
                      <div className="flex flex-col">
                        <span className="text-[6px] md:text-[8px] font-black text-slate-600 uppercase leading-none mb-0.5">Comments</span>
                        <span className="text-[9px] md:text-[11px] font-bold text-slate-300">{video.comments}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto flex justify-center pt-3 md:pt-4 border-t border-white/5">
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
            ))}
          </div>

          {/* ── Pagination UI ── */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-[#a78bfa]/10 hover:text-[#a78bfa] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>

              <div className="flex gap-2">
                {[...Array(Math.min(totalPages, 10))].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-10 h-10 rounded-xl border font-black text-xs transition-all ${
                      currentPage === i + 1
                        ? 'bg-[#a78bfa] border-[#a78bfa] text-white shadow-lg shadow-[#a78bfa]/20'
                        : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-[#a78bfa]/10 hover:text-[#a78bfa] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
              >
                <FontAwesomeIcon icon={faChevronRightSolid} />
              </button>
            </div>
          )}

          {/* Empty Hint */}
          <div className="mt-8 p-12 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-2xl text-slate-600">
              <FontAwesomeIcon icon={faNetworkWired} />
            </div>
            <p className="text-sm font-bold text-slate-500">
              추가 채널을 등록하여 수집 범위를 넓히세요.
            </p>
          </div>
        </section>

        {/* 3. Crawling Guide Section (Full Width) */}
        <section className="bg-[#1c1c2e] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <h4 className="text-xl font-black mb-8 flex items-center justify-center gap-3">
            <FontAwesomeIcon icon={faDatabase} className="text-[#a78bfa]" /> 유튜브 수집 운영 가이드
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="text-[#a78bfa] font-black text-xs mb-3 tracking-widest uppercase">Rule 01. 유튜브 정책 준수</div>
              <p className="text-slate-400 text-xs leading-relaxed font-bold">YouTube API 정책을 준수하며, 수집된 데이터는 개인 창작 및 인사이트 분석 용도로만 활용할 것을 권장합니다.</p>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="text-[#a78bfa] font-black text-xs mb-3 tracking-widest uppercase">Rule 02. 수집 최적화</div>
              <p className="text-slate-400 text-xs leading-relaxed font-bold">채널의 규모에 따라 <b>일일</b> 또는 <b>주간</b> 수집 설정을 조절하여 효율적으로 데이터를 관리하세요.</p>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="text-[#a78bfa] font-black text-xs mb-3 tracking-widest uppercase">Rule 03. AI 정제 프로세스</div>
              <p className="text-slate-400 text-xs leading-relaxed font-bold">수집된 영상의 자막과 메타데이터는 <b>AI 엔진</b>을 통해 핵심 요약 및 포맷 변환 과정을 거칩니다.</p>
            </div>
          </div>
        </section>

      </main>

      {/* ── Video Detail Side Panel ── */}
      {selectedVideo && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]" onClick={() => setSelectedVideo(null)} />
          <aside className="fixed top-0 right-0 w-full md:w-[560px] h-full bg-[#0f0f1a] border-l border-white/10 z-[10001] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] flex flex-col">

            {/* Panel Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-[#1c1c2e]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/10 flex items-center justify-center text-[#a78bfa]">
                  <FontAwesomeIcon icon={faTv} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-none mb-1">영상 상세 분석</h2>
                  <span className="text-[10px] font-black text-[#a78bfa] tracking-widest uppercase">{selectedVideo.channelName}</span>
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
              {/* Thumbnail Large */}
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

              {/* Title & Description */}
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white leading-tight">{selectedVideo.videoTitle}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                  {selectedVideo.description || "영상 설명이 없습니다."}
                </p>
              </div>

              {/* Stats Detailed */}
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

              {/* AI Analysis Placeholder Section */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <FontAwesomeIcon icon={faRobot} className="text-[#a78bfa]" />
                  AI Analysis Content
                </label>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/20 flex items-center justify-center text-[#a78bfa] text-xs">
                        <FontAwesomeIcon icon={faInfoCircle} />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">영상 핵심 요약</h4>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed font-bold pl-11">
                      영상을 분석 중입니다. 잠시만 기다려 주세요...<br/>
                      AI가 영상의 스크립트를 추출하고 주요 포인트를 정리하여 이곳에 표시합니다.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                        <FontAwesomeIcon icon={faFileAlt} />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">추출된 스크립트</h4>
                    </div>
                    <div className="pl-11 space-y-2">
                      <div className="h-2 w-full bg-white/5 rounded-full"></div>
                      <div className="h-2 w-[80%] bg-white/5 rounded-full"></div>
                      <div className="h-2 w-[90%] bg-white/5 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Footer */}
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
