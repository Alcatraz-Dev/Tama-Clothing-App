import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Alert, Text, TouchableOpacity, Image, ActionSheetIOS, Platform, findNodeHandle, Modal, ScrollView } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Gift, Swords, Sparkles, MoreHorizontal } from 'lucide-react-native';
import Constants from 'expo-constants';
import { CustomBuilder } from '../utils/CustomBuilder';
import { LiveSessionService } from '../services/LiveSessionService';

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

    const gifts = [
        { id: 'rose', name: 'Rose', icon: '🌹', points: 1 },
        { id: 'heart', name: 'Finger Heart', icon: '🫰', points: 5 },
        { id: 'perfume', name: 'Perfume', icon: '🧴', points: 99 },
        { id: 'crown', name: 'Crown', icon: '👑', points: 299 },
    ];

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
                userName: `Host (${userName})`,
                targetName: targetName
            }), [], () => { });

            const chatMsg = `🎁 Host sent a ${gift.name} to ${targetName}! ${gift.icon}`;
            ZegoUIKit.sendInRoomMessage(chatMsg);
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
            if (showGiftVideo) {
                showGiftAnimation();
            }
        }
    }, [recentGift, giftQueue, showGiftVideo]);

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

                        // 1. Trigger Video Animation by showing the view (onLayout will start it)
                        setShowGiftVideo(true);

                        // 2. Push to Toast Queue
                        setGiftQueue(prev => [...prev, {
                            senderName: data.userName || 'User',
                            targetName: data.targetName,
                            giftName: data.giftName,
                            icon: data.icon,
                            isHost: data.userName?.includes('Host')
                        }]);
                    }
                } catch (e) {
                    console.error('HostGiftListener JSON Parse Error:', e);
                }
            });

            // Cleanup on unmount
            return () => {
                // Not strictly necessary as callbackID overwrites, but good practice if API supports removal
            };
        }
    }, []);

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
            if (mediaPlayerRef.current && ZegoExpressEngine) {
                ZegoExpressEngine.instance().destroyMediaPlayer(mediaPlayerRef.current);
                mediaPlayerRef.current = null;
            }
            // Cleanup listener if possible, though SDK might not require explicit removal by ID
        }
    }, []);
    // Gift Animation Logic (Same as Host)
    const showGiftAnimation = async () => {
        if (!ZegoExpressEngine || !ZegoMediaPlayerResource) return;

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
                    resource.filePath = 'https://storage.zego.im/sdk-doc/Pics/zegocloud/oss/1.mp4';

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
                            const isHostMsg = message.sender.userName.includes('Host') || message.sender.userID === userId;
                            return (
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, marginVertical: 2, maxWidth: '90%', borderLeftWidth: isHostMsg ? 3 : 0, borderLeftColor: '#FFD700' }}>
                                    <View>
                                        <Text style={{ fontSize: 13 }}>
                                            <Text style={{ color: isHostMsg ? '#FFD700' : '#88CCFF', fontWeight: '900' }}>
                                                {message.sender.userName}:
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
                    pkConfig: {}, // Explicitly enable PK
                    beautyConfig: {}, // Explicitly enable Beauty
                    bottomMenuBarConfig: {
                        maxCount: 8,
                        buttons: [
                            ZegoMenuBarButtonName.toggleCameraButton || 'toggleCamera',
                            ZegoMenuBarButtonName.toggleMicrophoneButton || 'toggleMicrophone',
                            ZegoMenuBarButtonName.switchCameraButton || 'switchCamera',
                            ZegoMenuBarButtonName.chatButton || 'chat',
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
                    onInRoomCommandReceived: (callbackID: string, messageData: any) => {
                        // Reliable redundancy: Catch commands here too (matching Audience)
                        try {
                            const data = JSON.parse(messageData.message);
                            if (data.type === 'gift') {
                                setGiftQueue(prev => [...prev, {
                                    senderName: data.userName || 'User',
                                    targetName: data.targetName,
                                    giftName: data.giftName,
                                    icon: data.icon,
                                    isHost: data.userName?.includes('Host')
                                }]);
                            }
                        } catch (e) { }
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
                            showGiftAnimation();
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

            {/* FLOATING HOST CONTROLS (NORMAL ICONS & TOP POSITION - ADJUSTED TO NOT HIDE CLOSE BUTTON) */}
            <View style={{ position: 'absolute', top: 140, right: 15, gap: 15, alignItems: 'center', zIndex: 1000 }}>
                {/* PK Toggle Button */}
                <TouchableOpacity
                    onPress={() => Alert.alert("PK Battle", "Starting PK Battle...")}
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
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
                        borderWidth: 2,
                        borderColor: '#fff',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 5
                    }}
                >
                    <Gift size={20} color="#fff" strokeWidth={2.5} />
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
                        borderColor: 'rgba(255,255,255,0.6)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 5
                    }}
                >
                    <Sparkles size={20} color="#fff" />
                </TouchableOpacity>
            </View>
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
