'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLightbulb, faChartPie, faRocket, faCogs, faHandshake, 
  faEdit, faRobot, faIndustry, faPaintBrush, faMicrophoneAlt,
  faUsers, faSearchDollar, faGraduationCap, faWallet, faArrowTrendUp
} from '@fortawesome/free-solid-svg-icons';

import WaveDivider from '@/components/WaveDivider';

Chart.register(...registerables);

const typologyData: any = {
  strategy: {
    title: "AI 도입 전략 컨설팅",
    icon: faLightbulb,
    description: "기업이나 개인의 업무 프로세스에 AI를 결합하여 생산성을 극대화하는 로드맵을 설계합니다.",
    models: ["맞춤형 AI 도입 진단 리포트", "기업 내 AI 활용 가이드라인 수립", "1:1 AI 비즈니스 코칭"],
    tools: ["ChatGPT Team", "Claude for Enterprise", "Notion AI"],
    tip: "기술 설명보다는 '비용 절감'과 '시간 단축' 수치를 명확히 제시하는 것이 핵심입니다."
  },
  digital: {
    title: "AI 기반 디지털 상품제작",
    icon: faEdit,
    description: "AI로 제작한 전자책, 노션 템플릿, 프롬프트 패키지 등 무형의 자산을 만들어 판매합니다.",
    models: ["특화 주제 전자책(PDF) 출판", "고효율 프롬프트 팩 판매", "디지털 디자인 에셋"],
    tools: ["Midjourney", "Canva", "Gamma"],
    tip: "작가님의 고유한 '경험'이 담긴 프롬프트는 그 자체로 강력한 유료 상품이 됩니다."
  },
  agency: {
    title: "전문 AI 컨텐츠 에이전시",
    icon: faHandshake,
    description: "블로그, 인스타그램, 뉴스레터 등 기업의 SNS 채널을 AI를 활용해 고품질로 운영 대행합니다.",
    models: ["주간 뉴스레터 발행 대행", "수익형 블로그 포스팅 자동화 관리", "SNS 텍스트/이미지 큐레이션"],
    tools: ["Firecrawl", "Perplexity", "Beehiiv"],
    tip: "단순 발행을 넘어 '인게이지먼트(댓글/좋아요)' 성과를 리포트하는 것이 재계약의 열쇠입니다."
  },
  pipeline: {
    title: "수익화 & 머니 파이프라인",
    icon: faSearchDollar,
    description: "AI 자동화 툴을 이용해 제휴 마케팅, 애드센스 등 지속적인 패시브 인컴 시스템을 구축합니다.",
    models: ["유튜브 자동화 채널 운영", "제휴 마케팅 랜딩페이지 자동 생성", "해외 구매대행 상품 정보 번역/등록"],
    tools: ["Make.com", "Zapier", "DeepL API"],
    tip: "초기에 시스템을 정교하게 구축해두면, 최소한의 관리로 24시간 수익이 발생합니다."
  },
  chatbot: {
    title: "AI 챗봇 및 가상비서 컨설팅",
    icon: faRobot,
    description: "고객 응대, 사내 지식 베이스 조회 등 특정 목적에 맞는 커스텀 챗봇을 구축해 주는 서비스입니다.",
    models: ["쇼핑몰 CS 자동 응대 챗봇", "변호사/세무사 전용 상담 보조 AI", "사내 업무 매뉴얼 학습 챗봇"],
    tools: ["Custom GPTs", "Dify", "Voiceflow"],
    tip: "상담원의 업무를 50% 이상 줄여줄 수 있다는 점을 강조하여 프로젝트를 수주하세요."
  },
  factory: {
    title: "90% 자동화 제작공장",
    icon: faIndustry,
    description: "대량의 쇼츠, 릴스, 롱폼 영상을 AI 파이프라인을 통해 공장처럼 찍어내는 시스템을 제공합니다.",
    models: ["숏폼 영상 대량 제작 구독 서비스", "기업 홍보 영상 자동화 시스템 구축", "개인 브랜드용 일간 영상 팩"],
    tools: ["LinkDrop Opal", "Vrew", "HeyGen"],
    tip: "퀄리티와 양의 균형을 맞춘 '파이프라인 자체'를 기업에 판매할 수도 있습니다."
  },
  branding: {
    title: "AI 그래픽 디자인 & 브랜딩",
    icon: faPaintBrush,
    description: "로고, 브랜드 컬러, 캐릭터 IP 등을 AI로 정교하게 설계하여 브랜드 가치를 높입니다.",
    models: ["AI 생성 캐릭터 IP 개발", "브랜드 로고 및 비주얼 가이드", "패키지 디자인 시안 제작"],
    tools: ["Midjourney v6", "DALL-E 3", "Adobe Firefly"],
    tip: "디자이너의 감각에 AI의 속도를 더해 고객에게 10배 많은 시안을 제시할 수 있습니다."
  },
  global: {
    title: "AI 비디오 현지화 및 성우",
    icon: faMicrophoneAlt,
    description: "국내 영상을 글로벌 시장에 맞게 다국어 더빙 및 현지화하여 수출을 돕는 서비스입니다.",
    models: ["다국어 유튜브 더빙 서비스", "AI 아바타 활용 교육 영상 제작", "글로벌 광고 영상 로컬라이징"],
    tools: ["ElevenLabs", "Rask.ai", "Lovo.ai"],
    tip: "단순 번역이 아닌 '문화적 정서'에 맞는 목소리 톤 선택이 글로벌 진출의 성공을 좌우합니다."
  },
  guide: {
    title: "26년 AI 협업 가이드",
    icon: faUsers,
    description: "조직 내에서 AI와 인간이 어떻게 협업할 것인가에 대한 실무 툴 사용법 및 문화 교육을 제공합니다.",
    models: ["팀 내 AI 협업 툴(Cursor/Trae) 교육", "AI 활용 실무 원데이 워크숍", "협업 자동화 워크플로우 구축"],
    tools: ["Slack AI", "Microsoft 365 Copilot", "Gemini CLI"],
    tip: "기술 교육보다는 '팀의 커뮤니케이션 비용'을 얼마나 줄여주는지에 집중하세요."
  },
  seo: {
    title: "AI SEO 및 데이터 분석",
    icon: faChartPie,
    description: "AI로 검색 트렌드를 분석하고 구글/네이버 상위 노출을 위한 콘텐츠 최적화 전략을 제공합니다.",
    models: ["키워드 분석 기반 콘텐츠 전략 리포트", "AI 활용 검색 최적화(SEO) 진단", "시장 트렌드 데이터 대시보드 구축"],
    tools: ["Ahrefs", "Semrush", "Python Pandas"],
    tip: "데이터는 거짓말을 하지 않습니다. 근거 있는 숫자로 고객의 신뢰를 확보하세요."
  },
  edu: {
    title: "AI 기반 개인화 교육/코칭",
    icon: faGraduationCap,
    description: "학습자의 수준에 맞춰 AI가 진도를 조절하고 피드백을 주는 스마트 교육 플랫폼 모델입니다.",
    models: ["1:1 AI 튜터링 서비스", "맞춤형 학습지 자동 생성 판매", "작가님만의 경험 전수 코칭 플랫폼"],
    tools: ["OpenAI Realtime API", "Teachable", "Thinkific"],
    tip: "교육의 본질은 '동기부여'입니다. AI는 도구일 뿐, 작가님의 따뜻한 코칭이 결합되어야 합니다."
  },
  finance: {
    title: "틈새시장 공략 AI 금융도구",
    icon: faWallet,
    description: "특화된 데이터를 바탕으로 투자 보조, 세무 자동화 등 실질적 금전 이득을 주는 툴을 제공합니다.",
    models: ["개인 맞춤형 가계부 자동화 서비스", "AI 기반 암호화폐/주식 트렌드 알림", "1인 기업용 세무 자동 계산기"],
    tools: ["Python Quant", "TradingView AI", "Custom API"],
    tip: "사용자가 '돈을 벌거나 아낄 수 있음'을 직관적으로 보여주는 것이 가장 강력한 세일즈입니다."
  }
};

export default function OnlineSidejobPage() {
  const [activeKey, setActiveKey] = useState('strategy');
  const trendChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (trendChartRef.current) {
      const ctx = trendChartRef.current.getContext('2d');
      if (ctx) {
        if (chartInstance.current) chartInstance.current.destroy();
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['2023', '2024', '2025(E)', '2026(E)', '2027(E)'],
            datasets: [{
              label: 'AI 비즈니스 성장 곡선 (억 달러)',
              data: [137, 360, 650, 1050, 1500],
              borderColor: '#0d9488',
              backgroundColor: 'rgba(13, 148, 136, 0.1)',
              borderWidth: 4,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#0d9488',
              pointRadius: 5
            }]
          },
          options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: {
              y: { grid: { color: 'rgba(0,0,0,0.05)' } },
              x: { grid: { display: false } }
            }
          }
        });
      }
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, []);

  const data = typologyData[activeKey];

  return (
    <div className="bg-[#FCFCFC] min-h-screen pb-24 relative">
      {/* 1. Header Section with Inverted Wave */}
      <header className="relative pt-32 pb-20 text-center bg-[#0f172a] overflow-hidden mb-16">
        {/* Large slow inverted wave at the top */}
        <WaveDivider 
          mode="inverted" 
          speedMultiplier={1.2} 
          height="h-[100px] md:h-[180px]" 
          opacity="opacity-40"
        />
        
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(13,148,136,0.15)_0%,transparent_70%)] pointer-events-none"></div>

        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tighter">
            2026 AI 시대, <span className="text-[#2dd4bf]">수익화 12대 전략</span>
          </h1>
          <p className="text-[20px] text-slate-400 font-bold max-w-2xl mx-auto">
            폭발하는 AI 시장, 작가님의 기회는 어디에 있습니까?<br/>
            실전 비즈니스 모델로 무장하세요.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6">
        {/* 2. Top Chart Section (Market Context) */}
        <section className="bg-white rounded-[40px] shadow-2xl border border-slate-100 p-8 md:p-12 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0d9488]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center relative z-10">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <FontAwesomeIcon icon={faArrowTrendUp} className="text-[#0d9488]" />
                AI 시장 성장 지표 및 1인 기업 기회 전망
              </h2>
              <div className="h-[300px] w-full">
                <canvas ref={trendChartRef}></canvas>
              </div>
            </div>
            <div className="bg-[#f0fdfa] p-8 rounded-[32px] border border-[#ccfbf1] h-full flex flex-col justify-center">
              <h3 className="text-[24px] font-black text-[#0f766e] mb-4 leading-tight">"지금이 가장<br/>저렴한 진입 시기입니다."</h3>
              <p className="text-[17px] text-[#0d9488] font-bold leading-relaxed mb-6">
                글로벌 생성형 AI 시장은 매년 40% 이상 성장 중입니다. 공급이 수요를 따라가지 못하는 지금, 전략적인 선점이 필요합니다.
              </p>
              <div className="flex items-center gap-2 text-sm font-black text-[#0f766e] uppercase tracking-widest bg-white/50 py-2 px-4 rounded-full self-start">
                <span className="w-2 h-2 bg-[#0d9488] rounded-full animate-ping"></span>
                Market High Priority
              </div>
            </div>
          </div>
        </section>

        {/* 3. Strategy Selection Section */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* Left: 12 Types Selector */}
          <div className="xl:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <h3 className="col-span-full text-[22px] font-black mb-2 text-slate-800 ml-2">12대 수익화 유형 선택</h3>
            {Object.keys(typologyData).map(key => (
              <button 
                key={key}
                onClick={() => setActiveKey(key)}
                className={`text-left p-5 rounded-2xl border-2 transition-all group ${activeKey === key ? 'border-[#0d9488] bg-[#f0fdfa] shadow-lg scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${activeKey === key ? 'bg-[#0d9488] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                    <FontAwesomeIcon icon={typologyData[key].icon} />
                  </div>
                  <span className={`text-[15px] font-black ${activeKey === key ? 'text-slate-900' : 'text-slate-500'}`}>{typologyData[key].title}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Detailed Analysis Dashboard */}
          <div className="xl:col-span-7">
            <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 p-8 md:p-12 min-h-[600px] sticky top-24 flex flex-col">
              <div className="animate-fadeIn flex-grow">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-[#f0fdfa] rounded-3xl flex items-center justify-center text-4xl text-[#0d9488] shadow-inner">
                    <FontAwesomeIcon icon={data.icon} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-1">{data.title}</h2>
                    <span className="text-[#0d9488] font-black text-sm uppercase tracking-widest">Business Model Insight</span>
                  </div>
                </div>

                <p className="text-[22px] text-slate-600 mb-10 leading-relaxed font-bold italic">"{data.description}"</p>
                
                <div className="space-y-8 mb-10">
                  <div>
                    <h4 className="font-black text-slate-800 text-[18px] mb-4 flex items-center gap-3">
                      <span className="w-2 h-6 bg-[#0d9488] rounded-full"></span> 실전 수익 창출 모델
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {data.models.map((m: string, i: number) => (
                        <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-[17px] text-slate-700 font-bold flex items-start gap-3">
                          <span className="text-[#0d9488]">✔</span> {m}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-400 text-[14px] mb-3 uppercase tracking-tighter">추천 AI 도구 배관</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.tools.map((t: string) => (
                        <span key={t} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black shadow-sm">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 mt-auto">
                  <h4 className="text-amber-800 font-black text-[18px] mb-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={faLightbulb} /> 공동감독 김감독의 핵심 조언
                  </h4>
                  <p className="text-amber-700 font-bold text-[17px] leading-snug">{data.tip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Action Plan Section */}
        <div className="mt-20 py-16 bg-slate-900 rounded-[50px] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#0d9488]/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-12 flex items-center justify-center gap-4">
              <FontAwesomeIcon icon={faRocket} className="text-yellow-400" />
              작가님을 위한 1인 기업 실행 로드맵
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all">
                <div className="text-4xl font-black text-[#0d9488] mb-4">01</div>
                <h4 className="text-xl font-black mb-2 text-white">분야 선정</h4>
                <p className="text-gray-400 text-sm font-bold">작가님의 전문 분야(태그)를 AI와 연결하세요.</p>
              </div>
              <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all">
                <div className="text-4xl font-black text-[#0d9488] mb-4">02</div>
                <h4 className="text-xl font-black mb-2 text-white">도구 마스터</h4>
                <p className="text-gray-400 text-sm font-bold">핵심 AI 툴 2개를 완벽하게 내 몸처럼 만드세요.</p>
              </div>
              <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all">
                <div className="text-4xl font-black text-[#0d9488] mb-4">03</div>
                <h4 className="text-xl font-black mb-2 text-white">매일 기록</h4>
                <p className="text-gray-400 text-sm font-bold">소규모 포트폴리오를 SNS에 매일 기록하세요.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
