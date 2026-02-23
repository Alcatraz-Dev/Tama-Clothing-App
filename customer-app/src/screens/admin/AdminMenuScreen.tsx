import React, { useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
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
    ChevronLeft,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { AdminHeader } from '../../components/admin/AdminUI';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2; // 2 columns with 20px side padding + 12px gap

interface AdminMenuScreenProps {
    onBack: () => void;
    onNavigate: (route: string) => void;
    profileData: any;
    t: any;
}

type MenuItem = {
    label: string;
    icon: any;
    route: string;
    roles: string[];
    color: string;
};

export default function AdminMenuScreen({ onBack, onNavigate, profileData, t }: AdminMenuScreenProps) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const scrollY = useRef(new Animated.Value(0)).current;
    const isDark = theme === 'dark';
    const role = profileData?.role || 'admin';

    const menuItems: MenuItem[] = [
        { label: t('dashboard'), icon: LayoutDashboard, route: 'AdminDashboard', roles: ['admin', 'support', 'brand_owner'], color: '#5856D6' },
        { label: t('products'), icon: Package, route: 'AdminProducts', roles: ['admin', 'brand_owner'], color: '#FF2D55' },
        { label: t('orders'), icon: ShoppingCart, route: 'AdminOrders', roles: ['admin', 'support', 'brand_owner'], color: '#34C759' },
        { label: t('clients'), icon: UsersIcon, route: 'AdminUsers', roles: ['admin', 'support'], color: '#5AC8FA' },
        { label: t('categories'), icon: ListTree, route: 'AdminCategories', roles: ['admin'], color: '#AF52DE' },
        { label: t('brands'), icon: Shield, route: 'AdminBrands', roles: ['admin'], color: '#007AFF' },
        { label: t('shipments'), icon: Truck, route: 'AdminShipments', roles: ['admin', 'support'], color: '#FF9500' },
        { label: t('collaborations'), icon: Handshake, route: 'AdminCollaboration', roles: ['admin'], color: '#FF9500' },
        { label: t('banners'), icon: ImageIcon, route: 'AdminBanners', roles: ['admin', 'brand_owner'], color: '#0EA5E9' },
        { label: t('adsCampaigns'), icon: Megaphone, route: 'AdminAds', roles: ['admin', 'brand_owner'], color: '#FF3B30' },
        { label: t('coupons'), icon: Ticket, route: 'AdminCoupons', roles: ['admin', 'brand_owner'], color: '#FF2D55' },
        { label: t('flashSale'), icon: Zap, route: 'AdminFlashSale', roles: ['admin', 'brand_owner'], color: '#FFCC00' },
        { label: t('promoBanners'), icon: Ticket, route: 'AdminPromoBanners', roles: ['admin', 'brand_owner'], color: '#EC4899' },
        { label: t('support'), icon: MessageCircle, route: 'AdminSupportList', roles: ['admin', 'support'], color: '#5856D6' },
        { label: t('identityVerification'), icon: ShieldCheck, route: 'AdminKYC', roles: ['admin'], color: '#34C759' },
        { label: t('broadcast'), icon: Bell, route: 'AdminNotifications', roles: ['admin'], color: '#FF3B30' },
        { label: t('settings'), icon: Settings, route: 'AdminSettings', roles: ['admin'], color: '#8E8E93' },
    ].filter(item => item.roles.includes(role));
    const iconColor = theme === 'dark' ? '#FFF' : '#000';
    return (
        <View style={[sc.root, { backgroundColor: colors.background }]}>

            <AdminHeader title={t('adminConsole')} onBack={onBack} />

            <Animated.ScrollView
                contentContainerStyle={[sc.scrollContent, { paddingTop: insets.top + 80 }]}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <View style={sc.grid}>
                    {menuItems.map((item, index) => {
                        const isHighlighted = index === 0; // Dashboard gets a featured card
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    sc.card,
                                    {
                                        backgroundColor: isDark ? '#111118' : '#FFFFFF',
                                        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                                    },
                                ]}
                                onPress={() => onNavigate(item.route)}
                                activeOpacity={0.75}
                            >
                                {/* Icon container */}
                                <View style={[
                                    sc.iconBox,
                                    {
                                        backgroundColor: item.color + (isDark ? '20' : '14'),
                                    }
                                ]}>
                                    <item.icon size={22} color={item.color} strokeWidth={1.7} />
                                </View>

                                {/* Label */}
                                <Text
                                    style={[sc.label, { color: colors.foreground }]}
                                    numberOfLines={2}
                                >
                                    {item.label.toUpperCase()}
                                </Text>

                                {/* Accent dot */}
                                <View style={[sc.accentDot, { backgroundColor: item.color }]} />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </Animated.ScrollView>
        </View>
    );
}

const sc = StyleSheet.create({
    root: {
        flex: 1,
    },
    // ── Analytics-style header ──────────────────────────────────────────
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 4,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        flexShrink: 0,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        marginHorizontal: 0,
    },
    // ─────────────────────────────────────────────────────────────────────
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        width: CARD_WIDTH,
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 3,
        minHeight: 105,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 11,
    },
    label: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.6,
        textAlign: 'center',
        lineHeight: 13,
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
});
