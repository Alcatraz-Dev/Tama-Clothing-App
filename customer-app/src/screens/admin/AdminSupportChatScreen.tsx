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
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Send,
    Image as ImageIcon,
    User,
    X,
    Video,
    Plus,
    Smile,
    Camera,
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
import { MediaPicker } from '../../components/ui/media-picker';
import { Avatar } from '../../components/ui/avatar';
import { GifPicker } from '@/components/ui/gif-picker';
import { Image as ExpoImage } from 'expo-image';

const { width } = Dimensions.get('window');

export default function AdminSupportChatScreen({ onBack, onNavigate, chatId, customerName, user, profileData, t }: any) {
    const { colors, theme } = useAppTheme();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fullScreenMedia, setFullScreenMedia] = useState<any>(null);
    const [chatData, setChatData] = useState<any>(null);
    const [isMediaModalVisible, setIsMediaModalVisible] = useState(false);
    const [isGifPickerVisible, setIsGifPickerVisible] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const tr = (fr: string, ar: string, en: string) => {
        // @ts-ignore
        const lang = profileData?.language || 'fr';
        return lang === 'ar' ? ar : lang === 'fr' ? fr : en;
    };

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
                senderName: profileData?.fullName || user?.displayName || user?.email?.split('@')[0] || t('supportRole') || 'Support',
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
                        t('newMessageFromSupport') || 'New message from Support',
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

    const handleMediaUpload = async (uri: string) => {
        setUploading(true);
        try {
            const fileType = uri.split('.').pop()?.toLowerCase();
            const isVideo = ['mp4', 'mov', 'avi', 'mkv'].includes(fileType || '');
            const bunnyUrl = await uploadToBunny(uri);

            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const messageData: any = {
                senderId: user.uid,
                senderName: profileData?.fullName || user?.displayName || user?.email?.split('@')[0] || t('supportRole') || 'Support',
                senderRole: 'support',
                timestamp: serverTimestamp(),
                read: false
            };

            if (isVideo) messageData.videoUrl = bunnyUrl;
            else messageData.imageUrl = bunnyUrl;

            await addDoc(messagesRef, messageData);

            await updateDoc(doc(db, 'chats', chatId), {
                lastMessage: isVideo ? (t('videoSent') || 'Sent a video 📹') : (t('imageSent') || 'Sent an image 📸'),
                lastMessageTime: serverTimestamp(),
                unreadCount: 0,
                status: 'open'
            });

            if (chatData?.customerId) {
                const userDoc = await getDoc(doc(db, 'users', chatData.customerId));
                if (userDoc.exists() && userDoc.data().expoPushToken) {
                    sendPushNotification(
                        userDoc.data().expoPushToken,
                        t('newMessageFromSupport') || 'New message from Support',
                        isVideo ? (t('supportSentVideo') || 'Support sent a video') : (t('supportSentImage') || 'Support sent an image')
                    );
                }
            }
        } catch (error) {
            Alert.alert(tr('Erreur', 'خطأ', 'Error'), tr('Échec du téléchargement', 'فشل الرفع', 'Upload failed'));
        } finally {
            setUploading(false);
        }
    };

    const handleCameraCapture = () => {
        setIsMediaModalVisible(false);
        if (onNavigate) {
            onNavigate('Camera', {
                onCapture: (uri: string) => {
                    handleMediaUpload(uri);
                }
            });
        }
    };

    const handleGifSelection = async (gifUrl: string) => {
        setIsGifPickerVisible(false);
        if (!gifUrl || !chatId) return;

        setSending(true);
        try {
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            await addDoc(messagesRef, {
                gifUrl: gifUrl,
                senderId: user.uid,
                senderRole: 'support',
                senderName: profileData?.fullName || user?.displayName || 'Support',
                timestamp: serverTimestamp(),
                read: false,
                type: 'gif'
            });

            await updateDoc(doc(db, 'chats', chatId), {
                lastMessage: 'GIF 🖼️',
                lastMessageTime: serverTimestamp(),
                unreadCount: 0,
                status: 'open'
            });
        } catch (e) {
            console.error('Error sending GIF:', e);
        } finally {
            setSending(false);
        }
    };

    return (
        <SafeAreaView style={[sc.root, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[sc.header, { borderBottomColor: colors.border, backgroundColor: theme === 'dark' ? '#0A0A0F' : '#FFF' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingHorizontal: 15 }}>
                    <TouchableOpacity onPress={onBack} style={sc.backBtn}>
                        <ChevronLeft size={24} color={colors.foreground} />
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 16 }}>
                        <View style={{ position: 'relative' }}>
                            <Avatar
                                source={chatData?.customerPhoto || null}
                                size={40}
                                fallback={(customerName || 'C')[0].toUpperCase()}
                            />
                            <View style={{
                                position: 'absolute',
                                bottom: 1,
                                right: 1,
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: '#31A24C',
                                borderWidth: 2,
                                borderColor: theme === 'dark' ? '#0A0A0F' : '#FFF'
                            }} />
                        </View>
                        <View style={{ marginLeft: 10 }}>
                            <Text numberOfLines={1} style={[sc.headerTitle, { color: colors.foreground }]}>{customerName}</Text>
                            <Text style={{ color: '#31A24C', fontSize: 11, fontWeight: '600' }}>
                                {tr('En ligne', 'متصل', 'Online')}
                            </Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {chatData?.status === 'open' && (
                            <TouchableOpacity onPress={closeChat} style={sc.closeBtn}>
                                <Text style={sc.closeText}>{tr('FERMER', 'إغلاق', 'CLOSE')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
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
                        const nextMessage = messages[idx + 1];
                        const isLastInGroup = !nextMessage || nextMessage.senderRole !== m.senderRole;
                        const showAvatar = !isMe && isLastInGroup;

                        return (
                            <View key={m.id} style={[sc.msgRow, isMe ? sc.msgMe : sc.msgThem, { alignItems: 'flex-end' }]}>
                                {!isMe && (
                                    <View style={{ width: 32, marginRight: 8, marginBottom: 12 }}>
                                        {showAvatar && (
                                            <Avatar
                                                source={chatData?.customerPhoto || null}
                                                size={32}
                                                fallback={(customerName || 'C')[0].toUpperCase()}
                                            />
                                        )}
                                    </View>
                                )}
                                <View style={{ flexShrink: 1 }}>
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
                                        {m.gifUrl && (
                                            <TouchableOpacity onPress={() => setFullScreenMedia({ type: 'image', uri: m.gifUrl })}>
                                                <ExpoImage 
                                                    source={{ uri: m.gifUrl }} 
                                                    style={sc.msgImg} 
                                                    contentFit="cover"
                                                    cachePolicy="disk"
                                                />
                                                <View style={sc.zoomOverlay}><Maximize2 size={14} color="white" /></View>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <Text style={[sc.msgTime, { color: colors.textMuted, textAlign: isMe ? 'right' : 'left' }]}>
                                        {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
                <View style={[sc.inputArea, { borderTopColor: colors.border, backgroundColor: theme === 'dark' ? '#0A0A0F' : '#FFF' }]}>
                    <TouchableOpacity onPress={() => setIsMediaModalVisible(true)} disabled={uploading} style={[sc.mediaBtn, { backgroundColor: theme === 'dark' ? '#1A1A24' : '#F2F2F7' }]}>
                        {uploading ? <ActivityIndicator size="small" color={colors.foreground} /> : <ImageIcon size={20} color={colors.foreground} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsGifPickerVisible(true)} style={[sc.mediaBtn, { backgroundColor: theme === 'dark' ? '#1A1A24' : '#F2F2F7', marginLeft: 5 }]}>
                        <Smile size={20} color={colors.foreground} />
                    </TouchableOpacity>
                    <TextInput
                        style={[sc.input, { backgroundColor: theme === 'dark' ? '#1A1A24' : '#F2F2F7', color: colors.foreground }]}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder={tr('Écrire un message...', 'اكتب رسالة...', "Type a message...")}
                        placeholderTextColor={colors.textMuted}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={inputText.trim() ? sendMessage : handleCameraCapture}
                        disabled={sending || (uploading && !inputText.trim())}
                        style={[sc.sendBtn, { backgroundColor: colors.foreground, opacity: sending ? 0.7 : 1 }]}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color={theme === 'dark' ? '#000' : '#FFF'} />
                        ) : inputText.trim() ? (
                            <Send size={18} color={theme === 'dark' ? '#000' : '#FFF'} />
                        ) : (
                            <Camera size={20} color={theme === 'dark' ? '#000' : '#FFF'} />
                        )}
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

            {/* Media Choice Modal */}
            <Modal
                visible={isMediaModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsMediaModalVisible(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
                    onPress={() => setIsMediaModalVisible(false)}
                    activeOpacity={1}
                >
                    <View style={{
                        backgroundColor: theme === 'dark' ? '#1c1c1e' : '#FFF',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        paddingBottom: 40,
                        paddingHorizontal: 20
                    }}>
                        <View style={{ width: 40, height: 4, backgroundColor: theme === 'dark' ? '#3a3a3c' : '#E5E5EA', borderRadius: 2, alignSelf: 'center', marginTop: 12 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 25 }}>
                            <Text style={{ color: colors.foreground, fontSize: 19, fontWeight: '700' }}>
                                {tr('Choisir un média', 'اختر وسائط', 'Choose media')}
                            </Text>
                            <TouchableOpacity onPress={() => setIsMediaModalVisible(false)} style={{ padding: 4 }}>
                                <X size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 12 }}>
                            <MediaPicker
                                mediaType="image"
                                onSelectionChange={(assets) => {
                                    if (assets.length > 0) {
                                        setIsMediaModalVisible(false);
                                        handleMediaUpload(assets[0].uri);
                                    }
                                }}
                            >
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: theme === 'dark' ? '#2c2c2e' : '#F2F2F7',
                                    padding: 16,
                                    borderRadius: 16
                                }}>
                                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#A855F7', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                                        <ImageIcon size={22} color="#FFF" />
                                    </View>
                                    <View>
                                        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>{tr('Photo', 'صورة', 'Photo')}</Text>
                                        <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 1 }}>{tr('Choisir depuis la galerie', 'اختر من المعرض', 'Choose from gallery')}</Text>
                                    </View>
                                </View>
                            </MediaPicker>

                            <MediaPicker
                                mediaType="video"
                                onSelectionChange={(assets) => {
                                    if (assets.length > 0) {
                                        setIsMediaModalVisible(false);
                                        handleMediaUpload(assets[0].uri);
                                    }
                                }}
                            >
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: theme === 'dark' ? '#2c2c2e' : '#F2F2F7',
                                    padding: 16,
                                    borderRadius: 16
                                }}>
                                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF2D55', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                                        <Video size={22} color="#FFF" />
                                    </View>
                                    <View>
                                        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>{tr('Vidéo', 'فيديو', 'Video')}</Text>
                                        <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 1 }}>{tr('Partager une vidéo', 'مشاركة فيديو', 'Share a video')}</Text>
                                    </View>
                                </View>
                            </MediaPicker>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            <GifPicker
                visible={isGifPickerVisible}
                onClose={() => setIsGifPickerVisible(false)}
                onGifSelect={handleGifSelection}
            />
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
    headerTitle: { fontSize: 16, fontWeight: '700' },
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

