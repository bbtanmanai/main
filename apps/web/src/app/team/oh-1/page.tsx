'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight, faBrain,
  faMagicWandSparkles,
  faCheckCircle, faSpinner, faCircle,
  faCopy, faCheck, faArrowRight,
  faFileAlt, faUpload, faTimes, faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import Aurora from '@/components/Aurora';

const API = 'http://localhost:8000/api/v1';
const FIXED_NOTEBOOK_ID = '85362656-b5a6-4672-a874-619b99fc55e5';

// ── 떡상 점수 계산 ────────────────────────────────────────────────────────────
function calcViralScore(video: { views: number; subscribers: number; likes: number; comments: number }): number {
  const { views, subscribers: subs, likes, comments } = video;
  if (!subs || !views) return 0;
  const viewRatio  = (views / subs) * 100;
  const engagement = ((likes + comments * 5) / views) * 100;
  return Math.round(viewRatio * (1 + engagement * 0.05) * 10) / 10;
}

function getScoreTier(score: number): { emoji: string; bgColor: string; label: string } {
  if (score >= 30) return { emoji: '🔥', bgColor: 'bg-red-500/80 text-white border-red-400/50',       label: '떡상'  };
  if (score >= 15) return { emoji: '⚡', bgColor: 'bg-yellow-500/80 text-black border-yellow-400/50', label: '상승중' };
  if (score >= 8)  return { emoji: '📈', bgColor: 'bg-green-500/80 text-white border-green-400/50',   label: '관심'  };
  return              { emoji: '💤', bgColor: 'bg-slate-600/80 text-slate-300 border-slate-500/50',  label: '보통'  };
}

function formatNum(n: number): string {
  if (!n) return '0';
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000)     return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000)      return `${(n / 1000).toFixed(1)}천`;
  return String(n);
}

// ── 대본 프롬프트 템플릿 ──────────────────────────────────────────────────────
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
씬 개수는 대본 흐름에 맞게 자유롭게 구성하되, 공백 제외 3,000자 ~ 5,000자를 채워야 한다.

💡 스타일 가이드:
- 친구랑 말하듯이 자연스럽게 써. ('사실 말이야...', '자 봐봐' 같은 표현 활용)
- 시청자가 공감할 수 있는 상황을 초반에 제시해줘.
- 구체적인 수치와 사례로 신뢰감을 줘.
- 어려운 개념은 쉬운 비유를 들어서 설명해.
- 마지막엔 강력한 동기부여와 함께 구독/좋아요를 유도하며 끝내줘.
`.trim();

// ── Step Tab ──────────────────────────────────────────────────────────────────
function StepTab({ step, label, current, done, onClick }: {
  step: number; label: string; current: number; done: boolean; onClick: () => void;
}) {
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Oh1ScriptPage() {
  const [step, setStep] = React.useState(1);

  // Step 1
  const [url, setUrl] = React.useState('');
  const [channelName, setChannelName] = React.useState('지화');
  const [isResolving, setIsResolving] = React.useState(false);
  const [videos, setVideos] = React.useState<any[]>([]);
  const [selectedVideoIdx, setSelectedVideoIdx] = React.useState<number | null>(null);
  const [srtText, setSrtText] = React.useState('');
  const [srtFileName, setSrtFileName] = React.useState('');
  const srtInputRef = React.useRef<HTMLInputElement>(null);

  const parseSrt = (raw: string): string => {
    return raw
      .split(/\n\n+/)
      .map(block => block.split('\n').filter(l => !/^\d+$/.test(l.trim()) && !/-->/.test(l)).join(' '))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleSrtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = parseSrt(ev.target?.result as string);
      setSrtText(text);
      setSrtFileName(file.name);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // Step 2
  const [notebookId, setNotebookId] = React.useState('');
  const [step2Error, setStep2Error] = React.useState('');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = React.useState(false);

  // Step 3
  const [analysis, setAnalysis] = React.useState<any>(null);
  const [ideas, setIdeas] = React.useState<string[]>([]);
  const [selectedIdea, setSelectedIdea] = React.useState('');

  // Step 4
  const [isInjectingPrompt, setIsInjectingPrompt] = React.useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = React.useState(false);
  const [script, setScript] = React.useState('');
  const [scenes, setScenes] = React.useState<string[]>([]);
  const [editingIdx, setEditingIdx] = React.useState<number | null>(null);
  const [editingText, setEditingText] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUrlSubmit = async () => {
    if (!url.trim() || isResolving) return;
    setIsResolving(true);
    setVideos([]);
    setSelectedVideoIdx(null);
    try {
      const res = await fetch(`${API}/youtube/resolve-channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.videos) {
          const sorted = [...data.videos].sort((a: any, b: any) => calcViralScore(b) - calcViralScore(a));
          setVideos(sorted);
        } else {
          alert(`수집 실패: ${data.error || '알 수 없는 오류'}`);
        }
      } else {
        alert(`서버 오류 (${res.status})`);
      }
    } catch {
      alert('서버 연결 실패. 백엔드 서버를 확인해 주세요.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (selectedVideoIdx === null && !srtText) return;
    const video = selectedVideoIdx !== null ? videos[selectedVideoIdx] : null;
    setStep(2);
    setStep2Error('');
    setAnalysis(null);

    const timeout = (ms: number) => new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('분석 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.')), ms)
    );

    try {
      const nlmBody: any = {
        notebook_name: srtText && !video
          ? `OH-1 SRT 분석 — ${srtFileName || '자막파일'}`
          : `OH-1 벤치마킹 — ${video?.title?.slice(0, 30) || '채널분석'}`,
        existing_notebook_id: FIXED_NOTEBOOK_ID,
      };
      if (srtText) {
        nlmBody.text_content = `[영상 제목] ${video?.title || srtFileName || 'SRT 직접 분석'}\n\n[자막 전문]\n${srtText}`;
      } else {
        nlmBody.urls = [video!.url];
      }
      const nlmRes = await Promise.race([
        fetch(`${API}/nlm-video/init-notebook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nlmBody),
        }),
        timeout(180000),
      ]);
      if (!nlmRes.ok) {
        const errData = await nlmRes.json().catch(() => ({}));
        throw new Error(errData.detail || 'AI 분석 실패');
      }
      const nlmData = await nlmRes.json();
      if (!nlmData.notebook_id) throw new Error('노트북 ID 없음');
      const nbId = nlmData.notebook_id;
      setNotebookId(nbId);

      const anaRes = await Promise.race([
        fetch(`${API}/nlm-video/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notebook_id: nbId }),
        }),
        timeout(180000),
      ]);
      const anaData = await anaRes.json();
      if (!anaData.success) throw new Error(anaData.detail || '분석 실패');
      setAnalysis(anaData.analysis);

      setIsGeneratingIdeas(true);
      const ideasRes = await Promise.race([
        fetch(`${API}/nlm-video/generate-ideas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notebook_id: nbId, analysis: anaData.analysis, count: 20 }),
        }),
        timeout(180000),
      ]);
      const ideasData = await ideasRes.json();
      if (ideasData.success) {
        setIdeas(ideasData.ideas || []);
      }
      setStep(3);
    } catch (e: any) {
      setStep2Error(e.message || '처리 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!selectedIdea || !notebookId) return;
    setIsInjectingPrompt(true);
    try {
      const prompt = SCRIPT_PROMPT_TEMPLATE(selectedIdea, analysis, channelName.trim());
      const injectRes = await fetch(`${API}/nlm-video/inject-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebook_id: notebookId, prompt }),
      });
      if (!injectRes.ok) throw new Error('프롬프트 주입 실패');
      setIsInjectingPrompt(false);

      setIsGeneratingScript(true);
      setStep(4);
      const scriptRes = await fetch(`${API}/nlm-video/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebook_id: notebookId, idea: selectedIdea, prompt }),
      });
      const scriptData = await scriptRes.json();
      if (scriptData.success) {
        const raw = scriptData.script || '';
        setScript(raw);
        const markerSplit = raw.split(/(?=\[씬\s*\d+\])/g)
          .map((s: string) => s.trim())
          .filter((s: string) => /^\[씬\s*\d+\]/.test(s));
        setScenes(markerSplit.length >= 2 ? markerSplit : raw.split(/\n{2,}/).filter((s: string) => s.trim()));
      } else {
        alert('대본 생성 실패: ' + scriptData.detail);
      }
    } catch (e: any) {
      alert('오류: ' + e.message);
    } finally {
      setIsInjectingPrompt(false);
      setIsGeneratingScript(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(scenes.join('\n\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Step done 조건 ─────────────────────────────────────────────────────────
  const step1Done = selectedVideoIdx !== null && step > 1;
  const step2Done = !!analysis;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white font-sans antialiased pb-20">

      {/* Header */}
      <header className="relative pt-12 pb-24 px-6 overflow-hidden bg-[#0f0f1a]">
        <div className="absolute inset-0">
          <Aurora colorStops={['#3b0764', '#7c3aed', '#1e1b4b']} amplitude={1.2} blend={0.6} speed={2.2} yOffset={0.35} />
        </div>
        <div className="absolute inset-0 bg-[#0f0f1a]/50" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
            <span className="text-fuchsia-200 text-[10px] font-black uppercase tracking-[0.2em]">OH-1 · 채널 벤치마킹 → 대본 즉시 생산</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/20 shrink-0">
              <FontAwesomeIcon icon={faBrain} className="text-lg text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">
              오정화 <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-500 bg-clip-text text-transparent">× 대본 생산</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm mb-6">경쟁 채널 영상 1개 선택 → AI 심층 분석 → 대본 즉시 생성</p>

          <div className="flex items-stretch border-b border-white/10 w-full overflow-x-auto">
            {[
              { s: 1, label: '영상 선택',     done: step1Done },
              { s: 2, label: 'AI 분석 중',   done: step2Done },
              { s: 3, label: '아이디어 선택', done: !!selectedIdea },
              { s: 4, label: '대본 완성',     done: !!script },
            ].map(({ s, label, done }, i) => (
              <React.Fragment key={s}>
                <StepTab step={s} label={label} current={step} done={done} onClick={() => step >= s && setStep(s)} />
                {i < 3 && <FontAwesomeIcon icon={faChevronRight} className="hidden sm:block text-slate-700 text-[9px] shrink-0 self-center" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
        <section className="bg-[#1c1c2e] border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none" />
          <div className="relative z-10">

            {/* ══ STEP 1: 영상 선택 ══ */}
            {step === 1 && (
              <div className="flex flex-col items-center py-4">
                <h2 className="text-2xl font-black mb-2">
                  <span className="text-fuchsia-400">벤치마킹할 영상</span> 1개 선택
                </h2>
                <p className="text-slate-500 text-sm mb-6 text-center">
                  분석할 채널 URL을 입력하고 가장 배우고 싶은 영상 1개를 골라주세요.
                </p>

                {/* 채널명 입력 */}
                <div className="w-full max-w-2xl mb-3">
                  <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-[1.5rem] flex items-center gap-3 focus-within:border-fuchsia-500/50 transition-all">
                    <span className="text-slate-500 text-sm font-black shrink-0">내 채널명</span>
                    <input
                      type="text"
                      value={channelName}
                      onChange={e => setChannelName(e.target.value)}
                      placeholder="예: 지화, 오정화 ..."
                      className="flex-grow bg-transparent text-white placeholder:text-slate-700 focus:outline-none font-bold text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5 pl-2">대본에서 진행자 이름으로 사용됩니다.</p>
                </div>

                {/* URL 입력 + 분석 시작 */}
                <div className="w-full max-w-2xl flex items-center gap-2 mb-4">
                  <div className="flex-1 bg-white/5 border border-white/10 p-1.5 rounded-[1.5rem] flex items-center gap-2 focus-within:border-fuchsia-500/50 transition-all">
                    <div className="pl-4 text-slate-500">
                      <FontAwesomeIcon icon={faYoutube} className="text-xl text-red-500" />
                    </div>
                    <input
                      type="text" value={url}
                      onChange={e => setUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                      placeholder="벤치마킹할 채널 URL 입력 (내가 만들 채널과 같은 장르)"
                      className="flex-grow bg-transparent py-3 text-white placeholder:text-slate-700 focus:outline-none font-bold text-sm"
                    />
                    <button
                      onClick={handleUrlSubmit} disabled={isResolving}
                      className="px-6 py-3 rounded-[1rem] font-black text-xs text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:brightness-110 disabled:opacity-50 transition-all active:scale-95 shrink-0"
                    >
                      {isResolving
                        ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1.5" />수집 중...</>
                        : '영상 수집'}
                    </button>
                  </div>
                  <button
                    onClick={handleStartAnalysis}
                    disabled={selectedVideoIdx === null && !srtText}
                    className="px-5 py-3 rounded-[1rem] font-black text-xs text-white bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0 flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faBrain} />
                    영상 분석 시작
                  </button>
                </div>

                {/* SRT 업로드 */}
                <div className="w-full max-w-2xl mb-4 flex items-center gap-2">
                  <input ref={srtInputRef} type="file" accept=".srt" className="hidden" onChange={handleSrtUpload} />
                  {srtFileName ? (
                    <div className="flex-1 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1.5">
                      <FontAwesomeIcon icon={faFileAlt} className="text-emerald-400 text-xs shrink-0" />
                      <span className="text-emerald-300 text-[11px] font-black flex-1 truncate">{srtFileName}</span>
                      <span className="text-emerald-500 text-[9px] font-black bg-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0">적용됨</span>
                      <button onClick={() => { setSrtText(''); setSrtFileName(''); }} className="text-slate-500 hover:text-red-400 transition-colors shrink-0">
                        <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => srtInputRef.current?.click()}
                      className="flex-1 flex items-center gap-1.5 bg-white/3 hover:bg-white/6 border border-dashed border-white/15 hover:border-fuchsia-500/40 rounded-xl px-3 py-1.5 transition-all group"
                    >
                      <FontAwesomeIcon icon={faUpload} className="text-slate-600 group-hover:text-fuchsia-400 text-xs transition-colors shrink-0" />
                      <span className="text-slate-600 group-hover:text-slate-400 text-[11px] font-black transition-colors">SRT 자막 업로드 (선택 — 분석 정밀도 향상)</span>
                    </button>
                  )}
                  <button
                    onClick={() => window.open('/how-to-save-srt-files.html', '_blank')}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 hover:text-indigo-300 text-[11px] font-black transition-all"
                  >
                    <FontAwesomeIcon icon={faFileAlt} className="text-xs" />
                    SRT 확보 방법
                  </button>
                </div>

                {/* 영상 그리드 */}
                {videos.length > 0 && (
                  <>
                    <div className="w-full flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        수집 완료 — <span className="text-fuchsia-400">{videos.length}개</span>
                        <span className="text-slate-600 ml-2">(바이럴 점수 높은 순)</span>
                      </span>
                      {selectedVideoIdx !== null && (
                        <span className="text-[11px] font-black text-emerald-400">
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                          1개 선택됨
                        </span>
                      )}
                    </div>

                    <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
                      {videos.slice(0, 10).map((vid: any, i: number) => {
                        const selected = selectedVideoIdx === i;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedVideoIdx(i)}
                            className={`relative rounded-xl overflow-hidden border text-left transition-all duration-200 group ${
                              selected
                                ? 'border-fuchsia-500 shadow-lg shadow-fuchsia-500/20 scale-[1.02]'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <div className="relative aspect-video">
                              <img src={vid.thumbnail_url} alt={vid.title} className="w-full h-full object-cover" />
                              {(() => {
                                const score = calcViralScore(vid);
                                const tier  = getScoreTier(score);
                                return (
                                  <div className={`absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black border backdrop-blur-sm ${tier.bgColor}`}>
                                    <span>{tier.emoji}</span>
                                    <span>{score}</span>
                                    <span className="hidden sm:inline">{tier.label}</span>
                                  </div>
                                );
                              })()}
                              {selected && (
                                <div className="absolute inset-0 bg-fuchsia-500/20 flex items-center justify-center">
                                  <div className="w-8 h-8 rounded-full bg-fuchsia-500 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-white text-sm" />
                                  </div>
                                </div>
                              )}
                              {!selected && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faPlay} className="text-white text-sm" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className={`p-2.5 ${selected ? 'bg-fuchsia-950/50' : 'bg-white/5'}`}>
                              <p className="text-[11px] font-bold text-white line-clamp-2 mb-1 leading-snug">{vid.title}</p>
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold flex-wrap">
                                {vid.views    > 0 && <span>👁 {formatNum(vid.views)}</span>}
                                {vid.likes    > 0 && <span>👍 {formatNum(vid.likes)}</span>}
                                {vid.comments > 0 && <span>💬 {formatNum(vid.comments)}</span>}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedVideoIdx !== null && (
                      <div className="w-full max-w-xl bg-fuchsia-950/30 border border-fuchsia-500/30 rounded-2xl p-4 flex items-center gap-4">
                        <img src={videos[selectedVideoIdx].thumbnail_url} className="w-20 h-12 rounded-lg object-cover shrink-0" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">선택된 영상</p>
                          <p className="text-sm font-bold text-white line-clamp-1">{videos[selectedVideoIdx].title}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ══ STEP 2: 분석 중 ══ */}
            {step === 2 && (
              <div className="py-4">
                {!step2Error ? (
                  <>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse shrink-0" />
                      <p className="text-sm font-black text-slate-400">
                        {isGeneratingIdeas ? 'AI가 아이디어를 생성하고 있습니다...' : 'AI가 영상을 분석하고 있습니다...'}
                      </p>
                    </div>
                    <div className="text-center mb-6 space-y-3">
                      <div className="h-5 w-36 bg-white/10 rounded-full animate-pulse mx-auto" />
                      <div className="h-8 w-64 bg-white/10 rounded-xl animate-pulse mx-auto" />
                    </div>
                    <div className="space-y-2">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.03] animate-pulse"
                          style={{ animationDelay: `${(i % 5) * 80}ms` }}
                        >
                          <div className="w-6 h-6 rounded-full bg-white/10 shrink-0" />
                          <div className="h-4 rounded-lg bg-white/10" style={{ width: `${55 + (i * 17) % 35}%` }} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-16">
                    <div className="w-full max-w-sm bg-red-950/50 border border-red-700/40 rounded-xl p-4 text-red-300 text-sm font-bold text-center">
                      ⚠ {step2Error}
                      <button onClick={() => setStep(1)} className="block mx-auto mt-3 text-xs text-slate-400 hover:text-white underline">
                        영상 선택으로 돌아가기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ STEP 3: 아이디어 선택 ══ */}
            {step === 3 && (
              <div className="py-4">
                <h2 className="text-2xl font-black mb-2 text-center">
                  <span className="text-emerald-400">영상 아이디어</span> 1개 선택
                </h2>
                <p className="text-slate-500 text-sm mb-6 text-center">
                  AI가 채널 분석을 바탕으로 생성한 독창적인 아이디어입니다. 가장 끌리는 것 1개를 선택하세요.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {ideas.map((idea, i) => {
                    const selected = selectedIdea === idea;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedIdea(idea)}
                        className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                          selected
                            ? 'bg-fuchsia-600/20 border-fuchsia-500/50 text-white shadow-md shadow-fuchsia-500/10'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5 transition-all ${
                          selected ? 'border-fuchsia-400 bg-fuchsia-500 text-white' : 'border-slate-600 text-slate-600'
                        }`}>
                          {selected ? <FontAwesomeIcon icon={faCheckCircle} /> : i + 1}
                        </span>
                        <span className="font-bold text-sm leading-relaxed">{idea}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedIdea && (
                  <div className="flex justify-center">
                    {isInjectingPrompt ? (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-fuchsia-400 text-2xl" />
                        <p className="text-slate-400 text-sm font-bold">대본 구조 준비 중...</p>
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateScript}
                        className="px-10 py-4 rounded-2xl font-black text-base text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:brightness-110 transition-all active:scale-95 shadow-2xl shadow-fuchsia-500/20 flex items-center gap-3"
                      >
                        <FontAwesomeIcon icon={faMagicWandSparkles} />
                        이 아이디어로 대본 만들기
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══ STEP 4: 대본 완성 ══ */}
            {step === 4 && (
              <div className="py-4">
                <h2 className="text-2xl font-black mb-2 text-center">
                  <span className="text-fuchsia-400">{isGeneratingScript ? '대본 작성 중' : '대본 완성'}</span>
                </h2>

                {isGeneratingScript && (
                  <div className="flex flex-col items-center gap-4 py-16">
                    <div className="relative w-14 h-14">
                      <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                      <div className="absolute inset-0 rounded-full border-4 border-t-fuchsia-500 border-r-indigo-500 border-b-transparent border-l-transparent animate-spin" />
                    </div>
                    <p className="text-slate-400 text-sm font-bold">AI가 대본을 작성하고 있습니다...</p>
                    <p className="text-slate-600 text-xs">3,000자 ~ 5,000자 분량</p>
                  </div>
                )}

                {script && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-fuchsia-950/40 border border-fuchsia-500/30 rounded-xl px-4 py-2">
                        <p className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-0.5">주제</p>
                        <p className="text-sm font-bold text-white">{selectedIdea}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {scenes.length}씬 · {scenes.join('').replace(/\s/g, '').length}자
                        </span>
                        <button
                          onClick={handleCopy}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                            copied
                              ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                          }`}
                        >
                          <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                          {copied ? '복사됨' : '복사'}
                        </button>
                      </div>
                    </div>

                    {/* 씬 카드 목록 */}
                    <div className="space-y-3 mb-6">
                      {scenes.map((scene, i) => {
                        const isEditing = editingIdx === i;
                        return (
                          <div key={i} className={`rounded-2xl border overflow-hidden flex transition-all ${isEditing ? 'border-indigo-400 shadow-lg shadow-indigo-500/10' : 'border-gray-200 bg-[#F9F8F6]'}`}>
                            <div className={`w-14 shrink-0 flex flex-col items-center justify-center py-4 gap-1 ${isEditing ? 'bg-indigo-600' : 'bg-[#3D405B]'}`}>
                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">씬</span>
                              <span className="text-xl font-black text-white">{i + 1}</span>
                            </div>
                            <div className="flex-1 p-4">
                              {isEditing ? (
                                <>
                                  <textarea
                                    value={editingText}
                                    onChange={e => setEditingText(e.target.value)}
                                    rows={Math.max(4, editingText.split('\n').length + 1)}
                                    className="w-full text-sm text-[#3D405B] leading-relaxed bg-white border border-indigo-300 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                  />
                                  <div className="flex gap-2 mt-2 justify-end items-center">
                                    <span className="text-[10px] text-slate-400 font-medium mr-auto">{editingText.replace(/\s/g, '').length}자</span>
                                    <button
                                      onClick={() => setEditingIdx(null)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-black text-slate-500 bg-gray-100 hover:bg-gray-200 transition-all"
                                    >취소</button>
                                    <button
                                      onClick={() => {
                                        const next = [...scenes];
                                        next[i] = editingText;
                                        setScenes(next);
                                        setEditingIdx(null);
                                      }}
                                      className="px-3 py-1.5 rounded-lg text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 transition-all"
                                    >저장</button>
                                  </div>
                                </>
                              ) : (
                                <div className="flex justify-between items-start gap-3">
                                  <p className="text-sm text-[#3D405B] leading-relaxed whitespace-pre-wrap flex-1">{scene.trim()}</p>
                                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                                    <button
                                      onClick={() => { setEditingIdx(i); setEditingText(scene.trim()); }}
                                      className="px-2.5 py-1 rounded-lg text-[11px] font-black text-slate-400 bg-white border border-gray-200 hover:text-indigo-600 hover:border-indigo-300 transition-all"
                                    >수정</button>
                                    <span className="text-[10px] text-slate-400 font-medium">{scene.replace(/\s/g, '').length}자</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => { setSelectedIdea(''); setStep(3); }}
                        className="px-6 py-3 rounded-xl font-black text-sm text-slate-400 bg-white/5 border border-white/10 hover:text-white hover:border-white/20 transition-all"
                      >
                        다른 아이디어 선택
                      </button>
                      <button
                        onClick={() => {
                          sessionStorage.setItem('oh1_script_data', JSON.stringify({
                            scenes,
                            analysis,
                            idea: selectedIdea,
                            channelName,
                          }));
                          window.location.href = '/team/oh-2';
                        }}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base text-white bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:brightness-110 transition-all active:scale-95 shadow-2xl shadow-fuchsia-500/20"
                      >
                        <FontAwesomeIcon icon={faArrowRight} />
                        다음 단계: OH-2
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </section>
      </main>

      <p className="text-center mt-12 text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]">
        AI 채널 분석 · TEAM OH-1
      </p>
    </div>
  );
}
