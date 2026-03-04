import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../api/firebase';
import { DeliveryOrder, calculateDistance, getDeliveryStatusLabel } from '../types/delivery';
import { OrderTrackingActivity, WidgetManager, WIDGET_CONFIG } from '../widgets';
import { deliveryService } from '../services/deliveryService';

const { TYPES: WidgetType, SIZES: WidgetSize } = WIDGET_CONFIG;

interface UseOrderTrackingProps {
    orderId: string;
    language?: string;
}

export const useOrderTracking = ({ orderId, language = 'en' }: UseOrderTrackingProps) => {
    const [order, setOrder] = useState<DeliveryOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [eta, setEta] = useState<number>(0);

    // Refs to avoid stale closures
    const orderRef = useRef<DeliveryOrder | null>(null);
    const etaRef = useRef<number>(0);

    useEffect(() => {
        orderRef.current = order;
    }, [order]);

    useEffect(() => {
        etaRef.current = eta;
    }, [eta]);

    // ── Sync to widget + live activity ─────────────────────────────────────────
    const syncToWidget = async (deliveryOrder: DeliveryOrder, currentEta: number) => {
        try {
            const statusLabel = getDeliveryStatusLabel(deliveryOrder.status, language);

            // 1. Push to OS widget (iOS via ExtensionStorage, Android via react-native-android-widget)
            await WidgetManager.getInstance().updateWidgetData(
                WidgetType.ORDER_TRACKING as any,
                WidgetSize.MEDIUM as any,
                {
                    orderId: deliveryOrder.trackingId || deliveryOrder.orderId,
                    statusText: statusLabel,
                    estimatedDelivery: currentEta > 0 ? Date.now() + currentEta * 60000 : undefined,
                    status: deliveryOrder.status,
                } as any
            );
        } catch (err) {
            // Non-critical – widget sync should never crash the app
            console.log('Widget sync skipped:', err);
        }
    };

    const updateLiveActivity = async (deliveryOrder: DeliveryOrder, currentEta: number) => {
        if (!OrderTrackingActivity) return;
        try {
            const statusLabel = getDeliveryStatusLabel(deliveryOrder.status, language);
            const activityHandle = OrderTrackingActivity as any;

            const activities = await activityHandle.getActivities?.() || [];
            const existingActivity = activities.find((a: any) => a.attributes?.orderId === deliveryOrder.orderId);

            if (existingActivity) {
                await existingActivity.update({
                    status: statusLabel,
                    etaMinutes: currentEta,
                    driverName: deliveryOrder.driverName || 'Driver',
                });
            } else if (['accepted', 'picked_up', 'in_transit', 'out_for_delivery'].includes(deliveryOrder.status)) {
                await activityHandle.start?.({
                    orderId: deliveryOrder.trackingId || deliveryOrder.orderId,
                    status: statusLabel,
                    etaMinutes: currentEta,
                    driverName: deliveryOrder.driverName || 'Driver',
                });
            } else if (deliveryOrder.status === 'delivered') {
                await activityHandle.stopAll?.();
            }
        } catch (error) {
            console.error('Live Activity error:', error);
        }
    };

    // ── Firestore Listener ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!orderId) return;

        const unsubscribeFirestore = onSnapshot(doc(db, 'deliveries', orderId), async (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const deliveryOrder: DeliveryOrder = {
                    id: snapshot.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    acceptedAt: data.acceptedAt?.toDate(),
                    pickedUpAt: data.pickedUpAt?.toDate(),
                    deliveredAt: data.deliveredAt?.toDate(),
                } as DeliveryOrder;

                setOrder(deliveryOrder);
                orderRef.current = deliveryOrder;

                const currentEta = etaRef.current;
                // Run these in parallel — both are non-blocking
                syncToWidget(deliveryOrder, currentEta);
                updateLiveActivity(deliveryOrder, currentEta);
            }
            setIsLoading(false);
        });

        return () => {
            unsubscribeFirestore();
        };
    }, [orderId, language]);

    // ── RTDB Real-time Driver Location ─────────────────────────────────────────
    useEffect(() => {
        const trackingIdKey = order?.trackingId || orderId;
        if (!trackingIdKey) return;

        const unsubscribeRTDB = deliveryService.subscribeToDriverLocation(trackingIdKey, (data: any) => {
            const location = data?.location;
            if (!location?.latitude) return;

            setOrder(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    driverLocation: {
                        ...prev.driverLocation,
                        ...location,
                        timestamp: new Date(location.timestamp || Date.now())
                    }
                };
            });

            // ETA recalculation using the latest order data from ref
            const currentOrder = orderRef.current;
            if (currentOrder) {
                // If driver is on the way to pickup, measure from driver → pickup
                // If driver is heading to customer, measure from driver → delivery
                const targetLat = ['accepted', 'pending'].includes(currentOrder.status)
                    ? (currentOrder.pickupLatitude || currentOrder.deliveryLatitude)
                    : currentOrder.deliveryLatitude;
                const targetLon = ['accepted', 'pending'].includes(currentOrder.status)
                    ? (currentOrder.pickupLongitude || currentOrder.deliveryLongitude)
                    : currentOrder.deliveryLongitude;

                const distance = calculateDistance(
                    location.latitude,
                    location.longitude,
                    targetLat,
                    targetLon
                );
                const speed = location.speed > 1 ? location.speed : 25; // km/h
                const estimatedMinutes = Math.max(1, Math.ceil((distance / speed) * 60) + 2);
                setEta(estimatedMinutes);
                etaRef.current = estimatedMinutes;

                // Re-sync widget with updated ETA
                syncToWidget(currentOrder, estimatedMinutes);
                updateLiveActivity(currentOrder, estimatedMinutes);
            }
        });

        return () => {
            unsubscribeRTDB();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order?.trackingId, orderId]);

    return { order, isLoading, eta };
};
