import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Linking,
    Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ArrowLeft, MapPin, Phone, CheckCircle, Package, Clock, AlertCircle, RefreshCw, ChevronRight, XCircle, Truck, Navigation, User, X } from 'lucide-react-native';
import { Modal } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { subscribeToTracking, ShipmentStatus, calculateETA, openInNativeMaps, openAddressInNativeMaps } from '../utils/shipping';
import * as Location from 'expo-location';
import * as Animatable from 'react-native-animatable';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { db, rtdb } from '../api/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    serverTimestamp,
    getDoc,
    limit,
    onSnapshot,
    or
} from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { Star, Image as ImageIcon } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUS_STEPS: ShipmentStatus[] = ['Pending', 'In Transit', 'Out for Delivery', 'Delivered'];
const STATUS_TRANSLATION_KEYS = ['statusPending', 'statusInTransit', 'statusOutForDelivery', 'statusDelivered'];


export default function ShipmentTrackingScreen({ trackingId, onBack, t }: any) {
    const mapRef = useRef<MapView>(null);
    const { colors, theme } = useAppTheme();
    const [statusData, setStatusData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [fsShipment, setFsShipment] = useState<any>(null);
    const [rating, setRating] = useState(0);
    const [submittingRating, setSubmittingRating] = useState(false);
    const [mapVisible, setMapVisible] = useState(false);
    const [driverLocation, setDriverLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [eta, setEta] = useState<string>('');

    const translate = t || ((k: string) => k);

    useEffect(() => {
        let unsubscribeLocation: (() => void) | null = null;
        let unsubscribeFs: (() => void) | null = null;

        const q = query(
            collection(db, 'Shipments'),
            or(
                where('trackingId', '==', trackingId),
                where('orderId', '==', trackingId)
            )
        );

        unsubscribeFs = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                const shipmentData: any = { id: snap.docs[0].id, ...snap.docs[0].data() };
                setFsShipment(shipmentData);

                // Now that we have the doc ID, listen to location using it
                if (!unsubscribeLocation) {
                    const driverLocationRef = ref(rtdb, `tracking/${shipmentData.id}/location`);
                    unsubscribeLocation = onValue(driverLocationRef, (snapshot) => {
                        if (snapshot.exists()) {
                            const loc = snapshot.val();
                            setDriverLocation({ latitude: loc.latitude, longitude: loc.longitude });

                            // Calculate ETA
                            if (shipmentData.deliveryLocation) {
                                const etaText = calculateETA(
                                    loc.latitude,
                                    loc.longitude,
                                    shipmentData.deliveryLocation.latitude,
                                    shipmentData.deliveryLocation.longitude
                                );
                                setEta(etaText);
                            }
                        }
                    });
                }
            }
        });

        const unsubscribe = subscribeToTracking(trackingId, (data) => {
            setStatusData(data);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            if (unsubscribeFs) unsubscribeFs();
            if (unsubscribeLocation) unsubscribeLocation();
        };
    }, [trackingId]);

    useEffect(() => {
        if (fsShipment && !fsShipment.deliveryLocation && fsShipment.deliveryAddress) {
            const geocodeAddress = async () => {
                try {
                    const searchAddress = fsShipment.deliveryAddress.toLowerCase().includes('tunisie') || fsShipment.deliveryAddress.toLowerCase().includes('tunisia')
                        ? fsShipment.deliveryAddress
                        : `${fsShipment.deliveryAddress}, Tunisia`;

                    const result = await Location.geocodeAsync(searchAddress);
                    if (result && result.length > 0) {
                        setFsShipment((prev: any) => ({
                            ...prev,
                            deliveryLocation: {
                                latitude: result[0].latitude,
                                longitude: result[0].longitude
                            }
                        }));
                    }
                } catch (e) {
                    console.log("Geocoding failed in screen:", e);
                }
            };
            geocodeAddress();
        }
    }, [fsShipment?.deliveryAddress, fsShipment?.deliveryLocation]);

    useEffect(() => {
        if (mapVisible && mapRef.current) {
            const coords: any[] = [];
            if (driverLocation) coords.push(driverLocation);
            if (fsShipment?.deliveryLocation) coords.push(fsShipment.deliveryLocation);

            if (coords.length > 0) {
                setTimeout(() => {
                    mapRef.current?.fitToCoordinates(coords, {
                        edgePadding: { top: 150, right: 80, bottom: 150, left: 80 },
                        animated: true,
                    });
                }, 500);
            }
        }
    }, [mapVisible, fsShipment?.deliveryLocation, driverLocation]);

    const callDriver = () => {
        if (fsShipment?.driverPhone) {
            Linking.openURL(`tel:${fsShipment.driverPhone}`);
        }
    };

    const submitRating = async (selectedRating: number) => {
        if (!fsShipment) return;
        setSubmittingRating(true);
        try {
            await updateDoc(doc(db, 'Shipments', fsShipment.id), {
                rating: selectedRating
            });
            setRating(selectedRating);
        } catch (err) {
            console.log("Failed to rate", err);
        } finally {
            setSubmittingRating(false);
        }
    };

    const getStatusIndex = (status: ShipmentStatus | string) => {
        if (!status) return 0;
        const normalized = status.toLowerCase().replace(/_/g, ' ');
        return STATUS_STEPS.findIndex(s => s.toLowerCase() === normalized);
    };

    const getStatusColor = (status?: string | null) => {
        const s = status?.toLowerCase() || '';
        switch (s) {
            case 'pending': return '#F59E0B';
            case 'in transit':
            case 'in_transit': return '#3B82F6';
            case 'out for delivery':
            case 'out_for_delivery': return '#10B981';
            case 'delivered': return '#22C55E';
            case 'cancelled': return '#EF4444';
            default: return colors.accent;
        }
    };

    const currentStep = statusData ? getStatusIndex(statusData.status) : 0;
    const isInTransit = statusData?.status === 'In Transit' || statusData?.status === 'in_transit' || statusData?.status === 'Out for Delivery' || statusData?.status === 'out_for_delivery';

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>{translate('loading')}</Text>
            </View>
        );
    }

    if (!fsShipment && !statusData) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
                <XCircle size={64} color={colors.textMuted} />
                <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', marginTop: 20 }}>{translate('noShipments')}</Text>
                <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 10, marginBottom: 30 }}>{translate('shipping_not_found') || "Shipment not found. Please check your tracking ID."}</Text>
                <TouchableOpacity onPress={onBack} style={{ backgroundColor: colors.accent, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 15 }}>
                    <Text style={{ color: colors.accentForeground, fontWeight: '800' }}>{translate('goBack')}</Text>
                </TouchableOpacity>
            </View>
        );
    }
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ArrowLeft color={colors.foreground} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>{translate('shipmentTracking')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Animatable.View animation="fadeInUp" duration={800} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.trackingHeader}>
                        <View>
                            <Text style={[styles.trackingLabel, { color: colors.textMuted }]}>{translate('trackingNumber')}</Text>
                            <Text style={[styles.trackingId, { color: colors.foreground }]}>{trackingId}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(statusData?.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(statusData?.status) }]}>
                                {translate(statusData?.status?.toLowerCase() || 'pending')?.toUpperCase() || statusData?.status?.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {eta && isInTransit && (
                        <View style={[styles.etaContainer, { backgroundColor: getStatusColor(statusData?.status) + '15' }]}>
                            <Clock size={18} color={getStatusColor(statusData?.status)} />
                            <Text style={[styles.etaText, { color: colors.accent }]}>
                                {translate('arrivingIn') || 'Arriving in'}: {eta}
                            </Text>
                        </View>
                    )}

                    <View style={styles.timelineContainer}>
                        {STATUS_STEPS.map((step, index) => {
                            const isCompleted = index <= currentStep;
                            const isCurrent = index === currentStep;
                            const isLast = index === STATUS_STEPS.length - 1;

                            return (
                                <View key={step} style={styles.timelineRow}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[
                                            styles.timelineDot,
                                            { backgroundColor: isCompleted ? colors.accent : colors.border }
                                        ]}>
                                            {isCompleted && <CheckCircle size={12} color={colors.accentForeground} />}
                                        </View>
                                        {!isLast && (
                                            <View style={[
                                                styles.timelineLine,
                                                { backgroundColor: isCompleted ? colors.accent : colors.border }
                                            ]} />
                                        )}
                                    </View>
                                    <View style={styles.timelineRight}>
                                        <Text style={[
                                            styles.timelineLabel,
                                            { color: isCompleted ? colors.foreground : colors.textMuted, opacity: isCompleted ? 1 : 0.5 }
                                        ]}>
                                            {translate(STATUS_TRANSLATION_KEYS[index])}
                                        </Text>
                                        {isCurrent && (
                                            <Text style={styles.currentStatusHint}>
                                                {translate('currentLocation') || 'CURRENT LOCATION'}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </Animatable.View>

                {statusData?.location && (
                    <Animatable.View animation="fadeInUp" delay={150} style={[styles.card, { padding: 0, overflow: 'hidden', backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={{ height: 180 }}>
                            <MapView
                                ref={mapRef}
                                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                                style={StyleSheet.absoluteFill}
                                scrollEnabled={false}
                                zoomEnabled={false}
                                initialRegion={{
                                    latitude: (driverLocation || statusData.location).latitude,
                                    longitude: (driverLocation || statusData.location).longitude,
                                    latitudeDelta: 0.05,
                                    longitudeDelta: 0.05,
                                }}
                            >
                                <Marker coordinate={driverLocation || statusData.location}>
                                    <View style={[styles.markerContainer, { backgroundColor: colors.accent }]}>
                                        <Truck size={18} color={colors.accentForeground} />
                                    </View>
                                </Marker>
                                {fsShipment?.deliveryLocation && (
                                    <Marker coordinate={fsShipment.deliveryLocation}>
                                        <View style={[styles.markerContainer, { backgroundColor: '#10B981' }]}>
                                            <MapPin size={18} color="#FFF" />
                                        </View>
                                    </Marker>
                                )}
                            </MapView>
                        </View>
                        <TouchableOpacity
                            style={styles.expandMapBtn}
                            onPress={() => setMapVisible(true)}
                        >
                            <Navigation size={18} color={colors.foreground} />
                            <Text style={[styles.expandMapText, { color: colors.foreground }]}>
                                {translate('openMaps') || 'Open Maps'}
                            </Text>
                        </TouchableOpacity>
                    </Animatable.View>
                )}

                {fsShipment?.driverId && (
                    <Animatable.View animation="fadeInUp" delay={250} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.sectionHeader}>
                            <Truck size={20} color={colors.accent} />
                            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{translate('yourDriver') || 'Your Driver'}</Text>
                        </View>

                        <View style={styles.driverProfile}>
                            <View style={[styles.driverAvatar, { backgroundColor: colors.border }]}>
                                <User size={24} color={colors.textMuted} />
                            </View>
                            <View style={styles.driverInfo}>
                                <Text style={[styles.driverName, { color: colors.foreground }]}>
                                    {fsShipment.driverName || 'Alcatraz Dev'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.driverActions}>
                            <TouchableOpacity style={[styles.driverActionBtn, { backgroundColor: colors.foreground }]} onPress={() => setMapVisible(true)}>
                                <Navigation size={18} color={colors.background} />
                                <Text style={[styles.driverActionText, { color: colors.background }]}>
                                    {translate('navigate') || 'Navigate'}
                                </Text>
                            </TouchableOpacity>
                            {fsShipment.driverPhone && (
                                <TouchableOpacity style={[styles.driverActionBtn, { backgroundColor: '#10B981' }]} onPress={callDriver}>
                                    <Phone size={18} color="#FFF" />
                                    <Text style={[styles.driverActionText, { color: '#FFF' }]}>
                                        {translate('call') || 'Call'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animatable.View>
                )}

                <Animatable.View animation="fadeInUp" delay={350} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.infoRow}>
                        <MapPin size={20} color={colors.accent} />
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{translate('shipmentStatus')}</Text>
                            <Text style={[styles.infoValue, { color: colors.foreground }]}>
                                {getStatusLabel(statusData?.status)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Clock size={20} color={colors.accent} />
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{translate('lastUpdate') || 'LAST UPDATE'}</Text>
                            <Text style={[styles.infoValue, { color: colors.foreground }]}>
                                {statusData?.updatedAt ? new Date(statusData.updatedAt).toLocaleTimeString() : '--:--'}
                            </Text>
                        </View>
                    </View>
                    {fsShipment?.driverName && (
                        <View style={styles.infoRow}>
                            <User size={20} color={colors.accent} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{translate('courier') || 'COURIER'}</Text>
                                <Text style={[styles.infoValue, { color: colors.foreground }]}>{fsShipment.driverName}</Text>
                            </View>
                        </View>
                    )}
                </Animatable.View>

                {/* Delivery Proof & Rating */}
                {fsShipment?.proofOfDeliveryUrl && (
                    <Animatable.View animation="fadeInUp" delay={450} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center' }]}>
                        <Text style={[styles.trackingLabel, { color: colors.foreground, marginBottom: 15, alignSelf: 'flex-start' }]}>
                            {translate('proofOfDelivery')}
                        </Text>
                        <Animatable.Image
                            source={{ uri: fsShipment.proofOfDeliveryUrl }}
                            style={{ width: '100%', height: 250, borderRadius: 16, marginBottom: 20 }}
                            resizeMode="cover"
                        />

                        <Text style={[styles.trackingLabel, { color: colors.foreground, marginBottom: 15, fontSize: 14 }]}>
                            {translate('rateYourDelivery')}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => submitRating(star)}
                                    disabled={submittingRating || fsShipment.rating}
                                >
                                    <Star
                                        size={36}
                                        color={(fsShipment.rating || rating) >= star ? '#FFD700' : colors.textMuted}
                                        fill={(fsShipment.rating || rating) >= star ? '#FFD700' : 'transparent'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        {fsShipment.rating && (
                            <Text style={{ marginTop: 10, color: colors.accent, fontWeight: '800' }}>
                                {translate('thankYouFeedback')}
                            </Text>
                        )}
                    </Animatable.View>
                )}
            </ScrollView>

            <Modal visible={mapVisible} animationType="slide" transparent={false}>
                <View style={{ flex: 1, backgroundColor: colors.background }}>
                    <MapView
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                        style={StyleSheet.absoluteFill}
                        initialRegion={{
                            latitude: statusData?.location?.latitude || driverLocation?.latitude || 35.8256,
                            longitude: statusData?.location?.longitude || driverLocation?.longitude || 10.6369,
                            latitudeDelta: 0.1,
                            longitudeDelta: 0.1,
                        }}
                    >
                        {(driverLocation || statusData?.location) && (
                            <Marker coordinate={driverLocation || statusData.location} title={translate('driver')}>
                                <View style={[styles.markerContainer, { backgroundColor: colors.accent }]}>
                                    <Truck size={20} color={colors.accentForeground} />
                                </View>
                            </Marker>
                        )}
                        {fsShipment?.deliveryLocation && (
                            <Marker coordinate={fsShipment.deliveryLocation} title={translate('deliveryTo')}>
                                <View style={[styles.markerContainer, { backgroundColor: '#10B981' }]}>
                                    <Package size={20} color="#FFF" />
                                </View>
                            </Marker>
                        )}
                        {(driverLocation || statusData?.location) && fsShipment?.deliveryLocation && (
                            <Polyline
                                coordinates={[driverLocation || statusData.location, fsShipment.deliveryLocation]}
                                strokeColor={colors.accent}
                                strokeWidth={4}
                                lineDashPattern={[10, 10]}
                            />
                        )}
                    </MapView>

                    <BlurView intensity={80} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.mapHeader}>
                        <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.closeMapBtn}>
                            <X color={colors.foreground} size={24} />
                        </TouchableOpacity>
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={[styles.mapTitle, { color: colors.foreground }]}>{translate('shipmentTracking')}</Text>
                            <Text style={[styles.mapSubTitle, { color: colors.textMuted }]} numberOfLines={1}>
                                {fsShipment?.deliveryAddress || trackingId}
                            </Text>
                        </View>
                    </BlurView>

                    <View style={styles.mapFooter}>
                        {eta ? (
                            <BlurView intensity={90} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.etaBadge}>
                                <Clock size={20} color={colors.foreground} />
                                <Text style={[styles.etaBadgeText, { color: colors.foreground }]}>ETA: {eta}</Text>
                            </BlurView>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getStatusLabel = (status: string | undefined) => {
    if (!status) return '...';
    switch (status) {
        case 'Pending': return 'EN ATTENTE';
        case 'In Transit': return 'EN TRANSIT';
        case 'Out for Delivery': return 'EN COURS';
        case 'Delivered': return 'LIVRÉ';
        default:
            return status.replace(/_/g, ' ').toUpperCase();
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 2,
    },
    content: {
        padding: 20,
        gap: 20,
        paddingBottom: 40,
    },
    card: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 20,
    },
    trackingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    trackingLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        opacity: 0.6,
        letterSpacing: 1,
        marginBottom: 4,
    },
    trackingId: {
        fontSize: 20,
        fontWeight: '900',
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    etaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        gap: 12,
    },
    etaText: {
        fontSize: 14,
        fontWeight: '800',
    },
    timelineContainer: {
        marginTop: 10,
    },
    timelineRow: {
        flexDirection: 'row',
        minHeight: 60,
    },
    timelineLeft: {
        width: 40,
        alignItems: 'center',
    },
    timelineDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        marginVertical: -2,
    },
    timelineRight: {
        flex: 1,
        paddingLeft: 12,
        paddingBottom: 20,
    },
    timelineLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    currentStatusHint: {
        fontSize: 10,
        fontWeight: '900',
        color: '#10B981',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    markerContainer: {
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFF',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    expandMapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 10,
    },
    expandMapText: {
        fontSize: 14,
        fontWeight: '700',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    driverProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 20,
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
        fontSize: 18,
        fontWeight: '800',
    },
    driverActions: {
        flexDirection: 'row',
        gap: 12,
    },
    driverActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    driverActionText: {
        fontSize: 14,
        fontWeight: '800',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 15,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    mapHeader: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        padding: 15,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    closeMapBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapTitle: {
        fontSize: 16,
        fontWeight: '900',
    },
    mapSubTitle: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },
    mapFooter: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    etaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 10,
        overflow: 'hidden',
    },
    etaBadgeText: {
        fontSize: 16,
        fontWeight: '900',
    },
});
