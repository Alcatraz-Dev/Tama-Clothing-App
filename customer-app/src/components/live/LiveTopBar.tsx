/**
 * LiveTopBar - Top Bar for Live Shopping Streams
 * Shows: Live indicator, viewer count, host info, duration, close button
 */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { LIVE_UI_THEME, LIVE_LAYOUT, formatDuration } from "../../config/stream";
import { X, Eye, Clock, Users } from "lucide-react-native";

interface LiveTopBarProps {
  hostName: string;
  hostAvatar?: string;
  viewerCount: number;
  duration: number;
  onClose?: () => void;
  isHost?: boolean;
  coHosts?: { userId: string; userName: string; userAvatar?: string }[];
  t?: (key: string) => string;
}

export const LiveTopBar: React.FC<LiveTopBarProps> = ({
  hostName,
  hostAvatar,
  viewerCount,
  duration,
  onClose,
  isHost = false,
  coHosts = [],
  t,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for LIVE indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const formattedDuration = formatDuration(duration);

  return (
    <View style={styles.container}>
      {/* Left Section - Host Info */}
      <View style={styles.leftSection}>
        {/* LIVE Badge */}
        <Animated.View
          style={[
            styles.liveBadge,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </Animated.View>

        {/* Host Avatar & Name */}
        <View style={styles.hostInfo}>
          <Image
            source={{
              uri: hostAvatar || `https://ui-avatars.com/api/?name=${hostName}&background=random`,
            }}
            style={styles.hostAvatar}
          />
          <View style={styles.hostTextContainer}>
            <Text style={styles.hostName} numberOfLines={1}>
              {hostName}
            </Text>
            
            {/* Co-hosts indicator */}
            {coHosts.length > 0 && (
              <View style={styles.cohostBadge}>
                <Users size={10} color="#10B981" />
                <Text style={styles.cohostText}>
                  +{coHosts.length}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Center Section - Viewer Count */}
      <View style={styles.centerSection}>
        <View style={styles.viewerBadge}>
          <Eye size={12} color="#fff" />
          <Text style={styles.viewerCount}>
            {viewerCount > 1000 
              ? `${(viewerCount / 1000).toFixed(1)}K` 
              : viewerCount.toLocaleString()}
          </Text>
        </View>

        <View style={styles.durationBadge}>
          <Clock size={10} color="#fff" />
          <Text style={styles.durationText}>{formattedDuration}</Text>
        </View>
      </View>

      {/* Right Section - Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        activeOpacity={0.7}
      >
        <X size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

// Mini version for when video is minimized
export const LiveTopBarMini: React.FC<{
  hostName: string;
  hostAvatar?: string;
  onExpand?: () => void;
}> = ({ hostName, hostAvatar, onExpand }) => {
  return (
    <TouchableOpacity
      style={styles.miniContainer}
      onPress={onExpand}
      activeOpacity={0.8}
    >
      <View style={styles.miniLiveBadge}>
        <View style={styles.miniLiveDot} />
        <Text style={styles.miniLiveText}>LIVE</Text>
      </View>
      
      <Image
        source={{
          uri: hostAvatar || `https://ui-avatars.com/api/?name=${hostName}&background=random`,
        }}
        style={styles.miniAvatar}
      />
      
      <Text style={styles.miniHostName} numberOfLines={1}>
        {hostName}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 100,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    letterSpacing: 0.5,
  },
  hostInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  hostAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  hostTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hostName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    maxWidth: 80,
  },
  cohostBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.3)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  cohostText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "800",
  },
  centerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  viewerCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  durationText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  // Mini styles
  miniContainer: {
    position: "absolute",
    top: 20,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
    zIndex: 100,
  },
  miniLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  miniLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
  },
  miniLiveText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fff",
  },
  miniHostName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    maxWidth: 60,
  },
});

export default LiveTopBar;