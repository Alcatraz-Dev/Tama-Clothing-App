import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Sparkles, ChevronLeft, Target } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import DiscoveryAnimation from './DiscoveryAnimation';

const { width, height } = Dimensions.get('window');

interface TreasureCaptureScreenProps {
  location: any;
  onSuccess: (data: any) => void;
  onCancel: () => void;
  isDark: boolean;
  t: (key: string) => string;
}

const TreasureCaptureScreen: React.FC<TreasureCaptureScreenProps> = ({
  location,
  onSuccess,
  onCancel,
  isDark,
  t,
}) => {
  const [status, setStatus] = useState<'idle' | 'capturing' | 'success'>('idle');
  const [progress, setProgress] = useState(0);
  const [isDiscovered, setIsDiscovered] = useState(false);
  const [circleSize, setCircleSize] = useState(new Animated.Value(1));
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'idle') {
      // Shrinking circle animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(circleSize, {
            toValue: 0.2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(circleSize, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    if (status === 'capturing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [status]);

  const handleCapture = () => {
    if (status === 'success') return;
    
    // Get current size for "Bonus" logic
    // @ts-ignore
    const currentSize = circleSize._value;
    let bonus = 0.1;
    if (currentSize < 0.4) {
      bonus = 0.3; // Excellent!
      Vibration.vibrate(100);
    } else if (currentSize < 0.7) {
      bonus = 0.2; // Great!
      Vibration.vibrate(50);
    } else {
      Vibration.vibrate(30);
    }

    setStatus('capturing');
    
    const newProgress = Math.min(progress + bonus, 1);
    setProgress(newProgress);

    Animated.timing(progressAnim, {
      toValue: newProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (newProgress >= 1) {
      handleSuccess();
    }
  };

  const handleSuccess = () => {
    setStatus('success');
    Vibration.vibrate([0, 100, 50, 100]);
    setTimeout(() => {
      setIsDiscovered(true);
    }, 500);
  };

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (isDiscovered) {
    return (
      <DiscoveryAnimation
        isDark={isDark}
        t={t}
        onComplete={() => onSuccess(location)}
      />
    );
  }

  return (
    <View style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}>
      {/* Background Effect */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={isDark ? ['#0F0F1A', '#1A1A2E'] : ['#F8F9FA', '#E9ECEF']}
          style={StyleSheet.absoluteFill}
        />
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          style={styles.bgGradientContainer}
        >
          <LinearGradient
            colors={isDark ? ['rgba(139, 92, 246, 0.1)', 'transparent'] : ['rgba(139, 92, 246, 0.05)', 'transparent']}
            style={styles.bgGradient}
          />
        </Animatable.View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.backButtonBlur}>
            <ChevronLeft size={24} color={isDark ? '#FFF' : '#000'} />
          </BlurView>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, isDark ? styles.darkText : styles.lightText]}>
            {location.name || t('treasureHuntLocation')}
          </Text>
          <Text style={styles.subtitle}>{t('treasureHuntNearTreasureDesc')}</Text>
        </View>
      </View>

      {/* Main Interaction Area */}
      <View style={styles.captureArea}>
        <Animated.View
          style={[
            styles.targetContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          {/* Shrinking Catch Circle (Pokemon GO Style) */}
          <Animated.View 
            style={[
              styles.catchCircle, 
              { 
                transform: [{ scale: circleSize }],
                borderColor: circleSize.interpolate({
                  inputRange: [0.2, 0.4, 0.7, 1],
                  outputRange: ['#10B981', '#F59E0B', '#EF4444', '#EF4444']
                })
              }
            ]} 
          />
          
          {/* Static Outer Ring */}
          <View style={[styles.ring, styles.ring1, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} />
          
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCapture}
            style={styles.captureButton}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              style={styles.captureButtonGradient}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Trophy size={48} color="#FFF" />
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Progress Bar */}
        <View style={styles.progressWrapper}>
          <View style={[styles.progressBarContainer, isDark ? styles.darkBar : styles.lightBar]}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <Animatable.View
        animation="fadeInUp"
        delay={500}
        style={styles.footer}
      >
        <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.instructionCard}>
          <Target size={20} color="#8B5CF6" style={styles.instructionIcon} />
          <Text style={[styles.instructionText, isDark ? styles.darkText : styles.lightText]}>
            {status === 'idle' ? t('treasureHuntTapToStart') || 'Tap to start capturing!' : t('treasureHuntKeepTapping') || 'Keep tapping to claim!'}
          </Text>
        </BlurView>
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkContainer: {
    backgroundColor: '#0F0F1A',
  },
  lightContainer: {
    backgroundColor: '#F8F9FA',
  },
  bgGradientContainer: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgGradient: {
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  darkText: {
    color: '#FFF',
  },
  lightText: {
    color: '#1E293B',
  },
  captureArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetContainer: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catchCircle: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 1000,
    borderWidth: 4,
    zIndex: 1,
  },
  ring: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  ring1: {
    width: '100%',
    height: '100%',
  },
  ring2: {
    width: '80%',
    height: '80%',
  },
  captureButton: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    elevation: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  captureButtonGradient: {
    flex: 1,
    borderRadius: width * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressWrapper: {
    marginTop: 60,
    width: '80%',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 12,
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  darkBar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  lightBar: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    marginTop: 10,
    color: '#8B5CF6',
    fontWeight: 'bold',
    fontSize: 18,
  },
  footer: {
    bottom: 50,
    paddingHorizontal: 30,
    width: '100%',
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  instructionIcon: {
    marginRight: 15,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});

export default TreasureCaptureScreen;
