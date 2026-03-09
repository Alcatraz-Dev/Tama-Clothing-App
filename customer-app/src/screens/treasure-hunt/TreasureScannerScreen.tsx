import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  Modal,
  ActivityIndicator
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
  XCircle
} from 'lucide-react-native';
import { treasureHuntService, TreasureLocation } from '@/services/TreasureHuntService';
import { useAppTheme } from '@/context/ThemeContext';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;

const ScanLineAnimation = ({ color }: { color: string }) => {
  const translateY = useSharedValue(0);
  
  // Calculate dimensions to stay inside scanFrame
  const scanFrameSize = width * 0.7;
  const paddingFromEdge = 20; // Stay away from corners
  const animationRange = scanFrameSize - paddingFromEdge * 2;

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(translateY.value, [0, 1.3], [paddingFromEdge, animationRange + paddingFromEdge]) }],
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', left: 15, right: 15, height: 3, borderRadius: 2, top: paddingFromEdge },
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
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
        message: scanResponse.message,
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color={colors.primary} />
          <Text style={[styles.permissionTitle, { color: colors.foreground }]}>
            {t('treasureHuntCameraPermission')}
          </Text>
          <Text style={[styles.permissionText, { color: colors.textMuted }]}>
            {t('treasureHuntCameraPermissionDesc')}
          </Text>
          <TouchableOpacity 
            onPress={requestPermission}
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.permissionButtonText}>{t('treasureHuntGrantPermission')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onBack} style={styles.backLink}>
            <Text style={[styles.backLinkText, { color: colors.textMuted }]}>
              {t('treasureHuntGoBack')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        enableTorch={flashOn}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.headerButton}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>{t('treasureHuntScanQR')}</Text>
            <TouchableOpacity 
              onPress={() => setFlashOn(!flashOn)} 
              style={[styles.headerButton, flashOn && { backgroundColor: colors.primary }]}
            >
              <Flashlight size={24} color="#FFF" />
            </TouchableOpacity>
          </SafeAreaView>

          <View style={styles.scanArea}>
            <View style={[styles.scanFrame, { borderColor: colors.primary }]}>
              <View style={[styles.corner, styles.topLeft, { backgroundColor: colors.primary }]} />
              <View style={[styles.corner, styles.topRight, { backgroundColor: colors.primary }]} />
              <View style={[styles.corner, styles.bottomLeft, { backgroundColor: colors.primary }]} />
              <View style={[styles.corner, styles.bottomRight, { backgroundColor: colors.primary }]} />
              
              {!scanned && (
                <ScanLineAnimation color={colors.primary} />
              )}
            </View>
            
            <Text style={styles.scanHint}>
              {processing ? t('treasureHuntProcessing') : t('treasureHuntPositionQR')}
            </Text>
          </View>

          <View style={styles.instructions}>
            <View style={styles.instructionItem}>
              <MapPin size={20} color="#FFF" />
              <Text style={styles.instructionText}>
                {t('treasureHuntBeAtLocation')}
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Scan size={20} color="#FFF" />
              <Text style={styles.instructionText}>
                {t('treasureHuntAlignQR')}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </CameraView>

      <Modal
        visible={scanResult !== null}
        transparent
        animationType="fade"
        onRequestClose={resetScanner}
      >
        <BlurView intensity={80} tint={theme} style={styles.resultOverlay}>
          <Animatable.View 
            animation="zoomIn" 
            duration={300}
            style={[styles.resultCard, { backgroundColor: theme === 'dark' ? '#1A1A1E' : '#FFF' }]}
          >
            {scanResult?.success ? (
              <>
                <Animatable.View animation="bounceIn" duration={500}>
                  <View style={[styles.resultIcon, { backgroundColor: '#4ECDC420' }]}>
                    <Sparkles size={48} color="#4ECDC4" />
                  </View>
                </Animatable.View>
                <Text style={[styles.resultTitle, { color: '#4ECDC4' }]}>
                  {scanResult.isCompleted ? t('treasureHuntCampaignComplete') : t('treasureHuntTreasureFound')}
                </Text>
                {scanResult.location && (
                  <Text style={[styles.resultLocation, { color: colors.foreground }]}>
                    {scanResult.location.name?.fr || scanResult.location.name?.['ar-tn']}
                  </Text>
                )}
                {scanResult.location?.rewardValue && (
                  <View style={styles.rewardInfo}>
                    <Gift size={24} color={colors.primary} />
                    <Text style={[styles.rewardText, { color: colors.foreground }]}>
                      {scanResult.location.rewardType === 'points' 
                        ? `+${scanResult.location.rewardValue} ${t('treasureHuntPoints')}`
                        : scanResult.location.rewardType === 'discount'
                        ? `${scanResult.location.rewardValue}% ${t('treasureHuntDiscount')}`
                        : t('treasureHuntRewardClaimed')
                      }
                    </Text>
                  </View>
                )}
                <TouchableOpacity 
                  onPress={resetScanner}
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                >
                  <Scan size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>{t('treasureHuntScanAgain')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.resultIcon, { backgroundColor: '#FF6B6B20' }]}>
                  {scanResult?.message?.includes('Not close') ? (
                    <AlertCircle size={48} color="#FF6B6B" />
                  ) : scanResult?.message?.includes('Already') ? (
                    <CheckCircle2 size={48} color="#FF6B6B" />
                  ) : (
                    <XCircle size={48} color="#FF6B6B" />
                  )}
                </View>
                <Text style={[styles.resultTitle, { color: '#FF6B6B' }]}>
                  {scanResult?.message?.includes('Not close') 
                    ? t('treasureHuntTooFar')
                    : scanResult?.message?.includes('Already')
                    ? t('treasureHuntAlreadyDiscovered')
                    : t('treasureHuntScanFailed')
                  }
                </Text>
                <Text style={[styles.resultDescription, { color: colors.textMuted }]}>
                  {scanResult?.message || t('treasureHuntTryAgain')}
                </Text>
                <TouchableOpacity 
                  onPress={resetScanner}
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                >
                  <RotateCcw size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>{t('treasureHuntTryAgain')}</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity 
              onPress={onBack}
              style={styles.doneButton}
            >
              <Text style={[styles.doneButtonText, { color: colors.textMuted }]}>
                {t('treasureHuntBackToMap')}
              </Text>
            </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerButton: {
    width: Math.min(44, width * 0.11),
    height: Math.min(44, width * 0.11),
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleText: {
    color: '#FFF',
    fontSize: Math.min(18, width * 0.045),
    fontWeight: '700',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 3,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: Math.min(30, width * 0.075),
    height: Math.min(30, width * 0.075),
    borderRadius: 5,
  },
  topLeft: {
    top: -3,
    left: -3,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: -3,
    right: -3,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: -3,
    left: -3,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: -3,
    right: -3,
    borderBottomRightRadius: 20,
  },
  scanLine: {
    position: 'absolute',
    width: width * 0.65,
    height: 3,
    borderRadius: 2,
    top: '50%',
  },
  scanHint: {
    color: '#FFF',
    fontSize: Math.min(14, width * 0.035),
    marginTop: 20,
    textAlign: 'center',
  },
  instructions: {
    paddingHorizontal: width * 0.075,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: Math.min(12, width * 0.03),
    borderRadius: Math.min(12, width * 0.03),
  },
  instructionText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  resultOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultCard: {
    width: '100%',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
  },
  resultIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  resultLocation: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    width: '100%',
    justifyContent: 'center',
  },
  rewardText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginBottom: 12,
    width: '100%',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  doneButton: {
    paddingVertical: 12,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 24,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    marginBottom: 30,
  },
  permissionButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backLink: {
    marginTop: 20,
    padding: 12,
  },
  backLinkText: {
    fontSize: 14,
  },
});

export default TreasureScannerScreen;

