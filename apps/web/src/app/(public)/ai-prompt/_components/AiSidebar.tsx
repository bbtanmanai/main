type Tab = 'prompts' | 'dark' | 'brand' | 'image';

export type SidebarItem = {
  id: string;
  icon: string;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
};

type HintColors = { bg: string; border: string; text: string };

type Props = {
  items: SidebarItem[];
  isOpen: boolean;
  dataLoading: boolean;
  totalCount: number;
  hintColors: HintColors;
  hintText: string;
  activeTab: Tab;
};

export default function AiSidebar({ items, isOpen, dataLoading, totalCount, hintColors, hintText, activeTab }: Props) {
  return (
    <aside className={`aip-sidebar${isOpen ? ' open' : ''}`}>
      <p className="aip-sidebar-cat-label">
        카테고리 · {dataLoading ? '…' : `${totalCount}개`} 프롬프트
      </p>
      <nav className="aip-nav">
        {items.map(item => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`aip-nav-item${item.active ? ' active' : ''}`}
          >
            <span className="aip-nav-item-icon">{item.icon}</span>
            <div className="aip-nav-item-body">
              <div className={`aip-nav-item-name${item.active ? ' active' : ''}`}>{item.label}</div>
              <div className={`aip-nav-item-count${item.active ? ' active' : ''}`}>프롬프트 총 {item.count}개</div>
            </div>
            {item.active && <div className="aip-nav-item-dot" />}
          </button>
        ))}
      </nav>
      {/* hintColors는 activeTab 기반 JS 계산값이므로 인라인 style 허용 */}
      <div
        className="aip-hint-box"
        style={{ background: hintColors.bg, border: `1px solid ${hintColors.border}` }}
      >
        <p
          className={`aip-hint-text${activeTab === 'prompts' ? ' ai-hint-prompts' : ''}`}
          style={{ color: hintColors.text }}
        >
          {hintText}
        </p>
      </div>
    </aside>
  );
}
