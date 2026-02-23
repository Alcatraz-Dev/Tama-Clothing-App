import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
    Modal,
    StyleSheet
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
    increment
} from 'firebase/firestore';
import UniversalVideoPlayer from '../components/common/UniversalVideoPlayer';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, X, Send, Image as ImagePlay, MessageCircle } from 'lucide-react-native';
import { db } from '../api/firebase';
import { useAppTheme } from '../context/ThemeContext';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { sendPushNotification } from '../utils/notifications';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DirectMessageScreen({ user, targetUser, onBack, t, language, currentUserData }: any) {
    const { colors, theme } = useAppTheme();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

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

                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
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

    const pickMedia = async () => {
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
            const cloudinaryUrl = await uploadImageToCloudinary(uri);

            const messagesRef = collection(db, 'direct_chats', chatId, 'messages');
            const senderName = currentUserData?.fullName || currentUserData?.displayName || user.displayName || 'User';
            const messageData: any = {
                senderId: user.uid,
                senderName: senderName,
                timestamp: serverTimestamp(),
                read: false
            };

            if (isVideo) messageData.videoUrl = cloudinaryUrl;
            else messageData.imageUrl = cloudinaryUrl;

            await addDoc(messagesRef, messageData);

            const chatDocRef = doc(db, 'direct_chats', chatId);
            await setDoc(chatDocRef, {
                lastMessage: isVideo ? 'Vidéo 📹' : 'Image 📸',
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

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                height: 60,
                borderBottomWidth: 1,
                borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F2F2F7'
            }}>
                <TouchableOpacity onPress={onBack} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft size={24} color={colors.foreground} />
                </TouchableOpacity>

                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {targetUser.avatarUrl || targetUser.photoURL ? (
                            <Image source={{ uri: targetUser.avatarUrl || targetUser.photoURL }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>
                                {(targetUser.fullName || targetUser.displayName || 'A')[0].toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <View style={{ marginLeft: 10 }}>
                        <Text style={{ color: colors.foreground, fontWeight: '900', fontSize: 15 }}>
                            {targetUser.fullName || targetUser.displayName || 'User'}
                        </Text>
                        <Text style={{ color: '#2ECC71', fontSize: 10, fontWeight: '700' }}>Active Now</Text>
                    </View>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                style={{ flex: 1 }}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
                    ) : messages.length === 0 ? (
                        <View style={{ alignItems: 'center', marginTop: 100, paddingHorizontal: 40 }}>
                            <MessageCircle size={50} color={colors.textMuted} strokeWidth={1} />
                            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 20, fontSize: 13, fontWeight: '700' }}>
                                Say hello to {targetUser.fullName || targetUser.displayName || 'your friend'}!
                            </Text>
                        </View>
                    ) : messages.map((m: any) => {
                        const isOwn = m.senderId === user.uid;
                        return (
                            <View key={m.id} style={{
                                flexDirection: 'row',
                                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                                marginBottom: 15
                            }}>
                                {!isOwn && (
                                    <View style={{ marginRight: 8, alignSelf: 'flex-end' }}>
                                        {targetUser.avatarUrl || targetUser.photoURL ? (
                                            <Image source={{ uri: targetUser.avatarUrl || targetUser.photoURL }} style={{ width: 24, height: 24, borderRadius: 12 }} />
                                        ) : (
                                            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ fontSize: 9, fontWeight: '900', color: colors.textMuted }}>
                                                    {(targetUser.fullName || targetUser.displayName || 'A')[0].toUpperCase()}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                <View style={{ maxWidth: '80%' }}>
                                    <View style={{
                                        backgroundColor: isOwn ? colors.accent : (theme === 'dark' ? '#1C1C1E' : '#F0F0F0'),
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        borderRadius: 20,
                                        borderBottomRightRadius: isOwn ? 4 : 20,
                                        borderBottomLeftRadius: isOwn ? 20 : 4,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 2,
                                        elevation: 1
                                    }}>
                                        {m.imageUrl ? (
                                            <TouchableOpacity onPress={() => setFullScreenImage(m.imageUrl)} activeOpacity={0.9}>
                                                <Image source={{ uri: m.imageUrl }} style={{ width: 220, height: 220, borderRadius: 12 }} resizeMode="cover" />
                                            </TouchableOpacity>
                                        ) : m.videoUrl ? (
                                            <View style={{ width: 220, height: 220, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
                                                <UniversalVideoPlayer
                                                    source={{ uri: m.videoUrl }}
                                                    style={{ width: '100%', height: '100%' }}
                                                    useNativeControls
                                                    resizeMode="cover"
                                                    isLooping
                                                />
                                            </View>
                                        ) : (
                                            <Text style={{
                                                color: isOwn ? '#FFF' : colors.foreground,
                                                fontSize: 15,
                                                lineHeight: 20,
                                                fontWeight: '500'
                                            }}>{m.text}</Text>
                                        )}
                                    </View>
                                    <Text style={{
                                        fontSize: 9,
                                        color: colors.textMuted,
                                        marginTop: 5,
                                        textAlign: isOwn ? 'right' : 'left',
                                        marginHorizontal: 5
                                    }}>
                                        {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Input Area */}
                <View style={{
                    flexDirection: 'row',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    backgroundColor: colors.background,
                    alignItems: 'center',
                    borderTopWidth: 1,
                    borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F2F2F7'
                }}>
                    <TouchableOpacity onPress={pickMedia} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F2F2F7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        {uploading ? (
                            <ActivityIndicator size="small" color={colors.accent} />
                        ) : (
                            <ImagePlay size={22} color={colors.foreground} />
                        )}
                    </TouchableOpacity>

                    <View style={{
                        flex: 1,
                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F2F2F7',
                        borderRadius: 25,
                        paddingHorizontal: 20,
                        marginRight: 12,
                        minHeight: 44,
                        justifyContent: 'center'
                    }}>
                        <TextInput
                            style={{
                                color: colors.foreground,
                                fontSize: 15,
                                maxHeight: 100,
                                paddingVertical: 8
                            }}
                            placeholder={tr("Écrire...", "اكتب...", "Write...")}
                            placeholderTextColor={colors.textMuted}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                    </View>

                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={!inputText.trim() || sending}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: inputText.trim() ? colors.accent : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#E5E5EA'),
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Send size={20} color={inputText.trim() ? "#FFF" : colors.textMuted} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <Modal visible={!!fullScreenImage} transparent onRequestClose={() => setFullScreenImage(null)}>
                <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
                    <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }} onPress={() => setFullScreenImage(null)}>
                        <X size={32} color="white" />
                    </TouchableOpacity>
                    {fullScreenImage && <Image source={{ uri: fullScreenImage }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />}
                </View>
            </Modal>
        </SafeAreaView>
    );
}
