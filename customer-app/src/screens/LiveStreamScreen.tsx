import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Alert,
  Share,
  StatusBar,
  Dimensions,
} from "react-native";
import {
  StreamVideoClient,
  StreamVideo,
  User,
  Call,
  StreamCall,
  useCallStateHooks,
  ParticipantView,
  Avatar,
} from "@stream-io/video-react-native-sdk";
import { useAppTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { STREAM_API_KEY } from "../config/stream";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface LivestreamScreenProps {
  callId?: string;
  isHost?: boolean;
  onClose?: () => void;
}

const DEMO_USER_ID = "demo-user";
const DEMO_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZGVtby11c2VyIiwic3ViIjoidXNlci9kZW1vLXVzZXIiLCJhcGlLZXkiOiI2dXdyejJ5cHh3OSIsImlhdCI6MTc3NzgyOTQ2MSwiZXhwIjoxNzc3ODMzMDYxfQ.qJZXtYhG9zV1nGj7W6cKxT5r8nP2oE3yX7dK9mV1uT8cA";

interface ChatMessage {
  id: string;
  user: string;
  userId: string;
  message: string;
  timestamp: Date;
  isGift?: boolean;
}

interface Gift {
  id: string;
  name: string;
  icon: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  inStock: boolean;
}

interface LiveOrder {
  id: string;
  productName: string;
  quantity: number;
  total: number;
  buyer: string;
}

interface PKBattle {
  id: string;
  opponentName: string;
  opponentImage: string;
  myScore: number;
  opponentScore: number;
}

const SAMPLE_PRODUCTS: Product[] = [
  { id: "1", name: "Summer Dress", price: 49.99, originalPrice: 79.99, image: "👗", inStock: true },
  { id: "2", name: "Classic Jeans", price: 39.99, originalPrice: 59.99, image: "👖", inStock: true },
  { id: "3", name: "Leather Bag", price: 89.99, originalPrice: 129.99, image: "👜", inStock: true },
  { id: "4", name: "Sneakers", price: 59.99, image: "👟", inStock: true },
  { id: "5", name: "Silk Shirt", price: 34.99, originalPrice: 49.99, image: "👔", inStock: false },
  { id: "6", name: "Sunglasses", price: 24.99, image: "🕶️", inStock: true },
];

const GIFTS: Gift[] = [
  { id: "1", name: "Rose", icon: "🌹", price: 1 },
  { id: "2", name: "Heart", icon: "❤️", price: 5 },
  { id: "3", name: "Star", icon: "⭐", price: 10 },
  { id: "4", name: "Diamond", icon: "💎", price: 50 },
  { id: "5", name: "Crown", icon: "👑", price: 100 },
  { id: "6", name: "Rocket", icon: "🚀", price: 200 },
];

const REACTIONS = [
  { emoji: "👍" }, { emoji: "❤️" }, { emoji: "🔥" }, { emoji: "😂" }, { emoji: "😮" }, { emoji: "👏" },
];

export const LivestreamScreen: React.FC<LivestreamScreenProps> = ({
  callId: propCallId,
  isHost: propIsHost = false,
  onClose,
}) => {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initClient = async () => {
      try {
        const user: User = { id: DEMO_USER_ID, name: "Demo User" };
        const newClient = StreamVideoClient.getOrCreateInstance({
          apiKey: STREAM_API_KEY,
          user,
          token: DEMO_TOKEN,
        });
        setClient(newClient);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to initialize");
        setIsLoading(false);
      }
    };
    initClient();
  }, []);

  const handleLeave = useCallback(() => {
    if (onClose) onClose();
    navigation.goBack();
  }, [navigation, onClose]);

  if (isLoading || !client) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: "#000" }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Connecting...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: "#000" }]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const callId = propCallId || "live_" + Date.now();

  return (
    <StreamVideo client={client}>
      <StreamCallWrapper
        callId={callId}
        isHost={propIsHost}
        colors={colors}
        onLeave={handleLeave}
      />
    </StreamVideo>
  );
};

interface StreamCallWrapperProps {
  callId: string;
  isHost: boolean;
  colors: any;
  onLeave: () => void;
}

const StreamCallWrapper: React.FC<StreamCallWrapperProps> = ({
  callId,
  isHost,
  colors,
  onLeave,
}) => {
  const [call, setCall] = useState<Call | null>(null);
  const [isJoining, setIsJoining] = useState(true);

  useEffect(() => {
    const user: User = { id: DEMO_USER_ID, name: "Demo User" };
    const client = StreamVideoClient.getOrCreateInstance({
      apiKey: STREAM_API_KEY,
      user,
      token: DEMO_TOKEN,
    });
    const newCall = client.call("livestream", callId);

    newCall.join({ create: isHost })
      .then(() => {
        setCall(newCall);
        setIsJoining(false);
      })
      .catch((err) => {
        console.error("Failed to join call:", err);
        setIsJoining(false);
      });

    return () => {
      newCall.leave().catch(console.error);
    };
  }, [callId, isHost]);

  if (isJoining) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: "#000" }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Joining...</Text>
      </SafeAreaView>
    );
  }

  if (!call) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: "#000" }]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.errorText}>Failed to join</Text>
        <TouchableOpacity style={styles.button} onPress={onLeave}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <StreamCall call={call}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <StatusBar barStyle="light-content" />
        {isHost ? (
          <HostLivestreamView call={call} colors={colors} onLeave={onLeave} />
        ) : (
          <ViewerLivestreamView callId={callId} colors={colors} onLeave={onLeave} />
        )}
      </KeyboardAvoidingView>
    </StreamCall>
  );
};

const HostLivestreamView: React.FC<{ call: Call; colors: any; onLeave: () => void }> = ({
  call,
  colors,
  onLeave,
}) => {
  const { useCallState, useParticipantCount, useParticipants } = useCallStateHooks();
  const callState = useCallState();
  const participantCount = useParticipantCount();
  const participants = useParticipants();
  
  const [isLive, setIsLive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showPkBattle, setShowPkBattle] = useState(false);
  const [pinnedProduct, setPinnedProduct] = useState<Product | null>(null);
  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);
  const [pkBattle, setPkBattle] = useState<PKBattle | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  
  const durationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    durationRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => {
      if (durationRef.current) clearInterval(durationRef.current);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleGoLive = useCallback(async () => {
    try {
      await call.goLive();
      setIsLive(true);
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        user: "System",
        userId: "system",
        message: "🎉 You are now LIVE!",
        timestamp: new Date(),
      }]);
    } catch (err) {
      console.error("Go live error:", err);
      setIsLive(true);
    }
  }, [call]);

  const handleStopLive = useCallback(async () => {
    try {
      await call.stopLive();
      setIsLive(false);
    } catch (err) {
      console.error("Stop live error:", err);
      setIsLive(false);
    }
  }, [call]);

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: "You (Host)",
      userId: DEMO_USER_ID,
      message: messageText,
      timestamp: new Date(),
    }]);
    setMessageText("");
  }, [messageText]);

  const handleSendGift = useCallback((gift: Gift) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: "You (Host)",
      userId: DEMO_USER_ID,
      message: `🎁 Sent ${gift.icon} ${gift.name}`,
      timestamp: new Date(),
      isGift: true,
    }]);
    setShowGifts(false);
    Alert.alert("Gift Sent!", `${gift.name} ${gift.icon}!`);
  }, []);

  const handlePinProduct = useCallback((product: Product | null) => {
    setPinnedProduct(product);
    if (product) {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        user: "System",
        userId: "system",
        message: `📦 ${product.name} - $${product.price} ${product.originalPrice ? `(🔥 Save $${(product.originalPrice - product.price).toFixed(2)})` : ""}`,
        timestamp: new Date(),
      }]);
    }
  }, []);

  const handleStartPk = useCallback(() => {
    setPkBattle({
      id: Date.now().toString(),
      opponentName: "Rival",
      opponentImage: "🎭",
      myScore: 0,
      opponentScore: 0,
    });
    setShowPkBattle(true);
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: "System",
      userId: "system",
      message: "⚔️ PK Battle started! Vote for your favorite!",
      timestamp: new Date(),
    }]);
  }, []);

  const handleEndPk = useCallback(() => {
    if (pkBattle) {
      const winner = pkBattle.myScore > pkBattle.opponentScore ? "You" : pkBattle.opponentName;
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        user: "System",
        userId: "system",
        message: `🏆 PK Battle ended! Winner: ${winner}!`,
        timestamp: new Date(),
      }]);
    }
    setPkBattle(null);
    setShowPkBattle(false);
  }, [pkBattle]);

  useEffect(() => {
    const names = ["Alex", "Maria", "John", "Sarah", "Emma", "David", "Lisa"];
    const msgs = ["Great stream!", "Love it! 🔥", "Amazing!", "Keep going!", "👏👏👏", "Awesome!", "❤️"];
    
    const interval = setInterval(() => {
      setChatMessages(prev => [...prev.slice(-30), {
        id: Date.now().toString(),
        user: names[Math.floor(Math.random() * names.length)],
        userId: "viewer-" + Math.random(),
        message: msgs[Math.floor(Math.random() * msgs.length)],
        timestamp: new Date(),
      }]);

      if (pkBattle && Math.random() > 0.5) {
        const isMyVote = Math.random() > 0.5;
        setPkBattle(prev => prev ? ({
          ...prev,
          myScore: isMyVote ? prev.myScore + Math.floor(Math.random() * 10) + 1 : prev.myScore,
          opponentScore: !isMyVote ? prev.opponentScore + Math.floor(Math.random() * 10) + 1 : prev.opponentScore,
        }) : null);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [pkBattle]);

  const currentParticipants = participants?.length || 0;

  return (
    <View style={styles.livestreamContainer}>
      {/* Video Area - Shows participant video or placeholder */}
      <View style={styles.videoArea}>
        {participants && participants.length > 0 ? (
          participants.slice(0, 1).map((participant) => (
            <ParticipantView
              key={participant.sessionId}
              participant={participant}
              style={styles.participantVideo}
            />
          ))
        ) : (
          <View style={styles.videoPlaceholder}>
            <Ionicons name="videocam" size={80} color="#444" />
            <Text style={styles.videoPlaceholderText}>Camera Preview</Text>
            <Text style={styles.videoPlaceholderSubtext}>Press "Go Live" to start streaming</Text>
          </View>
        )}
      </View>

      {/* Top Header - Follows Stream's UI Cookbook pattern */}
      <View style={styles.livestreamHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.liveIndicator, { backgroundColor: isLive ? "#ff4444" : "#666" }]}>
            <View style={[styles.liveDot, { backgroundColor: isLive ? "#fff" : "#aaa" }]} />
            <Text style={styles.liveIndicatorText}>
              {isLive ? "LIVE" : "BACKSTAGE"}
            </Text>
          </View>
          
          <View style={styles.viewerCountContainer}>
            <Ionicons name="eye" size={14} color="#fff" />
            <Text style={styles.viewerCountText}>{currentParticipants || 0}</Text>
          </View>
          
          <View style={styles.durationContainer}>
            <Ionicons name="time" size={12} color="#aaa" />
            <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowOrders(true)}>
            <Ionicons name="receipt-outline" size={22} color="#fff" />
            {liveOrders.length > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{liveOrders.length}</Text></View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowPkBattle(true)}>
            <Ionicons name="trophy-outline" size={22} color={pkBattle ? "#FFD700" : "#fff"} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowGifts(true)}>
            <Ionicons name="gift-outline" size={22} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowMarketplace(true)}>
            <Ionicons name="storefront-outline" size={22} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowChat(true)}>
            <Ionicons name="chatbubbles" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pinned Product Card */}
      {pinnedProduct && (
        <View style={styles.pinnedProductContainer}>
          <View style={styles.pinnedProductCard}>
            <Text style={styles.pinnedProductIcon}>{pinnedProduct.image}</Text>
            <View style={styles.pinnedProductInfo}>
              <Text style={styles.pinnedProductName}>{pinnedProduct.name}</Text>
              <View style={styles.pinnedProductPrices}>
                <Text style={styles.pinnedProductPrice}>${pinnedProduct.price.toFixed(2)}</Text>
                {pinnedProduct.originalPrice && (
                  <Text style={styles.pinnedProductOriginal}>${pinnedProduct.originalPrice.toFixed(2)}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => setPinnedProduct(null)}>
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* PK Battle Card */}
      {pkBattle && (
        <View style={styles.pkBattleContainer}>
          <View style={styles.pkBattleCard}>
            <View style={styles.pkBattleHeader}>
              <Text style={styles.pkBattleTitle}>⚔️ PK Battle</Text>
            </View>
            <View style={styles.pkBattleContent}>
              <View style={styles.pkBattleSide}>
                <Text style={styles.pkBattleScore}>{pkBattle.myScore}</Text>
                <Text style={styles.pkBattleLabel}>You</Text>
              </View>
              <Text style={styles.pkBattleVs}>VS</Text>
              <View style={styles.pkBattleSide}>
                <Text style={styles.pkBattleScore}>{pkBattle.opponentScore}</Text>
                <Text style={styles.pkBattleLabel}>{pkBattle.opponentName}</Text>
              </View>
            </View>
            <View style={styles.pkBattleProgress}>
              <View style={[styles.pkBattleProgressBar, { 
                width: `${(pkBattle.myScore / (pkBattle.myScore + pkBattle.opponentScore || 1)) * 100}%` 
              }]} />
            </View>
          </View>
        </View>
      )}

      {/* Chat Overlay */}
      {showChat && chatMessages.length > 0 && (
        <View style={styles.chatOverlay}>
          {chatMessages.slice(-4).map((msg) => (
            <View key={msg.id} style={[styles.chatMessage, msg.isGift && styles.giftMessage]}>
              <Text style={styles.chatUser}>{msg.user}: </Text>
              <Text style={styles.chatText}>{msg.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bottom Controls - Following Stream's HostLivestreamControls pattern */}
      <View style={styles.livestreamControls}>
        <View style={styles.mediaControls}>
          <TouchableOpacity 
            style={[styles.mediaButton, !cameraOn && styles.mediaButtonOff]} 
            onPress={() => setCameraOn(!cameraOn)}
          >
            <Ionicons name={cameraOn ? "videocam" : "videocam-off"} size={20} color="#fff" />
            <Text style={styles.mediaButtonLabel}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.mediaButton, !micOn && styles.mediaButtonOff]} 
            onPress={() => setMicOn(!micOn)}
          >
            <Ionicons name={micOn ? "mic" : "mic-off"} size={20} color="#fff" />
            <Text style={styles.mediaButtonLabel}>Mic</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.goLiveButton, isLive ? styles.stopLiveButton : styles.startLiveButton]} 
          onPress={isLive ? handleStopLive : handleGoLive}
        >
          <Ionicons name={isLive ? "stop" : "radio-button-on"} size={20} color="#fff" />
          <Text style={styles.goLiveButtonText}>
            {isLive ? "End Live" : "Go Live"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.leaveButton} onPress={onLeave}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Chat Modal */}
      <Modal visible={showChat} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowChat(false)}>
          <View style={[styles.chatModal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Chat</Text>
              <TouchableOpacity onPress={() => setShowChat(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <FlatList 
              data={chatMessages} 
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.chatItem, { backgroundColor: colors.card }]}>
                  <Text style={[styles.chatItemUser, { color: colors.primary }]}>{item.user}:</Text>
                  <Text style={{ color: colors.foreground }}>{item.message}</Text>
                </View>
              )}
            />
            <View style={styles.chatInputRow}>
              <TextInput 
                style={[styles.chatInput, { backgroundColor: colors.card, color: colors.foreground }]}
                placeholder="Say something..."
                placeholderTextColor="#666"
                value={messageText}
                onChangeText={setMessageText}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.primary }]} onPress={handleSendMessage}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Gifts Modal */}
      <Modal visible={showGifts} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowGifts(false)}>
          <View style={[styles.giftModal, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Gifts</Text>
            <View style={styles.giftGrid}>
              {GIFTS.map((gift) => (
                <TouchableOpacity key={gift.id} style={styles.giftItem} onPress={() => handleSendGift(gift)}>
                  <Text style={styles.giftIcon}>{gift.icon}</Text>
                  <Text style={{ color: colors.foreground }}>{gift.name}</Text>
                  <Text style={styles.giftPrice}>${gift.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Marketplace Modal */}
      <Modal visible={showMarketplace} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMarketplace(false)}>
          <View style={[styles.marketplaceModal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Marketplace</Text>
              <TouchableOpacity onPress={() => setShowMarketplace(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {SAMPLE_PRODUCTS.map((product) => (
                <View key={product.id} style={[styles.productItem, { backgroundColor: colors.card }]}>
                  <Text style={styles.productIcon}>{product.image}</Text>
                  <View style={styles.productDetails}>
                    <Text style={{ color: colors.foreground, fontWeight: "600" }}>{product.name}</Text>
                    <View style={styles.productPrices}>
                      <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                      {product.originalPrice && (
                        <>
                          <Text style={styles.productOriginal}>${product.originalPrice.toFixed(2)}</Text>
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>SALE</Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={[styles.pinButton, pinnedProduct?.id === product.id && styles.pinButtonActive]}
                    onPress={() => handlePinProduct(pinnedProduct?.id === product.id ? null : product)}
                  >
                    <Ionicons name={pinnedProduct?.id === product.id ? "pin" : "pin-outline"} size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Orders Modal */}
      <Modal visible={showOrders} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOrders(false)}>
          <View style={[styles.ordersModal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Orders</Text>
              <TouchableOpacity onPress={() => setShowOrders(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <View style={styles.ordersStats}>
              <View style={styles.orderStatBox}>
                <Text style={styles.orderStatValue}>{liveOrders.length}</Text>
                <Text style={styles.orderStatLabel}>Total Orders</Text>
              </View>
              <View style={styles.orderStatBox}>
                <Text style={styles.orderStatValue}>${liveOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}</Text>
                <Text style={styles.orderStatLabel}>Revenue</Text>
              </View>
            </View>
            <ScrollView>
              {liveOrders.length === 0 ? (
                <Text style={{ color: colors.foreground, textAlign: "center", marginTop: 40 }}>No orders yet</Text>
              ) : (
                liveOrders.map((order) => (
                  <View key={order.id} style={[styles.orderItem, { backgroundColor: colors.card }]}>
                    <Text style={{ color: colors.foreground }}>{order.productName}</Text>
                    <Text style={styles.orderBuyer}>👤 {order.buyer}</Text>
                    <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PK Battle Modal */}
      <Modal visible={showPkBattle} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPkBattle(false)}>
          <View style={[styles.pkModal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>PK Battle</Text>
              <TouchableOpacity onPress={() => setShowPkBattle(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <View style={styles.pkModalContent}>
              <Text style={styles.pkModalEmoji}>⚔️</Text>
              <Text style={{ color: colors.foreground, marginBottom: 20 }}>
                {pkBattle ? "Battle in progress" : "Start a PK Battle to compete with another host"}
              </Text>
              {pkBattle ? (
                <TouchableOpacity style={styles.endPkButton} onPress={handleEndPk}>
                  <Text style={styles.endPkButtonText}>End PK</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.startPkButton} onPress={handleStartPk}>
                  <Text style={styles.startPkButtonText}>Start PK Battle</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const ViewerLivestreamView: React.FC<{ callId: string; colors: any; onLeave: () => void }> = ({
  callId,
  colors,
  onLeave,
}) => {
  const { useCallState, useParticipantCount } = useCallStateHooks();
  const callState = useCallState();
  const participantCount = useParticipantCount();
  
  const [isLive, setIsLive] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", user: "Host", userId: "host", message: "Welcome everyone! 🎉", timestamp: new Date() },
  ]);
  const [messageText, setMessageText] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [showGifts, setShowGifts] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [pinnedProduct, setPinnedProduct] = useState<Product | null>(null);
  
  const durationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    durationRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => {
      if (durationRef.current) clearInterval(durationRef.current);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: "You",
      userId: "viewer",
      message: messageText,
      timestamp: new Date(),
    }]);
    setMessageText("");
  }, [messageText]);

  const handleSendGift = useCallback((gift: Gift) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: "You",
      userId: "viewer",
      message: `🎁 Sent ${gift.icon} ${gift.name}`,
      timestamp: new Date(),
      isGift: true,
    }]);
    setShowGifts(false);
    Alert.alert("Gift Sent!", `${gift.name} ${gift.icon}!`);
  }, []);

  const handleAddToCart = useCallback((product: Product) => {
    if (!product.inStock) return;
    Alert.alert("Added!", `${product.name} - $${product.price.toFixed(2)}`);
  }, []);

  useEffect(() => {
    const names = ["Fan123", "Viewer99", "Alex", "Maria", "John", "Emma", "David"];
    const msgs = ["Awesome! 🔥", "Love this!", "Great content", "👏👏", "❤️❤️", "Wow!", "Amazing!"];
    
    const interval = setInterval(() => {
      setChatMessages(prev => [...prev.slice(-20), {
        id: Date.now().toString(),
        user: names[Math.floor(Math.random() * names.length)],
        userId: "viewer-" + Math.random(),
        message: msgs[Math.floor(Math.random() * msgs.length)],
        timestamp: new Date(),
      }]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const viewerCount = participantCount || Math.floor(Math.random() * 50) + 10;

  return (
    <View style={styles.livestreamContainer}>
      {/* Video Area */}
      <View style={styles.videoArea}>
        <View style={styles.videoPlaceholder}>
          <Ionicons name="play-circle" size={80} color="#444" />
          <Text style={styles.videoPlaceholderText}>Live Stream</Text>
          <Text style={styles.videoPlaceholderSubtext}>Tap to play</Text>
        </View>
      </View>

      {/* Top Header - Following Stream's ViewerLivestream pattern */}
      <View style={styles.livestreamHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.liveIndicator, { backgroundColor: "#ff4444" }]}>
            <View style={[styles.liveDot, { backgroundColor: "#fff" }]} />
            <Text style={styles.liveIndicatorText}>LIVE</Text>
          </View>
          
          <View style={styles.viewerCountContainer}>
            <Ionicons name="eye" size={14} color="#fff" />
            <Text style={styles.viewerCountText}>{viewerCount}</Text>
          </View>
          
          <View style={styles.durationContainer}>
            <Ionicons name="time" size={12} color="#aaa" />
            <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowReactions(!showReactions)}>
            <Ionicons name="happy-outline" size={22} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowGifts(true)}>
            <Ionicons name="gift-outline" size={22} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowMarketplace(true)}>
            <Ionicons name="storefront-outline" size={22} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowChat(true)}>
            <Ionicons name="chatbubbles" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reactions Picker */}
      {showReactions && (
        <View style={styles.reactionsPicker}>
          {REACTIONS.map((r, i) => (
            <TouchableOpacity key={i} style={styles.reactionButton} onPress={() => setShowReactions(false)}>
              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Chat Overlay */}
      {showChat && chatMessages.length > 0 && (
        <View style={styles.chatOverlay}>
          {chatMessages.slice(-4).map((msg) => (
            <View key={msg.id} style={[styles.chatMessage, msg.isGift && styles.giftMessage]}>
              <Text style={styles.chatUser}>{msg.user}: </Text>
              <Text style={styles.chatText}>{msg.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bottom Controls - Following Stream's ViewerLivestreamControls pattern */}
      <View style={styles.viewerControls}>
        <TouchableOpacity style={styles.viewerActionButton} onPress={() => setShowReactions(true)}>
          <Ionicons name="happy" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.viewerActionButton} onPress={() => setShowGifts(true)}>
          <Ionicons name="gift" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.viewerActionButton} onPress={() => setShowMarketplace(true)}>
          <Ionicons name="storefront" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.viewerActionButton} onPress={() => setShowChat(!showChat)}>
          <Ionicons name="chatbubbles" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.viewerLeaveButton} onPress={onLeave}>
          <Text style={styles.viewerLeaveText}>Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Modal */}
      <Modal visible={showChat} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowChat(false)}>
          <View style={[styles.chatModal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Chat</Text>
              <TouchableOpacity onPress={() => setShowChat(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <FlatList 
              data={chatMessages} 
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.chatItem, { backgroundColor: colors.card }]}>
                  <Text style={[styles.chatItemUser, { color: colors.primary }]}>{item.user}:</Text>
                  <Text style={{ color: colors.foreground }}>{item.message}</Text>
                </View>
              )}
            />
            <View style={styles.chatInputRow}>
              <TextInput 
                style={[styles.chatInput, { backgroundColor: colors.card, color: colors.foreground }]}
                placeholder="Say something..."
                placeholderTextColor="#666"
                value={messageText}
                onChangeText={setMessageText}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.primary }]} onPress={handleSendMessage}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Gifts Modal */}
      <Modal visible={showGifts} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowGifts(false)}>
          <View style={[styles.giftModal, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Gifts</Text>
            <View style={styles.giftGrid}>
              {GIFTS.map((gift) => (
                <TouchableOpacity key={gift.id} style={styles.giftItem} onPress={() => handleSendGift(gift)}>
                  <Text style={styles.giftIcon}>{gift.icon}</Text>
                  <Text style={{ color: colors.foreground }}>{gift.name}</Text>
                  <Text style={styles.giftPrice}>${gift.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Marketplace Modal */}
      <Modal visible={showMarketplace} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMarketplace(false)}>
          <View style={[styles.marketplaceModal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Marketplace</Text>
              <TouchableOpacity onPress={() => setShowMarketplace(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {SAMPLE_PRODUCTS.map((product) => (
                <View key={product.id} style={[styles.productItem, { backgroundColor: colors.card }]}>
                  <Text style={styles.productIcon}>{product.image}</Text>
                  <View style={styles.productDetails}>
                    <Text style={{ color: colors.foreground, fontWeight: "600" }}>{product.name}</Text>
                    <View style={styles.productPrices}>
                      <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                      {product.originalPrice && (
                        <>
                          <Text style={styles.productOriginal}>${product.originalPrice.toFixed(2)}</Text>
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>SALE</Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={[styles.buyButton, !product.inStock && styles.buyButtonDisabled]}
                    disabled={!product.inStock}
                    onPress={() => { handleAddToCart(product); setShowMarketplace(false); }}
                  >
                    <Text style={styles.buyButtonText}>{product.inStock ? "Add" : "Sold Out"}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", marginTop: 16, fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { color: "#ff4444", fontSize: 16, marginBottom: 20 },
  button: { backgroundColor: "#4CAF50", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  
  livestreamContainer: { flex: 1, backgroundColor: "#000" },
  videoArea: { flex: 1 },
  participantVideo: { flex: 1 },
  videoPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111" },
  videoPlaceholderText: { fontSize: 24, color: "#666", marginTop: 16 },
  videoPlaceholderSubtext: { fontSize: 14, color: "#444", marginTop: 8 },
  
  livestreamHeader: { 
    position: "absolute", 
    top: 50, 
    left: 0, 
    right: 0, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  
  liveIndicator: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveIndicatorText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  
  viewerCountContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  viewerCountText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  
  durationContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  durationText: { color: "#aaa", fontSize: 12 },
  
  headerButton: { padding: 8, position: "relative" },
  badge: { position: "absolute", top: 2, right: 2, backgroundColor: "#ff4444", borderRadius: 6, minWidth: 14, height: 14, justifyContent: "center", alignItems: "center" },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  
  pinnedProductContainer: { position: "absolute", top: 110, left: 16, right: 16 },
  pinnedProductCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.9)", padding: 12, borderRadius: 12 },
  pinnedProductIcon: { fontSize: 36, marginRight: 12 },
  pinnedProductInfo: { flex: 1 },
  pinnedProductName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  pinnedProductPrices: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  pinnedProductPrice: { color: "#4CAF50", fontSize: 16, fontWeight: "bold" },
  pinnedProductOriginal: { color: "#888", fontSize: 12, textDecorationLine: "line-through", marginLeft: 8 },
  
  pkBattleContainer: { position: "absolute", top: 180, left: 16, right: 16 },
  pkBattleCard: { backgroundColor: "rgba(0,0,0,0.95)", borderRadius: 12, overflow: "hidden" },
  pkBattleHeader: { backgroundColor: "rgba(255,215,0,0.2)", padding: 8, alignItems: "center" },
  pkBattleTitle: { color: "#FFD700", fontSize: 14, fontWeight: "bold" },
  pkBattleContent: { flexDirection: "row", justifyContent: "space-around", padding: 16, alignItems: "center" },
  pkBattleSide: { alignItems: "center" },
  pkBattleScore: { color: "#4CAF50", fontSize: 32, fontWeight: "bold" },
  pkBattleLabel: { color: "#fff", fontSize: 12, marginTop: 4 },
  pkBattleVs: { color: "#FFD700", fontSize: 20, fontWeight: "bold" },
  pkBattleProgress: { height: 4, backgroundColor: "#333", marginHorizontal: 16, marginBottom: 12, borderRadius: 2 },
  pkBattleProgressBar: { height: "100%", backgroundColor: "#4CAF50", borderRadius: 2 },
  
  chatOverlay: { position: "absolute", bottom: 100, left: 16, right: 80 },
  chatMessage: { backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 6 },
  giftMessage: { backgroundColor: "rgba(255,215,0,0.2)" },
  chatUser: { color: "#FF6B6B", fontWeight: "bold", fontSize: 12 },
  chatText: { color: "#fff", fontSize: 12 },
  
  livestreamControls: { 
    position: "absolute", 
    bottom: 40, 
    left: 16, 
    right: 16, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 12,
    borderRadius: 30,
  },
  mediaControls: { flexDirection: "row", gap: 8 },
  mediaButton: { alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#333", borderRadius: 20 },
  mediaButtonOff: { backgroundColor: "#ff4444" },
  mediaButtonLabel: { color: "#fff", fontSize: 10, marginTop: 2 },
  
  goLiveButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, gap: 8 },
  startLiveButton: { backgroundColor: "#4CAF50" },
  stopLiveButton: { backgroundColor: "#ff4444" },
  goLiveButtonText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  
  leaveButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#333", justifyContent: "center", alignItems: "center" },
  
  viewerControls: { 
    position: "absolute", 
    bottom: 40, 
    left: 16, 
    right: 16, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 12,
    borderRadius: 30,
  },
  viewerActionButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#333", justifyContent: "center", alignItems: "center" },
  viewerLeaveButton: { backgroundColor: "#ff4444", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  viewerLeaveText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  
  reactionsPicker: { position: "absolute", bottom: 100, left: 16, flexDirection: "row", backgroundColor: "rgba(0,0,0,0.8)", borderRadius: 30, padding: 8, gap: 8 },
  reactionButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#333", justifyContent: "center", alignItems: "center" },
  reactionEmoji: { fontSize: 24 },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  
  chatModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, height: "60%" },
  chatItem: { padding: 12, marginHorizontal: 16, marginVertical: 4, borderRadius: 8 },
  chatItemUser: { fontWeight: "bold", fontSize: 13 },
  chatInputRow: { flexDirection: "row", padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" },
  chatInput: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14 },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  
  giftModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  giftGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  giftItem: { width: "30%", alignItems: "center", padding: 12, borderRadius: 12, backgroundColor: "#222", marginBottom: 12 },
  giftIcon: { fontSize: 32 },
  giftPrice: { color: "#FFD700", fontSize: 12, fontWeight: "600", marginTop: 4 },
  
  marketplaceModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: "70%" },
  productItem: { flexDirection: "row", alignItems: "center", padding: 12, marginHorizontal: 16, marginVertical: 6, borderRadius: 12 },
  productIcon: { fontSize: 40, marginRight: 12 },
  productDetails: { flex: 1 },
  productPrices: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  productPrice: { color: "#4CAF50", fontSize: 16, fontWeight: "bold" },
  productOriginal: { color: "#888", fontSize: 12, textDecorationLine: "line-through", marginLeft: 8 },
  discountBadge: { backgroundColor: "#ff4444", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  pinButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#333", justifyContent: "center", alignItems: "center" },
  pinButtonActive: { backgroundColor: "#4CAF50" },
  buyButton: { backgroundColor: "#4CAF50", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  buyButtonDisabled: { backgroundColor: "#666" },
  buyButtonText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  
  ordersModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: "60%" },
  ordersStats: { flexDirection: "row", paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  orderStatBox: { flex: 1, backgroundColor: "#222", padding: 16, borderRadius: 12, alignItems: "center" },
  orderStatValue: { color: "#4CAF50", fontSize: 24, fontWeight: "bold" },
  orderStatLabel: { color: "#888", fontSize: 12, marginTop: 4 },
  orderItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, marginHorizontal: 16, marginVertical: 4, borderRadius: 12 },
  orderBuyer: { color: "#888", fontSize: 12 },
  orderTotal: { color: "#4CAF50", fontSize: 14, fontWeight: "bold" },
  
  pkModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, height: "40%" },
  pkModalContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  pkModalEmoji: { fontSize: 60, marginBottom: 20 },
  startPkButton: { backgroundColor: "#4CAF50", paddingHorizontal: 32, paddingVertical: 16, borderRadius: 25 },
  startPkButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  endPkButton: { backgroundColor: "#ff4444", paddingHorizontal: 32, paddingVertical: 16, borderRadius: 25 },
  endPkButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default LivestreamScreen;