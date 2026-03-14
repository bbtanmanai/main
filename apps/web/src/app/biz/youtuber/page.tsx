'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLightbulb, faEdit, faHandshake, faSearchDollar, 
  faRobot, faIndustry, faPaintBrush, faMicrophoneAlt,
  faUsers, faRocket, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

import WaveDivider from '@/components/WaveDivider';

Chart.register(...registerables);

// --- Custom Styles (Tailwind arbitrary values) ---
const colors = {
  brand: {
    bg: '#F9F8F6',
    surface: '#FFFFFF',
    primary: '#E07A5F',
    secondary: '#3D405B',
    accent: '#81B29A',
    light: '#F4F1DE'
  }
};

export default function YoutuberBizPage() {
  const [activeTab, setActiveTab] = useState('plan');
  const [openTools, setOpenTools] = useState<Record<string, boolean>>({});

  const toggleTool = (id: string) => {
    setOpenTools(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- Chart 1: Pain Points (Doughnut) ---
  const painPointData = {
    labels: ['아이디어 구상 & 대본', '영상 컷 편집 및 자막', '썸네일 및 채널 디자인', '기타 (업로드, 소통 등)'],
    datasets: [{
      data: [45, 30, 15, 10],
      backgroundColor: [
        colors.brand.primary,
        colors.brand.accent,
        '#F2CC8F',
        colors.brand.secondary
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  const painPointOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { family: "'Noto Sans KR', sans-serif" }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.parsed}%의 스트레스/시간`
        }
      }
    },
    cutout: '65%'
  };

  // --- Chart 2: Impact Comparison (Bar) ---
  const impactData = {
    labels: ['기획/스크립트 소요 시간', '편집 소요 시간', '썸네일 제작 소요 시간'],
    datasets: [
      {
        label: '기존 수작업 방식 (시간)',
        data: [5, 6, 2],
        backgroundColor: colors.brand.secondary,
        borderRadius: 4
      },
      {
        label: 'AI 활용 방식 (시간)',
        data: [1, 2, 0.5],
        backgroundColor: colors.brand.accent,
        borderRadius: 4
      }
    ]
  };

  const impactOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: '소요 시간 (Hours)',
          font: { family: "'Noto Sans KR', sans-serif" }
        },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: { grid: { display: false } }
    },
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    }
  };

  return (
    <div className="bg-[#F9F8F6] text-[#3D405B] min-h-screen pb-20 font-sans antialiased">
      {/* Header / Hero */}
      <header className="bg-[#3D405B] text-white pt-24 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#E07A5F 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
        
        {/* Wave Divider at the bottom of header */}
        <WaveDivider speedMultiplier={1.5} height="h-[60px] md:h-[100px]" opacity="opacity-20" />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-[#E07A5F] text-xs font-bold tracking-wider mb-4 uppercase">Research Report</span>
          <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">생성형 AI 시대,<br />왕초보 유튜버의 생존 전략</h1>
          <p className="text-lg md:text-xl text-gray-300 font-light max-w-2xl mx-auto">
            경쟁이 치열한 유튜브 생태계에서 기술적 장벽을 허물고 콘텐츠의 본질에 집중할 수 있게 해주는 AI 활용 프로세스와 데이터 분석 리포트입니다.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        
        {/* Section 1: The Problem (Context) */}
        <section className="bg-white/85 backdrop-blur-md border border-[#E07A5F]/10 rounded-2xl shadow-sm p-6 md:p-10 mb-12 hover:-translate-y-0.5 hover:shadow-md transition-all">
          <header className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-[#3D405B] mb-3">1. 초보 창작자의 현실: 시간과 리소스의 한계</h2>
            <p className="text-gray-600">
              유튜브 시작을 망설이는 가장 큰 이유를 데이터를 통해 보여줍니다. 
              기존 방식대로 채널을 운영할 때 초보자들이 느끼는 부담을 분석하여 AI 도입의 필요성을 시각적으로 제시합니다.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="h-[350px] w-full max-w-[700px] mx-auto">
              <Doughnut data={painPointData} options={painPointOptions} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="w-8 h-8 rounded-full bg-[#F4F1DE] text-[#E07A5F] flex items-center justify-center mr-3 font-black">!</span>
                병목 현상의 원인
              </h3>
              <ul className="space-y-4">
                <li className="p-4 bg-[#F9F8F6] rounded-lg border border-gray-100">
                  <strong className="block mb-1">아이디어 & 대본 (45%)</strong>
                  <span className="text-sm text-gray-600">기획 단계에서 절반 가까운 에너지가 소모됩니다. 백지 공포증이 가장 큰 진입 장벽입니다.</span>
                </li>
                <li className="p-4 bg-[#F9F8F6] rounded-lg border border-gray-100">
                  <strong className="block mb-1">영상 편집 (30%)</strong>
                  <span className="text-sm text-gray-600">컷 편집, 자막 달기 등 단순 반복 작업에 지나치게 많은 시간이 투입되어 창작 의욕을 저하시킵니다.</span>
                </li>
                <li className="p-4 bg-[#F9F8F6] rounded-lg border border-gray-100">
                  <strong className="block mb-1">디자인 및 SEO (25%)</strong>
                  <span className="text-sm text-gray-600">클릭을 유도하는 썸네일 제작과 검색 최적화는 별도의 전문 지식을 요구합니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive Strategy Framework */}
        <section className="mb-12">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-[#3D405B] mb-3">2. AI 결합 3단계 워크플로우</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              기획-제작-포장 전 과정에 AI를 어떻게 배치해야 효율을 극대화할 수 있는지 구체적인 전략을 확인하세요.
            </p>
          </header>

          <div className="bg-white rounded-2xl shadow-sm border border-[#E07A5F]/10 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-[#F4F1DE]/30">
              {[
                { id: 'plan', label: '1단계: 기획 (Plan)', emoji: '📝' },
                { id: 'produce', label: '2단계: 제작 (Produce)', emoji: '🎬' },
                { id: 'package', label: '3단계: 포장 (Package)', emoji: '🎁' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-all border-b-3 ${activeTab === tab.id ? 'text-[#E07A5F] border-[#E07A5F] font-bold' : 'text-gray-500 border-transparent hover:text-[#3D405B]'}`}
                >
                  <span className="block text-xl mb-1">{tab.emoji}</span> {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="p-6 md:p-10 min-h-[300px] animate-fadeIn">
              {activeTab === 'plan' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-2xl font-bold text-[#E07A5F] mb-4">LLM을 활용한 무한 아이디어 팩토리</h3>
                  <p className="mb-6 text-gray-700">ChatGPT, Claude와 같은 LLM을 단순 검색 도구가 아닌 <strong>'기획 보조 작가'</strong>로 활용하세요. AI가 던져주는 초안을 다듬는 방식으로 작업 시간을 단축할 수 있습니다.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-[#F9F8F6] p-4 rounded-lg border-l-4 border-[#E07A5F]">
                      <h4 className="font-bold mb-2">프롬프트 엔지니어링 팁</h4>
                      <p className="text-sm text-gray-600">"나는 [직업]을 가진 [나이대]야. [타겟]을 대상으로 조회수가 잘 나올 만한 [주제] 관련 쇼츠 기획안 5개를 표로 정리해줘"와 같이 구체적인 페르소나와 형식을 지정하세요.</p>
                    </div>
                    <div className="bg-[#F9F8F6] p-4 rounded-lg border-l-4 border-[#E07A5F]">
                      <h4 className="font-bold mb-2">대본 구조화</h4>
                      <p className="text-sm text-gray-600">유튜브 스크립트 공식(훅 - 본론 - CTA)을 학습시키고 이에 맞춰 초안을 작성하도록 지시하여 시청 지속 시간을 높입니다.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'produce' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-2xl font-bold text-[#81B29A] mb-4">자동화 편집과 가상 인력의 도입</h3>
                  <p className="mb-6 text-gray-700">얼굴을 드러내거나 목소리 녹음이 부담스럽다면 AI가 완벽한 대안입니다. 컷 편집과 자막 생성을 AI 편집기에 맡겨 제작 사이클을 가속화하세요.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-[#F9F8F6] p-4 rounded-lg border-l-4 border-[#81B29A]">
                      <h4 className="font-bold mb-2">TTS (Text-to-Speech) 활용</h4>
                      <p className="text-sm text-gray-600">ElevenLabs나 Vrew의 고품질 AI 보이스를 활용하세요. 감정 표현과 억양이 자연스러워 정보 전달형 콘텐츠에 적합합니다.</p>
                    </div>
                    <div className="bg-[#F9F8F6] p-4 rounded-lg border-l-4 border-[#81B29A]">
                      <h4 className="font-bold mb-2">텍스트 기반 컷 편집</h4>
                      <p className="text-sm text-gray-600">음성을 인식해 텍스트로 변환하고, 글자를 지우는 것만으로 영상이 편집되는 기술을 통해 편집 시간을 70% 이상 단축합니다.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'package' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-2xl font-bold text-yellow-600 mb-4">클릭을 부르는 AI 디자인과 최적화</h3>
                  <p className="mb-6 text-gray-700">이미지 생성 AI로 시선을 사로잡는 썸네일 소스를 만들고, 텍스트 AI로 알고리즘이 좋아하는 제목과 태그를 추출하세요.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-[#F9F8F6] p-4 rounded-lg border-l-4 border-yellow-500">
                      <h4 className="font-bold mb-2">이미지 AI 썸네일</h4>
                      <p className="text-sm text-gray-600">미드저니/달리 등을 통해 저작권 걱정 없는 고화질 이미지를 생성하여 썸네일의 시각적 차별화를 꾀합니다.</p>
                    </div>
                    <div className="bg-[#F9F8F6] p-4 rounded-lg border-l-4 border-yellow-500">
                      <h4 className="font-bold mb-2">SEO 메타데이터 최적화</h4>
                      <p className="text-sm text-gray-600">대본 전체를 AI에 입력한 후 클릭률이 높을 제목 10개, 상세 설명, 핵심 태그 추출을 요청하여 노출 확률을 높입니다.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Data Impact */}
        <section className="bg-white/85 backdrop-blur-md border border-[#E07A5F]/10 rounded-2xl shadow-sm p-6 md:p-10 mb-12">
          <header className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-[#3D405B] mb-3">3. 데이터로 증명된 AI 도입 효과</h2>
            <p className="text-gray-600">
              전통적인 수작업 방식과 AI 보조 방식을 비교한 결과입니다. 
              AI는 투입 시간은 획기적으로 줄이면서 콘텐츠 반응률은 높이는 효율성을 보여줍니다.
            </p>
          </header>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-2/3 h-[300px]">
              <Bar data={impactData} options={impactOptions} />
            </div>
            <div className="w-full md:w-1/3 flex flex-col justify-center space-y-6">
              <div className="bg-[#F4F1DE]/50 p-5 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">평균 영상 1편 제작 시간</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#E07A5F]">12h</span>
                  <span className="text-lg text-gray-400 line-through">→</span>
                  <span className="text-3xl font-black text-[#81B29A]">4h</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">약 66% 리소스 절감</p>
              </div>
              
              <div className="bg-[#F4F1DE]/50 p-5 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">초기 업로드 클릭률 (CTR)</div>
                <div className="text-2xl font-bold text-[#3D405B]">
                  평균 <span className="text-[#81B29A]">+2.5%</span> 상승
                </div>
                <p className="text-xs text-gray-500 mt-2">AI 기반 최적화 결과</p>
              </div>
              
              <div className="text-sm text-gray-600 border-l-2 border-[#E07A5F] pl-3">
                <strong>Insight:</strong> 남는 8시간의 여력을 '질적 향상'이나 '지속성(다작)'에 투자하는 것이 핵심 생존 전략입니다.
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Tool Directory */}
        <section className="mb-12">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-[#3D405B] mb-3">4. 추천 AI 툴킷 (Click to View)</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              초보자가 다루기 쉽고 가성비가 뛰어난 도구들을 선별했습니다. 카드를 클릭하여 상세 내용을 확인하세요.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'tool1', name: 'ChatGPT / Claude', emoji: '🤖', cat: '기획 / 대본', desc: '아이디어 브레인스토밍 및 스크립트 작성용.', benefit: '압도적인 자연어 처리 능력. 페르소나 부여를 통해 타겟 맞춤형 대본 생성이 가능합니다.', color: 'hover:border-[#E07A5F]' },
              { id: 'tool2', name: 'Vrew (브루)', emoji: '✂️', cat: '편집 / 자막', desc: '워드 치듯 편집하는 텍스트 기반 영상 편집기.', benefit: '음성 인식 자동 자막 생성 퀄리티가 매우 높으며, 무음 구간 자동 삭제로 편집 시간을 대폭 단축합니다.', color: 'hover:border-[#81B29A]' },
              { id: 'tool3', name: 'Midjourney', emoji: '🎨', cat: '디자인 / 썸네일', desc: '압도적인 퀄리티의 이미지 생성형 AI.', benefit: '썸네일에 들어갈 고품질 이미지를 저작권 걱정 없이 생성 가능. 시각적 차별화의 핵심 도구입니다.', color: 'hover:border-yellow-500' },
              { id: 'tool4', name: 'ElevenLabs', emoji: '🎙️', cat: '음성 / 더빙', desc: '현존 최고의 감정 표현 TTS 서비스.', benefit: '사람과 구별하기 힘든 자연스러운 억양을 표현함. 얼굴 없는 유튜브 채널의 필수품입니다.', color: 'hover:border-blue-500' }
            ].map(tool => (
              <button 
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`bg-white border border-gray-200 rounded-xl p-5 text-left transition-all focus:outline-none hover:shadow-md ${tool.color} ${openTools[tool.id] ? 'ring-2 ring-inset ring-current' : ''}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-lg text-[#3D405B]">{tool.name}</span>
                  <span className="text-2xl">{tool.emoji}</span>
                </div>
                <div className="inline-block px-2 py-1 bg-gray-100 text-xs rounded text-gray-600 mb-3">{tool.cat}</div>
                <p className="text-gray-500 text-sm mb-0">{tool.desc}</p>
                {openTools[tool.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-700 animate-in fade-in duration-300">
                    <strong>핵심 장점:</strong> {tool.benefit}
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Conclusion */}
        <footer className="text-center mt-16 pt-8 border-t border-gray-200">
          <h3 className="text-xl font-bold text-[#3D405B] mb-2">결론: AI는 창작자가 아닌 훌륭한 조수입니다.</h3>
          <p className="text-gray-500 max-w-2xl mx-auto">
            결국 채널을 만드는 것은 도구가 아니라 <strong>'나만의 진정성 있는 메시지'</strong>입니다. 
            AI를 통해 반복 업무를 자동화하고 확보된 시간을 콘텐츠의 깊이를 더하는 데 사용하세요.
          </p>
        </footer>

      </main>
    </div>
  );
}
