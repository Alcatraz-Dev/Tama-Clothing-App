import React from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ChevronLeft } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AdminHeaderProps {
    title: string;
    onBack: () => void;
    scrollY?: Animated.Value;
    rightElement?: React.ReactNode;
}

export function AdminHeader({ title, onBack, scrollY: scrollYProp, rightElement }: AdminHeaderProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();

    const fallbackScrollY = React.useRef(new Animated.Value(0)).current;
    const scrollY = scrollYProp ?? fallbackScrollY;

    // Blur appears as user scrolls
    const glassOpacity = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // Compact title fades in after scrolling
    const compactTitleOpacity = scrollY.interpolate({
        inputRange: [25, 60],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // Large title fades out when scrolling
    const largeTitleOpacity = scrollY.interpolate({
        inputRange: [0, 40],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const largeTitleY = scrollY.interpolate({
        inputRange: [0, 40],
        outputRange: [0, -8],
        extrapolate: 'clamp',
    });

    const topBarHeight = 52; // Content height of the nav bar (below the safe area padding)

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* ── SAFE AREA + TOP BAR ── */}
            <View style={[styles.topBarWrapper, { paddingTop: insets.top }]}>
                {/* Glassmorphism layer — appears on scroll */}
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { opacity: glassOpacity, overflow: 'hidden' }
                    ]}
                    pointerEvents="none"
                >
                    <BlurView
                        intensity={85}
                        tint={isDark ? 'dark' : 'extraLight'}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: isDark
                                ? 'rgba(8, 8, 16, 0.60)'
                                : 'rgba(255, 255, 255, 0.65)',
                        }
                    ]} />
                    {/* Bottom separator line */}
                    <View style={[
                        styles.separator,
                        {
                            backgroundColor: isDark
                                ? 'rgba(255,255,255,0.07)'
                                : 'rgba(0,0,0,0.07)',
                        }
                    ]} />
                </Animated.View>

                {/* Top bar content row */}
                <View style={[styles.row, { height: topBarHeight }]}>
                    <TouchableOpacity
                        onPress={onBack}
                        activeOpacity={0.7}
                        style={[
                            styles.backBtn,
                            {
                                backgroundColor: isDark
                                    ? 'rgba(255,255,255,0.09)'
                                    : 'rgba(0,0,0,0.05)',
                                borderColor: isDark
                                    ? 'rgba(255,255,255,0.12)'
                                    : 'rgba(0,0,0,0.07)',
                            }
                        ]}
                    >
                        <ChevronLeft size={20} color={colors.foreground} strokeWidth={2.5} />
                    </TouchableOpacity>

                    {/* Compact title — visible when scrolled */}
                    <Animated.Text
                        numberOfLines={1}
                        style={[
                            styles.compactTitle,
                            { color: colors.foreground, opacity: compactTitleOpacity }
                        ]}
                    >
                        {title}
                    </Animated.Text>

                    {rightElement
                        ? <View style={styles.rightSlot}>{rightElement}</View>
                        : <View style={styles.spacer} />
                    }
                </View>
            </View>

            {/* ── LARGE TITLE ROW ── */}
            <Animated.View style={[
                styles.largeTitleRow,
                {
                    opacity: largeTitleOpacity,
                    transform: [{ translateY: largeTitleY }],
                }
            ]}>
                <Text
                    style={[styles.largeTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                >
                    {title}
                </Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        zIndex: 100,
    },
    topBarWrapper: {
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
    },
    separator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        gap: 8,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        flexShrink: 0,
    },
    compactTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    rightSlot: {
        width: 40,
        alignItems: 'flex-end',
        flexShrink: 0,
    },
    spacer: {
        width: 40,
        flexShrink: 0,
    },

    // Large title
    largeTitleRow: {
        height: 48,
        paddingHorizontal: 22,
        justifyContent: 'center',
    },
    largeTitle: {
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: -0.3,
        lineHeight: 36,
    },
});
