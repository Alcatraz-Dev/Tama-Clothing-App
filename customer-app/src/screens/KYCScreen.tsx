import React, { useState } from 'react';
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
    Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../api/firebase';
import { ChevronLeft, Upload, CheckCircle2, XCircle, ShieldCheck, Camera, CreditCard, User, Clock } from 'lucide-react-native';
import { Theme } from '../theme';

interface KYCScreenProps {
    onBack: () => void;
    user: any;
    profileData: any;
    updateProfile: (data: any) => Promise<void>;
    theme: 'light' | 'dark';
    t: (key: string) => string;
    language: string;
}

import { uploadToBunny } from '../utils/bunny';

export default function KYCScreen({ onBack, user, profileData, updateProfile, theme, t, language }: KYCScreenProps) {
    const isDark = theme === 'dark';
    const colors = isDark ? Theme.dark.colors : Theme.light.colors;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [fullName, setFullName] = useState(profileData?.fullName || user?.displayName || '');
    const [dob, setDob] = useState(profileData?.kycData?.dob || '');
    const [requestedRole, setRequestedRole] = useState<'user' | 'driver' | 'brand_owner'>(profileData?.kycData?.requestedRole || 'user');
    const [vehicleType, setVehicleType] = useState(profileData?.kycData?.vehicleType || '');

    // Images
    const [selfie, setSelfie] = useState<string | null>(null);

    const pickImage = async (type: 'selfie') => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert(t('permissionDenied') || 'Permission Required', t('mediaPermissionMessage') || 'Please allow access to your photo library.');
                return;
            }
            
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                if (type === 'selfie') setSelfie(result.assets[0].uri);
            }
        } catch (error: any) {
            console.log('Image picker error:', error);
            Alert.alert(t('error') || 'Error', error.message || 'Could not select image');
        }
    };

    const uploadImage = async (uri: string) => {
        return uploadToBunny(uri);
    };

    const handleSubmit = async () => {
        if (!fullName || !dob || !selfie) {
            Alert.alert(tr('Missing Information', 'Informations Manquantes', 'معلومات ناقصة'), tr('Please complete all fields and upload your profile photo.', 'Veuillez remplir tous les champs et télécharger votre photo de profil.', 'يرجى إكمال جميع الحقول وتحميل صورة ملفك الشخصي.'));
            return;
        }

        setLoading(true);
        try {
            const uid = user.uid;

            // Upload Image
            const selfieUrl = await uploadImage(selfie);

            const kycData = {
                fullName,
                dob,
                requestedRole,
                vehicleType,
                selfieUrl: selfieUrl,
                submittedAt: new Date().toISOString(),
                status: 'pending',
                rejectionReason: null
            };

            // Update Firestore
            await updateDoc(doc(db, 'users', uid), {
                kycStatus: 'pending',
                kycData: kycData
            });

            // Update local profile state
            await updateProfile({
                kycStatus: 'pending',
                kycData: kycData
            });

            Alert.alert(
                tr('Submission Successful', 'Soumission Réussie', 'تم الإرسال بنجاح'),
                tr('Your account verification info has been submitted. We will notify you once verified.', 'Vos informations de vérification de compte ont été soumises. Nous vous informerons une fois vérifié.', 'تم إرسال معلومات التحقق من حسابك. سنخطرك بمجرد التحقق.'),
                [{ text: 'OK', onPress: onBack }]
            );
        } catch (error) {
            console.error('KYC Submission Error:', error);
            Alert.alert('Submission Failed', 'Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const insets = useSafeAreaInsets();

    // Translations helper
    const tr = (en: string, fr: string, ar: string) => {
        return language === 'ar' ? ar : (language === 'fr' ? fr : en);
    };

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
            <View style={[styles.stepDot, step >= 1 ? { backgroundColor: colors.success } : { backgroundColor: colors.border }]} />
            <View style={[styles.stepLine, step >= 2 ? { backgroundColor: colors.success } : { backgroundColor: colors.border }]} />
            <View style={[styles.stepDot, step >= 2 ? { backgroundColor: colors.success } : { backgroundColor: colors.border }]} />
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{tr('Personal Information', 'Informations Personnelles', 'المعلومات الشخصية')}</Text>
            <Text style={[styles.stepSub, { color: colors.textMuted }]}>{tr('Please enter your details to verify your account.', 'Veuillez saisir vos détails pour vérifier votre compte.', 'يرجى إدخال التفاصيل الخاصة بك للتحقق من حسابك.')}</Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{tr('Full Name', 'Nom Complet', 'الاسم الكامل')}</Text>
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

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{tr('Date of Birth', 'Date de Naissance', 'تاريخ الميلاد')}</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5', borderColor: colors.border }]}>
                    <Text style={{ color: colors.textMuted, marginRight: 8 }}>📅</Text>
                    <TextInput
                        style={[styles.input, { color: colors.foreground }]}
                        value={dob}
                        onChangeText={setDob}
                        placeholderTextColor={colors.textMuted}
                        placeholder="DD/MM/YYYY"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>ACCOUNT TYPE</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                    {['user', 'driver', 'brand_owner'].map((role) => (
                        <TouchableOpacity
                            key={role}
                            style={{
                                flex: 1,
                                padding: 10,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: requestedRole === role ? colors.foreground : colors.border,
                                backgroundColor: requestedRole === role ? colors.foreground : 'transparent',
                                alignItems: 'center'
                            }}
                            onPress={() => setRequestedRole(role as any)}
                        >
                            <Text style={{
                                color: requestedRole === role ? colors.background : colors.foreground,
                                fontWeight: '700',
                                fontSize: 10,
                                textTransform: 'uppercase'
                            }}>
                                {role.replace('_', ' ')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {requestedRole === 'driver' && (
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>VEHICLE TYPE</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5', borderColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { color: colors.foreground }]}
                            value={vehicleType}
                            onChangeText={setVehicleType}
                            placeholderTextColor={colors.textMuted}
                            placeholder="e.g. Scooter, Car, Van"
                        />
                    </View>
                </View>
            )}

            <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: colors.foreground }]}
                onPress={() => {
                    if (fullName && dob) setStep(2);
                    else Alert.alert(tr('Required', 'Requis', 'مطلوب'), tr('Please fill all fields', 'Veuillez remplir tous les champs', 'يرجى ملء جميع الحقول'));
                }}
            >
                <Text style={[styles.nextBtnText, { color: colors.background }]}>{tr('Next', 'Suivant', 'التالي')}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{tr('Profile Verification', 'Vérification du Profil', 'التحقق من الملف الشخصي')}</Text>
            <Text style={[styles.stepSub, { color: colors.textMuted }]}>{tr('Please upload a clear selfie of yourself for account verification.', 'Veuillez télécharger un selfie clair pour la vérification de votre compte.', 'يرجى تحميل صورة ذاتية واضحة للتحقق من حسابك.')}</Text>

            <TouchableOpacity style={[styles.uploadBox, { height: 300, borderColor: colors.border, backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9' }]} onPress={() => pickImage('selfie')}>
                {selfie ? (
                    <Image source={{ uri: selfie }} style={styles.uploadedImage} />
                ) : (
                    <View style={styles.uploadPlaceholder}>
                        <Camera size={50} color={colors.textMuted} />
                        <Text style={[styles.uploadText, { color: colors.textMuted }]}>{tr('Tap to take photo', 'Appuyez pour prendre photo', 'اضغط لالتقاط الصورة')}</Text>
                    </View>
                )}
                {selfie && <TouchableOpacity style={styles.removeBtn} onPress={() => setSelfie(null)}><XCircle color="white" size={20} /></TouchableOpacity>}
            </TouchableOpacity>

            <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.backStepBtn, { borderColor: colors.border }]} onPress={() => setStep(1)}>
                    <Text style={{ color: colors.foreground }}>{tr('Back', 'Retour', 'رجوع')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: colors.success, flex: 1, marginLeft: 10 }]}
                    onPress={handleSubmit}
                    disabled={loading}
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
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderProgressBar()}
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 150,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        paddingHorizontal: 40,
    },
    stepDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    stepLine: {
        flex: 1,
        height: 2,
    },
    stepContainer: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 10,
    },
    stepSub: {
        fontSize: 14,
        marginBottom: 30,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
    },
    nextBtn: {
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    nextBtnText: {
        fontSize: 16,
        fontWeight: '700',
    },
    uploadBox: {
        width: '100%',
        height: 200,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 20,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 10,
        fontWeight: '600',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        padding: 5,
    },
    btnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },
    backStepBtn: {
        height: 50,
        paddingHorizontal: 25,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    statusTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 10,
    },
    statusDesc: {
        textAlign: 'center',
        marginBottom: 30,
        fontSize: 16,
        lineHeight: 24,
    },
    homeBtn: {
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 30,
    },
    homeBtnText: {
        fontWeight: 'bold',
    },
});
