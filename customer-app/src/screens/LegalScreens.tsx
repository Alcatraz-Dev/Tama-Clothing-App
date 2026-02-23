import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Shield, FileText } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../api/firebase';
import { useAppTheme } from '../context/ThemeContext';

interface PolicyScreenProps {
    onBack: () => void;
    t: any;
}

export function PrivacyPolicyScreen({ onBack, t }: PolicyScreenProps) {
    return <GenericPolicyScreen onBack={onBack} t={t} titleKey="privacyPolicy" fieldKey="privacy" defaultText="Privacy policy content..." Icon={Shield} />;
}

export function TermsOfServiceScreen({ onBack, t }: PolicyScreenProps) {
    return <GenericPolicyScreen onBack={onBack} t={t} titleKey="termsOfService" fieldKey="terms" defaultText="Terms of service content..." Icon={FileText} />;
}

function GenericPolicyScreen({ onBack, t, titleKey, fieldKey, defaultText, Icon }: any) {
    const { colors, theme } = useAppTheme();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollY = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const snap = await getDoc(doc(db, 'settings', 'legal'));
                if (snap.exists()) {
                    setContent(snap.data()[fieldKey] || defaultText);
                } else {
                    setContent(defaultText);
                }
            } catch (err) {
                console.error(err);
                setContent(defaultText);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, []);

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    return (
        <SafeAreaView style={[sc.root, { backgroundColor: colors.background }]} edges={['bottom']}>
            <Animated.View style={[sc.header, {
                paddingTop: insets.top,
                height: 64 + insets.top,
                borderBottomWidth: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }]}>
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
                    <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme} />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '66' }]} />
                </Animated.View>

                <View style={sc.headerContent}>
                    <TouchableOpacity onPress={onBack} style={[sc.backBtn, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
                        <ChevronLeft size={20} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[sc.title, { color: colors.foreground }]}>{t(titleKey).toUpperCase()}</Text>
                    <View style={{ width: 40 }} />
                </View>
            </Animated.View>

            <Animated.ScrollView
                contentContainerStyle={[sc.scrollContent, { paddingTop: 80 + insets.top }]}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
            >
                {loading ? (
                    <ActivityIndicator size="large" color={colors.foreground} style={{ marginTop: 100 }} />
                ) : (
                    <View style={[sc.card, { backgroundColor: theme === 'dark' ? '#121218' : 'white', borderColor: colors.border }]}>
                        <View style={[sc.iconBox, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}>
                            <Icon size={24} color={colors.foreground} />
                        </View>
                        <Text style={[sc.text, { color: colors.foreground }]}>{content}</Text>
                    </View>
                )}
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const sc = StyleSheet.create({
    root: { flex: 1 },
    header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 },
    headerContent: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    scrollContent: { padding: 20, paddingBottom: 100 },
    card: { padding: 25, borderRadius: 24, borderWidth: 1 },
    iconBox: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    text: { fontSize: 13, lineHeight: 22 },
});
