import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Plus,
  UserPlus,
  Trash2,
  Users as UsersIcon,
  Shield,
  Mail,
  ChevronDown,
} from "lucide-react-native";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../../api/firebase";
import { useAppTheme } from "../../context/ThemeContext";
import {
  AdminCard,
  AdminHeader,
  AdminInput,
  AdminButton,
  EmptyState,
} from "../../components/admin/AdminUI";

const { width } = Dimensions.get("window");

export default function AdminVendorTeamScreen({ onBack, t, profileData }: any) {
  const { colors, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === "dark";
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("support");
  const [searchLoading, setSearchLoading] = useState(false);
  const [editingRoleMember, setEditingRoleMember] = useState<string | null>(
    null,
  );

  const roles = [
    { id: "manager", label: t("manager") || "Manager" },
    { id: "support", label: t("supportRole") || "Support" },
    { id: "orders", label: t("ordersManager") || "Orders" },
    { id: "viewer", label: t("viewer") || "Viewer" },
  ];

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      // Get vendor ID (if team member, use owner ID)
      const vendorId = profileData?.vendorOwnerId || profileData?.uid;
      if (!vendorId) return;

      const vendorDoc = await getDoc(doc(db, "users", vendorId));
      const vendorData = vendorDoc.data()?.vendorData || {};
      const memberIds = vendorData.team || [];

      if (memberIds.length === 0) {
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      // Fetch each member's details
      const members = [];
      for (const id of memberIds) {
        const uDoc = await getDoc(doc(db, "users", id));
        if (uDoc.exists()) {
          members.push({ uid: id, ...uDoc.data() });
        }
      }
      setTeamMembers(members);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    const vendorId = profileData?.vendorOwnerId || profileData?.uid;
    if (!newMemberEmail.trim() || !vendorId) return;

    setSearchLoading(true);
    try {
      // Search for user by email
      const q = query(
        collection(db, "users"),
        where("email", "==", newMemberEmail.toLowerCase().trim()),
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        Alert.alert(t("userNotFound"));
        return;
      }

      const userToAdd = snap.docs[0];
      const userData = userToAdd.data();
      const uid = userToAdd.id;

      if (teamMembers.some((m) => m.uid === uid)) {
        Alert.alert(t("alreadyInTeam"));
        return;
      }

      // Update the team member's role and vendor association
      await updateDoc(doc(db, "users", uid), {
        role: "vendor_support",
        vendorTeamRole: selectedRole,
        vendorOwnerId: vendorId,
        vendorStoreId: profileData?.vendorData?.storeId || null,
      });

      // Add member to the vendor's team list
      const vendorDocRef = doc(db, "users", vendorId);
      await updateDoc(vendorDocRef, {
        "vendorData.team": arrayUnion(uid),
      });

      setTeamMembers([
        ...teamMembers,
        { uid, ...userData, vendorTeamRole: selectedRole },
      ]);
      setNewMemberEmail("");
      setSelectedRole("support");
      setAddingMember(false);
      Alert.alert(t("memberAddedSuccess"));
    } catch (err) {
      console.error(err);
      Alert.alert(t("error"));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", uid), {
        vendorTeamRole: newRole,
      });
      setTeamMembers(
        teamMembers.map((m) =>
          m.uid === uid ? { ...m, vendorTeamRole: newRole } : m,
        ),
      );
      setEditingRoleMember(null);
      Alert.alert(t("roleUpdatedSuccess") || "Role updated");
    } catch (err) {
      console.error(err);
      Alert.alert(t("error"));
    }
  };

  const handleRemoveMember = (uid: string) => {
    Alert.alert(t("confirmRemoveMember"), "", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          const vendorId = profileData?.vendorOwnerId || profileData?.uid;
          if (!vendorId) return;
          try {
            // Remove from vendor's list
            await updateDoc(doc(db, "users", vendorId), {
              "vendorData.team": arrayRemove(uid),
            });

            // Reset user's role
            await updateDoc(doc(db, "users", uid), {
              role: "customer",
              vendorOwnerId: null,
              vendorStoreId: null,
            });

            setTeamMembers(teamMembers.filter((m) => m.uid !== uid));
            Alert.alert(t("memberRemovedSuccess"));
          } catch (err) {
            console.error(err);
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AdminHeader title={t("vendorTeam")} onBack={onBack} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 70 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <AdminButton
            label={addingMember ? t("cancel") : t("addTeamMember")}
            onPress={() => setAddingMember(!addingMember)}
            variant={addingMember ? "ghost" : "primary"}
            style={{ marginBottom: 16 }}
          />

          {addingMember && (
            <AdminCard style={styles.addCard}>
              <AdminInput
                label={t("teamMemberEmail")}
                placeholder="example@email.com"
                value={newMemberEmail}
                onChangeText={setNewMemberEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                {t("assignRole")}
              </Text>
              <View style={styles.roleGrid}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    onPress={() => setSelectedRole(role.id)}
                    style={[
                      styles.roleOption,
                      { borderColor: colors.border },
                      selectedRole === role.id && {
                        backgroundColor: colors.primary + "15",
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        { color: colors.textMuted },
                        selectedRole === role.id && {
                          color: colors.primary,
                          fontWeight: "bold",
                        },
                      ]}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <AdminButton
                label={t("add")}
                onPress={handleAddMember}
                loading={searchLoading}
                disabled={!newMemberEmail}
                style={{ marginTop: 16 }}
              />
            </AdminCard>
          )}
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : teamMembers.length === 0 ? (
          <EmptyState
            message={t("noTeamMembers")}
            icon={<UsersIcon size={40} color={colors.textMuted} />}
          />
        ) : (
          <View style={styles.list}>
            {teamMembers.map((member) => (
              <AdminCard key={member.uid} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Text
                      style={[styles.avatarText, { color: colors.primary }]}
                    >
                      {member.displayName?.substring(0, 1).toUpperCase() ||
                        member.email?.substring(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <Text
                      style={[styles.memberName, { color: colors.foreground }]}
                    >
                      {member.displayName || "Unnamed User"}
                    </Text>
                    <Text
                      style={[styles.memberEmail, { color: colors.textMuted }]}
                    >
                      {member.email}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.roleBadge,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                      onPress={() =>
                        setEditingRoleMember(
                          editingRoleMember === member.uid ? null : member.uid,
                        )
                      }
                    >
                      <Shield size={10} color={colors.primary} />
                      <Text
                        style={[styles.roleText, { color: colors.primary }]}
                      >
                        {roles.find(
                          (r) => r.id === (member.vendorTeamRole || "support"),
                        )?.label || t("vendorSupport")}
                      </Text>
                      <ChevronDown size={10} color={colors.primary} />
                    </TouchableOpacity>

                    {editingRoleMember === member.uid && (
                      <View style={styles.rolePicker}>
                        {roles.map((role) => (
                          <TouchableOpacity
                            key={role.id}
                            onPress={() =>
                              handleUpdateRole(member.uid, role.id)
                            }
                            style={styles.rolePickerOption}
                          >
                            <Text
                              style={{
                                color:
                                  (member.vendorTeamRole || "support") ===
                                  role.id
                                    ? colors.primary
                                    : colors.foreground,
                                fontWeight:
                                  (member.vendorTeamRole || "support") ===
                                  role.id
                                    ? "bold"
                                    : "normal",
                              }}
                            >
                              {role.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveMember(member.uid)}
                  style={styles.removeBtn}
                >
                  <Trash2 size={20} color={colors.error} />
                </TouchableOpacity>
              </AdminCard>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  addCard: {
    padding: 16,
    marginBottom: 20,
  },
  list: {
    gap: 12,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "700",
  },
  memberEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  removeBtn: {
    padding: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
    gap: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleOptionText: {
    fontSize: 12,
  },
  rolePicker: {
    marginTop: 10,
    padding: 5,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 8,
  },
  rolePickerOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
});
