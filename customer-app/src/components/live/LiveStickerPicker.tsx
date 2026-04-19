import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Image,
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Text } from '@/components/ui/text';
import { Search, X, ChevronLeft, Zap, Coins } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface LiveStickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSendSticker: (sticker: any) => void;
  userBalance: number;
  roomUsers?: any[];
  selectedTargetUser?: any;
  onSelectTargetUser?: (user: any) => void;
  t: (key: string) => string;
}

const STIPOP_API_KEY = process.env.EXPO_PUBLIC_STIPOP_API_KEY;

export const LiveStickerPicker: React.FC<LiveStickerPickerProps> = ({
  visible,
  onClose,
  onSendSticker,
  userBalance,
  roomUsers = [],
  selectedTargetUser,
  onSelectTargetUser,
  t,
}) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [stickers, setStickers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      // Default load 'happy' stickers
      setQuery('happy');
      searchStickers('happy');
    }
  }, [visible]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://messenger.stipop.io/v1/trending?limit=40&userId=tama_user`,
        {
          headers: { apikey: STIPOP_API_KEY || '' },
        },
      );
      const json = await response.json();
      if (json.body?.stickerList) {
        setStickers(json.body.stickerList);
      }
    } catch (e) {
      console.error('Fetch trending failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const searchStickers = async (q: string) => {
    if (!q.trim()) {
      fetchTrending();
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `https://messenger.stipop.io/v1/search?q=${encodeURIComponent(q)}&limit=40&userId=tama_user`,
        {
          headers: { apikey: STIPOP_API_KEY || '' },
        },
      );
      const json = await response.json();
      if (json.body?.stickerList) {
        setStickers(json.body.stickerList);
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const onSearchQueryChange = (text: string) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchStickers(text);
    }, 500);
  };

  const renderStickerItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.stickerItem}
      onPress={() => onSendSticker(item)}
    >
      <Image source={{ uri: item.stickerImg }} style={styles.stickerImg} />
      <View style={styles.priceBadge}>
        <Coins size={10} color="#FFD700" />
        <Text style={styles.priceText}>1</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.sheet}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          
          <View style={styles.header}>
            <View style={styles.balanceInfo}>
              <Coins size={16} color="#FFD700" />
              <Text style={styles.balanceText}>{userBalance}</Text>
            </View>
            <Text style={styles.title}>{t('sendGift') || 'Send Gift'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* User Selection (if provided) */}
          {roomUsers.length > 0 && (
            <View style={styles.userList}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'center' }}
              >
                {roomUsers.map((user) => (
                  <TouchableOpacity
                    key={user.userID}
                    onPress={() => onSelectTargetUser?.(user)}
                    style={[
                      styles.userTab,
                      selectedTargetUser?.userID === user.userID && styles.userTabActive,
                    ]}
                  >
                    <Text style={[
                      styles.userText,
                      selectedTargetUser?.userID === user.userID && styles.userTextActive
                    ]}>{user.userName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={16} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.input}
                placeholder={t('searchStickers') || "Search stickers..."}
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={query}
                onChangeText={onSearchQueryChange}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => { setQuery(''); fetchTrending(); }}>
                  <X size={14} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.moodRow}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: 'center' }}
            >
              {['happy', 'sad', 'love', 'funny', 'cute', 'excited', 'angry', 'hello'].map((mood) => (
                <TouchableOpacity
                  key={mood}
                  onPress={() => {
                    setQuery(mood);
                    searchStickers(mood);
                  }}
                  style={[
                    styles.moodBtn,
                    query.toLowerCase() === mood && styles.moodBtnActive,
                  ]}
                >
                  <Text style={styles.moodText}>{t(mood) || mood}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#FF0080" />
            </View>
          ) : (
            <FlatList
              style={{ flex: 1 }}
              data={stickers}
              renderItem={renderStickerItem}
              keyExtractor={(item, index) => item.stickerId?.toString() || index.toString()}
              numColumns={4}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.columnWrapper}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    height: height * 0.65,
    backgroundColor: 'rgba(20,20,25,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  balanceText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  userList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  userTabActive: {
    backgroundColor: '#FF0080',
    borderColor: '#FF0080',
  },
  userText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '700',
  },
  userTextActive: {
    color: '#FFF',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
  moodRow: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  moodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginRight: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  moodBtnActive: {
    backgroundColor: "#FF0080",
    borderColor: "#FF0080",
  },
  moodText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  stickerItem: {
    width: (width - 32) / 4,
    aspectRatio: 1,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerImg: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    gap: 2,
  },
  priceText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '900',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
