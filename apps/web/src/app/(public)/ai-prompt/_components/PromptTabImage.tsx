'use client';
import { useState, useEffect, useCallback } from 'react';
import ImagePromptCard, { type ImgPromptItem, type CatLabelMap } from './ImagePromptCard';
import ImagePromptModal from './ImagePromptModal';

type CategoryItem = { id: string; label: string; emoji: string; count: number };

export default function PromptTabImage() {
  const [items, setItems]             = useState<ImgPromptItem[]>([]);
  const [total, setTotal]             = useState(0);
  const [categories, setCategories]   = useState<CategoryItem[]>([]);
  const [categoryLabels, setCatLabels] = useState<CatLabelMap>({});
  const [activeCat, setActiveCat]     = useState<string | null>(null);
  const [featured, setFeatured]       = useState(false);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<ImgPromptItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/img-prompts/categories')
      .then((r) => r.json())
      .then((cats: CategoryItem[]) => {
        setCategories(cats);
        const map: CatLabelMap = {};
        for (const c of cats) map[c.id] = { label: c.label, emoji: c.emoji };
        setCatLabels(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCat) params.set('cat', activeCat);
    if (featured)  params.set('featured', 'true');
    params.set('page', String(page));
    params.set('page_size', '20');

    fetch(`/api/img-prompts?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { total: number; page: number; page_size: number; items: ImgPromptItem[] }) => {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeCat, featured, page]);

  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleCatClick = useCallback((id: string | null) => {
    setActiveCat(id);
    setPage(1);
    setSidebarOpen(false);
  }, []);

  const activeCatLabel = activeCat ? (categoryLabels[activeCat]?.label ?? activeCat) : '전체';

  return (
    <div style={{ flex: 1, minHeight: 'calc(100vh - 140px)', position: 'relative' }}>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.6)' }}
        />
      )}

      {/* 모바일 FAB — 이미지 프롬프트 전용 */}
      <button
        onClick={() => setSidebarOpen(v => !v)}
        className="img-prompt-fab"
        aria-label="카테고리 열기"
        style={{
          display: 'none', position: 'fixed', bottom: 24, right: 24, zIndex: 50,
          width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #5ee7df, #b490f5)',
          color: '#fff', fontSize: '1.4rem',
          boxShadow: '0 4px 20px rgba(94,231,223,0.35)',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

      {/* ── 사이드바 ── */}
      <aside
        className={`ai-sidebar${sidebarOpen ? ' open' : ''}`}
        style={{
          width: 260, flexShrink: 0,
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.12)',
          position: 'sticky', top: 108, height: 'calc(100vh - 108px)',
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
          padding: '20px',
        }}
      >
        <p className="ai-sidebar-cat-label" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px', paddingLeft: 12 }}>
          이미지 프롬프트 · {loading ? '…' : `${total}개`}
        </p>

        <button
          onClick={() => { setFeatured((v) => !v); setPage(1); }}
          style={{
            width: '100%', padding: '7px 12px', marginBottom: 12,
            borderRadius: 10, fontSize: '0.78rem', fontWeight: 500,
            border: featured ? '1px solid rgba(248,184,77,0.55)' : '1px solid rgba(255,255,255,0.14)',
            background: featured ? 'rgba(248,184,77,0.14)' : 'rgba(255,255,255,0.06)',
            color: featured ? 'rgba(248,184,77,0.95)' : 'rgba(255,255,255,0.55)',
            cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.18s',
          }}
        >
          ★ 추천 프롬프트만
        </button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <SidebarCatBtn id={null} label="전체" emoji="" count={loading ? 0 : total} active={activeCat === null} onClick={() => handleCatClick(null)} />
          {categories.map((cat) => (
            <SidebarCatBtn key={cat.id} id={cat.id} label={cat.label} emoji={cat.emoji} count={cat.count} active={activeCat === cat.id} onClick={() => handleCatClick(cat.id)} />
          ))}
        </nav>

        <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(94,231,223,0.06)', border: '1px solid rgba(94,231,223,0.15)' }}>
          <p style={{ fontSize: '0.72rem', margin: 0, lineHeight: 1.7, color: 'rgba(255,255,255,0.45)' }}>
            변수를 직접 입력하고<br />ChatGPT 또는 AI로 다듬기
          </p>
        </div>
      </aside>

      {/* ── 메인 그리드 ── */}
      <main style={{
        flex: 1, minWidth: 0,
        paddingTop: 36, paddingBottom: 80, paddingLeft: 40, paddingRight: 40,
        background: `
          radial-gradient(ellipse 90% 70% at 10% 65%, rgba(180,144,245,0.45) 0%, transparent 58%),
          radial-gradient(ellipse 80% 65% at 92% 12%, rgba(94,231,223,0.35) 0%, transparent 52%),
          radial-gradient(ellipse 55% 45% at 52% 98%, rgba(247,168,196,0.22) 0%, transparent 48%),
          #f0f4ff
        `,
      }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: '1.4rem' }}>🖼️</span>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              {activeCatLabel}
            </h1>
            <span style={{ fontSize: '0.72rem', color: 'rgba(15,23,42,0.5)', background: 'rgba(15,23,42,0.07)', padding: '2px 8px', borderRadius: 99 }}>
              {loading ? '…' : `${total}개`}
            </span>
            {featured && (
              <span style={{
                fontSize: '0.68rem', color: 'rgba(180,120,0,0.75)',
                background: 'rgba(248,184,77,0.14)', border: '1px solid rgba(248,184,77,0.35)',
                padding: '2px 8px', borderRadius: 99,
              }}>★ 추천만</span>
            )}
          </div>
          <div style={{ height: 1, background: 'rgba(15,23,42,0.09)', marginTop: 16 }} />
        </div>

        {loading ? (
          <div style={{ color: 'rgba(15,23,42,0.4)', fontSize: '0.9rem', paddingTop: 40, textAlign: 'center' }}>불러오는 중…</div>
        ) : items.length === 0 ? (
          <div style={{ color: 'rgba(15,23,42,0.4)', fontSize: '0.9rem', paddingTop: 40, textAlign: 'center' }}>결과가 없습니다</div>
        ) : (
          <>
            <div className="img-prompt-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {items.map((item) => (
                <ImagePromptCard key={item.id} item={item} catLabels={categoryLabels} onClick={() => setSelected(item)} />
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 40 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{
                    padding: '7px 16px', borderRadius: 8, fontSize: '0.82rem',
                    border: '1px solid rgba(15,23,42,0.18)', background: 'rgba(255,255,255,0.7)',
                    color: page <= 1 ? 'rgba(15,23,42,0.25)' : 'rgba(15,23,42,0.70)',
                    cursor: page <= 1 ? 'default' : 'pointer',
                  }}
                >이전</button>
                <span style={{ fontSize: '0.82rem', color: 'rgba(15,23,42,0.60)' }}>{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{
                    padding: '7px 16px', borderRadius: 8, fontSize: '0.82rem',
                    border: '1px solid rgba(15,23,42,0.18)', background: 'rgba(255,255,255,0.7)',
                    color: page >= totalPages ? 'rgba(15,23,42,0.25)' : 'rgba(15,23,42,0.70)',
                    cursor: page >= totalPages ? 'default' : 'pointer',
                  }}
                >다음</button>
              </div>
            )}
          </>
        )}
      </main>

      </div>{/* /maxWidth 1200 wrapper */}

      {selected && (
        <ImagePromptModal item={selected} categoryLabels={categoryLabels} onClose={() => setSelected(null)} />
      )}

      <style>{`
        [data-theme="light"] .img-prompt-fab {
          background: rgba(255,255,255,0.95) !important;
          border: 1px solid rgba(8,145,178,0.35) !important;
          color: #0891b2 !important;
          box-shadow: 0 4px 20px rgba(8,145,178,0.22) !important;
        }
        @media (max-width: 768px) {
          .img-prompt-fab { display: flex !important; }
        }
        @media (max-width: 600px) {
          .img-prompt-grid { grid-template-columns: 1fr !important; }
          .img-prompt-card-img { width: 120px !important; height: 120px !important; min-width: 120px !important; }
        }
      `}</style>
    </div>
  );
}

function SidebarCatBtn({ id, label, emoji, count, active, onClick }: {
  id: string | null; label: string; emoji: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 12, width: '100%', textAlign: 'left',
        border: active ? '1px solid rgba(94,231,223,0.55)' : '1px solid #999999',
        background: active
          ? 'linear-gradient(135deg, rgba(94,231,223,0.28) 0%, rgba(180,144,245,0.22) 100%)'
          : 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        boxShadow: active
          ? '0 4px 20px rgba(255,255,255,0.10), inset 0 1px 0 rgba(94,231,223,0.35), 0 0 20px rgba(94,231,223,0.10)'
          : '0 4px 20px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.18)',
        cursor: active ? 'default' : 'pointer',
        transition: 'transform 360ms cubic-bezier(0.22,0.68,0,1.2), box-shadow 360ms, background 360ms, border-color 360ms',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLElement;
          el.style.background = 'rgba(255,255,255,0.20)';
          el.style.transform = 'translateY(-2px)';
          el.style.borderColor = '#bbbbbb';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLElement;
          el.style.background = 'rgba(255,255,255,0.12)';
          el.style.transform = 'translateY(0)';
          el.style.borderColor = '#999999';
        }
      }}
    >
      {emoji && <span style={{ fontSize: '1rem', flexShrink: 0 }}>{emoji}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={`ai-sidebar-item-name${active ? ' active' : ''}`} style={{ fontSize: '0.82rem', fontWeight: active ? 600 : 400, lineHeight: 1.3, letterSpacing: '-0.1px' }}>
          {label}
        </div>
        <div className={`ai-sidebar-item-count${active ? ' active' : ''}`} style={{ fontSize: '0.68rem', marginTop: 2 }}>
          {count}개
        </div>
      </div>
      {active && (
        <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: '#5ee7df', boxShadow: '0 0 8px rgba(94,231,223,0.8)' }} />
      )}
    </button>
  );
}
