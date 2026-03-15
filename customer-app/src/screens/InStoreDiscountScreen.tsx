import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Alert,
    Animated,
    Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../api/firebase';
import { ChevronLeft, QrCode, Clock, Gift, CheckCircle2, AlertCircle, Sparkles, MapPin, ArrowRight, Wallet, Banknote, CreditCard } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InStoreDiscountScreenProps {
    storeId: string;
    userId: string;
    onClose: () => void;
    t: (key: string) => string;
    isDark: boolean;
    language: string;
    cart: any[];
}

export default function InStoreDiscountScreen({ storeId, userId, onClose, t, isDark, language, cart }: InStoreDiscountScreenProps) {
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [store, setStore] = useState<any>(null);
    const [activeCoupon, setActiveCoupon] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [activating, setActivating] = useState(false);
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    
    const [billAmount, setBillAmount] = useState('');
    const [isPaid, setIsPaid] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'app' | null>(null);

    const sendInStoreNotification = async (targetId: string, titleKey: string, bodyKey: string, params: any = {}) => {
        try {
            let title = t(titleKey);
            let body = t(bodyKey);
            
            Object.keys(params).forEach(key => {
                body = body.replace(`{{${key}}}`, String(params[key]));
            });

            await addDoc(collection(db, 'notifications'), {
                userId: targetId,
                title,
                body,
                data: { ...params, screen: 'InStoreDiscount', storeId },
                read: false,
                createdAt: serverTimestamp(),
                type: 'in_store'
            });
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    useEffect(() => {
        fetchStoreData();
    }, [storeId]);

    useEffect(() => {
        if (activeCoupon) {
            const timer = setInterval(() => {
                const now = new Date().getTime();
                const expiry = activeCoupon.expiresAt.toDate().getTime();
                const diff = Math.max(0, Math.floor((expiry - now) / 1000));
                setTimeLeft(diff);
                
                if (diff <= 0) {
                    clearInterval(timer);
                    handleCouponExpiry();
                }
            }, 1000);

            // Listen for usage
            const unsub = onSnapshot(doc(db, 'active_coupons', activeCoupon.id), (snap) => {
                if (snap.exists() && snap.data().status === 'used') {
                    setActiveCoupon((prev: any) => ({ ...prev, status: 'used' }));
                    Alert.alert(t('success'), t('couponUsed'));
                    sendInStoreNotification(userId, 'notifCouponVerifiedTitle', 'notifCouponVerifiedBody');
                }
            });

            return () => {
                clearInterval(timer);
                unsub();
            };
        }
    }, [activeCoupon]);

    // Auto-calculate bill from cart
    useEffect(() => {
        if (activeCoupon && activeCoupon.status === 'used' && !isPaid) {
            const storeItems = cart.filter(item => item.brandId === storeId);
            if (storeItems.length > 0) {
                const total = storeItems.reduce((sum, item) => {
                    const price = item.discountPrice ? Number(item.discountPrice) : Number(item.price);
                    return sum + (price * (item.quantity || 1));
                }, 0);
                setBillAmount(total.toFixed(3));
            } else if (activeCoupon.id.startsWith('demo-')) {
                // If demo and cart empty, set a mock value
                setBillAmount('100.000');
            }
        }
    }, [activeCoupon, cart, storeId, isPaid]);

    const fetchStoreData = async () => {
        try {
            const storeSnap = await getDoc(doc(db, 'brands', storeId));
            if (storeSnap.exists()) {
                setStore({ id: storeId, ...storeSnap.data() });
            } else {
                Alert.alert(t('error'), t('invalidStoreQR'));
                onClose();
            }
        } catch (error) {
            console.error('Error fetching store:', error);
        } finally {
            setLoading(false);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
    };

    const activatePromotion = async () => {
        setActivating(true);
        try {
            // Check if user already has an active coupon for this store
            // (Minimal implementation: just generate a new one for now)
            
            const promo = store.inStorePromotion || { type: 'percentage', value: 10, points: 50 };
            const expiresAt = new Date(new Date().getTime() + 15 * 60 * 1000); // 15 minutes

            const couponRef = doc(collection(db, 'active_coupons'));
            const couponId = couponRef.id;

            const newCoupon = {
                userId,
                storeId,
                storeName: store.nameFr || store.name || 'Store',
                type: promo.type,
                value: promo.value,
                points: promo.points,
                createdAt: serverTimestamp(),
                expiresAt,
                status: 'pending',
                qrData: `bey3a://verify-coupon/${couponId}`
            };

            await setDoc(couponRef, newCoupon);
            setActiveCoupon({ id: couponId, ...newCoupon, expiresAt: { toDate: () => expiresAt } });

            // Notify Customer
            sendInStoreNotification(userId, 'notifPromoActivatedTitle', 'notifPromoActivatedBody');
            
            // Notify Vendor/Brand
            if (store.vendorId || store.uid) {
                sendInStoreNotification(store.vendorId || store.uid, 'notifPromoActivatedTitle', 'A customer just activated a promotion for your store');
            }
        } catch (error) {
            console.error('Error activating promotion:', error);
            Alert.alert(t('error'), 'Failed to activate promotion');
        } finally {
            setActivating(false);
        }
    };

    const handleCouponExpiry = async () => {
        if (activeCoupon && activeCoupon.status === 'pending') {
            await updateDoc(doc(db, 'active_coupons', activeCoupon.id), { status: 'expired' });
            setActiveCoupon(null);
            Alert.alert(t('info'), t('couponEnded'));
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handlePayment = async (method: 'cash' | 'app') => {
        const amount = parseFloat(billAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert(t('error'), t('invalidAmount') || 'Please enter a valid amount');
            return;
        }

        setPaymentLoading(true);
        try {
            const discount = activeCoupon.type === 'percentage' 
                ? (amount * (activeCoupon.value / 100)) 
                : activeCoupon.value;
            const final = Math.max(0, amount - discount);

            if (method === 'app') {
                const storeItems = cart.filter(item => item.brandId === storeId);
                const orderItems = storeItems.length > 0 
                    ? storeItems.map(item => ({
                        ...item,
                        id: item.id || item.productId,
                        price: item.discountPrice ? Number(item.discountPrice) : Number(item.price),
                    }))
                    : [{
                        id: 'in-store-purchase',
                        name: { fr: 'Achat en magasin', ar: 'شراء من المتجر', en: 'In-store Purchase' },
                        price: final,
                        quantity: 1,
                        image: store.logoUrl
                    }];

                // Create a virtual order for in-store purchase
                await addDoc(collection(db, 'orders'), {
                    userId,
                    storeId,
                    storeName: activeCoupon.storeName,
                    items: orderItems,
                    subtotal: amount,
                    discount: discount,
                    total: final,
                    deliveryCost: 0,
                    paymentMethod: 'app_wallet',
                    status: 'paid',
                    type: 'in_store',
                    createdAt: serverTimestamp(),
                    customer: {
                        uid: userId,
                        email: auth.currentUser?.email || '',
                        fullName: auth.currentUser?.displayName || 'Customer'
                    }
                });
            }

            // Mark coupon as used if not already
            if (activeCoupon.status !== 'used') {
                await updateDoc(doc(db, 'active_coupons', activeCoupon.id), { status: 'used' });
            }

            setPaymentMethod(method);
            setIsPaid(true);

            // Notify Customer
            sendInStoreNotification(userId, 'notifPaymentSuccessTitle', 'notifPaymentSuccessBody', { storeName: activeCoupon.storeName });
            
            // Notify Vendor
            if (store.vendorId || store.uid) {
                sendInStoreNotification(store.vendorId || store.uid, 'notifVendorNewSaleTitle', 'notifVendorNewSaleBody', { 
                    amount: final.toFixed(3), 
                    method: method === 'app' ? t('payWithApp') : t('payCash') 
                });
            }

            // Notify Admin
            sendInStoreNotification('ADMIN', 'In-Store Sale Confirmed', `Sale of ${final.toFixed(3)} TND at ${activeCoupon.storeName} via ${method}`);

            Alert.alert(t('success'), t('paymentConfirmed'));
        } catch (error) {
            console.error('Payment error:', error);
            Alert.alert(t('error'), 'Payment failed');
        } finally {
            setPaymentLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
                <ActivityIndicator size="large" color="#00FF9D" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
            <LinearGradient
                colors={isDark ? ['#1A1A1A', '#000'] : ['#F5F5F5', '#FFF']}
                style={StyleSheet.absoluteFill}
            />
            
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <ChevronLeft size={28} color={isDark ? '#FFF' : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>
                    {t('scanInStore')}
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View style={[styles.storeCard, { opacity: fadeAnim }]}>
                    <Image 
                        source={{ uri: store.logoUrl || 'https://via.placeholder.com/150' }} 
                        style={styles.storeLogo} 
                    />
                    <Text style={[styles.storeName, { color: isDark ? '#FFF' : '#000' }]}>
                        {language === 'ar' ? store.nameAr : language === 'fr' ? store.nameFr : store.nameEn || store.name}
                    </Text>
                    <View style={styles.locationTag}>
                        <MapPin size={14} color="#00FF9D" />
                        <Text style={styles.locationText}>{t('officialPartner')}</Text>
                    </View>

                    {!activeCoupon ? (
                        <View style={styles.promoContainer}>
                            <LinearGradient
                                colors={['rgba(0, 255, 157, 0.1)', 'transparent']}
                                style={styles.promoBox}
                            >
                                <Sparkles size={24} color="#00FF9D" style={styles.promoIcon} />
                                <Text style={styles.promoTitle}>{t('limitedTimeOffer')}</Text>
                                <Text style={styles.promoValue}>
                                    -{store.inStorePromotion?.value || 10}{store.inStorePromotion?.type === 'percentage' ? '%' : ' TND'}
                                </Text>
                                <Text style={styles.promoDesc}>{t('storeDiscount')}</Text>
                                
                                <View style={styles.pointsTag}>
                                    <Gift size={16} color="#FFD700" />
                                    <Text style={styles.pointsText}>+{store.inStorePromotion?.points || 50} Points</Text>
                                </View>
                            </LinearGradient>

                            <TouchableOpacity 
                                style={styles.activateButton}
                                onPress={activatePromotion}
                                disabled={activating}
                            >
                                <LinearGradient
                                    colors={['#00FF9D', '#00CC7E']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                />
                                {activating ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <Text style={styles.activateButtonText}>{t('activatePromotion')}</Text>
                                        <ArrowRight size={20} color="#000" />
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.activateButton, { marginTop: 12, backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5', borderWidth: 1, borderColor: isDark ? '#333' : '#DDD', shadowOpacity: 0, elevation: 0 }]}
                                onPress={() => {
                                    const promo = store.inStorePromotion || { type: 'percentage', value: 10, points: 50 };
                                    const expiresAt = new Date(new Date().getTime() + 15 * 60 * 1000);
                                    setActiveCoupon({
                                        id: 'demo-' + Date.now(),
                                        userId,
                                        storeId,
                                        storeName: store.nameFr || store.name || 'Store',
                                        type: promo.type,
                                        value: promo.value,
                                        points: promo.points,
                                        expiresAt: { toDate: () => expiresAt },
                                        status: 'pending',
                                        qrData: `bey3a://demo-test`
                                    });
                                }}
                            >
                                <Text style={[styles.activateButtonText, { color: isDark ? '#FFF' : '#000', fontSize: 14 }]}>DEMO TEST (SKIP)</Text>
                                <Sparkles size={16} color={isDark ? '#FFF' : '#000'} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.couponContainer}>
                            <View style={[styles.couponCard, { backgroundColor: isDark ? '#222' : '#F9F9F9' }]}>
                                {activeCoupon.status === 'used' ? (
                                    <View style={styles.usedOverlay}>
                                        {!isPaid ? (
                                            <>
                                                <CheckCircle2 size={48} color="#00FF9D" />
                                                <Text style={[styles.usedText, { fontSize: 20, marginTop: 10 }]}>{t('couponVerified')}</Text>
                                                
                                                <View style={styles.paymentForm}>
                                                    <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>{t('totalAmount')} (TND)</Text>
                                                    <TextInput
                                                        style={[styles.amountInput, { 
                                                            backgroundColor: isDark ? '#333' : '#EEE',
                                                            color: isDark ? '#FFF' : '#000'
                                                        }]}
                                                        placeholder="0.000"
                                                        placeholderTextColor="#888"
                                                        keyboardType="decimal-pad"
                                                        value={billAmount}
                                                        onChangeText={setBillAmount}
                                                    />

                                                    {parseFloat(billAmount) > 0 && (
                                                        <View style={styles.calculationBox}>
                                                            <View style={styles.calcRow}>
                                                                <Text style={styles.calcLabel}>{t('discount')}</Text>
                                                                <Text style={styles.calcValue}>-{activeCoupon.type === 'percentage' ? `${(parseFloat(billAmount) * (activeCoupon.value / 100)).toFixed(3)} (${activeCoupon.value}%)` : `${activeCoupon.value.toFixed(3)}`}</Text>
                                                            </View>
                                                            <View style={styles.calcDivider} />
                                                            <View style={styles.calcRow}>
                                                                <Text style={[styles.calcLabel, { fontWeight: 'bold' }]}>{t('finalAmount')}</Text>
                                                                <Text style={[styles.calcValue, { color: '#00FF9D', fontSize: 18 }]}>
                                                                    {(Math.max(0, parseFloat(billAmount) - (activeCoupon.type === 'percentage' ? (parseFloat(billAmount) * (activeCoupon.value / 100)) : activeCoupon.value))).toFixed(3)} TND
                                                                </Text>
                                                            </View>
                                                            <Text style={styles.noDeliveryNote}>{t('noDeliveryInStore')}</Text>
                                                        </View>
                                                    )}

                                                    <View style={styles.paymentButtons}>
                                                        <TouchableOpacity 
                                                            style={[styles.payButton, { backgroundColor: '#3498db' }]}
                                                            onPress={() => handlePayment('app')}
                                                            disabled={paymentLoading}
                                                        >
                                                            {paymentLoading ? <ActivityIndicator color="#FFF" /> : (
                                                                <>
                                                                    <CreditCard size={18} color="#FFF" />
                                                                    <Text style={styles.payButtonText}>{t('payWithApp')}</Text>
                                                                </>
                                                            )}
                                                        </TouchableOpacity>

                                                        <TouchableOpacity 
                                                            style={[styles.payButton, { backgroundColor: '#27ae60' }]}
                                                            onPress={() => handlePayment('cash')}
                                                            disabled={paymentLoading}
                                                        >
                                                            <Banknote size={18} color="#FFF" />
                                                            <Text style={styles.payButtonText}>{t('payCash')}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </>
                                        ) : (
                                            <>
                                                <View style={styles.successCircle}>
                                                    <CheckCircle2 size={64} color="#00FF9D" />
                                                </View>
                                                <Text style={styles.usedText}>{t('paymentCompleted')}</Text>
                                                <View style={styles.summaryBox}>
                                                    <Text style={[styles.statValue, { fontSize: 32 }]}>
                                                        {(Math.max(0, parseFloat(billAmount) - (activeCoupon.type === 'percentage' ? (parseFloat(billAmount) * (activeCoupon.value / 100)) : activeCoupon.value))).toFixed(3)} TND
                                                    </Text>
                                                    <Text style={styles.methodText}>
                                                        {paymentMethod === 'app' ? t('payWithApp') : t('payCash')}
                                                    </Text>
                                                </View>
                                                <TouchableOpacity onPress={onClose} style={styles.finishButton}>
                                                    <Text style={styles.finishButtonText}>{t('close') || 'Fermer'}</Text>
                                                </TouchableOpacity>
                                            </>
                                        )}
                                    </View>
                                ) : (
                                    <>
                                        <View style={styles.couponHeader}>
                                            <Text style={styles.couponLabel}>{t('storePromotionActive')}</Text>
                                            <View style={styles.timerTag}>
                                                <Clock size={14} color="#FF4B4B" />
                                                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.qrContainer}>
                                            <QRCode
                                                value={activeCoupon.qrData}
                                                size={200}
                                                color="#000"
                                                backgroundColor="transparent"
                                            />
                                        </View>

                                        <Text style={[styles.couponInstructions, { color: isDark ? '#AAA' : '#666' }]}>
                                            {t('showToCashier')}
                                        </Text>

                                        {activeCoupon.id.startsWith('demo-') && (
                                            <TouchableOpacity 
                                                style={[styles.activateButton, { height: 45, marginTop: 0, marginBottom: 20 }]}
                                                onPress={() => {
                                                    setActiveCoupon((prev: any) => ({ ...prev, status: 'used' }));
                                                    // Notify in demo
                                                    sendInStoreNotification(userId, 'notifCouponVerifiedTitle', 'notifCouponVerifiedBody');
                                                }}
                                            >
                                                <LinearGradient
                                                    colors={['#00FF9D', '#00CC7E']}
                                                    style={StyleSheet.absoluteFill}
                                                />
                                                <Text style={[styles.activateButtonText, { fontSize: 14 }]}>SIMULATE VALIDATION (CONFIRM REMIS)</Text>
                                            </TouchableOpacity>
                                        )}

                                        <View style={styles.couponFooter}>
                                            <View style={styles.couponStat}>
                                                <Text style={styles.statLabel}>{t('discount')}</Text>
                                                <Text style={styles.statValue}>
                                                    -{activeCoupon.value}{activeCoupon.type === 'percentage' ? '%' : ' TND'}
                                                </Text>
                                            </View>
                                            <View style={styles.divider} />
                                            <View style={styles.couponStat}>
                                                <Text style={styles.statLabel}>{t('points')}</Text>
                                                <Text style={styles.statValue}>{activeCoupon.points}</Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    )}
                </Animated.View>

                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <AlertCircle size={20} color={isDark ? '#AAA' : '#666'} />
                        <Text style={[styles.infoText, { color: isDark ? '#AAA' : '#666' }]}>
                            {t('onboardDesc5')}
                        </Text>
                    </View>
                </View>
            </ScrollView>
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
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    storeCard: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    storeLogo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#00FF9D',
    },
    storeName: {
        fontSize: 24,
        fontWeight: '900',
        marginTop: 15,
        textAlign: 'center',
    },
    locationTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 255, 157, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 10,
        gap: 6,
    },
    locationText: {
        color: '#00FF9D',
        fontSize: 12,
        fontWeight: 'bold',
    },
    promoContainer: {
        width: '100%',
        marginTop: 30,
    },
    promoBox: {
        width: '100%',
        padding: 30,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 157, 0.2)',
        overflow: 'hidden',
    },
    promoIcon: {
        marginBottom: 10,
    },
    promoTitle: {
        color: '#00FF9D',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    promoValue: {
        color: '#FFF',
        fontSize: 56,
        fontWeight: '900',
        marginVertical: 10,
    },
    promoDesc: {
        color: '#AAA',
        fontSize: 16,
    },
    pointsTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 15,
        marginTop: 20,
        gap: 8,
    },
    pointsText: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
    activateButton: {
        width: '100%',
        height: 60,
        borderRadius: 20,
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#00FF9D',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    activateButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '900',
    },
    couponContainer: {
        width: '100%',
        marginTop: 30,
    },
    couponCard: {
        width: '100%',
        padding: 20,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    couponHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    couponLabel: {
        color: '#00FF9D',
        fontWeight: 'bold',
    },
    timerTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 75, 75, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 6,
    },
    timerText: {
        color: '#FF4B4B',
        fontWeight: 'bold',
        fontSize: 12,
    },
    qrContainer: {
        padding: 20,
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginBottom: 20,
    },
    couponInstructions: {
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 25,
    },
    couponFooter: {
        flexDirection: 'row',
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 20,
        justifyContent: 'space-around',
    },
    couponStat: {
        alignItems: 'center',
    },
    statLabel: {
        color: '#888',
        fontSize: 12,
        marginBottom: 5,
    },
    statValue: {
        color: '#00FF9D',
        fontSize: 20,
        fontWeight: 'bold',
    },
    divider: {
        width: 1,
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    usedOverlay: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    usedText: {
        color: '#00FF9D',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
    },
    infoSection: {
        padding: 40,
        alignItems: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoText: {
        fontSize: 12,
        textAlign: 'center',
        flex: 1,
    },
    paymentForm: {
        width: '100%',
        marginTop: 20,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    amountInput: {
        width: '100%',
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 18,
        fontWeight: 'bold',
    },
    calculationBox: {
        marginTop: 20,
        padding: 15,
        borderRadius: 15,
        backgroundColor: 'rgba(0, 255, 157, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 157, 0.1)',
    },
    calcRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 4,
    },
    calcLabel: {
        color: '#888',
        fontSize: 14,
    },
    calcValue: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    calcDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 10,
    },
    noDeliveryNote: {
        color: '#00FF9D',
        fontSize: 11,
        fontStyle: 'italic',
        marginTop: 10,
        textAlign: 'center',
    },
    paymentButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 25,
    },
    payButton: {
        flex: 1,
        height: 50,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    payButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    summaryBox: {
        alignItems: 'center',
        marginTop: 20,
    },
    methodText: {
        color: '#888',
        fontSize: 14,
        marginTop: 5,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    successCircle: {
        padding: 20,
        borderRadius: 60,
        backgroundColor: 'rgba(0, 255, 157, 0.1)',
        marginBottom: 10,
    },
    finishButton: {
        marginTop: 30,
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    finishButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    }
});
