import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { AppText as Text } from '../../App';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Gift, Zap, MapPin, Truck, RefreshCw } from 'lucide-react-native';

const APP_ICON = require('../../assets/logo.png');
const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 240;

interface FidelityCardProps {
    points: number;
    isCompleted: boolean;
    index: number;
    isDark: boolean;
    t: any;
}

export default function FidelityCard({ points, isCompleted, index, isDark, t }: FidelityCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const flipAnim = useSharedValue(0);

    const tr = (key: string, fallback: string) => {
        const res = t(key);
        return res === key ? fallback : res;
    };

    const themeColor = isDark ? '#FFF' : '#000';
    const bgColor = isDark ? '#111' : '#FFF';
    const borderColor = isDark ? '#333' : '#E5E5E5';

    const handleFlip = () => {
        flipAnim.value = withSpring(isFlipped ? 0 : 180, { damping: 12, stiffness: 90 });
        setIsFlipped(!isFlipped);
    };

    const frontStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipAnim.value, [0, 180], [0, 180]);
        return {
            transform: [{ rotateY: `${rotateY}deg` }],
            zIndex: isFlipped ? 0 : 1,
            opacity: interpolate(flipAnim.value, [89, 90], [1, 0]),
            position: 'absolute',
        };
    });

    const backStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipAnim.value, [0, 180], [180, 360]);
        return {
            transform: [{ rotateY: `${rotateY}deg` }],
            zIndex: isFlipped ? 1 : 0,
            opacity: interpolate(flipAnim.value, [89, 90], [0, 1]),
            position: 'absolute',
        };
    });

    const renderCircles = () => {
        const circles = [];
        for (let i = 0; i < 10; i++) {
            const isActive = i < points;
            circles.push(
                <View key={i} style={[styles.circle, { borderColor: isActive ? '#00FF9D' : borderColor, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                    <Image
                        source={APP_ICON}
                        style={[styles.logoInside, { opacity: isActive ? 1 : 0.1 }, isActive ? {} : { tintColor: isDark ? '#FFF' : '#000' }]}
                    />
                </View>
            );
        }
        return circles;
    };

    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={handleFlip}>
            {/* FRONT OF THE CARD */}
            <Animated.View style={[styles.card, { backgroundColor: bgColor, borderColor: borderColor }, frontStyle]}>
                {/* Coupon Cutouts */}
                <View style={[styles.cutout, styles.cutoutLeft, { backgroundColor: isDark ? '#080808' : '#F9F9FB', borderColor: borderColor }]} />
                <View style={[styles.cutout, styles.cutoutRight, { backgroundColor: isDark ? '#080808' : '#F9F9FB', borderColor: borderColor }]} />

                <LinearGradient
                    colors={isCompleted ? ['rgba(0, 255, 157, 0.2)', 'transparent'] : ['transparent', 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: themeColor }]}>
                        {tr('fidelityCard', 'LOYALTY CARD')} #{index}
                    </Text>
                    {isCompleted && (
                        <View style={styles.completedBadge}>
                            <Zap size={10} color="#000" fill="#000" />
                            <Text style={styles.completedText}>{tr('completed', 'COMPLETED')}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.circlesGrid}>
                    {renderCircles()}
                </View>

                <Text style={[styles.instruction, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}>
                    {isCompleted ? tr('tapToFlipGift', 'Tap to flip and check your gift!') : `${10 - points} ${tr('morePurchasesToGetGift', 'more purchases to get a gift')}`}
                </Text>
            </Animated.View>

            {/* BACK OF THE CARD */}
            <Animated.View style={[styles.card, styles.cardBack, { backgroundColor: bgColor, borderColor: borderColor }, backStyle]}>
                <View style={[styles.cutout, styles.cutoutLeft, { backgroundColor: isDark ? '#080808' : '#F9F9FB', borderColor: borderColor }]} />
                <View style={[styles.cutout, styles.cutoutRight, { backgroundColor: isDark ? '#080808' : '#F9F9FB', borderColor: borderColor }]} />

                <LinearGradient
                    colors={['rgba(255, 77, 103, 0.15)', 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.backContent}>
                    <View style={styles.giftIconContainer}>
                        <Gift size={32} color="#FF4D67" fill="rgba(255, 77, 103, 0.2)" />
                    </View>
                    <Text style={[styles.rewardTitle, { color: themeColor }]}>
                        {tr('yourRewards', 'YOUR REWARDS')}
                    </Text>

                    {isCompleted ? (
                        <View style={styles.optionsContainer}>
                            <View style={[styles.optionItem, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
                                <Truck size={18} color="#00FF9D" />
                                <Text style={[styles.optionText, { color: themeColor }]}>{tr('freeDeliveryReward', 'Free Delivery on next order')}</Text>
                            </View>
                            <View style={[styles.optionItem, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
                                <Text style={{ color: '#FFD600', fontWeight: 'bold', fontSize: 16 }}>-20%</Text>
                                <Text style={[styles.optionText, { color: themeColor }]}>{tr('discountCouponReward', 'Discount Coupon')}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 15 }}>
                            <Text style={[styles.notFinishedText, { color: isDark ? '#888' : '#666' }]}>
                                {tr('completeToUnlock', 'Complete 10 purchases to unlock exclusive rewards like free delivery and huge discounts!')}
                            </Text>
                        </View>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 'auto', opacity: 0.5 }}>
                        <RefreshCw size={12} color={themeColor} />
                        <Text style={[styles.flipInstruction, { color: themeColor }]}>{tr('tapToFlipBack', 'Tap to flip back')}</Text>
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        alignSelf: 'center',
        marginBottom: 20,
    },
    card: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        padding: 16,
        justifyContent: 'center',
        // Shadow for premium feel
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    cardBack: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cutout: {
        position: 'absolute',
        top: CARD_HEIGHT / 2 - 15,
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        zIndex: 10,
    },
    cutoutLeft: {
        left: -16,
        borderRightWidth: 1,
    },
    cutoutRight: {
        right: -16,
        borderLeftWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00FF9D',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    completedText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#000',
    },
    circlesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
        paddingHorizontal: 10,
    },
    circle: {
        width: (CARD_WIDTH - 60) / 5 - 8,
        height: (CARD_WIDTH - 60) / 5 - 8,
        borderRadius: 100,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoInside: {
        width: '55%',
        height: '55%',
        resizeMode: 'contain',
        alignSelf: 'center',
    },
    instruction: {
        marginTop: 15,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    backContent: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        width: '100%',
        paddingHorizontal: 10,
    },
    giftIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 77, 103, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    rewardTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    optionsContainer: {
        width: '100%',
        marginTop: 10,
        gap: 8,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        gap: 12,
    },
    optionText: {
        fontSize: 12,
        fontWeight: '700',
        flexShrink: 1,
    },
    notFinishedText: {
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '600',
        paddingHorizontal: 10,
    },
    flipInstruction: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 5,
    }
});
