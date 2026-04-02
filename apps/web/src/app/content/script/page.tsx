'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight, faFlask, faBrain,
  faRocket, faMagicWandSparkles,
  faCheckCircle, faSpinner, faCircle,
  faCopy, faCheck, faArrowRight,
  faVolumeUp, faFileAlt, faLightbulb,
  faPlay, faUpload, faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import Aurora from '@/components/Aurora';

const API = process.env.NEXT_PUBLIC_API_URL;

// ── 떡상 점수 계산 (crawling/channel 동일 공식) ───────────────────────────────
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

// ── 경제학 프롬프트 템플릿 ────────────────────────────────────────────────────
const SCRIPT_PROMPT_TEMPLATE = (idea: string, analysis: any, name: string) => `
분석된 채널의 핵심 특성:
- 틈새시장: ${analysis?.niche || ''}
- 타겟 시청자: ${analysis?.target || ''}
- 검증된 훅 패턴: ${analysis?.hook || ''}
- 제목 공식: ${analysis?.title_pattern || ''}

위 채널 특성을 완전히 반영해서 아래 제목으로 유튜브 대본을 써줘: "${idea}"

⚠️ 출력 형식 규칙 (반드시 준수):
- 대본은 반드시 [씬1], [씬2], ... 형식으로 씬을 구분해서 작성해.
- 각 씬은 [씬N] 태그로 시작하고, 씬 내용만 작성해. 제목이나 설명 줄은 넣지 마.
- 씬 개수는 10~20개로 구성해.
- [씬N] 태그 외 다른 마크다운(**, ##, --- 등)은 절대 사용하지 마.
- 각 씬 내용 끝에 반드시 [장면힌트: ...] 태그를 1개 추가해. 그 씬을 대표하는 구체적인 시각 이미지를 한 줄로 묘사해. 예: [장면힌트: 빈 지갑을 쥔 노인 손, 낡은 단칸방 창문], [장면힌트: 오르는 물가 그래프 앞에 선 직장인], [장면힌트: 화면 가득 채운 연금 수령액 숫자]

씬 단위 원칙 (가장 중요):
- 씬 1개 = 2~3문장. 반드시 완결된 문장으로 끝낼 것 (문장 중간에서 씬을 자르지 말 것).
- 씬 1개의 길이: 공백 포함 200자 이내, 절대 300자 초과 금지.
- 한 씬에 여러 포인트를 우겨넣지 말 것. 1씬 = 1메시지.

씬 구성 예시:
[씬1] 오프닝 훅 — 1~2문장. 훅 공식 중 하나:
  A) 충격 통계형  — "한국인 노인 빈곤율 세계 1위, 그 주인공이 당신일 수도 있어."
  B) 반전 질문형  — "국민연금 꼬박꼬박 냈는데, 왜 은퇴 후에 더 가난해질까?"
  C) 공포 시나리오형 — "지금 이 순간 아무것도 안 바꾸면, 70살의 당신은 새벽 5시에 첫차를 타고 있을 거야."
  D) 금기 폭로형  — "아무도 말 안 해줬지? 월급 300에서 국민연금 빼면 노후 준비가 0이라는 거."
[씬2] 도입부 — "내 이름은 ${name || '닉'}이야. 만약 네가 [시청자의 고민] 때문에 힘들다면 구독 눌러줘."
[씬3~N-1] 본론 — 각 씬마다 핵심 포인트 1개씩. 통계·비유·수치로 짧고 강렬하게.
[씬N] 마무리 — 핵심 요약 1문장 + 구독/좋아요 유도 1문장.

💡 스타일 가이드:
- 친구랑 말하듯이 자연스럽게 써. ('사실 말이야...', '자 봐봐', '음' 같은 표현 활용)
- 영상 초반에 사람들이 흔히 믿는 상식을 깨부숴줘.
- 신뢰할 수 있는 출처의 놀라운 통계 수치나 데이터를 넣어줘.
- 구체적인 수치와 계산 예시로 실감나게 보여줘.
- 어려운 개념은 쉬운 비유를 들어서 설명해.

📋 콘텐츠 요구사항:
- 분량: 3~5분 영상에 맞는 길이
- 중요한 포인트는 스토리텔링으로 풀어줘.
- 마지막엔 강력한 동기부여와 함께 구독/좋아요를 유도하며 끝내줘.

🎭 말투: 권위는 있지만 친근하게. 사람들이 자주 하는 실수에 답답해하면서도 진심으로 시청자를 걱정하는 느낌.
`.trim();

// ── Step Icons ────────────────────────────────────────────────────────────────
const STEP_ICONS = [faYoutube, faBrain, faLightbulb, faFileAlt] as const;

// ── Progress Step ─────────────────────────────────────────────────────────────
function ProgressStep({ label, state }: { label: string; state: 'wait' | 'running' | 'done' }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
      state === 'done'    ? 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300'
      : state === 'running' ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
      : 'bg-white/5 border-white/10 text-slate-600'
    }`}>
      <FontAwesomeIcon
        icon={state === 'done' ? faCheckCircle : state === 'running' ? faSpinner : faCircle}
        className={`text-sm shrink-0 ${state === 'running' ? 'animate-spin' : ''}`}
      />
      <span className="text-sm font-black">{label}</span>
    </div>
  );
}

// ── Analysis Card ─────────────────────────────────────────────────────────────
function AnalysisCard({ icon, label, badge, content, bg }: {
  icon: string; label: string; badge: string; content: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 hover:shadow-md transition-all">
      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center text-xl shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-black text-[#3D405B]">{label}</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${bg} text-[#3D405B]/70`}>{badge}</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{content || '—'}</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function NotebookLMVideoPage() {
  const [step, setStep] = React.useState(1);

  // Step 1
  const [url, setUrl] = React.useState('');
  const [channelName, setChannelName] = React.useState('');
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
      // 1단계: 키워드 매칭으로 즉시 분류 (API 키 불필요)
      const combined = `${file.name} ${text}`;
      const kwMatch = classifyByKeyword(combined);
      if (kwMatch) {
        setDetectedNiche(kwMatch.niche);
        setTargetNotebookId(kwMatch.notebook_id);
        setTargetNotebookName(kwMatch.notebook_name);
      }
      // 2단계: Gemini로 정밀 분류 (API 키 있을 때 보강)
      const apiKey = localStorage.getItem('ld_google_api_key') ?? '';
      if (apiKey) classifySource(file.name, text.slice(0, 800));
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // 노트앱 분류
  const DEFAULT_NOTEBOOK_ID = '85362656-b5a6-4672-a874-619b99fc55e5';

  // 프론트 키워드 매칭 (API 키 없어도 즉시 분류)
  const NICHE_KEYWORDS: { niche: string; notebook_id: string; notebook_name: string; keywords: string[] }[] = [
    { niche: '건강·의학',     notebook_id: '9d3c21fe-e9e5-41a8-8c67-eed5090f799a', notebook_name: '[LD] 건강·의학',     keywords: ['다이어트','운동','건강','의학','질병','병원','약','칼로리','근육','체중','헬스','영양','비만','혈압','당뇨','암','치료','증상','의사','수술','면역','통증','수면','스트레스','식단','혈당'] },
    { niche: '부동산·투자',   notebook_id: 'a8891e02-4fc9-4593-8fc7-fb13333ea6a7', notebook_name: '[LD] 부동산·투자',   keywords: ['아파트','청약','임대','토지','전세','월세','부동산','집값','분양','재건축','재개발','투자','수익률','갭투자','건물','상가','경매'] },
    { niche: '자기계발·심리', notebook_id: '6a6dee66-1811-4939-80cc-4ab57f50810b', notebook_name: '[LD] 자기계발·심리', keywords: ['습관','독서','생산성','심리','자기계발','뇌','집중력','동기','목표','성공','루틴','시간관리','마인드','인간관계','감정','멘탈','공부','학습','인문학'] },
    { niche: '웹소설',        notebook_id: 'a879a2d9-8cb2-4182-b14a-b04dcc49d448', notebook_name: '[LD] 웹소설',        keywords: ['웹소설','로맨스','판타지','소설','회귀','이세계','헌터','마법','용사','추천','리뷰','장르','주인공','악녀','빙의'] },
    { niche: '경제·재테크',   notebook_id: '85362656-b5a6-4672-a874-619b99fc55e5', notebook_name: '[LD] 경제·재테크',   keywords: ['주식','ETF','절약','월급','경제','금리','인플레이션','재테크','적금','펀드','코인','비트코인','연금','세금','부채','대출','금융','돈','수입','지출','저축','배당'] },
  ];

  function classifyByKeyword(text: string): typeof NICHE_KEYWORDS[0] | null {
    const lower = text.toLowerCase();
    let best: typeof NICHE_KEYWORDS[0] | null = null;
    let bestCount = 0;
    for (const entry of NICHE_KEYWORDS) {
      const count = entry.keywords.filter(kw => lower.includes(kw)).length;
      if (count > bestCount) { bestCount = count; best = entry; }
    }
    return bestCount >= 1 ? best : null;
  }
  type NotebookOption = { niche: string; notebook_id: string; notebook_name: string };
  const [notebookOptions, setNotebookOptions]   = React.useState<NotebookOption[]>([]);
  const [detectedNiche, setDetectedNiche]       = React.useState('경제·재테크');
  const [targetNotebookId, setTargetNotebookId] = React.useState(DEFAULT_NOTEBOOK_ID);
  const [targetNotebookName, setTargetNotebookName] = React.useState('[LD] 경제·재테크');
  const [isClassifying, setIsClassifying]       = React.useState(false);

  // 노트앱 목록 최초 1회 로드
  React.useEffect(() => {
    fetch(`${API}/nlm-video/notebooks`)
      .then(r => r.json())
      .then(d => { if (d.success) setNotebookOptions(d.notebooks); })
      .catch(() => {});
  }, []);

  const classifySource = React.useCallback(async (title: string, snippet: string) => {
    setIsClassifying(true);
    try {
      const apiKey = localStorage.getItem('ld_google_api_key') ?? '';
      const res = await fetch(`${API}/nlm-video/classify-source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text_snippet: snippet, api_key: apiKey }),
      });
      if (res.ok) {
        const data = await res.json();
        setDetectedNiche(data.niche);
        setTargetNotebookId(data.notebook_id);
        setTargetNotebookName(data.notebook_name);
      }
    } catch { /* 실패 시 기본값 유지 */ }
    finally { setIsClassifying(false); }
  }, []);

  // Step 2
  const [nlmState, setNlmState] = React.useState<'wait' | 'running' | 'done'>('wait');
  const [notebookId, setNotebookId] = React.useState('');
  const [step2Error, setStep2Error] = React.useState('');

  // Step 3
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<any>(null);

  // Step 4
  const [isGeneratingIdeas, setIsGeneratingIdeas] = React.useState(false);
  const [ideas, setIdeas] = React.useState<string[]>([]);
  const [selectedIdea, setSelectedIdea] = React.useState('');

  // Step 5
  const [isInjectingPrompt, setIsInjectingPrompt] = React.useState(false);

  // Step 6
  const [isGeneratingScript, setIsGeneratingScript] = React.useState(false);
  const [script, setScript] = React.useState('');
  const [scenes, setScenes] = React.useState<string[]>([]);
  const [editingIdx, setEditingIdx] = React.useState<number | null>(null);
  const [editingText, setEditingText] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  // ── Tab indicator ─────────────────────────────────────────────────────────────
  const tabsNavRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 });

  const updateIndicator = React.useCallback((idx: number) => {
    const tab = tabRefs.current[idx - 1];
    const nav = tabsNavRef.current;
    if (!tab || !nav) return;
    const tabRect = tab.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    setIndicatorStyle({ left: tabRect.left - navRect.left + nav.scrollLeft, width: tabRect.width });
  }, []);

  React.useEffect(() => { updateIndicator(step); }, [step, updateIndicator]);
  React.useEffect(() => {
    const obs = new ResizeObserver(() => updateIndicator(step));
    if (tabsNavRef.current) obs.observe(tabsNavRef.current);
    return () => obs.disconnect();
  }, [step, updateIndicator]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

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
          // 바이럴 점수 높은 순 정렬
          const sorted = [...data.videos].sort((a: any, b: any) =>
            calcViralScore(b) - calcViralScore(a)
          );
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
    setNlmState('running');
    setAnalysis(null);

    const timeout = (ms: number) => new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('분석 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.')), ms)
    );

    try {
      // 1. URL → NLM 주입 (SRT 있으면 text_content 우선 사용)
      const nlmBody: any = {
        notebook_name: srtText && !video
          ? `SRT 직접 분석 — ${srtFileName || '자막파일'}`
          : `벤치마킹 — ${video?.title?.slice(0, 30) || '채널분석'}`,
        existing_notebook_id: targetNotebookId,
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

      // 2. 자동 분석
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
      const ana = anaData.analysis;
      setAnalysis(ana);
      setNlmState('done');

      // 분석 완료 즉시 아이디어 생성
      setIsGeneratingIdeas(true);
      const ideasRes = await Promise.race([
        fetch(`${API}/nlm-video/generate-ideas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notebook_id: nbId,
            analysis: ana,
            count: 20,
            raw_content: srtText ? srtText.slice(0, 800) : '',
            video_title: video?.title || srtFileName || '',
          }),
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
      setNlmState('wait');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleAnalyze = async () => {
    if (!notebookId || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch(`${API}/nlm-video/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebook_id: notebookId }),
      });
      const data = await res.json();
      if (data.success) setAnalysis(data.analysis);
      else alert('분석 실패: ' + data.detail);
    } catch (e: any) {
      alert('분석 실패: ' + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!notebookId || isGeneratingIdeas) return;
    setIsGeneratingIdeas(true);
    setIdeas([]);
    setSelectedIdea('');
    try {
      const res = await fetch(`${API}/nlm-video/generate-ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebook_id: notebookId,
          analysis: analysis,
          count: 20,
          raw_content: srtText ? srtText.slice(0, 800) : '',
          video_title: videos[selectedVideoIdx ?? 0]?.title || srtFileName || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIdeas(data.ideas || []);
        setStep(4);
      } else {
        alert('아이디어 생성 실패: ' + data.detail);
      }
    } catch (e: any) {
      alert('아이디어 생성 실패: ' + e.message);
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
        body: JSON.stringify({
          notebook_id: notebookId,
          idea: selectedIdea,
          prompt,
        }),
      });
      const scriptData = await scriptRes.json();
      if (scriptData.success) {
        const raw = scriptData.script || '';
        setScript(raw);
        // [씬N] 마커 기준 추출 → 번호순 정렬, 폴백: 문장 단위 분리
        const matches = [...raw.matchAll(/\[씬\s*(\d+)\]([\s\S]*?)(?=\[씬\s*\d+\]|$)/g)];
        const markerScenes = matches
          .map(m => ({ num: parseInt(m[1], 10), text: `[씬${m[1]}]${m[2].trim()}` }))
          .filter(s => s.text.replace(`[씬${s.num}]`, '').trim().length > 0)
          .sort((a, b) => a.num - b.num)
          .map(s => s.text);
        const newScenes = markerScenes.length >= 2
          ? markerScenes
          : raw.split(/\n(?=[가-힣A-Z"'"\[])/).map((s: string) => s.trim()).filter((s: string) => s.length > 10);
        setScenes(newScenes);
        // 새 대본 고유 ID 발급 — voice-dubbing TTS 캐시 무효화 기준
        localStorage.setItem('ld_script_id', crypto.randomUUID());
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

  const formatViews = (n: number) => {
    if (!n) return '';
    if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
    return n.toLocaleString();
  };

  // ── Step done 조건 ────────────────────────────────────────────────────────────
  const step1Done = selectedVideoIdx !== null && nlmState !== 'running';
  const step2Done = nlmState === 'done';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white font-sans antialiased pb-20">

      {/* 배경 블롭 */}
      <div className="lg-scene">
        <div className="lg-blob lg-blob-1" />
        <div className="lg-blob lg-blob-2" />
        <div className="lg-blob lg-blob-3" />
      </div>

      {/* Header */}
      <header className="relative pt-12 pb-24 px-6 overflow-hidden bg-[#0f0f1a]">
        <div className="absolute inset-0">
          <Aurora colorStops={['#3b0764', '#7c3aed', '#1e1b4b']} amplitude={1.2} blend={0.6} speed={2.2} yOffset={0.35} />
        </div>
        <div className="absolute inset-0 bg-[#0f0f1a]/50" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
            <span className="text-fuchsia-200 text-[10px] font-black uppercase tracking-[0.2em]">채널 벤치마킹 → 대본 즉시 생산</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/20 shrink-0">
              <FontAwesomeIcon icon={faBrain} className="text-lg text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">
              채널 벤치마킹 <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-500 bg-clip-text text-transparent">× 대본 생산</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm mb-6">경쟁 채널 영상 1개 선택 → AI 심층 분석 → 대본 즉시 생성</p>

          {/* Tabs Pro 스타일 탭 네비게이션 */}
          <div
            ref={tabsNavRef}
            className="relative flex gap-1 p-2 rounded-2xl overflow-x-auto scrollbar-none"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          >
            {/* 슬라이딩 인디케이터 */}
            <div
              className="absolute top-2 bottom-2 rounded-xl pointer-events-none transition-all duration-500"
              style={{
                transform: `translateX(${indicatorStyle.left}px)`,
                width: indicatorStyle.width,
                background: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)',
                boxShadow: '0 4px 24px rgba(34,211,238,0.4), 0 0 48px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                zIndex: 1,
              }}
              aria-hidden="true"
            />
            {([
              { s: 1, label: '영상 선택',     icon: STEP_ICONS[0], done: step1Done },
              { s: 2, label: 'AI 분석 중',   icon: STEP_ICONS[1], done: step2Done },
              { s: 3, label: '아이디어 선택', icon: STEP_ICONS[2], done: !!selectedIdea },
              { s: 4, label: '대본 완성',     icon: STEP_ICONS[3], done: !!script },
            ] as const).map(({ s, label, icon, done }, i) => {
              const active = step === s;
              return (
                <button
                  key={s}
                  ref={el => { tabRefs.current[i] = el; }}
                  onClick={() => step >= s && setStep(s)}
                  disabled={step < s}
                  className="relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 whitespace-nowrap disabled:opacity-40"
                  style={{
                    zIndex: 2,
                    color: active ? '#080810' : done ? '#34d399' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <FontAwesomeIcon icon={done && !active ? faCheckCircle : icon} className="text-sm shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{s}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
        <section className="rounded-[2rem] p-8 overflow-hidden relative" style={{ background: 'rgba(15,15,26,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
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

                {/* 1열·2열·3열 — 단일 max-w-2xl 컨테이너로 너비 통일 */}
                <div className="w-full max-w-2xl flex flex-col gap-3 mb-4">

                  {/* 1열: 채널명 50% + 노트앱 분류 50% */}
                  <div className="flex gap-3 items-stretch">
                    {/* 채널명 */}
                    <div className="flex-1 min-w-0 bg-white/5 border border-white/10 px-5 py-3.5 rounded-[1.5rem] flex items-center gap-3 focus-within:border-fuchsia-500/50 transition-all">
                      <span className="text-slate-500 text-sm font-black shrink-0">내 채널명</span>
                      <input
                        type="text"
                        value={channelName}
                        onChange={e => setChannelName(e.target.value)}
                        placeholder="예: 닉, 머니튜브 ..."
                        className="flex-grow bg-transparent text-white placeholder:text-slate-700 focus:outline-none font-bold text-sm min-w-0"
                      />
                    </div>
                    {/* 카테고리 분류 — Liquid Glass */}
                    <div className="lg-glass flex-1 min-w-0 flex items-center gap-2 px-4 py-3.5 rounded-[1.5rem]">
                      {isClassifying ? (
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-indigo-300 text-xs shrink-0" />
                      ) : (
                        <span className="text-indigo-300 text-xs shrink-0">📂</span>
                      )}
                      <span className="text-white/70 text-[11px] font-black shrink-0 tracking-wide">
                        {isClassifying ? '분류 중...' : '카테고리'}
                      </span>
                      {!isClassifying && notebookOptions.length > 0 && (
                        <select
                          value={targetNotebookId}
                          onChange={e => {
                            const opt = notebookOptions.find(o => o.notebook_id === e.target.value);
                            if (opt) {
                              setTargetNotebookId(opt.notebook_id);
                              setTargetNotebookName(opt.notebook_name);
                              setDetectedNiche(opt.niche);
                            }
                          }}
                          className="flex-1 min-w-0 bg-white/10 border border-white/20 text-white text-[11px] font-black rounded-xl px-2.5 py-1 focus:outline-none focus:border-white/40 focus:bg-white/15 cursor-pointer transition-all backdrop-blur-sm"
                          style={{ WebkitAppearance: 'none', appearance: 'none' }}
                        >
                          {notebookOptions.map(opt => (
                            <option key={opt.notebook_id} value={opt.notebook_id} className="bg-slate-900 text-white">
                              {opt.niche === detectedNiche ? `✓ ${opt.niche}` : opt.niche}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* 2열: URL 입력 + 영상수집 + 영상분석시작 */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/5 border border-white/10 pl-4 pr-1.5 py-3.5 rounded-[1.5rem] flex items-center gap-2 focus-within:border-fuchsia-500/50 transition-all">
                      <FontAwesomeIcon icon={faYoutube} className="text-xl text-red-500 shrink-0" />
                      <input
                        type="text" value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                        placeholder="벤치마킹할 채널 URL 입력 (내가 만들 채널과 같은 장르)"
                        className="flex-grow bg-transparent py-0 text-white placeholder:text-slate-700 focus:outline-none font-bold text-sm"
                      />
                      <button
                        onClick={handleUrlSubmit} disabled={isResolving}
                        className="px-4 py-2 rounded-[0.8rem] font-black text-[11px] text-white bg-red-700 hover:bg-red-600 border border-red-500/40 disabled:opacity-50 transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
                      >
                        {isResolving
                          ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1.5" />수집 중...</>
                          : <><FontAwesomeIcon icon={faYoutube} />영상 수집</>}
                      </button>
                    </div>
                    <button
                      onClick={handleStartAnalysis}
                      disabled={selectedVideoIdx === null && !srtText}
                      className="lg-btn lg-btn-fuchsia w-36 justify-center py-3.5 rounded-[1rem] font-black text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed shrink-0 flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faBrain} />
                      영상 분석 시작
                    </button>
                  </div>

                  {/* 3열: SRT 업로드 + SRT 확보 방법 */}
                  <div className="flex items-center gap-2">
                    <input ref={srtInputRef} type="file" accept=".srt,.txt" className="hidden" onChange={handleSrtUpload} />
                    {srtFileName ? (
                      <div className="flex-1 min-w-0 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-[1.5rem] px-4 py-3.5">
                        <FontAwesomeIcon icon={faFileAlt} className="text-emerald-400 text-xs shrink-0" />
                        <span className="text-emerald-300 text-[11px] font-black flex-1 min-w-0 truncate">{srtFileName}</span>
                        <span className="text-emerald-500 text-[9px] font-black bg-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0">적용됨</span>
                        <button onClick={() => { setSrtText(''); setSrtFileName(''); }} className="text-slate-500 hover:text-red-400 transition-colors shrink-0">
                          <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => srtInputRef.current?.click()}
                        className="flex-1 flex items-center gap-1.5 bg-white/3 hover:bg-white/6 border border-dashed border-white/15 hover:border-fuchsia-500/40 rounded-[1.5rem] px-4 py-3.5 transition-all group"
                      >
                        <FontAwesomeIcon icon={faUpload} className="text-white/50 group-hover:text-fuchsia-400 text-xs transition-colors shrink-0" />
                        <span className="text-white/70 group-hover:text-white text-[11px] font-black transition-colors">SRT 자막 업로드 (선택 — 분석 정밀도 향상)</span>
                      </button>
                    )}
                    <button
                      onClick={() => window.open('/how-to-save-srt-files.html', '_blank')}
                      className="w-36 justify-center py-3.5 rounded-[1rem] bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 hover:text-indigo-300 text-[11px] font-black transition-all shrink-0 flex items-center gap-1.5"
                    >
                      <FontAwesomeIcon icon={faFileAlt} className="text-xs" />
                      SRT 확보 방법
                    </button>
                  </div>

                </div>

                {/* 영상 그리드 — 라디오 선택 */}
                {videos.length > 0 && (
                  <>
                    <div className="w-full flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        수집 완료 — <span className="text-fuchsia-400">{videos.length}개</span>
                        <span className="text-slate-600 ml-2">(조회수 높은 순)</span>
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
                            onClick={() => {
                              setSelectedVideoIdx(i);
                              classifySource(vid.title || '', vid.description?.slice(0, 300) || '');
                            }}
                            className={`relative rounded-xl overflow-hidden border text-left transition-all duration-200 group ${
                              selected
                                ? 'border-fuchsia-500 shadow-lg shadow-fuchsia-500/20 scale-[1.02]'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            {/* 썸네일 */}
                            <div className="relative aspect-video">
                              <img
                                src={vid.thumbnail_url} alt={vid.title}
                                className="w-full h-full object-cover"
                              />
                              {/* 바이럴 점수 뱃지 */}
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
                            {/* 정보 */}
                            <div className={`p-2.5 ${selected ? 'bg-fuchsia-950/50' : 'bg-white/5'}`}>
                              <p className="text-[11px] font-bold text-white line-clamp-2 mb-1 leading-snug">
                                {vid.title}
                              </p>
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

                    {/* 선택된 영상 정보 */}
                    {selectedVideoIdx !== null && (
                      <div className="w-full max-w-xl lg-glass rounded-2xl p-4 flex items-center gap-4" style={{ borderColor: 'rgba(217,70,239,0.35)' }}>
                        <img
                          src={videos[selectedVideoIdx].thumbnail_url}
                          className="w-20 h-12 rounded-lg object-cover shrink-0"
                          alt=""
                        />
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

            {/* ══ STEP 2: 분석 중 (펄스 스켈레톤) ══ */}
            {step === 2 && (
              <div className="py-4">
                {!step2Error ? (
                  <>
                    {/* 상태 레이블 */}
                    <div className="flex items-center gap-2 mb-6">
                      <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse shrink-0" />
                      <p className="text-sm font-black text-slate-400">
                        {isGeneratingIdeas ? 'AI가 아이디어를 생성하고 있습니다...' : 'AI가 영상을 분석하고 있습니다...'}
                      </p>
                    </div>

                    {/* 헤더 스켈레톤 */}
                    <div className="text-center mb-6 space-y-3">
                      <div className="h-5 w-36 bg-white/10 rounded-full animate-pulse mx-auto" />
                      <div className="h-8 w-64 bg-white/10 rounded-xl animate-pulse mx-auto" />
                    </div>

                    {/* 아이디어 리스트 스켈레톤 — 결과 화면과 동일한 레이아웃 */}
                    <div className="space-y-2">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.03] animate-pulse"
                          style={{ animationDelay: `${(i % 5) * 80}ms` }}
                        >
                          <div className="w-6 h-6 rounded-full bg-white/10 shrink-0" />
                          <div
                            className="h-4 rounded-lg bg-white/10"
                            style={{ width: `${55 + (i * 17) % 35}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-16">
                    <div className="w-full max-w-sm lg-glass rounded-xl p-4 text-red-300 text-sm font-bold text-center" style={{ borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)' }}>
                      ⚠ {step2Error}
                      <button
                        onClick={() => setStep(1)}
                        className="block mx-auto mt-3 text-xs text-slate-400 hover:text-white underline"
                      >
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
                        className="lg-btn lg-btn-fuchsia px-10 py-4 rounded-2xl font-black text-base text-white flex items-center gap-3"
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
                    {/* 아이디어 배지 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="lg-glass rounded-xl px-4 py-2" style={{ borderColor: 'rgba(217,70,239,0.3)' }}>
                        <p className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-0.5">주제</p>
                        <p className="text-sm font-bold text-white">{selectedIdea}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {scenes.length}씬 · {scenes.join('').replace(/\s/g, '').length}자
                        </span>
                        <button
                          onClick={handleCopy}
                          className={`lg-btn flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black ${
                            copied
                              ? 'text-emerald-400'
                              : 'lg-btn-ghost text-slate-400 hover:text-white'
                          }`}
                          style={copied ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)' } : {}}
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
                            {/* 씬 번호 */}
                            <div className={`w-14 shrink-0 flex flex-col items-center justify-center py-4 gap-1 ${isEditing ? 'bg-indigo-600' : 'bg-[#3D405B]'}`}>
                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">씬</span>
                              <span className="text-xl font-black text-white">{i + 1}</span>
                              {i === 0 && <span className="text-[7px] font-black text-amber-300 bg-amber-500/20 rounded px-1 py-0.5 leading-tight text-center">후크</span>}
                            </div>
                            {/* 씬 내용 */}
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
                        onClick={() => { setSelectedIdea(''); setIdeas([]); setStep(4); }}
                        className="lg-btn lg-btn-ghost px-6 py-3 rounded-xl font-black text-sm text-slate-400 hover:text-white"
                      >
                        다른 아이디어 선택
                      </button>
                      <button
                        onClick={() => {
                          // 대본 데이터 localStorage 저장 + 새 script_id 발급
                          localStorage.setItem('ld_script_id', crypto.randomUUID());
                          localStorage.setItem('ld_keyframe_data', JSON.stringify({
                            scenes,
                            analysis,
                            idea: selectedIdea,
                            channelName,
                          }));
                          window.location.href = '/content/keyframe1';
                        }}
                        className="lg-btn lg-btn-fuchsia flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base text-white"
                      >
                        <FontAwesomeIcon icon={faArrowRight} />
                        키프레임 제작으로 이동
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
        AI 채널 분석 · LinkDrop V2
      </p>
    </div>
  );
}
