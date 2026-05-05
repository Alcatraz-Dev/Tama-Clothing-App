import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Alert,
    Image,
    Modal,
    Dimensions,
    Easing,
    ScrollView,
} from "react-native";
import Constants from "expo-constants";
import { auth, db } from "../api/firebase";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import * as Animatable from "react-native-animatable";
import { ShoppingCart, Package, Gift, ChevronRight, X as CloseIcon, Heart, Eye, Share2, MessageCircle, Send, ShoppingBag, ChevronDown, ChevronUp, Wifi, WifiOff, Loader } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { LiveSessionService } from "../services/LiveSessionService";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    withRepeat,
    runOnJS,
    interpolate,
    Extrapolation,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ✅ Expo Go detection
// Use appOwnership to specifically detect Expo Go (not dev builds)
const isExpoGo = Constants.appOwnership === 'expo';

// ✅ Conditionally import ZIM only in dev builds (not Expo Go)
let ZIM: any = null;
if (!isExpoGo) {
    try {
        ZIM = require('zego-zim-react-native');
    } catch (e) {
        console.log('ZIM plugin not available');
    }
}

// ✅ Put them in env or constants
const ZEGO_APP_ID = 1978768024; // Placeholder ID - User should replace with real one
const ZEGO_APP_SIGN = '6e6939b8825c44bab33f5ffbdae0fe9b9f58be6af13a249ce8bcd9b2c76b928d'; // Placeholder Sign

type ChatMessage = {
    id: string;
    text: string;
    userId: string;
    userName: string;
    createdAt?: any;
};

type Props = {
    route?: {
        params: {
            channelId: string;
            isHost?: boolean;
            title?: string;
        };
    };
    navigation?: any;
    // Direct props for non-navigation usage (like in App.tsx)
    channelId?: string;
    isHost?: boolean;
    title?: string;
    onClose?: () => void;
    isAdmin?: boolean;
    userId?: string;
    userName?: string;
    brandId?: string;
    onAddToCart?: (product: any) => void;
    onProductPress?: (product: any) => void;
    language?: string;
    isReplay?: boolean;
    replayUrl?: string;
    onNavigate?: (screen: string, params?: any) => void;
    t?: (key: string) => string;
};

export default function LiveStreamScreen(props: Props) {
    // Handle both React Navigation and Direct Props
    const incomingChannelId = props.channelId || props.route?.params?.channelId;
    const channelId = typeof incomingChannelId === 'string' ? incomingChannelId : "default_channel";
    const isHost = props.isHost ?? props.route?.params?.isHost ?? false;
    const title = props.title || props.route?.params?.title || "Live Stream";
    const t = props.t || ((k: string) => k);

    // ✅ If Expo Go: show a friendly screen and DO NOT import Zego
    if (isExpoGo) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.expoGoBlock}>
                    <Text style={styles.expoGoTitle}>{t('liveNotSupported')}</Text>
                    <Text style={styles.expoGoText}>
                        {t('zegoRequiresDevBuild')}
                    </Text>

                    <View style={{ height: 16 }} />

                    <Text style={styles.expoGoHint}>
                        {t('runCommands')}
                        {"\n"}• npx expo prebuild
                        {"\n"}• npx expo run:ios
                        {"\n"}or
                        {"\n"}• eas build --profile development --platform ios
                    </Text>

                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => props.onClose ? props.onClose() : props.navigation?.goBack()}
                    >
                        <Text style={styles.closeBtnText}>{t('goBack')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ✅ Dev Build only
    return (
        <LiveDevBuildOnly
            {...props}
            channelId={channelId}
            isHost={isHost}
            title={title}
            navigation={props.navigation}
            onClose={props.onClose}
        />
    );
}

function LiveDevBuildOnly({
    channelId,
    isHost,
    title,
    navigation,
    onClose,
    onProductPress,
    isAdmin,
    userId: propUserId,
    userName: propUserName,
    brandId,
    onAddToCart,
    language,
    isReplay,
    replayUrl,
    t,
    collabId,
}: {
    channelId: string;
    isHost: boolean;
    title: string;
    navigation?: any;
    onClose?: () => void;
    onProductPress?: (product: any) => void;
    isAdmin?: boolean;
    userId?: string;
    userName?: string;
    brandId?: string;
    onAddToCart?: (product: any) => void;
    language?: string;
    isReplay?: boolean;
    replayUrl?: string;
    t?: (key: string) => string;
    collabId?: string;
}) {
    // State to force a re-render/retry
    const [retryCount, setRetryCount] = useState(0);

    const translate = t || ((k: string) => k);

    let ZegoUIKitPrebuiltLiveStreaming: any;
    let HOST_DEFAULT_CONFIG: any;
    let AUDIENCE_DEFAULT_CONFIG: any;

    try {
        const ZegoModule = require("@zegocloud/zego-uikit-prebuilt-live-streaming-rn");
        ZegoUIKitPrebuiltLiveStreaming = ZegoModule.default;
        HOST_DEFAULT_CONFIG = ZegoModule.HOST_DEFAULT_CONFIG;
        AUDIENCE_DEFAULT_CONFIG = ZegoModule.AUDIENCE_DEFAULT_CONFIG;
    } catch (e) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.expoGoBlock}>
                    <Text style={styles.expoGoTitle}>{translate('devBuildRequired')}</Text>
                    <Text style={styles.expoGoText}>
                        {translate('zegoFailed')}
                    </Text>

                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setRetryCount(prev => prev + 1)}
                    >
                        <Text style={styles.closeBtnText}>{translate('retry')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.closeBtn, { marginTop: 10, backgroundColor: 'transparent' }]}
                        onPress={() => onClose ? onClose() : navigation?.goBack()}
                    >
                        <Text style={styles.closeBtnText}>{translate('goBack')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Using centralized auth and db imports

    const user = auth.currentUser;

    const userId = user?.uid || `guest_${Math.random().toString(16).slice(2)}`;
    const userName = user?.displayName || "Guest";

    const liveRef = useRef<any>(null);

    // Sessions & Pinned Products
    const [likes, setLikes] = useState(0);
    const [sessionData, setSessionData] = useState<any>(null);
    const [pinnedProduct, setPinnedProduct] = useState<any>(null);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [availableProducts, setAvailableProducts] = useState<any[]>([]);

    // Enhanced UI State
    const [streamStatus, setStreamStatus] = useState<'loading' | 'live' | 'buffering' | 'ended' | 'error'>('loading');
    const [showChat, setShowChat] = useState(true);
    const [chatInputVisible, setChatInputVisible] = useState(false);
    const [showProductDrawer, setShowProductDrawer] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [floatingHearts, setFloatingHearts] = useState<any[]>([]);
    const [productDrawerHeight, setProductDrawerHeight] = useState(120);

    // Animation values
    const likeButtonScale = useSharedValue(1);
    const chatSlideAnim = useSharedValue(0);
    const productDrawerAnim = useSharedValue(0);

    // Floating hearts animation
    const addFloatingHeart = useCallback(() => {
        const newHeart = {
            id: Date.now(),
            x: Math.random() * 60 - 30,
            color: ['#FF6B6B', '#FF8E53', '#FF5E62', '#FF2E63', '#FFE66D'][Math.floor(Math.random() * 5)],
        };
        setFloatingHearts(prev => [...prev, newHeart]);
        setTimeout(() => {
            setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
        }, 2000);

        // Button scale animation
        likeButtonScale.value = withSequence(
            withSpring(1.3, { damping: 2 }),
            withSpring(1, { damping: 5 })
        );
    }, [likeButtonScale]);

    // Toggle chat visibility with animation
    const toggleChat = useCallback(() => {
        setShowChat(prev => !prev);
        chatSlideAnim.value = withTiming(showChat ? 1 : 0, { duration: 300 });
    }, [showChat, chatSlideAnim]);

    // Toggle product drawer
    const toggleProductDrawer = useCallback(() => {
        setShowProductDrawer(prev => !prev);
        productDrawerAnim.value = withTiming(showProductDrawer ? 0 : 1, { duration: 350, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    }, [showProductDrawer, productDrawerAnim]);

    // Firestore paths
    const chatPath = useMemo(
        () => collection(db, "Live_sessions", channelId, "chat"),
        [db, channelId]
    );

    const likesDoc = useMemo(
        () => doc(db, "Live_sessions", channelId, "stats", "likes"),
        [db, channelId]
    );

    const viewersDoc = useMemo(
        () => doc(db, "Live_sessions", channelId, "viewers", userId),
        [db, channelId, userId]
    );



    // Subscribe to likes
    useEffect(() => {
        const unsub = onSnapshot(likesDoc, (snap) => {
            const data = snap.data() as any;
            setLikes(data?.count ?? 0);
        });

        return () => unsub();
    }, [likesDoc]);

    // Subscribe to Session Data (for pinned product, etc)
    useEffect(() => {
        const sessionRef = doc(db, "Live_sessions", channelId);
        const unsub = onSnapshot(sessionRef, async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setSessionData(data);

                // If product pinned, fetch its details
                if (data.currentProductId) {
                    try {
                        const prodDoc = await getDoc(doc(db, "products", data.currentProductId));
                        if (prodDoc.exists()) {
                            setPinnedProduct({ id: prodDoc.id, ...prodDoc.data() });
                        }
                    } catch (err) {
                        console.error("Error fetching pinned product:", err);
                    }
                } else {
                    setPinnedProduct(null);
                }
            }
        });

        return () => unsub();
    }, [db, channelId]);

    // Fetch products if host
    // Fetch products
    useEffect(() => {
        if (showProductPicker) {
            const fetchProducts = async () => {
                let q = query(collection(db, "products"), limit(50));
                // If brandId is available, filter by brand
                try {
                    // Check if brandId prop is passed or try to find it from session data
                    const activeBrandId = brandId || sessionData?.brandId;
                    if (activeBrandId) {
                        // Note: Requires index on brandId
                        // q = query(collection(db, "products"), where("brandId", "==", activeBrandId), limit(50));
                        // Fallback to simple query if index issue, potentially handle client side filter or just fetch recent
                    }
                    const snap = await getDocs(q);
                    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    if (activeBrandId) {
                        // Simple client-side filter to avoid index requirement for now if mixed
                        const brandProducts = products.filter((p: any) => p.brandId === activeBrandId);
                        setAvailableProducts(brandProducts.length > 0 ? brandProducts : products);
                    } else {
                        setAvailableProducts(products);
                    }
                } catch (e) {
                    console.log("Error fetching live products", e);
                }
            };
            fetchProducts();
        }
    }, [showProductPicker, brandId, sessionData]);

    // Handle session lifecycle (host starts/ends session in Firestore)
    useEffect(() => {
        if (!isHost || isReplay) return;

        const start = async () => {
            try {
                // Generate HLS Playback URL for Zego (Common format)
                // Note: Domain might vary based on your Zego CDN cluster configuration
                const playbackUrl = `https://hls.zego.im/${ZEGO_APP_ID}/${channelId}.m3u8`;

                // Determine if it's a collaboration or brand session
                // Already destructured from props in the component signature

                if (collabId) {
                    await LiveSessionService.startCollabSession(
                        channelId,
                        userName,
                        userId,
                        collabId,
                        brandId,
                        user?.photoURL || undefined,
                        playbackUrl
                    );
                } else {
                    await LiveSessionService.startSession(
                        channelId,
                        userName,
                        brandId,
                        user?.photoURL || undefined,
                        user?.uid,
                        [],
                        playbackUrl
                    );
                }
            } catch (err) {
                console.error("Error starting live session:", err);
            }
        };

        start();

        return () => {
            // End session when host leaves
            LiveSessionService.endSession(channelId).catch(err =>
                console.error("Error ending live session:", err)
            );
        };
    }, [isHost, isReplay, channelId, userName, brandId, user?.photoURL, user?.uid]);

    // Mark viewer joined and update view count
    useEffect(() => {
        if (isReplay) return;

        const join = async () => {
            try {
                // Tracking individual viewer doc
                await setDoc(viewersDoc, {
                    userId,
                    userName,
                    joinedAt: serverTimestamp(),
                });

                // Increment session view count
                await LiveSessionService.joinSession(channelId);
            } catch (err) {
                console.error("Error joining session:", err);
            }
        };

        join();

        return () => {
            // Cleanup: remove viewer doc and decrement count
            deleteDoc(viewersDoc).catch(() => { });
            LiveSessionService.leaveSession(channelId).catch(() => { });
        };
    }, [viewersDoc, userId, userName, channelId, isReplay]);



    const onLike = async () => {
        try {
            await setDoc(
                likesDoc,
                { count: likes + 1, updatedAt: serverTimestamp() },
                { merge: true }
            );
        } catch { }
    };

    const onLeave = async () => {
        if (isHost) {
            try {
                // Mark session as ended in Firestore
                await LiveSessionService.endSession(channelId);
            } catch (error) {
                console.error("Error ending session:", error);
            }
        } else {
            try {
                // Audience leave
                await LiveSessionService.leaveSession(channelId);
            } catch (error) { }
        }

        if (onClose) {
            onClose();
        } else if (navigation) {
            navigation.goBack();
        }
    };

    // Zego config - Match official example pattern
    const config = useMemo(() => {
        console.log('🔴 LiveStream Config - isHost:', isHost, 'userId:', userId, 'channelId:', channelId);

        if (isHost) {
            console.log('✅ Using HOST_DEFAULT_CONFIG');
            return {
                ...HOST_DEFAULT_CONFIG,
                onLeaveLiveStreaming: onLeave,
            };
        }

        console.log('👥 Using AUDIENCE_DEFAULT_CONFIG');
        return {
            ...AUDIENCE_DEFAULT_CONFIG,
            onLeaveLiveStreaming: onLeave,
        };
    }, [isHost]);

    if (!ZegoUIKitPrebuiltLiveStreaming) return null;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                {/* Zego Live UI */}
                <View style={styles.videoWrap}>
                    <ZegoUIKitPrebuiltLiveStreaming
                        ref={liveRef}
                        appID={ZEGO_APP_ID}
                        appSign={ZEGO_APP_SIGN}
                        userID={userId}
                        userName={userName}
                        liveID={channelId}
                        config={config}
                        {...(ZIM ? { plugins: [ZIM] } : {})}
                    />

                    {/* Pinned Product Overlay - Adjusted position to not overlap Zego header */}
                    {pinnedProduct && (
                        <Animatable.View
                            animation="fadeInDown"
                            duration={500}
                            style={[styles.pinnedProductContainer, { top: 60 }]}
                        >
                            <BlurView intensity={80} tint="dark" style={styles.pinnedBlur}>
                                <Image
                                    source={{ uri: pinnedProduct.image || pinnedProduct.mainImage || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200' }}
                                    style={styles.pinnedImage}
                                />
                                <View style={styles.pinnedInfo}>
                                    <Text style={styles.pinnedTag}>{translate('pinned')}</Text>
                                    <Text style={styles.pinnedName} numberOfLines={1}>
                                        {typeof pinnedProduct.name === 'string' ? pinnedProduct.name : pinnedProduct.name?.fr || pinnedProduct.name?.en}
                                    </Text>
                                    <Text style={styles.pinnedPrice}>{pinnedProduct.price} TND</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.buyNowBtn}
                                    onPress={() => onProductPress && onProductPress(pinnedProduct)}
                                >
                                    <ShoppingCart size={16} color="#000" strokeWidth={3} />
                                </TouchableOpacity>
                                {isHost && (
                                    <TouchableOpacity
                                        style={styles.unpinBtn}
                                        onPress={() => LiveSessionService.unpinProduct(channelId)}
                                    >
                                        <CloseIcon size={12} color="rgba(255,255,255,0.6)" />
                                    </TouchableOpacity>
                                )}
                            </BlurView>
                        </Animatable.View>
                    )}

                    {/* Shop Button for Host - Floating on the right side */}

                    {/* Live Stats Overlay */}
                    <View style={{ position: 'absolute', top: 50, left: 20, flexDirection: 'row', gap: 8 }}>
                        <View style={styles.statChip}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Eye size={12} color="#fff" />
                                <Text style={styles.statChipText}>{sessionData?.viewers || 1}</Text>
                            </View>
                        </View>
                        <View style={styles.statChip}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Heart size={12} color="#fff" fill="#fff" />
                                <Text style={styles.statChipText}>{likes}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons Container */}
                    <View style={styles.actionsContainer}>
                        {/* Animated Like Button */}
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={onLike}
                            onPressIn={addFloatingHeart}
                        >
                            <Animated.View style={{ transform: [{ scale: likeButtonScale }] }}>
                                <Heart 
                                    size={24} 
                                    color="#fff" 
                                    fill={likes > 0 ? "#FF3B30" : "transparent"} 
                                    strokeWidth={2} 
                                />
                            </Animated.View>
                        </TouchableOpacity>

                        {/* Floating Hearts Animation */}
                        {floatingHearts.map(heart => (
                            <Animated.View
                                key={heart.id}
                                style={[
                                    styles.floatingHeart,
                                    {
                                        left: SCREEN_WIDTH - 70 + heart.x,
                                        bottom: 150,
                                    }
                                ]}
                            >
                                <Heart size={20} color={heart.color} fill={heart.color} />
                            </Animated.View>
                        ))}

                        {/* Share Button */}
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => setShowShareModal(true)}
                        >
                            <Share2 size={22} color="#fff" />
                        </TouchableOpacity>

                        {/* Chat Toggle */}
                        <TouchableOpacity
                            style={[styles.actionBtn, showChat && styles.actionBtnActive]}
                            onPress={toggleChat}
                        >
                            <MessageCircle size={22} color="#fff" />
                        </TouchableOpacity>

                        {/* Product Drawer Toggle */}
                        <TouchableOpacity
                            style={[styles.actionBtn, showProductDrawer && styles.actionBtnActive]}
                            onPress={toggleProductDrawer}
                        >
                            {isHost ? <Package size={22} color="#fff" /> : <ShoppingBag size={22} color="#fff" />}
                        </TouchableOpacity>

                        {/* Product Drawer */}
                        <Animated.View 
                            style={[
                                styles.productDrawer,
                                {
                                    height: interpolate(
                                        productDrawerAnim.value,
                                        [0, 1],
                                        [0, 200],
                                        Extrapolation.CLAMP
                                    ),
                                    opacity: productDrawerAnim.value,
                                }
                            ]}
                        >
                            {showProductDrawer && (
                                <View style={styles.productDrawerContent}>
                                    <TouchableOpacity 
                                        style={styles.drawerHandle}
                                        onPress={toggleProductDrawer}
                                    >
                                        <ChevronDown size={20} color="rgba(255,255,255,0.5)" />
                                    </TouchableOpacity>
                                    <Text style={styles.drawerTitle}>
                                        {isHost ? translate('pinProduct') : translate('featuredProducts')}
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {availableProducts.slice(0, 5).map(product => (
                                            <TouchableOpacity 
                                                key={product.id} 
                                                style={styles.drawerProduct}
                                                onPress={() => {
                                                    if (isHost) {
                                                        LiveSessionService.pinProduct(channelId, product.id);
                                                        toggleProductDrawer();
                                                    } else {
                                                        onProductPress && onProductPress(product);
                                                    }
                                                }}
                                            >
                                                <Image 
                                                    source={{ uri: product.image || product.mainImage }} 
                                                    style={styles.drawerProductImage} 
                                                />
                                                <Text style={styles.drawerProductPrice} numberOfLines={1}>
                                                    {product.price} TND
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </Animated.View>
                    </View>

                    {/* Stream Status Indicator */}
                    {streamStatus !== 'live' && (
                        <View style={styles.streamStatusContainer}>
                            {streamStatus === 'loading' && (
                                <View style={styles.streamStatusBadge}>
                                    <Loader size={12} color="#fff" />
                                    <Text style={styles.streamStatusText}>{translate('connecting')}...</Text>
                                </View>
                            )}
                            {streamStatus === 'buffering' && (
                                <View style={[styles.streamStatusBadge, styles.streamStatusBuffering]}>
                                    <WifiOff size={12} color="#fff" />
                                    <Text style={styles.streamStatusText}>{translate('buffering')}...</Text>
                                </View>
                            )}
                            {streamStatus === 'error' && (
                                <View style={[styles.streamStatusBadge, styles.streamStatusError]}>
                                    <WifiOff size={12} color="#fff" />
                                    <Text style={styles.streamStatusText}>{translate('connectionError')}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Share Modal */}
                    <Modal visible={showShareModal} animationType="fade" transparent>
                        <TouchableOpacity 
                            style={styles.shareModalOverlay} 
                            activeOpacity={1}
                            onPress={() => setShowShareModal(false)}
                        >
                            <View style={styles.shareModalContent}>
                                <Text style={styles.shareModalTitle}>{translate('shareStream')}</Text>
                                <View style={styles.shareOptions}>
                                    <TouchableOpacity style={styles.shareOption}>
                                        <Share2 size={24} color="#fff" />
                                        <Text style={styles.shareOptionText}>{translate('share')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity 
                                    style={styles.shareCloseBtn}
                                    onPress={() => setShowShareModal(false)}
                                >
                                    <CloseIcon size={20} color="rgba(255,255,255,0.6)" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </View>

                {/* Product Picker Modal */}
                <Modal visible={showProductPicker} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <BlurView intensity={100} tint="dark" style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {isHost ? translate('selectProductToPin') : translate('shopProducts')}
                                </Text>
                                <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                                    <CloseIcon color="#fff" size={24} />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={availableProducts}
                                keyExtractor={item => item.id}
                                contentContainerStyle={styles.pickerList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.pickerItem}
                                        onPress={() => {
                                            if (isHost) {
                                                LiveSessionService.pinProduct(channelId, item.id);
                                                setShowProductPicker(false);
                                            } else {
                                                onProductPress && onProductPress(item);
                                                // Don't close for audience so they can browse
                                            }
                                        }}
                                    >
                                        <Image source={{ uri: item.image || item.mainImage }} style={styles.pickerImg} />
                                        <View style={styles.pickerInfo}>
                                            <Text style={styles.pickerName}>
                                                {typeof item.name === 'string' ? item.name : item.name?.fr || item.name?.en}
                                            </Text>
                                            <Text style={styles.pickerPrice}>{item.price} TND</Text>
                                        </View>
                                        <ChevronRight color="rgba(255,255,255,0.4)" />
                                    </TouchableOpacity>
                                )}
                            />
                        </BlurView>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#000" },
    container: { flex: 1, backgroundColor: "#000" },

    expoGoBlock: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    expoGoTitle: { color: "#fff", fontSize: 18, fontWeight: "900", textAlign: "center" },
    expoGoText: { color: "rgba(255,255,255,0.75)", fontSize: 14, textAlign: "center" },
    expoGoHint: {
        color: "rgba(255,255,255,0.65)",
        fontSize: 13,
        textAlign: "center",
        lineHeight: 18,
    },
    closeBtn: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    closeBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },

    videoWrap: { flex: 1, position: "relative" },

    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF3B30',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 5
    },
    liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff' },
    liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },

    statChip: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    statChipText: { color: "#fff", fontSize: 12, fontWeight: "700" },

    actionsContainer: {
        position: 'absolute',
        right: 16,
        bottom: 100,
        gap: 16,
        alignItems: 'center'
    },
    actionBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.2)",
    },
    actionBtnActive: {
        backgroundColor: "rgba(255,255,255,0.2)",
        borderColor: "rgba(255,255,255,0.5)",
    },

    // Floating Hearts
    floatingHeart: {
        position: 'absolute',
        zIndex: 1000,
    },

    // Product Drawer
    productDrawer: {
        position: 'absolute',
        bottom: 70,
        right: -10,
        width: SCREEN_WIDTH - 100,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 20,
        overflow: 'hidden',
    },
    productDrawerContent: {
        padding: 12,
    },
    drawerHandle: {
        alignItems: 'center',
        paddingBottom: 8,
    },
    drawerTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 12,
    },
    drawerProduct: {
        marginRight: 12,
        alignItems: 'center',
    },
    drawerProductImage: {
        width: 70,
        height: 70,
        borderRadius: 12,
        marginBottom: 6,
    },
    drawerProductPrice: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },

    // Stream Status
    streamStatusContainer: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    streamStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    streamStatusBuffering: {
        backgroundColor: 'rgba(255,165,0,0.8)',
    },
    streamStatusError: {
        backgroundColor: 'rgba(255,0,0,0.8)',
    },
    streamStatusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },

    // Share Modal
    shareModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareModalContent: {
        backgroundColor: 'rgba(30,30,30,0.95)',
        borderRadius: 24,
        padding: 24,
        width: SCREEN_WIDTH * 0.8,
        alignItems: 'center',
    },
    shareModalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 20,
    },
    shareOptions: {
        flexDirection: 'row',
        gap: 24,
    },
    shareOption: {
        alignItems: 'center',
        gap: 8,
    },
    shareOptionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    shareCloseBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 8,
    },

    pinnedProductContainer: {
        position: 'absolute',
        top: 90,
        left: 12,
        right: 12,
        zIndex: 100,
    },
    pinnedBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    pinnedImage: { width: 54, height: 54, borderRadius: 14 },
    pinnedInfo: { flex: 1, marginLeft: 12, gap: 1 },
    pinnedTag: { color: '#FFD700', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    pinnedName: { color: '#fff', fontSize: 13, fontWeight: '800', marginBottom: 2 },
    pinnedPrice: { color: '#fff', fontSize: 13, fontWeight: '900', opacity: 0.9 },
    buyNowBtn: {
        backgroundColor: '#fff',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    unpinBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 4
    },

    // floatingShopBtn removed as replaced by actionBtn

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '70%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
    pickerList: { gap: 12 },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 15,
        gap: 12,
    },
    pickerImg: { width: 60, height: 60, borderRadius: 10 },
    pickerInfo: { flex: 1, gap: 4 },
    pickerName: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
    pickerPrice: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
});