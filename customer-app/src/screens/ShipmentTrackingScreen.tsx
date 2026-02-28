import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Linking,
    Platform,
    Modal,
    Animated,
    Image,
    StatusBar,
    Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
    ArrowLeft,
    MapPin,
    Phone,
    CheckCircle,
    Package,
    Clock,
    AlertCircle,
    ChevronRight,
    XCircle,
    Truck,
    Navigation,
    User,
    X,
    Star,
    Shield,
    MessageCircle,
    Info,
    ChevronUp
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, MarkerAnimated } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAppTheme } from '../context/ThemeContext';
import { calculateETA, openInNativeMaps } from '../utils/shipping';
import { db, rtdb } from '../api/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
    updateDoc
} from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STATUS_STEPS = [
    { key: 'pending', label: 'order_confirmed', icon: Package },
    { key: 'picked_up', label: 'picked_up', icon: Truck },
    { key: 'in_transit', label: 'in_transit', icon: Navigation },
    { key: 'out_for_delivery', label: 'out_for_delivery', icon: MapPin },
    { key: 'delivered', label: 'delivered', icon: CheckCircle },
];

export default function ShipmentTrackingScreen({ trackingId, onBack, t }: any) {
    const { colors, theme } = useAppTheme();
    const mapRef = useRef<MapView>(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    const [loading, setLoading] = useState(true);
    const [shipment, setShipment] = useState<any>(null);
    const [driverLocation, setDriverLocation] = useState<any>(null);
    const [driverProfile, setDriverProfile] = useState<any>(null);
    const [eta, setEta] = useState<string>('');
    const [mapVisible, setMapVisible] = useState(false);
    const [rating, setRating] = useState(0);
    const [submittingRating, setSubmittingRating] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [demoMode, setDemoMode] = useState(false); // Demo mode for testing tracking

    // Demo path - simulates driver route for testing (remove when real tracking is ready)
    const demoPath = useMemo(() => {
        if (!shipment?.deliveryLocation) return [];
        const delivery = shipment.deliveryLocation;
        // Create a path starting from a pickup point to delivery location
        return [
            { latitude: delivery.latitude - 0.03, longitude: delivery.longitude - 0.02 }, // Starting point (far)
            { latitude: delivery.latitude - 0.02, longitude: delivery.longitude - 0.015 },
            { latitude: delivery.latitude - 0.015, longitude: delivery.longitude - 0.01 },
            { latitude: delivery.latitude - 0.01, longitude: delivery.longitude - 0.005 },
            { latitude: delivery.latitude - 0.005, longitude: delivery.longitude - 0.002 },
            { latitude: delivery.latitude - 0.002, longitude: delivery.longitude },
            { latitude: delivery.latitude + 0.001, longitude: delivery.longitude + 0.001 }, // Near
            delivery, // Destination
        ];
    }, [shipment?.deliveryLocation]);

    const translate = t || ((k: string) => k);

    // Initial load and Firestore listener
    useEffect(() => {
        let unsubscribeLocation: (() => void) | null = null;

        // First try to find by trackingId
        const q = query(
            collection(db, 'Shipments'),
            where('trackingId', '==', trackingId)
        );

        const unsubscribeFs = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                const data: any = { id: snap.docs[0].id, ...snap.docs[0].data() };
                setShipment(data);
                // Setup location listener with the delivery location from the shipment data
                setupLocationListener(data.id, data.deliveryLocation);
            } else {
                // If not found by trackingId, try by orderId
                const q2 = query(
                    collection(db, 'Shipments'),
                    where('orderId', '==', trackingId)
                );
                onSnapshot(q2, (snap2) => {
                    if (!snap2.empty) {
                        const data: any = { id: snap2.docs[0].id, ...snap2.docs[0].data() };
                        setShipment(data);
                        setupLocationListener(data.id, data.deliveryLocation);
                    }
                    setLoading(false);
                });
            }
        });

        function setupLocationListener(shipmentId: string, deliveryLoc: any) {
            // Clean up previous listener
            if (unsubscribeLocation) {
                unsubscribeLocation();
                unsubscribeLocation = null;
            }

            const rtdbPath = `tracking/${shipmentId}/location`;
            const rtdbRef = ref(rtdb, rtdbPath);

            unsubscribeLocation = onValue(rtdbRef, (snapshot) => {
                if (snapshot.exists()) {
                    const loc = snapshot.val();
                    setDriverLocation(loc);

                    // Calculate ETA if we have delivery location
                    if (deliveryLoc && loc.latitude && loc.longitude) {
                        const etaVal = calculateETA(
                            loc.latitude,
                            loc.longitude,
                            deliveryLoc.latitude,
                            deliveryLoc.longitude
                        );
                        setEta(etaVal);
                    }
                }
                setLoading(false);
            });
        }

        return () => {
            unsubscribeFs();
            if (unsubscribeLocation) unsubscribeLocation();
        };
    }, [trackingId]);

    // Fetch driver profile when shipment has a driverId or driver object
    useEffect(() => {
        const fetchDriverProfile = async () => {
            // First try driverId
            if (shipment?.driverId) {
                try {
                    const driverDoc = await getDoc(doc(db, 'Drivers', shipment.driverId));
                    if (driverDoc.exists()) {
                        setDriverProfile({ id: driverDoc.id, ...driverDoc.data() });
                        return;
                    }
                } catch (error) {
                    console.log('Error fetching driver profile by ID:', error);
                }
            }
            
            // Try driver object inside shipment
            if (shipment?.driver && typeof shipment.driver === 'object') {
                setDriverProfile(shipment.driver);
            }
        };
        fetchDriverProfile();
    }, [shipment?.driverId, shipment?.driver]);

    // Handle map camera on location change
    useEffect(() => {
        if (mapRef.current && (driverLocation || shipment?.deliveryLocation)) {
            const coords = [];
            if (driverLocation) coords.push(driverLocation);
            if (shipment?.deliveryLocation) coords.push(shipment.deliveryLocation);

            if (coords.length > 1) {
                mapRef.current.fitToCoordinates(coords, {
                    edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                    animated: true
                });
            }
        }
    }, [driverLocation, shipment?.deliveryLocation]);

    const getStatusIndex = (status: string) => {
        const s = (status || 'pending').toLowerCase().replace(/ /g, '_');
        const index = STATUS_STEPS.findIndex(step => step.key === s);
        return index === -1 ? 0 : index;
    };

    const getStatusLabel = (status: string): string => {
        if (!status) return translate('pending');
        const s = status.toLowerCase().replace(/ /g, '_');
        // Map common status variations
        const statusMap: { [key: string]: string } = {
            'pending': 'pending',
            'en_attente': 'pending',
            'confirmed': 'order_confirmed',
            'order_confirmed': 'order_confirmed',
            'picked_up': 'picked_up',
            'pickedup': 'picked_up',
            'collected': 'picked_up',
            'in_transit': 'in_transit',
            'intransit': 'in_transit',
            'out_for_delivery': 'out_for_delivery',
            'outfordelivery': 'out_for_delivery',
            'delivery': 'out_for_delivery',
            'delivered': 'delivered',
            'livré': 'delivered',
            'livre': 'delivered',
            'cancelled': 'cancelled',
            'annulé': 'cancelled',
            'failed': 'failed',
            'échoué': 'failed',
        };
        const translatedKey = statusMap[s] || s;
        return translate(translatedKey) || translatedKey;
    };

    // Determine delivery phase based on status
    const getDeliveryPhase = () => {
        if (!shipment?.status) return 'pending';
        const status = shipment.status.toLowerCase();
        if (status === 'pending' || status === 'en_attente' || status === 'confirmed' || status === 'order_confirmed') {
            return 'pending'; // Order not yet picked up
        }
        if (status === 'picked_up' || status === 'pickedup' || status === 'collected') {
            return 'picking_up'; // Driver at merchant location
        }
        if (status === 'in_transit' || status === 'intransit') {
            return 'in_transit'; // On the way
        }
        if (status === 'out_for_delivery' || status === 'outfordelivery' || status === 'delivery') {
            return 'out_for_delivery'; // Last mile
        }
        if (status === 'delivered' || status === 'livré' || status === 'livre') {
            return 'delivered';
        }
        if (status === 'cancelled' || status === 'annulé') {
            return 'cancelled';
        }
        if (status === 'failed' || status === 'échoué') {
            return 'failed';
        }
        return 'pending';
    };

    const deliveryPhase = useMemo(() => getDeliveryPhase(), [shipment?.status]);
    const currentIndex = useMemo(() => getStatusIndex(shipment?.status), [shipment?.status]);

    // Demo mode: animate driver along path when no real location available
    // TODO: Remove this demo code when real-time GPS tracking is fully implemented
    useEffect(() => {
        // Only run demo if in delivery phase and no real driver location
        const isInDelivery = deliveryPhase === 'in_transit' || deliveryPhase === 'out_for_delivery';
        const hasDriverAssigned = shipment?.driverId || shipment?.driverName || shipment?.driver;
        
        if (isInDelivery && hasDriverAssigned && !driverLocation && demoPath.length > 0 && !demoMode) {
            // Auto-enable demo mode for testing
            setDemoMode(true);
        }
    }, [deliveryPhase, driverLocation, demoPath, demoMode, shipment]);

    // Animate demo driver position along path
    useEffect(() => {
        if (!demoMode || demoPath.length === 0 || driverLocation) return;

        let pathIndex = 0;
        const interval = setInterval(() => {
            if (pathIndex < demoPath.length) {
                const newLoc = demoPath[pathIndex];
                setDriverLocation(newLoc);
                
                // Calculate ETA for demo
                if (shipment?.deliveryLocation && newLoc.latitude && newLoc.longitude) {
                    const demoEta = calculateETA(
                        newLoc.latitude,
                        newLoc.longitude,
                        shipment.deliveryLocation.latitude,
                        shipment.deliveryLocation.longitude
                    );
                    setEta(demoEta);
                }
                
                pathIndex++;
            } else {
                // Reset to start for continuous demo
                pathIndex = 0;
                setDriverLocation(demoPath[0]);
            }
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, [demoMode, demoPath, driverLocation, shipment?.deliveryLocation]);
    const hasDriver = !!shipment?.driverId;
    const hasPickupLocation = !!shipment?.pickupLocation;
    const hasDeliveryLocation = !!shipment?.deliveryLocation;

    const handleCall = () => {
        const phone = driverProfile?.phone || driverProfile?.phoneNumber || shipment?.driverPhone || shipment?.driver?.phone || shipment?.driver?.phoneNumber;
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        } else {
            Alert.alert(translate('error') || 'Error', translate('driver_phone_unavailable') || 'Driver phone number not available');
        }
    };

    const handleMessage = () => {
        const phone = driverProfile?.phone || driverProfile?.phoneNumber || shipment?.driverPhone || shipment?.driver?.phone || shipment?.driver?.phoneNumber;
        if (phone) {
            Linking.openURL(`sms:${phone}`);
        } else {
            Alert.alert(translate('error') || 'Error', translate('driver_phone_unavailable') || 'Driver phone number not available');
        }
    };

    const submitRating = async (val: number) => {
        if (!shipment || submittingRating) return;
        setSubmittingRating(true);
        try {
            await updateDoc(doc(db, 'Shipments', shipment.id), { rating: val });
            setRating(val);
        } finally {
            setSubmittingRating(false);
        }
    };

    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [0, -50],
        extrapolate: 'clamp'
    });

    const mapScale = scrollY.interpolate({
        inputRange: [-200, 0],
        outputRange: [1.5, 1],
        extrapolate: 'clamp'
    });

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>{translate('loading_tracking') || 'Finding your shipment...'}</Text>
            </View>
        );
    }

    if (!shipment) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background, padding: 30 }]}>
                <Animatable.View animation="bounceIn">
                    <XCircle size={80} color={colors.textMuted} />
                </Animatable.View>
                <Text style={[styles.errorTitle, { color: colors.foreground }]}>{translate('no_shipment_title') || 'Not Found'}</Text>
                <Text style={[styles.errorText, { color: colors.textMuted }]}>{translate('no_shipment_desc') || "We couldn't find a shipment with this ID."}</Text>
                <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: colors.accent }]}>
                    <Text style={styles.backButtonText}>{translate('go_back') || 'Go Back'}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <Animated.View style={[styles.topHeader, { transform: [{ translateY: headerTranslateY }] }]}>
                <BlurView intensity={80} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.headerBlur}>
                    <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                        <ArrowLeft color={colors.foreground} size={24} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={[styles.headerSub, { color: colors.textMuted }]}>{translate('tracking_id')}</Text>
                        <Text style={[styles.headerId, { color: colors.foreground }]}>#{trackingId.toUpperCase()}</Text>
                    </View>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Info color={colors.foreground} size={22} onPress={() => setShowHistoryModal(true)} />
                    </TouchableOpacity>
                </BlurView>
            </Animated.View>

            <Animated.ScrollView
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Map Section */}
                <Animated.View style={[styles.mapSection, { transform: [{ scale: mapScale }] }]}>
                    <MapView
                        ref={mapRef}
                        style={StyleSheet.absoluteFill}
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                        initialRegion={{
                            latitude: shipment?.deliveryLocation?.latitude || 35.8256,
                            longitude: shipment?.deliveryLocation?.longitude || 10.6369,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                        customMapStyle={theme === 'dark' ? darkMapStyle : []}
                    >
                        {/* Merchant/Pickup Location Marker - shown when order is pending or being picked up */}
                        {((deliveryPhase === 'pending' || deliveryPhase === 'picking_up') && (shipment.pickupLocation || shipment.senderLocation)) && (
                            <Marker coordinate={shipment.pickupLocation || shipment.senderLocation}>
                                <View style={styles.pickupMarker}>
                                    <View style={[styles.markerInner, { backgroundColor: '#F59E0B' }]}>
                                        <MapPin size={20} color="#FFF" />
                                    </View>
                                    <View style={styles.markerShadow} />
                                </View>
                            </Marker>
                        )}

                        {/* Delivery Location Marker - always shown when available (or default) */}
                        {shipment.deliveryLocation ? (
                            <Marker coordinate={shipment.deliveryLocation}>
                                <View style={styles.destinationMarker}>
                                    <View style={[styles.markerInner, { backgroundColor: deliveryPhase === 'delivered' ? '#10B981' : '#6366F1' }]}>
                                        <MapPin size={20} color="#FFF" />
                                    </View>
                                    <View style={styles.markerShadow} />
                                </View>
                            </Marker>
                        ) : (
                            // Default marker when no delivery location
                            <Marker 
                                coordinate={{ latitude: 35.8256, longitude: 10.6369 }}
                                title={translate('delivery_address')}
                                description={shipment.deliveryAddress || translate('address_placeholder')}
                            >
                                <View style={styles.destinationMarker}>
                                    <View style={[styles.markerInner, { backgroundColor: '#6366F1' }]}>
                                        <MapPin size={20} color="#FFF" />
                                    </View>
                                    <View style={styles.markerShadow} />
                                </View>
                            </Marker>
                        )}

                        {/* Show delivery address label during delivery phase */}
                        {(deliveryPhase === 'in_transit' || deliveryPhase === 'out_for_delivery') && shipment.deliveryAddress && (
                            <Marker coordinate={shipment.deliveryLocation || { latitude: 35.8256, longitude: 10.6369 }}>
                                <View style={[styles.addressLabel, { backgroundColor: colors.surface }]}>
                                    <Text style={[styles.addressLabelText, { color: colors.foreground }]} numberOfLines={1}>
                                        {shipment.deliveryAddress}
                                    </Text>
                                </View>
                            </Marker>
                        )}

                        {/* Driver Location Marker - shown when driver is assigned */}
                        {hasDriver && driverLocation && (
                            <Marker coordinate={driverLocation}>
                                <Animatable.View 
                                    animation={deliveryPhase === 'in_transit' || deliveryPhase === 'out_for_delivery' ? 'pulse' : 'bounce'} 
                                    iterationCount="infinite" 
                                    style={styles.driverMarker}
                                >
                                    <View style={[styles.markerInner, { backgroundColor: colors.accent }]}>
                                        <Truck size={20} color={colors.accentForeground} />
                                    </View>
                                </Animatable.View>
                            </Marker>
                        )}

                        {/* Route: From pickup to delivery when in transit */}
                        {(deliveryPhase === 'in_transit' || deliveryPhase === 'out_for_delivery') && 
                         shipment.deliveryLocation && (
                            <>
                                {/* Show route from driver to delivery */}
                                {driverLocation && (
                                    <Polyline
                                        coordinates={[driverLocation, shipment.deliveryLocation]}
                                        strokeColor={colors.accent}
                                        strokeWidth={4}
                                        lineDashPattern={deliveryPhase === 'out_for_delivery' ? undefined : [8, 4]}
                                    />
                                )}
                                {/* Show route from pickup to delivery when driver is at pickup */}
                                {(shipment.pickupLocation || shipment.senderLocation) && !driverLocation && (
                                    <Polyline
                                        coordinates={[
                                            shipment.pickupLocation || shipment.senderLocation,
                                            shipment.deliveryLocation
                                        ]}
                                        strokeColor="#F59E0B"
                                        strokeWidth={3}
                                        lineDashPattern={[6, 3]}
                                    />
                                )}
                            </>
                        )}

                        {/* Route: From driver to delivery when out for delivery */}
                        {deliveryPhase === 'out_for_delivery' && driverLocation && shipment.deliveryLocation && (
                            <>
                                <Polyline
                                    coordinates={[driverLocation, shipment.deliveryLocation]}
                                    strokeColor="#10B981"
                                    strokeWidth={4}
                                />
                            </>
                        )}

                        {/* Demo Path - show full route when in demo mode */}
                        {demoMode && demoPath.length > 0 && (deliveryPhase === 'in_transit' || deliveryPhase === 'out_for_delivery') && (
                            <>
                                <Polyline
                                    coordinates={demoPath}
                                    strokeColor={colors.accent}
                                    strokeWidth={3}
                                    lineDashPattern={[8, 4]}
                                />
                                {/* Show remaining path from current position to delivery */}
                                {driverLocation && shipment.deliveryLocation && (
                                    <Polyline
                                        coordinates={[driverLocation, shipment.deliveryLocation]}
                                        strokeColor="#10B981"
                                        strokeWidth={4}
                                    />
                                )}
                            </>
                        )}
                    </MapView>
                    <LinearGradient
                        colors={['transparent', colors.background]}
                        style={styles.mapOverlay}
                    />
                </Animated.View>

                {/* Tracking Info Card */}
                <Animatable.View animation="fadeInUp" duration={800} style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.pullBar} />

                    <View style={styles.statusHeader}>
                        <View>
                            <Text style={[styles.statusTitle, { color: colors.foreground }]}>
                                {getStatusLabel(shipment.status)}
                            </Text>
                            <Text style={[styles.statusSubtitle, { color: colors.textMuted }]}>
                                {deliveryPhase === 'pending' && (translate('order_confirmed'))}
                                {deliveryPhase === 'picking_up' && (translate('picked_up'))}
                                {deliveryPhase === 'in_transit' && (eta ? `${translate('arriving_in')} ${eta}` : translate('in_transit'))}
                                {deliveryPhase === 'out_for_delivery' && (eta ? `${translate('arriving_in')} ${eta}` : translate('out_for_delivery'))}
                                {deliveryPhase === 'delivered' && (translate('delivered'))}
                                {deliveryPhase === 'cancelled' && (translate('cancelled'))}
                                {deliveryPhase === 'failed' && (translate('failed'))}
                            </Text>
                        </View>
                        {(deliveryPhase === 'in_transit' || deliveryPhase === 'out_for_delivery') && (
                            <View style={[styles.statusBadge, { backgroundColor: colors.accent + '20' }]}>
                                <Clock size={16} color={colors.accent} />
                                <Text style={[styles.badgeText, { color: colors.accent }]}>{eta || '...'}</Text>
                            </View>
                        )}
                        {/* Demo Mode Indicator - for testing only */}
                        {demoMode && (
                            <View style={[styles.statusBadge, { backgroundColor: '#F59E0B20' }]}>
                                <Text style={{ fontSize: 10 }}>🧪</Text>
                                <Text style={[styles.badgeText, { color: '#F59E0B' }]}>Demo</Text>
                            </View>
                        )}
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        {STATUS_STEPS.map((step, idx) => (
                            <View key={step.key} style={styles.progressStep}>
                                <View style={[
                                    styles.progressNode,
                                    { backgroundColor: idx <= currentIndex ? colors.accent : colors.border }
                                ]}>
                                    {idx < currentIndex && <CheckCircle size={10} color={colors.accentForeground} />}
                                </View>
                                {idx < STATUS_STEPS.length - 1 && (
                                    <View style={[
                                        styles.progressLine,
                                        { backgroundColor: idx < currentIndex ? colors.accent : colors.border }
                                    ]} />
                                )}
                            </View>
                        ))}
                    </View>

                    {/* Driver Card - show when driver is assigned (driverId) OR when driver info exists in shipment */}
                    {(shipment.driverId || shipment.driverName || shipment.driver) && (
                        <Animatable.View animation="fadeIn" delay={300} style={[styles.driverBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <View style={styles.driverMain}>
                                {(driverProfile?.photoURL || driverProfile?.photoUrl || driverProfile?.avatarUrl || driverProfile?.profileImage || shipment.driverImage || shipment.driver?.photoURL || shipment.driver?.photoUrl || shipment.driver?.avatarUrl || shipment.driver?.profileImage) ? (
                                    <Image
                                        source={{ uri: driverProfile?.photoURL || driverProfile?.photoUrl || driverProfile?.avatarUrl || driverProfile?.profileImage || shipment.driverImage || shipment.driver?.photoURL || shipment.driver?.photoUrl || shipment.driver?.avatarUrl || shipment.driver?.profileImage }}
                                        style={styles.driverAvatar}
                                    />
                                ) : (
                                    <View style={[styles.driverAvatar, { backgroundColor: colors.accent + '30', alignItems: 'center', justifyContent: 'center' }]}>
                                        <User size={28} color={colors.accent} />
                                    </View>
                                )}
                                <View style={styles.driverInfo}>
                                    <Text style={[styles.driverName, { color: colors.foreground }]}>{driverProfile?.name || driverProfile?.fullName || shipment.driverName || shipment.driver?.name || shipment.driver?.fullName || translate('driver_default_name')}</Text>
                                    <View style={styles.driverRating}>
                                        <Star size={14} color="#FBBF24" fill="#FBBF24" />
                                        <Text style={[styles.ratingText, { color: colors.textMuted }]}>{driverProfile?.rating?.toFixed(1) || shipment.driverRating || '4.9'} ({shipment.driverDeliveries || '120'} {translate('deliveries')})</Text>
                                    </View>
                                </View>
                            </View>
                            
                            {/* Pickup & Delivery Time */}
                            <View style={styles.timeRow}>
                                {(shipment.pickupTime || shipment.estimatedPickupTime) && (
                                    <View style={styles.timeItem}>
                                        <Clock size={14} color={colors.accent} />
                                        <Text style={[styles.timeLabel, { color: colors.textMuted }]}>{translate('pickup_time')}</Text>
                                        <Text style={[styles.timeValue, { color: colors.foreground }]}>
                                            {shipment.pickupTime ? new Date(shipment.pickupTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 
                                             shipment.estimatedPickupTime ? new Date(shipment.estimatedPickupTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </Text>
                                    </View>
                                )}
                                {(shipment.deliveryTime || shipment.estimatedDeliveryTime || eta) && (
                                    <View style={styles.timeItem}>
                                        <MapPin size={14} color="#10B981" />
                                        <Text style={[styles.timeLabel, { color: colors.textMuted }]}>{translate('estimated_arrival')}</Text>
                                        <Text style={[styles.timeValue, { color: '#10B981' }]}>
                                            {eta || '-'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            
                            <View style={styles.driverActions}>
                                <TouchableOpacity onPress={handleCall} style={[styles.actionBtn, { backgroundColor: colors.accent + '15' }]}>
                                    <Phone size={20} color={colors.accent} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleMessage} style={[styles.actionBtn, { backgroundColor: '#10B98115' }]}>
                                    <MessageCircle size={20} color="#10B981" />
                                </TouchableOpacity>
                            </View>
                        </Animatable.View>
                    )}
                    <View style={[styles.safetyBadge, { backgroundColor: '#10B98110' }]}>
                        <Shield size={16} color="#10B981" />
                        <Text style={styles.safetyText}>{translate('contactless_delivery')}</Text>
                    </View>

                    {/* Items Card - check multiple possible field names */}
                    {shipment.items || shipment.products || shipment.orderItems || shipment.articles ? (
                        <View style={[styles.itemsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.itemsTitle, { color: colors.foreground }]}>
                                {translate('items')} ({(shipment.items || shipment.products || shipment.orderItems || shipment.articles || []).length})
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScroll}>
                                {(shipment.items || shipment.products || shipment.orderItems || shipment.articles || []).map((item: any, index: number) => (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                                        onPress={() => setSelectedItem(item)}
                                        activeOpacity={0.7}
                                    >
                                        {(item.image || item.mainImage || item.productImage || item.thumbnail) ? (
                                            <Image 
                                                source={{ uri: item.image || item.mainImage || item.productImage || item.thumbnail }} 
                                                style={styles.itemImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={[styles.itemImagePlaceholder, { backgroundColor: colors.accent + '20' }]}>
                                                <Package size={24} color={colors.accent} />
                                            </View>
                                        )}
                                        <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                                            {item.name || item.title || item.productName || item.product?.name || 'Item'}
                                        </Text>
                                        <View style={styles.itemMetaRow}>
                                            {(item.selectedColor || item.color) && (
                                                <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                                                    {item.selectedColor || item.color}
                                                </Text>
                                            )}
                                            {(item.selectedSize || item.size) && (
                                                <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                                                    {item.selectedSize || item.size}
                                                </Text>
                                            )}
                                            {item.quantity && (
                                                <Text style={[styles.itemQty, { color: colors.textMuted }]}>
                                                    x{item.quantity}
                                                </Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    ) : null}

                    {/* Address Card */}
                    <View style={styles.detailCol}>
                        <View style={[styles.detailIcon, { backgroundColor: colors.accent + '10' }]}>
                            <MapPin size={20} color={colors.accent} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('delivery_address')}</Text>
                            <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={2}>
                                {shipment.deliveryAddress || translate('address_placeholder')}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={[styles.mapButton, { backgroundColor: colors.accent + '15' }]} 
                            onPress={() => {
                                if (shipment?.deliveryLocation?.latitude && shipment?.deliveryLocation?.longitude) {
                                    try {
                                        openInNativeMaps(
                                            shipment.deliveryLocation.latitude,
                                            shipment.deliveryLocation.longitude,
                                            shipment.deliveryAddress
                                        );
                                    } catch (err) {
                                        console.log('Error opening maps:', err);
                                    }
                                } else {
                                    console.log('No delivery location available');
                                }
                            }}
                        >
                            <MapPin size={16} color={colors.accent} />
                            <Text style={[styles.mapButtonText, { color: colors.accent }]}>{translate('open_in_maps')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Timeline Expansion */}
                    <TouchableOpacity 
                        style={styles.expandTimeline}
                        onPress={() => setShowHistoryModal(true)}
                    >
                        <Text style={[styles.expandText, { color: colors.accent }]}>{translate('view_detailed_history')}</Text>
                        <ChevronUp size={16} color={colors.accent} />
                    </TouchableOpacity>
                </Animatable.View>

                {/* Rating Card (Only if delivered) */}
                {shipment.status?.toLowerCase() === 'delivered' && !shipment.rating && (
                    <Animatable.View animation="fadeInUp" delay={500} style={[styles.ratingCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.ratingTitle, { color: colors.foreground }]}>{translate('how_was_delivery')}</Text>
                        <Text style={[styles.ratingDesc, { color: colors.textMuted }]}>{translate('feedback_help')}</Text>
                        <View style={styles.stars}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <TouchableOpacity key={s} onPress={() => submitRating(s)}>
                                    <Star
                                        size={40}
                                        color={(rating || shipment.rating) >= s ? '#FBBF24' : colors.border}
                                        fill={(rating || shipment.rating) >= s ? '#FBBF24' : 'transparent'}
                                        style={{ marginHorizontal: 5 }}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animatable.View>
                )}
            </Animated.ScrollView>

            {/* Detailed History Modal */}
            <Modal
                visible={showHistoryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowHistoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{translate('shipment_details')}</Text>
                            <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                                <X size={24} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            {/* Tracking ID */}
                            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('tracking_id')}</Text>
                                <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.trackingId}</Text>
                            </View>

                            {/* Order ID */}
                            {shipment.orderId && (
                                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('order_id')}</Text>
                                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.orderId}</Text>
                                </View>
                            )}

                            {/* Status */}
                            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('status_label')}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: colors.accent + '15' }]}>
                                    <Text style={[styles.statusText, { color: colors.accent }]}>{translate(shipment.status?.toLowerCase().replace(/ /g, '_') || 'pending')}</Text>
                                </View>
                            </View>

                            {/* Sender */}
                            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('sender')}</Text>
                                <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.senderName}</Text>
                            </View>

                            {/* Sender Phone */}
                            {shipment.senderPhone && (
                                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('sender_phone')}</Text>
                                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.senderPhone}</Text>
                                </View>
                            )}

                            {/* Receiver */}
                            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('receiver_label')}</Text>
                                <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.receiverName}</Text>
                            </View>

                            {/* Receiver Phone */}
                            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('receiver_phone_label')}</Text>
                                <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.receiverPhone}</Text>
                            </View>

                            {/* Delivery Address */}
                            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('delivery_address')}</Text>
                                <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.deliveryAddress}</Text>
                            </View>

                            {/* Zone */}
                            {shipment.zoneId && (
                                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('zone')}</Text>
                                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.zoneId}</Text>
                                </View>
                            )}

                            {/* Weight */}
                            {shipment.weight && (
                                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('weight')}</Text>
                                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.weight}</Text>
                                </View>
                            )}

                            {/* Service Type */}
                            {shipment.serviceType && (
                                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('service_type')}</Text>
                                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.serviceType}</Text>
                                </View>
                            )}

                            {/* Carrier */}
                            {shipment.carrierName && (
                                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('carrier')}</Text>
                                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.carrierName}</Text>
                                </View>
                            )}

                            {/* Shipping Price */}
                            {shipment.shippingPrice !== undefined && (
                                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('shipping_cost')}</Text>
                                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.shippingPrice.toFixed(2)} TND</Text>
                                </View>
                            )}

                            {/* Total Price */}
                            {shipment.totalPrice !== undefined && (
                                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('total')}</Text>
                                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.totalPrice.toFixed(2)} TND</Text>
                                </View>
                            )}

                            {/* Driver (if assigned) */}
                            {shipment.driverId && (
                                <>
                                    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('driver_label')}</Text>
                                        <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.driverName}</Text>
                                    </View>
                                    {shipment.driverPhone && (
                                        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('driver_phone')}</Text>
                                            <Text style={[styles.detailValue, { color: colors.foreground }]}>{shipment.driverPhone}</Text>
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Created Date */}
                            {shipment.createdAt && (
                                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('created_at')}</Text>
                                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                                        {shipment.createdAt.toDate ? shipment.createdAt.toDate().toLocaleString() : new Date(shipment.createdAt.seconds * 1000).toLocaleString()}
                                    </Text>
                                </View>
                            )}

                            {/* Updated Date */}
                            {shipment.updatedAt && (
                                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('last_updated')}</Text>
                                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                                        {shipment.updatedAt.toDate ? shipment.updatedAt.toDate().toLocaleString() : new Date(shipment.updatedAt.seconds * 1000).toLocaleString()}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Item Detail Modal */}
            <Modal
                visible={!!selectedItem}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedItem(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{translate('item_details') || 'Item Details'}</Text>
                            <TouchableOpacity onPress={() => setSelectedItem(null)}>
                                <X size={24} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            {selectedItem && (
                                <>
                                    {/* Item Image */}
                                    {(selectedItem.image || selectedItem.mainImage || selectedItem.productImage || selectedItem.thumbnail) ? (
                                        <Image 
                                            source={{ uri: selectedItem.image || selectedItem.mainImage || selectedItem.productImage || selectedItem.thumbnail }} 
                                            style={styles.itemDetailImage}
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <View style={[styles.itemDetailImagePlaceholder, { backgroundColor: colors.accent + '20' }]}>
                                            <Package size={64} color={colors.accent} />
                                        </View>
                                    )}

                                    {/* Item Name */}
                                    <Text style={[styles.itemDetailName, { color: colors.foreground }]}>
                                        {selectedItem.name || selectedItem.title || selectedItem.productName || selectedItem.product?.name || 'Item'}
                                    </Text>

                                    {/* Item Details */}
                                    {selectedItem.quantity && (
                                        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('quantity') || 'Quantity'}</Text>
                                            <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedItem.quantity}</Text>
                                        </View>
                                    )}

                                    {selectedItem.price !== undefined && (
                                        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('price') || 'Price'}</Text>
                                            <Text style={[styles.detailValue, { color: colors.foreground }]}>
                                                {typeof selectedItem.price === 'number' ? selectedItem.price.toFixed(2) : selectedItem.price} TND
                                            </Text>
                                        </View>
                                    )}

                                    {(selectedItem.selectedColor || selectedItem.color) && (
                                        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('color') || 'Color'}</Text>
                                            <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedItem.selectedColor || selectedItem.color}</Text>
                                        </View>
                                    )}

                                    {selectedItem.selectedSize && (
                                        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('size') || 'Size'}</Text>
                                            <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedItem.selectedSize}</Text>
                                        </View>
                                    )}

                                    {selectedItem.description && (
                                        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{translate('description') || 'Description'}</Text>
                                            <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedItem.description}</Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const darkMapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
    { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
    { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
    { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
    { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
    { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topHeader: {
        position: 'absolute',
        top: -70,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    headerBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 25,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    headerTitleContainer: {
        alignItems: 'center',
        marginTop:45
    },
    headerSub: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerId: {
        fontSize: 16,
        fontWeight: '900',
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop:20
    },
    scrollContent: {
        paddingTop: 0,
        minHeight: SCREEN_HEIGHT,
    },
    mapSection: {
        height: SCREEN_HEIGHT * 0.6,
        width: SCREEN_WIDTH,
    },
    mapOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    infoCard: {
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        padding: 24,
        paddingBottom: 40,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    pullBar: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 25,
    },
    statusTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 5,
    },
    statusSubtitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '800',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 5,
    },
    progressStep: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressNode: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    progressLine: {
        flex: 1,
        height: 3,
        marginHorizontal: -1,
    },
    driverBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
    },
    driverMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    driverAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    driverInfo: {
        justifyContent: 'center',
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
        fontSize: 12,
        fontWeight: '600',
    },
    driverActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    actionBtn: {
        width: 44,
        height: 44,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Time Display Styles
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        gap: 12,
    },
    timeItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    timeValue: {
        fontSize: 13,
        fontWeight: '800',
    },
    safetyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 15,
        gap: 10,
        marginBottom: 25,
    },
    safetyText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10B981',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 20,
    },
    // Items Display Styles
    itemsCard: {
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
    },
    itemsTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 12,
    },
    itemsScroll: {
        marginHorizontal: -4,
    },
    itemCard: {
        width: 80,
        marginRight: 10,
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
    },
    itemImage: {
        width: 64,
        height: 64,
        borderRadius: 8,
        marginBottom: 6,
    },
    itemImagePlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 8,
        marginBottom: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 10,
        fontWeight: '600',
        lineHeight: 12,
    },
    itemQty: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
    },
    itemMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 2,
    },
    itemMeta: {
        fontSize: 10,
        fontWeight: '500',
    },
    // Item Detail Modal Styles
    itemDetailImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 16,
    },
    itemDetailImagePlaceholder: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemDetailName: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 16,
    },
    // Detail Column Styles
      detailCol: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 15,
        marginBottom: 20,
    },
    detailIcon: {
        width: 44,
        height: 44,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 3,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    expandTimeline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        marginTop: 10,
    },
    expandText: {
        fontSize: 14,
        fontWeight: '800',
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
        marginTop: 8,
    },
    mapButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },
    ratingCard: {
        padding: 30,
        margin: 20,
        borderRadius: 25,
        alignItems: 'center',
    },
    ratingTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 10,
    },
    ratingDesc: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 25,
    },
    stars: {
        flexDirection: 'row',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        fontWeight: '700',
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginTop: 20,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    backButton: {
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 20,
    },
    backButtonText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16,
    },
    destinationMarker: {
        alignItems: 'center',
    },
    pickupMarker: {
        alignItems: 'center',
    },
    driverMarker: {
        alignItems: 'center',
    },
    markerInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    markerShadow: {
        width: 10,
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 10,
        marginTop: 2,
    },
    addressLabel: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        maxWidth: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    addressLabelText: {
        fontSize: 12,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        maxHeight: '80%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        borderWidth: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
    },
    modalScroll: {
        maxHeight: 500,
    },
});
