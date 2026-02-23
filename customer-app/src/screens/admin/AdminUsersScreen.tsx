import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    Modal,
    ScrollView,
    Alert,
    ActivityIndicator,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    ChevronLeft,
    X,
    Search,
    Settings,
    ChevronDown,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Shield,
    Trash2,
    Users as UsersIcon,
    CheckCircle2,
} from 'lucide-react-native';
import {
    collection,
    getDocs,
    query,
    updateDoc,
    doc,
    deleteDoc,
} from 'firebase/firestore';
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import * as Animatable from 'react-native-animatable';
import {
    AdminCard,
    SectionLabel,
    InputLabel,
    AdminChip,
    StatusBadge,
    EmptyState,
    AdminHeader,
} from '../../components/admin/AdminUI';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getInitials = (name: string) => {
    if (!name) return '??';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminUsersScreen({ onBack, t, language }: any) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';
    const [users, setUsers] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [roleModalVisible, setRoleModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userRole, setUserRole] = useState('customer');
    const [userBrandId, setUserBrandId] = useState('');

    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchData();
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            const snap = await getDocs(collection(db, 'brands'));
            setBrands(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error(e);
        }
    };

    const fetchData = async () => {
        try {
            const usersSnap = await getDocs(query(collection(db, 'users')));
            const allUsers = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
            setUsers(allUsers.filter((u: any) => u.role !== 'admin'));

            const ordersSnap = await getDocs(collection(db, 'orders'));
            setOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getUserStats = (user: any) => {
        if (user.role === 'brand_owner' && user.brandId) {
            const brandOrders = orders.filter(
                (o) => o.items && o.items.some((i: any) => i.brandId === user.brandId)
            );
            const totalRevenue = brandOrders.reduce((sum, o) => {
                const orderRevenue = o.items
                    .filter((i: any) => i.brandId === user.brandId)
                    .reduce(
                        (s: number, i: any) =>
                            s + (parseFloat(i.price) || 0) * (i.quantity || 1),
                        0
                    );
                return sum + orderRevenue;
            }, 0);
            const completedOrders = brandOrders.filter(
                (o) => o.status === 'delivered'
            ).length;
            return {
                totalOrders: brandOrders.length,
                totalSpent: totalRevenue,
                completedOrders,
            };
        } else {
            const userOrders = orders.filter((o) => o.userId === user.uid);
            const totalSpent = userOrders.reduce(
                (sum, o) => sum + (parseFloat(o.total) || 0),
                0
            );
            const completedOrders = userOrders.filter(
                (o) => o.status === 'delivered'
            ).length;
            return {
                totalOrders: userOrders.length,
                totalSpent,
                completedOrders,
            };
        }
    };

    const openRoleEdit = (user: any) => {
        setSelectedUser(user);
        setUserRole(user.role || 'customer');
        setUserBrandId(user.brandId || '');
        setRoleModalVisible(true);
    };

    const updateRoleAndBrand = async () => {
        if (!selectedUser) return;
        try {
            const b = brands.find((b) => b.id === userBrandId);
            const isBrandRole = ['brand_owner', 'nor_kam', 'admin'].includes(userRole);
            const updates: any = {
                role: userRole,
                brandId: isBrandRole ? userBrandId : null,
                brandName: isBrandRole && b ? b.name?.fr || b.name : null,
            };
            await updateDoc(doc(db, 'users', selectedUser.uid), updates);
            setUsers(
                users.map((u) => (u.uid === selectedUser.uid ? { ...u, ...updates } : u))
            );
            setRoleModalVisible(false);
            Alert.alert(t('successTitle'), t('accountUpdated'));
        } catch (e) {
            console.error(e);
            Alert.alert(t('error'), t('updateFailed'));
        }
    };

    const toggleBan = async (user: any) => {
        const action = user.isBanned ? 'unban' : 'ban';
        Alert.alert(
            t(action + 'User'),
            t('confirm' + action.charAt(0).toUpperCase() + action.slice(1)),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t(action),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'users', user.uid), {
                                isBanned: !user.isBanned,
                            });
                            setUsers(
                                users.map((u) =>
                                    u.uid === user.uid ? { ...u, isBanned: !user.isBanned } : u
                                )
                            );
                            Alert.alert(t('successTitle'), t('accountUpdated'));
                        } catch (err) {
                            console.error(err);
                            Alert.alert(t('error'), t('updateFailed'));
                        }
                    },
                },
            ]
        );
    };

    const deleteUser = async (user: any) => {
        Alert.alert(t('deleteUser'), t('confirmDeleteUser'), [
            { text: t('cancel'), style: 'cancel' },
            {
                text: t('delete'),
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'users', user.uid));
                        setUsers(users.filter((u) => u.uid !== user.uid));
                        Alert.alert(t('successTitle'), t('accountUpdated'));
                    } catch (err) {
                        console.error(err);
                        Alert.alert(t('error'), t('updateFailed'));
                    }
                },
            },
        ]);
    };

    const filteredUsers = users.filter((u) => {
        const q = searchQuery.toLowerCase();
        return (
            (u.fullName || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.phone || '').includes(q)
        );
    });

    const totalCustomers = users.length;
    const totalRevenue = users.reduce((sum, u) => {
        if (u.role === 'admin' || u.role === 'brand_owner') return sum;
        return sum + getUserStats(u).totalSpent;
    }, 0);
    const bannedCount = users.filter((u) => u.isBanned).length;
    const iconColor = theme === 'dark' ? '#FFF' : '#000';
    // ─── Render ──────────────────────────────────────────────────────────────────
    return (
        <View style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader title={t('clients')} onBack={onBack} />

            <Animated.FlatList
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                data={filteredUsers}
                contentContainerStyle={[sc.listContent, { paddingTop: insets.top + 80 }]}
                keyExtractor={(item) => item.uid}
                ListHeaderComponent={
                    <View style={{ marginBottom: 15 }}>
                        {/* Stats Grid */}
                        <View style={sc.statsGrid}>
                            <View style={[sc.statCard, { backgroundColor: theme === 'dark' ? '#121218' : '#F9F9FB', borderColor: colors.border }]}>
                                <SectionLabel text={t('total')} style={{ marginBottom: 4 }} />
                                <Text style={[sc.statVal, { color: colors.foreground }]}>{totalCustomers}</Text>
                            </View>
                            <View style={[sc.statCard, { backgroundColor: theme === 'dark' ? '#121218' : '#F9F9FB', borderColor: colors.border }]}>
                                <SectionLabel text={t('revenue')} style={{ marginBottom: 4 }} />
                                <Text style={[sc.statVal, { color: colors.foreground }]}>{totalRevenue.toFixed(0)} TND</Text>
                            </View>
                            {bannedCount > 0 && (
                                <View style={[sc.statCard, { backgroundColor: theme === 'dark' ? '#2A1212' : '#FEF2F2', borderColor: '#EF4444' }]}>
                                    <SectionLabel text={t('banned')} style={{ color: '#EF4444', marginBottom: 4 }} />
                                    <Text style={[sc.statVal, { color: '#EF4444' }]}>{bannedCount}</Text>
                                </View>
                            )}
                        </View>

                        {/* Search */}
                        <View style={[sc.searchContainer, { backgroundColor: theme === 'dark' ? '#121218' : '#F2F2F7', borderColor: colors.border }]}>
                            <Search size={18} color={colors.textMuted} />
                            <TextInput
                                style={[sc.searchInput, { color: colors.foreground }]}
                                placeholder={t('searchClients')}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor={colors.textMuted}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <X size={16} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                }
                renderItem={({ item }) => {
                    const stats = getUserStats(item);
                    const isExpanded = expandedUser === item.uid;
                    const isBanned = item.isBanned === true;

                    return (
                        <AdminCard style={{
                            borderColor: isBanned ? '#EF4444' : colors.border,
                            borderWidth: isBanned ? 1.5 : 1,
                            padding: 14,
                        }}>
                            <TouchableOpacity
                                onPress={() => setExpandedUser(isExpanded ? null : item.uid)}
                                activeOpacity={0.7}
                            >
                                {/* User Info Row */}
                                <View style={sc.userRow}>
                                    <View style={[sc.avatarWrap, { backgroundColor: isBanned ? (theme === 'dark' ? '#311212' : '#FEE2E2') : (theme === 'dark' ? '#000' : '#F2F2F7') }]}>
                                        {item.avatarUrl ? (
                                            <Image source={{ uri: item.avatarUrl }} style={[sc.avatarImg, { opacity: isBanned ? 0.6 : 1 }]} />
                                        ) : (
                                            <Text style={[sc.initials, { color: isBanned ? '#EF4444' : colors.textMuted }]}>{getInitials(item.fullName)}</Text>
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                            <Text style={[sc.userName, { color: isBanned ? '#EF4444' : colors.foreground }]}>
                                                {item.fullName || 'Unknown'}
                                            </Text>
                                            {item.role === 'brand_owner' && (
                                                <View style={[sc.roleTag, { backgroundColor: colors.foreground }]}>
                                                    <Text style={[sc.roleTagText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{item.brandName?.toUpperCase() || 'OWNER'}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[sc.userSub, { color: colors.textMuted }]}>
                                            {item.email} • {t(item.role === 'brand_owner' ? 'brandOwner' : (item.role === 'nor_kam' ? 'norKam' : (item.role || 'customer'))).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <TouchableOpacity onPress={() => openRoleEdit(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                            <Settings size={18} color={colors.foreground} />
                                        </TouchableOpacity>
                                        <ChevronDown
                                            size={18}
                                            color={colors.textMuted}
                                            style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                                        />
                                    </View>
                                </View>

                                {/* Quick Stats Grid */}
                                <View style={[sc.statsRow, { borderTopColor: theme === 'dark' ? '#1A1A24' : '#F0F0F5' }]}>
                                    <View style={[sc.miniStat, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}>
                                        <Text style={[sc.miniStatLabel, { color: colors.textMuted }]}>{t('orders').toUpperCase()}</Text>
                                        <Text style={[sc.miniStatVal, { color: colors.foreground }]}>{stats.totalOrders}</Text>
                                    </View>
                                    <View style={[sc.miniStat, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}>
                                        <Text style={[sc.miniStatLabel, { color: colors.textMuted }]}>{t('completed').toUpperCase()}</Text>
                                        <Text style={[sc.miniStatVal, { color: '#10B981' }]}>{stats.completedOrders}</Text>
                                    </View>
                                    <View style={[sc.miniStat, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}>
                                        <Text style={[sc.miniStatLabel, { color: colors.textMuted }]}>{item.role === 'brand_owner' ? t('revenue').toUpperCase() : 'AVG'}</Text>
                                        <Text style={[sc.miniStatVal, { color: colors.foreground }]}>
                                            {item.role === 'brand_owner'
                                                ? stats.totalSpent.toFixed(0)
                                                : (stats.totalOrders > 0 ? (stats.totalSpent / stats.totalOrders).toFixed(0) : '0')} TND
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <Animatable.View animation="fadeIn" duration={300}>
                                    <View style={[sc.expandedContent, { borderTopColor: theme === 'dark' ? '#1A1A24' : '#F0F0F5' }]}>
                                        <SectionLabel text={t('contactInfo')} style={{ marginBottom: 12 }} />
                                        <View style={{ gap: 10 }}>
                                            <View style={sc.infoItem}>
                                                <Mail size={14} color={colors.textMuted} />
                                                <Text style={[sc.infoText, { color: colors.foreground }]}>{item.email}</Text>
                                            </View>
                                            {item.phone && (
                                                <View style={sc.infoItem}>
                                                    <Phone size={14} color={colors.textMuted} />
                                                    <Text style={[sc.infoText, { color: colors.foreground }]}>{item.phone}</Text>
                                                </View>
                                            )}
                                            {item.address && (
                                                <View style={sc.infoItem}>
                                                    <MapPin size={14} color={colors.textMuted} />
                                                    <Text style={[sc.infoText, { color: colors.foreground }]}>{item.address}</Text>
                                                </View>
                                            )}
                                            <View style={sc.infoItem}>
                                                <Calendar size={14} color={colors.textMuted} />
                                                <Text style={[sc.infoText, { color: colors.foreground }]}>
                                                    {t('joined')} {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR') : '—'}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Action Buttons */}
                                        <View style={sc.actionsRow}>
                                            <TouchableOpacity
                                                onPress={() => toggleBan(item)}
                                                style={[sc.actionBtn, {
                                                    backgroundColor: isBanned ? '#10B981' : (theme === 'dark' ? '#3F2B00' : '#FEF3C7'),
                                                }]}
                                            >
                                                <Shield size={16} color={isBanned ? '#FFF' : (theme === 'dark' ? '#FFD666' : '#D97706')} />
                                                <Text style={[sc.actionBtnText, { color: isBanned ? '#FFF' : (theme === 'dark' ? '#FFD666' : '#D97706') }]}>
                                                    {isBanned ? t('unban').toUpperCase() : t('banUser').toUpperCase()}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => deleteUser(item)}
                                                style={[sc.actionBtn, { backgroundColor: theme === 'dark' ? '#311212' : '#FEE2E2' }]}
                                            >
                                                <Trash2 size={16} color="#EF4444" />
                                                <Text style={[sc.actionBtnText, { color: '#EF4444' }]}>{t('delete').toUpperCase()}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Animatable.View>
                            )}
                        </AdminCard>
                    );
                }}
                ListEmptyComponent={
                    <EmptyState message={t('noClients')} icon={<UsersIcon size={40} color={colors.textMuted} />} />
                }
            />

            {/* Role Management Modal */}
            <Modal visible={roleModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[sc.modalContainer, { backgroundColor: theme === 'dark' ? '#0A0A0F' : '#F9F9F9' }]}>
                    <SafeAreaView style={{ backgroundColor: theme === 'dark' ? '#0D0D14' : '#FFF' }}>
                        <View style={[sc.modalHeader, { borderBottomColor: theme === 'dark' ? '#1A1A24' : '#F0F0F5' }]}>
                            <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                                <Text style={[sc.modalAction, { color: colors.textMuted }]}>{t('cancel').toUpperCase()}</Text>
                            </TouchableOpacity>
                            <Text style={[sc.modalTitle, { color: colors.foreground }]}>{t('assignRole').toUpperCase()}</Text>
                            <TouchableOpacity onPress={updateRoleAndBrand}>
                                <Text style={[sc.modalAction, { color: colors.foreground, fontWeight: '900' }]}>{t('save').toUpperCase()}</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>

                    <ScrollView contentContainerStyle={sc.modalScroll}>
                        <View style={sc.modalHero}>
                            <View style={[sc.modalAvatar, { backgroundColor: theme === 'dark' ? '#1A1A24' : '#F2F2F7' }]}>
                                <UsersIcon size={32} color={colors.foreground} />
                            </View>
                            <Text style={[sc.modalUserName, { color: colors.foreground }]}>{selectedUser?.fullName}</Text>
                            <Text style={[sc.modalUserEmail, { color: colors.textMuted }]}>{selectedUser?.email}</Text>
                        </View>

                        <InputLabel text={t('role').toUpperCase()} />
                        <View style={sc.chipsWrap}>
                            {['customer', 'brand_owner', 'nor_kam', 'admin', 'editor', 'support'].map((r) => (
                                <AdminChip
                                    key={r}
                                    label={t(r === 'brand_owner' ? 'brandOwner' : (r === 'nor_kam' ? 'norKam' : r)).toUpperCase()}
                                    selected={userRole === r}
                                    onPress={() => setUserRole(r)}
                                />
                            ))}
                        </View>

                        {['brand_owner', 'nor_kam', 'admin'].includes(userRole) && (
                            <>
                                <InputLabel text={t('selectBrand').toUpperCase()} />
                                <View style={{ gap: 10 }}>
                                    {brands.map((b) => (
                                        <TouchableOpacity
                                            key={b.id}
                                            onPress={() => setUserBrandId(b.id)}
                                            style={[
                                                sc.brandItem,
                                                {
                                                    borderColor: userBrandId === b.id ? colors.foreground : colors.border,
                                                    backgroundColor: userBrandId === b.id ? (theme === 'dark' ? '#1A1A24' : '#F2F2F7') : 'transparent',
                                                }
                                            ]}
                                        >
                                            <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>{b.name?.fr || b.name}</Text>
                                            {userBrandId === b.id && <CheckCircle2 size={18} color={colors.foreground} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
    root: { flex: 1 },
    header: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 4 },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
    backBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    hSep: { height: StyleSheet.hairlineWidth },
    listContent: { padding: 20, paddingBottom: 100 },

    // Stats Grid
    statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    statCard: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1 },
    statVal: { fontSize: 20, fontWeight: '900' },

    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 15,
        height: 48,
        borderWidth: 1,
        gap: 10,
    },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },

    // User Item
    userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
    avatarWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImg: { width: 48, height: 48 },
    initials: { fontWeight: '900', fontSize: 15 },
    userName: { fontWeight: '800', fontSize: 15 },
    userSub: { fontSize: 11, marginTop: 2 },
    roleTag: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    roleTagText: { fontSize: 8, fontWeight: '900' },

    statsRow: {
        flexDirection: 'row',
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    miniStat: { flex: 1, borderRadius: 10, padding: 8 },
    miniStatLabel: { fontSize: 8, fontWeight: '800', marginBottom: 4 },
    miniStatVal: { fontSize: 14, fontWeight: '900' },

    // Expanded
    expandedContent: { marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoText: { fontSize: 13, fontWeight: '600', flex: 1 },

    actionsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
    actionBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionBtnText: { fontWeight: '900', fontSize: 10 },

    // Modal
    modalContainer: { flex: 1 },
    modalHeader: {
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    modalTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
    modalAction: { fontSize: 10, fontWeight: '700' },
    modalScroll: { padding: 25 },
    modalHero: { alignItems: 'center', marginBottom: 30 },
    modalAvatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    modalUserName: { fontSize: 18, fontWeight: '900' },
    modalUserEmail: { fontSize: 13, marginTop: 2 },

    chipsWrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
    brandItem: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});
