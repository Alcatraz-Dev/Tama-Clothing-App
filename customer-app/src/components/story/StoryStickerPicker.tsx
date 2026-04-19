import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Search, X, ChevronLeft, Zap, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';

const { width: SW } = Dimensions.get('window');
const API_KEY = Constants.expoConfig?.extra?.STIPOP_API_KEY || 'dummy'; // Ensure this reaches here or pass as prop

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (sticker: { url: string }) => void;
}

export default function StoryStickerPicker({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [stickers, setStickers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'trending' | 'search'>('trending');

  useEffect(() => {
    if (visible) {
      fetchTrending();
    }
  }, [visible]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      // For stories, we use the Messenger API because it provides high-quality transparent stickers
      // Base URL: https://messenger.stipop.io/v1/trending
      const response = await fetch(`https://messenger.stipop.io/v1/trending?limit=40&userId=tama_user`, {
        headers: { apikey: '6947690623a633215967ee35ef98f395' } // Using the key from stickerService
      });
      const json = await response.json();
      if (json.body?.stickerList) {
        setStickers(json.body.stickerList);
      }
    } catch (e) {
      console.error('Failed to fetch trending stickers:', e);
    } finally {
      setLoading(false);
    }
  };

  const searchStickers = async (q: string) => {
    if (!q.trim()) {
      fetchTrending();
      setActiveTab('trending');
      return;
    }
    setLoading(true);
    setActiveTab('search');
    try {
      const response = await fetch(`https://messenger.stipop.io/v1/search?q=${encodeURIComponent(q)}&limit=40&userId=tama_user`, {
        headers: { apikey: '6947690623a633215967ee35ef98f395' }
      });
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

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <BlurView intensity={90} tint="dark" style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <ChevronLeft size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Stickers</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchBar}>
          <Search size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.input}
            placeholder="Search Giphy/Stipop..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={query}
            autoFocus={false}
            onChangeText={(t) => {
              setQuery(t);
              const timer = setTimeout(() => searchStickers(t), 500);
              return () => clearTimeout(timer);
            }}
          />
          {query.length > 0 && <TouchableOpacity onPress={() => { setQuery(''); fetchTrending(); }}><X size={16} color="#FFF" /></TouchableOpacity>}
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#FF0080" />
          </View>
        ) : (
          <FlatList
            data={stickers}
            numColumns={4}
            keyExtractor={(item, index) => `${item.stickerId || index}`}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect({ url: item.stickerImg })}
                style={styles.stickerItem}
              >
                <Image
                  source={{ uri: item.stickerImg }}
                  style={styles.stickerImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No stickers found</Text>
              </View>
            }
          />
        )}
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  closeBtn: { padding: 4 },
  title: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
  },
  input: { flex: 1, color: '#FFF', marginLeft: 10, fontSize: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 8 },
  stickerItem: {
    width: SW / 4 - 12,
    height: SW / 4 - 12,
    margin: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerImage: { width: '90%', height: '90%' },
  empty: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { color: 'rgba(255,255,255,0.4)' },
});
