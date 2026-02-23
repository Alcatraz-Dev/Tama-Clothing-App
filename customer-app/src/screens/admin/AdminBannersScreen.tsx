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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Plus,
    Settings,
    Trash2,
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

import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import {
    AdminCard,
    InputLabel,
    EmptyState,
} from '../../components/admin/AdminUI';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { getSafeString } from '../../utils/helpers';

const { width } = Dimensions.get('window');

export default function AdminBannersScreen({ onBack, t, profileData }: any) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';
    const isBrandOwner = profileData?.role === 'brand_owner';
    const myBrandId = profileData?.brandId;

    const [banners, setBanners] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBanner, setEditingBanner] = useState<any>(null);
    const [titleFr, setTitleFr] = useState('');
    const [titleAr, setTitleAr] = useState('');
    const [titleEn, setTitleEn] = useState('');
    const [subFr, setSubFr] = useState('');
    const [subAr, setSubAr] = useState('');
    const [subEn, setSubEn] = useState('');
    const [image, setImage] = useState('');
    const [uploading, setUploading] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const snap = await getDocs(collection(db, 'banners'));
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setBanners(isBrandOwner && myBrandId ? all.filter((b: any) => b.brandId === myBrandId) : all);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async () => {
        if (!titleFr || !image) return Alert.alert(t('error'), t('missingFields'));
        setUploading(true);
        try {
            let imgUrl = image;
            if (image && !image.startsWith('http')) {
                imgUrl = await uploadToCloudinary(image);
            }

            const data = {
                title: { fr: titleFr, "ar-tn": titleAr, en: titleEn },
                subtitle: { fr: subFr, "ar-tn": subAr, en: subEn },
                imageUrl: imgUrl,
                updatedAt: serverTimestamp()
            };

            if (isBrandOwner && myBrandId) (data as any).brandId = myBrandId;

            if (editingBanner) {
                await updateDoc(doc(db, 'banners', editingBanner.id), data);
            } else {
                await addDoc(collection(db, 'banners'), { ...data, createdAt: serverTimestamp() });
            }

            setModalVisible(false);
            fetchBanners();
            resetForm();
        } catch (e) {
            Alert.alert(t('error'), t('failedToSave'));
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(t('delete'), t('areYouSure'), [
            { text: t('cancel') },
            {
                text: t('delete'),
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'banners', id));
                        fetchBanners();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete banner');
                    }
                }
            }
        ]);
    };

    const resetForm = () => {
        setEditingBanner(null);
        setTitleFr('');
        setTitleAr('');
        setTitleEn('');
        setSubFr('');
        setSubAr('');
        setSubEn('');
        setImage('');
    };

    const openEdit = (b: any) => {
        setEditingBanner(b);
        setTitleFr(b.title?.fr || (typeof b.title === 'string' ? b.title : ''));
        setTitleAr(b.title?.['ar-tn'] || '');
        setTitleEn(b.title?.en || '');
        setSubFr(b.subtitle?.fr || (typeof b.subtitle === 'string' ? b.subtitle : ''));
        setSubAr(b.subtitle?.['ar-tn'] || '');
        setSubEn(b.subtitle?.en || '');
        setImage(b.imageUrl || '');
        setModalVisible(true);
    };

    const pickImage = async () => {
        const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.5
        });
        if (!r.canceled) setImage(r.assets[0].uri);
    };

    return (
        <View style={[sc.root, { backgroundColor: colors.background }]}>
            <View style={[sc.hdr, { paddingTop: insets.top + 10 }]}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(10,10,18,0.97)' : 'rgba(255,255,255,0.97)' }]} />
                
                <View style={sc.hdrRow}>
                    <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={[sc.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7', /* no border */ }]}>
                        <ChevronLeft size={22} color={colors.foreground} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={[sc.hdrTitle, { color: colors.foreground }]} numberOfLines={1}>{t('banners')}</Text>
                    <TouchableOpacity
                        onPress={() => { resetForm(); setModalVisible(true); }}
                        style={[sc.addBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
                    >
                        <Plus size={20} color={colors.foreground} />
                    </TouchableOpacity>
                </View>
                <View style={[sc.hSep, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]} />
            </View>

            <Animated.FlatList
                data={banners}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                contentContainerStyle={[sc.listContent, { paddingTop: insets.top + 80 }]}
                ListEmptyComponent={<EmptyState message={t('noBannersFound')} />}
                renderItem={({ item }) => (
                    <AdminCard style={sc.bannerCard}>
                        <Image source={{ uri: item.imageUrl }} style={[sc.bannerImg, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]} />
                        <View style={sc.bannerInfo}>
                            <Text style={[sc.bannerTitle, { color: colors.foreground }]} numberOfLines={1}>
                                {getSafeString(item.title)}
                            </Text>
                            <Text style={[sc.bannerSub, { color: colors.textMuted }]} numberOfLines={1}>
                                {getSafeString(item.subtitle)}
                            </Text>
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
                            {editingBanner ? t('editBanner').toUpperCase() : t('newBanner').toUpperCase()}
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
                            <InputLabel text={t('campaignTitle').toUpperCase() + " (FR)"} />
                            <TextInput
                                style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                value={titleFr}
                                onChangeText={setTitleFr}
                                placeholder={t('frenchName')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={sc.inputWrap}>
                            <InputLabel text={t('campaignTitle').toUpperCase() + " (AR)"} />
                            <TextInput
                                style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border, textAlign: 'right' }]}
                                value={titleAr}
                                onChangeText={setTitleAr}
                                placeholder={t('arabicName')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={sc.inputWrap}>
                            <InputLabel text={t('campaignTitle').toUpperCase() + " (EN)"} />
                            <TextInput
                                style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                value={titleEn}
                                onChangeText={setTitleEn}
                                placeholder={t('englishName')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={sc.inputWrap}>
                            <InputLabel text={t('campaignSubtitle').toUpperCase() + " (FR)"} />
                            <TextInput
                                style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                value={subFr}
                                onChangeText={setSubFr}
                                placeholder={t('frenchDesc')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={sc.inputWrap}>
                            <InputLabel text={t('campaignSubtitle').toUpperCase() + " (AR)"} />
                            <TextInput
                                style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border, textAlign: 'right' }]}
                                value={subAr}
                                onChangeText={setSubAr}
                                placeholder={t('arabicDesc')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={sc.inputWrap}>
                            <InputLabel text={t('campaignSubtitle').toUpperCase() + " (EN)"} />
                            <TextInput
                                style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                value={subEn}
                                onChangeText={setSubEn}
                                placeholder={t('englishDesc')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </ScrollView>
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
    listContent: { padding: 20, paddingBottom: 120, paddingTop: 10 },
    bannerCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 16 },
    bannerImg: { width: 110, height: 75, borderRadius: 16 },
    bannerInfo: { flex: 1, marginLeft: 20 },
    bannerTitle: { fontWeight: '900', fontSize: 14, letterSpacing: -0.2 },
    bannerSub: { fontSize: 12, marginTop: 6, opacity: 0.8 },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 8 },

    modalRoot: { flex: 1 },
    modalHeader: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1 },
    modalCloseBtn: { padding: 4 },
    modalTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    modalSaveText: { fontSize: 10, fontWeight: '900', color: '#007AFF' },
    modalContent: { padding: 25 },

    imagePicker: { width: '100%', height: 180, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 25, borderWidth: 1.5, overflow: 'hidden' },
    pickerImg: { width: '100%', height: '100%' },
    pickerPlaceholder: { alignItems: 'center', gap: 10 },
    pickerText: { fontSize: 10, fontWeight: '800' },

    inputWrap: { marginBottom: 20 },
    input: { height: 52, borderRadius: 14, paddingHorizontal: 15, borderWidth: 1, fontSize: 14, fontWeight: '600' }
});
