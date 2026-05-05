/**
 * ProfileScreen - User profile, followers, following, live history
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Settings,
  Camera,
  Heart,
  MessageCircle,
  Users,
  Video,
  Star,
  ChevronRight,
  Bell,
  Wallet,
  LogOut,
  Grid,
  List,
} from "lucide-react-native";
import { db, auth } from "../api/firebase";
import { doc, getDoc, updateDoc, setDoc, addDoc, collection, serverTimestamp, onSnapshot, query, where, getDocs } from "firebase/firestore";

interface UserProfile {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  liveCount: number;
  isFollowing?: boolean;
  isVerified?: boolean;
}

interface LiveHistory {
  id: string;
  title?: string;
  viewerCount: number;
  likes: number;
  duration: number;
  startedAt: any;
  thumbnail?: string;
}

interface ProfileScreenProps {
  userId?: string;
  isOwnProfile?: boolean;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  userId,
  isOwnProfile = true,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [liveHistory, setLiveHistory] = useState<LiveHistory[]>([]);
  const [selectedTab, setSelectedTab] = useState<"grid" | "live">("live");
  const [isFollowed, setIsFollowed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentUserId = userId || auth?.currentUser?.uid || "demo_user";
  const isViewingOther = !isOwnProfile && userId && userId !== currentUserId;

  useEffect(() => {
    loadProfile();
    loadLiveHistory();
  }, [currentUserId]);

  const loadProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", currentUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        // Get follower/following counts
        const followersSnap = await getDocs(
          query(collection(db, "follows"), where("followingId", "==", currentUserId))
        );
        const followingSnap = await getDocs(
          query(collection(db, "follows"), where("followerId", "==", currentUserId))
        );

        setProfile({
          id: currentUserId,
          name: data.name || "User",
          username: data.username || data.name?.toLowerCase(),
          avatar: data.avatar || data.photoURL,
          bio: data.bio || "Live streaming enthusiast",
          followersCount: followersSnap.size,
          followingCount: followingSnap.size,
          likesCount: data.wallet?.diamonds || 0,
          liveCount: data.liveCount || 0,
          isVerified: data.isVerified || false,
        });
      } else {
        // Demo profile
        setProfile({
          id: currentUserId,
          name: "Demo User",
          username: "demouser",
          avatar: `https://ui-avatars.com/api/?name=Demo+User&background=FF0066&color=fff`,
          bio: "Welcome to my live streaming profile!",
          followersCount: 1250,
          followingCount: 89,
          likesCount: 15420,
          liveCount: 42,
        });
      }
    } catch (e) {
      console.log("[Profile] Load error:", e);
    }
  };

  const loadLiveHistory = async () => {
    try {
      const q = query(
        collection(db, "liveSessions"),
        where("hostId", "==", currentUserId),
        where("status", "==", "ended")
      );
      
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as LiveHistory[];
      
      setLiveHistory(history.slice(0, 10));
    } catch (e) {
      // Demo data
      setLiveHistory([
        { id: "1", title: "Summer Collection Launch", viewerCount: 1250, likes: 8900, duration: 3600, startedAt: Date.now() - 86400000 },
        { id: "2", title: "Q&A Session", viewerCount: 890, likes: 5600, duration: 2700, startedAt: Date.now() - 172800000 },
        { id: "3", title: "PK Battle with @sarah", viewerCount: 2340, likes: 12300, duration: 4200, startedAt: Date.now() - 259200000 },
      ]);
    }
  };

  const handleFollow = async () => {
    if (!isViewingOther || !userId) return;
    
    setIsLoading(true);
    try {
      if (isFollowed) {
        // Unfollow
        await addDoc(collection(db, "follows"), {
          followerId: currentUserId,
          followingId: userId,
          action: "unfollow",
          timestamp: serverTimestamp(),
        });
        setIsFollowed(false);
      } else {
        // Follow
        await addDoc(collection(db, "follows"), {
          followerId: currentUserId,
          followingId: userId,
          action: "follow",
          timestamp: serverTimestamp(),
        });
        setIsFollowed(true);
      }
    } catch (e) {
      console.log("[Profile] Follow error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLiveHistory = ({ item }: { item: LiveHistory }) => (
    <View style={styles.liveHistoryItem}>
      <View style={styles.liveThumbnail}>
        <Image
          source={{ uri: item.thumbnail || `https://ui-avatars.com/api/?name=${item.title}&background=random` }}
          style={styles.liveThumbnailImage}
        />
        <View style={styles.liveStats}>
          <View style={styles.liveStat}>
            <Users size={10} color="#fff" />
            <Text style={styles.liveStatText}>{item.viewerCount}</Text>
          </View>
          <View style={styles.liveStat}>
            <Heart size={10} color="#fff" />
            <Text style={styles.liveStatText}>{item.likes}</Text>
          </View>
        </View>
        <View style={styles.liveDuration}>
          <Text style={styles.liveDurationText}>
            {Math.floor(item.duration / 60)}m
          </Text>
        </View>
      </View>
      <Text style={styles.liveTitle} numberOfLines={1}>{item.title || "Live Stream"}</Text>
    </View>
  );

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>
              {isOwnProfile ? "My Profile" : profile.name}
            </Text>
            {isOwnProfile && (
              <TouchableOpacity style={styles.settingsButton}>
                <Settings size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&background=FF0066&color=fff` }}
                style={styles.avatar}
              />
              {isOwnProfile && (
                <View style={styles.cameraButton}>
                  <Camera size={16} color="#fff" />
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{profile.name}</Text>
                {profile.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Star size={12} color="#fff" fill="#fff" />
                  </View>
                )}
              </View>
              <Text style={styles.username}>@{profile.username}</Text>
              <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.followersCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.liveCount}</Text>
              <Text style={styles.statLabel}>Live</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(profile.likesCount / 1000).toFixed(1)}K</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isViewingOther ? (
              <TouchableOpacity
                style={[styles.followButton, isFollowed && styles.followingButton]}
                onPress={handleFollow}
                disabled={isLoading}
              >
                <User size={18} color={isFollowed ? "#888" : "#fff"} />
                <Text style={[styles.followButtonText, isFollowed && styles.followingButtonText]}>
                  {isFollowed ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "live" && styles.tabActive]}
            onPress={() => setSelectedTab("live")}
          >
            <Video size={20} color={selectedTab === "live" ? "#FF0066" : "#888"} />
            <Text style={[styles.tabText, selectedTab === "live" && styles.tabTextActive]}>
              Live
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "grid" && styles.tabActive]}
            onPress={() => setSelectedTab("grid")}
          >
            <Grid size={20} color={selectedTab === "grid" ? "#FF0066" : "#888"} />
            <Text style={[styles.tabText, selectedTab === "grid" && styles.tabTextActive]}>
              Posts
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {selectedTab === "live" ? (
          <View style={styles.liveHistory}>
            {liveHistory.length > 0 ? (
              <FlatList
                data={liveHistory}
                renderItem={renderLiveHistory}
                keyExtractor={item => item.id}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={styles.liveHistoryGrid}
              />
            ) : (
              <View style={styles.emptyState}>
                <Video size={50} color="#333" />
                <Text style={styles.emptyTitle}>No live streams yet</Text>
                <Text style={styles.emptySubtitle}>
                  {isOwnProfile ? "Start your first live!" : "No streams available"}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Grid size={50} color="#333" />
            <Text style={styles.emptyTitle}>No posts yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions (Own Profile) */}
      {isOwnProfile && (
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionItem}>
            <Bell size={20} color="#fff" />
            <Text style={styles.quickActionText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <Wallet size={20} color="#fff" />
            <Text style={styles.quickActionText}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <LogOut size={20} color="#fff" />
            <Text style={styles.quickActionText}>Log Out</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  loadingText: {
    color: "#666",
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#FF0066",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FF0066",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0a0a0a",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF0066",
    justifyContent: "center",
    alignItems: "center",
  },
  username: {
    color: "#666",
    fontSize: 14,
    marginTop: 4,
  },
  bio: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  followButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF0066",
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  followingButton: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
  },
  followButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  followingButtonText: {
    color: "#888",
  },
  editButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#333",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF0066",
  },
  tabText: {
    color: "#888",
    fontSize: 14,
  },
  tabTextActive: {
    color: "#FF0066",
  },
  liveHistory: {
    padding: 8,
  },
  liveHistoryGrid: {
    gap: 4,
  },
  liveHistoryItem: {
    flex: 1 / 3,
    margin: 2,
  },
  liveThumbnail: {
    height: 100,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    position: "relative",
  },
  liveThumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  liveStats: {
    position: "absolute",
    bottom: 4,
    left: 4,
    flexDirection: "row",
    gap: 8,
  },
  liveStat: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  liveStatText: {
    color: "#fff",
    fontSize: 10,
  },
  liveDuration: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveDurationText: {
    color: "#fff",
    fontSize: 10,
  },
  liveTitle: {
    color: "#888",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  quickActionItem: {
    alignItems: "center",
    gap: 4,
  },
  quickActionText: {
    color: "#666",
    fontSize: 12,
  },
});

export default ProfileScreen;