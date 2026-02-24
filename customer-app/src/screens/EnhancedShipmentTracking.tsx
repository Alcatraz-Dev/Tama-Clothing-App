import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    Linking,
    Modal,
    Platform
} from 'react-native';
import {
    MapPin,
    Truck,
    Clock,
    Phone,
    Package,
    Star,
    ChevronRight,
    Navigation,
    Circle,
    X,
} from 'lucide-react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAppTheme } from '../context/ThemeContext';
import { rtdb } from '../api/firebase';
import { ref, onValue, off } from 'firebase/database';
import { deliveryService } from '../services/deliveryService';
import { Delivery, GeoPoint, Driver } from '../types/delivery';
import { openInNativeMaps, openAddressInNativeMaps } from '../utils/shipping';
import * as Location from 'expo-location';
import { useRef } from 'react';

const { width, height } = Dimensions.get('window');

interface EnhancedShipmentTrackingProps {
    delivery: Delivery;
    onClose?: () => void;
    t: (key: string) => string;
}

const STATUS_STEPS = [
    { key: 'pending', icon: Package, label: 'Order Placed' },
    { key: 'assigned', icon: Truck, label: 'Assigned to Driver' },
    { key: 'picked_up', icon: Package, label: 'Picked Up' },
    { key: 'in_transit', icon: Truck, label: 'In Transit' },
    { key: 'out_for_delivery', icon: Navigation, label: 'Out for Delivery' },
    { key: 'delivered', icon: MapPin, label: 'Delivered' },
];

export function EnhancedShipmentTracking({
    delivery,
    onClose,
    t,
}: EnhancedShipmentTrackingProps) {
    const { colors, theme } = useAppTheme();
    const [driverLocation, setDriverLocation] = useState<GeoPoint | null>(null);
    const [driverData, setDriverData] = useState<Driver | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const mapRef = useRef<MapView>(null);
    const [enrichedDelivery, setEnrichedDelivery] = useState(delivery);

    const translate = t || ((k: string) => k);

    const getStatusIndex = (status: string) => {
        return STATUS_STEPS.findIndex(s => s.key === status);
    };

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const initTracking = async () => {
            if (delivery.driverId) {
                unsubscribe = deliveryService.subscribeToDriverLocation(
                    delivery.driverId,
                    (location) => {
                        setDriverLocation(location);
                    }
                );

                const driverQuery = await import('firebase/firestore').then(firestore =>
                    import('../api/firebase').then(({ db }) => {
                        return firestore.getDoc(firestore.doc(db, 'Drivers', delivery.driverId!));
                    })
                );

                if (driverQuery.exists()) {
                    setDriverData(driverQuery.data() as Driver);
                }
            }
            setLoading(false);
        };

        initTracking();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [delivery.driverId]);

    useEffect(() => {
        if (enrichedDelivery && !enrichedDelivery.deliveryLocation && enrichedDelivery.deliveryAddress) {
            const geocodeAddress = async () => {
                try {
                    const searchAddress = enrichedDelivery.deliveryAddress.toLowerCase().includes('tunisie') || enrichedDelivery.deliveryAddress.toLowerCase().includes('tunisia')
                        ? enrichedDelivery.deliveryAddress
                        : `${enrichedDelivery.deliveryAddress}, Tunisia`;

                    const result = await Location.geocodeAsync(searchAddress);
                    if (result && result.length > 0) {
                        setEnrichedDelivery(prev => ({
                            ...prev,
                            deliveryLocation: {
                                latitude: result[0].latitude,
                                longitude: result[0].longitude
                            }
                        }));
                    }
                } catch (e) {
                    console.log("Geocoding failed in enhanced screen:", e);
                }
            };
            geocodeAddress();
        }
    }, [enrichedDelivery?.deliveryAddress, enrichedDelivery?.deliveryLocation]);

    useEffect(() => {
        if (mapRef.current && enrichedDelivery?.deliveryLocation) {
            mapRef.current.animateToRegion({
                latitude: enrichedDelivery.deliveryLocation.latitude,
                longitude: enrichedDelivery.deliveryLocation.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            }, 1000);
        } else if (mapRef.current && driverLocation) {
            mapRef.current.animateToRegion({
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
                latitudeDelta: 0.15,
                longitudeDelta: 0.15,
            }, 1000);
        }
    }, [enrichedDelivery?.deliveryLocation?.latitude, driverLocation?.latitude]);

    const openMaps = () => {
        if (enrichedDelivery?.deliveryLocation) {
            openInNativeMaps(enrichedDelivery.deliveryLocation.latitude, enrichedDelivery.deliveryLocation.longitude, translate('deliveryAddress'));
        } else if (enrichedDelivery?.deliveryAddress) {
            openAddressInNativeMaps(enrichedDelivery.deliveryAddress);
        }
    };

    const callDriver = () => {
        if (driverData?.phone) {
            Linking.openURL(`tel:${driverData.phone}`);
        }
    };

    const handleRate = async () => {
        try {
            await deliveryService.rateDelivery(delivery.id, rating, comment);
            setShowRatingModal(false);
        } catch (error) {
            console.error('Error rating delivery:', error);
        }
    };

    const renderTimeline = () => {
        const currentIndex = getStatusIndex(delivery.status);

        return (
            <View style={styles.timeline}>
                {STATUS_STEPS.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    const StepIcon = step.icon;

                    return (
                        <View key={step.key} style={styles.timelineItem}>
                            <View style={styles.timelineLeft}>
                                <View
                                    style={[
                                        styles.timelineIcon,
                                        {
                                            backgroundColor: isCompleted ? colors.accent : colors.border,
                                            borderColor: isCompleted ? colors.accent : colors.border,
                                        },
                                    ]}
                                >
                                    <StepIcon
                                        size={16}
                                        color={isCompleted ? colors.accentForeground : colors.textMuted}
                                    />
                                </View>
                                {index < STATUS_STEPS.length - 1 && (
                                    <View
                                        style={[
                                            styles.timelineLine,
                                            { backgroundColor: isCompleted ? colors.accent : colors.border },
                                        ]}
                                    />
                                )}
                            </View>
                            <View style={styles.timelineContent}>
                                <Text
                                    style={[
                                        styles.timelineLabel,
                                        { color: isCompleted ? colors.foreground : colors.textMuted },
                                        isCurrent && { fontWeight: '900' },
                                    ]}
                                >
                                    {translate(step.label) || step.label}
                                </Text>
                                {isCurrent && delivery.status !== 'delivered' && (
                                    <Text style={[styles.timelineTime, { color: colors.accent }]}>
                                        {translate('inProgress')}
                                    </Text>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderDriverCard = () => {
        if (!delivery.driverId || !driverData) return null;

        return (
            <View style={[styles.driverCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.driverHeader}>
                    <View style={[styles.driverAvatar, { backgroundColor: colors.accent + '20' }]}>
                        <Truck size={24} color={colors.accent} />
                    </View>
                    <View style={styles.driverInfo}>
                        <Text style={[styles.driverName, { color: colors.foreground }]}>
                            {driverData.fullName || translate('driverAssigned')}
                        </Text>
                        <View style={styles.driverRating}>
                            <Star size={14} color="#F59E0B" fill="#F59E0B" />
                            <Text style={[styles.ratingText, { color: colors.textMuted }]}>
                                {driverData.metrics?.averageRating?.toFixed(1) || '5.0'}
                            </Text>
                            <Text style={[styles.deliveriesText, { color: colors.textMuted }]}>
                                • {driverData.metrics?.completedDeliveries || 0} {translate('deliveries')}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.driverActions}>
                    <TouchableOpacity style={[styles.driverAction, { backgroundColor: colors.accent + '15' }]} onPress={openMaps}>
                        <Navigation size={18} color={colors.accent} />
                        <Text style={[styles.driverActionText, { color: colors.accent }]}>
                            {translate('navigate')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.driverAction, { backgroundColor: colors.accent + '25' }]} onPress={callDriver}>
                        <Phone size={18} color={colors.accent} />
                        <Text style={[styles.driverActionText, { color: colors.accent }]}>
                            {translate('call')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderLiveTracking = () => {
        if (!driverLocation || !delivery.deliveryLocation) return null;

        return (
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                    style={StyleSheet.absoluteFill}
                    initialRegion={{
                        latitude: enrichedDelivery?.deliveryLocation?.latitude || driverLocation?.latitude || 35.8256,
                        longitude: enrichedDelivery?.deliveryLocation?.longitude || driverLocation?.longitude || 10.6369,
                        latitudeDelta: 0.08,
                        longitudeDelta: 0.08,
                    }}
                >
                    {driverLocation && (
                        <Marker
                            coordinate={driverLocation}
                            title={translate('driver')}
                            description={translate('driverOnTheWay')}
                        >
                            <View style={[styles.markerContainer, { backgroundColor: colors.accent }]}>
                                <Truck size={18} color={colors.accentForeground} />
                            </View>
                        </Marker>
                    )}

                    {enrichedDelivery?.deliveryLocation && (
                        <Marker
                            coordinate={enrichedDelivery.deliveryLocation}
                            title={translate('deliveryAddress')}
                        >
                            <View style={[styles.markerContainer, { backgroundColor: '#10B981' }]}>
                                <MapPin size={18} color="#FFF" />
                            </View>
                        </Marker>
                    )}
                    {driverLocation && enrichedDelivery.deliveryLocation && (
                        <Polyline
                            coordinates={[driverLocation, enrichedDelivery.deliveryLocation]}
                            strokeColor={colors.accent}
                            strokeWidth={4}
                            lineDashPattern={[1]}
                        />
                    )}
                </MapView>

                <View style={[styles.etaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Clock size={20} color={colors.accent} />
                    <View style={styles.etaContent}>
                        <Text style={[styles.etaLabel, { color: colors.textMuted }]}>
                            {translate('estimatedArrival')}
                        </Text>
                        <Text style={[styles.etaValue, { color: colors.foreground }]}>
                            {delivery.estimatedDeliveryTime
                                ? new Date(delivery.estimatedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : translate('calculating')}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={[styles.header, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.trackingId, { color: colors.foreground }]}>
                        {delivery.trackingId}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(delivery.status) }]}>
                            {translate(delivery.status) || delivery.status}
                        </Text>
                    </View>
                </View>

                {delivery.status === 'in_transit' || delivery.status === 'out_for_delivery' ? (
                    renderLiveTracking()
                ) : null}

                <View style={styles.content}>
                    {renderTimeline()}

                    {delivery.driverId && renderDriverCard()}

                    <View style={[styles.addressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.addressRow}>
                            <MapPin size={20} color={colors.accent} />
                            <View style={styles.addressContent}>
                                <Text style={[styles.addressLabel, { color: colors.textMuted }]}>
                                    {translate('deliveryAddress')}
                                </Text>
                                <Text style={[styles.addressValue, { color: colors.foreground }]}>
                                    {delivery.deliveryAddress}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {delivery.timeWindow && (
                        <View style={[styles.timeWindowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Clock size={20} color={colors.accent} />
                            <View style={styles.timeWindowContent}>
                                <Text style={[styles.timeWindowLabel, { color: colors.textMuted }]}>
                                    {translate('scheduledTime')}
                                </Text>
                                <Text style={[styles.timeWindowValue, { color: colors.foreground }]}>
                                    {delivery.timeWindow.start} - {delivery.timeWindow.end}
                                </Text>
                            </View>
                        </View>
                    )}

                    {delivery.items && delivery.items.length > 0 && (
                        <View style={[styles.itemsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.itemsTitle, { color: colors.foreground }]}>
                                {translate('items')} ({delivery.items.length})
                            </Text>
                            {delivery.items.map((item, index) => (
                                <View key={index} style={styles.itemRow}>
                                    <Package size={16} color={colors.textMuted} />
                                    <Text style={[styles.itemName, { color: colors.foreground }]}>
                                        {item.name}
                                    </Text>
                                    <Text style={[styles.itemQty, { color: colors.textMuted }]}>
                                        x{item.quantity}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {delivery.pricing && (
                        <View style={[styles.pricingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.pricingTitle, { color: colors.foreground }]}>
                                {translate('pricing')}
                            </Text>
                            <View style={styles.pricingRow}>
                                <Text style={[styles.pricingLabel, { color: colors.textMuted }]}>
                                    {translate('basePrice')}
                                </Text>
                                <Text style={[styles.pricingValue, { color: colors.foreground }]}>
                                    {delivery.pricing.basePrice} TND
                                </Text>
                            </View>
                            <View style={styles.pricingRow}>
                                <Text style={[styles.pricingLabel, { color: colors.textMuted }]}>
                                    {translate('distance')}
                                </Text>
                                <Text style={[styles.pricingValue, { color: colors.foreground }]}>
                                    {delivery.pricing.distancePrice} TND
                                </Text>
                            </View>
                            {delivery.pricing.timeWindowCost > 0 && (
                                <View style={styles.pricingRow}>
                                    <Text style={[styles.pricingLabel, { color: colors.textMuted }]}>
                                        {translate('timeSlot')}
                                    </Text>
                                    <Text style={[styles.pricingValue, { color: colors.foreground }]}>
                                        +{delivery.pricing.timeWindowCost} TND
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.pricingTotal, { borderTopColor: colors.border }]}>
                                <Text style={[styles.pricingTotalLabel, { color: colors.foreground }]}>
                                    {translate('total')}
                                </Text>
                                <Text style={[styles.pricingTotalValue, { color: colors.accent }]}>
                                    {delivery.pricing.total} TND
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {delivery.status === 'delivered' && !delivery.rating && (
                <TouchableOpacity
                    style={[styles.rateButton, { backgroundColor: colors.accent }]}
                    onPress={() => setShowRatingModal(true)}
                >
                    <Star size={20} color="#FFF" fill="#FFF" />
                    <Text style={styles.rateButtonText}>{translate('rateDelivery')}</Text>
                </TouchableOpacity>
            )}

            <Modal visible={showRatingModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                            {translate('rateYourExperience')}
                        </Text>

                        <View style={styles.ratingStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                    <Star
                                        size={40}
                                        color="#F59E0B"
                                        fill={star <= rating ? '#F59E0B' : 'transparent'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.submitRating, { backgroundColor: colors.accent }]}
                            onPress={handleRate}
                        >
                            <Text style={styles.submitRatingText}>{translate('submit')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.closeModal}
                            onPress={() => setShowRatingModal(false)}
                        >
                            <Text style={{ color: colors.textMuted }}>{translate('skip')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
        pending: '#F59E0B',
        assigned: '#3B82F6',
        picked_up: '#8B5CF6',
        in_transit: '#06B6D4',
        out_for_delivery: '#10B981',
        delivered: '#10B981',
        cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
    },
    trackingId: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    statusBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
    },
    mapContainer: {
        height: 250,
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    markerContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    etaCard: {
        position: 'absolute',
        bottom: 15,
        left: 15,
        right: 15,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        gap: 12,
    },
    etaContent: {
        flex: 1,
    },
    etaLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    etaValue: {
        fontSize: 18,
        fontWeight: '900',
    },
    content: {
        padding: 20,
    },
    timeline: {
        marginBottom: 20,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 50,
    },
    timelineLeft: {
        width: 40,
        alignItems: 'center',
    },
    timelineIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        marginVertical: 4,
    },
    timelineContent: {
        flex: 1,
        paddingLeft: 10,
        paddingBottom: 20,
    },
    timelineLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    timelineTime: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },
    driverCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    driverHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 14,
    },
    driverAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '800',
    },
    driverRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '700',
    },
    deliveriesText: {
        fontSize: 12,
    },
    driverActions: {
        flexDirection: 'row',
        gap: 10,
    },
    driverAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    driverActionText: {
        fontSize: 14,
        fontWeight: '700',
    },
    addressCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    addressRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    addressContent: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    addressValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    timeWindowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        gap: 12,
    },
    timeWindowContent: {
        flex: 1,
    },
    timeWindowLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    timeWindowValue: {
        fontSize: 15,
        fontWeight: '800',
    },
    itemsCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    itemsTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 10,
    },
    itemName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    itemQty: {
        fontSize: 14,
        fontWeight: '700',
    },
    pricingCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    pricingTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 12,
    },
    pricingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    pricingLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    pricingValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    pricingTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        marginTop: 8,
        borderTopWidth: 1,
    },
    pricingTotalLabel: {
        fontSize: 16,
        fontWeight: '900',
    },
    pricingTotalValue: {
        fontSize: 18,
        fontWeight: '900',
    },
    rateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        margin: 20,
        borderRadius: 14,
        gap: 10,
    },
    rateButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.85,
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 20,
    },
    ratingStars: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    submitRating: {
        width: '100%',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    submitRatingText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    closeModal: {
        marginTop: 16,
        padding: 10,
    },
});
