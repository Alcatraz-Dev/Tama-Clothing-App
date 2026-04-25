// Payment Processing Service
// Multi-vendor marketplace payment flow

const admin = require('firebase-admin');

// Initialize Firestore
let db = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
  } else {
    const serviceAccount = require('./serviceAccountKey.json');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
  }
  db = admin.firestore();
} catch (error) {
  console.error('Firebase Admin initialization error:', error.message);
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIAL_REFUND: 'partial_refund'
};

const DELIVERY_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  RETURNED: 'returned'
};

const TRANSACTION_TYPE = {
  ORDER_PAYMENT: 'order_payment',
  VENDOR_PAYOUT: 'vendor_payout',
  DELIVERY_PAYOUT: 'delivery_payout',
  REFUND: 'refund',
  COMMISSION: 'commission',
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal'
};

const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed'
};

// ============================================================================
// DELIVERY FEE CALCULATOR
// ============================================================================

/**
 * Calculate delivery fee based on zone and order amount
 * @param {string} zoneId - Delivery zone ID
 * @param {number} orderAmount - Order subtotal
 * @param {Object} customerLocation - { latitude, longitude }
 * @param {Object} vendorLocation - { latitude, longitude }
 * @returns {Object} - { deliveryFee, freeDelivery, distance }
 */
async function calculateDeliveryFee(zoneId, orderAmount, customerLocation, vendorLocation) {
  try {
    const zoneDoc = await db.collection('delivery_zones').doc(zoneId).get();
    
    if (!zoneDoc.exists) {
      // Default zone fee if zone not found
      return {
        deliveryFee: 8, // Default 8 TND
        freeDelivery: false,
        distance: 0
      };
    }
    
    const zone = zoneDoc.data();
    
    // Calculate distance (simple approximation)
    let distance = 0;
    if (customerLocation && vendorLocation) {
      distance = calculateDistance(
        customerLocation.latitude,
        customerLocation.longitude,
        vendorLocation.latitude,
        vendorLocation.longitude
      );
    }
    
    // Calculate fee
    let deliveryFee = zone.baseFee || 5;
    
    // Add per-km fee if applicable
    if (zone.perKmFee && distance > 5) {
      deliveryFee += (distance - 5) * zone.perKmFee;
    }
    
    // Cap at max fee
    if (zone.maxDeliveryFee && deliveryFee > zone.maxDeliveryFee) {
      deliveryFee = zone.maxDeliveryFee;
    }
    
    // Free delivery check
    const freeDelivery = zone.freeDeliveryThreshold && 
                        orderAmount >= zone.freeDeliveryThreshold;
    
    return {
      deliveryFee: freeDelivery ? 0 : Math.round(deliveryFee * 100) / 100,
      freeDelivery,
      distance: Math.round(distance * 10) / 10,
      zoneName: zone.name
    };
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    return {
      deliveryFee: 8, // Default fallback
      freeDelivery: false,
      distance: 0
    };
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// ============================================================================
// PAYMENT PROCESSING
// ============================================================================

/**
 * Process an order payment
 * @param {string} orderId - Order ID
 * @param {Object} paymentData - { paymentMethod, amount, ... }
 */
async function processOrderPayment(orderId, paymentData) {
  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  
  if (!orderDoc.exists) {
    throw new Error('Order not found');
  }
  
  const order = orderDoc.data();
  
  // Calculate vendor splits
  const vendorSplits = await calculateVendorSplits(order.items, order.paymentMethod);
  
  // Update order with payment info
  await orderRef.update({
    paymentMethod: paymentData.paymentMethod,
    paymentStatus: PAYMENT_STATUS.PAID,
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
    vendorSplit: vendorSplits,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Create payment transaction
  await createTransaction({
    type: TRANSACTION_TYPE.ORDER_PAYMENT,
    orderId,
    amount: order.total,
    paymentMethod: paymentData.paymentMethod,
    breakdown: {
      productAmount: order.subtotal,
      deliveryFee: order.deliveryFee,
      platformCommission: vendorSplits.reduce((sum, v) => sum + v.commissionAmount, 0),
      vendorPayout: vendorSplits.reduce((sum, v) => sum + v.payoutAmount, 0),
      deliveryPayout: order.deliveryFee
    },
    description: `Payment for order ${order.orderNumber}`
  });
  
  return { success: true, vendorSplits };
}

/**
 * Calculate vendor commission and payout amounts
 */
async function calculateVendorSplits(items, paymentMethod) {
  const vendorMap = new Map();
  
  // Group items by vendor
  for (const item of items) {
    if (!vendorMap.has(item.vendorId)) {
      vendorMap.set(item.vendorId, {
        vendorId: item.vendorId,
        vendorName: item.vendorName || 'Unknown Vendor',
        subtotal: 0,
        items: []
      });
    }
    const vendorData = vendorMap.get(item.vendorId);
    vendorData.subtotal += item.total;
    vendorData.items.push(item);
  }
  
  // Get commission rates for each vendor
  const splits = [];
  for (const [vendorId, vendorData] of vendorMap) {
    const commissionRate = await getVendorCommissionRate(vendorId);
    
    // COD orders may have different hold logic
    const holdAmount = paymentMethod === 'COD' ? vendorData.subtotal * 0.5 : 0;
    
    const commissionAmount = vendorData.subtotal * (commissionRate / 100);
    const payoutAmount = vendorData.subtotal - commissionAmount;
    
    splits.push({
      vendorId,
      vendorName: vendorData.vendorName,
      subtotal: vendorData.subtotal,
      commissionRate,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      payoutAmount: Math.round(payoutAmount * 100) / 100,
      holdAmount: Math.round(holdAmount * 100) / 100,
      status: 'pending'
    });
  }
  
  return splits;
}

/**
 * Get vendor's commission rate based on their subscription tier
 */
async function getVendorCommissionRate(vendorId) {
  try {
    // Get vendor application/document to find their tier
    const vendorSnap = await db.collection('vendorApplications')
      .where('userId', '==', vendorId)
      .limit(1)
      .get();
    
    if (vendorSnap.empty) {
      return 15; // Default commission rate
    }
    
    const vendorData = vendorSnap.docs[0].data();
    const tier = vendorData.tier;
    
    // Commission rates by tier (from planAccessControl)
    const tierCommissions = {
      starter: 15,
      basic: 10,
      professional: 8,
      premium: 5,
      enterprise: 3,
      ultimate: 0
    };
    
    return tierCommissions[tier] || 15;
  } catch (error) {
    console.error('Error getting vendor commission rate:', error);
    return 15;
  }
}

// ============================================================================
// COD DEPOSIT PROCESSING
// ============================================================================

/**
 * Process COD deposit by delivery person/company
 */
async function processCODDeposit(orderId, depositData) {
  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  
  if (!orderDoc.exists) {
    throw new Error('Order not found');
  }
  
  const order = orderDoc.data();
  
  if (order.paymentMethod !== 'COD') {
    throw new Error('This is not a COD order');
  }
  
  if (order.codCollected) {
    throw new Error('COD already collected for this order');
  }
  
  // Update order with COD deposit info
  await orderRef.update({
    codCollected: true,
    codDeposited: true,
    codDepositedAt: admin.firestore.FieldValue.serverTimestamp(),
    codDepositReference: depositData.reference,
    paymentStatus: PAYMENT_STATUS.PAID,
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Process vendor payouts now that COD is deposited
  await processVendorPayouts(orderId);
  
  // Process delivery payout
  await processDeliveryPayout(orderId);
  
  return { success: true, message: 'COD deposit processed successfully' };
}

// ============================================================================
// PAYOUT PROCESSING
// ============================================================================

/**
 * Process vendor payouts for an order
 */
async function processVendorPayouts(orderId) {
  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  const order = orderDoc.data();
  
  if (!order.vendorSplit) {
    return { success: false, message: 'No vendor splits found' };
  }
  
  for (const split of order.vendorSplit) {
    if (split.status === 'pending') {
      // Get or create vendor wallet
      let wallet = await getOrCreateWallet(split.vendorId, 'vendor');
      
      // Update wallet balance
      const walletRef = db.collection('wallets').doc(wallet.id);
      await walletRef.update({
        availableBalance: admin.firestore.FieldValue.increment(split.payoutAmount),
        totalEarned: admin.firestore.FieldValue.increment(split.payoutAmount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Create payout transaction
      await createTransaction({
        type: TRANSACTION_TYPE.VENDOR_PAYOUT,
        orderId,
        walletId: wallet.id,
        userId: split.vendorId,
        amount: split.payoutAmount,
        paymentMethod: order.paymentMethod,
        breakdown: {
          productAmount: split.subtotal,
          platformCommission: split.commissionAmount,
          vendorPayout: split.payoutAmount
        },
        description: `Payout for order ${order.orderNumber} - ${split.vendorName}`
      });
      
      // Update split status
      split.status = 'paid';
    }
  }
  
  // Update order vendor splits
  await orderRef.update({
    vendorSplit: order.vendorSplit,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true };
}

/**
 * Process delivery person/company payout
 */
async function processDeliveryPayout(orderId) {
  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  const order = orderDoc.data();
  
  if (!order.deliveryFee || order.deliveryFee <= 0) {
    return { success: false, message: 'No delivery fee to payout' };
  }
  
  let deliveryWallet;
  
  if (order.deliveryPersonId) {
    // Payout to individual delivery person
    deliveryWallet = await getOrCreateWallet(order.deliveryPersonId, 'delivery');
  } else if (order.deliveryCompanyId) {
    // Payout to delivery company
    deliveryWallet = await getOrCreateWallet(order.deliveryCompanyId, 'company');
  } else {
    // Default to platform delivery wallet
    deliveryWallet = await getOrCreateWallet('platform_delivery', 'platform');
  }
  
  // Update wallet
  const walletRef = db.collection('wallets').doc(deliveryWallet.id);
  await walletRef.update({
    availableBalance: admin.firestore.FieldValue.increment(order.deliveryFee),
    totalEarned: admin.firestore.FieldValue.increment(order.deliveryFee),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Create transaction
  await createTransaction({
    type: TRANSACTION_TYPE.DELIVERY_PAYOUT,
    orderId,
    walletId: deliveryWallet.id,
    userId: order.deliveryPersonId || order.deliveryCompanyId,
    amount: order.deliveryFee,
    paymentMethod: order.paymentMethod,
    breakdown: {
      deliveryPayout: order.deliveryFee
    },
    description: `Delivery payout for order ${order.orderNumber}`
  });
  
  return { success: true };
}

/**
 * Get or create a wallet for a user
 */
async function getOrCreateWallet(userId, userType) {
  const walletsSnap = await db.collection('wallets')
    .where('userId', '==', userId)
    .limit(1)
    .get();
  
  if (!walletsSnap.empty) {
    return walletsSnap.docs[0].data();
  }
  
  // Create new wallet
  const walletRef = await db.collection('wallets').add({
    userId,
    userType,
    availableBalance: 0,
    pendingBalance: 0,
    totalEarned: 0,
    bankAccount: null,
    autoPayout: false,
    payoutThreshold: 50,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { id: walletRef.id, userId, userType };
}

// ============================================================================
// TRANSACTION MANAGEMENT
// ============================================================================

/**
 * Create a transaction record
 */
async function createTransaction(transactionData) {
  const transactionRef = await db.collection('transactions').add({
    ...transactionData,
    status: 'completed',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    processedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { id: transactionRef.id, ...transactionData };
}

/**
 * Get transaction history for a user
 */
async function getTransactionHistory(userId, options = {}) {
  const { limit = 50, type, startDate, endDate } = options;
  
  let query = db.collection('transactions')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit);
  
  if (type) {
    query = query.where('type', '==', type);
  }
  
  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// ============================================================================
// REFUND PROCESSING
// ============================================================================

/**
 * Process a refund
 */
async function processRefund(orderId, refundData) {
  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  const order = orderDoc.data();
  
  // Calculate refund amount
  let refundAmount = 0;
  if (refundData.fullRefund) {
    refundAmount = order.total;
  } else {
    // Partial refund - calculate from items
    for (const item of refundData.items) {
      const orderItem = order.items.find(i => i.productId === item.productId);
      if (orderItem) {
        refundAmount += orderItem.price * item.quantity;
      }
    }
  }
  
  // Process refund based on original payment method
  if (order.paymentMethod === 'WALLET') {
    // Refund to customer's wallet
    await refundToWallet(order.customerId, refundAmount);
  } else if (order.paymentMethod === 'COD') {
    // COD refunds need manual handling
    // Create pending refund request
    await db.collection('refunds').add({
      orderId,
      amount: refundAmount,
      fullRefund: refundData.fullRefund,
      items: refundData.items || [],
      reason: refundData.reason,
      reasonType: refundData.reasonType,
      requestedBy: 'customer',
      status: 'pending',
      refundMethod: 'bank_transfer', // Default
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  // Update order
  const newPaymentStatus = refundAmount >= order.total 
    ? PAYMENT_STATUS.REFUNDED 
    : PAYMENT_STATUS.PARTIAL_REFUND;
  
  await orderRef.update({
    paymentStatus: newPaymentStatus,
    status: refundData.fullRefund ? ORDER_STATUS.CANCELLED : order.status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Reverse vendor payouts if already paid
  if (order.vendorSplit) {
    for (const split of order.vendorSplit) {
      if (split.status === 'paid') {
        // Reverse the payout
        await reverseVendorPayout(orderId, split);
      }
    }
  }
  
  // Create refund transaction
  await createTransaction({
    type: TRANSACTION_TYPE.REFUND,
    orderId,
    amount: -refundAmount, // Negative for refund
    breakdown: {
      refundAmount
    },
    description: `Refund for order ${order.orderNumber}`
  });
  
  return { success: true, refundAmount };
}

/**
 * Refund to wallet
 */
async function refundToWallet(userId, amount) {
  const wallet = await getOrCreateWallet(userId, 'customer');
  
  const walletRef = db.collection('wallets').doc(wallet.id);
  await walletRef.update({
    availableBalance: admin.firestore.FieldValue.increment(amount),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Reverse a vendor payout
 */
async function reverseVendorPayout(orderId, split) {
  const walletSnap = await db.collection('wallets')
    .where('userId', '==', split.vendorId)
    .limit(1)
    .get();
  
  if (!walletSnap.empty) {
    const walletRef = db.collection('wallets').doc(walletSnap.docs[0].id);
    await walletRef.update({
      availableBalance: admin.firestore.FieldValue.increment(-split.payoutAmount),
      totalEarned: admin.firestore.FieldValue.increment(-split.payoutAmount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  // Create reversal transaction
  await createTransaction({
    type: TRANSACTION_TYPE.VENDOR_PAYOUT,
    orderId,
    amount: -split.payoutAmount,
    status: 'reversed',
    description: `Reversal for order ${orderId}`
  });
}

// ============================================================================
/**
 * Recharge a customer's wallet with coins
 * @param {string} userId - User ID
 * @param {Object} pack - { coins, bonus, price, priceDisplay }
 * @param {string} paymentId - Flouci payment ID
 * @returns {Promise<Object>} - { success: true }
 */
async function rechargeUserWallet(userId, pack, paymentId) {
  try {
    const userRef = db.collection('users').doc(userId);
    
    // Use a transaction to ensure atomicity
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error('User not found');
      
      const currentWallet = userDoc.data().wallet || { coins: 0, diamonds: 0 };
      const totalNewCoins = (pack.coins || 0) + (pack.bonus || 0);
      
      // Update user wallet
      t.update(userRef, {
        'wallet.coins': admin.firestore.FieldValue.increment(totalNewCoins)
      });
      
      // Record transaction
      const txRef = userRef.collection('transactions').doc();
      t.set(txRef, {
        type: 'recharge',
        amountCoins: totalNewCoins,
        currency: 'coins',
        price: pack.price,
        priceDisplay: pack.priceDisplay,
        description: `Coin Pack Purchase via Flouci (${pack.coins} + ${pack.bonus} Bonus)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed',
        paymentId: paymentId
      });
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error recharging user wallet:', error);
    throw error;
  }
}

// WALLET OPERATIONS
// ============================================================================

/**
 * Request payout from wallet
 */
async function requestPayout(userId, amount, payoutMethod) {
  const walletSnap = await db.collection('wallets')
    .where('userId', '==', userId)
    .limit(1)
    .get();
  
  if (walletSnap.empty) {
    throw new Error('Wallet not found');
  }
  
  const wallet = walletSnap.docs[0];
  const walletData = wallet.data();
  
  if (walletData.availableBalance < amount) {
    throw new Error('Insufficient balance');
  }
  
  // Create payout request
  const payoutRef = await db.collection('payouts').add({
    userId,
    walletId: wallet.id,
    amount,
    currency: 'TND',
    method: payoutMethod,
    status: 'pending',
    requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Deduct from available balance
  await wallet.ref.update({
    availableBalance: admin.firestore.FieldValue.increment(-amount),
    pendingBalance: admin.firestore.FieldValue.increment(amount),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true, payoutId: payoutRef.id };
}

/**
 * Get wallet balance
 */
async function getWalletBalance(userId) {
  const walletSnap = await db.collection('wallets')
    .where('userId', '==', userId)
    .limit(1)
    .get();
  
  if (walletSnap.empty) {
    return {
      availableBalance: 0,
      pendingBalance: 0,
      totalEarned: 0
    };
  }
  
  return walletSnap.docs[0].data();
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Core functions
  calculateDeliveryFee,
  processOrderPayment,
  processCODDeposit,
  processRefund,
  
  // Payouts
  processVendorPayouts,
  processDeliveryPayout,
  requestPayout,
  
  // Wallet
  getWalletBalance,
  getTransactionHistory,
  rechargeUserWallet,
  
  // Constants
  PAYMENT_STATUS,
  DELIVERY_STATUS,
  TRANSACTION_TYPE,
  ORDER_STATUS
};
