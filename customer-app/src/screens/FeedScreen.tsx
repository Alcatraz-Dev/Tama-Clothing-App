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
    Animated
} from 'react-native';
import { collection, query, where, getDocs, onSnapshot, collectionGroup, orderBy, limit, doc, getDoc } from 'firebase/firestore';
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
    ThumbsDown,
    Ghost,
    Sparkles
} from 'lucide-react-native';
import { Theme } from '../theme';
import { LiveSessionService } from '../services/LiveSessionService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeedItem {
    id: string;
    type: 'live' | 'work';
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
    onWorkPress: (work: any, targetUid: string) => void;
}

export default function FeedScreen({ t, theme, language, onNavigate, onJoinLive, onWorkPress }: FeedScreenProps) {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [feedFilter, setFeedFilter] = useState<'default' | 'viral' | 'comments'>('default');

    const sortedFeedItems = useMemo(() => {
        let items = [...feedItems];
        if (feedFilter === 'viral') {
            // Sort by score (Reactions) descending
            return items.sort((a, b) => b.score - a.score);
        }
        if (feedFilter === 'comments') {
            // Sort by Comments Count descending
            return items.sort((a, b) => (b.data.commentsCount || 0) - (a.data.commentsCount || 0));
        }
        // Default: Keep original fetch order (which has urgency + date logic)
        return items;
    }, [feedItems, feedFilter]);
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';

    const scrollY = useRef(new Animated.Value(0)).current;

    const tr = (fr: string, ar: string, en: string) => {
        if (language === 'ar') return ar;
        if (language === 'fr') return fr;
        return en;
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

    const fetchFeed = async () => {
        try {
            // 1. Fetch Active Lives
            const livesQuery = query(
                collection(db, 'Live_sessions'),
                where('status', '==', 'live'),
                limit(10)
            );
            const livesSnap = await getDocs(livesQuery);
            const lives: FeedItem[] = livesSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: 'live',
                    data,
                    score: data.totalLikes || 0,
                    createdAt: data.startedAt || { seconds: Date.now() / 1000 }
                };
            });

            // 2. Fetch Works (using collectionGroup)
            // Note: We fetch without orderBy to avoid needing a composite index
            // Sorting is done in JavaScript below
            const worksQuery = query(
                collectionGroup(db, 'works'),
                // orderBy('createdAt', 'desc'), // Only enable if composite index exists
                limit(30)
            );
            const worksSnap = await getDocs(worksQuery);

            // 2a. Pre-process works to get User IDs
            const rawWorks = worksSnap.docs.map(doc => {
                const data = doc.data();
                const parentPath = doc.ref.parent.path; // users/UID/works
                const userId = parentPath.split('/')[1];
                return { id: doc.id, data, userId, doc };
            });

            // 2b. Fetch User Profiles
            const uniqueUserIds = [...new Set(rawWorks.map(w => w.userId))];
            const userProfiles: Record<string, any> = {};

            await Promise.all(uniqueUserIds.map(async (uid) => {
                try {
                    if (!uid) return;
                    const snap = await getDoc(doc(db, 'users', uid));
                    if (snap.exists()) {
                        userProfiles[uid] = snap.data();
                    }
                } catch (e) {
                    console.warn('Error fetching user profile for feed:', uid);
                }
            }));

            // 2c. Construct Feed Items
            const works: FeedItem[] = rawWorks.map(({ id, data, userId }) => {
                const userProfile = userProfiles[userId];
                const userName = userProfile?.displayName || userProfile?.fullName || 'User';
                const userPhoto = userProfile?.avatarUrl || userProfile?.photoURL || userProfile?.image || null;

                // Prioritize 'url' field which is used in addDoc, fallback to others
                const finalUrl = data.url || data.imageUrl || data.mediaUrl;

                return {
                    id,
                    type: 'work',
                    data: {
                        ...data,
                        id,
                        userId,
                        userName,
                        userPhoto,
                        imageUrl: finalUrl, // Standardized key for display
                        type: data.type || (finalUrl?.includes('.mp4') ? 'video' : 'image')
                    },
                    score: getTotalStats(data),
                    createdAt: data.createdAt || { seconds: Date.now() / 1000 }
                };
            });

            // 3. Combine and Sort
            let combined = [...lives, ...works];

            combined.sort((a, b) => {
                // Priority 1: Lives with high flame count or Viral works
                const aUrgent = (a.type === 'live' && a.score >= 50) || (a.type === 'work' && a.score >= 100);
                const bUrgent = (b.type === 'live' && b.score >= 50) || (b.type === 'work' && b.score >= 100);

                if (aUrgent && !bUrgent) return -1;
                if (!aUrgent && bUrgent) return 1;

                // Priority 2: Score within urgency/non-urgency groups
                if (aUrgent && bUrgent) {
                    return b.score - a.score;
                }

                // Priority 3: Date (descending)
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });

            setFeedItems(combined);
        } catch (error) {
            console.error('Error fetching feed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchFeed();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchFeed();
    };

    const renderLiveItem = (item: FeedItem) => {
        const session = item.data;
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.liveCard}
                onPress={() => onJoinLive(session.channelId)}
            >
                <Image
                    source={{ uri: session.hostAvatar }}
                    style={StyleSheet.absoluteFillObject}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.liveBadgeContainer}>
                    <View style={styles.liveBadge}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.liveText}>{tr('EN DIRECT', 'مباشر', 'LIVE')}</Text>
                    </View>
                    <View style={styles.viewerBadge}>
                        <Eye size={12} color="#FFF" />
                        <Text style={styles.viewerText}>{session.viewCount || 0}</Text>
                    </View>
                </View>

                <View style={styles.liveInfo}>
                    <Text style={styles.hostName}>{session.hostName}</Text>
                    <View style={styles.flameContainer}>
                        <Flame size={16} color="#FF8A00" fill="#FF8A00" />
                        <Text style={styles.flameText}>{session.totalLikes || 0} {tr('Flammes', 'نار', 'Flames')}</Text>
                    </View>
                </View>

                <Animatable.View
                    animation="pulse"
                    iterationCount="infinite"
                    style={styles.playIconContainer}
                >
                    <Play size={32} color="#FFF" fill="#FFF" />
                </Animatable.View>
            </TouchableOpacity>
        );
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
                if (count === 0) return null;
                return (
                    <View key={r.type} style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' }}>
                        <r.Icon size={10} color={r.color} fill="transparent" strokeWidth={2.5} />
                        <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>{count}</Text>
                    </View>
                );
            })}
        </View>
    );

    const renderWorkItem = (item: FeedItem) => {
        const work = item.data;
        const score = item.score;
        const viral = isViral(work);
        const isVideo = work.type === 'video' || (work.imageUrl && work.imageUrl.includes('.mp4'));

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.workCard}
                onPress={() => onWorkPress(work, work.userId)}
            >
                {/* Media Content */}
                {isVideo && work.imageUrl ? (
                    <Video
                        source={{ uri: work.imageUrl }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={true}
                        isLooping
                        isMuted
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

                {/* Video Indicator Overlay */}
                {isVideo && (
                    <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 }}>
                        <Play size={12} color="#FFF" fill="#FFF" />
                    </View>
                )}

                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.9)']}
                    style={StyleSheet.absoluteFillObject}
                />

                {viral && (
                    <View style={styles.viralBadge}>
                        <TrendingUp size={14} color="#FFF" />
                        <Text style={styles.viralText}>{tr('VIRAL', 'فيروسي', 'VIRAL')}</Text>
                    </View>
                )}

                <View style={styles.workBottom}>
                    {renderStatsPills(work)}
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
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }: { item: FeedItem }) => {
        if (item.type === 'live') return renderLiveItem(item);
        return renderWorkItem(item);
    };

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
            <View style={[styles.header, { paddingTop: insets.top + 10, paddingBottom: 15 }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>
                        {tr('Exploration', 'استكشاف', 'Explore')}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
                        {tr('Vos flux tendances', 'خلاصاتك الرائجة', 'Your trending feed')}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.profileButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={() => {
                        if (feedFilter === 'default') setFeedFilter('viral');
                        else if (feedFilter === 'viral') setFeedFilter('comments');
                        else setFeedFilter('default');
                    }}
                >
                    <TrendingUp size={20} color={feedFilter === 'viral' ? '#A855F7' : (feedFilter === 'comments' ? '#3B82F6' : (isDark ? '#FFF' : '#000'))} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={sortedFeedItems}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#FFF" : "#000"} />
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
        flex: 1,
        height: 280,
        margin: 6,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#111',
    },
    workCard: {
        flex: 1,
        height: 280,
        margin: 6,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#ddd',
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
        bottom: 0,
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
