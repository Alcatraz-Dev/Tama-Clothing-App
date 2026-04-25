import React from 'react';
import { View } from 'react-native';
import * as Animatable from 'react-native-animatable';

interface TypingIndicatorProps {
    color: string;
    size?: number;
    gap?: number;
}

export const TypingIndicator = ({ color, size = 5, gap = 4 }: TypingIndicatorProps) => {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap, paddingHorizontal: 4 }}>
            {[0, 1, 2].map((i) => (
                <Animatable.View
                    key={i}
                    animation={{
                        0: { opacity: 0.3, transform: [{ scale: 0.8 }] },
                        0.5: { opacity: 1, transform: [{ scale: 1.1 }] },
                        1: { opacity: 0.3, transform: [{ scale: 0.8 }] },
                    }}
                    iterationCount="infinite"
                    duration={1000}
                    delay={i * 200}
                    style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: color,
                    }}
                />
            ))}
        </View>
    );
};
