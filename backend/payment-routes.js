// Payment API Routes
// Multi-vendor marketplace payment endpoints

const express = require('express');
const router = express.Router();
const paymentService = require('./payment-service');
const stripeService = require('./stripe-service');
const cryptoService = require('./crypto-service');

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
// STRIPE PAYMENTS
// ============================================================================

/**
 * POST /api/payment/stripe/create-intent
 * Create a Stripe PaymentIntent for a coin pack purchase
 * Body: { amount, currency, userId, pack }
 */
router.post('/stripe/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', userId, pack } = req.body;
    if (!amount || !userId || !pack) {
      return res.status(400).json({ error: 'Missing required fields: amount, userId, pack' });
    }

    let finalAmount = amount;
    let finalCurrency = currency.toLowerCase();

    // Convert TND to EUR for Stripe processing
    if (finalCurrency === 'tnd') {
      finalAmount = amount / 3.4;
      finalCurrency = 'eur';
    }

    const multiplier = finalCurrency === 'tnd' ? 1000 : 100;
    const result = await stripeService.createPaymentIntent(
      Math.round(finalAmount * multiplier), // convert to smallest currency unit
      finalCurrency,
      { 
        userId, 
        packCoins: String(pack.coins), 
        packBonus: String(pack.bonus), 
        priceDisplay: pack.priceDisplay,
        originalAmount: String(amount),
        originalCurrency: currency
      }
    );

    // Store pending payment in Firestore
    const admin = require('firebase-admin');
    const db = admin.firestore();
    await db.collection('pending_payments').doc(result.paymentIntentId).set({
      userId,
      pack,
      amount,
      currency,
      status: 'pending',
      provider: 'stripe',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, clientSecret: result.clientSecret, paymentIntentId: result.paymentIntentId });
  } catch (error) {
    console.error('Stripe create-intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payment/stripe/checkout
 * Create a Stripe Checkout Session (hosted payment page) for a coin pack
 * Body: { amount, currency, userId, pack }
 */
router.post('/stripe/checkout', async (req, res) => {
  try {
    const { amount, currency = 'usd', userId, pack } = req.body;
    if (!amount || !userId || !pack) {
      return res.status(400).json({ error: 'Missing required fields: amount, userId, pack' });
    }

    let finalAmount = amount;
    let finalCurrency = currency.toLowerCase();

    // Convert TND to EUR for Stripe processing
    if (finalCurrency === 'tnd') {
      finalAmount = amount / 3.4;
      finalCurrency = 'eur';
    }

    const multiplier = finalCurrency === 'tnd' ? 1000 : 100;
    const session = await stripeService.createCheckoutSession(
      Math.round(finalAmount * multiplier), // smallest currency unit
      finalCurrency,
      { 
        userId, 
        packCoins: String(pack.coins), 
        packBonus: String(pack.bonus), 
        priceDisplay: pack.priceDisplay, 
        packName: `${pack.coins + pack.bonus} Coins Pack`,
        originalAmount: String(amount),
        originalCurrency: currency
      },
    );

    // Store a pending payment record keyed by session ID
    const admin = require('firebase-admin');
    const db = admin.firestore();
    await db.collection('pending_payments').doc(session.sessionId).set({
      userId,
      pack,
      amount,
      currency,
      status: 'pending',
      provider: 'stripe_checkout',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, url: session.url, sessionId: session.sessionId });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * POST /api/payment/stripe/verify/:paymentIntentId
 * Verify a Stripe PaymentIntent and credit wallet if succeeded
 */
router.post('/stripe/verify/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const result = await stripeService.verifyPaymentIntent(paymentIntentId);

    if (result.success) {
      const admin = require('firebase-admin');
      const db = admin.firestore();

      const paymentRef = db.collection('pending_payments').doc(paymentIntentId);
      const paymentDoc = await paymentRef.get();
      if (!paymentDoc.exists) return res.status(404).json({ error: 'Payment record not found' });

      const paymentData = paymentDoc.data();
      if (paymentData.status === 'completed') {
        return res.json({ success: true, status: 'succeeded', alreadyProcessed: true });
      }

      await paymentService.rechargeUserWallet(paymentData.userId, paymentData.pack, paymentIntentId);
      await paymentRef.update({ status: 'completed', verifiedAt: admin.firestore.FieldValue.serverTimestamp() });

      res.json({ success: true, status: 'succeeded' });
    } else {
      res.json({ success: false, status: result.status });
    }
  } catch (error) {
    console.error('Stripe verify error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payment/stripe/webhook
 * Stripe webhook — auto-completes PaymentIntents
 */
router.post('/stripe/webhook', require('express').raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripeService.constructWebhookEvent(req.body, sig);

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const admin = require('firebase-admin');
      const db = admin.firestore();

      const paymentRef = db.collection('pending_payments').doc(pi.id);
      const paymentDoc = await paymentRef.get();

      if (paymentDoc.exists && paymentDoc.data().status !== 'completed') {
        const paymentData = paymentDoc.data();
        await paymentService.rechargeUserWallet(paymentData.userId, paymentData.pack, pi.id);
        await paymentRef.update({ status: 'completed', verifiedAt: admin.firestore.FieldValue.serverTimestamp() });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// ============================================================================
// CRYPTO PAYMENTS
// ============================================================================

/**
 * POST /api/payment/crypto/create-invoice
 * Creates a crypto payment invoice with platform wallet address
 * Body: { userId, coin, amountUSD, pack }
 */
router.post('/crypto/create-invoice', async (req, res) => {
  try {
    const { userId, coin, amountUSD, pack } = req.body;
    if (!userId || !coin || !amountUSD || !pack) {
      return res.status(400).json({ error: 'Missing required fields: userId, coin, amountUSD, pack' });
    }

    const invoice = await cryptoService.createCryptoInvoice({
      userId,
      coin,
      amountUSD,
      meta: { packCoins: pack.coins, packBonus: pack.bonus, priceDisplay: pack.priceDisplay }
    });

    res.json({ success: true, invoice });
  } catch (error) {
    console.error('Crypto create-invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payment/crypto/verify/:invoiceId
 * Check the status of a crypto invoice
 */
router.get('/crypto/verify/:invoiceId', async (req, res) => {
  try {
    const result = await cryptoService.verifyCryptoInvoice(req.params.invoiceId);
    res.json(result);
  } catch (error) {
    console.error('Crypto verify error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payment/crypto/confirm/:invoiceId
 * Admin or webhook confirms receipt of crypto payment
 * Body: { txHash } (optional)
 */
router.post('/crypto/confirm/:invoiceId', async (req, res) => {
  try {
    const { txHash } = req.body || {};
    const result = await cryptoService.confirmCryptoInvoice(req.params.invoiceId, txHash);
    res.json(result);
  } catch (error) {
    console.error('Crypto confirm error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payment/crypto/supported-coins
 * Returns the list of accepted cryptocurrencies and platform wallet addresses
 */
router.get('/crypto/supported-coins', (req, res) => {
  const coins = Object.entries(cryptoService.SUPPORTED_COINS).map(([key, val]) => ({
    key,
    ...val,
    walletAddress: cryptoService.PLATFORM_WALLETS[key] || null,
  }));
  res.json({ success: true, coins });
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
