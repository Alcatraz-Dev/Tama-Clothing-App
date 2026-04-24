import { db } from '@/api/firebase';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { width as SCREEN_WIDTH } from '@/constants/layout';
import { useAppTheme } from '@/context/ThemeContext';
import { uploadToSanity } from '@/utils/sanity';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    limit,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
import {
    Trash2,
    Video,
    X,
    Camera as CameraIcon,
    ChevronLeft,
    Image as ImageIcon,
    Plus,
    MessageCircle
} from 'lucide-react-native';
import { Camera as CameraUI } from '@/components/ui/camera';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    Animated as AnimatedValue
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColor } from '@/hooks/useColor';
import { MediaPicker, MediaAsset } from '@/components/ui/media-picker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MessagesScreen({ user, onBack, onSelectChat, onNavigate, t, tr }: any) {
    const { theme } = useAppTheme();
    const insets = useSafeAreaInsets();

    const getAvatarSource = (data: any) => {
        if (!data) return null;
        return (
            data.avatarUrl ||
            data.photoURL ||
            data.photoUrl ||
            data.photo ||
            data.image ||
            data.profileImage ||
            data.profilePhoto ||
            data.imageUrl ||
            data.userAvatar ||
            data.userPhoto ||
            data.picture
        );
    };

    // BNA Colors
    const colors = {
        background: useColor('background'),
        foreground: useColor('foreground'),
        card: useColor('card'),
        accent: useColor('accent'),
        border: useColor('border'),
        textMuted: useColor('textMuted'),
        cardForeground: useColor('foreground'),
        error: useColor('red'),
        blue: useColor('blue'),
    };

    const [chats, setChats] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usersCache, setUsersCache] = useState<Record<string, any>>({});
    const cacheRef = useRef<Record<string, any>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [reels, setReels] = useState<any[]>([]);
    const [isReelModalVisible, setIsReelModalVisible] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'camera'>('list');

    useEffect(() => {
        cacheRef.current = usersCache;
    }, [usersCache]);

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
                    if (otherId && !cacheRef.current[otherId]) {
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
            const allReels: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Filter out stories older than 24 hours and auto-delete them
            const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
            const validReels: any[] = [];
            
            for (const reel of allReels) {
                const storyAge = reel.createdAt?.toDate ? reel.createdAt.toDate().getTime() : 0;
                if (storyAge < twentyFourHoursAgo) {
                    // Auto-delete expired stories
                    try {
                        await deleteDoc(doc(db, 'global_reels', reel.id));
                    } catch (e) {
                        console.log('Error deleting expired story:', e);
                    }
                } else {
                    validReels.push(reel);
                }
            }

            // Fetch profiles for reels if not in cache
            const missingUids = [...new Set(validReels.filter((r: any) => !usersCache[r.userId]).map((r: any) => r.userId))];
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
            setReels(validReels);
        });

        return () => {
            unsubscribe();
            unsubscribeReels();
        };
    }, [user?.uid]);

    const handleMediaSelection = async (assets: MediaAsset[]) => {
        if (assets.length === 0) return;
        const asset = assets[0];
        setUploading(true);
        try {
            // Upload to Sanity
            const sanityUrl = await uploadToSanity(asset.uri);
            if (!sanityUrl) throw new Error('Upload failed');

            const reelId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const reelData = {
                id: reelId,
                url: sanityUrl,
                type: asset.type,
                text: '',
                createdAt: serverTimestamp(),
                userId: user.uid,
                reactions: {},
                commentsCount: 0,
                totalLikes: 0,
                userName: user.displayName || user.fullName || 'User',
                userPhoto: user.avatarUrl || user.photoURL || '',
            };

            await setDoc(doc(db, 'global_reels', reelId), reelData);

            Alert.alert(
                tr('Succès', 'نجاح', 'Success'),
                tr(
                    asset.type === 'video' ? 'Story publiée avec succès !' : 'Photo publiée avec succès !',
                    asset.type === 'video' ? 'تم نشر القصة بنجاح' : 'تم نشر الصورة بنجاح',
                    asset.type === 'video' ? 'Story published successfully!' : 'Photo published successfully!'
                )
            );
        } catch (error) {
            console.error("Error picking/uploading reel media:", error);
            Alert.alert("Erreur", "Impossible de publier votre story");
        } finally {
            setUploading(false);
        }
    };

    const handleCameraCapture = () => {
        setViewMode('camera');
    };

    const handleCameraResult = async (uri: string, type: 'image' | 'video') => {
        setViewMode('list');
        handleMediaSelection([{
            id: Date.now().toString(),
            uri,
            type: type as any,
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT
        }]);
    };

    const filteredChats = chats.filter(chat => {
        const otherId = chat.participants.find((id: string) => id !== user.uid);
        const data = usersCache[otherId] || chat.participantData?.[otherId] || {};
        const name = (data.name || data.fullName || data.displayName || '').toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Enhanced Header with blur effect */}
            <View style={{
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.background,
                borderBottomWidth: 1,
                borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            }}>
                <Animatable.View 
                    animation="fadeInLeft" 
                    duration={400}
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                >
                    <TouchableOpacity
                        onPress={() => onBack?.()}
                        activeOpacity={0.7}
                        style={{
                            marginRight: 16,
                            padding: 8,
                            borderRadius: 12,
                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
                        }}
                    >
                        <ChevronLeft size={24} color={colors.foreground} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setIsReelModalVisible(true)}
                        activeOpacity={0.7}
                        style={{
                            marginRight: 16,
                            padding: 8,
                            borderRadius: 12,
                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
                        }}
                    >
                        <CameraIcon size={24} color={colors.foreground} />
                    </TouchableOpacity>
                    {/* Removed Camera Icon from Header */}
                    <View>
                        <Text variant="title" style={{ fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
                            Messages
                        </Text>
                        <Text variant="caption" style={{ opacity: 0.6, marginTop: 2, fontSize: 13, color: colors.textMuted }}>
                            {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
                        </Text>
                    </View>
                </Animatable.View>
                {/* Removed Camera Icon from Header */}
                <View style={{ width: 44 }} />
            </View>

            {/* Enhanced Search Bar */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <Animatable.View 
                    animation="fadeInUp" 
                    duration={400}
                    delay={150}
                >
                    <Input
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={tr('Rechercher un contact...', 'بحث عن جهة اتصال...', 'Search a contact...')}
                        icon={Search}
                        variant="filled"
                        containerStyle={{
                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            borderRadius: 16,
                            borderWidth: 0,
                            height: 50
                        }}
                        inputStyle={{ fontSize: 15, color: colors.foreground, fontWeight: '500' }}
                        placeholderTextColor={colors.textMuted}
                    />
                </Animatable.View>
            </View>

            {loading ? (
                <Animatable.View animation="fadeIn" duration={300} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text variant="body" style={{ marginTop: 16, color: colors.textMuted, fontSize: 14 }}>
                        Loading conversations...
                    </Text>
                </Animatable.View>
            ) : error ? (
                <Animatable.View animation="fadeIn" duration={300} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
                    <View style={{
                        width: 80, height: 80,
                        borderRadius: 40,
                        backgroundColor: colors.error + '15',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16
                    }}>
                        <Shield size={40} color={colors.error} strokeWidth={1.5} />
                    </View>
                    <Text variant="title" style={{ color: colors.foreground, marginTop: 8, fontWeight: '700', fontSize: 18 }}>
                        {tr('Erreur', 'خطأ', 'Error')}
                    </Text>
                    <Text variant="body" style={{ color: colors.textMuted, marginTop: 8, textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
                        {error}
                    </Text>
                </Animatable.View>
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
                                <Text variant="subtitle" style={{ color: colors.foreground, marginTop: 10, fontWeight: '600' }}>
                                    {tr('Publication...', 'جاري النشر...', 'Publishing...')}
                                </Text>
                            </View>
                        </View>
                    )}
                    <FlatList
                        data={filteredChats}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListHeaderComponent={() => (
                            <Animatable.View animation="fadeIn" duration={400} style={{ marginBottom: 20 }}>
                            <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
                                >
                                    {/* Your Reel / Create Button */}
                                    <View style={{ alignItems: 'center', marginRight: 20 }}>
                                        <TouchableOpacity
                                            onPress={() => setIsReelModalVisible(true)}
                                        >
                                            <View style={{ position: 'relative' }}>
                                                <Avatar
                                                    source={getAvatarSource(user)}
                                                    size={SCREEN_WIDTH * 0.16}
                                                    fallback={user.displayName?.[0] || 'V'}
                                                    style={{
                                                        borderWidth: 2,
                                                        borderColor: theme === 'dark' ? '#2c2c2e' : '#f2f2f7'
                                                    }}
                                                />
                                                <View style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    right: 0,
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 12,
                                                    backgroundColor: colors.blue,
                                                    borderWidth: 2,
                                                    borderColor: colors.background,
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {/* Removed Camera Icon from Header */}
                                                    <Plus size={14} color="white" />
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                        <Text variant="caption" style={{ textAlign: 'center', marginTop: 8, fontSize: 12, fontWeight: '600', color: colors.foreground }}>
                                            {tr('Votre story', 'قصتك', 'Your story')}
                                        </Text>
                                    </View>

                                    {/* Active Reels */}
                                    {reels.slice(0, 15).map((reel: any) => {
                                        const profile = usersCache[reel.userId] || {};
                                        // Check if story is less than 24 hours old
                                        const storyAge = reel.createdAt?.toDate ? Date.now() - reel.createdAt.toDate().getTime() : 0;
                                        const isLessThan24h = storyAge < 24 * 60 * 60 * 1000;
                                        const progress = Math.min(storyAge / (24 * 60 * 60 * 1000), 1);
                                        
                                        return (
                                            <TouchableOpacity
                                                key={reel.id}
                                                onPress={() => {
                                                    const mappedReels = reels.map(r => {
                                                        const p = usersCache[r.userId] || {};
                                                        return {
                                                            ...r,
                                                            userName: p.displayName || p.fullName || p.name || r.userName || 'User',
                                                            userPhoto: getAvatarSource(p) || r.userPhoto || null
                                                        };
                                                    });
                                                    const mappedInitial = mappedReels.find(r => r.id === reel.id);
                                                    onNavigate?.('ReelsDetail', { initialReel: mappedInitial, allReels: mappedReels });
                                                }}
                                                activeOpacity={0.8}
                                                style={{ alignItems: 'center', marginRight: 20 }}
                                            >
                                                <View style={{ position: 'relative' }}>
                                                    {/* Circular progress ring for stories < 24h old */}
                                                    {isLessThan24h ? (
                                                        <View style={{
                                                            width: 70,
                                                            height: 70,
                                                            borderRadius: 35,
                                                            borderWidth: 3,
                                                            borderColor: '#FF0080',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            backgroundColor: '#000'
                                                        }}>
                                                            <Avatar
                                                                source={getAvatarSource(profile)}
                                                                size={60}
                                                                fallback={profile.displayName?.[0] || 'U'}
                                                            />
                                                        </View>
                                                    ) : (
                                                        <View style={{
                                                            width: 70,
                                                            height: 70,
                                                            borderRadius: 35,
                                                            borderWidth: 3,
                                                            borderColor: '#888',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            backgroundColor: '#000'
                                                        }}>
                                                            <Avatar
                                                                source={getAvatarSource(profile)}
                                                                size={60}
                                                                fallback={profile.displayName?.[0] || 'U'}
                                                            />
                                                        </View>
                                                    )}
                                                </View>
                                                <Text variant="caption" numberOfLines={1} style={{ textAlign: 'center', marginTop: 8, fontSize: 12, fontWeight: '500', width: 70 }}>
                                                    {profile.displayName || profile.fullName || 'User'}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>

                                <View style={{
                                    height: 1,
                                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    marginHorizontal: 20,
                                    marginTop: 4
                                }} />
                            </Animatable.View>
                        )}
                        renderItem={({ item, index }) => {
                            const otherId = item.participants.find((id: string) => id !== user.uid);
                            const cachedUser = usersCache[otherId] || {};
                            const fallbackData = item.participantData?.[otherId] || { name: 'User' };
                            const otherData = { ...fallbackData, ...cachedUser };
                            const unread = item[`unreadCount_${user.uid}`] || 0;

                            return (
                                <Animatable.View 
                                    animation="fadeInRight" 
                                    duration={300} 
                                    delay={index * 50}
                                >
                                <TouchableOpacity
                                    onPress={() => onSelectChat(item, otherId)}
                                    activeOpacity={0.7}
                                    style={{
                                        flexDirection: 'row',
                                        paddingHorizontal: 20,
                                        paddingVertical: 14,
                                        alignItems: 'center',
                                        backgroundColor: unread > 0 ? (theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') : 'transparent',
                                        borderBottomWidth: 1,
                                        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                                    }}
                                >
                                    <View style={{ position: 'relative' }}>
                                        <Avatar
                                            source={getAvatarSource(otherData)}
                                            size={60}
                                            fallback={(otherData.displayName || otherData.fullName || otherData.name || 'A').charAt(0).toUpperCase()}
                                        />
                                        <View style={{
                                            position: 'absolute',
                                            bottom: 2,
                                            right: 2,
                                            width: 14,
                                            height: 14,
                                            borderRadius: 7,
                                            backgroundColor: '#31A24C',
                                            borderWidth: 2,
                                            borderColor: colors.background
                                        }} />
                                    </View>

                                    <View style={{ flex: 1, marginLeft: 16 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text variant="subtitle" style={{
                                                fontWeight: unread > 0 ? '700' : '600',
                                                fontSize: 17,
                                                color: colors.foreground
                                            }}>
                                                {otherData.name || otherData.fullName || otherData.displayName}
                                            </Text>
                                            <Text variant="caption" style={{ color: unread > 0 ? colors.accent : colors.textMuted, fontSize: 12, fontWeight: unread > 0 ? '600' : '400' }}>
                                                {item.lastMessageTime?.toDate ? item.lastMessageTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <Text variant="body" numberOfLines={1} style={{
                                                color: unread > 0 ? colors.foreground : colors.textMuted,
                                                fontSize: 14,
                                                flex: 1,
                                                fontWeight: unread > 0 ? '600' : '400',
                                                opacity: unread > 0 ? 1 : 0.8
                                            }}>
                                                {item.lastMessage}
                                            </Text>
                                            {unread > 0 && (
                                                <View style={{
                                                    backgroundColor: colors.blue,
                                                    borderRadius: 10,
                                                    minWidth: 20,
                                                    height: 20,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    paddingHorizontal: 6,
                                                    marginLeft: 8
                                                }}>
                                                    <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>{unread}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                                </Animatable.View>
                            );
                        }}
                        ListEmptyComponent={() => !loading && (
                            <Animatable.View animation="fadeIn" duration={400} style={{ alignItems: 'center', marginTop: 100 }}>
                                <View style={{
                                    width: 100, height: 100,
                                    borderRadius: 50,
                                    backgroundColor: colors.accent + '15',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 20
                                }}>
                                    <MessageCircle size={50} color={colors.accent} strokeWidth={1.5} />
                                </View>
                                <Text variant="title" style={{ color: colors.textMuted, fontSize: 16, fontWeight: '600' }}>
                                    {searchQuery ? tr('Aucun résultat trouvé', 'لم يتم العثور على نتائج', 'No results found') : tr('Aucun message pour le moment', 'لا توجد رسائل بعد', 'No messages yet')}
                                </Text>
                                <Text variant="body" style={{ color: colors.textMuted, marginTop: 8, fontSize: 14, opacity: 0.7 }}>
                                    {searchQuery ? '' : tr('Commencez une conversation avec vos amis', 'ابدأ محادثة مع أصدقائك', 'Start a conversation with your friends')}
                                </Text>
                            </Animatable.View>
                        )}
                    />
                </>
            )}

            {/* Media Choice Overlay */}
            {isReelModalVisible && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 2000,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    justifyContent: 'flex-end'
                }}>
                    <TouchableOpacity 
                        style={{ flex: 1 }} 
                        onPress={() => setIsReelModalVisible(false)} 
                        activeOpacity={1}
                    >
                        <View style={{ flex: 1 }} />
                    </TouchableOpacity>
                    <Animatable.View 
                        animation="slideInUp"
                        duration={300}
                        style={{
                            backgroundColor: colors.background,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            paddingBottom: insets.bottom + 20,
                            paddingHorizontal: 20,
                        }}
                    >
                        <View style={{
                            width: 40,
                            height: 4,
                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            borderRadius: 2,
                            alignSelf: 'center',
                            marginTop: 12,
                            marginBottom: 20,
                        }} />
                        
                        <View style={{ gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsReelModalVisible(false);
                                    handleCameraCapture();
                                }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                    padding: 16,
                                    borderRadius: 16,
                                }}
                            >
                                <View style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: colors.blue,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 15,
                                }}>
                                    <CameraIcon size={22} color="white" />
                                </View>
                                <View>
                                    <Text variant="subtitle" style={{ fontWeight: '600' }}>
                                        {tr('Appareil photo', 'الكاميرا', 'Camera')}
                                    </Text>
                                    <Text variant="caption" style={{ color: colors.textMuted, marginTop: 1 }}>
                                        {tr('Prendre une photo ou vidéo', 'التقاط صورة أو فيديو', 'Take a photo or video')}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <MediaPicker
                                mediaType="image"
                                onSelectionChange={(assets) => {
                                    if (assets.length > 0) {
                                        setIsReelModalVisible(false);
                                        handleMediaSelection(assets);
                                    }
                                }}
                            >
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                    padding: 16,
                                    borderRadius: 16,
                                }}>
                                    <View style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 22,
                                        backgroundColor: '#A855F7',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 15,
                                    }}>
                                        <ImageIcon size={22} color="white" />
                                    </View>
                                    <View>
                                        <Text variant="subtitle" style={{ fontWeight: '600' }}>
                                            {tr('Images', 'صور', 'Images')}
                                        </Text>
                                        <Text variant="caption" style={{ color: colors.textMuted, marginTop: 1 }}>
                                            {tr('Choisir depuis la galerie', 'اختر من المعرض', 'Choose from gallery')}
                                        </Text>
                                    </View>
                                </View>
                            </MediaPicker>

                            <MediaPicker
                                mediaType="video"
                                onSelectionChange={(assets) => {
                                    if (assets.length > 0) {
                                        setIsReelModalVisible(false);
                                        handleMediaSelection(assets);
                                    }
                                }}
                            >
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                    padding: 16,
                                    borderRadius: 16,
                                }}>
                                    <View style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 22,
                                        backgroundColor: '#FF2D55',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 15,
                                    }}>
                                        <Video size={22} color="white" />
                                    </View>
                                    <View>
                                        <Text variant="subtitle" style={{ fontWeight: '600' }}>
                                            {tr('Vidéo', 'فيديو', 'Video')}
                                        </Text>
                                        <Text variant="caption" style={{ color: colors.textMuted, marginTop: 1 }}>
                                            {tr('Choisir une vidéo', 'اختر فيديو', 'Choose a video')}
                                        </Text>
                                    </View>
                                </View>
                            </MediaPicker>

                            <TouchableOpacity
                                onPress={() => {
                                    setIsReelModalVisible(false);
                                    onNavigate?.('StoryCreate');
                                }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: colors.accent + '15',
                                    padding: 16,
                                    borderRadius: 16,
                                    marginTop: 4,
                                }}
                            >
                                <View style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: colors.accent,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 15,
                                }}>
                                    <Plus size={22} color="white" />
                                </View>
                                <View>
                                    <Text variant="subtitle" style={{ fontWeight: '600', color: colors.accent }}>
                                        {tr('Éditeur de Story', 'محرر القصة', 'Story Editor')}
                                    </Text>
                                    <Text variant="caption" style={{ color: colors.textMuted, marginTop: 1 }}>
                                        {tr('Ajouter du texte, musique...', 'أضف نصاً ، موسيقى...', 'Add text, music...')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </Animatable.View>
                </View>
            )}

            {/* Camera Overlay */}
            {viewMode === 'camera' && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 3000,
                    backgroundColor: 'black'
                }}>
                    <CameraUI
                        onClose={() => setViewMode('list')}
                        onCapture={({ uri }) => handleCameraResult(uri, 'image')}
                        onVideoCapture={({ uri }) => handleCameraResult(uri, 'video')}
                        onGalleryPress={() => {
                            setViewMode('list');
                            setIsReelModalVisible(true);
                        }}
                    />
                </View>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    storyProgressContainer: {
        position: 'absolute',
        top: -4,
        left: 0,
        right: 0,
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    storyProgressBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
    },
    storyProgressFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        borderRadius: 2,
    }
});


