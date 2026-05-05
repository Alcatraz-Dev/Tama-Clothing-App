/**
 * LiveHomeScreen - Modern Professional Live Stream Discovery
 * Premium grid layout with glass morphism
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Image as ExpoImage } from "expo-image";
import {
  Search,
  Bell,
  Video,
  Users,
  Heart,
  Flame,
  Crown,
  TrendingUp,
  Star,
  Play,
  Filter,
  Grid,
  List,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface LiveRoom {
  id: string;
  roomId: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  title: string;
  thumbnail: string;
  viewerCount: number;
  likeCount: number;
  category: string;
  isPK?: boolean;
  isShopping?: boolean;
  isKaraoke?: boolean;
}

interface LiveHomeScreenProps {
  isHost?: boolean;
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatar?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

// Demo live rooms
const DEMO_ROOMS: LiveRoom[] = [
  {
    id: "1",
    roomId: "room_1",
    hostId: "host_1",
    hostName: "Sakura 🌸",
    hostAvatar: "https://i.pravatar.cc/150?img=1",
    title: "🎵 Music & Chill Vibes",
    thumbnail: "https://picsum.photos/seed/live1/400/600",
    viewerCount: 1234,
    likeCount: 5678,
    category: "Music",
  },
  {
    id: "2",
    roomId: "room_2",
    hostId: "host_2",
    hostName: "Alex Gaming",
    hostAvatar: "https://i.pravatar.cc/150?img=2",
    title: "🔥 Gaming Championship",
    thumbnail: "https://picsum.photos/seed/live2/400/600",
    viewerCount: 5678,
    likeCount: 12345,
    category: "Gaming",
    isPK: true,
  },
  {
    id: "3",
    roomId: "room_3",
    hostId: "host_3",
    hostName: "Beauty Queen 👑",
    hostAvatar: "https://i.pravatar.cc/150?img=3",
    title: "💄 Makeup Tutorial",
    thumbnail: "https://picsum.photos/seed/live3/400/600",
    viewerCount: 890,
    likeCount: 3456,
    category: "Beauty",
    isShopping: true,
  },
  {
    id: "4",
    roomId: "room_4",
    hostId: "host_4",
    hostName: "DJ MAX",
    hostAvatar: "https://i.pravatar.cc/150?img=4",
    title: "🎧 Live DJ Set",
    thumbnail: "https://picsum.photos/seed/live4/400/600",
    viewerCount: 2345,
    likeCount: 8901,
    category: "Music",
    isKaraoke: true,
  },
  {
    id: "5",
    roomId: "room_5",
    hostId: "host_5",
    hostName: "Chef Maria",
    hostAvatar: "https://i.pravatar.cc/150?img=5",
    title: "🍳 Cooking Masterclass",
    thumbnail: "https://picsum.photos/seed/live5/400/600",
    viewerCount: 456,
    likeCount: 1234,
    category: "Food",
    isShopping: true,
  },
  {
    id: "6",
    roomId: "room_6",
    hostId: "host_6",
    hostName: "Fitness Pro 💪",
    hostAvatar: "https://i.pravatar.cc/150?img=6",
    title: "🏋️ Workout Session",
    thumbnail: "https://picsum.photos/seed/live6/400/600",
    viewerCount: 789,
    likeCount: 2345,
    category: "Fitness",
  },
];

const CATEGORIES = [
  { key: "all", label: "All", icon: Grid },
  { key: "music", label: "Music", icon: Star },
  { key: "gaming", label: "Gaming", icon: Flame },
  { key: "beauty", label: "Beauty", icon: Crown },
  { key: "food", label: "Food", icon: Flame },
  { key: "fitness", label: "Fitness", icon: Heart },
  { key: "shopping", label: "Shopping", icon: Star },
];

const LIVE_TYPES = [
  { key: "video", label: "Video Live", icon: Video, color: "#FF0066" },
  { key: "voice", label: "Voice Room", icon: Users, color: "#00D4FF" },
  { key: "pk", label: "PK Battle", icon: Flame, color: "#FFD700" },
  { key: "karaoke", label: "Karaoke", icon: Star, color: "#9B59B6" },
];

export const LiveHomeScreen: React.FC<LiveHomeScreenProps> = ({
  isHost = false,
  currentUserId = "demo",
  currentUserName = "User",
  currentUserAvatar = "",
}) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [rooms, setRooms] = useState<LiveRoom[]>(DEMO_ROOMS);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredRooms = selectedCategory === "all"
    ? rooms
    : rooms.filter((room) => room.category.toLowerCase() === selectedCategory);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const renderRoomCard = ({ item }: { item: LiveRoom }) => (
    <TouchableOpacity style={styles.roomCard}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <ExpoImage
          source={{ uri: item.thumbnail }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />

        {/* Overlay gradient */}
        <View style={styles.thumbnailOverlay} />

        {/* Live Badge */}
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Category & Type badges */}
        <View style={styles.roomBadges}>
          {item.isPK && (
            <View style={[styles.badge, { backgroundColor: "#FFD700" }]}>
              <Flame size={10} color="#000" />
              <Text style={styles.badgeText}>PK</Text>
            </View>
          )}
          {item.isShopping && (
            <View style={[styles.badge, { backgroundColor: "#FF0066" }]}>
              <Star size={10} color="#fff" />
              <Text style={styles.badgeText}>Shop</Text>
            </View>
          )}
          {item.isKaraoke && (
            <View style={[styles.badge, { backgroundColor: "#9B59B6" }]}>
              <Star size={10} color="#fff" />
              <Text style={styles.badgeText}>Karaoke</Text>
            </View>
          )}
        </View>

        {/* Viewer Count */}
        <View style={styles.viewerBadge}>
          <Users size={10} color="#fff" />
          <Text style={styles.viewerText}>{item.viewerCount.toLocaleString()}</Text>
        </View>
      </View>

      {/* Room Info */}
      <View style={styles.roomInfo}>
        <ExpoImage
          source={{ uri: item.hostAvatar }}
          style={styles.hostAvatar}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.roomDetails}>
          <Text style={styles.roomTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.hostName}>{item.hostName}</Text>
        </View>
      </View>

      {/* Like Count */}
      <View style={styles.likeCount}>
        <Heart size={12} color="#FF0066" fill="#FF0066" />
        <Text style={styles.likeText}>{item.likeCount.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🔴 Live</Text>
          <TrendingUp size={16} color="#FF0066" />
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Search size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Bell size={22} color="#fff" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryTab,
                selectedCategory === cat.key && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <cat.icon
                size={16}
                color={selectedCategory === cat.key ? "#FF0066" : "#888"}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.key && styles.categoryTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* View Toggle */}
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
        >
          {viewMode === "grid" ? (
            <List size={20} color="#888" />
          ) : (
            <Grid size={20} color="#888" />
          )}
        </TouchableOpacity>
      </View>

      {/* Live Types Quick Access */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.liveTypesContainer}
        contentContainerStyle={styles.liveTypesContent}
      >
        {LIVE_TYPES.map((type) => (
          <TouchableOpacity key={type.key} style={styles.liveTypeButton}>
            <View style={[styles.liveTypeIcon, { backgroundColor: type.color + "20" }]}>
              <type.icon size={20} color={type.color} />
            </View>
            <Text style={styles.liveTypeLabel}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Rooms Grid */}
      <FlatList
        data={filteredRooms}
        renderItem={renderRoomCard}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === "grid" ? 2 : 1}
        key={viewMode}
        contentContainerStyle={styles.roomsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF0066"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Video size={48} color="#333" />
            <Text style={styles.emptyTitle}>No live rooms</Text>
            <Text style={styles.emptySubtitle}>Check back later for live streams</Text>
          </View>
        }
      />

      {/* Start Live Button (for hosts) */}
      {isHost && (
        <TouchableOpacity style={styles.startLiveButton}>
          <View style={styles.startLiveIcon}>
            <Video size={24} color="#fff" fill="#fff" />
          </View>
          <Text style={styles.startLiveText}>Go Live</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const CARD_WIDTH = (SCREEN_WIDTH - 36) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF0066",
  },
  categoriesContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
    marginBottom: 12,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: "rgba(255, 0, 102, 0.2)",
  },
  categoryText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#FF0066",
  },
  viewToggle: {
    padding: 8,
  },
  liveTypesContainer: {
    maxHeight: 80,
    marginBottom: 16,
  },
  liveTypesContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  liveTypeButton: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  liveTypeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  liveTypeLabel: {
    color: "#888",
    fontSize: 11,
    fontWeight: "500",
  },
  roomsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 16,
  },
  roomCard: {
    width: CARD_WIDTH,
    marginRight: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  thumbnailContainer: {
    width: "100%",
    height: CARD_HEIGHT,
    backgroundColor: "#222",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  liveBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 0, 102, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    marginRight: 4,
  },
  liveText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  roomBadges: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "column",
    gap: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  viewerBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  viewerText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  roomInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  hostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  roomDetails: {
    flex: 1,
  },
  roomTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  hostName: {
    color: "#888",
    fontSize: 11,
  },
  likeCount: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeText: {
    color: "#FF0066",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
  },
  startLiveButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF0066",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: "#FF0066",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 10,
  },
  startLiveIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  startLiveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default LiveHomeScreen;