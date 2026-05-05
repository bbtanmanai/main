"use client";

import { usePathname } from "next/navigation";
import LgBackground from "@/components/lg/LgBackground";

/* ─────────────────────────── SVG 아이콘 ─────────────────────────── */
const Icons = {
  series: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  create: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  character: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  emotion: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M8 13s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
};

const NAV = [
  { label: "내 시리즈", href: "/webnovel",                   icon: Icons.series },
  { label: "새 시리즈", href: "/webnovel/create",            icon: Icons.create },
  { label: "캐릭터",   href: "/webnovel/characters",         icon: Icons.character },
  { label: "감정선",   href: "/webnovel/characters/emoline", icon: Icons.emotion },
];

const ACTIVE_COLOR  = "#111827";
const ACTIVE_BG     = "rgba(15,23,42,0.06)";

export default function WebnovelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="wn-shell">
      <LgBackground />

      <div className="wn-layout">
        <div className="wn-inner">

          {/* ── 사이드바 (md 이상에서만 표시) ── */}
          <aside className="wn-sidebar hidden md:block">
            <p className="wn-nav-label">
              웹소설 스튜디오
            </p>

            {NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="wn-nav-item"
                  style={{
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? ACTIVE_COLOR : "#374151",
                    backgroundColor: isActive ? ACTIVE_BG : "transparent",
                    boxShadow: isActive ? `inset 3px 0 0 ${ACTIVE_COLOR}` : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,0,0,0.03)";
                      (e.currentTarget as HTMLElement).style.color = "#111827";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#374151";
                    }
                  }}
                >
                  <span
                    className="wn-nav-icon"
                    style={{ color: isActive ? ACTIVE_COLOR : "#9CA3AF" }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </a>
              );
            })}
          </aside>

          {/* ── 메인 콘텐츠 ── */}
          <main className="wn-main">
            {children}
          </main>
        </div>
      </div>

    </div>
  );
}
