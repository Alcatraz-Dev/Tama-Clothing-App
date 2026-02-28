import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../api/firebase';
import {
  DeliveryOrder,
  DeliveryStatus,
  Coordinates,
  DeliveryQRCode,
  ProofOfDelivery,
  DriverReview,
  DriverPerformance,
  DeliveryNotification,
  GeoPoint,
  Driver
} from '../types/delivery';
import { rtdb } from '../api/firebase';
import { ref, set, onValue, off } from 'firebase/database';

// Generate a unique verification code
const generateVerificationCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Collection reference
const deliveriesCollection = collection(db, 'deliveries');

// Create a new delivery record
export const createDelivery = async (orderData: {
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  itemsCount: number;
  totalAmount: number;
}): Promise<string> => {
  const deliveryData = {
    ...orderData,
    status: 'pending' as DeliveryStatus,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(deliveriesCollection, deliveryData);
  return docRef.id;
};

// Get delivery by ID
export const getDelivery = async (deliveryId: string): Promise<DeliveryOrder | null> => {
  const docRef = doc(db, 'deliveries', deliveryId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      acceptedAt: data.acceptedAt?.toDate(),
      pickedUpAt: data.pickedUpAt?.toDate(),
      deliveredAt: data.deliveredAt?.toDate(),
      cancelledAt: data.cancelledAt?.toDate(),
    } as DeliveryOrder;
  }

  return null;
};

// Get delivery by order ID
export const getDeliveryByOrderId = async (orderId: string): Promise<DeliveryOrder | null> => {
  const q = query(deliveriesCollection, where('orderId', '==', orderId));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      acceptedAt: data.acceptedAt?.toDate(),
      pickedUpAt: data.pickedUpAt?.toDate(),
      deliveredAt: data.deliveredAt?.toDate(),
      cancelledAt: data.cancelledAt?.toDate(),
    } as DeliveryOrder;
  }

  return null;
};

// Get deliveries for a customer
export const getCustomerDeliveries = (customerId: string, callback: (deliveries: DeliveryOrder[]) => void) => {
  const q = query(
    deliveriesCollection,
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const deliveries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        acceptedAt: data.acceptedAt?.toDate(),
        pickedUpAt: data.pickedUpAt?.toDate(),
        deliveredAt: data.deliveredAt?.toDate(),
        cancelledAt: data.cancelledAt?.toDate(),
      } as DeliveryOrder;
    });
    callback(deliveries);
  });
};

// Get deliveries for a driver
export const getDriverDeliveries = (driverId: string, callback: (deliveries: DeliveryOrder[]) => void) => {
  const q = query(
    deliveriesCollection,
    where('driverId', '==', driverId),
    orderBy('acceptedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const deliveries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        acceptedAt: data.acceptedAt?.toDate(),
        pickedUpAt: data.pickedUpAt?.toDate(),
        deliveredAt: data.deliveredAt?.toDate(),
        cancelledAt: data.cancelledAt?.toDate(),
      } as DeliveryOrder;
    });
    callback(deliveries);
  });
};

// Get active deliveries for a driver (accepted, picked_up, in_transit)
export const getDriverActiveDeliveries = (driverId: string, callback: (deliveries: DeliveryOrder[]) => void) => {
  const q = query(
    deliveriesCollection,
    where('driverId', '==', driverId),
    where('status', 'in', ['accepted', 'picked_up', 'in_transit'])
  );

  return onSnapshot(q, (snapshot) => {
    const deliveries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        acceptedAt: data.acceptedAt?.toDate(),
        pickedUpAt: data.pickedUpAt?.toDate(),
        deliveredAt: data.deliveredAt?.toDate(),
        cancelledAt: data.cancelledAt?.toDate(),
      } as DeliveryOrder;
    });
    callback(deliveries);
  });
};

// Get pending deliveries (for drivers to accept)
export const getPendingDeliveries = (callback: (deliveries: DeliveryOrder[]) => void) => {
  const q = query(
    deliveriesCollection,
    where('status', '==', 'pending'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const deliveries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as DeliveryOrder;
    });
    callback(deliveries);
  });
};

// Accept a delivery (driver accepts order)
export const acceptDelivery = async (
  deliveryId: string,
  driverId: string,
  driverName: string,
  driverPhone?: string
): Promise<void> => {
  const docRef = doc(db, 'deliveries', deliveryId);
  await updateDoc(docRef, {
    status: 'accepted',
    driverId,
    driverName,
    driverPhone: driverPhone || '',
    acceptedAt: serverTimestamp(),
  });
};

// Update delivery status
export const updateDeliveryStatus = async (
  deliveryId: string,
  status: DeliveryStatus
): Promise<void> => {
  const docRef = doc(db, 'deliveries', deliveryId);
  const updateData: any = { status };

  switch (status) {
    case 'picked_up':
      updateData.pickedUpAt = serverTimestamp();
      break;
    case 'in_transit':
      updateData.inTransitAt = serverTimestamp();
      break;
    case 'delivered':
      updateData.deliveredAt = serverTimestamp();
      break;
    case 'cancelled':
      updateData.cancelledAt = serverTimestamp();
      break;
  }

  await updateDoc(docRef, updateData);
};

// Update driver location in both Firestore and RTDB
export const updateDriverLocation = async (
  deliveryId: string,
  location: Coordinates,
  driverId: string
): Promise<void> => {
  // Update Firestore for persistence
  const docRef = doc(db, 'deliveries', deliveryId);
  await updateDoc(docRef, {
    driverLocation: {
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: serverTimestamp(),
    },
  });

  // Update RTDB for real-time tracking efficiency
  if (driverId) {
    const trackingRef = ref(rtdb, `tracking/${deliveryId}/location`);
    await set(trackingRef, {
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: Date.now(),
    });

    // Also update driver's global location
    const driverRef = ref(rtdb, `drivers/${driverId}/location`);
    await set(driverRef, {
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: Date.now(),
    });
  }
};

// Subscribe to driver location from RTDB
export const subscribeToDriverLocation = (
  deliveryId: string,
  callback: (location: GeoPoint) => void
) => {
  const trackingRef = ref(rtdb, `tracking/${deliveryId}/location`);
  const unsub = onValue(trackingRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
  return () => off(trackingRef, 'value', unsub);
};

// Rate a delivery
export const rateDelivery = async (
  deliveryId: string,
  rating: number,
  comment?: string
): Promise<void> => {
  const docRef = doc(db, 'deliveries', deliveryId);
  await updateDoc(docRef, {
    rating,
    comment,
    ratedAt: serverTimestamp(),
  });
};

// Initialize driver profile
export const initializeDriver = async (driverData: Partial<Driver> & { uid: string }): Promise<string> => {
  const driversCollection = collection(db, 'Drivers');
  const docRef = await addDoc(driversCollection, {
    ...driverData,
    status: 'offline',
    metrics: {
      completedDeliveries: 0,
      averageRating: 5.0,
      onTimeRate: 100,
      weeklyDeliveries: 0,
      monthlyDeliveries: 0,
      totalEarnings: 0,
      totalDistanceKm: 0
    },
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Update driver status and location
export const updateDriverStatus = async (
  driverId: string,
  status: 'online' | 'offline' | 'busy',
  location?: GeoPoint
): Promise<void> => {
  const driverDocRef = doc(db, 'Drivers', driverId);
  const updateData: any = { status, updatedAt: serverTimestamp() };

  if (location) {
    updateData.currentLocation = location;
    // Also update RTDB for real-time driver availability on map (admin)
    const driverTrackRef = ref(rtdb, `available_drivers/${driverId}`);
    if (status === 'online') {
      await set(driverTrackRef, {
        ...location,
        status,
        timestamp: Date.now()
      });
    } else {
      await set(driverTrackRef, null);
    }
  }

  await updateDoc(driverDocRef, updateData);
};

// Delete a delivery (soft delete or remove from customer view)
export const deleteDelivery = async (deliveryId: string): Promise<void> => {
  // For production, we might want to just flag it as hidden
  const docRef = doc(db, 'deliveries', deliveryId);
  await updateDoc(docRef, {
    deletedForCustomer: true,
    deletedAt: serverTimestamp()
  });
};

// Cancel delivery
export const cancelDelivery = async (deliveryId: string): Promise<void> => {
  const docRef = doc(db, 'deliveries', deliveryId);
  await updateDoc(docRef, {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
  });
};

// Export a service object for backward compatibility
export const deliveryService = {
  createDelivery,
  getDelivery,
  getDeliveryByOrderId,
  getCustomerDeliveries,
  getDriverDeliveries,
  getDriverActiveDeliveries,
  getPendingDeliveries: (callback: (deliveries: DeliveryOrder[]) => void) => getPendingDeliveries(callback),
  subscribeToPendingDeliveries: (area: string, callback: (deliveries: DeliveryOrder[]) => void) => {
    // Current simple implementation ignores area, but in a real app would filter by area
    return getPendingDeliveries(callback);
  },
  acceptDelivery,
  updateDeliveryStatus,
  updateDriverLocation,
  subscribeToDriverLocation,
  cancelDelivery,
  rateDelivery,
  initializeDriver,
  updateDriverStatus,
  deleteDelivery,
  startDelivery: async (driverId: string, deliveryId: string) => updateDeliveryStatus(deliveryId, 'in_transit'),
  subscribeToDriverDeliveries: getDriverDeliveries,
};
