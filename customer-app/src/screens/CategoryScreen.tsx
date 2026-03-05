import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    Animated,
    Dimensions,
    ActivityIndicator,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { BlurView, BlurTargetView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Layers, MapPin } from 'lucide-react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../api/firebase';
import { useAppTheme } from '../context/ThemeContext';
import { AppText as Text } from '../components/common/AppText';
import ProductCard from '../components/ProductCard';

const { width } = Dimensions.get('window');
const SUBCATEGORY_CARD_WIDTH = (width - 48) / 2;

interface CategoryScreenProps {
    categoryId: string;
    categoryName: string;
    onBack: () => void;
    onProductPress: (product: any) => void;
    onSubCategoryPress: (id: string, name: string) => void;
    wishlist: string[];
    toggleWishlist: (id: string) => void;
    addToCart: (product: any) => void;
    t: (key: string) => string;
    theme: string;
    language: string;
    onBrandPress?: (brandId: string) => void;
}

export default function CategoryScreen({
    categoryId,
    categoryName,
    onBack,
    onProductPress,
    onSubCategoryPress,
    wishlist,
    toggleWishlist,
    addToCart,
    t,
    theme,
    language,
    onBrandPress,
}: CategoryScreenProps) {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [loading, setLoading] = useState(true);

    const scrollY = useRef(new Animated.Value(0)).current;
    const blurTargetRef = useRef(null);
    const COLL_HEIGHT = subcategories.length > 0 ? 150 : 0;
    const HEADER_HEIGHT = 70 + insets.top;
    const TOTAL_HEADER_HEIGHT = HEADER_HEIGHT + COLL_HEIGHT;

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 40],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const getName = (field: any) => {
        if (typeof field === 'string') return field;
        return field?.[language] || field?.fr || field?.en || '';
    };

    useEffect(() => {
        load();
    }, [categoryId]);

    const load = async () => {
        setLoading(true);
        try {
            // 1. Get subcategories
            const subSnap = await getDocs(
                query(collection(db, 'categories'), where('parentId', '==', categoryId))
            );
            const subs = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setSubcategories(subs);

            // 2. Always load products for this category AND its subcategories
            loadProducts([categoryId, ...subs.map((s: any) => s.id)], subs);
        } catch (e) {
            console.error('CategoryScreen load error:', e);
        } finally {
            setLoading(false);
        }
    };

    const [prodCount, setProdCount] = useState(0);

    const availableZones = Array.from(new Set(products.map(p => p.zone).filter(z => !!z && z !== 'Global')));
    const filteredProducts = selectedZone
        ? products.filter(p => p.zone === selectedZone || p.zone === 'Global' || p.zone === 'Toute la Tunisie')
        : products;

    const handleGetCurrentLocation = async () => {
        setGettingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('error'), t('locationPermissionDenied'));
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            const reverse = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
            if (reverse && reverse[0]) {
                const city = reverse[0].city || reverse[0].region;
                if (city) {
                    setSelectedZone(city);
                }
            }
        } catch (error) {
            console.error("Error getting location:", error);
        } finally {
            setGettingLocation(false);
        }
    };

    const loadProducts = async (catIds: string[], subs?: any[]) => {
        try {
            // Fetch products across the category + its subcategories
            // Firestore 'in' operator allows up to 30 IDs
            const chunks = chunkArray(catIds, 30);
            let all: any[] = [];
            for (const chunk of chunks) {
                const snap = await getDocs(
                    query(collection(db, 'products'), where('categoryId', 'in', chunk))
                );
                all = [...all, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];
            }
            const enriched = all.map(p => {
                const sourceSubs = subs || subcategories;
                let subMatch = sourceSubs.find(s => s.id === p.categoryId || s.id === p.subCategoryId);

                // Use category name from props and found subcategory name
                let parentNameStr = categoryName;
                let subNameStr = subMatch ? subMatch.name : (p.subCategoryName || '');

                return {
                    ...p,
                    categoryName: parentNameStr,
                    subCategoryName: subNameStr,
                    brandName: p.brandName || p.brand || p.marque || 'TAMA CLOTHING'
                };
            });
            setProducts(enriched);
            setProdCount(all.length);
        } catch (e) {
            console.error('loadProducts error:', e);
        }
    };

    const chunkArray = (arr: any[], size: number) => {
        const result = [];
        for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
        return result;
    };



    return (
        <View style={[ss.root, { backgroundColor: colors.background }]}>

            {/* Blur Header border on scroll */}
            <Animated.View style={[ss.headerBorder, { opacity: headerOpacity, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

            {/* Fixed Header with Blur & Collections */}
            <Animated.View style={[ss.headerWrap, { height: TOTAL_HEADER_HEIGHT, zIndex: 1000 }]}>
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
                    <BlurView
                        intensity={isDark ? 85 : 100}
                        tint={isDark ? 'dark' : 'light'}
                        style={StyleSheet.absoluteFill}
                        blurTarget={blurTargetRef}
                    />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + (isDark ? 'B3' : '80') }]} />
                </Animated.View>

                <SafeAreaView edges={['top']}>
                    <View style={ss.headerOuter}>
                        {/* New Fixed Location Bar at the very top corner of header */}
                        <View style={ss.topLocationBar}>
                            <View style={ss.locationChipsFixedContainer}>
                                <TouchableOpacity
                                    onPress={handleGetCurrentLocation}
                                    style={[ss.headerLocChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7', borderTopLeftRadius: 20, borderBottomLeftRadius: 20 }]}
                                >
                                    {gettingLocation ? (
                                        <ActivityIndicator size="small" color={isDark ? '#FFF' : '#000'} />
                                    ) : (
                                        <MapPin size={12} color={colors.accent || (isDark ? '#FFF' : '#000')} />
                                    )}
                                    <Text style={[ss.headerLocText, { color: colors.foreground }]}>{t('nearMe').toUpperCase()}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setSelectedZone(null)}
                                    style={[
                                        ss.headerLocChip,
                                        {
                                            backgroundColor: !selectedZone ? colors.foreground : (isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7')
                                        }
                                    ]}>
                                    <Text style={[ss.headerLocText, { color: !selectedZone ? (isDark ? '#000' : '#FFF') : colors.textMuted }]}>
                                        {t('global').toUpperCase()}
                                    </Text>
                                </TouchableOpacity>

                                {availableZones.slice(0, 2).map(z => (
                                    <TouchableOpacity
                                        key={z}
                                        onPress={() => setSelectedZone(z)}
                                        style={[
                                            ss.headerLocChip,
                                            {
                                                backgroundColor: selectedZone === z ? colors.foreground : (isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7')
                                            }
                                        ]}>
                                        <Text style={[ss.headerLocText, { color: selectedZone === z ? (isDark ? '#000' : '#FFF') : colors.textMuted }]}>
                                            {z.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={ss.headerTopRow}>
                            <TouchableOpacity onPress={onBack} style={ss.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <ChevronLeft size={24} color={colors.foreground} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    if (onBrandPress) {
                                        onBack();
                                        onBrandPress(categoryId);
                                    }
                                }}
                                style={{ flex: 1, alignItems: 'center', marginRight: 42 }}
                            >
                                <Text style={[ss.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
                                    {categoryName.toUpperCase()}
                                </Text>
                                <Text style={[ss.headerSub, { color: colors.textMuted }]}>
                                    {prodCount} {t('products').toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Fixed Collections Horizontal Bar */}
                        {subcategories.length > 0 && (
                            <View style={ss.fixedCollectionsContainer}>
                                <Text style={[ss.colTitleSmall, { color: colors.textMuted }]}>{t('collections')}</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 10 }}
                                >
                                    {subcategories.map(sub => (
                                        <TouchableOpacity
                                            key={sub.id}
                                            style={{ alignItems: 'center' }}
                                            onPress={() => onSubCategoryPress(sub.id, getName(sub.name))}
                                        >
                                            <View style={[ss.colImageCardSmall, { backgroundColor: isDark ? '#1C1C26' : '#F2F2F7', borderColor: isDark ? '#2C2C3E' : '#E5E5EA' }]}>
                                                <Image
                                                    source={{ uri: sub.image || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400' }}
                                                    style={ss.colImageSmall}
                                                />
                                            </View>
                                            <Text style={[ss.colLabelSmall, { color: colors.foreground }]}>
                                                {getName(sub.name).toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </SafeAreaView>
            </Animated.View>

            {
                loading ? (
                    <View style={ss.loader}>
                        <ActivityIndicator size="large" color={colors.foreground} />
                    </View>
                ) : (
                    <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
                        {/* ── SINGLE PRODUCT GRID WITH SUBCATEGORY HEADER ──────────────── */}
                        <Animated.FlatList
                            data={filteredProducts}
                            keyExtractor={item => item.id}
                            numColumns={2}
                            contentContainerStyle={[ss.gridContent, { paddingTop: TOTAL_HEADER_HEIGHT + 10 }]}
                            columnWrapperStyle={ss.columnWrapper}
                            onScroll={Animated.event(
                                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                                { useNativeDriver: false }
                            )}
                            scrollEventThrottle={16}
                            ListHeaderComponent={<View style={{ height: 10 }} />}
                            renderItem={({ item }: { item: any }) => (
                                <View style={{ width: (width - 48) / 2 }}>
                                    <ProductCard
                                        product={item}
                                        onPress={() => onProductPress(item)}
                                        onAddToCart={() => addToCart(item)}
                                        customWidth={width / 2 - 20}
                                        isWishlisted={wishlist.includes(item.id)}
                                        onToggleWishlist={() => toggleWishlist(item.id)}
                                        theme={theme as any}
                                        language={language}
                                    />
                                </View>
                            )}
                            ListEmptyComponent={
                                <View style={ss.emptyWrap}>
                                    <Text style={{ color: colors.textMuted, fontSize: 14 }}>{t('noProducts')}</Text>
                                </View>
                            }
                        />
                    </BlurTargetView>
                )
            }
        </View >
    );
}


const ss = StyleSheet.create({
    root: { flex: 1 },
    headerOuter: {
        paddingBottom: 8,
    },
    topLocationBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 5,
        justifyContent: 'flex-end',
        marginBottom: 12,
    },
    locationChipsFixedContainer: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    headerLocationScrollerSmall: {
        paddingHorizontal: 0,
        paddingVertical: 4,
        gap: 4,
        alignItems: 'center',
    },
    headerLocChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerLocText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    loader: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
    },
    gridContent: {
        paddingHorizontal: 16,
        paddingBottom: 120,
        gap: 0,
    },
    columnWrapper: {
        gap: 12,
        marginBottom: 12,
    },
    emptyWrap: {
        padding: 40,
        alignItems: 'center',
    },
    // Collection styles matching Home
    fixedCollectionsContainer: {
        marginTop: 10,
    },
    colTitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    colImageCard: {
        width: 70,
        height: 70,
        borderRadius: 35, // Full circle
        overflow: 'hidden',
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    colLabel: {
        fontSize: 9,
        fontWeight: '800',
        marginTop: 8,
        letterSpacing: 0.5,
        textAlign: 'center',
        width: 70,
    },
    colTitleSmall: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        opacity: 0.5,
        marginBottom: 8,
        marginTop: 5,
        paddingHorizontal: 20,
    },
    colImageCardSmall: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
    },
    colImageSmall: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
    },
    colLabelSmall: {
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginTop: 6,
        textAlign: 'center',
        width: 60,
    },
    headerWrap: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 1000,
    },
    headerBorder: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 1,
        zIndex: 1500,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18, fontWeight: '900', letterSpacing: -0.6,
    },
    headerSub: {
        fontSize: 11, fontWeight: '600', textTransform: 'uppercase', opacity: 0.6,
    },
});
