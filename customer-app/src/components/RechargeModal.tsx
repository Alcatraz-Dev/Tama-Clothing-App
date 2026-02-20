import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Alert, ScrollView } from 'react-native';
import { X, Coins, Plus } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, setDoc, increment, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../api/firebase';

const { width, height } = Dimensions.get('window');

const RECHARGE_PACKAGES = [
    { id: '1', coins: 100, price: 3.00, priceDisplay: '3.00 TND', bonus: 0 },
    { id: '2', coins: 550, price: 15.00, priceDisplay: '15.00 TND', bonus: 50 },
    { id: '3', coins: 1200, price: 30.00, priceDisplay: '30.00 TND', bonus: 200 },
    { id: '4', coins: 2500, price: 60.00, priceDisplay: '60.00 TND', bonus: 500 },
    { id: '5', coins: 6500, price: 150.00, priceDisplay: '150.00 TND', bonus: 1500 },
    { id: '6', coins: 13500, price: 300.00, priceDisplay: '300.00 TND', bonus: 3500 },
];

interface RechargeModalProps {
    isVisible: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    language?: string;
}

export const RechargeModal = ({ isVisible, onClose, userId, userName, language = 'fr' }: RechargeModalProps) => {
    const [loading, setLoading] = useState(false);

    const tr = (en: string, fr: string, ar: string) => {
        return language === 'ar' ? ar : (language === 'fr' ? fr : en);
    };

    const handleRecharge = async (pack: any) => {
        if (!userId) {
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
                            const userRef = doc(db, 'users', userId);
                            await setDoc(userRef, {
                                wallet: {
                                    coins: increment(pack.coins + pack.bonus)
                                }
                            }, { merge: true });

                            // Record Transaction
                            await addDoc(collection(db, 'users', userId, 'transactions'), {
                                type: 'recharge',
                                amount: pack.coins + pack.bonus,
                                currency: 'coins',
                                price: pack.price,
                                priceDisplay: pack.priceDisplay,
                                description: `In-Live Coin Pack Purchase (${pack.coins} + ${pack.bonus} Bonus)`,
                                timestamp: serverTimestamp(),
                                status: 'completed'
                            });

                            Alert.alert(tr('Success', 'Succès', 'ناجح'), `${tr('You purchased', 'Vous avez acheté', 'لقد اشتريت')} ${pack.coins + pack.bonus} ${tr('coins!', 'pièces!', 'عملات!')}`);
                            onClose();
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

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.modalContent}>
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

                    <View style={styles.header}>
                        <View style={styles.headerIndicator} />
                        <View style={styles.headerRow}>
                            <Text style={styles.headerTitle}>{tr('Recharge Coins', 'Recharger des Pièces', 'شحن العملات')}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.grid}>
                            {RECHARGE_PACKAGES.map((pack) => (
                                <TouchableOpacity
                                    key={pack.id}
                                    style={styles.packageCard}
                                    onPress={() => handleRecharge(pack)}
                                    disabled={loading}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={styles.coinIconContainer}>
                                            <Coins size={24} color="#F59E0B" fill="#F59E0B" />
                                        </View>
                                        <Text style={styles.coinAmount}>{pack.coins}</Text>
                                    </View>

                                    <View style={styles.bonusContainer}>
                                        {pack.bonus > 0 ? (
                                            <Text style={styles.bonusText}>+{pack.bonus} {tr('Bonus', 'Bonus', 'مكافأة')}</Text>
                                        ) : (
                                            <View style={{ height: 14 }} /> // Placeholder to keep spacing
                                        )}
                                    </View>

                                    <LinearGradient
                                        colors={['#F59E0B', '#D97706']}
                                        style={styles.priceBtn}
                                    >
                                        <Text style={styles.priceText}>{pack.priceDisplay}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        height: height * 0.7,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
        backgroundColor: '#16161E',
    },
    header: {
        paddingTop: 12,
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    headerIndicator: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 15,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 15,
        paddingBottom: 40,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    packageCard: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        minHeight: 160,
        justifyContent: 'space-between'
    },
    cardHeader: {
        alignItems: 'center',
        width: '100%',
    },
    bonusContainer: {
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    coinIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    coinAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    bonusText: {
        fontSize: 10,
        color: '#10B981',
        fontWeight: '700',
        marginBottom: 10,
    },
    priceBtn: {
        width: '100%',
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    priceText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    }
});
