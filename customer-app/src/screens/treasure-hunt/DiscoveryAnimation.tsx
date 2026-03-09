import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
}

interface DiscoveryAnimationProps {
  visible: boolean;
  onComplete?: () => void;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFD700', '#9B59B6', '#FF8E53', '#3498DB'];
const CONFETTI_COUNT = 50;

const DiscoveryAnimation: React.FC<DiscoveryAnimationProps> = ({ visible, onComplete }) => {
  const confettiPieces = useRef<ConfettiPiece[]>(
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      delay: Math.random() * 500,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 6,
    }))
  );

  useEffect(() => {
    if (visible && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Central Sparkle */}
      <View style={styles.centerContainer}>
        <Animatable.View
          animation="zoomIn"
          duration={400}
          style={styles.sparkleContainer}
        >
          <View style={styles.sparkleCircle}>
            <Animatable.Text 
              animation="pulse" 
              iterationCount="infinite"
              duration={1000}
              style={styles.sparkleEmoji}
            >
              ✨
            </Animatable.Text>
          </View>
        </Animatable.View>

        <Animatable.Text 
          animation="bounceIn"
          delay={300}
          duration={500}
          style={styles.foundText}
        >
          TREASURE FOUND!
        </Animatable.Text>
      </View>

      {/* Confetti Pieces */}
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
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fall animation
    const fallAnimation = Animated.parallel([
      Animated.timing(translateY, {
        toValue: height + 100,
        duration: 2500,
        delay: piece.delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: piece.x + (Math.random() - 0.5) * 200,
        duration: 2500,
        delay: piece.delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: Math.random() * 10 - 5,
        duration: 2500,
        delay: piece.delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2500,
        delay: piece.delay + 1500,
        useNativeDriver: true,
      }),
    ]);

    fallAnimation.start();

    return () => {
      fallAnimation.stop();
    };
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-5, 5],
    outputRange: ['-360deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: piece.color,
          width: piece.size,
          height: piece.size * 1.5,
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
    zIndex: 9999,
    overflow: 'hidden',
  },
  centerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleContainer: {
    marginBottom: 20,
  },
  sparkleCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  sparkleEmoji: {
    fontSize: 60,
  },
  foundText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  confettiPiece: {
    position: 'absolute',
    top: -20,
    borderRadius: 2,
  },
});

export default DiscoveryAnimation;
