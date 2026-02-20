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
    StyleSheet
} from 'react-native';
import {
    getDoc,
    doc,
    collection,
    query,
    where,
    onSnapshot,
    deleteDoc
} from 'firebase/firestore';
import { MessageCircle, Shield, Trash2, ChevronLeft, Search, Camera, Edit } from 'lucide-react-native';
import { db } from '../api/firebase';
import { useAppTheme } from '../context/ThemeContext';
import { width } from '../constants/layout';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MessagesScreen({ user, onBack, onSelectChat, t, tr }: any) {
    const { colors, theme } = useAppTheme();
    const [chats, setChats] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [usersCache, setUsersCache] = useState<Record<string, any>>({});
    const [searchQuery, setSearchQuery] = useState('');

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
        return () => unsubscribe();
    }, [user?.uid]);

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
                    <TouchableOpacity onPress={onBack} style={{ marginRight: 15 }}>
                        <ChevronLeft size={28} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '800' }}>
                        Chats
                    </Text>
                </View>
                <View />
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
                <FlatList
                    data={filteredChats}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={() => (
                        <View>
                            {/* Stories/Active Friends Bar */}
                            {friends.length > 0 && (
                                <View style={{ paddingLeft: 16, marginBottom: 20 }}>
                                    <FlatList
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        data={friends}
                                        keyExtractor={(item) => item.uid}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                onPress={() => onSelectChat(null, item.uid)}
                                                style={{ alignItems: 'center', marginRight: 16, width: 68 }}
                                            >
                                                <View style={{ position: 'relative' }}>
                                                    <View style={{
                                                        width: 62,
                                                        height: 62,
                                                        borderRadius: 31,
                                                        backgroundColor: colors.accent,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {item.avatarUrl || item.photoURL ? (
                                                            <Image source={{ uri: item.avatarUrl || item.photoURL }} style={{ width: '100%', height: '100%' }} />
                                                        ) : (
                                                            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 22 }}>
                                                                {(item.fullName || item.displayName || 'A')[0].toUpperCase()}
                                                            </Text>
                                                        )}
                                                    </View>
                                                    {/* Active Status Dot */}
                                                    <View style={{
                                                        position: 'absolute',
                                                        bottom: 2,
                                                        right: 2,
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: 8,
                                                        backgroundColor: '#31A24C',
                                                        borderWidth: 2,
                                                        borderColor: colors.background
                                                    }} />
                                                </View>
                                                <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                                                    {(item.fullName || item.displayName || 'User').split(' ')[0]}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    />
                                </View>
                            )}
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
            )}
        </SafeAreaView>
    );
}
