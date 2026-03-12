import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Trophy, 
  ChevronLeft,
  Zap,
  Medal,
  Star
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { treasureHuntService } from '@/services/TreasureHuntService';

const { width } = Dimensions.get('window');

interface LeaderboardEntry {
  userId: string;
  userName: string;
  xp: number;
  count: number;
  avatar: string;
}

interface LeaderboardScreenProps {
  t: any;
  onBack: () => void;
}

const TreasureLeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  t,
  onBack
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors, theme } = useAppTheme();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await treasureHuntService.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderTopThree = () => {
    const topThree = leaderboard.slice(0, 3);
    if (topThree.length === 0) return null;

    return (
      <View style={styles.topThreeContainer}>
        {/* Silver - Rank 2 */}
        {topThree[1] && (
          <Animatable.View animation="fadeInUp" delay={200} style={[styles.topRankItem, styles.rank2]}>
            <View style={styles.avatarContainer}>
              <Image 
                source={topThree[1].avatar ? { uri: topThree[1].avatar } : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(topThree[1].userName)}&background=c0c0c0&color=fff` }} 
                style={styles.avatar} 
              />
              <View style={[styles.badge, { backgroundColor: '#C0C0C0' }]}>
                <Text style={styles.badgeText}>2</Text>
              </View>
            </View>
            <Text style={[styles.rankName, { color: colors.foreground }]} numberOfLines={1}>{topThree[1].userName}</Text>
            <Text style={styles.rankXP}>{topThree[1].xp} XP</Text>
          </Animatable.View>
        )}

        {/* Gold - Rank 1 */}
        {topThree[0] && (
          <Animatable.View animation="fadeInUp" style={[styles.topRankItem, styles.rank1]}>
            <View style={styles.avatarContainerLarge}>
              <View style={styles.crownContainer}>
                <Trophy size={24} color="#FFD700" fill="#FFD700" />
              </View>
              <Image 
                source={topThree[0].avatar ? { uri: topThree[0].avatar } : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(topThree[0].userName)}&background=ffd700&color=fff` }} 
                style={styles.avatarLarge} 
              />
              <View style={[styles.badgeLarge, { backgroundColor: '#FFD700' }]}>
                <Text style={styles.badgeText}>1</Text>
              </View>
            </View>
            <Text style={[styles.rankNameLarge, { color: colors.foreground }]} numberOfLines={1}>{topThree[0].userName}</Text>
            <View style={styles.xpBadge}>
              <Zap size={12} color="#FFF" fill="#FFF" />
              <Text style={styles.rankXPLarge}>{topThree[0].xp} XP</Text>
            </View>
          </Animatable.View>
        )}

        {/* Bronze - Rank 3 */}
        {topThree[2] && (
          <Animatable.View animation="fadeInUp" delay={400} style={[styles.topRankItem, styles.rank3]}>
            <View style={styles.avatarContainer}>
              <Image 
                source={topThree[2].avatar ? { uri: topThree[2].avatar } : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(topThree[2].userName)}&background=cd7f32&color=fff` }} 
                style={styles.avatar} 
              />
              <View style={[styles.badge, { backgroundColor: '#CD7F32' }]}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </View>
            <Text style={[styles.rankName, { color: colors.foreground }]} numberOfLines={1}>{topThree[2].userName}</Text>
            <Text style={styles.rankXP}>{topThree[2].xp} XP</Text>
          </Animatable.View>
        )}
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    if (index < 3) return null; // Already shown in top three

    return (
      <Animatable.View 
        animation="fadeInRight" 
        delay={index * 50}
        style={[styles.listItem, { backgroundColor: colors.card }]}
      >
        <View style={styles.listRankContainer}>
          <Text style={[styles.listRankText, { color: colors.textMuted }]}>{index + 1}</Text>
        </View>
        
        <Image 
          source={item.avatar ? { uri: item.avatar } : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.userName)}&background=random` }} 
          style={styles.listAvatar} 
        />
        
        <View style={styles.listInfo}>
          <Text style={[styles.listName, { color: colors.foreground }]} numberOfLines={1}>
            {item.userName}
          </Text>
          <Text style={[styles.listStats, { color: colors.textMuted }]}>
            {item.count} hunts completed
          </Text>
        </View>

        <View style={styles.listXPContainer}>
          <Zap size={14} color="#FFD700" fill="#FFD700" />
          <Text style={[styles.listXPText, { color: colors.foreground }]}>{item.xp}</Text>
        </View>
      </Animatable.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t('treasureHuntLeaderboard') || 'Leaderboard'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.userId}
          renderItem={renderItem}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
              <LinearGradient
                colors={['rgba(79, 70, 229, 0.15)', 'rgba(79, 70, 229, 0.05)']}
                style={styles.heroBackground}
              >
                {renderTopThree()}
              </LinearGradient>
              
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {t('topHunters') || 'Top Hunters'}
                </Text>
                <Star size={16} color="#FFD700" fill="#FFD700" />
              </View>
            </View>
          )}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 16,
  },
  heroBackground: {
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  topThreeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  topRankItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  rank1: {
    flex: 1.2,
    zIndex: 10,
    transform: [{ translateY: -15 }],
  },
  rank2: {
    flex: 1,
  },
  rank3: {
    flex: 1,
  },
  avatarContainer: {
    marginBottom: 10,
    position: 'relative',
  },
  avatarContainerLarge: {
    marginBottom: 12,
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  crownContainer: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    zIndex: 20,
  },
  badge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeLarge: {
    position: 'absolute',
    bottom: -5,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rankName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  rankNameLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rankXP: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 12,
  },
  rankXPLarge: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 4,
  },
  xpBadge: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  listRankContainer: {
    width: 30,
    alignItems: 'center',
  },
  listRankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginHorizontal: 12,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  listStats: {
    fontSize: 12,
  },
  listXPContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  listXPText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default TreasureLeaderboardScreen;
