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
    Modal,
    ActivityIndicator,
    Switch,
    FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Plus,
    Settings,
    Trash2,
    Camera,
    Search,
    CheckCircle2,
    X,
} from 'lucide-react-native';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';

import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import {
    AdminCard,
    SectionLabel,
    InputLabel,
    EmptyState,
    AdminHeader,
} from '../../components/admin/AdminUI';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { getSafeString } from '../../utils/helpers';


const { width } = Dimensions.get('window');

export default function AdminBrandsScreen({ onBack, t }: any) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';
    const [brands, setBrands] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBrand, setEditingBrand] = useState<any>(null);
    const [nameFr, setNameFr] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [image, setImage] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [uploading, setUploading] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchBrands();
        fetchProducts();
    }, []);

    const fetchBrands = async () => {
        try {
            const snap = await getDocs(collection(db, 'brands'));
            setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProducts = async () => {
        try {
            const snap = await getDocs(collection(db, 'products'));
            setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        if (!nameFr) return Alert.alert(t('error'), t('nameRequired'));
        setUploading(true);
        try {
            let imgUrl = image;
            if (image && !image.startsWith('http')) {
                imgUrl = await uploadToCloudinary(image);
            }

            const data = {
                name: { fr: nameFr, "ar-tn": nameAr },
                image: imgUrl,
                address,
                phone,
                isActive,
                updatedAt: serverTimestamp()
            };

            let brandId = editingBrand?.id;

            if (editingBrand) {
                await updateDoc(doc(db, 'brands', editingBrand.id), data);
            } else {
                const ref = await addDoc(collection(db, 'brands'), { ...data, createdAt: serverTimestamp() });
                brandId = ref.id;
            }

            // Update products with brandId
            const updatePromises = allProducts.map(p => {
                const isSelected = selectedProductIds.includes(p.id);
                const currentBrandId = p.brandId;

                if (isSelected && currentBrandId !== brandId) {
                    return updateDoc(doc(db, 'products', p.id), { brandId: brandId });
                }
                if (!isSelected && currentBrandId === brandId) {
                    return updateDoc(doc(db, 'products', p.id), { brandId: null });
                }
                return Promise.resolve();
            });

            await Promise.all(updatePromises);
            await fetchProducts();

            setModalVisible(false);
            fetchBrands();
            resetForm();
        } catch (error) {
            Alert.alert(t('error'), t('failedToSave'));
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(t('delete'), t('areYouSure'), [
            { text: t('cancel'), style: 'cancel' },
            {
                text: t('delete'),
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'brands', id));
                        fetchBrands();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete brand');
                    }
                }
            }
        ]);
    };

    const resetForm = () => {
        setEditingBrand(null);
        setNameFr('');
        setNameAr('');
        setImage('');
        setAddress('');
        setPhone('');
        setIsActive(true);
        setSelectedProductIds([]);
    };

    const openEdit = (b: any) => {
        setEditingBrand(b);
        setNameFr(b.name?.fr || (typeof b.name === 'string' ? b.name : ''));
        setNameAr(b.name?.['ar-tn'] || '');
        setImage(b.image || '');
        setAddress(b.address || '');
        setPhone(b.phone || '');
        setIsActive(b.isActive !== false);

        const associatedProducts = allProducts.filter(p => p.brandId === b.id).map(p => p.id);
        setSelectedProductIds(associatedProducts);

        setModalVisible(true);
    };

    const pickImage = async () => {
        const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5
        });
        if (!r.canceled) setImage(r.assets[0].uri);
    };

    const toggleProductSelection = (id: string) => {
        if (selectedProductIds.includes(id)) {
            setSelectedProductIds(prev => prev.filter(pId => pId !== id));
        } else {
            setSelectedProductIds(prev => [...prev, id]);
        }
    };

    return (
        <View style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader
                title={t('brands')}
                onBack={onBack}
                rightElement={
                    <TouchableOpacity
                        onPress={() => { resetForm(); setModalVisible(true); }}
                        style={[sc.addBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
                    >
                        <Plus size={20} color={colors.foreground} />
                    </TouchableOpacity>
                }
            />

            <Animated.FlatList
                data={brands}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                contentContainerStyle={[sc.listContent, { paddingTop: insets.top + 80 }]}
                ListEmptyComponent={<EmptyState message={t('noBrandsFound')} />}
                renderItem={({ item }) => (
                    <AdminCard style={[sc.brandCard, { opacity: item.isActive === false ? 0.6 : 1 }]}>
                        <Image source={{ uri: item.image }} style={[sc.brandImg, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]} />
                        <View style={sc.brandInfo}>
                            <Text style={[sc.brandName, { color: colors.foreground }]}>{getSafeString(item.name)}</Text>
                            {item.name?.['ar-tn'] && <Text style={[sc.brandNameAr, { color: colors.textMuted }]}>{item.name['ar-tn']}</Text>}
                        </View>
                        <View style={sc.actions}>
                            <TouchableOpacity onPress={() => openEdit(item)} style={[sc.actionBtn, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                                <Settings size={18} color={colors.foreground} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={[sc.actionBtn, { backgroundColor: theme === 'dark' ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.1)' }]}>
                                <Trash2 size={18} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    </AdminCard>
                )}
            />

            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[sc.modalRoot, { backgroundColor: theme === 'dark' ? '#0A0A0F' : '#FAFAFA' }]}>
                    <View style={[sc.modalHeader, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={sc.modalCloseBtn}>
                            <X size={20} color={colors.foreground} />
                        </TouchableOpacity>
                        <Text style={[sc.modalTitle, { color: colors.foreground }]}>
                            {editingBrand ? t('editBrand').toUpperCase() : t('newBrand').toUpperCase()}
                        </Text>
                        <TouchableOpacity onPress={handleSave} disabled={uploading}>
                            {uploading ? <ActivityIndicator size="small" color={colors.foreground} /> : (
                                <Text style={[sc.modalSaveText, { color: colors.foreground }]}>{t('save').toUpperCase()}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={[{ key: 'form' }]}
                        keyExtractor={item => item.key}
                        contentContainerStyle={sc.modalContent}
                        renderItem={() => (
                            <>
                                <TouchableOpacity onPress={pickImage} style={[sc.imagePicker, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border, borderStyle: image ? 'solid' : 'dashed' }]}>
                                    {image ? <Image source={{ uri: image }} style={sc.pickerImg} /> : (
                                        <View style={sc.pickerPlaceholder}>
                                            <Camera size={32} color={colors.textMuted} />
                                            <Text style={[sc.pickerText, { color: colors.textMuted }]}>{t('tapToUploadLogo').toUpperCase()}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <View style={sc.inputWrap}>
                                    <InputLabel text={t('brand').toUpperCase() + " (FR)"} />
                                    <TextInput
                                        style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                        value={nameFr}
                                        onChangeText={setNameFr}
                                        placeholder={t('frenchName')}
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>

                                <View style={sc.inputWrap}>
                                    <InputLabel text={t('brand').toUpperCase() + " (AR)"} />
                                    <TextInput
                                        style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border, textAlign: 'right' }]}
                                        value={nameAr}
                                        onChangeText={setNameAr}
                                        placeholder={t('arabicName')}
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>

                                <View style={sc.inputWrap}>
                                    <InputLabel text={t('address')?.toUpperCase() || 'ADRESSE (POINT RELAIS)'} />
                                    <TextInput
                                        style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                        value={address}
                                        onChangeText={setAddress}
                                        placeholder="Ex: Tunis, Tunisie 1000"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>

                                <View style={sc.inputWrap}>
                                    <InputLabel text={t('phone')?.toUpperCase() || 'TÉLÉPHONE'} />
                                    <TextInput
                                        style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder="Ex: +216 71 000 000"
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="phone-pad"
                                    />
                                </View>

                                <View style={[sc.toggleRow, { backgroundColor: theme === 'dark' ? '#17171F' : '#F2F2F7' }]}>
                                    <Text style={[sc.toggleLabel, { color: colors.foreground }]}>{t('visible').toUpperCase()}</Text>
                                    <Switch
                                        value={isActive}
                                        onValueChange={setIsActive}
                                        trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                                    />
                                </View>

                                <SectionLabel text={t('selectProducts').toUpperCase()} style={{ marginTop: 25, marginBottom: 15 }} />

                                <View style={[sc.searchWrap, { backgroundColor: theme === 'dark' ? '#17171F' : '#F2F2F7', borderColor: colors.border }]}>
                                    <Search size={18} color={colors.textMuted} />
                                    <TextInput
                                        style={[sc.searchInput, { color: colors.foreground }]}
                                        placeholder={t('searchProducts') + '...'}
                                        placeholderTextColor={colors.textMuted}
                                        value={productSearch}
                                        onChangeText={setProductSearch}
                                    />
                                </View>

                                {allProducts
                                    .filter(p => !productSearch || getSafeString(p.name).toLowerCase().includes(productSearch.toLowerCase()))
                                    .map(p => {
                                        const isSelected = selectedProductIds.includes(p.id);
                                        return (
                                            <TouchableOpacity
                                                key={p.id}
                                                onPress={() => toggleProductSelection(p.id)}
                                                style={[sc.productItem, {
                                                    backgroundColor: isSelected ? (theme === 'dark' ? '#1A1A24' : '#F0F0F3') : 'transparent',
                                                    borderColor: isSelected ? colors.foreground : colors.border
                                                }]}
                                            >
                                                <Image source={{ uri: p.mainImage || p.image }} style={sc.productThumb} />
                                                <View style={sc.productInfo}>
                                                    <Text numberOfLines={1} style={[sc.productName, { color: colors.foreground }]}>{getSafeString(p.name)}</Text>
                                                    <Text style={[sc.productPrice, { color: colors.textMuted }]}>{p.price} TND</Text>
                                                </View>
                                                <View style={[sc.checkbox, { borderColor: isSelected ? colors.foreground : colors.border, backgroundColor: isSelected ? colors.foreground : 'transparent' }]}>
                                                    {isSelected && <CheckCircle2 size={16} color={theme === 'dark' ? '#000' : '#FFF'} />}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })
                                }
                            </>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    hdr: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 4 },
    hdrRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
    hdrTitle: { flex: 1, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
    backBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    hSep: { height: StyleSheet.hairlineWidth },
    addBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    listContent: { padding: 20, paddingBottom: 120 },
    brandCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 24, marginBottom: 16 },
    brandImg: { width: 75, height: 75, borderRadius: 18 },
    brandInfo: { flex: 1, marginLeft: 18 },
    brandName: { fontWeight: '900', fontSize: 16, letterSpacing: -0.2 },
    brandNameAr: { fontSize: 13, marginTop: 4, writingDirection: 'rtl', opacity: 0.8 },
    actions: { gap: 10, marginLeft: 12 },
    actionBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

    modalRoot: { flex: 1 },
    modalHeader: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1 },
    modalCloseBtn: { padding: 4 },
    modalTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    modalSaveText: { fontSize: 10, fontWeight: '900', color: '#007AFF' },
    modalContent: { padding: 25 },

    imagePicker: { width: '100%', height: 180, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 25, borderWidth: 1.5 },
    pickerImg: { width: '100%', height: '100%', borderRadius: 24 },
    pickerPlaceholder: { alignItems: 'center', gap: 10 },
    pickerText: { fontSize: 10, fontWeight: '800' },

    inputWrap: { marginBottom: 20 },
    input: { height: 52, borderRadius: 14, paddingHorizontal: 15, borderWidth: 1, fontSize: 14, fontWeight: '600' },

    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 16, marginTop: 10 },
    toggleLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

    searchWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, marginBottom: 15 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600' },

    productItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 10, borderWidth: 1 },
    productThumb: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#F9F9FB' },
    productInfo: { flex: 1, marginLeft: 12 },
    productName: { fontSize: 13, fontWeight: '700' },
    productPrice: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }
});
