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

const CLOUDINARY_CLOUD_NAME = 'ddjzpo6p2';
const CLOUDINARY_UPLOAD_PRESET = 'tama_clothing';

export default function KYCScreen({ onBack, user, profileData, updateProfile, theme, t, language }: KYCScreenProps) {
    const isDark = theme === 'dark';
    const colors = isDark ? Theme.dark.colors : Theme.light.colors;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [fullName, setFullName] = useState(profileData?.fullName || user?.displayName || '');
    const [idNumber, setIdNumber] = useState(profileData?.kycData?.idNumber || '');
    const [dob, setDob] = useState(profileData?.kycData?.dob || '');
    const [requestedRole, setRequestedRole] = useState<'user' | 'driver' | 'brand_owner'>(profileData?.kycData?.requestedRole || 'user');
    const [vehicleType, setVehicleType] = useState(profileData?.kycData?.vehicleType || '');

    // Images
    const [idFront, setIdFront] = useState<string | null>(null);
    const [idBack, setIdBack] = useState<string | null>(null);
    const [selfie, setSelfie] = useState<string | null>(null);

    const pickImage = async (type: 'front' | 'back' | 'selfie') => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: type === 'selfie' ? [1, 1] : [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                if (type === 'front') setIdFront(result.assets[0].uri);
                if (type === 'back') setIdBack(result.assets[0].uri);
                if (type === 'selfie') setSelfie(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Could not select image');
        }
    };

    const uploadImage = async (uri: string) => {
        if (!uri) return null;
        try {
            const formData = new FormData();
            // @ts-ignore
            formData.append('file', {
                uri: uri,
                type: 'image/jpeg',
                name: 'upload.jpg',
            });
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            const data = await response.json();
            if (data.secure_url) {
                return data.secure_url;
            }
            throw new Error(data.error?.message || 'Cloudinary upload failed');
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    };

    const handleSubmit = async () => {
        if (!fullName || !idNumber || !dob || !idFront || !idBack || !selfie) {
            Alert.alert('Missing Information', 'Please complete all fields and upload all required documents.');
            return;
        }

        setLoading(true);
        try {
            const uid = user.uid;
            const timestamp = Date.now();

            // Upload Images
            const frontUrl = await uploadImage(idFront);
            const backUrl = await uploadImage(idBack);
            const selfieUrl = await uploadImage(selfie);

            const kycData = {
                fullName,
                idNumber,
                dob,
                requestedRole,
                vehicleType,
                idFrontUrl: frontUrl,
                idBackUrl: backUrl,
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
                'Submission Successful',
                'Your KYC documents have been submitted for review. We will notify you once verified.',
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
                    {tr('Verify Identity', 'Vérifier Identité', 'تأكيد الهوية')}
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
            <View style={[styles.stepLine, step >= 3 ? { backgroundColor: colors.success } : { backgroundColor: colors.border }]} />
            <View style={[styles.stepDot, step >= 3 ? { backgroundColor: colors.success } : { backgroundColor: colors.border }]} />
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{tr('Personal Information', 'Informations Personnelles', 'المعلومات الشخصية')}</Text>
            <Text style={[styles.stepSub, { color: colors.textMuted }]}>{tr('Please enter your details exactly as they appear on your ID.', 'Veuillez saisir vos détails exactement comme sur votre pièce d\'identité.', 'يرجى إدخال التفاصيل الخاصة بك كما تظهر في هويتك.')}</Text>

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
                <Text style={[styles.label, { color: colors.textMuted }]}>{tr('ID / Passport Number', 'Numéro CIN / Passeport', 'رقم الهوية / جواز السفر')}</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5', borderColor: colors.border }]}>
                    <CreditCard size={20} color={colors.textMuted} />
                    <TextInput
                        style={[styles.input, { color: colors.foreground }]}
                        value={idNumber}
                        onChangeText={setIdNumber}
                        placeholderTextColor={colors.textMuted}
                        placeholder="12345678"
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
                    if (fullName && idNumber && dob) setStep(2);
                    else Alert.alert(tr('Required', 'Requis', 'مطلوب'), tr('Please fill all fields', 'Veuillez remplir tous les champs', 'يرجى ملء جميع الحقول'));
                }}
            >
                <Text style={[styles.nextBtnText, { color: colors.background }]}>{tr('Next', 'Suivant', 'التالي')}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{tr('Upload ID', 'Télécharger CIN', 'تحميل الهوية')}</Text>
            <Text style={[styles.stepSub, { color: colors.textMuted }]}>{tr('Please upload clear photos of your ID card (Front & Back).', 'Veuillez télécharger des photos claires de votre carte (Recto & Verso).', 'يرجى تحميل صور واضحة لبطاقة الهوية (الوجه والخلف).')}</Text>

            <TouchableOpacity style={[styles.uploadBox, { borderColor: colors.border, backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9' }]} onPress={() => pickImage('front')}>
                {idFront ? (
                    <Image source={{ uri: idFront }} style={styles.uploadedImage} />
                ) : (
                    <View style={styles.uploadPlaceholder}>
                        <CreditCard size={40} color={colors.textMuted} />
                        <Text style={[styles.uploadText, { color: colors.textMuted }]}>{tr('Front of ID', 'Recto CIN', 'وجه الهوية')}</Text>
                    </View>
                )}
                {idFront && <TouchableOpacity style={styles.removeBtn} onPress={() => setIdFront(null)}><XCircle color="white" size={20} /></TouchableOpacity>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.uploadBox, { borderColor: colors.border, backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9' }]} onPress={() => pickImage('back')}>
                {idBack ? (
                    <Image source={{ uri: idBack }} style={styles.uploadedImage} />
                ) : (
                    <View style={styles.uploadPlaceholder}>
                        <CreditCard size={40} color={colors.textMuted} />
                        <Text style={[styles.uploadText, { color: colors.textMuted }]}>{tr('Back of ID', 'Verso CIN', 'خلفية الهوية')}</Text>
                    </View>
                )}
                {idBack && <TouchableOpacity style={styles.removeBtn} onPress={() => setIdBack(null)}><XCircle color="white" size={20} /></TouchableOpacity>}
            </TouchableOpacity>

            <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.backStepBtn, { borderColor: colors.border }]} onPress={() => setStep(1)}>
                    <Text style={{ color: colors.foreground }}>{tr('Back', 'Retour', 'رجوع')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: colors.foreground, flex: 1, marginLeft: 10 }]}
                    onPress={() => {
                        if (idFront && idBack) setStep(3);
                        else Alert.alert(tr('Required', 'Requis', 'مطلوب'), tr('Please upload both sides of your ID', 'Veuillez télécharger les deux côtés', 'يرجى تحميل كلا الجانبين'));
                    }}
                >
                    <Text style={[styles.nextBtnText, { color: colors.background }]}>{tr('Next', 'Suivant', 'التالي')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{tr('Take a Selfie', 'Prendre un Selfie', 'التقط صورة ذاتية')}</Text>
            <Text style={[styles.stepSub, { color: colors.textMuted }]}>{tr('Please take a clear selfie holding your ID card next to your face.', 'Prenez un selfie clair tenant votre CIN à côté de votre visage.', 'يرجى التقاط صورة شخصية واضحة وأنت تحمل بطاقة هويتك بجوار وجهك.')}</Text>

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
                <TouchableOpacity style={[styles.backStepBtn, { borderColor: colors.border }]} onPress={() => setStep(2)}>
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
                        <Text style={[styles.nextBtnText, { color: 'white' }]}>{tr('Submit KYC', 'Soumettre', 'إرسال')}</Text>
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
                        {tr('Your documents are under review. This usually takes 24-48 hours.', 'Vos documents sont en cours d\'examen. Cela prend généralement 24 à 48 heures.', 'مستنداتك قيد المراجعة. يستغرق هذا عادةً 24-48 ساعة.')}
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
                        {tr('Your identity has been verified successfully. You have full access.', 'Votre identité a été vérifiée avec succès.', 'تم التحقق من هويتك بنجاح.')}
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
                {step === 3 && renderStep3()}
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
