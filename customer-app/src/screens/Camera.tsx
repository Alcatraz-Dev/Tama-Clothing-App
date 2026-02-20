import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Pressable,
    Image,
    ActivityIndicator,
    Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    CameraType,
    CameraView,
    useCameraPermissions,
    type CameraMode,
} from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Theme } from "../theme";
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../api/firebase';
import Svg, { Circle } from 'react-native-svg';

const { width, height } = Dimensions.get("window");

type DurationMode = 30 | 60 | "unlimited";

interface CameraScreenProps {
    onBack: () => void;
    onNavigate: (screen: string) => void;
    t: (key: string) => string;
    language: string;
    theme: string;
    user?: any;
}

export default function CameraScreen({ onBack, onNavigate, t, language, theme, user }: CameraScreenProps) {
    const colors = theme === "dark" ? Theme.dark.colors : Theme.light.colors;
    const cameraRef = useRef<CameraView>(null);

    const [camPermission, requestCamPermission] = useCameraPermissions();
    const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

    const [cameraType, setCameraType] = useState<CameraType>("back");
    const [mode, setMode] = useState<CameraMode>("video");
    const [durationMode, setDurationMode] = useState<DurationMode>(30);
    const [isRecording, setIsRecording] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [capturedVideo, setCapturedVideo] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [uploading, setUploading] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const maxDuration = useMemo(() => {
        if (mode !== "video") return undefined;
        if (durationMode === "unlimited") return undefined;
        return durationMode;
    }, [mode, durationMode]);

    const progress = useMemo(() => {
        if (mode !== "video") return 0;
        if (durationMode === "unlimited") return 0;
        return Math.min(elapsed / durationMode, 1);
    }, [elapsed, durationMode, mode]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getDurationLabel = (duration: DurationMode) => {
        if (duration === 30) return t('timer30s') || '30s';
        if (duration === 60) return t('timer60s') || '60s';
        return t('timerUnlimited') || '∞';
    };

    useEffect(() => {
        if (!camPermission?.granted) requestCamPermission();
        if (!mediaPermission?.granted) requestMediaPermission();
    }, [camPermission?.granted, mediaPermission?.granted]);

    useEffect(() => {
        if (countdown === null) return;
        if (countdown === 0) {
            setCountdown(null);
            setIsStarting(false);
            startCapture();
            return;
        }
        const timer = setTimeout(() => setCountdown((c) => (c ?? 0) - 1), 650);
        return () => clearTimeout(timer);
    }, [countdown]);

    const safeStartCountdown = () => {
        if (isRecording || isStarting) return;
        setIsStarting(true);
        setCountdown(3);
    };

    const cancelCountdown = () => {
        if (countdown === null) return;
        setCountdown(null);
        setIsStarting(false);
    };

    const flipCamera = () => {
        setCameraType((prev) => (prev === "back" ? "front" : "back"));
    };

    const startTimer = () => {
        setElapsed(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setElapsed((prev) => prev + 0.1);
        }, 100);
    };

    const stopTimer = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
    };

    const startCapture = async () => {
        try {
            if (!cameraRef.current) return;
            if (mode === "picture") {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.9,
                    skipProcessing: false,
                });
                setCapturedPhoto(photo.uri);
                setCapturedVideo(null);
                return;
            }
            setIsRecording(true);
            startTimer();
            const video = await cameraRef.current.recordAsync({
                maxDuration: maxDuration,
            });
            if (!video?.uri) return;
            setCapturedVideo(video.uri);
            setCapturedPhoto(null);
        } catch (e) {
            console.log("Capture error:", e);
            Alert.alert(t('error') || 'Error', t('cameraNotSupported') || 'Camera recording not supported on simulator');
        } finally {
            stopTimer();
            setIsRecording(false);
            setIsStarting(false);
            setCountdown(null);
        }
    };

    const stopRecording = async () => {
        try {
            if (!cameraRef.current) return;
            cameraRef.current.stopRecording();
        } catch (e) {
            console.log("Stop error:", e);
        }
    };

    const reset = () => {
        setCapturedPhoto(null);
        setCapturedVideo(null);
        setElapsed(0);
    };

    const uploadToWork = async (uri: string, type: 'image' | 'video') => {
        if (!user?.uid) {
            Alert.alert(t('error'), t('loginRequired'));
            return false;
        }

        setUploading(true);
        try {
            const workId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const workData = {
                id: workId,
                url: uri,
                type: type,
                text: '',
                createdAt: serverTimestamp(),
                userId: user.uid,
                reactions: {},
                commentsCount: 0,
            };

            await setDoc(doc(db, 'users', user.uid, 'works', workId), workData);
            await MediaLibrary.saveToLibraryAsync(uri);
            
            setUploading(false);
            Alert.alert(t('successTitle'), t('workUploaded') || 'Added to your works!');
            reset();
            return true;
        } catch (e) {
            console.log("Upload error:", e);
            setUploading(false);
            Alert.alert(t('error'), 'Failed to upload');
            return false;
        }
    };

    const saveToGallery = async () => {
        const uri = capturedPhoto || capturedVideo;
        if (!uri) return;
        const type = capturedPhoto ? 'image' : 'video';
        await uploadToWork(uri, type);
    };

    if (!camPermission?.granted) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
                    <Ionicons name="chevron-back" size={26} color={colors.foreground} />
                </TouchableOpacity>
                <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.permissionTitle, { color: colors.text }]}>{t('cameraPermission')}</Text>
                <TouchableOpacity onPress={requestCamPermission} style={[styles.primaryBtn, { backgroundColor: colors.foreground }]}>
                    <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>{t('allowCamera')}</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (capturedPhoto) {
        return (
            <View style={styles.previewWrap}>
                <Image source={{ uri: capturedPhoto }} style={styles.previewImage} resizeMode="cover" />
                <SafeAreaView style={styles.previewTopBar}>
                    <TouchableOpacity onPress={reset} style={styles.glassBtn}>
                        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                        <Ionicons name="chevron-back" size={26} color="white" style={{ zIndex: 1 }} />
                    </TouchableOpacity>
                    <View style={styles.glassPill}>
                        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                        <Text style={styles.previewTitle}>{t('photoPreview')}</Text>
                    </View>
                </SafeAreaView>
                <SafeAreaView style={styles.previewActionsSafe}>
                    <View style={styles.previewActions}>
                        <TouchableOpacity onPress={reset} style={styles.actionBtn} disabled={uploading}>
                            <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />
                            <Text style={styles.actionText}>{t('retake')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={saveToGallery} style={styles.saveBtn} disabled={uploading}>
                            {uploading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark" size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.saveBtnText}>{t('saveMedia')}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    if (capturedVideo) {
        return (
            <View style={styles.previewWrap}>
                <Video source={{ uri: capturedVideo }} style={{ width, height }} shouldPlay isLooping />
                <SafeAreaView style={styles.previewTopBar}>
                    <TouchableOpacity onPress={reset} style={styles.glassBtn}>
                        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                        <Ionicons name="chevron-back" size={26} color="white" style={{ zIndex: 1 }} />
                    </TouchableOpacity>
                    <View style={styles.glassPill}>
                        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                        <Text style={styles.previewTitle}>{t('videoPreview')}</Text>
                    </View>
                </SafeAreaView>
                <SafeAreaView style={styles.previewActionsSafe}>
                    <View style={styles.previewActions}>
                        <TouchableOpacity onPress={reset} style={styles.actionBtn} disabled={uploading}>
                            <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />
                            <Text style={styles.actionText}>{t('retake')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={saveToGallery} style={styles.saveBtn} disabled={uploading}>
                            {uploading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark" size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.saveBtnText}>{t('saveMedia')}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView ref={cameraRef} style={styles.camera} facing={cameraType} mode={mode} />

            <SafeAreaView style={styles.topBar}>
                <TouchableOpacity onPress={onBack} style={styles.glassBtn} disabled={isRecording}>
                    <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                    <Ionicons name="chevron-back" size={26} color="white" style={{ zIndex: 1 }} />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.headerTitle}>{t('cameraTitle')}</Text>
                </View>
                <TouchableOpacity onPress={flipCamera} style={styles.glassBtn} disabled={isRecording || isStarting}>
                    <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                    <Ionicons name="camera-reverse" size={24} color="white" style={{ zIndex: 1 }} />
                </TouchableOpacity>
            </SafeAreaView>

            {mode === "video" && !isRecording && (
                <View style={styles.durationRow}>
                    <DurationButton label={getDurationLabel(30)} active={durationMode === 30} onPress={() => setDurationMode(30)} />
                    <DurationButton label={getDurationLabel(60)} active={durationMode === 60} onPress={() => setDurationMode(60)} />
                    <DurationButton label={getDurationLabel("unlimited")} active={durationMode === "unlimited"} onPress={() => setDurationMode("unlimited")} />
                </View>
            )}

            {/* Timer on right side of screen */}
            {isRecording && (
                <View style={styles.timerBadge}>
                    <View style={styles.timerDot} />
                    <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
                </View>
            )}

            {countdown !== null && (
                <View style={styles.countdownOverlay}>
                    <Text style={styles.countdownText}>{countdown}</Text>
                    <Pressable onPress={cancelCountdown} style={styles.cancelHint}>
                        <Text style={styles.cancelHintText}>{t('tapToCancel')}</Text>
                    </Pressable>
                </View>
            )}

            <View style={styles.bottomControls}>
                <Text style={styles.hintText}>
                    {mode === "picture" ? t('tapToPhoto') : isRecording ? t('recording') : t('tapToRecord')}
                </Text>

                <View style={styles.captureContainer}>
                    {/* Progress Ring using SVG */}
                    {isRecording && durationMode !== "unlimited" && (
                        <View style={styles.progressRing}>
                            <Svg width={92} height={92}>
                                <Circle
                                    cx={46}
                                    cy={46}
                                    r={42}
                                    stroke="rgba(255,255,255,0.3)"
                                    strokeWidth={3}
                                    fill="transparent"
                                />
                                <Circle
                                    cx={46}
                                    cy={46}
                                    r={42}
                                    stroke="#FF3B30"
                                    strokeWidth={3}
                                    fill="transparent"
                                    strokeDasharray={264}
                                    strokeDashoffset={264 - (progress * 264)}
                                    strokeLinecap="round"
                                    rotation="-90"
                                    originX={46}
                                    originY={46}
                                />
                            </Svg>
                        </View>
                    )}
                    
                    <TouchableOpacity
                        activeOpacity={0.85}
                        disabled={isStarting}
                        onPress={() => {
                            if (mode === "picture") {
                                safeStartCountdown();
                                return;
                            }
                            if (mode === "video") {
                                if (isRecording) stopRecording();
                                else safeStartCountdown();
                            }
                        }}
                    >
                        <View style={[isRecording ? styles.stopBtn : styles.captureBtn, isRecording && durationMode !== "unlimited" && { borderWidth: 0 }]}>
                            <View style={isRecording ? styles.stopIcon : styles.captureIcon} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.modeSwitcher}>
                    <TouchableOpacity
                        onPress={() => !isRecording && !isStarting && setMode("video")}
                        style={[styles.modeTab, mode === "video" && styles.modeTabActive]}
                        disabled={isRecording || isStarting}
                    >
                        <Ionicons name="videocam" size={16} color={mode === "video" ? "white" : "rgba(255,255,255,0.6)"} />
                        <Text style={[styles.modeTabText, mode === "video" && styles.modeTabTextActive]}>{t('videoMode')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => !isRecording && !isStarting && setMode("picture")}
                        style={[styles.modeTab, mode === "picture" && styles.modeTabActive]}
                        disabled={isRecording || isStarting}
                    >
                        <Ionicons name="camera" size={16} color={mode === "picture" ? "white" : "rgba(255,255,255,0.6)"} />
                        <Text style={[styles.modeTabText, mode === "picture" && styles.modeTabTextActive]}>{t('photoMode')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

function DurationButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.durationBtn, active && styles.durationBtnActive]}>
            <Text style={[styles.durationText, active && styles.durationTextActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "black" },
    camera: { flex: 1 },
    
    topBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    
    glassBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    
    headerTitleWrap: {
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: Theme.radius.pill,
    },
    headerTitle: { color: "white", fontSize: 17, fontWeight: "700", letterSpacing: 0.3 },
    
    durationRow: {
        position: "absolute",
        top: 120,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        gap: 12,
    },
    
    durationBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: Theme.radius.pill,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    durationBtnActive: {
        backgroundColor: "white",
        borderColor: "white",
    },
    durationText: { color: "white", fontWeight: "600", fontSize: 13 },
    durationTextActive: { color: "black" },
    
    timerBadge: {
        position: "absolute",
        top: 120,
        right: 20,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FF3B30",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    timerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "white",
    },
    timerText: {
        color: "white",
        fontSize: 12,
        fontWeight: "700",
        fontVariant: ['tabular-nums'],
    },
    
    countdownOverlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    countdownText: { color: "white", fontSize: 120, fontWeight: "800" },
    cancelHint: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: Theme.radius.pill,
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    cancelHintText: { color: "white", fontWeight: "600", fontSize: 15 },
    
    bottomControls: {
        position: "absolute",
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: "center",
        gap: 20,
    },
    
    hintText: { color: "white", fontWeight: "600", fontSize: 13, opacity: 0.85 },
    
    captureContainer: {
        alignItems: "center",
        justifyContent: "center",
        width: 88,
        height: 88,
    },
    
    progressRing: {
        position: "absolute",
        width: 92,
        height: 92,
    },
    
    captureBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 4,
        borderColor: "white",
    },
    captureIcon: { 
        width: 60, 
        height: 60, 
        borderRadius: 30, 
        backgroundColor: "white" 
    },
    
    stopBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255,59,48,0.3)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 4,
        borderColor: "#FF3B30",
    },
    stopIcon: { 
        width: 32, 
        height: 32, 
        borderRadius: 8, 
        backgroundColor: "#FF3B30" 
    },
    
    modeSwitcher: {
        flexDirection: "row",
        backgroundColor: "rgba(0,0,0,0.4)",
        borderRadius: Theme.radius.pill,
        overflow: "hidden",
    },
    modeTab: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    modeTabActive: { backgroundColor: "rgba(255,255,255,0.2)" },
    modeTabText: { color: "rgba(255,255,255,0.6)", fontWeight: "600", fontSize: 13 },
    modeTabTextActive: { color: "white", fontWeight: "700" },
    
    previewWrap: { flex: 1, backgroundColor: "black" },
    previewImage: { flex: 1, width: "100%" },
    previewTopBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 12,
    },
    glassPill: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: Theme.radius.pill,
        overflow: "hidden",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
    },
    previewTitle: { color: "white", fontSize: 17, fontWeight: "700", zIndex: 1 },
    previewActionsSafe: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
    previewActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 24,
        gap: 16,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 18,
        borderRadius: Theme.radius.md,
        overflow: "hidden",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    actionText: { color: "white", fontWeight: "700", fontSize: 16, zIndex: 1 },
    saveBtn: {
        flex: 1,
        flexDirection: "row",
        paddingVertical: 18,
        borderRadius: Theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FF3B30",
    },
    saveBtnText: { color: "white", fontWeight: "700", fontSize: 16 },
    
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
    permissionTitle: { fontSize: 18, fontWeight: "600", textAlign: "center", marginTop: 16, marginBottom: 8 },
    primaryBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: Theme.radius.md },
    primaryBtnText: { fontWeight: "700", fontSize: 16 },
    
    backBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        top: 16,
        left: 20,
    },
});
