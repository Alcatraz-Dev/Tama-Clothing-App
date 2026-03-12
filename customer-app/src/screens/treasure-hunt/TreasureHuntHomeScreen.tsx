import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Animatable from "react-native-animatable";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  MapPin,
  Clock,
  Users,
  ChevronRight,
  Trophy,
  Star,
  Gift,
  Sparkles,
  Scan,
  ChevronLeft,
  Zap,
  Medal,
  TrendingUp,
  Map as MapIcon,
  ShoppingBag,
  ShoppingCart,
  Bomb,
  Trash2,
  Key,
} from "lucide-react-native";
import { treasureHuntService, Campaign } from "@/services/TreasureHuntService";
import { useAppTheme } from "@/context/ThemeContext";
import { Timestamp } from "firebase/firestore";
import * as Location from 'expo-location';

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.82;
const CARD_MARGIN = 12;

const TreasureHuntHomeScreen: React.FC<{
  t: any;
  userId: string;
  isDark: boolean;
  onCampaignSelect: (campaign: Campaign) => void;
  onViewRewards: () => void;
  onViewLeaderboard: () => void;
  onMapPress: (campaign: Campaign) => void;
  onScanPress: (campaign: Campaign) => void;
  onShopPress: () => void;
  onBack?: () => void;
}> = ({ t, userId, isDark, onCampaignSelect, onViewRewards, onViewLeaderboard, onMapPress, onScanPress, onShopPress, onBack }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [upcomingCampaigns, setUpcomingCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const [userParticipations, setUserParticipations] = useState<any[]>([]);
  const [addingDemo, setAddingDemo] = useState(false);
  const [countdown, setCountdown] = useState<{ [key: string]: number }>({});
  const [endCountdown, setEndCountdown] = useState<{ [key: string]: number }>(
    {},
  );
  const { colors, theme } = useAppTheme();

  const fetchCampaigns = async () => {
    try {
      const activeCampaigns = await treasureHuntService.getActiveCampaigns();
      const allCampaigns = await treasureHuntService.getAllPublicCampaigns();
      
      if (userId) {
        const stats = await treasureHuntService.getUserStats(userId);
        setUserStats(stats);
        const participations = await treasureHuntService.getUserParticipations(userId);
        setUserParticipations(participations);
      }

      const now = Timestamp.now();
      const upcoming = allCampaigns.filter((campaign) => {
        const startDate = campaign.startDate as Timestamp | undefined;
        return (
          startDate &&
          startDate.seconds > now.seconds &&
          campaign.status === "scheduled"
        );
      });
      setUpcomingCampaigns(upcoming);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateDemo = async () => {
    if (!userId) return;
    try {
      setAddingDemo(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      await treasureHuntService.createDemoLocation(
        userId, 
        location.coords.latitude, 
        location.coords.longitude
      );
      alert('Demo Treasure added at your location! Open map to test.');
      fetchCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to add demo treasure');
    } finally {
      setAddingDemo(false);
    }
  };

  const handleCreateDemoLeaderboard = async () => {
    try {
      setAddingDemo(true);
      await treasureHuntService.createDemoLeaderboard();
      alert('Demo Leaderboard data generated! Check the trophy screen.');
    } catch (err: any) {
      alert(err.message || 'Failed to generate leaderboard data');
    } finally {
      setAddingDemo(false);
    }
  };

  const handleCreateDemoKey = async () => {
    try {
      setAddingDemo(true);
      const loc = await Location.getCurrentPositionAsync({});
      await treasureHuntService.createDemoKey(userId, loc.coords.latitude, loc.coords.longitude);
      alert(t('demoKeyAdded') || 'Demo Key added at your location! Open map to collect it.');
    } catch (err: any) {
      alert(err.message || 'Failed to add demo key');
    } finally {
      setAddingDemo(false);
    }
  };

  const handleDeleteDemos = async () => {
    try {
      setAddingDemo(true);
      const crossout = await treasureHuntService.deleteDemoLocations();
      const crossoutBombs = await treasureHuntService.deleteDemoBombs();
      const crossoutLeaderboard = await treasureHuntService.deleteDemoLeaderboard();
      alert(`Deleted ${crossout} treasures, ${crossoutBombs} bombs, and ${crossoutLeaderboard} leaderboard entries.`);
      fetchCampaigns();
    } catch (err: any) {
      alert('Failed to delete demos');
    } finally {
      setAddingDemo(false);
    }
  };

  const handleCreateDemoBomb = async () => {
    if (!userId) return;
    try {
      setAddingDemo(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      await treasureHuntService.createDemoBomb(
        userId, 
        location.coords.latitude, 
        location.coords.longitude
      );
      alert('Demo Bomb added nearby! Open map to test.');
      fetchCampaigns();
    } catch (err: any) {
      alert('Failed to add demo bomb');
    } finally {
      setAddingDemo(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = treasureHuntService.subscribeToCampaigns(
      (activeCampaigns) => {
        setCampaigns(activeCampaigns);
        setLoading(false);
        setRefreshing(false); // Also set refreshing to false here
      },
    );

    fetchCampaigns(); // Fetch upcoming campaigns separately

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Timestamp.now();

      const newCountdown: { [key: string]: number } = {};
      upcomingCampaigns.forEach((campaign) => {
        const startDate = campaign.startDate as Timestamp | undefined;
        if (startDate) {
          const diff = startDate.seconds - now.seconds;
          if (diff > 0) newCountdown[campaign.id] = diff;
        }
      });
      setCountdown(newCountdown);

      const newEndCountdown: { [key: string]: number } = {};
      campaigns.forEach((campaign) => {
        const endDate = campaign.endDate as Timestamp | undefined;
        if (endDate) {
          const diff = endDate.seconds - now.seconds;
          if (diff > 0) newEndCountdown[campaign.id] = diff;
        }
      });
      setEndCountdown(newEndCountdown);
    }, 1000);

    return () => clearInterval(interval);
  }, [upcomingCampaigns, campaigns]);

  const formatCountdown = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    return `${minutes}m ${secs}s`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCampaigns();
  };

  const handleQuickAction = (type: 'map' | 'scan' | 'shop') => {
    if (type === 'shop') {
      onShopPress();
      return;
    }

    // For map and scan, try to find an active participation
    const activeParticipation = userParticipations.find(p => p.status === 'in_progress');
    const campaignId = activeParticipation?.campaignId;
    
    if (campaignId) {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        if (type === 'map') onMapPress(campaign);
        else onScanPress(campaign);
        return;
      }
    }

    // If no active or found, find the first active campaign
    if (campaigns.length > 0) {
      if (type === 'map') onMapPress(campaigns[0]);
      else onScanPress(campaigns[0]);
    }
  };

  const renderActiveCampaign = ({
    item,
    index,
  }: {
    item: Campaign;
    index: number;
  }) => {
    const isEndingSoon =
      endCountdown[item.id] && endCountdown[item.id] < 3600 * 24;

    return (
      <TouchableOpacity
        onPress={() => onCampaignSelect(item)}
        activeOpacity={0.9}
        style={[
          styles.activeCard,
          {
            marginLeft: index === 0 ? 20 : CARD_MARGIN,
            marginRight: index === campaigns.length - 1 ? 20 : 0,
          },
        ]}
      >
        <Animatable.View
          animation="fadeInRight"
          delay={index * 100}
          duration={600}
          style={styles.cardInner}
        >
          <LinearGradient
            colors={
              item.status === "completed" ? ["#475569", "#1E293B"] :
              userParticipations.find(p => p.campaignId === item.id)?.status === 'abandoned' ? ["#991B1B", "#450A0A"] :
              isEndingSoon ? ["#FF3366", "#FF8E53"] : ["#0F172A", "#1E293B"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View
              style={[
                styles.cardCircle,
                { top: -20, right: -20, opacity: 0.1 },
              ]}
            />

            <View style={styles.cardTopRow}>
              <BlurView intensity={20} tint="light" style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isEndingSoon ? "#FFF" : "#10B981" },
                  ]}
                />
                <Text style={styles.statusText}>
                  {userParticipations.find(p => p.campaignId === item.id)?.status === 'abandoned'
                    ? t("treasureHuntEliminated") || "ELIMINATED"
                    : isEndingSoon
                    ? t("treasureHuntEndingSoon") || "ENDING SOON"
                    : t("treasureHuntActive") || "LIVE"}
                </Text>
              </BlurView>

              <View style={styles.participantCount}>
                <Users size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.participantText}>
                  {item.currentParticipants || 0}
                </Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.campaignName} numberOfLines={1}>
                {item.name?.fr || item.name?.["ar-tn"] || "Adventure"}
              </Text>
              <Text style={styles.campaignDesc} numberOfLines={2}>
                {item.description?.fr ||
                  item.description?.["ar-tn"] ||
                  "Join the hunt and win!"}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              {endCountdown[item.id] ? (
                <View style={styles.timerContainer}>
                  <Clock size={14} color="#FFF" opacity={0.8} />
                  <Text style={styles.timerValue}>
                    {formatCountdown(endCountdown[item.id])}
                  </Text>
                </View>
              ) : (
                <View />
              )}

              <View style={styles.rewardPreview}>
                <Gift size={16} color="#FFF" />
                <Text style={styles.rewardText}>
                  {item.rewardValue} {t("treasureHuntExperiencePoints")}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animatable.View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.iconButton}>
              <ChevronLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>
              {t("welcomeBack") || "Hello Explorer,"}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {t("treasureHuntTitle") || "Treasure Hunt"}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onViewLeaderboard} style={styles.rewardButton}>
            <LinearGradient
              colors={["#4F46E5", "#7C3AED"]}
              style={styles.rewardGradient}
            >
              <Trophy size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={onViewRewards} style={[styles.rewardButton, { marginLeft: 10 }]}>
            <LinearGradient
              colors={["#FF3366", "#FF8E53"]}
              style={styles.rewardGradient}
            >
              <Medal size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
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
        <Animatable.View
          animation="fadeInUp"
          duration={800}
          style={styles.xpCard}
        >
          <LinearGradient
            colors={["#4F46E5", "#7C3AED"]}
            style={styles.xpGradient}
          >
            <View style={styles.xpHeader}>
              <View>
                <Text style={styles.xpLabel}>
                  {t("treasureHuntLevel") || "Current Level"}
                </Text>
                <Text style={styles.levelValue}>{userStats?.level || 1}</Text>
              </View>
              <View style={styles.xpIconContainer}>
                <Zap size={24} color="#FFF" />
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${userStats?.progress || 0}%` }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressText}>{userStats?.currentLevelXP?.toLocaleString() || 0} XP</Text>
                <Text style={styles.progressText}>{userStats?.nextLevelXP?.toLocaleString() || 1000} XP</Text>
              </View>
            </View>

            <View style={styles.xpFooter}>
              <TrendingUp size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.xpFooterText}>
                {userStats?.remainingXP} {t("treasureHuntNextLevel") || "XP to next level"}
              </Text>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Testing Demo Section */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.demoSection}>
          <TouchableOpacity 
            onPress={handleCreateDemo} 
            disabled={addingDemo}
            style={[styles.demoButton, { borderColor: colors.primary, flex: 1, marginRight: 8 }]}
          >
            {addingDemo ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <MapPin size={18} color={colors.primary} />
                <Text style={[styles.demoButtonText, { color: colors.primary }]}>
                  {t("treasureHuntAddDemo") || "Add Test"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleCreateDemoBomb} 
            disabled={addingDemo}
            style={[styles.demoButton, { borderColor: '#FFA500', flex: 1, marginRight: 8, backgroundColor: 'rgba(255, 165, 0, 0.05)' }]}
          >
            {addingDemo ? (
              <ActivityIndicator size="small" color="#FFA500" />
            ) : (
              <>
                <Bomb size={18} color="#FFA500" />
                <Text style={[styles.demoButtonText, { color: '#FFA500' }]}>
                  {t("treasureHuntAddBomb") || "Add Bomb"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleCreateDemoKey} 
            disabled={addingDemo}
            style={[styles.demoButton, { borderColor: '#10B981', flex: 1, marginRight: 8, backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}
          >
            {addingDemo ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <>
                <Key size={18} color="#10B981" />
                <Text style={[styles.demoButtonText, { color: '#10B981' }]}>
                  {t("addDemoKey") || "Add Key"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleCreateDemoLeaderboard} 
            disabled={addingDemo}
            style={[styles.demoButton, { borderColor: '#8B5CF6', flex: 1, marginRight: 8, backgroundColor: 'rgba(139, 92, 246, 0.05)' }]}
          >
            {addingDemo ? (
              <ActivityIndicator size="small" color="#8B5CF6" />
            ) : (
              <>
                <Trophy size={18} color="#8B5CF6" />
                <Text style={[styles.demoButtonText, { color: '#8B5CF6' }]}>
                  {t("treasureHuntAddLeaderboard") || "Add Board"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleDeleteDemos} 
            disabled={addingDemo}
            style={[styles.demoButton, { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.05)', paddingHorizontal: 12 }]}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </Animatable.View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("activeCampaigns") || "Live Adventures"}
          </Text>
          <TouchableOpacity style={styles.seeAll}>
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              {t("seeAll") || "See All"}
            </Text>
          </TouchableOpacity>
        </View>

        {campaigns.length > 0 ? (
          <FlatList
            data={campaigns}
            renderItem={renderActiveCampaign}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_MARGIN}
            decelerationRate="fast"
            contentContainerStyle={styles.horizontalList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: theme === "dark" ? "#1E293B" : "#F1F5F9" },
              ]}
            >
              <MapPin size={32} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {t("noActiveCampaigns") || "No hunts active now"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {t("checkUpcoming") || "Check the upcoming hunts below!"}
            </Text>
          </View>
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity
            onPress={() => handleQuickAction('map')}
            style={[styles.actionCard, { backgroundColor: colors.card }]}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#FFEDED" }]}>
              <MapIcon size={22} color="#FF3366" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>
              {t("treasureHuntQuickMap") || "Map"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleQuickAction('scan')}
            style={[styles.actionCard, { backgroundColor: colors.card }]}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#ECFDF5" }]}>
              <Scan size={22} color="#10B981" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>
              {t("treasureHuntQuickScan") || "Scan"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleQuickAction('shop')}
            style={[styles.actionCard, { backgroundColor: colors.card }]}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#EFF6FF" }]}>
              <ShoppingCart size={22} color="#3B82F6" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>
              {t("treasureHuntQuickShop") || "Boutique"}
            </Text>
          </TouchableOpacity>
        </View>

        {upcomingCampaigns.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.foreground, marginBottom: 16 },
              ]}
            >
              {t("treasureHuntUpcoming") || "Upcoming Hunts"}
            </Text>
            {upcomingCampaigns.map((campaign, idx) => (
              <Animatable.View
                key={campaign.id}
                animation="fadeInUp"
                delay={idx * 100}
                style={[styles.upcomingItem, { backgroundColor: colors.card }]}
              >
                <View style={styles.upcomingTop}>
                  <View style={styles.tierBadge}>
                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.tierText}>
                      {t("treasureHuntTierEpic") || "EPIC"}
                    </Text>
                  </View>
                  <View style={styles.upcomingTime}>
                    <Clock size={12} color={colors.textMuted} />
                    <Text
                      style={[styles.timeText, { color: colors.textMuted }]}
                    >
                      {countdown[campaign.id]
                        ? formatCountdown(countdown[campaign.id])
                        : "Soon"}
                    </Text>
                  </View>
                </View>

                <View style={styles.upcomingBottom}>
                  <View style={styles.upcomingInfo}>
                    <Text
                      style={[
                        styles.upcomingName,
                        { color: colors.foreground },
                      ]}
                    >
                      {campaign.name?.fr || campaign.name?.["ar-tn"]}
                    </Text>
                    <Text
                      style={[
                        styles.upcomingReward,
                        { color: colors.textMuted },
                      ]}
                    >
                      {campaign.rewardValue} XP •{" "}
                      {t("limitedEdition") || "Limited"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.notifyButton,
                      { borderColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.notifyButtonText,
                        { color: colors.primary },
                      ]}
                    >
                      {t("notifyMe") || "Remind"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animatable.View>
            ))}
          </View>
        )}

        <BlurView
          intensity={theme === "dark" ? 10 : 30}
          tint={theme === "dark" ? "dark" : "light"}
          style={styles.howItWorks}
        >
          <View style={styles.guideStep}>
            <View style={styles.guideNumber}>
              <Text style={styles.guideNumberText}>1</Text>
            </View>
            <Text style={[styles.guideText, { color: colors.foreground }]}>
              {t("guideFind") || "EXPLORE"}
            </Text>
          </View>
          <View style={styles.guideDivider} />
          <View style={styles.guideStep}>
            <View style={[styles.guideNumber, { backgroundColor: '#10B981' }]}>
              <Text style={styles.guideNumberText}>2</Text>
            </View>
            <Text style={[styles.guideText, { color: colors.foreground }]}>
              {t("guideCollectKeys") || "KEYS"}
            </Text>
          </View>
          <View style={styles.guideDivider} />
          <View style={styles.guideStep}>
            <View style={[styles.guideNumber, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.guideNumberText}>!</Text>
            </View>
            <Text style={[styles.guideText, { color: '#EF4444' }]}>
              {t("guideWatchHearts") || "HEARTS"}
            </Text>
          </View>
          <View style={styles.guideDivider} />
          <View style={styles.guideStep}>
            <View style={[styles.guideNumber, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.guideNumberText}>3</Text>
            </View>
            <Text style={[styles.guideText, { color: colors.foreground }]}>
              {t("guideWin") || "WIN"}
            </Text>
          </View>
        </BlurView>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  greeting: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  rewardButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rewardGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  xpCard: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 25,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  xpGradient: {
    padding: 20,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  xpLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  levelValue: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
  },
  xpIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFF",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  xpFooter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  xpFooterText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  seeAll: {
    padding: 4,
  },
  horizontalList: {
    paddingBottom: 20,
  },
  activeCard: {
    width: CARD_WIDTH,
    height: 200,
    borderRadius: 28,
  },
  cardInner: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  cardGradient: {
    flex: 1,
    padding: 24,
    position: "relative",
  },
  cardCircle: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FFF",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: "hidden",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  participantCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  participantText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  campaignName: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  campaignDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerValue: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6,
  },
  rewardPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  upcomingSection: {
    paddingHorizontal: 20,
  },
  upcomingItem: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  upcomingTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierText: {
    color: "#D97706",
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 4,
  },
  upcomingTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },
  upcomingBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingName: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  upcomingReward: {
    fontSize: 12,
    fontWeight: "500",
  },
  notifyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  notifyButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    marginHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  howItWorks: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 16,
    paddingHorizontal: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  guideStep: {
    alignItems: "center",
    flex: 1,
  },
  guideNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF3366",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  guideNumberText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
  },
  guideText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  guideDivider: {
    width: 1,
    height: 15,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  demoSection: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  demoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },
});

export default TreasureHuntHomeScreen;
