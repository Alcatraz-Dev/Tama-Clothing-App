import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    Animated,
    ActivityIndicator,
    Alert,
    Easing
} from 'react-native';
import { Text } from '../components/ui/text';
import { Avatar } from '../components/ui/avatar';
import UniversalVideoPlayer from '../components/common/UniversalVideoPlayer';
import { X, Trash2, Music2 } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../api/firebase';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StoryDetailScreenProps {
    initialReel: any;
    allReels: any[];
    onClose: () => void;
    onDelete?: (reelId: string) => void;
    t: (key: string) => string;
    theme: 'light' | 'dark';
    user?: any;
}

// Animated music disc component
function MusicBadge({ title, artist }: { title: string; artist?: string }) {
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const spin = Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        spin.start();
        return () => spin.stop();
    }, []);

    const rotate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    return (
        <View style={styles.musicBadge}>
            <Animated.View style={[styles.musicDisc, { transform: [{ rotate }] }]}>
                <Music2 size={14} color="#FFF" />
            </Animated.View>
            <View style={styles.musicTextContainer}>
                <Text style={styles.musicTitle} numberOfLines={1}>{title}</Text>
                {artist && <Text style={styles.musicArtist} numberOfLines={1}>{artist}</Text>}
            </View>
        </View>
    );
}

export default function StoryDetailScreen({
    initialReel,
    allReels,
    onClose,
    onDelete,
    t,
    theme,
    user
}: StoryDetailScreenProps) {
    const insets = useSafeAreaInsets();
    const [currentIndex, setCurrentIndex] = useState(
        allReels.findIndex(r => r.id === initialReel.id)
    );
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const progress = useRef(new Animated.Value(0)).current;
    const progressAnimation = useRef<Animated.CompositeAnimation | null>(null);
    const STORY_DURATION = 7000;

    const currentReel = allReels[currentIndex];
    const isOwner = user && currentReel && (user.uid === currentReel.userId);
    const elements = currentReel?.elements || {};
    // Music is now stored at top-level: reel.music (new schema)
    // Fall back to elements.music for backward-compat with old stories
    const musicData = currentReel?.music ?? elements?.music ?? null;
    const musicUrl = musicData?.url ?? null;
    const musicStartTime = musicData?.startTime ?? 0;
    const musicClipDuration = musicData?.duration ?? 15;

    // useAudioPlayer must always be called with a source — use placeholder when no music
    const audioSource = musicUrl ? { uri: musicUrl } : { uri: '' };
    const audioPlayer = useAudioPlayer(audioSource);
    const hasMusic = !!musicUrl;

    // Configure audio session once on mount so iOS silent mode won't block playback
    useEffect(() => {
        setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => {});
    }, []);

    // Play / stop music when story or loaded state changes
    useEffect(() => {
        if (!hasMusic) return;
        if (audioPlayer?.isLoaded) {
            try {
                audioPlayer.seekTo(musicStartTime);
                audioPlayer.play();
            } catch (_) {}
        }
        return () => {
            try { audioPlayer?.pause(); } catch (_) {}
        };
    }, [currentIndex, audioPlayer?.isLoaded, hasMusic, musicStartTime]);

    const getFilterOverlay = (filter: string) => {
        switch (filter) {
            case 'warm': return 'rgba(255, 150, 50, 0.2)';
            case 'cool': return 'rgba(50, 150, 180, 0.2)';
            case 'noir': return 'rgba(0, 0, 0, 0.4)';
            case 'vivid': return 'rgba(255, 0, 128, 0.15)';
            default: return 'transparent';
        }
    };

    const handleDelete = async () => {
        if (!currentReel?.id) return;
        Alert.alert(
            t('Delete Story') || 'Delete Story',
            t('Are you sure you want to delete this story?') || 'Are you sure?',
            [
                { text: t('Cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('Delete') || 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await deleteDoc(doc(db, 'global_reels', currentReel.id));
                            if (onDelete) onDelete(currentReel.id);
                            onClose();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete story');
                        } finally {
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    const startProgress = () => {
        progress.setValue(0);
        progressAnimation.current?.stop();
        progressAnimation.current = Animated.timing(progress, {
            toValue: 1,
            duration: STORY_DURATION,
            useNativeDriver: false,
        });
        progressAnimation.current.start(({ finished }) => {
            if (finished) nextStory();
        });
    };

    useEffect(() => {
        setLoading(currentReel?.type !== 'image');
        startProgress();
        return () => {
            progressAnimation.current?.stop();
        };
    }, [currentIndex]);

    const nextStory = () => {
        if (currentIndex < allReels.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const prevStory = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            onClose();
        }
    };

    const handleTap = (evt: any) => {
        const x = evt.nativeEvent.locationX;
        if (x < SCREEN_WIDTH / 3) {
            prevStory();
        } else {
            nextStory();
        }
    };

    if (!currentReel) {
        onClose();
        return null;
    }

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {/* ── Media Content ── */}
            <TouchableOpacity
                activeOpacity={1}
                onPress={handleTap}
                style={StyleSheet.absoluteFill}
            >
                {currentReel.type === 'video' ? (
                    <UniversalVideoPlayer
                        source={{ uri: currentReel.url }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                        shouldPlay
                        isLooping={false}
                    />
                ) : (
                    <ExpoImage
                        source={{ uri: currentReel.url }}
                        style={StyleSheet.absoluteFillObject}
                        contentFit="cover"
                        transition={300}
                        onLoadEnd={() => setLoading(false)}
                    />
                )}

                {/* Filter overlay */}
                {currentReel.filter && currentReel.filter !== 'none' && (
                    <View
                        style={[StyleSheet.absoluteFillObject, { backgroundColor: getFilterOverlay(currentReel.filter) }]}
                        pointerEvents="none"
                    />
                )}

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#FFF" size="large" />
                    </View>
                )}
            </TouchableOpacity>

            {/* ── Floating Texts ── */}
            {elements?.texts && elements.texts.map((txt: any) => (
                <View
                    key={txt.id}
                    style={[styles.floatingTextWrapper, { left: txt.x ?? SCREEN_WIDTH / 2 - 80, top: txt.y ?? SCREEN_HEIGHT / 2 }]}
                    pointerEvents="none"
                >
                    <Text style={styles.floatingText}>{txt.text}</Text>
                </View>
            ))}

            {/* ── Stickers ── */}
            {elements?.stickers && elements.stickers.map((sticker: any) => (
                <View
                    key={sticker.id}
                    style={[styles.floatingStickerWrapper, { left: sticker.x ?? 50, top: sticker.y ?? SCREEN_HEIGHT / 2 }]}
                    pointerEvents="none"
                >
                    <Text style={styles.floatingSticker}>{sticker.emoji}</Text>
                </View>
            ))}

            {/* ── Music Badge ── */}
            {musicData && (
                <View style={[styles.musicBadgeWrapper, { top: insets.top + 75 }]}>
                    <MusicBadge title={musicData.title} artist={musicData.artist} />
                </View>
            )}


            {/* ── Bottom gradient ── */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.bottomGradient}
                pointerEvents="none"
            />

            {/* ── Header: progress + user info ── */}
            <LinearGradient
                colors={['rgba(0,0,0,0.55)', 'transparent']}
                style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
                pointerEvents="box-none"
            >
                {/* Progress bars */}
                <View style={styles.progressContainer}>
                    {allReels.map((_, index) => (
                        <View key={index} style={styles.progressBarBg}>
                            <Animated.View
                                style={[
                                    styles.progressBarFg,
                                    {
                                        width: index === currentIndex
                                            ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                                            : index < currentIndex ? '100%' : '0%',
                                    },
                                ]}
                            />
                        </View>
                    ))}
                </View>

                {/* User info row */}
                <View style={styles.headerInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Avatar
                            source={currentReel.userPhoto}
                            size={38}
                            fallback={currentReel.userName?.[0] || 'U'}
                            style={{ borderWidth: 2, borderColor: '#FFF' }}
                        />
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.userName}>{currentReel.userName}</Text>
                            <Text style={styles.timestamp}>
                                {currentReel.createdAt?.toDate
                                    ? currentReel.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'Recent'}
                            </Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {isOwner && (
                            <TouchableOpacity onPress={handleDelete} style={styles.iconBtn} disabled={deleting}>
                                {deleting
                                    ? <ActivityIndicator color="#FFF" size="small" />
                                    : <Trash2 color="#FFF" size={22} />}
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                            <X color="#FFF" size={26} />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    headerGradient: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        paddingHorizontal: 10,
        zIndex: 20,
        paddingBottom: 20,
    },
    progressContainer: {
        flexDirection: 'row',
        height: 2.5,
        paddingHorizontal: 5,
        gap: 4,
    },
    progressBarBg: {
        flex: 1,
        height: 2.5,
        backgroundColor: 'rgba(255,255,255,0.35)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFg: {
        height: '100%',
        backgroundColor: '#FFF',
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingHorizontal: 10,
    },
    userName: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 4,
    },
    timestamp: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 11,
        marginTop: 2,
    },
    iconBtn: { padding: 6 },
    bottomGradient: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 160,
        zIndex: 5,
    },

    // ── Music badge ──
    musicBadgeWrapper: {
        position: 'absolute',
        left: 16,
        zIndex: 30,
    },
    musicBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 20,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        maxWidth: SCREEN_WIDTH * 0.55,
    },
    musicDisc: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    musicTextContainer: { flex: 1 },
    musicTitle: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    musicArtist: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 10,
        marginTop: 1,
    },

    // ── Floating overlays ──
    floatingTextWrapper: {
        position: 'absolute',
        zIndex: 25,
        padding: 4,
    },
    floatingText: {
        color: '#FFF',
        fontSize: 30,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 6,
    },
    floatingStickerWrapper: {
        position: 'absolute',
        zIndex: 25,
        padding: 8,
    },
    floatingSticker: {
        fontSize: 52,
    },
});
