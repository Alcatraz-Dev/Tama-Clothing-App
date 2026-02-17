import React, {
    useEffect,
    useState,
    useRef,
    useMemo
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    FlatList,
    Platform,
    StatusBar,
    RefreshControl,
    Animated,
    Share,
    Alert,
    Linking
} from 'react-native';
import { collection, query, where, getDocs, onSnapshot, collectionGroup, orderBy, limit, doc, getDoc, updateDoc, increment, addDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { Video, ResizeMode } from 'expo-av';
import { db } from '../api/firebase';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import {
    Flame,
    Star,
    Play,
    Users,
    MessageCircle,
    MessageSquare,
    Heart,
    Share2,
    Volume2,
    Eye,
    TrendingUp,
    Clock,
    User,
    ChevronRight,
    Laugh,
    DownloadCloud,
    Send,
    Repeat,
    ThumbsDown,
    Ghost,
    Sparkles,
    Pause
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Theme } from '../theme';
import { LiveSessionService } from '../services/LiveSessionService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeedItem {
    id: string;
    type: 'live' | 'work' | 'ad';
    data: any;
    score: number;
    createdAt: any;
}

interface FeedScreenProps {
    t: (key: string) => string;
    theme: 'light' | 'dark';
    language: string;
    onNavigate: (screen: string, params?: any) => void;
    onJoinLive: (channelId: string) => void;
    onWorkPress?: (work: any, targetUid: string) => void;
    onCommentPress?: (work: any, targetUid: string) => void;
    onUserPress?: (userId: string) => void;
    onCampaignPress?: (campaign: any) => void;
    user?: any;
    profileData?: any;
    ads?: any[];
}

export default function FeedScreen(props: FeedScreenProps) {
    const { t, theme, language, onNavigate, onJoinLive, onWorkPress, onCommentPress, onUserPress, onCampaignPress, user, profileData, ads = [] } = props;
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [feedFilter, setFeedFilter] = useState<'default' | 'viral' | 'comments'>('default');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [lives, setLives] = useState<FeedItem[]>([]);
    const [works, setWorks] = useState<FeedItem[]>([]);
    const [pausedItems, setPausedItems] = useState<string[]>([]);

    const togglePlayPause = (id: string) => {
        setPausedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveId(viewableItems[0].key);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    const feedItemsCombined = useMemo(() => {
        let combined = [...lives, ...works];
        combined.sort((a, b) => {
            const aUrgent = (a.type === 'live' && a.score >= 50) || (a.type === 'work' && a.score >= 100);
            const bUrgent = (b.type === 'live' && b.score >= 50) || (b.type === 'work' && b.score >= 100);

            if (aUrgent && !bUrgent) return -1;
            if (!aUrgent && bUrgent) return 1;
            if (aUrgent && bUrgent) return b.score - a.score;

            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });

        // Inject ADS at random intervals (every 4-7 items)
        if (ads.length > 0 && combined.length > 2) {
            const adItems: FeedItem[] = ads.map(a => ({
                id: `ad-${a.id}`,
                type: 'ad',
                data: a,
                score: 0,
                createdAt: serverTimestamp()
            }));

            // Shuffle ads
            const shuffledAds = [...adItems].sort(() => Math.random() - 0.5);

            let result: FeedItem[] = [];
            let adIndex = 0;
            let nextAdPos = Math.floor(Math.random() * 3) + 3; // Initial ad position between 3-5

            for (let i = 0; i < combined.length; i++) {
                result.push(combined[i]);
                if (result.length === nextAdPos && adIndex < shuffledAds.length) {
                    result.push(shuffledAds[adIndex]);
                    adIndex++;
                    nextAdPos += Math.floor(Math.random() * 4) + 4; // Next ad after another 4-7 items
                }
            }
            return result;
        }

        return combined;
    }, [lives, works, ads]);

    const sortedFeedItems = useMemo(() => {
        let items = [...feedItemsCombined];
        if (feedFilter === 'viral') {
            return items.sort((a, b) => b.score - a.score);
        }
        if (feedFilter === 'comments') {
            return items.sort((a, b) => (b.data.commentsCount || 0) - (a.data.commentsCount || 0));
        }
        return items;
    }, [feedItemsCombined, feedFilter]);

    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';

    const scrollY = useRef(new Animated.Value(0)).current;

    const tr = (fr: string, ar: string, en: string) => {
        if (language === 'ar') return ar;
        if (language === 'fr') return fr;
        return en;
    };

    const getTranslated = (obj: any) => {
        if (!obj) return '';
        if (typeof obj === 'string') return obj;
        return obj[language] || obj['en'] || obj['fr'] || '';
    };

    const getTotalStats = (work: any) => {
        if (!work) return 0;
        const totalReactions = work.reactions ? Object.values(work.reactions).reduce((a: any, b: any) => (a as number) + (b as number), 0) : 0;
        const commentsCount = work.commentsCount || 0;
        return (totalReactions as number) + commentsCount;
    };

    const isViral = (work: any) => {
        return getTotalStats(work) >= 100;
    };

    useEffect(() => {
        setLoading(true);

        // 1. Real-time Listener for Active Lives
        const livesQuery = query(
            collection(db, 'Live_sessions'),
            where('status', '==', 'live'),
            limit(10)
        );

        const unsubscribeLives = onSnapshot(livesQuery, (snapshot) => {
            const liveItems: FeedItem[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: 'live',
                    data,
                    score: data.totalLikes || 0,
                    createdAt: data.startedAt || { seconds: Date.now() / 1000 }
                };
            });
            setLives(liveItems);
            // If lives update, we might still be loading works
        });

        // 2. Real-time Listener for Works
        const worksQuery = query(
            collectionGroup(db, 'works'),
            limit(30)
        );

        // Persistent cache for profiles within this screen's lifecycle
        const userProfiles: Record<string, any> = {};

        const unsubscribeWorks = onSnapshot(worksQuery, async (snapshot) => {
            const rawDocs = snapshot.docs.map(doc => {
                const data = doc.data();
                const fullPath = doc.ref.path;
                const parentPath = doc.ref.parent.path;
                const segments = parentPath.split('/');
                // Robust extraction: if it's users/UID/works, userId is segments[1]
                const userId = segments[0] === 'users' ? segments[1] : (data.userId || data.authorId || segments[1]);
                return { id: doc.id, data, userId, fullPath };
            });

            // Fetch missing profiles
            const missingUids = [...new Set(rawDocs.filter(w => !userProfiles[w.userId]).map(w => w.userId))];
            if (missingUids.length > 0) {
                await Promise.all(missingUids.map(async (uid) => {
                    try {
                        const snap = await getDoc(doc(db, 'users', uid));
                        if (snap.exists()) userProfiles[uid] = snap.data();
                    } catch (e) {
                        console.warn('Error fetching user profile:', uid);
                    }
                }));
            }

            const workItems: FeedItem[] = rawDocs.map(({ id, data, userId, fullPath }) => {
                const profile = userProfiles[userId];
                const finalUrl = data.url || data.imageUrl || data.mediaUrl;
                return {
                    id,
                    type: 'work',
                    data: {
                        ...data,
                        id,
                        userId,
                        userName: profile?.displayName || profile?.fullName || 'User',
                        userPhoto: profile?.avatarUrl || profile?.photoURL || profile?.image || null,
                        imageUrl: finalUrl,
                        fullPath: fullPath,
                        type: data.type || (finalUrl?.includes('.mp4') ? 'video' : 'image')
                    },
                    score: getTotalStats(data),
                    createdAt: data.createdAt || { seconds: Date.now() / 1000 }
                };
            });
            setWorks(workItems);
            setLoading(false);
            setRefreshing(false);
        });

        return () => {
            unsubscribeLives();
            unsubscribeWorks();
        };
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 800);
    };

    const renderLiveItem = (item: FeedItem, isActive: boolean) => {
        const session = item.data;
        const isDark = theme === 'dark';
        const liveUrl = session.url || session.playbackUrl || session.hlsUrl;

        return (
            <View style={styles.liveCard}>
                {liveUrl ? (
                    <Video
                        source={{ uri: liveUrl }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={isActive}
                        isLooping
                        isMuted={false}
                    />
                ) : (
                    <Image
                        source={{ uri: session.hostAvatar }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                    />
                )}

                <LinearGradient
                    colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
                    locations={[0, 0.2, 0.6, 1]}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                />

                {/* Top Glass Badges - Left aligned with Host Icon */}
                <View style={[styles.liveBadgeContainer, { top: insets.top + 20, justifyContent: 'flex-start', gap: 10 }]}>
                    {/* Host Mini Icon as requested */}
                    <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        borderWidth: 1.5,
                        borderColor: '#FF4D67',
                        overflow: 'hidden',
                        backgroundColor: '#333'
                    }}>
                        <Image source={{ uri: session.hostAvatar }} style={{ width: '100%', height: '100%' }} />
                    </View>

                    <BlurView intensity={40} tint="dark" style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.2)',
                        overflow: 'hidden',
                        gap: 6
                    }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' }} />
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>
                            {tr('EN DIRECT', 'مباشر', 'LIVE')}
                        </Text>
                    </BlurView>

                    <BlurView intensity={30} tint="dark" style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                        gap: 5
                    }}>
                        <Eye size={12} color="#FFF" />
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>{session.viewCount || 0}</Text>
                    </BlurView>
                </View>

                {/* Host Info Section */}
                <View style={{
                    position: 'absolute',
                    bottom: 180,
                    left: 16,
                    right: 16,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: '#333',
                            borderWidth: 1.5,
                            borderColor: '#FFF',
                            overflow: 'hidden',
                            marginRight: 12
                        }}>
                            <Image source={{ uri: session.hostAvatar }} style={{ width: '100%', height: '100%' }} />
                        </View>
                        <View>
                            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }}>
                                {session.hostName}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Flame size={14} color="#FF8A00" fill="#FF8A00" />
                                <Text style={{ color: '#FF8A00', fontSize: 12, fontWeight: '800' }}>
                                    {session.totalLikes || 0} {tr('Flammes', 'نار', 'Flames')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text style={{
                        color: '#FFF',
                        fontSize: 24,
                        fontWeight: '900',
                        textShadowColor: 'rgba(0,0,0,0.5)',
                        textShadowRadius: 10,
                        lineHeight: 30
                    }}>
                        {session.title || `${session.hostName} is Live!`}
                    </Text>
                </View>

                {/* Floating Join CTA */}
                <View style={{
                    position: 'absolute',
                    bottom: 110,
                    left: 16,
                    right: 16,
                }}>
                    <TouchableOpacity
                        onPress={() => onJoinLive(session.channelId)}
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: '#EF4444', // Hot Red for Live Action
                            paddingVertical: 14,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            gap: 10,
                            shadowColor: '#EF4444',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.5,
                            shadowRadius: 12,
                            elevation: 8
                        }}
                    >
                        <Animatable.View
                            animation="pulse"
                            iterationCount="infinite"
                            duration={1500}
                        >
                            <Play size={20} color="#FFF" fill="#FFF" />
                        </Animatable.View>
                        <Text style={{
                            color: '#FFF',
                            fontSize: 15,
                            fontWeight: '900',
                            letterSpacing: 1
                        }}>
                            {tr('REJOINDRE LE LIVE', 'انضم الآن', 'JOIN LIVE')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Center Pulse (Subtle Indicator) */}
                <Animatable.View
                    animation="pulse"
                    iterationCount="infinite"
                    style={{
                        position: 'absolute',
                        top: '40%',
                        left: '50%',
                        marginLeft: -25,
                        marginTop: -25,
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: -1
                    }}
                >
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' }} />
                </Animatable.View>
            </View>
        );
    };

    const handleReaction = async (work: any, type: string = 'love') => {
        if (!user) {
            Alert.alert(tr('Connexion requise', 'تسجيل الدخول مطلوب', 'Login Required'), tr('Veuillez vous connecter pour réagir', 'يرجى تسجيل الدخول للتفاعل', 'Please login to react'));
            return;
        }

        const workId = work.id;
        // work.userId is the Author ID (from fetchFeed mapping)
        const authorId = work.userId;

        const currentReactions = work.userReactions || {};
        const previousReaction = currentReactions[user.uid];

        // 1. Calculate Optimistic State
        let newReactionsCounts = { ...work.reactions };
        let newUserReactions = { ...currentReactions };

        if (previousReaction === type) {
            // Toggle OFF (Remove)
            delete newUserReactions[user.uid];
            newReactionsCounts[type] = Math.max(0, (newReactionsCounts[type] || 0) - 1);
        } else {
            // New or Switch
            if (previousReaction) {
                // Decrement old
                newReactionsCounts[previousReaction] = Math.max(0, (newReactionsCounts[previousReaction] || 0) - 1);
            }
            // Increment new
            newReactionsCounts[type] = (newReactionsCounts[type] || 0) + 1;
            newUserReactions[user.uid] = type;
        }

        // 2. Apply Optimistic Update
        setFeedItems(prev => prev.map(item => {
            if (item.id === workId) {
                return {
                    ...item,
                    data: {
                        ...item.data,
                        reactions: newReactionsCounts,
                        userReactions: newUserReactions
                    },
                    score: getTotalStats({ ...item.data, reactions: newReactionsCounts })
                };
            }
            return item;
        }));

        // 3. Persist to Firestore
        try {
            const workRef = work.fullPath
                ? doc(db, work.fullPath)
                : doc(db, 'users', authorId, 'works', workId);
            const updates: any = {};

            if (previousReaction === type) {
                // Remove
                updates[`reactions.${type}`] = increment(-1);
                updates[`userReactions.${user.uid}`] = deleteField();
            } else {
                // Add or Switch
                updates[`reactions.${type}`] = increment(1);
                updates[`userReactions.${user.uid}`] = type;
                if (previousReaction) {
                    updates[`reactions.${previousReaction}`] = increment(-1);
                }
            }
            await updateDoc(workRef, updates);
        } catch (e) {
            console.error('Error reacting:', e);
            // Ideally revert optimistic update here, but omitted for brevity
        }
    };

    const handleShare = async (work: any) => {
        try {
            const url = work.imageUrl || work.url;
            if (!url) return;

            // Download file first to share "cleanly" (hides res.cloudinary.com)
            const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
            const fileUri = FileSystem.cacheDirectory + `share_${work.id}.${extension}`;

            const { uri } = await FileSystem.downloadAsync(url, fileUri);

            await Share.share({
                message: `${work.text || 'Check this out!'} \nShared via Tama App`,
                url: uri, // Sharing local URI shares the file
            });
        } catch (e) {
            console.error('Error sharing:', e);
            // Fallback
            await Share.share({
                message: `Check out this work on Tama: ${work.text || ''}`,
                url: work.url || work.imageUrl
            });
        }
    };

    const handleDownload = async (work: any) => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(tr('Erreur', 'خطأ', 'Error'), tr('Permission refusée', 'تم رفض الإذن', 'Permission denied'));
                return;
            }

            const url = work.imageUrl || work.url;
            if (!url) return;

            const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
            const fileUri = FileSystem.documentDirectory + `tama_${work.id}.${extension}`;

            const { uri } = await FileSystem.downloadAsync(url, fileUri);
            await MediaLibrary.createAssetAsync(uri);

            Alert.alert(tr('Succès', 'نجاح', 'Success'), tr('Enregistré dans la galerie', 'تم حفظ الملف', 'Saved to gallery'));
        } catch (e) {
            console.error('Download Error', e);
            Alert.alert(tr('Erreur', 'خطأ', 'Error'), tr('Échec du téléchargement', 'فشل التحميل', 'Download failed'));
        }
    };

    const handleRepost = async (work: any) => {
        if (!user) {
            Alert.alert(tr('Connexion requise', 'تسجيل الدخول مطلوب', 'Login Required'), tr('Veuillez vous connecter pour republier', 'يرجى تسجيل الدخول لإعادة النشر', 'Please login to repost'));
            return;
        }
        try {
            await addDoc(collection(db, 'users', user.uid, 'works'), {
                ...work,
                repostedFrom: profileData?.uid || profileData?.id || user.uid,
                repostedFromName: profileData?.fullName || 'User',
                createdAt: serverTimestamp(),
                reactions: {},
                userReactions: {},
                commentsCount: 0
            });
            Alert.alert(tr('Succès', 'نجاح', 'Success'), tr('Republié sur votre profil', 'تم إعادة النشر', 'Reposted to your profile'));
        } catch (e) {
            console.error('Repost error:', e);
            Alert.alert(tr('Erreur', 'خطأ', 'Error'), tr('Échec de la republication', 'فشل إعادة النشر', 'Failed to repost'));
        }
    };

    const renderStatsPills = (work: any) => (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8, zIndex: 20 }}>
            {/* Comment Count Pill */}
            {((work.commentsCount || 0) > 0) && (
                <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' }}>
                    <MessageSquare size={10} color="#FFF" strokeWidth={2.5} />
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>{work.commentsCount}</Text>
                </View>
            )}
            {/* Reactions Pills */}
            {[
                { type: 'love', Icon: Heart, color: '#FF4D67' },
                { type: 'fire', Icon: Flame, color: '#FF8A00' },
                { type: 'haha', Icon: Laugh, color: '#FFD600' },
                { type: 'bad', Icon: ThumbsDown, color: '#94A3B8' },
                { type: 'ugly', Icon: Ghost, color: '#818CF8' },
                { type: 'interesting', Icon: Sparkles, color: '#A855F7' }
            ].map((r) => {
                const count = work.reactions?.[r.type] || 0;
                // Highlight if user reacted with this type
                const isSelected = work.userReactions?.[user?.uid] === r.type;

                if (count === 0 && !isSelected) return null;

                return (
                    <TouchableOpacity
                        key={r.type}
                        onPress={() => handleReaction(work, r.type)}
                        style={{
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.6)',
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                            borderWidth: isSelected ? 1 : 0.5,
                            borderColor: isSelected ? r.color : 'rgba(255,255,255,0.2)'
                        }}
                    >
                        <r.Icon size={10} color={r.color} fill={isSelected ? r.color : "transparent"} strokeWidth={2.5} />
                        <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>{count}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const renderAdItem = (item: FeedItem, isActive: boolean) => {
        const ad = item.data;
        const isVideo = ad.type === 'video';

        return (
            <View style={styles.workCard}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => togglePlayPause(item.id)}
                    style={StyleSheet.absoluteFillObject}
                >
                    {isVideo ? (
                        <Video
                            source={{ uri: ad.url }}
                            style={StyleSheet.absoluteFillObject}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={isActive && !pausedItems.includes(item.id)}
                            isLooping
                            isMuted
                        />
                    ) : (
                        <Image
                            source={{ uri: ad.url }}
                            style={StyleSheet.absoluteFillObject}
                            resizeMode="cover"
                        />
                    )}

                    {isVideo && pausedItems.includes(item.id) && (
                        <View style={{
                            ...StyleSheet.absoluteFillObject,
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10
                        }}>
                            <Play size={60} color="#FFF" fill="rgba(255,255,255,0.4)" />
                        </View>
                    )}
                </TouchableOpacity>

                <LinearGradient
                    colors={['rgba(0,0,0,0.5)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
                    locations={[0, 0.2, 0.6, 1]}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                />

                {/* Top Glass Sponsored Badge */}
                <View style={{
                    position: 'absolute',
                    top: insets.top + 20, // Now at the very top
                    left: 20,
                    zIndex: 20
                }}>
                    <BlurView intensity={30} tint="dark" style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 30, // Fully rounded
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.2)',
                        overflow: 'hidden',
                    }}>
                        <Star size={12} color="#FBBF24" fill="#FBBF24" />
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900', marginLeft: 6, letterSpacing: 1 }}>
                            {tr('SPONSORISÉ', 'ممول', 'SPONSORED')}
                        </Text>
                    </BlurView>
                </View>

                {/* Ad Content & Brand */}
                <View style={{
                    position: 'absolute',
                    bottom: 180,
                    left: 16,
                    right: 16,
                }}>
                    {/* Brand Entity */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: isDark ? '#FFF' : '#000',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 10,
                            borderWidth: 2,
                            borderColor: 'rgba(255,255,255,0.3)'
                        }}>
                            <Sparkles size={18} color={isDark ? '#000' : '#FFF'} />
                        </View>
                        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }}>
                            TAMA CLOTHING
                        </Text>
                    </View>

                    <Text style={{
                        color: '#FFF',
                        fontSize: 26,
                        fontWeight: '900',
                        textShadowColor: 'rgba(0,0,0,0.5)',
                        textShadowRadius: 10,
                        marginBottom: 6,
                        lineHeight: 32
                    }}>
                        {getTranslated(ad.title)}
                    </Text>

                    {ad.description && (
                        <Text style={{
                            color: 'rgba(255,255,255,0.95)',
                            fontSize: 15,
                            fontWeight: '600',
                            textShadowColor: 'rgba(0,0,0,0.5)',
                            textShadowRadius: 5,
                            lineHeight: 20
                        }}>
                            {getTranslated(ad.description)}
                        </Text>
                    )}
                </View>

                {/* Theme-Aware Floating CTA */}
                <View style={{
                    position: 'absolute',
                    bottom: 110, // Slightly higher for better thumb reach
                    left: 16,
                    right: 16,
                }}>
                    <TouchableOpacity
                        onPress={() => onCampaignPress?.(ad)}
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: isDark ? '#FFF' : '#000', // Dynamic Theme Color
                            paddingVertical: 14,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            gap: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.4,
                            shadowRadius: 10,
                            elevation: 8
                        }}
                    >
                        <Text style={{
                            color: isDark ? '#000' : '#FFF', // Inverse Text Color
                            fontSize: 15,
                            fontWeight: '900',
                            letterSpacing: 1
                        }}>
                            {tr('DÉCOUVRIR', 'اكتشف', 'DISCOVER')}
                        </Text>
                        <ChevronRight size={20} color={isDark ? '#000' : '#FFF'} strokeWidth={3} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderWorkItem = (item: FeedItem, isActive: boolean) => {
        const work = item.data;
        const score = item.score;
        const viral = isViral(work);
        const isVideo = work.type === 'video' || (work.imageUrl && work.imageUrl.includes('.mp4'));

        return (
            <View style={styles.workCard}>
                {/* Media Content */}
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => isVideo ? togglePlayPause(item.id) : onWorkPress?.(work, work.userId)}
                    style={StyleSheet.absoluteFillObject}
                >
                    {isVideo && work.imageUrl ? (
                        <Video
                            source={{ uri: work.imageUrl }}
                            style={StyleSheet.absoluteFillObject}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={isActive && !pausedItems.includes(item.id)}
                            isLooping
                            isMuted={false}
                        />
                    ) : (work.imageUrl ? (
                        <Image
                            source={{ uri: work.imageUrl }}
                            style={StyleSheet.absoluteFillObject}
                            resizeMode="cover"
                        />
                    ) : (
                        <LinearGradient
                            colors={['#8B5CF6', '#EC4899']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', padding: 10 }]}
                        >
                            <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: 'bold', fontSize: 13 }} numberOfLines={4}>
                                {work.text}
                            </Text>
                        </LinearGradient>
                    ))}

                    {isVideo && pausedItems.includes(item.id) && (
                        <View style={{
                            ...StyleSheet.absoluteFillObject,
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10
                        }}>
                            <Play size={60} color="#FFF" fill="rgba(255,255,255,0.4)" />
                        </View>
                    )}
                </TouchableOpacity>

                {/* Video Indicator Overlay */}
                {isVideo && (
                    <View
                        pointerEvents="none"
                        style={{ position: 'absolute', top: 50, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 }}
                    >
                        <Play size={12} color="#FFF" fill="#FFF" />
                    </View>
                )}

                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.6)']}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                />

                {viral && (
                    <View style={styles.viralBadge}>
                        <TrendingUp size={14} color="#FFF" />
                        <Text style={styles.viralText}>{tr('VIRAL', 'فيروسي', 'VIRAL')}</Text>
                    </View>
                )}

                {/* Top Right Actions (Traveaux Style Stack) */}
                <View style={{
                    position: 'absolute',
                    right: 16,
                    bottom: 250, // Positioned above text/reactions
                    alignItems: 'center',
                    gap: 16,
                    zIndex: 50
                }}>
                    {/* Author Profile */}
                    <TouchableOpacity
                        onPress={() => onUserPress ? onUserPress(work.userId) : onWorkPress?.(work, work.userId)}
                        style={{ marginBottom: 4, alignItems: 'center' }}
                    >
                        <View style={{
                            width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#FFF',
                            alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#333'
                        }}>
                            {work.userPhoto ? <Image source={{ uri: work.userPhoto }} style={{ width: '100%', height: '100%' }} /> : <User size={20} color="#FFF" />}
                        </View>
                        {!(profileData?.friends?.includes(work.userId) || work.userId === user?.uid) && (
                            <View style={{
                                position: 'absolute', bottom: -5, width: 16, height: 16, borderRadius: 8, backgroundColor: '#A855F7',
                                alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>+</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Comment */}
                    <TouchableOpacity onPress={() => onCommentPress?.(work, work.userId)} style={{ alignItems: 'center' }}>
                        <View style={{
                            width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
                        }}>
                            <MessageSquare size={18} color="#FFF" strokeWidth={2.5} />
                        </View>
                        <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900', marginTop: 6, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } }}>
                            {work.commentsCount || 0}
                        </Text>
                    </TouchableOpacity>

                    {/* Repost */}
                    <TouchableOpacity onPress={() => handleRepost(work)} style={{ alignItems: 'center' }}>
                        <View style={{
                            width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
                        }}>
                            <Repeat size={18} color="#FFF" strokeWidth={2} />
                        </View>
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 }}>
                            {tr('Republier', 'نشر', 'Repost')}
                        </Text>
                    </TouchableOpacity>

                    {/* Download */}
                    <TouchableOpacity onPress={() => handleDownload(work)} style={{ alignItems: 'center' }}>
                        <View style={{
                            width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
                        }}>
                            <DownloadCloud size={18} color="#FFF" strokeWidth={2} />
                        </View>
                        <View>
                            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 }}>{tr('Télécharger', 'تحميل', 'Download')}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Share (Changed Icon) */}
                    <TouchableOpacity onPress={() => handleShare(work)} style={{ alignItems: 'center' }}>
                        <View style={{
                            width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
                        }}>
                            <Send size={18} color="#FFF" strokeWidth={2} />
                        </View>
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 }}>
                            {tr('Share', 'مشاركة', 'Share')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Reaction Bar (Traveaux Style) */}
                <View style={{
                    position: 'absolute',
                    bottom: 96,
                    left: 12,
                    right: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    borderRadius: 24,
                    backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.15)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                    zIndex: 20
                }}>
                    {[
                        { type: 'love', Icon: Heart, color: '#FF4D67', label: tr('AMOUR', 'حب', 'LOVE') },
                        { type: 'fire', Icon: Flame, color: '#FF8A00', label: tr('FEU', 'نار', 'FIRE') },
                        { type: 'haha', Icon: Laugh, color: '#FFD600', label: tr('DRÔLE', 'مضحك', 'HAHA') },
                        { type: 'bad', Icon: ThumbsDown, color: '#94A3B8', label: tr('BOF', 'سيء', 'BAD') },
                        { type: 'ugly', Icon: Ghost, color: '#818CF8', label: tr('MOCHE', 'بشع', 'UGLY') },
                        { type: 'interesting', Icon: Sparkles, color: '#A855F7', label: tr('TOP', 'مثير', 'COOL') }
                    ].map((btn) => {
                        const isSelected = work.userReactions?.[user?.uid] === btn.type;
                        const count = work.reactions?.[btn.type] || 0;
                        const hasActivity = count > 0;
                        const showColor = isSelected || hasActivity;

                        return (
                            <TouchableOpacity
                                key={btn.type}
                                onPress={() => handleReaction(work, btn.type)}
                                activeOpacity={0.7}
                                style={{ alignItems: 'center', flex: 1 }}
                            >
                                <View style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: isSelected ? (btn.color + '20') : 'transparent',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: showColor ? 1.2 : 1,
                                    borderColor: showColor ? btn.color : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                                    marginBottom: 4
                                }}>
                                    <btn.Icon
                                        size={16}
                                        color={showColor ? btn.color : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)')}
                                        fill="transparent"
                                        strokeWidth={isSelected ? 2.5 : 1.5}
                                    />
                                </View>
                                <Text style={{ color: showColor ? btn.color : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'), fontSize: 7, fontWeight: '800', marginBottom: 1 }}>
                                    {btn.label}
                                </Text>
                                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2 }}>
                                    {count}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.workBottom}>
                    <View style={styles.userInfo}>
                        <View style={[styles.avatarPlaceholder, { overflow: 'hidden' }]}>
                            {work.userPhoto ? (
                                <Image source={{ uri: work.userPhoto }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <User size={14} color="#FFF" />
                            )}
                        </View>
                        <Text style={styles.userName} numberOfLines={1}>{work.userName}</Text>
                    </View>
                    <Text style={styles.workDescription} numberOfLines={1}>{work.text}</Text>
                </View>
            </View>
        );
    };

    const renderItem = ({ item }: { item: FeedItem }) => {
        const isActive = activeId === item.id;
        if (item.type === 'live') return renderLiveItem(item, isActive);
        if (item.type === 'ad') return renderAdItem(item, isActive);
        return renderWorkItem(item, isActive);
    };

    const activeItem = useMemo(() => sortedFeedItems.find(i => i.id === activeId), [sortedFeedItems, activeId]);
    const isAdActive = activeItem?.type === 'ad';
    const isLiveActive = activeItem?.type === 'live';
    const isSpecialActive = isAdActive || isLiveActive;

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={isDark ? '#FFF' : '#000'} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F8F9FA' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, paddingBottom: 15, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'transparent' }]}>
                <View style={{ opacity: isSpecialActive ? 0 : 1 }}>
                    <Text style={[styles.headerTitle, { color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5 }]}>
                        {tr('Exploration', 'استكشاف', 'Explore')}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.8)', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5 }]}>
                        {tr('Vos flux tendances', 'خلاصاتك الرائجة', 'Your trending feed')}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.profileButton, { backgroundColor: isSpecialActive ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)' }]}
                    onPress={() => {
                        if (feedFilter === 'default') setFeedFilter('viral');
                        else if (feedFilter === 'viral') setFeedFilter('comments');
                        else setFeedFilter('default');
                    }}
                >
                    <TrendingUp size={20} color={feedFilter === 'viral' ? '#A855F7' : (feedFilter === 'comments' ? '#3B82F6' : '#FFF')} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={sortedFeedItems}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                pagingEnabled
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={SCREEN_HEIGHT}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 0 }}
                removeClippedSubviews
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Clock size={48} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'} style={{ marginBottom: 16 }} />
                        <Text style={[styles.emptyText, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
                            {tr('Rien de nouveau pour le moment', 'لا يوجد شيء جديد حاليا', 'Nothing new right now')}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
    },
    profileButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        paddingHorizontal: 8,
    },
    liveCard: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        backgroundColor: '#000',
        marginBottom: 0,
    },
    workCard: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        backgroundColor: '#000',
        marginBottom: 0,
    },
    liveBadgeContainer: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFF',
    },
    liveText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
    },
    viewerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    viewerText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    liveInfo: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
    },
    hostName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    flameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    flameText: {
        color: '#FF8A00',
        fontSize: 12,
        fontWeight: '800',
    },
    playIconContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -16,
        marginLeft: -16,
        opacity: 0.8,
    },
    viralBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#A855F7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    viralText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
    },
    workStats: {
        position: 'absolute',
        top: 12,
        right: 12,
        alignItems: 'center',
        gap: 12,
    },
    workStatItem: {
        alignItems: 'center',
        gap: 2,
    },
    workStatText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 3,
    },
    workBottom: {
        position: 'absolute',
        bottom: 160, // Shifted up to make room for Reaction Bar
        left: 0,
        right: 0,
        padding: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    avatarPlaceholder: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    userName: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
    },
    workDescription: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
    }
});
