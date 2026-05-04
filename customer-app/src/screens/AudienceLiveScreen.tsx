import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  Clipboard,
  StyleSheet,
  View,
  findNodeHandle,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Share,
  ActivityIndicator,
} from "react-native";

import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { CustomBuilder } from "../utils/CustomBuilder";
import { LiveSessionService } from "../services/LiveSessionService";
import {
  Gift as GiftIcon,
  Share2,
  Heart,
  Flame,
  Ticket,
  X,
  Clock,
  ShoppingBag,
  PlusCircle,
  Send,
  Timer,
  Trophy,
  User,
  Users,
  Coins,
  MessageSquareOff,
  Radio,
  Settings,
  MessageCircle,
  Camera,
  Mic,
  Pin,
} from "lucide-react-native";
import { API_BASE_URL } from "../config/api";
import { STREAM_API_KEY } from "../config/stream";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  increment,
  runTransaction,
  deleteDoc,
  addDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getOrCreateWallet } from "../services/codFinancialService";
import { BlurView } from "expo-blur";
import { FlameCounter } from "../components/FlameCounter";
import { db } from "../api/firebase";
import { GIFTS, Gift } from "../config/gifts";
import { RechargeModal } from "../components/RechargeModal";

import {
  StreamCall,
  useStreamVideoClient,
  useCallStateHooks,
  ParticipantView,
  FloatingParticipantView,
} from "@stream-io/video-react-native-sdk";
import { hasVideo } from '@stream-io/video-client';
import { useChatContext } from "stream-chat-react-native";
import { LiveChatOverlay } from "../components/LiveChatOverlay";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
});


type Props = {
  channelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  hostAvatar?: string;
  hostBrandName?: string;
  onClose: () => void;
  t?: (key: string) => string;
  language?: "fr" | "ar" | "en";
  profileData?: any;
  streamInitError?: string | null;
  onRetryStreamInit?: () => void;
};

const MemberAvatar = ({
  userId,
  userName,
  defaultAvatar,
}: {
  userId: string;
  userName: string;
  defaultAvatar?: string;
}) => {
  const [avatar, setAvatar] = useState(
    defaultAvatar || CustomBuilder.getUserAvatar(userId),
  );

  useEffect(() => {
    if (!avatar && userId) {
      getDoc(doc(db, "users", userId))
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const url = data.avatarUrl || data.avatar;
            const name =
              data.fullName || data.userName || data.name || data.displayName;
            if (url) {
              CustomBuilder.registerAvatar(userId, url);
              setAvatar(url);
            }
            if (name) {
              CustomBuilder.registerUserName(userId, name);
            }
          }
        })
        .catch((e) => console.log("Error fetching member avatar:", e));
    }
  }, [userId]);

  return (
    <Image
      style={{ width: "100%", height: "100%", borderRadius: 1000 }}
      source={{
        uri:
          avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "U")}&background=random`,
      }}
    />
  );
};
type AudienceStreamContentProps = {
   remoteParticipants: any[];
   participantCount: number;
   streamDuration: number;
   formatDuration: (s: number) => string;
   onClose: () => void;
   floatingHearts: any[];
   pinnedProduct: any;
   getLocalizedName: (name: any) => string;
   featuredProducts: any[];
   setPinnedProduct: (p: any) => void;
   handleSendLike: () => void;
   setShowGifts: (v: boolean) => void;
   setShowChat: (v: boolean) => void;
   t: (key: string) => string;
   hostAvatar?: string;
   hostBrandName?: string;
   totalLikes: number;
   isInPK: boolean;
   hostCameraOn?: boolean;
   activeCoupon?: any;
   couponTimeRemaining?: number;
   setCouponInput: (v: string) => void;
   couponInput?: string;
   setShowPurchaseModal: (v: boolean) => void;
   setSelectedProduct: (p: any) => void;
 };

const AudienceStreamContent = ({
  remoteParticipants,
  participantCount,
  streamDuration,
  formatDuration,
  onClose,
  floatingHearts,
  pinnedProduct,
  getLocalizedName,
  featuredProducts,
  setPinnedProduct,
  handleSendLike,
  setShowGifts,
  setShowChat,
  t,
  hostAvatar,
  hostBrandName,
  totalLikes,
  isInPK,
  hostCameraOn,
  activeCoupon,
  couponTimeRemaining,
  setCouponInput,
  couponInput,
  setShowPurchaseModal,
  setSelectedProduct,
}: AudienceStreamContentProps) => {
  const { useRemoteParticipants, useParticipantCount } = useCallStateHooks();
  const remote = useRemoteParticipants();
  const count = useParticipantCount();
  const host = remote[0] || remoteParticipants[0];
  const hasHostVideo = host ? hasVideo(host) : false;
  const isHostCameraOn = hostCameraOn !== undefined ? hostCameraOn : hasHostVideo;
  const viewerCount = count || participantCount;
return (
    <>
      {host && isHostCameraOn && (
        <ParticipantView participant={host} style={StyleSheet.absoluteFill} />
      )}

      {(!host || !isHostCameraOn) && (
        <View style={[StyleSheet.absoluteFill, { justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a2e", zIndex: 1 }]}>
          <Image source={{ uri: hostAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(hostBrandName || "Host")}&background=random` }} style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: "#fff" }} />
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 16 }}>{hostBrandName || "Host"}</Text>
        </View>
      )}

      {/* Top Bar - Live Info - Always show host info first */}
        <View style={{ position: "absolute", top: 50, left: 15, right: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 100 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(239, 68, 68, 0.9)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff", marginRight: 6 }} />
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11 }}>LIVE</Text>
            </View>
            {/* Host Avatar + Name in top left */}
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16 }}>
              <Image source={{ uri: hostAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(hostBrandName || "Host")}&background=random` }} style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: "#fff" }} />
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 11, marginLeft: 6 }} numberOfLines={1}>{hostBrandName || "Host"}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>👁 {viewerCount}</Text>
            </View>
            <View style={{ backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>{formatDuration(streamDuration)}</Text>
            </View>
          </View>
        <TouchableOpacity onPress={onClose} style={{ backgroundColor: "rgba(0,0,0,0.5)", width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
          <X size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {floatingHearts.map((heart) => (
        <Animatable.View key={heart.id} animation="fadeInUp" duration={2000} style={{ position: "absolute", bottom: 100, left: "50%", marginLeft: heart.x, zIndex: 500 }}>
          <Text style={{ fontSize: 30 }}>❤️</Text>
        </Animatable.View>
      ))}

      {totalLikes >= 50 && <FlameCounter count={totalLikes} onPress={handleSendLike} top={isInPK ? 210 : 120} />}

      {pinnedProduct && (
        <Animatable.View animation="fadeInLeft" duration={400} style={{ position: "absolute", bottom: 180, left: 15, width: 240, zIndex: 300 }}>
          <BlurView intensity={90} tint="dark" style={{ borderRadius: 16, padding: 10, flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255, 255, 255, 0.25)", overflow: "hidden" }}>
            <Image source={{ uri: pinnedProduct.images?.[0] }} style={{ width: 50, height: 50, borderRadius: 10, backgroundColor: "#333" }} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text numberOfLines={1} style={{ color: "#fff", fontWeight: "700", fontSize: 11, marginBottom: 3 }}>{getLocalizedName(pinnedProduct.name)}</Text>
              <Text style={{ color: "#F59E0B", fontWeight: "900", fontSize: 13 }}>{pinnedProduct.discountPrice || pinnedProduct.price} TND</Text>
            </View>
          </BlurView>
        </Animatable.View>
      )}

{featuredProducts.length > 0 && (
         <View style={{ position: "absolute", bottom: 80, left: 0, right: 0, zIndex: 250 }}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, gap: 10 }}>
             {featuredProducts.map((p: any) => {
               const isPinned = pinnedProduct?.id === p.id;
               return (
                 <TouchableOpacity key={p.id} onPress={() => { setPinnedProduct(p); }} style={{ width: 90, borderRadius: 14, backgroundColor: isPinned ? "rgba(16, 185, 129, 0.2)" : "rgba(0,0,0,0.7)", borderWidth: isPinned ? 2 : 1, borderColor: isPinned ? "#10B981" : "rgba(255,255,255,0.1)", padding: 6, overflow: "hidden" }}>
                   <Image source={{ uri: p.images?.[0] }} style={{ width: 78, height: 78, borderRadius: 10, backgroundColor: "#333" }} />
                   {p.discountPrice && <View style={{ position: "absolute", top: 8, left: 4, backgroundColor: "#EF4444", paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}><Text style={{ color: "#fff", fontSize: 7, fontWeight: "900" }}>-{Math.round((1 - p.discountPrice / p.price) * 100)}%</Text></View>}
                   <View style={{ marginTop: 4 }}>
                     <Text numberOfLines={1} style={{ color: "#fff", fontSize: 9, fontWeight: "600" }}>{getLocalizedName(p.name)}</Text>
                     <Text style={{ color: isPinned ? "#10B981" : "#F59E0B", fontSize: 11, fontWeight: "900" }}>{p.discountPrice || p.price} TND</Text>
                   </View>
                   <TouchableOpacity
                     onPress={() => {
                       setSelectedProduct(p);
                       setShowPurchaseModal(true);
                     }}
                     style={{ position: "absolute", bottom: 2, right: 2, backgroundColor: "rgba(245,158,11,0.9)", borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" }}
                   >
                     <ShoppingBag size={12} color="#000" />
                   </TouchableOpacity>
                 </TouchableOpacity>
               );
             })}
           </ScrollView>
         </View>
       )}

{/* Active Coupon Display Card - Modern Product Card Style */}
       {activeCoupon && (
         <Animatable.View animation="fadeInUp" duration={400} style={{ position: "absolute", bottom: 80, left: 15, right: 15, zIndex: 300 }}>
           <View style={{ backgroundColor: "#121218", borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: "rgba(255,215,0,0.3)", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}>
             <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
               {/* Coupon Icon Section */}
               <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255, 215, 0, 0.15)", alignItems: "center", justifyContent: "center" }}>
                 <Ticket size={28} color="#F59E0B" />
                 {/* Battery indicator for coupon */}
                 <View style={{ position: "absolute", bottom: 2, right: 2, flexDirection: "row", gap: 1 }}>
                   {[1, 2, 3].map((i) => (
                     <View key={i} style={{ width: 3, height: 6, backgroundColor: i <= 2 ? "#F59E0B" : "rgba(245,158,11,0.3)", borderRadius: 1 }} />
                   ))}
                 </View>
               </View>

               {/* Coupon Details */}
               <View style={{ flex: 1, gap: 4 }}>
                 <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                   <Text style={{ color: "#F59E0B", fontWeight: "900", fontSize: 10, letterSpacing: 1 }}>✨ ACTIVE COUPON</Text>
                 </View>
                 <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18, letterSpacing: 0.5 }}>{activeCoupon.code}</Text>
                 
                 {/* Discount Info */}
                 <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                   {activeCoupon.discountType === "percentage" && (
                     <>
                       <Text style={{ color: "#10B981", fontWeight: "900", fontSize: 20 }}>{activeCoupon.discount}%</Text>
                       <Text style={{ color: "#888", fontSize: 12 }}>OFF</Text>
                     </>
                   )}
                   {activeCoupon.discountType === "fixed" && (
                     <>
                       <Text style={{ color: "#10B981", fontWeight: "900", fontSize: 20 }}>{activeCoupon.discount} TND</Text>
                       <Text style={{ color: "#888", fontSize: 12 }}>OFF</Text>
                     </>
                   )}
                   {activeCoupon.discountType === "free_shipping" && (
                     <>
                       <Text style={{ color: "#10B981", fontWeight: "900", fontSize: 14 }}>📦 FREE SHIPPING</Text>
                     </>
                   )}
                 </View>

                 {/* Battery/Stock bars */}
                 <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 }}>
                   {[1, 2, 3, 4].map((i) => (
                     <View
                       key={i}
                       style={{
                         width: 5,
                         height: 10,
                         borderRadius: 1,
                         backgroundColor: i <= 3 ? "#F59E0B" : "rgba(245,158,11,0.2)",
                       }}
                     />
                   ))}
                   <Text style={{ color: "#888", fontSize: 9, marginLeft: 4 }}>HIGH VALUE</Text>
                 </View>
               </View>

               {/* Timer */}
               <View style={{ alignItems: "center" }}>
                 <Text style={{ color: "#888", fontSize: 9, fontWeight: "700" }}>ENDS IN</Text>
                 <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
<Text style={{ color: "#FFD700", fontWeight: "900", fontSize: 18 }}>
                      {Math.floor((couponTimeRemaining ?? 0) / 60)}:{((couponTimeRemaining ?? 0) % 60).toString().padStart(2, "0")}
                    </Text>
                   <Text style={{ color: "#888", fontSize: 9 }}>m</Text>
                 </View>
                 <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(245,158,11,0.1)", alignItems: "center", justifyContent: "center", marginTop: 4 }}>
                   <Ticket size={16} color="#F59E0B" />
                 </View>
               </View>
             </View>

             {/* Divider */}
             <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 12 }} />

             {/* Input Section */}
             <View style={{ flexDirection: "row", gap: 8 }}>
               <TextInput
                 placeholder="Enter code"
                 placeholderTextColor="#555"
                 value={couponInput ?? ""}
                 onChangeText={setCouponInput}
                 autoCapitalize="characters"
                 style={{ flex: 1, backgroundColor: "#0F0F16", borderRadius: 12, padding: 14, color: "#fff", fontSize: 16, fontWeight: "bold", borderWidth: 1.5, borderColor: "#2A2A35" }}
               />
               <TouchableOpacity
                 onPress={() => {
                   if ((couponInput ?? "").trim().toUpperCase() === activeCoupon.code.toUpperCase()) {
                     Alert.alert("Success", `Coupon applied! ${activeCoupon.discountType === 'percentage' ? activeCoupon.discount + '%' : activeCoupon.discount + ' TND'} discount`);
                   }
                 }}
                 style={{ backgroundColor: "#F59E0B", paddingHorizontal: 20, borderRadius: 12, justifyContent: "center", alignItems: "center" }}
               >
                 <Text style={{ color: "#000", fontWeight: "900", fontSize: 14 }}>APPLY</Text>
               </TouchableOpacity>
             </View>
           </View>
         </Animatable.View>
       )}

      <View style={{ position: "absolute", bottom: 160, right: 15, gap: 10, alignItems: "center", zIndex: 400 }}>
        <TouchableOpacity onPress={handleSendLike} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(239, 68, 68, 0.8)", alignItems: "center", justifyContent: "center" }}>
          <Heart size={18} color="#fff" fill="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowGifts(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
          <GiftIcon size={18} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowChat(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
          <MessageCircle size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  );
};

export default function AudienceLiveScreen(props: Props) {
  const t = typeof props.t === "function" ? props.t : (key: string) => key;
  // Translation helper: tr(en, fr, ar)
  const tr = (en: string, fr: string, ar: string) => {
    return language === "ar" ? ar : language === "fr" ? fr : en;
  };

  const {
    channelId,
    userId,
    userName,
    userAvatar,
    hostAvatar,
    hostBrandName,
    onClose,
    language,
    profileData,
    streamInitError,
    onRetryStreamInit,
  } = props;

  const getLocalizedName = (name: any): string => {
    // Handle undefined/null
    if (!name) return "";

    // Already a string
    if (typeof name === "string") return name;

    // It's an object with translations - handle safely
    if (typeof name === "object") {
      try {
        const lang = language || "fr"; // Default to French if undefined
        const langKey = lang === "ar" ? "ar-tn" : lang;

        // Try to get the right language
        if (name[langKey] && typeof name[langKey] === "string")
          return name[langKey];
        if (name.fr && typeof name.fr === "string") return name.fr;
        if (name.en && typeof name.en === "string") return name.en;
        if (name.ar && typeof name.ar === "string") return name.ar;

        // Try any available value
        const values = Object.values(name);
        for (const v of values) {
          if (typeof v === "string" && v.trim()) {
            return v;
          }
        }

        // Last resort - return empty string
        return "";
      } catch (e) {
        // If anything fails, return empty string
        return "";
      }
    }

    // Fallback for any other type
    return String(name) || "";
  };
  const client = useStreamVideoClient();
  
  // Duration tracking
  const [streamDuration, setStreamDuration] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setStreamDuration(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  
  // Try to get chat client, but handle if not available
  let chatClient = null;
  try {
    const { client: streamChatClient } = useChatContext();
    chatClient = streamChatClient;
  } catch (e) {
    console.log("Chat context not available in AudienceLiveScreen");
  }

  const [call, setCall] = useState<any>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<any[]>([]);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    if (streamInitError || !client || !channelId) return;

    const _call = client.call("livestream", channelId);

    // Listen to custom events for low-latency updates
    const unsubscribeCustomEvent = _call.on("custom", (event: any) => {
      const data = event.custom;
      if (!data) return;

      if (data.type === "product:pin") {
        console.log("⚡ Low-latency Stream Event: Product Pinned");
        const productId = data.productId;
        const duration = data.duration;
        setPinEndTime(duration ? Date.now() + duration * 60 * 1000 : null);

        getDoc(doc(db, "products", productId))
          .then((snap: any) => {
            if (snap.exists()) {
              setPinnedProduct({ id: snap.id, ...snap.data() });
            } else {
              setPinnedProduct(null);
            }
          })
          .catch((error: any) => {
            console.error(
              "Error fetching pinned product via stream event:",
              error,
            );
            setPinnedProduct(null);
          });
      } else if (data.type === "product:unpin") {
        console.log("⚡ Low-latency Stream Event: Product Unpinned");
        setPinnedProduct(null);
        setPinEndTime(null);
      } else if (data.type === "stream:like") {
        if (event.user?.id !== userId) {
          const id = ++heartCounter.current;
          const x = Math.random() * 60 - 30;
          setFloatingHearts((prev: any) => [...prev.slice(-15), { id, x }]);
          setTimeout(() => {
            setFloatingHearts((prev: any) =>
              prev.filter((h: any) => h.id !== id),
            );
          }, 3000);
        }
      } else if (data.type === "PK_VOTE") {
        setIsInPK(true);
        if (data.hostName) setPkHostName(data.hostName);
        if (data.hostId) setStreamHostId(data.hostId);
        if (data.endTime) {
          setPkEndTime(data.endTime);
          const remaining = Math.max(
            0,
            Math.floor((data.endTime - Date.now()) / 1000),
          );
          setPkTimeRemaining(remaining);
        }
      } else if (data.type === "PK_LIKE") {
        handleSendLike();
      } else if (data.type === "PK_BATTLE_STOP") {
        setIsInPK(false);
      } else if (data.type === "camera_state") {
        setHostCameraOn(data.isCameraOn);
      } else if (data.type === "gift") {
        const senderId = data.senderId || data.userId;
        const isHost = data.isHost === true;
        const senderName = data.userName || "Viewer";
        const giftNameStr = String(data.giftName || "");

        const foundGift = GIFTS.find(
          (g) => g.name.toLowerCase() === giftNameStr.toLowerCase(),
        );
        const isBig =
          (foundGift && (foundGift.points || 0) >= 500) ||
          Number(data.points || 0) >= 500;

        const current = recentGiftRef.current;
        if (isSameGift(current, senderId, senderName, giftNameStr)) {
          setRecentGift((prev) => {
            const base = prev || current;
            const updated = base
              ? { ...base, count: data.combo || (base.count || 0) + 1 }
              : null;
            recentGiftRef.current = updated;
            return updated;
          });
          if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
          giftTimerRef.current = setTimeout(
            () => {
              setRecentGift(null);
              recentGiftRef.current = null;
            },
            isBig ? 4500 : 3000,
          );

          if (isBig) {
            setShowGiftVideo(true);
            if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
            videoTimerRef.current = setTimeout(
              () => setShowGiftVideo(false),
              4500,
            );
          }
        } else {
          setGiftQueue((prev) => {
            const last = prev[prev.length - 1];
            if (isSameGift(last, senderId, senderName, giftNameStr)) {
              return [
                ...prev.slice(0, -1),
                { ...last, count: data.combo || last.count + 1 },
              ];
            }
            return [
              ...prev.slice(-10),
              {
                senderName,
                giftName: giftNameStr,
                icon: foundGift ? foundGift.icon : data.icon,
                count: data.combo || 1,
                senderId,
                senderAvatar: data.senderAvatar,
                isHost,
                isBig,
              },
            ];
          });
        }
      } else if (data.type === "coupon_drop") {
        setActiveCoupon(data);
        const remaining = Math.max(
          0,
          Math.floor((data.endTime - Date.now()) / 1000),
        );
        setCouponTimeRemaining(remaining);
      }
    });

    const unsubscribeReaction = _call.on("call.reaction_new", (event: any) => {
      if (event.user?.id !== userId && event.reaction?.type === "like") {
        const id = ++heartCounter.current;
        const x = Math.random() * 60 - 30;
        setFloatingHearts((prev: any) => [...prev.slice(-15), { id, x }]);
        setTimeout(() => {
          setFloatingHearts((prev: any) =>
            prev.filter((h: any) => h.id !== id),
          );
        }, 3000);
      }
    });

    // Resolve host name if it's an email
    if (hostId) {
      getDoc(doc(db, "users", hostId)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const name =
            data.fullName || data.userName || data.name || data.displayName;
          if (name && !name.includes("@")) {
            CustomBuilder.registerUserName(hostId, name);
          }
        }
      });
    }

    // Use a timeout to prevent infinite loading if join hangs
    console.log("🔄 Attempting to join call:", channelId);
    const joinPromise = _call.join();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Join timeout after 15s")), 15000),
    );

    Promise.race([joinPromise, timeoutPromise])
      .then(() => {
        setCall(_call);
        console.log("✅ Joined call as audience:", channelId);
      })
      .catch((err) => {
        console.error("❌ Failed to join call as audience:", err);
        Alert.alert(
          t("connectionError") || "Erreur de connexion",
          t("joinFailedMsg") ||
            "Impossible de rejoindre le direct. Veuillez réessayer.",
          [
            {
              text: t("retry") || "Réessayer",
              onPress: () => {
                // Logic to retry could go here, but for now we just allow closing
                onClose();
              },
            },
          ],
        );
      });

    return () => {
      unsubscribeCustomEvent();
      unsubscribeReaction();
      if (_call.state.callingState !== "left") {
        _call
          .leave()
          .catch((err) => console.error("❌ Failed to leave call:", err));
      }
    };
  }, [client, channelId, streamInitError]);

  const prebuiltRef = useRef<any>(null);

  const mediaViewRef = useRef<any>(null);
  const mediaPlayerRef = useRef<any>(null);
  const [showGiftVideo, setShowGiftVideo] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [giftQueue, setGiftQueue] = useState<
    {
      senderName: string;
      targetName?: string;
      giftName: string;
      icon: string;
      isHost?: boolean;
      count: number;
      senderId?: string;
      senderAvatar?: string;
      isBig?: boolean;
      points?: number;
      isSticker?: boolean;
    }[]
  >([]);
  const [recentGift, setRecentGift] = useState<{
    senderName: string;
    targetName?: string;
    giftName: string;
    icon: string;
    isHost?: boolean;
    count: number;
    senderId?: string;
    senderAvatar?: string;
    isBig?: boolean;
    points?: number;
    isSticker?: boolean;
  } | null>(null);
  const recentGiftRef = useRef<any>(null);
  const giftTimerRef = useRef<any>(null);
  const [streamHostId, setStreamHostId] = useState<string | null>(null);
  const [isInPK, setIsInPK] = useState(false);
  const [hostScore, setHostScore] = useState(0);
  const [guestScore, setGuestScore] = useState(0);
  const [opponentName, setOpponentName] = useState<string>("Opponent");
  const [pkHostName, setPkHostName] = useState("Host");
  const [pkTimeRemaining, setPkTimeRemaining] = useState(0);
  const [pkEndTime, setPkEndTime] = useState<number | null>(null);
  const [pkWinner, setPkWinner] = useState<string | null>(null);
  const [showPKResult, setShowPKResult] = useState(false);
  const [opponentChannelId, setOpponentChannelId] = useState<string | null>(
    null,
  );

  // Coupon State
  const [activeCoupon, setActiveCoupon] = useState<any>(null);
  const [couponTimeRemaining, setCouponTimeRemaining] = useState(0);
  const couponTimerRef = useRef<any>(null);
  const [isChatMuted, setIsChatMuted] = useState(false); // Global - host muted all
  const [isMyCommentsMuted, setIsMyCommentsMuted] = useState(false); // Per-user - host muted me specifically
  const videoTimerRef = useRef<any>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState<
    { id: number; x: number }[]
  >([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [pinnedProduct, setPinnedProduct] = useState<any | null>(null);
  const [hostCameraOn, setHostCameraOn] = useState<boolean | undefined>(undefined);
  const [showProductSheet, setShowProductSheet] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [address, setAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [couponInput, setCouponInput] = useState(""); // User entered coupon
  const [purchaseNotification, setPurchaseNotification] = useState<{
    user: string;
    product: string;
  } | null>(null);

  const COLOR_MAP: Record<string, string> = {
    RED: "#EF4444",
    BLACK: "#000000",
    WHITE: "#FFFFFF",
    BLUE: "#3B82F6",
    GREEN: "#22C55E",
    YELLOW: "#EAB308",
    PINK: "#EC4899",
    PURPLE: "#A855F7",
    ORANGE: "#F97316",
    GRAY: "#6B7280",
    OLIVE: "#808000",
    NAVY: "#1E3A8A",
    TEAL: "#14B8A6",
    MAROON: "#800000",
    BEIGE: "#F5F5DC",
    BROWN: "#92400E",
  };
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [giftCategory, setGiftCategory] = useState<
    "POPULAIRE" | "SPÉCIAL" | "LUXE"
  >("POPULAIRE");
  const [userBalance, setUserBalance] = useState(0);
  const clampedBalance = Math.max(0, userBalance);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [hostId, setHostId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);

  // Chat state
  const [showChat, setShowChat] = useState(false);
  // Screenshot state
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null);

  // Pinned Product Timer State
  const [pinEndTime, setPinEndTime] = useState<number | null>(null);
  const [pinTimeRemaining, setPinTimeRemaining] = useState(0);

  const [isFollowed, setIsFollowed] = useState(false);
  const [collabType, setCollabType] = useState<string | null>(null);

  useEffect(() => {
    if (profileData) {
      setCustomerName((prev) => prev || profileData.fullName || "");
      setPhoneNumber((prev) => prev || profileData.phone || "");
      // userBalance is now handled by the combined listener below

      // For address, we might have multiple. Get the default or first one.
      if (profileData.addresses && profileData.addresses.length > 0) {
        const def =
          profileData.addresses.find((a: any) => a.isDefault) ||
          profileData.addresses[0];
        setAddress((prev) => prev || def.text || "");
      } else if (profileData.address) {
        setAddress((prev) => prev || profileData.address);
      }
    }
  }, [profileData]);

  useEffect(() => {
    if (userId) {
      getOrCreateWallet(userId, "customer", userName || "User")
        .then(setWalletId)
        .catch((err) => console.error("Error getting wallet:", err));
    }
  }, [userId]);

  // Sync balance from both legacy and modern sources
  useEffect(() => {
    if (!userId) return;

    let legacyCoins = profileData?.wallet?.coins || 0;
    let modernCoins = 0;

    const updateCombinedBalance = () => {
      setUserBalance(legacyCoins + modernCoins);
    };

    const unsubUser = onSnapshot(doc(db, "users", userId), (snap) => {
      if (snap.exists()) {
        legacyCoins = snap.data()?.wallet?.coins || 0;
        updateCombinedBalance();
      }
    });

    let unsubWallet: (() => void) | null = null;
    if (walletId) {
      unsubWallet = onSnapshot(doc(db, "wallets", walletId), (snap) => {
        if (snap.exists()) {
          modernCoins = snap.data()?.coins || 0;
          updateCombinedBalance();
        }
      });
    }

    return () => {
      unsubUser();
      if (unsubWallet) unsubWallet();
    };
  }, [userId, walletId]);

  useEffect(() => {
    if (!channelId) return;
    getDoc(doc(db, "collaborations", channelId)).then((snap) => {
      if (snap.exists()) {
        setCollabType(snap.data().type);
      }
    });
  }, [channelId]);

  // Check if following
  useEffect(() => {
    if (userId && channelId) {
      const q = query(
        collection(db, "users", userId, "followingCollabs"),
        where("collabId", "==", channelId),
      );
      const unsub = onSnapshot(q, (snap) => {
        setIsFollowed(!snap.empty);
      });
      return () => unsub();
    }
  }, [userId, channelId]);

  const toggleFollow = async () => {
    if (!userId || !channelId) return;
    try {
      if (isFollowed) {
        const q = query(
          collection(db, "users", userId, "followingCollabs"),
          where("collabId", "==", channelId),
        );
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
          await deleteDoc(d.ref);
        });
      } else {
        await addDoc(collection(db, "users", userId, "followingCollabs"), {
          collabId: channelId,
          followedAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.error("Follow Toggle Error:", e);
    }
  };

  const lastPurchaseTimeRef = useRef(0);

  const isInPKRef = useRef(false);
  const hostScoreRef = useRef(0);
  const [streamHost, setStreamHost] = useState<any>(null);
  const guestScoreRef = useRef(0);
  const streamHostIdRef = useRef<string | null>(null);
  const totalLikesRef = useRef(0);
  const pkStartLikesRef = useRef(0);
  const opponentChannelIdRef = useRef<string | null>(null);
  const handledPKEndTimeRef = useRef<number | null>(null);

  const lastGiftTimestampRef = useRef(0); // Track last processed gift to avoid duplicates
  const heartCounter = useRef(0);

const handlePurchase = async () => {
     if (!customerName.trim()) {
       Alert.alert(
         t("error") || "Error",
         t("nameRequired") || "Please enter your full name",
       );
       return;
     }
     if (!phoneNumber.trim()) {
       Alert.alert(
         t("error") || "Error",
         t("phoneRequired") || "Please enter your phone number",
       );
       return;
     }
     if (!address.trim()) {
       Alert.alert(
         t("error") || "Error",
         t("addressRequired") || "Please enter a shipping address",
       );
       return;
     }
     if (!selectedProduct) return;
     if (
       selectedProduct.colors &&
       selectedProduct.colors.length > 0 &&
       !selectedColor
     ) {
       Alert.alert(
         t("error") || "Error",
         t("selectColor") || "Please select a color",
       );
       return;
     }
     if (
       selectedProduct.sizes &&
       selectedProduct.sizes.length > 0 &&
       !selectedSize
     ) {
       Alert.alert(
         t("error") || "Error",
         t("selectSize") || "Please select a size",
       );
       return;
     }

     const basePrice = selectedProduct.discountPrice || selectedProduct.price;
     let finalPrice = basePrice;
     let appliedCoupon = null;

     if (
       activeCoupon &&
       (couponInput ?? "").trim().toUpperCase() === activeCoupon.code.toUpperCase()
     ) {
       if (activeCoupon.discountType === "percentage") {
         finalPrice = basePrice * (1 - activeCoupon.discount / 100);
       } else if (activeCoupon.discountType === "fixed") {
         finalPrice = Math.max(0, basePrice - activeCoupon.discount);
       }
       // free_shipping doesn't affect price but applies free shipping
       appliedCoupon = activeCoupon.code;
     }

    await LiveSessionService.broadcastPurchase(channelId, {
      purchaserName: userName || "Viewer",
      productName: getLocalizedName(selectedProduct.name),
      price: finalPrice,
      couponCode: appliedCoupon,
      color: selectedColor,
      size: selectedSize,
    });

    setCouponInput("");
    setShowPurchaseModal(false);
    setAddress("");
    setSelectedProduct(null);
    Alert.alert("Success", `Order Placed! Total: ${finalPrice.toFixed(2)} TND`);
  };

  // Sync Refs is handled below but let's keep the hook structure clean

  // ✅ Sync refs
  useEffect(() => {
    isInPKRef.current = isInPK;
  }, [isInPK]);
  useEffect(() => {
    hostScoreRef.current = hostScore;
  }, [hostScore]);
  useEffect(() => {
    guestScoreRef.current = guestScore;
  }, [guestScore]);
  useEffect(() => {
    totalLikesRef.current = totalLikes;
  }, [totalLikes]);
  useEffect(() => {
    streamHostIdRef.current = streamHostId;
  }, [streamHostId]);
  useEffect(() => {
    opponentChannelIdRef.current = opponentChannelId;
  }, [opponentChannelId]);
  useEffect(() => {
    recentGiftRef.current = recentGift;
  }, [recentGift]);

  // Capture baseline likes when PK Starts
  useEffect(() => {
    if (isInPK) {
      pkStartLikesRef.current = totalLikes;
      console.log("🏁 PK Started. Baseline Likes:", totalLikes);
      // setHostScore(0); // ❌ Removed: Follow Firestore sync for existing battles
      // setGuestScore(0); // ❌ Removed: Follow Firestore sync for existing battles
    }
  }, [isInPK]);
  // ✅ Process Gift Queue
  useEffect(() => {
    if (!recentGift && giftQueue.length > 0) {
      const nextGift = giftQueue[0];
      setGiftQueue((prev) => prev.slice(1));
      setRecentGift(nextGift);
      recentGiftRef.current = nextGift; // Sync ref immediately for incoming matches

      // ✅ Only show pill if NOT isBig
      if (nextGift.isBig) {
        const gift = GIFTS.find((g) => g.name === nextGift.giftName);
        if (gift?.url) showGiftAnimation(gift.url);

        // Progress after animation duration
        if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
        giftTimerRef.current = setTimeout(() => {
          setRecentGift(null);
          recentGiftRef.current = null;
        }, 4500); // Wait for big animation to finish
      } else {
        // Regular gift clear timer
        if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
        giftTimerRef.current = setTimeout(() => {
          setRecentGift(null);
          recentGiftRef.current = null;
        }, 3000);
      }
    }
  }, [recentGift, giftQueue]);

  const gifts = GIFTS;

  // Helper to check if a gift matches for combo
  const isSameGift = (
    g1: any,
    g2Id: string,
    g2Name: string,
    g2GiftName: string,
  ) => {
    if (!g1) return false;
    // Robust gift name check
    if (
      String(g1.giftName || "")
        .toLowerCase()
        .trim() !==
      String(g2GiftName || "")
        .toLowerCase()
        .trim()
    )
      return false;

    // Robust ID check
    const id1 = String(g1.senderId || "")
      .toLowerCase()
      .trim();
    const id2 = String(g2Id || "")
      .toLowerCase()
      .trim();
    if (id1 && id2 && id1 === id2) return true;

    // Robust Name fallback
    const n1 = String(g1.senderName || "")
      .toLowerCase()
      .trim();
    const n2 = String(g2Name || "")
      .toLowerCase()
      .trim();
    if (n1 && n2 && n1 === n2) return true;

    return false;
  };

  const sendGift = async (gift: any) => {
    if (!userId) return;

    // 1. Check Balance
    if (userBalance < gift.points) {
      Alert.alert(
        t("Insufficient Balance"),
        t("You need more coins to send this gift."),
      );
      return;
    }

    // COMBO LOGIC: Local feedback
    const current = recentGiftRef.current;
    const finalAvatar =
      userAvatar || profileData?.avatar || CustomBuilder.getUserAvatar(userId);

    const foundGift = GIFTS.find((g) => g.name === gift.name);
    const isBig = (foundGift?.points || 0) >= 500 || (gift.points || 0) >= 500;

    let newCount = 1;
    if (isSameGift(current, userId, userName, gift.name)) {
      newCount = (current?.count || 0) + 1;
      setRecentGift((prev) => {
        const base = prev || current;
        const updated = base ? { ...base, count: newCount } : null;
        recentGiftRef.current = updated;
        return updated;
      });
      if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
      giftTimerRef.current = setTimeout(
        () => {
          setRecentGift(null);
          recentGiftRef.current = null;
        },
        isBig ? 4500 : 3000,
      );

      // If it's a big gift, ensure the overlay stays up
      if (isBig) {
        setShowGiftVideo(true);
        if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
        videoTimerRef.current = setTimeout(() => {
          setShowGiftVideo(false);
        }, 4500);
      }
    } else {
      setGiftQueue((prev) => {
        const last = prev[prev.length - 1];
        if (isSameGift(last, userId, userName, gift.name)) {
          newCount = (last.count || 0) + 1;
          return [...prev.slice(0, -1), { ...last, count: newCount }];
        }
        return [
          ...prev,
          {
            senderName: userName || "You",
            giftName: gift.name,
            icon: gift.icon,
            count: 1,
            senderId: userId,
            ...(finalAvatar ? { senderAvatar: finalAvatar } : {}),
            isHost: false,
            isBig: gift.points >= 500,
          },
        ];
      });
    }

    // Optimistically update local states
    setTotalLikes((prev) => prev + (gift.points || 1));
    if (streamHostIdRef.current) {
      setHostScore((prev) => prev + (gift.points || 1));
    }
    setUserBalance((prev) => Math.max(0, prev - gift.points));

    // SEND TO FIRESTORE & SIGNALING
    try {
      // A. Deduct Coins from Sender
      const senderRef = doc(db, "users", userId);
      const walletRef = walletId ? doc(db, "wallets", walletId) : null;

      if (walletRef) {
        await updateDoc(walletRef, {
          coins: increment(-gift.points),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(
          senderRef,
          {
            wallet: {
              coins: increment(-gift.points),
            },
          },
          { merge: true },
        );
      }

      // B. Add 70% of value to Host as Diamonds
      if (streamHostIdRef.current) {
        const hostEarnings = Math.ceil(gift.points * 0.7);

        // Get or create host wallet ID
        const hostWalletId = await getOrCreateWallet(
          streamHostIdRef.current,
          "customer",
        );
        const hostWalletRef = doc(db, "wallets", hostWalletId);

        await updateDoc(hostWalletRef, {
          diamonds: increment(hostEarnings),
          updatedAt: serverTimestamp(),
        });

        // Record Transaction for Host (Earnings)
        await addDoc(collection(db, "wallets", hostWalletId, "transactions"), {
          type: "gift_received",
          amountDiamonds: hostEarnings,
          giftName: gift.name,
          senderName: userName || "Viewer",
          senderId: userId,
          timestamp: serverTimestamp(),
          status: "completed",
        });
      }

      // Record Transaction for Sender (Spending)
      await addDoc(collection(db, "users", userId, "transactions"), {
        type: "gift_sent",
        amountCoins: gift.points,
        giftName: gift.name,
        recipientName: "Host",
        timestamp: serverTimestamp(),
        status: "completed",
      });

      // Send Command via Signal (Stream Video SDK)
      if (call) {
        call
          .sendCustomEvent({
            type: "gift",
            senderId: userId,
            senderAvatar: finalAvatar,
            userName: userName,
            giftName: gift.name,
            points: gift.points,
            icon: gift.icon,
            combo: newCount,
            timestamp: Date.now(),
          })
          .catch((e: any) => console.log("Gift Signal Error:", e));
      }

      // Sync with Firestore (Backup & Reliability)
      if (channelId) {
        LiveSessionService.incrementGifts(channelId, gift.points || 1).catch(
          (e) => console.error("Gift Score Error:", e),
        );

        if (isInPKRef.current && streamHostIdRef.current) {
          LiveSessionService.incrementPKHostScore(
            channelId,
            gift.points || 1,
            opponentChannelIdRef.current || undefined,
          ).catch((e) => console.error("PK Host Score Sync Error:", e));
        }

        LiveSessionService.broadcastGift(channelId, {
          giftName: gift.name,
          icon: gift.icon,
          points: gift.points || 1,
          senderName: userName || "Viewer",
          senderId: userId,
          ...(finalAvatar ? { senderAvatar: finalAvatar } : {}),
          targetName: "Host",
          combo: newCount,
        }).catch((e) => console.error("Gift Broadcast Error:", e));
      }
    } catch (error) {
      console.error("Gift Processing Error:", error);
      // Optionally revert local optimistic update on failure
    }
  };

  // Register user avatar & Handle Join/Leave Firestore
  useEffect(() => {
    // Reset State on Mount/Channel Change
    setTotalLikes(0);
    setHostScore(0);
    setGuestScore(0);
    setIsInPK(false);
    setGiftQueue([]);
    setFloatingHearts([]);
    console.log("🔄 Audience Screen Refreshed for Channel:", channelId);

    if (userAvatar && userId) {
      CustomBuilder.registerAvatar(userId, userAvatar);
    }
    if (userName && userId) {
      CustomBuilder.registerUserName(userId, userName);
    }

    // 1. Subscribe to session to get host details and sync state
    const unsubscribe = LiveSessionService.subscribeToSession(
      channelId,
      (session) => {
        if (session.status === "ended") {
          console.log("🎬 Session ended by host, closing screen");
          onClose();
          return;
        }

        if (session.hostId) {
          setStreamHostId(session.hostId);
          if (session.hostAvatar) {
            CustomBuilder.registerAvatar(session.hostId, session.hostAvatar);
          }
        }

        // Sync Flame Count
        if (session.totalLikes !== undefined) {
          setTotalLikes((prev) => Math.max(prev, session.totalLikes as number));
        }

        // Sync PK State
        if (session.pkState) {
          // Only update isInPK if it's actually changing to avoid re-triggering effects
          if (session.pkState.isActive !== isInPKRef.current) {
            setIsInPK(session.pkState.isActive);
          }

          // Always trust Firestore for scores
          if (session.pkState.hostScore !== undefined) {
            setHostScore(session.pkState.hostScore);
          }
          if (session.pkState.guestScore !== undefined) {
            setGuestScore(session.pkState.guestScore);
          }

          if (session.pkState.opponentName)
            setOpponentName(session.pkState.opponentName);
          const hName = session.pkState.hostName || session.hostName;
          if (hName) setPkHostName(hName);

          if (session.pkState.endTime) {
            setPkEndTime(session.pkState.endTime);
            const remaining = Math.max(
              0,
              Math.floor((session.pkState.endTime - Date.now()) / 1000),
            );
            setPkTimeRemaining(remaining);
          }

          if (session.pkState.opponentChannelId) {
            setOpponentChannelId(session.pkState.opponentChannelId);
          }

          if (
            session.pkState.winner &&
            !session.pkState.isActive &&
            session.pkState.endTime
          ) {
            // Only show result if scores are not 0-0 and we haven't shown THIS result yet
            const hScore = session.pkState.hostScore || 0;
            const gScore = session.pkState.guestScore || 0;
            const pkEndTimeVal = session.pkState.endTime || 0;

            if (
              (hScore > 0 || gScore > 0) &&
              !showPKResult &&
              handledPKEndTimeRef.current !== pkEndTimeVal
            ) {
              handledPKEndTimeRef.current = pkEndTimeVal;
              setPkWinner(session.pkState.winner);
              setShowPKResult(true);
              setTimeout(() => {
                setShowPKResult(false);
                setPkWinner(null);
              }, 5000);
            }
          } else if (session.pkState.isActive) {
            // Reset the handled flag when a new PK is active
            handledPKEndTimeRef.current = null;
            if (showPKResult) {
              setShowPKResult(false);
              setPkWinner(null);
            }
          }
        }

        // Sync Active Coupon from Firestore
        if (session.activeCoupon) {
          setActiveCoupon(session.activeCoupon);
          // Calculate remaining time
          if (session.activeCoupon.endTime) {
            const remaining = Math.max(
              0,
              Math.floor((session.activeCoupon.endTime - Date.now()) / 1000),
            );
            setCouponTimeRemaining(remaining);
          }
        } else {
          setActiveCoupon(null);
          setCouponTimeRemaining(0);
        }

        // Sync Gift Animations
        if (
          session.lastGift &&
          session.lastGift.timestamp > lastGiftTimestampRef.current
        ) {
          lastGiftTimestampRef.current = session.lastGift.timestamp;
          const isOwnGift =
            session.lastGift.senderName === userName ||
            session.lastGift.senderId === userId;
          const isAlreadyRecent = isSameGift(
            recentGiftRef.current,
            session.lastGift.senderId,
            session.lastGift.senderName,
            session.lastGift.giftName,
          );

          if (!isOwnGift) {
            if (isAlreadyRecent) {
              setRecentGift((prev) => {
                const updated = prev
                  ? {
                      ...prev,
                      count: session.lastGift!.combo || (prev.count || 0) + 1,
                    }
                  : null;
                recentGiftRef.current = updated;
                return updated;
              });

              if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
              const isBig = (session.lastGift!.points || 0) >= 500;
              giftTimerRef.current = setTimeout(
                () => {
                  setRecentGift(null);
                  recentGiftRef.current = null;
                },
                isBig ? 4500 : 3000,
              );
            } else {
              setGiftQueue((prev) => {
                // Check if matches tail of queue for aggregation
                const last = prev[prev.length - 1];
                if (
                  last &&
                  isSameGift(
                    last,
                    session.lastGift?.senderId || "",
                    session.lastGift?.senderName || "",
                    session.lastGift?.giftName || "",
                  )
                ) {
                  const updatedLast = {
                    ...last,
                    count: session.lastGift!.combo || (last.count || 0) + 1,
                  };
                  return [...prev.slice(0, -1), updatedLast];
                }

                return [
                  ...prev,
                  {
                    senderName: session.lastGift!.senderName,
                    giftName: session.lastGift!.giftName,
                    icon: session.lastGift!.icon,
                    count: session.lastGift!.combo || 1,
                    senderId: session.lastGift!.senderId,
                    senderAvatar: session.lastGift!.senderAvatar,
                    targetName: session.lastGift!.targetName,
                    isHost: false,
                    isBig: (session.lastGift!.points || 0) >= 500,
                  },
                ];
              });
            }
          }
        }

        // Sync Pinned Product
        if (session.pinnedProduct) {
          const pinnedProductId = session.pinnedProduct.productId;
          setPinEndTime(session.pinnedProduct.endTime || null);
          if (!pinnedProduct || pinnedProduct.id !== pinnedProductId) {
            getDoc(doc(db, "products", pinnedProductId))
              .then((snap: any) => {
                if (snap.exists()) {
                  setPinnedProduct({ id: snap.id, ...snap.data() });
                } else {
                  console.warn(
                    "Pinned product not found in database:",
                    pinnedProductId,
                  );
                  setPinnedProduct(null);
                }
              })
              .catch((error: any) => {
                console.error("Error fetching pinned product:", error);
                setPinnedProduct(null);
              });
          }
        } else if (session.currentProductId) {
          // Fallback for sessions using old structure
          const currentProductId = session.currentProductId;
          if (!pinnedProduct || pinnedProduct.id !== currentProductId) {
            getDoc(doc(db, "products", currentProductId))
              .then((snap: any) => {
                if (snap.exists()) {
                  setPinnedProduct({ id: snap.id, ...snap.data() });
                } else {
                  console.warn(
                    "Current product not found in database:",
                    currentProductId,
                  );
                  setPinnedProduct(null);
                }
              })
              .catch((error: any) => {
                console.error("Error fetching current product:", error);
                setPinnedProduct(null);
              });
          }
        } else {
          setPinnedProduct(null);
          setPinEndTime(null);
        }

        // Sync Featured Products
        if (
          session.featuredProductIds &&
          session.featuredProductIds.length > 0
        ) {
          if (featuredProducts.length !== session.featuredProductIds.length) {
            Promise.all(
              session.featuredProductIds.map((id: string) =>
                getDoc(doc(db, "products", id)),
              ),
            ).then((snaps) => {
              const list = snaps
                .map((s) => ({ id: s.id, ...s.data() }) as any)
                .filter((p: any) => p.name);
              setFeaturedProducts(list);
            });
          }
        } else {
          setFeaturedProducts([]);
        }

        // Sync Purchase Animation
        if (
          session.lastPurchase &&
          session.lastPurchase.timestamp > lastPurchaseTimeRef.current
        ) {
          lastPurchaseTimeRef.current = session.lastPurchase.timestamp;
          setPurchaseNotification({
            user: session.lastPurchase.purchaserName,
            product: getLocalizedName(session.lastPurchase.productName),
          });
          setTimeout(() => setPurchaseNotification(null), 5000);
        }
      },
    );

    // 2. Increment view count
    const joinFirestore = async () => {
      try {
        await LiveSessionService.joinSession(channelId);
      } catch (error) {
        console.error("Error joining Firestore:", error);
      }
    };

    const leaveFirestore = async () => {
      try {
        await LiveSessionService.leaveSession(channelId);
      } catch (error) {
        console.error("Error leaving Firestore:", error);
      }
    };

    joinFirestore();

    return () => {
      if (unsubscribe) unsubscribe();
      leaveFirestore();
    };
  }, [channelId, userAvatar, userId, userName]);

  // PK Timer Countdown for Audience
  useEffect(() => {
    if (!isInPK || !pkEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((pkEndTime - now) / 1000));
      setPkTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isInPK, pkEndTime]);

  // Pin Timer Countdown for Audience
  useEffect(() => {
    if (!pinEndTime) {
      setPinTimeRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((pinEndTime - now) / 1000));
      setPinTimeRemaining(remaining);

      if (remaining === 0) {
        // No local unpin here, wait for Firestore sync from host
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pinEndTime]);

  // Gift Animation Logic (Image/WebP Overlay)
  const showGiftAnimation = async (videoUrl?: string) => {
    // Since we have images/WebP and not MP4 videos, we don't need Zego Media Player.
    // The UI overlay already handles rendering the animated gift based on recentGift.
    try {
      setShowGiftVideo(true); // Mount the full-screen overlay

      // Auto-hide the animation after 4.5 seconds
      if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
      videoTimerRef.current = setTimeout(() => {
        setShowGiftVideo(false);
      }, 4500);
    } catch (error) {
      console.error("Error showing gift animation:", error);
      setShowGiftVideo(false);
    }
  };

  // Coupon Timer Effect - Robust Date-based calculation
  useEffect(() => {
    if (activeCoupon?.endTime) {
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(
          0,
          Math.floor((activeCoupon.endTime - now) / 1000),
        );
        setCouponTimeRemaining(remaining);

        if (remaining <= 0) {
          setActiveCoupon(null);
        }
      };

      updateTimer(); // Immediate update
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setCouponTimeRemaining(0);
    }
  }, [activeCoupon]);

  const likeBatchRef = useRef(0);
  const lastLikeSentTimeRef = useRef(0);

  const handleSendLike = () => {
    // Visual effects
    const id = ++heartCounter.current;
    const x = Math.random() * 60 - 30;
    setFloatingHearts((prev) => [...prev.slice(-15), { id, x }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 3000);

    // Stream Native Reaction
    if (call) {
      call
        .sendReaction({ type: "like", emoji_code: ":heart:" })
        .catch((e: any) => console.log("Reaction error", e));
    }

    // Optimistic Updates
    setLikeCount((prev) => prev + 1);
    setTotalLikes((prev) => prev + 1);

    // Batching Logic
    likeBatchRef.current += 1;
    const now = Date.now();

    // Send batch if > 1s passed or > 10 likes pending
    if (
      now - lastLikeSentTimeRef.current > 1000 ||
      likeBatchRef.current >= 10
    ) {
      const countToSend = likeBatchRef.current;
      likeBatchRef.current = 0;
      lastLikeSentTimeRef.current = now;

      console.log(
        `❤️ Sending Batch Like (${countToSend}) to Host:`,
        streamHostIdRef.current,
      );

      // 1. Stream Event instead of Zego InRoomCommand
      if (call) {
        call
          .sendCustomEvent({
            type: "stream:like",
            hostId: streamHostIdRef.current,
            userName: userName,
            count: countToSend,
          })
          .catch((err: any) => console.log("Stream Event Error:", err));
      }

      // 2. Update Firestore (Reliable, persistent)
      LiveSessionService.incrementLikes(channelId, countToSend).catch((e) =>
        console.error("Firestore Like Error:", e),
      );

      // 3. ✅ If in PK, also increment host's PK score atomically (Supports Cross-Room Sync)
      if (isInPKRef.current && streamHostIdRef.current) {
        LiveSessionService.incrementPKHostScore(
          channelId,
          countToSend,
          opponentChannelIdRef.current || undefined,
        ).catch((e) => console.error("PK Host Score Increment Error:", e));
      }
    }
  };

  const FloatingHeart = ({ x, id }: { x: number; id: number }) => {
    const animation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(animation, {
        toValue: 1,
        duration: 2500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }, []);

    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -500],
    });

    const opacity = animation.interpolate({
      inputRange: [0, 0.7, 1],
      outputRange: [1, 1, 0],
    });

    const scale = animation.interpolate({
      inputRange: [0, 0.1, 1],
      outputRange: [0.6, 1.2, 0.8],
    });

    return (
      <Animated.View
        key={id}
        style={{
          position: "absolute",
          bottom: 0,
          transform: [{ translateY }, { translateX: x }, { scale }],
          opacity,
        }}
      >
        <Heart size={36} color="#FF0066" fill="#FF0066" />
      </Animated.View>
    );
  };

  if (streamInitError || !client) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#000",
          },
        ]}
      >
        <View style={{ padding: 20, alignItems: "center" }}>
          <Radio
            size={64}
            color="#FFD700"
            style={{ marginBottom: 20, opacity: 0.5 }}
          />
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            {streamInitError ? "Connection Error" : "Live Service Loading..."}
          </Text>
          <Text
            style={{
              color: "#aaa",
              fontSize: 14,
              textAlign: "center",
              marginBottom: 30,
            }}
          >
            {streamInitError ||
              "The live service is taking longer than usual to initialize."}
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: "#FFD700",
              paddingHorizontal: 40,
              paddingVertical: 12,
              borderRadius: 25,
              width: 200,
              alignItems: "center",
            }}
            onPress={() => onRetryStreamInit?.()}
          >
            <Text style={{ color: "#000", fontWeight: "bold" }}>
              Retry Connection
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 20, padding: 10 }}
            onPress={onClose}
          >
            <Text style={{ color: "#aaa", textDecorationLine: "underline" }}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>

        {/* Floating Settings Button like in screenshot */}
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 150,
            right: 30,
            backgroundColor: "rgba(255,255,255,0.1)",
            padding: 12,
            borderRadius: 30,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
          }}
          onPress={() =>
            Alert.alert(
              "Connection Info",
              `Backend: ${API_BASE_URL}\nStream Key: ${STREAM_API_KEY ? "Present" : "Missing"}`,
            )
          }
        >
          <Settings size={28} color="#fff" opacity={0.5} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* PK BATTLE SCORE BAR - TikTok Premium Style */}
      {isInPK && (
        <Animatable.View
          animation="slideInDown"
          duration={800}
          style={{
            position: "absolute",
            top: 110, // Slightly lower to clear the top profile bar better
            width: "100%",
            alignItems: "center",
            zIndex: 2000,
            paddingHorizontal: 8,
          }}
        >
          {/* Integrated Timer & VS Badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 20,
              marginBottom: 3, // Pushed 8px more to the top
            }}
          >
            {/* Timer Display */}
            {pkTimeRemaining > 0 && (
              <View
                style={{
                  backgroundColor: "#121212",
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: pkTimeRemaining <= 30 ? "#FF0050" : "#00F2EA",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  shadowColor: pkTimeRemaining <= 30 ? "#FF0050" : "#00F2EA",
                  shadowOpacity: 0.6,
                  shadowRadius: 12,
                  elevation: 10,
                }}
              >
                <Timer
                  size={14}
                  color={pkTimeRemaining <= 30 ? "#FF0050" : "#FFF"}
                />
                <Text
                  style={{
                    color: pkTimeRemaining <= 30 ? "#FF0050" : "#fff",
                    fontSize: 14,
                    fontWeight: "900",
                    fontVariant: ["tabular-nums"],
                    letterSpacing: 0.5,
                  }}
                >
                  {Math.floor(pkTimeRemaining / 60)}:
                  {(pkTimeRemaining % 60).toString().padStart(2, "0")}
                </Text>
              </View>
            )}
          </View>

          {/* Progress Bar Container */}
          <View
            style={{
              width: "100%",
              height: 36,
              borderRadius: 18,
              overflow: "hidden",
              backgroundColor: "rgba(0,0,0,0.8)",
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.15)",
              flexDirection: "row",
              shadowColor: "#000",
              shadowOpacity: 0.5,
              shadowRadius: 15,
              elevation: 10,
              position: "relative",
            }}
          >
            {/* Host Side (Pink/Red) */}
            <LinearGradient
              colors={["#FF0050", "#FF4D80", "#FF0050"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                flex: Math.max(hostScore, 1),
                justifyContent: "center",
                paddingLeft: 18,
                borderRadius: 18, // Added for iOS
              }}
            >
              <Animatable.Text
                animation={hostScore > 0 ? "pulse" : undefined}
                iterationCount="infinite"
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "900",
                  textShadowColor: "rgba(0,0,0,0.5)",
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                {hostScore}
              </Animatable.Text>
              {hostScore > guestScore && (
                <View style={{ position: "absolute", top: 2, left: 16 }}>
                  <Trophy size={10} color="#FFD700" fill="#FFD700" />
                </View>
              )}
            </LinearGradient>

            {/* VS Center Indicator */}
            <View
              style={{
                position: "absolute",
                left: `${(Math.max(hostScore, 1) / (Math.max(hostScore, 1) + Math.max(guestScore, 1))) * 100}%`,
                top: 0,
                bottom: 0,
                width: 34,
                marginLeft: -17,
                zIndex: 15,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LinearGradient
                colors={["#121212", "#262626"]}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: "rgba(255,255,255,0.3)",
                  shadowColor: "#000",
                  shadowOpacity: 0.5,
                  shadowRadius: 5,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: "900",
                    fontStyle: "italic",
                  }}
                >
                  VS
                </Text>
              </LinearGradient>
            </View>

            {/* Guest Side (Blue/Cyan) */}
            <LinearGradient
              colors={["#00F2EA", "#3B82F6", "#00F2EA"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                flex: Math.max(guestScore, 1),
                alignItems: "flex-end",
                justifyContent: "center",
                paddingRight: 18,
                borderRadius: 18, // Added for iOS
              }}
            >
              <Animatable.Text
                animation={guestScore > 0 ? "pulse" : undefined}
                iterationCount="infinite"
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "900",
                  textShadowColor: "rgba(0,0,0,0.5)",
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                {guestScore}
              </Animatable.Text>
              {guestScore > hostScore && (
                <View style={{ position: "absolute", top: 2, right: 16 }}>
                  <Trophy size={10} color="#FFD700" fill="#FFD700" />
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Bottom Label Badges */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              marginTop: 8,
              paddingHorizontal: 12,
            }}
          >
            {/* Me / Host Label */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor:
                  hostScore >= guestScore ? "#FF0050" : "rgba(0,0,0,0.4)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 14,
                borderWidth: 1,
                borderColor:
                  hostScore >= guestScore
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.2)",
                gap: 4,
              }}
            >
              <User size={10} color="#FFF" fill="#FFF" />
              <Text
                style={{
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: "900",
                  letterSpacing: 0.5,
                }}
              >
                {pkHostName?.toUpperCase() ||
                  (t("hostLabel") || "HOST").toUpperCase()}
              </Text>
            </View>

            {/* Win Streak Indicator or Winning Message */}
            {hostScore !== guestScore && (
              <Animatable.View
                animation="fadeIn"
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  justifyContent: "center",
                  height: 20,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>
                  {hostScore > guestScore
                    ? (t("hostIsLeading") || "LEADING").toUpperCase()
                    : (t("opponentLeading") || "BEHIND").toUpperCase()}
                </Text>
              </Animatable.View>
            )}

            {/* Opponent Label */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor:
                  guestScore >= hostScore ? "#00F2EA" : "rgba(0,0,0,0.4)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 14,
                borderWidth: 1,
                borderColor:
                  guestScore >= hostScore
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.2)",
                gap: 4,
              }}
            >
              <Users size={10} color="#FFF" fill="#FFF" />
              <Text
                style={{
                  color: guestScore >= hostScore ? "#000" : "#fff",
                  fontSize: 10,
                  fontWeight: "900",
                  letterSpacing: 0.5,
                }}
              >
                {opponentName?.toUpperCase() ||
                  (t("opponentLabel") || "OPPONENT").toUpperCase()}
              </Text>
            </View>
          </View>
        </Animatable.View>
      )}

      {showPKResult && pkWinner && !isInPK && (
        <Animatable.View
          animation="fadeIn"
          duration={400}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        >
          <Animatable.View
            animation="zoomIn"
            duration={600}
            style={{ width: "88%", maxWidth: 360 }}
          >
            <LinearGradient
              colors={
                pkWinner === "Draw"
                  ? ["#FCD34D", "#F59E0B", "#D97706"]
                  : ["#10B981", "#059669", "#047857"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 32,
                padding: 2,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 25 },
                shadowOpacity: 0.5,
                shadowRadius: 35,
              }}
            >
              <BlurView
                intensity={95}
                tint="dark"
                style={{
                  borderRadius: 30,
                  paddingVertical: 45,
                  paddingHorizontal: 25,
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                {/* Confetti/Trophy Animation with Glow */}
                <Animatable.View
                  animation="pulse"
                  iterationCount="infinite"
                  style={{
                    flexDirection: "row",
                    marginBottom: 20,
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 36 }}>🎉</Text>
                  <View
                    style={{
                      shadowColor: pkWinner === "Draw" ? "#FBBF24" : "#10B981",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 1,
                      shadowRadius: 20,
                    }}
                  >
                    <Text style={{ fontSize: 56 }}>
                      {pkWinner === "Draw" ? "🤝" : "👑"}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 36 }}>🎉</Text>
                </Animatable.View>

                {/* Title with Letter Spacing */}
                <Text
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 14,
                    fontWeight: "800",
                    marginBottom: 15,
                    letterSpacing: 4,
                    textTransform: "uppercase",
                  }}
                >
                  {pkWinner === "Draw" ? t("battleEnded") : t("pkWinnerTitle")}
                </Text>

                {/* Modern Winner Card */}
                <LinearGradient
                  colors={
                    pkWinner === "Draw"
                      ? ["#FCD34D", "#F59E0B"]
                      : ["#10B981", "#34D399"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    width: "100%",
                    paddingVertical: 18,
                    borderRadius: 24,
                    marginBottom: 25,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 15,
                  }}
                >
                  <Text
                    style={{
                      color: "#000",
                      fontSize: 28,
                      fontWeight: "900",
                      textAlign: "center",
                      letterSpacing: 0.5,
                    }}
                  >
                    {pkWinner === "Draw" ? t("itsADraw") : pkWinner}
                  </Text>
                </LinearGradient>

                {/* Score Comparison Table */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    paddingHorizontal: 25,
                    paddingVertical: 18,
                    borderRadius: 20,
                    width: "100%",
                    justifyContent: "space-between",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <View style={{ alignItems: "center", flex: 1 }}>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 10,
                        marginBottom: 6,
                        fontWeight: "700",
                        letterSpacing: 1,
                      }}
                    >
                      {pkHostName?.toUpperCase() ||
                        (t("hostLabel") || "HOST").toUpperCase()}
                    </Text>
                    <Text
                      style={{
                        color: "#FF0055",
                        fontSize: 32,
                        fontWeight: "900",
                      }}
                    >
                      {hostScore}
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 1,
                      height: 30,
                      backgroundColor: "rgba(255,255,255,0.1)",
                      marginHorizontal: 15,
                    }}
                  />

                  <View style={{ alignItems: "center", flex: 1 }}>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 10,
                        marginBottom: 6,
                        fontWeight: "700",
                        letterSpacing: 1,
                      }}
                    >
                      {opponentName?.toUpperCase()}
                    </Text>
                    <Text
                      style={{
                        color: "#3B82F6",
                        fontSize: 32,
                        fontWeight: "900",
                      }}
                    >
                      {guestScore}
                    </Text>
                  </View>
                </View>

                {/* Message Footer */}
                <View style={{ marginTop: 25 }}>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 12,
                      fontWeight: "600",
                      fontStyle: "italic",
                    }}
                  >
                    {pkWinner === "Draw"
                      ? t
                        ? t("goodMatch")
                        : "What a match!"
                      : `🎉 ${t ? t("congratulations") : "Congratulations!"} 🎉`}
                  </Text>
                </View>
              </BlurView>
            </LinearGradient>
          </Animatable.View>
        </Animatable.View>
      )}

      {/* Stream Video Background */}
      {call ? (
        <View style={StyleSheet.absoluteFill}>
          <StreamCall call={call}>
<AudienceStreamContent
                remoteParticipants={remoteParticipants}
                participantCount={participantCount}
                streamDuration={streamDuration}
                formatDuration={formatDuration}
                onClose={onClose}
                floatingHearts={floatingHearts}
                pinnedProduct={pinnedProduct}
                getLocalizedName={getLocalizedName}
                featuredProducts={featuredProducts}
                setPinnedProduct={setPinnedProduct}
                handleSendLike={handleSendLike}
                setShowGifts={setShowGifts}
                setShowChat={setShowChat}
                t={t}
                hostAvatar={props.hostAvatar}
                hostBrandName={props.hostBrandName}
                totalLikes={totalLikes}
                isInPK={isInPK}
                hostCameraOn={hostCameraOn}
                activeCoupon={activeCoupon}
                couponTimeRemaining={couponTimeRemaining}
                setCouponInput={setCouponInput}
                couponInput={couponInput}
                setShowPurchaseModal={setShowPurchaseModal}
                setSelectedProduct={setSelectedProduct}
              />
          </StreamCall>
        </View>
      ) : (
        <View style={[StyleSheet.absoluteFill, { justifyContent: "center", alignItems: "center", backgroundColor: "#000" }]}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={{ color: "#fff", marginTop: 16, fontSize: 16, fontWeight: "600" }}>Joining Live Stream...</Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 8, fontSize: 12 }}>Connecting to host</Text>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 30, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>{t ? t("exit") : "Exit"}</Text>
          </TouchableOpacity>
        </View>
      )}
<LiveChatOverlay
          visible={showChat}
          channelId={channelId}
          onClose={() => setShowChat(false)}
          onOpen={() => setShowChat(true)}
          currentUserId={userId}
          hostAvatar={hostAvatar}
          hostName={hostBrandName}
          isHost={false}
        />

      {/* Gift Pill Notification */}
      {recentGift && !recentGift.isBig && (
        <View
          style={{
            position: "absolute",
            top: isInPK ? 220 : 180,
            left: 10,
            zIndex: 10000,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Animatable.View animation="slideInLeft" duration={400}>
            {(() => {
              const isGradient = (recentGift.points ?? 0) >= 10;
              const content = (
                <>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#FF0066",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1.5,
                      borderColor: "rgba(255,255,255,0.8)",
                      overflow: "hidden",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 3,
                    }}
                  >
                    <Image
                      source={
                        recentGift.senderAvatar
                          ? typeof recentGift.senderAvatar === "number"
                            ? recentGift.senderAvatar
                            : { uri: recentGift.senderAvatar }
                          : {
                              uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(recentGift.senderName || "User")}&background=random`,
                            }
                      }
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </View>

                  <View style={{ marginLeft: 10, marginRight: 40 }}>
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: 13,
                        textShadowColor: "rgba(0,0,0,0.5)",
                        textShadowRadius: 2,
                      }}
                      numberOfLines={1}
                    >
                      {recentGift.senderName}
                    </Text>
                    <Text
                      style={{
                        color: "#FBBF24",
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      {recentGift.isHost ? (t("hostSent") || "Host sent a") : (t("sentA") || "sent a")} {recentGift.giftName}
                    </Text>
                  </View>

                  <View
                    style={{
                      position: "absolute",
                      right: 1,
                      width: 48,
                      height: 48,
                      borderRadius: 26,
                      backgroundColor: "rgba(255, 255, 255, 0.25)",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: "rgba(255, 255, 255, 0.5)",
                      shadowColor: "#000",
                      shadowOffset: { width: 4, height: 4 },
                      shadowOpacity: 0.4,
                      shadowRadius: 6,
                      elevation: 8,
                    }}
                  >
                    <Animatable.Image
                      key={`gift-icon-${recentGift.count}`}
                      animation="tada"
                      duration={1000}
                      source={
                        typeof recentGift.icon === "number"
                          ? recentGift.icon
                          : { uri: recentGift.icon || "" }
                      }
                      style={{ width: 38, height: 38 }}
                      resizeMode="contain"
                    />
                  </View>
                </>
              );

              return isGradient ? (
                <LinearGradient
                  colors={["#FF0066", "#A855F7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 40,
                    paddingVertical: 4,
                    paddingHorizontal: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.5)",
                    minWidth: 250,
                  }}
                >
                  {content}
                </LinearGradient>
              ) : (
                <BlurView
                  intensity={95}
                  tint="dark"
                  style={{
                    borderRadius: 40,
                    paddingVertical: 4,
                    paddingHorizontal: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    minWidth: 250,
                    overflow: "hidden",
                  }}
                >
                  {content}
                </BlurView>
              );
            })()}

            {recentGift.count > 1 && (
              <Animatable.View
                key={`combo-${recentGift.count}`}
                animation="bounceIn"
                duration={500}
                style={{ marginLeft: 35 }}
              >
                <Text
                  style={{
                    color: "#FBBF24",
                    fontSize: 32,
                    fontWeight: "900",
                    fontStyle: "italic",
                    textShadowColor: "#000",
                    textShadowOffset: { width: 2, height: 2 },
                    textShadowRadius: 4,
                  }}
                >
                  x{recentGift.count}
                </Text>
              </Animatable.View>
            )}
          </Animatable.View>
        </View>
      )}

      {/* Audience Gift Modal */}
      <Modal
        visible={showGifts}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGifts(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowGifts(false)}
          />
          <View
            style={{
              backgroundColor: "#121218",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              height: Dimensions.get("window").height * 0.55,
              paddingBottom: Platform.OS === "ios" ? 34 : 10,
            }}
          >
            {/* Categories Bar */}
            <View
              style={{
                flexDirection: "row",
                borderBottomWidth: 1,
                borderBottomColor: "#222",
                paddingHorizontal: 10,
              }}
            >
              {["POPULAIRE", "SPÉCIAL", "LUXE"].map((cat: any) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setGiftCategory(cat)}
                  style={{
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    borderBottomWidth: giftCategory === cat ? 2 : 0,
                    borderBottomColor: "#FF0066",
                  }}
                >
                  <Text
                    style={{
                      color: giftCategory === cat ? "#fff" : "#888",
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Gift Grid */}
            <FlatList
              key={giftCategory}
              numColumns={4}
              data={GIFTS.filter((g) => {
                if (giftCategory === "POPULAIRE") return g.points < 100;
                if (giftCategory === "SPÉCIAL")
                  return g.points >= 100 && g.points < 500;
                if (giftCategory === "LUXE") return g.points >= 500;
                return true;
              })}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 10 }}
              renderItem={({ item: gift }) => {
                const isSelected = selectedGift?.id === gift.id;
                return (
                  <TouchableOpacity
                    onPress={() => setSelectedGift(gift)}
                    style={{
                      width: "25%",
                      aspectRatio: 0.85,
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 5,
                      marginVertical: 5,
                      borderRadius: 12,
                      backgroundColor: isSelected
                        ? "rgba(255, 0, 102, 0.15)"
                        : "transparent",
                      borderWidth: 1.5,
                      borderColor: isSelected ? "#FF0066" : "transparent",
                    }}
                  >
                    <View
                      style={{
                        width: 55,
                        height: 55,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 6,
                      }}
                    >
                      <Image
                        source={
                          typeof gift.icon === "number"
                            ? gift.icon
                            : { uri: gift.icon }
                        }
                        style={{ width: 48, height: 48 }}
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}
                    >
                      {gift.name}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 2,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? "#fff" : "#FFD700",
                          fontSize: 9,
                          fontWeight: "900",
                        }}
                      >
                        {gift.points}
                      </Text>
                      <Coins
                        size={8}
                        color={isSelected ? "#fff" : "#FFD700"}
                        style={{ marginLeft: 2 }}
                        fill={isSelected ? "#fff" : "#FFD700"}
                      />
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            {/* Bottom Actions */}
            <BlurView
              intensity={90}
              tint="dark"
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.1)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 15,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}
                  >
                    {userBalance.toLocaleString()}
                  </Text>
                  <Coins
                    size={12}
                    color="#F59E0B"
                    style={{ marginLeft: 4 }}
                    fill="#F59E0B"
                  />
                  <TouchableOpacity
                    style={{ marginLeft: 8 }}
                    onPress={() => {
                      setShowGifts(false);
                    }}
                  >
                    <PlusCircle size={16} color="#FF0066" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (selectedGift) {
                    sendGift(selectedGift);
                    setSelectedGift(null);
                  }
                }}
                disabled={!selectedGift}
                style={{
                  backgroundColor: selectedGift
                    ? "#FF0066"
                    : "rgba(255,255,255,0.1)",
                  paddingHorizontal: 28,
                  paddingVertical: 12,
                  borderRadius: 25,
                  flexDirection: "row",
                  alignItems: "center",
                  opacity: selectedGift ? 1 : 0.5,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "900",
                    fontSize: 15,
                    marginRight: 8,
                  }}
                >
                  {t("send") || "ENVOYER"}
                </Text>
                <Send size={18} color="#fff" />
              </TouchableOpacity>
            </BlurView>
</View>
         </View>
       </Modal>

       {/* Purchase Modal */}
       <Modal
         visible={showPurchaseModal}
         transparent={true}
         animationType="slide"
         onRequestClose={() => setShowPurchaseModal(false)}
       >
         <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" }}>
           <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowPurchaseModal(false)} />
           <View style={{ backgroundColor: "#121218", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: Platform.OS === "ios" ? 34 : 20 }}>
             {selectedProduct && (
               <>
                 <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                   <Image source={{ uri: selectedProduct.images?.[0] }} style={{ width: 60, height: 60, borderRadius: 10, backgroundColor: "#333" }} />
                   <View style={{ flex: 1, marginLeft: 12 }}>
                     <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }} numberOfLines={1}>{getLocalizedName(selectedProduct.name)}</Text>
                     <Text style={{ color: "#F59E0B", fontWeight: "900", fontSize: 18 }}>{selectedProduct.discountPrice || selectedProduct.price} TND</Text>
                   </View>
                 </View>

                 {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                   <View style={{ marginBottom: 12 }}>
                     <Text style={{ color: "#aaa", marginBottom: 6 }}>Color</Text>
                     <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                       {selectedProduct.colors.map((c: string) => (
                         <TouchableOpacity key={c} onPress={() => setSelectedColor(c)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: selectedColor === c ? "#F59E0B" : "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: selectedColor === c ? "#F59E0B" : "rgba(255,255,255,0.2)" }}>
                           <Text style={{ color: selectedColor === c ? "#000" : "#fff", fontWeight: "bold" }}>{c}</Text>
                         </TouchableOpacity>
                       ))}
                     </View>
                   </View>
                 )}

                 {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                   <View style={{ marginBottom: 12 }}>
                     <Text style={{ color: "#aaa", marginBottom: 6 }}>Size</Text>
                     <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                       {selectedProduct.sizes.map((s: string) => (
                         <TouchableOpacity key={s} onPress={() => setSelectedSize(s)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: selectedSize === s ? "#F59E0B" : "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: selectedSize === s ? "#F59E0B" : "rgba(255,255,255,0.2)" }}>
                           <Text style={{ color: selectedSize === s ? "#000" : "#fff", fontWeight: "bold" }}>{s}</Text>
                         </TouchableOpacity>
                       ))}
                     </View>
                   </View>
                 )}

                 <TextInput
                   placeholder="Full Name"
                   placeholderTextColor="#555"
                   value={customerName}
                   onChangeText={setCustomerName}
                   style={{ backgroundColor: "#0F0F16", borderRadius: 12, padding: 14, color: "#fff", marginBottom: 12, borderWidth: 1, borderColor: "#2A2A35" }}
                 />
                 <TextInput
                   placeholder="Phone Number"
                   placeholderTextColor="#555"
                   value={phoneNumber}
                   onChangeText={setPhoneNumber}
                   keyboardType="phone-pad"
                   style={{ backgroundColor: "#0F0F16", borderRadius: 12, padding: 14, color: "#fff", marginBottom: 12, borderWidth: 1, borderColor: "#2A2A35" }}
                 />
                 <TextInput
                   placeholder="Shipping Address"
                   placeholderTextColor="#555"
                   value={address}
                   onChangeText={setAddress}
                   style={{ backgroundColor: "#0F0F16", borderRadius: 12, padding: 14, color: "#fff", marginBottom: 20, borderWidth: 1, borderColor: "#2A2A35" }}
                 />

                 <TouchableOpacity onPress={handlePurchase} style={{ backgroundColor: "#10B981", paddingVertical: 16, borderRadius: 12, alignItems: "center" }}>
                   <Text style={{ color: "#000", fontWeight: "900", fontSize: 16 }}>Place Order</Text>
                 </TouchableOpacity>
               </>
             )}
           </View>
         </View>
       </Modal>
     </View>
   );
}
