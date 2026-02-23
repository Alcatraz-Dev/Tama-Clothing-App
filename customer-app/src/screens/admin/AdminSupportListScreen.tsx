import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    MessageCircle,
} from 'lucide-react-native';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
} from 'firebase/firestore';
import { BlurView } from 'expo-blur';
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import { AdminHeader } from '../../components/admin/AdminHeader';

export default function AdminSupportListScreen({ onBack, onChatPress, t }: any) {
    const { colors, theme } = useAppTheme();
    const scrollY = useRef(new Animated.Value(0)).current;
    const [chats, setChats] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, orderBy('lastMessageTime', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChats(chatList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const formatTime = (timestamp: any) => {
        if (!timestamp?.toDate) return '';
        const date = timestamp.toDate();
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <SafeAreaView style={[sc.root, { backgroundColor: colors.background }]} edges={["bottom", "left", "right"]}>
            <AdminHeader title={t('support')} onBack={onBack} scrollY={scrollY} />

            <ScrollView contentContainerStyle={sc.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator color={colors.foreground} style={{ marginTop: 50 }} />
                ) : chats.length === 0 ? (
                    <View style={sc.emptyContainer}>
                        <View style={[sc.emptyIconBox, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}>
                            <MessageCircle size={32} color={colors.textMuted} strokeWidth={1.5} />
                        </View>
                        <Text style={[sc.emptyText, { color: colors.textMuted }]}>{t('noActiveConversations') || 'No active conversations'}</Text>
                    </View>
                ) : (
                    chats.map(chat => (
                        <TouchableOpacity
                            key={chat.id}
                            activeOpacity={0.7}
                            style={[sc.chatCard, {
                                backgroundColor: theme === 'dark' ? '#121218' : 'white',
                                borderColor: colors.border
                            }]}
                            onPress={() => onChatPress(chat.chatId, chat.customerName)}
                        >
                            <View style={[sc.avatar, { backgroundColor: colors.foreground + '10' }]}>
                                <Text style={[sc.avatarText, { color: colors.foreground }]}>{getInitials(chat.customerName)}</Text>
                            </View>

                            <View style={sc.chatInfo}>
                                <View style={sc.chatHeader}>
                                    <View style={sc.nameRow}>
                                        <Text numberOfLines={1} style={[sc.customerName, { color: colors.foreground }]}>{chat.customerName}</Text>
                                        <View style={[sc.statusBadge, { backgroundColor: chat.status === 'closed' ? 'rgba(107, 114, 128, 0.1)' : 'rgba(34, 197, 94, 0.15)' }]}>
                                            <Text style={[sc.statusBadgeText, { color: chat.status === 'closed' ? '#9CA3AF' : '#22c55e' }]}>
                                                {(chat.status || 'open').toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[sc.timeText, { color: colors.textMuted }]}>{formatTime(chat.lastMessageTime)}</Text>
                                </View>

                                <Text numberOfLines={1} style={[sc.customerEmail, { color: colors.textMuted }]}>{chat.customerEmail}</Text>

                                <View style={sc.lastMsgRow}>
                                    <Text numberOfLines={1} style={[sc.lastMsg, {
                                        color: chat.unreadCount > 0 ? colors.foreground : colors.textMuted,
                                        fontWeight: chat.unreadCount > 0 ? '700' : '400',
                                    }]}>
                                        {chat.lastMessage}
                                    </Text>

                                    {chat.unreadCount > 0 && (
                                        <View style={[sc.unreadBadge, { backgroundColor: colors.foreground }]}>
                                            <Text style={[sc.unreadText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{chat.unreadCount}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    scrollContent: { padding: 16 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyIconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyText: { fontSize: 14, fontWeight: '600' },
    chatCard: { flexDirection: 'row', padding: 16, borderRadius: 24, marginBottom: 12, borderWidth: 1, alignItems: 'center' },
    avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontWeight: '800', fontSize: 16 },
    chatInfo: { flex: 1, marginLeft: 15 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    customerName: { fontWeight: '800', fontSize: 15, flexShrink: 1 },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    statusBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
    timeText: { fontSize: 10, fontWeight: '500' },
    customerEmail: { fontSize: 11, marginTop: 2 },
    lastMsgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
    lastMsg: { fontSize: 13, flex: 1, marginRight: 10 },
    unreadBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
    unreadText: { fontSize: 9, fontWeight: '900' },
});
