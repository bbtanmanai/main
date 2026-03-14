'use client';

import React, { useState } from 'react';
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
  faChevronLeft,
  faChevronRight,
  faInfoCircle,
  faFileAlt,
  faRobot,
  faKey,
  faChartLine,
  faHashtag
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

// --- Viral Score Helpers (Directly from Channel Page) ---
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

// --- Extended Mock Data (30+ items) ---
const MOCK_KEYWORD_VIDEOS = [
  { id: 1, keyword: "챗GPT 수익화", channelName: "AI 마스터", videoTitle: "챗GPT로 월 100만원 벌기 실전 가이드", description: "실제로 적용 가능한 7가지 수익화 모델을 소개합니다.", thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400", url: "https://youtube.com/watch?v=k1", subscribers: "5.2만", views: "12.4만", likes: "4.2k", comments: "856", status: "active", collectedAt: "2024-03-12" },
  { id: 2, keyword: "비트코인", channelName: "경제 인사이트", videoTitle: "비트코인 반감기 이후 10억 가는 시나리오", description: "과거 데이터를 바탕으로 한 정밀한 미래 예측.", thumbnail: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400", url: "https://youtube.com/watch?v=k2", subscribers: "42만", views: "15만", likes: "8.5k", comments: "1.2k", status: "active", collectedAt: "2024-03-13" },
  { id: 3, keyword: "숏폼 제작", channelName: "영상 꿀팁", videoTitle: "조회수 100만 쇼츠 만드는 법 (캡컷 활용)", description: "누구나 따라 할 수 있는 숏폼 편집 비결.", thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400", url: "https://youtube.com/watch?v=k3", subscribers: "3.4만", views: "8.9k", likes: "423", comments: "56", status: "active", collectedAt: "2024-03-14" },
  { id: 4, keyword: "부업 추천", channelName: "머니 노마드", videoTitle: "퇴근 후 2시간, 월 200 버는 부업 TOP 3", description: "직장인들도 부담 없이 시작할 수 있는 부업.", thumbnail: "https://images.unsplash.com/photo-1454165833767-1316b3bd6020?w=400", url: "https://youtube.com/watch?v=k4", subscribers: "12.5만", views: "4.2만", likes: "1.2k", comments: "342", status: "active", collectedAt: "2024-03-15" },
  { id: 5, keyword: "미드저니", channelName: "디자인 혁명", videoTitle: "미드저니 실사 이미지 만드는 프롬프트 공유", description: "사진보다 더 사진 같은 이미지 생성 팁.", thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400", url: "https://youtube.com/watch?v=k5", subscribers: "5.1만", views: "3.2만", likes: "2.1k", comments: "156", status: "active", collectedAt: "2024-03-15" },
  { id: 6, keyword: "인스타툰", channelName: "드로잉 연구소", videoTitle: "아이패드로 인스타툰 연재해서 광고 받기", description: "그림 초보도 가능한 인스타툰 성장 전략.", thumbnail: "https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=400", url: "https://youtube.com/watch?v=k6", subscribers: "2.1만", views: "45만", likes: "18k", comments: "2.3k", status: "active", collectedAt: "2024-03-16" },
  { id: 7, keyword: "Next.js", channelName: "코딩 마스터", videoTitle: "Next.js 14 App Router 완벽 가이드", description: "프론트엔드 개발자의 필수 코스.", thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400", url: "https://youtube.com/watch?v=k7", subscribers: "9.8만", views: "2.1만", likes: "945", comments: "88", status: "active", collectedAt: "2024-03-16" },
  { id: 8, keyword: "주식 투자", channelName: "머니 로드", videoTitle: "2024년 반드시 사야 할 미국 주식 1위", description: "금리 인하 수혜주를 미리 선점하세요.", thumbnail: "https://images.unsplash.com/photo-1611974714024-463ef9c73666?w=400", url: "https://youtube.com/watch?v=k8", subscribers: "34만", views: "8.5만", likes: "4.2k", comments: "567", status: "active", collectedAt: "2024-03-17" },
  { id: 9, keyword: "미라클 모닝", channelName: "라이프 해커", videoTitle: "새벽 5시 기상이 인생을 바꾼 이유 (1년 후기)", description: "지치지 않고 습관을 만드는 방법.", thumbnail: "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=400", url: "https://youtube.com/watch?v=k9", subscribers: "12만", views: "52만", likes: "25k", comments: "1.8k", status: "active", collectedAt: "2024-03-17" },
  { id: 10, keyword: "AI 툴", channelName: "생산성 전문가", videoTitle: "업무 효율 10배 높여주는 무료 AI 도구들", description: "시간을 벌어다 주는 스마트한 도구 활용법.", thumbnail: "https://images.unsplash.com/photo-1664575185263-452292724422?w=400", url: "https://youtube.com/watch?v=k10", subscribers: "7.4만", views: "4.8만", likes: "1.5k", comments: "210", status: "active", collectedAt: "2024-03-18" },
  { id: 11, keyword: "애플", channelName: "테크 리뷰어", videoTitle: "아이폰 16 루머 총정리: 디자인 변경?", description: "최신 유출 정보를 바탕으로 한 상세 분석.", thumbnail: "https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=400", url: "https://youtube.com/watch?v=k11", subscribers: "18만", views: "9.2만", likes: "6.7k", comments: "432", status: "active", collectedAt: "2024-03-18" },
  { id: 12, keyword: "사진 촬영", channelName: "포토 마스터", videoTitle: "스마트폰으로 영화 같은 영상 찍는 법", description: "구도와 조명만으로 만드는 고퀄리티 영상.", thumbnail: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=400", url: "https://youtube.com/watch?v=k12", subscribers: "4.2만", views: "1.8만", likes: "1.1k", comments: "95", status: "active", collectedAt: "2024-03-19" },
  { id: 13, keyword: "심리학", channelName: "마음 돋보기", videoTitle: "자존감을 깎아먹는 사람들의 특징", description: "인간관계에서 나를 지키는 심리 기술.", thumbnail: "https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?w=400", url: "https://youtube.com/watch?v=k13", subscribers: "25만", views: "68만", likes: "32k", comments: "4.5k", status: "active", collectedAt: "2024-03-19" },
  { id: 14, keyword: "발리 여행", channelName: "트래블 다이어리", videoTitle: "발리 한 달 살기 총비용 공개 (숙소 팁)", description: "디지털 노마드의 성지, 발리 완벽 정리.", thumbnail: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400", url: "https://youtube.com/watch?v=k14", subscribers: "11만", views: "15만", likes: "8.2k", comments: "1.1k", status: "active", collectedAt: "2024-03-20" },
  { id: 15, keyword: "스테이크", channelName: "요리 명장", videoTitle: "실패 없는 스테이크 굽는 법 (팬 하나로)", description: "레스토랑 부럽지 않은 육즙 가득 스테이크.", thumbnail: "https://images.unsplash.com/photo-1546241072-48010ad28c2c?w=400", url: "https://youtube.com/watch?v=k15", subscribers: "42만", views: "89만", likes: "45k", comments: "3.2k", status: "active", collectedAt: "2024-03-20" },
  { id: 16, keyword: "HIIT", channelName: "홈트레이닝", videoTitle: "하루 10분 전신 지방 태우기 루틴", description: "바쁜 사람들을 위한 최강의 운동법.", thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400", url: "https://youtube.com/watch?v=k16", subscribers: "28만", views: "120만", likes: "68k", comments: "5.4k", status: "active", collectedAt: "2024-03-21" },
  { id: 17, keyword: "책 추천", channelName: "독서가", videoTitle: "인생이 허무할 때 읽어야 할 책 3권", description: "삶의 지혜를 전해주는 고전들.", thumbnail: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400", url: "https://youtube.com/watch?v=k17", subscribers: "6.5만", views: "4.2만", likes: "2.8k", comments: "180", status: "active", collectedAt: "2024-03-21" },
  { id: 18, keyword: "인테리어", channelName: "공간 연구소", videoTitle: "원룸 좁은 공간 2배로 넓게 쓰는 배치법", description: "가구 배치만으로 달라지는 집안 분위기.", thumbnail: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400", url: "https://youtube.com/watch?v=k18", subscribers: "14만", views: "22만", likes: "12k", comments: "890", status: "active", collectedAt: "2024-03-22" },
  { id: 19, keyword: "영어 회화", channelName: "언어 멘토", videoTitle: "영어 회화, 쉐도잉만으로 가능할까?", description: "실전에서 통하는 진짜 영어 공부법.", thumbnail: "https://images.unsplash.com/photo-1543167653-9962007320c0?w=400", url: "https://youtube.com/watch?v=k19", subscribers: "8.9만", views: "7.4만", likes: "3.5k", comments: "420", status: "active", collectedAt: "2024-03-22" },
  { id: 20, keyword: "야경 사진", channelName: "사진 작가", videoTitle: "밤 사진 노이즈 없이 선명하게 찍는 법", description: "어두운 곳에서도 밝고 깨끗한 사진 촬영 팁.", thumbnail: "https://images.unsplash.com/photo-1502982722880-0e8a902d4ee6?w=400", url: "https://youtube.com/watch?v=k20", subscribers: "5.4만", views: "2.8만", likes: "1.4k", comments: "110", status: "active", collectedAt: "2024-03-23" },
  { id: 21, keyword: "반도체", channelName: "경제 분석", videoTitle: "반도체 사이클, 지금이 저점인 이유", description: "글로벌 시장 흐름과 삼성전자 주가 전망.", thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400", url: "https://youtube.com/watch?v=k21", subscribers: "19만", views: "11만", likes: "5.6k", comments: "670", status: "active", collectedAt: "2024-03-23" },
  { id: 22, keyword: "미니멀리즘", channelName: "심플 라이프", videoTitle: "물건 100개 비우고 인생이 달라진 이유", description: "단순함이 주는 마음의 여유와 자유.", thumbnail: "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=400", url: "https://youtube.com/watch?v=k22", subscribers: "7.2만", views: "18만", likes: "9.4k", comments: "1.2k", status: "active", collectedAt: "2024-03-24" },
  { id: 23, keyword: "전기차", channelName: "카 리뷰", videoTitle: "전기차 사기 전 반드시 봐야 할 단점 3가지", description: "충전 인프라와 배터리 수명에 대한 진실.", thumbnail: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400", url: "https://youtube.com/watch?v=k23", subscribers: "31만", views: "25만", likes: "11k", comments: "2.1k", status: "active", collectedAt: "2024-03-24" },
  { id: 24, keyword: "수면 명상", channelName: "명상 가이드", videoTitle: "10분 만에 딥슬립하는 수면 명상", description: "불면증을 날려버리는 편안한 유도 명상.", thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400", url: "https://youtube.com/watch?v=k24", subscribers: "15만", views: "62만", likes: "32k", comments: "4.8k", status: "active", collectedAt: "2024-03-25" },
  { id: 25, keyword: "캠핑 용품", channelName: "캠퍼 정", videoTitle: "가성비 캠핑 용품 TOP 5 (다이소 포함)", description: "캠린이를 위한 저렴하지만 확실한 장비 추천.", thumbnail: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400", url: "https://youtube.com/watch?v=k25", subscribers: "8.4만", views: "5.2만", likes: "2.3k", comments: "420", status: "active", collectedAt: "2024-03-25" },
  { id: 26, keyword: "카페 창업", channelName: "카페 경영", videoTitle: "카페 창업 후 망하지 않는 법 (현실 조언)", description: "실제 폐업률 데이터를 바탕으로 한 전략 분석.", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400", url: "https://youtube.com/watch?v=k26", subscribers: "11만", views: "12만", likes: "6.8k", comments: "980", status: "active", collectedAt: "2024-03-26" },
  { id: 27, keyword: "스마트스토어", channelName: "셀러 일기", videoTitle: "월 매출 1000만원 달성 과정 공개", description: "아이템 선정부터 마케팅까지 실전 노하우.", thumbnail: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400", url: "https://youtube.com/watch?v=k27", subscribers: "4.2만", views: "3.5만", likes: "1.1k", comments: "310", status: "active", collectedAt: "2024-03-26" },
  { id: 28, keyword: "퍼스널 브랜딩", channelName: "브랜드 코치", videoTitle: "나라는 브랜드를 만드는 법 (차별화 전략)", description: "누구도 따라 할 수 없는 독보적인 존재감 만들기.", thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400", url: "https://youtube.com/watch?v=k28", subscribers: "6.8만", views: "4.2만", likes: "2.5k", comments: "150", status: "active", collectedAt: "2024-03-27" },
  { id: 29, keyword: "자기계발", channelName: "동기부여가", videoTitle: "무기력함에서 벗어나는 확실한 행동법", description: "뇌과학이 알려주는 의지력의 비밀.", thumbnail: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400", url: "https://youtube.com/watch?v=k29", subscribers: "21만", views: "82만", likes: "45k", comments: "3.2k", status: "active", collectedAt: "2024-03-27" },
  { id: 30, keyword: "로봇 청소기", channelName: "생활 가전", videoTitle: "로봇 청소기 추천: 이거 안 사면 후회함", description: "성능과 가격을 모두 잡은 가전 리뷰.", thumbnail: "https://images.unsplash.com/photo-1563206767-5b18f218e7de?w=400", url: "https://youtube.com/watch?v=k30", subscribers: "15.4만", views: "14만", likes: "7.2k", comments: "890", status: "active", collectedAt: "2024-03-28" }
];

export default function KeywordCrawlingPage() {
  const [videos, setVideos] = useState(MOCK_KEYWORD_VIDEOS);
  const [newKeywords, setNewKeywords] = useState<string[]>(['', '']);
  const [selectedCountry, setSelectedCountry] = useState('전체');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<typeof MOCK_KEYWORD_VIDEOS[0] | null>(null);

  const countries = ['전체', 'Korea', 'USA', 'Japan', 'India'];

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(videos.length / itemsPerPage);

  // Pagination Effect
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVideos = videos.slice(indexOfFirstItem, indexOfLastItem);

  const handleKeywordChange = (index: number, value: string) => {
    const updated = [...newKeywords];
    updated[index] = value;
    setNewKeywords(updated);
  };

  const handleAddKeywords = () => {
    const activeKeywords = newKeywords.filter(kw => kw.trim() !== '');
    if (activeKeywords.length === 0) return alert("최소 하나의 키워드를 입력해주세요.");
    
    setIsLoading(true);
    
    setTimeout(() => {
      const newEntries = activeKeywords.map((kw, index) => ({
        id: videos.length + index + 1,
        channelName: "분석 중인 채널",
        videoTitle: `"${kw}" 키워드 관련 영상 분석 중...`,
        description: `입력하신 키워드 "${kw}"를 기반으로 유튜브에서 가장 반응이 좋은 영상들을 수집하고 있습니다. 잠시 후 동기화 버튼을 눌러주세요.`,
        thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=400",
        url: "#",
        subscribers: "-",
        views: "-",
        likes: "-",
        comments: "-",
        status: "active",
        collectedAt: new Date().toISOString().split('T')[0],
        keyword: kw
      }));

      setVideos([...newEntries, ...videos]);
      setNewKeywords(['', '']);
      setIsLoading(false);
      alert(`✅ ${activeKeywords.length}개의 키워드가 수집 프로세스에 추가되었습니다.`);
    }, 1500);
  };

  return (
    <div className="bg-[#0f0f1a] min-h-screen text-white pb-24 font-sans antialiased">
      {/* Hero Header */}
      <header 
        className="relative pt-24 pb-32 text-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/img/crawling/keyword/keyword.webp')" }}
      >
        <div className="absolute inset-0 bg-[#0f0f1a]/70"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#6366f1_0%,transparent_70%)]"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[#a78bfa] text-xs font-bold tracking-wider mb-6 uppercase">
            <FontAwesomeIcon icon={faHashtag} /> YouTube Keyword Scout
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tighter">
            유튜브 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] to-[#6366f1]">키워드 수집기</span>
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
                <span>🔥</span> <div><div className="text-red-400">30점 이상</div><div className="text-slate-500 font-medium">떡상</div></div>
              </div>
              <div className="flex items-center gap-2 bg-yellow-500/15 border border-yellow-400/30 rounded-xl px-3 py-2">
                <span>⚡</span> <div><div className="text-yellow-400">15점 이상</div><div className="text-slate-500 font-medium">상승중</div></div>
              </div>
              <div className="flex items-center gap-2 bg-green-500/15 border border-green-400/30 rounded-xl px-3 py-2">
                <span>📈</span> <div><div className="text-green-400">8점 이상</div><div className="text-slate-500 font-medium">관심</div></div>
              </div>
              <div className="flex items-center gap-2 bg-slate-700/50 border border-slate-600/30 rounded-xl px-3 py-2">
                <span>💤</span> <div><div className="text-slate-400">8점 미만</div><div className="text-slate-500 font-medium">보통</div></div>
              </div>
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
                키워드 기반<br/>
                <span className="text-[#a78bfa]">트렌드 자동 포착</span>
              </h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
                원하는 키워드만 입력하세요. <br/>
                해당 키워드로 유튜브에서 가장 높은 반응을 얻고 있는 <br/>
                핵심 영상들을 AI가 자동으로 수집하고 분석합니다.
              </p>

              <div className="bg-white/5 p-6 rounded-2xl border border-dashed border-white/10">
                <div className="flex items-center gap-2 text-[#a78bfa] font-black text-[10px] uppercase tracking-widest mb-6">
                  <FontAwesomeIcon icon={faBolt} /> 키워드 자동화 프로세스
                </div>
                <div className="space-y-5 relative">
                  <div className="absolute left-[3.5px] top-2 bottom-2 w-[1px] bg-white/5" />
                  <Step label="Keyword Discovery" desc="유튜브 인기 검색어 및 관련어 분석" active />
                  <Step label="Trend Ranking" desc="떡상 점수 기반 고효율 영상 필터링" active />
                  <Step label="Data Harvesting" desc="영상 메타데이터 및 분석 정보 수집" />
                  <Step label="Insight Delivery" desc="카테고리별 트렌드 보고서 생성" />
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
                    {countries.map(country => (
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
                          placeholder={`키워드 ${index + 1}`}
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
                  {isLoading ? <FontAwesomeIcon icon={faSpinner} /> : (
                    <>
                      <span>일괄 키워드 수집 시작</span>
                      <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    </>
                  )}
                </button>

                <div className="p-5 bg-[#a78bfa]/5 rounded-2xl border border-[#a78bfa]/10">
                  <h4 className="text-xs font-black text-[#a78bfa] mb-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} /> 수집 팁
                  </h4>
                  <ul className="text-[11px] font-bold text-slate-500 space-y-1.5 list-disc list-inside">
                    <li>구체적인 키워드일수록 정확한 영상이 수집됩니다.</li>
                    <li>현재 가장 핫한 키워드를 입력해 트렌드를 파악하세요.</li>
                    <li>최대 2개까지 동시 처리가 가능합니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Managed Videos Grid */}
        <section className="bg-[#1c1c2e] p-10 rounded-[32px] shadow-xl border border-white/5">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-xl font-black flex items-center gap-3">
              <FontAwesomeIcon icon={faChartLine} className="text-[#a78bfa]" />
              키워드별 수집 영상 목록
              <span className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-black text-slate-500 border border-white/10">
                TOTAL {videos.length}
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {currentVideos.map((video) => (
              <div key={video.id} className="group bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 transition-all overflow-hidden flex flex-col shadow-lg">
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
                  
                  {/* Viral Score Badge - Moved to Top Left as requested */}
                  {(() => {
                    const score = calcViralScore(video);
                    const tier = getScoreTier(score);
                    return (
                      <div className={`absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border backdrop-blur-sm ${tier.color}`}>
                        <span>{tier.emoji}</span>
                        <span>{score}</span>
                      </div>
                    );
                  })()}

                  {/* Actions Overlay */}
                  <div className="absolute top-2 md:top-4 right-2 md:right-4 flex gap-1.5 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      title="동기화" 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-[#a78bfa] transition-all"
                    >
                      <FontAwesomeIcon icon={faSync} className="text-[10px] md:text-xs" />
                    </button>
                    <button 
                      title="삭제" 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-red-500 transition-all"
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
                
                <div className="p-3 md:p-6 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-1.5 md:mb-2">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#a78bfa]/20 flex items-center justify-center text-[#a78bfa] text-[6px] md:text-[8px]">
                        <FontAwesomeIcon icon={faLink} />
                      </div>
                      <span className="text-[7px] md:text-[10px] font-black text-[#a78bfa] tracking-wider uppercase truncate max-w-[80px] md:max-w-[120px]">{video.channelName}</span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-white/5 rounded text-[6px] md:text-[8px] font-black text-slate-500 border border-white/10 uppercase">#{video.keyword}</span>
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

          {/* Pagination UI */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-[#a78bfa]/10 hover:text-[#a78bfa] disabled:opacity-30 transition-all"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl border font-black text-xs transition-all ${
                      currentPage === i + 1 ? "bg-[#a78bfa] border-[#a78bfa] text-white shadow-lg shadow-[#a78bfa]/20" : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-white"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-[#a78bfa]/10 hover:text-[#a78bfa] disabled:opacity-30 transition-all"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          )}
        </section>

        {/* Guide Section */}
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

      {/* Side Panel */}
      {selectedVideo && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]" onClick={() => setSelectedVideo(null)} />
          <aside className="fixed top-0 right-0 w-full md:w-[560px] h-full bg-[#0f0f1a] border-l border-white/10 z-[10001] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] flex flex-col">
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-[#1c1c2e]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/10 flex items-center justify-center text-[#a78bfa]">
                  <FontAwesomeIcon icon={faKey} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-none mb-1">키워드 분석 리포트</h2>
                  <span className="text-[10px] font-black text-[#a78bfa] tracking-widest uppercase">#{selectedVideo.keyword}</span>
                </div>
              </div>
              <button onClick={() => setSelectedVideo(null)} className="w-10 h-10 rounded-full bg-white/5 text-slate-500 hover:text-red-400 transition-all flex items-center justify-center">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                <img src={selectedVideo.thumbnail} alt={selectedVideo.videoTitle} className="w-full object-cover aspect-video" />
                <a href={selectedVideo.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-[#a78bfa] text-white flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xl" />
                  </div>
                </a>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white leading-tight">{selectedVideo.videoTitle}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{selectedVideo.description}</p>
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
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <FontAwesomeIcon icon={faRobot} className="text-[#a78bfa]" /> AI Trend Insight
                </label>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/20 flex items-center justify-center text-[#a78bfa] text-xs">
                      <FontAwesomeIcon icon={faInfoCircle} />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">트렌드 요약</h4>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed font-bold pl-11">
                    키워드 "{selectedVideo.keyword}"에 대한 알고리즘 반응과 시청자 관심사를 분석 중입니다. <br/>
                    해당 키워드는 현재 동종 카테고리 대비 떡상 점수가 매우 높은 상태입니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-white/10 bg-[#1c1c2e]">
              <a href={selectedVideo.url} target="_blank" rel="noopener noreferrer" className="w-full bg-gradient-to-r from-[#a78bfa] to-[#6366f1] text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20">
                유튜브에서 보기 <FontAwesomeIcon icon={faExternalLinkAlt} />
              </a>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
