import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text as RNText,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  ImageBackground,
  ActivityIndicator,
  Platform,
  FlatList,
  Linking,
  Alert,
  Modal,
  Animated,
  I18nManager,
  Switch,
  KeyboardAvoidingView,
  Dimensions,
  Clipboard,
} from "react-native";

// Stipop Sticker Service
import {
  searchStickers,
  searchProfileStickers,
  getDefaultStickers,
  getMyProfileStickers,
  getProfileStickerPackageInfo,
  getStickerWithDimensions,
  Sticker as StipopSticker,
} from "./src/services/stickerService";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";
import { BlurView } from "expo-blur";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import UniversalVideoPlayer from "./src/components/common/UniversalVideoPlayer";
import ProductCard from "./src/components/ProductCard";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { db, storage, auth } from "./src/api/firebase";
import ShipmentCreationScreen from "./src/screens/ShipmentCreationScreen";
import ShipmentTrackingScreen from "./src/screens/ShipmentTrackingScreen";
import MyShipmentsScreen from "./src/screens/MyShipmentsScreen";
import ProofOfDeliveryScreen from "./src/screens/ProofOfDeliveryScreen";
import DriverDashboardScreen from "./src/screens/EnhancedDriverDashboard";
import AdminProductsScreen from "./src/screens/admin/AdminProductsScreen";
import AdminDashboardScreen from "./src/screens/admin/AdminDashboardScreen";
import AdminOrdersScreen from "./src/screens/admin/AdminOrdersScreen";
import AdminShipmentsScreen from "./src/screens/admin/AdminShipmentsScreen";
import AdminCategoriesScreen from "./src/screens/admin/AdminCategoriesScreen";
import AdminBrandsScreen from "./src/screens/admin/AdminBrandsScreen";
import AdminAdsScreen from "./src/screens/admin/AdminAdsScreen";
import AdminBannersScreen from "./src/screens/admin/AdminBannersScreen";
import AdminCouponsScreen from "./src/screens/admin/AdminCouponsScreen";
import AdminUsersScreen from "./src/screens/admin/AdminUsersScreen";
import AdminFlashSaleScreen from "./src/screens/admin/AdminFlashSaleScreen";
import AdminTreasureHuntScreen from "./src/screens/admin/AdminTreasureHuntScreen";
import AdminPromoBannersScreen from "./src/screens/admin/AdminPromoBannersScreen";
import AdminNotificationsScreen from "./src/screens/admin/AdminNotificationsScreen";
import AdminSettingsScreen from "./src/screens/admin/AdminSettingsScreen";
import AdminSupportListScreen from "./src/screens/admin/AdminSupportListScreen";
import AdminSupportChatScreen from "./src/screens/admin/AdminSupportChatScreen";
import AdminMenuScreen from "./src/screens/admin/AdminMenuScreen";
import AdminVendorTeamScreen from "./src/screens/admin/AdminVendorTeamScreen";
import AdminNotreSelectionScreen from "./src/screens/admin/AdminNotreSelectionScreen";
import AdminGiftsScreen from "./src/screens/admin/AdminGiftsScreen";
import AdminDeliveryCompaniesScreen from "./src/screens/admin/AdminDeliveryCompaniesScreen";
import AdminFinanceDashboard from "./src/screens/admin/AdminFinanceDashboard";
import BrandRevenueScreen from "./src/screens/BrandRevenueScreen";
import { Shipment, generateShippingStickerHTML } from "./src/utils/shipping";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as Location from "expo-location";
import {
  collection,
  getDocs,
  query,
  limit,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  increment,
  runTransaction,
  deleteField,
} from "firebase/firestore";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { Theme } from "./src/theme";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { uploadToBunny } from "./src/utils/bunny";
import {
  Home,
  ShoppingBag,
  Store,
  User,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Plus,
  Heart,
  LogOut,
  MapPin,
  Package,
  Truck,
  Settings,
  Trash2,
  Minus,
  ShoppingCart,
  Shield,
  ShieldCheck,
  LayoutDashboard,
  ListTree,
  FileText,
  Megaphone,
  Users as UsersIcon,
  Image as ImageIcon,
  TrendingUp,
  Camera,
  CheckCircle2,
  LayoutGrid,
  Play,
  Zap,
  Globe,
  Instagram,
  Facebook,
  MessageCircle,
  Video as VideoIcon,
  Star,
  Mail,
  Phone,
  Calendar,
  Clock,
  Ticket,
  Handshake,
  Edit,
  Bell,
  Sliders,
  Check,
  Eye,
  EyeOff,
  Send,
  Fingerprint,
  ScanFace,
  Lock,
  Wallet,
  Coins,
  Trash,
  Flame,
  Laugh,
  Frown,
  Ghost,
  ThumbsDown,
  Meh,
  Sparkles,
  ImagePlay,
  Download,
  Share2,
  Repeat,
  MessageSquare,
  MoreVertical,
  DownloadCloud,
  ArrowRightLeft,
  ArrowRight,
  Gem,
  QrCode,
  Scan,
  Gift,
  Copy,
  CreditCard,
  UserPlus,
  UserCheck,
  Trophy,
  Ruler,
  BrainCircuit,
  Printer,
  Sticker,
} from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import UserBadge from "./src/components/UserBadge";
import QRScanner from "./src/components/QRScanner";
import { Share } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as LocalAuthentication from "expo-local-authentication";
import ChatScreen from "./ChatScreen";
import Constants from "expo-constants";
import CollaborationScreen from "./src/screens/CollaborationScreen";
import VendorRegistrationScreen from "./src/screens/VendorRegistrationScreen";
import SizeGuideScreen from "./src/screens/SizeGuideScreen";
import AdminCollaborationScreen from "./src/screens/admin/AdminCollaborationScreen";
import StoryDetailScreen from "./src/screens/StoryDetailScreen";
import StoryCreateScreen from "./src/screens/StoryCreateScreen";
import MessagesScreen from "./src/screens/MessagesScreen";
import DirectMessageScreen from "./src/screens/DirectMessageScreen";
import CollaborationDetailScreen from "./src/screens/CollaborationDetailScreen";
import LiveStreamScreen from "./src/screens/LiveStreamScreen";
import HostLiveScreen from "./src/screens/HostLiveScreen";
import AudienceLiveScreen from "./src/screens/AudienceLiveScreen";
import LiveAnalyticsScreen from "./src/screens/LiveAnalyticsScreen";
import KYCScreen from "./src/screens/KYCScreen";
import AdminKYCScreen from "./src/screens/admin/AdminKYCScreen";
import AdminVendorApplicationsScreen from "./src/screens/admin/AdminVendorApplicationsScreen";
import {
  LiveSessionService,
  LiveSession,
} from "./src/services/LiveSessionService";
import WalletScreen from "./src/screens/WalletScreen";
import CommandScreen from "./src/screens/CommandScreen";
import FeedScreen from "./src/screens/FeedScreen";
import FriendsScreen from "./src/screens/FriendsScreen";
import CameraScreen from "./src/screens/Camera";
import FidelityScreen from "./src/screens/FidelityScreen";
import DriverDeliveryScreen from "./src/screens/delivery/DriverDeliveryScreen";
import OrderTrackingScreen from "./src/screens/delivery/OrderTrackingScreen";
import ScratchAndWinScreen from "./src/screens/ScratchAndWinScreen";
import InStoreDiscountScreen from "./src/screens/InStoreDiscountScreen";
import {
  TreasureHuntHomeScreen,
  TreasureMapScreen,
  TreasureScannerScreen,
  TreasureRewardsScreen,
  TreasureCampaignScreen,
  TreasureCaptureScreen,
  TreasureLeaderboardScreen,
} from "./src/screens/treasure-hunt";
import {
  treasureHuntService,
  Campaign,
} from "./src/services/TreasureHuntService";

// New extracted imports
import {
  ThemeContext,
  ThemeProvider,
  useAppTheme,
  getAppColors,
} from "./src/context/ThemeContext";
import { APP_ICON, LOGO, width, height } from "./src/constants/layout";
import { uploadToBunny as uploadImageToCloudinary } from "./src/utils/bunny";
import {
  registerForPushNotificationsAsync,
  sendPushNotification,
} from "./src/utils/notifications";
import {
  getName as getNameUtil,
  translateColor as translateColorUtil,
  translateCategory as translateCategoryUtil,
  colorNameToHex,
} from "./src/utils/translationHelpers";
import {
  hasFeature,
  VendorTier,
  AccountType,
} from "./src/utils/planAccessControl";
import { updateProductRating } from "./src/utils/productUtils";
import Translations from "./src/translations";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import AuthScreen from "./src/screens/AuthScreen";
import HomeScreen from "./src/screens/HomeScreen";
import CategoryScreen from "./src/screens/CategoryScreen";

const isExpoGo = Constants.appOwnership === "expo";
if (!(isExpoGo && Platform.OS === "android")) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// --- LEGACY WRAPPERS & GLOBAL STATE ---
let currentLang = "fr";
const API_BASE_URL = "http://192.168.8.189:3000";

// Legacy Colors support
let Colors = getAppColors("dark");

const getName = (field: any, fallback = "") =>
  getNameUtil(field, currentLang, fallback);
const translateColor = (color: string) =>
  translateColorUtil(color, currentLang);
const translateCategory = (cat: string) =>
  translateCategoryUtil(cat, currentLang);

import {
  useFonts,
  Rubik_300Light,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_800ExtraBold,
  Rubik_900Black,
} from "@expo-google-fonts/rubik";

import { AppText } from "./src/components/common/AppText";

const Text = AppText;

// Export Animated AppText for usage with global fonts
export const AnimatedAppText = Animated.createAnimatedComponent(Text);

// Multi-language Translations

export default function App() {
  const [fontsLoaded] = useFonts({
    Rubik_300Light,
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
    Rubik_800ExtraBold,
    Rubik_900Black,
  });
  const [language, setLanguage] = useState<"en" | "fr" | "ar">("fr"); // 'en', 'fr' or 'ar'
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [appState, setAppState] = useState<
    | "Onboarding"
    | "Auth"
    | "Main"
    | "SizeGuide"
    | "VendorRegistration"
    | "PrivacyPolicy"
    | "TermsOfService"
  >("Onboarding");
  const [activeTab, setActiveTab] = useState("Home");
  const [previousTab, setPreviousTab] = useState("Home");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quickAddProduct, setQuickAddProduct] = useState<any>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterBrand, setFilterBrand] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [followedCollabs, setFollowedCollabs] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const [selectedAdminChat, setSelectedAdminChat] = useState<{
    chatId: string;
    customerName: string;
  } | null>(null);
  const [selectedCollab, setSelectedCollab] = useState<any>(null);
  const [activeLiveChannel, setActiveLiveChannel] =
    useState<string>("bey3a-clothing");
  const [isLiveHost, setIsLiveHost] = useState(false);
  // Treasure Hunt State
  const [treasureHuntState, setTreasureHuntState] = useState<
    | "home"
    | "campaign"
    | "map"
    | "scanner"
    | "rewards"
    | "capture"
    | "leaderboard"
  >("home");
  const [selectedTreasureCampaign, setSelectedTreasureCampaign] =
    useState<any>(null);
  const [selectedTreasureLocation, setSelectedTreasureLocation] =
    useState<any>(null);
  const [isLiveReplay, setIsLiveReplay] = useState(false);
  const [replayUrl, setReplayUrl] = useState("");
  const [targetUserProfile, setTargetUserProfile] = useState<any>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [ads, setAds] = useState<any[]>([]);
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(null);
  const [activeTrackingId, setActiveTrackingId] = useState<string>("");
  const [activeTabParams, setActiveTabParams] = useState<any>(null);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);

  // Category navigation stack: [{id, name}]
  const [categoryStack, setCategoryStack] = useState<
    { id: string; name: string }[]
  >([]);
  const currentCategory = categoryStack[categoryStack.length - 1];

  // Hoisted state variables for global access (Feed/Profile/Chat)
  const [works, setWorks] = useState<any[]>([]);
  const [uploadingWork, setUploadingWork] = useState(false);
  const [selectedWork, setSelectedWork] = useState<any>(null);
  const [targetUid, setTargetUid] = useState<string | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingComment, setEditingComment] = useState<any>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [isCommentSheetVisible, setIsCommentSheetVisible] = useState(false);

  const tr = (fr: string, ar: string, en: string) =>
    language === "ar" ? ar : language === "fr" ? fr : en;

  const isOwnProfile =
    user?.uid === profileData?.uid ||
    user?.uid === profileData?.id ||
    (profileData?.email && user?.email === profileData?.email);

  const processScanReward = async (
    scannerUid: string,
    targetId: string,
    type: "user" | "collab",
  ) => {
    if (scannerUid === targetId) return; // Prevent self-farming

    try {
      const scanRef = doc(db, "scans", `${scannerUid}_${targetId}`);
      const scanSnap = await getDoc(scanRef);

      if (!scanSnap.exists()) {
        await setDoc(scanRef, {
          scannerUid,
          targetId,
          type,
          timestamp: serverTimestamp(),
        });

        let scannerReward = 10;
        let targetReward = 50;
        let targetDocRef = null;

        if (type === "user") {
          targetDocRef = doc(db, "users", targetId);
        } else if (type === "collab") {
          const collabSnap = await getDoc(doc(db, "collaborations", targetId));
          if (collabSnap.exists() && collabSnap.data().brandId) {
            targetDocRef = doc(db, "users", collabSnap.data().brandId);
            scannerReward = 20;
            targetReward = 20;
          }
        }

        // Award scanning user
        const scannerRef = doc(db, "users", scannerUid);
        await updateDoc(scannerRef, {
          "wallet.coins": increment(scannerReward),
        });

        // Award target affiliate user/brand
        if (targetDocRef) {
          try {
            await updateDoc(targetDocRef, {
              "wallet.coins": increment(targetReward),
            });
          } catch (e) {
            console.log("Target affiliate wallet update error", e);
          }
        }

        const successMsg =
          language === "ar"
            ? `مبروك! ربحت ${scannerReward} كوينز مالسكان!`
            : language === "fr"
              ? `Félicitations! Vous avez gagné ${scannerReward} pièces grâce au scan!`
              : `Congratulations! You earned ${scannerReward} coins from scanning!`;

        Alert.alert(
          tr("Récompense de Fidélité", "مكافأة وفاء", "Fidelity Reward"),
          successMsg,
        );

        // Notify user
        try {
          await addDoc(collection(db, "notifications"), {
            userId: scannerUid,
            title:
              tr("Récompense de Fidélité", "مكافأة وفاء", "Fidelity Reward") ||
              "Fidelity Reward",
            body: successMsg,
            read: false,
            createdAt: serverTimestamp(),
            type: "wallet",
          });
          if (targetDocRef && type === "user") {
            await addDoc(collection(db, "notifications"), {
              userId: targetId,
              title: "Brand/User Reference",
              body: `Someone scanned your affiliate code. You received ${targetReward} coins!`,
              read: false,
              createdAt: serverTimestamp(),
              type: "wallet",
            });
          }
        } catch (err) {
          console.error("Scan reward notification error:", err);
        }
      }
    } catch (e) {
      console.error("Error processing scan reward", e);
    }
  };

  const processCouponVerification = async (couponId: string) => {
    try {
      const couponRef = doc(db, "active_coupons", couponId);
      const couponSnap = await getDoc(couponRef);

      if (!couponSnap.exists()) {
        Alert.alert(t("error"), t("invalidCoupon") || "Invalid Coupon");
        return;
      }

      const couponData = couponSnap.data();
      if (couponData.status !== "pending") {
        Alert.alert(
          t("error"),
          t("couponAlreadyUsed") || "Coupon already used or expired",
        );
        return;
      }

      // Mark as used
      await updateDoc(couponRef, {
        status: "used",
        verifiedAt: serverTimestamp(),
        verifiedBy: user?.uid,
      });

      // Award loyalty points to the user who generated the coupon
      if (couponData.points > 0 && couponData.userId) {
        const userRef = doc(db, "users", couponData.userId);
        await updateDoc(userRef, {
          "wallet.coins": increment(couponData.points),
        });

        // Notify User
        try {
          await addDoc(collection(db, "notifications"), {
            userId: couponData.userId,
            title: t("notifWalletUpdateTitle") || "Wallet Updated",
            body:
              t("notifWalletUpdateBody")?.replace(
                "{{change}}",
                `+${couponData.points}`,
              ) || `You received ${couponData.points} coins from your coupon!`,
            read: false,
            createdAt: serverTimestamp(),
            type: "wallet",
          });
        } catch (err) {
          console.error(err);
        }
      }

      let verificationBody = `${t("couponVerified") || "Coupon Verified!"}\n${couponData.value}${couponData.type === "percentage" ? "%" : " TND"} ${t("discountApplied") || "discount applied"}`;
      Alert.alert(t("success"), verificationBody);

      // Notify Vendor (the one scanning)
      try {
        await addDoc(collection(db, "notifications"), {
          userId: user?.uid,
          title: t("couponVerified") || "Coupon Verified!",
          body: verificationBody.replace("\n", " - "),
          read: false,
          createdAt: serverTimestamp(),
          type: "general",
        });
      } catch (err) {
        console.error(err);
      }
    } catch (error) {
      console.error("Error verifying coupon:", error);
      Alert.alert(t("error"), "Verification failed");
    }
  };

  const handleScan = async (data: string) => {
    setShowScanner(false);

    // Normalize the URL scheme (bey3a-app:// and bey3a:// should both work)
    const normalizedData = data.replace("bey3a-app://", "bey3a://");

    if (normalizedData.startsWith("bey3a://user/")) {
      const userId = normalizedData.replace("bey3a://user/", "");
      if (user) await processScanReward(user.uid, userId, "user");
      setTargetUid(userId);
      setPreviousTab(activeTab);
      setActiveTab("PublicProfile");
    } else if (normalizedData.startsWith("bey3a://collab/")) {
      const collabId = normalizedData.replace("bey3a://collab/", "");
      if (user) await processScanReward(user.uid, collabId, "collab");
      try {
        const collabSnap = await getDoc(doc(db, "collaborations", collabId));
        if (collabSnap.exists()) {
          setSelectedCollab({ id: collabId, ...collabSnap.data() });
          setActiveTab("CollabDetail");
        } else {
          Alert.alert(t("error"), "Collaboration not found");
        }
      } catch (e) {
        console.error("Scan Error", e);
        Alert.alert(t("error"), "Failed to fetch collaboration");
      }
    } else if (normalizedData.startsWith("bey3a://store/")) {
      const storeId = normalizedData.replace("bey3a://store/", "");
      setActiveStoreId(storeId);
      setPreviousTab(activeTab);
      setActiveTab("InStoreDiscount");
    } else if (normalizedData.startsWith("bey3a://verify-coupon/")) {
      const couponId = normalizedData.replace("bey3a://verify-coupon/", "");
      // Only allow vendors or admins to verify
      if (
        profileData?.role === "vendor" ||
        profileData?.role === "admin" ||
        profileData?.role === "driver"
      ) {
        await processCouponVerification(couponId);
      } else {
        Alert.alert(
          t("error"),
          t("unauthorizedVerify") || "Only staff can verify coupons",
        );
      }
    } else if (
      data.startsWith("BEY3A-") ||
      (activeShipment && data === activeShipment.trackingId)
    ) {
      // It's a shipment tracking ID
      const trackingId = data;

      if (profileData?.role === "driver") {
        try {
          const shipmentsRef = collection(db, "Shipments");
          const q = query(shipmentsRef, where("trackingId", "==", trackingId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const shipmentDoc = snap.docs[0];
            const foundShipment = {
              id: shipmentDoc.id,
              ...shipmentDoc.data(),
            } as any;

            Alert.alert(
              "Shipment Found",
              `Ready to deliver shipment ${trackingId}?`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Proof of Delivery",
                  onPress: () => {
                    setActiveShipment(foundShipment);
                    setActiveTab("ProofOfDelivery");
                  },
                },
              ],
            );
          } else {
            Alert.alert(
              t("error") || "Error",
              "Shipment not found in database.",
            );
          }
        } catch (err) {
          console.log(err);
          Alert.alert(
            t("error") || "Error",
            "Could not fetch shipment details.",
          );
        }
      } else {
        setActiveTrackingId(trackingId);
        setActiveTab("ShipmentTracking");
      }
    } else {
      Alert.alert(t("error"), "Invalid QR Code");
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  useEffect(() => {
    if (selectedWork) {
      const ownerUid = selectedWork.userId || targetUid;
      if (!ownerUid) return;

      // Real-time listener for comments
      setLoadingComments(true);
      const commentsRef = selectedWork.fullPath
        ? collection(db, selectedWork.fullPath, "comments")
        : collection(
            db,
            "users",
            ownerUid,
            "works",
            selectedWork.id,
            "comments",
          );

      const q = query(commentsRef, orderBy("createdAt", "asc"));

      const unsubscribeComments = onSnapshot(q, (snapshot) => {
        const fetchedComments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(fetchedComments);
        setLoadingComments(false);

        // Auto-sync commentsCount if it's out of sync with actual subcollection size
        if (
          selectedWork &&
          fetchedComments.length !== selectedWork.commentsCount
        ) {
          const syncWorkRef = selectedWork.fullPath
            ? doc(db, selectedWork.fullPath)
            : doc(db, "users", ownerUid, "works", selectedWork.id);
          updateDoc(syncWorkRef, {
            commentsCount: fetchedComments.length,
          }).catch(console.error);
        }
      });

      // Real-time listener for the work document itself to sync counts/reactions
      const workRef = selectedWork.fullPath
        ? doc(db, selectedWork.fullPath)
        : doc(db, "users", ownerUid, "works", selectedWork.id);

      const unsubscribeWork = onSnapshot(workRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Only update if it's still the same selected work
          setSelectedWork((prev: any) =>
            prev?.id === docSnap.id
              ? {
                  ...data,
                  id: docSnap.id,
                  userId: ownerUid,
                  fullPath: selectedWork.fullPath,
                }
              : prev,
          );
        }
      });

      return () => {
        unsubscribeComments();
        unsubscribeWork();
      };
    } else {
      setComments([]);
    }
  }, [selectedWork?.id, targetUid]);

  // Global Ads fetch
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const adsSnap = await getDocs(collection(db, "ads"));
        const adsList = adsSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((a: any) => (a as any).isActive !== false)
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setAds(adsList);
      } catch (e) {
        console.error("Ads Fetch Error", e);
      }
    };
    fetchAds();
  }, []);

  const handleCommentReact = async (comment: any, type: string = "love") => {
    if (!user || !selectedWork) return;
    const authorId = selectedWork.userId || targetUid;
    if (!authorId) return;

    const commentRef = selectedWork.fullPath
      ? doc(db, selectedWork.fullPath, "comments", comment.id)
      : doc(
          db,
          "users",
          authorId,
          "works",
          selectedWork.id,
          "comments",
          comment.id,
        );

    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(commentRef);
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        const currentReactions = data.reactions || {};
        const userReactions = data.userReactions || {};

        const prevType = userReactions[user.uid];

        if (prevType === type) {
          delete userReactions[user.uid];
          currentReactions[type] = Math.max(
            0,
            (currentReactions[type] || 0) - 1,
          );
        } else {
          if (prevType) {
            currentReactions[prevType] = Math.max(
              0,
              (currentReactions[prevType] || 0) - 1,
            );
          }
          userReactions[user.uid] = type;
          currentReactions[type] = (currentReactions[type] || 0) + 1;
        }

        transaction.update(commentRef, {
          reactions: currentReactions,
          userReactions: userReactions,
        });
      });
    } catch (e) {
      console.error("Comment Reaction Error", e);
    }
  };

  const handleComment = async () => {
    if (!user || !commentText.trim() || !selectedWork) return;

    const authorId = selectedWork.userId || targetUid;
    if (!authorId) return;

    const commentData = {
      text: commentText.trim(),
      userId: user.uid,
      userName: profileData?.fullName || user.displayName || "User",
      userAvatar: profileData?.avatarUrl || null,
      createdAt: serverTimestamp(),
      replyToId: replyingTo?.id || null,
      replyToUser: replyingTo?.userName || null,
      parentCommentId: replyingTo
        ? replyingTo.parentCommentId || replyingTo.id
        : null,
      reactions: {},
      userReactions: {},
    };

    try {
      if (editingComment) {
        const editRef = selectedWork.fullPath
          ? doc(db, selectedWork.fullPath, "comments", editingComment.id)
          : doc(
              db,
              "users",
              authorId,
              "works",
              selectedWork.id,
              "comments",
              editingComment.id,
            );

        await updateDoc(editRef, {
          text: commentText.trim(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const commentsColl = selectedWork.fullPath
          ? collection(db, selectedWork.fullPath, "comments")
          : collection(
              db,
              "users",
              authorId,
              "works",
              selectedWork.id,
              "comments",
            );

        await addDoc(commentsColl, commentData);

        const workDocRef = selectedWork.fullPath
          ? doc(db, selectedWork.fullPath)
          : doc(db, "users", authorId, "works", selectedWork.id);

        await updateDoc(workDocRef, {
          commentsCount: increment(1),
        });
      }
      setCommentText("");
      setReplyingTo(null);
      setEditingComment(null);
    } catch (e) {
      console.error("Comment Error", e);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedWork) return;
    const authorId = selectedWork.userId || targetUid;
    if (!authorId) return;

    try {
      const delRef = selectedWork.fullPath
        ? doc(db, selectedWork.fullPath, "comments", commentId)
        : doc(
            db,
            "users",
            authorId,
            "works",
            selectedWork.id,
            "comments",
            commentId,
          );

      await deleteDoc(delRef);

      const workDocRef = selectedWork.fullPath
        ? doc(db, selectedWork.fullPath)
        : doc(db, "users", authorId, "works", selectedWork.id);

      await updateDoc(workDocRef, {
        commentsCount: increment(-1),
      });
    } catch (e) {
      console.error("Delete Comment Error", e);
    }
  };

  // Sync global legacy Colors with state
  Colors = getAppColors(theme);

  const t = (key: string) => (Translations as any)[language][key] || key;

  // Fetch Target User Profile when switching to PublicProfile
  useEffect(() => {
    if (activeTab === "PublicProfile" && targetUid) {
      const fetchTargetProfile = async () => {
        // Reset profile first to show loading
        setTargetUserProfile(null);

        try {
          // First try users collection
          const userSnap = await getDoc(doc(db, "users", targetUid));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // Check if user is a partner/brand_owner
            const isPartnerUser =
              userData.isPartner ||
              userData.role === "brand_owner" ||
              userData.role === "partner" ||
              !!userData.brandId;
            setTargetUserProfile({
              ...userData,
              uid: targetUid,
              id: targetUid,
              isPartner: isPartnerUser,
            });
            return;
          }

          // Try collaborations collection by ID
          const collabSnap = await getDoc(doc(db, "collaborations", targetUid));
          if (collabSnap.exists()) {
            const collabData = collabSnap.data();
            // Get the owner's user profile if ownerId exists
            if (collabData.ownerId) {
              const ownerSnap = await getDoc(
                doc(db, "users", collabData.ownerId),
              );
              if (ownerSnap.exists()) {
                setTargetUserProfile({
                  ...ownerSnap.data(),
                  uid: collabData.ownerId,
                  id: collabData.ownerId,
                  brandName: collabData.name || collabData.brandName,
                  brandId: collabData.brandId,
                  isPartner: true,
                  collabData: collabData,
                });
                return;
              }
            }
            // Use collaboration data as profile
            setTargetUserProfile({
              uid: targetUid,
              id: targetUid,
              fullName: collabData.name || collabData.brandName || "Partner",
              displayName: collabData.name || collabData.brandName,
              avatarUrl: collabData.imageUrl || collabData.logo,
              brandId: collabData.brandId,
              isPartner: true,
              collabData: collabData,
            });
            return;
          }

          // Try to find collaboration by brandId
          const brandQuery = query(
            collection(db, "collaborations"),
            where("brandId", "==", targetUid),
            limit(1),
          );
          const brandSnap = await getDocs(brandQuery);
          if (!brandSnap.empty) {
            const collabDoc = brandSnap.docs[0];
            const collabData = collabDoc.data();
            if (collabData.ownerId) {
              const ownerSnap = await getDoc(
                doc(db, "users", collabData.ownerId),
              );
              if (ownerSnap.exists()) {
                setTargetUserProfile({
                  ...ownerSnap.data(),
                  uid: collabData.ownerId,
                  id: collabData.ownerId,
                  brandName: collabData.name || collabData.brandName,
                  brandId: collabData.brandId,
                  isPartner: true,
                  collabData: collabData,
                });
                return;
              }
            }
            setTargetUserProfile({
              uid: targetUid,
              id: targetUid,
              fullName: collabData.name || collabData.brandName || "Partner",
              displayName: collabData.name || collabData.brandName,
              avatarUrl: collabData.imageUrl || collabData.logo,
              brandId: collabData.brandId,
              isPartner: true,
              collabData: collabData,
            });
            return;
          }

          console.log("Target user not found anywhere:", targetUid);
          // Create a minimal profile to avoid blank screen
          setTargetUserProfile({
            uid: targetUid,
            id: targetUid,
            fullName: "User",
            displayName: "User",
          });
        } catch (err) {
          console.error("Error fetching target profile:", err);
          setTargetUserProfile({
            uid: targetUid,
            id: targetUid,
            fullName: "User",
            displayName: "User",
          });
        }
      };
      fetchTargetProfile();
    }
  }, [activeTab, targetUid]);

  useEffect(() => {
    // Sync global language for helper functions
    currentLang = language;
    AsyncStorage.setItem("bey3a_lang", language);

    // Explicitly disable native RTL flipping to fix the "flipped UI" issue
    if (I18nManager.isRTL) {
      I18nManager.forceRTL(false);
      I18nManager.allowRTL(false);
    }
  }, [language]);

  useEffect(() => {
    AsyncStorage.getItem("bey3a_theme").then((val) => {
      if (val === "light" || val === "dark") setTheme(val);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("bey3a_theme", theme);
  }, [theme]);

  useEffect(() => {
    // Load persisted language
    AsyncStorage.getItem("bey3a_lang").then((lang) => {
      if (lang && (lang === "fr" || lang === "ar")) setLanguage(lang);
    });
    AsyncStorage.getItem("bey3a_onboarding_seen").then((val) => {
      if (val === "true") setAppState("Auth");
    });

    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) setExpoPushToken(token);
      })
      .catch((err) => console.log("Push Token Error:", err));

    if (!(isExpoGo && Platform.OS === "android")) {
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          // Handle foreground notification with image support
          const imageUrl =
            notification.request.content.data?.imageUrl ||
            notification.request.content.data?.image;

          // If notification has image, you can handle it here
          // For example, showing an in-app banner with the image
          if (imageUrl) {
            console.log("Notification received with image:", imageUrl);
            // Could trigger a UI update or store for display
          }

          // Mark as read in Firestore if needed
          const notifId = notification.request.content.data?.notificationId;
          if (notifId && typeof notifId === "string" && user?.uid) {
            updateDoc(doc(db, "notifications", notifId), { read: true }).catch(
              console.error,
            );
          }
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          // Handle notification tap - navigate to appropriate screen
          const data = response.notification.request.content.data as any;

          if (data?.screen && typeof data.screen === "string") {
            // Navigate to the specified screen
            setActiveTab(data.screen);
          } else if (data?.orderId) {
            // Navigate to order tracking
            setActiveTab("Orders");
          } else if (data?.productId) {
            // Navigate to product detail
            setActiveTab("Home");
          } else {
            // Default: go to notifications
            setActiveTab("Notifications");
          }
        });
    }

    // Initialize Widget Manager
    try {
      const WidgetManager = require("./src/widgets/WidgetManager").default;
      WidgetManager.getInstance().initialize().catch(console.error);
    } catch (e) {
      console.warn("Widget manager initialization failed:", e);
    }

    return () => {
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "direct_chats"),
      where("participants", "array-contains", user.uid),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach((doc) => {
        count += doc.data()[`unreadCount_${user.uid}`] || 0;
      });
      setTotalUnread(count);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "users", user.uid, "friendRequests"),
      where("status", "==", "pending"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingRequestsCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (user && expoPushToken) {
      const saveToken = async () => {
        try {
          // Check by UID first
          let userRef = doc(db, "users", user.uid);
          let userSnap = await getDoc(userRef);

          // IMPORTANT: If not found by UID, check by Email (for project migrations)
          // We do this BEFORE potentially creating a blank customer profile
          if (!userSnap.exists() && user.email) {
            const usersByEmail = await getDocs(
              query(
                collection(db, "users"),
                where("email", "==", user.email),
                limit(1),
              ),
            );
            if (!usersByEmail.empty) {
              const oldDoc = usersByEmail.docs[0];
              const oldData = oldDoc.data();
              // Create new doc with new UID and old data
              const migratedData = {
                ...oldData,
                expoPushToken,
                lastLogin: serverTimestamp(),
              };
              await setDoc(userRef, migratedData);
              userSnap = await getDoc(userRef);
              setProfileData(migratedData); // Update state immediately
              console.log(
                "🔄 Migrated user profile from old UID to new UID via email (Token Hook)",
              );
            }
          }

          if (userSnap.exists()) {
            await updateDoc(userRef, {
              expoPushToken,
              lastLogin: serverTimestamp(),
            });
          } else {
            // ONLY create a new customer if absolutely no profile exists for this email
            await setDoc(userRef, {
              expoPushToken,
              email: user.email,
              role: "customer",
              fullName: user.displayName || "User",
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            });
            setProfileData({
              email: user.email,
              role: "customer",
              fullName: user.displayName || "User",
              uid: user.uid,
              id: user.uid,
            });
          }
        } catch (e) {
          console.log("Error saving token:", e);
        }
      };
      saveToken();
    }
  }, [user, expoPushToken]);

  useEffect(() => {
    if (!user) return;

    try {
      // Query 1: notifications for this specific user
      const qUser = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(50),
      );

      // Query 2: broadcast notifications for ALL users
      const qAll = query(
        collection(db, "notifications"),
        where("userId", "==", "ALL"),
        orderBy("createdAt", "desc"),
        limit(20),
      );

      const processNotif = (d: any) => ({
        id: d.id,
        ...d.data(),
        time: d.data().createdAt
          ? new Date(d.data().createdAt.seconds * 1000).toLocaleDateString()
          : "Maintenant",
      });

      let userNotifs: any[] = [];
      let allNotifs: any[] = [];

      const merge = () => {
        const merged = [...allNotifs, ...userNotifs];
        merged.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        );
        setNotifications(merged);
      };

      const unsubUser = onSnapshot(qUser, (snap) => {
        userNotifs = snap.docs.map(processNotif);
        merge();
      });

      const unsubAll = onSnapshot(qAll, (snap) => {
        allNotifs = snap.docs.map(processNotif);
        merge();
      });

      return () => {
        unsubUser();
        unsubAll();
      };
    } catch (e) {
      console.log("Notification error:", e);
    }
  }, [user]);

  useEffect(() => {
    const fetchSocials = async () => {
      try {
        const docRef = doc(db, "settings", "socials");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSocialLinks(snap.data());
        }
      } catch (err) {
        console.error("Error fetching socials:", err);
      }
    };
    fetchSocials();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setAppState("Main");
        // Listen to user data changes in real-time
        const unsubscribeUser = onSnapshot(
          doc(db, "users", u.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              setProfileData({ ...userData, uid: u.uid, id: u.uid });
              if (userData.followedCollabs)
                setFollowedCollabs(userData.followedCollabs);
              if (userData.wishlist) setWishlist(userData.wishlist);
            } else if (u.email) {
              // Initial user setup if doc doesn't exist
              const def = {
                email: u.email,
                role: "customer",
                fullName: u.displayName || "User",
                wallet: { coins: 0, diamonds: 0 },
                wishlist: [],
              };
              setProfileData({ ...def, uid: u.uid, id: u.uid });
              setDoc(doc(db, "users", u.uid), def, { merge: true });
            }
          },
        );

        // Cleanup any stale live sessions owned by this user
        // If the app is just starting, the user cannot be live.
        const cleanupSessions = async () => {
          try {
            const sessionsQ = query(
              collection(db, "Live_sessions"),
              where("hostId", "==", u.uid),
              where("status", "==", "live"),
            );
            const sessionsSnap = await getDocs(sessionsQ);
            if (!sessionsSnap.empty) {
              console.log("Found stale live sessions, cleaning up...");
              for (const docSnap of sessionsSnap.docs) {
                await updateDoc(doc(db, "Live_sessions", docSnap.id), {
                  status: "ended",
                });
              }
            }
          } catch (err) {
            console.error("Error cleaning stale sessions:", err);
          }
        };
        cleanupSessions();

        return () => {
          unsubscribeUser();
        };
      } else {
        setUser(null);
        setProfileData(null);
        setWishlist([]);
      }
    });
    return unsubscribe;
  }, []);

  const updateProfileData = async (data: any) => {
    if (!user) return;
    // Ensure email is always persisted
    const updatedData = { ...data, email: user.email };
    await setDoc(doc(db, "users", user.uid), updatedData, { merge: true });
    setProfileData({ ...profileData, ...updatedData });
  };

  const addToCart = (product: any, size?: string, color?: string) => {
    const item = {
      ...product,
      selectedSize: size || product.sizes?.[0] || "M",
      selectedColor: color || product.colors?.[0] || "",
      quantity: 1,
      cartId: Date.now(),
    };
    setCart([...cart, item]);
    setActiveTab("Cart");
  };

  const updateCartQuantity = (cartId: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId === cartId) {
          const newQty = Math.max(1, (item.quantity || 1) + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (cartId: number) => {
    setCart(cart.filter((item) => item.cartId !== cartId));
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      Alert.alert(
        t("error") || "Error",
        t("loginRequired") || "Please login to save your favorites",
      );
      return;
    }

    const newWishlist = wishlist.includes(productId)
      ? wishlist.filter((id) => id !== productId)
      : [...wishlist, productId];

    // Optimistic UI update
    setWishlist(newWishlist);

    // Save to Firebase
    try {
      await updateDoc(doc(db, "users", user.uid), { wishlist: newWishlist });
    } catch (err) {
      console.error("Failed to save wishlist", err);
      // Revert if error
      setWishlist(wishlist);
    }
  };

  const toggleFollowCollab = async (collabIdOrUserId: string) => {
    if (!user) {
      Alert.alert(
        t("error"),
        t("loginRequired") || "Please login to follow partners",
      );
      return;
    }

    try {
      // First, find the actual collaboration document
      let actualCollabId = collabIdOrUserId;
      let collabData: any = null;

      // Try to get collaboration by direct ID
      const collabSnap = await getDoc(
        doc(db, "collaborations", collabIdOrUserId),
      );
      if (collabSnap.exists()) {
        collabData = collabSnap.data();
        actualCollabId = collabIdOrUserId;
      } else {
        // Try to find by brandId
        const brandQuery = query(
          collection(db, "collaborations"),
          where("brandId", "==", collabIdOrUserId),
          limit(1),
        );
        const brandSnap = await getDocs(brandQuery);
        if (!brandSnap.empty) {
          actualCollabId = brandSnap.docs[0].id;
          collabData = brandSnap.docs[0].data();
        } else {
          // Try to find by ownerId
          const ownerQuery = query(
            collection(db, "collaborations"),
            where("ownerId", "==", collabIdOrUserId),
            limit(1),
          );
          const ownerSnap = await getDocs(ownerQuery);
          if (!ownerSnap.empty) {
            actualCollabId = ownerSnap.docs[0].id;
            collabData = ownerSnap.docs[0].data();
          } else {
            // If still not found, check if it's a User ID that has a brandId
            try {
              const userSnap = await getDoc(doc(db, "users", collabIdOrUserId));
              if (userSnap.exists()) {
                const uData = userSnap.data();
                if (uData.brandId) {
                  const bQuery = query(
                    collection(db, "collaborations"),
                    where("brandId", "==", uData.brandId),
                    limit(1),
                  );
                  const bSnap = await getDocs(bQuery);
                  if (!bSnap.empty) {
                    actualCollabId = bSnap.docs[0].id;
                    collabData = bSnap.docs[0].data();
                  }
                }
              }
            } catch (userErr) {
              console.log("Not a user ID or error fetching user:", userErr);
            }
          }
        }
      }

      if (!collabData) {
        Alert.alert(t("error"), "Collaboration not found");
        return;
      }

      // Optimistic update
      const isFollowing = followedCollabs.includes(actualCollabId);
      const newList = isFollowing
        ? followedCollabs.filter((id) => id !== actualCollabId)
        : [...followedCollabs, actualCollabId];

      setFollowedCollabs(newList);

      // 1. Update User's Follow List
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { followedCollabs: newList });
      setProfileData({ ...profileData, followedCollabs: newList });

      // 2. Update Collaboration's Follower Count
      const collabRef = doc(db, "collaborations", actualCollabId);
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(collabRef);
        if (!docSnap.exists()) return;

        const currentCount = docSnap.data().followersCount || 0;
        let newCount = isFollowing
          ? Math.max(0, currentCount - 1)
          : currentCount + 1;
        transaction.update(collabRef, { followersCount: newCount });
      });

      // Show feedback
      Alert.alert(
        t("successTitle"),
        isFollowing
          ? t("unfollowed") || "Unfollowed"
          : t("followed") || "Following",
      );
    } catch (e) {
      console.error("Error toggling follow:", e);
      Alert.alert(t("error"), "Failed to update follow status");
    }
  };

  const handleAcceptFriend = async (userId: string) => {
    if (!user) return;
    try {
      const myRef = doc(db, "users", user.uid);
      const targetRef = doc(db, "users", userId);

      // Find the request ID to clean up
      const q = query(
        collection(db, "friendRequests"),
        where("senderId", "==", userId),
        where("receiverId", "==", user.uid),
        where("status", "==", "pending"),
        limit(1),
      );
      const snap = await getDocs(q);
      const requestId = !snap.empty ? snap.docs[0].id : null;

      await runTransaction(db, async (transaction) => {
        const mySnap = await transaction.get(myRef);
        const targetSnap = await transaction.get(targetRef);

        if (!mySnap.exists() || !targetSnap.exists()) return;

        const myData = mySnap.data();
        const targetData = targetSnap.data();

        // Thoroughly clear ALL request traces between these two users
        const myIncoming = (myData.incomingFriendRequests || []).filter(
          (id: string) => id !== userId,
        );
        const myPending = (myData.pendingFriendRequests || []).filter(
          (id: string) => id !== userId,
        );
        const myFriends = [...new Set([...(myData.friends || []), userId])];

        const targetPending = (targetData.pendingFriendRequests || []).filter(
          (id: string) => id !== user.uid,
        );
        const targetIncoming = (targetData.incomingFriendRequests || []).filter(
          (id: string) => id !== user.uid,
        );
        const targetFriends = [
          ...new Set([...(targetData.friends || []), user.uid]),
        ];

        transaction.update(myRef, {
          incomingFriendRequests: myIncoming,
          pendingFriendRequests: myPending,
          friends: myFriends,
        });

        transaction.update(targetRef, {
          pendingFriendRequests: targetPending,
          incomingFriendRequests: targetIncoming,
          friends: targetFriends,
        });

        if (requestId) {
          const globalReqRef = doc(db, "friendRequests", requestId);
          const subReqRef = doc(
            db,
            "users",
            user.uid,
            "friendRequests",
            requestId,
          );
          transaction.update(globalReqRef, { status: "accepted" });
          transaction.delete(subReqRef);
        }
      });

      // Local state will be updated by onSnapshot, but we can set it for immediate feedback
      setProfileData({
        ...profileData,
        incomingFriendRequests: (
          profileData.incomingFriendRequests || []
        ).filter((id: string) => id !== userId),
        pendingFriendRequests: (profileData.pendingFriendRequests || []).filter(
          (id: string) => id !== userId,
        ),
        friends: [...new Set([...(profileData.friends || []), userId])],
      });

      Alert.alert(t("successTitle"), t("friendAdded") || "Friend added!");
    } catch (e) {
      console.error("Error accepting friend:", e);
      Alert.alert(t("error"), "Failed to accept friend request");
    }
  };

  const handleRemoveFriend = async (userId: string) => {
    if (!user) return;
    Alert.alert(
      t("confirm") || "Confirm",
      t("removeFriendConfirm") ||
        "Are you sure you want to remove this friend?",
      [
        { text: t("cancel") || "Cancel", style: "cancel" },
        {
          text: t("remove") || "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const myRef = doc(db, "users", user.uid);
              const targetRef = doc(db, "users", userId);

              const myFriends = (profileData.friends || []).filter(
                (id: string) => id !== userId,
              );
              const myPending = (
                profileData.pendingFriendRequests || []
              ).filter((id: string) => id !== userId);
              const myIncoming = (
                profileData.incomingFriendRequests || []
              ).filter((id: string) => id !== userId);

              await updateDoc(myRef, {
                friends: myFriends,
                pendingFriendRequests: myPending,
                incomingFriendRequests: myIncoming,
              });

              const targetSnap = await getDoc(targetRef);
              if (targetSnap.exists()) {
                const tData = targetSnap.data();
                const targetFriends = (tData.friends || []).filter(
                  (id: string) => id !== user.uid,
                );
                const targetPending = (
                  tData.pendingFriendRequests || []
                ).filter((id: string) => id !== user.uid);
                const targetIncoming = (
                  tData.incomingFriendRequests || []
                ).filter((id: string) => id !== user.uid);

                await updateDoc(targetRef, {
                  friends: targetFriends,
                  pendingFriendRequests: targetPending,
                  incomingFriendRequests: targetIncoming,
                });
              }

              setProfileData({
                ...profileData,
                friends: myFriends,
                pendingFriendRequests: myPending,
                incomingFriendRequests: myIncoming,
              });
              Alert.alert(
                t("successTitle"),
                t("friendRemoved") || "Friend removed",
              );
            } catch (e) {
              console.error("Error removing friend:", e);
            }
          },
        },
      ],
    );
  };

  const handleAddFriend = async (userId: string) => {
    if (!user) {
      Alert.alert(
        t("error"),
        t("loginRequired") || "Please login to add friends",
      );
      return;
    }

    const currentFriends = profileData?.friends || [];
    const pendingSent = profileData?.pendingFriendRequests || [];
    const incomingRequests = profileData?.incomingFriendRequests || [];

    if (currentFriends.includes(userId)) {
      handleRemoveFriend(userId);
      return;
    }

    if (incomingRequests.includes(userId)) {
      handleAcceptFriend(userId);
      return;
    }

    if (pendingSent.includes(userId)) {
      Alert.alert(
        t("cancelRequest") || "Cancel Request",
        t("cancelRequestConfirm") || "Cancel this friend request?",
        [
          { text: t("no") || "No", style: "cancel" },
          {
            text: t("yes") || "Yes",
            style: "destructive",
            onPress: async () => {
              try {
                const myPending = pendingSent.filter(
                  (id: string) => id !== userId,
                );
                await updateDoc(doc(db, "users", user.uid), {
                  pendingFriendRequests: myPending,
                });

                const targetRef = doc(db, "users", userId);
                const targetSnap = await getDoc(targetRef);
                if (targetSnap.exists()) {
                  const targetIncoming = (
                    targetSnap.data().incomingFriendRequests || []
                  ).filter((id: string) => id !== user.uid);
                  await updateDoc(targetRef, {
                    incomingFriendRequests: targetIncoming,
                  });
                }

                setProfileData({
                  ...profileData,
                  pendingFriendRequests: myPending,
                });
              } catch (e) {
                console.error("Error canceling request", e);
              }
            },
          },
        ],
      );
      return;
    }

    try {
      // Get target user data for the invitation
      const targetRef = doc(db, "users", userId);
      const targetSnap = await getDoc(targetRef);
      if (!targetSnap.exists()) return;
      const targetData = targetSnap.data();

      // 1. Create invitation documents (Align with WalletScreen)
      const requestId = doc(collection(db, "friendRequests")).id;
      const requestData = {
        senderId: user.uid,
        senderName: profileData?.fullName || "User",
        senderAvatar: profileData?.avatarUrl || "",
        receiverId: userId,
        receiverName: targetData.fullName || "User",
        receiverAvatar: targetData.avatarUrl || "",
        status: "pending",
        timestamp: serverTimestamp(),
      };

      const batch = [
        setDoc(doc(db, "friendRequests", requestId), requestData),
        setDoc(
          doc(db, "users", userId, "friendRequests", requestId),
          requestData,
        ),
        // 2. Update user document arrays for quick status check
        updateDoc(doc(db, "users", user.uid), {
          pendingFriendRequests: [...pendingSent, userId],
        }),
        updateDoc(targetRef, {
          incomingFriendRequests: [
            ...(targetData.incomingFriendRequests || []),
            user.uid,
          ],
        }),
      ];

      await Promise.all(batch);

      setProfileData({
        ...profileData,
        pendingFriendRequests: [...pendingSent, userId],
      });

      Alert.alert(
        t("successTitle"),
        t("friendRequestSent") ||
          "Friend request sent! Waiting for acceptance.",
      );
    } catch (e) {
      console.error("Error sending friend request:", e);
      Alert.alert(t("error"), "Failed to send friend request");
    }
  };

  const navigateToProduct = (product: any) => {
    setSelectedProduct(product);
    setActiveTab("Detail");
  };

  const navigateToCategory = (catId: string, catName?: string) => {
    setCategoryStack([{ id: catId, name: catName || catId }]);
    setActiveTab("Category");
  };

  const handleSubCategoryPress = (id: string, name: string) => {
    setCategoryStack((prev) => [...prev, { id, name }]);
    setActiveTab("Category");
  };

  const handleCategoryBack = () => {
    const newStack = categoryStack.slice(0, -1);
    setCategoryStack(newStack);
    if (newStack.length === 0) {
      setActiveTab("Home");
    }
  };

  const navigateToCampaign = (campaign: any) => {
    setSelectedCampaign(campaign);
    setActiveTab("CampaignDetail");
  };

  const handleLogout = async () => {
    Alert.alert(t("logoutConfirmTitle"), t("logoutConfirmMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          setAppState("Auth");
        },
      },
    ]);
  };
  const navigateToSizeGuide = () => {
    setAppState("SizeGuide");
  };
  const navigateToVendorRegistration = () => {
    setAppState("VendorRegistration");
  };

  const handleBackToMain = () => {
    setAppState("Main");
  };

  const handleTabChange = (tab: string, params: any = null) => {
    if (tab === "Shop") {
      setFilterCategory(null);
    }
    setActiveTab(tab);
    setActiveTabParams(params);
  };

  const handleClearNotifications = async () => {
    try {
      // Show confirmation alert
      Alert.alert(
        t("clearAll") || "Clear All",
        language === "ar"
          ? "هل أنت متأكد من مسح جميع الإشعارات؟"
          : language === "fr"
            ? "Êtes-vous sûr de vouloir effacer toutes les notifications ?"
            : "Are you sure you want to clear all notifications?",
        [
          { text: t("cancel") || "Cancel", style: "cancel" },
          {
            text: t("clear") || "Clear",
            style: "destructive",
            onPress: async () => {
              try {
                // Delete each notification from Firestore
                const deletePromises = notifications.map(async (n) => {
                  if (n.id) {
                    await deleteDoc(doc(db, "notifications", n.id));
                  }
                });

                await Promise.all(deletePromises);

                // Clear local state
                setNotifications([]);

                // Show success feedback
                console.log("All notifications cleared");
              } catch (e) {
                console.error("Error clearing notifications:", e);
              }
            },
          },
        ],
      );
    } catch (e) {
      console.error("Error in clear notifications:", e);
    }
  };

  const [liveStreamData, setLiveStreamData] = useState<any>(null);

  const handleJoinLive = (info: any) => {
    if (typeof info === "string") {
      setActiveLiveChannel(info);
      // Joining via simple channel ID should default to Audience to be safe
      setIsLiveHost(false);
      setLiveStreamData({ channelId: info });
    } else {
      setActiveLiveChannel(info.channelId);
      setIsLiveHost(info.isHost);
      setLiveStreamData(info);
      setIsLiveReplay(!!info.isReplay);
      setReplayUrl(info.replayUrl || "");
    }
    setAppState("Main");
    setActiveTab("LiveStream");
  };

  const handleStartLive = (arg?: any) => {
    // Plan check
    const tier = (profileData?.vendorPlan as VendorTier) || "starter";
    const accountType =
      (profileData?.accountType as AccountType) || "entreprise";
    if (!hasFeature(tier, "liveStreaming", accountType)) {
      Alert.alert(
        t("premiumFeature") || "Premium Feature",
        t("upgradeRequiredLive") ||
          "Live streaming is not available in your current plan. Upgrade to Professional to unlock it!",
        [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("seePlans") || "See Plans",
            onPress: () => navigateToVendorRegistration(),
          },
        ],
      );
      return;
    }

    // Check if we were passed a collaboration ID (string) or a brandInfo object
    const isObject = arg && typeof arg === "object";
    const actualCollabId =
      typeof arg === "string" ? arg : isObject ? arg.id : undefined;

    // Generate channelId
    const channelId =
      actualCollabId ||
      `live_${profileData?.brandId || profileData?.id || user?.uid}_${Date.now()}`;

    // Set avatar: priority to the passed info object, then profile data
    const infoAvatar = isObject
      ? arg.logoUrl || arg.image || arg.logo || arg.coverImageUrl
      : null;

    let infoName = isObject
      ? arg.name || arg.displayName || arg.brandName || arg.title
      : null;
    if (infoName && typeof infoName === "object") {
      // Handle localized name object or unexpected object
      infoName =
        infoName[language] ||
        infoName.en ||
        infoName.fr ||
        infoName.ar ||
        Object.values(infoName)[0] ||
        null;
    }

    let baseName =
      profileData?.brandName ||
      profileData?.fullName ||
      user?.displayName ||
      (user?.email ? user.email.split("@")[0] : "Host");
    if (baseName && typeof baseName === "object") {
      baseName =
        baseName[language] ||
        baseName.en ||
        baseName.fr ||
        baseName.ar ||
        Object.values(baseName)[0] ||
        "Host";
    }

    const finalHostName =
      typeof infoName === "string" && infoName
        ? infoName
        : typeof baseName === "string"
          ? baseName
          : "Host";

    setActiveLiveChannel(channelId);
    setIsLiveHost(true);
    setLiveStreamData({
      channelId,
      brandId:
        profileData?.brandId ||
        (actualCollabId && !actualCollabId.startsWith("live_")
          ? actualCollabId
          : undefined),
      collabId: actualCollabId,
      isHost: true,
      hostAvatar:
        infoAvatar ||
        profileData?.avatarUrl ||
        profileData?.logoUrl ||
        user?.photoURL,
      hostName: finalHostName,
    });
    setIsLiveReplay(false);
    setReplayUrl("");
    setAppState("Main");
    setActiveTab("LiveStream");
  };

  const renderMainContent = () => {
    const commonProps = {
      t,
      theme,
      language,
      user,
      profileData,
    };

    switch (activeTab) {
      case "Home":
        return (
          <HomeScreen
            user={user}
            profileData={profileData}
            onProductPress={navigateToProduct}
            onCategoryPress={navigateToCategory}
            onCampaignPress={navigateToCampaign}
            onNavigate={handleTabChange}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            notifications={notifications}
            addToCart={(p: any) => setQuickAddProduct(p)}
            t={t}
            language={language}
            setFilterBrand={setFilterBrand}
            onJoinLive={handleJoinLive}
          />
        );
      case "LiveStream":
        return isLiveHost ? (
          <HostLiveScreen
            channelId={activeLiveChannel}
            userId={user?.uid || "guest"}
            userName={
              liveStreamData?.hostName ||
              profileData?.fullName ||
              user?.displayName ||
              user?.email?.split("@")[0] ||
              "Host"
            }
            brandId={liveStreamData?.brandId}
            collabId={liveStreamData?.collabId}
            onClose={() => setActiveTab("Home")}
            t={t}
            language={language}
            hostAvatar={
              liveStreamData?.hostAvatar ||
              profileData?.avatarUrl ||
              user?.photoURL
            }
          />
        ) : (
          <AudienceLiveScreen
            channelId={activeLiveChannel}
            userId={user?.uid || "guest"}
            userName={
              profileData?.fullName ||
              user?.displayName ||
              user?.email?.split("@")[0] ||
              "User"
            }
            userAvatar={profileData?.avatarUrl || user?.photoURL}
            onClose={() => setActiveTab("Home")}
            t={t}
            language={language}
            profileData={profileData}
          />
        );
      case "Notifications":
        return (
          <NotificationsScreen
            notifications={notifications}
            language={language}
            onClear={handleClearNotifications}
            onBack={() => setActiveTab("Home")}
            t={t}
          />
        );
      case "Category":
        return (
          <CategoryScreen
            categoryId={currentCategory?.id}
            categoryName={currentCategory?.name}
            onBack={handleCategoryBack}
            onProductPress={navigateToProduct}
            onSubCategoryPress={handleSubCategoryPress}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            addToCart={(p: any) => setQuickAddProduct(p)}
            onBrandPress={(id) => {
              setFilterCategory(id);
              setFilterBrand(null);
              setActiveTab("Shop");
            }}
            t={t}
            theme={theme || "light"}
            language={language}
          />
        );
      case "Shop":
        return (
          <ShopScreen
            onProductPress={navigateToProduct}
            initialCategory={filterCategory}
            initialBrand={filterBrand}
            setInitialBrand={setFilterBrand}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            addToCart={(p: any) => setQuickAddProduct(p)}
            onBack={() => setActiveTab("Home")}
            t={t}
            theme={theme}
            language={language}
          />
        );
      case "Cart":
        return (
          <CartScreen
            cart={cart}
            onRemove={removeFromCart}
            onUpdateQuantity={updateCartQuantity}
            onComplete={() => setCart([])}
            profileData={profileData}
            updateProfile={updateProfileData}
            onBack={() => setActiveTab("Shop")}
            t={t}
            onShowScanner={() => setShowScanner(true)}
          />
        );
      case "Profile":
        return (
          <ProfileScreen
            user={user}
            onBack={() => setActiveTab("Home")}
            onLogout={handleLogout}
            profileData={profileData}
            updateProfile={updateProfileData}
            onNavigate={handleTabChange}
            socialLinks={socialLinks}
            t={t}
            language={language}
            setLanguage={setLanguage}
            theme={theme}
            setTheme={setTheme}
            followedCollabs={followedCollabs}
            toggleFollowCollab={toggleFollowCollab}
            setSelectedCollab={setSelectedCollab}
            setActiveTab={setActiveTab}
            setPreviousTab={setPreviousTab}
            targetUid={targetUid}
            isPublicProfile={false}
            currentUserProfileData={profileData}
            onShowBadge={() => setShowBadge(true)}
            onShowScanner={() => setShowScanner(true)}
            setActiveTrackingId={setActiveTrackingId}
            setTrackingModalVisible={setTrackingModalVisible}
            onStartLive={handleStartLive}
            onBecomeVendor={navigateToVendorRegistration}
            onAddFriend={handleAddFriend}
          />
        );
      case "PublicProfile":
        return (
          <ProfileScreen
            key={`public-profile-${targetUid}`}
            user={user}
            onBack={() => setActiveTab(previousTab)}
            onLogout={handleLogout}
            profileData={targetUserProfile}
            currentUserProfileData={profileData}
            updateProfile={updateProfileData}
            onNavigate={(tab: string | any) => setActiveTab(tab)}
            socialLinks={socialLinks}
            t={t}
            language={language}
            setLanguage={setLanguage}
            theme={theme}
            setTheme={setTheme}
            followedCollabs={followedCollabs}
            toggleFollowCollab={toggleFollowCollab}
            setSelectedCollab={setSelectedCollab}
            setActiveTab={setActiveTab}
            setPreviousTab={setPreviousTab}
            onStartLive={handleStartLive}
            totalUnread={totalUnread}
            setTotalUnread={setTotalUnread}
            works={works}
            setWorks={setWorks}
            uploadingWork={uploadingWork}
            setUploadingWork={setUploadingWork}
            selectedWork={selectedWork}
            setSelectedWork={setSelectedWork}
            targetUid={targetUid}
            setTargetUid={setTargetUid}
            selectedChatUser={selectedChatUser}
            setSelectedChatUser={setSelectedChatUser}
            comments={comments}
            setComments={setComments}
            commentText={commentText}
            setCommentText={setCommentText}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            editingComment={editingComment}
            setEditingComment={setEditingComment}
            loadingComments={loadingComments}
            setLoadingComments={setLoadingComments}
            expandedReplies={expandedReplies}
            setExpandedReplies={setExpandedReplies}
            isPublicProfile={true}
            onShowBadge={() => setShowBadge(true)}
            onShowScanner={() => setShowScanner(true)}
            setActiveTrackingId={setActiveTrackingId}
            onAddFriend={handleAddFriend}
          />
        );
      case "FollowManagement":
        return (
          <FollowManagementScreen
            onBack={() => setActiveTab("Profile")}
            followedCollabs={followedCollabs}
            toggleFollowCollab={toggleFollowCollab}
            setSelectedCollab={setSelectedCollab}
            setActiveTab={setActiveTab}
            t={t}
            language={language}
            theme={theme}
          />
        );
      case "Orders":
        return (
          <CommandScreen
            onBack={() => setActiveTab("Profile")}
            onTrack={(tid: string) => {
              setActiveTrackingId(tid);
              setActiveTab("ShipmentTracking");
            }}
            t={t}
            language={language}
            onNavigate={(tab: string | any) => setActiveTab(tab)}
          />
        );
      case "Wishlist":
        return (
          <WishlistScreen
            onBack={() => setActiveTab("Profile")}
            onProductPress={navigateToProduct}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            addToCart={(p: any) => setQuickAddProduct(p)}
            t={t}
            theme={theme}
            language={language}
          />
        );
      case "Settings":
        return (
          <SettingsScreen
            onBack={() => setActiveTab("Profile")}
            onLogout={handleLogout}
            profileData={profileData}
            updateProfile={updateProfileData}
            onNavigate={(screen: string) => setActiveTab(screen)}
            t={t}
            user={user}
          />
        );
      case "KYC":
        return (
          <KYCScreen
            onBack={() => setActiveTab("Profile")}
            user={user}
            profileData={profileData}
            updateProfile={updateProfileData}
            theme={theme}
            t={t}
            language={language}
          />
        );
      case "Camera":
        return (
          <CameraScreen
            onBack={() => {
              setActiveTab("Feed");
              setActiveTabParams(null);
            }}
            onNavigate={handleTabChange}
            t={t}
            language={language}
            theme={theme}
            user={user}
            initialFile={activeTabParams?.initialFile}
            fileType={activeTabParams?.fileType}
            // @ts-ignore
            onCapture={activeTabParams?.onCapture}
          />
        );
      case "VendorRegistrationScreen":
        return (
          <VendorRegistrationScreen
            user={user}
            onBack={() => setActiveTab("Profile")}
            t={t}
            language={language}
            profileData={profileData}
            updateProfile={updateProfileData}
            theme={theme}
          />
        );

      case "Messages":
        return (
          <MessagesScreen
            user={user}
            onBack={() => setActiveTab("Profile")}
            onSelectChat={async (chat: any, otherId: string) => {
              const userDoc = await getDoc(doc(db, "users", otherId));
              if (userDoc.exists()) {
                setSelectedChatUser({ uid: otherId, ...userDoc.data() });
                setActiveTab("DirectMessage");
              }
            }}
            onNavigate={handleTabChange}
            t={t}
            tr={tr}
          />
        );
      case "DirectMessage":
        return (
          <DirectMessageScreen
            user={user}
            targetUser={activeTabParams?.targetUser || selectedChatUser}
            onBack={() => setActiveTab("Messages")}
            onNavigate={handleTabChange}
            t={t}
            language={language}
            currentUserData={profileData}
          />
        );
      case "Wallet":
        return (
          <WalletScreen
            onBack={() => setActiveTab("Profile")}
            theme={theme}
            t={t}
            profileData={profileData}
            user={user}
            language={language}
            onNavigate={(screen, params) => {
              if (screen === "PublicProfile") {
                setTargetUserProfile(params);
                setPreviousTab("Wallet");
                setActiveTab("PublicProfile");
              } else {
                setActiveTab(screen);
              }
            }}
          />
        );
      case "Fidelity":
        return (
          <FidelityScreen
            onBack={() => setActiveTab("Profile")}
            onNavigate={(screen) => setActiveTab(screen)}
            user={user}
            t={t}
            theme={theme}
          />
        );
      case "ScratchAndWin":
        return (
          <ScratchAndWinScreen
            onBack={() => setActiveTab("Fidelity")}
            user={user}
            t={t}
            theme={theme}
            language={language}
          />
        );
      case "InStoreDiscount":
        return (
          <InStoreDiscountScreen
            storeId={activeStoreId || ""}
            onClose={() => {
              setActiveTab(previousTab || "Home");
              setActiveStoreId(null);
            }}
            userId={user?.uid || ""}
            cart={cart}
            t={t}
            isDark={theme === "dark"}
            language={language}
          />
        );
      case "DriverDelivery":
        return (
          <DriverDeliveryScreen
            onBack={() => setActiveTab("Profile")}
            user={user}
            profileData={profileData}
            theme={theme}
            t={t}
            language={language}
          />
        );
      case "TreasureHunt":
        return (
          <>
            {treasureHuntState === "home" && (
              <TreasureHuntHomeScreen
                t={t}
                userId={user?.uid || ""}
                isDark={theme === "dark"}
                onBack={
                  previousTab === "Profile"
                    ? () => setActiveTab("Profile")
                    : undefined
                }
                onCampaignSelect={(campaign: Campaign) => {
                  setSelectedTreasureCampaign(campaign);
                  setTreasureHuntState("campaign");
                }}
                onViewRewards={() => setTreasureHuntState("rewards")}
                onViewLeaderboard={() => setTreasureHuntState("leaderboard")}
                onMapPress={(campaign: Campaign) => {
                  setSelectedTreasureCampaign(campaign);
                  setTreasureHuntState("map");
                }}
                onScanPress={(campaign: Campaign) => {
                  setSelectedTreasureCampaign(campaign);
                  setTreasureHuntState("scanner");
                }}
                onShopPress={() => setActiveTab("Shop")}
              />
            )}
            {treasureHuntState === "campaign" && selectedTreasureCampaign && (
              <TreasureCampaignScreen
                campaign={selectedTreasureCampaign}
                userId={user?.uid || ""}
                t={t}
                isDark={theme === "dark"}
                onBack={() => setTreasureHuntState("home")}
                onStartGame={() => setTreasureHuntState("map")}
                onViewMap={() => setTreasureHuntState("map")}
                onClaimReward={() => setTreasureHuntState("rewards")}
              />
            )}
            {treasureHuntState === "map" && selectedTreasureCampaign && (
              <TreasureMapScreen
                campaignId={selectedTreasureCampaign.id}
                userId={user?.uid || ""}
                t={t}
                isDark={theme === "dark"}
                onBack={() => setTreasureHuntState("campaign")}
                onViewRewards={() => setTreasureHuntState("rewards")}
                onViewProfile={() => {
                  setTreasureHuntState("home");
                }}
                onScan={(location) => {
                  setSelectedTreasureLocation(location);
                  setTreasureHuntState("capture");
                }}
              />
            )}
            {treasureHuntState === "capture" && selectedTreasureLocation && (
              <TreasureCaptureScreen
                location={selectedTreasureLocation}
                isDark={theme === "dark"}
                t={t}
                onCancel={() => setTreasureHuntState("map")}
                onSuccess={async (data) => {
                  try {
                    await treasureHuntService.processScan(
                      selectedTreasureCampaign.id,
                      user?.uid || "",
                      data.qrCode, // Use the location's QR code
                    );
                    setTreasureHuntState("map");
                  } catch (error) {
                    console.error("Capture error:", error);
                    setTreasureHuntState("map");
                  }
                }}
              />
            )}
            {treasureHuntState === "scanner" && selectedTreasureCampaign && (
              <TreasureScannerScreen
                campaignId={selectedTreasureCampaign.id}
                userId={user?.uid || ""}
                t={t}
                isDark={theme === "dark"}
                onBack={() => setTreasureHuntState("map")}
                onSuccess={() => {
                  setTreasureHuntState("map");
                }}
                onError={(message) => {
                  console.log("Scan error:", message);
                }}
              />
            )}
            {treasureHuntState === "rewards" && (
              <TreasureRewardsScreen
                userId={user?.uid || ""}
                t={t}
                isDark={theme === "dark"}
                onBack={() => {
                  if (selectedTreasureCampaign) {
                    setTreasureHuntState("campaign");
                  } else {
                    setTreasureHuntState("home");
                  }
                }}
              />
            )}
            {treasureHuntState === "leaderboard" && (
              <TreasureLeaderboardScreen
                t={t}
                onBack={() => setTreasureHuntState("home")}
              />
            )}
          </>
        );
      case "OrderTracking":
        return (
          <OrderTrackingScreen
            orderId={activeTabParams?.orderId || ""}
            onBack={() => setActiveTab("Orders")}
            user={user}
            theme={theme}
            t={t}
            language={language}
          />
        );
      case "Friends":
        return (
          <FriendsScreen
            onBack={() => setActiveTab("Profile")}
            user={user}
            profileData={profileData}
            theme={theme}
            t={t}
            language={language}
            onNavigate={(screen, params) => {
              if (screen === "PublicProfile") {
                setTargetUserProfile(params);
                setPreviousTab("Friends");
                setActiveTab("PublicProfile");
              } else if (screen === "DirectMessage") {
                setActiveTab("DirectMessage");
                setActiveTabParams(params);
              } else {
                setActiveTab(screen);
              }
            }}
          />
        );
      case "Chat":
        return (
          <ChatScreen
            onBack={() => setActiveTab("Settings")}
            user={user}
            profileData={profileData}
            t={t}
            theme={theme}
            colors={getAppColors(theme)}
            friend={activeTabParams?.friend}
            language={language}
          />
        );
      case "PrivacyPolicy":
        return (
          <PrivacyPolicyScreen
            onBack={() => setActiveTab("Settings")}
            t={t}
            language={language}
          />
        );
      case "TermsOfService":
        return (
          <TermsOfServiceScreen
            onBack={() => setActiveTab("Settings")}
            t={t}
            language={language}
          />
        );
      case "LiveAnalytics":
        return (
          <LiveAnalyticsScreen
            brandId={profileData?.brandId || ""}
            onBack={() => setActiveTab("Profile")}
            onNavigate={(screen: string, params?: any) => {
              if (screen === "LiveStream") {
                handleJoinLive(params);
              } else {
                setActiveTab(screen);
              }
            }}
            theme={theme}
            language={language}
            t={t}
          />
        );

      // Admin Routes
      case "AdminMenu":
        return (
          <AdminMenuScreen
            onBack={() => setActiveTab("Profile")}
            onNavigate={setActiveTab}
            profileData={profileData}
            t={t}
          />
        );
      case "AdminDashboard":
        return (
          <AdminDashboardScreen
            onBack={() => setActiveTab("AdminMenu")}
            onNavigate={setActiveTab}
            user={user}
            profileData={profileData}
            t={t}
            language={language}
          />
        );
      case "AdminProducts":
        return (
          <AdminProductsScreen
            onBack={() => setActiveTab("AdminMenu")}
            user={user}
            profileData={profileData}
            t={t}
          />
        );
      case "AdminCategories":
        return (
          <AdminCategoriesScreen
            onBack={() => setActiveTab("AdminMenu")}
            profileData={profileData}
            t={t}
          />
        );
      case "AdminBrands":
        return (
          <AdminBrandsScreen
            onBack={() => setActiveTab("AdminMenu")}
            profileData={profileData}
            t={t}
          />
        );
      case "AdminDeliveryCompanies":
        return (
          <AdminDeliveryCompaniesScreen
            onBack={() => setActiveTab("AdminMenu")}
            t={t}
          />
        );
      case "AdminFinanceDashboard":
        return (
          <AdminFinanceDashboard
            onBack={() => setActiveTab("AdminMenu")}
            t={t}
          />
        );
      case "BrandRevenue":
        return (
          <BrandRevenueScreen
            onBack={() => setActiveTab("AdminMenu")}
            profileData={profileData}
            t={t}
          />
        );
      case "AdminAds":
        return (
          <AdminAdsScreen
            onBack={() => setActiveTab("AdminMenu")}
            profileData={profileData}
            t={t}
          />
        );
      case "AdminFlashSale":
        return (
          <AdminFlashSaleScreen
            onBack={() => setActiveTab("AdminMenu")}
            profileData={profileData}
            t={t}
          />
        );
      case "AdminNotreSelection":
        return (
          <AdminNotreSelectionScreen
            onBack={() => setActiveTab("AdminMenu")}
            profileData={profileData}
            t={t}
            language={language}
          />
        );
      case "AdminPromoBanners":
        return (
          <AdminPromoBannersScreen
            onBack={() => setActiveTab("AdminMenu")}
            profileData={profileData}
            t={t}
          />
        );
      case "AdminBanners":
        return (
          <AdminBannersScreen
            onBack={() => setActiveTab("AdminMenu")}
            profileData={profileData}
            t={t}
          />
        );
      case "AdminOrders":
        return (
          <AdminOrdersScreen
            onBack={() => setActiveTab("AdminMenu")}
            user={user}
            profileData={profileData}
            t={t}
            language={language}
          />
        );
      case "AdminUsers":
        return (
          <AdminUsersScreen
            onBack={() => setActiveTab("AdminMenu")}
            profileData={profileData}
            t={t}
            language={language}
          />
        );
      case "AdminCoupons":
        return (
          <AdminCouponsScreen
            onBack={() => setActiveTab("AdminMenu")}
            profileData={profileData}
            t={t}
            language={language}
          />
        );
      case "AdminSettings":
        return (
          <AdminSettingsScreen
            onBack={() => setActiveTab("AdminMenu")}
            user={user}
            profileData={profileData}
            t={t}
          />
        );
      case "AdminNotifications":
        return (
          <AdminNotificationsScreen
            onBack={() => setActiveTab("AdminMenu")}
            profileData={profileData}
            t={t}
          />
        );
      case "AdminKYC":
        return (
          <AdminKYCScreen
            onBack={() => setActiveTab("AdminMenu")}
            profileData={profileData}
            t={t}
            theme={theme}
          />
        );
      case "AdminVendorApplications":
        return (
          <AdminVendorApplicationsScreen
            onBack={() => setActiveTab("AdminMenu")}
            t={t}
            theme={theme}
          />
        );
      case "AdminSupportList":
        return (
          <AdminSupportListScreen
            onBack={() => setActiveTab("AdminMenu")}
            onChatPress={(chatId: string, customerName: string) => {
              setSelectedAdminChat({ chatId, customerName });
              setActiveTab("AdminSupportChat");
            }}
            profileData={profileData}
            t={t}
            theme={theme}
            colors={getAppColors(theme)}
          />
        );
      case "AdminVendorTeam":
        return (
          <AdminVendorTeamScreen
            onBack={() => setActiveTab("AdminMenu")}
            profileData={profileData}
            t={t}
          />
        );
      case "AdminSupportChat":
        return (
          <AdminSupportChatScreen
            onBack={() => setActiveTab("AdminSupportList")}
            onNavigate={handleTabChange}
            chatId={selectedAdminChat?.chatId}
            customerName={selectedAdminChat?.customerName}
            user={user}
            profileData={profileData}
            t={t}
            theme={theme}
            colors={getAppColors(theme)}
          />
        );

      case "AdminShipments":
        return (
          <AdminShipmentsScreen
            onBack={() => setActiveTab("AdminMenu")}
            user={user}
            profileData={profileData}
            language={language}
            t={t}
          />
        );
      case "ShipmentTracking":
        return (
          <ShipmentTrackingScreen
            trackingId={activeTrackingId}
            onBack={() => setActiveTab(previousTab || "Profile")}
            t={t}
          />
        );
      case "MyShipments":
        return (
          <MyShipmentsScreen
            onBack={() => setActiveTab("Profile")}
            onTrackShipment={(trackingId: string) => {
              setActiveTrackingId(trackingId);
              setActiveTab("ShipmentTracking");
            }}
            t={t}
            user={user}
            profileData={profileData}
          />
        );
      case "ProofOfDelivery":
        return (
          <ProofOfDeliveryScreen
            shipment={activeShipment}
            onBack={() =>
              setActiveTab(
                profileData?.role === "driver" ? "DriverDashboard" : "Orders",
              )
            }
            onComplete={() =>
              setActiveTab(
                profileData?.role === "driver" ? "DriverDashboard" : "Orders",
              )
            }
            t={t}
          />
        );

      case "DriverDashboard":
        return (
          <DriverDashboardScreen
            user={user}
            profileData={profileData}
            onBack={() => setActiveTab("Profile")}
            onOpenProof={(s: any) => {
              setActiveShipment(s);
              setActiveTab("ProofOfDelivery");
            }}
            onScanQR={(s: any) => {
              setActiveShipment(s);
              setShowScanner(true);
            }}
            t={t}
            language={language}
          />
        );

      case "ShipmentCreation":
        return (
          <ShipmentCreationScreen
            onBack={() => setActiveTab("Profile")}
            onComplete={() => setActiveTab("Profile")}
            t={t}
          />
        );
      case "Feed":
        return (
          <FeedScreen
            t={t}
            theme={theme}
            language={language}
            onNavigate={(screen, params) => setActiveTab(screen)}
            onJoinLive={handleJoinLive}
            onWorkPress={(work, targetUid) => {
              setSelectedWork(work);
              setTargetUid(targetUid);
            }}
            onCommentPress={(work, targetUid) => {
              setSelectedWork(work);
              setTargetUid(targetUid);
              setIsCommentSheetVisible(true);
            }}
            onUserPress={(userId) => {
              setTargetUid(userId);
              setPreviousTab("Feed");
              setActiveTab("PublicProfile");
            }}
            onCampaignPress={navigateToCampaign}
            onAddFriend={handleAddFriend}
            onFollowCollab={toggleFollowCollab}
            onCollabPress={async (collabId) => {
              // Navigate to user profile to show Works and Messages tabs
              setTargetUid(collabId);
              setPreviousTab("Feed");
              setActiveTab("PublicProfile");
            }}
            user={user}
            profileData={profileData}
            ads={ads}
            followedCollabs={followedCollabs}
          />
        );

      case "Collaboration":
        return (
          <CollaborationScreen
            t={t}
            theme={theme}
            language={language}
            onNavigate={(screen) => setActiveTab(screen)}
            onCollabPress={(collab) => {
              setSelectedCollab(collab);
              setActiveTab("CollabDetail");
            }}
            onBack={() => setActiveTab("Home")}
          />
        );
      case "CollabDetail":
        return (
          <CollaborationDetailScreen
            collab={selectedCollab}
            onBack={() => setActiveTab("Collaboration")}
            onNavigateToShop={(brandId) => {
              setFilterBrand(brandId);
              setActiveTab("Shop");
            }}
            onProductPress={navigateToProduct}
            theme={theme}
            language={language}
            t={t}
            followedCollabs={followedCollabs}
            toggleFollowCollab={toggleFollowCollab}
            profileData={profileData}
            onJoinLive={handleJoinLive}
            onStartLive={handleStartLive}
            tr={tr}
          />
        );
      case "VendorRegistration":
        return (
          <VendorRegistrationScreen
            onBack={() => setActiveTab("Profile")}
            user={user}
            profileData={profileData}
            updateProfile={updateProfile}
            theme={theme}
            t={t}
            language={language}
          />
        );
      case "AdminGifts":
        return (
          <AdminGiftsScreen
            onBack={() => setActiveTab("AdminDashboard")}
            t={t}
            theme={theme}
          />
        );
      case "AdminCollaboration":
        return (
          <AdminCollaborationScreen
            onBack={() => setActiveTab("AdminMenu")}
            t={t}
            theme={theme}
          />
        );
      case "AdminTreasureHunt":
        return (
          <AdminTreasureHuntScreen
            onBack={() => setActiveTab("AdminMenu")}
            t={t}
            theme={theme}
          />
        );

      case "Detail":
        if (!selectedProduct) return null;
        return (
          <ProductDetailScreen
            product={selectedProduct}
            onBack={() => setActiveTab(previousTab || "Home")}
            onAddToCart={addToCart}
            toggleWishlist={toggleWishlist}
            isWishlisted={wishlist.includes(selectedProduct?.id)}
            onSizeGuide={navigateToSizeGuide}
            onTryOnAI={() => setActiveTab("VirtualTryOn")}
            user={user}
            profileData={profileData}
            t={t}
            language={language}
            theme={theme}
          />
        );
      case "CampaignDetail":
        return (
          <CampaignDetailScreen
            campaign={selectedCampaign}
            onBack={() => setActiveTab("Home")}
            onProductPress={navigateToProduct}
            onCategoryPress={navigateToCategory}
            t={t}
          />
        );

      case "StoryCreate":
        return (
          <StoryCreateScreen
            user={user}
            media={activeTabParams?.media}
            onClose={() => setActiveTab("Messages")}
            onPublish={(story) => {
              // Optionally handle story publish callback
              setActiveTab("Messages");
            }}
            t={t}
            theme={theme}
          />
        );

      case "ReelsDetail":
        return (
          <StoryDetailScreen
            initialReel={activeTabParams?.initialReel}
            allReels={activeTabParams?.allReels}
            onClose={() => setActiveTab("Messages")}
            t={t}
            theme={theme}
            user={user}
          />
        );

      case "ShippingPolicy":
        return (
          <GenericPolicyScreen
            onBack={() => setActiveTab("Home")}
            t={t}
            titleKey="freeShipping"
            fieldKey="shippingPolicy"
            defaultText={t("shippingPolicyDefault")}
            Icon={Package}
          />
        );
      case "PaymentPolicy":
        return (
          <GenericPolicyScreen
            onBack={() => setActiveTab("Home")}
            t={t}
            titleKey="securePayment"
            fieldKey="paymentPolicy"
            defaultText={t("paymentPolicyDefault")}
            Icon={Shield}
          />
        );
      case "ReturnPolicy":
        return (
          <GenericPolicyScreen
            onBack={() => setActiveTab("Home")}
            t={t}
            titleKey="easyReturns"
            fieldKey="returnPolicy"
            defaultText={t("returnPolicyDefault")}
            Icon={RotateCcw}
          />
        );

      default:
        return (
          <HomeScreen
            user={user}
            profileData={profileData}
            onProductPress={navigateToProduct}
            onCategoryPress={navigateToCategory}
            onCampaignPress={navigateToCampaign}
            onNavigate={(screen: string) => setActiveTab(screen)}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            notifications={notifications}
            addToCart={(p: any) => setQuickAddProduct(p)}
            t={t}
            language={language}
            setFilterBrand={setFilterBrand}
            onJoinLive={handleJoinLive}
          />
        );
    }
  };
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeContext.Provider
        value={{ theme, colors: getAppColors(theme), setTheme }}
      >
        <SafeAreaProvider>
          <StatusBar
            barStyle={theme === "dark" ? "light-content" : "dark-content"}
          />
          {appState === "Onboarding" ? (
            <OnboardingScreen
              onFinish={() => setAppState("Auth")}
              t={t as any}
              language={language}
              setLanguage={setLanguage}
            />
          ) : appState === "Auth" ? (
            <AuthScreen
              isLogin={isLogin}
              toggleAuth={() => setIsLogin(!isLogin)}
              onComplete={() => setAppState("Main")}
              onViewTerms={() => setAppState("TermsOfService")}
              onViewPrivacy={() => setAppState("PrivacyPolicy")}
              t={t}
              language={language}
            />
          ) : appState === "SizeGuide" ? (
            <SizeGuideScreen
              onBack={handleBackToMain}
              t={t}
              theme={theme}
              language={language}
            />
          ) : appState === "VendorRegistration" ? (
            <VendorRegistrationScreen
              onBack={handleBackToMain}
              user={user}
              profileData={profileData}
              updateProfile={updateProfileData}
              theme={theme}
              t={t}
              language={language}
            />
          ) : appState === "PrivacyPolicy" ? (
            <PrivacyPolicyScreen
              onBack={() =>
                user
                  ? (setAppState("Main"), setActiveTab("Settings"))
                  : setAppState("Auth")
              }
              t={t}
              language={language}
            />
          ) : appState === "TermsOfService" ? (
            <TermsOfServiceScreen
              onBack={() =>
                user
                  ? (setAppState("Main"), setActiveTab("Settings"))
                  : setAppState("Auth")
              }
              t={t}
              language={language}
            />
          ) : (
            <View
              style={[
                styles.mainContainer,
                {
                  backgroundColor:
                    theme === "dark"
                      ? Theme.dark.colors.background
                      : Theme.light.colors.background,
                },
              ]}
            >
              {renderMainContent()}

              {/* USER BADGE MODAL */}
              <Modal
                visible={showBadge}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowBadge(false)}
              >
                <UserBadge
                  userProfile={{
                    id:
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.uid ||
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.id ||
                      "",
                    fullName:
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.fullName ||
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.displayName ||
                      "USER",
                    avatarUrl:
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.avatarUrl || "",
                    role:
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.role || "User",
                    wallet: (activeTab === "PublicProfile"
                      ? targetUserProfile
                      : profileData
                    )?.wallet,
                    bio:
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.bio || "",
                    followersCount:
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.followersCount ||
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.followers?.length ||
                      0,
                    followingCount:
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.followingCount ||
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.following?.length ||
                      0,
                    worksCount:
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.worksCount ||
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.works?.length ||
                      0,
                    friendsCount:
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.friendsCount ||
                      (activeTab === "PublicProfile"
                        ? targetUserProfile
                        : profileData
                      )?.friends?.length ||
                      0,
                  }}
                  isDark={theme === "dark"}
                  language={language}
                  onClose={() => setShowBadge(false)}
                  onVisitProfile={(uid: string) => {
                    setShowBadge(false);
                    setTargetUid(uid);
                    setPreviousTab(activeTab);
                    setActiveTab("PublicProfile");
                  }}
                  t={t}
                />
              </Modal>

              {/* QR SCANNER MODAL */}
              <Modal
                visible={showScanner}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setShowScanner(false)}
              >
                <QRScanner
                  onScan={handleScan}
                  onClose={() => setShowScanner(false)}
                  isDark={theme === "dark"}
                  t={t}
                />
              </Modal>

              {!activeTab.startsWith("Admin") &&
                activeTab !== "Detail" &&
                activeTab !== "CampaignDetail" &&
                activeTab !== "LiveStream" &&
                activeTab !== "Camera" &&
                activeTab !== "DirectMessage" &&
                activeTab !== "ProofOfDelivery" &&
                activeTab !== "ShipmentTracking" &&
                activeTab !== "ReelsDetail" &&
                activeTab !== "StoryCreate" &&
                activeTab !== "VendorRegistrationScreen" &&
                activeTab !== "TreasureHunt" &&
                activeTab !== "VirtualStylist" &&
                activeTab !== "SmartSizeRecommender" &&
                activeTab !== "AIHub" &&
                activeTab !== "VirtualTryOn" && (
                  <View style={[styles.tabBarWrapper, { zIndex: 1000 }]}>
                    <View
                      style={[
                        styles.glassTabBar,
                        theme === "dark" && {
                          backgroundColor: "rgba(20,20,25,0.8)",
                          borderColor: "#2F2F3D",
                        },
                      ]}
                    >
                      <BlurView
                        intensity={80}
                        style={StyleSheet.absoluteFill}
                        tint={theme}
                      />
                      <TouchableOpacity
                        onPress={() => setActiveTab("Home")}
                        style={styles.tabItem}
                      >
                        <Home
                          size={22}
                          color={
                            activeTab === "Home"
                              ? theme === "dark"
                                ? "#FFF"
                                : "#000"
                              : "#AEAEB2"
                          }
                          strokeWidth={activeTab === "Home" ? 2.5 : 2}
                        />
                        <Text
                          style={[
                            styles.tabLabel,
                            activeTab === "Home" && {
                              color: theme === "dark" ? "#FFF" : "#000",
                            },
                          ]}
                        >
                          {t("home")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setActiveTab("Feed")}
                        style={styles.tabItem}
                      >
                        <LayoutGrid
                          size={22}
                          color={
                            activeTab === "Feed"
                              ? theme === "dark"
                                ? "#FFF"
                                : "#000"
                              : "#AEAEB2"
                          }
                          strokeWidth={activeTab === "Feed" ? 2.5 : 2}
                        />
                        <Text
                          style={[
                            styles.tabLabel,
                            activeTab === "Feed" && {
                              color: theme === "dark" ? "#FFF" : "#000",
                            },
                          ]}
                        >
                          {t("feed")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setFilterCategory(null);
                          setActiveTab("Shop");
                        }}
                        style={styles.tabItem}
                      >
                        <Search
                          size={22}
                          color={
                            activeTab === "Shop"
                              ? theme === "dark"
                                ? "#FFF"
                                : "#000"
                              : "#AEAEB2"
                          }
                          strokeWidth={activeTab === "Shop" ? 2.5 : 2}
                        />
                        <Text
                          style={[
                            styles.tabLabel,
                            activeTab === "Shop" && {
                              color: theme === "dark" ? "#FFF" : "#000",
                            },
                          ]}
                        >
                          {t("shop")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setActiveTab("Collaboration")}
                        style={styles.tabItem}
                      >
                        <Handshake
                          size={22}
                          color={
                            activeTab === "Collaboration"
                              ? theme === "dark"
                                ? "#FFF"
                                : "#000"
                              : "#AEAEB2"
                          }
                          strokeWidth={activeTab === "Collaboration" ? 2.5 : 2}
                        />
                        <Text
                          style={[
                            styles.tabLabel,
                            activeTab === "Collaboration" && {
                              color: theme === "dark" ? "#FFF" : "#000",
                            },
                          ]}
                        >
                          {t("collab")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setActiveTab("Cart")}
                        style={styles.tabItem}
                      >
                        <View>
                          <ShoppingBag
                            size={22}
                            color={
                              activeTab === "Cart"
                                ? theme === "dark"
                                  ? "#FFF"
                                  : "#000"
                                : "#AEAEB2"
                            }
                            strokeWidth={activeTab === "Cart" ? 2.5 : 2}
                          />
                          {cart.length > 0 && (
                            <View style={styles.cartBadge}>
                              <Text style={styles.cartBadgeText}>
                                {cart.length}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.tabLabel,
                            activeTab === "Cart" && {
                              color: theme === "dark" ? "#FFF" : "#000",
                            },
                          ]}
                        >
                          {t("bag")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setActiveTab("Profile")}
                        style={styles.tabItem}
                      >
                        <View>
                          <User
                            size={22}
                            color={
                              activeTab === "Profile"
                                ? theme === "dark"
                                  ? "#FFF"
                                  : "#000"
                                : "#AEAEB2"
                            }
                            strokeWidth={activeTab === "Profile" ? 2.5 : 2}
                          />
                          {totalUnread + pendingRequestsCount > 0 && (
                            <View
                              style={[
                                styles.cartBadge,
                                { backgroundColor: "#EF4444" },
                              ]}
                            >
                              <Text style={styles.cartBadgeText}>
                                {totalUnread + pendingRequestsCount > 99
                                  ? "99+"
                                  : totalUnread + pendingRequestsCount}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.tabLabel,
                            activeTab === "Profile" && {
                              color: theme === "dark" ? "#FFF" : "#000",
                            },
                          ]}
                        >
                          {t("me")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

              {/* GLOBAL COMMENTS BOTTOM SHEET */}
              <Modal
                visible={isCommentSheetVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setIsCommentSheetVisible(false)}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    justifyContent: "flex-end",
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setIsCommentSheetVisible(false)}
                    style={{ flex: 1 }}
                  />
                  <Animatable.View
                    animation="slideInUp"
                    duration={300}
                    style={{
                      height: height * 0.75,
                      backgroundColor: Theme[theme].colors.background,
                      borderTopLeftRadius: 30,
                      borderTopRightRadius: 30,
                      overflow: "hidden",
                    }}
                  >
                    <KeyboardAvoidingView
                      behavior={Platform.OS === "ios" ? "padding" : undefined}
                      style={{ flex: 1 }}
                    >
                      <CommentsSectionComponent
                        selectedWork={selectedWork}
                        comments={comments}
                        loadingComments={loadingComments}
                        commentText={commentText}
                        setCommentText={setCommentText}
                        handleComment={handleComment}
                        handleCommentReact={handleCommentReact}
                        handleDeleteComment={handleDeleteComment}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        editingComment={editingComment}
                        setEditingComment={setEditingComment}
                        expandedReplies={expandedReplies}
                        setExpandedReplies={setExpandedReplies}
                        onClose={() => setIsCommentSheetVisible(false)}
                        colors={Theme[theme].colors}
                        theme={theme}
                        tr={tr}
                        user={user}
                        isPostOwner={selectedWork?.userId === user?.uid}
                        getInitials={getInitials}
                      />
                    </KeyboardAvoidingView>
                  </Animatable.View>
                </View>
              </Modal>

              <QuickAddModal
                isVisible={!!quickAddProduct}
                product={quickAddProduct}
                onClose={() => setQuickAddProduct(null)}
                onAddToCart={addToCart}
                onSizeGuide={navigateToSizeGuide}
                t={t}
              />

              <Modal
                visible={trackingModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setTrackingModalVisible(false)}
              >
                <BlurView
                  intensity={theme === "dark" ? 40 : 20}
                  tint={theme}
                  style={StyleSheet.absoluteFill}
                >
                  <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1, justifyContent: "center", padding: 20 }}
                  >
                    <Animatable.View
                      animation="zoomIn"
                      duration={300}
                      style={{
                        backgroundColor: Colors.surface,
                        borderRadius: 30,
                        padding: 24,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.2,
                        shadowRadius: 20,
                        elevation: 5,
                      }}
                    >
                      <View style={{ marginBottom: 20, alignItems: "center" }}>
                        <View
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            backgroundColor: Colors.accent + "20",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 12,
                          }}
                        >
                          <Truck size={30} color={Colors.accent} />
                        </View>
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "900",
                            color: Colors.foreground,
                          }}
                        >
                          {t("shipmentTracking")}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: Colors.textMuted,
                            textAlign: "center",
                            marginTop: 4,
                          }}
                        >
                          {t("enterTrackingId")}
                        </Text>
                      </View>

                      <TextInput
                        style={{
                          backgroundColor: Colors.surface,
                          borderRadius: 15,
                          padding: 18,
                          color: Colors.foreground,
                          fontSize: 16,
                          fontWeight: "700",
                          textAlign: "center",
                          borderWidth: 1,
                          borderColor: trackingInput
                            ? Colors.accent
                            : Colors.border,
                        }}
                        placeholder="BEY3A-XXXXXXXX"
                        placeholderTextColor={Colors.textMuted}
                        value={trackingInput}
                        onChangeText={setTrackingInput}
                        autoCapitalize="characters"
                        autoCorrect={false}
                      />

                      <View
                        style={{ flexDirection: "row", gap: 12, marginTop: 24 }}
                      >
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            height: 54,
                            borderRadius: 18,
                            backgroundColor: Colors.surface,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onPress={() => {
                            setTrackingModalVisible(false);
                            setTrackingInput("");
                          }}
                        >
                          <Text
                            style={{
                              color: Colors.foreground,
                              fontWeight: "800",
                            }}
                          >
                            {t("cancel")}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            flex: 2,
                            height: 54,
                            borderRadius: 18,
                            backgroundColor:
                              trackingInput.length >= 6
                                ? Colors.accent
                                : Colors.surface,
                            borderWidth: 1,
                            borderColor:
                              trackingInput.length >= 6
                                ? "transparent"
                                : Colors.border,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          disabled={trackingInput.length < 6}
                          onPress={() => {
                            const id = trackingInput.trim().toUpperCase();
                            if (id) {
                              setActiveTrackingId(id);
                              setTrackingModalVisible(false);
                              setTrackingInput("");
                              setActiveTab("ShipmentTracking");
                            }
                          }}
                        >
                          <Text
                            style={{
                              color:
                                trackingInput.length >= 6
                                  ? Colors.accentForeground
                                  : Colors.textMuted,
                              fontWeight: "900",
                            }}
                          >
                            {t("track").toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </Animatable.View>
                  </KeyboardAvoidingView>
                </BlurView>
              </Modal>
            </View>
          )}
        </SafeAreaProvider>
      </ThemeContext.Provider>
    </GestureHandlerRootView>
  );
}

// --- COMPONENTS ---

// --- REUSABLE COMMENTS COMPONENT ---
function CommentsSectionComponent({
  selectedWork,
  comments,
  loadingComments,
  commentText,
  setCommentText,
  handleComment,
  handleCommentReact,
  handleDeleteComment,
  replyingTo,
  setReplyingTo,
  editingComment,
  setEditingComment,
  expandedReplies,
  setExpandedReplies,
  onClose,
  colors,
  theme,
  tr,
  user,
  isPostOwner,
  getInitials,
}: any) {
  const insets = useSafeAreaInsets();

  const renderComment = (item: any, isReply = false) => (
    <View
      key={item.id}
      style={{ marginBottom: isReply ? 12 : 16, flexDirection: "row", gap: 12 }}
    >
      <View
        style={{
          width: isReply ? 28 : 36,
          height: isReply ? 28 : 36,
          borderRadius: isReply ? 14 : 18,
          backgroundColor:
            colors.surface || (theme === "dark" ? "#1A1A24" : "#F2F2F7"),
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor:
            theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        }}
      >
        {item.userAvatar ? (
          <Image
            source={{ uri: item.userAvatar }}
            style={{
              width: isReply ? 28 : 36,
              height: isReply ? 28 : 36,
              borderRadius: isReply ? 14 : 18,
            }}
          />
        ) : (
          <Text
            style={{
              color: colors.foreground,
              fontSize: isReply ? 10 : 12,
              fontWeight: "900",
            }}
          >
            {getInitials(item.userName)}
          </Text>
        )}
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor:
            colors.surface || (theme === "dark" ? "#1A1A24" : "#F2F2F7"),
          padding: 10,
          borderRadius: 15,
          borderWidth: 1,
          borderColor:
            theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.foreground,
                fontWeight: "800",
                fontSize: 13,
              }}
            >
              {item.userName}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {(() => {
              const isCommentAuthor = item.userId === user?.uid;
              if (isCommentAuthor || isPostOwner) {
                return (
                  <TouchableOpacity
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={{
                      padding: 4,
                      borderRadius: 12,
                      backgroundColor:
                        theme === "dark"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.04)",
                      marginRight: -4,
                    }}
                    onPress={() => {
                      const options: any[] = [
                        {
                          text: tr("Annuler", "إلغاء", "Cancel"),
                          style: "cancel",
                        },
                      ];
                      if (isCommentAuthor) {
                        options.push({
                          text: tr("Modifier", "تعديل", "Edit"),
                          onPress: () => {
                            setEditingComment(item);
                            setCommentText(item.text);
                          },
                        });
                      }
                      options.push({
                        text: tr("Supprimer", "حذف", "Delete"),
                        style: "destructive",
                        onPress: () => handleDeleteComment(item.id),
                      });
                      Alert.alert(
                        tr("Options", "خيارات", "Options"),
                        "",
                        options,
                      );
                    }}
                  >
                    <MoreVertical
                      size={18}
                      color={colors.foreground}
                      style={{ opacity: 0.9 }}
                    />
                  </TouchableOpacity>
                );
              }
              return null;
            })()}
          </View>
        </View>
        <Text
          style={{
            color: colors.foreground,
            fontSize: 13,
            marginTop: 4,
            lineHeight: 18,
          }}
        >
          {item.text}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setReplyingTo(item);
              setCommentText(`@${item.userName} `);
            }}
          >
            <Text style={{ color: "#A855F7", fontSize: 11, fontWeight: "900" }}>
              {tr("Répondre", "رد", "Reply")}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            {[
              { type: "love", Icon: Heart, color: "#FF4D67" },
              { type: "fire", Icon: Flame, color: "#FF8A00" },
              { type: "haha", Icon: Laugh, color: "#FFD600" },
              { type: "bad", Icon: ThumbsDown, color: "#94A3B8" },
              { type: "ugly", Icon: Ghost, color: "#818CF8" },
              { type: "interesting", Icon: Sparkles, color: "#A855F7" },
            ].map((reac) => {
              const isSelected = item.userReactions?.[user?.uid] === reac.type;
              const count = item.reactions?.[reac.type] || 0;
              return (
                <TouchableOpacity
                  key={reac.type}
                  onPress={() => handleCommentReact(item, reac.type)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
                >
                  <reac.Icon
                    size={14}
                    color={
                      isSelected
                        ? reac.color
                        : theme === "dark"
                          ? "rgba(255,255,255,0.7)"
                          : "rgba(0,0,0,0.3)"
                    }
                    fill="transparent"
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  {count > 0 && (
                    <Text
                      style={{
                        color: isSelected ? reac.color : colors.secondary,
                        fontSize: 10,
                        fontWeight: "800",
                      }}
                    >
                      {count}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor:
            theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MessageSquare size={18} color={colors.foreground} />
          <Text
            style={{
              color: colors.foreground,
              fontWeight: "800",
              fontSize: 15,
            }}
          >
            {tr("Commentaires", "تعليقات", "Comments")} ({comments.length})
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <X size={20} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 80,
        }}
      >
        {loadingComments ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
        ) : comments.length === 0 || !comments ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <MessageSquare
              size={40}
              color={colors.foreground}
              style={{ opacity: 0.2, marginBottom: 12 }}
            />
            <Text
              style={{
                color: colors.foreground,
                textAlign: "center",
                fontSize: 13,
                opacity: 0.6,
                fontWeight: "800",
              }}
            >
              {tr(
                "Soyez le premier à commenter",
                "كن أول من يعلق",
                "Be the first to comment",
              )}
            </Text>
          </View>
        ) : (
          (() => {
            // Very inclusive filter to ensure all comments show up
            const topLevelComments = comments.filter(
              (c: any) =>
                !c.parentCommentId ||
                c.parentCommentId === "root" ||
                c.parentCommentId === "" ||
                !comments.find((pc: any) => pc.id === c.parentCommentId),
            );
            const displayComments =
              topLevelComments.length > 0 ? topLevelComments : comments;

            return displayComments.map((comment: any) => {
              const replies = comments.filter(
                (r: any) => r.parentCommentId === comment.id,
              );
              const isExpanded = expandedReplies.includes(comment.id);

              return (
                <View key={comment.id}>
                  {renderComment(comment)}
                  {replies.length > 0 && (
                    <View style={{ marginLeft: 48, marginBottom: 12 }}>
                      <TouchableOpacity
                        onPress={() =>
                          setExpandedReplies((prev: any) =>
                            prev.includes(comment.id)
                              ? prev.filter((id: string) => id !== comment.id)
                              : [...prev, comment.id],
                          )
                        }
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          paddingVertical: 4,
                        }}
                      >
                        <View
                          style={{
                            height: 1,
                            width: 20,
                            backgroundColor: colors.foreground,
                            opacity: 0.2,
                          }}
                        />
                        <Text
                          style={{
                            color: colors.foreground,
                            fontSize: 11,
                            fontWeight: "900",
                            opacity: 0.7,
                          }}
                        >
                          {isExpanded
                            ? tr(
                                "Masquer les réponses",
                                "إخفاء الردود",
                                "Hide replies",
                              )
                            : `${tr("Voir", "عرض", "View")} ${replies.length} ${tr("réponses", "ردود", "replies")}`}
                        </Text>
                      </TouchableOpacity>
                      {isExpanded &&
                        replies.map((reply: any) => renderComment(reply, true))}
                    </View>
                  )}
                </View>
              );
            });
          })()
        )}
      </ScrollView>

      {/* Input Section */}
      <View
        style={{
          paddingBottom: insets.bottom + 10,
          paddingTop: 10,
          paddingHorizontal: 16,
          borderTopWidth: 1,
          borderTopColor:
            theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          backgroundColor: colors.background,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              flex: 1,
              backgroundColor:
                theme === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              borderRadius: 25,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TextInput
              placeholder={
                replyingTo
                  ? `${tr("Répondre à", "الرد على", "Replying to")} ${replyingTo.userName}...`
                  : tr(
                      "Ajouter un commentaire...",
                      "أضف تعليقًا...",
                      "Add a comment...",
                    )
              }
              placeholderTextColor={
                theme === "dark" ? "rgba(255,255,255,0.3)" : "#9CA3AF"
              }
              style={{
                flex: 1,
                color: colors.foreground,
                fontSize: 14,
                fontWeight: "600",
                padding: 0,
              }}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
          </View>
          <TouchableOpacity
            onPress={handleComment}
            disabled={!commentText.trim()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: commentText.trim()
                ? colors.accent
                : theme === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send
              size={18}
              color={
                commentText.trim()
                  ? "#FFFFFF"
                  : theme === "dark"
                    ? "rgba(255,255,255,0.4)"
                    : "#9CA3AF"
              }
            />
          </TouchableOpacity>
        </View>
        {editingComment && (
          <TouchableOpacity
            onPress={() => {
              setEditingComment(null);
              setCommentText("");
            }}
            style={{ marginTop: 8, paddingLeft: 12 }}
          >
            <Text
              style={{ color: colors.accent, fontSize: 11, fontWeight: "700" }}
            >
              {tr("Annuler modification", "إلغاء التعديل", "Cancel edit")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function ProfileScreen({
  user,
  onBack,
  onLogout,
  profileData,
  currentUserProfileData,
  updateProfile,
  onNavigate,
  socialLinks,
  t,
  language,
  setLanguage,
  theme,
  setTheme,
  followedCollabs,
  toggleFollowCollab,
  setSelectedCollab,
  setActiveTab,
  setPreviousTab,
  onStartLive,
  targetUid: targetUidProp,
  isPublicProfile,
  onShowBadge,
  onShowScanner,
  setActiveTrackingId,
  setTrackingModalVisible,
  onBecomeVendor,
  onAddFriend,
  selectedChatUser: externalSelectedChatUser,
  setSelectedChatUser: externalSetSelectedChatUser,
}: any) {
  const { colors } = useAppTheme();
  const accent = "#6C63FF"; // App's primary accent color
  const insets = useSafeAreaInsets();

  const isOwnProfile =
    !isPublicProfile &&
    (user?.uid === profileData?.uid ||
      user?.uid === profileData?.id ||
      (profileData?.email && user?.email === profileData?.email));

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const displayName =
    profileData?.fullName || profileData?.displayName || "USER";
  const scrollY = useRef(new Animated.Value(0)).current;

  const tr = (fr: string, ar: string, en: string) => {
    return language === "ar" ? ar : language === "fr" ? fr : en;
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const [brandStats, setBrandStats] = useState({
    revenue: 0,
    orders: 0,
    completed: 0,
  });
  const [brandInfo, setBrandInfo] = useState<any>(null);
  const [isStatsVisible, setIsStatsVisible] = useState(false);
  const [followedList, setFollowedList] = useState<any[]>([]);
  const [showEmail, setShowEmail] = useState(false);
  const [liveChannels, setLiveChannels] = useState<string[]>([]);
  const [profileTab, setProfileTab] = useState(isOwnProfile ? "Menu" : "Works"); // Default to 'Works' for other users

  useEffect(() => {
    // Reset tab when switching between profiles
    setProfileTab(isOwnProfile ? "Menu" : "Works");
  }, [isOwnProfile, profileData?.uid, profileData?.id]);
  const [works, setWorks] = useState<any[]>([]);
  const [uploadingWork, setUploadingWork] = useState(false);
  const [selectedWork, setSelectedWork] = useState<any>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingComment, setEditingComment] = useState<any>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const profileScrollRef = useRef<any>(null);

  // Quick Wallet States
  const [showQuickExchange, setShowQuickExchange] = useState(false);
  const [exchangeType, setExchangeType] = useState<
    "diamondsToCoins" | "coinsToDiamonds"
  >("diamondsToCoins");
  const [exchangeAmount, setExchangeAmount] = useState("");
  const [isProcessingExchange, setIsProcessingExchange] = useState(false);
  const [transferSearchQuery, setTransferSearchQuery] = useState("");
  const [transferSearchResults, setTransferSearchResults] = useState<any[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedTransferUser, setSelectedTransferUser] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [showStoreQRModal, setShowStoreQRModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [storeDiscountValue, setStoreDiscountValue] = useState("10");
  const [updatingDiscount, setUpdatingDiscount] = useState(false);

  const onOpenStoreQRModal = async () => {
    setShowStoreQRModal(true);
    const brandId = profileData?.brandId;
    if (brandId) {
      try {
        const brandDoc = await getDoc(doc(db, "brands", brandId));
        if (brandDoc.exists()) {
          const data = brandDoc.data();
          if (data.inStorePromotion?.value) {
            setStoreDiscountValue(String(data.inStorePromotion.value));
          }
        }
      } catch (err) {
        console.log("Error fetching brand discount:", err);
      }
    }
  };

  const handleUpdateDiscount = async () => {
    const brandId = profileData?.brandId;
    if (!brandId) {
      Alert.alert(t("error"), "No brand ID found for your account");
      return;
    }

    setUpdatingDiscount(true);
    try {
      await updateDoc(doc(db, "brands", brandId), {
        inStorePromotion: {
          type: "percentage",
          value: parseInt(storeDiscountValue) || 10,
          points: 50,
        },
      });
      setEditingDiscount(false);
      Alert.alert(t("success"), t("settingsSaved"));
    } catch (error) {
      console.error("Error updating discount:", error);
      Alert.alert(t("error"), "Failed to update discount");
    } finally {
      setUpdatingDiscount(false);
    }
  };

  const handleConfirmQuickExchange = async () => {
    const amount = parseInt(exchangeAmount);
    if (!amount || amount <= 0) {
      Alert.alert(
        t("error"),
        tr(
          "Veuillez entrer un montant valide",
          "يرجى إدخال مبلغ صحيح",
          "Please enter a valid amount",
        ),
      );
      return;
    }
    if (!user?.uid) return;
    setIsProcessingExchange(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User does not exist!";
        const data = userDoc.data();
        const wallet = data.wallet || { coins: 0, diamonds: 0 };
        if (exchangeType === "diamondsToCoins") {
          if ((wallet.diamonds || 0) < amount)
            throw tr(
              "Diamants insuffisants",
              "الألماس غير كافٍ",
              "Insufficient diamonds",
            );
          transaction.update(userRef, {
            "wallet.diamonds": increment(-amount),
            "wallet.coins": increment(amount),
          });
        } else {
          const totalRequired = Math.ceil(amount * 1.3);
          if ((wallet.coins || 0) < totalRequired)
            throw tr(
              "Pièces insuffisantes",
              "العملات غير كافية",
              "Insufficient coins",
            );
          transaction.update(userRef, {
            "wallet.coins": increment(-totalRequired),
            "wallet.diamonds": increment(amount),
          });
        }
        const transactionRef = doc(
          collection(db, "users", user.uid, "transactions"),
        );
        transaction.set(transactionRef, {
          type: "exchange",
          exchangeType,
          amount,
          description:
            exchangeType === "diamondsToCoins"
              ? "Diamonds to Coins"
              : "Coins to Diamonds",
          timestamp: serverTimestamp(),
          status: "completed",
        });
      });
      Alert.alert(
        t("successTitle"),
        tr("Échange réussi !", "تم التبادل بنجاح!", "Exchange successful!"),
      );

      // Notify User
      try {
        await addDoc(collection(db, "notifications"), {
          userId: user.uid,
          title: t("notifWalletUpdateTitle") || "Wallet Update",
          body:
            t("notifWalletUpdateBody")?.replace(
              "{{change}}",
              exchangeType === "diamondsToCoins"
                ? `+${amount} coins / -${amount} diamonds`
                : `+${amount} diamonds`,
            ) || "Your balance has been modified",
          read: false,
          createdAt: serverTimestamp(),
          type: "wallet",
        });
      } catch (err) {
        console.error("Wallet notification error:", err);
      }

      setShowQuickExchange(false);
      setExchangeAmount("");
    } catch (err: any) {
      Alert.alert(t("error"), err.toString());
    } finally {
      setIsProcessingExchange(false);
    }
  };

  const handleSearchUsers = async (q: string) => {
    setTransferSearchQuery(q);
    if (q.length < 3) {
      setTransferSearchResults([]);
      return;
    }
    setIsSearchingUsers(true);
    try {
      const usersRef = collection(db, "users");
      const qSnap = await getDocs(
        query(
          usersRef,
          where("fullName", ">=", q),
          where("fullName", "<=", q + "\uf8ff"),
          limit(20),
        ),
      );
      setTransferSearchResults(
        qSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.id !== user?.uid),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleQuickTransfer = async () => {
    const amount = parseInt(transferAmount);
    if (!amount || amount <= 0 || !selectedTransferUser) return;
    setIsProcessingExchange(true);
    try {
      const senderRef = doc(db, "users", user.uid);
      const receiverRef = doc(db, "users", selectedTransferUser.id);
      await runTransaction(db, async (transaction) => {
        const senderDoc = await transaction.get(senderRef);
        if ((senderDoc.data()?.wallet?.diamonds || 0) < amount)
          throw "Insufficient diamonds";
        transaction.update(senderRef, {
          "wallet.diamonds": increment(-amount),
        });
        transaction.update(receiverRef, {
          "wallet.diamonds": increment(amount),
        });
        const sTrans = doc(collection(db, "users", user.uid, "transactions"));
        transaction.set(sTrans, {
          type: "transfer_out",
          recipientId: selectedTransferUser.id,
          recipientName: selectedTransferUser.fullName,
          amount,
          timestamp: serverTimestamp(),
          status: "completed",
        });
        const rTrans = doc(
          collection(db, "users", selectedTransferUser.id, "transactions"),
        );
        transaction.set(rTrans, {
          type: "transfer_in",
          senderId: user.uid,
          senderName: currentUserProfileData?.fullName || user.displayName,
          amount,
          timestamp: serverTimestamp(),
          status: "completed",
        });
      });
      Alert.alert("Success", "Transfer completed");

      // Notify Sender
      try {
        await addDoc(collection(db, "notifications"), {
          userId: user.uid,
          title: t("notifWalletUpdateTitle") || "Wallet Update",
          body:
            t("notifWalletUpdateBody")?.replace(
              "{{change}}",
              `-${amount} diamonds sent to ${selectedTransferUser.fullName}`,
            ) || `Sent transfer to ${selectedTransferUser.fullName}`,
          read: false,
          createdAt: serverTimestamp(),
          type: "wallet",
        });

        // Notify Receiver
        await addDoc(collection(db, "notifications"), {
          userId: selectedTransferUser.id,
          title: "Transfer Received",
          body: `You received ${amount} diamonds from ${currentUserProfileData?.fullName || user.displayName}`,
          read: false,
          createdAt: serverTimestamp(),
          type: "wallet",
        });
      } catch (err) {
        console.error("Transfer notification error:", err);
      }

      setShowTransferModal(false);
      setSelectedTransferUser(null);
      setTransferAmount("");
    } catch (e: any) {
      Alert.alert("Error", e.toString());
    } finally {
      setIsProcessingExchange(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "direct_chats"),
      where("participants", "array-contains", user.uid),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach((doc) => {
        count += doc.data()[`unreadCount_${user.uid}`] || 0;
      });
      setTotalUnread(count);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleReact = async (work: any, type: string) => {
    if (!user) {
      Alert.alert(t("loginRequired"), t("pleaseLoginToReact"));
      return;
    }

    const {
      id: workId,
      userId: authorId,
      userReactions = {},
      reactions = {},
    } = work;
    const currentReaction = userReactions[user.uid];

    // Optimistic Update Data
    let newReactions = { ...reactions };
    let newUserReactions = { ...userReactions };

    if (currentReaction === type) {
      // Toggle OFF (Remove)
      delete newUserReactions[user.uid];
      newReactions[type] = Math.max(0, (newReactions[type] || 0) - 1);
    } else {
      // Switch or Add
      if (currentReaction) {
        newReactions[currentReaction] = Math.max(
          0,
          (newReactions[currentReaction] || 0) - 1,
        );
      }
      newReactions[type] = (newReactions[type] || 0) + 1;
      newUserReactions[user.uid] = type;
    }

    // Create updated work object
    const updatedWork = {
      ...work,
      reactions: newReactions,
      userReactions: newUserReactions,
      // Recalculate score if needed, but not strictly required for view
    };

    // Update States
    if (selectedWork?.id === workId) {
      setSelectedWork(updatedWork);
    }

    // Update 'works' list if present locally
    setWorks((prev) => prev.map((w) => (w.id === workId ? updatedWork : w)));

    // Firestore Update
    try {
      const workRef = work.fullPath
        ? doc(db, work.fullPath)
        : doc(db, "users", authorId, "works", workId);
      const updates: any = {};
      if (currentReaction === type) {
        updates[`reactions.${type}`] = increment(-1);
        updates[`userReactions.${user.uid}`] = deleteField();
      } else {
        updates[`reactions.${type}`] = increment(1);
        updates[`userReactions.${user.uid}`] = type;
        if (currentReaction)
          updates[`reactions.${currentReaction}`] = increment(-1);
      }
      await updateDoc(workRef, updates);
    } catch (e) {
      console.error("Reaction Failed", e);
      // Could revert here if needed
    }
  };
  const handleCommentReact = async (comment: any, type: string = "love") => {
    if (!user || !selectedWork) return;
    const effectiveTargetUid =
      selectedWork.userId ||
      targetUidProp ||
      profileData?.uid ||
      profileData?.id ||
      (isOwnProfile ? user?.uid : null);
    if (!effectiveTargetUid) return;

    const commentRef = doc(
      db,
      "users",
      effectiveTargetUid,
      "works",
      selectedWork.id,
      "comments",
      comment.id,
    );

    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(commentRef);
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        const currentReactions = data.reactions || {};
        const userReactions = data.userReactions || {};

        const prevType = userReactions[user.uid];

        if (prevType === type) {
          delete userReactions[user.uid];
          currentReactions[type] = Math.max(
            0,
            (currentReactions[type] || 0) - 1,
          );
        } else {
          if (prevType) {
            currentReactions[prevType] = Math.max(
              0,
              (currentReactions[prevType] || 0) - 1,
            );
          }
          userReactions[user.uid] = type;
          currentReactions[type] = (currentReactions[type] || 0) + 1;
        }

        transaction.update(commentRef, {
          reactions: currentReactions,
          userReactions: userReactions,
        });
      });
    } catch (e) {
      console.error("Comment Reaction Error", e);
    }
  };

  useEffect(() => {
    if (selectedWork) {
      const ownerUid =
        selectedWork.userId ||
        selectedWork.ownerUid ||
        targetUidProp ||
        profileData?.uid ||
        profileData?.id ||
        (isOwnProfile ? user?.uid : null);
      if (!ownerUid) return;

      setLoadingComments(true);
      const q = query(
        collection(db, "users", ownerUid, "works", selectedWork.id, "comments"),
        orderBy("createdAt", "asc"),
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setComments(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
        setLoadingComments(false);
      });

      return () => unsubscribe();
    }
  }, [
    selectedWork,
    targetUidProp,
    profileData?.uid,
    profileData?.id,
    isOwnProfile,
    user?.uid,
  ]);

  useEffect(() => {
    if (!user?.uid || !isOwnProfile) return;
    const q = query(
      collection(db, "users", user.uid, "friendRequests"),
      where("status", "==", "pending"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFriendRequestCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [user?.uid, isOwnProfile]);

  const handleComment = async () => {
    if (!user || !commentText.trim() || !selectedWork) return;

    const effectiveTargetUid =
      selectedWork.userId ||
      targetUidProp ||
      profileData?.uid ||
      profileData?.id ||
      (isOwnProfile ? user?.uid : null);
    if (!effectiveTargetUid) return;

    const commentData = {
      text: commentText.trim(),
      userId: user.uid,
      userName: currentUserProfileData?.fullName || user.displayName || "User",
      userAvatar: currentUserProfileData?.avatarUrl || null,
      createdAt: serverTimestamp(),
      replyToId: replyingTo?.id || null,
      replyToUser: replyingTo?.userName || null,
      parentCommentId: replyingTo
        ? replyingTo.parentCommentId || replyingTo.id
        : null,
      reactions: {},
      userReactions: {},
    };

    try {
      if (editingComment) {
        await updateDoc(
          doc(
            db,
            "users",
            effectiveTargetUid,
            "works",
            selectedWork.id,
            "comments",
            editingComment.id,
          ),
          {
            text: commentText.trim(),
            updatedAt: serverTimestamp(),
          },
        );
      } else {
        await addDoc(
          collection(
            db,
            "users",
            effectiveTargetUid,
            "works",
            selectedWork.id,
            "comments",
          ),
          commentData,
        );
        await updateDoc(
          doc(db, "users", effectiveTargetUid, "works", selectedWork.id),
          {
            commentsCount: increment(1),
          },
        );
      }
      setCommentText("");
      setReplyingTo(null);
      setEditingComment(null);
    } catch (e) {
      console.error("Comment Error", e);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedWork) return;
    const effectiveTargetUid =
      selectedWork.userId ||
      targetUidProp ||
      profileData?.uid ||
      profileData?.id ||
      (isOwnProfile ? user?.uid : null);
    if (!effectiveTargetUid) return;

    try {
      await deleteDoc(
        doc(
          db,
          "users",
          effectiveTargetUid,
          "works",
          selectedWork.id,
          "comments",
          commentId,
        ),
      );
      await updateDoc(
        doc(db, "users", effectiveTargetUid, "works", selectedWork.id),
        {
          commentsCount: increment(-1),
        },
      );
    } catch (e) {
      console.error("Delete Comment Error", e);
    }
  };

  const handleRepost = async (work: any) => {
    if (!user) return;
    Alert.alert(
      tr("Republier", "إعادة نشر", "Repost"),
      tr(
        "Voulez-vous republier ce travail sur votre profil ?",
        "هل تريد إعادة نشر هذا العمل على ملفك الشخصي؟",
        "Do you want to repost this work to your profile?",
      ),
      [
        { text: tr("Annuler", "إلغاء", "Cancel"), style: "cancel" },
        {
          text: tr("Republier", "إعادة نشر", "Repost"),
          onPress: async () => {
            try {
              await addDoc(collection(db, "users", user.uid, "works"), {
                ...work,
                repostedFrom: profileData?.uid || profileData?.id || user.uid,
                repostedFromName: profileData?.fullName || "User",
                createdAt: serverTimestamp(),
                reactions: {},
                userReactions: {},
                commentsCount: 0,
              });
              Alert.alert(
                t("successTitle"),
                tr(
                  "Republié avec succès",
                  "تمت إعادة النشر بنجاح",
                  "Reposted successfully",
                ),
              );
            } catch (e) {
              console.error("Repost Error", e);
            }
          },
        },
      ],
    );
  };

  const handleShare = async (work: any) => {
    try {
      const url = work.url || work.imageUrl || work.mediaUrl;
      if (!url) return;

      // Download file first to share "cleanly"
      const extension = url.split(".").pop()?.split("?")[0] || "jpg";
      const fileUri =
        FileSystem.cacheDirectory + `share_${work.id}.${extension}`;

      const { uri } = await FileSystem.downloadAsync(url, fileUri);

      await Share.share({
        message: `${work.text || "Check this out!"} \nShared via Bey3a App`,
        url: uri, // Sharing local URI shares the file
      });
    } catch (e) {
      console.error("Share Error", e);
      // Fallback to URL sharing
      await Share.share({
        message: `Check out this work on Bey3a! ${work.url}`,
        url: work.url,
      });
    }
  };

  const handleDownload = async (work: any) => {
    if (!work) return;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("permissionRefused"), t("camerarollPermissionRequired"));
      return;
    }

    try {
      const url = work.url || work.imageUrl || work.mediaUrl;
      const fileUri =
        FileSystem.cacheDirectory +
        (work.type === "video" ? "download.mp4" : "download.jpg");
      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("Bey3a", asset, false);
      Alert.alert(
        t("successTitle"),
        tr(
          "Enregistré dans la galerie",
          "تم الحفظ في المعرض",
          "Saved to gallery",
        ),
      );
    } catch (e) {
      console.error("Download Error", e);
      Alert.alert(
        t("error"),
        tr("Échec du téléchargement", "فشل التحميل", "Download failed"),
      );
    }
  };

  const getTotalStats = (work: any) => {
    if (!work) return 0;
    const totalReactions = work.reactions
      ? Object.values(work.reactions).reduce((a: any, b: any) => a + b, 0)
      : 0;
    const commentsCount = work.commentsCount || 0;
    return (totalReactions as number) + commentsCount;
  };

  const isViral = (work: any) => {
    if (!work) return false;
    return getTotalStats(work) >= 100;
  };

  const isBrandOwner =
    profileData?.role === "brand_owner" ||
    (profileData?.role === "admin" && profileData?.brandId) ||
    (profileData?.role === "vendor" &&
      ["approved", "active"].includes(profileData?.vendorData?.status));

  useEffect(() => {
    if (isBrandOwner && profileData?.brandId) {
      fetchBrandStats();
      fetchBrandInfo();
    }
  }, [profileData]);

  useEffect(() => {
    // Use profileData for works, or fallback to targetUidProp, or user's own uid for own profile
    const effectiveTargetUid =
      profileData?.uid ||
      profileData?.id ||
      targetUidProp ||
      (isOwnProfile ? user?.uid : null);
    if (!effectiveTargetUid) return;

    const q = query(
      collection(db, "users", effectiveTargetUid, "works"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const rawWorks = snap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
          userId: effectiveTargetUid,
        }));
        const uniqueWorks = rawWorks.filter(
          (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
        );
        setWorks(uniqueWorks);
      },
      (err) => {
        console.error("Error listening to works", err);
      },
    );

    return () => unsubscribe();
  }, [profileData, isOwnProfile, user?.uid, targetUidProp]);

  useEffect(() => {
    if (selectedWork) {
      const updated = works.find((w) => w.id === selectedWork.id);
      if (updated) setSelectedWork(updated);
    }
  }, [works, selectedWork]);

  const getTotalReactions = (work: any) => {
    if (!work.reactions) return 0;
    return Object.values(work.reactions).reduce((a: any, b: any) => a + b, 0);
  };

  const handleUploadWork = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadingWork(true);
        const asset = result.assets[0];
        const isVid = asset.type === "video";
        const url = await uploadImageToCloudinary(asset.uri);

        await addDoc(collection(db, "users", user.uid, "works"), {
          type: isVid ? "video" : "image",
          url,
          createdAt: serverTimestamp(),
          commentsCount: 0,
          reactions: {},
          userReactions: {},
        });

        Alert.alert(
          tr("SUCCÈS", "نجاح", "SUCCESS"),
          tr(
            "Téléchargement réussi !",
            "تم التحميل بنجاح!",
            "Upload completed successfully!",
          ),
        );
      }
    } catch (e) {
      console.error("Upload Error", e);
      Alert.alert(t("error"), t("uploadFailed") || "Upload failed");
    } finally {
      setUploadingWork(false);
    }
  };

  useEffect(() => {
    fetchFollowedCollabs();

    // Subscribe to live sessions
    const { LiveSessionService } = require("./src/services/LiveSessionService");
    const unsubscribe = LiveSessionService.subscribeToAllSessions(
      (sessions: any[]) => {
        const active = sessions.filter((s: any) => s.status === "live");
        const liveIds = active
          .flatMap((s: any) => [s.brandId, s.collabId, s.channelId])
          .filter(Boolean);
        setLiveChannels(liveIds);
      },
    );

    return () => unsubscribe();
  }, [followedCollabs]);

  const fetchFollowedCollabs = async () => {
    if (!followedCollabs || followedCollabs.length === 0) {
      setFollowedList([]);
      return;
    }
    try {
      // Chunking for Firestore 'in' query if needed, but assuming small list for now
      const q = query(
        collection(db, "collaborations"),
        where("__name__", "in", followedCollabs),
      );
      const snap = await getDocs(q);
      setFollowedList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBrandInfo = async () => {
    try {
      const brandId = profileData.brandId;
      const brandSnap = await getDoc(doc(db, "brands", brandId));
      if (brandSnap.exists()) {
        const data = brandSnap.data();

        // Find matching collaboration to get the 'type'
        const collabQuery = query(
          collection(db, "collaborations"),
          where("brandId", "==", brandId),
          limit(1),
        );
        const collabSnap = await getDocs(collabQuery);

        if (!collabSnap.empty) {
          data.type = collabSnap.docs[0].data().type;
        } else {
          // Fallback to 'Brand' for brand owners if no collab doc found
          data.type = "Brand";
        }

        setBrandInfo(data);
      }
    } catch (e) {
      console.error("Error fetching brand info", e);
    }
  };

  const fetchBrandStats = async () => {
    try {
      // Fetch orders to calculate brand stats
      // Note: In a real app, this should be a backend function or optimized query
      const snap = await getDocs(collection(db, "orders"));
      const allOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const myBrandId = profileData.brandId;
      const brandOrders = allOrders.filter(
        (o: any) =>
          o.items && o.items.some((i: any) => i.brandId === myBrandId),
      );

      const totalRevenue = brandOrders.reduce((sum, o: any) => {
        const orderRevenue = o.items
          .filter((i: any) => i.brandId === myBrandId)
          .reduce(
            (s: number, i: any) =>
              s + (parseFloat(i.price) || 0) * (i.quantity || 1),
            0,
          );
        return sum + orderRevenue;
      }, 0);

      const completed = brandOrders.filter(
        (o: any) => o.status === "delivered",
      ).length;

      setBrandStats({
        revenue: totalRevenue,
        orders: brandOrders.length,
        completed,
      });
    } catch (e) {
      console.error("Error fetching brand stats", e);
    }
  };

  const handleToggleStats = async () => {
    if (isStatsVisible) {
      setIsStatsVisible(false);
      return;
    }

    // Safety check for native module availability (prevention for EAS updates on old builds)
    if (!LocalAuthentication || !LocalAuthentication.hasHardwareAsync) {
      console.warn(
        "LocalAuthentication native module not found. Falling back to simple toggle.",
      );
      setIsStatsVisible(true);
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsStatsVisible(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("authRequired") || "Authentication Required",
        fallbackLabel: t("usePasscode") || "Use Passcode",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsStatsVisible(true);
      }
    } catch (error) {
      console.error("Biometric authentication error:", error);
      // Fallback to simple toggle if authentication fails unexpectedly
      setIsStatsVisible(true);
    }
  };
  const getBadgeColor = () => {
    if (!brandInfo) return "#22C55E";
    if (brandInfo.type === "Brand") return "#FFD700";
    if (brandInfo.type === "Person") return "#A855F7";
    if (brandInfo.type === "Company") return "#3B82F6";
    return "#22C55E";
  };

  const badgeColor = getBadgeColor();

  // Show loading if no profile data
  if (!profileData) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <TouchableOpacity
          style={{
            position: "absolute",
            top: insets.top + 10,
            left: 20,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme === "dark" ? "rgba(0,0,0,0.5)" : "#FFF",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor:
              theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          }}
          onPress={onBack}
        >
          <ChevronLeft size={24} color={colors.foreground} strokeWidth={2.5} />
        </TouchableOpacity>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text
          style={{ marginTop: 16, color: colors.textMuted, fontWeight: "600" }}
        >
          {tr("Chargement...", "جاري التحميل...", "Loading...")}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky Animated Blur Header */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 80 + insets.top,
            paddingTop: insets.top - 15,
            borderBottomWidth: headerOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            borderBottomColor:
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          },
        ]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}
        >
          <BlurView
            intensity={80}
            style={StyleSheet.absoluteFill}
            tint={theme}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.background + "66" },
            ]}
          />
        </Animated.View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 10,
          }}
        >
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme === "dark" ? "rgba(0,0,0,0.5)" : "#FFF",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor:
                theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
            }}
            onPress={onBack}
          >
            <ChevronLeft
              size={24}
              color={colors.foreground}
              strokeWidth={2.5}
            />
          </TouchableOpacity>

          <AnimatedAppText
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.modernLogo,
              {
                flex: 1,
                position: "relative",
                left: 0,
                right: 0,
                marginHorizontal: 10,
                textAlign: "left",
                opacity: headerOpacity,
                color: colors.foreground,
                fontSize: 16,
              },
            ]}
          >
            {displayName.toUpperCase()}
          </AnimatedAppText>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme === "dark" ? "rgba(0,0,0,0.4)" : "#FFF",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
              }}
              onPress={onShowScanner}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Scan size={24} color={colors.foreground} strokeWidth={2} />
                <View style={{ position: "absolute" }}>
                  <QrCode
                    size={11}
                    color={colors.foreground}
                    strokeWidth={2.5}
                  />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme === "dark" ? "rgba(0,0,0,0.4)" : "#FFF",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
              }}
              onPress={onShowBadge}
            >
              <QrCode size={20} color={colors.foreground} strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme === "dark" ? "rgba(0,0,0,0.4)" : "#FFF",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
              }}
              onPress={() => onNavigate("Settings")}
            >
              <Settings size={20} color={colors.foreground} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        ref={profileScrollRef}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        stickyHeaderIndices={[2]}
      >
        <View
          style={{
            height: height * 0.55,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {profileData?.avatarUrl ? (
            <Image
              source={{ uri: profileData.avatarUrl }}
              style={{
                width: "100%",
                height: "100%",
                resizeMode: "cover",
              }}
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: theme === "dark" ? "#1A1A1A" : "#F2F2F7",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 80,
                  fontWeight: "900",
                  color: theme === "dark" ? "#333" : "#CCC",
                  letterSpacing: 4,
                }}
              >
                {getInitials(displayName)}
              </Text>
            </View>
          )}

          {/* Badge Overlay - Center of Image */}
          {isBrandOwner && (
            <View
              style={{
                position: "absolute",
                top: "30%",
                left: 0,
                right: 0,
                alignItems: "center",
                transform: [{ translateY: -15 }],
              }}
            >
              <View
                style={{
                  backgroundColor:
                    theme === "dark"
                      ? "rgba(0,0,0,0.5)"
                      : "rgba(255,255,255,0.5)",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.25)",
                  marginBottom: 25,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "900",
                    color: theme === "dark" ? "#FFF" : "#000",
                    letterSpacing: 1,
                  }}
                >
                  {t("brandOwner").toUpperCase()}
                </Text>
              </View>

              {/* Brand Logo and Name Section */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor:
                    theme === "dark"
                      ? "rgba(0,0,0,0.5)"
                      : "rgba(255,255,255,0.5)",
                  paddingHorizontal: 15,
                  paddingVertical: 10,
                  borderRadius: 35, // Fully rounded pill shape
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.25)",
                  gap: 12,
                  marginTop: 5, // Add some space from the badge above
                }}
              >
                {brandInfo &&
                (brandInfo.logo || brandInfo.image || brandInfo.logoUrl) ? (
                  <Image
                    source={{
                      uri: getName(
                        brandInfo.logo || brandInfo.image || brandInfo.logoUrl,
                      ),
                    }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "rgba(255,255,255,0.1)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ShoppingBag
                      size={20}
                      color={theme === "dark" ? "#FFF" : "#000"}
                    />
                  </View>
                )}
                <View>
                  <Text
                    style={{
                      color: theme === "dark" ? "#FFF" : "#000",
                      fontSize: 14,
                      fontWeight: "900",
                      letterSpacing: 0.5,
                    }}
                  >
                    {getName(brandInfo?.name, "BEY3A BRAND").toUpperCase()}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: theme === "dark" ? "#FFF" : "#000",
                        fontSize: 9,
                        fontWeight: "700",
                        letterSpacing: 1,
                      }}
                    >
                      {t("officialPartner").toUpperCase()}
                    </Text>
                    <CheckCircle2 size={10} color={badgeColor} />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Stats Cards Overlay - Bottom of Image */}
          {isOwnProfile && isBrandOwner && (
            <View
              style={{
                position: "absolute",
                bottom: 120,
                left: 0,
                right: 0,
                paddingHorizontal: 10,
              }}
            >
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(0,0,0,0.5)"
                        : "rgba(255,255,255,0.5)",
                    borderRadius: 16,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 3,
                      marginBottom: 8,
                    }}
                  >
                    <Package
                      size={12}
                      color={theme === "dark" ? "#FFF" : "#000"}
                      strokeWidth={2}
                    />
                    <Text
                      style={{
                        fontSize: 8,
                        fontWeight: "800",
                        color: theme === "dark" ? "#FFF" : "#000",
                        letterSpacing: 0.2,
                      }}
                    >
                      {t("orders").toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "900",
                      color: theme === "dark" ? "#FFF" : "#000",
                    }}
                  >
                    {isStatsVisible ? brandStats.orders : "****"}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(0,0,0,0.5)"
                        : "rgba(255,255,255,0.5)",
                    borderRadius: 16,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 3,
                      marginBottom: 8,
                    }}
                  >
                    <TrendingUp
                      size={12}
                      color={theme === "dark" ? "#FFF" : "#000"}
                      strokeWidth={2}
                    />
                    <Text
                      style={{
                        fontSize: 8,
                        fontWeight: "800",
                        color: theme === "dark" ? "#FFF" : "#000",
                        letterSpacing: 0.2,
                      }}
                    >
                      {t("revenue").toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "900",
                      color: theme === "dark" ? "#FFF" : "#000",
                    }}
                  >
                    {isStatsVisible ? brandStats.revenue.toFixed(0) : "****"}
                  </Text>
                  {isStatsVisible && (
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: theme === "dark" ? "#FFF" : "#000",
                        marginTop: 1,
                      }}
                    >
                      TND
                    </Text>
                  )}
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(0,0,0,0.5)"
                        : "rgba(255,255,255,0.5)",
                    borderRadius: 16,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 3,
                      marginBottom: 8,
                    }}
                  >
                    <CheckCircle2 size={12} color="#34C759" strokeWidth={2} />
                    <Text
                      style={{
                        fontSize: 8,
                        fontWeight: "800",
                        color: theme === "dark" ? "#FFF" : "#000",
                        letterSpacing: 0.2,
                      }}
                    >
                      {t("completed").toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "900",
                      color: "#34C759",
                    }}
                  >
                    {isStatsVisible ? brandStats.completed : "****"}
                  </Text>
                </View>
              </View>

              {/* Platform specific Auth icon bottom corner */}
              <TouchableOpacity
                onPress={handleToggleStats}
                style={{ position: "absolute", bottom: -60, right: 20 }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(0,0,0,0.5)"
                        : "rgba(255,255,255,0.5)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: isStatsVisible
                      ? "#34C759"
                      : "rgba(255,255,255,0.2)",
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }}
                >
                  {isStatsVisible ? (
                    <EyeOff
                      size={26}
                      color={theme === "dark" ? "#FFF" : "#000"}
                    />
                  ) : Platform.OS === "ios" ? (
                    <ScanFace
                      size={26}
                      color={theme === "dark" ? "#FFF" : "#000"}
                    />
                  ) : (
                    <Fingerprint
                      size={26}
                      color={theme === "dark" ? "#FFF" : "#000"}
                    />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Profile Info Section (Child Index 1) */}
        <Animatable.View
          animation="fadeInUp"
          duration={800}
          style={[
            styles.campaignContent,
            {
              marginTop: -40,
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              backgroundColor: colors.background,
              paddingTop: 40,
              paddingBottom: 0,
              minHeight: 0,
            },
          ]}
        >
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Text
                style={[styles.campaignTitle, { color: colors.foreground }]}
              >
                {displayName.toUpperCase()}
              </Text>
              {profileData?.kycStatus === "approved" && (
                <ShieldCheck
                  style={{ marginBottom: 20 }}
                  size={20}
                  color="#34C759"
                  fill={
                    theme === "dark"
                      ? "rgba(52, 199, 89, 0.2)"
                      : "rgba(52, 199, 89, 0.1)"
                  }
                  strokeWidth={2.5}
                />
              )}
            </View>
            {isOwnProfile && (
              <TouchableOpacity onPress={() => setShowEmail(!showEmail)}>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textMuted,
                    fontWeight: "500",
                    letterSpacing: 0.5,
                  }}
                >
                  {showEmail ? user?.email : "••••••••@••••.•••"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons for Public Profiles */}
          {!isOwnProfile && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 12,
                marginTop: 15,
                marginBottom: 5,
              }}
            >
              {/* Add Friend Button - always shows "ajoute ami" */}
              {currentUserProfileData?.friends?.includes(
                profileData?.uid || profileData?.id,
              ) ? (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 25,
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.05)",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <UserCheck size={16} color={colors.accent} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: colors.accent,
                    }}
                  >
                    {tr("ami", "صديق", "ami")}
                  </Text>
                </TouchableOpacity>
              ) : currentUserProfileData?.pendingFriendRequests?.includes(
                  profileData?.uid || profileData?.id,
                ) ? (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 25,
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.05)",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  disabled
                >
                  <Clock size={16} color={colors.textMuted} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: colors.textMuted,
                    }}
                  >
                    {tr("en attente", "قيد الانتظار", "en attente")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() =>
                    onAddFriend(profileData?.uid || profileData?.id)
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 25,
                    backgroundColor: colors.accent,
                  }}
                >
                  <UserPlus size={16} color="#FFF" />
                  <Text
                    style={{ fontSize: 12, fontWeight: "700", color: "#FFF" }}
                  >
                    {tr("ajoute ami", "إضافة صديق", "ajoute ami")}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Message Button - checks friend status before opening chat */}
              <TouchableOpacity
                onPress={() => {
                  const targetUserId = profileData?.uid || profileData?.id;
                  const isFriend =
                    currentUserProfileData?.friends?.includes(targetUserId);
                  if (!isFriend) {
                    Alert.alert(
                      tr("Message", "رسالة", "Message"),
                      tr(
                        "Le chat est disponible uniquement après acceptation de l'invitation",
                        "الدردشة متاحة فقط بعد قبول الدعوة",
                        "Le chat est disponible uniquement après acceptation de l'invitation",
                      ),
                    );
                    return;
                  }
                  // Use external setSelectedChatUser if available (for public profiles)
                  if (externalSetSelectedChatUser) {
                    externalSetSelectedChatUser({
                      ...profileData,
                      uid: targetUserId,
                    });
                  }
                  setActiveTab("DirectMessage");
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 25,
                  backgroundColor: theme === "dark" ? "#FFF" : "#000",
                }}
              >
                <MessageCircle
                  size={16}
                  color={theme === "dark" ? "#000" : "#FFF"}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: theme === "dark" ? "#000" : "#FFF",
                  }}
                >
                  {tr("message", "رسالة", "message")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animatable.View>

        {/* Sticky Tab Switcher (Child Index 2) - Only show Works/Travaux tab for public profiles */}
        <View style={{ backgroundColor: colors.background }}>
          <View
            style={{
              flexDirection: "row",
              backgroundColor:
                theme === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              borderRadius: 16,
              padding: 4,
              marginTop: 10,
              marginHorizontal: 15,
              marginBottom: 10,
            }}
          >
            {isOwnProfile && (
              <TouchableOpacity
                onPress={() => setProfileTab("Menu")}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor:
                    profileTab === "Menu"
                      ? theme === "dark"
                        ? "#FFF"
                        : "#000"
                      : "transparent",
                }}
              >
                <LayoutGrid
                  size={16}
                  color={
                    profileTab === "Menu"
                      ? theme === "dark"
                        ? "#000"
                        : "#FFF"
                      : colors.textMuted
                  }
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color:
                      profileTab === "Menu"
                        ? theme === "dark"
                          ? "#000"
                          : "#FFF"
                        : colors.textMuted,
                    letterSpacing: 0.5,
                  }}
                >
                  {tr("MENU", "القائمة", "MENU")}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setProfileTab("Works")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor:
                  profileTab === "Works"
                    ? theme === "dark"
                      ? "#FFF"
                      : "#000"
                    : "transparent",
              }}
            >
              <Camera
                size={16}
                color={
                  profileTab === "Works"
                    ? theme === "dark"
                      ? "#000"
                      : "#FFF"
                    : colors.textMuted
                }
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color:
                    profileTab === "Works"
                      ? theme === "dark"
                        ? "#000"
                        : "#FFF"
                      : colors.textMuted,
                  letterSpacing: 0.5,
                }}
              >
                {t("works").toUpperCase()}
              </Text>
            </TouchableOpacity>
            {/* Hide Messages tab by default for public profiles - only show for own profile */}
            {isOwnProfile && (
              <TouchableOpacity
                onPress={() => {
                  setActiveTab("Messages");
                }}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor:
                    profileTab === "Messages"
                      ? theme === "dark"
                        ? "#FFF"
                        : "#000"
                      : "transparent",
                }}
              >
                <MessageCircle
                  size={16}
                  color={
                    profileTab === "Messages"
                      ? theme === "dark"
                        ? "#000"
                        : "#FFF"
                      : colors.textMuted
                  }
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color:
                      profileTab === "Messages"
                        ? theme === "dark"
                          ? "#000"
                          : "#FFF"
                        : colors.textMuted,
                    letterSpacing: 0.5,
                  }}
                >
                  {tr("MESSAGES", "الرسائل", "MESSAGES")}
                </Text>
                {isOwnProfile && totalUnread > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: -5,
                      right: 5,
                      backgroundColor: "#EF4444",
                      borderRadius: 10,
                      minWidth: 20,
                      height: 20,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1.5,
                      borderColor: theme === "dark" ? "#000" : "#FFF",
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{ color: "#FFF", fontSize: 10, fontWeight: "900" }}
                    >
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Content Section (Child Index 3) */}
        <Animatable.View
          animation="fadeInUp"
          duration={800}
          delay={200}
          style={{ paddingHorizontal: 15 }}
        >
          {profileTab === "Menu" && isOwnProfile && (
            <View>
              {/* Wallet Hero Card */}
              <View style={{ marginBottom: 25, marginTop: 10 }}>
                <LinearGradient
                  colors={
                    theme === "dark"
                      ? ["#1A1A24", "#0D0D14"]
                      : ["#FFFFFF", "#F9F9FB"]
                  }
                  style={{
                    borderRadius: 28,
                    padding: 24,
                    borderWidth: 1,
                    borderColor:
                      theme === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.1,
                    shadowRadius: 20,
                    elevation: 5,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 24,
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "900",
                          color: colors.textMuted,
                          letterSpacing: 1.5,
                          marginBottom: 8,
                        }}
                      >
                        {tr(
                          "SOLDE DU PORTEFEUILLE",
                          "رصيد المحفظة",
                          "WALLET BALANCE",
                        ).toUpperCase()}
                      </Text>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text
                          style={{
                            fontSize: 32,
                            fontWeight: "900",
                            color: colors.foreground,
                          }}
                        >
                          {(
                            (profileData?.wallet?.coins || 0) +
                            (profileData?.wallet?.diamonds || 0)
                          ).toLocaleString()}
                        </Text>
                        <Sparkles
                          size={20}
                          color="#F59E0B"
                          style={{ marginLeft: 12 }}
                        />
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setActiveTab("Wallet")}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor:
                          theme === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor:
                          theme === "dark"
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.05)",
                      }}
                    >
                      <Wallet size={22} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>

                  <View
                    style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}
                  >
                    <View
                      style={{
                        flex: 1,
                        backgroundColor:
                          theme === "dark"
                            ? "rgba(245, 158, 11, 0.08)"
                            : "rgba(245, 158, 11, 0.05)",
                        borderRadius: 20,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: "rgba(245, 158, 11, 0.15)",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <Coins size={18} color="#F59E0B" fill="#F59E0B" />
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "900",
                            color: colors.foreground,
                          }}
                        >
                          {profileData?.wallet?.coins || 0}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "800",
                          color: colors.textMuted,
                          letterSpacing: 0.5,
                        }}
                      >
                        {tr("PIÈCES", "عملات", "COINS")}
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor:
                          theme === "dark"
                            ? "rgba(139, 92, 246, 0.08)"
                            : "rgba(139, 92, 246, 0.05)",
                        borderRadius: 20,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: "rgba(139, 92, 246, 0.15)",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <Gem size={18} color="#8B5CF6" fill="#8B5CF6" />
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "900",
                            color: colors.foreground,
                          }}
                        >
                          {profileData?.wallet?.diamonds || 0}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "800",
                          color: colors.textMuted,
                          letterSpacing: 0.5,
                        }}
                      >
                        {tr("DIAMANTS", "ألماس", "DIAMONDS")}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => setShowQuickExchange(true)}
                      style={{
                        flex: 1,
                        height: 50,
                        borderRadius: 16,
                        backgroundColor: colors.foreground,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: colors.foreground,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: theme === "dark" ? "#000" : "#FFF",
                          fontSize: 13,
                          fontWeight: "900",
                          letterSpacing: 0.5,
                        }}
                      >
                        {tr("ÉCHANGER", "تبادل", "EXCHANGE")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowTransferModal(true)}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 16,
                        backgroundColor:
                          theme === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Send size={20} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>

              {followedList.length > 0 && (
                <View style={{ marginTop: 10, marginBottom: 25 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      paddingHorizontal: 5,
                      marginBottom: 15,
                    }}
                  >
                    <Text
                      style={[
                        styles.menuSectionLabel,
                        { color: colors.textMuted, marginBottom: 0 },
                      ]}
                    >
                      {t("follow").toUpperCase()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setActiveTab("FollowManagement")}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "800",
                          color: colors.accent,
                          letterSpacing: 0.5,
                        }}
                      >
                        {t("viewAll").toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12, paddingHorizontal: 5 }}
                  >
                    {followedList.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          setSelectedCollab(item);
                          setActiveTab("CollabDetail");
                        }}
                        style={{ alignItems: "center", width: 70 }}
                      >
                        <View style={{ position: "relative" }}>
                          <Animatable.View
                            animation={
                              liveChannels.includes(item.id) ||
                              (item.brandId &&
                                liveChannels.includes(item.brandId))
                                ? "pulse"
                                : undefined
                            }
                            iterationCount="infinite"
                            style={{
                              width: 58,
                              height: 58,
                              borderRadius: 29,
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 2,
                              borderColor:
                                liveChannels.includes(item.id) ||
                                (item.brandId &&
                                  liveChannels.includes(item.brandId))
                                  ? "#EF4444"
                                  : "transparent",
                            }}
                          >
                            <Image
                              source={
                                item.imageUrl
                                  ? { uri: item.imageUrl }
                                  : APP_ICON
                              }
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: 25,
                                backgroundColor: colors.border,
                                borderWidth: 1.5,
                                borderColor: colors.background,
                              }}
                            />
                          </Animatable.View>
                          {(liveChannels.includes(item.id) ||
                            (item.brandId &&
                              liveChannels.includes(item.brandId))) && (
                            <Animatable.View
                              animation="bounceIn"
                              style={{
                                position: "absolute",
                                bottom: -4,
                                alignSelf: "center",
                                backgroundColor: "#EF4444",
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                                borderWidth: 1.5,
                                borderColor: colors.background,
                                shadowColor: "#EF4444",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                elevation: 4,
                                zIndex: 10,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 7,
                                  fontWeight: "900",
                                  color: "#FFF",
                                  letterSpacing: 0.5,
                                }}
                              >
                                {t("enDirect") || "EN DIRECT"}
                              </Text>
                            </Animatable.View>
                          )}
                          <View
                            style={{
                              position: "absolute",
                              top: -2,
                              right: 2,
                              backgroundColor:
                                item.type === "Brand"
                                  ? "#FFD700"
                                  : item.type === "Person"
                                    ? "#A855F7"
                                    : item.type === "Company"
                                      ? "#3B82F6"
                                      : "#22C55E",
                              borderRadius: 10,
                              width: 18,
                              height: 18,
                              justifyContent: "center",
                              alignItems: "center",
                              borderWidth: 2,
                              borderColor: colors.background,
                            }}
                          >
                            <CheckCircle2
                              size={10}
                              color={theme === "dark" ? "#000" : "#FFF"}
                            />
                          </View>
                        </View>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 9,
                            fontWeight: "800",
                            color: colors.foreground,
                            marginTop: 8,
                            textAlign: "center",
                          }}
                        >
                          {getName(item.name)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View
                style={[
                  styles.campaignDivider,
                  {
                    marginTop: 10,
                    marginBottom: 25,
                    backgroundColor: colors.border,
                    height: 1,
                    width: "100%",
                  },
                ]}
              />

              {/* Start Live Floating Card - Premium UI */}
              {[
                "admin",
                "brand_owner",
                "editor",
                "nor_kam",
                "support",
              ].includes(profileData?.role || "") &&
                hasFeature(
                  (profileData?.vendorPlan as VendorTier) || "starter",
                  "liveStreaming",
                  profileData?.accountType as AccountType,
                ) && (
                  <TouchableOpacity
                    onPress={() =>
                      onStartLive &&
                      onStartLive(profileData?.brandId ? brandInfo : undefined)
                    }
                    activeOpacity={0.9}
                    style={{
                      marginHorizontal: 0,
                      marginTop: 0,
                      marginBottom: 35,
                      borderRadius: 24,
                      overflow: "hidden",
                      elevation: 10,
                      shadowColor: "#EF4444",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.3,
                      shadowRadius: 15,
                    }}
                  >
                    <LinearGradient
                      colors={["#EF4444", "#DC2626", "#B91C1C"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        padding: 20,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 15,
                        }}
                      >
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: "rgba(255,255,255,0.2)",
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.3)",
                          }}
                        >
                          <Camera size={22} color="#FFF" strokeWidth={2.5} />
                        </View>
                        <View>
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.8)",
                              fontSize: 9,
                              fontWeight: "800",
                              letterSpacing: 1,
                              marginBottom: 2,
                            }}
                          >
                            {t("broadcastCenter")}
                          </Text>
                          <Text
                            style={{
                              color: "#FFF",
                              fontSize: 13,
                              fontWeight: "900",
                              letterSpacing: 0.5,
                            }}
                          >
                            {t("startLiveSession")}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: "rgba(0,0,0,0.15)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ChevronRight size={18} color="#FFF" strokeWidth={3} />
                      </View>

                      {/* Subtle Decorative Glow */}
                      <View
                        style={{
                          position: "absolute",
                          top: -20,
                          right: -20,
                          width: 100,
                          height: 100,
                          borderRadius: 50,
                          backgroundColor: "rgba(255,255,255,0.1)",
                        }}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                )}

              <View style={{ gap: 8 }}>
                {profileData?.role !== "driver" && (
                  <>
                    <Text
                      style={[
                        styles.menuSectionLabel,
                        {
                          marginBottom: 15,
                          marginLeft: 5,
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      {t("myStudio")}
                    </Text>
                    {[
                      "admin",
                      "support",
                      "brand_owner",
                      "vendor",
                      "nor_kam",
                      "partner",
                    ].includes(profileData?.role) && (
                      <TouchableOpacity
                        style={[
                          styles.menuRow,
                          {
                            paddingVertical: 18,
                            borderBottomColor: colors.border,
                          },
                        ]}
                        onPress={() => setActiveTab("AdminMenu")}
                      >
                        <View style={styles.menuRowLeft}>
                          <View
                            style={[
                              styles.iconCircle,
                              {
                                backgroundColor:
                                  theme === "dark" ? "#17171F" : "#F9F9FB",
                              },
                            ]}
                          >
                            <LayoutDashboard size={20} color={colors.primary} />
                          </View>
                          <Text
                            style={[
                              styles.menuRowText,
                              { color: colors.foreground, fontWeight: "800" },
                            ]}
                          >
                            {(["admin", "support"].includes(profileData?.role)
                              ? t("adminConsole")
                              : t("storeManagement") || "STORE MANAGEMENT"
                            ).toUpperCase()}
                          </Text>
                        </View>
                        <ChevronRight size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                    {/* Become a Vendor Button */}
                    {true && (
                      <TouchableOpacity
                        style={[
                          styles.menuRow,
                          {
                            paddingVertical: 18,
                            borderBottomColor: colors.border,
                          },
                        ]}
                        onPress={() => {
                          onBecomeVendor();
                        }}
                      >
                        <View style={[styles.menuRowLeft]}>
                          <View
                            style={[
                              styles.iconCircle,
                              {
                                backgroundColor:
                                  theme === "dark" ? "#17171F" : "#F9F9FB",
                              },
                            ]}
                          >
                            <Store size={20} color={colors.primary} />
                          </View>
                          <Text
                            style={[
                              styles.menuRowText,
                              { color: colors.primary, fontWeight: "600" },
                            ]}
                          >
                            {["approved", "active"].includes(
                              profileData?.vendorData?.status,
                            )
                              ? t("myVendorPlan") || "Mon Plan Vendeur"
                              : profileData?.vendorData?.status === "pending"
                                ? t("applicationPending") ||
                                  "Demande en attente"
                                : t("becomeVendor")}
                          </Text>
                        </View>
                        <ChevronRight size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}

                    {(["approved", "active"].includes(
                      profileData?.vendorData?.status,
                    ) ||
                      profileData?.role === "brand_owner" ||
                      profileData?.role === "vendor") && (
                      <TouchableOpacity
                        style={[
                          styles.menuRow,
                          {
                            paddingVertical: 18,
                            borderBottomColor: colors.border,
                          },
                        ]}
                        onPress={() => onOpenStoreQRModal()}
                      >
                        <View style={styles.menuRowLeft}>
                          <View
                            style={[
                              styles.iconCircle,
                              {
                                backgroundColor:
                                  theme === "dark" ? "#17171F" : "#F9F9FB",
                              },
                            ]}
                          >
                            <QrCode size={20} color={colors.accent} />
                          </View>
                          <Text
                            style={[
                              styles.menuRowText,
                              { color: colors.foreground },
                            ]}
                          >
                            {t("storeQRCode")}
                          </Text>
                        </View>
                        <ChevronRight size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.menuRow,
                        {
                          paddingVertical: 18,
                          borderBottomColor: colors.border,
                        },
                      ]}
                      onPress={() => setActiveTab("Orders")}
                    >
                      <View style={styles.menuRowLeft}>
                        <View
                          style={[
                            styles.iconCircle,
                            {
                              backgroundColor:
                                theme === "dark" ? "#17171F" : "#F9F9FB",
                            },
                          ]}
                        >
                          <Package
                            size={20}
                            color={colors.foreground}
                            strokeWidth={2}
                          />
                        </View>
                        <Text
                          style={[
                            styles.menuRowText,
                            { color: colors.foreground },
                          ]}
                        >
                          {t("myOrders")}
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.menuRow,
                        {
                          paddingVertical: 18,
                          borderBottomColor: colors.border,
                        },
                      ]}
                      onPress={() => setTrackingModalVisible(true)}
                    >
                      <View style={styles.menuRowLeft}>
                        <View
                          style={[
                            styles.iconCircle,
                            {
                              backgroundColor:
                                theme === "dark" ? "#17171F" : "#F9F9FB",
                            },
                          ]}
                        >
                          <Truck
                            size={20}
                            color={colors.foreground}
                            strokeWidth={2}
                          />
                        </View>
                        <Text
                          style={[
                            styles.menuRowText,
                            { color: colors.foreground },
                          ]}
                        >
                          {t("trackShipment")}
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </>
                )}

                {profileData?.role === "driver" && (
                  <TouchableOpacity
                    style={[
                      styles.menuRow,
                      { paddingVertical: 18, borderBottomColor: colors.border },
                    ]}
                    onPress={() => setActiveTab("DriverDashboard")}
                  >
                    <View style={styles.menuRowLeft}>
                      <View
                        style={[
                          styles.iconCircle,
                          { backgroundColor: "#3B82F6" },
                        ]}
                      >
                        <Truck size={20} color="#FFF" />
                      </View>
                      <Text
                        style={[
                          styles.menuRowText,
                          { color: colors.foreground, fontWeight: "800" },
                        ]}
                      >
                        {t("driverDashboard")}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}

                {(profileData?.role === "brand_owner" ||
                  profileData?.role === "admin") && (
                  <TouchableOpacity
                    style={[
                      styles.menuRow,
                      { paddingVertical: 18, borderBottomColor: colors.border },
                    ]}
                    onPress={() => setActiveTab("ShipmentCreation")}
                  >
                    <View style={styles.menuRowLeft}>
                      <View
                        style={[
                          styles.iconCircle,
                          {
                            backgroundColor:
                              theme === "dark" ? "#17171F" : "#F9F9FB",
                          },
                        ]}
                      >
                        <Package size={20} color="#10B981" />
                      </View>
                      <Text
                        style={[
                          styles.menuRowText,
                          { color: colors.foreground },
                        ]}
                      >
                        {t("createNewShipment")}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.menuRow,
                    { paddingVertical: 18, borderBottomColor: colors.border },
                  ]}
                  onPress={() => setActiveTab("MyShipments")}
                >
                  <View style={styles.menuRowLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor:
                            theme === "dark" ? "#17171F" : "#F9F9FB",
                        },
                      ]}
                    >
                      <Truck size={20} color={colors.accent} />
                    </View>
                    <Text
                      style={[styles.menuRowText, { color: colors.foreground }]}
                    >
                      {t("myShipments")}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {(profileData?.role === "brand_owner" ||
                  profileData?.role === "admin") &&
                  profileData?.brandId && (
                    <TouchableOpacity
                      style={[
                        styles.menuRow,
                        {
                          paddingVertical: 18,
                          borderBottomColor: colors.border,
                        },
                      ]}
                      onPress={() => setActiveTab("LiveAnalytics")}
                    >
                      <View style={styles.menuRowLeft}>
                        <View
                          style={[
                            styles.iconCircle,
                            {
                              backgroundColor:
                                theme === "dark" ? "#17171F" : "#F9F9FB",
                            },
                          ]}
                        >
                          <TrendingUp
                            size={20}
                            color={colors.foreground}
                            strokeWidth={2}
                          />
                        </View>
                        <Text
                          style={[
                            styles.menuRowText,
                            { color: colors.foreground },
                          ]}
                        >
                          {t("liveAnalytics")}
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}

                {profileData?.role !== "driver" && (
                  <TouchableOpacity
                    style={[
                      styles.menuRow,
                      { paddingVertical: 18, borderBottomColor: colors.border },
                    ]}
                    onPress={() => onNavigate("Wishlist")}
                  >
                    <View style={styles.menuRowLeft}>
                      <View
                        style={[
                          styles.iconCircle,
                          {
                            backgroundColor:
                              theme === "dark" ? "#17171F" : "#F9F9FB",
                          },
                        ]}
                      >
                        <Heart
                          size={20}
                          color={colors.foreground}
                          strokeWidth={2}
                        />
                      </View>
                      <Text
                        style={[
                          styles.menuRowText,
                          { color: colors.foreground },
                        ]}
                      >
                        {t("savedItems")}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}

                {profileData?.role !== "driver" && (
                  <>
                    <Text
                      style={[
                        styles.menuSectionLabel,
                        {
                          marginTop: 30,
                          marginBottom: 15,
                          marginLeft: 5,
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      {tr("CONNEXIONS", "علاقات", "CONNECTIONS")}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.menuRow,
                        {
                          paddingVertical: 18,
                          borderBottomColor: colors.border,
                        },
                      ]}
                      onPress={() => setActiveTab("Messages")}
                    >
                      <View style={styles.menuRowLeft}>
                        <View
                          style={[
                            styles.iconCircle,
                            {
                              backgroundColor:
                                theme === "dark" ? "#17171F" : "#F9F9FB",
                            },
                          ]}
                        >
                          <MessageCircle
                            size={20}
                            color={colors.foreground}
                            strokeWidth={2}
                          />
                        </View>
                        <Text
                          style={[
                            styles.menuRowText,
                            { color: colors.foreground },
                          ]}
                        >
                          {tr("Messages", "الرسائل", "Messages")}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {totalUnread > 0 && (
                          <View
                            style={{
                              backgroundColor: "#EF4444",
                              borderRadius: 10,
                              minWidth: 20,
                              height: 20,
                              alignItems: "center",
                              justifyContent: "center",
                              paddingHorizontal: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: "#FFF",
                                fontSize: 10,
                                fontWeight: "900",
                              }}
                            >
                              {totalUnread > 99 ? "99+" : totalUnread}
                            </Text>
                          </View>
                        )}
                        <ChevronRight size={18} color={colors.textMuted} />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.menuRow,
                        {
                          paddingVertical: 18,
                          borderBottomColor: colors.border,
                        },
                      ]}
                      onPress={() => onNavigate("Friends")}
                    >
                      <View style={styles.menuRowLeft}>
                        <View
                          style={[
                            styles.iconCircle,
                            {
                              backgroundColor:
                                theme === "dark" ? "#17171F" : "#F9F9FB",
                            },
                          ]}
                        >
                          <UsersIcon
                            size={20}
                            color={colors.foreground}
                            strokeWidth={2}
                          />
                        </View>
                        <Text
                          style={[
                            styles.menuRowText,
                            { color: colors.foreground },
                          ]}
                        >
                          {tr(
                            "Amis & Demandes",
                            "أصحابي و الطلبات",
                            "Friends & Requests",
                          )}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {friendRequestCount > 0 && (
                          <View
                            style={{
                              backgroundColor: "#EF4444",
                              borderRadius: 10,
                              minWidth: 20,
                              height: 20,
                              alignItems: "center",
                              justifyContent: "center",
                              paddingHorizontal: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: "#FFF",
                                fontSize: 10,
                                fontWeight: "900",
                              }}
                            >
                              {friendRequestCount}
                            </Text>
                          </View>
                        )}
                        <ChevronRight size={18} color={colors.textMuted} />
                      </View>
                    </TouchableOpacity>
                  </>
                )}

                <Text
                  style={[
                    styles.menuSectionLabel,
                    {
                      marginTop: 30,
                      marginBottom: 15,
                      marginLeft: 5,
                      color: colors.textMuted,
                    },
                  ]}
                >
                  {language === "ar"
                    ? "المالية"
                    : language === "fr"
                      ? "FINANCE"
                      : "FINANCE"}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.menuRow,
                    { paddingVertical: 18, borderBottomColor: colors.border },
                  ]}
                  onPress={() => setActiveTab("Wallet")}
                >
                  <View style={styles.menuRowLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor:
                            theme === "dark" ? "#17171F" : "#F9F9FB",
                        },
                      ]}
                    >
                      <Wallet
                        size={20}
                        color={colors.foreground}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[styles.menuRowText, { color: colors.foreground }]}
                    >
                      {language === "ar"
                        ? "المحفظة"
                        : language === "fr"
                          ? "Portefeuille"
                          : "My Wallet"}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textMuted,
                        fontWeight: "600",
                      }}
                    >
                      {profileData?.wallet?.coins
                        ? profileData.wallet.coins.toLocaleString()
                        : 0}
                    </Text>
                    <Coins size={14} color="#F59E0B" fill="#F59E0B" />
                    <ChevronRight size={18} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.menuRow,
                    { paddingVertical: 18, borderBottomColor: colors.border },
                  ]}
                  onPress={() => setActiveTab("Fidelity")}
                >
                  <View style={styles.menuRowLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor:
                            theme === "dark" ? "#17171F" : "#F9F9FB",
                        },
                      ]}
                    >
                      <Gift
                        size={20}
                        color={colors.foreground}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[styles.menuRowText, { color: colors.foreground }]}
                    >
                      {t("fidelityProgram")}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.menuRow,
                    { paddingVertical: 18, borderBottomColor: colors.border },
                  ]}
                  onPress={() => {
                    setPreviousTab("Profile");
                    setActiveTab("TreasureHunt");
                  }}
                >
                  <View style={styles.menuRowLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor:
                            theme === "dark" ? "#17171F" : "#F9F9FB",
                        },
                      ]}
                    >
                      <Trophy
                        size={20}
                        color={colors.foreground}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[styles.menuRowText, { color: colors.foreground }]}
                    >
                      {t("treasureHunt")}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
                <Text
                  style={[
                    styles.menuSectionLabel,
                    {
                      marginTop: 30,
                      marginBottom: 15,
                      marginLeft: 5,
                      color: colors.textMuted,
                    },
                  ]}
                >
                  {language === "ar"
                    ? "الأمان"
                    : language === "fr"
                      ? "SÉCURITÉ"
                      : "SECURITY"}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.menuRow,
                    { paddingVertical: 18, borderBottomColor: colors.border },
                  ]}
                  onPress={() => setActiveTab("KYC")}
                >
                  <View style={styles.menuRowLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor:
                            theme === "dark" ? "#17171F" : "#F9F9FB",
                        },
                      ]}
                    >
                      <ShieldCheck
                        size={20}
                        color={
                          profileData?.kycStatus === "approved"
                            ? colors.success
                            : profileData?.kycStatus === "pending"
                              ? colors.warning
                              : colors.foreground
                        }
                        strokeWidth={2}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.menuRowText,
                          { color: colors.foreground },
                        ]}
                      >
                        {language === "ar"
                          ? "تأكيد الهوية"
                          : language === "fr"
                            ? "Vérification d'identité"
                            : "Identity Verification"}
                      </Text>
                      {profileData?.kycStatus && (
                        <Text
                          style={{
                            fontSize: 10,
                            color:
                              profileData.kycStatus === "approved"
                                ? colors.success
                                : colors.warning,
                            fontWeight: "700",
                            marginTop: 2,
                          }}
                        >
                          {profileData.kycStatus === "approved"
                            ? language === "ar"
                              ? "تم التحقق"
                              : "VERIFIED"
                            : language === "ar"
                              ? "قيد المراجعة"
                              : "PENDING"}
                        </Text>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <Text
                  style={[
                    styles.menuSectionLabel,
                    {
                      marginTop: 30,
                      marginBottom: 15,
                      marginLeft: 5,
                      color: colors.textMuted,
                    },
                  ]}
                >
                  {t("preferences")}
                </Text>

                <View
                  style={[
                    styles.menuRow,
                    {
                      paddingVertical: 18,
                      borderBottomColor: colors.border,
                      borderBottomWidth: 1,
                    },
                  ]}
                >
                  <View style={styles.menuRowLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor:
                            theme === "dark" ? "#17171F" : "#F9F9FB",
                        },
                      ]}
                    >
                      <Globe
                        size={20}
                        color={colors.foreground}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[styles.menuRowText, { color: colors.foreground }]}
                    >
                      {t("language")}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {(["en", "fr", "ar"] as const).map(
                      (l: "en" | "fr" | "ar") => (
                        <TouchableOpacity
                          key={l}
                          onPress={() => {
                            setLanguage(l);
                            let msg = "Language Changed";
                            if (l === "fr") msg = "Français sélectionné";
                            if (l === "ar") msg = "تم اختيار اللغة العربية";
                            if (l === "en") msg = "English selected";
                            Alert.alert(
                              t("languageSelect") || "Language Changed",
                              msg,
                            );
                          }}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 12,
                            backgroundColor:
                              language === l
                                ? colors.foreground
                                : theme === "dark"
                                  ? "#000"
                                  : "#F2F2F7",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "900",
                              color:
                                language === l
                                  ? theme === "dark"
                                    ? "#000"
                                    : "#FFF"
                                  : colors.textMuted,
                            }}
                          >
                            {l === "ar" ? "TN" : l.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ),
                    )}
                  </View>
                </View>

                {/* Dark Mode Toggle */}
                <View
                  style={[
                    styles.menuRow,
                    {
                      paddingVertical: 18,
                      borderBottomColor: colors.border,
                      borderBottomWidth: 1,
                    },
                  ]}
                >
                  <View style={styles.menuRowLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor:
                            theme === "dark" ? "#17171F" : "#F9F9FB",
                        },
                      ]}
                    >
                      <Zap
                        size={20}
                        color={colors.foreground}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[styles.menuRowText, { color: colors.foreground }]}
                    >
                      {t("darkMode")}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      setTheme(theme === "light" ? "dark" : "light")
                    }
                    style={[
                      styles.customSwitch,
                      theme === "dark" && {
                        backgroundColor: colors.foreground,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.switchDot,
                        theme === "dark" && [
                          styles.switchDotActive,
                          {
                            backgroundColor: theme === "dark" ? "#000" : "#FFF",
                          },
                        ],
                      ]}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.menuRow,
                    { paddingVertical: 18, borderBottomColor: colors.border },
                  ]}
                  onPress={() => onNavigate("Settings")}
                >
                  <View style={styles.menuRowLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor:
                            theme === "dark" ? "#17171F" : "#F9F9FB",
                        },
                      ]}
                    >
                      <Settings
                        size={20}
                        color={colors.foreground}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[styles.menuRowText, { color: colors.foreground }]}
                    >
                      {t("settings")}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {["admin", "editor", "viewer"].includes(profileData?.role) && (
                  <>
                    <Text
                      style={[
                        styles.menuSectionLabel,
                        {
                          marginTop: 30,
                          marginBottom: 15,
                          marginLeft: 5,
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      {t("access")}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.menuRow,
                        {
                          paddingVertical: 18,
                          borderBottomColor: colors.border,
                        },
                      ]}
                      onPress={() => onNavigate("AdminMenu")}
                    >
                      <View style={styles.menuRowLeft}>
                        <View
                          style={[
                            styles.iconCircle,
                            { backgroundColor: colors.foreground },
                          ]}
                        >
                          <Shield
                            size={20}
                            color={theme === "dark" ? "#000" : "#FFF"}
                            strokeWidth={2}
                          />
                        </View>
                        <Text
                          style={[
                            styles.menuRowText,
                            { fontWeight: "900", color: colors.foreground },
                          ]}
                        >
                          {t("adminConsole").toUpperCase()}
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={[
                    styles.menuRow,
                    {
                      paddingVertical: 18,
                      borderBottomColor: colors.border,
                      marginTop: 5,
                    },
                  ]}
                  onPress={onLogout}
                >
                  <View style={styles.menuRowLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor:
                            theme === "dark"
                              ? "rgba(255,69,58,0.15)"
                              : "#FFE0E0",
                        },
                      ]}
                    >
                      <LogOut size={20} color={colors.error} strokeWidth={2} />
                    </View>
                    <Text
                      style={[
                        styles.menuRowText,
                        { color: colors.error, fontWeight: "800" },
                      ]}
                    >
                      {t("logout")}
                    </Text>
                  </View>
                  {/* <ChevronRight size={18} color={colors.textMuted} /> */}
                </TouchableOpacity>
              </View>

              {socialLinks && (
                <View
                  style={{
                    marginTop: 20,
                    alignItems: "center",
                    paddingBottom: 80,
                  }}
                >
                  <Text
                    style={[
                      styles.menuSectionLabel,
                      {
                        marginBottom: 25,
                        textAlign: "center",
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    {t("community")}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 20,
                      justifyContent: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {Object.entries(socialLinks).map(([key, url]: any) => {
                      if (
                        !url ||
                        typeof url !== "string" ||
                        url.trim() === "" ||
                        key === "website" ||
                        key === "updatedAt"
                      )
                        return null;

                      let Icon = Globe;
                      if (key === "instagram") Icon = Instagram;
                      if (key === "facebook") Icon = Facebook;
                      if (key === "whatsapp") Icon = MessageCircle;
                      if (key === "tiktok") Icon = Globe;
                      if (key === "youtube") Icon = TrendingUp;

                      return (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.socialCircle,
                            {
                              backgroundColor:
                                theme === "dark" ? "#1c1c1e" : "white",
                              elevation: 2,
                              shadowOpacity: 0.1,
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={() =>
                            Linking.openURL(
                              key === "whatsapp"
                                ? `https://wa.me/${url.replace(/[^0-9]/g, "")}`
                                : url,
                            )
                          }
                        >
                          <Icon
                            size={22}
                            color={colors.foreground}
                            strokeWidth={1.5}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {socialLinks.website &&
                    typeof socialLinks.website === "string" &&
                    socialLinks.website.trim() !== "" && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(socialLinks.website)}
                        style={{ marginTop: 30 }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "800",
                            color: colors.textMuted,
                            letterSpacing: 1.5,
                          }}
                        >
                          {socialLinks.website
                            .replace("https://", "")
                            .replace("http://", "")
                            .toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    )}
                </View>
              )}
            </View>
          )}

          {profileTab === "Works" && (
            <View
              style={{
                marginTop: 20,
                paddingHorizontal: 15,
                paddingBottom: 100,
              }}
            >
              {isOwnProfile && (
                <View style={{ marginBottom: 25 }}>
                  <TouchableOpacity
                    onPress={handleUploadWork}
                    disabled={uploadingWork}
                    activeOpacity={0.8}
                    style={{
                      height: 160,
                      borderRadius: 24,
                      backgroundColor: theme === "dark" ? "#17171F" : "#F9F9FB",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: colors.border,
                      overflow: "hidden",
                    }}
                  >
                    {uploadingWork ? (
                      <View style={{ alignItems: "center" }}>
                        <ActivityIndicator
                          color={colors.foreground}
                          size="large"
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: colors.textMuted,
                            marginTop: 15,
                          }}
                        >
                          {tr(
                            "Envoi en cours...",
                            "جاري التحميل...",
                            "Uploading your work...",
                          )}
                        </Text>
                      </View>
                    ) : (
                      <>
                        <View
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            backgroundColor: colors.background,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 15,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          <Plus
                            size={28}
                            color={colors.foreground}
                            strokeWidth={2.5}
                          />
                        </View>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "800",
                            color: colors.foreground,
                            marginBottom: 4,
                          }}
                        >
                          {tr(
                            "Ajouter un travail",
                            "إضافة عمل جديد",
                            "Add New Work",
                          )}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: colors.textMuted,
                          }}
                        >
                          {tr(
                            "Vidéo ou Photo",
                            "فيديو أو صورة",
                            "Upload Video or Photo",
                          )}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {works.length === 0 ? (
                <View style={{ alignItems: "center", marginTop: 30 }}>
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor:
                        theme === "dark"
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(0,0,0,0.03)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 20,
                    }}
                  >
                    <ImageIcon
                      size={32}
                      color={colors.border}
                      strokeWidth={1.5}
                    />
                  </View>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 14,
                      fontWeight: "700",
                      textAlign: "center",
                    }}
                  >
                    {tr(
                      "Aucun travail partagé pour le moment",
                      "لا توجد أعمال مشاركة بعد",
                      "No works shared yet",
                    )}
                  </Text>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 11,
                      marginTop: 8,
                      textAlign: "center",
                      paddingHorizontal: 40,
                    }}
                  >
                    {tr(
                      "Partagez votre parcours créatif avec la communauté",
                      "شارك رحلتك الإبداعية مع المجتمع",
                      "Share your creative journey with the community",
                    )}
                  </Text>
                </View>
              ) : (
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}
                >
                  {works.map((work) => (
                    <TouchableOpacity
                      key={work.id}
                      activeOpacity={0.9}
                      onPress={() => setSelectedWork(work)}
                      style={{
                        width: (width - 70) / 2,
                        aspectRatio: 3 / 4,
                        backgroundColor: colors.border,
                        borderRadius: 16,
                        overflow: "hidden",
                        elevation: 3,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                      }}
                    >
                      {work.type === "video" ? (
                        <View style={{ flex: 1 }}>
                          <UniversalVideoPlayer
                            source={{ uri: work.url }}
                            style={{ flex: 1 }}
                            resizeMode="cover"
                            shouldPlay={false}
                          />
                          <View
                            style={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              backgroundColor: "rgba(0,0,0,0.5)",
                              padding: 4,
                              borderRadius: 8,
                            }}
                          >
                            <VideoIcon size={12} color="white" />
                          </View>
                          <View
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              marginLeft: -12,
                              marginTop: -12,
                            }}
                          >
                            <Play
                              size={24}
                              color="rgba(255,255,255,0.8)"
                              fill="rgba(255,255,255,0.5)"
                            />
                          </View>
                        </View>
                      ) : (
                        <Image source={{ uri: work.url }} style={{ flex: 1 }} />
                      )}

                      {isOwnProfile && (
                        <TouchableOpacity
                          onPress={async () => {
                            Alert.alert(
                              tr(
                                "Supprimer le travail",
                                "حذف العمل",
                                "Delete Work",
                              ),
                              tr(
                                "Voulez-vous vraiment supprimer ce travail ?",
                                "هل أنت متأكد أنك تريد حذف هذا العمل؟",
                                "Are you sure you want to delete this work?",
                              ),
                              [
                                {
                                  text: tr("Annuler", "إلغاء", "Cancel"),
                                  style: "cancel",
                                },
                                {
                                  text: tr("Supprimer", "حذف", "Delete"),
                                  style: "destructive",
                                  onPress: async () => {
                                    try {
                                      await deleteDoc(
                                        doc(
                                          db,
                                          "users",
                                          user.uid,
                                          "works",
                                          work.id,
                                        ),
                                      );
                                    } catch (e) {
                                      console.error("Error deleting work", e);
                                    }
                                  },
                                },
                              ],
                            );
                          }}
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            backgroundColor: "rgba(255,255,255,0.9)",
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                          }}
                        >
                          <Trash size={14} color="#EF4444" />
                        </TouchableOpacity>
                      )}

                      {/* Interaction Stats (Reactions & Comments) */}
                      <View
                        style={{
                          position: "absolute",
                          bottom: 8,
                          left: 8,
                          right: 8,
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 5,
                          zIndex: 20,
                        }}
                      >
                        {/* Comment Count Pill */}
                        {(work.commentsCount || 0) > 0 && (
                          <View
                            style={{
                              backgroundColor: "rgba(0,0,0,0.7)",
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 10,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              borderWidth: 1,
                              borderColor: "rgba(255,255,255,0.2)",
                            }}
                          >
                            <MessageSquare
                              size={11}
                              color="#FFF"
                              strokeWidth={2.5}
                            />
                            <Text
                              style={{
                                color: "white",
                                fontSize: 10,
                                fontWeight: "900",
                              }}
                            >
                              {work.commentsCount}
                            </Text>
                          </View>
                        )}

                        {[
                          { type: "love", Icon: Heart, color: "#FF4D67" },
                          { type: "fire", Icon: Flame, color: "#FF8A00" },
                          { type: "haha", Icon: Laugh, color: "#FFD600" },
                          { type: "bad", Icon: ThumbsDown, color: "#94A3B8" },
                          { type: "ugly", Icon: Ghost, color: "#818CF8" },
                          {
                            type: "interesting",
                            Icon: Sparkles,
                            color: "#A855F7",
                          },
                        ].map((r) => {
                          const count = work.reactions?.[r.type] || 0;
                          if (count === 0) return null;
                          return (
                            <View
                              key={r.type}
                              style={{
                                backgroundColor: "rgba(0,0,0,0.6)",
                                paddingHorizontal: 6,
                                paddingVertical: 3,
                                borderRadius: 8,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 3,
                                borderWidth: 0.5,
                                borderColor: "rgba(255,255,255,0.1)",
                              }}
                            >
                              <r.Icon
                                size={10}
                                color={r.color}
                                fill="transparent"
                                strokeWidth={2.5}
                              />
                              <Text
                                style={{
                                  color: "white",
                                  fontSize: 9,
                                  fontWeight: "900",
                                }}
                              >
                                {count}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </Animatable.View>
      </Animated.ScrollView>

      {/* Media Detail Modal (Full Screen) */}
      <Modal
        visible={!!selectedWork}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedWork(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          <View style={{ flex: 1 }}>
            {selectedWork && (
              <View style={{ flex: 1 }}>
                {/* Header Container (Floating & Blurred) */}
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingTop: insets.top + 12,
                    paddingBottom: 12,
                    zIndex: 100,
                    backgroundColor: "transparent",
                  }}
                >
                  <BlurView
                    intensity={80}
                    tint={theme}
                    style={StyleSheet.absoluteFill}
                  />
                  <TouchableOpacity
                    onPress={() => setSelectedWork(null)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor:
                        theme === "dark" ? "rgba(255,255,255,0.1)" : "#FFF",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor:
                        theme === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                    }}
                  >
                    <X size={20} color={colors.foreground} />
                  </TouchableOpacity>

                  <Text
                    style={{
                      color: colors.foreground,
                      fontWeight: "900",
                      fontSize: 16,
                    }}
                  >
                    {selectedWork?.type === "video"
                      ? tr("VIDÉO", "فيديو", "VIDEO")
                      : tr("PHOTO", "صورة", "PHOTO")}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    {isViral(selectedWork) && (
                      <View
                        style={{
                          backgroundColor: "#FF4D67",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Flame size={12} color="white" fill="white" />
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "900",
                            fontSize: 10,
                          }}
                        >
                          VIRAL
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => handleShare(selectedWork)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor:
                          theme === "dark" ? "rgba(255,255,255,0.1)" : "#FFF",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor:
                          theme === "dark"
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.05)",
                      }}
                    >
                      <Share2 size={18} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{
                    paddingBottom: 20,
                    paddingTop: insets.top + 64,
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Media Content - Full Width with black background to make media pop */}
                  <View
                    style={{
                      width: width,
                      height: height * 0.5,
                      backgroundColor: "#000",
                      justifyContent: "center",
                    }}
                  >
                    {selectedWork?.type === "video" ? (
                      <UniversalVideoPlayer
                        source={{ uri: selectedWork.url }}
                        style={{ width: width, height: height * 0.5 }}
                        resizeMode="contain"
                        shouldPlay={true}
                        isLooping={true}
                        useNativeControls
                      />
                    ) : (
                      <Image
                        source={{ uri: selectedWork?.url }}
                        style={{ width: width, height: height * 0.5 }}
                        resizeMode="contain"
                      />
                    )}
                  </View>

                  <View style={{ paddingVertical: 20 }}>
                    {/* Action Bar (Download, Repost) */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 16,
                        marginBottom: 20,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => handleDownload(selectedWork)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          backgroundColor:
                            colors.surface ||
                            (theme === "dark" ? "#1A1A24" : "#F2F2F7"),
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 25,
                          borderWidth: 1,
                          borderColor:
                            theme === "dark"
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.05)",
                        }}
                      >
                        <DownloadCloud size={18} color={colors.foreground} />
                        <Text
                          style={{
                            color: colors.foreground,
                            fontWeight: "700",
                            fontSize: 13,
                          }}
                        >
                          {tr("Télécharger", "تحميل", "Download")}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleRepost(selectedWork)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          backgroundColor:
                            colors.surface ||
                            (theme === "dark" ? "#1A1A24" : "#F2F2F7"),
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 25,
                          borderWidth: 1,
                          borderColor:
                            theme === "dark"
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.05)",
                        }}
                      >
                        <Repeat size={18} color={colors.foreground} />
                        <Text
                          style={{
                            color: colors.foreground,
                            fontWeight: "700",
                            fontSize: 13,
                          }}
                        >
                          {tr("Republier", "إعادة نشر", "Repost")}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Reaction Bar */}
                    <View
                      style={{
                        flexDirection: "row",
                        backgroundColor:
                          colors.surface ||
                          (theme === "dark" ? "#1A1A24" : "#F2F2F7"),
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: 30,
                        alignSelf: "center",
                        width: width * 0.94,
                        justifyContent: "space-between",
                        borderWidth: 1,
                        borderColor:
                          theme === "dark"
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.05)",
                        marginBottom: 25,
                      }}
                    >
                      {[
                        {
                          type: "love",
                          Icon: Heart,
                          color: "#FF4D67",
                          label: tr("Amour", "يهبل", "Love"),
                        },
                        {
                          type: "fire",
                          Icon: Flame,
                          color: "#FF8A00",
                          label: tr("Feu", "نار", "Fire"),
                        },
                        {
                          type: "haha",
                          Icon: Laugh,
                          color: "#FFD600",
                          label: tr("Drôle", "يضحك", "Haha"),
                        },
                        {
                          type: "bad",
                          Icon: ThumbsDown,
                          color: "#94A3B8",
                          label: tr("Bof", "خايب", "Bad"),
                        },
                        {
                          type: "ugly",
                          Icon: Ghost,
                          color: "#818CF8",
                          label: tr("Moche", "ماسط", "Ugly"),
                        },
                        {
                          type: "interesting",
                          Icon: Sparkles,
                          color: "#A855F7",
                          label: tr("Top", "طيارة", "Cool"),
                        },
                        ...(isViral(selectedWork)
                          ? [
                              {
                                type: "trendy",
                                Icon: Star,
                                color: "#FFD700",
                                label: tr("Viral", "ترند", "Trendy"),
                              },
                            ]
                          : []),
                      ].map((btn) => {
                        const isSelected =
                          selectedWork?.userReactions?.[user?.uid] === btn.type;
                        const count = selectedWork?.reactions?.[btn.type] || 0;
                        const hasActivity = count > 0;
                        const showColor = isSelected || hasActivity;

                        const itemCount = isViral(selectedWork) ? 7 : 6;
                        const itemWidth = (width * 0.94 - 32) / itemCount;

                        return (
                          <TouchableOpacity
                            key={btn.type}
                            onPress={() => handleReact(selectedWork, btn.type)}
                            activeOpacity={0.7}
                            style={{ alignItems: "center", width: itemWidth }}
                          >
                            <View
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 19,
                                backgroundColor: isSelected
                                  ? btn.color + "20"
                                  : "transparent",
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: showColor ? 1.5 : 1,
                                borderColor: showColor
                                  ? btn.color
                                  : theme === "dark"
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.05)",
                                marginBottom: 4,
                              }}
                            >
                              <btn.Icon
                                size={20}
                                color={
                                  showColor
                                    ? btn.color
                                    : theme === "dark"
                                      ? "rgba(255,255,255,0.7)"
                                      : "rgba(0,0,0,0.3)"
                                }
                                fill="transparent"
                                strokeWidth={isSelected ? 3 : 1.5}
                              />
                            </View>
                            <Text
                              style={{
                                color: showColor
                                  ? btn.color
                                  : theme === "dark"
                                    ? "rgba(255,255,255,0.7)"
                                    : "rgba(0,0,0,0.5)",
                                fontSize: 8,
                                fontWeight: "800",
                                marginBottom: 2,
                              }}
                            >
                              {btn.label.toUpperCase()}
                            </Text>
                            <Text
                              style={{
                                color: colors.foreground,
                                fontSize: 10,
                                fontWeight: "900",
                              }}
                            >
                              {count}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Comments Section Container */}
                    <View style={{ paddingHorizontal: 16 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 16,
                        }}
                      >
                        <MessageSquare size={18} color={colors.foreground} />
                        <Text
                          style={{
                            color: colors.foreground,
                            fontWeight: "800",
                            fontSize: 15,
                          }}
                        >
                          {tr("Commentaires", "تعليقات", "Comments")} (
                          {comments.length})
                        </Text>
                      </View>

                      {loadingComments ? (
                        <ActivityIndicator
                          color={colors.accent}
                          style={{ marginTop: 20 }}
                        />
                      ) : comments.length === 0 ? (
                        <View style={{ padding: 40, alignItems: "center" }}>
                          <MessageSquare
                            size={40}
                            color={colors.foreground}
                            style={{ opacity: 0.2, marginBottom: 12 }}
                          />
                          <Text
                            style={{
                              color: colors.foreground,
                              textAlign: "center",
                              fontSize: 13,
                              opacity: 0.6,
                              fontWeight: "800",
                            }}
                          >
                            {tr(
                              "Soyez le premier à commenter",
                              "كن أول من يعلق",
                              "Be the first to comment",
                            )}
                          </Text>
                        </View>
                      ) : (
                        (() => {
                          // More robust filter for top-level comments
                          const topLevelComments = comments.filter(
                            (c) =>
                              !c.parentCommentId ||
                              c.parentCommentId === "root" ||
                              c.parentCommentId === "",
                          );

                          // If for some reason we have comments but the filter returns nothing, fall back to showing all comments as top-level
                          const displayComments =
                            topLevelComments.length > 0
                              ? topLevelComments
                              : comments;

                          return displayComments.map((comment) => {
                            const replies = comments.filter(
                              (r) => r.parentCommentId === comment.id,
                            );
                            const isExpanded = expandedReplies.includes(
                              comment.id,
                            );

                            const renderComment = (
                              item: any,
                              isReply = false,
                            ) => (
                              <View
                                key={item.id}
                                style={{
                                  marginBottom: isReply ? 12 : 16,
                                  flexDirection: "row",
                                  gap: 12,
                                }}
                              >
                                <View
                                  style={{
                                    width: isReply ? 28 : 36,
                                    height: isReply ? 28 : 36,
                                    borderRadius: isReply ? 14 : 18,
                                    backgroundColor:
                                      colors.surface ||
                                      (theme === "dark"
                                        ? "#1A1A24"
                                        : "#F2F2F7"),
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderWidth: 1,
                                    borderColor:
                                      theme === "dark"
                                        ? "rgba(255,255,255,0.05)"
                                        : "rgba(0,0,0,0.05)",
                                  }}
                                >
                                  {item.userAvatar ? (
                                    <Image
                                      source={{ uri: item.userAvatar }}
                                      style={{
                                        width: isReply ? 28 : 36,
                                        height: isReply ? 28 : 36,
                                        borderRadius: isReply ? 14 : 18,
                                      }}
                                    />
                                  ) : (
                                    <Text
                                      style={{
                                        color: colors.foreground,
                                        fontSize: isReply ? 10 : 12,
                                        fontWeight: "900",
                                      }}
                                    >
                                      {getInitials(item.userName)}
                                    </Text>
                                  )}
                                </View>
                                <View
                                  style={{
                                    flex: 1,
                                    backgroundColor:
                                      colors.surface ||
                                      (theme === "dark"
                                        ? "#1A1A24"
                                        : "#F2F2F7"),
                                    padding: 10,
                                    borderRadius: 15,
                                    borderWidth: 1,
                                    borderColor:
                                      theme === "dark"
                                        ? "rgba(255,255,255,0.05)"
                                        : "rgba(0,0,0,0.05)",
                                  }}
                                >
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <View style={{ flex: 1 }}>
                                      <Text
                                        style={{
                                          color: colors.foreground,
                                          fontWeight: "800",
                                          fontSize: 13,
                                        }}
                                      >
                                        {item.userName}
                                      </Text>
                                    </View>
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 10,
                                      }}
                                    >
                                      {(() => {
                                        const isCommentAuthor =
                                          item.userId === user?.uid;
                                        // If we are on our own profile, we are the post owner
                                        const isPostOwner = isOwnProfile;

                                        if (isCommentAuthor || isPostOwner) {
                                          return (
                                            <TouchableOpacity
                                              hitSlop={{
                                                top: 12,
                                                bottom: 12,
                                                left: 12,
                                                right: 12,
                                              }}
                                              style={{
                                                padding: 4,
                                                borderRadius: 12,
                                                backgroundColor:
                                                  theme === "dark"
                                                    ? "rgba(255,255,255,0.08)"
                                                    : "rgba(0,0,0,0.04)",
                                                marginRight: -4,
                                              }}
                                              onPress={() => {
                                                const options: any[] = [
                                                  {
                                                    text: tr(
                                                      "Annuler",
                                                      "إلغاء",
                                                      "Cancel",
                                                    ),
                                                    style: "cancel",
                                                  },
                                                ];

                                                if (isCommentAuthor) {
                                                  options.push({
                                                    text: tr(
                                                      "Modifier",
                                                      "تعديل",
                                                      "Edit",
                                                    ),
                                                    onPress: () => {
                                                      setEditingComment(item);
                                                      setCommentText(item.text);
                                                    },
                                                  });
                                                }

                                                options.push({
                                                  text: tr(
                                                    "Supprimer",
                                                    "حذف",
                                                    "Delete",
                                                  ),
                                                  style: "destructive",
                                                  onPress: () =>
                                                    handleDeleteComment(
                                                      item.id,
                                                    ),
                                                });

                                                Alert.alert(
                                                  tr(
                                                    "Options",
                                                    "خيارات",
                                                    "Options",
                                                  ),
                                                  "",
                                                  options,
                                                );
                                              }}
                                            >
                                              <MoreVertical
                                                size={18}
                                                color={colors.foreground}
                                                style={{ opacity: 0.9 }}
                                              />
                                            </TouchableOpacity>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </View>
                                  </View>
                                  <Text
                                    style={{
                                      color: colors.foreground,
                                      fontSize: 13,
                                      marginTop: 4,
                                      lineHeight: 18,
                                    }}
                                  >
                                    {item.text}
                                  </Text>
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      marginTop: 10,
                                    }}
                                  >
                                    <TouchableOpacity
                                      onPress={() => {
                                        setReplyingTo(item);
                                        setCommentText(`@${item.userName} `);
                                      }}
                                    >
                                      <Text
                                        style={{
                                          color: "#A855F7",
                                          fontSize: 11,
                                          fontWeight: "900",
                                        }}
                                      >
                                        {tr("Répondre", "رد", "Reply")}
                                      </Text>
                                    </TouchableOpacity>

                                    {/* Small Reactions List */}
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        gap: 6,
                                        alignItems: "center",
                                      }}
                                    >
                                      {[
                                        {
                                          type: "love",
                                          Icon: Heart,
                                          color: "#FF4D67",
                                        },
                                        {
                                          type: "fire",
                                          Icon: Flame,
                                          color: "#FF8A00",
                                        },
                                        {
                                          type: "haha",
                                          Icon: Laugh,
                                          color: "#FFD600",
                                        },
                                        {
                                          type: "bad",
                                          Icon: ThumbsDown,
                                          color: "#94A3B8",
                                        },
                                        {
                                          type: "ugly",
                                          Icon: Ghost,
                                          color: "#818CF8",
                                        },
                                        {
                                          type: "interesting",
                                          Icon: Sparkles,
                                          color: "#A855F7",
                                        },
                                      ].map((reac) => {
                                        const isSelected =
                                          item.userReactions?.[user?.uid] ===
                                          reac.type;
                                        const count =
                                          item.reactions?.[reac.type] || 0;
                                        return (
                                          <TouchableOpacity
                                            key={reac.type}
                                            onPress={() =>
                                              handleCommentReact(
                                                item,
                                                reac.type,
                                              )
                                            }
                                            style={{
                                              flexDirection: "row",
                                              alignItems: "center",
                                              gap: 2,
                                            }}
                                          >
                                            <reac.Icon
                                              size={14}
                                              color={
                                                isSelected
                                                  ? reac.color
                                                  : theme === "dark"
                                                    ? "rgba(255,255,255,0.7)"
                                                    : "rgba(0,0,0,0.3)"
                                              }
                                              fill="transparent"
                                              strokeWidth={
                                                isSelected ? 2.5 : 1.5
                                              }
                                            />
                                            {count > 0 && (
                                              <Text
                                                style={{
                                                  color: isSelected
                                                    ? reac.color
                                                    : colors.secondary,
                                                  fontSize: 10,
                                                  fontWeight: "800",
                                                }}
                                              >
                                                {count}
                                              </Text>
                                            )}
                                          </TouchableOpacity>
                                        );
                                      })}
                                    </View>
                                  </View>
                                </View>
                              </View>
                            );

                            return (
                              <View key={comment.id}>
                                {renderComment(comment)}
                                {replies.length > 0 && (
                                  <View
                                    style={{ marginLeft: 48, marginBottom: 12 }}
                                  >
                                    <TouchableOpacity
                                      onPress={() =>
                                        setExpandedReplies((prev) =>
                                          prev.includes(comment.id)
                                            ? prev.filter(
                                                (id) => id !== comment.id,
                                              )
                                            : [...prev, comment.id],
                                        )
                                      }
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 8,
                                        paddingVertical: 4,
                                      }}
                                    >
                                      <View
                                        style={{
                                          height: 1,
                                          width: 20,
                                          backgroundColor: colors.foreground,
                                          opacity: 0.2,
                                        }}
                                      />
                                      <Text
                                        style={{
                                          color: colors.foreground,
                                          fontSize: 11,
                                          fontWeight: "900",
                                          opacity: 0.7,
                                        }}
                                      >
                                        {isExpanded
                                          ? tr(
                                              "Masquer les réponses",
                                              "إخفاء الردود",
                                              "Hide replies",
                                            )
                                          : `${tr("Voir", "عرض", "View")} ${replies.length} ${tr("réponses", "ردود", "replies")}`}
                                      </Text>
                                    </TouchableOpacity>
                                    {isExpanded &&
                                      replies.map((reply) =>
                                        renderComment(reply, true),
                                      )}
                                  </View>
                                )}
                              </View>
                            );
                          });
                        })()
                      )}
                    </View>
                  </View>
                </ScrollView>

                {/* Fixed Bottom Input Area */}
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    paddingBottom: Platform.OS === "ios" ? 24 : 12,
                    borderTopWidth: 1,
                    borderColor:
                      theme === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                    backgroundColor: colors.background,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor:
                        colors.surface ||
                        (theme === "dark" ? "#1A1A24" : "#F2F2F7"),
                      borderRadius: 24,
                      paddingHorizontal: 16,
                      height: 48,
                      borderWidth: 1,
                      borderColor:
                        theme === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                    }}
                  >
                    <TextInput
                      style={{
                        flex: 1,
                        color: colors.foreground,
                        fontSize: 14,
                      }}
                      placeholder={tr(
                        "Écrire un commentaire...",
                        "اكتب تعليقاً...",
                        "Write a comment...",
                      )}
                      placeholderTextColor={
                        theme === "dark"
                          ? "rgba(255,255,255,0.6)"
                          : "rgba(0,0,0,0.4)"
                      }
                      value={commentText}
                      onChangeText={setCommentText}
                    />
                    <TouchableOpacity
                      onPress={handleComment}
                      disabled={!commentText.trim()}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor:
                          theme === "dark"
                            ? "rgba(0,0,0,0.5)"
                            : "rgba(0,0,0,0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Send
                        size={18}
                        color={
                          commentText.trim()
                            ? "rgba(255,255,255,1)"
                            : theme === "dark"
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.1)"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                  {editingComment && (
                    <TouchableOpacity
                      onPress={() => {
                        setEditingComment(null);
                        setCommentText("");
                      }}
                      style={{ marginTop: 8, paddingLeft: 12 }}
                    >
                      <Text
                        style={{
                          color: colors.accent,
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {tr(
                          "Annuler modification",
                          "إلغاء التعديل",
                          "Cancel edit",
                        )}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Quick Exchange Modal */}
      <Modal visible={showQuickExchange} transparent animationType="fade">
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 28,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.border,
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
                  fontSize: 18,
                  fontWeight: "900",
                  color: colors.foreground,
                }}
              >
                {tr("Échanger des actifs", "تبادل الأصول", "Exchange Assets")}
              </Text>
              <TouchableOpacity onPress={() => setShowQuickExchange(false)}>
                <X size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: "row",
                backgroundColor: theme === "dark" ? "#1c1c1e" : "#f2f2f7",
                borderRadius: 15,
                padding: 4,
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => setExchangeType("diamondsToCoins")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor:
                    exchangeType === "diamondsToCoins"
                      ? colors.foreground
                      : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color:
                      exchangeType === "diamondsToCoins"
                        ? theme === "dark"
                          ? "#000"
                          : "#FFF"
                        : colors.textMuted,
                  }}
                >
                  {tr("DIAMANTS → PIÈCES", "ألماس ← عملات", "DIAMONDS → COINS")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setExchangeType("coinsToDiamonds")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor:
                    exchangeType === "coinsToDiamonds"
                      ? colors.foreground
                      : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color:
                      exchangeType === "coinsToDiamonds"
                        ? theme === "dark"
                          ? "#000"
                          : "#FFF"
                        : colors.textMuted,
                  }}
                >
                  {tr("PIÈCES → DIAMANTS", "عملات ← ألماس", "COINS → DIAMONDS")}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={{
                backgroundColor: theme === "dark" ? "#1c1c1e" : "#f2f2f7",
                borderRadius: 15,
                padding: 15,
                color: colors.foreground,
                fontSize: 16,
                fontWeight: "700",
                marginBottom: 15,
              }}
              placeholder={tr(
                "Montant à échanger",
                "المبلغ للتبادل",
                "Amount to exchange",
              )}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={exchangeAmount}
              onChangeText={setExchangeAmount}
            />

            {exchangeType === "coinsToDiamonds" && exchangeAmount !== "" && (
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  marginBottom: 15,
                  textAlign: "center",
                }}
              >
                {tr(
                  "Coût total (avec 30% frais):",
                  "التكلفة الإجمالية (مع 30% رسوم):",
                  "Total cost (incl. 30% fee):",
                )}{" "}
                <Text style={{ color: colors.foreground, fontWeight: "900" }}>
                  {Math.ceil(parseInt(exchangeAmount) * 1.3) || 0}{" "}
                  {tr("Coins", "عملات", "Coins")}
                </Text>
              </Text>
            )}

            <TouchableOpacity
              disabled={isProcessingExchange || !exchangeAmount}
              onPress={handleConfirmQuickExchange}
              style={{
                backgroundColor: colors.foreground,
                borderRadius: 15,
                paddingVertical: 15,
                alignItems: "center",
              }}
            >
              {isProcessingExchange ? (
                <ActivityIndicator color={theme === "dark" ? "#000" : "#FFF"} />
              ) : (
                <Text
                  style={{
                    color: theme === "dark" ? "#000" : "#FFF",
                    fontWeight: "900",
                  }}
                >
                  {tr("CONFIRMER", "تأكيد", "CONFIRM")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transfer Diamonds Modal */}
      <Modal visible={showTransferModal} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              padding: 24,
              minHeight: height * 0.7,
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
                  fontSize: 20,
                  fontWeight: "900",
                  color: colors.foreground,
                }}
              >
                {tr(
                  "Transférer des Diamants",
                  "تحويل الألماس",
                  "Transfer Diamonds",
                )}
              </Text>
              <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                <X size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: "row",
                backgroundColor: theme === "dark" ? "#1c1c1e" : "#f2f2f7",
                borderRadius: 15,
                paddingHorizontal: 15,
                height: 50,
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Search size={20} color={colors.textMuted} />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 10,
                  color: colors.foreground,
                  fontWeight: "600",
                }}
                placeholder={tr(
                  "Rechercher un utilisateur...",
                  "بحث عن مستخدم...",
                  "Search user...",
                )}
                placeholderTextColor={colors.textMuted}
                value={transferSearchQuery}
                onChangeText={handleSearchUsers}
              />
            </View>

            {selectedTransferUser ? (
              <View
                style={{
                  backgroundColor: theme === "dark" ? "#1c1c1e" : "#f2f2f7",
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Image
                      source={
                        selectedTransferUser.avatarUrl
                          ? { uri: selectedTransferUser.avatarUrl }
                          : APP_ICON
                      }
                      style={{ width: 44, height: 44, borderRadius: 22 }}
                    />
                    <View>
                      <Text
                        style={{ color: colors.foreground, fontWeight: "800" }}
                      >
                        {selectedTransferUser.fullName}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                        {selectedTransferUser.displayName}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedTransferUser(null)}
                  >
                    <X size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <View style={{ marginTop: 20 }}>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 10,
                      fontWeight: "800",
                      marginBottom: 10,
                    }}
                  >
                    {tr(
                      "MONTANT À TRANSFÉRER",
                      "المبلغ للتحويل",
                      "AMOUNT TO TRANSFER",
                    ).toUpperCase()}
                  </Text>
                  <TextInput
                    style={{
                      fontSize: 24,
                      fontWeight: "900",
                      color: colors.foreground,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      paddingBottom: 10,
                    }}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={transferAmount}
                    onChangeText={setTransferAmount}
                  />
                  <TouchableOpacity
                    disabled={isProcessingExchange || !transferAmount}
                    onPress={handleQuickTransfer}
                    style={{
                      backgroundColor: colors.foreground,
                      borderRadius: 15,
                      paddingVertical: 15,
                      alignItems: "center",
                      marginTop: 30,
                    }}
                  >
                    <Text
                      style={{
                        color: theme === "dark" ? "#000" : "#FFF",
                        fontWeight: "900",
                      }}
                    >
                      {tr("ENVOYER DIAMANTS", "إرسال الألماس", "SEND DIAMONDS")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <FlatList
                data={transferSearchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedTransferUser(item)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Image
                      source={
                        item.avatarUrl ? { uri: item.avatarUrl } : APP_ICON
                      }
                      style={{ width: 44, height: 44, borderRadius: 22 }}
                    />
                    <View>
                      <Text
                        style={{ color: colors.foreground, fontWeight: "700" }}
                      >
                        {item.fullName}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                        {item.displayName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={{ alignItems: "center", marginTop: 50 }}>
                    {isSearchingUsers ? (
                      <ActivityIndicator color={colors.accent} />
                    ) : (
                      <Text style={{ color: colors.textMuted }}>
                        {transferSearchQuery
                          ? tr(
                              "Aucun utilisateur trouvé",
                              "لم يتم العثور على مستخدم",
                              "No user found",
                            )
                          : tr(
                              "Tapez au moins 3 caractères",
                              "اكتب 3 أحرف على الأقل",
                              "Type at least 3 characters",
                            )}
                      </Text>
                    )}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Store QR Code Modal */}
      <Modal
        visible={showStoreQRModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStoreQRModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              padding: 25,
              paddingBottom: insets.bottom + 20,
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
                  fontSize: 20,
                  fontWeight: "900",
                  color: colors.foreground,
                }}
              >
                {t("storeQRCode")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowStoreQRModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: "center", marginVertical: 20 }}>
              <View
                style={{
                  padding: 20,
                  backgroundColor: "#FFF",
                  borderRadius: 20,
                }}
              >
                <QRCode
                  value={`bey3a://store/${profileData?.brandId || profileData?.uid || profileData?.id}`}
                  size={200}
                  color="#000"
                  backgroundColor="#FFF"
                />
              </View>
              <Text
                style={{
                  color: colors.textMuted,
                  marginTop: 20,
                  textAlign: "center",
                  paddingHorizontal: 20,
                }}
              >
                {t("storeQRDescription")}
              </Text>
            </View>

            <TouchableOpacity
              onPress={async () => {
                const logoAsset = Image.resolveAssetSource(LOGO);
                const logoUri = logoAsset ? logoAsset.uri : "";
                const html = `
                  <html>
                    <head>
                      <style>
                        body { font-family: sans-serif; text-align: center; padding: 50px; }
                        .qr-container { margin: 50px auto; width: 300px; height: 300px; border: 20px solid #000; padding: 20px; border-radius: 40px; }
                        h1 { font-size: 40px; margin-bottom: 10px; }
                        p { font-size: 20px; color: #666; }
                        .logo-container { 
                          margin-top: 50px; 
                          margin-bottom: 20px; 
                          display: flex; 
                          justify-content: center; 
                          align-items: center; 
                        }
                      .logo-box {
                        width: 80px;
                        height: 80px;
                        background: #000;
                        border-radius: 22px;
                        overflow: hidden;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        box-shadow: 0 8px 15px rgba(0,0,0,0.1);
                      }
                       .app-logo {
                        max-width: 70%;
                        max-height: 70%;
                        object-fit: contain;
                        background: transparent;
                      }
                        .footer-container {
                          margin-top: 40px;
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          gap: 10px;
                        }
                        .footer-logo-box {
                          width: 40px;
                          height: 40px;
                          background-color: #000;
                          border-radius: 12px;
                          display: flex;
                          justify-content: center;
                          align-items: center;
                          box-shadow: 0 8px 15px rgba(0,0,0,0.1);
                        }
                        .footer-logo {
                          max-width: 65%;
                          max-height: 65%;
                          object-fit: contain;
                        }
                        .footer-text {
                          font-size: 14px;
                          color: #999;
                          font-weight: 600;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="logo-container">
                        ${logoUri ? `<div class="logo-box"><img src="${logoUri}" class="app-logo" /></div>` : '<h1 style="color: #6C63FF">BEY3A</h1>'}
                      </div>
                      <h1>${getName(brandInfo?.name, displayName)}</h1>
                      <p>${t("scanToGetDiscounts")}</p>
                      <div class="qr-container">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=bey3a://store/${profileData?.brandId || profileData?.uid || profileData?.id}" style="width: 100%; height: 100%;" />
                      </div>
                      <div class="footer-container">
                        ${logoUri ? `<div class="footer-logo-box"><img src="${logoUri}" class="footer-logo" /></div>` : ""}
                        <span class="footer-text">${t("poweredByBey3aLabel")}</span>
                      </div>
                    </body>
                  </html>
                `;
                try {
                  await Print.printAsync({ html });
                } catch (error) {
                  console.log("Printing cancelled or failed:", error);
                }
              }}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 20,
                paddingVertical: 18,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <Printer size={20} color="#FFF" />
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 16 }}>
                {t("printQRCode")}
              </Text>
            </TouchableOpacity>

            {/* Manage Discount Section */}
            <View
              style={{
                marginTop: 20,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => setEditingDiscount(!editingDiscount)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: editingDiscount ? 15 : 0,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Settings size={20} color={colors.foreground} />
                  <Text style={{ fontWeight: "700", color: colors.foreground }}>
                    {t("manageDiscount")}
                  </Text>
                </View>
                <ChevronRight
                  size={20}
                  color={colors.textMuted}
                  style={{
                    transform: [{ rotate: editingDiscount ? "90deg" : "0deg" }],
                  }}
                />
              </TouchableOpacity>

              {editingDiscount && (
                <View>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textMuted,
                      marginBottom: 8,
                    }}
                  >
                    {t("discountPercentage")}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TextInput
                      style={{
                        flex: 1,
                        backgroundColor:
                          theme === "dark" ? "#17171F" : "#F9F9F9",
                        padding: 15,
                        borderRadius: 12,
                        color: colors.foreground,
                        fontWeight: "700",
                        fontSize: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                      value={storeDiscountValue}
                      onChangeText={setStoreDiscountValue}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                    <TouchableOpacity
                      onPress={handleUpdateDiscount}
                      disabled={updatingDiscount}
                      style={{
                        backgroundColor: colors.accent,
                        paddingHorizontal: 25,
                        borderRadius: 12,
                        justifyContent: "center",
                        opacity: updatingDiscount ? 0.6 : 1,
                      }}
                    >
                      {updatingDiscount ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={{ color: "#FFF", fontWeight: "800" }}>
                          {t("saveSettings")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FollowManagementScreen({
  onBack,
  followedCollabs,
  toggleFollowCollab,
  setSelectedCollab,
  setActiveTab,
  t,
  language,
  theme,
}: any) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  useEffect(() => {
    if (!followedCollabs || followedCollabs.length === 0) {
      setList([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe: () => void;

    try {
      const q = query(
        collection(db, "collaborations"),
        where("__name__", "in", followedCollabs),
      );
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setList(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching followed collabs:", error);
          setLoading(false);
        },
      );
    } catch (e) {
      console.error("Setup error:", e);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [followedCollabs]);

  const getName = (field: any) => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return (
      field[language === "ar" ? "ar-tn" : language] ||
      field[language] ||
      field["fr"] ||
      field["en"] ||
      Object.values(field)[0] ||
      ""
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Blur Header */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 64 + insets.top,
            paddingTop: insets.top,
            borderBottomWidth: headerOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            borderBottomColor:
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          },
        ]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}
        >
          <BlurView
            intensity={80}
            style={StyleSheet.absoluteFill}
            tint={theme}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.background + "66" },
            ]}
          />
        </Animated.View>

        <View
          style={[
            styles.modernHeader,
            { borderBottomWidth: 0, backgroundColor: "transparent" },
          ]}
        >
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtnSmall,
              { backgroundColor: theme === "dark" ? "#17171F" : "#F2F2F7" },
            ]}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.modernLogo, { color: colors.foreground }]}
          >
            {t("follow").toUpperCase()}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingTop: 80 + insets.top,
          paddingBottom: 100,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 50 }} />
        ) : list.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 100 }}>
            <ShoppingBag size={64} color={colors.border} strokeWidth={1} />
            <Text
              style={{
                marginTop: 20,
                color: colors.textMuted,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {t("noResults")}
            </Text>
          </View>
        ) : (
          list.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                setSelectedCollab(item);
                setActiveTab("CollabDetail");
              }}
              activeOpacity={0.9}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: theme === "dark" ? "#121218" : "#FFF",
                padding: 16,
                borderRadius: 24,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: theme === "dark" ? 0 : 0.05,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{
                    width: width * 0.18,
                    height: width * 0.18,
                    borderRadius: (width * 0.18) / 2,
                    backgroundColor: colors.border,
                    borderWidth: 2,
                    borderColor: colors.border,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    backgroundColor:
                      item.type === "Brand"
                        ? "#FFD700"
                        : item.type === "Person"
                          ? "#A855F7"
                          : item.type === "Company"
                            ? "#3B82F6"
                            : "#22C55E",
                    borderRadius: 12,
                    width: 22,
                    height: 22,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 3,
                    borderColor: theme === "dark" ? "#121218" : "#FFF",
                  }}
                >
                  <CheckCircle2
                    size={10}
                    color={theme === "dark" ? "#121218" : "#FFF"}
                  />
                </View>
              </View>

              <View style={{ flex: 1, marginLeft: 16 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 16,
                      fontWeight: "900",
                      color: colors.foreground,
                      letterSpacing: 0.5,
                    }}
                  >
                    {getName(item.name).toUpperCase()}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11,
                    color: colors.textMuted,
                    marginTop: 4,
                    fontWeight: "700",
                    letterSpacing: 1,
                  }}
                >
                  {item.type?.toUpperCase() || "PARTNER"}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <UsersIcon size={10} color={colors.textMuted} />
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "800",
                        color: colors.foreground,
                      }}
                    >
                      {item.followersCount
                        ? item.followersCount >= 1000
                          ? `${(item.followersCount / 1000).toFixed(1)}k`
                          : item.followersCount
                        : "0"}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 1,
                      height: 10,
                      backgroundColor: colors.border,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "800",
                      color: colors.accent,
                    }}
                  >
                    {t("viewDetails") || "DÉTAILS"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => toggleFollowCollab(item.id)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor:
                    theme === "dark" ? "rgba(255,69,58,0.1)" : "#FFF5F5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={16} color={colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </Animated.ScrollView>
    </View>
  );
}

function WishlistScreen({
  onBack,
  onProductPress,
  wishlist,
  toggleWishlist,
  addToCart,
  t,
  theme,
  language,
}: any) {
  const { colors } = useAppTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const HEADER_HEIGHT = 64 + insets.top;
  const CARD_HEIGHT = useRef(
    height - (190 + insets.top + (Platform.OS === "ios" ? 130 : 80)),
  ).current;
  const ITEM_HEIGHT = CARD_HEIGHT + 20;

  useEffect(() => {
    fetchWishlistProducts();
  }, [wishlist]);

  const fetchWishlistProducts = async () => {
    if (wishlist.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const q = query(
        collection(db, "products"),
        where("__name__", "in", wishlist),
      );
      const snap = await getDocs(q);
      setProducts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      {/* Fixed Header matching ShopScreen style */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: HEADER_HEIGHT,
          paddingTop: insets.top,
          backgroundColor: colors.background,
          borderBottomWidth: scrolled ? 1 : 0,
          borderBottomColor:
            theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        }}
      >
        <View style={styles.modernHeader}>
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtnSmall,
              { backgroundColor: theme === "dark" ? "#000" : "#F2F2F7" },
            ]}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text
            pointerEvents="none"
            style={[
              styles.modernLogo,
              { letterSpacing: 4, color: colors.foreground },
            ]}
          >
            {t("wishlist").toUpperCase()}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item: any) => item.id}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          setScrolled(y > 10);
          scrollY.setValue(y);
        }}
        scrollEventThrottle={16}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        snapToAlignment="start"
        removeClippedSubviews={true}
        maxToRenderPerBatch={4}
        windowSize={5}
        initialNumToRender={3}
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT + 20,
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              style={{ marginTop: 50 }}
              color={colors.foreground}
            />
          ) : (
            <View
              style={[
                styles.centered,
                { marginTop: 100, backgroundColor: colors.background },
              ]}
            >
              <Heart size={64} color={theme === "dark" ? "#222" : "#EEE"} />
              <Text
                style={[
                  styles.modernSectionTitle,
                  { marginTop: 20, color: colors.textMuted },
                ]}
              >
                {t("nothingSaved")}
              </Text>
            </View>
          )
        }
        renderItem={({ item: p }) => (
          <View style={{ height: CARD_HEIGHT, marginBottom: 20 }}>
            <ProductCard
              product={p}
              onPress={() => onProductPress(p)}
              isWishlisted={true}
              onToggleWishlist={() => toggleWishlist(p.id)}
              onAddToCart={() => addToCart(p)}
              showRating={true}
              t={t}
              theme={theme}
              language={language}
              colors={colors}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function OrdersScreen({ onBack, onTrack, t, language }: any) {
  const { colors, theme } = useAppTheme();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingItem, setReviewingItem] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const submitReview = async () => {
    if (!reviewingItem) return;
    try {
      const productId = reviewingItem.item.id || reviewingItem.item.productId;
      console.log("Submitting review for product:", productId);
      console.log("Review item:", reviewingItem.item);

      const reviewData = {
        productId: productId,
        orderId: reviewingItem.orderId,
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || t("customer"),
        rating,
        comment: reviewComment,
        createdAt: serverTimestamp(),
      };

      console.log("Review data:", reviewData);

      // Add review to reviews collection
      await addDoc(collection(db, "reviews"), reviewData);

      // Mark item as reviewed in the order
      const orderRef = doc(db, "orders", reviewingItem.orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const updatedItems = orderData.items.map((item: any) => {
          if ((item.id || item.productId) === productId) {
            return { ...item, reviewed: true };
          }
          return item;
        });
        await updateDoc(orderRef, { items: updatedItems });
      }

      // Update global product rating
      await updateProductRating(productId);

      Alert.alert(t("featured"), t("reviewSubmitted"));
      setReviewingItem(null);
      setReviewComment("");
      setRating(5);
      // Refresh orders to show updated review status
      fetchOrders();
    } catch (e) {
      console.error("Review submission error:", e);
      Alert.alert(t("cancel"), t("reviewFailed"));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "orders"),
        where("customer.uid", "==", auth.currentUser?.uid),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as any,
      );
      // Sort client-side to avoid index requirement for now
      list.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
      );
      setOrders(list);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "#27ae60";
      case "pending":
        return "#f39c12";
      case "shipped":
        return "#9b59b6";
      case "cancelled":
        return "#e74c3c";
      default:
        return "#3498db";
    }
  };

  const statusMap: any = {
    pending: "statusPending",
    delivered: "statusDelivered",
    shipped: "statusShipped",
    cancelled: "statusCancelled",
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      {/* Animated Blur Header */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 64 + insets.top,
            paddingTop: insets.top,
            borderBottomWidth: headerOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            borderBottomColor:
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          },
        ]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}
        >
          <BlurView
            intensity={80}
            style={StyleSheet.absoluteFill}
            tint={theme}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.background + "66" },
            ]}
          />
        </Animated.View>

        <View style={styles.modernHeader}>
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtnSmall,
              { backgroundColor: theme === "dark" ? "#0A0A0A" : "#F2F2F7" },
            ]}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modernLogo, { color: colors.foreground }]}>
            {t("myOrders")}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 64 + insets.top }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {loading ? (
          <ActivityIndicator
            color={colors.foreground}
            style={{ marginTop: 50 }}
          />
        ) : orders.length === 0 ? (
          <View
            style={[
              styles.centered,
              { marginTop: 100, backgroundColor: colors.background },
            ]}
          >
            <Package size={64} color={theme === "dark" ? "#222" : "#EEE"} />
            <Text
              style={[
                styles.modernSectionTitle,
                { marginTop: 20, color: colors.textMuted },
              ]}
            >
              {t("noOrders")}
            </Text>
          </View>
        ) : (
          orders.map((order, index) => (
            <View
              key={order.id}
              style={[
                styles.orderCard,
                {
                  backgroundColor: theme === "dark" ? "#121218" : "white",
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.orderHeader}>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={[styles.orderId, { color: colors.foreground }]}
                    >
                      {order.trackingId
                        ? order.trackingId
                        : t("orderNumber") + order.id.slice(-6).toUpperCase()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        Clipboard.setString(order.trackingId || order.id);
                        Alert.alert(
                          language === "ar"
                            ? "تم النسخ"
                            : language === "fr"
                              ? "Copié !"
                              : "Copied!",
                          t("commandCopied"),
                          [{ text: "OK" }],
                        );
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Copy size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  {!order.trackingId && (
                    <Text
                      style={[styles.orderDate, { color: colors.textMuted }]}
                    >
                      {order.createdAt?.toDate().toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.statusTag,
                    { backgroundColor: getStatusColor(order.status) + "15" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(order.status) },
                    ]}
                  >
                    {t(statusMap[order.status] || order.status)}
                  </Text>
                </View>
              </View>

              {/* Product Details - Show first product with name, size, color */}
              {order.items?.[0] && (
                <View
                  style={[
                    styles.productDetailsRow,
                    {
                      backgroundColor: theme === "dark" ? "#1A1A24" : "#F8F8FA",
                    },
                  ]}
                >
                  <Image
                    source={{ uri: order.items[0].mainImage }}
                    style={[
                      styles.productDetailImage,
                      {
                        backgroundColor:
                          theme === "dark" ? "#2A2A35" : "#E8E8EC",
                      },
                    ]}
                  />
                  <View style={styles.productDetailInfo}>
                    <Text
                      style={[
                        styles.productDetailName,
                        { color: colors.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {getName(order.items[0].name).toUpperCase()}
                    </Text>
                    <View style={styles.productDetailMeta}>
                      {order.items[0].selectedSize && (
                        <Text
                          style={[
                            styles.variantText,
                            { color: colors.textMuted },
                          ]}
                        >
                          {t("size")} : {order.items[0].selectedSize}
                        </Text>
                      )}
                      {order.items[0].selectedSize &&
                        order.items[0].selectedColor && (
                          <Text
                            style={[
                              styles.variantDot,
                              { color: colors.border },
                            ]}
                          >
                            {" "}
                            ,{" "}
                          </Text>
                        )}
                      {order.items[0].selectedColor && (
                        <View style={styles.colorSwatchContainer}>
                          <Text
                            style={[
                              styles.variantText,
                              { color: colors.textMuted },
                            ]}
                          >
                            {t("color")} :
                          </Text>
                          <View
                            style={[
                              styles.colorSwatch,
                              {
                                backgroundColor: colorNameToHex(
                                  order.items[0].selectedColor,
                                ),
                              },
                            ]}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                  {order.items.length > 1 && (
                    <View
                      style={[
                        styles.moreItemsBadge,
                        { backgroundColor: colors.accent + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.moreItemsText, { color: colors.accent }]}
                      >
                        +{order.items.length - 1}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.orderFooter}>
                <Text
                  style={[styles.orderTotalLabel, { color: colors.textMuted }]}
                >
                  {t("total")}
                </Text>
                <Text
                  style={[styles.orderTotalValue, { color: colors.foreground }]}
                >
                  {order.total.toFixed(2)} TND
                </Text>
              </View>

              {order.trackingId ? (
                <TouchableOpacity
                  style={[
                    styles.trackOrderBtn,
                    {
                      backgroundColor: colors.accent + "20",
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={() => onTrack(order.trackingId)}
                >
                  <Truck size={14} color={colors.accent} />
                  <Text
                    style={[styles.trackOrderBtnText, { color: colors.accent }]}
                  >
                    {language === "ar"
                      ? "تتبع الطلبية"
                      : language === "fr"
                        ? "Suivre la commande"
                        : "Track Order"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.trackOrderBtn,
                    {
                      backgroundColor: colors.accent + "20",
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={() => onTrack(order.id)}
                >
                  <Truck size={14} color={colors.accent} />
                  <Text
                    style={[styles.trackOrderBtnText, { color: colors.accent }]}
                  >
                    {language === "ar"
                      ? "تتبع الطلبية"
                      : language === "fr"
                        ? "Suivre la commande"
                        : "Track Order"}
                  </Text>
                </TouchableOpacity>
              )}
              {order.status === "delivered" && (
                <View
                  style={{
                    marginTop: 15,
                    paddingTop: 15,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "900",
                      color: colors.textMuted,
                      marginBottom: 10,
                    }}
                  >
                    {t("leaveReview")}
                  </Text>
                  {order.items?.map((item: any, idx: number) => {
                    const isReviewed = item.reviewed === true;
                    return (
                      <View
                        key={idx}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <Image
                            source={{ uri: item.mainImage }}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 5,
                              backgroundColor:
                                theme === "dark" ? "#000" : "#eee",
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "700",
                              maxWidth: 150,
                              color: colors.foreground,
                            }}
                            numberOfLines={1}
                          >
                            {getName(item.name)}
                          </Text>
                        </View>
                        {isReviewed ? (
                          <View
                            style={{
                              paddingHorizontal: 15,
                              paddingVertical: 6,
                              backgroundColor: "#10B981",
                              borderRadius: 15,
                            }}
                          >
                            <Text
                              style={{
                                color: "white",
                                fontSize: 10,
                                fontWeight: "800",
                              }}
                            >
                              {t("reviewed")}
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() =>
                              setReviewingItem({ orderId: order.id, item })
                            }
                            style={{
                              paddingHorizontal: 15,
                              paddingVertical: 6,
                              backgroundColor: colors.foreground,
                              borderRadius: 15,
                            }}
                          >
                            <Text
                              style={{
                                color: theme === "dark" ? "#000" : "#FFF",
                                fontSize: 10,
                                fontWeight: "800",
                              }}
                            >
                              {t("rate")}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {reviewingItem && (
        <Modal visible={true} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              padding: 25,
            }}
          >
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 25,
                padding: 25,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "900",
                  marginBottom: 5,
                  color: colors.foreground,
                }}
              >
                {t("rateProduct")}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                  marginBottom: 20,
                }}
              >
                {getName(reviewingItem.item.name)}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 10,
                  marginBottom: 25,
                }}
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)}>
                    <Star
                      size={32}
                      color={s <= rating ? "#FFD700" : "#EEE"}
                      fill={s <= rating ? "#FFD700" : "#EEE"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[
                  styles.premiumInput,
                  { height: 100, textAlignVertical: "top" },
                ]}
                placeholder={t("writeReview")}
                multiline
                value={reviewComment}
                onChangeText={setReviewComment}
              />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
                <TouchableOpacity
                  onPress={() => setReviewingItem(null)}
                  style={{
                    flex: 1,
                    padding: 15,
                    backgroundColor: "#F2F2F7",
                    borderRadius: 15,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontWeight: "800" }}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submitReview}
                  style={{
                    flex: 1,
                    padding: 15,
                    backgroundColor: Colors.foreground,
                    borderRadius: 15,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontWeight: "800", color: "white" }}>
                    {t("submit")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// --- QUICK ADD MODAL ---

function QuickAddModal({
  product,
  isVisible,
  onClose,
  onAddToCart,
  onSizeGuide,
  t,
}: any) {
  const { colors, theme } = useAppTheme();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || "M");
      setSelectedColor(product.colors?.[0] || "");
    }
  }, [product]);

  if (!product) return null;

  const handleConfirm = () => {
    onAddToCart(product, selectedSize, selectedColor);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animatable.View
          animation="slideInUp"
          duration={300}
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            padding: 20,
            paddingBottom: height > 800 ? 40 : 25,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.05)",
            maxHeight: height * 0.85,
          }}
        >
          {/* Refined Drag Indicator */}
          <View
            style={{
              width: 32,
              height: 4,
              backgroundColor: theme === "dark" ? colors.secondary : "#E5E5EA",
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 20,
            }}
          />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Product Header Card */}
            <View
              style={{
                flexDirection: "row",
                gap: 15,
                marginBottom: 30,
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <Image
                  source={{
                    uri: product.mainImage || product.image || product.imageUrl,
                  }}
                  style={{
                    width: 100,
                    height: 120,
                    borderRadius: 16,
                    backgroundColor: theme === "dark" ? "#121218" : "#F2F2F7",
                  }}
                />
              </View>
              <View style={{ flex: 1, paddingTop: 5 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  {product.categoryName && (
                    <>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "900",
                          color: colors.textMuted,
                          opacity: 0.5,
                        }}
                      >
                        |
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "900",
                          color: colors.textMuted,
                          letterSpacing: 1.2,
                        }}
                      >
                        {getName(product.categoryName).toUpperCase()}
                      </Text>
                    </>
                  )}
                  {product.subCategoryName && (
                    <>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "900",
                          color: colors.textMuted,
                          opacity: 0.5,
                        }}
                      >
                        |
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "900",
                          color: colors.textMuted,
                          letterSpacing: 1.2,
                        }}
                      >
                        {getName(product.subCategoryName).toUpperCase()}
                      </Text>
                    </>
                  )}
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "900",
                      color: colors.textMuted,
                      opacity: 0.5,
                    }}
                  >
                    |
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      marginRight: 4,
                    }}
                  >
                    <Store size={10} color={colors.accent} />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "900",
                        color: colors.accent,
                        letterSpacing: 1.2,
                      }}
                    >
                      {String(
                        product.brandName || product.marque || "TAMA CLOTHING",
                      ).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "900",
                    color: colors.foreground,
                    letterSpacing: -0.5,
                    lineHeight: 26,
                    marginBottom: 8,
                  }}
                >
                  {String(getName(product.name)).toUpperCase()}
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "900",
                      color: colors.foreground,
                    }}
                  >
                    {product.discountPrice
                      ? product.discountPrice.toFixed(2)
                      : product.price.toFixed(2)}{" "}
                    TND
                  </Text>
                  {product.discountPrice && (
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.textMuted,
                        textDecorationLine: "line-through",
                      }}
                    >
                      {product.price.toFixed(2)} TND
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Colors Filter */}
            {product.colors && product.colors.length > 0 && (
              <View style={{ marginBottom: 25 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 15,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "900",
                      color: colors.foreground,
                      letterSpacing: 1.5,
                    }}
                  >
                    {t("color").toUpperCase()}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      color: colors.textMuted,
                    }}
                  >
                    {translateColor(selectedColor).toUpperCase()}
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}
                >
                  {product.colors.map((c: string) => {
                    const displayColor = c.startsWith("#")
                      ? c
                      : c.toLowerCase();
                    const isSelected = selectedColor === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setSelectedColor(c)}
                        activeOpacity={0.8}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          borderWidth: 2,
                          borderColor: isSelected
                            ? colors.foreground
                            : theme === "dark"
                              ? colors.secondary
                              : "#EEE",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            backgroundColor: displayColor,
                            borderWidth: 1,
                            borderColor:
                              displayColor === "black" ||
                              displayColor === "#000" ||
                              displayColor === "#000000"
                                ? "rgba(255,255,255,0.2)"
                                : "rgba(0,0,0,0.05)",
                          }}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Size Selector */}
            <View style={{ marginBottom: 35 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 15,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "900",
                    color: colors.foreground,
                    letterSpacing: 1.5,
                  }}
                >
                  {t("size").toUpperCase()}
                </Text>
                <TouchableOpacity onPress={onSizeGuide}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "900",
                      color: colors.textMuted,
                    }}
                  >
                    {t("sizeGuide").toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {(product.sizes || ["XS", "S", "M", "L", "XL", "XXL"]).map(
                  (s: string) => {
                    const isSelected = selectedSize === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setSelectedSize(s)}
                        activeOpacity={0.7}
                        style={[
                          {
                            minWidth: 50,
                            height: 48,
                            borderRadius: 16,
                            backgroundColor: isSelected
                              ? colors.foreground
                              : theme === "dark"
                                ? colors.secondary
                                : "#FFFFFF",
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1.5,
                            borderColor: isSelected
                              ? colors.foreground
                              : theme === "dark"
                                ? colors.secondary
                                : "#F2F2F7",
                            paddingHorizontal: 12,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isSelected ? 0.2 : 0.05,
                            shadowRadius: 4,
                            elevation: isSelected ? 4 : 1,
                          },
                          { flexGrow: 0 },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "900",
                            color: isSelected
                              ? theme === "dark"
                                ? "#000"
                                : "#FFF"
                              : colors.foreground,
                          }}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    );
                  },
                )}
              </View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.foreground,
                height: 58,
                borderRadius: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 6,
                marginBottom: 10,
              }}
              onPress={handleConfirm}
              activeOpacity={0.9}
            >
              <ShoppingBag
                size={20}
                color={theme === "dark" ? "#000" : "#FFF"}
                strokeWidth={2.5}
              />
              <Text
                style={{
                  color: theme === "dark" ? "#000" : "#FFF",
                  fontSize: 15,
                  fontWeight: "900",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                {t("addToCart")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animatable.View>
      </TouchableOpacity>
    </Modal>
  );
}

function SettingsScreen({
  onBack,
  profileData,
  updateProfile,
  onNavigate,
  t,
  user,
}: any) {
  const { colors: appColors, theme } = useAppTheme();

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const [name, setName] = useState(profileData?.fullName || "");
  const [phone, setPhone] = useState(profileData?.phone || "");
  const [bio, setBio] = useState<{ en: string; fr: string; ar: string }>(
    typeof profileData?.bio === "object" && profileData?.bio !== null
      ? {
          en: profileData.bio.en || "",
          fr: profileData.bio.fr || "",
          ar: profileData.bio.ar || "",
        }
      : {
          en: profileData?.bio || "",
          fr: profileData?.bio || "",
          ar: profileData?.bio || "",
        },
  );
  const [bioLang, setBioLang] = useState<"en" | "fr" | "ar">("fr");
  const [addresses, setAddresses] = useState<any[]>(
    profileData?.addresses || [],
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [tempAddress, setTempAddress] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [avatar, setAvatar] = useState(profileData?.avatarUrl || null);
  const [loading, setLoading] = useState(false);

  // Profile Sticker Picker State
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [profileStickers, setProfileStickers] = useState<any[]>([]);
  const [stickerLoading, setStickerLoading] = useState(false);
  const [stickerSearchQuery, setStickerSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notifications, setNotifications] = useState(
    profileData?.settings?.notifications ?? true,
  );
  const [faceId, setFaceId] = useState(profileData?.settings?.faceId ?? false);
  const [biometricType, setBiometricType] = useState<string>("");

  useEffect(() => {
    const getBiometricType = async () => {
      try {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          )
        ) {
          setBiometricType("FaceID");
        } else if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          setBiometricType(Platform.OS === "ios" ? "TouchID" : "Fingerprint");
        } else {
          setBiometricType("Biometrics");
        }
      } catch (e) {
        setBiometricType("Biometrics");
      }
    };
    getBiometricType();
  }, []);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (profileData) {
      setName(profileData.fullName || "");
      setPhone(profileData.phone || "");
      setBio(
        typeof profileData.bio === "object" && profileData.bio !== null
          ? {
              en: profileData.bio.en || "",
              fr: profileData.bio.fr || "",
              ar: profileData.bio.ar || "",
            }
          : {
              en: profileData.bio || "",
              fr: profileData.bio || "",
              ar: profileData.bio || "",
            },
      );
      setAddresses(profileData.addresses || []);
      setAvatar(profileData.avatarUrl || null);
      if (profileData.settings) {
        setNotifications(profileData.settings.notifications ?? true);
        setFaceId(profileData.settings.faceId ?? false);
      }
    }
  }, [profileData]);

  // Profile Sticker Functions
  const fetchProfileStickers = async (query: string = "") => {
    const apiKey = process.env.EXPO_PUBLIC_STIPOP_API_KEY;
    const uid = user?.uid || "guest";

    if (!apiKey) {
      console.log("No Stipop API key found");
      return;
    }

    setStickerLoading(true);
    try {
      let stickers;
      if (query.trim()) {
        // Use Messenger API for search
        const response = await searchStickers(apiKey, {
          userId: uid,
          q: query,
          lang: "en",
          countryCode: "US",
          limit: 30,
          pageNumber: 1,
        });
        stickers = response.body.stickerList;
      } else {
        // Use default stickers from Messenger API for initial load
        stickers = await getDefaultStickers(apiKey, uid, "en", "US", 30);
      }

      const formattedStickers = stickers.map((s: StipopSticker) => ({
        stickerUrl: getStickerWithDimensions(s.stickerImg, 75, 75),
        stickerId: s.stickerId,
        keyword: s.keyword,
      }));

      setProfileStickers(formattedStickers);
    } catch (error) {
      console.log("Error fetching profile stickers:", error);
    } finally {
      setStickerLoading(false);
    }
  };

  const handleOpenStickerPicker = () => {
    setShowStickerPicker(true);
    fetchProfileStickers("");
  };

  const handleSelectProfileSticker = async (sticker: any) => {
    try {
      setLoading(true);
      // Upload sticker to Sanity (via wrapper) instead of using raw stipop URL
      const sanityUrl = await uploadToBunny(sticker.stickerUrl);

      // Update user profile with sticker as avatar
      await updateProfile({ avatarUrl: sanityUrl });
      setAvatar(sanityUrl);
      setShowStickerPicker(false);

      Alert.alert(
        t("Success") || "Succès",
        t("Profile picture updated!") || "Photo de profil mise à jour !",
      );
    } catch (error) {
      console.log("Error setting profile sticker:", error);
      Alert.alert(
        t("Error") || "Erreur",
        t("Failed to update profile picture") ||
          "Échec de la mise à jour de la photo de profil",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStickerSearch = (query: string) => {
    setStickerSearchQuery(query);
    fetchProfileStickers(query);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);
      const downloadUrl = await uploadToBunny(uri);

      if (downloadUrl) {
        setAvatar(downloadUrl);
        await updateProfile({ avatarUrl: downloadUrl });
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      Alert.alert(t("error"), t("failedAvatar"));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const updatedSettings = {
      notifications,
      faceId,
    };
    await updateProfile({
      fullName: name,
      phone,
      bio,
      addresses,
      settings: updatedSettings,
    });
    setLoading(false);
    Alert.alert(t("successTitle"), t("profileUpdated"));
  };

  const handleAddAddress = (): void => {
    if (!tempAddress.trim()) return;
    const newAddr = {
      id: Date.now().toString(),
      text: tempAddress,
      isDefault: addresses.length === 0,
    };
    const newList = [...addresses, newAddr];
    setAddresses(newList);
    setTempAddress("");
    setShowAddressForm(false);
    updateProfile({ addresses: newList });
    Alert.alert(t("successTitle"), t("addressAdded"));
  };

  const getCurrentLocation = async (): Promise<void> => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("error") || "Error",
          t("locationPermissionDenied") || "Location permission denied",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const addressParts = [
          addr.streetNumber,
          addr.street,
          addr.district,
          addr.city,
          addr.region,
          addr.country,
        ].filter(Boolean);

        setTempAddress(addressParts.join(", "));
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        t("error") || "Error",
        t("locationError") || "Failed to get location",
      );
    } finally {
      setGettingLocation(false);
    }
  };

  const handleDeleteAddress = (id: string) => {
    const newList = addresses.filter((a) => a.id !== id);
    // If we deleted the default, set first one as default
    if (newList.length > 0 && !newList.find((a) => a.isDefault)) {
      newList[0].isDefault = true;
    }
    setAddresses(newList);
    updateProfile({ addresses: newList });
    Alert.alert(t("successTitle"), t("addressDeleted"));
  };

  const handleSetDefault = (id: string) => {
    const newList = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    setAddresses(newList);
    updateProfile({ addresses: newList });
    Alert.alert(t("successTitle"), t("defaultAddressSet"));
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert(t("error"), t("currentPasswordRequired"));
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert(t("error"), t("weakPassword"));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t("error"), t("passwordsDoNotMatch"));
      return;
    }

    try {
      setPassLoading(true);
      if (auth.currentUser && auth.currentUser.email) {
        // Re-authenticate user before updating password
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          currentPassword,
        );
        await reauthenticateWithCredential(auth.currentUser, credential);

        await updatePassword(auth.currentUser, newPassword);

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        Alert.alert(t("successTitle"), t("passwordChanged"));
      }
    } catch (e: any) {
      console.error(e);
      if (e.code === "auth/wrong-password") {
        Alert.alert(t("error"), t("incorrectPassword"));
      } else if (e.code === "auth/requires-recent-login") {
        Alert.alert(
          t("error"),
          "Session expired. Please logout and login again.",
        );
      } else {
        Alert.alert(t("error"), t("failedToSave"));
      }
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: appColors.background }]}
      edges={["bottom"]}
    >
      {/* Animated Blur Header */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 64 + insets.top,
            paddingTop: insets.top,
            borderBottomWidth: headerOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            borderBottomColor:
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          },
        ]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}
        >
          <BlurView
            intensity={80}
            style={StyleSheet.absoluteFill}
            tint={theme}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: appColors.background + "66" },
            ]}
          />
        </Animated.View>

        <View
          style={[
            styles.modernHeader,
            { borderBottomWidth: 0, backgroundColor: "transparent" },
          ]}
        >
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtnSmall,
              { backgroundColor: theme === "dark" ? "#17171F" : "#F2F2F7" },
            ]}
          >
            <ChevronLeft size={20} color={appColors.foreground} />
          </TouchableOpacity>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.modernLogo, { color: appColors.foreground }]}
          >
            {t("preferences")}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 25,
          paddingTop: 64 + insets.top,
          paddingBottom: 100,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <View style={{ position: "relative" }}>
            <View
              style={[
                styles.profileAvatarLarge,
                {
                  backgroundColor: theme === "dark" ? "#17171F" : "#F2F2F7",
                  borderWidth: 1,
                  borderColor: appColors.border,
                },
              ]}
            >
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    resizeMode: "contain",
                  }}
                />
              ) : (
                <User size={40} color={appColors.textMuted} />
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.avatarEditBadge,
                {
                  backgroundColor: appColors.foreground,
                  borderColor: appColors.background,
                },
              ]}
              onPress={handlePickImage}
              disabled={uploading}
              activeOpacity={0.8}
            >
              {uploading ? (
                <ActivityIndicator
                  size="small"
                  color={theme === "dark" ? "#000" : "#FFF"}
                />
              ) : (
                <Camera size={14} color={theme === "dark" ? "#000" : "#FFF"} />
              )}
            </TouchableOpacity>
            {/* Sticker Button for Profile Picture */}
            <TouchableOpacity
              onPress={handleOpenStickerPicker}
              style={{
                position: "absolute",
                bottom: 0,
                right: 40,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: appColors.foreground,
                borderColor: appColors.background,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sticker size={14} color={theme === "dark" ? "#000" : "#FFF"} />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              marginTop: 15,
              fontSize: 11,
              fontWeight: "900",
              color: appColors.textMuted,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {t("changeAvatar")}
          </Text>
        </View>

        {/* Personal Info Section */}
        <View
          style={[
            styles.settingsSectionPremium,
            {
              backgroundColor: theme === "dark" ? "#121218" : "white",
              borderColor: appColors.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.settingsLabel, { color: appColors.foreground }]}>
            {t("personalData")}
          </Text>
          <View style={styles.premiumInputGroup}>
            <Text
              style={[styles.inputLabelField, { color: appColors.textMuted }]}
            >
              {t("fullName")}
            </Text>
            <TextInput
              style={[
                styles.premiumInput,
                {
                  backgroundColor: theme === "dark" ? "#17171F" : "#F9F9FB",
                  color: appColors.foreground,
                  borderColor: appColors.border,
                  borderWidth: 1,
                },
              ]}
              placeholder={t("fullName")}
              placeholderTextColor={appColors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>
          <View style={styles.premiumInputGroup}>
            <Text
              style={[styles.inputLabelField, { color: appColors.textMuted }]}
            >
              {t("contactNumber")}
            </Text>
            <TextInput
              style={[
                styles.premiumInput,
                {
                  backgroundColor: theme === "dark" ? "#17171F" : "#F9F9FB",
                  color: appColors.foreground,
                  borderColor: appColors.border,
                  borderWidth: 1,
                },
              ]}
              placeholder="+216 -- --- ---"
              placeholderTextColor={appColors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.premiumInputGroup}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <Text
                style={[
                  styles.inputLabelField,
                  { color: appColors.textMuted, marginBottom: 0 },
                ]}
              >
                {t("bio") || "Bio"}
              </Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {(["en", "fr", "ar"] as const).map((l) => (
                  <TouchableOpacity
                    key={l}
                    onPress={() => setBioLang(l)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor:
                        bioLang === l
                          ? appColors.primary
                          : theme === "dark"
                            ? "#222"
                            : "#E0E0E0",
                    }}
                  >
                    <Text
                      style={{
                        color: bioLang === l ? "#FFF" : appColors.foreground,
                        fontWeight: "bold",
                        fontSize: 10,
                        textTransform: "uppercase",
                      }}
                    >
                      {l}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TextInput
              style={[
                styles.premiumInput,
                {
                  backgroundColor: theme === "dark" ? "#17171F" : "#F9F9FB",
                  color: appColors.foreground,
                  borderColor: appColors.border,
                  borderWidth: 1,
                  minHeight: 80,
                  textAlignVertical: "top",
                },
              ]}
              multiline={true}
              numberOfLines={3}
              placeholder={t("enterBio") || "Describe yourself..."}
              placeholderTextColor={appColors.textMuted}
              value={bio[bioLang]}
              onChangeText={(text) => setBio({ ...bio, [bioLang]: text })}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.saveBtnPremium,
              {
                backgroundColor: theme === "dark" ? "#FFF" : "#000",
                marginTop: 10,
              },
            ]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color={theme === "dark" ? "#000" : "#FFF"} />
            ) : (
              <Text
                style={[
                  styles.saveBtnPremiumText,
                  { color: theme === "dark" ? "#000" : "#FFF" },
                ]}
              >
                {t("updateProfile")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Addresses Section */}
        <View
          style={[
            styles.settingsSectionPremium,
            {
              marginTop: 25,
              backgroundColor: theme === "dark" ? "#121218" : "white",
              borderColor: appColors.border,
              borderWidth: 1,
            },
          ]}
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
              style={[
                styles.settingsLabel,
                { marginBottom: 0, color: appColors.foreground },
              ]}
            >
              {t("manageAddresses")}
            </Text>
            {!showAddressForm && (
              <TouchableOpacity onPress={() => setShowAddressForm(true)}>
                <Plus size={20} color={appColors.accent} />
              </TouchableOpacity>
            )}
          </View>

          {showAddressForm && (
            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  gap: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: appColors.textMuted,
                  }}
                >
                  {t("addNewAddress") || "Add new address"}
                </Text>
                <TouchableOpacity
                  onPress={getCurrentLocation}
                  disabled={gettingLocation}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: appColors.accent + "20",
                  }}
                >
                  {gettingLocation ? (
                    <ActivityIndicator size={10} color={appColors.accent} />
                  ) : (
                    <MapPin size={14} color={appColors.accent} />
                  )}
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: appColors.accent,
                    }}
                  >
                    {t("useLocation") || "Use Location"}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.premiumInput,
                  {
                    backgroundColor: theme === "dark" ? "#17171F" : "#F9F9FB",
                    color: appColors.foreground,
                    borderColor: appColors.border,
                    borderWidth: 1,
                    minHeight: 80,
                    textAlignVertical: "top",
                    paddingTop: 15,
                  },
                ]}
                placeholder={t("defaultAddress")}
                placeholderTextColor={appColors.textMuted}
                value={tempAddress}
                onChangeText={setTempAddress}
                multiline
              />
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => setShowAddressForm(false)}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: appColors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "800",
                      fontSize: 12,
                      color: appColors.textMuted,
                    }}
                  >
                    {t("cancel").toUpperCase()}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddAddress}
                  style={{
                    flex: 2,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: appColors.foreground,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "800",
                      fontSize: 12,
                      color: theme === "dark" ? "#000" : "#FFF",
                    }}
                  >
                    {t("addAddress").toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {addresses.map((addr) => (
            <View
              key={addr.id}
              style={{
                marginBottom: 15,
                padding: 15,
                borderRadius: 16,
                backgroundColor: theme === "dark" ? "#17171F" : "#F9F9FB",
                borderWidth: 1,
                borderColor: addr.isDefault
                  ? appColors.accent
                  : appColors.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <MapPin
                    size={14}
                    color={
                      addr.isDefault ? appColors.accent : appColors.textMuted
                    }
                  />
                  {addr.isDefault && (
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "900",
                        color: appColors.accent,
                        letterSpacing: 1,
                      }}
                    >
                      {t("setAsDefault").toUpperCase()}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleDeleteAddress(addr.id)}>
                  <Trash2 size={16} color={appColors.error} />
                </TouchableOpacity>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: appColors.foreground,
                  lineHeight: 18,
                }}
              >
                {addr.text}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.05)",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: addr.isDefault
                      ? appColors.accent
                      : appColors.textMuted,
                  }}
                >
                  {t("setAsDefault").toUpperCase()}
                </Text>
                <TouchableOpacity
                  onPress={() => !addr.isDefault && handleSetDefault(addr.id)}
                  style={[
                    styles.customSwitch,
                    addr.isDefault && { backgroundColor: appColors.foreground },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.switchDot,
                      addr.isDefault && [
                        styles.switchDotActive,
                        { backgroundColor: theme === "dark" ? "#000" : "#FFF" },
                      ],
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Change Password Section */}
        <View
          style={[
            styles.settingsSectionPremium,
            {
              marginTop: 25,
              backgroundColor: theme === "dark" ? "#121218" : "white",
              borderColor: appColors.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.settingsLabel, { color: appColors.foreground }]}>
            {t("changePassword")}
          </Text>

          <View style={styles.premiumInputGroup}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Lock size={14} color={appColors.textMuted} />
              <Text
                style={[
                  styles.inputLabelField,
                  { color: appColors.textMuted, marginBottom: 0 },
                ]}
              >
                {t("currentPasswordRequired")}
              </Text>
            </View>
            <View style={{ position: "relative", justifyContent: "center" }}>
              <TextInput
                style={[
                  styles.premiumInput,
                  {
                    backgroundColor: theme === "dark" ? "#17171F" : "#F9F9FB",
                    color: appColors.foreground,
                    borderColor: appColors.border,
                    borderWidth: 1,
                    paddingRight: 50,
                  },
                ]}
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="••••••••"
                placeholderTextColor={appColors.textMuted}
              />
              <TouchableOpacity
                style={{
                  position: "absolute",
                  right: 15,
                  height: "100%",
                  justifyContent: "center",
                }}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff size={18} color={appColors.textMuted} />
                ) : (
                  <Eye size={18} color={appColors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.premiumInputGroup}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Lock size={14} color={appColors.textMuted} />
              <Text
                style={[
                  styles.inputLabelField,
                  { color: appColors.textMuted, marginBottom: 0 },
                ]}
              >
                {t("newPassword")}
              </Text>
            </View>
            <View style={{ position: "relative", justifyContent: "center" }}>
              <TextInput
                style={[
                  styles.premiumInput,
                  {
                    backgroundColor: theme === "dark" ? "#17171F" : "#F9F9FB",
                    color: appColors.foreground,
                    borderColor: appColors.border,
                    borderWidth: 1,
                    paddingRight: 50,
                  },
                ]}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
                placeholderTextColor={appColors.textMuted}
              />
              <TouchableOpacity
                style={{
                  position: "absolute",
                  right: 15,
                  height: "100%",
                  justifyContent: "center",
                }}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff size={18} color={appColors.textMuted} />
                ) : (
                  <Eye size={18} color={appColors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.premiumInputGroup}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Check size={14} color={appColors.textMuted} />
              <Text
                style={[
                  styles.inputLabelField,
                  { color: appColors.textMuted, marginBottom: 0 },
                ]}
              >
                {t("confirmPassword")}
              </Text>
            </View>
            <View style={{ position: "relative", justifyContent: "center" }}>
              <TextInput
                style={[
                  styles.premiumInput,
                  {
                    backgroundColor: theme === "dark" ? "#17171F" : "#F9F9FB",
                    color: appColors.foreground,
                    borderColor: appColors.border,
                    borderWidth: 1,
                    paddingRight: 50,
                  },
                ]}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={appColors.textMuted}
              />
              <TouchableOpacity
                style={{
                  position: "absolute",
                  right: 15,
                  height: "100%",
                  justifyContent: "center",
                }}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} color={appColors.textMuted} />
                ) : (
                  <Eye size={18} color={appColors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.saveBtnPremium,
              {
                backgroundColor: theme === "dark" ? "#FFF" : "#000",
                marginTop: 10,
              },
            ]}
            onPress={handleChangePassword}
            disabled={passLoading}
          >
            {passLoading ? (
              <ActivityIndicator color={theme === "dark" ? "#000" : "#FFF"} />
            ) : (
              <Text
                style={[
                  styles.saveBtnPremiumText,
                  { color: theme === "dark" ? "#000" : "#FFF" },
                ]}
              >
                {t("updateAccount").toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.settingsSectionPremium,
            {
              marginTop: 25,
              backgroundColor: theme === "dark" ? "#121218" : "white",
              borderColor: appColors.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.settingsLabel, { color: appColors.foreground }]}>
            {t("appNotifications")}
          </Text>
          <View
            style={[
              styles.settingsRowSwitch,
              { borderBottomColor: appColors.border },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 20 }}>
              <Text
                style={[styles.switchTitle, { color: appColors.foreground }]}
              >
                {t("pushNotifications")}
              </Text>
              <Text style={[styles.switchSub, { color: appColors.textMuted }]}>
                {t("orderStatusDrops")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                const newValue = !notifications;
                if (newValue) {
                  const permission = await registerForPushNotificationsAsync();
                  if (!permission) {
                    const isExpoGo = Constants.appOwnership === "expo";
                    const message =
                      isExpoGo && Platform.OS === "android"
                        ? t("devBuildRequired")
                        : t("failedToSave") || "Could not enable notifications";
                    Alert.alert(t("error"), message);
                    return;
                  }
                }
                setNotifications(newValue);
              }}
              style={[
                styles.customSwitch,
                notifications && { backgroundColor: appColors.foreground },
              ]}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.switchDot,
                  notifications && [
                    styles.switchDotActive,
                    { backgroundColor: theme === "dark" ? "#000" : "#FFF" },
                  ],
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={[styles.settingsRowSwitch, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, paddingRight: 20 }}>
              <Text
                style={[styles.switchTitle, { color: appColors.foreground }]}
              >
                {t("biometricAuth")}
              </Text>
              <Text style={[styles.switchSub, { color: appColors.textMuted }]}>
                {t("useBiometricToPay").replace(
                  "{{type}}",
                  biometricType || "Biometrics",
                )}
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                const newValue = !faceId;
                if (newValue) {
                  try {
                    const hasHardware =
                      await LocalAuthentication.hasHardwareAsync();
                    const isEnrolled =
                      await LocalAuthentication.isEnrolledAsync();

                    if (!hasHardware || !isEnrolled) {
                      Alert.alert(
                        t("error"),
                        "Biometric authentication is not available on this device.",
                      );
                      return;
                    }

                    const result = await LocalAuthentication.authenticateAsync({
                      promptMessage:
                        Platform.OS === "ios"
                          ? "FaceID / TouchID"
                          : "Biometric Auth",
                      fallbackLabel: t("usePasscode") || "Use Passcode",
                    });

                    if (!result.success) {
                      return;
                    }
                  } catch (err) {
                    console.error("Biometric auth error:", err);
                    return;
                  }
                }
                setFaceId(newValue);
              }}
              style={[
                styles.customSwitch,
                faceId && { backgroundColor: appColors.foreground },
              ]}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.switchDot,
                  faceId && [
                    styles.switchDotActive,
                    { backgroundColor: theme === "dark" ? "#000" : "#FFF" },
                  ],
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.settingsSectionPremium,
            {
              marginTop: 25,
              backgroundColor: theme === "dark" ? "#121218" : "white",
              borderColor: appColors.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.settingsLabel, { color: appColors.foreground }]}>
            {t("supportLegal")}
          </Text>
          <TouchableOpacity
            style={[
              styles.settingsRowMinimal,
              { borderBottomColor: appColors.border },
            ]}
            onPress={() => onNavigate("Chat")}
          >
            <MessageCircle
              size={16}
              color={appColors.accent}
              style={{ marginRight: 12 }}
            />
            <Text
              style={[
                styles.settingsRowTextMinimal,
                { color: appColors.foreground, flex: 1 },
              ]}
            >
              {t("support")}
            </Text>
            <ChevronRight size={16} color={appColors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.settingsRowMinimal,
              { borderBottomColor: appColors.border },
            ]}
            onPress={() => onNavigate("PrivacyPolicy")}
          >
            <Text
              style={[
                styles.settingsRowTextMinimal,
                { color: appColors.foreground },
              ]}
            >
              {t("privacyPolicy")}
            </Text>
            <ChevronRight size={16} color={appColors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.settingsRowMinimal,
              { borderBottomColor: appColors.border },
            ]}
            onPress={() => onNavigate("TermsOfService")}
          >
            <Text
              style={[
                styles.settingsRowTextMinimal,
                { color: appColors.foreground },
              ]}
            >
              {t("termsOfService")}
            </Text>
            <ChevronRight size={16} color={appColors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingsRowMinimal, { borderBottomWidth: 0 }]}
            activeOpacity={1}
            onLongPress={() => {
              if (profileData?.role === "admin") {
                onNavigate("DynamicIslandTest");
              }
            }}
          >
            <Text
              style={[
                styles.settingsRowTextMinimal,
                { color: appColors.foreground },
              ]}
            >
              {t("appVersion")}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: appColors.textMuted,
              }}
            >
              v1.0.4
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.deactivateBtn,
            {
              backgroundColor:
                theme === "dark" ? "rgba(255,69,58,0.1)" : "#FFF5F5",
            },
          ]}
          activeOpacity={0.8}
        >
          <Trash2 size={16} color={appColors.error} />
          <Text style={[styles.deactivateBtnText, { color: appColors.error }]}>
            {t("deactivateAccount")}
          </Text>
        </TouchableOpacity>
      </Animated.ScrollView>

      {/* Profile Sticker Picker Modal */}
      <Modal
        visible={showStickerPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStickerPicker(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: theme === "dark" ? "#1c1c1e" : "#f2f2f7",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              height: height * 0.7,
              padding: 15,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 15,
                borderBottomWidth: 1,
                borderBottomColor: theme === "dark" ? "#333" : "#ddd",
                paddingBottom: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: appColors.foreground,
                }}
              >
                {t("chooseSticker") || "Choose a Sticker"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowStickerPicker(false)}
                style={{ padding: 5 }}
              >
                <X size={24} color={appColors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: theme === "dark" ? "#2c2c2e" : "#fff",
                borderRadius: 10,
                paddingHorizontal: 12,
                marginBottom: 15,
              }}
            >
              <Search size={18} color={appColors.textMuted} />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  fontSize: 14,
                  color: appColors.foreground,
                }}
                placeholder={
                  t("searchStickers") || "Rechercher des autocollants..."
                }
                placeholderTextColor={appColors.textMuted}
                value={stickerSearchQuery}
                onChangeText={handleStickerSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {stickerSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleStickerSearch("")}
                  style={{ padding: 4 }}
                >
                  <X size={16} color={appColors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Sticker Grid */}
            {stickerLoading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color={appColors.blue} />
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "flex-start",
                  }}
                >
                  {profileStickers.map((sticker: any, index: number) => (
                    <TouchableOpacity
                      key={`profile-sticker-${index}`}
                      onPress={() => handleSelectProfileSticker(sticker)}
                      disabled={loading}
                      style={{
                        width: "25%",
                        aspectRatio: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 5,
                      }}
                    >
                      {loading ? (
                        <ActivityIndicator
                          size="small"
                          color={appColors.blue}
                        />
                      ) : (
                        <Image
                          source={{ uri: sticker.stickerUrl }}
                          style={{
                            width: 70,
                            height: 70,
                            resizeMode: "contain",
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                {profileStickers.length === 0 && (
                  <View style={{ padding: 40, alignItems: "center" }}>
                    <Text style={{ color: appColors.textMuted, fontSize: 14 }}>
                      {t("noStickersFound") || "No stickers found"}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ProductDetailScreen({
  product,
  onBack,
  onAddToCart,
  toggleWishlist,
  isWishlisted,
  onSizeGuide,
  onTryOnAI,
  user,
  profileData,
  t,
  language,
  theme: propTheme,
}: any) {
  const { colors, theme } = useAppTheme();
  const currentTheme = propTheme || theme;
  const currentLang = language || "fr";

  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "M");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [activeImg, setActiveImg] = useState(0);

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const getName = (field: any) => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return (
      field[currentLang === "ar" ? "ar-tn" : currentLang] ||
      field[currentLang] ||
      field["fr"] ||
      field["en"] ||
      Object.values(field)[0] ||
      ""
    );
  };

  const translateColor = (color: string) => {
    if (!color) return "";
    const colorsMap: any = {
      red: { fr: "Rouge", ar: "أحمر", en: "Red" },
      blue: { fr: "Bleu", ar: "أزرق", en: "Blue" },
      green: { fr: "Vert", ar: "أخضر", en: "Green" },
      black: { fr: "Noir", ar: "أسود", en: "Black" },
      white: { fr: "Blanc", ar: "أبيض", en: "White" },
      yellow: { fr: "Jaune", ar: "أصفر", en: "Yellow" },
      grey: { fr: "Gris", ar: "رمادي", en: "Grey" },
      gray: { fr: "Gris", ar: "رمادي", en: "Gray" },
      purple: { fr: "Violet", ar: "بنفسجي", en: "Purple" },
      pink: { fr: "Rose", ar: "وردي", en: "Pink" },
      orange: { fr: "Orange", ar: "برتقالي", en: "Orange" },
      brown: { fr: "Marron", ar: "بني", en: "Brown" },
      beige: { fr: "Beige", ar: "بيج", en: "Beige" },
      olive: { fr: "Olive", ar: "زيتوني", en: "Olive" },
    };
    const key = color.toLowerCase();
    const langKey = currentLang === "ar-tn" ? "ar" : currentLang || "fr";
    return (
      colorsMap[key]?.[langKey] ||
      colorsMap[key]?.[currentLang === "ar" ? "ar" : currentLang] ||
      color
    );
  };

  // Fix: Remove duplicate images - mainImage is already in images array
  const allImages =
    product.images && product.images.length > 0
      ? product.images
      : product.mainImage
        ? [product.mainImage]
        : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Blur Header */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 64 + insets.top,
            paddingTop: insets.top,
            borderBottomWidth: headerOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            borderBottomColor:
              currentTheme === "dark"
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
          },
        ]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}
        >
          <BlurView
            intensity={80}
            style={StyleSheet.absoluteFill}
            tint={currentTheme}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.background + "66" },
            ]}
          />
        </Animated.View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 10,
          }}
        >
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor:
                currentTheme === "dark"
                  ? "rgba(0,0,0,0.5)"
                  : "rgba(255,255,255,0.8)",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={onBack}
          >
            <X size={22} color={colors.foreground} strokeWidth={2.5} />
          </TouchableOpacity>

          <AnimatedAppText
            numberOfLines={1}
            style={[
              styles.modernLogo,
              {
                flex: 1,
                textAlign: "center",
                marginHorizontal: 15,
                opacity: headerOpacity,
                color: colors.foreground,
                fontSize: 16,
              },
            ]}
          >
            {getName(product.name).toUpperCase()}
          </AnimatedAppText>

          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor:
                currentTheme === "dark"
                  ? "rgba(0,0,0,0.5)"
                  : "rgba(255,255,255,0.8)",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => toggleWishlist(product.id)}
          >
            <Heart
              size={22}
              color={isWishlisted ? colors.error : colors.foreground}
              fill={isWishlisted ? colors.error : "none"}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {/* Image Gallery */}
        <View style={{ position: "relative" }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) =>
              setActiveImg(Math.round(e.nativeEvent.contentOffset.x / width))
            }
            scrollEventThrottle={16}
          >
            {allImages.map((img: string, idx: number) => (
              <Image
                key={idx}
                source={{ uri: img }}
                style={styles.detailFullImage}
                resizeMode="cover"
              />
            ))}
            {product.videoUrl && (
              <View style={styles.detailFullVideo}>
                <UniversalVideoPlayer
                  source={{ uri: product.videoUrl }}
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: "#000" },
                  ]}
                  useNativeControls
                  resizeMode="cover"
                  isLooping
                  shouldPlay
                />
              </View>
            )}
          </ScrollView>

          {/* Image Pagination Dots */}
          {allImages.length + (product.videoUrl ? 1 : 0) > 1 && (
            <View style={styles.imagePagination}>
              {Array.from({
                length: allImages.length + (product.videoUrl ? 1 : 0),
              }).map((_, idx: number) => (
                <View
                  key={idx}
                  style={[
                    styles.paginationDot,
                    activeImg === idx && styles.activePaginationDot,
                    activeImg === idx && {
                      backgroundColor: theme === "dark" ? "#FFF" : "#000",
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Details Content */}
        <Animatable.View
          animation="fadeInUp"
          duration={800}
          style={[
            styles.detailBottomContent,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Drag Indicator */}
          <View
            style={[
              styles.dragIndicator,
              { backgroundColor: theme === "dark" ? "#333" : "#E5E5EA" },
            ]}
          />

          {/* Brand & Product Name */}
          <View
            style={{
              marginBottom: 8,
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            <Text
              style={[
                styles.detailBrandName,
                { color: colors.textMuted, marginBottom: 0 },
              ]}
            >
              {String(
                translateCategory(getName(product.category)) || "CATEGORY",
              ).toUpperCase()}
            </Text>
            <Text style={{ color: colors.border, fontSize: 12 }}>|</Text>
            <Text
              style={[
                styles.detailBrandName,
                { color: colors.textMuted, marginBottom: 0 },
              ]}
            >
              {String(getName(product.brandName) || "PREMIUM").toUpperCase()}
            </Text>
          </View>
          <Text
            style={[styles.detailProductName, { color: colors.foreground }]}
          >
            {String(getName(product.name)).toUpperCase()}
          </Text>

          {/* Price */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 15,
            }}
          >
            <Text
              style={[
                styles.detailProductPrice,
                { color: colors.foreground, marginBottom: 0 },
              ]}
            >
              {product.discountPrice !== undefined &&
              product.discountPrice !== null &&
              product.discountPrice < product.price
                ? Number(product.discountPrice).toFixed(3)
                : Number(product.price).toFixed(3)}{" "}
              TND
            </Text>
            {product.discountPrice !== undefined &&
              product.discountPrice !== null &&
              product.discountPrice < product.price && (
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.textMuted,
                    textDecorationLine: "line-through",
                  }}
                >
                  {Number(product.price).toFixed(3)} TND
                </Text>
              )}
            {product.discountPrice && product.discountPrice < product.price && (
              <View
                style={{
                  backgroundColor: colors.error + "15",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    color: colors.error,
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  -
                  {Math.round(
                    (1 - product.discountPrice / product.price) * 100,
                  )}
                  %
                </Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.detailGlassDivider,
              { backgroundColor: colors.border },
            ]}
          />
          {/* Color Selector */}
          {product.colors && product.colors.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={[
                    styles.modernDetailLabel,
                    { color: colors.foreground },
                  ]}
                >
                  {t("color")}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: colors.textMuted,
                    textTransform: "uppercase",
                  }}
                >
                  {translateColor(selectedColor)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                {product.colors.map((c: string) => {
                  // Normalize color - React Native needs lowercase for color names
                  const displayColor = c.startsWith("#") ? c : c.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setSelectedColor(c)}
                      style={{ alignItems: "center" }}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: displayColor,
                          borderWidth: selectedColor === c ? 2 : 1,
                          borderColor:
                            selectedColor === c
                              ? colors.foreground
                              : displayColor === "black" ||
                                  displayColor === "#000" ||
                                  displayColor === "#000000"
                                ? "rgba(255,255,255,0.3)"
                                : colors.border,
                          padding: 2,
                        }}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Size Selector */}
          <View style={{ marginBottom: 20 }}>
            <View style={styles.sectionHeaderNoPad}>
              <Text
                style={[styles.modernDetailLabel, { color: colors.foreground }]}
              >
                {t("size")}
              </Text>
              <TouchableOpacity onPress={onSizeGuide}>
                <Text
                  style={[styles.sizeGuideText, { color: colors.textMuted }]}
                >
                  {t("sizeGuide")}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modernSizeGrid}>
              {(product.sizes && product.sizes.length > 0
                ? product.sizes
                : ["XS", "S", "M", "L", "XL"]
              ).map((s: string) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSelectedSize(s)}
                  style={[
                    styles.modernSizeBtn,
                    {
                      borderColor:
                        s === selectedSize ? colors.foreground : colors.border,
                    },
                    s === selectedSize && {
                      backgroundColor: theme === "dark" ? "white" : "black",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modernSizeText,
                      {
                        color:
                          s === selectedSize
                            ? theme === "dark"
                              ? "black"
                              : "white"
                            : colors.foreground,
                      },
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={[
                styles.modernDetailLabel,
                { marginBottom: 8, color: colors.foreground },
              ]}
            >
              {t("description")}
            </Text>
            <Text
              style={[
                styles.detailDescriptionText,
                { color: colors.foreground },
              ]}
            >
              {getName(product.description)}
            </Text>
          </View>

          {/* Delivery Info */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 12,
              paddingHorizontal: 12,
              backgroundColor: theme === "dark" ? "#17171F" : "#F9F9F9",
              borderRadius: 12,
              marginBottom: 15,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: theme === "dark" ? "#000" : "white",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={16} color={colors.foreground} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: colors.foreground,
                }}
              >
                {product.deliveryPrice && product.deliveryPrice > 0
                  ? `${t("delivery")} ${product.deliveryPrice.toFixed(2)} TND`
                  : t("freeDelivery")}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.textMuted,
                  fontWeight: "500",
                  marginTop: 5,
                }}
              >
                {t("deliveryTime")}
              </Text>
            </View>
          </View>

          {/* Reviews Section */}
          <View style={{ marginTop: 5, marginBottom: 20 }}>
            <Text
              style={[
                styles.modernDetailLabel,
                { marginBottom: 12, color: colors.foreground },
              ]}
            >
              {t("reviews")}
            </Text>
            <ProductReviews
              productId={product.id}
              user={user}
              profileData={profileData}
              t={t}
            />
          </View>

          {/* Add to Bag Button */}
          <TouchableOpacity
            style={[
              styles.mainActionBtn,
              {
                backgroundColor:
                  product.status === "sold_out"
                    ? theme === "dark"
                      ? "#333"
                      : "#CCC"
                    : theme === "dark"
                      ? "#FFFFFF"
                      : "#000000",
                opacity: product.status === "sold_out" ? 0.7 : 1,
              },
            ]}
            onPress={() => onAddToCart(product, selectedSize, selectedColor)}
            disabled={product.status === "sold_out"}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.mainActionBtnText,
                {
                  color:
                    product.status === "sold_out"
                      ? theme === "dark"
                        ? "#888"
                        : "#666"
                      : theme === "dark"
                        ? "#000"
                        : "#FFF",
                },
              ]}
            >
              {product.status === "sold_out"
                ? t("soldOut").toUpperCase()
                : `${t("addToCart")} — ${Number(product.discountPrice || product.price).toFixed(2)} TND`}
            </Text>
          </TouchableOpacity>
          <View style={{ height: 50 }} />
        </Animatable.View>
      </Animated.ScrollView>
    </View>
  );
}

function CampaignDetailScreen({
  campaign,
  onBack,
  onProductPress,
  onCategoryPress,
  t,
}: any) {
  const { colors, theme } = useAppTheme();
  const [targetProduct, setTargetProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaign.targetType === "product" && campaign.targetId) {
      fetchProduct();
    }
  }, [campaign]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const pDoc = await getDoc(doc(db, "products", campaign.targetId));
      if (pDoc.exists()) {
        setTargetProduct({ id: pDoc.id, ...pDoc.data() });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = () => {
    if (campaign.targetType === "product" && targetProduct) {
      onProductPress(targetProduct);
    } else if (campaign.targetType === "category" && campaign.targetId) {
      onCategoryPress(campaign.targetId);
    } else if (campaign.link) {
      // Legacy support
      onCategoryPress(campaign.link);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ height: height * 0.7, width: "100%" }}>
          {campaign.type === "video" ? (
            <UniversalVideoPlayer
              source={{ uri: campaign.url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              shouldPlay
              isLooping
              isMuted
            />
          ) : (
            <Image
              source={{ uri: campaign.url }}
              style={{ width: "100%", height: "100%" }}
            />
          )}

          <TouchableOpacity
            style={[
              styles.glassBackBtn,
              {
                backgroundColor:
                  theme === "dark"
                    ? "rgba(0,0,0,0.5)"
                    : "rgba(255,255,255,0.8)",
              },
            ]}
            onPress={onBack}
          >
            <X size={24} color={colors.foreground} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <Animatable.View
          animation="fadeInUp"
          duration={800}
          style={[
            styles.campaignContent,
            { backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.campaignTitle, { color: colors.foreground }]}>
            {getName(campaign.title).toUpperCase()}
          </Text>
          <View
            style={[styles.campaignDivider, { backgroundColor: colors.border }]}
          />
          <Text style={[styles.campaignDesc, { color: colors.foreground }]}>
            {getName(campaign.description) ||
              "Curated fashion and artistry, designed for the modern individual. Experience the fusion of minimalist design and premium materials."}
          </Text>

          {campaign.targetType !== "none" && (
            <TouchableOpacity
              style={[
                styles.campaignMainBtn,
                { backgroundColor: colors.foreground },
              ]}
              onPress={handleAction}
            >
              {loading ? (
                <ActivityIndicator color={theme === "dark" ? "#000" : "#FFF"} />
              ) : (
                <Text
                  style={[
                    styles.campaignBtnText,
                    { color: theme === "dark" ? "#000" : "#FFF" },
                  ]}
                >
                  {campaign.targetType === "product"
                    ? t("viewProduct")
                    : t("exploreCollection")}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </Animatable.View>
      </ScrollView>
    </View>
  );
}

function ProductReviews({
  productId,
  user,
  profileData,
  t,
}: {
  productId: string;
  user: any;
  profileData: any;
  t: any;
}) {
  const { colors, theme } = useAppTheme();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(5);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "reviews"),
        where("productId", "==", productId),
      );
      const snap = await getDocs(q);
      const reviewsData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReviews(reviewsData);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleDelete = (reviewId: string) => {
    Alert.alert(t("deleteReview"), t("confirmDeleteReview"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "reviews", reviewId));
            setReviews((prev) => prev.filter((r) => r.id !== reviewId));
            await updateProductRating(productId);
          } catch (err) {
            Alert.alert(t("cancel"), t("reviewFailed"));
          }
        },
      },
    ]);
  };

  const startEdit = (review: any) => {
    setEditingReview(review.id);
    setEditComment(review.comment);
    setEditRating(review.rating);
  };

  const handleUpdate = async () => {
    if (!editingReview) return;
    try {
      await updateDoc(doc(db, "reviews", editingReview), {
        comment: editComment,
        rating: editRating,
        updatedAt: serverTimestamp(),
      });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === editingReview
            ? { ...r, comment: editComment, rating: editRating }
            : r,
        ),
      );
      setEditingReview(null);
      await updateProductRating(productId);
    } catch (err) {
      Alert.alert(t("cancel"), t("reviewFailed"));
    }
  };

  if (loading) return <ActivityIndicator color={colors.foreground} />;
  if (reviews.length === 0)
    return (
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>
        {t("noReviews")}
      </Text>
    );

  const avgRating =
    reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  const isAdminOrAuthor = (review: any) => {
    if (!user) return { isOwner: false, isAdmin: false };
    const isOwner = review.userId === user.uid;
    const isAdmin = ["admin", "editor"].includes(profileData?.role);
    return { isOwner, isAdmin };
  };

  return (
    <View>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
      >
        <Text
          style={{
            fontSize: 48,
            fontWeight: "900",
            color: colors.foreground,
            marginRight: 10,
          }}
        >
          {avgRating.toFixed(1)}
        </Text>
        <View>
          <View style={{ flexDirection: "row" }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                color={
                  s <= Math.round(avgRating)
                    ? "#FFD700"
                    : theme === "dark"
                      ? "#222"
                      : "#EEE"
                }
                fill={
                  s <= Math.round(avgRating)
                    ? "#FFD700"
                    : theme === "dark"
                      ? "#222"
                      : "#EEE"
                }
              />
            ))}
          </View>
          <Text
            style={{
              fontSize: 12,
              color: colors.textMuted,
              fontWeight: "600",
              marginTop: 4,
            }}
          >
            {reviews.length} {t("ratings")}
          </Text>
        </View>
      </View>

      {reviews.map((r, i) => {
        const { isOwner, isAdmin } = isAdminOrAuthor(r);
        const isEditing = editingReview === r.id;

        return (
          <View
            key={r.id || i}
            style={{
              marginBottom: 20,
              paddingBottom: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 5,
                alignItems: "center",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 13,
                    color: colors.foreground,
                  }}
                >
                  {r.userName || t("customer")}
                </Text>
                {!isEditing && (isOwner || isAdmin) && (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {isOwner && (
                      <TouchableOpacity
                        onPress={() => startEdit(r)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Edit size={14} color={colors.accent} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDelete(r.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={14} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>
                {r.createdAt?.toDate
                  ? r.createdAt.toDate().toLocaleDateString()
                  : "Recent"}
              </Text>
            </View>

            {isEditing ? (
              <View style={{ marginTop: 10 }}>
                <View style={{ flexDirection: "row", marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setEditRating(s)}>
                      <Star
                        size={20}
                        color={
                          s <= editRating
                            ? "#FFD700"
                            : theme === "dark"
                              ? "#222"
                              : "#EEE"
                        }
                        fill={
                          s <= editRating
                            ? "#FFD700"
                            : theme === "dark"
                              ? "#222"
                              : "#EEE"
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 13,
                    backgroundColor: theme === "dark" ? "#17171F" : "#F9F9F9",
                    color: colors.foreground,
                    minHeight: 60,
                    textAlignVertical: "top",
                  }}
                  value={editComment}
                  onChangeText={setEditComment}
                  multiline
                />
                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <TouchableOpacity
                    onPress={handleUpdate}
                    style={{
                      backgroundColor: colors.foreground,
                      paddingHorizontal: 15,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: theme === "dark" ? "#000" : "#FFF",
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      SAVE
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditingReview(null)}
                    style={{
                      backgroundColor: theme === "dark" ? "#333" : "#EEE",
                      paddingHorizontal: 15,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.foreground,
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      CANCEL
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: "row", marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={12}
                      color={
                        s <= r.rating
                          ? "#FFD700"
                          : theme === "dark"
                            ? "#222"
                            : "#EEE"
                      }
                      fill={
                        s <= r.rating
                          ? "#FFD700"
                          : theme === "dark"
                            ? "#222"
                            : "#EEE"
                      }
                    />
                  ))}
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.foreground,
                    lineHeight: 20,
                  }}
                >
                  {r.comment}
                </Text>
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}

function ShopScreen({
  onProductPress,
  initialCategory,
  initialBrand,
  setInitialBrand,
  wishlist,
  toggleWishlist,
  addToCart,
  onBack,
  t,
  theme,
  language,
}: any) {
  const { colors } = useAppTheme();

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  // Stable card height - computed once to prevent rerender-induced crashes
  const CARD_HEIGHT = useRef(
    height - (245 + insets.top + (Platform.OS === "ios" ? 130 : 80)),
  ).current;
  const ITEM_HEIGHT = CARD_HEIGHT + 20; // card height + marginBottom
  const BASE_HEADER_HEIGHT = 245 + insets.top;

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState(initialCategory || null);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand || null);
  const [brands, setBrands] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [selectedSubCat, setSelectedSubCat] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const SUB_BAR_HEIGHT = subCategories.length > 0 ? 45 : 0;
  const HEADER_HEIGHT = BASE_HEADER_HEIGHT + SUB_BAR_HEIGHT;

  useEffect(() => {
    setSelectedCat(initialCategory || null);
    setSelectedBrand(initialBrand || null);
    setSelectedSubCat(null);
  }, [initialCategory, initialBrand]);

  useEffect(() => {
    const fetchSubs = async () => {
      setSelectedSubCat(null);
      if (selectedCat) {
        try {
          const subSnap = await getDocs(
            query(
              collection(db, "categories"),
              where("parentId", "==", selectedCat),
            ),
          );
          setSubCategories(
            subSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          );
        } catch (err) {
          console.error("Error fetching subcategories:", err);
        }
      } else {
        setSubCategories([]);
      }
    };
    fetchSubs();
  }, [selectedCat]);

  useEffect(() => {
    fetchData();
  }, [selectedCat, selectedBrand, selectedSubCat, selectedZone]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch categories first to handle hierarchy
      let catList: any[] = categories;
      if (categories.length === 0) {
        const catSnap = await getDocs(collection(db, "categories"));
        catList = catSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCategories(catList);
      }

      // 2. Build product query
      let q = query(collection(db, "products"));
      if (selectedSubCat) {
        q = query(
          collection(db, "products"),
          where("categoryId", "==", selectedSubCat),
        );
      } else if (selectedCat) {
        // Fetch products for parent AND all its children
        const children = catList
          .filter((c) => c.parentId === selectedCat)
          .map((c) => c.id);
        const allIds = [selectedCat, ...children];
        // Firestore IN limit is 30
        q = query(
          collection(db, "products"),
          where("categoryId", "in", allIds.slice(0, 30)),
        );
      } else if (selectedBrand) {
        q = query(
          collection(db, "products"),
          where("brandId", "==", selectedBrand),
        );
      }

      const prodSnap = await getDocs(q);
      const prodList = prodSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 3. Enrich products with proper category hierarchy (Parent Name | Sub Name)
      const enrichedProds = prodList.map((p: any) => {
        let cat = catList.find((c: any) => c.id === p.categoryId);
        let parentName = "";
        let subName = "";

        if (cat) {
          if (cat.parentId) {
            const parent = catList.find((c: any) => c.id === cat.parentId);
            parentName = parent ? parent.name : "";
            subName = cat.name;
          } else {
            parentName = cat.name;
            subName = "";
          }
        }

        return {
          ...p,
          categoryName: parentName || p.categoryName || "",
          subCategoryName:
            subName && subName !== parentName
              ? subName
              : p.subCategoryName || "",
          brandName: p.brandName || p.brand || p.marque || "TAMA CLOTHING",
        };
      });

      setProducts(enrichedProds);

      // Fetch brands for search functionality
      const brandsSnap = await getDocs(collection(db, "brands"));
      const activeBrands = brandsSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((b: any) => b.isActive !== false);
      setBrands(activeBrands);
    } catch (error) {
      console.error("Error fetching shop data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    // Search by product name OR brand name
    const searchLower = search.toLowerCase();

    // Check if product name matches
    const productNameMatch = getName(p.name)
      .toLowerCase()
      .includes(searchLower);

    // Check if search matches any brand name - if so, include all products from that brand
    let brandNameMatch = false;
    if (searchLower && brands.length > 0) {
      // Find all brands that match the search query
      const matchingBrands = brands.filter((b: any) => {
        const brandName = getName(b.name).toLowerCase();
        return brandName.includes(searchLower);
      });

      // If any brand matches, check if this product belongs to any of those brands
      if (matchingBrands.length > 0) {
        const matchingBrandIds = matchingBrands.map((b: any) => b.id);
        brandNameMatch = matchingBrandIds.includes(p.brandId);
      }
    }

    const matchesSearch = productNameMatch || brandNameMatch;
    const matchesColor = !selectedColor || p.colors?.includes(selectedColor);
    const matchesSize = !selectedSize || p.sizes?.includes(selectedSize);
    const matchesZone =
      !selectedZone ||
      p.zone === selectedZone ||
      p.zone === "Global" ||
      p.zone === "Toute la Tunisie";
    // Products from admin use categoryId for both parent/child selection
    const matchesSubCat =
      !selectedSubCat ||
      p.categoryId === selectedSubCat ||
      p.subCategoryId === selectedSubCat;
    return (
      matchesSearch &&
      matchesColor &&
      matchesSize &&
      matchesZone &&
      matchesSubCat
    );
  });

  const sortedProducts = [...filteredProducts].sort((a: any, b: any) => {
    if (sortBy === "priceLowHigh") return a.price - b.price;
    if (sortBy === "priceHighLow") return b.price - a.price;
    if (sortBy === "newest")
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    return 0;
  });

  const availableColors = Array.from(
    new Set(products.flatMap((p) => p.colors || [])),
  );
  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"].filter((s) =>
    products.some((p) => p.sizes?.includes(s)),
  );
  const availableZones = Array.from(
    new Set(
      products
        .map((p) => p.zone)
        .filter(Boolean)
        .filter((z) => z !== "Global"),
    ),
  );

  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("error"), t("locationPermissionDenied"));
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const reverse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (reverse && reverse[0]) {
        const city = reverse[0].city || reverse[0].region;
        if (city) {
          setSelectedZone(city);
          Alert.alert(t("locationDetected"), `${t("filteringBy")} ${city}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGettingLocation(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      {/* Fixed Solid Header — no BlurView animation to avoid crash */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: HEADER_HEIGHT,
          paddingTop: insets.top,
          backgroundColor: colors.background,
          borderBottomWidth: scrolled ? 1 : 0,
          borderBottomColor:
            theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          elevation: 10,
        }}
      >
        {/* Top Location Bar (Like Category Screen) */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingHorizontal: 20,
            paddingTop: 5,
            marginBottom: 5,
            zIndex: 2000,
          }}
        >
          {gettingLocation ? (
            <ActivityIndicator
              size="small"
              color={colors.accent}
              style={{ marginRight: 10 }}
            />
          ) : (
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TouchableOpacity
                onPress={handleGetCurrentLocation}
                style={[
                  styles.catChip,
                  {
                    backgroundColor:
                      selectedZone && selectedZone !== "Global"
                        ? colors.accent
                        : theme === "dark"
                          ? "#1C1C1E"
                          : "#F2F2F7",
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    height: 28,
                  },
                ]}
              >
                <MapPin
                  size={10}
                  color={
                    selectedZone && selectedZone !== "Global"
                      ? "#FFF"
                      : colors.textMuted
                  }
                />
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "800",
                    color:
                      selectedZone && selectedZone !== "Global"
                        ? "#FFF"
                        : colors.textMuted,
                  }}
                >
                  {(t("nearMe") || "Near Me").toUpperCase()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedZone("Global")}
                style={[
                  styles.catChip,
                  {
                    backgroundColor:
                      selectedZone === "Global"
                        ? colors.accent
                        : theme === "dark"
                          ? "#17171F"
                          : "#F2F2F7",
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    height: 28,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "800",
                    color:
                      selectedZone === "Global" ? "#FFF" : colors.textMuted,
                  }}
                >
                  {(t("global") || "Global").toUpperCase()}
                </Text>
              </TouchableOpacity>

              {selectedZone && selectedZone !== "Global" && (
                <TouchableOpacity
                  onPress={() => setSelectedZone(null)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: colors.accent,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      height: 28,
                    },
                  ]}
                >
                  <Text
                    style={{ fontSize: 9, fontWeight: "800", color: "#FFF" }}
                  >
                    {selectedZone.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.modernHeader}>
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtnSmall,
              { backgroundColor: theme === "dark" ? "#000" : "#F2F2F7" },
            ]}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text
              pointerEvents="none"
              style={[
                styles.modernLogo,
                {
                  letterSpacing: 4,
                  color: colors.foreground,
                  marginLeft: 0,
                  marginBottom: 2,
                  height: "auto",
                },
              ]}
            >
              {t("shop")}
            </Text>
            <Text
              style={{
                fontSize: 9,
                fontWeight: "800",
                color: colors.textMuted,
                opacity: 0.7,
              }}
            >
              {products.length} {(t("products") || "Produits").toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.searchCircle,
              { backgroundColor: theme === "dark" ? "#000" : "#F2F2F7" },
            ]}
            activeOpacity={0.7}
            onPress={() => setShowSortSheet(true)}
          >
            <Sliders size={18} color={colors.foreground} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Fixed Search, Locations and Categories in Header */}
        <View
          style={{ paddingHorizontal: 20, paddingBottom: 10, zIndex: 1000 }}
        >
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)",
                borderColor: isSearchFocused
                  ? colors.foreground
                  : theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                borderWidth: 1,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 15,
                marginBottom: 12,
                height: 50,
                borderRadius: 25,
                elevation: 5,
                shadowColor: colors.foreground,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isSearchFocused ? 0.2 : 0,
                shadowRadius: isSearchFocused ? 10 : 0,
              },
            ]}
          >
            <Search
              size={18}
              color={isSearchFocused ? colors.foreground : "#888"}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={{
                flex: 1,
                height: "100%",
                color: colors.foreground,
                fontSize: 14,
                fontWeight: "600",
              }}
              placeholder={t("searchCollections")}
              placeholderTextColor="#888"
              value={search}
              onChangeText={setSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </View>

          <View style={{ height: 10 }} />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20, marginTop: 10 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: 8,
              alignItems: "center",
            }}
          >
            {/* Categories */}
            <TouchableOpacity
              style={[
                styles.catChip,
                {
                  backgroundColor: theme === "dark" ? "#000" : "#F2F2F7",
                  borderRadius: 20,
                  height: 32,
                  paddingHorizontal: 16,
                },
                !selectedCat && { backgroundColor: colors.foreground },
              ]}
              onPress={() => setSelectedCat(null)}
            >
              <Text
                style={[
                  styles.catChipText,
                  { fontSize: 11, fontWeight: "700", color: colors.textMuted },
                  !selectedCat && { color: theme === "dark" ? "#000" : "#FFF" },
                ]}
              >
                {t("all")}
              </Text>
            </TouchableOpacity>

            {categories
              .filter((c) => {
                const pId = String(c.parentId);
                return (
                  !c.parentId ||
                  pId === "" ||
                  pId === "null" ||
                  pId === "undefined" ||
                  pId === "0"
                );
              })
              .filter(
                (c, i, self) =>
                  self.findIndex((t) => getName(t.name) === getName(c.name)) ===
                  i,
              ) // Unique by name
              .map((cat, index) => {
                const categoryColors = [
                  "#FF6B6B",
                  "#4ECDC4",
                  "#3498DB",
                  "#FFEEAD",
                  "#96CEB4",
                  "#D4A5A5",
                  "#9B59B6",
                  "#45B7D1",
                  "#E67E22",
                ];
                const catColor =
                  categoryColors[index % categoryColors.length] ||
                  colors.accent;
                const isActive = selectedCat === cat.id;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: isActive
                          ? catColor
                          : theme === "dark"
                            ? "#1C1C1E"
                            : "#F2F2F7",
                        borderRadius: 20,
                        height: 32,
                        paddingHorizontal: 16,
                        borderWidth: isActive ? 2 : 0,
                        borderColor: isActive ? catColor : "transparent",
                      },
                    ]}
                    onPress={() => setSelectedCat(cat.id)}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        {
                          color: isActive
                            ? "#FFF"
                            : theme === "dark"
                              ? "#888"
                              : "#666",
                          fontSize: 11,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {translateCategory(getName(cat.name)).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}

            {/* Divider and Brands */}
            {brands.length > 0 && (
              <>
                <View
                  style={{
                    width: 1,
                    height: 20,
                    backgroundColor: colors.border,
                    marginHorizontal: 4,
                  }}
                />

                <TouchableOpacity
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: theme === "dark" ? "#000" : "#F2F2F7",
                      borderRadius: 20,
                      height: 32,
                      paddingHorizontal: 16,
                    },
                    !selectedBrand && { backgroundColor: colors.foreground },
                  ]}
                  onPress={() => setSelectedBrand(null)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      { fontSize: 11, fontWeight: "700" },
                      !selectedBrand
                        ? { color: theme === "dark" ? "#000" : "#FFF" }
                        : { color: colors.textMuted },
                    ]}
                  >
                    {t("brands").toUpperCase()}
                  </Text>
                </TouchableOpacity>

                {brands.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: theme === "dark" ? "#000" : "#F2F2F7",
                        borderRadius: 20,
                        height: 32,
                        paddingHorizontal: 16,
                        borderColor:
                          selectedBrand === b.id
                            ? colors.foreground
                            : "transparent",
                      },
                      selectedBrand === b.id && {
                        backgroundColor: colors.foreground,
                      },
                    ]}
                    onPress={() => setSelectedBrand(b.id)}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        { fontSize: 11, fontWeight: "600" },
                        selectedBrand === b.id
                          ? { color: theme === "dark" ? "#000" : "#FFF" }
                          : { color: colors.textMuted },
                      ]}
                    >
                      {getName(b.name).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <View style={{ width: 40 }} />
          </ScrollView>

          {/* Subcategories Row - conditionally rendered only when a category is selected */}
          {selectedCat && subCategories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -20, marginTop: 10 }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                gap: 8,
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                style={[
                  styles.catChip,
                  {
                    backgroundColor: theme === "dark" ? "#000" : "#F2F2F7",
                    borderRadius: 20,
                    height: 28,
                    paddingHorizontal: 12,
                  },
                  !selectedSubCat && { backgroundColor: colors.accent },
                ]}
                onPress={() => setSelectedSubCat(null)}
              >
                <Text
                  style={[
                    styles.catChipText,
                    {
                      fontSize: 10,
                      fontWeight: "700",
                      color: colors.textMuted,
                    },
                    !selectedSubCat && { color: "#FFF" },
                  ]}
                >
                  {t("all")}
                </Text>
              </TouchableOpacity>

              {subCategories.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor:
                        selectedSubCat === sub.id
                          ? colors.accent
                          : theme === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "#F2F2F7",
                      borderRadius: 20,
                      height: 28,
                      paddingHorizontal: 12,
                    },
                  ]}
                  onPress={() => setSelectedSubCat(sub.id)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      {
                        color:
                          selectedSubCat === sub.id
                            ? "#FFF"
                            : theme === "dark"
                              ? "#888"
                              : "#666",
                        fontSize: 10,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {getName(sub.name).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={{ width: 40 }} />
            </ScrollView>
          )}
        </View>
      </View>

      <FlatList
        data={sortedProducts}
        keyExtractor={(item: any) => item.id}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          setScrolled(y > 10);
          scrollY.setValue(y);
        }}
        scrollEventThrottle={32}
        keyboardShouldPersistTaps="handled"
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        snapToAlignment="start"
        removeClippedSubviews={true}
        maxToRenderPerBatch={4}
        windowSize={5}
        initialNumToRender={3}
        getItemLayout={(_data, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT,
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        ListHeaderComponent={loading ? <View style={{ height: 20 }} /> : null}
        ListEmptyComponent={
          loading ? (
            <View style={{ marginTop: 100 }}>
              <ActivityIndicator color={colors.foreground} />
            </View>
          ) : (
            <View
              style={[
                styles.centered,
                { marginTop: 100, backgroundColor: colors.background },
              ]}
            >
              <ShoppingBag
                size={64}
                color={theme === "dark" ? "#222" : "#EEE"}
                strokeWidth={1.5}
              />
              <Text
                style={[
                  styles.modernSectionTitle,
                  {
                    marginTop: 20,
                    color: colors.textMuted,
                    textAlign: "center",
                    paddingHorizontal: 40,
                  },
                ]}
              >
                {t("noProductsInCategory")}
              </Text>
            </View>
          )
        }
        renderItem={({ item: p }) => (
          <View style={{ height: CARD_HEIGHT, marginBottom: 20 }}>
            <ProductCard
              product={p}
              onPress={() => onProductPress(p)}
              isWishlisted={wishlist?.includes(p.id)}
              onToggleWishlist={() => toggleWishlist(p.id)}
              onAddToCart={() => addToCart(p)}
              showRating={true}
              theme={theme}
              language={language}
              t={t}
              colors={colors}
              isFeaturedHero={true}
            />
          </View>
        )}
      />

      {/* Sort Sheet Modal */}
      <Modal visible={showSortSheet} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onPress={() => setShowSortSheet(false)}
          />
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              padding: 25,
              paddingBottom: 50,
            }}
          >
            <View
              style={{
                width: 40,
                height: 5,
                backgroundColor: theme === "dark" ? "#333" : "#E5E5EA",
                borderRadius: 5,
                alignSelf: "center",
                marginBottom: 25,
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
                  fontSize: 18,
                  fontWeight: "900",
                  letterSpacing: 1,
                  color: colors.foreground,
                }}
              >
                {t("filtersSort")}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSortBy(null);
                  setSelectedColor(null);
                  setSelectedSize(null);
                  setSelectedBrand(null);
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.error,
                  }}
                >
                  {t("clearAll")}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: height * 0.6 }}
            >
              {/* Sort Section */}
              <Text style={[styles.settingsLabel, { color: colors.textMuted }]}>
                {t("sortBy")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 30,
                }}
              >
                {[
                  { label: t("newest"), value: "newest" },
                  { label: t("priceLowHigh"), value: "priceLowHigh" },
                  { label: t("priceHighLow"), value: "priceHighLow" },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor:
                          sortBy === opt.value
                            ? colors.foreground
                            : theme === "dark"
                              ? "#17171F"
                              : "#F2F2F7",
                        borderColor:
                          sortBy === opt.value
                            ? colors.foreground
                            : colors.border,
                      },
                    ]}
                    onPress={() => setSortBy(opt.value)}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        {
                          color:
                            sortBy === opt.value
                              ? theme === "dark"
                                ? "#000"
                                : "#FFF"
                              : colors.textMuted,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Brand Filter Section */}
              {brands.length > 0 && (
                <>
                  <Text
                    style={[styles.settingsLabel, { color: colors.textMuted }]}
                  >
                    {t("brands")}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 10,
                      marginBottom: 30,
                    }}
                  >
                    {brands.map((b: any) => (
                      <TouchableOpacity
                        key={b.id}
                        onPress={() =>
                          setSelectedBrand(selectedBrand === b.id ? null : b.id)
                        }
                        style={[
                          styles.catChip,
                          {
                            backgroundColor:
                              selectedBrand === b.id
                                ? colors.foreground
                                : theme === "dark"
                                  ? "#17171F"
                                  : "#F2F2F7",
                            borderColor:
                              selectedBrand === b.id
                                ? colors.foreground
                                : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.catChipText,
                            {
                              color:
                                selectedBrand === b.id
                                  ? theme === "dark"
                                    ? "#000"
                                    : "#FFF"
                                  : colors.textMuted,
                            },
                          ]}
                        >
                          {getName(b.name)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Location / Zone Filter */}
              {availableZones.length > 0 && (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={[
                        styles.settingsLabel,
                        { color: colors.textMuted, marginBottom: 0 },
                      ]}
                    >
                      {t("location")}
                    </Text>
                    <TouchableOpacity
                      onPress={handleGetCurrentLocation}
                      disabled={gettingLocation}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {gettingLocation ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <MapPin size={14} color={colors.accent} />
                      )}
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: colors.accent,
                        }}
                      >
                        {t("useMyLocation")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 30,
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: !selectedZone
                            ? colors.foreground
                            : theme === "dark"
                              ? "rgba(255,255,255,0.05)"
                              : "#F2F2F7",
                          borderRadius: 20,
                          height: 32,
                          paddingHorizontal: 16,
                        },
                      ]}
                      onPress={() => setSelectedZone(null)}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          {
                            fontSize: 11,
                            fontWeight: "700",
                            color: !selectedZone
                              ? theme === "dark"
                                ? "#000"
                                : "#FFF"
                              : theme === "dark"
                                ? "#888"
                                : "#666",
                          },
                        ]}
                      >
                        {t("allZones")}
                      </Text>
                    </TouchableOpacity>
                    {availableZones.map((z: any) => (
                      <TouchableOpacity
                        key={z}
                        style={[
                          styles.catChip,
                          {
                            backgroundColor:
                              selectedZone === z
                                ? colors.foreground
                                : theme === "dark"
                                  ? "rgba(255,255,255,0.05)"
                                  : "#F2F2F7",
                            borderRadius: 20,
                            height: 32,
                            paddingHorizontal: 16,
                          },
                        ]}
                        onPress={() => setSelectedZone(z)}
                      >
                        <Text
                          style={[
                            styles.catChipText,
                            {
                              fontSize: 11,
                              fontWeight: "700",
                              color:
                                selectedZone === z
                                  ? theme === "dark"
                                    ? "#000"
                                    : "#FFF"
                                  : theme === "dark"
                                    ? "#888"
                                    : "#666",
                            },
                          ]}
                        >
                          {z}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Color Section */}
              {availableColors.length > 0 && (
                <>
                  <Text
                    style={[styles.settingsLabel, { color: colors.textMuted }]}
                  >
                    {t("colors")}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 12,
                      marginBottom: 30,
                    }}
                  >
                    {availableColors.map((c: string) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() =>
                          setSelectedColor(selectedColor === c ? null : c)
                        }
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          backgroundColor: c.startsWith("#")
                            ? c
                            : c.toLowerCase(),
                          borderWidth: 2,
                          borderColor:
                            selectedColor === c
                              ? colors.foreground
                              : theme === "dark"
                                ? "#333"
                                : "#EEE",
                          padding: 2,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: c.startsWith("#")
                              ? c
                              : c.toLowerCase(),
                            borderWidth: 1,
                            borderColor:
                              c.toLowerCase() === "black" ||
                              c === "#000" ||
                              c === "#000000"
                                ? "rgba(255,255,255,0.3)"
                                : "rgba(0,0,0,0.1)",
                          }}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Size Section */}
              {availableSizes.length > 0 && (
                <>
                  <Text
                    style={[styles.settingsLabel, { color: colors.textMuted }]}
                  >
                    {t("sizes")}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 10,
                      marginBottom: 20,
                    }}
                  >
                    {availableSizes.map((s: string) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() =>
                          setSelectedSize(selectedSize === s ? null : s)
                        }
                        style={[
                          styles.modernSizeBtn,
                          {
                            borderColor:
                              selectedSize === s
                                ? colors.foreground
                                : colors.border,
                          },
                          selectedSize === s && {
                            backgroundColor: colors.foreground,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modernSizeText,
                            { color: colors.foreground },
                            selectedSize === s && {
                              color: theme === "dark" ? "#000" : "#FFF",
                            },
                          ]}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.mainActionBtn,
                {
                  marginTop: 20,
                  backgroundColor: theme === "dark" ? "#FFFFFF" : "#000000",
                },
              ]}
              onPress={() => setShowSortSheet(false)}
            >
              <Text
                style={[
                  styles.mainActionBtnText,
                  {
                    color: theme === "dark" ? "#000" : "#FFF",
                    fontSize: 13,
                    fontWeight: "900",
                  },
                ]}
              >
                {t("showResults")} ({sortedProducts.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function CartScreen({
  cart,
  onRemove,
  onUpdateQuantity,
  onComplete,
  profileData,
  updateProfile,
  onBack,
  t,
  onShowScanner,
}: any) {
  const { colors, theme } = useAppTheme();
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(true);
  const [biometricType, setBiometricType] = useState<string>("");

  useEffect(() => {
    const getBiometricType = async () => {
      try {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          )
        ) {
          setBiometricType("FaceID");
        } else if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          setBiometricType(Platform.OS === "ios" ? "TouchID" : "Fingerprint");
        } else {
          setBiometricType("Biometrics");
        }
      } catch (e) {
        setBiometricType("Biometrics");
      }
    };
    getBiometricType();
  }, []);

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const [name, setName] = useState(
    profileData?.fullName || auth.currentUser?.displayName || "",
  );
  const [phone, setPhone] = useState(profileData?.phone || "");
  const [address, setAddress] = useState(profileData?.address || "");

  useEffect(() => {
    if (profileData) {
      if (!name) setName(profileData.fullName || "");
      if (!phone) setPhone(profileData.phone || "");
      if (!address) setAddress(profileData.address || "");
    }
  }, [profileData]);

  // Use discountPrice if available, otherwise use regular price
  const subtotal = cart.reduce((sum: number, item: any) => {
    const itemPrice =
      item.discountPrice !== undefined && item.discountPrice !== null
        ? Number(item.discountPrice)
        : Number(item.price);
    return sum + itemPrice * (item.quantity || 1);
  }, 0);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [showCouponInput, setShowCouponInput] = useState(false);

  useEffect(() => {
    if (cart.length === 0) {
      setAppliedCoupon(null);
      setCouponCode("");
      setShowCouponInput(false);
    }
  }, [cart]);

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");

    const normalizedCode = couponCode.trim().toUpperCase();
    console.log("🔍 Validating coupon:", normalizedCode);

    try {
      // First, try case-insensitive search by fetching all active coupons
      const q = query(collection(db, "coupons"), where("isActive", "==", true));
      const querySnapshot = await getDocs(q);

      console.log("📦 Total active coupons found:", querySnapshot.size);

      // Find matching coupon (case-insensitive)
      const matchingDoc = querySnapshot.docs.find((doc) => {
        const docCode = doc.data().code;
        const normalizedDocCode = String(docCode || "")
          .trim()
          .toUpperCase();
        console.log("  Comparing:", normalizedCode, "with", normalizedDocCode);
        return normalizedDocCode === normalizedCode;
      });

      if (!matchingDoc) {
        console.log("❌ No matching coupon found");
        setCouponError(t("invalidCoupon"));
        return;
      }

      const coupon = { id: matchingDoc.id, ...matchingDoc.data() } as any;
      console.log("✅ Coupon found:", coupon.code, "Type:", coupon.type);

      if (coupon.minOrder && subtotal < parseFloat(coupon.minOrder)) {
        console.log(
          "❌ Minimum order not met:",
          subtotal,
          "<",
          coupon.minOrder,
        );
        setCouponError(`${t("minOrder")}: ${coupon.minOrder} TND`);
        return;
      }

      if (coupon.type === "bundle_price" && coupon.targetProductId) {
        const targetItem = cart.find(
          (i: any) => i.id === coupon.targetProductId,
        );
        if (!targetItem) {
          console.log("❌ Required product not in cart");
          setCouponError("Required product not in cart");
          return;
        }
      }

      console.log("🎉 Coupon applied successfully");
      setAppliedCoupon(coupon);
      setCouponCode("");
    } catch (err) {
      console.error("❌ Coupon validation error:", err);
      setCouponError(t("errorCoupon"));
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const calculateTotal = () => {
    let deliveryCost =
      cart.length > 0
        ? Math.max(
            ...cart.map((i: any) =>
              i.deliveryPrice !== undefined && i.deliveryPrice !== null
                ? Number(i.deliveryPrice)
                : 7,
            ),
          )
        : 0;

    let discountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === "free_shipping") {
        deliveryCost = 0;
      } else if (appliedCoupon.type === "percentage") {
        discountAmount = subtotal * (parseFloat(appliedCoupon.value) / 100);
      } else if (appliedCoupon.type === "fixed") {
        discountAmount = parseFloat(appliedCoupon.value);
      } else if (
        appliedCoupon.type === "bundle_price" &&
        appliedCoupon.targetProductId
      ) {
        const targetItem = cart.find(
          (i: any) => i.id === appliedCoupon.targetProductId,
        );
        if (targetItem) {
          const qty = targetItem.quantity || 1;
          // Check for exact tier match first
          const tier = appliedCoupon.tiers?.find(
            (t: any) => Number(t.qty) === qty,
          );

          if (tier) {
            const actualItemPrice =
              targetItem.discountPrice !== undefined &&
              targetItem.discountPrice !== null
                ? Number(targetItem.discountPrice)
                : Number(targetItem.price);
            const originalPrice = actualItemPrice * qty;
            const bundlePrice = Number(tier.price);
            if (originalPrice > bundlePrice) {
              discountAmount = originalPrice - bundlePrice;
            }
          }
        }
      }
    }

    let discountedSubtotal = Math.max(0, subtotal - discountAmount);
    return {
      total: discountedSubtotal + deliveryCost,
      deliveryCost,
      discountAmount,
      discountedSubtotal,
      subtotal,
    };
  };

  const { total, deliveryCost, discountAmount, discountedSubtotal } =
    calculateTotal();

  const placeOrder = async () => {
    if (!name || !phone || !address) {
      setShowAddressForm(true);
      return;
    }

    setCheckingOut(true);
    try {
      // Biometric Authentication check
      if (profileData?.settings?.faceId) {
        // Safe require to prevent crash if module is missing
        let LocalAuth: any = null;
        try {
          LocalAuth = require("expo-local-authentication");
        } catch (e) {
          console.warn(
            "ExpoLocalAuthentication module not found in this build.",
          );
        }

        if (LocalAuth && typeof LocalAuth.authenticateAsync === "function") {
          const hasHardware = await LocalAuth.hasHardwareAsync();
          const isEnrolled = await LocalAuth.isEnrolledAsync();

          if (hasHardware && isEnrolled) {
            const authResult = await LocalAuth.authenticateAsync({
              promptMessage: t("useBiometricToPay").replace(
                "{{type}}",
                biometricType || "Biometrics",
              ),
              fallbackLabel: t("password"),
              disableDeviceFallback: false,
            });

            if (!authResult.success) {
              setCheckingOut(false);
              return;
            }
          }
        }
      }

      await updateProfile({ fullName: name, phone, address });
      const orderDoc = await addDoc(collection(db, "orders"), {
        items: cart,
        total: Number(total),
        subtotal: Number(subtotal),
        discount: Number(discountAmount),
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        deliveryCost: Number(deliveryCost),
        status: "pending",
        createdAt: serverTimestamp(),
        customer: {
          uid: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          fullName: name,
          phone,
          address,
        },
      });

      // Create automatic shipment for delivery
      let trackingInfo: { trackingId: string } | null = null;
      try {
        const { createShipmentFromOrder } =
          await import("./src/utils/shipping");
        trackingInfo = await createShipmentFromOrder({
          customerId: auth.currentUser?.uid,
          customerName: name,
          phone,
          address,
          items: cart.map((item: any) => item.name || item.title),
          total: Number(total),
          deliveryCost: Number(deliveryCost),
          orderId: orderDoc.id,
        });

        if (trackingInfo?.trackingId) {
          await updateDoc(doc(db, "orders", orderDoc.id), {
            trackingId: trackingInfo.trackingId,
          });
        }
      } catch (shipmentError) {
        console.log("Auto shipment creation error:", shipmentError);
      }
      // Send notifications
      try {
        let orderSuccessBody = t("notifOrderSuccessBody").replace(
          "{{orderId}}",
          orderDoc.id.slice(0, 8).toUpperCase(),
        );
        await addDoc(collection(db, "notifications"), {
          userId: auth.currentUser?.uid,
          title: t("notifOrderSuccessTitle"),
          body: orderSuccessBody,
          data: { orderId: orderDoc.id, type: "order_placed" },
          read: false,
          createdAt: serverTimestamp(),
          type: "order",
        });

        let adminOrderBody = t("notifNewOrderAdminBody")
          .replace("{{amount}}", Number(total).toFixed(3))
          .replace("{{customer}}", name);
        await addDoc(collection(db, "notifications"), {
          userId: "ADMIN",
          title: t("notifNewOrderAdminTitle"),
          body: adminOrderBody,
          data: {
            orderId: orderDoc.id,
            amount: Number(total).toFixed(3),
            customer: name,
          },
          read: false,
          createdAt: serverTimestamp(),
          type: "order",
        });
      } catch (err) {
        console.error("Order notification error:", err);
      }

      setOrderDone(true);
      setTimeout(() => {
        if (trackingInfo?.trackingId) {
          Alert.alert(
            t("orderPlaced") || "Order Placed!",
            `${t("yourTrackingId") || "Your Tracking ID"}: ${trackingInfo.trackingId}\n${t("trackOrderMessage") || "You can track your order in My Shipments!"}`,
            [{ text: "OK", onPress: onComplete }],
          );
        } else {
          onComplete();
        }
      }, 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingOut(false);
    }
  };

  if (orderDone) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <CheckCircle2 size={80} color="#27ae60" strokeWidth={1.5} />
        <Text
          style={[
            styles.modernSectionTitle,
            { marginTop: 25, fontSize: 18, color: colors.foreground },
          ]}
        >
          {t("thankYou")}
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: 10 }}>
          {t("preparingDelivery")}
        </Text>
      </View>
    );
  }

  if (cart.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ShoppingBag
          size={64}
          color={theme === "dark" ? "#222" : "#EEE"}
          strokeWidth={1}
        />
        <Text
          style={[
            styles.modernSectionTitle,
            { marginTop: 20, color: colors.textMuted },
          ]}
        >
          {t("emptyCart")}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      {/* Animated Blur Header */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 64 + insets.top,
            paddingTop: insets.top,
            borderBottomWidth: headerOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            borderBottomColor:
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          },
        ]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}
        >
          <BlurView
            intensity={80}
            style={StyleSheet.absoluteFill}
            tint={theme}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.background + "66" },
            ]}
          />
        </Animated.View>

        <View
          style={[
            styles.modernHeader,
            { paddingLeft: 20, backgroundColor: "transparent" },
          ]}
        >
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtnSmall,
              {
                backgroundColor: theme === "dark" ? "#000" : "#F2F2F7",
                marginRight: 15,
              },
            ]}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            pointerEvents="none"
            style={[styles.modernLogo, { color: colors.foreground }]}
          >
            {t("yourBag")} ({cart.length})
          </Text>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 64 + insets.top }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {cart.map((item: any) => (
            <View
              key={item.cartId}
              style={[
                styles.modernCartItem,
                {
                  marginHorizontal: 4,
                  marginBottom: 16,
                  backgroundColor: theme === "dark" ? "#121218" : "white",
                  borderColor: colors.border,
                  padding: 16,
                },
              ]}
            >
              <Image
                source={{
                  uri:
                    item.mainImage ||
                    item.image ||
                    item.imageUrl ||
                    "https://images.unsplash.com/photo-1544022613-e87ef75a758a?w=400",
                }}
                style={styles.modernCartImg}
              />
              <View style={{ flex: 1, marginLeft: 14 }}>
                {/* Category Label */}
                {item.category && (
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "900",
                      color: colors.accent,
                      letterSpacing: 1,
                      marginBottom: 4,
                    }}
                  >
                    {item.category.toUpperCase()}
                  </Text>
                )}

                {/* Title Row with Delete Button */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={[
                      styles.modernCartName,
                      { color: colors.foreground, flex: 1, paddingRight: 8 },
                    ]}
                  >
                    {getName(item.name).toUpperCase()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onRemove(item.cartId)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ padding: 4 }}
                  >
                    <Trash2 size={18} color={colors.error} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {/* Size & Color */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: theme === "dark" ? "#1C1C1E" : "#F2F2F7",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: theme === "dark" ? "#999" : "#666",
                      }}
                    >
                      {item.selectedSize}
                    </Text>
                  </View>
                  {item.selectedColor && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <View
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: colorNameToHex(item.selectedColor),
                          borderWidth: 1.5,
                          borderColor: theme === "dark" ? "#333" : "#FFF",
                          shadowColor: "#000",
                          shadowOpacity: 0.1,
                          shadowRadius: 1,
                          elevation: 1,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: colors.textMuted,
                          textTransform: "uppercase",
                        }}
                      >
                        {translateColor(item.selectedColor)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Price & Quantity Row */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {/* Prices on same line */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={[
                        styles.modernCartPrice,
                        {
                          color: colors.foreground,
                          fontSize: 16,
                          fontWeight: "900",
                        },
                      ]}
                    >
                      {(item.discountPrice !== undefined &&
                      item.discountPrice !== null
                        ? Number(item.discountPrice)
                        : Number(item.price)
                      ).toFixed(3)}{" "}
                      TND
                    </Text>
                    {item.discountPrice !== undefined &&
                      item.discountPrice !== null &&
                      item.discountPrice < item.price && (
                        <Text
                          style={{
                            fontSize: 11,
                            color: colors.textMuted,
                            textDecorationLine: "line-through",
                            fontWeight: "600",
                          }}
                        >
                          {Number(item.price).toFixed(3)} TND
                        </Text>
                      )}
                  </View>

                  {/* Smaller Quantity Controls */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: theme === "dark" ? "#17171F" : "#F9F9F9",
                      borderRadius: 10,
                      padding: 3,
                      gap: 8,
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        backgroundColor: theme === "dark" ? "#222" : "white",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() => onUpdateQuantity(item.cartId, -1)}
                    >
                      <Minus
                        size={13}
                        color={colors.foreground}
                        strokeWidth={2.5}
                      />
                    </TouchableOpacity>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "900",
                        minWidth: 20,
                        textAlign: "center",
                        color: colors.foreground,
                      }}
                    >
                      {item.quantity || 1}
                    </Text>
                    <TouchableOpacity
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        backgroundColor: theme === "dark" ? "#222" : "white",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() => onUpdateQuantity(item.cartId, 1)}
                    >
                      <Plus
                        size={13}
                        color={colors.foreground}
                        strokeWidth={2.5}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.modernCartSummary,
            { backgroundColor: theme === "dark" ? "#121218" : "white" },
          ]}
        >
          <View style={{ marginBottom: 25 }}>
            <Text
              style={[styles.modernSectionTitle, { color: colors.foreground }]}
            >
              {t("deliveryDetails")}
            </Text>
            <View style={{ marginTop: 15, gap: 12 }}>
              <TextInput
                style={[
                  styles.modernCartInput,
                  {
                    backgroundColor: theme === "dark" ? "#17171F" : "#F9F9F9",
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t("fullName")}
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={[
                  styles.modernCartInput,
                  {
                    backgroundColor: theme === "dark" ? "#17171F" : "#F9F9F9",
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t("phone")}
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              {profileData?.addresses?.length > 0 && (
                <View style={{ marginTop: 5 }}>
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "900",
                      color: colors.textMuted,
                      marginBottom: 8,
                      letterSpacing: 1,
                    }}
                  >
                    {t("manageAddresses")}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {profileData.addresses.map((a: any) => (
                      <TouchableOpacity
                        key={a.id}
                        onPress={() => setAddress(a.text)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor:
                            address === a.text
                              ? colors.foreground
                              : theme === "dark"
                                ? "#17171F"
                                : "#F2F2F7",
                          borderWidth: 1,
                          borderColor:
                            address === a.text
                              ? colors.foreground
                              : colors.border,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <MapPin
                            size={10}
                            color={
                              address === a.text
                                ? theme === "dark"
                                  ? "#000"
                                  : "#FFF"
                                : colors.textMuted
                            }
                          />
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "800",
                              color:
                                address === a.text
                                  ? theme === "dark"
                                    ? "#000"
                                    : "#FFF"
                                  : colors.foreground,
                            }}
                          >
                            {a.text.length > 25
                              ? a.text.substring(0, 25) + "..."
                              : a.text}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <TextInput
                style={[
                  styles.modernCartInput,
                  {
                    backgroundColor: theme === "dark" ? "#17171F" : "#F9F9F9",
                    color: colors.foreground,
                    borderColor: colors.border,
                    minHeight: 60,
                  },
                ]}
                placeholder={t("shippingAddress")}
                placeholderTextColor="#999"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Coupon Section */}
          <View style={{ marginBottom: 25 }}>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
              onPress={() => setShowCouponInput(!showCouponInput)}
            >
              <Text
                style={[
                  styles.modernSectionTitle,
                  { fontSize: 13, letterSpacing: 1, color: colors.foreground },
                ]}
              >
                {t("couponCode")}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: Colors.textMuted,
                }}
              >
                {showCouponInput ? "-" : "+"}
              </Text>
            </TouchableOpacity>

            {showCouponInput && (
              <>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    style={[
                      styles.modernCartInput,
                      {
                        flex: 1,
                        textTransform: "uppercase",
                        height: 54,
                        backgroundColor:
                          theme === "dark" ? "#17171F" : "#FAFAFA",
                        borderColor: colors.border,
                        borderWidth: 1,
                        color: colors.foreground,
                      },
                    ]}
                    placeholder={t("enterCouponCode")}
                    placeholderTextColor={colors.textMuted}
                    value={couponCode}
                    onChangeText={setCouponCode}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.foreground,
                      paddingHorizontal: 20,
                      justifyContent: "center",
                      borderRadius: 12,
                      height: 54,
                    }}
                    onPress={validateCoupon}
                  >
                    <Text
                      style={{
                        color: theme === "dark" ? "#000" : "#FFF",
                        fontWeight: "700",
                        fontSize: 13,
                        letterSpacing: 0.5,
                      }}
                    >
                      {t("apply")}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: theme === "dark" ? "#17171F" : "#F2F2F7",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 15,
                    borderRadius: 12,
                    gap: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderStyle: "dashed",
                    marginTop: 12,
                  }}
                  onPress={onShowScanner}
                >
                  <QrCode size={20} color={colors.foreground} />
                  <Text
                    style={{
                      color: colors.foreground,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    {t("scanToGetDiscounts")}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {couponError ? (
              <Text
                style={{
                  color: Colors.error,
                  fontSize: 11,
                  marginTop: 5,
                  fontWeight: "700",
                }}
              >
                {couponError}
              </Text>
            ) : null}

            {appliedCoupon && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 10,
                  backgroundColor: "#E8F5E9",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{ fontSize: 12, fontWeight: "700", color: "#2E7D32" }}
                >
                  {t("couponApplied")}: {appliedCoupon.code}
                  {appliedCoupon.type === "percentage" &&
                    ` (-${appliedCoupon.value}%)`}
                  {appliedCoupon.type === "fixed" &&
                    ` (-${appliedCoupon.value} TND)`}
                  {appliedCoupon.type === "free_shipping" && ` (Free Ship)`}
                </Text>
                <TouchableOpacity onPress={removeCoupon}>
                  <X size={16} color="#2E7D32" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Summary Section */}
          <View style={{ marginTop: 8 }}>
            <View style={[styles.summaryRow, { marginBottom: 12 }]}>
              <Text style={styles.summaryLabel}>{t("subtotal")}</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                {Number(subtotal).toFixed(3)} TND
              </Text>
            </View>

            {appliedCoupon && Number(discountAmount) > 0 && (
              <View style={[styles.summaryRow, { marginBottom: 12 }]}>
                <Text style={[styles.summaryLabel, { color: "#2E7D32" }]}>
                  {t("discount")}
                </Text>
                <Text style={[styles.summaryValue, { color: "#2E7D32" }]}>
                  -{discountAmount.toFixed(3)} TND
                </Text>
              </View>
            )}

            <View style={[styles.summaryRow, { marginBottom: 20 }]}>
              <Text style={styles.summaryLabel}>{t("delivery")}</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                {deliveryCost === 0 &&
                appliedCoupon?.type === "free_shipping" ? (
                  <Text style={{ color: "#2E7D32", fontWeight: "700" }}>
                    {t("free")}
                  </Text>
                ) : (
                  `${deliveryCost.toFixed(3)} TND`
                )}
              </Text>
            </View>

            <View
              style={[
                styles.summaryRow,
                {
                  paddingTop: 20,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.summaryLabel,
                  { fontSize: 17, fontWeight: "900", color: colors.foreground },
                ]}
              >
                {t("total")}
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { fontSize: 18, color: colors.foreground, fontWeight: "900" },
                ]}
              >
                {Number(total).toFixed(3)} TND
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.mainActionBtn,
              {
                marginTop: 30,
                backgroundColor: theme === "dark" ? "#FFFFFF" : "#000000",
              },
            ]}
            onPress={placeOrder}
            disabled={checkingOut}
          >
            {checkingOut ? (
              <ActivityIndicator color={theme === "dark" ? "#000" : "#FFF"} />
            ) : (
              <Text
                style={[
                  styles.mainActionBtnText,
                  { color: theme === "dark" ? "#000" : "#FFF" },
                ]}
              >
                {t("confirmOrder")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// --- ADMIN SETTINGS (TEAM + SOCIALS) ---

// AdminSettingsScreen is now imported from './src/screens/admin/AdminSettingsScreen.tsx'

function NotificationsScreen({
  notifications,
  language,
  onClear,
  onBack,
  t,
}: any) {
  const { colors, theme } = useAppTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "order":
      case "commande":
      case "طلب":
        return <ShoppingBag size={18} color={colors.accent} />;
      case "delivery":
      case "livraison":
      case "توصيل":
        return <Truck size={18} color={colors.accent} />;
      case "payment":
      case "paiement":
      case "دفع":
        return <CreditCard size={18} color={colors.accent} />;
      case "promo":
      case "offer":
      case "offre":
      case "عرض":
        return <Gift size={18} color={colors.accent} />;
      case "flash_sale":
      case "flashsale":
        return <Zap size={18} color={colors.accent} />;
      case "like":
      case "heart":
        return <Heart size={18} color={colors.accent} />;
      case "comment":
      case "commentaire":
        return <MessageCircle size={18} color={colors.accent} />;
      case "follow":
      case "abonnement":
        return <UserPlus size={18} color={colors.accent} />;
      default:
        return <Bell size={18} color={colors.accent} />;
    }
  };

  // Format notification time
  const formatTime = (time: string) => {
    if (!time) return "";
    return time;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      {/* Animated Blur Header */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 64 + insets.top,
            paddingTop: insets.top,
            borderBottomWidth: headerOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            borderBottomColor:
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          },
        ]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}
        >
          <BlurView
            intensity={80}
            style={StyleSheet.absoluteFill}
            tint={theme}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.background + "66" },
            ]}
          />
        </Animated.View>

        <View style={styles.modernHeader}>
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtnSmall,
              { backgroundColor: theme === "dark" ? "#000" : "#F2F2F7" },
            ]}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            pointerEvents="none"
            style={[styles.modernLogo, { color: colors.foreground }]}
          >
            {t("notifications")}
          </Text>
          <TouchableOpacity onPress={onClear}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: colors.textMuted,
              }}
            >
              {t("clearAll")}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: 64 + insets.top,
          paddingBottom: 100,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View
            style={{
              marginTop: 80,
              alignItems: "center",
              paddingHorizontal: 40,
            }}
          >
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: theme === "dark" ? "#1A1A1A" : "#F5F5F5",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Bell size={48} color={theme === "dark" ? "#333" : "#D1D1D6"} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.foreground,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {t("noNotifications") || "No Notifications Yet"}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textMuted,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              {language === "ar"
                ? "ستظهر إشعاراتك هنا"
                : language === "fr"
                  ? "Vos notifications apparaîtront ici"
                  : "Your notifications will appear here"}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {/* Notification Count Badge */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.textMuted,
                  letterSpacing: 0.5,
                }}
              >
                {notifications.length}{" "}
                {notifications.length === 1
                  ? language === "ar"
                    ? "إشعار"
                    : language === "fr"
                      ? "notification"
                      : "NOTIFICATION"
                  : language === "ar"
                    ? "إشعارات"
                    : language === "fr"
                      ? "notifications"
                      : "NOTIFICATIONS"}
              </Text>
            </View>

            {notifications.map((n: any) => (
              <View
                key={n.id}
                style={[
                  {
                    backgroundColor: theme === "dark" ? "#121218" : "white",
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: !n.read ? colors.accent + "40" : colors.border,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: theme === "dark" ? 0.3 : 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                  },
                  !n.read && {
                    backgroundColor: theme === "dark" ? "#1A1810" : "#FFFCF0",
                  },
                ]}
              >
                <View style={{ padding: 16 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 14,
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Icon Container with gradient background */}
                    <View
                      style={[
                        {
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: !n.read
                            ? colors.accent + "15"
                            : theme === "dark"
                              ? "#1C1C1E"
                              : "#F2F2F7",
                        },
                      ]}
                    >
                      {getNotificationIcon(n.type)}
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: colors.foreground,
                            flex: 1,
                            marginRight: 8,
                          }}
                          numberOfLines={2}
                        >
                          {language === "ar" ? n.titleAr || n.title : n.title}
                        </Text>
                        {!n.read && (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: colors.accent,
                              marginTop: 4,
                            }}
                          />
                        )}
                      </View>

                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.textMuted,
                          lineHeight: 19,
                          marginBottom: 8,
                        }}
                        numberOfLines={3}
                      >
                        {language === "ar"
                          ? n.messageAr || n.message
                          : n.message}
                      </Text>

                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.textMuted,
                          fontWeight: "500",
                        }}
                      >
                        {formatTime(n.time)}
                      </Text>
                    </View>
                  </View>

                  {/* Image Display */}
                  {n.image && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => setSelectedImage(n.image)}
                      style={{ marginTop: 14 }}
                    >
                      <Image
                        source={{ uri: n.image }}
                        style={{
                          width: "100%",
                          height: 180,
                          borderRadius: 14,
                          backgroundColor:
                            theme === "dark" ? "#1C1C1E" : "#F5F5F5",
                        }}
                        resizeMode="cover"
                      />
                      {/* Image overlay hint */}
                      <View
                        style={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          backgroundColor: "rgba(0,0,0,0.6)",
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontSize: 10,
                            fontWeight: "600",
                          }}
                        >
                          {language === "ar"
                            ? "انقر للتكبير"
                            : language === "fr"
                              ? "Appuyez pour zoomer"
                              : "Tap to expand"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Action Buttons (if available) */}
                  {n.actionUrl && (
                    <TouchableOpacity
                      style={{
                        marginTop: 14,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        backgroundColor: colors.accent + "15",
                        borderRadius: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: colors.accent,
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        {language === "ar"
                          ? "عرض التفاصيل"
                          : language === "fr"
                            ? "Voir les détails"
                            : "View Details"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </Animated.ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)" }}>
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 50,
              right: 20,
              zIndex: 10,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => setSelectedImage(null)}
          >
            <X size={24} color="white" />
          </TouchableOpacity>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Helper functions preserved below

// Placeholders for other admin screens
// --- HELPER FUNCTIONS ---
const getString = (val: any) => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return val.toString();
  if (typeof val === "object") {
    if (val["fr"]) return val["fr"];
    if (val["en"]) return val["en"];
    if (val["ar-tn"]) return val["ar-tn"];
    // Manual fallback to first value to avoid Object.values issues
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        return val[key];
      }
    }
  }
  return "";
};

const getStatusColor = (status: any) => {
  const s = getString(status).toLowerCase();
  switch (s) {
    case "pending":
      return "#FF9500";
    case "processing":
      return "#5856D6";
    case "shipped":
      return "#007AFF";
    case "delivered":
      return "#34C759";
    case "cancelled":
      return "#FF3B30";
    default:
      return "#8E8E93";
  }
};

function StatCard({ label, value, icon: Icon, color }: any) {
  const { colors, theme } = useAppTheme();
  const iconColor = color || colors.foreground;
  const bgColor =
    theme === "dark"
      ? color
        ? color + "15"
        : "#17171F"
      : color
        ? color + "10"
        : "#F9F9FB";

  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: theme === "dark" ? "#121218" : "white",
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.statIconBox, { backgroundColor: bgColor }]}>
        <Icon size={20} color={iconColor} strokeWidth={1.8} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

// --- REUSABLE UPLOAD FUNCTION ---
const uploadToCloudinary = async (uri: string) => {
  return await uploadImageToCloudinary(uri);
};

// --- HELPER FOR SAFE STRING RENDERING ---
const getSafeString = (val: any) => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (val.fr) return val.fr;
  if (val["ar-tn"]) return val["ar-tn"];
  return "";
};

function PlaceholderAdminScreen({ title, onBack, t }: any) {
  const { colors, theme } = useAppTheme();
  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.modernHeader,
          { backgroundColor: theme === "dark" ? "#000" : "white" },
        ]}
      >
        <TouchableOpacity
          onPress={onBack}
          style={[
            styles.backBtnSmall,
            { backgroundColor: theme === "dark" ? "#000" : "#F2F2F7" },
          ]}
        >
          <ChevronLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.modernLogo}>
          {title}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.centered}>
        <Text style={{ color: colors.textMuted, fontWeight: "700" }}>
          COMING SOON
        </Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  shippingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  // Admin Menu
  adminMenuCard: {
    width: (width - 55) / 2,
    backgroundColor: "transparent",
    padding: 25,
    borderRadius: 24,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F2F2F7",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  adminIconBox: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  adminMenuText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: Colors.foreground,
    textAlign: "center",
  },

  teamCard: {
    backgroundColor: "transparent",
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#F2F2F7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  teamRoleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F2F2F7",
    marginRight: 10,
  },

  // Dashboard & Logic styles
  statCard: {
    width: "47%",
    backgroundColor: "transparent",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F2F2F7",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.foreground,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 1.5,
  },

  productAdminCard: {
    flexDirection: "row",
    backgroundColor: "transparent",
    padding: 18,
    borderRadius: 22,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#F2F2F7",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
    marginBottom: 8,
    marginLeft: 5,
    marginTop: 15,
  },
  orderCard: {
    backgroundColor: "transparent",
    padding: 20,
    borderRadius: 24,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#F2F2F7",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  statusTag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  teamRoleText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    color: Colors.foreground,
  },
  roleOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 5,
    borderWidth: 1,
    borderColor: "#eee",
  },
  roleOptionActive: {
    backgroundColor: Colors.foreground,
    borderColor: Colors.foreground,
  },
  roleOptionText: { fontSize: 10, fontWeight: "700", color: Colors.textMuted },
  roleOptionTextActive: { color: "white" },

  mainContainer: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  fullScreen: { width: width, height: height },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Tab Bar Modern & Compact
  tabBarWrapper: {
    position: "absolute",
    bottom: 25,
    left: 24,
    right: 24,
    alignItems: "center",
  },
  glassTabBar: {
    width: "100%",
    height: 64,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 22,
    flexDirection: "row",
    overflow: "hidden",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#F2F2F7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 1000,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabLabel: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#AEAEB2",
    marginTop: 4,
    textTransform: "uppercase",
  },
  activeTabLabel: { color: Colors.foreground },
  tabAvatarContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabAvatar: { width: 26, height: 26, borderRadius: 13 },

  // Onboarding Glass
  onboardOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  onboardGlass: {
    padding: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    width: "100%",
  },
  glassBrand: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 6,
    marginBottom: 10,
    textAlign: "center",
  },
  glassTagline: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 40,
    textAlign: "center",
  },
  glassBtn: {
    backgroundColor: "white",
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 100,
  },
  glassBtnText: {
    color: "black",
    fontWeight: "900",
    fontSize: 9,
    letterSpacing: 2,
  },

  // Auth Modern (Compact)
  authContainer: { flex: 1 },
  authTopDecoration: { height: height * 0.18 },
  authContent: {
    flex: 1,
    marginTop: -32,
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  authBrand: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 8,
    textAlign: "center",
  },
  authTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 32,
    textAlign: "center",
  },
  formCard: { gap: 12 },
  modernInput: {
    height: 52,
    backgroundColor: "transparent",
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#C7C7CC",
  },
  adminInput: {
    height: 50,
    backgroundColor: "transparent",
    borderRadius: 15,
    paddingHorizontal: 15,
    fontSize: 13,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#C7C7CC",
  },
  modernPrimaryBtn: {
    backgroundColor: Colors.foreground,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  modernPrimaryBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 9.5,
    letterSpacing: 1.5,
  },
  switchAuthText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
  },

  // Header (Compact)
  // Header Modern
  modernHeader: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  logo: { width: 28, height: 28, borderRadius: 8, marginRight: 10 },
  logoLarge: { width: 80, height: 80, borderRadius: 20, marginBottom: 20 },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.foreground,
    marginRight: 12,
  },
  modernLogo: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
    position: "absolute",
    left: 70,
    right: 70,
    textAlign: "center",
    zIndex: 1,
    height: 60,
    lineHeight: 60,
  },
  searchCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  headerAvatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 10,
  },
  headerAvatar: { width: 42, height: 42, borderRadius: 21 },

  // Hero
  modernHero: { height: 500, overflow: "hidden", backgroundColor: "#F2F2F7" },
  modernHeroImg: { width: "100%", height: "100%", opacity: 1 },
  heroGlassBadge: {
    position: "absolute",
    top: 25,
    left: 25,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  modernHeroFooter: { position: "absolute", bottom: 40, left: 25, right: 25 },
  modernHeroTitle: {
    color: "white",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 42,
    marginBottom: 25,
  },
  modernHeroBtn: {
    backgroundColor: "white",
    height: 55,
    paddingHorizontal: 35,
    borderRadius: 30,
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  modernHeroBtnText: {
    color: "black",
    fontWeight: "900",
    fontSize: 9.5,
    letterSpacing: 1,
  },

  // Sections (Compact)
  modernSection: { marginTop: 32 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeaderNoPad: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modernSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  modernSectionLink: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  exploreBtn: { paddingVertical: 5 },
  modernCatCard: {
    width: 72,
    height: 72,
    backgroundColor: "transparent",
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "#F2F2F7",
    overflow: "hidden",
  },
  catBgImage: { width: "100%", height: "100%" },
  catOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  modernCatText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    color: "white",
  },
  modernCatDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "white",
    marginTop: 8,
  },

  carouselContainer: { height: 500, marginBottom: 10 },
  adCard: {
    width: width * 0.75,
    height: 220,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#F2F2F7",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  adMedia: { width: "100%", height: "100%", position: "absolute" },
  adContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  adTitle: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  adBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "white",
  },
  adBtnText: {
    color: "white",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  // Grid & Product Cards (Refined)
  modernGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  modernProductCard: {
    width: (width - 44) / 2,
    marginBottom: 20,
    position: "relative",
  },
  modernProductImg: {
    width: "100%",
    aspectRatio: 1.1,
    backgroundColor: "#F9F9FB",
    overflow: "hidden",
  },
  modernProductInfo: { padding: 12 },
  modernProductHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modernProductName: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  modernProductPrice: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  productDescription: { fontSize: 10, marginTop: 3, fontWeight: "500" },
  modernQuickAdd: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 50,
  },
  modernWishlistBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 50,
  },

  // Profile Premium (Consolidated)
  profileGlassCard: {
    backgroundColor: "white",
    borderRadius: 35,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  profileSub: { fontSize: 13, color: Colors.textMuted, marginTop: 5 },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  profileRowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  profileRowText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginLeft: 15,
  },

  // Detail Modern
  detailFullImage: { width: width, height: height * 0.52 },
  detailFullVideo: { width: width, height: height * 0.52 },
  glassBackBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 100,
  },
  detailBottomContent: {
    flex: 1,
    marginTop: -35,
    backgroundColor: "white",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 15,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E5EA",
    alignSelf: "center",
    marginBottom: 20,
  },
  detailBrandName: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  detailTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  detailProductName: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    flex: 1,
  },
  detailProductPrice: { fontSize: 19, fontWeight: "700", marginTop: 4 },
  detailGlassDivider: {
    height: 1.2,
    backgroundColor: "transparent",
    marginVertical: 20,
  },
  modernDetailLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  sizeGuideText: { fontSize: 11, fontWeight: "600" },
  modernSizeGrid: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
    flexWrap: "wrap",
  },
  modernSizeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 48,
  },
  activeSizeBtn: {},
  modernSizeText: { fontWeight: "700", fontSize: 12 },
  activeSizeText: { color: "white" },
  mainActionBtn: {
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  mainActionBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  detailDescriptionText: { fontSize: 13, lineHeight: 19, fontWeight: "400" },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1 },
  activeColorDot: { borderWidth: 2, padding: 2 },

  // Cart Specific
  cartItem: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  cartItemImg: {
    width: 80,
    height: 100,
    borderRadius: 15,
    backgroundColor: "#F2F2F7",
  },
  cartItemInfo: { flex: 1, marginLeft: 20 },
  cartItemName: { fontSize: 14, fontWeight: "900", letterSpacing: -0.5 },
  cartItemMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  },
  cartItemPrice: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  cartSummary: {
    padding: 30,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  summaryValue: { fontSize: 13, fontWeight: "600" },
  cartBadge: {
    position: "absolute",
    top: -8,
    right: -10,
    backgroundColor: Colors.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: "white", fontSize: 10, fontWeight: "900" },

  // Modern Cart Styles
  modernCartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  modernCartImg: {
    width: 85,
    height: 110,
    borderRadius: 18,
    backgroundColor: "#F2F2F7",
  },
  modernCartName: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  modernCartMeta: { fontSize: 11, color: Colors.textMuted, marginBottom: 6 },
  modernCartPrice: { fontSize: 15, fontWeight: "800" },
  modernDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  modernCartSummary: {
    padding: 25,
    marginTop: 10,
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 15,
  },
  modernCartInput: {
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 13,
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "#F0F0F3",
  },

  // Shop specific
  shopHeader: { paddingHorizontal: 25, paddingVertical: 20 },
  searchBar: {
    height: 55,
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    paddingHorizontal: 20,
    marginTop: 15,
    fontSize: 14,
    fontWeight: "600",
  },
  miniInput: {
    backgroundColor: "white",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#F2F2F7",
    minHeight: 50,
  },

  // New Styles
  imagePagination: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  activePaginationDot: { width: 14, backgroundColor: "white" },
  backBtnSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  // orderCard removed (duplicate)
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  orderId: { fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },
  orderDate: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  // statusTag removed (duplicate)
  // statusText removed (duplicate)
  orderItemsPreview: { flexDirection: "row", gap: 10, marginBottom: 20 },
  orderItemThumb: {
    width: 50,
    height: 65,
    borderRadius: 10,
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  // Product Details Styles for Orders
  productDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginVertical: 8,
  },
  productDetailImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  productDetailInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productDetailName: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 2,
  },
  productDetailMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  variantText: {
    fontSize: 11,
    fontWeight: "600",
  },
  variantDot: {
    fontSize: 11,
  },
  colorSwatchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  colorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7, // Circular
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
  sizeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sizeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  colorText: {
    fontSize: 10,
    fontWeight: "600",
  },
  moreItemsBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  moreItemsText: {
    fontSize: 11,
    fontWeight: "800",
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
    paddingTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trackOrderBtn: {
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  trackOrderBtnText: {
    fontSize: 13,
    fontWeight: "800",
  },
  orderTotalLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  orderTotalValue: { fontSize: 14, fontWeight: "900" },

  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
  },
  activeCatChip: { backgroundColor: "transparent" },
  catChipText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  activeCatChipText: { color: "white" },

  settingsSection: {
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  settingsLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 15,
    marginLeft: 5,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  settingsRowText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  deleteAccountBtn: {
    marginTop: 40,
    padding: 20,
    backgroundColor: "#FFF0F0",
    borderRadius: 20,
    alignItems: "center",
  },
  deleteAccountText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // Profile Premium
  profileHero: { padding: 30, paddingTop: 60 },
  profileAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    overflow: "hidden",
    position: "relative",
  },
  fullAvatar: { width: "100%", height: "100%" },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.foreground,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "white",
    zIndex: 50,
    elevation: 5,
  },
  avatarText: { fontSize: 32, fontWeight: "700", color: Colors.foreground },
  profileNameBig: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.foreground,
    marginTop: 15,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  homeLiveCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  homeLiveImage: {
    width: "100%",
    height: "100%",
    borderRadius: 33,
  },
  homeLiveBadge: {
    position: "absolute",
    bottom: -4,
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FFF",
  },
  homeLiveBadgeText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "900",
  },
  editProfileBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 100,
    backgroundColor: Colors.foreground,
  },
  editProfileBtnText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  menuContainer: { padding: 30 },
  menuSectionLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  menuRowLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    color: "#F2F2F7",
  },
  menuRowText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: Colors.foreground,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  socialCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEE",
  },

  // Settings Premium
  settingsSectionPremium: {
    borderRadius: 30,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: "transparent",
  },
  premiumInputGroup: { marginBottom: 20 },
  inputLabelField: {
    fontSize: 9,
    fontWeight: "900",
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 5,
  },
  premiumInput: {
    borderRadius: 15,
    padding: 15,
    fontSize: 13,
    fontWeight: "600",
  },
  saveBtnPremium: {
    marginTop: 10,
    height: 55,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnPremiumText: { fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  settingsRowSwitch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  switchTitle: { fontSize: 12, fontWeight: "700", color: Colors.foreground },
  switchSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  customSwitch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#8E8E93",
    padding: 3,
    justifyContent: "center",
  },
  customSwitchActive: { backgroundColor: "#34C759" },
  switchDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  switchDotActive: { alignSelf: "flex-end" },
  settingsRowMinimal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  settingsRowTextMinimal: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.foreground,
  },
  deactivateBtn: {
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
    backgroundColor: "#FFF0F0",
    borderRadius: 20,
  },
  deactivateBtnText: {
    color: Colors.error,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  campaignContent: {
    padding: 30,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    minHeight: 400,
  },
  campaignTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.foreground,
    marginBottom: 15,
    letterSpacing: 1,
  },
  campaignDivider: {
    width: 40,
    height: 4,
    backgroundColor: Colors.accent,
    marginBottom: 20,
    borderRadius: 2,
  },
  campaignDesc: {
    fontSize: 15,
    color: Colors.textMuted,
    lineHeight: 24,
    marginBottom: 40,
    fontWeight: "500",
  },
  campaignMainBtn: {
    backgroundColor: Colors.foreground,
    height: 60,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.foreground,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  campaignBtnText: {
    color: "white",
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 13,
  },
  timerBox: {
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    color: "#333",
    fontSize: 12,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  timerPill: {
    flexDirection: "row",
    backgroundColor: "#FFD700",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    gap: 2,
  },
  flashSectionContainer: { marginTop: 30 },
  flashHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  flashTitleText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.foreground,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  flashProductCard: { width: (width - 55) / 2, marginBottom: 25 },
  flashImgContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: "#F9F9FB",
    overflow: "hidden",
  },
  flashProductImg: { width: "100%", height: "100%" },
  flashHeartBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    zIndex: 50,
  },
  flashPriceText: { fontSize: 13, fontWeight: "900", color: "#5856D6" },
  flashPriceWhite: { fontSize: 13, fontWeight: "900", color: "white" },
  flashStarText: { fontSize: 10, fontWeight: "800", color: Colors.textMuted },
  flashStarWhite: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
  },
  flashNameText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.foreground,
    marginTop: 2,
  },
  flashNameWhite: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
    marginTop: 2,
  },
  flashInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    padding: 12,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  promoBannerContainer: {
    margin: 20,
    height: 140,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "#FF2D55",
  },
  promoBannerImg: { width: "100%", height: "100%" },
  promoBannerContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  promoSmallText: {
    fontSize: 10,
    fontWeight: "900",
    color: "white",
    letterSpacing: 1,
    textAlign: "center",
  },
  promoMainText: {
    fontSize: 24,
    fontWeight: "900",
    color: "white",
    marginTop: -2,
    textAlign: "center",
  },
  promoShopNowBtn: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: "center",
  },
  promoBtnText: { fontSize: 10, fontWeight: "900", color: "#FF2D55" },
  authToggleText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 0.5,
  },
});
// --- ADMIN FLASH SALE ---
// function AdminFlashSaleScreen({ onBack, t, profileData }: any) {
//   const { colors: appColors, theme } = useAppTheme();
//   const isBrandOwner = profileData?.role === 'brand_owner';
//   const myBrandId = profileData?.brandId;

//   const [active, setActive] = useState(false);
//   const [title, setTitle] = useState('');
//   const [endTime, setEndTime] = useState('');
//   const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
//   const [products, setProducts] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const init = async () => {
//       setLoading(true);
//       await Promise.all([fetchFlashSale(), fetchProducts()]);
//       setLoading(false);
//     };
//     init();
//   }, []);

//   // Use a brand-specific flash sale doc for brand owners, shared admin doc for admin
//   const flashSaleDocId = isBrandOwner && myBrandId ? `flashSale_${myBrandId}` : 'flashSale';

//   const fetchFlashSale = async () => {
//     const snap = await getDoc(doc(db, 'settings', flashSaleDocId));
//     if (snap.exists()) {
//       const data = snap.data();
//       setActive(data.active || false);
//       setTitle(data.title || '');
//       setEndTime(data.endTime || '');
//       setSelectedProductIds(data.productIds || []);
//     }
//   };

//   const fetchProducts = async () => {
//     try {
//       const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(100));
//       const snap = await getDocs(q);
//       const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
//       // Brand owners only see their own products in the flash sale selector
//       setProducts(isBrandOwner && myBrandId ? all.filter((p: any) => p.brandId === myBrandId) : all);
//     } catch (err) {
//       console.error("Error fetching products for flash sale:", err);
//     }
//   };

//   const handleSave = async () => {
//     if (!title || !endTime) {
//       Alert.alert(t('error'), t('fillAllFields') || t('requiredFields'));
//       return;
//     }
//     const testDate = new Date(endTime);
//     if (isNaN(testDate.getTime())) {
//       Alert.alert(t('error'), t('invalidDateFormat') || 'Invalid date format');
//       return;
//     }
//     setLoading(true);
//     try {
//       const saveData: any = {
//         active,
//         title,
//         endTime,
//         productIds: selectedProductIds,
//         updatedAt: serverTimestamp()
//       };
//       // Brand owners have their own flash sale config
//       if (isBrandOwner && myBrandId) saveData.brandId = myBrandId;
//       await setDoc(doc(db, 'settings', flashSaleDocId), saveData);
//       Alert.alert(t('successTitle'), t('flashSaleUpdated'));
//     } catch (e: any) {
//       console.error("Error saving flash sale:", e);
//       Alert.alert(t('error'), e.message || t('failedToSave'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
//       <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
//         <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
//           <ChevronLeft size={20} color={appColors.foreground} />
//         </TouchableOpacity>
//         <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground }]}>{t('flashSale').toUpperCase()}</Text>
//         <TouchableOpacity onPress={handleSave} disabled={loading} style={[styles.backBtnSmall, { width: undefined, paddingHorizontal: 12, backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
//           {loading ? <ActivityIndicator size="small" color={appColors.foreground} /> : <Text style={{ fontWeight: '900', color: appColors.foreground, fontSize: 10 }}>{t('save').toUpperCase()}</Text>}
//         </TouchableOpacity>
//       </View>

//       <ScrollView contentContainerStyle={{ padding: 25 }}>
//         <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, backgroundColor: theme === 'dark' ? '#171720' : 'white', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: appColors.border }}>
//           <View>
//             <Text style={{ fontWeight: '800', fontSize: 16, color: appColors.foreground }}>{t('activeStatusLabel')}</Text>
//             <Text style={{ color: appColors.textMuted, fontSize: 12 }}>{t('showFlashSale')}</Text>
//           </View>
//           <TouchableOpacity
//             onPress={() => setActive(!active)}
//             style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: active ? appColors.foreground : (theme === 'dark' ? '#17171F' : '#eee'), padding: 3, alignItems: active ? 'flex-end' : 'flex-start' }}
//           >
//             <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme === 'dark' ? (active ? '#000' : '#555') : 'white' }} />
//           </TouchableOpacity>
//         </View>

//         <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('campaignTitle').toUpperCase()}</Text>
//         <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]} value={title} onChangeText={setTitle} placeholder={t('flashSaleTitlePlaceholder')} placeholderTextColor="#666" />

//         <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('endTimeIso')}</Text>
//         <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]} value={endTime} onChangeText={setEndTime} placeholder="YYYY-MM-DDTHH:MM:SS" placeholderTextColor="#666" />
//         <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15, marginTop: 15 }}>
//           {[6, 12, 24, 48].map(h => (
//             <TouchableOpacity
//               key={h}
//               onPress={() => {
//                 const d = new Date();
//                 d.setHours(d.getHours() + h);
//                 setEndTime(d.toISOString());
//               }}
//               style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme === 'dark' ? '#17171F' : '#f0f0f0', borderRadius: 10, borderWidth: 1, borderColor: appColors.border }}
//             >
//               <Text style={{ fontSize: 10, fontWeight: '900', color: appColors.foreground }}>+{h}H</Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//         <Text style={{ fontSize: 10, color: appColors.textMuted, marginBottom: 25 }}>{t('selectPresetOrIso')}</Text>

//         <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('selectProductsLabel')} ({selectedProductIds.length})</Text>
//         <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
//           {products.map(p => {
//             const isSelected = selectedProductIds.includes(p.id);
//             return (
//               <TouchableOpacity
//                 key={p.id}
//                 onPress={() => setSelectedProductIds(isSelected ? selectedProductIds.filter(id => id !== p.id) : [...selectedProductIds, p.id])}
//                 style={{ width: (width - 70) / 3, backgroundColor: theme === 'dark' ? '#171720' : 'white', borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: isSelected ? appColors.foreground : appColors.border }}
//               >
//                 <Image source={{ uri: p.mainImage }} style={{ width: '100%', height: 80 }} />
//                 <View style={{ padding: 8 }}>
//                   <Text style={{ fontSize: 8, fontWeight: '700', color: appColors.foreground }} numberOfLines={1}>{getName(p.name)}</Text>
//                 </View>
//                 {isSelected && <View style={{ position: 'absolute', top: 5, right: 5, backgroundColor: appColors.foreground, borderRadius: 10, padding: 2 }}><CheckCircle2 size={12} color={theme === 'dark' ? '#000' : 'white'} /></View>}
//               </TouchableOpacity>
//             );
//           })}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// --- ADMIN PROMO BANNERS ---
// function AdminPromoBannersScreen({ onBack, t, profileData }: any) {
//   const { colors: appColors, theme } = useAppTheme();
//   const isBrandOwner = profileData?.role === 'brand_owner';
//   const myBrandId = profileData?.brandId;

//   const PRESET_COLORS = ['#FF2D55', '#007AFF', '#34C759', '#5856D6', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA', '#000000', '#8E8E93'];
//   const [banners, setBanners] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [form, setForm] = useState({
//     title: '',
//     description: '',
//     imageUrl: '',
//     backgroundColor: '#FF2D55',
//     order: '0',
//     isActive: true
//   });
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     fetchBanners();
//   }, []);

//   const fetchBanners = async () => {
//     setLoading(true);
//     try {
//       const q = query(collection(db, 'promoBanners'), orderBy('order', 'asc'));
//       const snap = await getDocs(q);
//       const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
//       // Brand owners only see their own brand's promo banners
//       setBanners(isBrandOwner && myBrandId ? all.filter((b: any) => b.brandId === myBrandId) : all);
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEdit = (banner: any) => {
//     setEditingId(banner.id);
//     setForm({
//       title: banner.title || '',
//       description: banner.description || '',
//       imageUrl: banner.imageUrl || '',
//       backgroundColor: banner.backgroundColor || '#FF2D55',
//       order: String(banner.order || 0),
//       isActive: banner.isActive ?? true
//     });
//     setIsModalOpen(true);
//   };

//   const handleAddNew = () => {
//     setEditingId(null);
//     setForm({
//       title: '',
//       description: '',
//       imageUrl: '',
//       backgroundColor: '#FF2D55',
//       order: String(banners.length),
//       isActive: true
//     });
//     setIsModalOpen(true);
//   };

//   const pickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [16, 9],
//       quality: 0.7,
//     });

//     if (!result.canceled) {
//       // In a real app we'd upload to storage, for now let's simulate or use the URI
//       // Let's assume the user can provide a URL or we'd handle upload.
//       // For this demo, we'll set the URI directly (note: this only works locally)
//       setForm({ ...form, imageUrl: result.assets[0].uri });
//     }
//   };

//   const handleSave = async () => {
//     if (!form.imageUrl) {
//       Alert.alert('Error', 'Image is required');
//       return;
//     }
//     setSaving(true);
//     try {
//       const data: any = {
//         ...form,
//         order: parseInt(form.order) || 0,
//         updatedAt: serverTimestamp()
//       };
//       // Tag with brandId so brand owners only manage their own promo banners
//       if (isBrandOwner && myBrandId) data.brandId = myBrandId;
//       if (editingId) {
//         await updateDoc(doc(db, 'promoBanners', editingId), data);
//       } else {
//         await addDoc(collection(db, 'promoBanners'), { ...data, createdAt: serverTimestamp() });
//       }
//       setIsModalOpen(false);
//       fetchBanners();
//     } catch (e) {
//       console.error(e);
//       Alert.alert('Error', 'Failed to save');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const toggleStatus = async (banner: any) => {
//     try {
//       await updateDoc(doc(db, 'promoBanners', banner.id), { isActive: !banner.isActive });
//       fetchBanners();
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const deleteBanner = (id: string) => {
//     Alert.alert('Delete Promotion', 'Are you sure?', [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Delete',
//         style: 'destructive',
//         onPress: async () => {
//           try {
//             await deleteDoc(doc(db, 'promoBanners', id));
//             fetchBanners();
//           } catch (e) {
//             console.error(e);
//           }
//         }
//       }
//     ]);
//   };

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
//       <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
//         <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}><ChevronLeft size={20} color={appColors.foreground} /></TouchableOpacity>
//         <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground }]}>PROMOTIONS</Text>
//         <View style={{ flexDirection: 'row', gap: 15 }}>
//           <TouchableOpacity onPress={handleAddNew} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}><Plus size={22} color={appColors.foreground} /></TouchableOpacity>
//           <TouchableOpacity onPress={fetchBanners} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}><RotateCcw size={20} color={appColors.foreground} /></TouchableOpacity>
//         </View>
//       </View>

//       {loading ? (
//         <ActivityIndicator size="large" color={Colors.foreground} style={{ marginTop: 50 }} />
//       ) : (
//         <ScrollView contentContainerStyle={{ padding: 20 }}>
//           {banners.map(banner => (
//             <View key={banner.id} style={[styles.settingsSectionPremium, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border, marginBottom: 20, padding: 15 }]}>
//               <View style={{ flexDirection: 'row', gap: 15 }}>
//                 <View style={{ width: 100, height: 60, borderRadius: 12, backgroundColor: banner.backgroundColor || (theme === 'dark' ? '#17171F' : '#FF2D55'), overflow: 'hidden' }}>
//                   <Image source={{ uri: banner.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
//                 </View>
//                 <View style={{ flex: 1 }}>
//                   <Text style={{ fontWeight: '900', fontSize: 13, color: appColors.foreground }}>{banner.title?.toUpperCase()}</Text>
//                   <Text style={{ fontSize: 11, color: appColors.textMuted, marginTop: 4 }}>{banner.description}</Text>
//                 </View>
//               </View>

//               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, borderTopWidth: 1, borderTopColor: appColors.border, paddingTop: 15 }}>
//                 <TouchableOpacity onPress={() => toggleStatus(banner)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
//                   <View style={[styles.customSwitch, { width: 44, height: 26, borderRadius: 13, padding: 3 }, banner.isActive && styles.customSwitchActive, !banner.isActive && { backgroundColor: theme === 'dark' ? '#17171F' : '#f2f2f7' }]}>
//                     <View style={[styles.switchDot, { width: 20, height: 20, borderRadius: 10 }, banner.isActive && styles.switchDotActive]} />
//                   </View>
//                   <Text style={{ fontSize: 10, fontWeight: '900', color: banner.isActive ? '#34C759' : appColors.textMuted }}>
//                     {banner.isActive ? t('activeStatus') : t('inactiveStatus')}
//                   </Text>
//                 </TouchableOpacity>

//                 <View style={{ flexDirection: 'row', gap: 10 }}>
//                   <TouchableOpacity onPress={() => handleEdit(banner)} style={{ padding: 8, backgroundColor: theme === 'dark' ? '#17171F' : '#f0f0f0', borderRadius: 8, borderWidth: 1, borderColor: appColors.border }}>
//                     <Settings size={18} color={appColors.foreground} />
//                   </TouchableOpacity>
//                   <TouchableOpacity onPress={() => deleteBanner(banner.id)} style={{ padding: 8, backgroundColor: theme === 'dark' ? '#311212' : '#FFF0F0', borderRadius: 8, borderWidth: 1, borderColor: appColors.error }}>
//                     <Trash2 size={18} color={appColors.error} />
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             </View>
//           ))}
//           {banners.length === 0 && (
//             <View style={{ alignItems: 'center', marginTop: 100 }}>
//               <Ticket size={48} color={theme === 'dark' ? '#1A1A24' : '#eee'} />
//               <Text style={{ color: appColors.textMuted, marginTop: 15, fontWeight: '700' }}>{t('noPromoBanners')}</Text>
//             </View>
//           )}

//           <Modal visible={isModalOpen} animationType="slide" presentationStyle="pageSheet">
//             <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0A0A0F' : 'white' }}>
//               <View style={{
//                 height: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, backgroundColor: theme === 'dark' ? '#000' : 'white'
//               }}>
//                 <TouchableOpacity onPress={() => setIsModalOpen(false)} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', zIndex: 10 }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
//                   <X size={18} color={appColors.foreground} />
//                 </TouchableOpacity>
//                 <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.modernLogo, { color: appColors.foreground, fontSize: 11, fontWeight: '900' }]}>{editingId ? t('editPromotion').toUpperCase() : t('newPromotion').toUpperCase()}</Text>
//                 <TouchableOpacity onPress={handleSave} disabled={saving} style={{ paddingHorizontal: 15, height: 40, borderRadius: 20, backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', justifyContent: 'center', alignItems: 'center', zIndex: 10 }} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
//                   {saving ? <ActivityIndicator size="small" color={appColors.foreground} /> : <Text style={{ fontWeight: '900', color: appColors.foreground, fontSize: 10 }}>{t('save').toUpperCase()}</Text>}
//                 </TouchableOpacity>
//               </View>

//               <ScrollView contentContainerStyle={{ padding: 25 }}>
//                 <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('bannerImage')}</Text>
//                 <TouchableOpacity
//                   onPress={pickImage}
//                   style={{ width: '100%', height: 180, borderRadius: 20, backgroundColor: theme === 'dark' ? '#171720' : '#f9f9fb', borderStyle: 'dashed', borderWidth: 2, borderColor: appColors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 25 }}
//                 >
//                   {form.imageUrl ? (
//                     <Image source={{ uri: form.imageUrl }} style={{ width: '100%', height: '100%' }} />
//                   ) : (
//                     <View style={{ alignItems: 'center' }}>
//                       <ImageIcon size={40} color={appColors.textMuted} />
//                       <Text style={{ fontSize: 10, fontWeight: '800', color: appColors.textMuted, marginTop: 10 }}>{t('selectImage169')}</Text>
//                     </View>
//                   )}
//                 </TouchableOpacity>

//                 <View style={styles.premiumInputGroup}>
//                   <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('promotionTitle')}</Text>
//                   <TextInput
//                     style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border }]}
//                     placeholder={t('summerSalePlaceholder')}
//                     placeholderTextColor="#666"
//                     value={form.title}
//                     onChangeText={(t) => setForm({ ...form, title: t })}
//                   />
//                 </View>

//                 <View style={styles.premiumInputGroup}>
//                   <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('descriptionOffer')}</Text>
//                   <TextInput
//                     style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border }]}
//                     placeholder={t('offerPlaceholder')}
//                     placeholderTextColor="#666"
//                     value={form.description}
//                     onChangeText={(t) => setForm({ ...form, description: t })}
//                   />
//                 </View>

//                 <View style={{ flexDirection: 'row', gap: 15 }}>
//                   <View style={[styles.premiumInputGroup, { flex: 1 }]}>
//                     <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('bgColorHex')}</Text>
//                     <TextInput
//                       style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border }]}
//                       placeholder="#FF2D55"
//                       placeholderTextColor="#666"
//                       value={form.backgroundColor}
//                       onChangeText={(t) => setForm({ ...form, backgroundColor: t })}
//                     />
//                   </View>
//                   <View style={[styles.premiumInputGroup, { flex: 0.5 }]}>
//                     <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('order')}</Text>
//                     <TextInput
//                       style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border }]}
//                       keyboardType="numeric"
//                       value={form.order}
//                       onChangeText={(t) => setForm({ ...form, order: t })}
//                     />
//                   </View>
//                 </View>

//                 {/* Color Picker Presets */}
//                 <View style={{ marginBottom: 25 }}>
//                   <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>PRESET THEMES</Text>
//                   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 5 }}>
//                     {PRESET_COLORS.map(color => (
//                       <TouchableOpacity
//                         key={color}
//                         onPress={() => setForm({ ...form, backgroundColor: color })}
//                         style={{
//                           width: 36,
//                           height: 36,
//                           borderRadius: 18,
//                           backgroundColor: color,
//                           borderWidth: 3,
//                           borderColor: form.backgroundColor === color ? '#F2F2F7' : 'transparent',
//                           shadowColor: '#000',
//                           shadowOpacity: 0.1,
//                           shadowRadius: 5,
//                           elevation: 3
//                         }}
//                       />
//                     ))}
//                   </ScrollView>
//                 </View>

//                 <View style={[styles.settingsRowSwitch, { borderBottomWidth: 0 }]}>
//                   <View>
//                     <Text style={styles.switchTitle}>Active Status</Text>
//                     <Text style={styles.switchSub}>Is this promotion currently visible?</Text>
//                   </View>
//                   <TouchableOpacity
//                     onPress={() => setForm({ ...form, isActive: !form.isActive })}
//                     style={[styles.customSwitch, { width: 44, height: 26, borderRadius: 13, padding: 3 }, form.isActive && styles.customSwitchActive]}
//                   >
//                     <View style={[styles.switchDot, { width: 20, height: 20, borderRadius: 10 }, form.isActive && styles.switchDotActive]} />
//                   </TouchableOpacity>
//                 </View>

//                 <TouchableOpacity
//                   onPress={handleSave}
//                   style={[styles.saveBtnPremium, { marginTop: 30 }]}
//                   disabled={saving}
//                 >
//                   <Text style={styles.saveBtnPremiumText}>{saving ? 'SAVING...' : 'REGISTER PROMOTION'}</Text>
//                 </TouchableOpacity>
//               </ScrollView>
//             </View>
//           </Modal>
//         </ScrollView>
//       )}
//     </SafeAreaView>
//   );
// }

function PrivacyPolicyScreen({ onBack, t, language }: any) {
  const { colors, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, "settings", "legal");
        const snap = await getDoc(docRef);

        const defaultPrivacy = `At Bey3a, we prioritize your privacy. This policy outlines how we collect, use, and protect your information.

1. Information Collection
We collect personal data (name, email, shipping address) when you create an account or place an order. We may also collect browsing data to improve your experience.

2. Usage of Information
Your data is used solely for processing orders, improving our services, and sending relevant updates (if opted in). We do not sell your data to third parties.

3. Data Security
We implement industry-standard security measures to protect your personal information. However, no method of transmission is 100% secure.

4. Contact Us
If you have questions about this policy, please contact our support team.`;

        const defaultPrivacyAr = `في Bey3a، نولي أولوية قصوى لخصوصيتك. توضح هذه السياسة كيفية جمعنا لمعلوماتك واستخدامها وحمايتها.

1. جمع المعلومات
نقوم بجمع البيانات الشخصية (الاسم، البريد الإلكتروني، عنوان الشحن) عند إنشاء حساب أو تقديم طلب. قد نجمع أيضًا بيانات التصفح لتحسين تجربتك.

2. استخدام المعلومات
تُستخدم بياناتك فقط لمعالجة الطلبات، وتحسين خدماتنا، وإرسال التحديثات ذات الصلة (إذا وافقت على ذلك). نحن لا نبيع بياناتك لأطراف ثالثة.

3. أمان البيانات
نحن نطبق إجراءات أمنية قياسية في الصناعة لحماية معلوماتك الشخصية. ومع ذلك، لا توجد طريقة نقل آمنة بنسبة 100%.

4. اتصل بنا
إذا كانت لديك أسئلة حول هذه السياسة، يرجى الاتصال بفريق الدعم لدينا.`;

        const defaultPrivacyFr = `Chez Bey3a, nous accordons une priorité absolue à votre vie privée. Cette politique explique comment nous collectons, utilisons et protégeons vos informations.

1. Collecte d'Informations
Nous collectons des données personnelles (nom, email, adresse de livraison) lorsque vous créez un compte ou passez une commande.

2. Utilisation des Informations
Vos données sont utilisées uniquement pour le traitement des commandes, l'amélioration de nos services et l'envoi d'offres pertinentes.

3. Sécurité des Données
Nous appliquons des mesures de sécurité standard pour protéger vos informations personnelles.

4. Contact
Si vous avez des questions, n'hésitez pas à contacter notre équipe support.`;

        if (snap.exists()) {
          const data = snap.data();
          setContent(
            language === "ar"
              ? data.privacyAr || defaultPrivacyAr
              : language === "fr"
                ? data.privacyFr || defaultPrivacyFr
                : data.privacy || defaultPrivacy,
          );
        } else {
          setContent(
            language === "ar"
              ? defaultPrivacyAr
              : language === "fr"
                ? defaultPrivacyFr
                : defaultPrivacy,
          );
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      {/* Animated Blur Header */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 64 + insets.top,
            paddingTop: insets.top,
            borderBottomWidth: headerOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            borderBottomColor:
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          },
        ]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}
        >
          <BlurView
            intensity={80}
            style={StyleSheet.absoluteFill}
            tint={theme}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.background + "66" },
            ]}
          />
        </Animated.View>

        <View
          style={[
            styles.modernHeader,
            { borderBottomWidth: 0, backgroundColor: "transparent" },
          ]}
        >
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtnSmall,
              { backgroundColor: theme === "dark" ? "#000" : "#F2F2F7" },
            ]}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.modernLogo, { color: colors.foreground }]}
          >
            {t("privacyPolicy")}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 25, paddingTop: 64 + insets.top }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {loading ? (
          <ActivityIndicator color={colors.foreground} />
        ) : (
          <Text
            style={{
              fontSize: 13,
              color: colors.textMuted,
              lineHeight: 22,
              marginBottom: 20,
            }}
          >
            {content || t("noPolicyDefined")}
          </Text>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function TermsOfServiceScreen({ onBack, t, language }: any) {
  const { colors, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, "settings", "legal");
        const snap = await getDoc(docRef);

        const defaultTerms = `Welcome to Bey3a. By accessing or using our mobile application, you agree to be bound by these terms.

1. Usage Rights
You are granted a limited license to access and use the app for personal shopping purposes. Misuse or unauthorized access is strictly prohibited.

2. Purchases & Payments
All prices are in TND. We reserve the right to change prices at any time. Orders are subject to acceptance and availability.

3. Intellectual Property
All content (images, text, designs) is owned by Bey3a and protected by copyright laws.

4. Limitation of Liability
Bey3a is not liable for indirect damages arising from your use of the app.

5. Governing Law
These terms are governed by the laws of Tunisia.`;

        const defaultTermsAr = `مرحبًا بكم في Bey3a. من خلال الوصول إلى تطبيق الهاتف المحمول الخاص بنا أو استخدامه، فإنك توافق على الالتزام بهذه الشروط.

1. حقوق الاستخدام
يتم منحك ترخيصًا محدودًا للوصول إلى التطبيق واستخدامه لأغراض التسوق الشخصي. يُمنع إساءة الاستخدام أو الوصول غير المصرح به منعًا باتًا.

2. المشتريات والمدفوعات
جميع الأسعار بالدينار التونسي. نحتفظ بالحق في تغيير الأسعار في أي وقت. تخضع الطلبات للقبول والتوافر.

3. الملكية الفكرية
جميع المحتويات (الصور، النصوص، التصميمات) مملوكة لـ Bey3a ومحمية بموجب قوانين حقوق النشر.

4. تحديد المسؤولية
Bey3a ليست مسؤولة عن الأضرار غير المباشرة الناشئة عن استخدامك للتطبيق.

5. القانون الحاكم
تخضع هذه الشروط لقوانين تونس.`;

        const defaultTermsFr = `Bienvenue chez Bey3a. En accédant à notre application, vous acceptez d'être lié par ces conditions.

1. Droits d'Utilisation
Vous bénéficiez d'une licence limitée pour utiliser l'application à des fins de shopping personnel.

2. Achats et Paiements
Tous les prix sont en TND. Nous nous réservons le droit de modifier les prix à tout moment.

3. Propriété Intellectuelle
Tout le contenu (images, texte, designs) appartient à Bey3a.

4. Limitation de Responsabilité
Bey3a n'est pas responsable des dommages indirects résultant de l'utilisation de l'application.

5. Droit Applicable
Ces conditions sont régies par les lois de la Tunisie.`;

        if (snap.exists()) {
          const data = snap.data();
          setContent(
            language === "ar"
              ? data.termsAr || defaultTermsAr
              : language === "fr"
                ? data.termsFr || defaultTermsFr
                : data.terms || defaultTerms,
          );
        } else {
          setContent(
            language === "ar"
              ? defaultTermsAr
              : language === "fr"
                ? defaultTermsFr
                : defaultTerms,
          );
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      {/* Animated Blur Header */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 64 + insets.top,
            paddingTop: insets.top,
            borderBottomWidth: headerOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            borderBottomColor:
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          },
        ]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}
        >
          <BlurView
            intensity={80}
            style={StyleSheet.absoluteFill}
            tint={theme}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.background + "66" },
            ]}
          />
        </Animated.View>

        <View
          style={[
            styles.modernHeader,
            { borderBottomWidth: 0, backgroundColor: "transparent" },
          ]}
        >
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtnSmall,
              { backgroundColor: theme === "dark" ? "#000" : "#F2F2F7" },
            ]}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.modernLogo, { color: colors.foreground }]}
          >
            {t("termsOfService")}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 25, paddingTop: 64 + insets.top }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {loading ? (
          <ActivityIndicator color={colors.foreground} />
        ) : (
          <Text
            style={{
              fontSize: 13,
              color: colors.textMuted,
              lineHeight: 22,
              marginBottom: 20,
            }}
          >
            {content || t("noPolicyDefined")}
          </Text>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function GenericPolicyScreen({
  onBack,
  t,
  titleKey,
  fieldKey,
  defaultText,
  Icon,
}: any) {
  const { colors, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, "settings", "legal");
        const snap = await getDoc(docRef);

        if (snap.exists()) setContent(snap.data()[fieldKey] || defaultText);
        else setContent(defaultText);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      {/* Animated Blur Header */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 64 + insets.top,
            paddingTop: insets.top,
            borderBottomWidth: headerOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            borderBottomColor:
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          },
        ]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}
        >
          <BlurView
            intensity={80}
            style={StyleSheet.absoluteFill}
            tint={theme}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.background + "66" },
            ]}
          />
        </Animated.View>

        <View
          style={[
            styles.modernHeader,
            { borderBottomWidth: 0, backgroundColor: "transparent" },
          ]}
        >
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtnSmall,
              { backgroundColor: theme === "dark" ? "#000" : "#F2F2F7" },
            ]}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.modernLogo, { color: colors.foreground }]}
          >
            {t(titleKey)}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{
          padding: 30,
          alignItems: "center",
          paddingTop: 64 + insets.top,
        }}
      >
        {/* Icon Header */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme === "dark" ? "#121218" : "#F9F9FB",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 30,
            borderColor: colors.border,
            borderWidth: 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          {Icon && (
            <Icon size={32} color={colors.foreground} strokeWidth={1.5} />
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.foreground} />
        ) : (
          <View style={{ width: "100%" }}>
            <Text
              style={{
                fontSize: 15,
                color: colors.foreground,
                lineHeight: 26,
                textAlign: "left",
                fontWeight: "400",
              }}
            >
              {content || "No content defined yet."}
            </Text>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
