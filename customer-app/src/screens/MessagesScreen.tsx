import { db } from '@/api/firebase';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { width as SCREEN_WIDTH } from '@/constants/layout';
import { useAppTheme } from '@/context/ThemeContext';
import { uploadToBunny } from '@/utils/bunny';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
    Camera,
    ChevronLeft,
    Image as ImageIcon,
    MessageCircle,
    Plus,
    Search,
    Shield,
    Trash2,
    Video,
    X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
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
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColor } from '@/hooks/useColor';
import { MediaPicker, MediaAsset } from '@/components/ui/media-picker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MessagesScreen({ user, onBack, onSelectChat, onNavigate, t, tr }: any) {
    const { theme } = useAppTheme();
    const insets = useSafeAreaInsets();

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

    const handleMediaSelection = async (assets: MediaAsset[]) => {
        if (assets.length === 0) return;
        const asset = assets[0];
        setUploading(true);
        try {
            // Upload to Bunny
            const bunnyUrl = await uploadToBunny(asset.uri);

            const reelId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const reelData = {
                id: reelId,
                url: bunnyUrl,
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

    const filteredChats = chats.filter(chat => {
        const otherId = chat.participants.find((id: string) => id !== user.uid);
        const data = usersCache[otherId] || chat.participantData?.[otherId] || {};
        const name = (data.name || data.fullName || data.displayName || '').toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => onBack?.()}
                        style={{
                            marginRight: 10,
                            padding: 5
                        }}
                    >
                        <ChevronLeft size={28} color={colors.foreground} />
                    </TouchableOpacity>
                    <View>
                        <Text variant="title" style={{ fontSize: 32, fontWeight: '800' }}>Messages</Text>
                        <Text variant="caption" style={{ opacity: 0.5, marginTop: 2 }}>
                            {chats.length} {tr('conversations actives', 'مادثة نشطة', 'active conversations')}
                        </Text>
                    </View>
                </View>
                <MediaPicker
                    gallery={true}
                    mediaType="all"
                    onSelectionChange={handleMediaSelection}
                >
                    <TouchableOpacity
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: theme === 'dark' ? '#2c2c2e' : '#f2f2f7',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onPress={() => onNavigate('Camera')}
                    >
                        <Camera size={22} color={colors.foreground} />
                    </TouchableOpacity>
                </MediaPicker>
            </View>

            {/* Search Bar */}
            <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                <Input
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={tr('Rechercher un contact...', 'بحث عن جهة اتصال...', 'Search a contact...')}
                    icon={Search}
                    variant="filled"
                    containerStyle={{
                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderRadius: 14,
                        borderWidth: 0,
                        height: 48
                    }}
                    inputStyle={{ fontSize: 16, color: colors.foreground }}
                />
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={colors.accent} />
                </View>
            ) : error ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
                    <Shield size={50} color={colors.error} strokeWidth={1.5} />
                    <Text variant="title" style={{ color: colors.foreground, marginTop: 20, fontWeight: '700' }}>
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
                        ListHeaderComponent={() => (
                            <View style={{ marginBottom: 20 }}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
                                >
                                    {/* Your Reel / Create Button */}
                                    <View style={{ alignItems: 'center', marginRight: 20 }}>
                                        <TouchableOpacity
                                            onPress={() => onNavigate?.('StoryCreate')}
                                        >
                                            <View style={{ position: 'relative' }}>
                                                <Avatar
                                                    source={user.avatarUrl || user.photoURL}
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
                                                            userPhoto: p.avatarUrl || p.photoURL || p.photo || r.userPhoto || null
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
                                                                source={profile.avatarUrl || profile.photoURL}
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
                                                                source={profile.avatarUrl || profile.photoURL}
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
                                    activeOpacity={0.7}
                                    style={{
                                        flexDirection: 'row',
                                        paddingHorizontal: 20,
                                        paddingVertical: 12,
                                        alignItems: 'center',
                                    }}
                                >
                                    <View style={{ position: 'relative' }}>
                                        <Avatar
                                            source={otherData.avatarUrl || otherData.photoURL || otherData.photo}
                                            size={60}
                                            fallback={(otherData.displayName || otherData.fullName || otherData.name || 'A')[0]?.toUpperCase()}
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
                            );
                        }}
                        ListEmptyComponent={() => !loading && (
                            <View style={{ alignItems: 'center', marginTop: 100, opacity: 0.5 }}>
                                <MessageCircle size={60} color={colors.textMuted} strokeWidth={1} />
                                <Text variant="title" style={{ color: colors.textMuted, marginTop: 20, fontSize: 16 }}>
                                    {searchQuery ? tr('Aucun résultat trouvé', 'لم يتم العثور على نتائج', 'No results found') : tr('Aucun message pour le moment', 'لا توجد رسائل بعد', 'No messages yet')}
                                </Text>
                            </View>
                        )}
                    />
                </>
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


