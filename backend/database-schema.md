// Payment System Database Schema
// Multi-vendor marketplace payment flow

// ============================================================================
// COLLECTION: orders
// ============================================================================
/*
{
  id: string,
  orderNumber: string, // Human-readable order number (e.g., "ORD-2024-001234")
  
  // Customer Info
  customerId: string,
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  deliveryLocation: GeoPoint, // { latitude, longitude }
  
  // Items
  items: [
    {
      productId: string,
      vendorId: string,
      name: string,
      quantity: number,
      price: number, // Unit price
      total: number, // price * quantity
      image: string
    }
  ],
  
  // Order Summary
  subtotal: number, // Sum of all items
  deliveryFee: number,
  platformDiscount: number,
  total: number, // subtotal + deliveryFee - discount
  
  // Vendor Split (calculated)
  vendorSplit: [
    {
      vendorId: string,
      vendorName: string,
      subtotal: number,
      commissionRate: number,
      commissionAmount: number,
      payoutAmount: number, // subtotal - commission
      status: 'pending' | 'paid' | 'hold'
    }
  ],
  
  // Payment Info
  paymentMethod: 'COD' | 'WALLET' | 'CARD',
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refund',
  paidAt: Timestamp,
  
  // Delivery Info
  deliveryStatus: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'returned',
  deliveryPersonId: string | null,
  deliveryPersonName: string | null,
  deliveryCompanyId: string | null,
  deliveryZone: string, // Zone ID for fee calculation
  deliveredAt: Timestamp | null,
  
  // COD Specific
  codAmount: number, // Amount to collect (total)
  codCollected: boolean,
  codDeposited: boolean,
  codDepositedAt: Timestamp | null,
  codDepositReference: string | null,
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'disputed'
}
*/

// ============================================================================
// COLLECTION: wallets
// ============================================================================
/*
{
  id: string,
  userId: string, // Can be vendor, delivery person, or admin
  userType: 'vendor' | 'delivery' | 'platform',
  
  // Balance
  availableBalance: number, // Can be withdrawn
  pendingBalance: number, // On hold (e.g., during delivery)
  totalEarned: number, // Lifetime earnings
  
  // Bank Account / Payment Info
  bankAccount: {
    name: string,
    accountNumber: string,
    rib: string,
    bankName: string
  } | null,
  
  // Settings
  autoPayout: boolean,
  payoutThreshold: number,
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
*/

// ============================================================================
// COLLECTION: transactions
// ============================================================================
/*
{
  id: string,
  type: 'order_payment' | 'vendor_payout' | 'delivery_payout' | 'refund' | 'commission' | 'deposit' | 'withdrawal',
  
  // Related IDs
  orderId: string | null,
  walletId: string | null,
  userId: string | null,
  
  // Amount Details
  amount: number,
  currency: 'TND',
  
  // For splits
  breakdown: {
    productAmount: number,
    deliveryFee: number,
    platformCommission: number,
    vendorPayout: number,
    deliveryPayout: number,
    refundAmount: number
  },
  
  // Status
  status: 'pending' | 'completed' | 'failed' | 'reversed',
  
  // Metadata
  paymentMethod: 'COD' | 'WALLET' | 'CARD',
  reference: string, // External reference (bank transfer, etc.)
  description: string,
  
  // Timestamps
  createdAt: Timestamp,
  processedAt: Timestamp | null
}
*/

// ============================================================================
// COLLECTION: delivery_zones
// ============================================================================
/*
{
  id: string,
  name: string, // e.g., "Tunis Centre", "Ariena", "Sfax"
  governorate: string, // e.g., "Tunis", "Sfax"
  
  // Fee Structure
  baseFee: number, // Base delivery fee (TND)
  perKmFee: number, // Additional fee per km
  freeDeliveryThreshold: number, // Free delivery above this amount
  maxDeliveryFee: number, // Cap on delivery fee
  
  // Zone Geometry
  center: GeoPoint,
  radius: number, // Zone radius in km
  
  // Timings
  estimatedDays: number, // Estimated delivery time in days
  
  // Active
  active: boolean,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
*/

// ============================================================================
// COLLECTION: delivery_persons
// ============================================================================
/*
{
  id: string,
  userId: string,
  name: string,
  phone: string,
  
  // Company Info
  companyId: string | null, // If employed by a company
  companyName: string | null,
  
  // Vehicle
  vehicleType: 'motorcycle' | 'car' | 'bicycle',
  vehiclePlate: string,
  
  // Status
  status: 'available' | 'busy' | 'offline',
  currentLocation: GeoPoint,
  
  // Earnings
  totalDeliveries: number,
  totalEarnings: number,
  rating: number, // Average rating
  
  // Wallet
  walletId: string,
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
*/

// ============================================================================
// COLLECTION: delivery_companies
// ============================================================================
/*
{
  id: string,
  name: string,
  phone: string,
  email: string,
  address: string,
  
  // Bank Info for receiving COD deposits
  bankAccount: {
    accountName: string,
    accountNumber: string,
    rib: string,
    bankName: string
  },
  
  // Wallet
  walletId: string,
  
  // Settings
  commissionRate: number, // Company's cut from delivery fees
  
  // Active
  active: boolean,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
*/

// ============================================================================
// COLLECTION: payouts
// ============================================================================
/*
{
  id: string,
  type: 'vendor' | 'delivery' | 'company',
  
  userId: string,
  walletId: string,
  
  amount: number,
  currency: 'TND',
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
  
  // Method
  method: 'bank_transfer' | 'cash' | 'wallet',
  reference: string | null, // Bank transfer reference
  
  // Timestamps
  requestedAt: Timestamp,
  processedAt: Timestamp | null,
  createdAt: Timestamp
}
*/

// ============================================================================
// COLLECTION: refunds
// ============================================================================
/*
{
  id: string,
  orderId: string,
  
  // Request Info
  requestedBy: 'customer' | 'vendor' | 'admin',
  reason: string,
  reasonType: 'damaged' | 'wrong_item' | 'not_received' | 'changed_mind' | 'other',
  
  // Amount
  amount: number,
  fullRefund: boolean, // true = full order, false = partial
  
  // Items (for partial refunds)
  items: [
    {
      productId: string,
      quantity: number,
      amount: number
    }
  ],
  
  // Status
  status: 'pending' | 'approved' | 'rejected' | 'processed',
  
  // Refund Method
  refundMethod: 'wallet' | 'bank_transfer' | 'cash',
  reference: string,
  
  // Admin Note
  adminNote: string,
  
  // Timestamps
  requestedAt: Timestamp,
  processedAt: Timestamp | null,
  createdAt: Timestamp
}
*/

// Payment Flow Summary:
// ====================
//
// CASH ON DELIVERY (COD):
// 1. Customer places order, selects COD
// 2. Order created with status "pending", paymentStatus "pending"
// 3. Delivery person picks up package
// 4. Delivery person delivers and collects cash from customer
// 5. Delivery person deposits cash to company account
// 6. System confirms COD deposit (admin or delivery person confirms)
// 7. Platform deducts commission
// 8. Vendor payout initiated
// 9. Delivery payout initiated (delivery fee to delivery person/company)
//
// DIGITAL WALLET:
// 1. Customer places order, pays via Vonder Wallet
// 2. Money goes to platform account
// 3. Order confirmed, paymentStatus "paid"
// 4. Delivery person picks up package
// 5. Delivered - confirmed
// 6. Platform deducts commission
// 7. Vendor payout initiated (after hold period)
// 8. Delivery payout initiated
