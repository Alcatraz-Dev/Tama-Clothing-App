/**
 * TikTok-Style Bottom Control Dock for Host
 * Modern live shopping controls with haptic feedback
 */
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Vibration,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  FlipHorizontal,
  ShoppingBag,
  Gift,
  MessageCircle,
  Share2,
  Users,
  Settings,
  Square,
  Heart,
  BarChart2,
  Timer,
  Zap,
} from "lucide-react-native";
import { LIVE_UI_THEME } from "../config/stream";

type TikTokBottomDockProps = {
  isMicOn: boolean;
  isCameraOn: boolean;
  totalLikes: number;
  totalViewers: number;
  durationSeconds: number;
  onLike: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onFlipCamera: () => void;
  onOpenProducts: () => void;
  onOpenGifts: () => void;
  onOpenChat: () => void;
  onOpenSettings: () => void;
  onShare: () => void;
  onEndStream: () => void;
  onOpenCoHosts: () => void;
  formatDuration: (s: number) => string;
};

export const TikTokBottomDock: React.FC<TikTokBottomDockProps> = ({
  isMicOn,
  isCameraOn,
  totalLikes,
  totalViewers,
  durationSeconds,
  onLike,
  onToggleMic,
  onToggleCamera,
  onFlipCamera,
  onOpenProducts,
  onOpenGifts,
  onOpenChat,
  onOpenSettings,
  onShare,
  onEndStream,
  onOpenCoHosts,
  formatDuration,
}) => {
  // Animations
  const likeScale = useRef(new Animated.Value(1)).current;
  const giftScale = useRef(new Animated.Value(1)).current;
  const productScale = useRef(new Animated.Value(1)).current;

  // Pulse animation for like count
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(likeScale, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(likeScale, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const animatePress = (anim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    if (Platform.OS === "ios") {
      Vibration.vibrate(10);
    }
  };

  const handleLikePress = () => {
    animatePress(likeScale);
    onLike();
  };

  const handleGiftPress = () => {
    animatePress(giftScale);
    onOpenGifts();
  };

  const handleProductPress = () => {
    animatePress(productScale);
    onOpenProducts();
  };

  return (
    <>
      {/* Top gradient overlay for depth */}
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          pointerEvents: "none",
        }}
      />

      {/* Bottom Dock Container */}
      <View
        style={[
          styles.dockContainer,
          { paddingBottom: Platform.OS === "ios" ? 34 : 20 },
        ]}
      >
        {/* Left Side - Primary Actions */}
        <View style={styles.leftSection}>
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton]}
              onPress={handleLikePress}
              activeOpacity={0.7}
            >
              <Heart size={22} color="#EF4444" fill="#EF4444" />
              <Text style={[styles.actionLabel, { color: "#EF4444" }]}>
                {formatLikes(totalLikes)}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: giftScale }] }}>
            <TouchableOpacity
              style={[styles.actionButton, styles.giftButton]}
              onPress={handleGiftPress}
              activeOpacity={0.7}
            >
              <Gift size={22} color="#F59E0B" />
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={() => {
              animatePress(likeScale);
              onShare();
            }}
            activeOpacity={0.7}
          >
            <Share2 size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Right Side - Camera & Mic Controls */}
        <View style={styles.rightSection}>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                !isCameraOn && styles.controlButtonOff,
              ]}
              onPress={() => {
                animatePress(productScale);
                onToggleCamera();
              }}
            >
              {isCameraOn ? (
                <Camera size={20} color="#fff" />
              ) : (
                <CameraOff size={20} color="#EF4444" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.flipButton,
                !isCameraOn && styles.controlButtonOff,
              ]}
              onPress={onFlipCamera}
              disabled={!isCameraOn}
            >
              <FlipHorizontal size={18} color={isCameraOn ? "#fff" : "#666"} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                !isMicOn && styles.controlButtonOff,
              ]}
              onPress={() => {
                animatePress(giftScale);
                onToggleMic();
              }}
            >
              {isMicOn ? (
                <Mic size={20} color="#fff" />
              ) : (
                <MicOff size={20} color="#EF4444" />
              )}
            </TouchableOpacity>
          </View>

          <Animated.View style={{ transform: [{ scale: productScale }] }}>
            <TouchableOpacity
              style={[styles.actionButton, styles.productButton]}
              onPress={handleProductPress}
              activeOpacity={0.7}
            >
              <ShoppingBag size={20} color="#10B981" />
              <Text style={[styles.actionLabel, { color: "#10B981" }]}>
                Shop
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Live indicator + timer + viewer count - Top Left */}
      <View style={styles.topLeftInfo}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <View style={styles.timerBadge}>
          <Timer size={12} color="#fff" />
          <Text style={styles.timerText}>{formatDuration(durationSeconds)}</Text>
        </View>
      </View>

      {/* Co-host button - Top Right */}
      <TouchableOpacity style={styles.cohostButton} onPress={onOpenCoHosts}>
        <Users size={18} color="#fff" />
        <Text style={styles.cohostText}>{totalViewers}</Text>
      </TouchableOpacity>

      {/* End Stream Button - Very bottom center */}
      <TouchableOpacity style={styles.endStreamButton} onPress={onEndStream}>
        <Square size={16} color="#fff" />
        <Text style={styles.endStreamText}>END</Text>
      </TouchableOpacity>
    </>
  );
};

const formatLikes = (count: number): string => {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
};

const styles = StyleSheet.create({
   dockContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 85 + 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  cameraControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    gap: 4,
  },
  likeButton: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  giftButton: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  shareButton: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderColor: "rgba(59, 130, 246, 0.4)",
  },
  productButton: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  flipButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  controlButtonOff: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },
  topLeftInfo: {
    position: "absolute",
    top: 58,
    left: 15,
    flexDirection: "row",
    gap: 8,
    zIndex: 1000,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  liveText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  timerText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  cohostButton: {
    position: "absolute",
    top: 58,
    right: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  cohostText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  endStreamButton: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.95)",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#fff",
    gap: 8,
    zIndex: 9999,
    shadowColor: "#EF4444",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  endStreamText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
