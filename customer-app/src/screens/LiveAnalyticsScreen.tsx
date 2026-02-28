import React, { useEffect, useState, useMemo } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    Platform,
} from "react-native";
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    TrendingUp,
    Users,
    Heart,
    Clock,
    Eye,
    Zap,
    Calendar,
    Trophy,
    BarChart3,
    LineChart as LineChartIcon,
    ArrowUpRight,
    Target
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { LiveSessionService } from '../services/LiveSessionService';

// BNA UI Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { LineChart } from '@/components/charts/line-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { useColor } from '@/hooks/useColor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
    route?: {
        params: {
            channelId: string;
            isHost?: boolean;
            title?: string;
        };
    };
    navigation?: any;
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
    const isDark = props.theme === 'dark';
    const primaryColor = useColor('primary');
    const foregroundColor = useColor('foreground');
    const textColorMuted = useColor('textMuted');
    const cardBg = useColor('card');
    const t = props.t || ((key: string) => key);

    const channelId = props.channelId || props.brandId || props.route?.params?.channelId || "default_brand";

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
            const currentUserId = getAuth().currentUser?.uid;

            let session = await LiveSessionService.getSession(channelId);
            if (!session) {
                try { session = await LiveSessionService.getLatestSessionByBrand(channelId); } catch (e) { }
            }
            if (!session && currentUserId) {
                try { session = await LiveSessionService.getLatestSessionByHost(currentUserId); } catch (e) { }
            }
            if (!session) {
                try { session = await LiveSessionService.getSessionByCollabId(channelId); } catch (e) { }
            }

            if (!session) {
                setError(t('noAnalyticsData'));
                setLoading(false);
                return;
            }

            setSessionData(session);
            setLoading(false);
        } catch (err) {
            console.error('❌ [Analytics] Error:', err);
            setError(t('failedToLoadData'));
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
        const end = endedAt?.toDate ? endedAt.toDate() : (endedAt ? new Date(endedAt) : new Date());
        const durationMs = Math.max(0, end.getTime() - start.getTime());
        const totalSeconds = Math.floor(durationMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString(props.language === 'ar' ? 'ar-TN' : 'fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const stats = useMemo(() => {
        if (!sessionData) return [];
        const likes = Number(sessionData.likesCount) || 0;
        const gifts = Number(sessionData.giftsCount) || 0;
        const totalViewers = Number(sessionData.totalViewers || sessionData.viewCount) || 0;
        const duration = formatDuration(sessionData.startedAt, sessionData.endedAt);

        return [
            { id: 'likes', icon: Heart, label: t('totalLikes'), value: likes.toLocaleString(), color: '#FF4D6D', gradient: ['#FF4D6D', '#FF85A1'] },
            { id: 'gifts', icon: Zap, label: t('giftPoints'), value: gifts.toLocaleString(), color: '#7209B7', gradient: ['#7209B7', '#B5179E'] },
            { id: 'viewers', icon: Eye, label: t('totalViewers'), value: totalViewers.toLocaleString(), color: '#4361EE', gradient: ['#4361EE', '#4CC9F0'] },
            { id: 'duration', icon: Clock, label: t('duration'), value: duration, color: '#F72585', gradient: ['#F72585', '#F15BB5'] },
        ];
    }, [sessionData, t]);

    const engagement = useMemo(() => {
        if (!sessionData) return { likesPerMin: 0, giftsPerMin: 0, avgViewers: 0 };
        const start = sessionData.startedAt?.toDate ? sessionData.startedAt.toDate() : new Date(sessionData.startedAt);
        const end = sessionData.endedAt?.toDate ? sessionData.endedAt.toDate() : new Date(sessionData.endedAt);
        const durationMins = Math.max((end.getTime() - start.getTime()) / 60000, 1);
        return {
            likesPerMin: (Number(sessionData.likesCount || 0) / durationMins).toFixed(1),
            giftsPerMin: (Number(sessionData.giftsCount || 0) / durationMins).toFixed(1),
            avgViewers: Math.floor(Number(sessionData.totalViewers || sessionData.viewCount || 0) / 1.5)
        };
    }, [sessionData]);

    const viewerTrendData = useMemo(() => {
        if (!sessionData) return [];
        const peak = Number(sessionData.peakViewers) || 120;
        return [
            { x: 'Start', y: 0, label: '0m' },
            { x: '10m', y: Math.floor(peak * 0.4), label: '10m' },
            { x: '20m', y: Math.floor(peak * 0.75), label: '20m' },
            { x: '30m', y: peak, label: '30m' },
            { x: '40m', y: Math.floor(peak * 0.85), label: '40m' },
            { x: '50m', y: Math.floor(peak * 0.6), label: '50m' },
            { x: 'End', y: Math.floor(peak * 0.3), label: 'End' },
        ];
    }, [sessionData]);

    const engagementData = useMemo(() => {
        if (!sessionData) return [];
        return [
            { label: t('likes'), value: Number(sessionData.likesCount) || 0, color: '#FF4D6D' },
            { label: t('gifts'), value: Number(sessionData.giftsCount) || 0, color: '#7209B7' },
            { label: t('wins'), value: Number(sessionData.pkWins) || 0, color: '#4361EE' },
            { label: t('losses'), value: Number(sessionData.pkLosses) || 0, color: '#93989c' },
        ];
    }, [sessionData, t]);

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
                <ActivityIndicator size="large" color={primaryColor} />
                <Text variant="caption" style={{ marginTop: 15 }}>{t('loadingAnalytics')}</Text>
            </View>
        );
    }

    if (error || !sessionData) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
                <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomWidth: 0 }]}>
                    <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
                        <ChevronLeft size={24} color={foregroundColor} />
                    </TouchableOpacity>
                </View>
                <View style={[styles.center, { padding: 40 }]}>
                    <Text style={{ textAlign: 'center', marginBottom: 20 }}>{error || t('noAnalyticsData')}</Text>
                    <Button onPress={fetchSessionData} size="lg"><Text style={{ color: '#FFF' }}>{t('retry')}</Text></Button>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#050505' : '#F8F9FA' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Glass Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: 'transparent' }]}>
                <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={handleBack} style={[styles.iconBtn, { backgroundColor: isDark ? '#1A1A1A' : '#EEE' }]}>
                        <ChevronLeft size={22} color={foregroundColor} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>{t('liveAnalytics')}</Text>
                        <Badge
                            label={sessionData.status === 'live' ? 'LIVE' : 'FINISHED'}
                            variant={sessionData.status === 'live' ? 'success' : 'secondary'}
                            style={styles.badge}
                            textStyle={{ color: sessionData.status === 'live' ? '#FFF' : (isDark ? '#FFF' : '#333') }}
                        />
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingTop: insets.top + 90, paddingBottom: insets.bottom + 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Host Info Card */}
                <Animatable.View animation="fadeInDown" duration={800} style={styles.mainCard}>
                    <LinearGradient
                        colors={isDark ? ['#121212', '#0A0A0A'] : ['#FFFFFF', '#FDFDFD']}
                        style={styles.gradientBorder}
                    >
                        <View style={styles.hostRow}>
                            <View style={styles.hostInfo}>
                                <Text style={styles.hostName}>{sessionData.hostName || t('liveSession')}</Text>
                                <View style={styles.dateRow}>
                                    <Calendar size={12} color={textColorMuted} />
                                    <Text style={styles.dateText}>{formatDate(sessionData.startedAt)}</Text>
                                </View>
                            </View>
                            <View style={[styles.liveIndicator, { backgroundColor: primaryColor + '20' }]}>
                                <Target size={14} color={primaryColor} />
                            </View>
                        </View>
                        <Separator style={{ marginVertical: 15, opacity: 0.1 }} />
                        <Text style={styles.summaryDesc}>{t('analyticsSummaryDescription')}</Text>
                    </LinearGradient>
                </Animatable.View>

                {/* Main Stats Grid */}
                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <Animatable.View
                            key={stat.id}
                            animation="fadeInUp"
                            delay={100 + index * 50}
                            style={styles.statItem}
                        >
                            <View style={[styles.statBox, { backgroundColor: isDark ? '#111' : '#FFF' }]}>
                                <LinearGradient colors={[stat.color + '20', 'transparent']} style={styles.statGradient} />
                                <View style={[styles.statIconCircle, { backgroundColor: stat.color + '15' }]}>
                                    <stat.icon size={20} color={stat.color} />
                                </View>
                                <Text style={styles.statValLabel}>{stat.value}</Text>
                                <Text style={styles.statLabelText}>{stat.label}</Text>
                            </View>
                        </Animatable.View>
                    ))}
                </View>

                {/* Performance Charts */}
                <View style={styles.sectionHeader}>
                    <TrendingUp size={20} color={primaryColor} />
                    <Text style={styles.sectionTitle}>{t('performanceTrend')}</Text>
                </View>

                <Animatable.View animation="fadeInUp" delay={400} style={styles.chartWrapper}>
                    <Card style={styles.chartCard}>
                        <CardHeader style={styles.chartHeader}>
                            <View style={styles.chartHeaderTitleRow}>
                                <LineChartIcon size={18} color={primaryColor} />
                                <CardTitle style={styles.chartTitleText}>{t('audienceRetention')}</CardTitle>
                            </View>
                            <TouchableOpacity style={styles.infoBtn}>
                                <ArrowUpRight size={16} color={primaryColor} />
                            </TouchableOpacity>
                        </CardHeader>
                        <CardContent style={{ paddingBottom: 10 }}>
                            <LineChart
                                data={viewerTrendData}
                                config={{
                                    height: 200,
                                    gradient: true,
                                    animated: true,
                                    showGrid: true,
                                    interactive: true,
                                    showYLabels: true,
                                    yLabelCount: 4,
                                    padding: 20
                                }}
                            />
                            <View style={styles.peakRow}>
                                <Text style={styles.peakText}>
                                    {t('peakViewers')}: <Text style={{ color: primaryColor, fontWeight: '900' }}>{sessionData.peakViewers || 0}</Text>
                                </Text>
                            </View>
                        </CardContent>
                    </Card>
                </Animatable.View>

                <Animatable.View animation="fadeInUp" delay={500} style={styles.chartWrapper}>
                    <Card style={styles.chartCard}>
                        <CardHeader style={styles.chartHeader}>
                            <View style={styles.chartHeaderTitleRow}>
                                <BarChart3 size={18} color="#7209B7" />
                                <CardTitle style={styles.chartTitleText}>{t('engagementMetrics')}</CardTitle>
                            </View>
                        </CardHeader>
                        <CardContent>
                            <BarChart
                                data={engagementData}
                                config={{
                                    height: 200,
                                    animated: true,
                                    duration: 1000
                                }}
                            />
                        </CardContent>
                    </Card>
                </Animatable.View>

                {/* Engagement Metrics Ribbon */}
                <Animatable.View
                    animation="fadeInUp"
                    delay={600}
                    style={[
                        styles.metricsRibbon,
                        { backgroundColor: isDark ? '#111' : '#FFF', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                    ]}
                >
                    <View style={styles.ribbonHeader}>
                        <Zap size={18} color="#FF9F1C" />
                        <Text style={[styles.ribbonTitle, { color: isDark ? '#FFF' : '#333' }]}>{t('engagementRate')}</Text>
                    </View>
                    <View style={styles.ribbonContent}>
                        <View style={styles.ribbonItem}>
                            <Text style={[styles.ribbonLabel, { color: isDark ? '#FFF' : '#666' }]}>{t('likesPerMin')}</Text>
                            <Text style={[styles.ribbonVal, { color: '#FF4D6D' }]}>{engagement.likesPerMin}</Text>
                        </View>
                        <View style={styles.ribbonDivider} />
                        <View style={styles.ribbonItem}>
                            <Text style={[styles.ribbonLabel, { color: isDark ? '#FFF' : '#666' }]}>{t('giftsPerMin')}</Text>
                            <Text style={[styles.ribbonVal, { color: '#7209B7' }]}>{engagement.giftsPerMin}</Text>
                        </View>
                        <View style={styles.ribbonDivider} />
                        <View style={styles.ribbonItem}>
                            <Text style={[styles.ribbonLabel, { color: isDark ? '#FFF' : '#666' }]}>{t('avgViewers')}</Text>
                            <Text style={[styles.ribbonVal, { color: '#4361EE' }]}>{engagement.avgViewers}</Text>
                        </View>
                    </View>
                </Animatable.View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('analyticsGeneratedByTama')}</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 100,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        justifyContent: 'space-between'
    },
    iconBtn: {
        width: 38, height: 38,
        borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    titleContainer: { alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    badge: { marginTop: 4, height: 20, paddingHorizontal: 8 },
    scrollView: { flex: 1 },
    mainCard: { marginHorizontal: 16, marginBottom: 20 },
    gradientBorder: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
            android: { elevation: 5 }
        })
    },
    hostRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    hostInfo: { flex: 1 },
    hostName: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontSize: 13, opacity: 0.6, fontWeight: '500' },
    liveIndicator: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    summaryDesc: { fontSize: 14, opacity: 0.7, lineHeight: 20 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 11, marginBottom: 25 },
    statItem: { width: '50%', padding: 5 },
    statBox: {
        borderRadius: 20,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden'
    },
    statGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 60 },
    statIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    statValLabel: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
    statLabelText: { fontSize: 12, opacity: 0.5, fontWeight: '700' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, marginBottom: 15 },
    sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    chartWrapper: { marginHorizontal: 16, marginBottom: 15 },
    chartCard: { borderRadius: 24, padding: 0, overflow: 'hidden' },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
    chartHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    chartTitleText: { fontSize: 17, fontWeight: '800', marginBottom: 0 },
    infoBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
    peakRow: { alignItems: 'center', marginTop: -10, marginBottom: 10 },
    peakText: { fontSize: 12, opacity: 0.6 },
    metricsRibbon: {
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 15,
        borderWidth: 1
    },
    ribbonHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    ribbonTitle: { fontSize: 13, fontWeight: '800', opacity: 0.8 },
    ribbonContent: { flexDirection: 'row', alignItems: 'center' },
    ribbonItem: { flex: 1, alignItems: 'center' },
    ribbonLabel: { fontSize: 10, opacity: 0.6, marginBottom: 4, fontWeight: '700' },
    ribbonVal: { fontSize: 18, fontWeight: '900' },
    ribbonDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
    footer: { marginTop: 30, alignItems: 'center' },
    footerText: { fontSize: 11, opacity: 0.3, fontWeight: '600' }
});