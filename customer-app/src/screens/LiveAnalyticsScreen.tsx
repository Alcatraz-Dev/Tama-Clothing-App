import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
} from "react-native";
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, TrendingUp, Users, Heart, Clock, Eye, Zap, Calendar, Trophy } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import Constants from "expo-constants";
import { LiveSessionService } from '../services/LiveSessionService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ✅ Expo Go detection
const isExpoGo = Constants.executionEnvironment === "storeClient";

type Props = {
    route?: {
        params: {
            channelId: string;
            isHost?: boolean;
            title?: string;
        };
    };
    navigation?: any;
    // Direct props
    brandId?: string;
    channelId?: string;
    onBack?: () => void;
    onNavigate?: (screen: string, params?: any) => void;
    theme?: 'light' | 'dark';
    language?: 'fr' | 'ar' | 'en';
    t?: (key: string) => string;
};

export default function LiveAnalyticsScreen(props: Props) {
    const insets = useSafeAreaInsets();
    const isDark = props.theme === 'dark'; // Correct theme logic
    const iconColor = isDark ? '#FFF' : '#000';
    const textColorMuted = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
    const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const t = props.t || ((key: string) => key);

    // Handle both React Navigation and Direct Props
    const channelId = props.channelId || props.brandId || props.route?.params?.channelId || "default_brand";
    const title = props.route?.params?.title || "Live Analytics";

    const [loading, setLoading] = useState(true);
    const [sessionData, setSessionData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSessionData();
    }, [channelId]);

    const fetchSessionData = async () => {
        try {
            setLoading(true);
            setError(null);

            const { getAuth } = await import('firebase/auth');
            const currentUser = getAuth().currentUser;
            const currentUserId = currentUser?.uid;

            console.log('🔍 [Analytics] Fetching data for identifier:', channelId, 'Current User:', currentUserId);

            // 1. Try direct lookup by ID (exact match)
            let session = await LiveSessionService.getSession(channelId);

            // 2. Fallback: Search for the latest session for this brandId
            if (!session) {
                console.log('⚠️ [Analytics] Session not found by ID, searching for latest brand session...');
                try {
                    session = await LiveSessionService.getLatestSessionByBrand(channelId);
                } catch (e) {
                    console.log('❌ [Analytics] Brand lookup failed:', e);
                }
            }

            // 3. Fallback: Search by currentUserId if we are the host
            if (!session && currentUserId) {
                console.log('⚠️ [Analytics] Still no session, searching for latest session by current user:', currentUserId);
                try {
                    session = await LiveSessionService.getLatestSessionByHost(currentUserId);
                } catch (e) {
                    console.log('❌ [Analytics] Host lookup failed:', e);
                }
            }

            // 4. Fallback: Search by CollabId
            if (!session) {
                console.log('⚠️ [Analytics] Still no session, checking if this is a CollabId...');
                try {
                    session = await LiveSessionService.getSessionByCollabId(channelId);
                } catch (e) {
                    console.log('❌ [Analytics] CollabId lookup failed:', e);
                }
            }

            if (!session) {
                console.log('❌ [Analytics] No session found at all after all fallbacks for identifier:', channelId);
                setError("No session data found");
                setLoading(false);
                return;
            }

            console.log('✅ [Analytics] Displaying session:', (session as any).channelId || channelId, 'Status:', session.status);

            setSessionData(session);
            setLoading(false);
        } catch (err) {
            console.error('❌ [Analytics] Error fetching session data:', err);
            setError("Failed to load analytics data");
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (props.onBack) props.onBack();
        else if (props.navigation) props.navigation.goBack();
    };

    const formatDuration = (startedAt: any, endedAt: any) => {
        if (!startedAt) return "0:00";

        const start = startedAt.toDate ? startedAt.toDate() : new Date(startedAt);
        // If endedAt is missing but status is live, use current time.
        // If endedAt exists, use it. Otherwise use start as fallback to get 0 duration.
        const end = endedAt?.toDate
            ? endedAt.toDate()
            : (endedAt ? new Date(endedAt) : (sessionData?.status === 'live' ? new Date() : start));

        const durationMs = Math.max(0, end.getTime() - start.getTime());
        const totalSeconds = Math.floor(durationMs / 1000);

        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString(props.language === 'ar' ? 'ar-TN' : 'fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateEngagement = () => {
        if (!sessionData) return { likesPerMin: 0, giftsPerMin: 0, avgViewers: 0 };

        const start = sessionData.startedAt?.toDate ? sessionData.startedAt.toDate() : new Date(sessionData.startedAt);
        const end = sessionData.endedAt?.toDate ? sessionData.endedAt.toDate() : new Date(sessionData.endedAt);
        const durationMins = Math.max((end.getTime() - start.getTime()) / 60000, 1);

        const likesPerMin = Math.floor(((sessionData as any).likesCount || 0) / durationMins);
        const giftsPerMin = Math.floor(((sessionData as any).giftsCount || 0) / durationMins);
        const avgViewers = sessionData.totalViewers || sessionData.viewCount || 0;

        return { likesPerMin, giftsPerMin, avgViewers };
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF', justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#EF4444" />
                <Text style={[styles.loadingText, { color: textColorMuted }]}>
                    {t('loadingAnalytics')}
                </Text>
            </View>
        );
    }

    if (error || !sessionData) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
                <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
                    <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <ChevronLeft size={24} color={iconColor} />
                        </TouchableOpacity>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={styles.headerTitle}>{t('liveAnalytics')}</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>
                </View>

                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
                    <Text style={[styles.errorText, { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }]}>
                        {error || t('noAnalyticsData')}
                    </Text>
                    <TouchableOpacity onPress={fetchSessionData} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>{t('retry')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const engagement = calculateEngagement();
    const duration = formatDuration(sessionData.startedAt, sessionData.endedAt);

    const stats = [
        {
            icon: Heart,
            label: t('totalLikes'),
            value: ((sessionData as any).likesCount || 0).toString(),
            color: '#EF4444',
            bgColor: 'rgba(239, 68, 68, 0.15)',
        },
        {
            icon: Zap,
            label: t('giftPoints'),
            value: ((sessionData as any).giftsCount || 0).toString(),
            color: '#A855F7',
            bgColor: 'rgba(168, 85, 247, 0.15)',
        },
        {
            icon: Trophy,
            label: t('pkWins'),
            value: ((sessionData as any).pkWins || 0).toString(),
            color: '#10B981',
            bgColor: 'rgba(16, 185, 129, 0.15)',
        },
        {
            icon: Trophy,
            label: t('pkLosses'),
            value: ((sessionData as any).pkLosses || 0).toString(),
            color: '#6B7280',
            bgColor: 'rgba(107, 114, 128, 0.15)',
        },
        {
            icon: Eye,
            label: t('totalViewers'),
            value: (sessionData.totalViewers || sessionData.viewCount || 0).toString(),
            color: '#3B82F6',
            bgColor: 'rgba(59, 130, 246, 0.15)',
        },
        {
            icon: Users,
            label: t('peakViewers'),
            value: (sessionData.peakViewers || 0).toString(),
            color: '#10B981',
            bgColor: 'rgba(16, 185, 129, 0.15)',
        },
        {
            icon: Clock,
            label: t('duration'),
            value: duration,
            color: '#F59E0B',
            bgColor: 'rgba(245, 158, 11, 0.15)',
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
            {/* Header with Blur Effect */}
            <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
                <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    >
                        <ChevronLeft size={24} color={iconColor} />
                    </TouchableOpacity>

                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>
                            {t('liveAnalytics')}
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: textColorMuted }]}>
                            {t('sessionSummary')}
                        </Text>
                    </View>

                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.content, { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Session Info */}
                <Animatable.View
                    animation="fadeInUp"
                    style={[styles.sessionInfo, { backgroundColor: cardBg, borderColor: borderColor }]}
                >
                    <View style={styles.sessionInfoRow}>
                        <Calendar size={16} color={textColorMuted} />
                        <Text style={[styles.sessionInfoText, { color: textColorMuted }]}>
                            {formatDate(sessionData.startedAt)}
                        </Text>
                    </View>
                    {sessionData.hostName && (
                        <Text style={[styles.sessionInfoHost, { color: isDark ? '#FFF' : '#000' }]}>
                            {t('hostLabel')}: {sessionData.hostName}
                        </Text>
                    )}
                </Animatable.View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <Animatable.View
                            key={stat.label}
                            animation="fadeInUp"
                            delay={index * 100}
                            style={[
                                styles.statCard,
                                { backgroundColor: cardBg, borderColor: borderColor },
                                index === stats.length - 1 && stats.length % 2 !== 0 ? { width: SCREEN_WIDTH - 40, flexDirection: 'row', gap: 20, alignItems: 'center' } : {}
                            ]}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: stat.bgColor }, index === stats.length - 1 && stats.length % 2 !== 0 ? { marginBottom: 0 } : {}]}>
                                <stat.icon size={24} color={stat.color} />
                            </View>
                            <View style={index === stats.length - 1 && stats.length % 2 !== 0 ? { alignItems: 'flex-start' } : { alignItems: 'center' }}>
                                <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#000' }]}>
                                    {stat.value}
                                </Text>
                                <Text style={[styles.statLabel, { color: textColorMuted }]}>
                                    {stat.label}
                                </Text>
                            </View>
                        </Animatable.View>
                    ))}
                </View>

                {/* Engagement Section */}
                <Animatable.View
                    animation="fadeInUp"
                    delay={400}
                    style={[styles.section, { backgroundColor: cardBg, borderColor: borderColor }]}
                >
                    <View style={styles.sectionHeader}>
                        <Zap size={20} color="#F59E0B" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#000' }]}>
                            {t('engagement')}
                        </Text>
                    </View>

                    <View style={styles.engagementBar}>
                        <View style={styles.engagementItem}>
                            <Text style={[styles.engagementLabel, { color: textColorMuted }]}>
                                {t('likesPerMin')}
                            </Text>
                            <Text style={[styles.engagementValue, { color: '#EF4444' }]}>
                                {engagement.likesPerMin}
                            </Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: borderColor }]} />

                        <View style={styles.engagementItem}>
                            <Text style={[styles.engagementLabel, { color: textColorMuted }]}>
                                {t('giftsPerMin')}
                            </Text>
                            <Text style={[styles.engagementValue, { color: '#A855F7' }]}>
                                {engagement.giftsPerMin}
                            </Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: borderColor }]} />

                        <View style={styles.engagementItem}>
                            <Text style={[styles.engagementLabel, { color: textColorMuted }]}>
                                {t('viewers')}
                            </Text>
                            <Text style={[styles.engagementValue, { color: '#3B82F6' }]}>
                                {engagement.avgViewers}
                            </Text>
                        </View>
                    </View>
                </Animatable.View>

                {/* Info Text */}
                <Text style={[styles.infoText, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
                    {t('viewStatsInfo')}
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        overflow: 'hidden',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    sessionInfo: {
        padding: 16,
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    sessionInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    sessionInfoText: {
        fontSize: 13,
        fontWeight: '600',
    },
    sessionInfoHost: {
        fontSize: 14,
        fontWeight: '700',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
        marginBottom: 30,
    },
    statCard: {
        width: (SCREEN_WIDTH - 55) / 2,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    section: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    engagementBar: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    engagementItem: {
        flex: 1,
        alignItems: 'center',
    },
    engagementLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    engagementValue: {
        fontSize: 24,
        fontWeight: '900',
    },
    divider: {
        width: 1,
        height: 40,
        marginHorizontal: 20,
    },
    infoText: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 20,
        fontWeight: '500',
    },
});