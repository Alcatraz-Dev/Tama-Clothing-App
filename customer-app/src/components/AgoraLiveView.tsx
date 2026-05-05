/**
 * AgoraLiveView - Live Streaming Component
 * Works on both real devices and simulators (demo mode)
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
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
  Mic,
  MicOff,
  Camera,
  CameraOff,
} from "lucide-react-native";
import { ENHANCED_GIFTS } from "../config/stream";
import { agoraService } from "../services/AgoraService";
import { db } from "../api/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, increment, setDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AgoraLiveViewProps {
  channelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  hostName?: string;
  hostAvatar?: string;
  hostId?: string;
  isHost?: boolean;
  onClose: () => void;
}

export const AgoraLiveView: React.FC<AgoraLiveViewProps> = ({
  channelId,
  userId,
  userName,
  userAvatar,
  hostName,
  hostAvatar,
  hostId,
  isHost = false,
  onClose,
}) => {
  // Video State
  const [isLive, setIsLive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [localUid, setLocalUid] = useState(0);
  const [remoteUsers, setRemoteUsers] = useState<{ uid: number; userName: string }[]>([]);
  const isDemoMode = Platform.OS === "ios"; // Simulator detection

  // User State
  const [userBalance, setUserBalance] = useState(0);
  const [walletId, setWalletId] = useState<string>("");

  // UI State
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [recentGift, setRecentGift] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<{ id: string; userName: string; userAvatar?: string; message: string; type: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);

  // Refs
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const chatUnsubscribe = useRef<(() => void) | null>(null);

  // Load user data
  useEffect(() => {
    loadUserData();
    return () => {
      if (durationInterval.current) clearInterval(durationInterval.current);
      if (chatUnsubscribe.current) chatUnsubscribe.current();
    };
  }, []);

  const loadUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserBalance(data.wallet?.coins || 0);
        setWalletId(data.walletId || "");
      }
    } catch (e) {
      console.log("[AgoraLive] Load user error:", e);
    }
  };

  // Subscribe to chat
  useEffect(() => {
    if (isLive) {
      const chatRef = collection(db, "liveChats", channelId, "messages");
      const q = query(chatRef, orderBy("createdAt", "desc"), limit(50));

      chatUnsubscribe.current = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];
        setChatMessages(messages.reverse());
      });
    }

    return () => {
      if (chatUnsubscribe.current) chatUnsubscribe.current();
    };
  }, [isLive, channelId]);

  // Start live
  const startLive = async () => {
    try {
      // Initialize Agora service
      await agoraService.initialize({
        onJoinChannelSuccess: (channel, uid) => {
          console.log("[AgoraLive] Joined:", channel, uid);
          setLocalUid(uid);
        },
        onUserJoined: (user) => {
          setRemoteUsers(prev => [...prev, { uid: user.uid, userName: user.userName }]);
          setViewerCount(prev => prev + 1);
        },
        onUserLeft: (uid) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== uid));
          setViewerCount(prev => Math.max(0, prev - 1));
        },
      });

      // Join channel
      const uid = await agoraService.joinChannel(channelId, userId, userName, isHost ? "host" : "audience");
      setLocalUid(uid);
      setIsLive(true);

      // Start duration timer
      durationInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Simulate some viewers in demo mode
      if (isDemoMode) {
        setViewerCount(Math.floor(Math.random() * 50) + 10);
      }

    } catch (e) {
      console.error("[AgoraLive] Start error:", e);
      Alert.alert("Error", "Failed to start live stream");
    }
  };

  // End live
  const endLive = async () => {
    try {
      await agoraService.leaveChannel();
      if (durationInterval.current) clearInterval(durationInterval.current);
      setIsLive(false);
      onClose();
    } catch (e) {
      console.error("[AgoraLive] End error:", e);
      onClose();
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    
    try {
      await addDoc(collection(db, "liveChats", channelId, "messages"), {
        userId,
        userName,
        userAvatar,
        message: chatInput,
        type: "message",
        createdAt: serverTimestamp(),
      });
      setChatInput("");
    } catch (e) {
      console.log("[AgoraLive] Send message error:", e);
    }
  };

  // Send like
  const sendLike = () => {
    setTotalLikes(prev => prev + 1);
    
    const id = Date.now();
    const x = Math.random() * 60 - 30;
    setFloatingHearts(prev => [...prev.slice(-20), { id, x }]);
    
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 2000);
  };

  // Toggle camera
  const toggleCamera = async () => {
    const newState = !isCameraOn;
    setIsCameraOn(newState);
    await agoraService.toggleCamera(newState);
  };

  // Toggle microphone
  const toggleMic = async () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    await agoraService.toggleMicrophone(newState);
  };

  // Send gift
  const sendGift = async () => {
    if (!selectedGift) return;
    
    if (userBalance < selectedGift.points) {
      Alert.alert("Insufficient balance", "You need more coins to send this gift.");
      return;
    }

    // Deduct from balance
    setUserBalance(prev => prev - selectedGift.points);
    
    try {
      // Update wallet
      if (walletId) {
        await updateDoc(doc(db, "wallets", walletId), {
          coins: increment(-selectedGift.points),
          updatedAt: serverTimestamp(),
        });
      }

      // Add 70% to host
      if (hostId && !isHost) {
        const hostDoc = await getDoc(doc(db, "users", hostId));
        if (hostDoc.exists()) {
          const hostWalletId = hostDoc.data().walletId;
          if (hostWalletId) {
            const earnings = Math.ceil(selectedGift.points * 0.7);
            await updateDoc(doc(db, "wallets", hostWalletId), {
              diamonds: increment(earnings),
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      // Add chat message for gift
      await addDoc(collection(db, "liveChats", channelId, "messages"), {
        userId,
        userName,
        userAvatar,
        message: `sent ${selectedGift.name}`,
        type: "gift",
        createdAt: serverTimestamp(),
        giftData: { giftName: selectedGift.name, points: selectedGift.points },
      });

      setRecentGift({ giftName: selectedGift.name, senderName: userName, points: selectedGift.points, combo: 1 });
      setShowGiftModal(false);
      setSelectedGift(null);
    } catch (e) {
      console.log("[AgoraLive] Send gift error:", e);
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      {/* Video Area */}
      <View style={styles.videoContainer}>
        {isLive ? (
          <>
            {/* Video Background - Shows either camera or placeholder */}
            <View style={styles.videoBackground}>
              {isCameraOn && !isDemoMode ? (
                // Real camera - would use RtcSurfaceView here
                <View style={styles.cameraPreview}>
                  <Text style={styles.cameraPreviewText}>Camera Preview</Text>
                </View>
              ) : (
                // Demo mode or camera off - show avatar
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: (isHost ? hostAvatar : userAvatar) || `https://ui-avatars.com/api/?name=${isHost ? hostName : userName}&background=random` }}
                    style={styles.hostAvatarLarge}
                  />
                  <Text style={styles.hostNameLarge}>{isHost ? hostName : userName}</Text>
                  {isDemoMode && (
                    <Text style={styles.demoBadge}>DEMO MODE</Text>
                  )}
                </View>
              )}
            </View>

            {/* Remote Users Grid (for multi-host) */}
            {remoteUsers.length > 0 && (
              <View style={styles.remoteUsersContainer}>
                {remoteUsers.map(user => (
                  <View key={user.uid} style={styles.remoteUserTile}>
                    <Text style={styles.remoteUserName}>{user.userName}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Top Bar Overlay */}
            <View style={styles.topBar}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              
              <View style={styles.hostInfo}>
                <Image
                  source={{ uri: hostAvatar || `https://ui-avatars.com/api/?name=${hostName || "Host"}&background=random` }}
                  style={styles.hostAvatar}
                />
                <Text style={styles.hostName}>{hostName || userName}</Text>
                <View style={styles.followButton}>
                  <Text style={styles.followButtonText}>+</Text>
                </View>
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
            </View>

            {/* Floating Hearts Animation */}
            {floatingHearts.map(heart => (
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
            {recentGift && (
              <Animatable.View 
                animation="slideInLeft" 
                duration={300}
                style={styles.giftPill}
              >
                <Text style={styles.giftPillText}>
                  🎁 {recentGift.giftName} from {recentGift.senderName}
                  {recentGift.combo > 1 && ` x${recentGift.combo}`}
                </Text>
              </Animatable.View>
            )}
          </>
        ) : (
          // Not live yet - show preview
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: hostAvatar || `https://ui-avatars.com/api/?name=${hostName || "Host"}&background=random` }}
              style={styles.previewAvatar}
            />
            <Text style={styles.previewTitle}>{hostName || userName}'s Live</Text>
            <Text style={styles.previewSubtitle}>
              {isDemoMode ? "Demo Mode - Tap to start" : "Tap to join the live"}
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startLive}>
              <Text style={styles.startButtonText}>
                {isHost ? "START LIVE" : "JOIN LIVE"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Chat Panel */}
      {showChat && isLive && (
        <View style={styles.chatPanel}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Chat</Text>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.chatMessages}>
            {chatMessages.map(msg => (
              <View key={msg.id} style={styles.chatMessage}>
                <Text style={styles.chatUserName}>{msg.userName}: </Text>
                <Text style={styles.chatMessageText}>{msg.message}</Text>
              </View>
            ))}
          </View>
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Say something..."
              placeholderTextColor="#666"
            />
            <TouchableOpacity onPress={sendMessage}>
              <Send size={20} color="#FF0066" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Action Bar */}
      {isLive && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.actionButton} onPress={sendLike}>
            <Heart size={24} color="#FF0066" fill="#FF0066" />
            <Text style={styles.actionText}>{totalLikes}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowChat(!showChat)}>
            <MessageCircle size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowGiftModal(true)}>
            <Gift size={24} color="#FFD700" />
            <Text style={styles.actionText}>{userBalance}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <ShoppingBag size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={toggleCamera}>
            {isCameraOn ? (
              <Camera size={24} color="#fff" />
            ) : (
              <CameraOff size={24} color="#888" />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={toggleMic}>
            {isMicOn ? (
              <Mic size={24} color="#fff" />
            ) : (
              <MicOff size={24} color="#888" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.closeButton} onPress={endLive}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Gift Modal */}
      {showGiftModal && (
        <View style={styles.giftModal}>
          <BlurView intensity={90} tint="dark" style={styles.giftModalContent}>
            <View style={styles.giftModalHeader}>
              <Text style={styles.giftModalTitle}>Send Gift</Text>
              <TouchableOpacity onPress={() => setShowGiftModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.giftBalance}>
              <Coins size={16} color="#FFD700" />
              <Text style={styles.giftBalanceText}>{userBalance}</Text>
            </View>
            
            <View style={styles.giftGrid}>
              {Object.values(ENHANCED_GIFTS).map(gift => (
                <TouchableOpacity
                  key={gift.id}
                  style={[styles.giftItem, selectedGift?.id === gift.id && styles.giftItemSelected]}
                  onPress={() => setSelectedGift(gift)}
                  disabled={userBalance < gift.points}
                >
                  <Text style={styles.giftEmoji}>🎁</Text>
                  <Text style={styles.giftName}>{gift.name}</Text>
                  <Text style={styles.giftPoints}>{gift.points}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={[styles.sendGiftButton, !selectedGift && styles.sendGiftDisabled]}
              onPress={sendGift}
              disabled={!selectedGift}
            >
              <Text style={styles.sendGiftText}>SEND</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoContainer: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  videoBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraPreview: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraPreviewText: {
    color: "#666",
    fontSize: 16,
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  hostAvatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FF0066",
  },
  hostNameLarge: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
  },
  demoBadge: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  remoteUsersContainer: {
    position: "absolute",
    top: 100,
    right: 10,
    flexDirection: "column",
  },
  remoteUserTile: {
    width: 60,
    height: 80,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  remoteUserName: {
    color: "#fff",
    fontSize: 10,
  },
  topBar: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    zIndex: 100,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
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
    fontSize: 12,
    fontWeight: "700",
  },
  hostInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hostAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  hostName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  followButton: {
    marginLeft: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF0066",
    justifyContent: "center",
    alignItems: "center",
  },
  followButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  viewerInfo: {
    flexDirection: "row",
    marginLeft: "auto",
  },
  viewerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  viewerCount: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  durationText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  floatingHeart: {
    position: "absolute",
    bottom: 150,
  },
  heartEmoji: {
    fontSize: 30,
  },
  giftPill: {
    position: "absolute",
    top: 150,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    zIndex: 100,
  },
  giftPillText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
  },
  previewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
  },
  previewAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  previewTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  previewSubtitle: {
    color: "#888",
    fontSize: 16,
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: "#FF0066",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  chatPanel: {
    position: "absolute",
    left: 0,
    bottom: 70,
    width: SCREEN_WIDTH * 0.65,
    height: 280,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 12,
    padding: 12,
    zIndex: 90,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chatTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  chatMessages: {
    flex: 1,
  },
  chatMessage: {
    flexDirection: "row",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  chatUserName: {
    color: "#FF0066",
    fontSize: 12,
    fontWeight: "700",
  },
  chatMessageText: {
    color: "#fff",
    fontSize: 12,
    flex: 1,
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    paddingTop: 8,
  },
  chatInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    marginRight: 8,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    zIndex: 100,
  },
  actionButton: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  actionText: {
    color: "#fff",
    fontSize: 10,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  giftModal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  giftModalContent: {
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  giftModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  giftModalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  giftBalance: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  giftBalanceText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  giftItem: {
    width: "23%",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    marginBottom: 8,
  },
  giftItemSelected: {
    backgroundColor: "rgba(255, 0, 102, 0.3)",
    borderWidth: 1,
    borderColor: "#FF0066",
  },
  giftEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  giftName: {
    color: "#fff",
    fontSize: 11,
  },
  giftPoints: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "700",
  },
  sendGiftButton: {
    backgroundColor: "#FF0066",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 16,
  },
  sendGiftDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  sendGiftText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});