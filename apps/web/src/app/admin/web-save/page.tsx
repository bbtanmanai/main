'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGlobe, faBolt, faSpinner, faCheckCircle, faTrash, 
  faImage, faVideo, faFileAlt, faPaperPlane, faArrowRight,
  faAlignLeft, faMagic
} from '@fortawesome/free-solid-svg-icons';

interface WebAsset {
  images: string[];
  videos: string[];
}

interface SaveResult {
  success: boolean;
  title: string;
  score: number;
  assets?: WebAsset;
  message?: string;
}

export default function AdminWebSave() {
  const [url, setUrl] = useState('');
  const [directText, setDirectText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);

  const API_BASE = "http://localhost:8000/api/v1";

  // 1. URL 고정밀 스캔 투하
  const handleWebSave = async () => {
    if (!url) return alert("저장할 웹페이지 URL을 입력하세요.");
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/orchestrator/web-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      alert("웹페이지 저장 중 오류 발생");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 본문 직접 텍스트 주입 투하
  const handleDirectInject = async () => {
    if (!directText) return alert("주입할 본문 내용을 입력하세요.");
    setIsDirectLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/orchestrator/priority-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: directText })
      });
      const data = await res.json();
      // priority-run의 결과를 web-save 형식에 맞춰 가공 표시
      setResult({
        success: true,
        title: "직접 주입된 데이터",
        score: 0, // 실제로는 백엔드에서 정제 점수를 받아와야 함
        message: data.message
      });
      setDirectText('');
    } catch (e) {
      alert("데이터 주입 중 오류 발생");
    } finally {
      setIsDirectLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 bg-[#f4f6f8] min-h-screen font-sans">
      
      {/* SECTION 1: URL High-Fidelity Capture */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
            <FontAwesomeIcon icon={faGlobe} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">웹페이지 고정밀 아카이빙</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">실제 브라우저로 접속하여 텍스트와 미디어 자산을 확보합니다.</p>
          </div>
        </div>

        <div className="flex items-stretch gap-3 bg-gray-50 p-2 rounded-2xl border-2 border-dashed border-gray-300 focus-within:border-blue-500 focus-within:bg-white transition-all">
          <input 
            type="text" 
            placeholder="캡처할 웹페이지 주소 (https://...)"
            className="flex-1 bg-transparent px-4 py-3 text-sm outline-none font-medium text-gray-800"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button 
            onClick={handleWebSave}
            disabled={isLoading}
            className={`px-8 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm flex items-center gap-2 transition-all shadow-lg ${isLoading ? 'opacity-50 cursor-wait' : 'active:scale-95'}`}
          >
            <FontAwesomeIcon icon={isLoading ? faSpinner : faPaperPlane} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? '스캔 중...' : 'URL 투하'}
          </button>
        </div>
      </div>

      {/* SECTION 2: Direct Text Injection (NEW) */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-6 border-t-4 border-t-amber-500">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg font-black">
            <FontAwesomeIcon icon={faAlignLeft} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">본문 직접 텍스트 주입</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">로그인 벽이 있는 기사나 텍스트를 복사해서 즉시 공정에 태웁니다.</p>
          </div>
        </div>

        <div className="space-y-4">
          <textarea 
            placeholder="여기에 본문 내용을 붙여넣으세요. 에이전트가 즉시 정제 및 콘텐츠 제작을 시작합니다."
            className="w-full h-40 bg-gray-50 px-5 py-4 text-xs outline-none font-medium text-gray-800 border border-gray-200 rounded-2xl focus:border-amber-500 focus:bg-white transition-all resize-none leading-relaxed"
            value={directText}
            onChange={(e) => setDirectText(e.target.value)}
          />
          <div className="flex justify-end">
            <button 
              onClick={handleDirectInject}
              disabled={isDirectLoading}
              className={`px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-sm flex items-center gap-3 transition-all shadow-lg shadow-amber-100 ${isDirectLoading ? 'opacity-50 cursor-wait' : 'active:scale-95'}`}
            >
              <FontAwesomeIcon icon={isDirectLoading ? faSpinner : faMagic} className={isDirectLoading ? 'animate-spin' : ''} />
              {isDirectLoading ? '데이터 처리 중...' : '본문 즉시 주입 (Inject)'}
            </button>
          </div>
        </div>
      </div>

      {/* Result Panel (Shared) */}
      {result && (
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">
          <div className={`${result.title.includes("직접") ? 'bg-amber-500' : 'bg-blue-600'} p-6 text-white flex justify-between items-center`}>
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faCheckCircle} className="text-2xl opacity-80" />
              <div>
                <h3 className="font-bold text-lg leading-tight">{result.title}</h3>
                <p className="text-xs mt-1 opacity-80 uppercase tracking-widest font-black">Process Success</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">{result.score || '-'}</div>
              <p className="text-[10px] font-bold opacity-80 uppercase">Refinement Score</p>
            </div>
          </div>
          <div className="p-8">
            <p className="text-sm font-bold text-gray-700 leading-relaxed text-center italic">
              "{result.message || '공정이 성공적으로 시작되었습니다. 에이전트 목록에서 가동 상태를 확인하세요.'}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
