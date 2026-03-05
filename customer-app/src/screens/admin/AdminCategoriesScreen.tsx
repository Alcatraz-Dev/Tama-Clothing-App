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
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Plus,
    Trash2,
    Settings,
    Camera,
    X,
    ChevronDown,
    Layers,
} from 'lucide-react-native';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    where,
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
import { uploadToBunny } from '../../utils/bunny';
import { getSafeString } from '../../utils/helpers';
import { seedDemoData } from '../../utils/seedDemoData';


const { width } = Dimensions.get('window');

export default function AdminCategoriesScreen({ onBack, t }: any) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';

    // All categories from Firestore
    const [categories, setCategories] = useState<any[]>([]);
    // Which top-level category is expanded to show its children
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [nameFr, setNameFr] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [nameEn, setNameEn] = useState('');
    const [image, setImage] = useState('');
    const [parentId, setParentId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showParentPicker, setShowParentPicker] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const snap = await getDocs(collection(db, 'categories'));
            setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    // Split into top-level and subcategories
    const topLevelCats = categories.filter(c => !c.parentId);
    const getSubcategories = (parentId: string) => categories.filter(c => c.parentId === parentId);

    const getName = (cat: any) => {
        if (typeof cat.name === 'string') return cat.name;
        return cat.name?.fr || cat.name?.en || '';
    };

    const handleSave = async () => {
        if (!nameFr) return Alert.alert(t('error'), t('nameRequired'));
        setUploading(true);
        try {
            let imgUrl = image;
            if (image && !image.startsWith('http')) {
                imgUrl = await uploadToBunny(image);
            }

            const data: any = {
                name: { fr: nameFr, 'ar-tn': nameAr, en: nameEn },
                image: imgUrl,
                updatedAt: serverTimestamp(),
            };

            // Attach or remove parentId
            if (parentId) {
                data.parentId = parentId;
            } else {
                data.parentId = null;
            }

            if (editingCategory) {
                await updateDoc(doc(db, 'categories', editingCategory.id), data);
            } else {
                await addDoc(collection(db, 'categories'), { ...data, createdAt: serverTimestamp() });
            }
            setModalVisible(false);
            fetchCategories();
            resetForm();
        } catch (error) {
            Alert.alert(t('error'), t('failedToSave'));
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        // Check if it has subcategories first
        const childSnap = await getDocs(query(collection(db, 'categories'), where('parentId', '==', id)));
        if (!childSnap.empty) {
            return Alert.alert(
                t('delete'),
                'Cette catégorie a des sous-catégories. Supprimer celles-ci d\'abord.',
                [{ text: 'OK' }]
            );
        }
        Alert.alert(t('delete'), t('areYouSure'), [
            { text: t('cancel'), style: 'cancel' },
            {
                text: t('delete'),
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'categories', id));
                        fetchCategories();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete category');
                    }
                }
            }
        ]);
    };

    const resetForm = () => {
        setEditingCategory(null);
        setNameFr('');
        setNameAr('');
        setNameEn('');
        setImage('');
        setParentId(null);
    };

    const openEdit = (c: any) => {
        setEditingCategory(c);
        setNameFr(c.name?.fr || (typeof c.name === 'string' ? c.name : ''));
        setNameAr(c.name?.['ar-tn'] || '');
        setNameEn(c.name?.en || '');
        setImage(c.image || '');
        setParentId(c.parentId || null);
        setModalVisible(true);
    };

    const openNewSubcategory = (parentCatId: string) => {
        resetForm();
        setParentId(parentCatId);
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

    const selectedParentName = parentId ? getName(categories.find(c => c.id === parentId) || {}) : null;

    // ── Category row ──────────────────────────────────────────────────────────
    const renderCategory = (item: any) => {
        const subs = getSubcategories(item.id);
        const isExpanded = expandedId === item.id;

        return (
            <View key={item.id}>
                <AdminCard style={sc.categoryCard}>
                    <Image
                        source={{ uri: item.image || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=300' }}
                        style={[sc.categoryImg, { backgroundColor: isDark ? '#17171F' : '#F9F9FB' }]}
                    />
                    <View style={sc.categoryInfo}>
                        <Text style={[sc.categoryName, { color: colors.foreground }]}>{getName(item)}</Text>
                        {subs.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setExpandedId(isExpanded ? null : item.id)}
                                style={sc.subCountRow}
                            >
                                <Layers size={12} color={colors.textMuted} />
                                <Text style={[sc.subCountText, { color: colors.textMuted }]}>
                                    {subs.length} sous-catégorie{subs.length > 1 ? 's' : ''}
                                </Text>
                                <ChevronDown
                                    size={12}
                                    color={colors.textMuted}
                                    style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={sc.actions}>
                        <TouchableOpacity
                            onPress={() => openNewSubcategory(item.id)}
                            style={[sc.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                            <Plus size={16} color={colors.foreground} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => openEdit(item)}
                            style={[sc.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                        >
                            <Settings size={16} color={colors.foreground} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDelete(item.id)}
                            style={[sc.actionBtn, { backgroundColor: isDark ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.1)' }]}
                        >
                            <Trash2 size={16} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                </AdminCard>

                {/* Subcategories */}
                {isExpanded && subs.length > 0 && (
                    <View style={sc.subsContainer}>
                        {subs.map((sub: any) => (
                            <AdminCard key={sub.id} style={sc.subCard}>
                                <View style={sc.subIndent} />
                                <Image
                                    source={{ uri: sub.image || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=300' }}
                                    style={[sc.subImg, { backgroundColor: isDark ? '#17171F' : '#F9F9FB' }]}
                                />
                                <View style={sc.categoryInfo}>
                                    <Text style={[sc.subName, { color: colors.foreground }]}>{getName(sub)}</Text>
                                    {sub.name?.['ar-tn'] && (
                                        <Text style={[sc.categoryNameAr, { color: colors.textMuted }]}>{sub.name['ar-tn']}</Text>
                                    )}
                                </View>
                                <View style={sc.actions}>
                                    <TouchableOpacity
                                        onPress={() => openEdit(sub)}
                                        style={[sc.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                                    >
                                        <Settings size={15} color={colors.foreground} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDelete(sub.id)}
                                        style={[sc.actionBtn, { backgroundColor: isDark ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.1)' }]}
                                    >
                                        <Trash2 size={15} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            </AdminCard>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const handleSeed = async () => {
        Alert.alert(
            "Générer démo",
            "Voulez-vous ajouter des catégories et produits de démonstration ?",
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('ok'),
                    onPress: async () => {
                        setUploading(true);
                        const success = await seedDemoData(t);
                        setUploading(true); // Wait for fetch
                        await fetchCategories();
                        setUploading(false);
                        if (success) Alert.alert(t('successTitle'), t('demoDataAdded') || "Données de démonstration ajoutées !");
                        else Alert.alert(t('error'), t('seedingFailed') || "Le seeding a échoué.");
                    }
                }
            ]
        );
    };

    return (
        <View style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader
                title={t('categories')}
                onBack={onBack}
                rightElement={
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            onPress={handleSeed}
                            style={[sc.addBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7', width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }]}
                        >
                            <Layers size={20} color={colors.foreground} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => { resetForm(); setModalVisible(true); }}
                            style={[sc.addBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7', width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }]}
                        >
                            <Plus size={20} color={colors.foreground} />
                        </TouchableOpacity>
                    </View>
                }
            />

            <Animated.ScrollView
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                contentContainerStyle={[sc.listContent, { paddingTop: insets.top + 80 }]}
            >
                {topLevelCats.length === 0 ? (
                    <EmptyState message={t('noResults')} />
                ) : (
                    topLevelCats.map(renderCategory)
                )}
            </Animated.ScrollView>

            {/* Category form modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" transparent={false}>
                <View style={[sc.modalRoot, { backgroundColor: isDark ? '#0A0A0F' : '#FAFAFA' }]}>
                    <View style={[sc.modalHeader, { backgroundColor: isDark ? '#121218' : 'white', borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={sc.modalCloseBtn}>
                            <X size={20} color={colors.foreground} />
                        </TouchableOpacity>
                        <Text style={[sc.modalTitle, { color: colors.foreground }]}>
                            {editingCategory ? t('editCategory').toUpperCase() : t('newCategory').toUpperCase()}
                        </Text>
                        <TouchableOpacity onPress={handleSave} disabled={uploading}>
                            {uploading ? <ActivityIndicator size="small" color={colors.foreground} /> : (
                                <Text style={[sc.modalSaveText, { color: '#007AFF' }]}>{t('save').toUpperCase()}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={sc.modalContent}>
                        {/* Image picker */}
                        <TouchableOpacity
                            onPress={pickImage}
                            style={[sc.imagePicker, {
                                backgroundColor: isDark ? '#121218' : 'white',
                                borderColor: colors.border,
                                borderStyle: image ? 'solid' : 'dashed'
                            }]}
                        >
                            {image ? <Image source={{ uri: image }} style={sc.pickerImg} /> : (
                                <View style={sc.pickerPlaceholder}>
                                    <Camera size={32} color={colors.textMuted} />
                                    <Text style={[sc.pickerText, { color: colors.textMuted }]}>{t('tapToUpload').toUpperCase()}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Parent Category Picker */}
                        <View style={sc.inputWrap}>
                            <InputLabel text={t('parentCategory').toUpperCase() + ` (${t('optional').toUpperCase()})`} />
                            <TouchableOpacity
                                onPress={() => setShowParentPicker(true)}
                                style={[sc.pickerBtn, {
                                    backgroundColor: isDark ? '#1A1A24' : 'white',
                                    borderColor: parentId ? '#007AFF' : colors.border,
                                }]}
                            >
                                <Text style={{ color: parentId ? '#007AFF' : colors.textMuted, flex: 1, fontWeight: '600', fontSize: 14 }}>
                                    {selectedParentName || t('noParentCategory')}
                                </Text>
                                <ChevronDown size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Name inputs */}
                        <View style={sc.inputWrap}>
                            <InputLabel text={t('category').toUpperCase() + ' (FR)'} />
                            <TextInput
                                style={[sc.input, { backgroundColor: isDark ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                value={nameFr}
                                onChangeText={setNameFr}
                                placeholder={t('frenchName')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={sc.inputWrap}>
                            <InputLabel text={t('category').toUpperCase() + ' (EN)'} />
                            <TextInput
                                style={[sc.input, { backgroundColor: isDark ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                value={nameEn}
                                onChangeText={setNameEn}
                                placeholder={t('englishName')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={sc.inputWrap}>
                            <InputLabel text={t('category').toUpperCase() + ' (AR)'} />
                            <TextInput
                                style={[sc.input, { backgroundColor: isDark ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border, textAlign: 'right' }]}
                                value={nameAr}
                                onChangeText={setNameAr}
                                placeholder={t('arabicName')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </ScrollView>
                </View>

                {/* Parent Picker Modal */}
                <Modal visible={showParentPicker} animationType="slide" presentationStyle="formSheet" transparent>
                    <View style={sc.parentPickerOverlay}>
                        <View style={[sc.parentPickerSheet, { backgroundColor: isDark ? '#1A1A24' : 'white' }]}>
                            <View style={[sc.parentPickerHeader, { borderBottomColor: colors.border }]}>
                                <Text style={[sc.parentPickerTitle, { color: colors.foreground }]}>{t('parentCategory').toUpperCase()}</Text>
                                <TouchableOpacity onPress={() => setShowParentPicker(false)}>
                                    <X size={20} color={colors.foreground} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView>
                                {/* No parent option */}
                                <TouchableOpacity
                                    style={[sc.parentOption, { borderBottomColor: colors.border }]}
                                    onPress={() => { setParentId(null); setShowParentPicker(false); }}
                                >
                                    <Text style={[sc.parentOptionText, { color: !parentId ? '#007AFF' : colors.foreground }]}>
                                        {t('noParentCategory')}
                                    </Text>
                                    {!parentId && <View style={sc.parentOptionCheck} />}
                                </TouchableOpacity>

                                {/* Top-level categories only as parent options */}
                                {topLevelCats
                                    .filter(c => !editingCategory || c.id !== editingCategory.id)
                                    .map(cat => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[sc.parentOption, { borderBottomColor: colors.border }]}
                                            onPress={() => { setParentId(cat.id); setShowParentPicker(false); }}
                                        >
                                            <Image source={{ uri: cat.image }} style={sc.parentOptionImg} />
                                            <Text style={[sc.parentOptionText, { color: parentId === cat.id ? '#007AFF' : colors.foreground }]}>
                                                {getName(cat)}
                                            </Text>
                                            {parentId === cat.id && <View style={sc.parentOptionCheck} />}
                                        </TouchableOpacity>
                                    ))
                                }
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </Modal>
        </View>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    addBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    listContent: { padding: 20, paddingBottom: 120 },
    categoryCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 24, marginBottom: 12 },
    categoryImg: { width: 70, height: 70, borderRadius: 18 },
    categoryInfo: { flex: 1, marginLeft: 14 },
    categoryName: { fontWeight: '900', fontSize: 15, letterSpacing: -0.2 },
    categoryNameAr: { fontSize: 12, marginTop: 3, writingDirection: 'rtl', opacity: 0.8 },
    subCountRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    subCountText: { fontSize: 11, fontWeight: '600' },
    actions: { gap: 8, marginLeft: 10 },
    actionBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    subsContainer: { paddingLeft: 20, marginBottom: 4 },
    subCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, marginBottom: 8 },
    subIndent: { width: 3, height: 48, backgroundColor: '#007AFF', borderRadius: 2, marginRight: 10, opacity: 0.4 },
    subImg: { width: 52, height: 52, borderRadius: 14 },
    subName: { fontWeight: '700', fontSize: 13 },

    modalRoot: { flex: 1 },
    modalHeader: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    modalCloseBtn: { padding: 4 },
    modalTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    modalSaveText: { fontSize: 11, fontWeight: '900' },
    modalContent: { padding: 25 },
    imagePicker: {
        width: '100%',
        height: 200,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    pickerImg: { width: '100%', height: '100%' },
    pickerPlaceholder: { alignItems: 'center', gap: 10 },
    pickerText: { fontSize: 10, fontWeight: '800' },
    inputWrap: { marginBottom: 20 },
    input: {
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 15,
        borderWidth: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    pickerBtn: {
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 15,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },

    parentPickerOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    parentPickerSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
        overflow: 'hidden',
    },
    parentPickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    parentPickerTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    parentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 12,
    },
    parentOptionImg: { width: 36, height: 36, borderRadius: 10 },
    parentOptionText: { flex: 1, fontSize: 14, fontWeight: '600' },
    parentOptionCheck: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007AFF' },
});
