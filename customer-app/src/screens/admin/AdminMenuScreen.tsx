import React, { useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    Store,
    Trophy,
    Play,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { AdminHeader } from '../../components/admin/AdminUI';
import { hasFeature, FeatureName, VendorTier, AccountType } from '../../utils/planAccessControl';
import { Lock } from 'lucide-react-native';

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
    feature?: FeatureName;
};

export default function AdminMenuScreen({ onBack, onNavigate, profileData, t }: AdminMenuScreenProps) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const scrollY = useRef(new Animated.Value(0)).current;
    const isDark = theme === 'dark';
    const role = profileData?.role || 'admin';

    const resetOnboarding = async () => {
        try {
            // Clear the onboarding flag
            await AsyncStorage.removeItem('bey3a_onboarding_seen');
            await AsyncStorage.clear(); // Clear all storage for testing purposes
            
            Alert.alert(
                'Onboarding Reset!',
                'Storage cleared. Please restart the app to see the onboarding screens.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error resetting onboarding:', error);
        }
    };

    const menuItems: MenuItem[] = [
        { label: t('dashboard'), icon: LayoutDashboard, route: 'AdminDashboard', roles: ['admin', 'support', 'brand_owner', 'nor_kam', 'partner'], color: '#5856D6' },
        { label: t('products'), icon: Package, route: 'AdminProducts', roles: ['admin', 'brand_owner', 'nor_kam', 'editor'], color: '#FF2D55', feature: 'products' },
        { label: t('orders'), icon: ShoppingCart, route: 'AdminOrders', roles: ['admin', 'support', 'brand_owner', 'nor_kam'], color: '#34C759' },
        { label: t('brandRevenue'), icon: Ticket, route: 'BrandRevenue', roles: ['admin', 'brand_owner'], color: '#EC4899', feature: 'brandRevenue' },
        { label: t('clients'), icon: UsersIcon, route: 'AdminUsers', roles: ['admin', 'support'], color: '#5AC8FA' },
        { label: t('categories'), icon: ListTree, route: 'AdminCategories', roles: ['admin', 'nor_kam'], color: '#AF52DE' },
        { label: t('brands'), icon: Shield, route: 'AdminBrands', roles: ['admin'], color: '#007AFF' },
        { label: t('shipments'), icon: Truck, route: 'AdminShipments', roles: ['admin', 'support'], color: '#FF9500' },
        { label: t('collaborations'), icon: Handshake, route: 'AdminCollaboration', roles: ['admin'], color: '#FF9500' },
        { label: t('banners'), icon: ImageIcon, route: 'AdminBanners', roles: ['admin', 'brand_owner', 'nor_kam', 'editor'], color: '#0EA5E9', feature: 'banners' },
        { label: t('adsCampaigns'), icon: Megaphone, route: 'AdminAds', roles: ['admin', 'brand_owner', 'nor_kam', 'editor'], color: '#FF3B30', feature: 'marketing' },
        { label: t('coupons'), icon: Ticket, route: 'AdminCoupons', roles: ['admin', 'brand_owner', 'nor_kam', 'editor'], color: '#FF2D55', feature: 'marketing' },
        { label: t('flashSale'), icon: Zap, route: 'AdminFlashSale', roles: ['admin', 'brand_owner', 'nor_kam', 'editor'], color: '#FFCC00', feature: 'marketing' },
        { label: t('treasureHunt'), icon: Trophy, route: 'AdminTreasureHunt', roles: ['admin', 'brand_owner'], color: '#FF6B6B', feature: 'treasureHunt' },
        { label: t('promoBanners'), icon: Ticket, route: 'AdminPromoBanners', roles: ['admin', 'brand_owner', 'nor_kam', 'editor'], color: '#EC4899', feature: 'banners' },
        { label: t('ourSelection'), icon: ListTree, route: 'AdminNotreSelection', roles: ['admin', 'nor_kam', 'editor'], color: '#10B981' },
        { label: t('support'), icon: MessageCircle, route: 'AdminSupportList', roles: ['admin', 'support'], color: '#5856D6' },
        { label: t('identityVerification'), icon: ShieldCheck, route: 'AdminKYC', roles: ['admin'], color: '#34C759' },
        { label: t('vendorApplications'), icon: Store, route: 'AdminVendorApplications', roles: ['admin'], color: '#6C63FF' },
        { label: t('broadcast'), icon: Bell, route: 'AdminNotifications', roles: ['admin', 'brand_owner'], color: '#FF3B30', feature: 'notifications' },
        { label: t('deliveryCompanies'), icon: Truck, route: 'AdminDeliveryCompanies', roles: ['admin'], color: '#F59E0B' },
        { label: t('platformRevenue'), icon: Ticket, route: 'AdminFinanceDashboard', roles: ['admin'], color: '#10B981' },
        { label: t('settings'), icon: Settings, route: 'AdminSettings', roles: ['admin'], color: '#8E8E93' },
    ];

    const isFeatureLocked = (item: MenuItem) => {
        if (role !== 'brand_owner') return false;
        if (!item.feature) return false;
        
        const tier = profileData?.vendorPlan as VendorTier || 'starter';
        const accountType = profileData?.accountType as AccountType || 'entreprise';
        return !hasFeature(tier, item.feature, accountType);
    };

    // Note: Since we are filtering out items, users won't see locked items.
    // If we want to show them as locked, we should not filter and instead 
    // disable the TouchableOpacity. But the prompt says "not able users to access", 
    // and usually in a professional app, you either hide OR show with a lock.
    // Let's SHOW them with a lock for better UX (so they know what they are missing).

    const allVisibleItems = menuItems.filter(item => item.roles.includes(role));
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
                    {allVisibleItems.map((item, index) => {
                        const locked = isFeatureLocked(item);
                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    if (locked) {
                                        Alert.alert(
                                            t('premiumFeature') || 'Premium Feature',
                                            t('upgradeRequired') || 'This feature is not available in your current plan. Upgrade to unlock it!',
                                            [
                                                { text: t('cancel'), style: 'cancel' },
                                                { text: t('seePlans') || 'See Plans', onPress: () => onNavigate('VendorRegistration') }
                                            ]
                                        );
                                        return;
                                    }
                                    onNavigate(item.route);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    sc.card,
                                    {
                                        backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
                                        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                                    },
                                ]}>
                                    <View style={[sc.iconBox, { backgroundColor: item.color + '15' }]}>
                                        <item.icon size={26} color={item.color} strokeWidth={2.2} />
                                    </View>
                                    <Text style={[sc.label, { color: colors.foreground }]} numberOfLines={1}>
                                        {item.label}
                                    </Text>
                                    {locked && (
                                        <View style={{ position: 'absolute', top: 12, right: 12 }}>
                                            <Lock size={14} color={colors.textMuted} />
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </Animated.ScrollView>

            {/* Testing Button - Reset Onboarding */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
                <TouchableOpacity
                    style={[sc.testButton, { backgroundColor: '#FF6B6B' }]}
                    onPress={resetOnboarding}
                >
                    <Play size={18} color="#FFF" />
                    <Text style={sc.testButtonText}>TEST: Reset Onboarding</Text>
                </TouchableOpacity>
            </View>
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
    // Test button styles
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
    testButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
