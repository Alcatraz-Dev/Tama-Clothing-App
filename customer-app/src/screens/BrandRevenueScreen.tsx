import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import {
    ArrowLeft,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    DollarSign,
    Package,
    AlertCircle,
    Wallet,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../context/ThemeContext';
import { auth } from '../api/firebase';
import {
    subscribeToWallet,
    subscribeToTransactions,
    getOrCreateWallet,
    calculateOrderFinancials,
    requestWithdrawal,
    type Wallet as WalletType,
    type CODTransaction,
    COMMISSION_RATES,
} from '../services/codFinancialService';

interface BrandRevenueScreenProps {
    onBack: () => void;
    t: (key: string) => string;
    profileData?: any;
}

// ─── Status helpers ─────────────────────────────────────────────────────────────
function getTxStatusColor(status: string): string {
    switch (status) {
        case 'completed': return '#10B981';
        case 'pending': return '#F59E0B';
        case 'refunded': return '#8B5CF6';
        case 'failed': return '#EF4444';
        default: return '#6B7280';
    }
}

function getTxStatusIcon(status: string) {
    switch (status) {
        case 'completed': return CheckCircle;
        case 'pending': return Clock;
        case 'failed': return XCircle;
        default: return AlertCircle;
    }
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    accent,
    colors,
    theme,
}: any) {
    return (
        <View style={[styles.statCard, {
            backgroundColor: theme === 'dark' ? '#111118' : '#FFF',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }]}>
            <View style={[styles.statIcon, { backgroundColor: accent + '18' }]}>
                <Icon size={20} color={accent} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
            {sub ? <Text style={[styles.statSub, { color: accent }]}>{sub}</Text> : null}
        </View>
    );
}

// ─── Transaction Row ────────────────────────────────────────────────────────────
function TransactionRow({ tx, colors, theme, t }: { tx: CODTransaction; colors: any; theme: string; t: any }) {
    const StatusIcon = getTxStatusIcon(tx.status);
    const statusColor = getTxStatusColor(tx.status);

    const date = tx.createdAt?.toDate
        ? tx.createdAt.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    const typeLabel = tx.type === 'cod_settlement'
        ? (t('codSettlement') || 'COD Settlement')
        : tx.type;

    return (
        <View style={[styles.txRow, {
            backgroundColor: theme === 'dark' ? '#111118' : '#FFF',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        }]}>
            <View style={[styles.txIcon, { backgroundColor: statusColor + '15' }]}>
                <StatusIcon size={16} color={statusColor} />
            </View>

            <View style={styles.txBody}>
                <Text style={[styles.txType, { color: colors.foreground }]}>{typeLabel}</Text>
                <Text style={[styles.txOrderId, { color: colors.textMuted }]}>
                    {t('order') || 'Order'} #{(tx.orderId || '').slice(-8).toUpperCase()}
                </Text>
                <Text style={[styles.txDate, { color: colors.textMuted }]}>{date}</Text>
            </View>

            <View style={styles.txRight}>
                <Text style={[styles.txAmount, { color: tx.status === 'completed' ? '#10B981' : colors.foreground }]}>
                    +{tx.brandRevenue?.toFixed(2)} TND
                </Text>
                <View style={[styles.txStatus, { backgroundColor: statusColor + '18' }]}>
                    <Text style={[styles.txStatusText, { color: statusColor }]}>
                        {(t(tx.status) || tx.status).toUpperCase()}
                    </Text>
                </View>
            </View>
        </View>
    );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────
export default function BrandRevenueScreen({ onBack, t, profileData }: BrandRevenueScreenProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';

    const [wallet, setWallet] = useState<WalletType | null>(null);
    const [transactions, setTransactions] = useState<CODTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [walletId, setWalletId] = useState<string | null>(null);
    const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

    const uid = auth.currentUser?.uid;
    const brandId = profileData?.brandId || uid || '';
    const brandName = profileData?.brandName || profileData?.displayName || 'Brand';

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert(t('error') || 'Error', t('invalidAmount') || 'Invalid amount');
            return;
        }
        if (!wallet || amount > wallet.balance) {
            Alert.alert(t('error') || 'Error', t('insufficientBalance') || 'Insufficient balance');
            return;
        }

        setSubmittingWithdraw(true);
        try {
            await requestWithdrawal(wallet.id, brandId, amount);
            Alert.alert(t('success') || 'Success', t('withdrawalRequested') || 'Withdrawal requested successfully');
            setWithdrawModalVisible(false);
            setWithdrawAmount('');
        } catch (e: any) {
            console.error('Withdrawal error', e);
            Alert.alert(t('error') || 'Error', e.message);
        } finally {
            setSubmittingWithdraw(false);
        }
    };
    // Bootstrap wallet (create if not exists) then subscribe
    useEffect(() => {
        if (!brandId) { setLoading(false); return; }

        let unsubWallet: (() => void) | null = null;
        let unsubTxs: (() => void) | null = null;

        (async () => {
            const wId = await getOrCreateWallet(brandId, 'brand', brandName);
            setWalletId(wId);

            unsubWallet = subscribeToWallet(brandId, 'brand', (w) => {
                setWallet(w);
                setLoading(false);
                setRefreshing(false);
            });

            unsubTxs = subscribeToTransactions(wId, (txs) => {
                setTransactions(txs);
            });
        })();

        return () => {
            unsubWallet?.();
            unsubTxs?.();
        };
    }, [brandId]);

    // Demo financials for the info card
    const demoFinancials = calculateOrderFinancials(100, 8);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack}>
                        <ArrowLeft color={colors.foreground} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                        {t('brandRevenue') || 'Brand Revenue'}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>
                <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft color={colors.foreground} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                    {t('brandRevenue') || 'Brand Revenue'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => setRefreshing(true)}
                        tintColor={colors.accent}
                    />
                }
            >
                {/* Hero Balance Card */}
                <LinearGradient
                    colors={isDark ? ['#1E1B48', '#0F0E2E'] : ['#6C63FF', '#4C46B6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroTop}>
                        <View>
                            <Text style={styles.heroLabel}>{t('confirmedBalance') || 'Confirmed Balance'}</Text>
                            <Text style={styles.heroAmount}>{(wallet?.balance ?? 0).toFixed(2)} TND</Text>
                        </View>
                        <View style={styles.heroIcon}>
                            <Wallet size={28} color="#FFF" />
                        </View>
                    </View>
                    <View style={styles.heroDivider} />
                    <View style={styles.heroBottom}>
                        <View style={styles.heroBottomItem}>
                            <Text style={styles.heroBottomLabel}>{t('pending') || 'Pending'}</Text>
                            <Text style={styles.heroBottomValue}>{(wallet?.pendingBalance ?? 0).toFixed(2)} TND</Text>
                        </View>
                        <View style={styles.heroSep} />
                        <View style={styles.heroBottomItem}>
                            <Text style={styles.heroBottomLabel}>{t('totalEarned') || 'Total Earned'}</Text>
                            <Text style={styles.heroBottomValue}>{(wallet?.totalEarned ?? 0).toFixed(2)} TND</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.withdrawBtn} onPress={() => setWithdrawModalVisible(true)}>
                        <DollarSign size={16} color={isDark ? '#000' : '#6C63FF'} />
                        <Text style={[styles.withdrawBtnText, { color: isDark ? '#000' : '#6C63FF' }]}>{t('withdrawFunds') || 'Withdraw Funds'}</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        label={t('completedOrders') || 'Completed'}
                        value={transactions.filter(tx => tx.status === 'completed').length.toString()}
                        icon={CheckCircle}
                        accent="#10B981"
                        colors={colors}
                        theme={theme}
                    />
                    <StatCard
                        label={t('pendingOrders') || 'Pending'}
                        value={transactions.filter(tx => tx.status === 'pending').length.toString()}
                        icon={Clock}
                        accent="#F59E0B"
                        colors={colors}
                        theme={theme}
                    />
                    <StatCard
                        label={t('totalTransactions') || 'Transactions'}
                        value={transactions.length.toString()}
                        icon={Package}
                        accent="#6C63FF"
                        colors={colors}
                        theme={theme}
                    />
                    <StatCard
                        label={t('withdrawn') || 'Withdrawn'}
                        value={`${(wallet?.totalWithdrawn ?? 0).toFixed(2)} TND`}
                        icon={DollarSign}
                        accent="#EF4444"
                        colors={colors}
                        theme={theme}
                    />
                </View>

                {/* COD Commission Info Card */}
                <View style={[styles.infoCard, {
                    backgroundColor: isDark ? '#111118' : '#FFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                }]}>
                    <View style={styles.infoCardHeader}>
                        <TrendingUp size={16} color={colors.accent} />
                        <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>
                            {t('commissionBreakdown') || 'Commission Breakdown (Example 100 TND Order)'}
                        </Text>
                    </View>
                    {[
                        { label: t('orderTotal') || 'Order Total', value: `${demoFinancials.codAmount.toFixed(2)} TND`, color: colors.foreground },
                        { label: t('deliveryFeeLabel') || 'Delivery Fee', value: `-${demoFinancials.deliveryFee.toFixed(2)} TND`, color: '#EF4444' },
                        { label: t('platformCommission') || `Platform Commission (${(COMMISSION_RATES.platform * 100).toFixed(0)}%)`, value: `-${demoFinancials.platformCommission.toFixed(2)} TND`, color: '#EF4444' },
                        { label: t('brandRevenue') || 'Your Revenue', value: `${demoFinancials.brandRevenue.toFixed(2)} TND`, color: '#10B981' },
                    ].map((row, i) => (
                        <View key={i} style={[styles.infoRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderBottomWidth: i < 3 ? 1 : 0 }]}>
                            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{row.label}</Text>
                            <Text style={[styles.infoValue, { color: row.color }]}>{row.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Transaction History */}
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {t('transactionHistory') || 'Transaction History'}
                </Text>

                {transactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Package size={50} color={colors.border} />
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                            {t('noTransactions') || 'No transactions yet'}
                        </Text>
                        <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
                            {t('transactionsAppearHere') || 'Your COD transactions will appear here once orders are delivered.'}
                        </Text>
                    </View>
                ) : (
                    transactions.map((tx) => (
                        <TransactionRow
                            key={tx.id}
                            tx={tx}
                            colors={colors}
                            theme={theme}
                            t={t}
                        />
                    ))
                )}
            </ScrollView>

            <Modal visible={withdrawModalVisible} animationType="slide" transparent={true}>
                <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                        <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('withdrawFunds') || 'Withdraw Funds'}</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                            {t('availableBalance') || 'Available:'} {(wallet?.balance ?? 0).toFixed(2)} TND
                        </Text>

                        <TextInput
                            style={[styles.input, { color: colors.foreground, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
                            placeholder={t('enterAmount') || 'Enter amount'}
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                            value={withdrawAmount}
                            onChangeText={setWithdrawAmount}
                            autoFocus
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} onPress={() => setWithdrawModalVisible(false)} disabled={submittingWithdraw}>
                                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>{t('cancel') || 'Cancel'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.submitBtn, { opacity: submittingWithdraw ? 0.6 : 1 }]} onPress={handleWithdraw} disabled={submittingWithdraw}>
                                {submittingWithdraw ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={[styles.modalBtnText, { color: '#FFF' }]}>{t('confirm') || 'Confirm'}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 14,
    },
    headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    content: { paddingHorizontal: 16, paddingBottom: 100 },

    // Hero card
    heroCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
    },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    heroLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, marginBottom: 6 },
    heroAmount: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
    heroIcon: {
        width: 52, height: 52, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
    heroBottom: { flexDirection: 'row', gap: 20 },
    heroBottomItem: { flex: 1 },
    heroBottomLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 4 },
    heroBottomValue: { fontSize: 18, color: '#FFF', fontWeight: '800' },
    heroSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },

    // Stats grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    statCard: {
        flex: 1, minWidth: '44%',
        borderRadius: 18, padding: 16,
        borderWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    },
    statIcon: {
        width: 38, height: 38, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 10,
    },
    statValue: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
    statLabel: { fontSize: 11, fontWeight: '600' },
    statSub: { fontSize: 10, fontWeight: '700', marginTop: 2 },

    // Info card
    infoCard: {
        borderRadius: 20, padding: 18, borderWidth: 1, marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    infoCardTitle: { fontSize: 12, fontWeight: '800', flex: 1, letterSpacing: 0.3 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
    infoLabel: { fontSize: 12, fontWeight: '600' },
    infoValue: { fontSize: 13, fontWeight: '800' },

    // Section title
    sectionTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3, marginBottom: 12 },

    // Transaction row
    txRow: {
        flexDirection: 'row', alignItems: 'center',
        padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10,
        gap: 12,
    },
    txIcon: {
        width: 36, height: 36, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    txBody: { flex: 1 },
    txType: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
    txOrderId: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
    txDate: { fontSize: 10, fontWeight: '500' },
    txRight: { alignItems: 'flex-end', gap: 4 },
    txAmount: { fontSize: 14, fontWeight: '900' },
    txStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    txStatusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

    // Empty state
    emptyState: { alignItems: 'center', paddingTop: 40, gap: 12 },
    emptyText: { fontSize: 15, fontWeight: '700' },
    emptySubText: { fontSize: 12, fontWeight: '500', textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },

    // Withdrawal Modal & Button
    withdrawBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 18,
        gap: 8,
    },
    withdrawBtnText: { fontSize: 14, fontWeight: '800' },
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalContent: {
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 40, borderTopWidth: 1,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
    modalSubtitle: { fontSize: 14, fontWeight: '600', marginBottom: 20 },
    input: {
        height: 54, borderWidth: 1, borderRadius: 12,
        paddingHorizontal: 16, fontSize: 16, fontWeight: '600',
        marginBottom: 24,
    },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cancelBtn: { borderWidth: 1 },
    submitBtn: { backgroundColor: '#6C63FF' },
    modalBtnText: { fontSize: 15, fontWeight: '700' },
});
