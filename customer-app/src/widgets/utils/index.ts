/**
 * Widget Utility Functions
 * 
 * Provides formatting, validation, and helper functions
 * for widget components.
 */

import { Platform } from 'react-native';
import { WidgetSize, WidgetTheme, OrderStatus, DEFAULT_REFRESH_INTERVALS } from '../types';

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
}

/**
 * Format time remaining for deals
 */
export function formatTimeRemaining(endTime: number): string {
  const now = Date.now();
  const diff = endTime - now;
  
  if (diff <= 0) {
    return 'Expired';
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format date for display
 */
export function formatDate(timestamp: number, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  };
  
  return new Date(timestamp).toLocaleDateString('en-US', options || defaultOptions);
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return `${days}d ago`;
  }
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get platform-specific dimensions for widget
 */
export function getWidgetDimensions(
  size: WidgetSize,
  platform: 'ios' | 'android'
): { width: number; height: number } {
  const dimensions = {
    ios: {
      small: { width: 155, height: 155 },
      medium: { width: 329, height: 155 },
      large: { width: 329, height: 345 }
    },
    android: {
      small: { width: 110, height: 110 },
      medium: { width: 180, height: 110 },
      large: { width: 250, height: 180 }
    }
  };
  
  const currentPlatform = platform === 'ios' ? 'ios' : 'android';
  return dimensions[currentPlatform][size];
}

/**
 * Get current platform
 */
export function getCurrentPlatform(): 'ios' | 'android' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

/**
 * Get default theme based on system appearance
 */
export function getDefaultTheme(isDark: boolean): WidgetTheme {
  return isDark ? getDarkTheme() : getLightTheme();
}

/**
 * Light theme colors
 */
export function getLightTheme(): WidgetTheme {
  return {
    isDark: false,
    primaryColor: '#010100',
    secondaryColor: '#666666',
    backgroundColor: '#FFFFFF',
    textColor: '#010100',
    textSecondaryColor: '#666666',
    accentColor: '#FF6B00',
    borderColor: '#E5E5E5',
    successColor: '#34C759',
    warningColor: '#FF9500',
    errorColor: '#FF3B30'
  };
}

/**
 * Dark theme colors
 */
export function getDarkTheme(): WidgetTheme {
  return {
    isDark: true,
    primaryColor: '#FFFFFF',
    secondaryColor: '#999999',
    backgroundColor: '#1C1C1E',
    textColor: '#FFFFFF',
    textSecondaryColor: '#999999',
    accentColor: '#FF9F0A',
    borderColor: '#38383A',
    successColor: '#30D158',
    warningColor: '#FF9F0A',
    errorColor: '#FF453A'
  };
}

/**
 * Get order status color
 */
export function getOrderStatusColor(status: OrderStatus, theme: WidgetTheme): string {
  switch (status) {
    case OrderStatus.PENDING:
    case OrderStatus.CONFIRMED:
    case OrderStatus.PROCESSING:
      return theme.warningColor;
    case OrderStatus.SHIPPED:
    case OrderStatus.OUT_FOR_DELIVERY:
      return theme.accentColor;
    case OrderStatus.DELIVERED:
      return theme.successColor;
    case OrderStatus.CANCELLED:
      return theme.errorColor;
    default:
      return theme.secondaryColor;
  }
}

/**
 * Get order status icon
 */
export function getOrderStatusIcon(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING:
      return 'clock';
    case OrderStatus.CONFIRMED:
      return 'check-circle';
    case OrderStatus.PROCESSING:
      return 'package';
    case OrderStatus.SHIPPED:
      return 'truck';
    case OrderStatus.OUT_FOR_DELIVERY:
      return 'map-pin';
    case OrderStatus.DELIVERED:
      return 'check';
    case OrderStatus.CANCELLED:
      return 'x-circle';
    default:
      return 'circle';
  }
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Validate widget configuration
 */
export function validateWidgetConfig(config: {
  type: string;
  size: WidgetSize;
}): boolean {
  const validTypes = ['cart', 'deals', 'order_tracking', 'recommendations'];
  const validSizes = ['small', 'medium', 'large'];
  
  return validTypes.includes(config.type) && validSizes.includes(config.size);
}

/**
 * Get refresh interval for widget type
 */
export function getRefreshInterval(widgetType: string): number {
  return DEFAULT_REFRESH_INTERVALS[widgetType as keyof typeof DEFAULT_REFRESH_INTERVALS] || 30;
}

/**
 * Generate unique widget ID
 */
export function generateWidgetId(): string {
  return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Interpolate between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Format number with compact notation
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
