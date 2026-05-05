/**
 * AgoraAudienceLiveScreen - Complete Live Shopping Audience Screen
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
  Eye,
  Clock,
  Send,
  Coins,
  PlusCircle,
  ChevronRight,
  Check,
} from "lucide-react-native";
import { AgoraLiveShoppingService, liveShoppingService, getAgoraComponents } from "../services/AgoraLiveShoppingService";
import { LiveSessionService } from "../services/LiveSessionService";
import { LIVE_UI_THEME, AGORA_CONFIG, ENHANCED_GIFTS } from "../config/stream";
import { ModernGiftPanel } from "../components/ModernGiftPanel";
import { db } from "../api/firebase";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, addDoc, serverTimestamp, increment } from "firebase/firestore";

// Agora components - loaded dynamically
let RtcSurfaceView: any = null;
let VideoCanvas: any = null;
let RenderModeType: any = null;
let VideoMirrorModeType: any = null;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = {
  channelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
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

export default function AgoraAudienceLiveScreen(props: Props) {
  const {
    channelId,
    userId,
    userName,
    userAvatar,
    hostId,
    hostName,
    hostAvatar,
    onClose,
    t,
    language = "fr",
  } = props;

  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [walletId, setWalletId] = useState<string>("");

  // Chat
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Products
  const [pinnedProduct, setPinnedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Gifts
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [recentGift, setRecentGift] = useState<any>(null);
  const [giftQueue, setGiftQueue] = useState<any[]>([]);
  const [showGiftAnimation, setShowGiftAnimation] = useState(false);
  const [giftAnimationUrl, setGiftAnimationUrl] = useState<string>("");
  const recentGiftRef = useRef<any>(null);

   // Floating hearts
   const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);

   // Video service
   const videoService = AgoraLiveShoppingService.getInstance();
   const durationInterval = useRef<NodeJS.Timeout | null>(null);

   // Agora Video State
   const [localUid, setLocalUid] = useState<number>(0);
   const [agoraComponentsLoaded, setAgoraComponentsLoaded] = useState(false);
   const [videoRenderError, setVideoRenderError] = useState<string | null>(null);
   const [remoteUsers, setRemoteUsers] = useState<{ uid: number; hasVideo: boolean }[]>([]);

   // Event handlers for remote users
   const handleUserJoined = useCallback((uid: number) => {
     console.log("[AgoraAudience] Remote user joined:", uid);
     setRemoteUsers(prev => {
       if (prev.some(u => u.uid === uid)) return prev;
       return [...prev, { uid, hasVideo: false }];
     });
   }, []);

   const handleUserLeft = useCallback((uid: number) => {
     console.log("[AgoraAudience] Remote user left:", uid);
     setRemoteUsers(prev => prev.filter(u => u.uid !== uid));
   }, []);

   const handleUserPublished = useCallback((uid: number, mediaType: string) => {
     if (mediaType === 'video') {
       setRemoteUsers(prev => prev.map(u => u.uid === uid ? { ...u, hasVideo: true } : u));
     }
   }, []);

   const handleUserUnpublished = useCallback((uid: number, mediaType: string) => {
     if (mediaType === 'video') {
       setRemoteUsers(prev => prev.map(u => u.uid === uid ? { ...u, hasVideo: false } : u));
     }
   }, []);

   // Initialize and join live
   useEffect(() => {
     joinLive();
     return () => {
       leaveLive();
     };
   }, []);

   const joinLive = async () => {
     try {
       console.log("[AgoraAudience] Initializing...");
       await videoService.initialize();
       console.log("[AgoraAudience] Service initialized");

       // Load Agora video components
       const {
         RtcSurfaceView: RtcSV,
         RenderModeType: RMT,
         VideoMirrorModeType: VMMT
       } = await getAgoraComponents();

       RtcSurfaceView = RtcSV;
       RenderModeType = RMT;
       VideoMirrorModeType = VMMT;

       console.log("[AgoraAudience] Agora components loaded:", !!RtcSurfaceView);
       setAgoraComponentsLoaded(!!RtcSurfaceView);

       // Set up event listeners for remote users (host)
       videoService.addListener('user-joined', handleUserJoined);
       videoService.addListener('user-left', handleUserLeft);
       videoService.addListener('user-published', handleUserPublished);
       videoService.addListener('user-unpublished', handleUserUnpublished);

       // Join the channel
       const uid = await videoService.joinChannel({
         channelId,
         userId,
         userName,
         userAvatar,
         role: "audience",
       });
       setLocalUid(uid);
       setIsLive(true);

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

       // Start duration timer
       durationInterval.current = setInterval(() => {
         setDuration((prev) => prev + 1);
       }, 1000);

       // Subscribe to session
       const unsubSession = liveShoppingService.subscribeToSession(channelId, (session) => {
         if (session) {
           setViewerCount(session.viewerCount || 0);
           setTotalLikes(session.totalLikes || 0);
           if (session.pinnedProduct) {
             // Load pinned product
           }
         }
       });

       // Subscribe to chat
       const chatRef = collection(db, "liveChats", channelId, "messages");
       const q = query(chatRef, orderBy("createdAt", "desc"), limit(50));

       const unsubChat = onSnapshot(q, (snapshot) => {
         const messages = snapshot.docs.map((doc) => ({
           id: doc.id,
           ...doc.data(),
         })) as ChatMessage[];
         setChatMessages(messages.reverse());
       });

       console.log("[AgoraAudience] Joined live!");
     } catch (e) {
       console.error("[AgoraAudience] Join error:", e);
       Alert.alert("Error", "Failed to join live stream");
     }
   };

   const leaveLive = async () => {
     try {
       // Remove event listeners
       videoService.removeListener('user-joined', handleUserJoined);
       videoService.removeListener('user-left', handleUserLeft);
       videoService.removeListener('user-published', handleUserPublished);
       videoService.removeListener('user-unpublished', handleUserUnpublished);

       await videoService.leaveChannel();
       if (durationInterval.current) {
         clearInterval(durationInterval.current);
       }
       liveShoppingService.unsubscribeAll();
     } catch (e) {
       console.error("[AgoraAudience] Leave error:", e);
     }
   };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const chatRef = collection(db, "liveChats", channelId, "messages");
    await addDoc(chatRef, {
      userId,
      userName,
      userAvatar,
      message: chatInput,
      type: "message",
      createdAt: serverTimestamp(),
    });

    setChatInput("");
  };

  const sendLike = () => {
    setTotalLikes((prev) => prev + 1);

    const id = Date.now();
    const x = Math.random() * 60 - 30;
    setFloatingHearts((prev) => [...prev.slice(-20), { id, x }]);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  };

  const isSameGift = (gift: any, senderId: string, senderName: string, giftName: string) => {
    return gift?.senderId === senderId && gift?.senderName === senderName && gift?.giftName === giftName;
  };

  const sendGift = async () => {
    if (!selectedGift) return;

    if (userBalance < selectedGift.points) {
      Alert.alert("Insufficient balance", "You need more coins to send this gift.");
      return;
    }

    // Calculate combo
    const current = recentGiftRef.current;
    let newCount = 1;
    if (isSameGift(current, userId, userName || "Viewer", selectedGift.name)) {
      newCount = (current?.count || 0) + 1;
    }

    // Show locally immediately
    setRecentGift({
      senderName: userName || "Viewer",
      senderId: userId,
      giftName: selectedGift.name,
      points: selectedGift.points,
      icon: selectedGift.icon,
      senderAvatar: userAvatar,
      combo: newCount,
      isBig: selectedGift.points >= 500,
    });
    recentGiftRef.current = {
      senderId: userId,
      senderName: userName || "Viewer",
      giftName: selectedGift.name,
      count: newCount,
    };

    // Show big gift animation
    if (selectedGift.points >= 500 && selectedGift.url) {
      setGiftAnimationUrl(selectedGift.url);
      setShowGiftAnimation(true);
      setTimeout(() => setShowGiftAnimation(false), 3000);
    }

    // Optimistic balance update
    setUserBalance((prev) => prev - selectedGift.points);

    // Firestore updates
    try {
      // Deduct coins from sender
      const senderRef = doc(db, "users", userId);
      const walletRef = walletId ? doc(db, "wallets", walletId) : null;

      if (walletRef) {
        await updateDoc(walletRef, {
          coins: increment(-selectedGift.points),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(senderRef, {
          wallet: {
            coins: increment(-selectedGift.points),
          },
        }, { merge: true });
      }

      // Add 70% of value to Host as diamonds
      if (hostId) {
        const earnings = Math.ceil(selectedGift.points * 0.7);
        const hostWalletId = await getOrCreateWallet(hostId, "customer");
        const hostWalletRef = doc(db, "wallets", hostWalletId);

        await updateDoc(hostWalletRef, {
          diamonds: increment(earnings),
          updatedAt: serverTimestamp(),
        });

        // Record Transaction for Host (Earnings)
        await addDoc(
          collection(db, "wallets", hostWalletId, "transactions"),
          {
            type: "gift_received",
            amountDiamonds: earnings,
            giftName: selectedGift.name,
            senderName: userName || "Viewer",
            senderId: userId,
            timestamp: serverTimestamp(),
            status: "completed",
          },
        );
      }

      // Record Transaction for Sender (Spending)
      await addDoc(collection(db, "users", userId, "transactions"), {
        type: "gift_sent",
        amountCoins: selectedGift.points,
        giftName: selectedGift.name,
        recipientName: hostName || "Host",
        timestamp: serverTimestamp(),
        status: "completed",
      });

      // Broadcast gift via Firestore
      await LiveSessionService.broadcastGift(channelId, {
        giftName: selectedGift.name,
        icon: selectedGift.icon,
        points: selectedGift.points,
        senderName: userName || "Viewer",
        senderId: userId,
        senderAvatar: userAvatar,
        targetName: hostName || "Host",
        combo: newCount,
      });

      // Update session stats
      LiveSessionService.incrementGifts(channelId, selectedGift.points || 1).catch((e) => console.error("Gift Score Error:", e));

    } catch (error) {
      console.error("Audience Gift Error:", error);
    }

    setShowGiftModal(false);
    setSelectedGift(null);
  };

  const getOrCreateWallet = async (userId: string, role: string): Promise<string> => {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists() && userDoc.data().walletId) {
      return userDoc.data().walletId;
    }
    const walletRef = await addDoc(collection(db, "wallets"), {
      userId,
      role,
      coins: 0,
      diamonds: 0,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "users", userId), { walletId: walletRef.id });
    return walletRef.id;
  };

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getLocalizedName = (name: any): string => {
    if (!name) return "";
    if (typeof name === "string") return name;
    const langKey = language === "ar" ? "ar-tn" : language;
    return name[langKey] || name.fr || name.en || name.ar || "";
  };

  return (
    <View style={styles.container}>
       {/* Video View */}
       <View style={styles.videoContainer}>
         {/* Video feed from host/co-hosts */}
         {agoraComponentsLoaded && RtcSurfaceView && remoteUsers.filter(u => u.hasVideo).length > 0 ? (
           remoteUsers
             .filter(user => user.hasVideo)
             .map((user) => (
               <RtcSurfaceView
                 key={user.uid}
                 style={styles.fullVideo}
                 canvas={{
                   uid: user.uid,
                   channelId: channelId,
                   renderMode: RenderModeType?.RenderModeHidden ?? 1,
                   mirrorMode: VideoMirrorModeType?.VideoMirrorModeDisabled ?? 2,
                 }}
               />
             ))
         ) : (
           <View style={styles.videoPlaceholder}>
             <Text style={styles.videoPlaceholderText}>Live Stream</Text>
             <Text style={styles.videoSubtext}>
               {agoraComponentsLoaded ? "Waiting for host..." : "Initializing..."}
             </Text>
           </View>
         )}

         {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>

          <View style={styles.hostInfo}>
            <Image
              source={{ uri: hostAvatar || `https://ui-avatars.com/api/?name=${hostName}&background=random` }}
              style={styles.hostAvatar}
            />
            <Text style={styles.hostName}>{hostName}</Text>
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

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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

      {/* Pinned Product Banner */}
      {pinnedProduct && (
        <TouchableOpacity
          style={styles.pinnedBanner}
          onPress={() => setSelectedProduct(pinnedProduct)}
          activeOpacity={0.9}
        >
          <BlurView intensity={90} tint="dark" style={styles.pinnedBannerContent}>
            <Image
              source={{ uri: pinnedProduct.images?.[0] }}
              style={styles.pinnedBannerImage}
            />
            <View style={styles.pinnedBannerInfo}>
              <Text style={styles.pinnedBannerName} numberOfLines={1}>
                {getLocalizedName(pinnedProduct.name)}
              </Text>
              <Text style={styles.pinnedBannerPrice}>
                {pinnedProduct.discountPrice || pinnedProduct.price} TND
              </Text>
            </View>
            <View style={styles.pinnedBannerButton}>
              <Text style={styles.pinnedBannerButtonText}>Buy</Text>
            </View>
          </BlurView>
        </TouchableOpacity>
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
                  {msg.type === "gift" ? (
                    <Text style={styles.chatGift}>
                      🎁 {msg.giftData?.giftName} ({msg.giftData?.points} coins)
                    </Text>
                  ) : (
                    <Text style={styles.chatText}>{msg.message}</Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Send message..."
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

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => setShowChat(!showChat)}
        >
          <MessageCircle size={20} color="#fff" />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.likeButton}
          onPress={sendLike}
          activeOpacity={0.8}
        >
          <Heart size={24} color="#fff" fill="#fff" />
          <Text style={styles.likeCount}>{totalLikes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.giftButton}
          onPress={() => setShowGiftModal(true)}
        >
          <Gift size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => {}}
        >
          <Share2 size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeActionButton}
          onPress={onClose}
        >
          <X size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modern Gift Panel - Premium TikTok Style */}
      <ModernGiftPanel
        visible={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        onSendGift={async (gift, qty) => {
          const totalCost = gift.price * qty;
          if (userBalance < totalCost) {
            Alert.alert("Insufficient Coins", "Please recharge your wallet");
            return;
          }
          try {
            setUserBalance((prev) => prev - totalCost);
            setSelectedGift(gift);
            await sendGift();
            setShowGiftModal(false);
          } catch (e) {
            console.error("Gift send error:", e);
          }
        }}
        userCoins={userBalance}
        hostName={hostName || "Host"}
      />

      {/* Product Detail Modal */}
      <Modal visible={!!selectedProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setSelectedProduct(null)}
          />
          <BlurView intensity={95} tint="dark" style={styles.productModalContent}>
            {selectedProduct && (
              <>
                <View style={styles.productModalHeader}>
                  <Text style={styles.productModalTitle}>Product Details</Text>
                  <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                    <X size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Image
                  source={{ uri: selectedProduct.images?.[0] }}
                  style={styles.productModalImage}
                />

                <Text style={styles.productModalName}>
                  {getLocalizedName(selectedProduct.name)}
                </Text>

                <View style={styles.productModalPriceRow}>
                  <Text style={styles.productModalPrice}>
                    {selectedProduct.discountPrice || selectedProduct.price} TND
                  </Text>
                  {selectedProduct.discountPrice && (
                    <Text style={styles.productModalOriginalPrice}>
                      {selectedProduct.price} TND
                    </Text>
                  )}
                </View>

                <TouchableOpacity style={styles.buyButton}>
                  <ShoppingBag size={18} color="#fff" />
                  <Text style={styles.buyButtonText}>Buy Now</Text>
                </TouchableOpacity>
              </>
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
    fontSize: 24,
    fontWeight: "900",
  },
  videoSubtext: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
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
    bottom: 200,
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

  // Pinned Banner
  pinnedBanner: {
    position: "absolute",
    bottom: 100,
    left: 12,
    right: 12,
    zIndex: 50,
  },
  pinnedBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(18, 18, 24, 0.9)",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.5)",
  },
  pinnedBannerImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  pinnedBannerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  pinnedBannerName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  pinnedBannerPrice: {
    color: "#F59E0B",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  pinnedBannerButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pinnedBannerButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  // Chat
  chatOverlay: {
    position: "absolute",
    left: 12,
    bottom: 180,
    width: SCREEN_WIDTH * 0.55,
    height: 180,
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
  chatGift: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "600",
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

  // Bottom Actions
  bottomActions: {
    position: "absolute",
    bottom: 40,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 8,
  },
  chatButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.8)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 6,
  },
  likeCount: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  giftButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
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
    maxHeight: SCREEN_HEIGHT * 0.65,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  balanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  balanceText: {
    color: "#F59E0B",
    fontSize: 18,
    fontWeight: "900",
  },
  rechargeButton: {
    padding: 8,
  },
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
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
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

  // Product Modal
  productModalContent: {
    backgroundColor: "rgba(18, 18, 24, 0.98)",
    padding: 20,
    paddingBottom: 40,
  },
  productModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  productModalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  productModalImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
  },
  productModalName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },
  productModalPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  productModalPrice: {
    color: "#F59E0B",
    fontSize: 28,
    fontWeight: "900",
  },
  productModalOriginalPrice: {
    color: "#666",
    fontSize: 18,
    textDecorationLine: "line-through",
  },
  buyButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 30,
    gap: 10,
  },
   buyButtonText: {
     color: "#fff",
     fontSize: 18,
     fontWeight: "900",
   },

   // Full-screen remote video
   fullVideo: {
     position: "absolute",
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: "#000",
   },
 });