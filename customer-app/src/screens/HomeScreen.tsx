import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    FlatList,
    Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    collection,
    getDocs,
    query,
    limit,
    where,
} from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Bell,
    User,
    Clock,
    Package,
    Shield,
    RotateCcw,
    Search,
    ChevronRight,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';

// BNA UI Components
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import UniversalVideoPlayer from '@/components/common/UniversalVideoPlayer';
import { FlashSaleCountdown } from '@/components/home/FlashSaleCountdown';

// Hooks & Context
import { useAppTheme } from '@/context/ThemeContext';
import { useColor } from '@/hooks/useColor';
import { db } from '@/api/firebase';

// Constants & Utils
import { width, APP_ICON } from '@/constants/layout';
import { getName, translateCategory } from '@/utils/translationHelpers';
import { LiveSessionService, LiveSession } from '@/services/LiveSessionService';

interface HomeScreenProps {
    user: any;
    profileData: any;
    onProductPress: (product: any) => void;
    onCategoryPress: (catId: string) => void;
    onCampaignPress: (campaign: any) => void;
    onNavigate: (screen: string, params?: any) => void;
    wishlist: string[];
    toggleWishlist: (productId: string) => void;
    notifications: any[];
    addToCart: (product: any) => void;
    t: (key: string) => string;
    language: string;
    setFilterBrand: (brandId: string | null) => void;
    onJoinLive: (info: any) => void;
}

export default function HomeScreen({
    user,
    profileData,
    onProductPress,
    onCategoryPress,
    onCampaignPress,
    onNavigate,
    wishlist,
    toggleWishlist,
    notifications,
    addToCart,
    t,
    language,
    setFilterBrand,
    onJoinLive
}: HomeScreenProps) {
    const { theme } = useAppTheme();
    const tr = (fr: string, ar: string, en: string) => {
        return language === 'ar' ? ar : language === 'fr' ? fr : en;
    };
    const backgroundColor = useColor('background');
    const foregroundColor = useColor('foreground');
    const borderSecondary = useColor('border');
    const mutedColor = useColor('mutedForeground');
    const accentColor = useColor('accent');
    const errorColor = useColor('destructive');

    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [featured, setFeatured] = useState<any[]>([]);
    const [banners, setBanners] = useState<any[]>([]);
    const [ads, setAds] = useState<any[]>([]);
    const [flashSale, setFlashSale] = useState<any>(null);
    const [flashProducts, setFlashProducts] = useState<any[]>([]);
    const [promoBanners, setPromoBanners] = useState<any[]>([]);
    const [collaborations, setCollaborations] = useState<any[]>([]);
    const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
    const [liveChannels, setLiveChannels] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollY = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();

    const randomColors = [
        "#FF6B6B", "#FF4757", "#FF9F1C", "#FF922B", "#FFD93D", "#F9C74F",
        "#6BCB77", "#2ECC71", "#06D6A0", "#00C896", "#00B4D8", "#48CAE4",
        "#4D96FF", "#3A86FF", "#4361EE", "#7209B7", "#9D4EDD", "#8338EC",
        "#B5179E", "#F72585", "#FF4D6D", "#FB5607",
    ];
    const [randomBorderColor, setRandomBorderColor] = useState("#FF6B6B");

    useEffect(() => {
        const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)];
        setRandomBorderColor(randomColor);
    }, []);

    const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    useEffect(() => {
        fetchData();
        const unsubscribeLive = LiveSessionService.subscribeToAllSessions((sessions: LiveSession[]) => {
            const now = Date.now();
            const active = sessions.filter(s => {
                const start = s.startedAt?.toMillis?.() || (s.startedAt?.seconds ? s.startedAt.seconds * 1000 : 0);
                return s.status === 'live' && (now - start) < (6 * 60 * 60 * 1000);
            });
            setLiveSessions(active);
            const liveIds = active.flatMap(s => [s.brandId, s.collabId, s.channelId]).filter(Boolean) as string[];
            setLiveChannels(liveIds);
        });
        return () => unsubscribeLive();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const catSnap = await getDocs(collection(db, 'categories'));
            setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const brandsSnap = await getDocs(collection(db, 'brands'));
            setBrands(brandsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((b: any) => b.isActive !== false));

            const prodSnap = await getDocs(query(collection(db, 'products'), limit(6)));
            setFeatured(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const bannerSnap = await getDocs(collection(db, 'banners'));
            setBanners(bannerSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((b: any) => b.isActive !== false)
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));

            const adsSnap = await getDocs(collection(db, 'ads'));
            setAds(adsSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((a: any) => a.isActive !== false)
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));

            // Flash Sale
            try {
                const settingsSnap = await getDocs(collection(db, 'settings'));
                const now = new Date().getTime();
                let activeFlashSales: any[] = settingsSnap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter((d: any) => d.id.startsWith('flashSale') && d.active)
                    .filter((fs: any) => {
                        const end = fs.endTime ? new Date(fs.endTime).getTime() : 0;
                        return end > now;
                    });

                if (activeFlashSales.length > 0) {
                    const soonestFlashSale = activeFlashSales.reduce((prev: any, curr: any) => {
                        const prevEnd = new Date(prev.endTime).getTime();
                        const currEnd = new Date(curr.endTime).getTime();
                        return currEnd < prevEnd ? curr : prev;
                    });
                    setFlashSale(soonestFlashSale);

                    let allProductIds: string[] = [];
                    activeFlashSales.forEach((fs: any) => {
                        if (fs.productIds && Array.isArray(fs.productIds)) {
                            allProductIds.push(...fs.productIds);
                        }
                    });
                    allProductIds = [...new Set(allProductIds)];

                    if (allProductIds.length > 0) {
                        const pSnap = await getDocs(query(collection(db, 'products'), where('__name__', 'in', allProductIds.slice(0, 10))));
                        setFlashProducts(pSnap.docs.map(d => {
                            const pId = d.id;
                            const relatedFs = activeFlashSales.find((fs: any) => fs.productIds.includes(pId));
                            return { ...d.data(), id: pId, flashSaleEndTime: relatedFs?.endTime };
                        }));
                    }
                }
            } catch (e) { console.log(e); }

            const promoSnap = await getDocs(collection(db, 'promoBanners'));
            setPromoBanners(promoSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter((b: any) => b.isActive !== false)
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));

            const collabSnap = await getDocs(query(collection(db, 'collaborations'), where('isActive', '==', true)));
            setCollaborations(collabSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const bannerRef = useRef<FlatList>(null);
    const scrollIndex = useRef(0);
    const promoRef = useRef<FlatList>(null);
    const promoScrollIndex = useRef(0);

    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            scrollIndex.current = (scrollIndex.current + 1) % banners.length;
            bannerRef.current?.scrollToIndex({ index: scrollIndex.current, animated: true });
        }, 4000);
        return () => clearInterval(interval);
    }, [banners]);

    useEffect(() => {
        if (promoBanners.length <= 1) return;
        const interval = setInterval(() => {
            promoScrollIndex.current = (promoScrollIndex.current + 1) % promoBanners.length;
            promoRef.current?.scrollToIndex({ index: promoScrollIndex.current, animated: true });
        }, 5000);
        return () => clearInterval(interval);
    }, [promoBanners]);

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor }]}>
                <ActivityIndicator size="large" color={foregroundColor} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <Animated.View style={[styles.modernHeader, {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                height: 64 + insets.top,
                paddingTop: insets.top,
                borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                borderBottomColor: borderSecondary + '20'
            }]}>
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
                    <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: backgroundColor + '66' }]} />
                </Animated.View>

                <TouchableOpacity
                    onPress={() => onNavigate('Profile')}
                    activeOpacity={0.7}
                    style={{ borderWidth: 2, borderColor: randomBorderColor, borderRadius: 50 }}
                >
                    <Avatar
                        source={profileData?.avatarUrl || user?.photoURL}
                        size={42}
                        fallback={profileData?.fullName?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
                    />
                </TouchableOpacity>

                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 90 }}>
                    <Image
                        source={require("../../assets/logo.png")}
                        style={{ width: 300, height: 200, resizeMode: 'contain' }}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.searchCircle, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}
                    activeOpacity={0.7}
                    onPress={() => onNavigate('Notifications')}
                >
                    <Bell size={20} color={foregroundColor} strokeWidth={2.5} />
                    {unreadCount > 0 && <View style={[styles.unreadBadge, { backgroundColor: errorColor, borderColor: theme === 'dark' ? '#000' : '#FFF' }]} />}
                </TouchableOpacity>
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 64 + insets.top + 15, paddingBottom: 100 + insets.bottom }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Live Event Banner */}
                {(() => {
                    const now = Date.now();
                    const activeSessions = liveSessions.filter(s => {
                        const start = s.startedAt?.toMillis?.() || (s.startedAt?.seconds ? s.startedAt.seconds * 1000 : 0);
                        return s.status === 'live' && (now - start) < (6 * 60 * 60 * 1000);
                    });

                    const bestLiveSession = activeSessions.length > 0
                        ? activeSessions.reduce((prev, current) => (Math.max(0, prev.viewCount) > Math.max(0, current.viewCount)) ? prev : current)
                        : null;

                    if (!bestLiveSession) return null;

                    const bestCollab = collaborations.find(c =>
                        c.id === bestLiveSession.collabId ||
                        c.id === bestLiveSession.channelId ||
                        (c.brandId && c.brandId === bestLiveSession.brandId)
                    );

                    return (
                        <TouchableOpacity
                            onPress={() => onJoinLive({
                                channelId: bestLiveSession.channelId,
                                isHost: false,
                                userName: profileData?.fullName || user?.displayName || 'Guest',
                                userId: user?.uid,
                                brandId: bestCollab?.brandId || bestLiveSession.brandId,
                                hostAvatar: bestCollab?.coverImageUrl || bestCollab?.imageUrl || bestLiveSession.hostAvatar
                            })}
                            activeOpacity={0.9}
                            style={[styles.liveEventBanner, {
                                backgroundColor: theme === 'dark' ? '#121218' : '#FFF',
                                borderColor: errorColor,
                                shadowColor: errorColor,
                            }]}
                        >
                            <LinearGradient
                                colors={theme === 'dark' ? ['#1A1A1A', '#000000'] : ['#FFF5F5', '#FFFFFF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.liveBannerGradient}
                            >
                                <View style={styles.liveAvatarContainer}>
                                    <Animatable.View animation="pulse" iterationCount="infinite" style={[styles.liveAvatarPulse, { borderColor: errorColor }]}>
                                        <Image
                                            source={(bestCollab?.imageUrl || bestLiveSession.hostAvatar) ? { uri: bestCollab?.imageUrl || bestLiveSession.hostAvatar } : APP_ICON}
                                            style={[styles.liveAvatar, { backgroundColor: borderSecondary }]}
                                        />
                                    </Animatable.View>
                                    <Animatable.View animation="bounceIn" style={[styles.liveBadge, { backgroundColor: errorColor, borderColor: theme === 'dark' ? '#121218' : '#FFF' }]}>
                                        <Text variant="caption" style={styles.liveBadgeText}>{t('enDirect') || 'EN DIRECT'}</Text>
                                    </Animatable.View>
                                </View>

                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                    <Text variant="body" style={{ letterSpacing: -0.5, marginBottom: 2 }} numberOfLines={1}>
                                        {((bestCollab ? getName(bestCollab.name, language) : (bestLiveSession.hostName || 'BROADCASTER'))).toUpperCase()}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <View style={{ position: 'relative', width: 8, height: 8, alignItems: 'center', justifyContent: 'center' }}>
                                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: errorColor }} />
                                            <Animatable.View animation="pulse" iterationCount="infinite" style={[styles.liveStatusDot, { backgroundColor: errorColor + '4D' }]} />
                                        </View>
                                        <Text variant="caption" style={{ color: mutedColor, fontWeight: '800', opacity: 0.8 }}>
                                            {Math.max(0, bestLiveSession.viewCount)} {t('viewers')} • {t('joinNow')}
                                        </Text>
                                    </View>
                                </View>

                                <Animatable.View animation="pulse" iterationCount="infinite" style={{ marginLeft: 10 }}>
                                    <View style={[styles.joinBtn, { backgroundColor: errorColor }]}>
                                        <Text variant="caption" style={{ color: '#FFF', letterSpacing: 1.5 }}>{t('join').toUpperCase()}</Text>
                                    </View>
                                </Animatable.View>
                            </LinearGradient>
                        </TouchableOpacity>
                    );
                })()}

                {/* Live Now Collaborations */}
                {collaborations.filter(c => liveChannels.includes(c.id) || (c.brandId && liveChannels.includes(c.brandId))).length > 0 && (
                    <View style={{ marginTop: 20 }}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text variant="heading" style={{ letterSpacing: 4 }}>{t('liveNow').toUpperCase()}</Text>
                                <View style={{ width: 25, height: 2, backgroundColor: errorColor, marginTop: 4 }} />
                            </View>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
                            {collaborations.filter(c => liveChannels.includes(c.id) || (c.brandId && liveChannels.includes(c.brandId))).map(c => (
                                <TouchableOpacity
                                    key={c.id}
                                    style={{ alignItems: 'center' }}
                                    onPress={() => {
                                        const session = liveSessions.find(s => s.brandId === c.brandId || s.collabId === c.id || s.channelId === c.id || (c.brandId && s.channelId === c.brandId));
                                        onJoinLive({
                                            channelId: session?.channelId || c.id,
                                            isHost: false,
                                            userName: profileData?.fullName || user?.displayName || 'Guest',
                                            userId: user?.uid,
                                            brandId: c.brandId,
                                            hostAvatar: c.coverImageUrl || c.imageUrl
                                        });
                                    }}
                                >
                                    <View style={{ position: 'relative', alignItems: 'center' }}>
                                        <Animatable.View animation="pulse" iterationCount="infinite" style={[styles.liveNowAvatarContainer, { borderColor: errorColor }]}>
                                            <Image source={c.imageUrl ? { uri: c.imageUrl } : APP_ICON} style={[styles.liveNowAvatar, { backgroundColor: borderSecondary, borderColor: backgroundColor }]} />
                                        </Animatable.View>
                                        <Animatable.View animation="bounceIn" style={[styles.liveNowBadge, { backgroundColor: errorColor, borderColor: backgroundColor }]}>
                                            <Text style={styles.liveNowBadgeText}>{t('enDirect') || 'EN DIRECT'}</Text>
                                        </Animatable.View>
                                    </View>
                                    <Text variant="caption" numberOfLines={1} style={{ marginTop: 8, width: 70, textAlign: 'center' }}>
                                        {getName(c.name, language).toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Banner Carousel */}
                <View style={{ marginTop: 15 }}>
                    <FlatList
                        ref={bannerRef}
                        data={banners.length > 0 ? banners : [{ id: '1', imageUrl: 'https://images.unsplash.com/photo-1539106609512-725e3652e361?w=800' }]}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item.id}
                        snapToInterval={width - 30 + 15}
                        decelerationRate="fast"
                        snapToAlignment="start"
                        contentContainerStyle={{ paddingLeft: 15 }}
                        renderItem={({ item }) => (
                            <View style={{ width: width - 30, marginRight: 15 }}>
                                <View style={styles.modernHero}>
                                    <Image source={{ uri: item.imageUrl }} style={styles.modernHeroImg} />
                                    <View style={styles.heroGlassBadge}>
                                        <Text variant="caption" style={{ color: 'white', letterSpacing: 1, fontSize: 10 }}>{getName(item.subtitle, language).toUpperCase() || t('newDrop')}</Text>
                                    </View>
                                    <View style={styles.modernHeroFooter}>
                                        <Text variant="heading" style={{ color: 'white', letterSpacing: -0.5, lineHeight: 28, marginBottom: 15, fontSize: 22 }}>
                                            {getName(item.title, language).toUpperCase() || (item.title ? item.title.toUpperCase() : t('futureMinimalism'))}
                                        </Text>
                                        <Button
                                            label={item.ctaText || tr('Acheter maintenant', 'تسوق الآن', 'Shop Now') || t('viewAll') || 'SHOP NOW'}
                                            variant="default"
                                            size="sm"
                                            onPress={() => onNavigate('Shop')}
                                            style={styles.heroBtn}
                                            textStyle={{ letterSpacing: 1, fontSize: 12 }}
                                        />
                                    </View>
                                </View>
                            </View>
                        )}
                    />
                </View>

                {/* Collections Section */}
                <View style={styles.modernSection}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text variant="heading" style={{ letterSpacing: 4, fontSize: 13 }}>{t('collections') || 'COLLECTIONS'}</Text>
                            <View style={{ width: 15, height: 2, backgroundColor: accentColor, marginTop: 4 }} />
                        </View>
                        <TouchableOpacity onPress={() => onNavigate('Shop')}>
                            <Text variant="body" style={{ color: foregroundColor , fontSize: 12 }}>{t('seeAll')}</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionsScroll}>
                        {/* Categories */}
                        <View>
                            <Text variant="caption" style={{ color: mutedColor, marginBottom: 8, letterSpacing: 1, fontSize: 10 }}>{t('categories').toUpperCase()}</Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                {categories.map((cat: any) => (
                                    <TouchableOpacity key={cat.id} style={{ alignItems: 'center' }} onPress={() => onCategoryPress(cat.id)}>
                                        <View style={[styles.modernCatCard, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9F9', borderColor: borderSecondary }]}>
                                            <Image source={{ uri: cat.image || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400' }} style={styles.catBgImage} />
                                        </View>
                                        <Text variant="caption" style={{ marginTop: 8, letterSpacing: 1, fontSize: 9 }}>{String(translateCategory(getName(cat.name, language), language)).toUpperCase()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {categories.length > 0 && brands.length > 0 && <View style={[styles.separator, { backgroundColor: borderSecondary }]} />}
                        {/* Brands */}
                         <View>
                            <Text variant="caption" style={{ color: mutedColor, marginBottom: 8, letterSpacing: 1, fontSize: 10 }}>{t('brands').toUpperCase()}</Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                {brands.map((brand: any) => (
                                    <TouchableOpacity key={brand.id} style={{ alignItems: 'center' }} onPress={() => onCategoryPress(brand.id)}>
                                        <View style={[styles.modernCatCard, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9F9', borderColor: borderSecondary }]}>
                                            <Image source={{ uri: brand.image || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400' }} style={styles.catBgImage} />
                                        </View>
                                        <Text variant="caption" style={{ marginTop: 8, letterSpacing: 1, fontSize: 9 }}>{String(translateCategory(getName(brand.name, language), language)).toUpperCase()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* Flash Sale */}
                {flashSale && (
                    <View style={{ marginTop: 30 }}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View>
                                    <Text variant="heading" style={{ letterSpacing: 4, fontSize: 13 }}>{t('flashSale')}</Text>
                                    <View style={{ width: 15, height: 2, backgroundColor: accentColor, marginTop: 4 }} />
                                </View>
                                <FlashSaleCountdown endTime={flashSale.endTime} onEnd={() => setFlashSale(null)} />
                            </View>
                            <TouchableOpacity onPress={() => onNavigate('Shop')}>
                                <Text variant="body" style={{ color: foregroundColor, fontSize: 12 }}>{t('seeAll')}</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
                            {flashProducts.map((p: any) => (
                                <ProductCard
                                    key={p.id}
                                    product={p}
                                    onPress={() => onProductPress(p)}
                                    isWishlisted={wishlist?.includes(p.id)}
                                    onToggleWishlist={() => toggleWishlist(p.id)}
                                    onAddToCart={() => addToCart(p)}
                                    showRating
                                    theme={theme}
                                    language={language}
                                    t={t}
                                    customWidth={width * 0.65}
                                    flashSaleEndTime={p.flashSaleEndTime}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Ads Section */}
                {ads.length > 0 && (
                    <View style={styles.modernSection}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text variant="heading" style={{ letterSpacing: 4, fontSize: 13 }}>{t('campaigns')}</Text>
                                <View style={{ width: 15, height: 2, backgroundColor: accentColor, marginTop: 4 }} />
                            </View>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
                            {ads.map((ad: any) => (
                                <View key={ad.id} style={[styles.adCard, { borderColor: borderSecondary }]}>
                                    {ad.type === 'video' ? (
                                        <UniversalVideoPlayer source={{ uri: ad.url }} style={styles.adMedia} resizeMode="cover" shouldPlay isLooping isMuted />
                                    ) : (
                                        <Image source={{ uri: ad.url }} style={styles.adMedia} />
                                    )}
                                    <View style={styles.adContent}>
                                        <Text variant="body" style={{ color: 'white', letterSpacing: 1 }}>{getName(ad.title, language).toUpperCase()}</Text>
                                        {(ad.link || ad.targetId) && (
                                            <TouchableOpacity style={styles.adBtn} onPress={() => onCampaignPress(ad)}>
                                                <Text variant="caption"  style={{ color: 'white', letterSpacing: 1, fontSize: 12 }}>{t('discover')}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Featured Products */}
                <View style={[styles.modernSection, { marginTop: 30 }]}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text variant="heading" style={{ letterSpacing: 4, fontSize: 13 }}>{t('featured')}</Text>
                            <View style={{ width: 15, height: 2, backgroundColor: accentColor, marginTop: 4 }} />
                        </View>
                        <TouchableOpacity onPress={() => onNavigate('Shop')}>
                            <Text variant="body" style={{ color: foregroundColor, fontSize: 12 }}>{t('refineGallery')}</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 25, paddingTop: 10, gap: 15 }}>
                        {featured.map((p: any) => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                onPress={() => onProductPress(p)}
                                isWishlisted={wishlist?.includes(p.id)}
                                onToggleWishlist={() => toggleWishlist(p.id)}
                                onAddToCart={() => addToCart(p)}
                                showRating
                                theme={theme}
                                language={language}
                                t={t}
                                customWidth={width * 0.65}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Community Section */}
                <View style={[styles.modernSection, { paddingBottom: 20 }]}>
                    <Text variant="heading" style={{ textAlign: 'center', marginBottom: 20, letterSpacing: 2 }}>{t('ourSelection')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 25, paddingTop: 10, gap: 15 }}>
                        {featured.slice(0, 5).map((p: any) => (
                            <ProductCard
                                key={`sel-${p.id}`}
                                product={p}
                                onPress={() => onProductPress(p)}
                                isWishlisted={wishlist?.includes(p.id)}
                                onToggleWishlist={() => toggleWishlist(p.id)}
                                onAddToCart={() => addToCart(p)}
                                theme={theme}
                                language={language}
                                t={t}
                                customWidth={width * 0.55}
                            />
                        ))}
                    </ScrollView>

                    <View style={{ marginTop: 30, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10 }}>
                        <TouchableOpacity onPress={() => onNavigate && onNavigate('ShippingPolicy')} style={{ alignItems: 'center', gap: 8 }}>
                            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={22} color={foregroundColor} strokeWidth={1.5} />
                            </View>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: mutedColor }}>{t('freeShipping')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onNavigate && onNavigate('PaymentPolicy')} style={{ alignItems: 'center', gap: 8 }}>
                            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield size={22} color={foregroundColor} strokeWidth={1.5} />
                            </View>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: mutedColor }}>{t('securePayment')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onNavigate && onNavigate('ReturnPolicy')} style={{ alignItems: 'center', gap: 8 }}>
                            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
                                <RotateCcw size={22} color={foregroundColor} strokeWidth={1.5} />
                            </View>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: mutedColor }}>{t('easyReturns')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    modernHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 1000, paddingHorizontal: 20 },
    searchCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    unreadBadge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },

    // Live Banner
    liveEventBanner: { marginHorizontal: 15, marginTop: 10, marginBottom: 10, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
    liveBannerGradient: { padding: 16, flexDirection: 'row', alignItems: 'center' },
    liveAvatarContainer: { width: 64, height: 64, position: 'relative', marginRight: 16, alignItems: 'center', justifyContent: 'center' },
    liveAvatarPulse: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    liveAvatar: { width: 56, height: 56, borderRadius: 28 },
    liveBadge: { position: 'absolute', bottom: -2, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1.5 },
    liveBadgeText: { color: '#FFF', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
    liveStatusDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
    joinBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },

    // Live Now
    liveNowAvatarContainer: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    liveNowAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5 },
    liveNowBadge: { position: 'absolute', bottom: -4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1.5, elevation: 4 },
    liveNowBadgeText: { fontSize: 7, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },

    // Hero
    modernHero: { height: 500, borderRadius: 25, overflow: 'hidden', backgroundColor: '#F2F2F7' },
    modernHeroImg: { width: '100%', height: '100%' },
    heroGlassBadge: { position: 'absolute', top: 25, left: 25, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    modernHeroFooter: { position: 'absolute', bottom: 40, left: 25, right: 25 },
    heroBtn: { alignSelf: 'flex-start' },

    // Sections
    modernSection: { marginTop: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
    collectionsScroll: { paddingHorizontal: 20, paddingTop: 10, gap: 15, alignItems: 'flex-start' },
    modernCatCard: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, overflow: 'hidden' },
    catBgImage: { width: '100%', height: '100%' },
    separator: { width: 1, height: '80%', marginHorizontal: 5, marginTop: 25 },

    // Ads
    adCard: { width: width * 0.75, height: 220, borderRadius: 25, overflow: 'hidden', borderWidth: 1, elevation: 3 },
    adMedia: { width: '100%', height: '100%', position: 'absolute' },
    adContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(0,0,0,0.3)' },
    adBtn: { marginTop: 10, alignSelf: 'flex-start', borderBottomWidth: 1, borderBottomColor: 'white' },
});
