import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    StyleProp
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '../../theme';
import { useAppTheme } from '../../context/ThemeContext';

type BadgeVariant = 'primary' | 'secondary' | 'error' | 'success' | 'warning' | 'glass';

interface BadgeProps {
    label: string | number;
    variant?: BadgeVariant;
    icon?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export function Badge({
    label,
    variant = 'primary',
    icon,
    style,
    textStyle
}: BadgeProps) {
    const { theme } = useAppTheme();
    const isDark = theme === 'dark';
    const colors = isDark ? Theme.dark.colors : Theme.light.colors;

    const variantStyles: Record<BadgeVariant, ViewStyle> = {
        primary: { backgroundColor: colors.foreground },
        secondary: { backgroundColor: colors.muted },
        error: { backgroundColor: colors.error },
        success: { backgroundColor: colors.success },
        warning: { backgroundColor: colors.warning },
        glass: {
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
        },
    };

    const textStyles: Record<BadgeVariant, TextStyle> = {
        primary: { color: isDark ? colors.background : colors.white },
        secondary: { color: colors.foreground },
        error: { color: colors.white },
        success: { color: colors.white },
        warning: { color: colors.white },
        glass: { color: '#FFF' },
    };

    const containerStyles: StyleProp<ViewStyle> = [
        styles.badge,
        variantStyles[variant],
        style
    ];

    return (
        <View style={containerStyles}>
            {variant === 'glass' && (
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            )}
            <View style={styles.content}>
                {icon && <View style={styles.iconWrapper}>{icon}</View>}
                <Text style={[
                    styles.text,
                    textStyles[variant],
                    textStyle
                ]}>
                    {label}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 11,
        fontWeight: '900',
    },
});
