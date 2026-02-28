// Delivery order status types
export type DeliveryStatus = 
  | 'pending'           // Order created, waiting for driver
  | 'accepted'          // Driver accepted the order
  | 'picked_up'         // Driver picked up the order
  | 'in_transit'        // Driver is on the way
  | 'delivered'         // Order delivered successfully
  | 'cancelled';        // Order cancelled

// Delivery order interface
export interface DeliveryOrder {
  id: string;
  orderId: string;           // Reference to original order
  customerId: string;
  customerName: string;
  customerPhone?: string;
  
  // Delivery address
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  
  // Pickup location (store location)
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  
  // Driver info (when assigned)
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  
  // Order status
  status: DeliveryStatus;
  
  // Timestamps
  createdAt: Date;
  acceptedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  
  // Order items summary
  itemsCount: number;
  totalAmount: number;
  
  // Route info
  estimatedDistance?: number;  // in kilometers
  estimatedDuration?: number;  // in minutes
}

// Driver location update
export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

// Location coordinates
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Map region
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Time window for delivery
export interface TimeWindow {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  price: number;
}

export const DEFAULT_TIME_WINDOWS: TimeWindow[] = [
  { id: 'morning', label: 'Morning (8AM-12PM)', startTime: '08:00', endTime: '12:00', price: 5 },
  { id: 'afternoon', label: 'Afternoon (12PM-5PM)', startTime: '12:00', endTime: '17:00', price: 3 },
  { id: 'evening', label: 'Evening (5PM-9PM)', startTime: '17:00', endTime: '21:00', price: 5 },
];

// Driver interface
export interface Driver {
  id: string;
  name: string;
  phone: string;
  photoUrl?: string;
  vehicleType?: string;
  rating?: number;
  isOnline?: boolean;
  currentLocation?: Coordinates;
}

// GeoPoint for Firestore
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

// Delivery batch for grouped deliveries
export interface DeliveryBatch {
  id: string;
  driverId: string;
  deliveries: string[];
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

// Export Delivery as an alias for DeliveryOrder for backward compatibility
export type Delivery = DeliveryOrder;

// QR Code data for delivery verification
export interface DeliveryQRCode {
  deliveryId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  deliveryAddress: string;
  pickupAddress: string;
  verificationCode: string;
  timestamp: Date;
}

// Proof of delivery
export interface ProofOfDelivery {
  deliveryId: string;
  photoUrl?: string;
  signatureData?: string;
  notes?: string;
  completedAt: Date;
  completedBy: string; // driver ID
  location?: Coordinates;
}

// Driver review by customer
export interface DriverReview {
  id: string;
  deliveryId: string;
  customerId: string;
  driverId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

// Driver performance metrics
export interface DriverPerformance {
  driverId: string;
  driverName: string;
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  averageRating: number;
  totalReviews: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  averageDeliveryTime: number; // in minutes
}

// Notification types
export type NotificationType = 
  | 'delivery_assigned'
  | 'driver_picked_up'
  | 'driver_in_transit'
  | 'delivery_completed'
  | 'delivery_cancelled'
  | 'driver_reminder'
  | 'performance_alert';

export interface DeliveryNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  deliveryId: string;
  recipientId: string;
  senderId?: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

// Delivery status colors
export const getDeliveryStatusColor = (status: DeliveryStatus): string => {
  switch (status) {
    case 'pending': return '#FF9500';    // Orange
    case 'accepted': return '#5856D6';   // Purple
    case 'picked_up': return '#007AFF';  // Blue
    case 'in_transit': return '#FF2D55'; // Pink/Red
    case 'delivered': return '#34C759';  // Green
    case 'cancelled': return '#FF3B30';  // Red
    default: return '#8E8E93';          // Gray
  }
};

// Delivery status labels (multilingual)
export const getDeliveryStatusLabel = (status: DeliveryStatus, language: string = 'en'): string => {
  const labels: Record<string, Record<DeliveryStatus, string>> = {
    en: {
      pending: 'Waiting for Driver',
      accepted: 'Driver Assigned',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    },
    fr: {
      pending: 'En attente',
      accepted: 'Chauffeur assigné',
      picked_up: 'Retiré',
      in_transit: 'En livraison',
      delivered: 'Livré',
      cancelled: 'Annulé',
    },
    ar: {
      pending: 'في الانتظار',
      accepted: 'السائق تم',
      picked_up: 'تم الاستلام',
      in_transit: 'في الطريق',
      delivered: 'تم التوصيل',
      cancelled: 'ملغى',
    },
  };
  
  return labels[language]?.[status] || labels.en[status];
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

// Check if a location is within radius (in km)
export const isWithinRadius = (
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusKm;
};
