'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TrendCard {
  keyword: string;
  sources: string[];
}

const MOCK_CARDS: TrendCard[] = [
  { keyword: '부동산 역전세 위기', sources: ['유튜브', '뉴스'] },
  { keyword: '청년 취업난 심화', sources: ['뉴스', '트랜드'] },
  { keyword: 'AI 일자리 대체', sources: ['유튜브', '트랜드'] },
  { keyword: '1인 가구 증가', sources: ['뉴스'] },
  { keyword: '전세 사기 피해', sources: ['유튜브', '뉴스', '트랜드'] },
  { keyword: '저출생 인구 절벽', sources: ['트랜드', '뉴스'] },
];

const SOURCE_COLORS: Record<string, string> = {
  유튜브: 'bg-red-100 text-red-600',
  뉴스:   'bg-blue-100 text-blue-600',
  트랜드: 'bg-green-100 text-green-700',
};

export default function SeriesTrendPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<TrendCard[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  function handleCollect() {
    setLoading(true);
    setCards([]);
    setSelected(null);
    setTimeout(() => {
      setCards(MOCK_CARDS);
      setLoading(false);
    }, 1200);
  }

  function handleNext() {
    if (!selected) return;
    router.push(`/series/world?topic=${encodeURIComponent(selected)}`);
  }

  return (
    <div className="neu-bg py-12 px-4">
      <div className="mx-auto max-w-[640px]">

        {/* A4 용지 */}
        <div className="neu-raised rounded-3xl p-12">

          {/* 헤더 */}
          <div className="mb-8 pb-6" style={{ borderBottom: '1.5px solid #d1d5db' }}>
            <h1 className="text-2xl font-black text-gray-700 mb-1">트랜드 찾기</h1>
            <p className="text-sm text-gray-500">요즘 뜨는 주제를 찾아드립니다</p>
          </div>

          {/* 수집 버튼 */}
          <button
            onClick={handleCollect}
            disabled={loading}
            className="neu-primary-btn neu-btn flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold mb-8"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                수집 중...
              </>
            ) : '수집 시작 ▶'}
          </button>

          {/* 카드 목록 */}
          {cards.length > 0 && (
            <div className="space-y-3">
              {cards.map((card) => {
                const isSelected = selected === card.keyword;
                return (
                  <button
                    key={card.keyword}
                    onClick={() => setSelected(prev => prev === card.keyword ? null : card.keyword)}
                    className={`w-full text-left rounded-2xl px-5 py-4 transition-all neu-btn ${isSelected ? 'neu-inset' : 'neu-raised-sm'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-base font-bold ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                        {card.keyword}
                      </p>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {card.sources.map((src) => (
                        <span key={src} className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[src] ?? 'bg-gray-100 text-gray-500'}`}>
                          {src}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 다음 버튼 */}
          {selected && (
            <div className="mt-8 pt-6" style={{ borderTop: '1.5px solid #d1d5db' }}>
              <button
                onClick={handleNext}
                className="neu-primary-btn neu-btn w-full py-3 rounded-2xl text-sm font-bold"
              >
                세계관으로 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
