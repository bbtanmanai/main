'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup, faCheckCircle, faTimesCircle, faSearch,
  faChevronLeft, faChevronRight, faSyncAlt, faEye, faTimes
} from '@fortawesome/free-solid-svg-icons';

// ── 상수 ──────────────────────────────────────────────────────────────────────
const TEMPLATES = [
  'health-senior', 'stock-news', 'tech-trend', 'wisdom-quotes', 'lifestyle',
  'shorts-viral', 'insta-marketing', 'blog-seo', 'ai-video-ads',
  'ai-business', 'digital-product', 'workflow',
];
const STYLES = ['ranking', 'storytelling', 'qa', 'comparison', 'expert', 'before_after'];

const TEMPLATE_LABELS: Record<string, string> = {
  'health-senior': '건강/시니어', 'stock-news': '재테크', 'tech-trend': '기술트렌드',
  'wisdom-quotes': '지혜/명언', 'lifestyle': '라이프스타일', 'shorts-viral': '쇼츠바이럴',
  'insta-marketing': '인스타마케팅', 'blog-seo': '블로그SEO', 'ai-video-ads': 'AI영상광고',
  'ai-business': 'AI비즈니스', 'digital-product': '디지털상품', 'workflow': '워크플로우',
};
const STYLE_LABELS: Record<string, string> = {
  'ranking': '랭킹형', 'storytelling': '스토리텔링', 'qa': 'Q&A',
  'comparison': '비교형', 'expert': '전문가형', 'before_after': '비포/애프터',
};

interface Scenario {
  id: string;
  template_id: string;
  style: string;
  topic: string;
  hook: string;
  scene_count: number;
  estimated_sec: number;
  viral_seed: number;
  used: boolean;
  used_at: string | null;
  created_at: string;
}

interface Stats {
  stats: Record<string, Record<string, { total: number; available: number }>>;
  total: number;
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
export default function ScenarioFactoryPage() {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);

  const [filterTemplate, setFilterTemplate] = useState('');
  const [filterStyle, setFilterStyle]       = useState('');
  const [filterUsed, setFilterUsed]         = useState('');

  const [preview, setPreview]   = useState<Scenario | null>(null);

  // 통계 로드
  const loadStats = useCallback(async () => {
    const res = await fetch('/api/admin/scenarios?stats=1');
    const data = await res.json();
    setStats(data);
  }, []);

  // 목록 로드
  const loadList = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (filterTemplate) params.set('template', filterTemplate);
    if (filterStyle)    params.set('style', filterStyle);
    if (filterUsed)     params.set('used', filterUsed);
    const res = await fetch(`/api/admin/scenarios?${params}`);
    const data = await res.json();
    setScenarios(data.data || []);
    setTotal(data.count || 0);
    setPage(p);
    setLoading(false);
  }, [filterTemplate, filterStyle, filterUsed]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadList(1); }, [filterTemplate, filterStyle, filterUsed]);

  const totalPages = Math.ceil(total / 20);

  // 전체 가용 재고 합산
  const totalAvailable = stats
    ? Object.values(stats.stats).reduce((sum, styles) =>
        sum + Object.values(styles).reduce((s, v) => s + v.available, 0), 0)
    : 0;
  const totalAll = stats?.total || 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <FontAwesomeIcon icon={faLayerGroup} className="text-blue-500" />
            시나리오 팩토리
          </h1>
          <p className="text-sm text-slate-500 mt-1">Supabase scenarios 테이블 실시간 재고 현황</p>
        </div>
        <button
          onClick={() => { loadStats(); loadList(page); }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-all"
        >
          <FontAwesomeIcon icon={faSyncAlt} /> 새로고침
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="총 시나리오" value={totalAll.toLocaleString()} color="blue" />
        <SummaryCard label="사용 가능 재고" value={totalAvailable.toLocaleString()} color="green" />
        <SummaryCard label="사용 완료" value={(totalAll - totalAvailable).toLocaleString()} color="slate" />
      </div>

      {/* 재고 히트맵 */}
      {stats && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest">템플릿 × 스타일 재고 현황</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-2 text-left font-black text-slate-500 uppercase tracking-wider">템플릿</th>
                  {STYLES.map(s => (
                    <th key={s} className="px-3 py-2 text-center font-black text-slate-500 uppercase tracking-wider">
                      {STYLE_LABELS[s]}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center font-black text-slate-500">합계</th>
                </tr>
              </thead>
              <tbody>
                {TEMPLATES.map(tmpl => {
                  const tmplData = stats.stats[tmpl] || {};
                  const tmplTotal = Object.values(tmplData).reduce((s, v) => s + v.available, 0);
                  return (
                    <tr key={tmpl} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2 font-bold text-slate-700">
                        {TEMPLATE_LABELS[tmpl] || tmpl}
                      </td>
                      {STYLES.map(style => {
                        const v = tmplData[style];
                        const avail = v?.available || 0;
                        const bg = avail >= 30 ? 'bg-emerald-100 text-emerald-700' :
                                   avail > 0   ? 'bg-amber-100 text-amber-700' :
                                                 'bg-red-100 text-red-600';
                        return (
                          <td key={style} className="px-3 py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full font-black text-[11px] ${bg}`}>
                              {avail}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center font-black text-slate-600">{tmplTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 필터 + 목록 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <FontAwesomeIcon icon={faSearch} className="text-slate-400" />
          <select
            value={filterTemplate}
            onChange={e => setFilterTemplate(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 bg-white"
          >
            <option value="">전체 템플릿</option>
            {TEMPLATES.map(t => <option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>)}
          </select>
          <select
            value={filterStyle}
            onChange={e => setFilterStyle(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 bg-white"
          >
            <option value="">전체 스타일</option>
            {STYLES.map(s => <option key={s} value={s}>{STYLE_LABELS[s]}</option>)}
          </select>
          <select
            value={filterUsed}
            onChange={e => setFilterUsed(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 bg-white"
          >
            <option value="">전체 상태</option>
            <option value="false">사용 가능</option>
            <option value="true">사용 완료</option>
          </select>
          <span className="ml-auto text-xs text-slate-400 font-bold">총 {total.toLocaleString()}개</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 font-black uppercase tracking-wider">
                <th className="px-4 py-3 text-left">주제</th>
                <th className="px-3 py-3 text-center">템플릿</th>
                <th className="px-3 py-3 text-center">스타일</th>
                <th className="px-3 py-3 text-center">씬수</th>
                <th className="px-3 py-3 text-center">예상시간</th>
                <th className="px-3 py-3 text-center">바이럴</th>
                <th className="px-3 py-3 text-center">상태</th>
                <th className="px-3 py-3 text-center">미리보기</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 font-bold">로딩 중...</td></tr>
              ) : scenarios.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 font-bold">데이터 없음</td></tr>
              ) : scenarios.map(s => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-800 max-w-xs truncate">{s.topic}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[11px] font-black">
                      {TEMPLATE_LABELS[s.template_id] || s.template_id}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[11px] font-black">
                      {STYLE_LABELS[s.style] || s.style}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-600">{s.scene_count}</td>
                  <td className="px-3 py-3 text-center text-slate-500">{s.estimated_sec?.toFixed(0)}초</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`font-black text-xs ${s.viral_seed >= 8 ? 'text-red-500' : s.viral_seed >= 7 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {s.viral_seed?.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {s.used ? (
                      <span className="flex items-center justify-center gap-1 text-slate-400 text-xs font-bold">
                        <FontAwesomeIcon icon={faTimesCircle} /> 사용됨
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-black">
                        <FontAwesomeIcon icon={faCheckCircle} /> 가용
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => setPreview(s)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-xs font-bold transition-all"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => loadList(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg text-sm font-bold text-slate-600 transition-all"
            >
              <FontAwesomeIcon icon={faChevronLeft} /> 이전
            </button>
            <span className="text-sm font-bold text-slate-500">{page} / {totalPages}</span>
            <button
              onClick={() => loadList(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg text-sm font-bold text-slate-600 transition-all"
            >
              다음 <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
      </div>

      {/* 스크립트 미리보기 모달 */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900">{preview.topic}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {TEMPLATE_LABELS[preview.template_id]} · {STYLE_LABELS[preview.style]} · {preview.scene_count}씬 · {preview.estimated_sec?.toFixed(0)}초
                </p>
              </div>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600 text-xl">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            {preview.hook && (
              <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
                <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Hook</p>
                <p className="text-sm font-bold text-amber-800">{preview.hook}</p>
              </div>
            )}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <ScriptPreview id={preview.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 스크립트 미리보기 (별도 fetch) ────────────────────────────────────────────
function ScriptPreview({ id }: { id: string }) {
  const [script, setScript] = useState('');
  useEffect(() => {
    fetch(`/api/admin/scenarios/script?id=${id}`)
      .then(r => r.json())
      .then(d => setScript(d.script || ''));
  }, [id]);
  if (!script) return <p className="text-slate-400 text-sm">로딩 중...</p>;
  return (
    <pre className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-mono">{script}</pre>
  );
}

// ── 요약 카드 ──────────────────────────────────────────────────────────────────
function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue:  'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}
