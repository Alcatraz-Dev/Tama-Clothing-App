import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Linking,
    Dimensions,
    Share,
    I18nManager,
    FlatList,
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, limit as firestoreLimit, orderBy } from 'firebase/firestore';
import { db, auth } from '../api/firebase';
import { LiveSessionService, LiveSession } from '../services/LiveSessionService';
import {
    ChevronLeft,
    Star,
    ShoppingBag,
    Users,
    Info,
    CheckCircle2,
    Share as ShareIcon,
    X,
    Globe,
    Instagram,
    Facebook,
    Twitter,
    Linkedin,
    Music,
    User,
    Pencil,
    Trash2,
    Camera,
    Eye,
    QrCode
} from 'lucide-react-native';
import ProductCard from '../components/ProductCard';
import CollabBadge from '../components/CollabBadge';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    withSpring,
    useAnimatedScrollHandler,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 420;
const COMPACT_HEADER_HEIGHT = 100;

interface Collaboration {
    id: string;
    name: string;
    type: 'Brand' | 'Person' | 'Company';
    description: string | { fr: string; ar: string; en: string };
    imageUrl: string;
    coverImageUrl?: string;
    websiteUrl?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    twitterUrl?: string;
    linkedinUrl?: string;
    tiktokUrl?: string;
    brandId?: string; // Link to shop brand
    isActive: boolean;
    followersCount?: number;
    worksCount?: number;
}

interface CollaborationDetailScreenProps {
    collab: Collaboration;
    onBack: () => void;
    onNavigateToShop: (brandId: string) => void;
    onProductPress: (product: any) => void;
    theme: 'light' | 'dark';
    language: string;
    t: any;
    followedCollabs: string[];
    toggleFollowCollab: (collabId: string) => void;
    profileData: any;
    onJoinLive: (info: any) => void;
    onStartLive: (collab: any) => void;
    tr: (fr: string, ar: string, en: string) => string;
}

export default function CollaborationDetailScreen({
    collab,
    onBack,
    onNavigateToShop,
    onProductPress,
    theme,
    language,
    t,
    followedCollabs = [],
    toggleFollowCollab,
    profileData,
    onJoinLive,
    onStartLive,
    tr
}: CollaborationDetailScreenProps) {
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    const scrollY = useSharedValue(0);

    const getBadgeColor = () => {
        if (collab.type === 'Brand') return '#FFD700';
        if (collab.type === 'Person') return '#A855F7';
        if (collab.type === 'Company') return '#3B82F6';
        return '#22C55E';
    };

    const badgeColor = getBadgeColor();
    const colors = {
        background: isDark ? '#000' : '#FFF',
        foreground: isDark ? '#FFF' : '#000',
        textMuted: isDark ? '#A1A1AA' : '#666',
        border: isDark ? '#27272A' : '#E5E5E5',
    };
    const [activeTab, setActiveTab] = React.useState('about');
    const [products, setProducts] = React.useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = React.useState(false);
    const [averageRating, setAverageRating] = React.useState(5.0);
    const [collabReviews, setCollabReviews] = React.useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = React.useState(false);

    // Review Modal State
    const [reviewModalVisible, setReviewModalVisible] = React.useState(false);
    const [userRating, setUserRating] = React.useState(5);
    const [userComment, setUserComment] = React.useState('');
    const [submittingReview, setSubmittingReview] = React.useState(false);
    const [editingReviewId, setEditingReviewId] = React.useState<string | null>(null);
    const [liveSession, setLiveSession] = React.useState<LiveSession | null>(null);
    const [showBadge, setShowBadge] = React.useState(false);

    const isAdmin = profileData?.role === 'admin' || profileData?.role === 'editor';
    const isOwner = (collab.brandId && profileData?.brandId === collab.brandId) ||
        (profileData?.brandId === collab.id);
    const isHost = isOwner;

    const isFollowed = followedCollabs.includes(collab.id);

    // Dynamic Tabs based on Type
    const getTabs = () => {
        const base = [{ id: 'about', label: t('about') || tr('À PROPOS', 'حول', 'ABOUT') }];

        const hasSocials = collab.instagramUrl || collab.facebookUrl || collab.twitterUrl || collab.linkedinUrl || collab.tiktokUrl;
        const hasInfo = collab.websiteUrl || hasSocials;

        if (collab.type === 'Brand') {
            if (products.length > 0) {
                base.push({ id: 'products', label: t('products') || tr('PRODUITS', 'السلع', 'PRODUCTS') });
            }
        } else if (collab.type === 'Person') {
            if (hasSocials) {
                base.push({ id: 'socials', label: t('socialMedia') || tr('SOCIALS', 'سوشيال ميديا', 'SOCIALS') });
            }
        } else if (collab.type === 'Company') {
            if (hasInfo) {
                base.push({ id: 'info', label: t('info') || tr('INFOS', 'معلومات', 'INFO') });
            }
        }

        if (collab.type !== 'Brand') {
            base.push({ id: 'reviews', label: t('reviews') || tr('AVIS', 'لي ريفيو', 'REVIEWS') });
        }
        return base;
    };

    const tabs = getTabs();

    const getName = (field: any, fallback = '') => {
        if (!field) return fallback;
        if (typeof field === 'string') return field;
        return field[language] || field['en'] || field['fr'] || fallback;
    };

    // Ensure activeTab is valid for the current type
    React.useEffect(() => {
        if (!tabs.find(tab => tab.id === activeTab)) {
            setActiveTab('about');
        }
    }, [collab.type]);

    // Get translated live button text
    const getLiveButtonText = () => {
        const isLive = liveSession?.status === 'live';
        if (isLive && !isHost) {
            if (language === 'ar') return 'انضم الآن';
            return 'REJOINDRE';
        }

        const fallbackText = isLive ? 'JOIN LIVE' : 'START LIVE';
        const translation = t(isLive ? 'joinLive' : 'startLive');

        // Handle both direct string translations and object translations
        if (typeof translation === 'string') {
            return translation.toUpperCase();
        }
        // If translation is an object with language keys
        if (translation && typeof translation === 'object') {
            return getName(translation, fallbackText).toUpperCase();
        }
        return fallbackText.toUpperCase();
    };

    const fetchBrandProducts = async () => {
        if (collab.type === 'Brand' && collab.brandId) {
            setLoadingProducts(true);
            try {
                const q = query(
                    collection(db, 'products'),
                    where('brandId', '==', collab.brandId),
                    firestoreLimit(20)
                );
                const snap = await getDocs(q);
                const pList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setProducts(pList);

                // Real product calculation reviews
                if (pList.length > 0) {
                    const total = pList.reduce((acc, p: any) => acc + (parseFloat(p.rating) || 5.0), 0);
                    setAverageRating(parseFloat((total / pList.length).toFixed(1)));
                }
            } catch (err) {
                console.error('Error fetching brand products:', err);
            } finally {
                setLoadingProducts(false);
            }
        }
    };

    const fetchCollabReviews = React.useCallback(async () => {
        if (collab.type !== 'Brand') {
            setLoadingReviews(true);
            try {
                const q = query(
                    collection(db, 'reviews'),
                    where('collabId', '==', collab.id),
                    firestoreLimit(10)
                );
                const snap = await getDocs(q);
                // Sort client-side to avoid Index requirement
                const rList = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                    .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setCollabReviews(rList);

                if (rList.length > 0) {
                    const total = rList.reduce((acc, r: any) => acc + (parseFloat(r.rating) || 5.0), 0);
                    setAverageRating(parseFloat((total / rList.length).toFixed(1)));
                } else {
                    setAverageRating(5.0);
                }
            } catch (err) {
                console.error('Error fetching collab reviews:', err);
            } finally {
                setLoadingReviews(false);
            }
        }
    }, [collab.id, collab.type]);

    React.useEffect(() => {
        fetchBrandProducts();
        fetchCollabReviews();

        // Subscribe to live session for this collaboration (or brand)
        const unsubscribeLive = LiveSessionService.subscribeToCollabSessions(
            collab.id,
            (session) => {
                setLiveSession(session);
            },
            collab.brandId
        );

        return () => unsubscribeLive();
    }, [collab.id, collab.brandId]);

    const handleSubmitReview = async () => {
        if (!auth.currentUser) {
            Alert.alert(t('error'), t('pleaseLoginToReview'));
            return;
        }
        if (!userComment.trim()) {
            Alert.alert(t('error'), t('pleaseEnterComment'));
            return;
        }

        setSubmittingReview(true);
        try {
            if (editingReviewId) {
                await updateDoc(doc(db, 'reviews', editingReviewId), {
                    rating: userRating,
                    comment: userComment,
                    updatedAt: serverTimestamp(),
                });
                Alert.alert(t('success') || 'SUCCESS', t('reviewUpdated') || 'Review updated');
            } else {
                await addDoc(collection(db, 'reviews'), {
                    collabId: collab.id,
                    userId: auth.currentUser.uid,
                    userName: auth.currentUser.displayName || t('customer'),
                    rating: userRating,
                    comment: userComment,
                    createdAt: serverTimestamp(),
                    type: 'collaboration'
                });
                Alert.alert(t('featured'), t('reviewSubmitted'));
            }

            setReviewModalVisible(false);
            setUserComment('');
            setUserRating(5);
            setEditingReviewId(null);
            fetchCollabReviews();
        } catch (err) {
            console.error('Error submitting review:', err);
            Alert.alert(t('error'), t('failedToSubmitReview'));
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        Alert.alert(
            t('deleteReview') || 'Delete Review',
            t('confirmDeleteReview') || 'Are you sure you want to delete this review?',
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'reviews', reviewId));
                            Alert.alert(t('success') || 'SUCCESS', t('reviewDeleted') || 'Review deleted');
                            fetchCollabReviews();
                        } catch (err) {
                            console.error('Error deleting review:', err);
                            Alert.alert(t('error'), t('failedToDeleteReview'));
                        }
                    }
                }
            ]
        );
    };

    const handleEditReview = (review: any) => {
        setEditingReviewId(review.id);
        setUserRating(review.rating);
        setUserComment(review.comment);
        setReviewModalVisible(true);
    };

    const handleOpenLink = (url?: string) => {
        if (url) Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open link'));
    };

    const handleShare = async () => {
        setShowBadge(true);
    };

    const handleLiveAction = () => {
        if (!auth.currentUser) {
            Alert.alert(t('error'), t('pleaseLoginToJoinLive') || 'Please login to join live');
            return;
        }

        const isLive = liveSession?.status === 'live';

        // CRITICAL LOGIC:
        // - If NO stream is running: Only Owner can START as HOST
        // - If stream IS running: EVERYONE joins as AUDIENCE (including owner/admin if joining via this button)
        // - Strict Role Check: Use isOwner, remove isAdmin from host privileges
        const isHost = !isLive && isOwner;

        console.log('🎬 CollabDetail Live Action - isLive:', isLive, 'isOwner:', isOwner, 'isAdmin:', isAdmin, 'isHost:', isHost);

        // Navigate to Live Stream
        onJoinLive({
            channelId: (isLive && liveSession?.channelId) ? liveSession.channelId : collab.id,
            isHost: isHost,
            userName: profileData?.fullName || auth.currentUser.displayName || 'Guest',
            userId: auth.currentUser.uid,
            brandId: collab.brandId,
            hostAvatar: collab.coverImageUrl || collab.imageUrl
        });
    };


    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const headerImageStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: interpolate(
                        scrollY.value,
                        [-SCREEN_WIDTH, 0, HEADER_HEIGHT],
                        [SCREEN_WIDTH / 2, 0, -HEADER_HEIGHT / 2],
                        Extrapolate.CLAMP
                    ),
                },
                {
                    scale: interpolate(
                        scrollY.value,
                        [-SCREEN_WIDTH, 0],
                        [2, 1],
                        Extrapolate.CLAMP
                    ),
                },
            ],
        };
    });

    const headerOpacityStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                scrollY.value,
                [HEADER_HEIGHT - 150, HEADER_HEIGHT - 50],
                [0, 1],
                Extrapolate.CLAMP
            ),
        };
    });

    const headerBackgroundStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                scrollY.value,
                [HEADER_HEIGHT - 120, HEADER_HEIGHT - 60],
                [0, 1],
                Extrapolate.CLAMP
            ),
        };
    });

    const SocialButton = ({ icon: Icon, label, url }: { icon: any, label: string, url?: string }) => {
        if (!url) return null;
        return (
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]} onPress={() => handleOpenLink(url)}>
                <Icon size={20} color={isDark ? '#FFF' : '#000'} />
                <Text style={[styles.socialButtonText, { color: isDark ? '#FFF' : '#000' }]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'about': {
                const hasSocials = collab.instagramUrl || collab.facebookUrl || collab.twitterUrl || collab.linkedinUrl || collab.tiktokUrl;
                return (
                    <View style={styles.detailsBox}>
                        <Text style={[styles.sectionText, { color: isDark ? '#D4D4D8' : '#3F3F46' }]}>
                            {getName(collab.description)}
                        </Text>

                        {hasSocials && (
                            <>
                                <Text style={[styles.sectionHeader, { color: isDark ? '#FFF' : '#000', marginTop: 32 }]}>{t('socialMedia')}</Text>
                                <View style={styles.socialGrid}>
                                    <SocialButton icon={Instagram} label="Instagram" url={collab.instagramUrl} />
                                    <SocialButton icon={Facebook} label="Facebook" url={collab.facebookUrl} />
                                    <SocialButton icon={Twitter} label="Twitter" url={collab.twitterUrl} />
                                    <SocialButton icon={Linkedin} label="LinkedIn" url={collab.linkedinUrl} />
                                    <SocialButton icon={Music} label="TikTok" url={collab.tiktokUrl} />
                                </View>
                            </>
                        )}
                    </View>
                );
            }
            case 'products':
                return (
                    <View style={styles.productsGrid}>
                        {loadingProducts ? (
                            <ActivityIndicator color={isDark ? '#FFF' : '#000'} style={{ marginTop: 40 }} />
                        ) : products.length > 0 ? (
                            <View>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingBottom: 20 }}
                                >
                                    {products.map((p) => (
                                        <ProductCard
                                            key={p.id}
                                            product={p}
                                            onPress={() => onProductPress(p)}
                                            theme={theme}
                                            language={language}
                                            showRating={true}
                                            customWidth={SCREEN_WIDTH * 0.45}
                                        />
                                    ))}
                                </ScrollView>
                                <View style={{ paddingHorizontal: 20 }}>
                                    <TouchableOpacity
                                        style={[styles.viewAllBtn, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}
                                        onPress={() => collab.brandId && onNavigateToShop(collab.brandId)}
                                    >
                                        <Text style={[styles.viewAllText, { color: isDark ? '#FFF' : '#000' }]}>{t('viewAllCollection')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <ShoppingBag size={40} color={isDark ? '#27272A' : '#E5E5E5'} />
                                <Text style={{ color: isDark ? '#52525B' : '#A1A1AA', marginTop: 10 }}>{t('noProductsAvailable')}</Text>
                            </View>
                        )}
                    </View>
                );
            case 'socials':
                return (
                    <View style={styles.detailsBox}>
                        <Text style={[styles.sectionHeader, { color: isDark ? '#FFF' : '#000' }]}>{t('socialMedia')}</Text>
                        <View style={styles.socialGrid}>
                            <SocialButton icon={Instagram} label="Instagram" url={collab.instagramUrl} />
                            <SocialButton icon={Facebook} label="Facebook" url={collab.facebookUrl} />
                            <SocialButton icon={Twitter} label="Twitter" url={collab.twitterUrl} />
                            <SocialButton icon={Linkedin} label="LinkedIn" url={collab.linkedinUrl} />
                            <SocialButton icon={Music} label="TikTok" url={collab.tiktokUrl} />
                        </View>
                    </View>
                );
            case 'info': {
                const hasSocials = collab.instagramUrl || collab.facebookUrl || collab.twitterUrl || collab.linkedinUrl || collab.tiktokUrl;
                return (
                    <View style={styles.detailsBox}>
                        <View style={{ gap: 12 }}>
                            {collab.websiteUrl && (
                                <TouchableOpacity
                                    onPress={() => handleOpenLink(collab.websiteUrl!)}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', padding: 15, borderRadius: 12 }}
                                >
                                    <Globe size={18} color={colors.textMuted} />
                                    <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>{collab.websiteUrl.replace('https://', '').toUpperCase()}</Text>
                                </TouchableOpacity>
                            )}

                            {hasSocials && (
                                <>
                                    <Text style={[styles.sectionHeader, { color: isDark ? '#FFF' : '#000', marginTop: collab.websiteUrl ? 15 : 0 }]}>{t('socialMedia')}</Text>
                                    <View style={styles.socialGrid}>
                                        <SocialButton icon={Instagram} label="Instagram" url={collab.instagramUrl} />
                                        <SocialButton icon={Linkedin} label="LinkedIn" url={collab.linkedinUrl} />
                                        <SocialButton icon={Facebook} label="Facebook" url={collab.facebookUrl} />
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                );
            }
            case 'reviews':
                return (
                    <View style={[styles.detailsBox, { paddingBottom: 100 }]}>
                        {loadingReviews ? (
                            <ActivityIndicator color={colors.foreground} style={{ marginTop: 40 }} />
                        ) : collabReviews.length > 0 ? (
                            <View style={{ gap: 20 }}>
                                {collabReviews.map((rev) => (
                                    <View key={rev.id} style={{ backgroundColor: isDark ? '#1C1C1E' : '#F9F9FB', padding: 20, borderRadius: 20 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontWeight: '800', color: colors.foreground }}>{rev.userName}</Text>
                                                <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star key={s} size={10} color={s <= rev.rating ? '#FFD700' : colors.textMuted} fill={s <= rev.rating ? '#FFD700' : 'transparent'} />
                                                    ))}
                                                </View>
                                            </View>

                                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                                {(rev.userId === auth.currentUser?.uid) && (
                                                    <TouchableOpacity onPress={() => handleEditReview(rev)}>
                                                        <Pencil size={16} color={badgeColor} />
                                                    </TouchableOpacity>
                                                )}
                                                {(rev.userId === auth.currentUser?.uid || isAdmin || isOwner) && (
                                                    <TouchableOpacity onPress={() => handleDeleteReview(rev.id)}>
                                                        <Trash2 size={16} color="#EF4444" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                        <Text style={{ color: isDark ? '#D4D4D8' : '#3F3F46', lineHeight: 20, fontSize: 13 }}>{rev.comment}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={{ alignItems: 'center', paddingTop: 40 }}>
                                <Star size={48} color={isDark ? '#27272A' : '#E5E5E5'} />
                                <Text style={{ color: isDark ? '#FFF' : '#000', fontSize: 24, fontWeight: '800', marginTop: 16 }}>{averageRating}</Text>
                                <Text style={{ color: colors.textMuted, marginTop: 4 }}>{t('noReviews')}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.viewAllBtn, { backgroundColor: isDark ? '#FFF' : '#000', width: '100%', marginTop: 32 }]}
                            onPress={() => setReviewModalVisible(true)}
                        >
                            <Text style={[styles.viewAllText, { color: isDark ? '#000' : '#FFF' }]}>{t('leaveReview')}</Text>
                        </TouchableOpacity>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#000' : '#FFF' }}>
            {/* Background Image Layer - Fades out */}
            <Animated.View style={[StyleSheet.absoluteFillObject, { height: HEADER_HEIGHT }, headerImageStyle]}>
                <Image
                    source={{ uri: collab.coverImageUrl || collab.imageUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={[
                        'transparent',
                        isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                        isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
                        isDark ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)',
                    ]}
                    style={styles.heroGradient}
                />
            </Animated.View>

            {/* Fixed Top Bar (Always Visible) */}
            <View style={[styles.fixedHeaderButtons, { top: insets.top + 10 }]}>
                {/* Animated Background Blur */}
                <Animated.View style={[
                    {
                        position: 'absolute',
                        left: -20,
                        right: -20,
                        top: -insets.top - 10,
                        height: insets.top + 70,
                        zIndex: -1,
                        overflow: 'hidden',
                    },
                    headerBackgroundStyle
                ]}>
                    <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                </Animated.View>

                <TouchableOpacity
                    onPress={onBack}
                    style={[styles.circleButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
                >
                    <ChevronLeft size={24} color="#FFF" />
                </TouchableOpacity>

                {/* This will contain the small logo/name when scrolled */}
                <Animated.View style={[styles.compactHeaderContent, headerOpacityStyle]}>
                    <Image source={{ uri: collab.imageUrl }} style={styles.compactLogo} />
                    <View>
                        <Text style={[styles.compactTitle, { color: isDark ? '#FFF' : '#000' }]} numberOfLines={1}>{collab.name}</Text>
                        <View style={styles.compactBadgeRow}>
                            <CheckCircle2 size={10} color={badgeColor} />
                            <Text style={[styles.compactBadgeText, { color: badgeColor }]}>{t('officialPartner')}</Text>
                        </View>
                    </View>
                </Animated.View>

                <TouchableOpacity
                    style={styles.circleButton}
                    onPress={handleShare}
                >
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <QrCode size={18} color="#FFF" />
                </TouchableOpacity>
            </View>

            <Animated.ScrollView
                style={StyleSheet.absoluteFill}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingTop: HEADER_HEIGHT - 60 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.contentContainer, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
                    {/* Brand Header */}
                    <View style={styles.profileHeader}>
                        <Animatable.View
                            animation={liveSession?.status === 'live' ? "pulse" : undefined}
                            iterationCount="infinite"
                            style={[styles.imageContainer, { borderColor: liveSession?.status === 'live' ? '#EF4444' : (isDark ? '#27272A' : '#E5E5E5') }]}
                        >
                            <Image source={{ uri: collab.imageUrl }} style={styles.profileImage} />
                            {liveSession?.status === 'live' && (
                                <View style={styles.liveIndicator}>
                                    <View style={styles.liveNowBadge}>
                                        <Animatable.View
                                            animation="pulse"
                                            easing="ease-out"
                                            iterationCount="infinite"
                                            style={styles.pulseDot}
                                        />
                                        <Text style={styles.liveNowBadgeText}>
                                            {t('enDirect') || 'EN DIRECT'}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            <View style={[styles.verifiedBadge, { backgroundColor: badgeColor, borderColor: isDark ? '#000' : '#FFF' }]}>
                                <CheckCircle2 size={14} color={isDark ? '#000' : '#FFF'} />
                            </View>
                        </Animatable.View>
                        <View style={styles.titleSection}>
                            <Text style={[styles.brandName, { color: isDark ? '#FFF' : '#000' }]}>{collab.name}</Text>
                            <View style={[styles.badgeContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
                                <CheckCircle2 size={12} color={badgeColor} />
                                <Text style={[styles.badgeText, { color: badgeColor }]}>{t('officialPartner')}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Bar */}
                    <View style={styles.actionBar}>
                        {liveSession?.status === 'live' ? (
                            // === LIVE STATE ===
                            // 1. Live Banner (Viewer Count)
                            // 2. Join Button (Red) - Visible to ALL
                            // 3. Follow/Shop Buttons
                            <>
                                <View style={styles.liveSessionBanner}>
                                    <View style={styles.liveSessionBadge}>
                                        <Animatable.View
                                            animation="pulse"
                                            easing="ease-out"
                                            iterationCount="infinite"
                                            style={styles.pulseDot}
                                        />
                                        <Text style={styles.liveSessionBadgeText}>{t('enDirect') || 'EN DIRECT'}</Text>
                                    </View>
                                    <View style={styles.viewerCountContainer}>
                                        <Eye size={12} color={isDark ? '#A1A1AA' : '#666'} />
                                        <Text style={styles.viewerCountText}>
                                            {liveSession?.viewCount || 0} {t('viewers')}
                                        </Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', width: '100%', gap: 12, marginBottom: 12 }}>
                                    {/* JOIN BUTTON - Visible to everyone */}
                                    <TouchableOpacity
                                        style={[styles.liveActionButton, { backgroundColor: '#EF4444', flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
                                        onPress={handleLiveAction}
                                    >
                                        <Animatable.View
                                            animation="pulse"
                                            iterationCount="infinite"
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: '#FFF',
                                                marginRight: 8
                                            }}
                                        />
                                        <Text style={styles.liveActionText} numberOfLines={1} adjustsFontSizeToFit>
                                            {getLiveButtonText()}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* FOLLOW BUTTON */}
                                    <TouchableOpacity
                                        style={[styles.secondaryAction, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}
                                        onPress={() => toggleFollowCollab(collab.id)}
                                    >
                                        <Text style={[styles.badgeText, { color: isDark ? '#FFF' : '#000' }]} numberOfLines={1} adjustsFontSizeToFit>
                                            {isFollowed ? t('unfollow') : t('follow')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* SHOP BUTTON (If Brand) */}
                                {collab.type === 'Brand' && collab.brandId && (
                                    <TouchableOpacity
                                        style={[styles.primaryAction, { backgroundColor: isDark ? '#FFF' : '#000', width: '100%' }]}
                                        onPress={() => onNavigateToShop(collab.brandId!)}
                                    >
                                        <Text style={[styles.primaryActionText, { color: isDark ? '#000' : '#FFF' }]} numberOfLines={1} adjustsFontSizeToFit>
                                            {t('shopCollection')}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            // === NOT LIVE STATE ===
                            // 1. Host: Show Start Live Link
                            // 2. Everyone: Follow/Shop
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                {/* START BUTTON - ONLY FOR HOST */}
                                {isHost && (
                                    <TouchableOpacity
                                        style={[styles.liveActionButton, { backgroundColor: '#EF4444', flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 }]}
                                        onPress={handleLiveAction}
                                    >
                                        <Camera size={16} color="#FFF" style={{ marginRight: 6 }} />
                                        <Text
                                            style={[styles.liveActionText, { flexShrink: 1, textAlign: 'center' }]}
                                            numberOfLines={2}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.75}
                                        >
                                            {t('startLive') || 'START LIVE'}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* FOLLOW BUTTON - Always visible (flex grows if no start button) */}
                                <TouchableOpacity
                                    style={[styles.secondaryAction, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', flex: 1 }]}
                                    onPress={() => toggleFollowCollab(collab.id)}
                                >
                                    <Text
                                        style={[styles.badgeText, { color: isDark ? '#FFF' : '#000' }]}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                    >
                                        {isFollowed ? t('unfollow') : t('follow')}
                                    </Text>
                                </TouchableOpacity>

                                {/* SHOP BUTTON (If Brand) - Full width in own row usually, but here flexed */}
                                {collab.type === 'Brand' && collab.brandId && (
                                    <TouchableOpacity
                                        style={[styles.primaryAction, { backgroundColor: isDark ? '#FFF' : '#000', flex: 1 }]}
                                        onPress={() => onNavigateToShop(collab.brandId!)}
                                    >
                                        <Text
                                            style={[styles.primaryActionText, { color: isDark ? '#000' : '#FFF' }]}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                        >
                                            {t('shopCollection')}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Stats Bar */}
                    <View style={styles.statsBar}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#000' }]}>{averageRating}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                <Star size={10} color="#FFD700" fill="#FFD700" />
                                <Text style={[styles.statLabel, { color: isDark ? '#A1A1AA' : '#666' }]}>{t('rating')}</Text>
                            </View>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: isDark ? '#27272A' : '#E5E5E5' }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#000' }]}>
                                {collab.followersCount ? (Math.max(0, collab.followersCount) >= 1000 ? `${(Math.max(0, collab.followersCount) / 1000).toFixed(1)}k` : Math.max(0, collab.followersCount)) : '0'}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                <Users size={10} color={isDark ? '#A1A1AA' : '#666'} />
                                <Text style={[styles.statLabel, { color: isDark ? '#A1A1AA' : '#666' }]}>
                                    {collab.type === 'Person' ? t('followers') : t('creators') || 'CREATORS'}
                                </Text>
                            </View>
                        </View>
                        {collab.type === 'Brand' && (
                            <>
                                <View style={[styles.statDivider, { backgroundColor: isDark ? '#27272A' : '#E5E5E5' }]} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#000' }]}>{products.length}+</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                        <ShoppingBag size={10} color={isDark ? '#A1A1AA' : '#666'} />
                                        <Text style={[styles.statLabel, { color: isDark ? '#A1A1AA' : '#666' }]}>{t('products')}</Text>
                                    </View>
                                </View>
                            </>
                        )}
                        {collab.type !== 'Brand' && (
                            <>
                                <View style={[styles.statDivider, { backgroundColor: isDark ? '#27272A' : '#E5E5E5' }]} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#000' }]}>
                                        {collab.worksCount ? (Math.max(0, collab.worksCount) >= 1000 ? `${(Math.max(0, collab.worksCount) / 1000).toFixed(1)}k` : Math.max(0, collab.worksCount)) : '0'}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                        <CheckCircle2 size={10} color={badgeColor} />
                                        <Text style={[styles.statLabel, { color: isDark ? '#A1A1AA' : '#666' }]}>
                                            {t('works')}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabBar}>
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab.id}
                                onPress={() => setActiveTab(tab.id)}
                                style={[styles.tab, activeTab === tab.id && { borderBottomColor: isDark ? '#FFF' : '#000', borderBottomWidth: 2 }]}
                            >
                                <Text style={[styles.tabText, { color: activeTab === tab.id ? (isDark ? '#FFF' : '#000') : (isDark ? '#52525B' : '#A1A1AA') }]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tab Content */}
                    <View style={styles.tabContent}>
                        {renderTabContent()}
                    </View>
                </View >
            </Animated.ScrollView >

            {/* Review Modal */}
            <Modal visible={reviewModalVisible} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: isDark ? '#121218' : '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: insets.bottom + 20, maxHeight: '90%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.foreground }}>
                                {editingReviewId ? (t('editReview') || 'EDIT REVIEW') : t('leaveReview')}
                            </Text>
                            <TouchableOpacity onPress={() => {
                                setReviewModalVisible(false);
                                setEditingReviewId(null);
                                setUserComment('');
                                setUserRating(5);
                            }}>
                                <X size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={[1]}
                            keyExtractor={() => 'review-form'}
                            renderItem={() => (
                                <View>
                                    <Text style={{ color: colors.textMuted, marginBottom: 15, fontWeight: '700' }}>{t('rating').toUpperCase()}</Text>
                                    <View style={{ flexDirection: 'row', gap: 15, marginBottom: 30 }}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <TouchableOpacity key={s} onPress={() => setUserRating(s)}>
                                                <Star size={32} color={s <= userRating ? '#FFD700' : colors.textMuted} fill={s <= userRating ? '#FFD700' : 'transparent'} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={{ color: colors.textMuted, marginBottom: 10, fontWeight: '700' }}>{t('comment').toUpperCase()}</Text>
                                    <TextInput
                                        style={{ backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', borderRadius: 15, padding: 15, height: 120, color: colors.foreground, textAlignVertical: 'top' }}
                                        placeholder={t('writeReviewPlaceholder')}
                                        placeholderTextColor={colors.textMuted}
                                        multiline
                                        value={userComment}
                                        onChangeText={setUserComment}
                                    />

                                    <TouchableOpacity
                                        style={[styles.primaryAction, { marginTop: 30, backgroundColor: isDark ? '#FFF' : '#000' }]}
                                        onPress={handleSubmitReview}
                                        disabled={submittingReview}
                                    >
                                        {submittingReview ? <ActivityIndicator color={isDark ? '#000' : '#FFF'} /> : <Text style={[styles.primaryActionText, { color: isDark ? '#000' : '#FFF' }]}>{t('submit') || 'SUBMIT'}</Text>}
                                    </TouchableOpacity>
                                </View>
                            )}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        />
                    </View>
                </View>
            </Modal>
            {showBadge && (
                <CollabBadge
                    collab={collab as any}
                    isDark={isDark}
                    language={language}
                    onClose={() => setShowBadge(false)}
                    onVisitProfile={() => setShowBadge(false)}
                    t={t}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    fixedHeaderButtons: {
        position: 'absolute',
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
    },
    circleButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    compactHeaderContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 15,
    },
    compactLogo: {
        width: 36,
        height: 36,
        borderRadius: 10,
        marginRight: 10,
    },
    compactTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    compactBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    compactBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#22C55E',
        letterSpacing: 0.5,
    },
    contentContainer: {
        flex: 1,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingTop: 0,
        minHeight: 800,
    },
    profileHeader: {
        alignItems: 'center',
        marginTop: -60,
    },
    imageContainer: {
        width: 124,
        height: 124,
        borderRadius: 42,
        padding: 4,
        borderWidth: 4,
        backgroundColor: '#FFF',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 38,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#22C55E',
        padding: 4,
        borderRadius: 12,
        borderWidth: 3,
        zIndex: 20,
    },
    liveIndicator: {
        position: 'absolute',
        bottom: -8,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 25,
    },
    liveNowBadge: {
        backgroundColor: '#EF4444',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#000',
        gap: 5,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    liveNowBadgeText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFF',
    },
    titleSection: {
        alignItems: 'center',
        marginTop: 15,
    },
    brandName: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 8,
        gap: 6,
    },
    badgeText: {
        fontSize: 7.5,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    actionBar: {
        paddingHorizontal: 20,
        marginTop: 30,
        gap: 10,
    },
    primaryAction: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    primaryActionText: {
        fontSize: 7.5,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    secondaryAction: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsBar: {
        flexDirection: 'row',
        marginHorizontal: 20,
        paddingVertical: 25,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: 30,
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    tab: {
        paddingVertical: 15,
        marginRight: 25,
    },
    tabText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    tabContent: {
        paddingVertical: 20,
        paddingBottom: 120, // Bottom padding to ensure content shows properly above nav
    },
    detailsBox: {
        paddingHorizontal: 20,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 15,
    },
    sectionText: {
        fontSize: 15,
        lineHeight: 24,
        fontWeight: '500',
    },
    socialGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    socialButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },
    productsGrid: {
        paddingHorizontal: 0,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    viewAllBtn: {
        width: '100%',
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '800',
    },
    liveActionButton: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    liveActionText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    liveSessionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.15)',
    },
    liveSessionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 6,
    },
    liveSessionBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    viewerCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    viewerCountText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#A1A1AA',
    },
});
