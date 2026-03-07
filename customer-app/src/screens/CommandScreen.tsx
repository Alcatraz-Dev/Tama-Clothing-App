import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
    ScrollView,
} from 'react-native';
import {
    ArrowLeft,
    Search,
    Pin,
    CheckCircle,
    Circle,
    Clock,
    X,
    Palette,
    Box,
    ShoppingBag,
    ChevronRight,
    TrendingUp,
    Package,
    Truck,
    MapPin,
    Calendar,
    ArrowUpRight,
    MoreHorizontal,
    Star,
    AlertCircle,
    ShoppingBasket,
    Filter,
    Copy,
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { getName, colorNameToHex, translateColor } from '../utils/translationHelpers';
import * as Animatable from 'react-native-animatable';

import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../api/firebase';
import { updateProductRating } from '../utils/productUtils';
import { Clipboard, Alert, Modal, ActivityIndicator } from 'react-native';


// BNA UI Components
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CommandStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface CommandScreenProps {
    onBack: () => void;
    onTrack: (trackingId: string) => void;
    t: (key: string) => string;
    language?: string;
    onNavigate: (screen: string) => void;
}

type FilterType = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export default function CommandScreen({ onBack, onTrack, t, language , onNavigate}: CommandScreenProps) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';

    const [commands, setCommands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [refreshing, setRefreshing] = useState(false);
    const scrollY = useRef(new RNAnimated.Value(0)).current;

    const [reviewingItem, setReviewingItem] = useState<any>(null);
    const [rating, setRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');

    const translate = t || ((k: string) => k);

    const fetchOrders = async () => {
        try {
            const q = query(
                collection(db, 'orders'),
                where('customer.uid', '==', auth.currentUser?.uid)
            );
            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            // Map the Firebase orders to the CommandScreen expected format
            const mappedOrders = list.map(order => {
                const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                return {
                    id: order.id,
                    orderId: order.trackingId || order.id.slice(-6).toUpperCase(),
                    originalOrder: order,
                    productName: firstItem ? getName(firstItem.name, language || 'fr') : 'Commande',
                    productImage: firstItem ? firstItem.mainImage : '',
                    color: firstItem ? firstItem.selectedColor : '',
                    size: firstItem ? firstItem.selectedSize : '',
                    price: order.total,
                    quantity: order.items ? order.items.length : 1, // Number of items
                    category: 'General',
                    isPinned: false,
                    status: order.status || 'pending',
                    isHidden: false,
                    usageCount: 0,
                    createdAt: order.createdAt?.toDate ? order.createdAt.toDate() : new Date(),
                    shopName: 'TAMA CLOTHING',
                    items: order.items || []
                };
            });

            setCommands(mappedOrders);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const submitReview = async () => {
        if (!reviewingItem) return;
        try {
            const productId = reviewingItem.item.id || reviewingItem.item.productId;
            const reviewData = {
                productId: productId,
                orderId: reviewingItem.orderId,
                userId: auth.currentUser?.uid,
                userName: auth.currentUser?.displayName || translate('customer'),
                rating,
                comment: reviewComment,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'reviews'), reviewData);

            const orderRef = doc(db, 'orders', reviewingItem.orderId);
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
                const orderData = orderSnap.data();
                const updatedItems = orderData.items.map((item: any) => {
                    if ((item.id || item.productId) === productId) {
                        return { ...item, reviewed: true };
                    }
                    return item;
                });
                await updateDoc(orderRef, { items: updatedItems });
            }

            await updateProductRating(productId);

            Alert.alert(translate('featured'), translate('reviewSubmitted'));
            setReviewingItem(null);
            setReviewComment('');
            setRating(5);
            fetchOrders();
        } catch (e) {
            console.error('Review submission error:', e);
            Alert.alert(translate('cancel'), translate('reviewFailed'));
        }
    };


    const _t = (k: string, fb: string) => {
        const val = translate(k);
        if (!val || val === k) return fb;
        return val;
    }

    const statusConfig: Record<CommandStatus, {
        label: string;
        color: string;
        gradient: readonly [string, string, ...string[]];
        icon: any;
    }> = {
        pending: {
            label: _t('statusPending', _t('pending', 'En attente')),
            color: '#FBBF24',
            gradient: ['#FBBF24', '#F59E0B'],
            icon: Clock,
        },
        processing: {
            label: _t('statusProcessing', _t('processing', 'En cours')),
            color: '#3B82F6',
            gradient: ['#3B82F6', '#2563EB'],
            icon: Package,
        },
        shipped: {
            label: _t('statusShipped', _t('shipped', 'Expédié')),
            color: '#A855F7',
            gradient: ['#A855F7', '#8B5CF6'],
            icon: Truck,
        },
        delivered: {
            label: _t('statusDelivered', _t('delivered', 'Livré')),
            color: '#10B981',
            gradient: ['#10B981', '#059669'],
            icon: CheckCircle,
        },
        cancelled: {
            label: _t('statusCancelled', _t('cancelled', 'Annulé')),
            color: '#EF4444',
            gradient: ['#EF4444', '#DC2626'],
            icon: X,
        },
    };

    const filteredCommands = useMemo(() => {
        let result = commands.filter(cmd => !cmd.isHidden);

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                cmd =>
                    cmd.productName.toLowerCase().includes(query) ||
                    cmd.orderId?.toLowerCase().includes(query) ||
                    cmd.shopName?.toLowerCase().includes(query)
            );
        }

        if (activeFilter !== 'all') {
            result = result.filter(cmd => cmd.status === activeFilter);
        }

        return result.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.createdAt.getTime() - a.createdAt.getTime();
        });
    }, [commands, searchQuery, activeFilter]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -60],
        extrapolate: 'clamp',
    });

    const headerBlurOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const renderHeader = () => (
        <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
            <RNAnimated.View style={[StyleSheet.absoluteFill, { opacity: headerBlurOpacity, zIndex: -1 }]}>
                <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            </RNAnimated.View>

            <View style={styles.headerTop}>
                <TouchableOpacity onPress={onBack} style={[styles.blurBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <ArrowLeft size={22} color={isDark ? '#FFF' : '#000'} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{translate('MES COMMANDES') || 'Commandes'}</Text>
                <TouchableOpacity onPress={()=> onNavigate('MyShipments')} style={[styles.blurBtn, { backgroundColor: isDark ? 'rgba(251,191,36,0.1)' : 'rgba(251,191,36,0.05)' }]}>
                    <Package size={22} color="#FBBF24" />
                </TouchableOpacity>
            </View>

            <View style={[styles.headerBottom]}>
                <View style={[styles.searchBox, { backgroundColor: isDark ? '#151515' : '#F1F1F1' }]}>
                    <Search size={18} color={isDark ? '#555' : '#999'} />
                    <TextInput
                        placeholder={translate('searchCommands') || 'Rechercher produits, couleurs, tailles...'}
                        placeholderTextColor={isDark ? '#444' : '#AAA'}
                        style={[styles.searchInput, { color: isDark ? '#FFF' : '#000' }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity style={styles.filterBtn}>
                        <Filter size={18} color={isDark ? '#FFF' : '#000'} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContainer}
                >
                    {(['all', 'pending', 'processing', 'shipped', 'delivered'] as FilterType[]).map((filter) => {
                        const isActive = activeFilter === filter;
                        return (
                            <TouchableOpacity
                                key={filter}
                                onPress={() => setActiveFilter(filter)}
                                style={[
                                    styles.tabItem,
                                    isActive && { backgroundColor: isDark ? '#FFF' : '#000' }
                                ]}
                            >
                                <Text style={[
                                    styles.tabText,
                                    isActive && { color: isDark ? '#000' : '#FFF', fontWeight: '800' }
                                ]}>
                                    {filter === 'all' ? (translate('all') || 'Toutes') : statusConfig[filter].label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    );

    const renderCard = ({ item, index }: { item: any; index: number }) => {
        const status: CommandStatus = item.status as CommandStatus || 'pending';
        const config = statusConfig[status] || statusConfig['pending'];
        const StatusIcon = config.icon;

        return (
            <Animatable.View
                animation="fadeInUp"
                duration={600}
                delay={index * 80}
                useNativeDriver
                style={styles.cardContainer}
            >
                <TouchableOpacity activeOpacity={0.95} style={[styles.card, { backgroundColor: isDark ? '#111' : '#FFF' }]}>
                    <View style={styles.cardTop}>
                        <View style={styles.shopBadge}>
                            <View style={styles.shopAvatar}>
                                <Text style={styles.shopAvatarText}>{item.shopName?.charAt(0)}</Text>
                            </View>
                            <Text style={[styles.shopName, { color: isDark ? '#EEE' : '#333' }]}>{item.shopName}</Text>
                        </View>
                        <LinearGradient
                            colors={config.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.statusChip}
                        >
                            <StatusIcon size={12} color="#FFF" />
                            <Text style={styles.statusChipText}>{config.label}</Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.cardBody}>
                        <View style={styles.imageOverlayContainer}>
                            <Image source={{ uri: item.productImage }} style={styles.mainImage} />
                            {item.isPinned && (
                                <View style={styles.pinBadge}>
                                    <Pin size={12} color="#FFF" />
                                </View>
                            )}
                        </View>

                        <View style={styles.infoSection}>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={[styles.orderId, { color: isDark ? '#444' : '#CCC' }]}>#{item.orderId}</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            Clipboard.setString(item.orderId);
                                            Alert.alert(translate('copied') || 'Copié', translate('commandCopied') || 'Numéro de commande a été copié.');
                                        }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Copy size={12} color={isDark ? '#444' : '#A1A1AA'} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={[styles.pName, { color: isDark ? '#FFF' : '#000' }]} numberOfLines={1}>{item.productName}</Text>
                            </View>

                            <View style={styles.detailsRow}>
                                <View style={styles.detailItem}>
                                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colorNameToHex(item.color), borderWidth: 1, borderColor: isDark ? '#333' : '#E5E5EA' }} />
                                    <Text style={styles.detailText}>{translateColor(item.color, language || 'fr')}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Box size={12} color="#8E8E93" />
                                    <Text style={styles.detailText}>{_t('size', 'Taille')} {item.size}</Text>
                                </View>
                            </View>

                            <View style={[styles.priceTag, { backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9' }]}>
                                <Text style={[styles.priceValue, { color: isDark ? '#FFF' : '#000' }]}>{item.price} TND</Text>
                                <Text style={styles.qtyText}>{item.quantity > 1 ? `+${item.quantity - 1} ${_t('items', 'articles')}` : `1 ${_t('item', 'article')}`}</Text>
                            </View>
                        </View>
                    </View>

                    {item.status === 'shipped' && (
                        <View style={styles.trackingBar}>
                            <View style={styles.trackingInfo}>
                                <Truck size={16} color="#3B82F6" />
                                <Text style={styles.trackingMsg}>{translate('shippedOn') || 'Expédié le'} {item.createdAt.toLocaleDateString()}</Text>
                            </View>
                            <ChevronRight size={16} color="#3B82F6" />
                        </View>
                    )}

                    <View style={styles.cardFooter}>
                        <Text style={styles.timeText}>{_t('orderedOn', 'Passée le')} {item.createdAt.toLocaleDateString()}</Text>
                        <View style={styles.buttonGroup}>
                            <TouchableOpacity
                                style={[styles.btnSmall, { backgroundColor: isDark ? '#FFF' : '#000' }]}
                                onPress={() => onTrack(item.id)}
                            >
                                <Text style={[styles.btnSmallText, { color: isDark ? '#000' : '#FFF' }]}>
                                    {_t('trackOrder', 'Suivre')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {item.status === 'delivered' && item.items && item.items.length > 0 && (
                        <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: isDark ? '#222' : '#EEE' }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: isDark ? '#888' : '#888', marginBottom: 10 }}>{translate('leaveReview')}</Text>
                            {item.items.map((prodItem: any, idx: number) => {
                                const isReviewed = prodItem.reviewed === true;
                                return (
                                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <Image source={{ uri: prodItem.mainImage }} style={{ width: 30, height: 30, borderRadius: 5, backgroundColor: isDark ? '#000' : '#eee' }} />
                                            <Text style={{ fontSize: 12, fontWeight: '700', maxWidth: 150, color: isDark ? '#FFF' : '#000' }} numberOfLines={1}>{getName(prodItem.name, language || 'fr')}</Text>
                                        </View>
                                        {isReviewed ? (
                                            <View style={{ paddingHorizontal: 15, paddingVertical: 6, backgroundColor: '#10B981', borderRadius: 15 }}>
                                                <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>{translate('reviewed')}</Text>
                                            </View>
                                        ) : (
                                            <TouchableOpacity onPress={() => setReviewingItem({ orderId: item.id, item: prodItem })} style={{ paddingHorizontal: 15, paddingVertical: 6, backgroundColor: isDark ? '#FFF' : '#000', borderRadius: 15 }}>
                                                <Text style={{ color: isDark ? '#000' : '#FFF', fontSize: 10, fontWeight: '800' }}>{translate('rate')}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </TouchableOpacity>
            </Animatable.View>
        );
    };

    return (
        <View style={[styles.main, { backgroundColor: isDark ? '#080808' : '#F5F5F7' }]}>
            {reviewingItem && (
                <Modal visible={true} transparent animationType="fade">
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25, zIndex: 9999 }}>
                        <View style={{ backgroundColor: isDark ? '#111' : '#FFF', borderRadius: 25, padding: 25 }}>
                            <Text style={{ fontSize: 18, fontWeight: '900', marginBottom: 5, color: isDark ? '#FFF' : '#000' }}>{translate('rateProduct')}</Text>
                            <Text style={{ fontSize: 13, color: isDark ? '#888' : '#666', marginBottom: 20 }}>{getName(reviewingItem.item.name, language || 'fr')}</Text>

                            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 25 }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                                        <Star size={32} color={s <= rating ? "#FFD700" : "#EEE"} fill={s <= rating ? "#FFD700" : (isDark ? "#222" : "#EEE")} />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                style={{
                                    height: 100,
                                    textAlignVertical: 'top',
                                    backgroundColor: isDark ? '#222' : '#F5F5F7',
                                    borderRadius: 15,
                                    padding: 15,
                                    color: isDark ? '#FFF' : '#000',
                                    fontWeight: '600'
                                }}
                                placeholder={translate('writeReview')}
                                placeholderTextColor={isDark ? '#666' : '#999'}
                                multiline
                                value={reviewComment}
                                onChangeText={setReviewComment}
                            />

                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                                <TouchableOpacity onPress={() => setReviewingItem(null)} style={{ flex: 1, padding: 15, backgroundColor: isDark ? '#333' : '#F2F2F7', borderRadius: 15, alignItems: 'center' }}>
                                    <Text style={{ fontWeight: '800', color: isDark ? '#FFF' : '#000' }}>{translate('cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={submitReview} style={{ flex: 1, padding: 15, backgroundColor: isDark ? '#FFF' : '#000', borderRadius: 15, alignItems: 'center' }}>
                                    <Text style={{ fontWeight: '800', color: isDark ? '#000' : '#FFF' }}>{translate('submit')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Background decorative elements */}
            <View style={[styles.glow, { top: 100, right: -100, backgroundColor: 'rgba(59, 130, 246, 0.08)' }]} />
            <View style={[styles.glow, { bottom: 100, left: -100, backgroundColor: 'rgba(168, 85, 247, 0.08)' }]} />

            {renderHeader()}

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <RNAnimated.FlatList
                    data={filteredCommands}
                    renderItem={renderCard}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[
                        styles.content,
                        { paddingTop: 190 + insets.top, paddingBottom: insets.bottom + 40 }
                    ]}
                    showsVerticalScrollIndicator={false}
                    onScroll={RNAnimated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3B82F6" />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <View style={styles.emptyCircle}>
                                <Package size={40} color={isDark ? '#222' : '#E0E0E0'} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: isDark ? '#FFF' : '#000' }]}>{translate('noOrders') || 'Aucune commande'}</Text>
                            <Text style={styles.emptySubTitle}>{translate('noOrdersDesc') || 'Vos commandes apparaîtront ici dès que vous en passerez une.'}</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    main: { flex: 1 },
    glow: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        filter: 'blur(80px)',
        zIndex: -1,
    },
    headerWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingHorizontal: 20,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
    },
    blurBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    headerBottom: {
        marginTop: 15,
        gap: 15,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 52,
        borderRadius: 18,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    filterBtn: {
        marginLeft: 10,
    },
    tabsContainer: {
        paddingBottom: 20,
        gap: 8,
    },
    tabItem: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: 'rgba(128,128,128,0.1)',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#888',
    },
    content: {
        paddingHorizontal: 20,
    },
    cardContainer: {
        marginBottom: 16,
    },
    card: {
        borderRadius: 28,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(128,128,128,0.05)',
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    shopBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    shopAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shopAvatarText: { fontSize: 12, fontWeight: 'bold', color: '#000' },
    shopName: { fontSize: 13, fontWeight: '800' },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 4,
    },
    statusChipText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    cardBody: {
        flexDirection: 'row',
        gap: 16,
    },
    imageOverlayContainer: {
        width: 100,
        height: 100,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    pinBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#3B82F6',
        padding: 4,
        borderRadius: 8,
    },
    infoSection: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    orderId: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 2,
    },
    pName: {
        fontSize: 17,
        fontWeight: '800',
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '600',
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 8,
    },
    priceValue: {
        fontSize: 15,
        fontWeight: '900',
    },
    qtyText: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '700',
    },
    trackingBar: {
        marginTop: 16,
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        padding: 12,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    trackingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    trackingMsg: {
        color: '#3B82F6',
        fontSize: 12,
        fontWeight: '700',
    },
    cardFooter: {
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(128,128,128,0.05)',
    },
    timeText: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '600',
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    btnSmall: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    btnSmallText: {
        fontSize: 12,
        fontWeight: '800',
    },
    empty: {
        paddingTop: 80,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(128,128,128,0.05)',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 8,
    },
    emptySubTitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
    },
});
