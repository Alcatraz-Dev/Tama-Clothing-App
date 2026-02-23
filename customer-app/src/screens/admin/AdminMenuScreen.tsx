import React, { useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import {
    ChevronLeft,
    LayoutDashboard,
    Package,
    ListTree,
    Shield,
    ShoppingCart,
    Truck,
    Handshake,
    Users as UsersIcon,
    Image as ImageIcon,
    Megaphone,
    Ticket,
    Zap,
    MessageCircle,
    ShieldCheck,
    Bell,
    Settings,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../../context/ThemeContext';
import { AdminHeader } from '../../components/admin/AdminHeader';

const { width } = Dimensions.get('window');

interface AdminMenuScreenProps {
    onBack: () => void;
    onNavigate: (route: string) => void;
    profileData: any;
    t: any;
}

export default function AdminMenuScreen({ onBack, onNavigate, profileData, t }: AdminMenuScreenProps) {
    const { colors, theme } = useAppTheme();
    const scrollY = useRef(new Animated.Value(0)).current;

    const role = profileData?.role || 'admin';

    const menuItems = [
        { label: t('dashboard').toUpperCase(), icon: LayoutDashboard, route: 'AdminDashboard', roles: ['admin', 'support', 'brand_owner'], color: '#5856D6' },
        { label: t('products').toUpperCase(), icon: Package, route: 'AdminProducts', roles: ['admin', 'brand_owner'], color: '#FF2D55' },
        { label: t('categories').toUpperCase(), icon: ListTree, route: 'AdminCategories', roles: ['admin'], color: '#AF52DE' },
        { label: t('brands').toUpperCase(), icon: Shield, route: 'AdminBrands', roles: ['admin'], color: '#007AFF' },
        { label: t('orders').toUpperCase(), icon: ShoppingCart, route: 'AdminOrders', roles: ['admin', 'support', 'brand_owner'], color: '#34C759' },
        { label: t('shipments').toUpperCase(), icon: Truck, route: 'AdminShipments', roles: ['admin', 'support'], color: '#FF9500' },
        { label: t('collaborations').toUpperCase(), icon: Handshake, route: 'AdminCollaboration', roles: ['admin'], color: '#FF9500' },
        { label: t('clients').toUpperCase(), icon: UsersIcon, route: 'AdminUsers', roles: ['admin', 'support'], color: '#5AC8FA' },
        { label: t('banners').toUpperCase(), icon: ImageIcon, route: 'AdminBanners', roles: ['admin', 'brand_owner'], color: '#FF9500' },
        { label: t('adsPromo').toUpperCase(), icon: Megaphone, route: 'AdminAds', roles: ['admin', 'brand_owner'], color: '#FF3B30' },
        { label: t('coupons').toUpperCase(), icon: Ticket, route: 'AdminCoupons', roles: ['admin', 'brand_owner'], color: '#FF2D55' },
        { label: t('flashSale').toUpperCase(), icon: Zap, route: 'AdminFlashSale', roles: ['admin', 'brand_owner'], color: '#FFCC00' },
        { label: t('promotions').toUpperCase(), icon: Ticket, route: 'AdminPromoBanners', roles: ['admin', 'brand_owner'], color: '#FF2D55' },
        { label: t('support').toUpperCase(), icon: MessageCircle, route: 'AdminSupportList', roles: ['admin', 'support'], color: '#5856D6' },
        { label: t('identityVerification').toUpperCase(), icon: ShieldCheck, route: 'AdminKYC', roles: ['admin'], color: '#34C759' },
        { label: t('broadcast').toUpperCase(), icon: Bell, route: 'AdminNotifications', roles: ['admin'], color: '#FF3B30' },
        { label: t('settings').toUpperCase(), icon: Settings, route: 'AdminSettings', roles: ['admin'], color: '#8E8E93' },
    ].filter(item => item.roles.includes(role));

    return (
        <View style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader title={t('adminConsole').toUpperCase()} onBack={onBack} scrollY={scrollY} />

            <Animated.ScrollView
                contentContainerStyle={sc.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <View style={sc.grid}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[sc.card, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border }]}
                            onPress={() => onNavigate(item.route)}
                            activeOpacity={0.8}
                        >
                            <View style={[sc.iconBox, { backgroundColor: item.color + (theme === 'dark' ? '15' : '10') }]}>
                                <item.icon size={24} color={item.color} strokeWidth={1.5} />
                            </View>
                            <Text style={[sc.label, { color: colors.foreground }]}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Animated.ScrollView>
        </View>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 100 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: {
        width: (width - 52) / 2,
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    iconBox: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    label: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
});
