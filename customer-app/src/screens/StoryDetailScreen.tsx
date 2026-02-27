import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Image,
    TouchableOpacity,
    StatusBar,
    Animated,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Text } from '../components/ui/text';
import { Avatar } from '../components/ui/avatar';
import UniversalVideoPlayer from '../components/common/UniversalVideoPlayer';
import { X, ChevronLeft, ChevronRight, Trash2, Edit } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../api/firebase';

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
    const progress = useRef(new Animated.Value(0)).current;
    const STORY_DURATION = 5000; // 5 seconds per story
    const [deleting, setDeleting] = useState(false);

    const currentReel = allReels[currentIndex];
    const isOwner = user && currentReel && (user.uid === currentReel.userId);

    const handleDelete = async () => {
        if (!currentReel?.id) return;
        
        Alert.alert(
            t('Delete Story') || 'Delete Story',
            t('Are you sure you want to delete this story?') || 'Are you sure you want to delete this story?',
            [
                { text: t('Cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('Delete') || 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await deleteDoc(doc(db, 'global_reels', currentReel.id));
                            if (onDelete) {
                                onDelete(currentReel.id);
                            }
                            onClose();
                        } catch (error) {
                            console.error('Error deleting story:', error);
                            Alert.alert('Error', 'Failed to delete story');
                        } finally {
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        startProgress();
        // Reset loading when changing stories
        setLoading(true);
        
        // For videos, set a timeout to hide loading after initial buffer
        if (currentReel?.type === 'video') {
            const timer = setTimeout(() => {
                setLoading(false);
            }, 1500);
            return () => {
                progress.stopAnimation();
                clearTimeout(timer);
            };
        }
        
        return () => progress.stopAnimation();
    }, [currentIndex]);

    const startProgress = () => {
        progress.setValue(0);
        Animated.timing(progress, {
            toValue: 1,
            duration: STORY_DURATION,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                nextStory();
            }
        });
    };

    const nextStory = () => {
        if (currentIndex < allReels.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onClose();
        }
    };

    const prevStory = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
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

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {/* Media Content */}
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
                    <Image
                        source={{ uri: currentReel.url }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                        onLoadEnd={() => setLoading(false)}
                    />
                )}

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#FFF" size="large" />
                    </View>
                )}
            </TouchableOpacity>

            {/* Top Overlays */}
            <LinearGradient
                colors={['rgba(0,0,0,0.5)', 'transparent']}
                style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
            >
                {/* Progress Bars */}
                <View style={styles.progressContainer}>
                    {allReels.map((_, index) => (
                        <View key={index} style={styles.progressBarBackground}>
                            <Animated.View
                                style={[
                                    styles.progressBarForeground,
                                    {
                                        width: index === currentIndex
                                            ? progress.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%'],
                                            })
                                            : index < currentIndex ? '100%' : '0%',
                                    },
                                ]}
                            />
                        </View>
                    ))}
                </View>

                {/* User Info & Close */}
                <View style={styles.headerInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Avatar
                            source={currentReel.userPhoto}
                            size={40}
                            fallback={currentReel.userName?.[0] || 'U'}
                            style={{ borderWidth: 1, borderColor: '#FFF' }}
                        />
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.userName}>{currentReel.userName}</Text>
                            <Text style={styles.timestamp}>
                                {currentReel.createdAt?.toDate ?
                                    currentReel.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                                    'Recent'}
                            </Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {/* Delete Button for owner */}
                        {isOwner && (
                            <TouchableOpacity 
                                onPress={handleDelete} 
                                style={styles.actionButton}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <Trash2 color="#FFF" size={24} />
                                )}
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X color="#FFF" size={28} />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            {/* Bottom Actions (Optional - can add reactions/comments) */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 10,
        zIndex: 10,
    },
    progressContainer: {
        flexDirection: 'row',
        height: 2,
        paddingHorizontal: 5,
        gap: 5,
    },
    progressBarBackground: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 1,
        overflow: 'hidden',
    },
    progressBarForeground: {
        height: '100%',
        backgroundColor: '#FFF',
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 15,
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
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        marginTop: 2,
    },
    closeButton: {
        padding: 5,
    },
    actionButton: {
        padding: 8,
        marginRight: 10,
    },
});
