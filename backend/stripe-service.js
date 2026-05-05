/**
 * Stripe Payment Service
 * Handles card payments, PaymentIntents, and wallet recharges
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const APP_URL = process.env.APP_URL || 'tama-clothing://';

/**
 * Create a Stripe PaymentIntent for a coin recharge pack
 * @param {number} amountCents - Amount in smallest currency unit (cents for USD, millimes for TND)
 * @param {string} currency - ISO currency code (default 'usd')
 * @param {Object} metadata - Arbitrary metadata stored with the intent
 * @returns {{ clientSecret: string, paymentIntentId: string }}
 */
async function createPaymentIntent(amountCents, currency = 'usd', metadata = {}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amountCents),
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata,
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Retrieve and verify a PaymentIntent status
 * @param {string} paymentIntentId
 * @returns {{ success: boolean, status: string, amount: number }}
 */
async function verifyPaymentIntent(paymentIntentId) {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  return {
    success: pi.status === 'succeeded',
    status: pi.status,
    amount: pi.amount,
    currency: pi.currency,
    metadata: pi.metadata,
  };
}

/**
 * Construct and verify a Stripe webhook event
 * @param {Buffer} rawBody
 * @param {string} signature
 * @returns {Object} Stripe Event
 */
function constructWebhookEvent(rawBody, signature) {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );
}

/**
 * Create a Stripe Checkout Session (alternative to PaymentIntent – good for web redirects)
 */
async function createCheckoutSession(amountCents, currency = 'usd', metadata = {}, successUrl, cancelUrl) {
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'hosted_page',
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: metadata.packName || 'Coin Pack',
            description: metadata.packDesc || 'In-app currency',
          },
          unit_amount: Math.round(amountCents),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl || `${APP_URL}payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${APP_URL}payment-cancel`,
    metadata,
  });

  return { sessionId: session.id, url: session.url };
}

module.exports = {
  createPaymentIntent,
  verifyPaymentIntent,
  constructWebhookEvent,
  createCheckoutSession,
};
