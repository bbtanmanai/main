'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faMagic, faSpinner, faCheckCircle, faCopy, faBriefcase, faChartLine, faRocket } from '@fortawesome/free-solid-svg-icons';

export default function FrontIdeaPage() {
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async () => {
    if (!keyword) return alert('키워드나 아이디어를 입력해주세요.');
    
    setIsLoading(true);
    setResult(null);

    // 백엔드 API 호출 시뮬레이션
    setTimeout(() => {
      const mockIdea = `[${keyword}] 비즈니스 기획 제안서\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `1. 핵심 컨셉 (Core Concept)\n` +
        `- "${keyword}"를 활용한 시니어 맞춤형 라이프스타일 구독 서비스\n` +
        `- 인적 네트워크와 기술적 편의성을 결합한 하이브리드 모델\n\n` +
        `2. 타겟 고객 (Target Audience)\n` +
        `- 55세 이상 액티브 시니어 (디지털 전환에 관심이 많은 세대)\n` +
        `- 자녀와 떨어져 살며 독립적인 생활을 즐기는 1인 가구\n\n` +
        `3. 수익 모델 (Revenue Model)\n` +
        `- 월 정액 멤버십 (기본 서비스 + 특화 콘텐츠)\n` +
        `- 지역 기반 소상공인과의 제휴 수수료\n\n` +
        `4. 차별화 전략 (Differentiation)\n` +
        `- AI 도슨트를 활용한 1:1 맞춤 가이드 제공\n` +
        `- 오프라인 커뮤니티 정기 모임 연동\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `💡 다음 단계 제언: 이 모델의 초기 검증을 위해 '랜딩 페이지' 제작 파이프라인 가동을 추천합니다.`;
      
      setResult(mockIdea);
      setIsLoading(false);
    }, 2000);
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 px-[5%] lg:px-[8%] py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-black tracking-tighter">아이디어 공장</h2>
            <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest text-amber-500">AI Business Planner</p>
          </div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Link href="/front" className="hover:text-amber-600 transition-colors">Home</Link>
            <span>›</span>
            <span className="text-slate-600 font-black">Idea Factory</span>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-10 text-center border-b border-slate-50 bg-amber-50/20">
            <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg shadow-amber-100">
              <FontAwesomeIcon icon={faLightbulb} />
            </div>
            <h3 className="text-xl font-black mb-3 tracking-tight">비즈니스 아이디어 브레인스토밍</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-lg mx-auto">
              생각 중인 키워드를 입력하면 AI가 시장 분석, 수익 모델, <br/> 
              그리고 <span className="text-amber-600 font-bold underline underline-offset-4 decoration-amber-200">실행 가능한 전략</span>을 제안합니다.
            </p>
          </div>

          <div className="p-10 space-y-8">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="예: 시니어 구독 서비스, 로컬 마켓 앱, AI 글쓰기 공방..."
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-base outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all shadow-inner font-medium"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button 
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3 bg-slate-900 hover:bg-black text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isLoading ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faRocket} />
                  )}
                  {isLoading ? '기획 중' : '발사'}
                </button>
              </div>
            </div>

            {result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    Proposed Business Plan
                  </h4>
                  <button 
                    onClick={copyToClipboard}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${isCopied ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-400 border-slate-200 hover:border-amber-500 hover:text-amber-600'}`}
                  >
                    <FontAwesomeIcon icon={isCopied ? faCheckCircle : faCopy} />
                    {isCopied ? 'COPIED' : 'COPY_PLAN'}
                  </button>
                </div>
                <div className="bg-[#1e293b] rounded-2xl p-8 text-amber-50 text-sm leading-relaxed font-medium whitespace-pre-wrap border border-slate-800 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">{result}</div>
                  <FontAwesomeIcon icon={faLightbulb} className="absolute -bottom-10 -right-10 text-white/5 text-[200px] rotate-12" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <InfoCard icon={faBriefcase} title="BM 분석" desc="지속 가능한 수익 모델을 정밀 설계합니다." />
          <InfoCard icon={faChartLine} title="시장 전략" desc="실제 타겟이 반응할 수 있는 경로를 찾습니다." />
          <InfoCard icon={faRocket} title="실행 가이드" desc="아이디어를 넘어 실제 구축 단계를 제시합니다." />
        </div>
      </main>
    </div>
  );
}

function InfoCard({ icon, title, desc }: any) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm group hover:border-amber-300 transition-all">
      <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
        <FontAwesomeIcon icon={icon} />
      </div>
      <h5 className="font-black text-slate-800 text-sm mb-2">{title}</h5>
      <p className="text-[11px] text-slate-500 leading-normal font-medium">{desc}</p>
    </div>
  );
}
