'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from '@/hooks/useSession';
import dynamic from 'next/dynamic';

const PromptTabImage = dynamic(
  () => import('./_components/PromptTabImage'),
  { ssr: false, loading: () => (
    <div style={{ padding: 60, textAlign: 'center', color: 'rgba(15,23,42,0.35)', fontSize: '0.9rem' }}>
      불러오는 중…
    </div>
  )}
);

type Tab = 'prompts' | 'dark' | 'brand' | 'image';
type Category = { id: string; icon: string; label: string };
type Prompt = {
  code: string;
  cat: string;
  title: string;
  description: string;
  body?: string | null;
  is_premium: boolean;
};

const BRAND_SUBCATEGORIES = [
  { id: 'brand-kit',      icon: '🏷️', label: '브랜드 시스템' },
  { id: 'brand-digital',  icon: '📱', label: '디지털 채널' },
  { id: 'brand-campaign', icon: '📣', label: '캠페인·경험' },
];

const BRAND_SUBCAT: Record<string, string> = {
  M01: 'brand-kit', M08: 'brand-kit', M10: 'brand-kit',
  M03: 'brand-digital', M05: 'brand-digital', M07: 'brand-digital', M11: 'brand-digital',
  M02: 'brand-campaign', M04: 'brand-campaign', M06: 'brand-campaign',
  M09: 'brand-campaign', M12: 'brand-campaign',
};

const BUYER_ROLES = new Set(['partner', 'gold_partner', 'instructor', 'admin']);

export default function AiPromptPage() {
  const { role, loading: authLoading } = useSession();
  const isBuyer = !authLoading && BUYER_ROLES.has(role ?? '');

  const [activeTab,      setActiveTab]      = useState<Tab>('prompts');
  const [activecat,      setActivecat]      = useState('cat01');
  const [activeBrandCat, setActiveBrandCat] = useState('brand-kit');
  const [copiedId,       setCopiedId]       = useState<string | null>(null);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [expandedId,     setExpandedId]     = useState<string | null>(null);
  const [lockedId,       setLockedId]       = useState<string | null>(null);
  const [categories,     setCategories]     = useState<Category[]>([]);
  const [prompts,        setPrompts]        = useState<Prompt[]>([]);
  const [dataLoading,    setDataLoading]    = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/prompts/categories').then(r => r.json()),
      fetch('/api/prompts').then(r => r.json()),
    ]).then(([cats, ps]: [Category[], Prompt[]]) => {
      setCategories(cats);
      setPrompts(ps);
      const first = cats.find((c: Category) => c.id !== 'cat12' && c.id !== 'cat13');
      if (first) setActivecat(first.id);
      setDataLoading(false);
    }).catch(() => setDataLoading(false));
  }, []);

  useEffect(() => {
    if (!isBuyer && !authLoading) setExpandedId(null);
  }, [isBuyer, authLoading]);

  const promptCats   = categories.filter(c => c.id !== 'cat12' && c.id !== 'cat13');
  const darkPrompts  = prompts.filter(p => p.cat === 'cat12');
  const brandPrompts = prompts.filter(p => p.cat === 'cat13');

  const filteredPrompts = prompts.filter(p => p.cat === activecat);
  const filteredBrand   = brandPrompts.filter(p => BRAND_SUBCAT[p.code] === activeBrandCat);

  const currentCards: Prompt[] =
    activeTab === 'prompts' ? filteredPrompts :
    activeTab === 'dark'    ? darkPrompts     :
    filteredBrand;

  const activeCat         = promptCats.find(c => c.id === activecat) ?? promptCats[0];
  const activeBrandCatObj = BRAND_SUBCATEGORIES.find(c => c.id === activeBrandCat) ?? BRAND_SUBCATEGORIES[0];

  const totalCount =
    activeTab === 'prompts' ? prompts.filter(p => p.cat !== 'cat12' && p.cat !== 'cat13').length :
    activeTab === 'dark'    ? darkPrompts.length :
    brandPrompts.length;

  const headerIcon  =
    activeTab === 'prompts' ? (activeCat?.icon ?? '💬') :
    activeTab === 'dark'    ? '💀' :
    activeBrandCatObj.icon;
  const headerLabel =
    activeTab === 'prompts' ? (activeCat?.label ?? '') :
    activeTab === 'dark'    ? '다크경제학' :
    activeBrandCatObj.label;

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setExpandedId(null);
    setLockedId(null);
    setSidebarOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }

  function selectCat(id: string) {
    setActivecat(id);
    setExpandedId(null);
    setLockedId(null);
    setSidebarOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  }

  function handleCardClick(code: string) {
    if (authLoading) return;
    if (isBuyer) {
      setLockedId(null);
      setExpandedId(prev => prev === code ? null : code);
    } else {
      setExpandedId(null);
      setLockedId(prev => prev === code ? null : code);
    }
  }

  function handleCopy(code: string, body: string) {
    navigator.clipboard.writeText(body.replace(/\\n/g, '\n')).then(() => {
      setCopiedId(code);
      setTimeout(() => setCopiedId(null), 1800);
    });
  }

  type SidebarItem = {
    id: string; icon: string; label: string;
    count: number; active: boolean; onClick: () => void;
  };
  const sidebarItems: SidebarItem[] =
    activeTab === 'prompts'
      ? promptCats.map(c => ({
          id: c.id, icon: c.icon, label: c.label,
          count: prompts.filter(p => p.cat === c.id).length,
          active: c.id === activecat,
          onClick: () => selectCat(c.id),
        }))
      : activeTab === 'dark'
      ? [{ id: 'cat12', icon: '💀', label: '다크경제학', count: darkPrompts.length, active: true, onClick: () => {} }]
      : BRAND_SUBCATEGORIES.map(c => ({
          id: c.id, icon: c.icon, label: c.label,
          count: brandPrompts.filter(p => BRAND_SUBCAT[p.code] === c.id).length,
          active: c.id === activeBrandCat,
          onClick: () => setActiveBrandCat(c.id),
        }));

  /* 사이드바 힌트 — 탭별 색상 분기 (brand 앰버 포함) */
  const hintStyle =
    activeTab === 'brand'
      ? { bg: 'rgba(248,184,77,0.08)', border: 'rgba(248,184,77,0.28)', text: 'rgba(248,184,77,0.85)' }
      : activeTab === 'dark'
      ? { bg: 'rgba(207,81,72,0.08)',  border: 'rgba(207,81,72,0.28)',  text: 'rgba(230,100,90,0.85)' }
      : { bg: 'rgba(94,231,223,0.06)', border: 'rgba(94,231,223,0.15)', text: 'rgba(255,255,255,0.45)' };

  const sidebarHint =
    activeTab === 'dark'  ? '⚠️ 비공개 전용 프롬프트\n외부 공유 시 주의하세요' :
    activeTab === 'brand' ? '📷 ChatGPT 4o 전용\n이미지를 먼저 업로드한\n후 프롬프트를 붙여넣으세요' :
    '[ ] 안에 구체적으로\n채울수록 결과가 달라진다';

  return (
    <>
    {/* Blob 배경 — 다크/라이트 자동 전환 (globals.css .lg-bg/.lg-blob 정의) */}
    <div className="lg-bg" style={{ position: 'fixed' }}>
      <div className="lg-blob lg-blob-1" />
      <div className="lg-blob lg-blob-2" />
      <div className="lg-blob lg-blob-3" />
    </div>

    <div style={{ minHeight: '100vh', paddingTop: 60, background: 'transparent', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

      {/* ── 탭 바 (V3 청록 팔레트) — GNB 아래 sticky 고정 ── */}
      <div
        className="ai-tabbar"
        style={{
          position: 'sticky', top: 60, zIndex: 70,
          borderBottom: '1px solid #999999',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        }}
      >
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 4, padding: '14px 24px 0' }}>
        {([
          { key: 'prompts' as Tab, label: 'AI 프롬프트', icon: '💬' },
          { key: 'dark'    as Tab, label: '다크경제학',  icon: '💀' },
          { key: 'brand'   as Tab, label: '이미지+Brand', icon: '🎨' },
          { key: 'image'   as Tab, label: '이미지 프롬프트', icon: '🖼️' },
        ]).map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`ai-tab-btn${isActive ? ' active' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 18px',
                borderRadius: '10px 10px 0 0',
                border: '1px solid #999999', cursor: 'pointer',
                marginBottom: '-1px',
                fontSize: '0.85rem', fontWeight: isActive ? 600 : 400,
                background: isActive ? 'rgba(94,231,223,0.12)' : 'transparent',
                borderBottom: isActive ? '2px solid #5ee7df' : '1px solid #999999',
                transition: 'all 0.18s',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
      </div>

      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.6)' }}
        />
      )}

      {/* 모바일 FAB (V3 청록→보라 그라디언트) — image 탭에서는 숨김 */}
      <button
        onClick={() => setSidebarOpen(v => !v)}
        className={`ai-fab${activeTab === 'image' ? ' ai-fab-hidden' : ''}`}
        aria-label="카테고리 열기"
        style={{
          display: 'none', position: 'fixed', bottom: 24, right: 24, zIndex: 50,
          width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #5ee7df, #b490f5)',
          color: '#fff',
          fontSize: '1.4rem',
          boxShadow: '0 4px 20px rgba(94,231,223,0.35)',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* 이미지 프롬프트 탭 — 자체 사이드바 포함 */}
      {activeTab === 'image' && (
        <div style={{ flex: 1 }}>
          <PromptTabImage />
        </div>
      )}

      <div style={{ flex: 1, width: '100%', display: activeTab === 'image' ? 'none' : 'block' }}>
      <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto', minHeight: 'calc(100vh - 120px)', position: 'relative' }}>

        {/* ── 사이드바 (V3 glass card 버튼) ── */}
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
          <p
            className="ai-sidebar-cat-label"
            style={{
              fontSize: '0.72rem', fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              margin: '0 0 12px', paddingLeft: 12,
            }}
          >
            카테고리 · {dataLoading ? '…' : `${totalCount}개`} 프롬프트
          </p>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={item.onClick}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 12, width: '100%', textAlign: 'left',
                  border: item.active
                    ? '1px solid rgba(94,231,223,0.55)'
                    : '1px solid #999999',
                  background: item.active
                    ? 'linear-gradient(135deg, rgba(94,231,223,0.28) 0%, rgba(180,144,245,0.22) 100%)'
                    : 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                  boxShadow: item.active
                    ? '0 4px 20px rgba(255,255,255,0.10), inset 0 1px 0 rgba(94,231,223,0.35), 0 0 20px rgba(94,231,223,0.10)'
                    : '0 4px 20px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.18)',
                  cursor: item.active ? 'default' : 'pointer',
                  transition: 'transform 360ms cubic-bezier(0.22,0.68,0,1.2), box-shadow 360ms, background 360ms, border-color 360ms',
                }}
                onMouseEnter={e => {
                  if (!item.active) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'rgba(255,255,255,0.20)';
                    el.style.transform = 'translateY(-2px)';
                    el.style.boxShadow = '0 8px 32px rgba(255,255,255,0.13), inset 0 1px 0 rgba(255,255,255,0.28)';
                    el.style.borderColor = '#bbbbbb';
                  }
                }}
                onMouseLeave={e => {
                  if (!item.active) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'rgba(255,255,255,0.12)';
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = '0 4px 20px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.18)';
                    el.style.borderColor = '#999999';
                  }
                }}
              >
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className={`ai-sidebar-item-name${item.active ? ' active' : ''}`}
                    style={{
                      fontSize: '0.82rem', fontWeight: item.active ? 600 : 400,
                      lineHeight: 1.3, letterSpacing: '-0.1px',
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    className={`ai-sidebar-item-count${item.active ? ' active' : ''}`}
                    style={{ fontSize: '0.68rem', marginTop: 2 }}
                  >
                    프롬프트 총 {item.count}개
                  </div>
                </div>
                {item.active && (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: '#5ee7df', boxShadow: '0 0 8px rgba(94,231,223,0.8)',
                  }} />
                )}
              </button>
            ))}
          </nav>

          {/* 탭별 힌트 박스 (brand 앰버 포함) */}
          <div style={{
            marginTop: 12, padding: '10px 12px', borderRadius: 10,
            background: hintStyle.bg, border: `1px solid ${hintStyle.border}`,
          }}>
            <p
              className={activeTab === 'prompts' ? 'ai-hint-prompts' : undefined}
              style={{
                fontSize: '0.72rem', margin: 0, lineHeight: 1.7,
                color: hintStyle.text, whiteSpace: 'pre-line',
              }}
            >
              {sidebarHint}
            </p>
          </div>
        </aside>

        {/* ── 메인 콘텐츠 (V3 라이트 그라디언트) ── */}
        <main
          ref={mainRef}
          style={{
            flex: 1, minWidth: 0,
            paddingTop: 36, paddingBottom: 80, paddingLeft: 40, paddingRight: 40,
            background: `
              radial-gradient(ellipse 90% 70% at 10% 65%, rgba(180,144,245,0.45) 0%, transparent 58%),
              radial-gradient(ellipse 80% 65% at 92% 12%, rgba(94,231,223,0.35) 0%, transparent 52%),
              radial-gradient(ellipse 55% 45% at 52% 98%, rgba(247,168,196,0.22) 0%, transparent 48%),
              #f0f4ff
            `,
          }}
        >
          {/* 헤더 */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: '1.4rem' }}>{headerIcon}</span>
              <h1 style={{
                fontSize: '1.35rem', fontWeight: 700,
                color: '#0f172a', margin: 0, letterSpacing: '-0.3px',
              }}>
                {headerLabel}
              </h1>
              <span style={{
                fontSize: '0.72rem', color: 'rgba(15,23,42,0.5)',
                background: 'rgba(15,23,42,0.07)',
                padding: '2px 8px', borderRadius: 99, marginLeft: 4,
              }}>
                {currentCards.length}개
              </span>
              {activeTab === 'brand' && (
                <span style={{
                  fontSize: '0.68rem', color: 'rgba(180,120,0,0.75)',
                  background: 'rgba(248,184,77,0.14)',
                  border: '1px solid rgba(248,184,77,0.35)',
                  padding: '2px 8px', borderRadius: 99, marginLeft: 2,
                }}>
                  ChatGPT 4o · 이미지 업로드 필요
                </span>
              )}
            </div>
            <div style={{ height: 1, background: 'rgba(15,23,42,0.09)', marginTop: 16 }} />
          </div>

          {/* 카드 목록 */}
          {dataLoading ? (
            <div style={{ color: 'rgba(15,23,42,0.4)', fontSize: '0.9rem', paddingTop: 40, textAlign: 'center' }}>
              불러오는 중…
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {currentCards.map(p => {
                const isExpanded = expandedId === p.code;
                const isLocked   = lockedId === p.code;
                const isOpen     = isExpanded || isLocked;
                return (
                  <div
                    key={p.code}
                    style={{
                      background: 'rgba(255,255,255,0.48)',
                      border: `1px solid ${
                        isExpanded ? 'rgba(8,145,178,0.35)' :
                        isLocked   ? 'rgba(255,180,0,0.3)'  :
                        'rgba(15,23,42,0.12)'
                      }`,
                      borderRadius: 14, overflow: 'hidden',
                      transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.85)',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = 'rgba(255,255,255,0.65)';
                      el.style.borderColor = isExpanded ? 'rgba(8,145,178,0.5)' : isLocked ? 'rgba(255,180,0,0.45)' : 'rgba(15,23,42,0.20)';
                      el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.92)';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = 'rgba(255,255,255,0.48)';
                      el.style.borderColor = isExpanded ? 'rgba(8,145,178,0.35)' : isLocked ? 'rgba(255,180,0,0.3)' : 'rgba(15,23,42,0.12)';
                      el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.85)';
                    }}
                  >
                    {/* 카드 헤더 */}
                    <div
                      onClick={() => handleCardClick(p.code)}
                      style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                    >
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700, color: '#0891b2',
                        background: 'rgba(8,145,178,0.12)',
                        border: '1px solid rgba(8,145,178,0.25)',
                        padding: '3px 8px', borderRadius: 6,
                        letterSpacing: '0.04em', flexShrink: 0,
                      }}>
                        #{p.code}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>
                          {p.title}
                        </div>
                        <div style={{
                          fontSize: '0.75rem', color: 'rgba(15,23,42,0.55)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {p.description}
                        </div>
                      </div>
                      {/* 🔒 잠금 아이콘 — 비구매회원 표시 (lock UI, 유지) */}
                      {!isBuyer && !authLoading && (
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,180,0,0.7)', flexShrink: 0 }} title="멤버십 전용">
                          🔒
                        </span>
                      )}
                      <span style={{
                        color: 'rgba(15,23,42,0.3)', fontSize: '0.75rem',
                        display: 'inline-block',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s', flexShrink: 0,
                      }}>
                        ▾
                      </span>
                    </div>

                    {/* 본문 — 구매회원 (V3 라이트 스타일) */}
                    {isExpanded && p.body && (
                      <div style={{
                        borderTop: '1px solid rgba(15,23,42,0.09)',
                        padding: '16px 20px',
                        background: 'rgba(15,23,42,0.03)',
                      }}>
                        <pre style={{
                          margin: 0,
                          fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
                          fontSize: '0.84rem', lineHeight: 1.75,
                          color: 'rgba(15,23,42,0.75)',
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                          {p.body.replace(/\\n/g, '\n')}
                        </pre>
                        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleCopy(p.code, p.body!)}
                            style={{
                              padding: '8px 20px', borderRadius: 8,
                              border: '1px solid', cursor: 'pointer',
                              borderColor: copiedId === p.code ? 'rgba(8,145,178,0.45)' : 'rgba(15,23,42,0.18)',
                              background: copiedId === p.code ? 'rgba(8,145,178,0.1)' : 'rgba(15,23,42,0.06)',
                              color: copiedId === p.code ? '#0891b2' : 'rgba(15,23,42,0.65)',
                              fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.15s',
                            }}
                          >
                            {copiedId === p.code ? '✓ 클립보드에 복사됨' : '프롬프트 복사하기'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── 잠금 안내 — 비구매회원 (lock UI, 변경 없음) ── */}
                    {isLocked && (
                      <div style={{
                        borderTop: '1px solid rgba(255,180,0,0.2)',
                        padding: '18px 20px',
                        background: 'rgba(255,180,0,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                      }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.83rem', fontWeight: 600, color: '#0f172a' }}>
                            멤버십 전용 프롬프트입니다
                          </p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: 'rgba(15,23,42,0.55)' }}>
                            전체 프롬프트를 복사·활용하려면 LinkDrop 멤버십이 필요합니다.
                          </p>
                        </div>
                        <a
                          href="/checkout/order"
                          style={{
                            flexShrink: 0, padding: '8px 18px', borderRadius: 8,
                            background: 'rgba(255,180,0,0.15)',
                            border: '1px solid rgba(255,180,0,0.5)',
                            color: 'rgb(255,180,0)', fontSize: '0.8rem', fontWeight: 600,
                            textDecoration: 'none', whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,180,0,0.25)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,180,0,0.15)'}
                        >
                          멤버십 시작하기 →
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
      </div>

      <style>{`
        .ai-sidebar { scrollbar-width: none; -ms-overflow-style: none; }
        .ai-sidebar::-webkit-scrollbar { display: none; }

        /* ── 탭 버튼 색상 (다크 기본) ── */
        .ai-tab-btn { color: rgba(255,255,255,0.5); }
        .ai-tab-btn.active { color: #5ee7df; }

        /* ── 사이드바 텍스트 (다크 기본) ── */
        .ai-sidebar-cat-label { color: rgba(255,255,255,0.35); }
        .ai-sidebar-item-name { color: rgba(255,255,255,0.85); }
        .ai-sidebar-item-name.active { color: #5ee7df; }
        .ai-sidebar-item-count { color: rgba(255,255,255,0.35); }
        .ai-sidebar-item-count.active { color: rgba(94,231,223,0.55); }

        /* ── 라이트 테마 오버라이드 ── */
        [data-theme="light"] .ai-tabbar {
          background: rgba(255,255,255,0.82) !important;
          border-bottom-color: rgba(15,23,42,0.10) !important;
        }
        [data-theme="light"] .ai-sidebar {
          border-right-color: rgba(15,23,42,0.12) !important;
        }
        [data-theme="light"] .ai-tab-btn {
          color: rgba(15,23,42,0.55);
          border-color: rgba(15,23,42,0.15) !important;
        }
        [data-theme="light"] .ai-tab-btn.active {
          color: #0891b2;
          border-color: rgba(8,145,178,0.35) !important;
          border-bottom-color: #0891b2 !important;
          background: rgba(8,145,178,0.10) !important;
        }
        [data-theme="light"] .ai-sidebar-cat-label { color: rgba(15,23,42,0.45); }
        [data-theme="light"] .ai-sidebar-item-name { color: rgba(15,23,42,0.80); }
        [data-theme="light"] .ai-sidebar-item-name.active { color: #0891b2; }
        [data-theme="light"] .ai-sidebar-item-count { color: rgba(15,23,42,0.45); }
        [data-theme="light"] .ai-sidebar-item-count.active { color: rgba(8,145,178,0.65); }
        [data-theme="light"] .ai-hint-prompts { color: rgba(15,23,42,0.55) !important; }

        .ai-fab-hidden { display: none !important; }

        @media (max-width: 768px) {
          .ai-fab { display: flex !important; }
          .ai-sidebar {
            position: fixed !important; top: 0 !important; left: 0 !important;
            bottom: 0 !important; width: 280px !important; z-index: 50;
            height: 100vh !important; padding-top: 80px !important;
            transform: translateX(-100%); transition: transform 0.25s ease;
            background: rgba(10,10,20,0.92) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
          }
          .ai-sidebar.open { transform: translateX(0); }
          main { padding-left: 20px !important; padding-right: 20px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ai-sidebar { transition: none !important; }
          button { transition: none !important; }
        }
      `}</style>
    </div>
    </>
  );
}
