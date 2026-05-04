/**
 * TikTok Shop Style - Floating Interactive Product Sticker
 * Pops up when host pins a product, with "Buy Now" button
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { ShoppingBag, X, Zap, Star, ArrowRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";

type Product = {
  id: string;
  name: { [key: string]: string } | string;
  price: number;
  discountPrice?: number;
  images?: string[];
  description?: any;
};

type FloatingProductStickerProps = {
  product: Product | null;
  isVisible: boolean;
  onClose: () => void;
  onBuyNow: () => void;
  onViewDetails: () => void;
  getLocalizedName: (name: any) => string;
  autoHideDelay?: number; // ms, 0 = no auto-hide
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const FloatingProductSticker: React.FC<FloatingProductStickerProps> = ({
  product,
  isVisible,
  onClose,
  onBuyNow,
  onViewDetails,
  getLocalizedName,
  autoHideDelay = 0,
}) => {
  const [showContent, setShowContent] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible && product) {
      // Reset state
      setShowContent(true);

      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Haptic feedback
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Auto-hide timer
      if (autoHideDelay > 0) {
        if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = setTimeout(() => {
          handleClose();
        }, autoHideDelay);
      }
    } else {
      handleClose();
    }

    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, [isVisible, product]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 30, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setShowContent(false);
      onClose();
    });
  };

  if (!product || !showContent) return null;

  const productName = getLocalizedName(product.name);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const displayPrice = hasDiscount ? product.discountPrice : product.price;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* Background Blur */}
      <BlurView intensity={95} tint="dark" style={styles.blurContainer}>
        <View style={styles.card}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <X size={16} color="#fff" />
          </TouchableOpacity>

          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.images?.[0] || "https://via.placeholder.com/150" }}
              style={styles.image}
              resizeMode="cover"
            />
            {/* Glow effect */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.glowEffect}
              pointerEvents="none"
            />
          </View>

          {/* Product Info */}
          <View style={styles.infoContainer}>
            {/* Hot indicator */}
            <View style={styles.hotBadge}>
              <Zap size={10} color="#F59E0B" />
              <Text style={styles.hotText}>HOT</Text>
            </View>

            <Text style={styles.name} numberOfLines={2}>
              {productName}
            </Text>

            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>{displayPrice} TND</Text>
              {hasDiscount && (
                <>
                  <Text style={styles.originalPrice}> {product.price} TND</Text>
                  <View style={styles.discountTag}>
                    <Text style={styles.discountPercent}>
                      -{Math.round((1 - product.discountPrice! / product.price) * 100)}%
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Buy Now Button */}
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => {
                handleClose();
                onBuyNow();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#F59E0B", "#D97706"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buyButtonGradient}
              >
                <ShoppingBag size={16} color="#fff" />
                <Text style={styles.buyButtonText}>Buy Now</Text>
                <ArrowRight size={14} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            {/* View Details Button */}
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => {
                handleClose();
                onViewDetails();
              }}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
};

import { LinearGradient } from "expo-linear-gradient";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 180,
    right: 12,
    width: 200,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  blurContainer: {
    borderRadius: 20,
    overflow: "hidden",
  },
  card: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 180,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1a1a2e",
  },
  glowEffect: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  infoContainer: {
    padding: 14,
    gap: 8,
  },
  hotBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  hotText: {
    color: "#F59E0B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  name: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  currentPrice: {
    color: "#10B981",
    fontSize: 18,
    fontWeight: "900",
  },
  originalPrice: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  discountTag: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  discountPercent: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "800",
  },
  buyButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  buyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  buyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  viewDetailsButton: {
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 2,
  },
  viewDetailsText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
  },
});
