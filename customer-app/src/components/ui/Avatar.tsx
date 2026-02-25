import React from 'react';
import {
    View,
    Image,
    StyleSheet,
    ViewStyle,
    ImageStyle,
    TouchableOpacity,
    StyleProp
} from 'react-native';
import { User } from 'lucide-react-native';
import { Theme } from '../../theme';

interface AvatarProps {
    source?: string | null;
    size?: number;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    imageStyle?: ImageStyle;
    borderWidth?: number;
    borderColor?: string;
}

export function Avatar({
    source,
    size = 40,
    onPress,
    style,
    imageStyle,
    borderWidth = 0,
    borderColor = 'transparent'
}: AvatarProps) {
    const isDark = true;
    const colors = isDark ? Theme.dark.colors : Theme.light.colors;

    const containerStyles: StyleProp<ViewStyle> = [
        {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.muted,
            overflow: 'hidden',
            borderWidth,
            borderColor,
            justifyContent: 'center',
            alignItems: 'center',
        } as ViewStyle,
        style
    ];

    const content = source ? (
        <Image
            source={{ uri: source }}
            style={[
                { width: '100%', height: '100%' },
                imageStyle
            ]}
            resizeMode="cover"
        />
    ) : (
        <User size={size * 0.5} color={colors.textSubtle} />
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} style={containerStyles} activeOpacity={0.8}>
                {content}
            </TouchableOpacity>
        );
    }

    return <View style={containerStyles}>{content}</View>;
}
