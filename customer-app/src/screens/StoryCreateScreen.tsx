import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Animated,
    TextInput
} from 'react-native';
import { Text } from '../components/ui/text';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/ui/avatar';
import { X, ChevronLeft, Clock, Sparkles, Check, Filter, Timer, Plus, Send, Zap, Music, Type, Sticker, MoreHorizontal } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MediaPicker, MediaAsset } from '@/components/ui/media-picker';
import { db } from '../api/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToBunny } from '@/utils/bunny';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type FilterType = 'none' | 'warm' | 'cool' | 'noir' | 'vivid';
type DurationType = 6 | 12 | 24;

interface StoryCreateScreenProps {
    user: any;
    media?: MediaAsset;
    onClose: () => void;
    onPublish: (story: any) => void;
    t: (key: string) => string;
    theme: 'light' | 'dark';
}

const FILTERS: { id: FilterType; name: string; colors: [string, string] }[] = [
    { id: 'none', name: 'Normal', colors: ['#888', '#888'] as [string, string] },
    { id: 'warm', name: 'Warm', colors: ['#FF6B35', '#FF9F1C'] as [string, string] },
    { id: 'cool', name: 'Cool', colors: ['#4ECDC4', '#556270'] as [string, string] },
    { id: 'noir', name: 'Noir', colors: ['#2C3E50', '#000000'] as [string, string] },
    { id: 'vivid', name: 'Vivid', colors: ['#FF0080', '#FF8C00'] as [string, string] },
];

const DURATIONS: { value: DurationType; label: string }[] = [
    { value: 6, label: '6h' },
    { value: 12, label: '12h' },
    { value: 24, label: '24h' },
];

export default function StoryCreateScreen({
    user,
    media,
    onClose,
    onPublish,
    t,
    theme
}: StoryCreateScreenProps) {
    const insets = useSafeAreaInsets();
    const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(media || null);
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
    const [selectedDuration, setSelectedDuration] = useState<DurationType>(24);
    const [uploading, setUploading] = useState(false);
    const [showMediaPicker, setShowMediaPicker] = useState(!media);
    const progressAnim = useRef(new Animated.Value(0)).current;

    const isDark = theme === 'dark';

    useEffect(() => {
        if (showMediaPicker && !media) {
            // Animation for picker
        }
    }, [showMediaPicker, media]);

    const handleMediaSelect = (assets: MediaAsset[]) => {
        if (assets.length > 0) {
            setSelectedMedia(assets[0]);
            setShowMediaPicker(false);
        }
    };

    const handlePublish = async () => {
        if (!selectedMedia || !user) {
            Alert.alert('Error', 'Please select a media file');
            return;
        }

        setUploading(true);
        
        try {
            let uploadUri = selectedMedia.uri;
            
            // Check if file is HEIC/HEIF and convert to JPEG
            const fileExtension = uploadUri.split('.').pop()?.toLowerCase() || '';
            if (['heic', 'heif'].includes(fileExtension)) {
                try {
                    const cacheDir = (FileSystem as any).cacheDirectory || '';
                    const jpegUri = `${cacheDir}story_${Date.now()}.jpg`;
                    
                    // Copy HEIC to JPEG (Bunny will handle it better)
                    await FileSystem.copyAsync({
                        from: uploadUri,
                        to: jpegUri,
                    });
                    uploadUri = jpegUri;
                } catch (heicError) {
                    console.log('HEIC conversion failed, trying original:', heicError);
                }
            }

            // Upload to Bunny
            const bunnyUrl = await uploadToBunny(uploadUri);
            
            const now = new Date();
            const expiryDate = new Date(now.getTime() + selectedDuration * 60 * 60 * 1000);
            
            const storyData = {
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                url: bunnyUrl,
                type: selectedMedia.type === 'video' ? 'video' : 'image',
                userId: user.uid,
                userName: user.displayName || user.fullName || user.name || 'User',
                userPhoto: user.avatarUrl || user.photoURL || null,
                filter: selectedFilter,
                duration: selectedDuration,
                createdAt: serverTimestamp(),
                expiryAt: expiryDate.toISOString(),
                views: 0,
            };

            // Save to Firestore
            await setDoc(doc(db, 'global_reels', storyData.id), storyData);
            
            onPublish(storyData);
        } catch (error: any) {
            console.error('Error publishing story:', error);
            const errorMessage = error?.message || 'Failed to publish story. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const getFilterOverlay = () => {
        switch (selectedFilter) {
            case 'warm': return 'rgba(255, 150, 50, 0.2)';
            case 'cool': return 'rgba(50, 150, 180, 0.2)';
            case 'noir': return 'rgba(0, 0, 0, 0.4)';
            case 'vivid': return 'rgba(255, 0, 128, 0.15)';
            default: return 'transparent';
        }
    };

    const renderMediaPicker = () => (
        <View style={styles.mediaPickerContainer}>
            <View style={styles.pickerHeader}>
                <Zap size={32} color="#FFD700" style={{ marginBottom: 16 }} />
                <Text style={styles.pickerTitle}>
                    {t('Share your moment') || 'Share your moment'}
                </Text>
                <Text style={styles.pickerSubtitle}>
                    {t('Photos and videos will disappear after the selected duration.') || 'Photos and videos will disappear after the selected duration.'}
                </Text>
            </View>
            
            <MediaPicker
                gallery={true}
                mediaType="all"
                onSelectionChange={handleMediaSelect}
            >
                <View style={styles.pickerButton}>
                    <LinearGradient
                        colors={['#FF0080', '#FF8C00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.pickerGradient}
                    >
                        <View style={styles.pickerButtonInner}>
                            <Plus size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.pickerButtonText}>
                                {t('Choose from Gallery') || 'Choose from Gallery'}
                            </Text>
                        </View>
                    </LinearGradient>
                </View>
            </MediaPicker>
        </View>
    );

    const renderFilters = () => (
        <View style={styles.toolSection}>
            <Text style={styles.toolTitle}>
                {t('Filter') || 'Filter'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={{ paddingHorizontal: 20 }}>
                {FILTERS.map((filter) => (
                    <TouchableOpacity
                        key={filter.id}
                        onPress={() => setSelectedFilter(filter.id)}
                        style={styles.filterItem}
                    >
                        <View style={[
                            styles.filterCircle,
                            selectedFilter === filter.id && styles.filterCircleSelected
                        ]}>
                            <LinearGradient
                                colors={filter.colors}
                                style={styles.filterPreview}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                        </View>
                        <Text style={[
                            styles.filterName,
                            selectedFilter === filter.id && styles.filterNameSelected
                        ]}>
                            {filter.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderDuration = () => (
        <View style={[styles.toolSection, { marginTop: 20 }]}>
            <Text style={styles.toolTitle}>
                {t('Duration') || 'Duration'}
            </Text>
            <View style={styles.durationRow}>
                {DURATIONS.map((duration) => (
                    <TouchableOpacity
                        key={duration.value}
                        onPress={() => setSelectedDuration(duration.value)}
                        style={[
                            styles.durationPill,
                            selectedDuration === duration.value && styles.durationPillSelected
                        ]}
                    >
                        <Clock size={14} color={selectedDuration === duration.value ? '#FFF' : 'rgba(255,255,255,0.6)'} />
                        <Text style={[
                            styles.durationLabel,
                            { color: selectedDuration === duration.value ? '#FFF' : 'rgba(255,255,255,0.6)' }
                        ]}>
                            {duration.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderPreview = () => {
        if (!selectedMedia) return null;
        
        return (
            <View style={styles.fullPreviewContainer}>
                
                {selectedMedia.type === 'video' ? (
                    <View style={StyleSheet.absoluteFill}>
                        {/* In a real app, use expo-video or similar for preview */}
                        <ExpoImage
                            source={{ uri: selectedMedia.uri }}
                            style={StyleSheet.absoluteFillObject}
                            contentFit="cover"
                        />
                        <View style={[styles.filterOverlay, { backgroundColor: getFilterOverlay() }]} />
                    </View>
                ) : (
                    <View style={StyleSheet.absoluteFill}>
                        <ExpoImage
                            source={{ uri: selectedMedia.uri }}
                            style={StyleSheet.absoluteFillObject}
                            contentFit="cover"
                            transition={300}
                        />
                        <View style={[styles.filterOverlay, { backgroundColor: getFilterOverlay() }]} />
                    </View>
                )}

                {/* Editor Controls Overlay */}
                <View style={[styles.editorControls, { top: insets.top + 10 }]}>
                    <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                        <X color="#FFF" size={24} />
                    </TouchableOpacity>

                    <View style={styles.rightControls}>
                        {[
                            { Icon: Type, id: 'text' },
                            { Icon: Music, id: 'music' },
                            { Icon: Sticker, id: 'sticker' },
                            { Icon: Sparkles, id: 'filter' },
                        ].map((item, idx) => (
                            <TouchableOpacity key={idx} style={styles.iconButton}>
                                <item.Icon color="#FFF" size={22} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Bottom Tools Overlay */}
                <View style={[styles.bottomTools, { paddingBottom: insets.bottom + 20 }]}>
                    <BlurView intensity={60} tint="dark" style={styles.bottomPanel}>
                        <View style={styles.userBar}>
                            <Avatar
                                source={user?.avatarUrl || user?.photoURL}
                                size={40}
                                fallback={user?.displayName?.[0] || 'U'}
                                style={{ borderWidth: 2, borderColor: '#FFF' }}
                            />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.userNameText}>{user?.displayName || 'You'}</Text>
                                <Text style={styles.infoText}>{selectedDuration}h story</Text>
                            </View>
                        </View>
                        
                        <View style={styles.divider} />
                        
                        {renderFilters()}
                        {renderDuration()}

                        <TouchableOpacity 
                            onPress={handlePublish} 
                            disabled={uploading}
                            style={styles.shareFab}
                        >
                            <LinearGradient
                                colors={['#FF0080', '#FF8C00']}
                                style={styles.shareFabGradient}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.shareFabText}>{t('Share') || 'Share'}</Text>
                                        <Send size={16} color="#FFF" style={{ marginLeft: 6 }} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </BlurView>
                </View>
            </View>
        );
    };

    if (showMediaPicker && !selectedMedia) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <ChevronLeft size={28} color={isDark ? '#FFF' : '#000'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>
                        {t('Create Story') || 'Create Story'}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
                {renderMediaPicker()}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderPreview()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#000',
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    mediaPickerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        backgroundColor: '#000',
    },
    pickerHeader: {
        alignItems: 'center',
        marginBottom: 40,
    },
    pickerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    pickerSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    pickerButton: {
        width: SCREEN_WIDTH * 0.75,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
    },
    pickerGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerButtonInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
    fullPreviewContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    fullPreviewImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        position: 'absolute',
    },
    filterOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    overlayHeader: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    blurCircle: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareFab: {
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        marginTop: 20,
    },
    shareFabGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    shareFabText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    bottomTools: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 5,
    },
    bottomPanel: {
        marginHorizontal: 10,
        marginBottom: 10,
        borderRadius: 24,
        padding: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    userBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    userNameText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    infoText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 16,
    },
    toolSection: {
        marginBottom: 8,
    },
    toolTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
        marginHorizontal: 4,
        opacity: 0.8,
    },
    filtersRow: {
        marginBottom: 4,
    },
    filterItem: {
        alignItems: 'center',
        marginRight: 20,
    },
    filterCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        padding: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 8,
    },
    filterCircleSelected: {
        backgroundColor: '#FFF',
    },
    filterPreview: {
        flex: 1,
        borderRadius: 25,
    },
    filterName: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        fontWeight: '600',
    },
    editorControls: {
        position: 'absolute',
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    rightControls: {
        flexDirection: 'row',
        gap: 15,
    },
    filterNameSelected: {
        color: '#FFF',
    },
    durationRow: {
        flexDirection: 'row',
    },
    durationPill: {
        flex: 1,
        flexDirection: 'row',
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
    },
    durationPillSelected: {
        backgroundColor: '#FF0080',
    },
    durationLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 6,
    },
});
