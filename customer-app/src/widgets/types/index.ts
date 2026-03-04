/**
 * Widget Types and Interfaces for TamaClothing App
 * 
 * This file defines the core types for home screen widgets
 * supporting both iOS WidgetKit and Android Glance API.
 */

import { ImageSourcePropType } from 'react-native';

// ============================================
// ENUMERATIONS
// ============================================

/** Widget size types */
export enum WidgetSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

/** Widget types available in the app */
export enum WidgetType {
  CART = 'cart',
  DEALS = 'deals',
  ORDER_TRACKING = 'order_tracking',
  RECOMMENDATIONS = 'recommendations'
}

/** Widget refresh policy */
export enum RefreshPolicy {
  TIMELINE = 'timeline',
  BACKGROUND = 'background',
  MANUAL = 'manual'
}

/** Order status for tracking widget */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// ============================================
// INTERFACES
// ============================================

/** Base widget data interface */
export interface WidgetData {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  lastUpdated: number;
  data: WidgetSpecificData;
}

/** Widget configuration interface */
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  refreshInterval: number; // in minutes
  refreshPolicy: RefreshPolicy;
  isEnabled: boolean;
}

/** Cart widget data */
export interface CartWidgetData {
  itemCount: number;
  totalAmount: number;
  currency: string;
  items: CartItemPreview[];
  language?: string;
}

/** Cart item preview for widget */
export interface CartItemPreview {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

/** Deals widget data */
export interface DealsWidgetData {
  activeDeals: Deal[];
  flashSaleEndTime?: number;
  flashSaleDiscount?: number;
  currency?: string;
  language?: string;
}

/** Deal information */
export interface Deal {
  id: string;
  title: string;
  description: string;
  discount: number;
  originalPrice: number;
  salePrice: number;
  imageUrl?: string;
  endsAt?: number;
  productId: string;
}

/** Order tracking widget data */
export interface OrderTrackingWidgetData {
  orderId: string;
  status: OrderStatus;
  statusText: string;
  progress?: number; // 0 to 1
  estimatedDelivery?: number;
  currentLocation?: string;
  items: OrderItemPreview[];
  trackingSteps: TrackingStep[];
  language?: string;
}

/** Order item preview */
export interface OrderItemPreview {
  id: string;
  name: string;
  quantity: number;
  imageUrl?: string;
}

/** Tracking step information */
export interface TrackingStep {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp?: number;
  isCompleted: boolean;
  isCurrent: boolean;
}

/** Recommendations widget data */
export interface RecommendationsWidgetData {
  products: ProductRecommendation[];
  currency?: string;
  language?: string;
}

/** Product recommendation */
export interface ProductRecommendation {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
}

/** Theme data for widgets */
export interface WidgetTheme {
  isDark: boolean;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  textSecondaryColor: string;
  accentColor: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
}

/** Widget timeline entry */
export interface WidgetTimelineEntry {
  date: number;
  data: WidgetSpecificData;
}

/** Union type for widget-specific data */
export type WidgetSpecificData =
  | CartWidgetData
  | DealsWidgetData
  | OrderTrackingWidgetData
  | RecommendationsWidgetData;

/** Widget action for deep linking */
export interface WidgetAction {
  type: string;
  payload?: Record<string, any>;
  url?: string;
}

/** Widget refresh request */
export interface WidgetRefreshRequest {
  widgetId: string;
  widgetType: WidgetType;
  forceRefresh?: boolean;
}

/** Widget refresh response */
export interface WidgetRefreshResponse {
  success: boolean;
  data?: WidgetSpecificData;
  error?: string;
  nextRefreshTime?: number;
}

/** Push notification payload for widget update */
export interface WidgetPushPayload {
  widgetType: WidgetType;
  updateType: 'full' | 'partial';
  data?: Partial<WidgetSpecificData>;
  action?: WidgetAction;
}

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type guard to check if data is CartWidgetData
 */
export function isCartWidgetData(data: WidgetSpecificData): data is CartWidgetData {
  return 'itemCount' in data && 'totalAmount' in data;
}

/**
 * Type guard to check if data is DealsWidgetData
 */
export function isDealsWidgetData(data: WidgetSpecificData): data is DealsWidgetData {
  return 'activeDeals' in data;
}

/**
 * Type guard to check if data is OrderTrackingWidgetData
 */
export function isOrderTrackingWidgetData(data: WidgetSpecificData): data is OrderTrackingWidgetData {
  return 'orderId' in data && 'status' in data;
}

/**
 * Type guard to check if data is RecommendationsWidgetData
 */
export function isRecommendationsWidgetData(data: WidgetSpecificData): data is RecommendationsWidgetData {
  return 'products' in data;
}

// ============================================
// CONSTANTS
// ============================================

/** Default refresh intervals in minutes */
export const DEFAULT_REFRESH_INTERVALS: Record<WidgetType, number> = {
  [WidgetType.CART]: 15,
  [WidgetType.DEALS]: 30,
  [WidgetType.ORDER_TRACKING]: 60,
  [WidgetType.RECOMMENDATIONS]: 60
};

/** Widget size dimensions for iOS (points) */
export const IOS_WIDGET_DIMENSIONS: Record<WidgetSize, { width: number; height: number }> = {
  [WidgetSize.SMALL]: { width: 155, height: 155 },
  [WidgetSize.MEDIUM]: { width: 329, height: 155 },
  [WidgetSize.LARGE]: { width: 329, height: 345 }
};

/** Widget size dimensions for Android (dp) */
export const ANDROID_WIDGET_DIMENSIONS: Record<WidgetSize, { minWidth: number; minHeight: number }> = {
  [WidgetSize.SMALL]: { minWidth: 110, minHeight: 110 },
  [WidgetSize.MEDIUM]: { minWidth: 180, minHeight: 110 },
  [WidgetSize.LARGE]: { minWidth: 250, minHeight: 180 }
};

/** Widget kind identifiers for platform-specific implementations */
export const WIDGET_KINDS: Record<WidgetType, string> = {
  [WidgetType.CART]: 'CartWidget',
  [WidgetType.DEALS]: 'DealsWidget',
  [WidgetType.ORDER_TRACKING]: 'OrderTrackingWidget',
  [WidgetType.RECOMMENDATIONS]: 'RecommendationsWidget'
};

/** Deep link URLs for widget actions */
export const WIDGET_DEEP_LINKS: Record<WidgetType, string> = {
  [WidgetType.CART]: 'bey3a-app://cart',
  [WidgetType.DEALS]: 'bey3a-app://deals',
  [WidgetType.ORDER_TRACKING]: 'bey3a-app://orders',
  [WidgetType.RECOMMENDATIONS]: 'bey3a-app://recommendations'
};
