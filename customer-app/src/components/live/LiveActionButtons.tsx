/**
 * LiveActionButtons - Beautiful Action Buttons for Live Shopping
 * TikTok/Instagram Live Style - Right Side Actions
 */
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  FlatList,
  Image,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { BlurView } from "expo-blur";
import {
  Heart,
  MessageCircle,
  Gift,
  Share2,
  Users,
  ShoppingBag,
  MoreHorizontal,
  Camera,
  Mic,
  MicOff,
  CameraOff,
  BarChart2,
  Ticket,
  Swords,
  Send,
  Coins,
  PlusCircle,
  X,
  Check,
  UserPlus,
} from "lucide-react-native";
import { LIVE_UI_THEME, LIVE_LAYOUT, ENHANCED_GIFTS, SHOPPING_CONFIG } from "../config/stream";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface LiveActionButtonsProps {
  // Like
  onLike: () => void;
  totalLikes: number;
  
  // Chat
  onOpenChat: () => void;
  unreadMessages?: number;
  
  // Gifts
  onOpenGifts: () => void;
  userBalance?: number;
  
  // Share
  onShare: () => void;
  
  // Products
  onOpenProducts: () => void;
  hasPinnedProduct?: boolean;
  productCount?: number;
  
  // Co-host (host only)
  onOpenCoHost?: () => void;
  coHostCount?: number;
  pendingRequests?: number;
  
  // Polls (host only)
  onOpenPolls: () => void;
  hasActivePoll?: boolean;
  
  // PK Battle (host only)
  onOpenPK: () => void;
  isInPK?: boolean;
  
  // Coupons (host only)
  onOpenCoupons: () => void;
  hasActiveCoupon?: boolean;
  
  // Camera/Mic (host only)
  isCameraOn?: boolean;
  isMicOn?: boolean;
  onToggleCamera?: () => void;
  onToggleMic?: () => void;
  
  // Role
  isHost?: boolean;
}

export const LiveActionButtons: React.FC<LiveActionButtonsProps> = ({
  onLike,
  totalLikes,
  onOpenChat,
  unreadMessages = 0,
  onOpenGifts,
  userBalance = 0,
  onShare,
  onOpenProducts,
  hasPinnedProduct = false,
  productCount = 0,
  onOpenCoHost,
  coHostCount = 0,
  pendingRequests = 0,
  onOpenPolls,
  hasActivePoll = false,
  onOpenPK,
  isInPK = false,
  onOpenCoupons,
  hasActiveCoupon = false,
  isCameraOn = true,
  isMicOn = true,
  onToggleCamera,
  onToggleMic,
  isHost = false,
}) => {
  const [likeScale] = useState(new Animated.Value(1));
  const [showLikeCount, setShowLikeCount] = useState(false);

  const handleLike = () => {
    // Animate heart
    Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likeScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Show count
    setShowLikeCount(true);
    setTimeout(() => setShowLikeCount(false), 1000);

    onLike();
  };

  const ActionButton = ({
    icon,
    label,
    onPress,
    size = 44,
    color = "#fff",
    badge,
    badgeColor = "#EF4444",
    active = false,
    activeColor = "#10B981",
  }: any) => (
    <View style={styles.actionButtonContainer}>
      <TouchableOpacity
        style={[
          styles.actionButton,
          { width: size, height: size, borderRadius: size / 2 },
          active && { backgroundColor: activeColor, borderColor: activeColor },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {icon}
        {badge !== undefined && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </TouchableOpacity>
      {label && <Text style={styles.actionLabel}>{label}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Like Button */}
      <ActionButton
        icon={
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Heart size={22} color="#fff" fill="#fff" />
          </Animated.View>
        }
        label={totalLikes > 0 ? totalLikes.toLocaleString() : ""}
        onPress={handleLike}
        size={48}
      />

      {/* Chat Button */}
      <ActionButton
        icon={<MessageCircle size={22} color="#fff" />}
        onPress={onOpenChat}
        badge={unreadMessages}
        badgeColor="#3B82F6"
      />

      {/* Products Button */}
      <ActionButton
        icon={
          <View>
            <ShoppingBag size={22} color="#fff" />
            {productCount > 0 && (
              <View style={styles.smallBadge}>
                <Text style={styles.smallBadgeText}>{productCount}</Text>
              </View>
            )}
          </View>
        }
        onPress={onOpenProducts}
        active={hasPinnedProduct}
        activeColor="#F59E0B"
      />

      {/* Gift Button */}
      <ActionButton
        icon={<Gift size={22} color="#fff" style={{ transform: [{ rotate: "-15deg" }] }} />}
        onPress={onOpenGifts}
        label={userBalance > 0 ? userBalance.toLocaleString() : ""}
      />

      {/* Host-only Buttons */}
      {isHost && (
        <>
          {/* Co-host */}
          <ActionButton
            icon={
              <View>
                <Users size={22} color="#fff" />
                {pendingRequests > 0 && (
                  <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
                    <Text style={styles.badgeText}>{pendingRequests}</Text>
                  </View>
                )}
              </View>
            }
            onPress={onOpenCoHost}
            active={coHostCount > 0}
            activeColor="#10B981"
          />

          {/* Polls */}
          <ActionButton
            icon={<BarChart2 size={22} color="#fff" />}
            onPress={onOpenPolls}
            active={hasActivePoll}
            activeColor="#8B5CF6"
          />

          {/* PK Battle */}
          <ActionButton
            icon={
              <Swords
                size={22}
                color="#fff"
                style={isInPK ? { transform: [{ rotate: "15deg" }] } : {}}
              />
            }
            onPress={onOpenPK}
            active={isInPK}
            activeColor="#FFA500"
          />

          {/* Coupons */}
          <ActionButton
            icon={
              <View>
                <Ticket size={22} color="#fff" />
                {hasActiveCoupon && (
                  <View style={[styles.activeDot, { backgroundColor: "#22C55E" }]} />
                )}
              </View>
            }
            onPress={onOpenCoupons}
            active={hasActiveCoupon}
            activeColor="#22C55E"
          />

          {/* Divider */}
          <View style={styles.divider} />

          {/* Camera Toggle */}
          <ActionButton
            icon={isCameraOn ? <Camera size={22} color="#fff" /> : <CameraOff size={22} color="#fff" />}
            onPress={onToggleCamera}
            active={!isCameraOn}
            activeColor="#EF4444"
          />

          {/* Mic Toggle */}
          <ActionButton
            icon={isMicOn ? <Mic size={22} color="#fff" /> : <MicOff size={22} color="#fff" />}
            onPress={onToggleMic}
            active={!isMicOn}
            activeColor="#EF4444"
          />
        </>
      )}

      {/* Share (always last) */}
      <ActionButton
        icon={<Share2 size={22} color="#fff" />}
        onPress={onShare}
      />
    </View>
  );
};

// Gift Modal Component
interface GiftModalProps {
  visible: boolean;
  onClose: () => void;
  onSendGift: (gift: any) => void;
  userBalance: number;
  recipients: { userID: string; userName: string }[];
  selectedRecipient?: { userID: string; userName: string };
  onSelectRecipient: (user: { userID: string; userName: string }) => void;
  t?: (key: string) => string;
}

export const LiveGiftModal: React.FC<GiftModalProps> = ({
  visible,
  onClose,
  onSendGift,
  userBalance,
  recipients,
  selectedRecipient,
  onSelectRecipient,
  t,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<"POPULAIRE" | "SPÉCIAL" | "LUXE">("POPULAIRE");
  const [selectedGift, setSelectedGift] = useState<any>(null);

  const categories = ["POPULAIRE", "SPÉCIAL", "LUXE"];

  const giftCategories = {
    POPULAIRE: Object.values(ENHANCED_GIFTS).filter(g => g.points < 50),
    SPÉCIAL: Object.values(ENHANCED_GIFTS).filter(g => g.points >= 50 && g.points < 200),
    LUXE: Object.values(ENHANCED_GIFTS).filter(g => g.points >= 200),
  };

  const handleSend = () => {
    if (selectedGift && userBalance >= selectedGift.points) {
      onSendGift(selectedGift);
      setSelectedGift(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <BlurView intensity={95} tint="dark" style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t?.("sendGift") || "Send Gift"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Recipient Selection */}
          {recipients.length > 0 && (
            <View style={styles.recipientContainer}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={recipients}
                keyExtractor={(item) => item.userID}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.recipientItem,
                      selectedRecipient?.userID === item.userID && styles.recipientSelected,
                    ]}
                    onPress={() => onSelectRecipient(item)}
                  >
                    <View style={styles.recipientAvatar}>
                      <Text style={styles.recipientInitial}>
                        {item.userName?.charAt(0)?.toUpperCase() || "U"}
                      </Text>
                    </View>
                    <Text style={styles.recipientName} numberOfLines={1}>
                      {item.userName}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Categories */}
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  selectedCategory === cat && styles.categorySelected,
                ]}
                onPress={() => setSelectedCategory(cat as any)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextSelected,
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Gift Grid */}
          <FlatList
            data={giftCategories[selectedCategory]}
            numColumns={4}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.giftGrid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.giftItem,
                  selectedGift?.id === item.id && styles.giftSelected,
                ]}
                onPress={() => setSelectedGift(item)}
              >
                <View style={[styles.giftIcon, { backgroundColor: item.color + "20" }]}>
                  <Text style={{ fontSize: 24 }}>🎁</Text>
                </View>
                <Text style={styles.giftName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.giftPoints}>
                  <Coins size={10} color="#FFD700" />
                  <Text style={styles.giftPointsText}>{item.points}</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          {/* Bottom Bar */}
          <BlurView intensity={90} tint="dark" style={styles.bottomBar}>
            <View style={styles.balanceContainer}>
              <View style={styles.balanceBadge}>
                <Text style={styles.balanceText}>{userBalance.toLocaleString()}</Text>
                <Coins size={14} color="#F59E0B" />
              </View>
              <TouchableOpacity
                style={styles.rechargeButton}
                onPress={() => {
                  // Handle recharge
                }}
              >
                <PlusCircle size={16} color="#FF0066" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!selectedGift || userBalance < selectedGift?.points) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!selectedGift || userBalance < selectedGift?.points}
            >
              <Text style={styles.sendButtonText}>
                {t?.("send") || "SEND"}
              </Text>
              <Send size={18} color="#fff" />
            </TouchableOpacity>
          </BlurView>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 16,
  },
  actionButtonContainer: {
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  actionLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },
  smallBadge: {
    position: "absolute",
    bottom: -2,
    right: -6,
    backgroundColor: "#F59E0B",
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  smallBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "900",
  },
  activeDot: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  divider: {
    width: 30,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginVertical: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "rgba(18, 18, 24, 0.98)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: SCREEN_HEIGHT * 0.55,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  recipientContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  recipientItem: {
    alignItems: "center",
    marginRight: 16,
    opacity: 0.6,
  },
  recipientSelected: {
    opacity: 1,
  },
  recipientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  recipientSelected: {
    borderColor: "#FF0066",
  },
  recipientInitial: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  recipientName: {
    color: "#fff",
    fontSize: 10,
    marginTop: 4,
    maxWidth: 50,
  },
  categoryContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  categorySelected: {
    borderBottomColor: "#FF0066",
  },
  categoryText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "700",
  },
  categoryTextSelected: {
    color: "#fff",
  },
  giftGrid: {
    padding: 12,
  },
  giftItem: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    margin: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  giftSelected: {
    backgroundColor: "rgba(255, 0, 102, 0.15)",
    borderColor: "#FF0066",
  },
  giftIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  giftName: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  giftPoints: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 2,
  },
  giftPointsText: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "900",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  balanceText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  rechargeButton: {
    marginLeft: 10,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF0066",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
});

export default LiveActionButtons;