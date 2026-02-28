export const lightColors = {
  background: "#FFFFFF",
  foreground: "#000000",
  card: "#FFFFFF",
  cardForeground: "#000000",
  popover: "#FFFFFF",
  popoverForeground: "#000000",
  primary: "#1fa7f0",
  primaryForeground: "#FFFFFF",
  secondary: "#FFF5F5",
  secondaryForeground: "#1fa7f0",
  muted: "#F9FAFB",
  mutedForeground: "#6b7280",
  accent: "#1fa7f0",
  accentForeground: "#FFFFFF",
  destructive: "#EF4444",
  destructiveForeground: "#FFFFFF",
  border: "#E5E7EB",
  input: "#E5E7EB",
  ring: "#1fa7f0",
  // Text colors
  text: "#000000",
  textMuted: "#6b7280",
  // Legacy support
  tint: "#1fa7f0",
  icon: "#6b7280",
  tabIconDefault: "#6b7280",
  tabIconSelected: "#1fa7f0",
  // Accent colors - TamaClothing brand colors
  coral: "#1fa7f0",
  coralLight: "#FF8E8E",
  coralDark: "#E85555",
  blue: "#1fa7f0", // Replace blue with coral
  green: "#10B981",
  red: "#EF4444",
  orange: "#F97316",
  yellow: "#FBBF24",
  pink: "#EC4899",
  purple: "#8B5CF6",
  teal: "#14B8A6",
  indigo: "#6366F1",
};

export const darkColors = {
  background: "#000000",
  foreground: "#FFFFFF",
  card: "#1C1C1E",
  cardForeground: "#FFFFFF",
  popover: "#1C1C1E",
  popoverForeground: "#FFFFFF",
  primary: "#1fa7f0",
  primaryForeground: "#FFFFFF",
  secondary: "#2D2D2D",
  secondaryForeground: "#1fa7f0",
  muted: "#1C1C1E",
  mutedForeground: "#9ca3af",
  accent: "#1fa7f0",
  accentForeground: "#FFFFFF",
  destructive: "#EF4444",
  destructiveForeground: "#FFFFFF",
  border: "#2D2D2D",
  input: "#2D2D2D",
  ring: "#1fa7f0",
  // Text colors
  text: "#FFFFFF",
  textMuted: "#9ca3af",
  // Legacy support
  tint: "#1fa7f0",
  icon: "#9ca3af",
  tabIconDefault: "#9ca3af",
  tabIconSelected: "#1fa7f0",
  // Accent colors - TamaClothing brand colors
  coral: "#1fa7f0",
  coralLight: "#FF8E8E",
  coralDark: "#E85555",
  blue: "#1fa7f0", // Replace blue with coral
  green: "#10B981",
  red: "#EF4444",
  orange: "#F97316",
  yellow: "#FBBF24",
  pink: "#EC4899",
  purple: "#8B5CF6",
  teal: "#14B8A6",
  indigo: "#6366F1",
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
