import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
    useAnimatedStyle,
    withSpring,
    interpolate,
    useSharedValue,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { APP_ICON_2 } from '../constants/layout';
import { Share } from 'react-native';
import { CheckCircle2, Instagram, Globe, MessageSquare, ShoppingBag, Users, Share2, Handshake, Star, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BADGE_WIDTH = SCREEN_WIDTH * 0.82;
const BADGE_HEIGHT = BADGE_WIDTH * 1.4;

interface Collaboration {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    type: string;
    followersCount?: number;
    worksCount?: number;
}

interface CollabBadgeProps {
    collab: Collaboration;
    isDark: boolean;
    language: string;
    onClose: () => void;
    onVisitProfile: () => void;
    t: (key: string) => string;
}

export default function CollabBadge({ collab, isDark, language, onClose, onVisitProfile, t }: CollabBadgeProps) {
    const getName = (field: any, fallback = '') => {
        if (!field) return fallback;
        if (typeof field === 'string') return field;
        return field[language] || field['en'] || field['fr'] || fallback;
    };

    const [isFlipped, setIsFlipped] = useState(false);
    const flipAnim = useSharedValue(0);

    const getThemeColor = () => {
        if (collab.type === 'Brand') return '#FFD700'; // Gold
        if (collab.type === 'Person') return '#A855F7'; // Purple
        if (collab.type === 'Company') return '#3B82F6'; // Blue
        return '#22C55E'; // Green (default)
    };

    const themeColor = getThemeColor();

    const toggleFlip = () => {
        setIsFlipped(!isFlipped);
        flipAnim.value = withSpring(isFlipped ? 0 : 180, {
            mass: 1,
            damping: 15,
            stiffness: 90,
        });
    };

    const frontStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(flipAnim.value, [0, 180], [0, 180]);
        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${rotateValue}deg` }
            ],
            zIndex: isFlipped ? 0 : 1,
        };
    });

    const backStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(flipAnim.value, [0, 180], [180, 360]);
        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${rotateValue}deg` }
            ],
            zIndex: isFlipped ? 1 : 0,
        };
    });

    return (
        <View style={styles.overlay}>
            <TouchableOpacity
                activeOpacity={1}
                style={styles.backgroundDim}
                onPress={onClose}
            />

            <View style={styles.badgeContainer}>
                <TouchableOpacity activeOpacity={1} onPress={toggleFlip}>
                    <View style={{ width: BADGE_WIDTH, height: BADGE_HEIGHT }}>
                        {/* FRONT SIDE */}
                        <Animated.View style={[styles.card, frontStyle, { backfaceVisibility: 'hidden' }]}>
                            <Image
                                source={{ uri: collab.imageUrl }}
                                style={StyleSheet.absoluteFillObject}
                                resizeMode="cover"
                            />
                            <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />

                            <View style={styles.frontContent}>
                                <View style={styles.header}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Image source={APP_ICON_2} style={styles.cornerLogo} />
                                        <View style={[styles.badgeType, { borderColor: themeColor + '40', backgroundColor: themeColor + '15' }]}>
                                            <Text style={[styles.badgeTypeText, { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }]}>
                                                {t(collab.type?.toLowerCase())?.toUpperCase() || (collab.type || 'COLLAB').toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.centerSection}>
                                    <View style={styles.badgeTopRow}>
                                        <View style={[styles.avatarWrapper, { borderColor: themeColor }]}>
                                            <Image source={{ uri: collab.imageUrl }} style={styles.avatar} />
                                            <LinearGradient
                                                colors={[themeColor, themeColor + 'CC']}
                                                style={styles.avatarBadge}
                                            >
                                                <Handshake size={10} color={collab.type === 'Brand' ? '#000' : '#FFF'} />
                                            </LinearGradient>
                                        </View>
                                        <View style={[styles.serialBox, { borderLeftColor: themeColor }]}>
                                            <Text style={styles.serialLabel}>ID</Text>
                                            <Text style={styles.serialNumber}>{collab.id.substring(0, 8).toUpperCase()}</Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={onVisitProfile}
                                        style={[styles.qrWrapper, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
                                    >
                                        <QRCode
                                            value={`tama-clothing://collab/${collab.id}`}
                                            size={BADGE_WIDTH * 0.4}
                                            backgroundColor="transparent"
                                            color={isDark ? '#FFF' : '#000'}
                                        />
                                    </TouchableOpacity>

                                    <View style={styles.infoWrapper}>
                                        <Text
                                            style={[styles.collabName, { color: isDark ? '#FFF' : '#000' }]}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                        >
                                            {getName(collab.name)}
                                        </Text>
                                        <View style={[styles.verifiedContainer, { backgroundColor: themeColor + '20' }]}>
                                            <CheckCircle2 size={14} color={themeColor} fill={themeColor} fillOpacity={0.2} />
                                            <Text style={[styles.verifiedText, { color: isDark ? themeColor : themeColor + 'CC' }]} numberOfLines={1}>
                                                {t('officialPartner') || 'Official Partner'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.footer}>
                                    <Text style={[styles.scanText, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]} numberOfLines={1} adjustsFontSizeToFit>
                                        {t('scanToVisit') || 'SCAN TO VISIT'}
                                    </Text>
                                    <Image source={APP_ICON_2} style={styles.cornerLogoBottom} />
                                </View>
                            </View>

                            {/* Shimmer Effect */}
                            <View style={styles.shimmerContainer} pointerEvents="none">
                                <LinearGradient
                                    colors={['transparent', isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)', 'transparent']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.shimmer}
                                />
                            </View>
                        </Animated.View>

                        {/* BACK SIDE */}
                        <Animated.View style={[styles.card, backStyle, styles.backCard, { backfaceVisibility: 'hidden' }]}>
                            <Image
                                source={{ uri: collab.imageUrl }}
                                style={StyleSheet.absoluteFillObject}
                                resizeMode="cover"
                            />
                            <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />

                            <View style={styles.backContent}>
                                <View style={styles.backHeader}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Star size={18} color={themeColor} fill={themeColor} />
                                                <Text
                                                    style={[styles.backTitle, { color: isDark ? '#FFF' : '#000' }]}
                                                    numberOfLines={1}
                                                    adjustsFontSizeToFit
                                                >
                                                    {t('insights') || 'Insights'}
                                                </Text>
                                            </View>
                                            <Text style={styles.serialNumberBack}>#{collab.id.substring(0, 12).toUpperCase()}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Image source={APP_ICON_2} style={styles.cornerLogoSmall} />
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                                <ShieldCheck size={12} color={themeColor} />
                                                <Text style={{ fontSize: 8, color: themeColor, fontWeight: 'bold' }}>VERIFIED</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={[styles.divider, { backgroundColor: themeColor }]} />
                                </View>
                                <View style={styles.glassSeparator} />

                                <View style={styles.detailsSection}>
                                    <View style={{ maxHeight: 100 }}>
                                        <Text style={[styles.description, { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }]} numberOfLines={4}>
                                            {getName(collab.description) || t('noDescription') || 'No description available for this collaboration.'}
                                        </Text>
                                    </View>

                                    <View style={[styles.statsGrid, collab.type !== 'Brand' && { justifyContent: 'center' }]}>
                                        <LinearGradient
                                            colors={isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)'] : ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.02)']}
                                            style={styles.statBox}
                                        >
                                            <Users size={20} color={isDark ? '#FFF' : '#000'} />
                                            <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#000' }]}>
                                                {collab.followersCount ? collab.followersCount.toLocaleString() : '1.2k'}
                                            </Text>
                                            <Text style={styles.statLabel}>{t('followers') || 'FOLLOWERS'}</Text>
                                        </LinearGradient>

                                        {collab.type === 'Brand' && (
                                            <LinearGradient
                                                colors={isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)'] : ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.02)']}
                                                style={styles.statBox}
                                            >
                                                <ShoppingBag size={20} color={isDark ? '#FFF' : '#000'} />
                                                <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#000' }]}>
                                                    {collab.worksCount || Math.floor(Math.random() * 50) + 10}
                                                </Text>
                                                <Text style={styles.statLabel}>{t('products') || 'PRODUCTS'}</Text>
                                            </LinearGradient>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.actionButtonsRow}>
                                    <TouchableOpacity
                                        style={[styles.visitProfileButton, {
                                            borderColor: themeColor,
                                            backgroundColor: themeColor + '10',
                                            flex: 1
                                        }]}
                                        onPress={onVisitProfile}
                                    >
                                        <Text
                                            style={[styles.visitProfileText, { color: isDark ? '#FFF' : '#000' }]}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                        >
                                            {t('profile') || 'Profile'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={{ alignItems: 'center', opacity: 0.3 }}>
                                    <Image source={APP_ICON_2} style={[styles.backCenterLogo, { marginTop: 50 }]} />
                                </View>
                            </View>

                            {/* Watermark for authenticity */}
                            <View style={styles.watermarkContainer} pointerEvents="none">
                                <Text style={[styles.watermarkText, { color: themeColor + (isDark ? '15' : '10') }]}>
                                    AUTHENTIC COLLABORATION
                                </Text>
                            </View>
                        </Animated.View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.shareOutsideButton}
                    onPress={async () => {
                        try {
                            await Share.share({
                                message: `Check out this collaboration: ${getName(collab.name)}\n\ntama-clothing://collab/${collab.id}`,
                                url: `tama-clothing://collab/${collab.id}`
                            });
                        } catch (error) {
                            console.error('Error sharing:', error);
                        }
                    }}
                >
                    <Share2 size={24} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
            </View >
        </View >
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    backgroundDim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    badgeContainer: {
        width: BADGE_WIDTH,
        height: BADGE_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        width: BADGE_WIDTH,
        height: BADGE_HEIGHT,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    backCard: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    frontContent: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cornerLogo: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
    },
    cornerLogoSmall: {
        width: 45,
        height: 45,
        resizeMode: 'contain',
    },
    cornerLogoBottom: {
        width: 70,
        height: 70,
        resizeMode: 'contain',
        opacity: 0.9,
    },
    badgeType: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(120, 120, 120, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    badgeTypeText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    centerSection: {
        alignItems: 'center',
        gap: 20,
    },
    badgeTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 15,
        width: '100%',
    },
    avatarWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#FFD700',
        padding: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
    },
    avatarBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
    },
    serialBox: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#FFD700',
    },
    serialLabel: {
        fontSize: 8,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '900',
    },
    serialNumber: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: 'bold',
        fontFamily: 'Courier',
    },
    qrWrapper: {
        padding: 15,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    infoWrapper: {
        alignItems: 'center',
        gap: 8,
    },
    collabName: {
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: -0.5,
        width: '100%',
    },
    verifiedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    verifiedText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    scanText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 10,
        flex: 1,
    },
    shimmerContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    shimmer: {
        width: '200%',
        height: '40%',
        position: 'absolute',
        top: -50,
        left: -100,
        transform: [{ rotate: '35deg' }],
        opacity: 0.6,
    },
    backContent: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    backHeader: {
        gap: 12,
    },
    backTitle: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    serialNumberBack: {
        fontSize: 9,
        color: 'rgba(120,120,120,0.6)',
        fontWeight: '700',
        fontFamily: 'Courier',
    },
    divider: {
        width: 30,
        height: 3,
        borderRadius: 1.5,
    },
    detailsSection: {
        gap: 12,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 20,
    },
    statBox: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(120, 120, 120, 0.1)',
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: 'rgba(120, 120, 120, 0.6)',
        letterSpacing: 1,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    actionButton: {
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    visitProfileButton: {
        marginBottom: -100,
        height: 50,
        borderRadius: 25,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    visitProfileText: {
        fontSize: 13,
        fontWeight: '700',
        paddingHorizontal: 4,
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
        paddingHorizontal: 4,
    },
    backCenterLogo: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
        marginBottom: 80,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    socialIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(120, 120, 120, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    closeButton: {
        position: 'absolute',
        top: -60,
        right: 0,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    closeButtonText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '600',
    },
    shareOutsideButton: {
        position: 'absolute',
        top: -60,
        left: 0,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        zIndex: 100,
    },
    glassSeparator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 10,
    },
    watermarkContainer: {
        position: 'absolute',
        bottom: 80,
        width: BADGE_WIDTH,
        alignItems: 'center',
        transform: [{ rotate: '-15deg' }],
        zIndex: -1,
    },
    watermarkText: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 4,
        textAlign: 'center',
    },
});
