try {
    if (typeof globalThis.Buffer === 'undefined') {
        const { Buffer } = require('buffer');
        globalThis.Buffer = Buffer;
    }
} catch (e) {
    console.warn('Buffer polyfill failed:', e);
}

import React from 'react';
import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { CartWidget } from './src/widgets/android/CartWidget';
import { DealsWidget } from './src/widgets/android/DealsWidget';
import { OrderTrackingWidget } from './src/widgets/android/OrderTrackingWidget';
import { RecommendationsWidget } from './src/widgets/android/RecommendationsWidget';
import WidgetManager from './src/widgets/WidgetManager';
import { WidgetType, WidgetSize } from './src/widgets/types';

import App from './App';

// Android Widget Task Handler
registerWidgetTaskHandler(async (props) => {
    const { widgetInfo, renderWidget, widgetAction } = props;
    const { widgetName } = widgetInfo;

    if (widgetAction === 'WIDGET_ADDED' || widgetAction === 'WIDGET_UPDATE' || widgetAction === 'WIDGET_RESIZED') {
        const manager = WidgetManager.getInstance();

        switch (widgetName) {
            case 'CartWidget':
            case 'CartWidgetLarge':
            case 'CartWidgetSmall': {
                const size = widgetName.endsWith('Large') ? WidgetSize.LARGE : (widgetName.endsWith('Small') ? WidgetSize.SMALL : WidgetSize.MEDIUM);
                const data: any = await manager['dataService'].getWidgetData(WidgetType.CART, size)
                    || await manager['dataService'].getWidgetData(WidgetType.CART, WidgetSize.MEDIUM);
                renderWidget(React.createElement(CartWidget, {
                    itemCountValue: data?.itemCount || 0,
                    totalAmountValue: data?.totalAmount || 0,
                    currencyCode: data?.currency || 'TND',
                    size: size
                }));
                break;
            }
            case 'DealsWidget':
            case 'DealsWidgetLarge':
            case 'DealsWidgetSmall': {
                const size = widgetName.endsWith('Large') ? WidgetSize.LARGE : (widgetName.endsWith('Small') ? WidgetSize.SMALL : WidgetSize.MEDIUM);
                const data: any = await manager['dataService'].getWidgetData(WidgetType.DEALS, size)
                    || await manager['dataService'].getWidgetData(WidgetType.DEALS, WidgetSize.MEDIUM);
                renderWidget(React.createElement(DealsWidget, {
                    dealsCount: data?.activeDeals?.length || 0,
                    size: size
                }));
                break;
            }
            case 'OrderTrackingWidget':
            case 'OrderTrackingWidgetLarge':
            case 'OrderTrackingWidgetSmall': {
                const size = widgetName.endsWith('Large') ? WidgetSize.LARGE : (widgetName.endsWith('Small') ? WidgetSize.SMALL : WidgetSize.MEDIUM);
                const data: any = await manager['dataService'].getWidgetData(WidgetType.ORDER_TRACKING, size)
                    || await manager['dataService'].getWidgetData(WidgetType.ORDER_TRACKING, WidgetSize.MEDIUM);
                renderWidget(React.createElement(OrderTrackingWidget, {
                    orderIdString: data?.orderId || '',
                    statusString: data?.statusText || 'Aucun suivi',
                    size: size
                }));
                break;
            }
            case 'RecommendationsWidget':
            case 'RecommendationsWidgetLarge':
            case 'RecommendationsWidgetSmall': {
                const size = widgetName.endsWith('Large') ? WidgetSize.LARGE : (widgetName.endsWith('Small') ? WidgetSize.SMALL : WidgetSize.MEDIUM);
                const data: any = await manager['dataService'].getWidgetData(WidgetType.RECOMMENDATIONS, size)
                    || await manager['dataService'].getWidgetData(WidgetType.RECOMMENDATIONS, WidgetSize.MEDIUM);
                renderWidget(React.createElement(RecommendationsWidget, {
                    recCount: data?.products?.length || 0,
                    size: size
                }));
                break;
            }
        }
    }
});

registerRootComponent(App);
