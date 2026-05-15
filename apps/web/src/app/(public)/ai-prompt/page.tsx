'use client';
import "@/styles/pages/ai-prompt.css";
import { useState, useEffect, useRef } from 'react';
import { useSession } from '@/hooks/useSession';
import dynamic from 'next/dynamic';
import AiTabBar from './_components/AiTabBar';
import AiSidebar from './_components/AiSidebar';
import AiPromptCard from './_components/AiPromptCard';
import {
  type Tab, type Category, type Prompt,
  BRAND_SUBCATEGORIES, BRAND_SUBCAT, BUYER_ROLES,
  getHintColors, getHintText,
} from './_components/aiPromptConstants';

const PromptTabImage = dynamic(
  () => import('./_components/PromptTabImage'),
  { ssr: false, loading: () => <div className="aip-loading-text-muted">불러오는 중…</div> }
);

export default function AiPromptPage() {
  const { role, loading: authLoading } = useSession();
  const isBuyer = !authLoading && BUYER_ROLES.has(role ?? '');

  const [activeTab,      setActiveTab]      = useState<Tab>('image');
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

  const currentCards: Prompt[] =
    activeTab === 'prompts' ? prompts.filter(p => p.cat === activecat) :
    activeTab === 'dark'    ? darkPrompts :
    brandPrompts.filter(p => BRAND_SUBCAT[p.code] === activeBrandCat);

  const activeCat         = promptCats.find(c => c.id === activecat) ?? promptCats[0];
  const activeBrandCatObj = BRAND_SUBCATEGORIES.find(c => c.id === activeBrandCat) ?? BRAND_SUBCATEGORIES[0];
  const totalCount =
    activeTab === 'prompts' ? prompts.filter(p => p.cat !== 'cat12' && p.cat !== 'cat13').length :
    activeTab === 'dark'    ? darkPrompts.length : brandPrompts.length;

  const headerIcon  = activeTab === 'prompts' ? (activeCat?.icon ?? '💬') : activeTab === 'dark' ? '💀' : activeBrandCatObj.icon;
  const headerLabel = activeTab === 'prompts' ? (activeCat?.label ?? '') : activeTab === 'dark' ? '다크경제학' : activeBrandCatObj.label;

  function switchTab(tab: Tab) {
    setActiveTab(tab); setExpandedId(null); setLockedId(null); setSidebarOpen(false);
    mainRef.current?.scrollTo({ top: 0 }); window.scrollTo({ top: 0 });
  }
  function selectCat(id: string) {
    setActivecat(id); setExpandedId(null); setLockedId(null); setSidebarOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  }
  function handleCardClick(code: string) {
    if (authLoading) return;
    if (isBuyer) { setLockedId(null); setExpandedId(prev => prev === code ? null : code); }
    else         { setExpandedId(null); setLockedId(prev => prev === code ? null : code); }
  }
  function handleCopy(code: string, body: string) {
    navigator.clipboard.writeText(body.replace(/\\n/g, '\n')).then(() => {
      setCopiedId(code);
      setTimeout(() => setCopiedId(null), 1800);
    });
  }

  const sidebarItems =
    activeTab === 'prompts'
      ? promptCats.map(c => ({ id: c.id, icon: c.icon, label: c.label, count: prompts.filter(p => p.cat === c.id).length, active: c.id === activecat, onClick: () => selectCat(c.id) }))
      : activeTab === 'dark'
      ? [{ id: 'cat12', icon: '💀', label: '다크경제학', count: darkPrompts.length, active: true, onClick: () => {} }]
      : BRAND_SUBCATEGORIES.map(c => ({ id: c.id, icon: c.icon, label: c.label, count: brandPrompts.filter(p => BRAND_SUBCAT[p.code] === c.id).length, active: c.id === activeBrandCat, onClick: () => setActiveBrandCat(c.id) }));

  return (
    <>
      <div className="lg-bg aip-blob-bg">
        <div className="lg-blob lg-blob-1" /><div className="lg-blob lg-blob-2" /><div className="lg-blob lg-blob-3" />
      </div>

      <div className="aip-root">
        <AiTabBar activeTab={activeTab} onSwitch={switchTab} />

        {sidebarOpen && <div className="aip-overlay" onClick={() => setSidebarOpen(false)} />}

        <button onClick={() => setSidebarOpen(v => !v)} className={`aip-fab${activeTab === 'image' ? ' aip-fab-hidden' : ''}`} aria-label="카테고리 열기">
          {sidebarOpen ? '✕' : '☰'}
        </button>

        {activeTab === 'image' && <div className="aip-image-tab-wrap"><PromptTabImage /></div>}

        <div className={`aip-content-wrap${activeTab === 'image' ? ' aip-hidden' : ''}`}>
          <div className="aip-content-inner">
            <AiSidebar items={sidebarItems} isOpen={sidebarOpen} dataLoading={dataLoading} totalCount={totalCount} hintColors={getHintColors(activeTab)} hintText={getHintText(activeTab)} activeTab={activeTab} />

            <main ref={mainRef} className="aip-main">
              <div className="aip-main-header">
                <div className="aip-main-header-row">
                  <span className="aip-main-header-icon">{headerIcon}</span>
                  <h1 className="aip-main-heading">{headerLabel}</h1>
                  <span className="aip-main-count-badge">{currentCards.length}개</span>
                  {activeTab === 'brand' && <span className="aip-brand-badge">ChatGPT 4o · 이미지 업로드 필요</span>}
                </div>
                <div className="aip-main-divider" />
              </div>

              {dataLoading ? (
                <div className="aip-loading-text">불러오는 중…</div>
              ) : (
                <div className="aip-card-list">
                  {currentCards.map(p => (
                    <AiPromptCard key={p.code} prompt={p} isExpanded={expandedId === p.code} isLocked={lockedId === p.code} isCopied={copiedId === p.code} isBuyer={isBuyer} authLoading={authLoading} onCardClick={handleCardClick} onCopy={handleCopy} />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
