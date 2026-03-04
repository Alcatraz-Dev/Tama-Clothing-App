import { Platform, Appearance } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { WidgetType, WidgetSize, WidgetSpecificData, DEFAULT_REFRESH_INTERVALS } from './types';
import WidgetDataService from './services/WidgetDataService';

// ✅ Robust Expo Go detection to skip native widget modules
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo' ||
  !Constants.expoConfig; // Extra layer for vanilla/Go differences

console.log('Widget Environment:', {
  env: Constants.executionEnvironment,
  ownership: Constants.appOwnership,
  isExpoGo
});

// ✅ Conditionally import iOS Widgets to avoid crashes in Expo Go
let CartWidget: any = null;
let DealsWidget: any = null;
let OrderTrackingWidget: any = null;
let RecommendationsWidget: any = null;

if (!isExpoGo && Platform.OS === 'ios') {
  try {
    // Check if the native module for ExpoUI is actually present before requiring
    // This is safer than relying solely on isExpoGo
    const { requireNativeModule } = require('expo-modules-core');
    try {
      requireNativeModule('ExpoUI');

      // If we are here, we are likely in a dev client or a production build with the module
      CartWidget = require('./CartHomeWidget').default;
      DealsWidget = require('./DealsWidget').default;
      OrderTrackingWidget = require('./OrderTrackingWidget').default;
      RecommendationsWidget = require('./RecommendationsWidget').default;
    } catch (e) {
      console.log('ExpoUI native module not found, skipping widgets');
    }
  } catch (error) {
    console.log('Skipping native iOS widgets (Expected in Expo Go)');
  }
}

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

    if (isExpoGo) {
      console.log('WidgetManager: Skipping native initialization in Expo Go');
      this.isInitialized = true;
      return;
    }

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
      // Save to local cache - this uses AsyncStorage so it's always safe
      await this.dataService.saveWidgetData(widgetType, size, data);

      // Skip native updates in Expo Go
      if (isExpoGo) {
        return;
      }

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
      const isDark = Appearance.getColorScheme() === 'dark';

      switch (widgetType) {
        case WidgetType.CART: {
          const cachedData = await this.dataService.getWidgetData(WidgetType.CART, WidgetSize.MEDIUM);
          if (cachedData && isCartWidgetData(cachedData) && CartWidget?.updateSnapshot) {
            CartWidget.updateSnapshot({
              itemCount: cachedData.itemCount,
              totalAmount: cachedData.totalAmount,
              currency: cachedData.currency,
              items: cachedData.items,
              isDark
            });
          }
          break;
        }

        case WidgetType.DEALS: {
          const cachedData = await this.dataService.getWidgetData(WidgetType.DEALS, WidgetSize.MEDIUM);
          if (cachedData && isDealsWidgetData(cachedData) && DealsWidget?.updateSnapshot) {
            DealsWidget.updateSnapshot({
              activeDeals: cachedData.activeDeals,
              currency: cachedData.currency || 'TND',
              isDark
            });
          }
          break;
        }

        case WidgetType.ORDER_TRACKING: {
          const cachedData = await this.dataService.getWidgetData(WidgetType.ORDER_TRACKING, WidgetSize.MEDIUM);
          if (cachedData && isOrderTrackingWidgetData(cachedData) && OrderTrackingWidget?.updateSnapshot) {
            const etaMinutes = cachedData.estimatedDelivery ? Math.ceil((cachedData.estimatedDelivery - Date.now()) / 60000) : 15;
            OrderTrackingWidget.updateSnapshot({
              orderId: cachedData.orderId,
              statusText: cachedData.statusText,
              estimatedDelivery: etaMinutes > 60 ? `${Math.floor(etaMinutes / 60)}h ${etaMinutes % 60}m` : `${etaMinutes}m`,
              isDark
            });
          }
          break;
        }

        case WidgetType.RECOMMENDATIONS: {
          const cachedData = await this.dataService.getWidgetData(WidgetType.RECOMMENDATIONS, WidgetSize.MEDIUM);
          if (cachedData && isRecommendationsWidgetData(cachedData) && RecommendationsWidget?.updateSnapshot) {
            RecommendationsWidget.updateSnapshot({
              products: cachedData.products,
              isDark
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error('iOS widget update failed:', error);
    }
  }


  private async updateAndroidWidget(widgetType: WidgetType): Promise<void> {
    try {
      const { requestWidgetUpdate } = await import('react-native-android-widget');
      const { isCartWidgetData, isDealsWidgetData, isOrderTrackingWidgetData, isRecommendationsWidgetData } = await import('./types');
      const React = await import('react');
      const isDark = Appearance.getColorScheme() === 'dark';

      switch (widgetType) {
        case WidgetType.CART: {
          const { CartWidget } = await import('./android/CartWidget');
          const medData = await this.dataService.getWidgetData(WidgetType.CART, WidgetSize.MEDIUM);
          if (medData && isCartWidgetData(medData)) {
            requestWidgetUpdate({
              widgetName: 'CartWidget',
              renderWidget: () => React.createElement(CartWidget, {
                itemCountValue: medData.itemCount,
                totalAmountValue: medData.totalAmount,
                currencyCode: medData.currency,
                size: WidgetSize.MEDIUM,
                isDark
              })
            });
          }
          const largeData = await this.dataService.getWidgetData(WidgetType.CART, WidgetSize.LARGE) || medData;
          if (largeData && isCartWidgetData(largeData)) {
            requestWidgetUpdate({
              widgetName: 'CartWidgetLarge',
              renderWidget: () => React.createElement(CartWidget, {
                itemCountValue: largeData.itemCount,
                totalAmountValue: largeData.totalAmount,
                currencyCode: largeData.currency,
                size: WidgetSize.LARGE,
                isDark
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
                activeDeals: medData.activeDeals || [],
                size: WidgetSize.MEDIUM,
                isDark
              })
            });
          }
          const largeData = await this.dataService.getWidgetData(WidgetType.DEALS, WidgetSize.LARGE) || medData;
          if (largeData && isDealsWidgetData(largeData)) {
            requestWidgetUpdate({
              widgetName: 'DealsWidgetLarge',
              renderWidget: () => React.createElement(DealsWidget, {
                activeDeals: largeData.activeDeals || [],
                size: WidgetSize.LARGE,
                isDark
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
                progress: medData.progress || 0,
                estimatedDelivery: medData.estimatedDelivery,
                size: WidgetSize.MEDIUM,
                isDark
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
                progress: largeData.progress || 0,
                estimatedDelivery: largeData.estimatedDelivery,
                size: WidgetSize.LARGE,
                isDark
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
                products: medData.products || [],
                size: WidgetSize.MEDIUM,
                isDark
              })
            });
          }
          const largeData = await this.dataService.getWidgetData(WidgetType.RECOMMENDATIONS, WidgetSize.LARGE) || medData;
          if (largeData && isRecommendationsWidgetData(largeData)) {
            requestWidgetUpdate({
              widgetName: 'RecommendationsWidgetLarge',
              renderWidget: () => React.createElement(RecommendationsWidget, {
                products: largeData.products || [],
                size: WidgetSize.LARGE,
                isDark
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
