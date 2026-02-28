import React, {
    useEffect,
    useState,
    useRef,
    useMemo
} from 'react';
import {
    View,
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
    Linking,
    ScrollView
} from 'react-native';
import { Text } from '../components/ui/text';
import { collection, query, where, limit, onSnapshot, getDoc, doc, updateDoc, increment, deleteField, getDocs, collectionGroup, setDoc, addDoc, serverTimestamp, orderBy, deleteDoc } from 'firebase/firestore';
import UniversalVideoPlayer from '../components/common/UniversalVideoPlayer';
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
    UserPlus,
    Check,
    ChevronRight,
    Laugh,
    DownloadCloud,
    Send,
    Repeat,
    ThumbsDown,
    Ghost,
    Sparkles,
    Pause,
    Plus,
    Video as VideoIcon,
    Camera
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Theme } from '../theme';
import { LiveSessionService } from '../services/LiveSessionService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useColor } from '@/hooks/useColor';
import { useAppTheme } from '@/context/ThemeContext';
import { uploadToBunny } from '@/utils/bunny';
import { MediaPicker, MediaAsset } from '@/components/ui/media-picker';
import CameraScreen from './Camera';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeedItem {
    id: string;
    type: 'live' | 'work' | 'ad' | 'reel';
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
    onAddFriend?: (userId: string) => void;
    onFollowCollab?: (collabId: string) => void;
    onCollabPress?: (collabId: string) => void;
    user?: any;
    profileData?: any;
    ads?: any[];
    followedCollabs?: string[];
    onlyReels?: boolean;
}

export default function FeedScreen(props: FeedScreenProps) {
    const { t, theme, language, onNavigate, onJoinLive, onWorkPress, onCommentPress, onUserPress, onCampaignPress, onAddFriend, onFollowCollab, onCollabPress, user, profileData, ads = [], followedCollabs = [], onlyReels } = props;
    const insets = useSafeAreaInsets();

    // BNA Colors
    const colors = {
        background: useColor('background'),
        foreground: useColor('foreground'),
        card: useColor('card'),
        accent: useColor('accent'),
        border: useColor('border'),
        textMuted: useColor('textMuted'),
        primary: useColor('primary'),
    };

    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [feedFilter, setFeedFilter] = useState<'default' | 'viral' | 'comments'>('default');
    const [feedTab, setFeedTab] = useState<'all' | 'following' | 'reels' | 'viral'>('all');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [lives, setLives] = useState<FeedItem[]>([]);
    const [works, setWorks] = useState<FeedItem[]>([]);
    const [reels, setReels] = useState<FeedItem[]>([]);
    const [pausedItems, setPausedItems] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [openCamera, setOpenCamera] = useState(false);

    const handleOpenCamera = () => {

    };
    const onBack = () => {
        setOpenCamera(false);
    };
    const handleMediaSelection = async (assets: MediaAsset[]) => {
        if (!user) {
            Alert.alert("Erreur", "Vous devez être connecté pour publier une story");
            return;
        }
        if (assets.length === 0) return;
        const asset = assets[0];
        setUploading(true);
        try {
            // Upload to Bunny
            const bunnyUrl = await uploadToBunny(asset.uri);

            const reelId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const reelData = {
                id: reelId,
                url: bunnyUrl,
                type: asset.type,
                text: '',
                createdAt: serverTimestamp(),
                userId: user.uid,
                reactions: {},
                commentsCount: 0,
                totalLikes: 0,
                userName: user.displayName || user.fullName || 'User',
                userPhoto: user.avatarUrl || user.photoURL || '',
            };

            await setDoc(doc(db, 'global_reels', reelId), reelData);

            Alert.alert(
                tr('Succès', 'نجاح', 'Success'),
                tr(
                    asset.type === 'video' ? 'Story publiée avec succès !' : 'Photo publiée avec succès !',
                    asset.type === 'video' ? 'تم نشر القصة بنجاح' : 'تم نشر الصورة بنجاح',
                    asset.type === 'video' ? 'Story published successfully!' : 'Photo published successfully!'
                )
            );
        } catch (error) {
            console.error("Error picking/uploading reel media:", error);
            Alert.alert("Erreur", "Impossible de publier votre story");
        } finally {
            setUploading(false);
        }
    };

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
        let combined = (onlyReels || feedTab === 'reels') ? [...reels] : [...lives, ...works, ...reels];
        
        // Sort by viral score when viral tab is selected (most reactions + comments)
        if (feedTab === 'viral') {
            combined = combined.filter(item => item.score > 0).sort((a, b) => b.score - a.score);
        } else {
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
        }

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
    }, [lives, works, reels, ads, feedTab, onlyReels]);

    const sortedFeedItems = useMemo(() => {
        let items = [...feedItemsCombined];

        if (feedTab === 'following') {
            items = items.filter(item => {
                const userId = item.data.userId;
                // Check if following the user directly OR following their brand's collaboration
                const isFollowingUser = profileData?.following?.includes(userId) || profileData?.friends?.includes(userId);
                const isFollowingCollab = item.data.collabId && followedCollabs.includes(item.data.collabId);
                return isFollowingUser || isFollowingCollab;
            });
        }

        if (feedFilter === 'viral') {
            return items.sort((a, b) => b.score - a.score);
        }
        if (feedFilter === 'comments') {
            return items.sort((a, b) => (b.data.commentsCount || 0) - (a.data.commentsCount || 0));
        }
        return items;
    }, [feedItemsCombined, feedFilter, feedTab, profileData?.following, followedCollabs]);

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
        const brandCollabs: Record<string, string> = {}; // brandId -> collabIdMapping

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
                        if (snap.exists()) {
                            const pData = snap.data();
                            userProfiles[uid] = pData;

                            // If user is a partner/collab owner, try to find their collaboration ID and image
                            const brandId = pData.brandId || pData.brand_id;
                            if (brandId && !brandCollabs[brandId]) {
                                try {
                                    const collabQuery = query(collection(db, 'collaborations'), where('brandId', '==', pData.brandId), limit(1));
                                    const collabSnap = await getDocs(collabQuery);
                                    if (!collabSnap.empty) {
                                        const cDoc = collabSnap.docs[0];
                                        const cData = cDoc.data();
                                        brandCollabs[brandId] = cDoc.id;
                                        brandCollabs[brandId + '_image'] = cData.logoUrl || cData.imageUrl || cData.brandImage || cData.logo || cData.image || '';
                                    } else {
                                        const bSnap = await getDoc(doc(db, 'brands', brandId));
                                        if (bSnap.exists()) {
                                            const bData = bSnap.data();
                                            brandCollabs[brandId + '_image'] = bData.logoUrl || bData.imageUrl || bData.logo || bData.image || '';
                                        }
                                    }
                                } catch (err) {
                                    console.log("Error fetching brand collab:", err);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('Error fetching user profile:', uid);
                    }
                }));
            }

            const workItems: FeedItem[] = rawDocs.map(({ id, data, userId, fullPath }) => {
                const profile = userProfiles[userId];
                const finalUrl = data.url || data.imageUrl || data.mediaUrl;
                const isCollab = profile?.isPartner || profile?.isCollab || profile?.role === 'partner' || profile?.role === 'brand_owner' || profile?.brandId || false;
                return {
                    id,
                    type: 'work',
                    data: {
                        ...data,
                        id,
                        userId,
                        userName: profile?.displayName || profile?.fullName || 'User',
                        userPhoto: profile?.avatarUrl || profile?.photoURL || profile?.image || profile?.avatar || profile?.photo || null,
                        imageUrl: finalUrl,
                        fullPath: fullPath,
                        type: data.type || (finalUrl?.includes('.mp4') ? 'video' : 'image'),
                        isCollab: isCollab,
                        brandId: profile?.brandId || profile?.brand_id || null,
                        collabId: ((profile?.brandId || profile?.brand_id) && brandCollabs[profile.brandId || profile.brand_id]) || null,
                        collabImage: ((profile?.brandId || profile?.brand_id) && brandCollabs[(profile.brandId || profile.brand_id) + '_image']) || null
                    },
                    score: getTotalStats(data),
                    createdAt: data.createdAt || { seconds: Date.now() / 1000 }
                };
            });
            setWorks(workItems.filter(w => w.data.isCollab));
            setLoading(false);
            setRefreshing(false);
        });

        // 3. Real-time Listener for Global Reels
        const reelsQuery = query(
            collection(db, 'global_reels'),
            orderBy('createdAt', 'desc'),
            limit(30)
        );

        const unsubscribeReels = onSnapshot(reelsQuery, async (snapshot) => {
            const reelDocs = snapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data } as any;
            });

            // Filter out stories older than 24 hours and auto-delete them
            const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
            const validReels: any[] = [];
            
            for (const reel of reelDocs) {
                const storyAge = reel.createdAt?.toDate ? reel.createdAt.toDate().getTime() : 0;
                if (storyAge < twentyFourHoursAgo) {
                    // Auto-delete expired stories
                    try {
                        await deleteDoc(doc(db, 'global_reels', reel.id));
                    } catch (e) {
                        console.log('Error deleting expired story:', e);
                    }
                } else {
                    validReels.push(reel);
                }
            }

            // Fetch missing profiles
            const missingUids = [...new Set(validReels.filter((r: any) => !userProfiles[r.userId]).map((r: any) => r.userId))];
            if (missingUids.length > 0) {
                await Promise.all(missingUids.map(async (uid: any) => {
                    try {
                        const snap = await getDoc(doc(db, 'users', uid));
                        if (snap.exists()) {
                            const pData = snap.data();
                            userProfiles[uid] = pData;

                            // Check for brand/collab same as works
                            if (pData.brandId && !brandCollabs[pData.brandId]) {
                                try {
                                    const collabQuery = query(collection(db, 'collaborations'), where('brandId', '==', pData.brandId), limit(1));
                                    const collabSnap = await getDocs(collabQuery);
                                    if (!collabSnap.empty) {
                                        const cDoc = collabSnap.docs[0];
                                        const cData = cDoc.data();
                                        brandCollabs[pData.brandId] = cDoc.id;
                                        brandCollabs[pData.brandId + '_image'] = cData.imageUrl || cData.brandImage || cData.logo || '';
                                    } else {
                                        const bSnap = await getDoc(doc(db, 'brands', pData.brandId));
                                        if (bSnap.exists()) {
                                            const bData = bSnap.data();
                                            brandCollabs[pData.brandId + '_image'] = bData.logo || bData.image || bData.logoUrl || bData.imageUrl || '';
                                        }
                                    }
                                } catch (e) { }
                            }
                        }
                    } catch (e) { }
                }));
            }

            const reelItems: FeedItem[] = validReels.map((data: any) => {
                const profile = userProfiles[data.userId];
                const isCollab = profile?.isPartner || profile?.isCollab || profile?.role === 'partner' || profile?.role === 'brand_owner' || profile?.brandId || false;
                // Check if the media is a video based on URL or type field
                const isVideoMedia = data.type === 'video' || (data.url && data.url.toLowerCase().includes('.mp4'));
                return {
                    id: data.id,
                    type: 'reel' as const,
                    data: {
                        ...data,
                        userName: profile?.displayName || profile?.fullName || 'User',
                        userPhoto: profile?.avatarUrl || profile?.photoURL || profile?.image || profile?.avatar || profile?.photo || null,
                        type: isVideoMedia ? 'video' : 'image',
                        isCollab,
                        collabId: (profile?.brandId && brandCollabs[profile.brandId]) || null,
                        collabImage: (profile?.brandId && brandCollabs[profile.brandId + '_image']) || null,
                        brandId: profile?.brandId || null
                    },
                    score: getTotalStats(data),
                    createdAt: data.createdAt || { seconds: Date.now() / 1000 }
                };
            });
            setReels(reelItems);
        });

        return () => {
            unsubscribeLives();
            unsubscribeWorks();
            unsubscribeReels();
        };
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 800);
    };

    const renderLiveItem = (item: FeedItem, isActive: boolean) => {
        const session = item.data;
        const isDark = theme === 'dark';
        const liveUrl = session.promoUrl || session.url || session.playbackUrl || session.hlsUrl;

        return (
            <View style={styles.liveCard}>
                {liveUrl ? (
                    <UniversalVideoPlayer
                        source={{ uri: liveUrl }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
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
                    <Avatar
                        source={session.hostAvatar}
                        size={32}
                        borderWidth={1.5}
                        borderColor="#FF4D67"
                    />

                    <Badge
                        label={t('enDirect') || 'EN DIRECT'}
                        variant="error"
                        icon={<View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' }} />}
                        style={{ height: 24 }}
                        textStyle={{ fontSize: 9 }}
                    />

                    <Badge
                        label={Math.max(0, session.viewCount || 0)}
                        variant="glass"
                        icon={<Eye size={14} color="#FFF" />}
                        style={{ height: 24 }}
                        textStyle={{ fontSize: 10 }}
                    />
                </View>

                {/* Host Info Section */}
                <View style={{
                    position: 'absolute',
                    bottom: 180,
                    left: 16,
                    right: 16,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Avatar
                            source={session.hostAvatar}
                            size={40}
                            borderWidth={1.5}
                            borderColor="#FFF"
                            style={{ marginRight: 12 }}
                        />
                        <View>
                            <Text variant="heading" style={{ color: '#FFF', fontSize: 18, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }}>
                                {session.hostName}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Flame size={14} color="#FF8A00" fill="#FF8A00" />
                                <Text style={{ color: '#FF8A00', fontSize: 12, fontWeight: '800' }}>
                                    {session.totalLikes || 0} {t('flammes') || 'Flammes'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text variant="heading" style={{
                        color: '#FFF',
                        fontSize: 24,
                        textShadowColor: 'rgba(0,0,0,0.5)',
                        textShadowRadius: 10,
                        lineHeight: 30
                    }}>
                        {session.title || `${session.hostName} ${t('hostIsLive') || 'is Live!'}`}
                    </Text>
                </View>

                {/* Floating Join CTA */}
                <View style={{
                    position: 'absolute',
                    bottom: 110,
                    left: 16,
                    right: 16,
                }}>
                    <Button
                        onPress={() => onJoinLive(session.channelId)}
                        label={(t('joinLive') || 'JOIN LIVE').toUpperCase()}
                        variant="error"
                        size="lg"
                        icon={Play}
                        style={{
                            shadowColor: '#EF4444',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.5,
                            shadowRadius: 12,
                            elevation: 8
                        }}
                        textStyle={{ letterSpacing: 1 }}
                    />
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

            // Download file first to share "cleanly" (hides bunny.net)
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
  const  renderStoryItem = (item: FeedItem , isActive: boolean) => {
        const reel = item.data;
        return (
            <View >
                <UniversalVideoPlayer
                    source={{ uri: reel.url }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                    shouldPlay={activeId === item.id && !pausedItems.includes(item.id)}
                    isLooping
                    isMuted={false}
                />

                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
                    locations={[0, 0.2, 0.6, 1]}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                />

                {/* Top Glass Badges */}
                <View style={[styles.liveBadgeContainer, { top: insets.top + 20 }]}>
                    <Badge
                        label={reel.userName}
                        variant="glass"
                        icon={<User size={14} color="#FFF" />}
                        style={{ height: 24 }}
                        textStyle={{ fontSize: 10, color: '#FFF' }}
                    />
                    {reel.isCollab && (
                        <Badge
                            label={t('collaboration') || 'COLLABORATION'}
                            variant="primary"
                            icon={<Users size={14} color="#FFF" />}
                            style={{ height: 24 }}
                            textStyle={{ fontSize: 10, color: '#FFF' }}
                        />
                    )}
                </View>

                {/* Bottom Stats and Actions */}
                <View style={{
                    position: 'absolute',
                    bottom: 20,
                    left: 16,
                    right: 16,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    {item.type !== 'reel' && renderStatsPills(reel)}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Button
                            onPress={() => togglePlayPause(item.id)}
                            size="sm"
                            variant="glass"
                            icon={pausedItems.includes(item.id) ? Play : Pause}
                            style={{ width: 32, height: 32, borderRadius: 16 }}
                        />
                        <Button
                            onPress={() => handleShare(reel)}
                            size="sm"
                            variant="glass"
                            icon={Share2}
                            style={{ width: 32, height: 32, borderRadius: 16 }}
                        />
                    </View>
                </View>
            </View>
        );
    }
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
            const originalAuthorId = work.userId;
            const originalWorkId = work.id;

            // 1. Create the repost entry
            await addDoc(collection(db, 'users', user.uid, 'works'), {
                ...work,
                originalAuthorId,
                originalWorkId,
                repostedFrom: user.uid,
                repostedFromName: profileData?.fullName || 'User',
                createdAt: serverTimestamp(),
                reactions: {},
                userReactions: {},
                commentsCount: 0,
                isRepost: true
            });

            // 2. Increment repost count on the original document
            if (work.fullPath) {
                const originalRef = doc(db, work.fullPath);
                await updateDoc(originalRef, {
                    repostCount: increment(1)
                });
            }

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
                const isSelected = work.userReactions?.[user?.uid] === r.type;
                if (count === 0 && !isSelected) return null;

                return (
                    <Button
                        key={r.type}
                        onPress={() => handleReaction(work, r.type)}
                        size="sm"
                        variant={isSelected ? "glass" : "secondary"}
                        icon={r.Icon}
                        label={count.toString()}
                        style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            height: 24,
                            borderRadius: 8,
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)',
                            borderWidth: isSelected ? 1 : 0.5,
                            borderColor: isSelected ? r.color : 'rgba(255,255,255,0.15)'
                        }}
                        textStyle={{ fontSize: 9, fontWeight: '900', color: 'white' }}
                    />
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
                        <UniversalVideoPlayer
                            source={{ uri: ad.url }}
                            style={StyleSheet.absoluteFillObject}
                            resizeMode="cover"
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
                    top: insets.top + 2, // Now at the very top
                    left: 20,
                    zIndex: 20
                }}>
                    <Badge
                        label={tr('Ad SPONSORISÉ', 'إعلان ممول', 'SPONSORED')}
                        variant="glass"
                        icon={<Star size={14} color="#FBBF24" />}
                        style={{ paddingVertical: 6, paddingHorizontal: 12 }}
                    />
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
                        {ad.brandImage ? (
                            <Avatar
                                source={ad.brandImage}
                                size={36}
                                borderWidth={2}
                                borderColor="rgba(255,255,255,0.3)"
                                style={{ marginRight: 10 }}
                            />
                        ) : (
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
                        )}
                        <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }}>
                            {ad.brandName ? (typeof ad.brandName === 'object' ? (ad.brandName[language] || ad.brandName.en) : ad.brandName).toUpperCase() : 'TAMA CLOTHING'}
                        </Text>
                    </View>


                    <Text variant="heading" style={{
                        color: '#FFF',
                        fontSize: 22,
                        textShadowColor: 'rgba(0,0,0,0.5)',
                        textShadowRadius: 10,
                        marginBottom: 6,
                        lineHeight: 28
                    }}>
                        {getTranslated(ad.title)}
                    </Text>

                    {ad.description && (
                        <Text variant="body" style={{
                            color: 'rgba(255,255,255,0.95)',
                            fontSize: 14,
                            textShadowColor: 'rgba(0,0,0,0.5)',
                            textShadowRadius: 5,
                            lineHeight: 18
                        }}>
                            {getTranslated(ad.description)}
                        </Text>
                    )}
                </View>

                {/* Theme-Aware Floating CTA */}
                <View style={{
                    position: 'absolute',
                    bottom: 110,
                    left: 16,
                    right: 16,
                }}>
                    <Button
                        onPress={() => onCampaignPress?.(ad)}
                        label={tr('DÉCOUVRIR', 'اكتشف', 'DISCOVER')}
                        variant={isDark ? "secondary" : "default"}
                        size="default"
                        icon={ChevronRight}
                        style={{
                            height: 44,
                            borderRadius: 12,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                            backgroundColor: isDark ? '#FFF' : '#000',
                            flexDirection: 'row-reverse'
                        }}
                        textStyle={{ color: isDark ? '#000' : '#FFF' }}
                    />
                </View>
            </View>
        );
    };

    const renderWorkItem = (item: FeedItem, isActive: boolean) => {
        const work = item.data;
        const score = item.score;
        const viral = isViral(work);
        // Handle both work.imageUrl and reel.url
        const mediaUrl = work.imageUrl || work.url;
        const isVideo = work.type === 'video' || (mediaUrl && mediaUrl.includes('.mp4'));
        const isReel = item.type === 'reel';

        return (
            <View style={styles.workCard}>
                {/* Media Content */}
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => isVideo ? togglePlayPause(item.id) : onWorkPress?.(work, work.userId)}
                    style={StyleSheet.absoluteFillObject}
                >
                    {isVideo && mediaUrl ? (
                        <UniversalVideoPlayer
                            source={{ uri: mediaUrl }}
                            style={StyleSheet.absoluteFillObject}
                            resizeMode="cover"
                            shouldPlay={isActive && !pausedItems.includes(item.id)}
                            isLooping
                            isMuted={false}
                        />
                    ) : (mediaUrl ? (
                        <Image
                            source={{ uri: mediaUrl }}
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
                    <Badge
                        label={tr('VIRAL', 'منتشر', 'VIRAL')}
                        variant="glass"
                        icon={<TrendingUp size={14} color="#FFF" />}
                        style={[styles.viralBadge, { backgroundColor: 'rgba(247, 58, 58, 0.7)', top: 70, borderWidth: 0 }]}
                    />
                )}

                {isReel && (
                    <Badge
                        label={tr('REEL', 'ريل', 'REEL')}
                        variant="glass"
                        icon={<VideoIcon size={14} color="#FFF" />}
                        style={[styles.viralBadge, { backgroundColor: 'rgba(168, 85, 247, 0.8)', top: viral ? 130 : 100, borderWidth: 0 }]}
                    />
                )}

                <View style={{
                    position: 'absolute',
                    right: 16,
                    bottom: 250,
                    alignItems: 'center',
                    gap: 16,
                    zIndex: 50
                }}>
                    {/* Only show action buttons for non-reel content */}
                    {!isReel && (
                    <>
                    {/* Comment */}
                    <View style={{ alignItems: 'center' }}>
                        <Button
                            onPress={() => onCommentPress?.(work, work.userId)}
                            size="icon"
                            variant="glass"
                            icon={MessageSquare}
                            style={{ width: 44, height: 44, borderRadius: 22 }}
                        />
                        <Text style={{ color: 'white', fontSize: 11, fontWeight: '800', marginTop: 2 }}>
                            {work.commentsCount || 0}
                        </Text>
                        <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '800', marginTop: 2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2 }}>
                            {tr('Commentaire', 'تعليق', 'Comment')}
                        </Text>
                    </View>

                    {/* Repost */}
                    <View style={{ alignItems: 'center' }}>
                        <Button
                            onPress={() => handleRepost(work)}
                            size="icon"
                            variant="glass"
                            icon={Repeat}
                            style={{ width: 44, height: 44, borderRadius: 22 }}
                        />
                        <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '800', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2 }}>
                            {tr('Republier', 'عاود أنشر', 'Repost')}
                        </Text>
                    </View>

                    {/* Download/Save */}
                    <View style={{ alignItems: 'center' }}>
                        <Button
                            onPress={() => handleDownload(work)}
                            size="icon"
                            variant="glass"
                            icon={DownloadCloud}
                            style={{ width: 44, height: 44, borderRadius: 22 }}
                        />
                        <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '800', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2 }}>
                            {tr('Enregistrer', 'خبّي', 'Save')}
                        </Text>
                    </View>

                    {/* Share */}
                    <View style={{ alignItems: 'center' }}>
                        <Button
                            onPress={() => handleShare(work)}
                            size="icon"
                            variant="glass"
                            icon={Send}
                            style={{ width: 44, height: 44, borderRadius: 22 }}
                        />
                        <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '800', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2 }}>
                            {tr('Partager', 'أبعث', 'Share')}
                        </Text>
                    </View>
                    </>
                    )}
                </View>

                {/* Bottom User Info - TikTok Style with button below avatar */}
                <View style={{
                    position: 'absolute',
                    bottom: isReel ? 96 : 190,
                    left: 16,
                    right: 80,
                    zIndex: 20
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                        <View style={{ marginRight: 8, position: 'relative' }}>
                            {work.isCollab ? (
                                <View style={{ width: 50, height: 50 }}>
                                    <Avatar
                                        source={work.collabImage}
                                        size={42}
                                        borderWidth={2}
                                        borderColor="#FFF"
                                        onPress={() => onCollabPress?.(work.userId)}
                                    />
                                    <Avatar
                                        source={work.userPhoto}
                                        size={24}
                                        borderWidth={2}
                                        borderColor="#FFF"
                                        style={{ position: 'absolute', bottom: 0, right: 0, zIndex: 5 }}
                                    />
                                </View>
                            ) : (
                                <Avatar
                                    source={work.userPhoto}
                                    size={44}
                                    borderWidth={2}
                                    borderColor="#FFF"
                                    onPress={() => onUserPress?.(work.userId)}
                                />
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={() => work.isCollab ? onCollabPress?.(work.userId) : onUserPress?.(work.userId)}
                            style={{ flexShrink: 1, marginRight: 10 }}
                        >
                            <Text variant="subtitle" style={{ color: '#FFF', fontSize: 12, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }} numberOfLines={1}>
                                {work.userName}
                            </Text>
                            {work.text && (
                                <Text variant="caption" style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 2 }} numberOfLines={2}>
                                    {work.text}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {work.userId !== user?.uid && (
                            <Button
                                onPress={() => work.isCollab ? onFollowCollab?.(work.collabId || work.userId) : onAddFriend?.(work.userId)}
                                variant={(work.isCollab
                                    ? ((work.collabId && followedCollabs.includes(work.collabId)) || profileData?.following?.includes(work.userId))
                                    : (profileData?.friends?.includes(work.userId) || profileData?.incomingFriendRequests?.includes(work.userId)))
                                    ? "destructive" : "glass"}
                                size="sm"
                                icon={work.isCollab ? (
                                    ((work.collabId && followedCollabs.includes(work.collabId)) || profileData?.following?.includes(work.userId)) ? Check : Star
                                ) : (
                                    profileData?.friends?.includes(work.userId) || profileData?.incomingFriendRequests?.includes(work.userId) ? Check : (profileData?.pendingFriendRequests?.includes(work.userId) ? Clock : UserPlus)
                                )}
                                label={work.isCollab ? (
                                    ((work.collabId && followedCollabs.includes(work.collabId)) || profileData?.following?.includes(work.userId)) ? (t('following') || 'Suivi') : (t('follow') || 'Suivre')
                                ) : (
                                    profileData?.friends?.includes(work.userId) ? (t("friends") || "Amis") : (profileData?.incomingFriendRequests?.includes(work.userId) ? (t("accept") || "Accepter") : (profileData?.pendingFriendRequests?.includes(work.userId) ? (t('pending') || 'En attente') : (t('addFriend') || 'Ajouter')))
                                )}
                                style={{
                                    height: 32,
                                    paddingVertical: 0,
                                    paddingHorizontal: 12,
                                    borderRadius: 18,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                }}
                                textStyle={{ fontSize: 10, fontWeight: '800' }}
                            />
                        )}
                    </View>
                </View>

                {/* Bottom Reaction Bar (Traveaux Style) */}
                {!isReel && (
                <View style={{
                    position: 'absolute',
                    bottom: 96,
                    marginTop: 40,
                    left: 12,
                    right: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 30,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.2)',
                    zIndex: 20,
                }}>
                    {[
                        { type: 'love', Icon: Heart, color: '#FF4D67', label: tr('AMOUR', 'يهبل', 'LOVE') },
                        { type: 'fire', Icon: Flame, color: '#FF8A00', label: tr('FEU', 'نار', 'FIRE') },
                        { type: 'haha', Icon: Laugh, color: '#FFD600', label: tr('DRÔLE', 'يضحك', 'HAHA') },
                        { type: 'bad', Icon: ThumbsDown, color: '#94A3B8', label: tr('BOF', 'خايب', 'BAD') },
                        { type: 'ugly', Icon: Ghost, color: '#818CF8', label: tr('MOCHE', 'ماسط', 'UGLY') },
                        { type: 'interesting', Icon: Sparkles, color: '#A855F7', label: tr('TOP', 'طيارة', 'COOL') }
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
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: isSelected ? (btn.color + '30') : 'rgba(255,255,255,0.1)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: isSelected ? 1.5 : 0,
                                    borderColor: btn.color,
                                    marginBottom: 4
                                }}>
                                    <btn.Icon
                                        size={18}
                                        color={showColor ? btn.color : 'rgba(255,255,255,0.6)'}
                                        fill="transparent"
                                        strokeWidth={isSelected ? 2.5 : 1.5}
                                    />
                                </View>
                                <Text style={{
                                    color: showColor ? btn.color : 'rgba(255,255,255,0.6)',
                                    fontSize: 8,
                                    fontWeight: '900',
                                    letterSpacing: 0.5,
                                    marginBottom: 2
                                }}>
                                    {btn.label}
                                </Text>
                                <Text style={{
                                    color: '#FFF',
                                    fontSize: 10,
                                    fontWeight: '900',
                                    opacity: hasActivity ? 1 : 0.5
                                }}>
                                    {count}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                )}
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
    const isEmpty = sortedFeedItems.length === 0;
    const headerContentColor = (isDark || !isEmpty) ? '#FFF' : '#333';
    const tabActiveColor = (isDark || !isEmpty) ? '#FFF' : '#000';
    const tabInactiveColor = (isDark || !isEmpty) ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)';

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={isDark ? Theme.dark.colors.primary : Theme.light.colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isEmpty ? colors.background : '#000' }]}>
            <StatusBar barStyle="light-content" />

            {uploading && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <View style={{ backgroundColor: colors.background, padding: 20, borderRadius: 15, alignItems: 'center' }}>
                        <ActivityIndicator color={colors.accent} />
                        <Text variant="subtitle" style={{ color: colors.foreground, marginTop: 10, fontWeight: '600' }}>
                            {tr('Publication...', 'جاري النشر...', 'Publishing...')}
                        </Text>
                    </View>
                </View>
            )}

            {openCamera && <CameraScreen onBack={onBack} onNavigate={onNavigate} t={t} language={language} theme={theme} user={user} />}
            {/* Header with Tabs */}
            <View style={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
                paddingTop: insets.top + 5,
                backgroundColor: 'transparent'
            }}>
                {/* Top Row */}
                <View style={styles.header}>
                    {!isAdActive && (
                        <TouchableOpacity onPress={()=>onNavigate("Camera")} >
                            <Camera size={20} color="#FFF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Tab Bar - Below header */}
                {!isSpecialActive && (
                    <View style={{ marginTop: 10, paddingTop: -5 }}>
                        <Tabs value={feedTab} onValueChange={(id) => setFeedTab(id as any)} style={{ backgroundColor: 'transparent' }}>
                            <TabsList style={{ backgroundColor: 'transparent', alignSelf: 'center', borderBottomWidth: 0, gap: 10 }}>
                                <TabsTrigger
                                    value="all"
                                    style={{
                                        minHeight: 40,
                                        paddingHorizontal: 16,
                                        borderBottomWidth: 3,
                                        borderBottomColor: feedTab === 'all' ? '#FFF' : 'transparent',
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    <Text style={{ color: '#FFF', fontWeight: feedTab === 'all' ? '800' : '600', fontSize: 17, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 4 }}>{t('forYou')}</Text>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="following"
                                    style={{
                                        minHeight: 40,
                                        paddingHorizontal: 16,
                                        borderBottomWidth: 3,
                                        borderBottomColor: feedTab === 'following' ? '#FFF' : 'transparent',
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    <Text style={{ color: '#FFF', fontWeight: feedTab === 'following' ? '800' : '600', fontSize: 17, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 4 }}>{t('followingTab')}</Text>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="viral"
                                    style={{
                                        minHeight: 40,
                                        paddingHorizontal: 16,
                                        borderBottomWidth: 3,
                                        borderBottomColor: feedTab === 'viral' ? '#FFF' : 'transparent',
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    <Text style={{ color: '#FFF', fontWeight: feedTab === 'viral' ? '800' : '600', fontSize: 17, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 4 }}>{tr('Viral', 'منتشر', 'Viral')}</Text>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="reels"
                                    style={{
                                        minHeight: 40,
                                        paddingHorizontal: 16,
                                        borderBottomWidth: 3,
                                        borderBottomColor: feedTab === 'reels' ? '#FFF' : 'transparent',
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    <Text style={{ color: '#FFF', fontWeight: feedTab === 'reels' ? '800' : '600', fontSize: 17, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 4 }}>{tr('Reels', 'رييلز', 'Reels')}</Text>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </View>
                )}
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
                        <Animatable.View animation="fadeInUp" duration={800} style={{ alignItems: 'center' }}>
                            <Clock size={48} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} style={{ marginBottom: 16 }} />
                            <Text style={[styles.emptyText, { color: isDark ? 'rgba(255,255,255,0.5)' : '#666', textAlign: 'center', paddingHorizontal: 40 }]}>
                                {feedTab === 'reels'
                                    ? tr('Aucun Reel pour le moment', 'لا يوجد ريلز حاليا', 'No Reels at the moment')
                                    : tr('Rien de nouveau pour le moment', 'لا يوجد شيء جديد حاليا', 'Nothing new right now')
                                }
                            </Text>
                            <TouchableOpacity
                                onPress={onRefresh}
                                style={{
                                    marginTop: 20,
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    borderRadius: 20,
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                }}
                            >
                                <Text style={{ color: isDark ? '#FFF' : '#333', fontWeight: '700' }}>{t('refresh') || 'Refresh'}</Text>
                            </TouchableOpacity>
                        </Animatable.View>
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
    actionCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
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
        backgroundColor: '#f77555',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: -20,
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: SCREEN_HEIGHT - 200,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
    },
    storyProgressContainer: {
        position: 'absolute',
        top: -4,
        left: 0,
        right: 0,
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    storyProgressBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
    },
    storyProgressFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        borderRadius: 2,
    }
});

