import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  TextInput,
  Dimensions,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../api/firebase";
import {
  ChevronLeft,
  Check,
  X,
  Eye,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Instagram,
  Facebook,
  MessageCircle,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  ZoomIn,
  AlertTriangle,
  ChevronRight,
  Users,
  Tag,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react-native";
import { Theme } from "../../theme";

const { width: W, height: H } = Dimensions.get("window");

interface VendorApplication {
  id: string;
  userId: string;
  tier: string;
  accountType?: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessDescription: string;
  businessCategory: string;
  taxId?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
  documents?: {
    businessLicense?: string;
    idCardFront?: string;
    idCardBack?: string;
    storeFront?: string;
  };
  paymentProof?: string;
  paymentMethod?: string;
  status: "pending" | "approved" | "rejected" | "payment_pending" | "active";
  rejectionReason?: string;
  createdAt: any;
  updatedAt: any;
  // Fetched from users collection
  profileName?: string;
}

interface AdminVendorApplicationsScreenProps {
  onBack: () => void;
  t: (key: string) => string;
  theme: "light" | "dark";
}

const TIER_COLORS: Record<string, string> = {
  starter: "#6C63FF",
  pro: "#F59E0B",
  professional: "#F59E0B",
  elite: "#EF4444",
  business: "#10B981",
};

export default function AdminVendorApplicationsScreen({
  onBack,
  t,
  theme,
}: AdminVendorApplicationsScreenProps) {
  const isDark = theme === "dark";
  const colors = isDark ? Theme.dark.colors : Theme.light.colors;
  const insets = useSafeAreaInsets();
  const accent = colors.foreground;
  const accentFg = colors.primaryForeground;

  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; label: string } | null>(null);

  // Rejection flow
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingRejectApp, setPendingRejectApp] = useState<VendorApplication | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "active">("all");

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      const q = query(collection(db, "vendorApplications"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const apps: VendorApplication[] = [];
      snapshot.forEach((d) => apps.push({ id: d.id, ...d.data() } as VendorApplication));

      // Fetch profile names from users collection
      const appsWithNames = await Promise.all(
        apps.map(async (app) => {
          try {
            const userDoc = await getDoc(doc(db, "users", app.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                ...app,
                profileName: userData.displayName || userData.fullName || userData.name || "",
              };
            }
          } catch (e) {
            // silently fail
          }
          return app;
        })
      );

      setApplications(appsWithNames);
    } catch (error) {
      console.error("Error fetching vendor applications:", error);
      Alert.alert(t("error") || "Error", t("adminVendorLoadError") || "Failed to load vendor applications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => { setRefreshing(true); fetchApplications(); };

  const handleApprove = async (application: VendorApplication) => {
    Alert.alert(
      t("adminVendorApproveTitle") || "Approve",
      `${t("adminVendorApproveMsg") || "Approve the application of"} "${application.businessName}" ?`,
      [
        { text: t("cancel") || "Cancel", style: "cancel" },
        {
          text: t("adminVendorApproveBtn") || "Approve",
          onPress: async () => {
            setActionLoading(true);
            try {
              await updateDoc(doc(db, "vendorApplications", application.id), {
                status: "approved",
                updatedAt: new Date(),
              });
              await updateDoc(doc(db, "users", application.userId), {
                role: "vendor",
                vendorData: {
                  businessName: application.businessName,
                  tier: application.tier,
                  status: "approved",
                },
              });
              Alert.alert(
                t("adminVendorApprovedTitle") || "Approved",
                `${application.businessName} ${t("adminVendorApprovedMsg") || "has been approved."}`
              );
              fetchApplications();
              setSelectedApp(null);
            } catch (error: any) {
              console.error("Error approving vendor:", error);
              Alert.alert(t("error") || "Error", error.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  // Activate plan (final step after payment proof is confirmed)
  const handleActivatePlan = async (application: VendorApplication) => {
    Alert.alert(
      t("adminVendorActivateTitle") || "Activate Plan",
      `${t("adminVendorActivateMsg") || "Activate the plan for"} "${application.businessName}" ?`,
      [
        { text: t("cancel") || "Cancel", style: "cancel" },
        {
          text: t("adminVendorActivateBtn") || "Activate",
          onPress: async () => {
            setActionLoading(true);
            try {
              await updateDoc(doc(db, "vendorApplications", application.id), {
                status: "active",
                updatedAt: new Date(),
              });
              await updateDoc(doc(db, "users", application.userId), {
                vendorData: {
                  businessName: application.businessName,
                  tier: application.tier,
                  status: "active",
                  planActivatedAt: new Date(),
                },
              });
              Alert.alert(
                t("adminVendorActivatedTitle") || "Activated",
                `${application.businessName} ${t("adminVendorActivatedMsg") || "plan is now active."}`
              );
              fetchApplications();
              setSelectedApp(null);
            } catch (error: any) {
              console.error("Error activating vendor plan:", error);
              Alert.alert(t("error") || "Error", error.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const openRejectModal = (application: VendorApplication) => {
    setPendingRejectApp(application);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!pendingRejectApp) return;
    if (!rejectionReason.trim()) {
      Alert.alert(t("adminVendorRejectReasonRequired") || "Required", t("adminVendorRejectReasonMsg") || "Please enter a rejection reason.");
      return;
    }
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "vendorApplications", pendingRejectApp.id), {
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
        updatedAt: new Date(),
      });
      await updateDoc(doc(db, "users", pendingRejectApp.userId), {
        vendorData: {
          businessName: pendingRejectApp.businessName,
          tier: pendingRejectApp.tier,
          status: "rejected",
          rejectionReason: rejectionReason.trim(),
        },
      });
      setShowRejectModal(false);
      setSelectedApp(null);
      Alert.alert(t("adminVendorRejectedTitle") || "Rejected", t("adminVendorRejectedMsg") || "The application has been rejected.");
      fetchApplications();
    } catch (error: any) {
      console.error("Error rejecting vendor:", error);
      Alert.alert(t("error") || "Error", error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "pending") return "#F59E0B";
    if (status === "approved") return "#3B82F6";
    if (status === "active") return "#10B981";
    if (status === "rejected") return "#EF4444";
    return colors.textMuted;
  };

  const getStatusIcon = (status: string) => {
    if (status === "pending") return <Clock size={14} color="#F59E0B" />;
    if (status === "approved") return <CheckCircle size={14} color="#3B82F6" />;
    if (status === "active") return <ShieldCheck size={14} color="#10B981" />;
    if (status === "rejected") return <XCircle size={14} color="#EF4444" />;
    return null;
  };

  const getStatusLabel = (status: string) => {
    if (status === "pending") return t("adminStatusPending") || "Pending";
    if (status === "approved") return t("adminStatusApproved") || "Approved";
    if (status === "active") return t("adminStatusActive") || "Active";
    if (status === "rejected") return t("adminStatusRejected") || "Rejected";
    return status;
  };

  const getAccountTypeLabel = (type: string | undefined) => {
    if (!type) return "—";
    return t(type) || type;
  };

  const getTierColor = (tier: string) => TIER_COLORS[tier?.toLowerCase()] || "#6C63FF";

  const filteredApps = filter === "all" ? applications : applications.filter(a => a.status === filter);

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    approved: applications.filter(a => a.status === "approved").length,
    active: applications.filter(a => a.status === "active").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>{t("loading") || "Loading..."}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {t("vendorApplications") || "Vendor Applications"}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }}>
            {counts.pending} {t("adminPendingLabel") || "pending"} · {counts.all} {t("adminTotalLabel") || "total"}
          </Text>
        </View>
        <View style={[styles.pendingBadge, { backgroundColor: "#F59E0B" + (counts.pending > 0 ? "20" : "10") }]}>
          <Text style={{ color: "#F59E0B", fontWeight: "700", fontSize: 13 }}>{counts.pending}</Text>
        </View>
      </View>

      {selectedApp ? (
        /* ─── Detail View ─── */
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Back to list */}
          <TouchableOpacity style={styles.backToList} onPress={() => setSelectedApp(null)}>
            <ChevronLeft size={16} color={accent} />
            <Text style={{ color: accent, fontSize: 14, fontWeight: "600" }}>{t("adminBackToList") || "Back to list"}</Text>
          </TouchableOpacity>

          {/* Hero Card */}
          <View style={[styles.heroCard, { backgroundColor: isDark ? "#141420" : "#F8F8FF", borderColor: getTierColor(selectedApp.tier) + "40" }]}>
            <View style={[styles.heroAvatar, { backgroundColor: getTierColor(selectedApp.tier) + "20" }]}>
              <Store size={28} color={getTierColor(selectedApp.tier)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroName, { color: colors.foreground }]}>{selectedApp.businessName}</Text>
              {/* Profile name */}
              {selectedApp.profileName ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <User size={13} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "500" }}>
                    {selectedApp.profileName}
                  </Text>
                </View>
              ) : null}
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
                <View style={[styles.statusChip, { backgroundColor: getStatusColor(selectedApp.status) + "20" }]}>
                  {getStatusIcon(selectedApp.status)}
                  <Text style={{ color: getStatusColor(selectedApp.status), fontWeight: "700", fontSize: 12, marginLeft: 4 }}>
                    {getStatusLabel(selectedApp.status)}
                  </Text>
                </View>
                <View style={[styles.tierChip, { backgroundColor: getTierColor(selectedApp.tier) + "20" }]}>
                  <Tag size={12} color={getTierColor(selectedApp.tier)} />
                  <Text style={{ color: getTierColor(selectedApp.tier), fontWeight: "700", fontSize: 12, marginLeft: 4 }}>
                    {selectedApp.tier?.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Rejection reason if rejected */}
          {selectedApp.status === "rejected" && selectedApp.rejectionReason && (
            <View style={[styles.rejectionCard, { backgroundColor: isDark ? "#200A0A" : "#FFF5F5", borderColor: "#EF4444" + "40" }]}>
              <AlertTriangle size={18} color="#EF4444" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 13, marginBottom: 4 }}>{t("rejectionReason") || "Rejection reason"}</Text>
                <Text style={{ color: isDark ? "#FCA5A5" : "#7F1D1D", fontSize: 14, lineHeight: 20 }}>
                  {selectedApp.rejectionReason}
                </Text>
              </View>
            </View>
          )}

          {/* Info Grid */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("adminInfoSection") || "Information"}</Text>

            {/* Profile Name */}
            {selectedApp.profileName ? (
              <InfoRow icon={<User size={16} color={colors.textMuted} />} label={t("adminProfileName") || "Profile"} value={selectedApp.profileName} colors={colors} />
            ) : null}
            <InfoRow icon={<User size={16} color={colors.textMuted} />} label={t("adminUserId") || "User ID"} value={selectedApp.userId} small colors={colors} />
            <InfoRow icon={<Mail size={16} color={colors.textMuted} />} label={t("email") || "Email"} value={selectedApp.businessEmail} colors={colors} />
            <InfoRow icon={<Phone size={16} color={colors.textMuted} />} label={t("phone") || "Phone"} value={selectedApp.businessPhone} colors={colors} />
            <InfoRow icon={<MapPin size={16} color={colors.textMuted} />} label={t("shippingAddress") || "Address"} value={selectedApp.businessAddress} colors={colors} />
            <InfoRow icon={<Tag size={16} color={colors.textMuted} />} label={t("category") || "Category"} value={selectedApp.businessCategory} colors={colors} />
            {selectedApp.accountType && (
              <InfoRow icon={<Users size={16} color={colors.textMuted} />} label={t("accountType") || "Type"} value={getAccountTypeLabel(selectedApp.accountType)} colors={colors} />
            )}
            {selectedApp.taxId && (
              <InfoRow icon={<FileText size={16} color={colors.textMuted} />} label={t("adminTaxId") || "Tax ID"} value={selectedApp.taxId} colors={colors} />
            )}
            {selectedApp.paymentMethod && (
              <InfoRow icon={<CreditCard size={16} color={colors.textMuted} />} label={t("paymentMethod") || "Payment"} value={selectedApp.paymentMethod} colors={colors} />
            )}
          </View>

          {/* Description */}
          {selectedApp.businessDescription ? (
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("description") || "Description"}</Text>
              <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 22 }}>{selectedApp.businessDescription}</Text>
            </View>
          ) : null}

          {/* Social Media */}
          {selectedApp.socialMedia && (selectedApp.socialMedia.instagram || selectedApp.socialMedia.facebook || selectedApp.socialMedia.whatsapp) && (
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("socialMedia") || "Social Media"}</Text>
              {selectedApp.socialMedia.instagram && (
                <View style={styles.socialRow}>
                  <Instagram size={16} color="#E1306C" />
                  <Text style={{ color: colors.foreground, fontSize: 14, marginLeft: 8 }}>{selectedApp.socialMedia.instagram}</Text>
                </View>
              )}
              {selectedApp.socialMedia.facebook && (
                <View style={styles.socialRow}>
                  <Facebook size={16} color="#1877F2" />
                  <Text style={{ color: colors.foreground, fontSize: 14, marginLeft: 8 }}>{selectedApp.socialMedia.facebook}</Text>
                </View>
              )}
              {selectedApp.socialMedia.whatsapp && (
                <View style={styles.socialRow}>
                  <MessageCircle size={16} color="#25D366" />
                  <Text style={{ color: colors.foreground, fontSize: 14, marginLeft: 8 }}>{selectedApp.socialMedia.whatsapp}</Text>
                </View>
              )}
            </View>
          )}

          {/* Documents */}
          {selectedApp.documents && (
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("adminDocuments") || "Documents"}</Text>

              {[
                { key: "idCardFront", label: t("idCardFront") || "ID Front", icon: <User size={16} color={accent} />, url: selectedApp.documents.idCardFront },
                { key: "idCardBack", label: t("idCardBack") || "ID Back", icon: <User size={16} color={accent} />, url: selectedApp.documents.idCardBack },
                { key: "businessLicense", label: t("adminBusinessLicense") || "Business License", icon: <FileText size={16} color={accent} />, url: selectedApp.documents.businessLicense },
                { key: "storeFront", label: t("adminStoreFront") || "Store Photo", icon: <Building2 size={16} color={accent} />, url: selectedApp.documents.storeFront },
              ].filter(d => d.url).map((docItem) => (
                <TouchableOpacity
                  key={docItem.key}
                  style={[styles.docCard, { backgroundColor: isDark ? "#0D0D1A" : "#F5F5FF", borderColor: accent + "30" }]}
                  onPress={() => setSelectedImage({ uri: docItem.url!, label: docItem.label })}
                  activeOpacity={0.8}
                >
                  <View style={[styles.docThumbWrap, { backgroundColor: accent + "15" }]}>
                    <Image
                      source={{ uri: docItem.url! }}
                      style={styles.docThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.thumbOverlay}>
                      <ZoomIn size={16} color="#FFF" />
                    </View>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      {docItem.icon}
                      <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>
                        {docItem.label}
                      </Text>
                    </View>
                    <Text style={{ color: accent, fontSize: 12, marginTop: 3 }}>{t("adminTapToZoom") || "Tap to zoom"}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}

              {!selectedApp.documents.idCardFront && !selectedApp.documents.idCardBack && !selectedApp.documents.businessLicense && !selectedApp.documents.storeFront && (
                <Text style={{ color: colors.textMuted, fontSize: 13, fontStyle: "italic" }}>{t("adminNoDocuments") || "No documents uploaded"}</Text>
              )}
            </View>
          )}

          {/* Payment Proof */}
          {selectedApp.paymentProof && (
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("adminPaymentProof") || "Payment Proof"}</Text>
              <TouchableOpacity
                style={[styles.docCard, { backgroundColor: isDark ? "#0D1A0D" : "#F0FFF4", borderColor: "#10B981" + "40" }]}
                onPress={() => setSelectedImage({ uri: selectedApp.paymentProof!, label: t("adminPaymentProof") || "Payment Proof" })}
                activeOpacity={0.8}
              >
                <View style={[styles.docThumbWrap, { backgroundColor: "#10B981" + "15" }]}>
                  <Image source={{ uri: selectedApp.paymentProof }} style={styles.docThumb} resizeMode="cover" />
                  <View style={styles.thumbOverlay}>
                    <ZoomIn size={16} color="#FFF" />
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <CreditCard size={16} color="#10B981" />
                    <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>{t("adminPaymentReceipt") || "Payment Receipt"}</Text>
                  </View>
                  <Text style={{ color: "#10B981", fontSize: 12, marginTop: 3 }}>{t("adminTapToZoom") || "Tap to zoom"}</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons — Pending: Approve / Reject */}
          {selectedApp.status === "pending" && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
                onPress={() => handleApprove(selectedApp)}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Check size={20} color="#FFF" />}
                <Text style={styles.actionBtnTxt}>{t("adminVendorApproveBtn") || "Approve"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#EF4444" }]}
                onPress={() => openRejectModal(selectedApp)}
                disabled={actionLoading}
              >
                <X size={20} color="#FFF" />
                <Text style={styles.actionBtnTxt}>{t("adminVendorRejectBtn") || "Reject"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Button — Approved with payment proof: Activate Plan */}
          {selectedApp.status === "approved" && selectedApp.paymentProof && (
            <TouchableOpacity
              style={[styles.activateBtn, { backgroundColor: "#10B981" }]}
              onPress={() => handleActivatePlan(selectedApp)}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <ShieldCheck size={22} color="#FFF" />
              )}
              <Text style={styles.activateBtnTxt}>{t("adminVendorActivateBtn") || "Activate Plan"}</Text>
            </TouchableOpacity>
          )}

          {/* Approved but no payment proof yet */}
          {selectedApp.status === "approved" && !selectedApp.paymentProof && (
            <View style={[styles.waitingPaymentCard, { backgroundColor: isDark ? "#1A1A10" : "#FFFBEB", borderColor: "#F59E0B40" }]}>
              <Clock size={20} color="#F59E0B" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: "#F59E0B", fontWeight: "700", fontSize: 14, marginBottom: 4 }}>{t("adminWaitingPayment") || "Waiting for payment proof"}</Text>
                <Text style={{ color: isDark ? "#FDE68A" : "#92400E", fontSize: 13, lineHeight: 19 }}>
                  {t("adminWaitingPaymentDesc") || "The vendor has been approved. Waiting for them to upload payment proof to activate their plan."}
                </Text>
              </View>
            </View>
          )}

          {/* Active badge */}
          {selectedApp.status === "active" && (
            <View style={[styles.activeBadgeCard, { backgroundColor: isDark ? "#0A1A0A" : "#F0FFF4", borderColor: "#10B98140" }]}>
              <BadgeCheck size={24} color="#10B981" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: "#10B981", fontWeight: "800", fontSize: 15 }}>{t("adminPlanActive") || "Plan Active"}</Text>
                <Text style={{ color: isDark ? "#A7F3D0" : "#166534", fontSize: 13, marginTop: 4, lineHeight: 19 }}>
                  {t("adminPlanActiveDesc") || "This vendor's plan is confirmed and active."}
                </Text>
              </View>
            </View>
          )}

        </ScrollView>
      ) : (
        /* ─── List View ─── */
        <>
          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {([
              { key: "all" as const, label: `${t("all") || "All"} (${counts.all})` },
              { key: "pending" as const, label: `${t("adminStatusPending") || "Pending"} (${counts.pending})` },
              { key: "approved" as const, label: `${t("adminStatusApproved") || "Approved"} (${counts.approved})` },
              { key: "active" as const, label: `${t("adminStatusActive") || "Active"} (${counts.active})` },
              { key: "rejected" as const, label: `${t("adminStatusRejected") || "Rejected"} (${counts.rejected})` },
            ]).map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, { backgroundColor: filter === f.key ? accent : isDark ? "#1C1C2A" : "#F0F0F5" }]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.filterChipTxt, { color: filter === f.key ? accentFg : colors.textMuted }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            style={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={accent} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {filteredApps.length === 0 ? (
              <View style={styles.emptyState}>
                <Store size={48} color={colors.textMuted} style={{ opacity: 0.4 }} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t("noVendorApplications") || "No applications"}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center" }}>
                  {filter === "all"
                    ? t("adminNoAppsAll") || "No vendor applications yet."
                    : `${t("adminNoAppsFilter") || "No applications with status"} "${getStatusLabel(filter)}".`
                  }
                </Text>
              </View>
            ) : (
              filteredApps.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={[styles.appCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setSelectedApp(app)}
                  activeOpacity={0.85}
                >
                  {/* Left accent bar */}
                  <View style={[styles.cardAccentBar, { backgroundColor: getStatusColor(app.status) }]} />

                  <View style={{ flex: 1, paddingLeft: 12 }}>
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.appName, { color: colors.foreground }]}>{app.businessName}</Text>
                        {/* Profile name in the list */}
                        {app.profileName ? (
                          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 2 }}>
                            {app.profileName}
                          </Text>
                        ) : null}
                        <Text style={[styles.appEmail, { color: colors.textMuted }]}>{app.businessEmail}</Text>
                      </View>
                      <View style={[styles.statusChip, { backgroundColor: getStatusColor(app.status) + "20" }]}>
                        {getStatusIcon(app.status)}
                        <Text style={{ color: getStatusColor(app.status), fontWeight: "700", fontSize: 11, marginLeft: 4 }}>
                          {getStatusLabel(app.status)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardMeta}>
                      <View style={[styles.tierBadge, { backgroundColor: getTierColor(app.tier) + "20" }]}>
                        <Text style={{ color: getTierColor(app.tier), fontWeight: "700", fontSize: 10 }}>
                          {app.tier?.toUpperCase()}
                        </Text>
                      </View>
                      {app.accountType && (
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{getAccountTypeLabel(app.accountType)}</Text>
                      )}
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{app.businessCategory}</Text>
                      {app.documents && (Object.values(app.documents).filter(Boolean).length > 0) && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                          <ImageIcon size={11} color={colors.textMuted} />
                          <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                            {Object.values(app.documents).filter(Boolean).length} {t("adminDocsCount") || "docs"}
                          </Text>
                        </View>
                      )}
                      {app.paymentProof && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                          <CreditCard size={11} color="#10B981" />
                          <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "600" }}>
                            {t("adminPaymentProofShort") || "Payment"}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <ChevronRight size={18} color={colors.textMuted} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </>
      )}

      {/* ─── Image Full-Screen Viewer Modal ─── */}
      <Modal visible={!!selectedImage} transparent animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity style={styles.imageModalClose} onPress={() => setSelectedImage(null)}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          {selectedImage && (
            <>
              <Text style={styles.imageModalLabel}>{selectedImage.label}</Text>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </>
          )}
        </View>
      </Modal>

      {/* ─── Rejection Reason Modal ─── */}
      <Modal visible={showRejectModal} transparent animationType="slide" onRequestClose={() => setShowRejectModal(false)}>
        <View style={styles.rejectModalOverlay}>
          <View style={[styles.rejectModal, { backgroundColor: isDark ? "#1A1A2E" : "#FFF" }]}>
            <View style={styles.rejectModalHeader}>
              <AlertTriangle size={24} color="#EF4444" />
              <Text style={[styles.rejectModalTitle, { color: isDark ? "#FFF" : "#111" }]}>
                {t("rejectionReason") || "Rejection reason"}
              </Text>
            </View>
            <Text style={{ color: isDark ? "#AAA" : "#666", fontSize: 14, marginBottom: 16 }}>
              {t("adminRejectModalDesc") || "This message will be visible to the vendor to correct their application."}
            </Text>
            <TextInput
              style={[styles.rejectInput, {
                backgroundColor: isDark ? "#0D0D1A" : "#F8F8F8",
                color: isDark ? "#FFF" : "#111",
                borderColor: isDark ? "#333" : "#DDD",
              }]}
              placeholder={t("adminRejectPlaceholder") || "e.g. Insufficient documents, unreadable photos, missing information..."}
              placeholderTextColor={isDark ? "#555" : "#AAA"}
              multiline
              numberOfLines={5}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              textAlignVertical="top"
            />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.rejectCancelBtn, { borderColor: isDark ? "#333" : "#DDD" }]}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={{ color: isDark ? "#AAA" : "#666", fontWeight: "600" }}>{t("cancel") || "Cancel"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectConfirmBtn, { opacity: actionLoading ? 0.6 : 1 }]}
                onPress={handleRejectConfirm}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <X size={18} color="#FFF" />
                }
                <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 15, marginLeft: 6 }}>
                  {t("adminConfirmReject") || "Confirm Rejection"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper row component
function InfoRow({ icon, label, value, small, colors }: any) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text
        style={[styles.infoValue, { color: colors.foreground, fontSize: small ? 11 : 14 }]}
        numberOfLines={small ? 1 : 2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 6, borderRadius: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  pendingBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  // Filter tabs
  filterRow: { flexGrow: 0, paddingVertical: 12 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterChipTxt: { fontSize: 13, fontWeight: "600" },

  // App card (list)
  appCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    overflow: "hidden",
    paddingRight: 12,
    paddingVertical: 14,
  },
  cardAccentBar: { width: 4, alignSelf: "stretch", borderRadius: 4 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  appName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  appEmail: { fontSize: 12 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },

  // Status chips
  statusChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tierChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },

  // Empty state
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },

  // Back to list
  backToList: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 },

  // Hero card (detail)
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 14,
    gap: 14,
  },
  heroAvatar: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  heroName: { fontSize: 20, fontWeight: "700" },

  // Rejection warning card
  rejectionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 14,
  },

  // Info card
  infoCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 14 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  infoIcon: { width: 24, alignItems: "center" },
  infoLabel: { width: 85, fontSize: 13, fontWeight: "500" },
  infoValue: { flex: 1, fontWeight: "500" },

  // Social
  socialRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },

  // Document cards with thumbnail
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  docThumbWrap: { width: 60, height: 60, borderRadius: 10, overflow: "hidden" },
  docThumb: { width: 60, height: 60 },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Action buttons
  actionRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  actionBtnTxt: { color: "#FFF", fontSize: 16, fontWeight: "700" },

  // Activate plan button
  activateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 12,
    gap: 10,
  },
  activateBtnTxt: { color: "#FFF", fontSize: 17, fontWeight: "800" },

  // Waiting for payment card
  waitingPaymentCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 12,
  },

  // Active badge card
  activeBadgeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 12,
  },

  // Image modal
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageModalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 10,
  },
  imageModalLabel: {
    position: "absolute",
    top: 55,
    left: 20,
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  fullScreenImage: { width: W - 32, height: H * 0.75, borderRadius: 16 },

  // Reject modal
  rejectModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  rejectModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  rejectModalHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  rejectModalTitle: { fontSize: 18, fontWeight: "700" },
  rejectInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 130,
  },
  rejectCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  rejectConfirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#EF4444",
  },
});
