import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Switch,
    Modal,
    ScrollView,
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
    Power,
    Clock,
    Star,
    Zap,
    Route,
    Users,
    TrendingUp,
    Calendar,
    ChevronRight,
    PackageCheck,
    Timer,
    MapPinned,
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
    serverTimestamp,
    getDoc,
    limit,
    getDocs,
} from 'firebase/firestore';
import { ref, set, onValue, off } from 'firebase/database';
import * as Location from 'expo-location';
import { deliveryService } from '../services/deliveryService';
import { Driver, Delivery, DeliveryBatch, GeoPoint } from '../types/delivery';

type TabType = 'available' | 'my_deliveries' | 'batch' | 'stats';

interface DriverDashboardProps {
    user: any;
    profileData: any;
    onBack: () => void;
    onOpenProof: (delivery: Delivery) => void;
    onScanQR: (delivery: Delivery) => void;
    t: (key: string) => string;
    language: string;
}

export default function EnhancedDriverDashboard({
    user,
    profileData,
    onBack,
    onOpenProof,
    onScanQR,
    t,
    language,
}: DriverDashboardProps) {
    const { colors, theme } = useAppTheme();
    const [activeTab, setActiveTab] = useState<TabType>('my_deliveries');
    const [isOnline, setIsOnline] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
    const [driverData, setDriverData] = useState<Driver | null>(null);
    const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([]);
    const [myDeliveries, setMyDeliveries] = useState<Delivery[]>([]);
    const [currentBatch, setCurrentBatch] = useState<DeliveryBatch | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null);
    const [showStatusModal, setShowStatusModal] = useState(false);


    const translate = t || ((k: string) => k);

    useEffect(() => {
        initDriver();
    }, [user?.uid]);

    useEffect(() => {
        if (!driverData?.id) return;

        const unsubDeliveries = deliveryService.subscribeToDriverDeliveries(driverData.id, (deliveries) => {
            setMyDeliveries(deliveries);
        });

        const unsubPending = deliveryService.subscribeToPendingDeliveries(
            driverData?.serviceAreas?.[0] || 'Tunis',
            (deliveries) => {
                setAvailableDeliveries(deliveries.filter(d => !d.driverId));
            }
        );

        return () => {
            unsubDeliveries();
            unsubPending();
        };
    }, [driverData?.id]);

    useEffect(() => {
        if (isOnline && driverData?.id) {
            startLocationTracking();
        } else if (!isOnline && driverData?.id) {
            stopLocationTracking();
        }
    }, [isOnline, driverData?.id]);

    const initDriver = async () => {
        if (!user?.uid) return;

        try {
            const driversQuery = query(
                collection(db, 'Drivers'),
                where('uid', '==', user.uid),
                limit(1)
            );

            const snapshot = await getDocs(driversQuery);

            if (!snapshot.empty) {
                const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Driver;
                setDriverData(data);
                setIsOnline(data.status === 'online' || data.status === 'busy');
                setIsBusy(data.status === 'busy');
            } else {
                const newDriverId = await deliveryService.initializeDriver({
                    uid: user.uid,
                    fullName: profileData?.fullName || user.displayName || 'Driver',
                    phone: profileData?.phone || user.phoneNumber || '',
                    email: user.email,
                    profileImage: profileData?.profileImage || user.photoURL,
                    vehicleType: profileData?.vehicleType || 'motorcycle',
                    vehicleCapacity: profileData?.vehicleCapacity || 20,
                    serviceAreas: [profileData?.city || 'Tunis'],
                });

                const newDriverDoc = await getDoc(doc(db, 'Drivers', newDriverId));
                setDriverData({ id: newDriverId, ...newDriverDoc.data() } as Driver);
            }
        } catch (error) {
            console.error('Error initializing driver:', error);
        } finally {
            setLoading(false);
        }
    };

    const startLocationTracking = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const loc: GeoPoint = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setCurrentLocation(loc);



            if (driverData?.id) {
                await deliveryService.updateDriverStatus(
                    driverData.id,
                    isOnline ? (isBusy ? 'busy' : 'online') : 'offline',
                    loc
                );
            }

            await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 20,
                    timeInterval: 10000,
                },
                async (loc) => {
                    const newLoc: GeoPoint = {
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                    };
                    setCurrentLocation(newLoc);

                    if (driverData?.id && isOnline) {
                        await deliveryService.updateDriverStatus(
                            driverData.id,
                            isBusy ? 'busy' : 'online',
                            newLoc
                        );
                    }
                }
            );
        } catch (error) {
            console.error('Location tracking error:', error);
        }
    };

    const stopLocationTracking = async () => {
        if (driverData?.id) {
            await deliveryService.updateDriverStatus(driverData.id, 'offline', currentLocation || undefined);
        }
    };

    const toggleOnlineStatus = async (online: boolean) => {
        if (!driverData?.id) return;

        try {
            const status = online ? 'online' : 'offline';
            await deliveryService.updateDriverStatus(driverData.id, status, currentLocation || undefined);
            setIsOnline(online);
        } catch (error) {
            Alert.alert(t('error'), 'Failed to update status');
        }
    };

    const handleAcceptDelivery = async (delivery: Delivery) => {
        if (!driverData?.id) return;

        try {
            await deliveryService.acceptDelivery(driverData.id, delivery.id);
            Alert.alert(t('success'), t('deliveryAccepted') || 'Delivery accepted!');
            setActiveTab('my_deliveries');
        } catch (error: any) {
            Alert.alert(t('error'), error.message);
        }
    };

    const handleStartDelivery = async (delivery: Delivery) => {
        if (!driverData?.id) return;

        try {
            await deliveryService.startDelivery(driverData.id, delivery.id);
            setActiveDeliveryId(delivery.id);
            Alert.alert(t('success'), t('deliveryStarted') || 'Delivery started!');
        } catch (error: any) {
            Alert.alert(t('error'), error.message);
        }
    };

    const handleCompleteDelivery = (delivery: Delivery) => {
        onOpenProof(delivery);
    };

    const handleOpenMap = (address: string) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        require('react-native').Linking.openURL(url);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#F59E0B';
            case 'assigned': return '#3B82F6';
            case 'in_transit': return '#8B5CF6';
            case 'out_for_delivery': return '#06B6D4';
            case 'delivered': return '#10B981';
            case 'cancelled': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: t('statusPending') || 'Pending',
            assigned: t('statusAssigned') || 'Assigned',
            picked_up: t('statusPickedUp') || 'Picked Up',
            in_transit: t('statusInTransit') || 'In Transit',
            out_for_delivery: t('statusOutForDelivery') || 'Out for Delivery',
            delivered: t('statusDelivered') || 'Delivered',
            cancelled: t('statusCancelled') || 'Cancelled',
        };
        return labels[status] || status;
    };

    const renderDeliveryCard = ({ item }: { item: Delivery }) => {
        const isMyDelivery = activeTab !== 'available';

        return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {getStatusLabel(item.status).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.cardHeaderRight}>
                        {item.priority === 'urgent' && (
                            <View style={[styles.priorityBadge, { backgroundColor: '#EF444420' }]}>
                                <Zap size={12} color="#EF4444" />
                                <Text style={[styles.priorityText, { color: '#EF4444' }]}>URGENT</Text>
                            </View>
                        )}
                        <Text style={[styles.trackingId, { color: colors.textMuted }]}>{item.trackingId}</Text>
                    </View>
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
                        <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {activeTab === 'available' ? '********' : item.receiverPhone}
                        </Text>
                    </View>

                    {item.timeWindow && (
                        <View style={styles.infoRow}>
                            <Clock size={20} color={colors.accent} />
                            <View style={styles.infoCol}>
                                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Time Window</Text>
                                <Text style={[styles.infoValue, { color: colors.foreground }]}>
                                    {item.timeWindow.start} - {item.timeWindow.end}
                                </Text>
                            </View>
                        </View>
                    )}

                    {item.items && item.items.length > 0 && (
                        <View style={styles.infoRow}>
                            <Package size={20} color={colors.accent} />
                            <View style={styles.infoCol}>
                                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                                    {translate('items')} ({item.items.length})
                                </Text>
                                <Text style={[styles.infoSubValue, { color: colors.textMuted }]} numberOfLines={1}>
                                    {item.items.map((i: any) => i.name).join(', ')}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.cardActions}>
                    {activeTab === 'available' ? (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#10B981', flex: 1 }]}
                            onPress={() => handleAcceptDelivery(item)}
                        >
                            <CheckCircle2 size={20} color="#FFF" />
                            <Text style={[styles.actionBtnText, { color: '#FFF', marginLeft: 8 }]}>
                                {translate('accept')}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flex: 1 }]}
                                onPress={() => handleOpenMap(item.deliveryAddress)}
                            >
                                <Navigation size={18} color={colors.foreground} />
                                <Text style={[styles.actionBtnText, { color: colors.foreground, marginLeft: 6 }]}>
                                    {translate('map')}
                                </Text>
                            </TouchableOpacity>

                            {(item.status === 'assigned' || item.status === 'pending') && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#3B82F6', flex: 1, marginLeft: 8 }]}
                                    onPress={() => handleStartDelivery(item)}
                                >
                                    <Truck size={18} color="#FFF" />
                                    <Text style={[styles.actionBtnText, { color: '#FFF', marginLeft: 6 }]}>
                                        {translate('start')}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {item.status === 'in_transit' && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#10B981', flex: 1, marginLeft: 8 }]}
                                    onPress={() => handleCompleteDelivery(item)}
                                >
                                    <CheckCircle2 size={18} color="#FFF" />
                                    <Text style={[styles.actionBtnText, { color: '#FFF', marginLeft: 6 }]}>
                                        {translate('complete')}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F2F2F7', width: 50 }]}
                                onPress={() => onScanQR(item)}
                            >
                                <QrCode size={20} color={colors.foreground} />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    };

    const renderStats = () => {
        const metrics = driverData?.metrics;

        return (
            <ScrollView style={styles.statsContainer}>
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <PackageCheck size={24} color="#10B981" />
                        <Text style={[styles.statValue, { color: colors.foreground }]}>
                            {metrics?.completedDeliveries || 0}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                            {translate('completed')}
                        </Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <TrendingUp size={24} color="#3B82F6" />
                        <Text style={[styles.statValue, { color: colors.foreground }]}>
                            {metrics?.onTimeRate?.toFixed(0) || 100}%
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                            {translate('onTime')}
                        </Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Star size={24} color="#F59E0B" />
                        <Text style={[styles.statValue, { color: colors.foreground }]}>
                            {metrics?.averageRating?.toFixed(1) || '5.0'}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                            {translate('rating')}
                        </Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Zap size={24} color="#8B5CF6" />
                        <Text style={[styles.statValue, { color: colors.foreground }]}>
                            {metrics?.currentStreak || 0}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                            {translate('streak')}
                        </Text>
                    </View>
                </View>

                <View style={[styles.statsDetailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.statsDetailTitle, { color: colors.foreground }]}>
                        {translate('weeklyStats')}
                    </Text>
                    <View style={styles.statsDetailRow}>
                        <Text style={[styles.statsDetailLabel, { color: colors.textMuted }]}>
                            {translate('weeklyDeliveries')}
                        </Text>
                        <Text style={[styles.statsDetailValue, { color: colors.foreground }]}>
                            {metrics?.weeklyDeliveries || 0}
                        </Text>
                    </View>
                    <View style={styles.statsDetailRow}>
                        <Text style={[styles.statsDetailLabel, { color: colors.textMuted }]}>
                            {translate('monthlyDeliveries')}
                        </Text>
                        <Text style={[styles.statsDetailValue, { color: colors.foreground }]}>
                            {metrics?.monthlyDeliveries || 0}
                        </Text>
                    </View>
                    <View style={styles.statsDetailRow}>
                        <Text style={[styles.statsDetailLabel, { color: colors.textMuted }]}>
                            {translate('totalEarnings')}
                        </Text>
                        <Text style={[styles.statsDetailValue, { color: colors.foreground }]}>
                            {metrics?.totalEarnings?.toFixed(2) || '0.00'} TND
                        </Text>
                    </View>
                    <View style={styles.statsDetailRow}>
                        <Text style={[styles.statsDetailLabel, { color: colors.textMuted }]}>
                            {translate('totalDistance')}
                        </Text>
                        <Text style={[styles.statsDetailValue, { color: colors.foreground }]}>
                            {metrics?.totalDistanceKm?.toFixed(1) || 0} km
                        </Text>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderContent = () => {
        if (loading) {
            return <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />;
        }

        switch (activeTab) {
            case 'stats':
                return renderStats();

            case 'available':
                return (
                    <FlatList
                        data={availableDeliveries}
                        renderItem={renderDeliveryCard}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Package size={64} color={colors.border} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    {translate('noAvailableDeliveries')}
                                </Text>
                            </View>
                        }
                    />
                );

            case 'my_deliveries':
            case 'batch':
                const activeDeliveries = myDeliveries.filter(d =>
                    d.status !== 'delivered' && d.status !== 'cancelled'
                );
                return (
                    <FlatList
                        data={activeDeliveries}
                        renderItem={renderDeliveryCard}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Truck size={64} color={colors.border} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    {translate('noActiveDeliveries')}
                                </Text>
                            </View>
                        }
                    />
                );

            default:
                return null;
        }
    };

    const tabs = [
        { key: 'available', label: translate('available'), icon: Package },
        { key: 'my_deliveries', label: translate('myDeliveries'), icon: Truck },
        { key: 'stats', label: translate('stats'), icon: TrendingUp },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft color={colors.foreground} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                    {translate('driverPanel')}
                </Text>
                <View style={styles.statusToggle}>
                    <TouchableOpacity
                        style={[
                            styles.statusButton,
                            { backgroundColor: isOnline ? '#10B981' : colors.border },
                        ]}
                        onPress={() => toggleOnlineStatus(!isOnline)}
                    >
                        <Power size={16} color={isOnline ? '#FFF' : colors.foreground} />
                        <Text style={[styles.statusButtonText, { color: isOnline ? '#FFF' : colors.foreground }]}>
                            {isOnline ? 'ON' : 'OFF'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>



            <View style={{ flex: 1 }}>
                <View style={styles.tabBar}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.tab,
                                activeTab === tab.key && { borderBottomColor: colors.foreground, borderBottomWidth: 2 },
                            ]}
                            onPress={() => setActiveTab(tab.key as TabType)}
                        >
                            <tab.icon
                                size={20}
                                color={activeTab === tab.key ? colors.foreground : colors.textMuted}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    { color: activeTab === tab.key ? colors.foreground : colors.textMuted },
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {renderContent()}
            </View>
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
        paddingTop: 50,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    statusToggle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    statusButtonText: {
        fontSize: 12,
        fontWeight: '800',
    },
    cityBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 8,
    },
    cityText: {
        fontSize: 12,
        fontWeight: '700',
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
    },
    list: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    cardHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '900',
    },
    trackingId: {
        fontSize: 12,
        fontWeight: '800',
    },
    cardBody: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    infoCol: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '800',
    },
    infoSubValue: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },
    actionBtn: {
        height: 48,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '900',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        gap: 20,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    statsContainer: {
        flex: 1,
        padding: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: '47%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        gap: 8,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    statsDetailCard: {
        marginTop: 20,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    statsDetailTitle: {
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 16,
    },
    statsDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    statsDetailLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    statsDetailValue: {
        fontSize: 14,
        fontWeight: '800',
    },
});
