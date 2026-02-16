import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Alert, Image, Modal, TextInput, Animated } from 'react-native';
import { ChevronLeft, Coins, CreditCard, ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, History, Gem, Repeat, ArrowRight, X, RefreshCw } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, setDoc, increment, serverTimestamp, collection, query, orderBy, limit, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../api/firebase';

const RECHARGE_PACKAGES = [
    { id: '1', coins: 100, price: 3.00, priceDisplay: '3.00 TND', bonus: 0 },
    { id: '2', coins: 550, price: 15.00, priceDisplay: '15.00 TND', bonus: 50 },
    { id: '3', coins: 1200, price: 30.00, priceDisplay: '30.00 TND', bonus: 200 },
    { id: '4', coins: 2500, price: 60.00, priceDisplay: '60.00 TND', bonus: 500 },
    { id: '5', coins: 6500, price: 150.00, priceDisplay: '150.00 TND', bonus: 1500 },
    { id: '6', coins: 13500, price: 300.00, priceDisplay: '300.00 TND', bonus: 3500 },
];

const DIAMOND_TO_TND_RATE = 0.01;
const DIAMOND_TO_COIN_RATE = 1;

interface WalletScreenProps {
    onBack: () => void;
    theme: 'light' | 'dark';
    t: (key: string) => string;
    profileData: any;
    user: any;
    language: string;
}

export default function WalletScreen({ onBack, theme, t, profileData, user, language }: WalletScreenProps) {
    const isDark = theme === 'dark';
    const colors = isDark ? Theme.dark.colors : Theme.light.colors;
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'recharge' | 'earnings'>('recharge');
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [exchangeType, setExchangeType] = useState<'diamondsToCoins' | 'coinsToDiamonds'>('diamondsToCoins');
    const [exchangeAmount, setExchangeAmount] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const rotation = React.useRef(new Animated.Value(0)).current;

    const fetchTransactions = async () => {
        if (!user?.uid) return;
        try {
            const q = query(
                collection(db, 'users', user.uid, 'transactions'),
                orderBy('timestamp', 'desc'),
                limit(20)
            );
            const snapshot = await getDocs(q);
            const txData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(txData);
        } catch (error) {
            console.error("Manual Refresh Error:", error);
        }
    };

    React.useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, 'users', user.uid, 'transactions'),
            orderBy('timestamp', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(txData);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    // Translations helper
    const tr = (en: string, fr: string, ar: string) => {
        return language === 'ar' ? ar : (language === 'fr' ? fr : en);
    };

    const coinBalance = profileData?.wallet?.coins || 0;
    const diamondBalance = profileData?.wallet?.diamonds || 0;

    const handleRecharge = async (pack: any) => {
        if (!user?.uid) {
            Alert.alert('Error', tr('Please log in to recharge.', 'Veuillez vous connecter pour recharger.', 'يرجى تسجيل الدخول لإعادة الشحن.'));
            return;
        }

        Alert.alert(
            tr('Confirm Purchase', 'Confirmer l\'Achat', 'تأكيد الشراء'),
            `${tr('Buy', 'Acheter', 'شراء')} ${pack.coins} ${tr('Coins for', 'Pièces pour', 'عملات مقابل')} ${pack.priceDisplay}?`,
            [
                { text: tr('Cancel', 'Annuler', 'إلغاء'), style: 'cancel' },
                {
                    text: tr('Buy', 'Acheter', 'شراء'),
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const userRef = doc(db, 'users', user.uid);
                            // Use setDoc with merge: true to avoid issues with missing sub-objects
                            await setDoc(userRef, {
                                wallet: {
                                    coins: increment(pack.coins + pack.bonus)
                                }
                            }, { merge: true });

                            // Record Transaction
                            await addDoc(collection(db, 'users', user.uid, 'transactions'), {
                                type: 'recharge',
                                amountCoins: pack.coins + pack.bonus,
                                currency: 'coins',
                                price: pack.price,
                                priceDisplay: pack.priceDisplay,
                                description: `Coin Pack Purchase (${pack.coins} + ${pack.bonus} Bonus)`,
                                timestamp: serverTimestamp(),
                                status: 'completed'
                            });

                            Alert.alert(tr('Success', 'Succès', 'ناجح'), `${tr('You purchased', 'Vous avez acheté', 'لقد اشتريت')} ${pack.coins + pack.bonus} ${tr('coins!', 'pièces!', 'عملات!')}`);
                        } catch (error) {
                            console.error("Recharge Error:", error);
                            Alert.alert('Error', 'Transaction failed');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleConfirmExchange = async () => {
        if (!user?.uid || !exchangeAmount) return;
        const amount = parseInt(exchangeAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Error', tr('Invalid amount', 'Montant invalide', 'مبلغ غير صحيح'));
            return;
        }

        const maxBalance = exchangeType === 'diamondsToCoins' ? diamondBalance : coinBalance;
        if (amount > maxBalance) {
            Alert.alert(tr('Insufficient Balance', 'Solde Insuffisant', 'رصيد غير كافي'), tr('Insufficient balance for this exchange.', 'Solde insuffisant pour cet échange.', 'رصيد غير كافي لهذا التبادل.'));
            return;
        }

        setLoading(true);
        try {
            const userRef = doc(db, 'users', user.uid);

            if (exchangeType === 'diamondsToCoins') {
                // Diamonds to Coins (1:1)
                await setDoc(userRef, {
                    wallet: {
                        diamonds: increment(-amount),
                        coins: increment(amount)
                    }
                }, { merge: true });

                await addDoc(collection(db, 'users', user.uid, 'transactions'), {
                    type: 'exchange',
                    amountDiamonds: amount,
                    amountCoins: amount,
                    description: `Diamonds to Coins Exchange`,
                    timestamp: serverTimestamp(),
                    status: 'completed'
                });
            } else {
                // Coins to Diamonds (1:0.7, 30% loss)
                const resultDiamonds = Math.ceil(amount * 0.7);
                await setDoc(userRef, {
                    wallet: {
                        coins: increment(-amount),
                        diamonds: increment(resultDiamonds)
                    }
                }, { merge: true });

                await addDoc(collection(db, 'users', user.uid, 'transactions'), {
                    type: 'exchange',
                    amountCoins: amount,
                    amountDiamonds: resultDiamonds,
                    description: `Coins to Diamonds Exchange (30% fee)`,
                    timestamp: serverTimestamp(),
                    status: 'completed'
                });
            }

            setShowExchangeModal(false);
            setExchangeAmount('');
            Alert.alert(tr('Success', 'Succès', 'ناجح'), tr('Exchange completed successfully!', 'Échange terminé avec succès !', 'تم التبادل بنجاح!'));
        } catch (error) {
            console.error("Exchange Error:", error);
            Alert.alert('Error', 'Exchange failed');
        } finally {
            setLoading(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <LinearGradient
                colors={isDark ? ['#1A1A1A', '#000'] : ['#F5F5F5', '#FFF']}
                style={[StyleSheet.absoluteFill, { borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }]}
            />

            <View style={[styles.navBar, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <ChevronLeft size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>{tr('My Wallet', 'Mon Portefeuille', 'محفظتي')}</Text>
                <TouchableOpacity
                    onPress={async () => {
                        if (isRefreshing) return;
                        setIsRefreshing(true);

                        // Start animation
                        Animated.timing(rotation, {
                            toValue: 1,
                            duration: 1000,
                            useNativeDriver: true,
                        }).start();

                        // Actual data pull
                        await fetchTransactions();

                        // Wait for animation to finish
                        setTimeout(() => {
                            rotation.setValue(0);
                            setIsRefreshing(false);
                        }, 1000);
                    }}
                    style={[styles.backBtn, { backgroundColor: 'transparent' }]}
                >
                    <Animated.View style={{
                        transform: [{
                            rotate: rotation.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '360deg']
                            })
                        }]
                    }}>
                        <RefreshCw size={22} color={colors.foreground} />
                    </Animated.View>
                </TouchableOpacity>
            </View>

            <View style={styles.balanceCardContainer}>
                <LinearGradient
                    colors={activeTab === 'recharge' ? ['#F59E0B', '#D97706'] : ['#8B5CF6', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceCard}
                >
                    <View>
                        <Text style={styles.balanceLabel}>{activeTab === 'recharge' ? tr('Coin Balance', 'Solde de Pièces', 'رصيد العملات') : tr('Diamond Balance', 'Solde de Diamants', 'رصيد الألماس')}</Text>
                        <View style={styles.balanceRow}>
                            {activeTab === 'recharge' ? <Coins size={28} color="#FFF" style={{ marginRight: 8 }} /> : <Gem size={28} color="#FFF" style={{ marginRight: 8 }} />}
                            <Text style={styles.balanceAmount}>
                                {activeTab === 'recharge' ? coinBalance.toLocaleString() : diamondBalance.toLocaleString()}
                            </Text>
                        </View>
                        {activeTab === 'earnings' && (
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4, fontWeight: '600' }}>
                                ≈ {(diamondBalance * DIAMOND_TO_TND_RATE).toFixed(2)} TND
                            </Text>
                        )}
                    </View>

                    <View style={styles.walletIconContainer}>
                        <Wallet size={32} color="rgba(255,255,255,0.8)" />
                    </View>

                    <View style={[styles.decorativeCircle, { top: -20, right: -20, width: 100, height: 100 }]} />
                    <View style={[styles.decorativeCircle, { bottom: -40, left: -20, width: 80, height: 80 }]} />
                </LinearGradient>
            </View>

            <View style={[styles.tabContainer, { backgroundColor: isDark ? '#111' : '#E5E5EA' }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'recharge' && { backgroundColor: colors.card }]}
                    onPress={() => setActiveTab('recharge')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'recharge' ? colors.foreground : colors.textMuted }]}>{tr('Recharge', 'Recharger', 'إعادة شحن')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'earnings' && { backgroundColor: colors.card }]}
                    onPress={() => setActiveTab('earnings')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'earnings' ? colors.foreground : colors.textMuted }]}>{tr('Earnings', 'Gains', 'الأرباح')}</Text>
                </TouchableOpacity>
            </View>
        </View >
    );

    const renderRecharge = () => (
        <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{tr('Top Up Coins', 'Recharger des Pièces', 'شحن العملات')}</Text>
            <View style={styles.gridContainer}>
                {RECHARGE_PACKAGES.map((pack) => (
                    <TouchableOpacity
                        key={pack.id}
                        style={[styles.packageCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                        activeOpacity={0.7}
                        onPress={() => handleRecharge(pack)}
                        disabled={loading}
                    >
                        <View style={styles.coinIconWrapper}>
                            <Coins size={28} color="#F59E0B" fill="#F59E0B" />
                        </View>
                        <Text style={[styles.coinAmount, { color: colors.foreground }]}>{pack.coins}</Text>
                        {pack.bonus > 0 && (
                            <Text style={styles.bonusText}>+{pack.bonus} {tr('Bonus', 'Bonus', 'إضافي')}</Text>
                        )}
                        <View style={styles.priceButton}>
                            <Text style={styles.priceText}>{pack.priceDisplay}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderEarnings = () => {
        const tndValue = (diamondBalance * DIAMOND_TO_TND_RATE).toFixed(2);

        return (
            <View style={styles.sectionContainer}>
                <View style={[styles.infoBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                    <Text style={{ color: colors.foreground, fontSize: 13, textAlign: 'center' }}>
                        {tr('Diamonds are earned from gifts received during live streams. You can withdraw them as cash or exchange them for Coins.', 'Les diamants sont gagnés grâce aux cadeaux reçus lors des directs. Vous pouvez les retirer en espèces ou les échanger contre des pièces.', 'يتم كسب الألماس من الهدايا المستلمة أثناء البث المباشر. يمكنك سحبها نقدًا أو استبدالها بعملات.')}
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => Alert.alert(
                            tr('Confirm Withdrawal', 'Confirmer le Retrait', 'تأكيد السحب'),
                            tr(
                                `Do you want to request a withdrawal for ${tndValue} TND?`,
                                `Voulez-vous demander un retrait de ${tndValue} TND ?`,
                                `هل تريد طلب سحب بقيمة ${tndValue} دينار؟`
                            ),
                            [
                                { text: tr('Cancel', 'Annuler', 'إلغاء'), style: 'cancel' },
                                {
                                    text: tr('Request', 'Demander', 'طلب'),
                                    onPress: async () => {
                                        setLoading(true);
                                        try {
                                            const userRef = doc(db, 'users', user.uid);
                                            // Atomically decrease diamonds
                                            await setDoc(userRef, {
                                                wallet: {
                                                    diamonds: 0 // In real app, subtract requested amount
                                                }
                                            }, { merge: true });

                                            // Record Transaction
                                            await addDoc(collection(db, 'users', user.uid, 'transactions'), {
                                                type: 'withdrawal',
                                                amountTND: parseFloat(tndValue),
                                                amountDiamonds: diamondBalance,
                                                description: `Withdrawal Request`,
                                                timestamp: serverTimestamp(),
                                                status: 'pending'
                                            });

                                            Alert.alert(
                                                tr('Withdraw', 'Retirer', 'سحب'),
                                                tr(
                                                    `Withdrawal request for ${tndValue} TND has been received. Please contact support to complete the process.`,
                                                    `La demande de retrait de ${tndValue} TND a été reçue. Veuillez contacter le support pour terminer le processus.`,
                                                    `تم استلام طلب سحب بقيمة ${tndValue} دينار. يرجى الاتصال بالدعم لإكمال العملية.`
                                                )
                                            );
                                        } catch (error) {
                                            Alert.alert('Error', 'Withdrawal request failed');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }
                                }
                            ]
                        )}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <ArrowUpRight size={20} color={Theme.light.colors.success} />
                        </View>
                        <View>
                            <Text style={[styles.actionBtnTitle, { color: colors.foreground }]}>{tr('Withdraw', 'Retirer', 'سحب')}</Text>
                            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{tndValue} TND</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setShowExchangeModal(true)}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                            <Repeat size={20} color="#F59E0B" />
                        </View>
                        <View>
                            <Text style={[styles.actionBtnTitle, { color: colors.foreground }]}>{tr('Exchange', 'Échanger', 'تبادل')}</Text>
                            <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>{tr('To Coins / Diamonds', 'En Pièces / Diamants', 'إلى عملات / ماس')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 30 }]}>{tr('Recent Transaction', 'Trans. Récentes', 'المعاملات الأخيرة')}</Text>
                <View style={{ marginTop: 10 }}>
                    {transactions.length === 0 ? (
                        <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
                            <History size={48} color={colors.textMuted} strokeWidth={1} style={{ marginBottom: 12 }} />
                            <Text style={{ color: colors.textMuted, fontSize: 14 }}>{tr('No recent transactions', 'Pas de transactions récentes', 'لا توجد معاملات حديثة')}</Text>
                        </View>
                    ) : (
                        transactions.map((tx) => (
                            <View key={tx.id} style={[styles.transactionItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 16, marginBottom: 10, paddingHorizontal: 12 }]}>
                                <View style={[styles.iconCircle, {
                                    backgroundColor:
                                        tx.type === 'recharge' ? 'rgba(245, 158, 11, 0.15)' :
                                            tx.type === 'withdrawal' ? 'rgba(239, 68, 68, 0.15)' :
                                                tx.type === 'exchange' ? 'rgba(16, 185, 129, 0.15)' :
                                                    tx.type === 'gift_received' ? 'rgba(139, 92, 246, 0.15)' :
                                                        'rgba(107, 114, 128, 0.15)'
                                }]}>
                                    {tx.type === 'recharge' && <Coins size={20} color="#F59E0B" fill="#F59E0B" />}
                                    {tx.type === 'withdrawal' && <ArrowUpRight size={20} color="#EF4444" />}
                                    {tx.type === 'exchange' && <Repeat size={20} color="#10B981" />}
                                    {tx.type === 'gift_received' && <Gem size={20} color="#8B5CF6" fill="#8B5CF6" />}
                                    {tx.type === 'gift_sent' && <ArrowUpRight size={20} color="#6B7280" />}
                                </View>
                                <View style={styles.transactionInfo}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={[styles.transactionTitle, { color: colors.foreground }]}>
                                            {tx.type === 'recharge' ? tr('Recharge', 'Rechargement', 'إعادة شحن') :
                                                tx.type === 'withdrawal' ? tr('Withdrawal', 'Retrait', 'سحب') :
                                                    tx.type === 'exchange' ? tr('Exchange', 'Échange', 'تبادل') :
                                                        tx.type === 'gift_received' ? tr('Gift Received', 'Cadeau Reçu', 'هدية مستلمة') :
                                                            tx.type === 'gift_sent' ? tr('Gift Sent', 'Cadeau Envoyé', 'هدية مرسلة') :
                                                                tr('Transaction', 'Transaction', 'معاملة')}
                                        </Text>
                                        <Text style={[styles.transactionAmount, { color: (tx.type === 'withdrawal' || tx.type === 'gift_sent') ? '#EF4444' : '#10B981' }]}>
                                            {(tx.type === 'withdrawal' || tx.type === 'gift_sent') ? '-' : '+'}
                                            {tx.type === 'recharge' ? `${tx.amountCoins || tx.amount || 0} ${tr('Coins', 'Pièces', 'عملة')}` :
                                                tx.type === 'withdrawal' ? `${(tx.amountTND || 0).toFixed(2)} TND` :
                                                    tx.type === 'exchange' ? `${tx.amountCoins || 0} ${tr('Coins', 'Pièces', 'عملة')}` :
                                                        tx.type === 'gift_received' ? `${tx.amountDiamonds || 0} ${tr('Diamonds', 'Diamants', 'ماس')}` :
                                                            `${tx.amountCoins || 0} ${tr('Coins', 'Pièces', 'عملة')}`}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                                        <Text style={[styles.transactionDate, { color: colors.textMuted }]}>
                                            {tx.description || (tx.type === 'gift_received' ? `${tx.giftName} ${tr('from', 'de', 'من')} ${tx.senderName}` : tx.type === 'gift_sent' ? `${tx.giftName} ${tr('to', 'à', 'إلى')} ${tx.recipientName}` : '')}
                                        </Text>
                                        <Text style={[styles.transactionDate, { color: colors.textMuted, fontSize: 10 }]}>
                                            {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleDateString() : '...'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </View>
        );
    };

    const renderHistory = () => (
        <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 10 }]}>{tr('Transaction History', 'Historique', 'سجل المعاملات')}</Text>
            {transactions.length === 0 ? (
                <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
                    <History size={48} color={colors.textMuted} strokeWidth={1} style={{ marginBottom: 12 }} />
                    <Text style={{ color: colors.textMuted, fontSize: 14 }}>{tr('No transactions yet', 'Aucune transaction', 'لا توجد معاملات بعد')}</Text>
                </View>
            ) : (
                transactions.map((tx) => (
                    <View key={tx.id} style={[styles.transactionItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 16, marginBottom: 10, paddingHorizontal: 12 }]}>
                        <View style={[styles.iconCircle, {
                            backgroundColor:
                                tx.type === 'recharge' ? 'rgba(245, 158, 11, 0.15)' :
                                    tx.type === 'withdrawal' ? 'rgba(239, 68, 68, 0.15)' :
                                        tx.type === 'exchange' ? 'rgba(16, 185, 129, 0.15)' :
                                            tx.type === 'gift_received' ? 'rgba(139, 92, 246, 0.15)' :
                                                'rgba(107, 114, 128, 0.15)'
                        }]}>
                            {tx.type === 'recharge' && <Coins size={20} color="#F59E0B" fill="#F59E0B" />}
                            {tx.type === 'withdrawal' && <ArrowUpRight size={20} color="#EF4444" />}
                            {tx.type === 'exchange' && <Repeat size={20} color="#10B981" />}
                            {tx.type === 'gift_received' && <Gem size={20} color="#8B5CF6" fill="#8B5CF6" />}
                            {tx.type === 'gift_sent' && <ArrowUpRight size={20} color="#6B7280" />}
                        </View>
                        <View style={styles.transactionInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={[styles.transactionTitle, { color: colors.foreground }]}>
                                    {tx.type === 'recharge' ? tr('Recharge', 'Rechargement', 'إعادة شحن') :
                                        tx.type === 'withdrawal' ? tr('Withdrawal', 'Retrait', 'سحب') :
                                            tx.type === 'exchange' ? tr('Exchange', 'Échange', 'تبادل') :
                                                tx.type === 'gift_received' ? tr('Gift Received', 'Cadeau Reçu', 'هدية مستلمة') :
                                                    tx.type === 'gift_sent' ? tr('Gift Sent', 'Cadeau Envoyé', 'هدية مرسلة') :
                                                        tr('Transaction', 'Transaction', 'معاملة')}
                                </Text>
                                <Text style={[styles.transactionAmount, { color: (tx.type === 'withdrawal' || tx.type === 'gift_sent') ? '#EF4444' : '#10B981' }]}>
                                    {(tx.type === 'withdrawal' || tx.type === 'gift_sent') ? '-' : '+'}
                                    {tx.type === 'recharge' ? `${tx.amountCoins || tx.amount || 0} ${tr('Coins', 'Pièces', 'عملة')}` :
                                        tx.type === 'withdrawal' ? `${(tx.amountTND || 0).toFixed(2)} TND` :
                                            tx.type === 'exchange' ? `${tx.amountCoins || 0} ${tr('Coins', 'Pièces', 'عملة')}` :
                                                tx.type === 'gift_received' ? `${tx.amountDiamonds || 0} ${tr('Diamonds', 'Diamants', 'ماس')}` :
                                                    `${tx.amountCoins || 0} ${tr('Coins', 'Pièces', 'عملة')}`}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                                <Text style={[styles.transactionDate, { color: colors.textMuted }]}>
                                    {tx.description || (tx.type === 'gift_received' ? `${tx.giftName} ${tr('from', 'de', 'من')} ${tx.senderName}` : tx.type === 'gift_sent' ? `${tx.giftName} ${tr('to', 'à', 'إلى')} ${tx.recipientName}` : '')}
                                </Text>
                                <Text style={[styles.transactionDate, { color: colors.textMuted, fontSize: 10 }]}>
                                    {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleDateString() : '...'}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {renderHeader()}
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {activeTab === 'recharge' ? (
                    <>
                        {renderRecharge()}
                        {renderHistory()}
                    </>
                ) : (
                    renderEarnings()
                )}
            </ScrollView>

            {/* Exchange Modal */}
            <Modal
                visible={showExchangeModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowExchangeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{tr('Exchange Assets', 'Échanger des Actifs', 'تبادل الأصول')}</Text>
                            <TouchableOpacity onPress={() => setShowExchangeModal(false)}>
                                <X size={24} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.exchangeSelector}>
                            <TouchableOpacity
                                style={[styles.exchangeTypeBtn, exchangeType === 'diamondsToCoins' && { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }]}
                                onPress={() => setExchangeType('diamondsToCoins')}
                            >
                                <Gem size={18} color={exchangeType === 'diamondsToCoins' ? '#FFF' : '#8B5CF6'} fill={exchangeType === 'diamondsToCoins' ? '#FFF' : 'transparent'} />
                                <ArrowRight size={12} color={exchangeType === 'diamondsToCoins' ? '#FFF' : colors.textMuted} style={{ marginHorizontal: 4 }} />
                                <Coins size={18} color={exchangeType === 'diamondsToCoins' ? '#FFF' : '#F59E0B'} fill={exchangeType === 'diamondsToCoins' ? '#FFF' : 'transparent'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.exchangeTypeBtn, exchangeType === 'coinsToDiamonds' && { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }]}
                                onPress={() => setExchangeType('coinsToDiamonds')}
                            >
                                <Coins size={18} color={exchangeType === 'coinsToDiamonds' ? '#FFF' : '#F59E0B'} fill={exchangeType === 'coinsToDiamonds' ? '#FFF' : 'transparent'} />
                                <ArrowRight size={12} color={exchangeType === 'coinsToDiamonds' ? '#FFF' : colors.textMuted} style={{ marginHorizontal: 4 }} />
                                <Gem size={18} color={exchangeType === 'coinsToDiamonds' ? '#FFF' : '#8B5CF6'} fill={exchangeType === 'coinsToDiamonds' ? '#FFF' : 'transparent'} />
                            </TouchableOpacity>
                        </View>

                        {/* Balance Card in Modal */}
                        <View style={{ marginBottom: 24 }}>
                            <LinearGradient
                                colors={exchangeType === 'coinsToDiamonds' ? ['#F59E0B', '#D97706'] : ['#8B5CF6', '#7C3AED']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.balanceCard, { height: 100, padding: 16 }]}
                            >
                                <View>
                                    <Text style={[styles.balanceLabel, { fontSize: 12, marginBottom: 4 }]}>
                                        {exchangeType === 'diamondsToCoins' ? tr('Diamond Balance', 'Solde de Diamants', 'رصيد الألماس') : tr('Coin Balance', 'Solde de Pièces', 'رصيد العملات')}
                                    </Text>
                                    <View style={styles.balanceRow}>
                                        {exchangeType === 'diamondsToCoins' ? <Gem size={22} color="#FFF" style={{ marginRight: 6 }} /> : <Coins size={22} color="#FFF" style={{ marginRight: 6 }} />}
                                        <Text style={[styles.balanceAmount, { fontSize: 28 }]}>
                                            {exchangeType === 'diamondsToCoins' ? diamondBalance.toLocaleString() : coinBalance.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                                <View style={[styles.walletIconContainer, { width: 44, height: 44, borderRadius: 22 }]}>
                                    <Wallet size={24} color="rgba(255,255,255,0.8)" />
                                </View>
                            </LinearGradient>
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                                {exchangeType === 'diamondsToCoins' ? tr('Amount of Diamonds to Send', 'Montant de Diamants à Envoyer', 'مبلغ الألماس للإرسال') : tr('Amount of Coins to Send', 'Montant de Pièces à Envoyer', 'مبلغ العملات للإرسال')}
                            </Text>
                            <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                                <TextInput
                                    style={[styles.modalInput, { color: colors.foreground }]}
                                    keyboardType="numeric"
                                    value={exchangeAmount}
                                    onChangeText={setExchangeAmount}
                                    placeholder="0"
                                    placeholderTextColor={colors.textMuted}
                                />
                                <TouchableOpacity onPress={() => setExchangeAmount((exchangeType === 'diamondsToCoins' ? diamondBalance : coinBalance).toString())}>
                                    <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 13 }}>MAX</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={[styles.exchangeReview, { padding: 15, marginBottom: 15 }]}>
                            <View style={{ alignItems: 'center', flex: 1 }}>
                                <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>{tr('From', 'De', 'من')}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.foreground }}>{exchangeAmount || '0'}</Text>
                                    {exchangeType === 'diamondsToCoins' ? <Gem size={14} color="#8B5CF6" style={{ marginLeft: 4 }} /> : <Coins size={14} color="#F59E0B" style={{ marginLeft: 4 }} />}
                                </View>
                            </View>

                            <ArrowRight size={18} color={colors.textMuted} />

                            <View style={{ alignItems: 'center', flex: 1 }}>
                                <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>{tr('You Get', 'Vous recevez', 'سوف تستلم')}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#10B981' }}>
                                        {exchangeType === 'diamondsToCoins' ? (parseInt(exchangeAmount) || 0) : Math.ceil((parseInt(exchangeAmount) || 0) * 0.7)}
                                    </Text>
                                    {exchangeType === 'diamondsToCoins' ? <Coins size={14} color="#F59E0B" style={{ marginLeft: 4 }} /> : <Gem size={14} color="#8B5CF6" style={{ marginLeft: 4 }} />}
                                </View>
                            </View>
                        </View>

                        {exchangeType === 'coinsToDiamonds' && (
                            <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: 10, borderRadius: 12, marginBottom: 20 }}>
                                <Text style={{ color: '#EF4444', fontSize: 10, textAlign: 'center', lineHeight: 14 }}>
                                    ⚠️ {tr('30% conversion fee applied when converting Coins to Diamonds.', 'Frais de conversion de 30% appliqués lors de la conversion de pièces en diamants.', 'يتم تطبيق رسوم تحويل بنسبة 30٪ عند تحويل العملات إلى ماس.')}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.confirmBtn, { backgroundColor: loading ? colors.textMuted : (exchangeType === 'diamondsToCoins' ? '#8B5CF6' : '#F59E0B'), height: 50 }]}
                            onPress={handleConfirmExchange}
                            disabled={loading || !exchangeAmount}
                        >
                            <Text style={[styles.confirmBtnText, { fontSize: 15 }]}>{loading ? tr('Processing...', 'Traitement...', 'جاري التحميل...') : tr('Confirm Exchange', 'Confirmer l\'Échange', 'تأكيد التبادل')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: {
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
        zIndex: 10,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    balanceCardContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    balanceCard: {
        padding: 24,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
        height: 140,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    balanceAmount: {
        color: '#FFF',
        fontSize: 36,
        fontWeight: '800',
        letterSpacing: 1,
    },
    walletIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        padding: 4,
        borderRadius: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
    },
    scrollContent: {
        paddingTop: 20,
        paddingBottom: 120,
    },
    sectionContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 15,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    packageCard: {
        width: '48%',
        padding: 12,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 10,
        justifyContent: 'space-between',
        minHeight: 140,
    },
    coinIconWrapper: {
        marginBottom: 12,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    coinAmount: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    bonusText: {
        fontSize: 10,
        color: '#10B981',
        fontWeight: '700',
        marginBottom: 8,
    },
    priceButton: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    priceText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginVertical: 4,
    },
    transactionInfo: {
        flex: 1,
        marginLeft: 15,
    },
    transactionTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 10.5,
    },
    transactionAmount: {
        fontSize: 13.5,
        fontWeight: '800',
    },
    infoBox: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    actionBtn: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContent: {
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    exchangeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    exchangeTypeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(100,100,100,0.1)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeExchangeType: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    modalInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
    },
    exchangeReview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(100,100,100,0.05)',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    confirmBtn: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#3B82F6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    confirmBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
