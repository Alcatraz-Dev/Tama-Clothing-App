import { Platform } from 'react-native';

export interface ActivityHandle {
    start: (props: any) => Promise<void>;
    update: (props: any) => Promise<void>;
    stop: () => Promise<void>;
    stopAll: () => Promise<void>;
    getActivities: () => Promise<any[]>;
}

const OrderTrackingActivity: ActivityHandle | null = Platform.select({
    ios: require('./OrderTrackingActivity.ios').default,
    android: require('./OrderTrackingActivity.android').default,
    default: null,
});

export default OrderTrackingActivity;
