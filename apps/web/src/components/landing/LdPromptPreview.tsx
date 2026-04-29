'use client';
import { useEffect, useRef, useState } from 'react';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type ImgPrompt = {
  id: string;
  master_no: string;
  title: string;
  description: string;
  thumb_url: string;
  categories: string[];
  featured: boolean;
};

// 애니메이션 4단계: idle → out(퇴장) → entering(진입 초기위치) → in(진입완료)
type AnimState = 'idle' | 'out' | 'entering' | 'in';

const PAGE_SIZE   = 4;
const INTERVAL_MS = 20000;
const OUT_MS      = 260;
const IN_MS       = 340;

function getGridStyle(anim: AnimState): React.CSSProperties {
  switch (anim) {
    case 'out':
      return { opacity: 0, transform: 'translateY(-22px)', transition: `opacity ${OUT_MS}ms ease-in, transform ${OUT_MS}ms ease-in` };
    case 'entering':
      return { opacity: 0, transform: 'translateY(22px)', transition: 'none' };
    case 'in':
      return { opacity: 1, transform: 'translateY(0)', transition: `opacity ${IN_MS}ms ease-out, transform ${IN_MS}ms cubic-bezier(0.2, 0.8, 0.4, 1)` };
    default:
      return { opacity: 1, transform: 'translateY(0)', transition: 'none' };
  }
}

export default function LdPromptPreview() {
  const [prompts, setPrompts]           = useState<ImgPrompt[]>([]);
  const [displayPage, setDisplayPage]   = useState(0);
  const [page, setPage]                 = useState(0);
  const [anim, setAnim]                 = useState<AnimState>('idle');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animLock = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetchedRef.current) {
          fetchedRef.current = true;
          observer.disconnect();
          fetch('/api/img-prompts?page_size=100&page=1')
            .then(r => r.json())
            .then((data: { items: ImgPrompt[] }) => {
              if (Array.isArray(data.items) && data.items.length) {
                setPrompts(shuffle(data.items).slice(0, 20));
              }
            })
            .catch(() => {});
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pageCount = Math.ceil(prompts.length / PAGE_SIZE);

  const slide = (to: number) => {
    if (animLock.current) return;
    animLock.current = true;
    setAnim('out');
    setTimeout(() => {
      setDisplayPage(to);
      setPage(to);
      setAnim('entering');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnim('in');
          setTimeout(() => { setAnim('idle'); animLock.current = false; }, IN_MS);
        });
      });
    }, OUT_MS);
  };

  const startTimer = (from: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let current = from;
    timerRef.current = setInterval(() => {
      const next = (current + 1) % pageCount;
      slide(next);
      current = next;
    }, INTERVAL_MS);
  };

  useEffect(() => {
    if (!prompts.length) return;
    startTimer(0);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [prompts.length]);

  const goToPage = (p: number) => {
    if (p === page || animLock.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    slide(p);
    startTimer(p);
  };

  const cards = prompts.slice(displayPage * PAGE_SIZE, displayPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div ref={containerRef}>
      {prompts.length > 0 && <>
      {/* 2열 × 2행 카드 그리드 */}
      <div style={getGridStyle(anim)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {cards.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'block',
                borderRadius: 14,
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.30)',
                overflow: 'hidden',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-3px)';
                el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.50)';
                el.style.borderColor = 'rgba(94,231,223,0.30)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.30)';
                el.style.borderColor = 'rgba(255,255,255,0.10)';
              }}
            >
              {/* 썸네일 */}
              <div style={{
                width: '100%', aspectRatio: '4/3',
                overflow: 'hidden', background: 'rgba(255,255,255,0.04)',
                position: 'relative',
              }}>
                {p.thumb_url ? (
                  <img
                    src={p.thumb_url}
                    alt={p.title}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2.4rem',
                  }}>🖼️</div>
                )}
                {p.featured && (
                  <span style={{
                    position: 'absolute', top: 7, left: 7,
                    background: 'rgba(248,184,77,0.92)', backdropFilter: 'blur(8px)',
                    borderRadius: 6, padding: '2px 7px',
                    fontSize: '0.65rem', fontWeight: 700, color: '#78350f',
                  }}>★ 추천</span>
                )}
              </div>

              {/* 텍스트 */}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, color: '#5ee7df',
                    background: 'rgba(94,231,223,0.12)',
                    border: '1px solid rgba(94,231,223,0.25)',
                    padding: '2px 7px', borderRadius: 5, letterSpacing: '0.04em',
                  }}>
                    #{p.master_no}
                  </span>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '0.88rem', fontWeight: 600,
                  color: 'rgba(255,255,255,0.88)', lineHeight: 1.45,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as const,
                }}>
                  {p.title}
                </p>
                <p style={{
                  margin: '5px 0 0',
                  fontSize: '0.73rem',
                  color: 'rgba(255,255,255,0.38)', lineHeight: 1.5,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical' as const,
                }}>
                  {p.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 페이지 도트 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 18 }}>
        {Array.from({ length: pageCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => goToPage(i)}
            aria-label={`${i + 1}페이지`}
            style={{
              width: i === page ? 22 : 7, height: 7,
              borderRadius: 4, border: 'none', padding: 0, cursor: 'pointer',
              background: i === page ? '#5ee7df' : 'rgba(255,255,255,0.22)',
              boxShadow: i === page ? '0 0 8px rgba(94,231,223,0.55)' : 'none',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .ld-prompt-grid { transition: none !important; transform: none !important; opacity: 1 !important; }
        }
      `}</style>
      </>}
    </div>
  );
}
