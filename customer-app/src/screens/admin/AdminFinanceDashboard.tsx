import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Alert,
} from 'react-native';
import {
    ArrowLeft,
    DollarSign,
    TrendingUp,
    Package,
    Activity,
    Building2,
    Clock,
    CheckCircle,
    XCircle,
    Wallet,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';
import { db } from '../../api/firebase';
import { collection, query, where, orderBy, getDocs, limit, onSnapshot, doc, DocumentSnapshot, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import {
    getPlatformWalletSummary,
    getAllBrandRevenues,
    type Wallet as WalletType,
    type CODTransaction,
    PLATFORM_WALLET_ID,
} from '../../services/codFinancialService';

interface WithdrawalRequest {
    id: string;
    brandId: string;
    walletId: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    bankDetails?: string;
    requestedAt: any;
    processedAt?: any;
    brandName?: string;
}

interface AdminFinanceDashboardProps {
    onBack: () => void;
    t: (key: string) => string;
}

const { width } = Dimensions.get('window');

// ─── Stat Card (Small inside grid) ──────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent, colors, isDark }: any) {
    return (
        <View style={[styles.statCard, {
            backgroundColor: isDark ? '#111118' : '#FFF',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }]}>
            <View style={[styles.statIcon, { backgroundColor: accent + '18' }]}>
                <Icon size={20} color={accent} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit>
                {value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
        </View>
    );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────
export default function AdminFinanceDashboard({ onBack, t }: AdminFinanceDashboardProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';

    const [platformWallet, setPlatformWallet] = useState<WalletType | null>(null);
    const [brands, setBrands] = useState<{ brandId: string; brandName: string; totalRevenue: number }[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<CODTransaction[]>([]);
    const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [stats, setStats] = useState({
        pendingCOD: 0,
        totalDeliveries: 0,
    });

    const loadData = async () => {
        try {
            // 1. Platform Wallet
            const wallet = await getPlatformWalletSummary();
            setPlatformWallet(wallet);

            // 2. All Brands Revenue
            const brandRev = await getAllBrandRevenues();
            setBrands(brandRev.slice(0, 10)); // Top 10 for dashboard

            // 3. Stats (pending COD across all)
            const pendingSnap = await getDocs(query(
                collection(db, 'transactions'),
                where('status', '==', 'pending'),
            ));
            const pendingTotal = pendingSnap.docs.reduce((acc, doc) => acc + (doc.data().codAmount || 0), 0);
            const deliveryCount = pendingSnap.empty ? 0 : pendingSnap.size; // Just an estimate of pending

            setStats({
                pendingCOD: pendingTotal,
                totalDeliveries: deliveryCount,
            });

            // 4. Recent completed transactions
            const txSnap = await getDocs(query(
                collection(db, 'transactions'),
                where('status', '==', 'completed'),
                orderBy('completedAt', 'desc'),
                limit(10)
            ));
            setRecentTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() } as CODTransaction)));

        } catch (e) {
            console.error('[AdminFinance] Error loading data:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Approve a withdrawal request
    const handleApproveWithdrawal = async (req: WithdrawalRequest) => {
        Alert.alert(
            t('approve') || 'Approve',
            `Approve ${req.amount.toFixed(2)} TND withdrawal?`,
            [
                { text: t('cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('approve') || 'Approve',
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'withdrawal_requests', req.id), {
                                status: 'approved',
                                processedAt: serverTimestamp(),
                            });
                            // Update wallet totalWithdrawn
                            await updateDoc(doc(db, 'wallets', req.walletId), {
                                totalWithdrawn: increment(req.amount),
                                updatedAt: serverTimestamp(),
                            });
                        } catch (e: any) {
                            Alert.alert(t('error') || 'Error', e.message);
                        }
                    },
                },
            ]
        );
    };

    // Reject a withdrawal request
    const handleRejectWithdrawal = async (req: WithdrawalRequest) => {
        Alert.alert(
            t('reject') || 'Reject',
            `Reject ${req.amount.toFixed(2)} TND withdrawal?`,
            [
                { text: t('cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('reject') || 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'withdrawal_requests', req.id), {
                                status: 'rejected',
                                processedAt: serverTimestamp(),
                            });
                            // Refund balance since we deducted at request time
                            await updateDoc(doc(db, 'wallets', req.walletId), {
                                balance: increment(req.amount),
                                updatedAt: serverTimestamp(),
                            });
                        } catch (e: any) {
                            Alert.alert(t('error') || 'Error', e.message);
                        }
                    },
                },
            ]
        );
    };

    useEffect(() => {
        loadData();

        // Listen to platform wallet updates live
        const unsub = onSnapshot(doc(db, 'wallets', PLATFORM_WALLET_ID), (docSnap) => {
            if (docSnap.exists()) {
                setPlatformWallet({ id: docSnap.id, ...docSnap.data() } as WalletType);
            }
        });

        // Listen to pending withdrawal requests
        const wdQuery = query(
            collection(db, 'withdrawal_requests'),
            where('status', '==', 'pending'),
            orderBy('requestedAt', 'desc'),
        );
        const unsubWd = onSnapshot(wdQuery, (snap) => {
            setWithdrawalRequests(
                snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<WithdrawalRequest, 'id'>) }))
            );
        });

        return () => { unsub(); unsubWd(); };
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack}>
                        <ArrowLeft color={colors.foreground} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                        {t('platformRevenue') || 'Platform Revenue'}
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
                    {t('platformRevenue') || 'Platform Revenue'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.accent} />
                }
            >
                {/* Main Platform Card */}
                <LinearGradient
                    colors={isDark ? ['#1B4332', '#081C15'] : ['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroTop}>
                        <View>
                            <Text style={styles.heroLabel}>Total Platform Revenue</Text>
                            <Text style={styles.heroAmount}>{(platformWallet?.totalEarned ?? 0).toFixed(2)} TND</Text>
                        </View>
                        <View style={[styles.heroIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <TrendingUp size={28} color="#FFF" />
                        </View>
                    </View>
                    <View style={styles.heroDivider} />
                    <View style={styles.heroBottom}>
                        <View style={styles.heroBottomItem}>
                            <Text style={styles.heroBottomLabel}>Current Wallet Balance</Text>
                            <Text style={styles.heroBottomValue}>{(platformWallet?.balance ?? 0).toFixed(2)} TND</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        label="Pending COD Total"
                        value={`${stats.pendingCOD.toFixed(2)} TND`}
                        icon={Clock}
                        accent="#F59E0B"
                        colors={colors}
                        isDark={isDark}
                    />
                    <StatCard
                        label="Pending Deliveries"
                        value={stats.totalDeliveries.toString()}
                        icon={Package}
                        accent="#6C63FF"
                        colors={colors}
                        isDark={isDark}
                    />
                </View>

                {/* Top Brands Table */}
                <View style={styles.sectionHeader}>
                    <Building2 size={18} color={colors.foreground} />
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Brands by Revenue</Text>
                </View>

                <View style={[styles.tableBlock, {
                    backgroundColor: isDark ? '#111118' : '#FFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                }]}>
                    {brands.length === 0 ? (
                        <Text style={{ color: colors.textMuted, padding: 20, textAlign: 'center' }}>No brand revenue found</Text>
                    ) : (
                        brands.map((b, i) => (
                            <View key={b.brandId} style={[styles.tableRow, { borderBottomWidth: i === brands.length - 1 ? 0 : 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                                <View style={[styles.rankBadge, { backgroundColor: i < 3 ? '#10B98115' : colors.border + '30' }]}>
                                    <Text style={[styles.rankText, { color: i < 3 ? '#10B981' : colors.textMuted }]}>#{i + 1}</Text>
                                </View>
                                <Text style={[styles.brandName, { color: colors.foreground }]} numberOfLines={1}>{b.brandName}</Text>
                                <Text style={[styles.brandRevenue, { color: colors.foreground }]}>{b.totalRevenue.toFixed(2)}</Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Recent Platform Transactions */}
                <View style={styles.sectionHeader}>
                    <Activity size={18} color={colors.foreground} />
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Platform Commissions</Text>
                </View>

                {recentTransactions.map(tx => (
                    <View key={tx.id} style={[styles.txCard, {
                        backgroundColor: isDark ? '#111118' : '#FFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }]}>
                        <View style={styles.txLeft}>
                            <View style={[styles.txIconBox, { backgroundColor: '#10B98115' }]}>
                                <CheckCircle size={16} color="#10B981" />
                            </View>
                            <View>
                                <Text style={[styles.txOrderId, { color: colors.foreground }]}>Order #{(tx.orderId || '').slice(-6)}</Text>
                                <Text style={[styles.txDate, { color: colors.textMuted }]}>
                                    {tx.completedAt?.toDate ? tx.completedAt.toDate().toLocaleString('fr-FR') : '—'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.txRight}>
                            <Text style={[styles.txAmount, { color: '#10B981' }]}>+{tx.platformCommission.toFixed(2)}</Text>
                            <Text style={[styles.txLabel, { color: colors.textMuted }]}>TND</Text>
                        </View>
                    </View>
                ))}

                {/* Withdrawal Requests */}
                <View style={styles.sectionHeader}>
                    <Wallet size={18} color={colors.foreground} />
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('withdrawalRequests') || 'Withdrawal Requests'}</Text>
                    {withdrawalRequests.length > 0 && (
                        <View style={[styles.wdBadge, { backgroundColor: '#F59E0B20' }]}>
                            <Text style={styles.wdBadgeText}>{withdrawalRequests.length}</Text>
                        </View>
                    )}
                </View>

                {withdrawalRequests.length === 0 ? (
                    <View style={[styles.wdEmpty, {
                        backgroundColor: isDark ? '#111118' : '#FFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }]}>
                        <CheckCircle size={32} color={colors.border} />
                        <Text style={[styles.wdEmptyText, { color: colors.textMuted }]}>
                            {t('noWithdrawalRequests') || 'No pending withdrawal requests'}
                        </Text>
                    </View>
                ) : (
                    withdrawalRequests.map(req => (
                        <View key={req.id} style={[styles.wdCard, {
                            backgroundColor: isDark ? '#111118' : '#FFF',
                            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                        }]}>
                            <View style={styles.wdCardTop}>
                                <View style={[styles.wdIcon, { backgroundColor: '#F59E0B18' }]}>
                                    <DollarSign size={18} color="#F59E0B" />
                                </View>
                                <View style={styles.wdInfo}>
                                    <Text style={[styles.wdAmount, { color: colors.foreground }]}>{req.amount.toFixed(2)} TND</Text>
                                    <Text style={[styles.wdBrand, { color: colors.textMuted }]}>
                                        Brand: {req.brandId.slice(0, 12)}...
                                    </Text>
                                    <Text style={[styles.wdDate, { color: colors.textMuted }]}>
                                        {req.requestedAt?.toDate ? req.requestedAt.toDate().toLocaleDateString('fr-FR') : '—'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.wdActions}>
                                <TouchableOpacity
                                    style={[styles.wdActionBtn, { backgroundColor: '#10B98115' }]}
                                    onPress={() => handleApproveWithdrawal(req)}
                                >
                                    <CheckCircle size={14} color="#10B981" />
                                    <Text style={[styles.wdActionText, { color: '#10B981' }]}>{t('approve') || 'Approve'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.wdActionBtn, { backgroundColor: '#EF444415' }]}
                                    onPress={() => handleRejectWithdrawal(req)}
                                >
                                    <XCircle size={14} color="#EF4444" />
                                    <Text style={[styles.wdActionText, { color: '#EF4444' }]}>{t('reject') || 'Reject'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 55, paddingBottom: 14,
    },
    headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    content: { paddingHorizontal: 16, paddingBottom: 100 },

    // Hero Card
    heroCard: {
        borderRadius: 24, padding: 24, marginBottom: 16,
        shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25, shadowRadius: 20, elevation: 8,
    },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    heroLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, marginBottom: 6 },
    heroAmount: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
    heroIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
    heroBottom: { flexDirection: 'row', gap: 20 },
    heroBottomItem: { flex: 1 },
    heroBottomLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 4 },
    heroBottomValue: { fontSize: 18, color: '#FFF', fontWeight: '800' },

    // Stats Grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    statCard: {
        flex: 1, minWidth: '46%', borderRadius: 18, padding: 16, borderWidth: 1,
    },
    statIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    statValue: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
    statLabel: { fontSize: 10, fontWeight: '600' },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 10 },
    sectionTitle: { fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },

    // Table
    tableBlock: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
    tableRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    rankBadge: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rankText: { fontSize: 11, fontWeight: '800' },
    brandName: { flex: 1, fontSize: 13, fontWeight: '700' },
    brandRevenue: { fontSize: 14, fontWeight: '800' },

    // Transaction Cards
    txCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10,
    },
    txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    txIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    txOrderId: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
    txDate: { fontSize: 10, fontWeight: '600' },
    txRight: { alignItems: 'flex-end' },
    txAmount: { fontSize: 15, fontWeight: '900' },
    txLabel: { fontSize: 9, fontWeight: '700', marginTop: 1 },

    // Withdrawal Requests
    wdBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    wdBadgeText: { fontSize: 11, fontWeight: '800', color: '#F59E0B' },
    wdEmpty: {
        alignItems: 'center', padding: 30, borderRadius: 16, borderWidth: 1,
        marginBottom: 24, gap: 10,
    },
    wdEmptyText: { fontSize: 13, fontWeight: '600' },
    wdCard: {
        borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    wdCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    wdIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    wdInfo: { flex: 1 },
    wdAmount: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
    wdBrand: { fontSize: 11, fontWeight: '600', marginBottom: 1 },
    wdDate: { fontSize: 10, fontWeight: '500' },
    wdActions: { flexDirection: 'row', gap: 10 },
    wdActionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, borderRadius: 12, gap: 6,
    },
    wdActionText: { fontSize: 13, fontWeight: '700' },
});
