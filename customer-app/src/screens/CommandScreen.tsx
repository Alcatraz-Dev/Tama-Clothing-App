import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Animated as RNAnimated,
    RefreshControl,
    Image,
    Dimensions,
    Platform,
    StatusBar,
} from 'react-native';
import {
    ArrowLeft,
    Search,
    Eye,
    EyeOff,
    Pin,
    PinOff,
    CheckCircle,
    Circle,
    Command,
    Clock,
    X,
    Palette,
    Box,
    ShoppingBag,
    Filter,
    ChevronRight,
    TrendingUp,
} from 'lucide-react-native';
import { BlurView, BlurTargetView } from 'expo-blur';
import { useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAppTheme } from '../context/ThemeContext';

// BNA UI Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProductCommand {
    id: string;
    productName: string;
    productImage: string;
    color: string;
    size: string;
    price: number;
    quantity: number;
    category: string;
    isPinned: boolean;
    isCompleted: boolean;
    isHidden: boolean;
    lastUsed?: Date;
    usageCount: number;
    createdAt: Date;
    orderId?: string;
}

interface CommandScreenProps {
    onBack: () => void;
    t: (key: string) => string;
}

// Sample product command data
const SAMPLE_COMMANDS: ProductCommand[] = [
    {
        id: '1',
        productName: 'Premium Cotton T-Shirt',
        productImage: 'https://picsum.photos/200/200?random=1',
        color: 'Black',
        size: 'L',
        price: 29.99,
        quantity: 2,
        category: 'Clothing',
        isPinned: true,
        isCompleted: false,
        isHidden: false,
        usageCount: 15,
        createdAt: new Date('2024-01-15'),
        orderId: 'ORD-001',
    },
    {
        id: '2',
        productName: 'Denim Jacket Classic',
        productImage: 'https://picsum.photos/200/200?random=2',
        color: 'Blue',
        size: 'M',
        price: 89.99,
        quantity: 1,
        category: 'Clothing',
        isPinned: true,
        isCompleted: false,
        isHidden: false,
        usageCount: 8,
        createdAt: new Date('2024-02-01'),
        orderId: 'ORD-002',
    },
    {
        id: '3',
        productName: 'Leather Sneakers',
        productImage: 'https://picsum.photos/200/200?random=3',
        color: 'White',
        size: '42',
        price: 120.00,
        quantity: 1,
        category: 'Footwear',
        isPinned: false,
        isCompleted: true,
        isHidden: false,
        usageCount: 25,
        createdAt: new Date('2024-01-10'),
        orderId: 'ORD-003',
    },
    {
        id: '4',
        productName: 'Wool Sweater',
        productImage: 'https://picsum.photos/200/200?random=4',
        color: 'Gray',
        size: 'XL',
        price: 65.00,
        quantity: 3,
        category: 'Clothing',
        isPinned: false,
        isCompleted: true,
        isHidden: false,
        usageCount: 12,
        createdAt: new Date('2024-01-20'),
        orderId: 'ORD-004',
    },
    {
        id: '5',
        productName: 'Silk Scarf',
        productImage: 'https://picsum.photos/200/200?random=5',
        color: 'Red',
        size: 'One Size',
        price: 45.00,
        quantity: 1,
        category: 'Accessories',
        isPinned: false,
        isCompleted: false,
        isHidden: false,
        usageCount: 5,
        createdAt: new Date('2024-02-05'),
        orderId: 'ORD-005',
    },
    {
        id: '6',
        productName: 'Canvas Backpack',
        productImage: 'https://picsum.photos/200/200?random=6',
        color: 'Navy',
        size: 'Medium',
        price: 55.00,
        quantity: 1,
        category: 'Bags',
        isPinned: false,
        isCompleted: false,
        isHidden: false,
        usageCount: 3,
        createdAt: new Date('2024-02-10'),
        orderId: 'ORD-006',
    },
];

type FilterType = 'all' | 'pinned' | 'completed' | 'hidden';

export default function CommandScreen({ onBack, t }: CommandScreenProps) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';

    const [commands, setCommands] = useState<ProductCommand[]>(SAMPLE_COMMANDS);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [showSearch, setShowSearch] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const blurTargetRef = useRef<View>(null);

    const translate = t || ((k: string) => k);

    const filteredCommands = useMemo(() => {
        let result = [...commands];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                cmd =>
                    cmd.productName.toLowerCase().includes(query) ||
                    cmd.color.toLowerCase().includes(query) ||
                    cmd.size.toLowerCase().includes(query) ||
                    cmd.category.toLowerCase().includes(query) ||
                    (cmd.orderId && cmd.orderId.toLowerCase().includes(query))
            );
        }

        switch (activeFilter) {
            case 'pinned':
                result = result.filter(cmd => cmd.isPinned && !cmd.isHidden);
                break;
            case 'completed':
                result = result.filter(cmd => cmd.isCompleted && !cmd.isHidden);
                break;
            case 'hidden':
                result = result.filter(cmd => cmd.isHidden);
                break;
            case 'all':
            default:
                result = result.filter(cmd => !cmd.isHidden);
                break;
        }

        result.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.usageCount - a.usageCount;
        });

        return result;
    }, [commands, searchQuery, activeFilter]);

    const handleRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const togglePin = (id: string) => {
        setCommands(prev => prev.map(cmd =>
            cmd.id === id ? { ...cmd, isPinned: !cmd.isPinned } : cmd
        ));
    };

    const toggleCompleted = (id: string) => {
        setCommands(prev => prev.map(cmd =>
            cmd.id === id ? { ...cmd, isCompleted: !cmd.isCompleted } : cmd
        ));
    };

    const toggleHidden = (id: string) => {
        setCommands(prev => prev.map(cmd =>
            cmd.id === id ? { ...cmd, isHidden: !cmd.isHidden } : cmd
        ));
    };

    const getCategoryColor = (category: string) => {
        const catMap: Record<string, string> = {
            'Clothing': '#4361EE',
            'Footwear': '#F72585',
            'Accessories': '#7209B7',
            'Bags': '#FF9F1C',
        };
        return catMap[category] || colors.primary;
    };

    const counts = useMemo(() => ({
        pinned: commands.filter(c => c.isPinned && !c.isHidden).length,
        completed: commands.filter(c => c.isCompleted && !c.isHidden).length,
        hidden: commands.filter(c => c.isHidden).length,
        all: commands.filter(c => !c.isHidden).length,
    }), [commands]);

    const renderCommand = ({ item, index }: { item: ProductCommand; index: number }) => {
        const catColor = getCategoryColor(item.category);

        return (
            <Animatable.View
                animation="fadeInUp"
                duration={400}
                delay={index * 80}
                useNativeDriver
                style={styles.cardContainer}
            >
                <Card style={StyleSheet.flatten([styles.card, { backgroundColor: colors.card }])}>
                    <CardContent style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <View style={styles.imageWrapper}>
                                <Image source={{ uri: item.productImage }} style={styles.productImage} />
                                {item.isPinned && (
                                    <View style={[styles.miniPinned, { backgroundColor: '#FF9F1C' }]}>
                                        <Pin size={10} color="#FFF" fill="#FFF" />
                                    </View>
                                )}
                            </View>

                            <View style={styles.mainInfo}>
                                <Text variant="subtitle" numberOfLines={1} style={styles.productName}>{item.productName}</Text>
                                <Text variant="caption" style={{ color: colors.textMuted, fontSize: 12 }}>{item.orderId || `ID#${item.id}`}</Text>
                                <View style={styles.badgeRow}>
                                    <Badge 
                                        label={item.category} 
                                        variant="secondary" 
                                        style={StyleSheet.flatten([styles.catBadge, { backgroundColor: catColor + '15' }])} 
                                        textStyle={{ color: catColor, fontSize: 10, fontWeight: '600' }} 
                                    />
                                    {item.isCompleted && <Badge label="LIVRÉ" variant="success" style={styles.statusBadge} />}
                                </View>
                            </View>

                            <View style={styles.actions}>
                                <TouchableOpacity 
                                    onPress={() => togglePin(item.id)} 
                                    activeOpacity={0.7}
                                    style={styles.actionIcon}
                                >
                                    <Pin size={20} color={item.isPinned ? '#FF9F1C' : colors.textMuted} fill={item.isPinned ? '#FF9F1C' : 'transparent'} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Separator style={styles.cardSep} />

                        <View style={styles.detailsGrid}>
                            <View style={styles.detailCol}>
                                <View style={styles.detailItem}>
                                    <Palette size={14} color={colors.textMuted} />
                                    <View style={styles.detailTextContainer}>
                                        <Text variant="caption" style={styles.detailLabel}>COULEUR</Text>
                                        <Text variant="body" style={{ fontWeight: '700', fontSize: 13 }}>{item.color}</Text>
                                    </View>
                                </View>
                                <View style={[styles.detailItem, { marginTop: 8 }]}>
                                    <ShoppingBag size={14} color={colors.textMuted} />
                                    <View style={styles.detailTextContainer}>
                                        <Text variant="caption" style={styles.detailLabel}>QUANTITÉ</Text>
                                        <Text variant="body" style={{ fontWeight: '700', fontSize: 13 }}>{item.quantity} pcs</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.detailCol}>
                                <View style={styles.detailItem}>
                                    <Box size={14} color={colors.textMuted} />
                                    <View style={styles.detailTextContainer}>
                                        <Text variant="caption" style={styles.detailLabel}>TAILLE</Text>
                                        <Text variant="body" style={{ fontWeight: '700', fontSize: 13 }}>{item.size}</Text>
                                    </View>
                                </View>
                                <View style={[styles.detailItem, { marginTop: 8 }]}>
                                    <TrendingUp size={14} color={colors.textMuted} />
                                    <View style={styles.detailTextContainer}>
                                        <Text variant="caption" style={styles.detailLabel}>PRIX TOTAL</Text>
                                        <Text variant="body" style={{ fontWeight: '800', fontSize: 13, color: colors.primary }}>{(item.price * item.quantity).toFixed(2)} TND</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.cardFooter}>
                            <View style={styles.footerLeft}>
                                <Clock size={12} color={colors.textMuted} />
                                <Text variant="caption" style={{ color: colors.textMuted, marginLeft: 4, fontSize: 12 }}>
                                    Utilisé {item.usageCount} fois
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => toggleCompleted(item.id)}
                                style={StyleSheet.flatten([styles.completeToggle, { backgroundColor: item.isCompleted ? colors.primary + '10' : 'transparent' }])}
                            >
                                {item.isCompleted ? (
                                    <CheckCircle size={18} color={colors.primary} />
                                ) : (
                                    <Circle size={18} color={colors.textMuted} />
                                )}
                                <Text variant="body" style={{ color: item.isCompleted ? colors.primary : colors.textMuted, marginLeft: 6, fontWeight: '700', fontSize: 12 }}>
                                    {item.isCompleted ? 'Terminé' : 'En cours'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </CardContent>
                </Card>
            </Animatable.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#050505' : '#F8F9FA' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Premium Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <BlurView
                    blurTarget={blurTargetRef}
                    intensity={Platform.OS === 'ios' ? 80 : 100}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                    blurMethod="dimezisBlurView"
                />
                <View style={styles.headerContent}>
                    <TouchableOpacity 
                        onPress={onBack} 
                        activeOpacity={0.7}
                        style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderRadius: 12 }]}
                    >
                        <ArrowLeft size={22} color={colors.foreground} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Text variant="title" style={[styles.headerTitle, { fontWeight: '800', fontSize: 24, letterSpacing: -0.5, color: colors.foreground }]}>
                            {translate('commands') || 'Mes Commandes'}
                        </Text>
                        <Text variant="caption" style={{ color: colors.textMuted, fontSize: 13, opacity: 0.7 }}>
                            {filteredCommands.length} {translate('articles') || 'articles'}
                        </Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => setShowSearch(!showSearch)} 
                        activeOpacity={0.7}
                        style={[styles.iconBtn, { backgroundColor: showSearch ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'), borderRadius: 12 }]}
                    >
                        <Search size={20} color={showSearch ? '#FFF' : colors.foreground} />
                    </TouchableOpacity>
                </View>

                {showSearch && (
                    <Animatable.View animation="fadeInDown" duration={300} style={styles.searchWrapper}>
                        <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFF', borderColor: 'transparent', borderRadius: 14, height: 48 }]}>
                            <Search size={18} color={colors.textMuted} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.foreground, fontSize: 15 }]}
                                placeholder="Rechercher une commande..."
                                placeholderTextColor={colors.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                                    <X size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animatable.View>
                )}

                {/* Filter Tabs */}
                <View style={[styles.tabsBar, { backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <TouchableOpacity 
                        onPress={() => setActiveFilter('all')} 
                        activeOpacity={0.7}
                        style={[styles.tab, activeFilter === 'all' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeFilter === 'all' ? { color: colors.primary, fontWeight: '700' } : { color: colors.textMuted }]}>TOUT</Text>
                        {activeFilter === 'all' && <View style={[styles.indicator, { backgroundColor: colors.primary }]} />}
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setActiveFilter('pinned')} 
                        activeOpacity={0.7}
                        style={[styles.tab, activeFilter === 'pinned' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeFilter === 'pinned' ? { color: colors.primary, fontWeight: '700' } : { color: colors.textMuted }]}>IMPORTANTS</Text>
                        {activeFilter === 'pinned' && <View style={[styles.indicator, { backgroundColor: colors.primary }]} />}
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setActiveFilter('completed')} 
                        activeOpacity={0.7}
                        style={[styles.tab, activeFilter === 'completed' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeFilter === 'completed' ? { color: colors.primary, fontWeight: '700' } : { color: colors.textMuted }]}>TERMINÉS</Text>
                        {activeFilter === 'completed' && <View style={[styles.indicator, { backgroundColor: colors.primary }]} />}
                    </TouchableOpacity>
                </View>
            </View>

            <BlurTargetView ref={blurTargetRef} style={StyleSheet.absoluteFill}>
                <FlatList
                    data={filteredCommands}
                    renderItem={renderCommand}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.list, { paddingTop: insets.top + (showSearch ? 190 : 140) }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <LinearGradient colors={[colors.primary + '15', 'transparent']} style={styles.emptyGradient} />
                            <View style={{
                                width: 100, height: 100,
                                borderRadius: 50,
                                backgroundColor: colors.primary + '15',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 20
                            }}>
                                <Command size={50} color={colors.primary} strokeWidth={1.5} />
                            </View>
                            <Text variant="heading" style={{ marginTop: 16, fontWeight: '700', fontSize: 18, color: colors.foreground }}>
                                {translate('noCommands') || 'Aucune commande'}
                            </Text>
                            <Text variant="body" style={{ marginTop: 8, color: colors.textMuted, fontSize: 14, opacity: 0.7, textAlign: 'center' }}>
                                {translate('noCommandsDesc') || 'Vos commandes apparaîtront ici'}
                            </Text>
                            <Text variant="body" style={{ color: colors.textMuted, textAlign: 'center', marginTop: 10 }}>
                                {searchQuery ? "Nous n'avons trouvé aucun résultat pour votre recherche." : "Vous n'avez pas encore de commandes dans cette catégorie."}
                            </Text>
                            <Button onPress={() => { setSearchQuery(''); setActiveFilter('all'); }} style={{ marginTop: 30 }}>
                                <Text style={{ color: '#FFF', fontWeight: '800' }}>RAZ FILTRES</Text>
                            </Button>
                        </View>
                    }
                />
            </BlurTargetView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 100,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: { 
        flex: 1, 
        alignItems: 'center',
        paddingHorizontal: 10 
    },
    headerTitle: { 
        fontSize: 20, 
        letterSpacing: -0.5,
    },
    searchWrapper: { 
        paddingHorizontal: 20, 
        paddingBottom: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 16,
        borderWidth: 0,
        gap: 12,
    },
    searchInput: { 
        flex: 1, 
        fontSize: 15, 
        fontWeight: '500',
    },
    tabsBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 4,
    },
    tab: {
        paddingVertical: 14,
        paddingHorizontal: 18,
        alignItems: 'center',
        marginRight: 4,
    },
    activeTab: {},
    tabText: { 
        fontSize: 12, 
        fontWeight: '600', 
        letterSpacing: 0.5,
    },
    indicator: {
        position: 'absolute',
        bottom: 0,
        width: 24,
        height: 3,
        borderRadius: 2,
    },
    list: { 
        paddingHorizontal: 16, 
        paddingBottom: 100,
        paddingTop: 8,
    },
    cardContainer: { 
        marginBottom: 16,
    },
    card: {
        borderRadius: 20,
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
    cardContent: { 
        padding: 16,
    },
    cardHeader: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    imageWrapper: { 
        width: 72, 
        height: 72, 
        position: 'relative' 
    },
    productImage: { 
        width: 72, 
        height: 72, 
        borderRadius: 18 
    },
    miniPinned: {
        position: 'absolute', 
        top: -4, 
        right: -4,
        width: 22, 
        height: 22, 
        borderRadius: 11,
        alignItems: 'center', 
        justifyContent: 'center',
        borderWidth: 2, 
        borderColor: '#FFF',
    },
    mainInfo: { 
        flex: 1, 
        marginLeft: 16 
    },
    productName: { 
        marginBottom: 4, 
        fontWeight: '700',
        fontSize: 16,
    },
    badgeRow: { 
        flexDirection: 'row', 
        marginTop: 8, 
        gap: 8 
    },
    catBadge: { 
        height: 22, 
        paddingHorizontal: 10, 
        borderWidth: 0 
    },
    statusBadge: { 
        height: 22, 
        paddingHorizontal: 10 
    },
    actions: { 
        alignSelf: 'flex-start' 
    },
    actionIcon: { 
        padding: 8 
    },
    cardSep: { 
        marginVertical: 16, 
        opacity: 0.08 
    },
    detailsGrid: { 
        flexDirection: 'row', 
        gap: 24 
    },
    detailCol: { 
        flex: 1 
    },
    detailItem: { 
        flexDirection: 'row', 
        alignItems: 'center',
        marginBottom: 12,
    },
    detailTextContainer: { 
        marginLeft: 10, 
        flex: 1 
    },
    detailLabel: { 
        fontSize: 9, 
        opacity: 0.5, 
        marginBottom: 2, 
        fontWeight: '700' 
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.04)',
    },
    footerLeft: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    completeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    emptyState: { 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 80, 
        paddingHorizontal: 40 
    },
    emptyGradient: { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: 200 
    },
});


