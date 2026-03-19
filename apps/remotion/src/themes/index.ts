/**
 * 비주얼타입 가독성 테마 (밝은 배경 / 어두운 배경)
 */

export interface Theme {
  id: string;
  label: string;
  textPrimary: string;
  textSecondary: string;
  textAccent: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  cardBg: string;
  cardBorder: string;
  fontFamily: string;
  shadow: string;
  borderRadius: number;
}

export const themes: Record<string, Theme> = {
  light: {
    id: "light",
    label: "밝은 배경용",
    textPrimary: "#1a1a2e",
    textSecondary: "#555555",
    textAccent: "#7c3aed",
    accent: "#7c3aed",
    accentLight: "#a78bfa",
    accentDark: "#5b21b6",
    cardBg: "rgba(255,255,255,0.75)",
    cardBorder: "rgba(0,0,0,0.08)",
    fontFamily: "'Noto Sans KR', sans-serif",
    shadow: "0 8px 32px rgba(0,0,0,0.1)",
    borderRadius: 20,
  },

  dark: {
    id: "dark",
    label: "어두운 배경용",
    textPrimary: "#f0f0f0",
    textSecondary: "#a0a0a0",
    textAccent: "#a78bfa",
    accent: "#a78bfa",
    accentLight: "#c4b5fd",
    accentDark: "#7c3aed",
    cardBg: "rgba(0,0,0,0.55)",
    cardBorder: "rgba(255,255,255,0.1)",
    fontFamily: "'Noto Sans KR', sans-serif",
    shadow: "0 8px 32px rgba(0,0,0,0.3)",
    borderRadius: 20,
  },
};

export function getTheme(styleId: string): Theme {
  // 어두운 화풍들
  const darkStyles = ["hollywood-sf", "anime-sf", "neo-noir", "reality"];
  if (darkStyles.includes(styleId)) return themes.dark;
  // 나머지는 밝은 배경 기본
  return themes.light;
}
