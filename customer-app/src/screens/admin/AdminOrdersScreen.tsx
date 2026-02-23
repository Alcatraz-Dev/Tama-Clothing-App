import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Image, Modal, ScrollView,
    Alert, ActivityIndicator, StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
    ChevronLeft, X, Search, MapPin, Phone, Mail, User, ShoppingBag, PackageOpen,
} from 'lucide-react-native';
import {
    collection, getDocs, query, orderBy, addDoc, updateDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateShippingStickerHTML } from '../../utils/shipping';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getName(val: any): string {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val.fr || val.en || val['ar-tn'] || Object.values(val)[0] || '';
}

function getStatusColor(status: string): string {
    switch ((status || '').toLowerCase()) {
        case 'delivered': return '#10B981';
        case 'shipped': return '#3B82F6';
        case 'processing': return '#F59E0B';
        case 'cancelled': return '#EF4444';
        default: return '#8B5CF6';
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminOrdersScreen({ onBack, t, user: currentUser, profileData, language }: any) {
    const { colors, theme } = useAppTheme();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const scrollY = useRef(new Animated.Value(0)).current;
    const headerOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [0, 1], extrapolate: 'clamp' });

    useEffect(() => { fetchOrders(); }, [currentUser, profileData]);

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
            const itemsString = (selectedOrder.items || [])
                .map((i: any) => `${i.name || 'Item'} (x${i.quantity || 1})`)
                .join(', ');
            const html = generateShippingStickerHTML({
                trackingId: selectedOrder.trackingId || selectedOrder.id,
                senderName: profileData?.brandName || 'Tama Clothing',
                receiverName: customer.fullName,
                receiverPhone: customer.phone,
                deliveryAddress: customer.address,
                items: [itemsString],
                weight: 'Unknown',
                serviceType: 'Standard delivery',
                carrierName: 'Tama Logistics',
                carrierPhone: '+216 71 000 000',
            });
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (err: any) {
            Alert.alert(t('error'), err.message || 'Print failed');
        }
    }

    const filteredOrders = orders.filter(o => {
        const q = searchQuery.toLowerCase();
        const c = getCustomer(o);
        return o.id.toLowerCase().includes(q) || c.fullName.toLowerCase().includes(q) || c.phone.includes(q);
    });

    // ── Render ──────────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={[sc.root, { backgroundColor: colors.background }]}>
            {/* Header */}
            <Animated.View style={[sc.header, {
                backgroundColor: colors.background,
                borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            }]}>
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
                    <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme === 'dark' ? 'dark' : 'light'} />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + 'B3' }]} />
                </Animated.View>
                <TouchableOpacity onPress={onBack} style={[sc.iconBtn, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : '#F2F2F7' }]} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <ChevronLeft size={20} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[sc.headerTitle, { color: colors.foreground }]} pointerEvents="none">{t('orders').toUpperCase()}</Text>
                <View style={{ width: 40 }} />
            </Animated.View>

            {/* Search bar */}
            <View style={sc.searchWrap}>
                <View style={[sc.searchBar, { backgroundColor: theme === 'dark' ? '#121218' : '#F2F2F7', borderColor: colors.border }]}>
                    <Search size={17} color={colors.textMuted} />
                    <TextInput
                        style={[sc.searchInput, { color: colors.foreground }]}
                        placeholder={t('searchOrdersPlaceholder')}
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <X size={15} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Orders list */}
            {loading ? (
                <ActivityIndicator size="large" color={colors.foreground} style={{ marginTop: 60 }} />
            ) : (
                <Animated.FlatList
                    data={filteredOrders}
                    keyExtractor={item => item.id}
                    contentContainerStyle={sc.listContent}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                    scrollEventThrottle={16}
                    ListEmptyComponent={
                        <View style={sc.empty}>
                            <View style={[sc.emptyIconBox, { backgroundColor: theme === 'dark' ? '#121218' : '#F5F5F7', borderColor: colors.border }]}>
                                <PackageOpen size={36} color={colors.textMuted} strokeWidth={1.5} />
                            </View>
                            <Text style={[sc.emptyTitle, { color: colors.foreground }]}>{t('noOrdersFound')}</Text>
                            <Text style={[sc.emptySubtitle, { color: colors.textMuted }]}>
                                {searchQuery ? 'Aucun résultat pour votre recherche' : 'Les commandes apparaîtront ici'}
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const customer = getCustomer(item);
                        const statusColor = getStatusColor(item.status || 'pending');
                        return (
                            <TouchableOpacity
                                onPress={() => setSelectedOrder(item)}
                                style={[sc.orderCard, { backgroundColor: theme === 'dark' ? '#121218' : '#FFF', borderColor: colors.border }]}
                                activeOpacity={0.75}
                            >
                                <View style={sc.orderCardTop}>
                                    <Text style={[sc.orderId, { color: colors.foreground }]}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                                    <Text style={[sc.orderDate, { color: colors.textMuted }]}>
                                        {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR') : ''}
                                    </Text>
                                </View>
                                <Text style={[sc.customerName, { color: colors.foreground }]}>{customer.fullName}</Text>
                                <View style={sc.orderCardBottom}>
                                    <Text style={[sc.orderMeta, { color: colors.textMuted }]}>
                                        {item.items?.length || 0} {t('itemsLabel')} • {item.total} TND
                                    </Text>
                                    <View style={[sc.statusBadge, { backgroundColor: statusColor + '20' }]}>
                                        <Text style={[sc.statusText, { color: statusColor }]}>
                                            {getStatusLabel(item.status || 'pending').toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}

            {/* Order Detail Modal */}
            <Modal visible={!!selectedOrder} animationType="slide" presentationStyle="pageSheet">
                <View style={[sc.modalRoot, { backgroundColor: theme === 'dark' ? '#0A0A0F' : '#F5F5F9' }]}>
                    {/* Modal nav */}
                    <SafeAreaView style={{ backgroundColor: theme === 'dark' ? '#0D0D14' : '#FFF' }}>
                        <View style={[sc.modalHeader, { backgroundColor: theme === 'dark' ? '#0D0D14' : '#FFF', borderBottomColor: theme === 'dark' ? '#1A1A24' : '#F0F0F5' }]}>
                            <Text style={[sc.modalTitle, { color: colors.foreground }]}>{t('orderDetails').toUpperCase()}</Text>
                            <TouchableOpacity onPress={() => setSelectedOrder(null)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                                <X size={22} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>

                    <ScrollView contentContainerStyle={sc.detailContent} showsVerticalScrollIndicator={false}>
                        {selectedOrder && (() => {
                            const customer = getCustomer(selectedOrder);
                            return (
                                <>
                                    {/* Order ID + Print */}
                                    <View style={sc.detailIdRow}>
                                        <View>
                                            <Text style={[sc.detailIdLabel, { color: colors.textMuted }]}>{t('orderNumber')}</Text>
                                            <Text style={[sc.detailId, { color: colors.foreground }]}>#{selectedOrder.id.slice(0, 8).toUpperCase()}</Text>
                                        </View>
                                        <TouchableOpacity onPress={printOrderLabel} style={[sc.printBtn, { backgroundColor: colors.foreground }]}>
                                            <Text style={[sc.printBtnText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>PRINT LABEL</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Status */}
                                    <View style={[sc.section, { backgroundColor: theme === 'dark' ? '#121218' : '#FFF', borderColor: colors.border }]}>
                                        <View style={sc.sectionHeader}>
                                            <Text style={[sc.sectionTitle, { color: colors.foreground }]}>{t('status').toUpperCase()}</Text>
                                            <View style={[sc.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
                                                <Text style={[sc.statusText, { color: getStatusColor(selectedOrder.status) }]}>
                                                    {getStatusLabel(selectedOrder.status).toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={[sc.subLabel, { color: colors.textMuted }]}>{t('updateStatus').toUpperCase()}</Text>
                                        <View style={sc.statusChipsWrap}>
                                            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => {
                                                const isActive = selectedOrder.status === s;
                                                const sColor = getStatusColor(s);
                                                return (
                                                    <TouchableOpacity
                                                        key={s}
                                                        onPress={() => updateStatus(selectedOrder.id, s)}
                                                        style={[sc.statusChip, {
                                                            backgroundColor: isActive ? sColor : (theme === 'dark' ? '#1C1C26' : '#F2F2F7'),
                                                            borderColor: isActive ? sColor : colors.border,
                                                        }]}
                                                    >
                                                        <Text style={[sc.statusChipText, { color: isActive ? '#FFF' : colors.foreground }]}>
                                                            {t('status' + s.charAt(0).toUpperCase() + s.slice(1)).toUpperCase()}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>

                                    {/* Customer */}
                                    <View style={[sc.section, { backgroundColor: theme === 'dark' ? '#121218' : '#FFF', borderColor: colors.border }]}>
                                        <Text style={[sc.sectionTitle, { color: colors.foreground, marginBottom: 16 }]}>{t('clientInfo').toUpperCase()}</Text>
                                        <CustomerRow icon={User} label={t('fullName').toUpperCase()} value={customer.fullName} colors={colors} theme={theme} />
                                        <CustomerRow icon={Phone} label={t('phone').toUpperCase()} value={customer.phone} colors={colors} theme={theme} />
                                        <CustomerRow icon={MapPin} label={t('deliveryAddress').toUpperCase()} value={customer.address} colors={colors} theme={theme} />
                                        <CustomerRow icon={Mail} label={t('email').toUpperCase()} value={customer.email} colors={colors} theme={theme} />
                                    </View>

                                    {/* Items */}
                                    <View style={[sc.section, { backgroundColor: theme === 'dark' ? '#121218' : '#FFF', borderColor: colors.border }]}>
                                        <View style={sc.sectionHeaderRow}>
                                            <ShoppingBag size={16} color={colors.foreground} />
                                            <Text style={[sc.sectionTitle, { color: colors.foreground }]}>
                                                {t('orderItems').toUpperCase()} ({selectedOrder.items?.length || 0})
                                            </Text>
                                        </View>
                                        {(selectedOrder.items || []).map((prod: any, i: number) => (
                                            <View key={i} style={[sc.itemRow, {
                                                borderBottomColor: colors.border,
                                                borderBottomWidth: i === (selectedOrder.items?.length - 1) ? 0 : 1,
                                            }]}>
                                                <Image source={{ uri: prod.mainImage || prod.image }} style={[sc.itemThumb, { backgroundColor: theme === 'dark' ? '#17171F' : '#F2F2F7' }]} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[sc.itemName, { color: colors.foreground }]} numberOfLines={2}>
                                                        {String(getName(prod.name)).toUpperCase()}
                                                    </Text>
                                                    <View style={sc.itemMeta}>
                                                        <View style={[sc.metaTag, { backgroundColor: theme === 'dark' ? '#1C1C26' : '#F2F2F7' }]}>
                                                            <Text style={[sc.metaTagText, { color: colors.textMuted }]}>{prod.selectedSize}</Text>
                                                        </View>
                                                        <Text style={[sc.metaDot, { color: colors.border }]}>·</Text>
                                                        <Text style={[sc.metaValue, { color: colors.textMuted }]}>{prod.selectedColor}</Text>
                                                        <Text style={[sc.metaDot, { color: colors.border }]}>·</Text>
                                                        <Text style={[sc.metaValue, { color: colors.textMuted }]}>{t('qty')}: {prod.quantity || 1}</Text>
                                                    </View>
                                                    <Text style={[sc.itemPrice, { color: colors.foreground }]}>{prod.price?.toFixed(2)} TND</Text>
                                                </View>
                                            </View>
                                        ))}

                                        {/* Totals */}
                                        <View style={[sc.totalBlock, { borderTopColor: colors.border }]}>
                                            <View style={sc.totalRow}>
                                                <Text style={[sc.totalLabel, { color: colors.textMuted }]}>{t('subtotal')}</Text>
                                                <Text style={[sc.totalValue, { color: colors.foreground }]}>{(selectedOrder.total - 7).toFixed(2)} TND</Text>
                                            </View>
                                            <View style={sc.totalRow}>
                                                <Text style={[sc.totalLabel, { color: colors.textMuted }]}>{t('delivery')}</Text>
                                                <Text style={[sc.totalValue, { color: colors.foreground }]}>7.00 TND</Text>
                                            </View>
                                            <View style={[sc.totalRow, sc.grandTotalRow]}>
                                                <Text style={[sc.grandLabel, { color: colors.foreground }]}>{t('orderTotal').toUpperCase()}</Text>
                                                <Text style={[sc.grandValue, { color: colors.foreground }]}>{selectedOrder.total?.toFixed(2)} TND</Text>
                                            </View>
                                        </View>
                                    </View>
                                </>
                            );
                        })()}
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
    root: { flex: 1 },

    // Header
    header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 100, overflow: 'hidden' },
    headerTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2, position: 'absolute', left: 50, right: 50, textAlign: 'center', zIndex: 1 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', zIndex: 10 },

    // Search
    searchWrap: { paddingHorizontal: 18, marginBottom: 6 },
    searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, height: 46, borderWidth: 1, gap: 10 },
    searchInput: { flex: 1, fontSize: 13, fontWeight: '600' },

    // List
    listContent: { padding: 18, paddingBottom: 100 },
    orderCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
    orderCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    orderId: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    orderDate: { fontSize: 11 },
    customerName: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
    orderCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderMeta: { fontSize: 11, fontWeight: '600' },

    statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

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

    section: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
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
    metaTag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
    metaTagText: { fontSize: 9, fontWeight: '800' },
    metaDot: { fontSize: 14 },
    metaValue: { fontSize: 11, fontWeight: '600' },
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
