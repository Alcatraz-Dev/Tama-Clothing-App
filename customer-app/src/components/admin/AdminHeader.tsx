import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { ChevronLeft } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';

interface AdminHeaderProps {
    title: string;
    onBack: () => void;
    scrollY: Animated.Value;
    rightElement?: React.ReactNode;
}

export function AdminHeader({ title, onBack, scrollY, rightElement }: AdminHeaderProps) {
    const { colors, theme } = useAppTheme();

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <Animated.View
            style={[
                styles.header,
                {
                    backgroundColor: colors.background,
                    borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                },
            ]}
        >
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
                <BlurView
                    intensity={80}
                    style={StyleSheet.absoluteFill}
                    tint={theme === 'dark' ? 'dark' : 'light'}
                />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + 'B3' }]} />
            </Animated.View>

            <TouchableOpacity
                onPress={onBack}
                style={[styles.backBtn, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : '#F2F2F7' }]}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
                <ChevronLeft size={20} color={colors.foreground} />
            </TouchableOpacity>

            <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                pointerEvents="none"
                style={[styles.title, { color: colors.foreground }]}
            >
                {title}
            </Text>

            {rightElement ?? <View style={styles.placeholder} />}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 1000,
        overflow: 'hidden',
    },
    title: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1,
        position: 'absolute',
        left: 50,
        right: 50,
        textAlign: 'center',
        zIndex: 1,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    placeholder: {
        width: 40,
    },
});
