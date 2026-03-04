/**
 * OrderTrackingActivity - Platform router
 *
 * On iOS  → returns the LiveActivityFactory from expo-widgets
 *           (factory.start(props) → LiveActivity instance)
 *           (instance.update(props) / instance.end('immediate'))
 *
 * On Android / Expo Go → returns null (use WidgetManager directly)
 */
import { Platform } from 'react-native';

let OrderTrackingActivity: any = null;

try {
    if (Platform.OS === 'ios') {
        OrderTrackingActivity = require('./OrderTrackingActivity.ios').default;
    }
} catch (e) {
    // Expo Go or module unavailable — silently ignore
    console.log('[OrderTrackingActivity] iOS Live Activity not available:', e);
}

export default OrderTrackingActivity;
