type Tab = 'prompts' | 'dark' | 'brand' | 'image';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'prompts', label: 'AI 프롬프트',   icon: '💬' },
  { key: 'dark',    label: '다크경제학',     icon: '💀' },
  { key: 'brand',   label: '이미지+Brand',  icon: '🎨' },
  { key: 'image',   label: '이미지 프롬프트', icon: '🖼️' },
];

type Props = { activeTab: Tab; onSwitch: (tab: Tab) => void };

export default function AiTabBar({ activeTab, onSwitch }: Props) {
  return (
    <div className="aip-tabbar">
      <div className="aip-tabbar-inner">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => onSwitch(tab.key)}
            className={`aip-tab-btn${activeTab === tab.key ? ' active' : ''}`}
          >
            <span className="aip-tab-btn-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
