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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Plus,
    Trash2,
    Settings,
    Camera,
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
import { BlurView } from 'expo-blur';
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import { AdminHeader } from '../../components/admin/AdminHeader';
import {
    AdminCard,
    SectionLabel,
    InputLabel,
    EmptyState,
} from '../../components/admin/AdminUI';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { getSafeString } from '../../utils/helpers';


const { width } = Dimensions.get('window');

export default function AdminCategoriesScreen({ onBack, t }: any) {
    const { colors, theme } = useAppTheme();
    const [categories, setCategories] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [nameFr, setNameFr] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [image, setImage] = useState('');
    const [uploading, setUploading] = useState(false);
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
                updatedAt: serverTimestamp()
            };

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
        setImage('');
    };

    const openEdit = (c: any) => {
        setEditingCategory(c);
        setNameFr(c.name?.fr || (typeof c.name === 'string' ? c.name : ''));
        setNameAr(c.name?.['ar-tn'] || '');
        setImage(c.image || '');
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

    return (
        <SafeAreaView style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader
                title={t('categories').toUpperCase()}
                onBack={onBack}
                scrollY={scrollY}
                rightElement={
                    <TouchableOpacity
                        onPress={() => { resetForm(); setModalVisible(true); }}
                        style={[sc.addBtn, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
                    >
                        <Plus size={20} color={colors.foreground} />
                    </TouchableOpacity>
                }
            />

            <Animated.FlatList
                data={categories}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                contentContainerStyle={sc.listContent}
                ListEmptyComponent={<EmptyState message={t('noResults')} />}
                renderItem={({ item }) => (
                    <AdminCard style={sc.categoryCard}>
                        <Image source={{ uri: item.image }} style={[sc.categoryImg, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]} />
                        <View style={sc.categoryInfo}>
                            <Text style={[sc.categoryName, { color: colors.foreground }]}>{getSafeString(item.name)}</Text>
                            {item.name?.['ar-tn'] && <Text style={[sc.categoryNameAr, { color: colors.textMuted }]}>{item.name['ar-tn']}</Text>}
                        </View>
                        <View style={sc.actions}>
                            <TouchableOpacity onPress={() => openEdit(item)} style={sc.actionBtn}>
                                <Settings size={18} color={colors.foreground} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={sc.actionBtn}>
                                <Trash2 size={18} color={colors.error} />
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
                            {editingCategory ? t('editCategory').toUpperCase() : t('newCategory').toUpperCase()}
                        </Text>
                        <TouchableOpacity onPress={handleSave} disabled={uploading}>
                            {uploading ? <ActivityIndicator size="small" color={colors.foreground} /> : (
                                <Text style={[sc.modalSaveText, { color: colors.foreground }]}>{t('save').toUpperCase()}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={sc.modalContent}>
                        <TouchableOpacity onPress={pickImage} style={[sc.imagePicker, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border, borderStyle: image ? 'solid' : 'dashed' }]}>
                            {image ? <Image source={{ uri: image }} style={sc.pickerImg} /> : (
                                <View style={sc.pickerPlaceholder}>
                                    <Camera size={32} color={colors.textMuted} />
                                    <Text style={[sc.pickerText, { color: colors.textMuted }]}>{t('tapToUpload').toUpperCase()}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={sc.inputWrap}>
                            <InputLabel text={t('category').toUpperCase() + " (FR)"} />
                            <TextInput
                                style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                value={nameFr}
                                onChangeText={setNameFr}
                                placeholder={t('frenchName')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={sc.inputWrap}>
                            <InputLabel text={t('category').toUpperCase() + " (AR)"} />
                            <TextInput
                                style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border, textAlign: 'right' }]}
                                value={nameAr}
                                onChangeText={setNameAr}
                                placeholder={t('arabicName')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    listContent: { padding: 20, paddingBottom: 100 },
    categoryCard: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    categoryImg: { width: 60, height: 60, borderRadius: 12 },
    categoryInfo: { flex: 1, marginLeft: 16 },
    categoryName: { fontWeight: '900', fontSize: 14 },
    categoryNameAr: { fontSize: 11, marginTop: 2, writingDirection: 'rtl' },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 8 },

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
    modalSaveText: { fontSize: 11, fontWeight: '900', color: '#007AFF' },
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
    }
});
