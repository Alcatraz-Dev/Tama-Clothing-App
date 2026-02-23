import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Animated,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShoppingCart, Package, Users as UsersIcon, Image as ImageIcon, ChevronLeft } from 'lucide-react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import { BlurView, AdminHeader } from '../../components/admin/AdminUI';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

interface StatCardProps {
    label: string;
    value: string;
    icon: any;
    color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';

    return (
        <View style={[
            sc.statCard,
            {
                backgroundColor: isDark ? '#111118' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
            }
        ]}>
            <View style={[sc.statIconBox, { backgroundColor: color + (isDark ? '20' : '14') }]}>
                <Icon size={22} color={color} strokeWidth={1.7} />
            </View>
            <Text style={[sc.statValue, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
            <Text style={[sc.statLabel, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
            {/* Accent dot */}
            <View style={[sc.accentDot, { backgroundColor: color }]} />
        </View>
    );
}

export default function AdminDashboardScreen({ onBack, t, profileData, language }: any) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';
    const [stats, setStats] = useState({ sales: 0, orders: 0, customers: 0, products: 0 });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollY = useRef(new Animated.Value(0)).current;

    const fetchDashboardData = async () => {
        try {
            const isBrandOwner = profileData?.role === 'brand_owner';
            const myBrandId = profileData?.brandId;

            const [ordersSnap, usersSnap, productsSnap] = await Promise.all([
                getDocs(collection(db, 'orders')),
                getDocs(collection(db, 'users')),
                getDocs(collection(db, 'products')),
            ]);

            const ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            let totalSales = 0;
            let orderCount = ordersData.length;

            ordersData.forEach((o: any) => {
                if (isBrandOwner && myBrandId) {
                    const brandItems = (o.items || []).filter((i: any) => i.brandId === myBrandId);
                    if (brandItems.length > 0) {
                        const brandTotal = brandItems.reduce((sum: number, item: any) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                        totalSales += brandTotal;
                    }
                } else {
                    totalSales += (o.total || 0);
                }
            });

            if (isBrandOwner && myBrandId) {
                orderCount = ordersData.filter((o: any) => (o.items || []).some((i: any) => i.brandId === myBrandId)).length;
            }

            const customerCount = usersSnap.docs.length;
            let productsCount = productsSnap.docs.length;

            if (isBrandOwner && myBrandId) {
                productsCount = productsSnap.docs.filter(d => d.data().brandId === myBrandId).length;
            }

            setStats({ sales: totalSales, orders: orderCount, customers: customerCount, products: productsCount });

            let validOrders = ordersData.filter((o: any) => o.createdAt && typeof o.createdAt.seconds === 'number');
            if (isBrandOwner && myBrandId) {
                validOrders = validOrders.filter((o: any) => (o.items || []).some((i: any) => i.brandId === myBrandId));
            }

            const sortedOrders = validOrders.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5);
            setRecentOrders(sortedOrders);

        } catch (err) {
            console.log('Dashboard Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: any) => {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'pending': return '#FF9500';
            case 'processing': return '#5856D6';
            case 'shipped': return '#007AFF';
            case 'delivered': return '#34C759';
            case 'cancelled': return '#FF3B30';
            default: return '#8E8E93';
        }
    };

    const getStatusLabel = (status: string) => {
        switch ((status || '').toLowerCase()) {
            case 'pending': return t('statusPending');
            case 'delivered': return t('statusDelivered');
            case 'shipped': return t('statusShipped');
            case 'cancelled': return t('statusCancelled');
            case 'processing': return t('statusProcessing');
            default: return status;
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);
    const iconColor = theme === 'dark' ? '#FFF' : '#000';
    return (
        <View style={[sc.root, { backgroundColor: colors.background }]}>

            <AdminHeader title={t('dashboard')} onBack={onBack} />

            <Animated.ScrollView
                contentContainerStyle={[sc.scrollContent, { paddingTop: insets.top + 80 }]}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
            >
                {loading ? <ActivityIndicator size="large" color={colors.foreground} style={{ marginTop: 100 }} /> : (
                    <>
                        {profileData?.role === 'brand_owner' && (
                            <View style={[
                                sc.brandBanner,
                                {
                                    backgroundColor: isDark ? '#111118' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
                                }
                            ]}>
                                <View style={sc.brandBannerContent}>
                                    <View>
                                        <Text style={[sc.brandName, { color: colors.foreground }]}>{profileData.brandName?.toUpperCase() || t('brandOwner')}</Text>
                                        <Text style={[sc.brandRole, { color: colors.textMuted }]}>{t('brandOwner').toUpperCase()} {t('access').toUpperCase()}</Text>
                                    </View>
                                    <View style={[sc.badgeRole, { backgroundColor: 'rgba(52, 199, 89, 0.15)' }]}>
                                        <Text style={[sc.badgeRoleText, { color: '#34C759' }]}>VERIFIED</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        <View style={sc.statsGrid}>
                            <StatCard label={t('totalSales')} value={`${stats.sales.toFixed(2)} TND`} icon={ShoppingCart} color="#34C759" />
                            <StatCard label={t('orders')} value={stats.orders.toString()} icon={Package} color="#5856D6" />
                            {profileData?.role !== 'brand_owner' && (
                                <StatCard label={t('clients')} value={stats.customers.toString()} icon={UsersIcon} color="#007AFF" />
                            )}
                            <StatCard label={t('products')} value={stats.products.toString()} icon={ImageIcon} color="#FF2D55" />
                        </View>

                        {recentOrders.length > 0 && (
                            <Text style={[sc.sectionTitle, { color: colors.foreground }]}>{t('recentOrders').toUpperCase()}</Text>
                        )}

                        {recentOrders.map(order => (
                            <View
                                key={order.id}
                                style={[
                                    sc.orderCard,
                                    {
                                        backgroundColor: isDark ? '#111118' : '#FFFFFF',
                                        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
                                    }
                                ]}
                            >
                                <View style={sc.orderRow}>
                                    <Text style={[sc.orderId, { color: colors.foreground }]}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                                    <Text style={[sc.orderTotal, { color: colors.foreground }]}>{order.total.toFixed(2)} TND</Text>
                                </View>
                                <View style={sc.orderRow}>
                                    <View style={[sc.statusTag, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                                        <Text style={[sc.statusText, { color: getStatusColor(order.status) }]}>{getStatusLabel(order.status).toUpperCase()}</Text>
                                    </View>
                                    <Text style={[sc.orderDate, { color: colors.textMuted }]}>
                                        {new Date(order.createdAt?.seconds * 1000).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR')}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </Animated.ScrollView>
        </View>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    header: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 4 },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
    backBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    separator: { height: StyleSheet.hairlineWidth },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
        paddingBottom: 100,
    },
    // Banner
    brandBanner: {
        padding: 18,
        borderRadius: 22,
        borderWidth: 1,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    brandBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    brandName: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    brandRole: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    badgeRole: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    badgeRoleText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.6,
    },
    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32
    },
    statCard: {
        width: CARD_WIDTH,
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 3,
        minHeight: 130, // Taller card for premium feel
    },
    statIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.3,
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.6,
        marginTop: 6,
        textAlign: 'center',
    },
    accentDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 6,
        height: 6,
        borderRadius: 3,
        opacity: 0.7,
    },
    // Orders list
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4,
    },
    orderCard: {
        padding: 18,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    orderId: {
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 0.2,
    },
    orderTotal: {
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 0.2,
    },
    orderDate: {
        fontSize: 11,
        fontWeight: '600',
    },
    statusTag: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.6,
    },
});
