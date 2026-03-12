import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  Modal,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Location from 'expo-location';
import * as Animatable from 'react-native-animatable';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  X, 
  Scan, 
  AlertCircle,
  ChevronLeft,
  Camera,
  Flashlight,
  RotateCcw,
  Sparkles,
  Gift,
  Trophy,
  MapPin,
  CheckCircle2,
  XCircle,
  Zap,
  Target
} from 'lucide-react-native';
import { treasureHuntService, TreasureLocation } from '@/services/TreasureHuntService';
import { useAppTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

const ScanLineAnimation = ({ color }: { color: string }) => {
  const translateY = useSharedValue(0);
  const scanFrameSize = width * 0.7;
  const paddingFromEdge = 20;
  const animationRange = scanFrameSize - paddingFromEdge * 2;

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
      -1,
      true
    );
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(translateY.value, [0, 1], [0, animationRange]) }],
    opacity: interpolate(translateY.value, [0, 0.5, 1], [0.3, 1, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        styles.scannerLine,
        { backgroundColor: color, shadowColor: color },
        animatedStyle,
      ]}
    >
       <LinearGradient
         colors={['transparent', color, 'transparent']}
         start={{ x: 0, y: 0 }}
         end={{ x: 1, y: 0 }}
         style={StyleSheet.absoluteFill}
       />
    </Animated.View>
  );
};

interface TreasureScannerScreenProps {
  campaignId: string;
  userId: string;
  t: any;
  isDark: boolean;
  onBack: () => void;
  onSuccess: (location: TreasureLocation, isCompleted: boolean) => void;
  onError: (message: string) => void;
}

const TreasureScannerScreen: React.FC<TreasureScannerScreenProps> = ({
  userId,
  t,
  isDark,
  onBack,
  onSuccess,
  onError
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    location?: TreasureLocation;
    message?: string;
    isCompleted?: boolean;
  } | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const { colors, theme } = useAppTheme();

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || processing) return;
    
    setScanned(true);
    setProcessing(true);

    try {
      let userLatitude: number | undefined;
      let userLongitude: number | undefined;
      
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          userLatitude = location.coords.latitude;
          userLongitude = location.coords.longitude;
        }
      } catch (locationError) {
        console.log('Location error:', locationError);
      }

      const scanResponse = await treasureHuntService.processScan(
        result.data,
        userId,
        userLatitude,
        userLongitude
      );

      setScanResult({
        success: scanResponse.success,
        location: scanResponse.location,
        message: scanResponse.message === 'REQUIRES_KEY' 
          ? `${t('treasureLockedMessage')} (${scanResponse.keysRequired || 1} ${t('treasureHuntKeysRequired')})` 
          : scanResponse.message,
        isCompleted: scanResponse.isCompleted
      });

      if (scanResponse.success && scanResponse.location) {
        onSuccess(scanResponse.location, scanResponse.isCompleted || false);
      } else if (scanResponse.message) {
        onError(scanResponse.message);
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      setScanResult({
        success: false,
        message: error.message || t('treasureHuntScanError')
      });
      onError(error.message || t('treasureHuntScanError'));
    } finally {
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanResult(null);
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: '#000', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
        <View style={styles.permissionContainer}>
           <BlurView intensity={20} tint="dark" style={styles.permissionBlur}>
              <Camera size={64} color={colors.primary} />
              <Text style={styles.permissionTitle}>{t('treasureHuntCameraPermission')}</Text>
              <Text style={styles.permissionText}>{t('treasureHuntCameraPermissionDesc')}</Text>
              <TouchableOpacity 
                onPress={requestPermission}
                style={[styles.permissionButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.permissionButtonText}>{t('treasureHuntGrantPermission')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onBack} style={styles.backLink}>
                <Text style={styles.backLinkText}>{t('treasureHuntGoBack')}</Text>
              </TouchableOpacity>
           </BlurView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        enableTorch={flashOn}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.headerButton}>
               <BlurView intensity={30} tint="dark" style={styles.buttonBlur}>
                  <X size={24} color="#FFF" />
               </BlurView>
            </TouchableOpacity>
            <View style={styles.headerLabel}>
               <BlurView intensity={30} tint="dark" style={styles.labelBlur}>
                  <Scan size={18} color={colors.primary} />
                  <Text style={styles.headerTitleText}>{t('treasureHuntScanQR')}</Text>
               </BlurView>
            </View>
            <TouchableOpacity onPress={() => setFlashOn(!flashOn)} style={styles.headerButton}>
               <BlurView intensity={30} tint={flashOn ? 'default' : 'dark'} style={[styles.buttonBlur, flashOn && { backgroundColor: colors.primary }]}>
                  <Flashlight size={24} color="#FFF" />
               </BlurView>
            </TouchableOpacity>
          </SafeAreaView>

          <View style={styles.scanArea}>
            <View style={styles.scannerInterface}>
               <View style={[styles.scanFrame, { borderColor: colors.primary + '30' }]}>
                  {/* Modern Animated Corners */}
                  <View style={[styles.cornerBox, styles.topLeftCorner]}>
                     <View style={[styles.cornerH, { backgroundColor: colors.primary }]} />
                     <View style={[styles.cornerV, { backgroundColor: colors.primary }]} />
                  </View>
                  <View style={[styles.cornerBox, styles.topRightCorner]}>
                     <View style={[styles.cornerH, { backgroundColor: colors.primary }]} />
                     <View style={[styles.cornerV, { backgroundColor: colors.primary }]} />
                  </View>
                  <View style={[styles.cornerBox, styles.bottomLeftCorner]}>
                     <View style={[styles.cornerH, { backgroundColor: colors.primary }]} />
                     <View style={[styles.cornerV, { backgroundColor: colors.primary }]} />
                  </View>
                  <View style={[styles.cornerBox, styles.bottomRightCorner]}>
                     <View style={[styles.cornerH, { backgroundColor: colors.primary }]} />
                     <View style={[styles.cornerV, { backgroundColor: colors.primary }]} />
                  </View>

                  {!scanned && <ScanLineAnimation color={colors.primary} />}
                  
                  {processing && (
                     <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.processingText}>{t('treasureHuntProcessing')}</Text>
                     </View>
                  )}
               </View>
               
               <Animatable.Text 
                 animation="fadeIn" 
                 iterationCount="infinite" 
                 direction="alternate" 
                 style={styles.scanHint}
               >
                 {t('treasureHuntPositionQR')}
               </Animatable.Text>
            </View>
          </View>

          <View style={styles.instructionsContainer}>
             <BlurView intensity={20} tint="dark" style={styles.instructionsBlur}>
                <View style={styles.instructionItem}>
                   <View style={styles.instructionIconBox}>
                      <MapPin size={18} color={colors.primary} />
                   </View>
                   <Text style={styles.instructionText}>{t('treasureHuntBeAtLocation')}</Text>
                </View>
                <View style={styles.instructionItem}>
                   <View style={styles.instructionIconBox}>
                      <Target size={18} color="#FF3366" />
                   </View>
                   <Text style={styles.instructionText}>{t('treasureHuntAlignQR')}</Text>
                </View>
             </BlurView>
          </View>
        </LinearGradient>
      </CameraView>

      <Modal visible={scanResult !== null} transparent animationType="slide">
        <BlurView intensity={60} tint="dark" style={styles.resultOverlay}>
           <Animatable.View 
             animation="zoomIn" 
             duration={400} 
             style={[styles.resultCard, { backgroundColor: theme === 'dark' ? '#1E1E24' : '#FFF' }]}
           >
              <LinearGradient
                colors={scanResult?.success ? ['rgba(16, 185, 129, 0.1)', 'transparent'] : ['rgba(255, 51, 102, 0.1)', 'transparent']}
                style={styles.resultGradient}
              >
                 <View style={[styles.resultIconBox, { backgroundColor: scanResult?.success ? '#10B98120' : '#FF336620' }]}>
                    {scanResult?.success ? (
                       <Sparkles size={48} color="#10B981" />
                    ) : (
                       <AlertCircle size={48} color="#FF3366" />
                    )}
                 </View>

                 <Text style={[styles.resultTitle, { color: scanResult?.success ? '#10B981' : '#FF3366' }]}>
                    {scanResult?.success ? (scanResult.isCompleted ? t('treasureHuntCampaignComplete') : t('treasureHuntTreasureFound')) : t('treasureHuntScanFailed')}
                 </Text>

                 <Text style={[styles.resultMessage, { color: theme === 'dark' ? '#E5E7EB' : '#4B5563' }]}>
                    {scanResult?.message || (scanResult?.success ? t('treasureHuntSuccessDesc') : t('treasureHuntTryAgain'))}
                 </Text>

                 {scanResult?.success && scanResult.location && (
                    <View style={styles.rewardSummary}>
                       <View style={styles.rewardItemBox}>
                          <Gift size={20} color={colors.primary} />
                          <Text style={[styles.rewardLabel, { color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>Location Found</Text>
                          <Text style={[styles.rewardValue, { color: colors.foreground }]}>
                             {scanResult.location.name?.fr || 'Treasure'}
                          </Text>
                       </View>
                       <View style={styles.rewardDivider} />
                       <View style={styles.rewardItemBox}>
                          <Trophy size={20} color="#FFD700" />
                          <Text style={[styles.rewardLabel, { color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>Rank Boost</Text>
                          <Text style={[styles.rewardValue, { color: colors.foreground }]}>+XP</Text>
                       </View>
                    </View>
                 )}

                 <TouchableOpacity 
                   onPress={resetScanner} 
                   style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                 >
                    <LinearGradient colors={[colors.primary, colors.primary + 'CC']} style={styles.buttonGradient}>
                       <RotateCcw size={20} color="#FFF" />
                       <Text style={styles.buttonText}>{scanResult?.success ? t('treasureHuntScanAgain') : t('treasureHuntTryAgain')}</Text>
                    </LinearGradient>
                 </TouchableOpacity>

                 <TouchableOpacity onPress={onBack} style={styles.secondaryButton}>
                    <Text style={[styles.secondaryButtonText, { color: colors.textMuted }]}>{t('treasureHuntBackToMap')}</Text>
                 </TouchableOpacity>
              </LinearGradient>
           </Animatable.View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 10 : 30,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  buttonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerLabel: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  labelBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerInterface: {
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 2,
  },
  scannerLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 3,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  cornerBox: {
     position: 'absolute',
     width: 30,
     height: 30,
  },
  cornerH: {
     position: 'absolute',
     width: '100%',
     height: 3,
     borderRadius: 2,
  },
  cornerV: {
     position: 'absolute',
     width: 3,
     height: '100%',
     borderRadius: 2,
  },
  topLeftCorner: { top: -2, left: -2 },
  topRightCorner: { top: -2, right: -2, alignItems: 'flex-end' },
  bottomLeftCorner: { bottom: -2, left: -2, justifyContent: 'flex-end' },
  bottomRightCorner: { bottom: -2, right: -2, alignItems: 'flex-end', justifyContent: 'flex-end' },

  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  processingText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 15,
  },
  scanHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 40,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  instructionsContainer: {
    paddingHorizontal: 25,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  instructionsBlur: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    opacity: 0.9,
  },
  resultOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  resultCard: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  resultGradient: {
     padding: 32,
     alignItems: 'center',
  },
  resultIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  resultMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '500',
  },
  rewardSummary: {
     flexDirection: 'row',
     width: '100%',
     backgroundColor: 'rgba(0,0,0,0.03)',
     borderRadius: 24,
     padding: 20,
     marginBottom: 32,
     alignItems: 'center',
  },
  rewardItemBox: {
     flex: 1,
     alignItems: 'center',
  },
  rewardDivider: {
     width: 1,
     height: 40,
     backgroundColor: 'rgba(0,0,0,0.1)',
  },
  rewardLabel: {
     fontSize: 11,
     fontWeight: '700',
     textTransform: 'uppercase',
     marginTop: 8,
     letterSpacing: 0.5,
  },
  rewardValue: {
     fontSize: 16,
     fontWeight: '800',
     marginTop: 2,
  },
  primaryButton: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
     flex: 1,
     flexDirection: 'row',
     justifyContent: 'center',
     alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionBlur: {
     borderRadius: 32,
     padding: 40,
     alignItems: 'center',
     width: '100%',
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.1)',
  },
  permissionTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 24,
    textAlign: 'center',
  },
  permissionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TreasureScannerScreen;
