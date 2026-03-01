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
      if (widgetType === WidgetType.CART) {
        // Dynamically import to ensure widget is registered properly in JS
        const CartWidget = (await import('./CartHomeWidget')).default;

        // Let's get the latest data we just saved. We use a default size for data fetching.
        // It fetches local cached data.
        const cachedData = await this.dataService.getWidgetData(WidgetType.CART, WidgetSize.MEDIUM);
        if (cachedData && 'itemCount' in cachedData) {
          const cartData = cachedData as import('./types').CartWidgetData;

          CartWidget.updateSnapshot({
            itemCount: cartData.itemCount,
            totalAmount: cartData.totalAmount,
            currency: cartData.currency,
            items: cartData.items.map((item: any) => ({
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl
            }))
          });
        }
      }
    } catch (error) {
      console.error('iOS widget update failed:', error);
    }
  }

  /**
   * Android widget update via native bridge
   */
  private async updateAndroidWidget(widgetType: WidgetType): Promise<void> {
    try {
      const { TamaWidgetsModule } = NativeModules;

      if (TamaWidgetsModule) {
        switch (widgetType) {
          case WidgetType.CART:
            await TamaWidgetsModule.updateCartWidget();
            break;
          case WidgetType.DEALS:
            await TamaWidgetsModule.updateDealsWidget();
            break;
          case WidgetType.ORDER_TRACKING:
            await TamaWidgetsModule.updateOrderTrackingWidget();
            break;
          case WidgetType.RECOMMENDATIONS:
            await TamaWidgetsModule.updateRecommendationsWidget();
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
