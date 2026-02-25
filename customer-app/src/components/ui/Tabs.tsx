import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ViewStyle,
    TextStyle
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '../../theme';

interface TabItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface TabsProps {
    tabs: TabItem[];
    activeTabId: string;
    onTabChange: (tabId: any) => void;
    variant?: 'glass' | 'plain' | 'pill';
    style?: ViewStyle;
}

export function Tabs({
    tabs,
    activeTabId,
    onTabChange,
    variant = 'glass',
    style
}: TabsProps) {
    const isDark = true;
    const colors = isDark ? Theme.dark.colors : Theme.light.colors;

    return (
        <View style={[styles.container, style]}>
            <View style={[
                styles.tabsList,
                variant === 'glass' && styles.glassList,
                variant === 'pill' && styles.pillList
            ]}>
                {variant === 'glass' && <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />}
                {tabs.map((tab) => {
                    const isActive = activeTabId === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => onTabChange(tab.id)}
                            style={[
                                styles.tabItem,
                                isActive && styles.tabItemActive,
                                isActive && variant === 'pill' && { backgroundColor: '#FFF' }
                            ]}
                        >
                            {tab.icon && <View style={[styles.iconWrapper, !!tab.label && { marginRight: 6 }]}>{tab.icon}</View>}
                            <Text style={[
                                styles.tabText,
                                { color: isActive ? (variant === 'pill' ? '#000' : colors.foreground) : colors.textMuted },
                                isActive && styles.tabTextActive
                            ]}>
                                {tab.label}
                            </Text>
                            {isActive && variant !== 'pill' && (
                                <View style={[styles.activeIndicator, { backgroundColor: colors.foreground }]} />
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
        width: '100%',
        alignItems: 'center',
    },
    tabsList: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    glassList: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        overflow: 'hidden',
    },
    pillList: {
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 22,
        position: 'relative',
    },
    tabItemActive: {
        // backgroundColor: 'rgba(255,255,255,0.1)',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
    },
    tabTextActive: {
        fontWeight: '900',
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 6,
        left: '50%',
        marginLeft: -10,
        width: 20,
        height: 2,
        borderRadius: 1,
    }
});
