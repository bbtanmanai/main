'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRss, faMagic, faStar, faClone, faCloudUpload, faTrash, 
  faDownload, faFileAlt, faSyncAlt, faSearch, faExternalLink,
  faFilter, faDatabase, faZap, faChartLine, faClock, faGlobe
} from '@fortawesome/free-solid-svg-icons';

// --- Types ---
interface RefinedItem {
  id: string;
  title: string;
  theme: string;
  score: number;
  status: string;
  collected_at: string;
  url: string;
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
  flow: {
    rss: number;
    refined: number;
    gold: number;
    scripts: number;
    synced: number;
    discarded: number;
  };
  themes: Record<string, any>;
  refined_list: RefinedItem[];
}

const THEME_META: Record<string, { name: string; color: string }> = {
  "AI_TECH": { name: "AI 기술 동향", color: "#4f52ba" },
  "MONETIZATION": { name: "수익화 전략", color: "#10b981" },
  "AUTOMATION": { name: "자동화 도구", color: "#f59e0b" },
  "CONTENT_CREATE": { name: "콘텐츠 제작", color: "#8b5cf6" },
  "GENERAL": { name: "일반 주제", color: "#6b7280" },
};

export default function IntegratedInventory() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const API_URL = "http://localhost:8000/api/v1/inventory/pipeline-status";

  useEffect(() => {
    setIsMounted(true);
    const loadData = async () => {
      try {
        const res = await fetch(`${API_URL}?t=${Date.now()}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Data Load Error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredList = useMemo(() => {
    return data?.refined_list.filter(item => 
      item.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [data, searchTerm]);

  if (isLoading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">통합 공정 데이터 동기화 중...</div>;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
      
      {/* SECTION 1: KPI & Live Pipeline (n8n Style) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 overflow-hidden">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <span className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                <FontAwesomeIcon icon={faChartLine} />
              </span>
              실시간 생산 파이프라인 (Live Flow)
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-tighter">
              Factory Throughput: COLLECT ➡️ REFINE ➡️ TRANSFORM ➡️ CLOUD_SYNC
            </p>
          </div>
          <div className="text-right">
            <span className="bg-green-50 text-green-600 px-4 py-2 rounded-full text-[10px] font-black animate-pulse border border-green-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              LIVE_SYSTEM_CONNECTED
            </span>
            <p className="text-[9px] text-slate-300 mt-2 font-mono uppercase">Last Update: {isMounted ? new Date().toLocaleTimeString() : '--:--'}</p>
          </div>
        </div>

        {/* n8n Nodes */}
        <div className="flex items-center justify-between relative overflow-x-auto pb-6 px-4 gap-2">
          <FlowNode icon={faRss} label="원천 수집" value={data?.flow.rss} color="#4f52ba" active />
          <FlowArrow />
          <FlowNode icon={faMagic} label="AI 정제" value={data?.flow.refined} color="#a855f7" active />
          <FlowArrow />
          <FlowNode icon={faStar} label="Gold 선별" value={data?.flow.gold} color="#f59e0b" active />
          <FlowArrow />
          <FlowNode icon={faClone} label="대본 제조" value={data?.flow.scripts} color="#3b82f6" active />
          <FlowArrow />
          <FlowNode icon={faCloudUpload} label="클라우드 입고" value={data?.flow.synced} color="#10b981" active />
          <FlowArrow />
          <FlowNode icon={faTrash} label="폐기/보류" value={data?.flow.discarded} color="#ef4444" active />
        </div>
      </div>

      {/* SECTION 2: Themes & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Theme Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h4 className="font-black text-slate-800 text-sm mb-6 flex items-center gap-2 uppercase tracking-tight">
            <FontAwesomeIcon icon={faDatabase} className="text-blue-500" /> 테마별 누적 적재 현황
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(data?.themes || {}).map(([key, theme]: [string, any]) => {
              const meta = THEME_META[key] || { name: key, color: '#6b7280' };
              return (
                <div key={key} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-300 transition-all group">
                  <div className="text-[9px] font-black text-slate-400 uppercase mb-1">{key}</div>
                  <div className="text-xs font-black text-slate-700 truncate mb-3 group-hover:text-blue-600">{meta.name}</div>
                  <div className="flex justify-between items-end">
                    <span className="text-xl font-black text-slate-900 leading-none">{theme.drive + theme.notebooklm}</span>
                    <span className="text-[10px] text-green-600 font-bold">+{theme.notebooklm} Sync</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Summary */}
        <div className="bg-slate-900 text-white rounded-2xl shadow-xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-6">Warehouse Summary</h4>
            <div className="space-y-4">
              <SummaryRow label="Total Collected" value={data?.today_summary.total_collected} />
              <SummaryRow label="Gold Insights" value={data?.today_summary.gold_count} highlight />
              <SummaryRow label="Scripts Produced" value={data?.today_summary.scripts_generated} />
              <SummaryRow label="Adoption Rate" value={`${Math.round((data?.flow.gold || 0) / (data?.flow.rss || 1) * 100)}%`} />
            </div>
          </div>
          <FontAwesomeIcon icon={faZap} className="absolute -bottom-4 -right-4 text-white/5 text-9xl rotate-12" />
        </div>
      </div>

      {/* SECTION 3: Detailed Asset Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <FontAwesomeIcon icon={faFileAlt} className="text-blue-600" />
              정제 자산 상세 명부 (Detailed Inventory)
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
              <input 
                type="text" 
                placeholder="제목/테마 검색..."
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64 font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-slate-50 text-slate-500">
              <tr className="border-b border-slate-200 h-10">
                <th className="px-4 w-12 text-center text-[10px] font-black uppercase">No</th>
                <th className="px-4 w-1/3 text-[10px] font-black uppercase">콘텐츠 제목</th>
                <th className="px-4 w-28 text-center text-[10px] font-black uppercase">테마</th>
                <th className="px-4 w-24 text-center text-[10px] font-black uppercase">AI 점수</th>
                <th className="px-4 w-24 text-center text-[10px] font-black uppercase">상태</th>
                <th className="px-4 w-32 text-center text-[10px] font-black uppercase">수집일시</th>
                <th className="px-4 w-16 text-center text-[10px] font-black uppercase">Link</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {filteredList.map((item, index) => (
                <tr key={item.id} className={`h-12 border-b border-slate-100 hover:bg-blue-50/30 transition-colors group cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                  <td className="px-4 text-center text-[10px] font-mono text-slate-400">{index + 1}</td>
                  <td className="px-4">
                    <div className="truncate text-xs font-bold group-hover:text-blue-600 transition-colors">{item.title}</div>
                  </td>
                  <td className="px-4 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-tighter">
                      {item.theme}
                    </span>
                  </td>
                  <td className="px-4 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-10 bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className={`h-full ${item.score >= 7 ? 'bg-amber-500' : 'bg-slate-300'}`} style={{ width: `${item.score * 10}%` }} />
                      </div>
                      <span className={`text-[10px] font-black ${item.score >= 7 ? 'text-amber-600' : 'text-slate-400'}`}>{item.score.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black ${item.status === 'GOLD' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 text-center text-[10px] font-bold text-slate-400">
                    {item.collected_at ? new Date(item.collected_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 text-center">
                    {item.url && (
                      <a href={item.url} target="_blank" className="text-slate-300 hover:text-blue-500 transition-colors">
                        <FontAwesomeIcon icon={faExternalLink} size="xs" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="text-center py-10">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest tracking-tighter">
          LinkDropV2 Integrated Production & Inventory Management System
        </p>
      </footer>
    </div>
  );
}

// --- Sub Components ---

function FlowNode({ icon, label, value, color, active }: any) {
  return (
    <div className="flex flex-col items-center min-w-[110px] flex-1 group">
      <div 
        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-md ${active ? 'animate-pulse hover:scale-110' : 'opacity-40'}`}
        style={{ backgroundColor: active ? `${color}15` : '#f3f4f6', color: active ? color : '#9ca3af', border: active ? `2px solid ${color}30` : '2px solid transparent' }}
      >
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="text-[10px] font-black text-slate-500 mt-4 text-center leading-tight uppercase tracking-tighter">{label}</div>
      <div className="text-lg font-black mt-1" style={{ color: color }}>{value?.toLocaleString() || 0}</div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex-shrink-0 px-1 text-slate-200 text-sm pb-10">
      <FontAwesomeIcon icon={faSyncAlt} className="animate-spin-slow opacity-20 mr-1" />
      <span>→</span>
    </div>
  );
}

function SummaryRow({ label, value, highlight }: any) {
  return (
    <div className="flex justify-between items-center border-b border-white/10 pb-2">
      <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
      <span className={`text-lg font-black ${highlight ? 'text-amber-400' : 'text-white'}`}>{value?.toLocaleString() || 0}</span>
    </div>
  );
}
