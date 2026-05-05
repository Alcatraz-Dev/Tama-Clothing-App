/**
 * LiveShoppingScreen - Product showcase in live stream
 * Products displayed during live streaming with purchase flow
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  X,
  ShoppingBag,
  Heart,
  Star,
  Minus,
  Plus,
  CreditCard,
  ArrowLeft,
  Check,
  Tag,
  TrendingUp,
} from "lucide-react-native";
import { db } from "../api/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, increment } from "firebase/firestore";

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  images: string[];
  price: number;
  discountPrice?: number;
  description?: string;
  category?: string;
  inStock?: boolean;
  stockCount?: number;
}

interface LiveShoppingScreenProps {
  channelId: string;
  hostId: string;
  isHost?: boolean;
  onClose: () => void;
}

// Demo products
const DEMO_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Summer Dress",
    nameFr: "Robe d'été",
    images: ["https://picsum.photos/200/300?random=1"],
    price: 89,
    discountPrice: 59,
    description: "Beautiful summer dress",
    inStock: true,
    stockCount: 15,
  },
  {
    id: "2",
    name: "Handbag",
    nameFr: "Sac à main",
    images: ["https://picsum.photos/200/300?random=2"],
    price: 129,
    discountPrice: 99,
    description: "Elegant leather handbag",
    inStock: true,
    stockCount: 8,
  },
  {
    id: "3",
    name: "Sunglasses",
    nameFr: "Lunettes de soleil",
    images: ["https://picsum.photos/200/300?random=3"],
    price: 49,
    description: "UV protection sunglasses",
    inStock: true,
    stockCount: 25,
  },
];

export const LiveShoppingScreen: React.FC<LiveShoppingScreenProps> = ({
  channelId,
  hostId,
  isHost = false,
  onClose,
}) => {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load products from Firestore
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // In real app, load from Sanity or Firestore
      // For now, using demo products
    } catch (e) {
      console.log("[LiveShopping] Load products error:", e);
    }
  };

  const addToCart = (product: Product) => {
    const existingIndex = cartItems.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, { product, quantity }]);
    }
    
    setQuantity(1);
    setSelectedProduct(null);
    Alert.alert("Added to Cart", `${product.name} added to your cart!`);
  };

  const updateCartQuantity = (index: number, delta: number) => {
    const updated = [...cartItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setCartItems(updated);
  };

  const getTotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.product.discountPrice || item.product.price;
      return sum + price * item.quantity;
    }, 0);
  };

  const processCheckout = async () => {
    setIsProcessing(true);
    
    try {
      // Create order
      const orderRef = await addDoc(collection(db, "orders"), {
        channelId,
        hostId,
        items: cartItems.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.discountPrice || item.product.price,
          quantity: item.quantity,
        })),
        total: getTotal(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Update product stock
      for (const item of cartItems) {
        if (item.product.stockCount !== undefined) {
          await updateDoc(doc(db, "products", item.product.id), {
            stockCount: increment(-item.quantity),
          });
        }
      }

      setCartItems([]);
      setShowCheckout(false);
      setShowCart(false);
      Alert.alert("Order Placed!", "Your order has been placed successfully.");
    } catch (e) {
      console.log("[LiveShopping] Checkout error:", e);
      Alert.alert("Error", "Failed to process order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderProductCard = ({ item }: { item: Product }) => {
    const hasDiscount = item.discountPrice && item.discountPrice < item.price;
    const discountPercent = hasDiscount 
      ? Math.round((1 - item.discountPrice! / item.price) * 100) 
      : 0;

    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => setSelectedProduct(item)}
      >
        <Image
          source={{ uri: item.images[0] }}
          style={styles.productImage}
        />
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.priceContainer}>
            {hasDiscount ? (
              <>
                <Text style={styles.originalPrice}>{item.price} TND</Text>
                <Text style={styles.discountPrice}>{item.discountPrice} TND</Text>
              </>
            ) : (
              <Text style={styles.price}>{item.price} TND</Text>
            )}
          </View>
          {item.stockCount !== undefined && item.stockCount <= 5 && (
            <Text style={styles.lowStock}>Only {item.stockCount} left!</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <ShoppingBag size={20} color="#FF0066" />
          <Text style={styles.headerTitleText}>Live Shopping</Text>
        </View>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => setShowCart(true)}
        >
          <ShoppingBag size={20} color="#fff" />
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Products Grid */}
      <FlatList
        data={products}
        renderItem={renderProductCard}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsGrid}
        columnWrapperStyle={styles.productsRow}
      />

      {/* Product Detail Modal */}
      <Modal visible={!!selectedProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="dark" style={styles.modalContent}>
            {selectedProduct && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Product Details</Text>
                  <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                    <X size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Image
                  source={{ uri: selectedProduct.images[0] }}
                  style={styles.modalImage}
                />

                <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
                <Text style={styles.modalDescription}>
                  {selectedProduct.description || "Premium quality product"}
                </Text>

                <View style={styles.modalPriceContainer}>
                  {selectedProduct.discountPrice ? (
                    <>
                      <Text style={styles.modalOriginalPrice}>
                        {selectedProduct.price} TND
                      </Text>
                      <Text style={styles.modalDiscountPrice}>
                        {selectedProduct.discountPrice} TND
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.modalPrice}>
                      {selectedProduct.price} TND
                    </Text>
                  )}
                </View>

                {/* Quantity Selector */}
                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>Quantity:</Text>
                  <View style={styles.quantitySelector}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.quantityValue}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setQuantity(quantity + 1)}
                    >
                      <Plus size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.addToCartButton}
                  onPress={() => addToCart(selectedProduct)}
                >
                  <ShoppingBag size={20} color="#fff" />
                  <Text style={styles.addToCartText}>
                    Add to Cart ({quantity})
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </BlurView>
        </View>
      </Modal>

      {/* Cart Modal */}
      <Modal visible={showCart} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="dark" style={styles.cartModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Cart</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {cartItems.length === 0 ? (
              <View style={styles.emptyCart}>
                <ShoppingBag size={50} color="#333" />
                <Text style={styles.emptyCartText}>Your cart is empty</Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.cartItems}>
                  {cartItems.map((item, index) => (
                    <View key={index} style={styles.cartItem}>
                      <Image
                        source={{ uri: item.product.images[0] }}
                        style={styles.cartItemImage}
                      />
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName} numberOfLines={1}>
                          {item.product.name}
                        </Text>
                        <Text style={styles.cartItemPrice}>
                          {(item.product.discountPrice || item.product.price)} TND
                        </Text>
                      </View>
                      <View style={styles.cartItemActions}>
                        <TouchableOpacity
                          onPress={() => updateCartQuantity(index, -1)}
                        >
                          <Minus size={16} color="#888" />
                        </TouchableOpacity>
                        <Text style={styles.cartItemQty}>{item.quantity}</Text>
                        <TouchableOpacity
                          onPress={() => updateCartQuantity(index, 1)}
                        >
                          <Plus size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.cartTotal}>
                  <Text style={styles.cartTotalLabel}>Total:</Text>
                  <Text style={styles.cartTotalValue}>{getTotal()} TND</Text>
                </View>

                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={() => setShowCheckout(true)}
                >
                  <CreditCard size={20} color="#fff" />
                  <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                </TouchableOpacity>
              </>
            )}
          </BlurView>
        </View>
      </Modal>

      {/* Checkout Modal */}
      <Modal visible={showCheckout} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="dark" style={styles.checkoutModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Checkout</Text>
              <TouchableOpacity onPress={() => setShowCheckout(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.checkoutSummary}>
              <Text style={styles.checkoutTitle}>Order Summary</Text>
              {cartItems.map((item, index) => (
                <View key={index} style={styles.checkoutItem}>
                  <Text style={styles.checkoutItemName}>
                    {item.product.name} x{item.quantity}
                  </Text>
                  <Text style={styles.checkoutItemPrice}>
                    {(item.product.discountPrice || item.product.price) * item.quantity} TND
                  </Text>
                </View>
              ))}
              <View style={styles.checkoutDivider} />
              <View style={styles.checkoutTotal}>
                <Text style={styles.checkoutTotalLabel}>Total</Text>
                <Text style={styles.checkoutTotalValue}>{getTotal()} TND</Text>
              </View>
            </View>

            <View style={styles.paymentInfo}>
              <CreditCard size={20} color="#FF0066" />
              <Text style={styles.paymentText}>
                Payment will be processed securely
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.processButton, isProcessing && styles.processButtonDisabled]}
              onPress={processCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Text style={styles.processButtonText}>Processing...</Text>
              ) : (
                <>
                  <Check size={20} color="#fff" />
                  <Text style={styles.processButtonText}>Place Order</Text>
                </>
              )}
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitleText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  cartButton: {
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF0066",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  productsGrid: {
    padding: 16,
  },
  productsRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  productCard: {
    width: "48%",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#2a2a2a",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#FF0066",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  originalPrice: {
    color: "#666",
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  discountPrice: {
    color: "#FF0066",
    fontSize: 16,
    fontWeight: "700",
  },
  price: {
    color: "#FF0066",
    fontSize: 16,
    fontWeight: "700",
  },
  lowStock: {
    color: "#FFD700",
    fontSize: 10,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalProductName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalDescription: {
    color: "#888",
    fontSize: 14,
    marginBottom: 12,
  },
  modalPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  modalOriginalPrice: {
    color: "#666",
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  modalDiscountPrice: {
    color: "#FF0066",
    fontSize: 24,
    fontWeight: "700",
  },
  modalPrice: {
    color: "#FF0066",
    fontSize: 24,
    fontWeight: "700",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  quantityLabel: {
    color: "#888",
    fontSize: 14,
    marginRight: 12,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 8,
  },
  quantityButton: {
    padding: 10,
  },
  quantityValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 16,
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF0066",
    paddingVertical: 16,
    borderRadius: 25,
  },
  addToCartText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  cartModalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "70%",
  },
  emptyCart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCartText: {
    color: "#666",
    fontSize: 16,
    marginTop: 16,
  },
  cartItems: {
    flex: 1,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cartItemName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  cartItemPrice: {
    color: "#FF0066",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  cartItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cartItemQty: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    minWidth: 30,
    textAlign: "center",
  },
  cartTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
    marginTop: 16,
  },
  cartTotalLabel: {
    color: "#888",
    fontSize: 16,
  },
  cartTotalValue: {
    color: "#FF0066",
    fontSize: 24,
    fontWeight: "700",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF0066",
    paddingVertical: 16,
    borderRadius: 25,
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  checkoutModalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "60%",
  },
  checkoutSummary: {
    marginBottom: 20,
  },
  checkoutTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  checkoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  checkoutItemName: {
    color: "#888",
    fontSize: 14,
  },
  checkoutItemPrice: {
    color: "#fff",
    fontSize: 14,
  },
  checkoutDivider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 12,
  },
  checkoutTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkoutTotalLabel: {
    color: "#888",
    fontSize: 16,
  },
  checkoutTotalValue: {
    color: "#FF0066",
    fontSize: 24,
    fontWeight: "700",
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  paymentText: {
    color: "#888",
    fontSize: 12,
    marginLeft: 12,
    flex: 1,
  },
  processButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00D4FF",
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 20,
  },
  processButtonDisabled: {
    opacity: 0.5,
  },
  processButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});

export default LiveShoppingScreen;