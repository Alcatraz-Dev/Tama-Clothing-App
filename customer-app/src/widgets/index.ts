/**
 * TamaClothing Widgets
 * 
 * A comprehensive widget system for the TamaClothing (Bey3a) mobile app
 * supporting both iOS WidgetKit and Android.
 * 
 * @version 1.0.0
 * @author TamaClothing Development Team
 */

// Re-export types
export * from './types';

// Re-export components
export * from './components';

// Re-export utilities
export * from './utils';

// Widget configuration
export const WIDGET_CONFIG = {
  // Supported widget sizes
  SIZES: {
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large'
  },

  // Supported widget types
  TYPES: {
    CART: 'cart',
    DEALS: 'deals',
    ORDER_TRACKING: 'order_tracking',
    RECOMMENDATIONS: 'recommendations'
  },

  // Refresh intervals in minutes
  REFRESH_INTERVALS: {
    CART: 15,
    DEALS: 30,
    ORDER_TRACKING: 60,
    RECOMMENDATIONS: 60
  },

  // Platform support
  PLATFORMS: {
    IOS: 'ios',
    ANDROID: 'android'
  }
} as const;

// Re-export manager and service
export { default as WidgetManager } from './WidgetManager';
export { default as WidgetDataService } from './services/WidgetDataService';
export { default as OrderTrackingActivity } from './OrderTrackingActivity';
