import React, { useState, useEffect, useRef } from 'react';
import {
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Modal,
    StyleSheet,
    Pressable,
    FlatList,
    Platform,
    Dimensions,
    View,
    Alert
} from 'react-native';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    setDoc,
    addDoc,
    serverTimestamp,
    increment,
    deleteDoc,
    arrayUnion
} from 'firebase/firestore';
import UniversalVideoPlayer from '../components/common/UniversalVideoPlayer';
import * as ImagePicker from 'expo-image-picker';
import {
    Check,
    CheckCheck,
    ChevronLeft,
    X,
    SendHorizonal,
    Image as ImageIcon,
    MessageCircle,
    MessageSquare,
    Camera,
    MoreVertical,
    Plus,
    Trash,
    EyeOff,
    Shield
} from 'lucide-react-native';
import { db } from '../api/firebase';
import { useAppTheme } from '../context/ThemeContext';
import { uploadToBunny } from '../utils/bunny';
import { sendPushNotification } from '../utils/notifications';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/avatar';
import { AvoidKeyboard } from '@/components/ui/avoid-keyboard';
import { Button } from '@/components/ui/button';
import { Camera as CameraUI } from '@/components/ui/camera';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { MediaPicker, MediaAsset } from '@/components/ui/media-picker';
import { Popover, PopoverTrigger, PopoverContent, PopoverBody } from '@/components/ui/popover';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useColor } from '@/hooks/useColor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DirectMessageScreen({ user, targetUser, onBack, t, language, currentUserData }: any) {
    const { theme } = useAppTheme();
    const colors = {
        background: useColor('background'),
        foreground: useColor('foreground'),
        card: useColor('card'),
        accent: useColor('accent'),
        border: useColor('border'),
        textMuted: useColor('textMuted'),
        blue: useColor('blue'),
    };

    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [isMediaModalVisible, setIsMediaModalVisible] = useState(false);
    const [viewMode, setViewMode] = useState<'chat' | 'camera'>('chat');
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<any>(null);
    const insets = useSafeAreaInsets();

    const chatId = [user?.uid, targetUser?.uid].sort().join('_');

    const tr = (fr: string, ar: string, en: string) => {
        return language === 'ar' ? ar : (language === 'fr' ? fr : en);
    };

    useEffect(() => {
        if (!chatId || !user?.uid) return;

        const messagesRef = collection(db, 'direct_chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q,
            async (snapshot) => {
                const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMessages(msgs);
                setLoading(false);

                // Mark unread messages as read
                snapshot.docs.forEach(async (mDoc) => {
                    const data = mDoc.data();
                    if (data.senderId !== user.uid && !data.read) {
                        try {
                            await updateDoc(doc(db, 'direct_chats', chatId, 'messages', mDoc.id), { read: true });
                        } catch (e) { }
                    }
                });

                // Reset unread count on the chat document
                try {
                    await setDoc(doc(db, 'direct_chats', chatId), {
                        [`unreadCount_${user.uid}`]: 0
                    }, { merge: true });
                } catch (e) { }
            },
            (err) => {
                console.error("DirectMessageScreen Error:", err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [chatId, user?.uid]);

    const sendMessage = async () => {
        if (!inputText.trim() || !user?.uid || !targetUser?.uid) return;
        setSending(true);
        const text = inputText.trim();
        setInputText('');

        try {
            const messagesRef = collection(db, 'direct_chats', chatId, 'messages');
            const senderName = currentUserData?.fullName || currentUserData?.displayName || user.displayName || 'User';

            await addDoc(messagesRef, {
                text: text,
                senderId: user.uid,
                senderName: senderName,
                timestamp: serverTimestamp(),
                read: false
            });

            const chatDocRef = doc(db, 'direct_chats', chatId);
            await setDoc(chatDocRef, {
                lastMessage: text,
                lastMessageTime: serverTimestamp(),
                participants: [user.uid, targetUser.uid],
                participantData: {
                    [user.uid]: { name: senderName, photo: currentUserData?.avatarUrl || user.photoURL || null },
                    [targetUser.uid]: { name: targetUser.fullName || targetUser.displayName || 'User', photo: targetUser.avatarUrl || targetUser.photoURL || null }
                },
                [`unreadCount_${targetUser.uid}`]: increment(1)
            }, { merge: true });

            if (targetUser.expoPushToken) {
                sendPushNotification(
                    targetUser.expoPushToken,
                    tr(`Message de ${senderName}`, `ميساج من عند ${senderName}`, `Message from ${senderName}`),
                    text
                );
            }
        } catch (e) {
            console.error('Error sending DM:', e);
        } finally {
            setSending(false);
        }
    };

    const handleDeleteConversation = () => {
        Alert.alert(
            tr('Supprimer', 'حذف', 'Delete'),
            tr('Voulez-vous supprimer cette conversation ?', 'هل تريد حذف هذه المحادثة؟', 'Do you want to delete this conversation?'),
            [
                { text: tr('Annuler', 'إلغاء', 'Cancel'), style: 'cancel' },
                {
                    text: tr('Supprimer', 'حذف', 'Delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'direct_chats', chatId));
                            onBack();
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            ]
        );
    };

    const handleHideConversation = async () => {
        try {
            await updateDoc(doc(db, 'direct_chats', chatId), {
                [`hidden_${user.uid}`]: true
            });
            onBack();
        } catch (e) {
            console.error(e);
        }
    };

    const handleBlockUser = () => {
        Alert.alert(
            tr('Bloquer', 'حظر', 'Block'),
            tr('Voulez-vous bloquer cet utilisateur ?', 'هل تريد حظر هذا المستخدم؟', 'Do you want to block this user?'),
            [
                { text: tr('Annuler', 'إلغاء', 'Cancel'), style: 'cancel' },
                {
                    text: tr('Bloquer', 'حظر', 'Block'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const blockRef = doc(db, 'users', user.uid);
                            await updateDoc(blockRef, {
                                blockedUsers: arrayUnion(targetUser.uid)
                            });
                            onBack();
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            ]
        );
    };

    const handleMediaSelection = async (assets: MediaAsset[]) => {
        if (assets.length === 0) return;
        const asset = assets[0];
        handleMediaUpload(asset.uri);
    };

    const handleCameraCapture = async () => {
        setIsMediaModalVisible(false);
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            alert('Camera permission required');
            return;
        }
        setViewMode('camera');
    };

    const handleCameraResult = async (uri: string, type: 'image' | 'video') => {
        setViewMode('chat');
        if (uri) {
            handleMediaUpload(uri);
        }
    };

    const handleGalleryPick = async () => {
        setIsMediaModalVisible(false);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
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

            const messagesRef = collection(db, 'direct_chats', chatId, 'messages');
            const senderName = currentUserData?.fullName || currentUserData?.displayName || user.displayName || 'User';
            const messageData: any = {
                senderId: user.uid,
                senderName: senderName,
                timestamp: serverTimestamp(),
                read: false
            };

            if (isVideo) messageData.videoUrl = bunnyUrl;
            else messageData.imageUrl = bunnyUrl;

            await addDoc(messagesRef, messageData);

            const chatDocRef = doc(db, 'direct_chats', chatId);
            await setDoc(chatDocRef, {
                lastMessage: isVideo ? 'Vidéo 📹' : 'Image 📸',
                lastMessageTime: serverTimestamp(),
                participants: [user.uid, targetUser.uid],
                participantData: {
                    [user.uid]: { name: senderName, photo: currentUserData?.avatarUrl || currentUserData?.photoURL || user.photoURL || null },
                    [targetUser.uid]: { name: targetUser.fullName || targetUser.displayName || 'User', photo: targetUser.avatarUrl || targetUser.photoURL || targetUser.image || null }
                },
                [`unreadCount_${targetUser.uid}`]: increment(1)
            }, { merge: true });

            if (targetUser.expoPushToken) {
                sendPushNotification(
                    targetUser.expoPushToken,
                    tr(`Message de ${senderName}`, `ميساج من عند ${senderName}`, `Message from ${senderName}`),
                    isVideo ? tr('Vidéo 📹', 'فيديو 📹', 'Video 📹') : tr('Image 📸', 'تصويرة 📸', 'Image 📸')
                );
            }
        } catch (error) {
            console.error('DM media upload error:', error);
            alert('Failed to upload media');
        } finally {
            setUploading(false);
        }
    };

    const renderMessage = ({ item, index }: { item: any, index: number }) => {
        const isOwn = item.senderId === user.uid;
        const prevMessage = messages[index - 1];
        const nextMessage = messages[index + 1];

        const isFirstInGroup = !prevMessage || prevMessage.senderId !== item.senderId;
        const isLastInGroup = !nextMessage || nextMessage.senderId !== item.senderId;
        const showAvatar = !isOwn && isLastInGroup;

        return (
            <View style={{
                marginBottom: isLastInGroup ? 16 : 4,
                alignItems: isOwn ? 'flex-end' : 'flex-start',
                flexDirection: 'row',
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                paddingHorizontal: 16
            }}>
                {!isOwn && (
                    <View style={{ width: 32, marginRight: 8, justifyContent: 'flex-end' }}>
                        {showAvatar && (
                            <Avatar
                                source={targetUser.avatarUrl || targetUser.photoURL || targetUser.image || targetUser.photo}
                                size={32}
                            />
                        )}
                    </View>
                )}
                <View style={{
                    maxWidth: '80%',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                }}>
                    {isOwn ? (
                        <LinearGradient
                            colors={['#3b82f6', '#2563eb']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                padding: item.imageUrl || item.videoUrl ? 4 : 12,
                                paddingHorizontal: item.imageUrl || item.videoUrl ? 4 : 16,
                                borderRadius: 20,
                                borderTopRightRadius: isFirstInGroup ? 20 : 6,
                                borderBottomRightRadius: isLastInGroup ? 20 : 6,
                            }}
                        >
                            {renderMessageContent(item, true)}
                        </LinearGradient>
                    ) : (
                        <View style={{
                            padding: item.imageUrl || item.videoUrl ? 4 : 12,
                            paddingHorizontal: item.imageUrl || item.videoUrl ? 4 : 16,
                            borderRadius: 20,
                            borderTopLeftRadius: isFirstInGroup ? 20 : 6,
                            borderBottomLeftRadius: isLastInGroup ? 20 : 6,
                            backgroundColor: theme === 'dark' ? '#262629' : '#FFFFFF',
                            borderWidth: 1,
                            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        }}>
                            {renderMessageContent(item, false)}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderMessageContent = (item: any, isOwn: boolean) => {
        const timestamp = item.timestamp?.toDate ? item.timestamp.toDate() : new Date();
        return (
            <View>
                {item.imageUrl ? (
                    <TouchableOpacity onPress={() => setFullScreenImage(item.imageUrl)} activeOpacity={0.9}>
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={{
                                width: SCREEN_WIDTH * 0.7,
                                height: SCREEN_WIDTH * 0.7,
                                borderRadius: 16
                            }}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                ) : item.videoUrl ? (
                    <View style={{ width: SCREEN_WIDTH * 0.7, height: SCREEN_WIDTH * 0.7, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' }}>
                        <UniversalVideoPlayer
                            source={{ uri: item.videoUrl }}
                            style={{ width: '100%', height: '100%' }}
                            useNativeControls={false}
                            resizeMode="cover"
                        />
                    </View>
                ) : (
                    <Text style={{
                        color: isOwn ? 'white' : colors.foreground,
                        fontSize: 16,
                        lineHeight: 22,
                        fontWeight: '500'
                    }}>
                        {item.text}
                    </Text>
                )}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    marginTop: item.imageUrl || item.videoUrl ? -24 : 2,
                    paddingHorizontal: item.imageUrl || item.videoUrl ? 8 : 0,
                    paddingBottom: item.imageUrl || item.videoUrl ? 8 : 0,
                }}>
                    <Text style={{
                        color: isOwn ? 'rgba(255,255,255,0.8)' : colors.textMuted,
                        fontSize: 10,
                        fontWeight: '600',
                        textShadowColor: item.imageUrl || item.videoUrl ? 'rgba(0,0,0,0.5)' : 'transparent',
                        textShadowRadius: item.imageUrl || item.videoUrl ? 4 : 0,
                    }}>
                        {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {isOwn && (
                        <View style={{ marginLeft: 4 }}>
                            <CheckCheck size={12} color={item.read ? '#A855F7' : 'rgba(255,255,255,0.6)'} />
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (viewMode === 'camera') {
        return (
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: '#000' }}>
                    <CameraUI
                        onClose={() => setViewMode('chat')}
                        onCapture={({ uri }) => handleCameraResult(uri, 'image')}
                        onVideoCapture={({ uri }) => handleCameraResult(uri, 'video')}
                        enableVideo={true}
                        maxVideoDuration={60}
                    />
                </View>
            </GestureHandlerRootView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <BlurView intensity={theme === 'dark' ? 20 : 40} tint={theme === 'dark' ? 'dark' : 'light'} style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: insets.top + 64,
                zIndex: 10,
                borderBottomWidth: 1,
                borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 8,
                    paddingTop: insets.top + 8,
                    paddingBottom: 12,
                    justifyContent: 'space-between'
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Button
                            onPress={onBack}
                            variant="ghost"
                            size="icon"
                            style={{ width: 40, height: 40, borderRadius: 20 }}
                        >
                            <ChevronLeft size={28} color={colors.foreground} />
                        </Button>

                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}>
                            <View style={{ position: 'relative' }}>
                                <Avatar size={44} source={targetUser?.avatarUrl || targetUser?.photoURL || targetUser?.image || targetUser?.photo} fallback={targetUser?.fullName?.[0] || targetUser?.displayName?.[0] || 'U'} />
                                <View style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: 12,
                                    height: 12,
                                    borderRadius: 6,
                                    backgroundColor: '#22c55e',
                                    borderWidth: 2,
                                    borderColor: theme === 'dark' ? '#000' : '#FFF'
                                }} />
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }} numberOfLines={1}>
                                    {targetUser.fullName || targetUser.displayName || 'User'}
                                </Text>
                                <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '600' }}>
                                    {tr('En ligne', 'اونلاين', 'Online')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                tr('Options', 'خيارات', 'Options'),
                                '',
                                [
                                    { text: tr('Annuler', 'إلغاء', 'Cancel'), style: 'cancel' },
                                    { text: tr('Supprimer la conversation', 'حذف المحادثة', 'Delete conversation'), style: 'destructive', onPress: handleDeleteConversation },
                                    { text: tr('Masquer la conversation', 'إخفاء المحادثة', 'Hide conversation'), onPress: handleHideConversation },
                                    { text: tr("Bloquer l'utilisateur", 'بلوك المستخدم', 'Block user'), style: 'destructive', onPress: handleBlockUser }
                                ]
                            );
                        }}
                    >
                        <Button variant="ghost" size="icon" style={{ width: 40, height: 40, borderRadius: 20 }} disabled>
                            <MoreVertical size={24} color={colors.foreground} />
                        </Button>
                    </TouchableOpacity>
                </View>
            </BlurView>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: insets.top + 74, paddingBottom: insets.bottom + 90 }}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListEmptyComponent={!loading ? (
                    <View style={{ alignItems: 'center', marginTop: 150, paddingHorizontal: 40 }}>
                        <View style={{
                            width: 100,
                            height: 100,
                            borderRadius: 50,
                            backgroundColor: colors.card,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 24
                        }}>
                            <MessageCircle size={48} color={colors.textMuted} strokeWidth={1} />
                        </View>
                        <Text variant="title" style={{ fontSize: 20, textAlign: 'center' }}>
                            {tr('Dites bonjour 👋', 'قل مرحباً 👋', 'Say hello 👋')}
                        </Text>
                        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 8, fontSize: 14 }}>
                            {tr('Dites bonjour à', 'قل مرحباً لـ', 'Say hello to')} {targetUser.fullName || targetUser.displayName || 'your friend'}!
                        </Text>
                    </View>
                ) : (
                    <ActivityIndicator color={colors.blue} style={{ marginTop: 100 }} />
                )}
            />

            {/* Input Area */}
            <BlurView intensity={theme === 'dark' ? 30 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: insets.bottom + 12,
                borderTopWidth: 1,
                borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                    <MediaPicker
                        onSelectionChange={handleMediaSelection}
                        mediaType="all"
                        showPreview={false}
                    >
                        <View style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 2
                        }}>
                            {uploading ? <ActivityIndicator size="small" color={colors.blue} /> : <Plus size={24} color={colors.foreground} />}
                        </View>
                    </MediaPicker>

                    <View style={{ flex: 1 }}>
                        <Input
                            ref={inputRef}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder={tr('Votre message...', 'رسالتك...', 'Your message...')}
                            variant="ghost"
                            multiline
                            containerStyle={{
                                minHeight: 44,
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                borderRadius: 22,
                                paddingHorizontal: 16,
                                borderWidth: 1,
                                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            }}
                            inputStyle={{
                                maxHeight: 120,
                                fontSize: 16,
                                paddingVertical: 10,
                                color: colors.foreground,
                            }}
                        />
                    </View>

                    {inputText.trim() ? (
                        <TouchableOpacity
                            onPress={sendMessage}
                            disabled={sending}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: colors.blue,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 2,
                                shadowColor: colors.blue,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4
                            }}
                        >
                            {sending ? <ActivityIndicator size="small" color="white" /> : <SendHorizonal size={20} color="white" />}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={handleCameraCapture}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 2
                            }}
                        >
                            <Camera size={22} color={colors.foreground} />
                        </TouchableOpacity>
                    )}
                </View>
            </BlurView>

            {/* Keyboard avoidance */}
            <AvoidKeyboard />

            {/* Modals */}
            <Modal visible={!!fullScreenImage} transparent onRequestClose={() => setFullScreenImage(null)}>
                <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
                    <TouchableOpacity style={{ position: 'absolute', top: insets.top + 10, right: 20, zIndex: 10 }} onPress={() => setFullScreenImage(null)}>
                        <X size={32} color="white" />
                    </TouchableOpacity>
                    {fullScreenImage && <Image source={{ uri: fullScreenImage }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />}
                </View>
            </Modal>

        </SafeAreaView >
    );
}
