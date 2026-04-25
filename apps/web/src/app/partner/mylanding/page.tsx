"use client";

import { useState, useEffect } from "react";
import {
  PenLine, BookOpen, Video, GraduationCap, FileText,
  TrendingUp, Heart, Zap, Baby, Smartphone, Check,
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
  { slug: "webnovel-writer",      title: "웹소설 작가로\n월 수익 만들기",        icon: "PenLine",       badge: "인기",  desc: "AI가 도와주는 웹소설 창작으로 안정적인 수익을" },
  { slug: "my-life-bestseller",   title: "내 인생 이야기가\n베스트셀러가 된다",  icon: "BookOpen",      badge: "신규",  desc: "살아온 이야기를 책으로, 전자책으로 수익화" },
  { slug: "shorts-ad",            title: "유튜브 쇼츠로\n매달 광고비 받기",      icon: "Video",         badge: "추천",  desc: "짧은 영상 하나로 광고 수익과 팬을 동시에" },
  { slug: "expert-video",         title: "내 전문 지식을\n영상 강의로 팔기",      icon: "GraduationCap", badge: "인기",  desc: "30년 경험을 강의로, 수강생이 수익으로" },
  { slug: "blog-ad",              title: "블로그 글 하나로\n매달 광고 수익",      icon: "FileText",      badge: null,    desc: "꾸준한 블로그로 광고 수익과 브랜드를 동시에" },
  { slug: "fintech-channel",      title: "재테크 정보 채널로\n부수입 만들기",     icon: "TrendingUp",    badge: "추천",  desc: "재테크 노하우를 콘텐츠로, 팬덤으로, 수익으로" },
  { slug: "health-content",       title: "건강·다이어트 정보로\n돈 버는 법",      icon: "Heart",         badge: null,    desc: "건강 정보 콘텐츠로 신뢰받는 인플루언서가 되다" },
  { slug: "solo-biz-automation",  title: "1인 기업 마케팅·CS\n자동화",           icon: "Zap",           badge: "신규",  desc: "혼자서도 대기업처럼, AI 자동화로 시간을 되찾아" },
  { slug: "grandkid-parenting",   title: "손주·육아 꿀팁으로\n인플루언서",        icon: "Baby",          badge: null,    desc: "손주 키우며 쌓은 경험으로 팬과 수익을 함께" },
  { slug: "senior-online-business", title: "스마트폰 하나로\n시니어 온라인 부업", icon: "Smartphone",    badge: "신규",  desc: "기술 걱정 없이 시작하는 40·50·60대 맞춤 온라인 수익화" },
];

const ICON_MAP: Record<string, LucideIcon> = {
  PenLine, BookOpen, Video, GraduationCap, FileText,
  TrendingUp, Heart, Zap, Baby, Smartphone,
};

const BADGE_COLOR: Record<string, { bg: string; color: string }> = {
  인기: { bg: "rgba(111,255,0,0.12)",   color: "var(--accent-neon)" },
  신규: { bg: "rgba(99,102,241,0.15)",  color: "#818cf8" },
  추천: { bg: "rgba(255,136,0,0.12)",   color: "#FF8800" },
};

export default function MyLandingPage() {
  // TODO: 초기값을 Supabase profiles.selected_landing 에서 읽어올 것
  const [selected, setSelected] = useState("senior-online-business");
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
