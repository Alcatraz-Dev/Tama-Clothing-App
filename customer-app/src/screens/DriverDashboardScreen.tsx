import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Linking
} from 'react-native';
import {
    Truck,
    MapPin,
    Phone,
    CheckCircle2,
    Navigation,
    QrCode,
    Package,
    ArrowLeft
} from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';
import { db, rtdb } from '../api/firebase';
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
import * as Location from 'expo-location';
import { updateShipmentStatus, updateShipmentLocation } from '../utils/shipping';

export default function DriverDashboardScreen({ user, profileData, onBack, onOpenProof, onScanQR, t, language }: any) {
    const { colors, theme } = useAppTheme();
    const [shipments, setShipments] = useState<any[]>([]);
    const [availableShipments, setAvailableShipments] = useState<any[]>([]);
    const [driverCity, setDriverCity] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'available' | 'my_deliveries'>('available');
    const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);

    const translate = t || ((k: string) => k);

    useEffect(() => {
        const initDriverLocation = async () => {
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
        }
    }, [user?.uid]);

    useEffect(() => {
        if (!user?.uid) return;

        // My Deliveries
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

        // Available Broadcasted Orders
        const qAvail = query(
            collection(db, 'Shipments'),
            where('status', '==', 'Pending')
        );

        const unsubscribeAvail = onSnapshot(qAvail, (snapshot) => {
            let list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter((s: any) => !s.driverId);

            setAvailableShipments(list);
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
            Alert.alert("Success", "You have accepted this delivery request!");
            setActiveTab('my_deliveries');
        } catch (error: any) {
            Alert.alert("Error", error.message);
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
            Alert.alert('Error', error.message);
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

    const handleOpenMap = (address: string) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        Linking.openURL(url);
    };

    const renderShipment = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'Out for Delivery' ? '#3B82F620' : '#F59E0B20'
                }]}>
                    <Text style={[styles.statusText, {
                        color: item.status === 'Out for Delivery' ? '#3B82F6' : '#F59E0B'
                    }]}>{item.status.toUpperCase()}</Text>
                </View>
                <Text style={[styles.trackingId, { color: colors.textMuted }]}>{item.trackingId}</Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <MapPin size={20} color={colors.accent} />
                    <View style={styles.infoCol}>
                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>RECEPTEUR</Text>
                        <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.receiverName}</Text>
                        <Text style={[styles.infoSubValue, { color: colors.textMuted }]}>{item.deliveryAddress}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Phone size={20} color={colors.accent} />
                    <View style={styles.infoCol}>
                        <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.receiverPhone}</Text>
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
                        <Text style={[styles.actionBtnText, { color: '#FFF', marginLeft: 10 }]}>ACCEPT ORDER</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                            onPress={() => handleOpenMap(item.deliveryAddress)}
                        >
                            <Navigation size={20} color={colors.foreground} />
                            <Text style={[styles.actionBtnText, { color: colors.foreground }]}>MAP</Text>
                        </TouchableOpacity>

                        {item.status === 'Pending' || item.status === 'In Transit' ? (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                                onPress={() => handleStartDelivery(item)}
                            >
                                <Truck size={20} color="#FFF" />
                                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>START</Text>
                            </TouchableOpacity>
                        ) : item.status === 'Out for Delivery' ? (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                                onPress={() => onOpenProof(item)}
                            >
                                <CheckCircle2 size={20} color="#FFF" />
                                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>CONFIRM</Text>
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
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>DRIVER PANEL</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
            ) : (
                <>
                    <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 5 }}>
                        <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: activeTab === 'available' ? colors.foreground : 'transparent' }} onPress={() => setActiveTab('available')}>
                            <Text style={{ textAlign: 'center', fontWeight: '800', color: activeTab === 'available' ? colors.foreground : colors.textMuted }}>AVAILABLE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: activeTab === 'my_deliveries' ? colors.foreground : 'transparent' }} onPress={() => setActiveTab('my_deliveries')}>
                            <Text style={{ textAlign: 'center', fontWeight: '800', color: activeTab === 'my_deliveries' ? colors.foreground : colors.textMuted }}>MY DELIVERIES ({shipments.length})</Text>
                        </TouchableOpacity>
                    </View>

                    {activeTab === 'available' && driverCity && (
                        <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>📍 FILTERED BY REGION: {driverCity.toUpperCase()}</Text>
                        </View>
                    )}

                    <FlatList
                        data={activeTab === 'available' ? availableShipments.filter(s => !driverCity || (s.deliveryAddress && s.deliveryAddress.toLowerCase().includes(driverCity.toLowerCase()))) : shipments}
                        renderItem={renderShipment}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Truck size={64} color={colors.border} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    {activeTab === 'available' ? `No assigned shipments in ${driverCity || 'your area'}` : 'No assigned deliveries'}
                                </Text>
                            </View>
                        }
                    />
                </>
            )}
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 2,
    },
    list: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        paddingBottom: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
    },
    trackingId: {
        fontSize: 12,
        fontWeight: '800',
    },
    cardBody: {
        gap: 15,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 15,
        alignItems: 'flex-start',
    },
    infoCol: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 9,
        fontWeight: '800',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '900',
    },
    infoSubValue: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    actionBtn: {
        flex: 1,
        height: 50,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '900',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        gap: 20,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
    }
});
