import React, { useState } from 'react';
import {
    View,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    StyleSheet
} from 'react-native';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import {
    setDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { Eye, EyeOff, User, Mail, Lock as LockIcon, ChevronRight } from 'lucide-react-native';
import { auth, db } from '../api/firebase';
import { useAppTheme } from '../context/ThemeContext';
import { APP_ICON } from '../constants/layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function AuthScreen({ isLogin, toggleAuth, onComplete, t, language }: any) {
    const { colors, theme } = useAppTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const inputBgColor = theme === 'dark' ? '#121218' : '#F9F9F9';

    const handleAuth = async () => {
        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCred.user, { displayName: fullName });

                await setDoc(doc(db, 'users', userCred.user.uid), {
                    fullName: fullName,
                    email: email,
                    createdAt: serverTimestamp(),
                    role: 'customer'
                });
            }
            onComplete();
        } catch (err: any) {
            let msg = t('error');
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                msg = t('invalidCredentials') || 'Email ou mot de passe incorrect';
            } else if (err.code === 'auth/email-already-in-use') {
                msg = t('emailInUse') || 'Cet email est déjà utilisé';
            } else if (err.code === 'auth/invalid-email') {
                msg = t('invalidEmail') || 'Email invalide';
            } else if (err.code === 'auth/weak-password') {
                msg = t('weakPassword') || 'Le mot de passe doit contenir au moins 6 caractères';
            } else {
                msg = err.message;
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        const cleanEmail = email.trim();
        if (!cleanEmail) {
            setError(t('emailRequired') || 'Email is required');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await sendPasswordResetEmail(auth, cleanEmail);
            Alert.alert(t('successTitle'), t('resetEmailSent') || 'Password reset email sent');
        } catch (err: any) {
            console.error(err);
            let msg = t('error');
            if (err.code === 'auth/user-not-found') {
                msg = t('invalidCredentials') || 'Compte introuvable';
            } else if (err.code === 'auth/invalid-email') {
                msg = t('invalidEmail') || 'Email invalide';
            } else {
                msg = err.message;
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.authContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.authTopDecoration, {
                opacity: theme === 'dark' ? 0.2 : 0.05,
                backgroundColor: theme === 'dark' ? '#FFF' : '#000'
            }]} />

            <View style={styles.authContent}>
                <View style={styles.headerSection}>
                    <Image source={APP_ICON} style={styles.logo} />
                    <Text variant="heading" style={[styles.authTitle, { color: colors.foreground }]}>
                        {isLogin ? t('welcomeBack') : t('createAccount')}
                    </Text>
                </View>

                <View style={styles.formSection}>
                    {error ? (
                        <Text style={{ color: colors.error, fontSize: 13, marginBottom: 15, textAlign: 'center', fontWeight: '600' }}>
                            {error}
                        </Text>
                    ) : null}

                    {!isLogin && (
                        <Input
                            placeholder={t('fullName')}
                            value={fullName}
                            onChangeText={setFullName}
                            variant="filled"
                            containerStyle={styles.inputContainer}
                            autoCapitalize="none"
                            icon={User}
                            //@ts-ignore
                            style={{ fontSize: 13, color: colors.foreground }}
                        />
                    )}

                    <Input
                        placeholder={t('email')}
                        value={email}
                        onChangeText={setEmail}
                        variant="filled"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        containerStyle={styles.inputContainer}
                        icon={Mail}
                        //@ts-ignore
                        style={{ fontSize: 13, color: colors.foreground }}
                    />

                    <View style={styles.inputContainer}>
                        <Input
                            placeholder={t('password')}
                            value={password}
                            onChangeText={setPassword}
                            variant="filled"
                            secureTextEntry={!showPassword}
                            icon={LockIcon}
                            //@ts-ignore
                            style={{ fontSize: 14, color: colors.foreground }}
                            rightComponent={() => (
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={{ padding: 4 }}
                                >
                                    {showPassword ? <EyeOff size={16} color={colors.textMuted} /> : <Eye size={16} color={colors.textMuted} />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>

                    {isLogin && (
                        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
                            <Text variant="caption" style={{ fontWeight: '600' }}>{t('forgotPassword')}</Text>
                        </TouchableOpacity>
                    )}

                    <Button
                        onPress={handleAuth}
                        loading={loading}
                        size="lg"
                        style={{ marginTop: 20 }}
                    >
                        {isLogin ? t('signIn') : t('getStarted')}
                    </Button>
                </View>

                <TouchableOpacity onPress={toggleAuth} style={styles.toggleContainer} activeOpacity={0.7}>
                    <Text variant="body" style={[styles.authToggleText, { color: colors.textMuted }]}>
                        {isLogin ? t('signup') : t('login')}
                    </Text>
                    <ChevronRight size={16} color={colors.textMuted} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    authContainer: {
        flex: 1,
    },
    authTopDecoration: {
        position: 'absolute',
        top: -200,
        right: -100,
        width: 500,
        height: 500,
        borderRadius: 250,
    },
    authContent: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 140,
        height: 140,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    authTitle: {
        textAlign: 'center',
        letterSpacing: -1,
    },
    formSection: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 16,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 4,
        marginBottom: 24,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        paddingVertical: 10,
    },
    authToggleText: {
        fontSize: 15,
        fontWeight: '600',
    }
});
