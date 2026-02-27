import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { ChevronLeft, Heart, Share2, ShoppingBag } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UniversalVideoPlayer from '../components/common/UniversalVideoPlayer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }: any) {
    const { product } = route.params;
    const [selectedSize, setSelectedSize] = useState('M');
    const [isWishlisted, setIsWishlisted] = useState(false);

    const backgroundColor = useColor('background');
    const cardColor = useColor('card');
    const foregroundColor = useColor('foreground');
    const mutedColor = useColor('muted');
    const textMutedColor = useColor('textMuted');
    const primaryColor = useColor('primary');
    const redColor = useColor('red');

    const handleAddToCart = () => {
        navigation.navigate('Cart');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            {/* Header */}
            <View style={styles.header}>
                <Button
                    variant="ghost"
                    size="icon"
                    icon={ChevronLeft}
                    iconColor={foregroundColor}
                    onPress={() => navigation.goBack()}
                />
                <View style={styles.headerRight}>
                    <Button
                        variant="ghost"
                        size="icon"
                        icon={Share2}
                        iconColor={foregroundColor}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        icon={ShoppingBag}
                        iconColor={foregroundColor}
                        onPress={() => navigation.navigate('Cart')}
                    />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                <View style={[styles.imageGallery, { backgroundColor: mutedColor }]}>
                    {product.videoUrl ? (
                        <UniversalVideoPlayer
                            source={{ uri: product.videoUrl }}
                            style={styles.fullImage}
                            useNativeControls
                            resizeMode="cover"
                            isLooping
                            shouldPlay
                        />
                    ) : product.mainImage || product.image || product.imageUrl ? (
                        <Image
                            source={{ uri: product.mainImage || product.image || product.imageUrl }}
                            style={styles.fullImage}
                        />
                    ) : (
                        <View style={styles.placeholderImage} />
                    )}

                    <Button
                        variant="glass"
                        size="icon"
                        icon={Heart}
                        iconColor={isWishlisted ? redColor : foregroundColor}
                        onPress={() => setIsWishlisted(!isWishlisted)}
                        style={styles.wishlistBtnAbsolute}
                    />
                </View>

                {/* Product Info */}
                <View style={styles.infoSection}>
                    <View style={styles.titleRow}>
                        <Text variant="caption" style={{ color: textMutedColor, letterSpacing: 2 }}>
                            TAMA PREMIUM
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text variant="title" style={{ color: primaryColor }}>
                                {String(parseFloat(String(product.discountPrice && Number(product.discountPrice) > 0 ? product.discountPrice : (product.price || 0))).toFixed(3))} TND
                            </Text>
                            {product.discountPrice && Number(product.discountPrice) > 0 && (
                                <Text variant="caption" style={{ color: textMutedColor, textDecorationLine: 'line-through' }}>
                                    {String(parseFloat(String(product.price || 0)).toFixed(3))} TND
                                </Text>
                            )}
                        </View>
                    </View>

                    <Text variant="heading" style={styles.productName}>
                        {product.name?.fr || product.name || "Produit Tama"}
                    </Text>

                    <Text variant="body" style={[styles.description, { color: textMutedColor }]}>
                        {product.description || "Un vêtement d'exception conçu avec soin dans les ateliers Tama. Qualité premium et coupe intemporelle."}
                    </Text>

                    {/* Size Selector */}
                    <View style={styles.selectorSection}>
                        <Text variant="subtitle" style={styles.selectorTitle}>
                            TAILLE
                        </Text>
                        <View style={styles.sizeGrid}>
                            {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                                <Button
                                    key={size}
                                    variant={selectedSize === size ? 'primary' : 'outline'}
                                    label={size}
                                    onPress={() => setSelectedSize(size)}
                                    style={styles.sizeButton}
                                    textStyle={{ fontSize: 13 }}
                                />
                            ))}
                        </View>
                    </View>

                    {/* CTA */}
                    <Button
                        variant="primary"
                        label={`AJOUTER AU PANIER - ${parseFloat(String(product.discountPrice && Number(product.discountPrice) > 0 ? product.discountPrice : (product.price || 0))).toFixed(3)} TND`}
                        onPress={handleAddToCart}
                        style={styles.addToCartBtn}
                        size="lg"
                    />

                    {/* Extra Info */}
                    <View style={[styles.extraInfo, { borderTopColor: mutedColor }]}>
                        <View style={styles.infoRow}>
                            <Text variant="caption" style={{ color: textMutedColor }}>Composition</Text>
                            <Text variant="body" style={styles.infoValue}>Premium Mix</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text variant="caption" style={{ color: textMutedColor }}>Livraison</Text>
                            <Text variant="body" style={styles.infoValue}>24h - 48h (Tunis)</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        zIndex: 10,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    imageGallery: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 1.3,
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        flex: 1,
    },
    wishlistBtnAbsolute: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        borderRadius: 25,
        width: 50,
        height: 50,
    },
    infoSection: {
        padding: 24,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    productName: {
        marginBottom: 16,
    },
    description: {
        lineHeight: 22,
        marginBottom: 32,
    },
    selectorSection: {
        marginBottom: 32,
    },
    selectorTitle: {
        letterSpacing: 1,
        marginBottom: 16,
    },
    sizeGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    sizeButton: {
        width: 50,
        height: 50,
        paddingHorizontal: 0,
    },
    addToCartBtn: {
        height: 56,
        marginBottom: 32,
    },
    extraInfo: {
        borderTopWidth: 1,
        paddingTop: 24,
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoValue: {
        fontWeight: '600',
    },
});
