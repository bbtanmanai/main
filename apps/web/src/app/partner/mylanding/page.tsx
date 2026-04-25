"use client";

import { useState, useEffect } from "react";
import {
  PenLine, BookMarked, BookOpen, GraduationCap, Video,
  Heart, TrendingUp, Zap, BarChart2, Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  { slug: "landing3", title: "내 인생 이야기가\n베스트셀러가 된다",   icon: "BookOpen",      badge: null,    desc: "살아온 이야기를 책으로, AI와 편집팀이 함께 만들어드립니다" },
  { slug: "landing4", title: "AI 기초 클래스\n운영으로 수강료 수익",  icon: "GraduationCap", badge: "추천",  desc: "강의 스크립트·PPT 초안 자동 생성으로 클래스 부담 없이 운영" },
  { slug: "landing5", title: "유튜브 쇼츠로\n경험담 영상화",          icon: "Video",         badge: "인기",  desc: "자막·썸네일·스크립트 자동 생성, 짧은 영상으로 광고 수익" },
  { slug: "landing6", title: "건강 가이드·PDF\n판매로 부수입",        icon: "Heart",         badge: null,    desc: "연령별 맞춤 건강 자료 제작, PDF 판매로 안정적인 수익화" },
  { slug: "landing7", title: "재테크 정보 채널로\n부수입 만들기",     icon: "TrendingUp",    badge: "추천",  desc: "재테크 노하우를 콘텐츠로, 팬덤으로, 수익으로 전환" },
  { slug: "landing8", title: "소상공인 SNS 대행·\n1인기업 자동화",   icon: "Zap",           badge: "신규",  desc: "지역 소상공인 SNS 관리 대행, 마케팅·CS AI 자동화" },
  { slug: "landing9", title: "트레이딩 노하우\n커뮤니티 운영",        icon: "BarChart2",     badge: "신규",  desc: "주식·암호화폐 자동매매 솔루션으로 유료 커뮤니티 수익화" },
];

const ICON_MAP: Record<string, LucideIcon> = {
  PenLine, BookMarked, BookOpen, GraduationCap, Video,
  Heart, TrendingUp, Zap, BarChart2,
};

const BADGE_COLOR: Record<string, { bg: string; color: string }> = {
  인기: { bg: "rgba(111,255,0,0.12)",   color: "var(--accent-neon)" },
  신규: { bg: "rgba(99,102,241,0.15)",  color: "#818cf8" },
  추천: { bg: "rgba(255,136,0,0.12)",   color: "#FF8800" },
};

export default function MyLandingPage() {
  // TODO: 초기값을 Supabase profiles.selected_landing 에서 읽어올 것
  const [selected, setSelected] = useState("landing1");
  const [saved, setSaved] = useState(true);

  // TODO: 실제 user.id 로 교체 (useSession().user.id)
  const mockUserId = "00000000-0000-0000-0000-000000000000";
  const [promoUrl, setPromoUrl] = useState(`/r/${mockUserId}`);

  useEffect(() => {
    setPromoUrl(`${window.location.origin}/r/${mockUserId}`);
  }, []);

  const handleSelect = (slug: string) => {
    setSelected(slug);
    setSaved(false);
  };

  const handleSave = () => {
    // TODO: Supabase UPDATE profiles SET selected_landing = selected WHERE id = user.id
    setSaved(true);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>

      {/* 페이지 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
          fontWeight: 800, fontSize: 26,
          color: "var(--text-primary)", margin: "0 0 8px",
        }}>
          내 랜딩페이지
        </h1>
        <p style={{
          fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
          fontSize: 15, color: "var(--text-secondary)", margin: 0,
        }}>
          홍보할 랜딩페이지를 선택하세요. 내 홍보주소로 방문한 고객에게 이 페이지가 보입니다.
        </p>
      </div>

      {/* 홍보 주소 카드 */}
      <div className="ld-surface-card" style={{ borderRadius: 16, padding: "20px", marginBottom: 28 }}>
        <div className="glass-content">
          <p style={{
            fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
            fontSize: 13, fontWeight: 600,
            color: "var(--text-secondary)", margin: "0 0 10px",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            내 홍보주소
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              flex: 1,
              fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
              fontSize: 14, fontWeight: 600,
              color: "var(--accent-neon)",
              wordBreak: "break-all",
            }}>
              {promoUrl}
            </span>
            <button
              onClick={() => navigator.clipboard?.writeText(promoUrl)}
              style={{
                flexShrink: 0, padding: "8px 18px", borderRadius: 999,
                background: "var(--accent-neon)", color: "#010828",
                border: "none",
                fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              복사
            </button>
          </div>
        </div>
      </div>

      {/* 랜딩페이지 선택 그리드 */}
      <div style={{ marginBottom: 24 }}>
        <p style={{
          fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
          fontSize: 15, fontWeight: 700,
          color: "var(--text-primary)", margin: "0 0 16px",
        }}>
          랜딩페이지 선택 <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>({TOPICS.length}개)</span>
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 14,
        }}>
          {TOPICS.map((topic) => {
            const Icon = ICON_MAP[topic.icon];
            const isSelected = selected === topic.slug;
            const badge = topic.badge ? BADGE_COLOR[topic.badge] : null;

            return (
              <button
                key={topic.slug}
                onClick={() => handleSelect(topic.slug)}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "18px 16px",
                  borderRadius: 14,
                  border: isSelected
                    ? "2px solid var(--accent-neon)"
                    : "2px solid rgba(255,255,255,0.08)",
                  background: isSelected
                    ? "rgba(111,255,0,0.07)"
                    : "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  backdropFilter: "blur(8px)",
                }}
              >
                {/* 선택 체크 */}
                {isSelected && (
                  <div style={{
                    position: "absolute", top: 12, right: 12,
                    width: 22, height: 22, borderRadius: "50%",
                    background: "var(--accent-neon)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check size={13} color="#010828" strokeWidth={3} />
                  </div>
                )}

                {/* 뱃지 */}
                {badge && (
                  <span style={{
                    position: "absolute", top: 12, right: isSelected ? 40 : 12,
                    padding: "2px 8px", borderRadius: 999,
                    fontSize: 11, fontWeight: 700,
                    fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                    background: badge.bg, color: badge.color,
                  }}>
                    {topic.badge}
                  </span>
                )}

                {/* 아이콘 */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: isSelected
                    ? "rgba(111,255,0,0.15)"
                    : "rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {Icon && (
                    <Icon
                      size={22}
                      color={isSelected ? "var(--accent-neon)" : "var(--text-secondary)"}
                      strokeWidth={1.8}
                    />
                  )}
                </div>

                {/* 텍스트 */}
                <div>
                  <p style={{
                    fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                    fontWeight: 700, fontSize: 14,
                    color: isSelected ? "var(--accent-neon)" : "var(--text-primary)",
                    margin: "0 0 4px",
                    whiteSpace: "pre-line", lineHeight: 1.4,
                  }}>
                    {topic.title}
                  </p>
                  <p style={{
                    fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                    fontSize: 12, color: "var(--text-secondary)",
                    margin: 0, lineHeight: 1.5,
                  }}>
                    {topic.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 저장 버튼 */}
      <div style={{
        position: "sticky", bottom: 80,
        display: "flex", justifyContent: "flex-end",
        paddingBottom: 24,
      }}>
        <button
          onClick={handleSave}
          disabled={saved}
          style={{
            padding: "14px 36px", borderRadius: 999,
            background: saved ? "rgba(255,255,255,0.06)" : "var(--accent-neon)",
            color: saved ? "var(--text-secondary)" : "#010828",
            border: saved ? "1px solid rgba(255,255,255,0.1)" : "none",
            fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
            fontSize: 16, fontWeight: 700,
            cursor: saved ? "default" : "pointer",
            transition: "all 0.2s ease",
            boxShadow: saved ? "none" : "0 4px 24px rgba(111,255,0,0.25)",
          }}
        >
          {saved ? "저장됨" : "선택 저장하기"}
        </button>
      </div>

    </div>
  );
}
