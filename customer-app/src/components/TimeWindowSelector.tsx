import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Check } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';
import { TimeWindow, DEFAULT_TIME_WINDOWS } from '../types/delivery';

interface TimeWindowSelectorProps {
    selectedWindow?: TimeWindow;
    onSelect: (window: TimeWindow) => void;
    date?: string;
    disabled?: boolean;
}

export function TimeWindowSelector({
    selectedWindow,
    onSelect,
    disabled = false,
}: TimeWindowSelectorProps) {
    const { colors } = useAppTheme();

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Clock size={20} color={colors.accent} />
                <Text style={[styles.title, { color: colors.foreground }]}>
                    Delivery Time
                </Text>
            </View>

            <View style={styles.grid}>
                {DEFAULT_TIME_WINDOWS.map((window, index) => {
                    const isSelected = selectedWindow?.start === window.start;
                    const isAvailable = !disabled;

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.slot,
                                { 
                                    backgroundColor: isSelected ? colors.accent : colors.surface,
                                    borderColor: isSelected ? colors.accent : colors.border,
                                    opacity: isAvailable ? 1 : 0.5,
                                },
                            ]}
                            onPress={() => isAvailable && onSelect(window)}
                            disabled={disabled}
                        >
                            <View style={styles.slotContent}>
                                <Text
                                    style={[
                                        styles.slotTime,
                                        { color: isSelected ? '#FFF' : colors.foreground },
                                    ]}
                                >
                                    {formatTime(window.start)} - {formatTime(window.end)}
                                </Text>
                                <Text
                                    style={[
                                        styles.slotLabel,
                                        { color: isSelected ? '#FFF' : colors.textMuted },
                                    ]}
                                >
                                    {window.label}
                                </Text>
                            </View>

                            {window.additionalCost > 0 && (
                                <View
                                    style={[
                                        styles.extraBadge,
                                        { backgroundColor: isSelected ? '#FFF' : colors.accent + '20' },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.extraText,
                                            { color: isSelected ? colors.accent : colors.accent },
                                        ]}
                                    >
                                        +{window.additionalCost} TND
                                    </Text>
                                </View>
                            )}

                            {isSelected && (
                                <View style={styles.checkmark}>
                                    <Check size={16} color="#FFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
    },
    grid: {
        gap: 10,
    },
    slot: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    slotContent: {
        flex: 1,
    },
    slotTime: {
        fontSize: 14,
        fontWeight: '800',
    },
    slotLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    extraBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    extraText: {
        fontSize: 11,
        fontWeight: '700',
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
});
