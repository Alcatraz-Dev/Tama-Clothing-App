import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    StyleSheet,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Send,
    Image as ImageIcon,
    User,
    X,
    Video,
    Maximize2,
} from 'lucide-react-native';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    getDoc,
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import UniversalVideoPlayer from "../../components/common/UniversalVideoPlayer";
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import { uploadToBunny } from '../../utils/bunny';
import { sendPushNotification } from '../../utils/notifications';

const { width } = Dimensions.get('window');

export default function AdminSupportChatScreen({ onBack, chatId, customerName, user, t }: any) {
    const { colors, theme } = useAppTheme();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fullScreenMedia, setFullScreenMedia] = useState<any>(null);
    const [chatData, setChatData] = useState<any>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (!chatId) return;

        const chatRef = doc(db, 'chats', chatId);
        const unsubChat = onSnapshot(chatRef, (snapshot) => {
            if (snapshot.exists()) setChatData(snapshot.data());
        });

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            setLoading(false);

            snapshot.docs.forEach(async (mDoc) => {
                const data = mDoc.data();
                if (data.senderRole === 'customer' && !data.read) {
                    try {
                        await updateDoc(doc(db, 'chats', chatId, 'messages', mDoc.id), { read: true });
                    } catch (e) { }
                }
            });

            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        });

        return () => {
            unsubscribe();
            unsubChat();
        };
    }, [chatId]);

    const sendMessage = async () => {
        if (!inputText.trim() || !user?.uid) return;
        const text = inputText.trim();
        setInputText('');
        setSending(true);

        try {
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            await addDoc(messagesRef, {
                text: text,
                senderId: user.uid,
                senderName: 'Support',
                senderRole: 'support',
                timestamp: serverTimestamp(),
                read: false
            });

            const chatDocRef = doc(db, 'chats', chatId);
            await updateDoc(chatDocRef, {
                lastMessage: text,
                lastMessageTime: serverTimestamp(),
                unreadCount: 0,
                status: 'open'
            });

            if (chatData?.customerId) {
                const userDoc = await getDoc(doc(db, 'users', chatData.customerId));
                if (userDoc.exists() && userDoc.data().expoPushToken) {
                    sendPushNotification(
                        userDoc.data().expoPushToken,
                        'New message from Support',
                        text
                    );
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const closeChat = async () => {
        try {
            await updateDoc(doc(db, 'chats', chatId), { status: 'closed' });
        } catch (e) { }
    };

    const pickMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled && result.assets && result.assets[0].uri) {
            handleMediaUpload(result.assets[0].uri);
        }
    };

    const handleMediaUpload = async (uri: string) => {
        setUploading(true);
        try {
            const fileType = uri.split('.').pop()?.toLowerCase();
            const isVideo = ['mp4', 'mov', 'avi', 'mkv'].includes(fileType || '');
            const bunnyUrl = await uploadToBunny(uri);

            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const messageData: any = {
                senderId: user.uid,
                senderName: 'Support',
                senderRole: 'support',
                timestamp: serverTimestamp(),
                read: false
            };

            if (isVideo) messageData.videoUrl = bunnyUrl;
            else messageData.imageUrl = bunnyUrl;

            await addDoc(messagesRef, messageData);

            await updateDoc(doc(db, 'chats', chatId), {
                lastMessage: isVideo ? 'Sent a video 📹' : 'Sent an image 📸',
                lastMessageTime: serverTimestamp(),
                unreadCount: 0,
                status: 'open'
            });

            if (chatData?.customerId) {
                const userDoc = await getDoc(doc(db, 'users', chatData.customerId));
                if (userDoc.exists() && userDoc.data().expoPushToken) {
                    sendPushNotification(
                        userDoc.data().expoPushToken,
                        'New message from Support',
                        isVideo ? 'Support sent a video' : 'Support sent an image'
                    );
                }
            }
        } catch (error) {
            alert('Failed to upload media');
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={[sc.root, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[sc.header, { borderBottomColor: colors.border }]}>
                <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + 'B3' }]} />

                <View style={sc.headerTop}>
                    <TouchableOpacity onPress={onBack} style={[sc.backBtn, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : '#F2F2F7' }]}>
                        <ChevronLeft size={20} color={colors.foreground} />
                    </TouchableOpacity>

                    <View style={sc.customerInfo}>
                        <View style={[sc.avatar, { backgroundColor: colors.foreground + '10' }]}>
                            <User size={18} color={colors.foreground} />
                        </View>
                        <View style={sc.nameCol}>
                            <View style={sc.nameRow}>
                                <Text numberOfLines={1} style={[sc.customerName, { color: colors.foreground }]}>{customerName?.toUpperCase()}</Text>
                                <View style={[sc.statusBadge, { backgroundColor: chatData?.status === 'open' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(107, 114, 128, 0.15)' }]}>
                                    <Text style={[sc.statusBadgeText, { color: chatData?.status === 'open' ? '#22c55e' : '#9CA3AF' }]}>
                                        {(chatData?.status || 'OPEN').toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            <Text numberOfLines={1} style={[sc.customerEmail, { color: colors.textMuted }]}>{chatData?.customerEmail}</Text>
                        </View>
                    </View>

                    {chatData?.status === 'open' && (
                        <TouchableOpacity onPress={closeChat} style={sc.closeBtn}>
                            <Text style={sc.closeText}>CLOSE</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={sc.scrollContent}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.foreground} /> : (
                    messages.map((m, idx) => {
                        const isMe = m.senderRole === 'support';
                        return (
                            <View key={m.id} style={[sc.msgRow, isMe ? sc.msgMe : sc.msgThem]}>
                                <View style={[
                                    sc.msgBubble,
                                    isMe ? [sc.msgBubbleMe, { backgroundColor: colors.foreground }] : [sc.msgBubbleThem, { backgroundColor: theme === 'dark' ? '#1A1A24' : '#F2F2F7' }]
                                ]}>
                                    {m.text && <Text style={[sc.msgText, { color: isMe ? (theme === 'dark' ? '#000' : '#FFF') : colors.foreground }]}>{m.text}</Text>}
                                    {m.imageUrl && (
                                        <TouchableOpacity onPress={() => setFullScreenMedia({ type: 'image', uri: m.imageUrl })}>
                                            <Image source={{ uri: m.imageUrl }} style={sc.msgImg} />
                                            <View style={sc.zoomOverlay}><Maximize2 size={14} color="white" /></View>
                                        </TouchableOpacity>
                                    )}
                                    {m.videoUrl && (
                                        <TouchableOpacity onPress={() => setFullScreenMedia({ type: 'video', uri: m.videoUrl })}>
                                            <UniversalVideoPlayer
                                                source={{ uri: m.videoUrl }}
                                                style={sc.msgVideo}
                                                resizeMode="cover"
                                                shouldPlay={false}
                                                isMuted={true}
                                            />
                                            <View style={sc.playOverlay}><Video size={18} color="white" /></View>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <Text style={[sc.msgTime, { color: colors.textMuted }]}>
                                    {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </Text>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
                <View style={[sc.inputArea, { borderTopColor: colors.border, backgroundColor: theme === 'dark' ? '#0A0A0F' : '#FFF' }]}>
                    <TouchableOpacity onPress={pickMedia} disabled={uploading} style={[sc.mediaBtn, { backgroundColor: theme === 'dark' ? '#1A1A24' : '#F2F2F7' }]}>
                        {uploading ? <ActivityIndicator size="small" color={colors.foreground} /> : <ImageIcon size={20} color={colors.foreground} />}
                    </TouchableOpacity>
                    <TextInput
                        style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : '#F2F2F7', color: colors.foreground }]}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder={t('typeMessage') || "Type a message..."}
                        placeholderTextColor={colors.textMuted}
                        multiline
                    />
                    <TouchableOpacity onPress={sendMessage} disabled={sending || !inputText.trim()} style={[sc.sendBtn, { backgroundColor: colors.foreground, opacity: (sending || !inputText.trim()) ? 0.5 : 1 }]}>
                        {sending ? <ActivityIndicator size="small" color={theme === 'dark' ? '#000' : '#FFF'} /> : <Send size={18} color={theme === 'dark' ? '#000' : '#FFF'} />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <Modal visible={!!fullScreenMedia} transparent animationType="fade">
                <SafeAreaView style={sc.fullMediaRoot}>
                    <TouchableOpacity style={sc.modalClose} onPress={() => setFullScreenMedia(null)}>
                        <X size={28} color="white" />
                    </TouchableOpacity>
                    {fullScreenMedia?.type === 'image' && (
                        <Image source={{ uri: fullScreenMedia.uri }} style={sc.fullImg} resizeMode="contain" />
                    )}
                    {fullScreenMedia?.type === 'video' && (
                        <UniversalVideoPlayer
                            source={{ uri: fullScreenMedia.uri }}
                            style={sc.fullImg}
                            resizeMode="contain"
                            useNativeControls
                            shouldPlay
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    header: { height: 74, elevation: 4, zIndex: 10, borderBottomWidth: 1 },
    headerTop: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    customerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 12 },
    avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    nameCol: { marginLeft: 10, flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    customerName: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    statusBadgeText: { fontSize: 8, fontWeight: '900' },
    customerEmail: { fontSize: 10, marginTop: 1 },
    closeBtn: { backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
    closeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

    scrollContent: { padding: 20, paddingBottom: 30 },
    msgRow: { marginBottom: 15, maxWidth: '80%' },
    msgMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    msgThem: { alignSelf: 'flex-start', alignItems: 'flex-start' },
    msgBubble: { padding: 12, borderRadius: 18 },
    msgBubbleMe: { borderBottomRightRadius: 4 },
    msgBubbleThem: { borderBottomLeftRadius: 4 },
    msgText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    msgImg: { width: width * 0.6, height: width * 0.6, borderRadius: 12, marginTop: 4 },
    msgVideo: { width: width * 0.6, height: width * 0.4, borderRadius: 12, marginTop: 4 },
    zoomOverlay: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 4 },
    playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
    msgTime: { fontSize: 9, marginTop: 4 },

    inputArea: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingBottom: Platform.OS === 'ios' ? 25 : 12, borderTopWidth: 1 },
    mediaBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    input: { flex: 1, marginHorizontal: 10, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, maxHeight: 100, fontSize: 14 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

    fullMediaRoot: { flex: 1, backgroundColor: 'black', justifyContent: 'center' },
    modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
    fullImg: { width: '100%', height: '80%' }
});
