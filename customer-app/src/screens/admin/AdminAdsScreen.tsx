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
    Settings,
    Trash2,
    Camera,
    X,
    Video as VideoIcon,
    Image as ImageIcon,
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
import { Video, ResizeMode } from 'expo-av';
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import { AdminHeader } from '../../components/admin/AdminHeader';
import {
    AdminCard,
    SectionLabel,
    InputLabel,
    EmptyState,
    AdminChip,
} from '../../components/admin/AdminUI';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { getName, translateCategory } from '../../utils/translationHelpers';
import { getSafeString } from '../../utils/helpers';

const { width } = Dimensions.get('window');

export default function AdminAdsScreen({ onBack, t, profileData, language = 'fr' }: any) {
    const { colors, theme } = useAppTheme();
    const isBrandOwner = profileData?.role === 'brand_owner';
    const myBrandId = profileData?.brandId;

    const [ads, setAds] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAd, setEditingAd] = useState<any>(null);
    const [titleFr, setTitleFr] = useState('');
    const [titleAr, setTitleAr] = useState('');
    const [descFr, setDescFr] = useState('');
    const [descAr, setDescAr] = useState('');
    const [type, setType] = useState('image');
    const [url, setUrl] = useState('');
    const [targetType, setTargetType] = useState('none');
    const [targetId, setTargetId] = useState('');
    const [uploading, setUploading] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchAds();
        fetchTargets();
    }, []);

    const fetchAds = async () => {
        try {
            const snap = await getDocs(collection(db, 'ads'));
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAds(isBrandOwner && myBrandId ? all.filter((a: any) => a.brandId === myBrandId) : all);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTargets = async () => {
        try {
            const pSnap = await getDocs(collection(db, 'products'));
            const allProducts = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setProducts(isBrandOwner && myBrandId ? allProducts.filter((p: any) => p.brandId === myBrandId) : allProducts);

            const cSnap = await getDocs(collection(db, 'categories'));
            setCategories(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        if (!titleFr || !url) return Alert.alert(t('error'), t('mediaRequired'));
        setUploading(true);
        try {
            const mediaUrl = url.startsWith('http') ? url : await uploadToCloudinary(url);
            const data: any = {
                title: { fr: titleFr, "ar-tn": titleAr },
                description: { fr: descFr, "ar-tn": descAr },
                type,
                url: mediaUrl,
                targetType,
                targetId,
                updatedAt: serverTimestamp()
            };
            if (isBrandOwner && myBrandId) data.brandId = myBrandId;

            if (editingAd) {
                await updateDoc(doc(db, 'ads', editingAd.id), data);
            } else {
                await addDoc(collection(db, 'ads'), { ...data, createdAt: serverTimestamp() });
            }
            setModalVisible(false);
            fetchAds();
            resetForm();
        } catch (error) {
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
                        await deleteDoc(doc(db, 'ads', id));
                        fetchAds();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete ad');
                    }
                }
            }
        ]);
    };

    const resetForm = () => {
        setEditingAd(null);
        setTitleFr('');
        setTitleAr('');
        setDescFr('');
        setDescAr('');
        setType('image');
        setUrl('');
        setTargetType('none');
        setTargetId('');
    };

    const openEdit = (ad: any) => {
        setEditingAd(ad);
        setTitleFr(ad.title?.fr || (typeof ad.title === 'string' ? ad.title : ''));
        setTitleAr(ad.title?.['ar-tn'] || '');
        setDescFr(ad.description?.fr || '');
        setDescAr(ad.description?.['ar-tn'] || '');
        setType(ad.type || 'image');
        setUrl(ad.url || '');
        setTargetType(ad.targetType || (ad.link ? 'category' : 'none'));
        setTargetId(ad.targetId || ad.link || '');
        setModalVisible(true);
    };

    const pickMedia = async () => {
        const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: type === 'video' ? ['videos'] : ['images'],
            allowsEditing: true,
            quality: 0.5
        });
        if (!r.canceled) setUrl(r.assets[0].uri);
    };

    return (
        <SafeAreaView style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader
                title={t('adsCampaigns').toUpperCase()}
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
                data={ads}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                contentContainerStyle={sc.listContent}
                ListEmptyComponent={<EmptyState message={t('noCampaigns')} />}
                renderItem={({ item }) => (
                    <AdminCard style={sc.adCard}>
                        <View style={[sc.adMediaWrap, { borderColor: colors.border }]}>
                            {item.type === 'video' ? (
                                <Video
                                    source={{ uri: item.url }}
                                    style={sc.adMedia}
                                    isMuted
                                    shouldPlay
                                    isLooping
                                    resizeMode={ResizeMode.COVER}
                                />
                            ) : (
                                <Image source={{ uri: item.url }} style={sc.adMedia} />
                            )}
                            <View style={[sc.typeBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                                {item.type === 'video' ? <VideoIcon size={10} color="#FFF" /> : <ImageIcon size={10} color="#FFF" />}
                                <Text style={sc.typeBadgeText}>{item.type.toUpperCase()}</Text>
                            </View>
                        </View>
                        <View style={sc.adInfo}>
                            <Text style={[sc.adTitle, { color: colors.foreground }]} numberOfLines={2}>
                                {getSafeString(item.title)}
                            </Text>
                            <Text style={[sc.adDesc, { color: colors.textMuted }]} numberOfLines={1}>
                                {getSafeString(item.description)}
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
                            {editingAd ? t('editAd').toUpperCase() : t('newAd').toUpperCase()}
                        </Text>
                        <TouchableOpacity onPress={handleSave} disabled={uploading}>
                            {uploading ? <ActivityIndicator size="small" color={colors.foreground} /> : (
                                <Text style={[sc.modalSaveText, { color: colors.foreground }]}>{t('save').toUpperCase()}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={sc.modalContent}>
                        <View style={sc.typeSelector}>
                            <AdminChip
                                label={t('images').toUpperCase()}
                                selected={type === 'image'}
                                onPress={() => setType('image')}
                                style={{ flex: 1 } as any}
                            />
                            <AdminChip
                                label={t('video').toUpperCase()}
                                selected={type === 'video'}
                                onPress={() => setType('video')}
                                style={{ flex: 1 } as any}
                            />
                        </View>

                        <TouchableOpacity onPress={pickMedia} style={[sc.mediaPicker, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border, borderStyle: url ? 'solid' : 'dashed' }]}>
                            {url ? (
                                type === 'video' ? (
                                    <Video source={{ uri: url }} style={sc.pickerMedia} isMuted shouldPlay resizeMode={ResizeMode.COVER} />
                                ) : (
                                    <Image source={{ uri: url }} style={sc.pickerMedia} />
                                )
                            ) : (
                                <View style={sc.pickerPlaceholder}>
                                    <Camera size={32} color={colors.textMuted} />
                                    <Text style={[sc.pickerText, { color: colors.textMuted }]}>
                                        {t(type === 'image' ? 'uploadImage' : 'uploadVideo').toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={sc.inputWrap}>
                            <InputLabel text={t('campaignTitle').toUpperCase() + " (FR)"} />
                            <TextInput
                                style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                value={titleFr}
                                onChangeText={setTitleFr}
                                placeholder={t('campaignTitle') + ' (FR)'}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={sc.inputWrap}>
                            <InputLabel text={t('campaignTitle').toUpperCase() + " (AR)"} />
                            <TextInput
                                style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border, textAlign: 'right' }]}
                                value={titleAr}
                                onChangeText={setTitleAr}
                                placeholder={t('campaignTitle') + ' (AR)'}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={sc.inputWrap}>
                            <InputLabel text={t('description').toUpperCase() + " (FR)"} />
                            <TextInput
                                style={[sc.input, sc.textArea, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                value={descFr}
                                onChangeText={setDescFr}
                                placeholder={t('description') + '...'}
                                multiline
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={sc.inputWrap}>
                            <InputLabel text={t('description').toUpperCase() + " (AR)"} />
                            <TextInput
                                style={[sc.input, sc.textArea, { backgroundColor: theme === 'dark' ? '#1A1A24' : 'white', color: colors.foreground, borderColor: colors.border, textAlign: 'right' }]}
                                value={descAr}
                                onChangeText={setDescAr}
                                placeholder={t('description') + '...'}
                                multiline
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <SectionLabel text={t('targetAction').toUpperCase()} style={{ marginBottom: 15 }} />
                        <View style={sc.targetSelector}>
                            {['none', 'product', 'category'].map(act => (
                                <AdminChip
                                    key={act}
                                    label={t('target' + act.charAt(0).toUpperCase() + act.slice(1)).toUpperCase()}
                                    selected={targetType === act}
                                    onPress={() => setTargetType(act)}
                                    style={{ flex: 1 } as any}
                                />
                            ))}
                        </View>

                        {targetType === 'product' && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sc.targetList}>
                                {products.map(p => (
                                    <TouchableOpacity
                                        key={p.id}
                                        onPress={() => setTargetId(p.id)}
                                        style={[sc.targetItem, {
                                            backgroundColor: targetId === p.id ? (theme === 'dark' ? '#1A1A24' : '#F0F0F3') : 'transparent',
                                            borderColor: targetId === p.id ? colors.foreground : colors.border
                                        }]}
                                    >
                                        <Image source={{ uri: p.mainImage }} style={sc.targetImg} />
                                        <Text style={[sc.targetName, { color: colors.foreground }]} numberOfLines={1}>
                                            {getName(p.name, language)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {targetType === 'category' && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sc.targetList}>
                                {categories.map(c => (
                                    <TouchableOpacity
                                        key={c.id}
                                        onPress={() => setTargetId(c.id)}
                                        style={[sc.targetCatItem, {
                                            backgroundColor: targetId === c.id ? colors.foreground : (theme === 'dark' ? '#1A1A24' : 'white'),
                                            borderColor: targetId === c.id ? colors.foreground : colors.border
                                        }]}
                                    >
                                        <Text style={[sc.targetCatText, { color: targetId === c.id ? (theme === 'dark' ? '#000' : '#FFF') : colors.foreground }]}>
                                            {translateCategory(getName(c.name, language), language)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
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
    adCard: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    adMediaWrap: { width: 100, height: 75, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
    adMedia: { width: '100%', height: '100%' },
    typeBadge: { position: 'absolute', bottom: 4, right: 4, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    typeBadgeText: { color: 'white', fontSize: 8, fontWeight: '900' },
    adInfo: { flex: 1, marginLeft: 16 },
    adTitle: { fontWeight: '800', fontSize: 13 },
    adDesc: { fontSize: 11, marginTop: 4 },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 8 },

    modalRoot: { flex: 1 },
    modalHeader: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1 },
    modalCloseBtn: { padding: 4 },
    modalTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    modalSaveText: { fontSize: 10, fontWeight: '900', color: '#007AFF' },
    modalContent: { padding: 25 },

    typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    mediaPicker: { width: '100%', height: 200, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 25, borderWidth: 1.5, overflow: 'hidden' },
    pickerMedia: { width: '100%', height: '100%' },
    pickerPlaceholder: { alignItems: 'center', gap: 10 },
    pickerText: { fontSize: 10, fontWeight: '800' },

    inputWrap: { marginBottom: 20 },
    input: { height: 52, borderRadius: 14, paddingHorizontal: 15, borderWidth: 1, fontSize: 14, fontWeight: '600' },
    textArea: { height: 100, paddingVertical: 12, textAlignVertical: 'top' },

    targetSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    targetList: { marginBottom: 25 },
    targetItem: { width: 100, marginRight: 12, padding: 10, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
    targetImg: { width: '100%', aspectRatio: 1, borderRadius: 10, marginBottom: 6 },
    targetName: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
    targetCatItem: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1 },
    targetCatText: { fontSize: 12, fontWeight: '600' }
});
