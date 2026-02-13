import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Text, TouchableOpacity, Image, ScrollView, Animated, Easing, Dimensions, Clipboard, StyleSheet, View, findNodeHandle, TextInput, KeyboardAvoidingView, Platform, FlatList, Share } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { CustomBuilder } from '../utils/CustomBuilder';
import { LiveSessionService } from '../services/LiveSessionService';
import { Gift as GiftIcon, Share2, Heart, Flame, Ticket, X, Clock, ShoppingBag, PlusCircle, Send } from 'lucide-react-native';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, increment, runTransaction, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { BlurView } from 'expo-blur';
import { FlameCounter } from '../components/FlameCounter';
import { db } from '../api/firebase';
import { GIFTS, Gift } from '../config/gifts';


// ✅ Expo Go detection
const isExpoGo = Constants.executionEnvironment === "storeClient";

// ✅ Conditionally import ZEGO and ZIM
let ZegoUIKitPrebuiltLiveStreaming: any;
let AUDIENCE_DEFAULT_CONFIG: any;
let ZegoMenuBarButtonName: any;
let ZegoLiveStreamingRole: any;
let ZIM: any = null;
let ZegoUIKit: any = null;
let ZegoExpressEngine: any = null;
let ZegoTextureView: any = null;
let ZegoMediaPlayerState: any = null;
let ZegoMultimediaLoadType: any = null;
let ZegoAlphaLayoutType: any = null;
let ZegoMediaPlayerResource: any = null;

if (!isExpoGo) {
    try {
        const ZegoModule = require('@zegocloud/zego-uikit-prebuilt-live-streaming-rn');
        ZegoUIKitPrebuiltLiveStreaming = ZegoModule.default;
        AUDIENCE_DEFAULT_CONFIG = ZegoModule.AUDIENCE_DEFAULT_CONFIG;
        ZegoMenuBarButtonName = ZegoModule.ZegoMenuBarButtonName;
        ZegoLiveStreamingRole = ZegoModule.ZegoLiveStreamingRole;
        ZIM = require('zego-zim-react-native');
        // Import ZegoUIKit for sending commands
        const ZegoUIKitModule = require('@zegocloud/zego-uikit-rn');
        ZegoUIKit = ZegoUIKitModule.default;

        const ZegoExpress = require('zego-express-engine-react-native');
        ZegoExpressEngine = ZegoExpress.default;
        ZegoTextureView = ZegoExpress.ZegoTextureView;
        ZegoMediaPlayerState = ZegoExpress.ZegoMediaPlayerState;
        ZegoMultimediaLoadType = ZegoExpress.ZegoMultimediaLoadType;
        ZegoAlphaLayoutType = ZegoExpress.ZegoAlphaLayoutType;
        ZegoMediaPlayerResource = ZegoExpress.ZegoMediaPlayerResource;
    } catch (e) {
        console.log('ZEGO modules not available');
    }
}

const ZEGO_APP_ID = 1327315162;
const ZEGO_APP_SIGN = '2c0f518d65e837480793f1ebe41b0ad44e999bca88ef783b65ef4391b4514ace';

type Props = {
    channelId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    onClose: () => void;
    t?: (key: string) => string;
    language?: 'fr' | 'ar';
    profileData?: any;
};

export default function AudienceLiveScreen(props: Props) {
    const t = props.t || ((key: string) => key);
    const { channelId, userId, userName, userAvatar, onClose, language, profileData } = props;

    const getLocalizedName = (name: any) => {
        if (typeof name === 'string') return name;
        if (!name) return '';
        return name[language === 'ar' ? 'ar-tn' : 'fr'] || name.fr || name.en || name.ar || Object.values(name)[0] || '';
    };
    const prebuiltRef = useRef<any>(null);
    const mediaViewRef = useRef<any>(null);
    const mediaPlayerRef = useRef<any>(null);
    const [showGiftVideo, setShowGiftVideo] = useState(false);
    const [showGifts, setShowGifts] = useState(false);
    const [giftQueue, setGiftQueue] = useState<{ senderName: string, targetName?: string, giftName: string, icon: string, isHost?: boolean, count: number, senderId?: string, senderAvatar?: string, isBig?: boolean }[]>([]);
    const [recentGift, setRecentGift] = useState<{ senderName: string, targetName?: string, giftName: string, icon: string, isHost?: boolean, count: number, senderId?: string, senderAvatar?: string, isBig?: boolean } | null>(null);
    const recentGiftRef = useRef<any>(null);
    const giftTimerRef = useRef<any>(null);
    const [streamHostId, setStreamHostId] = useState<string | null>(null);
    const [isInPK, setIsInPK] = useState(false);
    const [hostScore, setHostScore] = useState(0);
    const [guestScore, setGuestScore] = useState(0);
    const [opponentName, setOpponentName] = useState<string>('Opponent');
    const [pkHostName, setPkHostName] = useState('Host');
    const [pkTimeRemaining, setPkTimeRemaining] = useState(0);
    const [pkEndTime, setPkEndTime] = useState<number | null>(null);
    const [pkWinner, setPkWinner] = useState<string | null>(null);
    const [showPKResult, setShowPKResult] = useState(false);

    // Coupon State
    const [activeCoupon, setActiveCoupon] = useState<any>(null);
    const [couponTimeRemaining, setCouponTimeRemaining] = useState(0);
    const couponTimerRef = useRef<any>(null);
    const [likeCount, setLikeCount] = useState(0);
    const [totalLikes, setTotalLikes] = useState(0);
    const [floatingHearts, setFloatingHearts] = useState<{ id: number, x: number }[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
    const [pinnedProduct, setPinnedProduct] = useState<any | null>(null);
    const [showProductSheet, setShowProductSheet] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [address, setAddress] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [purchaseNotification, setPurchaseNotification] = useState<{ user: string, product: string } | null>(null);
    const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
    const [giftCategory, setGiftCategory] = useState<'POPULAIRE' | 'SPÉCIAL' | 'LUXE'>('POPULAIRE');
    const [userBalance, setUserBalance] = useState(0);


    // Pinned Product Timer State
    const [pinEndTime, setPinEndTime] = useState<number | null>(null);
    const [pinTimeRemaining, setPinTimeRemaining] = useState(0);

    const [isFollowed, setIsFollowed] = useState(false);
    const [collabType, setCollabType] = useState<string | null>(null);

    useEffect(() => {
        if (profileData) {
            setCustomerName(prev => prev || profileData.fullName || '');
            setPhoneNumber(prev => prev || profileData.phone || '');
            setUserBalance(profileData.points || 0);

            // For address, we might have multiple. Get the default or first one.
            if (profileData.addresses && profileData.addresses.length > 0) {
                const def = profileData.addresses.find((a: any) => a.isDefault) || profileData.addresses[0];
                setAddress(prev => prev || def.text || '');
            } else if (profileData.address) {
                setAddress(prev => prev || profileData.address);
            }
        }
    }, [profileData]);

    // Fetch Collab Info
    useEffect(() => {
        if (channelId) {
            getDoc(doc(db, 'collaborations', channelId)).then(snap => {
                if (snap.exists()) {
                    setCollabType(snap.data().type);
                }
            });
        }
    }, [channelId]);

    // Check if following
    useEffect(() => {
        if (userId && channelId) {
            const q = query(collection(db, 'users', userId, 'followingCollabs'), where('collabId', '==', channelId));
            const unsub = onSnapshot(q, (snap) => {
                setIsFollowed(!snap.empty);
            });
            return () => unsub();
        }
    }, [userId, channelId]);

    const toggleFollow = async () => {
        if (!userId || !channelId) return;
        try {
            if (isFollowed) {
                const q = query(collection(db, 'users', userId, 'followingCollabs'), where('collabId', '==', channelId));
                const snap = await getDocs(q);
                snap.forEach(async (d) => {
                    await deleteDoc(d.ref);
                });
            } else {
                await addDoc(collection(db, 'users', userId, 'followingCollabs'), {
                    collabId: channelId,
                    followedAt: serverTimestamp()
                });
            }
        } catch (e) {
            console.error('Follow Toggle Error:', e);
        }
    };

    const lastPurchaseTimeRef = useRef(0);

    const isInPKRef = useRef(false);
    const hostScoreRef = useRef(0);
    const guestScoreRef = useRef(0);
    const streamHostIdRef = useRef<string | null>(null);

    // Initial load sync
    useEffect(() => {
        recentGiftRef.current = recentGift;
    }, [recentGift]);
    const lastGiftTimestampRef = useRef(0); // Track last processed gift to avoid duplicates
    const heartCounter = useRef(0);

    const handlePurchase = async () => {
        if (!customerName.trim()) {
            Alert.alert(t('error') || 'Error', t('nameRequired') || 'Please enter your full name');
            return;
        }
        if (!phoneNumber.trim()) {
            Alert.alert(t('error') || 'Error', t('phoneRequired') || 'Please enter your phone number');
            return;
        }
        if (!address.trim()) {
            Alert.alert(t('error') || 'Error', t('addressRequired') || 'Please enter a shipping address');
            return;
        }
        if (!selectedProduct) return;
        if (selectedProduct.colors && selectedProduct.colors.length > 0 && !selectedColor) {
            Alert.alert(t('error') || 'Error', t('selectColor') || 'Please select a color');
            return;
        }
        if (selectedProduct.sizes && selectedProduct.sizes.length > 0 && !selectedSize) {
            Alert.alert(t('error') || 'Error', t('selectSize') || 'Please select a size');
            return;
        }

        await LiveSessionService.broadcastPurchase(channelId, {
            purchaserName: userName || 'Viewer',
            productName: getLocalizedName(selectedProduct.name)
        });

        setShowPurchaseModal(false);
        setAddress('');
        setSelectedProduct(null);
        Alert.alert('Success', 'Order Placed! 🎉');
    };

    // Sync Refs is handled below but let's keep the hook structure clean



    // ✅ Sync refs
    useEffect(() => { isInPKRef.current = isInPK; }, [isInPK]);
    useEffect(() => { hostScoreRef.current = hostScore; }, [hostScore]);
    useEffect(() => { guestScoreRef.current = guestScore; }, [guestScore]);
    useEffect(() => { streamHostIdRef.current = streamHostId; }, [streamHostId]);

    // ✅ Process Gift Queue
    useEffect(() => {
        if (!recentGift && giftQueue.length > 0) {
            const nextGift = giftQueue[0];
            setGiftQueue(prev => prev.slice(1));
            setRecentGift(nextGift);
            recentGiftRef.current = nextGift; // Sync ref immediately for incoming matches

            // ✅ Only show pill if NOT isBig
            if (nextGift.isBig) {
                const gift = GIFTS.find(g => g.name === nextGift.giftName);
                if (gift?.url) showGiftAnimation(gift.url);
                // Progress after animation duration
                setTimeout(() => {
                    setRecentGift(null);
                    recentGiftRef.current = null;
                }, 4500); // Increased duration for big animations to play fully
            }
        }

        // Start clear timer
        if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
        giftTimerRef.current = setTimeout(() => {
            setRecentGift(null);
        }, 3000);

    }, [recentGift, giftQueue]);

    const gifts = GIFTS;

    // Helper to check if a gift matches for combo
    const isSameGift = (g1: any, g2Id: string, g2Name: string, g2GiftName: string) => {
        if (!g1) return false;
        if (g1.giftName !== g2GiftName) return false;
        const id1 = g1.senderId?.toLowerCase();
        const id2 = g2Id?.toLowerCase();
        if (id1 && id2 && id1 === id2) return true;
        if (g1.senderName === g2Name) return true;
        return false;
    };

    const sendGift = (gift: any) => {
        // COMBO LOGIC: Local feedback
        const current = recentGiftRef.current;
        const finalAvatar = userAvatar || profileData?.avatar || CustomBuilder.getUserAvatar(userId);

        if (isSameGift(current, userId, userName, gift.name)) {
            setRecentGift(prev => {
                const updated = prev ? { ...prev, count: prev.count + 1 } : null;
                recentGiftRef.current = updated;
                return updated;
            });
            if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
            giftTimerRef.current = setTimeout(() => {
                setRecentGift(null);
                recentGiftRef.current = null;
            }, 3000);
        } else {
            setGiftQueue(prev => {
                const last = prev[prev.length - 1];
                if (last && (last.senderId === userId || last.senderName === userName) && last.giftName === gift.name) {
                    return [...prev.slice(0, -1), { ...last, count: last.count + 1 }];
                }
                return [...prev, {
                    senderName: userName || 'You',
                    giftName: gift.name,
                    icon: gift.icon,
                    count: 1,
                    senderId: userId,
                    senderAvatar: finalAvatar,
                    isHost: false,
                    isBig: gift.points >= 500
                }];
            });
        }

        // Optimistically update totalLikes with gift points
        setTotalLikes(prev => prev + (gift.points || 1));
        if (streamHostIdRef.current) {
            setHostScore(prev => prev + (gift.points || 1));
        }

        // Send Command via Signal (Zego)
        if (ZegoUIKit) {
            ZegoUIKit.getSignalingPlugin().sendInRoomCommandMessage(JSON.stringify({
                type: 'gift',
                senderId: userId,
                senderAvatar: finalAvatar, // ✅ Consistent avatar
                userName: userName,
                giftName: gift.name,
                points: gift.points,
                icon: gift.icon,
                timestamp: Date.now()
            })).catch((e: any) => console.log('Gift Send Error:', e));
        }

        // Sync with Firestore (Backup & Reliability)
        if (channelId) {
            LiveSessionService.incrementGifts(channelId, gift.points || 1).catch(e => console.error('Gift Score Error:', e));
            LiveSessionService.broadcastGift(channelId, {
                giftName: gift.name,
                icon: gift.icon,
                points: gift.points || 1,
                senderName: userName || 'Viewer'
            }).catch(e => console.error('Gift Broadcast Error:', e));
        }
    };


    // Register user avatar & Handle Join/Leave Firestore
    useEffect(() => {
        // Reset State on Mount/Channel Change
        setTotalLikes(0);
        setHostScore(0);
        setGuestScore(0);
        setIsInPK(false);
        setGiftQueue([]);
        setFloatingHearts([]);
        console.log('🔄 Audience Screen Refreshed for Channel:', channelId);

        if (userAvatar && userId) {
            CustomBuilder.registerAvatar(userId, userAvatar);
        }

        // 1. Subscribe to session to get host details and sync state
        const unsubscribe = LiveSessionService.subscribeToSession(channelId, (session) => {
            if (session.status === 'ended') {
                console.log('🎬 Session ended by host, closing screen');
                onClose();
                return;
            }

            if (session.hostId) {
                setStreamHostId(session.hostId);
                if (session.hostAvatar) {
                    CustomBuilder.registerAvatar(session.hostId, session.hostAvatar);
                }
            }

            // Sync Flame Count
            if (session.totalLikes !== undefined) {
                setTotalLikes(prev => Math.max(prev, session.totalLikes as number));
            }

            // Sync PK State
            if (session.pkState) {
                setIsInPK(session.pkState.isActive);
                setHostScore(session.pkState.hostScore);
                setGuestScore(session.pkState.guestScore);
                if (session.pkState.opponentName) setOpponentName(session.pkState.opponentName);
                if (session.pkState.hostName) setPkHostName(session.pkState.hostName);

                if (session.pkState.endTime) {
                    setPkEndTime(session.pkState.endTime);
                    const remaining = Math.max(0, Math.floor((session.pkState.endTime - Date.now()) / 1000));
                    setPkTimeRemaining(remaining);
                }

                if (session.pkState.winner) {
                    // Only show result if scores are not 0-0
                    const hScore = session.pkState.hostScore || 0;
                    const gScore = session.pkState.guestScore || 0;

                    if (hScore > 0 || gScore > 0) {
                        setPkWinner(session.pkState.winner);
                        setShowPKResult(true);
                        setTimeout(() => {
                            setShowPKResult(false);
                            setPkWinner(null);
                        }, 5000);
                    }
                }
            }

            // Sync Active Coupon from Firestore
            if (session.activeCoupon) {
                setActiveCoupon(session.activeCoupon);
                // Calculate remaining time
                if (session.activeCoupon.endTime) {
                    const remaining = Math.max(0, Math.floor((session.activeCoupon.endTime - Date.now()) / 1000));
                    setCouponTimeRemaining(remaining);
                }
            } else {
                setActiveCoupon(null);
                setCouponTimeRemaining(0);
            }

            // Sync Gift Animations
            if (session.lastGift && session.lastGift.timestamp > lastGiftTimestampRef.current) {
                lastGiftTimestampRef.current = session.lastGift.timestamp;
                if (session.lastGift.senderName !== userName) {
                    setGiftQueue(prev => [...prev, {
                        senderName: session.lastGift!.senderName,
                        giftName: session.lastGift!.giftName,
                        icon: session.lastGift!.icon,
                        count: 1,
                        isHost: false
                    }]);
                }
            }

            // Sync Pinned Product
            if (session.pinnedProduct) {
                setPinEndTime(session.pinnedProduct.endTime || null);
                if (!pinnedProduct || pinnedProduct.id !== session.pinnedProduct.productId) {
                    getDoc(doc(db, 'products', session.pinnedProduct.productId)).then((snap: any) => {
                        if (snap.exists()) setPinnedProduct({ id: snap.id, ...snap.data() });
                    });
                }
            } else if (session.currentProductId) {
                // Fallback for sessions using old structure
                if (!pinnedProduct || pinnedProduct.id !== session.currentProductId) {
                    getDoc(doc(db, 'products', session.currentProductId)).then((snap: any) => {
                        if (snap.exists()) setPinnedProduct({ id: snap.id, ...snap.data() });
                    });
                }
            } else {
                setPinnedProduct(null);
                setPinEndTime(null);
            }

            // Sync Featured Products
            if (session.featuredProductIds && session.featuredProductIds.length > 0) {
                if (featuredProducts.length !== session.featuredProductIds.length) {
                    Promise.all(session.featuredProductIds.map((id: string) => getDoc(doc(db, 'products', id))))
                        .then(snaps => {
                            const list = snaps.map(s => ({ id: s.id, ...s.data() }) as any).filter((p: any) => p.name);
                            setFeaturedProducts(list);
                        });
                }
            } else {
                setFeaturedProducts([]);
            }

            // Sync Purchase Animation
            if (session.lastPurchase && session.lastPurchase.timestamp > lastPurchaseTimeRef.current) {
                lastPurchaseTimeRef.current = session.lastPurchase.timestamp;
                setPurchaseNotification({
                    user: session.lastPurchase.purchaserName,
                    product: getLocalizedName(session.lastPurchase.productName)
                });
                setTimeout(() => setPurchaseNotification(null), 5000);
            }
        });

        // 2. Increment view count
        const joinFirestore = async () => {
            try {
                await LiveSessionService.joinSession(channelId);
            } catch (error) {
                console.error('Error joining Firestore:', error);
            }
        };

        const leaveFirestore = async () => {
            try {
                await LiveSessionService.leaveSession(channelId);
            } catch (error) {
                console.error('Error leaving Firestore:', error);
            }
        };

        joinFirestore();

        return () => {
            if (unsubscribe) unsubscribe();
            leaveFirestore();
        };
    }, [channelId, userAvatar, userId, userName]);

    // PK Timer Countdown for Audience
    useEffect(() => {
        if (!isInPK || !pkEndTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((pkEndTime - now) / 1000));
            setPkTimeRemaining(remaining);

            if (remaining === 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isInPK, pkEndTime]);

    // Pin Timer Countdown for Audience
    useEffect(() => {
        if (!pinEndTime) {
            setPinTimeRemaining(0);
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((pinEndTime - now) / 1000));
            setPinTimeRemaining(remaining);

            if (remaining === 0) {
                // No local unpin here, wait for Firestore sync from host
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [pinEndTime]);

    // Gift Animation Logic (Image/WebP Overlay)
    const showGiftAnimation = async (videoUrl?: string) => {
        // Since we have images/WebP and not MP4 videos, we don't need Zego Media Player.
        // The UI overlay already handles rendering the animated gift based on recentGift.
        try {
            setShowGiftVideo(true); // Mount the full-screen overlay

            // Auto-hide the animation after 4.5 seconds
            if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
            setTimeout(() => {
                setShowGiftVideo(false);
            }, 4500);

        } catch (error) {
            console.error('Error showing gift animation:', error);
            setShowGiftVideo(false);
        }
    };

    // ✅ Listen for PK and Gift commands via Signaling Plugin directly (More reliable)
    useEffect(() => {
        if (ZegoUIKit) {
            const callbackID = 'AudiencePKStatusListener';

            ZegoUIKit.getSignalingPlugin().onInRoomCommandMessageReceived(callbackID, (msgData: any) => {
                const message = msgData.message;
                // console.log('Audience received CMD:', message); // Uncomment for full debug

                try {
                    const data = JSON.parse(message);

                    if (data.type === 'PK_START') {
                        setIsInPK(true);
                        setHostScore(data.hostScore || 0);
                        setGuestScore(data.guestScore || 0);
                        setOpponentName(data.opponentName || 'Opponent');
                        setPkHostName(data.hostName || 'Host');
                        if (data.hostId) setStreamHostId(data.hostId);

                        // Set timer information
                        if (data.endTime) {
                            setPkEndTime(data.endTime);
                            const remaining = Math.max(0, Math.floor((data.endTime - Date.now()) / 1000));
                            setPkTimeRemaining(remaining);
                        }
                    } else if (data.type === 'PK_SCORE_SYNC') {
                        const inPk = data.isInPK !== undefined ? data.isInPK : true;
                        console.log('🔄 PK_SCORE_SYNC received. InPK:', inPk);
                        setIsInPK(inPk); // Respect host's state

                        if (data.totalLikes !== undefined) {
                            setTotalLikes(prev => Math.max(prev, data.totalLikes));
                        }
                        setHostScore(data.hostScore);
                        setGuestScore(data.guestScore);
                        if (data.opponentName) setOpponentName(data.opponentName);
                        if (data.hostName) setPkHostName(data.hostName);
                        if (data.hostId) setStreamHostId(data.hostId);

                        // Update timer if provided
                        if (data.endTime) {
                            setPkEndTime(data.endTime);
                            const remaining = Math.max(0, Math.floor((data.endTime - Date.now()) / 1000));
                            setPkTimeRemaining(remaining);
                        }
                    } else if (data.type === 'PK_VOTE') {
                        setIsInPK(true);
                        if (data.hostId && streamHostIdRef.current && data.hostId === streamHostIdRef.current) {
                            setHostScore(prev => prev + (data.points || 0));
                        } else {
                            setGuestScore(prev => prev + (data.points || 0));
                        }
                    } else if (data.type === 'PK_LIKE') {
                        const points = data.count || 1;
                        setTotalLikes(prev => prev + points);
                        if (data.hostId && streamHostIdRef.current && data.hostId === streamHostIdRef.current) {
                            setHostScore(prev => prev + points);
                        } else {
                            setGuestScore(prev => prev + points);
                        }
                    } else if (data.type === 'PK_BATTLE_STOP') {
                        setIsInPK(false);
                    } else if (data.type === 'gift') {
                        setTotalLikes(prev => prev + (Number(data.points) || 1));

                        const senderId = data.senderId || data.userId;
                        const isHost = data.isHost === true;
                        const senderName = data.userName || 'Viewer';
                        const giftNameStr = String(data.giftName || '');

                        // COMBO LOGIC
                        const current = recentGiftRef.current;
                        if (isSameGift(current, senderId, senderName, giftNameStr)) {
                            setRecentGift(prev => {
                                const updated = prev ? { ...prev, count: prev.count + 1 } : null;
                                recentGiftRef.current = updated;
                                return updated;
                            });
                            if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
                            giftTimerRef.current = setTimeout(() => {
                                setRecentGift(null);
                                recentGiftRef.current = null;
                            }, 3000);
                        } else {
                            const foundGift = GIFTS.find(g => g.name.toLowerCase() === giftNameStr.toLowerCase());
                            const isBig = (foundGift && (foundGift.points || 0) >= 500) || (Number(data.points || 0) >= 500);

                            setGiftQueue(prev => {
                                const last = prev[prev.length - 1];
                                if (last && (last.senderId?.toLowerCase() === senderId?.toLowerCase() || last.senderName === senderName) && last.giftName === giftNameStr) {
                                    return [...prev.slice(0, -1), { ...last, count: last.count + 1 }];
                                }
                                return [...prev.slice(-10), {
                                    senderName: senderName,
                                    giftName: giftNameStr,
                                    icon: foundGift ? foundGift.icon : data.icon,
                                    count: 1,
                                    senderId: senderId,
                                    senderAvatar: data.senderAvatar,
                                    isHost: isHost,
                                    isBig: isBig
                                }];
                            });
                        }
                    } else if (data.type === 'coupon_drop') {
                        setActiveCoupon(data);
                        const remaining = Math.max(0, Math.floor((data.endTime - Date.now()) / 1000));
                        setCouponTimeRemaining(remaining);
                    }
                } catch (e) {
                    console.error('Error parsing signaling command:', e);
                }
            });
            return () => {
                ZegoUIKit.getSignalingPlugin().onInRoomCommandMessageReceived(callbackID, () => { });
            };
        }
    }, [ZegoUIKit]);

    // Coupon Timer Effect - Robust Date-based calculation
    useEffect(() => {
        if (activeCoupon?.endTime) {
            const updateTimer = () => {
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((activeCoupon.endTime - now) / 1000));
                setCouponTimeRemaining(remaining);

                if (remaining <= 0) {
                    setActiveCoupon(null);
                }
            };

            updateTimer(); // Immediate update
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        } else {
            setCouponTimeRemaining(0);
        }
    }, [activeCoupon]);

    const likeBatchRef = useRef(0);
    const lastLikeSentTimeRef = useRef(0);

    const handleSendLike = () => {
        if (!ZegoUIKit) return;

        // Visual effects
        const id = ++heartCounter.current;
        const x = Math.random() * 60 - 30;
        setFloatingHearts(prev => [...prev.slice(-15), { id, x }]);
        setTimeout(() => {
            setFloatingHearts(prev => prev.filter(h => h.id !== id));
        }, 3000);

        // Optimistic Updates
        setLikeCount(prev => prev + 1);
        setTotalLikes(prev => prev + 1);
        if (streamHostIdRef.current) {
            setHostScore(prev => prev + 1);
        }

        // Batching Logic
        likeBatchRef.current += 1;
        const now = Date.now();

        // Send batch if > 1s passed or > 10 likes pending
        if (now - lastLikeSentTimeRef.current > 1000 || likeBatchRef.current >= 10) {
            const countToSend = likeBatchRef.current;
            likeBatchRef.current = 0;
            lastLikeSentTimeRef.current = now;

            console.log(`❤️ Sending Batch Like (${countToSend}) to Host:`, streamHostIdRef.current);

            // 1. Send Command (Fast, cheap)
            ZegoUIKit.sendInRoomCommand(JSON.stringify({
                type: 'PK_LIKE',
                hostId: streamHostIdRef.current,
                userName: userName,
                count: countToSend // New field
            }), [], (res: any) => { if (res?.errorCode) console.error('SendCmd Error:', res) });

            // 2. Update Firestore (Reliable, persistent)
            LiveSessionService.incrementLikes(channelId, countToSend).catch(e => console.error('Firestore Like Error:', e));
        }
    };

    const FloatingHeart = ({ x, id }: { x: number, id: number }) => {
        const animation = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.timing(animation, {
                toValue: 1,
                duration: 2500,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }).start();
        }, []);

        const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -500],
        });

        const opacity = animation.interpolate({
            inputRange: [0, 0.7, 1],
            outputRange: [1, 1, 0],
        });

        const scale = animation.interpolate({
            inputRange: [0, 0.1, 1],
            outputRange: [0.6, 1.2, 0.8],
        });

        return (
            <Animated.View
                key={id}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    transform: [{ translateY }, { translateX: x }, { scale }],
                    opacity,
                }}
            >
                <Heart size={36} color="#FF0066" fill="#FF0066" />
            </Animated.View>
        );
    };



    if (!ZegoUIKitPrebuiltLiveStreaming) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
                        Live Streaming Unavailable
                    </Text>
                    <Text style={{ color: '#ccc', fontSize: 16, textAlign: 'center', marginBottom: 30 }}>
                        Live Streaming features require native modules not available in Expo Go. Please use a Development Build or the standalone app.
                    </Text>
                    <TouchableOpacity
                        onPress={async () => {
                            // ✅ Leave session before closing (decrement view count)
                            console.log('🎬 Expo Go: Leaving session before close');
                            try {
                                await LiveSessionService.leaveSession(channelId);
                            } catch (error) {
                                console.error('Error leaving session:', error);
                            }
                            onClose();
                        }}
                        style={{
                            backgroundColor: '#FF0055',
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 25,
                        }}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Flame Counter */}
            {/* Flame Counter - ONLY if reach 50 */}
            {totalLikes >= 50 && (
                <FlameCounter count={totalLikes} onPress={handleSendLike} top={isInPK ? 180 : 110} />
            )}

            {/* PK BATTLE SCORE BAR - Premium Look */}
            {isInPK && (
                <Animatable.View
                    animation="slideInDown"
                    duration={800}
                    style={{
                        position: 'absolute',
                        top: 70,
                        width: '100%',
                        alignItems: 'center',
                        zIndex: 2000,
                        paddingHorizontal: 20
                    }}>
                    {/* Timer Display */}
                    {pkTimeRemaining > 0 && (
                        <View style={{
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            paddingHorizontal: 16,
                            paddingVertical: 6,
                            borderRadius: 20,
                            marginBottom: 8,
                            borderWidth: 2,
                            borderColor: pkTimeRemaining <= 30 ? '#EF4444' : '#3B82F6'
                        }}>
                            <Text style={{
                                color: pkTimeRemaining <= 30 ? '#EF4444' : '#fff',
                                fontSize: 16,
                                fontWeight: '900',
                                letterSpacing: 1
                            }}>
                                ⏱️ {Math.floor(pkTimeRemaining / 60)}:{(pkTimeRemaining % 60).toString().padStart(2, '0')}
                            </Text>
                        </View>
                    )}

                    <View style={{ flexDirection: 'row', width: '100%', height: 28, borderRadius: 14, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <LinearGradient
                            colors={['#FF0055', '#FF4D80']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={{
                                flex: Math.max(hostScore, 1),
                                justifyContent: 'center',
                                paddingLeft: 12
                            }}
                        >
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 2 }}>{hostScore}</Text>
                        </LinearGradient>
                        <LinearGradient
                            colors={['#3B82F6', '#60A5FA']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={{
                                flex: Math.max(guestScore, 1),
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                paddingRight: 12
                            }}
                        >
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 2 }}>{guestScore}</Text>
                        </LinearGradient>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8, paddingHorizontal: 2 }}>
                        <View style={{ backgroundColor: '#FF0055', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{pkHostName?.toUpperCase() || 'HOST'}</Text>
                        </View>
                        <View style={{ backgroundColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{opponentName?.toUpperCase() || 'OPPONENT'}</Text>
                        </View>
                    </View>
                </Animatable.View>
            )}

            {/* PK Winner Announcement - Modern UI */}
            {showPKResult && pkWinner && (
                <Animatable.View
                    animation="bounceIn"
                    duration={800}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3000,
                        backgroundColor: 'rgba(0,0,0,0.85)'
                    }}
                >
                    <LinearGradient
                        colors={pkWinner === 'Draw' ? ['#FCD34D', '#F59E0B', '#D97706'] : ['#10B981', '#059669', '#047857']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            width: '85%',
                            maxWidth: 350,
                            borderRadius: 30,
                            padding: 3,
                            shadowColor: pkWinner === 'Draw' ? '#FCD34D' : '#10B981',
                            shadowOffset: { width: 0, height: 20 },
                            shadowOpacity: 0.6,
                            shadowRadius: 30
                        }}
                    >
                        <View style={{
                            backgroundColor: '#1A1A24',
                            borderRadius: 27,
                            paddingVertical: 40,
                            paddingHorizontal: 30,
                            alignItems: 'center'
                        }}>
                            {/* Confetti/Trophy Animation */}
                            <View style={{
                                flexDirection: 'row',
                                marginBottom: 15,
                                gap: 8
                            }}>
                                <Text style={{ fontSize: 32 }}>🎉</Text>
                                <Text style={{ fontSize: 48 }}>
                                    {pkWinner === 'Draw' ? '🤝' : '👑'}
                                </Text>
                                <Text style={{ fontSize: 32 }}>🎉</Text>
                            </View>

                            {/* Title */}
                            <Text style={{
                                color: '#fff',
                                fontSize: 16,
                                fontWeight: '600',
                                marginBottom: 12,
                                opacity: 0.7,
                                letterSpacing: 2,
                                textTransform: 'uppercase'
                            }}>
                                {pkWinner === 'Draw' ? t('battleEnded') : t('pkWinnerTitle')}
                            </Text>

                            {/* Winner Name */}
                            <LinearGradient
                                colors={pkWinner === 'Draw' ? ['#FCD34D', '#F59E0B'] : ['#10B981', '#34D399']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    paddingHorizontal: 24,
                                    paddingVertical: 12,
                                    borderRadius: 20,
                                    marginBottom: 20
                                }}
                            >
                                <Text style={{
                                    color: '#000',
                                    fontSize: 32,
                                    fontWeight: '900',
                                    textAlign: 'center',
                                    textShadowColor: 'rgba(255,255,255,0.3)',
                                    textShadowOffset: { width: 0, height: 1 },
                                    textShadowRadius: 2
                                }}>
                                    {pkWinner === 'Draw' ? t('itsADraw') : pkWinner}
                                </Text>
                            </LinearGradient>

                            {/* Score Display */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                paddingHorizontal: 20,
                                paddingVertical: 12,
                                borderRadius: 15,
                                gap: 15
                            }}>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ color: '#888', fontSize: 11, marginBottom: 4, fontWeight: '600' }}>
                                        {pkHostName?.toUpperCase()}
                                    </Text>
                                    <Text style={{
                                        color: '#FF0055',
                                        fontSize: 28,
                                        fontWeight: '900'
                                    }}>
                                        {hostScore}
                                    </Text>
                                </View>

                                <Text style={{ color: '#666', fontSize: 20, fontWeight: '700' }}>VS</Text>

                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ color: '#888', fontSize: 11, marginBottom: 4, fontWeight: '600' }}>
                                        {opponentName?.toUpperCase()}
                                    </Text>
                                    <Text style={{
                                        color: '#3B82F6',
                                        fontSize: 28,
                                        fontWeight: '900'
                                    }}>
                                        {guestScore}
                                    </Text>
                                </View>
                            </View>

                            {/* Celebration Message */}
                            {pkWinner !== 'Draw' && (
                                <Text style={{
                                    color: '#888',
                                    fontSize: 13,
                                    marginTop: 20,
                                    fontWeight: '600',
                                    textAlign: 'center'
                                }}>
                                    🎊 Congratulations! 🎊
                                </Text>
                            )}
                        </View>
                    </LinearGradient>
                </Animatable.View>
            )}

            <ZegoUIKitPrebuiltLiveStreaming
                key={channelId} // Force remount on channel switch
                appID={ZEGO_APP_ID}
                appSign={ZEGO_APP_SIGN}
                userID={userId}
                userName={userName}
                liveID={channelId}
                config={{
                    ...AUDIENCE_DEFAULT_CONFIG,
                    role: ZegoLiveStreamingRole?.Audience ?? 2,
                    confirmStartLive: false,
                    showStartLiveButton: false,
                    confirmLeave: true,
                    turnOnCameraWhenJoining: false,
                    turnOnMicrophoneWhenJoining: false,
                    onLiveStreamingEnded: () => {
                        console.log('🎬 [Audience] Live streaming ended by Host');
                        Alert.alert(t ? t('liveEnded') : 'Live Ended', t ? t('hostEndedSession') : 'The host has ended the live session.', [
                            { text: 'OK', onPress: () => onClose() }
                        ]);
                    },
                    onLeaveLiveStreaming: () => {
                        console.log('🎬 Audience leaving live via SDK');
                        onClose();
                    },
                    pkConfig: {},
                    layout: {
                        mode: 0, // 0: Picture in Picture
                        config: {
                            showMyViewWithVideoOnly: true, // THIS fixes the 'small cam' issue for audience
                        },
                    },
                    coHostConfig: {
                        showRequestCoHostButton: true,
                    },
                    topMenuBarConfig: {
                        buttons: [
                            ZegoMenuBarButtonName.minimizingButton,
                            ZegoMenuBarButtonName.leaveButton
                        ],
                        buttonBuilders: {
                            leaveBuilder: CustomBuilder.leaveBuilder,
                            minimizingBuilder: CustomBuilder.minimizingBuilder,
                            memberBuilder: CustomBuilder.memberBuilder,
                            hostAvatarBuilder: (host: any) => {
                                return (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingRight: 8, paddingVertical: 2, paddingLeft: 2 }}>
                                        <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#fff' }}>
                                            <Image source={{ uri: CustomBuilder.getUserAvatar(host.userID) }} style={{ width: '100%', height: '100%' }} />
                                        </View>
                                        <View style={{ marginLeft: 6, marginRight: 8 }}>
                                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }} numberOfLines={1}>{host.userName}</Text>
                                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>{totalLikes} likes</Text>
                                        </View>
                                        {(!isFollowed && collabType !== 'Brand' && host.userID?.toLowerCase() !== userId?.toLowerCase()) && (
                                            <TouchableOpacity
                                                onPress={toggleFollow}
                                                style={{
                                                    backgroundColor: '#FF0055',
                                                    paddingHorizontal: 10,
                                                    paddingVertical: 5,
                                                    borderRadius: 12
                                                }}
                                            >
                                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{(t('follow') || 'FOLLOW').toUpperCase()}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            },
                        },
                    },
                    bottomMenuBarConfig: {
                        maxCount: 4,
                        buttons: [
                            ZegoMenuBarButtonName.chatButton || 'chat',
                            ZegoMenuBarButtonName.coHostControlButton || 'cohost',
                        ],
                        buttonBuilders: {
                            giftBuilder: CustomBuilder.giftBuilder,
                            toggleCameraBuilder: CustomBuilder.toggleCameraBuilder,
                            toggleMicrophoneBuilder: CustomBuilder.toggleMicrophoneBuilder,
                            switchCameraBuilder: CustomBuilder.switchCameraBuilder,
                            switchAudioOutputBuilder: CustomBuilder.switchAudioOutputBuilder,
                            enableChatBuilder: CustomBuilder.enableChatBuilder,
                            chatBuilder: CustomBuilder.chatBuilder,
                            leaveBuilder: CustomBuilder.leaveBuilder,
                            coHostControlButton: (status: any) => {
                                return (
                                    <View style={{
                                        backgroundColor: 'rgba(0,0,0,0.4)',
                                        paddingHorizontal: 16,
                                        height: 44,
                                        borderRadius: 22,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.2)',
                                        gap: 6
                                    }}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                                            {t ? t('coHost') : 'Go Live'}
                                        </Text>
                                    </View>
                                )
                            }
                        },
                    },
                    onInRoomCommandReceived: (messageData: any) => {
                        try {
                            const data = typeof messageData.message === 'string' ? JSON.parse(messageData.message) : messageData.message;
                            if (data.type === 'coupon_drop') {
                                setActiveCoupon(data);
                                const remaining = Math.max(0, Math.floor((data.endTime - Date.now()) / 1000));
                                setCouponTimeRemaining(remaining);
                            }
                        } catch (e) {
                            console.log('Error parsing audience command:', e);
                        }
                    },
                    inRoomChatConfig: {
                        itemBuilder: (message: any) => {
                            const senderName = message.sender.userName || 'Viewer';
                            const isHostMsg = senderName.includes('Host') || senderName === 'Tama Clothing';

                            return (
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'flex-start',
                                    paddingVertical: 6,
                                    paddingHorizontal: 14,
                                    backgroundColor: isHostMsg ? 'rgba(239, 68, 68, 0.8)' : 'rgba(0,0,0,0.5)',
                                    borderRadius: 18,
                                    marginVertical: 4,
                                    maxWidth: '90%',
                                    borderWidth: 1,
                                    borderColor: isHostMsg ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
                                    alignSelf: 'flex-start'
                                }}>
                                    <View>
                                        <Text style={{ fontSize: 13, lineHeight: 18 }}>
                                            <Text style={{ color: isHostMsg ? '#FFD700' : '#A5F3FC', fontWeight: '900' }}>
                                                {senderName}:
                                            </Text>
                                            <Text style={{ color: '#fff', fontWeight: '500' }}> {message.message}</Text>
                                        </Text>
                                    </View>
                                </View>
                            );
                        }
                    },
                    onGiftButtonClick: () => {
                        setShowGifts(true);
                    },
                    onWindowMinimized: () => {
                        onClose();
                    },
                    onInRoomTextMessageReceived: (messages: any[]) => {
                        // ⚠️ DISABLED: Chat fallback causes duplicate gifts
                        // The onInRoomCommandReceived handler (via useEffect) is the primary method
                        // This fallback is only needed if commands fail completely

                        // Fallback: Check chat messages for gifts if command fails
                        messages.forEach((msg: any) => {
                            // Only process non-gift messages to avoid duplicates
                            if (msg.message && !msg.message.startsWith('🎁')) {
                                // Handle other chat messages here if needed
                            }
                        });
                    }
                }}
                {...(ZIM ? { plugins: [ZIM] } : {})}
            />

            {/* FULL SCREEN GIFT VIDEO OVERLAY */}
            {/* GIFT ANIMATIONS (Full Screen Overlay) */}
            {showGiftVideo && (
                <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
                    <View style={{ alignItems: 'center' }}>
                        {(() => {
                            const gift = GIFTS.find(g => g.name === recentGift?.giftName);
                            // Animated WebP (TikTok Style) or Generic Icon
                            const isBig = (gift?.points || 0) >= 500;
                            const source = gift?.url ? { uri: gift.url } : (gift?.icon ? (typeof gift.icon === 'number' ? gift.icon : { uri: gift.icon }) : null);

                            if (source) {
                                return (
                                    <Animatable.Image
                                        animation={isBig ? "zoomIn" : "tada"} // Cool animation
                                        duration={1000}
                                        source={source}
                                        style={{
                                            width: isBig ? '85%' : 200,
                                            height: isBig ? '85%' : 200,
                                            maxWidth: 500,
                                            maxHeight: 500
                                        }}
                                        resizeMode="contain"
                                    />
                                );
                            }
                            return null;
                        })()}

                        {/* Sender Avatar + Combo Count - Always show below gift for big gifts */}
                        {recentGift && showGiftVideo && (
                            <Animatable.View
                                key={`combo-${recentGift.giftName}-${recentGift.count}`}
                                animation="bounceIn"
                                duration={400}
                                style={{
                                    marginTop: 20,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transform: [{ rotate: '-6deg' }]
                                }}
                            >
                                <BlurView intensity={100} tint="dark" style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 8,
                                    paddingHorizontal: 16,
                                    borderRadius: 40,
                                    borderWidth: 2,
                                    borderColor: '#FBBF24',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    shadowColor: '#FBBF24',
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.8,
                                    shadowRadius: 15,
                                }}>
                                    <View style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 22,
                                        borderWidth: 2,
                                        borderColor: '#fff',
                                        overflow: 'hidden',
                                        marginRight: 10,
                                        backgroundColor: '#333'
                                    }}>
                                        <Image
                                            source={typeof recentGift.icon === 'number' ? recentGift.icon : { uri: recentGift.icon }}
                                            style={{ width: '80%', height: '80%' }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Text
                                        style={{
                                            color: '#FBBF24',
                                            fontSize: 38,
                                            fontWeight: '900',
                                            fontStyle: 'italic',
                                            textShadowColor: 'rgba(0,0,0,0.8)',
                                            textShadowRadius: 10,
                                            textShadowOffset: { width: 2, height: 2 },
                                            letterSpacing: 1
                                        }}
                                    >
                                        x{recentGift.count}
                                    </Text>
                                </BlurView>
                            </Animatable.View>
                        )}
                    </View>
                </View>
            )}

            {/* 🛍️ PRODUCT OVERLAYS */}

            {/* 1. Purchase Notification Banner */}
            {purchaseNotification && (
                <Animatable.View
                    animation="slideInDown"
                    duration={500}
                    style={{
                        position: 'absolute',
                        top: 130, // Below score bar
                        alignSelf: 'center',
                        zIndex: 9999,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        borderRadius: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#F59E0B'
                    }}
                >
                    <Text style={{ color: '#fff', fontSize: 14 }}>
                        🎉 <Text style={{ fontWeight: 'bold', color: '#F59E0B' }}>{purchaseNotification.user}</Text> bought <Text style={{ fontWeight: 'bold' }}>{purchaseNotification.product}</Text>
                    </Text>
                </Animatable.View>
            )}

            {/* 2. Pinned Product Card - Above Coupon */}
            {pinnedProduct && (
                <Animatable.View
                    animation="fadeInLeft"
                    duration={400}
                    style={{
                        position: 'absolute',
                        bottom: 380, // Above coupon which is at 290
                        left: 15,
                        width: 240,
                        zIndex: 3000
                    }}
                >
                    <BlurView intensity={80} tint="dark" style={{
                        borderRadius: 20,
                        padding: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        overflow: 'hidden'
                    }}>
                        <Image
                            source={{ uri: pinnedProduct.images?.[0] }}
                            style={{ width: 54, height: 54, borderRadius: 12, backgroundColor: '#333' }}
                        />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                <LinearGradient
                                    colors={['#EF4444', '#B91C1C']}
                                    style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 6 }}
                                >
                                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>{t('flashSale') || 'FLASH SALE'}</Text>
                                </LinearGradient>
                            </View>
                            <Text numberOfLines={1} style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{getLocalizedName(pinnedProduct.name)}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>{pinnedProduct.price} TND</Text>
                                {pinTimeRemaining > 0 && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Clock size={10} color="rgba(255,255,255,0.6)" style={{ marginRight: 4 }} />
                                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 'bold' }}>
                                            {Math.floor(pinTimeRemaining / 60)}:{(pinTimeRemaining % 60).toString().padStart(2, '0')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedProduct(pinnedProduct);
                                setShowPurchaseModal(true);
                            }}
                            style={{
                                backgroundColor: '#F59E0B',
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 8,
                                marginLeft: 8
                            }}
                        >
                            <Text style={{ color: '#000', fontWeight: '900', fontSize: 11 }}>{t('buy') || 'BUY'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setPinnedProduct(null)}
                            style={{
                                position: 'absolute',
                                top: 6,
                                right: 6,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                width: 18,
                                height: 18,
                                borderRadius: 9,
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={10} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                    </BlurView>
                </Animatable.View>
            )}



            {/* 4. Product Sheet Modal */}
            <Modal
                visible={showProductSheet}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowProductSheet(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                    activeOpacity={1}
                    onPress={() => setShowProductSheet(false)}
                >
                    <View style={{ backgroundColor: '#1A1A24', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '60%', padding: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Featured Products</Text>
                            <TouchableOpacity onPress={() => setShowProductSheet(false)}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            {featuredProducts.length === 0 ? (
                                <View style={{ alignItems: 'center', padding: 40 }}>
                                    <ShoppingBag size={40} color="#444" />
                                    <Text style={{ color: '#666', marginTop: 10 }}>No products featured yet.</Text>
                                </View>
                            ) : (
                                featuredProducts.map(p => (
                                    <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A2A35', borderRadius: 12, padding: 10, marginBottom: 10 }}>
                                        <Image source={{ uri: p.images?.[0] }} style={{ width: 70, height: 70, borderRadius: 8, backgroundColor: '#444' }} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }} numberOfLines={1}>{getLocalizedName(p.name)}</Text>
                                            <Text style={{ color: '#ccc', fontSize: 13, marginTop: 4 }}>{p.price} TND</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedProduct(p);
                                                setShowProductSheet(false);
                                                setShowPurchaseModal(true);
                                            }}
                                            style={{
                                                backgroundColor: '#3B82F6',
                                                paddingHorizontal: 16,
                                                paddingVertical: 8,
                                                borderRadius: 8
                                            }}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Buy</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 5. Purchase Confirmation Modal */}
            <Modal
                visible={showPurchaseModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPurchaseModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}
                >
                    <View style={{ backgroundColor: '#1A1A24', width: '90%', borderRadius: 20, padding: 20, maxWidth: 400 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Complete Purchase</Text>
                            <TouchableOpacity onPress={() => setShowPurchaseModal(false)}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {selectedProduct && (
                            <View>
                                <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                                    <Image source={{ uri: selectedProduct.images?.[0] }} style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: '#333' }} />
                                    <View style={{ marginLeft: 15, flex: 1 }}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{getLocalizedName(selectedProduct.name)}</Text>
                                        <Text style={{ color: '#F59E0B', fontSize: 16, fontWeight: 'bold', marginTop: 5 }}>{selectedProduct.price} TND</Text>
                                    </View>
                                </View>

                                {/* Color Selector */}
                                {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                                    <View style={{ marginBottom: 15 }}>
                                        <Text style={{ color: '#888', marginBottom: 8, fontSize: 12, fontWeight: '600' }}>{t('color') || 'Color'}</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                            {selectedProduct.colors.map((c: string) => {
                                                const isHex = c.startsWith('#');
                                                const isSelected = selectedColor === c;
                                                return (
                                                    <TouchableOpacity
                                                        key={c}
                                                        onPress={() => setSelectedColor(c)}
                                                        style={{
                                                            paddingHorizontal: 12,
                                                            paddingVertical: 8,
                                                            borderRadius: 8,
                                                            backgroundColor: isSelected ? '#F59E0B' : '#2A2A35',
                                                            borderWidth: 1.5,
                                                            borderColor: isSelected ? '#fff' : '#444',
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 6
                                                        }}
                                                    >
                                                        {isHex && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }} />}
                                                        <Text style={{ color: isSelected ? '#000' : '#fff', fontWeight: 'bold', fontSize: 12 }}>{c.toUpperCase()}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}

                                {/* Size Selector */}
                                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                                    <View style={{ marginBottom: 15 }}>
                                        <Text style={{ color: '#888', marginBottom: 8, fontSize: 12, fontWeight: '600' }}>{t('size') || 'Size'}</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                            {selectedProduct.sizes.map((s: string) => {
                                                const isSelected = selectedSize === s;
                                                return (
                                                    <TouchableOpacity
                                                        key={s}
                                                        onPress={() => setSelectedSize(s)}
                                                        style={{
                                                            width: 44,
                                                            height: 44,
                                                            borderRadius: 10,
                                                            backgroundColor: isSelected ? '#F59E0B' : '#2A2A35',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            borderWidth: 1.5,
                                                            borderColor: isSelected ? '#fff' : '#444'
                                                        }}
                                                    >
                                                        <Text style={{ color: isSelected ? '#000' : '#fff', fontWeight: 'bold' }}>{s}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}

                                {/* Contact Info */}
                                <View style={{ marginBottom: 12 }}>
                                    <Text style={{ color: '#888', marginBottom: 6, fontSize: 12, fontWeight: '600' }}>{t('fullName') || 'Full Name'}</Text>
                                    <TextInput
                                        placeholder={t('fullName') || 'Enter full name...'}
                                        placeholderTextColor="#555"
                                        value={customerName}
                                        onChangeText={setCustomerName}
                                        style={{ backgroundColor: '#121218', color: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333', fontSize: 14 }}
                                    />
                                </View>

                                <View style={{ marginBottom: 12 }}>
                                    <Text style={{ color: '#888', marginBottom: 6, fontSize: 12, fontWeight: '600' }}>{t('contactNumber') || 'Phone Number'}</Text>
                                    <TextInput
                                        placeholder={t('contactNumber') || 'Enter phone number...'}
                                        placeholderTextColor="#555"
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        keyboardType="phone-pad"
                                        style={{ backgroundColor: '#121218', color: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333', fontSize: 14 }}
                                    />
                                </View>

                                <View style={{ marginBottom: 20 }}>
                                    <Text style={{ color: '#888', marginBottom: 6, fontSize: 12, fontWeight: '600' }}>{t('shippingAddress') || 'Shipping Address'}</Text>
                                    <TextInput
                                        placeholder={t('deliveryAddress') || "Enter full address..."}
                                        placeholderTextColor="#555"
                                        value={address}
                                        onChangeText={setAddress}
                                        multiline
                                        numberOfLines={2}
                                        style={{ backgroundColor: '#121218', color: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333', fontSize: 14, minHeight: 60 }}
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handlePurchase}
                                    style={{
                                        backgroundColor: '#EF4444',
                                        paddingVertical: 14,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        marginTop: 10,
                                        shadowColor: '#EF4444',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 8,
                                        elevation: 5
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('confirmOrder') || 'CONFIRM ORDER'} • {selectedProduct.price} TND</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* TikTok Style Gift Modal */}
            <Modal
                visible={showGifts}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowGifts(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setShowGifts(false)}
                    />
                    <View style={{
                        backgroundColor: '#121218',
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        height: Dimensions.get('window').height * 0.55,
                        paddingBottom: Platform.OS === 'ios' ? 34 : 10
                    }}>
                        {/* Categories Bar */}
                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222', paddingHorizontal: 10 }}>
                            {['POPULAIRE', 'SPÉCIAL', 'LUXE'].map((cat: any) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setGiftCategory(cat)}
                                    style={{
                                        paddingVertical: 15,
                                        paddingHorizontal: 20,
                                        borderBottomWidth: giftCategory === cat ? 2 : 0,
                                        borderBottomColor: '#FF0066'
                                    }}
                                >
                                    <Text style={{
                                        color: giftCategory === cat ? '#fff' : '#888',
                                        fontWeight: 'bold',
                                        fontSize: 13
                                    }}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Gift Grid */}
                        <FlatList
                            key={giftCategory} // Force re-render when category changes for efficiency
                            numColumns={4}
                            data={gifts.filter(g => {
                                if (giftCategory === 'POPULAIRE') return g.points < 100;
                                if (giftCategory === 'SPÉCIAL') return g.points >= 100 && g.points < 500;
                                if (giftCategory === 'LUXE') return g.points >= 500;
                                return true;
                            })}
                            keyExtractor={(item: Gift) => item.id}
                            contentContainerStyle={{ padding: 10 }}
                            initialNumToRender={12}
                            maxToRenderPerBatch={8}
                            windowSize={3}
                            renderItem={({ item: gift }: { item: Gift }) => {
                                const isSelected = selectedGift?.id === gift.id;
                                return (
                                    <TouchableOpacity
                                        onPress={() => setSelectedGift(gift)}
                                        style={{
                                            width: '25%',
                                            aspectRatio: 0.85,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: 5,
                                            marginVertical: 5,
                                            borderRadius: 12,
                                            backgroundColor: isSelected ? 'rgba(255, 0, 102, 0.15)' : 'transparent',
                                            borderWidth: 1.5,
                                            borderColor: isSelected ? '#FF0066' : 'transparent'
                                        }}
                                    >
                                        <View style={{
                                            width: 55,
                                            height: 55,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: 6
                                        }}>
                                            {typeof gift.icon === 'number' ? (
                                                <Image source={gift.icon} style={{ width: 48, height: 48 }} resizeMode="contain" />
                                            ) : typeof gift.icon === 'string' && gift.icon.startsWith('http') ? (
                                                <Image source={{ uri: gift.icon }} style={{ width: 48, height: 48 }} resizeMode="contain" />
                                            ) : (
                                                <Text style={{ fontSize: 24 }}>{gift.icon}</Text>
                                            )}
                                        </View>
                                        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{gift.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                            <Text style={{ color: isSelected ? '#fff' : '#FFD700', fontSize: 9, fontWeight: '900' }}>{gift.points}</Text>
                                            <Text style={{ fontSize: 8, marginLeft: 2 }}>💎</Text>
                                        </View>

                                        {isSelected && (
                                            <Animatable.View
                                                animation="bounceIn"
                                                style={{
                                                    position: 'absolute',
                                                    top: 2,
                                                    right: 2,
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: 8,
                                                    backgroundColor: '#FF0066',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
                                            </Animatable.View>
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        {/* Bottom Actions */}
                        <BlurView intensity={90} tint="dark" style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 20,
                            paddingVertical: 14,
                            borderTopWidth: 1,
                            borderTopColor: 'rgba(255,255,255,0.1)',
                            backgroundColor: 'rgba(22, 22, 30, 0.7)'
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15, flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{userBalance}</Text>
                                    <Text style={{ fontSize: 12, marginLeft: 4 }}>💎</Text>
                                    <TouchableOpacity style={{ marginLeft: 6 }}>
                                        <PlusCircle size={16} color="#FF0066" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedGift) {
                                        sendGift(selectedGift);
                                    }
                                }}
                                disabled={!selectedGift}
                                style={{
                                    backgroundColor: selectedGift ? '#FF0066' : 'rgba(255,255,255,0.1)',
                                    paddingHorizontal: 28,
                                    paddingVertical: 12,
                                    borderRadius: 25,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    opacity: selectedGift ? 1 : 0.5,
                                    shadowColor: '#FF0066',
                                    shadowOpacity: selectedGift ? 0.4 : 0,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 4 }
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, marginRight: 8 }}>
                                    {t('send') || 'ENVOYER'}
                                </Text>
                                <Send size={18} color="#fff" />
                            </TouchableOpacity>
                        </BlurView>
                    </View>
                </View>
            </Modal>


            {/* TikTok Style Gift Alert Overlay - Top Left side pill */}
            {recentGift && (
                <View style={{
                    position: 'absolute',
                    top: 180, // Moved up slightly to avoid overlapping
                    left: 10,
                    zIndex: 10000,
                    flexDirection: 'row',
                    alignItems: 'center'
                }}>
                    <Animatable.View
                        animation="slideInLeft"
                        duration={400}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}
                    >
                        <BlurView intensity={95} tint="dark" style={{
                            borderRadius: 40,
                            paddingVertical: 4,
                            paddingHorizontal: 6,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            minWidth: 250,
                            overflow: 'hidden', // Fix rounded corners being hidden
                        }}>
                            {/* Avatar Circle */}
                            <View style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: '#FF0066',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1.5,
                                borderColor: 'rgba(255,255,255,0.8)',
                                overflow: 'hidden',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 3
                            }}>
                                <Image
                                    source={typeof recentGift.icon === 'number' ? recentGift.icon : { uri: recentGift.icon }}
                                    style={{ width: '80%', height: '80%' }}
                                    resizeMode="contain"
                                />
                            </View>

                            <View style={{ marginLeft: 10, marginRight: 40 }}>
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2 }} numberOfLines={1}>
                                    {recentGift.senderName}
                                </Text>
                                <Text style={{ color: '#FBBF24', fontSize: 11, fontWeight: '800' }}>
                                    {t('sentA')} {recentGift.giftName}
                                </Text>
                            </View>

                            {/* Gift Icon inside a bubble */}
                            <View
                                style={{
                                    position: 'absolute',
                                    right: 1, // Overlap the edge like TikTok
                                    width: 48,
                                    height: 48,
                                    borderRadius: 26,
                                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 2,
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 4, height: 4 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 6,
                                    elevation: 8
                                }}
                            >
                                <Animatable.Image
                                    key={`gift-icon-${recentGift.count}`}
                                    animation="tada"
                                    duration={1000}
                                    source={typeof recentGift.icon === 'number' ? recentGift.icon : { uri: recentGift.icon }}
                                    style={{ width: 38, height: 38 }}
                                    resizeMode="contain"
                                />
                            </View>
                        </BlurView>

                        {/* Combo Count UI */}
                        {recentGift.count > 1 && (
                            <Animatable.View
                                key={`combo-${recentGift.count}`}
                                animation="bounceIn"
                                duration={500}
                                style={{ marginLeft: 35 }}
                            >
                                <Text style={{
                                    color: '#FBBF24',
                                    fontSize: 32,
                                    fontWeight: '900',
                                    fontStyle: 'italic',
                                    textShadowColor: '#000',
                                    textShadowOffset: { width: 2, height: 2 },
                                    textShadowRadius: 4
                                }}>
                                    x{recentGift.count}
                                </Text>
                            </Animatable.View>
                        )}
                    </Animatable.View>
                </View>
            )}

            {/* FLOATING ACTION BUTTONS */}
            <View style={{ position: 'absolute', bottom: 120, right: 15, gap: 14, alignItems: 'center', zIndex: 1000 }}>
                {/* Floating Heart Animations */}
                <View style={{ position: 'absolute', bottom: 50, right: 0, width: 60, height: 400, pointerEvents: 'none' }}>
                    {floatingHearts.map(heart => (
                        <FloatingHeart key={heart.id} id={heart.id} x={heart.x} />
                    ))}
                </View>

                {/* Share Button - TikTok Style Glass */}
                <TouchableOpacity
                    onPress={() => Share.share({ message: `Watch my live stream on Tama!` })}
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.2)',
                        overflow: 'hidden'
                    }}
                >
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                    <Share2 size={20} color="#fff" />
                </TouchableOpacity>

                {/* Like Button - TikTok Style Glass/Pink */}
                <TouchableOpacity
                    onPress={handleSendLike}
                    activeOpacity={0.7}
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: 'rgba(0,0,0,0.4)', // Glass background for base state
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.2)',
                        overflow: 'hidden'
                    }}
                >
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                    <Heart size={20} color="#FF0066" fill="#FF0066" />
                </TouchableOpacity>

                {/* PINK GIFT BUTTON - Prominent */}
                <TouchableOpacity
                    onPress={() => setShowGifts(true)}
                    activeOpacity={0.7}
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: '#FF0066',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: '#fff',
                        shadowColor: '#FE2C55',
                        shadowOpacity: 0.5,
                        shadowRadius: 10,
                        elevation: 10
                    }}
                >
                    <GiftIcon size={20} color="#fff" strokeWidth={2.5} />
                </TouchableOpacity>

                {/* AMBER SHOPPING BAG BUTTON */}
                {featuredProducts.length > 0 && (
                    <TouchableOpacity
                        onPress={() => setShowProductSheet(true)}
                        activeOpacity={0.7}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.2)',
                            overflow: 'hidden'
                        }}
                    >
                        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                        <ShoppingBag size={20} color="#fff" />
                        <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#fff', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>{featuredProducts.length}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            {/* LIVE COUPON OVERLAY - Horizontal Ticket Style */}
            {activeCoupon && (
                <Animatable.View
                    animation="bounceInLeft"
                    style={{
                        position: 'absolute',
                        bottom: 290,
                        left: 15,
                        width: 200,
                        zIndex: 3000
                    }}
                >
                    <LinearGradient
                        colors={['#F59E0B', '#B45309']}
                        style={{
                            borderRadius: 10,
                            padding: 1,
                        }}
                    >
                        <View style={{
                            backgroundColor: '#121218',
                            borderRadius: 9,
                            flexDirection: 'row',
                            height: 75,
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            <View style={{ position: 'absolute', top: -5, left: '50%', marginLeft: -5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#000', zIndex: 10, borderWidth: 1, borderColor: '#B45309' }} />
                            <View style={{ position: 'absolute', bottom: -5, left: '50%', marginLeft: -5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#000', zIndex: 10, borderWidth: 1, borderColor: '#B45309' }} />

                            <View style={{ flex: 1, padding: 8, justifyContent: 'center' }}>
                                <Text style={{ color: '#F59E0B', fontSize: 6.5, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 }}>{t('limitedTimeOffer')?.toUpperCase() || 'OFFRE LIMITÉE'}</Text>
                                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>{activeCoupon.discount}{!activeCoupon.discount.toString().includes('%') ? '%' : ''} {t('off') || 'OFF'}</Text>

                                {couponTimeRemaining > 0 && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                        <Clock size={8} color="#EF4444" style={{ marginRight: 3 }} />
                                        <Text style={{ color: '#EF4444', fontSize: 9, fontWeight: '800' }}>
                                            {Math.floor(couponTimeRemaining / 60)}:{(couponTimeRemaining % 60).toString().padStart(2, '0')}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={{ width: 1, height: '100%', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', left: '50%', position: 'absolute' }} />

                            <View style={{ flex: 1, padding: 8, paddingLeft: 12, justifyContent: 'center', alignItems: 'center' }}>
                                <View style={{
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    paddingVertical: 3,
                                    paddingHorizontal: 6,
                                    borderRadius: 4,
                                    borderStyle: 'dashed',
                                    borderWidth: 1,
                                    borderColor: 'rgba(245, 158, 11, 0.4)',
                                    marginBottom: 6,
                                    width: '100%',
                                    alignItems: 'center'
                                }}>
                                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }}>{activeCoupon.code}</Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() => {
                                        if (Clipboard) {
                                            Clipboard.setString(activeCoupon.code);
                                            Alert.alert(t('success') || 'Succès', t('couponCopied') || 'Coupon copié');
                                        } else {
                                            Alert.alert(t('couponCode') || 'Code Coupon', activeCoupon.code);
                                        }
                                    }}
                                    activeOpacity={0.8}
                                    style={{ width: '100%', borderRadius: 4, overflow: 'hidden' }}
                                >
                                    <LinearGradient
                                        colors={['#F59E0B', '#D97706']}
                                        style={{ paddingVertical: 4, alignItems: 'center' }}
                                    >
                                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 8 }}>{t('claimCoupon')?.toUpperCase() || 'RÉCUPÉRER'}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                onPress={() => setActiveCoupon(null)}
                                style={{ position: 'absolute', top: 4, right: 4 }}
                            >
                                <X size={10} color="rgba(255,255,255,0.3)" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </Animatable.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        zIndex: 0,
    },
});
