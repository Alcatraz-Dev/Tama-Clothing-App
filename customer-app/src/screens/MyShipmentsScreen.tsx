import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { ArrowLeft, Package, MapPin, Clock, ChevronRight, Truck, CheckCircle, XCircle } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';
import { auth, db } from '../api/firebase';
import { collection, query, where, orderBy, onSnapshot, or } from 'firebase/firestore';

interface ShipmentItem {
    id: string;
    trackingId: string;
    status: string;
    receiverName: string;
    deliveryAddress: string;
    items?: string[];
    createdAt?: { toDate: () => Date };
}

interface MyShipmentsScreenProps {
    onBack: () => void;
    onTrackShipment: (trackingId: string) => void;
    t: (key: string) => string;
    user?: any;
    profileData?: any;
}

export default function MyShipmentsScreen({ onBack, onTrackShipment, t, user, profileData }: MyShipmentsScreenProps) {
    const { colors } = useAppTheme();
    const [shipments, setShipments] = useState<ShipmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'delivered'>('all');

    const translate = t || ((k: string) => k);

    const fetchShipments = useCallback(async () => {
        if (!auth.currentUser?.uid) {
            setLoading(false);
            return;
        }

        try {
            const conditions = [where('senderId', '==', auth.currentUser.uid)];
            if (profileData?.phone) {
                conditions.push(where('receiverPhone', '==', profileData.phone));
            }

            const q = query(
                collection(db, 'Shipments'),
                or(...conditions),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const shipmentsList = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        trackingId: data.trackingId || '',
                        status: data.status || 'Pending',
                        receiverName: data.receiverName || '',
                        deliveryAddress: data.deliveryAddress || '',
                        items: data.items || [],
                        createdAt: data.createdAt,
                    };
                });
                setShipments(shipmentsList);
                setLoading(false);
                setRefreshing(false);
            }, (error) => {
                console.log('Error fetching shipments:', error);
                setLoading(false);
                setRefreshing(false);
            });

            return unsubscribe;
        } catch (error) {
            console.log('Error setting up shipment listener:', error);
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const setup = async () => {
            unsubscribe = await fetchShipments();
        };

        setup();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [fetchShipments]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchShipments();
    };

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase() || '';
        switch (s) {
            case 'pending': return '#F59E0B';
            case 'in transit':
            case 'in_transit': return '#3B82F6';
            case 'out for delivery':
            case 'out_for_delivery': return '#10B981';
            case 'delivered': return '#22C55E';
            case 'cancelled': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const getStatusIcon = (status: string) => {
        const s = status?.toLowerCase() || '';
        switch (s) {
            case 'delivered': return CheckCircle;
            case 'cancelled': return XCircle;
            default: return Truck;
        }
    };

    const filteredShipments = (shipments || []).filter(s => {
        const status = s?.status?.toLowerCase() || '';
        if (activeTab === 'pending') return status !== 'delivered' && status !== 'cancelled';
        if (activeTab === 'delivered') return status === 'delivered';
        return true;
    });

    const renderShipment = ({ item }: { item: ShipmentItem }) => {
        const StatusIcon = getStatusIcon(item.status);

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => item.trackingId && onTrackShipment(item.trackingId)}
                disabled={!item.trackingId}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <StatusIcon size={14} color={getStatusColor(item.status)} />
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {translate((item.status?.toLowerCase() || 'pending').replace(/ /g, '_')) || item.status}
                        </Text>
                    </View>
                    <Text style={[styles.trackingId, { color: colors.textMuted }]}>
                        {item.trackingId || 'N/A'}
                    </Text>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <MapPin size={18} color={colors.accent} />
                        <View style={styles.infoCol}>
                            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                                {translate('deliveryTo')}
                            </Text>
                            <Text style={[styles.infoValue, { color: colors.foreground }]}>
                                {item.receiverName || 'N/A'}
                            </Text>
                            <Text style={[styles.infoSubValue, { color: colors.textMuted }]} numberOfLines={1}>
                                {item.deliveryAddress || 'N/A'}
                            </Text>
                        </View>
                    </View>

                    {item.items && item.items.length > 0 && (
                        <View style={styles.infoRow}>
                            <Package size={18} color={colors.accent} />
                            <View style={styles.infoCol}>
                                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                                    {translate('items')}
                                </Text>
                                <Text style={[styles.infoSubValue, { color: colors.textMuted }]} numberOfLines={1}>
                                    {Array.isArray(item.items)
                                        ? item.items.map((i: any) => typeof i === 'string' ? i : (i?.name || i?.title || String(i))).join(', ')
                                        : String(item.items)}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                        <Clock size={14} color={colors.textMuted} />
                        <Text style={[styles.dateText, { color: colors.textMuted }]}>
                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : ''}
                        </Text>
                    </View>
                    <View style={styles.footerRight}>
                        <Text style={[styles.trackText, { color: colors.accent }]}>
                            {translate('track')} →
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack}>
                        <ArrowLeft color={colors.foreground} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                        {translate('myShipments') || 'My Shipments'}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>
                <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft color={colors.foreground} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                    {translate('myShipments') || 'My Shipments'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'all' && { borderBottomColor: colors.foreground, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('all')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'all' ? colors.foreground : colors.textMuted }]}>
                        {String(translate('all') || 'TOUT').toUpperCase()} ({shipments?.length || 0})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && { borderBottomColor: colors.foreground, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'pending' ? colors.foreground : colors.textMuted }]}>
                        {String(translate('pending') || 'EN ATTENTE').toUpperCase()} ({shipments?.filter(s => {
                            const st = s?.status?.toLowerCase() || '';
                            return st !== 'delivered' && st !== 'cancelled';
                        })?.length || 0})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'delivered' && { borderBottomColor: colors.foreground, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('delivered')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'delivered' ? colors.foreground : colors.textMuted }]}>
                        {String(translate('delivered') || 'LIVRÉ').toUpperCase()} ({shipments?.filter(s => (s?.status?.toLowerCase() || '') === 'delivered')?.length || 0})
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredShipments}
                renderItem={renderShipment}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            setLoading(true);
                        }}
                        tintColor={colors.accent}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Package size={64} color={colors.border} />
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                            {translate('noShipments') || 'No shipments yet'}
                        </Text>
                        <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
                            {translate('createFirstShipment') || 'Create your first shipment to get started'}
                        </Text>
                    </View>
                }
            />
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
        paddingTop: 60,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
    },
    list: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
    },
    trackingId: {
        fontSize: 12,
        fontWeight: '700',
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
        fontSize: 14,
        fontWeight: '800',
    },
    infoSubValue: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '500',
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trackText: {
        fontSize: 13,
        fontWeight: '800',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        gap: 10,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptySubText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});
