import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle,
    TextStyle,
    TextInputProps,
    ActivityIndicator,
    Dimensions,
    Animated,
} from 'react-native';

import { useAppTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
export { BlurView };
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';



const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// Centralised spacing, sizing, and typography constants for all admin screens.
// ─────────────────────────────────────────────────────────────────────────────
export const DS = {
    // Radius
    radius: {
        xs: 8,
        sm: 12,
        md: 16,
        lg: 20,
        xl: 24,
        card: 24,
        icon: 14,
        pill: 100,
    },
    // Spacing
    space: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
        section: 32,
    },
    // Icon Buttons
    icon: {
        sm: 36,
        md: 42,
        lg: 48,
    },
    // Typography
    font: {
        label: { fontSize: 9, fontWeight: '900' as const, letterSpacing: 1.5 },
        caption: { fontSize: 11, fontWeight: '600' as const },
        body: { fontSize: 13, fontWeight: '600' as const },
        title: { fontSize: 15, fontWeight: '800' as const },
        heading: { fontSize: 18, fontWeight: '900' as const },
    },
    // Input height
    inputHeight: 52,
    // List content padding
    listPaddingTop: 12,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────────────────────

interface SectionLabelProps {
    text: string;
    style?: any;
}
export function SectionLabel({ text, style }: SectionLabelProps) {
    const { theme } = useAppTheme();
    return (
        <Text style={[adminStyles.sectionLabel, { color: theme === 'dark' ? '#A1A1AA' : '#6B7280' }, style]}>
            {text.toUpperCase()}
        </Text>
    );
}

interface InputLabelProps {
    text: string;
    style?: any;
}
export function InputLabel({ text, style }: InputLabelProps) {
    const { colors } = useAppTheme();
    return (
        <Text style={[adminStyles.inputLabel, { color: colors.textMuted }, style]}>
            {text.toUpperCase()}
        </Text>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARDS
// ─────────────────────────────────────────────────────────────────────────────

interface AdminCardProps {
    children: React.ReactNode;
    style?: ViewStyle | any;
    onPress?: () => void;
}
export function AdminCard({ children, style, onPress }: AdminCardProps) {
    const { colors, theme } = useAppTheme();
    const cardStyle = [
        adminStyles.card,
        {
            backgroundColor: theme === 'dark' ? '#111118' : '#FFFFFF',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
        },
        style,
    ];
    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={cardStyle}>
                {children}
            </TouchableOpacity>
        );
    }
    return <View style={cardStyle}>{children}</View>;
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUTS
// ─────────────────────────────────────────────────────────────────────────────

interface AdminInputProps extends TextInputProps {
    label?: string;
    style?: ViewStyle | any;
    onPress?: () => void;
    rightElement?: React.ReactNode;
}
export function AdminInput({
    value,
    onChangeText,
    placeholder,
    onPress,
    style,
    label,
    rightElement,
    ...props
}: AdminInputProps) {
    const { colors, theme } = useAppTheme();
    const [isFocused, setIsFocused] = React.useState(false);
    const isDark = theme === 'dark';

    return (
        <View style={[adminStyles.inputGroup, style]}>
            {label && <InputLabel text={label} />}
            <View style={[
                adminStyles.inputWrap,
                {
                    backgroundColor: isDark ? '#1A1A24' : '#FFFFFF',
                    borderColor: isFocused
                        ? colors.foreground
                        : (isDark ? '#242430' : '#E5E5EA'),
                    shadowOpacity: isFocused ? 0.06 : 0,
                },
            ]}>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    editable={!onPress && props.editable !== false}
                    style={[
                        adminStyles.modernInput,
                        {
                            color: colors.foreground,
                            height: props.multiline ? undefined : DS.inputHeight,
                            textAlignVertical: props.multiline ? 'top' : 'center',
                            paddingTop: props.multiline ? 14 : 0,
                            minHeight: props.multiline ? 100 : undefined,
                        },
                    ]}
                    {...props}
                />
                {rightElement && (
                    <View style={adminStyles.inputRight}>{rightElement}</View>
                )}
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH BAR (unified across all list screens)
// ─────────────────────────────────────────────────────────────────────────────

interface AdminSearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    onClear?: () => void;
    style?: ViewStyle;
}
export function AdminSearchBar({ value, onChangeText, placeholder, onClear, style }: AdminSearchBarProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';
    return (
        <View style={[
            adminStyles.searchBar,
            {
                backgroundColor: isDark ? '#121218' : '#F2F2F7',
                borderColor: colors.border,
            },
            style,
        ]}>
            <Text style={{ color: colors.textMuted, fontSize: 16, marginRight: 2 }}>🔍</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder || 'Search…'}
                placeholderTextColor={colors.textMuted}
                style={[adminStyles.searchInput, { color: colors.foreground }]}
            />
            {value.length > 0 && onClear && (
                <TouchableOpacity onPress={onClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ICON BUTTON (standardised across all screens)
// ─────────────────────────────────────────────────────────────────────────────

interface IconBtnProps {
    onPress: () => void;
    children: React.ReactNode;
    variant?: 'default' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    style?: ViewStyle | any;
    disabled?: boolean;
}
export function IconBtn({ onPress, children, variant = 'default', size = 'md', style, disabled }: IconBtnProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';

    const bg = variant === 'danger'
        ? (isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2')
        : variant === 'ghost'
            ? 'transparent'
            : (isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7');

    const dim = DS.icon[size];

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
            style={[
                {
                    width: dim, height: dim,
                    borderRadius: DS.radius.icon,
                    alignItems: 'center' as const,
                    justifyContent: 'center' as const,
                    backgroundColor: bg,
                    opacity: disabled ? 0.5 : 1,
                },
                style,
            ]}
        >
            {children}
        </TouchableOpacity>
    );
}

// Keep legacy name for backwards compatibility
interface IconActionButtonProps {
    onPress: () => void;
    children: React.ReactNode;
    variant?: 'default' | 'danger';
}
export function IconActionButton({ onPress, children, variant = 'default' }: IconActionButtonProps) {
    return <IconBtn onPress={onPress} variant={variant}>{children}</IconBtn>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY BUTTON
// ─────────────────────────────────────────────────────────────────────────────

interface AdminButtonProps {
    label: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'danger' | 'ghost';
    style?: ViewStyle | any;
}
export function AdminButton({ label, onPress, loading, disabled, variant = 'primary', style }: AdminButtonProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';

    const bg = variant === 'danger'
        ? '#EF4444'
        : variant === 'ghost'
            ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)')
            : colors.foreground;

    const textColor = variant === 'ghost'
        ? colors.foreground
        : (variant === 'danger' ? '#FFF' : (isDark ? '#000' : '#FFF'));

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading || disabled}
            activeOpacity={0.8}
            style={[adminStyles.primaryBtn, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }, style]}
        >
            {loading
                ? <ActivityIndicator color={textColor} size="small" />
                : <Text style={[adminStyles.primaryBtnText, { color: textColor }]}>{label.toUpperCase()}</Text>
            }
        </TouchableOpacity>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHIPS / TABS
// ─────────────────────────────────────────────────────────────────────────────

interface AdminChipProps {
    label: string;
    selected: boolean;
    onPress: () => void;
    style?: ViewStyle | any;
}
export function AdminChip({ label, selected, onPress, style }: AdminChipProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={[
                adminStyles.chip,
                {
                    backgroundColor: selected
                        ? (isDark ? '#FFFFFF' : '#000000')
                        : (isDark ? '#1C1C26' : '#F2F2F7'),
                    borderColor: selected
                        ? (isDark ? '#FFFFFF' : '#000000')
                        : (isDark ? '#2C2C3E' : '#E5E5EA'),
                },
                style,
            ]}
        >
            <Text
                style={[
                    adminStyles.chipText,
                    {
                        color: selected
                            ? (isDark ? '#000000' : '#FFFFFF')
                            : (isDark ? '#A1A1AA' : '#6B7280'),
                    },
                ]}
                numberOfLines={1}
            >
                {(label || '').toUpperCase()}
            </Text>
        </TouchableOpacity>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

interface StatusBadgeProps {
    active: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
}
export function StatusBadge({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }: StatusBadgeProps) {
    return (
        <View style={[adminStyles.statusBadge, { backgroundColor: active ? '#EBFDF5' : '#FEF2F2' }]}>
            <View style={[adminStyles.statusDot, { backgroundColor: active ? '#10B981' : '#EF4444' }]} />
            <Text style={[adminStyles.statusBadgeText, { color: active ? '#10B981' : '#EF4444' }]}>
                {active ? activeLabel : inactiveLabel}
            </Text>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODERN TOGGLE SWITCH
// ─────────────────────────────────────────────────────────────────────────────

interface ModernSwitchProps {
    active: boolean;
    onPress: () => void;
}
export function ModernSwitch({ active, onPress }: ModernSwitchProps) {
    const { theme } = useAppTheme();
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            style={[
                adminStyles.switch,
                { backgroundColor: active ? '#34C759' : (theme === 'dark' ? '#2F2F3D' : '#E5E5EA') },
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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION DIVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function SectionDivider() {
    const { colors } = useAppTheme();
    return <View style={[adminStyles.divider, { borderColor: colors.border }]} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

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
            <Text style={[adminStyles.emptyTitle, { color: colors.foreground }]}>{message}</Text>
            {subtitle && (
                <Text style={[adminStyles.emptySubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
            )}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// INFO ROW (for detail views — orders, users, etc.)
// ─────────────────────────────────────────────────────────────────────────────

interface InfoRowProps {
    icon: React.ComponentType<any>;
    label: string;
    value: string;
}
export function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
    const { colors, theme } = useAppTheme();
    return (
        <View style={adminStyles.infoRow}>
            <View style={[adminStyles.infoIcon, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F5F5F7' }]}>
                <Icon size={16} color={colors.foreground} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[adminStyles.infoLabel, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
                <Text style={[adminStyles.infoValue, { color: colors.foreground }]}>{value}</Text>
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD (for dashboard and list headers)
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: string;
    icon?: React.ComponentType<any>;
    color?: string;
    style?: ViewStyle;
}
export function StatCard({ label, value, icon: Icon, color, style }: StatCardProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';
    const accentColor = color || colors.foreground;
    return (
        <View style={[
            adminStyles.statCard,
            {
                backgroundColor: isDark ? '#121218' : '#FFFFFF',
                borderColor: colors.border,
            },
            style,
        ]}>
            {Icon && (
                <View style={[adminStyles.statIconBox, {
                    backgroundColor: accentColor + (isDark ? '18' : '12'),
                }]}>
                    <Icon size={18} color={accentColor} strokeWidth={1.8} />
                </View>
            )}
            <Text style={[adminStyles.statValue, { color: colors.foreground }]}>{value}</Text>
            <Text style={[adminStyles.statLabel, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL HEADER (standardised for all bottom-sheet / page-sheet modals)
// ─────────────────────────────────────────────────────────────────────────────

interface ModalHeaderProps {
    title: string;
    onClose: () => void;
    onSave?: () => void;
    saveLabel?: string;
    saving?: boolean;
}
export function ModalHeader({ title, onClose, onSave, saveLabel = 'Save', saving }: ModalHeaderProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';
    return (
        <View style={[adminStyles.modalHeader, {
            backgroundColor: isDark ? '#121218' : '#FFFFFF',
            borderBottomColor: colors.border,
        }]}>
            <TouchableOpacity onPress={onClose} style={adminStyles.modalAction}>
                <Text style={[adminStyles.modalActionText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[adminStyles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>
                {title.toUpperCase()}
            </Text>
            {onSave ? (
                <TouchableOpacity onPress={onSave} disabled={saving} style={adminStyles.modalAction}>
                    {saving
                        ? <ActivityIndicator size="small" color={colors.foreground} />
                        : <Text style={[adminStyles.modalActionText, { color: colors.foreground, fontWeight: '900' }]}>
                            {saveLabel}
                        </Text>
                    }
                </TouchableOpacity>
            ) : (
                <View style={adminStyles.modalAction} />
            )}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN HEADER (Standardised Header with Blur Effect)
// ─────────────────────────────────────────────────────────────────────────────

interface AdminHeaderProps {
    title: string;
    subtitle?: string;
    onBack: () => void;
    scrollY?: Animated.Value;
    rightElement?: React.ReactNode;
}

export function AdminHeader({
    title,
    subtitle,
    onBack,
    scrollY: scrollYProp,
    rightElement,
}: AdminHeaderProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();

    const fallbackScrollY = React.useRef(new Animated.Value(0)).current;
    const scrollY = scrollYProp ?? fallbackScrollY;

    const titleOpacity = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [1, 0.9],
        extrapolate: 'clamp',
    });

    const HEADER_H = insets.top + (subtitle ? 74 : 58);

    return (
        <View style={[adminStyles.headerContainer, { height: HEADER_H, paddingTop: insets.top }]}>
            <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

            <View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: isDark
                            ? 'rgba(4, 4, 12, 0.4)'
                            : 'rgba(255, 255, 255, 0.4)',
                    },
                ]}
            />

            <View style={adminStyles.headerRowFixed}>
                <TouchableOpacity
                    onPress={onBack}
                    activeOpacity={0.7}
                    style={[
                        adminStyles.headerBackBtn,
                        {
                            backgroundColor: isDark
                                ? 'rgba(255,255,255,0.1)'
                                : 'rgba(0,0,0,0.05)',
                        },
                    ]}
                >
                    <ChevronLeft size={22} color={colors.foreground} strokeWidth={2.5} />
                </TouchableOpacity>

                <Animated.View style={[adminStyles.headerTitleWrap, { opacity: titleOpacity }]}>
                    <Text
                        style={[adminStyles.headerTitleText, { color: colors.foreground }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {title?.toUpperCase()}
                    </Text>
                    {subtitle && (
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: '600',
                                color: colors.textMuted,
                                marginTop: 2,
                                textAlign: 'center',
                            }}
                            numberOfLines={1}
                        >
                            {subtitle}
                        </Text>
                    )}
                </Animated.View>

                <View style={adminStyles.headerRightWrap}>
                    {rightElement || <View style={{ width: 40 }} />}
                </View>
            </View>

            <View style={[adminStyles.headerSeparator, { backgroundColor: colors.border, opacity: 0.5 }]} />
        </View>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER ADMIN SCREEN (Coming Soon)
// ─────────────────────────────────────────────────────────────────────────────

interface PlaceholderAdminScreenProps {
    title: string;
    onBack: () => void;
    t: (key: string) => string;
}

export function PlaceholderAdminScreen({ title, onBack, t }: PlaceholderAdminScreenProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <AdminHeader title={title} onBack={onBack} />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                <View style={{
                    width: 100, height: 100, borderRadius: 50,
                    backgroundColor: isDark ? '#1C1C26' : '#F2F2F7',
                    alignItems: 'center', justifyContent: 'center', marginBottom: 25
                }}>
                    <ShieldCheck size={48} color={isDark ? '#5856D6' : '#5856D6'} strokeWidth={1.5} />
                </View>
                <Text style={{
                    fontSize: 18, fontWeight: '900', color: colors.foreground,
                    letterSpacing: 1, textAlign: 'center'
                }}>
                    {t('comingSoon') || 'COMING SOON'}
                </Text>
                <Text style={{
                    fontSize: 13, color: colors.textMuted,
                    textAlign: 'center', marginTop: 10, lineHeight: 20
                }}>
                    This feature is currently under development. Stay tuned for updates!
                </Text>
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB NAV (segment control for multi-view screens)
// ─────────────────────────────────────────────────────────────────────────────

interface TabItem {
    id: string;
    label: string;
    icon?: React.ComponentType<any>;
}
interface AdminTabNavProps {
    tabs: TabItem[];
    active: string;
    onChange: (id: string) => void;
}
export function AdminTabNav({ tabs, active, onChange }: AdminTabNavProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';
    return (
        <View style={[adminStyles.tabNav, { borderBottomColor: colors.border }]}>
            {tabs.map(tab => {
                const isActive = tab.id === active;
                const Icon = tab.icon;
                return (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => onChange(tab.id)}
                        style={[adminStyles.tabItem, isActive && { borderBottomColor: colors.foreground }]}
                        activeOpacity={0.7}
                    >
                        {Icon && <Icon size={17} color={isActive ? colors.foreground : colors.textMuted} />}
                        <Text style={[
                            adminStyles.tabLabel,
                            { color: isActive ? colors.foreground : colors.textMuted },
                        ]}>
                            {tab.label.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLESHEET
// ─────────────────────────────────────────────────────────────────────────────
export const adminStyles = StyleSheet.create({
    // Typography
    sectionLabel: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 14,
        marginLeft: 2,
        textTransform: 'uppercase',
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginBottom: 8,
        marginLeft: 2,
    },
    inputGroup: {
        marginBottom: DS.space.xl,
    },

    // Input
    inputWrap: {
        borderRadius: DS.radius.md,
        borderWidth: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 0,
        overflow: 'hidden',
    },
    modernInput: {
        flex: 1,
        paddingHorizontal: DS.space.lg,
        fontSize: 14,
        fontWeight: '600',
    },
    inputRight: {
        paddingRight: DS.space.md,
    },

    // Search
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: DS.radius.md,
        paddingHorizontal: DS.space.lg,
        height: 48,
        borderWidth: 1,
        gap: DS.space.sm,
        marginHorizontal: DS.space.xl,
        marginBottom: DS.space.md,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
    },

    // Card
    card: {
        borderRadius: DS.radius.card,
        padding: DS.space.xxl,
        borderWidth: 1,
        marginBottom: DS.space.lg,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
    },

    // Buttons
    primaryBtn: {
        height: 52,
        borderRadius: DS.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: DS.space.xl,
        flexDirection: 'row',
        gap: 10,
    },
    primaryBtnText: {
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 1,
    },

    // Status
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: DS.radius.xs,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.4,
    },

    // Icon Buttons
    iconBtn: {
        width: DS.icon.md,
        height: DS.icon.md,
        borderRadius: DS.radius.icon,
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
        marginVertical: DS.space.lg,
        opacity: 0.5,
    },

    // Empty State
    emptyState: {
        flex: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
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
        marginBottom: DS.space.xl,
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
        marginBottom: DS.space.sm,
        textAlign: 'center' as const,
    },
    emptySubtitle: {
        fontSize: 12,
        fontWeight: '500' as const,
        textAlign: 'center' as const,
        lineHeight: 18,
    },
    emptyText: {
        fontSize: 13,
        fontWeight: '600' as const,
        textAlign: 'center' as const,
    },
    emptyIcon: {
        opacity: 0.3,
        marginBottom: 14,
    },

    // Chip
    chip: {
        paddingHorizontal: DS.space.xl,
        paddingVertical: DS.space.sm + 2,
        borderRadius: DS.radius.pill,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 11,
        fontWeight: '800' as const,
        letterSpacing: 0.5,
        textAlign: 'center' as const,
    },

    // Switch
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

    // Stat Card
    statCard: {
        flex: 1,
        padding: DS.space.lg,
        borderRadius: DS.radius.lg,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    statIconBox: {
        width: 40,
        height: 40,
        borderRadius: DS.radius.sm,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: DS.space.md,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900' as const,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '700' as const,
        letterSpacing: 0.8,
    },

    // Modal
    modalHeader: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: DS.space.xl,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 11,
        fontWeight: '900' as const,
        letterSpacing: 1.2,
        flex: 1,
        textAlign: 'center',
    },
    modalAction: {
        width: 72,
        alignItems: 'center',
    },
    modalActionText: {
        fontSize: 13,
        fontWeight: '700',
    },

    // Tab Nav
    tabNav: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tabItem: {
        flex: 1,
        paddingVertical: DS.space.md,
        alignItems: 'center' as const,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        gap: DS.space.xs,
        flexDirection: 'row',
        justifyContent: 'center' as const,
    },
    tabLabel: {
        fontSize: 9,
        fontWeight: '900' as const,
        letterSpacing: 0.5,
    },

    // Info Row
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DS.space.md,
        marginBottom: DS.space.lg,
    },
    infoIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        flexShrink: 0,
    },
    infoLabel: {
        fontSize: 9,
        fontWeight: '800' as const,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700' as const,
    },

    // Admin Header
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        overflow: 'hidden',
    },
    headerRowFixed: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 10,
    },
    headerBackBtn: {
        width: 40,
        height: 40,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitleText: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    headerRightWrap: {
        minWidth: 40,
        alignItems: 'flex-end',
    },
    headerSeparator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: StyleSheet.hairlineWidth,
    },
});

