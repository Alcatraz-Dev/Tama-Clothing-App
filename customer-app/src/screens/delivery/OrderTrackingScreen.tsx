import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  MapPin,
  Navigation,
  Package,
  Phone,
  Clock,
  Check,
  Car,
  Info,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Store,
  QrCode,
  X,
} from 'lucide-react-native';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import { getDeliveryStatusColor, getDeliveryStatusLabel } from '../../types/delivery';
import { BlurView } from 'expo-blur';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInDown,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OrderTrackingScreenProps {
  orderId: string;
  onBack: () => void;
  user: any;
  theme: 'light' | 'dark';
  t: (key: string) => string;
  language: string;
  onNavigate?: (screen: string, params?: any) => void;
}

const PulseMarker = ({ color }: { color: string }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(withTiming(2, { duration: 1500 }), -1, false);
    opacity.value = withRepeat(withTiming(0, { duration: 1500 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.markerWrapper}>
      <Animated.View style={[styles.pulse, { backgroundColor: color }, animatedStyle]} />
      <View style={[styles.mainMarker, { backgroundColor: color }]}>
        <Car size={16} color="#FFF" />
      </View>
    </View>
  );
};

const DriverMarker = ({ color, heading }: { color: string; heading?: number }) => {
  return (
    <View style={styles.markerWrapper}>
      <View style={[styles.mainMarker, { backgroundColor: color, transform: [{ rotate: `${heading || 0}deg` }] }]}>
        <Navigation size={18} color="#FFF" />
      </View>
    </View>
  );
};

export default function OrderTrackingScreen({
  orderId,
  onBack,
  user,
  theme,
  t,
  language,
  onNavigate,
}: OrderTrackingScreenProps) {
  const [showQR, setShowQR] = useState(false);
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';
  const mapRef = useRef<MapView>(null);
  const isRtl = language === 'ar';

  const { order, isLoading, eta } = useOrderTracking({ orderId, language });

  const colors = useMemo(() => ({
    background: isDark ? '#000000' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    subtext: isDark ? '#8E8E93' : '#666666',
    accent: '#0A84FF',
    success: '#34C759',
    border: isDark ? '#2C2C2E' : '#E5E5EA',
  }), [isDark]);

  const tr = (en: string, fr: string, ar: string) => {
    return language === 'ar' ? ar : (language === 'fr' ? fr : en);
  };

  useEffect(() => {
    if (order?.driverLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: order.driverLocation.latitude,
        longitude: order.driverLocation.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 1000);
    }
  }, [order?.driverLocation?.latitude]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{tr('Order not found', 'Commande non trouvée', 'الطلب غير موجود')}</Text>
        <TouchableOpacity onPress={onBack} style={styles.backBtnFloat}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  }

  const statusLabel = getDeliveryStatusLabel(order.status, language);
  const statusColor = getDeliveryStatusColor(order.status);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* MAP VIEW */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: order.driverLocation?.latitude || order.deliveryLatitude,
          longitude: order.driverLocation?.longitude || order.deliveryLongitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        customMapStyle={isDark ? DARK_MAP_STYLE : []}
      >
        {/* User Destination */}
        <Marker coordinate={{ latitude: order.deliveryLatitude, longitude: order.deliveryLongitude }}>
          <View style={[styles.destMarker, { backgroundColor: colors.success }]}>
            <MapPin size={20} color="#FFF" />
          </View>
        </Marker>

        {/* Store / Pickup Location */}
        {order.status === 'accepted' || order.status === 'pending' || order.status === 'picked_up' ? (
          <Marker
            coordinate={{ latitude: order.pickupLatitude, longitude: order.pickupLongitude }}
            title={order.storeName || tr('Store', 'Magasin', 'المتجر')}
            description={order.pickupAddress}
          >
            <View style={[styles.storeMarker, { backgroundColor: colors.accent }]}>
              <Store size={20} color="#FFF" />
            </View>
          </Marker>
        ) : null}

        {/* Driver Real-time position */}
        {order.driverLocation && (
          <Marker
            coordinate={{
              latitude: order.driverLocation.latitude,
              longitude: order.driverLocation.longitude
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
          >
            <DriverMarker color={colors.accent} heading={order.driverLocation.heading} />
          </Marker>
        )}

        {/* Path highlight - From Driver to next destination */}
        {order.driverLocation && (
          <Polyline
            coordinates={
              order.status === 'accepted'
                ? [
                  { latitude: order.driverLocation.latitude, longitude: order.driverLocation.longitude },
                  { latitude: order.pickupLatitude, longitude: order.pickupLongitude }
                ]
                : [
                  { latitude: order.driverLocation.latitude, longitude: order.driverLocation.longitude },
                  { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude }
                ]
            }
            strokeColor={colors.accent}
            strokeWidth={4}
            lineDashPattern={[5, 10]}
          />
        )}
      </MapView>

      {/* TOP CONTROLS */}
      <View style={[styles.topOverlay, { top: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.glassBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)' }]}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <Animated.View entering={FadeIn.delay(300)} style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{statusLabel}</Text>
        </Animated.View>
      </View>

      {/* BOTTOM INFO PANEL */}
      <Animated.View entering={SlideInDown} style={[styles.bottomPanel, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
        {/* Drag Indicator */}
        <View style={styles.dragHandle} />

        {/* Top Section: Status & ETA */}
        <View style={styles.panelHeader}>
          <View>
            <Text style={[styles.etaLabel, { color: colors.subtext }]}>{tr('Arriving in', 'Arrivée dans', 'يصل خلال')}</Text>
            <Text style={[styles.etaTime, { color: colors.text }]}>{eta} {tr('min', 'min', 'دق')}</Text>
          </View>
          <View style={[styles.orderIconBox, { backgroundColor: colors.accent + '20' }]}>
            <Clock size={28} color={colors.accent} />
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]} />
          <Animated.View
            entering={FadeInDown.delay(500)}
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.accent,
                width: order.status === 'delivered' ? '100%' : (order.status === 'in_transit' ? '70%' : '30%')
              }
            ]}
          />
        </View>

        {/* Driver Section */}
        {order.driverId && (
          <View style={styles.driverSection}>
            <View style={styles.driverProfile}>
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarText}>{order.driverName?.charAt(0) || 'D'}</Text>
              </View>
              <View style={styles.driverMeta}>
                <Text style={[styles.driverNameText, { color: colors.text }]}>{order.driverName}</Text>
                <View style={styles.ratingRow}>
                  <Car size={14} color={colors.subtext} />
                  <Text style={[styles.carInfo, { color: colors.subtext }]}>Tama Verified Partner</Text>
                </View>
              </View>
            </View>
            <View style={styles.actionCircleRow}>
              <TouchableOpacity
                onPress={() => order.driverPhone && Linking.openURL(`tel:${order.driverPhone}`)}
                style={[styles.circleBtn, { backgroundColor: colors.border }]}
              >
                <Phone size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowQR(true)}
                style={[styles.circleBtn, { backgroundColor: colors.border }]}
              >
                <QrCode size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.circleBtn, { backgroundColor: colors.border }]}>
                <ShieldCheck size={20} color={colors.success} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Address Info */}
        <View style={[styles.addressBox, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <View style={styles.addressRow}>
            <MapPin size={20} color={colors.success} />
            <View style={styles.addressTextWrapper}>
              <Text style={[styles.addressItemLabel, { color: colors.subtext }]}>{tr('Delivery Address', 'Adresse de livraison', 'عنوان التوصيل')}</Text>
              <Text style={[styles.addressValue, { color: colors.text }]} numberOfLines={1}>{order.deliveryAddress}</Text>
            </View>
          </View>
        </View>

        {/* Order Details Preview */}
        <TouchableOpacity style={[styles.detailsPreview, { backgroundColor: colors.border + '50' }]}>
          <View style={styles.detailsRow}>
            <Package size={18} color={colors.text} />
            <Text style={[styles.detailsText, { color: colors.text }]}>{order.itemsCount} {tr('items', 'articles', 'منتجات')}</Text>
            <View style={{ flex: 1 }} />
            <Text style={[styles.totalAmount, { color: colors.accent }]}>{order.totalAmount} TND</Text>
            <ChevronRight size={18} color={colors.subtext} />
          </View>
        </TouchableOpacity>

        {/* QR Code Modal */}
        <Modal
          visible={showQR}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowQR(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <Animated.View entering={FadeInDown} style={[styles.qrModal, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                onPress={() => setShowQR(false)}
                style={styles.closeModalBtn}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.qrTitle, { color: colors.text }]}>{tr('Verification Code', 'Code de vérification', 'رمز التحقق')}</Text>
              <Text style={[styles.qrSubtitle, { color: colors.subtext }]}>{tr('Show this to the driver', 'Montrez ceci au livreur', 'اعرض هذا للسائق')}</Text>

              <View style={styles.qrContainer}>
                <QRCode
                  value={JSON.stringify({
                    id: order.id,
                    orderId: order.orderId,
                    type: 'delivery_confirmation'
                  })}
                  size={200}
                  backgroundColor={colors.card}
                  color={colors.text}
                />
              </View>

              <View style={[styles.orderRefBox, { backgroundColor: colors.border + '30' }]}>
                <Text style={[styles.orderRefText, { color: colors.subtext }]}>#{order.orderId.toUpperCase()}</Text>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </Animated.View>
    </View>
  );
}

const DARK_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  statusBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  markerWrapper: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 20, height: 20, borderRadius: 10 },
  mainMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  destMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  storeMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#CCC',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.5,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  etaLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  etaTime: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  orderIconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  progressContainer: { height: 6, width: '100%', marginBottom: 24, position: 'relative' },
  progressTrack: { height: '100%', width: '100%', borderRadius: 3, opacity: 0.2 },
  progressFill: { height: '100%', borderRadius: 3, position: 'absolute', left: 0 },
  driverSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  driverProfile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  driverMeta: { gap: 2 },
  driverNameText: { fontSize: 18, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  carInfo: { fontSize: 12 },
  actionCircleRow: { flexDirection: 'row', gap: 12 },
  circleBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  addressBox: { paddingTop: 20, marginBottom: 20 },
  addressRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  addressTextWrapper: { flex: 1 },
  addressItemLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  addressValue: { fontSize: 16, fontWeight: 'bold' },
  detailsPreview: { padding: 14, borderRadius: 16 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailsText: { fontWeight: '700' },
  totalAmount: { fontWeight: '900', marginRight: 10 },
  backBtnFloat: { marginTop: 20, padding: 10 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  qrModal: {
    width: '85%',
    padding: 30,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  closeModalBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 5,
  },
  qrTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  qrSubtitle: {
    fontSize: 14,
    marginBottom: 30,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 20,
  },
  orderRefBox: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  orderRefText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
