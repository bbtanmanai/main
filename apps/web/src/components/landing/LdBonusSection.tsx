'use client';
import Image from "next/image";
import LdPromptPreview from "@/components/landing/LdPromptPreview";
import bonusData from "@/data/bonuses.json";

type BundleItem = { icon: string; title: string; value?: number };

type Bonus = {
  id: number;
  icon: string;
  tag: string;
  title: string;
  desc: string;
  image?: string;
  includes?: BundleItem[];
  value: number;
  priceless: boolean;
  bundle: boolean;
};

const commonBonuses = bonusData as Bonus[];

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

// ── 통일 카드 컴포넌트 ────────────────────────────────────────
function BonusCard({ bonus }: { bonus: Bonus }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        transition: "border-color 0.25s, box-shadow 0.25s, transform 0.25s",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "rgba(111,255,0,0.45)";
        el.style.boxShadow = "0 12px 48px rgba(111,255,0,0.18), 0 4px 16px rgba(0,0,0,0.50)";
        el.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "rgba(255,255,255,0.10)";
        el.style.boxShadow = "none";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* 코너 리본 — 바깥 래퍼는 overflow:visible 이므로 음수 좌표도 보임 */}
      <Image
        className="ld-va-badge"
        src={`/img/bonus/va_0${bonus.id}_anwansoon.png`}
        alt=""
        width={200}
        height={200}
      />

      {/* 안쪽: overflow:hidden 으로 카드 내용 클리핑 */}
      <div style={{ borderRadius: 16, overflow: "hidden", background: "#111111" }}>
        <div className="ld-bonus-card-inner">
          {/* 이미지 영역 — 좌측 */}
          <div className="ld-bonus-img" style={{ background: "#1a1a1a" }}>
            {bonus.image ? (
              <Image
                src={bonus.image}
                alt={bonus.title}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <span style={{ fontSize: "2.8rem" }}>{bonus.icon}</span>
                <span style={{
                  fontSize: "0.65rem", color: "rgba(255,255,255,0.22)",
                  fontFamily: "Pretendard Variable, Pretendard, sans-serif",
                }}>이미지 준비중</span>
              </div>
            )}
          </div>

          {/* 텍스트 영역 — 우측 */}
          <div className="ld-bonus-body">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: "0.60rem", fontWeight: 800, letterSpacing: "0.10em",
                color: "#010828", background: "#6fff00",
                padding: "3px 8px", borderRadius: 4,
                fontFamily: "Pretendard Variable, Pretendard, sans-serif",
              }}>
                BONUS #{String(bonus.id).padStart(2, "0")}
              </span>
              <span style={{
                fontSize: "0.63rem", fontWeight: 600,
                color: "rgba(255,255,255,0.38)",
                fontFamily: "Pretendard Variable, Pretendard, sans-serif",
              }}>
                {bonus.tag}
              </span>
            </div>

            <h3 style={{
              margin: 0, fontSize: "1.05rem", fontWeight: 700,
              color: "rgba(255,255,255,0.92)", lineHeight: 1.4,
              fontFamily: "Pretendard Variable, Pretendard, sans-serif",
            }}>
              {bonus.title}
            </h3>

            <p style={{
              margin: 0,
              fontSize: "0.82rem", color: "rgba(255,255,255,0.42)",
              lineHeight: 1.65,
              fontFamily: "Pretendard Variable, Pretendard, sans-serif",
            }}>
              {bonus.desc}
            </p>

            {bonus.includes && bonus.includes.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: bonus.includes.length > 12 ? "1fr 1fr" : "1fr",
                gap: "6px 12px",
                paddingTop: 10,
                borderTop: "1px solid rgba(255,255,255,0.07)",
              }}>
                {bonus.includes.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      background: "rgba(111,255,0,0.12)",
                      border: "1px solid rgba(111,255,0,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.55rem", color: "#6fff00", fontWeight: 800,
                    }}>✓</span>
                    <span style={{
                      fontSize: "0.72rem", color: "rgba(255,255,255,0.60)",
                      fontFamily: "Pretendard Variable, Pretendard, sans-serif",
                    }}>
                      {item.icon} {item.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)",
              marginTop: "auto",
            }}>
              <span style={{
                fontSize: "0.65rem", color: "rgba(255,255,255,0.30)",
                fontFamily: "Pretendard Variable, Pretendard, sans-serif",
              }}>
                가치추정가
              </span>
              <span style={{
                fontSize: "1rem", fontWeight: 700,
                color: "#DDDDDD",
                fontFamily: "Pretendard Variable, Pretendard, sans-serif",
                textDecoration: "line-through",
                textDecorationColor: "#ef4444",
                textDecorationThickness: "2px",
              }}>
                {formatKRW(bonus.value)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function LdBonusSection() {
  const bonuses: Bonus[] = commonBonuses;
  const totalValue = bonuses.reduce((sum, b) => sum + (b.value ?? 0), 0);

  return (
    <section style={{ padding: "80px 24px" }}>
      <style>{`
        .ld-bonus-grid { display: flex; flex-direction: column; gap: 16px; }
        .ld-bonus-card-inner { display: flex; flex-direction: row; aspect-ratio: 16/9; }
        .ld-bonus-img { position: relative; width: 50%; flex-shrink: 0; }
        .ld-bonus-body { width: 50%; flex-shrink: 0; padding: 22px 24px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; scrollbar-width: none; }
        .ld-bonus-body::-webkit-scrollbar { display: none; }
        .ld-va-badge { position: absolute; top: -10px; left: -10px; z-index: 10; width: 200px; height: 200px; pointer-events: none; }
        @media (max-width: 640px) {
          .ld-bonus-card-inner { flex-direction: column; aspect-ratio: 9/16; }
          .ld-bonus-img { width: 100%; flex: 0 0 42%; }
          .ld-bonus-body { width: 100%; flex: 1; overflow-y: auto; }
          .ld-va-badge { width: 200px; height: 200px; top: -10px; left: -10px; }
        }
      `}</style>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* 프롬프트 라이브러리 */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "6px 16px", borderRadius: 999,
              background: "rgba(111,255,0,0.10)",
              border: "1px solid rgba(111,255,0,0.35)",
              fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em",
              color: "#6fff00",
              fontFamily: "Pretendard Variable, Pretendard, sans-serif",
            }}>
              <span style={{ fontSize: "1rem" }}>💬</span>
              ChatGPT 프롬프트
            </span>
          </div>
          <LdPromptPreview />
        </div>

        {/* 섹션 헤더 */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{
            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em",
            color: "#6fff00", textTransform: "uppercase", margin: "0 0 14px",
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
          }}>
            독점 보너스 혜택
          </p>
          <h2 style={{
            fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)", fontWeight: 800,
            margin: "0 0 16px", lineHeight: 1.5,
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
            letterSpacing: "-0.3px",
          }}>
            <span style={{
              display: "inline",
              color: "rgba(255,255,255,0.95)",
              background: "rgba(0,0,0,0.82)",
              padding: "2px 10px",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}>
              멤버십 하나로
            </span>
            <br />
            <span style={{
              display: "inline",
              background: "rgba(0,0,0,0.82)",
              padding: "2px 10px",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}>
              <span style={{ color: "#6fff00" }}>완벽한 무기고</span>
              <span style={{ color: "rgba(255,255,255,0.95)" }}>를 드립니다</span>
            </span>
          </h2>
          <p style={{
            fontSize: "0.95rem", margin: 0,
            fontFamily: "Pretendard Variable, Pretendard, sans-serif", lineHeight: 2,
          }}>
            <span style={{
              display: "inline",
              color: "rgba(255,255,255,0.80)",
              background: "rgba(0,0,0,0.82)",
              padding: "2px 10px",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}>
              오늘 링크드랍 멤버십을 시작하시면 프롬프트 라이브러리뿐만 아니라
              <br />
              콘텐츠 창작에 필요한 모든 리소스를 함께 제공합니다.
            </span>
          </p>
        </div>

        {/* 카드 그리드 */}
        <div className="ld-bonus-grid">
          {bonuses.map(bonus => (
            <BonusCard key={bonus.id} bonus={bonus} />
          ))}
        </div>

        {/* 총 가치 요약 */}
        <div style={{
          marginTop: 40, padding: "28px 32px",
          background: "#111111",
          border: "1px solid rgba(111,255,0,0.22)",
          borderRadius: 16,
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 8, textAlign: "center",
          boxShadow: "0 0 40px rgba(111,255,0,0.06)",
        }}>
          <p style={{
            margin: 0, fontSize: "0.8rem",
            color: "rgba(255,255,255,0.45)",
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
          }}>
            모든 보너스의 총 가치추정가
          </p>
          <p style={{
            margin: 0,
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800,
            color: "#DDDDDD", lineHeight: 1,
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
            letterSpacing: "-0.5px",
            textDecoration: "line-through",
            textDecorationColor: "#ef4444",
            textDecorationThickness: "3px",
          }}>
            {formatKRW(totalValue)} 이상
          </p>
          <p style={{
            margin: 0, fontSize: "0.82rem",
            color: "rgba(255,255,255,0.38)",
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
          }}>
            멤버십 가입 시 전부 무료 제공
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <a
            href="/checkout/order"
            style={{
              display: "inline-block",
              padding: "18px 48px", borderRadius: 12,
              background: "#6fff00", color: "#010828",
              fontSize: "1.05rem", fontWeight: 800,
              fontFamily: "Pretendard Variable, Pretendard, sans-serif",
              textDecoration: "none", letterSpacing: "-0.2px",
              boxShadow: "0 4px 24px rgba(111,255,0,0.35)",
              transition: "box-shadow 0.2s, transform 0.2s",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.boxShadow = "0 8px 40px rgba(111,255,0,0.55)";
              el.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.boxShadow = "0 4px 24px rgba(111,255,0,0.35)";
              el.style.transform = "translateY(0)";
            }}
          >
            지금 바로 보너스 전부 받기 →
          </a>
          <p style={{
            marginTop: 12, fontSize: "0.78rem",
            color: "rgba(255,255,255,0.30)",
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
          }}>
            1회 결제 · 즉시 액세스
          </p>
        </div>

      </div>
    </section>
  );
}
