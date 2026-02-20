import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
    StyleSheet,
    Dimensions
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
import { Eye, EyeOff } from 'lucide-react-native';
import { auth, db } from '../api/firebase';
import { useAppTheme } from '../context/ThemeContext';
import { APP_ICON } from '../constants/layout';

export default function AuthScreen({ isLogin, toggleAuth, onComplete, t, language }: any) {
    const { colors, theme } = useAppTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
            <View style={[styles.authTopDecoration, { opacity: theme === 'dark' ? 0.4 : 1, backgroundColor: colors.foreground }]} />
            <View style={[styles.authContent, { backgroundColor: colors.background }]}>
                <Text style={[styles.authTitle, { color: colors.foreground }]}>{isLogin ? t('welcomeBack') : t('createAccount')}</Text>
                <Image source={APP_ICON} style={[styles.logo, { alignSelf: 'center', width: 180, height: 180 }]} />

                <View style={[styles.formCard, { backgroundColor: 'transparent', borderColor: 'transparent' }]}>
                    {error ? <Text style={{ color: colors.error, fontSize: 13, marginBottom: 15, textAlign: 'center', fontWeight: '600' }}>{error}</Text> : null}
                    {!isLogin && (
                        <TextInput
                            style={[styles.modernInput, { color: colors.foreground, backgroundColor: theme === 'dark' ? '#121218' : '#F9F9F9', borderColor: colors.border, textAlign: language === 'ar' ? 'right' : 'left' }]}
                            placeholder={t('fullName')}
                            placeholderTextColor={colors.textMuted}
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    )}
                    <TextInput
                        style={[styles.modernInput, { color: colors.foreground, backgroundColor: theme === 'dark' ? '#121218' : '#F9F9F9', borderColor: colors.border, textAlign: language === 'ar' ? 'right' : 'left' }]}
                        placeholder={t('email')}
                        keyboardType="email-address"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <View style={{ width: '100%', position: 'relative', justifyContent: 'center' }}>
                        <TextInput
                            style={[styles.modernInput, { color: colors.foreground, backgroundColor: theme === 'dark' ? '#121218' : '#F9F9F9', borderColor: colors.border, paddingRight: 50, textAlign: language === 'ar' ? 'right' : 'left' }]}
                            placeholder={t('password')}
                            secureTextEntry={!showPassword}
                            placeholderTextColor={colors.textMuted}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity
                            style={{ position: 'absolute', right: 15, height: '100%', justifyContent: 'center', paddingHorizontal: 5, marginBottom: 10 }}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
                        </TouchableOpacity>
                    </View>

                    {isLogin && (
                        <TouchableOpacity onPress={handleForgotPassword} style={{ alignSelf: 'flex-end', marginTop: 10, marginBottom: 20 }}>
                            <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>{t('forgotPassword')}</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={[styles.modernPrimaryBtn, { backgroundColor: colors.foreground }]} onPress={handleAuth} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} />
                        ) : (
                            <Text style={[styles.modernPrimaryBtnText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>{isLogin ? t('signIn') : t('getStarted')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={toggleAuth} style={{ marginTop: 20 }}>
                    <Text style={[styles.authToggleText, { color: colors.textMuted }]}>
                        {isLogin ? t('signup') : t('login')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    authContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    authTopDecoration: {
        position: 'absolute',
        top: -150,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        transform: [{ scale: 1.5 }],
    },
    authContent: {
        flex: 1,
        paddingHorizontal: 35,
        justifyContent: 'center',
    },
    logo: {
        marginBottom: 0,
    },
    authTitle: {
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 40,
        letterSpacing: -0.5,
    },
    formCard: {
        width: '100%',
    },
    modernInput: {
        height: 60,
        borderWidth: 1.5,
        borderRadius: 18,
        paddingHorizontal: 20,
        marginBottom: 15,
        fontSize: 15,
        fontWeight: '600',
    },
    modernPrimaryBtn: {
        height: 62,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 5,
    },
    modernPrimaryBtnText: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    authToggleText: {
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    }
});
