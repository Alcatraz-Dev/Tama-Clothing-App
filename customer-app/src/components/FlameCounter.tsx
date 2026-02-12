import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, TouchableOpacity } from 'react-native';
import { Flame } from 'lucide-react-native';

export const FlameCounter = ({ count, onPress, top = 110 }: { count: number, onPress?: () => void, top?: number }) => {
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const colorAnim = useRef(new Animated.Value(0)).current;
    const lastUpdateRef = useRef(Date.now());
    const heatLevelRef = useRef(0); // 0 to 1

    useEffect(() => {
        // if (count === 0) return; // Allow 0 to show for consistency


        const now = Date.now();
        const timeDiff = now - lastUpdateRef.current;
        lastUpdateRef.current = now;

        // Increase heat if spamming (rapid clicks < 200ms)
        if (timeDiff < 200) {
            heatLevelRef.current = Math.min(heatLevelRef.current + 0.1, 1);
        } else {
            // Decay heat slowly
            heatLevelRef.current = Math.max(heatLevelRef.current - 0.05, 0);
        }

        // Animate Color based on heat
        Animated.timing(colorAnim, {
            toValue: heatLevelRef.current,
            duration: 200,
            useNativeDriver: false // color interpolation requires false
        }).start();

        // Shake Animation
        shakeAnim.setValue(0);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -1, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0.5, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -0.5, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();

    }, [count]);

    const iconColor = colorAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['#FF9500', '#FF3B30', '#FFFFFF'] // Orange -> Red -> White (Hot!)
    });

    // Animate scale based on color/heat
    const scale = colorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.2]
    });

    const shakeX = shakeAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: [-3, 3]
    });

    // if (count === 0) return null;

    return (
        <Animated.View style={{
            position: 'absolute',
            top: top,
            left: 20,
            zIndex: 1500,
            transform: [{ translateX: shakeX }]
        }}>
            <Animated.View style={{ transform: [{ scale: scale }] }}>
                <TouchableOpacity
                    onPress={onPress}
                    activeOpacity={0.8}
                    disabled={!onPress}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                    }}
                >
                    <Flame size={18} color="#FF5722" fill="#FF5722" />
                    <Animated.Text style={{
                        color: iconColor,
                        fontSize: 12,
                        fontWeight: 'bold',
                        marginLeft: 4,
                        textShadowColor: 'rgba(0,0,0,0.8)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2
                    }}>
                        {count}
                    </Animated.Text>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
};
