/**
 * PKBattleScreen - Live streaming PK Battle between two hosts
 * Split screen with score tracking based on gifts
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
  Animated,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { BlurView } from "expo-blur";
import {
  X,
  Heart,
  Gift,
  Crown,
  Timer,
  Trophy,
  Users,
  MessageCircle,
  Swords,
} from "lucide-react-native";
import { ENHANCED_GIFTS } from "../config/stream";
import { db } from "../api/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, increment, onSnapshot } from "firebase/firestore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface PKBattleScreenProps {
  roomId: string;
  hostAId: string;
  hostAName: string;
  hostAAvatar?: string;
  hostBId: string;
  hostBName: string;
  hostBAvatar?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  onClose: () => void;
}

interface PKState {
  hostAScore: number;
  hostBScore: number;
  isActive: boolean;
  startTime: number;
  duration: number; // seconds
}

export const PKBattleScreen: React.FC<PKBattleScreenProps> = ({
  roomId,
  hostAId,
  hostAName,
  hostAAvatar,
  hostBId,
  hostBName,
  hostBAvatar,
  userId,
  userName,
  userAvatar,
  onClose,
}) => {
  const [pkState, setPKState] = useState<PKState>({
    hostAScore: 0,
    hostBScore: 0,
    isActive: true,
    startTime: Date.now(),
    duration: 300, // 5 minutes
  });
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [userBalance, setUserBalance] = useState(1000);
  const [supportingHost, setSupportingHost] = useState<"A" | "B" | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ userName: string; message: string; type?: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [floatingGifts, setFloatingGifts] = useState<{ id: number; host: "A" | "B"; giftName: string; points: number }[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<Animated.Value[]>([]).current;

  // Initialize animation values for score bars
  useEffect(() => {
    animationRef[0] = new Animated.Value(0);
    animationRef[1] = new Animated.Value(0);
  }, []);

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setPKState(prev => ({
        ...prev,
        duration: Math.max(0, prev.duration - 1),
      }));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Subscribe to PK state updates from Firestore
  useEffect(() => {
    const sessionRef = doc(db, "liveSessions", roomId);
    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.pkState) {
          setPKState(prev => ({
            ...prev,
            hostAScore: data.pkState.hostScore || 0,
            hostBScore: data.pkState.guestScore || 0,
          }));
        }
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Animate score bars
  useEffect(() => {
    const total = pkState.hostAScore + pkState.hostBScore || 1;
    const ratioA = pkState.hostAScore / total;
    const ratioB = pkState.hostBScore / total;

    Animated.parallel([
      Animated.timing(animationRef[0], {
        toValue: ratioA,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(animationRef[1], {
        toValue: ratioB,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  }, [pkState.hostAScore, pkState.hostBScore]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const sendGift = async () => {
    if (!selectedGift || !supportingHost) {
      Alert.alert("Select a host", "Choose who to support first!");
      return;
    }

    if (userBalance < selectedGift.points) {
      Alert.alert("Insufficient balance", "Need more coins!");
      return;
    }

    // Deduct balance
    setUserBalance(prev => prev - selectedGift.points);

    // Update PK score
    const scoreIncrement = supportingHost === "A" ? selectedGift.points : 0;
    const guestIncrement = supportingHost === "B" ? selectedGift.points : 0;

    try {
      // Update session PK state
      const sessionRef = doc(db, "liveSessions", roomId);
      await updateDoc(sessionRef, {
        "pkState.hostScore": increment(scoreIncrement),
        "pkState.guestScore": increment(guestIncrement),
      });

      // Show floating gift animation
      const giftId = Date.now();
      setFloatingGifts(prev => [...prev, { id: giftId, host: supportingHost, giftName: selectedGift.name, points: selectedGift.points }]);
      setTimeout(() => setFloatingGifts(prev => prev.filter(g => g.id !== giftId)), 2000);

      // Add chat message
      await addDoc(collection(db, "liveChats", roomId, "messages"), {
        userId,
        userName,
        userAvatar,
        message: `sent ${selectedGift.name} to ${supportingHost === "A" ? hostAName : hostBName}`,
        type: "gift",
        createdAt: serverTimestamp(),
        giftData: { giftName: selectedGift.name, points: selectedGift.points, targetHost: supportingHost },
      });

      setShowGiftModal(false);
      setSelectedGift(null);
    } catch (e) {
      console.log("[PKBattle] Send gift error:", e);
    }
  };

  const selectHost = (host: "A" | "B") => {
    setSupportingHost(host);
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    try {
      await addDoc(collection(db, "liveChats", roomId, "messages"), {
        userId,
        userName,
        userAvatar,
        message: chatInput,
        type: "message",
        createdAt: serverTimestamp(),
      });
      setChatInput("");
    } catch (e) {
      console.log("[PKBattle] Send message error:", e);
    }
  };

  const isLeading = pkState.hostAScore > pkState.hostBScore ? "A" : pkState.hostBScore > pkState.hostAScore ? "B" : null;

  return (
    <View style={styles.container}>
      {/* Split Screen Video Area */}
      <View style={styles.videoContainer}>
        {/* Host A Side */}
        <TouchableOpacity
          style={[
            styles.hostSide,
            supportingHost === "A" && styles.hostSideSelected,
          ]}
          onPress={() => selectHost("A")}
        >
          <Image
            source={{ uri: hostAAvatar || `https://ui-avatars.com/api/?name=${hostAName}&background=random` }}
            style={styles.hostAvatarLarge}
          />
          <View style={styles.hostInfo}>
            <Text style={styles.hostNameLarge}>{hostAName}</Text>
            {supportingHost === "A" && (
              <View style={styles.supportingBadge}>
                <Heart size={12} color="#fff" fill="#fff" />
                <Text style={styles.supportingText}>Supporting</Text>
              </View>
            )}
          </View>
          {isLeading === "A" && (
            <View style={styles.leadingBadge}>
              <Trophy size={16} color="#FFD700" />
            </View>
          )}
        </TouchableOpacity>

        {/* Divider / VS */}
        <View style={styles.vsContainer}>
          <View style={styles.vsCircle}>
            <Swords size={24} color="#fff" />
          </View>
          <View style={styles.timerContainer}>
            <Timer size={14} color="#fff" />
            <Text style={styles.timerText}>{formatTime(pkState.duration)}</Text>
          </View>
        </View>

        {/* Host B Side */}
        <TouchableOpacity
          style={[
            styles.hostSide,
            supportingHost === "B" && styles.hostSideSelected,
          ]}
          onPress={() => selectHost("B")}
        >
          <Image
            source={{ uri: hostBAvatar || `https://ui-avatars.com/api/?name=${hostBName}&background=random` }}
            style={styles.hostAvatarLarge}
          />
          <View style={styles.hostInfo}>
            <Text style={styles.hostNameLarge}>{hostBName}</Text>
            {supportingHost === "B" && (
              <View style={styles.supportingBadge}>
                <Heart size={12} color="#fff" fill="#fff" />
                <Text style={styles.supportingText}>Supporting</Text>
              </View>
            )}
          </View>
          {isLeading === "B" && (
            <View style={styles.leadingBadge}>
              <Trophy size={16} color="#FFD700" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Score Bars */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreBar}>
          <Animated.View
            style={[
              styles.scoreBarFill,
              styles.scoreBarFillA,
              { width: animationRef[0].interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
            ]}
          />
          <Text style={styles.scoreText}>{pkState.hostAScore}</Text>
        </View>
        <View style={styles.scoreDivider}>
          <Text style={styles.scoreDividerText}>VS</Text>
        </View>
        <View style={styles.scoreBar}>
          <Animated.View
            style={[
              styles.scoreBarFill,
              styles.scoreBarFillB,
              { width: animationRef[1].interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
            ]}
          />
          <Text style={styles.scoreText}>{pkState.hostBScore}</Text>
        </View>
      </View>

      {/* Floating Gift Animations */}
      {floatingGifts.map(gift => (
        <View
          key={gift.id}
          style={[
            styles.floatingGift,
            gift.host === "A" ? styles.floatingGiftLeft : styles.floatingGiftRight,
          ]}
        >
          <Text style={styles.floatingGiftText}>
            🎁 {gift.giftName} +{gift.points}
          </Text>
        </View>
      ))}

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setShowChat(!showChat)}>
          <MessageCircle size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.giftButton, !supportingHost && styles.giftButtonDisabled]}
          onPress={() => supportingHost && setShowGiftModal(true)}
          disabled={!supportingHost}
        >
          <Gift size={24} color="#FFD700" />
          <Text style={styles.giftButtonText}>Gift</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={onClose}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Chat Panel */}
      {showChat && (
        <View style={styles.chatPanel}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>PK Chat</Text>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.chatMessages}>
            {chatMessages.map((msg, i) => (
              <Text key={i} style={styles.chatMessage}>
                <Text style={styles.chatUserName}>{msg.userName}: </Text>
                {msg.message}
              </Text>
            ))}
          </View>
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Cheer for your favorite!"
              placeholderTextColor="#666"
            />
            <TouchableOpacity onPress={sendMessage}>
              <Text style={styles.sendButton}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Gift Modal */}
      {showGiftModal && (
        <View style={styles.giftModal}>
          <BlurView intensity={90} tint="dark" style={styles.giftModalContent}>
            <View style={styles.giftModalHeader}>
              <Text style={styles.giftModalTitle}>
                Send to {supportingHost === "A" ? hostAName : hostBName}
              </Text>
              <TouchableOpacity onPress={() => setShowGiftModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.giftBalance}>
              <Text style={styles.giftBalanceText}>💰 {userBalance} coins</Text>
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
              <Text style={styles.sendGiftText}>SEND GIFT</Text>
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
    flexDirection: "row",
  },
  hostSide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  hostSideSelected: {
    borderWidth: 4,
    borderColor: "#FF0066",
  },
  hostAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#333",
  },
  hostInfo: {
    alignItems: "center",
    marginTop: 16,
  },
  hostNameLarge: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  supportingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF0066",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 8,
  },
  supportingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  leadingBadge: {
    position: "absolute",
    top: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 8,
    borderRadius: 20,
  },
  vsContainer: {
    position: "absolute",
    top: "40%",
    left: SCREEN_WIDTH / 2 - 30,
    alignItems: "center",
  },
  vsCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF0066",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 8,
  },
  timerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  scoreContainer: {
    flexDirection: "row",
    height: 40,
    backgroundColor: "#1a1a1a",
  },
  scoreBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  scoreBarFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    opacity: 0.3,
  },
  scoreBarFillA: {
    backgroundColor: "#FF0066",
  },
  scoreBarFillB: {
    backgroundColor: "#00D4FF",
    right: 0,
    left: "auto",
  },
  scoreText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    paddingHorizontal: 16,
    zIndex: 1,
  },
  scoreDivider: {
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  scoreDividerText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "700",
  },
  floatingGift: {
    position: "absolute",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 20,
  },
  floatingGiftLeft: {
    left: 20,
    top: "30%",
  },
  floatingGiftRight: {
    right: 20,
    top: "30%",
  },
  floatingGiftText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    gap: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  giftButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF0066",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  giftButtonDisabled: {
    backgroundColor: "#333",
  },
  giftButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  chatPanel: {
    position: "absolute",
    left: 0,
    bottom: 80,
    width: SCREEN_WIDTH * 0.6,
    height: 250,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderRadius: 12,
    padding: 12,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chatTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  chatMessages: {
    flex: 1,
  },
  chatMessage: {
    color: "#fff",
    fontSize: 12,
    marginBottom: 6,
  },
  chatUserName: {
    color: "#FF0066",
    fontWeight: "600",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 8,
  },
  chatInput: {
    flex: 1,
    color: "#fff",
    fontSize: 12,
    marginRight: 8,
  },
  sendButton: {
    color: "#FF0066",
    fontSize: 12,
    fontWeight: "600",
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
    fontSize: 18,
    fontWeight: "700",
  },
  giftBalance: {
    alignItems: "center",
    marginBottom: 16,
  },
  giftBalanceText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "600",
  },
  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  giftItem: {
    width: "23%",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    marginBottom: 8,
  },
  giftItemSelected: {
    backgroundColor: "rgba(255, 0, 102, 0.3)",
    borderWidth: 1,
    borderColor: "#FF0066",
  },
  giftEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  giftName: {
    color: "#fff",
    fontSize: 10,
  },
  giftPoints: {
    color: "#FFD700",
    fontSize: 9,
    fontWeight: "700",
  },
  sendGiftButton: {
    backgroundColor: "#FF0066",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 16,
  },
  sendGiftDisabled: {
    backgroundColor: "#333",
  },
  sendGiftText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default PKBattleScreen;