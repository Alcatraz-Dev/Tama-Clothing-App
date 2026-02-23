import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    StyleSheet,
    Animated,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    User,
    Users,
    Globe,
    FileText,
    Eye,
    EyeOff,
    Trash2,
    Shield,
    Smartphone,
    Mail,
    Lock,
} from 'lucide-react-native';
import {
    collection,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    doc,
    query,
    where,
    serverTimestamp,
} from 'firebase/firestore';
import {
    getAuth,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
} from 'firebase/auth';
import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import { AdminHeader } from '../../components/admin/AdminHeader';
import {
    AdminCard,
    InputLabel,
    SectionLabel,
    IconActionButton,
    SectionDivider,
} from '../../components/admin/AdminUI';

export default function AdminSettingsScreen({ onBack, user, t }: any) {
    const { colors, theme } = useAppTheme();
    const auth = getAuth();
    const [activeTab, setActiveTab] = useState<'account' | 'team' | 'socials' | 'legal'>('account');
    const [team, setTeam] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;

    // Account State
    const [currentPassword, setCurrentPassword] = useState('');
    const [updateNewEmail, setUpdateNewEmail] = useState(user?.email || "");
    const [updateNewPassword, setUpdateNewPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [accountLoading, setAccountLoading] = useState(false);

    // Socials State
    const [socials, setSocials] = useState({
        facebook: "",
        instagram: "",
        tiktok: "",
        whatsapp: "",
        youtube: "",
        website: ""
    });
    const [socialsLoading, setSocialsLoading] = useState(false);

    // Legal State
    const [legal, setLegal] = useState({ privacy: "", privacyAr: "", terms: "", termsAr: "" });
    const [legalLoading, setLegalLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'team') fetchTeam();
        else if (activeTab === 'socials') fetchSocials();
        else if (activeTab === 'legal') fetchLegal();
    }, [activeTab]);

    const handleUpdateAccount = async () => {
        if (!currentPassword) return Alert.alert(t('error'), t('passwordRequired'));
        setAccountLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(auth.currentUser!, credential);

            if (updateNewEmail !== user.email) {
                await updateEmail(auth.currentUser!, updateNewEmail);
                await updateDoc(doc(db, "users", user.uid), { email: updateNewEmail });
            }

            if (updateNewPassword) {
                await updatePassword(auth.currentUser!, updateNewPassword);
            }

            Alert.alert(t('successTitle'), t('accountUpdated'));
            setCurrentPassword('');
            setUpdateNewPassword('');
        } catch (err: any) {
            console.error(err);
            Alert.alert(t('error'), err.code === 'auth/wrong-password' ? t('incorrectPassword') : t('updateFailed'));
        } finally {
            setAccountLoading(false);
        }
    };

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'users'), where('role', 'in', ['admin', 'editor', 'viewer', 'support']));
            const snap = await getDocs(q);
            setTeam(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSocials = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, 'settings', 'socials');
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                setSocials({
                    facebook: data.facebook || "",
                    instagram: data.instagram || "",
                    tiktok: data.tiktok || "",
                    whatsapp: data.whatsapp || "",
                    youtube: data.youtube || "",
                    website: data.website || ""
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSocials = async () => {
        setSocialsLoading(true);
        try {
            await setDoc(doc(db, 'settings', 'socials'), { ...socials, updatedAt: serverTimestamp() });
            Alert.alert(t('successTitle'), t('linksUpdated'));
        } catch (err) {
            Alert.alert(t('error'), t('updateFailed'));
        } finally {
            setSocialsLoading(false);
        }
    };

    const fetchLegal = async () => {
        setLoading(true);
        try {
            const snap = await getDoc(doc(db, 'settings', 'legal'));
            if (snap.exists()) {
                const data = snap.data();
                setLegal({
                    privacy: data.privacy || "",
                    privacyAr: data.privacyAr || "",
                    terms: data.terms || "",
                    termsAr: data.termsAr || ""
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLegal = async () => {
        setLegalLoading(true);
        try {
            await setDoc(doc(db, 'settings', 'legal'), { ...legal, updatedAt: serverTimestamp() });
            Alert.alert(t('successTitle'), t('pagesUpdated'));
        } catch (err) {
            Alert.alert(t('error'), t('updateFailed'));
        } finally {
            setLegalLoading(false);
        }
    };

    return (
        <SafeAreaView style={[sc.root, { backgroundColor: colors.background }]} edges={["bottom", "left", "right"]}>
            <AdminHeader title={t('settings')} onBack={onBack} scrollY={scrollY} />

            <View style={[sc.nav, { borderBottomColor: colors.border }]}>
                {[
                    { id: 'account', icon: User, label: t('account') },
                    { id: 'team', icon: Users, label: t('team') },
                    { id: 'socials', icon: Globe, label: t('socials') },
                    { id: 'legal', icon: FileText, label: t('legal') }
                ].map((tab: any) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id)}
                        style={[sc.navItem, activeTab === tab.id && { borderBottomColor: colors.foreground }]}
                    >
                        <tab.icon size={18} color={activeTab === tab.id ? colors.foreground : colors.textMuted} />
                        <Text style={[sc.navText, { color: activeTab === tab.id ? colors.foreground : colors.textMuted }]}>
                            {tab.label.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Animated.ScrollView
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                contentContainerStyle={sc.scrollContent}
            >
                {activeTab === 'account' && (
                    <AdminCard>
                        <SectionLabel text={t('profileSettings')} />
                        <View style={sc.inputGroup}>
                            <InputLabel text={t('emailAddress')} />
                            <TextInput
                                style={[sc.input, { borderColor: colors.border, color: colors.foreground }]}
                                value={updateNewEmail}
                                onChangeText={setUpdateNewEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={sc.inputGroup}>
                            <InputLabel text={t('newPassword')} />
                            <View style={sc.passWrap}>
                                <TextInput
                                    style={[sc.input, sc.passInput, { borderColor: colors.border, color: colors.foreground }]}
                                    value={updateNewPassword}
                                    onChangeText={setUpdateNewPassword}
                                    secureTextEntry={!showNewPassword}
                                    placeholder={t('leaveBlankToKeep')}
                                    placeholderTextColor={colors.textMuted}
                                />
                                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={sc.eyeBtn}>
                                    {showNewPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <SectionDivider />

                        <View style={sc.inputGroup}>
                            <InputLabel text={t('currentPasswordToVerify')} />
                            <View style={sc.passWrap}>
                                <TextInput
                                    style={[sc.input, sc.passInput, { borderColor: colors.border, color: colors.foreground }]}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry={!showCurrentPassword}
                                />
                                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={sc.eyeBtn}>
                                    {showCurrentPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleUpdateAccount}
                            disabled={accountLoading}
                            style={[sc.saveBtn, { backgroundColor: colors.foreground }]}
                        >
                            {accountLoading ? <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} /> : (
                                <Text style={[sc.saveBtnText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('updateAccount').toUpperCase()}</Text>
                            )}
                        </TouchableOpacity>
                    </AdminCard>
                )}

                {activeTab === 'team' && (
                    <>
                        <SectionLabel text={t('teamMembers')} />
                        {loading ? <ActivityIndicator style={{ marginTop: 20 }} color={colors.foreground} /> : (
                            team.map(member => (
                                <AdminCard key={member.id} style={sc.memberCard}>
                                    <View style={sc.memberIcon}>
                                        <Shield size={20} color={colors.foreground} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[sc.memberName, { color: colors.foreground }]}>{member.email}</Text>
                                        <Text style={[sc.memberRole, { color: colors.textMuted }]}>{member.role?.toUpperCase()}</Text>
                                    </View>
                                    <IconActionButton onPress={() => { }} variant="danger">
                                        <Trash2 size={16} color={colors.error} />
                                    </IconActionButton>
                                </AdminCard>
                            ))
                        )}
                    </>
                )}

                {activeTab === 'socials' && (
                    <AdminCard>
                        <SectionLabel text={t('socialLinks')} />
                        {['facebook', 'instagram', 'tiktok', 'whatsapp', 'youtube', 'website'].map(platform => (
                            <View key={platform} style={sc.inputGroup}>
                                <InputLabel text={platform.toUpperCase()} />
                                <TextInput
                                    style={[sc.input, { borderColor: colors.border, color: colors.foreground }]}
                                    value={(socials as any)[platform]}
                                    onChangeText={(val) => setSocials({ ...socials, [platform]: val })}
                                    placeholder={`Enter ${platform} URL`}
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        ))}
                        <TouchableOpacity
                            onPress={handleSaveSocials}
                            disabled={socialsLoading}
                            style={[sc.saveBtn, { backgroundColor: colors.foreground, marginTop: 10 }]}
                        >
                            {socialsLoading ? <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} /> : (
                                <Text style={[sc.saveBtnText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('saveLinks').toUpperCase()}</Text>
                            )}
                        </TouchableOpacity>
                    </AdminCard>
                )}

                {activeTab === 'legal' && (
                    <AdminCard>
                        <SectionLabel text={t('legalPages')} />
                        <View style={sc.inputGroup}>
                            <InputLabel text={t('privacyPolicy') + " (FR)"} />
                            <TextInput
                                style={[sc.textArea, { borderColor: colors.border, color: colors.foreground }]}
                                value={legal.privacy}
                                onChangeText={(t) => setLegal({ ...legal, privacy: t })}
                                multiline
                            />
                        </View>
                        <View style={sc.inputGroup}>
                            <InputLabel text={t('privacyPolicy') + " (AR)"} />
                            <TextInput
                                style={[sc.textArea, { borderColor: colors.border, color: colors.foreground, textAlign: 'right' }]}
                                value={legal.privacyAr}
                                onChangeText={(t) => setLegal({ ...legal, privacyAr: t })}
                                multiline
                            />
                        </View>
                        <View style={sc.inputGroup}>
                            <InputLabel text={t('termsOfService') + " (FR)"} />
                            <TextInput
                                style={[sc.textArea, { borderColor: colors.border, color: colors.foreground }]}
                                value={legal.terms}
                                onChangeText={(t) => setLegal({ ...legal, terms: t })}
                                multiline
                            />
                        </View>
                        <View style={sc.inputGroup}>
                            <InputLabel text={t('termsOfService') + " (AR)"} />
                            <TextInput
                                style={[sc.textArea, { borderColor: colors.border, color: colors.foreground, textAlign: 'right' }]}
                                value={legal.termsAr}
                                onChangeText={(t) => setLegal({ ...legal, termsAr: t })}
                                multiline
                            />
                        </View>
                        <TouchableOpacity
                            onPress={handleSaveLegal}
                            disabled={legalLoading}
                            style={[sc.saveBtn, { backgroundColor: colors.foreground, marginTop: 10 }]}
                        >
                            {legalLoading ? <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} /> : (
                                <Text style={[sc.saveBtnText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{t('saveLegal').toUpperCase()}</Text>
                            )}
                        </TouchableOpacity>
                    </AdminCard>
                )}

                <View style={{ height: 100 }} />
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    nav: { flexDirection: 'row', borderBottomWidth: 1 },
    navItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 6 },
    navText: { fontSize: 8, fontWeight: '900' },
    scrollContent: { padding: 20 },
    inputGroup: { marginBottom: 16 },
    input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 13, fontWeight: '600' },
    textArea: { height: 120, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 13, fontWeight: '600', textAlignVertical: 'top' },
    passWrap: { flexDirection: 'row', alignItems: 'center' },
    passInput: { flex: 1 },
    eyeBtn: { position: 'absolute', right: 12 },
    saveBtn: { height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    saveBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
    memberCard: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    memberIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
    memberName: { fontSize: 13, fontWeight: '700' },
    memberRole: { fontSize: 10, fontWeight: '800', marginTop: 2 }
});
