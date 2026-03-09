import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Gift, 
  Trophy, 
  Star, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  Zap,
  Award,
  Sparkles,
  Gem,
  Tag,
  X,
  Copy
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface Reward {
  id: string;
  type: 'points' | 'discount' | 'gift' | 'coupon';
  value: number | string;
  description: string;
  campaignName: string;
  claimedAt: Date;
  isRedeemed?: boolean;
  code?: string;
}

interface TreasureRewardsScreenProps {
  userId: string;
  t: any;
  isDark: boolean;
  onBack: () => void;
}

const TreasureRewardsScreen: React.FC<TreasureRewardsScreenProps> = ({
  userId,
  t,
  isDark,
  onBack
}) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, theme } = useAppTheme();

  // Simulated rewards data - in real app, fetch from Firestore
  const fetchRewards = async () => {
    try {
      setLoading(true);
      // Simulated data - replace with actual API call
      const mockRewards: Reward[] = [
        {
          id: '1',
          type: 'points',
          value: 500,
          description: 'Treasure found at Store #1',
          campaignName: 'Summer Treasure Hunt',
          claimedAt: new Date(),
          isRedeemed: false,
        },
        {
          id: '2',
          type: 'discount',
          value: 20,
          description: 'Complete all treasures!',
          campaignName: 'Summer Treasure Hunt',
          claimedAt: new Date(Date.now() - 86400000),
          isRedeemed: false,
          code: 'TREASURE20',
        },
        {
          id: '3',
          type: 'points',
          value: 250,
          description: 'Treasure found at Store #3',
          campaignName: 'Winter Adventure',
          claimedAt: new Date(Date.now() - 172800000),
          isRedeemed: true,
        },
      ];
      setRewards(mockRewards);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, [userId]);

  const handleClaimReward = (reward: Reward) => {
    Alert.alert(
      t('treasureHuntClaimReward'),
      t('treasureHuntClaimRewardConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('treasureHuntClaim'), 
          onPress: () => {
            // Handle reward claim
            Alert.alert(t('treasureHuntSuccess'), t('treasureHuntRewardClaimed'));
          }
        },
      ]
    );
  };

  const handleCopyCode = (code: string) => {
    // In a real app, use Clipboard or expo-clipboard
    Alert.alert(t('treasureHuntCopied'), code);
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'points':
        return <Zap size={24} color="#FFD700" />;
      case 'discount':
        return <Tag size={24} color="#4ECDC4" />;
      case 'gift':
        return <Gift size={24} color="#FF6B6B" />;
      case 'coupon':
        return <Award size={24} color="#9B59B6" />;
      default:
        return <Gift size={24} color={colors.primary} />;
    }
  };

  const getRewardGradient = (type: string): [string, string] => {
    switch (type) {
      case 'points':
        return ['#FFD700', '#FFA500'];
      case 'discount':
        return ['#4ECDC4', '#44A08D'];
      case 'gift':
        return ['#FF6B6B', '#FF8E53'];
      case 'coupon':
        return ['#9B59B6', '#8E44AD'];
      default:
        return [colors.primary, colors.primary];
    }
  };

  const totalPoints = rewards
    .filter(r => r.type === 'points' && !r.isRedeemed)
    .reduce((sum, r) => sum + (r.value as number), 0);

  const renderRewardCard = (reward: Reward, index: number) => (
    <Animatable.View 
      key={reward.id}
      animation="fadeInUp"
      delay={index * 100}
      duration={400}
      style={[styles.rewardCard, { backgroundColor: theme === 'dark' ? '#1A1A1E' : '#FFF' }]}
    >
      <LinearGradient
        colors={getRewardGradient(reward.type)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.rewardHeader}
      >
        <View style={styles.rewardIconContainer}>
          {getRewardIcon(reward.type)}
        </View>
        <View style={styles.rewardHeaderInfo}>
          <Text style={styles.rewardValue}>
            {reward.type === 'points' 
              ? `${reward.value} ${t('treasureHuntPoints')}`
              : reward.type === 'discount'
              ? `${reward.value}% ${t('treasureHuntDiscount')}`
              : reward.value
            }
          </Text>
          <Text style={styles.rewardCampaign}>{reward.campaignName}</Text>
        </View>
        {reward.isRedeemed && (
          <View style={styles.redeemedBadge}>
            <CheckCircle2 size={16} color="#FFF" />
          </View>
        )}
      </LinearGradient>

      <View style={styles.rewardBody}>
        <Text style={[styles.rewardDescription, { color: colors.textMuted }]}>
          {reward.description}
        </Text>

        {reward.code && (
          <TouchableOpacity 
            onPress={() => handleCopyCode(reward.code!)}
            style={[styles.codeContainer, { backgroundColor: colors.background }]}
          >
            <Text style={[styles.codeText, { color: colors.foreground }]}>{reward.code}</Text>
            <Copy size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {!reward.isRedeemed && (
          <TouchableOpacity 
            onPress={() => handleClaimReward(reward)}
            style={[styles.claimButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.claimButtonText}>{t('treasureHuntClaimReward')}</Text>
            <ChevronRight size={18} color="#FFF" />
          </TouchableOpacity>
        )}

        {reward.isRedeemed && (
          <View style={[styles.claimedInfo, { backgroundColor: '#4ECDC420' }]}>
            <CheckCircle2 size={16} color="#4ECDC4" />
            <Text style={[styles.claimedText, { color: '#4ECDC4' }]}>
              {t('treasureHuntRedeemed')}
            </Text>
          </View>
        )}
      </View>
    </Animatable.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme === 'dark' ? '#1A1A1E' : '#FFF' }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronRight size={24} color={colors.foreground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t('treasureHuntMyRewards')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary Card */}
      <View style={styles.summaryContainer}>
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryIcon}>
            <Sparkles size={32} color="#FFF" />
          </View>
          <Text style={styles.summaryLabel}>{t('treasureHuntTotalPoints')}</Text>
          <Text style={styles.summaryValue}>{totalPoints}</Text>
          <Text style={styles.summaryHint}>{t('treasureHuntUsePoints')}</Text>
        </LinearGradient>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchRewards();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t('treasureHuntYourRewards')}
        </Text>

        {rewards.length === 0 ? (
          <View style={styles.emptyState}>
            <Gift size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {t('treasureHuntNoRewards')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {t('treasureHuntStartHunting')}
            </Text>
          </View>
        ) : (
          rewards.map((reward, index) => renderRewardCard(reward, index))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    paddingVertical: 12,
  },
  backButton: {
    width: Math.min(40, width * 0.1),
    height: Math.min(40, width * 0.1),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Math.min(18, width * 0.045),
    fontWeight: '700',
  },
  summaryContainer: {
    paddingHorizontal: width * 0.05,
    marginBottom: 20,
  },
  summaryCard: {
    padding: Math.min(24, width * 0.06),
    borderRadius: Math.min(20, width * 0.05),
    alignItems: 'center',
  },
  summaryIcon: {
    width: Math.min(64, width * 0.16),
    height: Math.min(64, width * 0.16),
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Math.min(14, width * 0.035),
    fontWeight: '600',
  },
  summaryValue: {
    color: '#FFF',
    fontSize: Math.min(48, width * 0.12),
    fontWeight: '800',
    marginVertical: 8,
  },
  summaryHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Math.min(12, width * 0.03),
  },
  scrollContent: {
    paddingHorizontal: width * 0.05,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: Math.min(20, width * 0.05),
    fontWeight: '800',
    marginBottom: 16,
  },
  rewardCard: {
    borderRadius: Math.min(16, width * 0.04),
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rewardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rewardValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  rewardCampaign: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  redeemedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardBody: {
    padding: 16,
  },
  rewardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
  },
  claimButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  claimedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
  },
  claimedText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default TreasureRewardsScreen;
