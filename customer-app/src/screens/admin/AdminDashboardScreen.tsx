import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    ShoppingCart,
    Package,
    Users as UsersIcon,
    Image as ImageIcon,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import { AdminHeader } from '../../components/admin/AdminHeader';

const { width } = Dimensions.get('window');

interface StatCardProps {
    label: string;
    value: string;
    icon: any;
    color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
    const { colors, theme } = useAppTheme();
    const iconColor = color || colors.foreground;
    const bgColor = theme === 'dark'
        ? (color ? color + '15' : 'rgba(255,255,255,0.05)')
        : (color ? color + '10' : 'rgba(0,0,0,0.02)');

    return (
        <View style={[sc.statCard, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border }]}>
            <View style={[sc.statIconBox, { backgroundColor: bgColor }]}>
                <Icon size={20} color={iconColor} strokeWidth={1.8} />
            </View>
            <Text style={[sc.statValue, { color: colors.foreground }]}>{value}</Text>
            <Text style={[sc.statLabel, { color: colors.textMuted }]}>{label}</Text>
        </View>
    );
}

export default function AdminDashboardScreen({ onBack, t, profileData, language }: any) {
    const { colors, theme } = useAppTheme();
    const [stats, setStats] = useState({ sales: 0, orders: 0, customers: 0, products: 0 });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchDashboardData();
    }, [profileData]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const isBrandOwner = profileData?.role === 'brand_owner';
            const myBrandId = profileData?.brandId;

            const ordersSnap = await getDocs(collection(db, 'orders'));
            let totalSales = 0;
            let orderCount = 0;
            const ordersData = ordersSnap.docs.map(d => {
                const data = d.data();
                let orderTotal = 0;

                if (isBrandOwner && myBrandId) {
                    const myItems = (data.items || []).filter((item: any) => item.brandId === myBrandId);
                    if (myItems.length > 0) {
                        orderTotal = myItems.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
                        totalSales += orderTotal;
                        orderCount++;
                        return { id: d.id, ...data, total: orderTotal, isMyBrand: true };
                    }
                    return null;
                } else {
                    orderTotal = typeof data.total === 'number' ? data.total : (parseFloat(data.total) || 0);
                    totalSales += orderTotal;
                    orderCount++;
                    return { id: d.id, ...data, total: orderTotal };
                }
            }).filter(o => o !== null);

            const usersSnap = await getDocs(collection(db, 'users'));
            const customerCount = usersSnap.docs.filter(d => d.data().role !== 'admin').length;

            const productsSnap = await getDocs(collection(db, 'products'));
            let productsCount = productsSnap.size;
            if (isBrandOwner && myBrandId) {
                productsCount = productsSnap.docs.filter(d => d.data().brandId === myBrandId).length;
            }

            setStats({ sales: totalSales, orders: orderCount, customers: customerCount, products: productsCount });

            const validOrders = ordersData.filter((o: any) => o.createdAt && typeof o.createdAt.seconds === 'number');
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

    return (
        <SafeAreaView style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader title={t('dashboard').toUpperCase()} onBack={onBack} scrollY={scrollY} />

            <Animated.ScrollView
                contentContainerStyle={sc.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
            >
                {loading ? <ActivityIndicator size="large" color={colors.foreground} style={{ marginTop: 100 }} /> : (
                    <>
                        {profileData?.role === 'brand_owner' && (
                            <View style={[sc.brandBanner, { backgroundColor: theme === 'dark' ? '#17171F' : '#F2F2F7' }]}>
                                <Text style={[sc.brandName, { color: colors.foreground }]}>{profileData.brandName?.toUpperCase() || t('brandOwner')}</Text>
                                <Text style={[sc.brandRole, { color: colors.textMuted }]}>{t('brandOwner').toUpperCase()} {t('access').toUpperCase()}</Text>
                            </View>
                        )}

                        <View style={sc.statsGrid}>
                            <StatCard label={t('totalSales').toUpperCase()} value={`${stats.sales.toFixed(2)} TND`} icon={ShoppingCart} color="#34C759" />
                            <StatCard label={t('orders').toUpperCase()} value={stats.orders.toString()} icon={Package} color="#5856D6" />
                            {profileData?.role !== 'brand_owner' && (
                                <StatCard label={t('clients').toUpperCase()} value={stats.customers.toString()} icon={UsersIcon} color="#007AFF" />
                            )}
                            <StatCard label={t('products').toUpperCase()} value={stats.products.toString()} icon={ImageIcon} color="#FF2D55" />
                        </View>

                        <Text style={[sc.sectionTitle, { color: colors.foreground }]}>{t('recentOrders').toUpperCase()}</Text>
                        {recentOrders.map(order => (
                            <View key={order.id} style={[sc.orderCard, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border }]}>
                                <View style={sc.orderRow}>
                                    <Text style={[sc.orderId, { color: colors.foreground }]}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                                    <Text style={[sc.orderTotal, { color: colors.foreground }]}>{order.total.toFixed(2)} TND</Text>
                                </View>
                                <View style={sc.orderRow}>
                                    <Text style={[sc.orderDate, { color: colors.textMuted }]}>
                                        {new Date(order.createdAt?.seconds * 1000).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR')}
                                    </Text>
                                    <View style={[sc.statusTag, { backgroundColor: getStatusColor(order.status) }]}>
                                        <Text style={sc.statusText}>{getStatusLabel(order.status).toUpperCase()}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    scrollContent: { padding: 20 },
    brandBanner: { padding: 15, borderRadius: 12, marginBottom: 20 },
    brandName: { fontWeight: '800' },
    brandRole: { fontSize: 11, marginTop: 2 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
    statCard: { width: (width - 52) / 2, padding: 16, borderRadius: 20, borderWidth: 1 },
    statIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    statValue: { fontSize: 16, fontWeight: '800' },
    statLabel: { fontSize: 9, fontWeight: '700', marginTop: 4 },
    sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 15 },
    orderCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    orderId: { fontWeight: '800', fontSize: 13 },
    orderTotal: { fontWeight: '700', fontSize: 13 },
    orderDate: { fontSize: 12 },
    statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { color: 'white', fontSize: 9, fontWeight: '900' },
});
