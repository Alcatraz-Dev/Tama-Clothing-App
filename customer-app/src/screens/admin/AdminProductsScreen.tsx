import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Image, Modal, ScrollView,
    Alert, ActivityIndicator, Switch, StyleSheet, Animated, FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ChevronLeft, Plus, Settings, Trash2, Camera, X, Package2, Copy } from 'lucide-react-native';
import UniversalVideoPlayer from '../../components/common/UniversalVideoPlayer';
import * as ImagePicker from 'expo-image-picker';
import {
    collection, getDocs, addDoc, updateDoc, deleteDoc,
    doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import { uploadToBunny } from '../../utils/bunny';
import { AdminHeader } from '../../components/admin/AdminUI';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getString(val: any): string {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val.fr || val.en || val['ar-tn'] || Object.values(val)[0] || '';
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ProductListItem({ item, onEdit, onDuplicate, onDelete, colors, theme, language }: any) {
    const isDark = theme === 'dark';
    const name = getString(item.name);
    const category = getString(item.category);

    return (
        <View style={[sc.listCard, { backgroundColor: isDark ? '#111118' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={sc.thumbWrapper}>
                <Image
                    source={{ uri: item.images?.[0] || item.mainImage }}
                    style={sc.listThumb}
                />
                {item.status === 'sold_out' && (
                    <View style={sc.soldOutBadge}>
                        <Text style={sc.soldOutText}>STOCK ÉPUISÉ</Text>
                    </View>
                )}
            </View>

            <View style={sc.listInfo}>
                <Text style={[sc.listName, { color: colors.foreground }]} numberOfLines={1}>
                    {name}
                </Text>

                <View style={sc.listMetaRow}>
                    <View style={[sc.metaTag, { backgroundColor: isDark ? '#1A1A24' : '#F2F2F7' }]}>
                        <Text style={[sc.metaTagText, { color: colors.textMuted }]}>{category}</Text>
                    </View>
                    {item.brandName ? (
                        <View style={[sc.metaTag, { backgroundColor: isDark ? '#1A1A24' : '#F2F2F7' }]}>
                            <Text style={[sc.metaTagText, { color: colors.textMuted }]}>{item.brandName}</Text>
                        </View>
                    ) : null}
                </View>

                <View style={sc.priceAndStockRow}>
                    <View style={sc.priceCol}>
                        <Text style={[sc.priceMain, { color: colors.foreground }]}>{item.discountPrice ?? item.price} TND</Text>
                        {item.discountPrice ? (
                            <Text style={[sc.priceOld, { color: colors.textMuted }]}>{item.price} TND</Text>
                        ) : null}
                    </View>
                </View>
            </View>

            <View style={sc.actionsCol}>
                <TouchableOpacity
                    onPress={() => onEdit(item)}
                    style={[sc.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                    activeOpacity={0.7}
                >
                    <Settings size={18} color={colors.foreground} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => onDuplicate(item)}
                    style={[sc.actionBtn, { backgroundColor: 'rgba(88,86,214,0.1)' }]}
                    activeOpacity={0.7}
                >
                    <Copy size={18} color="#5856D6" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => onDelete(item.id)}
                    style={[sc.actionBtn, { backgroundColor: 'rgba(255,59,48,0.1)' }]}
                    activeOpacity={0.7}
                >
                    <Trash2 size={18} color="#FF3B30" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminProductsScreen({ onBack, t, profileData, language = 'fr' }: any) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';
    const isBrandOwner = profileData?.role === 'brand_owner';
    const myBrandId = profileData?.brandId;

    // ── Data ────────────────────────────────────────────────────────────────────
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Modal / Form ─────────────────────────────────────────────────────────────
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [nameFr, setNameFr] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [nameEn, setNameEn] = useState('');
    const [price, setPrice] = useState('');
    const [discountPrice, setDiscountPrice] = useState('');
    const [deliveryPrice, setDeliveryPrice] = useState('7');
    const [descriptionFr, setDescriptionFr] = useState('');
    const [descriptionAr, setDescriptionAr] = useState('');
    const [descriptionEn, setDescriptionEn] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState(isBrandOwner ? myBrandId : '');
    const [images, setImages] = useState<string[]>([]);
    const [sizes, setSizes] = useState<string[]>([]);
    const [productColors, setProductColors] = useState<string[]>([]);
    const [colorInput, setColorInput] = useState('');
    const [isSoldOut, setIsSoldOut] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // ── Animation ─────────────────────────────────────────────────────────────────
    const scrollY = useRef(new Animated.Value(0)).current;
    const modalScrollY = useRef(new Animated.Value(0)).current;
    const headerOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [0, 1], extrapolate: 'clamp' });
    const modalHeaderOpacity = modalScrollY.interpolate({ inputRange: [0, 50], outputRange: [0, 1], extrapolate: 'clamp' });

    // ── Data Fetch ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        Promise.all([fetchProducts(), fetchCategories(), fetchBrands()]).finally(() => setLoading(false));
    }, []);

    async function fetchProducts() {
        try {
            const snap = await getDocs(collection(db, 'products'));
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setProducts(isBrandOwner && myBrandId ? all.filter((p: any) => p.brandId === myBrandId) : all);
        } catch (err) { console.error(err); }
    }

    async function fetchCategories() {
        const snap = await getDocs(collection(db, 'categories'));
        setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    async function fetchBrands() {
        const snap = await getDocs(collection(db, 'brands'));
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Brand owners only see / interact with their own brand
        setBrands(isBrandOwner && myBrandId ? all.filter(b => b.id === myBrandId) : all);
    }

    // ── Form Actions ───────────────────────────────────────────────────────────────
    function resetForm() {
        setEditingProduct(null);
        setNameFr(''); setNameAr(''); setNameEn('');
        setPrice(''); setDiscountPrice(''); setDeliveryPrice('7');
        setDescriptionFr(''); setDescriptionAr(''); setDescriptionEn('');
        setCategoryId(''); setBrandId(isBrandOwner ? myBrandId : '');
        setImages([]); setVideoUrl('');
        setSizes([]); setProductColors([]);
        setColorInput(''); setIsSoldOut(false);
    }

    function openEdit(p: any) {
        setEditingProduct(p);
        setNameFr(p.name?.fr || getString(p.name));
        setNameAr(p.name?.['ar-tn'] || '');
        setNameEn(p.name?.en || '');
        setPrice(String(p.price));
        setDiscountPrice(p.discountPrice ? String(p.discountPrice) : '');
        setDeliveryPrice(String(p.deliveryPrice || '7'));
        setDescriptionFr(p.description?.fr || getString(p.description));
        setDescriptionAr(p.description?.['ar-tn'] || '');
        setDescriptionEn(p.description?.en || '');
        setCategoryId(p.categoryId || '');
        setBrandId(isBrandOwner ? myBrandId : (p.brandId || ''));
        setImages(p.images || (p.image ? [p.image] : []));
        setVideoUrl(p.videoUrl || '');
        setSizes(p.sizes || []);
        setProductColors(p.colors || []);
        setIsSoldOut(p.status === 'sold_out');
        setModalVisible(true);
    }

    function addColor() {
        const trimmed = colorInput.trim();
        if (!trimmed) return;
        if (productColors.includes(trimmed)) {
            Alert.alert(t('duplicate'), t('duplicateColor'));
            return;
        }
        setProductColors([...productColors, trimmed]);
        setColorInput('');
    }

    async function handlePickImage() {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert(t('permissionDenied') || 'Permission Required', 'Please allow access to your photo library in Settings.');
                return;
            }

            const r = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8
            });

            if (!r.canceled && r.assets && r.assets[0]) {
                setImages(prev => [...prev, r.assets[0].uri]);
            }
        } catch (error: any) {
            console.log('Image picker error:', error);
            Alert.alert(t('error') || 'Error', error.message || 'Failed to pick image');
        }
    }

    async function handlePickVideo() {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert(t('permissionDenied') || 'Permission Required', 'Please allow access to your media library in Settings.');
                return;
            }

            const r = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['videos'],
                quality: 0.8
            });

            if (!r.canceled && r.assets && r.assets[0]) {
                setVideoUrl(r.assets[0].uri);
            }
        } catch (error: any) {
            console.log('Video picker error:', error);
            Alert.alert(t('error') || 'Error', error.message || 'Failed to pick video');
        }
    }

    async function handleSave() {
        if (!nameFr || !price || images.length === 0) {
            Alert.alert(t('error'), t('requiredFields'));
            return;
        }
        setUploading(true);
        try {
            const uploadedImages = await Promise.all(images.map(img => uploadToBunny(img)));
            let finalVideoUrl = videoUrl;
            if (videoUrl && !videoUrl.startsWith('http')) {
                finalVideoUrl = await uploadToBunny(videoUrl);
            }
            const data = {
                name: { fr: nameFr, 'ar-tn': nameAr, en: nameEn },
                price: parseFloat(price),
                discountPrice: discountPrice ? parseFloat(discountPrice) : null,
                deliveryPrice: parseFloat(deliveryPrice || '7'),
                description: { fr: descriptionFr, 'ar-tn': descriptionAr, en: descriptionEn },
                categoryId,
                category: categories.find(c => c.id === categoryId)?.name?.fr || t('uncategorized'),
                brandId,
                brandName: brands.find(b => b.id === brandId)?.name?.fr || '',
                videoUrl: finalVideoUrl,
                images: uploadedImages,
                mainImage: uploadedImages[0],
                sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'],
                colors: productColors,
                status: isSoldOut ? 'sold_out' : 'in_stock',
                updatedAt: serverTimestamp(),
            };

            if (editingProduct) {
                await updateDoc(doc(db, 'products', editingProduct.id), data);
                Alert.alert(t('successTitle'), t('productUpdated'));
            } else {
                await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
                Alert.alert(t('successTitle'), t('productCreated'));
            }
            setModalVisible(false);
            fetchProducts();
            resetForm();
        } catch (err) {
            console.error(err);
            Alert.alert(t('error'), t('failedToSave'));
        } finally {
            setUploading(false);
        }
    }

    async function handleDuplicate(p: any) {
        Alert.alert(
            t('duplicate') || 'Duplicate',
            t('confirmDuplicate') || 'Are you sure you want to duplicate this product?',
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('duplicate'),
                    onPress: async () => {
                        setLoading(true);
                        try {
                            // Extract data excluding Firebase-specific fields if needed, 
                            // but basic spread + delete id is usually enough for local data
                            const { id, ...cleanData } = p;
                            const data = {
                                ...cleanData,
                                name: {
                                    fr: (p.name?.fr || getString(p.name)) + ' (Copy)',
                                    'ar-tn': (p.name?.['ar-tn'] || '') + ' (نسخة)',
                                    en: (p.name?.en || '') + ' (Copy)'
                                },
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp(),
                                status: 'in_stock', // Reset status as copy might be different
                            };

                            await addDoc(collection(db, 'products'), data);
                            fetchProducts();
                            Alert.alert(t('successTitle'), t('productCreated'));
                        } catch (err) {
                            console.error(err);
                            Alert.alert(t('error'), t('failedToSave'));
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    }

    function handleDelete(id: string) {
        Alert.alert(t('delete'), t('areYouSure'), [
            { text: t('cancel'), style: 'cancel' },
            { text: t('delete'), style: 'destructive', onPress: async () => { await deleteDoc(doc(db, 'products', id)); fetchProducts(); } },
        ]);
    }

    // ── Render ──────────────────────────────────────────────────────────────────────
    return (
        <View style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader
                title={t('products')}
                onBack={onBack}
                rightElement={
                    <TouchableOpacity
                        onPress={() => { resetForm(); setModalVisible(true); }}
                        style={[sc.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Plus size={20} color={colors.foreground} />
                    </TouchableOpacity>
                }
            />

            {/* Product List */}
            {
                loading ? (
                    <ActivityIndicator size="large" color={colors.foreground} style={{ marginTop: 60 }} />
                ) : (
                    <Animated.FlatList
                        data={products}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[sc.listContent, { paddingTop: insets.top + 80 }]}
                        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                        scrollEventThrottle={16}
                        ListEmptyComponent={
                            <View style={sc.empty}>
                                <View style={[sc.emptyIconBox, { backgroundColor: theme === 'dark' ? '#111118' : '#F5F5F7', borderColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                                    <Package2 size={42} color={colors.textMuted} strokeWidth={1.2} />
                                </View>
                                <Text style={[sc.emptyTitle, { color: colors.foreground }]}>{t('noProductsFound')}</Text>
                                <Text style={[sc.emptySubtitle, { color: colors.textMuted }]}>{t('addFirstProduct') || 'Ajoutez votre premier produit'}</Text>
                                <TouchableOpacity
                                    onPress={() => { resetForm(); setModalVisible(true); }}
                                    style={[sc.emptyBtn, { backgroundColor: colors.foreground }]}
                                >
                                    <Plus size={14} color={theme === 'dark' ? '#000' : '#FFF'} />
                                    <Text style={[sc.emptyBtnText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('newProduct').toUpperCase()}</Text>
                                </TouchableOpacity>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <ProductListItem
                                item={item}
                                onEdit={openEdit}
                                onDuplicate={handleDuplicate}
                                onDelete={handleDelete}
                                colors={colors}
                                theme={theme}
                            />
                        )}
                    />
                )
            }

            {/* Add / Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="formSheet">
                <SafeAreaView style={[sc.modalRoot, { backgroundColor: colors.background }]}>
                    {/* Modal Header Matching Other Screens */}
                    <Animated.View style={[sc.header, {
                        backgroundColor: colors.background,
                        borderBottomWidth: modalHeaderOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    }]}>
                        <Animated.View style={[StyleSheet.absoluteFill, { opacity: modalHeaderOpacity }]}>
                            <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme === 'dark' ? 'dark' : 'light'} />
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + 'B3' }]} />
                        </Animated.View>

                        <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                            <Text style={[sc.modalAction, { color: colors.textMuted }]}>{t('cancel').toUpperCase()}</Text>
                        </TouchableOpacity>

                        <Text style={[sc.headerTitle, { color: colors.foreground }]} pointerEvents="none">
                            {editingProduct ? t('editProduct').toUpperCase() : t('newProduct').toUpperCase()}
                        </Text>

                        <TouchableOpacity onPress={handleSave} disabled={uploading} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                            {uploading ? <ActivityIndicator color={colors.foreground} /> : (
                                <Text style={[sc.modalAction, { color: colors.foreground, fontWeight: '900' }]}>{t('save').toUpperCase()}</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.ScrollView
                        contentContainerStyle={sc.formContent}
                        showsVerticalScrollIndicator={false}
                        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: modalScrollY } } }], { useNativeDriver: false })}
                        scrollEventThrottle={16}
                    >
                        {/* Sold Out toggle */}
                        <View style={[sc.toggleRow, { backgroundColor: theme === 'dark' ? '#121218' : '#FFF', borderColor: theme === 'dark' ? '#1A1A24' : '#EFEFEF' }]}>
                            <View>
                                <Text style={[sc.toggleLabel, { color: colors.foreground }]}>{t('soldOutStatus')}</Text>
                                <Text style={[sc.toggleSub, { color: colors.textMuted }]}>{t('markUnavailable')}</Text>
                            </View>
                            <Switch value={isSoldOut} onValueChange={setIsSoldOut}
                                trackColor={{ false: '#C7C7CC', true: colors.error }}
                                thumbColor="#FFF" ios_backgroundColor="#C7C7CC"
                            />
                        </View>

                        {/* ── Images ─────────────── */}
                        <Text style={[sc.fieldLabel, { color: colors.textMuted }]}>{t('images').toUpperCase()}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                            <TouchableOpacity onPress={handlePickImage} style={[sc.addImageBtn, { backgroundColor: theme === 'dark' ? '#121218' : '#FFF', borderColor: colors.border }]}>
                                <Camera size={22} color={colors.textMuted} />
                                <Text style={[sc.addImageText, { color: colors.textMuted }]}>ADD</Text>
                            </TouchableOpacity>
                            {images.map((img, i) => (
                                <View key={i} style={sc.imageWrapper}>
                                    <Image source={{ uri: img }} style={sc.imageThumb} />
                                    <TouchableOpacity onPress={() => setImages(images.filter((_, idx) => idx !== i))} style={sc.removeImageBtn}>
                                        <X size={11} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>

                        {/* ── Video ──────────────── */}
                        <Text style={[sc.fieldLabel, { color: colors.textMuted }]}>{t('productVideo').toUpperCase()}</Text>
                        {!videoUrl ? (
                            <TouchableOpacity
                                onPress={handlePickVideo}
                                style={[sc.videoPlaceholder, { backgroundColor: theme === 'dark' ? '#121218' : '#FFF', borderColor: colors.border }]}
                            >
                                <Camera size={26} color={colors.textMuted} style={{ marginBottom: 8 }} />
                                <Text style={[sc.videoPlaceholderText, { color: colors.textMuted }]}>{t('tapToUploadVideo') || 'Tap to Add Video'}</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={sc.videoWrapper}>
                                <UniversalVideoPlayer source={{ uri: videoUrl }} style={StyleSheet.absoluteFill} useNativeControls resizeMode="cover" isLooping />
                                <TouchableOpacity onPress={() => setVideoUrl('')} style={sc.removeVideoBtn}>
                                    <X size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ── Names ──────────────── */}
                        <Text style={[sc.fieldLabel, { color: colors.textMuted }]}>{t('productNameFr').toUpperCase()}</Text>
                        <TextInput style={[sc.input, { backgroundColor: theme === 'dark' ? '#17171F' : '#FFF', color: colors.foreground, borderColor: colors.border }]} value={nameFr} onChangeText={setNameFr} placeholder={t('frenchName')} placeholderTextColor={colors.textMuted} />

                        <Text style={[sc.fieldLabel, { color: colors.textMuted }]}>{t('productNameAr').toUpperCase()}</Text>
                        <TextInput style={[sc.input, { backgroundColor: theme === 'dark' ? '#17171F' : '#FFF', color: colors.foreground, borderColor: colors.border, textAlign: 'right' }]} value={nameAr} onChangeText={setNameAr} placeholder={t('arabicName')} placeholderTextColor={colors.textMuted} />

                        <Text style={[sc.fieldLabel, { color: colors.textMuted }]}>{t('productNameEn').toUpperCase()}</Text>
                        <TextInput style={[sc.input, { backgroundColor: theme === 'dark' ? '#17171F' : '#FFF', color: colors.foreground, borderColor: colors.border }]} value={nameEn} onChangeText={setNameEn} placeholder={t('englishName')} placeholderTextColor={colors.textMuted} />

                        {/* ── Prices ──────────────── */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[sc.fieldLabel, { color: colors.textMuted }]}>{t('price').toUpperCase()}</Text>
                                <TextInput style={[sc.input, { backgroundColor: theme === 'dark' ? '#17171F' : '#FFF', color: colors.foreground, borderColor: colors.border }]} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.textMuted} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[sc.fieldLabel, { color: colors.textMuted }]}>{t('discountPrice').toUpperCase()}</Text>
                                <TextInput style={[sc.input, { backgroundColor: theme === 'dark' ? '#17171F' : '#FFF', color: colors.foreground, borderColor: colors.border }]} value={discountPrice} onChangeText={setDiscountPrice} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.textMuted} />
                            </View>
                        </View>

                        <Text style={[sc.fieldLabel, { color: colors.textMuted }]}>{t('deliveryPrice').toUpperCase()}</Text>
                        <TextInput style={[sc.input, { backgroundColor: theme === 'dark' ? '#17171F' : '#FFF', color: colors.foreground, borderColor: colors.border }]} value={deliveryPrice} onChangeText={setDeliveryPrice} keyboardType="numeric" placeholder="7.00" placeholderTextColor={colors.textMuted} />

                        {/* ── Category ──────────────── */}
                        <Text style={[sc.fieldLabel, { color: colors.textMuted }]}>{t('category').toUpperCase()}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => setCategoryId(cat.id)}
                                    style={[sc.chip, {
                                        backgroundColor: categoryId === cat.id ? colors.foreground : (theme === 'dark' ? '#17171F' : '#FFF'),
                                        borderColor: categoryId === cat.id ? colors.foreground : colors.border,
                                    }]}
                                >
                                    <Text style={[sc.chipText, { color: categoryId === cat.id ? (theme === 'dark' ? '#000' : '#FFF') : colors.foreground }]}>
                                        {cat.name?.fr || cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* ── Brand ──────────────── */}
                        <Text style={[sc.fieldLabel, { color: colors.textMuted }]}>{t('brand').toUpperCase()}</Text>
                        {isBrandOwner ? (
                            // Brand owner sees only their brand as a locked (selected) chip
                            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                                {brands.map(b => (
                                    <View
                                        key={b.id}
                                        style={[sc.chip, {
                                            backgroundColor: colors.foreground,
                                            borderColor: colors.foreground,
                                            opacity: 0.85,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }]}
                                    >
                                        <Text style={[sc.chipText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>
                                            {b.name?.fr || b.name}
                                        </Text>
                                        <Text style={{ fontSize: 9, color: theme === 'dark' ? '#555' : 'rgba(255,255,255,0.7)', marginLeft: 4 }}>✓</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            // Admin sees all brands as selectable chips
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                                {brands.map(b => (
                                    <TouchableOpacity
                                        key={b.id}
                                        onPress={() => setBrandId(b.id)}
                                        style={[sc.chip, {
                                            backgroundColor: brandId === b.id ? colors.foreground : (theme === 'dark' ? '#17171F' : '#FFF'),
                                            borderColor: brandId === b.id ? colors.foreground : colors.border,
                                        }]}
                                    >
                                        <Text style={[sc.chipText, { color: brandId === b.id ? (theme === 'dark' ? '#000' : '#FFF') : colors.foreground }]}>
                                            {b.name?.fr || b.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {/* ── Sizes ──────────────── */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={[sc.fieldLabel, { color: colors.textMuted, marginBottom: 0, marginTop: 0 }]}>{t('sizesLabel').toUpperCase()}</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity onPress={() => setSizes(['XS', 'S', 'M', 'L', 'XL', 'XXL'])} style={[sc.quickBtn, { backgroundColor: theme === 'dark' ? '#17171F' : '#F0F0F5' }]}>
                                    <Text style={[sc.quickBtnText, { color: colors.foreground }]}>+ ALPHA</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setSizes(['36', '38', '40', '42', '44', '46'])} style={[sc.quickBtn, { backgroundColor: theme === 'dark' ? '#17171F' : '#F0F0F5' }]}>
                                    <Text style={[sc.quickBtnText, { color: colors.foreground }]}>+ NUM</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={sc.sizesGrid}>
                            {['TU', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44', '46'].map(s => (
                                <TouchableOpacity
                                    key={s}
                                    onPress={() => setSizes(sizes.includes(s) ? sizes.filter(sz => sz !== s) : [...sizes, s])}
                                    style={[sc.sizeBtn, {
                                        backgroundColor: sizes.includes(s) ? colors.foreground : (theme === 'dark' ? '#17171F' : '#FFF'),
                                        borderColor: sizes.includes(s) ? colors.foreground : colors.border,
                                    }]}
                                >
                                    <Text style={[sc.sizeBtnText, { color: sizes.includes(s) ? (theme === 'dark' ? '#000' : '#FFF') : colors.foreground }]}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* ── Colors ──────────────── */}
                        <Text style={[sc.fieldLabel, { color: colors.textMuted }]}>{t('colorsLabel').toUpperCase()}</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                            <TextInput
                                style={[sc.input, { flex: 1, marginBottom: 0, backgroundColor: theme === 'dark' ? '#17171F' : '#FFF', color: colors.foreground, borderColor: colors.border }]}
                                placeholder={t('colorPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                value={colorInput}
                                onChangeText={setColorInput}
                                onSubmitEditing={addColor}
                            />
                            <TouchableOpacity onPress={addColor} style={[sc.addColorBtn, { backgroundColor: colors.foreground }]}>
                                <Text style={[sc.addColorBtnText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('add')}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={sc.colorsWrap}>
                            {productColors.map((c, i) => (
                                <TouchableOpacity key={i} onPress={() => setProductColors(productColors.filter(col => col !== c))}
                                    style={[sc.colorChip, { backgroundColor: theme === 'dark' ? '#17171F' : '#FFF', borderColor: colors.border }]}>
                                    <View style={[sc.colorDot, { backgroundColor: c.startsWith('#') ? c : c.toLowerCase() }]} />
                                    <Text style={[sc.colorChipText, { color: colors.foreground }]}>{c}</Text>
                                    <X size={11} color={colors.textMuted} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* ── Descriptions ──────────────── */}
                        <Text style={[sc.fieldLabel, { color: colors.textMuted }]}>{t('productDescFr').toUpperCase()}</Text>
                        <TextInput style={[sc.input, sc.textarea, { backgroundColor: theme === 'dark' ? '#17171F' : '#FFF', color: colors.foreground, borderColor: colors.border }]} multiline value={descriptionFr} onChangeText={setDescriptionFr} placeholder={t('frenchDesc')} placeholderTextColor={colors.textMuted} />

                        <Text style={[sc.fieldLabel, { color: colors.textMuted }]}>{t('productDescAr').toUpperCase()}</Text>
                        <TextInput style={[sc.input, sc.textarea, { backgroundColor: theme === 'dark' ? '#17171F' : '#FFF', color: colors.foreground, borderColor: colors.border, textAlign: 'right' }]} multiline value={descriptionAr} onChangeText={setDescriptionAr} placeholder={t('arabicDesc')} placeholderTextColor={colors.textMuted} />

                        <Text style={[sc.fieldLabel, { color: colors.textMuted }]}>{t('productDescEn').toUpperCase()}</Text>
                        <TextInput style={[sc.input, sc.textarea, { backgroundColor: theme === 'dark' ? '#17171F' : '#FFF', color: colors.foreground, borderColor: colors.border }]} multiline value={descriptionEn} onChangeText={setDescriptionEn} placeholder={t('englishDesc')} placeholderTextColor={colors.textMuted} />
                    </Animated.ScrollView>
                </SafeAreaView>
            </Modal>
        </View >
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
    root: { flex: 1 },
    hdr: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 4 },
    hdrRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
    hdrTitle2: { flex: 1, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
    backBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    hSep: { height: StyleSheet.hairlineWidth },
    header: { height: 64, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingHorizontal: 20, zIndex: 100, overflow: 'hidden' as const },
    headerTitle: { fontSize: 13, fontWeight: '900' as const, letterSpacing: 2 },
    iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center' as const, justifyContent: 'center' as const },

    // List
    listContent: { padding: 20, paddingBottom: 120 },
    listCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2
    },
    listThumb: {
        width: 80,
        height: 80,
        borderRadius: 16,
    },
    thumbWrapper: {
        position: 'relative',
    },
    soldOutBadge: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,59,48,0.85)',
        paddingVertical: 3,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        alignItems: 'center',
    },
    soldOutText: {
        color: 'white',
        fontSize: 7,
        fontWeight: '900',
    },
    listInfo: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center'
    },
    listName: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: -0.2,
        marginBottom: 4,
    },
    listMetaRow: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 6,
        flexWrap: 'wrap'
    },
    metaTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    metaTagText: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.3
    },
    priceAndStockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceCol: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    priceMain: {
        fontSize: 14,
        fontWeight: '900',
        color: '#000'
    },
    priceOld: {
        fontSize: 11,
        textDecorationLine: 'line-through',
        fontWeight: '600',
        opacity: 0.5
    },
    actionsCol: {
        gap: 8,
        marginLeft: 10,
    },
    actionBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },

    empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 20 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
    emptyTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3, marginBottom: 10, textAlign: 'center' },
    emptySubtitle: { fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 18 },
    emptyBtnText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    emptyText: { fontSize: 13, fontWeight: '600' },

    // Modal
    modalRoot: { flex: 1 },
    modalHeader: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1 },
    modalTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, position: 'absolute', left: 80, right: 80, textAlign: 'center' },
    modalAction: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    formContent: { padding: 22, paddingBottom: 100 },

    // Form fields
    fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginTop: 18, marginBottom: 8, marginLeft: 2 },
    input: { height: 50, borderRadius: 14, paddingHorizontal: 16, fontSize: 13, fontWeight: '600', borderWidth: 1, marginBottom: 4 },
    textarea: { height: 90, paddingTop: 14, textAlignVertical: 'top' },

    // Toggle row
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
    toggleLabel: { fontSize: 13, fontWeight: '700' },
    toggleSub: { fontSize: 11, marginTop: 2 },

    // Images
    addImageBtn: { width: 90, height: 118, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', marginRight: 10 },
    addImageText: { fontSize: 9, fontWeight: '800', marginTop: 6, letterSpacing: 1 },
    imageWrapper: { marginRight: 10, position: 'relative' },
    imageThumb: { width: 90, height: 118, borderRadius: 14 },
    removeImageBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 10, padding: 4 },

    // Video
    videoPlaceholder: { height: 140, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', marginBottom: 4 },
    videoPlaceholderText: { fontSize: 12, fontWeight: '600', marginTop: 4 },
    videoWrapper: { height: 190, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', marginBottom: 4, position: 'relative' },
    removeVideoBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(239,68,68,0.9)', borderRadius: 18, padding: 8, zIndex: 10 },

    // Sizes
    quickBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    quickBtnText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    sizesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    sizeBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    sizeBtnText: { fontSize: 11, fontWeight: '700' },

    // Chips
    chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18, marginRight: 10, borderWidth: 1 },
    chipText: { fontSize: 12, fontWeight: '700' },

    // Colors
    addColorBtn: { borderRadius: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
    addColorBtnText: { fontSize: 12, fontWeight: '800' },
    colorsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    colorChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
    colorDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    colorChipText: { fontSize: 12, fontWeight: '600' },
});
