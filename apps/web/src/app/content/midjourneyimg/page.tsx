'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUpload, faMagic, faCopy, faCheck, faTriangleExclamation,
  faCamera, faLightbulb, faImage, faStar, faBan, faCog, faXmark,
  faPaperPlane, faHistory, faSpinner, faPenNib
} from '@fortawesome/free-solid-svg-icons';
import mjConfig from '@/data/content_midjourney.json';
import styleConfig from '@/data/content_styleimage.json';
import LiquidChrome from '@/components/LiquidChrome';

// --- Types ---
interface ParamItem {
  id: string;
  label: string;
  val: string;
  img?: string;
  desc?: string;
}

export default function MidjourneyImgPage() {
  const [apiKey, setApiKey] = useState('');
  const [apiStatus, setApiStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [params, setParams] = useState({
    version: mjConfig.versions[0].val,
    aspect_ratio: mjConfig.aspect_ratios[0].val,
    stylize: mjConfig.stylize[1].val,
    chaos: mjConfig.chaos[0].val,
    quality: '',
    style: ''
  });

  const [mjOutput, setMjOutput] = useState('');
  const [koOutput, setKoOutput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [isTranslating, setIsKoTranslating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize
  useEffect(() => {
    const savedKey = sessionStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setTempKey(savedKey);
      checkAPIKey(savedKey);
    }
    const savedHistory = localStorage.getItem('mj_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // API Key Check
  const checkAPIKey = async (key: string) => {
    if (!key) return setApiStatus('idle');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      setApiStatus(response.ok ? 'valid' : 'invalid');
    } catch {
      setApiStatus('invalid');
    }
  };

  const handleSaveSettings = () => {
    setApiKey(tempKey);
    sessionStorage.setItem('gemini_api_key', tempKey);
    checkAPIKey(tempKey);
    setShowSettings(false);
  };

  // Logic: Selection
  const selectParam = (key: string, item: ParamItem) => {
    setParams(prev => ({ 
      ...prev, 
      [key]: prev[key as keyof typeof params] === item.val ? '' : item.val 
    }));
  };

  // Logic: Final Prompt Generation
  useEffect(() => {
    const segments = [
      prompt,
      params.style,
      params.quality,
      params.version,
      params.aspect_ratio,
      params.stylize,
      params.chaos
    ].filter(val => val && val.trim() !== '');

    let finalPrompt = segments.join(" ");

    // Add --cref if image is uploaded
    // Note: In production, this should be a public URL. 
    // For local preview, we'll use a placeholder or indicate the URL is needed.
    if (previewUrl) {
      // In a real MJ workflow, we would first upload base64 to Supabase/S3 
      // and get a public URL. Here we simulate that.
      const mockPublicUrl = "https://linkdrop.ai/storage/v1/temp-cref-image.png";
      finalPrompt += ` --cref ${mockPublicUrl}`;
    }

    setMjOutput(finalPrompt);
    
    // JSON Output to match styleimage structure
    setJsonOutput(JSON.stringify({
      user_idea: prompt,
      parameters: params,
      cref_active: !!previewUrl,
      final_mj_command: `/imagine prompt: ${finalPrompt}`
    }, null, 2));
  }, [prompt, params, previewUrl]);

  // Translation (Analysis equivalent)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mjOutput && apiKey && apiStatus === 'valid') translateToKorean(mjOutput);
    }, 1500);
    return () => clearTimeout(timer);
  }, [mjOutput]);

  const translateToKorean = async (text: string) => {
    setIsKoTranslating(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Translate to natural Korean (output only translation):\n\n${text}` }] }] })
      });
      const data = await response.json();
      setKoOutput(data.candidates[0].content.parts[0].text.trim());
    } catch {
      setKoOutput('번역 중 오류가 발생했습니다.');
    } finally {
      setIsKoTranslating(false);
    }
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files?.[0] || e[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreviewUrl(result);
      setBase64Data(result.split(',')[1]);
      // MJ doesn't necessarily need AI analysis here like styleimage, 
      // but we could use it for prompt engineering if needed.
    };
    reader.readAsDataURL(file);
  };

  const saveToHistory = (newItem: any) => {
    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('mj_history', JSON.stringify(updatedHistory));
  };

  const handleGenerate = async () => {
    if (!mjOutput.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/contents/midjourney/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: mjOutput })
      });
      
      if (!response.ok) throw new Error('API request failed');
      
      const result = await response.json();
      
      const historyItem = {
        id: result.id || Date.now().toString(),
        prompt: prompt,
        full_prompt: mjOutput,
        status: 'completed',
        imageUrl: result.image_url,
        timestamp: new Date().toLocaleString()
      };
      
      saveToHistory(historyItem);
      setPrompt('');
      setActiveTab('history');
    } catch (error) {
      console.error('Generation failed:', error);
      alert('이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('클립보드에 복사되었습니다.');
  };

  return (
    <div className="bg-[#0f0f1a] min-h-screen text-slate-200 font-sans pb-20 antialiased">
      
      {/* Hero Header */}
      <header className="relative pt-20 pb-28 text-center overflow-hidden text-white">
        {/* Liquid Chrome WebGL 배경 */}
        <div className="absolute inset-0">
          <LiquidChrome
            baseColor={[0.08, 0.06, 0.22]}
            speed={0.15}
            amplitude={0.25}
            frequencyX={3.5}
            frequencyY={3.5}
            interactive={true}
          />
        </div>
        {/* 어두운 오버레이 — 텍스트 가독성 */}
        <div className="absolute inset-0 bg-[#0f0f1a]/55"></div>
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_50%_50%,#6366f1_0%,transparent_70%)]"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-indigo-400 text-[10px] font-black tracking-wider mb-6 uppercase">
            <FontAwesomeIcon icon={faMagic} /> Midjourney Elite Studio
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tighter text-white">
            미드저니 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">마스터 엔진</span>
          </h1>
          <p className="text-base text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            이감독님의 유료 구독 계정으로 최고의 이미지를 생성합니다.<br />
            아이디어를 입력하고 정밀한 파라미터를 조합하여 나만의 걸작을 완성하세요.
          </p>
        </div>
      </header>

      <main className="max-w-[1550px] mx-auto px-4 -mt-12 relative z-20">
        
        {/* Tabs - styleimage에는 없지만 MJ 특성상 유지 (필요 시 추후 제거 가능) */}
        <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-2xl border border-white/10 w-fit mx-auto lg:mx-0">
          <button 
            onClick={() => setActiveTab('generate')}
            className={`px-8 py-3 rounded-xl text-[11px] font-black transition-all uppercase tracking-widest ${activeTab === 'generate' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <FontAwesomeIcon icon={faImage} className="mr-2" /> GENERATE
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-8 py-3 rounded-xl text-[11px] font-black transition-all uppercase tracking-widest ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <FontAwesomeIcon icon={faHistory} className="mr-2" /> HISTORY
          </button>
        </div>

        {activeTab === 'generate' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Left Side: Controls (7 columns) - styleimage 구조 계승 */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* 1. Source Image Upload (Character Reference 용) */}
              <section className="bg-[#1c1c2e] border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                <h2 className="text-lg font-black mb-5 flex items-center gap-3 text-white">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm italic shadow-lg shadow-indigo-600/20">1</span>
                  캐릭터 참조 이미지 (Character Reference)
                </h2>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}
                  className={`border-4 border-dashed border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${isAnalyzing ? 'pointer-events-none' : 'hover:bg-white/[0.02]'}`}
                >
                  {!previewUrl ? (
                    <>
                      <FontAwesomeIcon icon={faUpload} className="text-3xl text-slate-700 mb-3" />
                      <p className="text-slate-500 font-bold text-base">캐릭터 이미지 드래그 또는 클릭</p>
                      <p className="text-slate-600 text-[10px] mt-2 uppercase tracking-widest">Supports --cref (Midjourney V6+)</p>
                    </>
                  ) : (
                    <div className="relative group">
                      <img src={previewUrl} alt="Preview" className={`max-h-64 rounded-xl shadow-2xl transition-all ${isAnalyzing ? 'brightness-50 blur-[2px]' : 'group-hover:brightness-75'}`} />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-black bg-indigo-600/80 px-4 py-2 rounded-full">CHANGE IMAGE</p>
                      </div>
                    </div>
                  )}
                  {isAnalyzing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <FontAwesomeIcon icon={faSpinner} className="text-indigo-500 text-2xl animate-spin mb-3" />
                      <span className="text-white text-xs font-black tracking-widest uppercase">Analyzing...</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                </div>
              </section>

              {/* 2. Input Prompt (Idea) */}
              <section className="bg-[#1c1c2e] border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                <h2 className="text-lg font-black mb-5 flex items-center gap-3 text-white">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm italic shadow-lg shadow-indigo-600/20">2</span>
                  아이디어 입력 (Idea)
                </h2>
                <div className="border-4 border-dashed border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center transition-all relative overflow-hidden hover:bg-white/[0.02]">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="예: 제주도 해변에서 커피를 마시는 60대 멋진 중년 남성..."
                    className="w-full bg-transparent border-none p-4 text-white placeholder:text-slate-600 focus:outline-none min-h-[140px] text-lg leading-relaxed transition-all resize-none"
                  />
                  <div className="absolute bottom-4 right-4 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                    <FontAwesomeIcon icon={faPenNib} className="mr-2" /> AI Prompt Ready
                  </div>
                </div>
              </section>

              {/* 3. Refinement Grid - renumbered */}
              <section className="space-y-5">
                <GridSection num="3" title="Model Version (엔진)" icon={faCog} items={mjConfig.versions} selectedId={params.version} onSelect={(item: any) => selectParam('version', item)} isValueMatched />
                <GridSection num="4" title="Aspect Ratio (화면비)" icon={faCamera} items={mjConfig.aspect_ratios} selectedId={params.aspect_ratio} onSelect={(item: any) => selectParam('aspect_ratio', item)} isValueMatched />
                <GridSection num="5" title="Stylize (예술성)" icon={faMagic} items={mjConfig.stylize} selectedId={params.stylize} onSelect={(item: any) => selectParam('stylize', item)} isValueMatched />
                <GridSection num="6" title="Chaos (변동성)" icon={faStar} items={mjConfig.chaos} selectedId={params.chaos} onSelect={(item: any) => selectParam('chaos', item)} isValueMatched />
                
                {/* Visual Style: styleimage의 이미지를 활용하여 화풍 선택 */}
                <GridSection title="Visual Style (화풍)" icon={faImage} items={styleConfig.styles} selectedId={params.style} onSelect={(item: any) => selectParam('style', item)} isValueMatched useImage />
                
                <GridSection title="Quality Boosters (품질)" icon={faLightbulb} items={mjConfig.quality} selectedId={params.quality} onSelect={(item: any) => selectParam('quality', item)} isValueMatched />
              </section>

              {/* Generate Button (styleimage 구조에는 없지만 하단 배치) */}
              <div className="pt-2">
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !mjOutput.trim()}
                  className={`w-full py-6 rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 transition-all shadow-2xl ${isGenerating || !mjOutput.trim() ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 active:scale-[0.98]'}`}
                >
                  {isGenerating ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      이미지 생성 중 (약 1분 소요)...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPaperPlane} />
                      마스터 엔진 가동 (Create Masterpiece)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Side: Outputs (5 columns - Sticky) - styleimage 구조 완벽 계승 */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-20 space-y-4">
                <OutputCard title="RAW PARAMETERS (JSON)" value={jsonOutput} onCopy={() => copyToClipboard(jsonOutput)} theme="dark" height="h-56" />
                <OutputCard title="FINAL MJ PROMPT (EN)" value={mjOutput} onCopy={() => copyToClipboard(mjOutput)} theme="dark" height="h-48" />
                <OutputCard title="AI KOREAN ANALYSIS (KO)" value={koOutput} onCopy={() => copyToClipboard(koOutput)} isTranslating={isTranslating} theme="indigo" height="h-48" />
                
                {/* Information Card (styleimage의 팁 섹션과 유사) */}
                <div className="bg-[#1c1c2e] border border-white/10 rounded-[1.5rem] p-6 space-y-4 shadow-xl">
                  <div className="flex gap-3">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="text-indigo-500 mt-1" />
                    <div className="text-[11px] leading-relaxed text-slate-400">
                      <strong className="text-white block mb-1 uppercase tracking-widest">Master Protocol:</strong>
                      미드저니 6.1 버전은 자연어 이해도가 매우 높습니다. 복잡한 키워드보다 상황을 묘사하듯 입력하는 것이 유리합니다. 파라미터 조합 후 '마스터 엔진'을 가동하세요.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* History Grid - styleimage에는 없지만 MJ 기능상 하단 또는 탭으로 유지 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {history.length > 0 ? history.map((item) => (
              <div key={item.id} className="bg-[#1c1c2e] border border-white/10 rounded-[2rem] overflow-hidden group hover:border-indigo-500/30 transition-all shadow-xl">
                <div className="relative aspect-square overflow-hidden bg-black/20">
                  <img src={item.imageUrl} alt={item.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end gap-3">
                    <button className="w-full bg-white text-[#0f0f1a] py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 hover:bg-indigo-400 hover:text-white transition-colors">
                      DOWNLOAD MASTER
                    </button>
                    <button onClick={() => copyToClipboard(item.full_prompt)} className="w-full bg-white/10 backdrop-blur-md text-white py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 hover:bg-white/20 transition-colors">
                      COPY FULL PROMPT
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-xs text-slate-300 line-clamp-2 mb-4 font-medium leading-relaxed">{item.prompt}</p>
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{item.timestamp}</span>
                    <span className="flex items-center gap-1.5 text-[10px] text-green-500 font-black uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                <FontAwesomeIcon icon={faImage} className="text-6xl text-slate-800 mb-6" />
                <p className="text-slate-500 font-black tracking-widest text-sm">NO ARTWORKS CREATED YET</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Settings Action Button (styleimage와 완벽 동일) */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <button onClick={() => setShowSettings(true)} className="w-12 h-12 bg-white/10 border border-white/10 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-all">
          <FontAwesomeIcon icon={faCog} />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-[#1c1c2e] rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-3">API 설정</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-500"><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <input 
              type="password" 
              value={tempKey} 
              onChange={e => setTempKey(e.target.value)}
              placeholder="Google AI API Key..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm mb-6 shadow-inner" 
            />
            <button onClick={handleSaveSettings} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">저장하기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub Components (styleimage의 구조를 완벽하게 따름) ---

function GridSection({ num, title, icon, items, selectedId, onSelect, useImage, isValueMatched }: any) {
  return (
    <div className="bg-[#1c1c2e] border border-white/10 rounded-[1.5rem] p-5 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        {num && (
          <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black italic shadow-sm">
            {num}
          </span>
        )}
        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
          {title}
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item: any) => {
          const isActive = isValueMatched ? selectedId === item.val : selectedId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              title={item.desc}
              className={`group relative overflow-hidden transition-all duration-300 ${
                useImage 
                ? `w-[100px] h-[100px] rounded-xl border-2 flex flex-col justify-end p-2 ${isActive ? 'border-indigo-500 ring-4 ring-indigo-500/10 scale-105 z-10 shadow-lg' : 'border-white/5 hover:border-white/20'}` 
                : `px-4 py-2 rounded-xl text-[12px] font-black border-2 ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`
              }`}
            >
              {useImage && (
                <>
                  <img src={item.img} className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${isActive ? 'brightness-110 saturate-110' : 'brightness-75 saturate-90 opacity-90 group-hover:brightness-100 group-hover:opacity-100'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>
                  <span className="relative z-10 text-[11px] font-black text-white uppercase tracking-tighter leading-tight text-left drop-shadow-md">{item.label}</span>
                  {isActive && <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[8px] shadow-lg"><FontAwesomeIcon icon={faCheck} /></div>}
                </>
              )}
              {!useImage && (
                <span className="flex items-center gap-1.5">
                  {isActive && <FontAwesomeIcon icon={faCheck} className="text-[10px]" />}
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OutputCard({ title, value, onCopy, placeholder, isTranslating, theme, height }: any) {
  const isIndigo = theme === 'indigo';
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-[1.5rem] border overflow-hidden flex flex-col shadow-2xl transition-all ${isDark ? 'bg-stone-950 border-white/10' : isIndigo ? 'bg-[#1e1b4b] border-indigo-500/20' : 'bg-[#1c1c2e] border-white/10'}`}>
      <div className={`px-4 py-2.5 border-b flex justify-between items-center ${isDark ? 'border-white/5 bg-white/5' : isIndigo ? 'border-indigo-500/20 bg-indigo-900/20' : 'border-white/5 bg-white/5'}`}>
        <h2 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isIndigo ? 'text-indigo-400' : 'text-slate-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isIndigo ? 'bg-indigo-500' : 'bg-indigo-600'}`}></span>
          {title}
        </h2>
        <button onClick={onCopy} className={`px-2 py-0.5 rounded-md text-[8px] font-black transition-all ${isIndigo ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-700 text-slate-100 hover:bg-slate-600'}`}>COPY</button>
      </div>
      <textarea 
        readOnly 
        value={isTranslating ? 'AI가 실시간 분석 중입니다...' : value} 
        placeholder={placeholder}
        className={`p-5 text-[11px] font-mono leading-relaxed outline-none resize-none bg-transparent scrollbar-hide ${height} ${isIndigo ? 'text-indigo-200/90 italic' : 'text-slate-300'}`}
      />
    </div>
  );
}
