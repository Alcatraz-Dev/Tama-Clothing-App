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
import { ArrowLeft, Package, MapPin, Clock, ChevronRight, Truck, CheckCircle, XCircle, Trash2, MapPinned } from 'lucide-react-native';
import { deliveryService } from '../services/deliveryService';
import { useAppTheme } from '../context/ThemeContext';
import { auth, db } from '../api/firebase';
import { collection, query, where, orderBy, onSnapshot, or } from 'firebase/firestore';

interface ShipmentItem {
    id: string;
    trackingId: string;
    status: string;
    receiverName: string;
    deliveryAddress: string;
    senderId?: string;
    receiverPhone?: string;
    deletedForCustomer?: boolean;
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
            // Use a simpler query to avoid Firestore index requirements
            // We'll filter client-side instead of using multiple where clauses
            const q = query(
                collection(db, 'Shipments'),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const shipmentsList = snapshot.docs
                    .map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            trackingId: data.trackingId || '',
                            status: data.status || 'Pending',
                            receiverName: data.receiverName || '',
                            deliveryAddress: data.deliveryAddress || '',
                            senderId: data.senderId || '',
                            receiverPhone: data.receiverPhone || '',
                            deletedForCustomer: data.deletedForCustomer || false,
                            items: data.items || [],
                            createdAt: data.createdAt,
                        };
                    })
                    // Client-side filtering to avoid composite index requirement
                    .filter(shipment => {
                        // Filter out deleted shipments
                        if (shipment.deletedForCustomer === true) return false;
                        
                        // Filter by sender or receiver
                        const isSender = shipment.senderId === auth.currentUser?.uid;
                        const isReceiver = profileData?.phone && 
                            shipment.receiverPhone === profileData.phone;
                        
                        return isSender || isReceiver;
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
    }, [profileData?.phone]);

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

    const handleDeleteShipment = (id: string) => {
        Alert.alert(
            translate('deleteOrder') || 'Delete Order',
            translate('confirmDeleteOrder') || 'Are you sure you want to delete this order from your history?',
            [
                { text: translate('cancel'), style: 'cancel' },
                {
                    text: translate('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deliveryService.deleteDelivery(id);
                        } catch (error) {
                            console.error('Error deleting shipment:', error);
                            Alert.alert(translate('error'), 'Failed to delete shipment');
                        }
                    }
                }
            ]
        );
    };

    const filteredShipments = (shipments || []).filter(s => {
        const status = s?.status?.toLowerCase() || '';
        if (activeTab === 'pending') return status !== 'delivered' && status !== 'cancelled' && status !== 'livré' && status !== 'annulé';
        if (activeTab === 'delivered') return status === 'delivered' || status === 'livré';
        return true;
    });

    const renderShipment = ({ item: shipment }: { item: ShipmentItem }) => {
        const StatusIcon = getStatusIcon(shipment.status);
        const canDelete = shipment.status?.toLowerCase() === 'delivered' ||
            shipment.status?.toLowerCase() === 'cancelled' ||
            shipment.status?.toLowerCase() === 'livré' ||
            shipment.status?.toLowerCase() === 'annulé';

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => shipment.trackingId && onTrackShipment(shipment.trackingId)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shipment.status) + '15' }]}>
                            <StatusIcon size={14} color={getStatusColor(shipment.status)} />
                            <Text style={[styles.statusText, { color: getStatusColor(shipment.status) }]}>
                                {translate((shipment.status?.toLowerCase() || 'pending').replace(/ /g, '_')) || shipment.status}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={[styles.trackingId, { color: colors.textMuted }]}>
                            #{shipment.id.slice(-6).toUpperCase()}
                        </Text>
                        {canDelete && (
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => handleDeleteShipment(shipment.id)}
                            >
                                <Trash2 size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.accent + '10' }]}>
                            <MapPinned size={18} color={colors.accent} />
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                                {translate('deliveryAddress')}
                            </Text>
                            <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={2}>
                                {shipment.deliveryAddress || 'N/A'}
                            </Text>
                        </View>
                    </View>

                    {shipment.items && shipment.items.length > 0 && (
                        <View style={styles.infoRow}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.accent + '10' }]}>
                                <Package size={18} color={colors.accent} />
                            </View>
                            <View style={styles.infoCol}>
                                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                                    {translate('items')} ({shipment.items.length})
                                </Text>
                                <Text style={[styles.infoSubValue, { color: colors.textMuted }]} numberOfLines={1}>
                                    {Array.isArray(shipment.items)
                                        ? shipment.items.map((i: any) => typeof i === 'string' ? i : (i?.name || i?.title || String(i))).join(', ')
                                        : String(shipment.items)}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={[styles.cardFooter, { borderTopColor: colors.border + '30' }]}>
                    <View style={styles.footerLeft}>
                        <Clock size={14} color={colors.textMuted} />
                        <Text style={[styles.dateText, { color: colors.textMuted }]}>
                            {shipment.createdAt?.toDate ? shipment.createdAt.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                        </Text>
                    </View>
                    <View style={[styles.trackBtn, { backgroundColor: colors.accent }]}>
                        <Text style={styles.trackBtnText}>
                            {translate('track')}
                        </Text>
                        <ChevronRight size={14} color={colors.accentForeground} />
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
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 11,
        fontWeight: '600',
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
        width:"100%",
        maxWidth:170
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    trackingId: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    deleteBtn: {
        padding: 4,
    },
    cardBody: {
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    iconContainer: {
        width: 30,
        height: 30,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoCol: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
    },
    infoSubValue: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
        opacity: 0.8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    dateText: {
        fontSize: 11,
        fontWeight: '600',
    },
    trackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    trackBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFF',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        gap: 10,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
        opacity: 0.7,
    },
});
