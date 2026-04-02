'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFolderOpen, faBook, faBolt, faCheckCircle, faWarning, 
  faTerminal, faRss, faMagic, faCloudUpload, faSyncAlt 
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

// --- Types ---
interface Notebook {
  id: string;
  title: string;
}

interface IntegrityReport {
  total_local: number;
  synced_count: number;
  missing_count: number;
  synced_files: string[];
  missing_files: string[];
}

interface SessionStatus {
  status: 'connected' | 'expired' | 'disconnected';
  account: string | null;
}

export default function AdminNotebookLogin() {
  const [session, setSession] = useState<SessionStatus>({ status: 'disconnected', account: null });
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<string>('');
  const [integrity, setIntegrity] = useState<IntegrityReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/notebooklm`;

  // 1. 세션 상태 체크
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/status`);
        const data = await res.json();
        setSession(data);
        if (data.status === 'connected') loadInventory();
      } catch (e) {
        console.error("Status API Error:", e);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. 노트북 목록 로드
  const loadInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/inventory`);
      const data = await res.json();
      setNotebooks(data.notebooks || []);
    } catch (e) {
      console.error("Inventory load failed", e);
    }
  };

  // 3. 무결성 대조
  const checkIntegrity = async (id: string) => {
    if (!id) {
      setIntegrity(null);
      return;
    }
    setSelectedNotebook(id);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/integrity/${id}`);
      const data = await res.json();
      setIntegrity(data);
    } catch (e) {
      console.error("Integrity check failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. nlm_login.bat 트리거
  const triggerLogin = async () => {
    alert("백엔드 API를 통해 'nlm_login.bat'을 원격 실행합니다. (이후 콘솔에서 브라우저 팝업 대기)");
    try {
      await fetch(`${API_BASE}/login-trigger`, { method: 'POST' });
    } catch (e) {
      console.warn("API Call mock");
    }
  };

  // 5. 누락 자료 주입
  const addMissingSources = async () => {
    if (!selectedNotebook) return;
    if (confirm("발견된 모든 누락 자료를 현재 노트북으로 동기화(업로드) 하시겠습니까?")) {
      setIsLoading(true);
      try {
        await fetch(`${API_BASE}/sources/${selectedNotebook}/add-missing`, { method: 'POST' });
        alert("주입 엔진 가동: Agent가 백그라운드에서 업로드를 진행합니다.");
        setTimeout(() => checkIntegrity(selectedNotebook), 2000);
      } catch (e) {
        alert("주입 실패");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 6. 드라이브 자동 동기화 및 분류 주입 (NEW)
  const syncDriveData = async () => {
    if (!selectedNotebook) {
      alert("먼저 타겟 노트북을 선택해 주세요.");
      return;
    }
    if (confirm("구글 드라이브의 자료를 스캔하여 자동 분류 후 노트북에 주입하시겠습니까? (수 분 소요될 수 있음)")) {
      setIsSyncing(true);
      try {
        const res = await fetch(`${API_BASE}/sync-drive/${selectedNotebook}`, { method: 'POST' });
        const data = await res.json();
        alert(data.message);
      } catch (e) {
        alert("동기화 요청 실패");
      } finally {
        setTimeout(() => setIsSyncing(false), 3000);
      }
    }
  };

  return (
    <div className="p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Interactive AI Workflow (Rule 105)</h1>
            <p className="text-gray-500">NotebookLM Control Node: 에이전트와 관리자의 실시간 파이프라인 관제소</p>
          </div>
          <button
            onClick={syncDriveData}
            className={`neu-btn-accent px-6 py-3 text-white font-bold rounded-xl flex items-center gap-2 ${isSyncing ? 'animate-pulse' : ''}`}
          >
            <FontAwesomeIcon icon={isSyncing ? faSyncAlt : faCloudUpload} className={isSyncing ? 'animate-spin' : ''} />
            🚀 드라이브 자동 분류 및 주입
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Session Monitor */}
          <div className="neu-raised rounded-xl p-8">
            <div className={`flex flex-col items-center p-6 rounded-xl ${
              session.status === 'connected' ? 'bg-green-50 border-green-500 border-2' : 
              session.status === 'expired' ? 'bg-yellow-50 border-yellow-500 border-2' : 
              'bg-red-50 border-red-500 border-2'
            }`}>
              <div className={`w-20 h-20 rounded-full shadow-lg mb-4 flex items-center justify-center text-white text-3xl ${
                session.status === 'connected' ? 'bg-gradient-to-br from-green-400 to-green-600' : 
                session.status === 'expired' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                'bg-gradient-to-br from-red-400 to-red-600'
              }`}>
                <FontAwesomeIcon icon={faGoogle} />
              </div>
              <h2 className="text-xl font-bold uppercase mb-2">
                {session.status === 'connected' ? 'Session Active' : session.status === 'expired' ? 'Expiring Soon' : 'Disconnected'}
              </h2>
              <p className="text-gray-600 text-sm mb-6">{session.account || '인증이 필요합니다.'}</p>
              <button
                onClick={triggerLogin}
                className="neu-btn w-full py-3 px-4 font-bold flex items-center justify-center gap-2 text-sm"
                style={{ color: 'var(--neu-text)' }}
              >
                <FontAwesomeIcon icon={faTerminal} /> nlm_login.bat 브릿지 실행
              </button>
            </div>
          </div>

          {/* n8n Style Pipeline Flow */}
          <div className="lg:col-span-2 neu-raised rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-700 mb-6">Data Pipeline Flow (Rule 105)</h4>
            <div className="flex items-center justify-between px-4">
              <div className="flex flex-col items-center gap-2 w-32 group">
                <div className="w-14 h-14 neu-raised-sm flex items-center justify-center text-2xl transition-all">
                  <FontAwesomeIcon icon={faFolderOpen} />
                </div>
                <span className="font-bold text-sm">Local Knowledge</span>
                <span className="text-[10px] text-gray-400 text-center">packages/data/refined</span>
              </div>
              
              <div className={`flex-1 h-1 mx-2 rounded-full ${session.status === 'connected' ? 'bg-blue-500 animate-pulse' : 'bg-gray-100'}`}></div>
              
              <div className="flex flex-col items-center gap-2 w-32 group">
                <div className="w-14 h-14 neu-raised-sm flex items-center justify-center text-2xl transition-all">
                  <FontAwesomeIcon icon={faCloudUpload} />
                </div>
                <span className="font-bold text-sm">Google Drive</span>
                <span className="text-[10px] text-gray-400 text-center">LinkDrop_Knowledge</span>
              </div>
              
              <div className={`flex-1 h-1 mx-2 rounded-full ${selectedNotebook ? 'bg-blue-500 animate-pulse' : 'bg-gray-100'}`}></div>
              
              <div className="flex flex-col items-center gap-2 w-32 group">
                <div className="w-14 h-14 bg-gray-50 border-2 border-[#8e44ad] rounded-xl flex items-center justify-center text-2xl text-[#8e44ad] group-hover:scale-110 transition-all">
                  <FontAwesomeIcon icon={faBook} />
                </div>
                <span className="font-bold text-sm">NotebookLM</span>
                <span className="text-[10px] text-[#8e44ad] font-mono">{selectedNotebook ? selectedNotebook.substring(0, 8) + '...' : 'Waiting...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Integrity Dashboard */}
        <div className="neu-raised rounded-xl overflow-hidden">
          <div className="p-6 border-b border-black/5 flex justify-between items-center" style={{ background: 'rgba(255,255,255,0.4)' }}>
            <h4 className="text-lg font-bold text-gray-700">소스 무결성 검증 (Source Integrity Check)</h4>
            {(isLoading || isSyncing) && <span className="animate-spin text-blue-500 text-2xl"><FontAwesomeIcon icon={faSyncAlt} /></span>}
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1 border-r border-gray-100 pr-8">
                <h5 className="font-bold mb-4">1. 타겟 노트북 선택</h5>
                <select 
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={selectedNotebook}
                  onChange={(e) => checkIntegrity(e.target.value)}
                >
                  <option value="">-- 노트북 선택 --</option>
                  {notebooks.map(nb => (
                    <option key={nb.id} value={nb.id}>{nb.title}</option>
                  ))}
                </select>
                
                {integrity && integrity.missing_count > 0 && (
                  <div className="mt-8">
                    <button 
                      onClick={addMissingSources}
                      className="w-full py-4 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold rounded-xl shadow-lg transform transition active:scale-95 animate-pulse flex items-center justify-center gap-2"
                    >
                      <FontAwesomeIcon icon={faBolt} /> 누락 자료 퀵 주입 (Inject)
                    </button>
                    <p className="text-[11px] text-gray-400 text-center mt-3 leading-tight">클릭 시 에이전트가 NLM 엔진으로 <br/> 누락 자료를 즉시 동기화합니다.</p>
                  </div>
                )}
              </div>

              <div className={`md:col-span-3 transition-opacity duration-300 ${selectedNotebook ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <div className="grid grid-cols-3 gap-6 text-center mb-8">
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <div className="text-3xl font-bold text-blue-600">{integrity?.total_local || 0}</div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-1">Local Sources</p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div className="text-3xl font-bold text-green-600">{integrity?.synced_count || 0}</div>
                    <p className="text-xs font-bold text-green-400 uppercase tracking-widest mt-1">Synced to NLM</p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div className="text-3xl font-bold text-red-600">{integrity?.missing_count || 0}</div>
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest mt-1">Missing</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="flex items-center gap-2 text-red-600 font-bold mb-3">
                      <FontAwesomeIcon icon={faWarning} /> 누락된 자료 (Missing)
                    </h5>
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {integrity?.missing_files.map((f, i) => (
                        <li key={i} className="flex items-center justify-between p-3 bg-red-50 border-l-4 border-red-500 text-sm font-medium text-red-700 rounded-r-lg">
                          {f} <span className="text-[10px] bg-red-200 px-2 py-0.5 rounded-full">누락</span>
                        </li>
                      ))}
                      {(!integrity || integrity.missing_files.length === 0) && <li className="text-gray-400 text-center py-4 italic text-sm">누락 자료 없음</li>}
                    </ul>
                  </div>
                  <div>
                    <h5 className="flex items-center gap-2 text-green-600 font-bold mb-3">
                      <FontAwesomeIcon icon={faCheckCircle} /> 동기화 완료 (Synced)
                    </h5>
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {integrity?.synced_files.map((f, i) => (
                        <li key={i} className="flex items-center p-3 bg-gray-50 border-l-4 border-green-500 text-sm font-medium text-gray-700 rounded-r-lg">
                          {f}
                        </li>
                      ))}
                      {(!integrity || integrity.synced_files.length === 0) && <li className="text-gray-400 text-center py-4 italic text-sm">데이터 없음</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-12 text-center text-gray-400 text-sm">
        LinkDropV2 Workflow Engine - Admin Dashboard (Co-Director Kim & Lee)
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
