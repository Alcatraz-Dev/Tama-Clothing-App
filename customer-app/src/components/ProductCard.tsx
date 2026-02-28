import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { Clock, Heart, Play, ShoppingBag, Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MiniFlashTimer = ({ endTime }: { endTime: string }) => {
  const [timeLeft, setTimeLeft] = useState({ h: "00", m: "00", s: "00" });
  const timerColor = useColor("yellow");
  const timerTextColor = "#000000";

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;
      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ h: "00", m: "00", s: "00" });
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({
          h: h.toString().padStart(2, "0"),
          m: m.toString().padStart(2, "0"),
          s: s.toString().padStart(2, "0"),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <View
      style={[
        styles.miniTimer,
        { backgroundColor: timerColor, shadowColor: timerColor },
      ]}
    >
      <Clock size={10} color={timerTextColor} strokeWidth={2.5} />
      <Text
        variant="caption"
        style={{ color: timerTextColor, fontWeight: "900", fontSize: 7 }}
      >
        {timeLeft.h}:{timeLeft.m}:{timeLeft.s}
      </Text>
    </View>
  );
};

interface ProductCardProps {
  product: any;
  onPress: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  onAddToCart?: () => void;
  showRating?: boolean;
  theme?: "light" | "dark";
  language?: string;
  t?: (key: string) => string;
  colors?: any;
  isFeaturedHero?: boolean;
  horizontal?: boolean;
  customWidth?: number;
  flashSaleEndTime?: string;
}

export default function ProductCard({
  product,
  onPress,
  isWishlisted = false,
  onToggleWishlist,
  onAddToCart,
  showRating = true,
  language = "fr",
  t,
  isFeaturedHero = false,
  horizontal = false,
  customWidth,
  flashSaleEndTime,
}: ProductCardProps) {
  const bgColor = useColor("card");
  const fgColor = useColor("foreground");
  const mutedColor = useColor("muted");
  const textMutedColor = useColor("textMuted");
  const redColor = useColor("red");
  const borderColor = useColor("border");
  const isDark = useColor("text") === "dark";
  const getName = (field: any) => {
    if (!field) return "";
    if (typeof field === "string") return field;
    const langCode = language === "ar" ? "ar-tn" : language || "fr";
    return (
      field[langCode] ||
      field[language || "fr"] ||
      field["fr"] ||
      field["en"] ||
      Object.values(field)[0] ||
      ""
    );
  };

  const translate = (key: string) => {
    const defaults: Record<string, Record<string, string>> = {
      soldOut: { ar: "نفذ", fr: "RUPTURE DE STOCK", en: "Sold Out" },
      premiumQuality: {
        ar: "جودة عالية",
        fr: "Qualité Premium",
        en: "Premium Quality",
      },
      seeMore: { ar: "اكتشف", fr: "DÉCOUVRIR", en: "Discover" },
      reviews: { ar: "تقييم", fr: "Avis", en: "Reviews" },
    };
    const lang = language || "fr";
    if (defaults[key]) {
      return defaults[key][lang] || defaults[key]["en"];
    }
    if (t) return t(key);
    return key;
  };

  if (isFeaturedHero) {
    return (
      <TouchableOpacity
        style={[styles.heroProductCard, { backgroundColor: bgColor }]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.heroImageContainer}>
          <Image
            source={{
              uri:
                product.mainImage ||
                product.image ||
                product.imageUrl ||
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
            }}
            style={[
              styles.heroProductImg,
              { opacity: product.status === "sold_out" ? 0.6 : 1 },
            ]}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)"]}
            style={StyleSheet.absoluteFillObject}
          />
          {onToggleWishlist && (
            <Button
              variant="glass"
              size="icon"
              icon={Heart}
              iconColor={isWishlisted ? redColor : "#FFFFFF"}
              style={styles.heroWishlistBtn}
              onPress={onToggleWishlist}
            />
          )}
          <View style={styles.heroBottomInfo}>
            {flashSaleEndTime && <MiniFlashTimer endTime={flashSaleEndTime} />}
            {product.status === "sold_out" && (
              <View style={styles.soldOutBadge}>
                <View style={styles.soldOutDot} />
                <Text variant="caption" style={styles.soldOutText}>
                  {translate("soldOut").toUpperCase()}
                </Text>
              </View>
            )}
            <Text
              variant="caption"
              style={styles.heroBrandName}
              numberOfLines={1}
            >
              {product.brandName || "TAMA"}
            </Text>
            <Text
              variant="title"
              style={styles.heroProductName}
              numberOfLines={2}
            >
              {getName(product.name)}
            </Text>
            <View style={styles.priceRow}>
              <Text variant="subtitle" style={{ color: "#FFFFFF" }}>
                {Number(product.discountPrice || 0) > 0
                  ? Number(product.discountPrice).toFixed(2)
                  : Number(product.price || 0).toFixed(2)}{" "}
                TND
              </Text>
              {Number(product.discountPrice || 0) > 0 && (
                <Text variant="caption" style={styles.originalPriceHero}>
                  {Number(product.price || 0).toFixed(2)} TND
                </Text>
              )}
            </View>
            <View style={styles.heroRatingRow}>
              <Star size={12} color="#FFFFFF" fill="#FFFFFF" />
              <Text
                variant="caption"
                style={{ color: "#FFFFFF", fontWeight: "800" }}
              >
                {product.rating || "5.0"}{" "}
                <Text
                  variant="caption"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {product.reviewsCount !== undefined
                    ? product.reviewsCount
                    : product.reviews?.length || 0}{" "}
                  {translate("reviews").toUpperCase()}
                </Text>
              </Text>
            </View>
            <View style={styles.heroBottomActions}>
              <Button
                variant="glass"
                label={translate("seeMore").toUpperCase()}
                style={styles.heroDetailsBtn}
                onPress={onPress}
              />
              {onAddToCart && (
                <Button
                  variant="primary"
                  size="icon"
                  icon={ShoppingBag}
                  iconColor="#000000"
                  textStyle={{ color: "#000000" }}
                  style={[styles.heroAddBtn, { backgroundColor: isDark ? '#FFFFFF' : '#E5E5EA' }]}
                  onPress={onAddToCart}
                  disabled={product.status === "sold_out"}
                />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (horizontal) {
    return (
      <TouchableOpacity
        style={[
          styles.horizontalCard,
          { backgroundColor: bgColor, borderColor },
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.horizontalImageContainer}>
          <Image
            source={{
              uri:
                product.mainImage ||
                product.image ||
                product.imageUrl ||
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
            }}
            style={[
              styles.horizontalImage,
              { opacity: product.status === "sold_out" ? 0.6 : 1 },
            ]}
          />
          {product.videoUrl && (
            <View style={styles.videoIndicator}>
              <Play size={10} color="#FFF" fill="#FFF" />
            </View>
          )}
          {product.discountPrice && (
            <View style={styles.discountBadge}>
              <Text variant="caption" style={styles.discountText}>
                -{Math.round((1 - product.discountPrice / product.price) * 100)}
                %
              </Text>
            </View>
          )}
        </View>
        <View style={styles.horizontalInfo}>
          <View>
            {flashSaleEndTime && <MiniFlashTimer endTime={flashSaleEndTime} />}
            <Text
              variant="caption"
              style={{ color: textMutedColor, letterSpacing: 0.5 }}
            >
              {String(getName(product.brandName) || "TAMA").toUpperCase()}
            </Text>
            <Text
              variant="subtitle"
              style={{ color: fgColor }}
              numberOfLines={1}
            >
              {getName(product.name)}
            </Text>
          </View>
          <View style={styles.horizontalPricing}>
            <Text variant="body" style={{ color: fgColor, fontWeight: "800" }}>
              {Number(product.discountPrice || 0) > 0
                ? Number(product.discountPrice).toFixed(2)
                : Number(product.price || 0).toFixed(2)}{" "}
              TND
            </Text>
            {Number(product.discountPrice || 0) > 0 && (
              <Text variant="caption" style={styles.originalPriceHorizontal}>
                {Number(product.price || 0).toFixed(2)} TND
              </Text>
            )}
          </View>
          {showRating && (
            <View style={styles.horizontalRating}>
              <Star size={10} color="#FFD700" fill="#FFD700" />
              <Text variant="caption" style={{ color: fgColor }}>
                {product.rating || "5.0"}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.horizontalActions}>
          {onToggleWishlist && (
            <Button
              variant="ghost"
              size="icon"
              icon={Heart}
              iconColor={isWishlisted ? redColor : fgColor}
              style={[
                styles.actionCircle,
                {
                  backgroundColor: isWishlisted ? redColor + "15" : mutedColor,
                },
              ]}
              onPress={onToggleWishlist}
            />
          )}
          {onAddToCart && (
            <Button
              variant="primary"
              size="icon"
              icon={ShoppingBag}
              style={[styles.actionCircle, { backgroundColor: isDark ? '#FFFFFF' : '#E5E5EA' }]}
              iconColor="#000000"
              onPress={onAddToCart}
              disabled={product.status === "sold_out"}
              textStyle={{ color: "#000000" }}
            />
          )}
        </View>
        {product.status === "sold_out" && (
          <View style={styles.soldOutOverlayHorizontal}>
            <Text variant="caption" style={styles.soldOutTextHorizontal}>
              {translate("soldOut").toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.modernProductCard,
        {
          backgroundColor: bgColor,
          width: customWidth || (SCREEN_WIDTH - 48) / 2,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.modernCardImageWrapper}>
        <Image
          source={{
            uri:
              product.mainImage ||
              product.image ||
              product.imageUrl ||
              "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
          }}
          style={[
            styles.modernProductImg,
            { opacity: product.status === "sold_out" ? 0.6 : 1 },
          ]}
        />
        {product.videoUrl && (
          <View style={styles.videoIndicatorModern}>
            <Play size={12} color="#FFF" fill="#FFF" />
          </View>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          style={StyleSheet.absoluteFillObject}
        />
        {onToggleWishlist && (
          <Button
            variant="glass"
            size="icon"
            icon={Heart}
            iconColor={isWishlisted ? redColor : "#FFFFFF"}
            style={styles.modernWishlistBtn}
            onPress={onToggleWishlist}
          />
        )}
        <View style={styles.modernCardContent}>
          {flashSaleEndTime && <MiniFlashTimer endTime={flashSaleEndTime} />}
          {product.status === "sold_out" && (
            <View style={styles.soldOutBadgeModern}>
              <View style={styles.soldOutDot} />
              <Text variant="caption" style={styles.soldOutTextModern}>
                {translate("soldOut").toUpperCase()}
              </Text>
            </View>
          )}
          <Text
            variant="caption"
            style={styles.modernBrandName}
            numberOfLines={1}
          >
            {String(getName(product.brandName) || "TAMA").toUpperCase()}
          </Text>
          <Text
            variant="subtitle"
            style={styles.modernProductName}
            numberOfLines={2}
          >
            {getName(product.name)}
          </Text>
          <View style={styles.modernPriceRow}>
            <Text
              variant="body"
              style={{ color: "#FFFFFF", fontWeight: "900" }}
            >
              {Number(product.discountPrice || 0) > 0
                ? Number(product.discountPrice).toFixed(2)
                : product.price
                  ? Number(product.price).toFixed(2)
                  : "0.00"}{" "}
              TND
            </Text>
            {Number(product.discountPrice || 0) > 0 && (
              <Text variant="caption" style={styles.originalPriceModern}>
                {product.price ? Number(product.price).toFixed(2) : "0.00"} TND
              </Text>
            )}
          </View>
          {showRating && (
            <View style={styles.modernRatingRow}>
              <Star size={12} color="#FFFFFF" fill="#FFFFFF" />
              <Text
                variant="caption"
                style={{ color: "#FFFFFF", fontWeight: "800" }}
              >
                {product.rating || "5.0"}{" "}
                <Text variant="caption" style={{ opacity: 0.6 }}>
                  {product.reviewsCount !== undefined
                    ? product.reviewsCount
                    : product.reviews?.length || 0}{" "}
                  {translate("reviews").toUpperCase()}
                </Text>
              </Text>
            </View>
          )}
          <View style={styles.modernBottomActions}>
            <Button
              variant="glass"
              label={translate("seeMore")}
              textStyle={{ fontSize: 11 }}
              style={styles.modernSeeMoreBtn}
              onPress={onPress}
            />
            {onAddToCart && (
              <Button
                variant="primary"
                size="icon"
                icon={ShoppingBag}
                iconColor="#000000"
                style={[styles.modernQuickAdd, { backgroundColor: isDark ? '#FFFFFF' : '#E5E5EA' }]}
                onPress={onAddToCart}
                disabled={product.status === "sold_out"}
                textStyle={{ color: "#000000" }}
              />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  miniTimer: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
    marginBottom: 6,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  heroProductCard: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
  },
  heroImageContainer: {
    width: "100%",
    flex: 1,
    position: "relative",
    borderRadius: 30,
    overflow: "hidden",
  },
  heroProductImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroWishlistBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    zIndex: 30,
  },
  heroBottomInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    zIndex: 30,
  },
  soldOutBadge: {
    backgroundColor: "rgba(20, 20, 24, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  soldOutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF3B30",
    marginRight: 6,
  },
  soldOutText: {
    color: "#FFF",
    fontWeight: "800",
  },
  heroBrandName: {
    color: "#FFFFFF",
    opacity: 0.8,
    marginBottom: 4,
    letterSpacing: 1,
  },
  heroProductName: {
    color: "#FFFFFF",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  originalPriceHero: {
    color: "rgba(255,255,255,0.6)",
    textDecorationLine: "line-through",
  },
  heroRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  heroBottomActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroDetailsBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
  },
  heroAddBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  horizontalCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    elevation: 5,
  },
  horizontalImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  horizontalImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  videoIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  discountBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "#FF3B30",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    color: "#FFF",
    fontWeight: "900",
  },
  horizontalInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "space-between",
    height: 90,
  },
  horizontalPricing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  originalPriceHorizontal: {
    opacity: 0.3,
    textDecorationLine: "line-through",
  },
  horizontalRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  horizontalActions: {
    paddingLeft: 12,
    gap: 12,
    alignItems: "center",
  },
  actionCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    color: "#000",
    justifyContent: "center",
  },
  soldOutOverlayHorizontal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  soldOutTextHorizontal: {
    backgroundColor: "#000",
    color: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modernProductCard: {
    borderRadius: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  modernCardImageWrapper: {
    width: "100%",
    height: 280,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  modernProductImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  videoIndicatorModern: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  modernWishlistBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    zIndex: 10,
  },
  modernCardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    zIndex: 10,
  },
  soldOutBadgeModern: {
    backgroundColor: "rgba(20, 20, 24, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  soldOutTextModern: {
    color: "#FFF",
    fontWeight: "800",
  },
  modernBrandName: {
    color: "#FFFFFF",
    opacity: 0.8,
    marginBottom: 4,
  },
  modernProductName: {
    color: "#FFFFFF",
    marginBottom: 6,
  },
  modernPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  originalPriceModern: {
    color: "rgba(255,255,255,0.6)",
    textDecorationLine: "line-through",
  },
  modernRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  modernBottomActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modernSeeMoreBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  modernQuickAdd: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
});
