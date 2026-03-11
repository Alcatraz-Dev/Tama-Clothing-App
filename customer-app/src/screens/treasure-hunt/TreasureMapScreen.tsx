import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Alert,
  ActivityIndicator,
  Platform,
  Vibration,
  Animated,
  StatusBar,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { 
  ChevronLeft, 
  Navigation, 
  Target, 
  MapPin, 
  CheckCircle2, 
  Scan, 
  Trophy,
  Zap,
  Sparkles,
  Crosshair,
  Radar,
  User,
  Gift,
  Award,
  Gem,
  Bomb as BombIcon,
  CircleDot
} from 'lucide-react-native';
import { treasureHuntService, TreasureLocation, Participation, Bomb, Campaign } from '@/services/TreasureHuntService';
import { useAppTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

interface TreasureMapScreenProps {
  campaignId: string;
  userId: string;
  t: any;
  isDark: boolean;
  onBack: () => void;
  onScan: (location: TreasureLocation) => void;
  onViewRewards?: () => void;
  onViewProfile?: () => void;
}


const TreasureMapScreen: React.FC<TreasureMapScreenProps> = ({
  campaignId,
  userId,
  t,
  isDark,
  onBack,
  onScan,
  onViewRewards,
  onViewProfile
}) => {
  const currentLang = t.locale || 'fr';
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [treasureLocations, setTreasureLocations] = useState<TreasureLocation[]>([]);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<TreasureLocation | null>(null);
  const [currentTargetId, setCurrentTargetId] = useState<string | null>(null);
  const [nearLocation, setNearLocation] = useState<TreasureLocation | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [mapRegion, setMapRegion] = useState<any>({
    latitude: 36.8065, // Tunis default
    longitude: 10.1815,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  
  const [capturing, setCapturing] = useState(false);
  const [lastDiscoveredReward, setLastDiscoveredReward] = useState<any>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showBoomAnimation, setShowBoomAnimation] = useState(false);
  const mapRef = useRef<MapView>(null);
  const shakeViewRef = useRef<any>(null);
  
  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  const centerOnTreasure = () => {
    let target = null;
    if (currentTargetId) {
      target = treasureLocations.find(l => l.id === currentTargetId);
    } 
    if (!target) {
       const undiscovered = treasureLocations.filter(loc => !isDiscovered(loc.id));
       if (undiscovered.length > 0 && userLocation) {
         target = undiscovered.reduce((nearest, current) => {
            const dist1 = getDistance(userLocation.coords.latitude, userLocation.coords.longitude, nearest.coordinates.latitude, nearest.coordinates.longitude);
            const dist2 = getDistance(userLocation.coords.latitude, userLocation.coords.longitude, current.coordinates.latitude, current.coordinates.longitude);
            return dist1 < dist2 ? nearest : current;
         });
       }
    }
    
    if (target && mapRef.current) {
       mapRef.current.animateCamera({
         center: {
           latitude: target.coordinates.latitude,
           longitude: target.coordinates.longitude,
         },
         pitch: 45,
         heading: 0,
         altitude: 1000,
         zoom: 17
       }, { duration: 1000 });
       setCurrentTargetId(target.id);
    }
  };

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { colors, theme } = useAppTheme();

  const triggerBoomEffect = () => {
    setShowBoomAnimation(true);
    Vibration.vibrate([0, 200, 100, 500]);
    
    // Smooth high-quality shake using Animatable
    if (shakeViewRef.current) {
        shakeViewRef.current.shake(800);
    }

    setTimeout(() => {
      setShowBoomAnimation(false);
      Alert.alert(
        t('treasureHuntBoomTitle') || "BOOM!", 
        t('treasureHuntBoomDesc') || "You stepped on a bomb! It has been removed. You are out of the game.",
        [{ text: "OK", style: "destructive", onPress: async () => {
          await treasureHuntService.abandonCampaign(campaignId, userId);
          if (onBack) onBack(); // Kick out of the game
        } }]
      );
    }, 1500);
  };

  const handleCapture = async (location: TreasureLocation) => {
    if (!userLocation) return;
    
    setCapturing(true);
    Vibration.vibrate([0, 100, 100, 100]); // Poke-vibe
    
    try {
      const result = await treasureHuntService.captureTreasure(
        location.id,
        userId,
        userLocation.coords.latitude,
        userLocation.coords.longitude
      );

      if (result.success) {
        setShowSuccessAnimation(true);
        Vibration.vibrate([0, 500, 100, 500]);
        
        setTimeout(() => {
          setShowSuccessAnimation(false);
          setLastDiscoveredReward(result.reward);
        }, 2500);

        // Refresh data
        refreshData();
        setNearLocation(null);
        setSelectedLocation(null);
      } else {
        Alert.alert(t('treasureHuntError'), result.message || t('treasureHuntCaptureFailed'));
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert(t('treasureHuntError'), t('treasureHuntErrorGeneral'));
    } finally {
      setCapturing(false);
    }
  };

  const refreshData = async () => {
    try {
      const mapData = await treasureHuntService.getMapData(campaignId, userId);
      setTreasureLocations(mapData.locations);
      
      const part = await treasureHuntService.getParticipation(campaignId, userId);
      setParticipation(part);

      const camp = await treasureHuntService.getCampaign(campaignId);
      setCampaign(camp);
      
      const bombData = await treasureHuntService.getBombs(campaignId);
      setBombs(bombData);
    } catch (error) {
       console.error('Refresh error:', error);
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('treasureHuntError'), t('treasureHuntPermissionError'));
        onBack();
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      
      const locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (loc) => setUserLocation(loc)
      );

      return () => locationSubscription.remove();
    })();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    console.log('TreasureMapScreen mounted:', { campaignId, userId });
    setLoading(true);
    
    // Subscribe to participation
    let unsubscribe = () => {};
    if (campaignId && userId) {
      unsubscribe = treasureHuntService.subscribeToParticipation(campaignId, userId, (data) => {
        console.log('Participation updated:', data);
        setParticipation(data);
        setLoading(false);
      });
    } else {
      console.log('Missing campaignId or userId');
      setLoading(false);
    }

    // Fetch locations and bombs
    const fetchMapData = async () => {
      try {
        const locationsData = await treasureHuntService.getLocations(campaignId);
        console.log('Locations fetched:', locationsData.length);
        setTreasureLocations(locationsData);

        const bombsData = await treasureHuntService.getBombs(campaignId);
        console.log('Bombs fetched:', bombsData.length);
        setBombs(bombsData);
      } catch (error) {
        console.error('Error fetching map data:', error);
      }
    };

    fetchMapData();

    return () => unsubscribe();
  }, [campaignId, userId]);

  // Remove the random bomb generator

  // Bomb collision detection
  useEffect(() => {
    if (userLocation && bombs.length > 0) {
      let touchedBombId: string | null = null;
      for (const b of bombs) {
        const dist = getDistance(
          userLocation.coords.latitude, 
          userLocation.coords.longitude,
          b.latitude,
          b.longitude
        );
        // Detection radius: 10 meters for easier testing/gameplay
        if (dist <= 10) { 
          touchedBombId = b.id;
          break;
        }
      }
      if (touchedBombId) {
         setBombs(prev => prev.filter(b => b.id !== touchedBombId));
         triggerBoomEffect();
      }
    }
  }, [userLocation, bombs]);

  useEffect(() => {
    if (!userLocation || !treasureLocations.length || !participation) return;

    const discoveredIds = participation.progress.discoveredLocationIds || [];
    const undiscovered = treasureLocations.filter(loc => !discoveredIds.includes(loc.id));

    let closest: TreasureLocation | null = null;
    let minDistance = Infinity;

    undiscovered.forEach(loc => {
      const distance = getDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        loc.coordinates.latitude,
        loc.coordinates.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = loc;
      }
    });

    if (closest) {
      const loc = closest as TreasureLocation;
      if (minDistance <= (loc.radius || 50)) {
        if (nearLocation?.id !== loc.id) {
          setNearLocation(loc);
          Vibration.vibrate([0, 500, 200, 500]);
        }
      } else {
        setNearLocation(null);
      }
    } else {
      setNearLocation(null);
    }
  }, [userLocation, treasureLocations, participation]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const isDiscovered = (locationId: string) => {
    return participation?.progress.discoveredLocationIds?.includes(locationId);
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <Animatable.View 
        ref={shakeViewRef}
        style={{ flex: 1 }}
        useNativeDriver
      >
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={mapRegion}
          showsUserLocation={true}
          showsPointsOfInterests={false}
          showsCompass={true}
          rotateEnabled={true}
          pitchEnabled={true}
          customMapStyle={theme === 'dark' ? darkMapStyle : lightMapStyle}
        >
          {/* User Interaction Radius */}
          {userLocation && (
            <Circle
              center={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude
              }}
              radius={200} // Detection range
              fillColor={theme === 'dark' ? 'rgba(79, 70, 229, 0.05)' : 'rgba(79, 70, 229, 0.03)'}
              strokeColor={colors.primary + '40'}
              strokeWidth={1}
            />
          )}

          {treasureLocations.map(loc => {
            const distance = userLocation ? getDistance(
              userLocation.coords.latitude,
              userLocation.coords.longitude,
              loc.coordinates.latitude,
              loc.coordinates.longitude
            ) : 1000;

            const isCurrentTarget = loc.id === participation?.progress.currentLocationId || loc.id === currentTargetId;
            const discovered = isDiscovered(loc.id);
            
            // Always reveal the target, or existing discoveries. Others show if within 3km
            const revealed = (distance < 3000) || isCurrentTarget || discovered;
            if (!revealed) return null;
            
            const inRange = distance < 300; // Close enough to see more detail

            const isNear = nearLocation?.id === loc.id;
            
            return (
              <React.Fragment key={loc.id}>
                <Marker
                  coordinate={{ latitude: loc.coordinates.latitude, longitude: loc.coordinates.longitude }}
                  onPress={() => setSelectedLocation(loc)}
                >
                  {discovered ? (
                    <Animatable.View animation="fadeIn" style={styles.discoveredMarker}>
                      <View style={styles.markerCircle}>
                         <Award size={18} color="#FFF" />
                      </View>
                    </Animatable.View>
                  ) : (
                    <Animatable.View 
                      animation={isNear ? "bounce" : "pulse"} 
                      iterationCount="infinite" 
                      duration={isNear ? 1000 : 2000} 
                    >
                      {distance < (loc.radius || 40) ? (
                        /* Full Reveal - Pokemon GO style PokéStop/Gym */
                        <View style={styles.treasureMarker}>
                          <LinearGradient 
                            colors={loc.captureMethod === 'qr' ? ['#4F46E5','#7C3AED'] : ['#FFD700', '#FFA500']} 
                            style={styles.markerHexagon}
                          >
                            <View style={styles.hexIcon}>
                              {loc.captureMethod === 'qr' ? <Scan size={20} color="#FFF" /> : <Gem size={20} color="#FFF" />}
                            </View>
                          </LinearGradient>
                          <View style={styles.markerPulse} />
                        </View>
                      ) : distance < 500 || isCurrentTarget ? (
                        /* Mystery Radar / Target */
                        <View style={styles.mysteryRadar}>
                          <Animatable.View 
                            animation="rotate" 
                            iterationCount="infinite" 
                            duration={4000} 
                            style={styles.radarRing} 
                          />
                          <View style={[styles.radarCore, { backgroundColor: isCurrentTarget ? '#FFD700' : colors.primary }]}>
                             {isCurrentTarget ? <Gem size={16} color="#FFF" /> : <Radar size={14} color="#FFF" />}
                          </View>
                        </View>
                      ) : (
                        /* Distant Glow */
                        <View style={[styles.tinyGlow, { backgroundColor: colors.primary + '80' }]} />
                      )}
                    </Animatable.View>
                  )}
                </Marker>
                
                {!discovered && distance < 100 && (
                  <Circle
                    center={{ latitude: loc.coordinates.latitude, longitude: loc.coordinates.longitude }}
                    radius={loc.radius || 30}
                    fillColor={isNear ? 'rgba(255, 51, 102, 0.1)' : 'rgba(79, 70, 229, 0.05)'}
                    strokeColor={isNear ? '#FF3366' : colors.primary}
                    strokeWidth={2}
                    lineDashPattern={isNear ? undefined : [5, 5]}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Render Bombs when user is <1.5km to its treasure */}
          {bombs.map(b => {
            const treasure = treasureLocations.find(t => t.id === b.treasureId);
            if (!treasure) return null;

            // Show bombs if user is near treasure OR it is the current target/looking at it
            const isTargeted = treasure.id === currentTargetId || treasure.id === participation?.progress.currentLocationId;
            const userDistToTreasure = userLocation ? getDistance(
              userLocation.coords.latitude,
              userLocation.coords.longitude,
              treasure.coordinates.latitude,
              treasure.coordinates.longitude
            ) : Infinity;

            if (userDistToTreasure > 1500 && !isTargeted) return null;

            return (
              <Marker
                key={b.id}
                coordinate={{ latitude: b.latitude, longitude: b.longitude }}
              >
                <View style={[styles.bombMarkerContainer, { borderColor: theme === 'dark' ? '#1F2937' : '#FFF' }]}>
                   <BombIcon size={18} color="#FFF" />
                </View>
              </Marker>
            );
          })}
        </MapView>
      </Animatable.View>
      
      {loading && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }]}>
           <ActivityIndicator size="large" color="#FFF" />
        </View>
      )}

      {/* Premium UI Overlays */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        {/* Top Status Bar (Floating) */}
        <SafeAreaView style={styles.topSafeArea} pointerEvents="box-none">
          <Animatable.View animation="fadeInDown" duration={600} style={styles.topBar}>
            <TouchableOpacity onPress={onBack} style={styles.circularButton}>
              <BlurView intensity={40} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.blurCircular}>
                <ChevronLeft size={24} color={colors.foreground} />
              </BlurView>
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <BlurView intensity={40} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.blurPill}>
                 <MapPin size={14} color={colors.primary} />
                 <Text style={[styles.titleText, { color: colors.foreground }]}>
                   {nearLocation ? t('treasureHuntInArea') : 
                    (participation ? `${participation.progress.discoveredLocationIds?.length || 0}/${treasureLocations.length || 0}` : 'EXPLORING...')}
                 </Text>
              </BlurView>
            </View>

            <TouchableOpacity onPress={centerOnUser} style={styles.circularButton}>
              <BlurView intensity={40} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.blurCircular}>
                 <Navigation size={22} color={colors.primary} />
              </BlurView>
            </TouchableOpacity>
          </Animatable.View>
        </SafeAreaView>

        {/* Bottom Menu (Pokemon GO Style) */}
        {!selectedLocation && !nearLocation && (
          <View style={styles.bottomControls} pointerEvents="box-none">
            {/* Side Button Left: Profile */}
            <Animatable.View animation="fadeInLeft" duration={600}>
              <TouchableOpacity 
                style={[styles.circularButton, { backgroundColor: theme === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)' }]} 
                onPress={() => setShowProfile(true)}
              >
                <User size={24} color={colors.foreground} />
              </TouchableOpacity>

              {/* Debug Boom Button */}
              <TouchableOpacity 
                style={[styles.circularButton, { marginTop: 15, backgroundColor: 'rgba(239, 68, 68, 0.8)' }]} 
                onPress={triggerBoomEffect}
              >
                <BombIcon size={24} color="#FFF" />
              </TouchableOpacity>
            </Animatable.View>

            {/* Central Menu Button - Recenter on Treasure */}
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={centerOnTreasure}
              style={styles.mainMenuButton}
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                style={styles.mainMenuGradient}
              >
                <View style={styles.mainMenuInner}>
                  <View style={styles.mainMenuCenter} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Side Button Right: Rewards/Nearby */}
            <Animatable.View animation="fadeInRight" duration={600}>
              <TouchableOpacity 
                style={[styles.circularButton, { backgroundColor: theme === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)' }]} 
                onPress={onViewRewards}
              >
                <View style={styles.sideButtonContent}>
                  <Gift size={24} color={colors.primary} />
                  {/* Small indicator dots for nearby treasures */}
                  {treasureLocations.length > 0 && (
                    <View style={styles.miniRadar}>
                      <Radar size={10} color={colors.primary} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animatable.View>
          </View>
        )}

        {/* Near Treasure Alert (Pokemon Go style) */}
        {nearLocation && (
          <>
            {/* Full-Screen Glow Overlay Effect (Gold) */}
            <Animatable.View 
              animation="pulse" 
              iterationCount="infinite" 
              duration={2000}
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 215, 0, 0.15)', zIndex: 10 }]} 
              pointerEvents="none"
            />
            
            <Animatable.View animation="bounceInUp" duration={1000} style={[styles.nearAlertContainer, { zIndex: 20 }]}>
              {/* Floating Treasure Animation */}
              <Animatable.View 
                animation="pulse"
                iterationCount="infinite"
                duration={1500}
                style={{ alignSelf: 'center', marginBottom: -35, zIndex: 30 }}
              >
                <View style={{ backgroundColor: '#1A1A1A', padding: 18, borderRadius: 50, borderWidth: 3, borderColor: '#FFD700', shadowColor: '#FFD700', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 20 }}>
                  <Gem size={45} color="#FFD700" />
                </View>
              </Animatable.View>

              <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="dark" style={styles.radarCard}>
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 142, 83, 0.2)']}
                  style={styles.radarGradient}
                >
                   <View style={styles.radarContent}>
                      <View style={styles.radarAnimationBox}>
                         <Animatable.View 
                           animation="pulse" 
                           iterationCount="infinite" 
                           style={styles.radarCircleBig} 
                         />
                         <Animatable.View 
                           animation="pulse" 
                           iterationCount="infinite" 
                           delay={500}
                           style={styles.radarCircleSmall} 
                         />
                         <Radar size={40} color="#FFD700" />
                      </View>
                       <View style={styles.radarTextBox}>
                         <Text style={styles.radarTitle}>{t('treasureHuntNearTreasure')}</Text>
                         <Text style={styles.radarDesc}>{t('treasureHuntNearTreasureDesc')}</Text>
                         {campaign && (
                           <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                             {campaign.rewardType === 'points' && <Zap size={14} color="#FFD700" style={{ marginRight: 4 }} />}
                             {campaign.rewardType === 'discount' && <Gift size={14} color="#FFD700" style={{ marginRight: 4 }} />}
                             {campaign.rewardType === 'free_product' && <Gift size={14} color="#FFD700" style={{ marginRight: 4 }} />}
                             {campaign.rewardType === 'coupon' && <Award size={14} color="#FFD700" style={{ marginRight: 4 }} />}
                             
                             <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: 'bold' }}>
                                {campaign.rewardType === 'points' ? `+${campaign.rewardValue} ${t('points')}` :
                                 campaign.rewardType === 'discount' ? `${campaign.rewardValue}% ${t('discount')}` :
                                 campaign.rewardType === 'free_product' ? `${t('treasureHuntFreeProduct')}` :
                                 `${t('couponLabel')}`}
                             </Text>
                           </View>
                         )}
                      </View>
                   </View>
                               {/* Conditional button: QR scan or Virtual capture */}
                     {nearLocation.captureMethod === 'qr' ? (
                       <TouchableOpacity 
                         onPress={() => { onScan(nearLocation); }} 
                         style={styles.scanButton}
                       >
                         <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.scanGradient}>
                           <Scan size={24} color="#FFF" />
                           <Text style={styles.scanText}>{t('treasureHuntScanQR') || 'Scan QR Code'}</Text>
                         </LinearGradient>
                       </TouchableOpacity>
                     ) : (
                       <TouchableOpacity 
                         onPress={() => handleCapture(nearLocation)} 
                         disabled={capturing}
                         style={styles.scanButton}
                       >
                         <LinearGradient colors={['#FF3366', '#FF8E53']} style={styles.scanGradient}>
                            {capturing ? (
                              <ActivityIndicator color="#FFF" />
                            ) : (
                              <>
                                <Target size={24} color="#FFF" />
                                <Text style={styles.scanText}>{t('treasureHuntCaptureNow') || 'Capture Treasure'}</Text>
                              </>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                     )}
                 </LinearGradient>
              </BlurView>
            </Animatable.View>
          </>
        )}

         {/* Success Animation Overlay */}
         {showSuccessAnimation && (
           <Animatable.View 
             animation="fadeIn" 
             style={[StyleSheet.absoluteFill, styles.successOverlay]}
           >
             <Animatable.View 
               animation="zoomIn" 
               duration={600}
               style={styles.successContent}
             >
                <Animatable.View 
                  animation="tada" 
                  iterationCount="infinite"
                  duration={1500}
                >
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.treasureChestCircle}
                  >
                    <Gem size={80} color="#FFF" />
                  </LinearGradient>
                </Animatable.View>
                
                <Animatable.Text 
                  animation="slideInUp" 
                  delay={400}
                  style={styles.successTitle}
                >
                  {t('treasureHuntFoundIt') || 'TREASURE FOUND!'}
                </Animatable.Text>
                
                <View style={styles.particleContainer}>
                  {[...Array(6)].map((_, i) => (
                    <Animatable.View
                      key={i}
                      animation="fadeOutUp"
                      duration={2000}
                      iterationCount="infinite"
                      delay={i * 200}
                      style={[
                        styles.particle,
                        { left: 10 + i * 40, top: 40 + (i % 2) * 20 }
                      ]}
                    >
                      <Sparkles size={16} color="#FFD700" />
                    </Animatable.View>
                  ))}
                </View>
             </Animatable.View>
           </Animatable.View>
         )}

         {/* Boom Animation Overlay */}
         {showBoomAnimation && (
           <Animatable.View 
             animation="fadeIn" 
             duration={200}
             style={[StyleSheet.absoluteFill, styles.boomOverlay]}
           >
             <Animatable.View 
               animation="pulse" 
               iterationCount="infinite" 
               duration={200}
               style={styles.boomContainer}
             >
               <BombIcon size={120} color="#FF3366" />
               <Text style={styles.boomText}>BOOM!</Text>
             </Animatable.View>
           </Animatable.View>
         )}

         {/* Reward Celebration Modal */}
        <Modal
          visible={!!lastDiscoveredReward}
          transparent
          animationType="fade"
          onRequestClose={() => setLastDiscoveredReward(null)}
        >
          <View style={styles.modalOverlay}>
            <Animatable.View 
              animation="zoomIn" 
              duration={600} 
              style={styles.rewardModalContent}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.rewardHeader}
              >
                <Animatable.View 
                  animation="tada" 
                  iterationCount="infinite" 
                  duration={2000}
                >
                  <Trophy size={60} color="#FFF" />
                </Animatable.View>
                <Text style={styles.rewardModalTitle}>{t('treasureHuntCongratulations') || 'Congratulations!'}</Text>
              </LinearGradient>

              <View style={styles.rewardBody}>
                <Text style={styles.rewardMessage}>
                  {t('treasureHuntFoundReward') || 'You found a treasure!'}
                </Text>
                
                <View style={styles.rewardDetailCard}>
                  {lastDiscoveredReward?.type === 'points' && (
                    <View style={styles.rewardInfoRow}>
                      <Zap size={32} color="#FFD700" />
                      <Text style={styles.rewardValue}>+{lastDiscoveredReward.value} {t('points') || 'Points'}</Text>
                    </View>
                  )}
                  {lastDiscoveredReward?.type === 'discount' && (
                     <View style={styles.rewardInfoRow}>
                        <Gift size={32} color="#FF3366" />
                        <Text style={styles.rewardValue}>{lastDiscoveredReward.value}% {t('discount') || 'OFF'}</Text>
                     </View>
                  )}
                  {lastDiscoveredReward?.type === 'coupon' && (
                     <View style={styles.rewardInfoRow}>
                        <Award size={32} color="#4F46E5" />
                        <Text style={styles.rewardValue}>{t('couponLabel') || 'Coupon'}</Text>
                     </View>
                  )}
                  {lastDiscoveredReward?.type === 'free_product' && (
                     <View style={styles.rewardInfoRow}>
                        <Gift size={32} color="#10B981" />
                        <Text style={styles.rewardValue}>{t('treasureHuntFreeProduct') || 'Free Product'}</Text>
                     </View>
                  )}
                </View>

                <TouchableOpacity 
                  onPress={() => setLastDiscoveredReward(null)}
                  style={styles.continueButton}
                >
                  <Text style={styles.continueButtonText}>{t('continue') || 'Continue'}</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>
          </View>
        </Modal>

        {/* Selected Treasure Detail (Bottom Sheet style) */}
        {selectedLocation && !nearLocation && (
           <Animatable.View animation="slideInUp" duration={400} style={styles.selectedLocationCard}>
              <BlurView intensity={theme === 'dark' ? 40 : 80} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.detailBlur}>
                 <View style={styles.detailHeader}>
                    <View style={[styles.detailIconBox, { backgroundColor: isDiscovered(selectedLocation.id) ? '#10B98120' : '#FFD70020' }]}>
                       {isDiscovered(selectedLocation.id) ? <CheckCircle2 size={24} color="#10B981" /> : <Gem size={24} color="#FFD700" />}
                    </View>
                    <View style={styles.detailTitleBox}>
                       <Text style={[styles.detailTitle, { color: colors.foreground }]}>
                          {selectedLocation.name?.[currentLang as keyof typeof selectedLocation.name] || selectedLocation.name?.fr || selectedLocation.name?.['ar-tn'] || t('unknownProduct')}
                       </Text>
                       <Text style={[styles.detailStatus, { color: isDiscovered(selectedLocation.id) ? '#10B981' : colors.textMuted }]}>
                          {isDiscovered(selectedLocation.id) ? t('treasureHuntFound') : t('treasureHuntStillHidden')}
                       </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedLocation(null)} style={styles.detailCloseBtn}>
                       <Crosshair size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  
                  {selectedLocation.hint && (
                    <View style={styles.hintBox}>
                       <Sparkles size={16} color="#FFD700" />
                       <Text style={[styles.hintText, { color: colors.textMuted }]}>
                         {selectedLocation.hint?.[currentLang as keyof typeof selectedLocation.hint] || selectedLocation.hint?.fr || selectedLocation.hint?.['ar-tn']}
                       </Text>
                    </View>
                  )}

                  {/* Capture Method Badge */}
                  {!isDiscovered(selectedLocation.id) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                      <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: selectedLocation.captureMethod === 'qr' ? '#4F46E510' : '#FF336610',
                        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
                        borderWidth: 1, borderColor: selectedLocation.captureMethod === 'qr' ? '#4F46E540' : '#FF336640'
                      }}>
                        {selectedLocation.captureMethod === 'qr'
                          ? <Scan size={13} color="#4F46E5" style={{ marginRight: 5 }} />
                          : <Target size={13} color="#FF3366" style={{ marginRight: 5 }} />
                        }
                        <Text style={{ fontSize: 12, fontWeight: '600', color: selectedLocation.captureMethod === 'qr' ? '#4F46E5' : '#FF3366' }}>
                          {selectedLocation.captureMethod === 'qr'
                            ? (t('treasureHuntQRCapture') || 'Scan QR Code')
                            : (t('treasureHuntVirtualCapture') || 'Virtual Capture')}
                        </Text>
                      </View>
                    </View>
                  )}

                  {!isDiscovered(selectedLocation.id) && (
                    <TouchableOpacity 
                      onPress={() => {
                        setCurrentTargetId(selectedLocation.id);
                        if (mapRef.current) {
                           mapRef.current.animateCamera({
                             center: {
                               latitude: selectedLocation.coordinates.latitude,
                               longitude: selectedLocation.coordinates.longitude,
                             },
                             pitch: 45,
                             heading: 0,
                             altitude: 1000,
                             zoom: 17
                           }, { duration: 1000 });
                        }
                      }} 
                      style={[styles.trackButton, { 
                        marginBottom: 15, 
                        backgroundColor: currentTargetId === selectedLocation.id ? '#10B981' : colors.primary 
                      }]}
                    >
                      <Navigation size={18} color="#FFF" />
                      <Text style={styles.trackButtonText}>
                        {currentTargetId === selectedLocation.id ? t('treasureHuntTracking') : t('treasureHuntTrackTreasure')}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.detailRewardRow}>
                    <View style={styles.detailRewardItem}>
                       <Award size={14} color={colors.primary} />
                       <Text style={[styles.detailRewardText, { color: colors.textMuted }]}>
                         {t('treasureHuntExperiencePoints')}++
                       </Text>
                    </View>
                    <View style={styles.detailRewardItem}>
                       <Target size={14} color="#FF3366" />
                       <Text style={[styles.detailRewardText, { color: colors.textMuted }]}>
                         {getDistance(
                           userLocation?.coords.latitude || 0,
                           userLocation?.coords.longitude || 0,
                           selectedLocation.coordinates.latitude,
                           selectedLocation.coordinates.longitude
                         ).toFixed(0)}m {t('treasureHuntAway')}
                       </Text>
                    </View>
                    {participation?.progress.discoveredLocationIds?.includes(selectedLocation.id) && (
                      <View style={styles.detailRewardItem}>
                         <CheckCircle2 size={14} color="#10B981" />
                         <Text style={[styles.detailRewardText, { color: "#10B981", fontWeight: 'bold' }]}>
                           {t('complete')}
                         </Text>
                      </View>
                    )}
                  </View>
              </BlurView>
           </Animatable.View>
        )}
        {/* Profile Modal Overlay */}
        <Modal visible={showProfile} animationType="fade" transparent>
           <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20}}>
              <BlurView intensity={theme === 'dark' ? 60 : 100} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.profileModalContent}>
                 <Text style={[styles.profileModalTitle, {color: colors.foreground}]}>
                    {t('treasureHuntAdventureProfile') || 'Adventure Profile'}
                 </Text>
                 
                 <View style={[styles.profileStatRow, {borderBottomColor: colors.border}]}>
                    <Text style={{color: colors.textMuted, fontSize: 16}}>
                       {t('treasureHuntTreasuresFound') || 'Treasures Found'}
                    </Text>
                    <Text style={{color: colors.foreground, fontWeight: 'bold', fontSize: 16}}>
                       {participation?.progress.discoveredLocationIds?.length || 0} / {treasureLocations.length || 0}
                    </Text>
                 </View>

                 <View style={styles.profileStatRowNoBorder}>
                    <Text style={{color: colors.textMuted, fontSize: 16}}>
                       {t('treasureHuntCampaignStatus') || 'Campaign Status'}
                    </Text>
                    <Text style={{color: '#10B981', fontWeight: 'bold', fontSize: 16}}>
                       {t('treasureHuntActive') || 'Active'}
                    </Text>
                 </View>

                 <TouchableOpacity 
                    onPress={() => setShowProfile(false)} 
                    style={[styles.profileCloseButton, {backgroundColor: colors.primary}]}
                 >
                    <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 16}}>
                       {t('treasureHuntClose') || 'Close'}
                    </Text>
                 </TouchableOpacity>
              </BlurView>
           </View>
        </Modal>

      </View>
    </View>
  );
};

const lightMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#ebe3cd" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#523735" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f1e6" }] },
  { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#c9b2a6" }] },
  { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] },
  { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#a5b076" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#f5f1e6" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#f8c967" }] },
  { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#b9d3c2" }] }
];

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#1F2937" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#9CA3AF" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#111827" }] },
  { "featureType": "landscape", "stylers": [{ "color": "#111827" }] },
  { "featureType": "poi", "stylers": [{ "color": "#1F2937" }] },
  { "featureType": "road", "stylers": [{ "color": "#374151" }] },
  { "featureType": "water", "stylers": [{ "color": "#111827" }] }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  discoveryEffect: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinRings: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mysteryRipple: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rippleCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(79, 70, 229, 0.4)',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  circularButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurCircular: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  blurPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
    zIndex: 50,
  },
  miniRadar: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sideButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  sideButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sideBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainMenuButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFF',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
    marginHorizontal: 30,
  },
  mainMenuGradient: {
    flex: 1,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  mainMenuInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainMenuCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  markerHexagon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  markerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF3366',
    opacity: 0.5,
  },
  mysteryRadar: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(79, 70, 229, 0.4)',
    borderStyle: 'dashed',
  },
  radarCore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  tinyGlow: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: '#FFF',
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  discoveredMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  treasureMarker: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerHalo: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 51, 102, 0.4)',
  },
  markerCore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  hexIcon: {
    transform: [{ rotate: '-45deg' }],
  },
  markerCircle: {
     justifyContent: 'center',
     alignItems: 'center',
  },
  nearAlertContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  radarCard: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.3)',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
  },
  radarGradient: {
    padding: 24,
  },
  radarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  radarAnimationBox: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCircleBig: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 51, 102, 0.4)',
  },
  radarCircleSmall: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 51, 102, 0.6)',
  },
  radarTextBox: {
    flex: 1,
    marginLeft: 20,
  },
  radarTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  radarDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  scanButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  scanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  scanText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 10,
  },
  selectedLocationCard: {
    position: 'absolute',
    bottom: 30,
    left: 15,
    right: 15,
  },
  detailBlur: {
    padding: 24,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTitleBox: {
    flex: 1,
    marginLeft: 15,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  detailStatus: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  detailCloseBtn: {
    padding: 8,
    marginRight: -8,
  },
  hintBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    padding: 14,
    borderRadius: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  hintText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  detailRewardRow: {
    flexDirection: 'row',
    gap: 15,
  },
  detailRewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  detailRewardText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 10,
    gap: 8,
  },
  trackButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bombMarkerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  profileModalContent: {
     padding: 24,
     borderRadius: 32,
     overflow: 'hidden',
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.1)',
     backgroundColor: 'rgba(30, 30, 30, 0.9)',
  },
  profileModalTitle: {
     fontSize: 24,
     fontWeight: '900',
     marginBottom: 20,
     textAlign: 'center',
     letterSpacing: -0.5,
  },
  profileStatRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginBottom: 15,
     paddingBottom: 15,
     borderBottomWidth: 1,
  },
  profileStatRowNoBorder: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginBottom: 25,
  },
  profileCloseButton: {
     padding: 16,
     borderRadius: 16,
     alignItems: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rewardModalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFF',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  rewardHeader: {
    padding: 30,
    alignItems: 'center',
  },
  rewardModalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rewardBody: {
    padding: 25,
    alignItems: 'center',
  },
  rewardMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  rewardDetailCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  rewardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  rewardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  continueButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  boomOverlay: {
    backgroundColor: 'rgba(255, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  boomContainer: {
    alignItems: 'center',
  },
  boomText: {
    fontSize: 60,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 10,
    marginTop: 20,
  },
  successOverlay: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  successContent: {
    alignItems: 'center',
  },
  treasureChestCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    marginTop: 30,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  particleContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: -50,
  },
  particle: {
    position: 'absolute',
  },
});

export default TreasureMapScreen;
