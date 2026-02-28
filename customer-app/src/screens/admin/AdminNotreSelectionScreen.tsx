import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    Dimensions,
    StyleSheet,
    Animated,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    CheckCircle2,
    Search,
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

import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import {
    AdminCard,
    SectionLabel,
    AdminHeader,
} from '../../components/admin/AdminUI';
import { getName } from '../../utils/translationHelpers';

const { width } = Dimensions.get('window');

export default function AdminNotreSelectionScreen({ onBack, t, profileData, language = 'fr' }: any) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';
    const isBrandOwner = profileData?.role === 'brand_owner';
    const myBrandId = profileData?.brandId;
    const scrollY = useRef(new Animated.Value(0)).current;

    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchSelection(), fetchProducts()]);
            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredProducts(products);
        } else {
            const lowQuery = searchQuery.toLowerCase();
            const filtered = products.filter(p => {
                const nameFr = (p.name?.fr || '').toLowerCase();
                const nameAr = (p.name?.['ar-tn'] || p.name?.ar || '').toLowerCase();
                const nameEn = (p.name?.en || '').toLowerCase();
                return nameFr.includes(lowQuery) || nameAr.includes(lowQuery) || nameEn.includes(lowQuery);
            });
            setFilteredProducts(filtered);
        }
    }, [searchQuery, products]);

    const fetchSelection = async () => {
        try {
            const snap = await getDoc(doc(db, 'settings', 'ourSelection'));
            if (snap.exists()) {
                const data = snap.data();
                setSelectedProductIds(data.productIds || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProducts = async () => {
        try {
            const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(150));
            const snap = await getDocs(q);
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // We show all products to admin, but if it's a brand owner, we might want to filter? 
            // The user didn't specify, but usually "Notre selection" is a global admin thing.
            // However, following the pattern of other screens:
            const result = isBrandOwner && myBrandId ? all.filter((p: any) => p.brandId === myBrandId) : all;
            setProducts(result);
            setFilteredProducts(result);
        } catch (err) {
            console.error("Error fetching products:", err);
        }
    };

    const handleSave = async () => {
        setSaveLoading(true);
        try {
            await setDoc(doc(db, 'settings', 'ourSelection'), {
                productIds: selectedProductIds,
                updatedAt: serverTimestamp(),
                updatedBy: profileData?.uid || 'admin'
            }, { merge: true });
            Alert.alert(t('successTitle'), t('success'));
        } catch (e: any) {
            Alert.alert(t('error'), e.message || t('failedToSave'));
        } finally {
            setSaveLoading(false);
        }
    };

    const toggleProduct = (id: string) => {
        setSelectedProductIds(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    return (
        <View style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader
                title={t('ourSelection')}
                onBack={onBack}
                rightElement={
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saveLoading}
                        style={[sc.saveBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
                    >
                        {saveLoading ? <ActivityIndicator size="small" color={colors.foreground} /> : (
                            <Text style={[sc.saveText, { color: colors.foreground }]}>{t('save').toUpperCase()}</Text>
                        )}
                    </TouchableOpacity>
                }
            />

            <Animated.ScrollView
                contentContainerStyle={[sc.scrollContent, { paddingTop: insets.top + 80 }]}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <AdminCard style={sc.infoCard}>
                    <Text style={[sc.infoTitle, { color: colors.foreground }]}>{t('ourSelection')}</Text>
                    <Text style={[sc.infoSub, { color: colors.textMuted }]}>
                        {isDark ? 'SÉLECTIONNEZ LES PRODUITS À AFFICHER DANS LA SECTION "NOTRE SÉLECTION"' : 'Sélectionnez les produits à afficher dans la section "Notre Sélection"'}
                    </Text>
                </AdminCard>

                <View style={[sc.searchContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
                    <Search size={18} color={colors.textMuted} />
                    <TextInput
                        style={[sc.searchInput, { color: colors.foreground }]}
                        placeholder={t('searchProducts')}
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.foreground} /> : (
                    <>
                        <SectionLabel text={t('selectProductsLabel') + ` (${selectedProductIds.length})`} style={{ marginTop: 10, marginBottom: 15 }} />
                        <View style={sc.grid}>
                            {filteredProducts.map(p => {
                                const isSelected = selectedProductIds.includes(p.id);
                                return (
                                    <TouchableOpacity
                                        key={p.id}
                                        onPress={() => toggleProduct(p.id)}
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
                                            <Text style={[sc.productName, { color: colors.foreground }]} numberOfLines={2}>
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
        </View>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    saveBtn: { paddingHorizontal: 16, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    saveText: { fontSize: 11, fontWeight: '900' },
    scrollContent: { padding: 25, paddingTop: 10, paddingBottom: 120 },
    infoCard: { marginBottom: 20, padding: 20, borderRadius: 24, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
    infoTitle: { fontWeight: '900', fontSize: 16, letterSpacing: -0.2, marginBottom: 4 },
    infoSub: { fontSize: 12, opacity: 0.8, lineHeight: 18 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 15,
        marginBottom: 20,
        gap: 10
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600'
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    productCard: { width: (width - 62) / 3, borderRadius: 20, overflow: 'hidden', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
    productImg: { width: '100%', height: 100, backgroundColor: '#f0f0f0' },
    productInfo: { padding: 8, minHeight: 45 },
    productName: { fontSize: 9, fontWeight: '700', lineHeight: 12 },
    checkIcon: { position: 'absolute', top: 6, right: 6, borderRadius: 10, padding: 1 }
});
