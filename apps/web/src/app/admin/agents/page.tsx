
"use client";

import React from 'react';
import { 
  Play, 
  Square, 
  RefreshCcw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Cpu,
  MoreVertical,
  Activity,
  Zap
} from 'lucide-react';

export default function AgentListPage() {
  const agents = [
    { 
      id: "0_source-fetcher", 
      name: "데이터 수집 에이전트", 
      stage: "수집 (Scout)", 
      status: "Running", 
      lastRun: "방금 전", 
      successRate: "98%", 
      color: "blue"
    },
    { 
      id: "1_source-refiner", 
      name: "로컬 룰 검수 에이전트", 
      stage: "정제 (Refine)", 
      status: "Idle", 
      lastRun: "1시간 전", 
      successRate: "94%", 
      color: "emerald"
    },
    { 
      id: "2_content-manager", 
      name: "콘텐츠 패키징 에이전트", 
      stage: "생산 (Produce)", 
      status: "Idle", 
      lastRun: "3시간 전", 
      successRate: "100%", 
      color: "purple"
    },
    { 
      id: "3_drive-syncer", 
      name: "드라이브 동기화 에이전트", 
      stage: "동기화 (Sync)", 
      status: "Error", 
      lastRun: "10분 전", 
      successRate: "89%", 
      color: "rose"
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Zap className="text-blue-600" />
            AI 에이전트 제어 센터
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">전체 파이프라인의 에이전트 가동 상태를 실시간 모니터링합니다.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center gap-2 shadow-lg">
            <RefreshCcw size={14} /> 전체 상태 갱신
          </button>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">에이전트 정보</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">현재 단계</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">가동 상태</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">성공률</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">최근 실행</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">제어</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-inner`}>
                        <Cpu size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{agent.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{agent.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-sm font-bold text-slate-600">{agent.stage}</td>
                  <td className="px-6 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      agent.status === 'Running' ? 'bg-blue-50 text-blue-600 animate-pulse' : 
                      agent.status === 'Error' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: agent.successRate }}></div>
                      </div>
                      <span className="text-xs font-black text-slate-700">{agent.successRate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-xs font-bold text-slate-500">{agent.lastRun}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {agent.status === 'Running' ? (
                        <button className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Square size={18} fill="currentColor" /></button>
                      ) : (
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Play size={18} fill="currentColor" /></button>
                      )}
                      <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><MoreVertical size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
