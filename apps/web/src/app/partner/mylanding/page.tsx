"use client";

import { useState, useEffect } from "react";
import {
  PenLine, BookMarked, BookOpen, GraduationCap, Video,
  Code2, Mic, Zap, BarChart2, Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import "@/styles/pages/partner.css";

interface Topic {
  slug: string;
  title: string;
  icon: string;
  badge: string | null;
  desc: string;
}

const TOPICS: Topic[] = [
  { slug: "landing1", title: "웹소설 작가로\n월 수익 만들기",        icon: "PenLine",       badge: "인기",  desc: "블로그·브런치 연재로 팬을 만들고, AI가 초안을 잡아드려요" },
  { slug: "landing2", title: "전자책 출간으로\n내 경험 수익화",       icon: "BookMarked",    badge: "신규",  desc: "ChatGPT로 목차·초안 작성, 내 경험으로 완성하는 전자책" },
  { slug: "landing3", title: "AI로 만드는\n나만의 동화책",           icon: "BookOpen",      badge: null,    desc: "내 이야기를 동화책으로, AI 삽화·편집으로 누구나 출판까지" },
  { slug: "landing4", title: "AI 기초 클래스\n운영으로 수강료 수익",  icon: "GraduationCap", badge: "추천",  desc: "강의 스크립트·PPT 초안 자동 생성으로 클래스 부담 없이 운영" },
  { slug: "landing5", title: "유튜브 쇼츠로\n경험담 영상화",          icon: "Video",         badge: "인기",  desc: "자막·썸네일·스크립트 자동 생성, 짧은 영상으로 광고 수익" },
  { slug: "landing6", title: "바이브코딩으로\n웹사이트·웹앱 만들기",  icon: "Code2",         badge: "신규",  desc: "AI 코딩 도구로 코딩 몰라도 웹사이트·웹앱을 직접 만들어 수익화" },
  { slug: "landing7", title: "디지털 구술\n생애사 기록가",           icon: "Mic",           badge: "추천",  desc: "부모님 인생을 책·영상으로, 효도 선물 시장의 새로운 프리미엄 서비스" },
  { slug: "landing8", title: "소상공인 SNS 대행·\n1인기업 자동화",   icon: "Zap",           badge: "신규",  desc: "지역 소상공인 SNS 관리 대행, 마케팅·CS AI 자동화" },
  { slug: "landing9", title: "트레이딩 노하우\n커뮤니티 운영",        icon: "BarChart2",     badge: "신규",  desc: "주식·암호화폐 자동매매 솔루션으로 유료 커뮤니티 수익화" },
];

const ICON_MAP: Record<string, LucideIcon> = {
  PenLine, BookMarked, BookOpen, GraduationCap, Video,
  Code2, Mic, Zap, BarChart2,
};

// 배지 색상 — 런타임에 topic.badge 값으로 결정되므로 inline style 허용
const BADGE_COLOR: Record<string, { bg: string; color: string }> = {
  인기: { bg: "rgba(5,150,105,0.10)",  color: "#059669" },
  신규: { bg: "rgba(99,102,241,0.12)", color: "#818cf8" },
  추천: { bg: "rgba(13,148,136,0.10)", color: "#0d9488" },
};

export default function MyLandingPage() {
  const [selected, setSelected] = useState("landing1");
  const [saved, setSaved] = useState(true);
  const { user } = useSession();
  const userId = user?.id ?? "";
  const [promoUrl, setPromoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      setPromoUrl(`${window.location.origin}/r/${userId}`);
    }
  }, [userId]);

  const handleSelect = (slug: string) => {
    setSelected(slug);
    setSaved(false);
  };

  const handleSave = () => {
    // TODO: Supabase UPDATE profiles SET selected_landing = selected WHERE id = user.id
    setSaved(true);
  };

  return (
    <div className="pt-container">

      {/* ── 페이지 헤더 ── */}
      <div className="pt-mylanding-header">
        <p className="pt-eyebrow">파트너 도구</p>
        <h1 className="pt-page-title">내 랜딩페이지</h1>
        <p className="pt-page-desc">
          홍보할 랜딩페이지를 선택하세요. 내 홍보주소로 방문한 고객에게 이 페이지가 보입니다.
        </p>
      </div>

      {/* ── 홍보주소 카드 ── */}
      <div className="pt-promo-card">
        <p className="pt-promo-label">내 홍보주소</p>
        <div className="pt-promo-url-row">
          <span className="pt-promo-url-text">
            {promoUrl ?? "주소 불러오는 중..."}
          </span>
          <button
            onClick={() => promoUrl && navigator.clipboard?.writeText(promoUrl)}
            disabled={!promoUrl}
            className="pt-promo-copy-btn"
            style={{
              background: promoUrl ? "#059669" : "rgba(15,23,42,0.05)",
              color: promoUrl ? "#ffffff" : "var(--text-secondary)",
              cursor: promoUrl ? "pointer" : "default",
            }}
          >
            복사
          </button>
        </div>
      </div>

      {/* ── 랜딩페이지 선택 ── */}
      <div className="pt-section-header">
        <h2>
          랜딩페이지 선택{" "}
          <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
            ({TOPICS.length}개)
          </span>
        </h2>
      </div>

      <div className="pt-topic-grid">
        {TOPICS.map((topic) => {
          const Icon = ICON_MAP[topic.icon];
          const isSelected = selected === topic.slug;
          const badge = topic.badge ? BADGE_COLOR[topic.badge] : null;

          // 아이콘 배경·색상 — isSelected 런타임 → inline style 허용
          const iconBg: string = isSelected
            ? "rgba(5,150,105,0.12)"
            : "rgba(15,23,42,0.05)";
          const iconColor: string = isSelected
            ? "#059669"
            : "var(--text-secondary)";
          const nameColor: string = isSelected
            ? "#059669"
            : "var(--text-primary)";

          return (
            <button
              key={topic.slug}
              onClick={() => handleSelect(topic.slug)}
              className={`pt-topic-card${isSelected ? " is-selected" : ""}`}
            >
              {/* 선택 체크 */}
              {isSelected && (
                <div className="pt-topic-check">
                  <Check size={12} color="#ffffff" strokeWidth={3} />
                </div>
              )}

              {/* 뱃지 — bg·color 런타임 → inline style 허용 */}
              {badge && (
                <span
                  className="pt-topic-badge"
                  style={{
                    right: isSelected ? 36 : 10,
                    background: badge.bg,
                    color: badge.color,
                  }}
                >
                  {topic.badge}
                </span>
              )}

              {/* 아이콘 — 배경·색상 런타임 → inline style 허용 */}
              <div className="pt-topic-icon" style={{ background: iconBg }}>
                {Icon && (
                  <Icon size={20} color={iconColor} strokeWidth={1.8} />
                )}
              </div>

              {/* 텍스트 */}
              <div>
                {/* 이름 색상 런타임 → inline style 허용 */}
                <p className="pt-topic-name" style={{ color: nameColor }}>
                  {topic.title}
                </p>
                <p className="pt-topic-desc">{topic.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 저장 버튼 ── */}
      <div className="pt-save-row">
        <button
          onClick={handleSave}
          disabled={saved}
          className="pt-save-btn"
          style={{
            background: saved ? "rgba(15,23,42,0.04)" : "#059669",
            color: saved ? "var(--text-secondary)" : "#ffffff",
            border: saved ? "1px solid rgba(15,23,42,0.12)" : "none",
            cursor: saved ? "default" : "pointer",
          }}
        >
          {saved ? "저장됨" : "선택 저장하기"}
        </button>
      </div>

    </div>
  );
}
