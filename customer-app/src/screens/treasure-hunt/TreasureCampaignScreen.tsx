import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Share,
  Platform,
  StatusBar,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Animatable from "react-native-animatable";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Clock,
  Users,
  Gift,
  MapPin,
  Trophy,
  CheckCircle2,
  Play,
  Share2,
  Star,
  Target,
  Sparkles,
  Zap,
  Info,
  Bomb as BombIcon,
} from "lucide-react-native";
import {
  treasureHuntService,
  Campaign,
  Participation,
} from "@/services/TreasureHuntService";
import { useAppTheme } from "@/context/ThemeContext";

const { width } = Dimensions.get("window");

const TreasureCampaignScreen: React.FC<{
  campaign: Campaign;
  userId: string;
  t: any;
  isDark: boolean;
  onBack: () => void;
  onStartGame: (campaign: Campaign) => void;
  onViewMap: (campaign: Campaign) => void;
  onClaimReward: () => void;
}> = ({
  campaign,
  userId,
  t,
  isDark,
  onBack,
  onStartGame,
  onViewMap,
  onClaimReward,
}) => {
  const [participation, setParticipation] = useState<Participation | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const { colors, theme } = useAppTheme();

  useEffect(() => {
    fetchParticipation();
  }, [campaign?.id, userId]);

  const fetchParticipation = async () => {
    try {
      const data = await treasureHuntService.getParticipation(
        campaign.id,
        userId,
      );
      setParticipation(data);
    } catch (error) {
      console.error("Error fetching participation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await treasureHuntService.enrollInCampaign(campaign?.id || "", userId);
      await fetchParticipation();
    } catch (error: any) {
      console.error("Enrollment error:", error);
      if (error.message === 'ABANDONED') {
        Alert.alert(
          t("treasureHuntGameOver") || "Game Over!",
          t("treasureHuntBoomDescLong") || "You were eliminated from this hunt."
        );
      } else {
        Alert.alert(
          t("treasureHuntError"),
          error.message || t("treasureHuntEnrollError"),
        );
      }
    } finally {
      setEnrolling(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(Platform.OS === "ios" ? "fr-FR" : "fr");
  };

  const progress = participation
    ? {
        discovered: Math.min(
          participation.progress.discoveredLocations || 0,
          participation.progress.totalLocations || 1,
        ),
        total: participation.progress.totalLocations || 1,
        percentage: Math.min(
          100,
          Math.round(
            (Math.min(
              participation.progress.discoveredLocations || 0,
              participation.progress.totalLocations || 1,
            ) /
              Math.max(participation.progress.totalLocations || 1, 1)) *
              100,
          ),
        ),
      }
    : { discovered: 0, total: 0, percentage: 0 };

  const isCompleted =
    progress.discovered === progress.total && progress.total > 0;

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroWrapper}>
          <LinearGradient
            colors={["#FF3366", "#FF8E53"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <SafeAreaView edges={["top"]} style={styles.safeHero}>
              <View style={styles.headerNav}>
                <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                  <ChevronLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    await Share.share({
                      message: `Rejoignez-moi pour la chasse au trésor ${campaign.name?.fr || "Bey3a"}!`,
                    });
                  }}
                  style={styles.iconBtn}
                >
                  <Share2 size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <Animatable.View
                animation="fadeInUp"
                duration={800}
                style={styles.heroMain}
              >
                <View style={styles.typeBadge}>
                  <Sparkles size={12} color="#FFF" fill="#FFF" />
                  <Text style={styles.typeBadgeText}>PREMIUM EVENT</Text>
                </View>

                <Text style={styles.heroTitle}>
                  {campaign.name?.fr || campaign.name?.["ar-tn"] || "Adventure"}
                </Text>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Clock size={16} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.statValue}>
                      {formatDate(campaign.endDate)}
                    </Text>
                    <Text style={styles.statLabel}>
                      {t("treasureHuntEndDate") || "Ends"}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Users size={16} color="rgba(255,255,255,0.7)" />
                    <Text style={[styles.statValue, { color: "#FFF" }]}>
                      {campaign.currentParticipants || 0}
                    </Text>
                    <Text style={styles.statLabel}>
                      {t("treasureHuntParticipants") || "Players"}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Trophy size={16} color="rgba(255,255,255,0.7)" />
                    <Text style={[styles.statValue, { color: "#FFF" }]}>
                      {campaign.rewardValue} XP
                    </Text>
                    <Text style={styles.statLabel}>
                      {t("treasureHuntRewardValue") || "Reward"}
                    </Text>
                  </View>
                </View>
              </Animatable.View>
            </SafeAreaView>
          </LinearGradient>

          <Animatable.View
            animation="zoomIn"
            delay={500}
            style={styles.floatingIcon}
          >
            <LinearGradient
              colors={["#FFF", "#F1F5F9"]}
              style={styles.iconCircle}
            >
              <Trophy size={40} color="#FF3366" />
            </LinearGradient>
          </Animatable.View>
        </View>

        <View style={styles.mainContent}>
          {/* Participation Card */}
          {participation ? (
            <Animatable.View
              animation="fadeInUp"
              delay={200}
              style={styles.cardContainer}
            >
              <BlurView
                intensity={theme === "dark" ? 15 : 40}
                tint={theme === "dark" ? "dark" : "light"}
                style={styles.glassCard}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Target size={20} color={colors.primary} />
                    <Text
                      style={[styles.cardTitle, { color: colors.foreground }]}
                    >
                      {t("treasureHuntYourProgress") || "Mission Progress"}
                    </Text>
                  </View>
                  {isCompleted && <CheckCircle2 size={20} color="#10B981" />}
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressBg,
                        { backgroundColor: colors.background },
                      ]}
                    />
                    <LinearGradient
                      colors={
                        isCompleted
                          ? ["#10B981", "#34D399"]
                          : ["#FF3366", "#FF8E53"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressFill,
                        { width: `${progress.percentage}%` },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.percentageText,
                      { color: colors.foreground },
                    ]}
                  >
                    {progress.percentage}%
                  </Text>
                </View>

                <Text style={[styles.countText, { color: colors.textMuted }]}>
                  {progress.discovered} / {progress.total}{" "}
                  {t("treasureHuntDiscoveries") || "Treasures Found"}
                </Text>

                {isCompleted && (
                  <TouchableOpacity
                    onPress={onClaimReward}
                    style={styles.claimBtn}
                  >
                    <LinearGradient
                      colors={["#10B981", "#059669"]}
                      style={styles.btnGradient}
                    >
                      <Gift size={20} color="#FFF" />
                      <Text style={styles.btnLabel}>
                        {t("treasureHuntClaimReward") || "Collect Reward"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </BlurView>
            </Animatable.View>
          ) : (
            <Animatable.View
              animation="fadeInUp"
              delay={200}
              style={styles.joinCard}
            >
              <View style={styles.joinIconBox}>
                <Zap size={24} color="#FFF" fill="#FFF" />
              </View>
              <View style={styles.joinContent}>
                <Text style={[styles.joinTitle, { color: colors.foreground }]}>
                  Ready to start?
                </Text>
                <Text style={[styles.joinDesc, { color: colors.textMuted }]}>
                  Enroll now to start discovering treasures nearby.
                </Text>
              </View>
            </Animatable.View>
          )}

          {/* Description */}
          <View style={styles.infoSection}>
            <View style={styles.sectionTitleRow}>
              <Info size={18} color={colors.primary} />
              <Text
                style={[styles.sectionHeading, { color: colors.foreground }]}
              >
                {t("description") || "About Hunt"}
              </Text>
            </View>
            <View style={[styles.descCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.descText, { color: colors.textMuted }]}>
                {campaign.description?.fr || campaign.description?.["ar-tn"]}
              </Text>
            </View>
          </View>

          {/* Rules / Steps */}
          <View style={styles.infoSection}>
            <Text
              style={[
                styles.sectionHeading,
                { color: colors.foreground, marginLeft: 0 },
              ]}
            >
              {t("treasureHuntHowToPlay") || "How to win"}
            </Text>
            <View style={styles.ruleList}>
              {[
                {
                  icon: MapPin,
                  title: t("treasureHuntExploreMap"),
                  desc: t("treasureHuntExploreMapDesc"),
                  color: "#FF3366",
                  bg: "#FFF1F2",
                },
                {
                  icon: Target,
                  title: t("treasureHuntFindTreasures"),
                  desc: t("treasureHuntFindTreasuresDesc"),
                  color: "#F59E0B",
                  bg: "#FFFBEB",
                },
                {
                  icon: Trophy,
                  title: t("treasureHuntWinRewards"),
                  desc: t("treasureHuntWinRewardsDesc"),
                  color: "#10B981",
                  bg: "#ECFDF5",
                },
              ].map((item, idx) => (
                <View
                  key={idx}
                  style={[styles.ruleCard, { backgroundColor: colors.card }]}
                >
                  <View style={[styles.ruleIcon, { backgroundColor: item.bg }]}>
                    <item.icon size={20} color={item.color} />
                  </View>
                  <View style={styles.ruleBody}>
                    <Text
                      style={[styles.ruleTitle, { color: colors.foreground }]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.ruleDesc, { color: colors.textMuted }]}
                    >
                      {item.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Primary Action Button */}
      <SafeAreaView edges={["bottom"]} style={styles.footerActions}>
        {participation?.status === 'abandoned' ? (
          <View style={[styles.actionBtn, { opacity: 0.8 }]}>
            <LinearGradient
              colors={["#991B1B", "#450A0A"]}
              style={styles.actionGradient}
            >
              <BombIcon size={22} color="#FFF" />
              <Text style={styles.actionText}>
                {t("treasureHuntEliminated") || "ELIMINATED"}
              </Text>
            </LinearGradient>
          </View>
        ) : !participation ? (
          <TouchableOpacity
            onPress={handleEnroll}
            disabled={enrolling}
            style={styles.actionBtn}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#FF3366", "#FF8E53"]}
              style={styles.actionGradient}
            >
              {enrolling ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Play size={22} color="#FFF" fill="#FFF" />
                  <Text style={styles.actionText}>
                    {t("treasureHuntStartAdventure") || "Join Adventure"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => onViewMap(campaign)}
            style={styles.actionBtn}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#4F46E5", "#7C3AED"]}
              style={styles.actionGradient}
            >
              <MapPin size={22} color="#FFF" />
              <Text style={styles.actionText}>
                {t("treasureHuntOpenMap") || "Open Map"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  heroWrapper: {
    height: 380,
    position: "relative",
  },
  heroGradient: {
    flex: 1,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  safeHero: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroMain: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  typeBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginLeft: 6,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFF",
    textAlign: "center",
    letterSpacing: -1,
    marginBottom: 25,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 24,
    padding: 16,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
  },
  statLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
    textAlign: "center",
    justifyContent: "center",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  floatingIcon: {
    position: "absolute",
    bottom: -35,
    alignSelf: "center",
    zIndex: 20,
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  cardContainer: {
    marginBottom: 30,
  },
  glassCard: {
    padding: 24,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 10,
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 10,
    position: "relative",
    marginRight: 15,
  },
  progressBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 5,
    opacity: 0.5,
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
  percentageText: {
    fontSize: 20,
    fontWeight: "900",
  },
  countText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  claimBtn: {
    marginTop: 20,
    borderRadius: 15,
    overflow: "hidden",
  },
  btnGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
  },
  btnLabel: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 10,
  },
  joinCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 51, 102, 0.05)",
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 51, 102, 0.1)",
  },
  joinIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#FF3366",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  joinContent: {
    flex: 1,
  },
  joinTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  joinDesc: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  infoSection: {
    marginBottom: 35,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "800",
    marginLeft: 10,
  },
  descCard: {
    padding: 20,
    borderRadius: 24,
  },
  descText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
  },
  ruleList: {
    gap: 12,
  },
  ruleCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  ruleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  ruleBody: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  ruleDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  footerActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  actionBtn: {
    height: 64,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  actionGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    marginLeft: 12,
  },
});

export default TreasureCampaignScreen;
