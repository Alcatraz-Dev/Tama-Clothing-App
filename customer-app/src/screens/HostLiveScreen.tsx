import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Alert, Text, TouchableOpacity, Image, ActionSheetIOS, Platform, findNodeHandle, Modal, ScrollView, TextInput, ActivityIndicator, Animated, Easing, AppState, KeyboardAvoidingView, Dimensions, Clipboard, FlatList, Share } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift as GiftIcon, Swords, Sparkles, MoreHorizontal, X, Share2, Flame, Radio, Ticket, Clock, ShoppingBag, PlusCircle, Send, Timer, Trophy, User, Users, ChessKingIcon } from 'lucide-react-native';
import Constants from 'expo-constants';
import { CustomBuilder } from '../utils/CustomBuilder';
import { LiveSessionService } from '../services/LiveSessionService';
import { FlameCounter } from '../components/FlameCounter';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { BlurView } from 'expo-blur';
import { db } from '../api/firebase';
import { GIFTS, Gift } from '../config/gifts';

// ✅ Expo Go detection
const isExpoGo = Constants.executionEnvironment === "storeClient";


// ✅ Conditionally import ZEGO and ZIM
let ZegoUIKitPrebuiltLiveStreaming: any;
let HOST_DEFAULT_CONFIG: any;
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
        ZegoMediaPlayerResource = ZegoModule.ZegoMediaPlayerResource;
        ZegoUIKitPrebuiltLiveStreaming = ZegoModule.default;
        HOST_DEFAULT_CONFIG = ZegoModule.HOST_DEFAULT_CONFIG;
        ZegoMenuBarButtonName = ZegoModule.ZegoMenuBarButtonName;
        ZegoLiveStreamingRole = ZegoModule.ZegoLiveStreamingRole;
        ZIM = require('zego-zim-react-native');
        ZegoUIKit = require('@zegocloud/zego-uikit-rn').default;

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
    brandId?: string;
    collabId?: string;
    hostAvatar?: string;
    onClose: () => void;
    t?: (key: string) => string;
    language?: 'fr' | 'ar';
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        zIndex: 0,
    },
});

export default function HostLiveScreen(props: Props) {
    const t = typeof props.t === 'function' ? props.t : (key: string) => key;
    const { channelId, userId, userName, brandId, collabId, hostAvatar, onClose, language } = props;

    const getLocalizedName = (name: any) => {
        if (typeof name === 'string') return name;
        if (!name) return '';
        return name[language === 'ar' ? 'ar-tn' : 'fr'] || name.fr || name.en || name.ar || Object.values(name)[0] || '';
    };
    const prebuiltRef = useRef<any>(null);
    const mediaViewRef = useRef<any>(null);
    const mediaPlayerRef = useRef<any>(null);
    const [blockedApplying, setBlockedApplying] = useState<string[]>([]);
    const [showGiftVideo, setShowGiftVideo] = useState(false);
    // Gift Queue System
    const [giftQueue, setGiftQueue] = React.useState<{ senderName: string, targetName?: string, giftName: string, icon: string, isHost?: boolean, count: number, senderId?: string, senderAvatar?: string, isBig?: boolean }[]>([]);
    const [recentGift, setRecentGift] = React.useState<{ senderName: string, targetName?: string, giftName: string, icon: string, isHost?: boolean, count: number, senderId?: string, senderAvatar?: string, isBig?: boolean } | null>(null);
    const recentGiftRef = useRef<any>(null);
    const giftTimerRef = useRef<any>(null);
    const videoTimerRef = useRef<any>(null);
    const [showGifts, setShowGifts] = useState(false);
    const [roomUsers, setRoomUsers] = useState<any[]>([]);
    const [selectedTargetUser, setSelectedTargetUser] = useState<any>(null);
    const [totalLikes, setTotalLikes] = useState(0);
    const [floatingHearts, setFloatingHearts] = useState<{ id: number, x: number }[]>([]);

    // PK Battle State
    const [isInPK, setIsInPK] = useState(false);
    const isInPKRef = useRef(false);
    const [hostScore, setHostScore] = useState(0);
    const hostScoreRef = useRef(0);
    const [guestScore, setGuestScore] = useState(0);
    const guestScoreRef = useRef(0);
    const [opponentName, setOpponentName] = useState('Opponent');
    const opponentNameRef = useRef('Opponent');
    const opponentChannelIdRef = useRef<string | null>(null);
    const [pkBattleId, setPkBattleId] = useState<string | null>(null);
    const [showPKInviteModal, setShowPKInviteModal] = useState(false);
    const [targetHostId, setTargetHostId] = useState('');
    const [liveSessions, setLiveSessions] = useState<any[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [opponentChannelId, setOpponentChannelId] = useState<string | null>(null);

    // PK Timer State
    const [pkDuration, setPkDuration] = useState(180); // Default 3 minutes in seconds
    const [isLiveStarted, setIsLiveStarted] = useState(false); // ✅ Track if live has started to show controls
    const [pkTimeRemaining, setPkTimeRemaining] = useState(0);
    const [pkEndTime, setPkEndTime] = useState<number | null>(null);
    const [pkWinner, setPkWinner] = useState<string | null>(null);
    // Coupon State
    const [showCouponModal, setShowCouponModal] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState('');
    const [couponExpiry, setCouponExpiry] = useState('5'); // Default 5 minutes
    const [activeCoupon, setActiveCoupon] = useState<any>(null);
    const [couponTimeRemaining, setCouponTimeRemaining] = useState(0);
    const couponTimerRef = useRef<any>(null);
    const [showPKResult, setShowPKResult] = useState(false);

    // ✅ Sync PK state periodically for late joiners
    // ✅ Keep refs in sync for signaling listeners
    const totalLikesRef = useRef(0);
    const pkStartLikesRef = useRef(0); // Baseline for PK Score
    const lastGiftTimestampRef = useRef(0); // Track last processed gift to avoid duplicates
    const sessionEndedRef = useRef(false); // Track if session has been ended to prevent double-calling
    const peakViewersRef = useRef(0); // Track peak viewers for analytics
    const lastPurchaseTimeRef = useRef(0);
    const [purchaseNotification, setPurchaseNotification] = useState<{ user: string, product: string } | null>(null);

    // Pinned Product Timer State
    const [pinnedProduct, setPinnedProduct] = useState<any | null>(null);
    const [pinTimeRemaining, setPinTimeRemaining] = useState(0);
    const [pinEndTime, setPinEndTime] = useState<number | null>(null);
    const [pinDuration, setPinDuration] = useState('5'); // Default 5 minutes
    const pinTimerRef = useRef<any>(null);
    const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
    const [giftCategory, setGiftCategory] = useState<'POPULAIRE' | 'SPÉCIAL' | 'LUXE'>('POPULAIRE');
    const [userBalance, setUserBalance] = useState(0);


    // Sync Ref for recentGift
    useEffect(() => {
        recentGiftRef.current = recentGift;
    }, [recentGift]);

    // Helper to check if a gift matches for combo (moved up for scope)
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

    // Unified Gift Handler to manage counters and queuing centrally
    const handleNewGift = (data: { senderName: string, senderId?: string, giftName: string, points: number, icon: any, senderAvatar?: string, targetName?: string, isHost: boolean, combo?: number }) => {
        const { senderName, senderId, giftName, points, icon, senderAvatar, targetName, isHost, combo } = data;
        const isBig = points >= 500;
        const current = recentGiftRef.current;

        // 1. Check if it matches current active gift (Theater overlay or Pill)
        if (isSameGift(current, senderId || '', senderName, giftName)) {
            setRecentGift(prev => {
                const base = prev || current;
                const updated = base ? { ...base, count: combo || (base.count || 0) + 1 } : null;
                recentGiftRef.current = updated;
                return updated;
            });

            if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
            giftTimerRef.current = setTimeout(() => {
                setRecentGift(null);
                recentGiftRef.current = null;
            }, isBig ? 4500 : 3000);

            if (isBig) {
                setShowGiftVideo(true);
                if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
                videoTimerRef.current = setTimeout(() => {
                    setShowGiftVideo(false);
                }, 4500);
            }
            return;
        }

        // 2. Check if it matches the tail of the queue
        setGiftQueue(prev => {
            const last = prev[prev.length - 1];
            if (isSameGift(last, senderId || '', senderName, giftName)) {
                const updatedLast = { ...last, count: combo || (last.count || 0) + 1 };
                return [...prev.slice(0, -1), updatedLast];
            }

            // 3. Otherwise add new entry to queue
            const newGiftEntry = {
                senderName,
                senderId,
                giftName,
                icon,
                count: combo || 1,
                senderAvatar,
                targetName,
                isHost,
                isBig
            };

            return [...prev.slice(-10), newGiftEntry];
        });
    };



    // Capture baseline likes when PK Starts
    useEffect(() => {
        if (isInPK) {
            pkStartLikesRef.current = totalLikes;
            console.log('🏁 PK Started. Baseline Likes:', totalLikes);
            // setHostScore(0); // ❌ Removed: Reset only on new invite
            // setGuestScore(0); // ❌ Removed: Reset only on new invite
        }
    }, [isInPK]);

    // Cross-Room Sync: Listen for Opponent Score Updates
    useEffect(() => {
        if (!opponentChannelId) return;
        console.log('🔗 Listening for Opponent Score on channel:', opponentChannelId);
        const unsubscribe = LiveSessionService.subscribeToSession(opponentChannelId, (session) => {
            if (session && session.pkScore !== undefined) {
                // Determine if 'pkScore' is strictly the opponent's score? 
                // Since this is the session doc of the opponent, 'session.pkScore' IS their host score.
                setGuestScore(session.pkScore);
            }
        });
        return () => unsubscribe();
    }, [opponentChannelId]);

    // Live Commerce Logic
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [pinnedProductId, setPinnedProductId] = useState<string | null>(null);
    const [showProductModal, setShowProductModal] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                if (brandId) {
                    const q = query(collection(db, 'products'), where('brandId', '==', brandId));
                    const snap = await getDocs(q);
                    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setProducts(list);
                }
            } catch (e) {
                console.error('Error fetching live products:', e);
            }
        };
        fetchProducts();
    }, [brandId]);

    const toggleProductSelection = (id: string) => {
        setSelectedProductIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleUpdateBag = async () => {
        await LiveSessionService.updateFeaturedProducts(channelId, selectedProductIds);
        Alert.alert('Success', 'Shopping bag updated!');
        setShowProductModal(false);
    };

    const handlePinProduct = async (id: string) => {
        const duration = parseInt(pinDuration);
        setPinnedProductId(id);
        setPinEndTime(duration ? Date.now() + (duration * 60 * 1000) : null);

        await LiveSessionService.pinProduct(channelId, id, duration);

        // Also ensure it's in the bag if pinned
        if (!selectedProductIds.includes(id)) {
            const newIds = [...selectedProductIds, id];
            setSelectedProductIds(newIds);
            await LiveSessionService.updateFeaturedProducts(channelId, newIds);
        }

        // Fetch full product object for local UI immediately
        const prod = products.find(p => p.id === id);
        if (prod) setPinnedProduct(prod);

        Alert.alert(t('pinned') || 'Pinned', t('productPinned') || 'Product is now featured directly on screen!');
    };

    // Pin Timer Countdown for Host
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
                // Timer ended - unpin product automatically
                handleUnpin();
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [pinEndTime]);

    const handleUnpin = async () => {
        setPinnedProductId(null);
        setPinnedProduct(null);
        setPinEndTime(null);
        await LiveSessionService.unpinProduct(channelId);
    };



    // ✅ Reliable Sync: Listen to my OWN session for Total Likes (written by Audience via Firestore)
    useEffect(() => {
        if (!channelId) return;
        const unsubscribe = LiveSessionService.subscribeToSession(channelId, (session) => {
            if (session) {
                // ✅ Sync local state if already live (re-entry)
                if (session.status === 'live') {
                    setIsLiveStarted(true);
                }

                if (session.totalLikes !== undefined) {
                    setTotalLikes(session.totalLikes);
                }

                // Sync PK State for Host too (to hear about opponent points)
                if (session.pkState) {
                    // Only update isInPK if it's actually changing to avoid re-triggering effects
                    if (session.pkState.isActive !== isInPKRef.current) {
                        setIsInPK(session.pkState.isActive);
                    }

                    // ALWAYS update guestScore from Firestore (opponent's score)
                    if (session.pkState.guestScore !== undefined) {
                        setGuestScore(session.pkState.guestScore);
                    }

                    // For hostScore, trust Firestore as the source of truth
                    // This ensures consistency across all screens
                    if (session.pkState.hostScore !== undefined) {
                        console.log('🔄 Syncing hostScore from Firestore:', session.pkState.hostScore, 'Current:', hostScoreRef.current);
                        setHostScore(session.pkState.hostScore);
                    }

                    if (session.pkState.hostName) {
                        // For host, we don't usually need to sync our own name, but we can update if needed
                    }
                    if (session.pkState.opponentName) setOpponentName(session.pkState.opponentName);
                    if (session.pkState.endTime && !pkEndTime) {
                        setPkEndTime(session.pkState.endTime);
                    }
                    if (session.pkState.opponentChannelId && !opponentChannelId) {
                        setOpponentChannelId(session.pkState.opponentChannelId);
                    }

                    // Sync Winner if battle ended on another device/room
                    if (session.pkState.winner && !session.pkState.isActive) {
                        if (!showPKResult && session.pkState.winner !== pkWinner) {
                            setPkWinner(session.pkState.winner);
                            setShowPKResult(true);
                            setTimeout(() => {
                                setShowPKResult(false);
                                setPkWinner(null);
                            }, 5000);
                        }
                    }
                    // Hide result if a new PK starts
                    if (session.pkState.isActive && showPKResult) {
                        setShowPKResult(false);
                        setPkWinner(null);
                    }
                }

                if (session.lastPurchase && session.lastPurchase.timestamp > lastPurchaseTimeRef.current) {
                    lastPurchaseTimeRef.current = session.lastPurchase.timestamp;
                    setPurchaseNotification({
                        user: session.lastPurchase.purchaserName,
                        product: getLocalizedName(session.lastPurchase.productName)
                    });
                    setTimeout(() => setPurchaseNotification(null), 5000);
                }

                // Sync Pinned Product
                if (session.pinnedProduct) {
                    setPinnedProductId(session.pinnedProduct.productId);
                    setPinEndTime(session.pinnedProduct.endTime || null);

                    if (!pinnedProduct || pinnedProduct.id !== session.pinnedProduct.productId) {
                        getDoc(doc(db, 'products', session.pinnedProduct.productId)).then((snap: any) => {
                            if (snap.exists()) setPinnedProduct({ id: snap.id, ...snap.data() });
                        });
                    }
                } else {
                    setPinnedProductId(null);
                    setPinnedProduct(null);
                    setPinEndTime(null);
                }

                if (session.lastGift && session.lastGift.timestamp > lastGiftTimestampRef.current) {
                    lastGiftTimestampRef.current = session.lastGift.timestamp;

                    // Only process if it's NOT from the host
                    const isOwnGift = session.lastGift.senderId === userId || session.lastGift.senderName === userName;
                    if (!isOwnGift) {
                        handleNewGift({
                            senderName: session.lastGift!.senderName,
                            senderId: session.lastGift!.senderId,
                            giftName: session.lastGift!.giftName,
                            points: session.lastGift!.points || 0,
                            icon: session.lastGift!.icon,
                            senderAvatar: session.lastGift!.senderAvatar,
                            targetName: session.lastGift!.targetName,
                            isHost: false,
                            combo: session.lastGift!.combo // ✅ Pass Combo
                        });
                    }
                }

                // ✅ Track Peak Viewers
                if (session.viewCount && session.viewCount > peakViewersRef.current) {
                    peakViewersRef.current = session.viewCount;
                    LiveSessionService.updatePeakViewers(channelId, session.viewCount).catch(e =>
                        console.error('Peak Viewers Update Error:', e)
                    );
                }
            }
        });
        return () => unsubscribe();
    }, [channelId]);

    useEffect(() => { isInPKRef.current = isInPK; }, [isInPK]);
    useEffect(() => { opponentNameRef.current = opponentName; }, [opponentName]);
    useEffect(() => { opponentChannelIdRef.current = opponentChannelId; }, [opponentChannelId]);
    useEffect(() => { hostScoreRef.current = hostScore; }, [hostScore]);
    useEffect(() => { guestScoreRef.current = guestScore; }, [guestScore]);
    useEffect(() => { totalLikesRef.current = totalLikes; }, [totalLikes]);

    // Periodically broadcast state to keep audience in sync (Zego backup)
    useEffect(() => {
        if (!ZegoUIKit || !isLiveStarted) return;
        const interval = setInterval(() => {
            ZegoUIKit.sendInRoomCommand(JSON.stringify({
                type: 'PK_SCORE_SYNC',
                hostScore: hostScoreRef.current,
                guestScore: guestScoreRef.current,
                totalLikes: totalLikesRef.current,
                hostId: userId,
                hostName: userName,
                opponentName: opponentName,
                isInPK: isInPKRef.current
            }), [], () => { });
        }, 3000);
        return () => clearInterval(interval);
    }, [userId, userName, opponentName]);

    // ✅ Persist PK State to Firestore for Audience Sync (WITHOUT scores - those use atomic increments)
    useEffect(() => {
        if (channelId) {
            const pkState: any = {
                isActive: isInPK,
                // ❌ DO NOT update scores here - they use atomic increments
                opponentName: opponentName,
                hostName: userName
            };

            // Only include opponentChannelId if it exists (Firestore doesn't accept undefined)
            if (opponentChannelId) {
                pkState.opponentChannelId = opponentChannelId;
            }

            // Include timer information if PK is active
            if (isInPK && pkEndTime) {
                pkState.duration = pkDuration;
                pkState.endTime = pkEndTime;
                pkState.startTime = pkEndTime - (pkDuration * 1000);
            }

            // Explicitly handle winner field
            pkState.winner = isInPK ? null : (pkWinner || null);

            // If we have no winner and no active PK, wipe most metadata to prevent stale state syncs
            if (!isInPK && !pkWinner) {
                pkState.endTime = null;
                pkState.duration = null;
            }

            console.log('📦 Updating Firestore PK State (metadata only):', {
                channelId,
                isInPK,
                opponentChannelId
            });
            LiveSessionService.updatePKState(channelId, pkState).catch(e => console.error('PK State Sync Error:', e));

            // ✅ Also update opponent's session if available (Cross-Room Sync)
            if (opponentChannelId) {
                const opponentPkState = {
                    ...pkState,
                    // Swap names for opponent's view
                    opponentName: userName,
                    hostName: opponentName,
                    opponentChannelId: channelId
                };
                LiveSessionService.updatePKState(opponentChannelId, opponentPkState).catch(e =>
                    console.error('Opponent PK State Sync Error:', e)
                );
            }
        }
    }, [isInPK, opponentName, opponentChannelId, channelId, pkDuration, pkEndTime, pkWinner, userName]);

    // Force Sync on PK Start
    useEffect(() => {
        if (isInPK && ZegoUIKit && isLiveStarted) {
            console.log('⚡ Force Syncing PK State Start');
            ZegoUIKit.sendInRoomCommand(JSON.stringify({
                type: 'PK_SCORE_SYNC',
                hostScore: hostScoreRef.current,
                guestScore: guestScoreRef.current,
                totalLikes: totalLikesRef.current,
                hostId: userId,
                hostName: userName,
                opponentName: opponentName,
                isInPK: true
            }), [], () => { });
        }
    }, [isInPK]);

    // PK Timer Countdown
    useEffect(() => {
        if (!isInPK || !pkEndTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((pkEndTime - now) / 1000));
            setPkTimeRemaining(remaining);

            // Timer expired - determine winner
            if (remaining === 0) {
                const winner = hostScore > guestScore ? userName :
                    guestScore > hostScore ? opponentName :
                        'Draw';

                console.log('⏰ PK Battle Ended! Winner:', winner);
                setPkWinner(winner);
                setShowPKResult(true);
                setIsInPK(false);

                // Broadcast winner to all participants
                if (channelId) {
                    const finalPkState: any = {
                        isActive: false,
                        hostScore: hostScore,
                        guestScore: guestScore,
                        opponentName: opponentName,
                        hostName: userName,
                        winner: winner
                    };

                    if (opponentChannelId) {
                        finalPkState.opponentChannelId = opponentChannelId;
                    }

                    LiveSessionService.updatePKState(channelId, finalPkState).catch(e =>
                        console.error('Winner Broadcast Error:', e)
                    );

                    // Track Win/Loss for Analytics
                    if (winner === userName) {
                        LiveSessionService.incrementPKWin(channelId).catch(e => console.error('PK Win Count Error:', e));
                    } else if (winner === opponentName) {
                        LiveSessionService.incrementPKLoss(channelId).catch(e => console.error('PK Loss Count Error:', e));
                    }
                }

                // Auto-hide result after 5 seconds
                setTimeout(() => {
                    setShowPKResult(false);
                    setPkWinner(null);
                    setPkEndTime(null);
                }, 5000);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isInPK, pkEndTime, hostScore, guestScore, userName, opponentName, channelId, opponentChannelId]);

    // ✅ Sync PK state periodically for late joiners


    const gifts = GIFTS;

    const updatePKScore = async (giftName: string) => {
        if (!isInPKRef.current) return;
        const gift = gifts.find(g => g.name === giftName);
        if (gift && gift.points) {
            const pointsToAdd = gift.points;
            console.log(`📈 PK Score Update (Gift): adding ${pointsToAdd} points for ${giftName}`);

            // ✅ Increment in Firestore atomically (like totalLikes)
            // This handles both local and cross-room sync automatically
            await LiveSessionService.incrementPKHostScore(channelId, pointsToAdd, opponentChannelId || undefined).catch(e =>
                console.error('PK Host Score Increment Error:', e)
            );

            // Broadcast for immediate feedback (optional, Firestore sync will handle it)
            if (ZegoUIKit && isLiveStarted) {
                ZegoUIKit.sendInRoomCommand(JSON.stringify({
                    type: 'PK_VOTE',
                    points: pointsToAdd,
                    hostId: userId
                }), [], () => { });
            }
        }
    };

    // ✅ Sync PK scores every 3 seconds to ensure real-time accuracy
    useEffect(() => {
        if (!isInPK || !ZegoUIKit || !isLiveStarted) return;

        const syncInterval = setInterval(() => {
            ZegoUIKit.sendInRoomCommand(JSON.stringify({
                type: 'PK_SCORE_SYNC',
                hostScore: hostScoreRef.current,
                guestScore: guestScoreRef.current,
                totalLikes: totalLikesRef.current,
                hostId: userId,
                hostName: userName,
                opponentName: opponentName,
                isInPK: true
            }), [], () => { });
        }, 3000);

        return () => clearInterval(syncInterval);
    }, [isInPK, userName, opponentName]);

    const openGiftModal = () => {
        if (ZegoUIKit) {
            // Get all participants, excluding the host themselves
            const all = ZegoUIKit.getAllUsers().filter((u: any) => u.userID !== userId);
            setRoomUsers(all);
            // Default to first user if available
            if (all.length > 0) setSelectedTargetUser(all[0]);
        }
        setShowGifts(true);
    };

    // 🎫 Coupon Logic
    const dropCoupon = async () => {
        if (!couponCode || !discountAmount) {
            Alert.alert(t('error') || 'Error', t('invalidCoupon') || 'Invalid coupon details');
            return;
        }

        const expirySecs = parseInt(couponExpiry) * 60;
        const couponData = {
            type: 'coupon_drop',
            code: couponCode.toUpperCase(),
            discount: discountAmount,
            expiryMinutes: parseInt(couponExpiry),
            endTime: Date.now() + (expirySecs * 1000),
            hostName: userName,
        };

        try {
            // 1. Update Firestore session doc
            await LiveSessionService.activateCoupon(channelId, {
                code: couponData.code,
                discount: parseInt(couponData.discount.replace(/[^0-9]/g, '')),
                type: couponData.discount.includes('%') ? 'percentage' : 'fixed',
                endTime: couponData.endTime,
                expiryMinutes: couponData.expiryMinutes
            });

            // 2. Send signaling command
            if (ZegoUIKit && isLiveStarted) {
                ZegoUIKit.sendInRoomCommand(JSON.stringify(couponData), [], () => { });
            }

            setActiveCoupon(couponData);
            setCouponTimeRemaining(expirySecs);
            setShowCouponModal(false);
            Alert.alert(t('success') || 'Success', t('couponDropped') || 'Coupon dropped!');

        } catch (error) {
            console.error('Error dropping coupon:', error);
            Alert.alert(t('error') || 'Error', t('failedToSave') || 'Failed to sync coupon');
        }
    };

    // Coupon Timer Effect
    // Coupon Timer Effect - Robust Date-based calculation
    useEffect(() => {
        if (activeCoupon?.endTime) {
            const updateTimer = () => {
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((activeCoupon.endTime - now) / 1000));
                setCouponTimeRemaining(remaining);

                if (remaining <= 0) {
                    clearInterval(couponTimerRef.current);
                    setActiveCoupon(null);
                    setCouponTimeRemaining(0);
                    LiveSessionService.deactivateCoupon(channelId); // Kill in Firestore
                }
            };

            updateTimer();
            couponTimerRef.current = setInterval(updateTimer, 1000);
            return () => clearInterval(couponTimerRef.current);
        } else if (!activeCoupon && couponTimeRemaining > 0) {
            // Cleanup if activeCoupon is cleared externally
            setCouponTimeRemaining(0);
        }
    }, [activeCoupon]);



    const sendGift = (gift: any) => {
        const targetName = selectedTargetUser?.userName || 'the Room';
        const finalAvatar = hostAvatar || CustomBuilder.getUserAvatar(userId);

        // Calculate new combo count locally
        const current = recentGiftRef.current;
        let newCount = 1;
        if (isSameGift(current, userId, userName || 'Host', gift.name)) {
            newCount = (current?.count || 0) + 1;
        }

        handleNewGift({
            senderName: userName || 'Host',
            senderId: userId,
            giftName: gift.name,
            points: gift.points || 0,
            icon: gift.icon,
            senderAvatar: finalAvatar,
            targetName: targetName,
            isHost: true,
            combo: newCount // ✅ Pass Combo
        });

        // Send via Signaling
        if (ZegoUIKit) {
            ZegoUIKit.getSignalingPlugin().sendInRoomCommandMessage(JSON.stringify({
                type: 'gift',
                senderId: userId,
                senderAvatar: finalAvatar,
                userName: userName || 'Host',
                giftName: gift.name,
                points: gift.points,
                icon: gift.icon,
                targetName: targetName,
                isHost: true,
                combo: newCount, // ✅ Pass Combo
                timestamp: Date.now()
            })).catch((e: any) => console.log('Host Gift Send Error:', e));

            const chatMsg = `🎁 ${userName} sent a ${gift.name} to ${targetName}!`;
            ZegoUIKit.sendInRoomMessage(chatMsg);
        }

        // Sync and Score
        if (channelId) {
            LiveSessionService.incrementGifts(channelId, gift.points || 1).catch(e => console.error('Gift Score Error:', e));
            LiveSessionService.broadcastGift(channelId, {
                giftName: gift.name,
                icon: gift.icon,
                points: gift.points || 1,
                senderName: userName || 'Host',
                senderId: userId,
                senderAvatar: finalAvatar,
                targetName: targetName,
                combo: newCount // ✅ Pass Combo
            }).catch(e => console.error('Gift Broadcast Error:', e));
            updatePKScore(gift.name);
        }
    };



    // 1. Process Gift Queue
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

    useEffect(() => {
        if (hostAvatar && userId) {
            CustomBuilder.registerAvatar(userId, hostAvatar);
        }
    }, [hostAvatar, userId]);

    // AUTO-START Firestore session on mount (since we skip the start button)
    useEffect(() => {
        // ✅ CRITICAL: Don't start session if ZEGO modules aren't available (Expo Go)
        if (!ZegoUIKitPrebuiltLiveStreaming) {
            console.log('⚠️ ZEGO modules not available - skipping session start');
            return;
        }

        console.log('🚀 HostLiveScreen mounted, auto-starting session...');
        startFirestoreSession();

        // Subscribe to live sessions for PK Challenge selection
        setLoadingSessions(true);
        const unsubscribeLive = LiveSessionService.subscribeToAllSessions((sessions: any[]) => {
            // Filter: Must be 'live', and NOT the current host/channel
            const others = sessions.filter((s: any) =>
                s.status === 'live' &&
                s.channelId !== channelId &&
                s.hostId !== userId
            );
            console.log('📺 Active PK Targets found:', others.length);
            setLiveSessions(others);
            setLoadingSessions(false);
        });

        // ✅ CRITICAL: Cleanup when component unmounts (app closed, navigated away, etc.)
        return () => {
            console.log('🎬 HostLiveScreen unmounting - ending session');
            unsubscribeLive();
            endFirestoreSession();
        };
    }, []);

    // ✅ Handle app state changes (background, inactive, close) - Mobile only
    useEffect(() => {
        if (Platform.OS === 'web') return; // Skip for web, handled separately

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            console.log('📱 AppState changed to:', nextAppState);

            // If app goes to background or becomes inactive, end the session
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                console.log('🎬 App backgrounded/inactive - ending live session');
                endFirestoreSession();
            }
        });

        return () => {
            subscription?.remove();
        };
    }, [channelId]);

    // ✅ Handle page refresh/close for web
    useEffect(() => {
        if (Platform.OS !== 'web') return; // Only for web

        const handleBeforeUnload = () => {
            console.log('🌐 Page unloading - ending live session');
            endFirestoreSession();
        };

        // @ts-ignore - window is available on web
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', handleBeforeUnload);
            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }
    }, [channelId]);

    // ✅ Heartbeat: Update session every 10 seconds to indicate host is still active
    useEffect(() => {
        // Run immediately
        LiveSessionService.updateHeartbeat(channelId).catch(console.error);

        const heartbeatInterval = setInterval(() => {
            LiveSessionService.updateHeartbeat(channelId).catch(e =>
                console.error('Heartbeat update error:', e)
            );
        }, 10000); // Update every 10 seconds

        return () => clearInterval(heartbeatInterval);
    }, [channelId]);

    // ✅ Robust Cleanup: Ensure session ends if component unmounts (nav back, etc)
    useEffect(() => {
        return () => {
            if (!sessionEndedRef.current) {
                console.log('🛑 HostLiveScreen Unmounting - Triggering Safety Cleanup');
                endFirestoreSession();
            }
        };
    }, [channelId]);

    // Handle session lifecycle
    const startFirestoreSession = async () => {
        try {
            if (collabId) {
                await LiveSessionService.startCollabSession(channelId, userName, userId, collabId, brandId, hostAvatar);
            } else {
                await LiveSessionService.startSession(channelId, userName, brandId, hostAvatar, userId);
            }
            setIsLiveStarted(true); // ✅ Show controls immediately
            console.log('🎬 Firestore session started');
        } catch (error) {
            console.error('Error starting Firestore session:', error);
        }
    };


    // Listen for In-Room Commands (Gifts) using ZegoUIKit core signaling plugin
    useEffect(() => {
        if (!ZegoUIKit) return;

        const callbackID = 'HostGiftListener_' + userId;
        console.log('🎧 Registering HostGiftListener:', callbackID);

        // 1. Command Message Handler (Gifts, Likes, PK Updates)
        ZegoUIKit.getSignalingPlugin().onInRoomCommandMessageReceived(callbackID, (messageData: any) => {
            const { message, senderUserID } = messageData;
            // Prevent processing own messages (handled locally)
            if (senderUserID === userId) return;

            try {
                const data = typeof message === 'string' ? JSON.parse(message) : message;

                if (data.type === 'gift') {
                    const senderId = data.senderId || senderUserID;
                    const isHost = data.isHost === true;
                    const senderName = data.userName || 'User';
                    const giftNameStr = String(data.giftName || '');

                    const foundGift = GIFTS.find(g => g.name.toLowerCase() === giftNameStr.toLowerCase());
                    const points = (foundGift && foundGift.points) || (Number(data.points) || 0);

                    handleNewGift({
                        senderName: senderName,
                        senderId: senderId,
                        giftName: giftNameStr,
                        points: points,
                        icon: foundGift ? foundGift.icon : data.icon,
                        senderAvatar: data.senderAvatar,
                        targetName: data.targetName,
                        isHost: isHost,
                        combo: data.combo // ✅ Pass Combo
                    });

                } else if (data.type === 'PK_VOTE') {
                    // No-op: scores are synced via Firestore listener
                } else if (data.type === 'PK_LIKE') {
                    handleSendLike(); // Keep to trigger floating heart animation
                } else if (data.type === 'PK_SCORE_SYNC') {
                    // No-op: scores are synced via Firestore listener
                } else if (data.type === 'PK_BATTLE_STOP') {
                    setIsInPK(false);
                    setPkBattleId(null);
                    if (data.winner) {
                        setPkWinner(data.winner);
                        setShowPKResult(true);
                        setTimeout(() => {
                            setShowPKResult(false);
                            setPkWinner(null);
                        }, 5000);
                    }
                    Alert.alert("PK Battle", data.message || "The opponent has ended the battle.");

                } else if (data.type === 'coupon_drop') {
                    setActiveCoupon(data);
                    setCouponTimeRemaining(data.expiryMinutes * 60);
                }
            } catch (e) {
                console.error('HostGiftListener Parse Error:', e);
            }
        });

        // 2. PK Invitation Handler
        ZegoUIKit.getSignalingPlugin().onInvitationReceived(callbackID, ({ callID, inviter, data }: any) => {
            try {
                const pkData = JSON.parse(data);
                const duration = pkData.duration || 180;
                Alert.alert(
                    t('pkBattleRequest') || "PK Battle Request",
                    `${pkData.inviterName || 'Host'} ${t('wantsToStartPK') || 'wants to start a PK battle!'}`,
                    [
                        { text: t('reject') || "Reject", onPress: () => ZegoUIKit.getSignalingPlugin().refuseInvitation(inviter.id) },
                        {
                            text: t('accept') || "Accept",
                            onPress: () => {
                                ZegoUIKit.getSignalingPlugin().acceptInvitation(inviter.id, JSON.stringify({
                                    accepterName: userName,
                                    channelId: channelId,
                                    duration: duration,
                                    endTime: pkData.endTime
                                }));
                                setIsInPK(true);
                                setHostScore(0); // ✅ Explicit reset for new battle
                                setGuestScore(0); // ✅ Explicit reset for new battle
                                setOpponentName(pkData.inviterName || 'Opponent');
                                setOpponentChannelId(pkData.roomID || null); // ✅ Save opponent channel ID
                                setPkBattleId(callID);
                                setPkEndTime(pkData.endTime || Date.now() + (duration * 1000));
                            }
                        }
                    ]
                );
            } catch (e) {
                console.error('PK Invitation Parse Error:', e);
            }
        });

        // 3. Invitation Accepted Handler
        ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID, async ({ invitee, data }: any) => {
            setIsInPK(true);
            setHostScore(0);
            setGuestScore(0);
            setPkWinner(null);
            setShowPKResult(false);

            let opponentChanId = null;
            let endTime = null;

            try {
                if (data) {
                    const parsed = JSON.parse(data);
                    if (parsed.accepterName) setOpponentName(parsed.accepterName);
                    if (parsed.endTime) {
                        endTime = parsed.endTime;
                        setPkEndTime(endTime);
                    }
                    if (parsed.channelId) {
                        opponentChanId = parsed.channelId;
                        setOpponentChannelId(opponentChanId);
                    }
                }
            } catch (e) {
                console.error('PK Accept Parse Error:', e);
            }

            // ✅ Initialize scores to 0 in Firestore for both hosts
            await LiveSessionService.updatePKState(channelId, {
                isActive: true,
                hostScore: 0,
                guestScore: 0,
                opponentName: opponentName,
                hostName: userName,
                opponentChannelId: opponentChanId,
                endTime: endTime,
                duration: pkDuration
            }).catch(e => console.error('PK State Init Error:', e));

            if (opponentChanId) {
                await LiveSessionService.updatePKState(opponentChanId, {
                    isActive: true,
                    hostScore: 0,
                    guestScore: 0,
                    opponentName: userName,
                    hostName: opponentName,
                    opponentChannelId: channelId,
                    endTime: endTime,
                    duration: pkDuration
                }).catch(e => console.error('Opponent PK State Init Error:', e));
            }

            Alert.alert(t('success') || "Success", t('pkBattleStarted') || "PK Battle Started!");
        });

        ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID, () => {
            Alert.alert(t('declined') || "Declined", t('pkDeclinedDesc') || "The host declined your PK challenge.");
        });

        return () => {
            console.log('🧹 Cleaning up HostGiftListener:', callbackID);
            ZegoUIKit.getSignalingPlugin().onInRoomCommandMessageReceived(callbackID, () => { });
            ZegoUIKit.getSignalingPlugin().onInvitationReceived(callbackID, () => { });
            ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID, () => { });
            ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID, () => { });
        };
    }, [ZegoUIKit, userId, channelId, userName]);

    const endFirestoreSession = async () => {
        // ✅ Prevent double-calling if session already ended
        if (sessionEndedRef.current) {
            console.log('⚠️ Session already ended, skipping duplicate call');
            return;
        }

        try {
            // ✅ PK Forfeit Logic: If host leaves during PK, they lose.
            if (isInPKRef.current && channelId) {
                console.log('🏁 PK Active during exit. Declaring loser...');
                const winner = opponentNameRef.current || 'Opponent';
                const finalPkState: any = {
                    isActive: false,
                    winner: winner,
                    endTime: Date.now()
                };

                // Update my room
                await LiveSessionService.updatePKState(channelId, finalPkState).catch(e => console.error('Exit PK Update Error:', e));

                // Update opponent's room
                if (opponentChannelIdRef.current) {
                    const opponentState = {
                        ...finalPkState,
                        hostName: opponentNameRef.current,
                        opponentName: userName,
                        hostScore: guestScoreRef.current, // Opponent's score becomes their hostScore
                        guestScore: hostScoreRef.current   // Our score remains guestScore for them
                    };
                    await LiveSessionService.updatePKState(opponentChannelIdRef.current, opponentState).catch(e => console.error('Exit Opponent PK Update Error:', e));
                }

                // Send signaling command (Optional, Firestore handles the truth)
                if (isLiveStarted && ZegoUIKit) {
                    try {
                        ZegoUIKit.sendInRoomCommand(JSON.stringify({
                            type: 'PK_BATTLE_STOP',
                            winner: winner,
                            message: `${userName} has left the live streaming. You win!`
                        }), [], () => { });
                    } catch (e) {
                        console.log('🔇 Could not send forfeit signaling (Room already closed):', e);
                    }
                }
            }

            setIsLiveStarted(false);
            sessionEndedRef.current = true; // Mark as ended immediately
            await LiveSessionService.endSession(channelId);
            console.log('🎬 Firestore session ended successfully');
        } catch (error) {
            console.error('Error ending Firestore session:', error);
            sessionEndedRef.current = false; // Reset on error so it can be retried
        }
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
                            // ✅ End any potential session before closing (safety measure)
                            console.log('🎬 Expo Go: Ending session before close');
                            await endFirestoreSession();
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

    const handleSendLike = () => {
        const x = Math.floor(Math.random() * 40) - 20; // Random offset for hearts
        const id = Date.now();
        setFloatingHearts(prev => [...prev.slice(-20), { id, x }]); // Max 20 hearts

        // Increment total likes
        setTotalLikes(prev => prev + 1);

        // If in PK battle, update score and broadcast
        if (isInPKRef.current) {
            console.log(`💖 PK Like: +1 point`);

            // ✅ Increment in Firestore atomically (like totalLikes)
            // This handles both local and cross-room sync automatically
            LiveSessionService.incrementPKHostScore(channelId, 1, opponentChannelId || undefined).catch(e =>
                console.error('PK Host Score Increment Error:', e)
            );

            // Broadcast like to other participants (optional, for immediate feedback)
            if (ZegoUIKit && isLiveStarted) {
                ZegoUIKit.sendInRoomCommand(JSON.stringify({
                    type: 'PK_LIKE',
                    count: 1,
                    hostId: userId
                }), [], () => { });
            }
        }

        // Remove heart after animation
        setTimeout(() => {
            setFloatingHearts(prev => prev.filter(h => h.id !== id));
        }, 2500);
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
                <Sparkles size={36} color="#FF0066" fill="#FF0066" />
            </Animated.View>
        );
    };


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
                        position: 'relative',

                    }}>
                        {/* Host Side (Pink/Red) */}
                        <LinearGradient
                            colors={['#FF0050', '#FF4D80', '#FF0050']}
                            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                            style={{
                                flex: Math.max(hostScore, 1),
                                justifyContent: 'center',
                                paddingLeft: 18,
                                borderRadius: 18, // Added for iOS rounding
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
                                    <ChessKingIcon size={10} color="#FFD700" fill="#FFD700" />
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
                                borderRadius: 18, // Added for iOS rounding
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
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>{userName?.toUpperCase() || (t('hostLabel') || 'YOU').toUpperCase()}</Text>
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

            {showPKResult && pkWinner && (
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
                                            {userName?.toUpperCase() || (t('hostLabel') || 'YOU').toUpperCase()}
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
                                            {opponentName?.toUpperCase() || (t('opponentLabel') || 'OPPONENT').toUpperCase()}
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
                ref={prebuiltRef}
                appID={ZEGO_APP_ID}
                appSign={ZEGO_APP_SIGN}
                userID={userId}
                userName={typeof userName === 'string' && userName.trim().length > 0 ? userName : 'Host'}
                liveID={channelId}
                config={{
                    ...HOST_DEFAULT_CONFIG,
                    inRoomChatConfig: {
                        itemBuilder: (message: any) => {
                            const senderName = message.sender.userName || 'Viewer';
                            const isHostMsg = senderName.trim().includes('Host') ||
                                senderName.trim() === 'Tama Clothing' ||
                                message.sender.userID === userId;

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
                    role: ZegoLiveStreamingRole?.Host ?? 0,
                    confirmStartLive: true, // Show preview so styling applies
                    showStartLiveButton: true,
                    startLiveButtonBuilder: (onClick: any) => (
                        <TouchableOpacity
                            onPress={onClick}
                            activeOpacity={0.8}
                            style={{
                                width: 220,
                                height: 50,
                                borderRadius: 25,
                                overflow: 'hidden',
                                shadowColor: '#EF4444',
                                shadowOpacity: 0.5,
                                shadowRadius: 15,
                                shadowOffset: { width: 0, height: 6 },
                                elevation: 12,
                                marginBottom: 60, // Move up slightly
                                alignSelf: 'center'
                            }}
                        >
                            <LinearGradient
                                colors={['#EF4444', '#B91C1C']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingHorizontal: 20,
                                    gap: 10
                                }}
                            >
                                <Radio size={18} color="#FFF" />
                                <Text style={{
                                    color: '#fff',
                                    fontSize: 13,
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    textAlign: 'center'
                                }}>
                                    {t ? t('startLive') : 'START LIVE'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ),
                    onStartLiveButtonPressed: () => {
                        console.log('🎬 Host Pressed Start!');
                        startFirestoreSession();
                    },
                    onLiveStreamingEnded: async () => {
                        console.log('🎬 [Host] Live streaming ended by SDK (Stop button pressed)');
                        await endFirestoreSession();
                        // Don't call onClose() here - let onLeaveLiveStreaming handle it
                    },
                    onLeaveLiveStreaming: async () => {
                        console.log('🎬 [Host] Host leaving live (X button or back pressed)');
                        await endFirestoreSession();
                        onClose();
                    },
                    durationConfig: {
                        isVisible: true,
                        onDurationUpdate: (duration: number) => {
                            // Can track duration if needed
                        }
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
                                    </View>
                                );
                            },
                        },
                    },
                    // Manual PK Logic: The Prebuilt Kit v2.8.3 does not have native pkConfig support.
                    // We handle PK Battle logic manually via the signaling plugin and in-room commands.
                    pkConfig: {},
                    beautyConfig: {}, // Explicitly enable Beauty
                    bottomMenuBarConfig: {
                        maxCount: 8,
                        buttons: [
                            ZegoMenuBarButtonName.toggleCameraButton || 'toggleCamera',
                            ZegoMenuBarButtonName.toggleMicrophoneButton || 'toggleMicrophone',
                            ZegoMenuBarButtonName.switchCameraButton || 'switchCamera',
                            ZegoMenuBarButtonName.chatButton || 'chat',
                            ZegoMenuBarButtonName.pkBattleButton || 'pkBattle',
                            ZegoMenuBarButtonName.coHostControlButton || 'cohost',
                        ],
                        buttonBuilders: {
                            toggleCameraBuilder: CustomBuilder.toggleCameraBuilder,
                            toggleMicrophoneBuilder: CustomBuilder.toggleMicrophoneBuilder,
                            switchCameraBuilder: CustomBuilder.switchCameraBuilder,
                            switchAudioOutputBuilder: CustomBuilder.switchAudioOutputBuilder,
                            enableChatBuilder: CustomBuilder.enableChatBuilder,
                            chatBuilder: CustomBuilder.chatBuilder,
                            leaveBuilder: CustomBuilder.leaveBuilder,
                            memberBuilder: CustomBuilder.memberBuilder,
                            pkBattleBuilder: CustomBuilder.pkBattleBuilder,
                        },
                    },
                    onCoHostRequestReceived: (user: any) => {
                        console.log('📬 Co-host request from:', user.userName);
                        if (blockedApplying.includes(user.userID)) {
                            console.log('🚫 Auto-declining blocked user:', user.userName);
                            // Auto decline logic - the SDK usually handles the UI, 
                            // but we can intercept or show nothing.
                            return;
                        }
                    },
                    memberListConfig: {
                        showCameraState: false,
                        showMicrophoneState: false,
                        onMemberMoreButtonPressed: (item: any) => {
                            console.log('🔘 3-Dots Menu Clicked (Default List) for:', item);
                            if (item.userID === userId) return;

                            const isCoHost = item.role === 1;
                            const isBlocked = blockedApplying.includes(item.userID);
                            // FORCE Name Resolution: The item passed to callback often has stale/ID name.
                            // We fetch the latest user object from SDK which the list uses for display.
                            let targetName = item.userName;
                            if (ZegoUIKit) {
                                try {
                                    const realUser = ZegoUIKit.getUser(item.userID);
                                    if (realUser) {
                                        if (realUser.userName && realUser.userName !== item.userID) {
                                            targetName = realUser.userName;
                                        } else if (realUser.nickName && realUser.nickName !== item.userID) {
                                            targetName = realUser.nickName;
                                        }
                                    }
                                } catch (e) {
                                    console.log('Error fetching user info:', e);
                                }
                            }

                            // Fallback
                            if (!targetName || targetName === item.userID) {
                                targetName = 'User';
                            }

                            // Define Actions
                            const actionOptions = [
                                t('cancel') || 'Cancel',
                                `🚫 ${t('removeUser') || 'Remove'} ${targetName}`,
                                isCoHost ? `📵 ${t('stopCoHosting') || 'Stop Co-hosting'}` : `🤝 ${t('inviteToCoHost') || 'Invite to Co-host'}`,
                                isCoHost ? `🔇 ${t('mute') || 'Mute'} ${targetName}` : null,
                                isBlocked ? `✅ ${t('unblock') || 'Unblock'} Apply` : `⛓️ ${t('block') || 'Block'} Apply`
                            ].filter(Boolean) as string[];

                            const handleAction = (selectedText: string) => {
                                if (!selectedText || selectedText === t('cancel')) return;

                                if (selectedText.includes(t('removeUser'))) {
                                    Alert.alert(t('confirmRemove') || 'Confirm Disconnect', (t('areYouSureRemoveFromRoom') || `Are you sure you want to remove ${targetName} from the room?`).replace('${targetName}', targetName), [
                                        { text: t('cancel') || 'Cancel', style: 'cancel' },
                                        {
                                            text: t('remove') || 'Remove', style: 'destructive', onPress: () => {
                                                const ZegoRN = require('@zegocloud/zego-uikit-rn').default;
                                                if (ZegoRN) ZegoRN.removeUserFromRoom([item.userID]);
                                            }
                                        }
                                    ]);
                                } else if (selectedText.includes(t('inviteToCoHost'))) {
                                    if (ZegoUIKit) {
                                        ZegoUIKit.getSignalingPlugin().sendInvitation([item.userID], 60, 2, JSON.stringify({ "inviter_name": userName, "type": 2 }))
                                            .then(() => Alert.alert(t('success') || "Success", `${t('invitationSentTo') || 'Invitation sent to'} ${targetName}`))
                                            .catch(() => Alert.alert("Info", t('sendingInvitation') || `Sending invitation...`));
                                    }
                                } else if (selectedText.includes(t('stopCoHosting'))) {
                                    if (ZegoUIKit && isLiveStarted) {
                                        ZegoUIKit.sendInRoomCommand(JSON.stringify({ type: 'stop_cohosting', target: item.userID }), [item.userID], () => { });
                                        Alert.alert(t('success') || "Success", `${t('stoppedCoHostingFor') || 'Stopped co-hosting for'} ${targetName}`);
                                    }
                                } else if (selectedText.includes('Mute')) {
                                    const ZegoRN = require('@zegocloud/zego-uikit-rn').default;
                                    if (ZegoRN) ZegoRN.turnMicrophoneOn(item.userID, false);
                                } else if (selectedText.includes('Block Apply') || selectedText.includes('Unblock Apply')) {
                                    setBlockedApplying(prev => isBlocked ? prev.filter(id => id !== item.userID) : [...prev, item.userID]);
                                    Alert.alert('Updated', isBlocked ? `Unblocked ${targetName}` : `Blocked ${targetName} from applying`);
                                }
                            };

                            if (Platform.OS === 'ios') {
                                ActionSheetIOS.showActionSheetWithOptions(
                                    {
                                        options: actionOptions,
                                        cancelButtonIndex: 0,
                                        destructiveButtonIndex: 1,
                                        title: `Manage ${targetName}`,
                                        message: 'Select an action for this user'
                                    },
                                    (buttonIndex) => handleAction(actionOptions[buttonIndex])
                                );
                            } else {
                                Alert.alert(
                                    `Manage ${targetName}`,
                                    'Select an action',
                                    [
                                        ...actionOptions.slice(1).map(opt => ({
                                            text: opt,
                                            style: (opt.includes('Remove') ? 'destructive' : 'default') as 'destructive' | 'default',
                                            onPress: () => handleAction(opt)
                                        })),
                                        { text: 'Cancel', style: 'cancel', onPress: () => { } }
                                    ]
                                );
                            }
                        },
                    },
                    onWindowMinimized: () => {
                        onClose();
                    },



                    onInRoomTextMessageReceived: (messages: any[]) => {
                        // ⚠️ DISABLED: Chat fallback causes duplicate gifts
                        // The onInRoomCommandReceived handler above is the primary method
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
                plugins={ZIM ? [ZIM] : []}
            />




            {/* ALPHA VIDEO OVERLAY */}
            {/* GIFT ANIMATIONS (Full Screen Overlay) */}
            {
                showGiftVideo && (
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
                                                        colors={['rgba(60, 30, 0, 0.4)', 'rgba(60, 30, 0, 0.2)', 'rgba(251, 191, 36, 0.05)', 'transparent']}
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
                )
            }

            {/* Purchase Notification Banner */}
            {
                purchaseNotification && (
                    <Animatable.View
                        animation="slideInDown"
                        duration={500}
                        style={{
                            position: 'absolute',
                            top: 130,
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
                )
            }

            {/* TikTok Style Gift Alert Overlay - Top Left side pill */}


            {/* Host Gift Modal with TikTok Style Grid */}
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
                        height: Dimensions.get('window').height * 0.7, // Higher for host due to user selection
                        paddingBottom: Platform.OS === 'ios' ? 34 : 10
                    }}>
                        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900', marginTop: 15, marginBottom: 10, textAlign: 'center' }}>
                            {t('sendGiftToParticipant') || 'SEND GIFT TO PARTICIPANT'}
                        </Text>

                        {/* User Selection List - TikTok style bubble row */}
                        <View style={{ paddingHorizontal: 15, marginBottom: 10 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {roomUsers.length === 0 ? (
                                    <Text style={{ color: '#666', fontSize: 13, paddingVertical: 10 }}>{t('noParticipants') || 'No other participants...'}</Text>
                                ) : (
                                    roomUsers.map(user => (
                                        <TouchableOpacity
                                            key={user.userID}
                                            onPress={() => setSelectedTargetUser(user)}
                                            style={{
                                                paddingHorizontal: 15,
                                                paddingVertical: 6,
                                                borderRadius: 20,
                                                backgroundColor: selectedTargetUser?.userID === user.userID ? '#FF0066' : '#252530',
                                                marginRight: 8,
                                                borderWidth: 1,
                                                borderColor: selectedTargetUser?.userID === user.userID ? '#fff' : '#444'
                                            }}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{user.userName}</Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        </View>

                        {/* Categories Bar */}
                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222', paddingHorizontal: 10 }}>
                            {['POPULAIRE', 'SPÉCIAL', 'LUXE'].map((cat: any) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setGiftCategory(cat)}
                                    style={{
                                        paddingVertical: 12,
                                        paddingHorizontal: 20,
                                        borderBottomWidth: giftCategory === cat ? 2 : 0,
                                        borderBottomColor: '#FF0066'
                                    }}
                                >
                                    <Text style={{
                                        color: giftCategory === cat ? '#fff' : '#888',
                                        fontWeight: 'bold',
                                        fontSize: 12
                                    }}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Gift Grid */}
                        <FlatList
                            key={giftCategory}
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
                                            borderColor: isSelected ? '#FF0066' : 'transparent',
                                            opacity: roomUsers.length === 0 ? 0.5 : 1
                                        }}
                                        disabled={roomUsers.length === 0}
                                    >
                                        <View style={{ width: 50, height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
                                            {typeof gift.icon === 'number' ? (
                                                <Image source={gift.icon} style={{ width: 44, height: 44 }} resizeMode="contain" />
                                            ) : typeof gift.icon === 'string' && gift.icon.startsWith('http') ? (
                                                <Image source={{ uri: gift.icon }} style={{ width: 44, height: 44 }} resizeMode="contain" />
                                            ) : (
                                                <Text style={{ fontSize: 24 }}>{gift.icon}</Text>
                                            )}
                                        </View>
                                        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{gift.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                            <Text style={{ color: isSelected ? '#fff' : '#FFD700', fontSize: 9, fontWeight: '900' }}>{gift.points}</Text>
                                            <Text style={{ fontSize: 8, marginLeft: 2 }}>💎</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        {/* Bottom Actions */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            borderTopWidth: 1,
                            borderTopColor: '#222',
                            backgroundColor: '#16161E'
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{userBalance}</Text>
                                <Text style={{ fontSize: 12, marginHorizontal: 4 }}>💎</Text>
                                <TouchableOpacity style={{ marginLeft: 5 }}>
                                    <PlusCircle size={18} color="#FF0066" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedGift && selectedTargetUser) {
                                        sendGift(selectedGift);
                                    } else if (!selectedTargetUser) {
                                        Alert.alert(t('error') || 'Erreur', t('selectRecipient') || 'Veuillez sélectionner un destinataire');
                                    }
                                }}
                                disabled={!selectedGift || roomUsers.length === 0}
                                style={{
                                    backgroundColor: selectedGift && selectedTargetUser ? '#FF0066' : '#333',
                                    paddingHorizontal: 25,
                                    paddingVertical: 10,
                                    borderRadius: 25,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    opacity: (selectedGift && selectedTargetUser) ? 1 : 0.5
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14, marginRight: 8 }}>
                                    {t('send') || 'ENVOYER'}
                                </Text>
                                <Send size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>




            {/* PINNED PRODUCT CARD OVERLAY (Matches Audience UI) */}
            {
                pinnedProduct && (
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

                            <View style={{ alignItems: 'center', marginLeft: 8, minWidth: 60 }}>
                                {pinTimeRemaining > 0 && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                                        <Clock size={8} color="rgba(255,255,255,0.8)" style={{ marginRight: 3 }} />
                                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '900' }}>
                                            {Math.floor(pinTimeRemaining / 60)}:{(pinTimeRemaining % 60).toString().padStart(2, '0')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity
                                onPress={handleUnpin}
                                style={{
                                    position: 'absolute',
                                    top: 5,
                                    right: 5,
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10
                                }}
                            >
                                <X size={10} color="#fff" />
                            </TouchableOpacity>
                        </BlurView>
                    </Animatable.View>
                )
            }

            {/* FLOATING HOST CONTROLS - Moved to bottom right */}
            {/* ✅ Only show after live starts to prevent bugs */}
            {
                isLiveStarted && (
                    <View style={{ position: 'absolute', bottom: 100, right: 15, gap: 14, alignItems: 'center', zIndex: 1000 }}>
                        {/* Commerce Button */}
                        <TouchableOpacity
                            onPress={() => setShowProductModal(true)}
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
                        </TouchableOpacity>

                        {/* PK Toggle Button */}
                        <TouchableOpacity
                            onPress={() => setShowPKInviteModal(true)}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: isInPK ? '#3B82F6' : 'rgba(0,0,0,0.4)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: isInPK ? '#fff' : 'rgba(255,255,255,0.2)',
                                overflow: 'hidden'
                            }}
                        >
                            {!isInPK && <BlurView intensity={20} style={StyleSheet.absoluteFill} />}
                            <Swords size={20} color="#fff" />
                        </TouchableOpacity>

                        {/* Gift Button for Host */}
                        <TouchableOpacity
                            onPress={openGiftModal}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: '#FF0066',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1.5,
                                borderColor: '#fff'
                            }}
                        >
                            <GiftIcon size={20} color="#fff" strokeWidth={2} />
                        </TouchableOpacity>

                        {/* Coupon Button */}
                        <TouchableOpacity
                            onPress={() => setShowCouponModal(true)}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: activeCoupon ? '#F59E0B' : 'rgba(0,0,0,0.4)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: activeCoupon ? '#fff' : 'rgba(255,255,255,0.2)',
                                overflow: 'hidden'
                            }}
                        >
                            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                            <Ticket size={20} color="#fff" />
                        </TouchableOpacity>

                        {/* Beauty Toggle Button */}
                        <TouchableOpacity
                            onPress={() => Alert.alert("Beauty", "Beauty Filters toggled!")}
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
                            <Sparkles size={20} color="#fff" />
                        </TouchableOpacity>


                        {/* Share Button as requested */}
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
                    </View>
                )
            }

            {/* PK Invite Modal */}
            <Modal
                visible={showPKInviteModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowPKInviteModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <BlurView intensity={90} tint="dark" style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '70%', padding: 25, overflow: 'hidden', backgroundColor: 'rgba(18, 18, 24, 0.98)' }}>
                        <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245, 158, 11, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                    <Swords size={20} color="#F59E0B" />
                                </View>
                                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 }}>{t('pkBattle') || 'PK Battle'}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowPKInviteModal(false)}
                                style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 20 }}
                            >
                                <X size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {isInPK ? (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }}>
                                <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 30, borderRadius: 25, alignItems: 'center', width: '100%' }}>
                                    <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '800', marginBottom: 10 }}>{(t('battleInProgress') || 'BATTLE IN PROGRESS').toUpperCase()}</Text>
                                    <Text style={{ color: '#888', marginBottom: 25, textAlign: 'center' }}>{t('battleInProgressDesc') || 'You are currently in a PK battle. You must stop the current challenge before starting a new one.'}</Text>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            // Determine winner (Opponent wins if host stops manually)
                                            const winner = opponentName || 'Opponent';
                                            setIsInPK(false);
                                            setPkWinner(winner);
                                            setShowPKResult(true);
                                            setPkBattleId(null);

                                            // Stop PK in Firestore for both rooms
                                            if (channelId) {
                                                const finalState = {
                                                    isActive: false,
                                                    winner: winner,
                                                    endTime: Date.now()
                                                };
                                                LiveSessionService.updatePKState(channelId, finalState).catch(e => console.error('Stop PK Error:', e));
                                                if (opponentChannelId) {
                                                    LiveSessionService.updatePKState(opponentChannelId, {
                                                        ...finalState,
                                                        hostName: opponentName,
                                                        opponentName: userName,
                                                        hostScore: guestScore,
                                                        guestScore: hostScore
                                                    }).catch(e => console.error('Stop Opponent PK Error:', e));
                                                }
                                            }

                                            if (isLiveStarted && ZegoUIKit) {
                                                ZegoUIKit.sendInRoomCommand(JSON.stringify({
                                                    type: 'PK_BATTLE_STOP',
                                                    winner: winner,
                                                    message: `${userName} has ended the battle.`
                                                }), [], () => { });
                                            }
                                            setShowPKInviteModal(false);

                                            // Hide result after 5s
                                            setTimeout(() => {
                                                setShowPKResult(false);
                                                setPkWinner(null);
                                            }, 5000);
                                        }}
                                        activeOpacity={0.8}
                                        style={{
                                            backgroundColor: '#EF4444',
                                            paddingVertical: 16,
                                            width: '100%',
                                            borderRadius: 14,
                                            alignItems: 'center',
                                            shadowColor: '#EF4444',
                                            shadowOpacity: 0.3,
                                            shadowRadius: 10,
                                            shadowOffset: { width: 0, height: 4 }
                                        }}
                                    >
                                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 }}>{(t('stopBattle') || 'STOP BATTLE').toUpperCase()}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={{ flex: 1 }}>
                                {/* Duration Selector */}
                                <Text style={{ color: '#888', marginBottom: 12, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }}>{(t('chooseBattleDuration') || 'CHOOSE BATTLE DURATION:').toUpperCase()}</Text>
                                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 30 }}>
                                    {[
                                        { label: '3m', value: 180 },
                                        { label: '5m', value: 300 },
                                        { label: '7m', value: 420 },
                                        { label: '10m', value: 600 },
                                        { label: '15m', value: 900 },
                                        { label: '20m', value: 1200 },
                                    ].map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            onPress={() => setPkDuration(option.value)}
                                            style={{
                                                flex: 1,
                                                paddingVertical: 12,
                                                borderRadius: 12,
                                                backgroundColor: pkDuration === option.value ? '#3B82F6' : '#2A2A35',
                                                borderWidth: 1.5,
                                                borderColor: pkDuration === option.value ? '#60A5FA' : 'rgba(255,255,255,0.05)',
                                                alignItems: 'center',
                                                shadowColor: pkDuration === option.value ? '#3B82F6' : 'transparent',
                                                shadowOpacity: 0.2,
                                                shadowRadius: 5
                                            }}
                                        >
                                            <Text style={{
                                                color: pkDuration === option.value ? '#fff' : 'rgba(255,255,255,0.4)',
                                                fontWeight: '900',
                                                fontSize: 14
                                            }}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={{ color: '#888', marginBottom: 15, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }}>{(t('activeHosts') || 'ACTIVE HOSTS:').toUpperCase()}</Text>

                                {loadingSessions ? (
                                    <View style={{ flex: 1, justifyContent: 'center' }}>
                                        <ActivityIndicator color="#3B82F6" />
                                    </View>
                                ) : liveSessions.filter(s => s.channelId !== channelId).length > 0 ? (
                                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                                        {liveSessions.filter(s => s.channelId !== channelId).map((session) => (
                                            <TouchableOpacity
                                                key={session.channelId}
                                                activeOpacity={0.7}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                    padding: 14,
                                                    borderRadius: 18,
                                                    marginBottom: 12,
                                                    borderWidth: 1,
                                                    borderColor: 'rgba(255, 255, 255, 0.08)'
                                                }}
                                                onPress={() => {
                                                    const targetId = session.hostId || session.channelId;
                                                    if (ZegoUIKit && targetId) {
                                                        const endTime = Date.now() + (pkDuration * 1000);
                                                        const invitationData = JSON.stringify({
                                                            inviterName: userName,
                                                            roomID: channelId,
                                                            type: 'PK_REQUEST',
                                                            duration: pkDuration,
                                                            endTime: endTime
                                                        });
                                                        ZegoUIKit.getSignalingPlugin().sendInvitation([targetId], 60, 10, invitationData)
                                                            .then(() => {
                                                                setShowPKInviteModal(false);
                                                                Alert.alert(t('success') || "Request Sent", `${t('challenge')} ${session.hostName}...`);
                                                            })
                                                            .catch((err: any) => {
                                                                console.log('PK Invitation Error:', err);
                                                                Alert.alert(t('error') || "Error", t('failedToSave') || "Could not send challenge.");
                                                            });
                                                    }
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                    <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' }}>
                                                        {session.hostAvatar ? (
                                                            <Image source={{ uri: session.hostAvatar }} style={{ width: '100%', height: '100%' }} />
                                                        ) : (
                                                            <View style={{ width: '100%', height: '100%', backgroundColor: '#444', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{session.hostName?.charAt(0)}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <View>
                                                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{session.hostName || 'Host'}</Text>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                                                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' }}>{t('liveNow') || 'Live Now'}</Text>
                                                        </View>
                                                    </View>
                                                </View>

                                                <View style={{
                                                    backgroundColor: '#3B82F6',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 8,
                                                    borderRadius: 10,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 6
                                                }}>
                                                    <Swords size={14} color="#fff" />
                                                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 11 }}>{(t('challenge') || 'CHALLENGE').toUpperCase()}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                ) : (
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5, paddingBottom: 50 }}>
                                        <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 40, marginBottom: 15 }}>
                                            <Swords size={40} color="#666" />
                                        </View>
                                        <Text style={{ color: '#666', fontSize: 15, fontWeight: '700' }}>{t('noOtherHostsLive') || 'No other hosts are live'}</Text>
                                        <Text style={{ color: '#444', fontSize: 12, marginTop: 5 }}>{t('inviteJoinFirst') || 'Invite someone to join first!'}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </BlurView>
                </View>
            </Modal>

            {/* Product Selection Modal */}
            <Modal
                visible={showProductModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowProductModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <BlurView intensity={90} tint="dark" style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '75%', padding: 25, overflow: 'hidden', backgroundColor: 'rgba(18, 18, 24, 0.98)' }}>
                        <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 }}>{t('liveShoppingBag') || 'Live Shopping Bag'}</Text>
                            <TouchableOpacity
                                onPress={() => setShowProductModal(false)}
                                style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 20 }}
                            >
                                <X size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ color: '#888', marginBottom: 10, fontSize: 13, fontWeight: '600' }}>{t('pinDuration') || 'PIN DURATION:'}</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {[
                                    { label: '3m', value: '3' },
                                    { label: '5m', value: '5' },
                                    { label: '10m', value: '10' },
                                    { label: '15m', value: '15' },
                                    { label: '30m', value: '30' }
                                ].map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => setPinDuration(option.value)}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 10,
                                            borderRadius: 10,
                                            backgroundColor: pinDuration === option.value ? '#F59E0B' : '#2A2A35',
                                            borderWidth: 1,
                                            borderColor: pinDuration === option.value ? '#fff' : '#333',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Text style={{
                                            color: pinDuration === option.value ? '#000' : '#888',
                                            fontWeight: 'bold',
                                            fontSize: 13
                                        }}>
                                            {option.value}{t('mins')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
                            {products.map(p => {
                                const isSelected = selectedProductIds.includes(p.id);
                                const isPinned = pinnedProductId === p.id;
                                return (
                                    <View key={p.id} style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: 16,
                                        padding: 12,
                                        marginBottom: 12,
                                        borderWidth: isPinned ? 1.5 : 1,
                                        borderColor: isPinned ? '#F59E0B' : 'rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <Image source={{ uri: p.images?.[0] }} style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: '#333' }} />
                                        <View style={{ flex: 1, marginLeft: 15 }}>
                                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }} numberOfLines={1}>{getLocalizedName(p.name)}</Text>
                                            {p.discountPrice ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textDecorationLine: 'line-through' }}>{p.price} TND</Text>
                                                    <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: '800' }}>{p.discountPrice} TND</Text>
                                                </View>
                                            ) : (
                                                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4, fontWeight: '600' }}>{p.price} TND</Text>
                                            )}
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <TouchableOpacity
                                                onPress={() => handlePinProduct(p.id)}
                                                style={{
                                                    backgroundColor: isPinned ? '#F59E0B' : 'transparent',
                                                    paddingHorizontal: 14,
                                                    paddingVertical: 8,
                                                    borderRadius: 10,
                                                    borderWidth: isPinned ? 0 : 1,
                                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                                    minWidth: 70,
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <Text style={{ color: isPinned ? '#000' : '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>
                                                    {isPinned ? (t('pinned') || 'PINNED') : (t('pin') || 'PIN')}
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => toggleProductSelection(p.id)}
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 14,
                                                    borderWidth: 2,
                                                    borderColor: isSelected ? '#3B82F6' : 'rgba(255,255,255,0.3)',
                                                    backgroundColor: isSelected ? '#3B82F6' : 'transparent',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {isSelected && <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={handleUpdateBag}
                            activeOpacity={0.8}
                            style={{
                                position: 'absolute',
                                bottom: 40,
                                left: 20,
                                right: 20,
                                backgroundColor: '#3B82F6',
                                paddingVertical: 16,
                                borderRadius: 14,
                                alignItems: 'center',
                                shadowColor: '#3B82F6',
                                shadowOpacity: 0.4,
                                shadowRadius: 12,
                                shadowOffset: { width: 0, height: 6 },
                                elevation: 8
                            }}
                        >
                            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 }}>
                                {(t('updateStreamBag') || 'UPDATE STREAM BAG').toUpperCase()} ({selectedProductIds.length})
                            </Text>
                        </TouchableOpacity>
                    </BlurView>
                </View>
            </Modal>

            {/* 🎫 LIVE COUPON OVERLAY FOR HOST - Horizontal Ticket Style */}
            {
                activeCoupon && (
                    <Animatable.View
                        animation="bounceInLeft"
                        style={{
                            position: 'absolute',
                            bottom: 290, // Positioned above comments (approx)
                            left: 15,
                            width: 200,
                            zIndex: 3000
                        }}
                    >
                        <LinearGradient
                            colors={['#F59E0B', '#B45309']}
                            style={{
                                borderRadius: 10,
                                padding: 1, // Border effect
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
                                {/* Coupon Notches */}
                                <View style={{ position: 'absolute', top: -5, left: '50%', marginLeft: -5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#000', zIndex: 10, borderWidth: 1, borderColor: '#B45309' }} />
                                <View style={{ position: 'absolute', bottom: -5, left: '50%', marginLeft: -5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#000', zIndex: 10, borderWidth: 1, borderColor: '#B45309' }} />


                                {/* LIVE PK STATUS BAR */}
                                <View style={{ flex: 1, padding: 8, justifyContent: 'center' }}>
                                    <Text style={{ color: '#F59E0B', fontSize: 6.5, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 }}>{t('limitedTimeOffer').toUpperCase()}</Text>
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

                                {/* Vertical Dashed Divider */}
                                <View style={{ width: 1, height: '100%', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', left: '50%', position: 'absolute' }} />

                                {/* Right Side: Action */}
                                {/* Right Side: Action (Host View - View Only) */}
                                <View style={{ flex: 1, padding: 8, paddingLeft: 12, justifyContent: 'center', alignItems: 'center' }}>
                                    <View style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        paddingVertical: 6,
                                        paddingHorizontal: 8,
                                        borderRadius: 6,
                                        borderStyle: 'dashed',
                                        borderWidth: 1,
                                        borderColor: 'rgba(245, 158, 11, 0.4)',
                                        width: '100%',
                                        alignItems: 'center'
                                    }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '700', marginBottom: 2 }}>CODE</Text>
                                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 }}>{activeCoupon.code}</Text>
                                    </View>
                                </View>

                                {/* Close Button overlay */}
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

            {/* NEW COUPON CREATION MODAL */}
            <Modal
                visible={showCouponModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCouponModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}
                >
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setShowCouponModal(false)}
                    />

                    <Animatable.View
                        animation="zoomIn"
                        duration={300}
                        style={{
                            backgroundColor: '#1A1A24',
                            width: Dimensions.get('window').width * 0.9,
                            maxWidth: 400,
                            borderRadius: 30,
                            padding: 24,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.1)',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.5,
                            shadowRadius: 20,
                            elevation: 15
                        }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 }}>
                                {t('createCoupon')}
                            </Text>
                            <TouchableOpacity onPress={() => setShowCouponModal(false)}>
                                <X size={24} color="rgba(255,255,255,0.5)" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 16 }}>
                            <View>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8, fontWeight: '700' }}>
                                    {t('couponCode').toUpperCase()}
                                </Text>
                                <TextInput
                                    placeholder="e.g. LIVE30"
                                    placeholderTextColor="#555"
                                    value={couponCode}
                                    onChangeText={setCouponCode}
                                    autoCapitalize="characters"
                                    style={{
                                        backgroundColor: '#0F0F16',
                                        borderRadius: 12,
                                        padding: 14,
                                        color: '#fff',
                                        fontSize: 16,
                                        fontWeight: 'bold',
                                        borderWidth: 1,
                                        borderColor: '#333'
                                    }}
                                />
                            </View>

                            <View>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8, fontWeight: '700' }}>
                                    {t('discountAmount').toUpperCase()}
                                </Text>
                                <TextInput
                                    placeholder="30% or 10TND"
                                    placeholderTextColor="#555"
                                    value={discountAmount}
                                    onChangeText={setDiscountAmount}
                                    style={{
                                        backgroundColor: '#0F0F16',
                                        borderRadius: 12,
                                        padding: 14,
                                        color: '#fff',
                                        fontSize: 14,
                                        fontWeight: 'bold',
                                        borderWidth: 1,
                                        borderColor: '#333'
                                    }}
                                />
                            </View>

                            <View>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8, fontWeight: '700' }}>
                                    {t('expiryMinutes').toUpperCase()}
                                </Text>
                                <TextInput
                                    keyboardType="numeric"
                                    value={couponExpiry}
                                    onChangeText={setCouponExpiry}
                                    placeholder="e.g. 5"
                                    placeholderTextColor="#555"
                                    style={{
                                        backgroundColor: '#0F0F16',
                                        borderRadius: 12,
                                        padding: 14,
                                        color: '#fff',
                                        fontSize: 14,
                                        fontWeight: 'bold',
                                        textAlign: 'left',
                                        borderWidth: 1,
                                        borderColor: '#333'
                                    }}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={dropCoupon}
                                activeOpacity={0.8}
                                style={{ marginTop: 10, borderRadius: 15, overflow: 'hidden' }}
                            >
                                <LinearGradient
                                    colors={['#F59E0B', '#D97706']}
                                    style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Text style={{ color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1 }}>
                                        {t('dropCoupon').toUpperCase()}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animatable.View>
                </KeyboardAvoidingView>
            </Modal>
            {/* TikTok Style Gift Alert Overlay - Top Left side pill */}
            {
                recentGift && !recentGift.isBig && (
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
                )
            }

            {/* Floating Heart Animations */}
            <View style={{ position: 'absolute', bottom: 150, right: 15, width: 60, height: 400, pointerEvents: 'none', zIndex: 1000 }}>
                {floatingHearts.map(heart => (
                    <FloatingHeart key={heart.id} id={heart.id} x={heart.x} />
                ))}
            </View>
        </View >
    );
}