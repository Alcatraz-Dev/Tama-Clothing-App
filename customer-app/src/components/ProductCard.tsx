import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Heart, ShoppingBag, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProductCardProps {
    product: any;
    onPress: () => void;
    isWishlisted?: boolean;
    onToggleWishlist?: () => void;
    onAddToCart?: () => void;
    showRating?: boolean;
    theme?: 'light' | 'dark';
    language?: string;
    t?: (key: string) => string;
    colors?: any;
    isFeaturedHero?: boolean;
}

export default function ProductCard({
    product,
    onPress,
    isWishlisted = false,
    onToggleWishlist,
    onAddToCart,
    showRating = true,
    theme = 'light',
    language = 'fr',
    t,
    colors: extraColors,
    isFeaturedHero = false,
}: ProductCardProps) {
    const isDark = theme === 'dark';

    const getName = (field: any) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        const langCode = language === 'ar' ? 'ar-tn' : (language || 'fr');
        return field[langCode] || field[language || 'fr'] || field['fr'] || field['en'] || Object.values(field)[0] || '';
    };

    const translate = (key: string) => {
        const defaults: Record<string, Record<string, string>> = {
            soldOut: { ar: 'نفذ', fr: 'RUPTURE DE STOCK', en: 'Sold Out' },
            premiumQuality: { ar: 'جودة عالية', fr: 'Qualité Premium', en: 'Premium Quality' },
            seeMore: { ar: 'اكتشف', fr: 'DÉCOUVRIR', en: 'Discover' },
            reviews: { ar: 'تقييم', fr: 'Avis', en: 'Reviews' },
        };
        const lang = language || 'fr';

        // If we have a hardcoded default, use it over t() if t() just returns the key
        if (defaults[key]) {
            return defaults[key][lang] || defaults[key]['en'];
        }

        if (t) return t(key);
        return key;
    };

    const colors = extraColors || {
        background: isDark ? '#1C1C1E' : '#FFF',
        foreground: isDark ? '#FFF' : '#000',
        border: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5E5',
        textMuted: isDark ? '#A1A1AA' : '#666',
        error: '#FF3B30',
    };

    if (isFeaturedHero) {
        return (
            <TouchableOpacity
                style={[
                    styles.heroProductCard,
                    { backgroundColor: colors.background }
                ]}
                onPress={onPress}
                activeOpacity={0.9}
            >
                <View style={styles.heroImageContainer}>
                    <Image
                        source={{ uri: product.mainImage || product.image || product.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400' }}
                        style={[styles.heroProductImg, { opacity: product.status === 'sold_out' ? 0.6 : 1 }]}
                    />



                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.85)']}
                        style={StyleSheet.absoluteFillObject}
                    />

                    {/* Heart */}
                    {onToggleWishlist && (
                        <TouchableOpacity
                            style={[styles.heroWishlistBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                            onPress={(e) => { e.stopPropagation(); onToggleWishlist(); }}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Heart size={20} color={'#FFFFFF'} fill={isWishlisted ? '#FF3B30' : 'none'} strokeWidth={isWishlisted ? 0 : 1.5} />
                        </TouchableOpacity>
                    )}

                    {/* Bottom Info */}
                    <View style={styles.heroBottomInfo}>
                        {product.status === 'sold_out' && (
                            <View style={{ backgroundColor: 'rgba(20, 20, 24, 0.95)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 8 }}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30', marginRight: 6 }} />
                                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>{translate('soldOut').toUpperCase()}</Text>
                            </View>
                        )}
                        <Text style={styles.heroBrandName} numberOfLines={1}>{product.brandName || 'TAMA'}</Text>
                        <Text style={styles.heroProductName} numberOfLines={2}>{getName(product.name)}</Text>

                        {/* Price Row for Hero Card */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>
                                {product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)} TND
                            </Text>
                            {product.discountPrice && (
                                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', textDecorationLine: 'line-through' }}>
                                    {product.price.toFixed(2)} TND
                                </Text>
                            )}
                        </View>

                        <View style={styles.heroRatingRow}>
                            <Star size={12} color="#FFFFFF" fill="#FFFFFF" />
                            <Text style={styles.heroRatingText}>{product.rating || '5.0'}   <Text style={styles.heroReviewText}>{product.reviewsCount !== undefined ? product.reviewsCount : (product.reviews?.length || 0)} {translate('reviews').toUpperCase()}</Text></Text>
                        </View>

                        <View style={styles.heroBottomActions}>
                            <TouchableOpacity
                                style={[styles.heroDetailsBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                                onPress={onPress}
                            >
                                <Text style={styles.heroDetailsText}>{translate('seeMore').toUpperCase()}</Text>
                            </TouchableOpacity>
                            {onAddToCart && (
                                <TouchableOpacity
                                    style={styles.heroAddBtn}
                                    onPress={(e) => { e.stopPropagation(); onAddToCart(); }}
                                >
                                    <ShoppingBag size={18} color={'#000'} strokeWidth={3} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[
                styles.modernProductCard,
                { backgroundColor: colors.background }
            ]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={{ width: '100%', height: 260, position: 'relative', borderRadius: 20, overflow: 'hidden' }}>
                <Image
                    source={{ uri: product.mainImage || product.image || product.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400' }}
                    style={[styles.modernProductImg, { opacity: product.status === 'sold_out' ? 0.6 : 1 }]}
                />



                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.85)']}
                    style={StyleSheet.absoluteFillObject}
                />

                {onToggleWishlist && (
                    <TouchableOpacity
                        style={[styles.modernWishlistBtn, { backgroundColor: 'rgba(255,255,255,0.25)', position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', zIndex: 10 }]}
                        onPress={(e) => { e.stopPropagation(); onToggleWishlist(); }}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Heart size={18} color={'#FFFFFF'} fill={isWishlisted ? colors.error : 'none'} strokeWidth={isWishlisted ? 0 : 1.5} />
                    </TouchableOpacity>
                )}

                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, zIndex: 10 }}>
                    {product.status === 'sold_out' && (
                        <View style={{ backgroundColor: 'rgba(20, 20, 24, 0.95)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 8 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30', marginRight: 6 }} />
                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>{translate('soldOut').toUpperCase()}</Text>
                        </View>
                    )}

                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700', opacity: 0.8, marginBottom: 4 }}>
                        {String(getName(product.brandName) || 'TAMA').toUpperCase()}
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 }} numberOfLines={2}>
                        {getName(product.name)}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>
                            {product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)} TND
                        </Text>
                        {product.discountPrice && (
                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', textDecorationLine: 'line-through' }}>
                                {product.price.toFixed(2)} TND
                            </Text>
                        )}
                    </View>

                    {showRating && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                            <Star size={12} color="#FFFFFF" fill="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                                {product.rating || '5.0'}   <Text style={{ opacity: 0.6, fontWeight: '500' }}>{product.reviewsCount !== undefined ? product.reviewsCount : (product.reviews?.length || 0)} {translate('reviews').toUpperCase()}</Text>
                            </Text>
                        </View>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <TouchableOpacity
                            style={{ backgroundColor: 'rgba(255,255,255,0.15)', height: 32, paddingHorizontal: 12, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
                            onPress={onPress}
                        >
                            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>{translate('seeMore')}</Text>
                        </TouchableOpacity>

                        {onAddToCart && (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                onPress={(e) => { e.stopPropagation(); onAddToCart(); }}
                                activeOpacity={0.8}
                                disabled={product.status === 'sold_out'}
                            >
                                <ShoppingBag size={18} color={'#000'} strokeWidth={3} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    modernProductCard: {
        width: (SCREEN_WIDTH - 50) / 2, // Accounting for paddings and gaps
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
        // Dribbble-like subtle shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
        elevation: 4,
    },
    imageContainer: {
        width: '100%',
        height: 190,
        position: 'relative',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden', // clips the image to top corners
    },
    modernProductImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    soldOutOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 25,
        backgroundColor: 'rgba(0, 0, 0, 0.25)', // slightly darker to make text pop
    },
    soldOutBadge: {
        backgroundColor: 'rgba(20, 20, 24, 0.95)', // premium dark badge
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    soldOutDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF3B30',
        marginRight: 6,
    },
    soldOutText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    modernWishlistBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 30,
        // Optional subtle shadow on the heart container
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    modernQuickAdd: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 30,
    },
    modernProductInfo: {
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    modernProductName: {
        fontSize: 14,
        fontWeight: '900', // bold title
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    productDescription: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        flex: 1, // allows it to wrap properly if it runs into rating
    },
    modernProductPrice: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    oldPrice: {
        fontSize: 11,
        textDecorationLine: 'line-through',
        fontWeight: '600',
        opacity: 0.5,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginLeft: 4,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '900',
    },
    // Hero Product Card Styles (for TripGlide-style slider)
    heroProductCard: {
        width: '100%',
        height: '100%', // Takes up the wrapper's space
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 25,
        elevation: 8,
    },
    heroImageContainer: {
        width: '100%',
        flex: 1, // Full height
        position: 'relative',
        borderRadius: 30,
        overflow: 'hidden',
    },
    heroProductImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    heroWishlistBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    heroBottomInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        zIndex: 30,
    },
    heroBrandName: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        opacity: 0.8,
        marginBottom: 4,
    },
    heroProductName: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
        marginBottom: 8,
        lineHeight: 28,
    },
    heroRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
    },
    heroRatingText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    heroReviewText: {
        color: '#FFFFFF',
        fontSize: 11,
        opacity: 0.6,
        fontWeight: '500',
    },
    heroBottomActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    heroDetailsBtn: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroDetailsText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    heroAddBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
