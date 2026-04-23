import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../api/firebase';
import { ChevronLeft, CheckCircle2, ShieldCheck, User, Clock, RefreshCcw } from 'lucide-react-native';
import { Theme } from '../theme';
import { uploadToSanity } from '../utils/sanity';

const { width, height } = Dimensions.get('window');
const OVAL_WIDTH = width * 0.72;
const OVAL_HEIGHT = OVAL_WIDTH * 1.35;

interface KYCScreenProps {
    onBack: () => void;
    user: any;
    profileData: any;
    updateProfile: (data: any) => Promise<void>;
    theme: 'light' | 'dark';
    t: (key: string) => string;
    language: string;
}

export default function KYCScreen({ onBack, user, profileData, updateProfile, theme, t, language }: KYCScreenProps) {
    const isDark = theme === 'dark';
    const colors = isDark ? Theme.dark.colors : Theme.light.colors;
    const insets = useSafeAreaInsets();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form
    const [fullName, setFullName] = useState(profileData?.fullName || user?.displayName || '');
    const [dob, setDob] = useState(profileData?.kycData?.dob || '');

    // Camera / selfie
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraReady, setCameraReady] = useState(false);
    const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    // Scan animation
    const scanAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (step === 2 && !capturedSelfie) {
            startScanAnimation();
        }
    }, [step, capturedSelfie]);

    const startScanAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
            ])
        ).start();
    };

    // ── Date auto-format ────────────────────────────────────────────────────────
    const handleDobChange = (text: string) => {
        // Strip everything except digits
        const digits = text.replace(/\D/g, '');
        let formatted = '';
        if (digits.length <= 2) {
            formatted = digits;
        } else if (digits.length <= 4) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        } else {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
        }
        setDob(formatted);
    };

    // ── Camera ──────────────────────────────────────────────────────────────────
    const takeSelfie = async () => {
        if (!cameraRef.current || !cameraReady || isCapturing) return;
        setIsCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
            if (photo?.uri) {
                setCapturedSelfie(photo.uri);
                scanAnim.stopAnimation();
                pulseAnim.stopAnimation();
            }
        } catch (e) {
            Alert.alert(tr('Error', 'Erreur', 'خطأ'), tr('Failed to capture', 'Échec de la capture', 'فشل في التقاط الصورة'));
        } finally {
            setIsCapturing(false);
        }
    };

    const retakeSelfie = () => {
        setCapturedSelfie(null);
        scanAnim.setValue(0);
        pulseAnim.setValue(1);
        startScanAnimation();
    };

    // ── Submit ──────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!fullName || !dob || !capturedSelfie) {
            Alert.alert(
                tr('Missing Information', 'Informations Manquantes', 'معلومات ناقصة'),
                tr('Please complete all fields and capture your selfie.', 'Veuillez remplir tous les champs et prendre votre selfie.', 'يرجى إكمال جميع الحقول والتقاط صورتك الذاتية.')
            );
            return;
        }
        setLoading(true);
        try {
            const selfieUrl = await uploadToSanity(capturedSelfie);
            const kycData = {
                fullName,
                dob,
                requestedRole: 'user',
                selfieUrl,
                submittedAt: new Date().toISOString(),
                status: 'pending',
                rejectionReason: null,
            };
            await updateDoc(doc(db, 'users', user.uid), { kycStatus: 'pending', kycData });
            await updateProfile({ kycStatus: 'pending', kycData });
            Alert.alert(
                tr('Submission Successful', 'Soumission Réussie', 'تم الإرسال بنجاح'),
                tr(
                    'Your verification info has been submitted. We will notify you once reviewed.',
                    'Vos informations ont été soumises. Nous vous informerons une fois examiné.',
                    'تم إرسال معلوماتك. سنخطرك بمجرد المراجعة.'
                ),
                [{ text: 'OK', onPress: onBack }]
            );
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const tr = (en: string, fr: string, ar: string) =>
        language === 'ar' ? ar : language === 'fr' ? fr : en;

    // ── Header ──────────────────────────────────────────────────────────────────
    const renderHeader = () => (
        <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
            <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <ChevronLeft size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                    {tr('Account Verification', 'Vérification du Compte', 'تحقق من الحساب')}
                </Text>
                <View style={{ width: 40 }} />
            </View>
        </View>
    );

    const renderProgressBar = () => (
        <View style={[styles.progressContainer, { marginTop: insets.top + 80 }]}>
            <View style={[styles.stepDot, { backgroundColor: step >= 1 ? colors.success : colors.border }]} />
            <View style={[styles.stepLine, { backgroundColor: step >= 2 ? colors.success : colors.border }]} />
            <View style={[styles.stepDot, { backgroundColor: step >= 2 ? colors.success : colors.border }]} />
        </View>
    );

    // ── Step 1: Personal Info ───────────────────────────────────────────────────
    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                {tr('Personal Information', 'Informations Personnelles', 'المعلومات الشخصية')}
            </Text>
            <Text style={[styles.stepSub, { color: colors.textMuted }]}>
                {tr('Please enter your details to verify your account.', 'Veuillez saisir vos détails pour vérifier votre compte.', 'يرجى إدخال التفاصيل الخاصة بك للتحقق من حسابك.')}
            </Text>

            {/* Full Name */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                    {tr('Full Name', 'Nom Complet', 'الاسم الكامل')}
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5', borderColor: colors.border }]}>
                    <User size={20} color={colors.textMuted} />
                    <TextInput
                        style={[styles.input, { color: colors.foreground }]}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholderTextColor={colors.textMuted}
                        placeholder="John Doe"
                    />
                </View>
            </View>

            {/* Date of Birth — auto-formatted */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                    {tr('Date of Birth', 'Date de Naissance', 'تاريخ الميلاد')}
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5', borderColor: colors.border }]}>
                    <Text style={{ color: colors.textMuted, marginRight: 8 }}>📅</Text>
                    <TextInput
                        style={[styles.input, { color: colors.foreground }]}
                        value={dob}
                        onChangeText={handleDobChange}
                        placeholderTextColor={colors.textMuted}
                        placeholder="DD/MM/YYYY"
                        keyboardType="numeric"
                        maxLength={10}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: colors.foreground }]}
                onPress={() => {
                    if (fullName && dob.length === 10) setStep(2);
                    else Alert.alert(
                        tr('Required', 'Requis', 'مطلوب'),
                        tr('Please enter your full name and complete date of birth (DD/MM/YYYY).', 'Veuillez entrer votre nom complet et date de naissance complète (JJ/MM/AAAA).', 'يرجى إدخال اسمك الكامل وتاريخ الميلاد الكامل.')
                    );
                }}
            >
                <Text style={[styles.nextBtnText, { color: colors.background }]}>{tr('Next', 'Suivant', 'التالي')}</Text>
            </TouchableOpacity>
        </View>
    );

    // ── Step 2: Face Scan ───────────────────────────────────────────────────────
    const renderStep2 = () => {
        if (!permission) return <ActivityIndicator color={colors.foreground} style={{ marginTop: 40 }} />;

        if (!permission.granted) {
            return (
                <View style={styles.stepContainer}>
                    <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                        {tr('Profile Verification', 'Vérification du Profil', 'التحقق من الملف الشخصي')}
                    </Text>
                    <Text style={[styles.stepSub, { color: colors.textMuted }]}>
                        {tr('Camera access is required to take your selfie.', 'L\'accès à la caméra est requis pour prendre votre selfie.', 'مطلوب الوصول إلى الكاميرا لالتقاط صورتك الذاتية.')}
                    </Text>
                    <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.foreground }]} onPress={requestPermission}>
                        <Text style={[styles.nextBtnText, { color: colors.background }]}>{tr('Allow Camera', 'Autoriser la Caméra', 'السماح بالكاميرا')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.backStepBtn, { borderColor: colors.border, marginTop: 12 }]} onPress={() => setStep(1)}>
                        <Text style={{ color: colors.foreground }}>{tr('Back', 'Retour', 'رجوع')}</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const scanY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-OVAL_HEIGHT / 2, OVAL_HEIGHT / 2] });

        return (
            <View style={styles.stepContainer}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                    {tr('Face Scan', 'Scan du Visage', 'مسح الوجه')}
                </Text>
                <Text style={[styles.stepSub, { color: colors.textMuted }]}>
                    {capturedSelfie
                        ? tr('Photo captured! Submit or retake.', 'Photo capturée ! Soumettez ou reprenez.', 'تم التقاط الصورة! أرسل أو أعد المحاولة.')
                        : tr('Position your face inside the oval and tap capture.', 'Positionnez votre visage dans l\'ovale et appuyez pour capturer.', 'ضع وجهك داخل البيضاوي واضغط للتقاط.')}
                </Text>

                {/* Camera / Preview container */}
                <View style={styles.cameraContainer}>
                    {capturedSelfie ? (
                        // ── Captured preview ─────────────────────────────────
                        <>
                            <Image source={{ uri: capturedSelfie }} style={styles.cameraFull} />
                            {/* Oval mask overlay */}
                            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                <View style={[styles.ovalOverlay, { borderColor: '#34C759' }]}>
                                    <CheckCircle2 size={36} color="#34C759" style={{ marginBottom: 8 }} />
                                    <Text style={{ color: '#34C759', fontWeight: '800', fontSize: 13 }}>
                                        {tr('Captured', 'Capturé', 'تم الالتقاط')}
                                    </Text>
                                </View>
                            </View>
                        </>
                    ) : (
                        // ── Live camera ──────────────────────────────────────
                        <>
                            <CameraView
                                ref={cameraRef}
                                style={styles.cameraFull}
                                facing="front"
                                onCameraReady={() => setCameraReady(true)}
                            />
                            {/* Dark surround mask */}
                            <View style={styles.darkMask} pointerEvents="none">
                                <View style={styles.maskTop} />
                                <View style={styles.maskMiddleRow}>
                                    <View style={styles.maskSide} />
                                    <Animated.View style={[styles.ovalCutout, { transform: [{ scale: pulseAnim }], borderColor: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)' }]}>
                                        {/* Scan line */}
                                        <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanY }] }]} />
                                        {/* Corner accents */}
                                        <View style={[styles.corner, styles.cornerTL]} />
                                        <View style={[styles.corner, styles.cornerTR]} />
                                        <View style={[styles.corner, styles.cornerBL]} />
                                        <View style={[styles.corner, styles.cornerBR]} />
                                    </Animated.View>
                                    <View style={styles.maskSide} />
                                </View>
                                <View style={styles.maskBottom} />
                            </View>
                        </>
                    )}
                </View>

                {/* Capture / Retake button */}
                <View style={styles.cameraActions}>
                    {capturedSelfie ? (
                        <TouchableOpacity onPress={retakeSelfie} style={[styles.retakeBtn, { borderColor: colors.border }]}>
                            <RefreshCcw size={18} color={colors.foreground} />
                            <Text style={{ color: colors.foreground, fontWeight: '700', marginLeft: 8 }}>
                                {tr('Retake', 'Reprendre', 'إعادة')}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={takeSelfie}
                            disabled={!cameraReady || isCapturing}
                            style={[styles.captureBtn, { opacity: cameraReady ? 1 : 0.4 }]}
                        >
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Nav buttons */}
                <View style={styles.btnRow}>
                    <TouchableOpacity style={[styles.backStepBtn, { borderColor: colors.border }]} onPress={() => setStep(1)}>
                        <Text style={{ color: colors.foreground }}>{tr('Back', 'Retour', 'رجوع')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.nextBtn, { backgroundColor: colors.success, flex: 1, marginLeft: 10, opacity: capturedSelfie ? 1 : 0.4 }]}
                        onPress={handleSubmit}
                        disabled={loading || !capturedSelfie}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={[styles.nextBtnText, { color: 'white' }]}>{tr('Submit', 'Soumettre', 'إرسال')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // ── Status screens ──────────────────────────────────────────────────────────
    if (profileData?.kycStatus === 'pending') {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {renderHeader()}
                <View style={styles.centerContainer}>
                    <Clock size={80} color={colors.warning} style={{ marginBottom: 20 }} />
                    <Text style={[styles.statusTitle, { color: colors.foreground }]}>{tr('Verification Pending', 'Vérification en Cours', 'قيد التحقق')}</Text>
                    <Text style={[styles.statusDesc, { color: colors.textMuted }]}>
                        {tr('Your information is under review. This usually takes 24-48 hours.', 'Vos informations sont en cours d\'examen. Cela prend généralement 24 à 48 heures.', 'معلوماتك قيد المراجعة. يستغرق هذا عادةً 24-48 ساعة.')}
                    </Text>
                    <TouchableOpacity style={[styles.homeBtn, { backgroundColor: colors.foreground }]} onPress={onBack}>
                        <Text style={[styles.homeBtnText, { color: colors.background }]}>{tr('Back to Profile', 'Retour au Profil', 'العودة للملف الشخصي')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (profileData?.kycStatus === 'approved') {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {renderHeader()}
                <View style={styles.centerContainer}>
                    <ShieldCheck size={80} color={colors.success} style={{ marginBottom: 20 }} />
                    <Text style={[styles.statusTitle, { color: colors.foreground }]}>{tr('Verified', 'Vérifié', 'تم التحقق')}</Text>
                    <Text style={[styles.statusDesc, { color: colors.textMuted }]}>
                        {tr('Your account has been verified successfully.', 'Votre compte a été vérifié avec succès.', 'تم التحقق من حسابك بنجاح.')}
                    </Text>
                    <TouchableOpacity style={[styles.homeBtn, { backgroundColor: colors.foreground }]} onPress={onBack}>
                        <Text style={[styles.homeBtnText, { color: colors.background }]}>{tr('Back to Profile', 'Retour au Profil', 'العودة للملف الشخصي')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {renderHeader()}
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {renderProgressBar()}
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
            </ScrollView>
        </View>
    );
}

const CORNER_SIZE = 22;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    scrollContent: { padding: 20, paddingBottom: 150 },
    progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30, paddingHorizontal: 40 },
    stepDot: { width: 12, height: 12, borderRadius: 6 },
    stepLine: { flex: 1, height: 2 },
    stepContainer: { flex: 1 },
    stepTitle: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
    stepSub: { fontSize: 14, marginBottom: 24 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, height: 50 },
    input: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '600' },
    nextBtn: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    nextBtnText: { fontSize: 16, fontWeight: '700' },
    btnRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
    backStepBtn: { height: 50, paddingHorizontal: 25, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

    // Camera
    cameraContainer: {
        width: '100%',
        height: OVAL_HEIGHT + 80,
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: '#000',
        marginBottom: 16,
        position: 'relative',
    },
    cameraFull: { width: '100%', height: '100%' },
    darkMask: { ...StyleSheet.absoluteFillObject, alignItems: 'center' },
    maskTop: { width: '100%', flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
    maskMiddleRow: { flexDirection: 'row', height: OVAL_HEIGHT },
    maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
    ovalCutout: {
        width: OVAL_WIDTH,
        height: OVAL_HEIGHT,
        borderRadius: OVAL_WIDTH / 2,
        borderWidth: 2.5,
        overflow: 'hidden',
        position: 'relative',
    },
    ovalOverlay: {
        position: 'absolute',
        alignSelf: 'center',
        top: (OVAL_HEIGHT + 80) / 2 - OVAL_HEIGHT / 2,
        width: OVAL_WIDTH,
        height: OVAL_HEIGHT,
        borderRadius: OVAL_WIDTH / 2,
        borderWidth: 2.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    maskBottom: { width: '100%', flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(52,199,89,0.75)',
        shadowColor: '#34C759',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
    },
    corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#34C759', borderWidth: CORNER_WIDTH },
    cornerTL: { top: 10, left: 10, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 4 },
    cornerTR: { top: 10, right: 10, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 4 },
    cornerBL: { bottom: 10, left: 10, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 4 },
    cornerBR: { bottom: 10, right: 10, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 4 },

    cameraActions: { alignItems: 'center', marginBottom: 8 },
    captureBtn: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: 'white', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
    captureInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'white' },
    retakeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, borderWidth: 1 },

    centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
    statusTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
    statusDesc: { textAlign: 'center', marginBottom: 30, fontSize: 16, lineHeight: 24 },
    homeBtn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
    homeBtnText: { fontWeight: 'bold' },
});
