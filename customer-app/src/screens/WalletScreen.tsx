/**
 * WalletScreen - Coin balance, diamonds, transactions
 * Top up coins, view history, manage payments
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import {
  Wallet,
  Coins,
  Diamond,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  History,
  Plus,
  Gift,
  Star,
  ChevronRight,
  Zap,
} from "lucide-react-native";
import { db, auth } from "../api/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { stripePaymentService } from "../services/StripePaymentService";

interface Transaction {
  id: string;
  type: "gift_sent" | "gift_received" | "recharge" | "withdraw" | "purchase" | "earning";
  amount: number;
  amountCoins?: number;
  amountDiamonds?: number;
  description: string;
  timestamp: any;
  status: "completed" | "pending" | "failed";
}

interface WalletScreenProps {
  userId?: string;
  onBack?: () => void;
  theme?: "light" | "dark";
  t?: (key: string) => any;
  profileData?: any;
  user?: any;
  language?: "en" | "fr" | "ar";
  onNavigate?: (screen: string, params?: any) => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ userId }) => {
  const [coins, setCoins] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTab, setSelectedTab] = useState<"coins" | "diamonds">("coins");
  const [isLoading, setIsLoading] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(100);

  const currentUserId = userId || auth?.currentUser?.uid || "demo_user";

  // Load wallet data
  useEffect(() => {
    loadWallet();
    subscribeToTransactions();
  }, [currentUserId]);

  const loadWallet = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", currentUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setCoins(data.wallet?.coins || 0);
        setDiamonds(data.wallet?.diamonds || 0);
      }
    } catch (e) {
      console.log("[Wallet] Load error:", e);
    }
  };

  const subscribeToTransactions = () => {
    const q = query(
      collection(db, "users", currentUserId, "transactions"),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
      setTransactions(txs);
    });
  };

  const handleRecharge = async () => {
    setIsLoading(true);
    try {
      // In real app, integrate with Stripe here
      // For demo, just add coins directly
      const userRef = doc(db, "users", currentUserId);
      await updateDoc(userRef, {
        "wallet.coins": coins + rechargeAmount,
        "wallet.updatedAt": serverTimestamp(),
      });

      // Record transaction
      await addDoc(collection(db, "users", currentUserId, "transactions"), {
        type: "recharge",
        amountCoins: rechargeAmount,
        amount: rechargeAmount,
        description: `Recharged ${rechargeAmount} coins`,
        timestamp: serverTimestamp(),
        status: "completed",
      });

      setCoins(coins + rechargeAmount);
      setShowRecharge(false);
      Alert.alert("Success", `Successfully recharged ${rechargeAmount} coins!`);
    } catch (e) {
      console.log("[Wallet] Recharge error:", e);
      Alert.alert("Error", "Failed to recharge. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "gift_sent":
        return <Gift size={16} color="#FF0066" />;
      case "gift_received":
        return <Star size={16} color="#FFD700" />;
      case "recharge":
        return <Plus size={16} color="#00D4FF" />;
      case "purchase":
        return <CreditCard size={16} color="#FF0066" />;
      case "earning":
        return <Zap size={16} color="#2ECC71" />;
      default:
        return <History size={16} color="#888" />;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        {getTransactionIcon(item.type)}
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.timestamp)}</Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text
          style={[
            styles.amountText,
            (item.type === "gift_sent" || item.type === "purchase") && styles.amountNegative,
            (item.type === "recharge" || item.type === "gift_received" || item.type === "earning") && styles.amountPositive,
          ]}
        >
          {item.type === "gift_sent" || item.type === "purchase" ? "-" : "+"}
          {item.amountCoins || item.amountDiamonds || item.amount}
        </Text>
        <Text style={styles.amountType}>
          {item.amountCoins ? "coins" : item.amountDiamonds ? "diamonds" : ""}
        </Text>
      </View>
    </View>
  );

  const rechargeOptions = stripePaymentService.getRechargeOptions();

  const [paymentMethod, setPaymentMethod] = useState<"card" | "apple" | "google">("card");
  const [walletAvailable, setWalletAvailable] = useState({ applePay: false, googlePay: false });

  useEffect(() => {
    checkWalletAvailability();
  }, []);

  const checkWalletAvailability = async () => {
    const availability = await stripePaymentService.checkWalletAvailability();
    setWalletAvailable(availability);
  };

  const handleStripePayment = async () => {
    setIsLoading(true);
    try {
      // Create payment intent
      const selectedOption = rechargeOptions.find(o => o.coins === rechargeAmount);
      const price = selectedOption?.price || 1;
      const bonus = selectedOption?.bonus || 0;
      const totalCoins = rechargeAmount + bonus;

      const { clientSecret } = await stripePaymentService.createPaymentIntent(price * 100, "usd");

      // Process payment based on method
      let result;
      if (paymentMethod === "apple" || paymentMethod === "google") {
        result = await stripePaymentService.processWalletPayment(price, paymentMethod);
      } else {
        result = await stripePaymentService.processPayment(clientSecret, {
          number: "4242424242424242",
          expMonth: 12,
          expYear: 2025,
          cvc: "123",
        });
      }

      if (result.success) {
        // Update wallet
        const userRef = doc(db, "users", currentUserId);
        await updateDoc(userRef, {
          "wallet.coins": coins + totalCoins,
          "wallet.updatedAt": serverTimestamp(),
        });

        // Record transaction
        await addDoc(collection(db, "users", currentUserId, "transactions"), {
          type: "recharge",
          amountCoins: totalCoins,
          amount: price,
          description: `Recharged ${rechargeAmount} coins (+${bonus} bonus) via Stripe`,
          timestamp: serverTimestamp(),
          status: "completed",
          paymentMethod,
        });

        setCoins(coins + totalCoins);
        setShowRecharge(false);
        Alert.alert("Success", `Successfully recharged ${totalCoins} coins!`);
      }
    } catch (e) {
      console.log("[Wallet] Payment error:", e);
      Alert.alert("Error", "Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet</Text>
      </View>

      {/* Balance Cards */}
      <View style={styles.balanceContainer}>
        {/* Coins Card */}
        <TouchableOpacity
          style={[styles.balanceCard, selectedTab === "coins" && styles.balanceCardActive]}
          onPress={() => setSelectedTab("coins")}
        >
          <BlurView intensity={80} tint="dark" style={styles.balanceCardBlur}>
            <View style={styles.balanceCardHeader}>
              <Coins size={24} color="#FFD700" />
              <Text style={styles.balanceLabel}>Coins</Text>
            </View>
            <Text style={styles.balanceAmount}>{coins.toLocaleString()}</Text>
            <TouchableOpacity
              style={styles.rechargeButton}
              onPress={() => setShowRecharge(true)}
            >
              <Plus size={16} color="#fff" />
              <Text style={styles.rechargeButtonText}>Recharge</Text>
            </TouchableOpacity>
          </BlurView>
        </TouchableOpacity>

        {/* Diamonds Card */}
        <TouchableOpacity
          style={[styles.balanceCard, selectedTab === "diamonds" && styles.balanceCardActive]}
          onPress={() => setSelectedTab("diamonds")}
        >
          <BlurView intensity={80} tint="dark" style={styles.balanceCardBlur}>
            <View style={styles.balanceCardHeader}>
              <Diamond size={24} color="#FF0066" />
              <Text style={styles.balanceLabel}>Diamonds</Text>
            </View>
            <Text style={styles.balanceAmount}>{diamonds.toLocaleString()}</Text>
            <View style={styles.diamondInfo}>
              <Text style={styles.diamondInfoText}>Earned from gifts</Text>
            </View>
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Quick Recharge */}
      <View style={styles.quickRecharge}>
        <Text style={styles.sectionTitle}>Quick Recharge</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {rechargeOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.rechargeOption}
              onPress={() => {
                setRechargeAmount(option.coins);
                setShowRecharge(true);
              }}
            >
              <Coins size={20} color="#FFD700" />
              <Text style={styles.rechargeOptionAmount}>{option.coins}</Text>
              {option.bonus !== undefined && option.bonus > 0 && (
                <View style={styles.bonusBadge}>
                  <Text style={styles.bonusText}>+{option.bonus}</Text>
                </View>
              )}
              <Text style={styles.rechargeOptionPrice}>{option.price} USD</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transactions */}
      <View style={styles.transactionsSection}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <TouchableOpacity>
            <ChevronRight size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {transactions.length > 0 ? (
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.transactionsList}
          />
        ) : (
          <View style={styles.emptyTransactions}>
            <History size={40} color="#333" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        )}
      </View>

      {/* Recharge Modal */}
      {showRecharge && (
        <View style={styles.rechargeModal}>
          <BlurView intensity={90} tint="dark" style={styles.rechargeModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recharge Coins</Text>
              <TouchableOpacity onPress={() => setShowRecharge(false)}>
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rechargeAmount}>
              <Coins size={40} color="#FFD700" />
              <Text style={styles.rechargeAmountText}>{rechargeAmount}</Text>
              <Text style={styles.rechargeAmountLabel}>coins</Text>
            </View>

            {/* Payment Method Selection */}
            <Text style={styles.paymentLabel}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[styles.paymentOption, paymentMethod === "card" && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod("card")}
              >
                <CreditCard size={20} color={paymentMethod === "card" ? "#FF0066" : "#666"} />
                <Text style={[styles.paymentOptionText, paymentMethod === "card" && styles.paymentOptionTextActive]}>
                  Card
                </Text>
              </TouchableOpacity>

              {walletAvailable.applePay && (
                <TouchableOpacity
                  style={[styles.paymentOption, paymentMethod === "apple" && styles.paymentOptionActive]}
                  onPress={() => setPaymentMethod("apple")}
                >
                  <Text style={styles.appleIcon}></Text>
                  <Text style={[styles.paymentOptionText, paymentMethod === "apple" && styles.paymentOptionTextActive]}>
                    Apple Pay
                  </Text>
                </TouchableOpacity>
              )}

              {walletAvailable.googlePay && (
                <TouchableOpacity
                  style={[styles.paymentOption, paymentMethod === "google" && styles.paymentOptionActive]}
                  onPress={() => setPaymentMethod("google")}
                >
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={[styles.paymentOptionText, paymentMethod === "google" && styles.paymentOptionTextActive]}>
                    Google Pay
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.payButton, isLoading && styles.payButtonDisabled]}
              onPress={handleStripePayment}
              disabled={isLoading}
            >
              <CreditCard size={20} color="#fff" />
              <Text style={styles.payButtonText}>
                {isLoading ? "Processing..." : `Pay ${(rechargeOptions.find(o => o.coins === rechargeAmount)?.price || 0).toFixed(2)} USD`}
              </Text>
            </TouchableOpacity>

            <Text style={styles.stripePowered}>
              🔒 Powered by Stripe
            </Text>
          </BlurView>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  balanceContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  balanceCard: {
    flex: 1,
    height: 150,
    borderRadius: 16,
    overflow: "hidden",
  },
  balanceCardActive: {
    borderWidth: 2,
    borderColor: "#FF0066",
  },
  balanceCardBlur: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  balanceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  balanceLabel: {
    color: "#888",
    fontSize: 14,
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  rechargeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF0066",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
  },
  rechargeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  diamondInfo: {
    backgroundColor: "rgba(255, 0, 102, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  diamondInfoText: {
    color: "#FF0066",
    fontSize: 12,
  },
  quickRecharge: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  rechargeOption: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: "center",
    minWidth: 80,
  },
  rechargeOptionAmount: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  bonusBadge: {
    backgroundColor: "#2ECC71",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  bonusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  rechargeOptionPrice: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },
  transactionsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  transactionsList: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionDescription: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  transactionDate: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "700",
  },
  amountNegative: {
    color: "#FF0066",
  },
  amountPositive: {
    color: "#2ECC71",
  },
  amountType: {
    color: "#888",
    fontSize: 10,
    marginTop: 2,
  },
  emptyTransactions: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
    marginTop: 12,
  },
  rechargeModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    padding: 20,
  },
  rechargeModalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  modalClose: {
    color: "#FF0066",
    fontSize: 16,
  },
  rechargeAmount: {
    alignItems: "center",
    paddingVertical: 30,
  },
  rechargeAmountText: {
    color: "#FFD700",
    fontSize: 48,
    fontWeight: "700",
    marginTop: 12,
  },
  rechargeAmountLabel: {
    color: "#888",
    fontSize: 16,
    marginTop: 4,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF0066",
    paddingVertical: 16,
    borderRadius: 25,
    gap: 10,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  paymentLabel: {
    color: "#888",
    fontSize: 14,
    marginBottom: 12,
    marginTop: 10,
  },
  paymentMethods: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  paymentOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#252525",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  paymentOptionActive: {
    borderColor: "#FF0066",
    backgroundColor: "rgba(255, 0, 102, 0.1)",
  },
  paymentOptionText: {
    color: "#666",
    fontSize: 14,
  },
  paymentOptionTextActive: {
    color: "#FF0066",
  },
  appleIcon: {
    fontSize: 18,
    color: "#fff",
  },
  googleIcon: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
  stripePowered: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },
});

export default WalletScreen;