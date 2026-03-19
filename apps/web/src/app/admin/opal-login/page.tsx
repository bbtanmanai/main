'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExternalLinkAlt, faKey, faServer, faLock, faUnlock, faSyncAlt, 
  faFingerprint, faShieldAlt, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

interface OpalSessionData {
  status: 'connected' | 'expired' | 'disconnected';
  last_sync: string | null;
  account?: string;
  cookies?: Record<string, string>;
}

export default function AdminOpalLogin() {
  const [session, setSession] = useState<OpalSessionData>({ status: 'disconnected', last_sync: null });
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = "http://localhost:8000/api/v1/opal";
  const TARGET_URL = "https://opal.google/edit/1YQTJjGO0VnQN5U38CE6hHNIhbcindUXt";

  // 1. 세션 정보 실시간 로드
  const fetchSessionInfo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/session-info`);
      const data = await res.json();
      setSession(data);
    } catch (e) {
      console.error("Opal Session API Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionInfo();
  }, []);

  // 2. [이감독님 제안] 직접 접속 버튼 로직
  const handleDirectConnect = () => {
    // 새 창으로 오팔 편집실 열기
    window.open(TARGET_URL, '_blank');
    
    // 3초 후 자동으로 세션 정보 새로고침 시도 (브라우저가 열리면서 세션이 갱신될 것을 기대)
    setIsLoading(true);
    setTimeout(fetchSessionInfo, 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-4 text-slate-900">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl rotate-3">
              <FontAwesomeIcon icon={faGoogle} />
            </div>
            오팔 관제탑 <span className="text-blue-600">직속 통로</span>
          </h1>
          <p className="text-slate-500 mt-4 text-lg font-medium">버튼을 클릭하여 오팔 편집실을 열고, 접속 정보를 자동으로 동기화합니다.</p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {/* Main Launch Action */}
          <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-100 p-12 border-2 border-blue-50 text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 font-black text-xs tracking-widest uppercase ${
                session.status === 'connected' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${session.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                {session.status === 'connected' ? '시스템 연결됨' : '연결 대기 중'}
              </div>

              <h2 className="text-3xl font-black mb-4">"오팔 편집실을 지금 바로 열까요?"</h2>
              <p className="text-slate-400 font-medium mb-10">새 창이 열리면 구글 로그인을 확인해주세요. <br/> 김감독이 자동으로 열쇠(쿠키)를 복사해옵니다.</p>

              <button 
                onClick={handleDirectConnect}
                className="group relative px-12 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-2xl shadow-2xl shadow-blue-300 transition-all active:scale-95 flex items-center gap-4 mx-auto"
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                구글 오팔 직접 접속하기
              </button>
            </div>
            
            {/* Background Icon Decor */}
            <FontAwesomeIcon icon={faServer} className="absolute -bottom-10 -right-10 text-[200px] text-slate-50 opacity-50" />
          </div>

          {/* Session Data Board */}
          <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-700 flex items-center gap-3">
                <FontAwesomeIcon icon={faKey} className="text-blue-500" />
                획득된 보안 열쇠 (Session Keys)
              </h3>
              <button 
                onClick={fetchSessionInfo}
                className="p-3 text-slate-400 hover:text-blue-600 transition-colors"
              >
                <FontAwesomeIcon icon={faSyncAlt} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="p-8">
              {session.cookies ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(session.cookies).slice(0, 6).map(([key, value]) => (
                    <div key={key} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1">
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{key}</span>
                      <span className="text-xs font-mono text-slate-500 truncate">{value}</span>
                    </div>
                  ))}
                  <div className="md:col-span-2 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3 text-blue-700 text-sm font-bold">
                    <FontAwesomeIcon icon={faInfoCircle} />
                    총 {Object.keys(session.cookies).length}개의 핵심 보안 쿠키가 활성화되어 있습니다.
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-300">
                  <FontAwesomeIcon icon={faFingerprint} className="text-6xl mb-4 opacity-20" />
                  <p className="text-lg font-bold italic">접속 버튼을 눌러 먼저 인증을 시도하세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-16 text-center text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase">
        LinkDrop V2 Direct Bridge System • Developed by Co-Director Kim
      </footer>
    </div>
  );
}
