/**
 * ModernGiftPanel - Premium TikTok-style gift selection panel
 * Glass morphism design with smooth animations
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  Pressable,
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import { X, Send, ShoppingBag, Crown, Sparkles } from "lucide-react-native";
import { MODERN_GIFTS, Gift, CATEGORY_COLORS, GIFT_BUNDLES } from "../config/gifts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ModernGiftPanelProps {
  visible: boolean;
  onClose: () => void;
  onSendGift: (gift: Gift, quantity: number) => void;
  userCoins: number;
  hostName?: string;
}

const CATEGORIES = [
  { key: "all", label: "All", icon: Sparkles },
  { key: "basic", label: "Basic", icon: Sparkles },
  { key: "premium", label: "Premium", icon: Crown },
  { key: "rare", label: "Rare", icon: Crown },
  { key: "legendary", label: "Legend", icon: Crown },
];

export const ModernGiftPanel: React.FC<ModernGiftPanelProps> = ({
  visible,
  onClose,
  onSendGift,
  userCoins,
  hostName = "Host",
}) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showBundles, setShowBundles] = useState(false);

  const filteredGifts = selectedCategory === "all"
    ? MODERN_GIFTS
    : MODERN_GIFTS.filter((g) => g.category === selectedCategory);

  const handleSend = () => {
    if (selectedGift && quantity > 0) {
      onSendGift(selectedGift, quantity);
      setSelectedGift(null);
      setQuantity(1);
      onClose();
    }
  };

  const canAfford = (price: number) => userCoins >= price;

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Main Panel */}
      <Animated.View style={styles.panel}>
        <BlurView intensity={100} tint="dark" style={styles.panelBlur}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Send a Gift</Text>
              <Text style={styles.subtitle}>to {hostName}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabs}
            contentContainerStyle={styles.categoryContent}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryTab,
                  selectedCategory === cat.key && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <cat.icon
                  size={16}
                  color={selectedCategory === cat.key ? "#FF0066" : "#888"}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat.key && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bundles Toggle */}
          <TouchableOpacity
            style={styles.bundlesToggle}
            onPress={() => setShowBundles(!showBundles)}
          >
            <ShoppingBag size={16} color="#FF0066" />
            <Text style={styles.bundlesText}>Gift Bundles</Text>
          </TouchableOpacity>

          {/* Gift Grid */}
          <ScrollView
            style={styles.giftScroll}
            contentContainerStyle={styles.giftGrid}
            showsVerticalScrollIndicator={false}
          >
            {filteredGifts.map((gift) => {
              const categoryStyle = CATEGORY_COLORS[gift.category];
              const isSelected = selectedGift?.id === gift.id;
              const affordable = canAfford(gift.price);

              return (
                <TouchableOpacity
                  key={gift.id}
                  style={[
                    styles.giftCard,
                    { borderColor: categoryStyle.border },
                    isSelected && styles.giftCardSelected,
                    !affordable && styles.giftCardDisabled,
                  ]}
                  onPress={() => affordable && setSelectedGift(gift)}
                  disabled={!affordable}
                >
                  {/* Gift Emoji */}
                  <View
                    style={[
                      styles.giftEmojiContainer,
                      { backgroundColor: categoryStyle.bg },
                    ]}
                  >
                    <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                    {gift.category === "legendary" && (
                      <View style={styles.legendaryBadge}>
                        <Crown size={10} color="#FFD700" fill="#FFD700" />
                      </View>
                    )}
                  </View>

                  {/* Gift Info */}
                  <Text style={styles.giftName}>{gift.name}</Text>
                  <Text style={[styles.giftPrice, !affordable && styles.giftPriceDisabled]}>
                    {gift.price} 🪙
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Selected Gift & Quantity */}
          {selectedGift && (
            <View style={styles.selectedSection}>
              <View style={styles.selectedGift}>
                <Text style={styles.selectedEmoji}>{selectedGift.emoji}</Text>
                <View>
                  <Text style={styles.selectedName}>{selectedGift.name}</Text>
                  <Text style={styles.selectedCategory}>{selectedGift.category}</Text>
                </View>
              </View>

              {/* Quantity Selector */}
              <View style={styles.quantitySection}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Total */}
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text
                  style={[
                    styles.totalValue,
                    !canAfford(selectedGift.price * quantity) && styles.totalValueDisabled,
                  ]}
                >
                  {selectedGift.price * quantity} 🪙
                </Text>
              </View>
            </View>
          )}

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!selectedGift || !canAfford(selectedGift.price * quantity)) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!selectedGift || !canAfford(selectedGift.price * quantity)}
          >
            <Send size={20} color="#fff" />
            <Text style={styles.sendButtonText}>
              Send {selectedGift ? selectedGift.name : "Gift"}
            </Text>
          </TouchableOpacity>

          {/* Coin Balance */}
          <View style={styles.coinBalance}>
            <Text style={styles.coinBalanceLabel}>Your Balance</Text>
            <Text style={styles.coinBalanceValue}>{userCoins.toLocaleString()} 🪙</Text>
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  panel: {
    height: "75%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  panelBlur: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: {},
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#FF0066",
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryTabs: {
    marginBottom: 16,
  },
  categoryContent: {
    gap: 8,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    gap: 6,
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: "rgba(255, 0, 102, 0.2)",
  },
  categoryText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#FF0066",
  },
  bundlesToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 12,
  },
  bundlesText: {
    color: "#FF0066",
    fontSize: 14,
    fontWeight: "600",
  },
  giftScroll: {
    flex: 1,
  },
  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 16,
  },
  giftCard: {
    width: (SCREEN_WIDTH - 80) / 4,
    aspectRatio: 0.85,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  giftCardSelected: {
    borderColor: "#FF0066",
    backgroundColor: "rgba(255, 0, 102, 0.15)",
  },
  giftCardDisabled: {
    opacity: 0.4,
  },
  giftEmojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  giftEmoji: {
    fontSize: 28,
  },
  legendaryBadge: {
    position: "absolute",
    top: -4,
    right: -4,
  },
  giftName: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  giftPrice: {
    color: "#FFD700",
    fontSize: 10,
    marginTop: 2,
  },
  giftPriceDisabled: {
    color: "#666",
  },
  selectedSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  selectedGift: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  selectedName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  selectedCategory: {
    color: "#FF0066",
    fontSize: 12,
    textTransform: "capitalize",
  },
  quantitySection: {
    alignItems: "center",
    marginRight: 20,
  },
  quantityLabel: {
    color: "#888",
    fontSize: 10,
    marginBottom: 4,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  quantityValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    minWidth: 40,
    textAlign: "center",
  },
  totalSection: {
    alignItems: "flex-end",
  },
  totalLabel: {
    color: "#888",
    fontSize: 10,
  },
  totalValue: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "700",
  },
  totalValueDisabled: {
    color: "#FF0066",
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF0066",
    paddingVertical: 16,
    borderRadius: 25,
    gap: 10,
  },
  sendButtonDisabled: {
    backgroundColor: "#333",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  coinBalance: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  coinBalanceLabel: {
    color: "#888",
    fontSize: 13,
  },
  coinBalanceValue: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ModernGiftPanel;