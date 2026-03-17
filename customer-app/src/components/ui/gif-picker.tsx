import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Search, X, ChevronLeft } from "lucide-react-native";
import { useColor } from "@/hooks/useColor";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Image } from "expo-image";

interface GifPickerProps {
  visible?: boolean;
  onClose?: () => void;
  onGifSelect: (url: string) => void;
}

const GIPHY_API_KEY = Platform.select({
  ios: "iVCKb0WdIdPWwcVNtpOZJPdSn35B0pq1",
  android: "qiG8mRUEM6khJB735J757VaO2qBivvUR",
  default: "iVCKb0WdIdPWwcVNtpOZJPdSn35B0pq1",
});

export const GifPicker: React.FC<GifPickerProps> = ({
  visible,
  onClose,
  onGifSelect,
}) => {
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  // Theme colors
  const backgroundColor = useColor("background");
  const foregroundColor = useColor("foreground");
  const borderColor = useColor("border");
  const textMutedColor = useColor("textMuted");
  const blueColor = useColor("blue");

  const fetchGifs = async (query = "") => {
    setLoading(true);
    try {
      const endpoint = query
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=30&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=30&rating=g`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data && data.data) {
        setGifs(data.data);
      } else {
        setGifs([]);
      }
    } catch (error) {
      console.error("Error fetching GIFs:", error);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search.trim()) {
        fetchGifs(search);
      } else if (visible) {
        fetchGifs();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    if (visible === undefined || visible) {
      if (!search) fetchGifs();
    }
  }, [visible]);

  const handleSearch = () => {
    fetchGifs(search);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.gifContainer}
      onPress={() => onGifSelect(item.images.fixed_height.url)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.images.fixed_height_small.url }}
        style={styles.gifImage}
        contentFit="cover"
        transition={200}
        cachePolicy="disk"
      />
    </TouchableOpacity>
  );

  const content = (
    <View style={[styles.container, { backgroundColor: backgroundColor }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <ChevronLeft size={28} color={foregroundColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: foregroundColor }]}>GIFs</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor:
                Platform.OS === "ios"
                  ? "rgba(150,150,150,0.1)"
                  : "rgba(0,0,0,0.05)",
              borderColor: borderColor,
            },
          ]}
        >
          <Search size={18} color={textMutedColor} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={(text) => setSearch(text)}
            onSubmitEditing={handleSearch}
            placeholder="Rechercher sur GIPHY..."
            placeholderTextColor={textMutedColor}
            style={[styles.input, { color: foregroundColor }]}
            returnKeyType="search"
          />
          {search !== "" && (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
              }}
            >
              <X size={18} color={textMutedColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={blueColor} />
        </View>
      ) : (
        <FlatList
          data={gifs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ color: textMutedColor, fontSize: 16 }}>
                Aucun GIF trouvé
              </Text>
            </View>
          }
        />
      )}
    </View>
  );

  if (visible === undefined) {
    return content;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {content}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(150,150,150,0.2)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    padding: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  listContent: {
    paddingHorizontal: 2,
  },
  gifContainer: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(150,150,150,0.1)",
  },
  gifImage: {
    width: "100%",
    height: "100%",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: 50,
  },
});
