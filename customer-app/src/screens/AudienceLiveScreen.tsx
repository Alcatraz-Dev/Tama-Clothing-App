import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, findNodeHandle } from 'react-native';
import * as Animatable from 'react-native-animatable';
import Constants from 'expo-constants';
import { CustomBuilder } from '../utils/CustomBuilder';
import { LiveSessionService } from '../services/LiveSessionService';
import { Alert, Modal, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Gift } from 'lucide-react-native';

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
    const { channelId, userId, userName, userAvatar, onClose, t } = props;
    const prebuiltRef = useRef<any>(null);
    const mediaViewRef = useRef<any>(null);
    const mediaPlayerRef = useRef<any>(null);
    const [showGiftVideo, setShowGiftVideo] = useState(false);
    const [showGifts, setShowGifts] = useState(false);
    const [giftQueue, setGiftQueue] = useState<{ senderName: string, targetName?: string, giftName: string, icon: string, isHost?: boolean }[]>([]);
    const [recentGift, setRecentGift] = useState<{ senderName: string, targetName?: string, giftName: string, icon: string, isHost?: boolean } | null>(null);
    const [streamHostId, setStreamHostId] = useState<string | null>(null);

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
                showGiftAnimation();
            }
        }
    }, [giftQueue, recentGift]);

    // Auto-clear gift notification
    useEffect(() => {
        if (recentGift) {
            const timer = setTimeout(() => setRecentGift(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [recentGift]);

    const gifts = [
        { id: 'rose', name: 'Rose', icon: '🌹', points: 1 },
        { id: 'heart', name: 'Finger Heart', icon: '🫰', points: 5 },
        { id: 'perfume', name: 'Perfume', icon: '🧴', points: 99 },
        { id: 'crown', name: 'Crown', icon: '👑', points: 299 },
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

        // 1. Send Command (for overlay logic on host side)
        if (ZegoUIKit) {
            ZegoUIKit.sendInRoomCommand(JSON.stringify({
                type: 'gift',
                giftName: gift.name,
                icon: gift.icon,
                userName: userName
            }), [], () => { });

            // 2. Send Chat Message (so it appears in the chat list like a comment)
            const chatMsg = `🎁 ${t ? t('sentA') || 'sent a' : 'sent a'} ${gift.name}! ${gift.icon}`;
            ZegoUIKit.sendInRoomMessage(chatMsg);
        }

        // 3. Local Feedback via Console
        console.log('Gift Sent:', gift.name);
    };

    // Register user avatar & Handle Join/Leave Firestore
    useEffect(() => {
        if (userAvatar && userId) {
            CustomBuilder.registerAvatar(userId, userAvatar);
        }

        // 1. Subscribe to session to get host details
        const unsubscribe = LiveSessionService.subscribeToSession(channelId, (session) => {
            if (session.hostId) {
                setStreamHostId(session.hostId);
                if (session.hostAvatar) {
                    console.log('🖼️ Registering host avatar from Firestore:', session.hostAvatar);
                    CustomBuilder.registerAvatar(session.hostId, session.hostAvatar);
                }
            }
        });

        // 2. Increment view count
        const joinFirestore = async () => {
            try {
                await LiveSessionService.joinSession(channelId);
                console.log('🎬 Audience joined Firestore session');
            } catch (error) {
                console.error('Error joining Firestore session:', error);
            }
        };

        const leaveFirestore = async () => {
            try {
                await LiveSessionService.leaveSession(channelId);
                console.log('🎬 Audience left Firestore session');
            } catch (error) {
                console.error('Error leaving Firestore session:', error);
            }
        };

        joinFirestore();
        joinFirestore();
        return () => {
            unsubscribe();
            leaveFirestore();
        };
    }, [channelId, userId, userAvatar]);

    // Gift Animation Logic (Same as Host)
    const showGiftAnimation = async () => {
        if (!ZegoExpressEngine || !ZegoMediaPlayerResource) return;

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

    // ✅ Listen for In-Room Commands (Gifts) from other users
    // This ensures ALL audience members see the gift animation
    useEffect(() => {
        if (ZegoUIKit) {
            const callbackID = 'AudienceGiftListener';
            console.log('🎧 Registering AudienceGiftListener with ZegoUIKit');

            ZegoUIKit.getSignalingPlugin().onInRoomCommandMessageReceived(callbackID, (messageData: any) => {
                const { roomID, message, senderUserID } = messageData;
                console.log(`📬 AudienceGiftListener: Command from ${senderUserID}: ${message}`);

                // Ignore own commands (handled locally for instant feedback)
                if (senderUserID === userId) return;

                try {
                    const data = JSON.parse(message);
                    if (data.type === 'gift') {
                        setGiftQueue(prev => [...prev, {
                            senderName: data.userName || 'User',
                            targetName: data.targetName,
                            giftName: data.giftName,
                            icon: data.icon,
                            isHost: data.userName?.includes('Host') // Detect host from string
                        }]);
                    }
                } catch (e) {
                    console.error('AudienceGiftListener JSON Parse Error:', e);
                }
            });
        }
    }, [userId]);

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

    return (
        <View style={styles.container}>
            <ZegoUIKitPrebuiltLiveStreaming
                appID={ZEGO_APP_ID}
                appSign={ZEGO_APP_SIGN}
                userID={userId}
                userName={userName}
                liveID={channelId}
                config={{
                    ...AUDIENCE_DEFAULT_CONFIG,
                    inRoomChatConfig: {
                        itemBuilder: (message: any) => {
                            const isHostMsg = message.sender.userName.includes('Host') || message.sender.userID === streamHostId;
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
                    role: ZegoLiveStreamingRole?.Audience ?? 2,
                    confirmStartLive: false,
                    showStartLiveButton: false,
                    confirmLeave: true,
                    turnOnCameraWhenJoining: false,
                    turnOnMicrophoneWhenJoining: false,
                    onLeaveLiveStreaming: () => {
                        console.log('🎬 Audience leaving live via SDK');
                        onClose();
                    },
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
                    onInRoomCommandReceived: (callbackID: string, messageData: any) => {
                        const { message, senderUserID } = messageData;
                        // Ignore own commands
                        if (senderUserID === userId) return;

                        try {
                            const data = JSON.parse(message);
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
                            showGiftAnimation();
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
                            {t ? t('sendAGift') || 'SEND A GIFT' : 'SEND A GIFT'}
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

            {/* FLOATING PINK GIFT BUTTON (COMPACT & HIGHER) */}
            <TouchableOpacity
                onPress={() => setShowGifts(true)}
                style={{
                    position: 'absolute',
                    bottom: 120, // Pushed higher to top
                    right: 15,
                    width: 40,   // More smaller
                    height: 40,  // More smaller
                    borderRadius: 20,
                    backgroundColor: '#FF0066',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                    elevation: 8,
                    zIndex: 1000,
                    borderWidth: 2,
                    borderColor: '#fff'
                }}
            >
                <Gift size={20} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
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
