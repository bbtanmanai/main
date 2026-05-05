"use client";

import { useRef } from "react";

interface Props {
  num: string;
  icon: string;
  title: string;
  sub: string;
  desc: string;
  href: string;
  status: string;
}

export default function ProjectCard({ num, icon, title, sub, desc, href, status }: Props) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  function handleMouseMove(e: React.MouseEvent) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--glare-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--glare-y", `${e.clientY - rect.top}px`);
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.removeProperty("--glare-x");
    card.style.removeProperty("--glare-y");
  }

  return (
    <a
      ref={cardRef}
      href={href}
      className={`aprj-card${status === "soon" ? " aprj-card--soon" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <span className="aprj-card-bg-num" aria-hidden="true">{num}</span>
      <div className="aprj-card-glare" aria-hidden="true" />
      <div className="aprj-card-icon-wrap">
        <span className="aprj-card-icon">{icon}</span>
      </div>
      <h3 className="aprj-card-title">{title}</h3>
      <p className="aprj-card-sub">{sub}</p>
      <p className="aprj-card-desc">{desc}</p>
      <div className="aprj-card-footer">
        <div className={status === "active" ? "aprj-status aprj-status--active" : "aprj-status aprj-status--soon"}>
          <span className="aprj-status-dot" />
          {status === "active" ? "운영 중" : "준비 중"}
        </div>
        <span className="aprj-card-link">자세히 →</span>
      </div>
    </a>
  );
}
