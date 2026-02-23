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
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    CheckCircle2,
} from 'lucide-react-native';
import {
    collection,
    getDocs,
    getDoc,
    setDoc,
    doc,
    query,
    orderBy,
    limit,
    serverTimestamp,
} from 'firebase/firestore';
import { BlurView } from 'expo-blur';
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import { AdminHeader } from '../../components/admin/AdminHeader';
import {
    AdminCard,
    InputLabel,
    SectionLabel,
    ModernSwitch,
} from '../../components/admin/AdminUI';
import { getName } from '../../utils/translationHelpers';

const { width } = Dimensions.get('window');

export default function AdminFlashSaleScreen({ onBack, t, profileData, language = 'fr' }: any) {
    const { colors, theme } = useAppTheme();
    const isBrandOwner = profileData?.role === 'brand_owner';
    const myBrandId = profileData?.brandId;
    const scrollY = useRef(new Animated.Value(0)).current;

    const [active, setActive] = useState(false);
    const [title, setTitle] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchFlashSale(), fetchProducts()]);
            setLoading(false);
        };
        init();
    }, []);

    const flashSaleDocId = isBrandOwner && myBrandId ? `flashSale_${myBrandId}` : 'flashSale';

    const fetchFlashSale = async () => {
        try {
            const snap = await getDoc(doc(db, 'settings', flashSaleDocId));
            if (snap.exists()) {
                const data = snap.data();
                setActive(data.active || false);
                setTitle(data.title || '');
                setEndTime(data.endTime || '');
                setSelectedProductIds(data.productIds || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProducts = async () => {
        try {
            const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(100));
            const snap = await getDocs(q);
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setProducts(isBrandOwner && myBrandId ? all.filter((p: any) => p.brandId === myBrandId) : all);
        } catch (err) {
            console.error("Error fetching products:", err);
        }
    };

    const handleSave = async () => {
        if (!title || !endTime) {
            Alert.alert(t('error'), t('fillAllFields') || t('requiredFields'));
            return;
        }
        const testDate = new Date(endTime);
        if (isNaN(testDate.getTime())) {
            Alert.alert(t('error'), t('invalidDateFormat') || 'Invalid date format');
            return;
        }
        setSaveLoading(true);
        try {
            const saveData: any = {
                active,
                title,
                endTime,
                productIds: selectedProductIds,
                updatedAt: serverTimestamp()
            };
            if (isBrandOwner && myBrandId) saveData.brandId = myBrandId;
            await setDoc(doc(db, 'settings', flashSaleDocId), saveData);
            Alert.alert(t('successTitle'), t('flashSaleUpdated'));
        } catch (e: any) {
            Alert.alert(t('error'), e.message || t('failedToSave'));
        } finally {
            setSaveLoading(false);
        }
    };

    return (
        <SafeAreaView style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader
                title={t('flashSale').toUpperCase()}
                onBack={onBack}
                scrollY={scrollY}
                rightElement={
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saveLoading}
                        style={[sc.saveBtn, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
                    >
                        {saveLoading ? <ActivityIndicator size="small" color={colors.foreground} /> : (
                            <Text style={[sc.saveText, { color: colors.foreground }]}>{t('save').toUpperCase()}</Text>
                        )}
                    </TouchableOpacity>
                }
            />

            <Animated.ScrollView
                contentContainerStyle={sc.scrollContent}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <AdminCard style={sc.statusCard}>
                    <View style={{ flex: 1, marginRight: 15 }}>
                        <Text style={[sc.statusTitle, { color: colors.foreground }]}>{t('activeStatusLabel')}</Text>
                        <Text style={[sc.statusSub, { color: colors.textMuted }]}>{t('showFlashSale')}</Text>
                    </View>
                    <ModernSwitch active={active} onPress={() => setActive(!active)} />
                </AdminCard>

                <View style={sc.inputGroup}>
                    <InputLabel text={t('campaignTitle').toUpperCase()} />
                    <TextInput
                        style={[sc.input, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: colors.foreground, borderColor: colors.border }]}
                        value={title}
                        onChangeText={setTitle}
                        placeholder={t('flashSaleTitlePlaceholder')}
                        placeholderTextColor={colors.textMuted}
                    />
                </View>

                <View style={sc.inputGroup}>
                    <InputLabel text={t('endTimeIso').toUpperCase()} />
                    <TextInput
                        style={[sc.input, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: colors.foreground, borderColor: colors.border }]}
                        value={endTime}
                        onChangeText={setEndTime}
                        placeholder="YYYY-MM-DDTHH:MM:SS"
                        placeholderTextColor={colors.textMuted}
                    />
                    <View style={sc.presetWrap}>
                        {[6, 12, 24, 48].map(h => (
                            <TouchableOpacity
                                key={h}
                                onPress={() => {
                                    const d = new Date();
                                    d.setHours(d.getHours() + h);
                                    setEndTime(d.toISOString().slice(0, 19));
                                }}
                                style={[sc.presetBtn, { backgroundColor: theme === 'dark' ? '#17171F' : '#f0f0f0', borderColor: colors.border }]}
                            >
                                <Text style={[sc.presetText, { color: colors.foreground }]}>+{h}H</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={[sc.helpText, { color: colors.textMuted }]}>{t('selectPresetOrIso')}</Text>
                </View>

                {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.foreground} /> : (
                    <>
                        <SectionLabel text={t('selectProductsLabel') + ` (${selectedProductIds.length})`} style={{ marginTop: 10, marginBottom: 15 }} />
                        <View style={sc.grid}>
                            {products.map(p => {
                                const isSelected = selectedProductIds.includes(p.id);
                                return (
                                    <TouchableOpacity
                                        key={p.id}
                                        onPress={() => setSelectedProductIds(isSelected ? selectedProductIds.filter(id => id !== p.id) : [...selectedProductIds, p.id])}
                                        style={[
                                            sc.productCard,
                                            {
                                                backgroundColor: isSelected
                                                    ? (theme === 'dark' ? '#1F1F2B' : '#F2F2F7')
                                                    : (theme === 'dark' ? '#121218' : 'white'),
                                                borderColor: isSelected ? colors.foreground : colors.border
                                            }
                                        ]}
                                    >
                                        <Image source={{ uri: p.mainImage }} style={sc.productImg} />
                                        <View style={sc.productInfo}>
                                            <Text style={[sc.productName, { color: colors.foreground }]} numberOfLines={1}>
                                                {getName(p.name, language)}
                                            </Text>
                                        </View>
                                        {isSelected && (
                                            <View style={[sc.checkIcon, { backgroundColor: colors.foreground }]}>
                                                <CheckCircle2 size={12} color={theme === 'dark' ? '#000' : 'white'} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
                )}

                <View style={{ height: 100 }} />
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    saveBtn: { paddingHorizontal: 16, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    saveText: { fontSize: 11, fontWeight: '900' },
    scrollContent: { padding: 25, paddingTop: 80 },
    statusCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, padding: 20 },
    statusTitle: { fontWeight: '800', fontSize: 16 },
    statusSub: { fontSize: 12, marginTop: 2 },

    inputGroup: { marginBottom: 25 },
    input: { height: 52, borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, fontSize: 14, fontWeight: '600' },
    presetWrap: { flexDirection: 'row', gap: 10, marginTop: 12 },
    presetBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
    presetText: { fontSize: 10, fontWeight: '900' },
    helpText: { fontSize: 10, marginTop: 10 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    productCard: { width: (width - 60) / 3, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
    productImg: { width: '100%', height: 90 },
    productInfo: { padding: 8 },
    productName: { fontSize: 9, fontWeight: '700' },
    checkIcon: { position: 'absolute', top: 6, right: 6, borderRadius: 10, padding: 1 }
});
