'use client';

import React, { useState } from 'react';
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

// --- Sample YouTube Video Data ---
const MOCK_VIDEOS = [
  { 
    id: 1, 
    channelName: "테크 트렌드", 
    videoTitle: "2024년 꼭 알아야 할 AI 기술 TOP 5",
    description: "올해 인공지능 분야에서 가장 혁신적인 변화를 이끌어낼 5가지 핵심 기술을 심층 분석합니다. 생성형 AI부터 자율주행까지, 미래를 바꿀 기술들을 확인해 보세요.",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=tech1", 
    subscribers: "12.5만",
    views: "4.2만",
    likes: "1.2k",
    comments: "342",
    status: "active", 
    collectedAt: "2024-03-10" 
  },
  { 
    id: 2, 
    channelName: "AI 비즈니스", 
    videoTitle: "챗GPT로 1인 기업 시작하기 완벽 가이드",
    description: "직장인도 가능한 1인 기업 창업! 챗GPT를 활용하여 아이템 선정부터 마케팅 자동화까지 한 번에 끝내는 실전 가이드를 공개합니다.",
    thumbnail: "https://images.unsplash.com/photo-1675271591211-126ad94e495d?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=aibiz2", 
    subscribers: "8.2만",
    views: "1.5만",
    likes: "856",
    comments: "124",
    status: "active", 
    collectedAt: "2024-03-12" 
  },
  { 
    id: 3, 
    channelName: "숏폼 제작 팁", 
    videoTitle: "조회수 떡상하는 쇼츠 편집 비결",
    description: "1분 안에 시선을 사로잡는 숏폼 편집의 핵심! 캡컷 활용법부터 알고리즘의 선택을 받는 썸네일 전략까지 모두 담았습니다.",
    thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=shorts_tips3", 
    subscribers: "3.4만",
    views: "8.9k",
    likes: "423",
    comments: "56",
    status: "active", 
    collectedAt: "2024-03-05" 
  },
  {
    id: 4,
    channelName: "미래 지식 창고",
    videoTitle: "양자 컴퓨터가 가져올 암호화폐의 종말?",
    description: "양자 컴퓨팅 기술이 블록체인 보안 시스템에 미치는 영향과 이에 대비하는 차세대 암호화 기술에 대해 알아봅니다.",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=future4",
    subscribers: "15.2만",
    views: "12만",
    likes: "5.4k",
    comments: "892",
    status: "active",
    collectedAt: "2024-03-13"
  },
  {
    id: 5,
    channelName: "디자인 혁명",
    videoTitle: "Midjourney v6로 실사 이미지 만드는 법",
    description: "미드저니 최신 버전을 활용하여 사진보다 더 사진 같은 실사 이미지를 생성하는 프롬프트 엔지니어링 꿀팁을 공유합니다.",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=design5",
    subscribers: "5.1만",
    views: "3.2만",
    likes: "2.1k",
    comments: "156",
    status: "active",
    collectedAt: "2024-03-13"
  },
  {
    id: 6,
    channelName: "마케팅 마스터",
    videoTitle: "광고비 0원으로 인스타그램 팔로워 1만 명 모으기",
    description: "유료 광고 없이 순수하게 콘텐츠 기획과 알고리즘 분석만으로 단기간에 계정을 성장시킨 실전 노하우를 공개합니다.",
    thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=marketing6",
    subscribers: "21만",
    views: "45만",
    likes: "18k",
    comments: "2.3k",
    status: "active",
    collectedAt: "2024-03-14"
  },
  {
    id: 7,
    channelName: "코딩하는 사람들",
    videoTitle: "Next.js 14 서버 컴포넌트 완벽 이해하기",
    description: "App Router와 서버 컴포넌트의 개념부터 실전 프로젝트 적용까지, 리액트 개발자가 알아야 할 최신 웹 기술을 정리했습니다.",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=coding7",
    subscribers: "9.8만",
    views: "2.1만",
    likes: "945",
    comments: "88",
    status: "active",
    collectedAt: "2024-03-14"
  },
  {
    id: 8,
    channelName: "머니 로드",
    videoTitle: "2024년 유망한 미국 주식 ETF 추천 3선",
    description: "금리 인하 시기에 대비하여 안정적인 수익을 기대할 수 있는 미국 기술주 및 배당 ETF를 전문가 관점에서 분석해 드립니다.",
    thumbnail: "https://images.unsplash.com/photo-1611974714024-463ef9c73666?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=money8",
    subscribers: "34만",
    views: "8.5만",
    likes: "4.2k",
    comments: "567",
    status: "active",
    collectedAt: "2024-03-15"
  },
  {
    id: 9,
    channelName: "라이프 해커",
    videoTitle: "새벽 5시 기상이 인생을 바꾸는 이유",
    description: "성공한 사람들의 공통적인 습관인 미라클 모닝. 1년 동안 매일 새벽 5시에 일어나며 겪은 변화와 지속 가능한 팁을 알려드립니다.",
    thumbnail: "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=life9",
    subscribers: "12만",
    views: "52만",
    likes: "25k",
    comments: "1.8k",
    status: "active",
    collectedAt: "2024-03-15"
  },
  {
    id: 10,
    channelName: "AI 툴박스",
    videoTitle: "업무 생산성 10배 높여주는 무료 AI 도구들",
    description: "ChatGPT 외에도 유용한 다양한 무료 AI 툴을 소개합니다. 영상 편집, 문서 작성, 코드 리뷰까지 효율을 극대화해 보세요.",
    thumbnail: "https://images.unsplash.com/photo-1664575185263-452292724422?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=aitool10",
    subscribers: "7.4만",
    views: "4.8만",
    likes: "1.5k",
    comments: "210",
    status: "active",
    collectedAt: "2024-03-16"
  },
  {
    id: 11,
    channelName: "브랜드 연구소",
    videoTitle: "애플은 왜 광고에서 기능을 말하지 않을까?",
    description: "애플의 마케팅 전략 속에 숨겨진 인문학적 가치와 감성 브랜딩의 비밀을 심리학적 관점에서 분석해 봅니다.",
    thumbnail: "https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=brand11",
    subscribers: "18만",
    views: "9.2만",
    likes: "6.7k",
    comments: "432",
    status: "active",
    collectedAt: "2024-03-16"
  },
  {
    id: 12,
    channelName: "영상 미학",
    videoTitle: "아이폰만으로 영화 같은 영상 찍는 노하우",
    description: "값비싼 장비 없이도 시네마틱한 영상을 촬영할 수 있는 구도, 조명 활용법, 그리고 색보정 앱 편집 기술을 전해드립니다.",
    thumbnail: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=movie12",
    subscribers: "4.2만",
    views: "1.8만",
    likes: "1.1k",
    comments: "95",
    status: "active",
    collectedAt: "2024-03-17"
  },
  {
    id: 13,
    channelName: "심리 돋보기",
    videoTitle: "자존감을 깎아먹는 사람들의 3가지 특징",
    description: "주변에 있다면 반드시 피해야 할 부정적인 사람들의 특징과 나를 지키는 심리적 방어 기제에 대해 이야기합니다.",
    thumbnail: "https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=psych13",
    subscribers: "25만",
    views: "68만",
    likes: "32k",
    comments: "4.5k",
    status: "active",
    collectedAt: "2024-03-17"
  },
  {
    id: 14,
    channelName: "여행 일기",
    videoTitle: "한 달 살기 비용 공개: 발리 편",
    description: "발리에서 한 달 동안 머물며 사용한 숙박비, 식비, 교통비 등 모든 지출 내역을 상세히 공개합니다. 디지털 노마드를 꿈꾸는 분들을 위한 실전 팁!",
    thumbnail: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=travel14",
    subscribers: "11만",
    views: "15만",
    likes: "8.2k",
    comments: "1.1k",
    status: "active",
    collectedAt: "2024-03-18"
  },
  {
    id: 15,
    channelName: "요리 명장",
    videoTitle: "실패 없는 스테이크 굽는 법 (팬 하나로 끝)",
    description: "레스토랑 부럽지 않은 육즙 가득 스테이크! 마이야르 반응부터 레스팅까지, 집에서도 완벽한 맛을 내는 과학적인 원리를 설명해 드립니다.",
    thumbnail: "https://images.unsplash.com/photo-1546241072-48010ad28c2c?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=cooking15",
    subscribers: "42만",
    views: "89만",
    likes: "45k",
    comments: "3.2k",
    status: "active",
    collectedAt: "2024-03-18"
  },
  {
    id: 16,
    channelName: "운동 가이드",
    videoTitle: "하루 10분 전신 지방 태우기 HIIT",
    description: "바쁜 현대인을 위한 고강도 인터벌 트레이닝! 짧은 시간 안에 칼로리 소모를 극대화하고 기초 대사량을 높여주는 운동 루틴입니다.",
    thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=fitness16",
    subscribers: "28만",
    views: "120만",
    likes: "68k",
    comments: "5.4k",
    status: "active",
    collectedAt: "2024-03-19"
  },
  {
    id: 17,
    channelName: "북 큐레이터",
    videoTitle: "인생이 허무할 때 읽어야 할 책 3권",
    description: "삶의 방향을 잃었을 때 위로와 통찰을 주는 철학 서적들을 소개합니다. 니체부터 쇼펜하우어까지, 고전이 주는 지혜를 만나보세요.",
    thumbnail: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=book17",
    subscribers: "6.5만",
    views: "4.2만",
    likes: "2.8k",
    comments: "180",
    status: "active",
    collectedAt: "2024-03-19"
  },
  {
    id: 18,
    channelName: "인테리어 팁",
    videoTitle: "좁은 방 넓어 보이게 만드는 가구 배치법",
    description: "원룸이나 작은 방 인테리어 고민 끝! 시각적인 개방감을 주는 컬러 선택과 가구 배치 노하우를 실제 시공 사례와 함께 알려드립니다.",
    thumbnail: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=interior18",
    subscribers: "14만",
    views: "22만",
    likes: "12k",
    comments: "890",
    status: "active",
    collectedAt: "2024-03-20"
  },
  {
    id: 19,
    channelName: "언어 마스터",
    videoTitle: "영어 회화, 쉐도잉만으로 가능할까?",
    description: "쉐도잉 학습법의 장단점을 분석하고, 실제 원어민처럼 자연스럽게 말하기 위해 병행해야 할 효과적인 공부 순서를 정리했습니다.",
    thumbnail: "https://images.unsplash.com/photo-1543167653-9962007320c0?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=english19",
    subscribers: "8.9만",
    views: "7.4만",
    likes: "3.5k",
    comments: "420",
    status: "active",
    collectedAt: "2024-03-20"
  },
  {
    id: 20,
    channelName: "사진 연구소",
    videoTitle: "밤 사진 잘 찍는 법 (노이즈 없는 야경)",
    description: "어두운 환경에서도 깨끗하고 선명한 밤 사진을 남기는 카메라 설정법! 삼각대 활용부터 후보정 기술까지 야경 사진의 모든 것.",
    thumbnail: "https://images.unsplash.com/photo-1502982722880-0e8a902d4ee6?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=photo20",
    subscribers: "5.4만",
    views: "2.8만",
    likes: "1.4k",
    comments: "110",
    status: "active",
    collectedAt: "2024-03-21"
  },
  {
    id: 21,
    channelName: "경제 인사이트",
    videoTitle: "반도체 업황 사이클 총정리 (2024 하반기 전망)",
    description: "글로벌 반도체 시장의 흐름과 국내 주요 기업들의 전략을 분석합니다. 다가올 AI 반도체 붐 속에서 주목해야 할 투자 포인트를 짚어봅니다.",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=economy21",
    subscribers: "19만",
    views: "11만",
    likes: "5.6k",
    comments: "670",
    status: "active",
    collectedAt: "2024-03-21"
  },
  {
    id: 22,
    channelName: "심플 라이프",
    videoTitle: "미니멀리즘 시작 후 내 삶에 일어난 5가지 변화",
    description: "물건을 비우는 것만으로도 마음의 여유가 생깁니다. 필요 없는 물건을 정리하며 얻은 시간적, 경제적 자유에 대해 이야기합니다.",
    thumbnail: "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=minimal22",
    subscribers: "7.2만",
    views: "18만",
    likes: "9.4k",
    comments: "1.2k",
    status: "active",
    collectedAt: "2024-03-22"
  },
  {
    id: 23,
    channelName: "자동차 리뷰",
    videoTitle: "전기차 살 때 반드시 확인해야 할 체크리스트",
    description: "충전 인프라부터 배터리 성능, 유지비까지! 전기차 구매를 고민하는 분들이라면 놓치지 말아야 할 현실적인 가이드를 제공합니다.",
    thumbnail: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=car23",
    subscribers: "31만",
    views: "25만",
    likes: "11k",
    comments: "2.1k",
    status: "active",
    collectedAt: "2024-03-22"
  },
  {
    id: 24,
    channelName: "명상 공간",
    videoTitle: "불안을 잠재우는 15분 수면 명상",
    description: "잠들기 전, 오늘 하루의 긴장을 풀고 편안한 휴식을 유도하는 명상 가이드입니다. 따뜻한 목소리와 함께 깊은 숙면에 빠져보세요.",
    thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400",
    url: "https://youtube.com/watch?v=meditation24",
    subscribers: "15만",
    views: "62만",
    likes: "32k",
    comments: "4.8k",
    status: "active",
    collectedAt: "2024-03-23"
  }
];

export default function ChannelCrawlingPage() {
  const [videos, setVideos] = useState(MOCK_VIDEOS);
  const [newChannelUrls, setNewChannelUrls] = useState<string[]>(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<typeof MOCK_VIDEOS[0] | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(videos.length / itemsPerPage);

  // Pagination Effect: current page should not exceed total pages
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Get current videos
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVideos = videos.slice(indexOfFirstItem, indexOfLastItem);

  const handleUrlChange = (index: number, value: string) => {
    const updated = [...newChannelUrls];
    updated[index] = value;
    setNewChannelUrls(updated);
  };

  const handleAddChannel = () => {
    const activeUrls = newChannelUrls.filter(url => url.trim() !== '');
    if (activeUrls.length === 0) return alert("최소 하나의 유튜브 URL을 입력해주세요.");
    
    // URL 형식 간단 검증
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    const invalidUrls = activeUrls.filter(url => !youtubeRegex.test(url));
    
    if (invalidUrls.length > 0) {
      return alert(`올바르지 않은 유튜브 URL이 포함되어 있습니다:\n${invalidUrls.join('\n')}`);
    }

    setIsLoading(true);
    
    setTimeout(() => {
      const newVideos = activeUrls.map((url, index) => ({
        id: videos.length + index + 1,
        channelName: "분석 중인 채널",
        videoTitle: "영상을 분석하고 있습니다...",
        description: "등록하신 URL을 기반으로 채널 정보와 영상 데이터를 추출 중입니다. 잠시 후 동기화 버튼을 눌러주세요.",
        thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=400",
        url: url,
        subscribers: "-",
        views: "-",
        likes: "-",
        comments: "-",
        status: "active",
        collectedAt: new Date().toISOString().split('T')[0]
      }));

      setVideos([...newVideos, ...videos]); // 최신 등록 건을 위로
      setNewChannelUrls(['', '', '', '', '']);
      setIsLoading(false);
      alert(`✅ ${activeUrls.length}개의 유튜브 영상/채널이 등록 프로세스에 추가되었습니다.`);
    }, 1500);
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
                    <FontAwesomeIcon icon={faSpinner} />
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
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-xl font-black flex items-center gap-3">
              <FontAwesomeIcon icon={faTv} className="text-[#a78bfa]" />
              현재 수집된 유튜브 영상
              <span className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-black text-slate-500 border border-white/10">
                TOTAL {videos.length}
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
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
                    const score = calcViralScore(video);
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
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-[#a78bfa]/10 hover:text-[#a78bfa] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              
              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl border font-black text-xs transition-all ${
                      currentPage === i + 1
                        ? "bg-[#a78bfa] border-[#a78bfa] text-white shadow-lg shadow-[#a78bfa]/20"
                        : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-white"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
