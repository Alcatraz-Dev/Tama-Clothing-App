import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    Modal,
    Switch,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    SafeAreaView
} from 'react-native';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../api/firebase';
import { ChevronLeft, Plus, Trash2, Edit, X, Save, CheckCircle, Search, Settings, ImageIcon, Camera, Globe, Instagram, Facebook, Twitter, Linkedin, Upload, Twitter as TwitterIcon, Music } from 'lucide-react-native';
import { Theme } from '../theme';
import { AdminHeader } from '../components/admin/AdminUI';
import * as ImagePicker from 'expo-image-picker';

const CLOUDINARY_CLOUD_NAME = 'ddjzpo6p2';
const CLOUDINARY_UPLOAD_PRESET = 'tama_clothing';

interface Collaboration {
    id: string;
    name: string;
    type: 'Brand' | 'Person' | 'Company';
    description: string | { fr: string; ar: string; en: string };
    imageUrl: string;
    coverImageUrl?: string;
    websiteUrl?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    twitterUrl?: string;
    linkedinUrl?: string;
    tiktokUrl?: string;
    brandId?: string;
    isActive: boolean;
    worksCount?: number;
}

interface AdminCollaborationScreenProps {
    onBack: () => void;
    language?: string;
    t: (key: string) => string;
    theme: 'light' | 'dark';
}

export default function AdminCollaborationScreen({ onBack, t, theme }: AdminCollaborationScreenProps) {
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<Collaboration | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState<'Brand' | 'Person' | 'Company'>('Brand');
    const [descriptionFr, setDescriptionFr] = useState('');
    const [descriptionAr, setDescriptionAr] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [coverImageUrl, setCoverImageUrl] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [facebookUrl, setFacebookUrl] = useState('');
    const [twitterUrl, setTwitterUrl] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [tiktokUrl, setTiktokUrl] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [worksCount, setWorksCount] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [brandId, setBrandId] = useState('');
    const [brands, setBrands] = useState<any[]>([]);

    const colors = theme === 'dark' ? Theme.dark.colors : Theme.light.colors;

    const getName = (field: any, fallback = '') => {
        if (!field) return fallback;
        if (typeof field === 'string') return field;
        return field['fr'] || field['en'] || field['ar'] || fallback;
    };

    useEffect(() => {
        fetchCollaborations();
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            const snap = await getDocs(collection(db, 'brands'));
            setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err) }
    };

    const fetchCollaborations = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'collaborations'));
            const querySnapshot = await getDocs(q);
            const data: Collaboration[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Collaboration);
            });
            setCollaborations(data);
        } catch (error) {
            console.error('Error fetching collaborations:', error);
            Alert.alert('Error', 'Failed to fetch collaborations');
        } finally {
            setLoading(false);
        }
    };

    const uploadImageToCloudinary = async (uri: string) => {
        if (!uri || uri.startsWith('http')) return uri;

        try {
            const formData = new FormData();
            // @ts-ignore
            formData.append('file', {
                uri: uri,
                type: 'image/jpeg',
                name: 'upload.jpg',
            });
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            const data = await response.json();
            if (data.secure_url) {
                return data.secure_url;
            }
            throw new Error(data.error?.message || 'Cloudinary upload failed');
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw error;
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUrl(result.assets[0].uri);
        }
    };

    const handlePickCoverImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setCoverImageUrl(result.assets[0].uri);
        }
    };

    const handleEdit = (item: Collaboration) => {
        setEditingItem(item);
        setName(item.name);
        setType(item.type);
        if (typeof item.description === 'object') {
            setDescriptionFr(item.description.fr || '');
            setDescriptionAr(item.description.ar || '');
        } else {
            setDescriptionFr(item.description || '');
            setDescriptionAr('');
        }
        setImageUrl(item.imageUrl);
        setCoverImageUrl(item.coverImageUrl || '');
        setWebsiteUrl(item.websiteUrl || '');
        setInstagramUrl(item.instagramUrl || '');
        setFacebookUrl(item.facebookUrl || '');
        setTwitterUrl(item.twitterUrl || '');
        setLinkedinUrl(item.linkedinUrl || '');
        setTiktokUrl(item.tiktokUrl || '');
        setIsActive(item.isActive);
        setBrandId(item.brandId || '');
        setWorksCount(item.worksCount ? item.worksCount.toString() : '');
        setModalVisible(true);
    };

    const handleDelete = (item: Collaboration) => {
        Alert.alert(
            'Delete Collaboration',
            `Are you sure you want to delete "${item.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'collaborations', item.id));
                            fetchCollaborations();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete item');
                        }
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        if (!name || !imageUrl || (!descriptionFr && !descriptionAr)) {
            Alert.alert('Error', 'Name, Image, and Description are required.');
            return;
        }

        setSubmitting(true);
        setUploading(true);
        try {
            const uploadedImageUrl = await uploadImageToCloudinary(imageUrl);
            const uploadedCoverImageUrl = coverImageUrl ? await uploadImageToCloudinary(coverImageUrl) : null;

            const data = {
                name,
                type,
                description: {
                    fr: descriptionFr,
                    ar: descriptionAr,
                    en: descriptionFr, // Default en to fr if not provided
                },
                imageUrl: uploadedImageUrl,
                coverImageUrl: uploadedCoverImageUrl,
                websiteUrl,
                instagramUrl,
                facebookUrl,
                twitterUrl,
                linkedinUrl,
                tiktokUrl,
                brandId: brandId || null,
                isActive,
                worksCount: worksCount ? parseInt(worksCount) : 0,
                updatedAt: serverTimestamp(),
            };

            if (editingItem) {
                await updateDoc(doc(db, 'collaborations', editingItem.id), data);
            } else {
                await addDoc(collection(db, 'collaborations'), {
                    ...data,
                    createdAt: serverTimestamp(),
                });
            }
            setModalVisible(false);
            resetForm();
            fetchCollaborations();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save collaboration');
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
    };

    const resetForm = () => {
        setEditingItem(null);
        setName('');
        setType('Brand');
        setDescriptionFr('');
        setDescriptionAr('');
        setImageUrl('');
        setCoverImageUrl('');
        setWebsiteUrl('');
        setInstagramUrl('');
        setFacebookUrl('');
        setTwitterUrl('');
        setLinkedinUrl('');
        setTiktokUrl('');
        setIsActive(true);
        setBrandId('');
        setWorksCount('');
    };

    const filteredItems = collaborations.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: Collaboration }) => (
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border }]}>
            <Image source={{ uri: item.imageUrl }} style={[styles.image, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]} />
            <View style={styles.info}>
                <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                    <View style={[styles.badge, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}>
                        <Text style={[styles.badgeText, { color: colors.textMuted }]}>{item.type.toUpperCase()}</Text>
                    </View>
                    {item.isActive ? (
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#34C759' }}>ACTIVE</Text>
                    ) : (
                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>INACTIVE</Text>
                    )}
                </View>
                <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>{getName(item.description)}</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                    <Settings size={20} color={colors.foreground} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                    <Trash2 size={20} color={colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <AdminHeader
                title={t('collaborations')}
                onBack={onBack}
                rightElement={
                    <TouchableOpacity
                        onPress={() => { resetForm(); setModalVisible(true); }}
                        style={[styles.roundBtn, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}
                    >
                        <Plus size={20} color={colors.foreground} />
                    </TouchableOpacity>
                }
            />

            {/* Search */}
            <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                <View style={[styles.searchContainer, { backgroundColor: theme === 'dark' ? '#121218' : '#F2F2F7', borderColor: colors.border }]}>
                    <Search size={18} color={colors.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.foreground }]}
                        placeholder="Search collaborations..."
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content */}
            {loading ? (
                <ActivityIndicator size="large" color={colors.foreground} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: colors.textMuted }}>No collaborations found.</Text>
                        </View>
                    }
                />
            )}

            {/* Modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0A0A0F' : '#FAFAFA' }}>
                    <View style={[styles.modalHeader, { backgroundColor: theme === 'dark' ? '#000' : 'white', borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ zIndex: 10 }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>CANCEL</Text>
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: colors.foreground }]}>{editingItem ? 'EDIT COLLAB' : 'NEW COLLAB'}</Text>
                        <TouchableOpacity onPress={handleSave} disabled={submitting} style={{ zIndex: 10 }}>
                            {submitting ? <ActivityIndicator size="small" color={colors.foreground} /> : <Text style={{ fontSize: 11, fontWeight: '900', color: colors.foreground }}>SAVE</Text>}
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={styles.form}>

                            <Text style={[styles.label, { color: colors.foreground }]}>PROFILE IMAGE</Text>
                            <TouchableOpacity
                                onPress={handlePickImage}
                                style={[
                                    styles.imageUploadBox,
                                    {
                                        backgroundColor: theme === 'dark' ? '#171720' : '#F9F9FB',
                                        borderColor: colors.border
                                    }
                                ]}
                            >
                                {imageUrl ? (
                                    <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} />
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        <Camera size={24} color={colors.textMuted} />
                                        <Text style={{ marginTop: 8, fontSize: 10, fontWeight: '800', color: colors.textMuted }}>UPLOAD IMAGE</Text>
                                    </View>
                                )}
                                {/* Overlay for re-editing */}
                                {imageUrl && (
                                    <View style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20 }}>
                                        <Edit size={14} color="#FFF" />
                                    </View>
                                )}
                            </TouchableOpacity>


                            <Text style={[styles.label, { color: colors.foreground }]}>COVER IMAGE (16:9)</Text>
                            <TouchableOpacity
                                onPress={handlePickCoverImage}
                                style={[
                                    styles.imageUploadBox,
                                    {
                                        backgroundColor: theme === 'dark' ? '#171720' : '#F9F9FB',
                                        borderColor: colors.border,
                                        width: '100%',
                                        height: 180,
                                    }
                                ]}
                            >
                                {coverImageUrl ? (
                                    <Image source={{ uri: coverImageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        <Camera size={24} color={colors.textMuted} />
                                        <Text style={{ marginTop: 8, fontSize: 10, fontWeight: '800', color: colors.textMuted }}>UPLOAD COVER IMAGE</Text>
                                    </View>
                                )}
                                {coverImageUrl && (
                                    <View style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20 }}>
                                        <Edit size={14} color="#FFF" />
                                    </View>
                                )}
                            </TouchableOpacity>

                            <Text style={[styles.label, { color: colors.foreground }]}>PARTNER NAME</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Nike, Travis Scott"
                                placeholderTextColor="#666"
                            />

                            <Text style={[styles.label, { color: colors.foreground }]}>TYPE</Text>
                            <View style={styles.typeRow}>
                                {['Brand', 'Person', 'Company'].map((t) => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[
                                            styles.typeButton,
                                            {
                                                backgroundColor: type === t ? colors.foreground : (theme === 'dark' ? '#171720' : 'white'),
                                                borderColor: type === t ? colors.foreground : colors.border
                                            }
                                        ]}
                                        onPress={() => setType(t as any)}
                                    >
                                        <Text style={[styles.typeText, { color: type === t ? (theme === 'dark' ? '#000' : '#FFF') : colors.foreground }]}>{t.toUpperCase()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.label, { color: colors.foreground }]}>DESCRIPTION (FR)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                value={descriptionFr}
                                onChangeText={setDescriptionFr}
                                placeholder="Description en français..."
                                placeholderTextColor="#666"
                                multiline
                            />

                            <Text style={[styles.label, { color: colors.foreground }]}>DESCRIPTION (AR)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: colors.foreground, borderColor: colors.border, textAlign: 'right' }]}
                                value={descriptionAr}
                                onChangeText={setDescriptionAr}
                                placeholder="الوصف بالعربية..."
                                placeholderTextColor="#666"
                                multiline
                            />

                            <Text style={[styles.label, { color: colors.foreground }]}>LINK TO SHOP BRAND (OPTIONAL)</Text>
                            <View style={[styles.brandSelectorScroll, { marginBottom: 20 }]}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                                    <TouchableOpacity
                                        style={[
                                            styles.brandOption,
                                            { backgroundColor: brandId === '' ? colors.foreground : (theme === 'dark' ? '#171720' : 'white'), borderColor: colors.border }
                                        ]}
                                        onPress={() => setBrandId('')}
                                    >
                                        <Text style={{ color: brandId === '' ? (theme === 'dark' ? '#000' : '#FFF') : colors.foreground, fontSize: 10, fontWeight: '800' }}>NONE</Text>
                                    </TouchableOpacity>
                                    {brands.map((b) => (
                                        <TouchableOpacity
                                            key={b.id}
                                            style={[
                                                styles.brandOption,
                                                { backgroundColor: brandId === b.id ? colors.foreground : (theme === 'dark' ? '#171720' : 'white'), borderColor: colors.border }
                                            ]}
                                            onPress={() => setBrandId(b.id)}
                                        >
                                            <Text style={{ color: brandId === b.id ? (theme === 'dark' ? '#000' : '#FFF') : colors.foreground, fontSize: 10, fontWeight: '800' }}>{b.name.fr.toUpperCase()}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <Text style={[styles.label, { color: colors.foreground }]}>WORKS COUNT (MANUAL)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: colors.foreground, borderColor: colors.border }]}
                                value={worksCount}
                                onChangeText={setWorksCount}
                                placeholder="Number of works/campaigns (e.g. 12)"
                                placeholderTextColor="#666"
                                keyboardType="numeric"
                            />

                            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>SOCIAL & LINKS</Text>

                            <View style={[styles.socialRow, { borderColor: colors.border }]}>
                                <View style={[styles.inputIconBox, { backgroundColor: theme === 'dark' ? '#171720' : '#E5E5EA' }]}>
                                    <Globe size={18} color={colors.textMuted} />
                                </View>
                                <TextInput
                                    style={[styles.socialInput, { color: colors.foreground }]}
                                    value={websiteUrl}
                                    onChangeText={setWebsiteUrl}
                                    placeholder="Website URL"
                                    placeholderTextColor={colors.textMuted}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={[styles.socialRow, { borderColor: colors.border }]}>
                                <View style={[styles.inputIconBox, { backgroundColor: theme === 'dark' ? '#171720' : '#E5E5EA' }]}>
                                    <Instagram size={18} color={colors.textMuted} />
                                </View>
                                <TextInput
                                    style={[styles.socialInput, { color: colors.foreground }]}
                                    value={instagramUrl}
                                    onChangeText={setInstagramUrl}
                                    placeholder="Instagram URL"
                                    placeholderTextColor={colors.textMuted}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={[styles.socialRow, { borderColor: colors.border }]}>
                                <View style={[styles.inputIconBox, { backgroundColor: theme === 'dark' ? '#171720' : '#E5E5EA' }]}>
                                    <Facebook size={18} color={colors.textMuted} />
                                </View>
                                <TextInput
                                    style={[styles.socialInput, { color: colors.foreground }]}
                                    value={facebookUrl}
                                    onChangeText={setFacebookUrl}
                                    placeholder="Facebook URL"
                                    placeholderTextColor={colors.textMuted}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={[styles.socialRow, { borderColor: colors.border }]}>
                                <View style={[styles.inputIconBox, { backgroundColor: theme === 'dark' ? '#171720' : '#E5E5EA' }]}>
                                    <TwitterIcon size={18} color={colors.textMuted} />
                                </View>
                                <TextInput
                                    style={[styles.socialInput, { color: colors.foreground }]}
                                    value={twitterUrl}
                                    onChangeText={setTwitterUrl}
                                    placeholder="Twitter/X URL"
                                    placeholderTextColor={colors.textMuted}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={[styles.socialRow, { borderColor: colors.border }]}>
                                <View style={[styles.inputIconBox, { backgroundColor: theme === 'dark' ? '#171720' : '#E5E5EA' }]}>
                                    <Linkedin size={18} color={colors.textMuted} />
                                </View>
                                <TextInput
                                    style={[styles.socialInput, { color: colors.foreground }]}
                                    value={linkedinUrl}
                                    onChangeText={setLinkedinUrl}
                                    placeholder="LinkedIn URL"
                                    placeholderTextColor={colors.textMuted}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={[styles.socialRow, { borderColor: colors.border }]}>
                                <View style={[styles.inputIconBox, { backgroundColor: theme === 'dark' ? '#171720' : '#E5E5EA' }]}>
                                    <Music size={18} color={colors.textMuted} />
                                </View>
                                <TextInput
                                    style={[styles.socialInput, { color: colors.foreground }]}
                                    value={tiktokUrl}
                                    onChangeText={setTiktokUrl}
                                    placeholder="TikTok URL"
                                    placeholderTextColor={colors.textMuted}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={[styles.switchRow, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border }]}>
                                <View>
                                    <Text style={[styles.switchTitle, { color: colors.foreground }]}>Active Status</Text>
                                    <Text style={[styles.switchSub, { color: colors.textMuted }]}>Visible in the app</Text>
                                </View>
                                <Switch
                                    value={isActive}
                                    onValueChange={setIsActive}
                                    trackColor={{ false: '#767577', true: '#34C759' }}
                                    thumbColor={'#FFF'}
                                />
                            </View>

                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 2,
    },
    roundBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 45,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        padding: 20,
        paddingTop: 0,
    },
    card: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 12,
    },
    info: {
        flex: 1,
        marginLeft: 12,
        marginRight: 10,
    },
    name: {
        fontSize: 14,
        fontWeight: '800',
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '800',
    },
    desc: {
        fontSize: 11,
        marginTop: 4,
        lineHeight: 16,
    },
    actions: {
        gap: 10,
    },
    actionBtn: {
        padding: 5,
    },
    // Modal
    modalHeader: {
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    form: {
        padding: 25,
        paddingBottom: 100,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 8,
        marginTop: 20,
        letterSpacing: 0.5,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        marginBottom: 15,
        marginTop: 30,
        letterSpacing: 1,
        opacity: 0.5
    },
    input: {
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 5,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 15,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    typeButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 30,
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
    },
    switchTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    switchSub: {
        fontSize: 11,
        marginTop: 2,
    },
    inputIconBox: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    socialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    socialInput: {
        flex: 1,
        height: 44,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '500',
        borderBottomWidth: 1,
        borderColor: 'rgba(150,150,150,0.2)'
    },
    imageUploadBox: {
        width: 120,
        height: 120,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    brandSelectorScroll: {
        marginBottom: 10,
    },
    brandOption: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
