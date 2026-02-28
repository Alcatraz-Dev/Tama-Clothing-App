import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    Animated,
    RefreshControl,
    Image,
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
} from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';

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
    {
        id: '7',
        productName: 'Summer Dress',
        productImage: 'https://picsum.photos/200/200?random=7',
        color: 'Floral',
        size: 'S',
        price: 75.00,
        quantity: 2,
        category: 'Clothing',
        isPinned: false,
        isCompleted: true,
        isHidden: false,
        usageCount: 7,
        createdAt: new Date('2024-01-25'),
        orderId: 'ORD-007',
    },
    {
        id: '8',
        productName: 'Running Shoes',
        productImage: 'https://picsum.photos/200/200?random=8',
        color: 'Black/Red',
        size: '44',
        price: 95.00,
        quantity: 1,
        category: 'Footwear',
        isPinned: false,
        isCompleted: false,
        isHidden: true,
        usageCount: 2,
        createdAt: new Date('2024-02-15'),
        orderId: 'ORD-008',
    },
    {
        id: '9',
        productName: 'Cashmere Cardigan',
        productImage: 'https://picsum.photos/200/200?random=9',
        color: 'Beige',
        size: 'M',
        price: 180.00,
        quantity: 1,
        category: 'Clothing',
        isPinned: false,
        isCompleted: false,
        isHidden: false,
        usageCount: 18,
        createdAt: new Date('2024-01-05'),
        orderId: 'ORD-009',
    },
    {
        id: '10',
        productName: 'Baseball Cap',
        productImage: 'https://picsum.photos/200/200?random=10',
        color: 'Black',
        size: 'Adjustable',
        price: 25.00,
        quantity: 4,
        category: 'Accessories',
        isPinned: false,
        isCompleted: false,
        isHidden: false,
        usageCount: 6,
        createdAt: new Date('2024-01-12'),
        orderId: 'ORD-010',
    },
];

type FilterType = 'all' | 'pinned' | 'completed' | 'hidden';

export default function CommandScreen({ onBack, t }: CommandScreenProps) {
    const { colors } = useAppTheme();
    const [commands, setCommands] = useState<ProductCommand[]>(SAMPLE_COMMANDS);
    const [filteredCommands, setFilteredCommands] = useState<ProductCommand[]>(SAMPLE_COMMANDS);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [showSearch, setShowSearch] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const translate = t || ((k: string) => k);
    // Use colors directly from context (now has all needed colors including coral)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const c = colors;
    // For compatibility, replace all themeColors references
    const themeColors = colors;

    // Filter commands based on search query and active filter
    useEffect(() => {
        let result = [...commands];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                cmd => 
                    cmd.productName.toLowerCase().includes(query) ||
                    cmd.color.toLowerCase().includes(query) ||
                    cmd.size.toLowerCase().includes(query) ||
                    cmd.category.toLowerCase().includes(query)
            );
        }

        // Apply category filter
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

        // Sort: pinned items first, then by usage count
        result.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.usageCount - a.usageCount;
        });

        setFilteredCommands(result);
    }, [commands, searchQuery, activeFilter]);

    const handleRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
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
        const categoryColors: Record<string, string> = {
            'Clothing': themeColors.blue,
            'Footwear': themeColors.green,
            'Accessories': themeColors.purple,
            'Bags': themeColors.orange,
        };
        return categoryColors[category] || themeColors.textMuted;
    };

    const getSizeColor = (size: string) => {
        const sizeColors: Record<string, string> = {
            'S': '#10B981',
            'M': '#3B82F6',
            'L': '#8B5CF6',
            'XL': '#F59E0B',
            'XXL': '#EF4444',
        };
        return sizeColors[size] || themeColors.textMuted;
    };

    const renderCommand = ({ item: command, index }: { item: ProductCommand; index: number }) => {
        const categoryColor = getCategoryColor(command.category);
        const sizeColor = getSizeColor(command.size);
        
        return (
            <Animated.View 
                style={[
                    styles.cardWrapper,
                    { 
                        backgroundColor: themeColors.card,
                        borderColor: themeColors.border,
                        opacity: command.isHidden ? 0.6 : 1,
                    }
                ]}
            >
                {/* Card Header with Product Image */}
                <View style={styles.cardHeader}>
                    <View style={styles.productImageContainer}>
                        <Image 
                            source={{ uri: command.productImage }}
                            style={styles.productImage}
                            resizeMode="cover"
                        />
                        {command.isPinned && (
                            <View style={[styles.pinnedBadge, { backgroundColor: themeColors.orange }]}>
                                <Pin size={10} color="#FFFFFF" />
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.productInfo}>
                        <Text style={[styles.productName, { color: themeColors.foreground }]} numberOfLines={2}>
                            {command.productName}
                        </Text>
                        {command.orderId && (
                            <Text style={[styles.orderId, { color: themeColors.textMuted }]}>
                                {command.orderId}
                            </Text>
                        )}
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity 
                            style={styles.actionBtn}
                            onPress={() => togglePin(command.id)}
                        >
                            {command.isPinned ? (
                                <Pin size={18} color={themeColors.orange} fill={themeColors.orange} />
                            ) : (
                                <PinOff size={18} color={themeColors.textMuted} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.actionBtn}
                            onPress={() => toggleHidden(command.id)}
                        >
                            {command.isHidden ? (
                                <EyeOff size={18} color={themeColors.textMuted} />
                            ) : (
                                <Eye size={18} color={themeColors.textMuted} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Product Details */}
                <View style={styles.productDetails}>
                    {/* Color */}
                    <View style={styles.detailItem}>
                        <View style={[styles.detailIcon, { backgroundColor: categoryColor + '20' }]}>
                            <Palette size={14} color={categoryColor} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>
                                Color
                            </Text>
                            <Text style={[styles.detailValue, { color: themeColors.foreground }]}>
                                {command.color}
                            </Text>
                        </View>
                    </View>

                    {/* Size */}
                    <View style={styles.detailItem}>
                        <View style={[styles.detailIcon, { backgroundColor: sizeColor + '20' }]}>
                            <Box size={14} color={sizeColor} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>
                                Size
                            </Text>
                            <View style={[styles.sizeBadge, { backgroundColor: sizeColor + '20' }]}>
                                <Text style={[styles.sizeValue, { color: sizeColor }]}>
                                    {command.size}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Quantity */}
                    <View style={styles.detailItem}>
                        <View style={[styles.detailIcon, { backgroundColor: themeColors.green + '20' }]}>
                            <ShoppingBag size={14} color={themeColors.green} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>
                                Qty
                            </Text>
                            <Text style={[styles.detailValue, { color: themeColors.foreground }]}>
                                {command.quantity}
                            </Text>
                        </View>
                    </View>

                    {/* Price */}
                    <View style={styles.detailItem}>
                        <View style={[styles.detailIcon, { backgroundColor: themeColors.blue + '20' }]}>
                            <Text style={[styles.priceIcon, { color: themeColors.blue }]}>$</Text>
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>
                                Price
                            </Text>
                            <Text style={[styles.priceValue, { color: themeColors.blue }]}>
                                ${command.price.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Category Tag */}
                <View style={styles.categoryRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '15' }]}>
                        <Text style={[styles.categoryText, { color: categoryColor }]}>
                            {command.category}
                        </Text>
                    </View>
                    <Text style={[styles.totalPrice, { color: themeColors.foreground }]}>
                        Total: ${(command.price * command.quantity).toFixed(2)}
                    </Text>
                </View>

                {/* Card Footer */}
                <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
                    <TouchableOpacity 
                        style={styles.completedBtn}
                        onPress={() => toggleCompleted(command.id)}
                    >
                        {command.isCompleted ? (
                            <CheckCircle size={20} color={themeColors.green} fill={themeColors.green} />
                        ) : (
                            <Circle size={20} color={themeColors.textMuted} />
                        )}
                        <Text style={[
                            styles.completedText, 
                            { color: command.isCompleted ? themeColors.green : themeColors.textMuted }
                        ]}>
                            {command.isCompleted ? 'Completed' : 'Mark Complete'}
                        </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.usageContainer}>
                        <Clock size={14} color={themeColors.textMuted} />
                        <Text style={[styles.usageText, { color: themeColors.textMuted }]}>
                            Used {command.usageCount}x
                        </Text>
                    </View>
                </View>

                {/* Hidden Badge */}
                {command.isHidden && (
                    <View style={[styles.hiddenBadge, { backgroundColor: themeColors.red + '15' }]}>
                        <EyeOff size={12} color={themeColors.red} />
                        <Text style={[styles.hiddenText, { color: themeColors.red }]}>
                            Hidden
                        </Text>
                    </View>
                )}
            </Animated.View>
        );
    };

    const getCounts = () => {
        const pinned = commands.filter(c => c.isPinned && !c.isHidden).length;
        const completed = commands.filter(c => c.isCompleted && !c.isHidden).length;
        const hidden = commands.filter(c => c.isHidden).length;
        const visible = commands.filter(c => !c.isHidden).length;
        return { pinned, completed, hidden, visible, total: commands.length };
    };

    const counts = getCounts();

    const FilterButton = ({ 
        filter, 
        label, 
        count, 
        active 
    }: { 
        filter: FilterType; 
        label: string; 
        count: number;
        active: boolean;
    }) => (
        <TouchableOpacity
            style={[
                styles.filterBtn,
                active && { 
                    backgroundColor: themeColors.primary,
                    borderColor: themeColors.primary,
                },
                { borderColor: themeColors.border }
            ]}
            onPress={() => setActiveFilter(filter)}
        >
            <Text style={[
                styles.filterText,
                { color: active ? themeColors.primaryForeground : themeColors.textMuted }
            ]}>
                {label}
            </Text>
            <View style={[
                styles.filterCount,
                { backgroundColor: active ? themeColors.primaryForeground + '20' : themeColors.muted }
            ]}>
                <Text style={[
                    styles.filterCountText,
                    { color: active ? themeColors.primary : themeColors.textMuted }
                ]}>
                    {count}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <ArrowLeft color={themeColors.foreground} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: themeColors.foreground }]}>
                        {translate('commands') || 'Commands'}
                    </Text>
                    <TouchableOpacity 
                        onPress={() => setShowSearch(!showSearch)}
                        style={styles.searchToggleBtn}
                    >
                        {showSearch ? (
                            <X color={themeColors.foreground} size={24} />
                        ) : (
                            <Search color={themeColors.foreground} size={24} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                {showSearch && (
                    <View style={[styles.searchContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <Search size={20} color={themeColors.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: themeColors.foreground }]}
                            placeholder={translate('searchCommands') || 'Search products, colors, sizes...'}
                            placeholderTextColor={themeColors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={20} color={themeColors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>

            {/* Filter Bar */}
            <View style={styles.filterBar}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[
                        { filter: 'all' as FilterType, label: 'All', count: counts.visible },
                        { filter: 'pinned' as FilterType, label: 'Pinned', count: counts.pinned },
                        { filter: 'completed' as FilterType, label: 'Completed', count: counts.completed },
                        { filter: 'hidden' as FilterType, label: 'Hidden', count: counts.hidden },
                    ]}
                    keyExtractor={item => item.filter}
                    renderItem={({ item }) => (
                        <FilterButton
                            filter={item.filter}
                            label={item.label}
                            count={item.count}
                            active={activeFilter === item.filter}
                        />
                    )}
                    contentContainerStyle={styles.filterList}
                />
            </View>

            {/* Commands List */}
            <FlatList
                data={filteredCommands}
                renderItem={renderCommand}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={themeColors.primary}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={[styles.listHeaderText, { color: themeColors.textMuted }]}>
                            {filteredCommands.length} {translate('commands') || 'products'}
                            {searchQuery && ` found`}
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Command size={64} color={themeColors.border} />
                        <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                            {searchQuery 
                                ? 'No products found' 
                                : activeFilter === 'hidden'
                                    ? 'No hidden commands'
                                    : 'No commands yet'}
                        </Text>
                        <Text style={[styles.emptySubText, { color: themeColors.textMuted }]}>
                            {searchQuery 
                                ? 'Try a different search term' 
                                : 'Your product commands will appear here'}
                        </Text>
                    </View>
                }
            />

            {/* Hidden Commands Banner */}
            {counts.hidden > 0 && activeFilter !== 'hidden' && (
                <TouchableOpacity 
                    style={[styles.hiddenBanner, { backgroundColor: themeColors.red + '15', borderColor: themeColors.red + '30' }]}
                    onPress={() => setActiveFilter('hidden')}
                >
                    <EyeOff size={18} color={themeColors.red} />
                    <Text style={[styles.hiddenBannerText, { color: themeColors.red }]}>
                        {counts.hidden} hidden command{counts.hidden > 1 ? 's' : ''}
                    </Text>
                    <Text style={[styles.hiddenBannerAction, { color: themeColors.red }]}>
                        Show
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 15,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 1,
    },
    searchToggleBtn: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginTop: 16,
        borderWidth: 1,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    filterBar: {
        paddingBottom: 10,
    },
    filterList: {
        paddingHorizontal: 20,
        gap: 10,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        gap: 8,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '700',
    },
    filterCount: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    filterCountText: {
        fontSize: 12,
        fontWeight: '800',
    },
    list: {
        padding: 20,
        paddingBottom: 40,
    },
    listHeader: {
        marginBottom: 16,
    },
    listHeaderText: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Card Styles
    cardWrapper: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    productImageContainer: {
        position: 'relative',
    },
    productImage: {
        width: 64,
        height: 64,
        borderRadius: 14,
    },
    pinnedBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    productInfo: {
        flex: 1,
        marginLeft: 14,
    },
    productName: {
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 20,
    },
    orderId: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        padding: 8,
    },
    // Product Details Grid
    productDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 14,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: '45%',
        gap: 8,
    },
    detailIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '800',
    },
    sizeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 2,
    },
    sizeValue: {
        fontSize: 12,
        fontWeight: '800',
    },
    priceIcon: {
        fontSize: 14,
        fontWeight: '900',
    },
    priceValue: {
        fontSize: 14,
        fontWeight: '900',
    },
    // Category Row
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    totalPrice: {
        fontSize: 16,
        fontWeight: '900',
    },
    // Card Footer
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    completedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    completedText: {
        fontSize: 13,
        fontWeight: '700',
    },
    usageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    usageText: {
        fontSize: 12,
        fontWeight: '600',
    },
    // Badges
    hiddenBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    hiddenText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    // Empty State
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        gap: 12,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 17,
        fontWeight: '800',
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        opacity: 0.7,
    },
    // Hidden Banner
    hiddenBanner: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    hiddenBannerText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 12,
    },
    hiddenBannerAction: {
        fontSize: 14,
        fontWeight: '900',
    },
});
