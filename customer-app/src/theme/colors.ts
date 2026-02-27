export const lightColors = {
  background: "#FFFFFF",
  foreground: "#000000",
  card: "#F2F2F7",
  cardForeground: "#000000",
  popover: "#FFFFFF",
  popoverForeground: "#000000",
  primary: "#18181b",
  primaryForeground: "#FFFFFF",
  secondary: "#F2F2F7",
  secondaryForeground: "#18181b",
  muted: "#F2F2F7",
  mutedForeground: "#6b7280",
  accent: "#F2F2F7",
  accentForeground: "#18181b",
  destructive: "#FF3B30",
  destructiveForeground: "#FFFFFF",
  border: "#e5e7eb",
  input: "#e5e7eb",
  ring: "#18181b",
  // Text colors
  text: "#000000",
  textMuted: "#6b7280",
  // Legacy support
  tint: "#18181b",
  icon: "#6b7280",
  tabIconDefault: "#6b7280",
  tabIconSelected: "#18181b",
  // Accent colors
  blue: "#007AFF",
  green: "#34C759",
  red: "#FF3B30",
  orange: "#FF9500",
  yellow: "#FFCC00",
  pink: "#FF2D92",
  purple: "#AF52DE",
  teal: "#5AC8FA",
  indigo: "#5856D6",
};

export const darkColors = {
  background: "#000000",
  foreground: "#FFFFFF",
  card: "#1C1C1E",
  cardForeground: "#FFFFFF",
  popover: "#1C1C1E",
  popoverForeground: "#FFFFFF",
  primary: "#e4e4e7",
  primaryForeground: "#18181b",
  secondary: "#1C1C1E",
  secondaryForeground: "#FFFFFF",
  muted: "#1C1C1E",
  mutedForeground: "#9ca3af",
  accent: "#1C1C1E",
  accentForeground: "#FFFFFF",
  destructive: "#FF453A",
  destructiveForeground: "#FFFFFF",
  border: "#27272a",
  input: "#27272a",
  ring: "#d4d4d8",
  // Text colors
  text: "#FFFFFF",
  textMuted: "#9ca3af",
  // Legacy support
  tint: "#FFFFFF",
  icon: "#9ca3af",
  tabIconDefault: "#9ca3af",
  tabIconSelected: "#FFFFFF",
  // Accent colors
  blue: "#0A84FF",
  green: "#30D158",
  red: "#FF453A",
  orange: "#FF9F0A",
  yellow: "#FFD60A",
  pink: "#FF375F",
  purple: "#BF5AF2",
  teal: "#64D2FF",
  indigo: "#5E5CE6",
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

export type ColorKeys = keyof typeof lightColors;

export function withOpacity(color: string, opacity: number): string {
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}
