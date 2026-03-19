'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faVideo, faMicrophone, faMagic, faCloudUploadAlt,
  faCheckCircle, faSync, faChevronRight, faArrowLeft,
  faHeartbeat, faChartLine, faQuoteRight,
  faMars, faVenus, faVolumeUp, faTriangleExclamation,
  faBolt, faRocket, faBook, faHashtag, faLeaf, faCog,
  faLaptopCode, faPenToSquare, faRotate, faSpinner,
  faTrophy, faBookOpen, faCircleQuestion, faScaleBalanced,
  faUserDoctor, faArrowRightArrowLeft, faPalette,
  faRobot, faKeyboard, faFileUpload, faFileAlt,
  faUsers, faExpand, faFont, faClock, faArrowUpRightFromSquare,
  faChevronDown, faShieldHalved, faDownload,
} from '@fortawesome/free-solid-svg-icons';
import longformData from '@/data/content_longform.json';
import disclosure from '@/data/longform_disclosure.json';

// ── 타입 ─────────────────────────────────────────────────────────────────────
interface Template {
  id: string; title: string; icon: any; bgImage: string;
  color: string; category: 'vault' | 'content'; notebookId: string;
}
interface ArtStyle {
  id: string; label: string; desc: string;
  bgImage: string; notebooklmPrompt: string;
}
interface Style {
  id: string; icon: any; label: string; desc: string; example: string;
  directive: string;
}
interface Voice {
  id: string; name: string; gender: 'MALE' | 'FEMALE';
  type: 'Neural2' | 'Wavenet' | 'Standard'; previewUrl: string;
}
interface Emotion {
  id: string; label: string; desc: string; emoji: string;
}
interface Tone {
  id: string; label: string; desc: string;
}
interface ScenarioCard {
  index: number; script: string; preview: string; loading: boolean;
}
interface VideoSlot {
  id: number;
  status: 'pending' | 'processing' | 'uploading' | 'completed' | 'error';
  progress: number; sceneText?: string; keyframePath?: string;
}
type PipelineEvent =
  | { type: 'step';     step: number; message: string }
  | { type: 'init';     clip_count: number; estimated_sec: number }
  | { type: 'progress'; clip_id: number; state: string; progress: number; scene_text: string; keyframe?: string }
  | { type: 'done';     url_16x9: string; url_9x16: string }
  | { type: 'error';    message: string };

// ── 상수 ─────────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, any> = {
  faHeartbeat, faChartLine, faLaptopCode, faQuoteRight, faLeaf,
  faBolt, faHashtag, faBook, faVideo, faRocket, faCog,
};
const STATE_MAP: Record<string, VideoSlot['status']> = {
  rendering: 'processing', uploading: 'uploading',
  done: 'completed', failed: 'error',
};
const DEFAULT_SLOTS: VideoSlot[] = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1, status: 'pending', progress: 0,
}));

// ── 데이터 ───────────────────────────────────────────────────────────────────
const ICON_MAP_STYLE: Record<string, any> = {
  faTrophy, faBookOpen, faCircleQuestion, faScaleBalanced, faUserDoctor, faArrowRightArrowLeft,
};

const TEMPLATES: Template[] = longformData.templates.map(t => ({
  ...t, icon: ICON_MAP[t.icon] || faVideo,
  category: t.category as 'vault' | 'content',
}));
const TEMPLATES_VAULT   = TEMPLATES.filter(t => t.category === 'vault');
const TEMPLATES_CONTENT = TEMPLATES.filter(t => t.category === 'content');
const VOICES: Voice[]   = longformData.voices as Voice[];

const ART_STYLES: ArtStyle[] = longformData.artStyles as ArtStyle[];
const EMOTIONS: Emotion[]   = longformData.emotions as Emotion[];
const TONES: Tone[]         = longformData.tones as Tone[];

const STYLES: Style[] = longformData.narrativeStyles.map(s => ({
  ...s, icon: ICON_MAP_STYLE[s.icon] || faMagic,
}));

// ── 탭 헤더 ───────────────────────────────────────────────────────────────────
function StepTab({ step, label, current, unlocked, onClick }: {
  step: number; label: string; current: number; unlocked: boolean; onClick: () => void;
}) {
  const active = current === step;
  const past   = unlocked && current > step;
  return (
    <button
      onClick={onClick}
      disabled={!unlocked && !active}
      className={`relative flex items-center gap-2.5 px-5 py-4 border-b-2 font-black text-[13px] tracking-wide whitespace-nowrap transition-all duration-300 ${
        active ? 'border-fuchsia-500 text-white'
        : past  ? 'border-emerald-600/70 text-emerald-400 hover:text-emerald-300'
        : 'border-transparent text-slate-600 cursor-default'
      }`}
    >
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
        active ? 'bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/30'
        : past  ? 'bg-emerald-600 text-white'
        : 'bg-slate-800 text-slate-600'
      }`}>
        {past ? <FontAwesomeIcon icon={faCheckCircle} size="xs" /> : step}
      </span>
      {label}
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500" />}
    </button>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
export default function LongformPage() {
  const [step, setStep] = useState(1);

  // Step 1
  const [template, setTemplate]     = useState<Template | null>(null);
  const [artStyle, setArtStyle]     = useState<ArtStyle | null>(null);
  const [emotion, setEmotion]       = useState<Emotion | null>(null);
  const [tone, setTone]             = useState<Tone | null>(null);

  // Step 2
  const [inputMode, setInputMode] = useState<'ai' | 'manual'>('ai');
  const [style, setStyle]         = useState<Style | null>(null);
  const [topic, setTopic]         = useState('');
  const [scenarios, setScenarios] = useState<ScenarioCard[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [scenariosDone, setScenariosDone]       = useState(false);
  const [selectedIdx, setSelectedIdx]   = useState<number | null>(null);
  const [editedScript, setEditedScript] = useState('');
  const [manualScript, setManualScript] = useState('');
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [voice, setVoice]         = useState<Voice>(VOICES[0]);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ttsSpeed, setTtsSpeed]   = useState<number>(1.2);
  const [textStyle, setTextStyle] = useState<'box' | 'outline'>('box');
  const editTextareaRef  = useRef<HTMLTextAreaElement | null>(null);
  const manualTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(el.scrollHeight, 400) + 'px';
  };
  useEffect(() => autoResize(editTextareaRef.current), [editedScript]);
  useEffect(() => autoResize(manualTextareaRef.current), [manualScript]);

  // Step 3
  const [slots, setSlots]               = useState<VideoSlot[]>(DEFAULT_SLOTS);
  const [running, setRunning]           = useState(false);
  const [stepMsg, setStepMsg]           = useState('');
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [finalUrl16x9, setFinalUrl16x9] = useState<string | null>(null);
  const [finalUrl9x16, setFinalUrl9x16] = useState<string | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [desktopAlive, setDesktopAlive] = useState<boolean | null>(null); // null=미확인, true=연결, false=끊김
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 데스크톱 앱 헬스체크 (3초마다) ─────────────────────────────────────
  useEffect(() => {
    let alive = false;
    const check = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      try {
        const r = await fetch('http://localhost:7788/health', {
          signal: controller.signal,
          mode: 'cors',
          cache: 'no-store',
        });
        clearTimeout(timer);
        alive = r.ok;
      } catch {
        clearTimeout(timer);
        alive = false;
      }
      setDesktopAlive(alive);
    };
    check();
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, []);

  // ── 폴링 정리 (언마운트 / 페이지 이탈 시) ─────────────────────────────
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ── Opal 세션 타이머 ─────────────────────────────────────────────────────
  const OPAL_SESSION_SEC = 3600; // 1시간
  const OPAL_APP_URL = 'https://opal.google/edit/1YQTJjGO0VnQN5U38CE6hHNIhbcindUXt';
  const [opalSecondsLeft, setOpalSecondsLeft] = useState(OPAL_SESSION_SEC);
  useEffect(() => {
    const id = setInterval(() => setOpalSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const resetOpalSession = () => {
    setOpalSecondsLeft(OPAL_SESSION_SEC);
    window.open(OPAL_APP_URL, '_blank', 'noopener,noreferrer');
  };
  const opalMins = Math.floor(opalSecondsLeft / 60);
  const opalSecs = opalSecondsLeft % 60;
  const opalTimerColor =
    opalSecondsLeft > 1800 ? 'text-emerald-400' :
    opalSecondsLeft > 600  ? 'text-amber-400'   : 'text-red-400';
  const opalRingColor =
    opalSecondsLeft > 1800 ? 'stroke-emerald-500' :
    opalSecondsLeft > 600  ? 'stroke-amber-500'   : 'stroke-red-500';
  const opalProgress = opalSecondsLeft / OPAL_SESSION_SEC; // 1.0 → 0.0
  const [opalExpanded, setOpalExpanded] = useState(false);

  // ── 동의 모달 ─────────────────────────────────────────────────────────────
  const LS_KEY = `ld_longform_agreed_v${disclosure.agreement.versionKey}`;
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [disclosureChecked, setDisclosureChecked] = useState(false);
  const [disclosureSubmitting, setDisclosureSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const agreed = localStorage.getItem(LS_KEY);
    if (!agreed) setShowDisclosure(true);
  }, []);

  const handleAgree = async () => {
    if (!disclosureChecked || disclosureSubmitting) return;
    setDisclosureSubmitting(true);
    try {
      let sessionKey = localStorage.getItem('ld_session_key');
      if (!sessionKey) {
        sessionKey = crypto.randomUUID();
        localStorage.setItem('ld_session_key', sessionKey);
      }
      await fetch('/api/longform/agree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_key: sessionKey,
          disclosure_version: disclosure.agreement.versionKey,
        }),
      });
      localStorage.setItem(LS_KEY, new Date().toISOString());
      setShowDisclosure(false);
    } catch {
      // 네트워크 오류여도 로컬 동의는 처리
      localStorage.setItem(LS_KEY, new Date().toISOString());
      setShowDisclosure(false);
    } finally {
      setDisclosureSubmitting(false);
    }
  };

  // ── 시나리오 3개 병렬 생성 (SSE) ────────────────────────────────────────
  const generateScenarios = async (tmpl: Template, sty: Style, customTopic?: string, art?: ArtStyle | null) => {
    const useTopic  = (customTopic ?? topic).trim() || tmpl.title;
    const useArt    = art ?? artStyle;
    setScenariosLoading(true);
    setScenariosDone(false);
    setSelectedIdx(null);
    setEditedScript('');
    setScenarios([
      { index: 0, script: '', preview: '', loading: true },
      { index: 1, script: '', preview: '', loading: true },
      { index: 2, script: '', preview: '', loading: true },
    ]);

    try {
      const res = await fetch('/api/longform/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id:     tmpl.id,
          topic:      useTopic,
          style:      sty.id,
          voice:      voice.id,
          tts_speed:  ttsSpeed,
          art_prompt: useArt?.notebooklmPrompt ?? '',
          tone_id:    tone?.id ?? null,
          tone_desc:  tone ? `${tone.label} — ${tone.desc}` : null,
          emotion_id: emotion?.id ?? null,
          emotion_desc: emotion ? `${emotion.emoji} ${emotion.label} — ${emotion.desc}` : null,
        }),
      });
      if (!res.body) return;

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.replace(/^data:\s*/, '').trim();
          if (!line) continue;
          try {
            const ev = JSON.parse(line);
            if (ev.type === 'scenario') {
              setScenarios(prev => prev.map(s =>
                s.index === ev.index
                  ? { index: ev.index, script: ev.script, preview: ev.preview, loading: false }
                  : s
              ));
            }
            if (ev.type === 'done') setScenariosDone(true);
          } catch { /* skip */ }
        }
      }
    } catch {
      setScenarios([]);
    } finally {
      setScenariosLoading(false);
      setScenariosDone(true);
    }
  };

  // ── Step 1: 템플릿 선택 ──────────────────────────────────────────────────
  const selectTemplate = (t: Template) => {
    setTemplate(t);
    if (artStyle) setTimeout(() => setStep(2), 240);
  };

  // ── Step 1: 화풍 선택 ────────────────────────────────────────────────────
  const selectArtStyleItem = (a: ArtStyle) => {
    setArtStyle(a);
  };

  // ── Step 2: 프롬프트 스타일 선택 → 시나리오 생성 ───────────────────────
  const selectStyle = (s: Style) => {
    setStyle(s);
    if (template) generateScenarios(template, s);
  };

  // ── 시나리오 카드 선택 ───────────────────────────────────────────────────
  const selectScenario = (card: ScenarioCard) => {
    if (card.loading) return;
    setSelectedIdx(card.index);
    setEditedScript(card.script);
  };

  // ── 성우 미리듣기 ────────────────────────────────────────────────────────
  const handlePreview = async (v: Voice) => {
    if (previewing === v.id) { audioRef.current?.pause(); setPreviewing(null); return; }
    setPreviewing(v.id);
    try {
      const a = new Audio(v.previewUrl);
      audioRef.current = a;
      await a.play();
      a.onended = () => setPreviewing(null);
    } catch { setPreviewing(null); }
  };

  // ── 파일 업로드 핸들러 ───────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setManualScript(text || '');
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // ── Step 2 → 데스크톱 앱으로 전송 (영상 제작은 로컬 Agent에서 처리) ────
  const DESKTOP_API = 'http://localhost:7788';

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const mapSceneToSlot = (s: any): VideoSlot => ({
    id: s.index + 1,
    status: s.img_state === 'done' && s.dub_state === 'done' ? 'completed' as const
          : s.img_state === 'fail' || s.dub_state === 'fail' ? 'error' as const
          : s.img_state === 'progress' || s.dub_state === 'progress' ? 'processing' as const
          : 'pending' as const,
    progress: s.img_state === 'done' && s.dub_state === 'done' ? 100
            : s.img_state === 'done' ? 50 : s.img_state === 'progress' ? 25 : 0,
    sceneText: s.text,
  });

  // ── 안전한 헬스체크 (AbortController 기반) ────────────────────────────
  const checkHealth = async (timeoutMs = 2000): Promise<boolean> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const r = await fetch(`${DESKTOP_API}/health`, {
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-store',
      });
      clearTimeout(timer);
      return r.ok;
    } catch {
      clearTimeout(timer);
      return false;
    }
  };

  // ── 데스크톱 앱 실행 시도 (커스텀 프로토콜) ─────────────────────────────
  const tryLaunchDesktop = async (): Promise<boolean> => {
    // 이미 실행 중이면 바로 true
    if (await checkHealth()) return true;

    // linkdrop:// 프로토콜로 실행 시도
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'linkdrop://start';
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 500);
    } catch { /* 프로토콜 미등록 시 무시 */ }

    // 최대 12초 대기 (1.5초 간격 헬스체크)
    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, 1500));
      if (await checkHealth(1500)) {
        setDesktopAlive(true);
        return true;
      }
    }
    return false;
  };

  const handleStart = async () => {
    const isManual = inputMode === 'manual';
    const scriptToUse = isManual ? manualScript.trim() : editedScript.trim();
    if (!template) return;
    if (!isManual && (selectedIdx === null || !style)) return;
    if (isManual && !scriptToUse) return;

    // 기존 폴링 정리
    stopPolling();

    setStep(3);
    setRunning(true);
    setPipelineError(null);
    setFinalUrl16x9(null);
    setFinalUrl9x16(null);
    setSlots([]);
    setPipelineStep(0);
    setStepMsg('프로그램 연결 중...');

    // 프로그램이 꺼져있으면 자동 실행 시도
    if (!desktopAlive) {
      setStepMsg('LinkDrop 프로그램을 시작하고 있습니다...');
      const launched = await tryLaunchDesktop();
      if (!launched) {
        setPipelineError(
          '프로그램을 자동으로 실행하지 못했습니다.\n' +
          'LinkDrop이 설치되지 않았다면 아래에서 설치해 주세요.'
        );
        setRunning(false);
        return;
      }
    }

    setStepMsg('시나리오 전송 중...');

    try {
      const res = await fetch(`${DESKTOP_API}/api/load-scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script:      scriptToUse,
          voice_id:    voice.id,
          speed:       ttsSpeed,
          style_id:    artStyle?.id ?? 'hollywood-sf',
          art_prompt:  artStyle?.notebooklmPrompt ?? '',
          tone_id:     tone?.id ?? null,
          emotion_id:  emotion?.id ?? null,
          text_style:  textStyle,
          app_id:      template.id,
          topic:       topic.trim() || template.title,
          auto_start:  false,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setPipelineError(data.error || '데스크톱 앱 연결 실패');
        setRunning(false);
        return;
      }

      // 데스크톱 앱이 시나리오를 수신하고 자동 시작
      setStepMsg(`데스크톱 앱에서 영상 제작 시작 (${data.total}개 씬)`);
      setPipelineStep(1);

      // 진행 상황 폴링 (2초 간격, ref로 관리)
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`${DESKTOP_API}/api/status`, { signal: AbortSignal.timeout(3000) });
          const status = await statusRes.json();

          // 씬 상태 업데이트
          if (status.scenes?.length > 0) {
            setSlots(status.scenes.map(mapSceneToSlot));
          }

          const allDone = status.scenes?.every((s: any) => s.img_state === 'done' && s.dub_state === 'done');

          if (allDone && !status.final_path) {
            setPipelineStep(4);
            setStepMsg('FFmpeg 병합 중...');
          }

          // 최종 영상 완성
          if (status.final_path) {
            stopPolling();
            setPipelineStep(5);
            setFinalUrl16x9(status.final_path);
            setStepMsg('');
            setRunning(false);
          }

          // 파이프라인 종료 + 미완성 → 에러
          if (!status.is_running && !status.final_path && !allDone) {
            const anyStarted = status.scenes?.some((s: any) => s.img_state !== 'wait');
            if (anyStarted) {
              stopPolling();
              setPipelineError('일부 씬 생성에 실패했습니다. 데스크톱 앱에서 재시도하세요.');
              setRunning(false);
            }
          }
        } catch {
          // 데스크톱 앱 종료됨
          stopPolling();
          setPipelineError('데스크톱 앱과의 연결이 끊어졌습니다.\nLinkDrop 앱을 다시 실행한 후 재시도하세요.');
          setRunning(false);
        }
      }, 2000);

    } catch {
      setPipelineError(
        '데스크톱 앱에 연결할 수 없습니다.\n' +
        'LinkDrop 데스크톱 앱이 실행 중인지 확인해 주세요.'
      );
      setRunning(false);
    }
  };

  const handlePipelineEvent = (ev: PipelineEvent) => {
    switch (ev.type) {
      case 'step':     setPipelineStep(ev.step); setStepMsg(ev.message); break;
      case 'init':
        setSlots(Array.from({ length: ev.clip_count }, (_, i) => ({ id: i+1, status: 'pending', progress: 0 })));
        break;
      case 'progress':
        setSlots(prev => prev.map(s => {
          if (s.id !== ev.clip_id + 1) return s;
          if (s.status === 'completed' || s.status === 'error') return s;
          return {
            ...s, status: STATE_MAP[ev.state] ?? s.status,
            progress: Math.max(s.progress, ev.progress), sceneText: ev.scene_text,
            keyframePath: ev.keyframe ?? s.keyframePath,
          };
        }));
        break;
      case 'done':
        setFinalUrl16x9(ev.url_16x9);
        setFinalUrl9x16(ev.url_9x16);
        setPipelineStep(5);
        break;
      case 'error': setPipelineError(ev.message); break;
    }
  };

  const allDone = slots.length > 0 && slots.every(s => s.status === 'completed');

  // ── 탭 잠금 규칙 ─────────────────────────────────────────────────────────
  const step1Done = !!(template && artStyle && emotion && tone);
  const step2Done = inputMode === 'manual' ? manualScript.trim().length > 0 : selectedIdx !== null;
  const unlocked  = [step1Done, step2Done, allDone];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white font-sans">

      {/* ── 헤더 ──────────────────────────────────────────────────────────── */}
      <header 
        className="relative pt-12 pb-0 px-6 overflow-hidden"
        style={{
          backgroundImage: 'url("/img/content/longform/longform_top_bg.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-[#0f0f1a]/80" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
            <span className="text-fuchsia-200 text-[10px] font-black uppercase tracking-[0.2em]">AI Video · NotebookLM Powered</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-1">
            AI 롱폼{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-500 bg-clip-text text-transparent">영상 제작</span>
          </h1>
          <p className="text-slate-400 text-sm mb-6">템플릿 · 화풍 선택 → 시나리오 생성 → FFmpeg 영상 합성</p>

          {/* 탭 */}
          <div className="flex items-center gap-0.5 border-b border-white/10 overflow-x-auto">
            {[
              { step: 1, label: '템플릿 · 화풍' },
              { step: 2, label: '시나리오 · 성우' },
              { step: 3, label: '영상 제작' },
            ].map(({ step: s, label }, i) => (
              <React.Fragment key={s}>
                <StepTab
                  step={s} label={label} current={step}
                  unlocked={unlocked[s - 1] || step >= s}
                  onClick={() => (unlocked[s - 1] || step >= s) && setStep(s)}
                />
                {i < 2 && <FontAwesomeIcon icon={faChevronRight} className="text-slate-700 text-[10px] shrink-0 mx-0.5" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* ── Opal AI 연결 플로팅 패널 (우측 상단 고정) ───────────────────── */}
      <div className="fixed right-4 top-[60px] z-50 w-56 select-none">
        <div className={`rounded-2xl border shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden transition-all duration-300 ${
          opalSecondsLeft === 0
            ? 'bg-red-950/95 border-red-500/50'
            : opalSecondsLeft <= 600
            ? 'bg-slate-900/95 border-red-500/40'
            : 'bg-slate-900/95 border-white/10'
        }`}>

          {/* ── 헤더 (항상 표시) ── */}
          <button
            onClick={() => setOpalExpanded(e => !e)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
          >
            {/* 원형 타이머 */}
            <div className="relative w-10 h-10 shrink-0">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                <circle
                  cx="18" cy="18" r="14" fill="none" strokeWidth="3.5"
                  strokeDasharray={`${opalProgress * 87.96} 87.96`}
                  strokeLinecap="round"
                  className={`${opalRingColor} transition-all duration-1000`}
                />
              </svg>
              <FontAwesomeIcon
                icon={faClock}
                className={`absolute inset-0 m-auto text-[12px] ${opalTimerColor}`}
              />
            </div>

            {/* 분 표시 + 라벨 */}
            <div className="flex-1 text-left">
              <p className={`text-xl font-black tabular-nums leading-none ${opalTimerColor}`}>
                {opalSecondsLeft === 0 ? '0분' : `${opalMins}분`}
              </p>
              <p className="text-[10px] text-slate-500 leading-none mt-1">
                {opalSecondsLeft === 0 ? 'AI 연결이 끊겼어요' : 'AI 사용 가능 시간'}
              </p>
            </div>

            {/* 토글 화살표 */}
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`text-slate-600 text-[10px] transition-transform duration-200 ${opalExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {/* ── 확장 패널 ── */}
          {opalExpanded && (
            <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">

              {/* 설득 섹션 */}
              <div className="bg-slate-800/70 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-indigo-400 text-[11px]" />
                  <p className="text-[11px] font-black text-white">왜 1시간마다 확인이 필요한가요?</p>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  배경 이미지는{' '}
                  <span className="text-fuchsia-400 font-bold">Google Gemini AI</span>가{' '}
                  내 계정에 로그인된 상태에서 직접 그려줍니다.
                </p>

                {/* 비유 */}
                <div className="flex items-start gap-2 bg-slate-700/50 rounded-lg px-2.5 py-2">
                  <span className="text-base leading-none mt-0.5">🏦</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    인터넷 뱅킹에서 오래 있으면 자동으로 로그아웃되는 것처럼,{' '}
                    <span className="text-slate-200 font-bold">Google AI도 1시간이 지나면 자동으로 로그아웃</span>됩니다.
                    영상 만들다 중간에 멈추지 않으려면 미리 눌러 두세요.
                  </p>
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed">
                  아래 버튼 클릭 후 새 창에서 마우스만 한 번 움직이면{' '}
                  <span className="text-emerald-400 font-bold">다시 1시간 연장</span>됩니다. 10초면 끝납니다.
                </p>
              </div>

              {/* 연결 유지 버튼 */}
              <button
                onClick={resetOpalSession}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                  opalSecondsLeft <= 600 || opalSecondsLeft === 0
                    ? 'bg-gradient-to-r from-red-600 to-fuchsia-600 hover:brightness-110 text-white shadow-lg shadow-red-500/20'
                    : 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:brightness-110 text-white shadow-lg shadow-fuchsia-500/20'
                }`}
              >
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                AI 연결 유지하기
              </button>

              {opalSecondsLeft === 0 && (
                <p className="text-[10px] text-red-400 font-black text-center animate-pulse">
                  ⚠ 지금 누르지 않으면 배경 이미지 생성이 멈춥니다
                </p>
              )}
            </div>
          )}

          {/* ── 10분 이하 경고 (항상 표시) ── */}
          {opalSecondsLeft <= 600 && opalSecondsLeft > 0 && (
            <div className="px-4 pb-3">
              <p className="text-[10px] text-red-400 font-black text-center animate-pulse">
                ⚠ 곧 로그아웃됩니다 — 지금 눌러 두세요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── 탭 콘텐츠 ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-20">

        {/* ════════ STEP 1: 템플릿 + 화풍 ════════ */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">

            {/* ── 템플릿 (텍스트 탭 선택) ── */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-black">1</span>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">지식 템플릿</h2>
              <span className="text-slate-600 text-[11px]">— NotebookLM 연동 지식창고</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-10">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border-2 ${
                    template?.id === t.id
                      ? t.category === 'vault'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-fuchsia-600 border-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20'
                      : 'bg-[#1c1c2e] border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>

            {/* ── 구분선 ── */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700 rounded-full">
                <FontAwesomeIcon icon={faPalette} className="text-fuchsia-400 text-[10px]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">화풍 · Art Style</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            </div>

            {/* ── 화풍 ── */}
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center text-[10px] font-black">2</span>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">키프레임 화풍</h2>
              <span className="text-slate-600 text-[11px]">— AI 이미지 생성 스타일</span>
            </div>
            <p className="text-slate-500 text-xs mb-5 pl-7">씬별 키프레임 이미지 생성에 적용할 시각 스타일입니다.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {ART_STYLES.map(a => (
                <ArtStyleCard key={a.id} a={a} selected={artStyle?.id === a.id} onSelect={() => selectArtStyleItem(a)} />
              ))}
            </div>

            {/* ── 감정 & 톤앤매너 ── */}
            {artStyle && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700 rounded-full">
                    <FontAwesomeIcon icon={faMagic} className="text-indigo-400 text-[10px]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">감정 & 톤앤매너</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-black">3</span>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">감정 & 톤앤매너</h2>
                  <span className="text-slate-600 text-[11px]">— 영상의 감정선과 말하기 방식</span>
                </div>
                <p className="text-slate-500 text-xs mb-5 pl-7">시나리오와 이미지 생성에 반영될 감정 분위기와 어조를 선택하세요.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {/* 감정 드롭다운 */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      감정 분위기
                    </label>
                    <div className="relative">
                      <select
                        value={emotion?.id ?? ''}
                        onChange={e => setEmotion(EMOTIONS.find(x => x.id === e.target.value) ?? null)}
                        className="w-full appearance-none bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-semibold focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                      >
                        <option value="">감정 분위기 선택...</option>
                        {EMOTIONS.map(em => (
                          <option key={em.id} value={em.id}>
                            {em.emoji} {em.label} — {em.desc}
                          </option>
                        ))}
                      </select>
                      <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none" />
                    </div>
                    {emotion && (
                      <p className="text-[11px] text-indigo-400 mt-1.5 pl-1 font-semibold">
                        {emotion.emoji} {emotion.label}
                      </p>
                    )}
                  </div>

                  {/* 톤앤매너 드롭다운 */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      톤앤매너
                    </label>
                    <div className="relative">
                      <select
                        value={tone?.id ?? ''}
                        onChange={e => setTone(TONES.find(x => x.id === e.target.value) ?? null)}
                        className="w-full appearance-none bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-semibold focus:outline-none focus:border-fuchsia-500 transition-colors cursor-pointer"
                      >
                        <option value="">톤앤매너 선택...</option>
                        {TONES.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.label} — {t.desc}
                          </option>
                        ))}
                      </select>
                      <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none" />
                    </div>
                    {tone && (
                      <p className="text-[11px] text-fuchsia-400 mt-1.5 pl-1 font-semibold">
                        {tone.label}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── 다음 단계 CTA ── */}
            {step1Done && (
              <div className="flex justify-end animate-in fade-in duration-300">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-2xl font-black text-sm shadow-2xl shadow-fuchsia-500/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  시나리오 생성하기
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════ STEP 2: 시나리오 + 성우 ════════ */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">

            {/* 선택 배지 */}
            <div className="flex flex-wrap gap-2 mb-6">
              <SelectedBadge label="템플릿" value={template?.title ?? ''} onBack={() => setStep(1)} inline />
              <SelectedBadge label="화풍"   value={artStyle?.label  ?? ''} onBack={() => setStep(1)} inline />
              {emotion && <SelectedBadge label="감정" value={`${emotion.emoji} ${emotion.label}`} onBack={() => setStep(1)} inline />}
              {tone    && <SelectedBadge label="톤"   value={tone.label}                           onBack={() => setStep(1)} inline />}
            </div>

            {/* ── 입력 모드 토글 ── */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
              <button
                onClick={() => setInputMode('ai')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  inputMode === 'ai'
                    ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FontAwesomeIcon icon={faRobot} />
                AI 시나리오 생성
              </button>
              <button
                onClick={() => setInputMode('manual')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  inputMode === 'manual'
                    ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FontAwesomeIcon icon={faKeyboard} />
                직접 입력 / 업로드
              </button>
            </div>

            {/* ════ AI 생성 모드 ════ */}
            {inputMode === 'ai' && (
              <>
                {/* ── 프롬프트 스타일 선택 (필수) ── */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-black text-white">★</span>
                    <span className="text-xs font-black text-white uppercase tracking-widest">시나리오 스타일</span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-widest">필수 선택</span>
                  </div>
                  <p className="text-slate-500 text-xs mb-3 pl-7">스타일을 선택하면 AI가 즉시 3개 시나리오를 자동 생성합니다.</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {STYLES.map(s => (
                      <MiniStyleCard key={s.id} s={s} selected={style?.id === s.id} onSelect={() => selectStyle(s)} />
                    ))}
                  </div>
                </div>

                {/* ── 시나리오 3개 카드 ── */}
                {scenarios.length > 0 && (
                  <>
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() => template && style && generateScenarios(template, style)}
                        disabled={scenariosLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs font-black transition-all disabled:opacity-40"
                      >
                        <FontAwesomeIcon icon={scenariosLoading ? faSpinner : faRotate} className={scenariosLoading ? 'animate-spin' : ''} />
                        {scenariosLoading ? '생성 중...' : '재생성'}
                      </button>
                    </div>
                  </>
                )}
                {scenarios.length > 0 && (
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {scenarios.map(card => (
                      <ScenarioCardUI
                        key={card.index} card={card}
                        selected={selectedIdx === card.index}
                        onSelect={() => selectScenario(card)}
                      />
                    ))}
                  </div>
                )}

                {!style && (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <FontAwesomeIcon icon={faMagic} className="text-slate-600 text-lg" />
                    </div>
                    <p className="text-slate-500 text-sm">위에서 시나리오 스타일을 선택하면<br />AI가 3가지 시나리오를 자동 생성합니다.</p>
                  </div>
                )}

                {/* ── 선택된 시나리오 편집 + 성우 (성우 1/3 : 시나리오 2/3) ── */}
                {selectedIdx !== null && (
                  <div className="grid md:grid-cols-3 gap-6 mt-2 animate-in fade-in duration-300">
                    {/* 성우 선택 (1/3) — 1열 3행 */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FontAwesomeIcon icon={faMicrophone} className="text-fuchsia-400 text-sm" />
                        <span className="text-sm font-black text-white">AI 성우 선택</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {VOICES.map((v, idx) => (
                          <VoiceCard key={v.id} v={v} idx={idx} selected={voice.id === v.id}
                            previewing={previewing === v.id} onSelect={() => setVoice(v)} onPreview={() => handlePreview(v)} />
                        ))}
                      </div>
                      <TtsSpeedControl value={ttsSpeed} onChange={setTtsSpeed} />
                    </div>
                    {/* 시나리오 편집 (2/3) — 높이 자동 확장 */}
                    <div className="md:col-span-2 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <FontAwesomeIcon icon={faPenToSquare} className="text-indigo-400 text-sm" />
                        <span className="text-sm font-black text-white">시나리오 편집</span>
                        <span className="ml-auto text-[10px] text-slate-500">자유롭게 수정 가능</span>
                      </div>
                      <textarea
                        ref={editTextareaRef}
                        value={editedScript}
                        onChange={e => { setEditedScript(e.target.value); autoResize(editTextareaRef.current); }}
                        onFocus={() => autoResize(editTextareaRef.current)}
                        className="w-full min-h-[400px] bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none overflow-hidden font-mono leading-relaxed transition-all"
                      />
                    </div>
                  </div>
                )}

                {selectedIdx !== null && (
                  <div className="flex items-center justify-end gap-4 mt-8">
                    <DesktopStatus alive={desktopAlive} />
                    <button onClick={handleStart}
                      className="flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-lg shadow-2xl transition-all active:scale-95 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-fuchsia-500/20 hover:brightness-110">
                      <FontAwesomeIcon icon={faPlay} />
                      영상 제작 시작
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ════ 직접 입력 / 업로드 모드 ════ */}
            {inputMode === 'manual' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid md:grid-cols-3 gap-6">

                  {/* 성우 선택 (1/3) — 1열 3행 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FontAwesomeIcon icon={faMicrophone} className="text-fuchsia-400 text-sm" />
                      <span className="text-sm font-black text-white">AI 성우 선택</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {VOICES.map((v, idx) => (
                        <VoiceCard key={v.id} v={v} idx={idx} selected={voice.id === v.id}
                          previewing={previewing === v.id} onSelect={() => setVoice(v)} onPreview={() => handlePreview(v)} />
                      ))}
                    </div>
                    <TtsSpeedControl value={ttsSpeed} onChange={setTtsSpeed} />

                    {/* 입력 형식 안내 */}
                    <div className="mt-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">입력 형식 안내</p>
                      <div className="space-y-1 font-mono text-[11px] text-slate-400">
                        <p><span className="text-indigo-400">[씬1]</span> 나레이션 텍스트 (권장)</p>
                        <p><span className="text-indigo-400">[씬2]</span> 씬 태그 없이도 동작</p>
                        <p className="text-slate-600 pt-1">• 씬 태그 없으면 줄바꿈 기준 자동 분리</p>
                        <p className="text-slate-600">• .txt 파일은 UTF-8 인코딩 권장</p>
                      </div>
                    </div>
                  </div>

                  {/* 텍스트 입력 영역 (2/3) — 높이 자동 확장 */}
                  <div className="md:col-span-2 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <FontAwesomeIcon icon={faPenToSquare} className="text-indigo-400 text-sm" />
                      <span className="text-sm font-black text-white">시나리오 직접 입력</span>
                      <span className="ml-auto text-[10px] text-slate-500">[씬N] 형식 권장</span>
                    </div>
                    <textarea
                      ref={manualTextareaRef}
                      value={manualScript}
                      onChange={e => { setManualScript(e.target.value); autoResize(manualTextareaRef.current); }}
                      onFocus={() => autoResize(manualTextareaRef.current)}
                      placeholder={`[씬1] 오늘 건강 식품 TOP 5를 알아봅시다.\n[씬2] 5위는 귀리입니다.\n[씬3] 귀리는 혈압을 낮춰줍니다.\n...`}
                      className="w-full min-h-[400px] bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none overflow-hidden font-mono leading-relaxed placeholder:text-slate-700 transition-all"
                    />
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 text-xs font-black transition-all"
                      >
                        <FontAwesomeIcon icon={faFileUpload} />
                        .txt 파일 업로드
                      </button>
                      {uploadFileName && (
                        <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                          <FontAwesomeIcon icon={faFileAlt} />
                          {uploadFileName}
                        </span>
                      )}
                      <span className="ml-auto text-[10px] text-slate-600">
                        {manualScript.length}자
                      </span>
                    </div>
                  </div>
                </div>

                {/* 텍스트 오버레이 스타일 + CTA */}
                {manualScript.trim() && (
                  <div className="flex items-center justify-end gap-4 mt-8 animate-in fade-in duration-300">
                    <DesktopStatus alive={desktopAlive} />
                    <button onClick={handleStart}
                      className="flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-lg shadow-2xl transition-all active:scale-95 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-fuchsia-500/20 hover:brightness-110">
                      <FontAwesomeIcon icon={faPlay} />
                      영상 제작 시작
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════ STEP 3: 영상 제작 ════════ */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">

            {/* 선택 요약 */}
            <div className="flex flex-wrap gap-2 mb-8">
              <SelectedBadge label="템플릿" value={template?.title ?? ''} onBack={() => setStep(1)} inline />
              <SelectedBadge label="화풍"   value={artStyle?.label  ?? ''} onBack={() => setStep(1)} inline />
              {emotion && <SelectedBadge label="감정" value={`${emotion.emoji} ${emotion.label}`} onBack={() => setStep(1)} inline />}
              {tone    && <SelectedBadge label="톤"   value={tone.label}                           onBack={() => setStep(1)} inline />}
              <SelectedBadge label="스타일" value={style?.label     ?? ''} onBack={() => setStep(2)} inline />
            </div>

            {/* 파이프라인 스텝 표시 */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {[
                { s: 1, icon: faMagic,          label: '시나리오' },
                { s: 2, icon: faMagic,          label: '씬 파싱' },
                { s: 3, icon: faVideo,          label: '영상 합성' },
                { s: 4, icon: faCloudUploadAlt, label: 'FFmpeg 병합' },
              ].map(({ s, icon, label }, i) => (
                <React.Fragment key={s}>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all duration-500 ${
                    pipelineStep === s
                      ? 'bg-gradient-to-r from-indigo-950 to-fuchsia-950 border-fuchsia-600/50 text-fuchsia-300'
                      : pipelineStep > s || allDone
                      ? 'bg-emerald-950/40 border-emerald-700/40 text-emerald-400'
                      : 'bg-slate-900/50 border-slate-800 text-slate-600'
                  }`}>
                    <FontAwesomeIcon
                      icon={pipelineStep > s || allDone ? faCheckCircle : icon}
                      className={pipelineStep === s ? 'animate-pulse' : ''}
                    />
                    {label}
                  </div>
                  {i < 3 && <FontAwesomeIcon icon={faChevronRight} className="text-slate-700 text-[10px]" />}
                </React.Fragment>
              ))}
            </div>

            {running && stepMsg && (
              <p className="text-center text-fuchsia-300/60 text-[11px] font-black uppercase tracking-widest mb-6 animate-pulse">{stepMsg}</p>
            )}

            {pipelineError && (
              <div className="mb-6 bg-red-950/60 border border-red-700/40 rounded-2xl p-6">
                <div className="flex items-start gap-3 mb-5">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400 mt-0.5 shrink-0 text-lg" />
                  <p className="text-red-300 text-sm leading-relaxed whitespace-pre-line font-bold">{pipelineError}</p>
                </div>

                {/* 액션 버튼 */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { setPipelineError(null); handleStart(); }}
                    className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-xl font-black text-sm hover:brightness-110 active:scale-95 transition-all"
                  >
                    <FontAwesomeIcon icon={faSync} />
                    다시 시도 (프로그램 자동 실행)
                  </button>

                  {/* 미설치 시 */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-800" />
                    <span className="text-[10px] text-slate-600 font-bold">처음이신가요?</span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>

                  <a
                    href="/download"
                    className="flex items-center justify-center gap-2 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-black text-sm hover:bg-slate-700 active:scale-95 transition-all"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                    LinkDrop 프로그램 설치하기 (1회)
                  </a>

                  <button
                    onClick={() => { setPipelineError(null); setRunning(false); setStep(2); }}
                    className="flex items-center justify-center gap-2 py-2 text-slate-500 text-xs font-bold hover:text-slate-300 transition-all"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    시나리오로 돌아가기
                  </button>
                </div>
              </div>
            )}

            {/* 씬 수 확정 전 스피너 */}
            {running && slots.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-16">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-fuchsia-500 border-r-indigo-500 border-b-transparent border-l-transparent animate-spin" />
                </div>
                <p className="text-slate-400 text-sm">씬 수 확정 후 클립 슬롯이 생성됩니다...</p>
              </div>
            )}

            {/* 클립 그리드 */}
            {slots.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                {slots.map(slot => <CircleProgress key={slot.id} slot={slot} />)}
              </div>
            )}

            {(finalUrl16x9 || finalUrl9x16) && (
              <div className="flex flex-col items-center gap-3">
                {finalUrl16x9 && (
                  <a href={finalUrl16x9} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-emerald-500 to-indigo-600 text-white rounded-2xl font-black text-lg shadow-2xl hover:brightness-110 transition-all active:scale-95"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    16:9 영상 다운로드 (무자막)
                  </a>
                )}
                {finalUrl9x16 && (
                  <a href={finalUrl9x16} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white rounded-2xl font-black text-lg shadow-2xl hover:brightness-110 transition-all active:scale-95"
                  >
                    <FontAwesomeIcon icon={faVideo} />
                    9:16 영상 다운로드 (자막 포함)
                  </a>
                )}
              </div>
            )}

            {allDone && !finalUrl16x9 && running && (
              <div className="flex justify-center items-center gap-2 text-fuchsia-300/60 text-sm font-black uppercase tracking-widest animate-pulse">
                <FontAwesomeIcon icon={faSync} className="animate-spin" />
                FFmpeg 병합 중...
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 동의 모달 ──────────────────────────────────────────────────────── */}
      {showDisclosure && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* 백드롭 */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

          {/* 카드 */}
          <div className="relative z-10 w-full max-w-2xl bg-[#0d0d1c] border border-white/10 rounded-3xl shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]">

            {/* 헤더 */}
            <div className="px-8 pt-8 pb-6 border-b border-white/5 shrink-0">
              <div className="inline-flex items-center gap-2 bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
                <span className="text-fuchsia-300 text-[10px] font-black uppercase tracking-[0.2em]">{disclosure.badge}</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2 whitespace-pre-line leading-snug">
                {disclosure.title}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                {disclosure.subtitle}
              </p>
            </div>

            {/* 스크롤 본문 */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-7">
              {disclosure.sections.map(section => (
                <div
                  key={section.id}
                  className={`rounded-2xl p-4 ${
                    section.highlight
                      ? 'bg-fuchsia-950/40 border border-fuchsia-500/20'
                      : 'bg-white/[0.02] border border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-xl leading-none">{section.emoji}</span>
                    <h3 className={`text-sm font-black ${section.highlight ? 'text-fuchsia-200' : 'text-white'}`}>
                      {section.title}
                    </h3>
                    {section.highlight && (
                      <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 uppercase tracking-widest border border-fuchsia-500/30">
                        핵심 고지
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 pl-8">
                    {section.paragraphs.map((p: string, i: number) => (
                      <p key={i} className="text-[13px] text-slate-400 leading-relaxed">{p}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 푸터: 체크박스 + 버튼 */}
            <div className="px-8 pb-8 pt-5 border-t border-white/5 shrink-0 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={disclosureChecked}
                    onChange={e => setDisclosureChecked(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    disclosureChecked
                      ? 'bg-fuchsia-500 border-fuchsia-500'
                      : 'border-slate-600 group-hover:border-slate-400'
                  }`}>
                    {disclosureChecked && (
                      <FontAwesomeIcon icon={faCheckCircle} className="text-white text-[10px]" />
                    )}
                  </div>
                </div>
                <span className="text-[13px] text-slate-300 leading-relaxed">
                  {disclosure.agreement.checkboxLabel}
                </span>
              </label>

              <button
                onClick={handleAgree}
                disabled={!disclosureChecked || disclosureSubmitting}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-2xl font-black text-sm transition-all shadow-2xl shadow-fuchsia-500/20 disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99]"
              >
                {disclosureSubmitting
                  ? disclosure.agreement.loadingLabel
                  : disclosure.agreement.buttonLabel}
              </button>

              <p className="text-center text-[10px] text-slate-600">
                동의 기록은 법적 증빙을 위해 서버에 안전하게 저장됩니다 · v{disclosure.agreement.versionKey}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 서브 컴포넌트들 ──────────────────────────────────────────────────────────


function DesktopStatus({ alive }: { alive: boolean | null }) {
  if (alive === null) return <span className="text-[11px] text-slate-600 font-bold animate-pulse">앱 확인 중...</span>;
  if (alive) return (
    <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-400">
      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
      프로그램 연결됨
    </span>
  );
  return (
    <div className="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3 max-w-md">
      <p className="flex items-center gap-1.5 text-[11px] font-black text-red-400 mb-2">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        영상 제작 프로그램이 실행되지 않고 있습니다
      </p>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        영상 제작을 위해서는 <span className="text-fuchsia-400 font-bold">LinkDrop 프로그램</span>이
        실행 중이어야 합니다. 프로그램을 실행하면 자동으로 연결됩니다.
      </p>
    </div>
  );
}

function GroupLabel({ dot, label }: { dot: 'indigo' | 'fuchsia'; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`w-2 h-2 rounded-full ${dot === 'indigo' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.9)]' : 'bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.9)]'}`} />
      <span className={`text-[11px] font-black uppercase tracking-[0.25em] ${dot === 'indigo' ? 'text-indigo-400' : 'text-fuchsia-400'}`}>{label}</span>
    </div>
  );
}

function SelectedBadge({ label, value, onBack, inline }: { label: string; value: string; onBack: () => void; inline?: boolean }) {
  if (inline) return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs">
      <span className="text-slate-500 font-medium">{label}:</span>
      <span className="text-white font-black">{value}</span>
      <button onClick={onBack} className="text-slate-500 hover:text-white ml-1 transition-colors text-[10px]">변경</button>
    </div>
  );
  return (
    <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
      <div>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-white font-black">{value}</p>
      </div>
      <button onClick={onBack} className="ml-auto flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold transition-colors">
        <FontAwesomeIcon icon={faArrowLeft} />
        변경
      </button>
    </div>
  );
}

function TemplateCard({ t, selected, onSelect, accent }: { t: Template; selected: boolean; onSelect: () => void; accent: 'indigo' | 'fuchsia' }) {
  return (
    <button onClick={onSelect} className={`group relative h-32 rounded-2xl overflow-hidden border transition-all duration-300 ${
      selected ? 'border-violet-400 scale-105 shadow-[0_16px_32px_-8px_rgba(139,92,246,0.5)] ring-2 ring-violet-500/30' : 'border-white/10 hover:border-white/25 hover:scale-[1.02]'
    }`}>
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
        style={{ backgroundImage: `url(${t.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className={`absolute inset-0 transition-all duration-300 ${selected ? 'bg-violet-950/40' : 'bg-black/50 group-hover:bg-black/30'}`} />
      <div className="relative z-10 h-full flex items-center justify-center p-3">
        <span className={`font-black text-center leading-tight px-3 py-2 rounded-full backdrop-blur-md transition-all ${
          selected ? 'text-sm text-white bg-violet-600/60' : 'text-xs text-white bg-black/40 group-hover:scale-105'
        }`}>{t.title}</span>
      </div>
      {selected && (
        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] text-white border border-violet-400 flex items-center justify-center z-20 ${
          accent === 'indigo' ? 'bg-gradient-to-br from-indigo-500 to-fuchsia-500' : 'bg-gradient-to-br from-fuchsia-500 to-indigo-500'
        }`}><FontAwesomeIcon icon={faCheckCircle} /></div>
      )}
    </button>
  );
}

function ArtStyleCard({ a, selected, onSelect }: { a: ArtStyle; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`group relative h-40 rounded-2xl overflow-hidden border transition-all duration-300 text-left ${
        selected
          ? 'border-fuchsia-400/60 scale-[1.02] shadow-[0_16px_32px_-8px_rgba(217,70,239,0.4)] ring-2 ring-fuchsia-500/20'
          : 'border-white/10 hover:border-white/20 hover:scale-[1.01]'
      }`}
    >
      {/* 배경 이미지 */}
      <div 
        className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
        style={{
          backgroundImage: `url(${a.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* 필터 오버레이 */}
      <div className={`absolute inset-0 transition-all duration-500 ${
        selected 
          ? 'bg-violet-950/30 backdrop-blur-[1px]' 
          : 'bg-black/50 group-hover:bg-black/30'
      }`} />

      {/* 선택 상단 라인 */}
      {selected && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 z-20" />}

      <div className="relative z-10 h-full flex flex-col justify-end p-4">
        {selected && (
          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-[10px] shadow-lg border border-white/20">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
        )}
        <div>
          <p className={`font-black text-base mb-0.5 text-white drop-shadow-lg`}>{a.label}</p>
          <p className={`text-[11px] leading-relaxed ${selected ? 'text-fuchsia-200' : 'text-white/60'} drop-shadow-md`}>{a.desc}</p>
        </div>
      </div>
    </button>
  );
}

function MiniStyleCard({ s, selected, onSelect }: { s: Style; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`group flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 text-center ${
        selected
          ? 'bg-gradient-to-br from-indigo-950 to-fuchsia-950 border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/10 scale-[1.03]'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'
      }`}
    >
      {selected && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-t-xl" />}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
        selected ? 'bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'
      }`}>
        <FontAwesomeIcon icon={s.icon} />
      </div>
      <span className={`text-[10px] font-black leading-tight ${selected ? 'text-white' : 'text-slate-400'}`}>{s.label}</span>
    </button>
  );
}

function estimateDuration(script: string): { scenes: number; secs: number } {
  const scenes = (script.match(/\[씬\d+\]/g) ?? []).length || script.split('\n').filter(l => l.trim()).length;
  return { scenes, secs: scenes * 10 };
}

function ScenarioCardUI({ card, selected, onSelect }: { card: ScenarioCard; selected: boolean; onSelect: () => void }) {
  const labels = ['A', 'B', 'C'];
  const { scenes, secs } = card.script ? estimateDuration(card.script) : { scenes: 0, secs: 0 };
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <button
      onClick={onSelect}
      disabled={card.loading}
      className={`relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-300 h-36 overflow-hidden ${
        card.loading
          ? 'bg-slate-900/40 border-slate-800 cursor-wait'
          : selected
          ? 'bg-gradient-to-br from-indigo-950/80 to-fuchsia-950/80 border-fuchsia-500/50 shadow-[0_12px_24px_-6px_rgba(217,70,239,0.3)] scale-[1.02]'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-600 hover:scale-[1.01]'
      }`}
    >
      {selected && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-t-2xl" />}

      {card.loading ? (
        <div className="flex-1 flex flex-col gap-2 justify-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-slate-800 animate-pulse" />
            <div className="h-3 w-16 bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="h-2 bg-slate-800 rounded animate-pulse" />
          <div className="h-2 bg-slate-800 rounded animate-pulse w-4/5" />
          <div className="h-2 bg-slate-800 rounded animate-pulse w-2/3" />
          <p className="text-[10px] text-slate-600 mt-1 animate-pulse">NotebookLM 생성 중...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
              selected ? 'bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}>{labels[card.index]}</span>
            <span className={`text-[11px] font-black uppercase tracking-widest ${selected ? 'text-fuchsia-300' : 'text-slate-500'}`}>
              시나리오 {labels[card.index]}
            </span>
            {scenes > 0 && (
              <span className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                selected ? 'bg-fuchsia-900/60 text-fuchsia-300' : 'bg-slate-800 text-slate-400'
              }`}>
                <FontAwesomeIcon icon={faVideo} className="text-[8px]" />
                {scenes}씬 · {mm}:{ss}
              </span>
            )}
          </div>
          <p className={`text-xs leading-relaxed flex-1 overflow-hidden line-clamp-3 ${selected ? 'text-slate-200' : 'text-slate-400'}`}>
            {card.preview || '(미리보기 없음)'}
          </p>
        </>
      )}
    </button>
  );
}

function VoiceCard({ v, idx, selected, previewing, onSelect, onPreview }: {
  v: Voice; idx: number; selected: boolean; previewing: boolean;
  onSelect: () => void; onPreview: () => void;
}) {
  return (
    <div onClick={onSelect} className={`group relative aspect-square rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 ${
      selected ? 'border-violet-400 scale-[1.04] shadow-[0_8px_24px_-8px_rgba(217,70,239,0.4)]' : 'border-white/10 hover:border-white/25'
    }`}>
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
        style={{
          backgroundImage: `url(${['지수','다인','영철'].includes(v.name) ? '/img/content/longform/Voiceactor2.webp' : '/img/content/longform/Voiceactor.webp'})`,
          backgroundSize: '400% 200%',
          backgroundPosition: `${(idx % 4) * 33.3}% ${Math.floor(idx / 4) * 100}%`,
          opacity: 0.7,
        }} />
      <div className={`absolute inset-0 transition-all ${selected ? 'bg-violet-950/50' : 'bg-black/60 group-hover:bg-black/40'}`} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-1.5 px-1">
        <button onClick={e => { e.stopPropagation(); onPreview(); }}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            previewing ? 'bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white animate-pulse' : 'bg-white/10 text-white hover:bg-gradient-to-br hover:from-indigo-500 hover:to-fuchsia-500'
          }`}>
          <FontAwesomeIcon icon={previewing ? faSync : faVolumeUp} className={`text-xs ${previewing ? 'animate-spin' : ''}`} />
        </button>
        <span className="text-white text-[11px] font-black drop-shadow">{v.name}</span>
        <div className="flex items-center gap-1">
          <FontAwesomeIcon icon={v.gender === 'MALE' ? faMars : faVenus} className="text-[9px] text-slate-300" />
          <span className="text-[8px] text-slate-400 font-bold uppercase">{v.type}</span>
        </div>
      </div>
    </div>
  );
}

function TtsSpeedControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const presets = [0.8, 1.0, 1.2, 1.5];
  return (
    <div className="mt-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faVolumeUp} className="text-fuchsia-400 text-xs" />
          <span className="text-xs font-black text-white">더빙 속도</span>
        </div>
        <span className="text-xs font-black text-fuchsia-300">{value.toFixed(1)}x</span>
      </div>
      <div className="flex gap-1.5 mb-2">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`flex-1 py-1 rounded-lg text-[11px] font-black transition-all ${
              value === p
                ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {p.toFixed(1)}x
          </button>
        ))}
      </div>
      <input
        type="range" min={0.5} max={2.0} step={0.1}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-fuchsia-500 h-1 cursor-pointer"
      />
      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] text-slate-600">0.5x</span>
        <span className="text-[9px] text-slate-600">2.0x</span>
      </div>
    </div>
  );
}

function CircleProgress({ slot }: { slot: VideoSlot }) {
  const r    = 38;
  const circ = 2 * Math.PI * r;
  const gid  = `g${slot.id}`;
  const done = slot.status === 'completed';
  const err  = slot.status === 'error';
  return (
    <div className={`relative rounded-2xl border p-4 flex flex-col gap-2 transition-all duration-500 overflow-hidden pointer-events-none select-none ${
      done ? 'bg-emerald-950/50 border-emerald-700/40'
      : err  ? 'bg-red-950/50 border-red-800/40'
      : slot.status !== 'pending' ? 'bg-slate-900 border-indigo-700/30 shadow-[0_0_16px_-4px_rgba(99,102,241,0.2)]'
      : 'bg-slate-900/50 border-slate-800'
    }`}>
      {slot.keyframePath && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 transition-opacity duration-700"
          style={{ backgroundImage: `url(/api/longform/preview?path=${encodeURIComponent(slot.keyframePath)})` }}
        />
      )}
      <div className="relative flex items-center justify-center">
        <svg width="90" height="90" viewBox="0 0 96 96" className="-rotate-90">
          <defs>
            <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>
          <circle cx="48" cy="48" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle cx="48" cy="48" r={r} fill="none"
            stroke={done ? '#10b981' : err ? '#ef4444' : `url(#${gid})`}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ - circ * (slot.progress / 100)}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <FontAwesomeIcon icon={done ? faCheckCircle : faVideo} className={`text-xs mb-0.5 ${done ? 'text-emerald-400' : 'text-slate-600'}`} />
          <span className={`text-lg font-black leading-none ${done ? 'text-emerald-400' : 'text-white'}`}>
            {Math.round(slot.progress)}<span className="text-[8px] opacity-40">%</span>
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className={`text-[9px] font-black uppercase tracking-widest ${done ? 'text-emerald-500' : err ? 'text-red-500' : 'text-slate-600'}`}>CLIP {String(slot.id).padStart(2,'0')}</p>
        <p className={`text-[10px] truncate px-1 ${done ? 'text-emerald-300' : err ? 'text-red-400' : slot.status === 'processing' ? 'text-indigo-300 animate-pulse' : 'text-slate-600'}`}>
          {slot.sceneText ? slot.sceneText.slice(0, 14) + (slot.sceneText.length > 14 ? '…' : '') : { pending: '대기', processing: '렌더링', uploading: '업로드', completed: '완료', error: '오류' }[slot.status]}
        </p>
      </div>
    </div>
  );
}
