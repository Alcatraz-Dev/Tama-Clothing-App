import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

// ─── Section Label ──────────────────────────────────────────────────────────
interface SectionLabelProps {
    text: string;
    style?: ViewStyle;
}
export function SectionLabel({ text, style }: SectionLabelProps) {
    const { colors, theme } = useAppTheme();
    return (
        <Text style={[adminStyles.sectionLabel, { color: theme === 'dark' ? '#A1A1AA' : '#6B7280' }, style]}>
            {text.toUpperCase()}
        </Text>
    );
}

// ─── Input Label ─────────────────────────────────────────────────────────────
interface InputLabelProps {
    text: string;
    style?: any;
}
export function InputLabel({ text, style }: InputLabelProps) {
    const { colors } = useAppTheme();
    return (
        <Text style={[adminStyles.inputLabel, { color: colors.foreground }, style]}>
            {text}
        </Text>
    );
}

// ─── Modern Switch ───────────────────────────────────────────────────────────
interface ModernSwitchProps {
    active: boolean;
    onPress: () => void;
}
export function ModernSwitch({ active, onPress }: ModernSwitchProps) {
    const { theme } = useAppTheme();
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                adminStyles.switch,
                {
                    backgroundColor: active
                        ? '#34C759' // High contrast iOS style green
                        : (theme === 'dark' ? '#2F2F3D' : '#E5E5EA'),
                },
            ]}
        >
            <View
                style={[
                    adminStyles.switchDot,
                    {
                        backgroundColor: '#FFFFFF',
                        transform: [{ translateX: active ? 18 : 0 }],
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowRadius: 2,
                        elevation: 2,
                    },
                ]}
            />
        </TouchableOpacity>
    );
}

// ─── Admin Card ──────────────────────────────────────────────────────────────
interface AdminCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
}
export function AdminCard({ children, style }: AdminCardProps) {
    const { colors, theme } = useAppTheme();
    return (
        <View
            style={[
                adminStyles.card,
                {
                    backgroundColor: theme === 'dark' ? '#121218' : '#FFFFFF',
                    borderColor: colors.border,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}

// ─── Status Badge ────────────────────────────────────────────────────────────
interface StatusBadgeProps {
    active: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
}
export function StatusBadge({
    active,
    activeLabel = 'ACTIVE',
    inactiveLabel = 'INACTIVE',
}: StatusBadgeProps) {
    return (
        <View
            style={[
                adminStyles.statusBadge,
                { backgroundColor: active ? '#EBFDF5' : '#FEF2F2' },
            ]}
        >
            <Text
                style={[
                    adminStyles.statusBadgeText,
                    { color: active ? '#10B981' : '#EF4444' },
                ]}
            >
                {active ? activeLabel : inactiveLabel}
            </Text>
        </View>
    );
}

// ─── Icon Action Button ──────────────────────────────────────────────────────
interface IconActionButtonProps {
    onPress: () => void;
    children: React.ReactNode;
    variant?: 'default' | 'danger';
}
export function IconActionButton({
    onPress,
    children,
    variant = 'default',
}: IconActionButtonProps) {
    const { theme } = useAppTheme();
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                adminStyles.iconBtn,
                variant === 'danger'
                    ? adminStyles.iconBtnDanger
                    : { backgroundColor: theme === 'dark' ? '#1A1A24' : '#F2F2F7' },
            ]}
        >
            {children}
        </TouchableOpacity>
    );
}


// ─── Section Divider ─────────────────────────────────────────────────────────
export function SectionDivider() {
    const { colors } = useAppTheme();
    return (
        <View
            style={[adminStyles.divider, { borderColor: colors.border }]}
        />
    );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
interface EmptyStateProps {
    message: string;
    subtitle?: string;
    icon?: React.ReactNode;
}
export function EmptyState({ message, subtitle, icon }: EmptyStateProps) {
    const { colors, theme } = useAppTheme();
    return (
        <View style={adminStyles.emptyState}>
            {icon && (
                <View style={[adminStyles.emptyIconBox, {
                    backgroundColor: theme === 'dark' ? '#121218' : '#F5F5F7',
                    borderColor: colors.border,
                }]}>
                    {icon}
                </View>
            )}
            <Text style={[adminStyles.emptyTitle, { color: colors.foreground }]}>
                {message}
            </Text>
            {subtitle && (
                <Text style={[adminStyles.emptySubtitle, { color: colors.textMuted }]}>
                    {subtitle}
                </Text>
            )}
        </View>
    );
}

// ─── Admin Chip / Tag ─────────────────────────────────────────────────────────
interface AdminChipProps {
    label: string;
    selected: boolean;
    onPress: () => void;
}
export function AdminChip({ label, selected, onPress }: AdminChipProps) {
    const { colors, theme } = useAppTheme();
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                adminStyles.chip,
                {
                    backgroundColor: selected
                        ? (theme === 'dark' ? '#FFFFFF' : '#000000') // Explicit high-contrast background
                        : (theme === 'dark' ? '#1D1D27' : '#E8E8ED'), // Softer inactive background
                    borderColor: selected
                        ? (theme === 'dark' ? '#FFFFFF' : '#000000')
                        : (theme === 'dark' ? '#2F2F3D' : '#D1D1D6'), // Visible border
                },
            ]}
        >
            <Text
                style={[
                    adminStyles.chipText,
                    {
                        color: selected
                            ? (theme === 'dark' ? '#000000' : '#FFFFFF') // High contrast inner text
                            : (theme === 'dark' ? '#A1A1AA' : '#6B7280'), // Muted inactive text
                    },
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
export const adminStyles = StyleSheet.create({
    // Typography
    sectionLabel: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 14,
        marginLeft: 2,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
        marginBottom: 7,
        marginTop: 16,
        marginLeft: 4,
    },

    // Card
    card: {
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },

    // Status
    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.3,
    },

    // Buttons
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBtnDanger: {
        backgroundColor: '#FEF2F2',
    },

    // Divider
    divider: {
        height: 0,
        borderTopWidth: 1,
        borderStyle: 'dashed',
        marginVertical: 14,
        opacity: 0.5,
    },

    // Empty State
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIconBox: {
        width: 90,
        height: 90,
        borderRadius: 28,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderWidth: 1,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '800' as const,
        letterSpacing: 0.3,
        marginBottom: 8,
        textAlign: 'center' as const,
    },
    emptySubtitle: {
        fontSize: 12,
        fontWeight: '500' as const,
        textAlign: 'center' as const,
        lineHeight: 18,
    },
    emptyIcon: {
        opacity: 0.3,
        marginBottom: 14,
    },
    emptyText: {
        fontSize: 13,
        fontWeight: '600' as const,
        textAlign: 'center' as const,
    },

    // Chip
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 16,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 10,
        fontWeight: '900' as const,
        letterSpacing: 0.5,
    },
    switch: {
        width: 46,
        height: 28,
        borderRadius: 14,
        padding: 3,
        justifyContent: 'center',
    },
    switchDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
    },
});
