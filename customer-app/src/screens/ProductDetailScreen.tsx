import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import { ChevronLeft, ShoppingBag, Heart, Share2 } from 'lucide-react-native';
import UniversalVideoPlayer from '../components/common/UniversalVideoPlayer';
// import { useCart, CartItem } from '../context/CartContext';


const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }: any) {
    const { product } = route.params;
    // const { addToCart } = useCart();
    const [selectedSize, setSelectedSize] = useState('M');

    const handleAddToCart = () => {
        /*
        const item: CartItem = {
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            quantity: 1,
            image: product.mainImage,
            size: selectedSize,
        };
        addToCart(item);
        */
        navigation.navigate('Cart');
    };


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft color={Theme.light.colors.foreground} size={24} />
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Share2 color={Theme.light.colors.foreground} size={22} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Cart')}>
                        <ShoppingBag color={Theme.light.colors.foreground} size={22} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                <View style={styles.imageGallery}>
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
                        <Image source={{ uri: product.mainImage || product.image || product.imageUrl }} style={styles.fullImage} />
                    ) : (
                        <View style={styles.placeholderImage} />
                    )}
                    <TouchableOpacity style={styles.wishlistBtnAbsolute}>
                        <Heart size={24} color={Theme.light.colors.foreground} />
                    </TouchableOpacity>
                </View>

                {/* Product Info */}
                <View style={styles.infoSection}>
                    <View style={styles.titleRow}>
                        <Text style={styles.brandName}>TAMA PREMIUM</Text>
                        <Text style={styles.price}>{String(parseFloat(String(product.price || 0)).toFixed(3))} TND</Text>

                    </View>
                    <Text style={styles.productName}>{product.name.fr}</Text>

                    <Text style={styles.description}>
                        {product.description || "Un vêtement d'exception conçu avec soin dans les ateliers Tama. Qualité premium et coupe intemporelle."}
                    </Text>

                    {/* Size Selector */}
                    <View style={styles.selectorSection}>
                        <Text style={styles.selectorTitle}>TAILLE</Text>
                        <View style={styles.sizeGrid}>
                            {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                                <TouchableOpacity
                                    key={size}
                                    onPress={() => setSelectedSize(size)}
                                    style={[
                                        styles.sizeBox,
                                        selectedSize === size && styles.selectedSizeBox
                                    ]}
                                >
                                    <Text style={[
                                        styles.sizeText,
                                        selectedSize === size && styles.selectedSizeText
                                    ]}>{size}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* CTA */}
                    <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
                        <Text style={styles.addToCartText}>AJOUTER AU PANIER</Text>
                    </TouchableOpacity>

                    {/* Extra Info */}
                    <View style={styles.extraInfo}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Composition</Text>
                            <Text style={styles.infoValue}>Premium Mix</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Livraison</Text>
                            <Text style={styles.infoValue}>24h - 48h (Tunis)</Text>
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
        backgroundColor: Theme.light.colors.background,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.lg,
        zIndex: 10,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 16,
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageGallery: {
        width: width,
        height: width * 1.3,
        backgroundColor: Theme.light.colors.muted,
    },
    fullImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderImage: {
        flex: 1,
    },
    wishlistBtnAbsolute: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 50,
        height: 50,
        backgroundColor: Theme.light.colors.white,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    infoSection: {
        padding: Theme.spacing.lg,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    brandName: {
        fontSize: 12,
        fontWeight: '600',
        color: Theme.light.colors.textMuted,
        letterSpacing: 2,
    },
    price: {
        fontSize: 18,
        fontWeight: '700',
    },
    productName: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: Theme.spacing.md,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: Theme.light.colors.textMuted,
        marginBottom: Theme.spacing.xl,
    },
    selectorSection: {
        marginBottom: Theme.spacing.xl,
    },
    selectorTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: Theme.spacing.md,
    },
    sizeGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    sizeBox: {
        width: 45,
        height: 45,
        borderWidth: 1,
        borderColor: Theme.light.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
    },
    selectedSizeBox: {
        backgroundColor: Theme.light.colors.foreground,
        borderColor: Theme.light.colors.foreground,
    },
    sizeText: {
        fontSize: 14,
        fontWeight: '500',
    },
    selectedSizeText: {
        color: Theme.light.colors.white,
    },
    addToCartBtn: {
        backgroundColor: Theme.light.colors.foreground,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        marginBottom: Theme.spacing.xl,
    },
    addToCartText: {
        color: Theme.light.colors.background,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
    extraInfo: {
        borderTopWidth: 1,
        borderTopColor: Theme.light.colors.border,
        paddingTop: Theme.spacing.lg,
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoLabel: {
        fontSize: 14,
        color: Theme.light.colors.textMuted,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
    },
});
