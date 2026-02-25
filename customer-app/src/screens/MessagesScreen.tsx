import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    Image,
    TextInput,
    ScrollView,
    StyleSheet,
    Modal,
    Pressable,
    Dimensions
} from 'react-native';
import {
    getDoc,
    doc,
    collection,
    query,
    where,
    onSnapshot,
    limit,
    deleteDoc,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';
import { uploadToBunny } from '../utils/bunny';
import { MessageCircle, Shield, Trash2, ChevronLeft, Search, Camera, Edit, Plus, Video, X, Image as ImageIcon, Send } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { db } from '../api/firebase';
import { useAppTheme } from '../context/ThemeContext';
import { width } from '../constants/layout';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MessagesScreen({ user, onBack, onSelectChat, onNavigate, t, tr }: any) {
    const { colors, theme } = useAppTheme();
    const [chats, setChats] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usersCache, setUsersCache] = useState<Record<string, any>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [reels, setReels] = useState<any[]>([]);
    const [isReelModalVisible, setIsReelModalVisible] = useState(false);

    useEffect(() => {
        if (!user?.uid) return;

        // Fetch Friends List
        const fetchFriends = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const friendIds = userDoc.data().friends || [];
                    if (friendIds.length > 0) {
                        const friendsData: any[] = [];
                        for (const fid of friendIds.slice(0, 10)) {
                            const fDoc = await getDoc(doc(db, 'users', fid));
                            if (fDoc.exists()) {
                                friendsData.push({ uid: fid, ...fDoc.data() });
                            }
                        }
                        setFriends(friendsData);
                    }
                }
            } catch (e) {
                console.error("Error fetching friends:", e);
            }
        };

        fetchFriends();

        const q = query(
            collection(db, 'direct_chats'),
            where('participants', 'array-contains', user.uid)
        );
        const unsubscribe = onSnapshot(q,
            async (snapshot) => {
                const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const newCache: Record<string, any> = {};
                const missingUserIds = new Set<string>();

                msgs.forEach((chat: any) => {
                    const otherId = chat.participants.find((id: string) => id !== user.uid);
                    if (otherId && !chat.participantData?.[otherId] && !usersCache[otherId]) {
                        missingUserIds.add(otherId);
                    }
                });

                if (missingUserIds.size > 0) {
                    await Promise.all(Array.from(missingUserIds).map(async (uid) => {
                        try {
                            const uDoc = await getDoc(doc(db, 'users', uid));
                            if (uDoc.exists()) {
                                newCache[uid] = uDoc.data();
                            }
                        } catch (e) { console.error('Error fetching user for chat', uid, e) }
                    }));
                    setUsersCache(prev => ({ ...prev, ...newCache }));
                }

                const sorted = msgs.sort((a: any, b: any) => {
                    const timeA = a.lastMessageTime?.toMillis?.() || a.lastMessageTime || 0;
                    const timeB = b.lastMessageTime?.toMillis?.() || b.lastMessageTime || 0;
                    return timeB - timeA;
                });
                setChats(sorted);
                setLoading(false);
                setError(null);
            },
            (error) => {
                console.error("MessagesScreen Firestore Error:", error);
                setError(error.message);
                setLoading(false);
            }
        );
        // Fetch Global Reels for the bar
        const reelsQuery = query(collection(db, 'global_reels'), limit(20));
        const unsubscribeReels = onSnapshot(reelsQuery, async (snapshot) => {
            const reelsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Fetch profiles for reels if not in cache
            const missingUids = [...new Set(reelsList.filter((r: any) => !usersCache[r.userId]).map((r: any) => r.userId))];
            if (missingUids.length > 0) {
                const newCache: Record<string, any> = {};
                await Promise.all(missingUids.map(async (uid: any) => {
                    try {
                        const snap = await getDoc(doc(db, 'users', uid));
                        if (snap.exists()) newCache[uid] = snap.data();
                    } catch (e) { }
                }));
                setUsersCache(prev => ({ ...prev, ...newCache }));
            }
            setReels(reelsList);
        });

        return () => {
            unsubscribe();
            unsubscribeReels();
        };
    }, [user?.uid]);

    const handlePickReelMedia = async (type: 'image' | 'video') => {
        setIsReelModalVisible(false);
        try {
            // Request permissions first
            const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!mediaPermission.granted) {
                Alert.alert(
                    tr('Permission Required', 'الإذن مطلوب', 'Permission Required'),
                    tr('Please allow access to your photo library in Settings.', 'الرجاء السماح بالوصول إلى مكتبة الصور في الإعدادات.', 'Please allow access to your photo library in Settings.')
                );
                return;
            }
            
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [9, 16],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                setUploading(true);

                // Upload to Bunny
                const bunnyUrl = await uploadToBunny(asset.uri);

                const reelId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const reelData = {
                    id: reelId,
                    url: bunnyUrl,
                    type: type,
                    text: '',
                    createdAt: serverTimestamp(),
                    userId: user.uid,
                    reactions: {},
                    commentsCount: 0,
                    totalLikes: 0,
                    userName: user.displayName || 'User',
                    userPhoto: user.photoURL || '',
                };

                await setDoc(doc(db, 'global_reels', reelId), reelData);

                Alert.alert(
                    tr('Succès', 'نجاح', 'Success'),
                    tr(
                        type === 'video' ? 'Reel publié avec succès !' : 'Photo publiée en tant que Reel !',
                        type === 'video' ? 'تم نشر الريل بنجاح' : 'تم نشر الصورة كـ ريل بنجاح',
                        type === 'video' ? 'Reel published successfully!' : 'Photo published as Reel successfully!'
                    )
                );
            }
        } catch (error) {
            console.error("Error picking/uploading reel media:", error);
            Alert.alert("Erreur", "Impossible de publier votre story");
        } finally {
            setUploading(false);
        }
    };

    const filteredChats = chats.filter(chat => {
        const otherId = chat.participants.find((id: string) => id !== user.uid);
        const data = usersCache[otherId] || chat.participantData?.[otherId] || {};
        const name = (data.name || data.fullName || data.displayName || '').toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Messenger Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                justifyContent: 'space-between'
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Button
                        onPress={onBack}
                        variant="ghost"
                        size="icon"
                        icon={<ChevronLeft size={28} color={colors.foreground} />}
                        style={{ marginRight: 8 }}
                    />
                    <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '800' }}>
                        Chats
                    </Text>
                </View>
                <Button
                    onPress={() => onNavigate?.('Camera')}
                    variant="glass"
                    size="icon"
                    icon={<Camera size={20} color={colors.foreground} />}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F2F2F7',
                    }}
                />
            </View>

            {/* Search Bar */}
            <View style={{ paddingHorizontal: 16, marginBottom: 15 }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme === 'dark' ? '#2c2c2e' : '#f0f0f0',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 38
                }}>
                    <Search size={18} color={colors.textMuted} />
                    <TextInput
                        style={{ flex: 1, marginLeft: 8, color: colors.foreground, fontSize: 16 }}
                        placeholder="Search"
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={colors.accent} />
                </View>
            ) : error ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
                    <Shield size={50} color={colors.error} strokeWidth={1.5} />
                    <Text style={{ color: colors.foreground, marginTop: 20, fontWeight: '700', fontSize: 16 }}>
                        Config Required
                    </Text>
                </View>
            ) : (
                <>
                    {uploading && (
                        <View style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            zIndex: 1000,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <View style={{ backgroundColor: colors.background, padding: 20, borderRadius: 15, alignItems: 'center' }}>
                                <ActivityIndicator color={colors.accent} />
                                <Text style={{ color: colors.foreground, marginTop: 10, fontWeight: '600' }}>
                                    {tr('Publication...', 'جاري النشر...', 'Publishing...')}
                                </Text>
                            </View>
                        </View>
                    )}
                    <FlatList
                        data={filteredChats}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={() => (
                            <View style={{ marginBottom: 5 }}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingLeft: 16, paddingVertical: 10 }}
                                >
                                    {/* Your Reel / Create Button */}
                                    <View style={{ alignItems: 'center', marginRight: 15, width: 72 }}>
                                        <View style={{ position: 'relative', width: 68, height: 68 }}>
                                            <Avatar
                                                source={user.photoURL || user.avatarUrl}
                                                size={68}
                                                onPress={() => setIsReelModalVisible(true)}
                                                borderWidth={1.5}
                                                borderColor={colors.border}
                                            />
                                            <View style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                right: 0,
                                                width: 24,
                                                height: 24,
                                                borderRadius: 12,
                                                backgroundColor: '#0084ff', // standard messenger blue
                                                borderWidth: 3,
                                                borderColor: colors.background,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 3,
                                                elevation: 3
                                            }}>
                                                <Plus size={14} color="#FFF" strokeWidth={3} />
                                            </View>
                                        </View>
                                        <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 11, fontWeight: '700', marginTop: 10, textAlign: 'center', opacity: 1 }}>
                                            {t('yourStory') || 'Your Story'}
                                        </Text>
                                    </View>

                                    {/* Friends / Reels Bar */}
                                    {reels.slice(0, 15).map((reel: any) => {
                                        const profile = usersCache[reel.userId] || {};
                                        return (
                                            <TouchableOpacity
                                                key={reel.id}
                                                onPress={() => onNavigate?.('Feed', { initialTab: 'reels' })}
                                                style={{ alignItems: 'center', marginRight: 15, width: 68 }}
                                            >
                                                <View style={{
                                                    width: 68,
                                                    height: 68,
                                                    borderRadius: 34,
                                                    borderWidth: 2,
                                                    borderColor: colors.accent,
                                                    padding: 2,
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <View style={{
                                                        width: 60,
                                                        height: 60,
                                                        borderRadius: 30,
                                                        backgroundColor: colors.accent,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {profile.avatarUrl || profile.photoURL ? (
                                                            <Image source={{ uri: profile.avatarUrl || profile.photoURL }} style={{ width: '100%', height: '100%' }} />
                                                        ) : (
                                                            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 22 }}>
                                                                {(profile.fullName || profile.displayName || 'A')[0].toUpperCase()}
                                                            </Text>
                                                        )}
                                                    </View>
                                                    <View style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        right: 0,
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: 10,
                                                        backgroundColor: '#000',
                                                        borderWidth: 1,
                                                        borderColor: '#FFF',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <Video size={10} color="#FFF" fill="#FFF" />
                                                    </View>
                                                </View>
                                                <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 11, marginTop: 6, textAlign: 'center' }}>
                                                    {(profile.fullName || profile.displayName || 'User').split(' ')[0]}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}
                        renderItem={({ item }) => {
                            const otherId = item.participants.find((id: string) => id !== user.uid);
                            const cachedUser = usersCache[otherId] || {};
                            const fallbackData = item.participantData?.[otherId] || { name: 'User' };
                            const otherData = { ...fallbackData, ...cachedUser };
                            const unread = item[`unreadCount_${user.uid}`] || 0;

                            return (
                                <TouchableOpacity
                                    onPress={() => onSelectChat(item, otherId)}
                                    style={{
                                        flexDirection: 'row',
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        alignItems: 'center'
                                    }}
                                >
                                    <View style={{ position: 'relative' }}>
                                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {(otherData.photo || otherData.avatarUrl || otherData.photoURL) ? (
                                                <Image source={{ uri: otherData.photo || otherData.avatarUrl || otherData.photoURL }} style={{ width: '100%', height: '100%' }} />
                                            ) : (
                                                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 20 }}>
                                                    {(otherData.name || otherData.fullName || otherData.displayName || 'A')[0]?.toUpperCase()}
                                                </Text>
                                            )}
                                        </View>
                                        {/* Small dot if recently active (mock) */}
                                        <View style={{
                                            position: 'absolute',
                                            bottom: 1,
                                            right: 1,
                                            width: 14,
                                            height: 14,
                                            borderRadius: 7,
                                            backgroundColor: '#31A24C',
                                            borderWidth: 2,
                                            borderColor: colors.background
                                        }} />
                                    </View>

                                    <View style={{ flex: 1, marginLeft: 15 }}>
                                        <Text style={{
                                            color: colors.foreground,
                                            fontWeight: unread > 0 ? '700' : '500',
                                            fontSize: 17
                                        }}>
                                            {otherData.name || otherData.fullName || otherData.displayName}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                            <Text numberOfLines={1} style={{
                                                color: unread > 0 ? colors.foreground : colors.textMuted,
                                                fontSize: 15,
                                                flex: 1,
                                                fontWeight: unread > 0 ? '700' : '400'
                                            }}>
                                                {item.lastMessage}
                                            </Text>
                                            <Text style={{ color: colors.textMuted, fontSize: 13, marginLeft: 8 }}>
                                                • {item.lastMessageTime?.toDate ? item.lastMessageTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                                        {unread > 0 ? (
                                            <View style={{ backgroundColor: '#0084ff', width: 12, height: 12, borderRadius: 6 }} />
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    Alert.alert(
                                                        'Delete Chat',
                                                        'Are you sure you want to delete this conversation?',
                                                        [
                                                            { text: 'Cancel', style: 'cancel' },
                                                            { text: 'Delete', style: 'destructive', onPress: () => deleteDoc(doc(db, 'direct_chats', item.id)) }
                                                        ]
                                                    );
                                                }}
                                                style={{ padding: 8 }}
                                            >
                                                <Trash2 size={18} color={colors.textMuted} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={() => !loading && (
                            <View style={{ alignItems: 'center', marginTop: 100, opacity: 0.5 }}>
                                <MessageCircle size={60} color={colors.textMuted} strokeWidth={1} />
                                <Text style={{ color: colors.textMuted, marginTop: 20, fontSize: 16 }}>
                                    {searchQuery ? 'No results found' : 'No messages yet'}
                                </Text>
                            </View>
                        )}
                    />
                </>
            )}

            {/* Reel Action Choice Modal */}
            <Modal
                visible={isReelModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsReelModalVisible(false)}
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
                    onPress={() => setIsReelModalVisible(false)}
                >
                    <Pressable style={{
                        backgroundColor: theme === 'dark' ? '#1c1c1e' : '#FFF',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        paddingBottom: useSafeAreaInsets().bottom + 20,
                        paddingHorizontal: 20
                    }}>
                        {/* Modal Handle */}
                        <View style={{ width: 40, height: 4, backgroundColor: theme === 'dark' ? '#3a3a3c' : '#E5E5EA', borderRadius: 2, alignSelf: 'center', marginTop: 12 }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 25 }}>
                            <Text style={{ color: colors.foreground, fontSize: 19, fontWeight: '700' }}>
                                {tr('Créer un Reel', 'إنشاء ريل', 'Create a Reel')}
                            </Text>
                            <TouchableOpacity onPress={() => setIsReelModalVisible(false)} style={{ padding: 4 }}>
                                <X size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => { setIsReelModalVisible(false); onNavigate?.('Camera'); }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: theme === 'dark' ? '#2c2c2e' : '#F2F2F7',
                                    padding: 16,
                                    borderRadius: 16
                                }}
                            >
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                                    <Camera size={22} color={colors.accentForeground || "#FFF"} />
                                </View>
                                <View>
                                    <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                                        {tr('Ouvrir la caméra', 'فتح الكاميرا', 'Open Camera')}
                                    </Text>
                                    <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 1 }}>
                                        {tr('Enregistrer maintenant', 'سجل الآن', 'Record now')}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handlePickReelMedia('video')}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: theme === 'dark' ? '#2c2c2e' : '#F2F2F7',
                                    padding: 16,
                                    borderRadius: 16
                                }}
                            >
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#A855F7', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                                    <Video size={22} color="#FFF" />
                                </View>
                                <View>
                                    <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                                        {tr('Importer une vidéo', 'استيراد فيديو', 'Import Video')}
                                    </Text>
                                    <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 1 }}>
                                        {tr('Depuis votre galerie', 'من المعرض الخاص بك', 'From your gallery')}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handlePickReelMedia('image')}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: theme === 'dark' ? '#2c2c2e' : '#F2F2F7',
                                    padding: 16,
                                    borderRadius: 16
                                }}
                            >
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                                    <ImageIcon size={22} color="#FFF" />
                                </View>
                                <View>
                                    <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                                        {tr('Importer une photo', 'استيراد صورة', 'Import Photo')}
                                    </Text>
                                    <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 1 }}>
                                        {tr('Utiliser une image', 'استخدم صورة', 'Use an image')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // (Styles are mostly the same, I can omit or keep them. Since I'm using write_to_file, I must include all or the file will be truncated)
});
