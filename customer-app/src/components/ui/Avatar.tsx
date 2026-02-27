import { useColor } from '@/hooks/useColor';
import { User } from 'lucide-react-native';
import React from 'react';
import {
    Image,
    ImageStyle,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { Text } from './text';

interface AvatarProps {
    source?: string | null;
    size?: number;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    imageStyle?: ImageStyle;
    borderWidth?: number;
    borderColor?: string;
    fallback?: string;
}

export function Avatar({
    source,
    size = 40,
    onPress,
    style,
    imageStyle,
    borderWidth = 0,
    borderColor = 'transparent',
    fallback
}: AvatarProps) {
    const backgroundColor = useColor('muted');
    const textSubtleColor = useColor('textMuted');
    const foregroundColor = useColor('foreground');

    const containerStyles: StyleProp<ViewStyle> = [
        {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
            overflow: 'hidden',
            borderWidth,
            borderColor,
            justifyContent: 'center',
            alignItems: 'center',
        } as ViewStyle,
        style
    ];

    const content = (source && source.trim() !== '') ? (
        <Image
            source={{ uri: source }}
            style={[
                { width: '100%', height: '100%' },
                imageStyle
            ]}
            resizeMode="cover"
        />
    ) : fallback ? (
        <Text variant="subtitle" style={{ color: foregroundColor, fontSize: size * 0.4 }}>
            {fallback}
        </Text>
    ) : (
        <User size={size * 0.5} color={textSubtleColor} />
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
