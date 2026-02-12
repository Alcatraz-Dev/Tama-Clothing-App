import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Alert, Text, TouchableOpacity, Image, ActionSheetIOS, Platform, findNodeHandle, Modal, ScrollView, TextInput, ActivityIndicator, Animated, Easing } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, Swords, Sparkles, MoreHorizontal, X, Share2, Flame } from 'lucide-react-native';
import Constants from 'expo-constants';
import { CustomBuilder } from '../utils/CustomBuilder';
import { LiveSessionService } from '../services/LiveSessionService';
import { FlameCounter } from '../components/FlameCounter';

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
};

export default function HostLiveScreen(props: Props) {
    const { channelId, userId, userName, brandId, collabId, hostAvatar, onClose, t } = props;
    const prebuiltRef = useRef<any>(null);
    const mediaViewRef = useRef<any>(null);
    const mediaPlayerRef = useRef<any>(null);
    const [blockedApplying, setBlockedApplying] = useState<string[]>([]);
    const [showGiftVideo, setShowGiftVideo] = useState(false);
    // Gift Queue System
    const [giftQueue, setGiftQueue] = React.useState<{ senderName: string, targetName?: string, giftName: string, icon: string, isHost?: boolean }[]>([]);
    const [recentGift, setRecentGift] = React.useState<{ senderName: string, targetName?: string, giftName: string, icon: string, isHost?: boolean } | null>(null);
    const [showGifts, setShowGifts] = useState(false);
    const [roomUsers, setRoomUsers] = useState<any[]>([]);
    const [selectedTargetUser, setSelectedTargetUser] = useState<any>(null);
    const [totalLikes, setTotalLikes] = useState(0);

    // PK Battle State
    const [isInPK, setIsInPK] = useState(false);
    const isInPKRef = useRef(false);
    const [hostScore, setHostScore] = useState(0);
    const hostScoreRef = useRef(0);
    const [guestScore, setGuestScore] = useState(0);
    const guestScoreRef = useRef(0);
    const [opponentName, setOpponentName] = useState('Opponent');
    const [pkBattleId, setPkBattleId] = useState<string | null>(null);
    const [showPKInviteModal, setShowPKInviteModal] = useState(false);
    const [targetHostId, setTargetHostId] = useState('');
    const [liveSessions, setLiveSessions] = useState<any[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [opponentChannelId, setOpponentChannelId] = useState<string | null>(null);

    // PK Timer State
    const [pkDuration, setPkDuration] = useState(180); // Default 3 minutes in seconds
    const [pkTimeRemaining, setPkTimeRemaining] = useState(0);
    const [pkEndTime, setPkEndTime] = useState<number | null>(null);
    const [pkWinner, setPkWinner] = useState<string | null>(null);
    const [showPKResult, setShowPKResult] = useState(false);

    // ✅ Sync PK state periodically for late joiners
    // ✅ Keep refs in sync for signaling listeners
    const totalLikesRef = useRef(0);
    const pkStartLikesRef = useRef(0); // Baseline for PK Score
    const lastGiftTimestampRef = useRef(0); // Track last processed gift to avoid duplicates

    // Capture baseline likes when PK Starts
    useEffect(() => {
        if (isInPK) {
            pkStartLikesRef.current = totalLikes;
            console.log('🏁 PK Started. Baseline Likes:', totalLikes);
            setHostScore(0); // Visual reset immediately
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

    // Cross-Room Sync: Push My Score Updates
    useEffect(() => {
        if (isInPK && channelId) {
            LiveSessionService.updatePKScore(channelId, hostScore);
        }
    }, [hostScore, isInPK, channelId]);

    // ✅ Reliable Sync: Listen to my OWN session for Total Likes (written by Audience via Firestore)
    useEffect(() => {
        if (!channelId) return;
        const unsubscribe = LiveSessionService.subscribeToSession(channelId, (session) => {
            if (session) {
                if (session.totalLikes !== undefined) {
                    setTotalLikes(session.totalLikes);
                    // If in PK, my score is derived from total engagement (likes + gifts points)
                    // Subtract baseline to start from 0
                    if (isInPKRef.current) {
                        const currentScore = Math.max(0, session.totalLikes - pkStartLikesRef.current);
                        setHostScore(currentScore);
                    }
                }

                // ✅ Sync Gift Animations from Firestore (Real-time for all viewers including host)
                if (session.lastGift && session.lastGift.timestamp > lastGiftTimestampRef.current) {
                    console.log('🎁 Host: Gift Animation Sync from Firestore:', session.lastGift);
                    lastGiftTimestampRef.current = session.lastGift.timestamp;

                    // Add to gift queue to show animation
                    setGiftQueue(prev => [...prev, {
                        senderName: session.lastGift!.senderName,
                        giftName: session.lastGift!.giftName,
                        icon: session.lastGift!.icon,
                        isHost: false
                    }]);
                }
            }
        });
        return () => unsubscribe();
    }, [channelId]);

    useEffect(() => { isInPKRef.current = isInPK; }, [isInPK]);
    useEffect(() => { hostScoreRef.current = hostScore; }, [hostScore]);
    useEffect(() => { guestScoreRef.current = guestScore; }, [guestScore]);
    useEffect(() => { totalLikesRef.current = totalLikes; }, [totalLikes]);

    // Periodically broadcast state to keep audience in sync (Zego backup)
    useEffect(() => {
        if (!ZegoUIKit) return;
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

    // ✅ NEW: Persist Full PK State to Firestore for Audience Sync
    useEffect(() => {
        if (channelId) {
            const pkState: any = {
                isActive: isInPK,
                hostScore: hostScore,
                guestScore: guestScore,
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

            // Include winner if battle ended
            if (pkWinner) {
                pkState.winner = pkWinner;
            }

            LiveSessionService.updatePKState(channelId, pkState).catch(e => console.error('PK State Sync Error:', e));
        }
    }, [isInPK, hostScore, guestScore, opponentName, opponentChannelId, channelId, pkDuration, pkEndTime, pkWinner, userName]);

    // Force Sync on PK Start
    useEffect(() => {
        if (isInPK && ZegoUIKit) {
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


    const gifts = [
        { id: '1', name: 'Rose', icon: '🌹', points: 1, url: 'https://storage.zego.im/sdk-doc/Pics/zegocloud/oss/1.mp4' },
        { id: '2', name: 'Finger Heart', icon: '🫰', points: 5, url: 'https://storage.zego.im/sdk-doc/Pics/zegocloud/oss/2.mp4' },
        { id: '3', name: 'Perfume', icon: '🧴', points: 99, url: 'https://storage.zego.im/sdk-doc/Pics/zegocloud/oss/3.mp4' },
        { id: '4', name: 'Crown', icon: '👑', points: 299, url: 'https://storage.zego.im/sdk-doc/Pics/zegocloud/oss/4.mp4' },
    ];

    const updatePKScore = (giftName: string) => {
        if (!isInPKRef.current) return;
        const gift = gifts.find(g => g.name === giftName);
        if (gift && gift.points) {
            const pointsToAdd = gift.points;
            setHostScore(prev => prev + pointsToAdd);
            console.log(`📈 PK Score Update: adding ${pointsToAdd} points for ${giftName}`);

            if (ZegoUIKit) {
                // Broadcast that I (the current host) got points
                ZegoUIKit.sendInRoomCommand(JSON.stringify({
                    type: 'PK_VOTE',
                    points: pointsToAdd,
                    hostId: userId
                }), [], () => { });
            }
        }
    };

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

    const sendGift = (gift: any) => {
        setShowGifts(false);

        const targetName = selectedTargetUser?.userName || 'the Room';

        // 1. Play animation locally for the Host
        setGiftQueue(prev => [...prev, {
            senderName: userName || 'Host',
            targetName: targetName,
            giftName: gift.name,
            icon: gift.icon,
            isHost: true
        }]);

        // 2. Broadcast to everyone
        if (ZegoUIKit) {
            ZegoUIKit.sendInRoomCommand(JSON.stringify({
                type: 'gift',
                giftName: gift.name,
                icon: gift.icon,
                points: gift.points || 1, // Include points
                userName: `Host (${userName})`,
                targetName: targetName
            }), [], () => { });

            const chatMsg = `🎁 Host sent a ${gift.name} to ${targetName}! ${gift.icon}`;
            ZegoUIKit.sendInRoomMessage(chatMsg);

            // 3. Update PK Score if active
            updatePKScore(gift.name);
        }
    };

    // 1. Process Gift Queue (Only focuses on moving items from queue to active)
    useEffect(() => {
        if (!recentGift && giftQueue.length > 0) {
            const nextGift = giftQueue[0];
            setGiftQueue(prev => prev.slice(1));
            setRecentGift(nextGift);

            // Sync Video
            setShowGiftVideo(true);

            // If the video overlay is already mounted, trigger animation immediately
            if (showGiftVideo) {
                const gift = gifts.find(g => g.name === nextGift.giftName);
                if (gift) {
                    showGiftAnimation(gift.url);
                } else {
                    showGiftAnimation(); // Fallback
                }
            }
        }
    }, [recentGift, giftQueue, showGiftVideo, gifts]);

    // 2. Auto-clear active gift (Isolated timer logic)
    useEffect(() => {
        if (recentGift) {
            const timer = setTimeout(() => {
                setRecentGift(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [recentGift]);

    useEffect(() => {
        if (hostAvatar && userId) {
            CustomBuilder.registerAvatar(userId, hostAvatar);
        }
    }, [hostAvatar, userId]);

    // AUTO-START Firestore session on mount (since we skip the start button)
    useEffect(() => {
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

        return () => unsubscribeLive();
    }, []);

    // Handle session lifecycle
    const startFirestoreSession = async () => {
        try {
            if (collabId) {
                await LiveSessionService.startCollabSession(channelId, userName, userId, collabId, brandId, hostAvatar);
            } else {
                await LiveSessionService.startSession(channelId, userName, brandId, hostAvatar, userId);
            }
            console.log('🎬 Firestore session started');
        } catch (error) {
            console.error('Error starting Firestore session:', error);
        }
    };


    // Listen for In-Room Commands (Gifts) using ZegoUIKit core signaling plugin
    // This serves as the primary or backup listener for the Host to receive gift commands
    useEffect(() => {
        if (ZegoUIKit) {
            const callbackID = 'HostGiftListener';
            console.log('🎧 Registering HostGiftListener with ZegoUIKit');

            ZegoUIKit.getSignalingPlugin().onInRoomCommandMessageReceived(callbackID, (messageData: any) => {
                const { roomID, message, senderUserID, timestamp } = messageData;
                console.log(`📬 HostGiftListener: Command from ${senderUserID}: ${message}`);

                try {
                    const data = JSON.parse(message);
                    if (data.type === 'gift') {
                        console.log('🎁 Gift Received via HostGiftListener:', data.giftName);
                        setShowGiftVideo(true);
                        setTotalLikes(prev => prev + (data.points || 1)); // ✅ Add gift points to Total Likes
                        setGiftQueue(prev => [...prev, {
                            senderName: data.userName || 'User',
                            targetName: data.targetName,
                            giftName: data.giftName,
                            icon: data.icon,
                            isHost: data.userName?.includes('Host')
                        }]);

                        // IF ACTIVE PK: Host who receives gift updates their score
                        if (isInPKRef.current) {
                            updatePKScore(data.giftName);
                        }
                    } else if (data.type === 'PK_VOTE') {
                        // Standardized score update
                        if (data.hostId === userId) {
                            setHostScore(prev => prev + (data.points || 0));
                        } else {
                            setGuestScore(prev => prev + (data.points || 0));
                        }
                    } else if (data.type === 'PK_LIKE') {
                        console.log('👍 PK LIKE Received on Host');
                        const likePoints = data.count || 1;
                        setTotalLikes(prev => prev + likePoints);

                        if (data.hostId === userId) {
                            setHostScore(prev => prev + likePoints);
                        } else {
                            console.log('⚠️ Like attributed to Guest (HostId mismatch)');
                            setGuestScore(prev => prev + likePoints);
                        }
                    } else if (data.type === 'PK_SCORE_SYNC') {
                        // Periodic absolute sync
                        setHostScore(data.hostScore);
                        setGuestScore(data.guestScore);
                    } else if (data.type === 'PK_BATTLE_STOP') {
                        setIsInPK(false);
                        setPkBattleId(null);
                        Alert.alert("PK Battle", "The opponent has stopped the battle.");
                    }
                } catch (e) {
                    console.error('HostGiftListener JSON Parse Error:', e);
                }
            });

            // HANDLE PK INVITATIONS (Manual Implementation)
            ZegoUIKit.getSignalingPlugin().onInvitationReceived(callbackID, ({ callID, type, inviter, data }: any) => {
                if (type === 10) { // Custom PK Invitation Type
                    const pkData = JSON.parse(data);
                    console.log('⚔️ Incoming PK Request from:', pkData.inviterName);

                    const duration = pkData.duration || 180; // Default 3 minutes
                    const durationLabel = duration === 180 ? '3 minutes' :
                        duration === 300 ? '5 minutes' :
                            duration === 420 ? '7 minutes' :
                                duration === 600 ? '10 minutes' : `${duration}s`;

                    Alert.alert(
                        "PK Battle Request",
                        `${pkData.inviterName} wants to start a ${durationLabel} PK battle!`,
                        [
                            {
                                text: "Reject",
                                style: "cancel",
                                onPress: () => {
                                    ZegoUIKit.getSignalingPlugin().refuseInvitation(inviter.id);
                                }
                            },
                            {
                                text: "Accept",
                                onPress: () => {
                                    // Pass our name back to the inviter
                                    ZegoUIKit.getSignalingPlugin().acceptInvitation(inviter.id, JSON.stringify({
                                        accepterName: userName,
                                        channelId: channelId, // Send my channel ID back
                                        duration: duration,
                                        endTime: pkData.endTime
                                    }));

                                    setIsInPK(true);
                                    setOpponentName(pkData.inviterName || 'Opponent');
                                    setHostScore(0);
                                    setGuestScore(0);
                                    setPkBattleId(callID);
                                    setPkDuration(duration);
                                    setPkEndTime(pkData.endTime || Date.now() + (duration * 1000));
                                    setPkTimeRemaining(duration);
                                    setOpponentChannelId(pkData.roomID); // Store inviter's channel ID

                                    console.log(`⏱️ PK Battle Accepted! Duration: ${duration}s`);

                                    // Notify current room that PK has started
                                    ZegoUIKit.sendInRoomCommand(JSON.stringify({
                                        type: 'PK_START',
                                        opponentName: pkData.inviterName,
                                        hostName: userName,
                                        hostId: userId,
                                        hostScore: 0,
                                        guestScore: 0,
                                        duration: duration,
                                        endTime: pkData.endTime
                                    }), [], () => { });
                                }
                            }
                        ]
                    );
                }
            });

            ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID, ({ invitee, data }: any) => {
                // If we sent a PK request and it was accepted
                setIsInPK(true);

                let oppName = invitee?.userName || invitee?.name || 'Opponent';
                let duration = pkDuration; // Use current selection as fallback
                let endTime = Date.now() + (duration * 1000);

                try {
                    if (data) {
                        const parsedData = JSON.parse(data);
                        if (parsedData.accepterName) {
                            oppName = parsedData.accepterName;
                        }
                        if (parsedData.channelId) {
                            setOpponentChannelId(parsedData.channelId); // Store opponent channel ID for sync
                        }
                        // Extract timer info from original invitation (stored in acceptance)
                        if (parsedData.duration) {
                            duration = parsedData.duration;
                            setPkDuration(duration);
                        }
                        if (parsedData.endTime) {
                            endTime = parsedData.endTime;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing invitation accept data:', e);
                }

                setOpponentName(oppName);
                setHostScore(0);
                setGuestScore(0);
                setPkEndTime(endTime);
                setPkTimeRemaining(duration);

                console.log(`⏱️ PK Battle Started! Duration: ${duration}s, Ends at: ${new Date(endTime).toLocaleTimeString()}`);

                // Broadcast to existing room
                ZegoUIKit.sendInRoomCommand(JSON.stringify({
                    type: 'PK_START',
                    opponentName: oppName,
                    hostName: userName,
                    hostId: userId,
                    hostScore: 0,
                    guestScore: 0,
                    duration: duration,
                    endTime: endTime
                }), [], () => { });
                Alert.alert("Success", "PK Battle Started!");
            });

            ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID, ({ invitee, data }: any) => {
                Alert.alert("Declined", "The host declined your PK challenge.");
            });

            // Cleanup on unmount
            return () => {
                // Not strictly necessary as callbackID overwrites, but good practice if API supports removal
            };
        }
    }, [userId]);

    const endFirestoreSession = async () => {
        try {
            await LiveSessionService.endSession(channelId);
            console.log('🎬 Firestore session ended');
        } catch (error) {
            console.error('Error ending Firestore session:', error);
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
                        onPress={onClose}
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


    useEffect(() => {
        const callbackID = 'HostTextGiftFallback';

        // Use the config prop callback style if possible, but since we are using core listener:
        // Note: The signature usually provides an array of messages.
        ZegoUIKit.getSignalingPlugin().onInRoomTextMessageReceived(callbackID, (messages: any[]) => {
            // Handle array of messages
            if (Array.isArray(messages)) {
                messages.forEach((msg: any) => {
                    if (msg.message && msg.message.startsWith('🎁')) {
                        console.log('💬 Host Text fallback: Gift detected:', msg.message);
                        setShowGiftVideo(true);

                        // Also parse for queue
                        const gifts = [
                            { id: 'rose', name: 'Rose', icon: '🌹', nameFr: 'Rose' },
                            { id: 'heart', name: 'Finger Heart', icon: '🫰', nameFr: 'Cœur' },
                            { id: 'perfume', name: 'Perfume', icon: '🧴', nameFr: 'Parfum' },
                            { id: 'crown', name: 'Crown', icon: '👑', nameFr: 'Couronne' },
                        ];
                        const foundGift = gifts.find(g => msg.message.includes(g.name) || (g.nameFr && msg.message.includes(g.nameFr)));

                        if (foundGift) {
                            setGiftQueue(prev => [...prev, {
                                senderName: msg.sender?.userName || 'Viewer',
                                giftName: foundGift.name,
                                icon: foundGift.icon,
                                isHost: msg.sender?.userName?.includes('Host')
                            }]);
                        }
                    }
                });
            }
        });

        return () => {
            ZegoUIKit.getSignalingPlugin().onInRoomTextMessageReceived(callbackID, () => { });
            if (mediaPlayerRef.current && ZegoExpressEngine) {
                ZegoExpressEngine.instance().destroyMediaPlayer(mediaPlayerRef.current);
                mediaPlayerRef.current = null;
            }
        };
    }, []);
    // Gift Animation Logic (Official Zego Virtual Gift Engine)
    const showGiftAnimation = async (videoUrl?: string) => {
        if (!ZegoExpressEngine || !ZegoMediaPlayerResource) return;
        const url = videoUrl || 'https://storage.zego.im/sdk-doc/Pics/zegocloud/oss/1.mp4';

        try {
            if (!mediaPlayerRef.current) {
                mediaPlayerRef.current = await ZegoExpressEngine.instance().createMediaPlayer();

                mediaPlayerRef.current.on('mediaPlayerStateUpdate', (player: any, state: any, errorCode: number) => {
                    console.log('🎥 Media Player State:', state);
                    if (state === 3 || state === ZegoMediaPlayerState?.PlayEnded) { // PlayEnded
                        console.log('🎬 Gift video finished');
                        setShowGiftVideo(false);
                    }
                });
            }

            // Safety check: force hide after 10s if state doesn't update
            setTimeout(() => setShowGiftVideo(false), 10000);

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


    return (
        <View style={styles.container}>
            {/* Flame Counter */}
            <FlameCounter count={totalLikes} top={isInPK ? 185 : 115} />

            {/* PK BATTLE SCORE BAR - Premium Look */}
            {isInPK && (
                <Animatable.View
                    animation="slideInDown"
                    duration={800}
                    style={{
                        position: 'absolute',
                        top: 80,
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
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{userName?.toUpperCase() || 'HOST'}</Text>
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
                                {pkWinner === 'Draw' ? 'Battle Ended' : 'PK Battle Winner'}
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
                                    {pkWinner === 'Draw' ? "It's a Draw!" : pkWinner}
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
                                        {userName?.toUpperCase()}
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
                    role: ZegoLiveStreamingRole?.Host ?? 0,
                    confirmStartLive: true, // Show preview so styling applies
                    showStartLiveButton: true,
                    startLiveButtonBuilder: (onClick: any) => (
                        <TouchableOpacity
                            onPress={onClick}
                            style={{
                                backgroundColor: '#EF4444',
                                width: '80%',
                                maxWidth: 300,
                                height: 55,
                                borderRadius: 30,
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: '#EF4444',
                                shadowOpacity: 0.4,
                                shadowRadius: 10,
                                shadowOffset: { width: 0, height: 4 },
                                elevation: 8,
                                marginBottom: 40
                            }}
                        >
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                                Start Live
                            </Text>
                        </TouchableOpacity>
                    ),
                    onStartLiveButtonPressed: () => {
                        console.log('🎬 Host Pressed Start!');
                        startFirestoreSession();
                    },
                    onLiveStreamingEnded: () => {
                        console.log('🎬 Live streaming ended by SDK');
                        endFirestoreSession();
                    },
                    onLeaveLiveStreaming: () => {
                        console.log('🎬 Host leaving live');
                        endFirestoreSession();
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
                            hostAvatarBuilder: CustomBuilder.hostAvatarBuilder,
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
                                'Cancel',
                                `🚫 Remove ${targetName}`,
                                isCoHost ? `📵 Stop Co-hosting` : `🤝 Invite to Co-host`,
                                isCoHost ? `🔇 Mute ${targetName}` : null,
                                isBlocked ? `✅ Unblock Apply` : `⛓️ Block Apply`
                            ].filter(Boolean) as string[];

                            const handleAction = (selectedText: string) => {
                                if (!selectedText || selectedText === 'Cancel') return;

                                if (selectedText.includes('Remove')) {
                                    Alert.alert('Confirm Disconnect', `Are you sure you want to remove ${targetName} from the room?`, [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Remove', style: 'destructive', onPress: () => {
                                                const ZegoRN = require('@zegocloud/zego-uikit-rn').default;
                                                if (ZegoRN) ZegoRN.removeUserFromRoom([item.userID]);
                                            }
                                        }
                                    ]);
                                } else if (selectedText.includes('Invite to Co-host')) {
                                    if (ZegoUIKit) {
                                        ZegoUIKit.getSignalingPlugin().sendInvitation([item.userID], 60, 2, JSON.stringify({ "inviter_name": userName, "type": 2 }))
                                            .then(() => Alert.alert("Success", `Invitation sent to ${targetName}`))
                                            .catch(() => Alert.alert("Info", `Sending invitation...`));
                                    }
                                } else if (selectedText.includes('Stop Co-hosting')) {
                                    if (ZegoUIKit) {
                                        ZegoUIKit.sendInRoomCommand(JSON.stringify({ type: 'stop_cohosting', target: item.userID }), [item.userID], () => { });
                                        Alert.alert("Success", `Stopped co-hosting for ${targetName}`);
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
                    onInRoomCommandReceived: (messageData: any) => {
                        // Reliable redundancy: Catch commands here too (matching Audience)
                        try {
                            const data = typeof messageData.message === 'string' ? JSON.parse(messageData.message) : messageData.message;
                            if (data.type === 'gift') {
                                console.log('🎁 Host received gift command:', data.giftName);
                                setGiftQueue(prev => [...prev, {
                                    senderName: data.userName || 'User',
                                    targetName: data.targetName,
                                    giftName: data.giftName,
                                    icon: data.icon,
                                    isHost: (data.userName || '').trim().includes('Host')
                                }]);

                                // PK Score Update
                                updatePKScore(data.giftName);
                            }
                        } catch (e) {
                            console.log('Error parsing host command:', e);
                        }
                    },
                    onWindowMinimized: () => {
                        onClose();
                    },



                    onInRoomTextMessageReceived: (messages: any[]) => {
                        // Fallback: Check chat messages for gifts if command fails
                        messages.forEach((msg: any) => {
                            if (msg.message && msg.message.startsWith('🎁')) {
                                console.log('💬 Gift message text detected:', msg.message);
                                const gifts = [
                                    { id: 'rose', name: 'Rose', icon: '🌹', nameFr: 'Rose' },
                                    { id: 'heart', name: 'Finger Heart', icon: '🫰', nameFr: 'Cœur' },
                                    { id: 'perfume', name: 'Perfume', icon: '🧴', nameFr: 'Parfum' },
                                    { id: 'crown', name: 'Crown', icon: '👑', nameFr: 'Couronne' },
                                ];

                                // Ignore own chat fallback
                                if (msg.sender?.userID === userId) return;

                                const foundGift = gifts.find(g => msg.message.includes(g.name) || (g.nameFr && msg.message.includes(g.nameFr)));
                                if (foundGift) {
                                    // Push to Queue, avoid direct setRecentGift overwrite
                                    setGiftQueue(prev => {
                                        return [...prev, {
                                            senderName: msg.sender?.userName || 'Viewer',
                                            giftName: foundGift.name,
                                            icon: foundGift.icon,
                                            isHost: msg.sender?.userName?.includes('Host')
                                        }];
                                    });
                                    // Trigger Video (Fallback in config)
                                    setShowGiftVideo(true);

                                    // PK Score Update
                                    updatePKScore(foundGift.name);
                                }
                            }
                        });
                    }
                }}
                plugins={ZIM ? [ZIM] : []}
            />

            {/* ALPHA VIDEO OVERLAY */}
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

            {/* Host Gift Alert Overlay (BIG & ANIMATED) - Matches Audience Screen */}
            {recentGift && (
                <Animatable.View
                    animation="bounceIn"
                    duration={800}
                    style={{
                        position: 'absolute',
                        top: '40%', // Align with Audience screen
                        alignSelf: 'center', // Center horizontally
                        alignItems: 'center',
                        zIndex: 10000,
                        elevation: 10000,
                        backgroundColor: 'transparent'
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

            {/* Host Gift Modal with User Selection */}
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
                        maxHeight: '60%'
                    }}>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 15, textAlign: 'center' }}>
                            SEND GIFT TO PARTICIPANT
                        </Text>

                        {/* User Selection List */}
                        <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 10, fontWeight: '700' }}>SELECT RECIPIENT:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                            {roomUsers.length === 0 ? (
                                <Text style={{ color: '#666', fontSize: 14 }}>No other participants yet...</Text>
                            ) : (
                                roomUsers.map(user => (
                                    <TouchableOpacity
                                        key={user.userID}
                                        onPress={() => setSelectedTargetUser(user)}
                                        style={{
                                            paddingHorizontal: 15,
                                            paddingVertical: 8,
                                            borderRadius: 20,
                                            backgroundColor: selectedTargetUser?.userID === user.userID ? '#FF0066' : '#252530',
                                            marginRight: 10,
                                            borderWidth: 1,
                                            borderColor: selectedTargetUser?.userID === user.userID ? '#fff' : '#444'
                                        }}
                                    >
                                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{user.userName}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>

                        {/* Gift Selection */}
                        <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 10, fontWeight: '700' }}>SELECT GIFT:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {gifts.map(gift => (
                                <TouchableOpacity
                                    key={gift.id}
                                    style={{ alignItems: 'center', marginRight: 25, opacity: roomUsers.length === 0 ? 0.5 : 1 }}
                                    onPress={() => roomUsers.length > 0 && sendGift(gift)}
                                    disabled={roomUsers.length === 0}
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
                                        borderColor: selectedTargetUser ? '#FF0066' : '#333'
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

            {/* FLOATING HOST CONTROLS - Moved to bottom right */}
            <View style={{ position: 'absolute', bottom: 100, right: 15, gap: 12, alignItems: 'center', zIndex: 1000 }}>
                {/* PK Toggle Button */}
                <TouchableOpacity
                    onPress={() => setShowPKInviteModal(true)}
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        backgroundColor: isInPK ? '#3B82F6' : 'rgba(0,0,0,0.4)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: isInPK ? '#fff' : 'rgba(255,255,255,0.6)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 5
                    }}
                >
                    <Swords size={18} color="#fff" />
                </TouchableOpacity>

                {/* Gift Button for Host */}
                <TouchableOpacity
                    onPress={openGiftModal}
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        backgroundColor: '#FF0066',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: '#fff',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 5
                    }}
                >
                    <Gift size={18} color="#fff" strokeWidth={2.5} />
                </TouchableOpacity>

                {/* Beauty Toggle Button */}
                <TouchableOpacity
                    onPress={() => Alert.alert("Beauty", "Beauty Filters toggled!")}
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.6)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 5
                    }}
                >
                    <Sparkles size={18} color="#fff" />
                </TouchableOpacity>

                {/* Share Button as requested */}
                <TouchableOpacity
                    onPress={() => Alert.alert("Share", "Sharing live stream...")}
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.6)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 5
                    }}
                >
                    <Share2 size={18} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* PK Invite Modal */}
            <Modal
                visible={showPKInviteModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPKInviteModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#1C1C26', borderRadius: 20, padding: 25, width: '85%', maxWidth: 400 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>⚔️ PK Battle</Text>
                            <TouchableOpacity onPress={() => setShowPKInviteModal(false)}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {isInPK ? (
                            <View>
                                <Text style={{ color: '#ccc', marginBottom: 20, textAlign: 'center' }}>Battle in progress...</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        // End PK Battle manually
                                        setIsInPK(false);
                                        setPkBattleId(null);
                                        ZegoUIKit.sendInRoomCommand(JSON.stringify({ type: 'PK_BATTLE_STOP' }), [], () => { });
                                        setShowPKInviteModal(false);
                                    }}
                                    style={{ backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>STOP BATTLE</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View>
                                {/* Duration Selector */}
                                <Text style={{ color: '#888', marginBottom: 10, fontSize: 13, fontWeight: '600' }}>Battle Duration:</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                                    {[
                                        { label: '3m', value: 180 },
                                        { label: '5m', value: 300 },
                                        { label: '7m', value: 420 },
                                        { label: '10m', value: 600 }
                                    ].map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            onPress={() => setPkDuration(option.value)}
                                            style={{
                                                flex: 1,
                                                marginHorizontal: 4,
                                                paddingVertical: 10,
                                                borderRadius: 10,
                                                backgroundColor: pkDuration === option.value ? '#3B82F6' : '#2A2A35',
                                                borderWidth: 1,
                                                borderColor: pkDuration === option.value ? '#60A5FA' : '#333',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Text style={{
                                                color: pkDuration === option.value ? '#fff' : '#888',
                                                fontWeight: pkDuration === option.value ? 'bold' : '600',
                                                fontSize: 14
                                            }}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={{ color: '#888', marginBottom: 15, fontSize: 13, fontWeight: '600' }}>Active Hosts:</Text>

                                {loadingSessions ? (
                                    <ActivityIndicator color="#3B82F6" style={{ marginVertical: 20 }} />
                                ) : liveSessions.length > 0 ? (
                                    <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
                                        {liveSessions.map((session) => (
                                            <TouchableOpacity
                                                key={session.channelId}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    backgroundColor: '#2A2A35',
                                                    padding: 12,
                                                    borderRadius: 15,
                                                    marginBottom: 10,
                                                    borderWidth: 1,
                                                    borderColor: '#333'
                                                }}
                                                onPress={() => {
                                                    const targetId = session.hostId || session.channelId;
                                                    if (ZegoUIKit && targetId) {
                                                        console.log('⚔️ Sending PK Invitation to:', targetId);
                                                        const endTime = Date.now() + (pkDuration * 1000);
                                                        const invitationData = JSON.stringify({
                                                            inviterName: userName,
                                                            roomID: channelId,
                                                            type: 'PK_REQUEST',
                                                            duration: pkDuration,
                                                            endTime: endTime
                                                        });
                                                        // Use type 10 for PK Request
                                                        ZegoUIKit.getSignalingPlugin().sendInvitation([targetId], 60, 10, invitationData)
                                                            .then(() => {
                                                                setShowPKInviteModal(false);
                                                                Alert.alert("Request Sent", `Challenging ${session.hostName}...`);
                                                            })
                                                            .catch((err: any) => {
                                                                console.log('PK Invitation Error:', err);
                                                                Alert.alert("Error", "Could not send challenge. Make sure the host is online.");
                                                            });
                                                    }
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                    {session.hostAvatar ? (
                                                        <Image source={{ uri: session.hostAvatar }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#444' }} />
                                                    ) : (
                                                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#444', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Text style={{ color: '#fff', fontSize: 14 }}>{session.hostName?.charAt(0)}</Text>
                                                        </View>
                                                    )}
                                                    <View>
                                                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{session.hostName || 'Host'}</Text>
                                                        <Text style={{ color: '#888', fontSize: 11 }}>Live Now</Text>
                                                    </View>
                                                </View>
                                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(59, 130, 246, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Swords size={18} color="#3B82F6" />
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                ) : (
                                    <View style={{ alignItems: 'center', marginVertical: 30 }}>
                                        <Text style={{ color: '#666', fontSize: 13 }}>No other hosts are live right now.</Text>
                                    </View>
                                )}

                                {/* Manual Input Removed */}
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
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
