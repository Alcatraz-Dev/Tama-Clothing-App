import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Navigation, Package, Phone, Clock, Check, X } from 'lucide-react-native';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { useLocation } from '../../hooks/useLocation';
import { DeliveryOrder, getDeliveryStatusColor, calculateDistance, isWithinRadius } from '../../types/delivery';

const { width, height } = Dimensions.get('window');

interface DriverDeliveryScreenProps {
  onBack: () => void;
  user: any;
  profileData: any;
  theme: 'light' | 'dark';
  t: (key: string) => string;
  language: string;
  onNavigate?: (screen: string, params?: any) => void;
}

// Default store location (TamaClothing store)
const STORE_LOCATION = {
  latitude: 36.8065,  // Tunis, Tunisia
  longitude: 10.1815,
};

const RADIUS_KM = 15; // 15km radius

export default function DriverDeliveryScreen({
  onBack,
  user,
  profileData,
  theme,
  t,
  language,
  onNavigate,
}: DriverDeliveryScreenProps) {
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';
  
  const {
    location: driverLocation,
    errorMsg,
    isLoading: locationLoading,
    permissionStatus,
    refreshLocation,
    startTracking,
    stopTracking,
  } = useLocation({ enableHighAccuracy: true });

  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(null);

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

  // Subscribe to available orders
  useEffect(() => {
    const q = query(
      collection(db, 'deliveries'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as DeliveryOrder[];
      
      // Filter orders within 15km of driver location
      if (driverLocation) {
        const filteredOrders = orders.filter(order =>
          isWithinRadius(
            driverLocation.latitude,
            driverLocation.longitude,
            order.deliveryLatitude,
            order.deliveryLongitude,
            RADIUS_KM
          )
        );
        setAvailableOrders(filteredOrders);
      } else {
        // If no driver location, show all pending orders
        setAvailableOrders(orders);
      }
    });

    return () => unsubscribe();
  }, [driverLocation]);

  // Subscribe to driver's active order
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'deliveries'),
      where('driverId', '==', user.uid),
      where('status', 'in', ['accepted', 'picked_up', 'in_transit'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as DeliveryOrder[];
      
      if (orders.length > 0) {
        setActiveOrder(orders[0]);
      } else {
        setActiveOrder(null);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Start tracking when component mounts
  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, []);

  const handleAcceptOrder = async (order: DeliveryOrder) => {
    if (!user?.uid) return;
    
    setIsAccepting(true);
    try {
      await updateDoc(doc(db, 'deliveries', order.id), {
        status: 'accepted',
        driverId: user.uid,
        driverName: profileData?.fullName || 'Driver',
        driverPhone: profileData?.phone || '',
        acceptedAt: serverTimestamp(),
      });
      
      Alert.alert(
        t('successTitle'),
        tr('Order accepted!', 'Commande acceptée!', 'الطلب تم قبوله!')
      );
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert(t('error'), tr('Failed to accept order', 'Échec de acceptation', 'فشل في قبول الطلب'));
    } finally {
      setIsAccepting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'picked_up' | 'in_transit' | 'delivered') => {
    if (!activeOrder) return;

    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'picked_up') {
        updateData.pickedUpAt = serverTimestamp();
      } else if (newStatus === 'delivered') {
        updateData.deliveredAt = serverTimestamp();
      }

      await updateDoc(doc(db, 'deliveries', activeOrder.id), updateData);
      
      Alert.alert(
        t('successTitle'),
        tr('Status updated!', 'Statut mis à jour!', 'الحالة تم تحديثها!')
      );
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert(t('error'), tr('Failed to update status', 'Échec de mise à jour', 'فشل في تحديث الحالة'));
    }
  };

  const getDistanceFromStore = (order: DeliveryOrder) => {
    const distance = calculateDistance(
      STORE_LOCATION.latitude,
      STORE_LOCATION.longitude,
      order.deliveryLatitude,
      order.deliveryLongitude
    );
    return distance.toFixed(1);
  };

  // Calculate region to show all orders
  const getMapRegion = () => {
    if (driverLocation) {
      return {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }
    return {
      latitude: STORE_LOCATION.latitude,
      longitude: STORE_LOCATION.longitude,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    };
  };

  if (locationLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.foreground }]}>
            {tr('Getting your location...', 'Obtention de votre position...', 'جاري الحصول على موقعك...')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg && !driverLocation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <ChevronLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {tr('Delivery', 'Livraison', 'التوصيل')}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <MapPin size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.foreground }]}>{errorMsg}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.accent }]}
            onPress={refreshLocation}
          >
            <Text style={styles.retryBtnText}>{tr('Retry', 'Réessayer', 'إعادة المحاولة')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {tr('Delivery', 'Livraison', 'التوصيل')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={getMapRegion()}
          showsUserLocation
          showsMyLocationButton
        >
          {/* Store marker */}
          <Marker
            coordinate={STORE_LOCATION}
            title={tr('Store', 'Magasin', 'المتجر')}
          >
            <View style={[styles.storeMarker, { backgroundColor: colors.accent }]}>
              <Package size={16} color="#FFFFFF" />
            </View>
          </Marker>

          {/* 15km radius circle */}
          {driverLocation && (
            <Circle
              center={driverLocation}
              radius={RADIUS_KM * 1000}
              fillColor="rgba(10, 132, 255, 0.1)"
              strokeColor="rgba(10, 132, 255, 0.3)"
              strokeWidth={2}
            />
          )}

          {/* Available order markers */}
          {availableOrders.map((order) => (
            <Marker
              key={order.id}
              coordinate={{
                latitude: order.deliveryLatitude,
                longitude: order.deliveryLongitude,
              }}
              title={order.customerName}
              description={`${order.itemsCount} items • ${getDistanceFromStore(order)} km`}
              pinColor={getDeliveryStatusColor(order.status)}
              onPress={() => setSelectedOrder(order)}
            />
          ))}

          {/* Active order route */}
          {activeOrder && (
            <Polyline
              coordinates={[
                { latitude: activeOrder.pickupLatitude, longitude: activeOrder.pickupLongitude },
                { latitude: activeOrder.deliveryLatitude, longitude: activeOrder.deliveryLongitude },
              ]}
              strokeColor={colors.accent}
              strokeWidth={3}
              lineDashPattern={[1]}
            />
          )}
        </MapView>

        {/* Radius info overlay */}
        <View style={[styles.radiusInfo, { backgroundColor: colors.card }]}>
          <Navigation size={16} color={colors.accent} />
          <Text style={[styles.radiusText, { color: colors.foreground }]}>
            {tr('Within', 'Dans un rayon de', 'ضمن')} {RADIUS_KM} km
          </Text>
          <Text style={[styles.orderCount, { color: colors.textMuted }]}>
            {availableOrders.length} {tr('orders', 'commandes', 'طلبات')}
          </Text>
        </View>
      </View>

      {/* Active Order Card */}
      {activeOrder && (
        <View style={[styles.activeOrderCard, { backgroundColor: colors.card }]}>
          <View style={styles.activeOrderHeader}>
            <Text style={[styles.activeOrderTitle, { color: colors.foreground }]}>
              {tr('Current Delivery', 'Livraison en cours', 'التوصيل الحالي')}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getDeliveryStatusColor(activeOrder.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getDeliveryStatusColor(activeOrder.status) }]}>
                {activeOrder.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.orderInfo}>
            <MapPin size={16} color={colors.textMuted} />
            <Text style={[styles.orderAddress, { color: colors.foreground }]} numberOfLines={1}>
              {activeOrder.deliveryAddress}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            {activeOrder.status === 'accepted' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                onPress={() => handleUpdateStatus('picked_up')}
              >
                <Package size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>{tr('Picked Up', 'Retiré', 'تم الاستلام')}</Text>
              </TouchableOpacity>
            )}
            {activeOrder.status === 'picked_up' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                onPress={() => handleUpdateStatus('in_transit')}
              >
                <Navigation size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>{tr('Start Delivery', 'Commencer', 'بدء التوصيل')}</Text>
              </TouchableOpacity>
            )}
            {activeOrder.status === 'in_transit' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.success }]}
                onPress={() => handleUpdateStatus('delivered')}
              >
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>{tr('Delivered', 'Livré', 'تم التوصيل')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Order List */}
      <ScrollView style={styles.orderList} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {tr('Available Orders', 'Commandes disponibles', 'الطلبات المتاحة')}
        </Text>
        
        {availableOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {tr('No orders nearby', 'Aucune commande à proximité', 'لا توجد طلبات قريبة')}
            </Text>
          </View>
        ) : (
          availableOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={[styles.orderCard, { backgroundColor: colors.card }]}
              onPress={() => setSelectedOrder(order)}
            >
              <View style={styles.orderCardHeader}>
                <View style={styles.orderCardInfo}>
                  <Text style={[styles.orderId, { color: colors.foreground }]}>
                    #{order.orderId.slice(0, 8).toUpperCase()}
                  </Text>
                  <Text style={[styles.orderDistance, { color: colors.textMuted }]}>
                    {getDistanceFromStore(order)} km
                  </Text>
                </View>
                <View style={[styles.itemsBadge, { backgroundColor: colors.accent + '20' }]}>
                  <Package size={12} color={colors.accent} />
                  <Text style={[styles.itemsCount, { color: colors.accent }]}>
                    {order.itemsCount}
                  </Text>
                </View>
              </View>

              <View style={styles.orderCardAddress}>
                <MapPin size={14} color={colors.textMuted} />
                <Text style={[styles.orderCardAddressText, { color: colors.foreground }]} numberOfLines={1}>
                  {order.deliveryAddress}
                </Text>
              </View>

              <View style={styles.orderCardFooter}>
                <View style={styles.orderCardTime}>
                  <Clock size={12} color={colors.textMuted} />
                  <Text style={[styles.orderCardTimeText, { color: colors.textMuted }]}>
                    {order.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={[styles.orderAmount, { color: colors.accent }]}>
                  {order.totalAmount.toFixed(2)} TND
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <View style={[styles.modalOverlay]}>
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={() => setSelectedOrder(null)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {tr('Order Details', 'Détails de commande', 'تفاصيل الطلب')}
              </Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <X size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalInfo}>
                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>
                  {tr('Customer', 'Client', 'العميل')}
                </Text>
                <Text style={[styles.modalValue, { color: colors.foreground }]}>
                  {selectedOrder.customerName}
                </Text>
              </View>

              <View style={styles.modalInfo}>
                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>
                  {tr('Address', 'Adresse', 'العنوان')}
                </Text>
                <Text style={[styles.modalValue, { color: colors.foreground }]}>
                  {selectedOrder.deliveryAddress}
                </Text>
              </View>

              <View style={styles.modalInfo}>
                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>
                  {tr('Items', 'Articles', 'المنتجات')}
                </Text>
                <Text style={[styles.modalValue, { color: colors.foreground }]}>
                  {selectedOrder.itemsCount}
                </Text>
              </View>

              <View style={styles.modalInfo}>
                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>
                  {tr('Total', 'Total', 'المجموع')}
                </Text>
                <Text style={[styles.modalValue, { color: colors.accent }]}>
                  {selectedOrder.totalAmount.toFixed(2)} TND
                </Text>
              </View>

              <View style={styles.modalInfo}>
                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>
                  {tr('Distance', 'Distance', 'المسافة')}
                </Text>
                <Text style={[styles.modalValue, { color: colors.foreground }]}>
                  {getDistanceFromStore(selectedOrder)} km
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.acceptBtn, { backgroundColor: colors.accent }]}
              onPress={() => handleAcceptOrder(selectedOrder)}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Check size={20} color="#FFFFFF" />
                  <Text style={styles.acceptBtnText}>
                    {tr('Accept Order', 'Accepter', 'قبول الطلب')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  mapContainer: {
    height: 250,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  storeMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  radiusInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radiusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderCount: {
    fontSize: 11,
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
    gap: 16,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  activeOrderCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  activeOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeOrderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  orderAddress: {
    flex: 1,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  orderList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  orderCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
  },
  orderDistance: {
    fontSize: 12,
  },
  itemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemsCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderCardAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  orderCardAddressText: {
    flex: 1,
    fontSize: 13,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCardTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderCardTimeText: {
    fontSize: 11,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    gap: 16,
    marginBottom: 20,
  },
  modalInfo: {
    gap: 4,
  },
  modalLabel: {
    fontSize: 12,
  },
  modalValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
