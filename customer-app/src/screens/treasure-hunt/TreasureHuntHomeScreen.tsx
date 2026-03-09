import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
  Animated,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MapPin, 
  Clock, 
  Users, 
  ChevronRight, 
  Search,
  Filter,
  Trophy,
  Star,
  Gift,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  XCircle,
  Scan,
  ChevronLeft
} from 'lucide-react-native';
import { treasureHuntService, Campaign } from '@/services/TreasureHuntService';
import { useAppTheme } from '@/context/ThemeContext';
import { Timestamp } from 'firebase/firestore';
import { ColorValue } from "react-native";
const { width, height } = Dimensions.get('window');

const isSmallScreen = width < 375;
const isTablet = width > 768;
const scaleFactor = width / 375; // Base scale on iPhone SE width

interface TreasureHuntHomeScreenProps {
  t: any;
  isDark: boolean;
  onCampaignSelect: (campaign: Campaign) => void;
  onBack?: () => void;
}

const TreasureHuntHomeScreen: React.FC<TreasureHuntHomeScreenProps> = ({ 
  t, 
  isDark,
  onCampaignSelect,
  onBack
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [upcomingCampaigns, setUpcomingCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState<{ [key: string]: number }>({});
  const { colors, theme } = useAppTheme();

  const fetchCampaigns = async () => {
    try {
      const now = Timestamp.now();
      // Get active campaigns
      const activeCampaigns = await treasureHuntService.getActiveCampaigns();
      setCampaigns(activeCampaigns);

      // Get all public campaigns to find upcoming ones
      const allCampaigns = await treasureHuntService.getAllPublicCampaigns();
      const upcoming = allCampaigns.filter(campaign => {
        const startDate = campaign.startDate as Timestamp | undefined;
        if (!startDate || !startDate.toDate) return false;
        return startDate.seconds > now.seconds;
      });
      setUpcomingCampaigns(upcoming);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    const calculateCountdowns = () => {
      const now = Timestamp.now();
      const newCountdown: { [key: string]: number } = {};
      
      upcomingCampaigns.forEach(campaign => {
        const startDate = campaign.startDate as Timestamp | undefined;
        if (startDate) {
          const diff = startDate.seconds - now.seconds;
          if (diff > 0) {
            newCountdown[campaign.id] = diff;
          }
        }
      });
      setCountdown(newCountdown);
    };

    calculateCountdowns();
    const interval = setInterval(calculateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [upcomingCampaigns]);

  const formatCountdown = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else {
      return `${minutes}m ${secs}s`;
    }
  };
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
    fetchCampaigns();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCampaigns();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };


  const renderCampaignCard = (campaign: Campaign) => (
    <TouchableOpacity
      key={campaign.id}
      onPress={() => onCampaignSelect(campaign)}
      activeOpacity={0.9}
    >
      <Animatable.View 
        animation="fadeInUp" 
        duration={500}
        style={[styles.campaignCard, { backgroundColor: theme === 'dark' ? '#1A1A1E' : '#FFF' }]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.campaignGradient}
        >
          <View style={styles.campaignHeader}>
            <View style={styles.campaignBadge}>
              <Trophy size={14} color="#FFF" />
              <Text style={styles.campaignBadgeText}>{t('treasureHuntActive')}</Text>
            </View>
            <View style={styles.participantsBadge}>
              <Users size={12} color="#FFF" />
              <Text style={styles.participantsText}>
                {campaign.currentParticipants || 0} {t('treasureHuntParticipants')}
              </Text>
            </View>
          </View>
          <Text style={styles.campaignTitle}>
            {campaign.name?.fr || campaign.name?.['ar-tn'] || 'Campaign'}
          </Text>
          {campaign.description && (
            <Text style={styles.campaignDescription} numberOfLines={2}>
              {campaign.description?.fr || campaign.description?.['ar-tn'] || ''}
            </Text>
          )}
        </LinearGradient>

        <View style={styles.campaignFooter}>
          <View style={styles.campaignInfo}>
            <View style={styles.infoItem}>
              <Clock size={16} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Gift size={16} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                {campaign.rewardType === 'points' 
                  ? `${campaign.rewardValue} ${t('treasureHuntPoints')}`
                  : campaign.rewardType === 'discount'
                  ? `${campaign.rewardValue}% ${t('treasureHuntDiscount')}`
                  : t('treasureHuntReward')
                }
              </Text>
            </View>
          </View>
          <View style={[styles.joinButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.joinButtonText}>{t('treasureHuntJoin')}</Text>
            <ArrowRight size={16} color="#FFF" />
          </View>
        </View>
      </Animatable.View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            {t('treasureHuntLoading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={[styles.backButton, { backgroundColor: colors.primary + '20' }]}
            >
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {t('treasureHunt')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              {t('treasureHuntFind')}
            </Text>
          </View>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
          <Trophy size={24} color={colors.primary} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Upcoming Campaigns Section */}
        {upcomingCampaigns.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('treasureHuntComingSoon') || 'Coming Soon'}
            </Text>
            {upcomingCampaigns.map((campaign) => (
              <View key={campaign.id} style={[styles.upcomingCard, { backgroundColor: colors.card }]}>
                <View style={styles.upcomingContent}>
                  <Text style={[styles.upcomingTitle, { color: colors.foreground }]}>
                    {campaign.name?.fr || campaign.name?.['ar-tn'] || 'Campaign'}
                  </Text>
                  {countdown[campaign.id] && (
                    <View style={[styles.countdownBadge, { backgroundColor: colors.primary }]}>
                      <Clock size={14} color="#FFF" />
                      <Text style={styles.countdownText}>
                        {formatCountdown(countdown[campaign.id])}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {campaigns.length === 0 && upcomingCampaigns.length === 0 ? (
          <View style={styles.emptyState}>
            <Sparkles size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {t('treasureHuntNoCampaigns')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {t('treasureHuntCheckBack')}
            </Text>
          </View>
        ) : (
          campaigns.map(renderCampaignCard)
        )}

        {campaigns.length > 0 && (
          <View style={styles.howItWorks}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('treasureHuntHowItWorks')}
            </Text>
            <View style={styles.stepsContainer}>
              <View style={styles.step}>
                <View style={[styles.stepIcon, { backgroundColor: '#FF6B6B20' }]}>
                  <MapPin size={20} color="#FF6B6B" />
                </View>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                  {t('treasureHuntStep1Title')}
                </Text>
                <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
                  {t('treasureHuntStep1Desc')}
                </Text>
              </View>
              <View style={styles.step}>
                <View style={[styles.stepIcon, { backgroundColor: '#FF8E5320' }]}>
                  <Scan size={20} color="#FF8E53" />
                </View>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                  {t('treasureHuntStep2Title')}
                </Text>
                <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
                  {t('treasureHuntStep2Desc')}
                </Text>
              </View>
              <View style={styles.step}>
                <View style={[styles.stepIcon, { backgroundColor: '#4ECDC420' }]}>
                  <Gift size={20} color="#4ECDC4" />
                </View>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                  {t('treasureHuntStep3Title')}
                </Text>
                <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
                  {t('treasureHuntStep3Desc')}
                </Text>
              </View>
            </View>
          </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: Math.min(28, width * 0.07),
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: Math.min(14, width * 0.035),
    marginTop: 4,
  },
  headerIcon: {
    width: Math.min(48, width * 0.12),
    height: Math.min(48, width * 0.12),
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: width * 0.05,
    paddingTop: 20, // Increased padding to avoid header overlap
    paddingBottom: 100,
  },
  // Upcoming campaigns section
  upcomingSection: {
    marginBottom: 24,
  },
  upcomingCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  upcomingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  countdownText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  campaignCard: {
    borderRadius: Math.min(20, width * 0.05),
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  campaignGradient: {
    padding: Math.min(20, width * 0.05),
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  campaignBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Math.min(10, width * 0.025),
    paddingVertical: 4,
    borderRadius: 12,
  },
  campaignBadgeText: {
    color: '#FFF',
    fontSize: Math.min(11, width * 0.028),
    fontWeight: '700',
    marginLeft: 4,
  },
  participantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Math.min(10, width * 0.025),
    paddingVertical: 4,
    borderRadius: 12,
  },
  participantsText: {
    color: '#FFF',
    fontSize: Math.min(11, width * 0.028),
    fontWeight: '600',
    marginLeft: 4,
  },
  campaignTitle: {
    color: '#FFF',
    fontSize: Math.min(22, width * 0.055),
    fontWeight: '800',
    marginBottom: 8,
  },
  campaignDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Math.min(14, width * 0.035),
    lineHeight: Math.min(20, width * 0.05),
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Math.min(16, width * 0.04),
  },
  campaignInfo: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: Math.min(12, width * 0.03),
    marginLeft: 8,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.min(16, width * 0.04),
    paddingVertical: 10,
    borderRadius: 12,
  },
  joinButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    marginRight: 6,
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
  howItWorks: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default TreasureHuntHomeScreen;
