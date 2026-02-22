import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text as RNText, View, ScrollView, TouchableOpacity, Image, StatusBar, TextInput, ImageBackground, ActivityIndicator, Platform, FlatList, Linking, Alert, Modal, Animated, I18nManager, Switch, KeyboardAvoidingView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import { BlurView } from 'expo-blur';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { Video, ResizeMode } from 'expo-av';
import ProductCard from './src/components/ProductCard';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { db, storage, auth } from './src/api/firebase';
import ShipmentCreationScreen from './src/screens/ShipmentCreationScreen';
import ShipmentTrackingScreen from './src/screens/ShipmentTrackingScreen';
import ProofOfDeliveryScreen from './src/screens/ProofOfDeliveryScreen';
import DriverDashboardScreen from './src/screens/DriverDashboardScreen';
import { Shipment, generateShippingStickerHTML } from './src/utils/shipping';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
  deleteField
} from 'firebase/firestore';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Theme } from './src/theme';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Home,
  ShoppingBag,
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
} from 'lucide-react-native';
import UserBadge from './src/components/UserBadge';
import QRScanner from './src/components/QRScanner';
import { Share } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import ChatScreen from './ChatScreen';
import Constants from 'expo-constants';
import CollaborationScreen from './src/screens/CollaborationScreen';
import AdminCollaborationScreen from './src/screens/AdminCollaborationScreen';
import CollaborationDetailScreen from './src/screens/CollaborationDetailScreen';
import LiveStreamScreen from './src/screens/LiveStreamScreen';
import HostLiveScreen from './src/screens/HostLiveScreen';
import AudienceLiveScreen from './src/screens/AudienceLiveScreen';
import LiveAnalyticsScreen from './src/screens/LiveAnalyticsScreen';
import KYCScreen from './src/screens/KYCScreen';
import AdminKYCScreen from './src/screens/AdminKYCScreen';
import { LiveSessionService, LiveSession } from './src/services/LiveSessionService';
import WalletScreen from './src/screens/WalletScreen';
import FeedScreen from './src/screens/FeedScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import CameraScreen from './src/screens/Camera';
import FidelityScreen from './src/screens/FidelityScreen';

// New extracted imports
import { ThemeContext, ThemeProvider, useAppTheme, getAppColors } from './src/context/ThemeContext';
import { APP_ICON, width, height } from './src/constants/layout';
import { uploadImageToCloudinary } from './src/utils/cloudinary';
import { registerForPushNotificationsAsync, sendPushNotification } from './src/utils/notifications';
import { getName as getNameUtil, translateColor as translateColorUtil, translateCategory as translateCategoryUtil } from './src/utils/translationHelpers';
import { updateProductRating } from './src/utils/productUtils';
import Translations from './src/translations';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import DirectMessageScreen from './src/screens/DirectMessageScreen';

const isExpoGo = Constants.appOwnership === 'expo';
if (!(isExpoGo && Platform.OS === 'android')) {
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
let currentLang = 'fr';
const API_BASE_URL = 'http://192.168.8.189:3000';

// Global Cloudinary Config (legacy)
const CLOUDINARY_CLOUD_NAME = 'ddjzpo6p2';
const CLOUDINARY_UPLOAD_PRESET = 'tama_clothing';

// Legacy Colors support
let Colors = getAppColors('light');

const getName = (field: any, fallback = '') => getNameUtil(field, currentLang, fallback);
const translateColor = (color: string) => translateColorUtil(color, currentLang);
const translateCategory = (cat: string) => translateCategoryUtil(cat, currentLang);

import { useFonts, Rubik_300Light, Rubik_400Regular, Rubik_500Medium, Rubik_600SemiBold, Rubik_700Bold, Rubik_800ExtraBold, Rubik_900Black } from '@expo-google-fonts/rubik';

export const AppText: any = React.forwardRef<any, any>((props, ref) => {
  let fontFamily = 'Rubik_400Regular';
  if (props.style) {
    const flattened = StyleSheet.flatten(props.style);
    if (flattened.fontWeight === '300') {
      fontFamily = 'Rubik_300Light';
    } else if (flattened.fontWeight === '500') {
      fontFamily = 'Rubik_500Medium';
    } else if (flattened.fontWeight === '600') {
      fontFamily = 'Rubik_600SemiBold';
    } else if (flattened.fontWeight === 'bold' || flattened.fontWeight === '700') {
      fontFamily = 'Rubik_700Bold';
    } else if (flattened.fontWeight === '800') {
      fontFamily = 'Rubik_800ExtraBold';
    } else if (flattened.fontWeight === '900') {
      fontFamily = 'Rubik_900Black';
    }
  }
  return (
    <RNText
      ref={ref}
      {...props}
      style={[
        { fontFamily },
        props.style
      ]}
    />
  );
});

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
    Rubik_900Black
  });
  const [language, setLanguage] = useState<'en' | 'fr' | 'ar'>('fr'); // 'en', 'fr' or 'ar'
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [appState, setAppState] = useState<'Onboarding' | 'Auth' | 'Main' | 'SizeGuide'>('Onboarding');
  const [activeTab, setActiveTab] = useState('Home');
  const [previousTab, setPreviousTab] = useState('Home');
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
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const [selectedAdminChat, setSelectedAdminChat] = useState<{ chatId: string, customerName: string } | null>(null);
  const [selectedCollab, setSelectedCollab] = useState<any>(null);
  const [activeLiveChannel, setActiveLiveChannel] = useState<string>('tama-clothing');
  const [isLiveHost, setIsLiveHost] = useState(false);
  const [isLiveReplay, setIsLiveReplay] = useState(false);
  const [replayUrl, setReplayUrl] = useState('');
  const [targetUserProfile, setTargetUserProfile] = useState<any>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [ads, setAds] = useState<any[]>([]);
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(null);
  const [activeTrackingId, setActiveTrackingId] = useState<string>('');

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

  const tr = (fr: string, ar: string, en: string) => language === 'ar' ? ar : (language === 'fr' ? fr : en);

  const isOwnProfile = user?.uid === profileData?.uid || user?.uid === profileData?.id || (profileData?.email && user?.email === profileData?.email);

  const processScanReward = async (scannerUid: string, targetId: string, type: 'user' | 'collab') => {
    if (scannerUid === targetId) return; // Prevent self-farming

    try {
      const scanRef = doc(db, 'scans', `${scannerUid}_${targetId}`);
      const scanSnap = await getDoc(scanRef);

      if (!scanSnap.exists()) {
        await setDoc(scanRef, {
          scannerUid,
          targetId,
          type,
          timestamp: serverTimestamp()
        });

        let scannerReward = 10;
        let targetReward = 50;
        let targetDocRef = null;

        if (type === 'user') {
          targetDocRef = doc(db, 'users', targetId);
        } else if (type === 'collab') {
          const collabSnap = await getDoc(doc(db, 'collaborations', targetId));
          if (collabSnap.exists() && collabSnap.data().brandId) {
            targetDocRef = doc(db, 'users', collabSnap.data().brandId);
            scannerReward = 20;
            targetReward = 20;
          }
        }

        // Award scanning user
        const scannerRef = doc(db, 'users', scannerUid);
        await updateDoc(scannerRef, {
          'wallet.coins': increment(scannerReward)
        });

        // Award target affiliate user/brand
        if (targetDocRef) {
          try {
            await updateDoc(targetDocRef, {
              'wallet.coins': increment(targetReward)
            });
          } catch (e) {
            console.log('Target affiliate wallet update error', e);
          }
        }

        const successMsg = language === 'ar'
          ? `مبروك! ربحت ${scannerReward} كوينز مالسكان!`
          : language === 'fr'
            ? `Félicitations! Vous avez gagné ${scannerReward} pièces grâce au scan!`
            : `Congratulations! You earned ${scannerReward} coins from scanning!`;

        Alert.alert(tr('Récompense de Fidélité', 'مكافأة وفاء', 'Fidelity Reward'), successMsg);
      }
    } catch (e) {
      console.error('Error processing scan reward', e);
    }
  };

  const handleScan = async (data: string) => {
    setShowScanner(false);

    if (data.startsWith('tama-clothing://user/')) {
      const userId = data.replace('tama-clothing://user/', '');
      if (user) await processScanReward(user.uid, userId, 'user');
      setTargetUid(userId);
      setPreviousTab(activeTab);
      setActiveTab('PublicProfile');
    } else if (data.startsWith('tama-clothing://collab/')) {
      const collabId = data.replace('tama-clothing://collab/', '');
      if (user) await processScanReward(user.uid, collabId, 'collab');
      try {
        const collabSnap = await getDoc(doc(db, 'collaborations', collabId));
        if (collabSnap.exists()) {
          setSelectedCollab({ id: collabId, ...collabSnap.data() });
          setActiveTab('CollabDetail');
        } else {
          Alert.alert(t('error'), 'Collaboration not found');
        }
      } catch (e) {
        console.error('Scan Error', e);
        Alert.alert(t('error'), 'Failed to fetch collaboration');
      }
    } else if (data.startsWith('TAMA-') || (activeShipment && data === activeShipment.trackingId)) {
      // It's a shipment tracking ID
      const trackingId = data;

      if (profileData?.role === 'driver') {
        try {
          const shipmentsRef = collection(db, 'Shipments');
          const q = query(shipmentsRef, where('trackingId', '==', trackingId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const shipmentDoc = snap.docs[0];
            const foundShipment = { id: shipmentDoc.id, ...shipmentDoc.data() } as any;

            Alert.alert(
              "Shipment Found",
              `Ready to deliver shipment ${trackingId}?`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Proof of Delivery",
                  onPress: () => {
                    setActiveShipment(foundShipment);
                    setActiveTab('ProofOfDelivery');
                  }
                }
              ]
            );
          } else {
            Alert.alert(t('error') || 'Error', "Shipment not found in database.");
          }
        } catch (err) {
          console.log(err);
          Alert.alert(t('error') || 'Error', "Could not fetch shipment details.");
        }
      } else {
        setActiveTrackingId(trackingId);
        setActiveTab('ShipmentTracking');
      }
    } else {
      Alert.alert(t('error'), 'Invalid QR Code');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  useEffect(() => {
    if (selectedWork) {
      const ownerUid = selectedWork.userId || targetUid;
      if (!ownerUid) return;

      // Real-time listener for comments
      setLoadingComments(true);
      const commentsRef = selectedWork.fullPath
        ? collection(db, selectedWork.fullPath, 'comments')
        : collection(db, 'users', ownerUid, 'works', selectedWork.id, 'comments');

      const q = query(commentsRef, orderBy('createdAt', 'asc'));

      const unsubscribeComments = onSnapshot(q, (snapshot) => {
        const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComments(fetchedComments);
        setLoadingComments(false);

        // Auto-sync commentsCount if it's out of sync with actual subcollection size
        if (selectedWork && fetchedComments.length !== selectedWork.commentsCount) {
          const syncWorkRef = selectedWork.fullPath
            ? doc(db, selectedWork.fullPath)
            : doc(db, 'users', ownerUid, 'works', selectedWork.id);
          updateDoc(syncWorkRef, { commentsCount: fetchedComments.length }).catch(console.error);
        }
      });

      // Real-time listener for the work document itself to sync counts/reactions
      const workRef = selectedWork.fullPath
        ? doc(db, selectedWork.fullPath)
        : doc(db, 'users', ownerUid, 'works', selectedWork.id);

      const unsubscribeWork = onSnapshot(workRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Only update if it's still the same selected work
          setSelectedWork((prev: any) => (prev?.id === docSnap.id ? { ...data, id: docSnap.id, userId: ownerUid, fullPath: selectedWork.fullPath } : prev));
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
        const adsSnap = await getDocs(collection(db, 'ads'));
        const adsList = adsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((a: any) => (a as any).isActive !== false)
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setAds(adsList);
      } catch (e) {
        console.error('Ads Fetch Error', e);
      }
    };
    fetchAds();
  }, []);

  const handleCommentReact = async (comment: any, type: string = 'love') => {
    if (!user || !selectedWork) return;
    const authorId = selectedWork.userId || targetUid;
    if (!authorId) return;

    const commentRef = selectedWork.fullPath
      ? doc(db, selectedWork.fullPath, 'comments', comment.id)
      : doc(db, 'users', authorId, 'works', selectedWork.id, 'comments', comment.id);

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
          currentReactions[type] = Math.max(0, (currentReactions[type] || 0) - 1);
        } else {
          if (prevType) {
            currentReactions[prevType] = Math.max(0, (currentReactions[prevType] || 0) - 1);
          }
          userReactions[user.uid] = type;
          currentReactions[type] = (currentReactions[type] || 0) + 1;
        }

        transaction.update(commentRef, {
          reactions: currentReactions,
          userReactions: userReactions
        });
      });
    } catch (e) {
      console.error('Comment Reaction Error', e);
    }
  };

  const handleComment = async () => {
    if (!user || !commentText.trim() || !selectedWork) return;

    const authorId = selectedWork.userId || targetUid;
    if (!authorId) return;

    const commentData = {
      text: commentText.trim(),
      userId: user.uid,
      userName: profileData?.fullName || user.displayName || 'User',
      userAvatar: profileData?.avatarUrl || null,
      createdAt: serverTimestamp(),
      replyToId: replyingTo?.id || null,
      replyToUser: replyingTo?.userName || null,
      parentCommentId: replyingTo ? (replyingTo.parentCommentId || replyingTo.id) : null,
      reactions: {},
      userReactions: {},
    };

    try {
      if (editingComment) {
        const editRef = selectedWork.fullPath
          ? doc(db, selectedWork.fullPath, 'comments', editingComment.id)
          : doc(db, 'users', authorId, 'works', selectedWork.id, 'comments', editingComment.id);

        await updateDoc(editRef, {
          text: commentText.trim(),
          updatedAt: serverTimestamp()
        });
      } else {
        const commentsColl = selectedWork.fullPath
          ? collection(db, selectedWork.fullPath, 'comments')
          : collection(db, 'users', authorId, 'works', selectedWork.id, 'comments');

        await addDoc(commentsColl, commentData);

        const workDocRef = selectedWork.fullPath
          ? doc(db, selectedWork.fullPath)
          : doc(db, 'users', authorId, 'works', selectedWork.id);

        await updateDoc(workDocRef, {
          commentsCount: increment(1)
        });
      }
      setCommentText("");
      setReplyingTo(null);
      setEditingComment(null);
    } catch (e) {
      console.error('Comment Error', e);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedWork) return;
    const authorId = selectedWork.userId || targetUid;
    if (!authorId) return;

    try {
      const delRef = selectedWork.fullPath
        ? doc(db, selectedWork.fullPath, 'comments', commentId)
        : doc(db, 'users', authorId, 'works', selectedWork.id, 'comments', commentId);

      await deleteDoc(delRef);

      const workDocRef = selectedWork.fullPath
        ? doc(db, selectedWork.fullPath)
        : doc(db, 'users', authorId, 'works', selectedWork.id);

      await updateDoc(workDocRef, {
        commentsCount: increment(-1)
      });
    } catch (e) {
      console.error('Delete Comment Error', e);
    }
  };

  // Sync global legacy Colors with state
  Colors = getAppColors(theme);

  const t = (key: string) => Translations[language][key] || key;

  // Fetch Target User Profile when switching to PublicProfile
  useEffect(() => {
    if (activeTab === 'PublicProfile' && targetUid) {
      const fetchTargetProfile = async () => {
        // Reset profile first to show loading
        setTargetUserProfile(null);

        try {
          // First try users collection
          const userSnap = await getDoc(doc(db, 'users', targetUid));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // Check if user is a partner/brand_owner
            const isPartnerUser = userData.isPartner || userData.role === 'brand_owner' || userData.role === 'partner' || !!userData.brandId;
            setTargetUserProfile({
              ...userData,
              uid: targetUid,
              id: targetUid,
              isPartner: isPartnerUser
            });
            return;
          }

          // Try collaborations collection by ID
          const collabSnap = await getDoc(doc(db, 'collaborations', targetUid));
          if (collabSnap.exists()) {
            const collabData = collabSnap.data();
            // Get the owner's user profile if ownerId exists
            if (collabData.ownerId) {
              const ownerSnap = await getDoc(doc(db, 'users', collabData.ownerId));
              if (ownerSnap.exists()) {
                setTargetUserProfile({
                  ...ownerSnap.data(),
                  uid: collabData.ownerId,
                  id: collabData.ownerId,
                  brandName: collabData.name || collabData.brandName,
                  brandId: collabData.brandId,
                  isPartner: true,
                  collabData: collabData
                });
                return;
              }
            }
            // Use collaboration data as profile
            setTargetUserProfile({
              uid: targetUid,
              id: targetUid,
              fullName: collabData.name || collabData.brandName || 'Partner',
              displayName: collabData.name || collabData.brandName,
              avatarUrl: collabData.imageUrl || collabData.logo,
              brandId: collabData.brandId,
              isPartner: true,
              collabData: collabData
            });
            return;
          }

          // Try to find collaboration by brandId
          const brandQuery = query(collection(db, 'collaborations'), where('brandId', '==', targetUid), limit(1));
          const brandSnap = await getDocs(brandQuery);
          if (!brandSnap.empty) {
            const collabDoc = brandSnap.docs[0];
            const collabData = collabDoc.data();
            if (collabData.ownerId) {
              const ownerSnap = await getDoc(doc(db, 'users', collabData.ownerId));
              if (ownerSnap.exists()) {
                setTargetUserProfile({
                  ...ownerSnap.data(),
                  uid: collabData.ownerId,
                  id: collabData.ownerId,
                  brandName: collabData.name || collabData.brandName,
                  brandId: collabData.brandId,
                  isPartner: true,
                  collabData: collabData
                });
                return;
              }
            }
            setTargetUserProfile({
              uid: targetUid,
              id: targetUid,
              fullName: collabData.name || collabData.brandName || 'Partner',
              displayName: collabData.name || collabData.brandName,
              avatarUrl: collabData.imageUrl || collabData.logo,
              brandId: collabData.brandId,
              isPartner: true,
              collabData: collabData
            });
            return;
          }

          console.log("Target user not found anywhere:", targetUid);
          // Create a minimal profile to avoid blank screen
          setTargetUserProfile({
            uid: targetUid,
            id: targetUid,
            fullName: 'User',
            displayName: 'User',
          });
        } catch (err) {
          console.error("Error fetching target profile:", err);
          setTargetUserProfile({
            uid: targetUid,
            id: targetUid,
            fullName: 'User',
            displayName: 'User',
          });
        }
      };
      fetchTargetProfile();
    }
  }, [activeTab, targetUid]);

  useEffect(() => {
    // Sync global language for helper functions
    currentLang = language;
    AsyncStorage.setItem('tama_lang', language);

    // Explicitly disable native RTL flipping to fix the "flipped UI" issue
    if (I18nManager.isRTL) {
      I18nManager.forceRTL(false);
      I18nManager.allowRTL(false);
    }
  }, [language]);

  useEffect(() => {
    AsyncStorage.getItem('tama_theme').then(val => {
      if (val === 'light' || val === 'dark') setTheme(val);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('tama_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Load persisted language
    AsyncStorage.getItem('tama_lang').then(lang => {
      if (lang && (lang === 'fr' || lang === 'ar')) setLanguage(lang);
    });
    AsyncStorage.getItem('tama_onboarding_seen').then(val => {
      if (val === 'true') setAppState('Auth');
    });

    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token);
    }).catch(err => console.log('Push Token Error:', err));

    if (!(isExpoGo && Platform.OS === 'android')) {
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        // Handle foreground notification
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        // Handle interaction
      });
    }

    return () => {
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'direct_chats'),
      where('participants', 'array-contains', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(doc => {
        count += (doc.data()[`unreadCount_${user.uid}`] || 0);
      });
      setTotalUnread(count);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'users', user.uid, 'friendRequests'),
      where('status', '==', 'pending')
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
          let userRef = doc(db, 'users', user.uid);
          let userSnap = await getDoc(userRef);

          // IMPORTANT: If not found by UID, check by Email (for project migrations)
          // We do this BEFORE potentially creating a blank customer profile
          if (!userSnap.exists() && user.email) {
            const usersByEmail = await getDocs(query(collection(db, 'users'), where('email', '==', user.email), limit(1)));
            if (!usersByEmail.empty) {
              const oldDoc = usersByEmail.docs[0];
              const oldData = oldDoc.data();
              // Create new doc with new UID and old data
              const migratedData = {
                ...oldData,
                expoPushToken,
                lastLogin: serverTimestamp()
              };
              await setDoc(userRef, migratedData);
              userSnap = await getDoc(userRef);
              setProfileData(migratedData); // Update state immediately
              console.log('🔄 Migrated user profile from old UID to new UID via email (Token Hook)');
            }
          }

          if (userSnap.exists()) {
            await updateDoc(userRef, {
              expoPushToken,
              lastLogin: serverTimestamp()
            });
          } else {
            // ONLY create a new customer if absolutely no profile exists for this email
            await setDoc(userRef, {
              expoPushToken,
              email: user.email,
              role: 'customer',
              fullName: user.displayName || 'User',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            });
            setProfileData({ email: user.email, role: 'customer', fullName: user.displayName || 'User', uid: user.uid, id: user.uid });
          }
        } catch (e) {
          console.log('Error saving token:', e);
        }
      };
      saveToken();
    }
  }, [user, expoPushToken]);

  useEffect(() => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc') // Ensure indexing or remove orderBy if failing
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const allNotifs = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          // Calculate time roughly (better with date-fns)
          time: d.data().createdAt ? new Date(d.data().createdAt.seconds * 1000).toLocaleDateString() : 'Just now'
        }));

        // Client-side filtering because OR queries are complex without composite indexes
        // Filter for: userId == user.uid OR userId == 'ALL'
        const myNotifs = allNotifs.filter((n: any) => n.userId === user.uid || n.userId === 'ALL');
        setNotifications(myNotifs);
      });

      return () => unsubscribe();
    } catch (e) {
      console.log("Notification error:", e);
    }
  }, [user]);

  useEffect(() => {
    const fetchSocials = async () => {
      try {
        const docRef = doc(db, 'settings', 'socials');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSocialLinks(snap.data());
        }
      } catch (err) {
        console.error('Error fetching socials:', err);
      }
    };
    fetchSocials();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setAppState('Main');
        // Listen to user data changes in real-time
        const unsubscribeUser = onSnapshot(doc(db, 'users', u.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setProfileData({ ...userData, uid: u.uid, id: u.uid });
            if (userData.followedCollabs) setFollowedCollabs(userData.followedCollabs);
          } else if (u.email) {
            // Initial user setup if doc doesn't exist
            const def = { email: u.email, role: 'customer', fullName: u.displayName || 'User', wallet: { coins: 0, diamonds: 0 } };
            setProfileData({ ...def, uid: u.uid, id: u.uid });
            setDoc(doc(db, 'users', u.uid), def, { merge: true });
          }
        });

        // Cleanup any stale live sessions owned by this user
        // If the app is just starting, the user cannot be live.
        const cleanupSessions = async () => {
          try {
            const sessionsQ = query(
              collection(db, 'Live_sessions'),
              where('hostId', '==', u.uid),
              where('status', '==', 'live')
            );
            const sessionsSnap = await getDocs(sessionsQ);
            if (!sessionsSnap.empty) {
              console.log('Found stale live sessions, cleaning up...');
              for (const docSnap of sessionsSnap.docs) {
                await updateDoc(doc(db, 'Live_sessions', docSnap.id), { status: 'ended' });
              }
            }
          } catch (err) {
            console.error('Error cleaning stale sessions:', err);
          }
        };
        cleanupSessions();

        return () => {
          unsubscribeUser();
        };
      } else {
        setUser(null);
        setProfileData(null);
      }
    });
    return unsubscribe;
  }, []);

  const updateProfileData = async (data: any) => {
    if (!user) return;
    // Ensure email is always persisted
    const updatedData = { ...data, email: user.email };
    await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
    setProfileData({ ...profileData, ...updatedData });
  };

  const addToCart = (product: any, size?: string, color?: string) => {
    const item = {
      ...product,
      selectedSize: size || product.sizes?.[0] || 'M',
      selectedColor: color || product.colors?.[0] || '',
      quantity: 1,
      cartId: Date.now()
    };
    setCart([...cart, item]);
    setActiveTab('Cart');
  };

  const updateCartQuantity = (cartId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = Math.max(1, (item.quantity || 1) + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (cartId: number) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  const toggleFollowCollab = async (collabIdOrUserId: string) => {
    if (!user) {
      Alert.alert(t('error'), t('loginRequired') || 'Please login to follow partners');
      return;
    }

    try {
      // First, find the actual collaboration document
      let actualCollabId = collabIdOrUserId;
      let collabData: any = null;

      // Try to get collaboration by direct ID
      const collabSnap = await getDoc(doc(db, 'collaborations', collabIdOrUserId));
      if (collabSnap.exists()) {
        collabData = collabSnap.data();
        actualCollabId = collabIdOrUserId;
      } else {
        // Try to find by brandId
        const brandQuery = query(collection(db, 'collaborations'), where('brandId', '==', collabIdOrUserId), limit(1));
        const brandSnap = await getDocs(brandQuery);
        if (!brandSnap.empty) {
          actualCollabId = brandSnap.docs[0].id;
          collabData = brandSnap.docs[0].data();
        } else {
          // Try to find by ownerId
          const ownerQuery = query(collection(db, 'collaborations'), where('ownerId', '==', collabIdOrUserId), limit(1));
          const ownerSnap = await getDocs(ownerQuery);
          if (!ownerSnap.empty) {
            actualCollabId = ownerSnap.docs[0].id;
            collabData = ownerSnap.docs[0].data();
          } else {
            // If still not found, check if it's a User ID that has a brandId
            try {
              const userSnap = await getDoc(doc(db, 'users', collabIdOrUserId));
              if (userSnap.exists()) {
                const uData = userSnap.data();
                if (uData.brandId) {
                  const bQuery = query(collection(db, 'collaborations'), where('brandId', '==', uData.brandId), limit(1));
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
        Alert.alert(t('error'), 'Collaboration not found');
        return;
      }

      // Optimistic update
      const isFollowing = followedCollabs.includes(actualCollabId);
      const newList = isFollowing
        ? followedCollabs.filter(id => id !== actualCollabId)
        : [...followedCollabs, actualCollabId];

      setFollowedCollabs(newList);

      // 1. Update User's Follow List
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { followedCollabs: newList });
      setProfileData({ ...profileData, followedCollabs: newList });

      // 2. Update Collaboration's Follower Count
      const collabRef = doc(db, 'collaborations', actualCollabId);
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(collabRef);
        if (!docSnap.exists()) return;

        const currentCount = docSnap.data().followersCount || 0;
        let newCount = isFollowing ? Math.max(0, currentCount - 1) : currentCount + 1;
        transaction.update(collabRef, { followersCount: newCount });
      });

      // Show feedback
      Alert.alert(
        t('successTitle'),
        isFollowing ? (t('unfollowed') || 'Unfollowed') : (t('followed') || 'Following')
      );

    } catch (e) {
      console.error("Error toggling follow:", e);
      Alert.alert(t('error'), "Failed to update follow status");
    }
  };

  const handleAcceptFriend = async (userId: string) => {
    if (!user) return;
    try {
      const myRef = doc(db, 'users', user.uid);
      const targetRef = doc(db, 'users', userId);

      // Find the request ID to clean up
      const q = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', userId),
        where('receiverId', '==', user.uid),
        where('status', '==', 'pending'),
        limit(1)
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
        const myIncoming = (myData.incomingFriendRequests || []).filter((id: string) => id !== userId);
        const myPending = (myData.pendingFriendRequests || []).filter((id: string) => id !== userId);
        const myFriends = [...new Set([...(myData.friends || []), userId])];

        const targetPending = (targetData.pendingFriendRequests || []).filter((id: string) => id !== user.uid);
        const targetIncoming = (targetData.incomingFriendRequests || []).filter((id: string) => id !== user.uid);
        const targetFriends = [...new Set([...(targetData.friends || []), user.uid])];

        transaction.update(myRef, {
          incomingFriendRequests: myIncoming,
          pendingFriendRequests: myPending,
          friends: myFriends
        });

        transaction.update(targetRef, {
          pendingFriendRequests: targetPending,
          incomingFriendRequests: targetIncoming,
          friends: targetFriends
        });

        if (requestId) {
          const globalReqRef = doc(db, 'friendRequests', requestId);
          const subReqRef = doc(db, 'users', user.uid, 'friendRequests', requestId);
          transaction.update(globalReqRef, { status: 'accepted' });
          transaction.delete(subReqRef);
        }
      });

      // Local state will be updated by onSnapshot, but we can set it for immediate feedback
      setProfileData({
        ...profileData,
        incomingFriendRequests: (profileData.incomingFriendRequests || []).filter((id: string) => id !== userId),
        pendingFriendRequests: (profileData.pendingFriendRequests || []).filter((id: string) => id !== userId),
        friends: [...new Set([...(profileData.friends || []), userId])]
      });

      Alert.alert(t('successTitle'), t('friendAdded') || 'Friend added!');
    } catch (e) {
      console.error("Error accepting friend:", e);
      Alert.alert(t('error'), "Failed to accept friend request");
    }
  };

  const handleRemoveFriend = async (userId: string) => {
    if (!user) return;
    Alert.alert(
      t('confirm') || 'Confirm',
      t('removeFriendConfirm') || 'Are you sure you want to remove this friend?',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('remove') || 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const myRef = doc(db, 'users', user.uid);
              const targetRef = doc(db, 'users', userId);

              const myFriends = (profileData.friends || []).filter((id: string) => id !== userId);
              const myPending = (profileData.pendingFriendRequests || []).filter((id: string) => id !== userId);
              const myIncoming = (profileData.incomingFriendRequests || []).filter((id: string) => id !== userId);

              await updateDoc(myRef, {
                friends: myFriends,
                pendingFriendRequests: myPending,
                incomingFriendRequests: myIncoming
              });

              const targetSnap = await getDoc(targetRef);
              if (targetSnap.exists()) {
                const tData = targetSnap.data();
                const targetFriends = (tData.friends || []).filter((id: string) => id !== user.uid);
                const targetPending = (tData.pendingFriendRequests || []).filter((id: string) => id !== user.uid);
                const targetIncoming = (tData.incomingFriendRequests || []).filter((id: string) => id !== user.uid);

                await updateDoc(targetRef, {
                  friends: targetFriends,
                  pendingFriendRequests: targetPending,
                  incomingFriendRequests: targetIncoming
                });
              }

              setProfileData({
                ...profileData,
                friends: myFriends,
                pendingFriendRequests: myPending,
                incomingFriendRequests: myIncoming
              });
              Alert.alert(t('successTitle'), t('friendRemoved') || 'Friend removed');
            } catch (e) {
              console.error("Error removing friend:", e);
            }
          }
        }
      ]
    );
  };

  const handleAddFriend = async (userId: string) => {
    if (!user) {
      Alert.alert(t('error'), t('loginRequired') || 'Please login to add friends');
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
        t('cancelRequest') || 'Cancel Request',
        t('cancelRequestConfirm') || 'Cancel this friend request?',
        [
          { text: t('no') || 'No', style: 'cancel' },
          {
            text: t('yes') || 'Yes',
            style: 'destructive',
            onPress: async () => {
              try {
                const myPending = pendingSent.filter((id: string) => id !== userId);
                await updateDoc(doc(db, 'users', user.uid), { pendingFriendRequests: myPending });

                const targetRef = doc(db, 'users', userId);
                const targetSnap = await getDoc(targetRef);
                if (targetSnap.exists()) {
                  const targetIncoming = (targetSnap.data().incomingFriendRequests || []).filter((id: string) => id !== user.uid);
                  await updateDoc(targetRef, { incomingFriendRequests: targetIncoming });
                }

                setProfileData({ ...profileData, pendingFriendRequests: myPending });
              } catch (e) { console.error("Error canceling request", e); }
            }
          }
        ]
      );
      return;
    }

    try {
      // Get target user data for the invitation
      const targetRef = doc(db, 'users', userId);
      const targetSnap = await getDoc(targetRef);
      if (!targetSnap.exists()) return;
      const targetData = targetSnap.data();

      // 1. Create invitation documents (Align with WalletScreen)
      const requestId = doc(collection(db, 'friendRequests')).id;
      const requestData = {
        senderId: user.uid,
        senderName: profileData?.fullName || 'User',
        senderAvatar: profileData?.avatarUrl || '',
        receiverId: userId,
        receiverName: targetData.fullName || 'User',
        receiverAvatar: targetData.avatarUrl || '',
        status: 'pending',
        timestamp: serverTimestamp()
      };

      const batch = [
        setDoc(doc(db, 'friendRequests', requestId), requestData),
        setDoc(doc(db, 'users', userId, 'friendRequests', requestId), requestData),
        // 2. Update user document arrays for quick status check
        updateDoc(doc(db, 'users', user.uid), {
          pendingFriendRequests: [...pendingSent, userId]
        }),
        updateDoc(targetRef, {
          incomingFriendRequests: [...(targetData.incomingFriendRequests || []), user.uid]
        })
      ];

      await Promise.all(batch);

      setProfileData({
        ...profileData,
        pendingFriendRequests: [...pendingSent, userId]
      });

      Alert.alert(t('successTitle'), t('friendRequestSent') || 'Friend request sent! Waiting for acceptance.');
    } catch (e) {
      console.error("Error sending friend request:", e);
      Alert.alert(t('error'), "Failed to send friend request");
    }
  };

  const navigateToProduct = (product: any) => {
    setSelectedProduct(product);
    setActiveTab('Detail');
  };

  const navigateToCategory = (catId: string) => {
    setFilterCategory(catId);
    setActiveTab('Shop');
  };

  const navigateToCampaign = (campaign: any) => {
    setSelectedCampaign(campaign);
    setActiveTab('CampaignDetail');
  };

  const handleLogout = async () => {
    Alert.alert(
      t('logoutConfirmTitle'),
      t('logoutConfirmMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            await signOut(auth);
            setAppState('Auth');
          }
        }
      ]
    );
  };
  const navigateToSizeGuide = () => {
    setAppState('SizeGuide');
  };

  const handleBackToMain = () => {
    setAppState('Main');
  };


  const handleTabChange = (tab: string) => {
    if (tab === 'Shop') {
      setFilterCategory(null);
    }
    setActiveTab(tab);
  };

  const handleClearNotifications = async () => {
    // Ideally update all documents. For now, we can just clear local state or implement batch update.
    // Batch update is safer.
    // To properly "read" them, we should update each doc.
    try {
      notifications.forEach(async (n) => {
        if (!n.read && n.id) {
          await updateDoc(doc(db, 'notifications', n.id), { read: true });
        }
      });
      // Local optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) { console.error(e); }
  };

  const [liveStreamData, setLiveStreamData] = useState<any>(null);

  const handleJoinLive = (info: any) => {
    if (typeof info === 'string') {
      setActiveLiveChannel(info);
      // Joining via simple channel ID should default to Audience to be safe
      setIsLiveHost(false);
      setLiveStreamData({ channelId: info });
    } else {
      setActiveLiveChannel(info.channelId);
      setIsLiveHost(info.isHost);
      setLiveStreamData(info);
      setIsLiveReplay(!!info.isReplay);
      setReplayUrl(info.replayUrl || '');
    }
    setAppState('Main');
    setActiveTab('LiveStream');
  };

  const handleStartLive = (arg?: any) => {
    // Check if we were passed a collaboration ID (string) or a brandInfo object
    const isObject = arg && typeof arg === 'object';
    const actualCollabId = typeof arg === 'string' ? arg : (isObject ? arg.id : undefined);

    // Generate channelId
    const channelId = actualCollabId || `live_${profileData?.brandId || profileData?.id || user?.uid}_${Date.now()}`;

    // Set avatar: priority to the passed info object, then profile data
    const infoAvatar = isObject ? (arg.logoUrl || arg.image || arg.logo || arg.coverImageUrl) : null;

    let infoName = isObject ? (arg.name || arg.displayName || arg.brandName || arg.title) : null;
    if (infoName && typeof infoName === 'object') {
      // Handle localized name object or unexpected object
      infoName = infoName[language] || infoName.en || infoName.fr || infoName.ar || Object.values(infoName)[0] || null;
    }

    let baseName = profileData?.brandName || profileData?.fullName || user?.displayName || (user?.email ? user.email.split('@')[0] : 'Host');
    if (baseName && typeof baseName === 'object') {
      baseName = baseName[language] || baseName.en || baseName.fr || baseName.ar || Object.values(baseName)[0] || 'Host';
    }

    const finalHostName = (typeof infoName === 'string' && infoName) ? infoName : (typeof baseName === 'string' ? baseName : 'Host');

    setActiveLiveChannel(channelId);
    setIsLiveHost(true);
    setLiveStreamData({
      channelId,
      brandId: profileData?.brandId || (actualCollabId && !actualCollabId.startsWith('live_') ? actualCollabId : undefined),
      collabId: actualCollabId,
      isHost: true,
      hostAvatar: infoAvatar || profileData?.avatarUrl || profileData?.logoUrl || user?.photoURL,
      hostName: finalHostName
    });
    setIsLiveReplay(false);
    setReplayUrl('');
    setAppState('Main');
    setActiveTab('LiveStream');
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'Home': return (
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
      case 'LiveStream': return (
        isLiveHost ? (
          <HostLiveScreen
            channelId={activeLiveChannel}
            userId={user?.uid || 'guest'}
            userName={liveStreamData?.hostName || profileData?.fullName || user?.displayName || user?.email?.split('@')[0] || 'Host'}
            brandId={liveStreamData?.brandId}
            collabId={liveStreamData?.collabId}
            onClose={() => setActiveTab('Home')}
            t={t}
            language={language}
            hostAvatar={liveStreamData?.hostAvatar || profileData?.avatarUrl || user?.photoURL}
          />
        ) : (
          <AudienceLiveScreen
            channelId={activeLiveChannel}
            userId={user?.uid || 'guest'}
            userName={profileData?.fullName || user?.displayName || user?.email?.split('@')[0] || 'User'}
            userAvatar={profileData?.avatarUrl || user?.photoURL}
            onClose={() => setActiveTab('Home')}
            t={t}
            language={language}
            profileData={profileData}
          />
        )
      );
      case 'Notifications': return <NotificationsScreen notifications={notifications} language={language} onClear={handleClearNotifications} onBack={() => setActiveTab('Home')} t={t} />;
      case 'Shop': return <ShopScreen onProductPress={navigateToProduct} initialCategory={filterCategory} initialBrand={filterBrand} setInitialBrand={setFilterBrand} wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={(p: any) => setQuickAddProduct(p)} onBack={() => setActiveTab('Home')} t={t} theme={theme} language={language} />;
      case 'Cart': return <CartScreen cart={cart} onRemove={removeFromCart} onUpdateQuantity={updateCartQuantity} onComplete={() => setCart([])} profileData={profileData} updateProfile={updateProfileData} onBack={() => setActiveTab('Shop')} t={t} />;
      case 'Profile': return <ProfileScreen key="own-profile" user={user} onBack={() => setActiveTab('Home')} onLogout={handleLogout} profileData={profileData} currentUserProfileData={profileData} updateProfile={updateProfileData} onNavigate={(tab: string | any) => setActiveTab(tab)} socialLinks={socialLinks} t={t} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} followedCollabs={followedCollabs} toggleFollowCollab={toggleFollowCollab} setSelectedCollab={setSelectedCollab} setActiveTab={setActiveTab} onStartLive={handleStartLive} totalUnread={totalUnread} isPublicProfile={false} onShowBadge={() => setShowBadge(true)} onShowScanner={() => setShowScanner(true)} setActiveTrackingId={setActiveTrackingId} />;
      case 'PublicProfile': return <ProfileScreen key={`public-profile-${targetUid}`} user={user} onBack={() => setActiveTab(previousTab)} onLogout={handleLogout} profileData={targetUserProfile} currentUserProfileData={profileData} updateProfile={updateProfileData} onNavigate={(tab: string | any) => setActiveTab(tab)} socialLinks={socialLinks} t={t} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} followedCollabs={followedCollabs} toggleFollowCollab={toggleFollowCollab} setSelectedCollab={setSelectedCollab} setActiveTab={setActiveTab} onStartLive={handleStartLive} totalUnread={totalUnread} setTotalUnread={setTotalUnread} works={works} setWorks={setWorks} uploadingWork={uploadingWork} setUploadingWork={setUploadingWork} selectedWork={selectedWork} setSelectedWork={setSelectedWork} targetUid={targetUid} setTargetUid={setTargetUid} selectedChatUser={selectedChatUser} setSelectedChatUser={setSelectedChatUser} comments={comments} setComments={setComments} commentText={commentText} setCommentText={setCommentText} replyingTo={replyingTo} setReplyingTo={setReplyingTo} editingComment={editingComment} setEditingComment={setEditingComment} loadingComments={loadingComments} setLoadingComments={setLoadingComments} expandedReplies={expandedReplies} setExpandedReplies={setExpandedReplies} isPublicProfile={true} onShowBadge={() => setShowBadge(true)} onShowScanner={() => setShowScanner(true)} setActiveTrackingId={setActiveTrackingId} />;
      case 'FollowManagement': return <FollowManagementScreen onBack={() => setActiveTab('Profile')} followedCollabs={followedCollabs} toggleFollowCollab={toggleFollowCollab} setSelectedCollab={setSelectedCollab} setActiveTab={setActiveTab} t={t} language={language} theme={theme} />;
      case 'Orders': return <OrdersScreen onBack={() => setActiveTab('Profile')} t={t} />;
      case 'Wishlist': return <WishlistScreen onBack={() => setActiveTab('Profile')} onProductPress={navigateToProduct} wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={(p: any) => setQuickAddProduct(p)} t={t} theme={theme} language={language} />;
      case 'Settings': return <SettingsScreen onBack={() => setActiveTab('Profile')} onLogout={handleLogout} profileData={profileData} updateProfile={updateProfileData} onNavigate={(screen: string) => setActiveTab(screen)} t={t} user={user} />;
      case 'KYC': return <KYCScreen onBack={() => setActiveTab('Profile')} user={user} profileData={profileData} updateProfile={updateProfileData} theme={theme} t={t} language={language} />;
      case 'Camera': return <CameraScreen onBack={() => setActiveTab('Feed')} onNavigate={(screen: string) => setActiveTab(screen)} t={t} language={language} theme={theme} user={user} />;
      case 'Messages': return <MessagesScreen
        user={user}
        onBack={() => setActiveTab('Profile')}
        onSelectChat={async (chat: any, otherId: string) => {
          const userDoc = await getDoc(doc(db, 'users', otherId));
          if (userDoc.exists()) {
            setSelectedChatUser({ uid: otherId, ...userDoc.data() });
            setActiveTab('DirectMessage');
          }
        }}
        t={t}
        tr={tr}
      />;
      case 'DirectMessage': return <DirectMessageScreen
        user={user}
        targetUser={selectedChatUser}
        onBack={() => setActiveTab('Messages')}
        t={t}
        language={language}
        currentUserData={profileData}
      />;
      case 'Wallet': return <WalletScreen onBack={() => setActiveTab('Profile')} theme={theme} t={t} profileData={profileData} user={user} language={language} onNavigate={(screen, params) => {
        if (screen === 'PublicProfile') {
          setTargetUserProfile(params);
          setPreviousTab('Wallet');
          setActiveTab('PublicProfile');
        } else {
          setActiveTab(screen);
        }
      }} />;
      case 'Fidelity': return <FidelityScreen onBack={() => setActiveTab('Profile')} user={user} t={t} theme={theme} />;
      case 'Friends': return <FriendsScreen
        onBack={() => setActiveTab('Profile')}
        user={user}
        profileData={profileData}
        theme={theme}
        t={t}
        language={language}
        onNavigate={(screen, params) => {
          if (screen === 'PublicProfile') {
            setTargetUserProfile(params);
            setPreviousTab('Friends');
            setActiveTab('PublicProfile');
          } else {
            setActiveTab(screen);
          }
        }}
      />;
      case 'Chat': return <ChatScreen onBack={() => setActiveTab('Settings')} user={user} t={t} theme={theme} colors={getAppColors(theme)} />;
      case 'PrivacyPolicy': return <PrivacyPolicyScreen onBack={() => setActiveTab('Settings')} t={t} />;
      case 'TermsOfService': return <TermsOfServiceScreen onBack={() => setActiveTab('Settings')} t={t} />;
      case 'LiveAnalytics': return (
        <LiveAnalyticsScreen
          brandId={profileData?.brandId || ''}
          onBack={() => setActiveTab('Profile')}
          onNavigate={(screen: string, params?: any) => {
            if (screen === 'LiveStream') {
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
      case 'AdminMenu': return <AdminMenuScreen onBack={() => setActiveTab('Profile')} onNavigate={setActiveTab} profileData={profileData} t={t} />;
      case 'AdminDashboard': return <AdminDashboardScreen onBack={() => setActiveTab('AdminMenu')} user={user} profileData={profileData} t={t} language={language} />;
      case 'AdminProducts': return <AdminProductsScreen onBack={() => setActiveTab('AdminMenu')} user={user} profileData={profileData} t={t} />;
      case 'AdminCategories': return <AdminCategoriesScreen onBack={() => setActiveTab('AdminMenu')} profileData={profileData} t={t} />;
      case 'AdminBrands': return <AdminBrandsScreen onBack={() => setActiveTab('AdminMenu')} profileData={profileData} t={t} />;
      case 'AdminAds': return <AdminAdsScreen onBack={() => setActiveTab('AdminMenu')} profileData={profileData} t={t} />;
      case 'AdminFlashSale': return <AdminFlashSaleScreen onBack={() => setActiveTab('AdminMenu')} profileData={profileData} t={t} />;
      case 'AdminPromoBanners': return <AdminPromoBannersScreen onBack={() => setActiveTab('AdminMenu')} profileData={profileData} t={t} />;
      case 'AdminBanners': return <AdminBannersScreen onBack={() => setActiveTab('AdminMenu')} profileData={profileData} t={t} />;
      case 'AdminOrders': return <AdminOrdersScreen onBack={() => setActiveTab('AdminMenu')} user={user} profileData={profileData} t={t} language={language} />;
      case 'AdminUsers': return <AdminUsersScreen onBack={() => setActiveTab('AdminMenu')} profileData={profileData} t={t} language={language} />;
      case 'AdminCoupons': return <AdminCouponsScreen onBack={() => setActiveTab('AdminMenu')} profileData={profileData} t={t} language={language} />;
      case 'AdminSettings': return <AdminSettingsScreen onBack={() => setActiveTab('AdminMenu')} user={user} profileData={profileData} t={t} />;
      case 'AdminNotifications': return <AdminNotificationsScreen onBack={() => setActiveTab('AdminMenu')} profileData={profileData} t={t} />;
      case 'AdminKYC': return <AdminKYCScreen onBack={() => setActiveTab('AdminMenu')} profileData={profileData} t={t} theme={theme} />;
      case 'AdminSupportList': return <AdminSupportListScreen onBack={() => setActiveTab('AdminMenu')} onChatPress={(chatId: string, customerName: string) => {
        setSelectedAdminChat({ chatId, customerName });
        setActiveTab('AdminSupportChat');
      }} t={t} theme={theme} colors={getAppColors(theme)} />;
      case 'AdminSupportChat': return <AdminSupportChatScreen
        onBack={() => setActiveTab('AdminSupportList')}
        chatId={selectedAdminChat?.chatId}
        customerName={selectedAdminChat?.customerName}
        user={user}
        t={t}
        theme={theme}
        colors={getAppColors(theme)}
      />;

      case 'AdminShipments': return <AdminShipmentsScreen
        onBack={() => setActiveTab('AdminMenu')}
        user={user}
        profileData={profileData}
        language={language}
        t={t}
      />;
      case 'ShipmentTracking': return <ShipmentTrackingScreen
        trackingId={activeTrackingId}
        onBack={() => setActiveTab(previousTab || 'Profile')}
        t={t}
      />;
      case 'ProofOfDelivery': return <ProofOfDeliveryScreen
        shipment={activeShipment}
        onBack={() => setActiveTab(profileData?.role === 'driver' ? 'DriverDashboard' : 'Orders')}
        onComplete={() => setActiveTab(profileData?.role === 'driver' ? 'DriverDashboard' : 'Orders')}
        t={t}
      />;

      case 'DriverDashboard': return <DriverDashboardScreen
        user={user}
        profileData={profileData}
        onBack={() => setActiveTab('Profile')}
        onOpenProof={(s: any) => { setActiveShipment(s); setActiveTab('ProofOfDelivery'); }}
        onScanQR={(s: any) => { setActiveShipment(s); setShowScanner(true); }}
        t={t}
        language={language}
      />;

      case 'ShipmentCreation': return <ShipmentCreationScreen
        onBack={() => setActiveTab('Profile')}
        onComplete={() => setActiveTab('Profile')}
        t={t}
      />;
      case 'Feed': return <FeedScreen
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
          setPreviousTab('Feed');
          setActiveTab('PublicProfile');
        }}
        onCampaignPress={navigateToCampaign}
        onAddFriend={handleAddFriend}
        onFollowCollab={toggleFollowCollab}
        onCollabPress={async (collabId) => {
          // Navigate to user profile to show Works and Messages tabs
          setTargetUid(collabId);
          setPreviousTab('Feed');
          setActiveTab('PublicProfile');
        }}
        user={user}
        profileData={profileData}
        ads={ads}
        followedCollabs={followedCollabs}
      />;

      case 'Collaboration': return <CollaborationScreen
        t={t}
        theme={theme}
        language={language}
        onNavigate={(screen) => setActiveTab(screen)}
        onCollabPress={(collab) => {
          setSelectedCollab(collab);
          setActiveTab('CollabDetail');
        }}
        onBack={() => setActiveTab('Home')}
      />;
      case 'CollabDetail': return <CollaborationDetailScreen
        collab={selectedCollab}
        onBack={() => setActiveTab('Collaboration')}
        onNavigateToShop={(brandId) => {
          setFilterBrand(brandId);
          setActiveTab('Shop');
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
      />;
      case 'AdminCollaboration': return <AdminCollaborationScreen onBack={() => setActiveTab('AdminMenu')} t={t} theme={theme} />;

      case 'Detail':
        if (!selectedProduct) return null;
        return <ProductDetailScreen
          product={selectedProduct}
          onBack={() => setActiveTab(previousTab || 'Home')}
          onAddToCart={addToCart}
          toggleWishlist={toggleWishlist}
          isWishlisted={wishlist.includes(selectedProduct?.id)}
          onSizeGuide={navigateToSizeGuide}
          user={user}
          profileData={profileData}
          t={t}
          language={language}
          theme={theme}
        />;
      case 'CampaignDetail': return <CampaignDetailScreen
        campaign={selectedCampaign}
        onBack={() => setActiveTab('Home')}
        onProductPress={navigateToProduct}
        onCategoryPress={navigateToCategory}
        t={t}
      />;

      case 'ShippingPolicy': return <GenericPolicyScreen onBack={() => setActiveTab('Home')} t={t} titleKey="freeShipping" fieldKey="shippingPolicy" defaultText={t('shippingPolicyDefault')} Icon={Package} />;
      case 'PaymentPolicy': return <GenericPolicyScreen onBack={() => setActiveTab('Home')} t={t} titleKey="securePayment" fieldKey="paymentPolicy" defaultText={t('paymentPolicyDefault')} Icon={Shield} />;
      case 'ReturnPolicy': return <GenericPolicyScreen onBack={() => setActiveTab('Home')} t={t} titleKey="easyReturns" fieldKey="returnPolicy" defaultText={t('returnPolicyDefault')} Icon={RotateCcw} />;

      default: return <HomeScreen
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
      />;
    }
  };
  if (!fontsLoaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, colors: getAppColors(theme), setTheme }}>
      <SafeAreaProvider>
        <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />
        {appState === 'Onboarding' ? (
          <OnboardingScreen onFinish={() => setAppState('Auth')} t={t} />
        ) : appState === 'Auth' ? (
          <AuthScreen isLogin={isLogin} toggleAuth={() => setIsLogin(!isLogin)} onComplete={() => setAppState('Main')} t={t} language={language} />
        ) : (
          <View style={[styles.mainContainer, { backgroundColor: theme === 'dark' ? Theme.dark.colors.background : Theme.light.colors.background }]}>
            {appState === 'SizeGuide' ? (
              <SizeGuideScreen onBack={handleBackToMain} t={t} language={language} />
            ) : (
              <>
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
                      id: (activeTab === 'PublicProfile' ? targetUserProfile : profileData)?.uid || (activeTab === 'PublicProfile' ? targetUserProfile : profileData)?.id || '',
                      fullName: (activeTab === 'PublicProfile' ? targetUserProfile : profileData)?.fullName || (activeTab === 'PublicProfile' ? targetUserProfile : profileData)?.displayName || 'USER',
                      avatarUrl: (activeTab === 'PublicProfile' ? targetUserProfile : profileData)?.avatarUrl || '',
                      role: (activeTab === 'PublicProfile' ? targetUserProfile : profileData)?.role || 'User',
                      wallet: (activeTab === 'PublicProfile' ? targetUserProfile : profileData)?.wallet
                    }}
                    isDark={theme === 'dark'}
                    language={language}
                    onClose={() => setShowBadge(false)}
                    onVisitProfile={(uid: string) => {
                      setShowBadge(false);
                      setTargetUid(uid);
                      setPreviousTab(activeTab);
                      setActiveTab('PublicProfile');
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
                    isDark={theme === 'dark'}
                    t={t}
                  />
                </Modal>

                {!activeTab.startsWith('Admin') && activeTab !== 'Detail' && activeTab !== 'CampaignDetail' && activeTab !== 'LiveStream' && activeTab !== 'Camera' && activeTab !== 'Messages' && activeTab !== 'DirectMessage' && (
                  <View style={[styles.tabBarWrapper, { zIndex: 1000 }]}>
                    <View style={[styles.glassTabBar, theme === 'dark' && { backgroundColor: 'rgba(20,20,25,0.8)', borderColor: '#2F2F3D' }]}>
                      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
                      <TouchableOpacity onPress={() => setActiveTab('Home')} style={styles.tabItem}>
                        <Home size={22} color={activeTab === 'Home' ? (theme === 'dark' ? '#FFF' : '#000') : '#AEAEB2'} strokeWidth={activeTab === 'Home' ? 2.5 : 2} />
                        <Text style={[styles.tabLabel, activeTab === 'Home' && { color: theme === 'dark' ? '#FFF' : '#000' }]}>{t('home')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setActiveTab('Feed')} style={styles.tabItem}>
                        <LayoutGrid size={22} color={activeTab === 'Feed' ? (theme === 'dark' ? '#FFF' : '#000') : '#AEAEB2'} strokeWidth={activeTab === 'Feed' ? 2.5 : 2} />
                        <Text style={[styles.tabLabel, activeTab === 'Feed' && { color: theme === 'dark' ? '#FFF' : '#000' }]}>{t('feed')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setFilterCategory(null); setActiveTab('Shop'); }} style={styles.tabItem}>
                        <Search size={22} color={activeTab === 'Shop' ? (theme === 'dark' ? '#FFF' : '#000') : '#AEAEB2'} strokeWidth={activeTab === 'Shop' ? 2.5 : 2} />
                        <Text style={[styles.tabLabel, activeTab === 'Shop' && { color: theme === 'dark' ? '#FFF' : '#000' }]}>{t('shop')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setActiveTab('Collaboration')} style={styles.tabItem}>
                        <Handshake size={22} color={activeTab === 'Collaboration' ? (theme === 'dark' ? '#FFF' : '#000') : '#AEAEB2'} strokeWidth={activeTab === 'Collaboration' ? 2.5 : 2} />
                        <Text style={[styles.tabLabel, activeTab === 'Collaboration' && { color: theme === 'dark' ? '#FFF' : '#000' }]}>{t('collab')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setActiveTab('Cart')} style={styles.tabItem}>
                        <View>
                          <ShoppingBag size={22} color={activeTab === 'Cart' ? (theme === 'dark' ? '#FFF' : '#000') : '#AEAEB2'} strokeWidth={activeTab === 'Cart' ? 2.5 : 2} />
                          {cart.length > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cart.length}</Text></View>}
                        </View>
                        <Text style={[styles.tabLabel, activeTab === 'Cart' && { color: theme === 'dark' ? '#FFF' : '#000' }]}>{t('bag')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setActiveTab('Profile')} style={styles.tabItem}>
                        <View>
                          <User size={22} color={activeTab === 'Profile' ? (theme === 'dark' ? '#FFF' : '#000') : '#AEAEB2'} strokeWidth={activeTab === 'Profile' ? 2.5 : 2} />
                          {(totalUnread + pendingRequestsCount) > 0 && <View style={[styles.cartBadge, { backgroundColor: '#EF4444' }]}><Text style={styles.cartBadgeText}>{(totalUnread + pendingRequestsCount) > 99 ? '99+' : (totalUnread + pendingRequestsCount)}</Text></View>}
                        </View>
                        <Text style={[styles.tabLabel, activeTab === 'Profile' && { color: theme === 'dark' ? '#FFF' : '#000' }]}>{t('me')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* GLOBAL COMMENTS BOTTOM SHEET */}
            <Modal
              visible={isCommentSheetVisible}
              animationType="slide"
              transparent
              onRequestClose={() => setIsCommentSheetVisible(false)}
            >
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
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
                    overflow: 'hidden'
                  }}
                >
                  <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
          </View>
        )}
      </SafeAreaProvider>
    </ThemeContext.Provider >
  );
}

// --- COMPONENTS ---

function HomeScreen({ user, profileData, onProductPress, onCategoryPress, onCampaignPress, onNavigate, wishlist, toggleWishlist, notifications, addToCart, t, language, setFilterBrand, onJoinLive }: any) {
  const { colors, theme } = useAppTheme();
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [flashSale, setFlashSale] = useState<any>(null);
  const [flashProducts, setFlashProducts] = useState<any[]>([]);
  const [promoBanners, setPromoBanners] = useState<any[]>([]);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [liveChannels, setLiveChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const randomColors = [
    "#FF6B6B",
    "#FF4757",
    "#FF9F1C",
    "#FF922B",
    "#FFD93D",
    "#F9C74F",

    "#6BCB77",
    "#2ECC71",
    "#06D6A0",
    "#00C896",

    "#00B4D8",
    "#48CAE4",
    "#4D96FF",
    "#3A86FF",
    "#4361EE",

    "#7209B7",
    "#9D4EDD",
    "#8338EC",
    "#B5179E",
    "#F72585",
    "#FF4D6D",

    "#FB5607",
  ];
  const [randomBorderColor, setRandomBorderColor] = useState("#FF6B6B")
  useEffect(() => {
    const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)];
    setRandomBorderColor(randomColor);
  }, []);

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  // Header background opacity based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerBackgroundColor = headerOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.95)'],
  });

  useEffect(() => {
    fetchData();

    // Subscribe to live sessions
    const unsubscribeLive = LiveSessionService.subscribeToAllSessions((sessions: LiveSession[]) => {
      const now = Date.now();
      const active = sessions.filter(s => {
        const start = s.startedAt?.toMillis?.() || (s.startedAt?.seconds ? s.startedAt.seconds * 1000 : 0);
        return s.status === 'live' && (now - start) < (6 * 60 * 60 * 1000); // Only show sessions from last 6 hours
      });
      setLiveSessions(active);
      const liveIds = active.flatMap(s => [s.brandId, s.collabId, s.channelId]).filter(Boolean) as string[];
      setLiveChannels(liveIds);
    });

    return () => unsubscribeLive();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch categories
      const catSnap = await getDocs(collection(db, 'categories'));
      const catList = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(catList);

      // Fetch brands (only active brands)
      const brandsSnap = await getDocs(collection(db, 'brands'));
      const allBrands: any[] = brandsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const activeBrands = allBrands.filter((b: any) => b.isActive !== false);
      setBrands(activeBrands);

      // Fetch featured products
      const prodSnap = await getDocs(query(collection(db, 'products'), limit(6)));
      const prodList = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeatured(prodList);

      // Fetch banners
      const bannerSnap = await getDocs(collection(db, 'banners'));
      const bannerList = bannerSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((b: any) => (b as any).isActive !== false)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setBanners(bannerList);

      // Fetch ads
      const adsSnap = await getDocs(collection(db, 'ads'));
      const adsList = adsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((a: any) => (a as any).isActive !== false)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setAds(adsList);

      // Fetch Flash Sale
      try {
        const flashSnap = await getDoc(doc(db, 'settings', 'flashSale'));
        if (flashSnap.exists() && flashSnap.data().active) {
          const fsData = flashSnap.data();
          const now = new Date().getTime();
          const end = fsData.endTime ? new Date(fsData.endTime).getTime() : 0;

          if (end > now) {
            setFlashSale(fsData);
            if (fsData.productIds?.length > 0) {
              const pSnap = await getDocs(query(collection(db, 'products'), where('__name__', 'in', fsData.productIds.slice(0, 10))));
              setFlashProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
          } else {
            setFlashSale(null);
          }
        } else {
          setFlashSale(null);
        }
      } catch (fsErr) {
        console.log("Error fetching flash sale", fsErr);
        setFlashSale(null);
      }
      // Fetch Promo Banners
      const promoSnap = await getDocs(collection(db, 'promoBanners'));
      setPromoBanners(promoSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((b: any) => b.isActive !== false)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      );

      // Fetch collaborations
      const collabSnap = await getDocs(query(collection(db, 'collaborations'), where('isActive', '==', true)));
      setCollaborations(collabSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const bannerRef = useRef<FlatList>(null);
  const scrollIndex = useRef(0);

  const promoRef = useRef<FlatList>(null);
  const promoScrollIndex = useRef(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      scrollIndex.current = (scrollIndex.current + 1) % banners.length;
      bannerRef.current?.scrollToIndex({
        index: scrollIndex.current,
        animated: true
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [banners]);

  useEffect(() => {
    if (promoBanners.length <= 1) return;

    const interval = setInterval(() => {
      promoScrollIndex.current = (promoScrollIndex.current + 1) % promoBanners.length;
      promoRef.current?.scrollToIndex({
        index: promoScrollIndex.current,
        animated: true
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [promoBanners]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.foreground} />
      </View>
    );
  }


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.modernHeader, {
        backgroundColor: 'transparent', // Let the blur view handle the background
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64 + insets.top,
        paddingTop: insets.top,
        borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '66' }]} />
        </Animated.View>

        <TouchableOpacity onPress={() => onNavigate('Profile')} activeOpacity={0.7} style={{ borderWidth: 2, borderColor: randomBorderColor, borderRadius: 50 }}>
          <View style={[styles.headerAvatarContainer, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
            {profileData?.avatarUrl ? (
              <Image source={{ uri: profileData.avatarUrl }} style={styles.headerAvatar} />
            ) : user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.border }]}>
                <User size={20} color={colors.foreground} strokeWidth={2} />
              </View>
            )}
          </View>
        </TouchableOpacity>
        {/* 
        <Text pointerEvents="none" style={[styles.modernLogo, {
          top: insets.top,
          height: 64,
          lineHeight: 64,
          fontSize: 18,
          letterSpacing: 0.5,
          fontWeight: '900' as any,
          color: colors.foreground
        }]}>TAMA CLOTHING</Text> */}
        <View>
          <Image source={require("./assets/logo.png")} style={[styles.logo, { alignSelf: 'center', width: 200, height: 200, marginLeft: 20 }]} />

        </View>


        <TouchableOpacity style={[styles.searchCircle, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} activeOpacity={0.7} onPress={() => onNavigate('Notifications')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Bell size={20} color={colors.foreground} strokeWidth={2.5} />
          {unreadCount > 0 && <View style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error, borderWidth: 1.5, borderColor: theme === 'dark' ? '#000' : '#FFF' }} />}
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 64 + insets.top + 15, paddingBottom: 100 + insets.bottom }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Live Event Banner - Dynamic */}
        {(() => {
          const now = Date.now();
          // Filter out sessions that were started more than 6 hours ago to avoid "ghost" sessions
          const activeSessions = liveSessions.filter(s => {
            const start = s.startedAt?.toMillis?.() || (s.startedAt?.seconds ? s.startedAt.seconds * 1000 : 0);
            return s.status === 'live' && (now - start) < (6 * 60 * 60 * 1000);
          });

          const bestLiveSession = activeSessions.length > 0
            ? activeSessions.reduce((prev, current) => (Math.max(0, prev.viewCount) > Math.max(0, current.viewCount)) ? prev : current)
            : null;

          if (!bestLiveSession) return null;

          const bestCollab = collaborations.find(c =>
            c.id === bestLiveSession.collabId ||
            c.id === bestLiveSession.channelId ||
            (c.brandId && c.brandId === bestLiveSession.brandId)
          );

          return (
            <TouchableOpacity
              onPress={() => {
                onJoinLive && onJoinLive({
                  channelId: bestLiveSession.channelId,
                  isHost: false, // Joining an existing live from banner is always Audience
                  userName: profileData?.fullName || user?.displayName || 'Guest',
                  userId: user?.uid,
                  brandId: bestCollab?.brandId || bestLiveSession.brandId,
                  hostAvatar: bestCollab?.coverImageUrl || bestCollab?.imageUrl || bestLiveSession.hostAvatar
                });
              }}
              activeOpacity={0.9}
              style={{
                marginHorizontal: 15,
                marginTop: 10,
                marginBottom: 10,
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: theme === 'dark' ? '#121218' : '#FFF',
                borderWidth: 1.5,
                borderColor: '#EF4444',
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 8
              }}
            >
              <LinearGradient
                colors={theme === 'dark' ? ['#1A1A1A', '#000000'] : ['#FFF5F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
              >
                <View style={{ width: 64, height: 64, position: 'relative', marginRight: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Animatable.View
                    animation="pulse"
                    iterationCount="infinite"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      borderWidth: 2,
                      borderColor: '#EF4444',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'transparent'
                    }}
                  >
                    <Image
                      source={
                        (bestCollab?.imageUrl || bestLiveSession.hostAvatar)
                          ? { uri: bestCollab?.imageUrl || bestLiveSession.hostAvatar }
                          : APP_ICON
                      }
                      style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.border }}
                    />
                  </Animatable.View>

                  <Animatable.View
                    animation="bounceIn"
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      backgroundColor: '#EF4444',
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 6,
                      borderWidth: 1.5,
                      borderColor: theme === 'dark' ? '#121218' : '#FFF',
                    }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 }}>{t('enDirect') || 'EN DIRECT'}</Text>
                  </Animatable.View>
                </View>

                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={{ color: colors.foreground, fontWeight: '900', fontSize: 14, letterSpacing: -0.5, marginBottom: 2 }} numberOfLines={1}>
                    {((bestCollab ? getName(bestCollab.name) : (bestLiveSession.hostName || 'BROADCASTER'))).toUpperCase()}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ position: 'relative', width: 8, height: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
                      <Animatable.View
                        animation="pulse"
                        iterationCount="infinite"
                        style={{ position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(239, 68, 68, 0.3)' }}
                      />
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800', opacity: 0.8 }}>
                      {Math.max(0, bestLiveSession.viewCount)} {t('viewers')} • {t('joinNow')}
                    </Text>
                  </View>
                </View>

                <Animatable.View animation="pulse" iterationCount="infinite" style={{ marginLeft: 10 }}>
                  <View style={{
                    backgroundColor: '#EF4444',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 12,
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 6,
                    elevation: 4
                  }}>
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 10, letterSpacing: 1.5 }}>{t('join').toUpperCase()}</Text>
                  </View>
                </Animatable.View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })()}

        {/* Live Now Collaborations */}
        {collaborations.filter(c => liveChannels.includes(c.id) || (c.brandId && liveChannels.includes(c.brandId))).length > 0 && (
          <View style={{ marginTop: 20 }}>
            <View style={[styles.sectionHeader, { marginBottom: 15 }]}>
              <View>
                <Text style={[styles.modernSectionTitle, { color: colors.foreground }]}>{t('liveNow').toUpperCase()}</Text>
                <View style={{ width: 25, height: 2, backgroundColor: '#EF4444', marginTop: 4 }} />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
              {collaborations.filter(c => liveChannels.includes(c.id) || (c.brandId && liveChannels.includes(c.brandId))).map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={{ alignItems: 'center' }}
                  onPress={() => {
                    // Find actual session to get correct channelId
                    const session = liveSessions.find(s =>
                      s.brandId === c.brandId ||
                      s.collabId === c.id ||
                      s.channelId === c.id ||
                      (c.brandId && s.channelId === c.brandId) // fallback check
                    );

                    const targetChannelId = session?.channelId || c.id;

                    onJoinLive && onJoinLive({
                      channelId: targetChannelId,
                      isHost: false, // Joining from Live Now list is always Audience
                      userName: profileData?.fullName || user?.displayName || 'Guest',
                      userId: user?.uid,
                      brandId: c.brandId,
                      hostAvatar: c.coverImageUrl || c.imageUrl
                    });
                  }}
                >
                  <View style={{ position: 'relative', alignItems: 'center' }}>
                    <Animatable.View
                      animation="pulse"
                      easing="ease-out"
                      iterationCount="infinite"
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 29,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: '#EF4444'
                      }}
                    >
                      <Image
                        source={c.imageUrl ? { uri: c.imageUrl } : APP_ICON}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          backgroundColor: colors.border,
                          borderWidth: 1.5,
                          borderColor: colors.background
                        }}
                      />
                    </Animatable.View>
                    <Animatable.View
                      animation="bounceIn"
                      style={{
                        position: 'absolute',
                        bottom: -4,
                        backgroundColor: '#EF4444',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                        borderWidth: 1.5,
                        borderColor: colors.background,
                        shadowColor: '#EF4444',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 4
                      }}
                    >
                      <Text style={{ fontSize: 7, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 }}>{t('enDirect') || 'EN DIRECT'}</Text>
                    </Animatable.View>
                  </View>
                  <Text numberOfLines={1} style={{ fontSize: 9, fontWeight: '800', marginTop: 8, color: colors.foreground, width: 70, textAlign: 'center' }}>
                    {getName(c.name).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Banner Carousel */}
        <View style={{ marginTop: 15 }}>
          <FlatList
            ref={bannerRef}
            data={banners.length > 0 ? banners : [{ id: '1', imageUrl: 'https://images.unsplash.com/photo-1539106609512-725e3652e361?w=800' }]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            snapToInterval={width - 30 + 15}
            decelerationRate="fast"
            snapToAlignment="start"
            contentContainerStyle={{ paddingLeft: 15 }}
            onScrollToIndexFailed={() => { }}
            renderItem={({ item }) => (
              <View style={{ width: width - 30, marginRight: 15 }}>
                <View style={[styles.modernHero, { borderRadius: 25, overflow: 'hidden' }]}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.modernHeroImg}
                  />
                  <View style={styles.heroGlassBadge}>
                    <Text style={styles.heroBadgeText}>{getName(item.subtitle).toUpperCase() || t('newDrop')}</Text>
                  </View>
                  <View style={styles.modernHeroFooter}>
                    <Text style={styles.modernHeroTitle}>{getName(item.title).toUpperCase() || t('futureMinimalism')}</Text>
                    <TouchableOpacity style={styles.modernHeroBtn} onPress={() => onNavigate('Shop')}>
                      <Text style={styles.modernHeroBtnText}>{t('viewAll')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        </View>

        {/* Collections Section */}
        <View style={[styles.modernSection, { marginTop: 10 }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.modernSectionTitle, { color: colors.foreground }]}>{t('collections') || 'COLLECTIONS'}</Text>
              <View style={{ width: 25, height: 2, backgroundColor: colors.accent, marginTop: 4 }} />
            </View>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => onNavigate('Shop')}>
              <Text style={[styles.modernSectionLink, { color: colors.accent }]}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, gap: 15, alignItems: 'flex-start' }}
          >
            {/* Categories Section */}
            <View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, marginBottom: 12, letterSpacing: 1 }}>{t('categories').toUpperCase()}</Text>
              <View style={{ flexDirection: 'row', gap: 15 }}>
                {categories.map((cat: any) => (
                  <TouchableOpacity key={cat.id} style={{ alignItems: 'center' }} onPress={() => onCategoryPress(cat.id)}>
                    <View style={[styles.modernCatCard, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9F9' }]}>
                      <Image source={{ uri: cat.image || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400' }} style={styles.catBgImage} />
                    </View>
                    <Text style={{ fontSize: 9, fontWeight: '800', marginTop: 8, color: colors.foreground, letterSpacing: 1 }}>{String(translateCategory(getName(cat.name))).toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Separator */}
            {categories.length > 0 && brands.length > 0 && (
              <View style={{ width: 1, height: '80%', backgroundColor: colors.border, marginHorizontal: 5, marginTop: 25 }} />
            )}

            {/* Brands Section */}
            <View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, marginBottom: 12, letterSpacing: 1 }}>{t('brands').toUpperCase()}</Text>
              <View style={{ flexDirection: 'row', gap: 15 }}>
                {brands.map((brand: any) => (
                  <TouchableOpacity
                    key={brand.id}
                    style={{ alignItems: 'center' }}
                    onPress={() => {
                      setFilterBrand(brand.id);
                      onNavigate('Shop');
                    }}
                  >
                    <View style={[styles.modernCatCard, { backgroundColor: theme === 'dark' ? '#17171F' : '#FFF' }]}>
                      <Image source={{ uri: brand.image }} style={styles.catBgImage} resizeMode="cover" />
                    </View>
                    <Text numberOfLines={1} style={{ fontSize: 9, fontWeight: '800', marginTop: 8, color: colors.foreground, letterSpacing: 1 }}>{String(getName(brand.name)).toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Flash Sale Redesign */}
        {
          flashSale && (
            <View style={{ marginTop: 30 }}>
              <View style={[styles.sectionHeader, { marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                  <View>
                    <Text style={[styles.modernSectionTitle, { color: colors.foreground }]}>{t('flashSale')}</Text>
                    <View style={{ width: 25, height: 2, backgroundColor: colors.accent, marginTop: 4 }} />
                  </View>
                  <FlashSaleCountdown
                    endTime={flashSale.endTime}
                    onEnd={() => setFlashSale(null)}
                  />
                </View>
                <TouchableOpacity onPress={() => onNavigate('Shop')}>
                  <Text style={[styles.modernSectionLink, { color: colors.accent }]}>{t('seeAll')}</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
                {flashProducts.map((p: any) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onPress={() => onProductPress(p)}
                    isWishlisted={wishlist?.includes(p.id)}
                    onToggleWishlist={() => toggleWishlist(p.id)}
                    onAddToCart={() => addToCart(p)}
                    showRating={true}
                    theme={theme}
                    language={language}
                    t={t}
                  />
                ))}
              </ScrollView>
            </View>
          )
        }


        {/* Ads Section */}
        {
          ads.length > 0 && (
            <View style={styles.modernSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.modernSectionTitle, { color: colors.foreground }]}>{t('campaigns')}</Text>
                  <View style={{ width: 25, height: 2, backgroundColor: colors.accent, marginTop: 4 }} />
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
                {ads.map((ad: any) => (
                  <View key={ad.id} style={[styles.adCard, { borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#F2F2F7' }]}>
                    {ad.type === 'video' ? (
                      <Video
                        source={{ uri: ad.url }}
                        style={styles.adMedia}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isLooping
                        isMuted
                      />
                    ) : (
                      <Image source={{ uri: ad.url }} style={styles.adMedia} />
                    )}
                    <View style={styles.adContent}>
                      <Text style={styles.adTitle}>{getName(ad.title).toUpperCase()}</Text>
                      {ad.link || ad.targetId ? (
                        <TouchableOpacity style={styles.adBtn} onPress={() => onCampaignPress(ad)}>
                          <Text style={styles.adBtnText}>{t('discover')}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )
        }

        {/* Featured Products */}
        <View style={[styles.modernSection, { marginTop: 30 }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.modernSectionTitle, { color: colors.foreground }]}>{t('featured')}</Text>
              <View style={{ width: 25, height: 2, backgroundColor: colors.accent, marginTop: 4 }} />
            </View>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => onNavigate('Shop')}>
              <Text style={[styles.modernSectionLink, { color: colors.accent }]}>{t('refineGallery')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15, paddingBottom: 10 }}>
            {featured.map((p: any) => (
              <ProductCard
                key={p.id}
                product={p}
                onPress={() => onProductPress(p)}
                isWishlisted={wishlist?.includes(p.id)}
                onToggleWishlist={() => toggleWishlist(p.id)}
                onAddToCart={() => addToCart(p)}
                showRating={true}
                theme={theme}
                language={language}
                t={t}
              />
            ))}
          </ScrollView>
        </View>

        {/* Dynamic Promo Banners Carousel (last) */}
        {
          promoBanners.length > 0 && (
            <View style={{ height: 180, marginTop: 20 }}>
              <FlatList
                ref={promoRef}
                data={promoBanners}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id}
                onScrollToIndexFailed={() => { }}
                renderItem={({ item: banner }) => (
                  <View style={{ width: width }}>
                    <TouchableOpacity
                      style={[styles.promoBannerContainer, { backgroundColor: banner.backgroundColor || '#FF2D55', width: width - 40 }]}
                      activeOpacity={0.9}
                      onPress={() => onNavigate('Shop')}
                    >
                      <Image source={{ uri: banner.imageUrl }} style={styles.promoBannerImg} resizeMode="cover" />
                      <View style={styles.promoBannerContent}>
                        <Text style={styles.promoSmallText}>{String(banner.title || '').toUpperCase()}</Text>
                        <Text style={styles.promoMainText}>{String(banner.description || '').toUpperCase()}</Text>
                        <View style={styles.promoShopNowBtn}>
                          <Text style={[styles.promoBtnText, { color: banner.backgroundColor || '#FF2D55' }]}>{t('shop')}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )
        }

        {/* Community & Trust Section */}
        <View style={[styles.modernSection, { marginTop: 10, paddingBottom: 20 }]}>
          <Text style={[styles.modernSectionTitle, { textAlign: 'center', marginBottom: 20, letterSpacing: 2, color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>{t('ourSelection')}</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
            {featured.slice(0, 5).map((p: any) => (
              <ProductCard
                key={p.id}
                product={p}
                onPress={() => onProductPress(p)}
                isWishlisted={wishlist?.includes(p.id)}
                onToggleWishlist={() => toggleWishlist(p.id)}
                onAddToCart={() => addToCart(p)}
                showRating={true}
                theme={theme}
                language={language}
                t={t}
              />
            ))}
          </ScrollView>

          <View style={{ marginTop: 30, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10 }}>
            <TouchableOpacity onPress={() => onNavigate && onNavigate('ShippingPolicy')} style={{ alignItems: 'center', gap: 8 }}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={22} color={colors.foreground} strokeWidth={1.5} />
              </View>
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted }}>{t('freeShipping')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate && onNavigate('PaymentPolicy')} style={{ alignItems: 'center', gap: 8 }}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={22} color={colors.foreground} strokeWidth={1.5} />
              </View>
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted }}>{t('securePayment')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate && onNavigate('ReturnPolicy')} style={{ alignItems: 'center', gap: 8 }}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
                <RotateCcw size={22} color={colors.foreground} strokeWidth={1.5} />
              </View>
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted }}>{t('easyReturns')}</Text>
            </TouchableOpacity>
          </View>
        </View>

      </Animated.ScrollView >
    </View >
  );
}

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
  getInitials
}: any) {
  const insets = useSafeAreaInsets();

  const renderComment = (item: any, isReply = false) => (
    <View key={item.id} style={{ marginBottom: isReply ? 12 : 16, flexDirection: 'row', gap: 12 }}>
      <View style={{
        width: isReply ? 28 : 36,
        height: isReply ? 28 : 36,
        borderRadius: isReply ? 14 : 18,
        backgroundColor: colors.surface || (theme === 'dark' ? '#1A1A24' : '#F2F2F7'),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }}>
        {item.userAvatar ? (
          <Image source={{ uri: item.userAvatar }} style={{ width: isReply ? 28 : 36, height: isReply ? 28 : 36, borderRadius: isReply ? 14 : 18 }} />
        ) : (
          <Text style={{ color: colors.foreground, fontSize: isReply ? 10 : 12, fontWeight: '900' }}>{getInitials(item.userName)}</Text>
        )}
      </View>
      <View style={{
        flex: 1,
        backgroundColor: colors.surface || (theme === 'dark' ? '#1A1A24' : '#F2F2F7'),
        padding: 10,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 13 }}>{item.userName}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {(() => {
              const isCommentAuthor = item.userId === user?.uid;
              if (isCommentAuthor || isPostOwner) {
                return (
                  <TouchableOpacity
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={{
                      padding: 4,
                      borderRadius: 12,
                      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      marginRight: -4
                    }}
                    onPress={() => {
                      const options: any[] = [
                        { text: tr('Annuler', 'إلغاء', 'Cancel'), style: 'cancel' }
                      ];
                      if (isCommentAuthor) {
                        options.push({
                          text: tr('Modifier', 'تعديل', 'Edit'),
                          onPress: () => {
                            setEditingComment(item);
                            setCommentText(item.text);
                          }
                        });
                      }
                      options.push({
                        text: tr('Supprimer', 'حذف', 'Delete'),
                        style: 'destructive',
                        onPress: () => handleDeleteComment(item.id)
                      });
                      Alert.alert(tr('Options', 'خيارات', 'Options'), '', options);
                    }}
                  >
                    <MoreVertical size={18} color={colors.foreground} style={{ opacity: 0.9 }} />
                  </TouchableOpacity>
                );
              }
              return null;
            })()}
          </View>
        </View>
        <Text style={{ color: colors.foreground, fontSize: 13, marginTop: 4, lineHeight: 18 }}>{item.text}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <TouchableOpacity onPress={() => {
            setReplyingTo(item);
            setCommentText(`@${item.userName} `);
          }}>
            <Text style={{ color: '#A855F7', fontSize: 11, fontWeight: '900' }}>{tr('Répondre', 'رد', 'Reply')}</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {[
              { type: 'love', Icon: Heart, color: '#FF4D67' },
              { type: 'fire', Icon: Flame, color: '#FF8A00' },
              { type: 'haha', Icon: Laugh, color: '#FFD600' },
              { type: 'bad', Icon: ThumbsDown, color: '#94A3B8' },
              { type: 'ugly', Icon: Ghost, color: '#818CF8' },
              { type: 'interesting', Icon: Sparkles, color: '#A855F7' }
            ].map(reac => {
              const isSelected = item.userReactions?.[user?.uid] === reac.type;
              const count = item.reactions?.[reac.type] || 0;
              return (
                <TouchableOpacity
                  key={reac.type}
                  onPress={() => handleCommentReact(item, reac.type)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                >
                  <reac.Icon
                    size={14}
                    color={isSelected ? reac.color : (theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.3)')}
                    fill="transparent"
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  {count > 0 && (
                    <Text style={{ color: isSelected ? reac.color : colors.secondary, fontSize: 10, fontWeight: '800' }}>{count}</Text>
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
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={18} color={colors.foreground} />
          <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 15 }}>
            {tr('Commentaires', 'تعليقات', 'Comments')} ({comments.length})
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
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}
      >
        {loadingComments ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
        ) : (comments.length === 0 || !comments) ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <MessageSquare size={40} color={colors.foreground} style={{ opacity: 0.2, marginBottom: 12 }} />
            <Text style={{ color: colors.foreground, textAlign: 'center', fontSize: 13, opacity: 0.6, fontWeight: '800' }}>
              {tr('Soyez le premier à commenter', 'كن أول من يعلق', 'Be the first to comment')}
            </Text>
          </View>
        ) : (
          (() => {
            // Very inclusive filter to ensure all comments show up
            const topLevelComments = comments.filter((c: any) => !c.parentCommentId || c.parentCommentId === "root" || c.parentCommentId === "" || !comments.find((pc: any) => pc.id === c.parentCommentId));
            const displayComments = topLevelComments.length > 0 ? topLevelComments : comments;

            return displayComments.map((comment: any) => {
              const replies = comments.filter((r: any) => r.parentCommentId === comment.id);
              const isExpanded = expandedReplies.includes(comment.id);

              return (
                <View key={comment.id}>
                  {renderComment(comment)}
                  {replies.length > 0 && (
                    <View style={{ marginLeft: 48, marginBottom: 12 }}>
                      <TouchableOpacity
                        onPress={() => setExpandedReplies((prev: any) =>
                          prev.includes(comment.id) ? prev.filter((id: string) => id !== comment.id) : [...prev, comment.id]
                        )}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
                      >
                        <View style={{ height: 1, width: 20, backgroundColor: colors.foreground, opacity: 0.2 }} />
                        <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '900', opacity: 0.7 }}>
                          {isExpanded ? tr('Masquer les réponses', 'إخفاء الردود', 'Hide replies') : `${tr('Voir', 'عرض', 'View')} ${replies.length} ${tr('réponses', 'ردود', 'replies')}`}
                        </Text>
                      </TouchableOpacity>
                      {isExpanded && replies.map((reply: any) => renderComment(reply, true))}
                    </View>
                  )}
                </View>
              );
            });
          })()
        )}
      </ScrollView>

      {/* Input Section */}
      <View style={{
        paddingBottom: insets.bottom + 10,
        paddingTop: 10,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        backgroundColor: colors.background
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            flex: 1,
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            borderRadius: 25,
            paddingHorizontal: 16,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <TextInput
              placeholder={replyingTo ? `${tr('Répondre à', 'الرد على', 'Replying to')} ${replyingTo.userName}...` : tr('Ajouter un commentaire...', 'أضف تعليقًا...', 'Add a comment...')}
              placeholderTextColor={theme === 'dark' ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
              style={{ flex: 1, color: colors.foreground, fontSize: 14, fontWeight: '600', padding: 0 }}
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
              backgroundColor: commentText.trim() ? colors.accent : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Send size={18} color={commentText.trim() ? "#FFFFFF" : (theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#9CA3AF')} />
          </TouchableOpacity>
        </View>
        {editingComment && (
          <TouchableOpacity onPress={() => { setEditingComment(null); setCommentText(""); }} style={{ marginTop: 8, paddingLeft: 12 }}>
            <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700' }}>{tr('Annuler modification', 'إلغاء التعديل', 'Cancel edit')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function ProfileScreen({ user, onBack, onLogout, profileData, currentUserProfileData, updateProfile, onNavigate, socialLinks, t, language, setLanguage, theme, setTheme, followedCollabs, toggleFollowCollab, setSelectedCollab, setActiveTab, onStartLive, targetUid: targetUidProp, isPublicProfile, onShowBadge, onShowScanner, setActiveTrackingId }: any) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const isOwnProfile = !isPublicProfile && (user?.uid === profileData?.uid || user?.uid === profileData?.id || (profileData?.email && user?.email === profileData?.email));

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const displayName = profileData?.fullName || profileData?.displayName || 'USER';
  const scrollY = useRef(new Animated.Value(0)).current;

  const tr = (fr: string, ar: string, en: string) => {
    return language === 'ar' ? ar : (language === 'fr' ? fr : en);
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  const [brandStats, setBrandStats] = useState({ revenue: 0, orders: 0, completed: 0 });
  const [brandInfo, setBrandInfo] = useState<any>(null);
  const [isStatsVisible, setIsStatsVisible] = useState(false);
  const [followedList, setFollowedList] = useState<any[]>([]);
  const [showEmail, setShowEmail] = useState(false);
  const [liveChannels, setLiveChannels] = useState<string[]>([]);
  const [profileTab, setProfileTab] = useState(isOwnProfile ? 'Menu' : 'Works'); // Default to 'Works' for other users

  useEffect(() => {
    // Reset tab when switching between profiles
    setProfileTab(isOwnProfile ? 'Menu' : 'Works');
  }, [isOwnProfile, profileData?.uid, profileData?.id]);
  const [works, setWorks] = useState<any[]>([]);
  const [uploadingWork, setUploadingWork] = useState(false);
  const [selectedWork, setSelectedWork] = useState<any>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
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
  const [exchangeType, setExchangeType] = useState<'diamondsToCoins' | 'coinsToDiamonds'>('diamondsToCoins');
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [isProcessingExchange, setIsProcessingExchange] = useState(false);
  const [transferSearchQuery, setTransferSearchQuery] = useState('');
  const [transferSearchResults, setTransferSearchResults] = useState<any[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedTransferUser, setSelectedTransferUser] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  const handleConfirmQuickExchange = async () => {
    const amount = parseInt(exchangeAmount);
    if (!amount || amount <= 0) {
      Alert.alert(t('error'), tr('Veuillez entrer un montant valide', 'يرجى إدخال مبلغ صحيح', 'Please enter a valid amount'));
      return;
    }
    if (!user?.uid) return;
    setIsProcessingExchange(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User does not exist!";
        const data = userDoc.data();
        const wallet = data.wallet || { coins: 0, diamonds: 0 };
        if (exchangeType === 'diamondsToCoins') {
          if ((wallet.diamonds || 0) < amount) throw tr("Diamants insuffisants", "الألماس غير كافٍ", "Insufficient diamonds");
          transaction.update(userRef, {
            'wallet.diamonds': increment(-amount),
            'wallet.coins': increment(amount)
          });
        } else {
          const totalRequired = Math.ceil(amount * 1.3);
          if ((wallet.coins || 0) < totalRequired) throw tr("Pièces insuffisantes", "العملات غير كافية", "Insufficient coins");
          transaction.update(userRef, {
            'wallet.coins': increment(-totalRequired),
            'wallet.diamonds': increment(amount)
          });
        }
        const transactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
        transaction.set(transactionRef, {
          type: 'exchange',
          exchangeType,
          amount,
          description: exchangeType === 'diamondsToCoins' ? 'Diamonds to Coins' : 'Coins to Diamonds',
          timestamp: serverTimestamp(),
          status: 'completed'
        });
      });
      Alert.alert(t('successTitle'), tr('Échange réussi !', 'تم التبادل بنجاح!', 'Exchange successful!'));
      setShowQuickExchange(false);
      setExchangeAmount('');
    } catch (err: any) {
      Alert.alert(t('error'), err.toString());
    } finally { setIsProcessingExchange(false); }
  };

  const handleSearchUsers = async (q: string) => {
    setTransferSearchQuery(q);
    if (q.length < 3) { setTransferSearchResults([]); return; }
    setIsSearchingUsers(true);
    try {
      const usersRef = collection(db, 'users');
      const qSnap = await getDocs(query(usersRef, where('fullName', '>=', q), where('fullName', '<=', q + '\uf8ff'), limit(20)));
      setTransferSearchResults(qSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== user?.uid));
    } catch (e) { console.error(e); } finally { setIsSearchingUsers(false); }
  };

  const handleQuickTransfer = async () => {
    const amount = parseInt(transferAmount);
    if (!amount || amount <= 0 || !selectedTransferUser) return;
    setIsProcessingExchange(true);
    try {
      const senderRef = doc(db, 'users', user.uid);
      const receiverRef = doc(db, 'users', selectedTransferUser.id);
      await runTransaction(db, async (transaction) => {
        const senderDoc = await transaction.get(senderRef);
        if (((senderDoc.data()?.wallet?.diamonds || 0)) < amount) throw "Insufficient diamonds";
        transaction.update(senderRef, { 'wallet.diamonds': increment(-amount) });
        transaction.update(receiverRef, { 'wallet.diamonds': increment(amount) });
        const sTrans = doc(collection(db, 'users', user.uid, 'transactions'));
        transaction.set(sTrans, { type: 'transfer_out', recipientId: selectedTransferUser.id, recipientName: selectedTransferUser.fullName, amount, timestamp: serverTimestamp(), status: 'completed' });
        const rTrans = doc(collection(db, 'users', selectedTransferUser.id, 'transactions'));
        transaction.set(rTrans, { type: 'transfer_in', senderId: user.uid, senderName: currentUserProfileData?.fullName || user.displayName, amount, timestamp: serverTimestamp(), status: 'completed' });
      });
      Alert.alert("Success", "Transfer completed");
      setShowTransferModal(false);
      setSelectedTransferUser(null);
      setTransferAmount('');
    } catch (e: any) { Alert.alert("Error", e.toString()); } finally { setIsProcessingExchange(false); }
  };

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'direct_chats'),
      where('participants', 'array-contains', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(doc => {
        count += (doc.data()[`unreadCount_${user.uid}`] || 0);
      });
      setTotalUnread(count);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleReact = async (work: any, type: string) => {
    if (!user) {
      Alert.alert(t('loginRequired'), t('pleaseLoginToReact'));
      return;
    }

    const { id: workId, userId: authorId, userReactions = {}, reactions = {} } = work;
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
        newReactions[currentReaction] = Math.max(0, (newReactions[currentReaction] || 0) - 1);
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
    setWorks(prev => prev.map(w => w.id === workId ? updatedWork : w));

    // Firestore Update
    try {
      const workRef = work.fullPath
        ? doc(db, work.fullPath)
        : doc(db, 'users', authorId, 'works', workId);
      const updates: any = {};
      if (currentReaction === type) {
        updates[`reactions.${type}`] = increment(-1);
        updates[`userReactions.${user.uid}`] = deleteField();
      } else {
        updates[`reactions.${type}`] = increment(1);
        updates[`userReactions.${user.uid}`] = type;
        if (currentReaction) updates[`reactions.${currentReaction}`] = increment(-1);
      }
      await updateDoc(workRef, updates);
    } catch (e) {
      console.error('Reaction Failed', e);
      // Could revert here if needed
    }
  };
  const handleCommentReact = async (comment: any, type: string = 'love') => {
    if (!user || !selectedWork) return;
    const effectiveTargetUid = selectedWork.userId || targetUidProp || profileData?.uid || profileData?.id || (isOwnProfile ? user?.uid : null);
    if (!effectiveTargetUid) return;

    const commentRef = doc(db, 'users', effectiveTargetUid, 'works', selectedWork.id, 'comments', comment.id);

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
          currentReactions[type] = Math.max(0, (currentReactions[type] || 0) - 1);
        } else {
          if (prevType) {
            currentReactions[prevType] = Math.max(0, (currentReactions[prevType] || 0) - 1);
          }
          userReactions[user.uid] = type;
          currentReactions[type] = (currentReactions[type] || 0) + 1;
        }

        transaction.update(commentRef, {
          reactions: currentReactions,
          userReactions: userReactions
        });
      });
    } catch (e) {
      console.error('Comment Reaction Error', e);
    }
  };

  useEffect(() => {
    if (selectedWork) {
      const ownerUid = selectedWork.userId || selectedWork.ownerUid || targetUidProp || profileData?.uid || profileData?.id || (isOwnProfile ? user?.uid : null);
      if (!ownerUid) return;

      setLoadingComments(true);
      const q = query(
        collection(db, 'users', ownerUid, 'works', selectedWork.id, 'comments'),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingComments(false);
      });

      return () => unsubscribe();
    }
  }, [selectedWork, targetUidProp, profileData?.uid, profileData?.id, isOwnProfile, user?.uid]);

  useEffect(() => {
    if (!user?.uid || !isOwnProfile) return;
    const q = query(collection(db, 'users', user.uid, 'friendRequests'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFriendRequestCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [user?.uid, isOwnProfile]);

  const handleComment = async () => {
    if (!user || !commentText.trim() || !selectedWork) return;

    const effectiveTargetUid = selectedWork.userId || targetUidProp || profileData?.uid || profileData?.id || (isOwnProfile ? user?.uid : null);
    if (!effectiveTargetUid) return;

    const commentData = {
      text: commentText.trim(),
      userId: user.uid,
      userName: currentUserProfileData?.fullName || user.displayName || 'User',
      userAvatar: currentUserProfileData?.avatarUrl || null,
      createdAt: serverTimestamp(),
      replyToId: replyingTo?.id || null,
      replyToUser: replyingTo?.userName || null,
      parentCommentId: replyingTo ? (replyingTo.parentCommentId || replyingTo.id) : null,
      reactions: {},
      userReactions: {},
    };

    try {
      if (editingComment) {
        await updateDoc(doc(db, 'users', effectiveTargetUid, 'works', selectedWork.id, 'comments', editingComment.id), {
          text: commentText.trim(),
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'users', effectiveTargetUid, 'works', selectedWork.id, 'comments'), commentData);
        await updateDoc(doc(db, 'users', effectiveTargetUid, 'works', selectedWork.id), {
          commentsCount: increment(1)
        });
      }
      setCommentText("");
      setReplyingTo(null);
      setEditingComment(null);
    } catch (e) {
      console.error('Comment Error', e);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedWork) return;
    const effectiveTargetUid = selectedWork.userId || targetUidProp || profileData?.uid || profileData?.id || (isOwnProfile ? user?.uid : null);
    if (!effectiveTargetUid) return;

    try {
      await deleteDoc(doc(db, 'users', effectiveTargetUid, 'works', selectedWork.id, 'comments', commentId));
      await updateDoc(doc(db, 'users', effectiveTargetUid, 'works', selectedWork.id), {
        commentsCount: increment(-1)
      });
    } catch (e) {
      console.error('Delete Comment Error', e);
    }
  };

  const handleRepost = async (work: any) => {
    if (!user) return;
    Alert.alert(
      tr('Republier', 'إعادة نشر', 'Repost'),
      tr('Voulez-vous republier ce travail sur votre profil ?', 'هل تريد إعادة نشر هذا العمل على ملفك الشخصي؟', 'Do you want to repost this work to your profile?'),
      [
        { text: tr('Annuler', 'إلغاء', 'Cancel'), style: 'cancel' },
        {
          text: tr('Republier', 'إعادة نشر', 'Repost'),
          onPress: async () => {
            try {
              await addDoc(collection(db, 'users', user.uid, 'works'), {
                ...work,
                repostedFrom: profileData?.uid || profileData?.id || user.uid,
                repostedFromName: profileData?.fullName || 'User',
                createdAt: serverTimestamp(),
                reactions: {},
                userReactions: {},
                commentsCount: 0
              });
              Alert.alert(t('successTitle'), tr('Republié avec succès', 'تمت إعادة النشر بنجاح', 'Reposted successfully'));
            } catch (e) {
              console.error('Repost Error', e);
            }
          }
        }
      ]
    );
  };

  const handleShare = async (work: any) => {
    try {
      const url = work.url || work.imageUrl || work.mediaUrl;
      if (!url) return;

      // Download file first to share "cleanly"
      const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
      const fileUri = FileSystem.cacheDirectory + `share_${work.id}.${extension}`;

      const { uri } = await FileSystem.downloadAsync(url, fileUri);

      await Share.share({
        message: `${work.text || 'Check this out!'} \nShared via Tama App`,
        url: uri, // Sharing local URI shares the file
      });
    } catch (e) {
      console.error('Share Error', e);
      // Fallback to URL sharing
      await Share.share({
        message: `Check out this work on Tama Clothing! ${work.url}`,
        url: work.url,
      });
    }
  };

  const handleDownload = async (work: any) => {
    if (!work) return;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('permissionRefused'), t('camerarollPermissionRequired'));
      return;
    }

    try {
      const url = work.url || work.imageUrl || work.mediaUrl;
      const fileUri = FileSystem.cacheDirectory + (work.type === 'video' ? 'download.mp4' : 'download.jpg');
      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('TamaClothing', asset, false);
      Alert.alert(t('successTitle'), tr('Enregistré dans la galerie', 'تم الحفظ في المعرض', 'Saved to gallery'));
    } catch (e) {
      console.error('Download Error', e);
      Alert.alert(t('error'), tr('Échec du téléchargement', 'فشل التحميل', 'Download failed'));
    }
  };

  const getTotalStats = (work: any) => {
    if (!work) return 0;
    const totalReactions = work.reactions ? Object.values(work.reactions).reduce((a: any, b: any) => a + b, 0) : 0;
    const commentsCount = work.commentsCount || 0;
    return (totalReactions as number) + commentsCount;
  };

  const isViral = (work: any) => {
    if (!work) return false;
    return getTotalStats(work) >= 100;
  };




  const isBrandOwner = profileData?.role === 'brand_owner' || (profileData?.role === 'admin' && profileData?.brandId);

  useEffect(() => {
    if (isBrandOwner && profileData?.brandId) {
      fetchBrandStats();
      fetchBrandInfo();
    }
  }, [profileData]);

  useEffect(() => {
    // Use profileData for works, or fallback to targetUidProp, or user's own uid for own profile
    const effectiveTargetUid = profileData?.uid || profileData?.id || targetUidProp || (isOwnProfile ? user?.uid : null);
    if (!effectiveTargetUid) return;

    const q = query(collection(db, 'users', effectiveTargetUid, 'works'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const rawWorks = snap.docs.map(d => ({ ...d.data(), id: d.id, userId: effectiveTargetUid }));
      const uniqueWorks = rawWorks.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
      setWorks(uniqueWorks);
    }, (err) => {
      console.error('Error listening to works', err);
    });

    return () => unsubscribe();
  }, [profileData, isOwnProfile, user?.uid, targetUidProp]);

  useEffect(() => {
    if (selectedWork) {
      const updated = works.find(w => w.id === selectedWork.id);
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
        const isVid = asset.type === 'video';
        const url = await uploadImageToCloudinary(asset.uri);

        await addDoc(collection(db, 'users', user.uid, 'works'), {
          type: isVid ? 'video' : 'image',
          url,
          createdAt: serverTimestamp(),
          commentsCount: 0,
          reactions: {},
          userReactions: {}
        });

        Alert.alert(
          tr('SUCCÈS', 'نجاح', 'SUCCESS'),
          tr('Téléchargement réussi !', 'تم التحميل بنجاح!', 'Upload completed successfully!')
        );
      }
    } catch (e) {
      console.error('Upload Error', e);
      Alert.alert(t('error'), t('uploadFailed') || 'Upload failed');
    } finally {
      setUploadingWork(false);
    }
  };

  useEffect(() => {
    fetchFollowedCollabs();

    // Subscribe to live sessions
    const { LiveSessionService } = require('./src/services/LiveSessionService');
    const unsubscribe = LiveSessionService.subscribeToAllSessions((sessions: any[]) => {
      const active = sessions.filter((s: any) => s.status === 'live');
      const liveIds = active.flatMap((s: any) => [s.brandId, s.collabId, s.channelId]).filter(Boolean);
      setLiveChannels(liveIds);
    });

    return () => unsubscribe();
  }, [followedCollabs]);

  const fetchFollowedCollabs = async () => {
    if (!followedCollabs || followedCollabs.length === 0) {
      setFollowedList([]);
      return;
    }
    try {
      // Chunking for Firestore 'in' query if needed, but assuming small list for now
      const q = query(collection(db, 'collaborations'), where('__name__', 'in', followedCollabs));
      const snap = await getDocs(q);
      setFollowedList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const fetchBrandInfo = async () => {
    try {
      const brandId = profileData.brandId;
      const brandSnap = await getDoc(doc(db, 'brands', brandId));
      if (brandSnap.exists()) {
        const data = brandSnap.data();

        // Find matching collaboration to get the 'type'
        const collabQuery = query(collection(db, 'collaborations'), where('brandId', '==', brandId), limit(1));
        const collabSnap = await getDocs(collabQuery);

        if (!collabSnap.empty) {
          data.type = collabSnap.docs[0].data().type;
        } else {
          // Fallback to 'Brand' for brand owners if no collab doc found
          data.type = 'Brand';
        }

        setBrandInfo(data);
      }
    } catch (e) {
      console.error('Error fetching brand info', e);
    }
  };

  const fetchBrandStats = async () => {
    try {
      // Fetch orders to calculate brand stats
      // Note: In a real app, this should be a backend function or optimized query
      const snap = await getDocs(collection(db, 'orders'));
      const allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const myBrandId = profileData.brandId;
      const brandOrders = allOrders.filter((o: any) => o.items && o.items.some((i: any) => i.brandId === myBrandId));

      const totalRevenue = brandOrders.reduce((sum, o: any) => {
        const orderRevenue = o.items
          .filter((i: any) => i.brandId === myBrandId)
          .reduce((s: number, i: any) => s + ((parseFloat(i.price) || 0) * (i.quantity || 1)), 0);
        return sum + orderRevenue;
      }, 0);

      const completed = brandOrders.filter((o: any) => o.status === 'delivered').length;

      setBrandStats({
        revenue: totalRevenue,
        orders: brandOrders.length,
        completed
      });
    } catch (e) {
      console.error('Error fetching brand stats', e);
    }
  };

  const handleToggleStats = async () => {
    if (isStatsVisible) {
      setIsStatsVisible(false);
      return;
    }

    // Safety check for native module availability (prevention for EAS updates on old builds)
    if (!LocalAuthentication || !LocalAuthentication.hasHardwareAsync) {
      console.warn('LocalAuthentication native module not found. Falling back to simple toggle.');
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
        promptMessage: t('authRequired') || 'Authentication Required',
        fallbackLabel: t('usePasscode') || 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsStatsVisible(true);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      // Fallback to simple toggle if authentication fails unexpectedly
      setIsStatsVisible(true);
    }
  };
  const getBadgeColor = () => {
    if (!brandInfo) return '#22C55E';
    if (brandInfo.type === 'Brand') return '#FFD700';
    if (brandInfo.type === 'Person') return '#A855F7';
    if (brandInfo.type === 'Company') return '#3B82F6';
    return '#22C55E';
  };

  const badgeColor = getBadgeColor();

  // Show loading if no profile data
  if (!profileData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <TouchableOpacity
          style={{ position: 'absolute', top: insets.top + 10, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
          onPress={onBack}
        >
          <ChevronLeft size={24} color={colors.foreground} strokeWidth={2.5} />
        </TouchableOpacity>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ marginTop: 16, color: colors.textMuted, fontWeight: '600' }}>{tr('Chargement...', 'جاري التحميل...', 'Loading...')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky Animated Blur Header */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 60 + insets.top,
        paddingTop: insets.top,
        borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '66' }]} />
        </Animated.View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 }}>
          <TouchableOpacity
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
            onPress={onBack}
          >
            <ChevronLeft size={24} color={colors.foreground} strokeWidth={2.5} />
          </TouchableOpacity>

          <AnimatedAppText
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.modernLogo, { flex: 1, position: 'relative', left: 0, right: 0, marginHorizontal: 10, textAlign: 'left', opacity: headerOpacity, color: colors.foreground, fontSize: 16 }]}
          >
            {displayName.toUpperCase()}
          </AnimatedAppText>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
              onPress={onShowScanner}
            >
              <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Scan size={24} color={colors.foreground} strokeWidth={2} />
                <View style={{ position: 'absolute' }}>
                  <QrCode size={11} color={colors.foreground} strokeWidth={2.5} />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
              onPress={onShowBadge}
            >
              <QrCode size={20} color={colors.foreground} strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
              onPress={() => onNavigate('Settings')}
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
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        stickyHeaderIndices={[2]}
      >
        <View style={{ height: height * 0.55, width: '100%' }}>
          {profileData?.avatarUrl ? (
            <Image source={{ uri: profileData.avatarUrl }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 80, fontWeight: '900', color: theme === 'dark' ? '#333' : '#CCC', letterSpacing: 4 }}>{getInitials(displayName)}</Text>
            </View>
          )}

          {/* Badge Overlay - Center of Image */}
          {isBrandOwner && (
            <View style={{ position: 'absolute', top: '25%', left: 0, right: 0, alignItems: 'center', transform: [{ translateY: -15 }] }}>
              <View style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', marginBottom: 25 }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: theme === 'dark' ? '#FFF' : '#000', letterSpacing: 1 }}>
                  {t('brandOwner').toUpperCase()}
                </Text>
              </View>

              {/* Brand Logo and Name Section */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
                paddingHorizontal: 15,
                paddingVertical: 10,
                borderRadius: 35, // Fully rounded pill shape
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.25)',
                gap: 12,
                marginTop: 5 // Add some space from the badge above
              }}>
                {brandInfo && (brandInfo.logo || brandInfo.image || brandInfo.logoUrl) ? (
                  <Image source={{ uri: getName(brandInfo.logo || brandInfo.image || brandInfo.logoUrl) }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag size={20} color={theme === 'dark' ? '#FFF' : '#000'} />
                  </View>
                )}
                <View>
                  <Text style={{ color: theme === 'dark' ? '#FFF' : '#000', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 }}>{getName(brandInfo?.name, 'TAMA BRAND').toUpperCase()}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: theme === 'dark' ? '#FFF' : '#000', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>{t('officialPartner').toUpperCase()}</Text>
                    <CheckCircle2 size={10} color={badgeColor} />
                  </View>

                </View>
              </View>
            </View>
          )}

          {/* Stats Cards Overlay - Bottom of Image */}
          {isOwnProfile && isBrandOwner && (
            <View style={{ position: 'absolute', bottom: 130, left: 0, right: 0, paddingHorizontal: 10 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 }}>
                    <Package size={12} color={theme === 'dark' ? '#FFF' : '#000'} strokeWidth={2} />
                    <Text style={{ fontSize: 8, fontWeight: '800', color: theme === 'dark' ? '#FFF' : '#000', letterSpacing: 0.2 }}>{t('orders').toUpperCase()}</Text>
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: theme === 'dark' ? '#FFF' : '#000' }}>
                    {isStatsVisible ? brandStats.orders : '****'}
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 }}>
                    <TrendingUp size={12} color={theme === 'dark' ? '#FFF' : '#000'} strokeWidth={2} />
                    <Text style={{ fontSize: 8, fontWeight: '800', color: theme === 'dark' ? '#FFF' : '#000', letterSpacing: 0.2 }}>{t('revenue').toUpperCase()}</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: theme === 'dark' ? '#FFF' : '#000' }}>
                    {isStatsVisible ? brandStats.revenue.toFixed(0) : '****'}
                  </Text>
                  {isStatsVisible && <Text style={{ fontSize: 10, fontWeight: '700', color: theme === 'dark' ? '#FFF' : '#000', marginTop: 1 }}>TND</Text>}
                </View>
                <View style={{ flex: 1, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 }}>
                    <CheckCircle2 size={12} color='#34C759' strokeWidth={2} />
                    <Text style={{ fontSize: 8, fontWeight: '800', color: theme === 'dark' ? '#FFF' : '#000', letterSpacing: 0.2 }}>{t('completed').toUpperCase()}</Text>
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#34C759' }}>
                    {isStatsVisible ? brandStats.completed : '****'}
                  </Text>
                </View>
              </View>

              {/* Platform specific Auth icon bottom corner */}
              <TouchableOpacity
                onPress={handleToggleStats}
                style={{ position: 'absolute', bottom: -80, right: 20 }}
              >
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isStatsVisible ? '#34C759' : 'rgba(255,255,255,0.2)',
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}>
                  {isStatsVisible ? (
                    <EyeOff size={26} color={theme === 'dark' ? '#FFF' : '#000'} />
                  ) : (
                    Platform.OS === 'ios' ? (
                      <ScanFace size={26} color={theme === 'dark' ? '#FFF' : '#000'} />
                    ) : (
                      <Fingerprint size={26} color={theme === 'dark' ? '#FFF' : '#000'} />
                    )
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Profile Info Section (Child Index 1) */}
        <Animatable.View animation="fadeInUp" duration={800} style={[styles.campaignContent, { marginTop: -40, borderTopLeftRadius: 40, borderTopRightRadius: 40, backgroundColor: colors.background, paddingTop: 40, paddingBottom: 0, minHeight: 0 }]}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Text style={[styles.campaignTitle, { color: colors.foreground }]}>{displayName.toUpperCase()}</Text>
              {profileData?.kycStatus === 'approved' && (
                <ShieldCheck style={{ marginBottom: 20 }} size={20} color="#34C759" fill={theme === 'dark' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.1)'} strokeWidth={2.5} />
              )}
            </View>
            {isOwnProfile && (
              <TouchableOpacity onPress={() => setShowEmail(!showEmail)}>
                <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '500', letterSpacing: 0.5 }}>
                  {showEmail ? user?.email : '••••••••@••••.•••'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animatable.View>

        {/* Sticky Tab Switcher (Child Index 2) */}
        <View style={{ backgroundColor: colors.background }}>
          <View style={{
            flexDirection: 'row',
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            borderRadius: 16,
            padding: 4,
            marginTop: 10,
            marginHorizontal: 15,
            marginBottom: 10
          }}>
            {isOwnProfile && (
              <TouchableOpacity
                onPress={() => setProfileTab('Menu')}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: profileTab === 'Menu' ? (theme === 'dark' ? '#FFF' : '#000') : 'transparent'
                }}
              >
                <LayoutGrid size={16} color={profileTab === 'Menu' ? (theme === 'dark' ? '#000' : '#FFF') : colors.textMuted} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: profileTab === 'Menu' ? (theme === 'dark' ? '#000' : '#FFF') : colors.textMuted,
                  letterSpacing: 0.5
                }}>
                  {tr('MENU', 'القائمة', 'MENU')}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setProfileTab('Works')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: profileTab === 'Works' ? (theme === 'dark' ? '#FFF' : '#000') : 'transparent'
              }}
            >
              <Camera size={16} color={profileTab === 'Works' ? (theme === 'dark' ? '#000' : '#FFF') : colors.textMuted} />
              <Text style={{
                fontSize: 12,
                fontWeight: '800',
                color: profileTab === 'Works' ? (theme === 'dark' ? '#000' : '#FFF') : colors.textMuted,
                letterSpacing: 0.5
              }}>
                {t('works').toUpperCase()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('Messages')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: profileTab === 'Messages' ? (theme === 'dark' ? '#FFF' : '#000') : 'transparent'
              }}
            >
              <MessageCircle size={16} color={profileTab === 'Messages' ? (theme === 'dark' ? '#000' : '#FFF') : colors.textMuted} />
              <Text style={{
                fontSize: 12,
                fontWeight: '800',
                color: profileTab === 'Messages' ? (theme === 'dark' ? '#000' : '#FFF') : colors.textMuted,
                letterSpacing: 0.5
              }}>
                {tr('MESSAGES', 'الرسائل', 'MESSAGES')}
              </Text>
              {isOwnProfile && totalUnread > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -5,
                  right: 5,
                  backgroundColor: '#EF4444',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: theme === 'dark' ? '#000' : '#FFF',
                  paddingHorizontal: 4
                }}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Content Section (Child Index 3) */}
        <Animatable.View animation="fadeInUp" duration={800} delay={200} style={{ paddingHorizontal: 15 }}>

          {profileTab === 'Menu' && isOwnProfile && (
            <View>
              {/* Wallet Hero Card */}
              <View style={{ marginBottom: 25, marginTop: 10 }}>
                <LinearGradient
                  colors={theme === 'dark' ? ['#1A1A24', '#0D0D14'] : ['#FFFFFF', '#F9F9FB']}
                  style={{ borderRadius: 28, padding: 24, borderWidth: 1, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                    <View>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: colors.textMuted, letterSpacing: 1.5, marginBottom: 8 }}>{tr('SOLDE DU PORTEFEUILLE', 'رصيد المحفظة', 'WALLET BALANCE').toUpperCase()}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 32, fontWeight: '900', color: colors.foreground }}>{((profileData?.wallet?.coins || 0) + (profileData?.wallet?.diamonds || 0)).toLocaleString()}</Text>
                        <Sparkles size={20} color="#F59E0B" style={{ marginLeft: 12 }} />
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setActiveTab('Wallet')}
                      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                    >
                      <Wallet size={22} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.05)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.15)' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Coins size={18} color="#F59E0B" fill="#F59E0B" />
                        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.foreground }}>{profileData?.wallet?.coins || 0}</Text>
                      </View>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 }}>{tr('PIÈCES', 'عملات', 'COINS')}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.15)' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Gem size={18} color="#8B5CF6" fill="#8B5CF6" />
                        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.foreground }}>{profileData?.wallet?.diamonds || 0}</Text>
                      </View>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 }}>{tr('DIAMANTS', 'ألماس', 'DIAMONDS')}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => setShowQuickExchange(true)}
                      style={{ flex: 1, height: 50, borderRadius: 16, backgroundColor: colors.foreground, alignItems: 'center', justifyContent: 'center', shadowColor: colors.foreground, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
                    >
                      <Text style={{ color: theme === 'dark' ? '#000' : '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 }}>{tr('ÉCHANGER', 'تبادل', 'EXCHANGE')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowTransferModal(true)}
                      style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
                    >
                      <Send size={20} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>

              {followedList.length > 0 && (
                <View style={{ marginTop: 10, marginBottom: 25 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 5, marginBottom: 15 }}>
                    <Text style={[styles.menuSectionLabel, { color: colors.textMuted, marginBottom: 0 }]}>{t('follow').toUpperCase()}</Text>
                    <TouchableOpacity onPress={() => setActiveTab('FollowManagement')}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: colors.accent, letterSpacing: 0.5 }}>{t('viewAll').toUpperCase()}</Text>
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
                          setActiveTab('CollabDetail');
                        }}
                        style={{ alignItems: 'center', width: 70 }}
                      >
                        <View style={{ position: 'relative' }}>
                          <Animatable.View
                            animation={(liveChannels.includes(item.id) || (item.brandId && liveChannels.includes(item.brandId))) ? "pulse" : undefined}
                            iterationCount="infinite"
                            style={{
                              width: 58,
                              height: 58,
                              borderRadius: 29,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 2,
                              borderColor: (liveChannels.includes(item.id) || (item.brandId && liveChannels.includes(item.brandId))) ? '#EF4444' : 'transparent'
                            }}
                          >
                            <Image
                              source={item.imageUrl ? { uri: item.imageUrl } : APP_ICON}
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: 25,
                                backgroundColor: colors.border,
                                borderWidth: 1.5,
                                borderColor: colors.background
                              }}
                            />
                          </Animatable.View>
                          {(liveChannels.includes(item.id) || (item.brandId && liveChannels.includes(item.brandId))) && (
                            <Animatable.View
                              animation="bounceIn"
                              style={{
                                position: 'absolute',
                                bottom: -4,
                                alignSelf: 'center',
                                backgroundColor: '#EF4444',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                                borderWidth: 1.5,
                                borderColor: colors.background,
                                shadowColor: '#EF4444',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                elevation: 4,
                                zIndex: 10
                              }}
                            >
                              <Text style={{ fontSize: 7, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 }}>{t('enDirect') || 'EN DIRECT'}</Text>
                            </Animatable.View>
                          )}
                          <View style={{
                            position: 'absolute',
                            top: -2,
                            right: 2,
                            backgroundColor: item.type === 'Brand' ? '#FFD700' : item.type === 'Person' ? '#A855F7' : item.type === 'Company' ? '#3B82F6' : '#22C55E',
                            borderRadius: 10,
                            width: 18,
                            height: 18,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 2,
                            borderColor: colors.background
                          }}>
                            <CheckCircle2 size={10} color={theme === 'dark' ? '#000' : '#FFF'} />
                          </View>
                        </View>
                        <Text numberOfLines={1} style={{ fontSize: 9, fontWeight: '800', color: colors.foreground, marginTop: 8, textAlign: 'center' }}>
                          {getName(item.name)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={[styles.campaignDivider, { marginTop: 10, marginBottom: 25, backgroundColor: colors.border, height: 1, width: '100%' }]} />

              {/* Start Live Floating Card - Premium UI */}
              {['admin', 'brand_owner', 'editor', 'nor_kam', 'support'].includes(profileData?.role || '') && (
                <TouchableOpacity
                  onPress={() => onStartLive && onStartLive(profileData?.brandId ? brandInfo : undefined)}
                  activeOpacity={0.9}
                  style={{
                    marginHorizontal: 0,
                    marginTop: 0,
                    marginBottom: 35,
                    borderRadius: 24,
                    overflow: 'hidden',
                    elevation: 10,
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 15,
                  }}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626', '#B91C1C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      padding: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                      <View style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.3)'
                      }}>
                        <Camera size={22} color="#FFF" strokeWidth={2.5} />
                      </View>
                      <View>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 2 }}>
                          {t('broadcastCenter')}
                        </Text>
                        <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 }}>
                          {t('startLiveSession')}
                        </Text>
                      </View>
                    </View>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: 'rgba(0,0,0,0.15)',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ChevronRight size={18} color="#FFF" strokeWidth={3} />
                    </View>

                    {/* Subtle Decorative Glow */}
                    <View style={{
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    }} />
                  </LinearGradient>
                </TouchableOpacity>
              )}


              <View style={{ gap: 8 }}>
                {profileData?.role !== 'driver' && (
                  <>
                    <Text style={[styles.menuSectionLabel, { marginBottom: 15, marginLeft: 5, color: colors.textMuted }]}>{t('myStudio')}</Text>
                    {['admin', 'support', 'brand_owner'].includes(profileData?.role) && (
                      <TouchableOpacity style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]} onPress={() => setActiveTab('AdminDashboard')}>
                        <View style={styles.menuRowLeft}>
                          <View style={[styles.iconCircle, { backgroundColor: '#5856D6' }]}>
                            <LayoutDashboard size={20} color="#FFF" />
                          </View>
                          <Text style={[styles.menuRowText, { color: colors.foreground, fontWeight: '800' }]}>{t('dashboard') ? t('dashboard').toUpperCase() : tr('TABLEAU DE BORD', 'لوحة القيادة', 'DASHBOARD')}</Text>
                        </View>
                        <ChevronRight size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]} onPress={() => setActiveTab('Orders')}>
                      <View style={styles.menuRowLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}>
                          <Package size={20} color={colors.foreground} strokeWidth={2} />
                        </View>
                        <Text style={[styles.menuRowText, { color: colors.foreground }]}>{t('myOrders')}</Text>
                      </View>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]}
                      onPress={() => {
                        Alert.prompt(
                          t('trackShipment'),
                          t('enterTrackingId'),
                          [
                            { text: t('cancel'), style: "cancel" },
                            {
                              text: t('track'),
                              onPress: (id?: string) => {
                                if (id) {
                                  setActiveTrackingId(id);
                                  setActiveTab('ShipmentTracking');
                                }
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <View style={styles.menuRowLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}>
                          <Truck size={20} color={colors.foreground} strokeWidth={2} />
                        </View>
                        <Text style={[styles.menuRowText, { color: colors.foreground }]}>{t('trackShipment')}</Text>
                      </View>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </>
                )}

                {profileData?.role === 'driver' && (
                  <TouchableOpacity style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]} onPress={() => setActiveTab('DriverDashboard')}>
                    <View style={styles.menuRowLeft}>
                      <View style={[styles.iconCircle, { backgroundColor: '#3B82F6' }]}>
                        <Truck size={20} color="#FFF" />
                      </View>
                      <Text style={[styles.menuRowText, { color: colors.foreground, fontWeight: '800' }]}>{language === 'ar' ? 'لوحة السائق' : 'DRIVER DASHBOARD'}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}

                {(profileData?.role === 'brand_owner' || profileData?.role === 'admin') && (
                  <TouchableOpacity style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]} onPress={() => setActiveTab('ShipmentCreation')}>
                    <View style={styles.menuRowLeft}>
                      <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}>
                        <Package size={20} color="#10B981" />
                      </View>
                      <Text style={[styles.menuRowText, { color: colors.foreground }]}>{language === 'ar' ? 'إنشاء شحنة جديدة' : 'Create New Shipment'}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}

                {(profileData?.role === 'brand_owner' || profileData?.role === 'admin') && profileData?.brandId && (
                  <TouchableOpacity
                    style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]}
                    onPress={() => setActiveTab('LiveAnalytics')}
                  >
                    <View style={styles.menuRowLeft}>
                      <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}>
                        <TrendingUp size={20} color={colors.foreground} strokeWidth={2} />
                      </View>
                      <Text style={[styles.menuRowText, { color: colors.foreground }]}>
                        {t('liveAnalytics')}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}

                {profileData?.role !== 'driver' && (
                  <TouchableOpacity style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]} onPress={() => onNavigate('Wishlist')}>
                    <View style={styles.menuRowLeft}>
                      <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}><Heart size={20} color={colors.foreground} strokeWidth={2} /></View>
                      <Text style={[styles.menuRowText, { color: colors.foreground }]}>{t('savedItems')}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}

                {profileData?.role !== 'driver' && (
                  <>
                    <Text style={[styles.menuSectionLabel, { marginTop: 30, marginBottom: 15, marginLeft: 5, color: colors.textMuted }]}>
                      {tr('CONNEXIONS', 'علاقات', 'CONNECTIONS')}
                    </Text>

                    <TouchableOpacity
                      style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]}
                      onPress={() => setActiveTab('Messages')}
                    >
                      <View style={styles.menuRowLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}>
                          <MessageCircle size={20} color={colors.foreground} strokeWidth={2} />
                        </View>
                        <Text style={[styles.menuRowText, { color: colors.foreground }]}>
                          {tr('Messages', 'الرسائل', 'Messages')}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {totalUnread > 0 && (
                          <View style={{ backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
                          </View>
                        )}
                        <ChevronRight size={18} color={colors.textMuted} />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]}
                      onPress={() => onNavigate('Friends')}
                    >
                      <View style={styles.menuRowLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}>
                          <UsersIcon size={20} color={colors.foreground} strokeWidth={2} />
                        </View>
                        <Text style={[styles.menuRowText, { color: colors.foreground }]}>
                          {tr('Amis & Demandes', 'أصحابي و الطلبات', 'Friends & Requests')}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {friendRequestCount > 0 && (
                          <View style={{ backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>{friendRequestCount}</Text>
                          </View>
                        )}
                        <ChevronRight size={18} color={colors.textMuted} />
                      </View>
                    </TouchableOpacity>
                  </>
                )}

                <Text style={[styles.menuSectionLabel, { marginTop: 30, marginBottom: 15, marginLeft: 5, color: colors.textMuted }]}>
                  {language === 'ar' ? 'المالية' : (language === 'fr' ? 'FINANCE' : 'FINANCE')}
                </Text>

                <TouchableOpacity style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]} onPress={() => setActiveTab('Wallet')}>
                  <View style={styles.menuRowLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}><Wallet size={20} color={colors.foreground} strokeWidth={2} /></View>
                    <Text style={[styles.menuRowText, { color: colors.foreground }]}>
                      {language === 'ar' ? 'المحفظة' : (language === 'fr' ? 'Portefeuille' : 'My Wallet')}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '600' }}>
                      {profileData?.wallet?.coins ? profileData.wallet.coins.toLocaleString() : 0}
                    </Text>
                    <Coins size={14} color="#F59E0B" fill="#F59E0B" />
                    <ChevronRight size={18} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]} onPress={() => setActiveTab('Fidelity')}>
                  <View style={styles.menuRowLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}><Gift size={20} color={colors.foreground} strokeWidth={2} /></View>
                    <Text style={[styles.menuRowText, { color: colors.foreground }]}>
                      {t('fidelityProgram')}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>


                <Text style={[styles.menuSectionLabel, { marginTop: 30, marginBottom: 15, marginLeft: 5, color: colors.textMuted }]}>
                  {language === 'ar' ? 'الأمان' : (language === 'fr' ? 'SÉCURITÉ' : 'SECURITY')}
                </Text>

                <TouchableOpacity style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]} onPress={() => setActiveTab('KYC')}>
                  <View style={styles.menuRowLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}>
                      <ShieldCheck size={20} color={profileData?.kycStatus === 'approved' ? colors.success : (profileData?.kycStatus === 'pending' ? colors.warning : colors.foreground)} strokeWidth={2} />
                    </View>
                    <View>
                      <Text style={[styles.menuRowText, { color: colors.foreground }]}>
                        {language === 'ar' ? 'تأكيد الهوية' : (language === 'fr' ? "Vérification d'identité" : 'Identity Verification')}
                      </Text>
                      {profileData?.kycStatus && (
                        <Text style={{ fontSize: 10, color: profileData.kycStatus === 'approved' ? colors.success : colors.warning, fontWeight: '700', marginTop: 2 }}>
                          {profileData.kycStatus === 'approved' ? (language === 'ar' ? 'تم التحقق' : 'VERIFIED') : (language === 'ar' ? 'قيد المراجعة' : 'PENDING')}
                        </Text>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <Text style={[styles.menuSectionLabel, { marginTop: 30, marginBottom: 15, marginLeft: 5, color: colors.textMuted }]}>{t('preferences')}</Text>

                <View style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                  <View style={styles.menuRowLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}><Globe size={20} color={colors.foreground} strokeWidth={2} /></View>
                    <Text style={[styles.menuRowText, { color: colors.foreground }]}>{t('language')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['en', 'fr', 'ar'] as const).map((l: 'en' | 'fr' | 'ar') => (
                      <TouchableOpacity
                        key={l}
                        onPress={() => {
                          setLanguage(l);
                          let msg = 'Language Changed';
                          if (l === 'fr') msg = 'Français sélectionné';
                          if (l === 'ar') msg = 'تم اختيار اللغة العربية';
                          if (l === 'en') msg = 'English selected';
                          Alert.alert(t('languageSelect') || 'Language Changed', msg);
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          backgroundColor: language === l ? colors.foreground : (theme === 'dark' ? '#000' : '#F2F2F7')
                        }}
                      >
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '900',
                          color: language === l ? (theme === 'dark' ? '#000' : '#FFF') : colors.textMuted
                        }}>
                          {l === 'ar' ? 'TN' : l.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Dark Mode Toggle */}
                <View style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                  <View style={styles.menuRowLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}><Zap size={20} color={colors.foreground} strokeWidth={2} /></View>
                    <Text style={[styles.menuRowText, { color: colors.foreground }]}>{t('darkMode')}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    style={[styles.customSwitch, theme === 'dark' && { backgroundColor: colors.foreground }]}
                  >
                    <View style={[styles.switchDot, theme === 'dark' && [styles.switchDotActive, { backgroundColor: theme === 'dark' ? '#000' : '#FFF' }]]} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]} onPress={() => onNavigate('Settings')}>
                  <View style={styles.menuRowLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}><Settings size={20} color={colors.foreground} strokeWidth={2} /></View>
                    <Text style={[styles.menuRowText, { color: colors.foreground }]}>{t('settings')}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {['admin', 'editor', 'viewer'].includes(profileData?.role) && (
                  <>
                    <Text style={[styles.menuSectionLabel, { marginTop: 30, marginBottom: 15, marginLeft: 5, color: colors.textMuted }]}>{t('access')}</Text>
                    <TouchableOpacity style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]} onPress={() => onNavigate('AdminMenu')}>
                      <View style={styles.menuRowLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.foreground }]}><Shield size={20} color={theme === 'dark' ? '#000' : '#FFF'} strokeWidth={2} /></View>
                        <Text style={[styles.menuRowText, { fontWeight: '900', color: colors.foreground }]}>{t('adminDash')}</Text>
                      </View>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border, marginTop: 5 }]}
                  onPress={onLogout}
                >
                  <View style={styles.menuRowLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? 'rgba(255,69,58,0.15)' : '#FFE0E0' }]}><LogOut size={20} color={colors.error} strokeWidth={2} /></View>
                    <Text style={[styles.menuRowText, { color: colors.error, fontWeight: '800' }]}>{t('logout')}</Text>
                  </View>
                  {/* <ChevronRight size={18} color={colors.textMuted} /> */}
                </TouchableOpacity>
              </View>

              {socialLinks && (
                <View style={{ marginTop: 20, alignItems: 'center', paddingBottom: 80 }}>
                  <Text style={[styles.menuSectionLabel, { marginBottom: 25, textAlign: 'center', color: colors.textMuted }]}>{t('community')}</Text>
                  <View style={{ flexDirection: 'row', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {Object.entries(socialLinks).map(([key, url]: any) => {
                      if (!url || typeof url !== 'string' || url.trim() === '' || key === 'website' || key === 'updatedAt') return null;

                      let Icon = Globe;
                      if (key === 'instagram') Icon = Instagram;
                      if (key === 'facebook') Icon = Facebook;
                      if (key === 'whatsapp') Icon = MessageCircle;
                      if (key === 'tiktok') Icon = Globe;
                      if (key === 'youtube') Icon = TrendingUp;

                      return (
                        <TouchableOpacity
                          key={key}
                          style={[styles.socialCircle, { backgroundColor: theme === 'dark' ? '#1c1c1e' : 'white', elevation: 2, shadowOpacity: 0.1, borderColor: colors.border }]}
                          onPress={() => Linking.openURL(key === 'whatsapp' ? `https://wa.me/${url.replace(/[^0-9]/g, '')}` : url)}
                        >
                          <Icon size={22} color={colors.foreground} strokeWidth={1.5} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {socialLinks.website && typeof socialLinks.website === 'string' && socialLinks.website.trim() !== '' && (
                    <TouchableOpacity onPress={() => Linking.openURL(socialLinks.website)} style={{ marginTop: 30 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5 }}>
                        {socialLinks.website.replace('https://', '').replace('http://', '').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {profileTab === 'Works' && (
            <View style={{ marginTop: 20, paddingHorizontal: 15, paddingBottom: 100 }}>
              {isOwnProfile && (
                <View style={{ marginBottom: 25 }}>
                  <TouchableOpacity
                    onPress={handleUploadWork}
                    disabled={uploadingWork}
                    activeOpacity={0.8}
                    style={{
                      height: 160,
                      borderRadius: 24,
                      backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: colors.border,
                      overflow: 'hidden'
                    }}
                  >
                    {uploadingWork ? (
                      <View style={{ alignItems: 'center' }}>
                        <ActivityIndicator color={colors.foreground} size="large" />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 15 }}>
                          {tr('Envoi en cours...', 'جاري التحميل...', 'Uploading your work...')}
                        </Text>
                      </View>
                    ) : (
                      <>
                        <View style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          backgroundColor: colors.background,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 15,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.1,
                          shadowRadius: 8,
                          elevation: 4
                        }}>
                          <Plus size={28} color={colors.foreground} strokeWidth={2.5} />
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.foreground, marginBottom: 4 }}>
                          {tr('Ajouter un travail', 'إضافة عمل جديد', 'Add New Work')}
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted }}>
                          {tr('Vidéo ou Photo', 'فيديو أو صورة', 'Upload Video or Photo')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {works.length === 0 ? (
                <View style={{ alignItems: 'center', marginTop: 30 }}>
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20
                  }}>
                    <ImageIcon size={32} color={colors.border} strokeWidth={1.5} />
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                    {tr('Aucun travail partagé pour le moment', 'لا توجد أعمال مشاركة بعد', 'No works shared yet')}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
                    {tr('Partagez votre parcours créatif avec la communauté', 'شارك رحلتك الإبداعية مع المجتمع', 'Share your creative journey with the community')}
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
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
                        overflow: 'hidden',
                        elevation: 3,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4
                      }}
                    >
                      {work.type === 'video' ? (
                        <View style={{ flex: 1 }}>
                          <Video
                            source={{ uri: work.url }}
                            style={{ flex: 1 }}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={false}
                          />
                          <View style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            padding: 4,
                            borderRadius: 8
                          }}>
                            <VideoIcon size={12} color="white" />
                          </View>
                          <View style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -12, marginTop: -12 }}>
                            <Play size={24} color="rgba(255,255,255,0.8)" fill="rgba(255,255,255,0.5)" />
                          </View>
                        </View>
                      ) : (
                        <Image source={{ uri: work.url }} style={{ flex: 1 }} />
                      )}

                      {isOwnProfile && (
                        <TouchableOpacity
                          onPress={async () => {
                            Alert.alert(
                              tr('Supprimer le travail', 'حذف العمل', 'Delete Work'),
                              tr('Voulez-vous vraiment supprimer ce travail ?', 'هل أنت متأكد أنك تريد حذف هذا العمل؟', 'Are you sure you want to delete this work?'),
                              [
                                { text: tr('Annuler', 'إلغاء', 'Cancel'), style: 'cancel' },
                                {
                                  text: tr('Supprimer', 'حذف', 'Delete'),
                                  style: 'destructive',
                                  onPress: async () => {
                                    try {
                                      await deleteDoc(doc(db, 'users', user.uid, 'works', work.id));
                                    } catch (e) {
                                      console.error('Error deleting work', e);
                                    }
                                  }
                                }
                              ]
                            );
                          }}
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10
                          }}
                        >
                          <Trash size={14} color="#EF4444" />
                        </TouchableOpacity>
                      )}

                      {/* Interaction Stats (Reactions & Comments) */}
                      <View style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        right: 8,
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 5,
                        zIndex: 20
                      }}>
                        {/* Comment Count Pill */}
                        {((work.commentsCount || 0) > 0) && (
                          <View style={{
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.2)'
                          }}>
                            <MessageSquare size={11} color="#FFF" strokeWidth={2.5} />
                            <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>
                              {work.commentsCount}
                            </Text>
                          </View>
                        )}

                        {[
                          { type: 'love', Icon: Heart, color: '#FF4D67' },
                          { type: 'fire', Icon: Flame, color: '#FF8A00' },
                          { type: 'haha', Icon: Laugh, color: '#FFD600' },
                          { type: 'bad', Icon: ThumbsDown, color: '#94A3B8' },
                          { type: 'ugly', Icon: Ghost, color: '#818CF8' },
                          { type: 'interesting', Icon: Sparkles, color: '#A855F7' }
                        ].map((r) => {
                          const count = work.reactions?.[r.type] || 0;
                          if (count === 0) return null;
                          return (
                            <View key={r.type} style={{
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              paddingHorizontal: 6,
                              paddingVertical: 3,
                              borderRadius: 8,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 3,
                              borderWidth: 0.5,
                              borderColor: 'rgba(255,255,255,0.1)'
                            }}>
                              <r.Icon size={10} color={r.color} fill="transparent" strokeWidth={2.5} />
                              <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          <View style={{ flex: 1 }}>
            {selectedWork && (
              <View style={{ flex: 1 }}>
                {/* Header Container (Floating & Blurred) */}
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingTop: insets.top + 12,
                  paddingBottom: 12,
                  zIndex: 100,
                  backgroundColor: 'transparent'
                }}>
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
                      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#FFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    }}
                  >
                    <X size={20} color={colors.foreground} />
                  </TouchableOpacity>

                  <Text style={{ color: colors.foreground, fontWeight: '900', fontSize: 16 }}>
                    {selectedWork?.type === 'video' ? tr('VIDÉO', 'فيديو', 'VIDEO') : tr('PHOTO', 'صورة', 'PHOTO')}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    {isViral(selectedWork) && (
                      <View style={{
                        backgroundColor: '#FF4D67',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Flame size={12} color="white" fill="white" />
                        <Text style={{ color: 'white', fontWeight: '900', fontSize: 10 }}>VIRAL</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => handleShare(selectedWork)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#FFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                      }}
                    >
                      <Share2 size={18} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingBottom: 20, paddingTop: insets.top + 64 }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Media Content - Full Width with black background to make media pop */}
                  <View style={{ width: width, height: height * 0.5, backgroundColor: '#000', justifyContent: 'center' }}>
                    {selectedWork?.type === 'video' ? (
                      <Video
                        source={{ uri: selectedWork.url }}
                        style={{ width: width, height: height * 0.5 }}
                        resizeMode={ResizeMode.CONTAIN}
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
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
                      <TouchableOpacity
                        onPress={() => handleDownload(selectedWork)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          backgroundColor: colors.surface || (theme === 'dark' ? '#1A1A24' : '#F2F2F7'),
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 25,
                          borderWidth: 1,
                          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                        }}
                      >
                        <DownloadCloud size={18} color={colors.foreground} />
                        <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>{tr('Télécharger', 'تحميل', 'Download')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleRepost(selectedWork)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          backgroundColor: colors.surface || (theme === 'dark' ? '#1A1A24' : '#F2F2F7'),
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 25,
                          borderWidth: 1,
                          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                        }}
                      >
                        <Repeat size={18} color={colors.foreground} />
                        <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>{tr('Republier', 'إعادة نشر', 'Repost')}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Reaction Bar */}
                    <View style={{
                      flexDirection: 'row',
                      backgroundColor: colors.surface || (theme === 'dark' ? '#1A1A24' : '#F2F2F7'),
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 30,
                      alignSelf: 'center',
                      width: width * 0.94,
                      justifyContent: 'space-between',
                      borderWidth: 1,
                      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      marginBottom: 25
                    }}>
                      {[
                        { type: 'love', Icon: Heart, color: '#FF4D67', label: tr('Amour', 'يهبل', 'Love') },
                        { type: 'fire', Icon: Flame, color: '#FF8A00', label: tr('Feu', 'نار', 'Fire') },
                        { type: 'haha', Icon: Laugh, color: '#FFD600', label: tr('Drôle', 'يضحك', 'Haha') },
                        { type: 'bad', Icon: ThumbsDown, color: '#94A3B8', label: tr('Bof', 'خايب', 'Bad') },
                        { type: 'ugly', Icon: Ghost, color: '#818CF8', label: tr('Moche', 'ماسط', 'Ugly') },
                        { type: 'interesting', Icon: Sparkles, color: '#A855F7', label: tr('Top', 'طيارة', 'Cool') },
                        ...(isViral(selectedWork) ? [{ type: 'trendy', Icon: Star, color: '#FFD700', label: tr('Viral', 'ترند', 'Trendy') }] : [])
                      ].map((btn) => {
                        const isSelected = selectedWork?.userReactions?.[user?.uid] === btn.type;
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
                            style={{ alignItems: 'center', width: itemWidth }}
                          >
                            <View style={{
                              width: 38,
                              height: 38,
                              borderRadius: 19,
                              backgroundColor: isSelected ? (btn.color + '20') : 'transparent',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: showColor ? 1.5 : 1,
                              borderColor: showColor ? btn.color : (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                              marginBottom: 4
                            }}>
                              <btn.Icon
                                size={20}
                                color={showColor ? btn.color : (theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.3)')}
                                fill="transparent"
                                strokeWidth={isSelected ? 3 : 1.5}
                              />
                            </View>
                            <Text style={{ color: showColor ? btn.color : (theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'), fontSize: 8, fontWeight: '800', marginBottom: 2 }}>
                              {btn.label.toUpperCase()}
                            </Text>
                            <Text style={{ color: colors.foreground, fontSize: 10, fontWeight: '900' }}>
                              {count}
                            </Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>

                    {/* Comments Section Container */}
                    <View style={{ paddingHorizontal: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <MessageSquare size={18} color={colors.foreground} />
                        <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 15 }}>
                          {tr('Commentaires', 'تعليقات', 'Comments')} ({comments.length})
                        </Text>
                      </View>

                      {loadingComments ? (
                        <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
                      ) : comments.length === 0 ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                          <MessageSquare size={40} color={colors.foreground} style={{ opacity: 0.2, marginBottom: 12 }} />
                          <Text style={{ color: colors.foreground, textAlign: 'center', fontSize: 13, opacity: 0.6, fontWeight: '800' }}>
                            {tr('Soyez le premier à commenter', 'كن أول من يعلق', 'Be the first to comment')}
                          </Text>
                        </View>
                      ) : (
                        (() => {
                          // More robust filter for top-level comments
                          const topLevelComments = comments.filter(c => !c.parentCommentId || c.parentCommentId === "root" || c.parentCommentId === "");

                          // If for some reason we have comments but the filter returns nothing, fall back to showing all comments as top-level
                          const displayComments = topLevelComments.length > 0 ? topLevelComments : comments;

                          return displayComments.map((comment) => {
                            const replies = comments.filter(r => r.parentCommentId === comment.id);
                            const isExpanded = expandedReplies.includes(comment.id);

                            const renderComment = (item: any, isReply = false) => (
                              <View key={item.id} style={{ marginBottom: isReply ? 12 : 16, flexDirection: 'row', gap: 12 }}>
                                <View style={{ width: isReply ? 28 : 36, height: isReply ? 28 : 36, borderRadius: isReply ? 14 : 18, backgroundColor: colors.surface || (theme === 'dark' ? '#1A1A24' : '#F2F2F7'), alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                  {item.userAvatar ? (
                                    <Image source={{ uri: item.userAvatar }} style={{ width: isReply ? 28 : 36, height: isReply ? 28 : 36, borderRadius: isReply ? 14 : 18 }} />
                                  ) : (
                                    <Text style={{ color: colors.foreground, fontSize: isReply ? 10 : 12, fontWeight: '900' }}>{getInitials(item.userName)}</Text>
                                  )}
                                </View>
                                <View style={{ flex: 1, backgroundColor: colors.surface || (theme === 'dark' ? '#1A1A24' : '#F2F2F7'), padding: 10, borderRadius: 15, borderWidth: 1, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                      <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 13 }}>{item.userName}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                      {(() => {
                                        const isCommentAuthor = item.userId === user?.uid;
                                        // If we are on our own profile, we are the post owner
                                        const isPostOwner = isOwnProfile;

                                        if (isCommentAuthor || isPostOwner) {
                                          return (
                                            <TouchableOpacity
                                              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                              style={{
                                                padding: 4,
                                                borderRadius: 12,
                                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                                marginRight: -4
                                              }}
                                              onPress={() => {
                                                const options: any[] = [
                                                  { text: tr('Annuler', 'إلغاء', 'Cancel'), style: 'cancel' }
                                                ];

                                                if (isCommentAuthor) {
                                                  options.push({
                                                    text: tr('Modifier', 'تعديل', 'Edit'),
                                                    onPress: () => {
                                                      setEditingComment(item);
                                                      setCommentText(item.text);
                                                    }
                                                  });
                                                }

                                                options.push({
                                                  text: tr('Supprimer', 'حذف', 'Delete'),
                                                  style: 'destructive',
                                                  onPress: () => handleDeleteComment(item.id)
                                                });

                                                Alert.alert(
                                                  tr('Options', 'خيارات', 'Options'),
                                                  '',
                                                  options
                                                );
                                              }}
                                            >
                                              <MoreVertical size={18} color={colors.foreground} style={{ opacity: 0.9 }} />
                                            </TouchableOpacity>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </View>
                                  </View>
                                  <Text style={{ color: colors.foreground, fontSize: 13, marginTop: 4, lineHeight: 18 }}>{item.text}</Text>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                                    <TouchableOpacity onPress={() => {
                                      setReplyingTo(item);
                                      setCommentText(`@${item.userName} `);
                                    }}>
                                      <Text style={{ color: '#A855F7', fontSize: 11, fontWeight: '900' }}>{tr('Répondre', 'رد', 'Reply')}</Text>
                                    </TouchableOpacity>

                                    {/* Small Reactions List */}
                                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                      {[
                                        { type: 'love', Icon: Heart, color: '#FF4D67' },
                                        { type: 'fire', Icon: Flame, color: '#FF8A00' },
                                        { type: 'haha', Icon: Laugh, color: '#FFD600' },
                                        { type: 'bad', Icon: ThumbsDown, color: '#94A3B8' },
                                        { type: 'ugly', Icon: Ghost, color: '#818CF8' },
                                        { type: 'interesting', Icon: Sparkles, color: '#A855F7' }
                                      ].map(reac => {
                                        const isSelected = item.userReactions?.[user?.uid] === reac.type;
                                        const count = item.reactions?.[reac.type] || 0;
                                        return (
                                          <TouchableOpacity
                                            key={reac.type}
                                            onPress={() => handleCommentReact(item, reac.type)}
                                            style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                                          >
                                            <reac.Icon
                                              size={14}
                                              color={isSelected ? reac.color : (theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.3)')}
                                              fill="transparent"
                                              strokeWidth={isSelected ? 2.5 : 1.5}
                                            />
                                            {count > 0 && (
                                              <Text style={{ color: isSelected ? reac.color : colors.secondary, fontSize: 10, fontWeight: '800' }}>
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
                                  <View style={{ marginLeft: 48, marginBottom: 12 }}>
                                    <TouchableOpacity
                                      onPress={() => setExpandedReplies(prev =>
                                        prev.includes(comment.id) ? prev.filter(id => id !== comment.id) : [...prev, comment.id]
                                      )}
                                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
                                    >
                                      <View style={{ height: 1, width: 20, backgroundColor: colors.foreground, opacity: 0.2 }} />
                                      <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '900', opacity: 0.7 }}>
                                        {isExpanded ? tr('Masquer les réponses', 'إخفاء الردود', 'Hide replies') : `${tr('Voir', 'عرض', 'View')} ${replies.length} ${tr('réponses', 'ردود', 'replies')}`}
                                      </Text>
                                    </TouchableOpacity>
                                    {isExpanded && replies.map(reply => renderComment(reply, true))}
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
                <View style={{
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: Platform.OS === 'ios' ? 24 : 12,
                  borderTopWidth: 1,
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  backgroundColor: colors.background
                }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface || (theme === 'dark' ? '#1A1A24' : '#F2F2F7'),
                    borderRadius: 24,
                    paddingHorizontal: 16,
                    height: 48,
                    borderWidth: 1,
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                  }}>
                    <TextInput
                      style={{ flex: 1, color: colors.foreground, fontSize: 14 }}
                      placeholder={tr('Écrire un commentaire...', 'اكتب تعليقاً...', 'Write a comment...')}
                      placeholderTextColor={theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)'}
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
                        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Send size={18} color={commentText.trim() ? "rgba(255,255,255,1)" : (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')} />
                    </TouchableOpacity>
                  </View>
                  {editingComment && (
                    <TouchableOpacity onPress={() => { setEditingComment(null); setCommentText(""); }} style={{ marginTop: 8, paddingLeft: 12 }}>
                      <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700' }}>{tr('Annuler modification', 'إلغاء التعديل', 'Cancel edit')}</Text>
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.background, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: colors.foreground }}>{tr('Échanger des actifs', 'تبادل الأصول', 'Exchange Assets')}</Text>
              <TouchableOpacity onPress={() => setShowQuickExchange(false)}><X size={20} color={colors.foreground} /></TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', backgroundColor: theme === 'dark' ? '#1c1c1e' : '#f2f2f7', borderRadius: 15, padding: 4, marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => setExchangeType('diamondsToCoins')}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: exchangeType === 'diamondsToCoins' ? colors.foreground : 'transparent', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: exchangeType === 'diamondsToCoins' ? (theme === 'dark' ? '#000' : '#FFF') : colors.textMuted }}>{tr('DIAMANTS → PIÈCES', 'ألماس ← عملات', 'DIAMONDS → COINS')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setExchangeType('coinsToDiamonds')}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: exchangeType === 'coinsToDiamonds' ? colors.foreground : 'transparent', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: exchangeType === 'coinsToDiamonds' ? (theme === 'dark' ? '#000' : '#FFF') : colors.textMuted }}>{tr('PIÈCES → DIAMANTS', 'عملات ← ألماس', 'COINS → DIAMONDS')}</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={{ backgroundColor: theme === 'dark' ? '#1c1c1e' : '#f2f2f7', borderRadius: 15, padding: 15, color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 15 }}
              placeholder={tr('Montant à échanger', 'المبلغ للتبادل', 'Amount to exchange')}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={exchangeAmount}
              onChangeText={setExchangeAmount}
            />

            {exchangeType === 'coinsToDiamonds' && exchangeAmount !== '' && (
              <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 15, textAlign: 'center' }}>
                {tr('Coût total (avec 30% frais):', 'التكلفة الإجمالية (مع 30% رسوم):', 'Total cost (incl. 30% fee):')} <Text style={{ color: colors.foreground, fontWeight: '900' }}>{Math.ceil(parseInt(exchangeAmount) * 1.3) || 0} {tr('Coins', 'عملات', 'Coins')}</Text>
              </Text>
            )}

            <TouchableOpacity
              disabled={isProcessingExchange || !exchangeAmount}
              onPress={handleConfirmQuickExchange}
              style={{ backgroundColor: colors.foreground, borderRadius: 15, paddingVertical: 15, alignItems: 'center' }}
            >
              {isProcessingExchange ? <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} /> : <Text style={{ color: theme === 'dark' ? '#000' : '#FFF', fontWeight: '900' }}>{tr('CONFIRMER', 'تأكيد', 'CONFIRM')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transfer Diamonds Modal */}
      <Modal visible={showTransferModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, minHeight: height * 0.7 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.foreground }}>{tr('Transférer des Diamants', 'تحويل الألماس', 'Transfer Diamonds')}</Text>
              <TouchableOpacity onPress={() => setShowTransferModal(false)}><X size={24} color={colors.foreground} /></TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', backgroundColor: theme === 'dark' ? '#1c1c1e' : '#f2f2f7', borderRadius: 15, paddingHorizontal: 15, height: 50, alignItems: 'center', marginBottom: 20 }}>
              <Search size={20} color={colors.textMuted} />
              <TextInput
                style={{ flex: 1, marginLeft: 10, color: colors.foreground, fontWeight: '600' }}
                placeholder={tr('Rechercher un utilisateur...', 'بحث عن مستخدم...', 'Search user...')}
                placeholderTextColor={colors.textMuted}
                value={transferSearchQuery}
                onChangeText={handleSearchUsers}
              />
            </View>

            {selectedTransferUser ? (
              <View style={{ backgroundColor: theme === 'dark' ? '#1c1c1e' : '#f2f2f7', borderRadius: 20, padding: 20, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Image source={selectedTransferUser.avatarUrl ? { uri: selectedTransferUser.avatarUrl } : APP_ICON} style={{ width: 44, height: 44, borderRadius: 22 }} />
                    <View>
                      <Text style={{ color: colors.foreground, fontWeight: '800' }}>{selectedTransferUser.fullName}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{selectedTransferUser.displayName}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedTransferUser(null)}><X size={18} color="#EF4444" /></TouchableOpacity>
                </View>
                <View style={{ marginTop: 20 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800', marginBottom: 10 }}>{tr('MONTANT À TRANSFÉRER', 'المبلغ للتحويل', 'AMOUNT TO TRANSFER').toUpperCase()}</Text>
                  <TextInput
                    style={{ fontSize: 24, fontWeight: '900', color: colors.foreground, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 }}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={transferAmount}
                    onChangeText={setTransferAmount}
                  />
                  <TouchableOpacity
                    disabled={isProcessingExchange || !transferAmount}
                    onPress={handleQuickTransfer}
                    style={{ backgroundColor: colors.foreground, borderRadius: 15, paddingVertical: 15, alignItems: 'center', marginTop: 30 }}
                  >
                    <Text style={{ color: theme === 'dark' ? '#000' : '#FFF', fontWeight: '900' }}>{tr('ENVOYER DIAMANTS', 'إرسال الألماس', 'SEND DIAMONDS')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <FlatList
                data={transferSearchResults}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedTransferUser(item)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
                  >
                    <Image source={item.avatarUrl ? { uri: item.avatarUrl } : APP_ICON} style={{ width: 44, height: 44, borderRadius: 22 }} />
                    <View>
                      <Text style={{ color: colors.foreground, fontWeight: '700' }}>{item.fullName}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{item.displayName}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={{ alignItems: 'center', marginTop: 50 }}>
                    {isSearchingUsers ? <ActivityIndicator color={colors.accent} /> : <Text style={{ color: colors.textMuted }}>{transferSearchQuery ? tr('Aucun utilisateur trouvé', 'لم يتم العثور على مستخدم', 'No user found') : tr('Tapez au moins 3 caractères', 'اكتب 3 أحرف على الأقل', 'Type at least 3 characters')}</Text>}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View >
  );
}

function FollowManagementScreen({ onBack, followedCollabs, toggleFollowCollab, setSelectedCollab, setActiveTab, t, language, theme }: any) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
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
      const q = query(collection(db, 'collaborations'), where('__name__', 'in', followedCollabs));
      unsubscribe = onSnapshot(q, (snapshot) => {
        setList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }, (error) => {
        console.error('Error fetching followed collabs:', error);
        setLoading(false);
      });
    } catch (e) {
      console.error("Setup error:", e);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [followedCollabs]);

  const getName = (field: any) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[language === 'ar' ? 'ar-tn' : language] || field[language] || field['fr'] || field['en'] || Object.values(field)[0] || '';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Blur Header */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64 + insets.top,
        paddingTop: insets.top,
        borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '66' }]} />
        </Animated.View>

        <View style={[styles.modernHeader, { borderBottomWidth: 0, backgroundColor: 'transparent' }]}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#17171F' : '#F2F2F7' }]}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.modernLogo, { color: colors.foreground }]}>{t('follow').toUpperCase()}</Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 80 + insets.top, paddingBottom: 100 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 50 }} />
        ) : list.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <ShoppingBag size={64} color={colors.border} strokeWidth={1} />
            <Text style={{ marginTop: 20, color: colors.textMuted, fontSize: 16, fontWeight: '600' }}>{t('noResults')}</Text>
          </View>
        ) : (
          list.map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                setSelectedCollab(item);
                setActiveTab('CollabDetail');
              }}
              activeOpacity={0.9}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme === 'dark' ? '#121218' : '#FFF',
                padding: 16,
                borderRadius: 24,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: theme === 'dark' ? 0 : 0.05,
                shadowRadius: 10,
                elevation: 2
              }}
            >
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: item.imageUrl }} style={{ width: width * 0.18, height: width * 0.18, borderRadius: (width * 0.18) / 2, backgroundColor: colors.border, borderWidth: 2, borderColor: colors.border }} />
                <View style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  backgroundColor: item.type === 'Brand' ? '#FFD700' : item.type === 'Person' ? '#A855F7' : item.type === 'Company' ? '#3B82F6' : '#22C55E',
                  borderRadius: 12,
                  width: 22,
                  height: 22,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 3,
                  borderColor: theme === 'dark' ? '#121218' : '#FFF'
                }}>
                  <CheckCircle2 size={10} color={theme === 'dark' ? '#121218' : '#FFF'} />
                </View>
              </View>

              <View style={{ flex: 1, marginLeft: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '900', color: colors.foreground, letterSpacing: 0.5 }}>{getName(item.name).toUpperCase()}</Text>
                </View>
                <Text numberOfLines={1} style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, fontWeight: '700', letterSpacing: 1 }}>{item.type?.toUpperCase() || 'PARTNER'}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <UsersIcon size={10} color={colors.textMuted} />
                    <Text style={{ fontSize: 10, fontWeight: '800', color: colors.foreground }}>
                      {item.followersCount ? (item.followersCount >= 1000 ? `${(item.followersCount / 1000).toFixed(1)}k` : item.followersCount) : '0'}
                    </Text>
                  </View>
                  <View style={{ width: 1, height: 10, backgroundColor: colors.border }} />
                  <Text style={{ fontSize: 10, fontWeight: '800', color: colors.accent }}>{t('viewDetails') || 'DÉTAILS'}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => toggleFollowCollab(item.id)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme === 'dark' ? 'rgba(255,69,58,0.1)' : '#FFF5F5',
                  alignItems: 'center',
                  justifyContent: 'center'
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


function WishlistScreen({ onBack, onProductPress, wishlist, toggleWishlist, addToCart, t, theme, language }: any) {
  const { colors } = useAppTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

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
      const q = query(collection(db, 'products'), where('__name__', 'in', wishlist));
      const snap = await getDocs(q);
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Animated Blur Header */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64 + insets.top,
        paddingTop: insets.top,
        borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '66' }]} />
        </Animated.View>

        <View style={styles.modernHeader}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modernLogo, { color: colors.foreground }]}>{t('wishlist')}</Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 64 + insets.top }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 50 }} color={colors.foreground} />
        ) : products.length === 0 ? (
          <View style={[styles.centered, { marginTop: 100, backgroundColor: colors.background }]}>
            <Heart size={64} color={theme === 'dark' ? '#222' : '#EEE'} />
            <Text style={[styles.modernSectionTitle, { marginTop: 20, color: colors.textMuted }]}>{t('nothingSaved')}</Text>
          </View>
        ) : (
          <View style={styles.modernGrid}>
            {products.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onPress={() => onProductPress(p)}
                isWishlisted={true}
                onToggleWishlist={() => toggleWishlist(p.id)}
                onAddToCart={() => addToCart(p)}
                showRating={true}
                t={t}
                theme={theme}
                language={language}
              />
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function OrdersScreen({ onBack, t }: any) {
  const { colors, theme } = useAppTheme();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingItem, setReviewingItem] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const submitReview = async () => {
    if (!reviewingItem) return;
    try {
      const productId = reviewingItem.item.id || reviewingItem.item.productId;
      console.log('Submitting review for product:', productId);
      console.log('Review item:', reviewingItem.item);

      const reviewData = {
        productId: productId,
        orderId: reviewingItem.orderId,
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || t('customer'),
        rating,
        comment: reviewComment,
        createdAt: serverTimestamp()
      };

      console.log('Review data:', reviewData);

      // Add review to reviews collection
      await addDoc(collection(db, 'reviews'), reviewData);

      // Mark item as reviewed in the order
      const orderRef = doc(db, 'orders', reviewingItem.orderId);
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

      Alert.alert(t('featured'), t('reviewSubmitted'));
      setReviewingItem(null);
      setReviewComment('');
      setRating(5);
      // Refresh orders to show updated review status
      fetchOrders();
    } catch (e) {
      console.error('Review submission error:', e);
      Alert.alert(t('cancel'), t('reviewFailed'));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'orders'),
        where('customer.uid', '==', auth.currentUser?.uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort client-side to avoid index requirement for now
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(list);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#27ae60';
      case 'pending': return '#f39c12';
      case 'shipped': return '#9b59b6';
      case 'cancelled': return '#e74c3c';
      default: return '#3498db';
    }
  };

  const statusMap: any = {
    pending: 'statusPending',
    delivered: 'statusDelivered',
    shipped: 'statusShipped',
    cancelled: 'statusCancelled',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Animated Blur Header */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64 + insets.top,
        paddingTop: insets.top,
        borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '66' }]} />
        </Animated.View>

        <View style={styles.modernHeader}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#0A0A0A' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}><ChevronLeft size={20} color={colors.foreground} /></TouchableOpacity>
          <Text style={[styles.modernLogo, { color: colors.foreground }]}>{t('myOrders')}</Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 64 + insets.top }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {loading ? (
          <ActivityIndicator color={colors.foreground} style={{ marginTop: 50 }} />
        ) : orders.length === 0 ? (
          <View style={[styles.centered, { marginTop: 100, backgroundColor: colors.background }]}>
            <Package size={64} color={theme === 'dark' ? '#222' : '#EEE'} />
            <Text style={[styles.modernSectionTitle, { marginTop: 20, color: colors.textMuted }]}>{t('noOrders')}</Text>
          </View>
        ) : (
          orders.map((order, index) => (
            <View key={order.id} style={[styles.orderCard, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border }]}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={[styles.orderId, { color: colors.foreground }]}>{t('orderNumber')}{order.id.slice(-6).toUpperCase()}</Text>
                  <Text style={[styles.orderDate, { color: colors.textMuted }]}>{order.createdAt?.toDate().toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusTag, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{t(statusMap[order.status] || order.status)}</Text>
                </View>
              </View>
              <View style={styles.orderItemsPreview}>
                {order.items?.map((item: any, idx: number) => (
                  <Image key={idx} source={{ uri: item.mainImage }} style={styles.orderItemThumb} />
                ))}
              </View>
              <View style={styles.orderFooter}>
                <Text style={[styles.orderTotalLabel, { color: colors.textMuted }]}>{t('total')}</Text>
                <Text style={[styles.orderTotalValue, { color: colors.foreground }]}>{order.total.toFixed(2)} TND</Text>
              </View>
              {order.status === 'delivered' && (
                <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: colors.textMuted, marginBottom: 10 }}>{t('leaveReview')}</Text>
                  {order.items?.map((item: any, idx: number) => {
                    const isReviewed = item.reviewed === true;
                    return (
                      <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Image source={{ uri: item.mainImage }} style={{ width: 30, height: 30, borderRadius: 5, backgroundColor: theme === 'dark' ? '#000' : '#eee' }} />
                          <Text style={{ fontSize: 12, fontWeight: '700', maxWidth: 150, color: colors.foreground }} numberOfLines={1}>{getName(item.name)}</Text>
                        </View>
                        {isReviewed ? (
                          <View style={{ paddingHorizontal: 15, paddingVertical: 6, backgroundColor: '#10B981', borderRadius: 15 }}>
                            <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>{t('reviewed')}</Text>
                          </View>
                        ) : (
                          <TouchableOpacity onPress={() => setReviewingItem({ orderId: order.id, item })} style={{ paddingHorizontal: 15, paddingVertical: 6, backgroundColor: colors.foreground, borderRadius: 15 }}>
                            <Text style={{ color: theme === 'dark' ? '#000' : '#FFF', fontSize: 10, fontWeight: '800' }}>{t('rate')}</Text>
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
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 }}>
            <View style={{ backgroundColor: colors.background, borderRadius: 25, padding: 25 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', marginBottom: 5, color: colors.foreground }}>{t('rateProduct')}</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>{getName(reviewingItem.item.name)}</Text>

              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 25 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)}>
                    <Star size={32} color={s <= rating ? "#FFD700" : "#EEE"} fill={s <= rating ? "#FFD700" : "#EEE"} />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.premiumInput, { height: 100, textAlignVertical: 'top' }]}
                placeholder={t('writeReview')}
                multiline
                value={reviewComment}
                onChangeText={setReviewComment}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity onPress={() => setReviewingItem(null)} style={{ flex: 1, padding: 15, backgroundColor: '#F2F2F7', borderRadius: 15, alignItems: 'center' }}>
                  <Text style={{ fontWeight: '800' }}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={submitReview} style={{ flex: 1, padding: 15, backgroundColor: Colors.foreground, borderRadius: 15, alignItems: 'center' }}>
                  <Text style={{ fontWeight: '800', color: 'white' }}>{t('submit')}</Text>
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

function QuickAddModal({ product, isVisible, onClose, onAddToCart, onSizeGuide, t }: any) {
  const { colors, theme } = useAppTheme();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || 'M');
      setSelectedColor(product.colors?.[0] || '');
    }
  }, [product]);

  if (!product) return null;

  const handleConfirm = () => {
    onAddToCart(product, selectedSize, selectedColor);
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
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
            borderTopColor: 'rgba(255,255,255,0.05)',
            maxHeight: height * 0.85
          }}
        >
          {/* Refined Drag Indicator */}
          <View style={{ width: 32, height: 4, backgroundColor: theme === 'dark' ? colors.secondary : '#E5E5EA', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Product Header Card */}
            <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20, alignItems: 'center' }}>
              <View style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3
              }}>
                <Image
                  source={{ uri: product.mainImage || product.image || product.imageUrl }}
                  style={{ width: 85, height: 110, borderRadius: 16, backgroundColor: theme === 'dark' ? '#121218' : '#F2F2F7' }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: colors.accent, letterSpacing: 1.2, marginBottom: 4 }}>{String(translateCategory(getName(product.category)) || t('collections')).toUpperCase()}</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.foreground, letterSpacing: -0.5, lineHeight: 22 }}>{String(getName(product.name)).toUpperCase()}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.foreground }}>
                    {product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)} TND
                  </Text>
                  {product.discountPrice && (
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, textDecorationLine: 'line-through' }}>
                      {product.price.toFixed(2)} TND
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: colors.foreground, letterSpacing: 1 }}>{t('color')}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted }}>{translateColor(selectedColor).toUpperCase()}</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {product.colors.map((c: string) => {
                    const displayColor = c.startsWith('#') ? c : c.toLowerCase();
                    const isSelected = selectedColor === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setSelectedColor(c)}
                        activeOpacity={0.8}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          borderWidth: 2,
                          borderColor: isSelected ? colors.foreground : (theme === 'dark' ? colors.secondary : '#EEE'),
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: displayColor,
                          borderWidth: 1,
                          borderColor: (displayColor === 'black' || displayColor === '#000' || displayColor === '#000000')
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(0,0,0,0.05)'
                        }} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Size Selector */}
            <View style={{ marginBottom: 30 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: colors.foreground, letterSpacing: 1 }}>{t('size')}</Text>
                <TouchableOpacity onPress={onSizeGuide}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted }}>{t('sizeGuide')}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(product.sizes || ['XS', 'S', 'M', 'L', 'XL']).map((s: string) => {
                  const isSelected = selectedSize === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setSelectedSize(s)}
                      activeOpacity={0.7}
                      style={[
                        {
                          minWidth: 54,
                          height: 44,
                          borderRadius: 14,
                          backgroundColor: isSelected ? colors.foreground : (theme === 'dark' ? colors.secondary : '#F2F2F7'),
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1.5,
                          borderColor: isSelected ? colors.foreground : (theme === 'dark' ? colors.secondary : colors.border),
                          paddingHorizontal: 12
                        },
                        { flexGrow: 0 }
                      ]}
                    >
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '900',
                        color: isSelected ? (theme === 'dark' ? '#000' : '#FFF') : colors.foreground
                      }}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.foreground,
                height: 54,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 6,
                marginBottom: 10
              }}
              onPress={handleConfirm}
              activeOpacity={0.9}
            >
              <ShoppingBag size={20} color={theme === 'dark' ? '#000' : '#FFF'} strokeWidth={2.5} />
              <Text style={{
                color: theme === 'dark' ? '#000' : '#FFF',
                fontSize: 15,
                fontWeight: '900',
                letterSpacing: 1.2,
                textTransform: 'uppercase'
              }}>{t('addToCart')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animatable.View>
      </TouchableOpacity>
    </Modal>
  );
}

function SettingsScreen({ onBack, profileData, updateProfile, onNavigate, t, user }: any) {
  const { colors: appColors, theme } = useAppTheme();

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const [name, setName] = useState(profileData?.fullName || '');
  const [phone, setPhone] = useState(profileData?.phone || '');
  const [addresses, setAddresses] = useState<any[]>(profileData?.addresses || []);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [tempAddress, setTempAddress] = useState('');
  const [avatar, setAvatar] = useState(profileData?.avatarUrl || null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notifications, setNotifications] = useState(profileData?.settings?.notifications ?? true);
  const [faceId, setFaceId] = useState(profileData?.settings?.faceId ?? false);
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    const getBiometricType = async () => {
      try {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('FaceID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType(Platform.OS === 'ios' ? 'TouchID' : 'Fingerprint');
        } else {
          setBiometricType('Biometrics');
        }
      } catch (e) {
        setBiometricType('Biometrics');
      }
    };
    getBiometricType();
  }, []);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (profileData) {
      setName(profileData.fullName || '');
      setPhone(profileData.phone || '');
      setAddresses(profileData.addresses || []);
      setAvatar(profileData.avatarUrl || null);
      if (profileData.settings) {
        setNotifications(profileData.settings.notifications ?? true);
        setFaceId(profileData.settings.faceId ?? false);
      }
    }
  }, [profileData]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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
      const downloadUrl = await uploadImageToCloudinary(uri);

      if (downloadUrl) {
        setAvatar(downloadUrl);
        await updateProfile({ avatarUrl: downloadUrl });
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      Alert.alert(t('error'), t('failedAvatar'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const updatedSettings = {
      notifications,
      faceId
    };
    await updateProfile({
      fullName: name,
      phone,
      addresses,
      settings: updatedSettings
    });
    setLoading(false);
    Alert.alert(t('successTitle'), t('profileUpdated'));
  };

  const handleAddAddress = () => {
    if (!tempAddress.trim()) return;
    const newAddr = { id: Date.now().toString(), text: tempAddress, isDefault: addresses.length === 0 };
    const newList = [...addresses, newAddr];
    setAddresses(newList);
    setTempAddress('');
    setShowAddressForm(false);
    updateProfile({ addresses: newList });
    Alert.alert(t('successTitle'), t('addressAdded'));
  };

  const handleDeleteAddress = (id: string) => {
    const newList = addresses.filter(a => a.id !== id);
    // If we deleted the default, set first one as default
    if (newList.length > 0 && !newList.find(a => a.isDefault)) {
      newList[0].isDefault = true;
    }
    setAddresses(newList);
    updateProfile({ addresses: newList });
    Alert.alert(t('successTitle'), t('addressDeleted'));
  };

  const handleSetDefault = (id: string) => {
    const newList = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    setAddresses(newList);
    updateProfile({ addresses: newList });
    Alert.alert(t('successTitle'), t('defaultAddressSet'));
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert(t('error'), t('currentPasswordRequired'));
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert(t('error'), t('weakPassword'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('error'), t('passwordsDoNotMatch'));
      return;
    }

    try {
      setPassLoading(true);
      if (auth.currentUser && auth.currentUser.email) {
        // Re-authenticate user before updating password
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);

        await updatePassword(auth.currentUser, newPassword);

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert(t('successTitle'), t('passwordChanged'));
      }
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/wrong-password') {
        Alert.alert(t('error'), t('incorrectPassword'));
      } else if (e.code === 'auth/requires-recent-login') {
        Alert.alert(t('error'), "Session expired. Please logout and login again.");
      } else {
        Alert.alert(t('error'), t('failedToSave'));
      }
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
      {/* Animated Blur Header */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64 + insets.top,
        paddingTop: insets.top,
        borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: appColors.background + '66' }]} />
        </Animated.View>

        <View style={[styles.modernHeader, { borderBottomWidth: 0, backgroundColor: 'transparent' }]}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#17171F' : '#F2F2F7' }]}
          >
            <ChevronLeft size={20} color={appColors.foreground} />
          </TouchableOpacity>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.modernLogo, { color: appColors.foreground }]}>{t('preferences')}</Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 25, paddingTop: 64 + insets.top, paddingBottom: 100 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ position: 'relative' }}>
            <View style={[styles.profileAvatarLarge, { backgroundColor: theme === 'dark' ? '#17171F' : '#F2F2F7', borderWidth: 1, borderColor: appColors.border }]}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.fullAvatar} />
              ) : (
                <User size={40} color={appColors.textMuted} />
              )}
            </View>
            <TouchableOpacity
              style={[styles.avatarEditBadge, { backgroundColor: appColors.foreground, borderColor: appColors.background }]}
              onPress={handlePickImage}
              disabled={uploading}
              activeOpacity={0.8}
            >
              {uploading ? <ActivityIndicator size="small" color={theme === 'dark' ? '#000' : '#FFF'} /> : <Camera size={14} color={theme === 'dark' ? '#000' : '#FFF'} />}
            </TouchableOpacity>
          </View>
          <Text style={{ marginTop: 15, fontSize: 11, fontWeight: '900', color: appColors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>{t('changeAvatar')}</Text>
        </View>

        {/* Personal Info Section */}
        <View style={[styles.settingsSectionPremium, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border, borderWidth: 1 }]}>
          <Text style={[styles.settingsLabel, { color: appColors.foreground }]}>{t('personalData')}</Text>
          <View style={styles.premiumInputGroup}>
            <Text style={[styles.inputLabelField, { color: appColors.textMuted }]}>{t('fullName')}</Text>
            <TextInput
              style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border, borderWidth: 1 }]}
              placeholder={t('fullName')}
              placeholderTextColor={appColors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>
          <View style={styles.premiumInputGroup}>
            <Text style={[styles.inputLabelField, { color: appColors.textMuted }]}>{t('contactNumber')}</Text>
            <TextInput
              style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border, borderWidth: 1 }]}
              placeholder="+216 -- --- ---"
              placeholderTextColor={appColors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtnPremium, { backgroundColor: theme === 'dark' ? '#FFF' : '#000', marginTop: 10 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} /> : <Text style={[styles.saveBtnPremiumText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('updateProfile')}</Text>}
          </TouchableOpacity>
        </View>

        {/* Addresses Section */}
        <View style={[styles.settingsSectionPremium, { marginTop: 25, backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border, borderWidth: 1 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={[styles.settingsLabel, { marginBottom: 0, color: appColors.foreground }]}>{t('manageAddresses')}</Text>
            {!showAddressForm && (
              <TouchableOpacity onPress={() => setShowAddressForm(true)}>
                <Plus size={20} color={appColors.accent} />
              </TouchableOpacity>
            )}
          </View>

          {showAddressForm && (
            <View style={{ marginBottom: 20 }}>
              <TextInput
                style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border, borderWidth: 1, minHeight: 80, textAlignVertical: 'top', paddingTop: 15 }]}
                placeholder={t('defaultAddress')}
                placeholderTextColor={appColors.textMuted}
                value={tempAddress}
                onChangeText={setTempAddress}
                multiline
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity onPress={() => setShowAddressForm(false)} style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: appColors.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontWeight: '800', fontSize: 12, color: appColors.textMuted }}>{t('cancel').toUpperCase()}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddAddress} style={{ flex: 2, height: 44, borderRadius: 12, backgroundColor: appColors.foreground, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontWeight: '800', fontSize: 12, color: theme === 'dark' ? '#000' : '#FFF' }}>{t('addAddress').toUpperCase()}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {addresses.map((addr) => (
            <View key={addr.id} style={{ marginBottom: 15, padding: 15, borderRadius: 16, backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', borderWidth: 1, borderColor: addr.isDefault ? appColors.accent : appColors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color={addr.isDefault ? appColors.accent : appColors.textMuted} />
                  {addr.isDefault && <Text style={{ fontSize: 9, fontWeight: '900', color: appColors.accent, letterSpacing: 1 }}>{t('setAsDefault').toUpperCase()}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleDeleteAddress(addr.id)}>
                  <Trash2 size={16} color={appColors.error} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 13, color: appColors.foreground, lineHeight: 18 }}>{addr.text}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: addr.isDefault ? appColors.accent : appColors.textMuted }}>{t('setAsDefault').toUpperCase()}</Text>
                <TouchableOpacity
                  onPress={() => !addr.isDefault && handleSetDefault(addr.id)}
                  style={[styles.customSwitch, addr.isDefault && { backgroundColor: appColors.foreground }]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.switchDot, addr.isDefault && [styles.switchDotActive, { backgroundColor: theme === 'dark' ? '#000' : '#FFF' }]]} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Change Password Section */}
        <View style={[styles.settingsSectionPremium, { marginTop: 25, backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border, borderWidth: 1 }]}>
          <Text style={[styles.settingsLabel, { color: appColors.foreground }]}>{t('changePassword')}</Text>

          <View style={styles.premiumInputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Lock size={14} color={appColors.textMuted} />
              <Text style={[styles.inputLabelField, { color: appColors.textMuted, marginBottom: 0 }]}>{t('currentPasswordRequired')}</Text>
            </View>
            <View style={{ position: 'relative', justifyContent: 'center' }}>
              <TextInput
                style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border, borderWidth: 1, paddingRight: 50 }]}
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="••••••••"
                placeholderTextColor={appColors.textMuted}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 15, height: '100%', justifyContent: 'center' }}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={18} color={appColors.textMuted} /> : <Eye size={18} color={appColors.textMuted} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.premiumInputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Lock size={14} color={appColors.textMuted} />
              <Text style={[styles.inputLabelField, { color: appColors.textMuted, marginBottom: 0 }]}>{t('newPassword')}</Text>
            </View>
            <View style={{ position: 'relative', justifyContent: 'center' }}>
              <TextInput
                style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border, borderWidth: 1, paddingRight: 50 }]}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
                placeholderTextColor={appColors.textMuted}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 15, height: '100%', justifyContent: 'center' }}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} color={appColors.textMuted} /> : <Eye size={18} color={appColors.textMuted} />}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.premiumInputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Check size={14} color={appColors.textMuted} />
              <Text style={[styles.inputLabelField, { color: appColors.textMuted, marginBottom: 0 }]}>{t('confirmPassword')}</Text>
            </View>
            <View style={{ position: 'relative', justifyContent: 'center' }}>
              <TextInput
                style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border, borderWidth: 1, paddingRight: 50 }]}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={appColors.textMuted}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 15, height: '100%', justifyContent: 'center' }}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} color={appColors.textMuted} /> : <Eye size={18} color={appColors.textMuted} />}
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.saveBtnPremium, { backgroundColor: theme === 'dark' ? '#FFF' : '#000', marginTop: 10 }]}
            onPress={handleChangePassword}
            disabled={passLoading}
          >
            {passLoading ? <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} /> : <Text style={[styles.saveBtnPremiumText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('updateAccount').toUpperCase()}</Text>}
          </TouchableOpacity>
        </View>

        <View style={[styles.settingsSectionPremium, { marginTop: 25, backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border, borderWidth: 1 }]}>
          <Text style={[styles.settingsLabel, { color: appColors.foreground }]}>{t('appNotifications')}</Text>
          <View style={[styles.settingsRowSwitch, { borderBottomColor: appColors.border }]}>
            <View style={{ flex: 1, paddingRight: 20 }}>
              <Text style={[styles.switchTitle, { color: appColors.foreground }]}>{t('pushNotifications')}</Text>
              <Text style={[styles.switchSub, { color: appColors.textMuted }]}>{t('orderStatusDrops')}</Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                const newValue = !notifications;
                if (newValue) {
                  const permission = await registerForPushNotificationsAsync();
                  if (!permission) {
                    const isExpoGo = Constants.appOwnership === 'expo';
                    const message = (isExpoGo && Platform.OS === 'android')
                      ? t('devBuildRequired')
                      : (t('failedToSave') || 'Could not enable notifications');
                    Alert.alert(t('error'), message);
                    return;
                  }
                }
                setNotifications(newValue);
              }}
              style={[styles.customSwitch, notifications && { backgroundColor: appColors.foreground }]}
              activeOpacity={0.8}
            >
              <View style={[styles.switchDot, notifications && [styles.switchDotActive, { backgroundColor: theme === 'dark' ? '#000' : '#FFF' }]]} />
            </TouchableOpacity>
          </View>

          <View style={[styles.settingsRowSwitch, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, paddingRight: 20 }}>
              <Text style={[styles.switchTitle, { color: appColors.foreground }]}>{t('biometricAuth')}</Text>
              <Text style={[styles.switchSub, { color: appColors.textMuted }]}>
                {t('useBiometricToPay').replace('{{type}}', biometricType || 'Biometrics')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                const newValue = !faceId;
                if (newValue) {
                  try {
                    const hasHardware = await LocalAuthentication.hasHardwareAsync();
                    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

                    if (!hasHardware || !isEnrolled) {
                      Alert.alert(t('error'), "Biometric authentication is not available on this device.");
                      return;
                    }

                    const result = await LocalAuthentication.authenticateAsync({
                      promptMessage: Platform.OS === 'ios' ? 'FaceID / TouchID' : 'Biometric Auth',
                      fallbackLabel: t('usePasscode') || 'Use Passcode',
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
              style={[styles.customSwitch, faceId && { backgroundColor: appColors.foreground }]}
              activeOpacity={0.8}
            >
              <View style={[styles.switchDot, faceId && [styles.switchDotActive, { backgroundColor: theme === 'dark' ? '#000' : '#FFF' }]]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.settingsSectionPremium, { marginTop: 25, backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border, borderWidth: 1 }]}>
          <Text style={[styles.settingsLabel, { color: appColors.foreground }]}>{t('supportLegal')}</Text>
          <TouchableOpacity style={[styles.settingsRowMinimal, { borderBottomColor: appColors.border }]} onPress={() => onNavigate('Chat')}>
            <MessageCircle size={16} color={appColors.accent} style={{ marginRight: 12 }} />
            <Text style={[styles.settingsRowTextMinimal, { color: appColors.foreground, flex: 1 }]}>{t('support')}</Text>
            <ChevronRight size={16} color={appColors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingsRowMinimal, { borderBottomColor: appColors.border }]} onPress={() => onNavigate('PrivacyPolicy')}>
            <Text style={[styles.settingsRowTextMinimal, { color: appColors.foreground }]}>{t('privacyPolicy')}</Text>
            <ChevronRight size={16} color={appColors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingsRowMinimal, { borderBottomColor: appColors.border }]} onPress={() => onNavigate('TermsOfService')}>
            <Text style={[styles.settingsRowTextMinimal, { color: appColors.foreground }]}>{t('termsOfService')}</Text>
            <ChevronRight size={16} color={appColors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingsRowMinimal, { borderBottomWidth: 0 }]} activeOpacity={1}>
            <Text style={[styles.settingsRowTextMinimal, { color: appColors.foreground }]}>{t('appVersion')}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: appColors.textMuted }}>v1.0.4</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.deactivateBtn, { backgroundColor: theme === 'dark' ? 'rgba(255,69,58,0.1)' : '#FFF5F5' }]} activeOpacity={0.8}>
          <Trash2 size={16} color={appColors.error} />
          <Text style={[styles.deactivateBtnText, { color: appColors.error }]}>{t('deactivateAccount')}</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function ProductDetailScreen({ product, onBack, onAddToCart, toggleWishlist, isWishlisted, onSizeGuide, user, profileData, t, language, theme: propTheme }: any) {
  const { colors, theme } = useAppTheme();
  const currentTheme = propTheme || theme;
  const currentLang = language || 'fr';

  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  const [activeImg, setActiveImg] = useState(0);

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const getName = (field: any) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[currentLang === 'ar' ? 'ar-tn' : currentLang] || field[currentLang] || field['fr'] || field['en'] || Object.values(field)[0] || '';
  };

  const translateColor = (color: string) => {
    if (!color) return '';
    const colorsMap: any = {
      red: { fr: 'Rouge', ar: 'أحمر', en: 'Red' },
      blue: { fr: 'Bleu', ar: 'أزرق', en: 'Blue' },
      green: { fr: 'Vert', ar: 'أخضر', en: 'Green' },
      black: { fr: 'Noir', ar: 'أسود', en: 'Black' },
      white: { fr: 'Blanc', ar: 'أبيض', en: 'White' },
      yellow: { fr: 'Jaune', ar: 'أصفر', en: 'Yellow' },
      grey: { fr: 'Gris', ar: 'رمادي', en: 'Grey' },
      gray: { fr: 'Gris', ar: 'رمادي', en: 'Gray' },
      purple: { fr: 'Violet', ar: 'بنفسجي', en: 'Purple' },
      pink: { fr: 'Rose', ar: 'وردي', en: 'Pink' },
      orange: { fr: 'Orange', ar: 'برتقالي', en: 'Orange' },
      brown: { fr: 'Marron', ar: 'بني', en: 'Brown' },
      beige: { fr: 'Beige', ar: 'بيج', en: 'Beige' },
      olive: { fr: 'Olive', ar: 'زيتوني', en: 'Olive' },
    };
    const key = color.toLowerCase();
    const langKey = currentLang === 'ar-tn' ? 'ar' : (currentLang || 'fr');
    return colorsMap[key]?.[langKey] || colorsMap[key]?.[currentLang === 'ar' ? 'ar' : currentLang] || color;
  };

  // Fix: Remove duplicate images - mainImage is already in images array
  const allImages = product.images && product.images.length > 0
    ? product.images
    : product.mainImage
      ? [product.mainImage]
      : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Blur Header */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64 + insets.top,
        paddingTop: insets.top,
        borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        borderBottomColor: currentTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={currentTheme} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '66' }]} />
        </Animated.View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 }}>
          <TouchableOpacity
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: currentTheme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' }}
            onPress={onBack}
          >
            <X size={22} color={colors.foreground} strokeWidth={2.5} />
          </TouchableOpacity>

          <AnimatedAppText
            numberOfLines={1}
            style={[styles.modernLogo, { flex: 1, textAlign: 'center', marginHorizontal: 15, opacity: headerOpacity, color: colors.foreground, fontSize: 16 }]}
          >
            {getName(product.name).toUpperCase()}
          </AnimatedAppText>

          <TouchableOpacity
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: currentTheme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => toggleWishlist(product.id)}
          >
            <Heart
              size={22}
              color={isWishlisted ? colors.error : colors.foreground}
              fill={isWishlisted ? colors.error : 'none'}
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
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Image Gallery */}
        <View style={{ position: 'relative' }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => setActiveImg(Math.round(e.nativeEvent.contentOffset.x / width))}
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
          </ScrollView>

          {/* Image Pagination Dots */}
          {allImages.length > 1 && (
            <View style={styles.imagePagination}>
              {allImages.map((_: string, idx: number) => (
                <View
                  key={idx}
                  style={[styles.paginationDot, activeImg === idx && styles.activePaginationDot, activeImg === idx && { backgroundColor: theme === 'dark' ? '#FFF' : '#000' }]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Details Content */}
        <Animatable.View animation="fadeInUp" duration={800} style={[styles.detailBottomContent, { backgroundColor: colors.background }]}>
          {/* Drag Indicator */}
          <View style={[styles.dragIndicator, { backgroundColor: theme === 'dark' ? '#333' : '#E5E5EA' }]} />

          {/* Brand & Product Name */}
          <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Text style={[styles.detailBrandName, { color: colors.textMuted, marginBottom: 0 }]}>{String(translateCategory(getName(product.category)) || 'CATEGORY').toUpperCase()}</Text>
            <Text style={{ color: colors.border, fontSize: 12 }}>|</Text>
            <Text style={[styles.detailBrandName, { color: colors.textMuted, marginBottom: 0 }]}>{String(getName(product.brandName) || 'PREMIUM').toUpperCase()}</Text>
          </View>
          <Text style={[styles.detailProductName, { color: colors.foreground }]}>{String(getName(product.name)).toUpperCase()}</Text>

          {/* Price */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 }}>
            <Text style={[styles.detailProductPrice, { color: colors.foreground, marginBottom: 0 }]}>
              {(product.discountPrice && product.discountPrice < product.price) ? product.discountPrice.toFixed(2) : product.price.toFixed(2)} TND
            </Text>
            {(product.discountPrice && product.discountPrice < product.price) && (
              <Text style={{ fontSize: 16, color: colors.textMuted, textDecorationLine: 'line-through' }}>
                {product.price.toFixed(2)} TND
              </Text>
            )}
            {(product.discountPrice && product.discountPrice < product.price) && (
              <View style={{ backgroundColor: colors.error + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: colors.error, fontSize: 12, fontWeight: '800' }}>
                  -{Math.round((1 - product.discountPrice / product.price) * 100)}%
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.detailGlassDivider, { backgroundColor: colors.border }]} />

          {/* Color Selector */}
          {product.colors && product.colors.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.modernDetailLabel, { color: colors.foreground }]}>{t('color')}</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' }}>
                  {translateColor(selectedColor)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                {product.colors.map((c: string) => {
                  // Normalize color - React Native needs lowercase for color names
                  const displayColor = c.startsWith('#') ? c : c.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setSelectedColor(c)}
                      style={{ alignItems: 'center' }}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: displayColor,
                          borderWidth: selectedColor === c ? 2 : 1,
                          borderColor: selectedColor === c
                            ? colors.foreground
                            : ((displayColor === 'black' || displayColor === '#000' || displayColor === '#000000')
                              ? 'rgba(255,255,255,0.3)'
                              : colors.border),
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
              <Text style={[styles.modernDetailLabel, { color: colors.foreground }]}>{t('size')}</Text>
              <TouchableOpacity onPress={onSizeGuide}>
                <Text style={[styles.sizeGuideText, { color: colors.textMuted }]}>{t('sizeGuide')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modernSizeGrid}>
              {(product.sizes && product.sizes.length > 0 ? product.sizes : ['XS', 'S', 'M', 'L', 'XL']).map((s: string) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSelectedSize(s)}
                  style={[
                    styles.modernSizeBtn,
                    { borderColor: s === selectedSize ? colors.foreground : colors.border },
                    s === selectedSize && { backgroundColor: theme === 'dark' ? 'white' : 'black' }
                  ]}
                >
                  <Text style={[
                    styles.modernSizeText,
                    { color: s === selectedSize ? (theme === 'dark' ? 'black' : 'white') : colors.foreground }
                  ]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.modernDetailLabel, { marginBottom: 8, color: colors.foreground }]}>{t('description')}</Text>
            <Text style={[styles.detailDescriptionText, { color: colors.foreground }]}>{getName(product.description)}</Text>
          </View>

          {/* Delivery Info */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 12,
            paddingHorizontal: 12,
            backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9F9',
            borderRadius: 12,
            marginBottom: 15
          }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme === 'dark' ? '#000' : 'white',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Package size={16} color={colors.foreground} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.foreground }}>
                {product.deliveryPrice && product.deliveryPrice > 0
                  ? `${t('delivery')} ${product.deliveryPrice.toFixed(2)} TND`
                  : t('freeDelivery')}
              </Text>
              <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '500', marginTop: 5 }}>
                {t('deliveryTime')}
              </Text>
            </View>
          </View>

          {/* Reviews Section */}
          <View style={{ marginTop: 5, marginBottom: 20 }}>
            <Text style={[styles.modernDetailLabel, { marginBottom: 12, color: colors.foreground }]}>{t('reviews')}</Text>
            <ProductReviews productId={product.id} user={user} profileData={profileData} t={t} />
          </View>

          {/* Add to Bag Button */}
          <TouchableOpacity
            style={[styles.mainActionBtn, {
              backgroundColor: product.status === 'sold_out' ? (theme === 'dark' ? '#333' : '#CCC') : (theme === 'dark' ? '#FFFFFF' : '#000000'),
              opacity: product.status === 'sold_out' ? 0.7 : 1
            }]}
            onPress={() => onAddToCart(product, selectedSize, selectedColor)}
            disabled={product.status === 'sold_out'}
            activeOpacity={0.8}
          >
            <Text style={[styles.mainActionBtnText, { color: product.status === 'sold_out' ? (theme === 'dark' ? '#888' : '#666') : (theme === 'dark' ? '#000' : '#FFF') }]}>
              {product.status === 'sold_out' ? t('soldOut').toUpperCase() : `${t('addToCart')} — ${product.price.toFixed(2)} TND`}
            </Text>
          </TouchableOpacity>
          <View style={{ height: 50 }} />
        </Animatable.View>
      </Animated.ScrollView>
    </View>
  );
}

function CampaignDetailScreen({ campaign, onBack, onProductPress, onCategoryPress, t }: any) {
  const { colors, theme } = useAppTheme();
  const [targetProduct, setTargetProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaign.targetType === 'product' && campaign.targetId) {
      fetchProduct();
    }
  }, [campaign]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const pDoc = await getDoc(doc(db, 'products', campaign.targetId));
      if (pDoc.exists()) {
        setTargetProduct({ id: pDoc.id, ...pDoc.data() });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAction = () => {
    if (campaign.targetType === 'product' && targetProduct) {
      onProductPress(targetProduct);
    } else if (campaign.targetType === 'category' && campaign.targetId) {
      onCategoryPress(campaign.targetId);
    } else if (campaign.link) {
      // Legacy support
      onCategoryPress(campaign.link);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ height: height * 0.7, width: '100%' }}>
          {campaign.type === 'video' ? (
            <Video
              source={{ uri: campaign.url }}
              style={{ width: '100%', height: '100%' }}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
          ) : (
            <Image source={{ uri: campaign.url }} style={{ width: '100%', height: '100%' }} />
          )}

          <TouchableOpacity style={[styles.glassBackBtn, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)' }]} onPress={onBack}>
            <X size={24} color={colors.foreground} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <Animatable.View animation="fadeInUp" duration={800} style={[styles.campaignContent, { backgroundColor: colors.background }]}>
          <Text style={[styles.campaignTitle, { color: colors.foreground }]}>{getName(campaign.title).toUpperCase()}</Text>
          <View style={[styles.campaignDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.campaignDesc, { color: colors.foreground }]}>{getName(campaign.description) || 'Curated fashion and artistry, designed for the modern individual. Experience the fusion of minimalist design and premium materials.'}</Text>

          {(campaign.targetType !== 'none') && (
            <TouchableOpacity style={[styles.campaignMainBtn, { backgroundColor: colors.foreground }]} onPress={handleAction}>
              {loading ? (
                <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} />
              ) : (
                <Text style={[styles.campaignBtnText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>
                  {campaign.targetType === 'product' ? t('viewProduct') : t('exploreCollection')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </Animatable.View>
      </ScrollView>
    </View>
  );
}

function ProductReviews({ productId, user, profileData, t }: { productId: string, user: any, profileData: any, t: any }) {
  const { colors, theme } = useAppTheme();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editComment, setEditComment] = useState('');
  const [editRating, setEditRating] = useState(5);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'reviews'), where('productId', '==', productId));
      const snap = await getDocs(q);
      const reviewsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReviews(reviewsData);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleDelete = (reviewId: string) => {
    Alert.alert(
      t('deleteReview'),
      t('confirmDeleteReview'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('delete'),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'reviews', reviewId));
              setReviews(prev => prev.filter(r => r.id !== reviewId));
              await updateProductRating(productId);
            } catch (err) {
              Alert.alert(t('cancel'), t('reviewFailed'));
            }
          }
        }
      ]
    );
  };

  const startEdit = (review: any) => {
    setEditingReview(review.id);
    setEditComment(review.comment);
    setEditRating(review.rating);
  };

  const handleUpdate = async () => {
    if (!editingReview) return;
    try {
      await updateDoc(doc(db, 'reviews', editingReview), {
        comment: editComment,
        rating: editRating,
        updatedAt: serverTimestamp()
      });
      setReviews(prev => prev.map(r => r.id === editingReview ? { ...r, comment: editComment, rating: editRating } : r));
      setEditingReview(null);
      await updateProductRating(productId);
    } catch (err) {
      Alert.alert(t('cancel'), t('reviewFailed'));
    }
  };

  if (loading) return <ActivityIndicator color={colors.foreground} />;
  if (reviews.length === 0) return <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t('noReviews')}</Text>;

  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  const isAdminOrAuthor = (review: any) => {
    if (!user) return { isOwner: false, isAdmin: false };
    const isOwner = review.userId === user.uid;
    const isAdmin = ['admin', 'editor'].includes(profileData?.role);
    return { isOwner, isAdmin };
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 48, fontWeight: '900', color: colors.foreground, marginRight: 10 }}>{avgRating.toFixed(1)}</Text>
        <View>
          <View style={{ flexDirection: 'row' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={16} color={s <= Math.round(avgRating) ? "#FFD700" : (theme === 'dark' ? '#222' : '#EEE')} fill={s <= Math.round(avgRating) ? "#FFD700" : (theme === 'dark' ? '#222' : '#EEE')} />
            ))}
          </View>
          <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 4 }}>{reviews.length} {t('ratings')}</Text>
        </View>
      </View>

      {reviews.map((r, i) => {
        const { isOwner, isAdmin } = isAdminOrAuthor(r);
        const isEditing = editingReview === r.id;

        return (
          <View key={r.id || i} style={{
            marginBottom: 20, paddingBottom: 20
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontWeight: '700', fontSize: 13, color: colors.foreground }}>{r.userName || t('customer')}</Text>
                {(!isEditing && (isOwner || isAdmin)) && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {isOwner && (
                      <TouchableOpacity onPress={() => startEdit(r)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Edit size={14} color={colors.accent} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleDelete(r.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Trash2 size={14} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : 'Recent'}</Text>
            </View>

            {isEditing ? (
              <View style={{ marginTop: 10 }}>
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <TouchableOpacity key={s} onPress={() => setEditRating(s)}>
                      <Star size={20} color={s <= editRating ? "#FFD700" : (theme === 'dark' ? '#222' : '#EEE')} fill={s <= editRating ? "#FFD700" : (theme === 'dark' ? '#222' : '#EEE')} />
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
                    backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9F9',
                    color: colors.foreground,
                    minHeight: 60,
                    textAlignVertical: 'top'
                  }}
                  value={editComment}
                  onChangeText={setEditComment}
                  multiline
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <TouchableOpacity
                    onPress={handleUpdate}
                    style={{ backgroundColor: colors.foreground, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 }}
                  >
                    <Text style={{ color: theme === 'dark' ? '#000' : '#FFF', fontSize: 11, fontWeight: '800' }}>SAVE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditingReview(null)}
                    style={{ backgroundColor: theme === 'dark' ? '#333' : '#EEE', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 }}
                  >
                    <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '800' }}>CANCEL</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={12} color={s <= r.rating ? "#FFD700" : (theme === 'dark' ? '#222' : '#EEE')} fill={s <= r.rating ? "#FFD700" : (theme === 'dark' ? '#222' : '#EEE')} />
                  ))}
                </View>
                <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>{r.comment}</Text>


              </>
            )}
          </View>
        );
      })}
    </View>
  );
}


function ShopScreen({ onProductPress, initialCategory, initialBrand, setInitialBrand, wishlist, toggleWishlist, addToCart, onBack, t, theme, language }: any) {
  const { colors } = useAppTheme();

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState(initialCategory || null);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand || null);
  const [brands, setBrands] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    setSelectedCat(initialCategory || null);
    setSelectedBrand(initialBrand || null);
  }, [initialCategory, initialBrand]);

  useEffect(() => {
    fetchData();
  }, [selectedCat, selectedBrand]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch products
      let q = query(collection(db, 'products'));
      if (selectedCat) {
        q = query(collection(db, 'products'), where('categoryId', '==', selectedCat));
      } else if (selectedBrand) {
        q = query(collection(db, 'products'), where('brandId', '==', selectedBrand));
      }
      const prodSnap = await getDocs(q);
      const prodList = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(prodList);

      // Fetch categories if not loaded
      if (categories.length === 0) {
        const catSnap = await getDocs(collection(db, 'categories'));
        setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      // Fetch brands if not loaded (only active brands)
      if (brands.length === 0) {
        const brandsSnap = await getDocs(collection(db, 'brands'));
        const allBrands: any[] = brandsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter to only show active brands
        const activeBrands = allBrands.filter((b: any) => b.isActive !== false);
        setBrands(activeBrands);
      }
    } catch (error) {
      console.error("Error fetching shop data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = getName(p.name).toLowerCase().includes(search.toLowerCase());
    const matchesColor = !selectedColor || p.colors?.includes(selectedColor);
    const matchesSize = !selectedSize || p.sizes?.includes(selectedSize);
    return matchesSearch && matchesColor && matchesSize;
  });

  const sortedProducts = [...filteredProducts].sort((a: any, b: any) => {
    if (sortBy === 'priceLowHigh') return a.price - b.price;
    if (sortBy === 'priceHighLow') return b.price - a.price;
    if (sortBy === 'newest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    return 0;
  });

  const availableColors = Array.from(new Set(products.flatMap(p => p.colors || [])));
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'].filter(s =>
    products.some(p => p.sizes?.includes(s))
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Animated Blur Header */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 190 + insets.top,
        paddingTop: insets.top,
        borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        elevation: 10, // Ensure header is above scroll content on Android
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '66' }]} />
        </Animated.View>

        <View style={styles.modernHeader}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text pointerEvents="none" style={[styles.modernLogo, { letterSpacing: 4, color: colors.foreground }]}>{t('shop')}</Text>
          <TouchableOpacity style={[styles.searchCircle, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} activeOpacity={0.7} onPress={() => setShowSortSheet(true)}>
            <Sliders size={18} color={colors.foreground} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Fixed Search and Categories in Header */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 10, zIndex: 1000 }}>
          <View style={[
            styles.searchBar,
            {
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderColor: isSearchFocused ? colors.foreground : (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 15,
              marginBottom: 12,
              height: 50,
              borderRadius: 25,
              elevation: 5, // Static elevation to avoid focus loss on Android
              shadowColor: colors.foreground,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isSearchFocused ? 0.2 : 0,
              shadowRadius: isSearchFocused ? 10 : 0,
            }
          ]}>
            <Search size={18} color={isSearchFocused ? colors.foreground : '#888'} style={{ marginRight: 10 }} />
            <TextInput
              style={{
                flex: 1,
                height: '100%',
                color: colors.foreground,
                fontSize: 14,
                fontWeight: '600'
              }}
              placeholder={t('searchCollections')}
              placeholderTextColor="#888"
              value={search}
              onChangeText={setSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}
          >
            {/* Categories */}
            <TouchableOpacity
              style={[
                styles.catChip,
                { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', borderRadius: 20, height: 32, paddingHorizontal: 16 },
                !selectedCat && { backgroundColor: colors.foreground }
              ]}
              onPress={() => setSelectedCat(null)}
            >
              <Text style={[styles.catChipText, { fontSize: 11, fontWeight: '700', color: colors.textMuted }, !selectedCat && { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('all')}</Text>
            </TouchableOpacity>

            {categories.map((cat, index) => {
              const categoryColors = ['#FF6B6B', '#4ECDC4', '#3498DB', '#FFEEAD', '#96CEB4', , '#D4A5A5', '#9B59B6', , '#45B7D1', '#E67E22'];
              const catColor = categoryColors[index % categoryColors.length];
              const isActive = selectedCat === cat.id;

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: isActive ? catColor : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F2F2F7'),
                      borderRadius: 20,
                      height: 32,
                      paddingHorizontal: 16,
                      borderWidth: isActive ? 2 : 0,
                      borderColor: isActive ? catColor : 'transparent'
                    }
                  ]}
                  onPress={() => setSelectedCat(cat.id)}
                >
                  <Text style={[
                    styles.catChipText,
                    {
                      color: isActive ? '#FFF' : (theme === 'dark' ? '#888' : '#666'),
                      fontSize: 11,
                      fontWeight: '700'
                    }
                  ]}>
                    {translateCategory(getName(cat.name)).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Divider and Brands */}
            {brands.length > 0 && (
              <>
                <View style={{ width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 4 }} />

                <TouchableOpacity
                  style={[
                    styles.catChip,
                    { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', borderRadius: 20, height: 32, paddingHorizontal: 16 },
                    !selectedBrand && { backgroundColor: colors.foreground }
                  ]}
                  onPress={() => setSelectedBrand(null)}
                >
                  <Text style={[styles.catChipText, { fontSize: 11, fontWeight: '700' }, !selectedBrand ? { color: theme === 'dark' ? '#000' : '#FFF' } : { color: colors.textMuted }]}>{t('brands').toUpperCase()}</Text>
                </TouchableOpacity>

                {brands.map(b => (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.catChip,
                      { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', borderRadius: 20, height: 32, paddingHorizontal: 16, borderColor: selectedBrand === b.id ? colors.foreground : 'transparent' },
                      selectedBrand === b.id && { backgroundColor: colors.foreground }
                    ]}
                    onPress={() => setSelectedBrand(b.id)}
                  >
                    <Text style={[styles.catChipText, { fontSize: 11, fontWeight: '600' }, selectedBrand === b.id ? { color: theme === 'dark' ? '#000' : '#FFF' } : { color: colors.textMuted }]}>
                      {getName(b.name).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            <View style={{ width: 40 }} />
          </ScrollView>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 190 + insets.top }}
      >
        <View style={{ height: 1, backgroundColor: colors.border }} />

        {loading ? (
          <View style={{ marginTop: 100 }}>
            <ActivityIndicator color={colors.foreground} />
          </View>
        ) : sortedProducts.length === 0 ? (
          <View style={[styles.centered, { marginTop: 100, backgroundColor: colors.background }]}>
            <ShoppingBag size={64} color={theme === 'dark' ? '#222' : '#EEE'} strokeWidth={1.5} />
            <Text style={[styles.modernSectionTitle, { marginTop: 20, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 }]}>
              {t('noProductsInCategory')}
            </Text>
          </View>
        ) : (
          <View style={[styles.modernGrid, { marginTop: 25 }]}>
            {sortedProducts.map((p: any) => (
              <ProductCard
                key={p.id}
                product={p}
                onPress={() => onProductPress(p)}
                isWishlisted={wishlist?.includes(p.id)}
                onToggleWishlist={() => toggleWishlist(p.id)}
                onAddToCart={() => addToCart(p)}
                showRating={true}
                theme={theme}
                language={language}
                t={t}
              />
            ))}
          </View>
        )}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Sort Sheet Modal */}
      <Modal visible={showSortSheet} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => setShowSortSheet(false)}
          />
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 25, paddingBottom: 50 }}>
            <View style={{ width: 40, height: 5, backgroundColor: theme === 'dark' ? '#333' : '#E5E5EA', borderRadius: 5, alignSelf: 'center', marginBottom: 25 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', letterSpacing: 1, color: colors.foreground }}>{t('filtersSort')}</Text>
              <TouchableOpacity onPress={() => {
                setSortBy(null);
                setSelectedColor(null);
                setSelectedSize(null);
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.error }}>{t('clearAll')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.6 }}>
              {/* Sort Section */}
              <Text style={[styles.settingsLabel, { color: colors.textMuted }]}>{t('sortBy')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 }}>
                {[
                  { label: t('newest'), value: 'newest' },
                  { label: t('priceLowHigh'), value: 'priceLowHigh' },
                  { label: t('priceHighLow'), value: 'priceHighLow' }
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: sortBy === opt.value ? colors.foreground : (theme === 'dark' ? '#17171F' : '#F2F2F7'),
                        borderColor: sortBy === opt.value ? colors.foreground : colors.border
                      }
                    ]}
                    onPress={() => setSortBy(opt.value)}
                  >
                    <Text style={[
                      styles.catChipText,
                      { color: sortBy === opt.value ? (theme === 'dark' ? '#000' : '#FFF') : colors.textMuted }
                    ]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Color Section */}
              {availableColors.length > 0 && (
                <>
                  <Text style={[styles.settingsLabel, { color: colors.textMuted }]}>{t('colors')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 }}>
                    {availableColors.map((c: string) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setSelectedColor(selectedColor === c ? null : c)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          backgroundColor: c.startsWith('#') ? c : c.toLowerCase(),
                          borderWidth: 2,
                          borderColor: selectedColor === c ? colors.foreground : (theme === 'dark' ? '#333' : '#EEE'),
                          padding: 2,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: c.startsWith('#') ? c : c.toLowerCase(),
                          borderWidth: 1,
                          borderColor: (c.toLowerCase() === 'black' || c === '#000' || c === '#000000')
                            ? 'rgba(255,255,255,0.3)'
                            : 'rgba(0,0,0,0.1)'
                        }} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Size Section */}
              {availableSizes.length > 0 && (
                <>
                  <Text style={[styles.settingsLabel, { color: colors.textMuted }]}>{t('sizes')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                    {availableSizes.map((s: string) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setSelectedSize(selectedSize === s ? null : s)}
                        style={[
                          styles.modernSizeBtn,
                          { borderColor: selectedSize === s ? colors.foreground : colors.border },
                          selectedSize === s && { backgroundColor: colors.foreground }
                        ]}
                      >
                        <Text style={[
                          styles.modernSizeText,
                          { color: colors.foreground },
                          selectedSize === s && { color: theme === 'dark' ? '#000' : '#FFF' }
                        ]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.mainActionBtn, { marginTop: 20, backgroundColor: theme === 'dark' ? '#FFFFFF' : '#000000' }]}
              onPress={() => setShowSortSheet(false)}
            >
              <Text style={[styles.mainActionBtnText, { color: theme === 'dark' ? '#000' : '#FFF', fontSize: 13, fontWeight: '900' }]}>{t('showResults')} ({sortedProducts.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView >
  );
}

function CartScreen({ cart, onRemove, onUpdateQuantity, onComplete, profileData, updateProfile, onBack, t }: any) {
  const { colors, theme } = useAppTheme();
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(true);
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    const getBiometricType = async () => {
      try {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('FaceID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType(Platform.OS === 'ios' ? 'TouchID' : 'Fingerprint');
        } else {
          setBiometricType('Biometrics');
        }
      } catch (e) {
        setBiometricType('Biometrics');
      }
    };
    getBiometricType();
  }, []);

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const [name, setName] = useState(profileData?.fullName || auth.currentUser?.displayName || '');
  const [phone, setPhone] = useState(profileData?.phone || '');
  const [address, setAddress] = useState(profileData?.address || '');

  useEffect(() => {
    if (profileData) {
      if (!name) setName(profileData.fullName || '');
      if (!phone) setPhone(profileData.phone || '');
      if (!address) setAddress(profileData.address || '');
    }
  }, [profileData]);

  // Use discountPrice if available, otherwise use regular price
  const subtotal = cart.reduce((sum: number, item: any) => {
    const itemPrice = item.discountPrice ? Number(item.discountPrice) : Number(item.price);
    return sum + (itemPrice * (item.quantity || 1));
  }, 0);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);

  useEffect(() => {
    if (cart.length === 0) {
      setAppliedCoupon(null);
      setCouponCode('');
      setShowCouponInput(false);
    }
  }, [cart]);

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');

    const normalizedCode = couponCode.trim().toUpperCase();
    console.log('🔍 Validating coupon:', normalizedCode);

    try {
      // First, try case-insensitive search by fetching all active coupons
      const q = query(collection(db, 'coupons'), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);

      console.log('📦 Total active coupons found:', querySnapshot.size);

      // Find matching coupon (case-insensitive)
      const matchingDoc = querySnapshot.docs.find(doc => {
        const docCode = doc.data().code;
        const normalizedDocCode = String(docCode || '').trim().toUpperCase();
        console.log('  Comparing:', normalizedCode, 'with', normalizedDocCode);
        return normalizedDocCode === normalizedCode;
      });

      if (!matchingDoc) {
        console.log('❌ No matching coupon found');
        setCouponError(t('invalidCoupon'));
        return;
      }

      const coupon = { id: matchingDoc.id, ...matchingDoc.data() } as any;
      console.log('✅ Coupon found:', coupon.code, 'Type:', coupon.type);

      if (coupon.minOrder && subtotal < parseFloat(coupon.minOrder)) {
        console.log('❌ Minimum order not met:', subtotal, '<', coupon.minOrder);
        setCouponError(`${t('minOrder')}: ${coupon.minOrder} TND`);
        return;
      }

      if (coupon.type === 'bundle_price' && coupon.targetProductId) {
        const targetItem = cart.find((i: any) => i.id === coupon.targetProductId);
        if (!targetItem) {
          console.log('❌ Required product not in cart');
          setCouponError('Required product not in cart');
          return;
        }
      }

      console.log('🎉 Coupon applied successfully');
      setAppliedCoupon(coupon);
      setCouponCode('');
    } catch (err) {
      console.error('❌ Coupon validation error:', err);
      setCouponError(t('errorCoupon'));
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const calculateTotal = () => {
    let deliveryCost = cart.length > 0 ? Math.max(...cart.map((i: any) => (i.deliveryPrice !== undefined && i.deliveryPrice !== null) ? Number(i.deliveryPrice) : 7)) : 0;

    let discountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'free_shipping') {
        deliveryCost = 0;
      } else if (appliedCoupon.type === 'percentage') {
        discountAmount = subtotal * (parseFloat(appliedCoupon.value) / 100);
      } else if (appliedCoupon.type === 'fixed') {
        discountAmount = parseFloat(appliedCoupon.value);
      } else if (appliedCoupon.type === 'bundle_price' && appliedCoupon.targetProductId) {
        const targetItem = cart.find((i: any) => i.id === appliedCoupon.targetProductId);
        if (targetItem) {
          const qty = targetItem.quantity || 1;
          // Check for exact tier match first
          const tier = appliedCoupon.tiers?.find((t: any) => Number(t.qty) === qty);

          if (tier) {
            const originalPrice = Number(targetItem.price) * qty;
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
      total: (discountedSubtotal + deliveryCost).toFixed(3),
      deliveryCost,
      discountAmount,
      discountedSubtotal
    };
  };

  const { total, deliveryCost, discountAmount, discountedSubtotal } = calculateTotal();

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
          LocalAuth = require('expo-local-authentication');
        } catch (e) {
          console.warn('ExpoLocalAuthentication module not found in this build.');
        }

        if (LocalAuth && typeof LocalAuth.authenticateAsync === 'function') {
          const hasHardware = await LocalAuth.hasHardwareAsync();
          const isEnrolled = await LocalAuth.isEnrolledAsync();

          if (hasHardware && isEnrolled) {
            const authResult = await LocalAuth.authenticateAsync({
              promptMessage: t('useBiometricToPay').replace('{{type}}', biometricType || 'Biometrics'),
              fallbackLabel: t('password'),
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
      await addDoc(collection(db, 'orders'), {
        items: cart,
        total: parseFloat(total), // Use calculated local total with coupons
        subtotal: subtotal,
        discount: discountAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        deliveryCost: deliveryCost,
        status: 'pending',
        createdAt: serverTimestamp(),
        customer: {
          uid: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          fullName: name,
          phone,
          address
        }
      });
      setOrderDone(true);
      setTimeout(() => {
        onComplete();
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
        <Text style={[styles.modernSectionTitle, { marginTop: 25, fontSize: 18, color: colors.foreground }]}>{t('thankYou')}</Text>
        <Text style={{ color: colors.textMuted, marginTop: 10 }}>{t('preparingDelivery')}</Text>
      </View>
    );
  }








  if (cart.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ShoppingBag size={64} color={theme === 'dark' ? '#222' : '#EEE'} strokeWidth={1} />
        <Text style={[styles.modernSectionTitle, { marginTop: 20, color: colors.textMuted }]}>{t('emptyCart')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Animated Blur Header */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64 + insets.top,
        paddingTop: insets.top,
        borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '66' }]} />
        </Animated.View>

        <View style={[styles.modernHeader, { paddingLeft: 20, backgroundColor: 'transparent' }]}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', marginRight: 15 }]}>
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: colors.foreground }]}>{t('yourBag')} ({cart.length})</Text>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 64 + insets.top }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {cart.map((item: any) => (
            <View key={item.cartId} style={[styles.modernCartItem, { marginHorizontal: 4, marginBottom: 16, backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border, padding: 16 }]}>
              <Image
                source={{ uri: item.mainImage || item.image || item.imageUrl || 'https://images.unsplash.com/photo-1544022613-e87ef75a758a?w=400' }}
                style={styles.modernCartImg}
              />
              <View style={{ flex: 1, marginLeft: 14 }}>
                {/* Category Label */}
                {item.category && (
                  <Text style={{ fontSize: 9, fontWeight: '900', color: colors.accent, letterSpacing: 1, marginBottom: 4 }}>
                    {item.category.toUpperCase()}
                  </Text>
                )}

                {/* Title Row with Delete Button */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={[styles.modernCartName, { color: colors.foreground, flex: 1, paddingRight: 8 }]}>{getName(item.name).toUpperCase()}</Text>
                  <TouchableOpacity
                    onPress={() => onRemove(item.cartId)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ padding: 4 }}
                  >
                    <Trash2 size={18} color={colors.error} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {/* Size & Color */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <View style={{ backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: theme === 'dark' ? '#999' : '#666' }}>{item.selectedSize}</Text>
                  </View>
                  {item.selectedColor && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <View
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: (item.selectedColor && typeof item.selectedColor === 'string')
                            ? (item.selectedColor.startsWith('#') ? item.selectedColor : item.selectedColor.toLowerCase())
                            : 'transparent',
                          borderWidth: 1.5,
                          borderColor: theme === 'dark' ? '#333' : '#FFF',
                          shadowColor: '#000',
                          shadowOpacity: 0.1,
                          shadowRadius: 1,
                          elevation: 1
                        }}
                      />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' }}>{translateColor(item.selectedColor)}</Text>
                    </View>
                  )}
                </View>

                {/* Price & Quantity Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* Prices on same line */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.modernCartPrice, { color: colors.foreground, fontSize: 16, fontWeight: '900' }]}>
                      {item.discountPrice || item.price} TND
                    </Text>
                    {item.discountPrice && (
                      <Text style={{ fontSize: 11, color: colors.textMuted, textDecorationLine: 'line-through', fontWeight: '600' }}>
                        {item.price} TND
                      </Text>
                    )}
                  </View>

                  {/* Smaller Quantity Controls */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9F9', borderRadius: 10, padding: 3, gap: 8 }}>
                    <TouchableOpacity
                      style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: theme === 'dark' ? '#222' : 'white', alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => onUpdateQuantity(item.cartId, -1)}
                    >
                      <Minus size={13} color={colors.foreground} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 13, fontWeight: '900', minWidth: 20, textAlign: 'center', color: colors.foreground }}>{item.quantity || 1}</Text>
                    <TouchableOpacity
                      style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: theme === 'dark' ? '#222' : 'white', alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => onUpdateQuantity(item.cartId, 1)}
                    >
                      <Plus size={13} color={colors.foreground} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.modernCartSummary, { backgroundColor: theme === 'dark' ? '#121218' : 'white' }]}>
          <View style={{ marginBottom: 25 }}>
            <Text style={[styles.modernSectionTitle, { color: colors.foreground }]}>{t('deliveryDetails')}</Text>
            <View style={{ marginTop: 15, gap: 12 }}>
              <TextInput style={[styles.modernCartInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9F9', color: colors.foreground, borderColor: colors.border }]} placeholder={t('fullName')} placeholderTextColor="#999" value={name} onChangeText={setName} />
              <TextInput style={[styles.modernCartInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9F9', color: colors.foreground, borderColor: colors.border }]} placeholder={t('phone')} placeholderTextColor="#999" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

              {profileData?.addresses?.length > 0 && (
                <View style={{ marginTop: 5 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: colors.textMuted, marginBottom: 8, letterSpacing: 1 }}>{t('manageAddresses')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {profileData.addresses.map((a: any) => (
                      <TouchableOpacity
                        key={a.id}
                        onPress={() => setAddress(a.text)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: address === a.text ? colors.foreground : (theme === 'dark' ? '#17171F' : '#F2F2F7'),
                          borderWidth: 1,
                          borderColor: address === a.text ? colors.foreground : colors.border
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MapPin size={10} color={address === a.text ? (theme === 'dark' ? '#000' : '#FFF') : colors.textMuted} />
                          <Text style={{ fontSize: 10, fontWeight: '800', color: address === a.text ? (theme === 'dark' ? '#000' : '#FFF') : colors.foreground }}>
                            {a.text.length > 25 ? a.text.substring(0, 25) + '...' : a.text}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <TextInput style={[styles.modernCartInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9F9', color: colors.foreground, borderColor: colors.border, minHeight: 60 }]} placeholder={t('shippingAddress')} placeholderTextColor="#999" value={address} onChangeText={setAddress} multiline numberOfLines={2} />
            </View>
          </View>

          {/* Coupon Section */}
          <View style={{ marginBottom: 25 }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}
              onPress={() => setShowCouponInput(!showCouponInput)}
            >
              <Text style={[styles.modernSectionTitle, { fontSize: 13, letterSpacing: 1, color: colors.foreground }]}>{t('couponCode')}</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted }}>{showCouponInput ? '-' : '+'}</Text>
            </TouchableOpacity>

            {showCouponInput && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={[styles.modernCartInput, { flex: 1, textTransform: 'uppercase', height: 54, backgroundColor: theme === 'dark' ? '#17171F' : '#FAFAFA', borderColor: colors.border, borderWidth: 1, color: colors.foreground }]}
                  placeholder={t('enterCouponCode')}
                  placeholderTextColor={colors.textMuted}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={{ backgroundColor: colors.foreground, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 12, height: 54 }}
                  onPress={validateCoupon}
                >
                  <Text style={{ color: theme === 'dark' ? '#000' : '#FFF', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 }}>{t('apply')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {couponError ? <Text style={{ color: Colors.error, fontSize: 11, marginTop: 5, fontWeight: '700' }}>{couponError}</Text> : null}

            {appliedCoupon && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, backgroundColor: '#E8F5E9', padding: 10, borderRadius: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#2E7D32' }}>
                  {t('couponApplied')}: {appliedCoupon.code}
                  {appliedCoupon.type === 'percentage' && ` (-${appliedCoupon.value}%)`}
                  {appliedCoupon.type === 'fixed' && ` (-${appliedCoupon.value} TND)`}
                  {appliedCoupon.type === 'free_shipping' && ` (Free Ship)`}
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
              <Text style={styles.summaryLabel}>{t('subtotal')}</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{subtotal.toFixed(3)} TND</Text>
            </View>

            {appliedCoupon && discountAmount > 0 && (
              <View style={[styles.summaryRow, { marginBottom: 12 }]}>
                <Text style={[styles.summaryLabel, { color: '#2E7D32' }]}>{t('discount')}</Text>
                <Text style={[styles.summaryValue, { color: '#2E7D32' }]}>-{discountAmount.toFixed(3)} TND</Text>
              </View>
            )}

            <View style={[styles.summaryRow, { marginBottom: 20 }]}>
              <Text style={styles.summaryLabel}>{t('delivery')}</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                {deliveryCost === 0 && appliedCoupon?.type === 'free_shipping' ? <Text style={{ color: '#2E7D32', fontWeight: '700' }}>{t('free')}</Text> : `${deliveryCost.toFixed(3)} TND`}
              </Text>
            </View>

            <View style={[styles.summaryRow, { paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { fontSize: 17, fontWeight: '900', color: colors.foreground }]}>{t('total')}</Text>
              <Text style={[styles.summaryValue, { fontSize: 18, color: colors.foreground, fontWeight: '900' }]}>
                {total} TND
              </Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.mainActionBtn, { marginTop: 30, backgroundColor: theme === 'dark' ? '#FFFFFF' : '#000000' }]} onPress={placeOrder} disabled={checkingOut}>
            {checkingOut ? <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} /> : <Text style={[styles.mainActionBtnText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('confirmOrder')}</Text>}
          </TouchableOpacity>
        </View>
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES ---

function SizeGuideScreen({ onBack, t, language }: any) {
  const { colors, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Size Calculator State
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const tr = (fr: string, ar: string, en: string) => {
    return language === 'ar' ? ar : (language === 'fr' ? fr : en);
  };

  const sizes = [
    { label: 'XS', chest: '82-86', waist: '64-68', hip: '90-94' },
    { label: 'S', chest: '87-91', waist: '69-73', hip: '95-99' },
    { label: 'M', chest: '92-96', waist: '74-78', hip: '100-104' },
    { label: 'L', chest: '97-101', waist: '79-83', hip: '105-109' },
    { label: 'XL', chest: '102-106', waist: '84-88', hip: '110-114' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Animated Blur Header */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64 + insets.top,
        paddingTop: insets.top,
        borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '66' }]} />
        </Animated.View>

        <View style={[styles.modernHeader, { borderBottomWidth: 0, backgroundColor: 'transparent' }]}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: colors.foreground }]}>{t('sizeGuide') || 'GUIDE DES TAILLES'}</Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 25, paddingTop: 64 + insets.top }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={[styles.settingsSectionPremium, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border }]}>
          <Text style={[styles.settingsLabel, { marginBottom: 20, color: colors.foreground }]}>{tr('MESURES (CM)', 'القياسات (سم)', 'MEASUREMENTS (CM)')}</Text>

          <View style={{
            flexDirection: 'row'
            , paddingBottom: 15, marginBottom: 15
          }}>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '900', color: colors.textMuted }}>{tr('TAILLE', 'المقاس', 'SIZE')}</Text>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '900', color: colors.textMuted, textAlign: 'center' }}>{tr('POITRINE', 'الصدر', 'CHEST')}</Text>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '900', color: colors.textMuted, textAlign: 'center' }}>{tr('TAILLE', 'الخصر', 'WAIST')}</Text>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '900', color: colors.textMuted, textAlign: 'center' }}>{tr('HANCHES', 'الوركين', 'HIPS')}</Text>
          </View>

          {sizes.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: 15, borderBottomWidth: i === sizes.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
              <Text style={{ flex: 1, fontSize: 12, fontWeight: '900', color: colors.foreground }}>{s.label}</Text>
              <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: colors.foreground, textAlign: 'center' }}>{s.chest}</Text>
              <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: colors.foreground, textAlign: 'center' }}>{s.waist}</Text>
              <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: colors.foreground, textAlign: 'center' }}>{s.hip}</Text>
            </View>
          ))}
        </View>

        {/* Size Calculator Section */}
        <View style={[styles.settingsSectionPremium, { marginTop: 20, backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border }]}>
          <Text style={[styles.settingsLabel, { marginBottom: 20, color: colors.foreground }]}>
            {tr('TROUVER MA TAILLE', 'ابحث عن مقاسي', 'FIND MY SIZE')}
          </Text>

          <View style={{ gap: 15 }}>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, marginBottom: 8, marginLeft: 4 }}>
                {tr('POITRINE (CM)', 'الصدر (سم)', 'CHEST (CM)')}
              </Text>
              <TextInput
                style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', color: colors.foreground, borderColor: colors.border }]}
                placeholder="Ex: 92"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={chest}
                onChangeText={setChest}
              />
            </View>

            <View>
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, marginBottom: 8, marginLeft: 4 }}>
                {tr('TAILLE (CM)', 'الخصر (سم)', 'WAIST (CM)')}
              </Text>
              <TextInput
                style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', color: colors.foreground, borderColor: colors.border }]}
                placeholder="Ex: 74"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={waist}
                onChangeText={setWaist}
              />
            </View>

            <View>
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, marginBottom: 8, marginLeft: 4 }}>
                {tr('HANCHES (CM)', 'الوركين (سم)', 'HIPS (CM)')}
              </Text>
              <TextInput
                style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', color: colors.foreground, borderColor: colors.border }]}
                placeholder="Ex: 100"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={hip}
                onChangeText={setHip}
              />
            </View>

            <TouchableOpacity
              onPress={() => {
                if (!chest || !waist || !hip) return;
                const cVal = parseFloat(chest);
                const wVal = parseFloat(waist);
                const hVal = parseFloat(hip);

                const getIdx = (v: number, key: 'chest' | 'waist' | 'hip') => {
                  for (let i = 0; i < sizes.length; i++) {
                    const [min, max] = sizes[i][key].split('-').map(Number);
                    if (v <= max) return i;
                  }
                  return sizes.length - 1;
                };

                const idx = Math.max(getIdx(cVal, 'chest'), getIdx(wVal, 'waist'), getIdx(hVal, 'hip'));
                setRecommendedSize(sizes[idx].label);
              }}
              style={{
                backgroundColor: colors.foreground,
                paddingVertical: 15,
                borderRadius: 15,
                alignItems: 'center',
                marginTop: 10
              }}
            >
              <Text style={{ color: theme === 'dark' ? '#000' : '#FFF', fontWeight: '900', fontSize: 13 }}>
                {tr('CALCULER', 'حساب', 'CALCULATE')}
              </Text>
            </TouchableOpacity>

            {recommendedSize && (
              <Animatable.View animation="fadeInUp" duration={500} style={{ marginTop: 20, padding: 20, backgroundColor: colors.accent + '15', borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.accent + '30' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.foreground, marginBottom: 5 }}>
                  {tr('VOTRE TAILLE RECOMMANDÉE EST :', 'مقاسك الموصى به هو:', 'YOUR RECOMMENDED SIZE IS:')}
                </Text>
                <Text style={{ fontSize: 32, fontWeight: '900', color: colors.accent }}>{recommendedSize}</Text>
              </Animatable.View>
            )}
          </View>
        </View>

        <View style={{ marginTop: 40, padding: 20, backgroundColor: theme === 'dark' ? '#121218' : '#FAFAFA', borderRadius: 25, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 14, fontWeight: '900', marginBottom: 15, color: colors.foreground }}>{tr('COMMENT MESURER ?', 'كيفية القياس؟', 'HOW TO MEASURE?')}</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 20, marginBottom: 10 }}>
            {language === 'ar'
              ? '• الصدر: قس أفقياً عند أوسع نقطة من الصدر.\n• الخصر: قس حول أضيق جزء من خصرك.\n• الوركين: قس عند أوسع نقطة من وركيك.'
              : language === 'fr'
                ? '• Poitrine : Mesurez horizontalement au point le plus large de la poitrine.\n• Taille : Mesurez autour de la partie la plus étroite de votre taille.\n• Hanches : Mesurez au point le plus large de vos hanches.'
                : '• Chest: Measure horizontally at the widest point of the chest.\n• Waist: Measure around the narrowest part of your waist.\n• Hips: Measure at the widest point of your hips.'}
          </Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// --- ADMIN SETTINGS (TEAM + SOCIALS) ---

function AdminSettingsScreen({ onBack, user, t }: any) {
  const { colors: appColors, theme } = useAppTheme();
  const [activeTab, setActiveTabTab] = useState<'account' | 'team' | 'socials' | 'legal'>('account');
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const [adding, setAdding] = useState(false);

  // Account State
  const [currentPassword, setCurrentPassword] = useState('');
  const [updateNewEmail, setUpdateNewEmail] = useState(user?.email || "");
  const [updateNewPassword, setUpdateNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);

  // Socials State
  const [socials, setSocials] = useState({
    facebook: "",
    instagram: "",
    tiktok: "",
    whatsapp: "",
    youtube: "",
    website: ""
  });
  const [socialsLoading, setSocialsLoading] = useState(false);

  // Legal State
  const [legal, setLegal] = useState({ privacy: "", privacyAr: "", terms: "", termsAr: "" });
  const [legalLoading, setLegalLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'team') {
      fetchTeam();
    } else if (activeTab === 'socials') {
      fetchSocials();
    } else if (activeTab === 'legal') {
      fetchLegal();
    }
  }, [activeTab]);

  const handleUpdateAccount = async () => {
    if (!currentPassword) {
      Alert.alert(t('error'), t('passwordRequired'));
      return;
    }
    setAccountLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);

      if (updateNewEmail !== user.email) {
        await updateEmail(user, updateNewEmail);
        await updateDoc(doc(db, "users", user.uid), { email: updateNewEmail });
      }

      if (updateNewPassword) {
        await updatePassword(user, updateNewPassword);
      }

      Alert.alert(t('successTitle'), t('accountUpdated'));
      setCurrentPassword('');
      setUpdateNewPassword('');
    } catch (err: any) {
      console.error(err);
      Alert.alert(t('error'), err.code === 'auth/wrong-password' ? t('incorrectPassword') : t('updateFailed'));
    } finally {
      setAccountLoading(false);
    }
  };

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'), where('role', 'in', ['admin', 'editor', 'viewer', 'support']));
      const snap = await getDocs(q);
      setTeam(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocials = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'settings', 'socials');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setSocials({
          facebook: data.facebook || "",
          instagram: data.instagram || "",
          tiktok: data.tiktok || "",
          whatsapp: data.whatsapp || "",
          youtube: data.youtube || "",
          website: data.website || ""
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSocials = async () => {
    setSocialsLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'socials'), {
        ...socials,
        updatedAt: serverTimestamp()
      });
      Alert.alert(t('successTitle'), t('linksUpdated'));
    } catch (err) {
      Alert.alert(t('error'), t('updateFailed'));
    } finally {
      setSocialsLoading(false);
    }
  };

  const fetchLegal = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'settings', 'legal');
      const snap = await getDoc(docRef);

      const defaultPrivacy = `At Tama Clothing, we prioritize your privacy. This policy outlines how we collect, use, and protect your information.

1. Information Collection
We collect personal data (name, email, shipping address) when you create an account or place an order. We may also collect browsing data to improve your experience.

2. Usage of Information
Your data is used solely for processing orders, improving our services, and sending relevant updates (if opted in). We do not sell your data to third parties.

3. Data Security
We implement industry-standard security measures to protect your personal information. However, no method of transmission is 100% secure.

4. Contact Us
If you have questions about this policy, please contact our support team.`;

      const defaultTerms = `Welcome to Tama Clothing. By accessing or using our mobile application, you agree to be bound by these terms.

1. Usage Rights
You are granted a limited license to access and use the app for personal shopping purposes. Misuse or unauthorized access is strictly prohibited.

2. Purchases & Payments
All prices are in TND. We reserve the right to change prices at any time. Orders are subject to acceptance and availability.

3. Intellectual Property
All content (images, text, designs) is owned by Tama Clothing and protected by copyright laws.

4. Limitation of Liability
Tama Clothing is not liable for indirect damages arising from your use of the app.

5. Governing Law
These terms are governed by the laws of Tunisia.`;

      const defaultPrivacyAr = `في Tama Clothing، نولي أولوية قصوى لخصوصيتك. توضح هذه السياسة كيفية جمعنا لمعلوماتك واستخدامها وحمايتها.

1. جمع المعلومات
نقوم بجمع البيانات الشخصية (الاسم، البريد الإلكتروني، عنوان الشحن) عند إنشاء حساب أو تقديم طلب. قد نجمع أيضًا بيانات التصفح لتحسين تجربتك.

2. استخدام المعلومات
تُستخدم بياناتك فقط لمعالجة الطلبات، وتحسين خدماتنا، وإرسال التحديثات ذات الصلة (إذا وافقت على ذلك). نحن لا نبيع بياناتك لأطراف ثالثة.

3. أمان البيانات
نحن نطبق إجراءات أمنية قياسية في الصناعة لحماية معلوماتك الشخصية. ومع ذلك، لا توجد طريقة نقل آمنة بنسبة 100%.

4. اتصل بنا
إذا كانت لديك أسئلة حول هذه السياسة، يرجى الاتصال بفريق الدعم لدينا.`;

      const defaultTermsAr = `مرحبًا بكم في Tama Clothing. من خلال الوصول إلى تطبيق الهاتف المحمول الخاص بنا أو استخدامه، فإنك توافق على الالتزام بهذه الشروط.

1. حقوق الاستخدام
يتم منحك ترخيصًا محدودًا للوصول إلى التطبيق واستخدامه لأغراض التسوق الشخصي. يُمنع إساءة الاستخدام أو الوصول غير المصرح به منعًا باتًا.

2. المشتريات والمدفوعات
جميع الأسعار بالدينار التونسي. نحتفظ بالحق في تغيير الأسعار في أي وقت. تخضع الطلبات للقبول والتوافر.

3. الملكية الفكرية
جميع المحتويات (الصور، النصوص، التصميمات) مملوكة لـ Tama Clothing ومحمية بموجب قوانين حقوق النشر.

4. تحديد المسؤولية
Tama Clothing ليست مسؤولة عن الأضرار غير المباشرة الناشئة عن استخدامك للتطبيق.

5. القانون الحاكم
تخضع هذه الشروط لقوانين تونس.`;

      if (snap.exists()) {
        const data = snap.data();
        setLegal({
          privacy: data.privacy || defaultPrivacy,
          privacyAr: data.privacyAr || defaultPrivacyAr,
          terms: data.terms || defaultTerms,
          termsAr: data.termsAr || defaultTermsAr
        });
      } else {
        setLegal({
          privacy: defaultPrivacy,
          privacyAr: defaultPrivacyAr,
          terms: defaultTerms,
          termsAr: defaultTermsAr
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLegal = async () => {
    setLegalLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'legal'), {
        ...legal,
        updatedAt: serverTimestamp()
      });
      Alert.alert(t('successTitle'), t('pagesUpdated'));
    } catch (err) {
      Alert.alert(t('error'), t('updateFailed'));
    } finally {
      setLegalLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newEmail) return;
    setAdding(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', newEmail), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        Alert.alert(t('error'), t('userRegistered'));
      } else {
        const target = snap.docs[0];
        await updateDoc(doc(db, 'users', target.id), { role: newRole });
        setNewEmail('');
        fetchTeam();
        Alert.alert(t('successTitle'), t('memberAdded'));
      }
    } catch (err) {
      Alert.alert(t('error'), t('updateFailed'));
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (uid: string, role: string) => {
    if (uid === user?.uid) return;
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      fetchTeam();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (uid: string) => {
    if (uid === user?.uid) return;
    Alert.alert(t('error'), t('confirmDeleteMember'), [
      { text: t('cancel') },
      {
        text: t('remove'), style: 'destructive', onPress: async () => {
          await updateDoc(doc(db, 'users', uid), { role: 'customer' });
          fetchTeam();
        }
      }
    ]);
  };

  const ROLES = [
    { value: 'admin', label: t('admin').toUpperCase() },
    { value: 'brand_owner', label: t('brandOwner').toUpperCase() },
    { value: 'nor_kam', label: t('norKam').toUpperCase() },
    { value: 'editor', label: t('editor').toUpperCase() },
    { value: 'support', label: t('support').toUpperCase() },
    { value: 'viewer', label: t('viewer').toUpperCase() },
    { value: 'driver', label: t('driver') ? t('driver').toUpperCase() : 'DRIVER' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={styles.modernHeader}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
          <ChevronLeft size={20} color={appColors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.modernLogo, { color: appColors.foreground }]}>{t('settings')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 25, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => setActiveTabTab('account')}
          style={{ marginRight: 15, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: activeTab === 'account' ? appColors.foreground : 'transparent' }}
        >
          <Text style={{ fontSize: 11, fontWeight: '900', color: activeTab === 'account' ? appColors.foreground : appColors.textMuted }}>{t('account')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTabTab('team')}
          style={{ marginRight: 15, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: activeTab === 'team' ? appColors.foreground : 'transparent' }}
        >
          <Text style={{ fontSize: 11, fontWeight: '900', color: activeTab === 'team' ? appColors.foreground : appColors.textMuted }}>{t('team')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTabTab('socials')}
          style={{ marginRight: 15, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: activeTab === 'socials' ? appColors.foreground : 'transparent' }}
        >
          <Text style={{ fontSize: 11, fontWeight: '900', color: activeTab === 'socials' ? appColors.foreground : appColors.textMuted }}>{t('socials')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTabTab('legal')}
          style={{ paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: activeTab === 'legal' ? appColors.foreground : 'transparent' }}
        >
          <Text style={{ fontSize: 11, fontWeight: '900', color: activeTab === 'legal' ? appColors.foreground : appColors.textMuted }}>{t('pages')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 25, paddingTop: 0 }}>

        {activeTab === 'account' && (
          <View style={[styles.settingsSectionPremium, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border }]}>
            <Text style={[styles.settingsLabel, { color: appColors.foreground }]}>{t('updateAccount')}</Text>
            <View style={{ gap: 15 }}>
              <View>
                <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('emailAddress')}</Text>
                <TextInput
                  style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border }]}
                  value={updateNewEmail}
                  onChangeText={setUpdateNewEmail}
                  autoCapitalize="none"
                />
              </View>
              <View>
                <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('currentPasswordRequired')}</Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <TextInput
                    style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border, paddingRight: 50 }]}
                    placeholder="********"
                    placeholderTextColor="#666"
                    secureTextEntry={!showCurrentPassword}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 15, height: '100%', justifyContent: 'center' }}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={18} color={appColors.textMuted} /> : <Eye size={18} color={appColors.textMuted} />}
                  </TouchableOpacity>
                </View>
              </View>
              <View>
                <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('newPasswordOptional')}</Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <TextInput
                    style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border, paddingRight: 50 }]}
                    placeholder={t('leaveEmptyToKeepCurrent')}
                    placeholderTextColor="#666"
                    secureTextEntry={!showNewPassword}
                    value={updateNewPassword}
                    onChangeText={setUpdateNewPassword}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 15, height: '100%', justifyContent: 'center' }}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} color={appColors.textMuted} /> : <Eye size={18} color={appColors.textMuted} />}
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.saveBtnPremium, { backgroundColor: theme === 'dark' ? '#FFF' : '#000', marginTop: 30 }]}
                onPress={handleUpdateAccount}
                disabled={accountLoading}
              >
                {accountLoading ? <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} /> : <Text style={[styles.saveBtnPremiumText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('updateProfile')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'team' && (
          <>
            {/* ADD MEMBER */}
            <View style={[styles.settingsSectionPremium, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border }]}>
              <Text style={[styles.settingsLabel, { color: appColors.foreground }]}>{t('addNewMember')}</Text>
              <View style={{ gap: 10 }}>
                <TextInput
                  style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border }]}
                  placeholder={t('userEmail')}
                  placeholderTextColor="#666"
                  value={newEmail}
                  onChangeText={setNewEmail}
                  autoCapitalize="none"
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5, paddingVertical: 10 }}>
                  {ROLES.map(r => (
                    <TouchableOpacity
                      key={r.value}
                      style={[styles.roleOption, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', borderColor: appColors.border }, newRole === r.value && { backgroundColor: appColors.foreground, borderColor: appColors.foreground }]}
                      onPress={() => setNewRole(r.value)}
                    >
                      <Text style={[styles.roleOptionText, { color: appColors.textMuted }, newRole === r.value && { color: theme === 'dark' ? '#000' : '#FFF' }]}>{r.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.saveBtnPremium, { backgroundColor: theme === 'dark' ? '#FFF' : '#000', marginTop: 20 }]}
                  onPress={handleAdd}
                  disabled={adding}
                >
                  {adding ? <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} /> : <Text style={[styles.saveBtnPremiumText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('invite')}</Text>}
                </TouchableOpacity>
              </View>
            </View>

            {/* TEAM LIST */}
            <Text style={[styles.settingsLabel, { marginTop: 20, color: appColors.foreground }]}>{t('currentTeam')}</Text>
            {loading ? <ActivityIndicator color={appColors.foreground} /> : team.map(member => (
              <View key={member.id} style={[styles.teamCard, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: appColors.foreground }}>{member.fullName || 'User'}</Text>
                  <Text style={{ fontSize: 11, color: appColors.textMuted }}>{member.email}</Text>

                  {/* Role Actions */}
                  {member.id !== user?.uid && (
                    <View style={{ flexDirection: 'row', marginTop: 8, gap: 5 }}>
                      {ROLES.map(r => (
                        <TouchableOpacity
                          key={r.value}
                          onPress={() => handleRoleChange(member.id, r.value)}
                          style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: member.role === r.value ? appColors.foreground : (theme === 'dark' ? '#000' : '#F2F2F7') }}
                        >
                          <Text style={{ fontSize: 9, fontWeight: '800', color: member.role === r.value ? (theme === 'dark' ? '#000' : '#FFF') : appColors.textMuted }}>{r.label[0]}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={{ alignItems: 'flex-end', gap: 5 }}>
                  <View style={[styles.teamRoleBadge, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}><Text style={[styles.teamRoleText, { color: appColors.foreground }]}>{member.role}</Text></View>
                  {member.id !== user?.uid && (
                    <TouchableOpacity onPress={() => handleRemove(member.id)}>
                      <Trash2 size={16} color={appColors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'socials' && (
          /* SOCIALS TAB */
          <View style={[styles.settingsSectionPremium, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border }]}>
            <Text style={[styles.settingsLabel, { marginBottom: 20, color: appColors.foreground }]}>{t('manageSocialLinks')}</Text>

            <View style={{ gap: 15 }}>
              <View>
                <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('instagram')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: appColors.border }}>
                  <Instagram size={18} color={appColors.textMuted} />
                  <TextInput
                    style={[styles.premiumInput, { flex: 1, backgroundColor: 'transparent', paddingLeft: 10, color: appColors.foreground, borderWidth: 0 }]}
                    placeholder="https://instagram.com/..."
                    placeholderTextColor="#666"
                    value={socials.instagram}
                    onChangeText={text => setSocials({ ...socials, instagram: text })}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View>
                <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('facebook')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: appColors.border }}>
                  <Facebook size={18} color={appColors.textMuted} />
                  <TextInput
                    style={[styles.premiumInput, { flex: 1, backgroundColor: 'transparent', paddingLeft: 10, color: appColors.foreground, borderWidth: 0 }]}
                    placeholder="https://facebook.com/..."
                    placeholderTextColor="#666"
                    value={socials.facebook}
                    onChangeText={text => setSocials({ ...socials, facebook: text })}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View>
                <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('tiktok')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: appColors.border }}>
                  <Globe size={18} color={appColors.textMuted} />
                  <TextInput
                    style={[styles.premiumInput, { flex: 1, backgroundColor: 'transparent', paddingLeft: 10, color: appColors.foreground, borderWidth: 0 }]}
                    placeholder="https://tiktok.com/..."
                    placeholderTextColor="#666"
                    value={socials.tiktok}
                    onChangeText={text => setSocials({ ...socials, tiktok: text })}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View>
                <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('whatsappNumber')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: appColors.border }}>
                  <MessageCircle size={18} color={appColors.textMuted} />
                  <TextInput
                    style={[styles.premiumInput, { flex: 1, backgroundColor: 'transparent', paddingLeft: 10, color: appColors.foreground, borderWidth: 0 }]}
                    placeholder="+216 20 000 000"
                    placeholderTextColor="#666"
                    value={socials.whatsapp}
                    onChangeText={text => setSocials({ ...socials, whatsapp: text })}
                  />
                </View>
              </View>

              <View>
                <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('website')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: appColors.border }}>
                  <Globe size={18} color={appColors.textMuted} />
                  <TextInput
                    style={[styles.premiumInput, { flex: 1, backgroundColor: 'transparent', paddingLeft: 10, color: appColors.foreground, borderWidth: 0 }]}
                    placeholder="https://website.com"
                    placeholderTextColor="#666"
                    value={socials.website}
                    onChangeText={text => setSocials({ ...socials, website: text })}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtnPremium, { marginTop: 30, backgroundColor: theme === 'dark' ? '#FFF' : '#000' }]}
                onPress={handleSaveSocials}
                disabled={socialsLoading}
              >
                {socialsLoading ? <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} /> : <Text style={[styles.saveBtnPremiumText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('saveChanges')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'legal' && (
          <View style={[styles.settingsSectionPremium, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border }]}>
            <Text style={[styles.settingsLabel, { marginBottom: 20, color: appColors.foreground }]}>{t('manageLegalPages')}</Text>

            <View style={{ gap: 20 }}>
              <View>
                <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('privacyPolicy')} (FR/EN)</Text>
                <TextInput
                  style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border, height: 120, paddingTop: 15, textAlignVertical: 'top' }]}
                  placeholder={t('enterPrivacyPolicyContent')}
                  placeholderTextColor="#666"
                  value={legal.privacy}
                  onChangeText={val => setLegal({ ...legal, privacy: val })}
                  multiline
                  scrollEnabled={true}
                />
              </View>

              <View>
                <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('privacyPolicy')} (AR)</Text>
                <TextInput
                  style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border, height: 120, paddingTop: 15, textAlignVertical: 'top', textAlign: 'right' }]}
                  placeholder="سياسة الخصوصية بالعربية..."
                  placeholderTextColor="#666"
                  value={legal.privacyAr}
                  onChangeText={val => setLegal({ ...legal, privacyAr: val })}
                  multiline
                  scrollEnabled={true}
                />
              </View>

              <View>
                <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('termsOfService')} (FR/EN)</Text>
                <TextInput
                  style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border, height: 120, paddingTop: 15, textAlignVertical: 'top' }]}
                  placeholder={t('enterTermsOfServiceContent')}
                  placeholderTextColor="#666"
                  value={legal.terms}
                  onChangeText={val => setLegal({ ...legal, terms: val })}
                  multiline
                  scrollEnabled={true}
                />
              </View>

              <View>
                <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('termsOfService')} (AR)</Text>
                <TextInput
                  style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border, height: 120, paddingTop: 15, textAlignVertical: 'top', textAlign: 'right' }]}
                  placeholder="شروط الخدمة بالعربية..."
                  placeholderTextColor="#666"
                  value={legal.termsAr}
                  onChangeText={val => setLegal({ ...legal, termsAr: val })}
                  multiline
                  scrollEnabled={true}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtnPremium, { marginTop: 40, backgroundColor: theme === 'dark' ? '#FFF' : '#000' }]}
              onPress={handleSaveLegal}
              disabled={legalLoading}
            >
              {legalLoading ? <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} /> : <Text style={[styles.saveBtnPremiumText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{legalLoading ? t('saving') : t('updatePages')}</Text>}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationsScreen({ notifications, language, onClear, onBack, t }: any) {
  const { colors, theme } = useAppTheme();

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Animated Blur Header */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64 + insets.top,
        paddingTop: insets.top,
        borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '66' }]} />
        </Animated.View>

        <View style={styles.modernHeader}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: colors.foreground }]}>{t('notifications')}</Text>
          <TouchableOpacity onPress={onClear}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted }}>{t('clearAll')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 64 + insets.top }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {notifications.length === 0 ? (
          <View style={{ marginTop: 100, alignItems: 'center' }}>
            <Bell size={40} color={theme === 'dark' ? '#222' : '#E5E5EA'} />
            <Text style={{ marginTop: 20, color: colors.textMuted, fontWeight: '600' }}>{t('noNotifications')}</Text>
          </View>
        ) : (
          <View style={{ gap: 15 }}>
            {notifications.map((n: any) => (
              <View key={n.id} style={[{ backgroundColor: theme === 'dark' ? '#121218' : 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }, !n.read && { borderColor: colors.accent, backgroundColor: theme === 'dark' ? '#1A1810' : '#FFFCF0' }]}>
                <View style={{ flexDirection: 'row', gap: 15 }}>
                  <View style={[styles.iconCircle, { backgroundColor: n.read ? (theme === 'dark' ? '#000' : '#F2F2F7') : (theme === 'dark' ? '#2A2510' : '#FFF9E5') }]}>
                    <Bell size={18} color={n.read ? colors.textMuted : colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 4, color: colors.foreground }}>{language === 'ar' ? n.titleAr || n.title : n.title}</Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>{n.time}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>{language === 'ar' ? n.messageAr || n.message : n.message}</Text>
                  </View>
                </View>
                {n.image && (
                  <Image
                    source={{ uri: n.image }}
                    style={{ width: '100%', height: 150, borderRadius: 8, marginTop: 15 }}
                    resizeMode="cover"
                  />
                )}
              </View>
            ))}
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function AdminNotificationsScreen({ onBack, t }: any) {
  const { colors, theme } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [message, setMessage] = useState('');
  const [messageAr, setMessageAr] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const handlePickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'notifications'),
        where('type', '==', 'broadcast')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        // Sort newest first in-memory to avoid requiring a composite Firestore index
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch broadcast history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleDeleteNotification = async (id: string) => {
    Alert.alert(
      t('delete'),
      t('areYouSure'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'notifications', id));
              setNotifications(prev => prev.filter(n => n.id !== id));
            } catch (error) {
              Alert.alert(t('error'), 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };

  const handleSend = async () => {
    if (!title || !message) return Alert.alert(t('error'), t('nameRequired'));
    setSending(true);
    try {
      let imageUrl = null;

      // Upload Image if present
      if (image && !image.startsWith('http')) {
        imageUrl = await uploadImageToCloudinary(image);
      } else if (image && image.startsWith('http')) {
        imageUrl = image;
      }

      // 1. Save to Database
      await addDoc(collection(db, 'notifications'), {
        userId: 'ALL',
        title,
        titleAr: titleAr || title,
        message,
        messageAr: messageAr || message,
        image: imageUrl,
        read: false,
        type: 'broadcast',
        createdAt: serverTimestamp()
      });

      // 2. Broadcast Push Notification
      const usersSnap = await getDocs(collection(db, 'users'));
      const tokens: string[] = [];
      usersSnap.docs.forEach(doc => {
        const d = doc.data();
        if (d.expoPushToken) tokens.push(d.expoPushToken);
      });

      // Remove duplicates
      const uniqueTokens = [...new Set(tokens)];

      if (uniqueTokens.length > 0) {
        const chunkArray = (myArray: string[], chunk_size: number) => {
          let results = [];
          while (myArray.length) {
            results.push(myArray.splice(0, chunk_size));
          }
          return results;
        };

        const chunks = chunkArray([...uniqueTokens], 100);

        // Combined push notification text for broadcast
        const combinedTitle = titleAr ? `${titleAr} | ${title}` : title;
        const combinedBody = messageAr ? `${messageAr} | ${message}` : message;

        for (const chunk of chunks) {
          const pushMessages = chunk.map(token => ({
            to: token,
            sound: 'default',
            title: combinedTitle,
            body: combinedBody,
            data: { type: 'broadcast', image: imageUrl },
          }));

          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(pushMessages),
          });
        }
      }

      Alert.alert(t('broadcastSuccess'), t('thankYou'));
      setTitle('');
      setTitleAr('');
      setMessage('');
      setMessageAr('');
      setImage(null);
    } catch (e: any) {
      Alert.alert(t('error'), t('broadcastError'));
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <ChevronLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: colors.foreground }]}>{t('broadcast').toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'send' ? colors.foreground : 'transparent' }}
          onPress={() => setActiveTab('send')}
        >
          <Text style={{ fontWeight: '800', color: activeTab === 'send' ? colors.foreground : colors.textMuted }}>{t('sendBroadcast').toUpperCase()}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'history' ? colors.foreground : 'transparent' }}
          onPress={() => setActiveTab('history')}
        >
          <Text style={{ fontWeight: '800', color: activeTab === 'history' ? colors.foreground : colors.textMuted }}>HISTORY</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 25 }}>
        {activeTab === 'send' ? (
          <>
            <View style={[styles.settingsSectionPremium, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border }]}>
              <Text style={[styles.inputLabelField, { color: colors.foreground }]}>{t('notificationImage').toUpperCase()} {t('optional').toUpperCase()}</Text>
              <View style={{ marginBottom: 20 }}>
                {image ? (
                  <View>
                    <Image source={{ uri: image }} style={{ width: '100%', height: 200, borderRadius: 12, backgroundColor: theme === 'dark' ? '#17171F' : '#f0f0f0' }} resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() => setImage(null)}
                      style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 }}
                    >
                      <X size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={handlePickImage} style={{ width: '100%', height: 150, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: theme === 'dark' ? '#17171F' : '#FAFAFA' }}>
                    <ImageIcon size={32} color={colors.textMuted} />
                    <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>{t('tapToUpload').toUpperCase()}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.inputLabelField, { color: colors.foreground, marginTop: 20 }]}>{t('notificationTitleLabel').toUpperCase()} (FR)</Text>
              <TextInput
                style={[styles.modernInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F2F2F7', color: colors.foreground }]}
                placeholder={t('flashSalePlaceholder')}
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={[styles.inputLabelField, { color: colors.foreground, marginTop: 20 }]}>{t('notificationTitleLabel').toUpperCase()} (AR)</Text>
              <TextInput
                style={[styles.modernInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F2F2F7', color: colors.foreground, textAlign: 'right' }]}
                placeholder={t('flashSalePlaceholder')}
                placeholderTextColor="#999"
                value={titleAr}
                onChangeText={setTitleAr}
              />

              <Text style={[styles.inputLabelField, { color: colors.foreground, marginTop: 20 }]}>{t('notificationMessageLabel').toUpperCase()} (FR)</Text>
              <TextInput
                style={[styles.modernInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F2F2F7', color: colors.foreground, height: 100, paddingTop: 15 }]}
                placeholder={t('typeMessagePlaceholder')}
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
              />

              <Text style={[styles.inputLabelField, { color: colors.foreground, marginTop: 20 }]}>{t('notificationMessageLabel').toUpperCase()} (AR)</Text>
              <TextInput
                style={[styles.modernInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F2F2F7', color: colors.foreground, height: 100, paddingTop: 15, textAlign: 'right' }]}
                placeholder={t('typeMessagePlaceholder')}
                placeholderTextColor="#999"
                value={messageAr}
                onChangeText={setMessageAr}
                multiline
              />

              <TouchableOpacity
                onPress={handleSend}
                disabled={sending}
                style={[styles.saveBtnPremium, { backgroundColor: colors.foreground, marginTop: 30 }]}
              >
                {sending ? <ActivityIndicator color={theme === 'dark' ? 'black' : 'white'} /> : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Megaphone size={18} color={theme === 'dark' ? 'black' : 'white'} />
                    <Text style={[styles.saveBtnPremiumText, { color: theme === 'dark' ? 'black' : 'white' }]}>{t('sendBroadcast').toUpperCase()}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textMuted, fontSize: 11 }}>
              {t('broadcastHelpText')}
            </Text>
          </>
        ) : (
          <View>
            {loadingHistory ? (
              <ActivityIndicator color={colors.foreground} style={{ marginTop: 50 }} />
            ) : notifications.length === 0 ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 50 }}>No notifications found.</Text>
            ) : (
              notifications.map((notif, idx) => (
                <View key={notif.id || idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? '#121218' : '#F9F9FB', padding: 15, borderRadius: 12, marginBottom: 15 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 14 }}>{notif.title || notif.titleAr}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{notif.message || notif.messageAr}</Text>
                    {notif.createdAt && (
                      <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 5 }}>
                        {new Date(notif.createdAt?.seconds * 1000).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteNotification(notif.id)} style={{ padding: 10 }}>
                    <Trash2 size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
// Removed "View style={{ padding: 25 }}" wrapper and replaced with ScrollView for better UX on smaller screens


// --- ADMIN SCREENS ---

function AdminMenuScreen({ onBack, onNavigate, profileData, t }: any) {
  const { colors, theme } = useAppTheme();

  const role = profileData?.role || 'admin'; // Fallback to admin if not set

  const menuItems = [
    { label: t('dashboard').toUpperCase(), icon: LayoutDashboard, route: 'AdminDashboard', roles: ['admin', 'support', 'brand_owner'], color: '#5856D6' },
    { label: t('products').toUpperCase(), icon: Package, route: 'AdminProducts', roles: ['admin', 'brand_owner'], color: '#FF2D55' },
    { label: t('categories').toUpperCase(), icon: ListTree, route: 'AdminCategories', roles: ['admin'], color: '#AF52DE' },
    { label: t('brands').toUpperCase(), icon: Shield, route: 'AdminBrands', roles: ['admin'], color: '#007AFF' },
    { label: t('orders').toUpperCase(), icon: ShoppingCart, route: 'AdminOrders', roles: ['admin', 'support', 'brand_owner'], color: '#34C759' },
    { label: (t('shipments') || 'EXPÉDITIONS').toUpperCase(), icon: Truck, route: 'AdminShipments', roles: ['admin', 'support'], color: '#FF9500' },
    { label: 'COLLABORATIONS', icon: Handshake, route: 'AdminCollaboration', roles: ['admin'], color: '#FF9500' },
    { label: t('clients').toUpperCase(), icon: UsersIcon, route: 'AdminUsers', roles: ['admin', 'support'], color: '#5AC8FA' },
    { label: t('banners').toUpperCase(), icon: ImageIcon, route: 'AdminBanners', roles: ['admin', 'brand_owner'], color: '#FF9500' },
    { label: t('adsPromo').toUpperCase(), icon: Megaphone, route: 'AdminAds', roles: ['admin', 'brand_owner'], color: '#FF3B30' },
    { label: t('coupons').toUpperCase(), icon: Ticket, route: 'AdminCoupons', roles: ['admin', 'brand_owner'], color: '#FF2D55' },
    { label: t('flashSale').toUpperCase(), icon: Zap, route: 'AdminFlashSale', roles: ['admin', 'brand_owner'], color: '#FFCC00' },
    { label: t('promotions').toUpperCase(), icon: Ticket, route: 'AdminPromoBanners', roles: ['admin', 'brand_owner'], color: '#FF2D55' },
    { label: t('support').toUpperCase(), icon: MessageCircle, route: 'AdminSupportList', roles: ['admin', 'support'], color: '#5856D6' },
    { label: (t('identityVerification') || 'VERIFICATIONS').toUpperCase(), icon: ShieldCheck, route: 'AdminKYC', roles: ['admin'], color: '#34C759' },
    { label: t('broadcast').toUpperCase(), icon: Bell, route: 'AdminNotifications', roles: ['admin'], color: '#FF3B30' },
    { label: t('settings').toUpperCase(), icon: Settings, route: 'AdminSettings', roles: ['admin'], color: '#8E8E93' },
  ].filter(item => item.roles.includes(role));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <ChevronLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: colors.foreground }]}>{t('adminConsole').toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15 }}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.adminMenuCard, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border }]}
              onPress={() => onNavigate(item.route)}
              activeOpacity={0.8}
            >
              <View style={[styles.adminIconBox, { backgroundColor: theme === 'dark' ? (item.color + '15') : (item.color + '10') }]}>
                <item.icon size={26} color={item.color} strokeWidth={1.5} />
              </View>
              <Text style={[styles.adminMenuText, { color: colors.foreground }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Placeholders for other admin screens
// --- HELPER FUNCTIONS ---
const getString = (val: any) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'object') {
    if (val['fr']) return val['fr'];
    if (val['en']) return val['en'];
    if (val['ar-tn']) return val['ar-tn'];
    // Manual fallback to first value to avoid Object.values issues
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        return val[key];
      }
    }
  }
  return '';
};

const getStatusColor = (status: any) => {
  const s = getString(status).toLowerCase();
  switch (s) {
    case 'pending': return '#FF9500';
    case 'processing': return '#5856D6';
    case 'shipped': return '#007AFF';
    case 'delivered': return '#34C759';
    case 'cancelled': return '#FF3B30';
    default: return '#8E8E93';
  }
};

// --- ADMIN DASHBOARD ---
function AdminDashboardScreen({ onBack, t, user: currentUser, profileData, language }: any) {
  const { colors, theme } = useAppTheme();
  const [stats, setStats] = useState({ sales: 0, orders: 0, customers: 0, products: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusLabel = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pending': return t('statusPending');
      case 'delivered': return t('statusDelivered');
      case 'shipped': return t('statusShipped');
      case 'cancelled': return t('statusCancelled');
      case 'processing': return t('statusProcessing');
      default: return status;
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser, profileData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const isBrandOwner = profileData?.role === 'brand_owner';
      const myBrandId = profileData?.brandId;

      // Orders & Sales
      const ordersSnap = await getDocs(collection(db, 'orders'));
      let totalSales = 0;
      let orderCount = 0;
      const ordersData = ordersSnap.docs.map(d => {
        const data = d.data();
        let orderTotal = 0;

        if (isBrandOwner && myBrandId) {
          // Calculate only items belonging to this brand
          const myItems = (data.items || []).filter((item: any) => item.brandId === myBrandId);
          if (myItems.length > 0) {
            orderTotal = myItems.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
            totalSales += orderTotal;
            orderCount++;
            return { id: d.id, ...data, total: orderTotal, isMyBrand: true };
          }
          return null;
        } else {
          orderTotal = typeof data.total === 'number' ? data.total : (parseFloat(data.total) || 0);
          totalSales += orderTotal;
          orderCount++;
          return { id: d.id, ...data };
        }
      }).filter(o => o !== null);

      // Customers
      const usersSnap = await getDocs(collection(db, 'users'));
      const customerCount = usersSnap.docs.filter(d => d.data().role !== 'admin').length;

      // Products
      const productsSnap = await getDocs(collection(db, 'products'));
      let productsCount = productsSnap.size;
      if (isBrandOwner && myBrandId) {
        productsCount = productsSnap.docs.filter(d => d.data().brandId === myBrandId).length;
      }

      setStats({
        sales: totalSales,
        orders: orderCount,
        customers: customerCount,
        products: productsCount
      });

      // Recent Orders (Safe Sort)
      const validOrders = ordersData.filter((o: any) => o.createdAt && typeof o.createdAt.seconds === 'number');
      const sortedOrders = validOrders.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      }).slice(0, 5);

      setRecentOrders(sortedOrders);

    } catch (err) {
      console.log('Dashboard Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <ChevronLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: colors.foreground }]}>{t('dashboard').toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {loading ? <ActivityIndicator size="large" color={colors.foreground} /> : (
          <>
            {currentUser?.role === 'brand_owner' && (
              <View style={{ backgroundColor: theme === 'dark' ? '#17171F' : '#F2F2F7', padding: 15, borderRadius: 12, marginBottom: 20 }}>
                <Text style={{ fontWeight: '800', color: colors.foreground }}>{currentUser.brandName?.toUpperCase() || t('brandOwner')}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{t('brandOwner').toUpperCase()} {t('access').toUpperCase()}</Text>
              </View>
            )}

            {/* Stats Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 30 }}>
              <StatCard key="sales" label={t('totalSales').toUpperCase()} value={`${stats.sales.toFixed(2)} TND`} icon={ShoppingCart} color="#34C759" />
              <StatCard key="orders" label={t('orders').toUpperCase()} value={stats.orders.toString()} icon={Package} color="#5856D6" />
              {currentUser?.role !== 'brand_owner' && (
                <>
                  <StatCard key="clients" label={t('clients').toUpperCase()} value={stats.customers.toString()} icon={UsersIcon} color="#007AFF" />
                </>
              )}
              <StatCard key="products" label={t('products').toUpperCase()} value={stats.products.toString()} icon={ImageIcon} color="#FF2D55" />
            </View>

            {/* Recent Orders */}
            <Text style={[styles.settingsLabel, { color: colors.foreground }]}>{t('recentOrders').toUpperCase()}</Text>
            {recentOrders.map(order => (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontWeight: '800', color: colors.foreground }}>#{order.id.slice(0, 8)}</Text>
                  <Text style={{ fontWeight: '700', color: colors.foreground }}>{order.total.toFixed(2)} TND</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{new Date(order.createdAt?.seconds * 1000).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR')}</Text>
                  <View style={[styles.statusTag, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(order.status).toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const { colors, theme } = useAppTheme();
  const iconColor = color || colors.foreground;
  const bgColor = theme === 'dark'
    ? (color ? color + '15' : '#17171F')
    : (color ? color + '10' : '#F9F9FB');

  return (
    <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border }]}>
      <View style={[styles.statIconBox, { backgroundColor: bgColor }]}>
        <Icon size={20} color={iconColor} strokeWidth={1.8} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

// --- ADMIN PRODUCTS ---

function AdminProductsScreen({ onBack, t, profileData }: any) {
  const { colors: appColors, theme } = useAppTheme();
  const isBrandOwner = profileData?.role === 'brand_owner';
  const myBrandId = profileData?.brandId;

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Form State
  const [nameFr, setNameFr] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [deliveryPrice, setDeliveryPrice] = useState('7');
  const [descriptionFr, setDescriptionFr] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState(isBrandOwner ? myBrandId : '');
  const [brands, setBrands] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchProducts = async () => {
    try {
      const snap = await getDocs(collection(db, 'products'));
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Brand owners only see their own brand's products
      setProducts(isBrandOwner && myBrandId ? all.filter((p: any) => p.brandId === myBrandId) : all);
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  };

  const fetchCategories = async () => {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err) }
  };

  const fetchBrands = async () => {
    try {
      const snap = await getDocs(collection(db, 'brands'));
      setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err) }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleSaveProduct = async () => {
    if (!nameFr || !price || images.length === 0) {
      Alert.alert(t('error'), t('requiredFields'));
      return;
    }

    setUploading(true);
    try {
      // Upload images via admin panel API
      const uploadedImages = await Promise.all(images.map(async (img) => {
        return await uploadImageToCloudinary(img);
      }));

      const productData = {
        name: { fr: nameFr, "ar-tn": nameAr },
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        deliveryPrice: parseFloat(deliveryPrice || '7'),
        description: { fr: descriptionFr, "ar-tn": descriptionAr },
        categoryId,
        category: categories.find(c => c.id === categoryId)?.name?.fr || t('uncategorized'),
        brandId,
        brandName: brands.find(b => b.id === brandId)?.name?.fr || '',
        images: uploadedImages,
        mainImage: uploadedImages[0],
        sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'],
        colors,
        status: isSoldOut ? 'sold_out' : 'in_stock',
        updatedAt: serverTimestamp(),
      };

      console.log('Saving product with colors:', colors);
      console.log('Product data:', productData);

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        Alert.alert(t('successTitle'), t('productUpdated'));
      } else {
        await addDoc(collection(db, 'products'), { ...productData, createdAt: serverTimestamp() });
        Alert.alert(t('successTitle'), t('productCreated'));
      }

      setModalVisible(false);
      fetchProducts();
      resetForm();

    } catch (err: any) {
      console.error('Save product error:', err);
      Alert.alert(t('error'), t('failedToSave'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteDoc(doc(db, 'products', id));
          fetchProducts();
        }
      }
    ]);
  };

  const resetForm = () => {
    setEditingProduct(null); setNameFr(''); setNameAr(''); setPrice(''); setDiscountPrice(''); setDeliveryPrice('7');
    setDescriptionFr(''); setDescriptionAr(''); setCategoryId(''); setBrandId(''); setImages([]); setSizes([]); setColors([]);
    setIsSoldOut(false);
  };

  const openEdit = (p: any) => {
    setEditingProduct(p);
    setNameFr(p.name?.fr || getString(p.name));
    setNameAr(p.name?.['ar-tn'] || '');
    setPrice(String(p.price));
    setDiscountPrice(p.discountPrice ? String(p.discountPrice) : '');
    setDeliveryPrice(String(p.deliveryPrice || '7'));
    setDescriptionFr(p.description?.fr || getString(p.description));
    setDescriptionAr(p.description?.['ar-tn'] || '');
    setCategoryId(p.categoryId || '');
    setBrandId(p.brandId || '');
    setImages(p.images || (p.image ? [p.image] : []));
    setSizes(p.sizes || []);
    setColors(p.colors || []);
    setIsSoldOut(p.status === 'sold_out');
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <ChevronLeft size={20} color={appColors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground, fontSize: 11, left: 100, right: 100 }]}>{t('products').toUpperCase()}</Text>
        <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <Plus size={20} color={appColors.foreground} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        contentContainerStyle={{ padding: 20 }}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.productAdminCard, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border }]}>
            <Image source={{ uri: item.images?.[0] }} style={{ width: 70, height: 90, borderRadius: 12, backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }} />
            <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
              <Text style={{ fontWeight: '800', fontSize: 13, color: appColors.foreground, marginBottom: 4 }} numberOfLines={2}>{getString(item.name)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: appColors.textMuted, fontSize: 10, fontWeight: '700' }}>{getString(item.category).toUpperCase()}</Text>
                  {item.brandName ? (
                    <>
                      <Text style={{ color: appColors.border, fontSize: 10 }}>|</Text>
                      <Text style={{ color: appColors.textMuted, fontSize: 10, fontWeight: '700' }}>{item.brandName.toUpperCase()}</Text>
                    </>
                  ) : null}
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {item.discountPrice ? (
                  <>
                    <Text style={{ fontWeight: '900', fontSize: 14, color: appColors.foreground }}>{item.discountPrice} TND</Text>
                    <Text style={{ fontSize: 11, color: appColors.textMuted, textDecorationLine: 'line-through' }}>{item.price} TND</Text>
                  </>
                ) : (
                  <Text style={{ fontWeight: '900', fontSize: 14, color: appColors.foreground }}>{item.price} TND</Text>
                )}
              </View>
            </View>
            <View style={{ gap: 12 }}>
              <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 5 }}><Settings size={20} color={appColors.foreground} /></TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 5 }}><Trash2 size={20} color={appColors.error} /></TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add/Edit Modal */}
      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0A0A0F' : '#FAFAFA' }}>
          <SafeAreaView style={{ backgroundColor: theme === 'dark' ? '#000' : 'white' }}>
            <View style={{ height: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, backgroundColor: theme === 'dark' ? '#000' : 'white' }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ zIndex: 10 }}>
                <Text style={{ fontWeight: '700', color: appColors.textMuted, fontSize: 10 }}>{t('cancel').toUpperCase()}</Text>
              </TouchableOpacity>
              <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground, fontSize: 11, left: 80, right: 80 }]}>{editingProduct ? t('editProduct').toUpperCase() : t('newProduct').toUpperCase()}</Text>
              <TouchableOpacity onPress={handleSaveProduct} disabled={uploading} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ zIndex: 10 }}>
                {uploading ? <ActivityIndicator color={appColors.foreground} /> : <Text style={{ fontWeight: '900', color: appColors.foreground, fontSize: 10 }}>{t('save').toUpperCase()}</Text>}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <ScrollView contentContainerStyle={{ padding: 25, paddingBottom: 100 }}>
            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('images').toUpperCase()}</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, backgroundColor: theme === 'dark' ? '#121218' : '#F9F9F9', padding: 15, borderRadius: 15 }}>
              <View>
                <Text style={{ color: appColors.foreground, fontWeight: '700', fontSize: 13 }}>{t('soldOutStatus')}</Text>
                <Text style={{ color: appColors.textMuted, fontSize: 11 }}>{t('markUnavailable')}</Text>
              </View>
              <Switch
                value={isSoldOut}
                onValueChange={setIsSoldOut}
                trackColor={{ false: '#767577', true: appColors.error }}
                thumbColor={isSoldOut ? '#fff' : '#f4f3f4'}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <TouchableOpacity onPress={handlePickImage} style={{ width: 100, height: 133, backgroundColor: theme === 'dark' ? '#121218' : 'white', borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: appColors.border, borderStyle: 'dashed' }}>
                <Camera size={24} color="#ccc" />
                <Text style={{ color: '#999', marginTop: 5, fontWeight: '700', fontSize: 9 }}>ADD</Text>
              </TouchableOpacity>
              {images.map((img, index) => (
                <View key={index} style={{ marginRight: 10 }}>
                  <Image source={{ uri: img }} style={{ width: 100, height: 133, borderRadius: 15 }} />
                  <TouchableOpacity onPress={() => setImages(images.filter((_, i) => i !== index))} style={{ position: 'absolute', top: -5, right: -5, backgroundColor: appColors.error, borderRadius: 10, padding: 4 }}>
                    <X size={12} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('productNameFr')}</Text>
            <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]} value={nameFr} onChangeText={setNameFr} placeholder={t('frenchName')} placeholderTextColor="#666" />

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('productNameAr')}</Text>
            <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border, textAlign: 'right' }]} value={nameAr} onChangeText={setNameAr} placeholder={t('arabicName')} placeholderTextColor="#666" />

            <View style={{ flexDirection: 'row', gap: 15 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('price')}</Text>
                <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0.000" placeholderTextColor="#666" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('discountPrice')}</Text>
                <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]} value={discountPrice} onChangeText={setDiscountPrice} keyboardType="numeric" placeholder="0.000" placeholderTextColor="#666" />
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('deliveryPrice')}</Text>
            <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]} value={deliveryPrice} onChangeText={setDeliveryPrice} keyboardType="numeric" placeholder="7.000" placeholderTextColor="#666" />

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('category')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  style={{
                    paddingHorizontal: 20, paddingVertical: 10,
                    backgroundColor: categoryId === cat.id ? appColors.foreground : (theme === 'dark' ? '#171720' : 'white'),
                    borderRadius: 20, marginRight: 10,
                    borderWidth: 1, borderColor: categoryId === cat.id ? appColors.foreground : appColors.border
                  }}
                >
                  <Text style={{ color: categoryId === cat.id ? (theme === 'dark' ? '#000' : '#FFF') : appColors.foreground, fontWeight: '600' }}>
                    {cat.name?.fr || cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('brand')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {brands.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => setBrandId(b.id)}
                  style={{
                    paddingHorizontal: 20, paddingVertical: 10,
                    backgroundColor: brandId === b.id ? appColors.foreground : (theme === 'dark' ? '#171720' : 'white'),
                    borderRadius: 20, marginRight: 10,
                    borderWidth: 1, borderColor: brandId === b.id ? appColors.foreground : appColors.border
                  }}
                >
                  <Text style={{ color: brandId === b.id ? (theme === 'dark' ? '#000' : '#FFF') : appColors.foreground, fontWeight: '600' }}>
                    {b.name?.fr || b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[styles.inputLabel, { marginBottom: 0, color: appColors.foreground }]}>{t('sizesLabel')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setSizes(['XS', 'S', 'M', 'L', 'XL', 'XXL'])}
                  style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', borderRadius: 8 }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '800', color: appColors.foreground }}>+ ALPHA</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSizes(['36', '38', '40', '42', '44', '46'])}
                  style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', borderRadius: 8 }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '800', color: appColors.foreground }}>+ NUMERIC</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {['TU', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44', '46'].map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSizes(sizes.includes(s) ? sizes.filter(sz => sz !== s) : [...sizes, s])}
                  style={{
                    width: 45, height: 45, borderRadius: 25,
                    backgroundColor: sizes.includes(s) ? appColors.foreground : (theme === 'dark' ? '#171720' : 'white'),
                    borderWidth: 1, borderColor: appColors.border,
                    alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <Text style={{ color: sizes.includes(s) ? (theme === 'dark' ? '#000' : '#FFF') : appColors.foreground, fontWeight: '600', fontSize: 11 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('colorsLabel')}</Text>
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <TextInput
                  style={[styles.adminInput, { flex: 1, marginBottom: 0, backgroundColor: theme === 'dark' ? '#121218' : 'white', color: appColors.foreground, borderColor: appColors.border }]}
                  placeholder={t('colorPlaceholder')}
                  placeholderTextColor="#666"
                  value={colorInput}
                  onChangeText={setColorInput}
                  onSubmitEditing={() => {
                    const trimmed = colorInput.trim();
                    if (trimmed) {
                      if (!colors.includes(trimmed)) {
                        console.log('Adding color:', trimmed);
                        setColors([...colors, trimmed]);
                        setColorInput('');
                      } else {
                        Alert.alert(t('duplicate'), t('duplicateColor'));
                      }
                    }
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    const trimmed = colorInput.trim();
                    if (trimmed) {
                      if (!colors.includes(trimmed)) {
                        console.log('Adding color:', trimmed);
                        setColors([...colors, trimmed]);
                        setColorInput('');
                      } else {
                        Alert.alert(t('duplicate'), t('duplicateColor'));
                      }
                    }
                  }}
                  style={{
                    backgroundColor: appColors.foreground,
                    borderRadius: 15,
                    paddingHorizontal: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 60
                  }}
                >
                  <Text style={{ color: theme === 'dark' ? '#000' : '#FFF', fontWeight: '800', fontSize: 12 }}>ADD</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {colors.map((c, i) => {
                  const displayColor = c.startsWith('#') ? c : c.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setColors(colors.filter(col => col !== c))}
                      style={{
                        padding: 8,
                        backgroundColor: theme === 'dark' ? '#171720' : 'white',
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        borderWidth: 1,
                        borderColor: appColors.border
                      }}
                    >
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: displayColor,
                        borderWidth: 1,
                        borderColor: appColors.border
                      }} />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: appColors.foreground }}>{c}</Text>
                      <X size={12} color={appColors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('descriptionFr')}</Text>
            <TextInput style={[styles.adminInput, { height: 80, paddingTop: 15, backgroundColor: theme === 'dark' ? '#121218' : 'white', color: appColors.foreground, borderColor: appColors.border }]} multiline value={descriptionFr} onChangeText={setDescriptionFr} placeholder={t('frenchDesc')} placeholderTextColor="#666" />

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('descriptionAr')}</Text>
            <TextInput style={[styles.adminInput, { height: 80, textAlign: 'right', paddingTop: 15, backgroundColor: theme === 'dark' ? '#121218' : 'white', color: appColors.foreground, borderColor: appColors.border }]} multiline value={descriptionAr} onChangeText={setDescriptionAr} placeholder={t('arabicDesc')} placeholderTextColor="#666" />

          </ScrollView>
        </View>
      </Modal >
    </SafeAreaView >
  );
}

// --- ADMIN ORDERS ---
function AdminOrdersScreen({ onBack, t, user: currentUser, profileData, language }: any) {
  const { colors: appColors, theme } = useAppTheme();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const getStatusLabel = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pending': return t('statusPending');
      case 'delivered': return t('statusDelivered');
      case 'shipped': return t('statusShipped');
      case 'cancelled': return t('statusCancelled');
      case 'processing': return t('statusProcessing');
      default: return status;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser, profileData]);

  const fetchOrders = async () => {
    try {
      const isBrandOwner = profileData?.role === 'brand_owner';
      const myBrandId = profileData?.brandId;

      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      if (isBrandOwner && myBrandId) {
        // Filter orders that have items from my brand
        const myOrders = allOrders.filter(o => (o.items || []).some((i: any) => i.brandId === myBrandId));
        // Also update the order object to show my items only if needed, or keep it complete
        setOrders(myOrders);
      } else {
        setOrders(allOrders);
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });

        // Send Notification if userId exists
        if (selectedOrder.userId) {
          try {
            await addDoc(collection(db, 'notifications'), {
              userId: selectedOrder.userId,
              title: `Order Update`,
              message: `Your order #${id.slice(0, 8)} is now ${newStatus.toUpperCase()}.`,
              read: false,
              type: 'order_update',
              data: { orderId: id },
              createdAt: serverTimestamp()
            });
          } catch (ne) { console.log('Notif error', ne); }
        }
      }
      fetchOrders();
    } catch (err) { Alert.alert(t('error'), t('updateFailed')); }
  };

  const printOrderLabel = async () => {
    if (!selectedOrder) return;
    try {
      const customer = getCustomer(selectedOrder);
      const deliveryAddress = customer.address || 'Address not provided';
      const itemsString = selectedOrder.items?.map((i: any) => `${i.name || 'Item'} (x${i.quantity || 1})`).join(', ') || 'Various Items';

      const labelData = {
        trackingId: selectedOrder.trackingId || selectedOrder.id,
        senderName: profileData?.brandName || 'Tama Clothing',
        receiverName: customer.fullName,
        receiverPhone: customer.phone,
        deliveryAddress: deliveryAddress,
        items: [itemsString],
        weight: 'Unknown',
        serviceType: 'Standard delivery',
        carrierName: 'Tama Logistics',
        carrierPhone: '+216 71 000 000',
      };

      const html = generateShippingStickerHTML(labelData);

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error: any) {
      if (error.message && error.message.includes('ExpoPrint')) {
        Alert.alert('Module Manquant', 'L\'application doit être reconstruite pour utiliser la fonctionnalité d\'impression. Veuillez patienter pour la fin de la compilation.');
      } else {
        Alert.alert(t('error') || 'Error', error.message);
      }
    }
  };

  const getCustomer = (order: any) => {
    const c = order.customer || order.shippingAddress;
    return {
      fullName: c?.fullName || 'Client Inconnu',
      phone: c?.phone || 'Non renseigné',
      address: c?.address || 'Non renseignée',
      email: c?.email || 'Non renseigné'
    };
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const customer = getCustomer(o);
    return o.id.toLowerCase().includes(q) || customer.fullName.toLowerCase().includes(q) || customer.phone.includes(q);
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#000' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <ChevronLeft size={20} color={appColors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground }]}>{t('orders').toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? '#121218' : '#F2F2F7', borderRadius: 12, paddingHorizontal: 15, height: 45, borderWidth: 1, borderColor: appColors.border }}>
          <Search size={18} color={appColors.textMuted} />
          <TextInput
            style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: appColors.foreground }}
            placeholder={t('searchOrdersPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={appColors.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={appColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        contentContainerStyle={{ padding: 20 }}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const customer = getCustomer(item);
          return (
            <TouchableOpacity onPress={() => setSelectedOrder(item)} style={[styles.orderCard, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border }]}>
              <View style={{
                flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12
                , paddingBottom: 10
              }}>
                <Text style={{ fontWeight: '800', fontSize: 12, color: appColors.foreground }}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={{ fontSize: 10, color: appColors.textMuted }}>{new Date(item.createdAt?.seconds * 1000).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR')}</Text>
              </View>

              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontWeight: '700', fontSize: 13, marginBottom: 4, color: appColors.foreground }}>{customer.fullName}</Text>
                <Text style={{ fontSize: 11, color: appColors.textMuted }}>{item.items?.length || 0} {t('itemsLabel')} • {item.total} TND</Text>
              </View>

              <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status || 'pending'), alignSelf: 'flex-start' }]}>
                <Text style={styles.statusText}>{getStatusLabel(item.status || 'pending').toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          )
        }}
      />

      <Modal visible={!!selectedOrder} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0A0A0F' : '#F9F9F9' }}>
          <View style={{
            height: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, backgroundColor: theme === 'dark' ? '#000' : 'white',
            borderBottomWidth: 1, borderBottomColor: appColors.border
          }}>
            <Text style={{ fontWeight: '900', fontSize: 12, color: appColors.foreground, letterSpacing: 2 }}>{t('orderDetails').toUpperCase()}</Text>
            <TouchableOpacity onPress={() => setSelectedOrder(null)} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ zIndex: 10 }}>
              <X size={24} color={appColors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {selectedOrder && (
              <>
                {/* Order Meta Info */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <View>
                    <Text style={{ color: appColors.textMuted, fontSize: 10, fontWeight: '700' }}>{t('orderNumber')}</Text>
                    <Text style={{ color: appColors.foreground, fontSize: 18, fontWeight: '900' }}>#{selectedOrder.id.slice(0, 8).toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity onPress={printOrderLabel} style={{ backgroundColor: theme === 'dark' ? '#FFF' : '#000', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                    <Text style={{ color: theme === 'dark' ? '#000' : '#FFF', fontSize: 10, fontWeight: '800' }}>PRINT LABEL</Text>
                  </TouchableOpacity>
                </View>

                {/* Status Section */}
                <View style={[styles.settingsSectionPremium, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border, marginBottom: 20, padding: 15 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <Text style={[styles.settingsLabel, { color: appColors.foreground, marginBottom: 0 }]}>{t('status').toUpperCase()}</Text>
                    <View style={[styles.statusTag, { backgroundColor: getStatusColor(selectedOrder.status), paddingHorizontal: 10, paddingVertical: 4 }]}>
                      <Text style={[styles.statusText, { fontSize: 9 }]}>{getStatusLabel(selectedOrder.status).toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={{ color: appColors.textMuted, fontSize: 10, fontWeight: '700', marginBottom: 12, letterSpacing: 1 }}>{t('updateStatus').toUpperCase()}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => updateStatus(selectedOrder.id, s)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: selectedOrder.status === s ? getStatusColor(s) : (theme === 'dark' ? '#1C1C1E' : '#F2F2F7'),
                          borderWidth: 1,
                          borderColor: selectedOrder.status === s ? getStatusColor(s) : appColors.border
                        }}
                      >
                        <Text style={{
                          color: selectedOrder.status === s ? 'white' : appColors.foreground,
                          fontSize: 10,
                          fontWeight: '800'
                        }}>{t('status' + s.charAt(0).toUpperCase() + s.slice(1)).toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Client Info Section */}
                <View style={[styles.settingsSectionPremium, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border, marginBottom: 20 }]}>
                  <Text style={[styles.settingsLabel, { color: appColors.foreground }]}>{t('clientInfo').toUpperCase()}</Text>
                  {(() => {
                    const c = getCustomer(selectedOrder);
                    return (
                      <View style={{ gap: 15 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F9F9FB', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={18} color={appColors.foreground} />
                          </View>
                          <View>
                            <Text style={{ fontSize: 10, color: appColors.textMuted, fontWeight: '700' }}>{t('fullName').toUpperCase()}</Text>
                            <Text style={{ fontWeight: '800', fontSize: 15, color: appColors.foreground }}>{c.fullName}</Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F9F9FB', alignItems: 'center', justifyContent: 'center' }}>
                            <Phone size={18} color={appColors.foreground} />
                          </View>
                          <View>
                            <Text style={{ fontSize: 10, color: appColors.textMuted, fontWeight: '700' }}>{t('phone').toUpperCase()}</Text>
                            <Text style={{ fontWeight: '800', fontSize: 15, color: appColors.foreground, letterSpacing: 0.5 }}>{c.phone}</Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F9F9FB', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={18} color={appColors.foreground} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 10, color: appColors.textMuted, fontWeight: '700' }}>{t('deliveryAddress').toUpperCase()}</Text>
                            <Text style={{ fontWeight: '800', fontSize: 14, color: appColors.foreground }}>{c.address}</Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F9F9FB', alignItems: 'center', justifyContent: 'center' }}>
                            <Mail size={18} color={appColors.foreground} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 10, color: appColors.textMuted, fontWeight: '700' }}>{t('email').toUpperCase()}</Text>
                            <Text style={{ fontWeight: '800', fontSize: 14, color: appColors.foreground }}>{c.email}</Text>
                          </View>
                        </View>
                      </View>
                    )
                  })()}
                </View>

                {/* Items Section */}
                <View style={[styles.settingsSectionPremium, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border, marginBottom: 20 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 }}>
                    <ShoppingBag size={18} color={appColors.foreground} />
                    <Text style={[styles.settingsLabel, { color: appColors.foreground, marginBottom: 0 }]}>{t('orderItems').toUpperCase()} ({selectedOrder.items?.length})</Text>
                  </View>

                  {(selectedOrder.items || []).map((prod: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 18, paddingBottom: 15, borderBottomWidth: i === (selectedOrder.items?.length - 1) ? 0 : 1, borderBottomColor: appColors.border }}>
                      <Image source={{ uri: prod.mainImage || prod.image }} style={{ width: 60, height: 75, borderRadius: 12, backgroundColor: theme === 'dark' ? '#17171F' : '#eee' }} />
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={{ fontWeight: '900', fontSize: 14, color: appColors.foreground, letterSpacing: 0.3 }}>{String(getName(prod.name)).toUpperCase()}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <View style={{ backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: appColors.textMuted }}>{prod.selectedSize}</Text>
                          </View>
                          <Text style={{ color: appColors.border, fontSize: 10 }}>|</Text>
                          <Text style={{ fontSize: 11, color: appColors.textMuted, fontWeight: '600' }}>{prod.selectedColor}</Text>
                          <Text style={{ color: appColors.border, fontSize: 10 }}>|</Text>
                          <Text style={{ fontSize: 11, color: appColors.textMuted, fontWeight: '600' }}>{t('qty')}: {prod.quantity || 1}</Text>
                        </View>
                        <Text style={{ fontWeight: '900', marginTop: 8, color: appColors.foreground, fontSize: 13 }}>{prod.price.toFixed(2)} TND</Text>
                      </View>
                    </View>
                  ))}

                  {/* Summary */}
                  <View style={{ marginTop: 5, gap: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: appColors.textMuted, fontWeight: '600', fontSize: 12 }}>{t('subtotal')}</Text>
                      <Text style={{ color: appColors.foreground, fontWeight: '700', fontSize: 14 }}>{(selectedOrder.total - 7).toFixed(2)} TND</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: appColors.textMuted, fontWeight: '600', fontSize: 12 }}>{t('delivery')}</Text>
                      <Text style={{ color: appColors.foreground, fontWeight: '700', fontSize: 14 }}>7.00 TND</Text>
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: appColors.border, paddingTop: 12, marginTop: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontWeight: '900', color: appColors.foreground, fontSize: 14, letterSpacing: 0.5 }}>{t('orderTotal').toUpperCase()}</Text>
                      <Text style={{ fontWeight: '900', fontSize: 20, color: appColors.foreground }}>{selectedOrder.total?.toFixed(2)} TND</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- REUSABLE UPLOAD FUNCTION ---

// --- REUSABLE UPLOAD FUNCTION ---
const uploadToCloudinary = async (uri: string) => {
  return await uploadImageToCloudinary(uri);
};

// --- HELPER FOR SAFE STRING RENDERING ---
const getSafeString = (val: any) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val.fr) return val.fr;
  if (val['ar-tn']) return val['ar-tn'];
  return '';
};

// --- ADMIN SHIPMENTS ---
function AdminShipmentsScreen({ onBack, t, user, profileData, language }: any) {
  const { colors: appColors, theme } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchShipments();
    }
  }, [activeTab]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setShipments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  };

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'created': return '#FF9500';
      case 'in_transit': return '#5856D6';
      case 'out_for_delivery': return '#007AFF';
      case 'delivered': return '#34C759';
      default: return '#8E8E93';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <ChevronLeft size={20} color={appColors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground }]}>{(t('shipments') || 'EXPÉDITIONS').toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: appColors.border }}>
        <TouchableOpacity onPress={() => setActiveTab('list')} style={{ flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'list' ? appColors.foreground : 'transparent' }}>
          <Text style={{ fontWeight: '800', color: activeTab === 'list' ? appColors.foreground : appColors.textMuted }}>{(t('shipments') || 'LISTE').toUpperCase()}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('create')} style={{ flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'create' ? appColors.foreground : 'transparent' }}>
          <Text style={{ fontWeight: '800', color: activeTab === 'create' ? appColors.foreground : appColors.textMuted }}>{(t('createShipment') || 'CRÉER').toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'list' ? (
        <FlatList
          data={shipments}
          keyExtractor={s => s.id}
          contentContainerStyle={{ padding: 20 }}
          refreshing={loading}
          onRefresh={fetchShipments}
          renderItem={({ item }) => (
            <View style={{ padding: 15, backgroundColor: theme === 'dark' ? '#121218' : 'white', borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: appColors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontWeight: '900', color: appColors.foreground }}>#{item.trackingId || item.id.slice(0, 8).toUpperCase()}</Text>
                <View style={{ backgroundColor: getStatusColor(item.status), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>{(item.status || 'CREATED').toUpperCase()}</Text>
                </View>
              </View>
              <Text style={{ color: appColors.textMuted, fontSize: 13, marginBottom: 4 }}><User size={12} color={appColors.textMuted} /> {item.receiverName}</Text>
              <Text style={{ color: appColors.textMuted, fontSize: 13, marginBottom: 4 }}><Phone size={12} color={appColors.textMuted} /> {item.receiverPhone}</Text>
              <Text style={{ color: appColors.textMuted, fontSize: 13 }}><MapPin size={12} color={appColors.textMuted} /> {item.deliveryAddress}</Text>
            </View>
          )}
          ListEmptyComponent={!loading ? <Text style={{ textAlign: 'center', color: appColors.textMuted, marginTop: 50 }}>{(t('noData') || 'Aucune donnée')}</Text> : null}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <ShipmentCreationScreen onBack={() => setActiveTab('list')} onComplete={() => setActiveTab('list')} t={t} hideHeader={true} />
        </View>
      )}
    </SafeAreaView>
  );
}

// --- ADMIN CATEGORIES ---
function AdminCategoriesScreen({ onBack, t }: any) {
  const { colors: appColors, theme } = useAppTheme();
  const [categories, setCategories] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [nameFr, setNameFr] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    const snap = await getDocs(collection(db, 'categories'));
    setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleSave = async () => {
    if (!nameFr) return Alert.alert(t('error'), t('nameRequired'));
    setUploading(true);
    try {
      const imgUrl = await uploadToCloudinary(image);
      const data = {
        name: { fr: nameFr, "ar-tn": nameAr },
        image: imgUrl,
        updatedAt: serverTimestamp()
      };

      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), data);
      } else {
        await addDoc(collection(db, 'categories'), { ...data, createdAt: serverTimestamp() });
      }
      setModalVisible(false);
      fetchCategories();
      resetForm();
    } catch (error) { Alert.alert(t('error'), t('failedToSave')); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(t('delete'), t('areYouSure'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteDoc(doc(db, 'categories', id));
          fetchCategories();
        }
      }
    ]);
  };

  const resetForm = () => {
    setEditingCategory(null); setNameFr(''); setNameAr(''); setImage('');
  };

  const openEdit = (c: any) => {
    setEditingCategory(c);
    setNameFr(c.name?.fr || (typeof c.name === 'string' ? c.name : ''));
    setNameAr(c.name?.['ar-tn'] || '');
    setImage(c.image || '');
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <ChevronLeft size={20} color={appColors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground }]}>{t('categories').toUpperCase()}</Text>
        <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <Plus size={20} color={appColors.foreground} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={categories}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListEmptyComponent={<View style={styles.centered}><Text style={{ color: appColors.textMuted }}>{t('noResults')}</Text></View>}
        renderItem={({ item }) => (
          <View style={[styles.productAdminCard, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border }]}>
            <Image source={{ uri: item.image }} style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontWeight: '900', fontSize: 14, color: appColors.foreground }}>{getSafeString(item.name)}</Text>
              {item.name?.['ar-tn'] && <Text style={{ fontSize: 11, color: appColors.textMuted, marginTop: 2, writingDirection: 'rtl' }}>{item.name['ar-tn']}</Text>}
            </View>
            <View style={{ gap: 12, flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 5 }}><Settings size={20} color={appColors.foreground} /></TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 5 }}><Trash2 size={20} color={appColors.error} /></TouchableOpacity>
            </View>
          </View>
        )}
      />
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0A0A0F' : '#FAFAFA' }}>
          <SafeAreaView style={{ backgroundColor: theme === 'dark' ? '#121218' : 'white' }}>
            <View style={{
              height: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, backgroundColor: theme === 'dark' ? '#000' : 'white'
            }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ zIndex: 10 }}>
                <Text style={{ fontWeight: '700', color: appColors.textMuted, fontSize: 10 }}>{t('cancel').toUpperCase()}</Text>
              </TouchableOpacity>
              <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground, fontSize: 11, left: 80, right: 80 }]}>{editingCategory ? t('editCategory').toUpperCase() : t('newCategory').toUpperCase()}</Text>
              <TouchableOpacity onPress={handleSave} disabled={uploading} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ zIndex: 10 }}>
                {uploading ? <ActivityIndicator color={appColors.foreground} /> : <Text style={{ fontWeight: '900', color: appColors.foreground, fontSize: 10 }}>{t('save').toUpperCase()}</Text>}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <ScrollView contentContainerStyle={{ padding: 25 }}>
            <TouchableOpacity onPress={async () => {
              const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.5 });
              if (!r.canceled) setImage(r.assets[0].uri);
            }} style={{ width: '100%', height: 180, backgroundColor: theme === 'dark' ? '#121218' : 'white', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 25, borderWidth: 1, borderColor: appColors.border, borderStyle: image ? 'solid' : 'dashed' }}>
              {image ? <Image source={{ uri: image }} style={{ width: '100%', height: '100%', borderRadius: 20 }} /> : (
                <View style={{ alignItems: 'center', gap: 10 }}>
                  <Camera size={32} color={appColors.textMuted} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: appColors.textMuted }}>{t('tapToUpload').toUpperCase()}</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('category').toUpperCase()} (FR)</Text>
            <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]} value={nameFr} onChangeText={setNameFr} placeholder={t('category') + ' (FR)'} placeholderTextColor="#666" />

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('category').toUpperCase()} (AR)</Text>
            <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border, textAlign: 'right' }]} value={nameAr} onChangeText={setNameAr} placeholder={t('category') + ' (AR)'} placeholderTextColor="#666" />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- ADMIN BRANDS ---
function AdminBrandsScreen({ onBack, t }: any) {
  const { colors: appColors, theme } = useAppTheme();
  const [brands, setBrands] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [nameFr, setNameFr] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBrands();
    fetchProducts();
  }, []);

  const fetchBrands = async () => {
    try {
      const snap = await getDocs(collection(db, 'brands'));
      setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err) }
  };

  const fetchProducts = async () => {
    try {
      const snap = await getDocs(collection(db, 'products'));
      setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err) }
  };

  const handleSave = async () => {
    if (!nameFr) return Alert.alert(t('error'), t('nameRequired'));
    setUploading(true);
    try {
      const imgUrl = await uploadToCloudinary(image);
      const data = {
        name: { fr: nameFr, "ar-tn": nameAr },
        image: imgUrl,
        isActive,
        updatedAt: serverTimestamp()
      };

      let brandId = editingBrand?.id;

      if (editingBrand) {
        await updateDoc(doc(db, 'brands', editingBrand.id), data);
      } else {
        const ref = await addDoc(collection(db, 'brands'), { ...data, createdAt: serverTimestamp() });
        brandId = ref.id;
      }

      // Update products with brandId
      const updatePromises = allProducts.map(p => {
        const isSelected = selectedProductIds.includes(p.id);
        const currentBrandId = p.brandId;

        if (isSelected && currentBrandId !== brandId) {
          return updateDoc(doc(db, 'products', p.id), { brandId: brandId });
        }
        if (!isSelected && currentBrandId === brandId) {
          return updateDoc(doc(db, 'products', p.id), { brandId: null });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      await fetchProducts();

      setModalVisible(false);
      fetchBrands();
      resetForm();
    } catch (error) { Alert.alert(t('error'), t('failedToSave')); console.error(error); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(t('delete'), t('areYouSure'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'), style: 'destructive', onPress: async () => {
          await deleteDoc(doc(db, 'brands', id));
          fetchBrands();
        }
      }
    ]);
  };

  const resetForm = () => {
    setEditingBrand(null); setNameFr(''); setNameAr(''); setImage(''); setIsActive(true); setSelectedProductIds([]);
  };

  const openEdit = (b: any) => {
    setEditingBrand(b);
    setNameFr(b.name?.fr || (typeof b.name === 'string' ? b.name : ''));
    setNameAr(b.name?.['ar-tn'] || '');
    setImage(b.image || '');
    setIsActive(b.isActive !== false);

    // Pre-select products that have this brandId
    const associatedProducts = allProducts.filter(p => p.brandId === b.id).map(p => p.id);
    setSelectedProductIds(associatedProducts);

    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <ChevronLeft size={20} color={appColors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground }]}>{t('brands').toUpperCase()}</Text>
        <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <Plus size={20} color={appColors.foreground} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={brands}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListEmptyComponent={<View style={styles.centered}><Text style={{ color: appColors.textMuted }}>{t('noBrandsFound')}</Text></View>}
        renderItem={({ item }) => (
          <View style={[styles.productAdminCard, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border, opacity: item.isActive === false ? 0.6 : 1 }]}>
            <Image source={{ uri: item.image }} style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB', opacity: item.isActive === false ? 0.5 : 1 }} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontWeight: '900', fontSize: 14, color: appColors.foreground }}>{getSafeString(item.name)}</Text>
              {item.name?.['ar-tn'] && <Text style={{ fontSize: 11, color: appColors.textMuted, marginTop: 2, writingDirection: 'rtl' }}>{item.name['ar-tn']}</Text>}
            </View>
            <View style={{ gap: 12, flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 5 }}><Settings size={20} color={appColors.foreground} /></TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 5 }}><Trash2 size={20} color={appColors.error} /></TouchableOpacity>
            </View>
          </View>
        )}
      />
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0A0A0F' : '#FAFAFA' }}>
          <SafeAreaView style={{ backgroundColor: theme === 'dark' ? '#121218' : 'white' }}>
            <View style={{
              height: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, backgroundColor: theme === 'dark' ? '#000' : 'white'
            }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ zIndex: 10 }}>
                <Text style={{ fontWeight: '700', color: appColors.textMuted, fontSize: 10, textTransform: 'uppercase' }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground, fontSize: 10, left: 85, right: 85 }]}>
                {editingBrand ? t('editBrand').toUpperCase() : t('newBrand').toUpperCase()}
              </Text>
              <TouchableOpacity onPress={handleSave} disabled={uploading} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ zIndex: 10 }}>
                {uploading ? <ActivityIndicator color={appColors.foreground} /> : <Text style={{ fontWeight: '900', color: appColors.foreground, fontSize: 10, textTransform: 'uppercase' }}>{t('save')}</Text>}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <FlatList
            data={[{ type: 'form' }]}
            keyExtractor={(item) => item.type}
            contentContainerStyle={{ padding: 25 }}
            renderItem={() => (
              <>
                <TouchableOpacity onPress={async () => {
                  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.5 });
                  if (!r.canceled) setImage(r.assets[0].uri);
                }} style={{ width: '100%', height: 180, backgroundColor: theme === 'dark' ? '#121218' : 'white', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 25, borderWidth: 1, borderColor: appColors.border, borderStyle: image ? 'solid' : 'dashed' }}>
                  {image ? <Image source={{ uri: image }} style={{ width: '100%', height: '100%', borderRadius: 20 }} /> : (
                    <View style={{ alignItems: 'center', gap: 10 }}>
                      <Camera size={32} color={appColors.textMuted} />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: appColors.textMuted }}>{t('tapToUploadLogo')}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Text style={[styles.inputLabel, { color: appColors.foreground, textTransform: 'uppercase', fontSize: 11, fontWeight: '700', letterSpacing: 1 }]}>{t('brand').toUpperCase()} (FR)</Text>
                <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]} value={nameFr} onChangeText={setNameFr} placeholder={t('brand') + ' (FR)'} placeholderTextColor="#666" />

                <Text style={[styles.inputLabel, { color: appColors.foreground, textTransform: 'uppercase', fontSize: 11, fontWeight: '700', letterSpacing: 1 }]}>{t('brand').toUpperCase()} (AR)</Text>
                <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border, textAlign: 'right' }]} value={nameAr} onChangeText={setNameAr} placeholder={t('brand') + ' (AR)'} placeholderTextColor="#666" />

                {/* Visibility Toggle */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20, backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9F9', padding: 15, borderRadius: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: appColors.foreground, textTransform: 'lowercase', letterSpacing: 0.5 }}>{t('visible')}</Text>
                  <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: theme === 'dark' ? '#3A3A3A' : '#D1D1D6', true: theme === 'dark' ? '#34C759' : '#34C759' }}
                    thumbColor={isActive ? '#FFFFFF' : '#FFFFFF'}
                    ios_backgroundColor={theme === 'dark' ? '#3A3A3A' : '#D1D1D6'}
                  />
                </View>

                {/* Product Selection */}
                <View style={{ marginTop: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: appColors.foreground, textTransform: 'uppercase', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>{t('selectProducts')}</Text>
                    <View style={{ backgroundColor: appColors.foreground, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ color: theme === 'dark' ? '#000' : '#FFF', fontSize: 10, fontWeight: '900' }}>{selectedProductIds.length}</Text>
                    </View>
                  </View>

                  {/* Search Bar */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? '#17171F' : '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, marginBottom: 12, height: 44 }}>
                    <Search size={16} color={appColors.textMuted} />
                    <TextInput
                      style={{ flex: 1, marginLeft: 8, color: appColors.foreground, fontSize: 13 }}
                      placeholder={t('searchProducts') + '...'}
                      placeholderTextColor={appColors.textMuted}
                      value={productSearch}
                      onChangeText={setProductSearch}
                    />
                  </View>

                  {/* Products List */}
                  <View style={{ maxHeight: 400 }}>
                    {allProducts
                      .filter(item => !productSearch || getSafeString(item.name).toLowerCase().includes(productSearch.toLowerCase()))
                      .map((item) => {
                        const isSelected = selectedProductIds.includes(item.id);
                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => {
                              if (isSelected) setSelectedProductIds(prev => prev.filter(id => id !== item.id));
                              else setSelectedProductIds(prev => [...prev, item.id]);
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: 12,
                              marginBottom: 8,
                              borderRadius: 12,
                              backgroundColor: isSelected ? (theme === 'dark' ? '#1A1A22' : '#F0F0F3') : (theme === 'dark' ? '#121218' : 'white'),
                              borderWidth: isSelected ? 2 : 1,
                              borderColor: isSelected ? appColors.foreground : appColors.border
                            }}
                          >
                            <Image source={{ uri: item.mainImage || item.image }} style={{ width: 50, height: 50, borderRadius: 10, marginRight: 12, backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }} />
                            <View style={{ flex: 1 }}>
                              <Text numberOfLines={1} style={{ color: appColors.foreground, fontSize: 13, fontWeight: '700', marginBottom: 2 }}>{getSafeString(item.name)}</Text>
                              <Text numberOfLines={1} style={{ color: appColors.textMuted, fontSize: 11, fontWeight: '600' }}>{item.price} TND</Text>
                            </View>
                            <View style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              borderWidth: 2,
                              borderColor: isSelected ? appColors.foreground : appColors.border,
                              backgroundColor: isSelected ? appColors.foreground : 'transparent',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {isSelected && <CheckCircle2 size={16} color={theme === 'dark' ? '#000' : '#FFF'} fill={theme === 'dark' ? '#000' : '#FFF'} />}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                </View>
              </>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- ADMIN ADS ---
function AdminAdsScreen({ onBack, t, profileData }: any) {
  const { colors: appColors, theme } = useAppTheme();
  const isBrandOwner = profileData?.role === 'brand_owner';
  const myBrandId = profileData?.brandId;

  const [ads, setAds] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [titleFr, setTitleFr] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [descFr, setDescFr] = useState('');
  const [descAr, setDescAr] = useState('');
  const [type, setType] = useState('image');
  const [url, setUrl] = useState('');
  const [targetType, setTargetType] = useState('none');
  const [targetId, setTargetId] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAds();
    fetchTargets();
  }, []);

  const fetchAds = async () => {
    const snap = await getDocs(collection(db, 'ads'));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Brand owners only see their own ads
    setAds(isBrandOwner && myBrandId ? all.filter((a: any) => a.brandId === myBrandId) : all);
  };

  const fetchTargets = async () => {
    const pSnap = await getDocs(collection(db, 'products'));
    const allProducts = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    setProducts(isBrandOwner && myBrandId ? allProducts.filter((p: any) => p.brandId === myBrandId) : allProducts);
    const cSnap = await getDocs(collection(db, 'categories'));
    setCategories(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleSave = async () => {
    if (!titleFr || !url) return Alert.alert(t('error'), t('mediaRequired'));
    setUploading(true);
    try {
      const mediaUrl = url.startsWith('http') ? url : await uploadToCloudinary(url);
      const data: any = {
        title: { fr: titleFr, "ar-tn": titleAr },
        description: { fr: descFr, "ar-tn": descAr },
        type,
        url: mediaUrl,
        targetType,
        targetId,
        updatedAt: serverTimestamp()
      };
      // Tag with brandId so brand owners can only see their own ads
      if (isBrandOwner && myBrandId) data.brandId = myBrandId;
      if (editingAd) {
        await updateDoc(doc(db, 'ads', editingAd.id), data);
      } else {
        await addDoc(collection(db, 'ads'), { ...data, createdAt: serverTimestamp() });
      }
      setModalVisible(false);
      fetchAds();
      resetForm();
    } catch (error) { Alert.alert(t('error'), t('failedToSave')); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(t('delete'), t('areYouSure'), [{ text: t('cancel') }, { text: t('delete'), style: 'destructive', onPress: async () => { await deleteDoc(doc(db, 'ads', id)); fetchAds(); } }]);
  };

  const resetForm = () => {
    setEditingAd(null); setTitleFr(''); setTitleAr(''); setDescFr(''); setDescAr(''); setType('image'); setUrl(''); setTargetType('none'); setTargetId('');
  };

  const openEdit = (ad: any) => {
    setEditingAd(ad);
    setTitleFr(ad.title?.fr || (typeof ad.title === 'string' ? ad.title : ''));
    setTitleAr(ad.title?.['ar-tn'] || '');
    setDescFr(ad.description?.fr || '');
    setDescAr(ad.description?.['ar-tn'] || '');
    setType(ad.type || 'image');
    setUrl(ad.url || '');
    setTargetType(ad.targetType || (ad.link ? 'category' : 'none'));
    setTargetId(ad.targetId || ad.link || '');
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <ChevronLeft size={20} color={appColors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground }]}>{t('adsCampaigns').toUpperCase()}</Text>
        <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <Plus size={20} color={appColors.foreground} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={ads}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListEmptyComponent={<View style={styles.centered}><Text style={{ color: appColors.textMuted }}>{t('noCampaigns')}</Text></View>}
        renderItem={({ item }) => (
          <View style={[styles.productAdminCard, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border }]}>
            <View style={{ width: 100, height: 70, borderRadius: 12, backgroundColor: '#000', overflow: 'hidden', borderWidth: 1, borderColor: appColors.border }}>
              {item.type === 'video' ? <Video source={{ uri: item.url }} style={{ width: '100%', height: '100%' }} isMuted shouldPlay isLooping resizeMode={ResizeMode.COVER} /> : <Image source={{ uri: item.url }} style={{ width: '100%', height: '100%' }} />}
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontWeight: '800', fontSize: 13, color: appColors.foreground }} numberOfLines={2}>{getSafeString(item.title)}</Text>
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                <View style={{ backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: appColors.textMuted }}>{item.type.toUpperCase()}</Text>
                </View>
              </View>
            </View>
            <View style={{ gap: 12, flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 5 }}><Settings size={20} color={appColors.foreground} /></TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 5 }}><Trash2 size={20} color={appColors.error} /></TouchableOpacity>
            </View>
          </View>
        )}
      />
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0A0A0F' : '#FAFAFA' }}>
          <SafeAreaView style={{ backgroundColor: theme === 'dark' ? '#121218' : 'white' }}>
            <View style={{
              height: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, backgroundColor: theme === 'dark' ? '#000' : 'white'
            }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ zIndex: 10 }}>
                <Text style={{ fontWeight: '700', color: appColors.textMuted, fontSize: 10 }}>{t('cancel').toUpperCase()}</Text>
              </TouchableOpacity>
              <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground, fontSize: 11, left: 80, right: 80 }]}>{editingAd ? t('editAd').toUpperCase() : t('newAd').toUpperCase()}</Text>
              <TouchableOpacity onPress={handleSave} disabled={uploading} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ zIndex: 10 }}>
                {uploading ? <ActivityIndicator color={appColors.foreground} /> : <Text style={{ fontWeight: '900', color: appColors.foreground, fontSize: 10 }}>{t('save').toUpperCase()}</Text>}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <ScrollView contentContainerStyle={{ padding: 25 }}>
            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('mediaType').toUpperCase()}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 25 }}>
              <TouchableOpacity onPress={() => setType('image')} style={{ flex: 1, padding: 15, backgroundColor: type === 'image' ? appColors.foreground : (theme === 'dark' ? '#121218' : 'white'), borderRadius: 12, borderWidth: 1, borderColor: type === 'image' ? appColors.foreground : appColors.border, alignItems: 'center' }}>
                <Text style={{ color: type === 'image' ? (theme === 'dark' ? '#000' : '#FFF') : appColors.foreground, fontWeight: 'bold', fontSize: 12 }}>{t('images').toUpperCase()}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setType('video')} style={{ flex: 1, padding: 15, backgroundColor: type === 'video' ? appColors.foreground : (theme === 'dark' ? '#121218' : 'white'), borderRadius: 12, borderWidth: 1, borderColor: type === 'video' ? appColors.foreground : appColors.border, alignItems: 'center' }}>
                <Text style={{ color: type === 'video' ? (theme === 'dark' ? '#000' : '#FFF') : appColors.foreground, fontWeight: 'bold', fontSize: 12 }}>{t('video').toUpperCase()}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={async () => {
              const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: type === 'video' ? ['videos'] : ['images'], allowsEditing: true, quality: 0.5 });
              if (!r.canceled) setUrl(r.assets[0].uri);
            }} style={{ width: '100%', height: 200, backgroundColor: theme === 'dark' ? '#121218' : 'white', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 25, borderWidth: 1, borderColor: appColors.border, borderStyle: url ? 'solid' : 'dashed' }}>
              {url ? (type === 'video' ? <Video source={{ uri: url }} style={{ width: '100%', height: '100%', borderRadius: 20 }} isMuted shouldPlay resizeMode={ResizeMode.COVER} /> : <Image source={{ uri: url }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />) : (
                <View style={{ alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: theme === 'dark' ? '#17171F' : '#FAFAFA', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={24} color={appColors.textMuted} />
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: appColors.textMuted }}>{t(type === 'image' ? 'uploadImage' : 'uploadVideo').toUpperCase()}</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('campaignTitle').toUpperCase()} (FR)</Text>
            <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]} value={titleFr} onChangeText={setTitleFr} placeholder={t('campaignTitle') + ' (FR)'} placeholderTextColor="#666" />

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('campaignTitle').toUpperCase()} (AR)</Text>
            <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border, textAlign: 'right' }]} value={titleAr} onChangeText={setTitleAr} placeholder={t('campaignTitle') + ' (AR)'} placeholderTextColor="#666" />

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('description').toUpperCase()} (FR)</Text>
            <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border, height: 80, paddingVertical: 12 }]} value={descFr} onChangeText={setDescFr} placeholder={t('description') + '...'} multiline placeholderTextColor="#666" />

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('description').toUpperCase()} (AR)</Text>
            <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border, height: 80, paddingVertical: 12, textAlign: 'right' }]} value={descAr} onChangeText={setDescAr} placeholder={t('description') + '...'} multiline placeholderTextColor="#666" />

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('targetAction').toUpperCase()}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
              {['none', 'product', 'category'].map(act => (
                <TouchableOpacity key={act} onPress={() => setTargetType(act)} style={{ flex: 1, padding: 10, backgroundColor: targetType === act ? appColors.foreground : (theme === 'dark' ? '#171720' : 'white'), borderRadius: 10, borderWidth: 1, borderColor: targetType === act ? appColors.foreground : appColors.border, alignItems: 'center' }}>
                  <Text style={{ color: targetType === act ? (theme === 'dark' ? '#000' : '#FFF') : appColors.foreground, fontWeight: 'bold', fontSize: 10 }}>{t('target' + act.charAt(0).toUpperCase() + act.slice(1)).toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {targetType === 'product' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 25 }}>
                {products.map(p => (
                  <TouchableOpacity key={p.id} onPress={() => setTargetId(p.id)} style={{ width: 100, marginRight: 10, padding: 10, backgroundColor: targetId === p.id ? (theme === 'dark' ? '#000' : '#F2F2F7') : (theme === 'dark' ? '#121218' : 'white'), borderRadius: 15, borderWidth: 1, borderColor: targetId === p.id ? appColors.foreground : appColors.border }}>
                    <Image source={{ uri: p.mainImage }} style={{ width: '100%', height: 100, borderRadius: 10, marginBottom: 5 }} />
                    <Text style={{ fontSize: 9, fontWeight: '700', color: appColors.foreground }} numberOfLines={1}>{getName(p.name)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {targetType === 'category' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 25 }}>
                {categories.map(c => (
                  <TouchableOpacity key={c.id} onPress={() => setTargetId(c.id)} style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: targetId === c.id ? appColors.foreground : (theme === 'dark' ? '#121218' : 'white'), borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: targetId === c.id ? appColors.foreground : appColors.border }}>
                    <Text style={{ color: targetId === c.id ? (theme === 'dark' ? '#000' : '#FFF') : appColors.foreground, fontWeight: '600', fontSize: 12 }}>{translateCategory(getName(c.name))}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- ADMIN BANNERS ---
function AdminBannersScreen({ onBack, t, profileData }: any) {
  const { colors: appColors, theme } = useAppTheme();
  const isBrandOwner = profileData?.role === 'brand_owner';
  const myBrandId = profileData?.brandId;

  const [banners, setBanners] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [titleFr, setTitleFr] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [subFr, setSubFr] = useState('');
  const [subAr, setSubAr] = useState('');
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchBanners(); }, []);
  const fetchBanners = async () => {
    const snap = await getDocs(collection(db, 'banners'));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setBanners(isBrandOwner && myBrandId ? all.filter((b: any) => b.brandId === myBrandId) : all);
  };

  const handleSave = async () => {
    if (!titleFr || !image) return Alert.alert(t('error'), t('missingFields'));
    setUploading(true);
    try {
      const imgUrl = await uploadToCloudinary(image);
      const data = {
        title: { fr: titleFr, "ar-tn": titleAr },
        subtitle: { fr: subFr, "ar-tn": subAr },
        imageUrl: imgUrl,
        updatedAt: serverTimestamp()
      };
      if (editingBanner) await updateDoc(doc(db, 'banners', editingBanner.id), data);
      else await addDoc(collection(db, 'banners'), { ...data, createdAt: serverTimestamp() });

      setModalVisible(false); fetchBanners(); resetForm();
    } catch (e) { Alert.alert(t('error'), t('failedToSave')); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(t('delete'), t('areYouSure'), [{ text: t('cancel') }, { text: t('delete'), style: 'destructive', onPress: async () => { await deleteDoc(doc(db, 'banners', id)); fetchBanners(); } }]);
  };

  const resetForm = () => {
    setEditingBanner(null); setTitleFr(''); setTitleAr(''); setSubFr(''); setSubAr(''); setImage('');
  };

  const openEdit = (b: any) => {
    setEditingBanner(b);
    setTitleFr(b.title?.fr || (typeof b.title === 'string' ? b.title : ''));
    setTitleAr(b.title?.['ar-tn'] || '');
    setSubFr(b.subtitle?.fr || (typeof b.subtitle === 'string' ? b.subtitle : ''));
    setSubAr(b.subtitle?.['ar-tn'] || '');
    setImage(b.imageUrl || '');
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}><ChevronLeft size={20} color={appColors.foreground} /></TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground }]}>BANNERS</Text>
        <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}><Plus size={20} color={appColors.foreground} /></TouchableOpacity>
      </View>
      <FlatList
        data={banners}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListEmptyComponent={<View style={styles.centered}><Text style={{ color: appColors.textMuted }}>No banners found</Text></View>}
        renderItem={({ item }) => (
          <View style={[styles.productAdminCard, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border }]}>
            <Image source={{ uri: item.imageUrl }} style={{ width: 100, height: 60, borderRadius: 12, backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontWeight: '800', fontSize: 13, color: appColors.foreground }} numberOfLines={1}>{getSafeString(item.title)}</Text>
              <Text style={{ fontSize: 11, color: appColors.textMuted, marginTop: 2 }} numberOfLines={1}>{getSafeString(item.subtitle)}</Text>
            </View>
            <View style={{ gap: 12, flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 5 }}><Settings size={20} color={appColors.foreground} /></TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 5 }}><Trash2 size={20} color={appColors.error} /></TouchableOpacity>
            </View>
          </View>
        )}
      />
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0A0A0F' : '#FAFAFA' }}>
          <SafeAreaView style={{ backgroundColor: theme === 'dark' ? '#121218' : 'white' }}>
            <View style={{
              height: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, backgroundColor: theme === 'dark' ? '#000' : 'white'
            }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ zIndex: 10 }}>
                <Text style={{ fontWeight: '700', color: appColors.textMuted, fontSize: 10 }}>{t('cancel').toUpperCase()}</Text>
              </TouchableOpacity>
              <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground, fontSize: 11, left: 80, right: 80 }]}>{editingBanner ? t('editBanner').toUpperCase() : t('newBanner').toUpperCase()}</Text>
              <TouchableOpacity onPress={handleSave} disabled={uploading} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ zIndex: 10 }}>
                {uploading ? <ActivityIndicator color={appColors.foreground} /> : <Text style={{ fontWeight: '900', color: appColors.foreground, fontSize: 10 }}>{t('save').toUpperCase()}</Text>}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <ScrollView contentContainerStyle={{ padding: 25 }}>
            <TouchableOpacity onPress={async () => {
              const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.5 });
              if (!r.canceled) setImage(r.assets[0].uri);
            }} style={{ width: '100%', height: 180, backgroundColor: theme === 'dark' ? '#121218' : 'white', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 25, borderWidth: 1, borderColor: appColors.border, borderStyle: image ? 'solid' : 'dashed' }}>
              {image ? <Image source={{ uri: image }} style={{ width: '100%', height: '100%', borderRadius: 20 }} /> : (
                <View style={{ alignItems: 'center', gap: 10 }}>
                  <Camera size={32} color={appColors.textMuted} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: appColors.textMuted }}>{t('tapToUpload').toUpperCase()}</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('campaignTitle').toUpperCase()} (FR)</Text>
            <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]} value={titleFr} onChangeText={setTitleFr} placeholder={t('campaignTitle')} placeholderTextColor="#666" />

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('campaignTitle').toUpperCase()} (AR)</Text>
            <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border, textAlign: 'right' }]} value={titleAr} onChangeText={setTitleAr} placeholder={t('campaignTitle') + ' (AR)'} placeholderTextColor="#666" />

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('campaignSubtitle').toUpperCase()} (FR)</Text>
            <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]} value={subFr} onChangeText={setSubFr} placeholder={t('campaignSubtitle')} placeholderTextColor="#666" />

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('campaignSubtitle').toUpperCase()} (AR)</Text>
            <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border, textAlign: 'right' }]} value={subAr} onChangeText={setSubAr} placeholder={t('campaignSubtitle') + ' (AR)'} placeholderTextColor="#666" />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- ADMIN COUPONS ---
function AdminCouponsScreen({ onBack, t, language, profileData }: any) {
  const { colors: appColors, theme } = useAppTheme();
  const isBrandOwner = profileData?.role === 'brand_owner';
  const myBrandId = profileData?.brandId;

  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed' | 'free_shipping' | 'bundle_price'>('percentage');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Bundle State
  const [products, setProducts] = useState<any[]>([]);
  const [targetProductId, setTargetProductId] = useState('');
  const [tiers, setTiers] = useState<{ qty: number, price: number }[]>([{ qty: 1, price: 0 }]);
  const [showProductSelector, setShowProductSelector] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coupons'), (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Brand owners only see their own brand's coupons
      setCoupons(isBrandOwner && myBrandId ? all.filter((c: any) => c.brandId === myBrandId) : all);
      setLoading(false);
    });

    // Fetch products for bundle selection (filtered by brand if brand_owner)
    getDocs(collection(db, 'products')).then(snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(isBrandOwner && myBrandId ? all.filter((p: any) => p.brandId === myBrandId) : all);
    });

    return unsub;
  }, []);

  const handleCreate = async () => {
    if (!code) { Alert.alert(t('error'), t('codeRequired')); return; }

    let couponData: any = {
      code: code.trim().toUpperCase(),
      type,
      isActive,
      createdAt: serverTimestamp(),
      minOrder: minOrder ? parseFloat(minOrder) : 0,
    };

    // Tag with brandId so brand owners can only see their own coupons
    if (isBrandOwner && myBrandId) couponData.brandId = myBrandId;

    if (type === 'bundle_price') {
      if (!targetProductId) { Alert.alert(t('error'), t('selectProduct')); return; }
      const validTiers = tiers.filter(t => t.qty > 0 && t.price >= 0);
      if (validTiers.length === 0) { Alert.alert(t('error'), t('addPriceTier')); return; }
      couponData.targetProductId = targetProductId;
      couponData.tiers = validTiers;
      couponData.value = 0;
    } else {
      couponData.value = value ? parseFloat(value) : 0;
    }

    try {
      await addDoc(collection(db, 'coupons'), couponData);
      setCode(''); setValue(''); setMinOrder('');
      setTargetProductId(''); setTiers([{ qty: 1, price: 0 }]);
      Alert.alert(t('successTitle'), t('couponCreated'));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', id));
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const toggleActive = async (item: any) => {
    try {
      await updateDoc(doc(db, 'coupons', item.id), { isActive: !item.isActive });
    } catch (e) { console.error(e); }
  };

  const addTier = () => setTiers([...tiers, { qty: 0, price: 0 }]);
  const removeTier = (index: number) => setTiers(tiers.filter((_, i) => i !== index));
  const updateTier = (index: number, field: 'qty' | 'price', val: string) => {
    const newTiers = [...tiers];
    newTiers[index][field] = parseFloat(val) || 0;
    setTiers(newTiers);
  };

  const getProductName = (id: string) => {
    const p = products.find(prod => prod.id === id);
    if (!p) return 'Unknown Product';

    // Handle localized name object
    if (typeof p.name === 'object' && p.name !== null) {
      return p.name.en || p.name.fr || p.name['ar-tn'] || Object.values(p.name)[0] || 'Unknown Product';
    }

    return p.name || 'Unknown Product';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <ChevronLeft size={20} color={appColors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground }]}>{t('coupons')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.settingsSectionPremium, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border }]}>
          <Text style={[styles.settingsLabel, { color: appColors.foreground }]}>{t('createCoupon')}</Text>

          <TextInput
            style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border, textTransform: 'uppercase', marginBottom: 15 }]}
            placeholder="CODE (e.g. SAVE20)"
            placeholderTextColor="#666"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15, flexWrap: 'wrap' }}>
            {['percentage', 'fixed', 'free_shipping', 'bundle_price'].map((tOpt) => (
              <TouchableOpacity
                key={tOpt}
                onPress={() => setType(tOpt as any)}
                style={[styles.catChip, { backgroundColor: type === tOpt ? appColors.foreground : (theme === 'dark' ? '#171720' : '#f0f0f0') }, type === tOpt && styles.activeCatChip]}
              >
                <Text style={[styles.catChipText, { color: type === tOpt ? (theme === 'dark' ? '#000' : '#FFF') : appColors.foreground }, type === tOpt && styles.activeCatChipText]}>
                  {tOpt === 'free_shipping' ? t('freeShip') : tOpt === 'bundle_price' ? t('bundle') : t(tOpt).toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {type === 'bundle_price' ? (
            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', marginBottom: 5, color: appColors.foreground }}>{t('targetProductLabel')}</Text>
              <TouchableOpacity
                style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', borderColor: appColors.border, justifyContent: 'center' }]}
                onPress={() => setShowProductSelector(!showProductSelector)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {targetProductId && products.find(p => p.id === targetProductId)?.images?.[0] && (
                    <Image source={{ uri: products.find(p => p.id === targetProductId)?.images[0] }} style={{ width: 30, height: 30, borderRadius: 4, backgroundColor: theme === 'dark' ? '#121218' : '#eee' }} />
                  )}
                  <Text style={{ color: targetProductId ? appColors.foreground : '#666' }}>
                    {targetProductId ? getProductName(targetProductId) : t('selectProductPlaceholder')}
                  </Text>
                </View>
              </TouchableOpacity>

              {showProductSelector && (
                <View style={{ maxHeight: 200, backgroundColor: theme === 'dark' ? '#171720' : '#f9f9f9', borderRadius: 8, marginTop: 5, borderWidth: 1, borderColor: appColors.border }}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                    {products.map(p => (
                      <TouchableOpacity key={p.id} onPress={() => { setTargetProductId(p.id); setShowProductSelector(false); }} style={{
                        padding: 10
                        , flexDirection: 'row', alignItems: 'center', gap: 10
                      }}>
                        {p.images && p.images[0] && (
                          <Image source={{ uri: p.images[0] }} style={{ width: 30, height: 30, borderRadius: 4, backgroundColor: theme === 'dark' ? '#121218' : '#eee' }} />
                        )}
                        <Text style={{ fontSize: 12, color: appColors.foreground }}>{getProductName(p.id)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={{ fontSize: 12, fontWeight: '700', marginVertical: 10, color: appColors.foreground }}>{t('priceTiers')}</Text>
              {tiers.map((tier, index) => (
                <View key={index} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  <TextInput
                    style={[styles.adminInput, { flex: 1, marginBottom: 0, backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]}
                    placeholder={t('qty')}
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={tier.qty ? tier.qty.toString() : ''}
                    onChangeText={(v) => updateTier(index, 'qty', v)}
                  />
                  <TextInput
                    style={[styles.adminInput, { flex: 1, marginBottom: 0, backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]}
                    placeholder={t('price')}
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={tier.price ? tier.price.toString() : ''}
                    onChangeText={(v) => updateTier(index, 'price', v)}
                  />
                  {tiers.length > 1 && (
                    <TouchableOpacity onPress={() => removeTier(index)} style={{ justifyContent: 'center', padding: 5 }}>
                      <X size={20} color={appColors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity onPress={addTier} style={{ alignSelf: 'flex-start', padding: 5 }}>
                <Text style={{ color: appColors.foreground, fontWeight: '700', fontSize: 12 }}>{t('addTierBtn')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            type !== 'free_shipping' && (
              <TextInput
                style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border, marginBottom: 15 }]}
                placeholder={type === 'percentage' ? "Percentage (e.g. 20 for 20%)" : "Value (e.g. 10 for 10 TND)"}
                placeholderTextColor="#666"
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
              />
            )
          )}

          <TextInput
            style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border, marginBottom: 15 }]}
            placeholder={t('minOrder') + " (Optional)"}
            placeholderTextColor="#666"
            value={minOrder}
            onChangeText={setMinOrder}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.saveBtnPremium, { marginTop: 15, backgroundColor: appColors.foreground }]}
            onPress={handleCreate}
          >
            <Text style={[styles.saveBtnPremiumText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('createCoupon')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.settingsLabel, { marginTop: 30, marginBottom: 15 }]}>{t('active')}</Text>
        {coupons.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ticket size={48} color={appColors.textMuted} strokeWidth={1} style={{ opacity: 0.5 }} />
            <Text style={{ marginTop: 15, color: appColors.textMuted, fontWeight: '600' }}>{t('noCoupons')}</Text>
          </View>
        ) : coupons.map((coupon) => (
          <View key={coupon.id} style={[styles.modernCartItem, { flexDirection: 'column', padding: 20, backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border, borderWidth: 1, borderRadius: 28, overflow: 'hidden' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: appColors.foreground, letterSpacing: 0.5 }}>{coupon.code}</Text>
                  <View style={{ backgroundColor: coupon.isActive ? '#EBFDF5' : '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: coupon.isActive ? '#10B981' : '#EF4444' }}>{coupon.isActive ? t('activeStatus') : t('inactiveStatus')}</Text>
                  </View>
                </View>

                <View style={{ marginTop: 10, gap: 4 }}>
                  {coupon.type === 'free_shipping' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Package size={14} color={appColors.accent} />
                      <Text style={{ fontSize: 13, color: appColors.foreground, fontWeight: '700' }}>{t('freeShip')}</Text>
                    </View>
                  )}
                  {coupon.type === 'percentage' && <Text style={{ fontSize: 13, color: appColors.foreground, fontWeight: '700' }}>{coupon.value}{t('offOrder')}</Text>}
                  {coupon.type === 'fixed' && <Text style={{ fontSize: 13, color: appColors.foreground, fontWeight: '700' }}>{coupon.value} {t('tndDiscount')}</Text>}
                  {coupon.type === 'bundle_price' && (
                    <View>
                      <Text style={{ fontSize: 13, color: appColors.foreground, fontWeight: '700' }}>{t('bundle')}: {getProductName(coupon.targetProductId)}</Text>
                      {coupon.tiers?.map((tier: any, i: number) => (
                        <Text key={i} style={{ fontSize: 12, color: appColors.textMuted, marginLeft: 15, marginTop: 2 }}>
                          • {t('buyXforY').replace('{{qty}}', tier.qty).replace('{{price}}', tier.price)}
                        </Text>
                      ))}
                    </View>
                  )}
                  {coupon.minOrder > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Text style={{ fontSize: 11, color: appColors.textMuted }}>{t('minOrderLabel')} </Text>
                      <Text style={{ fontSize: 11, color: appColors.foreground, fontWeight: '700' }}>{coupon.minOrder} TND</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={{ gap: 15, alignItems: 'center' }}>
                <TouchableOpacity onPress={() => toggleActive(coupon)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
                  <RotateCcw size={18} color={appColors.foreground} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(coupon.id)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Design Element: Dashed line Divider */}
            <View style={{ height: 1, width: '100%', borderStyle: 'dashed', borderWidth: 1, borderColor: appColors.border, marginVertical: 15, opacity: 0.5 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={12} color={appColors.textMuted} />
              <Text style={{ fontSize: 10, color: appColors.textMuted, fontWeight: '600' }}>VALID UNTIL MANUALLY REMOVED</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
// --- ADMIN USERS (CLIENTS) ---
function AdminUsersScreen({ onBack, t, language }: any) {
  const { colors: appColors, theme } = useAppTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userRole, setUserRole] = useState('customer');
  const [userBrandId, setUserBrandId] = useState('');

  useEffect(() => {
    fetchData();
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const snap = await getDocs(collection(db, 'brands'));
      setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e) }
  }

  const fetchData = async () => {
    try {
      // Fetch users - matching web version query
      const usersQuery = query(collection(db, 'users'));
      const usersSnap = await getDocs(usersQuery);
      const allUsers = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
      // Clients list = non-admins (including brand owners)
      setUsers(allUsers.filter((u: any) => u.role !== 'admin'));

      // Fetch all orders to calculate customer stats
      const ordersSnap = await getDocs(collection(db, 'orders'));
      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openRoleEdit = (user: any) => {
    setSelectedUser(user);
    setUserRole(user.role || 'customer');
    setUserBrandId(user.brandId || '');
    setRoleModalVisible(true);
  };

  const updateRoleAndBrand = async () => {
    if (!selectedUser) return;
    try {
      const b = brands.find(b => b.id === userBrandId);
      const isBrandRole = ['brand_owner', 'nor_kam', 'admin'].includes(userRole);
      const updates: any = {
        role: userRole,
        brandId: isBrandRole ? userBrandId : null,
        brandName: (isBrandRole && b) ? (b.name?.fr || b.name) : null
      };
      await updateDoc(doc(db, 'users', selectedUser.uid), updates);
      setUsers(users.map(u => u.uid === selectedUser.uid ? { ...u, ...updates } : u));
      setRoleModalVisible(false);
      Alert.alert(t('successTitle'), t('accountUpdated'));
    } catch (e) {
      console.error(e);
      Alert.alert(t('error'), t('updateFailed'));
    }
  };

  const getUserStats = (user: any) => {
    if (user.role === 'brand_owner' && user.brandId) {
      // Brand Owner Stats: Revenue from their products, Orders containing their products
      const brandOrders = orders.filter(o => o.items && o.items.some((i: any) => i.brandId === user.brandId));
      const totalRevenue = brandOrders.reduce((sum, o) => {
        const orderRevenue = o.items
          .filter((i: any) => i.brandId === user.brandId)
          .reduce((s: number, i: any) => s + ((parseFloat(i.price) || 0) * (i.quantity || 1)), 0);
        return sum + orderRevenue;
      }, 0);
      const completedOrders = brandOrders.filter(o => o.status === 'delivered').length;
      return {
        totalOrders: brandOrders.length,
        totalSpent: totalRevenue, // Used as Revenue for brand owners
        completedOrders,
        lastOrder: brandOrders.length > 0 ? brandOrders[0] : null
      };
    } else {
      // Customer Stats: Orders placed by them
      const userOrders = orders.filter(o => o.userId === user.uid);
      const totalSpent = userOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
      const completedOrders = userOrders.filter(o => o.status === 'delivered').length;
      return {
        totalOrders: userOrders.length,
        totalSpent,
        completedOrders,
        lastOrder: userOrders.length > 0 ? userOrders[0] : null
      };
    }
  };

  const toggleBan = async (user: any) => {
    const action = user.isBanned ? 'unban' : 'ban';
    Alert.alert(
      t(action + 'User'),
      t('confirm' + action.charAt(0).toUpperCase() + action.slice(1)),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t(action),
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'users', user.uid), { isBanned: !user.isBanned });
              setUsers(users.map(u => u.uid === user.uid ? { ...u, isBanned: !user.isBanned } : u));
              Alert.alert(t('successTitle'), t('accountUpdated'));
            } catch (err) {
              console.error(err);
              Alert.alert(t('error'), t('updateFailed'));
            }
          }
        }
      ]
    );
  };

  const deleteUser = async (user: any) => {
    Alert.alert(
      t('deleteUser'),
      t('confirmDeleteUser'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', user.uid));
              setUsers(users.filter(u => u.uid !== user.uid));
              Alert.alert(t('successTitle'), t('accountUpdated'));
            } catch (err) {
              console.error(err);
              Alert.alert(t('error'), t('updateFailed'));
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q);
  });

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const totalCustomers = users.length;
  const totalRevenue = users.reduce((sum, u) => {
    if (u.role === 'brand_owner') return sum; // Don't add brand revenue to platform total revenue here to avoid double counting if needed, or simply sum platform orders separately. 
    // Actually, 'totalRevenue' usually means Platform Total Revenue. 
    // The previous logic accumulated totalSpent of ALL users. 
    // If we change getUserStats for brand_owner, this reduce might break if we just sum totalSpent.
    // However, existing logic used getUserStats(u.uid).totalSpent.
    // For customers, totalSpent is what they paid. For brand owners, it is what they earned.
    // We should probably ONLY sum up customers' spending for Platform Revenue.
    if (u.role === 'admin' || u.role === 'brand_owner') return sum;
    return sum + getUserStats(u).totalSpent;
  }, 0);
  const bannedCount = users.filter(u => u.isBanned).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#0A0A0A' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <ChevronLeft size={20} color={appColors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground }]}>{t('clients').toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Cards */}
      <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
          <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#121218' : '#F9F9F9', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: appColors.border }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: appColors.textMuted, marginBottom: 5 }}>{t('total').toUpperCase()}</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: appColors.foreground }}>{totalCustomers}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#121218' : '#F9F9F9', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: appColors.border }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: appColors.textMuted, marginBottom: 5 }}>{t('revenue').toUpperCase()}</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: appColors.foreground }}>{totalRevenue.toFixed(0)} TND</Text>
          </View>
          {bannedCount > 0 && (
            <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#311212' : '#FEE2E2', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#DC2626' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#DC2626', marginBottom: 5 }}>{t('banned').toUpperCase()}</Text>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#DC2626' }}>{bannedCount}</Text>
            </View>
          )}
        </View>

        {/* Search Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? '#121218' : '#F2F2F7', borderRadius: 12, paddingHorizontal: 15, height: 45, borderWidth: 1, borderColor: appColors.border }}>
          <Search size={18} color={appColors.textMuted} />
          <TextInput
            style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: appColors.foreground }}
            placeholder={t('searchClients')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={appColors.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={appColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={appColors.foreground} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          contentContainerStyle={{ padding: 20, paddingTop: 0 }}
          keyExtractor={item => item.uid}
          renderItem={({ item }) => {
            const stats = getUserStats(item);
            const isExpanded = expandedUser === item.uid;
            const isBanned = item.isBanned === true;

            return (
              <TouchableOpacity
                onPress={() => setExpandedUser(isExpanded ? null : item.uid)}
                style={[
                  styles.orderCard,
                  {
                    marginBottom: 12,
                    backgroundColor: theme === 'dark' ? '#121218' : 'white',
                    borderColor: isBanned ? '#EF4444' : appColors.border,
                    borderWidth: isBanned ? 2 : 1
                  }
                ]}
                activeOpacity={0.7}
              >
                {/* Customer Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: isBanned ? (theme === 'dark' ? '#311212' : '#FEE2E2') : (theme === 'dark' ? '#000' : '#F2F2F7'),
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    overflow: 'hidden'
                  }}>
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} style={{ width: 50, height: 50, borderRadius: 25, opacity: isBanned ? 0.5 : 1 }} />
                    ) : (
                      <Text style={{ fontWeight: '900', fontSize: 16, color: isBanned ? '#EF4444' : appColors.textMuted }}>{getInitials(item.fullName)}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontWeight: '800', fontSize: 15, color: isBanned ? '#EF4444' : appColors.foreground }}>
                        {item.fullName || 'Unknown'}
                      </Text>
                      {isBanned && (
                        <View style={{ backgroundColor: '#EF4444', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ color: 'white', fontSize: 8, fontWeight: '900' }}>{t('banned').toUpperCase()}</Text>
                        </View>
                      )}
                      {item.role === 'brand_owner' && (
                        <View style={{ backgroundColor: appColors.foreground, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ color: theme === 'dark' ? '#000' : '#FFF', fontSize: 8, fontWeight: '900' }}>{item.brandName?.toUpperCase() || 'OWNER'}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 11, color: appColors.textMuted, marginTop: 2 }}>
                      {item.email} • {t(item.role === 'brand_owner' ? 'brandOwner' : (item.role === 'nor_kam' ? 'norKam' : (item.role || 'customer'))).toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => openRoleEdit(item)} style={{ marginRight: 10 }}>
                    <Settings size={20} color={appColors.foreground} />
                  </TouchableOpacity>
                  <ChevronDown
                    size={20}
                    color={appColors.textMuted}
                    style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                  />
                </View>

                {/* Quick Stats Grid */}
                <View style={{
                  flexDirection: 'row',
                  gap: 8,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme === 'dark' ? '#17171F' : '#f0f0f0'
                }}>
                  <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9F9', borderRadius: 8, padding: 10 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: appColors.textMuted, marginBottom: 3 }}>{t('orders').toUpperCase()}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: appColors.foreground }}>{stats.totalOrders}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9F9', borderRadius: 8, padding: 10 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: appColors.textMuted, marginBottom: 3 }}>{t('completed').toUpperCase()}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#10B981' }}>{stats.completedOrders}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9F9', borderRadius: 8, padding: 10 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: appColors.textMuted, marginBottom: 3 }}>{item.role === 'brand_owner' ? t('revenue').toUpperCase() : 'AVG'}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: appColors.foreground }}>
                      {item.role === 'brand_owner'
                        ? stats.totalSpent.toFixed(0)
                        : (stats.totalOrders > 0 ? (stats.totalSpent / stats.totalOrders).toFixed(0) : '0')} TND
                    </Text>
                  </View>
                </View>

                {/* Expanded Details */}
                {isExpanded && (
                  <Animatable.View animation="fadeIn" duration={300}>
                    <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: theme === 'dark' ? '#17171F' : '#f0f0f0' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: appColors.textMuted, marginBottom: 10 }}>{t('contactInfo').toUpperCase()}</Text>
                      <View style={{ gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
                            <Mail size={14} color={appColors.foreground} />
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '600', flex: 1, color: appColors.foreground }}>{item.email}</Text>
                        </View>
                        {item.phone && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
                              <Phone size={14} color={appColors.foreground} />
                            </View>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: appColors.foreground }}>{item.phone}</Text>
                          </View>
                        )}
                        {item.address && (
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
                              <MapPin size={14} color={appColors.foreground} />
                            </View>
                            <Text style={{ fontSize: 13, fontWeight: '600', flex: 1, color: appColors.foreground }}>{item.address}</Text>
                          </View>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
                            <Calendar size={14} color={appColors.foreground} />
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: appColors.foreground }}>
                            {t('joined')} {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR') : 'N/A'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: theme === 'dark' ? '#17171F' : '#f0f0f0', flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => toggleBan(item)}
                        style={{
                          flex: 1,
                          backgroundColor: isBanned ? '#10B981' : (theme === 'dark' ? '#3F2B00' : '#FEF3C7'),
                          borderRadius: 10,
                          paddingVertical: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8
                        }}
                      >
                        <Shield size={16} color={isBanned ? 'white' : (theme === 'dark' ? '#FFD666' : '#D97706')} />
                        <Text style={{ fontWeight: '800', fontSize: 10, color: isBanned ? 'white' : (theme === 'dark' ? '#FFD666' : '#D97706') }}>
                          {isBanned ? t('unban').toUpperCase() : t('banUser').toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteUser(item)}
                        style={{
                          flex: 1, // ...
                          backgroundColor: theme === 'dark' ? '#311212' : '#FEE2E2',
                          borderRadius: 10,
                          paddingVertical: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8
                        }}
                      >
                        <Trash2 size={16} color="#EF4444" />
                        <Text style={{ fontWeight: '800', fontSize: 10, color: '#EF4444' }}>{t('delete').toUpperCase()}</Text>
                      </TouchableOpacity>
                    </View>
                  </Animatable.View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={{ fontSize: 14, color: appColors.textMuted, fontWeight: '600' }}>{t('noClients')}</Text>
            </View>
          }
        />
      )}

      {/* Role Management Modal */}
      <Modal visible={roleModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0A0A0F' : '#FAFAFA' }}>
          <SafeAreaView style={{ backgroundColor: theme === 'dark' ? '#000' : 'white' }}>
            <View style={{ height: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                <Text style={{ fontWeight: '700', color: appColors.textMuted, fontSize: 10 }}>{t('cancel').toUpperCase()}</Text>
              </TouchableOpacity>
              <Text style={[styles.modernLogo, { color: appColors.foreground, fontSize: 11, left: 80, right: 80 }]}>{t('assignRole').toUpperCase()}</Text>
              <TouchableOpacity onPress={updateRoleAndBrand} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                <Text style={{ fontWeight: '900', color: appColors.foreground, fontSize: 10 }}>{t('save').toUpperCase()}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <ScrollView contentContainerStyle={{ padding: 25 }}>
            <View style={{ alignItems: 'center', marginBottom: 30 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme === 'dark' ? '#121218' : '#F2F2F7', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
                <UsersIcon size={40} color={appColors.foreground} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: appColors.foreground }}>{selectedUser?.fullName}</Text>
              <Text style={{ fontSize: 13, color: appColors.textMuted }}>{selectedUser?.email}</Text>
            </View>

            <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('role').toUpperCase()}</Text>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 25 }}>
              {['customer', 'brand_owner', 'nor_kam', 'admin', 'editor', 'support'].map(r => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setUserRole(r)}
                  style={{
                    paddingHorizontal: 20, paddingVertical: 10,
                    backgroundColor: userRole === r ? appColors.foreground : (theme === 'dark' ? '#121218' : 'white'),
                    borderRadius: 20, borderWidth: 1, borderColor: userRole === r ? appColors.foreground : appColors.border
                  }}
                >
                  <Text style={{ color: userRole === r ? (theme === 'dark' ? '#000' : '#FFF') : appColors.foreground, fontWeight: '700', fontSize: 11 }}>
                    {t(r === 'brand_owner' ? 'brandOwner' : (r === 'nor_kam' ? 'norKam' : r)).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {['brand_owner', 'nor_kam', 'admin'].includes(userRole) && (
              <>
                <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('selectBrand').toUpperCase()}</Text>
                <View style={{ gap: 10 }}>
                  {brands.map(b => (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => setUserBrandId(b.id)}
                      style={{
                        padding: 15, borderRadius: 12, borderWidth: 1,
                        borderColor: userBrandId === b.id ? appColors.foreground : appColors.border,
                        backgroundColor: userBrandId === b.id ? (theme === 'dark' ? '#121218' : '#F9F9F9') : 'transparent',
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
                      }}
                    >
                      <Text style={{ color: appColors.foreground, fontWeight: '700' }}>{b.name?.fr || b.name}</Text>
                      {userBrandId === b.id && <CheckCircle2 size={18} color={appColors.foreground} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PlaceholderAdminScreen({ title, onBack, t }: any) {
  const { colors, theme } = useAppTheme();
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#000' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
          <ChevronLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.modernLogo}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.centered}>
        <Text style={{ color: colors.textMuted, fontWeight: '700' }}>COMING SOON</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  shippingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  // Admin Menu
  adminMenuCard: { width: (width - 55) / 2, backgroundColor: 'transparent', padding: 25, borderRadius: 24, marginBottom: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F2F2F7', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  adminIconBox: { width: 54, height: 54, borderRadius: 20, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  adminMenuText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, color: Colors.foreground, textAlign: 'center' },

  teamCard: { backgroundColor: 'transparent', borderRadius: 20, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#F2F2F7', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  teamRoleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F2F2F7', marginRight: 10 },

  // Dashboard & Logic styles
  statCard: { width: '47%', backgroundColor: 'transparent', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#F2F2F7', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  statIconBox: { width: 48, height: 48, borderRadius: 20, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  statValue: { fontSize: 18, fontWeight: '900', color: Colors.foreground, marginBottom: 4 },
  statLabel: { fontSize: 9, fontWeight: '800', color: Colors.textMuted, marginTop: 2, letterSpacing: 1.5 },


  productAdminCard: { flexDirection: 'row', backgroundColor: 'transparent', padding: 18, borderRadius: 22, marginBottom: 15, borderWidth: 1, borderColor: '#F2F2F7', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, marginBottom: 8, marginLeft: 5, marginTop: 15 },
  orderCard: { backgroundColor: 'transparent', padding: 20, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: '#F2F2F7', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  statusTag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  statusText: { color: 'white', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  teamRoleText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: Colors.foreground },
  roleOption: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 5, borderWidth: 1, borderColor: '#eee' },
  roleOptionActive: { backgroundColor: Colors.foreground, borderColor: Colors.foreground },
  roleOptionText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  roleOptionTextActive: { color: 'white' },

  mainContainer: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  fullScreen: { width: width, height: height },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Tab Bar Modern & Compact
  tabBarWrapper: { position: 'absolute', bottom: 25, left: 24, right: 24, alignItems: 'center' },
  glassTabBar: {
    width: '100%',
    height: 64,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 22,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F2F2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 1000,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.8, color: '#AEAEB2', marginTop: 4, textTransform: 'uppercase' },
  activeTabLabel: { color: Colors.foreground },
  tabAvatarContainer: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
  tabAvatar: { width: 26, height: 26, borderRadius: 13 },


  // Onboarding Glass
  onboardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  onboardGlass: {
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    width: '100%',
  },
  glassBrand: { color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: 6, marginBottom: 10, textAlign: 'center' },
  glassTagline: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500', marginBottom: 40, textAlign: 'center' },
  glassBtn: { backgroundColor: 'white', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 100 },
  glassBtnText: { color: 'black', fontWeight: '900', fontSize: 9, letterSpacing: 2 },

  // Auth Modern (Compact)
  authContainer: { flex: 1 },
  authTopDecoration: { height: height * 0.18 },
  authContent: { flex: 1, marginTop: -32, padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  authBrand: { fontSize: 9, fontWeight: '900', letterSpacing: 4, marginBottom: 8, textAlign: 'center' },
  authTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 32, textAlign: 'center' },
  formCard: { gap: 12 },
  modernInput: { height: 52, backgroundColor: 'transparent', borderRadius: 14, paddingHorizontal: 18, fontSize: 14, borderWidth: 1, borderColor: '#C7C7CC' },
  adminInput: { height: 50, backgroundColor: 'transparent', borderRadius: 15, paddingHorizontal: 15, fontSize: 13, fontWeight: '600', borderWidth: 1, borderColor: '#C7C7CC' },
  modernPrimaryBtn: { backgroundColor: Colors.foreground, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  modernPrimaryBtnText: { color: 'white', fontWeight: '800', fontSize: 9.5, letterSpacing: 1.5 },
  switchAuthText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  // Header (Compact)
  // Header Modern
  modernHeader: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 1000 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 28, height: 28, borderRadius: 8, marginRight: 10 },
  logoLarge: { width: 80, height: 80, borderRadius: 20, marginBottom: 20 },
  headerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.foreground, marginRight: 12 },
  modernLogo: { fontSize: 13, fontWeight: '900', letterSpacing: 1, position: 'absolute', left: 50, right: 50, textAlign: 'center', textAlignVertical: 'center', zIndex: 1 },
  searchCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  headerAvatarContainer: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 10 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21 },

  // Hero
  modernHero: { height: 500, overflow: 'hidden', backgroundColor: '#F2F2F7' },
  modernHeroImg: { width: '100%', height: '100%', opacity: 1 },
  heroGlassBadge: { position: 'absolute', top: 25, left: 25, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroBadgeText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  modernHeroFooter: { position: 'absolute', bottom: 40, left: 25, right: 25 },
  modernHeroTitle: { color: 'white', fontSize: 38, fontWeight: '900', letterSpacing: -1, lineHeight: 42, marginBottom: 25 },
  modernHeroBtn: { backgroundColor: 'white', height: 55, paddingHorizontal: 35, borderRadius: 30, alignSelf: 'flex-start', justifyContent: 'center' },
  modernHeroBtnText: { color: 'black', fontWeight: '900', fontSize: 9.5, letterSpacing: 1 },

  // Sections (Compact)
  modernSection: { marginTop: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionHeaderNoPad: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modernSectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 4, textTransform: 'uppercase' },
  modernSectionLink: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  exploreBtn: { paddingVertical: 5 },
  modernCatCard: { width: 72, height: 72, backgroundColor: 'transparent', borderRadius: 36, borderWidth: 1, borderColor: '#F2F2F7', overflow: 'hidden' },
  catBgImage: { width: '100%', height: '100%' },
  catOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  modernCatText: { fontSize: 11, fontWeight: '900', letterSpacing: 1, color: 'white' },
  modernCatDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'white', marginTop: 8 },

  carouselContainer: { height: 500, marginBottom: 10 },
  adCard: { width: width * 0.75, height: 220, borderRadius: 25, overflow: 'hidden', backgroundColor: 'transparent', borderWidth: 1, borderColor: '#F2F2F7', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  adMedia: { width: '100%', height: '100%', position: 'absolute' },
  adContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(0,0,0,0.3)' },
  adTitle: { color: 'white', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  adBtn: { marginTop: 10, alignSelf: 'flex-start', borderBottomWidth: 1, borderBottomColor: 'white' },
  adBtnText: { color: 'white', fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Grid & Product Cards (Refined)
  modernGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between' },
  modernProductCard: { width: (width - 44) / 2, marginBottom: 20, position: 'relative' },
  modernProductImg: { width: '100%', aspectRatio: 1.1, backgroundColor: '#F9F9FB', overflow: 'hidden' },
  modernProductInfo: { padding: 12 },
  modernProductHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modernProductName: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  modernProductPrice: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  productDescription: { fontSize: 10, marginTop: 3, fontWeight: '500' },
  modernQuickAdd: { position: 'absolute', bottom: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 3, zIndex: 50 },
  modernWishlistBtn: { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, zIndex: 50 },

  // Profile Premium (Consolidated)
  profileGlassCard: { backgroundColor: 'white', borderRadius: 35, padding: 35, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  profileSub: { fontSize: 13, color: Colors.textMuted, marginTop: 5 },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  profileRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  profileRowText: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginLeft: 15 },

  // Detail Modern
  detailFullImage: { width: width, height: height * 0.52 },
  glassBackBtn: { position: 'absolute', top: 50, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, zIndex: 100 },
  detailBottomContent: { flex: 1, marginTop: -35, backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15 },
  dragIndicator: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E5EA', alignSelf: 'center', marginBottom: 20 },
  detailBrandName: { fontSize: 9, fontWeight: '700', letterSpacing: 2.5, marginBottom: 8, textTransform: 'uppercase' },
  detailTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  detailProductName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, flex: 1 },
  detailProductPrice: { fontSize: 19, fontWeight: '700', marginTop: 4 },
  detailGlassDivider: { height: 1.2, backgroundColor: 'transparent', marginVertical: 20 },
  modernDetailLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  sizeGuideText: { fontSize: 11, fontWeight: '600' },
  modernSizeGrid: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  modernSizeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center', minWidth: 48 },
  activeSizeBtn: {},
  modernSizeText: { fontWeight: '700', fontSize: 12 },
  activeSizeText: { color: 'white' },
  mainActionBtn: { height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  mainActionBtnText: { color: 'white', fontWeight: '800', fontSize: 11, letterSpacing: 1.5 },
  detailDescriptionText: { fontSize: 13, lineHeight: 19, fontWeight: '400' },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1 },
  activeColorDot: { borderWidth: 2, padding: 2 },

  // Cart Specific
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  cartItemImg: { width: 80, height: 100, borderRadius: 15, backgroundColor: '#F2F2F7' },
  cartItemInfo: { flex: 1, marginLeft: 20 },
  cartItemName: { fontSize: 14, fontWeight: '900', letterSpacing: -0.5 },
  cartItemMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 4, letterSpacing: 1 },
  cartItemPrice: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  cartSummary: { padding: 30, borderTopLeftRadius: 35, borderTopRightRadius: 35 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1 },
  summaryValue: { fontSize: 13, fontWeight: '600' },
  cartBadge: { position: 'absolute', top: -8, right: -10, backgroundColor: Colors.error, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  cartBadgeText: { color: 'white', fontSize: 10, fontWeight: '900' },

  // Modern Cart Styles
  modernCartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', borderRadius: 24, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  modernCartImg: { width: 85, height: 110, borderRadius: 18, backgroundColor: '#F2F2F7' },
  modernCartName: { fontSize: 13, fontWeight: '900', letterSpacing: -0.3, marginBottom: 4 },
  modernCartMeta: { fontSize: 11, color: Colors.textMuted, marginBottom: 6 },
  modernCartPrice: { fontSize: 15, fontWeight: '800' },
  modernDeleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  modernCartSummary: { padding: 25, marginTop: 10, borderTopLeftRadius: 45, borderTopRightRadius: 45, shadowColor: '#000', shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 15 },
  modernCartInput: { borderRadius: 18, paddingHorizontal: 20, paddingVertical: 16, fontSize: 13, fontWeight: '500', borderWidth: 1, borderColor: '#F0F0F3' },

  // Shop specific
  shopHeader: { paddingHorizontal: 25, paddingVertical: 20 },
  searchBar: { height: 55, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 20, marginTop: 15, fontSize: 14, fontWeight: '600' },
  miniInput: { backgroundColor: 'white', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 12, fontSize: 13, borderWidth: 1, borderColor: '#F2F2F7', minHeight: 50 },

  // New Styles
  imagePagination: { position: 'absolute', bottom: 60, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  paginationDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activePaginationDot: { width: 14, backgroundColor: 'white' },
  backBtnSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', zIndex: 10 },

  // orderCard removed (duplicate)
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  orderId: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  orderDate: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  // statusTag removed (duplicate)
  // statusText removed (duplicate)
  orderItemsPreview: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  orderItemThumb: { width: 50, height: 65, borderRadius: 10, backgroundColor: '#F2F2F7', borderWidth: 1, borderColor: '#EEE' },
  orderFooter: { borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTotalLabel: { fontSize: 9, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1 },
  orderTotalValue: { fontSize: 14, fontWeight: '900' },

  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, marginRight: 10, borderWidth: 1 },
  activeCatChip: { backgroundColor: 'transparent' },
  catChipText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  activeCatChipText: { color: 'white' },

  settingsSection: { borderRadius: 25, padding: 20, marginBottom: 20, borderWidth: 1 },
  settingsLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15, marginLeft: 5 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  settingsRowText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  deleteAccountBtn: { marginTop: 40, padding: 20, backgroundColor: '#FFF0F0', borderRadius: 20, alignItems: 'center' },
  deleteAccountText: { color: Colors.error, fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  // Profile Premium
  profileHero: { padding: 30, paddingTop: 60 },
  profileAvatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', overflow: 'hidden', position: 'relative' },
  fullAvatar: { width: '100%', height: '100%' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.foreground, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'white', zIndex: 50, elevation: 5 },
  avatarText: { fontSize: 32, fontWeight: '700', color: Colors.foreground },
  profileNameBig: { fontSize: 24, fontWeight: '900', color: Colors.foreground, marginTop: 15, textAlign: 'center', letterSpacing: -0.5 },
  homeLiveCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeLiveImage: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
  },
  homeLiveBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  homeLiveBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
  editProfileBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 100, backgroundColor: Colors.foreground },
  editProfileBtnText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  menuContainer: { padding: 30 },
  menuSectionLabel: { fontSize: 9, fontWeight: '900', color: Colors.textMuted, letterSpacing: 2, marginBottom: 20 },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  menuRowText: { fontSize: 11.5, fontWeight: '700', color: Colors.foreground, letterSpacing: 0.5, textTransform: 'uppercase' },
  socialCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEE' },

  // Settings Premium
  settingsSectionPremium: { borderRadius: 30, padding: 25, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 15, borderWidth: 1, borderColor: 'transparent' },
  premiumInputGroup: { marginBottom: 20 },
  inputLabelField: { fontSize: 9, fontWeight: '900', color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 8, marginLeft: 5 },
  premiumInput: { borderRadius: 15, padding: 15, fontSize: 13, fontWeight: '600' },
  saveBtnPremium: { marginTop: 10, height: 55, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  saveBtnPremiumText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  settingsRowSwitch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  switchTitle: { fontSize: 12, fontWeight: '700', color: Colors.foreground },
  switchSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  customSwitch: { width: 46, height: 26, borderRadius: 13, backgroundColor: '#8E8E93', padding: 3, justifyContent: 'center' },
  customSwitchActive: { backgroundColor: '#34C759' },
  switchDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
  switchDotActive: { alignSelf: 'flex-end' },
  settingsRowMinimal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  settingsRowTextMinimal: { fontSize: 12, fontWeight: '600', color: Colors.foreground },
  deactivateBtn: { marginTop: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20, backgroundColor: '#FFF0F0', borderRadius: 20 },
  deactivateBtnText: { color: Colors.error, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  campaignContent: { padding: 30, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, minHeight: 400 },
  campaignTitle: { fontSize: 24, fontWeight: '900', color: Colors.foreground, marginBottom: 15, letterSpacing: 1 },
  campaignDivider: { width: 40, height: 4, backgroundColor: Colors.accent, marginBottom: 20, borderRadius: 2 },
  campaignDesc: { fontSize: 15, color: Colors.textMuted, lineHeight: 24, marginBottom: 40, fontWeight: '500' },
  campaignMainBtn: { backgroundColor: Colors.foreground, height: 60, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.foreground, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 },
  campaignBtnText: { color: 'white', fontWeight: '900', letterSpacing: 2, fontSize: 13 },
  timerBox: { paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  timerText: { color: '#333', fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timerPill: { flexDirection: 'row', backgroundColor: '#FFD700', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', gap: 2 },
  flashSectionContainer: { marginTop: 30 },
  flashHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
  flashTitleText: { fontSize: 13, fontWeight: '800', color: Colors.foreground, letterSpacing: 4, textTransform: 'uppercase' },
  seeAllText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5 },
  flashProductCard: { width: (width - 55) / 2, marginBottom: 25 },
  flashImgContainer: { width: '100%', aspectRatio: 1, borderRadius: 20, backgroundColor: '#F9F9FB', overflow: 'hidden' },
  flashProductImg: { width: '100%', height: '100%' },
  flashHeartBtn: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 2, zIndex: 50 },
  flashPriceText: { fontSize: 13, fontWeight: '900', color: '#5856D6' },
  flashPriceWhite: { fontSize: 13, fontWeight: '900', color: 'white' },
  flashStarText: { fontSize: 10, fontWeight: '800', color: Colors.textMuted },
  flashStarWhite: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  flashNameText: { fontSize: 11, fontWeight: '700', color: Colors.foreground, marginTop: 2 },
  flashNameWhite: { fontSize: 11, fontWeight: '700', color: 'white', marginTop: 2 },
  flashInfoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.65)', padding: 12, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  promoBannerContainer: { margin: 20, height: 140, borderRadius: 25, overflow: 'hidden', backgroundColor: '#FF2D55' },
  promoBannerImg: { width: '100%', height: '100%' },
  promoBannerContent: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  promoSmallText: { fontSize: 10, fontWeight: '900', color: 'white', letterSpacing: 1, textAlign: 'center' },
  promoMainText: { fontSize: 24, fontWeight: '900', color: 'white', marginTop: -2, textAlign: 'center' },
  promoShopNowBtn: { backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginTop: 10, alignSelf: 'center' },
  promoBtnText: { fontSize: 10, fontWeight: '900', color: '#FF2D55' },
  authToggleText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
  }
});
// --- ADMIN FLASH SALE ---
function AdminFlashSaleScreen({ onBack, t, profileData }: any) {
  const { colors: appColors, theme } = useAppTheme();
  const isBrandOwner = profileData?.role === 'brand_owner';
  const myBrandId = profileData?.brandId;

  const [active, setActive] = useState(false);
  const [title, setTitle] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchFlashSale(), fetchProducts()]);
      setLoading(false);
    };
    init();
  }, []);

  // Use a brand-specific flash sale doc for brand owners, shared admin doc for admin
  const flashSaleDocId = isBrandOwner && myBrandId ? `flashSale_${myBrandId}` : 'flashSale';

  const fetchFlashSale = async () => {
    const snap = await getDoc(doc(db, 'settings', flashSaleDocId));
    if (snap.exists()) {
      const data = snap.data();
      setActive(data.active || false);
      setTitle(data.title || '');
      setEndTime(data.endTime || '');
      setSelectedProductIds(data.productIds || []);
    }
  };

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Brand owners only see their own products in the flash sale selector
      setProducts(isBrandOwner && myBrandId ? all.filter((p: any) => p.brandId === myBrandId) : all);
    } catch (err) {
      console.error("Error fetching products for flash sale:", err);
    }
  };

  const handleSave = async () => {
    if (!title || !endTime) {
      Alert.alert(t('error'), t('fillAllFields') || t('requiredFields'));
      return;
    }
    const testDate = new Date(endTime);
    if (isNaN(testDate.getTime())) {
      Alert.alert(t('error'), t('invalidDateFormat') || 'Invalid date format');
      return;
    }
    setLoading(true);
    try {
      const saveData: any = {
        active,
        title,
        endTime,
        productIds: selectedProductIds,
        updatedAt: serverTimestamp()
      };
      // Brand owners have their own flash sale config
      if (isBrandOwner && myBrandId) saveData.brandId = myBrandId;
      await setDoc(doc(db, 'settings', flashSaleDocId), saveData);
      Alert.alert(t('successTitle'), t('flashSaleUpdated'));
    } catch (e: any) {
      console.error("Error saving flash sale:", e);
      Alert.alert(t('error'), e.message || t('failedToSave'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <ChevronLeft size={20} color={appColors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground }]}>{t('flashSale').toUpperCase()}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={[styles.backBtnSmall, { width: undefined, paddingHorizontal: 12, backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          {loading ? <ActivityIndicator size="small" color={appColors.foreground} /> : <Text style={{ fontWeight: '900', color: appColors.foreground, fontSize: 10 }}>{t('save').toUpperCase()}</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 25 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, backgroundColor: theme === 'dark' ? '#171720' : 'white', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: appColors.border }}>
          <View>
            <Text style={{ fontWeight: '800', fontSize: 16, color: appColors.foreground }}>{t('activeStatusLabel')}</Text>
            <Text style={{ color: appColors.textMuted, fontSize: 12 }}>{t('showFlashSale')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setActive(!active)}
            style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: active ? appColors.foreground : (theme === 'dark' ? '#17171F' : '#eee'), padding: 3, alignItems: active ? 'flex-end' : 'flex-start' }}
          >
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme === 'dark' ? (active ? '#000' : '#555') : 'white' }} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('campaignTitle').toUpperCase()}</Text>
        <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]} value={title} onChangeText={setTitle} placeholder={t('flashSaleTitlePlaceholder')} placeholderTextColor="#666" />

        <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('endTimeIso')}</Text>
        <TextInput style={[styles.adminInput, { backgroundColor: theme === 'dark' ? '#171720' : 'white', color: appColors.foreground, borderColor: appColors.border }]} value={endTime} onChangeText={setEndTime} placeholder="YYYY-MM-DDTHH:MM:SS" placeholderTextColor="#666" />
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15, marginTop: 15 }}>
          {[6, 12, 24, 48].map(h => (
            <TouchableOpacity
              key={h}
              onPress={() => {
                const d = new Date();
                d.setHours(d.getHours() + h);
                setEndTime(d.toISOString());
              }}
              style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme === 'dark' ? '#17171F' : '#f0f0f0', borderRadius: 10, borderWidth: 1, borderColor: appColors.border }}
            >
              <Text style={{ fontSize: 10, fontWeight: '900', color: appColors.foreground }}>+{h}H</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ fontSize: 10, color: appColors.textMuted, marginBottom: 25 }}>{t('selectPresetOrIso')}</Text>

        <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('selectProductsLabel')} ({selectedProductIds.length})</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {products.map(p => {
            const isSelected = selectedProductIds.includes(p.id);
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedProductIds(isSelected ? selectedProductIds.filter(id => id !== p.id) : [...selectedProductIds, p.id])}
                style={{ width: (width - 70) / 3, backgroundColor: theme === 'dark' ? '#171720' : 'white', borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: isSelected ? appColors.foreground : appColors.border }}
              >
                <Image source={{ uri: p.mainImage }} style={{ width: '100%', height: 80 }} />
                <View style={{ padding: 8 }}>
                  <Text style={{ fontSize: 8, fontWeight: '700', color: appColors.foreground }} numberOfLines={1}>{getName(p.name)}</Text>
                </View>
                {isSelected && <View style={{ position: 'absolute', top: 5, right: 5, backgroundColor: appColors.foreground, borderRadius: 10, padding: 2 }}><CheckCircle2 size={12} color={theme === 'dark' ? '#000' : 'white'} /></View>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ADMIN PROMO BANNERS ---
function AdminPromoBannersScreen({ onBack, t, profileData }: any) {
  const { colors: appColors, theme } = useAppTheme();
  const isBrandOwner = profileData?.role === 'brand_owner';
  const myBrandId = profileData?.brandId;

  const PRESET_COLORS = ['#FF2D55', '#007AFF', '#34C759', '#5856D6', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA', '#000000', '#8E8E93'];
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    backgroundColor: '#FF2D55',
    order: '0',
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'promoBanners'), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Brand owners only see their own brand's promo banners
      setBanners(isBrandOwner && myBrandId ? all.filter((b: any) => b.brandId === myBrandId) : all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (banner: any) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title || '',
      description: banner.description || '',
      imageUrl: banner.imageUrl || '',
      backgroundColor: banner.backgroundColor || '#FF2D55',
      order: String(banner.order || 0),
      isActive: banner.isActive ?? true
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      imageUrl: '',
      backgroundColor: '#FF2D55',
      order: String(banners.length),
      isActive: true
    });
    setIsModalOpen(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      // In a real app we'd upload to storage, for now let's simulate or use the URI
      // Let's assume the user can provide a URL or we'd handle upload.
      // For this demo, we'll set the URI directly (note: this only works locally)
      setForm({ ...form, imageUrl: result.assets[0].uri });
    }
  };

  const handleSave = async () => {
    if (!form.imageUrl) {
      Alert.alert('Error', 'Image is required');
      return;
    }
    setSaving(true);
    try {
      const data: any = {
        ...form,
        order: parseInt(form.order) || 0,
        updatedAt: serverTimestamp()
      };
      // Tag with brandId so brand owners only manage their own promo banners
      if (isBrandOwner && myBrandId) data.brandId = myBrandId;
      if (editingId) {
        await updateDoc(doc(db, 'promoBanners', editingId), data);
      } else {
        await addDoc(collection(db, 'promoBanners'), { ...data, createdAt: serverTimestamp() });
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (banner: any) => {
    try {
      await updateDoc(doc(db, 'promoBanners', banner.id), { isActive: !banner.isActive });
      fetchBanners();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteBanner = (id: string) => {
    Alert.alert('Delete Promotion', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'promoBanners', id));
            fetchBanners();
          } catch (e) {
            console.error(e);
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={[styles.modernHeader, { backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}><ChevronLeft size={20} color={appColors.foreground} /></TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit pointerEvents="none" style={[styles.modernLogo, { color: appColors.foreground }]}>PROMOTIONS</Text>
        <View style={{ flexDirection: 'row', gap: 15 }}>
          <TouchableOpacity onPress={handleAddNew} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}><Plus size={22} color={appColors.foreground} /></TouchableOpacity>
          <TouchableOpacity onPress={fetchBanners} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}><RotateCcw size={20} color={appColors.foreground} /></TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.foreground} style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {banners.map(banner => (
            <View key={banner.id} style={[styles.settingsSectionPremium, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: appColors.border, marginBottom: 20, padding: 15 }]}>
              <View style={{ flexDirection: 'row', gap: 15 }}>
                <View style={{ width: 100, height: 60, borderRadius: 12, backgroundColor: banner.backgroundColor || (theme === 'dark' ? '#17171F' : '#FF2D55'), overflow: 'hidden' }}>
                  <Image source={{ uri: banner.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '900', fontSize: 13, color: appColors.foreground }}>{banner.title?.toUpperCase()}</Text>
                  <Text style={{ fontSize: 11, color: appColors.textMuted, marginTop: 4 }}>{banner.description}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, borderTopWidth: 1, borderTopColor: appColors.border, paddingTop: 15 }}>
                <TouchableOpacity onPress={() => toggleStatus(banner)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.customSwitch, { width: 44, height: 26, borderRadius: 13, padding: 3 }, banner.isActive && styles.customSwitchActive, !banner.isActive && { backgroundColor: theme === 'dark' ? '#17171F' : '#f2f2f7' }]}>
                    <View style={[styles.switchDot, { width: 20, height: 20, borderRadius: 10 }, banner.isActive && styles.switchDotActive]} />
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: banner.isActive ? '#34C759' : appColors.textMuted }}>
                    {banner.isActive ? t('activeStatus') : t('inactiveStatus')}
                  </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity onPress={() => handleEdit(banner)} style={{ padding: 8, backgroundColor: theme === 'dark' ? '#17171F' : '#f0f0f0', borderRadius: 8, borderWidth: 1, borderColor: appColors.border }}>
                    <Settings size={18} color={appColors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteBanner(banner.id)} style={{ padding: 8, backgroundColor: theme === 'dark' ? '#311212' : '#FFF0F0', borderRadius: 8, borderWidth: 1, borderColor: appColors.error }}>
                    <Trash2 size={18} color={appColors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          {banners.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 100 }}>
              <Ticket size={48} color={theme === 'dark' ? '#1A1A24' : '#eee'} />
              <Text style={{ color: appColors.textMuted, marginTop: 15, fontWeight: '700' }}>{t('noPromoBanners')}</Text>
            </View>
          )}

          <Modal visible={isModalOpen} animationType="slide" presentationStyle="pageSheet">
            <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0A0A0F' : 'white' }}>
              <View style={{
                height: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, backgroundColor: theme === 'dark' ? '#000' : 'white'
              }}>
                <TouchableOpacity onPress={() => setIsModalOpen(false)} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', zIndex: 10 }]} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  <X size={18} color={appColors.foreground} />
                </TouchableOpacity>
                <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.modernLogo, { color: appColors.foreground, fontSize: 11, fontWeight: '900' }]}>{editingId ? t('editPromotion').toUpperCase() : t('newPromotion').toUpperCase()}</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={{ paddingHorizontal: 15, height: 40, borderRadius: 20, backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', justifyContent: 'center', alignItems: 'center', zIndex: 10 }} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  {saving ? <ActivityIndicator size="small" color={appColors.foreground} /> : <Text style={{ fontWeight: '900', color: appColors.foreground, fontSize: 10 }}>{t('save').toUpperCase()}</Text>}
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 25 }}>
                <Text style={[styles.inputLabel, { color: appColors.foreground }]}>{t('bannerImage')}</Text>
                <TouchableOpacity
                  onPress={pickImage}
                  style={{ width: '100%', height: 180, borderRadius: 20, backgroundColor: theme === 'dark' ? '#171720' : '#f9f9fb', borderStyle: 'dashed', borderWidth: 2, borderColor: appColors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 25 }}
                >
                  {form.imageUrl ? (
                    <Image source={{ uri: form.imageUrl }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <ImageIcon size={40} color={appColors.textMuted} />
                      <Text style={{ fontSize: 10, fontWeight: '800', color: appColors.textMuted, marginTop: 10 }}>{t('selectImage169')}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.premiumInputGroup}>
                  <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('promotionTitle')}</Text>
                  <TextInput
                    style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border }]}
                    placeholder={t('summerSalePlaceholder')}
                    placeholderTextColor="#666"
                    value={form.title}
                    onChangeText={(t) => setForm({ ...form, title: t })}
                  />
                </View>

                <View style={styles.premiumInputGroup}>
                  <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('descriptionOffer')}</Text>
                  <TextInput
                    style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border }]}
                    placeholder={t('offerPlaceholder')}
                    placeholderTextColor="#666"
                    value={form.description}
                    onChangeText={(t) => setForm({ ...form, description: t })}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 15 }}>
                  <View style={[styles.premiumInputGroup, { flex: 1 }]}>
                    <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('bgColorHex')}</Text>
                    <TextInput
                      style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border }]}
                      placeholder="#FF2D55"
                      placeholderTextColor="#666"
                      value={form.backgroundColor}
                      onChangeText={(t) => setForm({ ...form, backgroundColor: t })}
                    />
                  </View>
                  <View style={[styles.premiumInputGroup, { flex: 0.5 }]}>
                    <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>{t('order')}</Text>
                    <TextInput
                      style={[styles.premiumInput, { backgroundColor: theme === 'dark' ? '#171720' : '#F9F9FB', color: appColors.foreground, borderColor: appColors.border }]}
                      keyboardType="numeric"
                      value={form.order}
                      onChangeText={(t) => setForm({ ...form, order: t })}
                    />
                  </View>
                </View>

                {/* Color Picker Presets */}
                <View style={{ marginBottom: 25 }}>
                  <Text style={[styles.inputLabelField, { color: appColors.foreground }]}>PRESET THEMES</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 5 }}>
                    {PRESET_COLORS.map(color => (
                      <TouchableOpacity
                        key={color}
                        onPress={() => setForm({ ...form, backgroundColor: color })}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: color,
                          borderWidth: 3,
                          borderColor: form.backgroundColor === color ? '#F2F2F7' : 'transparent',
                          shadowColor: '#000',
                          shadowOpacity: 0.1,
                          shadowRadius: 5,
                          elevation: 3
                        }}
                      />
                    ))}
                  </ScrollView>
                </View>

                <View style={[styles.settingsRowSwitch, { borderBottomWidth: 0 }]}>
                  <View>
                    <Text style={styles.switchTitle}>Active Status</Text>
                    <Text style={styles.switchSub}>Is this promotion currently visible?</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setForm({ ...form, isActive: !form.isActive })}
                    style={[styles.customSwitch, { width: 44, height: 26, borderRadius: 13, padding: 3 }, form.isActive && styles.customSwitchActive]}
                  >
                    <View style={[styles.switchDot, { width: 20, height: 20, borderRadius: 10 }, form.isActive && styles.switchDotActive]} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveBtnPremium, { marginTop: 30 }]}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnPremiumText}>{saving ? 'SAVING...' : 'REGISTER PROMOTION'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </Modal>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function FlashSaleCountdown({ endTime, onEnd }: { endTime: string, onEnd?: () => void }) {
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ h: '00', m: '00', s: '00' });
        if (onEnd) onEnd();
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({
          h: h.toString().padStart(2, '0'),
          m: m.toString().padStart(2, '0'),
          s: s.toString().padStart(2, '0')
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <View style={styles.timerPill}>
      <Clock size={12} color="#333" strokeWidth={3} style={{ marginRight: 2 }} />
      <View style={styles.timerBox}><Text style={styles.timerText}>{timeLeft.h}</Text></View>
      <Text style={{ fontWeight: '900', color: 'rgba(0,0,0,0.3)', fontSize: 12 }}>:</Text>
      <View style={styles.timerBox}><Text style={styles.timerText}>{timeLeft.m}</Text></View>
      <Text style={{ fontWeight: '900', color: 'rgba(0,0,0,0.3)', fontSize: 12 }}>:</Text>
      <View style={styles.timerBox}><Text style={styles.timerText}>{timeLeft.s}</Text></View>
    </View>
  );
}

function PrivacyPolicyScreen({ onBack, t }: any) {
  const { colors, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'settings', 'legal');
        const snap = await getDoc(docRef);

        const defaultPrivacy = `At Tama Clothing, we prioritize your privacy. This policy outlines how we collect, use, and protect your information.

1. Information Collection
We collect personal data (name, email, shipping address) when you create an account or place an order. We may also collect browsing data to improve your experience.

2. Usage of Information
Your data is used solely for processing orders, improving our services, and sending relevant updates (if opted in). We do not sell your data to third parties.

3. Data Security
We implement industry-standard security measures to protect your personal information. However, no method of transmission is 100% secure.

4. Contact Us
If you have questions about this policy, please contact our support team.`;

        const defaultPrivacyAr = `في Tama Clothing، نولي أولوية قصوى لخصوصيتك. توضح هذه السياسة كيفية جمعنا لمعلوماتك واستخدامها وحمايتها.

1. جمع المعلومات
نقوم بجمع البيانات الشخصية (الاسم، البريد الإلكتروني، عنوان الشحن) عند إنشاء حساب أو تقديم طلب. قد نجمع أيضًا بيانات التصفح لتحسين تجربتك.

2. استخدام المعلومات
تُستخدم بياناتك فقط لمعالجة الطلبات، وتحسين خدماتنا، وإرسال التحديثات ذات الصلة (إذا وافقت على ذلك). نحن لا نبيع بياناتك لأطراف ثالثة.

3. أمان البيانات
نحن نطبق إجراءات أمنية قياسية في الصناعة لحماية معلوماتك الشخصية. ومع ذلك، لا توجد طريقة نقل آمنة بنسبة 100%.

4. اتصل بنا
إذا كانت لديك أسئلة حول هذه السياسة، يرجى الاتصال بفريق الدعم لدينا.`;

        if (snap.exists()) {
          const data = snap.data();
          const lang = t('home') === 'الرئيسية' ? 'ar' : 'fr';
          setContent(lang === 'ar' ? (data.privacyAr || defaultPrivacyAr) : (data.privacy || defaultPrivacy));
        } else {
          const lang = t('home') === 'الرئيسية' ? 'ar' : 'fr';
          setContent(lang === 'ar' ? defaultPrivacyAr : defaultPrivacy);
        }
      } catch { } finally { setLoading(false); }
    }
    fetchContent();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Animated Blur Header */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64 + insets.top,
        paddingTop: insets.top,
        borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '66' }]} />
        </Animated.View>

        <View style={[styles.modernHeader, { borderBottomWidth: 0, backgroundColor: 'transparent' }]}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.modernLogo, { color: colors.foreground }]}>{t('privacyPolicy')}</Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 25, paddingTop: 64 + insets.top }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {loading ? <ActivityIndicator color={colors.foreground} /> : (
          <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 22, marginBottom: 20 }}>
            {content || t('noPolicyDefined')}
          </Text>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function TermsOfServiceScreen({ onBack, t }: any) {
  const { colors, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'settings', 'legal');
        const snap = await getDoc(docRef);

        const defaultTerms = `Welcome to Tama Clothing. By accessing or using our mobile application, you agree to be bound by these terms.

1. Usage Rights
You are granted a limited license to access and use the app for personal shopping purposes. Misuse or unauthorized access is strictly prohibited.

2. Purchases & Payments
All prices are in TND. We reserve the right to change prices at any time. Orders are subject to acceptance and availability.

3. Intellectual Property
All content (images, text, designs) is owned by Tama Clothing and protected by copyright laws.

4. Limitation of Liability
Tama Clothing is not liable for indirect damages arising from your use of the app.

5. Governing Law
These terms are governed by the laws of Tunisia.`;

        const defaultTermsAr = `مرحبًا بكم في Tama Clothing. من خلال الوصول إلى تطبيق الهاتف المحمول الخاص بنا أو استخدامه، فإنك توافق على الالتزام بهذه الشروط.

1. حقوق الاستخدام
يتم منحك ترخيصًا محدودًا للوصول إلى التطبيق واستخدامه لأغراض التسوق الشخصي. يُمنع إساءة الاستخدام أو الوصول غير المصرح به منعًا باتًا.

2. المشتريات والمدفوعات
جميع الأسعار بالدينار التونسي. نحتفظ بالحق في تغيير الأسعار في أي وقت. تخضع الطلبات للقبول والتوافر.

3. الملكية الفكرية
جميع المحتويات (الصور، النصوص، التصميمات) مملوكة لـ Tama Clothing ومحمية بموجب قوانين حقوق النشر.

4. تحديد المسؤولية
Tama Clothing ليست مسؤولة عن الأضرار غير المباشرة الناشئة عن استخدامك للتطبيق.

5. القانون الحاكم
تخضع هذه الشروط لقوانين تونس.`;

        if (snap.exists()) {
          const data = snap.data();
          const lang = t('home') === 'الرئيسية' ? 'ar' : 'fr';
          setContent(lang === 'ar' ? (data.termsAr || defaultTermsAr) : (data.terms || defaultTerms));
        } else {
          const lang = t('home') === 'الرئيسية' ? 'ar' : 'fr';
          setContent(lang === 'ar' ? defaultTermsAr : defaultTerms);
        }
      } catch { } finally { setLoading(false); }
    };
    fetchContent();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Animated Blur Header */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64 + insets.top,
        paddingTop: insets.top,
        borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '66' }]} />
        </Animated.View>

        <View style={[styles.modernHeader, { borderBottomWidth: 0, backgroundColor: 'transparent' }]}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.modernLogo, { color: colors.foreground }]}>{t('termsOfService')}</Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 25, paddingTop: 64 + insets.top }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {loading ? <ActivityIndicator color={colors.foreground} /> : (
          <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 22, marginBottom: 20 }}>
            {content || t('noPolicyDefined')}
          </Text>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function GenericPolicyScreen({ onBack, t, titleKey, fieldKey, defaultText, Icon }: any) {
  const { colors, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'settings', 'legal');
        const snap = await getDoc(docRef);

        if (snap.exists()) setContent(snap.data()[fieldKey] || defaultText);
        else setContent(defaultText);
      } catch { } finally { setLoading(false); }
    };
    fetchContent();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Animated Blur Header */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64 + insets.top,
        paddingTop: insets.top,
        borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '66' }]} />
        </Animated.View>

        <View style={[styles.modernHeader, { borderBottomWidth: 0, backgroundColor: 'transparent' }]}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.modernLogo, { color: colors.foreground }]}>{t(titleKey)}</Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ padding: 30, alignItems: 'center', paddingTop: 64 + insets.top }}
      >
        {/* Icon Header */}
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: theme === 'dark' ? '#121218' : '#F9F9FB', alignItems: 'center', justifyContent: 'center',
          marginBottom: 30,
          borderColor: colors.border, borderWidth: 1,
          shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
        }}>
          {Icon && <Icon size={32} color={colors.foreground} strokeWidth={1.5} />}
        </View>

        {loading ? <ActivityIndicator color={colors.foreground} /> : (
          <View style={{ width: '100%' }}>
            <Text style={{
              fontSize: 15,
              color: colors.foreground,
              lineHeight: 26,
              textAlign: 'left',
              fontWeight: '400'
            }}>
              {content || "No content defined yet."}
            </Text>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function AdminSupportListScreen({ onBack, onChatPress, t, theme, colors }: any) {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, orderBy('lastMessageTime', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(chatList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTime = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.modernHeader, { borderBottomWidth: 1, borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F2F2F7', paddingBottom: 10 }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#17171F' : '#F2F2F7', width: 36, height: 36 }]}>
          <ChevronLeft size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.modernLogo, { color: colors.foreground, fontSize: 13, letterSpacing: 2 }]}>SUPPORT MANAGER</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 50 }} />
        ) : chats.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <MessageCircle size={32} color={colors.textMuted} strokeWidth={1.5} />
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '600' }}>No active conversations</Text>
          </View>
        ) : (
          chats.map(chat => (
            <TouchableOpacity
              key={chat.id}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                backgroundColor: theme === 'dark' ? '#121218' : 'white',
                padding: 16,
                borderRadius: 20,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F2F2F7',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1
              }}
              onPress={() => onChatPress(chat.chatId, chat.customerName)}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: theme === 'dark' ? '#000' : '#FFF', fontWeight: '800', fontSize: 16 }}>{getInitials(chat.customerName)}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: colors.foreground, fontWeight: '800', fontSize: 15, flexShrink: 1 }}>{chat.customerName}</Text>
                    {chat.status === 'closed' ? (
                      <View style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#9CA3AF', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 }}>CLOSED</Text>
                      </View>
                    ) : (
                      <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#22c55e', fontSize: 8, fontWeight: '900' }}>OPEN</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '500' }}>{formatTime(chat.lastMessageTime)}</Text>
                </View>

                <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{chat.customerEmail}</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <Text numberOfLines={1} style={{
                    color: chat.unreadCount > 0 ? colors.foreground : colors.textMuted,
                    fontSize: 13,
                    fontWeight: chat.unreadCount > 0 ? '700' : '400',
                    flex: 1,
                    marginRight: 10
                  }}>
                    {chat.lastMessage}
                  </Text>

                  {chat.unreadCount > 0 && (
                    <View style={{
                      backgroundColor: colors.accent,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 5
                    }}>
                      <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>{chat.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


function AdminSupportChatScreen({ onBack, chatId, customerName, user, t, theme, colors }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [chatData, setChatData] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!chatId) return;

    const chatRef = doc(db, 'chats', chatId);
    const unsubChat = onSnapshot(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        setChatData(snapshot.data());
      }
    });

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(msgs);
        setLoading(false);

        snapshot.docs.forEach(async (mDoc) => {
          const data = mDoc.data();
          if (data.senderRole === 'customer' && !data.read) {
            try {
              await updateDoc(doc(db, 'chats', chatId, 'messages', mDoc.id), { read: true });
            } catch (e) { }
          }
        });

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      },
      (err) => {
        console.error("AdminSupportChat Error:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      unsubChat();
    };
  }, [chatId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !user?.uid) return;
    setSending(true);
    const text = inputText.trim();
    setInputText('');

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        text: text,
        senderId: user.uid,
        senderName: 'Support',
        senderRole: 'support',
        timestamp: serverTimestamp(),
        read: false
      });

      const chatDocRef = doc(db, 'chats', chatId);
      await updateDoc(chatDocRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        unreadCount: 0,
        status: 'open'
      });

      if (chatData?.customerId) {
        const userDoc = await getDoc(doc(db, 'users', chatData.customerId));
        if (userDoc.exists() && userDoc.data().expoPushToken) {
          sendPushNotification(
            userDoc.data().expoPushToken,
            'New message from Support',
            text
          );
        }
      }
    } finally {
      setSending(false);
    }
  };

  const closeChat = async () => {
    try {
      await updateDoc(doc(db, 'chats', chatId), { status: 'closed' });
    } catch (e) {
      console.log('Error closing chat:', e);
    }
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      handleMediaUpload(result.assets[0].uri);
    }
  };

  const handleMediaUpload = async (uri: string) => {
    setUploading(true);
    try {
      const fileType = uri.split('.').pop()?.toLowerCase();
      const isVideo = ['mp4', 'mov', 'avi', 'mkv'].includes(fileType || '');
      const cloudinaryUrl = await uploadImageToCloudinary(uri);

      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const messageData: any = {
        senderId: user.uid,
        senderName: 'Support',
        senderRole: 'support',
        timestamp: serverTimestamp(),
        read: false
      };

      if (isVideo) {
        messageData.videoUrl = cloudinaryUrl;
      } else {
        messageData.imageUrl = cloudinaryUrl;
      }

      await addDoc(messagesRef, messageData);

      const chatDocRef = doc(db, 'chats', chatId);
      await updateDoc(chatDocRef, {
        lastMessage: isVideo ? 'Sent a video 📹' : 'Sent an image 📸',
        lastMessageTime: serverTimestamp(),
        unreadCount: 0,
        status: 'open'
      });

      if (chatData?.customerId) {
        const userDoc = await getDoc(doc(db, 'users', chatData.customerId));
        if (userDoc.exists() && userDoc.data().expoPushToken) {
          sendPushNotification(
            userDoc.data().expoPushToken,
            'New message from Support',
            isVideo ? 'Support sent a video' : 'Support sent an image'
          );
        }
      }
    } catch (error) {
      console.error('Admin media upload error:', error);
      alert('Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Refined Header */}
      <View style={[styles.modernHeader, { borderBottomWidth: 1, borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F2F2F7', paddingBottom: 10 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtnSmall, { backgroundColor: theme === 'dark' ? '#17171F' : '#F2F2F7', width: 36, height: 36 }]}>
            <ChevronLeft size={18} color={colors.foreground} />
          </TouchableOpacity>

          <View style={{ marginLeft: 12, flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color={theme === 'dark' ? '#000' : '#FFF'} />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 }}>{customerName?.toUpperCase()}</Text>
                {chatData?.status && (
                  <View style={{
                    backgroundColor: chatData.status === 'open' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4
                  }}>
                    <Text style={{
                      color: chatData.status === 'open' ? '#22c55e' : '#9CA3AF',
                      fontSize: 8,
                      fontWeight: '900',
                      letterSpacing: 0.5
                    }}>{chatData.status.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 10, marginTop: 1 }}>{chatData?.customerEmail}</Text>
            </View>
          </View>
        </View>

        {chatData?.status === 'open' && (
          <TouchableOpacity
            onPress={closeChat}
            activeOpacity={0.7}
            style={{
              backgroundColor: '#000',
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'transparent'
            }}
          >
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>CLOSE</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 15, paddingBottom: 30 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
          ) : messages.map((m: any, index: number) => {
            const isOwn = m.senderRole === 'support';
            const showName = !isOwn; // Only show customer name

            return (
              <View key={m.id} style={{
                alignSelf: isOwn ? 'flex-end' : 'flex-start',
                backgroundColor: isOwn ? (theme === 'dark' ? '#FFF' : '#000') : (theme === 'dark' ? '#1C1C1E' : '#FFFFFF'),
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 22,
                maxWidth: '82%',
                marginBottom: 8,
                borderBottomRightRadius: isOwn ? 4 : 22,
                borderBottomLeftRadius: isOwn ? 22 : 4,
                borderWidth: !isOwn && theme !== 'dark' ? 1 : 0,
                borderColor: '#F2F2F7',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 1,
              }}>
                {showName && (
                  <Text style={{
                    color: colors.accent,
                    fontSize: 9,
                    fontWeight: '900',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>
                    {m.senderName}
                  </Text>
                )}

                {m.imageUrl ? (
                  <TouchableOpacity onPress={() => setFullScreenImage(m.imageUrl)} activeOpacity={0.9}>
                    <Image source={{ uri: m.imageUrl }} style={{ width: 230, height: 230, borderRadius: 14, marginTop: 2, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} resizeMode="cover" />
                  </TouchableOpacity>
                ) : m.videoUrl ? (
                  <View style={{ width: 230, height: 230, borderRadius: 14, marginTop: 2, overflow: 'hidden', backgroundColor: '#000' }}>
                    <Video
                      source={{ uri: m.videoUrl }}
                      style={{ width: '100%', height: '100%' }}
                      useNativeControls
                      resizeMode={ResizeMode.COVER}
                      isLooping
                    />
                  </View>
                ) : (
                  <Text style={{
                    color: isOwn ? (theme === 'dark' ? '#000' : '#FFF') : colors.foreground,
                    fontSize: 15,
                    lineHeight: 21,
                    fontWeight: '400'
                  }}>{m.text}</Text>
                )}

                <Text style={{
                  color: isOwn ? (theme === 'dark' ? '#999' : 'rgba(255,255,255,0.6)') : colors.textMuted,
                  fontSize: 8,
                  marginTop: 6,
                  textAlign: isOwn ? 'right' : 'left',
                  fontWeight: '500'
                }}>
                  {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <Modal visible={!!fullScreenImage} transparent={true} onRequestClose={() => setFullScreenImage(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity
              style={{ position: 'absolute', top: 50, right: 25, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setFullScreenImage(null)}
            >
              <X size={24} color="white" />
            </TouchableOpacity>
            {fullScreenImage && <Image source={{ uri: fullScreenImage }} style={{ width: '100%', height: '85%' }} resizeMode="contain" />}
          </View>
        </Modal>

        {/* Improved Input Area */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F2F2F7',
          paddingBottom: Platform.OS === 'ios' ? 35 : 12,
          backgroundColor: colors.background,
          alignItems: 'center'
        }}>
          <TouchableOpacity
            onPress={pickMedia}
            disabled={uploading}
            activeOpacity={0.7}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10
            }}
          >
            {uploading ? <ActivityIndicator size="small" color={colors.accent} /> : <ImageIcon size={20} color={colors.textMuted} />}
          </TouchableOpacity>

          <View style={{
            flex: 1,
            flexDirection: 'row',
            backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7',
            borderRadius: 25,
            alignItems: 'center',
            paddingHorizontal: 15,
            borderWidth: 1,
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent'
          }}>
            <TextInput
              style={{
                flex: 1,
                color: colors.foreground,
                paddingVertical: 10,
                maxHeight: 100,
                fontSize: 15,
              }}
              placeholder="Répondre..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>

          <TouchableOpacity
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
            style={{
              marginLeft: 10,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: inputText.trim() ? colors.accent : (theme === 'dark' ? '#2C2C2E' : '#E5E5EA'),
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: inputText.trim() ? 0.3 : 0,
              shadowRadius: 6,
              elevation: inputText.trim() ? 4 : 0
            }}
          >
            {sending ? <ActivityIndicator size="small" color="white" /> : <Send size={18} color={inputText.trim() ? (theme === 'dark' ? '#000' : '#FFF') : colors.accent} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

