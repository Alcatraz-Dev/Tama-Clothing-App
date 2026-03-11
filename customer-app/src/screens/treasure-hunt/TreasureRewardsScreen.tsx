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
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  Gift, 
  Trophy, 
  Star, 
  CheckCircle2, 
  Clock,
  ChevronLeft,
  Zap,
  Award,
  Sparkles,
  Gem,
  Tag,
  Copy,
  TrendingUp,
  ShieldCheck
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { treasureHuntService } from '@/services/TreasureHuntService';

const { width } = Dimensions.get('window');

interface Reward {
  id: string;
  type: 'points' | 'discount' | 'gift' | 'coupon' | 'free_product';
  value: number | string;
  description: string;
  campaignName: string;
  claimedAt: Date;
  isRedeemed?: boolean;
  tier?: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  code?: string;
  participationId?: string;
  rewardIndex?: number;
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
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const { colors, theme } = useAppTheme();

  const handleClaimReward = async (reward: Reward) => {
    if (!reward.participationId || reward.rewardIndex === undefined) return;
    
    setClaimingId(reward.id);
    try {
      const success = await treasureHuntService.claimReward(userId, reward.participationId, reward.rewardIndex);
      if (success) {
        Alert.alert(t('success') || 'Success', t('rewardClaimed') || 'Reward claimed successfully!');
      } else {
        Alert.alert(t('error') || 'Error', 'Failed to claim reward. It might be already claimed.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('error') || 'Error', 'Something went wrong.');
    } finally {
      setClaimingId(null);
    }
  };

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const participations = await treasureHuntService.getUserParticipations(userId);
      const allRewards: Reward[] = [];

      for (const p of participations) {
        if (p.rewards && p.rewards.length > 0) {
          // We might want to fetch campaign name if not included in participation
          // For now, let's assume we can get some generic info or fetch it
          const campaign = await treasureHuntService.getCampaign(p.campaignId);
          
          p.rewards.forEach((r: any, idx: number) => {
            allRewards.push({
              id: `${p.id}_${idx}`,
              type: r.type as any,
              value: r.value,
              description: r.type === 'points' ? `Discovery Reward` : `Special Reward`,
              campaignName: campaign?.name?.fr || campaign?.name?.['ar-tn'] || 'Adventure',
              claimedAt: r.timestamp?.toDate ? r.timestamp.toDate() : new Date(),
              isRedeemed: r.isRedeemed || false,
              tier: r.type === 'points' && (r.value as number) > 500 ? 'Epic' : 
                    r.type === 'discount' ? 'Legendary' : 'Common',
              code: r.code,
              participationId: p.id,
              rewardIndex: idx
            });
          });
        }
      }

      // Sort by date newest first
      allRewards.sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime());
      setRewards(allRewards);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Real-time listener for rewards (via participations)
    const unsubscribe = treasureHuntService.subscribeToUserParticipations(userId, async (participations) => {
      try {
        const allRewards: Reward[] = [];

        for (const p of participations) {
          if (p.rewards && p.rewards.length > 0) {
            // Optimization: fetch campaign once
            const campaign = await treasureHuntService.getCampaign(p.campaignId);
            
            p.rewards.forEach((r: any, idx: number) => {
              allRewards.push({
                id: `${p.id}_${idx}`,
                type: r.type as any,
                value: r.value,
                description: r.type === 'points' ? `Discovery Reward` : `Special Reward`,
                campaignName: campaign?.name?.fr || campaign?.name?.['ar-tn'] || 'Adventure',
                claimedAt: r.timestamp?.toDate ? r.timestamp.toDate() : new Date(),
                isRedeemed: r.isRedeemed || false,
                tier: r.type === 'points' && (Number(r.value) > 500) ? 'Epic' : 
                      r.type === 'discount' ? 'Legendary' : 'Common',
                code: r.code,
                participationId: p.id,
                rewardIndex: idx
              });
            });
          }
        }

        // Sort by date newest first
        allRewards.sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime());
        setRewards(allRewards);
      } catch (error) {
        console.error('Error processing rewards:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const getTierColors = (tier?: string): [string, string] => {
    switch (tier) {
      case 'Legendary': return ['#F59E0B', '#EF4444'];
      case 'Epic': return ['#8B5CF6', '#D946EF'];
      case 'Rare': return ['#3B82F6', '#2DD4BF'];
      default: return ['#6B7280', '#4B5563'];
    }
  };

  const renderRewardCard = (reward: Reward, index: number) => {
    const tierColors = getTierColors(reward.tier);
    
    return (
      <Animatable.View 
        key={reward.id}
        animation="fadeInUp"
        delay={400 + (index * 100)}
        style={styles.rewardCardContainer}
      >
        <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.rewardBlur}>
          <View style={styles.cardHeader}>
             <LinearGradient
               colors={tierColors}
               style={styles.tierBadge}
             >
                <Text style={styles.tierText}>{reward.tier || 'Common'}</Text>
             </LinearGradient>
             <Text style={[styles.dateText, { color: colors.textMuted }]}>
                {reward.claimedAt.toLocaleDateString()}
             </Text>
          </View>

          <View style={styles.cardMain}>
             <View style={[styles.rewardIconBox, { backgroundColor: tierColors[0] + '20' }]}>
                {reward.type === 'points' ? <TrendingUp size={24} color={tierColors[0]} /> : 
                 reward.type === 'discount' ? <Tag size={24} color={tierColors[0]} /> :
                 <Gift size={24} color={tierColors[0]} />}
             </View>
             <View style={styles.rewardInfo}>
                <Text style={[styles.rewardTitle, { color: colors.foreground }]}>
                   {reward.type === 'points' ? `${reward.value} Points` : 
                    reward.type === 'discount' ? `${reward.value}% Discount` :
                    reward.type === 'free_product' ? `Free Product` :
                    `${reward.value || 'Special'} Reward`}
                </Text>
                <Text style={[styles.rewardCampaign, { color: colors.primary }]}>{reward.campaignName}</Text>
             </View>
          </View>

          <Text style={[styles.rewardDesc, { color: colors.textMuted }]}>{reward.description}</Text>

          {reward.code && !reward.isRedeemed && (
             <TouchableOpacity style={[styles.codeBox, { backgroundColor: colors.background + '80' }]}>
                <Text style={[styles.codeText, { color: colors.foreground }]}>{reward.code}</Text>
                <Copy size={16} color={colors.primary} />
             </TouchableOpacity>
          )}

          <View style={styles.cardFooter}>
             {reward.isRedeemed ? (
                <View style={styles.redeemedInfo}>
                   <CheckCircle2 size={16} color="#10B981" />
                   <Text style={styles.redeemedLabel}>Redeemed</Text>
                </View>
             ) : (
                <TouchableOpacity 
                   style={[styles.claimButton, { backgroundColor: colors.primary }]}
                   onPress={() => handleClaimReward(reward)}
                   disabled={claimingId === reward.id}
                 >
                   <LinearGradient colors={[colors.primary, colors.primary + 'AA']} style={styles.claimGradient}>
                      {claimingId === reward.id ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.claimText}>Claim Reward</Text>
                          <Sparkles size={16} color="#FFF" />
                        </>
                      )}
                   </LinearGradient>
                </TouchableOpacity>
             )}
          </View>
        </BlurView>
      </Animatable.View>
    );
  };

  const totalPoints = rewards
    .filter(r => r.type === 'points' && !r.isRedeemed)
    .reduce((sum, r) => sum + (r.value as number), 0);

  const currentLevel = Math.floor(totalPoints / 1000) + 1;
  const currentXP = totalPoints % 1000;
  const xpToNextTier = 1000 - currentXP;
  const xpProgress = (currentXP / 1000) * 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Premium Animated Header */}
      <View style={styles.topSection}>
         <LinearGradient
            colors={theme === 'dark' ? ['#0F172A', '#1E293B'] : ['#F8FAFC', '#F1F5F9']}
            style={styles.headerBackground}
         />
         <SafeAreaView style={styles.safeHeader} edges={['top']}>
            <View style={styles.headerRow}>
               <TouchableOpacity onPress={onBack} style={styles.backButton}>
                  <BlurView intensity={20} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.blurBack}>
                     <ChevronLeft size={24} color={colors.foreground} />
                  </BlurView>
               </TouchableOpacity>
               <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Rewards</Text>
               <TouchableOpacity style={styles.infoButton}>
                  <ShieldCheck size={24} color={colors.primary} />
               </TouchableOpacity>
            </View>

            <Animatable.View animation="zoomIn" duration={800} style={styles.statContainer}>
               <BlurView intensity={theme === 'dark' ? 10 : 40} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.statBlur}>
                  <LinearGradient
                    colors={theme === 'dark' 
                      ? ['rgba(79, 70, 229, 0.2)', 'rgba(79, 70, 229, 0.05)'] 
                      : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.5)']}
                    style={styles.statGradient}
                  >
                     <View style={styles.statContentRow}>
                        <View style={styles.statIconBox}>
                           <Gem size={28} color={colors.primary} />
                        </View>
                        <View style={styles.statTextGroup}>
                           <Text style={[styles.statLabel, { color: colors.textMuted }]}>TOTAL TREASURE POINTS</Text>
                           <Text style={[styles.statValue, { color: colors.foreground }]}>{totalPoints}</Text>
                        </View>
                     </View>
                     
                     <View style={styles.xpSection}>
                        <View style={styles.xpHeader}>
                           <Text style={[styles.xpLevelText, { color: colors.primary }]}>{`Level ${currentLevel}`}</Text>
                           <Text style={[styles.xpTargetText, { color: colors.textMuted }]}>{`${xpToNextTier} XP to Next Tier`}</Text>
                        </View>
                        <View style={styles.xpBar}>
                           <View style={[styles.xpProgress, { backgroundColor: colors.primary, width: `${xpProgress}%` }]} />
                        </View>
                     </View>
                  </LinearGradient>
               </BlurView>
            </Animatable.View>
         </SafeAreaView>
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
        <Animatable.Text animation="fadeInLeft" style={[styles.sectionHeading, { color: colors.foreground }]}>
           Recent Treasures
        </Animatable.Text>

        {rewards.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.primary + '10' }]}>
               <Trophy size={60} color={colors.primary} opacity={0.3} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Rewards Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
               Start your first treasure hunt to unlock exclusive rewards and points!
            </Text>
          </View>
        ) : (
          rewards.map((reward, index) => renderRewardCard(reward, index))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    minHeight: 320,
    width: '100%',
    position: 'relative',
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  safeHeader: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    height: 50,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  blurBack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  statBlur: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statGradient: {
    padding: 24,
  },
  statContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statTextGroup: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  xpSection: {
    width: '100%',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpLevelText: {
    fontSize: 14,
    fontWeight: '800',
  },
  xpTargetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  xpBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpProgress: {
    height: '100%',
    borderRadius: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  rewardCardContainer: {
    marginBottom: 20,
  },
  rewardBlur: {
    borderRadius: 28,
    overflow: 'hidden',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tierText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rewardIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  rewardCampaign: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  rewardDesc: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  codeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(79, 70, 229, 0.3)',
  },
  codeText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  cardFooter: {
    marginTop: 4,
  },
  redeemedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  redeemedLabel: {
    color: '#10B981',
    fontWeight: '700',
    marginLeft: 8,
  },
  claimButton: {
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
  },
  claimGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
    paddingHorizontal: 30,
  },
});

export default TreasureRewardsScreen;
