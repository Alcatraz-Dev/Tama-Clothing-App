import React from 'react';
import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { CartWidget } from './src/widgets/android/CartWidget';
import { DealsWidget } from './src/widgets/android/DealsWidget';
import { OrderTrackingWidget } from './src/widgets/android/OrderTrackingWidget';
import { RecommendationsWidget } from './src/widgets/android/RecommendationsWidget';

import App from './App';

// Android Widget Task Handler
registerWidgetTaskHandler(async (props) => {
    const { widgetInfo, renderWidget, widgetAction } = props;
    const { widgetName } = widgetInfo;

    if (widgetAction === 'WIDGET_ADDED' || widgetAction === 'WIDGET_UPDATE' || widgetAction === 'WIDGET_RESIZED') {
        switch (widgetName) {
            case 'CartWidget':
                renderWidget(React.createElement(CartWidget, {}));
                break;
            case 'DealsWidget':
                renderWidget(React.createElement(DealsWidget, {}));
                break;
            case 'OrderTrackingWidget':
                renderWidget(React.createElement(OrderTrackingWidget, {}));
                break;
            case 'RecommendationsWidget':
                renderWidget(React.createElement(RecommendationsWidget, {}));
                break;
        }
    }
});

registerRootComponent(App);
