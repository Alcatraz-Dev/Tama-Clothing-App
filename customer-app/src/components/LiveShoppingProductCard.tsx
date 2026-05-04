import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";

type Product = {
  id: string;
  name: { [key: string]: string } | string;
  price: number;
  discountPrice?: number;
  images?: string[];
  description?: { [key: string]: string } | string;
};

type LiveShoppingProductCardProps = {
  product: Product;
  isSelected: boolean;
  isPinned: boolean;
  onSelect: (id: string) => void;
  onPin: (id: string) => void;
  getLocalizedName: (name: any) => string;
  language?: "fr" | "ar" | "en";
  variant?: "compact" | "featured" | "grid";
};

const LiveShoppingProductCard: React.FC<LiveShoppingProductCardProps> = ({
  product,
  isSelected,
  isPinned,
  onSelect,
  onPin,
  getLocalizedName,
  language = "fr",
  variant = "grid",
}) => {
  const productName = getLocalizedName(product.name);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.discountPrice! / product.price) * 100)
    : 0;

  const cardStyle = variant === "featured" ? styles.featuredCard : styles.gridCard;
  const imageSize = variant === "featured" ? 120 : 70;

  return (
    <Animatable.View
      animation="fadeInUp"
      duration={400}
      style={[
        cardStyle,
        isSelected && styles.selectedCard,
        isPinned && styles.pinnedCard,
      ]}
    >
      <LinearGradient
        colors={
          isPinned
            ? ["rgba(245, 158, 11, 0.15)", "rgba(245, 158, 11, 0.05)"]
            : isSelected
            ? ["rgba(59, 130, 246, 0.15)", "rgba(59, 130, 246, 0.05)"]
            : ["rgba(255, 255, 255, 0.03)", "rgba(255, 255, 255, 0.01)"]
        }
        style={styles.cardGradient}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images?.[0] || "https://via.placeholder.com/150" }}
            style={[styles.productImage, { width: imageSize, height: imageSize }]}
            resizeMode="cover"
          />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text
            numberOfLines={2}
            style={[styles.productName, variant === "compact" && styles.compactName]}
          >
            {productName}
          </Text>

          <View style={styles.priceRow}>
            {hasDiscount ? (
              <>
                <Text style={styles.originalPrice}>{product.price} TND</Text>
                <Text style={styles.discountPrice}>{product.discountPrice} TND</Text>
              </>
            ) : (
              <Text style={styles.regularPrice}>{product.price} TND</Text>
            )}
          </View>
        </View>

        {variant !== "compact" && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => onPin(product.id)}
              style={[
                styles.pinButton,
                isPinned && styles.pinnedButton,
              ]}
            >
              <Text style={[styles.pinButtonText, isPinned && styles.pinButtonTextActive]}>
                {isPinned ? "📌 ÉPINGLÉ" : "📌"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onSelect(product.id)}
              style={[
                styles.selectButton,
                isSelected && styles.selectedButton,
              ]}
            >
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  featuredCard: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  selectedCard: {
    borderColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pinnedCard: {
    borderColor: "#F59E0B",
    shadowColor: "#F59E0B",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardGradient: {
    padding: 14,
  },
  imageContainer: {
    position: "relative",
    alignSelf: "center",
    marginBottom: 10,
  },
  productImage: {
    borderRadius: 12,
    backgroundColor: "#222",
  },
  discountBadge: {
    position: "absolute",
    top: -6,
    left: -6,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 10,
  },
  discountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },
  productInfo: {
    alignItems: "center",
    marginBottom: 10,
  },
  productName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
    lineHeight: 18,
  },
  compactName: {
    fontSize: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  originalPrice: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  discountPrice: {
    color: "#F59E0B",
    fontSize: 15,
    fontWeight: "800",
  },
  regularPrice: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pinButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  pinnedButton: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderColor: "#F59E0B",
  },
  pinButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  pinButtonTextActive: {
    color: "#F59E0B",
  },
  selectButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedButton: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default LiveShoppingProductCard;