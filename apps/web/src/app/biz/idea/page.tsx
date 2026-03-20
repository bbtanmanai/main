'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faClipboard,
  faComment,
  faExternalLinkAlt,
  faFileAlt,
  faHashtag,
  faInfoCircle,
  faRobot,
  faSearch,
  faSpinner,
  faSync,
  faTv,
  faThumbsUp,
  faTimes,
  faUpload,
  faUsers,
  faEye,
} from '@fortawesome/free-solid-svg-icons';
import TextType from '@/components/TextType';

function parseKorNum(s: string): number {
  if (!s) return 0;
  const n = parseFloat(s);
  if (s.includes('만')) return n * 10000;
  if (s.includes('억')) return n * 100000000;
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

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildVideoScenes(text: string): string[] {
  const t = (text || '').replace(/\r\n/g, '\n').trim();
  if (!t) return [];

  const maxScenes = 200;

  const blocks = t
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const stripSceneLabel = (s: string) =>
    s
      .replace(/^(\[?\s*(씬|scene)\s*\d+\s*\]?\s*[:\-]?\s*)/i, '')
      .trim();

  if (blocks.length >= 2) return blocks.map(stripSceneLabel).filter(Boolean).slice(0, maxScenes);

  const lines = t
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const isSceneHeader = (l: string) => /^(\[?\s*(씬|scene)\s*\d+)\b/i.test(l);
  if (lines.some(isSceneHeader)) {
    const out: string[] = [];
    let current: string[] = [];
    for (const l of lines) {
      if (isSceneHeader(l)) {
        if (current.length > 0) out.push(stripSceneLabel(current.join('\n')).trim());
        current = [l];
      } else {
        current.push(l);
      }
    }
    if (current.length > 0) out.push(stripSceneLabel(current.join('\n')).trim());
    return out.filter(Boolean).slice(0, maxScenes);
  }

  const merged = lines.join(' ').trim();
  if (!merged) return [];
  const parts = merged
    .split(/(?:\.\s+|!\s+|\?\s+|다\.\s+)/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, maxScenes);
  return [merged];
}

type VideoItem = {
  created_at?: string;
  published_at?: string;
  id: number;
  video_id?: string;
  keyword?: string;
  channelName: string;
  videoTitle: string;
  description?: string;
  thumbnail: string;
  url: string;
  subscribers: string;
  views: string;
  likes: string;
  comments: string;
  collectedAt: string;
  viral_score?: number;
};

type SortMode = 'latest' | 'benchmark' | 'viral';
type SourceMode = 'yt_keyword' | 'yt_url' | 'upload_text';
type BizIdeaTab = 'idea' | 'youtube' | 'instagram' | 'facebook';

type SimilarScenario = {
  id: string;
  template_id: string;
  style: string;
  topic: string;
  created_at?: string;
  script: string;
  script_snippet?: string;
};

const YOUTUBE_DOWNLOAD_GUIDE_HTML = `
  <div class="container">
    <div class="box">
      <h1>유튜브 영상 자막 추출 방법</h1>
    </div>
    <div class="box">
      <h2>1. 웹사이트 이용 (설치 없이 가장 간편)</h2>
      <table class="link-table">
        <thead>
          <tr>
            <td style="width: 20%;" class="step-gray"><a href="https://downsub.com" target="_blank" rel="noopener noreferrer">DownSub (downsub.com)</a></td>
            <td>가장 대표적인 사이트입니다. 영상 주소를 넣으면 해당 영상에 포함된 모든 언어의 자막과 자동 생성된 자막을 목록으로 보여주며, 클릭 한 번으로 다운로드할 수 있습니다.</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="step-gray"><a href="https://savesubs.com" target="_blank" rel="noopener noreferrer">SaveSubs</a></td>
            <td>DownSub와 유사하며 인터페이스가 깔끔합니다. 자막 내용 중 특정 단어를 일괄 수정하거나 합치는 간단한 편집 기능도 제공합니다.</td>
          </tr>
          <tr>
            <td class="step-gray"><a href="https://www.tamindir.com/" target="_blank" rel="noopener noreferrer">Tamindir (유튜브 자막 추출기)</a></td>
            <td>군더더기 없이 빠르게 텍스트 형태(.txt)로 내용을 긁어오고 싶을 때 유용합니다.</td>
          </tr>
        </tbody>
      </table><br>
      <h2>2. 유튜브 자체 기능 (텍스트 복사 전용)</h2>
      <table class="link-table">
        <thead>
          <tr>
            <td>1. 추출하고 싶은 유튜브 영상을 엽니다.</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2. 영상 하단 제목 옆의 [... (더보기)] 버튼을 클릭합니다.</td>
          </tr>
          <tr>
            <td>3. 메뉴에서 **[스크립트 표시]**를 선택합니다.</td>
          </tr>
          <tr>
            <td>4. 오른쪽에 나타나는 자막 창에서 전체를 드래그하여 복사(Ctrl+C)한 뒤 메모장에 붙여넣기 하면 됩니다.</td>
          </tr>
          <tr>
            <td>
              <div class="tag-line">
                <span>팁: 타임스탬프(시간)를 지우고 싶다면 스크립트 창 우측 상단의 점 세 개 메뉴를 눌러 '타임스탬프 전환'을 클릭하세요.</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table><br>
    </div>

    <div class="box">
      <h1>유튜브 영상 다운로드 안내</h1>
    </div>

    <div class="box">
      <h2>1. 별도 설치 없는 웹사이트 방식 (가장 간편)</h2>
      <div class="tag-line">
        <span>프로그램 설치가 귀찮을 때 브라우저에서 바로 링크만 붙여넣어 사용하는 방식입니다.</span>
      </div>

      <table class="link-table">
        <thead>
          <tr>
            <td style="width: 25%;"><a href="https://y2mate.is/" target="_blank" rel="noopener noreferrer">VidsSave / Y2Mate</a></td>
            <td>가장 대중적인 사이트들입니다. 영상 주소를 복사해 입력창에 붙여넣기만 하면 화질별(MP4) 및 음원(MP3) 추출이 가능합니다.</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="cat-tip"><a href="https://cobalt.tools" target="_blank" rel="noopener noreferrer">Cobalt (cobalt.tools)</a></td>
            <td>최근 유행하는 오픈소스 도구로, 광고가 없고 인터페이스가 매우 깔끔한 것이 특징입니다. 유튜브뿐만 아니라 인스타그램, 틱톡 영상도 지원합니다.</td>
          </tr>
          <tr>
            <td class="cat-traffic"><a href="https://en.savefrom.net/" target="_blank" rel="noopener noreferrer">SaveFrom.net</a></td>
            <td>영상 주소의 youtube.com 앞에 ss를 붙여 ssyoutube.com...으로 접속하면 바로 다운로드 페이지로 연결되어 편리합니다.</td>
          </tr>
        </tbody>
      </table><br>

      <h2>2. PC용 프로그램 방식 (고화질 & 안정적)</h2>
      <div class="tag-line">
        <span>고화질(4K 이상) 영상을 받거나 여러 영상을 한꺼번에 받을 때 유리합니다.</span>
      </div>
      <table class="link-table">
        <thead>
          <tr>
            <td style="width: 25%;"><a href="https://www.4kdownload.com/products/videodownloader-42" target="_blank" rel="noopener noreferrer">4K Video Downloader Plus</a></td>
            <td>전 세계적으로 가장 유명한 툴입니다. 무료 버전은 하루 다운로드 횟수 제한이 있지만, 인터페이스가 직관적이고 8K 화질까지 완벽하게 지원합니다.</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="cat-tip"><a href="https://stacher.io/" target="_blank" rel="noopener noreferrer">Stacher (yt-dlp 기반)</a></td>
            <td>개발자들이 주로 쓰는 강력한 도구인 yt-dlp를 일반인도 쓰기 쉽게 만든 프로그램입니다. 무료이면서도 성능이 매우 강력합니다.</td>
          </tr>
        </tbody>
      </table><br>

      <h2>3. 브라우저 확장 프로그램 방식</h2>
      <div class="tag-line">
        <span>유튜브 영상 바로 아래에 '다운로드' 버튼을 만들어주는 방식입니다.</span>
      </div>
      <table class="link-table">
        <thead>
          <tr>
            <td style="width: 20%;"><a href="https://chromewebstore.google.com/search/Video%20Downloader%20Professional" target="_blank" rel="noopener noreferrer">Video Downloader Professional (크롬/엣지)</a></td>
            <td>브라우저에 추가해두면 영상 재생 시 아이콘을 클릭해 바로 저장할 수 있습니다.</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="cat-tip"><a href="https://addons.mozilla.org/en-US/firefox/search/?q=Easy%20Youtube%20Video%20Downloader%20Express" target="_blank" rel="noopener noreferrer">Easy Youtube Video Downloader Express (파이어폭스)</a></td>
            <td>파이어폭스 사용자들에게 가장 평점이 높은 원클릭 다운로드 도구입니다.</td>
          </tr>
        </tbody>
      </table><br>
    </div>
  </div>
`;

function sanitizeHelpHtml(html: string): string {
  const stripped = (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .trim();
  const bodyMatch = stripped.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return (bodyMatch ? bodyMatch[1] : stripped).trim();
}

export default function BizIdeaPage() {
  const [activeTab, setActiveTab] = useState<BizIdeaTab>('idea');
  const [sourceMode, setSourceMode] = useState<SourceMode>('yt_keyword');
  const [keyword, setKeyword] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeUrlLoading, setYoutubeUrlLoading] = useState(false);
  const [youtubeUrlStatus, setYoutubeUrlStatus] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualChannel, setManualChannel] = useState('');
  const [manualUrl, setManualUrl] = useState('');

  const [isCrawling, setIsCrawling] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [crawlErrors, setCrawlErrors] = useState<Array<{ keyword: string; message: string }>>([]);

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [totalVideos, setTotalVideos] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [pickDeck, setPickDeck] = useState<VideoItem[]>([]);
  const [pickIndex, setPickIndex] = useState(0);
  const [isPickOpen, setIsPickOpen] = useState(false);

  const [srtText, setSrtText] = useState('');
  const [srtSource, setSrtSource] = useState<'auto' | 'upload' | ''>('');
  const [srtStatus, setSrtStatus] = useState('');
  const [srtLoading, setSrtLoading] = useState(false);

  const [report, setReport] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportCopied, setReportCopied] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftDirty, setDraftDirty] = useState(false);
  const [draftFontSize, setDraftFontSize] = useState(12);
  const syncSceneHeights = useCallback(() => {
    const els = document.querySelectorAll<HTMLTextAreaElement>('textarea[data-video-scene="1"]');
    els.forEach((el) => {
      el.style.height = '0px';
      el.style.height = `${el.scrollHeight}px`;
    });
  }, []);

  const [similarScenario, setSimilarScenario] = useState<SimilarScenario | null>(null);
  const [similarScore, setSimilarScore] = useState(0);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState('');

  const selectedVideoId = selectedVideo?.video_id ?? '';
  const selectedScore = selectedVideo ? (selectedVideo.viral_score ?? calcViralScore(selectedVideo)) : 0;
  const selectedIsBenchmark = selectedVideo ? (selectedScore >= 30 && isRecent3Months(selectedVideo)) : false;

  const shuffle = <T,>(items: T[]): T[] => {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  };

  const getVideoScore = (v: VideoItem): number => (v.viral_score ?? calcViralScore(v));

  const buildPickDeck = useCallback((items: VideoItem[]) => {
    const list = items || [];
    const benchRecent = list.filter((v) => getVideoScore(v) >= 30 && isRecent3Months(v));
    const benchAll = list.filter((v) => getVideoScore(v) >= 30);
    const rest = list.filter((v) => getVideoScore(v) < 30);

    const uniq = (arr: VideoItem[]) => {
      const seen = new Set<string>();
      const out: VideoItem[] = [];
      for (const v of arr) {
        const k = v.video_id || String(v.id);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(v);
      }
      return out;
    };

    const prioritized = uniq([...benchRecent, ...benchAll, ...rest]).slice(0, 50);
    const deck = shuffle(prioritized);
    setPickDeck(deck);
    setPickIndex(0);
  }, []);

  const openPickModal = useCallback((items?: VideoItem[]) => {
    const base = items ?? videos;
    buildPickDeck(base);
    setIsPickOpen(true);
  }, [buildPickDeck, videos]);

  const nextPickBatch = useCallback(() => {
    setPickIndex((prev) => {
      const next = prev + 4;
      if (next < pickDeck.length) return next;
      const reshuffled = shuffle(pickDeck);
      setPickDeck(reshuffled);
      return 0;
    });
  }, [pickDeck]);

  const currentPickBatch = useMemo(() => pickDeck.slice(pickIndex, pickIndex + 4), [pickDeck, pickIndex]);

  const loadVideos = useCallback(async (page: number, sort: SortMode) => {
    if (sourceMode !== 'yt_keyword') return [];
    if (!keyword.trim()) return [];
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        source: 'keyword',
        sort,
        kw: keyword.trim(),
      });
      const res = await fetch(`/api/youtube/videos?${params.toString()}`);
      const raw = await res.text();
      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`응답 파싱 실패: ${raw.slice(0, 500)}`);
      }
      if (!res.ok) {
        throw new Error(String(data?.error || `HTTP ${res.status}`));
      }
      if (data?.error) {
        throw new Error(String(data.error));
      }
      const list: VideoItem[] = data.videos || [];
      setVideos(list);
      setTotalVideos(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);
      return list;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      console.error('loadVideos error:', e);
      return [];
    } finally {
      setIsFetching(false);
    }
  }, [keyword, sourceMode, limit]);

  const loadKeywordVideos = useCallback(async () => {
    const bench = await loadVideos(1, 'benchmark');
    if (bench.length >= 4) return bench;
    const latest = await loadVideos(1, 'latest');
    const map = new Map<string, VideoItem>();
    for (const v of bench) map.set(v.video_id || String(v.id), v);
    for (const v of latest) map.set(v.video_id || String(v.id), v);
    return Array.from(map.values());
  }, [loadVideos]);

  useEffect(() => {
    setCurrentPage(1);
    if (sourceMode === 'yt_keyword') {
      loadKeywordVideos().then((list) => {
        buildPickDeck(list || []);
      });
    } else {
      setVideos([]);
      setTotalVideos(0);
      setTotalPages(1);
      setIsFetching(false);
    }
  }, [buildPickDeck, loadKeywordVideos, sourceMode]);

  useEffect(() => {
    setProgressMsg('');
    setCrawlErrors([]);
    setYoutubeUrlStatus('');
    setYoutubeUrlLoading(false);
    setSelectedVideo(null);
    setIsPickOpen(false);
    setPickDeck([]);
    setPickIndex(0);
    setSrtText('');
    setSrtSource('');
    setSrtStatus('');
    setReport('');
    setReportError('');
    setReportLoading(false);
    setReportCopied(false);
    if (sourceMode === 'yt_keyword') {
      setYoutubeUrl('');
      setManualTitle('');
      setManualChannel('');
      setManualUrl('');
    }
  }, [sourceMode]);

  const extractYouTubeVideoId = (url: string): string => {
    const u = (url || '').trim();
    if (!u) return '';
    const m1 = u.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (m1?.[1]) return m1[1];
    const m2 = u.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (m2?.[1]) return m2[1];
    const m3 = u.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (m3?.[1]) return m3[1];
    const m4 = u.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (m4?.[1]) return m4[1];
    return '';
  };

  const ingestYouTubeUrl = async () => {
    const url = youtubeUrl.trim();
    if (!url) return alert('유튜브 URL을 입력해주세요.');
    const vid = extractYouTubeVideoId(url);
    if (!vid) return alert('유효한 유튜브 URL이 아닙니다.');

    setYoutubeUrlLoading(true);
    setYoutubeUrlStatus('영상 정보를 수집 중...');
    try {
      const res = await fetch('/api/youtube/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: [url],
          max_results: 1,
          genre: 'general',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'URL 수집 실패');

      const params = new URLSearchParams({ page: '1', limit: '1', video_id: vid });
      const res2 = await fetch(`/api/youtube/videos?${params.toString()}`);
      const data = await res2.json();
      const v = Array.isArray(data?.videos) ? data.videos[0] : null;
      if (!v) throw new Error('영상 정보를 불러오지 못했습니다.');
      setVideos([v]);
      setSelectedVideo(v);
      setTotalVideos(1);
      setTotalPages(1);
      setCurrentPage(1);
      setYoutubeUrlStatus('완료! 아래 영상에서 분석할 영상을 선택하세요.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'URL 수집 실패';
      setYoutubeUrlStatus(`오류: ${msg}`);
    } finally {
      setYoutubeUrlLoading(false);
    }
  };

  useEffect(() => {
    setSrtText('');
    setSrtSource('');
    setSrtStatus('');
    setReport('');
    setReportError('');
    setReportLoading(false);
    setSrtLoading(false);
    setSimilarScenario(null);
    setSimilarScore(0);
    setSimilarLoading(false);
    setSimilarError('');
    setDraftCopied(false);
    setDraftText('');
    setDraftDirty(false);
  }, [selectedVideoId]);

  useEffect(() => {
    const next = String(similarScenario?.script || similarScenario?.script_snippet || '').trim();
    if (!next) {
      setDraftText('');
      setDraftDirty(false);
      return;
    }
    setDraftText(next);
    setDraftDirty(false);
  }, [similarScenario?.script, similarScenario?.script_snippet]);

  useEffect(() => {
    requestAnimationFrame(() => syncSceneHeights());
  }, [draftText, draftFontSize, syncSceneHeights]);

  useEffect(() => {
    const onResize = () => syncSceneHeights();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [syncSceneHeights]);

  const videoScenes = useMemo(() => buildVideoScenes(draftText), [draftText]);

  const handleCrawl = async () => {
    const kw = keyword.trim();
    if (!kw) return alert('키워드를 1개 입력해주세요.');

    setIsCrawling(true);
    setCrawlErrors([]);
    setProgressMsg('수집 준비 중...');

    let errorsCount = 0;
    let totalSaved = 0;
    let verifiedCount: number | null = null;
    let verifiedHost = '';
    let verifiedError = '';
    let noResultsReason = '';

    try {
      const res = await fetch('/api/youtube/keyword-crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: [kw], max_results: 50, regionCode: 'KR' }),
      });

      if (!res.ok) {
        const raw = await res.text();
        let detail = raw.trim();
        try {
          const j = JSON.parse(raw);
          detail = String(j?.error || j?.message || raw).trim();
        } catch {
          // ignore
        }
        throw new Error(`API 요청 실패 (${res.status}): ${detail || res.statusText}`);
      }
      if (!res.body) {
        throw new Error('서버 스트림 응답이 비어 있습니다. (SSE 지원/프록시 설정 확인 필요)');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
              const tier = String(ev.tier || '');
              const label =
                tier === 'benchmark'
                  ? '벤치마킹'
                  : tier === 'viral'
                  ? '떡상'
                  : tier === 'score15'
                  ? '15점+'
                  : tier === 'score8'
                  ? '8점+'
                  : '';
              const msg = String(ev.message || '').trim();
              if (msg) {
                setProgressMsg(msg);
              } else {
                setProgressMsg(`"${ev.keyword}" 수집 중... (${ev.count}/${ev.total}) ${ev.saved ?? 0}개 저장${label ? ` · ${label}` : ''}`);
              }
            } else if (ev.type === 'done') {
              totalSaved = ev.total_saved ?? 0;
              noResultsReason = String(ev.no_results_reason || '').trim();
            } else if (ev.type === 'verify') {
              verifiedCount = typeof ev.count === 'number' ? ev.count : Number(ev.count) || 0;
              verifiedHost = String(ev.host || '');
              verifiedError = String(ev.error || '');
            } else if (ev.type === 'error') {
              const message = String(ev.message || '알 수 없는 오류');
              const stderrTail = String(ev.stderr_tail || '').trim();
              const composed = stderrTail ? `${message}\n\n[stderr]\n${stderrTail}` : message;
              errorsCount += 1;
              setCrawlErrors(prev => [...prev, { keyword: kw, message: composed }]);
              setProgressMsg(`오류: ${message}`);
            }
          } catch {
            // ignore
          }
        }
      }

      if (totalSaved === 0) {
        setProgressMsg(noResultsReason || '기준 점수 미달로 수집 영상이 없습니다.');
        return;
      }

      const list = await loadKeywordVideos();
      if (Array.isArray(list) && list.length > 0) openPickModal(list);
      if (verifiedCount !== null && verifiedCount === 0 && totalSaved > 0) {
        const msg = `수집기는 저장 ${totalSaved}개로 보고했지만, DB 검증 결과 0개입니다.\n\n[Supabase]\n${verifiedHost || '(host unknown)'}\n${verifiedError ? `\n[verify error]\n${verifiedError}` : ''}`;
        errorsCount += 1;
        setCrawlErrors(prev => [...prev, { keyword: kw, message: msg }]);
        setProgressMsg('오류: DB 검증 실패 (0개)');
      } else if (totalSaved > 0 && list.length === 0) {
        let extra = '';
        try {
          const params = new URLSearchParams({
            page: '1',
            limit: String(limit),
            source: 'keyword',
            sort: 'latest',
            kw,
          });
          const r = await fetch(`/api/youtube/videos?${params.toString()}`);
          const raw = await r.text();
          extra = `\n\n[/api/youtube/videos]\nHTTP ${r.status}\n${raw.slice(0, 1500)}`;
        } catch (e) {
          const m = e instanceof Error ? e.message : 'unknown';
          extra = `\n\n[/api/youtube/videos 호출 실패]\n${m}`;
        }
        const msg = `저장 ${totalSaved}개로 표시되지만, 화면에 조회된 영상이 0개입니다.${extra}`;
        errorsCount += 1;
        setCrawlErrors(prev => [...prev, { keyword: kw, message: msg }]);
        setProgressMsg(`오류: 저장 후 조회 실패 (0개)`);
      } else {
        const finalSaved = verifiedCount !== null ? verifiedCount : totalSaved;
        setProgressMsg(errorsCount > 0 ? `완료! 총 ${finalSaved}개 저장, ${errorsCount}개 실패` : `완료! 총 ${finalSaved}개 저장`);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : '수집 중 오류가 발생했습니다.';
      errorsCount += 1;
      setCrawlErrors(prev => [...prev, { keyword: kw, message }]);
      setProgressMsg(`오류: ${message}`);
    } finally {
      setIsCrawling(false);
    }
  };

  const fetchSrt = async () => {
    if (!selectedVideoId) return;
    if (sourceMode !== 'yt_keyword' && sourceMode !== 'yt_url') return;
    setSrtLoading(true);
    setSrtStatus('');
    try {
      const params = new URLSearchParams({ video_id: selectedVideoId });
      const res = await fetch(`/api/youtube/transcript-srt?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '자막 조회 실패');
      setSrtText(String(json?.srt || ''));
      setSrtSource('auto');
      setSrtStatus(json?.generated ? `자동 자막(${json?.language || 'auto'})으로 추출됨` : `자막(${json?.language || 'unknown'})으로 추출됨`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '자막 조회 실패';
      setSrtStatus(msg);
      setSrtText('');
      setSrtSource('');
    } finally {
      setSrtLoading(false);
    }
  };

  const onUploadSrt = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      setSrtText(text);
      setSrtSource('upload');
      setSrtStatus(`업로드됨: ${file.name}`);
    } catch (e) {
      setSrtStatus(e instanceof Error ? e.message : '파일 읽기 실패');
    }
  };

  const generateReport = async () => {
    const vid = selectedVideoId || (sourceMode === 'upload_text' ? 'upload' : '');
    if (!vid) return;
    if (!srtText.trim()) return alert('자막/텍스트가 필요합니다. 업로드하거나 붙여넣기 해주세요.');

    setReportLoading(true);
    setReportError('');
    setDraftText('');
    setDraftDirty(false);
    try {
      const res = await fetch('/api/biz/idea/benchmark-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: vid,
          srt: srtText,
          title: selectedVideo?.videoTitle || manualTitle,
          channel: selectedVideo?.channelName || manualChannel,
          url: selectedVideo?.url || manualUrl,
          created_at: selectedVideo?.created_at,
          published_at: selectedVideo?.published_at,
          viral_score: selectedVideo?.viral_score,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '보고서 생성 실패');
      const nextReport = String(json?.report || '');
      setReport(nextReport);
      setSimilarScenario(null);
      setSimilarScore(0);
      setSimilarError('');
      setDraftText('');
      setDraftDirty(false);
      if (nextReport.trim()) {
        setSimilarLoading(true);
        try {
          const r2 = await fetch('/api/biz/idea/similar-scenario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: nextReport, limit: 80 }),
          });
          const j2 = await r2.json();
          if (!r2.ok) throw new Error(j2?.error || '유사 시나리오 조회 실패');
          setSimilarScenario(j2?.scenario || null);
          setSimilarScore(Number(j2?.score) || 0);
        } catch (e) {
          setSimilarError(e instanceof Error ? e.message : '유사 시나리오 조회 실패');
        } finally {
          setSimilarLoading(false);
        }
      }
    } catch (e) {
      setReportError(e instanceof Error ? e.message : '보고서 생성 실패');
      setReport('');
      setDraftText('');
      setDraftDirty(false);
    } finally {
      setReportLoading(false);
    }
  };

  const reportHeader = useMemo(() => {
    if (selectedVideo) return `${selectedVideo.channelName} · ${selectedVideo.videoTitle}`;
    const parts = [manualChannel.trim(), manualTitle.trim()].filter(Boolean);
    if (parts.length > 0) return parts.join(' · ');
    return '';
  }, [manualChannel, manualTitle, selectedVideo]);

  const youtubeGuideHtml = useMemo(() => sanitizeHelpHtml(YOUTUBE_DOWNLOAD_GUIDE_HTML), []);

  return (
    <div className="bg-[#0f0f1a] min-h-screen text-white pb-24 font-sans antialiased">
      <header
        className="relative pt-24 pb-28 text-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/img/biz/idea/idea_top_bg.webp')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f1a] via-[#1c1c2e] to-[#0f0f1a] opacity-85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(167,139,250,0.25),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(99,102,241,0.25),transparent_45%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-[5%] lg:px-[8%]">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-[#a78bfa]" />
            <span className="text-[#a78bfa] text-xs font-black uppercase tracking-[0.25em]">IDEA · BENCHMARK</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mb-3 leading-tight">
            <TextType
              as="span"
              text={['아이디어 리서치 벤치마킹 분석', '유튜브 트렌드 분석', '경쟁 콘텐츠 벤치마킹', '바이럴 아이디어 발굴']}
              typingSpeed={55}
              deletingSpeed={25}
              pauseDuration={2500}
              loop={true}
              showCursor={true}
              cursorCharacter="|"
              className="bg-gradient-to-r from-[#a78bfa] to-[#6366f1] bg-clip-text text-transparent"
              cursorClassName="text-[#a78bfa]"
            />
          </h1>
          <p className="text-slate-400 text-sm lg:text-base font-medium max-w-2xl mx-auto leading-relaxed">
            벤치마킹 소스에서 아이디어 초안을 만들고, 시나리오 작성으로 이어집니다.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {([
              { key: 'idea', label: '아이디어 추출', icon: faRobot },
              { key: 'youtube', label: '유튜브 영상 다운로드/자막 추출', icon: faTv },
              { key: 'instagram', label: '인스타 영상 다운로드', icon: faUpload },
              { key: 'facebook', label: '페이스북 다운로드', icon: faInfoCircle },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-3 rounded-2xl text-xs font-black border transition-all flex items-center gap-2 ${
                  activeTab === t.key
                    ? 'bg-[#a78bfa] text-white border-[#a78bfa]/50'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <FontAwesomeIcon icon={t.icon} className="text-[10px]" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-[5%] lg:px-[8%] -mt-16 relative z-20">
        {activeTab !== 'idea' && (
          <section className="bg-[#1c1c2e] p-10 rounded-[32px] shadow-xl border border-white/5">
            <div className="flex items-start justify-between gap-6 mb-8">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <FontAwesomeIcon icon={activeTab === 'youtube' ? faTv : activeTab === 'instagram' ? faUpload : faInfoCircle} className="text-[#a78bfa]" />
                  {activeTab === 'youtube'
                    ? '유튜브 영상 다운로드/자막 추출'
                    : activeTab === 'instagram'
                    ? '인스타 영상 다운로드'
                    : '페이스북 다운로드'}
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">
                  이 탭은 사용 방법만 안내하는 페이지입니다.
                </p>
              </div>
            </div>

            {activeTab === 'youtube' && (
              <div
                className="
                  [&_.container]:w-full [&_.container]:max-w-none
                  [&_.box]:bg-white/5 [&_.box]:border [&_.box]:border-white/10 [&_.box]:rounded-2xl [&_.box]:p-6 [&_.box]:mb-5
                  [&_.box_h1]:text-xl
                  [&_.box_h1]:font-black
                  [&_.box_h2]:text-lg
                  [&_.box_h2]:font-black
                  [&_.box_h3]:text-sm
                  [&_.box_h3]:font-black
                  [&_.box_p]:text-[12px]
                  [&_.box_p]:font-bold
                  [&_.box_p]:text-slate-300
                  [&_.box_li]:text-[12px]
                  [&_.box_li]:font-bold
                  [&_.box_li]:text-slate-300
                  [&_.tag-line]:inline-flex [&_.tag-line]:items-center [&_.tag-line]:gap-2 [&_.tag-line]:px-4 [&_.tag-line]:py-2 [&_.tag-line]:rounded-full
                  [&_.tag-line]:bg-[#a78bfa]/10 [&_.tag-line]:border [&_.tag-line]:border-[#a78bfa]/20
                  [&_.tag-line]:text-[12px] [&_.tag-line]:font-bold [&_.tag-line]:text-[#c4b5fd]
                  [&_.link-table]:w-full [&_.link-table]:border-collapse [&_.link-table]:text-[12px]
                  [&_.link-table_td]:border [&_.link-table_td]:border-white/10 [&_.link-table_td]:p-3 [&_.link-table_td]:align-top
                  [&_.step-gray]:bg-white/5 [&_.step-gray]:font-black
                  [&_.cat-tip]:bg-emerald-500/10
                  [&_.cat-traffic]:bg-blue-500/10
                  [&_.cat-produce]:bg-yellow-500/10
                  [&_.cat-plan]:bg-pink-500/10
                  [&_.cat-community]:bg-sky-500/10
                  [&_a]:text-[#a78bfa] [&_a:hover]:text-[#c4b5fd] [&_a:hover]:underline
                  [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-white [&_h1]:tracking-tight
                  [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-white [&_h2]:mt-4
                  [&_h3]:text-base [&_h3]:font-black [&_h3]:text-white [&_h3]:mt-3
                  [&_p]:text-[12px] [&_p]:font-bold [&_p]:text-slate-300 [&_p]:leading-relaxed
                  [&_li]:text-[12px] [&_li]:font-bold [&_li]:text-slate-300 [&_li]:leading-relaxed
                "
                dangerouslySetInnerHTML={{ __html: youtubeGuideHtml }}
              />
            )}

            {activeTab === 'instagram' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs font-black text-slate-300 mb-3">다운로드 안내</div>
                  <div className="text-[11px] font-bold text-slate-500 leading-relaxed">
                    인스타그램은 자동 추출/다운로드가 안정적으로 제공되기 어렵습니다. 가능한 경우에도 로그인/차단/정책 문제로 실패율이 높아, LinkDrop에서는 “사용자 업로드”를 기본 흐름으로 둡니다.
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs font-black text-slate-300 mb-3">LinkDrop 사용 방법</div>
                  <ol className="text-[11px] font-bold text-slate-500 space-y-2 list-decimal list-inside">
                    <li>릴스/영상 파일(mp4)을 준비합니다.</li>
                    <li>자막/대본이 있으면 SRT/TXT를 준비합니다(없으면 직접 텍스트로 정리).</li>
                    <li>“아이디어 추출” 탭에서 자막/텍스트 입력 후 보고서를 생성합니다.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTab === 'facebook' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs font-black text-slate-300 mb-3">다운로드 안내</div>
                  <div className="text-[11px] font-bold text-slate-500 leading-relaxed">
                    페이스북도 자동 다운로드는 권한/정책/접근 제한 영향이 큽니다. 따라서 LinkDrop에서는 사용자가 확보한 영상/텍스트를 업로드하는 방식으로 연결합니다.
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs font-black text-slate-300 mb-3">LinkDrop 사용 방법</div>
                  <ol className="text-[11px] font-bold text-slate-500 space-y-2 list-decimal list-inside">
                    <li>영상 파일(mp4)과 자막/설명 텍스트를 준비합니다.</li>
                    <li>“아이디어 추출” 탭에서 자막/텍스트 입력 후 보고서를 생성합니다.</li>
                  </ol>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'idea' && (
        <section className="mb-16">
          <div className="bg-[#1c1c2e] rounded-[32px] p-10 shadow-xl border border-white/5">
            <div className="flex items-start justify-between gap-6 mb-8">
              <div>
                <h2 className="text-xl font-black flex items-center gap-3">
                  <FontAwesomeIcon icon={faSearch} className="text-[#a78bfa]" />
                  소스 입력
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">
                  3가지 중 1가지만 입력하면 분석을 시작할 수 있습니다.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mode</div>
                  <div className="text-xs font-black text-white">
                    {sourceMode === 'yt_keyword'
                      ? 'YouTube Keyword'
                      : sourceMode === 'yt_url'
                      ? 'YouTube URL'
                      : 'Text Upload'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'yt_keyword', icon: faHashtag, title: '유튜브 키워드', desc: '키워드 1개로 수집' },
                  { key: 'yt_url', icon: faExternalLinkAlt, title: '유튜브 URL', desc: '영상 1개 바로 분석' },
                  { key: 'upload_text', icon: faFileAlt, title: '자막/텍스트', desc: 'SRT 또는 텍스트' },
                ] as const).map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setSourceMode(m.key)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      sourceMode === m.key
                        ? 'bg-[#a78bfa]/10 border-[#a78bfa]/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        sourceMode === m.key ? 'bg-[#a78bfa]/15 border-[#a78bfa]/30 text-[#a78bfa]' : 'bg-black/20 border-white/10 text-slate-400'
                      }`}>
                        <FontAwesomeIcon icon={m.icon} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-black ${sourceMode === m.key ? 'text-white' : 'text-slate-200'}`}>{m.title}</div>
                        <div className="text-[10px] font-bold text-slate-500 mt-1 line-clamp-1">{m.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                {sourceMode === 'yt_keyword' && (
                  <>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                      키워드 입력 (1개)
                    </label>
                    <div className="flex gap-3">
                      <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCrawl(); }}
                        placeholder="예: 혈압 낮추는 식품"
                        className="flex-1 px-5 py-4 bg-[#0f0f1a] border border-white/10 rounded-2xl text-white placeholder-slate-600 outline-none focus:border-[#a78bfa] focus:ring-4 focus:ring-[#a78bfa]/10 transition-all font-bold"
                      />
                      <button
                        onClick={handleCrawl}
                        disabled={isCrawling}
                        className="px-8 py-4 bg-gradient-to-r from-[#a78bfa] to-[#6366f1] hover:from-[#b79cff] hover:to-[#7477ff] text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-3 active:scale-[0.98] disabled:opacity-50"
                      >
                        {isCrawling ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faArrowRight} className="text-xs" />}
                        {isCrawling ? '수집 중' : '수집 시작'}
                      </button>
                    </div>
                  </>
                )}

                {sourceMode === 'yt_url' && (
                  <>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                      유튜브 URL 입력 (1개)
                    </label>
                    <div className="flex gap-3">
                      <input
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') ingestYouTubeUrl(); }}
                        placeholder="예: https://www.youtube.com/watch?v=..."
                        className="flex-1 px-5 py-4 bg-[#0f0f1a] border border-white/10 rounded-2xl text-white placeholder-slate-600 outline-none focus:border-[#a78bfa] focus:ring-4 focus:ring-[#a78bfa]/10 transition-all font-bold"
                      />
                      <button
                        onClick={ingestYouTubeUrl}
                        disabled={youtubeUrlLoading}
                        className="px-8 py-4 bg-gradient-to-r from-[#a78bfa] to-[#6366f1] hover:from-[#b79cff] hover:to-[#7477ff] text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-3 active:scale-[0.98] disabled:opacity-50"
                      >
                        {youtubeUrlLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faArrowRight} className="text-xs" />}
                        {youtubeUrlLoading ? '가져오는 중' : '가져오기'}
                      </button>
                    </div>
                    {youtubeUrlStatus && (
                      <div className="mt-3 text-[11px] font-bold text-slate-300 break-words">
                        {youtubeUrlStatus}
                      </div>
                    )}
                  </>
                )}

                {sourceMode === 'yt_keyword' && videos.length > 0 && (
                  <div className="mt-6 p-5 bg-black/20 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        추천 영상 (최대 50)
                      </div>
                      <div className="text-[10px] font-black text-slate-600">
                        수집 완료 후 랜덤 4개 모달 표시
                      </div>
                    </div>
                    {selectedVideo ? (
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                        <img src={selectedVideo.thumbnail} alt={selectedVideo.videoTitle} className="w-16 h-12 object-cover rounded-xl border border-white/10" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-black text-white line-clamp-1">{selectedVideo.videoTitle}</div>
                          <div className="text-[10px] font-bold text-slate-500 line-clamp-1">{selectedVideo.channelName}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-bold text-slate-500">
                        키워드 수집 완료 후 랜덤 4개가 모달로 표시됩니다.
                      </div>
                    )}
                  </div>
                )}

                {sourceMode === 'upload_text' && (
                  <>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                      자막(SRT) / 텍스트 업로드
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      <input
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="제목(선택)"
                        className="px-4 py-3 bg-[#0f0f1a] border border-white/10 rounded-2xl text-white placeholder-slate-600 outline-none focus:border-[#a78bfa] focus:ring-4 focus:ring-[#a78bfa]/10 transition-all font-bold text-sm"
                      />
                      <input
                        value={manualChannel}
                        onChange={(e) => setManualChannel(e.target.value)}
                        placeholder="채널/계정(선택)"
                        className="px-4 py-3 bg-[#0f0f1a] border border-white/10 rounded-2xl text-white placeholder-slate-600 outline-none focus:border-[#a78bfa] focus:ring-4 focus:ring-[#a78bfa]/10 transition-all font-bold text-sm"
                      />
                      <input
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="URL(선택)"
                        className="px-4 py-3 bg-[#0f0f1a] border border-white/10 rounded-2xl text-white placeholder-slate-600 outline-none focus:border-[#a78bfa] focus:ring-4 focus:ring-[#a78bfa]/10 transition-all font-bold text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <label className="flex items-center gap-2 px-4 py-3 bg-black/20 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 transition-all font-black text-xs">
                        <FontAwesomeIcon icon={faUpload} />
                        <span>SRT/TXT 업로드</span>
                        <input
                          type="file"
                          accept=".srt,.txt,text/plain"
                          className="hidden"
                          onChange={(e) => onUploadSrt(e.target.files?.[0] || null)}
                        />
                      </label>
                      {srtStatus && (
                        <div className="text-[11px] font-bold text-slate-300 truncate">
                          {srtStatus}
                        </div>
                      )}
                    </div>
                    <textarea
                      value={srtText}
                      onChange={(e) => { setSrtText(e.target.value); setSrtSource('upload'); }}
                      placeholder="자막(SRT) 또는 텍스트를 붙여넣기 하세요."
                      className="w-full h-44 px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-[11px] font-bold text-slate-200 placeholder-slate-600 outline-none focus:border-[#a78bfa]/50 focus:ring-4 focus:ring-[#a78bfa]/10 whitespace-pre-wrap"
                    />
                  </>
                )}
              </div>

              {sourceMode === 'upload_text' && (
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={generateReport}
                      disabled={reportLoading || !srtText.trim()}
                      className="relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#a78bfa] to-[#6366f1] hover:from-[#b79cff] hover:to-[#7477ff] text-white font-black rounded-xl shadow-xl shadow-indigo-500/25 transition-all active:scale-[0.99] hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                    >
                      {reportLoading
                        ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /><span>생성 중...</span></>
                        : <>
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-white/70 opacity-70 motion-safe:animate-ping" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                            </span>
                            <FontAwesomeIcon icon={faRobot} className="motion-safe:animate-pulse" />
                            <span>정밀 분석</span>
                          </>
                      }
                    </button>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (!report) return;
                          navigator.clipboard.writeText(report).then(() => {
                            setReportCopied(true);
                            setTimeout(() => setReportCopied(false), 1500);
                          });
                        }}
                        disabled={!report}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black border transition-all disabled:opacity-50 ${
                          reportCopied
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <FontAwesomeIcon icon={faClipboard} className="text-[10px]" />
                        <span className="text-xs">{reportCopied ? 'COPIED' : 'COPY'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const base = (reportHeader || 'benchmark_report')
                            .slice(0, 80)
                            .replace(/[\\/:*?"<>|]/g, '_')
                            .trim();
                          downloadText(`${base || 'benchmark_report'}.txt`, report);
                        }}
                        disabled={!report}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#a78bfa]/10 hover:bg-[#a78bfa] text-[#a78bfa] hover:text-white border border-[#a78bfa]/20 text-xs font-black transition-all disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" />
                        <span>다운로드</span>
                      </button>
                    </div>
                  </div>

                  {reportError && (
                    <div className="text-[11px] font-bold text-red-300 break-words">
                      {reportError}
                    </div>
                  )}

                  {report && (
                    <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {reportHeader || '업로드 소스'}
                        </div>
                      </div>
                      <pre className="p-4 text-[11px] font-medium text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {report}
                      </pre>
                    </div>
                  )}
                </div>
              )}

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
                    <div className="mt-4 max-h-40 overflow-auto rounded-xl border border-red-500/20 bg-black/20">
                      {crawlErrors.map((e, i) => (
                        <div key={`${e.keyword}-${i}`} className="px-4 py-3 border-b border-white/5 last:border-b-0">
                          <div className="text-[10px] font-black text-slate-300 break-all">{e.keyword}</div>
                          <div className="text-[11px] font-bold text-red-200/90 mt-1 break-words whitespace-pre-wrap">{e.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
        )}

        {activeTab === 'idea' && (
          <section className="bg-[#1c1c2e] p-10 rounded-[32px] shadow-xl border border-white/5">
            <div className="flex flex-wrap items-center mb-8 px-2 gap-3">
              <h3 className="text-xl font-black flex items-center gap-3">
                <FontAwesomeIcon icon={faRobot} className="text-[#a78bfa]" />
                시나리오 초안
              </h3>
              {report && (
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const t = String(draftText || '').trim();
                      if (!t) return;
                      navigator.clipboard.writeText(t).then(() => {
                        setDraftCopied(true);
                        setTimeout(() => setDraftCopied(false), 1500);
                      });
                    }}
                    disabled={!String(draftText || '').trim()}
                    className={`px-4 py-2 rounded-xl text-xs font-black border transition-all disabled:opacity-50 ${
                      draftCopied
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {draftCopied ? '복사됨' : '시나리오 복사'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = String(draftText || '').trim();
                      if (!t) return;
                      const base = (similarScenario?.topic || reportHeader || 'scenario_draft')
                        .slice(0, 80)
                        .replace(/[\\/:*?"<>|]/g, '_')
                        .trim();
                      downloadText(`${base || 'scenario_draft'}.txt`, t);
                    }}
                    disabled={!String(draftText || '').trim()}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-[#a78bfa]/10 hover:bg-[#a78bfa] text-[#a78bfa] hover:text-white border border-[#a78bfa]/20 transition-all disabled:opacity-50"
                  >
                    다운로드
                  </button>
                </div>
              )}
            </div>

            {!report && (
              <div className="text-center py-16 text-slate-500">
                <div className="text-sm font-black">정밀 분석 보고서 생성 후 시나리오 초안이 표시됩니다.</div>
                <div className="text-[11px] font-bold mt-2">오른쪽 상세 패널에서 “정밀 분석”을 실행하세요.</div>
              </div>
            )}

            {report && (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div />
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-[10px] font-black text-slate-400">
                      {similarLoading ? '검색중...' : `유사도 ${(similarScore * 100).toFixed(0)}%`}
                    </div>
                  </div>
                </div>

                {similarError && (
                  <div className="text-[11px] font-bold text-red-300 break-words mb-3">
                    {similarError}
                  </div>
                )}

                {!similarLoading && !similarScenario && !similarError && (
                  <div className="text-[11px] font-bold text-slate-500">
                    유사 시나리오를 찾지 못했습니다.
                  </div>
                )}

                {similarScenario && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-1 rounded-lg bg-black/20 border border-white/10 text-[10px] font-black text-slate-300">
                        {similarScenario.template_id}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-black/20 border border-white/10 text-[10px] font-black text-slate-300">
                        {similarScenario.style}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-[#a78bfa]/10 border border-[#a78bfa]/20 text-[10px] font-black text-[#a78bfa]">
                        {similarScenario.topic}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 -mb-1">
                      <button
                        type="button"
                        onClick={() => setDraftFontSize((v) => Math.max(10, v - 1))}
                        disabled={draftFontSize <= 10}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-black transition-all disabled:opacity-40"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraftFontSize((v) => Math.min(18, v + 1))}
                        disabled={draftFontSize >= 18}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-black transition-all disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    {videoScenes.length === 0 ? (
                      <div className="text-[12px] font-medium text-slate-500">
                        시나리오 초안을 입력하면 자동으로 씬 구성이 생성됩니다.
                      </div>
                    ) : (
                      <div className="rounded-2xl overflow-hidden border border-black/20 bg-white">
                        <div className="px-4 py-3 border-b border-black/10 flex items-center justify-end gap-2 bg-white">
                          <button
                            type="button"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 hover:bg-black/10 border border-black/10 text-xs font-black text-black transition-all"
                          >
                            화풍
                            <FontAwesomeIcon icon={faChevronRight} className="text-[10px] rotate-90" />
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 hover:bg-black/10 border border-black/10 text-xs font-black text-black transition-all"
                          >
                            성우
                            <FontAwesomeIcon icon={faChevronRight} className="text-[10px] rotate-90" />
                          </button>
                        </div>
                        {videoScenes.map((scene, idx) => (
                          <div
                            key={`${idx}-${scene.slice(0, 16)}`}
                            className="grid grid-cols-[110px_1fr] border-b border-black/20 last:border-b-0"
                          >
                            <div className="bg-[#d9d9d9] text-black flex items-center justify-center font-black text-sm border-r border-black/20 py-6">
                              씬{idx + 1}
                            </div>
                            <div className="bg-white text-black">
                              <textarea
                                data-video-scene="1"
                                value={scene}
                                onChange={(e) => {
                                  const next = [...videoScenes];
                                  next[idx] = e.target.value;
                                  setDraftText(next.join('\n\n'));
                                  setDraftDirty(true);
                                  const el = e.currentTarget;
                                  el.style.height = '0px';
                                  el.style.height = `${el.scrollHeight}px`;
                                }}
                                style={{ fontSize: `${draftFontSize}px` }}
                                className="w-full bg-white text-black px-6 py-6 outline-none resize-none overflow-hidden font-medium whitespace-pre-wrap leading-relaxed"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {isPickOpen && activeTab === 'idea' && sourceMode === 'yt_keyword' && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[12000]"
            onClick={() => setIsPickOpen(false)}
          />
          <div className="fixed inset-0 z-[12001] flex items-center justify-center px-4">
            <div className="w-full max-w-4xl bg-[#1c1c2e] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
                <div>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest">추천 영상 선택</div>
                  <div className="text-lg font-black text-white mt-1">
                    랜덤 4개 · {pickDeck.length > 0 ? `${Math.min(pickIndex + 4, pickDeck.length)} / ${pickDeck.length}` : '0 / 0'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => nextPickBatch()}
                    className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black text-slate-300 transition-all flex items-center gap-2"
                    disabled={pickDeck.length === 0}
                    title="새로고침"
                  >
                    <FontAwesomeIcon icon={faSync} className="text-[10px]" />
                    새로고침
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPickOpen(false)}
                    className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all flex items-center justify-center"
                    title="닫기"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>

              <div className="p-8">
                {pickDeck.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <div className="text-sm font-black">추천할 영상이 없습니다.</div>
                    <div className="text-[11px] font-bold mt-2">키워드를 다시 수집하거나 필터를 바꿔보세요.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {currentPickBatch.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => { setSelectedVideo(v); setIsPickOpen(false); }}
                        className="group text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl overflow-hidden transition-all"
                      >
                        <div className="relative h-44 overflow-hidden">
                          <img src={v.thumbnail} alt={v.videoTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c2e] to-transparent opacity-70" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <div className="text-xs font-black text-white line-clamp-2 leading-snug">{v.videoTitle}</div>
                            <div className="text-[11px] font-bold text-slate-400 mt-1 line-clamp-1">{v.channelName}</div>
                          </div>
                        </div>
                        <div className="px-5 py-4 flex items-center justify-between">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            선택하기
                          </div>
                          <div className="text-[10px] font-black text-[#a78bfa]">
                            {getVideoScore(v) >= 30 && isRecent3Months(v) ? '벤치마킹' : getVideoScore(v) >= 30 ? '떡상' : '일반'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {selectedVideo && (sourceMode === 'yt_keyword' || sourceMode === 'yt_url') && (
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
                    {sourceMode === 'yt_keyword' ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/5 text-slate-400 border border-white/10">
                        #{keyword.trim() || 'keyword'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/5 text-slate-400 border border-white/10">
                        YouTube URL
                      </span>
                    )}
                    {selectedIsBenchmark && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/30">
                        벤치마킹 1순위
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

            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                <img src={selectedVideo.thumbnail} alt={selectedVideo.videoTitle} className="w-full object-cover aspect-video" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] to-transparent opacity-40" />
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
                <div className="text-xs font-black text-slate-500 flex items-center gap-2">
                  <span>VIRAL</span>
                  <span className="text-white">{selectedScore}</span>
                </div>
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

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <FontAwesomeIcon icon={faFileAlt} className="text-[#a78bfa]" />
                  SRT 자막
                </label>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchSrt}
                      disabled={srtLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl border border-white/10 transition-all disabled:opacity-50"
                    >
                      {srtLoading
                        ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /><span>추출 중...</span></>
                        : <><FontAwesomeIcon icon={faFileAlt} /><span>자동 추출</span></>
                      }
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl border border-white/10 transition-all cursor-pointer">
                      <FontAwesomeIcon icon={faUpload} />
                      <span>SRT 업로드</span>
                      <input
                        type="file"
                        accept=".srt,text/plain"
                        className="hidden"
                        onChange={(e) => onUploadSrt(e.target.files?.[0] || null)}
                      />
                    </label>
                    {srtText.trim() && (
                      <button
                        onClick={() => downloadText(`${selectedVideoId}.srt`, srtText)}
                        className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#a78bfa]/10 hover:bg-[#a78bfa] text-[#a78bfa] hover:text-white font-black rounded-xl border border-[#a78bfa]/20 transition-all"
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" />
                        <span>다운로드</span>
                      </button>
                    )}
                  </div>

                  {srtStatus && (
                    <div className="text-[11px] font-bold text-slate-300 break-words">
                      {srtStatus}
                    </div>
                  )}

                  <textarea
                    value={srtText}
                    onChange={(e) => { setSrtText(e.target.value); if (srtSource !== 'upload') setSrtSource('upload'); }}
                    placeholder="SRT가 없으면 업로드하거나 이곳에 붙여넣기 하세요."
                    className="w-full h-44 px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-[11px] font-bold text-slate-200 placeholder-slate-600 outline-none focus:border-[#a78bfa]/50 focus:ring-4 focus:ring-[#a78bfa]/10 whitespace-pre-wrap"
                  />
                  <div className="text-[10px] font-black text-slate-500 flex items-center gap-2">
                    <span>Source:</span>
                    <span className="text-slate-300">{srtSource || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <FontAwesomeIcon icon={faRobot} className="text-[#a78bfa]" />
                  벤치마킹 분석 보고서
                </label>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={generateReport}
                      disabled={reportLoading || !srtText.trim()}
                      className="relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#a78bfa] to-[#6366f1] hover:from-[#b79cff] hover:to-[#7477ff] text-white font-black rounded-xl shadow-xl shadow-indigo-500/25 transition-all active:scale-[0.99] hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                    >
                      {reportLoading
                        ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /><span>생성 중...</span></>
                        : <>
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-white/70 opacity-70 motion-safe:animate-ping" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                            </span>
                            <FontAwesomeIcon icon={faRobot} className="motion-safe:animate-pulse" />
                            <span>정밀 분석</span>
                          </>
                      }
                    </button>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (!report) return;
                          navigator.clipboard.writeText(report).then(() => {
                            setReportCopied(true);
                            setTimeout(() => setReportCopied(false), 1500);
                          });
                        }}
                        disabled={!report}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black border transition-all disabled:opacity-50 ${
                          reportCopied
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <FontAwesomeIcon icon={faClipboard} className="text-[10px]" />
                        <span className="text-xs">{reportCopied ? 'COPIED' : 'COPY'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const base = (reportHeader || 'benchmark_report')
                            .slice(0, 80)
                            .replace(/[\\/:*?"<>|]/g, '_')
                            .trim();
                          downloadText(`${base || 'benchmark_report'}.txt`, report);
                        }}
                        disabled={!report}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#a78bfa]/10 hover:bg-[#a78bfa] text-[#a78bfa] hover:text-white border border-[#a78bfa]/20 text-xs font-black transition-all disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" />
                        <span>다운로드</span>
                      </button>
                    </div>
                  </div>

                  {!selectedIsBenchmark && (
                    <div className="text-[11px] font-bold text-slate-500">
                      현재 영상은 “벤치마킹(최근 3개월 + 30점+)” 조건이 아닐 수 있습니다. 그래도 보고서는 생성할 수 있습니다.
                    </div>
                  )}

                  {reportError && (
                    <div className="text-[11px] font-bold text-red-300 break-words">
                      {reportError}
                    </div>
                  )}

                  {report && (
                    <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {reportHeader}
                        </div>
                      </div>
                      <pre className="p-4 text-[11px] font-medium text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {report}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-white/10 bg-[#1c1c2e]">
              <a
                href={selectedVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-[#a78bfa] to-[#6366f1] hover:from-[#b79cff] hover:to-[#7477ff] text-white font-black py-4 rounded-xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                유튜브에서 보기
                <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
              </a>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
