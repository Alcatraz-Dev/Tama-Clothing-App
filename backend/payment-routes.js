// Payment API Routes
// Multi-vendor marketplace payment endpoints

const express = require('express');
const router = express.Router();
const paymentService = require('./payment-service');

// ============================================================================
// DELIVERY FEE
// ============================================================================

/**
 * POST /api/payment/calculate-delivery-fee
 * Calculate delivery fee for an order
 */
router.post('/calculate-delivery-fee', async (req, res) => {
  try {
    const { zoneId, orderAmount, customerLocation, vendorLocation } = req.body;
    
    if (!zoneId || !orderAmount) {
      return res.status(400).json({ error: 'Missing required fields: zoneId, orderAmount' });
    }
    
    const result = await paymentService.calculateDeliveryFee(
      zoneId, 
      orderAmount, 
      customerLocation, 
      vendorLocation
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ORDER PAYMENT
// ============================================================================

/**
 * POST /api/payment/process-order
 * Process payment for an order
 */
router.post('/process-order', async (req, res) => {
  try {
    const { orderId, paymentMethod, amount } = req.body;
    
    if (!orderId || !paymentMethod || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await paymentService.processOrderPayment(orderId, {
      paymentMethod,
      amount
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error processing order payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// COD DEPOSIT
// ============================================================================

/**
 * POST /api/payment/cod-deposit
 * Process COD deposit
 */
router.post('/cod-deposit', async (req, res) => {
  try {
    const { orderId, reference, depositedBy } = req.body;
    
    if (!orderId || !reference) {
      return res.status(400).json({ error: 'Missing required fields: orderId, reference' });
    }
    
    const result = await paymentService.processCODDeposit(orderId, {
      reference,
      depositedBy
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error processing COD deposit:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// WALLET
// ============================================================================

/**
 * GET /api/payment/wallet/:userId
 * Get wallet balance for a user
 */
router.get('/wallet/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const balance = await paymentService.getWalletBalance(userId);
    
    res.json(balance);
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payment/wallet/request-payout
 * Request a payout from wallet
 */
router.post('/wallet/request-payout', async (req, res) => {
  try {
    const { userId, amount, method } = req.body;
    
    if (!userId || !amount || !method) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    const result = await paymentService.requestPayout(userId, amount, method);
    
    res.json(result);
  } catch (error) {
    console.error('Error requesting payout:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payment/transactions/:userId
 * Get transaction history for a user
 */
router.get('/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, type, startDate, endDate } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : 50,
      type,
      startDate,
      endDate
    };
    
    const transactions = await paymentService.getTransactionHistory(userId, options);
    
    res.json(transactions);
  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// REFUNDS
// ============================================================================

/**
 * POST /api/payment/refund
 * Process a refund
 */
router.post('/refund', async (req, res) => {
  try {
    const { orderId, fullRefund, items, reason, reasonType } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Missing required field: orderId' });
    }
    
    const result = await paymentService.processRefund(orderId, {
      fullRefund: fullRefund !== false,
      items: items || [],
      reason: reason || 'Customer requested refund',
      reasonType: reasonType || 'other'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ORDER STATUS
// ============================================================================

/**
 * POST /api/payment/update-delivery-status
 * Update delivery status and trigger payouts
 */
router.post('/update-delivery-status', async (req, res) => {
  try {
    const { orderId, status, deliveryPersonId, deliveryPersonName } = req.body;
    
    if (!orderId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Update order delivery status
    // This would typically be handled by a database update
    // For now, return success
    
    // If delivered, process vendor and delivery payouts
    if (status === 'delivered') {
      // Vendor payouts are handled when COD is deposited or immediately for wallet
      // Delivery payouts can be processed here
      await paymentService.processDeliveryPayout(orderId);
    }
    
    res.json({ 
      success: true, 
      message: `Delivery status updated to ${status}` 
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// VENDOR COMMISSIONS
// ============================================================================

/**
 * GET /api/payment/vendor-commission/:vendorId
 * Get commission rate for a vendor
 */
router.get('/vendor-commission/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const commissionRate = await paymentService.getVendorCommissionRate(vendorId);
    
    res.json({ vendorId, commissionRate });
  } catch (error) {
    console.error('Error getting vendor commission:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
