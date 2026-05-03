import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Alert,
  ScrollView,
} from "react-native";
import { X, Coins, Plus } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  doc,
  setDoc,
  increment,
  serverTimestamp,
  collection,
  addDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../api/firebase";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import Constants from "expo-constants";

const { width, height } = Dimensions.get("window");

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

interface RechargeModalProps {
  isVisible: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  language?: string;
}

const PRODUCTION_API_URL = "https://backend-bey3a.vercel.app/api/payment";
const USE_LOCAL_BACKEND = false;

const getApiBaseUrl = () => {
  if (!USE_LOCAL_BACKEND) return PRODUCTION_API_URL;
  const debuggerHost = Constants.expoConfig?.hostUri || "";
  const ip = debuggerHost.split(":")[0];
  if (!ip) return "http://localhost:5001/api/payment";
  return `http://${ip}:5001/api/payment`;
};

const API_BASE_URL = getApiBaseUrl();

export const RechargeModal = ({
  isVisible,
  onClose,
  userId,
  userName,
  language = "fr",
}: RechargeModalProps) => {
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const tr = (en: string, fr: string, ar: string) => {
    return language === "ar" ? ar : language === "fr" ? fr : en;
  };

  const handlePackageSelect = (pack: any) => {
    setSelectedPack(pack);
    setShowPaymentMethods(true);
  };

  const handleStripeCheckout = async () => {
    if (!userId || !selectedPack) return;
    setLoading(true);
    setShowPaymentMethods(false);

    try {
      // 1. Create Checkout Session
      const checkoutResponse = await fetch(`${API_BASE_URL}/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number((selectedPack.price / 3.4).toFixed(2)), // TND to EUR
          currency: "eur",
          userId: userId,
          pack: {
            coins: selectedPack.coins,
            bonus: selectedPack.bonus,
            price: selectedPack.price,
            priceDisplay: selectedPack.priceDisplay,
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
        Alert.alert(
          tr("Success", "Succès", "ناجح"),
          tr(
            "Payment processing. Your coins will be added shortly.",
            "Paiement en cours. Vos pièces seront ajoutées sous peu.",
            "جاري معالجة الدفع. سيتم إضافة عملاتك قريباً.",
          ),
        );
        onClose();
      }
    } catch (error: any) {
      console.error("Stripe Error:", error);
      Alert.alert("Error", error.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoCheckout = async (coin: string) => {
    if (!userId || !selectedPack) return;
    setLoading(true);
    setShowPaymentMethods(false);

    try {
      const response = await fetch(`${API_BASE_URL}/crypto/create-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          coin: coin,
          amountEUR: Number((selectedPack.price / 3.4).toFixed(2)),
          pack: {
            coins: selectedPack.coins,
            bonus: selectedPack.bonus,
            priceDisplay: selectedPack.priceDisplay,
          },
        }),
      });

      const data = await response.json();
      if (!data.success || !data.invoice) {
        throw new Error(data.error || "Failed to create crypto invoice");
      }

      Alert.alert(
        tr("Crypto Invoice", "Facture Crypto", "فاتورة كريبتو"),
        tr(
          "Please complete the payment in the next window.",
          "Veuillez effectuer le paiement dans la fenêtre suivante.",
          "يرجى إكمال الدفع في النافذة التالية.",
        ),
        [
          {
            text: "OK",
            onPress: () =>
              WebBrowser.openBrowserAsync(data.invoice.checkout_url),
          },
        ],
      );
      onClose();
    } catch (error: any) {
      console.error("Crypto Error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to generate crypto invoice",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.header}>
            <View style={styles.headerIndicator} />
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>
                {tr("Recharge Coins", "Recharger des Pièces", "شحن العملات")}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {!showPaymentMethods ? (
                RECHARGE_PACKAGES.map((pack) => (
                  <TouchableOpacity
                    key={pack.id}
                    style={styles.packageCard}
                    onPress={() => handlePackageSelect(pack)}
                    disabled={loading}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.coinIconContainer}>
                        <Coins size={24} color="#F59E0B" fill="#F59E0B" />
                      </View>
                      <Text style={styles.coinAmount}>{pack.coins}</Text>
                    </View>

                    <View style={styles.bonusContainer}>
                      {pack.bonus > 0 ? (
                        <Text style={styles.bonusText}>
                          +{pack.bonus} {tr("Bonus", "Bonus", "مكافأة")}
                        </Text>
                      ) : (
                        <View style={{ height: 14 }} />
                      )}
                    </View>

                    <LinearGradient
                      colors={["#F59E0B", "#D97706"]}
                      style={styles.priceBtn}
                    >
                      <Text style={styles.priceText}>{pack.priceDisplay}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.paymentMethodsContainer}>
                  <Text style={styles.paymentTitle}>
                    {tr(
                      "Select Payment Method",
                      "Choisir le mode de paiement",
                      "اختر طريقة الدفع",
                    )}
                  </Text>

                  <TouchableOpacity
                    style={styles.methodCard}
                    onPress={handleStripeCheckout}
                  >
                    <LinearGradient
                      colors={["#6366F1", "#4F46E5"]}
                      style={styles.methodIcon}
                    >
                      <Plus size={24} color="#fff" />
                    </LinearGradient>
                    <View>
                      <Text style={styles.methodName}>
                        Stripe (Card/Apple Pay)
                      </Text>
                      <Text style={styles.methodDesc}>
                        {tr(
                          "Secure payment via card",
                          "Paiement sécurisé par carte",
                          "دفع آمن بالبطاقة",
                        )}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.methodCard}
                    onPress={() => handleCryptoCheckout("USDT_TRC20")}
                  >
                    <LinearGradient
                      colors={["#10B981", "#059669"]}
                      style={styles.methodIcon}
                    >
                      <Coins size={24} color="#fff" />
                    </LinearGradient>
                    <View>
                      <Text style={styles.methodName}>Crypto (USDT/BTC)</Text>
                      <Text style={styles.methodDesc}>
                        {tr(
                          "Pay with cryptocurrency",
                          "Payer en crypto-monnaie",
                          "الدفع بالعملات الرقمية",
                        )}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backBtnLabel}
                    onPress={() => setShowPaymentMethods(false)}
                  >
                    <Text style={styles.backText}>
                      {tr(
                        "Back to Packages",
                        "Retour aux Packs",
                        "الرجوع للحزم",
                      )}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    height: height * 0.7,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    backgroundColor: "#16161E",
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  packageCard: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    minHeight: 160,
    justifyContent: "space-between",
  },
  cardHeader: {
    alignItems: "center",
    width: "100%",
  },
  bonusContainer: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  coinIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  coinAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  bonusText: {
    fontSize: 10,
    color: "#10B981",
    fontWeight: "700",
    marginBottom: 10,
  },
  priceBtn: {
    width: "100%",
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  priceText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  paymentMethodsContainer: {
    width: "100%",
    paddingTop: 10,
  },
  paymentTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  methodName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  methodDesc: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 2,
  },
  backBtnLabel: {
    marginTop: 15,
    padding: 10,
    alignItems: "center",
  },
  backText: {
    color: "#F59E0B",
    fontSize: 13,
    fontWeight: "600",
  },
});
