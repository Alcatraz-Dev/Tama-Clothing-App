import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Text, TouchableOpacity, Image, ScrollView, Animated, Easing, Dimensions, Clipboard, StyleSheet, View, findNodeHandle, TextInput, KeyboardAvoidingView, Platform, FlatList, Share } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { CustomBuilder } from '../utils/CustomBuilder';
import { LiveSessionService } from '../services/LiveSessionService';
import { Gift as GiftIcon, Share2, Heart, Flame, Ticket, X, Clock, ShoppingBag, PlusCircle, Send, Timer, Trophy, User, Users, Coins } from 'lucide-react-native';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, increment, runTransaction, deleteDoc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { BlurView } from 'expo-blur';
import { FlameCounter } from '../components/FlameCounter';
import { db } from '../api/firebase';
import { GIFTS, Gift } from '../config/gifts';
import { RechargeModal } from '../components/RechargeModal';


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
    const [opponentChannelId, setOpponentChannelId] = useState<string | null>(null);

    // Coupon State
    const [activeCoupon, setActiveCoupon] = useState<any>(null);
    const [couponTimeRemaining, setCouponTimeRemaining] = useState(0);
    const couponTimerRef = useRef<any>(null);
    const videoTimerRef = useRef<any>(null);
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
    const [couponInput, setCouponInput] = useState(''); // User entered coupon
    const [purchaseNotification, setPurchaseNotification] = useState<{ user: string, product: string } | null>(null);

    const COLOR_MAP: Record<string, string> = {
        'RED': '#EF4444',
        'BLACK': '#000000',
        'WHITE': '#FFFFFF',
        'BLUE': '#3B82F6',
        'GREEN': '#22C55E',
        'YELLOW': '#EAB308',
        'PINK': '#EC4899',
        'PURPLE': '#A855F7',
        'ORANGE': '#F97316',
        'GRAY': '#6B7280',
        'OLIVE': '#808000',
        'NAVY': '#1E3A8A',
        'TEAL': '#14B8A6',
        'MAROON': '#800000',
        'BEIGE': '#F5F5DC',
        'BROWN': '#92400E'
    };
    const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
    const [giftCategory, setGiftCategory] = useState<'POPULAIRE' | 'SPÉCIAL' | 'LUXE'>('POPULAIRE');
    const [userBalance, setUserBalance] = useState(0);
    const clampedBalance = Math.max(0, userBalance);
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    const [hostId, setHostId] = useState<string | null>(null);


    // Pinned Product Timer State
    const [pinEndTime, setPinEndTime] = useState<number | null>(null);
    const [pinTimeRemaining, setPinTimeRemaining] = useState(0);

    const [isFollowed, setIsFollowed] = useState(false);
    const [collabType, setCollabType] = useState<string | null>(null);

    useEffect(() => {
        if (profileData) {
            setCustomerName(prev => prev || profileData.fullName || '');
            setPhoneNumber(prev => prev || profileData.phone || '');
            setUserBalance(profileData?.wallet?.coins || 0);

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
    const totalLikesRef = useRef(0);
    const pkStartLikesRef = useRef(0);
    const opponentChannelIdRef = useRef<string | null>(null);
    const handledPKEndTimeRef = useRef<number | null>(null);

    // State to Ref Sync
    useEffect(() => { isInPKRef.current = isInPK; }, [isInPK]);
    useEffect(() => { hostScoreRef.current = hostScore; }, [hostScore]);
    useEffect(() => { guestScoreRef.current = guestScore; }, [guestScore]);
    useEffect(() => { totalLikesRef.current = totalLikes; }, [totalLikes]);
    useEffect(() => { streamHostIdRef.current = streamHostId; }, [streamHostId]);
    useEffect(() => { opponentChannelIdRef.current = opponentChannelId; }, [opponentChannelId]);

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

        const basePrice = selectedProduct.discountPrice || selectedProduct.price;
        let finalPrice = basePrice;
        let appliedCoupon = null;

        if (activeCoupon && couponInput.trim().toUpperCase() === activeCoupon.code.toUpperCase()) {
            if (activeCoupon.type === 'percentage') {
                finalPrice = basePrice * (1 - activeCoupon.discount / 100);
            } else {
                finalPrice = Math.max(0, basePrice - activeCoupon.discount);
            }
            appliedCoupon = activeCoupon.code;
        }

        await LiveSessionService.broadcastPurchase(channelId, {
            purchaserName: userName || 'Viewer',
            productName: getLocalizedName(selectedProduct.name),
            price: finalPrice,
            couponCode: appliedCoupon,
            color: selectedColor,
            size: selectedSize
        });

        setCouponInput('');
        setShowPurchaseModal(false);
        setAddress('');
        setSelectedProduct(null);
        Alert.alert('Success', `Order Placed! Total: ${finalPrice.toFixed(2)} TND`);
    };

    // Sync Refs is handled below but let's keep the hook structure clean



    // ✅ Sync refs
    useEffect(() => { isInPKRef.current = isInPK; }, [isInPK]);
    useEffect(() => { totalLikesRef.current = totalLikes; }, [totalLikes]);
    useEffect(() => { opponentChannelIdRef.current = opponentChannelId; }, [opponentChannelId]);
    useEffect(() => { guestScoreRef.current = guestScore; }, [guestScore]);
    useEffect(() => { streamHostIdRef.current = streamHostId; }, [streamHostId]);

    // Capture baseline likes when PK Starts
    useEffect(() => {
        if (isInPK) {
            pkStartLikesRef.current = totalLikes;
            console.log('🏁 PK Started. Baseline Likes:', totalLikes);
            // setHostScore(0); // ❌ Removed: Follow Firestore sync for existing battles
            // setGuestScore(0); // ❌ Removed: Follow Firestore sync for existing battles
        }
    }, [isInPK]);
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
                if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
                giftTimerRef.current = setTimeout(() => {
                    setRecentGift(null);
                    recentGiftRef.current = null;
                }, 4500); // Wait for big animation to finish
            } else {
                // Regular gift clear timer
                if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
                giftTimerRef.current = setTimeout(() => {
                    setRecentGift(null);
                    recentGiftRef.current = null;
                }, 3000);
            }
        }
    }, [recentGift, giftQueue]);

    const gifts = GIFTS;

    // Helper to check if a gift matches for combo
    const isSameGift = (g1: any, g2Id: string, g2Name: string, g2GiftName: string) => {
        if (!g1) return false;
        // Robust gift name check
        if (String(g1.giftName || '').toLowerCase().trim() !== String(g2GiftName || '').toLowerCase().trim()) return false;

        // Robust ID check
        const id1 = String(g1.senderId || '').toLowerCase().trim();
        const id2 = String(g2Id || '').toLowerCase().trim();
        if (id1 && id2 && id1 === id2) return true;

        // Robust Name fallback
        const n1 = String(g1.senderName || '').toLowerCase().trim();
        const n2 = String(g2Name || '').toLowerCase().trim();
        if (n1 && n2 && n1 === n2) return true;

        return false;
    };

    const sendGift = async (gift: any) => {
        if (!userId) return;

        // 1. Check Balance
        if (userBalance < gift.points) {
            Alert.alert(t('Insufficient Balance'), t('You need more coins to send this gift.'));
            return;
        }

        // COMBO LOGIC: Local feedback
        const current = recentGiftRef.current;
        const finalAvatar = userAvatar || profileData?.avatar || CustomBuilder.getUserAvatar(userId);

        const foundGift = GIFTS.find(g => g.name === gift.name);
        const isBig = (foundGift?.points || 0) >= 500 || (gift.points || 0) >= 500;

        let newCount = 1;
        if (isSameGift(current, userId, userName, gift.name)) {
            newCount = (current?.count || 0) + 1;
            setRecentGift(prev => {
                const base = prev || current;
                const updated = base ? { ...base, count: newCount } : null;
                recentGiftRef.current = updated;
                return updated;
            });
            if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
            giftTimerRef.current = setTimeout(() => {
                setRecentGift(null);
                recentGiftRef.current = null;
            }, isBig ? 4500 : 3000);

            // If it's a big gift, ensure the overlay stays up
            if (isBig) {
                setShowGiftVideo(true);
                if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
                videoTimerRef.current = setTimeout(() => {
                    setShowGiftVideo(false);
                }, 4500);
            }
        } else {
            setGiftQueue(prev => {
                const last = prev[prev.length - 1];
                if (isSameGift(last, userId, userName, gift.name)) {
                    newCount = (last.count || 0) + 1;
                    return [...prev.slice(0, -1), { ...last, count: newCount }];
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

        // Optimistically update local states
        setTotalLikes(prev => prev + (gift.points || 1));
        if (streamHostIdRef.current) {
            setHostScore(prev => prev + (gift.points || 1));
        }
        setUserBalance(prev => Math.max(0, prev - gift.points));

        // SEND TO FIRESTORE & SIGNALING
        try {
            // A. Deduct Coins from Sender
            const senderRef = doc(db, 'users', userId);
            await setDoc(senderRef, {
                wallet: {
                    coins: increment(-gift.points)
                }
            }, { merge: true });

            // B. Add 70% of value to Host as Diamonds
            if (streamHostIdRef.current) {
                const hostRef = doc(db, 'users', streamHostIdRef.current);
                const hostEarnings = Math.ceil(gift.points * 0.7); // Use ceil to ensure at least 1 diamond for points > 0
                await setDoc(hostRef, {
                    wallet: {
                        diamonds: increment(hostEarnings)
                    }
                }, { merge: true });

                // Record Transaction for Host (Earnings)
                await addDoc(collection(db, 'users', streamHostIdRef.current, 'transactions'), {
                    type: 'gift_received',
                    amountDiamonds: hostEarnings,
                    giftName: gift.name,
                    senderName: userName || 'Viewer',
                    timestamp: serverTimestamp(),
                    status: 'completed'
                });
            }

            // Record Transaction for Sender (Spending)
            await addDoc(collection(db, 'users', userId, 'transactions'), {
                type: 'gift_sent',
                amountCoins: gift.points,
                giftName: gift.name,
                recipientName: 'Host',
                timestamp: serverTimestamp(),
                status: 'completed'
            });

            // Send Command via Signal (Zego)
            if (ZegoUIKit) {
                ZegoUIKit.getSignalingPlugin().sendInRoomCommandMessage(JSON.stringify({
                    type: 'gift',
                    senderId: userId,
                    senderAvatar: finalAvatar,
                    userName: userName,
                    giftName: gift.name,
                    points: gift.points,
                    icon: gift.icon,
                    combo: newCount,
                    timestamp: Date.now()
                })).catch((e: any) => console.log('Gift Signal Error:', e));
            }

            // Sync with Firestore (Backup & Reliability)
            if (channelId) {
                LiveSessionService.incrementGifts(channelId, gift.points || 1).catch(e => console.error('Gift Score Error:', e));

                if (isInPKRef.current && streamHostIdRef.current) {
                    LiveSessionService.incrementPKHostScore(channelId, gift.points || 1, opponentChannelIdRef.current || undefined).catch(e =>
                        console.error('PK Host Score Sync Error:', e)
                    );
                }

                LiveSessionService.broadcastGift(channelId, {
                    giftName: gift.name,
                    icon: gift.icon,
                    points: gift.points || 1,
                    senderName: userName || 'Viewer',
                    senderId: userId,
                    senderAvatar: finalAvatar,
                    targetName: 'Host',
                    combo: newCount
                }).catch(e => console.error('Gift Broadcast Error:', e));
            }
        } catch (error) {
            console.error('Gift Processing Error:', error);
            // Optionally revert local optimistic update on failure
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
        if (userName && userId) {
            CustomBuilder.registerUserName(userId, userName);
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
                // Only update isInPK if it's actually changing to avoid re-triggering effects
                if (session.pkState.isActive !== isInPKRef.current) {
                    setIsInPK(session.pkState.isActive);
                }

                // Always trust Firestore for scores
                if (session.pkState.hostScore !== undefined) {
                    setHostScore(session.pkState.hostScore);
                }
                if (session.pkState.guestScore !== undefined) {
                    setGuestScore(session.pkState.guestScore);
                }

                if (session.pkState.opponentName) setOpponentName(session.pkState.opponentName);
                const hName = session.pkState.hostName || session.hostName;
                if (hName) setPkHostName(hName);

                if (session.pkState.endTime) {
                    setPkEndTime(session.pkState.endTime);
                    const remaining = Math.max(0, Math.floor((session.pkState.endTime - Date.now()) / 1000));
                    setPkTimeRemaining(remaining);
                }

                if (session.pkState.opponentChannelId) {
                    setOpponentChannelId(session.pkState.opponentChannelId);
                }

                if (session.pkState.winner && !session.pkState.isActive && session.pkState.endTime) {
                    // Only show result if scores are not 0-0 and we haven't shown THIS result yet
                    const hScore = session.pkState.hostScore || 0;
                    const gScore = session.pkState.guestScore || 0;
                    const pkEndTimeVal = session.pkState.endTime || 0;

                    if ((hScore > 0 || gScore > 0) && !showPKResult && handledPKEndTimeRef.current !== pkEndTimeVal) {
                        handledPKEndTimeRef.current = pkEndTimeVal;
                        setPkWinner(session.pkState.winner);
                        setShowPKResult(true);
                        setTimeout(() => {
                            setShowPKResult(false);
                            setPkWinner(null);
                        }, 5000);
                    }
                } else if (session.pkState.isActive) {
                    // Reset the handled flag when a new PK is active
                    handledPKEndTimeRef.current = null;
                    if (showPKResult) {
                        setShowPKResult(false);
                        setPkWinner(null);
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
                const isOwnGift = session.lastGift.senderName === userName || session.lastGift.senderId === userId;
                const isAlreadyRecent = isSameGift(recentGiftRef.current, session.lastGift.senderId, session.lastGift.senderName, session.lastGift.giftName);

                if (!isOwnGift) {
                    if (isAlreadyRecent) {
                        setRecentGift(prev => {
                            const updated = prev ? { ...prev, count: session.lastGift!.combo || (prev.count || 0) + 1 } : null;
                            recentGiftRef.current = updated;
                            return updated;
                        });

                        if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
                        const isBig = (session.lastGift!.points || 0) >= 500;
                        giftTimerRef.current = setTimeout(() => {
                            setRecentGift(null);
                            recentGiftRef.current = null;
                        }, isBig ? 4500 : 3000);
                    } else {
                        setGiftQueue(prev => {
                            // Check if matches tail of queue for aggregation
                            const last = prev[prev.length - 1];
                            if (last && isSameGift(last, session.lastGift?.senderId || '', session.lastGift?.senderName || '', session.lastGift?.giftName || '')) {
                                const updatedLast = { ...last, count: session.lastGift!.combo || (last.count || 0) + 1 };
                                return [...prev.slice(0, -1), updatedLast];
                            }

                            return [...prev, {
                                senderName: session.lastGift!.senderName,
                                giftName: session.lastGift!.giftName,
                                icon: session.lastGift!.icon,
                                count: session.lastGift!.combo || 1,
                                senderId: session.lastGift!.senderId,
                                senderAvatar: session.lastGift!.senderAvatar,
                                targetName: session.lastGift!.targetName,
                                isHost: false,
                                isBig: (session.lastGift!.points || 0) >= 500
                            }];
                        });
                    }
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
            if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
            videoTimerRef.current = setTimeout(() => {
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
                    } else if (data.type === 'PK_LIKE') {
                        handleSendLike(); // Trigger heart animation for all viewers
                    } else if (data.type === 'PK_BATTLE_STOP') {
                        setIsInPK(false);
                    } else if (data.type === 'gift') {
                        // Animation and queue handling remains below...


                        const senderId = data.senderId || data.userId;
                        const isHost = data.isHost === true;
                        const senderName = data.userName || 'Viewer';
                        const giftNameStr = String(data.giftName || '');

                        const foundGift = GIFTS.find(g => g.name.toLowerCase() === giftNameStr.toLowerCase());
                        const isBig = (foundGift && (foundGift.points || 0) >= 500) || (Number(data.points || 0) >= 500);

                        // COMBO LOGIC
                        const current = recentGiftRef.current;
                        if (isSameGift(current, senderId, senderName, giftNameStr)) {
                            setRecentGift(prev => {
                                const base = prev || current;
                                const updated = base ? { ...base, count: data.combo || (base.count || 0) + 1 } : null;
                                recentGiftRef.current = updated;
                                return updated;
                            });
                            if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
                            giftTimerRef.current = setTimeout(() => {
                                setRecentGift(null);
                                recentGiftRef.current = null;
                            }, isBig ? 4500 : 3000);

                            // If it's a big gift combo, ensure the overlay stays up
                            if (isBig) {
                                setShowGiftVideo(true);
                                if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
                                videoTimerRef.current = setTimeout(() => {
                                    setShowGiftVideo(false);
                                }, 4500);
                            }
                        } else {
                            setGiftQueue(prev => {
                                const last = prev[prev.length - 1];
                                if (isSameGift(last, senderId, senderName, giftNameStr)) {
                                    return [...prev.slice(0, -1), { ...last, count: data.combo || last.count + 1 }];
                                }
                                return [...prev.slice(-10), {
                                    senderName: senderName,
                                    giftName: giftNameStr,
                                    icon: foundGift ? foundGift.icon : data.icon,
                                    count: data.combo || 1,
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
                count: countToSend
            }), [], (res: any) => { if (res?.errorCode) console.error('SendCmd Error:', res) });

            // 2. Update Firestore (Reliable, persistent)
            LiveSessionService.incrementLikes(channelId, countToSend).catch(e => console.error('Firestore Like Error:', e));

            // 3. ✅ If in PK, also increment host's PK score atomically (Supports Cross-Room Sync)
            if (isInPKRef.current && streamHostIdRef.current) {
                LiveSessionService.incrementPKHostScore(channelId, countToSend, opponentChannelIdRef.current || undefined).catch(e =>
                    console.error('PK Host Score Increment Error:', e)
                );
            }
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
                <FlameCounter count={totalLikes} onPress={handleSendLike} top={isInPK ? 210 : 120} />
            )}

            {/* PK BATTLE SCORE BAR - TikTok Premium Style */}
            {isInPK && (
                <Animatable.View
                    animation="slideInDown"
                    duration={800}
                    style={{
                        position: 'absolute',
                        top: 110, // Slightly lower to clear the top profile bar better
                        width: '100%',
                        alignItems: 'center',
                        zIndex: 2000,
                        paddingHorizontal: 8
                    }}>

                    {/* Integrated Timer & VS Badge */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20,
                        marginBottom: 3, // Pushed 8px more to the top
                    }}>
                        {/* Timer Display */}
                        {pkTimeRemaining > 0 && (
                            <View style={{
                                backgroundColor: '#121212',
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                borderRadius: 20,
                                borderWidth: 1.5,
                                borderColor: pkTimeRemaining <= 30 ? '#FF0050' : '#00F2EA',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                shadowColor: pkTimeRemaining <= 30 ? '#FF0050' : '#00F2EA',
                                shadowOpacity: 0.6,
                                shadowRadius: 12,
                                elevation: 10
                            }}>
                                <Timer size={14} color={pkTimeRemaining <= 30 ? '#FF0050' : '#FFF'} />
                                <Text style={{
                                    color: pkTimeRemaining <= 30 ? '#FF0050' : '#fff',
                                    fontSize: 14,
                                    fontWeight: '900',
                                    fontVariant: ['tabular-nums'],
                                    letterSpacing: 0.5
                                }}>
                                    {Math.floor(pkTimeRemaining / 60)}:{(pkTimeRemaining % 60).toString().padStart(2, '0')}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Progress Bar Container */}
                    <View style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 18,
                        overflow: 'hidden',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        borderWidth: 2,
                        borderColor: 'rgba(255,255,255,0.15)',
                        flexDirection: 'row',
                        shadowColor: '#000',
                        shadowOpacity: 0.5,
                        shadowRadius: 15,
                        elevation: 10,
                        position: 'relative'
                    }}>
                        {/* Host Side (Pink/Red) */}
                        <LinearGradient
                            colors={['#FF0050', '#FF4D80', '#FF0050']}
                            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                            style={{
                                flex: Math.max(hostScore, 1),
                                justifyContent: 'center',
                                paddingLeft: 18,
                                borderRadius: 18, // Added for iOS
                            }}
                        >
                            <Animatable.Text
                                animation={hostScore > 0 ? "pulse" : undefined}
                                iterationCount="infinite"
                                style={{
                                    color: '#fff',
                                    fontSize: 18,
                                    fontWeight: '900',
                                    textShadowColor: 'rgba(0,0,0,0.5)',
                                    textShadowOffset: { width: 1, height: 1 },
                                    textShadowRadius: 4
                                }}
                            >
                                {hostScore}
                            </Animatable.Text>
                            {hostScore > guestScore && (
                                <View style={{ position: 'absolute', top: 2, left: 16 }}>
                                    <Trophy size={10} color="#FFD700" fill="#FFD700" />
                                </View>
                            )}
                        </LinearGradient>

                        {/* VS Center Indicator */}
                        <View style={{
                            position: 'absolute',
                            left: `${(Math.max(hostScore, 1) / (Math.max(hostScore, 1) + Math.max(guestScore, 1))) * 100}%`,
                            top: 0,
                            bottom: 0,
                            width: 34,
                            marginLeft: -17,
                            zIndex: 15,
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <LinearGradient
                                colors={['#121212', '#262626']}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 1.5,
                                    borderColor: 'rgba(255,255,255,0.3)',
                                    shadowColor: '#000',
                                    shadowOpacity: 0.5,
                                    shadowRadius: 5
                                }}
                            >
                                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900', fontStyle: 'italic' }}>VS</Text>
                            </LinearGradient>
                        </View>

                        {/* Guest Side (Blue/Cyan) */}
                        <LinearGradient
                            colors={['#00F2EA', '#3B82F6', '#00F2EA']}
                            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                            style={{
                                flex: Math.max(guestScore, 1),
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                paddingRight: 18,
                                borderRadius: 18, // Added for iOS
                            }}
                        >
                            <Animatable.Text
                                animation={guestScore > 0 ? "pulse" : undefined}
                                iterationCount="infinite"
                                style={{
                                    color: '#fff',
                                    fontSize: 18,
                                    fontWeight: '900',
                                    textShadowColor: 'rgba(0,0,0,0.5)',
                                    textShadowOffset: { width: 1, height: 1 },
                                    textShadowRadius: 4
                                }}
                            >
                                {guestScore}
                            </Animatable.Text>
                            {guestScore > hostScore && (
                                <View style={{ position: 'absolute', top: 2, right: 16 }}>
                                    <Trophy size={10} color="#FFD700" fill="#FFD700" />
                                </View>
                            )}
                        </LinearGradient>
                    </View>

                    {/* Bottom Label Badges */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8, paddingHorizontal: 12 }}>
                        {/* Me / Host Label */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: hostScore >= guestScore ? '#FF0050' : 'rgba(0,0,0,0.4)',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: hostScore >= guestScore ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                            gap: 4
                        }}>
                            <User size={10} color="#FFF" fill="#FFF" />
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>{pkHostName?.toUpperCase() || (t('hostLabel') || 'HOST').toUpperCase()}</Text>
                        </View>

                        {/* Win Streak Indicator or Winning Message */}
                        {hostScore !== guestScore && (
                            <Animatable.View animation="fadeIn" style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, borderRadius: 20, justifyContent: 'center', height: 20 }}>
                                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
                                    {hostScore > guestScore ? (t('hostIsLeading') || 'LEADING').toUpperCase() : (t('opponentLeading') || 'BEHIND').toUpperCase()}
                                </Text>
                            </Animatable.View>
                        )}

                        {/* Opponent Label */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: guestScore >= hostScore ? '#00F2EA' : 'rgba(0,0,0,0.4)',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: guestScore >= hostScore ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                            gap: 4
                        }}>
                            <Users size={10} color="#FFF" fill="#FFF" />
                            <Text style={{ color: guestScore >= hostScore ? '#000' : '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>{opponentName?.toUpperCase() || (t('opponentLabel') || 'OPPONENT').toUpperCase()}</Text>
                        </View>
                    </View>
                </Animatable.View>
            )}

            {showPKResult && pkWinner && !isInPK && (
                <Animatable.View
                    animation="fadeIn"
                    duration={400}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3000,
                        backgroundColor: 'rgba(0,0,0,0.4)'
                    }}
                >
                    <Animatable.View
                        animation="zoomIn"
                        duration={600}
                        style={{ width: '88%', maxWidth: 360 }}
                    >
                        <LinearGradient
                            colors={pkWinner === 'Draw' ? ['#FCD34D', '#F59E0B', '#D97706'] : ['#10B981', '#059669', '#047857']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                borderRadius: 32,
                                padding: 2,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 25 },
                                shadowOpacity: 0.5,
                                shadowRadius: 35
                            }}
                        >
                            <BlurView intensity={95} tint="dark" style={{
                                borderRadius: 30,
                                paddingVertical: 45,
                                paddingHorizontal: 25,
                                alignItems: 'center',
                                overflow: 'hidden'
                            }}>
                                {/* Confetti/Trophy Animation with Glow */}
                                <Animatable.View
                                    animation="pulse"
                                    iterationCount="infinite"
                                    style={{
                                        flexDirection: 'row',
                                        marginBottom: 20,
                                        gap: 12,
                                        alignItems: 'center'
                                    }}
                                >
                                    <Text style={{ fontSize: 36 }}>🎉</Text>
                                    <View style={{
                                        shadowColor: pkWinner === 'Draw' ? '#FBBF24' : '#10B981',
                                        shadowOffset: { width: 0, height: 0 },
                                        shadowOpacity: 1,
                                        shadowRadius: 20
                                    }}>
                                        <Text style={{ fontSize: 56 }}>
                                            {pkWinner === 'Draw' ? '🤝' : '👑'}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 36 }}>🎉</Text>
                                </Animatable.View>

                                {/* Title with Letter Spacing */}
                                <Text style={{
                                    color: 'rgba(255,255,255,0.6)',
                                    fontSize: 14,
                                    fontWeight: '800',
                                    marginBottom: 15,
                                    letterSpacing: 4,
                                    textTransform: 'uppercase'
                                }}>
                                    {pkWinner === 'Draw' ? t('battleEnded') : t('pkWinnerTitle')}
                                </Text>

                                {/* Modern Winner Card */}
                                <LinearGradient
                                    colors={pkWinner === 'Draw' ? ['#FCD34D', '#F59E0B'] : ['#10B981', '#34D399']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                        width: '100%',
                                        paddingVertical: 18,
                                        borderRadius: 24,
                                        marginBottom: 25,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 10 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 15
                                    }}
                                >
                                    <Text style={{
                                        color: '#000',
                                        fontSize: 28,
                                        fontWeight: '900',
                                        textAlign: 'center',
                                        letterSpacing: 0.5
                                    }}>
                                        {pkWinner === 'Draw' ? t('itsADraw') : pkWinner}
                                    </Text>
                                </LinearGradient>

                                {/* Score Comparison Table */}
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                    paddingHorizontal: 25,
                                    paddingVertical: 18,
                                    borderRadius: 20,
                                    width: '100%',
                                    justifyContent: 'space-between',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.1)'
                                }}>
                                    <View style={{ alignItems: 'center', flex: 1 }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 6, fontWeight: '700', letterSpacing: 1 }}>
                                            {pkHostName?.toUpperCase() || t('hostLabel').toUpperCase()}
                                        </Text>
                                        <Text style={{
                                            color: '#FF0055',
                                            fontSize: 32,
                                            fontWeight: '900'
                                        }}>
                                            {hostScore}
                                        </Text>
                                    </View>

                                    <View style={{
                                        width: 1,
                                        height: 30,
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        marginHorizontal: 15
                                    }} />

                                    <View style={{ alignItems: 'center', flex: 1 }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 6, fontWeight: '700', letterSpacing: 1 }}>
                                            {opponentName?.toUpperCase()}
                                        </Text>
                                        <Text style={{
                                            color: '#3B82F6',
                                            fontSize: 32,
                                            fontWeight: '900'
                                        }}>
                                            {guestScore}
                                        </Text>
                                    </View>
                                </View>

                                {/* Message Footer */}
                                <View style={{ marginTop: 25 }}>
                                    <Text style={{
                                        color: 'rgba(255,255,255,0.4)',
                                        fontSize: 12,
                                        fontWeight: '600',
                                        fontStyle: 'italic'
                                    }}>
                                        {pkWinner === 'Draw' ? t ? t('goodMatch') : 'What a match!' : `🎉 ${t ? t('congratulations') : 'Congratulations!'} 🎉`}
                                    </Text>
                                </View>
                            </BlurView>
                        </LinearGradient>
                    </Animatable.View>
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
                            } else if (data.type === 'PK_SCORE_SYNC') {
                                // 🛡️ ONLY accept score sync from the actual host of this stream
                                // This prevents swapped scores/names from reaching the wrong audience
                                const senderID = messageData.fromUser?.userID || messageData.senderUserID;
                                if (senderID !== streamHostId) return;

                                if (data.hostScore !== undefined) setHostScore(data.hostScore);
                                if (data.guestScore !== undefined) setGuestScore(data.guestScore);
                                if (data.hostName) setPkHostName(data.hostName);
                                if (data.opponentName) setOpponentName(data.opponentName);
                                if (data.isInPK !== undefined && data.isInPK !== isInPKRef.current) {
                                    setIsInPK(data.isInPK);
                                }
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
                            // Reliability: Use isBig from state if available, fallback to point check
                            const isBig = recentGift?.isBig || (gift?.points || 0) >= 500;
                            const source = gift?.url ? { uri: gift.url } : (gift?.icon ? (typeof gift.icon === 'number' ? gift.icon : { uri: gift.icon }) : null);

                            if (source) {
                                if (isBig) {
                                    return (
                                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                            {/* Spotlight effect */}
                                            <Animatable.View
                                                animation="fadeIn"
                                                duration={500}
                                                style={{
                                                    position: 'absolute',
                                                    width: 600,
                                                    height: 600,
                                                    borderRadius: 300,
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <LinearGradient
                                                    colors={['transparent', 'rgba(60, 30, 0, 0.4)', 'rgba(60, 30, 0, 0.2)', 'rgba(251, 191, 36, 0.05)', 'transparent']}
                                                    style={{ flex: 1 }}
                                                />
                                            </Animatable.View>

                                            <Animatable.View
                                                animation="bounceIn"
                                                duration={1000}
                                                style={{ alignItems: 'center' }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                                    <Text style={{
                                                        color: '#fff',
                                                        fontSize: 38,
                                                        fontWeight: '900',
                                                        textShadowColor: 'rgba(0,0,0,0.9)',
                                                        textShadowRadius: 10,
                                                        textShadowOffset: { width: 0, height: 2 }
                                                    }}>
                                                        {recentGift?.senderName}
                                                    </Text>
                                                    {recentGift && (
                                                        <Animatable.Text
                                                            key={`big-combo-${recentGift.count}`}
                                                            animation="bounceIn"
                                                            duration={400}
                                                            style={{
                                                                color: '#FBBF24',
                                                                fontSize: 58,
                                                                fontWeight: '900',
                                                                fontStyle: 'italic',
                                                                marginLeft: 15,
                                                                textShadowColor: '#000',
                                                                textShadowOffset: { width: 4, height: 4 },
                                                                textShadowRadius: 2
                                                            }}
                                                        >
                                                            x{recentGift.count}
                                                        </Animatable.Text>
                                                    )}
                                                </View>

                                                <Animatable.View
                                                    animation="pulse"
                                                    iterationCount="infinite"
                                                    duration={2000}
                                                    direction="alternate"
                                                >
                                                    <Image
                                                        source={source}
                                                        style={{
                                                            width: 220,
                                                            height: 220,
                                                            maxWidth: 500,
                                                            maxHeight: 500
                                                        }}
                                                        resizeMode="contain"
                                                    />
                                                </Animatable.View>
                                            </Animatable.View>
                                        </View>
                                    );
                                }

                                return (
                                    <Animatable.Image
                                        animation="tada"
                                        duration={1000}
                                        source={source}
                                        style={{
                                            width: 220,
                                            height: 220,
                                        }}
                                        resizeMode="contain"
                                    />
                                );
                            }
                            return null;
                        })()}

                        {/* Sender Avatar + Combo Count - Always show below gift for big gifts */}

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
                        bottom: activeCoupon ? 385 : 290,
                        left: 15,
                        width: 280,
                        zIndex: 3000
                    }}
                >
                    <BlurView intensity={90} tint="dark" style={{
                        borderRadius: 22,
                        padding: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1.5,
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 15,
                        elevation: 10
                    }}>
                        <Image
                            source={{ uri: pinnedProduct.images?.[0] }}
                            style={{ width: 60, height: 60, borderRadius: 14, backgroundColor: '#333' }}
                        />
                        <View style={{ flex: 1, marginLeft: 12, marginRight: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                <LinearGradient
                                    colors={['#EF4444', '#B91C1C']}
                                    style={{ paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 5, marginRight: 6 }}
                                >
                                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>{(pinnedProduct.discountPrice ? t('flashSale') : t('pinned')) || (pinnedProduct.discountPrice ? 'FLASH SALE' : 'PINNED')}</Text>
                                </LinearGradient>
                            </View>
                            <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '800', fontSize: 13.5, marginBottom: 1 }}>{getLocalizedName(pinnedProduct.name)}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                    {pinnedProduct.discountPrice ? (
                                        <>
                                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textDecorationLine: 'line-through', marginRight: 5 }}>{pinnedProduct.price}</Text>
                                            <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 14 }}>{pinnedProduct.discountPrice} <Text style={{ fontSize: 9 }}>TND</Text></Text>
                                        </>
                                    ) : (
                                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>{pinnedProduct.price} <Text style={{ fontSize: 9 }}>TND</Text></Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        <View style={{ alignItems: 'center', marginLeft: 8 }}>
                            {pinTimeRemaining > 0 && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, marginBottom: 5 }}>
                                    <Clock size={8} color="rgba(255,255,255,0.8)" style={{ marginRight: 3 }} />
                                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '900' }}>
                                        {Math.floor(pinTimeRemaining / 60)}:{(pinTimeRemaining % 60).toString().padStart(2, '0')}
                                    </Text>
                                </View>
                            )}
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedProduct(pinnedProduct);
                                    setShowPurchaseModal(true);
                                }}
                                activeOpacity={0.8}
                                style={{
                                    backgroundColor: '#F59E0B',
                                    paddingHorizontal: 12,
                                    paddingVertical: 7,
                                    borderRadius: 10,
                                    minWidth: 70,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    shadowColor: '#F59E0B',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 5
                                }}
                            >
                                <Text style={{ color: '#000', fontWeight: '900', fontSize: 10.5, letterSpacing: 0.3 }}>{(t('buy') || 'BUY').toUpperCase()}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => setPinnedProduct(null)}
                            style={{
                                position: 'absolute',
                                top: 5,
                                right: 5,
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                width: 20,
                                height: 20,
                                borderRadius: 10,
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
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}
                    activeOpacity={1}
                    onPress={() => setShowProductSheet(false)}
                >
                    <BlurView intensity={80} tint="dark" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingTop: 20, paddingHorizontal: 20, paddingBottom: 30, overflow: 'hidden', backgroundColor: 'rgba(18, 18, 24, 0.95)' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 }}>{t('featuredProducts') || 'Featured Products'}</Text>
                            <TouchableOpacity onPress={() => setShowProductSheet(false)} style={{ padding: 4 }}>
                                <X size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {featuredProducts.length === 0 ? (
                                <View style={{ alignItems: 'center', padding: 50 }}>
                                    <ShoppingBag size={48} color="#555" />
                                    <Text style={{ color: '#888', marginTop: 12, fontSize: 14 }}>{t('noProductsFeatured') || 'No products featured yet.'}</Text>
                                </View>
                            ) : (
                                featuredProducts.map(p => (
                                    <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 30, 40, 0.8)', borderRadius: 12, padding: 10, marginBottom: 10 }}>
                                        <Image source={{ uri: p.images?.[0] }} style={{ width: 70, height: 70, borderRadius: 10, backgroundColor: '#333' }} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }} numberOfLines={2}>{getLocalizedName(p.name)}</Text>
                                            {p.discountPrice ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                                                    <Text style={{ color: '#888', fontSize: 13, textDecorationLine: 'line-through', marginRight: 6 }}>{p.price} TND</Text>
                                                    <Text style={{ color: '#F59E0B', fontSize: 16, fontWeight: '800' }}>{p.discountPrice} TND</Text>
                                                </View>
                                            ) : (
                                                <Text style={{ color: '#F59E0B', fontSize: 16, marginTop: 3, fontWeight: '800' }}>{p.price} TND</Text>
                                            )}
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedProduct(p);
                                                setShowProductSheet(false);
                                                setShowPurchaseModal(true);
                                            }}
                                            style={{
                                                backgroundColor: '#3B82F6',
                                                paddingHorizontal: 18,
                                                paddingVertical: 10,
                                                borderRadius: 10,
                                                minWidth: 65,
                                                alignItems: 'center',
                                                shadowColor: '#3B82F6',
                                                shadowOffset: { width: 0, height: 3 },
                                                shadowOpacity: 0.3,
                                                shadowRadius: 6,
                                                elevation: 4
                                            }}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{t('buy') || 'Buy'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </BlurView>
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
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
                >
                    <BlurView intensity={80} tint="dark" style={{ width: '100%', maxWidth: 420, borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(18, 18, 24, 0.95)' }}>
                        <View style={{ padding: 24 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 }}>{t('completePurchase') || 'Complete Purchase'}</Text>
                                <TouchableOpacity onPress={() => setShowPurchaseModal(false)} style={{ padding: 4 }}>
                                    <X size={22} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {selectedProduct && (
                                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: Dimensions.get('window').height * 0.65 }}>
                                    {/* Product Info */}
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, backgroundColor: 'rgba(42, 42, 53, 0.6)', padding: 12, borderRadius: 16 }}>
                                        <Image source={{ uri: selectedProduct.images?.[0] }} style={{ width: 90, height: 90, borderRadius: 14, backgroundColor: '#333' }} />
                                        <View style={{ marginLeft: 14, flex: 1 }}>
                                            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17, marginBottom: 6 }} numberOfLines={2}>{getLocalizedName(selectedProduct.name)}</Text>

                                            {/* Price Section with Coupon logic */}
                                            {(() => {
                                                // Use discount price if available, otherwise use regular price
                                                const basePrice = selectedProduct.discountPrice || selectedProduct.price;
                                                let finalPrice = basePrice;
                                                const isActiveCoupon = activeCoupon && couponInput.trim().toUpperCase() === activeCoupon.code.toUpperCase();

                                                if (isActiveCoupon) {
                                                    if (activeCoupon.type === 'percentage') {
                                                        finalPrice = basePrice * (1 - activeCoupon.discount / 100);
                                                    } else {
                                                        finalPrice = Math.max(0, basePrice - activeCoupon.discount);
                                                    }
                                                }

                                                return (
                                                    <View>
                                                        {/* Show original price if product has discount */}
                                                        {selectedProduct.discountPrice && !isActiveCoupon && (
                                                            <Text style={{ color: '#888', fontSize: 14, textDecorationLine: 'line-through', marginBottom: 4 }}>{selectedProduct.price} TND</Text>
                                                        )}

                                                        {isActiveCoupon ? (
                                                            <View>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                    <Text style={{ color: '#888', fontSize: 15, textDecorationLine: 'line-through', marginRight: 8 }}>{basePrice} TND</Text>
                                                                    <Text style={{ color: '#F59E0B', fontSize: 20, fontWeight: '900' }}>{finalPrice.toFixed(2)} TND</Text>
                                                                </View>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                                    <Ticket size={12} color="#10B981" />
                                                                    <Text style={{ color: '#10B981', fontSize: 11, fontWeight: 'bold', marginLeft: 4 }}>
                                                                        {t('couponApplied') || 'Coupon Applied!'}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        ) : (
                                                            <Text style={{ color: '#F59E0B', fontSize: 20, fontWeight: '900' }}>{basePrice} TND</Text>
                                                        )}
                                                    </View>
                                                );
                                            })()}
                                        </View>
                                    </View>

                                    {/* Color Selector with Real Colors */}
                                    {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                                        <View style={{ marginBottom: 20 }}>
                                            <Text style={{ color: '#ccc', marginBottom: 10, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('color') || 'COULEUR'}</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                                {selectedProduct.colors.map((c: string) => {
                                                    const colorHex = c.startsWith('#') ? c : COLOR_MAP[c.toUpperCase()] || '#CCCCCC';
                                                    const isSelected = selectedColor === c;
                                                    return (
                                                        <TouchableOpacity
                                                            key={c}
                                                            onPress={() => setSelectedColor(c)}
                                                            style={{
                                                                padding: 3,
                                                                borderRadius: 24,
                                                                borderWidth: 2.5,
                                                                borderColor: isSelected ? '#F59E0B' : 'transparent',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <View style={{
                                                                width: 40,
                                                                height: 40,
                                                                borderRadius: 20,
                                                                backgroundColor: colorHex,
                                                                borderWidth: 1.5,
                                                                borderColor: 'rgba(255,255,255,0.3)'
                                                            }} />
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    )}

                                    {/* Size Selector */}
                                    {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                                        <View style={{ marginBottom: 20 }}>
                                            <Text style={{ color: '#ccc', marginBottom: 10, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('size') || 'TAILLE'}</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                                {selectedProduct.sizes.map((s: string) => {
                                                    const isSelected = selectedSize === s;
                                                    return (
                                                        <TouchableOpacity
                                                            key={s}
                                                            onPress={() => setSelectedSize(s)}
                                                            style={{
                                                                minWidth: 52,
                                                                height: 52,
                                                                paddingHorizontal: 12,
                                                                borderRadius: 12,
                                                                backgroundColor: isSelected ? '#F59E0B' : 'rgba(42, 42, 53, 0.8)',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                borderWidth: 2,
                                                                borderColor: isSelected ? '#fff' : 'rgba(255,255,255,0.1)'
                                                            }}
                                                        >
                                                            <Text style={{ color: isSelected ? '#000' : '#fff', fontWeight: '900', fontSize: 15 }}>{s}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    )}

                                    {/* Inputs */}
                                    <View style={{ marginBottom: 14 }}>
                                        <Text style={{ color: '#ccc', marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('fullName') || 'NOM COMPLET'}</Text>
                                        <TextInput
                                            placeholder={t('fullName') || 'Alcatraz Dev'}
                                            placeholderTextColor="#555"
                                            value={customerName}
                                            onChangeText={setCustomerName}
                                            style={{ backgroundColor: 'rgba(18, 18, 24, 0.9)', color: '#fff', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#2A2A35', fontSize: 15 }}
                                        />
                                    </View>

                                    <View style={{ marginBottom: 14 }}>
                                        <Text style={{ color: '#ccc', marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('contactNumber') || 'NUMÉRO DE CONTACT'}</Text>
                                        <TextInput
                                            placeholder={t('contactNumber') || '20037875'}
                                            placeholderTextColor="#555"
                                            value={phoneNumber}
                                            onChangeText={setPhoneNumber}
                                            keyboardType="phone-pad"
                                            style={{ backgroundColor: 'rgba(18, 18, 24, 0.9)', color: '#fff', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#2A2A35', fontSize: 15 }}
                                        />
                                    </View>

                                    <View style={{ marginBottom: 14 }}>
                                        <Text style={{ color: '#ccc', marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('shippingAddress') || 'ADRESSE DE LIVRAISON'}</Text>
                                        <TextInput
                                            placeholder={t('deliveryAddress') || "Chatt mariem, sousse"}
                                            placeholderTextColor="#555"
                                            value={address}
                                            onChangeText={setAddress}
                                            multiline
                                            numberOfLines={2}
                                            style={{ backgroundColor: 'rgba(18, 18, 24, 0.9)', color: '#fff', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#2A2A35', fontSize: 15, minHeight: 70, textAlignVertical: 'top' }}
                                        />
                                    </View>

                                    {/* COUPON INPUT */}
                                    <View style={{ marginBottom: 24 }}>
                                        <Text style={{ color: '#ccc', marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('couponCode') || 'CODE PROMO'}</Text>
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <TextInput
                                                placeholder={t('enterCouponCode') || "SAVE20"}
                                                placeholderTextColor="#555"
                                                value={couponInput}
                                                onChangeText={setCouponInput}
                                                autoCapitalize="characters"
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: 'rgba(18, 18, 24, 0.9)',
                                                    color: '#F59E0B',
                                                    fontWeight: '900',
                                                    padding: 14,
                                                    borderRadius: 12,
                                                    borderWidth: 2,
                                                    borderColor: activeCoupon && couponInput.trim().toUpperCase() === activeCoupon.code ? '#F59E0B' : '#2A2A35',
                                                    fontSize: 15
                                                }}
                                            />
                                        </View>
                                    </View>

                                    {/* Confirm Button */}
                                    <TouchableOpacity
                                        onPress={handlePurchase}
                                        style={{
                                            backgroundColor: '#EF4444',
                                            paddingVertical: 16,
                                            paddingHorizontal: 16,
                                            borderRadius: 14,
                                            alignItems: 'center',
                                            shadowColor: '#EF4444',
                                            shadowOffset: { width: 0, height: 6 },
                                            shadowOpacity: 0.4,
                                            shadowRadius: 12,
                                            elevation: 8
                                        }}
                                    >
                                        {(() => {
                                            const basePrice = selectedProduct.discountPrice || selectedProduct.price;
                                            let finalPrice = basePrice;
                                            if (activeCoupon && couponInput.trim().toUpperCase() === activeCoupon.code.toUpperCase()) {
                                                if (activeCoupon.type === 'percentage') {
                                                    finalPrice = basePrice * (1 - activeCoupon.discount / 100);
                                                } else {
                                                    finalPrice = Math.max(0, basePrice - activeCoupon.discount);
                                                }
                                            }
                                            return (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                                                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.3 }}>
                                                        {t('confirmOrder') || 'CONFIRMER LA COMMANDE'}
                                                    </Text>
                                                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, marginLeft: 6 }}>
                                                        • {finalPrice.toFixed(2)} TND
                                                    </Text>
                                                </View>
                                            );
                                        })()}
                                    </TouchableOpacity>
                                </ScrollView>
                            )}
                        </View>
                    </BlurView>
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
                                            <Coins size={8} color={isSelected ? '#fff' : '#FFD700'} style={{ marginLeft: 2 }} fill={isSelected ? '#fff' : '#FFD700'} />
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
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{clampedBalance.toLocaleString()}</Text>
                                    <Coins size={12} color="#F59E0B" style={{ marginLeft: 4 }} fill="#F59E0B" />
                                    <TouchableOpacity
                                        style={{ marginLeft: 8 }}
                                        onPress={() => {
                                            setShowGifts(false);
                                            // Add a small delay to allow the gift modal to close first (fixes iOS race condition)
                                            setTimeout(() => {
                                                setShowRechargeModal(true);
                                            }, 500);
                                        }}
                                    >
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
            {recentGift && !recentGift.isBig && (
                <View style={{
                    position: 'absolute',
                    top: isInPK ? 220 : 180, // Moved up slightly to avoid overlapping
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
                        {(() => {
                            const giftObj = GIFTS.find(g => g.name === recentGift.giftName);
                            if (!giftObj) return null;
                            const points = giftObj?.points || 0;
                            const isGradient = points >= 100 && points < 500;

                            const content = (
                                <>
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
                                            source={
                                                recentGift.senderAvatar
                                                    ? (typeof recentGift.senderAvatar === 'number' ? recentGift.senderAvatar : { uri: recentGift.senderAvatar })
                                                    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(recentGift.senderName || 'User')}&background=random` }
                                            }
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="cover"
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
                                </>
                            );

                            return isGradient ? (
                                <LinearGradient
                                    colors={['#FF0066', '#A855F7']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                        borderRadius: 40,
                                        paddingVertical: 4,
                                        paddingHorizontal: 6,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                        minWidth: 250,
                                        overflow: 'hidden',
                                    }}
                                >
                                    {content}
                                </LinearGradient>
                            ) : (
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
                                    {content}
                                </BlurView>
                            );
                        })()}

                        {/* Combo Count UI */}
                        {
                            recentGift.count > 1 && (
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
                            )
                        }
                    </Animatable.View >
                </View >
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
                        width: 37,
                        height: 37,
                        borderRadius: 20,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.2)',
                        overflow: 'hidden'
                    }}
                >
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                    <Share2 size={16} color="#fff" />
                </TouchableOpacity>

                {/* Like Button - TikTok Style Glass/Pink */}
                <TouchableOpacity
                    onPress={handleSendLike}
                    activeOpacity={0.7}
                    style={{
                        width: 37,
                        height: 37,
                        borderRadius: 20,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.2)',
                        overflow: 'hidden'
                    }}
                >
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                    <Heart size={16} color="#FF0066" fill="#FF0066" />
                </TouchableOpacity>

                {/* PINK GIFT BUTTON - Prominent */}
                <TouchableOpacity
                    onPress={() => setShowGifts(true)}
                    activeOpacity={0.7}
                    style={{
                        width: 37,
                        height: 37,
                        borderRadius: 20,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.2)',
                        overflow: 'hidden'
                    }}
                >
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                    <GiftIcon size={16} color="#fff" strokeWidth={2} />
                </TouchableOpacity>

                {/* AMBER SHOPPING BAG BUTTON */}
                {featuredProducts.length > 0 && (
                    <View style={{ width: 37, height: 37 }}>
                        <TouchableOpacity
                            onPress={() => setShowProductSheet(true)}
                            activeOpacity={0.7}
                            style={{
                                width: 37,
                                height: 37,
                                borderRadius: 20,
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.2)',
                                overflow: 'hidden'
                            }}
                        >
                            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                            <ShoppingBag size={16} color="#fff" />
                        </TouchableOpacity>
                        <View style={{
                            position: 'absolute',
                            top: -2,
                            right: -2,
                            backgroundColor: '#EF4444',
                            borderWidth: 1.5,
                            borderColor: '#fff',
                            minWidth: 18,
                            height: 18,
                            borderRadius: 9,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 4,
                            zIndex: 10
                        }}>
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{featuredProducts.length}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* LIVE COUPON OVERLAY - Horizontal Ticket Style */}
            {
                activeCoupon && (
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
                )
            }
            {/* Recharge Modal */}
            <RechargeModal
                isVisible={showRechargeModal}
                onClose={() => setShowRechargeModal(false)}
                userId={userId}
                userName={userName}
                language={props.language || 'fr'}
            />
        </View >
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
