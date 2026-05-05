/**
 * SearchScreen - Search users, rooms, hashtags
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search,
  User,
  Video,
  Hash,
  TrendingUp,
  X,
  Users,
  Heart,
  Clock,
} from "lucide-react-native";
import { db } from "../api/firebase";
import { collection, query, where, getDocs, orderBy, limit, or, and } from "firebase/firestore";

interface SearchResult {
  id: string;
  type: "user" | "room" | "hashtag";
  title: string;
  subtitle?: string;
  avatar?: string;
  thumbnail?: string;
  followerCount?: number;
  viewerCount?: number;
  postCount?: number;
}

interface SearchScreenProps {
  onSelectUser?: (userId: string) => void;
  onSelectRoom?: (roomId: string) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  onSelectUser,
  onSelectRoom,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"all" | "users" | "rooms" | "hashtags">("all");

  // Trending searches
  const trendingSearches = [
    "#SummerFashion",
    "#Gaming",
    "#Music",
    "#Dance",
    "#Cooking",
    "#PKBattle",
    "#LiveShopping",
  ];

  // Recent searches
  const recentSearches = [
    "Stormy",
    "Fashion Week",
    "Gaming Live",
    "Karaoke Night",
  ];

  // Search when query changes
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      // Search users
      const usersQuery = query(
        collection(db, "users"),
        where("name", ">=", searchQuery),
        where("name", "<=", searchQuery + "\uf8ff"),
        limit(10)
      );
      const usersSnap = await getDocs(usersQuery);
      const users = usersSnap.docs.map(doc => ({
        id: doc.id,
        type: "user" as const,
        title: doc.data().name || "User",
        subtitle: `@${doc.data().username || doc.id}`,
        avatar: doc.data().avatar || doc.data().photoURL,
      }));

      // Search live rooms
      const roomsQuery = query(
        collection(db, "liveSessions"),
        where("status", "==", "live"),
        where("hostName", ">=", searchQuery),
        where("hostName", "<=", searchQuery + "\uf8ff"),
        limit(10)
      );
      const roomsSnap = await getDocs(roomsQuery);
      const rooms = roomsSnap.docs.map(doc => ({
        id: doc.id,
        type: "room" as const,
        title: doc.data().title || `${doc.data().hostName}'s Live`,
        subtitle: `${doc.data().viewerCount || 0} viewers`,
        avatar: doc.data().hostAvatar,
        thumbnail: doc.data().thumbnail,
        viewerCount: doc.data().viewerCount,
      }));

      // Combine and filter by tab
      let combined = [...users, ...rooms];

      if (selectedTab === "users") {
        combined = users;
      } else if (selectedTab === "rooms") {
        combined = rooms;
      }

      // Add hashtag results
      if (searchQuery.startsWith("#")) {
        const hashtagResults: any = [{
          id: searchQuery,
          type: "hashtag" as const,
          title: searchQuery,
          subtitle: "Trending",
          postCount: Math.floor(Math.random() * 10000),
        }];
        combined = [...hashtagResults, ...combined];
      }

      setResults(combined as any);
    } catch (e) {
      // Demo results when search fails
      setResults([
        { id: "1", type: "user", title: "Demo User 1", subtitle: "@demo1", avatar: "https://ui-avatars.com/api/?name=Demo1&background=FF0066&color=fff" },
        { id: "2", type: "user", title: "Demo User 2", subtitle: "@demo2", avatar: "https://ui-avatars.com/api/?name=Demo2&background=00D4FF&color=fff" },
        { id: "3", type: "room", title: "Demo Live Room", subtitle: "500 viewers", viewerCount: 500 },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    if (result.type === "user") {
      onSelectUser?.(result.id);
    } else if (result.type === "room") {
      onSelectRoom?.(result.id);
    }
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleResultPress(item)}
    >
      {item.type === "user" ? (
        <>
          <Image
            source={{ uri: item.avatar || `https://ui-avatars.com/api/?name=${item.title}&background=random` }}
            style={styles.resultAvatar}
          />
          <View style={styles.resultInfo}>
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
          </View>
          <View style={styles.resultBadge}>
            <User size={14} color="#888" />
          </View>
        </>
      ) : item.type === "room" ? (
        <>
          <View style={styles.resultThumbnail}>
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail }} style={styles.thumbnailImage} />
            ) : (
              <Video size={24} color="#666" />
            )}
          </View>
          <View style={styles.resultInfo}>
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultSubtitle}>{item.viewerCount} watching</Text>
          </View>
          <View style={[styles.resultBadge, styles.liveBadge]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.hashtagIcon}>
            <Hash size={24} color="#FF0066" />
          </View>
          <View style={styles.resultInfo}>
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultSubtitle}>{item.postCount} posts</Text>
          </View>
          <TrendingUp size={16} color="#2ECC71" />
        </>
      )}
    </TouchableOpacity>
  );

  const renderSearchInput = () => (
    <View style={styles.searchContainer}>
      <Search size={20} color="#666" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search users, rooms, hashtags..."
        placeholderTextColor="#666"
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoFocus={false}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery("")}>
          <X size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTabs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.tabsContainer}
    >
      {[
        { key: "all", label: "All" },
        { key: "users", label: "Users" },
        { key: "rooms", label: "Live" },
        { key: "hashtags", label: "Tags" },
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            selectedTab === tab.key && styles.tabActive,
          ]}
          onPress={() => {
            setSelectedTab(tab.key as any);
            if (searchQuery) performSearch();
          }}
        >
          <Text style={[
            styles.tabText,
            selectedTab === tab.key && styles.tabTextActive,
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderContent = () => {
    // Show results if searching
    if (searchQuery.length > 1) {
      return (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyResults}>
              <Search size={40} color="#333" />
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          }
        />
      );
    }

    // Show trending and recent
    return (
      <ScrollView style={styles.suggestionsContainer}>
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Clock size={16} color="#666" /> Recent Searches
            </Text>
            <View style={styles.chipsContainer}>
              {recentSearches.map((term, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.chip}
                  onPress={() => setSearchQuery(term)}
                >
                  <Text style={styles.chipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Trending Searches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <TrendingUp size={16} color="#FF0066" /> Trending
          </Text>
          <View style={styles.trendingList}>
            {trendingSearches.map((tag, i) => (
              <TouchableOpacity
                key={i}
                style={styles.trendingItem}
                onPress={() => setSearchQuery(tag)}
              >
                <Text style={styles.trendingRank}>{i + 1}</Text>
                <Text style={styles.trendingTag}>{tag}</Text>
                <Text style={styles.trendingPosts}>
                  {Math.floor(Math.random() * 500 + 50)}K posts
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {renderSearchInput()}
      {renderTabs()}
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    marginLeft: 12,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
  },
  tabActive: {
    backgroundColor: "#FF0066",
  },
  tabText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },
  resultsList: {
    paddingHorizontal: 16,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  resultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  resultThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  hashtagIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 0, 102, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultSubtitle: {
    color: "#666",
    fontSize: 13,
    marginTop: 2,
  },
  resultBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  liveBadge: {
    flexDirection: "row",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingHorizontal: 10,
    width: "auto",
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
  liveText: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "700",
  },
  emptyResults: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 12,
  },
  suggestionsContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    color: "#fff",
    fontSize: 14,
  },
  trendingList: {
    gap: 8,
  },
  trendingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  trendingRank: {
    color: "#FF0066",
    fontSize: 18,
    fontWeight: "700",
    width: 30,
  },
  trendingTag: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
  },
  trendingPosts: {
    color: "#666",
    fontSize: 12,
  },
});

export default SearchScreen;