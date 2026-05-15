type Prompt = {
  code: string;
  cat: string;
  title: string;
  description: string;
  body?: string | null;
  is_premium: boolean;
};

type Props = {
  prompt: Prompt;
  isExpanded: boolean;
  isLocked: boolean;
  isCopied: boolean;
  isBuyer: boolean;
  authLoading: boolean;
  onCardClick: (code: string) => void;
  onCopy: (code: string, body: string) => void;
};

export default function AiPromptCard({
  prompt: p, isExpanded, isLocked, isCopied,
  isBuyer, authLoading, onCardClick, onCopy,
}: Props) {
  const isOpen = isExpanded || isLocked;
  return (
    <div className={`aip-prompt-card${isExpanded ? ' expanded' : isLocked ? ' locked' : ''}`}>
      <div className="aip-prompt-card-header" onClick={() => onCardClick(p.code)}>
        <span className="aip-prompt-card-code">#{p.code}</span>
        <div className="aip-prompt-card-body">
          <div className="aip-prompt-card-title">{p.title}</div>
          <div className="aip-prompt-card-desc">{p.description}</div>
        </div>
        {!isBuyer && !authLoading && (
          <span className="aip-prompt-card-lock" title="멤버십 전용">🔒</span>
        )}
        <span className={`aip-prompt-card-arrow${isOpen ? ' open' : ''}`}>▾</span>
      </div>

      {isExpanded && p.body && (
        <div className="aip-prompt-card-content">
          <pre className="aip-prompt-card-pre">{p.body.replace(/\\n/g, '\n')}</pre>
          <div className="aip-prompt-card-copy-row">
            <button
              onClick={() => onCopy(p.code, p.body!)}
              className={`aip-copy-btn${isCopied ? ' copied' : ''}`}
            >
              {isCopied ? '✓ 클립보드에 복사됨' : '프롬프트 복사하기'}
            </button>
          </div>
        </div>
      )}

      {isLocked && (
        <div className="aip-locked-panel">
          <div>
            <p className="aip-locked-title">멤버십 전용 프롬프트입니다</p>
            <p className="aip-locked-desc">전체 프롬프트를 복사·활용하려면 LinkDrop 멤버십이 필요합니다.</p>
          </div>
          <a href="/checkout/order" className="aip-locked-cta">멤버십 시작하기 →</a>
        </div>
      )}
    </div>
  );
}
