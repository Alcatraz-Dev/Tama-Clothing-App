import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Alert,
} from "react-native";
import Constants from "expo-constants";
import { getAuth } from "firebase/auth";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

// ✅ Expo Go detection
const isExpoGo = Constants.executionEnvironment === "storeClient";

// ✅ Put them in env or constants
const ZEGO_APP_ID = 2056096532; // Placeholder
const ZEGO_APP_SIGN = '799d6389f41743e47568586326e1088d89a933f7c9e99a80e698822365452345'; // Placeholder

type ChatMessage = {
    id: string;
    text: string;
    userId: string;
    userName: string;
    createdAt?: any;
};

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
    onBack?: () => void;
    onNavigate?: (screen: string, params?: any) => void;
    theme?: 'light' | 'dark';
    language?: 'fr' | 'ar';
};

export default function LiveAnalyticsScreen(props: Props) {
    // Handle both React Navigation and Direct Props
    const channelId = props.brandId || props.route?.params?.channelId || "default_brand";
    const isHost = props.route?.params?.isHost ?? true;
    const title = props.route?.params?.title || "Analytics";

    // ✅ If Expo Go: show a friendly screen and DO NOT import Zego
    if (isExpoGo) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.expoGoBlock}>
                    <Text style={styles.expoGoTitle}>Live Analytics not supported in Expo Go</Text>
                    <Text style={styles.expoGoText}>
                        Zego SDK requires a Development Build.
                    </Text>

                    <View style={{ height: 16 }} />

                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => props.onBack ? props.onBack() : props.navigation?.goBack()}
                    >
                        <Text style={styles.closeBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <LiveAnalyticsDevBuild
            channelId={channelId}
            isHost={isHost}
            title={title}
            navigation={props.navigation}
            onBack={props.onBack}
            onNavigate={props.onNavigate}
        />
    );
}

function LiveAnalyticsDevBuild({
    channelId,
    isHost,
    title,
    navigation,
    onBack,
    onNavigate,
}: {
    channelId: string;
    isHost: boolean;
    title: string;
    navigation?: any;
    onBack?: () => void;
    onNavigate?: (screen: string, params?: any) => void;
}) {
    // Dynamic require
    const [retryCount, setRetryCount] = useState(0);

    let ZegoUIKitPrebuiltLiveStreaming: any;
    let HOST_DEFAULT_CONFIG: any;

    try {
        const ZegoModule = require("@zegocloud/zego-uikit-prebuilt-live-streaming-rn");
        ZegoUIKitPrebuiltLiveStreaming = ZegoModule.default;
        HOST_DEFAULT_CONFIG = ZegoModule.HOST_DEFAULT_CONFIG;
    } catch (e) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.expoGoBlock}>
                    <Text style={styles.expoGoTitle}>Development Build Required</Text>
                    <Text style={styles.expoGoText}>
                        Zego SDK failed to load. If you just installed it, please rebuild your app.
                    </Text>

                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setRetryCount(prev => prev + 1)}
                    >
                        <Text style={styles.closeBtnText}>Retry / Refresh</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.closeBtn, { marginTop: 10, backgroundColor: 'transparent' }]}
                        onPress={() => onBack ? onBack() : navigation?.goBack()}
                    >
                        <Text style={styles.closeBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;
    const userId = user?.uid || `guest_${Math.random().toString(16).slice(2)}`;
    const userName = user?.displayName || "Guest";

    const [likes, setLikes] = useState(0);

    const likesDoc = useMemo(
        () => doc(db, "Live_sessions", channelId, "stats", "likes"),
        [db, channelId]
    );

    useEffect(() => {
        const unsub = onSnapshot(likesDoc, (snap) => {
            const data = snap.data() as any;
            setLikes(data?.count ?? 0);
        });
        return () => unsub();
    }, [likesDoc]);

    const handleBack = () => {
        if (onBack) onBack();
        else if (navigation) navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{title} - {channelId}</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Likes</Text>
                        <Text style={styles.statValue}>❤️ {likes}</Text>
                    </View>
                </View>

                <Text style={styles.infoText}>
                    This is the Analytics view. Real-time stream data will appear here.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#000" },
    container: { flex: 1, backgroundColor: "#000", padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 15 },
    backText: { color: '#fff', fontSize: 16 },
    headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },

    statsGrid: { flexDirection: 'row', gap: 15 },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 5 },
    statValue: { color: '#fff', fontSize: 24, fontWeight: '900' },

    infoText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', marginTop: 40 },

    expoGoBlock: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    expoGoTitle: { color: "#fff", fontSize: 18, fontWeight: "900", textAlign: "center" },
    expoGoText: { color: "rgba(255,255,255,0.75)", fontSize: 14, textAlign: "center" },
    closeBtn: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 10,
    },
    closeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});