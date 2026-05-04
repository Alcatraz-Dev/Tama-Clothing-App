import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Animatable from "react-native-animatable";
import { ShoppingBag, X, Zap } from "lucide-react-native";

type PinnedProductOverlayProps = {
  product: {
    id: string;
    name: { [key: string]: string } | string;
    price: number;
    discountPrice?: number;
    images?: string[];
    description?: { [key: string]: string } | string;
  };
  onUnpin: () => void;
  onAddToCart: () => void;
  getLocalizedName: (name: any) => string;
  timeRemaining?: number;
  language?: "fr" | "ar" | "en";
  isVisible?: boolean;
};

const PinnedProductOverlay: React.FC<PinnedProductOverlayProps> = ({
  product,
  onUnpin,
  onAddToCart,
  getLocalizedName,
  timeRemaining,
  language = "fr",
  isVisible = true,
}) => {
  const productName = getLocalizedName(product.name);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const price = hasDiscount ? product.discountPrice : product.price;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    return () => pulseAnim.stopAnimation();
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Animatable.View
      animation="fadeInLeft"
      duration={400}
      style={styles.container}
    >
      <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
        <Animated.View style={[styles.content, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.header}>
            <View style={styles.liveBadge}>
              <Zap size={12} color="#F59E0B" />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            {timeRemaining !== undefined && timeRemaining > 0 && (
              <View style={styles.timerBadge}>
                <Text style={styles.timerText}>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={onUnpin} style={styles.closeBtn}>
              <X size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.productRow}>
            <Image
              source={{ uri: product.images?.[0] || "https://via.placeholder.com/100" }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text numberOfLines={2} style={styles.productName}>
                {productName}
              </Text>
              <Text style={styles.productPrice}>{price} TND</Text>
              {hasDiscount && (
                <Text style={styles.discountPrice}>
                  <Text style={{ textDecorationLine: "line-through", color: "#888" }}>
                    {product.price} TND
                  </Text>
                  {"  →  "}
                  <Text style={{ color: "#F59E0B", fontWeight: "900" }}>
                    -{Math.round((1 - product.discountPrice! / product.price) * 100)}%
                  </Text>
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity onPress={onAddToCart} style={styles.ctaButton}>
            <LinearGradient
              colors={["#F59E0B", "#D97706"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <ShoppingBag size={16} color="#fff" />
              <Text style={styles.ctaText}>Acheter Maintenant</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Animatable.View>
  );
};

import { LinearGradient } from "expo-linear-gradient";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 180,
    left: 15,
    width: 260,
    zIndex: 300,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  blurContainer: {
    borderRadius: 20,
  },
  content: {
    padding: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  liveText: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "900",
  },
  timerBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  closeBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#333",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 16,
  },
  productPrice: {
    color: "#F59E0B",
    fontSize: 15,
    fontWeight: "900",
  },
  discountPrice: {
    color: "#fff",
    fontSize: 11,
    marginTop: 2,
  },
  ctaButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 8,
  },
  ctaText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});

export default PinnedProductOverlay;