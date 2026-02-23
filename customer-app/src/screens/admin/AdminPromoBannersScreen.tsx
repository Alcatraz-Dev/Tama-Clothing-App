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

import { ChevronLeft, Plus, Trash2, Settings, X, Image as ImageIcon } from 'lucide-react-native';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import {
    AdminCard,
    InputLabel,
    EmptyState,
    IconActionButton,
    StatusBadge,
    ModernSwitch,
    AdminInput,
    AdminHeader,
} from '../../components/admin/AdminUI';
import { uploadToCloudinary } from '../../utils/cloudinary';

const PRESET_COLORS = ['#FF2D55', '#007AFF', '#34C759', '#5856D6', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA', '#000000', '#8E8E93'];

export default function AdminPromoBannersScreen({ onBack, t, profileData }: any) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';
    const isBrandOwner = profileData?.role === 'brand_owner';
    const myBrandId = profileData?.brandId;

    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: '',
        description: '',
        imageUrl: '',
        backgroundColor: '#FF2D55',
        order: '0',
        isActive: true
    });
    const [saving, setSaving] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'promoBanners'), orderBy('order', 'asc'));
            const snap = await getDocs(q);
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setBanners(isBrandOwner && myBrandId ? all.filter((b: any) => b.brandId === myBrandId) : all);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (banner: any) => {
        setEditingId(banner.id);
        setForm({
            title: banner.title || '',
            description: banner.description || '',
            imageUrl: banner.imageUrl || '',
            backgroundColor: banner.backgroundColor || '#FF2D55',
            order: String(banner.order || 0),
            isActive: banner.isActive ?? true
        });
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingId(null);
        setForm({
            title: '',
            description: '',
            imageUrl: '',
            backgroundColor: '#FF2D55',
            order: String(banners.length),
            isActive: true
        });
        setIsModalOpen(true);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });
        if (!result.canceled) {
            setForm({ ...form, imageUrl: result.assets[0].uri });
        }
    };

    const handleSave = async () => {
        if (!form.imageUrl) return Alert.alert(t('error'), t('imageRequired'));
        setSaving(true);
        try {
            let finalImageUrl = form.imageUrl;
            if (form.imageUrl && !form.imageUrl.startsWith('http')) {
                finalImageUrl = await uploadToCloudinary(form.imageUrl);
            }

            const data: any = {
                ...form,
                imageUrl: finalImageUrl,
                order: parseInt(form.order) || 0,
                updatedAt: serverTimestamp()
            };
            if (isBrandOwner && myBrandId) data.brandId = myBrandId;

            if (editingId) {
                await updateDoc(doc(db, 'promoBanners', editingId), data);
            } else {
                await addDoc(collection(db, 'promoBanners'), { ...data, createdAt: serverTimestamp() });
            }
            setIsModalOpen(false);
            fetchBanners();
        } catch (e) {
            Alert.alert(t('error'), t('failedToSave'));
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (banner: any) => {
        try {
            await updateDoc(doc(db, 'promoBanners', banner.id), { isActive: !banner.isActive });
            fetchBanners();
        } catch (e) {
            console.error(e);
        }
    };

    const deleteBanner = (id: string) => {
        Alert.alert(t('delete'), t('areYouSure'), [
            { text: t('cancel'), style: 'cancel' },
            {
                text: t('delete'),
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'promoBanners', id));
                        fetchBanners();
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        ]);
    };

    return (
        <View style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader
                title={t('promoBanners')}
                onBack={onBack}
                rightElement={
                    <TouchableOpacity
                        onPress={handleAddNew}
                        style={[sc.addBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
                    >
                        <Plus size={20} color={colors.foreground} />
                    </TouchableOpacity>
                }
            />

            <Animated.ScrollView
                contentContainerStyle={[sc.listContent, { paddingTop: insets.top + 80 }]}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.foreground} /> : (
                    banners.length === 0 ? (
                        <EmptyState message={t('noPromoBanners')} icon={<ImageIcon size={48} color={colors.textMuted} />} />
                    ) : (
                        banners.map(banner => (
                            <AdminCard key={banner.id} style={sc.bannerCard}>
                                <View style={sc.bannerPreview}>
                                    <View style={[sc.bannerImgWrap, { backgroundColor: banner.backgroundColor || (theme === 'dark' ? '#17171F' : '#FF2D55') }]}>
                                        {banner.imageUrl && <Image source={{ uri: banner.imageUrl }} style={sc.bannerImg} resizeMode="contain" />}
                                    </View>
                                    <View style={sc.bannerInfo}>
                                        <Text style={[sc.bannerTitle, { color: colors.foreground }]}>{banner.title?.toUpperCase()}</Text>
                                        <Text style={[sc.bannerDesc, { color: colors.textMuted }]}>{banner.description}</Text>
                                        <View style={sc.badgeRow}>
                                            <StatusBadge active={banner.isActive} />
                                        </View>
                                    </View>
                                </View>

                                <View style={sc.bannerActions}>
                                    <View style={sc.statusToggle}>
                                        <ModernSwitch active={banner.isActive} onPress={() => toggleStatus(banner)} />
                                        <Text style={[sc.statusText, { color: banner.isActive ? '#10B981' : colors.textMuted }]}>
                                            {banner.isActive ? t('activeStatus').toUpperCase() : t('inactiveStatus').toUpperCase()}
                                        </Text>
                                    </View>

                                    <View style={sc.actionGroup}>
                                        <IconActionButton onPress={() => handleEdit(banner)}>
                                            <Settings size={18} color={colors.foreground} />
                                        </IconActionButton>
                                        <IconActionButton onPress={() => deleteBanner(banner.id)} variant="danger">
                                            <Trash2 size={18} color={colors.error} />
                                        </IconActionButton>
                                    </View>
                                </View>
                            </AdminCard>
                        ))
                    )
                )}
                <View style={{ height: 100 }} />
            </Animated.ScrollView>

            <Modal visible={isModalOpen} animationType="slide" presentationStyle="pageSheet">
                <View style={[sc.modalRoot, { backgroundColor: theme === 'dark' ? '#0A0A0F' : '#FAFAFA' }]}>
                    <View style={[sc.modalHeader, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => setIsModalOpen(false)} style={sc.modalCloseBtn}>
                            <X size={20} color={colors.foreground} />
                        </TouchableOpacity>
                        <Text style={[sc.modalTitle, { color: colors.foreground }]}>
                            {editingId ? t('editPromotion').toUpperCase() : t('newPromotion').toUpperCase()}
                        </Text>
                        <TouchableOpacity onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator size="small" color={colors.foreground} /> : (
                                <Text style={[sc.modalSaveText, { color: colors.foreground }]}>{t('save').toUpperCase()}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={sc.modalContent}>
                        <InputLabel text={t('bannerImage').toUpperCase()} />
                        <TouchableOpacity
                            onPress={pickImage}
                            style={[sc.imagePicker, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border, borderStyle: form.imageUrl ? 'solid' : 'dashed' }]}
                        >
                            {form.imageUrl ? <Image source={{ uri: form.imageUrl }} style={sc.pickerImg} /> : (
                                <View style={sc.pickerPlaceholder}>
                                    <ImageIcon size={32} color={colors.textMuted} />
                                    <Text style={[sc.pickerText, { color: colors.textMuted }]}>{t('selectImage169').toUpperCase()}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <AdminInput
                            label={t('promotionTitle').toUpperCase()}
                            value={form.title}
                            onChangeText={(t) => setForm({ ...form, title: t })}
                            placeholder={t('summerSalePlaceholder')}
                        />

                        <AdminInput
                            label={t('description Offer').toUpperCase()}
                            value={form.description}
                            onChangeText={(t) => setForm({ ...form, description: t })}
                            placeholder={t('offerPlaceholder')}
                        />

                        <View style={sc.row}>
                            <View style={{ flex: 2 }}>
                                <AdminInput
                                    label={t('bgColor').toUpperCase()}
                                    value={form.backgroundColor}
                                    onChangeText={(t) => setForm({ ...form, backgroundColor: t })}
                                    placeholder="#FF2D55"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AdminInput
                                    label={t('order').toUpperCase()}
                                    value={form.order}
                                    onChangeText={(t) => setForm({ ...form, order: t })}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={sc.presetsContainer}>
                            <Text style={[sc.presetsLabel, { color: colors.textMuted }]}>PRESET THEMES</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sc.presetsScroll}>
                                {PRESET_COLORS.map(color => (
                                    <TouchableOpacity
                                        key={color}
                                        onPress={() => setForm({ ...form, backgroundColor: color })}
                                        style={[sc.presetItem, { backgroundColor: color, borderColor: form.backgroundColor === color ? colors.foreground : 'transparent' }]}
                                    />
                                ))}
                            </ScrollView>
                        </View>

                        <View style={sc.premiumSwitchRow}>
                            <View style={{ flex: 1, marginRight: 15 }}>
                                <Text style={[sc.switchTitle, { color: colors.foreground }]}>{t('activeStatus').toUpperCase()}</Text>
                                <Text style={[sc.switchSub, { color: colors.textMuted }]}>{t('visibleOnApp')}</Text>
                            </View>
                            <ModernSwitch active={form.isActive} onPress={() => setForm({ ...form, isActive: !form.isActive })} />
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
    listContent: { padding: 20, paddingTop: 10 },
    bannerCard: { padding: 22, borderRadius: 24, borderWidth: 1, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
    bannerPreview: { flexDirection: 'row', gap: 18 },
    bannerImgWrap: { width: 120, height: 80, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    bannerImg: { width: '100%', height: '100%' },
    bannerInfo: { flex: 1, justifyContent: 'center' },
    bannerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
    bannerDesc: { fontSize: 13, marginTop: 4, opacity: 0.8 },
    badgeRow: { marginTop: 10 },
    bannerActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 18 },
    statusText: { fontSize: 9, fontWeight: '900', marginLeft: 8 },
    statusToggle: { flexDirection: 'row', alignItems: 'center' },
    actionGroup: { flexDirection: 'row', gap: 8 },

    modalRoot: { flex: 1 },
    modalHeader: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1 },
    modalCloseBtn: { padding: 4 },
    modalTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    modalSaveText: { fontSize: 11, fontWeight: '900', color: '#007AFF' },
    modalContent: { padding: 25 },
    imagePicker: { width: '100%', height: 180, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 25, borderWidth: 1.5, overflow: 'hidden' },
    pickerImg: { width: '100%', height: '100%' },
    pickerPlaceholder: { alignItems: 'center', gap: 10 },
    pickerText: { fontSize: 10, fontWeight: '800' },
    inputWrap: { marginBottom: 20 },
    input: { height: 52, borderRadius: 14, paddingHorizontal: 15, borderWidth: 1, fontSize: 14, fontWeight: '600' },
    row: { flexDirection: 'row', gap: 15 },
    presetsContainer: { marginBottom: 25 },
    presetsLabel: { fontSize: 9, fontWeight: '900', marginBottom: 12 },
    presetsScroll: { gap: 12 },
    presetItem: { width: 36, height: 36, borderRadius: 18, borderWidth: 3 },
    premiumSwitchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    switchTitle: { fontSize: 11, fontWeight: '900' },
    switchSub: { fontSize: 10, marginTop: 2 },
});
