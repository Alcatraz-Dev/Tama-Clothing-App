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
import { X, ChevronLeft, Clock, Sparkles, Check, Filter, Timer } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MediaPicker, MediaAsset } from '@/components/ui/media-picker';
import { db } from '../api/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToBunny } from '@/utils/bunny';

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
            // Upload to Bunny
            const bunnyUrl = await uploadToBunny(selectedMedia.uri);
            
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
        } catch (error) {
            console.error('Error publishing story:', error);
            Alert.alert('Error', 'Failed to publish story. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const getFilterStyle = () => {
        switch (selectedFilter) {
            case 'warm':
                return { tintColor: undefined, overlay: 'rgba(255, 150, 50, 0.2)' };
            case 'cool':
                return { tintColor: undefined, overlay: 'rgba(50, 150, 180, 0.2)' };
            case 'noir':
                return { tintColor: undefined, overlay: 'rgba(0, 0, 0, 0.4)' };
            case 'vivid':
                return { tintColor: undefined, overlay: 'rgba(255, 0, 128, 0.15)' };
            default:
                return { tintColor: undefined, overlay: 'transparent' };
        }
    };

    const renderMediaPicker = () => (
        <View style={styles.mediaPickerContainer}>
            <Text style={[styles.pickerTitle, { color: isDark ? '#FFF' : '#000' }]}>
                {t('Select Media') || 'Select Media'}
            </Text>
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
                        <View style={[styles.pickerButtonInner, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
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
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Filter size={20} color={isDark ? '#FFF' : '#000'} />
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#000' }]}>
                    {t('Filter') || 'Filter'}
                </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
                {FILTERS.map((filter) => (
                    <TouchableOpacity
                        key={filter.id}
                        onPress={() => setSelectedFilter(filter.id)}
                        style={styles.filterItem}
                    >
                        <LinearGradient
                            colors={filter.colors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                                styles.filterCircle,
                                selectedFilter === filter.id && styles.filterCircleSelected
                            ]}
                        >
                            <View style={[
                                styles.filterPreview,
                                { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }
                            ]} />
                        </LinearGradient>
                        <Text style={[
                            styles.filterName,
                            { color: isDark ? '#FFF' : '#000' },
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
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Timer size={20} color={isDark ? '#FFF' : '#000'} />
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#000' }]}>
                    {t('Story Duration') || 'Story Duration'}
                </Text>
            </View>
            <View style={styles.durationRow}>
                {DURATIONS.map((duration) => (
                    <TouchableOpacity
                        key={duration.value}
                        onPress={() => setSelectedDuration(duration.value)}
                        style={[
                            styles.durationButton,
                            { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                            selectedDuration === duration.value && styles.durationButtonSelected
                        ]}
                    >
                        <Clock size={16} color={selectedDuration === duration.value ? '#FFF' : (isDark ? '#FFF' : '#000')} />
                        <Text style={[
                            styles.durationLabel,
                            { color: selectedDuration === duration.value ? '#FFF' : (isDark ? '#FFF' : '#000') }
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
        
        const filterStyle = getFilterStyle();
        
        return (
            <View style={styles.previewContainer}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#000', marginBottom: 12 }]}>
                    {t('Preview') || 'Preview'}
                </Text>
                <View style={styles.previewImageWrapper}>
                    <Image
                        source={{ uri: selectedMedia.uri }}
                        style={styles.previewImage}
                        resizeMode="cover"
                    />
                    {filterStyle.overlay !== 'transparent' && (
                        <View style={[styles.filterOverlay, { backgroundColor: filterStyle.overlay }]} />
                    )}
                    <View style={styles.previewUserInfo}>
                        <Avatar
                            source={user?.avatarUrl || user?.photoURL}
                            size={32}
                            fallback={user?.displayName?.[0] || 'U'}
                            style={{ borderWidth: 1, borderColor: '#FFF' }}
                        />
                        <Text style={styles.previewUserName}>
                            {user?.displayName || user?.fullName || 'You'}
                        </Text>
                        <View style={styles.previewDuration}>
                            <Clock size={12} color="#FFF" />
                            <Text style={styles.previewDurationText}>{selectedDuration}h</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    if (showMediaPicker && !selectedMedia) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={28} color={isDark ? '#FFF' : '#000'} />
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
        <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <X size={28} color={isDark ? '#FFF' : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>
                    {t('Create Story') || 'Create Story'}
                </Text>
                <TouchableOpacity 
                    onPress={handlePublish} 
                    disabled={uploading || !selectedMedia}
                    style={styles.publishButton}
                >
                    {uploading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <LinearGradient
                            colors={['#FF0080', '#FF8C00']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.publishGradient}
                        >
                            <Text style={styles.publishText}>
                                {t('Share') || 'Share'}
                            </Text>
                        </LinearGradient>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {renderPreview()}
                {renderFilters()}
                {renderDuration()}
                
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(128, 128, 128, 0.3)',
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    publishButton: {
        width: 80,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
    },
    publishGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
    },
    publishText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    content: {
        flex: 1,
    },
    mediaPickerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    pickerTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 24,
    },
    pickerButton: {
        width: SCREEN_WIDTH * 0.7,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
    },
    pickerGradient: {
        flex: 1,
        padding: 2,
        borderRadius: 25,
    },
    pickerButtonInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 23,
    },
    pickerButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    previewContainer: {
        padding: 16,
    },
    previewImageWrapper: {
        width: '100%',
        aspectRatio: 9 / 16,
        maxHeight: SCREEN_HEIGHT * 0.45,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    filterOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    previewUserInfo: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    previewUserName: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 4,
    },
    previewDuration: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    previewDurationText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    filtersRow: {
        flexDirection: 'row',
    },
    filterItem: {
        alignItems: 'center',
        marginRight: 16,
    },
    filterCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        padding: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    filterCircleSelected: {
        borderWidth: 3,
        borderColor: '#FF0080',
    },
    filterPreview: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },
    filterName: {
        fontSize: 12,
        fontWeight: '500',
    },
    filterNameSelected: {
        color: '#FF0080',
        fontWeight: '700',
    },
    durationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    durationButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    durationButtonSelected: {
        backgroundColor: '#FF0080',
    },
    durationLabel: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
});
