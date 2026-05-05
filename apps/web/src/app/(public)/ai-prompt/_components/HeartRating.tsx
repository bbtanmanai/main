'use client';

import "@/styles/pages/ai-prompt.css";

interface Props {
  hearts: number;
  onSet: (n: number) => void;
  overlay?: boolean;
}

export default function HeartRating({ hearts, onSet, overlay = false }: Props) {
  const emptyColor = overlay ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.20)';
  const emptyHover = overlay ? 'rgba(225,29,72,0.70)' : 'rgba(225,29,72,0.45)';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="aip-heart-wrap"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onSet(hearts === n ? 0 : n)}
          className="aip-heart-btn"
          style={{ color: n <= hearts ? '#e11d48' : emptyColor }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.25)';
            if (n > hearts) (e.currentTarget as HTMLElement).style.color = emptyHover;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLElement).style.color = n <= hearts ? '#e11d48' : emptyColor;
          }}
          aria-label={`하트 ${n}개`}
        >
          &#9829;
        </button>
      ))}
    </div>
  );
}
