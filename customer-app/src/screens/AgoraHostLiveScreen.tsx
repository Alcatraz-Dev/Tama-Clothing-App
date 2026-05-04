/**
 * AgoraHostLiveScreen - Complete Live Shopping Host Screen
 * Using react-native-agora for TikTok-style live streaming
 */
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { BlurView } from "expo-blur";
import {
  X,
  Heart,
  MessageCircle,
  Gift,
  Share2,
  ShoppingBag,
  Users,
  Camera,
  Mic,
  MicOff,
  CameraOff,
  MoreHorizontal,
  Send,
  Coins,
  PlusCircle,
  BarChart2,
  Ticket,
  Swords,
  Clock,
  Eye,
  Check,
  XCircle,
  Trash2,
  Settings,
} from "lucide-react-native";
import { AgoraLiveShoppingService, liveShoppingService, getAgoraComponents } from "../services/AgoraLiveShoppingService";
import { LiveSessionService } from "../services/LiveSessionService";
import { TikTokProductCarousel } from "../components/TikTokProductCarousel";
import { LIVE_UI_THEME, AGORA_CONFIG, LIVE_LAYOUT, ENHANCED_GIFTS, RTM_EVENTS } from "../config/stream";
import { db } from "../api/firebase";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, addDoc, serverTimestamp, increment } from "firebase/firestore";

// Agora components - loaded dynamically
let RtcSurfaceView: any = null;
let VideoCanvas: any = null;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = {
  channelId: string;
  userId: string;
  userName: string;
  hostName?: string;
  hostAvatar?: string;
  brandId?: string;
  onClose: () => void;
  t?: (key: string) => string;
  language?: "fr" | "ar" | "en";
};

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  type: "message" | "gift" | "system";
  createdAt: any;
  giftData?: { giftName: string; points: number; combo?: number };
}

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  images: string[];
}

export default function AgoraHostLiveScreen(props: Props) {
  const {
    channelId,
    userId,
    userName,
    hostAvatar,
    brandId,
    onClose,
    t,
    language = "fr",
  } = props;

  const [isLive, setIsLive] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [walletId, setWalletId] = useState<string>("");
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  // Agora Video State
  const [localUid, setLocalUid] = useState<number>(0);
  const [remoteUsers, setRemoteUsers] = useState<{ uid: number; hasVideo: boolean }[]>([]);
  const [agoraComponentsLoaded, setAgoraComponentsLoaded] = useState(false);

  // Chat
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [pinnedProduct, setPinnedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Gifts
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [recentGift, setRecentGift] = useState<any>(null);
  const [giftQueue, setGiftQueue] = useState<any[]>([]);
  const [showGiftAnimation, setShowGiftAnimation] = useState(false);
  const [giftAnimationUrl, setGiftAnimationUrl] = useState<string>("");
  const recentGiftRef = useRef<any>(null);

  // Polls
  const [showPollModal, setShowPollModal] = useState(false);
  const [activePoll, setActivePoll] = useState<{ question: string; options: { id: string; text: string; votes: number }[] } | null>(null);

  // Coupons
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; discount: number; type: string; endTime: number } | null>(null);

  // PK Battle
  const [showPKModal, setShowPKModal] = useState(false);
  const [isInPK, setIsInPK] = useState(false);
  const [pkScore, setPkScore] = useState({ host: 0, guest: 0 });

  // Floating hearts
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);

  // Video service
  const videoService = AgoraLiveShoppingService.getInstance();

  // Timer
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize
  useEffect(() => {
    initServices();
    return () => {
      cleanup();
    };
  }, []);

  const initServices = async () => {
    try {
      await videoService.initialize();
      console.log("[AgoraHost] Services initialized");

      // Load Agora UI components
      const agora = await getAgoraComponents();
      RtcSurfaceView = agora.RtcSurfaceView;
      setAgoraComponentsLoaded(!!RtcSurfaceView);
      
      // Load wallet balance
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.wallet?.coins !== undefined) {
          setUserBalance(userData.wallet.coins);
        }
        if (userData.walletId) {
          setWalletId(userData.walletId);
        }
      }
    } catch (e) {
      console.error("[AgoraHost] Init error:", e);
    }
  };

  const isSameGift = (gift: any, senderId: string, senderName: string, giftName: string) => {
    return gift?.senderId === senderId && gift?.senderName === senderName && gift?.giftName === giftName;
  };

  const sendGift = async (gift: any) => {
    if (!userId) return;

    // Check balance
    if (userBalance < gift.points) {
      Alert.alert(
        t?.("Insufficient Balance") || "Insufficient Balance",
        t?.("You need more coins to send this gift.") || "You need more coins to send this gift.",
      );
      return;
    }

    // Calculate combo
    const current = recentGiftRef.current;
    let newCount = 1;
    if (isSameGift(current, userId, userName || "Host", gift.name)) {
      newCount = (current?.count || 0) + 1;
    }

    // Show locally immediately
    setRecentGift({
      senderName: userName || "Host",
      senderId: userId,
      giftName: gift.name,
      points: gift.points,
      icon: gift.icon,
      senderAvatar: hostAvatar,
      isHost: true,
      combo: newCount,
      isBig: gift.points >= 500,
    });
    recentGiftRef.current = {
      senderId: userId,
      senderName: userName || "Host",
      giftName: gift.name,
      count: newCount,
    };

    // Show big gift animation
    if (gift.points >= 500 && gift.url) {
      setGiftAnimationUrl(gift.url);
      setShowGiftAnimation(true);
      setTimeout(() => setShowGiftAnimation(false), 3000);
    }

    // Optimistic balance update
    setUserBalance((prev) => prev - gift.points);

    // Firestore updates
    try {
      // Deduct coins from host
      const senderRef = doc(db, "users", userId);
      const walletRef = walletId ? doc(db, "wallets", walletId) : null;

      if (walletRef) {
        await updateDoc(walletRef, {
          coins: increment(-gift.points),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(senderRef, {
          wallet: {
            coins: increment(-gift.points),
          },
        }, { merge: true });
      }

      // Record transaction
      await addDoc(collection(db, "users", userId, "transactions"), {
        type: "gift_sent",
        amountCoins: gift.points,
        giftName: gift.name,
        recipientName: "the Room",
        timestamp: serverTimestamp(),
        status: "completed",
      });

      // Broadcast gift via Firestore
      await LiveSessionService.broadcastGift(channelId, {
        giftName: gift.name,
        icon: gift.icon,
        points: gift.points,
        senderName: userName || "Host",
        senderId: userId,
        senderAvatar: hostAvatar,
        targetName: "the Room",
        combo: newCount,
      });

      // Update session stats
      LiveSessionService.incrementGifts(channelId, gift.points || 1).catch((e) => console.error("Gift Score Error:", e));

    } catch (error) {
      console.error("Host Gift Error:", error);
    }
  };

  const startLive = async () => {
    try {
      const uid = await videoService.joinChannel({
        channelId,
        userId,
        userName,
        userAvatar: hostAvatar,
        role: "host",
      }, {
        onUserJoined: (user) => {
          console.log("[AgoraHost] User joined:", user.uid);
          setRemoteUsers(prev => [...prev, { uid: user.uid, hasVideo: user.hasVideo }]);
        },
        onUserLeft: (uid) => {
          console.log("[AgoraHost] User left:", uid);
          setRemoteUsers(prev => prev.filter(u => u.uid !== uid));
        },
        onUserPublished: (uid, mediaType) => {
          console.log("[AgoraHost] User published:", uid, mediaType);
          setRemoteUsers(prev => prev.map(u => u.uid === uid ? { ...u, hasVideo: mediaType === "video" } : u));
        },
      });
      setLocalUid(uid);
      setIsLive(true);

      // Start duration timer
      durationInterval.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Create Firestore session using LiveSessionService (same as old HostLiveScreen)
      await LiveSessionService.startSession(
        channelId,
        userName,
        brandId,
        hostAvatar,
        userId,
      );
      setSessionId(channelId);

      // Start heartbeat to keep session visible (every 30 seconds)
      heartbeatInterval.current = setInterval(() => {
        if (sessionId) {
          LiveSessionService.updateHeartbeat(channelId);
        }
      }, 30000);

      // Subscribe to chat
      subscribeToChat();

      // Subscribe to viewers
      subscribeToViewers();

      console.log("[AgoraHost] Live started!");
    } catch (e) {
      console.error("[AgoraHost] Start error:", e);
      Alert.alert("Error", "Failed to start live stream");
    }
  };

  const endLive = async () => {
    try {
      await videoService.leaveChannel();
      
      // Try to end session gracefully - don't fail if session doesn't exist
      if (sessionId) {
        try {
          const sessionRef = doc(db, "liveSessions", sessionId);
          const sessionSnap = await getDoc(sessionRef);
          if (sessionSnap.exists()) {
            await LiveSessionService.endSession(sessionId);
          } else {
            console.log("[AgoraHost] Session not found, skipping endSession");
          }
        } catch (sessionError) {
          console.log("[AgoraHost] Session end warning:", sessionError);
        }
      }
      
      setIsLive(false);
      setSessionId("");

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }

      console.log("[AgoraHost] Live ended");
      onClose();
    } catch (e) {
      console.error("[AgoraHost] End error:", e);
      onClose(); // Still close even if there's an error
    }
  };

  const subscribeToChat = () => {
    const chatRef = collection(db, "liveChats", channelId, "messages");
    const q = query(chatRef, orderBy("createdAt", "desc"), limit(50));

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];
      setChatMessages(messages.reverse());
    });
  };

  const subscribeToViewers = () => {
    if (!sessionId) return () => {};
    return liveShoppingService.subscribeToSession(sessionId, (session) => {
      if (session) {
        setViewerCount(session.viewerCount || 0);
        setTotalLikes(session.totalLikes || 0);
      }
    });
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const chatRef = collection(db, "liveChats", channelId, "messages");
    await addDoc(chatRef, {
      userId,
      userName,
      userAvatar: hostAvatar,
      message: chatInput,
      type: "message",
      createdAt: serverTimestamp(),
    });

    setChatInput("");
  };

  const sendLike = () => {
    // Send like via Firestore
    if (sessionId) {
      liveShoppingService.sendLike(sessionId, 1);
    }

    // Add floating heart
    const id = Date.now();
    const x = Math.random() * 60 - 30;
    setFloatingHearts((prev) => [...prev.slice(-20), { id, x }]);
    setTotalLikes((prev) => prev + 1);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  };

  const toggleCamera = async () => {
    const newState = await videoService.toggleCamera();
    setIsCameraOn(newState);
  };

  const toggleMic = async () => {
    const newState = await videoService.toggleMic();
    setIsMicOn(newState);
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getLocalizedName = (name: any): string => {
    if (!name) return "";
    if (typeof name === "string") return name;
    const langKey = language === "ar" ? "ar-tn" : language;
    return name[langKey] || name.fr || name.en || name.ar || "";
  };

  const cleanup = async () => {
    if (isLive) {
      await videoService.leaveChannel();
      if (sessionId) {
        await liveShoppingService.endSession(sessionId);
      }
    }
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
    liveShoppingService.unsubscribeAll();
  };

  // Render
  if (!isLive) {
    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewContent}>
          <Text style={styles.previewTitle}>
            {t?.("startLive") || "Start Live Shopping"}
          </Text>
          <Text style={styles.previewSubtitle}>
            {t?.("previewSubtitle") || "Ready to go live!"}
          </Text>

          <View style={styles.previewSettings}>
            <View style={styles.settingRow}>
              <Camera size={20} color="#fff" />
              <Text style={styles.settingText}>Camera</Text>
              <View style={styles.settingStatus}>
                <Text style={styles.settingStatusOn}>Ready</Text>
              </View>
            </View>
            <View style={styles.settingRow}>
              <Mic size={20} color="#fff" />
              <Text style={styles.settingText}>Microphone</Text>
              <View style={styles.settingStatus}>
                <Text style={styles.settingStatusOn}>Ready</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={startLive}
            activeOpacity={0.8}
          >
            <View style={styles.startButtonInner}>
              <Camera size={24} color="#fff" />
              <Text style={styles.startButtonText}>
                {t?.("goLive") || "GO LIVE"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>
              {t?.("cancel") || "Cancel"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Agora Video Container */}
      <View style={styles.videoContainer}>
        {/* Local Video (Host) - Only show when Agora components are loaded */}
        {agoraComponentsLoaded && localUid > 0 && RtcSurfaceView && isCameraOn ? (
          <RtcSurfaceView
            style={styles.localVideo}
            uid={localUid}
            channelId={channelId}
            renderMode={1} // VideoRenderMode.FIT
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            {isCameraOn ? (
              <View>
                <Text style={styles.videoPlaceholderText}>Camera Active</Text>
                <Text style={styles.videoSubtext}>
                  {agoraComponentsLoaded ? "Live streaming..." : "Initializing..."}
                </Text>
              </View>
            ) : (
              <View style={styles.cameraOffContainer}>
                <Image
                  source={{ uri: hostAvatar || `https://ui-avatars.com/api/?name=${userName}&background=random` }}
                  style={styles.cameraOffAvatar}
                />
                <Text style={styles.cameraOffText}>{userName}</Text>
              </View>
            )}
          </View>
        )}

        {/* Remote Users Video Grid */}
        {remoteUsers.map((user) => (
          agoraComponentsLoaded && RtcSurfaceView ? (
            <RtcSurfaceView
              key={user.uid}
              style={styles.remoteVideo}
              uid={user.uid}
              channelId={channelId}
              renderMode={1}
            />
          ) : null
        ))}

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>

          <View style={styles.hostInfo}>
            <Image
              source={{ uri: hostAvatar || `https://ui-avatars.com/api/?name=${userName}&background=random` }}
              style={styles.hostAvatar}
            />
            <Text style={styles.hostName}>{userName}</Text>
          </View>

          <View style={styles.viewerInfo}>
            <View style={styles.viewerBadge}>
              <Eye size={12} color="#fff" />
              <Text style={styles.viewerCount}>{viewerCount}</Text>
            </View>
            <View style={styles.durationBadge}>
              <Clock size={10} color="#fff" />
              <Text style={styles.durationText}>{formatDuration(duration)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={endLive}>
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Floating Hearts */}
        {floatingHearts.map((heart) => (
          <Animatable.View
            key={heart.id}
            animation="fadeInUp"
            duration={2000}
            style={[styles.floatingHeart, { left: SCREEN_WIDTH / 2 + heart.x }]}
          >
            <Text style={styles.heartEmoji}>❤️</Text>
          </Animatable.View>
        ))}

        {/* Gift Pill */}
        {recentGift && !recentGift.isBig && (
          <Animatable.View 
            animation="slideInLeft" 
            duration={400}
            style={styles.giftPillContainer}
          >
            <View style={styles.giftPill}>
              <Image
                source={{ uri: recentGift.senderAvatar || `https://ui-avatars.com/api/?name=${recentGift.senderName}&background=random` }}
                style={styles.giftPillAvatar}
              />
              <View style={styles.giftPillInfo}>
                <Text style={styles.giftPillName}>{recentGift.senderName}</Text>
                <Text style={styles.giftPillText}>
                  🎁 {recentGift.giftName}
                  {recentGift.combo > 1 && (
                    <Text style={styles.giftPillCombo}> x{recentGift.combo}</Text>
                  )}
                </Text>
              </View>
              <View style={styles.giftPillPoints}>
                <Coins size={10} color="#FFD700" />
                <Text style={styles.giftPillPointsText}>{recentGift.points}</Text>
              </View>
            </View>
          </Animatable.View>
        )}
      </View>

      {/* Pinned Product */}
      {pinnedProduct && (
        <Animatable.View
          animation="slideInLeft"
          style={styles.pinnedProduct}
        >
          <BlurView intensity={90} tint="dark" style={styles.pinnedProductContent}>
            <Image
              source={{ uri: pinnedProduct.images?.[0] }}
              style={styles.pinnedProductImage}
            />
            <View style={styles.pinnedProductInfo}>
              <Text style={styles.pinnedProductName} numberOfLines={1}>
                {getLocalizedName(pinnedProduct.name)}
              </Text>
              <Text style={styles.pinnedProductPrice}>
                {pinnedProduct.discountPrice || pinnedProduct.price} TND
              </Text>
            </View>
            <TouchableOpacity
              style={styles.pinnedProductClose}
              onPress={() => setPinnedProduct(null)}
            >
              <X size={14} color="#fff" />
            </TouchableOpacity>
          </BlurView>
        </Animatable.View>
      )}

      {/* TikTok Product Carousel */}
      {selectedProductIds.length > 0 && (
        <TikTokProductCarousel
          products={products}
          pinnedProductIds={pinnedProduct ? [pinnedProduct.id] : []}
          selectedProductIds={selectedProductIds}
          onProductPress={(id) => {
            const product = products.find(p => p.id === id);
            if (product) {
              setPinnedProduct(product);
              if (sessionId) {
                liveShoppingService.pinProduct(sessionId, id, 5);
              }
            }
          }}
          onPinProduct={(id) => {
            const product = products.find(p => p.id === id);
            if (product) {
              setPinnedProduct(product);
              if (sessionId) {
                liveShoppingService.pinProduct(sessionId, id, 5);
              }
            }
          }}
          getLocalizedName={getLocalizedName}
        />
      )}

      {/* Chat Overlay */}
      {showChat && (
        <View style={styles.chatOverlay}>
          <ScrollView style={styles.chatList} showsVerticalScrollIndicator={false}>
            {chatMessages.map((msg) => (
              <View key={msg.id} style={styles.chatMessage}>
                <Image
                  source={{ uri: msg.userAvatar || `https://ui-avatars.com/api/?name=${msg.userName}&background=random` }}
                  style={styles.chatAvatar}
                />
                <View style={styles.chatContent}>
                  <Text style={styles.chatUserName}>{msg.userName}</Text>
                  <Text style={styles.chatText}>{msg.message}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder={t?.("sendMessage") || "Send message..."}
              placeholderTextColor="#888"
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity style={styles.chatSendButton} onPress={sendMessage}>
              <Send size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {/* Main Actions Row - Top */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={sendLike}>
            <Heart size={24} color="#fff" fill="#fff" />
            <Text style={styles.actionCount}>{totalLikes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShowChat(!showChat)}>
            <MessageCircle size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShowProductModal(true)}>
            <ShoppingBag size={24} color="#fff" />
            {products.length > 0 && (
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>{products.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShowGiftModal(true)}>
            <Gift size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Engagement Tools Row - Middle */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionButton, isInPK && styles.actionButtonActive]} onPress={() => setShowPKModal(true)}>
            <Swords size={24} color={isInPK ? "#FFA500" : "#fff"} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, activePoll && styles.actionButtonActive]} onPress={() => setShowPollModal(true)}>
            <BarChart2 size={24} color={activePoll ? "#8B5CF6" : "#fff"} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, activeCoupon && styles.actionButtonActive]} onPress={() => setShowCouponModal(true)}>
            <Ticket size={24} color={activeCoupon ? "#22C55E" : "#fff"} />
          </TouchableOpacity>
        </View>

        {/* Device Controls Row - Bottom */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={toggleCamera}>
            {isCameraOn ? <Camera size={24} color="#fff" /> : <CameraOff size={24} color="#EF4444" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={toggleMic}>
            {isMicOn ? <Mic size={24} color="#fff" /> : <MicOff size={24} color="#EF4444" />}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.closeButton]} onPress={onClose}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Product Selection Modal */}
      <Modal visible={showProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setShowProductModal(false)}
          />
          <BlurView intensity={90} tint="dark" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t?.("selectProduct") || "Select Product"}
              </Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {products.length === 0 ? (
              <View style={styles.emptyState}>
                <ShoppingBag size={40} color="#666" />
                <Text style={styles.emptyStateText}>
                  {t?.("noProducts") || "No products available"}
                </Text>
              </View>
            ) : (
              <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.productGrid}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.productItem}
                    onPress={() => {
                      setPinnedProduct(item);
                      if (!selectedProductIds.includes(item.id)) {
                        setSelectedProductIds([...selectedProductIds, item.id]);
                      }
                      setShowProductModal(false);
                      if (sessionId) {
                        liveShoppingService.pinProduct(sessionId, item.id, 5);
                      }
                    }}
                  >
                    <Image
                      source={{ uri: item.images?.[0] }}
                      style={styles.productImage}
                    />
                    <Text style={styles.productName} numberOfLines={1}>
                      {getLocalizedName(item.name)}
                    </Text>
                    <Text style={styles.productPrice}>
                      {item.discountPrice || item.price} TND
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </BlurView>
        </View>
      </Modal>

      {/* Gift Modal */}
      <Modal visible={showGiftModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setShowGiftModal(false)}
          />
          <BlurView intensity={90} tint="dark" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t?.("sendGift") || "Send Gift"}
              </Text>
              <TouchableOpacity onPress={() => setShowGiftModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={Object.values(ENHANCED_GIFTS)}
              keyExtractor={(item) => item.id}
              numColumns={4}
              contentContainerStyle={styles.giftGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.giftItem,
                    selectedGift?.id === item.id && styles.giftItemSelected,
                  ]}
                  onPress={() => setSelectedGift(item)}
                >
                  <View style={[styles.giftIcon, { backgroundColor: item.color + "30" }]}>
                    <Text style={{ fontSize: 24 }}>🎁</Text>
                  </View>
                  <Text style={styles.giftName}>{item.name}</Text>
                  <View style={styles.giftPointsContainer}>
                    <Coins size={10} color="#FFD700" />
                    <Text style={styles.giftPoints}>{item.points}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            <View style={styles.giftBottomBar}>
              <View style={styles.giftBalanceContainer}>
                <Coins size={14} color="#FFD700" />
                <Text style={styles.giftBalanceText}>{userBalance}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.sendGiftButton,
                  !selectedGift && styles.sendGiftButtonDisabled,
                ]}
                onPress={() => {
                  if (selectedGift) {
                    sendGift(selectedGift);
                    setShowGiftModal(false);
                    setSelectedGift(null);
                  }
                }}
                disabled={!selectedGift}
              >
                <Text style={styles.sendGiftButtonText}>
                  {t?.("send") || "SEND"}
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Poll Modal */}
      <Modal visible={showPollModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowPollModal(false)} />
          <BlurView intensity={90} tint="dark" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t?.("createPoll") || "Create Poll"}</Text>
              <TouchableOpacity onPress={() => setShowPollModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {activePoll ? (
              <View style={styles.activePollContainer}>
                <Text style={styles.pollQuestion}>{activePoll.question}</Text>
                {activePoll.options.map((opt) => (
                  <View key={opt.id} style={styles.pollOptionResult}>
                    <Text style={styles.pollOptionText}>{opt.text}</Text>
                    <Text style={styles.pollVotes}>{opt.votes} votes</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.endPollButton}
                  onPress={() => setActivePoll(null)}
                >
                  <Text style={styles.endPollButtonText}>End Poll</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.createPollForm}>
                <TextInput
                  style={styles.pollQuestionInput}
                  placeholder="Enter your question..."
                  placeholderTextColor="#888"
                  onChangeText={(text) => {}}
                />
                {["Option 1", "Option 2", "Option 3"].map((opt, i) => (
                  <TextInput
                    key={i}
                    style={styles.pollOptionInput}
                    placeholder={opt}
                    placeholderTextColor="#666"
                  />
                ))}
                <TouchableOpacity
                  style={styles.createPollButton}
                  onPress={() => {
                    setActivePoll({
                      question: "What's your favorite?",
                      options: [
                        { id: "1", text: "Option A", votes: 0 },
                        { id: "2", text: "Option B", votes: 0 },
                        { id: "3", text: "Option C", votes: 0 },
                      ],
                    });
                    setShowPollModal(false);
                  }}
                >
                  <Text style={styles.createPollButtonText}>Create Poll</Text>
                </TouchableOpacity>
              </View>
            )}
          </BlurView>
        </View>
      </Modal>

      {/* Coupon Modal */}
      <Modal visible={showCouponModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCouponModal(false)} />
          <BlurView intensity={90} tint="dark" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t?.("dropCoupon") || "Drop Coupon"}</Text>
              <TouchableOpacity onPress={() => setShowCouponModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {activeCoupon ? (
              <View style={styles.activeCouponContainer}>
                <View style={styles.couponCard}>
                  <Text style={styles.couponCode}>{activeCoupon.code}</Text>
                  <Text style={styles.couponDiscount}>
                    {activeCoupon.type === "percentage" ? `${activeCoupon.discount}% OFF` : `${activeCoupon.discount} TND OFF`}
                  </Text>
                  <Text style={styles.couponActive}>ACTIVE</Text>
                </View>
                <TouchableOpacity
                  style={styles.deactivateCouponButton}
                  onPress={() => setActiveCoupon(null)}
                >
                  <Text style={styles.deactivateCouponButtonText}>Deactivate</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.createCouponForm}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Coupon Code (e.g., SAVE20)"
                  placeholderTextColor="#888"
                />
                <View style={styles.discountTypeRow}>
                  <TouchableOpacity style={[styles.discountTypeButton, styles.discountTypeSelected]}>
                    <Text style={styles.discountTypeText}>Percentage</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.discountTypeButton}>
                    <Text style={styles.discountTypeText}>Fixed Amount</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Discount (e.g., 20)"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.dropCouponButton}
                  onPress={() => {
                    setActiveCoupon({
                      code: "SAVE20",
                      discount: 20,
                      type: "percentage",
                      endTime: Date.now() + 300000,
                    });
                    setShowCouponModal(false);
                  }}
                >
                  <Text style={styles.dropCouponButtonText}>Drop Coupon</Text>
                </TouchableOpacity>
              </View>
            )}
          </BlurView>
        </View>
      </Modal>

      {/* PK Battle Modal */}
      <Modal visible={showPKModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowPKModal(false)} />
          <BlurView intensity={90} tint="dark" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t?.("pkBattle") || "PK Battle"}</Text>
              <TouchableOpacity onPress={() => setShowPKModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {isInPK ? (
              <View style={styles.pkBattleActive}>
                <View style={styles.pkVSContainer}>
                  <View style={styles.pkScoreSide}>
                    <Text style={styles.pkScoreLabel}>You</Text>
                    <Text style={styles.pkScoreValue}>{pkScore.host}</Text>
                  </View>
                  <View style={styles.pkVSText}>
                    <Text style={styles.pkVSTextInner}>VS</Text>
                  </View>
                  <View style={styles.pkScoreSide}>
                    <Text style={styles.pkScoreLabel}>Opponent</Text>
                    <Text style={styles.pkScoreValue}>{pkScore.guest}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.endPKButton}
                  onPress={() => setIsInPK(false)}
                >
                  <Text style={styles.endPKButtonText}>End Battle</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.startPKForm}>
                <View style={styles.pkDurationRow}>
                  {[3, 5, 10, 15].map((min) => (
                    <TouchableOpacity key={min} style={styles.durationButton}>
                      <Text style={styles.durationButtonText}>{min}m</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.startPKButton}
                  onPress={() => {
                    setIsInPK(true);
                    setPkScore({ host: 0, guest: 0 });
                    setShowPKModal(false);
                  }}
                >
                  <Swords size={20} color="#fff" />
                  <Text style={styles.startPKButtonText}>Start PK Battle</Text>
                </TouchableOpacity>
              </View>
            )}
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "#121218",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  previewContent: {
    width: "100%",
    alignItems: "center",
  },
  previewTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  previewSubtitle: {
    color: "#888",
    fontSize: 16,
    marginBottom: 30,
  },
  previewSettings: {
    width: "100%",
    marginBottom: 30,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    marginBottom: 10,
  },
  settingText: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
    marginLeft: 15,
  },
  settingStatus: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  settingStatusOn: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "700",
  },
  startButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginBottom: 20,
  },
  startButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  cancelButton: {
    padding: 15,
  },
  cancelButtonText: {
    color: "#888",
    fontSize: 16,
  },

  // Live screen styles
  videoContainer: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlaceholderText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  videoSubtext: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
  },
  localVideo: {
    flex: 1,
    backgroundColor: "#000",
  },
  remoteVideo: {
    position: "absolute",
    top: 100,
    right: 10,
    width: 100,
    height: 140,
    borderRadius: 8,
    overflow: "hidden",
  },
  cameraOffContainer: {
    alignItems: "center",
  },
  cameraOffAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#fff",
  },
  cameraOffText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  // Top Bar
  topBar: {
    position: "absolute",
    top: 50,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 100,
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
  },
  hostInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
    gap: 8,
  },
  hostAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  hostName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  viewerInfo: {
    flexDirection: "row",
    gap: 8,
    marginLeft: "auto",
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
    marginLeft: 8,
  },

  // Floating Hearts
  floatingHeart: {
    position: "absolute",
    bottom: 100,
  },
  heartEmoji: {
    fontSize: 30,
  },

  // Gift Pill
  giftPillContainer: {
    position: "absolute",
    top: 180,
    left: 10,
    zIndex: 10000,
  },
  giftPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 25,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  giftPillAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FF0066",
  },
  giftPillInfo: {
    marginLeft: 8,
  },
  giftPillName: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  giftPillText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "700",
  },
  giftPillCombo: {
    color: "#FF0066",
  },
  giftPillPoints: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  giftPillPointsText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 2,
  },

  // Pinned Product
  pinnedProduct: {
    position: "absolute",
    bottom: 180,
    left: 12,
    zIndex: 50,
  },
  pinnedProductContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(18, 18, 24, 0.9)",
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  pinnedProductImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  pinnedProductInfo: {
    marginLeft: 10,
    flex: 1,
  },
  pinnedProductName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  pinnedProductPrice: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "900",
  },
  pinnedProductClose: {
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

  // Chat Overlay
  chatOverlay: {
    position: "absolute",
    left: 12,
    bottom: 140,
    width: SCREEN_WIDTH * 0.55,
    height: 200,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
    padding: 10,
  },
  chatList: {
    flex: 1,
  },
  chatMessage: {
    flexDirection: "row",
    marginBottom: 8,
  },
  chatAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  chatContent: {
    flex: 1,
  },
  chatUserName: {
    color: "#F59E0B",
    fontSize: 12,
    fontWeight: "700",
  },
  chatText: {
    color: "#fff",
    fontSize: 13,
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 8,
  },
  chatInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingVertical: 8,
  },
  chatSendButton: {
    padding: 8,
  },

  // Action Buttons
  actionButtons: {
    position: "absolute",
    right: 12,
    bottom: 100,
    alignItems: "center",
    gap: 16,
  },
  actionRow: {
    flexDirection: "column",
    gap: 16,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  actionButtonActive: {
    backgroundColor: "rgba(16, 185, 129, 0.5)",
    borderColor: "#10B981",
  },
  actionCount: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  actionBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#F59E0B",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "rgba(18, 18, 24, 0.98)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  // Products
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    color: "#666",
    fontSize: 14,
    marginTop: 10,
  },
  productGrid: {
    padding: 10,
  },
  productItem: {
    flex: 1,
    margin: 6,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    alignItems: "center",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginBottom: 8,
  },
  productName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  productPrice: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },

  // Gifts
  giftGrid: {
    padding: 10,
  },
  giftItem: {
    flex: 1,
    margin: 6,
    padding: 8,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  giftItemSelected: {
    backgroundColor: "rgba(255, 0, 102, 0.2)",
    borderWidth: 1,
    borderColor: "#FF0066",
  },
  giftIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  giftName: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  giftPointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  giftPoints: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 2,
  },
  giftBottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  giftBalanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  giftBalanceText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  sendGiftButton: {
    backgroundColor: "#FF0066",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  sendGiftButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  sendGiftButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },

  // Poll Styles
  activePollContainer: {
    padding: 10,
  },
  pollQuestion: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },
  pollOptionResult: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  pollOptionText: {
    color: "#fff",
    fontSize: 14,
  },
  pollVotes: {
    color: "#8B5CF6",
    fontSize: 14,
    fontWeight: "700",
  },
  endPollButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  endPollButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  createPollForm: {
    padding: 10,
  },
  pollQuestionInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  pollOptionInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  createPollButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  createPollButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  // Coupon Styles
  activeCouponContainer: {
    alignItems: "center",
    padding: 20,
  },
  couponCard: {
    backgroundColor: "#F59E0B",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    width: "100%",
  },
  couponCode: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
  },
  couponDiscount: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
  },
  couponActive: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 10,
    opacity: 0.8,
  },
  deactivateCouponButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  deactivateCouponButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  createCouponForm: {
    padding: 10,
  },
  couponInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  discountTypeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  discountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  discountTypeSelected: {
    backgroundColor: "#F59E0B",
  },
  discountTypeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  dropCouponButton: {
    backgroundColor: "#22C55E",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  dropCouponButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  // PK Battle Styles
  pkBattleActive: {
    padding: 20,
    alignItems: "center",
  },
  pkVSContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 30,
  },
  pkScoreSide: {
    alignItems: "center",
  },
  pkScoreLabel: {
    color: "#888",
    fontSize: 14,
  },
  pkScoreValue: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "900",
  },
  pkVSText: {
    backgroundColor: "#F59E0B",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  pkVSTextInner: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    fontStyle: "italic",
  },
  endPKButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  endPKButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  startPKForm: {
    padding: 20,
  },
  pkDurationRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  durationButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  durationButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  startPKButton: {
    backgroundColor: "#FFA500",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
  },
  startPKButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});