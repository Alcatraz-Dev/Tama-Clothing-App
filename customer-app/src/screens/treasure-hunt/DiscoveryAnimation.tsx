import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
  rotateDir: number;
}

interface DiscoveryAnimationProps {
  visible?: boolean;
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
  isDark?: boolean;
  t?: (key: string) => string;
}

const COLORS = ['#FF3366', '#FF8E53', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
const CONFETTI_COUNT = 60;

const DiscoveryAnimation: React.FC<DiscoveryAnimationProps> = ({ 
  visible = true, 
  onComplete,
  title,
  subtitle,
  t
}) => {
  const displayTitle = title || (t ? t('treasureHuntScanSuccess') : "TREASURE FOUND!");
  const displaySubtitle = subtitle || (t ? t('treasureHuntScanReward') : "Achievement Unlocked");
  const confettiPieces = useRef<ConfettiPiece[]>(
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      delay: Math.random() * 800,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 10 + 6,
      rotateDir: Math.random() > 0.5 ? 1 : -1,
    }))
  );

  useEffect(() => {
    if (visible && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <LinearGradient
        colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Central Announcement */}
      <View style={styles.centerContainer}>
        <Animatable.View
          animation="zoomIn"
          duration={600}
          easing="ease-out-back"
          style={styles.mainBox}
        >
          <LinearGradient
            colors={['#FF3366', '#FF8E53']}
            style={styles.iconCircle}
          >
            <Trophy size={48} color="#FFF" />
          </LinearGradient>

          <Animatable.View 
             animation="fadeInUp" 
             delay={400} 
             style={styles.textContainer}
          >
            <Text style={styles.foundText}>{displayTitle}</Text>
            <View style={styles.subtitleRow}>
               <Sparkles size={14} color="#F59E0B" fill="#F59E0B" />
               <Text style={styles.subtitleText}>{displaySubtitle}</Text>
               <Sparkles size={14} color="#F59E0B" fill="#F59E0B" />
            </View>
          </Animatable.View>
        </Animatable.View>

        {/* Decorative Stars */}
        <Animatable.View 
           animation="pulse" 
           iterationCount="infinite" 
           style={styles.sparkleOne}
        >
           <Star size={24} color="#FFD700" fill="#FFD700" />
        </Animatable.View>
        <Animatable.View 
           animation="pulse" 
           iterationCount="infinite" 
           delay={500}
           style={styles.sparkleTwo}
        >
           <Star size={32} color="#FFD700" fill="#FFD700" />
        </Animatable.View>
      </View>

      {/* Confetti Cannon */}
      {confettiPieces.current.map((piece) => (
        <ConfettiPieceComponent 
          key={piece.id} 
          piece={piece} 
        />
      ))}
    </View>
  );
};

const ConfettiPieceComponent: React.FC<{ piece: ConfettiPiece }> = ({ piece }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height + 100,
        duration: 3000,
        delay: piece.delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: (Math.random() - 0.5) * 300,
        duration: 3000,
        delay: piece.delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration: 3000,
        delay: piece.delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1000,
        delay: piece.delay + 2000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${360 * 3 * piece.rotateDir}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: piece.color,
          width: piece.size,
          height: piece.size * (Math.random() > 0.5 ? 1 : 1.5),
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
          ],
          opacity,
          left: piece.x,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    overflow: 'hidden',
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainBox: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  textContainer: {
    alignItems: 'center',
  },
  foundText: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  subtitleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    marginHorizontal: 8,
    textTransform: 'uppercase',
  },
  confettiPiece: {
    position: 'absolute',
    top: -20,
    borderRadius: 3,
  },
  sparkleOne: {
     position: 'absolute',
     top: '30%',
     left: '15%',
  },
  sparkleTwo: {
     position: 'absolute',
     top: '25%',
     right: '20%',
  },
});

export default DiscoveryAnimation;
