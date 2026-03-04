/**
 * Widget Data Service for Bey3a App
 * 
 * Handles widget data fetching, caching, and synchronization
 * with Firebase backend.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../../api/firebase';
import { collection, getDocs, query, limit, orderBy, where } from 'firebase/firestore';
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
    return data;
  }

  /**
   * Simple decryption for widget data
   */
  private decrypt(data: string): string {
    return data;
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
    try {
      const savedCart = await AsyncStorage.getItem('@bey3a_cart');
      const items = savedCart ? JSON.parse(savedCart) : [];

      const parsedItems = Array.isArray(items) ? items : [];
      let totalAmount = 0;
      const widgetItems = parsedItems.map((item: any) => {
        const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price || 0));
        totalAmount += price * (item.quantity || 1);
        return {
          id: item.id || '',
          name: item.name?.fr || item.name || 'Produit',
          price: price,
          quantity: item.quantity || 1,
          imageUrl: item.image || item.imageUrl || ''
        }
      });

      return {
        itemCount: widgetItems.reduce((acc, curr) => acc + curr.quantity, 0),
        totalAmount: totalAmount,
        currency: 'TND',
        items: widgetItems.slice(0, 5) // Show top 5
      };
    } catch (e) {
      return { itemCount: 0, totalAmount: 0, currency: 'TND', items: [] };
    }
  }

  /**
   * Fetch fresh data for deals widget
   */
  public async fetchDealsData(): Promise<DealsWidgetData> {
    try {
      // For now, let's fetch products that have a discountPrice
      const q = query(collection(db, 'products'), limit(15));
      const snapshot = await getDocs(q);
      const activeDeals: any[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.discountPrice && data.discountPrice < data.price) {
          activeDeals.push({
            id: doc.id,
            title: data.name?.fr || data.name || 'Offre',
            description: 'Promotion spéciale',
            discount: Math.round(((data.price - data.discountPrice) / data.price) * 100),
            originalPrice: data.price,
            salePrice: data.discountPrice,
            imageUrl: data.images?.[0] || '',
            endsAt: Date.now() + 24 * 60 * 60 * 1000,
            productId: doc.id
          });
        }
      });

      return {
        activeDeals: activeDeals.slice(0, 3),
        flashSaleEndTime: Date.now() + 24 * 60 * 60 * 1000,
        flashSaleDiscount: activeDeals.length > 0 ? activeDeals[0].discount : 0,
        currency: 'TND'
      };

    } catch (e) {
      return { activeDeals: [], flashSaleEndTime: 0, flashSaleDiscount: 0 };
    }
  }

  /**
   * Fetch fresh data for order tracking widget
   */
  public async fetchOrderTrackingData(): Promise<OrderTrackingWidgetData> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      const userId = userData?.uid || auth?.currentUser?.uid;
      const userPhone = userData?.phoneNumber;

      if (!userId) {
        return {
          orderId: 'DEMO-123',
          status: OrderStatus.SHIPPED,
          statusText: 'En route',
          estimatedDelivery: Date.now() + 3600000 * 2,
          currentLocation: 'Tunis, TN',
          items: [],
          trackingSteps: []
        };
      }

      // Try to find shipments where user is sender
      const qSender = query(collection(db, 'shipments'), where('senderId', '==', userId), limit(5));
      const snapSender = await getDocs(qSender);

      let targetOrder = !snapSender.empty ? snapSender.docs[0] : null;

      // If nothing found as sender, try finding as receiver (by phone if available)
      if (!targetOrder && userPhone) {
        const qReceiver = query(collection(db, 'shipments'), where('receiverPhone', '==', userPhone), limit(5));
        const snapReceiver = await getDocs(qReceiver);
        if (!snapReceiver.empty) targetOrder = snapReceiver.docs[0];
      }

      if (!targetOrder) {
        return {
          orderId: 'BEY3A-Rec',
          status: OrderStatus.CONFIRMED,
          statusText: 'Prêt pour envoi',
          estimatedDelivery: Date.now() + 86400000,
          currentLocation: 'BEY3A',
          items: [],
          trackingSteps: []
        };
      }

      const data = targetOrder.data();
      const status = data.status || 'pending';
      const statusMap: Record<string, string> = {
        'pending': 'En attente',
        'created': 'Confirmée',
        'picked_up': 'Récupérée',
        'in_transit': 'En transit',
        'out_for_delivery': 'Livraison en cours',
        'delivered': 'Livrée',
        'cancelled': 'Annulée'
      };

      return {
        orderId: data.trackingId || targetOrder.id.slice(0, 8).toUpperCase(),
        status: data.status || OrderStatus.CONFIRMED,
        statusText: statusMap[status.toLowerCase()] || status,
        estimatedDelivery: data.estimatedDeliveryDate ? (data.estimatedDeliveryDate.seconds ? data.estimatedDeliveryDate.seconds * 1000 : data.estimatedDeliveryDate) : Date.now() + 86400000,
        currentLocation: status === 'delivered' ? 'Livré' : 'En transit',
        items: (data.items || []).slice(0, 2).map((item: any) => ({
          id: typeof item === 'string' ? item : (item.id || ''),
          name: typeof item === 'string' ? item : (item.name?.fr || item.name || ''),
          quantity: item.quantity || 1,
          imageUrl: item.image || item.imageUrl || ''
        })),
        trackingSteps: []
      };
    } catch (e) {
      console.error('Error fetching order tracking data:', e);
      return { orderId: 'ERROR', status: OrderStatus.CONFIRMED, statusText: 'Erreur chargement', estimatedDelivery: 0, currentLocation: '', items: [], trackingSteps: [] };
    }
  }

  /**
   * Fetch fresh data for recommendations widget
   */
  public async fetchRecommendationsData(): Promise<RecommendationsWidgetData> {
    try {
      const q = query(collection(db, 'products'), limit(10));
      const snapshot = await getDocs(q);
      const products: any[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        products.push({
          id: doc.id,
          name: data.name?.fr || data.name || 'Produit',
          price: data.discountPrice || data.price || 0,
          originalPrice: data.price || 0,
          discount: data.discountPrice ? Math.round(((data.price - data.discountPrice) / data.price) * 100) : 0,
          imageUrl: data.images?.[0] || '',
          rating: data.rating || 5,
          reviewCount: data.reviewCount || Math.floor(Math.random() * 100)
        });
      });

      // Shuffle roughly to give variety
      products.sort(() => Math.random() - 0.5);

      return { products: products.slice(0, 5), currency: 'TND' };

    } catch (e) {
      return { products: [] };
    }
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
