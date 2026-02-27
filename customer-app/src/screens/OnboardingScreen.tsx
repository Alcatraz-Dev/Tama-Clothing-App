import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions } from 'react-native';
import UniversalVideoPlayer from '../components/common/UniversalVideoPlayer';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_ICON, width, height } from '../constants/layout';
import { useAppTheme } from '../context/ThemeContext';

export default function OnboardingScreen({ onFinish, t }: any) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const { colors, theme } = useAppTheme();

    const slides = [
        {
            id: '1',
            title: t('onboardTitle1'),
            desc: t('onboardDesc1'),
            video: 'https://assets.mixkit.co/videos/805/805-720.mp4',
        },
        {
            id: '2',
            title: t('onboardTitle2'),
            desc: t('onboardDesc2'),
            video: 'https://assets.mixkit.co/videos/23327/23327-720.mp4',
        },
        {
            id: '3',
            title: t('onboardTitle3'),
            desc: t('onboardDesc3'),
            video: 'https://assets.mixkit.co/videos/50641/50641-720.mp4',
        }
    ];

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        AsyncStorage.setItem('tama_onboarding_seen', 'true');
        onFinish();
    };

    const renderSlide = ({ item, index }: any) => (
        <View style={{ width, height }}>
            <UniversalVideoPlayer
                source={{ uri: item.video }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                isLooping
                shouldPlay={currentIndex === index}
                isMuted
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                style={StyleSheet.absoluteFill}
            />

            <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 30, paddingBottom: 160 }}>
                <Animatable.View
                    key={`slide-${index}-${item.id}`}
                    animation="fadeInUp"
                    duration={800}
                >
                    <Text style={{ color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 38 }}>
                        {item.title}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600', marginTop: 15, lineHeight: 24, marginBottom: 20 }}>
                        {item.desc}
                    </Text>
                </Animatable.View>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                keyExtractor={(item) => item.id}
            />

            {/* Skip Button */}
            <TouchableOpacity
                onPress={handleFinish}
                style={{ position: 'absolute', top: 60, right: 30, zIndex: 10 }}
            >
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 1, opacity: 0.7 }}>
                    {t('skipForNow') || 'SKIP'}
                </Text>
            </TouchableOpacity>

            {/* Pagination & CTA */}
            <View style={{ position: 'absolute', bottom: 60, left: 30, right: 30 }}>
                <View style={{ flexDirection: 'row', marginBottom: 30 }}>
                    {slides.map((_, i) => (
                        <View
                            key={i}
                            style={{
                                height: 4,
                                width: i === currentIndex ? 30 : 6,
                                borderRadius: 2,
                                backgroundColor: i === currentIndex ? '#FFF' : 'rgba(255,255,255,0.3)',
                                marginRight: 6
                            }}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    onPress={handleNext}
                    activeOpacity={0.8}
                    style={{
                        height: 64,
                        backgroundColor: '#FFF',
                        borderRadius: 32,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        elevation: 10
                    }}
                >
                    <Text style={{ color: '#000',  fontSize: 15, fontWeight: '800', letterSpacing: 1 }}>
                        {currentIndex === slides.length - 1 ? t('onboardGetStarted') : t('onboardNext')}
                    </Text>
                    <ArrowRight size={20} color="#000" strokeWidth={3} style={{ marginLeft: 10 }} />
                </TouchableOpacity>
            </View>

            {/* Top Logo */}
            <View style={{ position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' }}>
                <Animatable.Image
                    animation="fadeInDown"
                    source={APP_ICON}
                    style={{ width: 180, height: 180, borderRadius: 12 }}
                />
            </View>
        </View>
    );
}
