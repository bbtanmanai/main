'use client';
import Image from "next/image";
import LdPromptPreview from "@/components/landing/LdPromptPreview";
import LdOnedaySection from "@/components/landing/LdOnedaySection";
import bonusData from "@/data/bonuses.json";
import styles from './LdBonusSection.module.css';

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

function BonusCard({ bonus }: { bonus: Bonus }) {
  return (
    <div className={styles.ldBonusCard}>
      <Image
        className={styles.ldVaBadge}
        src={`/img/bonus/va_0${bonus.id}_anwansoon.png`}
        alt=""
        width={200}
        height={200}
      />
      <div className={styles.ldBonusCardClip}>
        <div className={styles.ldBonusCardInner}>
          <div className={styles.ldBonusImg}>
            {bonus.image ? (
              <Image
                src={bonus.image}
                alt={bonus.title}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            ) : (
              <div className={styles.ldBonusImgFallback}>
                <span className={styles.ldBonusImgFallbackIcon}>{bonus.icon}</span>
                <span className={styles.ldBonusImgFallbackText}>이미지 준비중</span>
              </div>
            )}
          </div>

          <div className={styles.ldBonusBody}>
            <div className={styles.ldBonusHeaderRow}>
              <span className={styles.ldBonusBadge}>
                BONUS #{String(bonus.id).padStart(2, "0")}
              </span>
              <span className={styles.ldBonusTag}>{bonus.tag}</span>
            </div>

            <h3 className={styles.ldBonusTitle}>{bonus.title}</h3>
            <p className={styles.ldBonusDesc}>{bonus.desc}</p>

            {bonus.includes && bonus.includes.length > 0 && (
              <div className={bonus.includes.length > 12 ? styles.ldBonusIncludesDouble : styles.ldBonusIncludesSingle}>
                {bonus.includes.map((item, i) => (
                  <div key={i} className={styles.ldBonusIncludeItem}>
                    <span className={styles.ldBonusCheckBox}>✓</span>
                    <span className={styles.ldBonusIncludeText}>
                      {item.icon} {item.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.ldBonusValueRow}>
              <span className={styles.ldBonusValueLabel}>가치추정가</span>
              <p className={styles.ldBonusValueAmount}>{formatKRW(bonus.value)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LdBonusSection() {
  const bonuses: Bonus[] = commonBonuses;
  const totalValue = bonuses.reduce((sum, b) => sum + (b.value ?? 0), 0);

  return (
    <>
      <LdOnedaySection />
      <section className={styles.ldBonusSection}>
        <div className={styles.ldBonusInner}>

          {/* 프롬프트 라이브러리 */}
          <div className={styles.ldPromptBlock}>
            <div className={styles.ldBonusHeaderWrap}>
              <h2 className={styles.ldBonusH2Prompt}>프롬프트 라이브러리</h2>
              <p className={styles.ldBonusSubPrompt}>
                200개+ 프롬프트 중 랜덤 샘플 — 전체는 멤버십 가입 후 이용 가능합니다
              </p>
            </div>
            <LdPromptPreview />
          </div>

          {/* 보너스 섹션 헤더 */}
          <div className={styles.ldBonusSectionHeaderWrap}>
            <p className={styles.ldBonusEyebrow}>독점 보너스 혜택</p>
            <h2 className={styles.ldBonusH2}>
              <span className={`${styles.ldBonusHighlight} ${styles.ldBonusBrightText}`}>멤버십 하나로</span>
              <br />
              <span className={styles.ldBonusHighlight}>
                <span className={styles.ldBonusNeonText}>완벽한 무기고</span>
                <span className={styles.ldBonusBrightText}>를 드립니다</span>
              </span>
            </h2>
            <p className={styles.ldBonusSub}>
              <span className={`${styles.ldBonusHighlight} ${styles.ldBonusSubText80}`}>
                오늘 링크드랍 멤버십을 시작하시면 프롬프트 라이브러리뿐만 아니라
                <br />
                콘텐츠 창작에 필요한 모든 리소스를 함께 제공합니다.
              </span>
            </p>
          </div>

          {/* 카드 그리드 */}
          <div className={styles.ldBonusGrid}>
            {bonuses.map(bonus => (
              <BonusCard key={bonus.id} bonus={bonus} />
            ))}
          </div>

          {/* 총 가치 요약 */}
          <div className={styles.ldBonusTotalBox}>
            <p className={styles.ldBonusTotalLabel}>모든 보너스의 총 가치추정가</p>
            <p className={styles.ldBonusTotalAmount}>{formatKRW(totalValue)} 이상</p>
            <p className={styles.ldBonusTotalDesc}>멤버십 가입 시 전부 무료 제공</p>
          </div>

          {/* CTA */}
          <div className={styles.ldBonusCtaWrap}>
            <a href="/checkout/order" className={styles.ldBonusCtaBtn}>
              지금 바로 보너스 전부 받기 →
            </a>
            <p className={styles.ldBonusCtaNote}>1회 결제 · 즉시 액세스</p>
          </div>

        </div>
      </section>
    </>
  );
}
