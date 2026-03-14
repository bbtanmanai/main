'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, faMobileAlt, faLightbulb, faCheckCircle, 
  faChevronRight, faArrowTrendUp, faUsers, faCircleCheck,
  faEye, faHeart, faShareNodes, faComment, faBookmark
} from '@fortawesome/free-solid-svg-icons';

Chart.register(...registerables);

const reelsTypes = [
  {
    id: 'entertainment',
    icon: '🎭',
    name: '엔터테인먼트 / 코미디',
    desc: '순수한 즐거움과 웃음을 목적으로 하는 콘텐츠입니다. 시각적, 청각적 자극이 강하며 바이럴 속도가 가장 빠릅니다.',
    subTypes: ['밈(Meme) 패러디', '댄스 챌린지', '오디오 더빙', '스케치 코미디'],
    stats: [95, 90, 85, 75, 30], // [도달, 좋아요, 공유, 댓글, 저장]
    insight: '높은 도달률과 공유(DM 전송)를 이끌어내어 신규 계정의 인지도를 급격히 높이는 최적의 포맷입니다.'
  },
  {
    id: 'edutainment',
    icon: '📚',
    name: '정보 전달 / 에듀테인먼트',
    desc: '유용한 정보, 꿀팁, 노하우를 짧고 흥미롭게 전달하는 유형입니다. 시청자가 나중에 다시 보기 위해 보관하려는 경향이 매우 강합니다.',
    subTypes: ['1분 꿀팁/노하우', '소프트웨어 튜토리얼', '미니 강의', '팩트 체크'],
    stats: [70, 75, 80, 60, 95],
    insight: '압도적인 "저장(Save)" 비율을 보입니다. 알고리즘에 긍정적인 신호를 주어 꾸준한 노출을 보장받는 롱테일 콘텐츠입니다.'
  },
  {
    id: 'lifestyle',
    icon: '☕',
    name: '라이프스타일 / 브이로그',
    desc: '크리에이터의 일상, 패션, 분위기를 감각적으로 보여주는 유형입니다. 시청자와의 친밀감과 공감대를 형성하는 데 주력합니다.',
    subTypes: ['Day in the Life', 'GRWM (외출 준비)', 'OOTD (오늘의 패션)', '감성 여행기'],
    stats: [80, 85, 50, 70, 50],
    insight: '시청자의 "좋아요" 반응이 좋으며, 크리에이터 본인에 대한 호감도(팬덤)를 구축하는 데 필수적입니다.'
  },
  {
    id: 'review',
    icon: '📦',
    name: '리뷰 / 추천 (Curation)',
    desc: '특정 제품, 장소, 서비스에 대한 경험을 공유하고 추천하는 콘텐츠입니다. 상업적 전환율과 직접적으로 연결되는 경우가 많습니다.',
    subTypes: ['내돈내산 언박싱', '맛집/핫플 리스트', 'TOP 5 큐레이션', '비포 & 애프터'],
    stats: [75, 70, 75, 60, 90],
    insight: '정보성 콘텐츠와 마찬가지로 "저장" 비율이 높으며, 시청자의 구매 결정에 강력한 영향을 미칩니다.'
  },
  {
    id: 'behind',
    icon: '🎬',
    name: '비하인드 씬 / 메이킹',
    desc: '결과물이 아닌 과정, 실패담, 인간적인 면모를 보여주는 유형입니다. 브랜드나 크리에이터의 진정성을 어필합니다.',
    subTypes: ['제품 포장/제작 과정', '촬영장 NG 컷', '크리에이터의 하루', '브랜드 스토리'],
    stats: [60, 80, 40, 85, 30],
    insight: '도달률 자체는 낮을 수 있으나, 기존 팔로워들의 "댓글" 참여도가 매우 높아 탄탄한 커뮤니티 형성에 기여합니다.'
  },
  {
    id: 'interactive',
    icon: '🤝',
    name: '참여형 / 인터랙티브',
    desc: '시청자의 직접적인 행동(투표, 댓글, 리믹스 등)을 유도하도록 설계된 콘텐츠입니다.',
    subTypes: ['Q&A 응답', '리믹스/듀엣 유도', '화면 캡처 게임', '의견 묻기 (A vs B)'],
    stats: [85, 80, 70, 95, 40],
    insight: '"댓글"과 체류시간을 극대화하도록 설계되어 알고리즘 부스트를 받기 쉬운 전략적 포맷입니다.'
  }
];

export default function InstagramBizPage() {
  const [currentType, setCurrentType] = useState(reelsTypes[0]);
  const radarChartRef = useRef<HTMLCanvasElement>(null);
  const doughnutChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  
  const radarChartInstance = useRef<Chart | null>(null);
  const doughnutChartInstance = useRef<Chart | null>(null);
  const barChartInstance = useRef<Chart | null>(null);

  // Radar Chart Effect
  useEffect(() => {
    if (radarChartRef.current) {
      const ctx = radarChartRef.current.getContext('2d');
      if (ctx) {
        if (radarChartInstance.current) radarChartInstance.current.destroy();
        
        radarChartInstance.current = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['도달', '좋아요', '공유', '댓글', '저장'],
            datasets: [{
              label: currentType.name,
              data: currentType.stats,
              backgroundColor: 'rgba(225, 48, 108, 0.2)',
              borderColor: 'rgba(225, 48, 108, 1)',
              borderWidth: 4,
              pointBackgroundColor: 'rgba(225, 48, 108, 1)',
              pointRadius: 5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
              r: { 
                min: 0, max: 100, 
                ticks: { display: false },
                pointLabels: { font: { size: 12, weight: 'bold' } }
              } 
            },
            plugins: { legend: { display: false } }
          }
        });
      }
    }
    return () => { if (radarChartInstance.current) radarChartInstance.current.destroy(); };
  }, [currentType]);

  // Global Trends Charts Effect
  useEffect(() => {
    // Doughnut Chart
    if (doughnutChartRef.current) {
      const ctx = doughnutChartRef.current.getContext('2d');
      if (ctx) {
        if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
        doughnutChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['엔터테인먼트', '라이프스타일', '에듀테인먼트', '리뷰/추천', '비하인드 씬', '참여형'],
            datasets: [{
              data: [35, 25, 15, 10, 10, 5],
              backgroundColor: ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888', '#4b5563'],
              borderWidth: 0,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
            },
            cutout: '65%'
          }
        });
      }
    }

    // Bar Chart
    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext('2d');
      if (ctx) {
        if (barChartInstance.current) barChartInstance.current.destroy();
        barChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['단순 휴식', '트렌드 파악', '정보 습득', '제품 검색', '소통'],
            datasets: [{
              label: '소비 목적 (%)',
              data: [82, 65, 58, 45, 30],
              backgroundColor: '#dc2743',
              borderRadius: 8,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
              x: { beginAtZero: true, max: 100, grid: { display: false } },
              y: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
          }
        });
      }
    }

    return () => {
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
      if (barChartInstance.current) barChartInstance.current.destroy();
    };
  }, []);

  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-24">
      {/* 1. Header Area */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <header className="max-w-5xl mx-auto py-10 px-6 text-center">
          <span className="inline-block py-1.5 px-5 rounded-full bg-pink-600 text-white text-[10px] font-black mb-4 tracking-widest shadow-lg shadow-pink-200 uppercase">Strategic Research 2026</span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tighter leading-tight">
            인스타그램 릴스(Reels)<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]">콘텐츠 유형 6분법</span>
          </h1>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 text-[11px] font-bold text-gray-600">
              <FontAwesomeIcon icon={faUsers} className="text-pink-600" /> 누적 분석 12만+
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 text-[11px] font-bold text-gray-600">
              <FontAwesomeIcon icon={faChartLine} className="text-pink-600" /> 도달 상승률 420%
            </div>
          </div>
        </header>
      </div>

      {/* 2. Main Content (Interactive Explorer) */}
      <main className="max-w-6xl mx-auto px-6 pt-16 relative z-10">
        <div className="mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
            <span className="w-2 h-8 bg-pink-600 rounded-full"></span> 💡 6대 릴스 유형 탐색기
          </h2>
          <p className="text-gray-500 font-bold ml-5">수천 개의 바이럴 릴스를 분석하여 도출된 핵심 성공 모델입니다.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start mb-24">
          
          {/* Navigation — 2단 구성 */}
          <aside className="xl:col-span-4 self-start">
            <div className="bg-white p-5 rounded-[32px] shadow-xl border border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                {reelsTypes.map((type, idx) => (
                  <button
                    key={type.id}
                    onClick={() => setCurrentType(type)}
                    className={`group relative flex flex-col items-center justify-between gap-0 px-4 py-6 rounded-2xl transition-all text-center min-h-[140px] ${
                      currentType.id === type.id
                        ? 'bg-pink-600 text-white shadow-lg shadow-pink-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className={`self-start text-[10px] font-black uppercase tracking-widest ${currentType.id === type.id ? 'text-pink-200' : 'text-gray-300'}`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-4xl group-hover:scale-110 transition-transform leading-none my-1">{type.icon}</span>
                    <span className={`text-[15px] font-black leading-snug w-full text-center ${currentType.id === type.id ? 'text-white' : 'text-gray-800'}`}>
                      {type.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Detail View */}
          <div className="xl:col-span-8">
            <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
              {/* Info Section */}
              <div className="p-8 md:p-12 border-b border-gray-50">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-5xl shadow-inner animate-bounce-slow">
                    {currentType.icon}
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">{currentType.name}</h2>
                    <p className="text-pink-600 font-black text-[18px]">Reels Content Type No.{reelsTypes.indexOf(currentType) + 1}</p>
                  </div>
                </div>
                <p className="text-[24px] text-gray-700 leading-relaxed font-bold mb-10 italic">"{currentType.desc}"</p>
                
                <h4 className="text-[14px] font-black text-gray-400 uppercase tracking-widest mb-4">현장의 핵심 포맷들</h4>
                <div className="flex flex-wrap gap-3">
                  {currentType.subTypes.map(tag => (
                    <span key={tag} className="px-5 py-2.5 bg-gray-100 text-gray-800 rounded-2xl text-[16px] font-black border border-gray-200"># {tag}</span>
                  ))}
                </div>
              </div>

              {/* Stats & Insight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                <div className="p-8 md:p-12 bg-gray-50">
                  <h4 className="font-black text-blue-800 text-[20px] mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faLightbulb} /> 전략적 인사이트
                  </h4>
                  <p className="text-[19px] text-blue-900 font-medium leading-snug bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                    {currentType.insight}
                  </p>
                </div>
                <div className="p-8 md:p-12 flex flex-col items-center justify-center bg-white border-l border-gray-50">
                  <h4 className="font-black text-gray-400 text-[12px] mb-6 uppercase tracking-widest">인게이지먼트 5대 지표 분석</h4>
                  <div className="w-full h-[280px] max-w-[280px]">
                    <canvas ref={radarChartRef}></canvas>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Global Trends (Missing in previous version) */}
        <div className="mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-600 rounded-full"></span> 📊 생태계 트렌드 분석
          </h2>
          <p className="text-gray-500 font-bold ml-5">전체 플랫폼 데이터를 통해 조망하는 숏폼의 미래입니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-gray-100 flex flex-col items-center">
            <h3 className="font-black text-[20px] mb-2 text-center text-gray-800">플랫폼 내 유형별 발행 비율</h3>
            <p className="text-sm text-gray-400 mb-8 font-bold">전체 릴스 중 각 유형이 차지하는 비중</p>
            <div className="w-full h-[300px]">
              <canvas ref={doughnutChartRef}></canvas>
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-gray-100 flex flex-col items-center">
            <h3 className="font-black text-[20px] mb-2 text-center text-gray-800">시청자의 릴스 소비 목적</h3>
            <p className="text-sm text-gray-400 mb-8 font-bold">사용자 설문 기반 복수 응답 (%)</p>
            <div className="w-full h-[300px]">
              <canvas ref={barChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* 4. Final Conclusion */}
        <div className="bg-gray-900 text-white p-12 md:p-20 rounded-[60px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>
          
          <div className="relative z-10">
            <h3 className="text-3xl md:text-4xl font-black mb-12 text-pink-400 flex items-center gap-4">
              <FontAwesomeIcon icon={faCheckCircle} /> 공동감독 김감독의 최종 코칭
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/5 p-8 rounded-[32px] border border-white/10">
                <div className="text-pink-500 text-2xl font-black mb-4">Save</div>
                <h4 className="text-xl font-black mb-3">저장(Save) 전략</h4>
                <p className="text-gray-400 text-[16px] leading-relaxed font-medium">
                  '에듀테인먼트'와 '리뷰' 유형은 정보의 밀도가 생명입니다. 시청자가 나중에 꺼내보도록 만드세요.
                </p>
              </div>
              <div className="bg-white/5 p-8 rounded-[32px] border border-white/10">
                <div className="text-blue-500 text-2xl font-black mb-4">Share</div>
                <h4 className="text-xl font-black mb-3">공유(Share) 전략</h4>
                <p className="text-gray-400 text-[16px] leading-relaxed font-medium">
                  '엔터테인먼트' 유형은 공감이 핵심입니다. 친구에게 DM으로 보내고 싶은 충동을 일으키세요.
                </p>
              </div>
              <div className="bg-white/5 p-8 rounded-[32px] border border-white/10">
                <div className="text-yellow-500 text-2xl font-black mb-4">Brand</div>
                <h4 className="text-xl font-black mb-3">브랜딩(Brand) 전략</h4>
                <p className="text-gray-400 text-[16px] leading-relaxed font-medium">
                  화려함보다 '진정성'이 팔로워를 만듭니다. '비하인드'와 '라이프스타일'을 섞으세요.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <p className="text-gray-500 font-mono text-[12px] uppercase tracking-[0.3em] mb-4">Verification Certificate</p>
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 rounded-full border border-white/10 text-white font-black text-lg">
                <FontAwesomeIcon icon={faCircleCheck} className="text-green-500" /> 전략 검증 및 구현 완료
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
