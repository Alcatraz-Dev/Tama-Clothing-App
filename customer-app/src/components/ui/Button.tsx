import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
    ViewStyle,
    TextStyle,
    StyleProp
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass' | 'error' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps {
    onPress?: () => void;
    title?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: React.ReactNode;
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    children?: React.ReactNode;
    activeOpacity?: number;
}

export function Button({
    onPress,
    title,
    variant = 'primary',
    size = 'md',
    icon,
    loading,
    disabled,
    style,
    textStyle,
    children,
    activeOpacity = 0.7
}: ButtonProps) {
    const isDark = true; // Assuming dark-centric design for the feed or can be dynamic
    const colors = isDark ? Theme.dark.colors : Theme.light.colors;

    const getVariantStyles = (): ViewStyle => {
        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: colors.foreground,
                };
            case 'secondary':
                return {
                    backgroundColor: colors.muted,
                };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: colors.border,
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                };
            case 'glass':
                return {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                };
            case 'error':
                return {
                    backgroundColor: colors.error,
                };
            case 'success':
                return {
                    backgroundColor: colors.success,
                };
            default:
                return {};
        }
    };

    const getSizeStyles = (): ViewStyle => {
        switch (size) {
            case 'sm':
                return {
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: Theme.radius.sm,
                    height: 32,
                };
            case 'lg':
                return {
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    borderRadius: Theme.radius.lg,
                    height: 56,
                };
            case 'icon':
                return {
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    padding: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                };
            case 'md':
            default:
                return {
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: Theme.radius.md,
                    height: 44,
                };
        }
    };

    const getTextColor = (): string => {
        if (disabled) return colors.textSubtle;
        switch (variant) {
            case 'primary':
                return colors.primaryForeground;
            case 'secondary':
            case 'outline':
            case 'ghost':
            case 'glass':
                return colors.foreground;
            case 'error':
            case 'success':
                return colors.white;
            default:
                return colors.foreground;
        }
    };

    const containerStyles: StyleProp<ViewStyle> = [
        styles.base,
        getVariantStyles(),
        getSizeStyles(),
        disabled && styles.disabled,
        style,
    ];

    const content = (
        <View style={styles.content}>
            {loading ? (
                <ActivityIndicator size="small" color={getTextColor()} />
            ) : (
                <>
                    {icon && <View style={[styles.iconWrapper, !!title && styles.iconMargin]}>{icon}</View>}
                    {title && (
                        <Text style={[
                            styles.text,
                            { color: getTextColor() },
                            size === 'sm' && styles.textSm,
                            size === 'lg' && styles.textLg,
                            textStyle
                        ]}>
                            {title}
                        </Text>
                    )}
                    {children}
                </>
            )}
        </View>
    );

    if (variant === 'glass') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={activeOpacity}
                style={containerStyles}
            >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                {content}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={activeOpacity}
            style={containerStyles}
        >
            {content}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    textSm: {
        fontSize: 13,
    },
    textLg: {
        fontSize: 17,
        fontWeight: '800',
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconMargin: {
        marginRight: 8,
    },
    disabled: {
        opacity: 0.5,
    },
});
