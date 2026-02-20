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
}: ProductCardProps) {
    const isDark = theme === 'dark';

    const getName = (field: any) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        const langCode = language === 'ar' ? 'ar-tn' : (language || 'fr');
        return field[langCode] || field[language || 'fr'] || field['fr'] || field['en'] || Object.values(field)[0] || '';
    };
    
    const translate = (key: string) => {
        if (t) return t(key);
        const defaults: Record<string, Record<string, string>> = {
            soldOut: { ar: 'نفذ', fr: 'Épuisé', en: 'Sold Out' },
            premiumQuality: { ar: 'جودة عالية', fr: 'Qualité Premium', en: 'Premium Quality' },
        };
        const lang = language || 'fr';
        return defaults[key]?.[lang] || defaults[key]?.['en'] || key;
    };

    const colors = extraColors || {
        background: isDark ? '#1C1C1E' : '#FFF',
        foreground: isDark ? '#FFF' : '#000',
        border: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5E5',
        textMuted: isDark ? '#A1A1AA' : '#666',
        error: '#FF3B30',
    };

    return (
        <TouchableOpacity
            style={[
                styles.modernProductCard,
                {
                    backgroundColor: colors.background,
                    borderColor: colors.border
                }
            ]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={{ position: 'relative' }}>
                <Image
                    source={{ uri: product.mainImage || product.image || product.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400' }}
                    style={[styles.modernProductImg, { opacity: product.status === 'sold_out' ? 0.6 : 1 }]}
                />

                {product.status === 'sold_out' && (
                    <View style={styles.soldOutOverlay}>
                        <View style={styles.soldOutBadge}>
                            <View style={styles.soldOutDot} />
                            <Text style={styles.soldOutText}>{translate('soldOut')}</Text>
                        </View>
                    </View>
                )}

                {onToggleWishlist && (
                    <TouchableOpacity
                        style={[styles.modernWishlistBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)' }]}
                        onPress={(e) => { e.stopPropagation(); onToggleWishlist(); }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Heart size={16} color={isWishlisted ? colors.error : colors.foreground} fill={isWishlisted ? colors.error : 'none'} strokeWidth={2} />
                    </TouchableOpacity>
                )}

                {onAddToCart && (
                    <TouchableOpacity
                        style={[styles.modernQuickAdd, { backgroundColor: colors.foreground }]}
                        onPress={(e) => { e.stopPropagation(); onAddToCart(); }}
                        disabled={product.status === 'sold_out'}
                        activeOpacity={0.8}
                    >
                        <ShoppingBag size={15} color={isDark ? '#000' : '#FFF'} strokeWidth={2.5} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.modernProductInfo}>
                <Text style={[styles.modernProductName, { color: colors.foreground }]} numberOfLines={1}>
                    {getName(product.name)}
                </Text>
                <Text style={[styles.productDescription, { color: colors.textMuted }]} numberOfLines={1}>
                    {getName(product.description) || translate('premiumQuality')}
                </Text>
                <View style={styles.priceRow}>
                    <View style={styles.priceContainer}>
                        {product.discountPrice ? (
                            <>
                                <Text style={[styles.modernProductPrice, { color: colors.foreground }]}>{product.discountPrice} TND</Text>
                                <Text style={[styles.oldPrice, { color: colors.textMuted }]}>{product.price} TND</Text>
                            </>
                        ) : (
                            <Text style={[styles.modernProductPrice, { color: colors.foreground }]}>{product.price} TND</Text>
                        )}
                    </View>
                    {showRating && (
                        <View style={styles.ratingContainer}>
                            <Star size={10} color="#FF9500" fill="#FF9500" />
                            <Text style={[styles.ratingText, { color: colors.foreground }]}>{product.rating || '5.0'}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    modernProductCard: {
        width: (SCREEN_WIDTH - 50) / 2,
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 15,
    },
    modernProductImg: {
        width: '100%',
        height: 180,
    },
    soldOutOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 25,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    soldOutBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    soldOutDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#FF3B30',
        marginRight: 7,
    },
    soldOutText: {
        color: 'white',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    modernWishlistBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 30,
    },
    modernQuickAdd: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    modernProductInfo: {
        padding: 12,
    },
    modernProductName: {
        fontSize: 13,
        fontWeight: '700',
    },
    productDescription: {
        fontSize: 11,
        marginTop: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    modernProductPrice: {
        fontSize: 13,
        fontWeight: '800',
    },
    oldPrice: {
        fontSize: 10,
        textDecorationLine: 'line-through',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '800',
    },
});
