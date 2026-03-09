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
  Modal,
  Animated as RNAnimated,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Animatable from 'react-native-animatable';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MapPin, 
  ChevronLeft, 
  Target, 
  CheckCircle2, 
  Circle,
  Navigation,
  Locate,
  ZoomIn,
  ZoomOut,
  X,
  Sparkles,
  Clock,
  Gift,
  Info
} from 'lucide-react-native';
import { treasureHuntService, Campaign, TreasureLocation, Participation } from '@/services/TreasureHuntService';
import { useAppTheme } from '@/context/ThemeContext';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface TreasureMapScreenProps {
  campaign: Campaign;
  userId: string;
  t: any;
  isDark: boolean;
  onBack: () => void;
  onScan: () => void;
  onRewardClaim: () => void;
}

const TreasureMapScreen: React.FC<TreasureMapScreenProps> = ({
  campaign,
  userId,
  t,
  isDark,
  onBack,
  onScan,
  onRewardClaim
}) => {
  const [locations, setLocations] = useState<(TreasureLocation & { isDiscovered?: boolean; isCurrentTarget?: boolean; distance?: number })[]>([]);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<(TreasureLocation & { isDiscovered?: boolean; isCurrentTarget?: boolean; distance?: number }) | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isNearTreasure, setIsNearTreasure] = useState(false);
  const [nearbyDistance, setNearbyDistance] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const mapRef = useRef<MapView>(null);
  const { colors, theme } = useAppTheme();

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const updateDistances = (userLat: number, userLon: number) => {
    setLocations(prev => prev.map(loc => ({
      ...loc,
      distance: calculateDistance(
        userLat, userLon,
        loc.coordinates.latitude, loc.coordinates.longitude
      )
    })));

    const currentTarget = locations.find(loc => loc.isCurrentTarget);
    if (currentTarget) {
      const distance = calculateDistance(
        userLat, userLon,
        currentTarget.coordinates.latitude, currentTarget.coordinates.longitude
      );
      
      const threshold = (currentTarget.radius || 50);
      setNearbyDistance(distance);
      
      if (distance <= threshold && !isNearTreasure) {
        setIsNearTreasure(true);
      } else if (distance > threshold && isNearTreasure) {
        setIsNearTreasure(false);
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get user's participation
      const participationData = await treasureHuntService.getParticipation(campaign.id, userId);
      setParticipation(participationData);

      // Get map data
      const mapData = await treasureHuntService.getMapData(campaign.id, userId);
      setLocations(mapData.locations);

      // Get user location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const userLat = location.coords.latitude;
        const userLon = location.coords.longitude;
        setUserLocation({
          latitude: userLat,
          longitude: userLon
        });
        
        // Calculate distances to all locations
        const locationsWithDistance = mapData.locations.map(loc => ({
          ...loc,
          distance: calculateDistance(userLat, userLon, loc.coordinates.latitude, loc.coordinates.longitude)
        }));
        setLocations(locationsWithDistance);

        // Check proximity to current target
        const currentTarget = locationsWithDistance.find(loc => loc.isCurrentTarget);
        if (currentTarget) {
          const distance = currentTarget.distance || 0;
          const threshold = currentTarget.radius || 50;
          if (distance <= threshold) {
            setIsNearTreasure(true);
          }
          setNearbyDistance(distance);
        }
      }
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [campaign.id, userId]);

  // Countdown timer for campaign end
  useEffect(() => {
    if (!campaign.endDate) return;
    
    const calculateTimeRemaining = () => {
      // Handle Firestore Timestamp
      let endDate: Date;
      const endDateAny = campaign.endDate as any;
      if (endDateAny && typeof endDateAny === 'object' && 'toDate' in endDateAny) {
        endDate = endDateAny.toDate();
      } else if (endDateAny instanceof Date) {
        endDate = endDateAny;
      } else {
        endDate = new Date(endDateAny);
      }
      
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining({ days, hours, minutes, seconds });
    };
    
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [campaign.endDate]);

  // Live location tracking for proximity updates
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (location) => {
            const userLat = location.coords.latitude;
            const userLon = location.coords.longitude;
            setUserLocation({ latitude: userLat, longitude: userLon });

            // Update distances
            setLocations(prev => {
              const updatedLocations = prev.map(loc => ({
                ...loc,
                distance: calculateDistance(
                  userLat, userLon,
                  loc.coordinates.latitude, loc.coordinates.longitude
                )
              }));

              // Check proximity to current target
              const currentTarget = updatedLocations.find(loc => loc.isCurrentTarget);
              if (currentTarget && currentTarget.distance !== undefined) {
                const threshold = currentTarget.radius || 50;
                setNearbyDistance(currentTarget.distance);
                
                if (currentTarget.distance <= threshold && !isNearTreasure) {
                  setIsNearTreasure(true);
                } else if (currentTarget.distance > threshold && isNearTreasure) {
                  setIsNearTreasure(false);
                }
              }

              return updatedLocations;
            });
          }
        );
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 500);
    }
  };

  const centerOnTarget = () => {
    const currentTarget = locations.find(loc => loc.isCurrentTarget);
    if (currentTarget && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentTarget.coordinates.latitude,
        longitude: currentTarget.coordinates.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
      }, 500);
    }
  };

  const handleMarkerPress = (location: TreasureLocation & { isDiscovered?: boolean; isCurrentTarget?: boolean }) => {
    setSelectedLocation(location);
    setShowLocationModal(true);
  };

  const getMarkerColor = (location: TreasureLocation & { isDiscovered?: boolean; isCurrentTarget?: boolean }) => {
    if (location.isDiscovered) return '#4ECDC4';
    if (location.isCurrentTarget) return '#FF6B6B';
    return '#AEAEB2';
  };

  const getMarkerIcon = (location: TreasureLocation & { isDiscovered?: boolean; isCurrentTarget?: boolean }) => {
    if (location.isDiscovered) return 'check';
    if (location.isCurrentTarget) return 'target';
    return 'circle';
  };

  const progress = participation ? {
    discovered: participation.progress.discoveredLocations,
    total: participation.progress.totalLocations
  } : { discovered: 0, total: locations.length };

  const renderMarker = (location: TreasureLocation & { isDiscovered?: boolean; isCurrentTarget?: boolean }) => (
    <Marker
      key={location.id}
      coordinate={{
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude
      }}
      onPress={() => handleMarkerPress(location)}
    >
      <Animatable.View 
        animation={location.isCurrentTarget ? 'pulse' : undefined}
        iterationCount="infinite"
        duration={1500}
        style={[styles.markerContainer, { backgroundColor: getMarkerColor(location) }]}
      >
        {location.isDiscovered ? (
          <CheckCircle2 size={20} color="#FFF" />
        ) : location.isCurrentTarget ? (
          <Target size={20} color="#FFF" />
        ) : (
          <Circle size={16} color="#FFF" />
        )}
      </Animatable.View>
    </Marker>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: locations[0]?.coordinates.latitude || 36.8065,
          longitude: locations[0]?.coordinates.longitude || 10.1815,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {locations.map(renderMarker)}
      </MapView>

      {/* Header */}
      <SafeAreaView style={styles.headerContainer} edges={['top']}>
        <View style={[styles.header, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)' }]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
              {campaign.name?.fr || campaign.name?.['ar-tn'] || 'Campaign'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              {progress.discovered} / {progress.total} {t('treasureHuntFound')}
            </Text>
          </View>
          <TouchableOpacity onPress={onScan} style={[styles.scanButton, { backgroundColor: colors.primary }]}>
            <MapPin size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        {/* Countdown Timer */}
        {timeRemaining && (timeRemaining.days > 0 || timeRemaining.hours > 0 || timeRemaining.minutes > 0) && (
          <View style={[styles.countdownContainer, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)' }]}>
            <Clock size={16} color={colors.primary} />
            <Text style={[styles.countdownText, { color: colors.foreground }]}>
              {timeRemaining.days > 0 && `${timeRemaining.days}d `}
              {String(timeRemaining.hours).padStart(2, '0')}:
              {String(timeRemaining.minutes).padStart(2, '0')}:
              {String(timeRemaining.seconds).padStart(2, '0')}
            </Text>
            <Text style={[styles.countdownLabel, { color: colors.textMuted }]}>
              {t('treasureHuntTimeRemaining') || 'remaining'}
            </Text>
          </View>
        )}
        
        {/* Progress Bar - Inside Header */}
        <View style={[styles.progressContainer, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)' }]}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.primary,
                  width: `${(progress.discovered / progress.total) * 100}%` 
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>
            {Math.round((progress.discovered / progress.total) * 100)}% {t('treasureHuntComplete')}
          </Text>
        </View>
      </SafeAreaView>

      {/* Proximity Alert - Pokemon Go style */}
      {locations.find(loc => loc.isCurrentTarget) && nearbyDistance !== null && !showLocationModal && (
        <Animatable.View 
          animation={isNearTreasure ? 'bounceIn' : undefined}
          iterationCount={isNearTreasure ? 'infinite' : 0}
          style={[
            styles.proximityAlert, 
            { 
              backgroundColor: isNearTreasure 
                ? 'rgba(52, 199, 89, 0.95)' 
                : theme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.98)',
              borderColor: isNearTreasure ? '#2D8F3E' : colors.border
            }
          ]}
        >
          <View style={styles.proximityContent}>
            <View style={[styles.proximityIcon, { 
              backgroundColor: isNearTreasure ? '#FFF' : colors.primary,
              transform: [{ scale: isNearTreasure ? 1.2 : 1 }]
            }]}>
              <Sparkles size={24} color={isNearTreasure ? '#34C759' : '#FFF'} />
            </View>
            <View style={styles.proximityText}>
              <Text style={[styles.proximityTitle, { color: isNearTreasure ? '#FFF' : colors.foreground }]}>
                {isNearTreasure 
                  ? '🎉 ' + (t('treasureHuntYouAreClose') || 'You are close!')
                  : t('treasureHuntTargetNearby') || 'Target Nearby'}
              </Text>
              <View style={styles.proximityDistanceRow}>
                <Text style={[styles.proximityDistance, { color: isNearTreasure ? '#E8F5E9' : colors.textMuted }]}>
                  {nearbyDistance !== null && (
                    <>
                      {nearbyDistance <= 1000 
                        ? `${Math.round(nearbyDistance)}m` 
                        : `${(nearbyDistance / 1000).toFixed(1)}km`}
                      {' '}{t('treasureHuntAway') || 'away'}
                    </>
                  )}
                </Text>
                {!isNearTreasure && nearbyDistance !== null && nearbyDistance <= 100 && (
                  <Text style={[styles.almostThere, { color: '#FF9500' }]}>
                     - Almost there!
                  </Text>
                )}
              </View>
            </View>
            {isNearTreasure ? (
              <TouchableOpacity 
                onPress={onScan}
                style={[styles.scanNowButton, { backgroundColor: '#FFF' }]}
              >
                <Sparkles size={16} color="#34C759" />
                <Text style={[styles.scanNowText, { color: '#34C759' }]}>{t('treasureHuntScanNow') || 'Scan!'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={centerOnTarget}
                style={[styles.scanNowButton, { backgroundColor: colors.primary }]}
              >
                <Navigation size={16} color="#FFF" />
                <Text style={styles.scanNowText}>{t('treasureHuntNavigate') || 'Go'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Distance progress bar */}
          {nearbyDistance && (
            <View style={styles.distanceBarContainer}>
              <View style={[
                styles.distanceBarFill, 
                { 
                  backgroundColor: isNearTreasure ? '#FFF' : colors.primary,
                  width: `${Math.max(0, Math.min(100, ((500 - nearbyDistance) / 500) * 100))}%`
                }
              ]} />
            </View>
          )}
        </Animatable.View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={centerOnUser} style={[styles.actionButton, { backgroundColor: theme === 'dark' ? '#1A1A1E' : '#FFF' }]}>
          <Locate size={22} color={colors.primary} />
        </TouchableOpacity>
        {locations.find(loc => loc.isCurrentTarget) && (
          <TouchableOpacity onPress={centerOnTarget} style={[styles.actionButton, { backgroundColor: theme === 'dark' ? '#1A1A1E' : '#FFF' }]}>
            <Navigation size={22} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Location Info Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <BlurView intensity={80} tint={theme} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#1A1A1E' : '#FFF' }]}>
            {selectedLocation && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.locationBadge, { backgroundColor: getMarkerColor(selectedLocation) + '20' }]}>
                    {selectedLocation.isDiscovered ? (
                      <CheckCircle2 size={18} color={getMarkerColor(selectedLocation)} />
                    ) : selectedLocation.isCurrentTarget ? (
                      <Target size={18} color={getMarkerColor(selectedLocation)} />
                    ) : (
                      <Circle size={16} color={getMarkerColor(selectedLocation)} />
                    )}
                  </View>
                  <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                    {selectedLocation.name?.fr || selectedLocation.name?.['ar-tn'] || 'Location'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                    <X size={24} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {selectedLocation.hint && (
                  <View style={styles.hintContainer}>
                    <Info size={16} color={colors.primary} />
                    <Text style={[styles.hintText, { color: colors.textMuted }]}>
                      {selectedLocation.hint?.fr || selectedLocation.hint?.['ar-tn']}
                    </Text>
                  </View>
                )}

                <View style={styles.rewardContainer}>
                  <Gift size={20} color="#4ECDC4" />
                  <Text style={[styles.rewardText, { color: colors.foreground }]}>
                    {/* Rewards are now campaign-level */}
                    {campaign.rewardType === 'points' 
                      ? `${campaign.rewardValue} ${t('treasureHuntPoints')}`
                      : campaign.rewardType === 'discount'
                      ? `${campaign.rewardValue}% ${t('treasureHuntDiscount')}`
                      : campaign.rewardType === 'coupon'
                      ? t('treasureHuntCoupon')
                      : campaign.rewardType === 'free_product'
                      ? t('treasureHuntFreeProduct')
                      : t('treasureHuntMysteryReward')
                    }
                  </Text>
                </View>

                {selectedLocation.isCurrentTarget && !selectedLocation.isDiscovered && (
                  <TouchableOpacity 
                    onPress={() => {
                      setShowLocationModal(false);
                      onScan();
                    }}
                    style={[styles.scanLocationButton, { backgroundColor: colors.primary }]}
                  >
                    <MapPin size={20} color="#FFF" />
                    <Text style={styles.scanLocationText}>{t('treasureHuntScanNow')}</Text>
                  </TouchableOpacity>
                )}

                {selectedLocation.isDiscovered && (
                  <View style={[styles.discoveredBadge, { backgroundColor: '#4ECDC420' }]}>
                    <Sparkles size={20} color="#4ECDC4" />
                    <Text style={[styles.discoveredText, { color: '#4ECDC4' }]}>
                      {t('treasureHuntAlreadyFound')}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: width * 0.04,
    paddingTop: 8,
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Math.min(12, width * 0.03),
    borderRadius: Math.min(16, width * 0.04),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  progressContainer: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: Math.min(14, width * 0.035),
    borderRadius: Math.min(14, width * 0.035),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  countdownLabel: {
    fontSize: 12,
    marginLeft: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: Math.min(18, width * 0.045),
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: Math.min(12, width * 0.03),
    marginTop: 2,
  },
  scanButton: {
    width: Math.min(44, width * 0.11),
    height: Math.min(44, width * 0.11),
    borderRadius: Math.min(14, width * 0.035),
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: Math.min(12, width * 0.03),
    marginTop: 8,
    textAlign: 'center',
  },
  actionButtons: {
    position: 'absolute',
    right: width * 0.04,
    bottom: 120,
    zIndex: 25,
  },
  actionButton: {
    width: Math.min(48, width * 0.12),
    height: Math.min(48, width * 0.12),
    borderRadius: Math.min(14, width * 0.035),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    marginBottom: 16,
  },
  hintText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
  },
  rewardText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  scanLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  scanLocationText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  discoveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
  },
  discoveredText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  proximityAlert: {
    position: 'absolute',
    left: width * 0.04,
    right: width * 0.04,
    top: 190,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10,
  },
  proximityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proximityIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  proximityText: {
    flex: 1,
  },
  proximityTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  proximityDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  proximityDistance: {
    fontSize: 13,
    fontWeight: '500',
  },
  almostThere: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  scanNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 6,
  },
  scanNowText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  distanceBarContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  distanceBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  radarAnimation: {
    position: 'absolute',
    right: 12,
    top: '50%',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    opacity: 0.5,
  },
});

export default TreasureMapScreen;
