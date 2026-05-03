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
  Switch,
  Alert,
  Animated,
  Share,
} from "react-native";
import {
  StreamVideoClient,
  StreamVideo,
  User,
  LivestreamPlayer,
  Call,
  StreamCall,
  useCallStateHooks,
} from "@stream-io/video-react-native-sdk";
import { useAppTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { STREAM_API_KEY } from "../config/stream";
import { Ionicons } from "@expo/vector-icons";

interface LivestreamScreenProps {
  callId?: string;
  isHost?: boolean;
  onClose?: () => void;
}

const DEMO_USER_ID = "demo-host-user";
const DEMO_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZGVtby1ob3N0LXVzZXIiLCJzdWIiOiJ1c2VyL2Rtb2-taG9zdC11c2VyIiwiYXBpS2V5IjoiNnV3cjlyMnlweHc5IiwiaWF0IjoxNzc3ODI5NDYxLCJleHAiMTc3NzgzMzA2MX0.Z8kR8JQ5LhR6sKxYwGvT9nW4P2oE3yX7dK9mV1uT8cA";

interface ChatMessage {
  id: string;
  user: string;
  userId: string;
  message: string;
  timestamp: Date;
  isGift?: boolean;
  giftType?: string;
}

interface Gift {
  id: string;
  name: string;
  icon: string;
  price: number;
}

interface Reaction {
  type: string;
  emoji_code: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  inStock: boolean;
}

const SAMPLE_PRODUCTS: Product[] = [
  { id: "1", name: "Summer Dress", price: 49.99, originalPrice: 79.99, image: "👗", inStock: true },
  { id: "2", name: "Classic Jeans", price: 39.99, originalPrice: 59.99, image: "👖", inStock: true },
  { id: "3", name: "Leather Bag", price: 89.99, originalPrice: 129.99, image: "👜", inStock: true },
  { id: "4", name: "Sneakers", price: 59.99, image: "👟", inStock: true },
  { id: "5", name: "Silk Shirt", price: 34.99, originalPrice: 49.99, image: "👔", inStock: false },
  { id: "6", name: "Sunglasses", price: 24.99, image: "🕶️", inStock: true },
];

interface LiveOrder {
  id: string;
  productName: string;
  quantity: number;
  total: number;
  buyer: string;
  timestamp: Date;
}

const GIFTS: Gift[] = [
  { id: "1", name: "Rose", icon: "🌹", price: 1 },
  { id: "2", name: "Heart", icon: "❤️", price: 5 },
  { id: "3", name: "Star", icon: "⭐", price: 10 },
  { id: "4", name: "Diamond", icon: "💎", price: 50 },
  { id: "5", name: "Crown", icon: "👑", price: 100 },
  { id: "6", name: "Rocket", icon: "🚀", price: 200 },
];

const REACTIONS = [
  { type: "like", emoji: "👍", emoji_code: "thumbs_up" },
  { type: "love", emoji: "❤️", emoji_code: "heart" },
  { type: "fire", emoji: "🔥", emoji_code: "fire" },
  { type: "laugh", emoji: "😂", emoji_code: "laugh" },
  { type: "wow", emoji: "😮", emoji_code: "wow" },
  { type: "clap", emoji: "👏", emoji_code: "clap" },
];

const getTranslations = (lang: string) => ({
  connecting: lang === "ar" ? "جاري الاتصال..." : lang === "fr" ? "Connexion en cours..." : "Connecting...",
  joining: lang === "ar" ? "جاري الانضمام..." : lang === "fr" ? "Rejoindre..." : "Joining...",
  failedJoin: lang === "ar" ? "فشل في الانضمام" : lang === "fr" ? "Échec" : "Failed to join",
  goBack: lang === "ar" ? "رجوع" : lang === "fr" ? "Retour" : "Go Back",
  live: lang === "ar" ? "بث مباشر" : lang === "fr" ? "EN DIRECT" : "LIVE",
  backstage: lang === "ar" ? "إعداد" : lang === "fr" ? "PRÉPARATION" : "BACKSTAGE",
  youAreLive: lang === "ar" ? "أنت الآن بث مباشر!" : lang === "fr" ? "Vous êtes en direct!" : "You are now LIVE!",
  viewers: lang === "ar" ? "مشاهد" : lang === "fr" ? "spectateurs" : "viewers",
  camera: lang === "ar" ? "الكاميرا" : lang === "fr" ? "Caméra" : "Camera",
  mic: lang === "ar" ? "الميكروفون" : lang === "fr" ? "Micro" : "Mic",
  goLive: lang === "ar" ? "بدء البث" : lang === "fr" ? "Démarrer" : "Go Live",
  endLive: lang === "ar" ? "إنهاء البث" : lang === "fr" ? "Terminer" : "End Live",
  leave: lang === "ar" ? "مغادرة" : lang === "fr" ? "Quitter" : "Leave",
  chat: lang === "ar" ? "الدردشة" : lang === "fr" ? "Chat" : "Chat",
  sendGift: lang === "ar" ? "إرسال هدية" : lang === "fr" ? "Envoyer Cadeau" : "Send Gift",
  gifts: lang === "ar" ? "الهدايا" : lang === "fr" ? "Cadeaux" : "Gifts",
  giftSent: lang === "ar" ? "تم إرسال الهدية!" : lang === "fr" ? "Cadeau envoyé!" : "Gift Sent!",
  youSent: lang === "ar" ? "أرسلت" : lang === "fr" ? "Vous avez envoyé" : "You sent",
  saySomething: lang === "ar" ? "قل شيئاً..." : lang === "fr" ? "Dire quelque chose..." : "Say something...",
  settings: lang === "ar" ? "الإعدادات" : lang === "fr" ? "Paramètres" : "Settings",
  quality: lang === "ar" ? "الجودة" : lang === "fr" ? "Qualité" : "Quality",
  flipCamera: lang === "ar" ? "قلب الكاميرا" : lang === "fr" ? "Retourner caméra" : "Flip Camera",
  effects: lang === "ar" ? "التأثيرات" : lang === "fr" ? "Effets" : "Effects",
  share: lang === "ar" ? "مشاركة" : lang === "fr" ? "Partager" : "Share",
  cameraOff: lang === "ar" ? "الكاميرا مغلقة" : lang === "fr" ? "Caméra off" : "Camera Off",
  preview: lang === "ar" ? "معاينة" : lang === "fr" ? "Aperçu" : "Preview",
  yourVideo: lang === "ar" ? "معاينتك" : lang === "fr" ? "Votre vidéo" : "Your preview",
  send: lang === "ar" ? "إرسال" : lang === "fr" ? "Envoyer" : "Send",
  close: lang === "ar" ? "إغلاق" : lang === "fr" ? "Fermer" : "Close",
  notifications: lang === "ar" ? "الإشعارات" : lang === "fr" ? "Notifications" : "Notifications",
  recording: lang === "ar" ? "التسجيل" : lang === "fr" ? "Enregistrement" : "Recording",
  shareLink: lang === "ar" ? "مشاركة الرابط" : lang === "fr" ? "Partager le lien" : "Share Link",
  copyLink: lang === "ar" ? "نسخ الرابط" : lang === "fr" ? "Copier le lien" : "Copy Link",
  linkCopied: lang === "ar" ? "تم نسخ الرابط!" : lang === "fr" ? "Lien copié!" : "Link copied!",
  reactions: lang === "ar" ? "التفاعلات" : lang === "fr" ? "Réactions" : "Reactions",
  system: lang === "ar" ? "النظام" : lang === "fr" ? "Système" : "System",
  host: lang === "ar" ? "المضيف" : lang === "fr" ? "Hôte" : "Host",
  noiseCancellation: lang === "ar" ? "إلغاء الضوضاء" : lang === "fr" ? "Réduction bruit" : "Noise Cancellation",
  pip: lang === "ar" ? "صورة في صورة" : lang === "fr" ? "Image dans image" : "Picture in Picture",
  stats: lang === "ar" ? "الإحصائيات" : lang === "fr" ? "Statistiques" : "Stats",
  duration: lang === "ar" ? "المدة" : lang === "fr" ? "Durée" : "Duration",
  participants: lang === "ar" ? "المشاركون" : lang === "fr" ? "Participants" : "Participants",
  products: lang === "ar" ? "المنتجات" : lang === "fr" ? "Produits" : "Products",
  addToCart: lang === "ar" ? "أضف للسلة" : lang === "fr" ? "Ajouter au panier" : "Add to Cart",
  buyNow: lang === "ar" ? "شراء الآن" : lang === "fr" ? "Acheter" : "Buy Now",
  outOfStock: lang === "ar" ? "نفذت الكمية" : lang === "fr" ? "Rupture" : "Out of Stock",
  featured: lang === "ar" ? "مميز" : lang === "fr" ? "En vedette" : "Featured",
  orders: lang === "ar" ? "الطلبات" : lang === "fr" ? "Commandes" : "Orders",
  sales: lang === "ar" ? "المبيعات" : lang === "fr" ? "Ventes" : "Sales",
  revenue: lang === "ar" ? "الإيرادات" : lang === "fr" ? "Revenu" : "Revenue",
  totalOrders: lang === "ar" ? "إجمالي الطلبات" : lang === "fr" ? "Total commandes" : "Total Orders",
  cart: lang === "ar" ? "السلة" : lang === "fr" ? "Panier" : "Cart",
  checkout: lang === "ar" ? "الدفع" : lang === "fr" ? "Paiement" : "Checkout",
  added: lang === "ar" ? "تمت الإضافة!" : lang === "fr" ? "Ajouté!" : "Added!",
  pinProduct: lang === "ar" ? "تثبيت المنتج" : lang === "fr" ? "Épingler" : "Pin Product",
  unpin: lang === "ar" ? "إلغاء التثبيت" : lang === "fr" ? "Désépingler" : "Unpin",
  showProduct: lang === "ar" ? "عرض المنتج" : lang === "fr" ? "Afficher" : "Show Product",
  hideProduct: lang === "ar" ? "إخفاء" : lang === "fr" ? "Masquer" : "Hide",
  viewProduct: lang === "ar" ? "عرض" : lang === "fr" ? "Voir" : "View",
  discount: lang === "ar" ? "خصم" : lang === "fr" ? "Réduction" : "Discount",
  limitedOffer: lang === "ar" ? "عرض محدود" : lang === "fr" ? "Offre limitée" : "Limited Offer",
  marketplace: lang === "ar" ? "المتجر" : lang === "fr" ? "Boutique" : "Marketplace",
});

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

  const translations = getTranslations("en");

  useEffect(() => {
    const initClient = async () => {
      try {
        const user: User = {
          id: DEMO_USER_ID,
          name: "Demo Host",
        };
        const newClient = StreamVideoClient.getOrCreateInstance({
          apiKey: STREAM_API_KEY,
          user,
          token: DEMO_TOKEN,
        });
        setClient(newClient);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to initialize video client");
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
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>{translations.connecting}</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: "#000" }]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>{translations.goBack}</Text>
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
        translations={translations}
      />
    </StreamVideo>
  );
};

interface StreamCallWrapperProps {
  callId: string;
  isHost: boolean;
  colors: any;
  onLeave: () => void;
  translations: any;
}

const StreamCallWrapper: React.FC<StreamCallWrapperProps> = ({
  callId,
  isHost,
  colors,
  onLeave,
  translations,
}) => {
  const [call, setCall] = useState<Call | null>(null);
  const [isJoining, setIsJoining] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<"good" | "fair" | "poor">("good");
  const [isRecording, setIsRecording] = useState(false);
  const [showPip, setShowPip] = useState(false);
  const durationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const user: User = {
      id: DEMO_USER_ID,
      name: "Demo User",
    };
    const client = StreamVideoClient.getOrCreateInstance({
      apiKey: STREAM_API_KEY,
      user,
      token: DEMO_TOKEN,
    });
    const newCall = client.call("livestream", callId);

    newCall.join({ create: isHost })
      .then(() => {
        setCall(newCall);
        setIsLive(false);
        setParticipantCount(Math.floor(Math.random() * 30) + 5);
        setIsJoining(false);
        // Start duration timer
        durationRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      })
      .catch((err) => {
        console.error("Failed to join call:", err);
        setIsJoining(false);
      });

    return () => {
      if (durationRef.current) clearInterval(durationRef.current);
      newCall.leave().catch(console.error);
    };
  }, [callId, isHost]);

  if (isJoining) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: "#000" }]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>{translations.joining}</Text>
      </SafeAreaView>
    );
  }

  if (!call) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: "#000" }]}>
        <Text style={styles.errorText}>{translations.failedJoin}</Text>
        <TouchableOpacity style={styles.button} onPress={onLeave}>
          <Text style={styles.buttonText}>{translations.goBack}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <StreamCall call={call}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {isHost ? (
          <HostView 
            call={call}
            colors={colors}
            isLive={isLive}
            setIsLive={setIsLive}
            viewerCount={participantCount}
            callDuration={callDuration}
            networkQuality={networkQuality}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            onLeave={onLeave}
            translations={translations}
          />
        ) : (
          <ViewerView 
            callId={callId}
            colors={colors}
            isLive={isLive}
            viewerCount={participantCount}
            callDuration={callDuration}
            networkQuality={networkQuality}
            onLeave={onLeave}
            translations={translations}
          />
        )}
      </KeyboardAvoidingView>
    </StreamCall>
  );
};

interface HostViewProps {
  call: Call;
  colors: any;
  isLive: boolean;
  setIsLive: (v: boolean) => void;
  viewerCount: number;
  callDuration: number;
  networkQuality: "good" | "fair" | "poor";
  isRecording: boolean;
  setIsRecording: (v: boolean) => void;
  onLeave: () => void;
  translations: any;
}

const HostView: React.FC<HostViewProps> = ({ 
  call, 
  colors,
  isLive, 
  setIsLive,
  viewerCount,
  callDuration,
  networkQuality,
  isRecording,
  setIsRecording,
  onLeave,
  translations,
}) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", user: translations.system, userId: "system", message: translations.youAreLive, timestamp: new Date() },
  ]);
  const [messageText, setMessageText] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [facingFront, setFacingFront] = useState(true);
  const [quality, setQuality] = useState<"auto" | "hd" | "sd">("auto");
  const [effectsOn, setEffectsOn] = useState(false);
  const [noiseCancellation, setNoiseCancellation] = useState(true);
  const [activeReactions, setActiveReactions] = useState<{[key: string]: Reaction}>({});
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [pinnedProduct, setPinnedProduct] = useState<Product | null>(null);
  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);
  const [cartItems, setCartItems] = useState<number>(0);
  const products = SAMPLE_PRODUCTS;

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleGoLive = useCallback(async () => {
    try {
      await call.goLive();
      setIsLive(true);
      setChatMessages(prev => [...prev, { id: Date.now().toString(), user: translations.system, userId: "system", message: translations.youAreLive, timestamp: new Date() }]);
    } catch (err) {
      console.error("Failed to go live:", err);
    }
  }, [call, translations]);

  const handleStopLive = useCallback(async () => {
    try {
      await call.stopLive();
      setIsLive(false);
    } catch (err) {
      console.error("Failed to stop live:", err);
    }
  }, [call]);

  const handleToggleRecording = useCallback(async () => {
    try {
      if (isRecording) {
        await call.stopRecording();
        setIsRecording(false);
        Alert.alert(translations.recording, "Recording stopped!");
      } else {
        await call.startRecording();
        setIsRecording(true);
        Alert.alert(translations.recording, "Recording started!");
      }
    } catch (err) {
      console.error("Recording error:", err);
      Alert.alert("Error", "Could not toggle recording");
    }
  }, [call, isRecording, translations]);

  const handleSendReaction = useCallback(async (reaction: typeof REACTIONS[0]) => {
    try {
      await call.sendReaction({
        type: reaction.type,
        emoji_code: reaction.emoji_code,
      });
      setActiveReactions(prev => ({ ...prev, [Date.now().toString()]: { type: reaction.type, emoji_code: reaction.emoji_code } }));
      // Clear reaction after 3 seconds
      setTimeout(() => {
        setActiveReactions(prev => {
          const newReactions = { ...prev };
          delete newReactions[Object.keys(prev).find(key => prev[key].type === reaction.type) || ""];
          return newReactions;
        });
      }, 3000);
    } catch (err) {
      console.error("Failed to send reaction:", err);
    }
  }, [call]);

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      user: `${translations.host} (You)`,
      userId: DEMO_USER_ID,
      message: messageText,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newMsg]);
    setMessageText("");
  }, [messageText, translations]);

  const handleSendGift = useCallback((gift: Gift) => {
    const giftMsg: ChatMessage = {
      id: Date.now().toString(),
      user: `${translations.host} (You)`,
      userId: DEMO_USER_ID,
      message: `${translations.youSent} ${gift.icon} ${gift.name}`,
      timestamp: new Date(),
      isGift: true,
      giftType: gift.id,
    };
    setChatMessages(prev => [...prev, giftMsg]);
    setShowGifts(false);
    Alert.alert(translations.giftSent, `${translations.youSent} ${gift.name} ${gift.icon}!`);
  }, [translations]);

  const handleShare = useCallback(async () => {
    try {
      const shareUrl = `tama://livestream/${call.id}`;
      await Share.share({
        message: `Join my livestream! ${shareUrl}`,
        title: "Livestream",
      });
    } catch (err) {
      console.error("Share error:", err);
    }
  }, []);

  const handlePinProduct = useCallback((product: Product | null) => {
    setPinnedProduct(product);
    if (product) {
      setChatMessages(prev => [...prev, { id: Date.now().toString(), user: translations.system, userId: "system", message: `📦 ${product.name} - $${product.price} ${product.originalPrice ? `(Save $${(product.originalPrice - product.price).toFixed(2)})` : ""}`, timestamp: new Date() }]);
    }
  }, [translations]);

  const handleAddToCart = useCallback((product: Product) => {
    const order: LiveOrder = {
      id: Date.now().toString(),
      productName: product.name,
      quantity: 1,
      total: product.price,
      buyer: "Viewer " + Math.floor(Math.random() * 100),
      timestamp: new Date(),
    };
    setLiveOrders(prev => [order, ...prev]);
    setCartItems(prev => prev + 1);
    setChatMessages(prev => [...prev, { id: Date.now().toString(), user: translations.system, userId: "system", message: `🛒 ${order.buyer} bought ${product.name}!`, timestamp: new Date() }]);
  }, [translations]);

  // Simulate incoming messages and reactions
  useEffect(() => {
    const messages = {
      en: ["Great stream!", "Love it! 🔥", "Amazing!", "Keep going!", "👏👏👏"],
      fr: ["Super!", "J'adore! 🔥", "Incroyable!", "Continuez!", "👏👏👏"],
      ar: ["رائع!", "أحب هذا! 🔥", "مذهل!", "استمر!", "👏👏👏"],
    };
    const names = { en: ["Alex", "Maria", "John", "Sarah", "Emma"], fr: ["Alex", "Marie", "Jean", "Sophie", "Emma"], ar: ["أحمد", "مريم", "يونس", "سارة", "Emma"] };
    const lang = "en";
    const interval = setInterval(() => {
      const randMsg = { id: Date.now().toString(), user: names[lang as keyof typeof names][Math.floor(Math.random() * names[lang as keyof typeof names].length)], userId: "viewer-" + Math.random(), message: messages[lang as keyof typeof messages][Math.floor(Math.random() * messages[lang as keyof typeof messages].length)], timestamp: new Date() };
      setChatMessages(prev => [...prev.slice(-50), randMsg]);
      // Randomly send a reaction
      if (Math.random() > 0.7) {
        const reaction = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
        setActiveReactions(prev => ({ ...prev, [Date.now().toString()]: { type: reaction.type, emoji_code: reaction.emoji_code } }));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.hostContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.liveBadge, { backgroundColor: isLive ? "#ff4444" : "#666" }]}>
            <Text style={styles.liveBadgeText}>{isLive ? `🔴 ${translations.live}` : `⏸ ${translations.backstage}`}</Text>
          </View>
          <View style={styles.viewerCountBadge}><Ionicons name="eye" size={14} color="#fff" /><Text style={styles.viewerCountText}>{viewerCount}</Text></View>
          <View style={styles.durationBadge}><Ionicons name="time" size={12} color="#fff" /><Text style={styles.durationText}>{formatDuration(callDuration)}</Text></View>
          {isRecording && <View style={styles.recordingBadge}><View style={styles.recordingDot} /><Text style={styles.recordingText}>REC</Text></View>}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowStats(!showStats)}>
            <Ionicons name="stats-chart" size={22} color={networkQuality === "good" ? "#4CAF50" : networkQuality === "fair" ? "#FFC107" : "#f44336"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleToggleRecording}>
            <Ionicons name={isRecording ? "stop-circle" : "radio-button-on"} size={22} color={isRecording ? "#f44336" : "#fff"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowReactions(!showReactions)}>
            <Ionicons name="happy-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowSettings(true)}>
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowGifts(true)}>
            <Ionicons name="gift-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowMarketplace(!showMarketplace)}>
            <Ionicons name="storefront-outline" size={22} color={showMarketplace ? colors.primary : "#fff"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowOrders(!showOrders)}>
            <View style={styles.orderBadgeContainer}>
              <Ionicons name="receipt-outline" size={22} color="#fff" />
              {liveOrders.length > 0 && <View style={styles.orderBadge}><Text style={styles.orderBadgeText}>{liveOrders.length}</Text></View>}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowChat(!showChat)}>
            <Ionicons name="chatbubbles" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={onLeave}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pinned Product Card */}
      {pinnedProduct && (
        <View style={styles.pinnedProductCard}>
          <View style={styles.pinnedProductContent}>
            <Text style={styles.pinnedProductIcon}>{pinnedProduct.image}</Text>
            <View style={styles.pinnedProductInfo}>
              <Text style={styles.pinnedProductName}>{pinnedProduct.name}</Text>
              <View style={styles.pinnedProductPriceRow}>
                <Text style={styles.pinnedProductPrice}>${pinnedProduct.price.toFixed(2)}</Text>
                {pinnedProduct.originalPrice && <Text style={styles.pinnedProductOriginalPrice}>${pinnedProduct.originalPrice.toFixed(2)}</Text>}
              </View>
            </View>
            <TouchableOpacity style={styles.unpinBtn} onPress={() => setPinnedProduct(null)}>
              <Ionicons name="close-circle" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Active Reactions Display */}
      {Object.keys(activeReactions).length > 0 && (
        <View style={styles.reactionsContainer}>
          {Object.values(activeReactions).map((r, i) => (
            <Text key={i} style={styles.floatingReaction}>{REACTIONS.find(x => x.emoji_code === r.emoji_code)?.emoji}</Text>
          ))}
        </View>
      )}

      {/* Video Preview */}
      <View style={styles.videoContainer}>
        {cameraOn ? (
          <View style={styles.cameraPreview}>
            <Text style={styles.previewText}>📹 {translations.preview}</Text>
            <Text style={styles.previewSubtext}>{translations.yourVideo}</Text>
          </View>
        ) : (
          <View style={[styles.cameraPreview, { backgroundColor: "#1a1a1a" }]}>
            <Ionicons name="videocam-off" size={64} color="#444" />
            <Text style={[styles.previewSubtext, { marginTop: 16 }]}>{translations.cameraOff}</Text>
          </View>
        )}
      </View>

      {/* Control Bar */}
      <View style={styles.controlBar}>
        <View style={styles.controlsRow}>
          <TouchableOpacity style={[styles.controlBtn, !cameraOn && styles.controlBtnOff]} onPress={() => setCameraOn(!cameraOn)}>
            <Ionicons name={cameraOn ? "videocam" : "videocam-off"} size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, !micOn && styles.controlBtnOff]} onPress={() => setMicOn(!micOn)}>
            <Ionicons name={micOn ? "mic" : "mic-off"} size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, !facingFront && styles.controlBtnActive]} onPress={() => setFacingFront(!facingFront)}>
            <Ionicons name="camera-reverse" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, effectsOn && styles.controlBtnActive]} onPress={() => setEffectsOn(!effectsOn)}>
            <Ionicons name="sparkles" size={22} color={effectsOn ? "#FFD700" : "#fff"} />
          </TouchableOpacity>
          {isLive ? (
            <TouchableOpacity style={[styles.mainBtn, styles.stopBtn]} onPress={handleStopLive}>
              <Ionicons name="stop" size={22} color="#fff" /><Text style={styles.mainBtnText}>{translations.endLive}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.mainBtn, styles.goLiveBtn]} onPress={handleGoLive}>
              <Ionicons name="radio-button-on" size={22} color="#fff" /><Text style={styles.mainBtnText}>{translations.goLive}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Overlay */}
      {showStats && (
        <View style={[styles.statsOverlay, { backgroundColor: "rgba(0,0,0,0.9)" }]}>
          <View style={styles.statsContent}>
            <Text style={styles.statsTitle}>{translations.stats}</Text>
            <View style={styles.statRow}><Text style={styles.statLabel}>{translations.duration}:</Text><Text style={styles.statValue}>{formatDuration(callDuration)}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>{translations.participants}:</Text><Text style={styles.statValue}>{viewerCount}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Network:</Text><Text style={[styles.statValue, { color: networkQuality === "good" ? "#4CAF50" : networkQuality === "fair" ? "#FFC107" : "#f44336" }]}>{networkQuality.toUpperCase()}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>{translations.quality}:</Text><Text style={styles.statValue}>{quality.toUpperCase()}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>{translations.recording}:</Text><Text style={[styles.statValue, { color: isRecording ? "#f44336" : "#4CAF50" }]}>{isRecording ? "ON" : "OFF"}</Text></View>
            <TouchableOpacity style={styles.closeStatsBtn} onPress={() => setShowStats(false)}><Text style={styles.closeStatsBtnText}>{translations.close}</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {/* Reactions Picker */}
      {showReactions && (
        <View style={styles.reactionsPicker}>
          {REACTIONS.map((r) => (
            <TouchableOpacity key={r.type} style={styles.reactionBtn} onPress={() => { handleSendReaction(r); setShowReactions(false); }}>
              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Chat Overlay */}
      {showChat && (
        <View style={[styles.chatOverlay, { backgroundColor: "rgba(0,0,0,0.85)" }]}>
          <View style={styles.chatHeader}><Text style={styles.chatTitle}>{translations.chat}</Text><TouchableOpacity onPress={() => setShowChat(false)}><Ionicons name="close" size={20} color="#fff" /></TouchableOpacity></View>
          <FlatList data={chatMessages} keyExtractor={(item) => item.id} renderItem={({ item }) => (
            <View style={[styles.chatMsg, item.isGift && styles.giftMsg]}>
              <Text style={[styles.msgUser, { color: item.userId === DEMO_USER_ID ? "#4CAF50" : "#FF6B6B" }]}>{item.user}:</Text>
              <Text style={styles.msgText}>{item.message}</Text>
            </View>
          )} />
          <View style={styles.chatInputRow}>
            <TextInput style={styles.chatInput} placeholder={translations.saySomething} placeholderTextColor="#666" value={messageText} onChangeText={setMessageText} onSubmitEditing={handleSendMessage} />
            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={handleSendMessage}><Ionicons name="send" size={18} color="#fff" /></TouchableOpacity>
          </View>
        </View>
      )}

      {/* Gifts Modal */}
      <Modal visible={showGifts} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowGifts(false)}>
          <View style={[styles.giftModal, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{translations.gifts}</Text>
            <View style={styles.giftGrid}>
              {GIFTS.map((gift) => (
                <TouchableOpacity key={gift.id} style={styles.giftItem} onPress={() => handleSendGift(gift)}>
                  <Text style={styles.giftIcon}>{gift.icon}</Text>
                  <Text style={[styles.giftName, { color: colors.foreground }]}>{gift.name}</Text>
                  <Text style={styles.giftPrice}>${gift.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSettings(false)}>
          <View style={[styles.settingsModal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>{translations.settings}</Text><TouchableOpacity onPress={() => setShowSettings(false)}><Ionicons name="close" size={24} color={colors.foreground} /></TouchableOpacity></View>
            <ScrollView style={styles.settingsList}>
              <View style={styles.settingRow}><Text style={[styles.settingLabel, { color: colors.foreground }]}>{translations.quality}</Text><View style={styles.qualityBtns}>{(["auto", "hd", "sd"] as const).map((q) => (<TouchableOpacity key={q} style={[styles.qualityBtn, quality === q && { backgroundColor: colors.primary }]} onPress={() => setQuality(q)}><Text style={[styles.qualityBtnText, quality === q && { color: "#fff" }]}>{q.toUpperCase()}</Text></TouchableOpacity>))}</View></View>
              <View style={styles.settingRow}><Text style={[styles.settingLabel, { color: colors.foreground }]}>{translations.flipCamera}</Text><Switch value={facingFront} onValueChange={setFacingFront} trackColor={{ false: "#666", true: colors.primary }} /></View>
              <View style={styles.settingRow}><Text style={[styles.settingLabel, { color: colors.foreground }]}>{translations.effects}</Text><Switch value={effectsOn} onValueChange={setEffectsOn} trackColor={{ false: "#666", true: colors.primary }} /></View>
              <View style={styles.settingRow}><Text style={[styles.settingLabel, { color: colors.foreground }]}>{translations.noiseCancellation}</Text><Switch value={noiseCancellation} onValueChange={setNoiseCancellation} trackColor={{ false: "#666", true: colors.primary }} /></View>
              <TouchableOpacity style={styles.settingRow} onPress={handleShare}><Text style={[styles.settingLabel, { color: colors.foreground }]}>{translations.share}</Text><Ionicons name="share-outline" size={24} color={colors.foreground} /></TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Marketplace Modal */}
      <Modal visible={showMarketplace} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMarketplace(false)}>
          <View style={[styles.marketplaceModal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{translations.marketplace}</Text>
              <TouchableOpacity onPress={() => setShowMarketplace(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.productsList}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{translations.products}</Text>
              {products.map((product) => (
                <View key={product.id} style={[styles.productCard, { backgroundColor: colors.card }]}>
                  <Text style={styles.productIcon}>{product.image}</Text>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
                    <View style={styles.productPriceRow}>
                      <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                      {product.originalPrice && (
                        <Text style={styles.productOriginalPrice}>${product.originalPrice.toFixed(2)}</Text>
                      )}
                      {product.originalPrice && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>{translations.discount}</Text>
                        </View>
                      )}
                    </View>
                    {!product.inStock && <Text style={styles.outOfStockText}>{translations.outOfStock}</Text>}
                  </View>
                  <View style={styles.productActions}>
                    <TouchableOpacity 
                      style={[styles.pinProductBtn, pinnedProduct?.id === product.id && styles.pinnedBtn]} 
                      onPress={() => handlePinProduct(pinnedProduct?.id === product.id ? null : product)}
                    >
                      <Ionicons name={pinnedProduct?.id === product.id ? "pin" : "pin-outline"} size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Live Orders Panel */}
      <Modal visible={showOrders} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOrders(false)}>
          <View style={[styles.ordersPanel, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{translations.orders}</Text>
              <TouchableOpacity onPress={() => setShowOrders(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <View style={styles.ordersStats}>
              <View style={styles.orderStatBox}>
                <Text style={styles.orderStatValue}>{liveOrders.length}</Text>
                <Text style={styles.orderStatLabel}>{translations.totalOrders}</Text>
              </View>
              <View style={styles.orderStatBox}>
                <Text style={styles.orderStatValue}>${liveOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}</Text>
                <Text style={styles.orderStatLabel}>{translations.revenue}</Text>
              </View>
            </View>
            <ScrollView style={styles.ordersList}>
              {liveOrders.length === 0 ? (
                <Text style={[styles.noOrdersText, { color: colors.foreground }]}>No orders yet</Text>
              ) : (
                liveOrders.map((order) => (
                  <View key={order.id} style={[styles.orderItem, { backgroundColor: colors.card }]}>
                    <View style={styles.orderInfo}>
                      <Text style={[styles.orderProduct, { color: colors.foreground }]}>{order.productName}</Text>
                      <Text style={styles.orderBuyer}>👤 {order.buyer}</Text>
                    </View>
                    <View style={styles.orderRight}>
                      <Text style={styles.orderQuantity}>x{order.quantity}</Text>
                      <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

interface ViewerViewProps {
  callId: string;
  colors: any;
  isLive: boolean;
  viewerCount: number;
  callDuration: number;
  networkQuality: "good" | "fair" | "poor";
  onLeave: () => void;
  translations: any;
}

const ViewerView: React.FC<ViewerViewProps> = ({
  callId,
  colors,
  isLive,
  viewerCount,
  callDuration,
  networkQuality,
  onLeave,
  translations,
}) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", user: translations.host, userId: "host", message: "Welcome everyone! 🎉", timestamp: new Date() },
    { id: "2", user: translations.system, userId: "system", message: "Send gifts to support the host!", timestamp: new Date() },
  ]);
  const [messageText, setMessageText] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [showGifts, setShowGifts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [quality, setQuality] = useState<"auto" | "hd" | "sd">("auto");
  const [activeReactions, setActiveReactions] = useState<{[key: string]: Reaction}>({});
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [pinnedProduct, setPinnedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const products = SAMPLE_PRODUCTS;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim()) return;
    const newMsg: ChatMessage = { id: Date.now().toString(), user: "You", userId: "viewer-" + Date.now(), message: messageText, timestamp: new Date() };
    setChatMessages(prev => [...prev, newMsg]);
    setMessageText("");
  }, [messageText]);

  const handleSendGift = useCallback((gift: Gift) => {
    const giftMsg: ChatMessage = { id: Date.now().toString(), user: "You", userId: "viewer", message: `${translations.youSent} ${gift.icon} ${gift.name}`, timestamp: new Date(), isGift: true, giftType: gift.id };
    setChatMessages(prev => [...prev, giftMsg]);
    setShowGifts(false);
    Alert.alert(translations.giftSent, `${translations.youSent} ${gift.name} ${gift.icon}!`);
  }, [translations]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ message: `Join my livestream! tama://livestream/${callId}`, title: "Livestream" });
    } catch (err) {}
  }, [callId]);

  const handleAddToCart = useCallback((product: Product) => {
    if (!product.inStock) return;
    setChatMessages(prev => [...prev, { id: Date.now().toString(), user: translations.system, userId: "system", message: `🛒 You added ${product.name} to cart!`, timestamp: new Date() }]);
    Alert.alert(translations.added, `${product.name} ${product.image} - $${product.price.toFixed(2)}`);
  }, [translations]);

  // Simulate messages and reactions
  useEffect(() => {
    const messages = { en: ["Awesome! 🔥", "Love this!", "Great content", "👏👏", "❤️❤️", "Wow!"], fr: ["Incroyable! 🔥", "J'adore!", "Super contenu", "👏👏", "❤️❤️", "Wah!"], ar: ["مذهل! 🔥", "أحب هذا!", "محتوى رائع", "👏👏", "❤️❤️", "واو!"] };
    const names = { en: ["Fan123", "Viewer99", "Alex", "Maria", "John"], fr: ["Fan123", "Spectateur99", "Alex", "Marie", "Jean"], ar: ["مشجع99", "مشاهد77", "أحمد", "مريم", "يونس"] };
    const lang = "en";
    const interval = setInterval(() => {
      const randMsg = { id: Date.now().toString(), user: names[lang as keyof typeof names][Math.floor(Math.random() * names[lang as keyof typeof names].length)], userId: "viewer-" + Math.random(), message: messages[lang as keyof typeof messages][Math.floor(Math.random() * messages[lang as keyof typeof messages].length)], timestamp: new Date() };
      setChatMessages(prev => [...prev.slice(-50), randMsg]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.viewerContainer}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.liveBadge, { backgroundColor: "#ff4444" }]}><Text style={styles.liveBadgeText}>🔴 {translations.live}</Text></View>
          <View style={styles.viewerCountBadge}><Ionicons name="eye" size={14} color="#fff" /><Text style={styles.viewerCountText}>{viewerCount}</Text></View>
          <View style={styles.durationBadge}><Ionicons name="time" size={12} color="#fff" /><Text style={styles.durationText}>{formatDuration(callDuration)}</Text></View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowStats(!showStats)}>
            <Ionicons name="stats-chart" size={22} color={networkQuality === "good" ? "#4CAF50" : networkQuality === "fair" ? "#FFC107" : "#f44336"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowReactions(!showReactions)}>
            <Ionicons name="happy-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowSettings(true)}>
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowGifts(true)}>
            <Ionicons name="gift-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowMarketplace(!showMarketplace)}>
            <Ionicons name="storefront-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowChat(!showChat)}>
            <Ionicons name="chatbubbles" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={onLeave}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Reactions */}
      {Object.keys(activeReactions).length > 0 && (
        <View style={styles.reactionsContainer}>
          {Object.values(activeReactions).map((r, i) => (
            <Text key={i} style={styles.floatingReaction}>{REACTIONS.find(x => x.emoji_code === r.emoji_code)?.emoji}</Text>
          ))}
        </View>
      )}

      {/* Pinned Product Card - Viewer */}
      {pinnedProduct && (
        <View style={styles.viewerPinnedProduct}>
          <View style={styles.viewerPinnedContent}>
            <Text style={styles.viewerPinnedIcon}>{pinnedProduct.image}</Text>
            <View style={styles.viewerPinnedInfo}>
              <Text style={styles.viewerPinnedName}>{pinnedProduct.name}</Text>
              <View style={styles.viewerPinnedPriceRow}>
                <Text style={styles.viewerPinnedPrice}>${pinnedProduct.price.toFixed(2)}</Text>
                {pinnedProduct.originalPrice && <Text style={styles.viewerPinnedOriginal}>${pinnedProduct.originalPrice.toFixed(2)}</Text>}
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.buyNowBtn, !pinnedProduct.inStock && styles.buyNowBtnDisabled]} 
              disabled={!pinnedProduct.inStock}
              onPress={() => handleAddToCart(pinnedProduct)}
            >
              <Text style={styles.buyNowBtnText}>{pinnedProduct.inStock ? translations.buyNow : translations.outOfStock}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.videoContainer}>
        <LivestreamPlayer callType="livestream" callId={callId} />
      </View>

      <View style={styles.bottomActions}>
        <View style={styles.actionBtns}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowReactions(true)}><Ionicons name="happy" size={24} color="#fff" /><Text style={styles.actionBtnText}>{translations.reactions}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowGifts(true)}><Ionicons name="gift" size={24} color="#fff" /><Text style={styles.actionBtnText}>{translations.sendGift}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowChat(!showChat)}><Ionicons name="chatbubble" size={24} color="#fff" /><Text style={styles.actionBtnText}>{translations.chat}</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.leaveBtn} onPress={onLeave}><Text style={styles.leaveBtnText}>{translations.leave}</Text></TouchableOpacity>
      </View>

      {/* Stats Overlay */}
      {showStats && (
        <View style={[styles.statsOverlay, { backgroundColor: "rgba(0,0,0,0.9)" }]}>
          <View style={styles.statsContent}>
            <Text style={styles.statsTitle}>{translations.stats}</Text>
            <View style={styles.statRow}><Text style={styles.statLabel}>{translations.duration}:</Text><Text style={styles.statValue}>{formatDuration(callDuration)}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>{translations.participants}:</Text><Text style={styles.statValue}>{viewerCount}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Network:</Text><Text style={[styles.statValue, { color: networkQuality === "good" ? "#4CAF50" : networkQuality === "fair" ? "#FFC107" : "#f44336" }]}>{networkQuality.toUpperCase()}</Text></View>
            <TouchableOpacity style={styles.closeStatsBtn} onPress={() => setShowStats(false)}><Text style={styles.closeStatsBtnText}>{translations.close}</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {/* Reactions Picker */}
      {showReactions && (
        <View style={styles.reactionsPicker}>
          {REACTIONS.map((r) => (
            <TouchableOpacity key={r.type} style={styles.reactionBtn} onPress={() => { setActiveReactions(prev => ({ ...prev, [Date.now().toString()]: { type: r.type, emoji_code: r.emoji_code } })); setTimeout(() => setShowReactions(false), 100); }}>
              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showChat && (
        <View style={[styles.chatOverlay, styles.viewerChat, { backgroundColor: "rgba(0,0,0,0.85)" }]}>
          <View style={styles.chatHeader}><Text style={styles.chatTitle}>{translations.chat}</Text><TouchableOpacity onPress={() => setShowChat(false)}><Ionicons name="chevron-down" size={20} color="#fff" /></TouchableOpacity></View>
          <FlatList data={chatMessages} keyExtractor={(item) => item.id} renderItem={({ item }) => (
            <View style={[styles.chatMsg, item.isGift && styles.giftMsg]}>
              <Text style={[styles.msgUser, { color: item.userId === "host" ? "#FFD700" : "#FF6B6B" }]}>{item.user}:</Text>
              <Text style={styles.msgText}>{item.message}</Text>
            </View>
          )} />
          <View style={styles.chatInputRow}>
            <TextInput style={styles.chatInput} placeholder={translations.saySomething} placeholderTextColor="#666" value={messageText} onChangeText={setMessageText} onSubmitEditing={handleSendMessage} />
            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={handleSendMessage}><Ionicons name="send" size={18} color="#fff" /></TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={showGifts} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowGifts(false)}>
          <View style={[styles.giftModal, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{translations.gifts}</Text>
            <View style={styles.giftGrid}>{GIFTS.map((gift) => (<TouchableOpacity key={gift.id} style={styles.giftItem} onPress={() => handleSendGift(gift)}><Text style={styles.giftIcon}>{gift.icon}</Text><Text style={[styles.giftName, { color: colors.foreground }]}>{gift.name}</Text><Text style={styles.giftPrice}>${gift.price}</Text></TouchableOpacity>))}</View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showSettings} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSettings(false)}>
          <View style={[styles.settingsModal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>{translations.settings}</Text><TouchableOpacity onPress={() => setShowSettings(false)}><Ionicons name="close" size={24} color={colors.foreground} /></TouchableOpacity></View>
            <ScrollView style={styles.settingsList}>
              <View style={styles.settingRow}><Text style={[styles.settingLabel, { color: colors.foreground }]}>{translations.quality}</Text><View style={styles.qualityBtns}>{(["auto", "hd", "sd"] as const).map((q) => (<TouchableOpacity key={q} style={[styles.qualityBtn, quality === q && { backgroundColor: colors.primary }]} onPress={() => setQuality(q)}><Text style={[styles.qualityBtnText, quality === q && { color: "#fff" }]}>{q.toUpperCase()}</Text></TouchableOpacity>))}</View></View>
              <TouchableOpacity style={styles.settingRow} onPress={handleShare}><Text style={[styles.settingLabel, { color: colors.foreground }]}>{translations.share}</Text><Ionicons name="share-outline" size={24} color={colors.foreground} /></TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Marketplace Modal - Viewer */}
      <Modal visible={showMarketplace} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMarketplace(false)}>
          <View style={[styles.marketplaceModal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{translations.marketplace}</Text>
              <TouchableOpacity onPress={() => setShowMarketplace(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.productsList}>
              {products.map((product) => (
                <View key={product.id} style={[styles.viewerProductCard, { backgroundColor: colors.card }]}>
                  <Text style={styles.productIcon}>{product.image}</Text>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
                    <View style={styles.productPriceRow}>
                      <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                      {product.originalPrice && (
                        <Text style={styles.productOriginalPrice}>${product.originalPrice.toFixed(2)}</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={[styles.addToCartBtn, !product.inStock && styles.addToCartBtnDisabled]} 
                    disabled={!product.inStock}
                    onPress={() => { handleAddToCart(product); setShowMarketplace(false); }}
                  >
                    <Ionicons name="cart-outline" size={18} color="#fff" />
                    <Text style={styles.addToCartBtnText}>{product.inStock ? translations.addToCart : translations.outOfStock}</Text>
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
  hostContainer: { flex: 1, backgroundColor: "#000" },
  viewerContainer: { flex: 1, backgroundColor: "#000" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: "rgba(0,0,0,0.6)" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 2 },
  headerBtn: { padding: 8 },
  liveBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  liveBadgeText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  viewerCountBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  viewerCountText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  durationBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  durationText: { color: "#aaa", fontSize: 12 },
  recordingBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,0,0,0.3)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 4 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#f44336" },
  recordingText: { color: "#f44336", fontSize: 10, fontWeight: "bold" },
  reactionsContainer: { flexDirection: "row", position: "absolute", top: 100, left: 16, zIndex: 100, gap: 8 },
  floatingReaction: { fontSize: 32 },
  videoContainer: { flex: 1, backgroundColor: "#000" },
  cameraPreview: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111" },
  previewText: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  previewSubtext: { color: "#666", fontSize: 14, marginTop: 8 },
  controlBar: { padding: 12, backgroundColor: "#1a1a1a" },
  controlsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  controlBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#333", justifyContent: "center", alignItems: "center" },
  controlBtnOff: { backgroundColor: "#ff4444" },
  controlBtnActive: { backgroundColor: "#4CAF50" },
  mainBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, gap: 8 },
  goLiveBtn: { backgroundColor: "#4CAF50" },
  stopBtn: { backgroundColor: "#f44336" },
  mainBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  bottomActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, backgroundColor: "#1a1a1a" },
  actionBtns: { flexDirection: "row", gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionBtnText: { color: "#fff", fontSize: 14 },
  leaveBtn: { backgroundColor: "#333", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  leaveBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  chatOverlay: { position: "absolute", right: 0, bottom: 100, width: "65%", maxWidth: 280, borderRadius: 16, overflow: "hidden", margin: 12 },
  viewerChat: { bottom: 80 },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" },
  chatTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  chatMsg: { paddingHorizontal: 12, paddingVertical: 6 },
  giftMsg: { backgroundColor: "rgba(255,215,0,0.2)", borderRadius: 8, marginVertical: 4 },
  msgUser: { fontWeight: "bold", fontSize: 13 },
  msgText: { color: "#fff", fontSize: 13 },
  chatInputRow: { flexDirection: "row", padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" },
  chatInput: { flex: 1, backgroundColor: "#333", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, color: "#fff", fontSize: 14 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  reactionsPicker: { position: "absolute", bottom: 80, left: 16, flexDirection: "row", backgroundColor: "rgba(0,0,0,0.8)", borderRadius: 30, padding: 8, gap: 8 },
  reactionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#333", justifyContent: "center", alignItems: "center" },
  reactionEmoji: { fontSize: 24 },
  statsOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", zIndex: 200 },
  statsContent: { backgroundColor: "#222", borderRadius: 16, padding: 24, width: "80%" },
  statsTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" },
  statLabel: { color: "#aaa", fontSize: 14 },
  statValue: { color: "#fff", fontSize: 14, fontWeight: "600" },
  closeStatsBtn: { marginTop: 16, padding: 12, backgroundColor: "#4CAF50", borderRadius: 8 },
  closeStatsBtnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  giftModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  giftGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  giftItem: { width: "30%", alignItems: "center", padding: 12, borderRadius: 12, backgroundColor: "#222", marginBottom: 12 },
  giftIcon: { fontSize: 32 },
  giftName: { fontSize: 12, marginTop: 6 },
  giftPrice: { color: "#FFD700", fontSize: 12, fontWeight: "600" },
  settingsModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: "60%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" },
  settingsList: { padding: 20 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" },
  settingLabel: { fontSize: 16, fontWeight: "500" },
  qualityBtns: { flexDirection: "row", gap: 8 },
  qualityBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: "#333" },
  qualityBtnText: { color: "#888", fontSize: 12, fontWeight: "600" },
  orderBadgeContainer: { position: "relative" },
  orderBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "#ff4444", borderRadius: 8, minWidth: 16, height: 16, justifyContent: "center", alignItems: "center" },
  orderBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  pinnedProductCard: { position: "absolute", top: 110, left: 16, right: 16, backgroundColor: "rgba(0,0,0,0.9)", borderRadius: 12, overflow: "hidden", zIndex: 150 },
  pinnedProductContent: { flexDirection: "row", alignItems: "center", padding: 12 },
  pinnedProductIcon: { fontSize: 36, marginRight: 12 },
  pinnedProductInfo: { flex: 1 },
  pinnedProductName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  pinnedProductPriceRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  pinnedProductPrice: { color: "#4CAF50", fontSize: 16, fontWeight: "bold" },
  pinnedProductOriginalPrice: { color: "#888", fontSize: 12, textDecorationLine: "line-through", marginLeft: 8 },
  unpinBtn: { padding: 8 },
  marketplaceModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: "70%" },
  productsList: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 16 },
  productCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 12 },
  viewerProductCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 12 },
  productIcon: { fontSize: 40, marginRight: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "600" },
  productPriceRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  productPrice: { color: "#4CAF50", fontSize: 16, fontWeight: "bold" },
  productOriginalPrice: { color: "#888", fontSize: 12, textDecorationLine: "line-through", marginLeft: 8 },
  discountBadge: { backgroundColor: "#ff4444", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  outOfStockText: { color: "#ff4444", fontSize: 12, marginTop: 4 },
  productActions: { flexDirection: "row", gap: 8 },
  pinProductBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#333", justifyContent: "center", alignItems: "center" },
  pinnedBtn: { backgroundColor: "#4CAF50" },
  addToCartBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#4CAF50", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  addToCartBtnDisabled: { backgroundColor: "#666" },
  addToCartBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  buyNowBtn: { backgroundColor: "#4CAF50", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  buyNowBtnDisabled: { backgroundColor: "#666" },
  buyNowBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  ordersPanel: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: "60%" },
  ordersStats: { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  orderStatBox: { flex: 1, backgroundColor: "#222", padding: 16, borderRadius: 12, alignItems: "center" },
  orderStatValue: { color: "#4CAF50", fontSize: 24, fontWeight: "bold" },
  orderStatLabel: { color: "#888", fontSize: 12, marginTop: 4 },
  ordersList: { paddingHorizontal: 20 },
  noOrdersText: { textAlign: "center", marginTop: 40, fontSize: 16 },
  orderItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 8 },
  orderInfo: { flex: 1 },
  orderProduct: { fontSize: 14, fontWeight: "600" },
  orderBuyer: { color: "#888", fontSize: 12, marginTop: 4 },
  orderRight: { alignItems: "flex-end" },
  orderQuantity: { color: "#888", fontSize: 12 },
  orderTotal: { color: "#4CAF50", fontSize: 14, fontWeight: "bold", marginTop: 4 },
  viewerPinnedProduct: { position: "absolute", bottom: 140, left: 16, right: 16, backgroundColor: "rgba(0,0,0,0.9)", borderRadius: 16, overflow: "hidden", zIndex: 150 },
  viewerPinnedContent: { flexDirection: "row", alignItems: "center", padding: 12 },
  viewerPinnedIcon: { fontSize: 32, marginRight: 12 },
  viewerPinnedInfo: { flex: 1 },
  viewerPinnedName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  viewerPinnedPriceRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  viewerPinnedPrice: { color: "#4CAF50", fontSize: 16, fontWeight: "bold" },
  viewerPinnedOriginal: { color: "#888", fontSize: 12, textDecorationLine: "line-through", marginLeft: 8 },
});

export default LivestreamScreen;