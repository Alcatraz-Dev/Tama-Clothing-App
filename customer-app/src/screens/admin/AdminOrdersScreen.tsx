import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Image, Modal, ScrollView,
    Alert, ActivityIndicator, StyleSheet, Animated, FlatList,
} from 'react-native';

// Try to import optional native modules with fallbacks
let BlurView: any = View;
let BlurTargetView: any = View;

try {
    const blur = require('expo-blur');
    if (blur && blur.BlurView) {
        BlurView = blur.BlurView;
        BlurTargetView = blur.BlurTargetView;
    }
} catch (e) {
    console.log('expo-blur not available, using fallback');
}

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    ChevronLeft, X, Search, MapPin, Phone, Mail, User, ShoppingBag, PackageOpen,
    Clock, CheckCircle, Truck, AlertCircle, Filter, MoreVertical,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { AdminSearchBar, EmptyState, adminStyles, DS, AdminHeader } from '../../components/admin/AdminUI';
import {
    collection, getDocs, query, orderBy, addDoc, updateDoc, doc, serverTimestamp, getDoc
} from 'firebase/firestore';
import { db } from '../../api/firebase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateShippingStickerHTML } from '../../utils/shipping';

// ─── Styles ────────────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
    root: { flex: 1 },
    hdr: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 4 },
    hdrRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
    hdrTitle: { flex: 1, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
    backBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    hSep: { height: StyleSheet.hairlineWidth },

    // Header
    header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 100, overflow: 'hidden' },
    headerTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 2 },
    iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

    // Filter Tabs
    filterContainer: { paddingHorizontal: 18, marginBottom: 12 },
    filterScroll: { flexDirection: 'row', gap: 8 },
    filterTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
    filterTabText: { fontSize: 12, fontWeight: '700' },
    filterCount: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },

    // Search
    searchWrap: { paddingHorizontal: 18, marginBottom: 6, marginTop: 10 },
    searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, height: 46, borderWidth: 1, gap: 10 },
    searchInput: { flex: 1, fontSize: 13, fontWeight: '600' },

    // List
    listContent: { padding: 20, paddingBottom: 120 },
    
    // Modern Order Card
    orderCard: { 
        borderRadius: 20, 
        borderWidth: 1, 
        padding: 16, 
        marginBottom: 14,
        shadowColor: '#000', 
        shadowOpacity: 0.06, 
        shadowRadius: 20, 
        shadowOffset: { width: 0, height: 8 }, 
        elevation: 4,
        overflow: 'hidden',
    },
    orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    orderIdBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    orderId: { fontSize: 14, fontWeight: '900', letterSpacing: 0.3 },
    orderDate: { fontSize: 11, fontWeight: '600' },
    
    // Customer Section
    customerSection: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    customerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    customerName: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
    customerMeta: { fontSize: 11, fontWeight: '600' },

    // Product Preview
    productPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        marginBottom: 14,
    },
    productPreviewImage: {
        width: 56,
        height: 56,
        borderRadius: 14,
    },
    productPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    productPreviewInfo: {
        flex: 1,
        marginLeft: 14,
    },
    productPreviewName: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 4,
    },
    productPreviewMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    metaTagText: { fontSize: 10, fontWeight: '800' },
    metaValue: { fontSize: 11, fontWeight: '600' },
    moreItemsBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },

    // Card Footer
    orderCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
    orderTotal: { fontSize: 16, fontWeight: '900' },
    
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyIconBox: { width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    emptyTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3, marginBottom: 8, textAlign: 'center' },
    emptySubtitle: { fontSize: 12, fontWeight: '500', textAlign: 'center', lineHeight: 18 },
    emptyText: { fontSize: 13, fontWeight: '600' },

    // Modal
    modalRoot: { flex: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 58, borderBottomWidth: 1 },
    modalTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
    detailContent: { padding: 18, paddingBottom: 100 },

    // Detail
    detailIdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    detailIdLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
    detailId: { fontSize: 22, fontWeight: '900' },
    printBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
    printBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    section: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    subLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },

    statusChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statusChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
    statusChipText: { fontSize: 10, fontWeight: '800' },

    // Customer info
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    infoIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    infoLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
    infoValue: { fontSize: 14, fontWeight: '700' },

    // Items
    itemRow: { flexDirection: 'row', gap: 12, paddingVertical: 14 },
    itemThumb: { width: 56, height: 70, borderRadius: 12 },
    itemName: { fontSize: 13, fontWeight: '800', lineHeight: 17, marginBottom: 6 },
    itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
    itemMetaTag: { fontSize: 10, fontWeight: '800' },
    metaDot: { fontSize: 14 },
    itemMetaValue: { fontSize: 11, fontWeight: '600' },
    itemPrice: { fontSize: 14, fontWeight: '900' },

    // Totals
    totalBlock: { borderTopWidth: 1, marginTop: 8, paddingTop: 14, gap: 10 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 12, fontWeight: '600' },
    totalValue: { fontSize: 14, fontWeight: '700' },
    grandTotalRow: { marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'transparent' },
    grandLabel: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    grandValue: { fontSize: 22, fontWeight: '900' },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getName(val: any): string {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val.fr || val.en || val['ar-tn'] || Object.values(val)[0] || '';
}

function getStatusConfig(status: string, isDark: boolean) {
    switch ((status || '').toLowerCase()) {
        case 'delivered':
            return { 
                color: '#10B981', 
                bgColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                icon: <CheckCircle size={12} color="#10B981" />,
                label: 'Livré'
            };
        case 'shipped':
            return { 
                color: '#3B82F6', 
                bgColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                icon: <Truck size={12} color="#3B82F6" />,
                label: 'Expédié'
            };
        case 'processing':
            return { 
                color: '#F59E0B', 
                bgColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                icon: <PackageOpen size={12} color="#F59E0B" />,
                label: 'En cours'
            };
        case 'cancelled':
            return { 
                color: '#EF4444', 
                bgColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                icon: <X size={12} color="#EF4444" />,
                label: 'Annulé'
            };
        case 'pending':
        default:
            return { 
                color: '#8B5CF6', 
                bgColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)',
                icon: <Clock size={12} color="#8B5CF6" />,
                label: 'En attente'
            };
    }
}

// ─── Customer Info Row ────────────────────────────────────────────────────────
function CustomerRow({ icon: Icon, label, value, colors, theme }: any) {
    return (
        <View style={sc.infoRow}>
            <View style={[sc.infoIcon, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F5F5F7' }]}>
                <Icon size={16} color={colors.foreground} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[sc.infoLabel, { color: colors.textMuted }]}>{label}</Text>
                <Text style={[sc.infoValue, { color: colors.foreground }]}>{value}</Text>
            </View>
        </View>
    );
}

// ─── Filter Tab Component ─────────────────────────────────────────────────────
function FilterTab({ label, count, isActive, onPress, statusColor, isDark, colors }: any) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <View style={[
                sc.filterTab,
                { 
                    backgroundColor: isActive 
                        ? (statusColor || colors.primary) + '20'
                        : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
                    borderColor: isActive 
                        ? (statusColor || colors.primary) + '40'
                        : 'transparent',
                    borderWidth: 1,
                }
            ]}>
                <Text style={[
                    sc.filterTabText,
                    { color: isActive ? (statusColor || colors.primary) : colors.textMuted }
                ]}>
                    {label}
                </Text>
                <View style={[
                    sc.filterCount,
                    { 
                        backgroundColor: isActive 
                            ? (statusColor || colors.primary)
                            : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                    }
                ]}>
                    <Text style={{ 
                        color: isActive ? '#FFFFFF' : colors.textMuted,
                        fontSize: 10,
                        fontWeight: '800'
                    }}>
                        {count}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminOrdersScreen({ onBack, t, user: currentUser, profileData, language }: any) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [deliveryCompanies, setDeliveryCompanies] = useState<any[]>([]);
    const [assigningCompany, setAssigningCompany] = useState(false);

    const scrollY = useRef(new Animated.Value(0)).current;
    const blurTargetRef = useRef(null);
    const modalBlurTargetRef = useRef(null);
    const modalScrollY = useRef(new Animated.Value(0)).current;
    const headerOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [0, 1], extrapolate: 'clamp' });
    const modalHeaderOpacity = modalScrollY.interpolate({ inputRange: [0, 50], outputRange: [0, 1], extrapolate: 'clamp' });

    useEffect(() => { fetchOrders(); fetchDeliveryCompanies(); }, [currentUser, profileData]);

    async function fetchDeliveryCompanies() {
        try {
            const snap = await getDocs(collection(db, 'deliveryCompanies'));
            setDeliveryCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error('Error fetching delivery companies:', err); }
    }

    async function assignDeliveryCompany(orderId: string, company: any) {
        try {
            setAssigningCompany(true);
            await updateDoc(doc(db, 'orders', orderId), {
                deliveryCompanyId: company.id,
                deliveryCompanyName: company.name,
                deliveryAssignedAt: serverTimestamp(),
            });
            setSelectedOrder((prev: any) => ({ ...prev, deliveryCompanyId: company.id, deliveryCompanyName: company.name }));
            Alert.alert('✅ Done', `Order assigned to ${company.name}`);
        } catch (err) {
            Alert.alert('Error', 'Failed to assign delivery company.');
        } finally {
            setAssigningCompany(false);
        }
    }

    async function fetchOrders() {
        try {
            const isBrandOwner = profileData?.role === 'brand_owner';
            const myBrandId = profileData?.brandId;
            const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            const filtered = isBrandOwner && myBrandId
                ? all.filter(o => (o.items || []).some((i: any) => i.brandId === myBrandId))
                : all;
            setOrders(filtered);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    // Calculate filter counts
    const filterCounts = {
        all: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    // Filter orders
    const filteredOrders = orders.filter(o => {
        const q = searchQuery.toLowerCase();
        const c = getCustomer(o);
        const matchesSearch = o.id.toLowerCase().includes(q) || c.fullName.toLowerCase().includes(q) || c.phone.includes(q);
        const matchesFilter = activeFilter === 'all' || o.status === activeFilter;
        return matchesSearch && matchesFilter;
    });

    function getStatusLabel(status: string): string {
        switch ((status || '').toLowerCase()) {
            case 'pending': return t('statusPending');
            case 'delivered': return t('statusDelivered');
            case 'shipped': return t('statusShipped');
            case 'cancelled': return t('statusCancelled');
            case 'processing': return t('statusProcessing');
            default: return status;
        }
    }

    function getCustomer(order: any) {
        const c = order.customer || order.shippingAddress || {};
        return {
            fullName: c.fullName || 'Client Inconnu',
            phone: c.phone || '—',
            address: c.address || '—',
            email: c.email || '—',
        };
    }

    async function updateStatus(id: string, newStatus: string) {
        try {
            await updateDoc(doc(db, 'orders', id), { status: newStatus });
            if (selectedOrder?.id === id) {
                const updated = { ...selectedOrder, status: newStatus };
                setSelectedOrder(updated);
                if (selectedOrder.userId) {
                    await addDoc(collection(db, 'notifications'), {
                        userId: selectedOrder.userId,
                        title: 'Order Update',
                        message: `Your order #${id.slice(0, 8)} is now ${newStatus.toUpperCase()}.`,
                        read: false,
                        type: 'order_update',
                        data: { orderId: id },
                        createdAt: serverTimestamp(),
                    });
                }
            }
            fetchOrders();
        } catch {
            Alert.alert(t('error'), t('updateFailed'));
        }
    }

    async function printOrderLabel() {
        if (!selectedOrder) return;
        try {
            const customer = getCustomer(selectedOrder);
            const itemsList = (selectedOrder.items || []).map((i: any) => {
                const title = typeof i.name === 'string' ? i.name : (i.name?.fr || i.name?.['ar-tn'] || i.title || 'Item');
                return {
                    name: title,
                    quantity: i.quantity || 1,
                    size: i.selectedSize || i.size || '',
                    color: i.selectedColor || i.color || '',
                    price: i.price || 0
                };
            });

            // Resolve Brand Details
            let finalSenderName = profileData?.brandName || 'BEY3A LOGISTICS';
            let finalSenderAddress = 'Tunis, Tunisie 1000';
            let finalSenderPhone = '+216 71 000 000';
            let finalLogoUrl = undefined;

            const targetBrandId = profileData?.brandId || selectedOrder.items?.[0]?.brandId;
            if (targetBrandId) {
                try {
                    const snap = await getDoc(doc(db, 'brands', targetBrandId));
                    if (snap.exists()) {
                        const data = snap.data();
                        if (data.name?.fr) finalSenderName = data.name.fr;
                        if (data.address) finalSenderAddress = data.address;
                        if (data.phone) finalSenderPhone = data.phone;
                        if (data.image) finalLogoUrl = data.image;
                    }
                } catch (err) {
                    console.log('Failed to fetch brand for label', err);
                }
            }

            const html = generateShippingStickerHTML({
                trackingId: selectedOrder.trackingId || selectedOrder.id,
                senderName: finalSenderName,
                senderAddress: finalSenderAddress,
                senderPhone: finalSenderPhone,
                brandLogoUrl: finalLogoUrl,
                receiverName: customer.fullName,
                receiverPhone: customer.phone,
                deliveryAddress: customer.address,
                items: itemsList,
                weight: 'Inconnu',
                serviceType: 'Livraison standard',
                carrierName: 'Bey3a Logistics',
                carrierPhone: '+216 71 000 000',
                totalPrice: selectedOrder.total,
                shippingPrice: 7,
            });
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (err: any) {
            Alert.alert(t('error'), err.message || 'Print failed');
        }
    }

    // Filter tabs configuration
    const filterTabs = [
        { key: 'all', label: 'Tout', color: colors.primary },
        { key: 'pending', label: 'En attente', color: '#8B5CF6' },
        { key: 'processing', label: 'En cours', color: '#F59E0B' },
        { key: 'shipped', label: 'Expédié', color: '#3B82F6' },
        { key: 'delivered', label: 'Livré', color: '#10B981' },
        { key: 'cancelled', label: 'Annulé', color: '#EF4444' },
    ];

    // ── Render ──────────────────────────────────────────────────────────────────────
    return (
        <View style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader title={t('orders')} onBack={onBack} blurTarget={blurTargetRef} />

            <AdminSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('searchOrdersPlaceholder')}
                onClear={() => setSearchQuery('')}
                style={{ marginTop: insets.top + 58, marginHorizontal: 20, marginBottom: 10 }}
            />

            {/* Filter Tabs */}
            <View style={sc.filterContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={filterTabs}
                    keyExtractor={item => item.key}
                    contentContainerStyle={sc.filterScroll}
                    renderItem={({ item }) => (
                        <FilterTab
                            label={item.label}
                            count={filterCounts[item.key as keyof typeof filterCounts]}
                            isActive={activeFilter === item.key}
                            onPress={() => setActiveFilter(item.key)}
                            statusColor={item.color}
                            isDark={isDark}
                            colors={colors}
                        />
                    )}
                />
            </View>

            {/* Orders list */}
            {loading ? (
                <ActivityIndicator size="large" color={colors.foreground} style={{ marginTop: 60 }} />
            ) : (
                BlurTargetView && BlurTargetView !== View ? (
                    <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
                        {renderOrdersList()}
                    </BlurTargetView>
                ) : (
                    <View style={{ flex: 1 }}>
                        {renderOrdersList()}
                    </View>
                )
            )}

            {/* Order Detail Modal */}
            {selectedOrder && renderOrderModal()}
        </View>
    );

    function renderOrdersList() {
        return (
            <Animated.FlatList
                data={filteredOrders}
                keyExtractor={item => item.id}
                contentContainerStyle={[sc.listContent]}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
                ListEmptyComponent={
                    <EmptyState
                        message={t('noOrdersFound') || 'No orders found'}
                        subtitle={searchQuery || activeFilter !== 'all' ? 'Try different filters or search' : 'Orders will appear here'}
                        icon={<PackageOpen size={36} color={colors.textMuted} strokeWidth={1.5} />}
                    />
                }
                renderItem={({ item, index }) => {
                    const customer = getCustomer(item);
                    const statusConfig = getStatusConfig(item.status || 'pending', isDark);
                    const firstItem = item.items?.[0];
                    const productName = firstItem ? getName(firstItem.name) : '';
                    const productSize = firstItem?.selectedSize || '';
                    const productColor = firstItem?.selectedColor || '';
                    const productImage = firstItem?.mainImage || firstItem?.image || '';

                    return (
                        <View key={item.id}>
                            <TouchableOpacity
                                onPress={() => setSelectedOrder(item)}
                                style={[sc.orderCard, { 
                                    backgroundColor: isDark ? '#12121A' : '#FFFFFF', 
                                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' 
                                }]}
                                activeOpacity={0.75}
                            >
                                {/* Header with ID and Date */}
                                <View style={sc.orderCardHeader}>
                                    <View style={sc.orderIdBadge}>
                                        <Text style={[sc.orderId, { color: colors.foreground }]}>
                                            #{item.id.slice(0, 8).toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={[sc.orderDate, { color: colors.textMuted }]}>
                                        {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR') : ''}
                                    </Text>
                                </View>

                                {/* Customer Info */}
                                <View style={sc.customerSection}>
                                    <View style={[sc.customerAvatar, { backgroundColor: colors.primary + '20' }]}>
                                        <User size={18} color={colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={[sc.customerName, { color: colors.foreground }]} numberOfLines={1}>
                                            {customer.fullName}
                                        </Text>
                                        <Text style={[sc.customerMeta, { color: colors.textMuted }]}>
                                            {customer.phone}
                                        </Text>
                                    </View>
                                </View>

                                {/* Product Preview */}
                                {firstItem && (
                                    <View style={[sc.productPreview, { backgroundColor: isDark ? '#1A1A24' : '#F8F8FA' }]}>
                                        {productImage ? (
                                            <Image
                                                source={{ uri: productImage }}
                                                style={[sc.productPreviewImage, { backgroundColor: isDark ? '#2A2A35' : '#E8E8EC' }]}
                                            />
                                        ) : (
                                            <View style={[sc.productPreviewImage, sc.productPlaceholder, { backgroundColor: isDark ? '#2A2A35' : '#E8E8EC' }]}>
                                                <PackageOpen size={22} color={colors.textMuted} />
                                            </View>
                                        )}
                                        <View style={sc.productPreviewInfo}>
                                            <Text style={[sc.productPreviewName, { color: colors.foreground }]} numberOfLines={1}>
                                                {productName.toUpperCase()}
                                            </Text>
                                            <View style={sc.productPreviewMeta}>
                                                {productSize ? (
                                                    <View style={[sc.metaTag, { backgroundColor: isDark ? '#2A2A35' : '#E8E8EC' }]}>
                                                        <Text style={[sc.itemMetaTag, { color: colors.textMuted }]}>{productSize}</Text>
                                                    </View>
                                                ) : null}
                                                {productColor ? (
                                                    <>
                                                        <Text style={{ color: colors.textMuted }}>•</Text>
                                                        <Text style={[sc.itemMetaValue, { color: colors.textMuted }]}>{productColor}</Text>
                                                    </>
                                                ) : null}
                                            </View>
                                        </View>
                                        {item.items?.length > 1 && (
                                            <View style={[sc.moreItemsBadge, { backgroundColor: colors.primary + '15' }]}>
                                                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>+{item.items.length - 1}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Footer with Total and Status */}
                                <View style={[sc.orderCardFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                                    <Text style={[sc.orderTotal, { color: colors.foreground }]}>
                                        {item.total?.toFixed(3)} TND
                                    </Text>
                                    <View style={[sc.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                                        {statusConfig.icon}
                                        <Text style={[sc.statusText, { color: statusConfig.color }]}>
                                            {statusConfig.label.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    );
                }}
            />
        );
    }

    function renderOrderModal() {
        return (
            <Modal visible={!!selectedOrder} animationType="slide" presentationStyle="pageSheet">
                <View style={[sc.modalRoot, { backgroundColor: isDark ? '#0A0A0F' : '#F5F5F9' }]}>
                    {/* Modal nav */}
                    <Animated.View style={[sc.header, {
                        backgroundColor: colors.background,
                        borderBottomWidth: modalHeaderOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                        borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    }]}>
                        <Animated.View style={[StyleSheet.absoluteFill, { opacity: modalHeaderOpacity }]}>
                            {BlurView ? (
                                <BlurView
                                    intensity={80}
                                    style={StyleSheet.absoluteFill}
                                    tint={isDark ? 'dark' : 'light'}
                                    blurTarget={modalBlurTargetRef}
                                    blurMethod="dimezisBlurView"
                                />
                            ) : null}
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + 'B3' }]} />
                        </Animated.View>

                        <TouchableOpacity onPress={() => setSelectedOrder(null)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                            <ChevronLeft size={24} color={colors.foreground} />
                        </TouchableOpacity>

                        <Text style={[sc.headerTitle, { color: colors.foreground }]} pointerEvents="none">
                            {t('orderDetails').toUpperCase()}
                        </Text>

                        <View style={{ width: 42 }} />
                    </Animated.View>

                    {BlurTargetView && BlurTargetView !== View ? (
                        <BlurTargetView ref={modalBlurTargetRef} style={{ flex: 1 }}>
                            {renderModalContent()}
                        </BlurTargetView>
                    ) : (
                        <View style={{ flex: 1 }}>
                            {renderModalContent()}
                        </View>
                    )}
                </View>
            </Modal>
        );
    }

    function renderModalContent() {
        if (!selectedOrder) return null;
        
        const customer = getCustomer(selectedOrder);
        const statusConfig = getStatusConfig(selectedOrder.status || 'pending', isDark);
        
        return (
            <Animated.ScrollView
                contentContainerStyle={sc.detailContent}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: modalScrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
            >
                {/* Order ID + Print */}
                <View style={sc.detailIdRow}>
                    <View>
                        <Text style={[sc.detailIdLabel, { color: colors.textMuted }]}>{t('orderNumber')}</Text>
                        <Text style={[sc.detailId, { color: colors.foreground }]}>#{selectedOrder.id.slice(0, 8).toUpperCase()}</Text>
                    </View>
                    <TouchableOpacity onPress={printOrderLabel} style={[sc.printBtn, { backgroundColor: colors.foreground }]}>
                        <Text style={[sc.printBtnText, { color: isDark ? '#000' : '#FFF' }]}>PRINT LABEL</Text>
                    </TouchableOpacity>
                </View>

                {/* Status */}
                <View style={[sc.section, { backgroundColor: isDark ? '#121218' : '#FFF', borderColor: colors.border }]}>
                    <View style={sc.sectionHeader}>
                        <Text style={[sc.sectionTitle, { color: colors.textMuted }]}>STATUT</Text>
                    </View>
                    <View style={[sc.statusBadge, { backgroundColor: statusConfig.bgColor, alignSelf: 'flex-start' }]}>
                        {statusConfig.icon}
                        <Text style={[sc.statusText, { color: statusConfig.color }]}>
                            {statusConfig.label.toUpperCase()}
                        </Text>
                    </View>

                    {/* Status Update Chips */}
                    <View style={[sc.statusChipsWrap, { marginTop: 16 }]}>
                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => {
                            const cfg = getStatusConfig(s, isDark);
                            const isActive = selectedOrder.status === s;
                            return (
                                <TouchableOpacity 
                                    key={s} 
                                    onPress={() => updateStatus(selectedOrder.id, s)}
                                    style={[
                                        sc.statusChip, 
                                        { 
                                            backgroundColor: isActive ? cfg.bgColor : 'transparent',
                                            borderColor: cfg.color + '40'
                                        }
                                    ]}
                                >
                                    <Text style={[sc.statusChipText, { color: cfg.color }]}>
                                        {cfg.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Customer Info */}
                <View style={[sc.section, { backgroundColor: isDark ? '#121218' : '#FFF', borderColor: colors.border }]}>
                    <Text style={[sc.sectionTitle, { color: colors.textMuted, marginBottom: 16 }]}>CLIENT</Text>
                    <CustomerRow icon={User} label="Nom" value={customer.fullName} colors={colors} theme={theme} />
                    <CustomerRow icon={Phone} label="Téléphone" value={customer.phone} colors={colors} theme={theme} />
                    <CustomerRow icon={MapPin} label="Adresse" value={customer.address} colors={colors} theme={theme} />
                </View>

                {/* Items */}
                <View style={[sc.section, { backgroundColor: isDark ? '#121218' : '#FFF', borderColor: colors.border }]}>
                    <Text style={[sc.sectionTitle, { color: colors.textMuted, marginBottom: 16 }]}>
                        ARTICLES ({selectedOrder.items?.length || 0})
                    </Text>
                    {selectedOrder.items?.map((item: any, idx: number) => (
                        <View key={idx} style={[sc.itemRow, { borderBottomWidth: idx < (selectedOrder.items?.length || 0) - 1 ? 1 : 0, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                            {item.mainImage || item.image ? (
                                <Image source={{ uri: item.mainImage || item.image }} style={sc.itemThumb} />
                            ) : (
                                <View style={[sc.itemThumb, { backgroundColor: isDark ? '#2A2A35' : '#E8E8EC', alignItems: 'center', justifyContent: 'center' }]}>
                                    <PackageOpen size={20} color={colors.textMuted} />
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={[sc.itemName, { color: colors.foreground }]} numberOfLines={2}>
                                    {getName(item.name)}
                                </Text>
                                <View style={sc.itemMeta}>
                                    {item.selectedSize && (
                                        <View style={[sc.metaTag, { backgroundColor: isDark ? '#2A2A35' : '#E8E8EC' }]}>
                                            <Text style={[sc.itemMetaTag, { color: colors.textMuted }]}>{item.selectedSize}</Text>
                                        </View>
                                    )}
                                    {item.selectedColor && (
                                        <View style={[sc.metaTag, { backgroundColor: isDark ? '#2A2A35' : '#E8E8EC' }]}>
                                            <Text style={[sc.itemMetaTag, { color: colors.textMuted }]}>{item.selectedColor}</Text>
                                        </View>
                                    )}
                                    <Text style={[sc.itemMetaValue, { color: colors.textMuted }]}>×{item.quantity || 1}</Text>
                                </View>
                            </View>
                            <Text style={[sc.itemPrice, { color: colors.foreground }]}>
                                {(item.price || 0).toFixed(3)} TND
                            </Text>
                        </View>
                    ))}
                    
                    <View style={[sc.totalBlock, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                        <View style={sc.totalRow}>
                            <Text style={[sc.totalLabel, { color: colors.textMuted }]}>Sous-total</Text>
                            <Text style={[sc.totalValue, { color: colors.foreground }]}>{(selectedOrder.subtotal || selectedOrder.total || 0).toFixed(3)} TND</Text>
                        </View>
                        <View style={sc.totalRow}>
                            <Text style={[sc.totalLabel, { color: colors.textMuted }]}>Livraison</Text>
                            <Text style={[sc.totalValue, { color: colors.foreground }]}>{(selectedOrder.shipping || 7).toFixed(3)} TND</Text>
                        </View>
                        <View style={[sc.grandTotalRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                            <Text style={[sc.grandLabel, { color: colors.foreground }]}>TOTAL</Text>
                            <Text style={[sc.grandValue, { color: colors.primary }]}>{selectedOrder.total?.toFixed(3)} TND</Text>
                        </View>
                    </View>
                </View>
                {/* Delivery Company Assignment */}
                <View style={[sc.section, { backgroundColor: isDark ? '#121218' : '#FFF', borderColor: colors.border }]}>
                    <View style={sc.sectionHeader}>
                        <Text style={[sc.sectionTitle, { color: colors.textMuted }]}>🚚 DELIVERY COMPANY</Text>
                        {selectedOrder.deliveryCompanyName && (
                            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#3B82F620' }}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#3B82F6' }}>{selectedOrder.deliveryCompanyName}</Text>
                            </View>
                        )}
                    </View>
                    {!selectedOrder.deliveryCompanyId && (
                        <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '500', marginBottom: 12 }}>No delivery company assigned yet. Select one:</Text>
                    )}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {deliveryCompanies.length === 0 ? (
                            <Text style={{ fontSize: 12, color: colors.textMuted }}>No delivery companies available. Add some in Admin → Delivery Companies.</Text>
                        ) : deliveryCompanies.map(company => {
                            const isAssigned = selectedOrder.deliveryCompanyId === company.id;
                            return (
                                <TouchableOpacity
                                    key={company.id}
                                    onPress={() => assignDeliveryCompany(selectedOrder.id, company)}
                                    disabled={assigningCompany}
                                    style={[sc.statusChip, {
                                        backgroundColor: isAssigned ? '#3B82F620' : 'transparent',
                                        borderColor: isAssigned ? '#3B82F6' : colors.border,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                    }]}
                                >
                                    {isAssigned && <Truck size={12} color="#3B82F6" />}
                                    <Text style={[sc.statusChipText, { color: isAssigned ? '#3B82F6' : colors.textMuted }]}>
                                        {company.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {assigningCompany && <ActivityIndicator style={{ marginTop: 12 }} color={colors.primary} />}
                </View>

            </Animated.ScrollView>
        );
    }
}
