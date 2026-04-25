"use client";

// ============================================================
// 강의 관리 페이지 — 강의 목록 카드 + 수강생 수 / 평점 / 수익
// mock 데이터로 UI 완성
// ============================================================

// mock 강의 데이터
const mockCourses = [
  {
    id: "crs-001",
    title: "AI로 웹소설 쓰는 법",
    category: "웹소설",
    students: 47,
    rating: 4.8,
    income: 423000,
    status: "published", // 공개됨
    thumbnail: null,
  },
  {
    id: "crs-002",
    title: "유튜브 쇼츠 수익화 완전 가이드",
    category: "영상",
    students: 23,
    rating: 4.6,
    income: 207000,
    status: "published",
    thumbnail: null,
  },
  {
    id: "crs-003",
    title: "블로그 SEO 마스터클래스",
    category: "블로그",
    students: 0,
    rating: 0,
    income: 0,
    status: "draft", // 초안 (비공개)
    thumbnail: null,
  },
];

export default function CoursesPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      {/* 페이지 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 800,
            fontSize: 26,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          강의 관리
        </h1>
        {/* 강의 등록 버튼 */}
        <button
          onClick={() => alert("강의 등록 기능은 준비 중입니다")}
          style={{
            height: 44,
            padding: "0 20px",
            borderRadius: 10,
            backgroundColor: "#6366f1",
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            border: "none",
            cursor: "pointer",
          }}
        >
          + 강의 등록
        </button>
      </div>

      {/* 강의 카드 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {mockCourses.map((course) => (
          <div
            key={course.id}
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: 16,
              padding: 24,
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              gap: 20,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {/* 강의 썸네일 자리표시자 */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                backgroundColor: "rgba(99,102,241,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                flexShrink: 0,
              }}
            >
              🎬
            </div>

            {/* 강의 정보 */}
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                {/* 카테고리 뱃지 */}
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    backgroundColor: "rgba(99,102,241,0.12)",
                    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#6366f1",
                  }}
                >
                  {course.category}
                </span>
                {/* 공개/비공개 뱃지 */}
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    backgroundColor: course.status === "published" ? "rgba(16,185,129,0.12)" : "rgba(234,179,8,0.12)",
                    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: course.status === "published" ? "#10b981" : "#eab308",
                  }}
                >
                  {course.status === "published" ? "공개 중" : "초안"}
                </span>
              </div>

              <h3
                style={{
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "var(--text-primary)",
                  margin: "0 0 12px",
                }}
              >
                {course.title}
              </h3>

              {/* 통계 행 */}
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {/* 수강생 수 */}
                <StatItem icon="👥" value={`${course.students}명`} label="수강생" />
                {/* 평점 */}
                <StatItem
                  icon="⭐"
                  value={course.rating > 0 ? `${course.rating.toFixed(1)}점` : "-"}
                  label="평점"
                />
                {/* 수익 */}
                <StatItem
                  icon="💰"
                  value={course.income > 0 ? `${course.income.toLocaleString()}원` : "-"}
                  label="수익"
                  color="#119944"
                />
              </div>
            </div>

            {/* 관리 버튼 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => alert(`${course.title} 편집`)}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 8,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  cursor: "pointer",
                }}
              >
                편집
              </button>
              <button
                onClick={() => alert(`${course.title} 통계 보기`)}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 8,
                  backgroundColor: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  color: "#6366f1",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  cursor: "pointer",
                }}
              >
                통계
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatItem({ icon, value, label, color }: { icon: string; value: string; label: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 15,
          fontWeight: 700,
          color: color ?? "var(--text-primary)",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
