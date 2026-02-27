import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useColor } from '@/hooks/useColor';
import { Text } from '../ui';

interface FlashSaleCountdownProps {
    endTime: string;
    onEnd?: () => void;
}

export function FlashSaleCountdown({ endTime, onEnd }: FlashSaleCountdownProps) {
    const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });
    const foreground = useColor('foreground');
    const accent = useColor('accent');
    const border = useColor('border');
    const muted = useColor('mutedForeground');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(endTime).getTime();
            const diff = end - now;

            if (diff <= 0) {
                clearInterval(timer);
                setTimeLeft({ h: '00', m: '00', s: '00' });
                if (onEnd) onEnd();
            } else {
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft({
                    h: h.toString().padStart(2, '0'),
                    m: m.toString().padStart(2, '0'),
                    s: s.toString().padStart(2, '0')
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [endTime, onEnd]);

    return (
        <View style={[styles.timerPill, { borderColor: border }]}>
            <Clock size={12} color={foreground} strokeWidth={3} style={{ marginRight: 6 }} />
            <View style={[styles.timerBox, { backgroundColor: accent + '20' }]}>
                <Text style={[styles.timerText, { color: foreground }]}>{timeLeft.h}</Text>
            </View>
            <Text style={{ fontWeight: '900', color: muted, fontSize: 12, marginHorizontal: 2 }}>:</Text>
            <View style={[styles.timerBox, { backgroundColor: accent + '20' }]}>
                <Text style={[styles.timerText, { color: foreground }]}>{timeLeft.m}</Text>
            </View>
            <Text style={{ fontWeight: '900', color: muted, fontSize: 12, marginHorizontal: 2 }}>:</Text>
            <View style={[styles.timerBox, { backgroundColor: accent + '20' }]}>
                <Text style={[styles.timerText, { color: foreground }]}>{timeLeft.s}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    timerPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    timerBox: {
        minWidth: 20,
        height: 20,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerText: {
        fontSize: 11,
        fontWeight: '900',
    },
});
