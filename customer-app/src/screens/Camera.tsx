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
    Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    CameraType,
    CameraView,
    useCameraPermissions,
    type CameraMode,
    FlashMode,
} from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import UniversalVideoPlayer from "../components/common/UniversalVideoPlayer";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Theme } from "../theme";
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../api/firebase';
import Svg, { Circle } from 'react-native-svg';
import * as Animatable from 'react-native-animatable';
import * as Device from 'expo-device';
import { Camera, RotateCcw, Zap, ZapOff, Video as VideoIcon, Camera as CameraIcon, Check, X, ChevronLeft, Download, Send, MonitorOff } from 'lucide-react-native';

const { width, height } = Dimensions.get("window");

type DurationMode = 30 | 60 | "unlimited";

interface CameraScreenProps {
    onBack: () => void;
    onNavigate: (screen: string, params?: any) => void;
    t: (key: string) => string;
    language: string;
    theme: string;
    user?: any;
    initialFile?: string;
    fileType?: 'image' | 'video';
}

export default function CameraScreen({ onBack, onNavigate, t, language, theme, user, initialFile, fileType }: CameraScreenProps) {
    const insets = useSafeAreaInsets();
    const colors = theme === "dark" ? Theme.dark.colors : Theme.light.colors;
    const cameraRef = useRef<CameraView>(null);

    const [camPermission, requestCamPermission] = useCameraPermissions();
    const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

    const [isCameraReady, setIsCameraReady] = useState(false);
    const [cameraType, setCameraType] = useState<CameraType>("back");
    const [mode, setMode] = useState<CameraMode>("video");
    const [flash, setFlash] = useState<FlashMode>("off");
    const [zoom, setZoom] = useState(0);
    const [durationMode, setDurationMode] = useState<DurationMode>(30);
    const [isRecording, setIsRecording] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(initialFile && fileType === 'image' ? initialFile : null);
    const [capturedVideo, setCapturedVideo] = useState<string | null>(initialFile && fileType === 'video' ? initialFile : null);
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
        if (duration === 30) return '30s';
        if (duration === 60) return '60s';
        return '∞';
    };

    const tr = (fr: string, ar: string, en: string) => {
        if (language === 'ar') return ar;
        if (language === 'fr') return fr;
        return en;
    };

    useEffect(() => {
        if (initialFile) {
            if (fileType === 'image') {
                setCapturedPhoto(initialFile);
                setCapturedVideo(null);
            } else {
                setCapturedVideo(initialFile);
                setCapturedPhoto(null);
            }
        }
    }, [initialFile, fileType]);

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
        const timer = setTimeout(() => setCountdown((c) => (c ?? 0) - 1), 1000);
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

    const toggleFlash = () => {
        setFlash(prev => prev === "off" ? "on" : "off");
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
            if (!cameraRef.current || !isCameraReady) {
                console.log("Camera not ready or ref null", { isCameraReady, ref: !!cameraRef.current });
                return;
            }

            if (mode === "picture") {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    skipProcessing: Platform.OS === 'android',
                });
                if (photo) {
                    setCapturedPhoto(photo.uri);
                    setCapturedVideo(null);
                }
                return;
            }

            // For Video recording
            setIsRecording(true);
            setElapsed(0);

            // Small delay to ensure UI handles 'isRecording' state before native recording starts
            await new Promise(resolve => setTimeout(resolve, 150));

            startTimer();
            console.log("Starting video recording...");

            const video = await cameraRef.current.recordAsync({
                maxDuration: maxDuration || undefined,
            });

            if (video?.uri) {
                console.log("Video captured:", video.uri);
                setCapturedVideo(video.uri);
                setCapturedPhoto(null);
            }
        } catch (e) {
            console.log("Capture error detail:", e);
            Alert.alert(
                tr('Erreur', 'خطأ', 'Error'),
                tr('Échec de la capture', 'فشل في التقاط الفيديو', 'Camera operation failed. Please try again.')
            );
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
        setUploading(false);
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
            Alert.alert(
                tr('Succès', 'نجاح', 'Success'),
                tr('Ajouté à vos travaux !', 'تمت الإضافة لتجاربك', 'Added to your works!')
            );
            reset();
            return true;
        } catch (e) {
            console.log("Upload error:", e);
            setUploading(false);
            Alert.alert(t('error'), 'Failed to upload');
            return false;
        }
    };

    const uploadToReel = async (uri: string, type: 'image' | 'video') => {
        if (!user?.uid) {
            Alert.alert(t('error'), t('loginRequired'));
            return false;
        }

        setUploading(true);
        try {
            const reelId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const reelData = {
                id: reelId,
                url: uri,
                type: type,
                text: '',
                createdAt: serverTimestamp(),
                userId: user.uid,
                reactions: {},
                commentsCount: 0,
                totalLikes: 0
            };

            await setDoc(doc(db, 'global_reels', reelId), reelData);
            await MediaLibrary.saveToLibraryAsync(uri);

            setUploading(false);
            Alert.alert(
                tr('Succès', 'نجاح', 'Success'),
                tr(
                    type === 'video' ? 'Reel publié avec succès !' : 'Photo publiée en tant que Reel !',
                    type === 'video' ? 'تم نشر الريل بنجاح' : 'تم نشر الصورة كـ ريل بنجاح',
                    type === 'video' ? 'Reel published successfully!' : 'Photo published as Reel successfully!'
                )
            );
            reset();
            return true;
        } catch (e) {
            console.log("Reel Upload error:", e);
            setUploading(false);
            Alert.alert(t('error'), 'Failed to publish reel');
            return false;
        }
    };

    const publishToWorks = async () => {
        const uri = capturedPhoto || capturedVideo;
        if (!uri) return;
        const type = capturedPhoto ? 'image' : 'video';
        await uploadToWork(uri, type);
    };

    const publishAsReel = async () => {
        const uri = capturedPhoto || capturedVideo;
        if (!uri) return;
        const type = capturedPhoto ? 'image' : 'video';
        await uploadToReel(uri, type);
    };

    const saveToGalleryOnly = async () => {
        const uri = capturedPhoto || capturedVideo;
        if (!uri) return;

        setUploading(true);
        try {
            await MediaLibrary.saveToLibraryAsync(uri);
            Alert.alert(
                tr('Succès', 'نجاح', 'Success'),
                tr('Enregistré dans la galerie', 'تم حفظ الملف في معرض الصور', 'Saved to your gallery!')
            );
            reset();
        } catch (e) {
            console.log("Save error:", e);
            Alert.alert(t('error'), 'Failed to save');
        } finally {
            setUploading(false);
        }
    };

    if (!camPermission?.granted) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: colors.muted, top: insets.top + 16 }]}>
                    <ChevronLeft size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Camera size={64} color={colors.textMuted} />
                <Text style={[styles.permissionTitle, { color: colors.text }]}>{t('cameraPermission')}</Text>
                <TouchableOpacity onPress={requestCamPermission} style={[styles.primaryBtn, { backgroundColor: colors.foreground }]}>
                    <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>{t('allowCamera')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (capturedPhoto || capturedVideo) {
        return (
            <View style={styles.previewWrap}>
                {capturedPhoto ? (
                    <Image source={{ uri: capturedPhoto }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                    <UniversalVideoPlayer
                        source={{ uri: capturedVideo! }}
                        style={styles.previewImage}
                        shouldPlay
                        isLooping
                        resizeMode="cover"
                    />
                )}

                <View style={[styles.previewTopBar, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={reset} style={styles.iconBtn}>
                        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                        <X size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.previewHeaderTitle}>
                        <BlurView intensity={40} style={StyleSheet.absoluteFill} tint="dark" />
                        <Text style={styles.previewTitleText}>{capturedPhoto ? t('photoPreview') : t('videoPreview')}</Text>
                    </View>
                    <View style={{ width: 44 }} />
                </View>

                <View style={[styles.previewBottomContent, { paddingBottom: insets.bottom + 30 }]}>
                    <Animatable.View animation="fadeInUp" duration={600} style={styles.previewButtonsContainer}>
                        <View style={styles.previewMainButtons}>
                            <TouchableOpacity onPress={reset} style={styles.retakeBtn} disabled={uploading}>
                                <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />
                                <RotateCcw size={20} color="white" />
                                <Text style={styles.previewBtnText}>{t('retake')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={saveToGalleryOnly} style={styles.saveBtn} disabled={uploading}>
                                <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />
                                <Download size={20} color="white" />
                                <Text style={styles.previewBtnText}>{tr('Enregistrer', 'حفظ بالجهاز', 'Save to Device')}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={publishToWorks} style={styles.publishBtn} disabled={uploading}>
                            {uploading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Send size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.publishBtnText}>{tr('Publier comme Travail', 'نشر كعمل', 'Publish to Works')}</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {(capturedPhoto || capturedVideo) && (
                            <TouchableOpacity
                                onPress={publishAsReel}
                                style={[styles.publishBtn, { backgroundColor: '#A855F7', marginTop: 10 }]}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <VideoIcon size={20} color="white" style={{ marginRight: 8 }} />
                                        <Text style={styles.publishBtnText}>{tr('Publier comme Reel', 'نشر كريم ريل', 'Publish as Reel')}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </Animatable.View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={cameraType}
                mode={mode}
                flash={flash}
                zoom={zoom}
                onCameraReady={() => {
                    console.log("Camera component ready");
                    setIsCameraReady(true);
                }}
                onMountError={(error) => {
                    console.error("Camera mount error:", error);
                    Alert.alert(tr("Erreur", "خطأ", "Error"), tr("Erreur de caméra", "خطأ في الكاميرا", "Camera failed to initialize"));
                }}
            />

            {!Device.isDevice && (
                <View style={[StyleSheet.absoluteFill, styles.simulatorNotice]}>
                    <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
                    <MonitorOff size={64} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.simulatorText}>
                        {tr("Caméra indisponible", "الكاميرا غير متوفرة", "Camera Unavailable")}
                    </Text>
                    <Text style={styles.simulatorSubtext}>
                        {tr("Veuillez tester sur un appareil réel.", "يرجى التجربة على جهاز حقيقي", "Please test on a physical device to use the camera.")}
                    </Text>
                    <TouchableOpacity onPress={onBack} style={styles.simulatorBackBtn}>
                        <Text style={{ color: '#FFF', fontWeight: '700' }}>{tr("Retour", "رجوع", "Back")}</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.overlay}>
                {/* Header Section */}
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <View style={styles.headerSide}>
                        <TouchableOpacity onPress={onBack} style={styles.iconBtn} disabled={isRecording}>
                            <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                            <ChevronLeft size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.headerCenter}>
                        {isRecording ? (
                            <Animatable.View animation="pulse" iterationCount="infinite">
                                <View style={[styles.timerBadge, { height: 36 }]}>
                                    <View style={styles.liveDot} />
                                    <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
                                </View>
                            </Animatable.View>
                        ) : (
                            <View style={styles.modeIndicator}>
                                <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                                <Text style={styles.modeIndicatorText}>{mode === "video" ? t('videoTitle') : t('photoTitle')}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.headerSide}>
                        <TouchableOpacity onPress={toggleFlash} style={styles.iconBtn} disabled={isRecording}>
                            <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                            {flash === "on" ? <Zap size={20} color="#FFCC00" /> : <ZapOff size={20} color="white" />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Secondary Actions (Floating on right) */}
                {!isRecording && !isStarting && (
                    <View style={[styles.secondaryActions, { top: insets.top + 66 }]}>
                        <TouchableOpacity onPress={flipCamera} style={styles.iconBtn}>
                            <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                            <RotateCcw size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Duration Picker for Video Mode */}
                {mode === "video" && !isRecording && (
                    <Animatable.View animation="fadeIn" style={[styles.durationContainer, { top: insets.top + 70 }]}>
                        <View style={styles.durationPill}>
                            <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                            <DurationButton label="30s" active={durationMode === 30} onPress={() => setDurationMode(30)} />
                            <DurationButton label="60s" active={durationMode === 60} onPress={() => setDurationMode(60)} />
                            <DurationButton label="∞" active={durationMode === "unlimited"} onPress={() => setDurationMode("unlimited")} />
                        </View>
                    </Animatable.View>
                )}

                {/* Bottom Controls */}
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 40) }]}>
                    {/* Capture Section */}
                    <View style={styles.captureSection}>
                        <View style={styles.captureWrapper}>
                            {isRecording && durationMode !== "unlimited" && (
                                <View style={styles.progressRing}>
                                    <Svg width={96} height={96}>
                                        <Circle
                                            cx={48}
                                            cy={48}
                                            r={44}
                                            stroke="rgba(255,255,255,0.2)"
                                            strokeWidth={4}
                                            fill="transparent"
                                        />
                                        <Circle
                                            cx={48}
                                            cy={48}
                                            r={44}
                                            stroke="#FF3B30"
                                            strokeWidth={4}
                                            fill="transparent"
                                            strokeDasharray={2 * Math.PI * 44}
                                            strokeDashoffset={2 * Math.PI * 44 * (1 - progress)}
                                            strokeLinecap="round"
                                            rotation="-90"
                                            originX={48}
                                            originY={48}
                                        />
                                    </Svg>
                                </View>
                            )}

                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => {
                                    if (mode === "picture") {
                                        startCapture();
                                    } else {
                                        if (isRecording) stopRecording();
                                        else safeStartCountdown();
                                    }
                                }}
                                disabled={isStarting}
                                style={[
                                    styles.captureOuter,
                                    isRecording && { borderColor: '#FF3B30' }
                                ]}
                            >
                                <Animatable.View
                                    animation={isRecording ? "pulse" : undefined}
                                    iterationCount="infinite"
                                    style={[
                                        styles.captureInner,
                                        isRecording ? styles.captureInnerRecording : { backgroundColor: 'white' }
                                    ]}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Mode Selector */}
                    <View style={styles.modeSelectorWrap}>
                        <View style={styles.modeSelectorPill}>
                            <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                            <TouchableOpacity
                                onPress={() => !isRecording && !isStarting && setMode("video")}
                                style={[styles.modeItem, mode === "video" && styles.modeItemActive]}
                            >
                                <VideoIcon size={16} color={mode === "video" ? "black" : "white"} />
                                <Text style={[styles.modeText, mode === "video" && styles.modeTextActive]}>{t('videoMode')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => !isRecording && !isStarting && setMode("picture")}
                                style={[styles.modeItem, mode === "picture" && styles.modeItemActive]}
                            >
                                <CameraIcon size={16} color={mode === "picture" ? "black" : "white"} />
                                <Text style={[styles.modeText, mode === "picture" && styles.modeTextActive]}>{t('photoMode')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Countdown Overlay */}
                {countdown !== null && (
                    <Animatable.View animation="fadeIn" duration={200} style={styles.countdownOverlay}>
                        <Animatable.Text
                            key={countdown}
                            animation="zoomIn"
                            duration={500}
                            style={styles.countdownNumber}
                        >
                            {countdown}
                        </Animatable.Text>
                        <Pressable onPress={cancelCountdown} style={styles.cancelCountdown}>
                            <Text style={styles.cancelCountdownText}>{t('tapToCancel')}</Text>
                        </Pressable>
                    </Animatable.View>
                )}
            </View>
        </View>
    );
}

function DurationButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.durationItem, active && styles.durationItemActive]}
        >
            <Text style={[styles.durationLabel, active && styles.durationLabelActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "black" },
    camera: { flex: 1 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        zIndex: 10,
    },
    headerSide: {
        width: 44,
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
    },
    secondaryActions: {
        position: 'absolute',
        right: 20,
        alignItems: 'center',
        gap: 12,
        zIndex: 10,
    },
    modeIndicator: {
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
    },
    modeIndicatorText: {
        color: "white",
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    durationContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    durationPill: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
        overflow: 'hidden',
        padding: 4,
    },
    durationItem: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    durationItemActive: {
        backgroundColor: 'white',
    },
    durationLabel: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    durationLabelActive: {
        color: 'black',
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF3B30',
        paddingHorizontal: 16,
        borderRadius: 18,
        gap: 6,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'white',
    },
    timerText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    footer: {
        alignItems: 'center',
    },
    captureSection: {
        marginBottom: 30,
    },
    captureWrapper: {
        width: 96,
        height: 96,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressRing: {
        position: 'absolute',
        zIndex: 1,
    },
    captureOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    captureInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    captureInnerRecording: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#FF3B30',
    },
    modeSelectorWrap: {
        alignItems: 'center',
    },
    modeSelectorPill: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 25,
        overflow: 'hidden',
        padding: 4,
    },
    modeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    modeItemActive: {
        backgroundColor: 'white',
    },
    modeText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
    },
    modeTextActive: {
        color: 'black',
    },
    countdownOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    countdownNumber: {
        color: 'white',
        fontSize: 180,
        fontWeight: '900',
    },
    cancelCountdown: {
        marginTop: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    cancelCountdownText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    previewWrap: {
        flex: 1,
        backgroundColor: 'black'
    },
    previewImage: {
        flex: 1,
        width: "100%"
    },
    previewTopBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        zIndex: 10,
    },
    previewHeaderTitle: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    previewTitleText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
        zIndex: 1,
    },
    previewBottomContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
    },
    previewButtonsContainer: {
        gap: 12,
    },
    previewMainButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    retakeBtn: {
        flex: 1,
        flexDirection: 'row',
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        gap: 8,
    },
    saveBtn: {
        flex: 1,
        flexDirection: 'row',
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        gap: 8,
    },
    publishBtn: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF3B30',
        ...Theme.shadow.md,
    },
    previewBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
        zIndex: 1,
    },
    publishBtnText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '800',
    },
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
    simulatorNotice: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        padding: 40,
    },
    simulatorText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
    },
    simulatorSubtext: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    simulatorBackBtn: {
        marginTop: 20,
        backgroundColor: '#FF3B30',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    }
});
