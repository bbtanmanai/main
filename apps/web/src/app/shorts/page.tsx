import LgBackground from "@/components/lg/LgBackground";

export const metadata = { title: "쇼츠 대본 | LinkDrop" };

export default function ShortsPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 64 }}>
      <LgBackground />
      <div className="ld-glass" style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "48px 64px", borderRadius: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-secondary)", marginBottom: 16 }}>COMING SOON</p>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>쇼츠 대본 작성</h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)" }}>곧 공개될 예정입니다.</p>
      </div>
    </div>
  );
}
