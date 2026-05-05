/**
 * AdminScreen - Moderation panel for live rooms and users
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Users,
  Video,
  Shield,
  AlertTriangle,
  Ban,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  BarChart2,
  MessageCircle,
  Gift,
  Settings,
  ChevronRight,
  Eye,
} from "lucide-react-native";
import { db } from "../api/firebase";
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, onSnapshot, serverTimestamp } from "firebase/firestore";

interface ReportedUser {
  id: string;
  name: string;
  avatar?: string;
  reportCount: number;
  lastReport: any;
  status: "active" | "banned";
}

interface ActiveRoom {
  id: string;
  channelId: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  viewerCount: number;
  status: "live" | "ended";
  startedAt: any;
  reports: number;
}

interface AdminScreenProps {
  adminId?: string;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ adminId }) => {
  const [selectedTab, setSelectedTab] = useState<"overview" | "users" | "rooms" | "reports">("overview");
  const [users, setUsers] = useState<ReportedUser[]>([]);
  const [rooms, setRooms] = useState<ActiveRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 1250,
    activeRooms: 8,
    totalViewers: 3456,
    reportsToday: 3,
  });

  // Load data
  useEffect(() => {
    loadUsers();
    loadRooms();
  }, []);

  const loadUsers = async () => {
    // Demo users
    setUsers([
      { id: "1", name: "User 1", avatar: "https://ui-avatars.com/api/?name=User1", reportCount: 5, lastReport: Date.now(), status: "active" },
      { id: "2", name: "User 2", avatar: "https://ui-avatars.com/api/?name=User2", reportCount: 12, lastReport: Date.now() - 86400000, status: "banned" },
      { id: "3", name: "User 3", avatar: "https://ui-avatars.com/api/?name=User3", reportCount: 2, lastReport: Date.now() - 172800000, status: "active" },
    ]);
  };

  const loadRooms = async () => {
    // Load live rooms
    const q = query(collection(db, "liveSessions"), where("status", "==", "live"));
    
    try {
      const snapshot = await getDocs(q);
      const liveRooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ActiveRoom[];
      setRooms(liveRooms);
    } catch (e) {
      // Demo rooms
      setRooms([
        { id: "1", channelId: "live_1", hostId: "h1", hostName: "Host 1", hostAvatar: "https://ui-avatars.com/api/?name=Host1", viewerCount: 250, status: "live", startedAt: Date.now(), reports: 0 },
        { id: "2", channelId: "live_2", hostId: "h2", hostName: "Host 2", hostAvatar: "https://ui-avatars.com/api/?name=Host2", viewerCount: 180, status: "live", startedAt: Date.now() - 3600000, reports: 1 },
        { id: "3", channelId: "live_3", hostId: "h3", hostName: "Host 3", hostAvatar: "https://ui-avatars.com/api/?name=Host3", viewerCount: 520, status: "live", startedAt: Date.now() - 7200000, reports: 0 },
      ]);
    }
  };

  const banUser = async (userId: string) => {
    Alert.alert(
      "Ban User",
      "Are you sure you want to ban this user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Ban",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "users", userId), {
                status: "banned",
                bannedAt: serverTimestamp(),
              });
              setUsers(prev => prev.map(u => 
                u.id === userId ? { ...u, status: "banned" } : u
              ));
              Alert.alert("Success", "User has been banned");
            } catch (e) {
              // Demo mode
              setUsers(prev => prev.map(u => 
                u.id === userId ? { ...u, status: "banned" } : u
              ));
              Alert.alert("Success", "User has been banned (demo)");
            }
          },
        },
      ]
    );
  };

  const unbanUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        status: "active",
        unbannedAt: serverTimestamp(),
      });
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: "active" } : u
      ));
    } catch (e) {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: "active" } : u
      ));
    }
  };

  const endRoom = async (roomId: string) => {
    Alert.alert(
      "End Room",
      "Are you sure you want to end this live room?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "liveSessions", roomId), {
                status: "ended",
                endedAt: serverTimestamp(),
              });
              setRooms(prev => prev.filter(r => r.id !== roomId));
            } catch (e) {
              setRooms(prev => prev.filter(r => r.id !== roomId));
            }
          },
        },
      ]
    );
  };

  const formatDuration = (startedAt: any) => {
    if (!startedAt) return "0:00";
    const now = Date.now();
    const start = startedAt.toDate ? startedAt.toDate() : new Date(startedAt);
    const diff = Math.floor((now - start.getTime()) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const renderOverview = () => (
    <ScrollView style={styles.content}>
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Users size={24} color="#FF0066" />
          <Text style={styles.statValue}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Video size={24} color="#00D4FF" />
          <Text style={styles.statValue}>{stats.activeRooms}</Text>
          <Text style={styles.statLabel}>Live Rooms</Text>
        </View>
        <View style={styles.statCard}>
          <Eye size={24} color="#2ECC71" />
          <Text style={styles.statValue}>{stats.totalViewers}</Text>
          <Text style={styles.statLabel}>Viewers</Text>
        </View>
        <View style={styles.statCard}>
          <AlertTriangle size={24} color="#FFD700" />
          <Text style={styles.statValue}>{stats.reportsToday}</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Shield size={24} color="#FF0066" />
            <Text style={styles.actionText}>Review Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ban size={24} color="#FF0000" />
            <Text style={styles.actionText}>Banned Users</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <BarChart2 size={24} color="#00D4FF" />
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Settings size={24} color="#888" />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderUsers = () => (
    <FlatList
      data={users}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={styles.userItem}>
          <Image
            source={{ uri: item.avatar || `https://ui-avatars.com/api/?name=${item.name}&background=random` }}
            style={styles.userAvatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userReports}>{item.reportCount} reports</Text>
          </View>
          <View style={styles.userStatus}>
            {item.status === "banned" ? (
              <View style={styles.bannedBadge}>
                <Ban size={14} color="#FF0000" />
                <Text style={styles.bannedText}>Banned</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.banButton}
                onPress={() => banUser(item.id)}
              >
                <Ban size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    />
  );

  const renderRooms = () => (
    <FlatList
      data={rooms}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={styles.roomItem}>
          <Image
            source={{ uri: item.hostAvatar || `https://ui-avatars.com/api/?name=${item.hostName}&background=random` }}
            style={styles.roomThumbnail}
          />
          <View style={styles.roomInfo}>
            <Text style={styles.roomHost}>{item.hostName}</Text>
            <Text style={styles.roomDuration}>
              {formatDuration(item.startedAt)} • {item.viewerCount} viewers
            </Text>
            {item.reports > 0 && (
              <View style={styles.reportBadge}>
                <AlertTriangle size={12} color="#FFD700" />
                <Text style={styles.reportText}>{item.reports} reports</Text>
              </View>
            )}
          </View>
          <View style={styles.roomActions}>
            <TouchableOpacity 
              style={styles.viewButton}
              onPress={() => Alert.alert("View Room", "Navigate to room")}
            >
              <Eye size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.endButton}
              onPress={() => endRoom(item.id)}
            >
              <XCircle size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <Shield size={24} color="#FF0066" />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: "overview", label: "Overview", icon: BarChart2 },
          { key: "users", label: "Users", icon: Users },
          { key: "rooms", label: "Rooms", icon: Video },
          { key: "reports", label: "Reports", icon: AlertTriangle },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <tab.icon size={18} color={selectedTab === tab.key ? "#FF0066" : "#888"} />
            <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Content */}
      {selectedTab === "overview" && renderOverview()}
      {selectedTab === "users" && renderUsers()}
      {selectedTab === "rooms" && renderRooms()}
      {selectedTab === "reports" && (
        <View style={styles.emptyState}>
          <AlertTriangle size={50} color="#333" />
          <Text style={styles.emptyText}>No pending reports</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: "rgba(255, 0, 102, 0.2)",
    borderWidth: 1,
    borderColor: "#FF0066",
  },
  tabText: {
    color: "#888",
    fontSize: 12,
  },
  tabTextActive: {
    color: "#FF0066",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    marginLeft: 8,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 8,
  },
  statLabel: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "47%",
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  userReports: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  userStatus: {
    flexDirection: "row",
    gap: 8,
  },
  bannedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 0, 0, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  bannedText: {
    color: "#FF0000",
    fontSize: 12,
  },
  banButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF0000",
    justifyContent: "center",
    alignItems: "center",
  },
  roomItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  roomThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  roomInfo: {
    flex: 1,
    marginLeft: 12,
  },
  roomHost: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  roomDuration: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  reportBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  reportText: {
    color: "#FFD700",
    fontSize: 11,
  },
  roomActions: {
    flexDirection: "row",
    gap: 8,
  },
  viewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#00D4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  endButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF0000",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 16,
  },
});

export default AdminScreen;