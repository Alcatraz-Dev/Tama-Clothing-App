import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    Dimensions,
    Animated,
    FlatList
} from 'react-native';
import {
    ChevronLeft,
    Search,
    UserPlus,
    UserCheck,
    UserX,
    Users,
    User,
    Clock,
    Send,
    Check,
    X,
    Trash2,
    MessageCircle,
    UserMinus,
    MoreVertical
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import {
    doc,
    collection,
    query,
    where,
    onSnapshot,
    getDocs,
    setDoc,
    deleteDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    runTransaction,
    limit,
    documentId,
    getDoc
} from 'firebase/firestore';
import { db } from '../api/firebase';
import * as Animatable from 'react-native-animatable';
import { sendPushNotification } from '../utils/notifications';

const { width } = Dimensions.get('window');

interface FriendsScreenProps {
    onBack: () => void;
    user: any;
    profileData: any;
    theme: 'light' | 'dark';
    t: (key: string) => string;
    language: string;
    onNavigate?: (screen: string, params?: any) => void;
}

export default function FriendsScreen({ onBack, user, profileData, theme, t, language, onNavigate }: FriendsScreenProps) {
    const isDark = theme === 'dark';
    const colors = isDark ? Theme.dark.colors : Theme.light.colors;
    const insets = useSafeAreaInsets();

    const [activeTab, setActiveTab] = useState<'list' | 'requests' | 'search'>('list');
    const [subTab, setSubTab] = useState<'incoming' | 'outgoing'>('incoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [friends, setFriends] = useState<any[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const tr = (en: string, fr: string, ar: string) => {
        return language === 'ar' ? ar : (language === 'fr' ? fr : en);
    };

    useEffect(() => {
        if (!user?.uid) return;

        // Listen for Incoming Requests
        const incomingQ = query(
            collection(db, 'users', user.uid, 'friendRequests'),
            where('status', '==', 'pending')
        );
        const unsubscribeIncoming = onSnapshot(incomingQ, (snapshot) => {
            setIncomingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Listen for Outgoing Requests
        const outgoingQ = query(
            collection(db, 'friendRequests'),
            where('senderId', '==', user.uid),
            where('status', '==', 'pending')
        );
        const unsubscribeOutgoing = onSnapshot(outgoingQ, (snapshot) => {
            setOutgoingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Listen for Friends (Need to fetch actual user data for each UID in profileData.friends)
        const fetchFriendsData = async () => {
            if (!profileData?.friends || profileData.friends.length === 0) {
                setFriends([]);
                setLoading(false);
                return;
            }

            try {
                // Batch fetch users. Note: Firestore 'in' query supports up to 10 items. 
                // We'll take the first 10 for simplicity or chunk them if needed.
                const chunks = [];
                for (let i = 0; i < profileData.friends.length; i += 10) {
                    chunks.push(profileData.friends.slice(i, i + 10));
                }

                let allFriendsData: any[] = [];
                for (const chunk of chunks) {
                    const q = query(collection(db, 'users'), where(documentId(), 'in', chunk));
                    const snap = await getDocs(q);
                    allFriendsData = [...allFriendsData, ...snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }))];
                }
                setFriends(allFriendsData);
            } catch (err) {
                console.error("Error fetching friends data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFriendsData();

        return () => {
            unsubscribeIncoming();
            unsubscribeOutgoing();
        };
    }, [user?.uid, profileData?.friends]);

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const q = query(
                collection(db, 'users'),
                where('fullName', '>=', text),
                where('fullName', '<=', text + '\uf8ff'),
                limit(20)
            );
            const snapshot = await getDocs(q);
            const results = snapshot.docs
                .map(doc => ({ uid: doc.id, ...doc.data() }))
                .filter(u => u.uid !== user?.uid);
            setSearchResults(results);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const sendFriendRequest = async (targetUser: any) => {
        if (!user?.uid) return;

        // Check if already sent
        if (outgoingRequests.some(r => r.receiverId === targetUser.uid)) {
            Alert.alert(t('info'), tr('Request already sent', 'Demande déjà envoyée', 'الطلب تبعث ديجا'));
            return;
        }

        try {
            const requestRef = doc(collection(db, 'friendRequests'));
            const requestData = {
                senderId: user.uid,
                senderName: profileData?.fullName || 'User',
                senderAvatar: profileData?.avatarUrl || '',
                receiverId: targetUser.uid,
                receiverName: targetUser.fullName || targetUser.displayName || 'User',
                receiverAvatar: targetUser.avatarUrl || '',
                status: 'pending',
                timestamp: serverTimestamp()
            };

            await setDoc(requestRef, requestData);
            await setDoc(doc(db, 'users', targetUser.uid, 'friendRequests', requestRef.id), requestData);

            if (targetUser.expoPushToken) {
                sendPushNotification(
                    targetUser.expoPushToken,
                    tr('Nouvelle invitation', 'دعوة جديدة', 'New Invitation'),
                    `${profileData?.fullName || 'User'} ${tr('vous a envoyé une demande d\'ami', 'بعثلك طلب صداقة', 'sent you a friend request')}`
                );
            }

            Alert.alert(t('successTitle'), tr('Friend request sent!', 'Demande envoyée !', 'طلب الصداقة تبعث!'));
        } catch (err) {
            console.error("Error sending request:", err);
            Alert.alert(t('error'), 'Failed to send request');
        }
    };

    const acceptRequest = async (request: any) => {
        try {
            await runTransaction(db, async (transaction) => {
                const meRef = doc(db, 'users', user.uid);
                const themRef = doc(db, 'users', request.senderId);
                const globalRequestRef = doc(db, 'friendRequests', request.id);
                const myRequestRef = doc(db, 'users', user.uid, 'friendRequests', request.id);

                transaction.update(meRef, { friends: arrayUnion(request.senderId) });
                transaction.update(themRef, { friends: arrayUnion(user.uid) });
                transaction.update(globalRequestRef, { status: 'accepted' });
                transaction.delete(myRequestRef);
            });

            // Send notification to the person who sent the request
            try {
                const senderDoc = await getDoc(doc(db, 'users', request.senderId));
                const senderData = senderDoc.data();
                if (senderData?.expoPushToken) {
                    sendPushNotification(
                        senderData.expoPushToken,
                        tr('Invitation acceptée', 'تقبلت الدعوة', 'Invitation accepted'),
                        `${profileData?.fullName || 'User'} ${tr('a accepté votre demande d\'ami', 'قبل طلب الصداقة متاعك', 'accepted your friend request')}`
                    );
                }
            } catch (notifyErr) {
                console.error("Error sending acceptance notification:", notifyErr);
            }

            Alert.alert(t('successTitle'), tr('Friend request accepted!', 'Demande acceptée !', 'قبلت طلب الصداقة!'));
        } catch (err) {
            console.error("Error accepting request:", err);
            Alert.alert(t('error'), 'Failed to accept request');
        }
    };

    const rejectRequest = async (request: any) => {
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'friendRequests', request.id));
            await updateDoc(doc(db, 'friendRequests', request.id), { status: 'rejected' });
        } catch (err) {
            console.error("Error rejecting request:", err);
        }
    };

    const cancelRequest = async (request: any) => {
        try {
            // Delete from recipient's subcollection
            await deleteDoc(doc(db, 'users', request.receiverId, 'friendRequests', request.id));
            // Delete from global collection
            await deleteDoc(doc(db, 'friendRequests', request.id));
            Alert.alert(t('successTitle'), tr('Request cancelled', 'Demande annulée', 'الطلب تلغى'));
        } catch (err) {
            console.error("Error cancelling request:", err);
            Alert.alert(t('error'), 'Failed to cancel request');
        }
    };

    const removeFriend = (friendId: string, friendName: string) => {
        Alert.alert(
            tr('Remove Friend', 'Supprimer Ami', 'نحي الصاحب'),
            `${tr('Are you sure you want to remove', 'Voulez-vous supprimer', 'متأكد تحب تنحي')} ${friendName}?`,
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: tr('Remove', 'Supprimer', 'حذف'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await runTransaction(db, async (transaction) => {
                                const meRef = doc(db, 'users', user.uid);
                                const themRef = doc(db, 'users', friendId);
                                transaction.update(meRef, { friends: arrayRemove(friendId) });
                                transaction.update(themRef, { friends: arrayRemove(user.uid) });
                            });
                        } catch (err) {
                            console.error("Error removing friend:", err);
                        }
                    }
                }
            ]
        );
    };

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: colors.card }]}>
                    <ChevronLeft size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                    {tr('Friends & Connections', 'Mes Amis', 'أصحابي و علاقاتي')}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
                {[
                    { id: 'list', label: tr('Friends', 'Amis', 'الأصحاب'), icon: Users },
                    { id: 'requests', label: tr('Requests', 'Demandes', 'الطلبات'), icon: Clock, count: incomingRequests.length + outgoingRequests.length },
                    { id: 'search', label: tr('Discover', 'Découvrir', 'اكتشف'), icon: Search }
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id as any)}
                        style={[styles.tabItem, activeTab === tab.id && { backgroundColor: isDark ? '#FFF' : '#000' }]}
                    >
                        <tab.icon size={16} color={activeTab === tab.id ? (isDark ? '#000' : '#FFF') : colors.textMuted} />
                        <Text style={[styles.tabLabel, { color: activeTab === tab.id ? (isDark ? '#000' : '#FFF') : colors.textMuted }]}>
                            {tab.label}
                        </Text>
                        {(tab.count ?? 0) > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{tab.count}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderUserItem = (item: any, type: 'friend' | 'search' | 'incoming' | 'outgoing') => (
        <Animatable.View animation="fadeInUp" duration={400} style={[styles.userCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity
                style={styles.userCardInfo}
                onPress={() => onNavigate?.('PublicProfile', item.uid ? item : { ...item, uid: type === 'incoming' ? item.senderId : item.receiverId })}
            >
                <View style={styles.avatarContainer}>
                    {item.avatarUrl || item.senderAvatar || item.receiverAvatar ? (
                        <Image
                            source={{ uri: item.avatarUrl || item.senderAvatar || item.receiverAvatar }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#2A2A35' : '#E5E5EA' }]}>
                            <User size={24} color={colors.textMuted} />
                        </View>
                    )}
                    {type === 'friend' && <View style={styles.onlineStatus} />}
                </View>
                <View style={styles.userDetails}>
                    <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
                        {item.fullName || item.senderName || item.receiverName}
                    </Text>
                    <Text style={[styles.userStatus, { color: colors.textMuted }]} numberOfLines={1}>
                        {type === 'friend' ? tr('En ligne', 'En ligne', 'متصل') : (item.bio || tr('Membre Tama', 'Membre Tama', 'عضو تاما'))}
                    </Text>
                </View>
            </TouchableOpacity>

            <View style={styles.userActions}>
                {type === 'friend' && (
                    <>
                        <TouchableOpacity style={[styles.actionBtnIcon, { backgroundColor: colors.info + '20' }]}>
                            <MessageCircle size={18} color={colors.info} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => removeFriend(item.uid, item.fullName)}
                            style={[styles.actionBtnIcon, { backgroundColor: '#FF3B3020' }]}
                        >
                            <Trash2 size={18} color="#FF3B30" />
                        </TouchableOpacity>
                    </>
                )}
                {type === 'search' && (
                    <TouchableOpacity
                        onPress={() => sendFriendRequest(item)}
                        style={[styles.actionBtn, { backgroundColor: isDark ? '#FFF' : '#000' }]}
                    >
                        <UserPlus size={16} color={isDark ? '#000' : '#FFF'} />
                        <Text style={[styles.actionLabel, { color: isDark ? '#000' : '#FFF' }]}>{tr('Ajouter', 'Ajouter', 'إضافة')}</Text>
                    </TouchableOpacity>
                )}
                {type === 'incoming' && (
                    <View style={styles.requestActions}>
                        <TouchableOpacity
                            onPress={() => acceptRequest(item)}
                            style={[styles.actionBtnSmall, { backgroundColor: '#34C759' }]}
                        >
                            <Check size={18} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => rejectRequest(item)}
                            style={[styles.actionBtnSmall, { backgroundColor: '#FF3B30' }]}
                        >
                            <X size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}
                {type === 'outgoing' && (
                    <View style={styles.requestActions}>
                        <View style={styles.statusBadge}>
                            <Clock size={12} color={colors.textMuted} />
                            <Text style={[styles.statusText, { color: colors.textMuted }]}>{tr('Pending', 'En attente', 'يستنى')}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => cancelRequest(item)}
                            style={[styles.actionBtnSmall, { backgroundColor: '#FF3B30' }]}
                        >
                            <Trash2 size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Animatable.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {renderHeader()}

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {activeTab === 'search' && (
                    <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
                        <Search size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.foreground }]}
                            placeholder={tr('Find new friends...', 'Trouver des amis', 'لوج على أصحاب جدد...')}
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        {isSearching && <ActivityIndicator size="small" color={colors.info} />}
                    </View>
                )}

                {activeTab === 'requests' && (
                    <View style={[styles.subTabContainer, { backgroundColor: colors.card }]}>
                        <TouchableOpacity
                            onPress={() => setSubTab('incoming')}
                            style={[styles.subTab, subTab === 'incoming' && { backgroundColor: isDark ? '#FFF' : '#000' }]}
                        >
                            <Text style={[styles.subTabLabel, { color: subTab === 'incoming' ? (isDark ? '#000' : '#FFF') : colors.textMuted }]}>
                                {tr('Received', 'Reçues', 'اللي وصلوني')} ({incomingRequests.length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setSubTab('outgoing')}
                            style={[styles.subTab, subTab === 'outgoing' && { backgroundColor: isDark ? '#FFF' : '#000' }]}
                        >
                            <Text style={[styles.subTabLabel, { color: subTab === 'outgoing' ? (isDark ? '#000' : '#FFF') : colors.textMuted }]}>
                                {tr('Sent', 'Envoyées', 'اللي بعثتهم')} ({outgoingRequests.length})
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.listSection}>
                    {activeTab === 'list' && (
                        loading ? (
                            <ActivityIndicator color={colors.info} style={{ marginTop: 40 }} />
                        ) : friends.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Users size={64} color={colors.textMuted} strokeWidth={1} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    {tr('Vous n\'avez pas encore d\'amis', 'Aucun ami', 'ليس لديك أصدقاء بعد')}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setActiveTab('search')}
                                    style={[styles.emptyBtn, { borderColor: colors.info }]}
                                >
                                    <Text style={{ color: colors.info, fontWeight: '700' }}>{tr('Découvrir', 'Découvrir', 'اكتشاف')}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            friends.map(item => (
                                <View key={item.uid || item.id}>
                                    {renderUserItem(item, 'friend')}
                                </View>
                            ))
                        )
                    )}

                    {activeTab === 'search' && (
                        searchQuery.length < 3 ? (
                            <View style={styles.emptyState}>
                                <Search size={64} color={colors.textMuted} strokeWidth={1} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    {tr('Search by full name', 'Tapez pour chercher', 'لوج بالاسم الكامل')}
                                </Text>
                            </View>
                        ) : searchResults.length === 0 && !isSearching ? (
                            <View style={styles.emptyState}>
                                <UserX size={64} color={colors.textMuted} strokeWidth={1} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    {tr('No user found', 'Aucun résultat', 'ما لقينا حد')}
                                </Text>
                            </View>
                        ) : (
                            searchResults.map(item => (
                                <View key={item.uid || item.id}>
                                    {renderUserItem(item, 'search')}
                                </View>
                            ))
                        )
                    )}

                    {activeTab === 'requests' && (
                        subTab === 'incoming' ? (
                            incomingRequests.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Clock size={64} color={colors.textMuted} strokeWidth={1} />
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                        {tr('No requests received', 'Aucune demande', 'ما وصلك حتى طلب')}
                                    </Text>
                                </View>
                            ) : (
                                incomingRequests.map(item => (
                                    <View key={item.id}>
                                        {renderUserItem(item, 'incoming')}
                                    </View>
                                ))
                            )
                        ) : (
                            outgoingRequests.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Send size={64} color={colors.textMuted} strokeWidth={1} />
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                        {tr('No requests sent', 'Aucune demande', 'ما بعثت حتى طلب')}
                                    </Text>
                                </View>
                            ) : (
                                outgoingRequests.map(item => (
                                    <View key={item.id}>
                                        {renderUserItem(item, 'outgoing')}
                                    </View>
                                ))
                            )
                        )
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        zIndex: 100,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    tabBar: {
        flexDirection: 'row',
        padding: 5,
        borderRadius: 22,
        gap: 5,
    },
    tabItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 18,
        gap: 8,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '800',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: 5,
        backgroundColor: '#FF3B30',
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 54,
        borderRadius: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        fontWeight: '600',
    },
    subTabContainer: {
        flexDirection: 'row',
        borderRadius: 15,
        padding: 4,
        marginBottom: 20,
    },
    subTab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    subTabLabel: {
        fontSize: 12,
        fontWeight: '800',
    },
    listSection: {
        gap: 12,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    userCardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 22,
    },
    avatarPlaceholder: {
        width: 54,
        height: 54,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#34C759',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    userDetails: {
        marginLeft: 15,
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '800',
    },
    userStatus: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    userActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtnIcon: {
        width: 38,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 38,
        borderRadius: 14,
        gap: 6,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '800',
    },
    requestActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtnSmall: {
        width: 38,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 10,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 15,
        opacity: 0.6,
    },
    emptyBtn: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 15,
        borderWidth: 1,
    }
});
