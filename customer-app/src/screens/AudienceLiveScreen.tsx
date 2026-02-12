import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Text, TouchableOpacity, Image, ScrollView, Animated, Easing, Dimensions, Clipboard, StyleSheet, View, findNodeHandle } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { CustomBuilder } from '../utils/CustomBuilder';
import { LiveSessionService } from '../services/LiveSessionService';
import { Gift, Share2, Heart, Flame, Ticket, X, Clock } from 'lucide-react-native';
import { FlameCounter } from '../components/FlameCounter';


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
};

export default function AudienceLiveScreen(props: Props) {
    const t = props.t || ((key: string) => key);
    const { channelId, userId, userName, userAvatar, onClose } = props;
    const prebuiltRef = useRef<any>(null);
    const mediaViewRef = useRef<any>(null);
    const mediaPlayerRef = useRef<any>(null);
    const [showGiftVideo, setShowGiftVideo] = useState(false);
    const [showGifts, setShowGifts] = useState(false);
    const [giftQueue, setGiftQueue] = useState<{ senderName: string, targetName?: string, giftName: string, icon: string, isHost?: boolean }[]>([]);
    const [recentGift, setRecentGift] = useState<{ senderName: string, targetName?: string, giftName: string, icon: string, isHost?: boolean } | null>(null);
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
    const heartCounter = useRef(0);

    const isInPKRef = useRef(false);
    const hostScoreRef = useRef(0);
    const guestScoreRef = useRef(0);
    const streamHostIdRef = useRef<string | null>(null);
    const lastGiftTimestampRef = useRef(0); // Track last processed gift to avoid duplicates

    // ✅ Sync refs
    useEffect(() => { isInPKRef.current = isInPK; }, [isInPK]);
    useEffect(() => { hostScoreRef.current = hostScore; }, [hostScore]);
    useEffect(() => { guestScoreRef.current = guestScore; }, [guestScore]);
    useEffect(() => { streamHostIdRef.current = streamHostId; }, [streamHostId]);

    // Sync Toast and Video via the Queue
    useEffect(() => {
        if (giftQueue.length > 0 && !recentGift) {
            const nextGift = giftQueue[0];
            setRecentGift(nextGift);
            setGiftQueue(prev => prev.slice(1));

            // Trigger Video Sync
            setShowGiftVideo(true);
            // If already shown (view mounted), trigger animation manually
            if (showGiftVideo) {
                const gift = gifts.find(g => g.name === nextGift.giftName);
                if (gift) {
                    showGiftAnimation(gift.url);
                } else {
                    showGiftAnimation();
                }
            }
        }
    }, [giftQueue, recentGift, showGiftVideo]);

    // Auto-clear gift notification
    useEffect(() => {
        if (recentGift) {
            const timer = setTimeout(() => setRecentGift(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [recentGift]);

    const gifts = [
        { id: '1', name: 'Rose', icon: '🌹', points: 1, url: 'https://storage.zego.im/sdk-doc/Pics/zegocloud/oss/1.mp4' },
        { id: '2', name: 'Finger Heart', icon: '🫰', points: 5, url: 'https://storage.zego.im/sdk-doc/Pics/zegocloud/oss/2.mp4' },
        { id: '3', name: 'Perfume', icon: '🧴', points: 99, url: 'https://storage.zego.im/sdk-doc/Pics/zegocloud/oss/3.mp4' },
        { id: '4', name: 'Crown', icon: '👑', points: 299, url: 'https://storage.zego.im/sdk-doc/Pics/zegocloud/oss/4.mp4' },
    ];

    const sendGift = (gift: any) => {
        setShowGifts(false);

        // Show animation locally for the sender immediately via Queue
        setGiftQueue(prev => [...prev, {
            senderName: userName || 'You',
            giftName: gift.name,
            icon: gift.icon,
            isHost: false // Audience is not host
        }]);

        // Optimistically update totalLikes with gift points
        setTotalLikes(prev => prev + (gift.points || 1));
        if (streamHostIdRef.current) {
            setHostScore(prev => prev + (gift.points || 1));
        }

        // 1. Send Command (for overlay logic on host side)
        if (ZegoUIKit) {
            ZegoUIKit.sendInRoomCommand(JSON.stringify({
                type: 'gift',
                giftName: gift.name,
                icon: gift.icon,
                points: gift.points || 1, // New field
                userName: userName
            }), [], () => { });

            // 2. Send Chat Message (so it appears in the chat list like a comment)
            const chatMsg = `🎁 ${t ? t('sentA') || 'sent a' : 'sent a'} ${gift.name}! ${gift.icon}`;
            ZegoUIKit.sendInRoomMessage(chatMsg);
        }

        // 3. Local Feedback via Console
        console.log('Gift Sent:', gift.name);

        // 4. Update Firestore for reliable Sync
        if (channelId) {
            LiveSessionService.incrementGifts(channelId, gift.points || 1).catch(e => console.error('Gift Score Error:', e));

            // 5. Broadcast Gift for Real-time Animation
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
                        isHost: false
                    }]);
                }
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
                // Timer ended - winner should be synced from Firestore
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isInPK, pkEndTime]);

    // Gift Animation Logic (Official Zego Virtual Gift Engine)
    const showGiftAnimation = async (videoUrl?: string) => {
        if (!ZegoExpressEngine || !ZegoMediaPlayerResource) return;
        const url = videoUrl || 'https://storage.zego.im/sdk-doc/Pics/zegocloud/oss/1.mp4';

        try {
            if (!mediaPlayerRef.current) {
                mediaPlayerRef.current = await ZegoExpressEngine.instance().createMediaPlayer();

                mediaPlayerRef.current.on('mediaPlayerStateUpdate', (player: any, state: any, errorCode: number) => {
                    if (state === ZegoMediaPlayerState?.PlayEnded) {
                        console.log('🎬 Gift video finished');
                        setShowGiftVideo(false);
                    }
                });
            }

            // Give a small delay for the View to render before setting the player view
            setTimeout(() => {
                if (mediaViewRef.current && mediaPlayerRef.current) {
                    mediaPlayerRef.current.setPlayerView({
                        'reactTag': findNodeHandle(mediaViewRef.current),
                        'viewMode': 0, // Match user snippet
                        'backgroundColor': 'transparent', // Match user snippet
                        'alphaBlend': true // Vital for transparency
                    });

                    let resource = new ZegoMediaPlayerResource();
                    resource.loadType = ZegoMultimediaLoadType.FilePath;
                    resource.alphaLayout = ZegoAlphaLayoutType.Left; // Assuming Left-Right alpha
                    resource.filePath = url;

                    mediaPlayerRef.current.loadResourceWithConfig(resource).then((ret: any) => {
                        if (ret.errorCode === 0) {
                            console.log('▶️ Audience: Playing gift video');
                            mediaPlayerRef.current.start();
                        } else {
                            console.error('❌ Failed to load gift video:', ret.errorCode);
                            setShowGiftVideo(false);
                        }
                    });
                }
            }, 100);

        } catch (error) {
            console.error('Error playing gift animation:', error);
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
                        setTotalLikes(prev => prev + (data.points || 1)); // ✅ Add gift points to Total Likes
                        setGiftQueue(prev => [...prev, {
                            senderName: data.userName || 'Viewer',
                            giftName: data.giftName,
                            icon: data.icon,
                            isHost: (data.userName || '').includes('Host')
                        }]);
                    } else if (data.type === 'coupon_drop') {
                        setActiveCoupon(data);
                        const remaining = Math.max(0, Math.floor((data.endTime - Date.now()) / 1000));
                        setCouponTimeRemaining(remaining);
                    }
                } catch (e) {
                    console.error('Error parsing signaling command:', e);
                }
            });
            return () => { };
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
            <FlameCounter count={totalLikes} onPress={handleSendLike} top={isInPK ? 175 : 102} />

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
                            hostAvatarBuilder: CustomBuilder.hostAvatarBuilder,
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
                                    paddingVertical: 5,
                                    paddingHorizontal: 12,
                                    backgroundColor: isHostMsg ? 'rgba(239, 68, 68, 0.75)' : 'rgba(0,0,0,0.45)',
                                    borderRadius: 15,
                                    marginVertical: 2,
                                    maxWidth: '85%',
                                    borderWidth: 1,
                                    borderColor: isHostMsg ? 'rgba(255,255,255,0.3)' : 'transparent'
                                }}>
                                    <View>
                                        <Text style={{ fontSize: 13 }}>
                                            <Text style={{ color: isHostMsg ? '#FFD700' : '#A5F3FC', fontWeight: '800' }}>
                                                {senderName}:
                                            </Text>
                                            <Text style={{ color: '#fff', fontWeight: '600' }}> {message.message}</Text>
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
                        // Fallback: Check chat messages for gifts if command fails
                        messages.forEach((msg: any) => {
                            if (msg.message && msg.message.startsWith('🎁')) {
                                const gifts = [
                                    { id: 'rose', name: 'Rose', icon: '🌹', nameFr: 'Rose' },
                                    { id: 'heart', name: 'Finger Heart', icon: '🫰', nameFr: 'Cœur' },
                                    { id: 'perfume', name: 'Perfume', icon: '🧴', nameFr: 'Parfum' },
                                    { id: 'crown', name: 'Crown', icon: '👑', nameFr: 'Couronne' },
                                ];

                                // Ignore own chat messages in listener (already added to queue in sendGift)
                                if (msg.sender?.userID === userId) return;

                                const foundGift = gifts.find(g => msg.message.includes(g.name) || (g.nameFr && msg.message.includes(g.nameFr)));
                                if (foundGift) {
                                    setGiftQueue(prev => [...prev, {
                                        senderName: msg.sender?.userName || 'User',
                                        giftName: foundGift.name,
                                        icon: foundGift.icon,
                                        isHost: msg.sender?.userName?.includes('Host')
                                    }]);
                                }
                            }
                        });
                    }
                }}
                {...(ZIM ? { plugins: [ZIM] } : {})}
            />

            {/* FULL SCREEN GIFT VIDEO OVERLAY */}
            {showGiftVideo && ZegoTextureView && (
                <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
                    <ZegoTextureView
                        // @ts-ignore
                        ref={mediaViewRef}
                        collapsable={false}
                        style={{ width: '100%', height: '100%' }}
                        onLayout={() => {
                            const gift = gifts.find(g => g.name === recentGift?.giftName);
                            showGiftAnimation(gift?.url);
                        }}
                    />
                </View>
            )}

            {/* TikTok Style Gift Modal */}
            <Modal
                visible={showGifts}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowGifts(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                    activeOpacity={1}
                    onPress={() => setShowGifts(false)}
                >
                    <View style={{
                        backgroundColor: '#121218',
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        padding: 20,
                        minHeight: 250
                    }}>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 20, textAlign: 'center' }}>
                            {t('sendAGift')}
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {gifts.map(gift => (
                                <TouchableOpacity
                                    key={gift.id}
                                    style={{ alignItems: 'center', marginRight: 25 }}
                                    onPress={() => sendGift(gift)}
                                >
                                    <View style={{
                                        width: 70,
                                        height: 70,
                                        borderRadius: 35,
                                        backgroundColor: '#1C1C26',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: 10,
                                        borderWidth: 1,
                                        borderColor: '#333'
                                    }}>
                                        <Text style={{ fontSize: 32 }}>{gift.icon}</Text>
                                    </View>
                                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{gift.name}</Text>
                                    <Text style={{ color: '#FF0066', fontSize: 10, fontWeight: '900' }}>{gift.points} 💎</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Audience Gift Alert Overlay (BIG & ANIMATED) */}
            {recentGift && (
                <Animatable.View
                    animation="bounceIn"
                    duration={800}
                    style={{
                        position: 'absolute',
                        top: '40%',
                        alignSelf: 'center',
                        alignItems: 'center',
                        zIndex: 2000,
                    }}
                >
                    <Animatable.View
                        animation="tada"
                        iterationCount="infinite"
                        duration={2000}
                    >
                        <Text style={{ fontSize: 120, textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10 }}>
                            {recentGift.icon}
                        </Text>
                    </Animatable.View>

                    <Animatable.View
                        animation="fadeInUp"
                        delay={300}
                        style={{
                            backgroundColor: 'rgba(255, 0, 102, 0.95)',
                            paddingHorizontal: 25,
                            paddingVertical: 12,
                            borderRadius: 30,
                            marginTop: 20,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            borderWidth: 2,
                            borderColor: '#fff',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.5,
                            shadowRadius: 15,
                            elevation: 10
                        }}
                    >
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ textAlign: 'center' }}>
                                <Text style={{ color: recentGift.isHost ? '#FFD700' : '#fff', fontWeight: '900', fontSize: 18 }}>
                                    {recentGift.senderName}
                                </Text>
                                {recentGift.targetName && (
                                    <Text style={{ color: '#fff', fontSize: 16 }}> ➔ {recentGift.targetName}</Text>
                                )}
                            </Text>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center', opacity: 0.9 }}>
                                {t ? t('sentA') || 'sent a' : 'sent a'} {recentGift.giftName}!
                            </Text>
                        </View>
                    </Animatable.View>
                </Animatable.View>
            )}

            {/* FLOATING ACTION BUTTONS */}
            <View style={{ position: 'absolute', bottom: 120, right: 15, gap: 12, alignItems: 'center', zIndex: 1000 }}>
                {/* Floating Heart Animations */}
                <View style={{ position: 'absolute', bottom: 50, right: 0, width: 60, height: 400, pointerEvents: 'none' }}>
                    {floatingHearts.map(heart => (
                        <FloatingHeart key={heart.id} id={heart.id} x={heart.x} />
                    ))}
                </View>

                {/* Share Button */}
                <TouchableOpacity
                    onPress={() => Alert.alert("Share", "Sharing live stream...")}
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: 'rgba(255,255,255,0.7)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 5,
                        elevation: 8
                    }}
                >
                    <Share2 size={20} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleSendLike}
                    activeOpacity={0.7}
                    style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: 'rgba(255,0,102,0.85)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: '#fff',
                        shadowColor: '#FF0066',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.4,
                        shadowRadius: 10,
                        elevation: 10
                    }}
                >
                    <Heart size={24} color="#fff" fill="#fff" />
                </TouchableOpacity>

                {/* PINK GIFT BUTTON */}
                <TouchableOpacity
                    onPress={() => setShowGifts(true)}
                    activeOpacity={0.7}
                    style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: '#FFD700',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#FFD700',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.4,
                        shadowRadius: 10,
                        elevation: 10,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }}
                >
                    <Gift size={24} color="#000" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            {/* LIVE COUPON OVERLAY - Horizontal Ticket Style */}
            {activeCoupon && (
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

                            {/* Left Side: Info */}
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
                                            Alert.alert(t('success'), t('couponCopied'));
                                        } else {
                                            Alert.alert(t('couponCode'), activeCoupon.code);
                                        }
                                    }}
                                    activeOpacity={0.8}
                                    style={{ width: '100%', borderRadius: 4, overflow: 'hidden' }}
                                >
                                    <LinearGradient
                                        colors={['#F59E0B', '#D97706']}
                                        style={{ paddingVertical: 4, alignItems: 'center' }}
                                    >
                                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 8 }}>{t('claimCoupon').toUpperCase()}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
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
