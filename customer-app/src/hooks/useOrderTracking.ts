import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../api/firebase';
import { DeliveryOrder, calculateDistance, getDeliveryStatusLabel } from '../types/delivery';
import { OrderTrackingActivity } from '../widgets';
import { deliveryService } from '../services/deliveryService';

interface UseOrderTrackingProps {
    orderId: string;
    language?: string;
}

export const useOrderTracking = ({ orderId, language = 'en' }: UseOrderTrackingProps) => {
    const [order, setOrder] = useState<DeliveryOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [eta, setEta] = useState<number>(0);

    useEffect(() => {
        if (!orderId) return;

        const unsubscribeFirestore = onSnapshot(doc(db, 'deliveries', orderId), async (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const deliveryOrder = {
                    id: snapshot.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    acceptedAt: data.acceptedAt?.toDate(),
                    pickedUpAt: data.pickedUpAt?.toDate(),
                    deliveredAt: data.deliveredAt?.toDate(),
                } as DeliveryOrder;

                setOrder(deliveryOrder);

                // Update activity status
                updateLiveActivity(deliveryOrder, eta);
            }
            setIsLoading(false);
        });

        const updateLiveActivity = async (deliveryOrder: DeliveryOrder, currentEta: number) => {
            if (!OrderTrackingActivity) return;
            try {
                const statusLabel = getDeliveryStatusLabel(deliveryOrder.status, language);
                const activityHandle = OrderTrackingActivity as any;

                const activities = await activityHandle.getActivities();
                const existingActivity = activities.find((a: any) => a.attributes.orderId === deliveryOrder.orderId);

                if (existingActivity) {
                    await existingActivity.update({
                        status: statusLabel,
                        etaMinutes: currentEta,
                        driverName: deliveryOrder.driverName || 'Driver',
                        lang: language as any
                    });
                } else if (['accepted', 'picked_up', 'in_transit'].includes(deliveryOrder.status)) {
                    await activityHandle.start({
                        orderId: deliveryOrder.orderId,
                        status: statusLabel,
                        etaMinutes: currentEta,
                        driverName: deliveryOrder.driverName || 'Driver',
                        lang: language as any
                    });
                } else if ((deliveryOrder.status as string) === 'delivered') {
                    await activityHandle.stopAll();
                }
            } catch (error) {
                console.error('Live Activity error:', error);
            }
        };

        return () => {
            unsubscribeFirestore();
        };
    }, [orderId, language]);

    useEffect(() => {
        const trackingIdKey = order?.trackingId || orderId;
        if (!trackingIdKey) return;

        // Subscribe to RTDB for real-time location (smoother)
        const unsubscribeRTDB = deliveryService.subscribeToDriverLocation(trackingIdKey, (data: any) => {
            const location = data.location;
            if (!location) return;

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

            // Re-calculate ETA if location changed
            if (order && location.latitude) {
                const distance = calculateDistance(
                    location.latitude,
                    location.longitude,
                    order.deliveryLatitude,
                    order.deliveryLongitude
                );
                // ETA logic: distance / speed (km/h) * 60 (min/h)
                const speed = location.speed || 25; // Default 25 km/h
                const estimatedMinutes = Math.ceil((distance / speed) * 60) + 2; // +2 min buffer
                setEta(estimatedMinutes);
            }
        });

        return () => {
            unsubscribeRTDB();
        };
    }, [order?.trackingId || orderId]);

    return { order, isLoading, eta };
};
