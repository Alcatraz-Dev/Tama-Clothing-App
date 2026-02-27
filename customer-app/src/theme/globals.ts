import { Dimensions } from "react-native";

// App sizing constants matching brand design
export const HEIGHT = {
  sm: 36,
  md: 44,
  lg: 52,
  xl: 60,
  default: 48,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  default: 17,
};

export const BORDER_RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  full: 999,
  default: 16,
};

export const CORNERS = 999;

// Direct number exports for backward compatibility and simpler usage
export const HEIGHT_DEFAULT = HEIGHT.default;
export const FONT_SIZE_DEFAULT = FONT_SIZE.default;
export const BORDER_RADIUS_DEFAULT = BORDER_RADIUS.default;

// Supporting the names used in some components (Height, FontSize, BorderRadius)
export const Height = HEIGHT;
export const FontSize = FONT_SIZE;
export const BorderRadius = BORDER_RADIUS;

const { width, height } = Dimensions.get("window");
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
