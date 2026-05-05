/**
 * GiftAnimationOverlay - Full-screen gift animations like TikTok
 * Uses Lottie for smooth animations
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { Heart, Flame, Star, Zap, Sparkles } from "lucide-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface GiftAnimation {
  id: string;
  giftId: string;
  giftName: string;
  giftIcon: any;
  senderName: string;
  senderAvatar: string;
  quantity: number;
  timestamp: number;
  value: number;
}

interface GiftAnimationOverlayProps {
  visible: boolean;
  animation: GiftAnimation | null;
  onComplete?: () => void;
}

// Pre-defined gift data (would come from config)
const GIFT_CONFIG = {
  heart: { name: "Heart", emoji: "❤️", color: "#FF0066", points: 1, animation: "heart" },
  rose: { name: "Rose", emoji: "🌹", color: "#FF1493", points: 10, animation: "rose" },
  diamond: { name: "Diamond", emoji: "💎", color: "#00D4FF", points: 100, animation: "sparkle" },
  rocket: { name: "Rocket", emoji: "🚀", color: "#FFD700", points: 500, animation: "fly" },
  crown: { name: "Crown", emoji: "👑", color: "#9B59B6", points: 1000, animation: "crown" },
  fireworks: { name: "Fireworks", emoji: "🎆", color: "#FF4500", points: 2000, animation: "fireworks" },
  castle: { name: "Castle", emoji: "🏰", color: "#2ECC71", points: 5000, animation: "castle" },
  dragon: { name: "Dragon", emoji: "🐉", color: "#E74C3C", points: 10000, animation: "dragon" },
};

// Gift animation queue system
export const useGiftAnimationQueue = () => {
  const [queue, setQueue] = useState<GiftAnimation[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<GiftAnimation | null>(null);

  const addGift = (gift: Omit<GiftAnimation, "id" | "timestamp">) => {
    const newGift: GiftAnimation = {
      ...gift,
      id: `gift_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
    };
    setQueue((prev) => [...prev, newGift]);
  };

  useEffect(() => {
    if (queue.length > 0 && !currentAnimation) {
      setCurrentAnimation(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [queue, currentAnimation]);

  const clearCurrent = () => {
    setCurrentAnimation(null);
  };

  return {
    currentAnimation,
    addGift,
    clearCurrent,
    queueLength: queue.length,
  };
};

// Single gift animation component
export const GiftAnimationItem: React.FC<GiftAnimationOverlayProps> = ({
  visible,
  animation,
  onComplete,
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && animation) {
      // Reset animations
      translateY.setValue(SCREEN_HEIGHT);
      scale.setValue(0.3);
      opacity.setValue(0);
      fadeOut.setValue(1);

      // Entry animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT - 200,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Combo animation for quantity > 1
      const comboDuration = animation.quantity > 1 ? 1500 : 3000;
      
      // Fade out after delay
      setTimeout(() => {
        Animated.timing(fadeOut, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          onComplete?.();
        });
      }, comboDuration);
    }
  }, [visible, animation]);

  if (!visible || !animation) return null;

  const giftConfig = GIFT_CONFIG[animation.giftId as keyof typeof GIFT_CONFIG] || GIFT_CONFIG.heart;

  return (
    <Animated.View
      style={[
        styles.giftContainer,
        {
          transform: [{ translateY }, { scale }],
          opacity: Animated.multiply(opacity, fadeOut),
        },
      ]}
    >
      {/* Sender info */}
      <View style={styles.senderInfo}>
        <Image
          source={{ uri: animation.senderAvatar }}
          style={styles.senderAvatar}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.senderDetails}>
          <Text style={styles.senderName}>{animation.senderName}</Text>
          <Text style={styles.giftText}>
            sent {animation.quantity}x {giftConfig.name}
          </Text>
        </View>
      </View>

      {/* Gift display */}
      <View style={styles.giftDisplay}>
        <View style={[styles.giftCircle, { backgroundColor: giftConfig.color + "30" }]}>
          <Text style={styles.giftEmoji}>{giftConfig.emoji}</Text>
        </View>
        
        {/* Combo numbers */}
        {animation.quantity > 1 && (
          <View style={styles.comboContainer}>
            <Text style={styles.comboText}>x{animation.quantity}</Text>
          </View>
        )}
      </View>

      {/* Animation effects */}
      <View style={styles.animationEffects}>
        {Array.from({ length: Math.min(animation.quantity, 5) }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: 30 + i * 20,
                backgroundColor: giftConfig.color,
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

// Full screen effects for big gifts
export const BigGiftAnimation: React.FC<{
  giftId: string;
  visible: boolean;
  onComplete: () => void;
}> = ({ giftId, visible, onComplete }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      rotate.setValue(0);

      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 30,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        Animated.timing(scale, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => onComplete());
      }, 3500);
    }
  }, [visible]);

  if (!visible) return null;

  const config = GIFT_CONFIG[giftId as keyof typeof GIFT_CONFIG];
  if (!config || config.points < 500) return null;

  return (
    <Animated.View
      style={[
        styles.bigGiftContainer,
        {
          transform: [
            { scale },
            {
              rotate: rotate.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={[styles.bigGiftEmoji, { textShadowColor: config.color }]}>
        {config.emoji}
      </Text>
    </Animated.View>
  );
};

// Combo counter component
export const GiftComboCounter: React.FC<{
  count: number;
  visible: boolean;
  onComplete: () => void;
}> = ({ count, visible, onComplete }) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && count > 1) {
      scale.setValue(0);
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 50,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(scale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => onComplete());
      }, 1500);
    }
  }, [visible, count]);

  if (!visible || count <= 1) return null;

  return (
    <Animated.View
      style={[styles.comboCounter, { transform: [{ scale }] }]}
    >
      <View style={styles.comboBadge}>
        <Flame size={16} color="#FFD700" fill="#FFD700" />
        <Text style={styles.comboCount}>{count}x COMBO!</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  giftContainer: {
    position: "absolute",
    bottom: 120,
    left: 16,
    width: SCREEN_WIDTH - 32,
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  senderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FF0066",
  },
  senderDetails: {
    marginLeft: 12,
  },
  senderName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  giftText: {
    color: "#FF0066",
    fontSize: 14,
    marginTop: 2,
  },
  giftDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  giftCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  giftEmoji: {
    fontSize: 40,
  },
  comboContainer: {
    marginLeft: 16,
    backgroundColor: "rgba(255, 215, 0, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  comboText: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "900",
  },
  animationEffects: {
    position: "absolute",
    top: 0,
    right: 20,
  },
  particle: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bigGiftContainer: {
    position: "absolute",
    top: "30%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bigGiftEmoji: {
    fontSize: 120,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  comboCounter: {
    position: "absolute",
    top: 100,
    right: 16,
  },
  comboBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  comboCount: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 4,
  },
});

export { GIFT_CONFIG };
export default null;