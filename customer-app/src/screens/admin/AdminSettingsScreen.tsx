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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../../context/ThemeContext';
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
import {
    AdminCard,
    InputLabel,
    SectionLabel,
    IconActionButton,
    SectionDivider,
    AdminHeader,
} from '../../components/admin/AdminUI';

export default function AdminSettingsScreen({ onBack, user, t }: any) {
    const { colors, theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';
    const auth = getAuth();
    const [activeTab, setActiveTab] = useState<'account' | 'team' | 'socials' | 'legal'>('account');
    const [team, setTeam] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('admin');
    const [adding, setAdding] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;

    const ROLES = [
        { value: 'admin', label: t('admin')?.toUpperCase() || 'ADMIN' },
        { value: 'brand_owner', label: t('brandOwner')?.toUpperCase() || 'BRAND OWNER' },
        { value: 'nor_kam', label: t('norKam')?.toUpperCase() || 'NOR KAM' },
        { value: 'editor', label: t('editor')?.toUpperCase() || 'EDITOR' },
        { value: 'support', label: t('support')?.toUpperCase() || 'SUPPORT' },
        { value: 'viewer', label: t('viewer')?.toUpperCase() || 'VIEWER' },
        { value: 'driver', label: t('driver')?.toUpperCase() || 'DRIVER' },
    ];

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
    const [legal, setLegal] = useState({
        privacy: "",
        privacyAr: "",
        privacyEn: "",
        terms: "",
        termsAr: "",
        termsEn: ""
    });
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
                    privacyEn: data.privacyEn || "",
                    terms: data.terms || "",
                    termsAr: data.termsAr || "",
                    termsEn: data.termsEn || ""
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

    const handleAdd = async () => {
        if (!newEmail) return;
        setAdding(true);
        try {
            const q = query(collection(db, 'users'), where('email', '==', newEmail.toLowerCase()));
            const snap = await getDocs(q);
            if (snap.empty) {
                Alert.alert(t('error'), t('userNotRegistered') || 'User not found in system.');
            } else {
                const target = snap.docs[0];
                await updateDoc(doc(db, 'users', target.id), { role: newRole });
                setNewEmail('');
                fetchTeam();
                Alert.alert(t('successTitle'), t('memberAdded'));
            }
        } catch (err) {
            Alert.alert(t('error'), t('updateFailed'));
        } finally {
            setAdding(false);
        }
    };

    const handleRoleChange = async (uid: string, role: string) => {
        if (uid === user?.uid) return;
        try {
            await updateDoc(doc(db, 'users', uid), { role });
            fetchTeam();
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemove = async (uid: string) => {
        if (uid === user?.uid) return;
        Alert.alert(t('delete') || 'Delete', t('confirmDeleteMember') || 'Are you sure you want to remove this member?', [
            { text: t('cancel') },
            {
                text: t('remove') || 'Remove',
                style: 'destructive',
                onPress: async () => {
                    await updateDoc(doc(db, 'users', uid), { role: 'customer' });
                    fetchTeam();
                }
            }
        ]);
    };

    return (
        <View style={[sc.root, { backgroundColor: colors.background }]}>
            <AdminHeader title={t('settings')} onBack={onBack} />

            <View style={[sc.nav, { borderBottomColor: colors.border, marginTop: insets.top + 58 }]}>
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
                contentContainerStyle={[sc.scrollContent, { paddingTop: 20 }]}
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
                        <AdminCard>
                            <SectionLabel text={t('addNewMember')} />
                            <View style={sc.inputGroup}>
                                <InputLabel text={t('userEmail')} />
                                <TextInput
                                    style={[sc.input, { borderColor: colors.border, color: colors.foreground }]}
                                    placeholder="example@email.com"
                                    placeholderTextColor={colors.textMuted}
                                    value={newEmail}
                                    onChangeText={setNewEmail}
                                    autoCapitalize="none"
                                />
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
                                {ROLES.map(r => (
                                    <TouchableOpacity
                                        key={r.value}
                                        onPress={() => setNewRole(r.value)}
                                        style={[
                                            sc.roleChip,
                                            {
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F2F2F7',
                                                borderColor: colors.border
                                            },
                                            newRole === r.value && { backgroundColor: colors.foreground, borderColor: colors.foreground }
                                        ]}
                                    >
                                        <Text style={[
                                            sc.roleChipText,
                                            { color: colors.textMuted },
                                            newRole === r.value && { color: isDark ? '#000' : '#FFF' }
                                        ]}>
                                            {r.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TouchableOpacity
                                onPress={handleAdd}
                                disabled={adding || !newEmail}
                                style={[sc.saveBtn, { backgroundColor: colors.foreground, marginTop: 10 }]}
                            >
                                {adding ? <ActivityIndicator color={isDark ? '#000' : '#FFF'} /> : (
                                    <Text style={[sc.saveBtnText, { color: isDark ? '#000' : '#FFF' }]}>
                                        {t('invite')?.toUpperCase() || 'INVITE'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </AdminCard>

                        <SectionLabel text={t('currentTeam')} style={{ marginTop: 20 }} />
                        {loading ? <ActivityIndicator style={{ marginTop: 20 }} color={colors.foreground} /> : (
                            team.map(member => (
                                <AdminCard key={member.id} style={sc.memberCard}>
                                    <View style={sc.memberIcon}>
                                        <Shield size={20} color={colors.foreground} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[sc.memberName, { color: colors.foreground }]}>{member.email}</Text>
                                        <Text style={[sc.memberRole, { color: colors.textMuted }]}>{member.role?.toUpperCase()}</Text>

                                        {/* Quick Role Change */}
                                        {member.id !== user?.uid && (
                                            <View style={{ flexDirection: 'row', gap: 5, marginTop: 8 }}>
                                                {ROLES.map(r => (
                                                    <TouchableOpacity
                                                        key={r.value}
                                                        onPress={() => handleRoleChange(member.id, r.value)}
                                                        style={[
                                                            sc.miniRoleBtn,
                                                            { backgroundColor: member.role === r.value ? colors.foreground : (isDark ? '#000' : '#F2F2F7') }
                                                        ]}
                                                    >
                                                        <Text style={{
                                                            fontSize: 9,
                                                            fontWeight: '900',
                                                            color: member.role === r.value ? (isDark ? '#000' : '#FFF') : colors.textMuted
                                                        }}>
                                                            {r.label[0]}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                    {member.id !== user?.uid && (
                                        <IconActionButton onPress={() => handleRemove(member.id)} variant="danger">
                                            <Trash2 size={16} color={colors.error} />
                                        </IconActionButton>
                                    )}
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
                            <InputLabel text={t('privacyPolicy') + " (EN)"} />
                            <TextInput
                                style={[sc.textArea, { borderColor: colors.border, color: colors.foreground }]}
                                value={legal.privacyEn}
                                onChangeText={(t) => setLegal({ ...legal, privacyEn: t })}
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
                            <InputLabel text={t('termsOfService') + " (EN)"} />
                            <TextInput
                                style={[sc.textArea, { borderColor: colors.border, color: colors.foreground }]}
                                value={legal.termsEn}
                                onChangeText={(t) => setLegal({ ...legal, termsEn: t })}
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
        </View>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    header: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 4 },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
    backBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    hSep: { height: StyleSheet.hairlineWidth },
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
    memberRole: { fontSize: 10, fontWeight: '800', marginTop: 2 },
    roleChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
    roleChipText: { fontSize: 10, fontWeight: '800' },
    miniRoleBtn: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});
