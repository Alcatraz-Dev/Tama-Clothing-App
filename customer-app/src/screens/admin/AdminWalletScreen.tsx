import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Switch,
  TextInput,
} from "react-native";
import {
  ArrowLeft,
  DollarSign,
  Wallet,
  Gift,
  CheckCircle,
  XCircle,
  ChevronRight,
  Settings2,
  CreditCard,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../context/ThemeContext";
import { db } from "../../api/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  setDoc,
  getDoc,
  limit,
} from "firebase/firestore";
import {
  approveWithdrawal,
  rejectWithdrawal,
  grantBonus,
} from "../../services/codFinancialService";

const { width } = Dimensions.get("window");

interface AdminWalletScreenProps {
  onBack: () => void;
  t: (key: string) => string;
  theme: string;
  language: string;
}

interface WithdrawalRequest {
  id: string;
  actorId: string;
  actorType: "brand" | "delivery" | "platform" | "customer";
  walletId: string;
  amount: number;
  payoutAmount: number;
  payoutCurrency: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  method: string;
  requestedAt: any;
  processedAt?: any;
  brandName?: string; // for display
}

export default function AdminWalletScreen({
  onBack,
  t,
  theme,
  language,
}: AdminWalletScreenProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<"withdrawals" | "bonuses" | "recharges">(
    "bonuses",
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Withdrawals State
  const [withdrawalRequests, setWithdrawalRequests] = useState<
    WithdrawalRequest[]
  >([]);

  // Bonuses State
  const [bonusSettings, setBonusSettings] = useState<any>(null);
  const [savingBonus, setSavingBonus] = useState(false);
  const [bonusHistory, setBonusHistory] = useState<any[]>([]);
  const [loadingBonusHistory, setLoadingBonusHistory] = useState(false);

  // Recharges State
  const [rechargeHistory, setRechargeHistory] = useState<any[]>([]);
  const [loadingRecharges, setLoadingRecharges] = useState(false);

  useEffect(() => {
    if (activeTab === "bonuses") {
      fetchBonusHistory();
    } else if (activeTab === "recharges") {
      fetchRechargeHistory();
    }
  }, [activeTab]);

  const fetchBonusHistory = async () => {
    setLoadingBonusHistory(true);
    try {
      const q = query(
        collection(db, "transactions"),
        where("type", "==", "bonus"),
        orderBy("createdAt", "desc"),
        limit(20),
      );
      const snap = await getDocs(q);
      setBonusHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Fetch bonus history error:", error);
    } finally {
      setLoadingBonusHistory(false);
    }
  };

  const fetchRechargeHistory = async () => {
    setLoadingRecharges(true);
    try {
      const q = query(
        collection(db, "transactions"),
        where("type", "==", "recharge"),
        orderBy("createdAt", "desc"),
        limit(30),
      );
      const snap = await getDocs(q);
      setRechargeHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Fetch recharge history error:", error);
    } finally {
      setLoadingRecharges(false);
    }
  };

  // Helper for tr
  const tr = (en: string, fr: string, ar: string) => {
    if (language === "ar") return ar;
    if (language === "fr") return fr;
    return en;
  };

  const loadData = async () => {
    try {
      // Load Bonus Settings
      const bonusDoc = await getDoc(doc(db, "app_config", "wallet_bonuses"));
      if (bonusDoc.exists()) {
        setBonusSettings(bonusDoc.data());
      } else {
        setBonusSettings({
          firstRecharge: { enabled: false, bonus: 10 },
          extraBonus: { enabled: false, bonus: 5 },
          cryptoBonus: { enabled: false, bonus: 15 },
          bulkBonus: { enabled: false, bonus: 20, threshold: 100 },
        });
      }
    } catch (e) {
      console.error("[AdminWallet] Error loading data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to pending withdrawal requests
    const wdQuery = query(
      collection(db, "withdrawal_requests"),
      where("status", "==", "pending"),
      orderBy("requestedAt", "desc"),
    );
    const unsubWd = onSnapshot(wdQuery, (snap) => {
      setWithdrawalRequests(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<WithdrawalRequest, "id">),
        })),
      );
    });

    return () => unsubWd();
  }, []);

  const handleSaveBonuses = async () => {
    try {
      setSavingBonus(true);
      await setDoc(doc(db, "app_config", "wallet_bonuses"), bonusSettings);
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
        tr("Failed to save settings", "Échec", "فشل"),
      );
    } finally {
      setSavingBonus(false);
    }
  };

  const handleApproveWithdrawal = async (req: WithdrawalRequest) => {
    Alert.alert(
      tr("Approve", "Approuver", "قبول"),
      `Approve ${req.payoutAmount.toFixed(2)} ${req.payoutCurrency} (${req.amount.toFixed(2)} TND) withdrawal?`,
      [
        { text: tr("Cancel", "Annuler", "إلغاء"), style: "cancel" },
        {
          text: tr("Approve", "Approuver", "قبول"),
          onPress: async () => {
            try {
              await approveWithdrawal(req.id);
            } catch (e: any) {
              Alert.alert(tr("Error", "Erreur", "غلطة"), e.message);
            }
          },
        },
      ],
    );
  };

  const handleRejectWithdrawal = async (req: WithdrawalRequest) => {
    Alert.alert(
      tr("Reject", "Rejeter", "رفض"),
      req.payoutCurrency !== "TND" 
        ? `Reject ${req.payoutAmount.toFixed(2)} ${req.payoutCurrency} (${req.amount.toFixed(2)} TND) withdrawal?`
        : `Reject ${req.amount.toFixed(2)} TND withdrawal?`,
      [
        { text: tr("Cancel", "Annuler", "إلغاء"), style: "cancel" },
        {
          text: tr("Reject", "Rejeter", "رفض"),
          style: "destructive",
          onPress: async () => {
            try {
              await rejectWithdrawal(req.id, "Rejected by Admin");
            } catch (e: any) {
              Alert.alert(tr("Error", "Erreur", "غلطة"), e.message);
            }
          },
        },
      ],
    );
  };

  const [manualBonus, setManualBonus] = useState({
    userId: "",
    amount: "",
    reason: "",
  });

  const handleGrantManualBonus = async () => {
    if (!manualBonus.userId || !manualBonus.amount) {
      Alert.alert(
        tr("Error", "Erreur", "غلطة"),
        tr("Fill all fields", "Remplir tous les champs", "عمر البيانات الكل"),
      );
      return;
    }
    setSavingBonus(true);
    try {
      await grantBonus(
        manualBonus.userId,
        Number(manualBonus.amount),
        manualBonus.reason,
      );
      Alert.alert(
        tr("Success", "Succès", "مبروك"),
        tr("Bonus granted!", "Bonus accordé!", "تم إسناد المكافأة"),
      );
      setManualBonus({ userId: "", amount: "", reason: "" });
      fetchBonusHistory();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSavingBonus(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {tr(
            "Wallet & Bonus Management",
            "Gestion Wallet & Bonus",
            "إدارة المحفظة والمكافآت",
          )}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("bonuses")}
          style={[
            styles.tab,
            activeTab === "bonuses" && {
              backgroundColor: colors.primary + "15",
              borderColor: colors.primary,
            },
          ]}
        >
          <Gift
            size={18}
            color={activeTab === "bonuses" ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "bonuses" ? colors.primary : colors.textMuted,
              },
            ]}
          >
            {tr("Bonuses", "Bonus", "المكافآت")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("withdrawals")}
          style={[
            styles.tab,
            activeTab === "withdrawals" && {
              backgroundColor: colors.primary + "15",
              borderColor: colors.primary,
            },
          ]}
        >
          <Wallet
            size={18}
            color={
              activeTab === "withdrawals" ? colors.primary : colors.textMuted
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "withdrawals"
                    ? colors.primary
                    : colors.textMuted,
              },
            ]}
          >
            {tr("Withdrawals", "Retraits", "السحوبات")}
          </Text>
          {withdrawalRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{withdrawalRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("recharges")}
          style={[
            styles.tab,
            activeTab === "recharges" && {
              backgroundColor: "#10B98115",
              borderColor: "#10B981",
            },
          ]}
        >
          <CreditCard
            size={18}
            color={activeTab === "recharges" ? "#10B981" : colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "recharges" ? "#10B981" : colors.textMuted,
              },
            ]}
          >
            {tr("Recharges", "Recharges", "الشحن")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {activeTab === "bonuses" ? (
          <View>
            {/* First Recharge */}
            <BonusCard
              title={tr(
                "First Recharge Bonus",
                "Bonus premier recharge",
                "مكافأة أول شحن",
              )}
              subtitle={tr(
                "Extra coins for new users",
                "Pièces en plus pour nouveaux users",
                "عملات زيادة للمستخدمين الجدد",
              )}
              enabled={bonusSettings?.firstRecharge?.enabled}
              onToggle={(val: boolean) =>
                setBonusSettings({
                  ...bonusSettings,
                  firstRecharge: {
                    ...bonusSettings.firstRecharge,
                    enabled: val,
                  },
                })
              }
              bonus={bonusSettings?.firstRecharge?.bonus}
              onBonusChange={(val: string) =>
                setBonusSettings({
                  ...bonusSettings,
                  firstRecharge: {
                    ...bonusSettings.firstRecharge,
                    bonus: Number(val),
                  },
                })
              }
              colors={colors}
              isDark={isDark}
              tr={tr}
            />

            {/* General Event */}
            <BonusCard
              title={tr(
                "General Event Bonus",
                "Bonus évènement général",
                "مكافأة عامة",
              )}
              subtitle={tr(
                "Extra coins for all users",
                "Pièces en plus pour tous",
                "عملات زيادة للكل",
              )}
              enabled={bonusSettings?.extraBonus?.enabled}
              onToggle={(val: boolean) =>
                setBonusSettings({
                  ...bonusSettings,
                  extraBonus: { ...bonusSettings.extraBonus, enabled: val },
                })
              }
              bonus={bonusSettings?.extraBonus?.bonus}
              onBonusChange={(val: string) =>
                setBonusSettings({
                  ...bonusSettings,
                  extraBonus: {
                    ...bonusSettings.extraBonus,
                    bonus: Number(val),
                  },
                })
              }
              colors={colors}
              isDark={isDark}
              tr={tr}
            />

            {/* Crypto Bonus */}
            <BonusCard
              title={tr(
                "Crypto Payment Bonus",
                "Bonus Paiement Crypto",
                "مكافأة الدفع بالكريبتو",
              )}
              subtitle={tr(
                "Extra coins for Crypto recharges",
                "Pièces en plus pour recharge Crypto",
                "عملات زيادة كي تشحن بالكريبتو",
              )}
              enabled={bonusSettings?.cryptoBonus?.enabled}
              onToggle={(val: boolean) =>
                setBonusSettings({
                  ...bonusSettings,
                  cryptoBonus: { ...bonusSettings.cryptoBonus, enabled: val },
                })
              }
              bonus={bonusSettings?.cryptoBonus?.bonus}
              onBonusChange={(val: string) =>
                setBonusSettings({
                  ...bonusSettings,
                  cryptoBonus: {
                    ...bonusSettings.cryptoBonus,
                    bonus: Number(val),
                  },
                })
              }
              colors={colors}
              isDark={isDark}
              tr={tr}
            />

            {/* Bulk Bonus */}
            <BonusCard
              title={tr(
                "Bulk Purchase Bonus",
                "Bonus Achat en Gros",
                "مكافأة الشراء بالجملة",
              )}
              subtitle={tr(
                "Coins for large recharges",
                "Pièces pour grosses recharges",
                "عملات للشحن الكبير",
              )}
              enabled={bonusSettings?.bulkBonus?.enabled}
              onToggle={(val: boolean) =>
                setBonusSettings({
                  ...bonusSettings,
                  bulkBonus: { ...bonusSettings.bulkBonus, enabled: val },
                })
              }
              bonus={bonusSettings?.bulkBonus?.bonus}
              onBonusChange={(val: string) =>
                setBonusSettings({
                  ...bonusSettings,
                  bulkBonus: { ...bonusSettings.bulkBonus, bonus: Number(val) },
                })
              }
              threshold={bonusSettings?.bulkBonus?.threshold}
              onThresholdChange={(val: string) =>
                setBonusSettings({
                  ...bonusSettings,
                  bulkBonus: {
                    ...bonusSettings.bulkBonus,
                    threshold: Number(val),
                  },
                })
              }
              colors={colors}
              isDark={isDark}
              tr={tr}
            />

            <TouchableOpacity
              onPress={handleSaveBonuses}
              disabled={savingBonus}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              {savingBonus ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {tr("SAVE CHANGES", "ENREGISTRER", "حفظ التغييرات")}
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 30 }} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {tr(
                "Grant Manual Bonus",
                "Accorder Bonus Manuel",
                "إسناد مكافأة يدوية",
              )}
            </Text>
            <View
              style={[
                styles.bonusCard,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFF",
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                {tr(
                  "User ID / Email",
                  "ID Utilisateur / Email",
                  "معرف المستخدم / إيميل",
                )}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    marginBottom: 12,
                  },
                ]}
                placeholder="e.g. user_123"
                placeholderTextColor={colors.textMuted}
                value={manualBonus.userId}
                onChangeText={(val) =>
                  setManualBonus({ ...manualBonus, userId: val })
                }
              />

              <View style={styles.bonusInputs}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.inputLabel, { color: colors.textMuted }]}
                  >
                    {tr(
                      "Amount (Diamonds)",
                      "Montant (Diamants)",
                      "المبلغ (ألماسات)",
                    )}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.foreground },
                    ]}
                    placeholder="1000"
                    placeholderTextColor={colors.textMuted}
                    value={manualBonus.amount}
                    onChangeText={(val) =>
                      setManualBonus({ ...manualBonus, amount: val })
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={[styles.inputLabel, { color: colors.textMuted }]}
                  >
                    {tr("Reason", "Raison", "السبب")}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.foreground },
                    ]}
                    placeholder="Reward"
                    placeholderTextColor={colors.textMuted}
                    value={manualBonus.reason}
                    onChangeText={(val) =>
                      setManualBonus({ ...manualBonus, reason: val })
                    }
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleGrantManualBonus}
                disabled={savingBonus}
                style={[
                  styles.saveBtn,
                  { backgroundColor: "#8B5CF6", marginTop: 15, height: 48 },
                ]}
              >
                <Text style={styles.saveBtnText}>
                  {tr("GRANT BONUS", "ACCORDER", "إسناد")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 30 }}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {tr("Recent Bonuses", "Bonus Récents", "آخر المكافآت")}
              </Text>
              {loadingBonusHistory ? (
                <ActivityIndicator
                  style={{ marginTop: 20 }}
                  color={colors.primary}
                />
              ) : (
                bonusHistory.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.bonusHistoryItem,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.03)"
                          : "#F9FAFB",
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.bonusHistoryText,
                          { color: colors.foreground },
                        ]}
                      >
                        User: {item.actorId?.slice(0, 8)} - {item.diamonds} 💎
                      </Text>
                      <Text
                        style={[
                          styles.bonusHistoryReason,
                          { color: colors.textMuted },
                        ]}
                      >
                        {item.reason}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.bonusHistoryDate,
                        { color: colors.textMuted },
                      ]}
                    >
                      {item.createdAt?.toDate
                        ? item.createdAt.toDate().toLocaleDateString()
                        : ""}
                    </Text>
                  </View>
                ))
              )}
              {bonusHistory.length === 0 && !loadingBonusHistory && (
                <Text
                  style={{
                    textAlign: "center",
                    color: colors.textMuted,
                    marginTop: 20,
                  }}
                >
                  {tr(
                    "No bonus history found",
                    "Aucun historique de bonus",
                    "لا يوجد سجل مكافآت",
                  )}
                </Text>
              )}
            </View>
          </View>
        ) : activeTab === "recharges" ? (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {tr("Recent Recharges", "Recharges Récents", "آخر عمليات الشحن")}
            </Text>
            {loadingRecharges ? (
              <ActivityIndicator
                style={{ marginTop: 20 }}
                color={"#10B981"}
              />
            ) : rechargeHistory.length === 0 ? (
              <Text
                style={{
                  textAlign: "center",
                  color: colors.textMuted,
                  marginTop: 20,
                }}
              >
                {tr(
                  "No recharge history found",
                  "Aucun historique de recharge",
                  "لا يوجد سجل شحن",
                )}
              </Text>
            ) : (
              rechargeHistory.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.rechargeCard,
                    {
                      backgroundColor: isDark
                        ? "rgba(16,185,129,0.06)"
                        : "#F0FDF4",
                      borderColor: "#10B98130",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.wdIcon,
                      { backgroundColor: "#10B98115", marginRight: 12 },
                    ]}
                  >
                    <CreditCard size={18} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.bonusHistoryText,
                        { color: colors.foreground },
                      ]}
                    >
                      User: {item.actorId?.slice(0, 8) || item.userId?.slice(0, 8) || "??"}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                      {item.amountEUR != null && (
                        <Text
                          style={[
                            styles.bonusHistoryReason,
                            { color: "#10B981", fontWeight: "700" },
                          ]}
                        >
                          +{Number(item.amountEUR).toFixed(2)} EUR
                        </Text>
                      )}
                      {item.amountTND != null && (
                        <Text
                          style={[
                            styles.bonusHistoryReason,
                            { color: colors.textMuted },
                          ]}
                        >
                          ({Number(item.amountTND).toFixed(2)} TND)
                        </Text>
                      )}
                      {item.coins != null && (
                        <Text
                          style={[
                            styles.bonusHistoryReason,
                            { color: colors.primary },
                          ]}
                        >
                          🪙 {item.coins}
                        </Text>
                      )}
                    </View>
                    {item.method && (
                      <Text
                        style={[
                          styles.bonusHistoryReason,
                          { color: colors.textMuted, marginTop: 2 },
                        ]}
                      >
                        {item.method.toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.bonusHistoryDate,
                      { color: colors.textMuted },
                    ]}
                  >
                    {item.createdAt?.toDate
                      ? item.createdAt.toDate().toLocaleDateString()
                      : ""}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : (
          <View>
            {withdrawalRequests.length === 0 ? (
              <View
                style={[
                  styles.emptyState,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.03)"
                      : "#F9FAFB",
                  },
                ]}
              >
                <CheckCircle size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {tr(
                    "No pending withdrawal requests",
                    "Aucune demande en attente",
                    "لا توجد طلبات سحب",
                  )}
                </Text>
              </View>
            ) : (
              withdrawalRequests.map((req) => (
                <View
                  key={req.id}
                  style={[
                    styles.wdCard,
                    {
                      backgroundColor: isDark ? "#1C1C1E" : "#FFF",
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.wdCardTop}>
                    <View
                      style={[
                        styles.wdIcon,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                    >
                      <DollarSign size={20} color={colors.primary} />
                    </View>
                    <View style={styles.wdInfo}>
                      <Text
                        style={[styles.wdAmount, { color: colors.foreground }]}
                      >
                        {req.amount.toFixed(2)} TND
                        {req.actorType === "customer" && (
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "400",
                              color: colors.textMuted,
                            }}
                          >
                            {" "}
                            ({Math.round(req.amount * 100)} Diamonds)
                          </Text>
                        )}
                      </Text>
                      <Text
                        style={[styles.wdBrand, { color: colors.textMuted }]}
                      >
                        {req.actorType === "brand"
                          ? `Brand: ${req.brandName || req.actorId}`
                          : `Actor: ${req.actorType} (${req.actorId.slice(0, 8)})`}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 4,
                          gap: 8,
                        }}
                      >
                        {req.method && (
                          <Text
                            style={[styles.wdMethod, { color: colors.primary }]}
                          >
                            {req.method.toUpperCase()}
                          </Text>
                        )}
                        <Text
                          style={[styles.wdMethod, { color: colors.textMuted }]}
                        >
                          ≈ {req.payoutAmount.toFixed(2)} {req.payoutCurrency}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.wdActions}>
                    <TouchableOpacity
                      style={[styles.wdBtn, { backgroundColor: "#10B98115" }]}
                      onPress={() => handleApproveWithdrawal(req)}
                    >
                      <CheckCircle size={16} color="#10B981" />
                      <Text style={[styles.wdBtnText, { color: "#10B981" }]}>
                        {tr("Approve", "Approuver", "قبول")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.wdBtn, { backgroundColor: "#EF444415" }]}
                      onPress={() => handleRejectWithdrawal(req)}
                    >
                      <XCircle size={16} color="#EF4444" />
                      <Text style={[styles.wdBtnText, { color: "#EF4444" }]}>
                        {tr("Reject", "Rejeter", "رفض")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function BonusCard({
  title,
  subtitle,
  enabled,
  onToggle,
  bonus,
  onBonusChange,
  threshold,
  onThresholdChange,
  colors,
  isDark,
  tr,
}: {
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: (val: boolean) => void;
  bonus: number;
  onBonusChange: (val: string) => void;
  threshold?: number;
  onThresholdChange?: (val: string) => void;
  colors: any;
  isDark: boolean;
  tr: any;
}) {
  return (
    <View
      style={[
        styles.bonusCard,
        { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB" },
      ]}
    >
      <View style={styles.bonusHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bonusTitle, { color: colors.foreground }]}>
            {title}
          </Text>
          <Text style={[styles.bonusSubtitle, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        </View>
        <Switch value={enabled} onValueChange={onToggle} />
      </View>

      <View style={styles.bonusInputs}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
            {tr("Bonus %", "Bonus %", "نسبة المكافأة")}
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.foreground },
            ]}
            value={(bonus ?? 0).toString()}
            onChangeText={onBonusChange}
            keyboardType="numeric"
          />
        </View>
        {threshold !== undefined && (
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
              {tr("Threshold (TND)", "Seuil (TND)", "العتبة (دت)")}
            </Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.foreground },
              ]}
              value={(threshold ?? 0).toString()}
              onChangeText={onThresholdChange}
              keyboardType="numeric"
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 8,
  },
  tabText: { fontSize: 14, fontWeight: "700" },
  badge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "900" },
  content: { paddingHorizontal: 20, paddingBottom: 100 },

  // Bonus styles
  bonusCard: { padding: 16, borderRadius: 20, marginBottom: 16 },
  bonusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  bonusTitle: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  bonusSubtitle: { fontSize: 12 },
  bonusInputs: { flexDirection: "row" },
  inputLabel: { fontSize: 11, fontWeight: "700", marginBottom: 6 },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontWeight: "700",
  },
  saveBtn: {
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "900" },

  // Withdrawal styles
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderRadius: 20,
    marginTop: 20,
  },
  emptyText: { marginTop: 12, fontSize: 14, fontWeight: "600" },
  wdCard: { borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1 },
  wdCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 15,
  },
  wdIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  wdInfo: { flex: 1 },
  wdAmount: { fontSize: 18, fontWeight: "900" },
  wdBrand: { fontSize: 12, marginTop: 2 },
  wdMethod: { fontSize: 10, fontWeight: "800", marginTop: 4 },
  wdActions: { flexDirection: "row", gap: 10 },
  wdBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  wdBtnText: { fontSize: 13, fontWeight: "700" },

  // Missing Styles
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 15 },
  bonusHistoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 15,
    marginBottom: 8,
    borderWidth: 1,
  },
  bonusHistoryText: { fontSize: 14, fontWeight: "700" },
  bonusHistoryReason: { fontSize: 12, marginTop: 2 },
  rechargeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 15,
    marginBottom: 8,
    borderWidth: 1,
  },
  bonusHistoryDate: { fontSize: 10 },
});
