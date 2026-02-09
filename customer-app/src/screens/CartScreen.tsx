import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../theme';
// import { useCart } from '../context/CartContext';
import {
    ChevronLeft as ChevronLeftIcon,
    Trash2 as Trash2Icon,
    Plus as PlusIcon,
    Minus as MinusIcon,
    ShoppingBag as ShoppingBagIcon
} from 'lucide-react-native';


export default function CartScreen({ navigation }: any) {
    // const { cart, total, removeFromCart, updateQuantity, clearCart } = useCart();
    const cart: any[] = [];
    const total = 0;
    const removeFromCart = (id: string, s: string) => { };
    const updateQuantity = (id: string, s: string, d: number) => { };
    const clearCart = () => { };


    const handleCheckout = () => {
        Alert.alert('Prochainement', 'Le système de paiement sera disponible bientôt.');
    };

    if (cart.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ChevronLeftIcon color={Theme.light.colors.foreground} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>PANIER</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <ShoppingBagIcon size={80} color={Theme.light.colors.muted} strokeWidth={1} />
                    <Text style={styles.emptyText}>Votre panier est vide</Text>
                    <TouchableOpacity
                        style={styles.continueBtn}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.continueBtnText}>DÉCOUVRIR NOS PRODUITS</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeftIcon color={Theme.light.colors.foreground} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PANIER ({cart.length})</Text>
                <TouchableOpacity onPress={() => clearCart()}>
                    <Trash2Icon color={Theme.light.colors.textMuted} size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {cart.map((item) => (
                    <View key={`${item.id}-${item.size}`} style={styles.cartItem}>
                        <View style={styles.itemImage}>
                            {item.image ? (
                                <Image source={{ uri: item.image }} style={styles.fullImage} />
                            ) : (
                                <View style={styles.placeholderImage} />
                            )}
                        </View>
                        <View style={styles.itemInfo}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.itemName} numberOfLines={1}>{item.name.fr}</Text>
                                <TouchableOpacity onPress={() => removeFromCart(item.id, item.size)}>
                                    <Trash2Icon color={Theme.light.colors.error} size={16} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.itemSize}>Taille: {item.size}</Text>
                            <Text style={styles.itemPrice}>{typeof item.price === 'number' ? item.price.toFixed(3) : parseFloat(item.price).toFixed(3)} TND</Text>

                            <View style={styles.quantityContainer}>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => updateQuantity(item.id, item.size, -1)}
                                >
                                    <MinusIcon size={16} color={Theme.light.colors.foreground} />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{item.quantity}</Text>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => updateQuantity(item.id, item.size, 1)}
                                >
                                    <PlusIcon size={16} color={Theme.light.colors.foreground} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL</Text>
                    <Text style={styles.totalValue}>{total.toFixed(3)} TND</Text>
                </View>
                <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                    <Text style={styles.checkoutText}>PASSER LA COMMANDE</Text>
                </TouchableOpacity>
            </View>
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
        borderBottomWidth: 1,
        borderBottomColor: Theme.light.colors.border,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
    scroll: {
        padding: Theme.spacing.lg,
    },
    cartItem: {
        flexDirection: 'row',
        marginBottom: Theme.spacing.xl,
        gap: 16,
    },
    itemImage: {
        width: 100,
        aspectRatio: 3 / 4,
        backgroundColor: Theme.light.colors.muted,
        borderRadius: 4,
        overflow: 'hidden',
    },
    fullImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderImage: {
        flex: 1,
    },
    itemInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    itemSize: {
        fontSize: 12,
        color: Theme.light.colors.textMuted,
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: Theme.light.colors.border,
        alignSelf: 'flex-start',
        borderRadius: 4,
        padding: 4,
    },
    qtyBtn: {
        padding: 4,
    },
    qtyText: {
        fontSize: 14,
        fontWeight: '600',
        minWidth: 20,
        textAlign: 'center',
    },
    footer: {
        padding: Theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Theme.light.colors.border,
        backgroundColor: Theme.light.colors.background,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.spacing.lg,
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Theme.light.colors.textMuted,
        letterSpacing: 1,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    checkoutBtn: {
        backgroundColor: Theme.light.colors.foreground,
        height: 56,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkoutText: {
        color: Theme.light.colors.background,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: Theme.light.colors.textMuted,
        marginTop: 20,
        marginBottom: 32,
    },
    continueBtn: {
        backgroundColor: Theme.light.colors.foreground,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 4,
    },
    continueBtnText: {
        color: Theme.light.colors.background,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
