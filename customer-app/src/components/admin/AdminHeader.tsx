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
    subtitle?: string;
    onBack: () => void;
    scrollY?: Animated.Value;
    rightElement?: React.ReactNode;
}

/**
 * Shared header used across ALL admin / dashboard screens.
 * Design: centered bold title + optional subtitle, always-present
 * glassmorphism blur background — identical to the Live Analytics header.
 */
export function AdminHeader({
    title,
    subtitle,
    onBack,
    scrollY: scrollYProp,
    rightElement,
}: AdminHeaderProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();

    const fallbackScrollY = React.useRef(new Animated.Value(0)).current;
    const scrollY = scrollYProp ?? fallbackScrollY;

    // Subtle opacity nudge on scroll — keeps it lively without crashing
    const titleOpacity = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [1, 0.88],
        extrapolate: 'clamp',
    });

    // Header height: safe-area top + 54px content + extra 20px when subtitle is shown
    const HEADER_H = insets.top + 54 + (subtitle ? 22 : 0);

    return (
        <View style={[styles.container, { height: HEADER_H, paddingTop: insets.top }]}>

            {/* ── Always-present blur — exactly like Analytics screen ── */}
            <BlurView
                intensity={85}
                tint={isDark ? 'dark' : 'extraLight'}
                style={StyleSheet.absoluteFill}
            />

            {/* Tinted overlay for richness */}
            <View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: isDark
                            ? 'rgba(4, 4, 12, 0.58)'
                            : 'rgba(255, 255, 255, 0.62)',
                    },
                ]}
            />

            {/* Bottom hairline separator */}
            <View
                pointerEvents="none"
                style={[
                    styles.separator,
                    {
                        backgroundColor: isDark
                            ? 'rgba(255,255,255,0.09)'
                            : 'rgba(0,0,0,0.08)',
                    },
                ]}
            />

            {/* ── Content row ── */}
            <View style={styles.row}>

                {/* Back button — rounded pill, same style as Analytics */}
                <TouchableOpacity
                    onPress={onBack}
                    activeOpacity={0.72}
                    style={[
                        styles.backBtn,
                        {
                            backgroundColor: isDark
                                ? 'rgba(255,255,255,0.11)'
                                : 'rgba(0,0,0,0.06)',
                            borderColor: isDark
                                ? 'rgba(255,255,255,0.16)'
                                : 'rgba(0,0,0,0.10)',
                        },
                    ]}
                >
                    <ChevronLeft size={20} color={colors.foreground} strokeWidth={2.5} />
                </TouchableOpacity>

                {/* Centered title area */}
                <Animated.View style={[styles.titleBlock, { opacity: titleOpacity }]}>
                    <Text
                        style={[styles.title, { color: colors.foreground }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                    >
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text
                            style={[
                                styles.subtitle,
                                {
                                    color: isDark
                                        ? 'rgba(255,255,255,0.52)'
                                        : 'rgba(0,0,0,0.44)',
                                },
                            ]}
                            numberOfLines={1}
                        >
                            {subtitle}
                        </Text>
                    ) : null}
                </Animated.View>

                {/* Right slot — keeps title perfectly centered */}
                {rightElement ? (
                    <View style={styles.rightSlot}>{rightElement}</View>
                ) : (
                    <View style={styles.spacer} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 54,
        overflow: 'hidden',
        zIndex: 100,
    },
    separator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: StyleSheet.hairlineWidth,
    },
    row: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 6,
        gap: 10,
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
    titleBlock: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 3,
        textAlign: 'center',
        letterSpacing: 0.1,
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
});
