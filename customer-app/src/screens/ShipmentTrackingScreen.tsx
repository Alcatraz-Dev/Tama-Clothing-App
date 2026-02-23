import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Linking
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Package, Truck, MapPin, CheckCircle, Clock, User, Navigation } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';
import { subscribeToTracking, ShipmentStatus, calculateETA } from '../utils/shipping';
import * as Animatable from 'react-native-animatable';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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

export default function ShipmentTrackingScreen({ trackingId, onBack, t }: any) {
    const { colors, theme } = useAppTheme();
    const [statusData, setStatusData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [fsShipment, setFsShipment] = useState<any>(null);
    const [rating, setRating] = useState(0);
    const [submittingRating, setSubmittingRating] = useState(false);
    const [driverLocation, setDriverLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [eta, setEta] = useState<string>('');

    const translate = t || ((k: string) => k);

    useEffect(() => {
        const unsubscribe = subscribeToTracking(trackingId, (data) => {
            setStatusData(data);
            setLoading(false);
        });

        // Subscribe to driver location in real-time
        const driverLocationRef = ref(rtdb, `tracking/${trackingId}/location`);
        const unsubscribeLocation = onValue(driverLocationRef, (snapshot) => {
            if (snapshot.exists()) {
                const loc = snapshot.val();
                setDriverLocation({ latitude: loc.latitude, longitude: loc.longitude });
            }
        });

        // Also subscribe to Firestore to get proofOfDeliveryUrl and rating
        const q = query(
            collection(db, 'Shipments'),
            or(
                where('trackingId', '==', trackingId),
                where('orderId', '==', trackingId)
            )
        );
        const unsubscribeFs = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                const shipmentData: any = { id: snap.docs[0].id, ...snap.docs[0].data() };
                setFsShipment(shipmentData);

                // Calculate ETA if we have delivery location and driver location
                if (shipmentData.deliveryLocation && driverLocation) {
                    const etaText = calculateETA(
                        driverLocation.latitude,
                        driverLocation.longitude,
                        shipmentData.deliveryLocation.latitude,
                        shipmentData.deliveryLocation.longitude
                    );
                    setEta(etaText);
                }
            }
        });

        return () => {
            unsubscribe();
            unsubscribeFs();
            unsubscribeLocation();
        };
    }, [trackingId]);

    const openMaps = () => {
        if (fsShipment?.deliveryAddress) {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fsShipment.deliveryAddress)}`;
            Linking.openURL(url);
        }
    };

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

    const getStatusIndex = (status: ShipmentStatus) => STATUS_STEPS.indexOf(status);
    const currentStep = statusData ? getStatusIndex(statusData.status) : 0;

    const isInTransit = statusData?.status === 'In Transit' || statusData?.status === 'in_transit' || statusData?.status === 'Out for Delivery' || statusData?.status === 'out_for_delivery';

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
                        <View style={[styles.statusBadge, { backgroundColor: colors.accent + '20' }]}>
                            <Text style={[styles.statusText, { color: colors.accent }]}>{statusData?.status || '...'}</Text>
                        </View>
                    </View>

                    {eta && isInTransit && (
                        <View style={[styles.etaContainer, { backgroundColor: colors.accent + '15' }]}>
                            <Clock size={18} color={colors.accent} />
                            <Text style={[styles.etaText, { color: colors.accent }]}>
                                {translate('arrivingIn') || 'Arriving in'}: {eta}
                            </Text>
                        </View>
                    )}

                    <View style={styles.timeline}>
                        {STATUS_STEPS.map((step, index) => {
                            const isCompleted = index <= currentStep;
                            const isLast = index === STATUS_STEPS.length - 1;

                            return (
                                <View key={step} style={styles.timelineItem}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[
                                            styles.dot,
                                            { backgroundColor: isCompleted ? colors.accent : colors.border }
                                        ]}>
                                            {isCompleted && <CheckCircle size={14} color="#FFF" />}
                                        </View>
                                        {!isLast && <View style={[
                                            styles.line,
                                            { backgroundColor: index < currentStep ? colors.accent : colors.border }
                                        ]} />}
                                    </View>
                                    <View style={styles.timelineRight}>
                                        <Text style={[
                                            styles.stepTitle,
                                            { color: isCompleted ? colors.foreground : colors.textMuted, fontWeight: isCompleted ? '800' : '400' }
                                        ]}>
                                            {step}
                                        </Text>
                                        {index === currentStep && (
                                            <Animatable.Text
                                                animation="pulse"
                                                iterationCount="infinite"
                                                style={[styles.stepDesc, { color: colors.accent }]}
                                            >
                                                {translate('currentLocation')}
                                            </Animatable.Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </Animatable.View>

                {(isInTransit || statusData?.status === 'Out for Delivery') && (driverLocation || statusData?.location) && (
                    <Animatable.View animation="fadeInUp" duration={800} style={[styles.card, { height: 300, overflow: 'hidden', padding: 0, borderColor: colors.border }]}>
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={StyleSheet.absoluteFill}
                            initialRegion={{
                                latitude: (driverLocation || statusData?.location)?.latitude || 36.8065,
                                longitude: (driverLocation || statusData?.location)?.longitude || 10.1815,
                                latitudeDelta: 0.02,
                                longitudeDelta: 0.02,
                            }}
                        >
                            {(driverLocation || statusData?.location) && (
                                <Marker
                                    coordinate={{
                                        latitude: (driverLocation || statusData?.location)?.latitude || 36.8065,
                                        longitude: (driverLocation || statusData?.location)?.longitude || 10.1815,
                                    }}
                                    title={translate('driver') || 'Driver'}
                                    description={translate('driverOnTheWay') || 'Your driver is on the way!'}
                                >
                                    <View style={[styles.markerContainer, { backgroundColor: colors.accent }]}>
                                        <Truck size={18} color="#FFF" />
                                    </View>
                                </Marker>
                            )}

                            {fsShipment?.deliveryLocation && (
                                <Marker
                                    coordinate={{
                                        latitude: fsShipment.deliveryLocation.latitude,
                                        longitude: fsShipment.deliveryLocation.longitude,
                                    }}
                                    title={translate('deliveryAddress') || 'Destination'}
                                >
                                    <View style={[styles.markerContainer, { backgroundColor: '#10B981' }]}>
                                        <MapPin size={18} color="#FFF" />
                                    </View>
                                </Marker>
                            )}
                        </MapView>

                        <View style={[styles.mapOverlay, { backgroundColor: colors.surface }]}>
                            <TouchableOpacity style={[styles.mapButton, { backgroundColor: colors.accent }]} onPress={openMaps}>
                                <Navigation size={16} color="#FFF" />
                                <Text style={styles.mapButtonText}>{translate('openMaps') || 'Open in Maps'}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animatable.View>
                )}

                {fsShipment?.driverName && isInTransit && (
                    <Animatable.View animation="fadeInUp" delay={200} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.driverCardHeader}>
                            <Truck size={24} color={colors.accent} />
                            <Text style={[styles.driverTitle, { color: colors.foreground }]}>
                                {translate('yourDriver') || 'Your Driver'}
                            </Text>
                        </View>

                        <View style={styles.driverInfo}>
                            <View style={styles.driverAvatar}>
                                <User size={24} color={colors.accent} />
                            </View>
                            <View style={styles.driverDetails}>
                                <Text style={[styles.driverName, { color: colors.foreground }]}>
                                    {fsShipment.driverName || 'Driver'}
                                </Text>
                                {fsShipment.driverPhone && (
                                    <TouchableOpacity onPress={callDriver}>
                                        <Text style={[styles.driverPhone, { color: colors.accent }]}>
                                            {fsShipment.driverPhone}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.driverActions}>
                            <TouchableOpacity style={[styles.driverActionBtn, { backgroundColor: colors.accent }]} onPress={openMaps}>
                                <Navigation size={18} color="#FFF" />
                                <Text style={[styles.driverActionText, { color: '#FFF' }]}>
                                    {translate('navigate') || 'Navigate'}
                                </Text>
                            </TouchableOpacity>
                            {fsShipment.driverPhone && (
                                <TouchableOpacity style={[styles.driverActionBtn, { backgroundColor: '#10B981' }]} onPress={callDriver}>
                                    <MapPin size={18} color="#FFF" />
                                    <Text style={[styles.driverActionText, { color: '#FFF' }]}>
                                        {translate('call') || 'Call'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animatable.View>
                )}

                {statusData?.location && (
                    <Animatable.View animation="fadeInUp" delay={200} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.infoRow}>
                            <MapPin size={20} color={colors.accent} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{translate('shipmentStatus')}</Text>
                                <Text style={[styles.infoValue, { color: colors.foreground }]}>
                                    {statusData.status === 'Out for Delivery' ? 'En cours de livraison' : translate(statusData.status)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Clock size={20} color={colors.accent} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{translate('lastUpdate') || 'LAST UPDATE'}</Text>
                                <Text style={[styles.infoValue, { color: colors.foreground }]}>
                                    {new Date(statusData.updatedAt).toLocaleTimeString()}
                                </Text>
                            </View>
                        </View>
                        {statusData?.driverName && (
                            <View style={styles.infoRow}>
                                <User size={20} color={colors.accent} />
                                <View style={styles.infoContent}>
                                    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>COURIER</Text>
                                    <Text style={[styles.infoValue, { color: colors.foreground }]}>{statusData.driverName}</Text>
                                </View>
                            </View>
                        )}
                    </Animatable.View>
                )}

                {/* Delivery Proof & Rating */}
                {fsShipment?.proofOfDeliveryUrl && (
                    <Animatable.View animation="fadeInUp" delay={400} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center' }]}>
                        <Text style={[styles.trackingLabel, { color: colors.foreground, marginBottom: 15, alignSelf: 'flex-start' }]}>PROOF OF DELIVERY</Text>
                        <Animatable.Image
                            source={{ uri: fsShipment.proofOfDeliveryUrl }}
                            style={{ width: '100%', height: 250, borderRadius: 16, marginBottom: 20 }}
                            resizeMode="cover"
                        />

                        <Text style={[styles.trackingLabel, { color: colors.foreground, marginBottom: 15, fontSize: 14 }]}>RATE YOUR DELIVERY</Text>
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
                            <Text style={{ marginTop: 10, color: colors.accent, fontWeight: '800' }}>Thank you for your feedback!</Text>
                        )}
                    </Animatable.View>
                )}
            </ScrollView>
        </View>
    );
}

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
    },
    card: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
    },
    trackingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
    },
    trackingLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    trackingId: {
        fontSize: 20,
        fontWeight: '900',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
    },
    timeline: {
        marginLeft: 10,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 80,
    },
    timelineLeft: {
        alignItems: 'center',
        width: 30,
    },
    dot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    line: {
        flex: 1,
        width: 2,
        marginVertical: 4,
    },
    timelineRight: {
        flex: 1,
        paddingLeft: 20,
        paddingTop: 2,
    },
    stepTitle: {
        fontSize: 16,
    },
    stepDesc: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 15,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '800',
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
    etaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 10,
    },
    etaText: {
        fontSize: 16,
        fontWeight: '800',
    },
    mapOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
    },
    mapButtonText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 14,
    },
    driverCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    driverTitle: {
        fontSize: 18,
        fontWeight: '900',
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 16,
    },
    driverAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    driverDetails: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '800',
    },
    driverPhone: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
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
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    driverActionText: {
        fontSize: 14,
        fontWeight: '800',
    },
});
