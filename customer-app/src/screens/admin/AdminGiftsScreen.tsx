import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import { AdminHeader } from '../../components/admin/AdminUI';
import { Gift, Trash2, Plus, X, Save } from 'lucide-react-native';

interface ScratchGift {
    id: string;
    amount: number;
    type: 'amount' | 'free_delivery' | 'cashback' | 'coupon';
    code?: string;
    active: boolean;
}

export default function AdminGiftsScreen({ onBack, t }: any) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';
    const [gifts, setGifts] = useState<ScratchGift[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newAmount, setNewAmount] = useState('');
    const [newType, setNewType] = useState<'amount' | 'free_delivery' | 'cashback' | 'coupon'>('amount');
    const [newCode, setNewCode] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchGifts();
    }, []);

    const fetchGifts = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, 'scratch_gifts'), orderBy('amount', 'asc'));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => {
                const docData = d.data();
                return {
                    id: d.id,
                    ...docData,
                    type: docData.type || 'amount' // Default to amount for legacy
                } as ScratchGift;
            });
            setGifts(data);
        } catch (error) {
            console.error('Error fetching gifts:', error);
            Alert.alert(t('error', 'Erreur'), t('fetchGiftsError', 'Impossible de récupérer les cadeaux'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddGift = async () => {
        const amount = parseFloat(newAmount) || 0;
        if (newType !== 'free_delivery' && (isNaN(amount) || amount <= 0)) {
            Alert.alert(t('error', 'Erreur'), t('invalidAmount', 'Veuillez entrer un montant valide'));
            return;
        }

        if (newType === 'coupon' && !newCode.trim()) {
            Alert.alert(t('error', 'Erreur'), t('enterCouponCode', 'Veuillez entrer un code coupon'));
            return;
        }

        try {
            setSaving(true);
            await addDoc(collection(db, 'scratch_gifts'), {
                amount: newType === 'free_delivery' ? 0 : amount,
                type: newType,
                code: newType === 'coupon' ? newCode.trim() : null,
                active: true,
                createdAt: new Date().toISOString()
            });
            setNewAmount('');
            setNewCode('');
            setNewType('amount');
            setModalVisible(false);
            fetchGifts();
        } catch (error) {
            console.error('Error adding gift:', error);
            Alert.alert(t('error', 'Erreur'), t('addGiftError', 'Impossible d\'ajouter le cadeau'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGift = (id: string) => {
        Alert.alert(
            t('giftDelete', 'Supprimer'),
            t('confirmDeleteGift', 'Êtes-vous sûr de vouloir supprimer ce cadeau ?'),
            [
                { text: t('cancel', 'Annuler'), style: 'cancel' },
                {
                    text: t('giftDelete', 'Supprimer'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'scratch_gifts', id));
                            fetchGifts();
                        } catch (error) {
                            Alert.alert(t('error', 'Erreur'), t('deleteGiftError', 'Impossible de supprimer'));
                        }
                    }
                }
            ]
        );
    };

    const toggleGiftStatus = async (gift: ScratchGift) => {
        try {
            await updateDoc(doc(db, 'scratch_gifts', gift.id), {
                active: !gift.active
            });
            fetchGifts();
        } catch (error) {
            Alert.alert(t('error', 'Erreur'), t('updateStatusError', 'Impossible de mettre à jour le statut'));
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'amount': return t('giftAmount', 'MONTANT');
            case 'free_delivery': return t('giftTypeFreeDelivery', 'LIVRAISON GRATUITE');
            case 'cashback': return t('giftTypeCashback', 'CASHBACK');
            case 'coupon': return t('giftTypeCoupon', 'COUPON');
            default: return type;
        }
    };

    const renderItem = ({ item }: { item: ScratchGift }) => (
        <View style={[
            s.giftCard,
            {
                backgroundColor: isDark ? '#111118' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
            }
        ]}>
            <View style={s.giftInfo}>
                <View style={[s.iconBox, { backgroundColor: '#FFD700' + (isDark ? '20' : '14') }]}>
                    <Gift size={20} color="#FFD700" />
                </View>
                <View style={{ marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[s.giftAmount, { color: colors.foreground }]}>
                            {item.type === 'free_delivery' ? t('freeDelivery', 'GRATUIT') : `${(item.amount || 0).toFixed(2)} TND`}
                        </Text>
                        <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ color: '#3B82F6', fontSize: 8, fontWeight: '800' }}>{getTypeLabel(item.type)}</Text>
                        </View>
                    </View>
                    {item.type === 'coupon' && item.code && (
                        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}>Code: {item.code}</Text>
                    )}
                    <Text style={[s.giftStatus, { color: item.active ? '#34C759' : colors.textMuted }]}>
                        {item.active ? t('giftActive', 'ACTIF') : t('giftInactive', 'INACTIF')}
                    </Text>
                </View>
            </View>
            <View style={s.actions}>
                <TouchableOpacity
                    onPress={() => toggleGiftStatus(item)}
                    style={[s.actionBtn, { backgroundColor: item.active ? 'rgba(52, 199, 89, 0.1)' : 'rgba(142, 142, 147, 0.1)' }]}
                >
                    <Text style={{ color: item.active ? '#34C759' : '#8E8E93', fontSize: 10, fontWeight: '700' }}>
                        {item.active ? t('giftDeactivate', 'DÉSACTIVER') : t('giftActivate', 'ACTIVER')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteGift(item.id)} style={s.deleteBtn}>
                    <Trash2 size={18} color="#FF3B30" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[s.root, { backgroundColor: colors.background }]}>
            <AdminHeader title={t('manageGifts', 'Gestion des Cadeaux')} onBack={onBack} />

            <View style={s.content}>
                <View style={s.headerRow}>
                    <Text style={[s.sectionTitle, { color: colors.foreground }]}>{t('listGifts', 'LISTE DES CADEAUX')}</Text>
                    <TouchableOpacity
                        onPress={() => setModalVisible(true)}
                        style={[s.addBtn, { backgroundColor: colors.primary }]}
                    >
                        <Plus size={18} color="#FFF" />
                        <Text style={s.addBtnText}>{t('addGift', 'AJOUTER')}</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={gifts}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={s.list}
                        ListEmptyComponent={
                            <View style={s.empty}>
                                <Text style={{ color: colors.textMuted }}>Aucun cadeau configuré</Text>
                            </View>
                        }
                    />
                )}
            </View>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={s.modalOverlay}
                >
                    <View style={[s.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                        <View style={s.modalHeader}>
                            <Text style={[s.modalTitle, { color: colors.foreground }]}>{t('addGift', 'Ajouter un Cadeau')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[s.label, { color: colors.foreground }]}>{t('giftType', 'Type de Cadeau')}</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                            {['amount', 'free_delivery', 'cashback', 'coupon'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setNewType(type as any)}
                                    style={[
                                        s.typeChip,
                                        {
                                            backgroundColor: newType === type ? colors.primary : (isDark ? '#2C2C2E' : '#F2F2F7'),
                                        }
                                    ]}
                                >
                                    <Text style={{
                                        color: newType === type ? '#FFF' : colors.foreground,
                                        fontSize: 10,
                                        fontWeight: '700'
                                    }}>
                                        {getTypeLabel(type).toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {newType !== 'free_delivery' && (
                            <>
                                <Text style={[s.label, { color: colors.foreground }]}>{t('giftValue', 'Valeur')} ({newType === 'amount' || newType === 'cashback' ? 'TND' : '%'})</Text>
                                <TextInput
                                    style={[s.input, {
                                        backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                                        color: colors.foreground,
                                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                    }]}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="numeric"
                                    value={newAmount}
                                    onChangeText={setNewAmount}
                                />
                            </>
                        )}

                        {newType === 'coupon' && (
                            <>
                                <Text style={[s.label, { color: colors.foreground }]}>{t('couponCode', 'Code Coupon')}</Text>
                                <TextInput
                                    style={[s.input, {
                                        backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                                        color: colors.foreground,
                                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                    }]}
                                    placeholder="CODE123"
                                    placeholderTextColor={colors.textMuted}
                                    value={newCode}
                                    onChangeText={setNewCode}
                                />
                            </>
                        )}

                        <TouchableOpacity
                            onPress={handleAddGift}
                            disabled={saving}
                            style={[s.saveBtn, { backgroundColor: colors.primary }]}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Save size={18} color="#FFF" />
                                    <Text style={s.saveBtnText}>{t('giftSave', 'ENREGISTRER')}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1 },
    content: { flex: 1, padding: 20, paddingTop: 110 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 , marginTop:20 },
    sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 , marginTop: 20},
    addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 4 },
    addBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
    list: { paddingBottom: 40 },
    giftCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    giftInfo: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    giftAmount: { fontSize: 16, fontWeight: '800' },
    giftStatus: { fontSize: 9, fontWeight: '800', marginTop: 2 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    actionBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    deleteBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    empty: { alignItems: 'center', marginTop: 40 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '900' },
    label: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
    input: { height: 50, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, fontWeight: '600', borderWidth: 1, marginBottom: 24 },
    saveBtn: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
});
