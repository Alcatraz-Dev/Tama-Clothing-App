import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ChevronLeft, User, MessageCircle, Image as ImageIcon, Camera, X } from 'lucide-react-native';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Image, Modal } from 'react-native';
import { db } from './src/api/firebase';
import { getDocs, where, getDoc, doc } from 'firebase/firestore';
import { Video, ResizeMode } from 'expo-av';

async function sendPushNotification(expoPushToken: string, title: string, body: string, data = {}) {
    if (!expoPushToken) return;
    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
    };

    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
    } catch (e) {
        console.log('Error sending notification:', e);
    }
}

const CLOUDINARY_CLOUD_NAME = 'ddjzpo6p2';
const CLOUDINARY_UPLOAD_PRESET = 'tama_clothing';

interface Message {
    id: string;
    text?: string;
    imageUrl?: string;
    videoUrl?: string;
    senderId: string;
    senderName: string;
    senderRole: 'customer' | 'support';
    timestamp: any;
    read: boolean;
}

interface ChatScreenProps {
    onBack: () => void;
    user: any;
    t: (key: string) => string;
    theme: 'light' | 'dark';
    colors: any;
}

export default function ChatScreen({ onBack, user, t, theme, colors }: ChatScreenProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const chatId = `chat_${user?.uid}`;

    useEffect(() => {
        if (!user?.uid) return;

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const msgs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Message));
                setMessages(msgs);
                setLoading(false);

                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
            },
            (err) => {
                console.error("ChatScreen onSnapshot error:", err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user?.uid, chatId]);

    const notifyAdmins = async (text: string) => {
        try {
            const adminQuery = query(collection(db, 'users'), where('role', 'in', ['admin', 'support']));
            const adminDocs = await getDocs(adminQuery);
            adminDocs.forEach(d => {
                const token = d.data().expoPushToken;
                if (token) {
                    sendPushNotification(token, 'New Customer Message', `${user.displayName || user.email || 'Customer'}: ${text}`);
                }
            });
        } catch (e) {
            console.log('Error notifying admins:', e);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim() || !user?.uid) return;

        setSending(true);
        try {
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            await addDoc(messagesRef, {
                text: inputText.trim(),
                senderId: user.uid,
                senderName: user.displayName || user.email || 'Customer',
                senderRole: 'customer',
                timestamp: serverTimestamp(),
                read: false
            });

            // Update chat metadata using setDoc to avoid duplicates
            const { setDoc, doc } = await import('firebase/firestore');
            const chatDocRef = doc(db, 'chats', chatId);
            await setDoc(chatDocRef, {
                chatId,
                customerId: user.uid,
                customerName: user.displayName || user.email || 'Customer',
                customerEmail: user.email,
                lastMessage: inputText.trim(),
                lastMessageTime: serverTimestamp(),
                status: 'open',
            }, { merge: true });

            await notifyAdmins(inputText.trim());

            setInputText('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const uploadImageToCloudinary = async (uri: string) => {
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

            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const messageData: any = {
                senderId: user.uid,
                senderName: user.displayName || user.email || 'Customer',
                senderRole: 'customer',
                timestamp: serverTimestamp(),
                read: false
            };

            if (isVideo) {
                messageData.videoUrl = cloudinaryUrl;
            } else {
                messageData.imageUrl = cloudinaryUrl;
            }

            await addDoc(messagesRef, messageData);

            const { setDoc, doc, increment } = await import('firebase/firestore');
            const chatDocRef = doc(db, 'chats', chatId);
            await setDoc(chatDocRef, {
                lastMessage: isVideo ? 'Sent a video 📹' : 'Sent an image 📸',
                lastMessageTime: serverTimestamp(),
                unreadCount: increment(1)
            }, { merge: true });

            await notifyAdmins(isVideo ? 'Sent a video 📹' : 'Sent an image 📸');

        } catch (error) {
            console.error('Error uploading media:', error);
            alert('Failed to upload media');
        } finally {
            setUploading(false);
        }
    };

    const renderMessage = (message: Message) => {
        const isOwnMessage = message.senderId === user?.uid;

        return (
            <View
                key={message.id}
                style={[
                    styles.messageContainer,
                    isOwnMessage ? styles.ownMessage : styles.otherMessage
                ]}
            >
                {!isOwnMessage && (
                    <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                        <Text style={{ color: 'white', fontWeight: '800', fontSize: 10 }}>S</Text>
                    </View>
                )}
                <View
                    style={[
                        styles.messageBubble,
                        isOwnMessage
                            ? { backgroundColor: theme === 'dark' ? '#FFF' : '#000', borderBottomRightRadius: 4 }
                            : { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderBottomLeftRadius: 4, borderWidth: theme === 'dark' ? 0 : 1, borderColor: '#F2F2F7' }
                    ]}
                >
                    {!isOwnMessage && (
                        <Text style={[styles.senderName, { color: colors.accent, fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' }]}>
                            Support
                        </Text>
                    )}
                    {message.imageUrl ? (
                        <TouchableOpacity onPress={() => setFullScreenImage(message.imageUrl || null)} activeOpacity={0.9}>
                            <Image source={{ uri: message.imageUrl }} style={styles.messageImage} />
                        </TouchableOpacity>
                    ) : message.videoUrl ? (
                        <View style={{ width: 230, height: 230, borderRadius: 14, marginTop: 2, overflow: 'hidden', backgroundColor: '#000' }}>
                            <Video
                                source={{ uri: message.videoUrl }}
                                style={{ width: '100%', height: '100%' }}
                                useNativeControls
                                resizeMode={ResizeMode.COVER}
                                isLooping
                            />
                        </View>
                    ) : (
                        <Text
                            style={[
                                styles.messageText,
                                {
                                    color: isOwnMessage ? (theme === 'dark' ? '#000' : '#FFF') : colors.foreground,
                                    fontSize: 15,
                                    lineHeight: 21
                                }
                            ]}
                        >
                            {message.text}
                        </Text>
                    )}
                    <Text
                        style={[
                            styles.timestamp,
                            {
                                color: isOwnMessage ? (theme === 'dark' ? '#999' : 'rgba(255,255,255,0.6)') : colors.textMuted,
                                textAlign: isOwnMessage ? 'right' : 'left',
                                fontWeight: '500'
                            }
                        ]}
                    >
                        {message.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header matching modernHeader style */}
            <View style={[styles.modernHeader, { borderBottomWidth: 1, borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F2F2F7', paddingBottom: 10 }]}>
                <TouchableOpacity
                    onPress={onBack}
                    style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#17171F' : '#F2F2F7', width: 36, height: 36 }]}
                >
                    <ChevronLeft size={18} color={colors.foreground} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.modernLogo, { color: colors.foreground, position: 'relative', left: 0, right: 0 }]}>
                        {t('support')}
                    </Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={[
                        styles.messagesContent,
                        messages.length === 0 && !loading && { flex: 1, justifyContent: 'center' }
                    ]}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.accent} />
                        </View>
                    ) : messages.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconContainer, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}>
                                <MessageCircle size={48} color={colors.textMuted} strokeWidth={1.5} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                                {t('support')}
                            </Text>
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                {t('startConversation')}
                            </Text>
                        </View>
                    ) : (
                        messages.map(renderMessage)
                    )}
                </ScrollView>

                <Modal visible={!!fullScreenImage} transparent={true} onRequestClose={() => setFullScreenImage(null)}>
                    <View style={styles.modalBackground}>
                        <TouchableOpacity style={styles.closeModal} onPress={() => setFullScreenImage(null)}>
                            <X size={30} color="white" />
                        </TouchableOpacity>
                        {fullScreenImage && <Image source={{ uri: fullScreenImage }} style={styles.fullImage} resizeMode="contain" />}
                    </View>
                </Modal>

                {/* Input area with proper bottom spacing */}
                <View style={[styles.inputContainer, {
                    backgroundColor: theme === 'dark' ? colors.background : '#FFF',
                    borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F2F2F7',
                    paddingBottom: Platform.OS === 'ios' ? 100 : 90, // Handle floating tab bar
                    paddingHorizontal: 16,
                    paddingTop: 12,
                }]}>
                    <TouchableOpacity
                        style={[styles.uploadButton, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7', width: 44, height: 44, borderRadius: 22 }]}
                        onPress={pickMedia}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color={colors.accent} />
                        ) : (
                            <ImageIcon size={20} color={colors.textMuted} />
                        )}
                    </TouchableOpacity>

                    <View style={{
                        flex: 1,
                        flexDirection: 'row',
                        backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7',
                        borderRadius: 25,
                        alignItems: 'center',
                        paddingHorizontal: 15,
                        marginRight: 10,
                        borderWidth: 1,
                        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent'
                    }}>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: 'transparent',
                                color: colors.foreground,
                                paddingRight: 0,
                                marginRight: 0,
                            }]}
                            placeholder={t('typeMessage')}
                            placeholderTextColor={colors.textMuted}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.sendButton, {
                            backgroundColor: inputText.trim() ? colors.accent : (theme === 'dark' ? '#2C2C2E' : '#E5E5EA'),
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            shadowColor: colors.accent,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: inputText.trim() ? 0.3 : 0,
                            shadowRadius: 6,
                            elevation: inputText.trim() ? 4 : 0
                        }]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() || sending || uploading}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Send size={18} color={inputText.trim() ? (theme === 'dark' ? '#000' : '#FFF') : colors.accent} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    modernHeader: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backBtnSmall: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modernLogo: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1,
        position: 'absolute',
        left: 50,
        right: 50,
        textAlign: 'center',
    },
    keyboardView: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 20,
        paddingBottom: 160, // Space for input + tab bar
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    ownMessage: {
        justifyContent: 'flex-end',
    },
    otherMessage: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: '82%',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    senderName: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 100, // Tab bar height (70) + safe area (30)
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 8,
        maxHeight: 100,
        fontSize: 14,
    },
    uploadButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    messageImage: {
        width: 230,
        height: 230,
        borderRadius: 14,
        marginTop: 2,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeModal: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1,
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
