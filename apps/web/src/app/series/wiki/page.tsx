'use client';

import React from 'react';

// ── 타입 ─────────────────────────────────────────────────────────────────────
interface WikiPage {
  slug: string;
  title: string;
  summary: string;
  updated_at: string;
}

const PAGE_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  world:         { label: '세계관',    color: '#6366f1' },
  character_arc: { label: '인물변화',  color: '#f97316' },
  relationship:  { label: '관계도',    color: '#14b8a6' },
  timeline:      { label: '타임라인',  color: '#8b5cf6' },
  foreshadow:    { label: '복선',      color: '#f59e0b' },
  fact:          { label: '팩트',      color: '#22c55e' },
  prop:          { label: '소품',      color: '#64748b' },
  theme:         { label: '주제',      color: '#a855f7' },
};

function guessType(slug: string): string {
  if (slug.startsWith('character_arcs/')) return 'character_arc';
  const map: Record<string, string> = {
    world: 'world', relationships: 'relationship',
    timeline: 'timeline', foreshadows: 'foreshadow',
    facts: 'fact', props: 'prop', theme: 'theme',
  };
  return map[slug] ?? 'fact';
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
export default function WikiPage() {
  const [seriesId, setSeriesId] = React.useState('');
  const [pages, setPages] = React.useState<WikiPage[]>([]);
  const [selected, setSelected] = React.useState<WikiPage | null>(null);
  const [content, setContent] = React.useState('');
  const [editing, setEditing] = React.useState(false);
  const [editText, setEditText] = React.useState('');
  const [log, setLog] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'wiki' | 'log'>('wiki');
  const [filterType, setFilterType] = React.useState<string>('all');
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // sessionStorage에서 series_id 복원
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('series_world');
      if (raw) {
        const w = JSON.parse(raw);
        const sid = w.seriesId ?? w.topic ?? '';
        if (sid) setSeriesId(sid);
      }
    } catch { /* ignore */ }
  }, []);

  // series_id 확정 시 페이지 목록 로드
  React.useEffect(() => {
    if (!seriesId) return;
    loadPages();
  }, [seriesId]);

  async function loadPages() {
    setLoading(true);
    try {
      const res = await fetch(`/api/wiki/${encodeURIComponent(seriesId)}/pages`);
      const data = await res.json();
      setPages(data.pages ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function loadPage(page: WikiPage) {
    setSelected(page);
    setEditing(false);
    try {
      const res = await fetch(`/api/wiki/${encodeURIComponent(seriesId)}/pages/${page.slug}`);
      const data = await res.json();
      setContent(data.content_md ?? '');
      setEditText(data.content_md ?? '');
    } catch { setContent('(불러오기 실패)'); }
  }

  async function loadLog() {
    try {
      const res = await fetch(`/api/wiki/${encodeURIComponent(seriesId)}/log`);
      const data = await res.json();
      setLog(data.content ?? '');
    } catch { setLog('(불러오기 실패)'); }
  }

  async function savePage() {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`/api/wiki/${encodeURIComponent(seriesId)}/pages/${selected.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_md: editText }),
      });
      setContent(editText);
      setEditing(false);
      loadPages();
    } catch { /* ignore */ } finally { setSaving(false); }
  }

  // ── 필터링 ────────────────────────────────────────────────────────────────
  const filtered = filterType === 'all'
    ? pages
    : pages.filter(p => guessType(p.slug) === filterType);

  const typeKeys = ['all', ...Object.keys(PAGE_TYPE_LABEL)];

  // ── 렌더 ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f4ff 0%,#faf5ff 50%,#f0fdf4 100%)', paddingTop: 64 }}>

      {/* 헤더 */}
      <div style={{
        position: 'sticky', top: 52, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.3)',
        background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)',
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: '#4c1d95' }}>📖 시리즈 위키</span>
        <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>{seriesId || '—'}</span>
        <button onClick={loadPages} style={{
          marginLeft: 'auto', fontSize: 12, color: '#7c3aed',
          background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 8, padding: '4px 14px', cursor: 'pointer',
        }}>새로고침</button>
        <button
          onClick={() => { setActiveTab('log'); loadLog(); }}
          style={{
            fontSize: 12, color: '#6b7280',
            background: activeTab === 'log' ? 'rgba(107,114,128,0.12)' : 'transparent',
            border: '1px solid rgba(107,114,128,0.2)', borderRadius: 8, padding: '4px 14px', cursor: 'pointer',
          }}>📋 로그</button>
      </div>

      {/* 바디 */}
      <div style={{ display: 'flex', gap: 0, maxWidth: 1400, margin: '0 auto', padding: '24px 16px' }}>

        {/* ── 좌측: 페이지 목록 ── */}
        <div style={{ width: 260, flexShrink: 0, marginRight: 20 }}>

          {/* 타입 필터 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {typeKeys.map(t => {
              const meta = PAGE_TYPE_LABEL[t];
              const active = filterType === t;
              return (
                <button key={t} onClick={() => setFilterType(t)} style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, cursor: 'pointer',
                  border: active ? 'none' : '1px solid rgba(0,0,0,0.1)',
                  background: active ? (meta?.color ?? '#4c1d95') : 'rgba(255,255,255,0.7)',
                  color: active ? '#fff' : '#6b7280',
                  boxShadow: active ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                }}>
                  {t === 'all' ? '전체' : meta?.label}
                </button>
              );
            })}
          </div>

          {/* 카드 목록 */}
          {loading ? (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>불러오는 중…</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: '#d1d5db', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
              {seriesId ? '위키 페이지가 없습니다' : '세계관을 먼저 설정하세요'}
            </div>
          ) : filtered.map(page => {
            const type = guessType(page.slug);
            const meta = PAGE_TYPE_LABEL[type];
            const isActive = selected?.slug === page.slug;
            return (
              <div key={page.slug} onClick={() => { setActiveTab('wiki'); loadPage(page); }} style={{
                marginBottom: 8, padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                background: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
                border: isActive ? `1.5px solid ${meta?.color ?? '#7c3aed'}` : '1px solid rgba(255,255,255,0.5)',
                boxShadow: isActive ? `0 4px 16px ${meta?.color ?? '#7c3aed'}33` : '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 9999,
                    background: meta?.color ?? '#7c3aed', color: '#fff',
                  }}>{meta?.label ?? type}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#9ca3af' }}>{page.slug}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1f2937', marginBottom: 2 }}>{page.title}</div>
                {page.summary && (
                  <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {page.summary}
                  </div>
                )}
                <div style={{ fontSize: 10, color: '#d1d5db', marginTop: 4 }}>
                  {new Date(page.updated_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 우측: 콘텐츠 패널 ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeTab === 'log' ? (
            /* 로그 뷰 */
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
              borderRadius: 16, border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: 24,
            }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#374151', marginBottom: 16 }}>📋 작업 로그</div>
              <pre style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {log || '로그가 없습니다.'}
              </pre>
            </div>
          ) : selected ? (
            /* 페이지 뷰 */
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
              borderRadius: 16, border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}>
              {/* 패널 헤더 */}
              <div style={{
                padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                {(() => {
                  const meta = PAGE_TYPE_LABEL[guessType(selected.slug)];
                  return (
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 9999,
                      background: meta?.color ?? '#7c3aed', color: '#fff',
                      boxShadow: `0 2px 8px ${meta?.color ?? '#7c3aed'}55`,
                    }}>{meta?.label}</span>
                  );
                })()}
                <span style={{ fontWeight: 800, fontSize: 16, color: '#1f2937' }}>{selected.title}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#9ca3af' }}>{selected.slug}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  {editing ? (
                    <>
                      <button onClick={() => setEditing(false)} style={{
                        fontSize: 12, color: '#6b7280', background: 'rgba(107,114,128,0.08)',
                        border: '1px solid rgba(107,114,128,0.2)', borderRadius: 8, padding: '5px 14px', cursor: 'pointer',
                      }}>취소</button>
                      <button onClick={savePage} disabled={saving} style={{
                        fontSize: 12, color: '#fff', fontWeight: 700,
                        background: 'linear-gradient(145deg,#7c3aed,#6d28d9)',
                        border: 'none', borderRadius: 8, padding: '5px 16px', cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(124,58,237,0.4)',
                        opacity: saving ? 0.6 : 1,
                      }}>{saving ? '저장 중…' : '저장'}</button>
                    </>
                  ) : (
                    <button onClick={() => setEditing(true)} style={{
                      fontSize: 12, color: '#7c3aed', background: 'rgba(124,58,237,0.08)',
                      border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: '5px 14px', cursor: 'pointer',
                    }}>편집</button>
                  )}
                </div>
              </div>

              {/* 패널 바디 */}
              <div style={{ padding: 24 }}>
                {editing ? (
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    style={{
                      width: '100%', minHeight: 480, fontFamily: 'monospace', fontSize: 13,
                      color: '#1f2937', lineHeight: 1.8, border: '1px solid rgba(124,58,237,0.2)',
                      borderRadius: 10, padding: 16, resize: 'vertical', outline: 'none',
                      background: 'rgba(249,250,251,0.8)',
                    }}
                  />
                ) : (
                  <pre style={{
                    fontSize: 13, color: '#374151', lineHeight: 2,
                    whiteSpace: 'pre-wrap', fontFamily: "'Pretendard','Noto Sans KR',sans-serif",
                  }}>
                    {content || '(내용 없음)'}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            /* 빈 상태 */
            <div style={{
              background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)',
              borderRadius: 16, border: '1px dashed rgba(124,58,237,0.2)',
              padding: 60, textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
              <div style={{ fontSize: 15, color: '#9ca3af', fontWeight: 600 }}>
                왼쪽 목록에서 페이지를 선택하세요
              </div>
              <div style={{ fontSize: 12, color: '#d1d5db', marginTop: 8 }}>
                대본 생성 시 위키가 자동으로 갱신됩니다
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
