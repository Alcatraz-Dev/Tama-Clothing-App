/**
 * LiveShoppingProductCard - Beautiful Product Card for Live Shopping
 * TikTok/Instagram Live Shop Style
 */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { BlurView } from "expo-blur";
import { LIVE_UI_THEME, LIVE_LAYOUT } from "../../config/stream";
import { X, ShoppingBag, Clock, Zap } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  images: string[];
}

interface LiveShoppingProductCardProps {
  product: Product;
  onClose?: () => void;
  onBuy?: () => void;
  isPinned?: boolean;
  timeRemaining?: number;
  localizedName?: (name: string) => string;
  animation?: "fadeInLeft" | "fadeInRight" | "slideInUp" | "bounceIn";
}

export const LiveShoppingProductCard: React.FC<LiveShoppingProductCardProps> = ({
  product,
  onClose,
  onBuy,
  isPinned = false,
  timeRemaining = 0,
  localizedName,
  animation = "bounceIn",
}) => {
  const [countdown, setCountdown] = useState(timeRemaining);
  const discount = product.discountPrice 
    ? Math.round((1 - product.discountPrice / product.price) * 100) 
    : 0;

  useEffect(() => {
    if (timeRemaining <= 0) return;
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeRemaining]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getProductName = () => {
    if (localizedName && typeof product.name === "object") {
      return localizedName(product.name) || product.name?.fr || "Product";
    }
    return product.name || "Product";
  };

  return (
    <Animatable.View
      animation={animation}
      duration={400}
      style={styles.container}
    >
      <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images?.[0] || "https://via.placeholder.com/100" }}
            style={styles.productImage}
            resizeMode="cover"
          />
          
          {/* Discount Badge */}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}

          {/* Timer (if pinned) */}
          {isPinned && countdown > 0 && (
            <View style={styles.timerBadge}>
              <Clock size={10} color="#fff" />
              <Text style={styles.timerText}>{formatTime(countdown)}</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName} numberOfLines={2}>
            {getProductName()}
          </Text>
          
          <View style={styles.priceContainer}>
            {product.discountPrice ? (
              <>
                <Text style={styles.originalPrice}>
                  {product.price.toFixed(2)} TND
                </Text>
                <Text style={styles.discountPrice}>
                  {product.discountPrice.toFixed(2)} TND
                </Text>
              </>
            ) : (
              <Text style={styles.price}>
                {product.price.toFixed(2)} TND
              </Text>
            )}
          </View>

          {/* Buy Button */}
          <TouchableOpacity
            style={styles.buyButton}
            onPress={onBuy}
            activeOpacity={0.8}
          >
            <ShoppingBag size={14} color="#fff" />
            <Text style={styles.buyText}>Buy Now</Text>
          </TouchableOpacity>
        </View>

        {/* Close Button */}
        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={14} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Pinned Indicator */}
        {isPinned && (
          <View style={styles.pinnedIndicator}>
            <Zap size={10} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.pinnedText}>PINNED</Text>
          </View>
        )}
      </BlurView>
    </Animatable.View>
  );
};

// Compact version for carousel
export const LiveShoppingProductCardCompact: React.FC<{
  product: Product;
  onPress: () => void;
  isSelected?: boolean;
  localizedName?: (name: string) => string;
}> = ({ product, onPress, isSelected = false, localizedName }) => {
  const discount = product.discountPrice 
    ? Math.round((1 - product.discountPrice / product.price) * 100) 
    : 0;

  const getProductName = () => {
    if (localizedName && typeof product.name === "object") {
      return localizedName(product.name) || product.name?.fr || "Product";
    }
    return product.name || "Product";
  };

  return (
    <TouchableOpacity
      style={[
        styles.compactContainer,
        isSelected && styles.compactSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: product.images?.[0] || "https://via.placeholder.com/60" }}
        style={styles.compactImage}
      />
      
      {discount > 0 && (
        <View style={styles.compactDiscountBadge}>
          <Text style={styles.compactDiscountText}>-{discount}%</Text>
        </View>
      )}

      <Text style={styles.compactName} numberOfLines={1}>
        {getProductName()}
      </Text>

      <Text style={[
        styles.compactPrice,
        product.discountPrice && styles.compactDiscountPrice,
      ]}>
        {product.discountPrice || product.price} TND
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Main Card Styles
  container: {
    width: 180,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  blurContainer: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "rgba(18, 18, 24, 0.9)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    top: 4,
    left: 4,
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
  timerBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  timerText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "space-between",
  },
  productName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  originalPrice: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 10,
    textDecorationLine: "line-through",
  },
  discountPrice: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "900",
  },
  price: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "900",
  },
  buyButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    marginTop: 4,
  },
  buyText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  closeButton: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pinnedIndicator: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(245, 158, 11, 0.9)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  pinnedText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "900",
  },

  // Compact Card Styles
  compactContainer: {
    width: LIVE_LAYOUT.productCarousel.cardWidth,
    height: LIVE_LAYOUT.productCarousel.cardHeight,
    backgroundColor: "rgba(18, 18, 24, 0.9)",
    borderRadius: LIVE_LAYOUT.productCarousel.borderRadius,
    padding: 6,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  compactSelected: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  compactImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  compactDiscountBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "#EF4444",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  compactDiscountText: {
    color: "#fff",
    fontSize: 7,
    fontWeight: "900",
  },
  compactName: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  compactPrice: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2,
  },
  compactDiscountPrice: {
    color: "#10B981",
  },
});

export default LiveShoppingProductCard;