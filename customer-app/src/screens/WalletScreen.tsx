import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Alert, Image, Modal, TextInput, Animated, ActivityIndicator } from 'react-native';
import { ChevronLeft, Coins, CreditCard, ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, History, Gem, Repeat, ArrowRight, X, RefreshCw, Search, Users, User, Send, Check, ChevronRight } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, setDoc, increment, serverTimestamp, collection, query, orderBy, limit, onSnapshot, addDoc, getDocs, where, runTransaction, arrayUnion, arrayRemove, deleteDoc, documentId } from 'firebase/firestore';
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
    onNavigate?: (screen: string, params?: any) => void;
}

export default function WalletScreen({ onBack, theme, t, profileData, user, language, onNavigate }: WalletScreenProps) {
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
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferSearchQuery, setTransferSearchQuery] = useState('');
    const [transferSearchResults, setTransferSearchResults] = useState<any[]>([]);
    const [selectedUserForTransfer, setSelectedUserForTransfer] = useState<any | null>(null);
    const [transferAmount, setTransferAmount] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [transferType, setTransferType] = useState<'coins' | 'diamonds'>('coins');
    const [showTargetProfile, setShowTargetProfile] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
    const [sentRequests, setSentRequests] = useState<any[]>([]);
    const [friendsList, setFriendsList] = useState<any[]>([]);
    const [transferModalTab, setTransferModalTab] = useState<'search' | 'friends' | 'requests'>('search');

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

        // Listen for Friend Requests (Incoming)
        const incomingQ = query(collection(db, 'users', user.uid, 'friendRequests'), where('status', '==', 'pending'));
        const unsubscribeIncoming = onSnapshot(incomingQ, (snapshot) => {
            setIncomingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Listen for Sent Requests (Outgoing)
        const outgoingQ = query(collection(db, 'friendRequests'), where('senderId', '==', user.uid), where('status', '==', 'pending'));
        const unsubscribeOutgoing = onSnapshot(outgoingQ, (snapshot) => {
            setSentRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Fetch Friends List (Simplified: using the UID list already in profileData.friends)
        const fetchFriends = async () => {
            if (!profileData?.friends || profileData.friends.length === 0) {
                setFriendsList([]);
                return;
            }
            try {
                // Use documentId() because the friends array contains the document IDs (UIDs)
                const friendsQ = query(collection(db, 'users'), where(documentId(), 'in', profileData.friends.slice(0, 10)));
                const snapshot = await getDocs(friendsQ);
                setFriendsList(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Fetch Friends Error:", err);
            }
        };
        fetchFriends();

        return () => {
            unsubscribe();
            unsubscribeIncoming();
            unsubscribeOutgoing();
        };
    }, [user?.uid, profileData?.friends]);

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

    const handleSearchUsers = async (text: string) => {
        setTransferSearchQuery(text);
        if (text.length < 2) {
            setTransferSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const q = query(
                collection(db, 'users'),
                where('fullName', '>=', text),
                where('fullName', '<=', text + '\uf8ff'),
                limit(10)
            );
            const snapshot = await getDocs(q);
            const results = snapshot.docs
                .map(doc => ({ uid: doc.id, ...doc.data() }))
                .filter((u: any) => u.uid !== user?.uid); // Don't show myself
            setTransferSearchResults(results);
        } catch (error) {
            console.error("Search Error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleTransfer = async () => {
        if (!user?.uid || !selectedUserForTransfer || !transferAmount) return;

        // Check if mutual friends
        const isFriend = profileData?.friends?.includes(selectedUserForTransfer.uid);
        if (!isFriend) {
            Alert.alert(
                tr('Restriction', 'Restriction', 'قيود'),
                tr(
                    'You can only transfer funds to confirmed friends.',
                    'Vous ne pouvez transférer des fonds qu\'à des amis confirmés.',
                    'يمكنك فقط تحويل الأموال للأصدقاء المؤكدين.'
                )
            );
            return;
        }

        const amount = parseInt(transferAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Error', tr('Invalid amount', 'Montant invalide', 'مبلغ غير صحيح'));
            return;
        }

        const maxBalance = transferType === 'coins' ? coinBalance : diamondBalance;
        if (amount > maxBalance) {
            Alert.alert(tr('Insufficient Balance', 'Solde Insuffisant', 'رصيد غير كافي'), tr('Insufficient balance for this transfer.', 'Solde insuffisant pour ce transfert.', 'رصيد غير كافي لهذا التحويل.'));
            return;
        }

        setLoading(true);
        try {
            await runTransaction(db, async (transaction) => {
                const meRef = doc(db, 'users', user.uid);
                const themRef = doc(db, 'users', selectedUserForTransfer.uid);

                // Check balances again inside transaction
                const meDoc = await transaction.get(meRef);
                const currentBalance = meDoc.data()?.wallet?.[transferType] || 0;

                if (currentBalance < amount) {
                    throw new Error("Insufficient balance");
                }

                // Update my wallet
                transaction.update(meRef, {
                    [`wallet.${transferType}`]: increment(-amount)
                });

                // Update their wallet
                transaction.update(themRef, {
                    [`wallet.${transferType}`]: increment(amount)
                });

                // Record transaction for ME
                const myTxRef = doc(collection(db, 'users', user.uid, 'transactions'));
                transaction.set(myTxRef, {
                    type: 'transfer_sent',
                    amount: amount,
                    currency: transferType,
                    amountCoins: transferType === 'coins' ? amount : 0,
                    amountDiamonds: transferType === 'diamonds' ? amount : 0,
                    recipientId: selectedUserForTransfer.uid,
                    recipientName: selectedUserForTransfer.fullName,
                    recipientAvatar: selectedUserForTransfer.avatarUrl || '',
                    description: `Transfer to ${selectedUserForTransfer.fullName}`,
                    timestamp: serverTimestamp(),
                    status: 'completed'
                });

                // Record transaction for THEM
                const theirTxRef = doc(collection(db, 'users', selectedUserForTransfer.uid, 'transactions'));
                transaction.set(theirTxRef, {
                    type: 'transfer_received',
                    amount: amount,
                    currency: transferType,
                    amountCoins: transferType === 'coins' ? amount : 0,
                    amountDiamonds: transferType === 'diamonds' ? amount : 0,
                    senderId: user.uid,
                    senderName: profileData?.fullName || 'Anonymous',
                    senderAvatar: profileData?.avatarUrl || '',
                    description: `Transfer from ${profileData?.fullName || 'User'}`,
                    timestamp: serverTimestamp(),
                    status: 'completed'
                });
            });

            Alert.alert(tr('Success', 'Succès', 'ناجح'), tr('Transfer completed successfully!', 'Transfert réussi !', 'تم التحويل بنجاح!'));
            setShowTransferModal(false);
            setTransferAmount('');
            setSelectedUserForTransfer(null);
            setTransferSearchQuery('');
            setTransferSearchResults([]);
        } catch (error) {
            console.error("Transfer Error:", error);
            Alert.alert('Error', 'Transfer failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSendFriendRequest = async (targetUser: any) => {
        if (!user?.uid) return;

        // Already friends?
        if (profileData?.friends?.includes(targetUser.uid)) return;

        // Already sent?
        if (sentRequests.some(r => r.receiverId === targetUser.uid)) {
            Alert.alert(tr('Info', 'Info', 'معلومات'), tr('Request already sent.', 'Demande déjà envoyée.', 'تم إرسال الطلب بالفعل.'));
            return;
        }

        setLoading(true);
        try {
            // Create request in global collection
            const requestRef = doc(collection(db, 'friendRequests'));
            const requestData = {
                senderId: user.uid,
                senderName: profileData?.fullName || 'User',
                senderAvatar: profileData?.avatarUrl || '',
                receiverId: targetUser.uid,
                receiverName: targetUser.fullName,
                receiverAvatar: targetUser.avatarUrl || '',
                status: 'pending',
                timestamp: serverTimestamp()
            };
            await setDoc(requestRef, requestData);

            // Also add to receiver's incoming sub-collection for easier notifications/UI
            await setDoc(doc(db, 'users', targetUser.uid, 'friendRequests', requestRef.id), requestData);

            Alert.alert(tr('Success', 'Succès', 'ناجح'), tr('Friend request sent!', 'Demande d\'ami envoyée !', 'تم إرسال طلب الصداقة!'));
        } catch (error) {
            console.error("Friend Request Error:", error);
            Alert.alert('Error', 'Failed to send request');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptFriendRequest = async (request: any) => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            await runTransaction(db, async (transaction) => {
                const meRef = doc(db, 'users', user.uid);
                const themRef = doc(db, 'users', request.senderId);
                const globalRequestRef = doc(db, 'friendRequests', request.id);
                const myRequestRef = doc(db, 'users', user.uid, 'friendRequests', request.id);

                // Add to both friends arrays
                transaction.update(meRef, { friends: arrayUnion(request.senderId) });
                transaction.update(themRef, { friends: arrayUnion(user.uid) });

                // Update status of requests
                transaction.update(globalRequestRef, { status: 'accepted' });
                transaction.delete(myRequestRef);
            });
            Alert.alert(tr('Success', 'Succès', 'ناجح'), tr('Friend request accepted!', 'Demande d\'ami acceptée !', 'تم قبول طلب الصداقة!'));
        } catch (error) {
            console.error("Accept Friend Error:", error);
            Alert.alert('Error', 'Failed to accept request');
        } finally {
            setLoading(false);
        }
    };

    const handleRejectFriendRequest = async (request: any) => {
        if (!user?.uid) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'friendRequests', request.id));
            await setDoc(doc(db, 'friendRequests', request.id), { status: 'rejected' }, { merge: true });
        } catch (error) {
            console.error("Reject Friend Error:", error);
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
                        <View style={[styles.priceButton, { backgroundColor: '#F59E0B' }]}>
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
                        {tr('Diamonds are earned from gifts received during live streams. You can withdraw them as cash (Min 50 TND) or exchange them for Coins.', 'Les diamants sont gagnés grâce aux cadeaux reçus lors des directs. Vous pouvez les retirer en espèces (Min 50 TND) ou les échanger contre des pièces.', 'يتم كسب الألماس من الهدايا المستلمة أثناء البث المباشر. يمكنك سحبها نقدًا (50 د.ت كحد أدنى) أو استبدالها بعملات.')}
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 20 }}>
                    <TouchableOpacity
                        style={[styles.actionBtn, {
                            flex: 1,
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
                            borderWidth: 1.5,
                            borderColor: 'rgba(16, 185, 129, 0.3)'
                        }]}
                        onPress={() => {
                            const amountTND = parseFloat(tndValue);
                            if (amountTND < 50) {
                                Alert.alert(
                                    tr('Minimum Amount', 'Montant Minimum', 'المبلغ الأدنى'),
                                    tr(
                                        'The minimum withdrawal amount is 50.00 TND.',
                                        'Le montant minimum de retrait est de 50,00 TND.',
                                        'المبلغ الأدنى للسحب هو 50.00 دينار.'
                                    )
                                );
                                return;
                            }
                            Alert.alert(
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
                                                await setDoc(userRef, {
                                                    wallet: { diamonds: 0 }
                                                }, { merge: true });

                                                await addDoc(collection(db, 'users', user.uid, 'transactions'), {
                                                    type: 'withdrawal',
                                                    amountTND: parseFloat(tndValue),
                                                    amountDiamonds: diamondBalance,
                                                    description: `Withdrawal Request`,
                                                    timestamp: serverTimestamp(),
                                                    status: 'pending'
                                                });

                                                Alert.alert(tr('Success', 'Succès', 'نجاح'), tr('Withdrawal request sent', 'Demande de retrait envoyée', 'تم إرسال طلب السحب'));
                                            } catch (error) {
                                                Alert.alert('Error', 'Withdrawal request failed');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }
                                ]
                            );
                        }}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)', marginBottom: 8 }]}>
                            <ArrowUpRight size={22} color="#10B981" />
                        </View>
                        <Text style={[styles.actionBtnTitle, { color: colors.foreground }]}>{tr('Withdraw', 'Retirer', 'سحب')}</Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>{tndValue} TND</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, {
                            flex: 1,
                            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)',
                            borderWidth: 1.5,
                            borderColor: 'rgba(245, 158, 11, 0.3)'
                        }]}
                        onPress={() => setShowExchangeModal(true)}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.2)', marginBottom: 8 }]}>
                            <Repeat size={22} color="#F59E0B" />
                        </View>
                        <Text style={[styles.actionBtnTitle, { color: colors.foreground }]}>{tr('Exchange', 'Échanger', 'تبادل')}</Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>{tr('Coins/Diamonds', 'Pièces/Diamants', 'عملات/ماس')}</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.transferBanner, {
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                        borderColor: '#3B82F6',
                        borderWidth: 2,
                        elevation: 4,
                        shadowColor: '#3B82F6',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 10
                    }]}
                    onPress={() => setShowTransferModal(true)}
                >
                    <View style={styles.transferBannerLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: '#3B82F6', marginBottom: 0, width: 40, height: 40, borderRadius: 20 }]}>
                            <Send size={18} color="#FFF" />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={[styles.transferBannerTitle, { color: colors.foreground, fontSize: 15 }]}>{tr('Transfer to Friend', 'Transférer à un ami', 'تحويل لصديق')}</Text>
                            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>{tr('Send Coins or Diamonds instantly', 'Envoyer des pièces ou diamants instantanément', 'أرسل عملات أو ماس فوراً')}</Text>
                        </View>
                        <ArrowRight size={20} color={colors.textMuted} />
                    </View>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 30 }]}>{tr('Recent Transaction', 'Trans. Récentes', 'المعاملات الأخيرة')}</Text>
                <View style={{ marginTop: 10 }}>
                    {transactions.length === 0 ? (
                        <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
                            <History size={48} color={colors.textMuted} strokeWidth={1} style={{ marginBottom: 12 }} />
                            <Text style={{ color: colors.textMuted, fontSize: 14 }}>{tr('No recent transactions', 'Pas de transactions récentes', 'لا توجد معاملات حديثة')}</Text>
                        </View>
                    ) : (
                        transactions.map((tx: any) => (
                            <View key={tx.id} style={[styles.transactionItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 16, marginBottom: 10, paddingHorizontal: 12 }]}>
                                <View style={[styles.iconCircle, {
                                    backgroundColor:
                                        tx.type === 'recharge' ? 'rgba(245, 158, 11, 0.15)' :
                                            tx.type === 'withdrawal' || tx.type === 'transfer_sent' ? 'rgba(239, 68, 68, 0.15)' :
                                                tx.type === 'exchange' || tx.type === 'transfer_received' ? 'rgba(16, 185, 129, 0.15)' :
                                                    tx.type === 'gift_received' ? 'rgba(139, 92, 246, 0.15)' :
                                                        'rgba(107, 114, 128, 0.15)'
                                }]} >
                                    {tx.type === 'recharge' && <Coins size={20} color="#F59E0B" fill="#F59E0B" />}
                                    {(tx.type === 'withdrawal' || tx.type === 'transfer_sent' || tx.type === 'gift_sent') && <ArrowUpRight size={20} color="#EF4444" />}
                                    {tx.type === 'exchange' && <Repeat size={20} color="#10B981" />}
                                    {tx.type === 'gift_received' && <Gem size={20} color="#8B5CF6" fill="#8B5CF6" />}
                                    {tx.type === 'transfer_received' && <ArrowDownLeft size={20} color="#10B981" />}
                                </View>
                                <View style={styles.transactionInfo}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={[styles.transactionTitle, { color: colors.foreground }]}>
                                            {tx.type === 'recharge' ? tr('Recharge', 'Rechargement', 'إعادة شحن') :
                                                tx.type === 'withdrawal' ? tr('Withdrawal', 'Retrait', 'سحب') :
                                                    tx.type === 'transfer_sent' ? tr('Transfer Sent', 'Transfert Envoyé', 'تحويل مرسل') :
                                                        tx.type === 'transfer_received' ? tr('Transfer Received', 'Transfert Reçu', 'تحويل مستلم') :
                                                            tx.type === 'exchange' ? tr('Exchange', 'Échange', 'تبادل') :
                                                                tx.type === 'gift_received' ? tr('Gift Received', 'Cadeau Reçu', 'هدية مستلمة') :
                                                                    tx.type === 'gift_sent' ? tr('Gift Sent', 'Cadeau Envoyé', 'هدية مرسلة') :
                                                                        tr('Transaction', 'Transaction', 'معاملة')}
                                        </Text>
                                        <Text style={[styles.transactionAmount, { color: (tx.type === 'withdrawal' || tx.type === 'gift_sent' || tx.type === 'transfer_sent') ? '#EF4444' : '#10B981' }]}>
                                            {(tx.type === 'withdrawal' || tx.type === 'gift_sent' || tx.type === 'transfer_sent') ? '-' : '+'}
                                            {tx.type === 'recharge' ? `${tx.amountCoins || tx.amount || 0} ${tr('Coins', 'Pièces', 'عملة')}` :
                                                tx.type === 'withdrawal' ? `${(tx.amountTND || 0).toFixed(2)} TND` :
                                                    tx.type === 'exchange' ? `${tx.amountCoins || 0} ${tr('Coins', 'Pièces', 'عملة')}` :
                                                        tx.type === 'gift_received' ? `${tx.amountDiamonds || 0} ${tr('Diamonds', 'Diamants', 'ماس')}` :
                                                            tx.type === 'transfer_sent' || tx.type === 'transfer_received' ? `${tx.amount || 0} ${tx.currency === 'coins' ? tr('Coins', 'Pièces', 'عملة') : tr('Diamonds', 'Diamants', 'ماس')}` :
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
                transactions.map((tx: any) => (
                    <View key={tx.id} style={[styles.transactionItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 16, marginBottom: 10, paddingHorizontal: 12 }]}>
                        <View style={[styles.iconCircle, {
                            backgroundColor:
                                tx.type === 'recharge' ? 'rgba(245, 158, 11, 0.15)' :
                                    tx.type === 'withdrawal' || tx.type === 'transfer_sent' ? 'rgba(239, 68, 68, 0.15)' :
                                        tx.type === 'exchange' || tx.type === 'transfer_received' ? 'rgba(16, 185, 129, 0.15)' :
                                            tx.type === 'gift_received' ? 'rgba(139, 92, 246, 0.15)' :
                                                'rgba(107, 114, 128, 0.15)'
                        }]}>
                            {tx.type === 'recharge' && <Coins size={20} color="#F59E0B" fill="#F59E0B" />}
                            {(tx.type === 'withdrawal' || tx.type === 'transfer_sent' || tx.type === 'gift_sent') && <ArrowUpRight size={20} color="#EF4444" />}
                            {tx.type === 'exchange' && <Repeat size={20} color="#10B981" />}
                            {tx.type === 'gift_received' && <Gem size={20} color="#8B5CF6" fill="#8B5CF6" />}
                            {tx.type === 'transfer_received' && <ArrowDownLeft size={20} color="#10B981" />}
                        </View>
                        <View style={styles.transactionInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={[styles.transactionTitle, { color: colors.foreground }]}>
                                    {tx.type === 'recharge' ? tr('Recharge', 'Rechargement', 'إعادة شحن') :
                                        tx.type === 'withdrawal' ? tr('Withdrawal', 'Retrait', 'سحب') :
                                            tx.type === 'transfer_sent' ? tr('Transfer Sent', 'Transfert Envoyé', 'تحويل مرسل') :
                                                tx.type === 'transfer_received' ? tr('Transfer Received', 'Transfert Reçu', 'تحويل مستلم') :
                                                    tx.type === 'exchange' ? tr('Exchange', 'Échange', 'تبادل') :
                                                        tx.type === 'gift_received' ? tr('Gift Received', 'Cadeau Reçu', 'هدية مستلمة') :
                                                            tx.type === 'gift_sent' ? tr('Gift Sent', 'Cadeau Envoyé', 'هدية مرسلة') :
                                                                tr('Transaction', 'Transaction', 'معاملة')}
                                </Text>
                                <Text style={[styles.transactionAmount, { color: (tx.type === 'withdrawal' || tx.type === 'gift_sent' || tx.type === 'transfer_sent') ? '#EF4444' : '#10B981' }]}>
                                    {(tx.type === 'withdrawal' || tx.type === 'gift_sent' || tx.type === 'transfer_sent') ? '-' : '+'}
                                    {tx.type === 'recharge' ? `${tx.amountCoins || tx.amount || 0} ${tr('Coins', 'Pièces', 'عملة')}` :
                                        tx.type === 'withdrawal' ? `${(tx.amountTND || 0).toFixed(2)} TND` :
                                            tx.type === 'exchange' ? `${tx.amountCoins || 0} ${tr('Coins', 'Pièces', 'عملة')}` :
                                                tx.type === 'gift_received' ? `${tx.amountDiamonds || 0} ${tr('Diamonds', 'Diamants', 'ماس')}` :
                                                    tx.type === 'transfer_sent' || tx.type === 'transfer_received' ? `${tx.amount || 0} ${tx.currency === 'coins' ? tr('Coins', 'Pièces', 'عملة') : tr('Diamonds', 'Diamants', 'ماس')}` :
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
                                    <Text style={{ color: colors.info, fontWeight: 'bold', fontSize: 13 }}>MAX</Text>
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

            {/* Transfer Modal */}
            <Modal
                visible={showTransferModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTransferModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', height: '85%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{tr('Transfer Sold', 'Transférer Solde', 'تحويل الرصيد')}</Text>
                            <TouchableOpacity onPress={() => {
                                setShowTransferModal(false);
                                setSelectedUserForTransfer(null);
                                setTransferSearchQuery('');
                                setTransferSearchResults([]);
                                setTransferAmount('');
                                setShowTargetProfile(false);
                            }}>
                                <X size={24} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        {!selectedUserForTransfer ? (
                            <>
                                <View style={[styles.tabContainer, { marginHorizontal: 24, marginTop: 10, padding: 3, height: 44, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                                    <TouchableOpacity
                                        style={[styles.tab, { height: '100%' }, transferModalTab === 'search' && { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#FFF' }]}
                                        onPress={() => setTransferModalTab('search')}
                                    >
                                        <Text style={[styles.tabText, { fontSize: 13, color: transferModalTab === 'search' ? colors.foreground : (isDark ? '#BBB' : '#666') }]}>{tr('Search', 'Chercher', 'بحث')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.tab, { height: '100%' }, transferModalTab === 'friends' && { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#FFF' }]}
                                        onPress={() => setTransferModalTab('friends')}
                                    >
                                        <Text style={[styles.tabText, { fontSize: 13, color: transferModalTab === 'friends' ? colors.foreground : (isDark ? '#BBB' : '#666') }]}>{tr('Friends', 'Amis', 'أصدقاء')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.tab, { height: '100%' }, transferModalTab === 'requests' && { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#FFF' }]}
                                        onPress={() => setTransferModalTab('requests')}
                                    >
                                        <Text style={[styles.tabText, { fontSize: 13, color: transferModalTab === 'requests' ? colors.foreground : (isDark ? '#BBB' : '#666') }]}>{tr('Requests', 'Demandes', 'طلبات')}</Text>
                                        {incomingRequests.length > 0 && (
                                            <View style={{ position: 'absolute', top: 8, right: 12, backgroundColor: '#EF4444', width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: isDark ? '#1C1C1E' : '#FFF' }} />
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {transferModalTab === 'search' ? (
                                    <>
                                        <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', marginTop: 15 }]}>
                                            <Search size={20} color={colors.textMuted} />
                                            <TextInput
                                                style={[styles.searchInput, { color: colors.foreground }]}
                                                placeholder={tr('Search user by name...', 'Rechercher par nom...', 'بحث عن طريق الاسم...')}
                                                placeholderTextColor={colors.textMuted}
                                                value={transferSearchQuery}
                                                onChangeText={handleSearchUsers}
                                            />
                                            {isSearching && <ActivityIndicator size="small" color={colors.info} />}
                                        </View>

                                        <ScrollView style={{ marginTop: 10 }}>
                                            {transferSearchResults.length === 0 && transferSearchQuery.length >= 2 && !isSearching ? (
                                                <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 20 }}>{tr('No users found', 'Aucun utilisateur trouvé', 'لم يتم العثور على مستخدمين')}</Text>
                                            ) : (
                                                transferSearchResults.map((u) => (
                                                    <TouchableOpacity
                                                        key={u.uid}
                                                        style={[styles.userListItem, { borderBottomColor: colors.border }]}
                                                        onPress={() => setSelectedUserForTransfer(u)}
                                                    >
                                                        <View style={styles.userListItemLeft}>
                                                            <View style={[styles.userAvatar, { backgroundColor: isDark ? '#333' : '#EEE' }]}>
                                                                {u.avatarUrl ? (
                                                                    <Image source={{ uri: u.avatarUrl }} style={styles.userAvatarImg} />
                                                                ) : (
                                                                    <User size={20} color={colors.textMuted} />
                                                                )}
                                                            </View>
                                                            <View style={{ marginLeft: 12 }}>
                                                                <Text style={[styles.userNameText, { color: colors.foreground }]}>{u.fullName}</Text>
                                                                <Text style={{ fontSize: 11, color: colors.textMuted }}>{u.email}</Text>
                                                            </View>
                                                        </View>
                                                        <ChevronRight size={18} color={colors.textMuted} />
                                                    </TouchableOpacity>
                                                ))
                                            )}
                                        </ScrollView>
                                    </>
                                ) : transferModalTab === 'friends' ? (
                                    <ScrollView style={{ marginTop: 15 }}>
                                        {friendsList.length === 0 ? (
                                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                                <Users size={48} color={colors.textMuted} strokeWidth={1} style={{ marginBottom: 12 }} />
                                                <Text style={{ color: colors.textMuted }}>{tr('No friends yet', 'Aucun ami pour le moment', 'لا يوجد أصدقاء بعد')}</Text>
                                            </View>
                                        ) : (
                                            friendsList.map((u) => (
                                                <TouchableOpacity
                                                    key={u.uid}
                                                    style={[styles.userListItem, { borderBottomColor: colors.border }]}
                                                    onPress={() => setSelectedUserForTransfer(u)}
                                                >
                                                    <View style={styles.userListItemLeft}>
                                                        <View style={[styles.userAvatar, { backgroundColor: isDark ? '#333' : '#EEE' }]}>
                                                            {u.avatarUrl ? (
                                                                <Image source={{ uri: u.avatarUrl }} style={styles.userAvatarImg} />
                                                            ) : (
                                                                <User size={20} color={colors.textMuted} />
                                                            )}
                                                        </View>
                                                        <View style={{ marginLeft: 12 }}>
                                                            <Text style={[styles.userNameText, { color: colors.foreground }]}>{u.fullName}</Text>
                                                            <Text style={{ fontSize: 11, color: colors.textMuted }}>{u.email}</Text>
                                                        </View>
                                                    </View>
                                                    <ChevronRight size={18} color={colors.textMuted} />
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </ScrollView>
                                ) : (
                                    <ScrollView style={{ marginTop: 15 }}>
                                        {incomingRequests.length === 0 ? (
                                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                                <User size={48} color={colors.textMuted} strokeWidth={1} style={{ marginBottom: 12 }} />
                                                <Text style={{ color: colors.textMuted }}>{tr('No pending requests', 'Aucune demande en attente', 'لا توجد طلبات معلقة')}</Text>
                                            </View>
                                        ) : (
                                            incomingRequests.map((req) => (
                                                <View key={req.id} style={[styles.userListItem, { borderBottomColor: colors.border }]}>
                                                    <View style={styles.userListItemLeft}>
                                                        <View style={[styles.userAvatar, { backgroundColor: isDark ? '#333' : '#EEE' }]}>
                                                            {req.senderAvatar ? (
                                                                <Image source={{ uri: req.senderAvatar }} style={styles.userAvatarImg} />
                                                            ) : (
                                                                <User size={20} color={colors.textMuted} />
                                                            )}
                                                        </View>
                                                        <View style={{ marginLeft: 12 }}>
                                                            <Text style={[styles.userNameText, { color: colors.foreground }]}>{req.senderName}</Text>
                                                            <Text style={{ fontSize: 11, color: colors.textMuted }}>{tr('Wants to be your friend', 'Veut être votre ami', 'يريد أن يكون صديقك')}</Text>
                                                        </View>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                                        <TouchableOpacity
                                                            onPress={() => handleRejectFriendRequest(req)}
                                                            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', alignItems: 'center', justifyContent: 'center' }}
                                                        >
                                                            <X size={16} color="#EF4444" />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => handleAcceptFriendRequest(req)}
                                                            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center' }}
                                                        >
                                                            <Check size={16} color="#10B981" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ))
                                        )}
                                    </ScrollView>
                                )}
                            </>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.selectedUserCard}>
                                    <View style={[styles.userAvatarLarge, { backgroundColor: isDark ? '#333' : '#EEE', marginBottom: 15 }]}>
                                        {selectedUserForTransfer.avatarUrl ? (
                                            <Image source={{ uri: selectedUserForTransfer.avatarUrl }} style={styles.userAvatarLargeImg} />
                                        ) : (
                                            <User size={40} color={colors.textMuted} />
                                        )}
                                    </View>
                                    <Text style={[styles.selectedUserName, { color: colors.foreground }]}>{selectedUserForTransfer.fullName}</Text>
                                    <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>{selectedUserForTransfer.email}</Text>

                                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 30 }}>
                                        <TouchableOpacity
                                            style={[styles.profileActionBtn, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }]}
                                            onPress={() => {
                                                if (onNavigate) {
                                                    onNavigate('PublicProfile', selectedUserForTransfer);
                                                    setShowTransferModal(false);
                                                } else {
                                                    setShowTargetProfile(!showTargetProfile);
                                                }
                                            }}
                                        >
                                            <User size={18} color="#3B82F6" />
                                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#3B82F6', marginLeft: 8 }}>
                                                {tr('View Profile', 'Voir Profil', 'عرض الملف')}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.profileActionBtn, {
                                                backgroundColor: profileData?.friends?.includes(selectedUserForTransfer.uid)
                                                    ? 'rgba(16, 185, 129, 0.1)'
                                                    : sentRequests.some(r => r.receiverId === selectedUserForTransfer.uid)
                                                        ? 'rgba(100, 100, 100, 0.1)'
                                                        : 'rgba(245, 158, 11, 0.1)'
                                            }]}
                                            onPress={() => !profileData?.friends?.includes(selectedUserForTransfer.uid) && handleSendFriendRequest(selectedUserForTransfer)}
                                            disabled={sentRequests.some(r => r.receiverId === selectedUserForTransfer.uid) || profileData?.friends?.includes(selectedUserForTransfer.uid)}
                                        >
                                            {profileData?.friends?.includes(selectedUserForTransfer.uid) ? (
                                                <>
                                                    <Check size={18} color="#10B981" />
                                                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#10B981', marginLeft: 8 }}>{tr('Friend ✓', 'Ami ✓', 'صديق ✓')}</Text>
                                                </>
                                            ) : sentRequests.some(r => r.receiverId === selectedUserForTransfer.uid) ? (
                                                <>
                                                    <RefreshCw size={18} color={colors.textMuted} />
                                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, marginLeft: 8 }}>{tr('Requested', 'Demandé', 'تم الطلب')}</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Users size={18} color="#F59E0B" />
                                                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#F59E0B', marginLeft: 8 }}>{tr('Add Friend', 'Ajouter Ami', 'إضافة صديق')}</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    {showTargetProfile && (
                                        <Animatable.View animation="fadeIn" style={[styles.profileDetailsBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                                            <Text style={[styles.profileDetailsTitle, { color: colors.foreground }]}>{tr('User Info', 'Infos Utilisateur', 'معلومات المستخدم')}</Text>
                                            <View style={styles.profileDetailRow}>
                                                <Text style={{ fontSize: 12, color: colors.textMuted }}>{tr('Member Since', 'Membre depuis', 'عضو منذ')}</Text>
                                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.foreground }}>
                                                    {selectedUserForTransfer.createdAt ? new Date(selectedUserForTransfer.createdAt.seconds * 1000).toLocaleDateString() : '---'}
                                                </Text>
                                            </View>
                                            {selectedUserForTransfer.bio && (
                                                <View style={{ marginTop: 10 }}>
                                                    <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Bio</Text>
                                                    <Text style={{ fontSize: 12, color: colors.foreground }}>{selectedUserForTransfer.bio}</Text>
                                                </View>
                                            )}
                                        </Animatable.View>
                                    )}

                                    <View style={{ width: '100%', marginTop: 20 }}>
                                        <View style={styles.exchangeSelector}>
                                            <TouchableOpacity
                                                style={[styles.exchangeTypeBtn, transferType === 'coins' && { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }]}
                                                onPress={() => setTransferType('coins')}
                                            >
                                                <Coins size={18} color={transferType === 'coins' ? '#FFF' : '#F59E0B'} fill={transferType === 'coins' ? '#FFF' : 'transparent'} />
                                                <Text style={{ marginLeft: 8, fontSize: 12, fontWeight: '700', color: transferType === 'coins' ? '#FFF' : '#F59E0B' }}>{tr('Coins', 'Pièces', 'عملات')}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.exchangeTypeBtn, transferType === 'diamonds' && { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }]}
                                                onPress={() => setTransferType('diamonds')}
                                            >
                                                <Gem size={18} color={transferType === 'diamonds' ? '#FFF' : '#8B5CF6'} fill={transferType === 'diamonds' ? '#FFF' : 'transparent'} />
                                                <Text style={{ marginLeft: 8, fontSize: 12, fontWeight: '700', color: transferType === 'diamonds' ? '#FFF' : '#8B5CF6' }}>{tr('Diamonds', 'Diamants', 'ماس')}</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 25 }]}>
                                            {tr('Amount to Transfer', 'Montant à Transférer', 'المبلغ المراد تحويله')}
                                        </Text>
                                        <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', marginTop: 8 }]}>
                                            <TextInput
                                                style={[styles.modalInput, { color: colors.foreground }]}
                                                keyboardType="numeric"
                                                value={transferAmount}
                                                onChangeText={setTransferAmount}
                                                placeholder="0"
                                                placeholderTextColor={colors.textMuted}
                                            />
                                            <TouchableOpacity onPress={() => setTransferAmount((transferType === 'coins' ? coinBalance : diamondBalance).toString())}>
                                                <Text style={{ color: colors.info, fontWeight: 'bold', fontSize: 13 }}>MAX</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity
                                            style={[
                                                styles.confirmBtn,
                                                {
                                                    backgroundColor: loading || !transferAmount || !profileData?.friends?.includes(selectedUserForTransfer.uid)
                                                        ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                                                        : colors.info,
                                                    marginTop: 30,
                                                    height: 56
                                                }
                                            ]}
                                            onPress={handleTransfer}
                                            disabled={loading || !transferAmount || !profileData?.friends?.includes(selectedUserForTransfer.uid)}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                {loading ? (
                                                    <ActivityIndicator size="small" color="#FFF" />
                                                ) : (
                                                    <>
                                                        <Send size={18} color="#FFF" style={{ marginRight: 10 }} />
                                                        <Text style={[styles.confirmBtnText, { color: loading || !transferAmount || !profileData?.friends?.includes(selectedUserForTransfer.uid) ? colors.textMuted : '#FFF' }]}>
                                                            {!profileData?.friends?.includes(selectedUserForTransfer.uid)
                                                                ? tr('Friends Only', 'Amis Uniquement', 'للأصدقاء فقط')
                                                                : tr('Confirm Transfer', 'Confirmer Transfert', 'تأكيد التحويل')
                                                            }
                                                        </Text>
                                                    </>
                                                )}
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={{ alignSelf: 'center', marginTop: 20 }}
                                            onPress={() => setSelectedUserForTransfer(null)}
                                        >
                                            <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>{tr('Back to Search', 'Retour à la recherche', 'العودة للبحث')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        )}
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
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1.5,
        marginBottom: 12,
        justifyContent: 'space-between',
        minHeight: 160,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    coinIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    coinAmount: {
        fontSize: 18,
        fontWeight: '900',
    },
    bonusText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10B981',
        marginTop: 4,
    },
    priceButton: {
        width: '100%',
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 14,
    },
    priceText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 20,
    },
    actionBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        height: 100,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    actionBtnTitle: {
        fontSize: 14,
        fontWeight: '800',
    },
    transferBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    transferBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transferBannerTitle: {
        fontSize: 15,
        fontWeight: '800',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(100,100,100,0.1)',
    },
    transactionInfo: {
        flex: 1,
        marginLeft: 15,
    },
    transactionTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 12,
    },
    transactionAmount: {
        alignItems: 'flex-end',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(100,100,100,0.05)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 24,
        marginTop: 20,
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
    },
    userListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    userListItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    userAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userAvatarImg: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    userNameText: {
        fontSize: 15,
        fontWeight: '600',
    },
    selectedUserCard: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 30,
    },
    userAvatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userAvatarLargeImg: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    selectedUserName: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    profileActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 12,
    },
    profileDetailsBox: {
        width: '100%',
        padding: 15,
        borderRadius: 16,
        marginTop: 10,
    },
    profileDetailsTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 10,
    },
    profileDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    exchangeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
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
    confirmBtn: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnText: {
        color: '#FFF',
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
});
