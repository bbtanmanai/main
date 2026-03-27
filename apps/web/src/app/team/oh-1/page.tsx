'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBrain,
  faMagicWandSparkles,
  faCheckCircle,
  faSpinner,
  faArrowRight,
  faCopy,
  faCheck,
  faRocket,
  faFlask,
  faLightbulb,
  faExclamationTriangle,
  faChevronRight,
  faChevronDown,
  faPlay,
  faCircle,
  faTimes,
  faUpload,
  faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import Aurora from '@/components/Aurora';
import Link from 'next/link';

const API = 'http://localhost:8000/api/v1';
const FIXED_NOTEBOOK_ID = '85362656-b5a6-4672-a874-619b99fc55e5';

// ── 떡상 점수 계산 (로직 유지) ───────────────────────────────
function calcViralScore(video: any): number {
  if (!video) return 0;
  const { views, subscribers: subs, likes, comments } = video;
  if (!subs || !views) return 0;
  const viewRatio  = (views / subs) * 100;
  const engagement = ((likes + comments * 5) / views) * 100;
  return Math.round(viewRatio * (1 + engagement * 0.05) * 10) / 10;
}

const SCRIPT_PROMPT_TEMPLATE = (idea: string, analysis: any, name: string) => `
분석된 채널의 핵심 특성:
- 틈새시장: ${analysis?.niche || ''}
- 타겟 시청자: ${analysis?.target || ''}
- 검증된 훅 패턴: ${analysis?.hook || ''}
- 제목 공식: ${analysis?.title_pattern || ''}

위 채널 특성을 완전히 반영해서 아래 제목으로 유튜브 대본을 써줘: "${idea}"

⚠️ 출력 형식 규칙 (반드시 준수):
- 대본은 반드시 [씬1], [씬2], [씬3] ... 형식으로 씬을 구분해서 작성해.
- 각 씬은 [씬N] 태그로 시작하고, 씬 내용만 작성해. 제목이나 설명 줄은 넣지 마.
- 씬 개수는 6~10개로 구성해.
- [씬N] 태그 외 다른 마크다운(**, ##, --- 등)은 절대 사용하지 마.

씬 구성 원칙:
[씬1] 오프닝 훅 — 공백 포함 60~100자 이내. 단 1~2문장.
[씬2] 도입부 — "내 이름은 ${name || '지화'}야. 만약 네가 [시청자의 고민] 때문에 힘들다면 구독 눌러줘."
[씬3 이후] 본론을 내용에 맞게 자연스럽게 씬으로 나눠서 전개. 마지막 씬은 핵심 요약 + 구독/좋아요 유도로 마무리.
`.trim();

// UI Sub-components from content/script
function StepTab({ step, label, current, done, onClick }: any) {
  const active = current === step;
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1 sm:px-4 py-3 border-b-2 font-black transition-all duration-300 ${
        active ? 'border-fuchsia-500 text-white'
        : done  ? 'border-emerald-600/70 text-emerald-400 hover:text-emerald-300'
        : 'border-transparent text-slate-600 hover:text-slate-400'
      }`}
    >
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
        active ? 'bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white'
        : done  ? 'bg-emerald-600 text-white'
        : 'bg-slate-800 text-slate-600'
      }`}>
        {done ? <FontAwesomeIcon icon={faCheckCircle} size="xs" /> : step}
      </span>
      <span className="text-[10px] sm:text-[12px] tracking-wide text-center leading-tight">{label}</span>
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500" />}
    </button>
  );
}

export default function OhJiHwaScriptPage() {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [channelName, setChannelName] = useState('지화');
  const [status, setStatus] = useState<'idle' | 'resolving' | 'analyzing' | 'ideas' | 'scripting' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  
  // Data State
  const [video, setVideo] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [selectedIdea, setSelectedIdea] = useState('');
  const [script, setScript] = useState('');
  const [scenes, setScenes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleStartProcess = async () => {
    if (!url.trim()) return;
    setStatus('resolving');
    setStep(1);
    setError('');
    
    try {
      // 1. Resolve Channel & Pick Best Video
      const resolveRes = await fetch(`${API}/youtube/resolve-channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const resolveData = await resolveRes.json();
      if (!resolveData.success || !resolveData.videos?.length) {
        throw new Error(resolveData.error || '채널 정보를 가져올 수 없습니다.');
      }
      
      const bestVideo = [...resolveData.videos].sort((a, b) => calcViralScore(b) - calcViralScore(a))[0];
      setVideo(bestVideo);
      
      // 2. Init Notebook & Analyze
      setStatus('analyzing');
      setStep(2);
      const nlmInitRes = await fetch(`${API}/nlm-video/init-notebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebook_name: `Oh-1: ${bestVideo.title.slice(0, 30)}`,
          existing_notebook_id: FIXED_NOTEBOOK_ID,
          urls: [bestVideo.url]
        }),
      });
      const nlmInitData = await nlmInitRes.json();
      if (!nlmInitData.notebook_id) throw new Error('AI 분석 세션 초기화 실패');
      
      const nbId = nlmInitData.notebook_id;
      const analyzeRes = await fetch(`${API}/nlm-video/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebook_id: nbId }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeData.success) throw new Error('AI 영상 심층 분석 실패');
      setAnalysis(analyzeData.analysis);

      // 3. Generate Ideas
      setStatus('ideas');
      setStep(3);
      const ideasRes = await fetch(`${API}/nlm-video/generate-ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebook_id: nbId, analysis: analyzeData.analysis, count: 5 }),
      });
      const ideasData = await ideasRes.json();
      if (!ideasData.success) throw new Error('아이디어 생성 실패');
      setIdeas(ideasData.ideas || []);
      
      const idea = ideasData.ideas[0];
      setSelectedIdea(idea);

      // 4. Generate Script
      setStatus('scripting');
      setStep(4);
      const prompt = SCRIPT_PROMPT_TEMPLATE(idea, analyzeData.analysis, channelName);
      
      await fetch(`${API}/nlm-video/inject-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebook_id: nbId, prompt }),
      });

      const scriptRes = await fetch(`${API}/nlm-video/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebook_id: nbId, idea, prompt }),
      });
      const scriptData = await scriptRes.json();
      if (!scriptData.success) throw new Error('최종 대본 생성 실패');
      
      const raw = scriptData.script || '';
      setScript(raw);
      const markerSplit = raw.split(/(?=\[씬\s*\d+\])/g)
        .map((s: string) => s.trim())
        .filter((s: string) => /^\[씬\s*\d+\]/.test(s));
      setScenes(markerSplit.length >= 2 ? markerSplit : raw.split(/\n{2,}/).filter((s: string) => s.trim()));
      
      setStatus('done');
      setStep(4);
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(scenes.join('\n\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white font-sans antialiased pb-20">
      {/* Header (Matching content/script) */}
      <header className="relative pt-12 pb-24 px-6 overflow-hidden bg-[#0f0f1a]">
        <div className="absolute inset-0">
          <Aurora colorStops={['#3b0764', '#7c3aed', '#1e1b4b']} amplitude={1.2} blend={0.6} speed={2.2} yOffset={0.35} />
        </div>
        <div className="absolute inset-0 bg-[#0f0f1a]/50" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
            <span className="text-fuchsia-200 text-[10px] font-black uppercase tracking-[0.2em]">OH-1: AI AUTOMATED SCRIPT LAB</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/20 shrink-0">
              <FontAwesomeIcon icon={faBrain} className="text-lg text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">
              오정화 <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-500 bg-clip-text text-transparent">매직 대본 생산</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm mb-6">URL 입력 한 번으로 분석부터 대본 완성까지 자동 진행</p>

          <div className="flex items-stretch border-b border-white/10 w-full overflow-x-auto">
            <StepTab step={1} label="영상 확인" current={step} done={['analyzing', 'ideas', 'scripting', 'done'].includes(status)} onClick={() => {}} />
            <FontAwesomeIcon icon={faChevronRight} className="hidden sm:block text-slate-700 text-[9px] shrink-0 self-center mx-2" />
            <StepTab step={2} label="AI 분석" current={step} done={['ideas', 'scripting', 'done'].includes(status)} onClick={() => {}} />
            <FontAwesomeIcon icon={faChevronRight} className="hidden sm:block text-slate-700 text-[9px] shrink-0 self-center mx-2" />
            <StepTab step={3} label="아이디어 로드" current={step} done={['scripting', 'done'].includes(status)} onClick={() => {}} />
            <FontAwesomeIcon icon={faChevronRight} className="hidden sm:block text-slate-700 text-[9px] shrink-0 self-center mx-2" />
            <StepTab step={4} label="대본 완성" current={step} done={status === 'done'} onClick={() => {}} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
        <section className="bg-[#1c1c2e] border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden relative min-h-[500px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none" />
          
          <div className="relative z-10">
            {status === 'idle' || status === 'error' ? (
              <div className="flex flex-col items-center py-12">
                <h2 className="text-2xl font-black mb-2">벤치마킹 URL 입력</h2>
                <p className="text-slate-500 text-sm mb-8">오정화 팀 전용 자동화 파이프라인이 시작됩니다.</p>
                
                <div className="w-full max-w-2xl flex flex-col gap-4">
                  <div className="bg-white/5 border border-white/10 p-2 rounded-[1.5rem] flex items-center gap-2 focus-within:border-fuchsia-500/50 transition-all">
                    <div className="pl-4 text-red-500">
                      <FontAwesomeIcon icon={faYoutube} className="text-xl" />
                    </div>
                    <input 
                      type="text"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="분석할 유튜브 영상 URL..."
                      className="flex-grow bg-transparent py-3 text-white placeholder:text-slate-700 focus:outline-none font-bold text-sm"
                    />
                    <button 
                      onClick={handleStartProcess}
                      className="px-8 py-3 rounded-[1rem] font-black text-xs text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:brightness-110 shadow-lg shadow-fuchsia-500/20 active:scale-95 transition-all"
                    >
                      MAGIC START
                    </button>
                  </div>
                  
                  {status === 'error' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      {error}
                    </div>
                  )}
                </div>
              </div>
            ) : status === 'done' ? (
              <div className="animate-in fade-in duration-700">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-white">최종 대본 완성</h2>
                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">{video?.title}</p>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all border ${copied ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                    {copied ? '복사됨' : '전체 복사'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest pl-2">분석 공식 (Formula)</h3>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-full font-medium text-sm leading-relaxed text-slate-300">
                      <p className="mb-4"><span className="text-white font-black mr-2">Niche:</span> {analysis?.niche}</p>
                      <p className="mb-4"><span className="text-white font-black mr-2">Target:</span> {analysis?.target}</p>
                      <p className="mb-4"><span className="text-white font-black mr-2">Hook Pattern:</span> {analysis?.hook}</p>
                      <p><span className="text-white font-black mr-2">Title Pattern:</span> {analysis?.title_pattern}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-2">대본 데이터 (Script)</h3>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-[400px] overflow-y-auto custom-scrollbar space-y-6">
                      {scenes.map((scene, i) => (
                        <div key={i}>
                          <p className="text-[10px] font-black text-indigo-500 mb-2 uppercase tracking-tighter">SCENE {i + 1}</p>
                          <p className="text-sm leading-relaxed text-slate-300">{scene.replace(/^\[씬\s*\d+\]/, '').trim()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center border-t border-white/10 pt-10">
                  <Link 
                    href="/team/oh-2"
                    className="flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-base text-white bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:brightness-110 transition-all active:scale-95 shadow-2xl shadow-fuchsia-500/20"
                  >
                    <FontAwesomeIcon icon={faArrowRight} />
                    다음 단계: OH-2 (키프레임)
                  </Link>
                </div>
              </div>
            ) : (
              /* Progress State */
              <div className="flex flex-col items-center py-20 animate-in fade-in zoom-in duration-500">
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-fuchsia-500 border-r-indigo-500 border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FontAwesomeIcon icon={status === 'resolving' ? faYoutube : status === 'analyzing' ? faBrain : faMagicWandSparkles} className="text-white text-xl animate-pulse" />
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">
                  {status === 'resolving' ? '영상 정보 수집 중...' : 
                   status === 'analyzing' ? '심층 분석 중...' :
                   status === 'ideas' ? '아이디어 생성 중...' : '대본 집필 중...'}
                </h3>
                <p className="text-slate-500 text-sm font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-ping" />
                  잠시만 기다려 주세요 (최대 1분 소요될 수 있습니다)
                </p>
                
                <div className="w-full max-w-sm h-1 bg-white/5 rounded-full mt-10 overflow-hidden">
                  <div className={`h-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 transition-all duration-1000 ${
                    status === 'resolving' ? 'w-[20%]' : 
                    status === 'analyzing' ? 'w-[40%]' :
                    status === 'ideas' ? 'w-[70%]' : 'w-[90%]'
                  }`} />
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <p className="text-center mt-12 text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]">
        AI SCRIPT AUTOMATION · TEAM OH-1
      </p>
    </div>
  );
}
