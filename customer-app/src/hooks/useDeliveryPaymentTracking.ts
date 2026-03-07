import { useState, useEffect, useCallback } from 'react';
import { 
  doc, 
  getDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../api/firebase';

// Types for payment and delivery tracking
export interface DeliveryZone {
  id: string;
  name: string;
  governorate: string;
  basePrice: number;
  pricePerKm: number;
  freeDistanceKm: number;
  freeDeliveryThreshold: number;
  estimatedDeliveryHours: number;
}

export interface DeliveryPerson {
  id: string;
  uid: string;
  fullName: string;
  phone: string;
  photoUrl?: string;
  vehicleType: string;
  rating: number;
  completedDeliveries: number;
  isOnline: boolean;
}

export interface WalletInfo {
  id: string;
  userId: string;
  userType: 'vendor' | 'delivery' | 'customer' | 'company';
  balance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalPayouts: number;
  lastUpdated: Date;
}

export interface TransactionInfo {
  id: string;
  orderId: string;
  type: 'payment' | 'payout' | 'refund' | 'commission' | 'delivery_fee' | 'cod_deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  paymentMethod?: 'wallet' | 'cod' | 'card' | 'cash';
  description: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface PayoutInfo {
  id: string;
  userId: string;
  userType: 'vendor' | 'delivery';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'bank_transfer' | 'wallet' | 'cash';
  createdAt: Date;
  processedAt?: Date;
  bankAccount?: string;
  phoneNumber?: string;
}

export interface PaymentStatus {
  hasPayment: boolean;
  paymentMethod: 'wallet' | 'cod' | 'card' | 'cash' | null;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded' | 'completed' | 'processing';
  amount: number;
  paidAmount: number;
  refundedAmount: number;
  transactionId?: string;
  codCollected?: boolean;
  codDeposited?: boolean;
  depositDate?: Date;
}

// Hook for fetching delivery zone information
export const useDeliveryZone = (zoneId: string | null) => {
  const [zone, setZone] = useState<DeliveryZone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!zoneId) {
      setZone(null);
      setLoading(false);
      return;
    }

    const fetchZone = async () => {
      try {
        const zoneDoc = await getDoc(doc(db, 'delivery_zones', zoneId));
        if (zoneDoc.exists()) {
          setZone({ id: zoneDoc.id, ...zoneDoc.data() } as DeliveryZone);
        } else {
          setError('Zone not found');
        }
      } catch (err) {
        setError('Failed to fetch zone');
      } finally {
        setLoading(false);
      }
    };

    fetchZone();
  }, [zoneId]);

  return { zone, loading, error };
};

// Hook for fetching delivery person information
export const useDeliveryPerson = (personId: string | null) => {
  const [person, setPerson] = useState<DeliveryPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!personId) {
      setPerson(null);
      setLoading(false);
      return;
    }

    // Try delivery_persons collection first, then drivers
    const fetchPerson = async () => {
      try {
        let personDoc = await getDoc(doc(db, 'delivery_persons', personId));
        if (!personDoc.exists()) {
          personDoc = await getDoc(doc(db, 'drivers', personId));
        }
        if (personDoc.exists()) {
          setPerson({ id: personDoc.id, ...personDoc.data() } as DeliveryPerson);
        } else {
          setError('Delivery person not found');
        }
      } catch (err) {
        setError('Failed to fetch delivery person');
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [personId]);

  return { person, loading, error };
};

// Hook for fetching wallet information
export const useWallet = (userId: string | null, userType?: 'vendor' | 'delivery' | 'customer' | 'company') => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setWallet(null);
      setLoading(false);
      return;
    }

    // Try to find wallet by userId and userType
    const fetchWallet = async () => {
      try {
        let q = query(collection(db, 'wallets'), where('userId', '==', userId));
        if (userType) {
          q = query(collection(db, 'wallets'), where('userId', '==', userId), where('userType', '==', userType));
        }
        
        const snapshot = await getDoc(doc(db, 'wallets', userId));
        if (snapshot.exists()) {
          const data = snapshot.data();
          setWallet({
            id: snapshot.id,
            ...data,
            lastUpdated: data.lastUpdated?.toDate() || new Date()
          } as WalletInfo);
        } else {
          // Try alternate approach with query
          const querySnapshot = await getDoc(doc(db, `wallets/${userId}`));
          if (querySnapshot.exists()) {
            setWallet({ id: querySnapshot.id, ...querySnapshot.data() } as WalletInfo);
          }
        }
      } catch (err) {
        // Wallet might not exist yet
        setError(null); // Not an error, just no wallet
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, [userId, userType]);

  return { wallet, loading, error };
};

// Hook for fetching order transactions
export const useOrderTransactions = (orderId: string | null) => {
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      where('orderId', '==', orderId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate()
        } as TransactionInfo;
      });
      setTransactions(txs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  return { transactions, loading };
};

// Hook for fetching payouts
export const useUserPayouts = (userId: string | null) => {
  const [payouts, setPayouts] = useState<PayoutInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setPayouts([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'payouts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pyt = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate()
        } as PayoutInfo;
      });
      setPayouts(pyt);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { payouts, loading };
};

// Hook for getting payment status for an order
export const usePaymentStatus = (orderId: string | null) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setPaymentStatus(null);
      setLoading(false);
      return;
    }

    const fetchPaymentStatus = async () => {
      try {
        // Get order document
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (!orderDoc.exists()) {
          setLoading(false);
          return;
        }

        const orderData = orderDoc.data();
        
        // Get related transactions
        const txQ = query(
          collection(db, 'transactions'),
          where('orderId', '==', orderId)
        );
        
        // For now, set basic payment status from order
        const status: PaymentStatus = {
          hasPayment: !!orderData?.paymentStatus || orderData?.paymentMethod === 'paid',
          paymentMethod: orderData?.paymentMethod || null,
          paymentStatus: orderData?.paymentStatus || 'pending',
          amount: orderData?.total || orderData?.amount || 0,
          paidAmount: orderData?.paidAmount || 0,
          refundedAmount: orderData?.refundedAmount || 0,
          codCollected: orderData?.codCollected || false,
          codDeposited: orderData?.codDeposited || false,
          depositDate: orderData?.codDepositDate?.toDate()
        };

        setPaymentStatus(status);
      } catch (err) {
        console.log('Error fetching payment status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [orderId]);

  return { paymentStatus, loading };
};

// Calculate delivery fee based on zone and distance
export const calculateDeliveryFee = (
  zone: DeliveryZone | null, 
  distanceKm: number,
  orderTotal?: number
): { fee: number; breakdown: { base: number; distance: number; discount: number } } => {
  if (!zone) {
    return { fee: 0, breakdown: { base: 0, distance: 0, discount: 0 } };
  }

  let base = zone.basePrice;
  let distanceFee = 0;
  let discount = 0;

  // Calculate distance fee if beyond free distance
  if (distanceKm > zone.freeDistanceKm) {
    distanceFee = (distanceKm - zone.freeDistanceKm) * zone.pricePerKm;
  }

  // Apply free delivery threshold discount
  if (orderTotal && orderTotal >= zone.freeDeliveryThreshold) {
    discount = base + distanceFee; // Free delivery
  }

  const totalFee = Math.max(0, base + distanceFee - discount);

  return {
    fee: totalFee,
    breakdown: { base, distance: distanceFee, discount }
  };
};

// Get estimated delivery time based on zone
export const getEstimatedDeliveryTime = (
  zone: DeliveryZone | null,
  status: string
): { hours: number; label: string } => {
  if (!zone) {
    return { hours: 24, label: '24h' };
  }

  // Adjust based on order status
  const baseHours = zone.estimatedDeliveryHours || 24;
  
  let label = `${baseHours}h`;
  if (baseHours < 1) {
    label = `${Math.round(baseHours * 60)}min`;
  }

  return { hours: baseHours, label };
};

// Get payment status color
export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
    case 'completed':
      return '#34C759'; // Green
    case 'pending':
    case 'processing':
      return '#FF9500'; // Orange
    case 'failed':
    case 'cancelled':
      return '#FF3B30'; // Red
    case 'refunded':
      return '#8E8E93'; // Gray
    case 'partially_refunded':
      return '#FF2D55'; // Pink
    default:
      return '#8E8E93'; // Gray
  }
};

// Get payment status label
export const getPaymentStatusLabel = (status: string, language: string = 'en'): string => {
  const labels: Record<string, Record<string, string>> = {
    en: {
      paid: 'Paid',
      pending: 'Pending',
      failed: 'Failed',
      refunded: 'Refunded',
      partially_refunded: 'Partially Refunded',
      processing: 'Processing',
      cancelled: 'Cancelled'
    },
    fr: {
      paid: 'Payé',
      pending: 'En attente',
      failed: 'Échoué',
      refunded: 'Remboursé',
      partially_refunded: 'Partiellement remboursé',
      processing: 'En cours',
      cancelled: 'Annulé'
    },
    ar: {
      paid: 'مدفوع',
      pending: 'في الانتظار',
      failed: 'فشل',
      refunded: 'مسترد',
      partially_refunded: 'مسترد جزئيا',
      processing: 'قيد المعالجة',
      cancelled: 'ملغى'
    }
  };

  return labels[language]?.[status] || labels.en[status] || status;
};
