'use client';

import { useRef } from 'react';
import styles from './LdOnedaySection.module.css';
import projectList from '@/data/project_list.json';

type Project = {
  num: string;
  icon: string;
  title: string;
  sub: string;
  desc: string;
  href: string;
  status: string;
};

function OnedayCard({ num, icon, title, sub, desc, href, status }: Project) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  function handleMouseMove(e: React.MouseEvent) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--glare-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--glare-y', `${e.clientY - rect.top}px`);
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.removeProperty('--glare-x');
    card.style.removeProperty('--glare-y');
  }

  const isSoon = status === 'soon';

  return (
    <a
      ref={cardRef}
      href={isSoon ? undefined : href}
      className={`${styles.ldOnedayCard}${isSoon ? ` ${styles.ldOnedayCardSoon}` : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-disabled={isSoon}
    >
      <span className={styles.ldOnedayCardBgNum} aria-hidden="true">{num}</span>
      <div className={styles.ldOnedayCardGlare} aria-hidden="true" />
      <div className={styles.ldOnedayCardIconWrap}>
        <span className={styles.ldOnedayCardIcon}>{icon}</span>
      </div>
      <h3 className={styles.ldOnedayCardTitle}>{title}</h3>
      <p className={styles.ldOnedayCardSub}>{sub}</p>
      <p className={styles.ldOnedayCardDesc}>{desc}</p>
      <div className={styles.ldOnedayCardFooter}>
        <div className={`${styles.ldOnedayStatus} ${isSoon ? styles.ldOnedayStatusSoon : styles.ldOnedayStatusActive}`}>
          <span className={styles.ldOnedayStatusDot} />
          {isSoon ? '준비 중' : '운영 중'}
        </div>
        {!isSoon && (
          <span className={styles.ldOnedayCardLink}>자세히 →</span>
        )}
      </div>
    </a>
  );
}

export default function LdOnedaySection() {
  const projects = projectList as Project[];

  return (
    <section className={styles.ldOnedaySection}>
      <div className={styles.ldOnedayInner}>

        {/* 섹션 헤더 */}
        <div className={styles.ldOnedayHeaderWrap}>
          <p className={styles.ldOnedayEyebrow}>ONE-DAY CLASS</p>
          <h2 className={styles.ldOnedayH2}>
            <span className={styles.ldOnedayHighlight}>다 같이 하루 만에</span>
            <br />
            실제로 만들어봅니다
          </h2>
          <p className={styles.ldOnedaySub}>
            링크드랍 파트너와 함께하는 소규모 원데이 클래스.<br />
            12가지 프로젝트 중 하나를 골라 온·오프라인으로 참여하세요.
          </p>
        </div>

        {/* 그리드 헤더 */}
        <div className={styles.ldOnedayGridHeader}>
          <span className={styles.ldOnedaySectionLabel}>ALL CLASSES</span>
          <p className={styles.ldOnedayGridCount}>
            총 <strong>{projects.length}</strong>가지 원데이 클래스
          </p>
        </div>

        {/* 카드 그리드 */}
        <div className={styles.ldOnedayGrid}>
          {projects.map((p) => (
            <OnedayCard key={p.num} {...p} />
          ))}
        </div>


      </div>
    </section>
  );
}
