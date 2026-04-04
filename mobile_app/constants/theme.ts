import { Platform } from "react-native";

// ── Brand Palette ──────────────────────────────────────────────
export const Brand = {
  primary: "#02555d",
  primaryLight: "#e6f4f5",
  primaryMid: "#03747f",
  primaryDark: "#013d44",
  accent: "#02555d",
  accentLight: "#d0eeef",
  success: "#16a34a",
  successLight: "#dcfce7",
  warning: "#d97706",
  warningLight: "#fef3c7",
  danger: "#dc2626",
  dangerLight: "#fee2e2",
  rain: "#2563eb",
  rainLight: "#eff6ff",
  aqi: "#d97706",
  aqiLight: "#fffbeb",
  flood: "#7c3aed",
  floodLight: "#ede9fe",
  // Enhanced properties
  canvas: "#fafbfc",
  canvasStrong: "#f3f7f7",
  line: "#e2e5e9",
  surface: "#ffffff",
  surfaceAlt: "#f8f9fa",
  surfaceTint: "#eef7f7",
} as const;

export const Neutral = {
  white: "#ffffff",
  50: "#f7f8fa",
  100: "#f1f3f5",
  200: "#e5e7eb",
  300: "#d1d5db",
  400: "#9ca3af",
  500: "#6b7280",
  600: "#4b5563",
  700: "#374151",
  800: "#1f2937",
  900: "#111827",
} as const;

// ── Legacy Colors ──────────────────────────────────────────────
export const Colors = {
  light: {
    text: Neutral[800],
    background: Neutral[50],
    tint: Brand.primary,
    icon: Neutral[500],
    tabIconDefault: Neutral[400],
    tabIconSelected: Brand.primary,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: "#fff",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#fff",
  },
};

// ── Typography ── (Inter loaded in _layout.tsx) ────────────────
export const Font = {
  regular: "Inter-Regular",
  medium: "Inter-Medium",
  semiBold: "Inter-SemiBold",
  bold: "Inter-Bold",
  display: "Inter-Bold",
};

// Legacy export for compatibility
export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
});

// ── Spacing ────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ── Border Radius ──────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

// ── Shadows ────────────────────────────────────────────────────
export const Shadow = {
  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// ── Modern Effects ─────────────────────────────────────────────
export const Effects = {
  glass: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    backdropFilter: "blur(10px)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  glassDark: {
    backgroundColor: "rgba(0, 0, 0, 0.12)",
    backdropFilter: "blur(10px)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  gradient: {
    primary: ["#02555d", "#03747f", "#e6f4f5"],
    success: ["#16a34a", "#22c55e", "#dcfce7"],
    warning: ["#d97706", "#f59e0b", "#fef3c7"],
    danger: ["#dc2626", "#ef4444", "#fee2e2"],
  },
} as const;
