import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Navigation, Package, Phone, Clock, Check, Car } from 'lucide-react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { useLocation } from '../../hooks/useLocation';
import { DeliveryOrder, getDeliveryStatusColor, getDeliveryStatusLabel, calculateDistance } from '../../types/delivery';

const { width, height } = Dimensions.get('window');

interface OrderTrackingScreenProps {
  orderId: string;
  onBack: () => void;
  user: any;
  theme: 'light' | 'dark';
  t: (key: string) => string;
  language: string;
  onNavigate?: (screen: string, params?: any) => void;
}

export default function OrderTrackingScreen({
  orderId,
  onBack,
  user,
  theme,
  t,
  language,
  onNavigate,
}: OrderTrackingScreenProps) {
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';
  const mapRef = useRef<MapView>(null);
  
  const { location: userLocation } = useLocation({ enableHighAccuracy: false });
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const colors = {
    background: isDark ? '#000000' : '#FFFFFF',
    foreground: isDark ? '#FFFFFF' : '#000000',
    card: isDark ? '#1C1C1E' : '#F2F2F7',
    border: isDark ? '#38383A' : '#C6C6C8',
    accent: isDark ? '#0A84FF' : '#007AFF',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    textMuted: isDark ? '#8E8E93' : '#8E8E93',
  };

  const tr = (en: string, fr: string, ar: string) => {
    return language === 'ar' ? ar : (language === 'fr' ? fr : en);
  };

  // Subscribe to order updates
  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = onSnapshot(doc(db, 'deliveries', orderId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setOrder({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          acceptedAt: data.acceptedAt?.toDate(),
          pickedUpAt: data.pickedUpAt?.toDate(),
          deliveredAt: data.deliveredAt?.toDate(),
        } as DeliveryOrder);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  // Center map on driver location when it updates
  useEffect(() => {
    if (order?.driverLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: order.driverLocation.latitude,
        longitude: order.driverLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  }, [order?.driverLocation]);

  const getDistanceToDriver = () => {
    if (!order?.driverLocation || !userLocation) return null;
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      order.driverLocation.latitude,
      order.driverLocation.longitude
    );
    return distance.toFixed(1);
  };

  const getDistanceToDestination = () => {
    if (!order) return null;
    
    const distance = calculateDistance(
      order.driverLocation?.latitude || order.pickupLatitude,
      order.driverLocation?.longitude || order.pickupLongitude,
      order.deliveryLatitude,
      order.deliveryLongitude
    );
    return distance.toFixed(1);
  };

  const getEstimatedTime = () => {
    const distance = getDistanceToDestination();
    if (!distance) return null;
    
    // Assume average speed of 30 km/h in city
    const time = (parseFloat(distance) / 30) * 60;
    return Math.ceil(time);
  };

  const getMapRegion = () => {
    if (order?.driverLocation) {
      return {
        latitude: order.driverLocation.latitude,
        longitude: order.driverLocation.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
    }
    
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    
    return {
      latitude: order?.deliveryLatitude || 36.8065,
      longitude: order?.deliveryLongitude || 10.1815,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: tr('Order Placed', 'Commande passée', 'تم الطلب') },
      { key: 'accepted', label: tr('Driver Assigned', 'Chauffeur assigné', 'تم تعيين السائق') },
      { key: 'picked_up', label: tr('Picked Up', 'Retiré', 'تم الاستلام') },
      { key: 'in_transit', label: tr('In Transit', 'En livraison', 'في الطريق') },
      { key: 'delivered', label: tr('Delivered', 'Livré', 'تم التوصيل') },
    ];

    const currentIndex = steps.findIndex(s => s.key === order?.status);
    
    return steps.map((step, index) => ({
      ...step,
      isCompleted: index <= currentIndex,
      isCurrent: index === currentIndex,
    }));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.foreground }]}>
            {tr('Loading order...', 'Chargement...', 'جاري التحميل...')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <ChevronLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {tr('Track Order', 'Suivre commande', 'تتبع الطلب')}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textMuted }]}>
            {tr('Order not found', 'Commande non trouvée', 'الطلب غير موجود')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {tr('Track Order', 'Suivre commande', 'تتبع الطلب')}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getDeliveryStatusColor(order.status) + '20' }]}>
          <Text style={[styles.headerStatus, { color: getDeliveryStatusColor(order.status) }]}>
            {getDeliveryStatusLabel(order.status, language).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={getMapRegion()}
          showsUserLocation
          showsMyLocationButton
        >
          {/* Delivery destination marker */}
          <Marker
            coordinate={{
              latitude: order.deliveryLatitude,
              longitude: order.deliveryLongitude,
            }}
            title={tr('Delivery Address', 'Adresse de livraison', 'عنوان التوصيل')}
          >
            <View style={[styles.destinationMarker, { backgroundColor: colors.success }]}>
              <MapPin size={16} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Pickup location marker */}
          <Marker
            coordinate={{
              latitude: order.pickupLatitude,
              longitude: order.pickupLongitude,
            }}
            title={tr('Pickup Location', 'Point de retrait', 'نقطة الاستلام')}
          >
            <View style={[styles.pickupMarker, { backgroundColor: colors.warning }]}>
              <Package size={14} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Driver marker (when assigned) */}
          {order.driverLocation && (
            <Marker
              coordinate={{
                latitude: order.driverLocation.latitude,
                longitude: order.driverLocation.longitude,
              }}
              title={order.driverName || tr('Driver', 'Chauffeur', 'السائق')}
            >
              <View style={[styles.driverMarker, { backgroundColor: colors.accent }]}>
                <Car size={14} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Route polyline */}
          {order.status !== 'pending' && order.status !== 'delivered' && (
            <Polyline
              coordinates={[
                {
                  latitude: order.driverLocation?.latitude || order.pickupLatitude,
                  longitude: order.driverLocation?.longitude || order.pickupLongitude,
                },
                {
                  latitude: order.deliveryLatitude,
                  longitude: order.deliveryLongitude,
                },
              ]}
              strokeColor={colors.accent}
              strokeWidth={4}
              lineDashPattern={[1]}
            />
          )}
        </MapView>

        {/* ETA overlay */}
        {order.status === 'in_transit' && (
          <View style={[styles.etaOverlay, { backgroundColor: colors.card }]}>
            <Clock size={16} color={colors.accent} />
            <Text style={[styles.etaText, { color: colors.foreground }]}>
              {getEstimatedTime()} {tr('min', 'min', 'دقيقة')}
            </Text>
            <Text style={[styles.etaDistance, { color: colors.textMuted }]}>
              {getDistanceToDestination()} km
            </Text>
          </View>
        )}
      </View>

      {/* Order Info */}
      <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
        {/* Driver Info (when assigned) */}
        {order.driverId && (
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitial}>
                {(order.driverName || 'D').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={[styles.driverName, { color: colors.foreground }]}>
                {order.driverName || tr('Driver', 'Chauffeur', 'السائق')}
              </Text>
              {order.driverPhone && (
                <TouchableOpacity style={styles.callBtn}>
                  <Phone size={14} color={colors.accent} />
                  <Text style={[styles.callBtnText, { color: colors.accent }]}>
                    {tr('Call', 'Appeler', 'اتصال')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {getDistanceToDriver() && (
              <View style={styles.driverDistance}>
                <Navigation size={12} color={colors.textMuted} />
                <Text style={[styles.driverDistanceText, { color: colors.textMuted }]}>
                  {getDistanceToDriver()} km
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Delivery Address */}
        <View style={styles.addressRow}>
          <MapPin size={18} color={colors.success} />
          <View style={styles.addressContent}>
            <Text style={[styles.addressLabel, { color: colors.textMuted }]}>
              {tr('Delivery Address', 'Adresse de livraison', 'عنوان التوصيل')}
            </Text>
            <Text style={[styles.addressText, { color: colors.foreground }]}>
              {order.deliveryAddress}
            </Text>
          </View>
        </View>

        {/* Status Timeline */}
        <View style={styles.timeline}>
          {statusSteps.map((step, index) => (
            <View key={step.key} style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor: step.isCompleted ? colors.success : colors.border,
                    borderColor: step.isCurrent ? colors.success : 'transparent',
                  },
                ]}
              >
                {step.isCompleted && <Check size={10} color="#FFFFFF" />}
              </View>
              {index < statusSteps.length - 1 && (
                <View
                  style={[
                    styles.timelineLine,
                    { backgroundColor: step.isCompleted ? colors.success : colors.border },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.timelineLabel,
                  {
                    color: step.isCompleted ? colors.foreground : colors.textMuted,
                    fontWeight: step.isCurrent ? '700' : '400',
                  },
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerStatus: {
    fontSize: 10,
    fontWeight: '700',
  },
  mapContainer: {
    height: 280,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  destinationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pickupMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  driverMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  etaOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaText: {
    fontSize: 14,
    fontWeight: '700',
  },
  etaDistance: {
    fontSize: 12,
  },
  infoCard: {
    flex: 1,
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    marginBottom: 16,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  driverDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driverDistanceText: {
    fontSize: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineStep: {
    alignItems: 'center',
    width: 60,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  timelineLine: {
    width: 2,
    height: 20,
    marginVertical: 2,
  },
  timelineLabel: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
  },
});
