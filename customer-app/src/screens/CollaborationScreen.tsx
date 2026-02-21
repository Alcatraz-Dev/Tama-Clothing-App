import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Platform,
    useWindowDimensions
} from 'react-native';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../api/firebase';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import {
    CheckCircle2,
    ChevronLeft
} from 'lucide-react-native';
import { Theme } from '../theme';
import { LiveSessionService } from '../services/LiveSessionService';
import CollabBadge from '../components/CollabBadge';
import Animated, {
    SharedValue,
    useAnimatedStyle,
    useFrameCallback,
    useSharedValue,
    withTiming,
    Easing,
    interpolate,
    useAnimatedReaction,
    runOnJS,
    FadeIn,
    FadeOut
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_ICON, APP_ICON_2 } from '../constants/layout';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Collaboration {
    id: string;
    uniqueKey?: string; // For list rendering unique keys
    name: string;
    type: 'Brand' | 'Person' | 'Company';
    description: string;
    imageUrl: string;
    coverImageUrl?: string;
    websiteUrl?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    twitterUrl?: string;
    linkedinUrl?: string;
    tiktokUrl?: string;
    brandId?: string;
    isActive: boolean;
    followersCount?: number;
    worksCount?: number;
}

// --- MARQUEE COMPONENT ---

type MarqueeItemProps = {
    index: number;
    scroll: SharedValue<number>;
    containerWidth: number;
    itemWidth: number;
    children: React.ReactNode;
};

function MarqueeItem({
    index,
    scroll,
    containerWidth,
    itemWidth,
    children,
}: MarqueeItemProps) {
    const { width: screenWidth } = useWindowDimensions();
    const shift = (containerWidth - screenWidth) / 2;
    const initialPosition = itemWidth * index - shift;

    const animatedStyle = useAnimatedStyle(() => {
        const position = ((initialPosition - scroll.value) % containerWidth) + shift;

        // Exact params from AppleInvites reference
        // Rotation is subtle: -1 to 1 deg
        const rotation = interpolate(position, [0, screenWidth - itemWidth], [-1, 1]);

        // Vertical translation for the "fan" effect
        const translateY = interpolate(
            position,
            [0, (screenWidth - itemWidth) / 2, screenWidth - itemWidth],
            [15, 0, 15]
        );

        // Z-Index needed to make the centered item appear on top if overlapping (optional but good)
        const zIndex = interpolate(
            position,
            [0, (screenWidth - itemWidth) / 2, screenWidth - itemWidth],
            [0, 10, 0]
        );

        return {
            transform: [
                { translateX: position },
                { rotateZ: `${rotation}deg` },
                { translateY }
            ],
            zIndex: Math.round(zIndex),
        };
    });

    return (
        <Animated.View
            style={[
                styles.marqueeItem,
                { width: itemWidth, left: 0 },
                animatedStyle
            ]}
        >
            {children}
        </Animated.View>
    );
}

// --- MAIN SCREEN ---

interface CollaborationScreenProps {
    t: (key: string) => string;
    theme: 'light' | 'dark';
    language: string;
    onNavigate: (screen: string) => void;
    onCollabPress: (collab: Collaboration) => void;
    onBack: () => void;
}

export default function CollaborationScreen({ t, theme, language, onNavigate, onCollabPress, onBack }: CollaborationScreenProps) {
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [liveChannels, setLiveChannels] = useState<string[]>([]);

    const getName = (field: any, fallback = '') => {
        if (!field) return fallback;
        if (typeof field === 'string') return field;
        return field[language] || field['en'] || field['fr'] || fallback;
    };

    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';

    // Marquee State
    const scroll = useSharedValue(0);
    const scrollSpeed = useSharedValue(40);
    const { width: screenWidth } = useWindowDimensions();
    const itemWidth = screenWidth * 0.75;


    // Calculate container width.
    const containerWidth = collaborations.length * itemWidth;

    useEffect(() => {
        fetchCollaborations();

        // Subscribe to live sessions
        const unsubscribeLive = LiveSessionService.subscribeToAllSessions((sessions: any[]) => {
            const active = sessions.filter((s: any) => s.status === 'live');
            const liveIds = active.flatMap((s: any) => [s.brandId, s.collabId, s.channelId]).filter(Boolean);
            setLiveChannels(liveIds);
        });

        return () => unsubscribeLive();
    }, []);

    const fetchCollaborations = () => {
        setLoading(true);
        const q = query(collection(db, 'collaborations'), where('isActive', '==', true));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Collaboration[] = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Collaboration);
            });

            // Replicate list to create infinite scroll effect if list is short
            if (data.length > 0) {
                const loopCount = Math.ceil(15 / data.length) + 1;
                const looped = Array(loopCount).fill(data).flat().map((item, idx) => ({
                    ...item,
                    uniqueKey: `${item.id}-${idx}`
                }));
                setCollaborations(looped);
            } else {
                setCollaborations([]);
            }
            setLoading(false);
        }, (error) => {
            console.error('Error fetching collaborations:', error);
            setLoading(false);
        });

        return unsubscribe;
    };

    useEffect(() => {
        const unsubscribe = fetchCollaborations();
        return () => unsubscribe();
    }, []);

    useAnimatedReaction(
        () => scroll.value,
        (value) => {
            // simplified logic for background updates
            if (collaborations.length === 0) return;
            const adjustedScroll = (value + screenWidth / 2) % (collaborations.length * itemWidth);
            const idx = Math.floor(Math.abs(adjustedScroll) / itemWidth);
            if (idx >= 0 && idx < collaborations.length) {
                runOnJS(setActiveIndex)(idx);
            }
        }
    );

    useFrameCallback((frameInfo) => {
        if (collaborations.length > 0 && containerWidth > screenWidth) {
            const deltaSeconds = (frameInfo.timeSincePreviousFrame ?? 0) / 1000;
            scroll.value = scroll.value + scrollSpeed.value * deltaSeconds;
        }
    });

    const gesture = Gesture.Pan()
        .onBegin(() => { scrollSpeed.value = 0; })
        .onChange((event) => { scroll.value = scroll.value - event.changeX; })
        .onFinalize((event) => {
            scrollSpeed.value = -event.velocityX;
            scrollSpeed.value = withTiming(40, { duration: 1000, easing: Easing.out(Easing.quad) });
        });


    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FFF" />
            </View>
        );
    }

    if (collaborations.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: 'white' }}>No collaborations available.</Text>
            </View>
        )
    }

    const activeItem = collaborations[activeIndex] || collaborations[0];

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                {/* Background Image Layer */}
                <Animated.Image

                    key={`bg-${activeItem.uniqueKey}`}
                    source={{ uri: activeItem.imageUrl }}
                    style={[StyleSheet.absoluteFillObject]}
                    resizeMode="cover"
                    entering={FadeIn.duration(800)}
                    exiting={FadeOut.duration(800)}
                />

                {/* Overlay */}
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.2)' }]} />

                {/* Main Blur */}
                <BlurView intensity={70} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'}>
                    <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom + 80 }]}>

                        {/* Top Half: Marquee */}
                        <View style={styles.marqueeContainer}>
                            <GestureDetector gesture={gesture}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', maxHeight: 700 }}>
                                    {collaborations.map((item, index) => (
                                        <MarqueeItem
                                            key={item.uniqueKey}
                                            index={index}
                                            scroll={scroll}
                                            containerWidth={containerWidth}
                                            itemWidth={itemWidth}
                                        >
                                            <TouchableOpacity
                                                activeOpacity={0.9}
                                                style={styles.card}
                                                onPress={() => onCollabPress(item)}
                                            >
                                                <Image
                                                    source={{ uri: item.coverImageUrl || item.imageUrl }}
                                                    style={StyleSheet.absoluteFillObject}
                                                    resizeMode="cover"
                                                />

                                                {/* Card Bottom Gradient Overlay */}
                                                <LinearGradient
                                                    colors={[
                                                        "transparent",
                                                        isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
                                                        isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)",
                                                    ]}
                                                    locations={[0, 0.4, 1]}
                                                    style={styles.cardGradientOverlay}
                                                >
                                                    <View style={{ width: '100%', alignItems: 'center' }}>
                                                        {/* Profile Icon Overlapping */}
                                                        <View style={{ position: 'relative', alignItems: 'center', zIndex: 20, marginBottom: -15 }}>
                                                            <Animatable.View
                                                                animation={(liveChannels.includes(item.id) || (item.brandId && liveChannels.includes(item.brandId))) ? "pulse" : undefined}
                                                                iterationCount="infinite"
                                                                style={[
                                                                    styles.cardProfileIconContainer,
                                                                    {
                                                                        borderColor: (liveChannels.includes(item.id) || (item.brandId && liveChannels.includes(item.brandId)))
                                                                            ? '#EF4444'
                                                                            : (isDark ? '#FFF' : '#000')
                                                                    }
                                                                ]}
                                                            >
                                                                <Image source={{ uri: item.imageUrl }} style={styles.cardProfileIcon} />
                                                            </Animatable.View>

                                                            {(liveChannels.includes(item.id) || (item.brandId && liveChannels.includes(item.brandId))) && (
                                                                <Animatable.View
                                                                    animation="bounceIn"
                                                                    style={styles.liveNowBadge}
                                                                >
                                                                    <Text style={styles.liveNowBadgeText}>
                                                                        {t('enDirect') || 'EN DIRECT'}
                                                                    </Text>
                                                                </Animatable.View>
                                                            )}
                                                        </View>
                                                        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.cardBlurOverlayContent}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                                <Text style={[styles.cardName, { color: isDark ? '#FFF' : '#000', marginBottom: 0 }]}>{getName(item.name)}</Text>
                                                                <CheckCircle2 size={12} color={item.type === 'Brand' ? '#FFD700' : item.type === 'Person' ? '#A855F7' : item.type === 'Company' ? '#3B82F6' : '#22C55E'} />
                                                            </View>
                                                            <Text style={[styles.cardDescription, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]} numberOfLines={2}>{getName(item.description)}</Text>
                                                        </BlurView>
                                                    </View>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </MarqueeItem>
                                    ))}
                                </View>
                            </GestureDetector>
                        </View>

                        {/* Bottom Half: Text Content */}
                        <View style={styles.bottomContainer}>
                            <Animated.Text entering={FadeIn.delay(500).springify()} style={[styles.bottomTitle, { marginTop: 30, marginBottom: -40, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>{t('collabWelcome')}</Animated.Text>
                            <Animated.View entering={FadeIn.delay(600).springify()} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: -25, marginRight: 30 }}>
                                <Animated.Image
                                    entering={FadeIn.delay(700).springify()}
                                    style={{ width: 300, height: 160, resizeMode: 'contain', marginRight: -95, marginBottom: -20 }}
                                    source={APP_ICON_2}
                                />
                                <Animated.Text
                                    entering={FadeIn.delay(800).springify()}
                                    style={[{ color: isDark ? '#FFF' : '#000', fontSize: 40, fontWeight: '900', marginBottom: -15, marginRight: 20 }]}
                                >
                                    {t('collabAppName2')}
                                </Animated.Text>
                            </Animated.View>
                            <Animated.Text entering={FadeIn.delay(1000).springify()} style={[styles.bottomSubText, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
                                {t('collabSubText')}
                            </Animated.Text>

                            <TouchableOpacity style={[styles.bottomCtaButton, { backgroundColor: isDark ? '#FFF' : '#000' }]} onPress={() => onNavigate('Chat')}>
                                <Text style={[styles.bottomCtaText, { color: isDark ? '#000' : '#FFF' }]}>{t('partnerWithUs')}</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </BlurView>


            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Background color is set dynamically based on theme
        height: SCREEN_HEIGHT,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 25,
        marginTop: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerSub: {
        fontSize: 16,
        fontWeight: '500',
    },
    marqueeContainer: {
        height: SCREEN_HEIGHT * 0.52, // Reduced height to push elements up
        justifyContent: 'center',
        paddingVertical: 10,
    },
    marqueeItem: {
        position: 'absolute',
        height: '100%',
        padding: 12,
        // Center alignment logic is handled in transform
    },
    card: {
        flex: 1,
        borderRadius: 24, // rounded-3xl approx
        overflow: 'hidden',
        backgroundColor: '#222', // Keep dark for contrast
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
        marginBottom: 20,
    },
    cardBlurOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100, // h-24 approx 96px
        width: 100,
        paddingHorizontal: 15,
        justifyContent: 'center',
    },
    cardGradientOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "55%",
        justifyContent: "flex-end",
        padding: 16,

        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,

        overflow: "hidden",
    },
    cardBlurOverlayContent: {
        width: '100%',
        paddingVertical: 18,
        paddingHorizontal: 14,
        borderRadius: 22,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    cardProfileIconContainer: {
        width: 68,
        height: 68,
        borderRadius: 34,
        borderWidth: 3.5,
        overflow: 'hidden',
        // marginBottom and zIndex moved to parent wrapper
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardProfileIcon: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardType: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 4,
        textAlign: 'center',
    },
    cardName: {
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 18,
    },

    // Bottom Section
    bottomContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        paddingHorizontal: 30,
        paddingBottom: 40,
        alignItems: 'center',
        // marginTop: -5, // Negative margin to pull elements up
    },
    bottomTitle: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    bottomLargeText: {
        fontSize: 42,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: -1,
    },
    bottomSubText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    bottomCtaButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    bottomCtaText: {
        fontSize: 16,
        fontWeight: '700',
    },
    liveNowBadge: {
        position: 'absolute',
        bottom: -4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#FFF',
        zIndex: 50,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    liveNowBadgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFF',
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
    },
    joinButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    pulseDotMain: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFF',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 20,
    },
});

