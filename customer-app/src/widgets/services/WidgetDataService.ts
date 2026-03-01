/**
 * Widget Data Service for TamaClothing App
 * 
 * Handles widget data fetching, caching, and synchronization
 * with Firebase backend.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WidgetType,
  WidgetSize,
  WidgetSpecificData,
  CartWidgetData,
  DealsWidgetData,
  OrderTrackingWidgetData,
  RecommendationsWidgetData,
  WidgetRefreshResponse,
  OrderStatus,
  DEFAULT_REFRESH_INTERVALS
} from '../types';

// ============================================
// STORAGE KEYS
// ============================================

const WIDGET_DATA_PREFIX = 'widget_data_';
const WIDGET_CONFIG_PREFIX = 'widget_config_';
const WIDGET_THEME_PREFIX = 'widget_theme_';
const WIDGET_CACHE_TIMESTAMP_PREFIX = 'widget_cache_';

// ============================================
// WIDGET DATA SERVICE
// ============================================

/**
 * WidgetDataService class handles all widget data operations
 * including fetching from Firebase, caching, and encryption.
 */
class WidgetDataService {
  private static instance: WidgetDataService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private encryptionKey: string | null = null;

  private constructor() {
    this.initializeEncryption();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WidgetDataService {
    if (!WidgetDataService.instance) {
      WidgetDataService.instance = new WidgetDataService();
    }
    return WidgetDataService.instance;
  }

  /**
   * Initialize encryption key for secure storage
   */
  private async initializeEncryption(): Promise<void> {
    try {
      // Try to get existing encryption key from AsyncStorage
      this.encryptionKey = await AsyncStorage.getItem('widget_encryption_key');
      
      if (!this.encryptionKey) {
        // Generate new encryption key
        this.encryptionKey = this.generateEncryptionKey();
        await AsyncStorage.setItem('widget_encryption_key', this.encryptionKey);
      }
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      // Use fallback key
      this.encryptionKey = 'fallback_key_widget_2024';
    }
  }

  /**
   * Generate a random encryption key
   */
  private generateEncryptionKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Simple encryption for widget data (for demonstration)
   * In production, use a proper encryption library
   */
  private encrypt(data: string): string {
    if (!this.encryptionKey) return data;
    // Simple XOR encryption - replace with AES in production
    const key = this.encryptionKey;
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return Buffer.from(result, 'binary').toString('base64');
  }

  /**
   * Simple decryption for widget data
   */
  private decrypt(data: string): string {
    if (!this.encryptionKey) return data;
    try {
      const decoded = Buffer.from(data, 'base64').toString('binary');
      const key = this.encryptionKey;
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch {
      return data;
    }
  }

  /**
   * Get cached data for a widget
   */
  public async getWidgetData(
    widgetType: WidgetType,
    size: WidgetSize
  ): Promise<WidgetSpecificData | null> {
    const cacheKey = `${widgetType}_${size}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      const refreshInterval = DEFAULT_REFRESH_INTERVALS[widgetType];
      const timeSinceUpdate = Date.now() - cached.timestamp;
      
      // Return cached data if it's still fresh
      if (timeSinceUpdate < refreshInterval * 60 * 1000) {
        return cached.data;
      }
    }

    // Try to get from AsyncStorage
    try {
      const storageKey = WIDGET_DATA_PREFIX + cacheKey;
      const storedData = await AsyncStorage.getItem(storageKey);
      
      if (storedData) {
        const decryptedData = this.decrypt(storedData);
        const parsedData = JSON.parse(decryptedData);
        
        // Update cache
        this.cache.set(cacheKey, { data: parsedData, timestamp: Date.now() });
        
        return parsedData;
      }
    } catch (error) {
      console.error('Failed to get widget data from cache:', error);
    }

    return null;
  }

  /**
   * Save widget data to cache
   */
  public async saveWidgetData(
    widgetType: WidgetType,
    size: WidgetSize,
    data: WidgetSpecificData
  ): Promise<void> {
    const cacheKey = `${widgetType}_${size}`;
    
    // Update memory cache
    this.cache.set(cacheKey, { data, timestamp: Date.now() });

    // Save to AsyncStorage with encryption
    try {
      const storageKey = WIDGET_DATA_PREFIX + cacheKey;
      const jsonData = JSON.stringify(data);
      const encryptedData = this.encrypt(jsonData);
      await AsyncStorage.setItem(storageKey, encryptedData);
      
      // Save timestamp
      await AsyncStorage.setItem(
        WIDGET_CACHE_TIMESTAMP_PREFIX + cacheKey,
        Date.now().toString()
      );
    } catch (error) {
      console.error('Failed to save widget data to cache:', error);
    }
  }

  /**
   * Fetch fresh data for cart widget
   * This would connect to Firebase in a real implementation
   */
  public async fetchCartData(): Promise<CartWidgetData> {
    // Simulated data - replace with actual Firebase query
    // In production, this would query Firestore for cart items
    return {
      itemCount: 3,
      totalAmount: 149.99,
      currency: 'USD',
      items: [
        {
          id: '1',
          name: 'Classic White T-Shirt',
          price: 29.99,
          quantity: 1,
          imageUrl: 'https://example.com/image1.jpg'
        },
        {
          id: '2',
          name: 'Denim Jeans',
          price: 79.99,
          quantity: 1,
          imageUrl: 'https://example.com/image2.jpg'
        },
        {
          id: '3',
          name: 'Sneakers',
          price: 40.01,
          quantity: 1,
          imageUrl: 'https://example.com/image3.jpg'
        }
      ]
    };
  }

  /**
   * Fetch fresh data for deals widget
   */
  public async fetchDealsData(): Promise<DealsWidgetData> {
    // Simulated data - replace with actual Firebase query
    return {
      activeDeals: [
        {
          id: 'deal1',
          title: 'Summer Sale',
          description: 'Up to 50% off',
          discount: 50,
          originalPrice: 100,
          salePrice: 50,
          imageUrl: 'https://example.com/deal1.jpg',
          endsAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
          productId: 'prod1'
        },
        {
          id: 'deal2',
          title: 'Buy 1 Get 1 Free',
          description: 'On selected items',
          discount: 100,
          originalPrice: 50,
          salePrice: 0,
          imageUrl: 'https://example.com/deal2.jpg',
          endsAt: Date.now() + 5 * 60 * 60 * 1000,
          productId: 'prod2'
        }
      ],
      flashSaleEndTime: Date.now() + 2 * 60 * 60 * 1000,
      flashSaleDiscount: 50
    };
  }

  /**
   * Fetch fresh data for order tracking widget
   */
  public async fetchOrderTrackingData(): Promise<OrderTrackingWidgetData> {
    // Simulated data - replace with actual Firebase query
    return {
      orderId: 'ORD-12345',
      status: OrderStatus.SHIPPED,
      statusText: 'Your order has been shipped',
      estimatedDelivery: Date.now() + 24 * 60 * 60 * 1000,
      currentLocation: 'Distribution Center, City',
      items: [
        {
          id: 'item1',
          name: 'Classic White T-Shirt',
          quantity: 2,
          imageUrl: 'https://example.com/item1.jpg'
        }
      ],
      trackingSteps: [
        {
          status: OrderStatus.CONFIRMED,
          title: 'Order Confirmed',
          description: 'Your order has been confirmed',
          timestamp: Date.now() - 48 * 60 * 60 * 1000,
          isCompleted: true,
          isCurrent: false
        },
        {
          status: OrderStatus.PROCESSING,
          title: 'Processing',
          description: 'Your order is being prepared',
          timestamp: Date.now() - 24 * 60 * 60 * 1000,
          isCompleted: true,
          isCurrent: false
        },
        {
          status: OrderStatus.SHIPPED,
          title: 'Shipped',
          description: 'Your order is on its way',
          timestamp: Date.now() - 12 * 60 * 60 * 1000,
          isCompleted: true,
          isCurrent: true
        },
        {
          status: OrderStatus.DELIVERED,
          title: 'Delivered',
          description: 'Expected delivery',
          isCompleted: false,
          isCurrent: false
        }
      ]
    };
  }

  /**
   * Fetch fresh data for recommendations widget
   */
  public async fetchRecommendationsData(): Promise<RecommendationsWidgetData> {
    // Simulated data - replace with actual Firebase query
    return {
      products: [
        {
          id: 'rec1',
          name: 'Premium Cotton Hoodie',
          price: 59.99,
          originalPrice: 79.99,
          discount: 25,
          imageUrl: 'https://example.com/rec1.jpg',
          rating: 4.5,
          reviewCount: 128
        },
        {
          id: 'rec2',
          name: 'Leather Belt',
          price: 34.99,
          imageUrl: 'https://example.com/rec2.jpg',
          rating: 4.8,
          reviewCount: 256
        },
        {
          id: 'rec3',
          name: 'Canvas Backpack',
          price: 49.99,
          originalPrice: 69.99,
          discount: 29,
          imageUrl: 'https://example.com/rec3.jpg',
          rating: 4.3,
          reviewCount: 89
        }
      ]
    };
  }

  /**
   * Refresh widget data based on type
   */
  public async refreshWidgetData(
    widgetType: WidgetType,
    size: WidgetSize
  ): Promise<WidgetRefreshResponse> {
    try {
      let data: WidgetSpecificData;

      switch (widgetType) {
        case WidgetType.CART:
          data = await this.fetchCartData();
          break;
        case WidgetType.DEALS:
          data = await this.fetchDealsData();
          break;
        case WidgetType.ORDER_TRACKING:
          data = await this.fetchOrderTrackingData();
          break;
        case WidgetType.RECOMMENDATIONS:
          data = await this.fetchRecommendationsData();
          break;
        default:
          throw new Error(`Unknown widget type: ${widgetType}`);
      }

      // Save to cache
      await this.saveWidgetData(widgetType, size, data);

      return {
        success: true,
        data,
        nextRefreshTime: Date.now() + DEFAULT_REFRESH_INTERVALS[widgetType] * 60 * 1000
      };
    } catch (error) {
      console.error('Failed to refresh widget data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear all widget cache data
   */
  public async clearCache(): Promise<void> {
    this.cache.clear();
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const widgetKeys = keys.filter(key => 
        key.startsWith(WIDGET_DATA_PREFIX) ||
        key.startsWith(WIDGET_CONFIG_PREFIX) ||
        key.startsWith(WIDGET_THEME_PREFIX) ||
        key.startsWith(WIDGET_CACHE_TIMESTAMP_PREFIX)
      );
      await AsyncStorage.multiRemove(widgetKeys);
    } catch (error) {
      console.error('Failed to clear widget cache:', error);
    }
  }

  /**
   * Clear sensitive widget data (for logout)
   */
  public async clearSensitiveData(): Promise<void> {
    await this.clearCache();
    
    try {
      await AsyncStorage.removeItem('widget_encryption_key');
      this.encryptionKey = null;
    } catch (error) {
      console.error('Failed to clear sensitive data:', error);
    }
  }

  /**
   * Get last update timestamp for a widget
   */
  public async getLastUpdateTime(widgetType: WidgetType, size: WidgetSize): Promise<number | null> {
    try {
      const key = WIDGET_CACHE_TIMESTAMP_PREFIX + `${widgetType}_${size}`;
      const timestamp = await AsyncStorage.getItem(key);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch {
      return null;
    }
  }
}

export default WidgetDataService;
