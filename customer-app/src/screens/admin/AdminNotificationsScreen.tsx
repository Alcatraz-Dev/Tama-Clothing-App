import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    StyleSheet,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Send,
    History,
    Image as ImageIcon,
    Trash2,
    Bell,
} from 'lucide-react-native';
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp,
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import { AdminHeader } from '../../components/admin/AdminHeader';
import {
    AdminCard,
    InputLabel,
    EmptyState,
    AdminChip,
    ModernSwitch,
} from '../../components/admin/AdminUI';
import { uploadImageToCloudinary } from '../../utils/cloudinary';

export default function AdminNotificationsScreen({ onBack, t }: any) {
    const { colors, theme } = useAppTheme();
    const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
    const [title, setTitle] = useState('');
    const [titleAr, setTitleAr] = useState('');
    const [message, setMessage] = useState('');
    const [messageAr, setMessageAr] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;

    const handlePickImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });
            if (!result.canceled) setImage(result.assets[0].uri);
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const q = query(collection(db, 'notifications'), where('type', '==', 'broadcast'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setNotifications(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') fetchHistory();
    }, [activeTab]);

    const handleDeleteNotification = async (id: string) => {
        Alert.alert(t('delete'), t('areYouSure'), [
            { text: t('cancel'), style: 'cancel' },
            {
                text: t('delete'),
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'notifications', id));
                        setNotifications(prev => prev.filter(n => n.id !== id));
                    } catch (error) {
                        Alert.alert(t('error'), 'Failed to delete notification');
                    }
                }
            }
        ]);
    };

    const handleSend = async () => {
        if (!title || !message) return Alert.alert(t('error'), t('nameRequired'));
        setSending(true);
        try {
            let imageUrl = null;
            if (image && !image.startsWith('http')) {
                imageUrl = await uploadImageToCloudinary(image);
            } else if (image && image.startsWith('http')) {
                imageUrl = image;
            }

            await addDoc(collection(db, 'notifications'), {
                userId: 'ALL',
                title,
                titleAr: titleAr || title,
                message,
                messageAr: messageAr || message,
                image: imageUrl,
                read: false,
                type: 'broadcast',
                createdAt: serverTimestamp()
            });

            const usersSnap = await getDocs(collection(db, 'users'));
            const tokens: string[] = [];
            usersSnap.docs.forEach(doc => {
                const d = doc.data();
                if (d.expoPushToken) tokens.push(d.expoPushToken);
            });

            const uniqueTokens = [...new Set(tokens)];
            if (uniqueTokens.length > 0) {
                const chunkArray = (myArray: string[], chunk_size: number) => {
                    let results = [];
                    while (myArray.length) results.push(myArray.splice(0, chunk_size));
                    return results;
                };

                const chunks = chunkArray([...uniqueTokens], 100);
                const combinedTitle = titleAr ? `${titleAr} | ${title}` : title;
                const combinedBody = messageAr ? `${messageAr} | ${message}` : message;

                for (const chunk of chunks) {
                    const pushMessages = chunk.map(token => ({
                        to: token,
                        sound: 'default',
                        title: combinedTitle,
                        body: combinedBody,
                        data: { type: 'broadcast', image: imageUrl },
                    }));

                    await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'Accept-encoding': 'gzip, deflate',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(pushMessages),
                    });
                }
            }

            Alert.alert(t('broadcastSuccess'), t('thankYou'));
            setTitle(''); setTitleAr(''); setMessage(''); setMessageAr(''); setImage(null);
            setActiveTab('history');
        } catch (e: any) {
            Alert.alert(t('error'), t('broadcastError'));
        } finally {
            setSending(false);
        }
    };

    return (
        <SafeAreaView style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader title={t('broadcast').toUpperCase()} onBack={onBack} scrollY={scrollY} />

            <View style={sc.topNav}>
                <AdminChip
                    label={t('send').toUpperCase()}
                    selected={activeTab === 'send'}
                    onPress={() => setActiveTab('send')}
                />
                <AdminChip
                    label={t('history').toUpperCase()}
                    selected={activeTab === 'history'}
                    onPress={() => setActiveTab('history')}
                />
            </View>

            <Animated.ScrollView
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                contentContainerStyle={sc.scrollContent}
            >
                {activeTab === 'send' ? (
                    <AdminCard>
                        <View style={sc.inputGroup}>
                            <InputLabel text={t('title').toUpperCase()} />
                            <TextInput
                                style={[sc.input, { borderColor: colors.border, color: colors.foreground }]}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Summer Sale..."
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={sc.inputGroup}>
                            <InputLabel text={t('titleAr').toUpperCase()} />
                            <TextInput
                                style={[sc.input, { borderColor: colors.border, color: colors.foreground, textAlign: 'right' }]}
                                value={titleAr}
                                onChangeText={setTitleAr}
                                placeholder="تخفيضات الصيف..."
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={sc.inputGroup}>
                            <InputLabel text={t('message').toUpperCase()} />
                            <TextInput
                                style={[sc.textArea, { borderColor: colors.border, color: colors.foreground }]}
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                placeholder="Get up to 50% off..."
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={sc.inputGroup}>
                            <InputLabel text={t('messageAr').toUpperCase()} />
                            <TextInput
                                style={[sc.textArea, { borderColor: colors.border, color: colors.foreground, textAlign: 'right' }]}
                                value={messageAr}
                                onChangeText={setMessageAr}
                                multiline
                                placeholder="احصل على خصم يصل إلى 50%..."
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <InputLabel text={t('image').toUpperCase()} />
                        <TouchableOpacity
                            onPress={handlePickImage}
                            style={[sc.imagePicker, { borderColor: colors.border, borderStyle: image ? 'solid' : 'dashed' }]}
                        >
                            {image ? <Image source={{ uri: image }} style={sc.pickedImg} /> : (
                                <View style={sc.pickerPlaceholder}>
                                    <ImageIcon size={32} color={colors.textMuted} />
                                    <Text style={[sc.pickerText, { color: colors.textMuted }]}>{t('tapToUpload').toUpperCase()}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={sending}
                            style={[sc.sendBtn, { backgroundColor: colors.foreground }]}
                        >
                            {sending ? <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} /> : (
                                <>
                                    <Text style={[sc.sendBtnText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('broadcastNow').toUpperCase()}</Text>
                                    <Send size={16} color={theme === 'dark' ? '#000' : '#FFF'} />
                                </>
                            )}
                        </TouchableOpacity>
                    </AdminCard>
                ) : (
                    loadingHistory ? <ActivityIndicator style={{ marginTop: 20 }} color={colors.foreground} /> : (
                        notifications.length === 0 ? <EmptyState message={t('noHistory')} subtitle="Vos diffusions apparaîtront ici" icon={<Bell size={36} color={colors.textMuted} strokeWidth={1.5} />} /> : (
                            notifications.map(n => (
                                <AdminCard key={n.id} style={sc.historyCard}>
                                    <View style={sc.historyHeader}>
                                        <Text style={[sc.historyTitle, { color: colors.foreground }]}>{n.title}</Text>
                                        <TouchableOpacity onPress={() => handleDeleteNotification(n.id)}>
                                            <Trash2 size={16} color={colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={[sc.historyMsg, { color: colors.textMuted }]}>{n.message}</Text>
                                    <Text style={[sc.historyTime, { color: colors.textMuted }]}>
                                        {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : ''}
                                    </Text>
                                </AdminCard>
                            ))
                        )
                    )
                )}
                <View style={{ height: 100 }} />
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    topNav: { flexDirection: 'row', gap: 10, padding: 20, paddingTop: 10 },
    scrollContent: { padding: 20, paddingTop: 5 },
    inputGroup: { marginBottom: 16 },
    input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 13, fontWeight: '600' },
    textArea: { height: 80, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 13, fontWeight: '600', textAlignVertical: 'top' },
    imagePicker: { width: '100%', height: 150, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 8 },
    pickedImg: { width: '100%', height: '100%' },
    pickerPlaceholder: { alignItems: 'center', gap: 8 },
    pickerText: { fontSize: 10, fontWeight: '800' },
    sendBtn: { height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 25, flexDirection: 'row', gap: 10 },
    sendBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
    historyCard: { padding: 15 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyTitle: { fontWeight: '800', fontSize: 14 },
    historyMsg: { fontSize: 12, marginTop: 4 },
    historyTime: { fontSize: 9, marginTop: 8 }
});
