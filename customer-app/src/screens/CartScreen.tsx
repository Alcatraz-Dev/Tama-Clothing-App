import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import {
    ChevronLeft as ChevronLeftIcon,
    Minus as MinusIcon,
    Plus as PlusIcon,
    ShoppingBag as ShoppingBagIcon,
    Trash2 as Trash2Icon
} from 'lucide-react-native';
import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen({ navigation }: any) {
    const background = useColor('background');
    const foreground = useColor('foreground');
    const border = useColor('border');
    const textMuted = useColor('textMuted');
    const card = useColor('card');
    const red = useColor('red');

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
            <SafeAreaView style={[styles.container, { backgroundColor: background }]}>
                <View style={[styles.header, { borderBottomColor: border }]}>
                    <Button
                        variant="ghost"
                        size="icon"
                        icon={ChevronLeftIcon}
                        onPress={() => navigation.goBack()}
                    />
                    <Text variant="heading" style={styles.headerTitle}>PANIER</Text>
                    <View style={{ width: 44 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <ShoppingBagIcon size={80} color={textMuted} strokeWidth={1} />
                    <Text variant="title" style={[styles.emptyText, { color: textMuted }]}>Votre panier est vide</Text>
                    <Button
                        label="DÉCOUVRIR NOS PRODUITS"
                        variant="primary"
                        onPress={() => navigation.navigate('Home')}
                        style={styles.continueBtn}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: background }]}>
            <View style={[styles.header, { borderBottomColor: border }]}>
                <Button
                    variant="ghost"
                    size="icon"
                    icon={ChevronLeftIcon}
                    onPress={() => navigation.goBack()}
                />
                <Text variant="heading" style={styles.headerTitle}>PANIER ({cart.length})</Text>
                <Button
                    variant="ghost"
                    size="icon"
                    icon={Trash2Icon}
                    onPress={() => clearCart()}
                />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {cart.map((item) => (
                    <View key={`${item.id}-${item.size}`} style={styles.cartItem}>
                        <View style={[styles.itemImage, { backgroundColor: card }]}>
                            {item.image ? (
                                <Image source={{ uri: item.image }} style={styles.fullImage} />
                            ) : (
                                <View style={styles.placeholderImage} />
                            )}
                        </View>
                        <View style={styles.itemInfo}>
                            <View style={styles.itemHeader}>
                                <Text variant="subtitle" style={styles.itemName} numberOfLines={1}>{item.name.fr}</Text>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    icon={Trash2Icon}
                                    iconColor={red}
                                    onPress={() => removeFromCart(item.id, item.size)}
                                />
                            </View>
                            <Text variant="caption" style={[styles.itemSize, { color: textMuted }]}>Taille: {item.size}</Text>
                            <Text variant="title" style={styles.itemPrice}>{typeof item.price === 'number' ? item.price.toFixed(3) : parseFloat(item.price).toFixed(3)} TND</Text>

                            <View style={[styles.quantityContainer, { borderColor: border }]}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    icon={MinusIcon}
                                    onPress={() => updateQuantity(item.id, item.size, -1)}
                                    style={styles.qtyBtn}
                                />
                                <Text variant="body" style={styles.qtyText}>{item.quantity}</Text>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    icon={PlusIcon}
                                    onPress={() => updateQuantity(item.id, item.size, 1)}
                                    style={styles.qtyBtn}
                                />
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: border, backgroundColor: background }]}>
                <View style={styles.totalRow}>
                    <Text variant="caption" style={[styles.totalLabel, { color: textMuted }]}>TOTAL</Text>
                    <Text variant="heading" style={styles.totalValue}>{total.toFixed(3)} TND</Text>
                </View>
                <Button
                    label="PASSER LA COMMANDE"
                    variant="primary"
                    onPress={handleCheckout}
                    style={styles.checkoutBtn}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
    scroll: {
        padding: 20,
    },
    cartItem: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 16,
    },
    itemImage: {
        width: 100,
        aspectRatio: 3 / 4,
        borderRadius: 12,
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
        flex: 1,
        marginRight: 8,
    },
    itemSize: {
        marginBottom: 4,
    },
    itemPrice: {
        marginBottom: 12,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        alignSelf: 'flex-start',
        borderRadius: 12,
        padding: 4,
    },
    qtyBtn: {
        width: 32,
        height: 32,
    },
    qtyText: {
        minWidth: 20,
        textAlign: 'center',
        fontWeight: '700',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    totalLabel: {
        fontWeight: '700',
        letterSpacing: 1,
    },
    totalValue: {
        fontSize: 24,
    },
    checkoutBtn: {
        height: 56,
        borderRadius: 16,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 20,
        marginBottom: 32,
    },
    continueBtn: {
        paddingHorizontal: 32,
    },
});
