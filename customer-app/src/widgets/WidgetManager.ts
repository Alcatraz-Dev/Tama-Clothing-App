/**
 * Widget Manager for Expo Integration
 * 
 * Provides a unified interface for managing home screen widgets
 * across both iOS and Android platforms.
 */

import { Platform, NativeModules } from 'react-native';
import { WidgetType, WidgetSize, WidgetSpecificData, DEFAULT_REFRESH_INTERVALS } from './types';
import WidgetDataService from './services/WidgetDataService';

// ============================================
// WIDGET MANAGER
// ============================================

/**
 * WidgetManager class provides a unified API for managing
 * home screen widgets across iOS and Android.
 */
class WidgetManager {
  private static instance: WidgetManager;
  private dataService: WidgetDataService;
  private isInitialized: boolean = false;

  private constructor() {
    this.dataService = WidgetDataService.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WidgetManager {
    if (!WidgetManager.instance) {
      WidgetManager.instance = new WidgetManager();
    }
    return WidgetManager.instance;
  }

  /**
   * Initialize the widget manager
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize data service
      await this.dataService.getWidgetData(WidgetType.CART, WidgetSize.MEDIUM);
      this.isInitialized = true;
      console.log('WidgetManager initialized successfully');

      this.refreshAllWidgets().catch(e => {
        console.error('Failed to immediately refresh widgets', e)
      });
    } catch (error) {
      console.error('Failed to initialize WidgetManager:', error);
    }
  }

  /**
   * Update widget data
   */
  public async updateWidgetData(
    widgetType: WidgetType,
    size: WidgetSize,
    data: WidgetSpecificData
  ): Promise<void> {
    try {
      // Save to local cache
      await this.dataService.saveWidgetData(widgetType, size, data);

      // Trigger platform-specific widget update
      if (Platform.OS === 'ios') {
        await this.updateiOSWidget(widgetType);
      } else {
        await this.updateAndroidWidget(widgetType);
      }
    } catch (error) {
      console.error('Failed to update widget data:', error);
    }
  }

  /**
   * Refresh widget from remote data
   */
  public async refreshWidget(
    widgetType: WidgetType,
    size: WidgetSize = WidgetSize.MEDIUM
  ): Promise<boolean> {
    try {
      const result = await this.dataService.refreshWidgetData(widgetType, size);

      if (result.success && result.data) {
        await this.updateWidgetData(widgetType, size, result.data);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to refresh widget:', error);
      return false;
    }
  }

  /**
   * Refresh all widgets
   */
  public async refreshAllWidgets(): Promise<void> {
    const sizes: WidgetSize[] = [WidgetSize.SMALL, WidgetSize.MEDIUM, WidgetSize.LARGE];
    const types: WidgetType[] = [
      WidgetType.CART,
      WidgetType.DEALS,
      WidgetType.ORDER_TRACKING,
      WidgetType.RECOMMENDATIONS
    ];

    for (const type of types) {
      for (const size of sizes) {
        await this.refreshWidget(type, size);
      }
    }
  }

  /**
   * Clear widget cache
   */
  public async clearCache(): Promise<void> {
    await this.dataService.clearCache();
  }

  /**
   * Clear sensitive data (for logout)
   */
  public async clearSensitiveData(): Promise<void> {
    await this.dataService.clearSensitiveData();
  }

  /**
   * Get last update time for a widget
   */
  public async getLastUpdateTime(
    widgetType: WidgetType,
    size: WidgetSize
  ): Promise<number | null> {
    return this.dataService.getLastUpdateTime(widgetType, size);
  }

  /**
   * iOS widget update via expo-widgets
   */
  private async updateiOSWidget(widgetType: WidgetType): Promise<void> {
    try {
      const { isCartWidgetData, isDealsWidgetData, isOrderTrackingWidgetData, isRecommendationsWidgetData } = await import('./types');

      switch (widgetType) {
        case WidgetType.CART: {
          // @ts-ignore
          const CartWidget = (await import('./CartHomeWidget')).default;
          const cachedData = await this.dataService.getWidgetData(WidgetType.CART, WidgetSize.MEDIUM);

          if (cachedData && isCartWidgetData(cachedData)) {
            CartWidget.updateSnapshot({
              itemCount: cachedData.itemCount,
              totalAmount: cachedData.totalAmount,
              currency: cachedData.currency,
              items: cachedData.items.map((item: any) => ({
                name: item.name,
                price: item.price,
                imageUrl: item.imageUrl
              }))
            });
          }
          break;
        }

        case WidgetType.DEALS: {
          // @ts-ignore
          const DealsWidget = (await import('./DealsWidget')).default;
          const cachedData = await this.dataService.getWidgetData(WidgetType.DEALS, WidgetSize.MEDIUM);
          if (cachedData && isDealsWidgetData(cachedData)) {
            DealsWidget.updateSnapshot({
              activeDeals: cachedData.activeDeals,
              currency: 'USD'
            });
          }
          break;
        }

        case WidgetType.ORDER_TRACKING: {
          // @ts-ignore
          const OrderTrackingWidget = (await import('./OrderTrackingWidget')).default;
          const cachedData = await this.dataService.getWidgetData(WidgetType.ORDER_TRACKING, WidgetSize.MEDIUM);
          if (cachedData && isOrderTrackingWidgetData(cachedData)) {
            OrderTrackingWidget.updateSnapshot({
              orderId: cachedData.orderId,
              statusText: cachedData.statusText,
              estimatedDelivery: cachedData.estimatedDelivery ? new Date(cachedData.estimatedDelivery).toLocaleDateString() : undefined
            });
          }
          break;
        }

        case WidgetType.RECOMMENDATIONS: {
          // @ts-ignore
          const RecommendationsWidget = (await import('./RecommendationsWidget')).default;
          const cachedData = await this.dataService.getWidgetData(WidgetType.RECOMMENDATIONS, WidgetSize.MEDIUM);
          if (cachedData && isRecommendationsWidgetData(cachedData)) {
            RecommendationsWidget.updateSnapshot({
              products: cachedData.products,
              currency: 'USD'
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error('iOS widget update failed:', error);
    }
  }

  /**
   * Android widget update via react-native-android-widget
   */
  private async updateAndroidWidget(widgetType: WidgetType): Promise<void> {
    try {
      const { requestWidgetUpdate } = await import('react-native-android-widget');
      const { isCartWidgetData, isDealsWidgetData, isOrderTrackingWidgetData, isRecommendationsWidgetData } = await import('./types');
      const React = await import('react');

      switch (widgetType) {
        case WidgetType.CART: {
          const { CartWidget } = await import('./android/CartWidget');
          // Update Medium
          const medData = await this.dataService.getWidgetData(WidgetType.CART, WidgetSize.MEDIUM);
          if (medData && isCartWidgetData(medData)) {
            requestWidgetUpdate({
              widgetName: 'CartWidget',
              renderWidget: () => React.createElement(CartWidget, {
                itemCountValue: medData.itemCount,
                totalAmountValue: medData.totalAmount,
                currencyCode: medData.currency,
                size: WidgetSize.MEDIUM
              })
            });
          }
          // Update Large
          const largeData = await this.dataService.getWidgetData(WidgetType.CART, WidgetSize.LARGE) || medData;
          if (largeData && isCartWidgetData(largeData)) {
            requestWidgetUpdate({
              widgetName: 'CartWidgetLarge',
              renderWidget: () => React.createElement(CartWidget, {
                itemCountValue: largeData.itemCount,
                totalAmountValue: largeData.totalAmount,
                currencyCode: largeData.currency,
                size: WidgetSize.LARGE
              })
            });
          }
          break;
        }

        case WidgetType.DEALS: {
          const { DealsWidget } = await import('./android/DealsWidget');
          const medData = await this.dataService.getWidgetData(WidgetType.DEALS, WidgetSize.MEDIUM);
          if (medData && isDealsWidgetData(medData)) {
            requestWidgetUpdate({
              widgetName: 'DealsWidget',
              renderWidget: () => React.createElement(DealsWidget, {
                dealsCount: medData.activeDeals?.length || 0,
                size: WidgetSize.MEDIUM
              })
            });
          }
          const largeData = await this.dataService.getWidgetData(WidgetType.DEALS, WidgetSize.LARGE) || medData;
          if (largeData && isDealsWidgetData(largeData)) {
            requestWidgetUpdate({
              widgetName: 'DealsWidgetLarge',
              renderWidget: () => React.createElement(DealsWidget, {
                dealsCount: largeData.activeDeals?.length || 0,
                size: WidgetSize.LARGE
              })
            });
          }
          break;
        }

        case WidgetType.ORDER_TRACKING: {
          const { OrderTrackingWidget } = await import('./android/OrderTrackingWidget');
          const medData = await this.dataService.getWidgetData(WidgetType.ORDER_TRACKING, WidgetSize.MEDIUM);
          if (medData && isOrderTrackingWidgetData(medData)) {
            requestWidgetUpdate({
              widgetName: 'OrderTrackingWidget',
              renderWidget: () => React.createElement(OrderTrackingWidget, {
                orderIdString: medData.orderId,
                statusString: medData.statusText,
                size: WidgetSize.MEDIUM
              })
            });
          }
          const largeData = await this.dataService.getWidgetData(WidgetType.ORDER_TRACKING, WidgetSize.LARGE) || medData;
          if (largeData && isOrderTrackingWidgetData(largeData)) {
            requestWidgetUpdate({
              widgetName: 'OrderTrackingWidgetLarge',
              renderWidget: () => React.createElement(OrderTrackingWidget, {
                orderIdString: largeData.orderId,
                statusString: largeData.statusText,
                size: WidgetSize.LARGE
              })
            });
          }
          break;
        }

        case WidgetType.RECOMMENDATIONS: {
          const { RecommendationsWidget } = await import('./android/RecommendationsWidget');
          const medData = await this.dataService.getWidgetData(WidgetType.RECOMMENDATIONS, WidgetSize.MEDIUM);
          if (medData && isRecommendationsWidgetData(medData)) {
            requestWidgetUpdate({
              widgetName: 'RecommendationsWidget',
              renderWidget: () => React.createElement(RecommendationsWidget, {
                recCount: medData.products?.length || 0,
                size: WidgetSize.MEDIUM
              })
            });
          }
          const largeData = await this.dataService.getWidgetData(WidgetType.RECOMMENDATIONS, WidgetSize.LARGE) || medData;
          if (largeData && isRecommendationsWidgetData(largeData)) {
            requestWidgetUpdate({
              widgetName: 'RecommendationsWidgetLarge',
              renderWidget: () => React.createElement(RecommendationsWidget, {
                recCount: largeData.products?.length || 0,
                size: WidgetSize.LARGE
              })
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error('Android widget update failed:', error);
    }
  }

  /**
   * Get refresh interval for widget type
   */
  public getRefreshInterval(widgetType: WidgetType): number {
    return DEFAULT_REFRESH_INTERVALS[widgetType] || 30;
  }

  /**
   * Schedule automatic refresh
   */
  public startAutoRefresh(): void {
    const types: WidgetType[] = [
      WidgetType.CART,
      WidgetType.DEALS,
      WidgetType.ORDER_TRACKING,
      WidgetType.RECOMMENDATIONS
    ];

    types.forEach((type) => {
      const interval = this.getRefreshInterval(type) * 60 * 1000; // Convert to ms

      setInterval(() => {
        this.refreshWidget(type);
      }, interval);
    });
  }
}

export default WidgetManager;
