'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faNewspaper, faBolt, faEnvelope, faClock, faSearch, 
  faArrowRight, faCheckCircle, faSpinner, faStream
} from '@fortawesome/free-solid-svg-icons';

// --- Sample News Data (JSON Mode) ---
const MOCK_NEWS = [
  { title: "AI 반도체 시장 점유율 전쟁 심화", source: "네이버 뉴스", pubDate: new Date().toISOString() },
  { title: "시니어 부업으로 주목받는 'AI 데이터 라벨링'", source: "네이버 뉴스", pubDate: new Date().toISOString() },
  { title: "챗GPT가 바꾸는 직장인의 일상 보고서", source: "네이버 뉴스", pubDate: new Date().toISOString() },
  { title: "2026년 인공지능 트렌드 핵심 요약", source: "네이버 뉴스", pubDate: new Date().toISOString() }
];

export default function FrontNewsPage() {
  const [keyword, setKeyword] = useState('');
  const [email, setEmail] = useState('');
  const [time, setTime] = useState('08:00');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [rollingIndex, setRollingIndex] = useState(0);

  // 뉴스 롤링 로직
  useEffect(() => {
    if (showPreview) {
      const timer = setInterval(() => {
        setRollingIndex((prev) => (prev + 1) % MOCK_NEWS.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [showPreview]);

  const handleSubscribe = () => {
    if (!keyword || !email) return alert("정보를 모두 입력해주세요.");
    setIsLoading(true);
    
    // 시뮬레이션
    setTimeout(() => {
      setIsLoading(false);
      setShowPreview(true);
      alert("✅ 성공적으로 등록되었습니다! 실시간 뉴스를 가져옵니다.");
    }, 1500);
  };

  return (
    <div className="font-sans text-gray-900">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 px-[5%] lg:px-[8%] py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-black tracking-tighter">나만의 뉴스 비서</h2>
            <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest text-emerald-600">AI News Delivery Agent</p>
          </div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Link href="/front" className="hover:text-emerald-600 transition-colors">Home</Link>
            <span>›</span>
            <span className="text-slate-600 font-black">News Agent</span>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 bg-white p-10 rounded-[32px] shadow-xl border border-slate-200">
          
          {/* Left: Info & Visualization */}
          <div className="flex flex-col">
            <h3 className="text-3xl font-black leading-tight mb-6">
              자동화가 바꾸는<br/>
              <span className="text-emerald-600">뉴스 읽기의 즐거움</span>
            </h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
              매번 검색할 필요 없습니다. 단 한 번의 설정으로 <br/>
              수만 개의 뉴스 중 당신이 찾는 정보만 골라 보내드립니다.
            </p>

            {/* Flow Visual */}
            <div className="mt-auto bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
              <div className="flex items-center gap-2 text-emerald-600 font-black text-[11px] uppercase tracking-widest mb-6">
                <FontAwesomeIcon icon={faBolt} className="animate-pulse" />
                실시간 자동화 과정
              </div>
              <div className="space-y-4 relative">
                <div className="absolute left-[3.5px] top-2 bottom-2 w-[1px] bg-slate-200" />
                <Step label="시간 체크" desc="약속된 시간 확인" active />
                <Step label="최신 뉴스 수집" desc="4시간 이내 뉴스 탐색" active />
                <Step label="AI 중복 제거" desc="핵심 정보 필터링" />
                <Step label="메일 발송" desc="맞춤형 뉴스레터 배달" />
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
            <div className="text-lg font-black mb-8 flex items-center gap-2">
              <FontAwesomeIcon icon={faEnvelope} className="text-emerald-500" />
              📬 뉴스레터 설정
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase ml-1">관심 키워드</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-6 py-4 rounded-xl border-2 border-white focus:border-emerald-500 outline-none transition-all shadow-sm font-bold text-sm"
                    placeholder="예: 인공지능, 시니어 부업"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase ml-1">수신 이메일</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faEnvelope} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="email" 
                    className="w-full pl-12 pr-6 py-4 rounded-xl border-2 border-white focus:border-emerald-500 outline-none transition-all shadow-sm font-bold text-sm"
                    placeholder="news@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase ml-1">발송 희망 시간</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faClock} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="time" 
                    className="w-full pl-12 pr-6 py-4 rounded-xl border-2 border-white focus:border-emerald-500 outline-none transition-all shadow-sm font-bold text-sm"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-100 transition-all transform active:scale-95 flex items-center justify-center gap-3 mt-4"
              >
                {isLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faCheckCircle} />}
                {isLoading ? '저장 중...' : '구독 정보 저장하기'}
              </button>
            </div>
          </div>

          {/* Bottom: Preview (Conditional) */}
          {showPreview && (
            <div className="col-span-1 lg:col-span-2 mt-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-white rounded-3xl border border-emerald-100 p-8 shadow-inner overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-800 flex items-center gap-2">
                      <FontAwesomeIcon icon={faStream} className="text-emerald-500" />
                      실시간 뉴스 미리보기
                    </span>
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest">#{keyword}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">방금 수집된 따끈따끈한 소식입니다</span>
                </div>

                {/* News Rolling Item */}
                <div className="h-20 border border-slate-100 rounded-2xl relative overflow-hidden bg-slate-50/50 group">
                  <div 
                    className="absolute inset-0 transition-transform duration-500 flex flex-col"
                    style={{ transform: `translateY(-${rollingIndex * 80}px)` }}
                  >
                    {MOCK_NEWS.map((n, i) => (
                      <div key={i} className="h-20 flex items-center justify-between px-8 shrink-0">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-800 line-clamp-1">{n.title}</span>
                          <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">N</span>
                            <span className="text-slate-400 uppercase tracking-tighter">{n.source} • 실시간 수집됨</span>
                          </div>
                        </div>
                        <FontAwesomeIcon icon={faArrowRight} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Step({ label, desc, active }: any) {
  return (
    <div className="flex items-center gap-4 relative z-10">
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-300'}`} />
      <div className="flex flex-1 justify-between items-baseline">
        <span className={`text-[12px] font-bold ${active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
        <span className="text-[10px] text-slate-400 font-medium tracking-tighter">{desc}</span>
      </div>
    </div>
  );
}
