export interface Theme {
  id: string;
  fontFamily: string;

  bgPrimary: string;
  overlay: string;
  vignette: string;

  cardBg: string;
  cardBorder: string;
  borderRadius: number;
  shadow: string;
  shadowStrong: string;

  textPrimary: string;
  textSecondary: string;
  textAccent: string;

  accent: string;
  accentDark: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const s = hex.replace("#", "").trim();
  if (s.length !== 3 && s.length !== 6) return null;
  const full = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgba(hex: string, a: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(255,255,255,${a})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

export function getTheme(
  styleId: string,
  opts?: { accent?: string; textAccent?: string },
): Theme {
  const fontFamily =
    "'Noto Sans KR','Malgun Gothic',system-ui,-apple-system,'Segoe UI',sans-serif";

  const base: Record<
    string,
    Omit<Theme, "accent" | "accentDark" | "textAccent"> & { accentBase: string }
  > = {
    "ghibli-real": {
      id: "ghibli-real",
      fontFamily,
      bgPrimary: "#0b1020",
      overlay:
        "radial-gradient(ellipse at 30% 20%, rgba(34,211,238,0.10) 0%, transparent 60%),radial-gradient(ellipse at 70% 70%, rgba(167,139,250,0.10) 0%, transparent 60%),linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 55%)",
      vignette:
        "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.35) 100%)",
      cardBg: "rgba(10, 14, 28, 0.55)",
      cardBorder: "rgba(255,255,255,0.16)",
      borderRadius: 26,
      shadow: "0 14px 60px rgba(0,0,0,0.35)",
      shadowStrong: "0 18px 80px rgba(0,0,0,0.48)",
      textPrimary: "rgba(255,255,255,0.96)",
      textSecondary: "rgba(255,255,255,0.74)",
      accentBase: "#22d3ee",
    },
    "hollywood-sf": {
      id: "hollywood-sf",
      fontFamily,
      bgPrimary: "#080a14",
      overlay:
        "radial-gradient(ellipse at 20% 25%, rgba(99,102,241,0.14) 0%, transparent 60%),radial-gradient(ellipse at 80% 65%, rgba(236,72,153,0.10) 0%, transparent 55%),repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 20px)",
      vignette:
        "radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(0,0,0,0.42) 100%)",
      cardBg: "rgba(6, 8, 18, 0.62)",
      cardBorder: "rgba(255,255,255,0.14)",
      borderRadius: 24,
      shadow: "0 16px 70px rgba(0,0,0,0.45)",
      shadowStrong: "0 22px 90px rgba(0,0,0,0.60)",
      textPrimary: "rgba(255,255,255,0.96)",
      textSecondary: "rgba(255,255,255,0.70)",
      accentBase: "#6366f1",
    },
    "neo-noir": {
      id: "neo-noir",
      fontFamily,
      bgPrimary: "#070812",
      overlay:
        "radial-gradient(ellipse at 70% 35%, rgba(244,63,94,0.14) 0%, transparent 55%),radial-gradient(ellipse at 25% 75%, rgba(56,189,248,0.10) 0%, transparent 55%),linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 35%, rgba(255,255,255,0.04) 70%, transparent 100%)",
      vignette:
        "radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(0,0,0,0.52) 100%)",
      cardBg: "rgba(8, 8, 18, 0.70)",
      cardBorder: "rgba(255,255,255,0.14)",
      borderRadius: 22,
      shadow: "0 18px 80px rgba(0,0,0,0.55)",
      shadowStrong: "0 24px 100px rgba(0,0,0,0.68)",
      textPrimary: "rgba(255,255,255,0.96)",
      textSecondary: "rgba(255,255,255,0.72)",
      accentBase: "#f43f5e",
    },
    "pop-art": {
      id: "pop-art",
      fontFamily,
      bgPrimary: "#0b1020",
      overlay:
        "radial-gradient(circle at 18% 30%, rgba(250,204,21,0.18) 0%, transparent 46%),radial-gradient(circle at 78% 62%, rgba(34,197,94,0.12) 0%, transparent 50%),repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0 2px, transparent 2px 18px)",
      vignette:
        "radial-gradient(ellipse at 50% 50%, transparent 48%, rgba(0,0,0,0.36) 100%)",
      cardBg: "rgba(10, 14, 28, 0.58)",
      cardBorder: "rgba(255,255,255,0.16)",
      borderRadius: 26,
      shadow: "0 14px 60px rgba(0,0,0,0.38)",
      shadowStrong: "0 20px 84px rgba(0,0,0,0.55)",
      textPrimary: "rgba(255,255,255,0.96)",
      textSecondary: "rgba(255,255,255,0.74)",
      accentBase: "#facc15",
    },
    "ink-wash": {
      id: "ink-wash",
      fontFamily,
      bgPrimary: "#0a0c12",
      overlay:
        "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.06) 0%, transparent 60%),radial-gradient(ellipse at 30% 80%, rgba(148,163,184,0.10) 0%, transparent 55%),linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 40%, rgba(0,0,0,0.22) 100%)",
      vignette:
        "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.46) 100%)",
      cardBg: "rgba(10, 12, 18, 0.62)",
      cardBorder: "rgba(255,255,255,0.14)",
      borderRadius: 26,
      shadow: "0 16px 70px rgba(0,0,0,0.46)",
      shadowStrong: "0 22px 94px rgba(0,0,0,0.60)",
      textPrimary: "rgba(255,255,255,0.94)",
      textSecondary: "rgba(255,255,255,0.72)",
      accentBase: "#94a3b8",
    },
    "pixar-3d": {
      id: "pixar-3d",
      fontFamily,
      bgPrimary: "#071a1a",
      overlay:
        "radial-gradient(circle at 22% 24%, rgba(45,212,191,0.16) 0%, transparent 55%),radial-gradient(circle at 74% 66%, rgba(59,130,246,0.12) 0%, transparent 55%),linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 52%)",
      vignette:
        "radial-gradient(ellipse at 50% 50%, transparent 46%, rgba(0,0,0,0.38) 100%)",
      cardBg: "rgba(3, 20, 22, 0.58)",
      cardBorder: "rgba(255,255,255,0.14)",
      borderRadius: 28,
      shadow: "0 14px 64px rgba(0,0,0,0.40)",
      shadowStrong: "0 20px 90px rgba(0,0,0,0.55)",
      textPrimary: "rgba(255,255,255,0.96)",
      textSecondary: "rgba(255,255,255,0.74)",
      accentBase: "#2dd4bf",
    },
  };

  const selected = base[styleId] ?? base["ghibli-real"];
  const accent = opts?.accent ?? selected.accentBase;
  const textAccent = opts?.textAccent ?? "rgba(255,255,255,0.96)";

  return {
    id: selected.id,
    fontFamily: selected.fontFamily,
    bgPrimary: selected.bgPrimary,
    overlay: selected.overlay,
    vignette: selected.vignette,
    cardBg: selected.cardBg,
    cardBorder: selected.cardBorder,
    borderRadius: selected.borderRadius,
    shadow: selected.shadow,
    shadowStrong: selected.shadowStrong,
    textPrimary: selected.textPrimary,
    textSecondary: selected.textSecondary,
    textAccent,
    accent,
    accentDark: rgba(accent, 0.75),
  };
}

