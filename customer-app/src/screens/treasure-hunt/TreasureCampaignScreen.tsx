import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft,
  Clock,
  Users,
  Gift,
  MapPin,
  Trophy,
  CheckCircle2,
  Circle,
  Play,
  Share2,
  Star,
  Target,
  Sparkles
} from 'lucide-react-native';
import { treasureHuntService, Campaign, Participation } from '@/services/TreasureHuntService';
import { useAppTheme } from '@/context/ThemeContext';
import { get } from 'firebase/database';
import { ColorValue } from "react-native";
const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface TreasureCampaignScreenProps {
  campaign: Campaign;
  userId: string;
  t: any;
  isDark: boolean;
  onBack: () => void;
  onStartGame: (campaign: Campaign) => void;
  onViewMap: (campaign: Campaign) => void;
  onClaimReward: () => void;
}

const TreasureCampaignScreen: React.FC<TreasureCampaignScreenProps> = ({
  campaign,
  userId,
  t,
  isDark,
  onBack,
  onStartGame,
  onViewMap,
  onClaimReward
}) => {
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const { colors, theme } = useAppTheme();


const gradients: [ColorValue, ColorValue][] = [
  ['#FF6B6B', '#FFD93D'],
  ['#6BCB77', '#4ECDC4'],
  ['#556270', '#FF6B6B'],
  ['#C44D58', '#FF6B6B'],
  ['#4ECDC4', '#556270'],
  ['#FFD93D', '#C44D58'],
];

const getRandomGeneralGradientColors = (): [ColorValue, ColorValue] => {
  return gradients[Math.floor(Math.random() * gradients.length)];
};

const [gradientColors] = useState(getRandomGeneralGradientColors);

  useEffect(() => {
    fetchParticipation();
  }, [campaign?.id, userId]);

  const fetchParticipation = async () => {
    try {
      const data = await treasureHuntService.getParticipation(campaign.id, userId);
      setParticipation(data);
    } catch (error) {
      console.error('Error fetching participation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await treasureHuntService.enrollInCampaign(campaign?.id || '', userId);
      await fetchParticipation();
      Alert.alert(t('treasureHuntSuccess'), t('treasureHuntEnrolledSuccess'));
    } catch (error: any) {
      console.error('Enrollment error:', error);
      Alert.alert(t('treasureHuntError'), error.message || t('treasureHuntEnrollError'));
    } finally {
      setEnrolling(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const progress = participation ? {
    discovered: participation.progress.discoveredLocations,
    total: participation.progress.totalLocations,
    percentage: Math.round((participation.progress.discoveredLocations / participation.progress.totalLocations) * 100)
  } : { discovered: 0, total: 0, percentage: 0 };

  const isCompleted = progress.discovered === progress.total && progress.total > 0;

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={styles.campaignBadge}>
              <Trophy size={14} color="#FFF" />
              <Text style={styles.campaignBadgeText}>{t('treasureHunt')}</Text>
            </View>
            
            <Text style={styles.campaignTitle}>
              {campaign.name?.fr || campaign.name?.['ar-tn'] || 'Campaign'}
            </Text>
            
            {campaign.description && (
              <Text style={styles.campaignDescription}>
                {campaign.description?.fr || campaign.description?.['ar-tn']}
              </Text>
            )}

            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Clock size={18} color="#FFF" />
                <Text style={styles.heroStatValue}>{formatDate(campaign.endDate)}</Text>
                <Text style={styles.heroStatLabel}>{t('treasureHuntEnds')}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Users size={18} color="#FFF" />
                <Text style={styles.heroStatValue}>{campaign.currentParticipants || 0}</Text>
                <Text style={styles.heroStatLabel}>{t('treasureHuntParticipants')}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Progress Section (if enrolled) */}
        {participation && (
          <View style={styles.progressSection}>
            <View style={[styles.progressCard, { backgroundColor: theme === 'dark' ? '#1A1A1E' : '#FFF' }]}>
              <View style={styles.progressHeader}>
                <Target size={24} color={colors.primary} />
                <Text style={[styles.progressTitle, { color: colors.foreground }]}>
                  {t('treasureHuntYourProgress')}
                </Text>
                {isCompleted && (
                  <View style={[styles.completedBadge, { backgroundColor: '#4ECDC420' }]}>
                    <Sparkles size={16} color="#4ECDC4" />
                  </View>
                )}
              </View>

              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: isCompleted ? '#4ECDC4' : colors.primary,
                        width: `${progress.percentage}%` 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressPercentage, { color: colors.foreground }]}>
                  {progress.percentage}%
                </Text>
              </View>

              <Text style={[styles.progressText, { color: colors.textMuted }]}>
                {progress.discovered} / {progress.total} {t('treasureHuntTreasuresFound')}
              </Text>

              {isCompleted && (
                <TouchableOpacity 
                  onPress={onClaimReward}
                  style={[styles.claimRewardButton, { backgroundColor: '#4ECDC4' }]}
                >
                  <Gift size={20} color="#FFF" />
                  <Text style={styles.claimRewardText}>{t('treasureHuntClaimReward')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Rewards Section */}
        <View style={styles.rewardsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('treasureHuntRewards')}
          </Text>
          
          <View style={[styles.rewardCard, { backgroundColor: theme === 'dark' ? '#1A1A1E' : '#FFF' }]}>
            <View style={[styles.rewardIcon, { backgroundColor: colors.primary + '20' }]}>
              <Gift size={28} color={colors.primary} />
            </View>
            <View style={styles.rewardInfo}>
              <Text style={[styles.rewardValue, { color: colors.foreground }]}>
                {campaign.rewardType === 'points' 
                  ? `${campaign.rewardValue} ${t('treasureHuntPoints') || 'Points'}`
                  : campaign.rewardType === 'discount'
                  ? `${campaign.rewardValue}% ${t('treasureHuntDiscount') || 'Discount'}`
                  : campaign.rewardType === 'free_product'
                  ? t('treasureHuntFreeProduct') || 'Free Product'
                  : campaign.rewardType === 'coupon'
                  ? t('treasureHuntCoupon') || 'Coupon'
                  : t('treasureHuntSpecialReward') || 'Special Reward'
                }
              </Text>
              <Text style={[styles.rewardDescription, { color: colors.textMuted }]}>
                {t('treasureHuntCompleteAll')}
              </Text>
            </View>
          </View>
        </View>

        {/* How to Play */}
        <View style={styles.howToPlaySection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('treasureHuntHowToPlay')}
          </Text>

          <View style={[styles.stepCard, { backgroundColor: theme === 'dark' ? '#1A1A1E' : '#FFF' }]}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                {t('treasureHuntExploreMap')}
              </Text>
              <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
                {t('treasureHuntExploreMapDesc')}
              </Text>
            </View>
          </View>

          <View style={[styles.stepCard, { backgroundColor: theme === 'dark' ? '#1A1A1E' : '#FFF' }]}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                {t('treasureHuntFindTreasures')}
              </Text>
              <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
                {t('treasureHuntFindTreasuresDesc')}
              </Text>
            </View>
          </View>

          <View style={[styles.stepCard, { backgroundColor: theme === 'dark' ? '#1A1A1E' : '#FFF' }]}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                {t('treasureHuntWinRewards')}
              </Text>
              <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
                {t('treasureHuntWinRewardsDesc')}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!participation ? (
            <TouchableOpacity 
              onPress={handleEnroll}
              disabled={enrolling}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              {enrolling ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Play size={20} color="#FFF" />
                  <Text style={styles.primaryButtonText}>{t('treasureHuntStartAdventure')}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => {
                if (onViewMap) {
                  onViewMap(campaign);
                }
              }}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <MapPin size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>{t('treasureHuntOpenMap')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={async () => {
              try {
                // Generate share message with campaign details
                const shareMessage = t('treasureHuntShareMessage') 
                  ? t('treasureHuntShareMessage')
                  : `Join the treasure hunt: ${campaign.name?.fr || campaign.name?.['ar-tn'] || 'Campaign'}!`;
                
                // Use React Native Share API
                const result = await Share.share({
                  message: shareMessage,
                  title: t('treasureHuntShare') || 'Share Treasure Hunt',
                });

                if (result.action === Share.sharedAction) {
                  // Successfully shared
                  console.log('Shared successfully');
                }
              } catch (error: any) {
                console.error('Error sharing:', error);
                Alert.alert(t('error') || 'Error', error?.message || t('shareFailed') || 'Failed to share. Please try again.');
              }
            }}
          >
            <Share2 size={20} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              {t('treasureHuntShare')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  heroSection: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: width * 0.05,
    borderBottomLeftRadius: Math.min(30, width * 0.075),
    borderBottomRightRadius: Math.min(30, width * 0.075),
  },
  backButton: {
    width: Math.min(40, width * 0.1),
    height: Math.min(40, width * 0.1),
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroContent: {
    alignItems: 'center',
  },
  campaignBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Math.min(14, width * 0.035),
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  campaignBadgeText: {
    color: '#FFF',
    fontSize: Math.min(12, width * 0.03),
    fontWeight: '700',
    marginLeft: 6,
  },
  campaignTitle: {
    color: '#FFF',
    fontSize: Math.min(32, width * 0.08),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  campaignDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Math.min(14, width * 0.035),
    textAlign: 'center',
    lineHeight: Math.min(22, width * 0.055),
    marginBottom: 24,
    paddingHorizontal: width * 0.05,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: Math.min(16, width * 0.04),
    padding: Math.min(16, width * 0.04),
    width: '100%',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    color: '#FFF',
    fontSize: Math.min(18, width * 0.045),
    fontWeight: '800',
    marginTop: 6,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Math.min(11, width * 0.028),
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressSection: {
    paddingHorizontal: width * 0.05,
    marginTop: -20,
  },
  progressCard: {
    padding: Math.min(20, width * 0.05),
    borderRadius: Math.min(20, width * 0.05),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    width: 50,
    textAlign: 'right',
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  claimRewardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  claimRewardText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  rewardsSection: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  rewardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  rewardValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  rewardDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  howToPlaySection: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
    marginLeft: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 100,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
});

export default TreasureCampaignScreen;

