import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    Dimensions,
    StyleSheet,
    Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../../context/ThemeContext';
import {
    ChevronLeft,
    X,
    Trash2,
    Ticket,
    Package,
    Clock,
    RotateCcw,
    Plus,
} from 'lucide-react-native';
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
    getDocs,
} from 'firebase/firestore';
import { db } from '../../api/firebase';

import {
    AdminCard,
    SectionLabel,
    InputLabel,
    AdminChip,
    StatusBadge,
    EmptyState,
    ModernSwitch,
    AdminInput,
    AdminHeader,
} from '../../components/admin/AdminUI';

export default function AdminCouponsScreen({ onBack, t, profileData }: any) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';
    const isBrandOwner = profileData?.role === 'brand_owner';
    const myBrandId = profileData?.brandId;

    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [code, setCode] = useState('');
    const [type, setType] = useState<'percentage' | 'fixed' | 'free_shipping' | 'bundle_price'>('percentage');
    const [value, setValue] = useState('');
    const [minOrder, setMinOrder] = useState('');
    const [isActive, setIsActive] = useState(true);

    // Bundle State
    const [products, setProducts] = useState<any[]>([]);
    const [targetProductId, setTargetProductId] = useState('');
    const [tiers, setTiers] = useState<{ qty: number, price: number }[]>([{ qty: 1, price: 0 }]);
    const [showProductSelector, setShowProductSelector] = useState(false);

    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'coupons'), (snap) => {
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCoupons(isBrandOwner && myBrandId ? all.filter((c: any) => c.brandId === myBrandId) : all);
            setLoading(false);
        });

        getDocs(collection(db, 'products')).then(snap => {
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setProducts(isBrandOwner && myBrandId ? all.filter((p: any) => p.brandId === myBrandId) : all);
        });

        return unsub;
    }, []);

    const handleCreate = async () => {
        if (!code) { Alert.alert(t('error'), t('codeRequired')); return; }

        let couponData: any = {
            code: code.trim().toUpperCase(),
            type,
            isActive,
            createdAt: serverTimestamp(),
            minOrder: minOrder ? parseFloat(minOrder) : 0,
        };

        if (isBrandOwner && myBrandId) couponData.brandId = myBrandId;

        if (type === 'bundle_price') {
            if (!targetProductId) { Alert.alert(t('error'), t('selectProduct')); return; }
            const validTiers = tiers.filter(t => t.qty > 0 && t.price >= 0);
            if (validTiers.length === 0) { Alert.alert(t('error'), t('addPriceTier')); return; }
            couponData.targetProductId = targetProductId;
            couponData.tiers = validTiers;
            couponData.value = 0;
        } else {
            couponData.value = value ? parseFloat(value) : 0;
        }

        try {
            await addDoc(collection(db, 'coupons'), couponData);
            setCode(''); setValue(''); setMinOrder('');
            setTargetProductId(''); setTiers([{ qty: 1, price: 0 }]);
            Alert.alert(t('successTitle'), t('couponCreated'));
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(t('delete'), t('confirmDelete'), [
            { text: t('cancel'), style: 'cancel' },
            {
                text: t('delete'),
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'coupons', id));
                    } catch (e: any) { Alert.alert('Error', e.message); }
                }
            }
        ]);
    };

    const toggleActive = async (item: any) => {
        try {
            await updateDoc(doc(db, 'coupons', item.id), { isActive: !item.isActive });
        } catch (e) {
            console.error(e);
        }
    };

    const addTier = () => setTiers([...tiers, { qty: 0, price: 0 }]);
    const removeTier = (index: number) => setTiers(tiers.filter((_, i) => i !== index));
    const updateTier = (index: number, field: 'qty' | 'price', val: string) => {
        const newTiers = [...tiers];
        newTiers[index][field] = parseFloat(val) || 0;
        setTiers(newTiers);
    };

    const getProductName = (id: string) => {
        const p = products.find(prod => prod.id === id);
        if (!p) return 'Unknown Product';
        if (typeof p.name === 'object' && p.name !== null) {
            return p.name.en || p.name.fr || p.name['ar-tn'] || Object.values(p.name)[0] || 'Unknown Product';
        }
        return p.name || 'Unknown Product';
    };

    return (
        <View style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader title={t('coupons')} onBack={onBack} />

            <Animated.ScrollView
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                contentContainerStyle={[sc.scrollContent, { paddingTop: insets.top + 80 }]}
            >
                {/* Form Section */}
                <AdminCard style={sc.formCard}>
                    <SectionLabel text={t('createCoupon')} />

                    <AdminInput
                        label={t('codeRequired') ? t('codeRequired').toUpperCase() : "COUPON CODE"}
                        placeholder="e.g. SAVE20"
                        value={code}
                        onChangeText={setCode}
                        autoCapitalize="characters"
                    />

                    <View style={sc.chipsWrap}>
                        {['percentage', 'fixed', 'free_shipping', 'bundle_price'].map((tOpt) => (
                            <AdminChip
                                key={tOpt}
                                label={tOpt === 'free_shipping' ? t('freeShip') : tOpt === 'bundle_price' ? t('bundle') : (t(tOpt) || tOpt).toUpperCase()}
                                selected={type === tOpt}
                                onPress={() => setType(tOpt as any)}
                            />
                        ))}
                    </View>

                    {type === 'bundle_price' ? (
                        <View style={sc.bundleContainer}>
                            <AdminInput
                                label={t('targetProductLabel').toUpperCase()}
                                placeholder={t('selectProductPlaceholder')}
                                value={targetProductId ? getProductName(targetProductId) : ''}
                                editable={false}
                                onPress={() => setShowProductSelector(!showProductSelector)}
                            />

                            {showProductSelector && (
                                <View style={[sc.dropdown, { backgroundColor: theme === 'dark' ? '#1A1A24' : '#FFF', borderColor: colors.border }]}>
                                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                                        {products.length === 0 && <Text style={sc.emptyNote}>No products found</Text>}
                                        {products.map(p => (
                                            <TouchableOpacity key={p.id} onPress={() => { setTargetProductId(p.id); setShowProductSelector(false); }} style={sc.dropdownItem}>
                                                {p.images && p.images[0] && (
                                                    <Image source={{ uri: p.images[0] }} style={sc.miniImg} />
                                                )}
                                                <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: '600' }}>{getProductName(p.id)}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            <InputLabel text={t('priceTiers').toUpperCase()} />
                            {tiers.map((tier, index) => (
                                <View key={index} style={sc.tierRow}>
                                    <View style={{ flex: 1 }}>
                                        <AdminInput
                                            label=""
                                            placeholder={t('qty')}
                                            keyboardType="numeric"
                                            value={tier.qty ? tier.qty.toString() : ''}
                                            onChangeText={(v) => updateTier(index, 'qty', v)}
                                            style={{ marginBottom: 0 }}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AdminInput
                                            label=""
                                            placeholder={t('price')}
                                            keyboardType="numeric"
                                            value={tier.price ? tier.price.toString() : ''}
                                            onChangeText={(v) => updateTier(index, 'price', v)}
                                            style={{ marginBottom: 0 }}
                                        />
                                    </View>
                                    {tiers.length > 1 && (
                                        <TouchableOpacity onPress={() => removeTier(index)} style={sc.removeBtn}>
                                            <X size={18} color={colors.error} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                            <TouchableOpacity onPress={addTier} style={sc.addTierBtn}>
                                <Plus size={14} color={colors.foreground} />
                                <Text style={[sc.addTierText, { color: colors.foreground }]}>{t('addTierBtn')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        type !== 'free_shipping' && (
                            <AdminInput
                                label={type === 'percentage' ? t('percentage') || "PERCENTAGE (%)" : t('value') || "VALUE"}
                                placeholder={type === 'percentage' ? (t('percentagePlaceholder') || "e.g. 20") : (t('valuePlaceholder') || "e.g. 10")}
                                value={value}
                                onChangeText={setValue}
                                keyboardType="numeric"
                            />
                        )
                    )}

                    <AdminInput
                        label={t('minOrderOptional') || "MINIMUM COMMANDE (Optional)"}
                        placeholder="e.g. 50"
                        value={minOrder}
                        onChangeText={setMinOrder}
                        keyboardType="numeric"
                    />

                    <TouchableOpacity
                        style={[sc.submitBtn, { backgroundColor: colors.foreground }]}
                        onPress={handleCreate}
                    >
                        <Text style={[sc.submitBtnText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('createCoupon')}</Text>
                    </TouchableOpacity>
                </AdminCard>

                {/* List Section */}
                <SectionLabel text={t('active')} style={{ marginTop: 20, marginBottom: 15 }} />

                {coupons.length === 0 ? (
                    <EmptyState message={t('noCoupons')} icon={<Ticket size={48} color={colors.textMuted} />} />
                ) : (
                    coupons.map((coupon) => (
                        <AdminCard key={coupon.id} style={sc.couponCard}>
                            <View style={sc.couponHeader}>
                                <View style={{ flex: 1 }}>
                                    <View style={sc.codeRow}>
                                        <Text style={[sc.codeText, { color: colors.foreground }]}>{coupon.code}</Text>
                                        <StatusBadge active={coupon.isActive} activeLabel={t('activeStatus')} inactiveLabel={t('inactiveStatus')} />
                                    </View>

                                    <View style={sc.detailsBlock}>
                                        {coupon.type === 'free_shipping' && (
                                            <View style={sc.detailItem}>
                                                <Package size={14} color={colors.foreground} />
                                                <Text style={[sc.detailText, { color: colors.foreground }]}>{t('freeShip')}</Text>
                                            </View>
                                        )}
                                        {(coupon.type === 'percentage' || coupon.type === 'fixed') && (
                                            <Text style={[sc.detailText, { color: colors.foreground, fontWeight: '800', fontSize: 13 }]}>
                                                {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `${coupon.value} TND OFF`}
                                            </Text>
                                        )}
                                        {coupon.type === 'bundle_price' && (
                                            <View>
                                                <Text style={[sc.detailText, { color: colors.foreground, fontWeight: '700' }]}>{t('bundle')}: {getProductName(coupon.targetProductId)}</Text>
                                                {coupon.tiers?.map((tier: any, i: number) => (
                                                    <Text key={i} style={[sc.tierNote, { color: colors.textMuted }]}>
                                                        • {t('buyXforY').replace('{{qty}}', tier.qty).replace('{{price}}', tier.price)}
                                                    </Text>
                                                ))}
                                            </View>
                                        )}
                                        {coupon.minOrder > 0 && (
                                            <Text style={[sc.minOrderNote, { color: colors.textMuted }]}>
                                                {t('minOrderLabel')} <Text style={{ color: colors.foreground, fontWeight: '700' }}>{coupon.minOrder} TND</Text>
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                <View style={sc.actionsCol}>
                                    <View style={{ marginBottom: 10 }}>
                                        <ModernSwitch active={coupon.isActive} onPress={() => toggleActive(coupon)} />
                                    </View>
                                    <TouchableOpacity onPress={() => handleDelete(coupon.id)} style={[sc.actionBtn, { backgroundColor: '#FEF2F2' }]}>
                                        <Trash2 size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={[sc.dashedDivider, { borderColor: colors.border }]} />

                            <View style={sc.validityRow}>
                                <Clock size={12} color={colors.textMuted} />
                                <Text style={[sc.validityText, { color: colors.textMuted }]}>{t('validUntilRemoved') || 'VALID UNTIL REMOVED'}</Text>
                            </View>
                        </AdminCard>
                    ))
                )}

                <View style={{ height: 100 }} />
            </Animated.ScrollView>
        </View>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    header: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 4 },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
    backBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    hSep: { height: StyleSheet.hairlineWidth },
    scrollContent: { padding: 20 },

    formCard: { padding: 22, borderRadius: 24, borderWidth: 1, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
    inputGroup: { marginBottom: 16 },
    input: {
        height: 54,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    chipsWrap: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 },

    submitBtn: {
        height: 55,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    submitBtnText: { fontWeight: '900', fontSize: 13, letterSpacing: 1 },

    // Bundle
    bundleContainer: { marginBottom: 15, gap: 10 },
    selectorBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    smallImg: { width: 30, height: 30, borderRadius: 6 },
    dropdown: {
        borderRadius: 12,
        borderWidth: 1,
        marginTop: -5,
        marginBottom: 10,
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    miniImg: { width: 32, height: 32, borderRadius: 4 },
    emptyNote: { padding: 20, textAlign: 'center', fontSize: 12, color: '#999' },
    tierRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    tierInput: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 13 },
    removeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    addTierBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
    addTierText: { fontSize: 12, fontWeight: '700' },

    // List
    couponCard: { padding: 22, borderRadius: 24, borderWidth: 1, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
    couponHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    codeText: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    detailsBlock: { gap: 6 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailText: { fontSize: 14 },
    tierNote: { fontSize: 12, marginLeft: 14, marginTop: 2 },
    minOrderNote: { fontSize: 11, marginTop: 4 },

    actionsCol: { gap: 12 },
    actionBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

    dashedDivider: {
        height: 0,
        borderTopWidth: 1,
        borderStyle: 'dashed',
        marginVertical: 15,
        opacity: 0.5,
    },
    validityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    validityText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});
