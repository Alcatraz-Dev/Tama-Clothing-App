import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    Platform,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInRight, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Truck,
    MapPin,
    Phone,
    CheckCircle2,
    Navigation,
    QrCode,
    Trophy,
    ShoppingBag,
    Package,
    ArrowLeft,
    Power,
    Clock,
    X,
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
    Flame,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    LineChart as LineChartIcon,
    PieChart,
    Activity,
    RotateCcw
} from 'lucide-react-native';
import Svg, {
    Path,
    Circle as CircleSvg,
    Defs,
    Stop,
    G,
    LinearGradient as LinearGradientSvg
} from 'react-native-svg';
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
    const [showMap, setShowMap] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
    const insets = useSafeAreaInsets();


    const translate = t || ((k: string) => k);

    const tr = (fr: string, ar: string, en: string) => {
        return language === 'ar' ? ar : (language === 'fr' ? fr : en);
    };

    useEffect(() => {
        initDriver();
    }, [user?.uid]);

    const computedMetrics = useMemo(() => {
        const delivered = myDeliveries.filter(d => d.status === 'delivered');
        const cancelled = myDeliveries.filter(d => d.status === 'cancelled');
        const returnedCount = myDeliveries.filter(d => d.status === 'returned').length;
        const inProgress = myDeliveries.filter(d => !['delivered', 'cancelled', 'returned'].includes(d.status));

        const totalEarnings = delivered.reduce((sum, d) => sum + (d.pricing?.total || 0), 0);
        const totalDistance = delivered.reduce((sum, d) => sum + (d.estimatedDistance || 0), 0);

        // Group by day of week (Mon-Sun: 0-6)
        const revenueByDay = [0, 0, 0, 0, 0, 0, 0];
        const kmByDay = [0, 0, 0, 0, 0, 0, 0];
        const productCounts: Record<string, number> = {};

        delivered.forEach(d => {
            if (d.deliveredAt) {
                const date = new Date(d.deliveredAt);
                // getDay() is 0 (Sun) to 6 (Sat)
                // We want 0 (Mon) to 6 (Sun)
                const day = date.getDay();
                const index = day === 0 ? 6 : day - 1;
                if (index >= 0 && index < 7) {
                    revenueByDay[index] += d.pricing?.total || 0;
                    kmByDay[index] += d.estimatedDistance || 0;
                }
            }

            // Product analytics
            if (d.items && Array.isArray(d.items)) {
                d.items.forEach((item: any) => {
                    const name = typeof item === 'string' ? item : (item.name || 'Unknown');
                    productCounts[name] = (productCounts[name] || 0) + (item.quantity || 1);
                });
            }
        });

        const topProducts = Object.entries(productCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const ratings = delivered.filter(d => d.rating?.stars).map(d => d.rating!.stars);
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 5.0;

        const today = new Date().getDay();
        const todayIndex = today === 0 ? 6 : today - 1;

        return {
            deliveredCount: delivered.length,
            cancelledCount: cancelled.length,
            returnedCount,
            inProgressCount: inProgress.length,
            totalEarnings,
            totalDistance,
            avgRating,
            revenueByDay,
            kmByDay,
            topProducts,
            todayIndex,
            currentStreak: driverData?.metrics?.currentStreak || 0
        };
    }, [myDeliveries, driverData?.metrics]);

    const PerformanceRing = () => {
        const { deliveredCount, cancelledCount, returnedCount } = computedMetrics;
        const total = deliveredCount + cancelledCount + returnedCount || 0.001;
        const successRate = (deliveredCount / total) * 100;

        const size = Dimensions.get('window').width - 120;
        const radius = size / 2;
        const strokeWidth = 15;
        const normalizedRadius = radius - strokeWidth / 2;
        const circumference = normalizedRadius * 2 * Math.PI;
        const strokeDashoffset = circumference - (successRate / 100) * circumference;

        return (
            <View style={[styles.gaugeContainer, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF' }]}>
                <View style={styles.gaugeHeader}>
                    <Trophy size={20} color="#FFB800" />
                    <Text style={[styles.chartTitle, { color: colors.foreground, marginLeft: 10 }]}>{tr('Taux de succès', 'معدل النجاح', 'Success Rate')}</Text>
                </View>
                <View style={{ alignItems: 'center', marginTop: 10 }}>
                    <Svg height={size / 2 + 20} width={size}>
                        <G rotation="-90" origin={`${radius}, ${radius}`}>
                            <CircleSvg
                                cx={radius}
                                cy={radius}
                                r={normalizedRadius}
                                stroke={colors.border}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={`${circumference} ${circumference}`}
                                strokeDashoffset={circumference / 2}
                                strokeLinecap="round"
                            />
                            <CircleSvg
                                cx={radius}
                                cy={radius}
                                r={normalizedRadius}
                                stroke="#10B981"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={`${circumference} ${circumference}`}
                                strokeDashoffset={circumference - (successRate / 100) * (circumference / 2)}
                                strokeLinecap="round"
                            />
                        </G>
                    </Svg>
                    <View style={{ position: 'absolute', bottom: 10, width: '100%', alignItems: 'center' }}>
                        <Text style={{ fontSize: 32, fontWeight: '900', color: colors.foreground }}>{Math.round(successRate)}%</Text>
                        <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '700' }}>{tr('Score Global', 'النتيجة الإجمالية', 'Overall Score')}</Text>
                    </View>
                </View>
            </View>
        );
    };

    const LineChart = () => {
        const points = computedMetrics.revenueByDay.map(v => Math.max(0, Math.min(v * (100 / (Math.max(...computedMetrics.revenueByDay, 1) + 1)), 100)));
        const width = Dimensions.get('window').width - 80;
        const height = 100;

        return (
            <View style={[styles.chartContainer, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF' }]}>
                <View style={styles.chartHeader}>
                    <View>
                        <Text style={[styles.chartTitle, { color: colors.foreground }]}>{tr('Tendance Revenus', 'اتجاه الأرباح', 'Revenue Trend')}</Text>
                        <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>{tr('Semaine actuelle', 'الأسبوع الحالي', 'Current Week')}</Text>
                    </View>
                    <LineChartIcon size={20} color={colors.accent} />
                </View>
                <View style={{ height, width, marginTop: 20 }}>
                    <Svg height="100%" width="100%" viewBox={`0 0 ${width} 100`}>
                        <Defs>
                            <LinearGradientSvg id="grad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={colors.accent} stopOpacity="0.3" />
                                <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
                            </LinearGradientSvg>
                        </Defs>
                        <Path
                            d={`M ${points.map((p, i) => `${(i * (width / (points.length - 1)))} ${100 - p}`).join(' L ')}`}
                            fill="none"
                            stroke={colors.accent}
                            strokeWidth="3"
                        />
                        <Path
                            d={`M 0 100 L ${points.map((p, i) => `${(i * (width / (points.length - 1)))} ${100 - p}`).join(' L ')} L ${width} 100 Z`}
                            fill="url(#grad)"
                        />
                        {points.map((p, i) => (
                            <CircleSvg key={i} cx={(i * (width / (points.length - 1)))} cy={100 - p} r="3" fill={colors.accent} />
                        ))}
                    </Svg>
                </View>
            </View>
        );
    };

    const ActivityBreakdown = () => {
        const { deliveredCount, inProgressCount, cancelledCount, returnedCount } = computedMetrics;
        const total = (deliveredCount || 0) + (inProgressCount || 0) + (cancelledCount || 0) + (returnedCount || 0) || 1;

        const segments = [
            { count: deliveredCount, color: '#10B981', label: tr('Livré', 'تم التوصيل', 'Delivered') },
            { count: inProgressCount, color: '#3B82F6', label: tr('En cours', 'قيد التنفيذ', 'In Progress') },
            { count: returnedCount, color: '#F59E0B', label: tr('Retourné', 'تم الإرجاع', 'Returned') },
            { count: cancelledCount, color: '#EF4444', label: tr('Annulée', 'ملغاة', 'Cancelled') }
        ];

        return (
            <View style={[styles.breakdownCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF', padding: 20 }]}>
                <Text style={[styles.chartTitle, { color: colors.foreground, marginBottom: 20 }]}>
                    {tr('Répartition de l\'activité', 'توزيع النشاط', 'Activity Breakdown')}
                </Text>
                <View style={[styles.multiProgressBar, { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 20 }]}>
                    {segments.map((seg, i) => (
                        <View
                            key={i}
                            style={{
                                flex: (seg.count || 0) + 0.01,
                                backgroundColor: seg.color,
                                height: '100%'
                            }}
                        />
                    ))}
                </View>
                <View style={{ gap: 12 }}>
                    {segments.map((seg, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: seg.color }} />
                                <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>{seg.label}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 14 }}>{seg.count}</Text>
                                <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                                    ({Math.round(((seg.count || 0) / total) * 100)}%)
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const KMHistory = () => {
        const data = computedMetrics.kmByDay;
        const max = Math.max(...data, 10);
        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

        const today = new Date().getDay();
        const todayIndex = today === 0 ? 6 : today - 1;
        const distanceToday = data[todayIndex] || 0;

        return (
            <View style={[styles.chartContainer, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF' }]}>
                <View style={[styles.chartHeader, { marginBottom: 15 }]}>
                    <View>
                        <Text style={[styles.chartTitle, { color: colors.foreground }]}>{tr('Activités (KM)', 'النشاط (كم)', 'Activity (KM)')}</Text>
                        <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>{tr('Aujourd\'hui', 'اليوم', 'Today')}: {distanceToday.toFixed(1)} km</Text>
                    </View>
                    <Activity size={20} color="#8B5CF6" />
                </View>
                <View style={[styles.chartContent, { height: 80 }]}>
                    {data.map((val, i) => (
                        <View key={i} style={styles.chartBarWrapper}>
                            <View style={[styles.chartBarBackground, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                                <View style={[styles.chartBarFill, { height: `${(val / max) * 100}%` as any, backgroundColor: '#8B5CF6' }]} />
                            </View>
                            <Text style={[styles.chartDayText, { color: colors.textMuted }]}>{days[i]}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

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

    useEffect(() => {
        if (!currentLocation || !isOnline || !driverData?.id) return;

        const activeTypes = ['accepted', 'picked_up', 'in_transit'];
        myDeliveries.forEach(delivery => {
            if (activeTypes.includes(delivery.status)) {
                deliveryService.updateDriverLocation(
                    delivery.id,
                    {
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                        heading: (currentLocation as any).heading || 0,
                        speed: (currentLocation as any).speed || 0,
                    },
                    driverData.id,
                    delivery.trackingId
                ).catch(err => console.log('Failed to update tracking location:', err));
            }
        });
    }, [currentLocation, isOnline, driverData?.id]); // Note: leaving myDeliveries out on purpose to avoid re-triggering just on status update, but it's safe if it changes slowly OR we can include it. Actually, letting it be out is fine, it will use the latest state if we use a ref or just let it update when location changes.


    const initDriver = async () => {
        if (!user?.uid) return;

        try {
            const driversQuery = query(
                collection(db, 'drivers'),
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

                const newDriverDoc = await getDoc(doc(db, 'drivers', newDriverId));
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
            await deliveryService.acceptDelivery(
                delivery.id,
                driverData.id,
                driverData.fullName || driverData.name || 'Driver',
                driverData.phone || ''
            );
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

    const handleOpenMap = (delivery: Delivery) => {
        setSelectedDelivery(delivery);
        setShowMap(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#F59E0B';
            case 'accepted': return '#3B82F6';
            case 'in_transit': return '#8B5CF6';
            case 'out_for_delivery': return '#06B6D4';
            case 'delivered': return '#10B981';
            case 'cancelled': return '#EF4444';
            case 'returned': return '#6366F1';
            default: return '#6B7280';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: t('statusPending') || 'Pending',
            accepted: t('statusAccepted') || 'Accepted',
            picked_up: t('statusPickedUp') || 'Picked Up',
            in_transit: t('statusInTransit') || 'In Transit',
            out_for_delivery: t('statusOutForDelivery') || 'Out for Delivery',
            delivered: t('statusDelivered') || 'Delivered',
            cancelled: t('statusCancelled') || 'Cancelled',
            returned: tr('Retourné', 'مرتجع', 'Returned'),
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
                            {item.status === 'pending' || item.status === 'accepted' ? (
                                <>
                                    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{translate('pickupFrom') || 'Pickup From'}</Text>
                                    <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.storeName || item.senderName || 'Store'}</Text>
                                    <Text style={[styles.infoSubValue, { color: colors.textMuted }]}>{item.pickupAddress || item.senderAddress || 'N/A'}</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{translate('deliverTo') || 'Deliver To'}</Text>
                                    <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.receiverName}</Text>
                                    <Text style={[styles.infoSubValue, { color: colors.textMuted }]}>{item.deliveryAddress}</Text>
                                </>
                            )}
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Phone size={20} color={colors.accent} />
                        <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {activeTab === 'available' ? '********' : (item.status === 'pending' || item.status === 'accepted' ? (item.senderPhone || 'N/A') : item.receiverPhone)}
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
                                onPress={() => handleOpenMap(item)}
                            >
                                <Navigation size={18} color={colors.foreground} />
                                <Text style={[styles.actionBtnText, { color: colors.foreground, marginLeft: 6 }]}>
                                    {translate('map')}
                                </Text>
                            </TouchableOpacity>

                            {(item.status === 'accepted' || item.status === 'pending') && (
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

    const StatCard = ({ label, value, icon: Icon, color, trend, style }: any) => (
        <Animated.View
            entering={FadeInDown.delay(200)}
            style={[styles.premiumStatCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF' }, style]}
        >
            <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
                <Icon size={20} color={color} />
            </View>
            <Text style={[styles.statValueText, { color: colors.foreground }]}>{value}</Text>
            <Text style={[styles.statLabelText, { color: colors.textMuted }]}>{label}</Text>
            {trend && (
                <View style={styles.trendContainer}>
                    {trend > 0 ? <ArrowUpRight size={12} color="#10B981" /> : <ArrowDownRight size={12} color="#EF4444" />}
                    <Text style={[styles.trendText, { color: trend > 0 ? '#10B981' : '#EF4444' }]}>
                        {Math.abs(trend)}%
                    </Text>
                </View>
            )}
        </Animated.View>
    );

    const RevenueChart = () => {
        const data = computedMetrics.revenueByDay;
        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        const max = Math.max(...data, 10);

        return (
            <View style={[styles.chartContainer, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF' }]}>
                <View style={styles.chartHeader}>
                    <View>
                        <Text style={[styles.chartTitle, { color: colors.foreground }]}>{tr('Revenu hebdomadaire', 'الأرباح الأسبوعية', 'Weekly Revenue')}</Text>
                        <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>{tr('Total', 'المجموع', 'Total')}: {computedMetrics.totalEarnings.toFixed(2)} TND</Text>
                    </View>
                    <BarChart3 size={20} color={colors.accent} />
                </View>
                <View style={styles.chartContent}>
                    {data.map((val, i) => (
                        <View key={i} style={styles.chartBarWrapper}>
                            <View style={styles.chartBarBackground}>
                                <Animated.View
                                    entering={FadeInDown.delay(i * 100)}
                                    style={[
                                        styles.chartBarFill,
                                        {
                                            height: `${(val / max) * 100}%` as any,
                                            backgroundColor: colors.accent
                                        }
                                    ]}
                                >
                                    <LinearGradient
                                        colors={[colors.accent, colors.accent + '99']}
                                        style={StyleSheet.absoluteFill}
                                    />
                                </Animated.View>
                            </View>
                            <Text style={[styles.chartDayText, { color: colors.textMuted }]}>{days[i]}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderStats = () => {
        const metrics = computedMetrics;

        return (
            <ScrollView
                style={styles.statsContainer}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Stats */}
                <LinearGradient
                    colors={theme === 'dark' ? ['#2C2C2E', '#1C1C1E'] : ['#F9F9FB', '#FFFFFF']}
                    style={styles.mainEarningsCard}
                >
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF2D55' }} />
                            <Text style={[styles.totalEarningsLabel, { color: colors.textMuted, marginBottom: 0 }]}>
                                {tr('Total cumulé', 'المجموع التراكمي', 'Total Earnings')} (LIVE)
                            </Text>
                        </View>
                        <Text style={[styles.totalEarningsValue, { color: colors.foreground }]}>
                            {metrics.totalEarnings.toFixed(2)} <Text style={{ fontSize: 18 }}>TND</Text>
                        </Text>
                    </View>
                    <View style={styles.streakBadge}>
                        <Flame size={16} color="#FF6B00" />
                        <Text style={styles.streakText}>{metrics.currentStreak} {tr('Jours', 'أيام', 'Days')}</Text>
                    </View>
                </LinearGradient>

                {/* Performance Summary Grid */}
                <View style={styles.newStatsGrid}>
                    <StatCard
                        label={tr('Livraisons', 'التوصيلات', 'Deliveries')}
                        value={metrics.deliveredCount}
                        icon={PackageCheck}
                        color="#10B981"
                    />
                    <StatCard
                        label={tr('Retournés', 'المرجعات', 'Returns')}
                        value={metrics.returnedCount}
                        icon={RotateCcw}
                        color="#F59E0B"
                    />
                    <StatCard
                        label={tr('Annulée', 'ملغاة', 'Cancelled')}
                        value={metrics.cancelledCount}
                        icon={X}
                        color="#EF4444"
                    />
                    <StatCard
                        label={tr('KM aujourd\'hui', 'كم اليوم', 'Daily KM')}
                        value={`${metrics.kmByDay[metrics.todayIndex].toFixed(1)} km`}
                        icon={Route}
                        color="#8B5CF6"
                    />
                    <StatCard
                        label={tr('Note', 'تقييم', 'Rating')}
                        value={metrics.avgRating.toFixed(1)}
                        icon={Star}
                        color="#FAB005"
                        style={{ width: '100%' }}
                    />
                </View>

                {/* Success Rate Gauge */}
                <PerformanceRing />

                {/* Top Products Analytics */}
                <View style={[styles.chartContainer, { marginTop: 10, backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF' }]}>
                    <View style={styles.chartHeader}>
                        <View>
                            <Text style={[styles.chartTitle, { color: colors.foreground }]}>{tr('Produits les plus livrés', 'المنتجات الأكثر توصيلاً', 'Top Products Delivered')}</Text>
                            <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>{tr('Top 5 articles', 'أعلى 5 منتجات', 'Top 5 items')}</Text>
                        </View>
                        <ShoppingBag size={20} color="#3B82F6" />
                    </View>
                    <View style={{ marginTop: 10, gap: 15 }}>
                        {metrics.topProducts.map((p, i) => {
                            const maxCount = metrics.topProducts[0].count;
                            return (
                                <View key={i}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13, flex: 1 }} numberOfLines={1}>{p.name}</Text>
                                        <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 13 }}>{p.count}</Text>
                                    </View>
                                    <View style={{ height: 6, backgroundColor: colors.border + '30', borderRadius: 3, overflow: 'hidden' }}>
                                        <View style={{ height: '100%', width: `${(p.count / maxCount) * 100}%`, backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i % 5], borderRadius: 3 }} />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                    {metrics.topProducts.length === 0 && (
                        <Text style={{ textAlign: 'center', color: colors.textMuted, marginVertical: 10, fontSize: 13 }}>{tr('Aucune donnée', 'لا توجد بيانات', 'No data available yet')}</Text>
                    )}
                </View>

                {/* Line Chart for Trends */}
                <LineChart />

                {/* Activity Visualizer (KM) */}
                <KMHistory />

                {/* Success Rate Breakdown */}
                <ActivityBreakdown />

                {/* Daily Revenue (Bar Chart) */}
                <RevenueChart />

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
                    !['delivered', 'cancelled', 'returned'].includes(d.status)
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

            <Modal visible={showMap} animationType="slide">
                <View style={{ flex: 1, backgroundColor: '#000' }}>
                    <MapView
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                        style={StyleSheet.absoluteFill}
                        customMapStyle={theme === 'dark' ? mapStyle : undefined}
                        initialRegion={{
                            latitude: currentLocation?.latitude || selectedDelivery?.pickupLatitude || selectedDelivery?.deliveryLatitude || 35.8256,
                            longitude: currentLocation?.longitude || selectedDelivery?.pickupLongitude || selectedDelivery?.deliveryLongitude || 10.6369,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                    >
                        {/* Pickup/Merchant Location */}
                        {(selectedDelivery?.status === 'accepted' || selectedDelivery?.status === 'pending') && selectedDelivery?.pickupLatitude && (
                            <Marker coordinate={{ latitude: selectedDelivery.pickupLatitude, longitude: selectedDelivery.pickupLongitude }} title={translate('pickupLocation') || 'Pickup Location'}>
                                <View style={[styles.driverMarker, { backgroundColor: '#F59E0B' }]}>
                                    <MapPin size={20} color="#FFF" />
                                </View>
                            </Marker>
                        )}

                        {/* Driver Location */}
                        {currentLocation && (
                            <Marker coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }} title="You">
                                <Animatable.View animation={(selectedDelivery?.status === 'in_transit' || selectedDelivery?.status === 'out_for_delivery') ? 'pulse' : 'bounce'} iterationCount="infinite" style={styles.driverMarker}>
                                    <Truck size={20} color="#FFF" />
                                </Animatable.View>
                            </Marker>
                        )}

                        {/* Delivery Location */}
                        {selectedDelivery?.deliveryLatitude && (
                            <Marker coordinate={{ latitude: selectedDelivery.deliveryLatitude, longitude: selectedDelivery.deliveryLongitude }} title="Destination">
                                <View style={[styles.driverMarker, { backgroundColor: selectedDelivery.status === 'delivered' ? '#10B981' : '#6366F1' }]}>
                                    <Package size={20} color="#FFF" />
                                </View>
                            </Marker>
                        )}

                        {/* Route: From driver to delivery when in transit */}
                        {(selectedDelivery?.status === 'in_transit' || selectedDelivery?.status === 'out_for_delivery') && currentLocation && selectedDelivery.deliveryLatitude && (
                            <Polyline
                                coordinates={[currentLocation, { latitude: selectedDelivery.deliveryLatitude, longitude: selectedDelivery.deliveryLongitude }]}
                                strokeColor={selectedDelivery.status === 'out_for_delivery' ? '#10B981' : '#3B82F6'}
                                strokeWidth={4}
                                lineDashPattern={selectedDelivery.status === 'out_for_delivery' ? undefined : [10, 10]}
                            />
                        )}

                        {/* Route: From driver to pickup when at pickup phase */}
                        {selectedDelivery?.status === 'accepted' && currentLocation && selectedDelivery.pickupLatitude && (
                            <Polyline
                                coordinates={[currentLocation, { latitude: selectedDelivery.pickupLatitude, longitude: selectedDelivery.pickupLongitude }]}
                                strokeColor="#F59E0B"
                                strokeWidth={3}
                                lineDashPattern={[6, 3]}
                            />
                        )}
                    </MapView>

                    <BlurView intensity={80} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.mapHeader}>
                        <TouchableOpacity onPress={() => setShowMap(false)} style={[styles.closeMapBtn, { backgroundColor: isBusy ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.2)' }]}>
                            <X color={theme === 'dark' ? '#FFF' : '#000'} size={24} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.mapTitle, { color: theme === 'dark' ? '#FFF' : '#000' }]}>{translate('deliveryDetails') || 'Delivery Map'}</Text>
                            <Text style={[styles.mapSubTitle, { color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)' }]}>{selectedDelivery?.status === 'accepted' ? (selectedDelivery.pickupAddress || selectedDelivery.senderAddress) : selectedDelivery?.deliveryAddress}</Text>
                        </View>
                    </BlurView>
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
        paddingHorizontal: 20,
    },
    mainEarningsCard: {
        borderRadius: 24,
        padding: 24,
        marginTop: 20,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    totalEarningsLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    totalEarningsValue: {
        fontSize: 32,
        fontWeight: '900',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFE5D3',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
    },
    streakText: {
        color: '#FF6B00',
        fontSize: 12,
        fontWeight: '800',
    },
    newStatsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    premiumStatCard: {
        width: (Dimensions.get('window').width - 52) / 2,
        borderRadius: 20,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValueText: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 4,
    },
    statLabelText: {
        fontSize: 12,
        fontWeight: '700',
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    trendText: {
        fontSize: 10,
        fontWeight: '800',
    },
    chartContainer: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
    },
    chartSubtitle: {
        fontSize: 12,
        fontWeight: '600',
    },
    chartContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
        paddingTop: 10,
    },
    chartBarWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    chartBarBackground: {
        width: 12,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 6,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    chartBarFill: {
        width: '100%',
        borderRadius: 6,
    },
    chartDayText: {
        marginTop: 8,
        fontSize: 10,
        fontWeight: '700',
    },
    targetCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    targetTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 16,
    },
    targetProgressWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    targetProgressBar: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    targetProgressFill: {
        height: '100%',
        borderRadius: 4,
    },
    targetPercent: {
        fontSize: 14,
        fontWeight: '900',
    },
    targetSub: {
        fontSize: 12,
        fontWeight: '600',
    },
    breakdownCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    multiProgressBar: {
        height: 12,
        flexDirection: 'row',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 15,
    },
    progressSegment: {
        height: '100%',
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 10,
        fontWeight: '700',
    },
    mapHeader: { position: 'absolute', top: 0, left: 0, right: 0, padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center', gap: 15 },
    closeMapBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    mapTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    mapSubTitle: { fontSize: 13, fontWeight: '600' },
    gaugeContainer: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    gaugeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 10,
    },
    driverMarker: { width: 44, height: 44, backgroundColor: '#3B82F6', borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }
});
