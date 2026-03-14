'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, faPenNib, faCloudUpload, faMoneyBillWave, 
  faMagic, faCheckCircle, faRocket, faLightbulb,
  faChartLine, faUsers, faStar
} from '@fortawesome/free-solid-svg-icons';

export default function EbookPublishPage() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    { id: 1, title: '주제 선정', desc: 'AI가 분석한 고수익 시장 키워드 추출', icon: faLightbulb },
    { id: 2, title: '초안 작성', desc: 'ChatGPT/Claude를 활용한 챕터별 원고 생성', icon: faPenNib },
    { id: 3, title: '디자인/편집', desc: 'Canva 및 AI 이미지를 활용한 표지/내지 디자인', icon: faMagic },
    { id: 4, title: '유통 및 판매', desc: '크몽, 숨고, 예스24 등 플랫폼 등록 자동화', icon: faCloudUpload },
  ];

  return (
    <div className="bg-[#fdfcfb] min-h-screen pb-24 font-sans">
      {/* 1. Header Area */}
      <header className="bg-white border-b border-orange-100 py-20 px-6 text-center">
        <span className="inline-block py-1.5 px-5 rounded-full bg-orange-600 text-white text-[10px] font-black mb-6 tracking-widest shadow-lg shadow-orange-100 uppercase">AI E-Book Publishing</span>
        <h1 className="text-4xl md:text-6xl font-black text-stone-900 mb-8 tracking-tighter leading-tight">
          전자책(E-Book)<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">지식 창업 4단계 전략</span>
        </h1>
        <p className="text-[20px] md:text-[24px] text-stone-500 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
          작가님의 경험을 자산으로 만드세요. AI 협업을 통해 3일 만에 완성하는 전자책 출판 프로세스를 제안합니다.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-16">
        {/* 2. Interactive Steps */}
        <div className="mb-12">
          <h2 className="text-3xl font-black text-stone-900 mb-2 flex items-center gap-3">
            <span className="w-2 h-8 bg-orange-600 rounded-full"></span> 🚀 출판 마스터 로드맵
          </h2>
          <p className="text-stone-500 font-bold ml-5">단계별 클릭을 통해 상세 공정을 확인하세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
          {steps.map((step) => (
            <button 
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`p-8 rounded-[32px] text-left transition-all border-2 ${activeStep === step.id ? 'bg-white border-orange-600 shadow-xl scale-[1.02]' : 'bg-stone-50 border-transparent hover:border-orange-200 opacity-60'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-6 ${activeStep === step.id ? 'bg-orange-600 text-white' : 'bg-stone-200 text-stone-400'}`}>
                <FontAwesomeIcon icon={step.icon} />
              </div>
              <h3 className={`text-lg font-black mb-2 ${activeStep === step.id ? 'text-stone-900' : 'text-stone-400'}`}>{step.title}</h3>
              <p className="text-[13px] font-bold text-stone-400 leading-snug">{step.desc}</p>
            </button>
          ))}
        </div>

        {/* 3. Detail Section */}
        <div className="bg-white rounded-[40px] shadow-2xl border border-stone-100 p-10 md:p-16 mb-24 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <span className="text-6xl font-black text-orange-100 italic">Step 0{activeStep}</span>
                <div className="h-1 flex-1 bg-orange-50"></div>
              </div>
              <h2 className="text-4xl font-black text-stone-900 mb-8">{steps[activeStep-1].title} 상세 공정</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs mt-1 shrink-0">1</div>
                  <p className="text-lg text-stone-600 font-bold">핵심 페르소나와 결핍을 분석하여 '필요한 지식'을 정의합니다.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs mt-1 shrink-0">2</div>
                  <p className="text-lg text-stone-600 font-bold">목차 구성(Chaptering)을 통해 독자의 성장을 설계합니다.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs mt-1 shrink-0">3</div>
                  <p className="text-lg text-stone-600 font-bold">AI와 대화하며 초안을 작성하고 작가의 감수성을 더합니다.</p>
                </div>
              </div>

              <div className="mt-12 bg-orange-50 p-8 rounded-[32px] border border-orange-100">
                <h4 className="text-orange-900 font-black text-lg mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLightbulb} /> 공동감독 김감독의 조언
                </h4>
                <p className="text-orange-800 font-bold leading-relaxed">
                  "완벽주의를 버리세요. 일단 20페이지 내외의 '미니 전자책'으로 시장성을 검증한 후 확장하는 것이 리스크를 줄이는 가장 빠른 길입니다."
                </p>
              </div>
            </div>
            
            <div className="bg-stone-50 rounded-[40px] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden h-[400px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <FontAwesomeIcon icon={steps[activeStep-1].icon} className="text-orange-200 text-9xl mb-8 opacity-50" />
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100 relative z-10 w-full">
                <h4 className="font-black text-stone-900 mb-4 flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faStar} className="text-amber-500" /> 성공 예상 수치
                </h4>
                <div className="flex justify-around">
                  <div className="text-center">
                    <div className="text-2xl font-black text-orange-600">85%</div>
                    <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest">Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-orange-600">3Days</div>
                    <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest">Time to Market</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. CTA Area */}
        <div className="bg-stone-900 rounded-[50px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-8 relative z-10">작가님의 첫 전자책, 지금 바로 설계를 시작하세요.</h2>
          <div className="flex flex-wrap justify-center gap-6 relative z-10">
            <div className="px-8 py-4 bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-900/40 flex items-center gap-3">
              <FontAwesomeIcon icon={faRocket} /> 파이프라인 가동하기
            </div>
            <div className="px-8 py-4 bg-white/10 text-white font-black rounded-2xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-3">
              <FontAwesomeIcon icon={faCheckCircle} /> 성공 사례 보기
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
