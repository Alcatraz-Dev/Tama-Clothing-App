/**
 * TikTok-Style Horizontal Product Carousel
 * Shows pinned & featured products in a swipeable row
 */
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { ShoppingBag, Pin, Zap, ChevronRight } from "lucide-react-native";
import { LIVE_UI_THEME } from "../config/stream";

type Product = {
  id: string;
  name: { [key: string]: string } | string;
  price: number;
  discountPrice?: number;
  images?: string[];
};

type TikTokProductCarouselProps = {
  products: Product[];
  pinnedProductIds: string[];
  selectedProductIds: string[];
  onProductPress: (productId: string) => void;
  onPinProduct: (productId: string) => void;
  getLocalizedName: (name: any) => string;
  language?: "fr" | "ar" | "en";
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = 100;
const CARD_SPACING = 12;
const VISIBLE_COUNT = 4;

export const TikTokProductCarousel: React.FC<TikTokProductCarouselProps> = ({
   products,
   pinnedProductIds,
   selectedProductIds,
   onProductPress,
   onPinProduct,
   getLocalizedName,
   language = "en",
 }) => {
  // Sort: pinned first, then others
  const sortedProducts = [...products].sort((a, b) => {
    const aPinned = pinnedProductIds.includes(a.id) ? 1 : 0;
    const bPinned = pinnedProductIds.includes(b.id) ? 1 : 0;
    return bPinned - aPinned;
  });

  const renderProduct = ({ item, index }: { item: Product; index: number }) => {
    const isPinned = pinnedProductIds.includes(item.id);
    const isSelected = selectedProductIds.includes(item.id);
    const productName = getLocalizedName(item.name);
    const hasDiscount = item.discountPrice && item.discountPrice < item.price;
    const discountPercent = hasDiscount
      ? Math.round((1 - item.discountPrice! / item.price) * 100)
      : 0;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onProductPress(item.id)}
        style={[
          styles.cardContainer,
          { marginRight: index === sortedProducts.length - 1 ? 16 : CARD_SPACING },
        ]}
      >
        {/* Card Background */}
        <View style={[styles.card, isPinned && styles.cardPinned]}>
          {/* Product Image */}
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: item.images?.[0] || "https://via.placeholder.com/150" }}
              style={styles.image}
              resizeMode="cover"
            />
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discountPercent}%</Text>
              </View>
            )}
            {isPinned && (
              <View style={styles.pinnedBadge}>
                <Pin size={10} color="#F59E0B" />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            )}
          </View>

          {/* Product Name */}
          <Text style={styles.name} numberOfLines={2}>
            {productName}
          </Text>

          {/* Price */}
          <View style={styles.priceRow}>
            {hasDiscount ? (
              <>
                <Text style={styles.originalPrice}>{item.price} TND</Text>
                <Text style={styles.currentPrice}>{item.discountPrice} TND</Text>
              </>
            ) : (
              <Text style={styles.currentPrice}>{item.price} TND</Text>
            )}
          </View>

          {/* Quick Action Button */}
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => onPinProduct(item.id)}
            activeOpacity={0.7}
          >
            <ShoppingBag size={14} color="#10B981" />
            <Text style={styles.quickActionText}>
              {isPinned ? "Unpin" : "Pin"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Blur background */}
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Zap size={14} color="#F59E0B" />
          <Text style={styles.headerText}>Shop Now</Text>
        </View>
        <Text style={styles.productCount}>{sortedProducts.length} products</Text>
      </View>

      {/* Horizontal Scroll */}
      <FlatList
        data={sortedProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 16,
          paddingRight: 8,
        }}
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH + CARD_SPACING,
          offset: (CARD_WIDTH + CARD_SPACING) * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100, // above bottom dock
    left: 0,
    right: 0,
    height: 190,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  productCount: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
  },
  cardContainer: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  cardPinned: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  imageWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  image: {
    width: "100%",
    height: CARD_WIDTH - 10,
    borderRadius: 12,
    backgroundColor: "#222",
  },
  discountBadge: {
    position: "absolute",
    top: -4,
    left: -4,
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },
  pinnedBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  pinnedText: {
    color: "#000",
    fontSize: 8,
    fontWeight: "800",
  },
  name: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 14,
    height: 28,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  originalPrice: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    textDecorationLine: "line-through",
  },
  currentPrice: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "800",
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    gap: 4,
  },
  quickActionText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "700",
  },
});
