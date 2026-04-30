/**
 * Crypto Payment Service
 * Accepts USDT/BTC payments via CoinPayments API or records wallet addresses for manual verification.
 * Supports: USDT (TRC-20 / ERC-20), BTC, ETH
 *
 * Architecture:
 *   - createCryptoInvoice(): creates a pending payment with a receiving address
 *   - verifyCryptoPayment(): checks IPN / manual confirmation in Firestore
 *   - Webhook handler records confirmed payments and triggers wallet recharge
 */

const crypto = require('crypto');
const admin = require('firebase-admin');

// ── Supported coins ─────────────────────────────────────────────────────────
const SUPPORTED_COINS = {
  USDT_TRC20: { label: 'USDT (TRC-20)', symbol: 'USDT', network: 'TRC-20' },
  USDT_ERC20: { label: 'USDT (ERC-20)', symbol: 'USDT', network: 'ERC-20' },
  BTC:        { label: 'Bitcoin',        symbol: 'BTC',  network: 'BTC'    },
  ETH:        { label: 'Ethereum',       symbol: 'ETH',  network: 'ERC-20' },
};

// Platform receiving wallets (set in .env)
const PLATFORM_WALLETS = {
  USDT_TRC20: process.env.CRYPTO_WALLET_USDT_TRC20 || '',
  USDT_ERC20: process.env.CRYPTO_WALLET_USDT_ERC20 || '',
  BTC:        process.env.CRYPTO_WALLET_BTC        || '',
  ETH:        process.env.CRYPTO_WALLET_ETH        || '',
};

// Rates are refreshed by a cron job; fallback values below (EUR-based)
const FALLBACK_RATES_EUR = { USDT: 0.93, BTC: 60000, ETH: 3000 };

/**
 * Creates a pending crypto invoice in Firestore.
 * The vendor sends the exact crypto amount to the platform wallet.
 * Admin confirms receipt manually OR the IPN webhook auto-confirms.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.coin - One of SUPPORTED_COINS keys
 * @param {number} params.amountEUR - Equivalent EUR value to pay
 * @param {Object} params.meta - { packCoins, packBonus, priceDisplay }
 * @returns {{ invoiceId, walletAddress, coinAmount, coin, network, expiresAt }}
 */
async function createCryptoInvoice({ userId, coin, amountEUR, meta = {} }) {
  if (!SUPPORTED_COINS[coin]) throw new Error(`Unsupported coin: ${coin}`);
  const walletAddress = PLATFORM_WALLETS[coin];
  if (!walletAddress) throw new Error(`Platform wallet not configured for ${coin}`);

  const coinSymbol = SUPPORTED_COINS[coin].symbol;
  const rate = FALLBACK_RATES_EUR[coinSymbol] || 1;
  const coinAmount = parseFloat((amountEUR / rate).toPrecision(8));

  const invoiceId = `crypto_${userId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store in Firestore via firebase-admin (imported lazily to avoid circular deps)
  const admin = require('firebase-admin');
  const db = admin.firestore();
  await db.collection('crypto_invoices').doc(invoiceId).set({
    userId,
    coin,
    coinSymbol,
    network: SUPPORTED_COINS[coin].network,
    walletAddress,
    amountEUR,
    coinAmount,
    meta,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
  });

  return { invoiceId, walletAddress, coinAmount, coin, network: SUPPORTED_COINS[coin].network, expiresAt };
}

/**
 * Verify a crypto invoice status
 * Returns { success, status, invoiceData }
 */
async function verifyCryptoInvoice(invoiceId) {
  const admin = require('firebase-admin');
  const db = admin.firestore();
  const doc = await db.collection('crypto_invoices').doc(invoiceId).get();
  if (!doc.exists) throw new Error('Invoice not found');
  return { success: true, status: doc.data().status, invoiceData: doc.data() };
}

const paymentService = require('./payment-service');

/**
 * Mark an invoice as confirmed (called by admin or webhook)
 * Also triggers coin wallet recharge
 */
async function confirmCryptoInvoice(invoiceId, txHash) {
  const admin = require('firebase-admin');
  const db = admin.firestore();
  const invoiceRef = db.collection('crypto_invoices').doc(invoiceId);
  const invoiceDoc = await invoiceRef.get();
  if (!invoiceDoc.exists) throw new Error('Invoice not found');

  const invoice = invoiceDoc.data();
  if (invoice.status === 'completed') return { success: true, alreadyProcessed: true };

  // Recharge user wallet via centralized payment service (handles bonuses)
  const pack = {
    coins: invoice.meta?.packCoins || 0,
    bonus: invoice.meta?.packBonus || 0,
    price: invoice.amountUSD,
    priceDisplay: invoice.meta?.priceDisplay || `${invoice.amountUSD} USD`
  };

  await paymentService.rechargeUserWallet(invoice.userId, pack, invoiceId);

  // Mark invoice completed
  await invoiceRef.update({
    status: 'completed',
    txHash: txHash || null,
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
}

module.exports = {
  SUPPORTED_COINS,
  PLATFORM_WALLETS,
  createCryptoInvoice,
  verifyCryptoInvoice,
  confirmCryptoInvoice,
};
