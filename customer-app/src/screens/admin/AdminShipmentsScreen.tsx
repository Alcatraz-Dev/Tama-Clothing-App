import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    User,
    Phone,
    MapPin,
    Package,
} from 'lucide-react-native';

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import { AdminHeader } from '../../components/admin/AdminUI';
import ShipmentCreationScreen from '../ShipmentCreationScreen';

export default function AdminShipmentsScreen({ onBack, t, language }: any) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
    const [shipments, setShipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (activeTab === 'list') fetchShipments();
    }, [activeTab]);

    const fetchShipments = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setShipments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch ((status || '').toLowerCase()) {
            case 'created': return '#FF9500';
            case 'in_transit': return '#5856D6';
            case 'out_for_delivery': return '#007AFF';
            case 'delivered': return '#34C759';
            default: return '#8E8E93';
        }
    };

    return (
        <View style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader title={t('shipments')} onBack={onBack} />

            <View style={[sc.nav, { borderBottomColor: colors.border, marginTop: insets.top + 58 }]}>
                <TouchableOpacity
                    onPress={() => setActiveTab('list')}
                    style={[sc.navItem, activeTab === 'list' && { borderBottomColor: colors.foreground }]}
                >
                    <Text style={[sc.navText, { color: activeTab === 'list' ? colors.foreground : colors.textMuted }]}>
                        {(t('shipments') || 'LISTE').toUpperCase()}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('create')}
                    style={[sc.navItem, activeTab === 'create' && { borderBottomColor: colors.foreground }]}
                >
                    <Text style={[sc.navText, { color: activeTab === 'create' ? colors.foreground : colors.textMuted }]}>
                        {(t('createShipment') || 'CRÉER').toUpperCase()}
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'list' ? (
                <Animated.FlatList
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                    scrollEventThrottle={16}
                    data={shipments}
                    keyExtractor={s => s.id}
                    contentContainerStyle={[sc.listContent, { paddingTop: 20 }]}
                    refreshing={loading}
                    onRefresh={fetchShipments}
                    renderItem={({ item }) => (
                        <View style={[sc.shipmentCard, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border }]}>
                            <View style={sc.cardHeader}>
                                <Text style={[sc.trackingId, { color: colors.foreground }]}>#{item.trackingId || item.id.slice(0, 8).toUpperCase()}</Text>
                                <View style={[sc.statusTag, { backgroundColor: getStatusColor(item.status) }]}>
                                    <Text style={sc.statusText}>{(item.status || 'CREATED').toUpperCase()}</Text>
                                </View>
                            </View>
                            <View style={sc.infoRow}>
                                <User size={14} color={colors.textMuted} />
                                <Text style={[sc.infoText, { color: colors.textMuted }]}>{item.receiverName}</Text>
                            </View>
                            <View style={sc.infoRow}>
                                <Phone size={14} color={colors.textMuted} />
                                <Text style={[sc.infoText, { color: colors.textMuted }]}>{item.receiverPhone}</Text>
                            </View>
                            <View style={sc.infoRow}>
                                <MapPin size={14} color={colors.textMuted} />
                                <Text style={[sc.infoText, { color: colors.textMuted }]}>{item.deliveryAddress}</Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={!loading ? <View style={sc.empty}><Text style={{ color: colors.textMuted }}>{t('noData') || 'Aucune donnée'}</Text></View> : null}
                />
            ) : (
                <View style={{ flex: 1 }}>
                    <ShipmentCreationScreen onBack={() => setActiveTab('list')} onComplete={() => setActiveTab('list')} t={t} hideHeader={true} />
                </View>
            )}
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
    nav: { flexDirection: 'row', borderBottomWidth: 1 },
    navItem: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    navText: { fontWeight: '800', fontSize: 10 },
    listContent: { padding: 20 },
    shipmentCard: { padding: 16, borderRadius: 20, marginBottom: 15, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    trackingId: { fontWeight: '900', fontSize: 14 },
    statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    infoText: { fontSize: 12, fontWeight: '500' },
    empty: { marginTop: 100, alignItems: 'center' },
});
