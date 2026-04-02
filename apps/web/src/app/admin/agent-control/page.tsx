'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faSpinner, faCheckCircle, faExclamationTriangle,
  faSearch, faNewspaper, faRss, faVideo, faBrain, faTags, faMagic,
  faEdit, faCalendarAlt, faExchangeAlt, faBolt, faFileVideo,
  faCloudUpload, faEnvelope, faIndustry, faTv, faPaperPlane,
  faArrowRight, faDatabase, faFilter, faStar, faFileAlt,
  faCircle, faLock, faShieldAlt, faChevronRight
} from '@fortawesome/free-solid-svg-icons';

// --- Types ---
interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'working' | 'completed' | 'error';
  category: number;
  label_number: string;
  icon: any;
}

interface PipelineFlow {
  rss: number;
  refined: number;
  gold: number;
  scripts: number;
  synced: number;
  discarded: number;
}

interface PipelineData {
  last_updated: string;
  today_summary: {
    total_collected: number;
    gold_count: number;
    scripts_generated: number;
    discarded: number;
    last_run: string;
  };
  flow: PipelineFlow;
}

// --- Icon Mapper ---
const ICON_MAP: { [key: string]: any } = {
  faSearch, faNewspaper, faRss, faVideo, faBrain, faTags, faMagic,
  faEdit, faCalendarAlt, faExchangeAlt, faBolt, faFileVideo,
  faCloudUpload, faEnvelope, faIndustry, faTv, faPaperPlane
};

const PIPELINE_STAGES = [
  { key: 'rss',     label: 'RAW 수집',      icon: faRss,         color: 'bg-blue-500',   textColor: 'text-blue-600',   skillCategory: 0 },
  { key: 'refined', label: '정제 완료',     icon: faFilter,      color: 'bg-purple-500', textColor: 'text-purple-600', skillCategory: 1 },
  { key: 'gold',    label: 'GOLD 선별',     icon: faStar,        color: 'bg-yellow-500', textColor: 'text-yellow-600', skillCategory: 1 },
  { key: 'scripts', label: '대본 완성',     icon: faFileAlt,     color: 'bg-orange-500', textColor: 'text-orange-600', skillCategory: 2 },
  { key: 'synced',  label: '드라이브 배송', icon: faCloudUpload, color: 'bg-green-500',  textColor: 'text-green-600',  skillCategory: 3 },
];

// 상태별 스타일 맵
const STATUS_STYLE = {
  idle:      { bg: 'bg-gray-50',    border: 'border-gray-200',  text: 'text-gray-400',  dot: 'bg-gray-300',   label: '대기중',    icon: faCircle },
  working:   { bg: 'bg-green-50',   border: 'border-green-400', text: 'text-green-700', dot: 'bg-green-500',  label: '가동중',    icon: faSpinner },
  completed: { bg: 'bg-blue-50',    border: 'border-blue-300',  text: 'text-blue-700',  dot: 'bg-blue-500',   label: '공정완료',  icon: faCheckCircle },
  error:     { bg: 'bg-red-50',     border: 'border-red-500',   text: 'text-red-700',   dot: 'bg-red-500',    label: '오류발생',  icon: faExclamationTriangle },
};

export default function AdminAgentControl() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProgress, setCurrentStep] = useState<string>('');
  const [progressPercent, setProgress] = useState(0);
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [lastCycleTime, setLastCycleTime] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    setIsMounted(true);

    const fetchSkills = async () => {
      try {
        const res = await fetch(`${API_BASE}/orchestrator/skills`);
        if (res.ok) {
          const data = await res.json();
          setAgents(data.map((skill: any) => ({
            id: skill.id,
            name: skill.name,
            description: skill.description,
            status: 'idle' as const,
            category: skill.category,
            label_number: skill.label_number,
            icon: ICON_MAP[skill.icon] || faBolt,
          })));
        }
      } catch (e) { console.error('Skills Load Failed', e); }
    };

    const updateStatus = async () => {
      try {
        const [statusRes, pipelineRes] = await Promise.all([
          fetch(`${API_BASE}/orchestrator/status`),
          fetch(`${API_BASE}/inventory/pipeline-status`),
        ]);

        if (statusRes.ok) {
          const data = await statusRes.json();
          if (data.last_cycle_time) setLastCycleTime(data.last_cycle_time);
          if (data.agent_states) {
            setAgents(prev => {
              const updated = prev.map(a => ({
                ...a,
                status: (data.agent_states[a.id] || 'idle') as Agent['status'],
              }));
              const working = updated.find(a => a.status === 'working');
              setActiveCategory(working ? working.category : null);
              return updated;
            });
          }
          if (data.current_step) {
            setCurrentStep(data.current_step);
            if      (data.current_step.includes('Collecting')) setProgress(25);
            else if (data.current_step.includes('Refining'))   setProgress(50);
            else if (data.current_step.includes('Syncing'))    setProgress(85);
            else if (data.current_step.includes('Waiting'))    setProgress(100);
            else setProgress(0);
          }
        }
        if (pipelineRes.ok) setPipelineData(await pipelineRes.json());
      } catch (e) { console.error('Status Update Failed', e); }
    };

    fetchSkills().then(() => updateStatus());
    const interval = setInterval(updateStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const sortedAgents = useMemo(() =>
    [...agents].sort((a, b) =>
      a.category !== b.category
        ? a.category - b.category
        : a.label_number.localeCompare(b.label_number)
    ), [agents]);

  // 오류 발생 인덱스 — 이후 스킬은 "blocked" 처리
  const errorIdx = useMemo(() =>
    sortedAgents.findIndex(a => a.status === 'error'), [sortedAgents]);

  const runAllPipeline = async () => {
    if (!confirm('전체 파이프라인을 시작하시겠습니까?')) return;
    setIsLoading(true);
    try { await fetch(`${API_BASE}/orchestrator/run`, { method: 'POST' }); }
    catch { alert('서버 연결 실패'); }
    finally { setIsLoading(false); }
  };

  const flowCount = (key: keyof PipelineFlow) => pipelineData?.flow?.[key] ?? 0;

  // 요약 통계
  const completedCount = sortedAgents.filter(a => a.status === 'completed').length;
  const errorCount     = sortedAgents.filter(a => a.status === 'error').length;
  const workingAgent   = sortedAgents.find(a => a.status === 'working');

  if (!isMounted) return <div className="min-h-screen" />;

  return (
    <div className="max-w-full p-2 space-y-3">

      {/* ── 헤더 ── */}
      <div className="neu-raised p-5">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white flex-shrink-0"
              style={{ background: 'linear-gradient(145deg, #059669, #047857)', boxShadow: '4px 4px 10px rgba(5,150,105,0.35), -2px -2px 6px rgba(255,255,255,0.7)' }}
            >
              <FontAwesomeIcon icon={faIndustry} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter" style={{ color: 'var(--neu-text)' }}>LinkDrop V2 통합 관제실</h1>
              <p className="font-bold flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--neu-text-sub)' }}>
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-ping" />
                SYSTEM ONLINE &nbsp;|&nbsp; {agents.length} SKILLS
                {lastCycleTime && (
                  <span className="font-normal ml-2" style={{ color: 'var(--neu-text-sub)' }}>
                    마지막 실행: {new Date(lastCycleTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={runAllPipeline}
              disabled={isLoading}
              className={`neu-btn-accent px-6 py-2.5 font-black text-sm flex items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading
                ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                : <FontAwesomeIcon icon={faPlay} />}
              전 공정 자동 가동
            </button>
            {currentProgress && (
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--neu-accent)' }}>
                {currentProgress}
              </span>
            )}
          </div>
        </div>

        {/* 전체 진행 바 */}
        <div className="mt-4">
          <div className="flex justify-between text-[9px] font-black mb-1 px-0.5" style={{ color: 'var(--neu-text-sub)' }}>
            <span>START</span><span>INGESTION</span><span>VAULT</span><span>ASSEMBLY</span><span>DELIVERY</span><span>FINISH</span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ boxShadow: 'inset 3px 3px 6px #b8bcc2, inset -3px -3px 6px #ffffff' }}
          >
            <div
              className="h-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)' }}
            />
          </div>
        </div>
      </div>

      {/* ── 실시간 데이터 위치 현황 ── */}
      <div className="neu-raised rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FontAwesomeIcon icon={faDatabase} className="text-gray-400 text-xs" />
          <h2 className="text-[11px] font-black text-gray-700 uppercase tracking-widest">실시간 데이터 위치 현황</h2>
          {pipelineData && (
            <span className="ml-auto text-[9px] text-gray-400 font-mono">
              {pipelineData.today_summary.last_run} 기준
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {PIPELINE_STAGES.map((stage, idx) => {
            const count   = flowCount(stage.key as keyof PipelineFlow);
            const isActive = activeCategory === stage.skillCategory;
            return (
              <React.Fragment key={stage.key}>
                <div
                  className="flex-1 min-w-[88px] p-2.5 transition-all duration-500"
                  style={{
                    background: 'var(--neu-bg)',
                    borderRadius: '0.75rem',
                    boxShadow: isActive
                      ? 'inset 4px 4px 8px #b8bcc2, inset -4px -4px 8px #ffffff'
                      : '4px 4px 8px #b8bcc2, -4px -4px 8px #ffffff',
                    transform: isActive ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: isActive ? '#6d28d9' : '#9ca3af' }}
                    >
                      <FontAwesomeIcon icon={stage.icon} className="text-white text-[7px]" />
                    </div>
                    <span className="text-[8px] font-black uppercase truncate" style={{ color: 'var(--neu-text-sub)' }}>{stage.label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0" />}
                  </div>
                  <div className="text-xl font-black leading-none" style={{ color: isActive ? 'var(--neu-accent)' : 'var(--neu-text)' }}>
                    {count.toLocaleString()}
                  </div>
                  <div className="text-[7px] font-bold mt-0.5" style={{ color: 'var(--neu-text-sub)' }}>{isActive ? '처리중' : '건'}</div>
                </div>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <FontAwesomeIcon icon={faArrowRight} className="text-xs flex-shrink-0" style={{ color: 'var(--neu-shadow-d)' }} />
                )}
              </React.Fragment>
            );
          })}
          <div className="ml-2 pl-2" style={{ borderLeft: '1px dashed var(--neu-shadow-d)' }}>
            <div className="min-w-[72px] p-2.5" style={{ background: 'var(--neu-bg)', borderRadius: '0.75rem', boxShadow: '4px 4px 8px #b8bcc2, -4px -4px 8px #ffffff' }}>
              <div className="flex items-center gap-1 mb-1">
                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: '#ef4444' }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-white text-[7px]" />
                </div>
                <span className="text-[8px] font-black uppercase" style={{ color: 'var(--neu-red)' }}>폐기</span>
              </div>
              <div className="text-xl font-black leading-none" style={{ color: 'var(--neu-red)' }}>{flowCount('discarded').toLocaleString()}</div>
              <div className="text-[7px] font-bold mt-0.5" style={{ color: 'var(--neu-text-sub)' }}>건</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 파이프라인 실행 현황 ── */}
      <div className="neu-raised rounded-xl overflow-hidden">

        {/* 섹션 헤더 + 요약 배너 */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
          <FontAwesomeIcon icon={faShieldAlt} className="text-gray-400 text-xs" />
          <h2 className="text-[11px] font-black text-gray-700 uppercase tracking-widest">파이프라인 실행 현황</h2>
          <div className="ml-auto flex items-center gap-2">
            {errorCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-[9px] font-black rounded-full animate-pulse">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-[8px]" />
                오류 {errorCount}건 감지
              </span>
            )}
            {workingAgent && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-[9px] font-black rounded-full">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[8px]" />
                {workingAgent.name.split('_')[1] ?? workingAgent.name} 실행중
              </span>
            )}
            <span className="text-[9px] text-gray-400 font-mono">
              {completedCount} / {sortedAgents.length} 완료
            </span>
          </div>
        </div>

        {/* 플로우 다이어그램 (수평 체인) */}
        {sortedAgents.length > 0 && (
          <div className="px-4 py-3 overflow-x-auto border-b border-gray-100">
            <div className="flex items-center gap-0 min-w-max">
              {sortedAgents.map((agent, idx) => {
                const s        = STATUS_STYLE[agent.status];
                const isError  = agent.status === 'error';
                const isWork   = agent.status === 'working';
                const isDone   = agent.status === 'completed';
                const isBlocked = errorIdx !== -1 && idx > errorIdx && agent.status === 'idle';

                // 연결선 색상: 앞 스킬이 완료면 파란색, 에러면 빨간색, 나머지 회색
                const prevDone = idx > 0 && sortedAgents[idx - 1].status === 'completed';
                const prevErr  = idx > 0 && sortedAgents[idx - 1].status === 'error';
                const lineColor = prevErr ? 'bg-red-300' : prevDone ? 'bg-blue-300' : 'bg-gray-200';

                return (
                  <React.Fragment key={agent.id}>
                    {idx > 0 && (
                      <div className="flex items-center flex-shrink-0 w-6">
                        <div className={`h-0.5 w-full ${lineColor} transition-colors duration-500`} />
                        <FontAwesomeIcon icon={faChevronRight} className={`text-[8px] flex-shrink-0 -ml-1 ${
                          prevErr ? 'text-red-300' : prevDone ? 'text-blue-300' : 'text-gray-200'
                        }`} />
                      </div>
                    )}
                    <div className={`flex-shrink-0 w-[90px] rounded-lg border-2 p-2 transition-all duration-400 ${s.border} ${s.bg} ${
                      isError ? 'shadow-red-200 shadow-md' : isWork ? 'shadow-green-200 shadow-md' : ''
                    } ${isBlocked ? 'opacity-40' : ''}`}>
                      {/* 아이콘 + 번호 */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[8px] font-black text-gray-400 font-mono">#{agent.label_number}</span>
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                          isError ? 'bg-red-500' : isWork ? 'bg-green-500' : isDone ? 'bg-blue-500' : 'bg-gray-300'
                        }`}>
                          <FontAwesomeIcon
                            icon={isWork ? faSpinner : isError ? faExclamationTriangle : isDone ? faCheckCircle : agent.icon}
                            className={`text-white text-[7px] ${isWork ? 'animate-spin' : ''}`}
                          />
                        </div>
                      </div>
                      {/* 스킬 이름 */}
                      <div className={`text-[8px] font-black leading-tight truncate ${s.text}`} title={agent.name}>
                        {agent.name.replace(/^\d+_/, '')}
                      </div>
                      {/* 상태 표시 */}
                      <div className={`mt-1.5 text-center text-[7px] font-black px-1 py-0.5 rounded ${
                        isError  ? 'bg-red-500 text-white animate-pulse' :
                        isWork   ? 'bg-green-500 text-white' :
                        isDone   ? 'bg-blue-100 text-blue-700' :
                        isBlocked ? 'bg-gray-200 text-gray-400' :
                                   'bg-gray-100 text-gray-400'
                      }`}>
                        {isBlocked ? '차단됨' : s.label}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* 상세 리스트 */}
        <div className="divide-y divide-gray-100">
          {sortedAgents.map((agent, idx) => {
            const s         = STATUS_STYLE[agent.status];
            const isError   = agent.status === 'error';
            const isWork    = agent.status === 'working';
            const isBlocked = errorIdx !== -1 && idx > errorIdx && agent.status === 'idle';

            return (
              <div
                key={agent.id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors duration-300 ${
                  isError   ? 'bg-red-50'   :
                  isWork    ? 'bg-green-50' :
                  agent.status === 'completed' ? 'bg-blue-50' :
                  isBlocked ? 'bg-gray-50 opacity-60' :
                  'bg-white hover:bg-gray-50'
                }`}
              >
                {/* 상태 세로 바 */}
                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                  isError ? 'bg-red-500 animate-pulse' :
                  isWork  ? 'bg-green-500 animate-pulse' :
                  agent.status === 'completed' ? 'bg-blue-400' :
                  'bg-gray-200'
                }`} />

                {/* 번호 배지 */}
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black flex-shrink-0 ${
                  isError ? 'bg-red-500 text-white' :
                  isWork  ? 'bg-green-500 text-white' :
                  agent.status === 'completed' ? 'bg-blue-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {agent.label_number}
                </span>

                {/* 아이콘 */}
                <FontAwesomeIcon
                  icon={agent.icon}
                  className={`w-4 flex-shrink-0 ${
                    isError ? 'text-red-400' :
                    isWork  ? 'text-green-500 animate-pulse' :
                    agent.status === 'completed' ? 'text-blue-400' :
                    'text-gray-300'
                  }`}
                />

                {/* 이름 + 설명 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-black ${s.text}`}>{agent.name}</span>
                    {isWork && (
                      <span className="px-1.5 py-0.5 bg-green-500 text-white text-[7px] font-black rounded-full uppercase animate-pulse">
                        LIVE
                      </span>
                    )}
                    {isBlocked && (
                      <span className="flex items-center gap-0.5 text-[8px] text-gray-400 font-bold">
                        <FontAwesomeIcon icon={faLock} className="text-[7px]" /> 앞 단계 오류로 중단
                      </span>
                    )}
                    {isError && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-[8px] font-black rounded border border-red-300">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-[7px]" />
                        이 단계에서 오류 발생 — 파이프라인 중단
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5 truncate">{agent.description}</p>
                </div>

                {/* 상태 배지 */}
                <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black ${
                  isError ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse' :
                  isWork  ? 'bg-green-100 text-green-700 border border-green-300' :
                  agent.status === 'completed' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                  isBlocked ? 'bg-gray-100 text-gray-400' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  <FontAwesomeIcon
                    icon={s.icon}
                    className={`text-[8px] ${isWork ? 'animate-spin' : ''}`}
                  />
                  {isBlocked ? '차단됨' : s.label}
                </div>

                {/* LV 배지 */}
                <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] font-black ${
                  isError ? 'bg-red-200 text-red-800' :
                  isWork  ? 'bg-green-200 text-green-800' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  LV.{agent.category}
                </span>
              </div>
            );
          })}

          {sortedAgents.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400 text-xs">
              API 서버에 연결할 수 없습니다. 백엔드(port 8000)를 확인하세요.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
