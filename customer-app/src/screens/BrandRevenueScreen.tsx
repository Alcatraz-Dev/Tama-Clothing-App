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
    Clock,
    CheckCircle,
    XCircle,
    DollarSign,
    Package,
    AlertCircle,
    Wallet,
    CreditCard,
    Coins,
    Building2,
    MapPin,
    ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../context/ThemeContext';
import { auth } from '../api/firebase';
import {
    subscribeToWallet,
    subscribeToTransactions,
    getOrCreateWallet,
    requestWithdrawal,
    type Wallet as WalletType,
    type CODTransaction,
    type WithdrawalMethod,
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
    const [withdrawStep, setWithdrawStep] = useState<'method' | 'details'>('method');
    const [withdrawMethod, setWithdrawMethod] = useState<WithdrawalMethod | null>(null);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    // Stripe
    const [stripeEmail, setStripeEmail] = useState('');
    // Crypto
    const [cryptoCoin, setCryptoCoin] = useState('USDT_TRC20');
    const [cryptoAddress, setCryptoAddress] = useState('');
    // Bank
    const [iban, setIban] = useState('');
    const [bankName, setBankName] = useState('');
    // Post
    const [postFullName, setPostFullName] = useState('');
    const [postAddress, setPostAddress] = useState('');
    const [postPostal, setPostPostal] = useState('');
    const [postCity, setPostCity] = useState('');
    const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

    const uid = auth.currentUser?.uid;
    const brandId = profileData?.brandId || uid || '';
    const brandName = profileData?.brandName || profileData?.displayName || 'Brand';

    const resetWithdrawModal = () => {
        setWithdrawModalVisible(false);
        setWithdrawStep('method');
        setWithdrawMethod(null);
        setWithdrawAmount('');
        setStripeEmail('');
        setCryptoCoin('USDT_TRC20');
        setCryptoAddress('');
        setIban('');
        setBankName('');
        setPostFullName('');
        setPostAddress('');
        setPostPostal('');
        setPostCity('');
    };

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert(t('error') || 'Error', 'Enter a valid amount');
            return;
        }
        if (amount < 10) {
            Alert.alert(t('error') || 'Error', 'Minimum withdrawal is 10.00 TND');
            return;
        }
        if (!wallet || amount > wallet.balance) {
            Alert.alert(t('error') || 'Error', 'Insufficient balance');
            return;
        }

        // Per-method validation
        if (withdrawMethod === 'stripe' && !stripeEmail.trim()) {
            Alert.alert(t('error') || 'Error', 'Please enter your Stripe-linked email');
            return;
        }
        if (withdrawMethod === 'crypto' && (!cryptoAddress.trim() || !cryptoCoin)) {
            Alert.alert(t('error') || 'Error', 'Please enter your crypto wallet address');
            return;
        }
        if (withdrawMethod === 'bank_transfer' && (!iban.trim() || !bankName.trim())) {
            Alert.alert(t('error') || 'Error', 'Please enter your IBAN and bank name');
            return;
        }
        if (withdrawMethod === 'post_office' && (!postFullName.trim() || !postAddress.trim() || !postPostal.trim() || !postCity.trim())) {
            Alert.alert(t('error') || 'Error', 'Please fill all postal delivery fields');
            return;
        }

        setSubmittingWithdraw(true);
        try {
            const details: any = { method: withdrawMethod };
            if (withdrawMethod === 'stripe') details.stripeEmail = stripeEmail.trim();
            if (withdrawMethod === 'crypto') { details.cryptoCoin = cryptoCoin; details.cryptoAddress = cryptoAddress.trim(); }
            if (withdrawMethod === 'bank_transfer') { details.iban = iban.trim(); details.bankName = bankName.trim(); }
            if (withdrawMethod === 'post_office') {
                details.fullName = postFullName.trim();
                details.address = postAddress.trim();
                details.postalCode = postPostal.trim();
                details.city = postCity.trim();
            }
            await requestWithdrawal(wallet.id, brandId, amount, details, 'brand');
            Alert.alert(
                t('success') || 'Success',
                'Withdrawal request sent!\nAdmin will process it shortly.',
            );
            resetWithdrawModal();
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

            {/* ─── Withdrawal Modal ─── */}
            <Modal visible={withdrawModalVisible} animationType="slide" transparent>
                <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#13121F' : '#FFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>

                        {/* Title row */}
                        <View style={styles.modalHeaderRow}>
                            {withdrawStep === 'details' && (
                                <TouchableOpacity onPress={() => setWithdrawStep('method')} style={styles.modalBackBtn}>
                                    <ArrowLeft size={18} color={colors.foreground} />
                                </TouchableOpacity>
                            )}
                            <Text style={[styles.modalTitle, { color: colors.foreground, flex: 1 }]}>
                                {withdrawStep === 'method' ? (t('chooseMethod') || 'Choose Method') : (t('withdrawFunds') || 'Withdraw Funds')}
                            </Text>
                            <TouchableOpacity onPress={resetWithdrawModal}>
                                <XCircle size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalSubtitle, { color: colors.textMuted, marginBottom: 16 }]}>
                            {t('availableBalance') || 'Available:'} <Text style={{ color: '#10B981', fontWeight: '800' }}>{(wallet?.balance ?? 0).toFixed(2)} TND</Text>{'  ·  Min: 10 TND'}
                        </Text>

                        {/* ── STEP 1: Method Picker ── */}
                        {withdrawStep === 'method' && (
                            <View style={{ gap: 10 }}>
                                {([
                                    { key: 'stripe' as WithdrawalMethod, label: 'Stripe', sub: t('payoutStripe') === 'payoutStripe' || !t('payoutStripe') ? 'Retrait vers Stripe / السحب لـ Stripe' : t('payoutStripe'), icon: CreditCard, color: '#6772E5' },
                                    { key: 'crypto' as WithdrawalMethod, label: 'Crypto', sub: 'USDT, BTC, ETH & more', icon: Coins, color: '#F7931A' },
                                    { key: 'bank_transfer' as WithdrawalMethod, label: t('bankTransfer') === 'bankTransfer' || !t('bankTransfer') ? 'Virement Bancaire / تحويل بنكي' : t('bankTransfer'), sub: t('enterIban') === 'enterIban' || !t('enterIban') ? 'Saisissez votre IBAN / حط الـ IBAN متاعك' : t('enterIban'), icon: Building2, color: '#10B981' },
                                    { key: 'post_office' as WithdrawalMethod, label: t('postOffice') === 'postOffice' || !t('postOffice') ? 'La Poste / البريد' : t('postOffice'), sub: t('receivePostal') === 'receivePostal' || !t('receivePostal') ? 'Mandat postal / حوالة بريدية' : t('receivePostal'), icon: MapPin, color: '#F59E0B' },
                                ] as const).map(({ key, label, sub, icon: Icon, color }) => (
                                    <TouchableOpacity
                                        key={key}
                                        style={[styles.methodRow, {
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                            borderColor: withdrawMethod === key ? color : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'),
                                            borderWidth: withdrawMethod === key ? 2 : 1,
                                        }]}
                                        onPress={() => { setWithdrawMethod(key); setWithdrawStep('details'); }}
                                    >
                                        <View style={[styles.methodIcon, { backgroundColor: color + '20' }]}>
                                            <Icon size={20} color={color} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.methodLabel, { color: colors.foreground }]}>{label}</Text>
                                            <Text style={[styles.methodSub, { color: colors.textMuted }]}>{sub}</Text>
                                        </View>
                                        <ChevronRight size={16} color={colors.textMuted} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* ── STEP 2: Amount + Method Details ── */}
                        {withdrawStep === 'details' && (
                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }}>
                                {/* Amount */}
                                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Montant (TND)</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.foreground, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
                                    placeholder="Ex: 150"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="numeric"
                                    value={withdrawAmount}
                                    onChangeText={setWithdrawAmount}
                                    autoFocus
                                />

                                {/* Stripe fields */}
                                {withdrawMethod === 'stripe' && (
                                    <>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Stripe Account Email</Text>
                                        <TextInput
                                            style={[styles.input, { color: colors.foreground, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
                                            placeholder="your@email.com"
                                            placeholderTextColor={colors.textMuted}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            value={stripeEmail}
                                            onChangeText={setStripeEmail}
                                        />
                                        <Text style={[styles.fieldNote, { color: colors.textMuted }]}>
                                            {'Admin will initiate a Stripe transfer to this email. Make sure it is linked to a Stripe account.'}
                                        </Text>
                                    </>
                                )}

                                {/* Crypto fields */}
                                {withdrawMethod === 'crypto' && (
                                    <>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Cryptocurrency</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                                            {(['USDT_TRC20', 'USDT_ERC20', 'BTC', 'ETH'] as const).map((coin) => (
                                                <TouchableOpacity
                                                    key={coin}
                                                    onPress={() => setCryptoCoin(coin)}
                                                    style={[styles.coinChip, {
                                                        backgroundColor: cryptoCoin === coin ? '#F7931A' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
                                                        borderColor: cryptoCoin === coin ? '#F7931A' : 'transparent',
                                                    }]}
                                                >
                                                    <Text style={{ fontSize: 12, fontWeight: '700', color: cryptoCoin === coin ? '#FFF' : colors.textMuted }}>{coin.replace('_', ' ')}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Your Wallet Address</Text>
                                        <TextInput
                                            style={[styles.input, { color: colors.foreground, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', fontFamily: 'monospace', fontSize: 12 }]}
                                            placeholder={cryptoCoin === 'BTC' ? '1A1zP1eP5QGefi...' : '0x71C7656EC7ab...'}
                                            placeholderTextColor={colors.textMuted}
                                            autoCapitalize="none"
                                            value={cryptoAddress}
                                            onChangeText={setCryptoAddress}
                                        />
                                        <Text style={[styles.fieldNote, { color: '#F59E0B' }]}>
                                            {'⚠ Double-check your address. Crypto transfers are irreversible.'}
                                        </Text>
                                    </>
                                )}

                                {/* Bank fields */}
                                {withdrawMethod === 'bank_transfer' && (
                                    <>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Nom de la banque</Text>
                                        <TextInput
                                            style={[styles.input, { color: colors.foreground, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
                                            placeholder="Ex: BNA, STB, Attijari..."
                                            placeholderTextColor={colors.textMuted}
                                            value={bankName}
                                            onChangeText={setBankName}
                                        />
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>IBAN</Text>
                                        <TextInput
                                            style={[styles.input, { color: colors.foreground, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', fontFamily: 'monospace' }]}
                                            placeholder="TN59 XXXX XXXX XXXX XXXX XXXX"
                                            placeholderTextColor={colors.textMuted}
                                            autoCapitalize="characters"
                                            value={iban}
                                            onChangeText={setIban}
                                        />
                                    </>
                                )}

                                {/* Post Office fields */}
                                {withdrawMethod === 'post_office' && (
                                    <>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Nom complet</Text>
                                        <TextInput
                                            style={[styles.input, { color: colors.foreground, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
                                            placeholder="Prénom Nom"
                                            placeholderTextColor={colors.textMuted}
                                            value={postFullName}
                                            onChangeText={setPostFullName}
                                        />
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Adresse</Text>
                                        <TextInput
                                            style={[styles.input, { color: colors.foreground, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
                                            placeholder="Rue, N°, Quartier..."
                                            placeholderTextColor={colors.textMuted}
                                            multiline
                                            numberOfLines={2}
                                            value={postAddress}
                                            onChangeText={setPostAddress}
                                        />
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Code postal</Text>
                                                <TextInput
                                                    style={[styles.input, { color: colors.foreground, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
                                                    placeholder="1000"
                                                    placeholderTextColor={colors.textMuted}
                                                    keyboardType="numeric"
                                                    value={postPostal}
                                                    onChangeText={setPostPostal}
                                                />
                                            </View>
                                            <View style={{ flex: 1.6 }}>
                                                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Ville</Text>
                                                <TextInput
                                                    style={[styles.input, { color: colors.foreground, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
                                                    placeholder="Tunis"
                                                    placeholderTextColor={colors.textMuted}
                                                    value={postCity}
                                                    onChangeText={setPostCity}
                                                />
                                            </View>
                                        </View>
                                    </>
                                )}

                                {/* Actions */}
                                <View style={[styles.modalActions, { marginTop: 8 }]}>
                                    <TouchableOpacity
                                        style={[styles.modalBtn, styles.cancelBtn, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}
                                        onPress={resetWithdrawModal}
                                        disabled={submittingWithdraw}
                                    >
                                        <Text style={[styles.modalBtnText, { color: colors.foreground }]}>{t('cancel') || 'Annuler'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalBtn, styles.submitBtn, { opacity: submittingWithdraw ? 0.6 : 1 }]}
                                        onPress={handleWithdraw}
                                        disabled={submittingWithdraw}
                                    >
                                        {submittingWithdraw
                                            ? <ActivityIndicator size="small" color="#FFF" />
                                            : <Text style={[styles.modalBtnText, { color: '#FFF' }]}>{t('confirm') || 'Confirmer'}</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
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

    // Withdrawal Button
    withdrawBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFF', paddingVertical: 12, borderRadius: 12, marginTop: 18, gap: 8,
    },
    withdrawBtnText: { fontSize: 14, fontWeight: '800' },
    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalContent: {
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingBottom: 48, borderTopWidth: 1,
    },
    modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    modalBackBtn: { padding: 4 },
    modalTitle: { fontSize: 17, fontWeight: '800' },
    modalSubtitle: { fontSize: 13, fontWeight: '600' },
    // Method picker
    methodRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        padding: 14, borderRadius: 16,
    },
    methodIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    methodLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    methodSub: { fontSize: 11, fontWeight: '500' },
    // Fields
    fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, marginBottom: 6, marginTop: 4 },
    input: {
        height: 50, borderWidth: 1, borderRadius: 12,
        paddingHorizontal: 14, fontSize: 15, fontWeight: '600',
        marginBottom: 14,
    },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    cancelBtn: { borderWidth: 1 },
    submitBtn: { backgroundColor: '#6C63FF' },
    modalBtnText: { fontSize: 15, fontWeight: '700' },
    coinChip: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1.5,
    },
    fieldNote: { fontSize: 11, fontWeight: '500', lineHeight: 16, marginTop: -8, marginBottom: 12 },

});

