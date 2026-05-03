import React, { useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Alert,
  Text,
  TouchableOpacity,
  Image,
  ActionSheetIOS,
  Platform,
  findNodeHandle,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
  AppState,
  KeyboardAvoidingView,
  Dimensions,
  Clipboard,
  FlatList,
  Share,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import {
  Gift as GiftIcon,
  Swords,
  Sparkles,
  MoreHorizontal,
  X,
  Share2,
  Flame,
  Radio,
  Ticket,
  Clock,
  ShoppingBag,
  BarChart2,
  Pin,
  MessageCircle,
  Camera,
  Heart,
  PlusCircle,
  Send,
  Timer,
  ArrowRight,
  Gem,
  QrCode,
  Scan,
  Copy,
  CreditCard,
  UserPlus,
  UserCheck,
  Trophy,
  Ruler,
  BrainCircuit,
  Printer,
  Sticker,
  Settings,
  Users,
  ChessKingIcon,
  Coins,
  User,
  Mic,
  MicOff,
  CameraOff,
  FlipHorizontal,
  Square,
  CircleDot,
} from "lucide-react-native";
import Constants from "expo-constants";
import { API_BASE_URL } from "../config/api";
import { STREAM_API_KEY } from "../config/stream";
import { CustomBuilder } from "../utils/CustomBuilder";
import { LiveSessionService } from "../services/LiveSessionService";
import { FlameCounter } from "../components/FlameCounter";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  increment,
  addDoc,
  serverTimestamp,
  updateDoc,
  runTransaction,
} from "firebase/firestore";
import { getOrCreateWallet } from "../services/codFinancialService";
import { BlurView } from "expo-blur";
import { db } from "../api/firebase";
import { GIFTS, Gift } from "../config/gifts";
import { RechargeModal } from "../components/RechargeModal";
import { uploadToSanity } from "../utils/sanity";

import {
  StreamCall,
  useStreamVideoClient,
  StreamVideoClient,
  useCallStateHooks,
  ParticipantView,
  FloatingParticipantView,
  BackgroundFiltersProvider,
  useBackgroundFilters,
  useScreenshot,
  useAutoEnterPiPEffect,
  useIsInPiPMode,
  LivestreamLayout,
  HostLivestream,
} from "@stream-io/video-react-native-sdk";
import { useChatContext } from "stream-chat-react-native";
import { LiveChatOverlay } from "../components/LiveChatOverlay";

// ✅ Stream SDK configuration handled via STREAM_API_KEY from config/stream

type Props = {
  channelId: string;
  userId: string;
  userName: string;
  brandId?: string;
  collabId?: string;
  hostAvatar?: string;
  streamInitError?: string | null;
  onRetryStreamInit?: () => void;
  onClose: () => void;
  t?: (key: string) => string;
  language?: "fr" | "ar" | "en";
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    zIndex: 0,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    backgroundColor: "#5c5c5c",
    borderRadius: 1000,
    marginRight: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  memberItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberName: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

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
    // Resolution logic: if userName is valid, register it
    const looksLikeUserId = (s: string) =>
      !s || (s.length > 20 && /^[a-zA-Z0-9]+$/.test(s));
    if (userName && !looksLikeUserId(userName)) {
      CustomBuilder.registerUserName(userId, userName);
    }

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

type HostStreamContentProps = {
  hostAvatar?: string;
  brandName: string;
  resolvedName: string;
  userName: string;
  t: (key: string) => string;
  endFirestoreSession: () => void;
  floatingHearts: any[];
  totalLikes: number;
  isInPK: boolean;
  handleSendLike: () => void;
  pinnedProduct: any;
  handleUnpin: () => void;
  getLocalizedName: (name: any) => string;
  selectedProductIds: string[];
  products: any[];
  pinnedProductId: string | null;
  setPinnedProductId: (id: string) => void;
  setPinnedProduct: (p: any) => void;
  setPinEndTime: (t: number | null) => void;
  showProductModal: boolean;
  setShowProductModal: (v: boolean) => void;
  showPollModal: boolean;
  setShowPollModal: (v: boolean) => void;
  showPKInviteModal: boolean;
  setShowPKInviteModal: (v: boolean) => void;
  activePoll: any;
  setActivePoll: (p: any) => void;
  durationSeconds: number;
  formatDuration: (s: number) => string;
};

const HostStreamContent = ({
  hostAvatar,
  brandName,
  resolvedName,
  userName,
  t,
  endFirestoreSession,
  floatingHearts,
  totalLikes,
  isInPK,
  handleSendLike,
  pinnedProduct,
  handleUnpin,
  getLocalizedName,
  selectedProductIds,
  products,
  pinnedProductId,
  setPinnedProductId,
  setPinnedProduct,
  setPinEndTime,
  showProductModal,
  setShowProductModal,
  showPollModal,
  setShowPollModal,
  showPKInviteModal,
  setShowPKInviteModal,
  activePoll,
  setActivePoll,
  durationSeconds,
  formatDuration,
}: HostStreamContentProps) => {
  const { useCameraState, useMicrophoneState, useLocalParticipant, useParticipantCount } = useCallStateHooks();
  const camState = useCameraState();
  const { microphone, optimisticIsMute: isMicMuted } = useMicrophoneState();
  const isCameraOn = camState?.isEnabled ?? true;
  const localParticipant = useLocalParticipant();
  const participantCount = useParticipantCount();

  return (
    <>
      {localParticipant && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <FloatingParticipantView
            participant={localParticipant}
            alignment="top-right"
            mirror
          />
        </View>
      )}

      {!isCameraOn && (
        <View style={[StyleSheet.absoluteFill, { justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a2e", zIndex: 1 }]}>
          <Image source={{ uri: hostAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(brandName || resolvedName || userName)}&background=random` }} style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: "#fff" }} />
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 16 }}>{brandName || resolvedName || userName}</Text>
        </View>
      )}

      <View style={{ position: "absolute", top: 50, left: 15, right: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 100 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(239, 68, 68, 0.9)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff", marginRight: 6 }} />
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11 }}>LIVE</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>👁 {participantCount}</Text>
          </View>
          <View style={{ backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>{formatDuration(durationSeconds)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => Alert.alert(t("endLiveTitle") || "End Live", t("endLiveConfirm") || "Are you sure?", [{ text: t("cancel") || "Cancel", style: "cancel" }, { text: t("end") || "End", style: "destructive", onPress: endFirestoreSession }])} style={{ backgroundColor: "rgba(0,0,0,0.5)", width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
          <X size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {floatingHearts.map((heart: any) => (
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
            <TouchableOpacity onPress={handleUnpin} style={{ position: "absolute", top: 4, right: 4, backgroundColor: "rgba(255, 255, 255, 0.15)", width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" }}>
              <X size={10} color="#fff" />
            </TouchableOpacity>
          </BlurView>
        </Animatable.View>
      )}

      {selectedProductIds.length > 0 && (
        <View style={{ position: "absolute", bottom: 80, left: 0, right: 0, zIndex: 250 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, gap: 10 }}>
            {products.filter((p) => selectedProductIds.includes(p.id)).map((p) => {
              const isPinned = pinnedProductId === p.id;
              return (
                <TouchableOpacity key={p.id} onPress={() => { setPinnedProductId(p.id); setPinnedProduct(p); setPinEndTime(Date.now() + 300000); }} style={{ width: 90, borderRadius: 14, backgroundColor: isPinned ? "rgba(16, 185, 129, 0.2)" : "rgba(0,0,0,0.7)", borderWidth: isPinned ? 2 : 1, borderColor: isPinned ? "#10B981" : "rgba(255,255,255,0.1)", padding: 6, overflow: "hidden" }}>
                  <Image source={{ uri: p.images?.[0] }} style={{ width: 78, height: 78, borderRadius: 10, backgroundColor: "#333" }} />
                  {p.discountPrice && <View style={{ position: "absolute", top: 8, left: 4, backgroundColor: "#EF4444", paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}><Text style={{ color: "#fff", fontSize: 7, fontWeight: "900" }}>-{Math.round((1 - p.discountPrice / p.price) * 100)}%</Text></View>}
                  <View style={{ marginTop: 4 }}>
                    <Text numberOfLines={1} style={{ color: "#fff", fontSize: 9, fontWeight: "600" }}>{getLocalizedName(p.name)}</Text>
                    <Text style={{ color: isPinned ? "#10B981" : "#F59E0B", fontSize: 11, fontWeight: "900" }}>{p.discountPrice || p.price} TND</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={{ position: "absolute", bottom: 180, right: 15, gap: 10, alignItems: "center", zIndex: 400 }}>
        <TouchableOpacity onPress={handleSendLike} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(239, 68, 68, 0.8)", alignItems: "center", justifyContent: "center" }}>
          <Heart size={18} color="#fff" fill="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowProductModal(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
          <ShoppingBag size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowPollModal(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: activePoll ? "#8B5CF6" : "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: activePoll ? "#A78BFA" : "rgba(255,255,255,0.2)" }}>
          <BarChart2 size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowPKInviteModal(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isInPK ? "#FFA500" : "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: isInPK ? "#FFD700" : "rgba(255,255,255,0.2)" }}>
          <Swords size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ position: "absolute", bottom: 20, left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16, zIndex: 400 }}>
        <TouchableOpacity onPress={async () => { try { if (camState?.camera) await camState.camera.toggle(); } catch (e) { console.error("Camera toggle error:", e); } }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isCameraOn ? "rgba(0,0,0,0.6)" : "#EF4444", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
          {isCameraOn ? <Camera size={20} color="#fff" /> : <CameraOff size={20} color="#fff" />}
        </TouchableOpacity>
        <TouchableOpacity onPress={async () => { try { if (microphone) await microphone.toggle(); } catch (e) { console.error("Mic toggle error:", e); } }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
          {isMicMuted ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
        </TouchableOpacity>
        <TouchableOpacity onPress={async () => { try { if (camState?.camera) await camState.camera.flip(); } catch (e) { console.error("Camera flip error:", e); } }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
          <FlipHorizontal size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {activePoll && (
        <Animatable.View animation="slideInUp" duration={400} style={{ position: "absolute", bottom: 300, left: 15, right: 15, zIndex: 350 }}>
          <BlurView intensity={85} tint="dark" style={{ borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: "rgba(139, 92, 246, 0.5)", overflow: "hidden" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#8B5CF6", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <BarChart2 size={10} color="#fff" style={{ marginRight: 4 }} />
                <Text style={{ color: "#fff", fontSize: 9, fontWeight: "900" }}>POLL</Text>
              </View>
              <TouchableOpacity onPress={() => setActivePoll(null)} style={{ padding: 4 }}><X size={14} color="rgba(255,255,255,0.6)" /></TouchableOpacity>
            </View>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 10 }}>{activePoll.question}</Text>
            {activePoll.options.map((opt: any) => {
              const totalVotes = activePoll.options.reduce((sum: number, o: any) => sum + o.votes, 0);
              const percentage = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
              return (
                <TouchableOpacity key={opt.id} onPress={() => { const updated = { ...activePoll, options: activePoll.options.map((o: any) => o.id === opt.id ? { ...o, votes: o.votes + 1 } : o) }; setActivePoll(updated); }} style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, padding: 10, marginBottom: 6 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: "#fff", fontSize: 12 }}>{opt.text}</Text>
                    <Text style={{ color: "#8B5CF6", fontWeight: "700", fontSize: 12 }}>{percentage.toFixed(0)}%</Text>
                  </View>
                  <View style={{ height: 3, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${percentage}%`, backgroundColor: "#8B5CF6", borderRadius: 2 }} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </BlurView>
        </Animatable.View>
      )}

      {/* Modals - TODO: Implement inline */}
    </>
  );
};

export default function HostLiveScreen(props: Props) {
  const t = typeof props.t === "function" ? props.t : (key: string) => key;
  const {
    channelId,
    userId,
    userName,
    brandId,
    collabId,
    hostAvatar,
    streamInitError,
    onRetryStreamInit,
    onClose,
    language,
  } = props;

  const getLocalizedName = (name: any): string => {
    if (!name) return "";
    if (typeof name === "string") return name;
    if (typeof name === "object") {
      try {
        const lang = language || "fr";
        const langKey = lang === "ar" ? "ar-tn" : lang;
        if (name[langKey] && typeof name[langKey] === "string")
          return name[langKey];
        if (name.fr && typeof name.fr === "string") return name.fr;
        if (name.en && typeof name.en === "string") return name.en;
        if (name.ar && typeof name.ar === "string") return name.ar;
        return (
          (Object.values(name).find((v) => typeof v === "string") as string) ||
          ""
        );
      } catch (e) {
        return "";
      }
    }
    return String(name) || "";
  };

  const tr = (en: string, fr: string, ar: string) => {
    return language === "ar" ? ar : language === "fr" ? fr : en;
  };

  const HostStreamUI = () => {
    const {
      useLocalParticipant,
      useParticipantCount,
      useMicrophoneState,
      useCameraState,
    } = useCallStateHooks();
    const localParticipant = useLocalParticipant();
    const participantCount = useParticipantCount();

     const { microphone, optimisticIsMute: isMicMuted } = useMicrophoneState();
     const camState = useCameraState();
     const { camera } = camState ?? {};
     const isCamOn = camState?.isEnabled ?? true;

     const toggleMic = async () => {
       try {
         await microphone.toggle();
       } catch (e) {
         console.error("Mic toggle error:", e);
       }
     };

     const toggleCam = async () => {
       try {
         if (!camera) return;
         await camera.toggle();
       } catch (e) {
         console.error("Camera toggle error:", e);
       }
     };

     const switchCam = async () => {
       try {
         if (!camera) return;
         await camera.flip();
       } catch (e) {
         console.error("Switch camera error:", e);
       }
     };

    // Filter button using BackgroundFiltersProvider
    const FilterButton = () => {
      const {
        isSupported,
        applyBackgroundBlurFilter,
        disableAllFilters,
        currentBackgroundFilter,
      } = useBackgroundFilters();

      const toggleFilter = () => {
        if (!isSupported) return;
        if (!currentBackgroundFilter) {
          applyBackgroundBlurFilter("medium");
        } else if (currentBackgroundFilter.blur) {
          const level = currentBackgroundFilter.blur;
          if (level === "light") applyBackgroundBlurFilter("medium");
          else if (level === "medium") applyBackgroundBlurFilter("heavy");
          else disableAllFilters();
        } else {
          disableAllFilters();
        }
      };

      if (!isSupported) return null;
      return (
        <TouchableOpacity
          onPress={toggleFilter}
          style={{
            position: "absolute",
            top: 50,
            right: 15,
            width: 37,
            height: 37,
            borderRadius: 20,
            backgroundColor: "rgba(0,0,0,0.6)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
            overflow: "hidden",
          }}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <Sparkles size={16} color="#fff" />
        </TouchableOpacity>
      );
    };

    return (
      <>
        {/* Top-left AV controls */}
        <View
          style={{
            position: "absolute",
            top: 90,
            left: 15,
            gap: 8,
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          {/* Mic Toggle */}
          <TouchableOpacity
            onPress={toggleMic}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              overflow: "hidden",
            }}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            {isMicMuted ? (
              <MicOff size={14} color="#fff" />
            ) : (
              <Mic size={14} color="#fff" />
            )}
          </TouchableOpacity>

          {/* Camera Toggle */}
          <TouchableOpacity
            onPress={toggleCam}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              overflow: "hidden",
            }}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            {!isCamOn ? (
              <CameraOff size={14} color="#fff" />
            ) : (
              <Camera size={14} color="#fff" />
            )}
          </TouchableOpacity>

          {/* Switch Camera */}
          <TouchableOpacity
            onPress={switchCam}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              overflow: "hidden",
            }}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            <FlipHorizontal size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Top-right Filter Button */}
        <FilterButton />

        {/* LIVE indicator */}
        <View
          style={{
            position: "absolute",
            top: 50,
            left: 15,
            backgroundColor: "rgba(0,0,0,0.4)",
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 15,
            flexDirection: "row",
            alignItems: "center",
            zIndex: 1000,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.15)",
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#10B981",
              marginRight: 6,
            }}
          />
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 10 }}>
            {participantCount} {tr("LIVE", "DIRECT", "مباشر")}
          </Text>
        </View>
      </>
    );
  };
  const client = useStreamVideoClient();

  // Try to get chat client, but handle if not available
  let chatClient = null;
  try {
    const { client: streamChatClient } = useChatContext();
    chatClient = streamChatClient;
  } catch (e) {
    console.log("Chat context not available in HostLiveScreen");
  }

  // Try to use screenshot, handle if not available
  let takeScreenshot = null;
  try {
    const screenshot = useScreenshot();
    takeScreenshot = screenshot?.takeScreenshot;
  } catch (e) {
    console.log("Screenshot context not available");
  }

  const [call, setCall] = useState<any>(null);
  const [resolvedName, setResolvedName] = useState(userName);
  const [brandName, setBrandName] = useState<string>("");
  const [isLiveStarted, setIsLiveStarted] = useState(false);

  // Auto-enter Picture-in-Picture when app backgrounds
  useAutoEnterPiPEffect(false);
  const isInPiP = useIsInPiPMode();

  // Initialize chat channel when call becomes live
  useEffect(() => {
    if (!call || !chatClient || !channelId) return;

    const initChatChannel = async () => {
      try {
        // Ensure chat client is connected
        if (!chatClient.userID) {
          console.log("Chat client not connected, waiting...");
          return;
        }

        const chatChannel = chatClient.channel("livestream", channelId, {
          members: [userId],
        } as any);

        try {
          await chatChannel.watch();
          console.log("✅ Chat channel connected:", channelId);
        } catch (err: any) {
          console.error("Chat channel error:", err.message);
        }
      } catch (e) {
        console.error("Chat init error:", e);
      }
    };

    initChatChannel();
  }, [call, chatClient, channelId, userId, isLiveStarted]);

  useEffect(() => {
    if (userId) {
      getDoc(doc(db, "users", userId)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const name =
            data.fullName || data.userName || data.name || data.displayName;
          if (name && name !== userId && !name.includes("@")) {
            setResolvedName(name);
            CustomBuilder.registerUserName(userId, name);
          }
        }
      });
    }
  }, [userId]);

  // Fetch brand name from Firestore
  useEffect(() => {
    const fetchBrandName = async () => {
      try {
        // First try to get brand name from collaborations collection
        if (collabId && !collabId.startsWith("live_")) {
          const collabSnap = await getDoc(doc(db, "collaborations", collabId));
          if (collabSnap.exists()) {
            const collabData = collabSnap.data();
            const name = collabData.name || collabData.brandName || collabData.marque;
            if (name) {
              const resolved = typeof name === "object" ? (name.fr || name.en || name.ar || Object.values(name).find(v => typeof v === "string") || "") : name;
              setBrandName(resolved);
              return;
            }
          }
        }
        // If no collab name, try to get brand from users collection
        if (brandId) {
          const brandSnap = await getDoc(doc(db, "users", brandId));
          if (brandSnap.exists()) {
            const brandData = brandSnap.data();
            const name = brandData.brandName || brandData.fullName || brandData.marque;
            if (name) {
              const resolved = typeof name === "object" ? (name.fr || name.en || name.ar || Object.values(name).find(v => typeof v === "string") || "") : name;
              setBrandName(resolved);
              return;
            }
          }
        }
      } catch (e) {
        console.error("Error fetching brand name:", e);
      }
    };
    fetchBrandName();
  }, [brandId, collabId]);

  useEffect(() => {
    // If we have an initialization error, we don't proceed with call setup
    if (streamInitError || !client || !channelId) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    let _call: any; // Declare outer so cleanup can access
    let unsubscribeCustomEvent: (() => void) | null = null;
    let unsubscribeReaction: (() => void) | null = null;

    const setupCall = async () => {
      try {
        // Create the call with proper livestream settings
        _call = client.call("livestream", channelId);

        // Set up event listeners BEFORE joining
        unsubscribeCustomEvent = _call.on("custom", (event: any) => {
          if (event.custom?.type === "stream:like") {
            if (event.user?.id !== userId) {
              const id = Date.now() + Math.random();
              const x = Math.random() * 60 - 30;
              setFloatingHearts((prev: any) => [...prev.slice(-15), { id, x }]);
              setTimeout(() => {
                setFloatingHearts((prev: any) =>
                  prev.filter((h: any) => h.id !== id),
                );
              }, 3000);
            }
          }
        });

        unsubscribeReaction = _call.on("call.reaction_new", (event: any) => {
          if (event.user?.id !== userId && event.reaction?.type === "like") {
            const id = Date.now() + Math.random();
            const x = Math.random() * 60 - 30;
            setFloatingHearts((prev: any) => [...prev.slice(-15), { id, x }]);
            setTimeout(() => {
              setFloatingHearts((prev: any) =>
                prev.filter((h: any) => h.id !== id),
              );
            }, 3000);
          }
        });

        // Create or get existing call with basic settings (no custom override)
        await _call.getOrCreate({
          data: {
            custom: {
              type: "livestream",
              hostId: userId,
              hostName: userName,
            },
          },
        });

        // Join the call as host
        await _call.join();

        // Wait a moment for join to settle
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Transition from backstage to live so audience can join
        await _call.goLive({
          start_recording: true,
        });

        if (!isMounted) return;

        setCall(_call);
        setIsLiveStarted(true);
        console.log("✅ Host livestream started successfully:", channelId);

        // Cleanup timeout
        if (timeoutId) clearTimeout(timeoutId);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("❌ Failed to start livestream:", err);
        Alert.alert(
          t("connectionError") || "Erreur de connexion",
          t("joinFailedMsg") ||
            "Impossible de démarrer le direct. Veuillez réessayer.",
          [{ text: t("ok") || "OK", onPress: onClose }],
        );
      }
    };

    // Set up timeout
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.error("⏰ Livestream setup timeout after 30s");
        Alert.alert(
          "Timeout",
          "Starting livestream took too long. Please check your connection.",
          [{ text: "OK", onPress: onClose }],
        );
      }
    }, 30000);

    setupCall();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribeCustomEvent) unsubscribeCustomEvent();
      if (unsubscribeReaction) unsubscribeReaction();
      if (_call && _call.state?.callingState !== "left") {
        _call
          .leave()
          .catch((err: any) => console.error("❌ Failed to leave call:", err));
      }
    };
  }, [client, channelId, userId, userName, t, onClose, streamInitError]);

  const mediaViewRef = useRef<any>(null);
  const mediaPlayerRef = useRef<any>(null);
  const [blockedApplying, setBlockedApplying] = useState<string[]>([]);
  const [mutedUsers, setMutedUsers] = useState<string[]>([]); // Per-user comment mute
  // Custom member action sheet state (replaces native Zego popup)
  const [memberActionSheet, setMemberActionSheet] = useState<{
    visible: boolean;
    userId: string;
    userName: string;
    isCoHost: boolean;
    isBlocked: boolean;
    isMuted: boolean;
  } | null>(null);
  const [showGiftVideo, setShowGiftVideo] = useState(false);
  // Gift Queue System
  const [giftQueue, setGiftQueue] = React.useState<
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
  const [recentGift, setRecentGift] = React.useState<{
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
  const videoTimerRef = useRef<any>(null);
  const [showGifts, setShowGifts] = useState(false);
  const [roomUsers, setRoomUsers] = useState<any[]>([]);
  const [selectedTargetUser, setSelectedTargetUser] = useState<any>(null);
  const [totalLikes, setTotalLikes] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState<
    { id: number; x: number }[]
  >([]);

  // PK Battle State
  const [userRole, setUserRole] = useState("host");
  const [walletId, setWalletId] = useState<string | null>(null);
  const [isInPK, setIsInPK] = useState(false);
  const isInPKRef = useRef(false);
  const [hostScore, setHostScore] = useState(0);
  const hostScoreRef = useRef(0);
  const [guestScore, setGuestScore] = useState(0);
  const guestScoreRef = useRef(0);
  const [opponentName, setOpponentName] = useState("Opponent");
  const opponentNameRef = useRef("Opponent");
  const opponentChannelIdRef = useRef<string | null>(null);
  const [pkBattleId, setPkBattleId] = useState<string | null>(null);
  const [showPKInviteModal, setShowPKInviteModal] = useState(false);
  const roomUserMap = useRef(new Map<string, any>());
  const [targetHostId, setTargetHostId] = useState("");
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [opponentChannelId, setOpponentChannelId] = useState<string | null>(
    null,
  );

  // PK Timer State
  const [pkDuration, setPkDuration] = useState(180); // Default 3 minutes in seconds
  const [pkTimeRemaining, setPkTimeRemaining] = useState(0);
  const [pkEndTime, setPkEndTime] = useState<number | null>(null);
  const [pkWinner, setPkWinner] = useState<string | null>(null);
  // Coupon State
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<
    "percentage" | "fixed" | "free_shipping"
  >("percentage");
  const [discountAmount, setDiscountAmount] = useState("");
  const [couponExpiry, setCouponExpiry] = useState("5"); // Default 5 minutes
  const [activeCoupon, setActiveCoupon] = useState<any>(null);
  const [couponTimeRemaining, setCouponTimeRemaining] = useState(0);
  const couponTimerRef = useRef<any>(null);
  const [showPKResult, setShowPKResult] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [inviter, setInviter] = useState<{
    id: string;
    name: string;
    channelId: string;
  } | null>(null);
  const [inviteStatus, setInviteStatus] = useState<
    "received" | "sent" | "none"
  >("none");

  // Promo Video States
  const [promoUrl, setPromoUrl] = useState<string | null>(null);
  const [isUploadingPromo, setIsUploadingPromo] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(true);

  // ✅ Sync PK state periodically for late joiners
  // ✅ Keep refs in sync for signaling listeners
  const totalLikesRef = useRef(0);
  const pkStartLikesRef = useRef(0); // Baseline for PK Score
  const lastGiftTimestampRef = useRef(0); // Track last processed gift to avoid duplicates
  const sessionEndedRef = useRef(false); // Track if session has been ended to prevent double-calling

  // Chat state
  const [showChat, setShowChat] = useState(false);
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  // Screenshot state
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null);

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      if (!sessionEndedRef.current && channelId) {
        console.log("🧹 Cleanup: Ending Firestore session on unmount");
        LiveSessionService.endSession(channelId).catch((e) =>
          console.error("Cleanup error:", e),
        );
      }
    };
  }, [channelId]);
  const peakViewersRef = useRef(0); // Track peak viewers for analytics
  const lastPurchaseTimeRef = useRef(0);
  const [purchaseNotification, setPurchaseNotification] = useState<{
    user: string;
    product: string;
  } | null>(null);

  // Pinned Product Timer State
  const [pinnedProduct, setPinnedProduct] = useState<any | null>(null);
  const [pinTimeRemaining, setPinTimeRemaining] = useState(0);
  const [pinEndTime, setPinEndTime] = useState<number | null>(null);
  const [pinDuration, setPinDuration] = useState("5"); // Default 5 minutes
  const pinTimerRef = useRef<any>(null);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [giftCategory, setGiftCategory] = useState<
    "POPULAIRE" | "SPÉCIAL" | "LUXE"
  >("POPULAIRE");
  const [userBalance, setUserBalance] = useState(0);
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  // Sync Ref for recentGift
  useEffect(() => {
    recentGiftRef.current = recentGift;
  }, [recentGift]);

  // Helper to check if a gift matches for combo (moved up for scope)
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

  // Unified Gift Handler to manage counters and queuing centrally
  const handleNewGift = (data: {
    senderName: string;
    senderId?: string;
    giftName: string;
    points: number;
    icon: any;
    senderAvatar?: string;
    targetName?: string;
    isHost: boolean;
    combo?: number;
  }) => {
    const {
      senderName,
      senderId,
      giftName,
      points,
      icon,
      senderAvatar,
      targetName,
      isHost,
      combo,
    } = data;
    const isBig = points >= 500;
    const current = recentGiftRef.current;

    // 1. Check if it matches current active gift (Theater overlay or Pill)
    if (isSameGift(current, senderId || "", senderName, giftName)) {
      setRecentGift((prev) => {
        const base = prev || current;
        const updated = base
          ? { ...base, count: combo || (base.count || 0) + 1 }
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
        videoTimerRef.current = setTimeout(() => {
          setShowGiftVideo(false);
        }, 4500);
      }
      return;
    }

    // 2. Check if it matches the tail of the queue
    setGiftQueue((prev) => {
      const last = prev[prev.length - 1];
      if (isSameGift(last, senderId || "", senderName, giftName)) {
        const updatedLast = { ...last, count: combo || (last.count || 0) + 1 };
        return [...prev.slice(0, -1), updatedLast];
      }

      // 3. Otherwise add new entry to queue
      const newGiftEntry = {
        senderName,
        senderId,
        giftName,
        icon,
        count: combo || 1,
        senderAvatar,
        targetName,
        isHost,
        isBig,
      };

      return [...prev.slice(-10), newGiftEntry];
    });
  };

  // Initialize user balance with coins (summing legacy and modern sources)
  useEffect(() => {
    if (!userId) return;

    let legacyCoins = 0;
    let modernCoins = 0;

    const updateCombinedBalance = () => {
      setUserBalance(legacyCoins + modernCoins);
    };

    // 1. Subscribe to legacy user doc
    const unsubUser = onSnapshot(doc(db, "users", userId), (snap) => {
      if (snap.exists()) {
        legacyCoins = snap.data()?.wallet?.coins || 0;
        updateCombinedBalance();
      }
    });

    // 2. Subscribe to central wallet doc
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

  // Capture baseline likes when PK Starts
  useEffect(() => {
    if (isInPK) {
      pkStartLikesRef.current = totalLikes;
      console.log("🏁 PK Started. Baseline Likes:", totalLikes);
      // setHostScore(0); // ❌ Removed: Reset only on new invite
      // setGuestScore(0); // ❌ Removed: Reset only on new invite
    }
  }, [isInPK]);

  // Cross-Room Sync: Listen for Opponent Score Updates
  useEffect(() => {
    if (!opponentChannelId) return;
    console.log(
      "🔗 Listening for Opponent Score on channel:",
      opponentChannelId,
    );
    const unsubscribe = LiveSessionService.subscribeToSession(
      opponentChannelId,
      (session) => {
        if (session && session.pkScore !== undefined) {
          // Determine if 'pkScore' is strictly the opponent's score?
          // Since this is the session doc of the opponent, 'session.pkScore' IS their host score.
          setGuestScore(session.pkScore);
        }
      },
    );
    return () => unsubscribe();
  }, [opponentChannelId]);

  // Live Commerce Logic
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [pinnedProductId, setPinnedProductId] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [activePoll, setActivePoll] = useState<{
    question: string;
    options: { id: string; text: string; votes: number }[];
    endsAt: number;
  } | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (brandId) {
          const q = query(
            collection(db, "products"),
            where("brandId", "==", brandId),
          );
          const snap = await getDocs(q);
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setProducts(list);
        }
      } catch (e) {
        console.error("Error fetching live products:", e);
      }
    };
    fetchProducts();
  }, [brandId]);

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const handleUpdateBag = async () => {
    try {
      await LiveSessionService.updateFeaturedProducts(
        channelId,
        selectedProductIds,
      );
      Alert.alert("Success", "Shopping bag updated!");
      setShowProductModal(false);
    } catch (error) {
      console.error("Error updating featured products:", error);
      Alert.alert(
        t("error") || "Error",
        t("failedToUpdateBag") ||
          "Failed to update shopping bag. Please try again.",
      );
    }
  };

  const handlePinProduct = async (id: string) => {
    const duration = parseInt(pinDuration);

    // First, ensure session exists before pinning product
    const sessionCheck = await LiveSessionService.getSession(channelId);
    if (!sessionCheck) {
      Alert.alert(
        t("error") || "Error",
        "Live session not found. Please start the live stream first.",
      );
      return;
    }

    try {
      // Update local state first
      setPinnedProductId(id);
      setPinEndTime(duration ? Date.now() + duration * 60 * 1000 : null);

      // Pin product in Firestore - this syncs to audience
      await LiveSessionService.pinProduct(channelId, id, duration);

      // Notify viewers via Stream Custom Event for low-latency update
      if (call) {
        await call
          .sendCustomEvent({
            type: "product:pin",
            productId: id,
            duration: duration || 0,
          })
          .catch((err: any) => console.log("Stream Event Error:", err));
      }

      // Also ensure it's in the bag if pinned
      if (!selectedProductIds.includes(id)) {
        const newIds = [...selectedProductIds, id];
        setSelectedProductIds(newIds);
        await LiveSessionService.updateFeaturedProducts(channelId, newIds);
      }

      // Fetch full product object for local UI immediately
      const prod = products.find((p) => p.id === id);
      if (prod) {
        setPinnedProduct(prod);
      } else {
        // If product not in local state, fetch from Firestore
        const productSnap = await getDoc(doc(db, "products", id));
        if (productSnap.exists()) {
          setPinnedProduct({ id: productSnap.id, ...productSnap.data() });
        }
      }

      Alert.alert(
        t("pinned") || "Pinned",
        t("productPinned") || "Product is now featured directly on screen!",
      );
    } catch (error) {
      console.error("Error pinning product:", error);
      // Reset local state on error
      setPinnedProductId(null);
      setPinnedProduct(null);
      setPinEndTime(null);
      Alert.alert(
        t("error") || "Error",
        t("failedToPin") || "Failed to pin product. Please try again.",
      );
    }
  };

  // Pin Timer Countdown for Host
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
        // Timer ended - unpin product automatically
        handleUnpin();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pinEndTime]);

  const handleUnpin = async () => {
    try {
      setPinnedProductId(null);
      setPinnedProduct(null);
      setPinEndTime(null);
      await LiveSessionService.unpinProduct(channelId);

      // Notify viewers via Stream Custom Event
      if (call) {
        await call
          .sendCustomEvent({
            type: "product:unpin",
          })
          .catch((err: any) => console.log("Stream Event Error:", err));
      }
      console.log("✅ Product unpinned successfully");
    } catch (error) {
      console.error("Error unpinning product:", error);
      Alert.alert(
        t("error") || "Error",
        t("failedToUnpin") || "Failed to unpin product. Please try again.",
      );
    }
  };

  // ✅ Reliable Sync: Listen to my OWN session for Total Likes (written by Audience via Firestore)
  useEffect(() => {
    if (!channelId) return;
    const unsubscribe = LiveSessionService.subscribeToSession(
      channelId,
      (session) => {
        if (session) {
          // ✅ Sync local state if already live (re-entry)
          if (session.status === "live") {
            setIsLiveStarted(true);
          }

          if (session.totalLikes !== undefined) {
            setTotalLikes(session.totalLikes);
          }

          // Sync PK State for Host too (to hear about opponent points)
          if (session.pkState) {
            // Only update isInPK if it's actually changing to avoid re-triggering effects
            if (session.pkState.isActive !== isInPKRef.current) {
              setIsInPK(session.pkState.isActive);
            }

            // ALWAYS update guestScore from Firestore (opponent's score)
            if (session.pkState.guestScore !== undefined) {
              setGuestScore(session.pkState.guestScore);
            }

            // For hostScore, trust Firestore as the source of truth
            // This ensures consistency across all screens
            if (session.pkState.hostScore !== undefined) {
              console.log(
                "🔄 Syncing hostScore from Firestore:",
                session.pkState.hostScore,
                "Current:",
                hostScoreRef.current,
              );
              setHostScore(session.pkState.hostScore);
            }

            if (session.pkState.hostName) {
              // For host, we don't usually need to sync our own name, but we can update if needed
            }
            if (session.pkState.opponentName)
              setOpponentName(session.pkState.opponentName);
            if (session.pkState.endTime && !pkEndTime) {
              setPkEndTime(session.pkState.endTime);
            }
            if (session.pkState.opponentChannelId && !opponentChannelId) {
              setOpponentChannelId(session.pkState.opponentChannelId);
            }

            // Sync Winner if battle ended on another device/room
            if (session.pkState.winner && !session.pkState.isActive) {
              if (!showPKResult && session.pkState.winner !== pkWinner) {
                setPkWinner(session.pkState.winner);
                setShowPKResult(true);
                setTimeout(() => {
                  setShowPKResult(false);
                  setPkWinner(null);
                }, 5000);
              }
            }
            // Hide result if a new PK starts
            if (session.pkState.isActive && showPKResult) {
              setShowPKResult(false);
              setPkWinner(null);
            }
          }

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

          // Sync Pinned Product
          if (session.pinnedProduct) {
            setPinnedProductId(session.pinnedProduct.productId);
            setPinEndTime(session.pinnedProduct.endTime || null);

            if (
              !pinnedProduct ||
              pinnedProduct.id !== session.pinnedProduct.productId
            ) {
              getDoc(doc(db, "products", session.pinnedProduct.productId)).then(
                (snap: any) => {
                  if (snap.exists())
                    setPinnedProduct({ id: snap.id, ...snap.data() });
                },
              );
            }
          } else {
            setPinnedProductId(null);
            setPinnedProduct(null);
            setPinEndTime(null);
          }

          if (
            session.lastGift &&
            session.lastGift.timestamp > lastGiftTimestampRef.current
          ) {
            lastGiftTimestampRef.current = session.lastGift.timestamp;

            // Only process if it's NOT from the host
            const isOwnGift =
              session.lastGift.senderId === userId ||
              session.lastGift.senderName === userName;
            if (!isOwnGift) {
              handleNewGift({
                senderName: session.lastGift!.senderName,
                senderId: session.lastGift!.senderId,
                giftName: session.lastGift!.giftName,
                points: session.lastGift!.points || 0,
                icon: session.lastGift!.icon,
                senderAvatar: session.lastGift!.senderAvatar,
                targetName: session.lastGift!.targetName,
                isHost: false,
                combo: session.lastGift!.combo, // ✅ Pass Combo
              });
            }
          }

          // ✅ Track Peak Viewers
          if (session.viewCount && session.viewCount > peakViewersRef.current) {
            peakViewersRef.current = session.viewCount;
            LiveSessionService.updatePeakViewers(
              channelId,
              session.viewCount,
            ).catch((e) => console.error("Peak Viewers Update Error:", e));
          }
        }
      },
    );
    return () => unsubscribe();
  }, [channelId]);

  useEffect(() => {
    isInPKRef.current = isInPK;
  }, [isInPK]);
  useEffect(() => {
    opponentNameRef.current = opponentName;
  }, [opponentName]);
  useEffect(() => {
    opponentChannelIdRef.current = opponentChannelId;
  }, [opponentChannelId]);
  useEffect(() => {
    hostScoreRef.current = hostScore;
  }, [hostScore]);
  useEffect(() => {
    guestScoreRef.current = guestScore;
  }, [guestScore]);
  useEffect(() => {
    totalLikesRef.current = totalLikes;
  }, [totalLikes]);

  // ✅ Safe Stream command helper: replaces legacy Zego signaling
  const sendStreamCustomEvent = async (
    payload: any,
    targets: string[] = [],
  ) => {
    if (!call || !isLiveStarted) return;
    try {
      // Use Stream custom events for low-latency synchronization
      await call.sendCustomEvent(payload).catch((err: any) => {
        console.log("Stream custom event error:", err);
      });
    } catch (e) {
      console.error("Error sending custom event:", e);
    }
  };

  // Chat toggle
  const handleToggleChat = () => {
    setShowChat(true);
  };

  // Screenshot handler
  const handleTakeScreenshot = async () => {
    if (!call || !takeScreenshot) return;
    try {
      const localParticipant = call.state.localParticipant;
      const base64 = await takeScreenshot(localParticipant, "videoTrack");
      setLastScreenshot(base64);
      Alert.alert("Screenshot", "Screenshot taken!");
    } catch (error) {
      console.error("Screenshot error:", error);
      Alert.alert("Error", "Failed to take screenshot");
    }
  };

  // Recording toggle
  const toggleRecording = async () => {
    if (!call) return;
    try {
      if (isRecording) {
        await call.stopRecording();
      } else {
        await call.startRecording();
      }
    } catch (error) {
      console.error("Recording error:", error);
    }
  };

  // Listen for recording events to update state
  useEffect(() => {
    if (!call) return;
    const onRecordingStarted = () => setIsRecording(true);
    const onRecordingStopped = () => setIsRecording(false);
    call.on("call.recording_started", onRecordingStarted);
    call.on("call.recording_stopped", onRecordingStopped);
    return () => {
      call.off("call.recording_started", onRecordingStarted);
      call.off("call.recording_stopped", onRecordingStopped);
    };
  }, [call]);

  // Periodically broadcast state to keep audience in sync (Stream)
  useEffect(() => {
    if (!call || !isLiveStarted) return;
    const interval = setInterval(() => {
      sendStreamCustomEvent({
        type: "PK_SCORE_SYNC",
        hostScore: hostScoreRef.current,
        guestScore: guestScoreRef.current,
        totalLikes: totalLikesRef.current,
        hostId: userId,
        hostName: resolvedName,
        opponentName: opponentName,
        isInPK: isInPKRef.current,
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [userId, userName, opponentName, isLiveStarted]);

  // ✅ Persist PK State to Firestore for Audience Sync (WITHOUT scores - those use atomic increments)
  useEffect(() => {
    if (channelId) {
      const pkState: any = {
        isActive: isInPK,
        // ❌ DO NOT update scores here - they use atomic increments
        opponentName: opponentName,
        hostName: resolvedName,
      };

      // Only include opponentChannelId if it exists (Firestore doesn't accept undefined)
      if (opponentChannelId) {
        pkState.opponentChannelId = opponentChannelId;
      }

      // Include timer information if PK is active
      if (isInPK && pkEndTime) {
        pkState.duration = pkDuration;
        pkState.endTime = pkEndTime;
        pkState.startTime = pkEndTime - pkDuration * 1000;
      }

      // Explicitly handle winner field
      pkState.winner = isInPK ? null : pkWinner || null;

      // If we have no winner and no active PK, wipe most metadata to prevent stale state syncs
      if (!isInPK && !pkWinner) {
        pkState.endTime = null;
        pkState.duration = null;
      }

      console.log("📦 Updating Firestore PK State (metadata only):", {
        channelId,
        isInPK,
        opponentChannelId,
      });
      LiveSessionService.updatePKState(channelId, pkState).catch((e) =>
        console.error("PK State Sync Error:", e),
      );

      // ✅ Also update opponent's session if available (Cross-Room Sync)
      if (opponentChannelId) {
        const opponentPkState = {
          ...pkState,
          // Swap names for opponent's view
          opponentName: userName,
          hostName: opponentName,
          opponentChannelId: channelId,
        };
        LiveSessionService.updatePKState(
          opponentChannelId,
          opponentPkState,
        ).catch((e) => console.error("Opponent PK State Sync Error:", e));
      }
    }
  }, [
    isInPK,
    opponentName,
    opponentChannelId,
    channelId,
    pkDuration,
    pkEndTime,
    pkWinner,
    userName,
  ]);

  // Force Sync on PK Start
  useEffect(() => {
    if (isInPK && isLiveStarted) {
      console.log("⚡ Force Syncing PK State Start");
      sendStreamCustomEvent({
        type: "PK_SCORE_SYNC",
        hostScore: hostScoreRef.current,
        guestScore: guestScoreRef.current,
        totalLikes: totalLikesRef.current,
        hostId: userId,
        hostName: resolvedName,
        opponentName: opponentName,
        isInPK: true,
      });
    }
  }, [isInPK, isLiveStarted]);

  // PK Timer Countdown
  useEffect(() => {
    if (!isInPK || !pkEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((pkEndTime - now) / 1000));
      setPkTimeRemaining(remaining);

      // Timer expired - determine winner
      if (remaining === 0) {
        const winner =
          hostScore > guestScore
            ? userName
            : guestScore > hostScore
              ? opponentName
              : "Draw";

        console.log("⏰ PK Battle Ended! Winner:", winner);
        setPkWinner(winner);
        setShowPKResult(true);
        setIsInPK(false);

        // Broadcast winner to all participants
        if (channelId) {
          const finalPkState: any = {
            isActive: false,
            hostScore: hostScore,
            guestScore: guestScore,
            opponentName: opponentName,
            hostName: resolvedName,
            winner: winner,
          };

          if (opponentChannelId) {
            finalPkState.opponentChannelId = opponentChannelId;
          }

          LiveSessionService.updatePKState(channelId, finalPkState).catch((e) =>
            console.error("Winner Broadcast Error:", e),
          );

          // Track Win/Loss for Analytics
          if (winner === userName) {
            LiveSessionService.incrementPKWin(channelId).catch((e) =>
              console.error("PK Win Count Error:", e),
            );
          } else if (winner === opponentName) {
            LiveSessionService.incrementPKLoss(channelId).catch((e) =>
              console.error("PK Loss Count Error:", e),
            );
          }
        }

        // Auto-hide result after 5 seconds
        setTimeout(() => {
          setShowPKResult(false);
          setPkWinner(null);
          setPkEndTime(null);
        }, 5000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isInPK,
    pkEndTime,
    hostScore,
    guestScore,
    userName,
    opponentName,
    channelId,
    opponentChannelId,
  ]);

  // ✅ Sync PK state periodically for late joiners

  const gifts = GIFTS;

  const updatePKScore = async (giftName: string) => {
    if (!isInPKRef.current) return;
    const gift = gifts.find((g) => g.name === giftName);
    if (gift && gift.points) {
      const pointsToAdd = gift.points;
      console.log(
        `📈 PK Score Update (Gift): adding ${pointsToAdd} points for ${giftName}`,
      );

      // ✅ Increment in Firestore atomically (like totalLikes)
      // This handles both local and cross-room sync automatically
      await LiveSessionService.incrementPKHostScore(
        channelId,
        pointsToAdd,
        opponentChannelId || undefined,
      ).catch((e) => console.error("PK Host Score Increment Error:", e));

      // Broadcast for immediate feedback (optional, Firestore sync will handle it)
      sendStreamCustomEvent({
        type: "PK_VOTE",
        points: pointsToAdd,
        hostId: userId,
      });
    }
  };

  // ✅ Sync PK scores every 3 seconds to ensure real-time accuracy
  useEffect(() => {
    if (!isInPK || !call || !isLiveStarted) return;

    const syncInterval = setInterval(() => {
      sendStreamCustomEvent({
        type: "PK_SCORE_SYNC",
        hostScore: hostScoreRef.current,
        guestScore: guestScoreRef.current,
        totalLikes: totalLikesRef.current,
        hostId: userId,
        hostName: resolvedName,
        opponentName: opponentName,
        isInPK: true,
      });
    }, 3000);

    return () => clearInterval(syncInterval);
  }, [isInPK, userName, opponentName, isLiveStarted]);

  const openGiftModal = () => {
    if (call) {
      // Get all participants, excluding the host themselves
      const all = call.state.participants
        .filter((p: any) => p.userId !== userId)
        .map((p: any) => ({
          userID: p.userId,
          userName: p.name || p.userId,
        }));
      setRoomUsers(all);
      // Default to first user if available
      if (all.length > 0) setSelectedTargetUser(all[0]);
    }
    setShowGifts(true);
  };

  // 🎫 Coupon Logic
  // 🎫 Coupon Logic
  const dropCoupon = async () => {
    // Validate coupon code
    if (!couponCode || !couponCode.trim()) {
      Alert.alert(
        t("error") || "Error",
        t("enterCouponCode") || "Please enter a coupon code",
      );
      return;
    }

    // Validate discount amount based on type
    if (couponType === "percentage") {
      const percentage = parseFloat(discountAmount);
      if (
        !discountAmount ||
        isNaN(percentage) ||
        percentage <= 0 ||
        percentage > 100
      ) {
        Alert.alert(
          t("error") || "Error",
          t("percentageError") ||
            "Please enter a valid percentage between 1-100",
        );
        return;
      }
    } else if (couponType === "fixed") {
      const fixedAmount = parseFloat(discountAmount);
      if (!discountAmount || isNaN(fixedAmount) || fixedAmount <= 0) {
        Alert.alert(
          t("error") || "Error",
          t("fixedAmountError") || "Please enter a valid discount amount",
        );
        return;
      }
    } else if (couponType === "free_shipping") {
      // Free shipping doesn't need discount amount - it's automatically 0
      // No validation needed
    }

    // Validate expiry
    const expiryMins = parseInt(couponExpiry);
    if (
      !couponExpiry ||
      isNaN(expiryMins) ||
      expiryMins <= 0 ||
      expiryMins > 1440
    ) {
      Alert.alert(
        t("error") || "Error",
        t("expiryError") || "Please enter a valid expiry time (1-1440 minutes)",
      );
      return;
    }

    try {
      const numericValue =
        couponType === "free_shipping" ? 0 : parseFloat(discountAmount);
      const discountLabel =
        couponType === "percentage"
          ? `${numericValue}%`
          : couponType === "free_shipping"
            ? "FREE SHIPPING"
            : `${numericValue}TND`;
      const expirySecs = expiryMins * 60;
      const couponData = {
        type: "coupon_drop",
        code: couponCode.toUpperCase().trim(),
        discount: discountLabel,
        discountNumeric: numericValue,
        discountType: couponType,
        expiryMinutes: expiryMins,
        endTime: Date.now() + expirySecs * 1000,
        hostName: resolvedName,
      };

      // 1. Update Firestore session doc
      await LiveSessionService.activateCoupon(channelId, {
        code: couponData.code,
        discount: numericValue,
        type: couponType,
        endTime: couponData.endTime,
        expiryMinutes: couponData.expiryMinutes,
      });

      // 2. Send signaling command
      sendStreamCustomEvent(couponData);

      setActiveCoupon(couponData);
      setCouponTimeRemaining(expirySecs);
      setShowCouponModal(false);
      // Reset form
      setCouponCode("");
      setDiscountAmount("");
      setCouponExpiry("5");
      setCouponType("percentage");
      Alert.alert(
        t("success") || "Success",
        `${t("couponDropped") || "Coupon dropped!"} (${discountLabel})`,
      );
    } catch (error) {
      console.error("Error dropping coupon:", error);
      Alert.alert(
        t("error") || "Error",
        t("failedToSave") || "Failed to sync coupon",
      );
    }
  };

  // Coupon Timer Effect
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
          clearInterval(couponTimerRef.current);
          setActiveCoupon(null);
          setCouponTimeRemaining(0);
          LiveSessionService.deactivateCoupon(channelId); // Kill in Firestore
        }
      };

      updateTimer();
      couponTimerRef.current = setInterval(updateTimer, 1000);
      return () => clearInterval(couponTimerRef.current);
    } else if (!activeCoupon && couponTimeRemaining > 0) {
      // Cleanup if activeCoupon is cleared externally
      setCouponTimeRemaining(0);
    }
  }, [activeCoupon]);

  const sendGift = async (gift: any) => {
    if (!userId || !selectedTargetUser) return;

    // 1. Check Balance
    if (userBalance < gift.points) {
      Alert.alert(
        t("Insufficient Balance"),
        t("You need more coins to send this gift."),
      );
      return;
    }

    const targetName = selectedTargetUser?.userName || "the Room";
    const targetId = selectedTargetUser?.userID;
    const finalAvatar = hostAvatar || CustomBuilder.getUserAvatar(userId);

    // Calculate new combo count locally
    const current = recentGiftRef.current;
    let newCount = 1;
    if (isSameGift(current, userId, userName || "Host", gift.name)) {
      newCount = (current?.count || 0) + 1;
    }

    handleNewGift({
      senderName: userName || "Host",
      senderId: userId,
      giftName: gift.name,
      points: gift.points || 0,
      icon: gift.icon,
      ...(finalAvatar ? { senderAvatar: finalAvatar } : {}),
      targetName: targetName,
      isHost: true,
      combo: newCount,
    });

    // Optimistic update
    setUserBalance((prev) => prev - gift.points);

    // FIRESTORE UPDATES
    try {
      // A. Deduct Coins from Host
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

      // B. Add 70% of value to Recipient as Diamonds (if recipient is a user)
      if (targetId) {
        const earnings = Math.ceil(gift.points * 0.7);
        const recipientWalletId = await getOrCreateWallet(targetId, "customer");
        const recipientWalletRef = doc(db, "wallets", recipientWalletId);

        await updateDoc(recipientWalletRef, {
          diamonds: increment(earnings),
          updatedAt: serverTimestamp(),
        });

        // Record Transaction for Recipient (Earnings)
        await addDoc(
          collection(db, "wallets", recipientWalletId, "transactions"),
          {
            type: "gift_received",
            amountDiamonds: earnings,
            giftName: gift.name,
            senderName: userName || "Host",
            senderId: userId,
            timestamp: serverTimestamp(),
            status: "completed",
          },
        );
      }

      // Record Transaction for Host (Spending)
      await addDoc(collection(db, "users", userId, "transactions"), {
        type: "gift_sent",
        amountCoins: gift.points,
        giftName: gift.name,
        recipientName: targetName,
        timestamp: serverTimestamp(),
        status: "completed",
      });

      // Send via Signaling - Migrated to Stream
      await sendStreamCustomEvent({
        type: "gift",
        senderId: userId,
        ...(finalAvatar ? { senderAvatar: finalAvatar } : {}),
        userName: userName || "Host",
        giftName: gift.name,
        points: gift.points,
        icon: gift.icon,
        targetName: targetName,
        isHost: true,
        combo: newCount,
        timestamp: Date.now(),
      });

      // Sync and Score
      if (channelId) {
        LiveSessionService.incrementGifts(channelId, gift.points || 1).catch(
          (e) => console.error("Gift Score Error:", e),
        );
        LiveSessionService.broadcastGift(channelId, {
          giftName: gift.name,
          icon: gift.icon,
          points: gift.points || 1,
          senderName: userName || "Host",
          senderId: userId,
          ...(finalAvatar ? { senderAvatar: finalAvatar } : {}),
          targetName: targetName,
          combo: newCount, // ✅ Pass Combo
        }).catch((e) => console.error("Gift Broadcast Error:", e));
        updatePKScore(gift.name);
      }
    } catch (error) {
      console.error("Host Gift Error:", error);
    }
  };

  // 1. Process Gift Queue
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

  useEffect(() => {
    if (hostAvatar && userId) {
      CustomBuilder.registerAvatar(userId, hostAvatar);
    }
    if (userName && userId) {
      CustomBuilder.registerUserName(userId, userName);
    }
  }, [hostAvatar, userId, userName]);

  // AUTO-START Firestore session on mount (since we skip the start button)
  useEffect(() => {
    if (userId) {
      getOrCreateWallet(userId, "customer", userName || "User")
        .then(setWalletId)
        .catch((err) => console.error("Error getting wallet:", err));
    }

    console.log("🚀 HostLiveScreen mounted, waiting for promo selection...");
    // startFirestoreSession(); // Don't auto-start yet, wait for promo setup

    // Subscribe to live sessions for PK Challenge selection
    setLoadingSessions(true);
    const unsubscribeLive = LiveSessionService.subscribeToAllSessions(
      (sessions: any[]) => {
        // Filter: Must be 'live', and NOT the current host/channel
        const others = sessions.filter(
          (s: any) =>
            s.status === "live" &&
            s.channelId !== channelId &&
            s.hostId !== userId,
        );
        console.log("📺 Active PK Targets found:", others.length);
        setLiveSessions(others);
        setLoadingSessions(false);
      },
    );

    // ✅ CRITICAL: Cleanup when component unmounts (app closed, navigated away, etc.)
    return () => {
      console.log("🎬 HostLiveScreen unmounting - ending session");
      unsubscribeLive();
      endFirestoreSession();
    };
  }, []);

  // ✅ Handle app state changes (background, inactive, close) - Mobile only
  useEffect(() => {
    if (Platform.OS === "web") return; // Skip for web, handled separately

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      console.log("📱 AppState changed to:", nextAppState);

      // If app goes to background or becomes inactive, end the session
      if (nextAppState === "background" || nextAppState === "inactive") {
        console.log("🎬 App backgrounded/inactive - ending live session");
        endFirestoreSession();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [channelId]);

  // ✅ Handle page refresh/close for web
  useEffect(() => {
    if (Platform.OS !== "web") return; // Only for web

    const handleBeforeUnload = () => {
      console.log("🌐 Page unloading - ending live session");
      endFirestoreSession();
    };

    // @ts-ignore - window is available on web
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [channelId]);

  // ✅ Heartbeat: Update session every 10 seconds to indicate host is still active
  useEffect(() => {
    // Run immediately
    LiveSessionService.updateHeartbeat(channelId).catch(console.error);

    const heartbeatInterval = setInterval(() => {
      LiveSessionService.updateHeartbeat(channelId).catch((e) =>
        console.error("Heartbeat update error:", e),
      );
    }, 10000); // Update every 10 seconds

    return () => clearInterval(heartbeatInterval);
  }, [channelId]);

  // ✅ Robust Cleanup: Ensure session ends if component unmounts (nav back, etc)
  useEffect(() => {
    return () => {
      if (!sessionEndedRef.current) {
        console.log("🛑 HostLiveScreen Unmounting - Triggering Safety Cleanup");
        endFirestoreSession();
      }
    };
  }, [channelId]);

  // Handle session lifecycle
  const startFirestoreSession = async (finalPromoUrl?: string) => {
    try {
      const videoUrl = finalPromoUrl || promoUrl;
      if (collabId) {
        await LiveSessionService.startCollabSession(
          channelId,
          userName,
          userId,
          collabId,
          brandId,
          hostAvatar,
          videoUrl || undefined,
        );
      } else {
        await LiveSessionService.startSession(
          channelId,
          userName,
          brandId,
          hostAvatar,
          userId,
          [],
          videoUrl || undefined,
        );
      }
      setIsLiveStarted(true); // ✅ Show controls immediately
      setShowPromoModal(false);
      console.log("🎬 Firestore session started");
    } catch (error) {
      console.error("Error starting Firestore session:", error);
    }
  };

  const pickPromoVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "videos",
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        uploadVideoToSanity(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        t("error") || "Error",
        t("failedToPickVideo") || "Failed to pick video",
      );
    }
  };

  const uploadVideoToSanity = async (videoUri: string) => {
    setIsUploadingPromo(true);
    try {
      const { uploadToSanity } = require("../utils/sanity");
      const secure_url = await uploadToSanity(videoUri);
      if (secure_url) {
        setPromoUrl(secure_url);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Sanity Video Upload Error:", error);
      Alert.alert(
        t("error") || "Error",
        "Failed to upload video to Sanity. Check your connection.",
      );
    } finally {
      setIsUploadingPromo(false);
    }
  };

  // Listen for Stream Custom Events (Gifts, PK, etc.)
  useEffect(() => {
    if (!call) return;

    const unsubscribe = call.on("custom", (event: any) => {
      const data = event.custom;
      if (!data) return;

      // Handle Gifts
      if (data.type === "gift") {
        const senderId = data.senderId;
        const senderName = data.userName || "User";
        const giftNameStr = String(data.giftName || "");

        const foundGift = GIFTS.find(
          (g) => g.name.toLowerCase() === giftNameStr.toLowerCase(),
        );
        const points =
          (foundGift && foundGift.points) || Number(data.points) || 0;

        handleNewGift({
          senderName: senderName,
          senderId: senderId,
          giftName: giftNameStr,
          points: points,
          icon: foundGift ? foundGift.icon : data.icon,
          senderAvatar: data.senderAvatar,
          targetName: data.targetName,
          isHost: data.isHost === true,
          combo: data.combo || 1,
        });

        if (!data.isHost) {
          setTotalPoints((prev) => prev + points);
        }
      }

      // Handle PK Invitations
      if (data.type === "PK_INVITE") {
        setInviter({
          id: data.inviterId,
          name: data.inviterName,
          channelId: data.inviterChannelId,
        });
        setInviteStatus("received");
        setShowPKInviteModal(true);
      }

      // Handle PK Accepted
      if (data.type === "PK_ACCEPT") {
        const { opponentChanId, opponentName: oppName, endTime } = data;
        setOpponentName(oppName);
        setOpponentChannelId(opponentChanId);
        setIsInPK(true);
        setPkEndTime(endTime);
        setHostScore(0);
        setGuestScore(0);
        setPkWinner(null);
        setShowPKResult(false);
      }

      // Handle PK Votes/Scores
      if (data.type === "PK_VOTE") {
        if (data.isOpponent) {
          setGuestScore(data.score);
          guestScoreRef.current = data.score;
        } else {
          setHostScore(data.score);
          hostScoreRef.current = data.score;
        }
      }

      // Handle PK Stop
      if (data.type === "PK_BATTLE_STOP") {
        setIsInPK(false);
        setPkBattleId(null);
        if (data.winner) {
          setPkWinner(data.winner);
          setShowPKResult(true);
          setTimeout(() => {
            setShowPKResult(false);
            setPkWinner(null);
          }, 5000);
        }
        Alert.alert(
          "PK Battle",
          data.message || "The opponent has ended the battle.",
        );
      }

      // Handle Coupon Drops
      if (data.type === "coupon_drop") {
        setActiveCoupon(data);
        setCouponTimeRemaining(data.expiryMinutes * 60);
      }

      // Handle Likes (Animations)
      if (data.type === "PK_LIKE") {
        handleSendLike();
      }
    });

    return () => unsubscribe();
  }, [call, userId, channelId, resolvedName]);

  const endFirestoreSession = async () => {
    // ✅ Prevent double-calling if session already ended
    if (sessionEndedRef.current) {
      console.log("⚠️ Session already ended, skipping duplicate call");
      return;
    }

    try {
      // ✅ PK Forfeit Logic (Non-blocking)
      if (isInPKRef.current && channelId) {
        console.log("🏁 PK Active during exit. Declaring loser...");
        const winner = opponentNameRef.current || "Opponent";
        const finalPkState: any = {
          isActive: false,
          winner: winner,
          endTime: Date.now(),
        };

        LiveSessionService.updatePKState(channelId, finalPkState).catch((e) =>
          console.error("Exit PK Update Error:", e),
        );

        if (opponentChannelIdRef.current) {
          const opponentState = {
            ...finalPkState,
            hostName: opponentNameRef.current,
            opponentName: userName,
            hostScore: guestScoreRef.current,
            guestScore: hostScoreRef.current,
          };
          LiveSessionService.updatePKState(
            opponentChannelIdRef.current,
            opponentState,
          ).catch((e) => console.error("Exit Opponent PK Update Error:", e));
        }
      }

      console.log("🎬 Ending Live Session for channel:", channelId);

      // 1. Mark as ended in state immediately for UI responsiveness
      setIsLiveStarted(false);
      sessionEndedRef.current = true;

      // 2. Update Firestore so audience knows it's over (background-ish)
      LiveSessionService.endSession(channelId).catch((e) =>
        console.error("❌ Firestore end session error:", e),
      );

      // 3. Leave the Stream call with a timeout to prevent hanging
      if (call) {
        try {
          // Give it a short time to leave properly, but don't hang the UI
          await Promise.race([
            call.leave(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Stream leave timeout")), 2000),
            ),
          ]);
          console.log("🎬 Stream call left successfully");
        } catch (e) {
          console.warn("⚠️ Stream call leave timed out or failed:", e);
        }
      }

      // 4. Close the screen immediately after attempting cleanup
      console.log("🎬 Calling onClose to return to Home");
      onClose();
    } catch (error) {
      console.error("❌ Critical error in endFirestoreSession:", error);
      // Fallback: ALWAYS close the screen
      onClose();
    }
  };

  // Gift Animation Logic (Image/WebP Overlay)
  async function showGiftAnimation(videoUrl?: string) {
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
  }

  function handleSendLike() {
    const x = Math.floor(Math.random() * 40) - 20; // Random offset for hearts
    const id = Date.now();
    setFloatingHearts((prev) => [...prev.slice(-20), { id, x }]); // Max 20 hearts

    // Increment total likes
    setTotalLikes((prev) => prev + 1);

    // ✅ Update Firestore (Persist for Feed etc)
    LiveSessionService.incrementLikes(channelId, 1).catch((e) =>
      console.error("Host Like Error:", e),
    );

    // If in PK battle, update score and broadcast
    if (isInPKRef.current) {
      console.log(`💖 PK Like: +1 point`);

      // ✅ Increment in Firestore atomically (like totalLikes)
      // This handles both local and cross-room sync automatically
      LiveSessionService.incrementPKHostScore(
        channelId,
        1,
        opponentChannelId || undefined,
      ).catch((e) => console.error("PK Host Score Increment Error:", e));

      // Broadcast like to other participants (optional, for immediate feedback)
      if (isLiveStarted && call) {
        call
          .sendCustomEvent({
            type: "PK_LIKE",
            count: 1,
            hostId: userId,
          })
          .catch((e: any) => console.error("PK Like Broadcast Error:", e));
      }
    }

    // Remove heart after animation
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2500);
  }

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
        <Sparkles size={36} color="#FF0066" fill="#FF0066" />
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
            {streamInitError ? "Connection Error" : "Stream Service Loading..."}
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
              "The stream service is taking longer than usual to initialize."}
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

  // Duration tracking
  const [durationSeconds, setDurationSeconds] = useState(0);
  useEffect(() => {
    if (!isLiveStarted) return;
    const interval = setInterval(() => setDurationSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isLiveStarted]);
  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0)
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      {call ? (
        <View style={StyleSheet.absoluteFill}>
          <StreamCall call={call}>
            <BackgroundFiltersProvider>
              <HostStreamContent
                hostAvatar={props.hostAvatar}
                brandName={brandName}
                resolvedName={resolvedName}
                userName={userName}
                t={t}
                endFirestoreSession={endFirestoreSession}
                floatingHearts={floatingHearts}
                totalLikes={totalLikes}
                isInPK={isInPK}
                handleSendLike={handleSendLike}
                pinnedProduct={pinnedProduct}
                handleUnpin={handleUnpin}
                getLocalizedName={getLocalizedName}
                selectedProductIds={selectedProductIds}
                products={products}
                pinnedProductId={pinnedProductId}
                setPinnedProductId={setPinnedProductId}
                setPinnedProduct={setPinnedProduct}
                setPinEndTime={setPinEndTime}
                showProductModal={showProductModal}
                setShowProductModal={setShowProductModal}
                showPollModal={showPollModal}
                setShowPollModal={setShowPollModal}
                showPKInviteModal={showPKInviteModal}
                setShowPKInviteModal={setShowPKInviteModal}
                activePoll={activePoll}
                setActivePoll={setActivePoll}
                durationSeconds={durationSeconds}
                formatDuration={formatDuration}
              />
            </BackgroundFiltersProvider>
          </StreamCall>
        </View>
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "#000",
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <ActivityIndicator size="large" color="#10B981" />
          <Text
            style={{
              color: "#fff",
              marginTop: 16,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Starting Live Stream...
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.5)",
              marginTop: 8,
              fontSize: 12,
            }}
          >
            Preparing camera and connection
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              marginTop: 30,
              paddingVertical: 10,
              paddingHorizontal: 24,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Exit Button (Always visible) */}
      <TouchableOpacity
        onPress={() => {
          Alert.alert(
            t("endLiveTitle") || "End Live",
            t("endLiveConfirm") ||
              "Are you sure you want to end the live session?",
            [
              { text: t("cancel") || "Cancel", style: "cancel" },
              {
                text: t("end") || "End Live",
                style: "destructive",
                onPress: endFirestoreSession,
              },
            ],
          );
        }}
        style={{
          position: "absolute",
          top: 50,
          right: 20,
          zIndex: 9999,
          backgroundColor: "rgba(0,0,0,0.5)",
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.2)",
        }}
      >
        <X size={24} color="#fff" />
      </TouchableOpacity>

      {/* Flame Counter */}
      {/* Flame Counter - ONLY if reach 50 */}
      {totalLikes >= 50 && (
        <FlameCounter
          count={totalLikes}
          onPress={handleSendLike}
          top={isInPK ? 210 : 120}
        />
      )}

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
                borderRadius: 18, // Added for iOS rounding
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
                  <ChessKingIcon size={10} color="#FFD700" fill="#FFD700" />
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
                borderRadius: 18, // Added for iOS rounding
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
                {userName?.toUpperCase() ||
                  (t("hostLabel") || "YOU").toUpperCase()}
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

      {showPKResult && pkWinner && (
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
                      {userName?.toUpperCase() ||
                        (t("hostLabel") || "YOU").toUpperCase()}
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
                      {opponentName?.toUpperCase() ||
                        (t("opponentLabel") || "OPPONENT").toUpperCase()}
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

      {!isLiveStarted && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <TouchableOpacity
            onPress={async () => {
              console.log("🎬 Host Pressed Start!");
              await startFirestoreSession();
              setIsLiveStarted(true);
            }}
            activeOpacity={0.8}
            style={{
              width: 220,
              height: 50,
              borderRadius: 25,
              overflow: "hidden",
              shadowColor: "#EF4444",
              shadowOpacity: 0.5,
              shadowRadius: 15,
              shadowOffset: { width: 0, height: 6 },
              elevation: 12,
            }}
          >
            <LinearGradient
              colors={["#EF4444", "#B91C1C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 20,
                gap: 10,
              }}
            >
              <Radio size={18} color="#FFF" />
              <Text
                style={{
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  textAlign: "center",
                }}
              >
                {t ? t("startLive") : "START LIVE"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* ALPHA VIDEO OVERLAY */}
      {/* GIFT ANIMATIONS (Full Screen Overlay) */}
      {showGiftVideo && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9000,
          }}
        >
          <View style={{ alignItems: "center" }}>
            {(() => {
              const gift = GIFTS.find((g) => g.name === recentGift?.giftName);
              // Reliability: Use isBig from state if available, fallback to point check
              const isBig = recentGift?.isBig || (gift?.points || 0) >= 500;
              const source = gift?.url
                ? { uri: gift.url }
                : gift?.icon
                  ? typeof gift.icon === "number"
                    ? gift.icon
                    : { uri: gift.icon }
                  : null;

              if (source) {
                if (isBig) {
                  return (
                    <View
                      style={{ alignItems: "center", justifyContent: "center" }}
                    >
                      {/* Spotlight effect */}
                      <Animatable.View
                        animation="fadeIn"
                        duration={500}
                        style={{
                          position: "absolute",
                          width: 600,
                          height: 600,
                          borderRadius: 300,
                          overflow: "hidden",
                        }}
                      >
                        <LinearGradient
                          colors={[
                            "transparent",
                            "rgba(60, 30, 0, 0.4)",
                            "rgba(60, 30, 0, 0.2)",
                            "rgba(251, 191, 36, 0.05)",
                            "transparent",
                          ]}
                          style={{ flex: 1 }}
                        />
                      </Animatable.View>

                      <Animatable.View
                        animation="bounceIn"
                        duration={1000}
                        style={{ alignItems: "center" }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 20,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 38,
                              fontWeight: "900",
                              textShadowColor: "rgba(0,0,0,0.9)",
                              textShadowRadius: 10,
                              textShadowOffset: { width: 0, height: 2 },
                            }}
                          >
                            {recentGift?.senderName}
                          </Text>
                          {recentGift && (
                            <Animatable.Text
                              key={`big-combo-${recentGift.count}`}
                              animation="bounceIn"
                              duration={400}
                              style={{
                                color: "#FBBF24",
                                fontSize: 58,
                                fontWeight: "900",
                                fontStyle: "italic",
                                marginLeft: 15,
                                textShadowColor: "#000",
                                textShadowOffset: { width: 4, height: 4 },
                                textShadowRadius: 2,
                              }}
                            >
                              x{recentGift.count}
                            </Animatable.Text>
                          )}
                        </View>

                        <Animatable.View
                          animation="pulse"
                          iterationCount="infinite"
                          duration={2000}
                          direction="alternate"
                        >
                          <Image
                            source={source}
                            style={{
                              width: 220,
                              height: 220,
                              maxWidth: 500,
                              maxHeight: 500,
                            }}
                            resizeMode="contain"
                          />
                        </Animatable.View>
                      </Animatable.View>
                    </View>
                  );
                }

                return (
                  <Animatable.Image
                    animation="tada"
                    duration={1000}
                    source={source}
                    style={{
                      width: 220,
                      height: 220,
                    }}
                    resizeMode="contain"
                  />
                );
              }
              return null;
            })()}

            {/* Sender Avatar + Combo Count - Always show below gift for big gifts */}
          </View>
        </View>
      )}

      {/* Purchase Notification Banner */}
      {purchaseNotification && (
        <Animatable.View
          animation="slideInDown"
          duration={500}
          style={{
            position: "absolute",
            top: 130,
            alignSelf: "center",
            zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.8)",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 20,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#F59E0B",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 14 }}>
            🎉{" "}
            <Text style={{ fontWeight: "bold", color: "#F59E0B" }}>
              {purchaseNotification.user}
            </Text>{" "}
            bought{" "}
            <Text style={{ fontWeight: "bold" }}>
              {purchaseNotification.product}
            </Text>
          </Text>
        </Animatable.View>
      )}

      {/* TikTok Style Gift Alert Overlay - Top Left side pill */}

      {/* Host Gift Modal with TikTok Style Grid */}
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

            {/* Target Selection View (Only for Host) */}
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                paddingVertical: 10,
                paddingHorizontal: 15,
                borderBottomWidth: 1,
                borderBottomColor: "#222",
              }}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {roomUsers.map((u: any) => (
                  <TouchableOpacity
                    key={u.userID}
                    onPress={() => setSelectedTargetUser(u)}
                    style={{
                      marginRight: 15,
                      alignItems: "center",
                      opacity:
                        selectedTargetUser?.userID === u.userID ? 1 : 0.6,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        borderWidth: 2,
                        borderColor:
                          selectedTargetUser?.userID === u.userID
                            ? "#FF0066"
                            : "transparent",
                        overflow: "hidden",
                      }}
                    >
                      <MemberAvatar
                        userId={u.userID}
                        userName={u.userName}
                        defaultAvatar={u.avatarUrl}
                      />
                    </View>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 9,
                        marginTop: 4,
                        fontWeight: "600",
                      }}
                      numberOfLines={1}
                    >
                      {u.userName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Gift Grid */}
            <FlatList
              key={giftCategory}
              numColumns={4}
              data={gifts.filter((g) => {
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
                      setTimeout(() => setShowRechargeModal(true), 500);
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

      {/* PINNED PRODUCT CARD OVERLAY (Matches Audience UI) */}
      {pinnedProduct && (
        <Animatable.View
          animation="fadeInLeft"
          duration={400}
          style={{
            position: "absolute",
            bottom: activeCoupon ? 385 : 290,
            left: 15,
            width: 280,
            zIndex: 3000,
          }}
        >
          <BlurView
            intensity={90}
            tint="dark"
            style={{
              borderRadius: 22,
              padding: 10,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.25)",
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 15,
              elevation: 10,
            }}
          >
            <Image
              source={{ uri: pinnedProduct.images?.[0] }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 14,
                backgroundColor: "#333",
              }}
            />
            <View style={{ flex: 1, marginLeft: 12, marginRight: 4 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 2,
                }}
              >
                <LinearGradient
                  colors={["#EF4444", "#B91C1C"]}
                  style={{
                    paddingHorizontal: 7,
                    paddingVertical: 2.5,
                    borderRadius: 5,
                    marginRight: 6,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: "900",
                      letterSpacing: 0.5,
                    }}
                  >
                    {(pinnedProduct.discountPrice
                      ? t("flashSale")
                      : t("pinned")) ||
                      (pinnedProduct.discountPrice ? "FLASH SALE" : "PINNED")}
                  </Text>
                </LinearGradient>
              </View>
              <Text
                numberOfLines={1}
                style={{
                  color: "#fff",
                  fontWeight: "800",
                  fontSize: 13.5,
                  marginBottom: 1,
                }}
              >
                {getLocalizedName(pinnedProduct.name)}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                  {pinnedProduct.discountPrice ? (
                    <>
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 10,
                          textDecorationLine: "line-through",
                          marginRight: 5,
                        }}
                      >
                        {pinnedProduct.price}
                      </Text>
                      <Text
                        style={{
                          color: "#F59E0B",
                          fontWeight: "900",
                          fontSize: 14,
                        }}
                      >
                        {pinnedProduct.discountPrice}{" "}
                        <Text style={{ fontSize: 9 }}>TND</Text>
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}
                    >
                      {pinnedProduct.price}{" "}
                      <Text style={{ fontSize: 9 }}>TND</Text>
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View style={{ alignItems: "center", marginLeft: 8, minWidth: 60 }}>
              {pinTimeRemaining > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.4)",
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 5,
                  }}
                >
                  <Clock
                    size={8}
                    color="rgba(255,255,255,0.8)"
                    style={{ marginRight: 3 }}
                  />
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: 9,
                      fontWeight: "900",
                    }}
                  >
                    {Math.floor(pinTimeRemaining / 60)}:
                    {(pinTimeRemaining % 60).toString().padStart(2, "0")}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={handleUnpin}
              style={{
                position: "absolute",
                top: 5,
                right: 5,
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                width: 20,
                height: 20,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <X size={10} color="#fff" />
            </TouchableOpacity>
          </BlurView>
        </Animatable.View>
      )}

      {/* PRODUCT CAROUSEL - Show selected products */}
      {selectedProductIds.length > 0 && (
        <View
          style={{
            position: "absolute",
            bottom: 80,
            left: 0,
            right: 0,
            zIndex: 2500,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 15, gap: 12 }}
          >
            {products
              .filter((p) => selectedProductIds.includes(p.id))
              .map((p) => {
                const isPinned = pinnedProductId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      setPinnedProductId(p.id);
                      setPinnedProduct(p);
                      setPinDuration("5");
                      setPinEndTime(Date.now() + 300000);
                    }}
                    style={{
                      width: 100,
                      borderRadius: 16,
                      backgroundColor: isPinned
                        ? "rgba(16, 185, 129, 0.2)"
                        : "rgba(0,0,0,0.7)",
                      borderWidth: isPinned ? 2 : 1,
                      borderColor: isPinned
                        ? "#10B981"
                        : "rgba(255,255,255,0.1)",
                      padding: 8,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={{ uri: p.images?.[0] }}
                      style={{
                        width: 84,
                        height: 84,
                        borderRadius: 12,
                        backgroundColor: "#333",
                      }}
                    />
                    {p.discountPrice && (
                      <View
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 6,
                          backgroundColor: "#EF4444",
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 8,
                            fontWeight: "900",
                          }}
                        >
                          -{Math.round((1 - p.discountPrice / p.price) * 100)}%
                        </Text>
                      </View>
                    )}
                    <View style={{ marginTop: 6 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {getLocalizedName(p.name)}
                      </Text>
                      <Text
                        style={{
                          color: isPinned ? "#10B981" : "#F59E0B",
                          fontSize: 12,
                          fontWeight: "900",
                          marginTop: 2,
                        }}
                      >
                        {p.discountPrice || p.price} TND
                      </Text>
                    </View>
                    {isPinned && (
                      <View
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          backgroundColor: "#10B981",
                          borderRadius: 8,
                          paddingHorizontal: 5,
                          paddingVertical: 2,
                        }}
                      >
                        <Pin size={8} color="#fff" fill="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View>
      )}

      {/* FLOATING HOST CONTROLS - Moved to bottom right */}
      {/* ✅ Only show after live starts to prevent bugs */}
      {isLiveStarted && (
        <View
          style={{
            position: "absolute",
            bottom: 100,
            right: 15,
            gap: 14,
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          {/* Mic Toggle */}
          <TouchableOpacity
            onPress={() => {}}
            style={{
              width: 37,
              height: 37,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              overflow: "hidden",
            }}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            <Mic size={16} color="#fff" />
          </TouchableOpacity>

          {/* Camera Toggle */}
          <TouchableOpacity
            onPress={() => {}}
            style={{
              width: 37,
              height: 37,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              overflow: "hidden",
            }}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            <Camera size={16} color="#fff" />
          </TouchableOpacity>

          {/* Commerce Button */}
          <TouchableOpacity
            onPress={() => setShowProductModal(true)}
            style={{
              width: 37,
              height: 37,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              overflow: "hidden",
            }}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            <ShoppingBag size={16} color="#fff" />
          </TouchableOpacity>

          {/* PK Toggle Button */}
          <TouchableOpacity
            onPress={() => setShowPKInviteModal(true)}
            activeOpacity={0.8}
            style={{
              borderRadius: 20,
              overflow: "hidden",
              elevation: isInPK ? 8 : 0,
              shadowColor: isInPK ? "#FFA500" : "transparent",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isInPK ? 0.3 : 0,
              shadowRadius: 8,
            }}
          >
            {isInPK ? (
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  width: 37,
                  height: 37,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Swords size={20} color="#fff" />
              </LinearGradient>
            ) : (
              <View
                style={{
                  width: 37,
                  height: 37,
                  borderRadius: 20,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                <Swords size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Gift Button for Host */}
          <TouchableOpacity
            onPress={openGiftModal}
            style={{
              width: 37,
              height: 37,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              overflow: "hidden",
            }}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            <GiftIcon size={16} color="#fff" strokeWidth={2} />
          </TouchableOpacity>

          {/* Coupon Button */}
          <TouchableOpacity
            onPress={() => setShowCouponModal(true)}
            style={{
              width: 37,
              height: 37,
              borderRadius: 20,
              backgroundColor: activeCoupon ? "#F59E0B" : "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: activeCoupon ? "#fff" : "rgba(255,255,255,0.2)",
              overflow: "hidden",
            }}
          >
            {!activeCoupon && (
              <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            )}
            <Ticket size={16} color="#fff" />
          </TouchableOpacity>

          {/* Beauty Toggle Button */}
          {/* <TouchableOpacity
                            onPress={() => Alert.alert("Beauty", "Beauty Filters toggled!")}
                            style={{
                                width: 37,
                                height: 37,
                                borderRadius: 22,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.2)',
                                overflow: 'hidden'
                            }}
                        >
                            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                            <Sparkles size={16} color="#fff" />
                        </TouchableOpacity> */}

          {/* Share Button */}
          <TouchableOpacity
            onPress={() =>
              Share.share({ message: `Watch my live stream on Bey3a!` })
            }
            style={{
              width: 37,
              height: 37,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              overflow: "hidden",
            }}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            <Share2 size={16} color="#fff" />
          </TouchableOpacity>

          {/* Chat Button */}
          <TouchableOpacity
            onPress={() => setShowChat(true)}
            style={{
              width: 37,
              height: 37,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              overflow: "hidden",
            }}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            <MessageCircle size={16} color="#fff" />
          </TouchableOpacity>

          {/* Screenshot Button */}
          <TouchableOpacity
            onPress={handleTakeScreenshot}
            style={{
              width: 37,
              height: 37,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              overflow: "hidden",
            }}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            <Camera size={16} color="#fff" />
          </TouchableOpacity>

          {/* Recording Toggle Button */}
          <TouchableOpacity
            onPress={toggleRecording}
            style={{
              width: 37,
              height: 37,
              borderRadius: 20,
              backgroundColor: isRecording ? "#EF4444" : "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: isRecording ? "#fff" : "rgba(255,255,255,0.2)",
              overflow: "hidden",
            }}
          >
            {isRecording ? (
              <LinearGradient
                colors={["#EF4444", "#B91C1C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ ...StyleSheet.absoluteFill, borderRadius: 20 }}
              />
            ) : (
              <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            )}
            <Radio size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Live Chat Overlay */}
      <LiveChatOverlay
        visible={showChat}
        channelId={channelId}
        onClose={() => setShowChat(false)}
        currentUserId={userId}
      />

      {/* PK Invite Modal */}
      <Modal
        visible={showPKInviteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPKInviteModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <BlurView
            intensity={90}
            tint="dark"
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              height: "70%",
              padding: 25,
              overflow: "hidden",
              backgroundColor: "rgba(18, 18, 24, 0.98)",
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 25,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Swords size={20} color="#F59E0B" />
                </View>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 20,
                    fontWeight: "800",
                    letterSpacing: 0.5,
                  }}
                >
                  {t("pkBattle") || "PK Battle"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPKInviteModal(false)}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  padding: 8,
                  borderRadius: 20,
                }}
              >
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {isInPK ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingBottom: 40,
                }}
              >
                <View
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    padding: 30,
                    borderRadius: 25,
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Text
                    style={{
                      color: "#EF4444",
                      fontSize: 16,
                      fontWeight: "800",
                      marginBottom: 10,
                    }}
                  >
                    {(
                      t("battleInProgress") || "BATTLE IN PROGRESS"
                    ).toUpperCase()}
                  </Text>
                  <Text
                    style={{
                      color: "#888",
                      marginBottom: 25,
                      textAlign: "center",
                    }}
                  >
                    {t("battleInProgressDesc") ||
                      "You are currently in a PK battle. You must stop the current challenge before starting a new one."}
                  </Text>
                  <TouchableOpacity
                    onPress={async () => {
                      // Determine winner (Opponent wins if host stops manually)
                      const winner = opponentName || "Opponent";
                      setIsInPK(false);
                      setPkWinner(winner);
                      setShowPKResult(true);
                      setPkBattleId(null);

                      // Stop PK in Firestore for both rooms
                      if (channelId) {
                        const finalState = {
                          isActive: false,
                          winner: winner,
                          endTime: Date.now(),
                        };
                        LiveSessionService.updatePKState(
                          channelId,
                          finalState,
                        ).catch((e) => console.error("Stop PK Error:", e));
                        if (opponentChannelId) {
                          LiveSessionService.updatePKState(opponentChannelId, {
                            ...finalState,
                            hostName: opponentName,
                            opponentName: userName,
                            hostScore: guestScore,
                            guestScore: hostScore,
                          }).catch((e) =>
                            console.error("Stop Opponent PK Error:", e),
                          );
                        }
                      }

                      if (isLiveStarted && call) {
                        sendStreamCustomEvent({
                          type: "PK_BATTLE_STOP",
                          winner: winner,
                          message: `${userName} has ended the battle.`,
                        });
                      }
                      setShowPKInviteModal(false);

                      // Hide result after 5s
                      setTimeout(() => {
                        setShowPKResult(false);
                        setPkWinner(null);
                      }, 5000);
                    }}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: "#EF4444",
                      paddingVertical: 16,
                      width: "100%",
                      borderRadius: 14,
                      alignItems: "center",
                      shadowColor: "#EF4444",
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "900",
                        fontSize: 13,
                        letterSpacing: 1,
                      }}
                    >
                      {(t("stopBattle") || "STOP BATTLE").toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {/* Duration Selector */}
                <Text
                  style={{
                    color: "#888",
                    marginBottom: 12,
                    fontSize: 13,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                  }}
                >
                  {(
                    t("chooseBattleDuration") || "CHOOSE BATTLE DURATION:"
                  ).toUpperCase()}
                </Text>
                <View
                  style={{ flexDirection: "row", gap: 8, marginBottom: 30 }}
                >
                  {[
                    { label: "3m", value: 180 },
                    { label: "5m", value: 300 },
                    { label: "7m", value: 420 },
                    { label: "10m", value: 600 },
                    { label: "15m", value: 900 },
                    { label: "20m", value: 1200 },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setPkDuration(option.value)}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 12,
                        backgroundColor:
                          pkDuration === option.value ? "#3B82F6" : "#2A2A35",
                        borderWidth: 1.5,
                        borderColor:
                          pkDuration === option.value
                            ? "#60A5FA"
                            : "rgba(255,255,255,0.05)",
                        alignItems: "center",
                        shadowColor:
                          pkDuration === option.value
                            ? "#3B82F6"
                            : "transparent",
                        shadowOpacity: 0.2,
                        shadowRadius: 5,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            pkDuration === option.value
                              ? "#fff"
                              : "rgba(255,255,255,0.4)",
                          fontWeight: "900",
                          fontSize: 14,
                        }}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text
                  style={{
                    color: "#888",
                    marginBottom: 15,
                    fontSize: 13,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                  }}
                >
                  {(t("activeHosts") || "ACTIVE HOSTS:").toUpperCase()}
                </Text>

                {loadingSessions ? (
                  <View style={{ flex: 1, justifyContent: "center" }}>
                    <ActivityIndicator color="#3B82F6" />
                  </View>
                ) : liveSessions.filter((s) => s.channelId !== channelId)
                    .length > 0 ? (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                  >
                    {liveSessions
                      .filter((s) => s.channelId !== channelId)
                      .map((session) => (
                        <TouchableOpacity
                          key={session.channelId}
                          activeOpacity={0.9}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            padding: 14,
                            borderRadius: 18,
                            marginBottom: 12,
                            borderWidth: 1,
                            borderColor: "rgba(255, 255, 255, 0.08)",
                          }}
                          onPress={() => {
                            const targetId =
                              session.hostId || session.channelId;
                            if (targetId) {
                              const endTime = Date.now() + pkDuration * 1000;
                              sendStreamCustomEvent(
                                {
                                  type: "PK_INVITE",
                                  inviterId: userId,
                                  inviterName: userName,
                                  inviterChannelId: channelId,
                                  pkDuration: pkDuration,
                                  endTime: endTime,
                                },
                                [targetId],
                              )
                                .then(() => {
                                  setShowPKInviteModal(false);
                                  Alert.alert(
                                    t("success") || "Request Sent",
                                    `${t("challenge")} ${session.hostName}...`,
                                  );
                                })
                                .catch((err) => {
                                  console.error("PK Invite Error:", err);
                                  Alert.alert(
                                    "Error",
                                    "Failed to send challenge request.",
                                  );
                                });
                            }
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <View
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                overflow: "hidden",
                                borderWidth: 1.5,
                                borderColor: "rgba(255,255,255,0.1)",
                              }}
                            >
                              {session.hostAvatar ? (
                                <Image
                                  source={{ uri: session.hostAvatar }}
                                  style={{ width: "100%", height: "100%" }}
                                />
                              ) : (
                                <View
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    backgroundColor: "#444",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: "#fff",
                                      fontSize: 16,
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {session.hostName?.charAt(0)}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View>
                              <Text
                                style={{
                                  color: "#fff",
                                  fontWeight: "800",
                                  fontSize: 15,
                                }}
                              >
                                {session.hostName || "Host"}
                              </Text>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <View
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: "#10B981",
                                  }}
                                />
                                <Text
                                  style={{
                                    color: "rgba(255,255,255,0.4)",
                                    fontSize: 11,
                                    fontWeight: "600",
                                  }}
                                >
                                  {t("liveNow") || "Live Now"}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <LinearGradient
                            colors={["#FFD700", "#FFA500"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 10,
                              borderRadius: 12,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                              elevation: 3,
                              shadowColor: "#FFA500",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.3,
                              shadowRadius: 4,
                            }}
                          >
                            <Swords size={16} color="#FFF" />
                            <Text
                              style={{
                                color: "#FFF",
                                fontWeight: "900",
                                fontSize: 12,
                                letterSpacing: 0.5,
                              }}
                            >
                              {(t("challenge") || "CHALLENGE").toUpperCase()}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                ) : (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: 0.5,
                      paddingBottom: 50,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "rgba(255,255,255,0.1)",
                        padding: 20,
                        borderRadius: 40,
                        marginBottom: 15,
                      }}
                    >
                      <Swords size={40} color="#666" />
                    </View>
                    <Text
                      style={{ color: "#666", fontSize: 15, fontWeight: "700" }}
                    >
                      {t("noOtherHostsLive") || "No other hosts are live"}
                    </Text>
                    <Text style={{ color: "#444", fontSize: 12, marginTop: 5 }}>
                      {t("inviteJoinFirst") || "Invite someone to join first!"}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </BlurView>
        </View>
      </Modal>

      {/* Product Selection Modal */}
      <Modal
        visible={showProductModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProductModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <BlurView
            intensity={90}
            tint="dark"
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              height: "75%",
              padding: 25,
              overflow: "hidden",
              backgroundColor: "rgba(18, 18, 24, 0.98)",
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 25,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: "800",
                  letterSpacing: 0.5,
                }}
              >
                {t("liveShoppingBag") || "Live Shopping Bag"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowProductModal(false)}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  padding: 8,
                  borderRadius: 20,
                }}
              >
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#888",
                  marginBottom: 10,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {t("pinDuration") || "PIN DURATION:"}
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[
                  { label: "3m", value: "3" },
                  { label: "5m", value: "5" },
                  { label: "10m", value: "10" },
                  { label: "15m", value: "15" },
                  { label: "30m", value: "30" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setPinDuration(option.value)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor:
                        pinDuration === option.value ? "#F59E0B" : "#2A2A35",
                      borderWidth: 1,
                      borderColor:
                        pinDuration === option.value ? "#fff" : "#333",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: pinDuration === option.value ? "#000" : "#888",
                        fontWeight: "bold",
                        fontSize: 13,
                      }}
                    >
                      {option.value}
                      {t("mins")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
              {products.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                const isPinned = pinnedProductId === p.id;
                return (
                  <View
                    key={p.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isPinned
                        ? "rgba(245, 158, 11, 0.1)"
                        : "rgba(255, 255, 255, 0.05)",
                      borderRadius: 18,
                      padding: 14,
                      marginBottom: 14,
                      borderWidth: isPinned ? 2 : 1,
                      borderColor: isPinned
                        ? "#F59E0B"
                        : "rgba(255, 255, 255, 0.1)",
                      shadowColor: isPinned ? "#F59E0B" : "transparent",
                      shadowOpacity: isPinned ? 0.3 : 0,
                      shadowRadius: 8,
                      elevation: isPinned ? 4 : 0,
                    }}
                  >
                    {/* Product Image with Discount Badge */}
                    <View style={{ position: "relative" }}>
                      <Image
                        source={{ uri: p.images?.[0] }}
                        style={{
                          width: 70,
                          height: 70,
                          borderRadius: 14,
                          backgroundColor: "#333",
                        }}
                      />
                      {p.discountPrice && (
                        <View
                          style={{
                            position: "absolute",
                            top: -6,
                            left: -6,
                            backgroundColor: "#EF4444",
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 9,
                              fontWeight: "900",
                            }}
                          >
                            -{Math.round((1 - p.discountPrice / p.price) * 100)}
                            %
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: 15,
                          marginBottom: 4,
                        }}
                        numberOfLines={1}
                      >
                        {getLocalizedName(p.name)}
                      </Text>

                      {/* Price Display */}
                      {p.discountPrice ? (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.4)",
                              fontSize: 12,
                              textDecorationLine: "line-through",
                            }}
                          >
                            {p.price} TND
                          </Text>
                          <Text
                            style={{
                              color: "#F59E0B",
                              fontSize: 16,
                              fontWeight: "800",
                            }}
                          >
                            {p.discountPrice} TND
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.8)",
                            fontSize: 14,
                            fontWeight: "600",
                          }}
                        >
                          {p.price} TND
                        </Text>
                      )}
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      {/* Pin Button */}
                      <TouchableOpacity
                        onPress={() => handlePinProduct(p.id)}
                        style={{
                          backgroundColor: isPinned ? "#F59E0B" : "transparent",
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 12,
                          borderWidth: isPinned ? 0 : 1,
                          borderColor: "rgba(255, 255, 255, 0.2)",
                          minWidth: 75,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: isPinned ? "#000" : "#fff",
                            fontSize: 11,
                            fontWeight: "900",
                            letterSpacing: 0.5,
                          }}
                        >
                          {isPinned ? "📌 ÉPINGLÉ" : "📌 ÉPINGLER"}
                        </Text>
                      </TouchableOpacity>

                      {/* Selection Checkbox */}
                      <TouchableOpacity
                        onPress={() => toggleProductSelection(p.id)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          borderWidth: 2.5,
                          borderColor: isSelected
                            ? "#3B82F6"
                            : "rgba(255,255,255,0.3)",
                          backgroundColor: isSelected
                            ? "#3B82F6"
                            : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isSelected && (
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 14,
                              fontWeight: "bold",
                            }}
                          >
                            ✓
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={handleUpdateBag}
              activeOpacity={0.8}
              style={{
                position: "absolute",
                bottom: 40,
                left: 20,
                right: 20,
                backgroundColor: "#3B82F6",
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                shadowColor: "#3B82F6",
                shadowOpacity: 0.4,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "900",
                  fontSize: 16,
                  letterSpacing: 1,
                }}
              >
                {(t("updateStreamBag") || "UPDATE STREAM BAG").toUpperCase()} (
                {selectedProductIds.length})
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      {/* 🎫 LIVE COUPON OVERLAY FOR HOST - Horizontal Ticket Style */}
      {activeCoupon && (
        <Animatable.View
          animation="bounceInLeft"
          style={{
            position: "absolute",
            bottom: 290, // Positioned above comments (approx)
            left: 15,
            width: 200,
            zIndex: 3000,
          }}
        >
          {/* Blur Effect Background */}
          <BlurView
            intensity={85}
            tint="dark"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 12,
              overflow: "hidden",
            }}
          />
          <LinearGradient
            colors={["#F59E0B", "#B45309"]}
            style={{
              borderRadius: 10,
              padding: 1, // Border effect
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(18, 18, 24, 0.95)",
                borderRadius: 9,
                flexDirection: "row",
                height: 75,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Coupon Notches */}
              <View
                style={{
                  position: "absolute",
                  top: -5,
                  left: "50%",
                  marginLeft: -5,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "#000",
                  zIndex: 10,
                  borderWidth: 1,
                  borderColor: "#B45309",
                }}
              />
              <View
                style={{
                  position: "absolute",
                  bottom: -5,
                  left: "50%",
                  marginLeft: -5,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "#000",
                  zIndex: 10,
                  borderWidth: 1,
                  borderColor: "#B45309",
                }}
              />

              {/* LIVE PK STATUS BAR */}
              <View style={{ flex: 1, padding: 8, justifyContent: "center" }}>
                <Text
                  style={{
                    color: "#F59E0B",
                    fontSize: 6.5,
                    fontWeight: "900",
                    letterSpacing: 0.5,
                    marginBottom: 2,
                  }}
                >
                  {t("limitedTimeOffer").toUpperCase()}
                </Text>
                <Text
                  style={{ color: "#fff", fontSize: 13, fontWeight: "900" }}
                >
                  {(() => {
                    // Support both discountType and legacy type field
                    const couponType =
                      activeCoupon.discountType || activeCoupon.type;
                    if (couponType === "free_shipping") {
                      return "FREE SHIPPING";
                    } else if (couponType === "percentage") {
                      return `${activeCoupon.discountNumeric}% OFF`;
                    } else {
                      // Fixed amount or legacy format
                      const value =
                        activeCoupon.discountNumeric !== undefined
                          ? activeCoupon.discountNumeric
                          : activeCoupon.discount;
                      return `${value}TND OFF`;
                    }
                  })()}
                </Text>

                {couponTimeRemaining > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <Clock
                      size={8}
                      color="#EF4444"
                      style={{ marginRight: 3 }}
                    />
                    <Text
                      style={{
                        color: "#EF4444",
                        fontSize: 9,
                        fontWeight: "800",
                      }}
                    >
                      {Math.floor(couponTimeRemaining / 60)}:
                      {(couponTimeRemaining % 60).toString().padStart(2, "0")}
                    </Text>
                  </View>
                )}
              </View>

              {/* Vertical Dashed Divider */}
              <View
                style={{
                  width: 1,
                  height: "100%",
                  borderStyle: "dashed",
                  borderWidth: 1,
                  borderColor: "rgba(245, 158, 11, 0.3)",
                  left: "50%",
                  position: "absolute",
                }}
              />

              {/* Right Side: Action */}
              {/* Right Side: Action (Host View - View Only) */}
              <View
                style={{
                  flex: 1,
                  padding: 8,
                  paddingLeft: 12,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                    borderStyle: "dashed",
                    borderWidth: 1,
                    borderColor: "rgba(245, 158, 11, 0.4)",
                    width: "100%",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 8,
                      fontWeight: "700",
                      marginBottom: 2,
                    }}
                  >
                    CODE
                  </Text>
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: "900",
                      letterSpacing: 0.5,
                    }}
                  >
                    {activeCoupon.code}
                  </Text>
                </View>
              </View>

              {/* Close Button overlay */}
              <TouchableOpacity
                onPress={() => setActiveCoupon(null)}
                style={{ position: "absolute", top: 4, right: 4 }}
              >
                <X size={10} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animatable.View>
      )}

      {/* NEW COUPON CREATION MODAL */}
      <Modal
        visible={showCouponModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCouponModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowCouponModal(false)}
          />

          <Animatable.View
            animation="zoomIn"
            duration={300}
            style={{
              backgroundColor: "#1A1A24",
              width: Dimensions.get("window").width * 0.9,
              maxWidth: 400,
              borderRadius: 30,
              padding: 24,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 15,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: "900",
                  letterSpacing: 0.5,
                }}
              >
                {t("createCoupon")}
              </Text>
              <TouchableOpacity onPress={() => setShowCouponModal(false)}>
                <X size={24} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 16 }}>
              <View>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 12,
                    marginBottom: 8,
                    fontWeight: "700",
                  }}
                >
                  {t("couponCode").toUpperCase()}
                </Text>
                <TextInput
                  placeholder="e.g. LIVE30"
                  placeholderTextColor="#555"
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                  style={{
                    backgroundColor: "#0F0F16",
                    borderRadius: 12,
                    padding: 14,
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "bold",
                    borderWidth: 1,
                    borderColor: "#333",
                  }}
                />
              </View>

              {/* Discount Type Selector */}
              <View>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 12,
                    marginBottom: 8,
                    fontWeight: "700",
                  }}
                >
                  {"TYPE DE RÉDUCTION"}
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setCouponType("percentage")}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      borderRadius: 10,
                      backgroundColor:
                        couponType === "percentage" ? "#F59E0B" : "#0F0F16",
                      borderWidth: 1,
                      borderColor:
                        couponType === "percentage" ? "#F59E0B" : "#333",
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    {couponType === "percentage" && (
                      <Text style={{ color: "#000", fontSize: 10 }}>✓</Text>
                    )}
                    <Text
                      style={{
                        color: couponType === "percentage" ? "#000" : "#fff",
                        fontWeight: "700",
                        fontSize: 11,
                      }}
                    >
                      Pourcentage
                    </Text>
                    <Text
                      style={{
                        color: couponType === "percentage" ? "#000" : "#fff",
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      %
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setCouponType("fixed")}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      borderRadius: 10,
                      backgroundColor:
                        couponType === "fixed" ? "#F59E0B" : "#0F0F16",
                      borderWidth: 1,
                      borderColor: couponType === "fixed" ? "#F59E0B" : "#333",
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    {couponType === "fixed" && (
                      <Text style={{ color: "#000", fontSize: 10 }}>✓</Text>
                    )}
                    <Text
                      style={{
                        color: couponType === "fixed" ? "#000" : "#fff",
                        fontWeight: "700",
                        fontSize: 11,
                      }}
                    >
                      Montant
                    </Text>
                    <Text
                      style={{
                        color: couponType === "fixed" ? "#000" : "#fff",
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      TND
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* Free Shipping Toggle */}
                <TouchableOpacity
                  onPress={() => {
                    setCouponType("free_shipping");
                    setDiscountAmount("");
                  }}
                  style={{
                    marginTop: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    backgroundColor:
                      couponType === "free_shipping"
                        ? "rgba(245, 158, 11, 0.2)"
                        : "#0F0F16",
                    borderWidth: 1,
                    borderColor:
                      couponType === "free_shipping" ? "#F59E0B" : "#333",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor:
                          couponType === "free_shipping" ? "#F59E0B" : "#555",
                        backgroundColor:
                          couponType === "free_shipping"
                            ? "#F59E0B"
                            : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {couponType === "free_shipping" && (
                        <Text
                          style={{
                            color: "#000",
                            fontSize: 12,
                            fontWeight: "900",
                          }}
                        >
                          ✓
                        </Text>
                      )}
                    </View>
                    <Text
                      style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}
                    >
                      Livraison gratuite
                    </Text>
                  </View>
                  <Text
                    style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}
                  >
                    🚚
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Discount Amount */}
              {couponType !== "free_shipping" && (
                <View>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 12,
                      marginBottom: 8,
                      fontWeight: "700",
                    }}
                  >
                    {"MONTANT DU RÉDUCTION"}
                  </Text>
                  <View style={{ position: "relative" }}>
                    <TextInput
                      placeholder={couponType === "percentage" ? "30" : "10"}
                      placeholderTextColor="#555"
                      value={discountAmount}
                      onChangeText={setDiscountAmount}
                      keyboardType="numeric"
                      style={{
                        backgroundColor: "#0F0F16",
                        borderRadius: 12,
                        padding: 14,
                        paddingRight: 50,
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: "bold",
                        borderWidth: 1,
                        borderColor: "#333",
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        right: 14,
                        top: 0,
                        bottom: 0,
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 14,
                          fontWeight: "700",
                        }}
                      >
                        {couponType === "percentage" ? "%" : "TND"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Expiry */}
              <View>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 12,
                    marginBottom: 8,
                    fontWeight: "700",
                  }}
                >
                  {"DURATION"}
                </Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    keyboardType="numeric"
                    value={couponExpiry}
                    onChangeText={setCouponExpiry}
                    placeholder="5"
                    placeholderTextColor="#555"
                    style={{
                      backgroundColor: "#0F0F16",
                      borderRadius: 12,
                      padding: 14,
                      paddingRight: 50,
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: "bold",
                      textAlign: "left",
                      borderWidth: 1,
                      borderColor: "#333",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      right: 14,
                      top: 0,
                      bottom: 0,
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      min
                    </Text>
                  </View>
                </View>
              </View>

              {/* Discount Preview with calculations */}
              {couponType !== "free_shipping" && discountAmount && (
                <View
                  style={{
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: "rgba(34, 197, 94, 0.3)",
                  }}
                >
                  <Text
                    style={{
                      color: "#22C55E",
                      fontSize: 12,
                      fontWeight: "700",
                      marginBottom: 12,
                    }}
                  >
                    {"APERÇU"}
                  </Text>

                  {/* Original Price */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}
                    >
                      Prix original
                    </Text>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      200 TND
                    </Text>
                  </View>

                  {/* Discount Calculation */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: "#EF4444", fontSize: 13 }}>
                      Réduction
                    </Text>
                    <Text
                      style={{
                        color: "#EF4444",
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      {couponType === "percentage"
                        ? `${discountAmount}% = ${((200 * parseFloat(discountAmount)) / 100).toFixed(0)} TND`
                        : `${discountAmount} TND`}
                    </Text>
                  </View>

                  {/* Divider */}
                  <View
                    style={{
                      height: 1,
                      backgroundColor: "rgba(255,255,255,0.1)",
                      marginVertical: 8,
                    }}
                  />

                  {/* Final Price */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        color: "#22C55E",
                        fontSize: 15,
                        fontWeight: "700",
                      }}
                    >
                      Prix finale
                    </Text>
                    <Text
                      style={{
                        color: "#22C55E",
                        fontSize: 18,
                        fontWeight: "900",
                      }}
                    >
                      {couponType === "percentage"
                        ? `${(200 - (200 * parseFloat(discountAmount)) / 100).toFixed(0)} TND`
                        : `${Math.max(0, 200 - parseFloat(discountAmount)).toFixed(0)} TND`}
                    </Text>
                  </View>
                </View>
              )}

              {/* Free Shipping Preview */}
              {couponType === "free_shipping" && (
                <View
                  style={{
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: "rgba(34, 197, 94, 0.3)",
                  }}
                >
                  <Text
                    style={{
                      color: "#22C55E",
                      fontSize: 12,
                      fontWeight: "700",
                      marginBottom: 8,
                    }}
                  >
                    {"APERÇU"}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}
                    >
                      Livraison gratuite
                    </Text>
                    <Text
                      style={{
                        color: "#22C55E",
                        fontSize: 20,
                        fontWeight: "900",
                      }}
                    >
                      ✓
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={dropCoupon}
                activeOpacity={0.8}
                style={{ marginTop: 10, borderRadius: 15, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  style={{
                    paddingVertical: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#000",
                      fontWeight: "900",
                      fontSize: 16,
                      letterSpacing: 1,
                    }}
                  >
                    {t("dropCoupon").toUpperCase()}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </KeyboardAvoidingView>
      </Modal>
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
                      {t("sentA")} {recentGift.giftName}
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

      {/* Floating Heart Animations */}
      <View
        style={{
          position: "absolute",
          bottom: 150,
          right: 15,
          width: 60,
          height: 400,
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        {floatingHearts.map((heart) => (
          <FloatingHeart key={heart.id} id={heart.id} x={heart.x} />
        ))}
      </View>
      {/* Recharge Modal */}
      <RechargeModal
        isVisible={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        userId={userId}
        userName={userName || "Host"}
        language={props.language || "fr"}
      />

      {/* Promo Video Setup Modal */}
      <Modal
        visible={showPromoModal && !isLiveStarted}
        transparent
        animationType="fade"
      >
        <BlurView
          intensity={80}
          tint="dark"
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Animatable.View
            animation="fadeInUp"
            duration={500}
            style={{
              width: "90%",
              maxWidth: 400,
              backgroundColor: "rgba(18, 18, 24, 0.95)",
              borderRadius: 32,
              padding: 32,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.08)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 25 },
              shadowOpacity: 0.5,
              shadowRadius: 35,
              elevation: 24,
            }}
          >
            {/* Status Icon */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "rgba(255, 0, 85, 0.05)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
                borderWidth: 1,
                borderColor: "rgba(255, 0, 85, 0.15)",
              }}
            >
              <LinearGradient
                colors={["#FF0055", "#FF3377"]}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#FF0055",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                }}
              >
                <Radio size={26} color="#ffffff" strokeWidth={2.5} />
              </LinearGradient>
            </View>

            <Text
              style={{
                color: "#ffffff",
                fontSize: 26,
                fontWeight: "800",
                textAlign: "center",
                marginBottom: 10,
                letterSpacing: -0.5,
              }}
            >
              {t("liveSetup")}
            </Text>

            <Text
              style={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: 15,
                textAlign: "center",
                marginBottom: 30,
                lineHeight: 22,
                paddingHorizontal: 15,
              }}
            >
              {t("addPromoVideoDesc")}
            </Text>

            {promoUrl ? (
              <Animatable.View
                animation="zoomIn"
                duration={400}
                style={{
                  width: "100%",
                  alignItems: "center",
                  marginBottom: 32,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(0, 255, 127, 0.08)",
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 100,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: "rgba(0, 255, 127, 0.2)",
                  }}
                >
                  <Sparkles
                    size={16}
                    color="#00FF7F"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color: "#00FF7F",
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    {t("videoReady")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={pickPromoVideo}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 20,
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    borderRadius: 100,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    {t("changeVideo")}
                  </Text>
                </TouchableOpacity>
              </Animatable.View>
            ) : (
              <TouchableOpacity
                onPress={pickPromoVideo}
                disabled={isUploadingPromo}
                activeOpacity={0.8}
                style={{
                  width: "100%",
                  height: 110,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  borderStyle: "dashed",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 32,
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                }}
              >
                {isUploadingPromo ? (
                  <View style={{ alignItems: "center" }}>
                    <ActivityIndicator color="#FF0055" size="small" />
                    <Text
                      style={{
                        color: "rgba(255, 255, 255, 0.6)",
                        marginTop: 10,
                        fontWeight: "600",
                        fontSize: 13,
                        letterSpacing: 1,
                      }}
                    >
                      UPLOADING...
                    </Text>
                  </View>
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <PlusCircle size={22} color="rgba(255, 255, 255, 0.7)" />
                    </View>
                    <Text
                      style={{
                        color: "rgba(255, 255, 255, 0.8)",
                        fontWeight: "700",
                        fontSize: 15,
                      }}
                    >
                      {t("selectVideo")}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            <View style={{ width: "100%", gap: 12 }}>
              <TouchableOpacity
                onPress={() => startFirestoreSession()}
                disabled={isUploadingPromo}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={
                    isUploadingPromo ? ["#333", "#222"] : ["#FF0055", "#FF2A6D"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: "100%",
                    height: 56,
                    borderRadius: 16,
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#FF0055",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    elevation: 6,
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: "800",
                      letterSpacing: 0.5,
                    }}
                  >
                    {t("startLiveNow")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {!promoUrl && !isUploadingPromo && (
                <TouchableOpacity
                  onPress={() => startFirestoreSession()}
                  activeOpacity={0.7}
                  style={{
                    width: "100%",
                    height: 48,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.6)",
                      fontWeight: "600",
                      fontSize: 15,
                    }}
                  >
                    {t("skipForNow")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animatable.View>
        </BlurView>
      </Modal>
      {/* ───── Custom Member Action Sheet ───── */}
      <Modal
        visible={!!memberActionSheet?.visible}
        transparent
        animationType="none"
        onRequestClose={() => setMemberActionSheet(null)}
      >
        {/* Dimmed backdrop */}
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }}
          activeOpacity={1}
          onPress={() => setMemberActionSheet(null)}
        />
        {memberActionSheet && (
          <Animatable.View
            animation="slideInUp"
            duration={320}
            easing="ease-out-expo"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(20, 20, 30, 0.98)",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              paddingBottom: 40,
              borderTopWidth: 1,
              borderColor: "rgba(255,0,85,0.2)",
              shadowColor: "#FF0055",
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 30,
              overflow: "hidden",
            }}
          >
            {/* Pink top glow line */}
            <LinearGradient
              colors={["#FF0055", "#FF4D80", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 2, width: "100%" }}
            />

            {/* Handle bar */}
            <View
              style={{ alignItems: "center", paddingTop: 12, paddingBottom: 6 }}
            >
              <View
                style={{
                  width: 44,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.15)",
                }}
              />
            </View>

            {/* User header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 22,
                paddingVertical: 18,
                gap: 14,
              }}
            >
              {/* Avatar with pink glow ring */}
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  shadowColor: "#FF0055",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                }}
              >
                <LinearGradient
                  colors={["#FF0055", "#FF4D80"]}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "900", fontSize: 22 }}
                  >
                    {memberActionSheet.userName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "900",
                    fontSize: 18,
                    letterSpacing: -0.3,
                  }}
                >
                  {memberActionSheet.userName}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 3,
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      backgroundColor: memberActionSheet.isCoHost
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(255,255,255,0.07)",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: memberActionSheet.isCoHost
                        ? "rgba(245,158,11,0.3)"
                        : "rgba(255,255,255,0.1)",
                    }}
                  >
                    <Text
                      style={{
                        color: memberActionSheet.isCoHost
                          ? "#F59E0B"
                          : "rgba(255,255,255,0.5)",
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      {memberActionSheet.isCoHost ? "⭐ CO-HOST" : "👤 VIEWER"}
                    </Text>
                  </View>
                  {memberActionSheet.isMuted && (
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        backgroundColor: "rgba(239,68,68,0.15)",
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: "rgba(239,68,68,0.3)",
                      }}
                    >
                      <Text
                        style={{
                          color: "#EF4444",
                          fontSize: 11,
                          fontWeight: "800",
                        }}
                      >
                        🔇 MUTED
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Divider */}
            <View
              style={{
                marginHorizontal: 22,
                height: 1,
                backgroundColor: "rgba(255,255,255,0.06)",
                marginBottom: 8,
              }}
            />

            {/* Action rows */}
            {[
              {
                bg: memberActionSheet.isCoHost
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(99,179,237,0.12)",
                iconBg: memberActionSheet.isCoHost ? "#F59E0B" : "#3B82F6",
                icon: memberActionSheet.isCoHost ? "📵" : "🤝",
                label: memberActionSheet.isCoHost
                  ? t("stopCoHosting") ||
                    `Stop Co-hosting ${memberActionSheet.userName}`
                  : `${t("inviteToCoHost") || "Invite"} ${memberActionSheet.userName} ${t("toCoHost") || "to co-host"}`,
                sublabel: memberActionSheet.isCoHost
                  ? "Remove co-host status"
                  : `Invite ${memberActionSheet.userName} to present alongside you`,
                onPress: () => {
                  setMemberActionSheet(null);
                  if (memberActionSheet.isCoHost) {
                    sendStreamCustomEvent({
                      type: "stop_cohosting",
                      target: memberActionSheet.userId,
                    });
                  } else {
                    // Zego co-host invitation removed
                    Alert.alert(
                      t("success") || "Success",
                      `${t("invitationSentTo") || "Invitation sent to"} ${memberActionSheet.userName} (Stream)`,
                    );
                  }
                },
              },
              {
                bg: memberActionSheet.isMuted
                  ? "rgba(74,222,128,0.12)"
                  : "rgba(239,68,68,0.12)",
                iconBg: memberActionSheet.isMuted ? "#4ADE80" : "#EF4444",
                icon: memberActionSheet.isMuted ? "💬" : "🔇",
                label: memberActionSheet.isMuted
                  ? t("unmuteComments") || "Unmute Comments"
                  : t("muteComments") || "Mute Comments",
                sublabel: memberActionSheet.isMuted
                  ? "Allow this viewer to comment"
                  : "Block this viewer from commenting",
                onPress: () => {
                  const nowMuted = !memberActionSheet.isMuted;
                  setMutedUsers((prev) =>
                    nowMuted
                      ? [...prev, memberActionSheet.userId]
                      : prev.filter((id) => id !== memberActionSheet.userId),
                  );
                  sendStreamCustomEvent({
                    type: "user_chat_mute",
                    targetUserId: memberActionSheet.userId,
                    muted: nowMuted,
                    hostId: userId,
                  });
                  setMemberActionSheet(null);
                },
              },
              {
                bg: "rgba(192,132,252,0.12)",
                iconBg: "#A855F7",
                icon: "🎤",
                label: t("muteMicrophone") || "Mute Microphone",
                sublabel: "Disable their audio in the live",
                onPress: () => {
                  // Zego microphone control removed
                  setMemberActionSheet(null);
                },
              },
              {
                bg: "rgba(248,113,113,0.1)",
                iconBg: "#EF4444",
                icon: "🚫",
                label: `${t("removeUser") || "Remove"} ${memberActionSheet.userName} ${t("fromRoom") || "from the room"}`,
                sublabel: `Permanently remove ${memberActionSheet.userName} from this live`,
                isDestructive: true,
                onPress: () => {
                  setMemberActionSheet(null);
                  Alert.alert(
                    t("confirmRemove") || "Remove User",
                    `Remove ${memberActionSheet.userName} from the live?`,
                    [
                      { text: t("cancel") || "Cancel", style: "cancel" },
                      {
                        text: t("remove") || "Remove",
                        style: "destructive",
                        onPress: () => {
                          // Zego user removal removed
                        },
                      },
                    ],
                  );
                },
              },
              {
                bg: memberActionSheet.isBlocked
                  ? "rgba(74,222,128,0.12)"
                  : "rgba(251,146,60,0.1)",
                iconBg: memberActionSheet.isBlocked ? "#4ADE80" : "#F97316",
                icon: memberActionSheet.isBlocked ? "✅" : "⛓️",
                label: memberActionSheet.isBlocked
                  ? t("unblock") || "Unblock from co-host apply"
                  : t("block") || "Block from co-host apply",
                sublabel: memberActionSheet.isBlocked
                  ? "Allow them to request co-host again"
                  : "Prevent them from requesting co-host",
                onPress: () => {
                  const uid = memberActionSheet.userId;
                  const wasBlocked = memberActionSheet.isBlocked;
                  setBlockedApplying((prev) =>
                    wasBlocked
                      ? prev.filter((id) => id !== uid)
                      : [...prev, uid],
                  );
                  setMemberActionSheet(null);
                },
              },
            ].map((action, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={action.onPress}
                activeOpacity={0.75}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginHorizontal: 16,
                  marginVertical: 4,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  backgroundColor: action.bg,
                  borderRadius: 18,
                  gap: 14,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.05)",
                }}
              >
                {/* Icon chip */}
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: `${action.iconBg}22`,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: `${action.iconBg}44`,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{action.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: action.isDestructive ? "#F87171" : "#fff",
                      fontSize: 15,
                      fontWeight: "800",
                      letterSpacing: -0.2,
                    }}
                  >
                    {action.label}
                  </Text>
                  {action.sublabel && (
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.38)",
                        fontSize: 12,
                        fontWeight: "500",
                        marginTop: 2,
                      }}
                    >
                      {action.sublabel}
                    </Text>
                  )}
                </View>
                <View style={{ opacity: 0.3 }}>
                  <Text style={{ color: "#fff", fontSize: 16 }}>›</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Cancel row */}
            <View style={{ marginHorizontal: 16, marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => setMemberActionSheet(null)}
                activeOpacity={0.7}
                style={{
                  alignItems: "center",
                  paddingVertical: 14,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                <Text
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: "700",
                    fontSize: 15,
                  }}
                >
                  {t("cancel") || "Cancel"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        )}
      </Modal>
    </View>
  );
}
