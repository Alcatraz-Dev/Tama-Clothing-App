/**
 * LiveRoomScreen - Modern Professional Live Streaming UI
 * Premium design with glass morphism and smooth animations
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  ScrollView,
  Animated,
  Image,
  FlatList,
  Pressable,
  Keyboard,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Image as ExpoImage } from "expo-image";
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Gift as GiftIcon,
  UserPlus,
  MoreHorizontal,
  PhoneOff,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  Settings,
  Send,
  ShoppingBag,
  Users,
  Star,
  Crown,
  Zap,
  Flame,
  DollarSign,
} from "lucide-react-native";
import { auth, db } from "../api/firebase";
import { doc, onSnapshot, updateDoc, addDoc, collection, serverTimestamp, increment } from "firebase/firestore";
import { MODERN_GIFTS, Gift } from "../config/gifts";
import { ModernGiftPanel } from "../components/ModernGiftPanel";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: number;
  isHost?: boolean;
  isAdmin?: boolean;
}

interface LiveRoomScreenProps {
  roomId: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  isHost: string;
  onClose?: () => void;
}

export const LiveRoomScreen: React.FC<LiveRoomScreenProps> = ({
  roomId,
  hostId,
  hostName,
  hostAvatar,
  isHost,
  onClose,
}) => {
  const currentUserId = auth?.currentUser?.uid || "demo_user";
  const currentUserName = auth?.currentUser?.displayName || "Guest";
  const currentUserAvatar = auth?.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUserName}&background=FF0066&color=fff`;

  const [viewerCount, setViewerCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [userCoins, setUserCoins] = useState(5000);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showChat, setShowChat] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const likeAnimRef = useRef(new Animated.Value(0)).current;
  const pulseAnimRef = useRef(new Animated.Value(1)).current;

  // Demo mode - simulate live data
  useEffect(() => {
    // Simulate viewer count
    const viewerInterval = setInterval(() => {
      setViewerCount((prev) => prev + Math.floor(Math.random() * 5));
    }, 5000);

    // Simulate messages
    const demoMessages: ChatMessage[] = [
      { id: "1", userId: "user1", userName: "Alice", userAvatar: "", message: "Amazing stream! 🔥", timestamp: Date.now() },
      { id: "2", userId: "user2", userName: "Bob", userAvatar: "", message: "Love this content", timestamp: Date.now() },
      { id: "3", userId: "user3", userName: "Charlie", userAvatar: "", message: "Hello from NYC!", timestamp: Date.now() },
    ];
    setMessages(demoMessages);

    return () => clearInterval(viewerInterval);
  }, []);

  // Like animation
  const triggerLikeAnimation = () => {
    setLikeCount((prev) => prev + 1);
    Animated.sequence([
      Animated.timing(likeAnimRef, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(likeAnimRef, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: currentUserId,
      userName: currentUserName,
      userAvatar: currentUserAvatar,
      message: inputMessage.trim(),
      timestamp: Date.now(),
      isHost: isHost === "true",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");

    // Save to Firestore (in production)
    try {
      await addDoc(collection(db, "live_rooms", roomId, "messages"), newMessage);
    } catch (e) {
      console.log("[Chat] Save error:", e);
    }
  };

  // Send gift
  const handleSendGift = async (gift: Gift, quantity: number) => {
    const totalCost = gift.price * quantity;
    if (userCoins < totalCost) {
      Alert.alert("Insufficient Coins", "Please recharge your wallet to send gifts.");
      return;
    }

    setUserCoins((prev) => prev - totalCost);

    // Save to Firestore (in production)
    try {
      await addDoc(collection(db, "live_rooms", roomId, "gifts"), {
        senderId: currentUserId,
        receiverId: hostId,
        giftId: gift.id,
        giftName: gift.name,
        quantity,
        totalValue: gift.points * quantity,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.log("[Gift] Send error:", e);
    }
  };

  // Toggle follow
  const toggleFollow = () => setIsFollowing(!isFollowing);

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Live Badge */}
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      {/* Host Info */}
      <View style={styles.hostInfo}>
        <ExpoImage
          source={{ uri: hostAvatar }}
          style={styles.hostAvatar}
          contentFit="cover"
          transition={200}
        />
        <View>
          <Text style={styles.hostName}>{hostName}</Text>
          <Text style={styles.hostFollowers}>{followers.toLocaleString()} followers</Text>
        </View>
      </View>

      {/* Follow Button */}
      <TouchableOpacity
        style={[styles.followButton, isFollowing && styles.followingButton]}
        onPress={toggleFollow}
      >
        <UserPlus size={14} color={isFollowing ? "#FF0066" : "#fff"} />
        <Text style={[styles.followText, isFollowing && styles.followingText]}>
          {isFollowing ? "Following" : "Follow"}
        </Text>
      </TouchableOpacity>

      {/* Viewer Count */}
      <View style={styles.viewerBadge}>
        <Users size={12} color="#fff" />
        <Text style={styles.viewerCount}>{viewerCount.toLocaleString()}</Text>
      </View>
    </View>
  );

  // Render side actions
  const renderSideActions = () => (
    <View style={styles.sideActions}>
      {/* Host Avatar with Level */}
      <View style={styles.hostAvatarContainer}>
        <ExpoImage
          source={{ uri: hostAvatar }}
          style={styles.hostAvatarLarge}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.hostLevelBadge}>
          <Crown size={10} color="#FFD700" fill="#FFD700" />
        </View>
        <View style={styles.liveRing} />
      </View>

      {/* Like Button */}
      <TouchableOpacity style={styles.actionButton} onPress={triggerLikeAnimation}>
        <Animated.View style={{ transform: [{ scale: likeAnimRef }] }}>
          <Heart size={28} color="#FF0066" fill="#FF0066" />
        </Animated.View>
        <Text style={styles.actionCount}>{likeCount.toLocaleString()}</Text>
      </TouchableOpacity>

      {/* Comment Button */}
      <TouchableOpacity style={styles.actionButton} onPress={() => setShowChat(!showChat)}>
        <MessageCircle size={26} color="#fff" />
      </TouchableOpacity>

      {/* Gift Button */}
      <TouchableOpacity style={styles.giftButton} onPress={() => setShowGiftPanel(true)}>
        <GiftIcon size={26} color="#FFD700" />
        <Text style={styles.actionCount}>Gift</Text>
      </TouchableOpacity>

      {/* Share Button */}
      <TouchableOpacity style={styles.actionButton}>
        <Share2 size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // Render chat messages
  const renderChat = () => (
    <View style={styles.chatContainer}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={styles.messageRow}>
            <Text style={styles.messageUser}>{msg.userName}:</Text>
            <Text style={styles.messageText}>{msg.message}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Chat Input */}
      {showChat && (
        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Say something..."
            placeholderTextColor="#666"
            value={inputMessage}
            onChangeText={setInputMessage}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Send size={20} color="#FF0066" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render bottom controls
  const renderBottomControls = () => (
    <View style={styles.bottomControls}>
      {/* Input Field */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Send a message..."
          placeholderTextColor="#888"
          value={inputMessage}
          onChangeText={setInputMessage}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.inputSendButton} onPress={sendMessage}>
          <Send size={18} color="#FF0066" />
        </TouchableOpacity>
      </View>

      {/* Action Icons */}
      <View style={styles.controlActions}>
        <TouchableOpacity style={styles.controlButton}>
          <ShoppingBag size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setIsMuted(!isMuted)}
        >
          {isMuted ? (
            <MicOff size={22} color="#FF0066" />
          ) : (
            <Mic size={22} color="#fff" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setIsSpeakerOn(!isSpeakerOn)}
        >
          {isSpeakerOn ? (
            <Volume2 size={22} color="#fff" />
          ) : (
            <VolumeX size={22} color="#FF0066" />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Settings size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render demo video placeholder
  const renderDemoVideo = () => (
    <View style={styles.videoContainer}>
      <BlurView intensity={60} tint="dark" style={styles.videoPlaceholder}>
        <View style={styles.demoVideoContent}>
          <ExpoImage
            source={{ uri: hostAvatar }}
            style={styles.demoAvatar}
            contentFit="cover"
            transition={200}
          />
          <Text style={styles.demoText}>📹 Camera Preview</Text>
          <Text style={styles.demoSubtext}>Live streaming in progress</Text>
          <Text style={styles.demoMode}>Demo Mode - Use physical device for camera</Text>
        </View>
      </BlurView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Video Area */}
      {renderDemoVideo()}

      {/* Header Overlay */}
      <View style={styles.headerOverlay}>{renderHeader()}</View>

      {/* Side Actions */}
      <View style={styles.sideActionsOverlay}>{renderSideActions()}</View>

      {/* Chat Area */}
      {showChat && <View style={styles.chatOverlay}>{renderChat()}</View>}

      {/* Bottom Controls */}
      <View style={styles.bottomOverlay}>{renderBottomControls()}</View>

      {/* Gift Panel */}
      <ModernGiftPanel
        visible={showGiftPanel}
        onClose={() => setShowGiftPanel(false)}
        onSendGift={handleSendGift}
        userCoins={userCoins}
        hostName={hostName}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  demoVideoContent: {
    alignItems: "center",
  },
  demoAvatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  demoText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  demoSubtext: {
    color: "#888",
    fontSize: 16,
    marginBottom: 16,
  },
  demoMode: {
    color: "#FF0066",
    fontSize: 12,
    backgroundColor: "rgba(255, 0, 102, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerOverlay: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 0, 102, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    marginRight: 6,
  },
  liveText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  hostInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#FF0066",
  },
  hostName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  hostFollowers: {
    color: "#888",
    fontSize: 11,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF0066",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FF0066",
  },
  followText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  followingText: {
    color: "#FF0066",
  },
  viewerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
    gap: 4,
  },
  viewerCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  sideActionsOverlay: {
    position: "absolute",
    right: 12,
    bottom: 180,
    alignItems: "center",
  },
  sideActions: {
    alignItems: "center",
  },
  hostAvatarContainer: {
    marginBottom: 20,
  },
  hostAvatarLarge: {
    width: 55,
    height: 55,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#FF0066",
  },
  hostLevelBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 3,
  },
  liveRing: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#FF0066",
    opacity: 0.5,
  },
  actionButton: {
    alignItems: "center",
    marginBottom: 16,
  },
  actionCount: {
    color: "#fff",
    fontSize: 11,
    marginTop: 4,
  },
  giftButton: {
    alignItems: "center",
    backgroundColor: "linear-gradient(135deg, #FFD700, #FFA500)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 25,
  },
  chatOverlay: {
    position: "absolute",
    left: 12,
    bottom: 100,
    width: SCREEN_WIDTH * 0.65,
    maxHeight: 250,
  },
  chatContainer: {
    flex: 1,
  },
  chatScroll: {
    maxHeight: 200,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 8,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  messageUser: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 6,
  },
  messageText: {
    color: "#fff",
    fontSize: 13,
    flex: 1,
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: "#fff",
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 8,
    padding: 8,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
  },
  bottomControls: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 25,
    paddingLeft: 16,
    paddingRight: 8,
    height: 44,
  },
  messageInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  inputSendButton: {
    padding: 8,
  },
  controlActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LiveRoomScreen;