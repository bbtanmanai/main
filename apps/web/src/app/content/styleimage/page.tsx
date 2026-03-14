'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUpload, faMagic, faCopy, faCheck, faTriangleExclamation,
  faCamera, faLightbulb, faImage, faStar, faBan, faCog, faXmark,
  faUserAstronaut
} from '@fortawesome/free-solid-svg-icons';
import { Heart } from 'lucide-react';
import styleConfig from '@/data/content_styleimage.json';

// --- Types ---
interface ParamItem {
  id: string;
  label: string;
  val: string;
  img?: string;
  desc?: string;
  recommend?: string;
  excludes?: { [key: string]: string[] };
  negatives?: string;
}

export default function StyleImagePage() {
  const [apiKey, setApiKey] = useState('');
  const [apiStatus, setApiStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [params, setParams] = useState({
    style: '',
    camera_angle_and_shot: '',
    lighting_and_atmosphere: '',
    background_and_location: '',
    color_palette: '',
    quality_boosters: '',
    negative_prompt: ''
  });

  const [imageType, setImageType] = useState('character');
  const [selectedStyleId, setSelectedStyleId] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [mjOutput, setMjOutput] = useState('');
  const [koOutput, setKoOutput] = useState('');
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

  // Logic: Selection (Toggle enabled)
  const selectParam = (key: string, item: ParamItem) => {
    const isAlreadySelected = key === 'style' ? selectedStyleId === item.id : params[key as keyof typeof params] === item.val;

    if (isAlreadySelected) {
      setParams(prev => ({ ...prev, [key]: '' }));
      if (key === 'style') setSelectedStyleId('');
    } else {
      setParams(prev => ({ ...prev, [key]: item.val }));
      if (key === 'style') {
        setSelectedStyleId(item.id);
        if (item.recommend) {
          const recommendedLight = styleConfig.lighting.find(l => l.id === item.recommend);
          if (recommendedLight) {
            setParams(prev => ({ ...prev, lighting_and_atmosphere: recommendedLight.val }));
          }
        }
      }
    }
  };

  // Logic: Output Generation
  useEffect(() => {
    const facePolicy = "Character Identity Preservation: Maintain the subject's essential facial structure, unique proportions, and recognizable identity from the reference image. [IMPORTANT PROTOCOL]: If the reference image contains two or more characters, you MUST strictly preserve the exact number of people.";
    const envPolicy = "Maintain 100% strict adherence to the original environment's composition, layout, color palette, and architectural details.";
    const hybridPolicy = "Unified Character & Environment Preservation: Balance the preservation of the subject's identity with the strict maintenance of the original environment's composition and atmosphere.";

    let policy = facePolicy;
    if (imageType === 'environment') policy = envPolicy;
    else if (imageType === 'hybrid') policy = hybridPolicy;

    const selectedStyle = styleConfig.styles.find(s => s.id === selectedStyleId);
    const autoNegative = selectedStyle?.negatives || '';
    
    let conditionalNegative = 'looking at camera, eye contact, facing camera, looking at viewer';
    if (params.camera_angle_and_shot.includes('below left') || params.camera_angle_and_shot.includes('below right')) {
      conditionalNegative += ', front view, straight on, centered';
    }

    const combinedNegative = [params.negative_prompt, autoNegative, conditionalNegative].filter(v => v).join(', ');

    const json = {
      reference_policy: policy,
      prompt_params: { ...params, negative_prompt: combinedNegative }
    };
    setJsonOutput(JSON.stringify(json, null, 2));

    const mjSegments = [
      params.style,
      params.camera_angle_and_shot,
      params.background_and_location,
      params.lighting_and_atmosphere,
      params.color_palette,
      params.quality_boosters,
      policy
    ].filter(val => val && val.trim() !== '');

    let mjPrompt = mjSegments.join(", ").replace(/\(([^:]+):([\d.]+)\)/g, '$1::$2');
    setMjOutput(mjPrompt ? mjPrompt + (combinedNegative ? ` --no ${combinedNegative.replace(/,/g, "")}` : "") : "");
  }, [params, imageType, selectedStyleId]);

  // Translation
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
      if (apiKey && apiStatus === 'valid') analyzeImage(result.split(',')[1], file.type);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (b64: string, mime: string) => {
    setIsAnalyzing(true);
    setJsonOutput("// AI 분석 중...");
    try {
      const prompt = `Analyze this image for Image-to-Image AI prompt generation. Return JSON with: image_type, style, camera_angle_and_shot, lighting_and_atmosphere, color_palette, background_and_location, quality_boosters, negative_prompt.`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }] })
      });
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analyzed = JSON.parse(jsonMatch[0]);
        setImageType(analyzed.image_type || 'character');
        setParams({
          style: analyzed.style || '',
          camera_angle_and_shot: analyzed.camera_angle_and_shot || '',
          lighting_and_atmosphere: analyzed.lighting_and_atmosphere || '',
          color_palette: analyzed.color_palette || '',
          background_and_location: analyzed.background_and_location || '',
          quality_boosters: analyzed.quality_boosters || '',
          negative_prompt: analyzed.negative_prompt || ''
        });
      }
    } catch (err: any) {
      setJsonOutput(`// 오류: ${err.message}`);
    } finally { setIsAnalyzing(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('클립보드에 복사되었습니다.');
  };

  return (
    <div className="bg-[#fdfcf0] min-h-screen text-stone-800 font-sans pb-20 antialiased">
      
      {/* Hero Header */}
      <header 
        className="relative pt-20 pb-28 text-center overflow-hidden bg-[#0f0f1a] text-white bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/img/content/styleimage/styleimage_top_bg.webp')" }}
      >
        {/* Background Overlay for readability */}
        <div className="absolute inset-0 bg-[#0f0f1a]/70"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#f97316_0%,transparent_70%)]"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-orange-400 text-[10px] font-black tracking-wider mb-6 uppercase">
            <FontAwesomeIcon icon={faMagic} /> Image-to-Style Generator
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tighter">
            AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">스타일 스튜디오</span>
          </h1>
          <p className="text-base text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            기존 이미지의 스타일과 구도를 AI가 분석하고 완벽하게 재정의합니다.<br />
            소스를 업로드하고 원하는 예술적 양식을 클릭하여 고유한 프롬프트를 생성하세요.
          </p>
        </div>
      </header>

      <main className="max-w-[1550px] mx-auto px-4 -mt-12 relative z-20">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Side: Controls (7 columns) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Upload */}
            <section className="bg-white border border-stone-200 rounded-[2rem] p-6 shadow-sm">
              <h2 className="text-lg font-black mb-5 flex items-center gap-3">
                <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm italic shadow-lg shadow-orange-500/20">1</span>
                소스 이미지 업로드
              </h2>
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}
                className={`border-4 border-dashed border-stone-100 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${isAnalyzing ? 'pointer-events-none' : 'hover:bg-orange-50/20'}`}
              >
                {!previewUrl ? (
                  <>
                    <FontAwesomeIcon icon={faUpload} className="text-3xl text-stone-200 mb-3" />
                    <p className="text-stone-400 font-bold text-base">이미지 드래그 또는 클릭</p>
                  </>
                ) : (
                  <img src={previewUrl} alt="Preview" className={`max-h-64 rounded-xl shadow-xl ${isAnalyzing ? 'brightness-50 blur-[2px]' : ''}`} />
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <span className="text-white text-xs font-black tracking-widest uppercase">Analyzing Source...</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
            </section>

            {/* 2. Refinement Grid */}
            <section className="space-y-5">
              <GridSection num="2" title="Style (양식)" icon={faMagic} items={styleConfig.styles} selectedId={selectedStyleId} onSelect={(item: any) => selectParam('style', item)} useImage />
              <GridSection num="3" title="Lighting (조명)" icon={faLightbulb} items={styleConfig.lighting} selectedId={params.lighting_and_atmosphere} onSelect={(item: any) => selectParam('lighting_and_atmosphere', item)} isValueMatched useImage />
              <GridSection num="4" title="Camera (구도)" icon={faCamera} items={styleConfig.cameras} selectedId={params.camera_angle_and_shot} onSelect={(item: any) => selectParam('camera_angle_and_shot', item)} isValueMatched useImage />
              <GridSection num="5" title="Background (배경 - 미선택 시 원본 유지)" icon={faImage} items={styleConfig.backgrounds} selectedId={params.background_and_location} onSelect={(item: any) => selectParam('background_and_location', item)} isValueMatched useImage />
              <GridSection title="Quality (품질)" icon={faStar} items={styleConfig.quality} selectedId={params.quality_boosters} onSelect={(item: any) => selectParam('quality_boosters', item)} isValueMatched />
              <GridSection title="Negative (제외)" icon={faBan} items={styleConfig.negative} selectedId={params.negative_prompt} onSelect={(item: any) => selectParam('negative_prompt', item)} isValueMatched />
            </section>
          </div>

          {/* Right Side: Outputs (5 columns - Wider) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-20 space-y-4">
              <OutputCard title="JSON 프롬프트" value={jsonOutput} onCopy={() => copyToClipboard(jsonOutput)} theme="dark" height="h-56" />
              <OutputCard title="서술형 프롬프트 (EN)" value={mjOutput} onCopy={() => copyToClipboard(mjOutput)} placeholder="스타일 선택 시 생성됩니다." theme="dark" height="h-48" />
              <OutputCard title="한글 번역" value={koOutput} onCopy={() => copyToClipboard(koOutput)} isTranslating={isTranslating} theme="green" height="h-48" />
            </div>
          </div>
        </div>
      </main>

      {/* Settings Action Button */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <button onClick={() => setShowSettings(true)} className="w-12 h-12 bg-white border border-stone-200 rounded-full shadow-2xl flex items-center justify-center text-stone-400 hover:text-orange-500 transition-all">
          <FontAwesomeIcon icon={faCog} />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black flex items-center gap-3">API 설정</h3>
              <button onClick={() => setShowSettings(false)} className="text-stone-400"><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <input 
              type="password" 
              value={tempKey} 
              onChange={e => setTempKey(e.target.value)}
              placeholder="Google AI API Key..."
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-stone-900 focus:outline-none focus:border-orange-500 font-mono text-sm mb-6 shadow-inner" 
            />
            <button onClick={handleSaveSettings} className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">저장하기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub Components ---

function GridSection({ num, title, icon, items, selectedId, onSelect, useImage, isValueMatched }: any) {
  return (
    <div className="bg-white border border-stone-200 rounded-[1.5rem] p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        {num && (
          <span className="bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black italic shadow-sm">
            {num}
          </span>
        )}
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
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
                ? `w-[100px] h-[100px] rounded-xl border-2 flex flex-col justify-end p-2 ${isActive ? 'border-orange-500 ring-4 ring-orange-500/10 scale-105 z-10 shadow-lg' : 'border-stone-100 hover:border-stone-300'}` 
                : `px-4 py-2 rounded-xl text-[12px] font-black border-2 ${isActive ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200 hover:border-stone-300'}`
              }`}
            >
              {useImage && (
                <>
                  <img src={item.img} className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${isActive ? 'brightness-110 saturate-110' : 'brightness-90 saturate-90 opacity-90 group-hover:brightness-100 group-hover:opacity-100'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>
                  <span className="relative z-10 text-[11px] font-black text-white uppercase tracking-tighter leading-tight text-left drop-shadow-md">{item.label}</span>
                  {isActive && <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-[8px] shadow-lg"><FontAwesomeIcon icon={faCheck} /></div>}
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
  const isDark = theme === 'dark';
  const isGreen = theme === 'green';

  return (
    <div className={`rounded-[1.5rem] border overflow-hidden flex flex-col shadow-xl transition-all ${isDark ? 'bg-stone-950 border-stone-800' : isGreen ? 'bg-[#0d1a0a] border-[#1a2d14]' : 'bg-white border-stone-200'}`}>
      <div className={`px-4 py-2.5 border-b flex justify-between items-center ${isDark ? 'border-stone-800 bg-stone-900/50' : isGreen ? 'border-[#1a2d14] bg-[#1a2d14]/50' : 'border-stone-100 bg-stone-50'}`}>
        <h2 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-stone-500' : isGreen ? 'text-green-500' : 'text-stone-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-orange-500' : isGreen ? 'bg-green-500' : 'bg-stone-300'}`}></span>
          {title}
        </h2>
        <button onClick={onCopy} className={`px-2 py-0.5 rounded-md text-[8px] font-black transition-all ${isDark ? 'bg-orange-500 text-white hover:bg-orange-600' : isGreen ? 'bg-green-700 text-green-100 hover:bg-green-600' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}>COPY</button>
      </div>
      <textarea 
        readOnly 
        value={isTranslating ? 'AI가 실시간 번역 중입니다...' : value} 
        placeholder={placeholder}
        className={`p-5 text-[11px] font-mono leading-relaxed outline-none resize-none bg-transparent scrollbar-hide ${height} ${isDark ? 'text-orange-200/90' : isGreen ? 'text-green-200/80 italic' : 'text-stone-600 italic font-sans'}`}
      />
    </div>
  );
}
