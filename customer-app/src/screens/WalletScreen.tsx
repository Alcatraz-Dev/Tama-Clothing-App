import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
  Modal,
  TextInput,
  Animated,
  ActivityIndicator,
  Switch,
} from "react-native";
import {
  ChevronLeft,
  Coins,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  TrendingUp,
  History,
  Gem,
  Repeat,
  ArrowRight,
  X,
  RefreshCw,
  Search,
  Users,
  User,
  Send,
  Check,
  ChevronRight,
  Trash,
  Info,
  Building2,
  MapPin,
  ArrowLeft,
  XCircle,
  Hexagon,
  Landmark,
  Mail,
  Diamond,
} from "lucide-react-native";
import * as Animatable from "react-native-animatable";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Theme } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  doc,
  setDoc,
  increment,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  getDocs,
  where,
  runTransaction,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  documentId,
  getDoc,
} from "firebase/firestore";
import { db } from "../api/firebase";
import { getName } from "../utils/translationHelpers";
import { KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import {
  requestWithdrawal,
  WithdrawalMethod,
  WithdrawalDetails,
  approveWithdrawal,
  rejectWithdrawal,
  performExchange,
  performTransfer,
  getOrCreateWallet,
  subscribeToWallet,
  notifyAdmins,
} from "../services/codFinancialService";

import Constants from "expo-constants";

// Production Vercel URL
const PRODUCTION_API_URL = "https://backend-bey3a.vercel.app/api/payment";

// Switch this to true if you want to test with your LOCAL backend
const USE_LOCAL_BACKEND = false;

// Auto-detect local backend IP for physical devices/emulators
const getApiBaseUrl = () => {
  if (!USE_LOCAL_BACKEND) return PRODUCTION_API_URL;

  const debuggerHost = Constants.expoConfig?.hostUri || "";
  const ip = debuggerHost.split(":")[0];
  if (!ip) return "http://localhost:5001/api/payment";
  return `http://${ip}:5001/api/payment`;
};

const API_BASE_URL = getApiBaseUrl();
const RECHARGE_PACKAGES = [
  { id: "1", coins: 100, price: 3.0, priceDisplay: "3.00 TND", bonus: 0 },
  { id: "2", coins: 550, price: 15.0, priceDisplay: "15.00 TND", bonus: 50 },
  { id: "3", coins: 1200, price: 30.0, priceDisplay: "30.00 TND", bonus: 200 },
  { id: "4", coins: 2500, price: 60.0, priceDisplay: "60.00 TND", bonus: 500 },
  {
    id: "5",
    coins: 6500,
    price: 150.0,
    priceDisplay: "150.00 TND",
    bonus: 1500,
  },
  {
    id: "6",
    coins: 13500,
    price: 300.0,
    priceDisplay: "300.00 TND",
    bonus: 3500,
  },
];

const DIAMOND_TO_TND_RATE = 0.01;
const DIAMOND_TO_COIN_RATE = 1;
const TND_TO_EUR_RATE = 1 / 3.4;
const DIAMOND_TO_EUR_RATE = DIAMOND_TO_TND_RATE * TND_TO_EUR_RATE;

interface WalletScreenProps {
  onBack: () => void;
  theme: "light" | "dark";
  t: (key: string) => string;
  profileData: any;
  user: any;
  language: string;
  onNavigate?: (screen: string, params?: any) => void;
}

export default function WalletScreen({
  onBack,
  theme,
  t,
  profileData,
  user,
  language,
  onNavigate,
}: WalletScreenProps) {
  const isDark = theme === "dark";
  const colors = isDark ? Theme.dark.colors : Theme.light.colors;
  const insets = useSafeAreaInsets();
  const isAdmin =
    profileData?.isAdmin === true || profileData?.role === "admin";
  // DEBUG: Remove after confirming admin visibility works
  console.log(
    "[WalletScreen] isAdmin:",
    isAdmin,
    "| role:",
    profileData?.role,
    "| isAdmin field:",
    profileData?.isAdmin,
  );
  const [activeTab, setActiveTab] = useState<"recharge" | "earnings">(
    "recharge",
  );
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<"method" | "details">(
    "method",
  );
  const [withdrawMethod, setWithdrawMethod] = useState<any>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  // Stripe
  const [stripeEmail, setStripeEmail] = useState("");
  // Crypto
  const [cryptoCoin, setCryptoCoin] = useState("USDT_TRC20");
  const [cryptoAddress, setCryptoAddress] = useState("");
  // Bank
  const [iban, setIban] = useState("");
  const [bankName, setBankName] = useState("");
  // Post
  const [postFullName, setPostFullName] = useState("");
  const [postAddress, setPostAddress] = useState("");
  const [postPostal, setPostPostal] = useState("");
  const [postCity, setPostCity] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [exchangeType, setExchangeType] = useState<
    "diamondsToCoins" | "coinsToDiamonds"
  >("diamondsToCoins");
  const [exchangeAmount, setExchangeAmount] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const rotation = React.useRef(new Animated.Value(0)).current;
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSearchQuery, setTransferSearchQuery] = useState("");
  const [transferSearchResults, setTransferSearchResults] = useState<any[]>([]);
  const [selectedUserForTransfer, setSelectedUserForTransfer] = useState<
    any | null
  >(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [transferType, setTransferType] = useState<"coins" | "diamonds">(
    "coins",
  );
  const [showTargetProfile, setShowTargetProfile] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [transferModalTab, setTransferModalTab] = useState<
    "search" | "friends" | "requests"
  >("search");

  // Recharge selection states
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  // Crypto invoice states
  const [showCryptoInvoice, setShowCryptoInvoice] = useState(false);
  const [cryptoInvoiceData, setCryptoInvoiceData] = useState<any>(null);
  const [selectedCryptoCoin, setSelectedCryptoCoin] = useState<string | null>(
    null,
  );
  const [adminInvoices, setAdminInvoices] = useState<any[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<any[]>([]);
  const [adminPanelTab, setAdminPanelTab] = useState<
    "crypto" | "withdrawals" | "bonuses"
  >("crypto");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [bonusSettings, setBonusSettings] = useState<any>(null);
  const [savingBonus, setSavingBonus] = useState(false);

  const [wallet, setWallet] = useState<any | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    let unsubWallet: (() => void) | null = null;

    (async () => {
      // Get or create customer wallet
      const wId = await getOrCreateWallet(
        user.uid,
        "customer",
        profileData?.fullName || user.email,
      );
      setWalletId(wId);

      unsubWallet = subscribeToWallet(user.uid, "customer", (w: any) => {
        setWallet(w);
      });
    })();

    return () => {
      unsubWallet?.();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, "crypto_invoices"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawInvoices = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Enrich with user profile data
      const enriched = await Promise.all(
        rawInvoices.map(async (inv: any) => {
          try {
            const userSnap = await getDocs(
              query(
                collection(db, "users"),
                where(documentId(), "==", inv.userId),
              ),
            );
            if (!userSnap.empty) {
              const userData = userSnap.docs[0].data();
              return {
                ...inv,
                _user: {
                  fullName: userData.fullName || "Unknown",
                  email: userData.email || "",
                  avatarUrl: userData.avatarUrl || null,
                  phone: userData.phone || "",
                },
              };
            }
          } catch (_) {}
          return { ...inv, _user: null };
        }),
      );

      setAdminInvoices(enriched);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, "withdrawal_requests"),
      where("status", "==", "pending"),
      orderBy("requestedAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawReqs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Enrich with user profile data
      const enriched = await Promise.all(
        rawReqs.map(async (req: any) => {
          try {
            const userId = req.actorId;
            const userSnap = await getDocs(
              query(collection(db, "users"), where(documentId(), "==", userId)),
            );
            if (!userSnap.empty) {
              const userData = userSnap.docs[0].data();
              return {
                ...req,
                _user: {
                  fullName: userData.fullName || "Unknown",
                  email: userData.email || "",
                  avatarUrl: userData.avatarUrl || null,
                  phone: userData.phone || "",
                },
              };
            }
          } catch (_) {}
          return { ...req, _user: null };
        }),
      );

      setAdminWithdrawals(enriched);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Fetch Bonus Settings for everyone to show on UI
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "app_config", "wallet_bonuses");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBonusSettings(docSnap.data());
        } else {
          const defaults = {
            firstRecharge: { enabled: false, bonus: 0 },
            extraBonus: { enabled: false, bonus: 0 },
          };
          setBonusSettings(defaults);
        }
      } catch (error) {
        console.error("Error fetching bonus settings:", error);
      }
    };

    fetchSettings();
  }, []);

  // Determine if it's user's first recharge
  const [isFirstRecharge, setIsFirstRecharge] = useState(false);
  useEffect(() => {
    if (!user?.uid || !transactions) return;
    const hasRecharge = transactions.some(
      (tx: any) => tx.type === "recharge" && tx.status === "completed",
    );
    setIsFirstRecharge(!hasRecharge);
  }, [user?.uid, transactions]);

  const saveBonusSettings = async (newSettings: any) => {
    try {
      setSavingBonus(true);
      await setDoc(doc(db, "app_config", "wallet_bonuses"), newSettings);
      setBonusSettings(newSettings);
      Alert.alert(
        tr("Success", "Succès", "تم"),
        tr(
          "Settings saved successfully",
          "Paramètres enregistrés",
          "تم حفظ الإعدادات",
        ),
      );
    } catch (error) {
      console.error("Error saving bonus settings:", error);
      Alert.alert(
        tr("Error", "Erreur", "غلطة"),
        tr(
          "Failed to save settings",
          "Échec de l'enregistrement",
          "فشل حفظ الإعدادات",
        ),
      );
    } finally {
      setSavingBonus(false);
    }
  };

  const handleApproveWithdrawal = async (requestId: string) => {
    try {
      setLoading(true);
      await approveWithdrawal(requestId);
      Alert.alert(t("success"), "Withdrawal request approved successfully");
    } catch (error: any) {
      Alert.alert(t("error"), error.message || "Failed to approve request");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectWithdrawal = async (requestId: string) => {
    Alert.prompt(
      tr("Reject Request", "Rejeter la demande", "رفض الطلب"),
      tr(
        "Please enter the reason for rejection:",
        "Veuillez entrer la raison du rejet :",
        "حط سبب الرفض :",
      ),
      async (reason) => {
        if (!reason) {
          Alert.alert(
            tr("Error", "Erreur", "غلطة"),
            tr(
              "A reason is required to reject a request",
              "Une raison est requise pour rejeter une demande",
              "لازم تحط سبب باش ترفض",
            ),
          );
          return;
        }
        try {
          setLoading(true);
          await rejectWithdrawal(requestId, reason);
          Alert.alert(
            tr("Success", "Succès", "سلكت"),
            tr(
              "Withdrawal request rejected",
              "Demande de retrait rejetée",
              "تم رفض الطلب",
            ),
          );
        } catch (error: any) {
          Alert.alert(
            tr("Error", "Erreur", "غلطة"),
            error.message || "Failed to reject request",
          );
        } finally {
          setLoading(false);
        }
      },
      "plain-text",
    );
  };

  const handleConfirmCryptoPayment = async (invoiceId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/crypto/confirm/${invoiceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      const result = await response.json();
      if (result.success) {
        Alert.alert(t("success"), "Payment confirmed successfully");
      } else {
        Alert.alert(t("error"), result.error || "Failed to confirm payment");
      }
    } catch (error) {
      Alert.alert(t("error"), "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user?.uid) return;
    try {
      const q = query(
        collection(db, "users", user.uid, "transactions"),
        orderBy("timestamp", "desc"),
        limit(20),
      );
      const snapshot = await getDocs(q);
      const txData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(txData);
    } catch (error) {
      console.error("Manual Refresh Error:", error);
    }
  };

  React.useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("timestamp", "desc"),
      limit(20),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(txData);
    });

    // Listen for Friend Requests (Incoming)
    const incomingQ = query(
      collection(db, "users", user.uid, "friendRequests"),
      where("status", "==", "pending"),
    );
    const unsubscribeIncoming = onSnapshot(incomingQ, (snapshot) => {
      setIncomingRequests(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    });

    // Listen for Sent Requests (Outgoing)
    const outgoingQ = query(
      collection(db, "friendRequests"),
      where("senderId", "==", user.uid),
      where("status", "==", "pending"),
    );
    const unsubscribeOutgoing = onSnapshot(outgoingQ, (snapshot) => {
      setSentRequests(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    });

    // Fetch Friends List (Simplified: using the UID list already in profileData.friends)
    const fetchFriends = async () => {
      if (!profileData?.friends || profileData.friends.length === 0) {
        setFriendsList([]);
        return;
      }
      try {
        // Use documentId() because the friends array contains the document IDs (UIDs)
        const friendsQ = query(
          collection(db, "users"),
          where(documentId(), "in", profileData.friends.slice(0, 10)),
        );
        const snapshot = await getDocs(friendsQ);
        setFriendsList(
          snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() })),
        );
      } catch (err) {
        console.error("Fetch Friends Error:", err);
      }
    };
    fetchFriends();

    return () => {
      unsubscribe();
      unsubscribeIncoming();
      unsubscribeOutgoing();
    };
  }, [user?.uid, profileData?.friends]);

  // Translations helper
  const tr = (en: string, fr: string, ar: string) => {
    return language === "ar" ? ar : language === "fr" ? fr : en;
  };

  const coinBalance = profileData?.wallet?.coins || 0;
  // Use live wallet subscription (same Firestore doc the service reads) to avoid stale-data mismatch
  const diamondBalance = (wallet?.diamonds ?? profileData?.wallet?.diamonds) || 0;

  const getCalculatedBonus = (pack: any, method: string) => {
    if (!bonusSettings) return 0;
    let extraPercent = 0;
    if (bonusSettings.extraBonus?.enabled) {
      extraPercent += bonusSettings.extraBonus.bonus || 0;
    }
    if (bonusSettings.firstRecharge?.enabled && isFirstRecharge) {
      extraPercent += bonusSettings.firstRecharge.bonus || 0;
    }
    if (method === "crypto" && bonusSettings.cryptoBonus?.enabled) {
      extraPercent += bonusSettings.cryptoBonus.bonus || 0;
    }
    if (
      bonusSettings.bulkBonus?.enabled &&
      pack.price >= (bonusSettings.bulkBonus.threshold || 0)
    ) {
      extraPercent += bonusSettings.bulkBonus.bonus || 0;
    }

    return Math.floor(pack.coins * (extraPercent / 100));
  };

  const initiateRecharge = (pack: any) => {
    if (!user?.uid) {
      Alert.alert(
        "Error",
        tr(
          "Please log in to recharge.",
          "Veuillez vous connecter pour recharger.",
          "أمان ادخل للكونط باش تشحن رصيدك.",
        ),
      );
      return;
    }
    setSelectedPackage(pack);
    setShowPaymentMethodModal(true);
  };

  const handleCryptoCheckout = async (coin: string) => {
    setShowPaymentMethodModal(false);
    if (!selectedPackage || !user?.uid) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/crypto/create-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          coin: coin,
          amountEUR: Number((selectedPackage.price / 3.4).toFixed(2)), // convert TND to EUR
          pack: {
            coins: selectedPackage.coins,
            bonus: selectedPackage.bonus + getCalculatedBonus(selectedPackage, "crypto"),
            priceDisplay: selectedPackage.priceDisplay,
          },
        }),
      });

      const data = await response.json();
      if (!data.success || !data.invoice) {
        throw new Error(data.error || "Failed to create crypto invoice");
      }

      setCryptoInvoiceData(data.invoice);
      setShowCryptoInvoice(true);
    } catch (error: any) {
      console.error("Crypto Recharge error:", error);
      Alert.alert(
        tr("Error", "Erreur", "غلطة"),
        error.message || "Failed to generate crypto invoice.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    setShowPaymentMethodModal(false);
    const pack = selectedPackage;
    if (!pack || !user?.uid) return;

    try {
      setLoading(true);

      // 1. Create a Stripe PaymentIntent via backend
      const response = await fetch(`${API_BASE_URL}/stripe/create-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number((pack.price / 3.4).toFixed(2)),
          currency: "eur",
          userId: user.uid,
          pack: {
            coins: pack.coins,
            bonus: pack.bonus + getCalculatedBonus(pack, "stripe"),
            price: pack.price,
            priceDisplay: pack.priceDisplay,
          },
        }),
      });

      const data = await response.json();

      if (!data.success || !data.paymentIntentId) {
        throw new Error(data.error || "Failed to create payment");
      }

      // 2. Open Stripe Checkout in the in-app browser
      const checkoutResponse = await fetch(`${API_BASE_URL}/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number((pack.price / 3.4).toFixed(2)),
          currency: "eur",
          userId: user.uid,
          pack: {
            coins: pack.coins,
            bonus: pack.bonus + getCalculatedBonus(pack, "stripe"),
            price: pack.price,
            priceDisplay: pack.priceDisplay,
          },
        }),
      });

      const checkoutData = await checkoutResponse.json();

      if (!checkoutData.success || !checkoutData.url) {
        throw new Error(
          checkoutData.error || "Failed to create checkout session",
        );
      }

      const result = await WebBrowser.openAuthSessionAsync(
        checkoutData.url,
        "tama-clothing://payment-success",
      );

      if (result.type === "success") {
        const { queryParams } = Linking.parse(result.url || "");
        const sessionId = queryParams?.session_id as string;
        if (sessionId) {
          await verifyAndCompletePayment(sessionId, pack.price);
        }
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Recharge error:", error);
      Alert.alert(
        tr("Error", "Erreur", "غلطة"),
        error.message ||
          tr(
            "Failed to initiate payment",
            "Échec de l'initialisation du paiement",
            "ما نجمناش نبداو الخلاص",
          ),
      );
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(
        tr("Error", "Erreur", "غلطة"),
        tr(
          "Please enter a valid amount",
          "Veuillez entrer un montant valide",
          "حط مبلغ صحيح",
        ),
      );
      return;
    }
    const isEUR = withdrawMethod === "stripe" || withdrawMethod === "crypto";
    const minAmount = isEUR ? (50 * TND_TO_EUR_RATE) : 50;
    const currency = isEUR ? "EUR" : "TND";
    const maxAmount = isEUR ? (diamondBalance * DIAMOND_TO_EUR_RATE) : (diamondBalance * DIAMOND_TO_TND_RATE);

    if (amount < minAmount) {
      Alert.alert(
        tr("Error", "Erreur", "غلطة"),
        tr(
          `Minimum withdrawal is ${minAmount.toFixed(2)} ${currency}`,
          `Le retrait minimum est de ${minAmount.toFixed(2)} ${currency}`,
          `أقل مبلغ تجبدو هو ${minAmount.toFixed(2)} ${currency === "EUR" ? "يورو" : "دت"}`,
        ),
      );
      return;
    }
    if (amount > maxAmount + 0.01) {
      Alert.alert(
        tr("Error", "Erreur", "غلطة"),
        tr("Insufficient balance", "Solde insuffisant", "ماعندكش رصيد كافي"),
      );
      return;
    }

    // Per-method validation
    if (!withdrawMethod) {
      Alert.alert(
        tr("Error", "Erreur", "غلطة"),
        tr(
          "Please select a withdrawal method",
          "Veuillez choisir une méthode de retrait",
          "اختار وسيلة السحب",
        ),
      );
      return;
    }

    if (withdrawMethod === "stripe" && !stripeEmail.trim()) {
      Alert.alert(
        tr("Error", "Erreur", "غلطة"),
        tr(
          "Please enter your Stripe email",
          "Veuillez entrer votre email Stripe",
          "حط إيميل سترايب متاعك",
        ),
      );
      return;
    }
    if (withdrawMethod === "crypto" && (!cryptoAddress.trim() || !cryptoCoin)) {
      Alert.alert(
        tr("Error", "Erreur", "غلطة"),
        tr(
          "Please enter your crypto wallet address",
          "Veuillez entrer votre adresse de portefeuille crypto",
          "حط عنوان المحفظة الكريبتو متاعك",
        ),
      );
      return;
    }
    if (
      withdrawMethod === "bank_transfer" &&
      (!iban.trim() || !bankName.trim())
    ) {
      Alert.alert(
        tr("Error", "Erreur", "غلطة"),
        tr(
          "Please enter your IBAN and bank name",
          "Veuillez entrer votre IBAN et le nom de la banque",
          "حط الـ IBAN وإسم البانكة",
        ),
      );
      return;
    }
    if (
      withdrawMethod === "post_office" &&
      (!postFullName.trim() ||
        !postAddress.trim() ||
        !postPostal.trim() ||
        !postCity.trim())
    ) {
      Alert.alert(
        tr("Error", "Erreur", "غلطة"),
        tr(
          "Please fill all postal delivery fields",
          "Veuillez remplir tous les champs de livraison postale",
          "عمر البيانات الكل متاع البريد",
        ),
      );
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const details: WithdrawalDetails = {
        method: withdrawMethod,
        stripeEmail:
          withdrawMethod === "stripe" ? stripeEmail.trim() : undefined,
        cryptoCoin: withdrawMethod === "crypto" ? cryptoCoin : undefined,
        cryptoAddress:
          withdrawMethod === "crypto" ? cryptoAddress.trim() : undefined,
        iban: withdrawMethod === "bank_transfer" ? iban.trim() : undefined,
        bankName:
          withdrawMethod === "bank_transfer" ? bankName.trim() : undefined,
        fullName:
          withdrawMethod === "post_office" ? postFullName.trim() : undefined,
        address:
          withdrawMethod === "post_office" ? postAddress.trim() : undefined,
        postalCode:
          withdrawMethod === "post_office" ? postPostal.trim() : undefined,
        city: withdrawMethod === "post_office" ? postCity.trim() : undefined,
      };

      const finalAmountTND = Number((isEUR ? amount * 3.4 : amount).toFixed(2));
      await requestWithdrawal(wallet.id, user.uid, finalAmountTND, details, "customer");

      Alert.alert(
        tr("Success", "Succès", "تمت العملية"),
        tr(
          "Withdrawal request submitted successfully for admin verification",
          "Demande de retrait soumise avec succès pour vérification admin",
          "طلب الجبدان تبعث بنجاح للمراجعة",
        ),
      );
      setWithdrawModalVisible(false);
      resetWithdrawFields();
    } catch (error: any) {
      console.error("[WalletScreen] Withdrawal error:", error);
      Alert.alert(
        tr("Error", "Erreur", "غلطة"),
        error.message ||
          tr("Withdrawal failed", "Le retrait a échoué", "فشل الجبدان"),
      );
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const resetWithdrawFields = () => {
    setWithdrawAmount("");
    setStripeEmail("");
    setCryptoAddress("");
    setIban("");
    setBankName("");
    setPostFullName("");
    setPostAddress("");
    setPostPostal("");
    setPostCity("");
  };

  const verifyAndCompletePayment = async (sessionIdOrIntentId: string, rechargeAmountTND?: number) => {
    try {
      // Verify Stripe payment via backend; backend credits wallet on success
      const response = await fetch(
        `${API_BASE_URL}/stripe/verify/${sessionIdOrIntentId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await response.json();

      if (data.success && data.status === "succeeded") {
        Alert.alert(
          tr("Success", "Succès", "مبروك"),
          tr(
            "Payment successful! Your coins have been added.",
            "Paiement réussi ! Vos pièces ont été ajoutées.",
            "خلصت بنجاح! تزدادولك العملات",
          ),
        );
        
        // Notify admins about the recharge
        const amountEUR = data.amount ? (data.amount / 100).toFixed(2) : (rechargeAmountTND ? (rechargeAmountTND / 3.4).toFixed(2) : "???");
        const amountTND = data.amount_tnd || rechargeAmountTND || "???";
        
        notifyAdmins(
          "💳 Successful Recharge",
          `User ${user?.displayName || user?.uid?.slice(0, 8)} successfully recharged their wallet with ${amountEUR} EUR (${amountTND} TND) via Stripe.`,
          { userId: user?.uid, type: "recharge", amount: data.amount, amount_tnd: amountTND }
        );
      } else {
        Alert.alert(
          tr("Failed", "Échec", "فشل"),
          tr(
            "Payment verification failed or payment cancelled.",
            "La vérification du paiement a échoué ou le paiement a été annulé.",
            "ما نجمناش نتأكدو من الخلاص",
          ),
        );
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      Alert.alert(
        tr("Error", "Erreur", "غلطة"),
        tr(
          "Failed to verify payment",
          "Échec de la vérification",
          "فشل في التأكد من الخلاص",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmExchange = async () => {
    if (!user?.uid || !exchangeAmount || !walletId) return;
    const amount = parseInt(exchangeAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(
        "Error",
        tr("Invalid amount", "Montant invalide", "مبلغ مش صحيح"),
      );
      return;
    }

    const maxBalance =
      exchangeType === "diamondsToCoins" ? diamondBalance : coinBalance;
    if (amount > maxBalance) {
      Alert.alert(
        tr("Insufficient Balance", "Solde Insuffisant", "الرصيد ما يزيش"),
        tr(
          "Insufficient balance for this exchange.",
          "Solde insuffisant pour cet échange.",
          "رصيدك ما يزيش باش تعمل التبادل هذا.",
        ),
      );
      return;
    }

    setLoading(true);
    try {
      const fromCurrency =
        exchangeType === "diamondsToCoins" ? "diamonds" : "coins";
      const toCurrency =
        exchangeType === "diamondsToCoins" ? "coins" : "diamonds";

      // Calculate toAmount based on rules
      let toAmount = amount;
      if (fromCurrency === "coins" && toCurrency === "diamonds") {
        toAmount = Math.ceil(amount * 0.7); // 30% fee
      }

      await performExchange(
        user.uid,
        walletId,
        fromCurrency,
        toCurrency,
        amount,
        toAmount,
      );

      setShowExchangeModal(false);
      setExchangeAmount("");
      Alert.alert(
        tr("Success", "Succès", "سلكت"),
        tr(
          "Exchange completed successfully.",
          "Échange effectué avec succès.",
          "تم التبادل بنجاح.",
        ),
      );
    } catch (error: any) {
      console.error("Exchange Error:", error);
      Alert.alert(tr("Error", "Erreur", "غلطة"), error.message || tr("Exchange failed", "Échec de l'échange", "ما نجمناش نبدلو"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (text: string) => {
    setTransferSearchQuery(text);
    if (text.length < 2) {
      setTransferSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const q = query(
        collection(db, "users"),
        where("fullName", ">=", text),
        where("fullName", "<=", text + "\uf8ff"),
        limit(10),
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map((doc) => ({ uid: doc.id, ...doc.data() }))
        .filter((u: any) => u.uid !== user?.uid); // Don't show myself
      setTransferSearchResults(results);
    } catch (error) {
      console.error("Search Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTransfer = async () => {
    if (!user?.uid || !selectedUserForTransfer || !transferAmount || !walletId)
      return;

    // Check if mutual friends
    const isFriend = profileData?.friends?.includes(
      selectedUserForTransfer.uid,
    );
    if (!isFriend) {
      Alert.alert(
        tr("Restriction", "Restriction", "ممنوع"),
        tr(
          "You can only transfer funds to confirmed friends.",
          "Vous ne pouvez transférer des fonds qu'à des amis confirmés.",
          "تنجم تحول الفلوس كان للأصحاب اللي وافقت عليهم.",
        ),
      );
      return;
    }

    const amount = parseInt(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(
        "Error",
        tr("Invalid amount", "Montant invalide", "مبلغ مش صحيح"),
      );
      return;
    }

    const maxBalance = transferType === "coins" ? coinBalance : diamondBalance;
    if (amount > maxBalance) {
      Alert.alert(
        tr("Insufficient Balance", "Solde Insuffisant", "الرصيد ما يزيش"),
        tr(
          "Insufficient balance for this transfer.",
          "Solde insuffisant pour ce transfert.",
          "رصيدك ما يزيش باش تحول المبلغ هذا.",
        ),
      );
      return;
    }

    setLoading(true);
    try {
      // Get recipient wallet
      const recipientWalletId = await getOrCreateWallet(
        selectedUserForTransfer.uid,
        "customer",
        selectedUserForTransfer.fullName,
      );

      await performTransfer(
        user.uid,
        walletId,
        selectedUserForTransfer.uid,
        recipientWalletId,
        selectedUserForTransfer.fullName,
        amount,
        transferType,
      );

      Alert.alert(
        tr("Success", "Succès", "سلكت"),
        tr(
          "Transfer completed successfully.",
          "Transfert effectué avec succès.",
          "تم التحويل بنجاح.",
        ),
      );
      setShowTransferModal(false);
      setTransferAmount("");
      setSelectedUserForTransfer(null);
      setTransferSearchQuery("");
      setTransferSearchResults([]);
    } catch (error: any) {
      console.error("Transfer Error:", error);
      Alert.alert(tr("Error", "Erreur", "غلطة"), error.message || tr("Transfer failed", "Échec du transfert", "ما نجمناش نحولو"));
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (targetUser: any) => {
    if (!user?.uid) return;

    // Already friends?
    if (profileData?.friends?.includes(targetUser.uid)) return;

    // Already sent?
    if (sentRequests.some((r) => r.receiverId === targetUser.uid)) {
      Alert.alert(
        tr("Info", "Info", "معلومات"),
        tr(
          "Request already sent.",
          "Demande déjà envoyée.",
          "الطلب تبعث ديجا.",
        ),
      );
      return;
    }

    setLoading(true);
    try {
      // Create request in global collection
      const requestRef = doc(collection(db, "friendRequests"));
      const requestData = {
        senderId: user.uid,
        senderName: profileData?.fullName || "User",
        senderAvatar: profileData?.avatarUrl || "",
        receiverId: targetUser.uid,
        receiverName: targetUser.fullName,
        receiverAvatar: targetUser.avatarUrl || "",
        status: "pending",
        timestamp: serverTimestamp(),
      };
      await setDoc(requestRef, requestData);

      // Also add to receiver's incoming sub-collection for easier notifications/UI
      await setDoc(
        doc(db, "users", targetUser.uid, "friendRequests", requestRef.id),
        requestData,
      );

      Alert.alert(
        tr("Success", "Succès", "سلكت!"),
        tr(
          "Friend request sent!",
          "Demande d'ami envoyée !",
          "طلب الصداقة تبعث!",
        ),
      );
    } catch (error) {
      console.error("Friend Request Error:", error);
      Alert.alert(tr("Error", "Erreur", "غلطة"), tr("Failed to send request", "Échec de l'envoi de la demande", "ما نجمناش نبعثو الطلب"));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptFriendRequest = async (request: any) => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const meRef = doc(db, "users", user.uid);
        const themRef = doc(db, "users", request.senderId);
        const globalRequestRef = doc(db, "friendRequests", request.id);
        const myRequestRef = doc(
          db,
          "users",
          user.uid,
          "friendRequests",
          request.id,
        );

        // Add to both friends arrays
        transaction.update(meRef, { friends: arrayUnion(request.senderId) });
        transaction.update(themRef, { friends: arrayUnion(user.uid) });

        // Update status of requests
        transaction.update(globalRequestRef, { status: "accepted" });
        transaction.delete(myRequestRef);
      });
      Alert.alert(
        tr("Success", "Succès", "سلكت!"),
        tr(
          "Friend request accepted!",
          "Demande d'ami acceptée !",
          "قبلت طلب الصداقة!",
        ),
      );
    } catch (error) {
      console.error("Accept Friend Error:", error);
      Alert.alert(tr("Error", "Erreur", "غلطة"), tr("Failed to accept request", "Échec de l'acceptation de la demande", "ما نجمناش نقبلو الطلب"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFriend = async (friendId: string, friendName: string) => {
    if (!user?.uid) return;

    Alert.alert(
      tr("Remove Friend", "Supprimer l'ami", "نحي الصاحب"),
      `${tr("Are you sure you want to remove", "Êtes-vous sûr de vouloir supprimer", "متأكد تحب تنحي")} ${friendName} ${tr("from your friends list?", "de votre liste d'amis ?", "من قائمة صحابك؟")}`,
      [
        { text: tr("Cancel", "Annuler", "إلغاء"), style: "cancel" },
        {
          text: tr("Remove", "Supprimer", "حذف"),
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await runTransaction(db, async (transaction) => {
                const meRef = doc(db, "users", user.uid);
                const themRef = doc(db, "users", friendId);

                transaction.update(meRef, { friends: arrayRemove(friendId) });
                transaction.update(themRef, { friends: arrayRemove(user.uid) });
              });
              Alert.alert(
                tr("Success", "Succès", "سلكت!"),
                tr(
                  "Friend removed successfully.",
                  "Ami supprimé avec succès.",
                  "نحيت الصاحب بنجاح.",
                ),
              );
            } catch (error) {
              console.error("Remove Friend Error:", error);
              Alert.alert(tr("Error", "Erreur", "غلطة"), tr("Failed to remove friend", "Échec de la suppression de l'ami", "ما نجمناش نفرخو الصاحب"));
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleRejectFriendRequest = async (request: any) => {
    if (!user?.uid) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "friendRequests", request.id));
      await setDoc(
        doc(db, "friendRequests", request.id),
        { status: "rejected" },
        { merge: true },
      );
    } catch (error) {
      console.error("Reject Friend Error:", error);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? "rgba(0,0,0,0.6)"
              : "rgba(255,255,255,0.8)",
          },
        ]}
      />

      <View style={[styles.navBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={onBack}
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark ? "#000" : "#F2F2F7",
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <ChevronLeft size={22} color={colors.foreground} strokeWidth={2.5} />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.foreground,
              fontSize: 16,
              fontWeight: "900",
              letterSpacing: 1.5,
            },
          ]}
        >
          {tr("MY WALLET", "MON PORTEFEUILLE", "محفظتي")}
        </Text>

        <TouchableOpacity
          onPress={async () => {
            if (isRefreshing) return;
            setIsRefreshing(true);
            Animated.timing(rotation, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }).start();
            await fetchTransactions();
            setTimeout(() => {
              rotation.setValue(0);
              setIsRefreshing(false);
            }, 1000);
          }}
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark ? "#000" : "#F2F2F7",
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            }}
          >
            <RefreshCw size={20} color={colors.foreground} strokeWidth={2.5} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCardContainer}>
        <LinearGradient
          colors={
            activeTab === "recharge"
              ? ["#F59E0B", "#D97706"]
              : ["#8B5CF6", "#7C3AED"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.balanceCard,
            {
              borderRadius: 28,
              shadowColor: activeTab === "recharge" ? "#F59E0B" : "#8B5CF6",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 15,
              elevation: 10,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.balanceLabel,
                {
                  letterSpacing: 1.5,
                  opacity: 0.9,
                  fontSize: 11,
                  fontWeight: "900",
                },
              ]}
            >
              {activeTab === "recharge"
                ? tr("COIN BALANCE", "SOLDE DE PIÈCES", "رصيد العملات")
                : tr("DIAMOND BALANCE", "SOLDE DE DIAMANTS", "رصيد الجواهر")}
            </Text>
            <View style={styles.balanceRow}>
              {activeTab === "recharge" ? (
                <Coins size={32} color="#FFF" style={{ marginRight: 12 }} />
              ) : (
                <Gem size={32} color="#FFF" style={{ marginRight: 12 }} />
              )}
              <Text
                style={[
                  styles.balanceAmount,
                  { fontSize: 38, fontWeight: "900", letterSpacing: -1 },
                ]}
              >
                {activeTab === "recharge"
                  ? Math.max(0, coinBalance).toLocaleString()
                  : Math.max(0, diamondBalance).toLocaleString()}
              </Text>
            </View>
            {activeTab === "earnings" && (
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignSelf: "flex-start",
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginTop: 10,
                }}
              >
                <Text
                  style={{ color: "#FFF", fontSize: 13, fontWeight: "900" }}
                >
                  ≈{" "}
                  {Math.max(0, diamondBalance * DIAMOND_TO_TND_RATE).toFixed(2)}{" "}
                  TND
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.walletIconContainer, { opacity: 0.3 }]}>
            <Wallet size={48} color="#FFF" />
          </View>

          <View
            style={[
              styles.decorativeCircle,
              {
                top: -40,
                right: -40,
                width: 140,
                height: 140,
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            ]}
          />
          <View
            style={[
              styles.decorativeCircle,
              {
                bottom: -60,
                left: -40,
                width: 120,
                height: 120,
                backgroundColor: "rgba(255,255,255,0.05)",
              },
            ]}
          />
        </LinearGradient>
      </View>

      <View
        style={[
          styles.tabContainer,
          {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.05)",
            marginHorizontal: 20,
            borderRadius: 20,
            padding: 4,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "recharge" && {
              backgroundColor: isDark ? "#FFF" : "#000",
              borderRadius: 16,
            },
          ]}
          onPress={() => setActiveTab("recharge")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "recharge"
                    ? isDark
                      ? "#000"
                      : "#FFF"
                    : colors.textMuted,
                fontWeight: "900",
                fontSize: 12,
              },
            ]}
          >
            {tr("RECHARGE", "RECHARGER", "شحن")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "earnings" && {
              backgroundColor: isDark ? "#FFF" : "#000",
              borderRadius: 16,
            },
          ]}
          onPress={() => setActiveTab("earnings")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "earnings"
                    ? isDark
                      ? "#000"
                      : "#FFF"
                    : colors.textMuted,
                fontWeight: "900",
                fontSize: 12,
              },
            ]}
          >
            {tr("EARNINGS", "GAINS", "المرابيح")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecharge = () => (
    <View style={styles.sectionContainer}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 15,
        }}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.foreground, marginBottom: 0 },
          ]}
        >
          {tr("Top Up Coins", "Recharger des Pièces", "اشحن العملات")}
        </Text>
        {/* <TouchableOpacity
                    onPress={async () => {
                        if (!user?.uid) return;
                        setLoading(true);
                        try {
                            const userRef = doc(db, 'users', user.uid);
                            await setDoc(userRef, {
                                wallet: {
                                    coins: increment(1000),
                                    diamonds: increment(500)
                                }
                            }, { merge: true });

                            await addDoc(collection(db, 'users', user.uid, 'transactions'), {
                                type: 'recharge',
                                amountCoins: 1000,
                                amountDiamonds: 500,
                                description: 'Simulated Charge (Dev Only)',
                                timestamp: serverTimestamp(),
                                status: 'completed'
                            });
                            Alert.alert('Success', 'Simulated 1000 Coins & 500 Diamonds');
                        } catch (err) {
                            console.error(err);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}
                >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#3B82F6' }}>{tr('Simulate', 'Simuler', 'محاكاة')}</Text>
                </TouchableOpacity> */}
      </View>
      <View style={styles.gridContainer}>
        {RECHARGE_PACKAGES.map((pack) => {
          let totalExtraPercent = 0;
          if (bonusSettings?.extraBonus?.enabled) {
            totalExtraPercent += bonusSettings.extraBonus.bonus || 0;
          }
          if (bonusSettings?.firstRecharge?.enabled && isFirstRecharge) {
            totalExtraPercent += bonusSettings.firstRecharge.bonus || 0;
          }
          if (
            bonusSettings?.bulkBonus?.enabled &&
            pack.price >= (bonusSettings.bulkBonus.threshold || 0)
          ) {
            totalExtraPercent += bonusSettings.bulkBonus.bonus || 0;
          }
          // Note: Crypto bonus is not shown here because we don't know the method yet,
          // but we could add a hint " +X% more with Crypto"

          return (
            <TouchableOpacity
              key={pack.id}
              style={[
                styles.packageCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
              onPress={() => initiateRecharge(pack)}
              disabled={loading}
            >
              {totalExtraPercent > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    backgroundColor: "#EF4444",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    zIndex: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    elevation: 3,
                  }}
                >
                  <Text
                    style={{ color: "#FFF", fontSize: 10, fontWeight: "900" }}
                  >
                    +{totalExtraPercent}% {tr("BONUS", "BONUS", "زيادة")}
                  </Text>
                </View>
              )}
              <View style={styles.coinIconWrapper}>
                <Coins size={28} color="#F59E0B" fill="#F59E0B" />
              </View>
              <Text style={[styles.coinAmount, { color: colors.foreground }]}>
                {pack.coins}
              </Text>
              {pack.bonus > 0 && (
                <Text style={styles.bonusText}>
                  +{pack.bonus} {tr("Bonus", "Bonus", "زيادة")}
                </Text>
              )}
              <View
                style={[styles.priceButton, { backgroundColor: "#F59E0B" }]}
              >
                <Text style={styles.priceText}>{pack.priceDisplay}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderEarnings = () => {
    const tndValue = (diamondBalance * DIAMOND_TO_TND_RATE).toFixed(2);

    return (
      <View style={styles.sectionContainer}>
        <View
          style={[
            styles.infoBox,
            { backgroundColor: "rgba(59, 130, 246, 0.1)" },
          ]}
        >
          <Text
            style={{
              color: colors.foreground,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {tr(
              "Diamonds are earned from gifts received during live streams. You can withdraw them as cash (Min 50 TND) or exchange them for Coins.",
              "Les diamants sont gagnés grâce aux cadeaux reçus lors des directs. Vous pouvez les retirer en espèces (Min 50 TND) ou les échanger contre des pièces.",
              "الجواهر تربحهم مالهدايا اللي يبعثوهملك في اللايف. تنجم تجبدهم فلوس (أقل حاجة 50 دينار) وإلا تبدلهم بعملات.",
            )}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                flex: 1,
                backgroundColor: isDark
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(16, 185, 129, 0.08)",
                borderWidth: 1.5,
                borderColor: "rgba(16, 185, 129, 0.3)",
              },
            ]}
            onPress={() => {
              setWithdrawModalVisible(true);
              setWithdrawStep("method");
            }}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: "rgba(16, 185, 129, 0.2)", marginBottom: 8 },
              ]}
            >
              <ArrowUpRight size={22} color="#10B981" />
            </View>
            <Text style={[styles.actionBtnTitle, { color: colors.foreground }]}>
              {tr("Withdraw", "Retirer", "اجبد")}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              {tndValue} TND
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                flex: 1,
                backgroundColor: isDark
                  ? "rgba(245, 158, 11, 0.15)"
                  : "rgba(245, 158, 11, 0.08)",
                borderWidth: 1.5,
                borderColor: "rgba(245, 158, 11, 0.3)",
              },
            ]}
            onPress={() => setShowExchangeModal(true)}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: "rgba(245, 158, 11, 0.2)", marginBottom: 8 },
              ]}
            >
              <Repeat size={22} color="#F59E0B" />
            </View>
            <Text style={[styles.actionBtnTitle, { color: colors.foreground }]}>
              {tr("Exchange", "Échanger", "بدل")}
            </Text>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>
              {tr("Coins/Diamonds", "Pièces/Diamants", "عملات/جواهر")}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.transferBanner,
            {
              backgroundColor: isDark
                ? "rgba(59, 130, 246, 0.2)"
                : "rgba(59, 130, 246, 0.1)",
              borderColor: "#3B82F6",
              borderWidth: 2,
              elevation: 4,
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
            },
          ]}
          onPress={() => setShowTransferModal(true)}
        >
          <View style={styles.transferBannerLeft}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: "#3B82F6",
                  marginBottom: 0,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                },
              ]}
            >
              <Send size={18} color="#FFF" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={[
                  styles.transferBannerTitle,
                  { color: colors.foreground, fontSize: 15 },
                ]}
              >
                {tr("Transfer to Friend", "Transférer à un ami", "حول لصاحبك")}
              </Text>
              <Text
                style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}
              >
                {tr(
                  "Send Coins or Diamonds instantly",
                  "Envoyer des pièces ou diamants instantanément",
                  "ابعث عملات وإلا جواهر في وقتها",
                )}
              </Text>
            </View>
            <ArrowRight size={20} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.foreground, marginTop: 30 },
          ]}
        >
          {tr("Recent Transaction", "Trans. Récentes", "آخر المعاملات")}
        </Text>
        <View style={{ marginTop: 10 }}>
          {transactions.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 40, opacity: 0.5 }}>
              <History
                size={48}
                color={colors.textMuted}
                strokeWidth={1}
                style={{ marginBottom: 12 }}
              />
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                {tr(
                  "No recent transactions",
                  "Pas de transactions récentes",
                  "ما ثماش معاملات توا",
                )}
              </Text>
            </View>
          ) : (
            transactions.map((tx: any) => (
              <View
                key={tx.id}
                style={[
                  styles.transactionItem,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.02)",
                    borderRadius: 16,
                    marginBottom: 10,
                    paddingHorizontal: 12,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor:
                        tx.type === "recharge"
                          ? "rgba(245, 158, 11, 0.15)"
                          : tx.type === "withdrawal" ||
                              tx.type === "transfer_sent"
                            ? "rgba(239, 68, 68, 0.15)"
                            : tx.type === "exchange" ||
                                tx.type === "transfer_received"
                              ? "rgba(16, 185, 129, 0.15)"
                              : tx.type === "gift_received"
                                ? "rgba(139, 92, 246, 0.15)"
                                : "rgba(107, 114, 128, 0.15)",
                    },
                  ]}
                >
                  {tx.type === "recharge" && (
                    <Coins size={20} color="#F59E0B" fill="#F59E0B" />
                  )}
                  {(tx.type === "withdrawal" ||
                    tx.type === "transfer_sent" ||
                    tx.type === "gift_sent") && (
                    <ArrowUpRight size={20} color="#EF4444" />
                  )}
                  {tx.type === "exchange" && (
                    <Repeat size={20} color="#10B981" />
                  )}
                  {tx.type === "gift_received" && (
                    <Gem size={20} color="#8B5CF6" fill="#8B5CF6" />
                  )}
                  {tx.type === "transfer_received" && (
                    <ArrowDownLeft size={20} color="#10B981" />
                  )}
                </View>
                <View style={styles.transactionInfo}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={[
                        styles.transactionTitle,
                        { color: colors.foreground },
                      ]}
                    >
                      {tx.type === "recharge"
                        ? tr("Recharge", "Rechargement", "شحن")
                        : tx.type === "withdrawal"
                          ? tr("Withdrawal", "Retrait", "جبدان")
                          : tx.type === "transfer_sent"
                            ? tr(
                                "Transfer Sent",
                                "Transfert Envoyé",
                                "تحويل تبعث",
                              )
                            : tx.type === "transfer_received"
                              ? tr(
                                  "Transfer Received",
                                  "Transfert Reçu",
                                  "وصلك تحويل",
                                )
                              : tx.type === "exchange"
                                ? tr("Exchange", "Échange", "تبادل")
                                : tx.type === "gift_received"
                                  ? tr(
                                      "Gift Received",
                                      "Cadeau Reçu",
                                      "وصلتك هدية",
                                    )
                                  : tx.type === "gift_sent"
                                    ? tr(
                                        "Gift Sent",
                                        "Cadeau Envoyé",
                                        "بعثت هدية",
                                      )
                                    : tr("Transaction", "Transaction", "عملية")}
                    </Text>
                    <Text
                      style={[
                        styles.transactionAmount,
                        {
                          color:
                            tx.type === "withdrawal" ||
                            tx.type === "gift_sent" ||
                            tx.type === "transfer_sent"
                              ? "#EF4444"
                              : "#10B981",
                        },
                      ]}
                    >
                      {tx.type === "withdrawal" ||
                      tx.type === "gift_sent" ||
                      tx.type === "transfer_sent"
                        ? "-"
                        : "+"}
                      {tx.type === "recharge"
                        ? `${tx.amountCoins || tx.amount || 0} ${tr("Coins", "Pièces", "عملة")}`
                        : tx.type === "withdrawal"
                          ? `${(tx.amountTND || 0).toFixed(2)} TND`
                          : tx.type === "exchange"
                            ? `${tx.amountCoins || 0} ${tr("Coins", "Pièces", "عملة")}`
                            : tx.type === "gift_received"
                              ? `${tx.amountDiamonds || 0} ${tr("Diamonds", "Diamants", "جوهرة")}`
                              : tx.type === "transfer_sent" ||
                                  tx.type === "transfer_received"
                                ? `${tx.amount || 0} ${tx.currency === "coins" ? tr("Coins", "Pièces", "عملة") : tr("Diamonds", "Diamants", "جوهرة")}`
                                : `${tx.amountCoins || 0} ${tr("Coins", "Pièces", "عملة")}`}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 2,
                    }}
                  >
                    <Text
                      style={[
                        styles.transactionDate,
                        { color: colors.textMuted },
                      ]}
                    >
                      {tx.description ||
                        (tx.type === "gift_received"
                          ? `${tx.giftName} ${tr("from", "de", "من")} ${tx.senderName}`
                          : tx.type === "gift_sent"
                            ? `${tx.giftName} ${tr("to", "à", "لـ")} ${tx.recipientName}`
                            : "")}
                    </Text>
                    <Text
                      style={[
                        styles.transactionDate,
                        { color: colors.textMuted, fontSize: 10 },
                      ]}
                    >
                      {tx.timestamp?.toDate
                        ? tx.timestamp.toDate().toLocaleDateString()
                        : "..."}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    );
  };

  const renderHistory = () => (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.foreground, marginTop: 10 },
        ]}
      >
        {tr("Transaction History", "Historique", "تاريخ العمليات")}
      </Text>
      {transactions.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 40, opacity: 0.5 }}>
          <History
            size={48}
            color={colors.textMuted}
            strokeWidth={1}
            style={{ marginBottom: 12 }}
          />
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>
            {tr(
              "No transactions yet",
              "Aucune transaction",
              "ما عملت حتى عملية لتوا",
            )}
          </Text>
        </View>
      ) : (
        transactions.map((tx: any) => (
          <View
            key={tx.id}
            style={[
              styles.transactionItem,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0,0,0,0.02)",
                borderRadius: 16,
                marginBottom: 10,
                paddingHorizontal: 12,
              },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor:
                    tx.type === "recharge"
                      ? "rgba(245, 158, 11, 0.15)"
                      : tx.type === "withdrawal" || tx.type === "transfer_sent"
                        ? "rgba(239, 68, 68, 0.15)"
                        : tx.type === "exchange" ||
                            tx.type === "transfer_received"
                          ? "rgba(16, 185, 129, 0.15)"
                          : tx.type === "gift_received"
                            ? "rgba(139, 92, 246, 0.15)"
                            : "rgba(107, 114, 128, 0.15)",
                },
              ]}
            >
              {tx.type === "recharge" && (
                <Coins size={20} color="#F59E0B" fill="#F59E0B" />
              )}
              {(tx.type === "withdrawal" ||
                tx.type === "transfer_sent" ||
                tx.type === "gift_sent") && (
                <ArrowUpRight size={20} color="#EF4444" />
              )}
              {tx.type === "exchange" && <Repeat size={20} color="#10B981" />}
              {tx.type === "gift_received" && (
                <Gem size={20} color="#8B5CF6" fill="#8B5CF6" />
              )}
              {tx.type === "transfer_received" && (
                <ArrowDownLeft size={20} color="#10B981" />
              )}
            </View>
            <View style={styles.transactionInfo}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={[
                    styles.transactionTitle,
                    { color: colors.foreground },
                  ]}
                >
                  {tx.type === "recharge"
                    ? tr("Recharge", "Rechargement", "شحن")
                    : tx.type === "withdrawal"
                      ? tr("Withdrawal", "Retrait", "جبدان")
                      : tx.type === "transfer_sent"
                        ? tr("Transfer Sent", "Transfert Envoyé", "تحويل تبعث")
                        : tx.type === "transfer_received"
                          ? tr(
                              "Transfer Received",
                              "Transfert Reçu",
                              "وصلك تحويل",
                            )
                          : tx.type === "exchange"
                            ? tr("Exchange", "Échange", "تبادل")
                            : tx.type === "gift_received"
                              ? tr("Gift Received", "Cadeau Reçu", "وصلتك هدية")
                              : tx.type === "gift_sent"
                                ? tr("Gift Sent", "Cadeau Envoyé", "بعثت هدية")
                                : tr("Transaction", "Transaction", "عملية")}
                </Text>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color:
                        tx.type === "withdrawal" ||
                        tx.type === "gift_sent" ||
                        tx.type === "transfer_sent"
                          ? "#EF4444"
                          : "#10B981",
                    },
                  ]}
                >
                  {tx.type === "withdrawal" ||
                  tx.type === "gift_sent" ||
                  tx.type === "transfer_sent"
                    ? "-"
                    : "+"}
                  {tx.type === "recharge"
                    ? `${tx.amountCoins || tx.amount || 0} ${tr("Coins", "Pièces", "عملة")}`
                    : tx.type === "withdrawal"
                      ? `${(tx.amountTND || 0).toFixed(2)} TND`
                      : tx.type === "exchange"
                        ? `${tx.amountCoins || 0} ${tr("Coins", "Pièces", "عملة")}`
                        : tx.type === "gift_received"
                          ? `${tx.amountDiamonds || 0} ${tr("Diamonds", "Diamants", "جوهرة")}`
                          : tx.type === "transfer_sent" ||
                              tx.type === "transfer_received"
                            ? `${tx.amount || 0} ${tx.currency === "coins" ? tr("Coins", "Pièces", "عملة") : tr("Diamonds", "Diamants", "جوهرة")}`
                            : `${tx.amountCoins || 0} ${tr("Coins", "Pièces", "عملة")}`}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={[styles.transactionDate, { color: colors.textMuted }]}
                >
                  {tx.createdAt?.toDate
                    ? tx.createdAt.toDate().toLocaleDateString()
                    : new Date().toLocaleDateString()}
                </Text>
                {tx.type === "withdrawal" && tx.status && (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor:
                        tx.status === "pending"
                          ? "rgba(245, 158, 11, 0.1)"
                          : tx.status === "approved"
                            ? "rgba(16, 185, 129, 0.1)"
                            : "rgba(239, 68, 68, 0.1)",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "800",
                        color:
                          tx.status === "pending"
                            ? "#F59E0B"
                            : tx.status === "approved"
                              ? "#10B981"
                              : "#EF4444",
                        textTransform: "uppercase",
                      }}
                    >
                      {tx.status}
                    </Text>
                  </View>
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 2,
                }}
              >
                <Text
                  style={[styles.transactionDate, { color: colors.textMuted }]}
                >
                  {tx.description ||
                    (tx.type === "gift_received"
                      ? `${tx.giftName} ${tr("from", "de", "من")} ${tx.senderName}`
                      : tx.type === "gift_sent"
                        ? `${tx.giftName} ${tr("to", "à", "لـ")} ${tx.recipientName}`
                        : "")}
                </Text>
                <Text
                  style={[
                    styles.transactionDate,
                    { color: colors.textMuted, fontSize: 10 },
                  ]}
                >
                  {tx.timestamp?.toDate
                    ? tx.timestamp.toDate().toLocaleDateString()
                    : "..."}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardOpen(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardOpen(false),
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "recharge" ? (
          <>
            {renderRecharge()}
            {renderHistory()}
          </>
        ) : (
          renderEarnings()
        )}
      </ScrollView>

      {/* Floating Admin Button */}
      {isAdmin && (
        <TouchableOpacity
          onPress={() => setShowAdminPanel(true)}
          style={{
            position: "absolute",
            bottom: insets.bottom + 100, // Pushed up further to avoid tab bar overlap
            right: 20,
            backgroundColor: "#EF4444",
            width: 50,
            height: 50,
            borderRadius: 25,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#EF4444",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 8,
            zIndex: 999,
          }}
        >
          <RefreshCw size={24} color="#FFF" />
          {adminInvoices.length + adminWithdrawals.length > 0 && (
            <View
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                backgroundColor: "#FFF",
                borderRadius: 10,
                paddingHorizontal: 6,
                paddingVertical: 2,
                minWidth: 20,
                alignItems: "center",
                borderWidth: 2,
                borderColor: "#EF4444",
              }}
            >
              <Text
                style={{ color: "#EF4444", fontSize: 10, fontWeight: "900" }}
              >
                {adminInvoices.length + adminWithdrawals.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Admin Crypto Verification Panel */}
      <Modal
        visible={showAdminPanel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAdminPanel(false)}
      >
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFF",
                maxHeight: "90%",
                minHeight: 600,
                paddingBottom: insets.bottom,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <View
                  style={{
                    backgroundColor: "rgba(239,68,68,0.1)",
                    padding: 8,
                    borderRadius: 12,
                  }}
                >
                  <RefreshCw size={18} color="#EF4444" />
                </View>
                <View>
                  <Text
                    style={{
                      color: "#EF4444",
                      fontWeight: "900",
                      fontSize: 16,
                    }}
                  >
                    {tr(
                      "ADMIN VERIFICATION",
                      "VÉRIFICATION ADMIN",
                      "مراجعة الأدمن",
                    )}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    {tr(
                      "Approve or reject transactions",
                      "Approuver ou rejeter les transactions",
                      "قبول أو رفض المعاملات",
                    )}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAdminPanel(false)}>
                <X size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Admin Tabs */}
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                <TouchableOpacity
                  onPress={() => setAdminPanelTab("crypto")}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor:
                      adminPanelTab === "crypto"
                        ? "rgba(239,68,68,0.1)"
                        : "transparent",
                    borderWidth: 1,
                    borderColor:
                      adminPanelTab === "crypto" ? "#EF4444" : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color:
                        adminPanelTab === "crypto"
                          ? "#EF4444"
                          : colors.textMuted,
                      fontWeight: "800",
                      fontSize: 11,
                    }}
                  >
                    {tr("RECHARGES", "RECHARGES", "شحن")} (
                    {adminInvoices.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAdminPanelTab("withdrawals")}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor:
                      adminPanelTab === "withdrawals"
                        ? "rgba(239,68,68,0.1)"
                        : "transparent",
                    borderWidth: 1,
                    borderColor:
                      adminPanelTab === "withdrawals"
                        ? "#EF4444"
                        : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color:
                        adminPanelTab === "withdrawals"
                          ? "#EF4444"
                          : colors.textMuted,
                      fontWeight: "800",
                      fontSize: 11,
                    }}
                  >
                    {tr("WITHDRAWALS", "RETRAITS", "سحب")} (
                    {adminWithdrawals.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAdminPanelTab("bonuses")}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor:
                      adminPanelTab === "bonuses"
                        ? "rgba(239,68,68,0.1)"
                        : "transparent",
                    borderWidth: 1,
                    borderColor:
                      adminPanelTab === "bonuses" ? "#EF4444" : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color:
                        adminPanelTab === "bonuses"
                          ? "#EF4444"
                          : colors.textMuted,
                      fontWeight: "800",
                      fontSize: 11,
                    }}
                  >
                    {tr("BONUSES", "BONUS", "مكافآت")}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ paddingHorizontal: 4 }}
            >
              {adminPanelTab === "crypto" ? (
                adminInvoices.length === 0 ? (
                  <View
                    style={{
                      padding: 40,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={40} color="rgba(239, 68, 68, 0.3)" />
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 14,
                        marginTop: 12,
                        fontWeight: "600",
                      }}
                    >
                      {tr(
                        "No pending crypto payments",
                        "Aucun paiement crypto en attente",
                        "ما فماش شحن بالكريبتو توة",
                      )}
                    </Text>
                  </View>
                ) : (
                  adminInvoices.map((inv) => (
                    <View
                      key={inv.id}
                      style={{
                        marginBottom: 14,
                        borderRadius: 18,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: "rgba(239,68,68,0.15)",
                      }}
                    >
                      {/* Render Invoice Card */}
                      <View
                        style={{
                          backgroundColor: isDark
                            ? "rgba(239,68,68,0.08)"
                            : "rgba(239,68,68,0.05)",
                          padding: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: "rgba(239,68,68,0.1)",
                        }}
                      >
                        {inv._user?.avatarUrl ? (
                          <Image
                            source={{ uri: inv._user.avatarUrl }}
                            style={{ width: 44, height: 44, borderRadius: 22 }}
                          />
                        ) : (
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: "rgba(239,68,68,0.15)",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <User size={22} color="#EF4444" />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontWeight: "800",
                              color: colors.foreground,
                              fontSize: 15,
                            }}
                          >
                            {inv._user?.fullName ||
                              tr("Unknown", "Inconnu", "غير معروف")}
                          </Text>
                          {inv._user?.email && (
                            <Text
                              style={{ fontSize: 11, color: colors.textMuted }}
                            >
                              {inv._user.email}
                            </Text>
                          )}
                          {inv._user?.phone && (
                            <Text
                              style={{ fontSize: 11, color: colors.textMuted }}
                            >
                              {inv._user.phone}
                            </Text>
                          )}
                          <Text
                            style={{ fontSize: 11, color: colors.textMuted }}
                          >
                            {inv.coin} Payment
                          </Text>
                        </View>
                      </View>
                      <View style={{ padding: 14 }}>
                        <Text
                          style={{
                            fontWeight: "900",
                            color: colors.foreground,
                            fontSize: 20,
                          }}
                        >
                          {inv.coinAmount} {inv.coin}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleConfirmCryptoPayment(inv.id)}
                          style={{
                            backgroundColor: "#10B981",
                            paddingVertical: 12,
                            borderRadius: 12,
                            alignItems: "center",
                            marginTop: 12,
                          }}
                        >
                          <Text style={{ color: "#FFF", fontWeight: "900" }}>
                            {tr(
                              "CONFIRM PAYMENT",
                              "CONFIRMER LE PAIEMENT",
                              "أكد الدفع",
                            )}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )
              ) : adminPanelTab === "withdrawals" ? (
                adminWithdrawals.length === 0 ? (
                  <View
                    style={{
                      padding: 40,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingUp size={40} color="rgba(239, 68, 68, 0.3)" />
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 14,
                        marginTop: 12,
                        fontWeight: "600",
                      }}
                    >
                      {tr(
                        "No pending withdrawal requests",
                        "Aucune demande de retrait en attente",
                        "ما فماش طلبات جبدان توة",
                      )}
                    </Text>
                  </View>
                ) : (
                  adminWithdrawals.map((req) => (
                    <View
                      key={req.id}
                      style={{
                        marginBottom: 14,
                        borderRadius: 18,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: "rgba(239,68,68,0.15)",
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: isDark
                            ? "rgba(239,68,68,0.08)"
                            : "rgba(239,68,68,0.05)",
                          padding: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: "rgba(239,68,68,0.1)",
                        }}
                      >
                        {req._user?.avatarUrl ? (
                          <Image
                            source={{ uri: req._user.avatarUrl }}
                            style={{ width: 44, height: 44, borderRadius: 22 }}
                          />
                        ) : (
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: "rgba(239,68,68,0.15)",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <User size={22} color="#EF4444" />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontWeight: "800",
                              color: colors.foreground,
                              fontSize: 15,
                            }}
                          >
                            {req._user?.fullName ||
                              tr("Unknown", "Inconnu", "غير معروف")}
                          </Text>
                          {req._user?.email && (
                            <Text
                              style={{ fontSize: 11, color: colors.textMuted }}
                            >
                              {req._user.email}
                            </Text>
                          )}
                          {req._user?.phone && (
                            <Text
                              style={{ fontSize: 11, color: colors.textMuted }}
                            >
                              {req._user.phone}
                            </Text>
                          )}
                          <Text
                            style={{ fontSize: 11, color: colors.textMuted }}
                          >
                            UID: {req.userId}
                          </Text>
                          <Text
                            style={{ fontSize: 11, color: colors.textMuted }}
                          >
                            {tr(
                              `${req.method.toUpperCase()} Withdrawal`,
                              `Retrait ${req.method.toUpperCase()}`,
                              `سحب ${req.method.toUpperCase()}`,
                            )}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text
                            style={{
                              fontWeight: "900",
                              color: "#EF4444",
                              fontSize: 18,
                            }}
                          >
                            -{req.amount.toFixed(2)} TND
                          </Text>
                          {req.payoutCurrency &&
                            req.payoutCurrency !== "TND" && (
                              <Text
                                style={{
                                  fontWeight: "800",
                                  color: "#10B981",
                                  fontSize: 13,
                                  marginTop: -2,
                                }}
                              >
                                ≈ {req.payoutAmount?.toFixed(2)}{" "}
                                {req.payoutCurrency}
                              </Text>
                            )}
                          <Text
                            style={{
                              fontWeight: "700",
                              color: "#8B5CF6",
                              fontSize: 12,
                            }}
                          >
                            ={(req.amount * 100).toLocaleString()} Diamonds
                          </Text>
                        </View>
                      </View>
                      <View style={{ padding: 14 }}>
                        {req.method === "crypto" && (
                          <View
                            style={{
                              marginBottom: 12,
                              padding: 10,
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.03)",
                              borderRadius: 10,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                color: colors.foreground,
                                marginBottom: 4,
                              }}
                            >
                              {tr("Coin", "Pièce", "العملة")}:{" "}
                              <Text
                                style={{ fontWeight: "800", color: "#F59E0B" }}
                              >
                                {req.details?.cryptoCoin}
                              </Text>
                            </Text>
                            <Text
                              style={{ fontSize: 12, color: colors.foreground }}
                            >
                              {tr("Address", "Adresse", "العنوان")}:{" "}
                              <Text style={{ fontWeight: "700" }}>
                                {req.details?.cryptoAddress}
                              </Text>
                            </Text>
                          </View>
                        )}
                        {req.method === "bank_transfer" && (
                          <View
                            style={{
                              marginBottom: 12,
                              padding: 10,
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.03)",
                              borderRadius: 10,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                color: colors.foreground,
                                marginBottom: 4,
                              }}
                            >
                              {tr("Bank", "Banque", "البنك")}:{" "}
                              <Text style={{ fontWeight: "800" }}>
                                {req.details?.bankName}
                              </Text>
                            </Text>
                            <Text
                              style={{ fontSize: 12, color: colors.foreground }}
                            >
                              {tr("IBAN", "IBAN", "الآيبان")}:{" "}
                              <Text style={{ fontWeight: "700" }}>
                                {req.details?.iban}
                              </Text>
                            </Text>
                          </View>
                        )}
                        {req.method === "post_office" && (
                          <View
                            style={{
                              marginBottom: 12,
                              padding: 10,
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.03)",
                              borderRadius: 10,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                color: colors.foreground,
                                marginBottom: 4,
                              }}
                            >
                              {tr("Recipient", "Destinataire", "المستلم")}:{" "}
                              <Text style={{ fontWeight: "800" }}>
                                {req.details?.fullName}
                              </Text>
                            </Text>
                            <Text
                              style={{ fontSize: 12, color: colors.foreground }}
                            >
                              {tr("Address", "Adresse", "العنوان")}:{" "}
                              <Text style={{ fontWeight: "700" }}>
                                {req.details?.address},{" "}
                                {req.details?.postalCode} {req.details?.city}
                              </Text>
                            </Text>
                          </View>
                        )}
                        <View style={{ flexDirection: "row", gap: 10 }}>
                          <TouchableOpacity
                            onPress={() => handleRejectWithdrawal(req.id)}
                            style={{
                              flex: 1,
                              paddingVertical: 12,
                              borderRadius: 12,
                              alignItems: "center",
                              borderWidth: 1,
                              borderColor: "#EF4444",
                            }}
                          >
                            <Text
                              style={{ color: "#EF4444", fontWeight: "800" }}
                            >
                              {tr("REJECT", "REJETER", "رفض")}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleApproveWithdrawal(req.id)}
                            style={{
                              flex: 1.5,
                              paddingVertical: 12,
                              borderRadius: 12,
                              alignItems: "center",
                              backgroundColor: "#10B981",
                            }}
                          >
                            <Text style={{ color: "#FFF", fontWeight: "800" }}>
                              {tr("APPROVE", "APPROUVER", "قبول")}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                )
              ) : adminPanelTab === "bonuses" ? (
                <View style={{ padding: 12 }}>
                  {/* First Recharge Bonus */}
                  <View
                    style={{
                      marginBottom: 20,
                      padding: 16,
                      borderRadius: 18,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "#F9FAFB",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <View>
                        <Text
                          style={{
                            fontWeight: "800",
                            fontSize: 16,
                            color: colors.foreground,
                          }}
                        >
                          {tr(
                            "First Recharge Bonus",
                            "Bonus premier recharge",
                            "مكافأة أول شحن",
                          )}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>
                          {tr(
                            "Extra coins for new users",
                            "Pièces en plus pour nouveaux users",
                            "عملات زيادة للمستخدمين الجدد",
                          )}
                        </Text>
                      </View>
                      <Switch
                        value={bonusSettings?.firstRecharge?.enabled}
                        onValueChange={(val) =>
                          setBonusSettings({
                            ...bonusSettings,
                            firstRecharge: {
                              ...bonusSettings.firstRecharge,
                              enabled: val,
                            },
                          })
                        }
                      />
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.textMuted,
                            marginBottom: 4,
                          }}
                        >
                          {tr("Bonus %", "Bonus %", "نسبة المكافأة")}
                        </Text>
                        <TextInput
                          style={{
                            height: 44,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: colors.border,
                            paddingHorizontal: 12,
                            color: colors.foreground,
                          }}
                          keyboardType="numeric"
                          value={(
                            bonusSettings?.firstRecharge?.bonus ?? 0
                          ).toString()}
                          onChangeText={(txt) =>
                            setBonusSettings({
                              ...bonusSettings,
                              firstRecharge: {
                                ...bonusSettings.firstRecharge,
                                bonus: Number(txt),
                              },
                            })
                          }
                        />
                      </View>
                    </View>
                  </View>

                  {/* General Bonus */}
                  <View
                    style={{
                      marginBottom: 20,
                      padding: 16,
                      borderRadius: 18,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "#F9FAFB",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <View>
                        <Text
                          style={{
                            fontWeight: "800",
                            fontSize: 16,
                            color: colors.foreground,
                          }}
                        >
                          {tr(
                            "General Event Bonus",
                            "Bonus évènement général",
                            "مكافأة عامة",
                          )}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>
                          {tr(
                            "Extra coins for all users",
                            "Pièces en plus pour tous",
                            "عملات زيادة للكل",
                          )}
                        </Text>
                      </View>
                      <Switch
                        value={bonusSettings?.extraBonus?.enabled}
                        onValueChange={(val) =>
                          setBonusSettings({
                            ...bonusSettings,
                            extraBonus: {
                              ...bonusSettings.extraBonus,
                              enabled: val,
                            },
                          })
                        }
                      />
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.textMuted,
                            marginBottom: 4,
                          }}
                        >
                          {tr("Bonus %", "Bonus %", "نسبة المكافأة")}
                        </Text>
                        <TextInput
                          style={{
                            height: 44,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: colors.border,
                            paddingHorizontal: 12,
                            color: colors.foreground,
                          }}
                          keyboardType="numeric"
                          value={(
                            bonusSettings?.extraBonus?.bonus ?? 0
                          ).toString()}
                          onChangeText={(txt) =>
                            setBonusSettings({
                              ...bonusSettings,
                              extraBonus: {
                                ...bonusSettings.extraBonus,
                                bonus: Number(txt),
                              },
                            })
                          }
                        />
                      </View>
                    </View>
                  </View>

                  {/* Crypto Bonus */}
                  <View
                    style={{
                      marginBottom: 20,
                      padding: 16,
                      borderRadius: 18,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "#F9FAFB",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <View>
                        <Text
                          style={{
                            fontWeight: "800",
                            fontSize: 16,
                            color: colors.foreground,
                          }}
                        >
                          {tr(
                            "Crypto Payment Bonus",
                            "Bonus Paiement Crypto",
                            "مكافأة الدفع بالكريبتو",
                          )}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>
                          {tr(
                            "Extra coins for Crypto recharges",
                            "Pièces en plus pour recharge Crypto",
                            "عملات زيادة كي تشحن بالكريبتو",
                          )}
                        </Text>
                      </View>
                      <Switch
                        value={bonusSettings?.cryptoBonus?.enabled}
                        onValueChange={(val) =>
                          setBonusSettings({
                            ...bonusSettings,
                            cryptoBonus: {
                              ...bonusSettings.cryptoBonus,
                              enabled: val,
                            },
                          })
                        }
                      />
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.textMuted,
                            marginBottom: 4,
                          }}
                        >
                          {tr("Bonus %", "Bonus %", "نسبة المكافأة")}
                        </Text>
                        <TextInput
                          style={{
                            height: 44,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: colors.border,
                            paddingHorizontal: 12,
                            color: colors.foreground,
                          }}
                          keyboardType="numeric"
                          value={(
                            bonusSettings?.cryptoBonus?.bonus ?? 0
                          ).toString()}
                          onChangeText={(txt) =>
                            setBonusSettings({
                              ...bonusSettings,
                              cryptoBonus: {
                                ...bonusSettings.cryptoBonus,
                                bonus: Number(txt),
                              },
                            })
                          }
                        />
                      </View>
                    </View>
                  </View>

                  {/* Bulk Bonus */}
                  <View
                    style={{
                      marginBottom: 20,
                      padding: 16,
                      borderRadius: 18,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "#F9FAFB",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <View>
                        <Text
                          style={{
                            fontWeight: "800",
                            fontSize: 16,
                            color: colors.foreground,
                          }}
                        >
                          {tr(
                            "Bulk Purchase Bonus",
                            "Bonus Achat en Gros",
                            "مكافأة الشراء بالجملة",
                          )}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>
                          {tr(
                            "Coins for large recharges",
                            "Pièces pour grosses recharges",
                            "عملات للشحن الكبير",
                          )}
                        </Text>
                      </View>
                      <Switch
                        value={bonusSettings?.bulkBonus?.enabled}
                        onValueChange={(val) =>
                          setBonusSettings({
                            ...bonusSettings,
                            bulkBonus: {
                              ...bonusSettings.bulkBonus,
                              enabled: val,
                            },
                          })
                        }
                      />
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.textMuted,
                            marginBottom: 4,
                          }}
                        >
                          {tr("Threshold (DT)", "Seuil (DT)", "العتبة (دت)")}
                        </Text>
                        <TextInput
                          style={{
                            height: 44,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: colors.border,
                            paddingHorizontal: 12,
                            color: colors.foreground,
                          }}
                          keyboardType="numeric"
                          value={(
                            bonusSettings?.bulkBonus?.threshold ?? 0
                          ).toString()}
                          onChangeText={(txt) =>
                            setBonusSettings({
                              ...bonusSettings,
                              bulkBonus: {
                                ...bonusSettings.bulkBonus,
                                threshold: Number(txt),
                              },
                            })
                          }
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.textMuted,
                            marginBottom: 4,
                          }}
                        >
                          {tr("Bonus %", "Bonus %", "نسبة المكافأة")}
                        </Text>
                        <TextInput
                          style={{
                            height: 44,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: colors.border,
                            paddingHorizontal: 12,
                            color: colors.foreground,
                          }}
                          keyboardType="numeric"
                          value={(
                            bonusSettings?.bulkBonus?.bonus ?? 0
                          ).toString()}
                          onChangeText={(txt) =>
                            setBonusSettings({
                              ...bonusSettings,
                              bulkBonus: {
                                ...bonusSettings.bulkBonus,
                                bonus: Number(txt),
                              },
                            })
                          }
                        />
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => saveBonusSettings(bonusSettings)}
                    disabled={savingBonus}
                    style={{
                      backgroundColor: "#EF4444",
                      height: 50,
                      borderRadius: 15,
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 10,
                    }}
                  >
                    {savingBonus ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text
                        style={{
                          color: "#FFF",
                          fontWeight: "900",
                          fontSize: 16,
                        }}
                      >
                        {tr("SAVE CHANGES", "ENREGISTRER", "حفظ التغييرات")}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Exchange Modal */}
      <Modal
        visible={showExchangeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExchangeModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}>
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowExchangeModal(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFF",
                maxHeight: "95%",
                minHeight: 750,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {tr("Exchange Assets", "Échanger des Actifs", "تبديل الرصيد")}
              </Text>
              <TouchableOpacity onPress={() => setShowExchangeModal(false)}>
                <X size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 30,
                }}
              >
                <View style={styles.exchangeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.exchangeTypeBtn,
                      exchangeType === "diamondsToCoins" && {
                        backgroundColor: "#8B5CF6",
                        borderColor: "#8B5CF6",
                      },
                    ]}
                    onPress={() => setExchangeType("diamondsToCoins")}
                  >
                    <Gem
                      size={18}
                      color={
                        exchangeType === "diamondsToCoins" ? "#FFF" : "#8B5CF6"
                      }
                      fill={
                        exchangeType === "diamondsToCoins"
                          ? "#FFF"
                          : "transparent"
                      }
                    />
                    <ArrowRight
                      size={12}
                      color={
                        exchangeType === "diamondsToCoins"
                          ? "#FFF"
                          : colors.textMuted
                      }
                      style={{ marginHorizontal: 4 }}
                    />
                    <Coins
                      size={18}
                      color={
                        exchangeType === "diamondsToCoins" ? "#FFF" : "#F59E0B"
                      }
                      fill={
                        exchangeType === "diamondsToCoins"
                          ? "#FFF"
                          : "transparent"
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.exchangeTypeBtn,
                      exchangeType === "coinsToDiamonds" && {
                        backgroundColor: "#F59E0B",
                        borderColor: "#F59E0B",
                      },
                    ]}
                    onPress={() => setExchangeType("coinsToDiamonds")}
                  >
                    <Coins
                      size={18}
                      color={
                        exchangeType === "coinsToDiamonds" ? "#FFF" : "#F59E0B"
                      }
                      fill={
                        exchangeType === "coinsToDiamonds"
                          ? "#FFF"
                          : "transparent"
                      }
                    />
                    <ArrowRight
                      size={12}
                      color={
                        exchangeType === "coinsToDiamonds"
                          ? "#FFF"
                          : colors.textMuted
                      }
                      style={{ marginHorizontal: 4 }}
                    />
                    <Gem
                      size={18}
                      color={
                        exchangeType === "coinsToDiamonds" ? "#FFF" : "#8B5CF6"
                      }
                      fill={
                        exchangeType === "coinsToDiamonds"
                          ? "#FFF"
                          : "transparent"
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/* Balance Card in Modal */}
                <View style={{ marginBottom: 24 }}>
                  <LinearGradient
                    colors={
                      exchangeType === "coinsToDiamonds"
                        ? ["#F59E0B", "#D97706"]
                        : ["#8B5CF6", "#7C3AED"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.balanceCard, { height: 100, padding: 16 }]}
                  >
                    <View>
                      <Text
                        style={[
                          styles.balanceLabel,
                          { fontSize: 12, marginBottom: 4 },
                        ]}
                      >
                        {exchangeType === "diamondsToCoins"
                          ? tr(
                              "Diamond Balance",
                              "Solde de Diamants",
                              "رصيد الجواهر",
                            )
                          : tr(
                              "Coin Balance",
                              "Solde de Pièces",
                              "رصيد العملات",
                            )}
                      </Text>
                      <View style={styles.balanceRow}>
                        {exchangeType === "diamondsToCoins" ? (
                          <Gem
                            size={22}
                            color="#FFF"
                            style={{ marginRight: 6 }}
                          />
                        ) : (
                          <Coins
                            size={22}
                            color="#FFF"
                            style={{ marginRight: 6 }}
                          />
                        )}
                        <Text style={[styles.balanceAmount, { fontSize: 28 }]}>
                          {exchangeType === "diamondsToCoins"
                            ? diamondBalance.toLocaleString()
                            : coinBalance.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.walletIconContainer,
                        { width: 44, height: 44, borderRadius: 22 },
                      ]}
                    >
                      <Wallet size={24} color="rgba(255,255,255,0.8)" />
                    </View>
                  </LinearGradient>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={[styles.inputLabel, { color: colors.textMuted }]}
                  >
                    {exchangeType === "diamondsToCoins"
                      ? tr(
                          "Amount of Diamonds to Send",
                          "Montant de Diamants à Envoyer",
                          "قداش من جوهرة تحب تبعث",
                        )
                      : tr(
                          "Amount of Coins to Send",
                          "Montant de Pièces à Envoyer",
                          "قداش من عملة تحب تبعث",
                        )}
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.05)",
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.modalInput, { color: colors.foreground }]}
                      keyboardType="numeric"
                      value={exchangeAmount}
                      onChangeText={setExchangeAmount}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setExchangeAmount(
                          (exchangeType === "diamondsToCoins"
                            ? diamondBalance
                            : coinBalance
                          ).toString(),
                        )
                      }
                    >
                      <Text
                        style={{
                          color: colors.info,
                          fontWeight: "bold",
                          fontSize: 13,
                        }}
                      >
                        MAX
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={[
                    styles.exchangeReview,
                    { padding: 15, marginBottom: 15 },
                  ]}
                >
                  <View style={{ alignItems: "center", flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.textMuted,
                        marginBottom: 4,
                      }}
                    >
                      {tr("From", "De", "مـ")}
                    </Text>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: colors.foreground,
                        }}
                      >
                        {exchangeAmount || "0"}
                      </Text>
                      {exchangeType === "diamondsToCoins" ? (
                        <Gem
                          size={14}
                          color="#8B5CF6"
                          style={{ marginLeft: 4 }}
                        />
                      ) : (
                        <Coins
                          size={14}
                          color="#F59E0B"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                  </View>

                  <ArrowRight size={18} color={colors.textMuted} />

                  <View style={{ alignItems: "center", flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.textMuted,
                        marginBottom: 4,
                      }}
                    >
                      {tr("You Get", "Vous recevez", "باش تاخو")}
                    </Text>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: "#10B981",
                        }}
                      >
                        {exchangeType === "diamondsToCoins"
                          ? parseInt(exchangeAmount) || 0
                          : Math.ceil((parseInt(exchangeAmount) || 0) * 0.7)}
                      </Text>
                      {exchangeType === "diamondsToCoins" ? (
                        <Coins
                          size={14}
                          color="#F59E0B"
                          style={{ marginLeft: 4 }}
                        />
                      ) : (
                        <Gem
                          size={14}
                          color="#8B5CF6"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                  </View>
                </View>

                {exchangeType === "coinsToDiamonds" && (
                  <View
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.08)",
                      padding: 10,
                      borderRadius: 12,
                      marginBottom: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: "#EF4444",
                        fontSize: 10,
                        textAlign: "center",
                        lineHeight: 14,
                      }}
                    >
                      ⚠️{" "}
                      {tr(
                        "30% conversion fee applied when converting Coins to Diamonds.",
                        "Frais de conversion de 30% appliqués lors de la conversion de pièces en diamants.",
                        "فما 30% معاليم كي تبدل العملات لجوهرات.",
                      )}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    {
                      backgroundColor:
                        exchangeType === "diamondsToCoins"
                          ? "#8B5CF6"
                          : "#F59E0B",
                      opacity: loading || !exchangeAmount ? 0.5 : 1,
                      height: 50,
                    },
                  ]}
                  onPress={handleConfirmExchange}
                  disabled={loading || !exchangeAmount}
                >
                  <Text style={[styles.confirmBtnText, { fontSize: 15 }]}>
                    {loading
                      ? tr("Processing...", "Traitement...", "يصب...")
                      : tr(
                          "Confirm Exchange",
                          "Confirmer l'Échange",
                          "أكد التبديل",
                        )}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        visible={showTransferModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}>
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowTransferModal(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFF",
                maxHeight: "95%",
                minHeight: 750,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {tr("Transfer Balance", "Transférer Solde", "حول رصيدك")}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowTransferModal(false);
                  setSelectedUserForTransfer(null);
                  setTransferSearchQuery("");
                  setTransferSearchResults([]);
                  setTransferAmount("");
                  setShowTargetProfile(false);
                }}
              >
                <X size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {!selectedUserForTransfer ? (
              <>
                <View
                  style={[
                    styles.tabContainer,
                    {
                      marginHorizontal: 20,
                      marginTop: 14,
                      padding: 3,
                      height: 44,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.05)",
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      { height: "100%" },
                      transferModalTab === "search" && {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "#FFF",
                      },
                    ]}
                    onPress={() => setTransferModalTab("search")}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        {
                          fontSize: 13,
                          color:
                            transferModalTab === "search"
                              ? colors.foreground
                              : isDark
                                ? "#BBB"
                                : "#666",
                        },
                      ]}
                    >
                      {tr("Search", "Chercher", "لوج")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      { height: "100%" },
                      transferModalTab === "friends" && {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "#FFF",
                      },
                    ]}
                    onPress={() => setTransferModalTab("friends")}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        {
                          fontSize: 13,
                          color:
                            transferModalTab === "friends"
                              ? colors.foreground
                              : isDark
                                ? "#BBB"
                                : "#666",
                        },
                      ]}
                    >
                      {tr("Friends", "Amis", "الأصحاب")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      { height: "100%" },
                      transferModalTab === "requests" && {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "#FFF",
                      },
                    ]}
                    onPress={() => setTransferModalTab("requests")}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        {
                          fontSize: 13,
                          color:
                            transferModalTab === "requests"
                              ? colors.foreground
                              : isDark
                                ? "#BBB"
                                : "#666",
                        },
                      ]}
                    >
                      {tr("Requests", "Demandes", "الطلبات")}
                    </Text>
                    {incomingRequests.length > 0 && (
                      <View
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 12,
                          backgroundColor: "#EF4444",
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          borderWidth: 1.5,
                          borderColor: isDark ? "#1C1C1E" : "#FFF",
                        }}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {transferModalTab === "search" ? (
                  <>
                    <View
                      style={[
                        styles.searchContainer,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                          marginTop: 15,
                          marginHorizontal: 20,
                        },
                      ]}
                    >
                      <Search size={20} color={colors.textMuted} />
                      <TextInput
                        style={[
                          styles.searchInput,
                          { color: colors.foreground },
                        ]}
                        placeholder={tr(
                          "Search user by name...",
                          "Rechercher par nom...",
                          "لوج بالاسم...",
                        )}
                        placeholderTextColor={colors.textMuted}
                        value={transferSearchQuery}
                        onChangeText={handleSearchUsers}
                      />
                      {isSearching && (
                        <ActivityIndicator size="small" color={colors.info} />
                      )}
                    </View>

                    <ScrollView
                      style={{ marginTop: 10, paddingHorizontal: 20 }}
                    >
                      {transferSearchResults.length === 0 &&
                      transferSearchQuery.length >= 2 &&
                      !isSearching ? (
                        <Text
                          style={{
                            textAlign: "center",
                            color: colors.textMuted,
                            marginTop: 20,
                          }}
                        >
                          {tr(
                            "No users found",
                            "Aucun utilisateur trouvé",
                            "ما لقينا حد",
                          )}
                        </Text>
                      ) : (
                        transferSearchResults.map((u) => (
                          <TouchableOpacity
                            key={u.uid}
                            style={[
                              styles.userListItem,
                              {
                                borderBottomColor: colors.border,
                                paddingVertical: 16,
                              },
                            ]}
                            onPress={() => setSelectedUserForTransfer(u)}
                          >
                            <View style={styles.userListItemLeft}>
                              <View
                                style={[
                                  styles.userAvatar,
                                  { backgroundColor: isDark ? "#333" : "#EEE" },
                                ]}
                              >
                                {u.avatarUrl ? (
                                  <Image
                                    source={{ uri: u.avatarUrl }}
                                    style={styles.userAvatarImg}
                                  />
                                ) : (
                                  <User size={20} color={colors.textMuted} />
                                )}
                              </View>
                              <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text
                                  style={[
                                    styles.userNameText,
                                    { color: colors.foreground, fontSize: 16 },
                                  ]}
                                >
                                  {getName(u.fullName, language)}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: colors.textMuted,
                                    marginTop: 2,
                                  }}
                                >
                                  {u.email}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 10,
                                    color: colors.textMuted,
                                    marginTop: 4,
                                    opacity: 0.7,
                                  }}
                                >
                                  ID: {u.uid}
                                </Text>
                              </View>
                            </View>
                            <ChevronRight size={18} color={colors.textMuted} />
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </>
                ) : transferModalTab === "friends" ? (
                  <ScrollView style={{ marginTop: 15 }}>
                    {friendsList.length === 0 ? (
                      <View style={{ alignItems: "center", marginTop: 40 }}>
                        <Users
                          size={48}
                          color={colors.textMuted}
                          strokeWidth={1}
                          style={{ marginBottom: 12 }}
                        />
                        <Text style={{ color: colors.textMuted }}>
                          {tr(
                            "No friends yet",
                            "Aucun ami pour le moment",
                            "ما عندكش أصحاب توا",
                          )}
                        </Text>
                      </View>
                    ) : (
                      friendsList.map((u) => (
                        <TouchableOpacity
                          key={u.uid}
                          style={[
                            styles.userListItem,
                            { borderBottomColor: colors.border },
                          ]}
                          onPress={() => setSelectedUserForTransfer(u)}
                        >
                          <View style={styles.userListItemLeft}>
                            <View
                              style={[
                                styles.userAvatar,
                                { backgroundColor: isDark ? "#333" : "#EEE" },
                              ]}
                            >
                              {u.avatarUrl ? (
                                <Image
                                  source={{ uri: u.avatarUrl }}
                                  style={styles.userAvatarImg}
                                />
                              ) : (
                                <User size={20} color={colors.textMuted} />
                              )}
                            </View>
                            <View style={{ marginLeft: 12 }}>
                              <Text
                                style={[
                                  styles.userNameText,
                                  { color: colors.foreground },
                                ]}
                              >
                                {getName(u.fullName, language)}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: colors.textMuted,
                                }}
                              >
                                {u.email}
                              </Text>
                            </View>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <TouchableOpacity
                              onPress={() =>
                                handleDeleteFriend(
                                  u.uid,
                                  getName(u.fullName, language),
                                )
                              }
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Trash size={16} color="#EF4444" />
                            </TouchableOpacity>
                            <ChevronRight size={18} color={colors.textMuted} />
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                ) : (
                  <ScrollView style={{ marginTop: 15 }}>
                    {incomingRequests.length === 0 ? (
                      <View style={{ alignItems: "center", marginTop: 40 }}>
                        <User
                          size={48}
                          color={colors.textMuted}
                          strokeWidth={1}
                          style={{ marginBottom: 12 }}
                        />
                        <Text style={{ color: colors.textMuted }}>
                          {tr(
                            "No pending requests",
                            "Aucune demande en attente",
                            "ما فمة حتى طلب",
                          )}
                        </Text>
                      </View>
                    ) : (
                      incomingRequests.map((req) => (
                        <View
                          key={req.id}
                          style={[
                            styles.userListItem,
                            { borderBottomColor: colors.border },
                          ]}
                        >
                          <View style={styles.userListItemLeft}>
                            <View
                              style={[
                                styles.userAvatar,
                                { backgroundColor: isDark ? "#333" : "#EEE" },
                              ]}
                            >
                              {req.senderAvatar ? (
                                <Image
                                  source={{ uri: req.senderAvatar }}
                                  style={styles.userAvatarImg}
                                />
                              ) : (
                                <User size={20} color={colors.textMuted} />
                              )}
                            </View>
                            <View style={{ marginLeft: 12 }}>
                              <Text
                                style={[
                                  styles.userNameText,
                                  { color: colors.foreground },
                                ]}
                              >
                                {req.senderName}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: colors.textMuted,
                                }}
                              >
                                {tr(
                                  "Wants to be your friend",
                                  "Veut être votre ami",
                                  "يحب يولي صاحبك",
                                )}
                              </Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <TouchableOpacity
                              onPress={() => handleRejectFriendRequest(req)}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <X size={16} color="#EF4444" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleAcceptFriendRequest(req)}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: "rgba(16, 185, 129, 0.1)",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Check size={16} color="#10B981" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>
                )}
              </>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.selectedUserCard}>
                  <View
                    style={[
                      styles.userAvatarLarge,
                      {
                        backgroundColor: isDark ? "#333" : "#EEE",
                        marginBottom: 15,
                      },
                    ]}
                  >
                    {selectedUserForTransfer.avatarUrl ? (
                      <Image
                        source={{ uri: selectedUserForTransfer.avatarUrl }}
                        style={styles.userAvatarLargeImg}
                      />
                    ) : (
                      <User size={40} color={colors.textMuted} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.selectedUserName,
                      { color: colors.foreground },
                    ]}
                  >
                    {getName(selectedUserForTransfer.fullName, language)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textMuted,
                      marginBottom: 20,
                    }}
                  >
                    {selectedUserForTransfer.email}
                  </Text>

                  <View
                    style={{ flexDirection: "row", gap: 10, marginBottom: 30 }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.profileActionBtn,
                        {
                          backgroundColor: isDark
                            ? "rgba(59, 130, 246, 0.1)"
                            : "rgba(59, 130, 246, 0.05)",
                        },
                      ]}
                      onPress={() => {
                        if (onNavigate) {
                          onNavigate("PublicProfile", selectedUserForTransfer);
                          setShowTransferModal(false);
                        } else {
                          setShowTargetProfile(!showTargetProfile);
                        }
                      }}
                    >
                      <User size={18} color="#3B82F6" />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: "#3B82F6",
                          marginLeft: 8,
                        }}
                      >
                        {tr("View Profile", "Voir Profil", "شوف البروفايل")}
                      </Text>
                    </TouchableOpacity>

                    {profileData?.friends?.includes(
                      selectedUserForTransfer.uid,
                    ) ? (
                      <TouchableOpacity
                        style={[
                          styles.profileActionBtn,
                          { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                        ]}
                        onPress={() =>
                          handleDeleteFriend(
                            selectedUserForTransfer.uid,
                            getName(selectedUserForTransfer.fullName, language),
                          )
                        }
                      >
                        <Trash size={18} color="#EF4444" />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: "#EF4444",
                            marginLeft: 8,
                          }}
                        >
                          {tr("Unfriend", "Supprimer", "نحي الصاحب")}
                        </Text>
                      </TouchableOpacity>
                    ) : sentRequests.some(
                        (r) => r.receiverId === selectedUserForTransfer.uid,
                      ) ? (
                      <View
                        style={[
                          styles.profileActionBtn,
                          { backgroundColor: "rgba(100, 100, 100, 0.1)" },
                        ]}
                      >
                        <RefreshCw size={18} color={colors.textMuted} />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: colors.textMuted,
                            marginLeft: 8,
                          }}
                        >
                          {tr("Requested", "Demandé", "بعثتلو طلب")}
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.profileActionBtn,
                          { backgroundColor: "rgba(245, 158, 11, 0.1)" },
                        ]}
                        onPress={() =>
                          handleSendFriendRequest(selectedUserForTransfer)
                        }
                      >
                        <Users size={18} color="#F59E0B" />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: "#F59E0B",
                            marginLeft: 8,
                          }}
                        >
                          {tr("Add Friend", "Ajouter Ami", "زيد صاحب")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {showTargetProfile && (
                    <Animatable.View
                      animation="fadeIn"
                      style={[
                        styles.profileDetailsBox,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.03)"
                            : "rgba(0,0,0,0.03)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.profileDetailsTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        {tr("User Info", "Infos Utilisateur", "معلومات الحريف")}
                      </Text>
                      <View style={styles.profileDetailRow}>
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>
                          {tr("Member Since", "Membre منذ", "عضو مـ")}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: colors.foreground,
                          }}
                        >
                          {selectedUserForTransfer.createdAt
                            ? new Date(
                                selectedUserForTransfer.createdAt.seconds *
                                  1000,
                              ).toLocaleDateString()
                            : "---"}
                        </Text>
                      </View>
                      {selectedUserForTransfer.bio && (
                        <View style={{ marginTop: 10 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.textMuted,
                              marginBottom: 4,
                            }}
                          >
                            Bio
                          </Text>
                          <Text
                            style={{ fontSize: 12, color: colors.foreground }}
                          >
                            {selectedUserForTransfer.bio}
                          </Text>
                        </View>
                      )}
                    </Animatable.View>
                  )}

                  <View style={{ width: "100%", marginTop: 20 }}>
                    <View style={styles.exchangeSelector}>
                      <TouchableOpacity
                        style={[
                          styles.exchangeTypeBtn,
                          transferType === "coins" && {
                            backgroundColor: "#F59E0B",
                            borderColor: "#F59E0B",
                          },
                        ]}
                        onPress={() => setTransferType("coins")}
                      >
                        <Coins
                          size={18}
                          color={transferType === "coins" ? "#FFF" : "#F59E0B"}
                          fill={
                            transferType === "coins" ? "#FFF" : "transparent"
                          }
                        />
                        <Text
                          style={{
                            marginLeft: 8,
                            fontSize: 12,
                            fontWeight: "700",
                            color:
                              transferType === "coins" ? "#FFF" : "#F59E0B",
                          }}
                        >
                          {tr("Coins", "Pièces", "عملات")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.exchangeTypeBtn,
                          transferType === "diamonds" && {
                            backgroundColor: "#8B5CF6",
                            borderColor: "#8B5CF6",
                          },
                        ]}
                        onPress={() => setTransferType("diamonds")}
                      >
                        <Gem
                          size={18}
                          color={
                            transferType === "diamonds" ? "#FFF" : "#8B5CF6"
                          }
                          fill={
                            transferType === "diamonds" ? "#FFF" : "transparent"
                          }
                        />
                        <Text
                          style={{
                            marginLeft: 8,
                            fontSize: 12,
                            fontWeight: "700",
                            color:
                              transferType === "diamonds" ? "#FFF" : "#8B5CF6",
                          }}
                        >
                          {tr("Diamonds", "Diamants", "جواهر")}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text
                      style={[
                        styles.inputLabel,
                        { color: colors.textMuted, marginTop: 25 },
                      ]}
                    >
                      {tr(
                        "Amount to Transfer",
                        "Montant à Transférer",
                        "قداش باش تحول",
                      )}
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                          marginTop: 8,
                        },
                      ]}
                    >
                      <TextInput
                        style={[
                          styles.modalInput,
                          { color: colors.foreground },
                        ]}
                        keyboardType="numeric"
                        value={transferAmount}
                        onChangeText={setTransferAmount}
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setTransferAmount(
                            (transferType === "coins"
                              ? coinBalance
                              : diamondBalance
                            ).toString(),
                          )
                        }
                      >
                        <Text
                          style={{
                            color: colors.info,
                            fontWeight: "bold",
                            fontSize: 13,
                          }}
                        >
                          MAX
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.confirmBtn,
                        {
                          backgroundColor: colors.info,
                          opacity:
                            loading ||
                            !transferAmount ||
                            !profileData?.friends?.includes(
                              selectedUserForTransfer.uid,
                            )
                              ? 0.5
                              : 1,
                          marginTop: 30,
                          height: 56,
                        },
                      ]}
                      onPress={handleTransfer}
                      disabled={
                        loading ||
                        !transferAmount ||
                        !profileData?.friends?.includes(
                          selectedUserForTransfer.uid,
                        )
                      }
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Send
                              size={18}
                              color="#FFF"
                              style={{ marginRight: 10 }}
                            />
                            <Text
                              style={[
                                styles.confirmBtnText,
                                {
                                  color:
                                    loading ||
                                    !transferAmount ||
                                    !profileData?.friends?.includes(
                                      selectedUserForTransfer.uid,
                                    )
                                      ? colors.textMuted
                                      : "#FFF",
                                },
                              ]}
                            >
                              {!profileData?.friends?.includes(
                                selectedUserForTransfer.uid,
                              )
                                ? tr(
                                    "Friends Only",
                                    "Amis Uniquement",
                                    "للصحاب بركة",
                                  )
                                : tr(
                                    "Confirm Transfer",
                                    "Confirmer Transfert",
                                    "أكد التحويل",
                                  )}
                            </Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ alignSelf: "center", marginTop: 20 }}
                      onPress={() => setSelectedUserForTransfer(null)}
                    >
                      <Text
                        style={{
                          color: colors.textMuted,
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        {tr(
                          "Back to Search",
                          "Retour à la recherche",
                          "ارجع فركس",
                        )}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal
        visible={withdrawModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
          }}
        >
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              setWithdrawModalVisible(false);
              setWithdrawStep("method");
            }}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: isDark ? "#1C1C1E" : "#FFF",
                  maxHeight: "95%",
                  paddingBottom: insets.bottom + 5,
                  marginTop: 70,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {withdrawStep === "details" && (
                    <TouchableOpacity
                      onPress={() => setWithdrawStep("method")}
                      style={{ marginRight: 15 }}
                    >
                      <ArrowLeft size={24} color={colors.foreground} />
                    </TouchableOpacity>
                  )}
                  <Text
                    style={[styles.modalTitle, { color: colors.foreground }]}
                  >
                    {tr("Withdraw Funds", "Retirer des fonds", "اجبد فلوسك")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setWithdrawModalVisible(false);
                    setWithdrawStep("method");
                  }}
                >
                  <X size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ paddingHorizontal: 24, paddingVertical: 20 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
              >
                {withdrawStep === "method" ? (
                  <>
                    {/* Balance Summary Card */}
                    <View
                      style={{
                        backgroundColor: isDark
                          ? "rgba(139,92,246,0.12)"
                          : "rgba(139,92,246,0.08)",
                        borderRadius: 18,
                        padding: 16,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: "rgba(139,92,246,0.2)",
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
                          backgroundColor: "rgba(139,92,246,0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Gem size={22} color="#8B5CF6" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: colors.textMuted,
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {tr(
                            "Available to Withdraw",
                            "Disponible au retrait",
                            "يمكن سحبه",
                          )}
                        </Text>
                        <Text
                          style={{
                            color: colors.foreground,
                            fontSize: 20,
                            fontWeight: "900",
                            marginTop: 2,
                          }}
                        >
                          {(withdrawMethod === "stripe" || withdrawMethod === "crypto") 
                            ? (diamondBalance * DIAMOND_TO_EUR_RATE).toFixed(2)
                            : (diamondBalance * DIAMOND_TO_TND_RATE).toFixed(2)}{" "}
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              color: colors.textMuted,
                            }}
                          >
                            {(withdrawMethod === "stripe" || withdrawMethod === "crypto") ? "EUR" : "TND"}
                          </Text>
                        </Text>
                        <Text
                          style={{
                            color: "#8B5CF6",
                            fontSize: 11,
                            fontWeight: "700",
                            marginTop: 2,
                          }}
                        >
                          = {diamondBalance.toLocaleString()} Diamonds
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.sectionTitle,
                        {
                          color: colors.foreground,
                          fontSize: 14,
                          marginBottom: 10,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {tr(
                        "Amount to withdraw",
                        "Choisir le montant à retirer",
                        "قداش تحب تجبد",
                      )}
                    </Text>

                    <View
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "#F3F4F6",
                          marginBottom: 6,
                          borderWidth: 1,
                          borderColor: isDark
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.08)",
                          borderRadius: 14,
                        },
                      ]}
                    >
                      <TextInput
                        style={[
                          styles.modalInput,
                          {
                            color: colors.foreground,
                            fontSize: 20,
                            fontWeight: "800",
                          },
                        ]}
                        placeholder="0.00"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        value={withdrawAmount}
                        onChangeText={setWithdrawAmount}
                      />
                      <Text
                        style={{
                          fontWeight: "800",
                          color: colors.textMuted,
                          marginRight: 10,
                          fontSize: 13,
                        }}
                      >
                        {(withdrawMethod === "stripe" || withdrawMethod === "crypto") ? "EUR" : "TND"}
                      </Text>
                      <TouchableOpacity
                        style={{
                          backgroundColor: isDark ? "#FFFFFF" : "#111111",
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 10,
                          marginRight: 4,
                        }}
                        onPress={() => {
                          const isEUR =
                            withdrawMethod === "stripe" ||
                            withdrawMethod === "crypto";
                          setWithdrawAmount(
                            isEUR
                              ? (diamondBalance * DIAMOND_TO_EUR_RATE).toFixed(2)
                              : (diamondBalance * DIAMOND_TO_TND_RATE).toFixed(2),
                          );
                        }}
                      >
                        <Text
                          style={{
                            color: isDark ? "#000000" : "#FFFFFF",
                            fontWeight: "800",
                            fontSize: 12,
                          }}
                        >
                          MAX
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 11,
                        marginBottom:
                          withdrawMethod === "stripe" ||
                          withdrawMethod === "crypto"
                            ? 8
                            : 22,
                        paddingLeft: 4,
                      }}
                    >
                      {tr(
                        "Minimum withdrawal:",
                        "Retrait minimum :",
                        "الحد الأدنى:",
                      )}{" "}
                      <Text
                        style={{ fontWeight: "700", color: colors.foreground }}
                      >
                        {(withdrawMethod === "stripe" || withdrawMethod === "crypto") 
                          ? `${(50 * TND_TO_EUR_RATE).toFixed(2)} EUR`
                          : "50 TND"}
                      </Text>
                    </Text>

                    {(withdrawMethod === "stripe" ||
                      withdrawMethod === "crypto") && (
                      <View
                        style={{
                          backgroundColor: isDark
                            ? "rgba(16,185,129,0.1)"
                            : "rgba(16,185,129,0.06)",
                          padding: 10,
                          borderRadius: 10,
                          marginBottom: 20,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <TrendingUp size={16} color="#10B981" />
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#10B981",
                            fontWeight: "700",
                            flex: 1,
                          }}
                        >
                          {tr(
                            `Approximate value: ${(parseFloat(withdrawAmount || "0") * (withdrawMethod === "stripe" || withdrawMethod === "crypto" ? 3.4 : 1)).toFixed(2)} TND`,
                            `Valeur approximative : ${(parseFloat(withdrawAmount || "0") * (withdrawMethod === "stripe" || withdrawMethod === "crypto" ? 3.4 : 1)).toFixed(2)} TND`,
                            `بالتقريب تجيك: ${(parseFloat(withdrawAmount || "0") * (withdrawMethod === "stripe" || withdrawMethod === "crypto" ? 3.4 : 1)).toFixed(2)} دت`,
                          )}
                        </Text>
                      </View>
                    )}

                    <Text
                      style={[
                        styles.sectionTitle,
                        {
                          color: colors.foreground,
                          fontSize: 14,
                          marginBottom: 12,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {tr(
                        "Select withdrawal method",
                        "Choisir le mode de retrait",
                        "اختار كفاش تحب تجبد",
                      )}
                    </Text>

                    <View style={{ gap: 12 }}>
                      {[
                        {
                          id: "stripe",
                          name: tr("Stripe", "Stripe", "سترايب"),
                          icon: CreditCard,
                          color: "#6366F1",
                        },
                        {
                          id: "crypto",
                          name: tr("Crypto", "Crypto", "كريبتو"),
                          icon: Hexagon,
                          color: "#F59E0B",
                        },
                        {
                          id: "bank_transfer",
                          name: tr(
                            "Bank Transfer",
                            "Virement Bancaire",
                            "تحويل بنكي",
                          ),
                          icon: Landmark,
                          color: "#10B981",
                        },
                        {
                          id: "post_office",
                          name: tr("Post Office", "Bureau de Poste", "البريد"),
                          icon: Mail,
                          color: "#EF4444",
                        },
                      ].map((method) => (
                        <TouchableOpacity
                          key={method.id}
                          style={[
                            {
                              flexDirection: "row",
                              alignItems: "center",
                              backgroundColor:
                                withdrawMethod === method.id
                                  ? isDark
                                    ? `${method.color}20`
                                    : `${method.color}12`
                                  : isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "#F9FAFB",
                              padding: 16,
                              borderRadius: 16,
                              borderWidth: 1.5,
                              borderColor:
                                withdrawMethod === method.id
                                  ? method.color
                                  : isDark
                                    ? "rgba(255,255,255,0.08)"
                                    : "rgba(0,0,0,0.07)",
                            },
                          ]}
                          onPress={() => {
                            const wasEUR = withdrawMethod === "stripe" || withdrawMethod === "crypto";
                            const isNowEUR = method.id === "stripe" || method.id === "crypto";
                            
                            if (withdrawAmount && wasEUR !== isNowEUR) {
                              const amt = parseFloat(withdrawAmount);
                              if (!isNaN(amt)) {
                                if (isNowEUR) {
                                  // Convert TND to EUR
                                  setWithdrawAmount((amt / 3.4).toFixed(2));
                                } else {
                                  // Convert EUR to TND
                                  setWithdrawAmount((amt * 3.4).toFixed(2));
                                }
                              }
                            }
                            setWithdrawMethod(method.id as any);
                          }}
                        >
                          <View
                            style={[
                              styles.coinIconWrapper,
                              {
                                backgroundColor: `${method.color}20`,
                                marginBottom: 0,
                              },
                            ]}
                          >
                            <method.icon size={24} color={method.color} />
                          </View>
                          <View style={styles.transactionInfo}>
                            <Text
                              style={[
                                styles.transactionTitle,
                                { color: colors.foreground },
                              ]}
                            >
                              {method.name}
                            </Text>
                          </View>
                          {withdrawMethod === method.id && (
                            <Check size={20} color={method.color} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.confirmBtn,
                        {
                          backgroundColor: isDark ? "#FFFFFF" : "#111111",
                          opacity:
                            !withdrawAmount || parseFloat(withdrawAmount) < ((withdrawMethod === "stripe" || withdrawMethod === "crypto") ? (50 * TND_TO_EUR_RATE) : 50)
                              ? 0.4
                              : 1,
                          marginTop: 24,
                        },
                      ]}
                      onPress={() => setWithdrawStep("details")}
                      disabled={
                        !withdrawAmount || parseFloat(withdrawAmount) < ((withdrawMethod === "stripe" || withdrawMethod === "crypto") ? (50 * TND_TO_EUR_RATE) : 50)
                      }
                    >
                      <Text
                        style={[
                          styles.confirmBtnText,
                          { color: isDark ? "#000000" : "#FFFFFF" },
                        ]}
                      >
                        {tr("Next Step", "Étape suivante", "تعدى للي بعدو")}
                      </Text>
                    </TouchableOpacity>
                    {parseFloat(withdrawAmount) < 50 &&
                      withdrawAmount !== "" && (
                        <Text
                          style={{
                            color: "#EF4444",
                            fontSize: 12,
                            textAlign: "center",
                            marginTop: 10,
                          }}
                        >
                          {tr(
                            (withdrawMethod === "stripe" || withdrawMethod === "crypto")
                              ? `Minimum withdrawal is ${(50 * TND_TO_EUR_RATE).toFixed(2)} EUR`
                              : "Minimum withdrawal is 50 TND",
                            (withdrawMethod === "stripe" || withdrawMethod === "crypto")
                              ? `Retrait minimum : ${(50 * TND_TO_EUR_RATE).toFixed(2)} EUR`
                              : "Le retrait minimum est de 50 TND",
                            (withdrawMethod === "stripe" || withdrawMethod === "crypto")
                              ? `الحد الأدنى: ${(50 * TND_TO_EUR_RATE).toFixed(2)} يورو`
                              : "أقل مبلغ تجبدو هو 50 دت",
                          )}
                        </Text>
                      )}
                  </>
                ) : (
                  <>
                    <Text
                      style={[
                        styles.sectionTitle,
                        {
                          color: colors.foreground,
                          fontSize: 16,
                          marginBottom: 20,
                        },
                      ]}
                    >
                      {tr(
                        "Enter withdrawal details",
                        "Saisir les détails du retrait",
                        "حط المعلومات",
                      )}
                    </Text>

                    {withdrawMethod === "stripe" && (
                      <View style={{ gap: 15 }}>
                        <Text
                          style={[
                            styles.inputLabel,
                            { color: colors.textMuted },
                          ]}
                        >
                          {tr("Stripe Email", "Email Stripe", "إيميل سترايب")}
                        </Text>
                        <TextInput
                          style={[
                            styles.modalInput,
                            {
                              color: colors.foreground,
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "#F9FAFB",
                              padding: 15,
                              borderRadius: 12,
                              height: 54,
                            },
                          ]}
                          placeholder="email@example.com"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="email-address"
                          value={stripeEmail}
                          onChangeText={setStripeEmail}
                          autoCapitalize="none"
                        />
                      </View>
                    )}

                    {withdrawMethod === "crypto" && (
                      <View style={{ gap: 14 }}>
                        <Text
                          style={[
                            styles.inputLabel,
                            { color: colors.textMuted },
                          ]}
                        >
                          {tr(
                            "Select Network & Coin",
                            "Choisir le réseau et la pièce",
                            "اختار الشبكة والعملة",
                          )}
                        </Text>

                        {(
                          [
                            {
                              id: "USDT_TRC20",
                              label: "USDT (TRC-20)",
                              sub: "Tron Network · Fast & Low Fee",
                              color: "#22C55E",
                              symbol: "USDT",
                            },
                            {
                              id: "USDT_ERC20",
                              label: "USDT (ERC-20)",
                              sub: "Ethereum Network",
                              color: "#22C55E",
                              symbol: "USDT",
                            },
                            {
                              id: "BTC",
                              label: "Bitcoin (BTC)",
                              sub: "Bitcoin Network",
                              color: "#F59E0B",
                              symbol: "BTC",
                            },
                            {
                              id: "ETH",
                              label: "Ethereum (ETH)",
                              sub: "Ethereum Network",
                              color: "#6366F1",
                              symbol: "ETH",
                            },
                          ] as const
                        ).map((coin) => (
                          <TouchableOpacity
                            key={coin.id}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              backgroundColor:
                                cryptoCoin === coin.id
                                  ? isDark
                                    ? `${coin.color}20`
                                    : `${coin.color}15`
                                  : isDark
                                    ? "rgba(255,255,255,0.05)"
                                    : "#F9FAFB",
                              padding: 14,
                              borderRadius: 14,
                              borderWidth: 1.5,
                              borderColor:
                                cryptoCoin === coin.id
                                  ? coin.color
                                  : isDark
                                    ? "rgba(255,255,255,0.08)"
                                    : "rgba(0,0,0,0.07)",
                            }}
                            onPress={() => setCryptoCoin(coin.id)}
                          >
                            <View
                              style={[
                                styles.coinIconWrapper,
                                {
                                  backgroundColor: `${coin.color}20`,
                                  marginBottom: 0,
                                  width: 42,
                                  height: 42,
                                  borderRadius: 21,
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  fontWeight: "900",
                                  color: coin.color,
                                  fontSize: 10,
                                }}
                              >
                                {coin.symbol}
                              </Text>
                            </View>
                            <View style={styles.transactionInfo}>
                              <Text
                                style={[
                                  styles.transactionTitle,
                                  { color: colors.foreground, fontSize: 14 },
                                ]}
                              >
                                {coin.label}
                              </Text>
                              <Text
                                style={[
                                  styles.transactionDate,
                                  { color: colors.textMuted },
                                ]}
                              >
                                {coin.sub}
                              </Text>
                            </View>
                            {cryptoCoin === coin.id && (
                              <Check size={18} color={coin.color} />
                            )}
                          </TouchableOpacity>
                        ))}

                        <Text
                          style={[
                            styles.inputLabel,
                            { color: colors.textMuted, marginTop: 6 },
                          ]}
                        >
                          {tr(
                            "Wallet Address",
                            "Adresse du portefeuille",
                            "أدريسة المحفظة",
                          )}
                        </Text>
                        <TextInput
                          style={[
                            styles.modalInput,
                            {
                              color: colors.foreground,
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.08)"
                                : "#F9FAFB",
                              padding: 15,
                              borderRadius: 12,
                              height: 54,
                              borderWidth: 1,
                              borderColor: isDark
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.08)",
                            },
                          ]}
                          placeholder={
                            cryptoCoin === "USDT_TRC20"
                              ? "T..."
                              : cryptoCoin === "USDT_ERC20" ||
                                  cryptoCoin === "ETH"
                                ? "0x..."
                                : cryptoCoin === "BTC"
                                  ? "bc1... or 1... or 3..."
                                  : tr("Address...", "Adresse...", "العنوان...")
                          }
                          placeholderTextColor={colors.textMuted}
                          value={cryptoAddress}
                          onChangeText={setCryptoAddress}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    )}

                    {withdrawMethod === "bank_transfer" && (
                      <View style={{ gap: 15 }}>
                        <Text
                          style={[
                            styles.inputLabel,
                            { color: colors.textMuted },
                          ]}
                        >
                          {tr("Bank Name", "Nom de la banque", "اسم البانكا")}
                        </Text>
                        <TextInput
                          style={[
                            styles.modalInput,
                            {
                              color: colors.foreground,
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "#F9FAFB",
                              padding: 15,
                              borderRadius: 12,
                              height: 54,
                            },
                          ]}
                          placeholder={tr(
                            "Example: BIAT",
                            "Ex: BIAT",
                            "مثال: BIAT",
                          )}
                          placeholderTextColor={colors.textMuted}
                          value={bankName}
                          onChangeText={setBankName}
                        />

                        <Text
                          style={[
                            styles.inputLabel,
                            { color: colors.textMuted, marginTop: 10 },
                          ]}
                        >
                          {tr("IBAN / RIB", "IBAN / RIB", "الريب")}
                        </Text>
                        <TextInput
                          style={[
                            styles.modalInput,
                            {
                              color: colors.foreground,
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "#F9FAFB",
                              padding: 15,
                              borderRadius: 12,
                              height: 54,
                            },
                          ]}
                          placeholder="TN..."
                          placeholderTextColor={colors.textMuted}
                          value={iban}
                          onChangeText={setIban}
                          autoCapitalize="characters"
                        />
                      </View>
                    )}

                    {withdrawMethod === "post_office" && (
                      <View style={{ gap: 15 }}>
                        <Text
                          style={[
                            styles.inputLabel,
                            { color: colors.textMuted },
                          ]}
                        >
                          {tr("Full Name", "Nom Complet", "الاسم الكامل")}
                        </Text>
                        <TextInput
                          style={[
                            styles.modalInput,
                            {
                              color: colors.foreground,
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "#F9FAFB",
                              padding: 15,
                              borderRadius: 12,
                              height: 54,
                            },
                          ]}
                          placeholder="Alcatraz Dev"
                          placeholderTextColor={colors.textMuted}
                          value={postFullName}
                          onChangeText={setPostFullName}
                        />

                        <Text
                          style={[
                            styles.inputLabel,
                            { color: colors.textMuted, marginTop: 10 },
                          ]}
                        >
                          {tr(
                            "Delivery Address",
                            "Adresse de livraison",
                            "العنوان",
                          )}
                        </Text>
                        <TextInput
                          style={[
                            styles.modalInput,
                            {
                              color: colors.foreground,
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "#F9FAFB",
                              padding: 15,
                              borderRadius: 12,
                              height: 54,
                            },
                          ]}
                          placeholder={tr(
                            "Street, City...",
                            "Rue, Ville...",
                            "النهج، الولاية...",
                          )}
                          placeholderTextColor={colors.textMuted}
                          value={postAddress}
                          onChangeText={setPostAddress}
                        />

                        <View style={{ flexDirection: "row", gap: 10 }}>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.inputLabel,
                                { color: colors.textMuted, marginTop: 10 },
                              ]}
                            >
                              {tr(
                                "Postal Code",
                                "Code Postal",
                                "الترقيم البريدي",
                              )}
                            </Text>
                            <TextInput
                              style={[
                                styles.modalInput,
                                {
                                  color: colors.foreground,
                                  backgroundColor: isDark
                                    ? "rgba(255,255,255,0.05)"
                                    : "#F9FAFB",
                                  padding: 15,
                                  borderRadius: 12,
                                  height: 54,
                                },
                              ]}
                              placeholder="4000"
                              placeholderTextColor={colors.textMuted}
                              keyboardType="numeric"
                              value={postPostal}
                              onChangeText={setPostPostal}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.inputLabel,
                                { color: colors.textMuted, marginTop: 10 },
                              ]}
                            >
                              {tr("City", "Ville", "الولاية")}
                            </Text>
                            <TextInput
                              style={[
                                styles.modalInput,
                                {
                                  color: colors.foreground,
                                  backgroundColor: isDark
                                    ? "rgba(255,255,255,0.05)"
                                    : "#F9FAFB",
                                  padding: 15,
                                  borderRadius: 12,
                                  height: 54,
                                },
                              ]}
                              placeholder="Sousse"
                              placeholderTextColor={colors.textMuted}
                              value={postCity}
                              onChangeText={setPostCity}
                            />
                          </View>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.confirmBtn,
                        {
                          backgroundColor: isDark ? "#FFFFFF" : "#111111",
                          opacity: submittingWithdraw ? 0.5 : 1,
                          marginTop: 32,
                        },
                      ]}
                      onPress={handleWithdraw}
                      disabled={submittingWithdraw}
                    >
                      {submittingWithdraw ? (
                        <ActivityIndicator
                          size="small"
                          color={isDark ? "#000" : "#FFF"}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.confirmBtnText,
                            { color: isDark ? "#000000" : "#FFFFFF" },
                          ]}
                        >
                          {tr(
                            "Confirm Withdrawal",
                            "Confirmer le retrait",
                            "أكد الجبدان",
                          )}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Payment Method Selection Modal */}
      <Modal
        visible={showPaymentMethodModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentMethodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {tr(
                  "Select Payment Method",
                  "Mode de paiement",
                  "اختار طريقة الدفع",
                )}
              </Text>
              <TouchableOpacity
                onPress={() => setShowPaymentMethodModal(false)}
              >
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
              <TouchableOpacity
                style={[
                  styles.transactionItem,
                  {
                    backgroundColor: isDark ? "#333" : "#F9FAFB",
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 12,
                    borderBottomWidth: 0,
                  },
                ]}
                onPress={handleStripeCheckout}
              >
                <View
                  style={[
                    styles.coinIconWrapper,
                    { backgroundColor: "rgba(99, 102, 241, 0.12)" },
                  ]}
                >
                  <CreditCard size={24} color="#6366F1" />
                </View>
                <View style={styles.transactionInfo}>
                  <Text
                    style={[
                      styles.transactionTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    Stripe (Credit/Debit Card)
                  </Text>
                  <Text
                    style={[
                      styles.transactionDate,
                      { color: colors.textMuted },
                    ]}
                  >
                    {tr("Instant payment", "Paiement instantané", "دفع حيني")}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </TouchableOpacity>

              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 13,
                  fontWeight: "600",
                  marginBottom: 12,
                  marginTop: 8,
                }}
              >
                {tr(
                  "Pay with Cryptocurrency",
                  "Payer avec crypto",
                  "خلص بالكريبتو",
                )}
              </Text>

              <TouchableOpacity
                style={[
                  styles.transactionItem,
                  {
                    backgroundColor: isDark ? "#333" : "#F9FAFB",
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 12,
                    borderBottomWidth: 0,
                  },
                ]}
                onPress={() => handleCryptoCheckout("USDT_TRC20")}
              >
                <View
                  style={[
                    styles.coinIconWrapper,
                    { backgroundColor: "rgba(34, 197, 94, 0.12)" },
                  ]}
                >
                  <Text style={{ fontWeight: "bold", color: "#22C55E" }}>
                    USDT
                  </Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text
                    style={[
                      styles.transactionTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    Tether (USDT TRC-20)
                  </Text>
                  <Text
                    style={[
                      styles.transactionDate,
                      { color: colors.textMuted },
                    ]}
                  >
                    Tron Network (Fast, Low Fee)
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.transactionItem,
                  {
                    backgroundColor: isDark ? "#333" : "#F9FAFB",
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 12,
                    borderBottomWidth: 0,
                  },
                ]}
                onPress={() => handleCryptoCheckout("USDT_ERC20")}
              >
                <View
                  style={[
                    styles.coinIconWrapper,
                    { backgroundColor: "rgba(34, 197, 94, 0.12)" },
                  ]}
                >
                  <Text style={{ fontWeight: "bold", color: "#22C55E" }}>
                    USDT
                  </Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text
                    style={[
                      styles.transactionTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    Tether (USDT ERC-20)
                  </Text>
                  <Text
                    style={[
                      styles.transactionDate,
                      { color: colors.textMuted },
                    ]}
                  >
                    Ethereum Network
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.transactionItem,
                  {
                    backgroundColor: isDark ? "#333" : "#F9FAFB",
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 12,
                    borderBottomWidth: 0,
                  },
                ]}
                onPress={() => handleCryptoCheckout("BTC")}
              >
                <View
                  style={[
                    styles.coinIconWrapper,
                    { backgroundColor: "rgba(245, 158, 11, 0.12)" },
                  ]}
                >
                  <Text style={{ fontWeight: "bold", color: "#F59E0B" }}>
                    BTC
                  </Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text
                    style={[
                      styles.transactionTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    Bitcoin (BTC)
                  </Text>
                  <Text
                    style={[
                      styles.transactionDate,
                      { color: colors.textMuted },
                    ]}
                  >
                    Bitcoin Network
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.transactionItem,
                  {
                    backgroundColor: isDark ? "#333" : "#F9FAFB",
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 40,
                    borderBottomWidth: 0,
                  },
                ]}
                onPress={() => handleCryptoCheckout("ETH")}
              >
                <View
                  style={[
                    styles.coinIconWrapper,
                    { backgroundColor: "rgba(99, 102, 241, 0.12)" },
                  ]}
                >
                  <Text style={{ fontWeight: "bold", color: "#6366F1" }}>
                    ETH
                  </Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text
                    style={[
                      styles.transactionTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    Ethereum (ETH)
                  </Text>
                  <Text
                    style={[
                      styles.transactionDate,
                      { color: colors.textMuted },
                    ]}
                  >
                    Ethereum Network
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Crypto Invoice Details Modal */}
      <Modal
        visible={showCryptoInvoice}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCryptoInvoice(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card, minHeight: "70%" },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {tr("Complete Payment", "Effectuer le paiement", "كمّل الدفع")}
              </Text>
              <TouchableOpacity onPress={() => setShowCryptoInvoice(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {cryptoInvoiceData && (
              <ScrollView
                style={{ paddingHorizontal: 24, paddingVertical: 20 }}
              >
                <View style={{ alignItems: "center", marginBottom: 24 }}>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  >
                    {tr(
                      "Send exactly:",
                      "Envoyer exactement :",
                      "ابعت بالضبط:",
                    )}
                  </Text>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 28,
                      fontWeight: "900",
                    }}
                  >
                    {cryptoInvoiceData.coinAmount} {cryptoInvoiceData.coin}
                  </Text>
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 13,
                      marginTop: 4,
                      fontWeight: "600",
                    }}
                  >
                    Network: {cryptoInvoiceData.network}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: colors.card,
                    padding: 18,
                    borderRadius: 20,
                    marginBottom: 24,
                    borderWidth: 1,
                    borderColor: "rgba(100,100,100,0.1)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 5,
                    elevation: 2,
                  }}
                >
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    {tr("To Address:", "À l'adresse :", "للأدريسة هذي:")}
                  </Text>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 14,
                      fontWeight: "600",
                      marginBottom: 12,
                    }}
                    selectable
                  >
                    {cryptoInvoiceData.walletAddress}
                  </Text>

                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                    onPress={() => {
                      Alert.alert(
                        tr("Copied", "Copié", "تم النسخ"),
                        tr(
                          "Address copied to clipboard",
                          "Adresse copiée dans le presse-papiers",
                          "تم نسخ الأدريسة",
                        ),
                      );
                    }}
                  >
                    <Text
                      style={{
                        color: isDark ? "#000" : "#FFF",
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      {tr("Copy Address", "Copier l'adresse", "انسخ الأدريسة")}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                  <Info
                    size={20}
                    color={colors.primary}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      color: colors.foreground,
                      flex: 1,
                      fontSize: 13,
                      lineHeight: 18,
                    }}
                  >
                    {tr(
                      "After sending the exact amount, your balance will be updated automatically once the transaction is confirmed on the blockchain. This usually takes 5-15 minutes.",
                      "Après avoir envoyé le montant exact, votre solde sera mis à jour automatiquement une fois la transaction confirmée sur la blockchain. Cela prend généralement 5 à 15 minutes.",
                      "بعد ما تبعت المبلغ بالضبط، الرصيد متاعك باش يتصب آلياً بعد ما تتأكد العملية في البلوكتشين. عادة تاخو 5 لـ 15 دقيقة.",
                    )}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    {
                      backgroundColor: "rgba(100,100,100,0.1)",
                      marginTop: 10,
                      marginBottom: 40,
                    },
                  ]}
                  onPress={() => setShowCryptoInvoice(false)}
                >
                  <Text
                    style={[
                      styles.confirmBtnText,
                      { color: colors.foreground },
                    ]}
                  >
                    {tr(
                      "I have completed the transfer",
                      "J'ai effectué le transfert",
                      "كمّلت الدفع",
                    )}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    zIndex: 10,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  balanceCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    height: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceAmount: {
    color: "#FFF",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 1,
  },
  walletIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  decorativeCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    padding: 4,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 120,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 15,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  packageCard: {
    width: "48%",
    padding: 16,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1.5,
    marginBottom: 12,
    justifyContent: "space-between",
    minHeight: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  coinIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  coinAmount: {
    fontSize: 18,
    fontWeight: "900",
  },
  bonusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
    marginTop: 4,
  },
  priceButton: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 14,
  },
  priceText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    height: 100,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  actionBtnTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  transferBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  transferBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  transferBannerTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(100,100,100,0.1)",
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 15,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  modalContent: {
    width: "100%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 0,
    paddingBottom: 0,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(100,100,100,0.05)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
  userListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  userListItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: "600",
  },
  selectedUserCard: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  userAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarLargeImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  selectedUserName: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  profileActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
  },
  profileDetailsBox: {
    width: "100%",
    padding: 15,
    borderRadius: 16,
    marginTop: 10,
  },
  profileDetailsTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  profileDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  exchangeSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    marginTop: 4,
  },
  exchangeTypeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(100,100,100,0.1)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmBtn: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  exchangeReview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(100,100,100,0.05)",
    padding: 20,

    borderRadius: 16,
    marginBottom: 20,
  },
});
