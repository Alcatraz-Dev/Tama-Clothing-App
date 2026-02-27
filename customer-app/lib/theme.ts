/**
 * BNA UI Library - Theme
 * 
 * Source: https://ui.ahmedbna.com/docs/theme
 * 
 * This file exports theme utilities from the BNA UI library.
 * Installation: npx expo install bna-ui
 * 
 * @example
 * import { ThemeProvider, useTheme, useThemeColors } from '@/lib/theme';
 */

// Re-export local theme files (already implemented in customer-app/theme)
export { Colors, lightColors, darkColors } from '../theme/colors';
export { HEIGHT, FONT_SIZE, BORDER_RADIUS, CORNERS } from '../theme/globals';

// Theme configuration for TamaClothing
export interface TamaThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  errorColor: string;
  successColor: string;
  warningColor: string;
}

// Default theme configuration for TamaClothing
export const TamaTheme: TamaThemeConfig = {
  primaryColor: '#000000',
  secondaryColor: '#666666',
  accentColor: '#FF6B6B',
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  borderColor: '#E5E5E5',
  errorColor: '#FF3B30',
  successColor: '#34C759',
  warningColor: '#FF9500',
};

// Note: When bna-ui is installed, uncomment the following exports:
//
// Theme Provider
// export { ThemeProvider } from 'bna-ui';
//
// Theme utilities
// export { useTheme } from 'bna-ui';
// export { useThemeColors } from 'bna-ui';
//
// Theme types
// export type {
//   ColorScheme,
//   ThemeColors,
//   Theme
// } from 'bna-ui';
