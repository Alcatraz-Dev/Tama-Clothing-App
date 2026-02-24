import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Linking,
    RefreshControl,
    Modal,
    Platform
} from 'react-native';
import {
    Truck,
    MapPin,
    Phone,
    CheckCircle2,
    Navigation,
    QrCode,
    Package,
    ArrowLeft,
    X,
    Clock
} from 'lucide-react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../context/ThemeContext';
import { db, rtdb } from '../api/firebase';
import { openAddressInNativeMaps } from '../utils/shipping';
import * as Location from 'expo-location';
import {
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { updateShipmentStatus, updateShipmentLocation } from '../utils/shipping';

export default function DriverDashboardScreen({ user, profileData, onBack, onOpenProof, onScanQR, t, language }: any) {
    const { colors, theme } = useAppTheme();
    const [shipments, setShipments] = useState<any[]>([]);
    const [availableShipments, setAvailableShipments] = useState<any[]>([]);
    const [driverCity, setDriverCity] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'available' | 'my_deliveries'>('available');
    const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<any>(null);
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [eta, setEta] = useState<string>('');
    const mapRef = React.useRef<MapView>(null);

    const translate = t || ((k: string) => k);

    useEffect(() => {
        if (selectedShipment && !selectedShipment.deliveryLocation && selectedShipment.deliveryAddress) {
            const geocodeAddress = async () => {
                try {
                    const searchAddress = selectedShipment.deliveryAddress.toLowerCase().includes('tunisie') || selectedShipment.deliveryAddress.toLowerCase().includes('tunisia')
                        ? selectedShipment.deliveryAddress
                        : `${selectedShipment.deliveryAddress}, Tunisia`;

                    const result = await Location.geocodeAsync(searchAddress);
                    if (result && result.length > 0) {
                        setSelectedShipment((prev: any) => ({
                            ...prev,
                            deliveryLocation: {
                                latitude: result[0].latitude,
                                longitude: result[0].longitude
                            }
                        }));
                    }
                } catch (e) {
                    console.log("Geocoding failed in driver screen:", e);
                }
            };
            geocodeAddress();
        }
    }, [selectedShipment?.deliveryAddress, selectedShipment?.deliveryLocation]);

    const handleExternalNavigation = () => {
        if (selectedShipment?.deliveryAddress) {
            openAddressInNativeMaps(selectedShipment.deliveryAddress);
        }
    };


    useEffect(() => {
        const initDriverLocation = async () => {
            if (profileData?.city) {
                setDriverCity(profileData.city);
                return;
            }

            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({});
                    const geocode = await Location.reverseGeocodeAsync(loc.coords);
                    if (geocode && geocode.length > 0) {
                        const city = geocode[0].city || geocode[0].region || geocode[0].subregion;
                        setDriverCity(city);
                    }
                }
            } catch (err) {
                console.log("Error getting city", err);
            }
        };

        if (user?.uid) {
            initDriverLocation();

            // Real-time location for map
            const locUnsub = Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, distanceInterval: 10 },
                (loc) => {
                    setCurrentLocation(loc.coords);
                }
            );

            return () => {
                locUnsub.then(u => u.remove());
            };
        }
    }, [user?.uid, profileData?.city]);

    useEffect(() => {
        if (selectedShipment?.deliveryLocation && currentLocation) {
            const dist = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                selectedShipment.deliveryLocation.latitude,
                selectedShipment.deliveryLocation.longitude
            );

            // If distance > 1000km, it's likely a simulator/empty default, don't show crazy ETA
            if (dist > 1000) {
                setEta('--');
                return;
            }

            // speed 30km/h
            const time = (dist / 30) * 60;
            setEta(time < 1 ? "1 min" : `${Math.round(time)} min`);

            // Auto-fit map to markers
            if (mapRef.current) {
                mapRef.current.fitToCoordinates([
                    currentLocation,
                    selectedShipment.deliveryLocation
                ], {
                    edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
                    animated: true
                });
            }
        }
    }, [selectedShipment, currentLocation]);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    useEffect(() => {
        if (!user?.uid) return;

        // My Deliveries - all shipments assigned to this driver
        const qMy = query(
            collection(db, 'Shipments'),
            where('driverId', '==', user.uid)
        );

        const unsubscribeMy = onSnapshot(qMy, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setShipments(list);
            setLoading(false);
        });

        // Available Pending Orders - show ALL shipments without a driver assigned
        const qAvail = query(
            collection(db, 'Shipments')
        );

        const unsubscribeAvail = onSnapshot(qAvail, (snapshot) => {
            console.log('Total shipments in DB:', snapshot.size);

            const allShipments = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    trackingId: data.trackingId || '',
                    receiverName: data.receiverName || '',
                    receiverPhone: data.receiverPhone || '',
                    deliveryAddress: data.deliveryAddress || '',
                    items: data.items || [],
                    weight: data.weight || '',
                    status: data.status || 'Pending',
                    driverId: data.driverId || null,
                    senderName: data.senderName || '',
                    createdAt: data.createdAt,
                };
            });

            // Show ALL shipments that don't have a driver assigned to them
            const available = allShipments.filter((s: any) => {
                const hasNoDriver = !s.driverId;
                return hasNoDriver;
            });

            console.log('Shipments without driver:', available.length);
            console.log('Sample shipment:', available[0]);

            setAvailableShipments(available);
        });

        return () => {
            unsubscribeMy();
            unsubscribeAvail();
        };
    }, [user?.uid]);

    const handleAcceptOrder = async (shipmentId: string) => {
        try {
            await updateDoc(doc(db, 'Shipments', shipmentId), {
                driverId: user.uid,
                status: 'In Transit',
                updatedAt: serverTimestamp()
            });
            Alert.alert(translate('success'), translate('orderAccepted') || 'Order Accepted!');
            setActiveTab('my_deliveries');
        } catch (error: any) {
            Alert.alert(translate('error'), error.message);
        }
    };

    const handleStartDelivery = async (shipment: any) => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required for real-time tracking');
                return;
            }

            await updateShipmentStatus(shipment.id, shipment.trackingId, 'Out for Delivery', {
                driverCoords: null,
                startedAt: serverTimestamp(),
                driverName: user.displayName || profileData?.fullName || 'Driver'
            });

            setActiveTrackingId(shipment.trackingId);
            startLocationTracking(shipment.trackingId, shipment.id);

            Alert.alert(translate('success'), translate('deliveryStarted') || 'Delivery started! Tracking is live.');
        } catch (error: any) {
            Alert.alert(translate('error'), error.message);
        }
    };

    const startLocationTracking = async (trackingId: string, shipmentId: string) => {
        const hasPermissions = await Location.requestForegroundPermissionsAsync();
        if (hasPermissions.status === 'granted') {
            // Initial position
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            await updateShipmentLocation(trackingId, {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            }, shipmentId);

            // Watch position
            const watcher = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 20, // Update every 20 meters
                    timeInterval: 10000 // Or every 10 seconds
                },
                (location) => {
                    updateShipmentLocation(trackingId, {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude
                    }, shipmentId);
                }
            );

            return () => watcher.remove();
        }
    };

    const handleOpenMap = (shipment: any) => {
        setSelectedShipment(shipment);
        setShowMap(true);
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Pending': return translate('statusPending');
            case 'In Transit': return translate('statusInTransit');
            case 'Out for Delivery': return translate('statusOutForDelivery');
            case 'Delivered': return translate('statusDelivered');
            default: return status;
        }
    };

    const renderShipment = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'Out for Delivery' ? '#3B82F620' : '#F59E0B20'
                }]}>
                    <Text style={[styles.statusText, {
                        color: item.status === 'Out for Delivery' ? '#3B82F6' : '#F59E0B'
                    }]}>{getStatusLabel(item.status).toUpperCase()}</Text>
                </View>
                <Text style={[styles.trackingId, { color: colors.textMuted }]}>{item.trackingId}</Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <MapPin size={20} color={colors.accent} />
                    <View style={styles.infoCol}>
                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{translate('receiver')}</Text>
                        <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.receiverName}</Text>
                        <Text style={[styles.infoSubValue, { color: colors.textMuted }]}>{item.deliveryAddress}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Phone size={20} color={colors.accent} />
                    <View style={styles.infoCol}>
                        <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {activeTab === 'available' ? '********' : item.receiverPhone}
                        </Text>
                    </View>
                </View>

                {item.items && (
                    <View style={styles.infoRow}>
                        <Package size={20} color={colors.accent} />
                        <View style={styles.infoCol}>
                            <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.items.join(', ')}</Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.cardActions}>
                {activeTab === 'available' ? (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#10B981', flex: 1, justifyContent: 'center' }]}
                        onPress={() => handleAcceptOrder(item.id)}
                    >
                        <CheckCircle2 size={20} color="#FFF" />
                        <Text style={[styles.actionBtnText, { color: '#FFF', marginLeft: 10 }]}>{translate('acceptOrder')}</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                            onPress={() => handleOpenMap(item)}
                        >
                            <Navigation size={20} color={colors.foreground} />
                            <Text style={[styles.actionBtnText, { color: colors.foreground }]}>{translate('map')}</Text>
                        </TouchableOpacity>

                        {item.status === 'Pending' || item.status === 'In Transit' ? (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                                onPress={() => handleStartDelivery(item)}
                            >
                                <Truck size={20} color="#FFF" />
                                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>{translate('start')}</Text>
                            </TouchableOpacity>
                        ) : item.status === 'Out for Delivery' ? (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                                onPress={() => onOpenProof(item)}
                            >
                                <CheckCircle2 size={20} color="#FFF" />
                                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>{translate('confirm')}</Text>
                            </TouchableOpacity>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F2F2F7' }]}
                            onPress={() => onScanQR(item)}
                        >
                            <QrCode size={20} color={colors.foreground} />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft color={colors.foreground} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>{translate('driverPanel')}</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
            ) : (
                <>
                    <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 5 }}>
                        <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: activeTab === 'available' ? colors.foreground : 'transparent' }} onPress={() => setActiveTab('available')}>
                            <Text style={{ textAlign: 'center', fontWeight: '800', color: activeTab === 'available' ? colors.foreground : colors.textMuted }}>{translate('available')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: activeTab === 'my_deliveries' ? colors.foreground : 'transparent' }} onPress={() => setActiveTab('my_deliveries')}>
                            <Text style={{ textAlign: 'center', fontWeight: '800', color: activeTab === 'my_deliveries' ? colors.foreground : colors.textMuted }}>{translate('myDeliveries')} ({shipments.length})</Text>
                        </TouchableOpacity>
                    </View>



                    <FlatList
                        data={activeTab === 'available' ? availableShipments : shipments}
                        renderItem={renderShipment}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        refreshControl={
                            <RefreshControl
                                refreshing={loading}
                                onRefresh={() => {
                                    setAvailableShipments([]);
                                    setShipments([]);
                                }}
                                tintColor={colors.accent}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Truck size={64} color={colors.border} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    {activeTab === 'available'
                                        ? translate('noAvailableOrders') || 'No available orders'
                                        : translate('noDeliveries')}
                                </Text>
                            </View>
                        }
                    />
                </>
            )}

            <Modal visible={showMap} animationType="slide">
                <View style={{ flex: 1, backgroundColor: '#000' }}>
                    <MapView
                        ref={mapRef}
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                        style={StyleSheet.absoluteFill}
                        customMapStyle={mapStyle}
                        initialRegion={{
                            latitude: currentLocation?.latitude || selectedShipment?.deliveryLocation?.latitude || 35.8256,
                            longitude: currentLocation?.longitude || selectedShipment?.deliveryLocation?.longitude || 10.6369,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                    >
                        {currentLocation && (
                            <Marker coordinate={currentLocation} title="You">
                                <View style={styles.driverMarker}>
                                    <Truck size={20} color="#FFF" />
                                </View>
                            </Marker>
                        )}
                        {selectedShipment?.deliveryLocation && (
                            <Marker coordinate={selectedShipment.deliveryLocation} title="Destination">
                                <View style={styles.destMarker}>
                                    <MapPin size={24} color="#EF4444" fill="#EF4444" />
                                </View>
                            </Marker>
                        )}
                    </MapView>

                    <BlurView intensity={80} tint="dark" style={styles.mapHeader}>
                        <TouchableOpacity onPress={() => setShowMap(false)} style={styles.closeMapBtn}>
                            <X color="#FFF" size={24} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.mapTitle}>{translate('deliveryDetails')}</Text>
                            <Text style={styles.mapSubTitle}>{selectedShipment?.deliveryAddress}</Text>
                        </View>
                    </BlurView>

                    <View style={styles.mapFooter}>
                        <BlurView intensity={90} tint="dark" style={styles.etaBadge}>
                            <Clock size={16} color="#FFCC00" />
                            <Text style={styles.etaText}>ETA: {eta}</Text>
                        </BlurView>

                        <TouchableOpacity
                            style={styles.externalMapBtn}
                            onPress={handleExternalNavigation}
                        >
                            <Navigation size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const mapStyle = [
    {
        "elementType": "geometry",
        "stylers": [{ "color": "#212121" }]
    },
    {
        "elementType": "labels.icon",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
    }
];

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, paddingTop: 60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 10 },
    headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
    list: { padding: 20, paddingBottom: 100 },
    card: { borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: '900' },
    trackingId: { fontSize: 10, fontWeight: '600' },
    cardBody: { gap: 15 },
    infoRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    infoValue: { fontSize: 16, fontWeight: '800' },
    infoSubValue: { fontSize: 12 },
    cardActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
    actionBtn: { flex: 1, height: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    actionBtnText: { fontSize: 14, fontWeight: '800' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 15 },
    emptyText: { fontSize: 16, fontWeight: '600' },
    mapHeader: { position: 'absolute', top: 0, left: 0, right: 0, padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center', gap: 15 },
    closeMapBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    mapTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    mapSubTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
    mapFooter: { position: 'absolute', bottom: 40, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    etaBadge: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8, overflow: 'hidden' },
    etaText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
    externalMapBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', elevation: 5 },
    driverMarker: { width: 40, height: 40, backgroundColor: '#3B82F6', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },
    destMarker: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }
});
