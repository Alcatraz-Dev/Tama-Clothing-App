/**
 * COD Financial Model Service
 *
 * Handles Cash-on-Delivery financial flows for the TamaClothing platform.
 *
 * Financial Flow:
 *   Customer pays delivery company on delivery
 *   → Delivery company deducts:  deliveryFee + deliveryCommission
 *   → Platform deducts:          platformCommission
 *   → Brand receives:            brandRevenue = totalPrice - deliveryFee - deliveryCommission - platformCommission
 *
 * Wallet Types: 'brand' | 'delivery' | 'platform'
 *
 * Firestore Collections:
 *   /wallets/{walletId}         – one per actor
 *   /transactions/{txId}        – immutable ledger entries
 */

import { db } from '../api/firebase';
import {
    collection,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    increment,
    runTransaction,
    serverTimestamp,
    Unsubscribe,
} from 'firebase/firestore';
import { sendPushNotification } from '../utils/notifications';

// ─── Constants ─────────────────────────────────────────────────────────────────
/** Platform wallet document ID (singleton) */
export const PLATFORM_WALLET_ID = 'platform_main';

// ─── Admin Notification Helper ───────────────────────────────────────────────
export async function notifyAdmins(title: string, body: string, data: any = {}) {
    try {
        const adminQ = query(collection(db, 'users'), where('role', '==', 'admin'));
        const adminSnap = await getDocs(adminQ);
        const tokens: string[] = [];
        
        adminSnap.forEach(doc => {
            const userData = doc.data();
            if (userData.expoPushToken) {
                tokens.push(userData.expoPushToken);
            }
            
            // Also add to their in-app notifications
            addDoc(collection(db, 'notifications'), {
                userId: doc.id,
                title,
                message: body,
                type: 'admin_alert',
                data,
                createdAt: serverTimestamp(),
                read: false
            });
        });

        // Send push notifications
        for (const token of tokens) {
            await sendPushNotification(token, title, body, data);
        }
    } catch (error) {
        console.error('[FinancialService] Failed to notify admins:', error);
    }
}

/** Commission rates (as decimals) */
export const COMMISSION_RATES = {
    /** What the delivery company keeps per delivery (on top of deliveryFee) */
    delivery: 0.03,   // 3% of COD amount
    /** What the platform keeps */
    platform: 0.02,   // 2% of COD amount
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────────
export type WalletType = 'brand' | 'delivery' | 'platform' | 'customer';

export interface Wallet {
    id: string;
    ownerId: string;         // userId or 'platform'
    ownerName?: string;
    balance: number;
    pendingBalance: number;  // funds awaiting COD confirmation
    totalEarned: number;
    totalWithdrawn: number;
    diamonds?: number;
    totalWithdrawnTND?: number;
    type: WalletType;
    currency: 'TND';
    createdAt: any;
    updatedAt: any;
}

export interface OrderFinancials {
    /** Total amount customer pays (product + delivery) */
    codAmount: number;
    /** Price the customer pays for products only */
    productPrice: number;
    /** The delivery fee charged to customer */
    deliveryFee: number;
    /** Commission paid to delivery company  */
    deliveryCommission: number;
    /** Commission the platform keeps */
    platformCommission: number;
    /** What the brand actually receives */
    brandRevenue: number;
}

export interface CODTransaction {
    id?: string;
    orderId: string;
    shipmentId?: string;
    trackingId?: string;
    // Actors
    brandId: string;
    brandWalletId: string;
    deliveryCompanyId: string;
    deliveryWalletId?: string;
    // Amounts
    codAmount: number;
    productPrice: number;
    deliveryFee: number;
    deliveryCommission: number;
    platformCommission: number;
    brandRevenue: number;
    // Metadata
    type: 'cod_settlement' | 'withdrawal' | 'refund' | 'adjustment';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    notes?: string;
    createdAt: any;
    completedAt?: any;
}

// ─── Financial Calculation ─────────────────────────────────────────────────────
/**
 * Given a COD amount and delivery fee, compute the full financial breakdown.
 */
export function calculateOrderFinancials(
    codAmount: number,
    deliveryFee: number,
    deliveryCommissionRate = COMMISSION_RATES.delivery,
    platformCommissionRate = COMMISSION_RATES.platform,
): OrderFinancials {
    const productPrice = codAmount - deliveryFee;
    const deliveryCommission = Math.round(codAmount * deliveryCommissionRate * 100) / 100;
    const platformCommission = Math.round(codAmount * platformCommissionRate * 100) / 100;
    const brandRevenue = productPrice - platformCommission;

    return {
        codAmount,
        productPrice,
        deliveryFee,
        deliveryCommission,
        platformCommission,
        brandRevenue,
    };
}

// ─── Wallet Management ─────────────────────────────────────────────────────────
/**
 * Finds or creates a wallet for a brand, delivery company, or the platform.
 * Returns the wallet document ID.
 */
export async function getOrCreateWallet(
    ownerId: string,
    type: WalletType,
    ownerName?: string,
): Promise<string> {
    // Platform has a fixed singleton wallet
    if (type === 'platform') {
        const ref = doc(db, 'wallets', PLATFORM_WALLET_ID);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            await setDoc(ref, {
                ownerId: 'platform',
                ownerName: 'TamaClothing Platform',
                balance: 0,
                pendingBalance: 0,
                totalEarned: 0,
                totalWithdrawn: 0,
                type: 'platform',
                currency: 'TND',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }
        return PLATFORM_WALLET_ID;
    }

    // For brands / delivery companies – look up by ownerId + type
    const q = query(
        collection(db, 'wallets'),
        where('ownerId', '==', ownerId),
        where('type', '==', type),
        limit(1),
    );
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].id;

    // Create new wallet
    const walletRef = doc(collection(db, 'wallets'));
    await setDoc(walletRef, {
        id: walletRef.id,
        ownerId,
        type,
        ownerName,
        balance: 0,
        coins: 0,
        diamonds: 0,
        pendingWithdrawals: 0,
        totalWithdrawn: 0,
        totalWithdrawnTND: 0,
        totalEarned: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return walletRef.id;
}

// ─── Record Pending COD (when order is placed) ─────────────────────────────────
/**
 * When an order is created, log a PENDING transaction.
 * Funds are not released yet – they become available after delivery.
 */
export async function recordPendingCOD(params: {
    orderId: string;
    brandId: string;
    brandName: string;
    deliveryCompanyId: string;
    codAmount: number;
    deliveryFee: number;
}): Promise<string> {
    const financials = calculateOrderFinancials(params.codAmount, params.deliveryFee);

    const brandWalletId = await getOrCreateWallet(params.brandId, 'brand', params.brandName);

    const tx: Omit<CODTransaction, 'id'> = {
        orderId: params.orderId,
        brandId: params.brandId,
        brandWalletId,
        deliveryCompanyId: params.deliveryCompanyId,
        ...financials,
        type: 'cod_settlement',
        status: 'pending',
        createdAt: serverTimestamp(),
    };

    const txRef = await addDoc(collection(db, 'transactions'), tx);

    // Increase brand's pendingBalance
    await updateDoc(doc(db, 'wallets', brandWalletId), {
        pendingBalance: increment(financials.brandRevenue),
        updatedAt: serverTimestamp(),
    });

    return txRef.id;
}

// ─── Settle COD (when delivery is confirmed) ──────────────────────────────────
/**
 * When a shipment is marked as Delivered, run the full settlement:
 *   1. Brand pending → confirmed balance
 *   2. Delivery company receives its fees
 *   3. Platform receives its commission
 *   4. Transaction status → 'completed'
 */
export async function settleCOD(transactionId: string): Promise<void> {
    const txRef = doc(db, 'transactions', transactionId);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) throw new Error('Transaction not found');

    const tx = txSnap.data() as CODTransaction;
    if (tx.status !== 'pending') return; // already settled

    const deliveryWalletId = tx.deliveryWalletId
        ?? await getOrCreateWallet(tx.deliveryCompanyId, 'delivery');
    const platformWalletId = PLATFORM_WALLET_ID;
    await getOrCreateWallet('platform', 'platform');

    await runTransaction(db, async (firestoreTx) => {
        const brandWalletRef = doc(db, 'wallets', tx.brandWalletId);
        const deliveryWalletRef = doc(db, 'wallets', deliveryWalletId);
        const platformWalletRef = doc(db, 'wallets', platformWalletId);

        // 1. Brand: move from pending to confirmed balance
        firestoreTx.update(brandWalletRef, {
            pendingBalance: increment(-tx.brandRevenue),
            balance: increment(tx.brandRevenue),
            totalEarned: increment(tx.brandRevenue),
            updatedAt: serverTimestamp(),
        });

        // 2. Delivery company: receive fee + commission
        const deliveryTotal = tx.deliveryFee + tx.deliveryCommission;
        firestoreTx.update(deliveryWalletRef, {
            balance: increment(deliveryTotal),
            totalEarned: increment(deliveryTotal),
            updatedAt: serverTimestamp(),
        });

        // 3. Platform: receive commission
        firestoreTx.update(platformWalletRef, {
            balance: increment(tx.platformCommission),
            totalEarned: increment(tx.platformCommission),
            updatedAt: serverTimestamp(),
        });

        // 4. Mark transaction complete
        firestoreTx.update(txRef, {
            status: 'completed',
            deliveryWalletId,
            completedAt: serverTimestamp(),
        });
    });

    console.log('[COD] Settlement complete for transaction', transactionId);
}

// ─── Find and Settle COD by Order ID ─────────────────────────────────────────
/**
 * Convenience: find the pending COD transaction for an order and settle it.
 */
export async function settleCODByOrderId(orderId: string): Promise<void> {
    const q = query(
        collection(db, 'transactions'),
        where('orderId', '==', orderId),
        where('status', '==', 'pending'),
        where('type', '==', 'cod_settlement'),
        limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) {
        console.warn('[COD] No pending COD transaction found for order', orderId);
        return;
    }
    await settleCOD(snap.docs[0].id);
}

/**
 * Grant a manual bonus (diamonds) to a customer.
 */
export async function grantBonus(userId: string, amount: number, reason: string) {
    if (amount <= 0) throw new Error("Amount must be positive");
    
    await runTransaction(db, async (transaction) => {
        // We look for a wallet with ownerId == userId and type == 'customer'
        const q = query(
            collection(db, 'wallets'),
            where('ownerId', '==', userId),
            where('type', '==', 'customer'),
            limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) throw new Error("Customer wallet not found");
        
        const walletDoc = snap.docs[0];
        
        // Update wallet
        transaction.update(walletDoc.ref, {
            diamonds: increment(amount),
            updatedAt: serverTimestamp(),
        });
        
        // Create transaction record
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
            type: 'bonus',
            actorId: userId,
            actorType: 'customer',
            amount: amount * 0.01, // TND equivalent
            currency: 'TND',
            diamonds: amount,
            reason: reason || "Admin manual bonus",
            createdAt: serverTimestamp(),
        });
    });

    // Notify admins about the bonus grant
    await notifyAdmins(
        "💎 Bonus Granted",
        `A bonus of ${amount} diamonds was granted to user ${userId.slice(0, 8)}. Reason: ${reason}`,
        { userId, amount, type: 'bonus' }
    );
}

/**
 * Admin: Grant a manual recharge (coins) to a user.
 */
export async function grantRecharge(userId: string, amount: number, reason: string) {
    if (amount <= 0) throw new Error("Amount must be positive");
    
    await runTransaction(db, async (transaction) => {
        const q = query(
            collection(db, 'wallets'),
            where('ownerId', '==', userId),
            where('type', '==', 'customer'),
            limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) throw new Error("Customer wallet not found");
        
        const walletDoc = snap.docs[0];
        
        // Update wallet
        transaction.update(walletDoc.ref, {
            coins: increment(amount),
            updatedAt: serverTimestamp(),
        });
        
        // Create transaction record
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
            type: 'recharge',
            method: 'manual_admin',
            actorId: userId,
            actorType: 'customer',
            amount: amount * 0.01, // TND equivalent
            currency: 'TND',
            coins: amount,
            reason: reason || "Admin manual recharge",
            status: 'completed',
            createdAt: serverTimestamp(),
            completedAt: serverTimestamp(),
        });
    });

    await notifyAdmins(
        "🪙 Manual Recharge",
        `A manual recharge of ${amount} coins was granted to user ${userId.slice(0, 8)}.`,
        { userId, amount, type: 'recharge' }
    );
}

// ─── Real-time Wallet Listener ────────────────────────────────────────────────
export function subscribeToWallet(
    ownerId: string,
    type: WalletType,
    onUpdate: (wallet: Wallet | null) => void,
): Unsubscribe {
    const q = query(
        collection(db, 'wallets'),
        where('ownerId', '==', ownerId),
        where('type', '==', type),
        limit(1),
    );
    return onSnapshot(q, (snap) => {
        if (snap.empty) {
            onUpdate(null);
        } else {
            const d = snap.docs[0];
            onUpdate({ id: d.id, ...(d.data() as Omit<Wallet, 'id'>) });
        }
    });
}

// ─── Transaction History ──────────────────────────────────────────────────────
export function subscribeToTransactions(
    walletId: string,
    onUpdate: (txs: CODTransaction[]) => void,
    maxCount = 30,
): Unsubscribe {
    const q = query(
        collection(db, 'transactions'),
        where('brandWalletId', '==', walletId),
        orderBy('createdAt', 'desc'),
        limit(maxCount),
    );
    return onSnapshot(q, (snap) => {
        onUpdate(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CODTransaction, 'id'>) })));
    });
}

// ─── Platform totals (admin dashboard) ───────────────────────────────────────
export async function getPlatformWalletSummary(): Promise<Wallet | null> {
    const snap = await getDoc(doc(db, 'wallets', PLATFORM_WALLET_ID));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<Wallet, 'id'>) };
}

export async function getAllBrandRevenues(): Promise<{ brandId: string; brandName: string; totalRevenue: number }[]> {
    const q = query(
        collection(db, 'wallets'),
        where('type', '==', 'brand'),
        orderBy('totalEarned', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
        brandId: d.data().ownerId,
        brandName: d.data().ownerName ?? d.data().ownerId,
        totalRevenue: d.data().totalEarned ?? 0,
    }));
}

// ─── Withdrawal Requests ─────────────────────────────────────────────────────

export type WithdrawalMethod = 'stripe' | 'bank_transfer' | 'post_office' | 'crypto';

export interface WithdrawalDetails {
    method: WithdrawalMethod;
    // Stripe payout
    stripeEmail?: string;        // Stripe-linked email or Connect account
    // Crypto payout
    cryptoCoin?: string;         // e.g. 'USDT_TRC20', 'BTC', 'ETH'
    cryptoAddress?: string;      // Vendor's crypto wallet address
    // Bank Transfer
    iban?: string;
    bankName?: string;
    // Post Office
    fullName?: string;
    address?: string;
    postalCode?: string;
    city?: string;
}

export interface WithdrawalRequest {
    id?: string;
    actorId: string;          // brandId or userId
    actorType: WalletType;
    walletId: string;
    amount: number;           // Amount in base currency (TND)
    payoutAmount: number;
    payoutCurrency: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
    method: string;
    details: any;
    requestedAt: any;
    processedAt?: any;
    adminNote?: string;
}

export interface ExchangeRequest {
    id?: string;
    userId: string;
    walletId: string;
    fromCurrency: 'coins' | 'diamonds';
    toCurrency: 'coins' | 'diamonds';
    fromAmount: number;
    toAmount: number;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: any;
    processedAt?: any;
    adminNote?: string;
}

export interface TransferRequest {
    id?: string;
    senderId: string;
    senderWalletId: string;
    recipientId: string;
    recipientWalletId: string;
    recipientName: string;
    amount: number;
    currency: 'coins' | 'diamonds';
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: any;
    processedAt?: any;
    adminNote?: string;
}

/**
 * Creates a withdrawal request and immediately deducts funds from the wallet balance.
 * Supports flouci, bank_transfer and post_office payout methods.
 * Logs an immutable 'withdrawal' transaction.
 */
export async function requestWithdrawal(
    walletId: string,
    actorId: string,
    amount: number,
    details: WithdrawalDetails,
    actorType: WalletType = 'brand'
): Promise<void> {
    if (amount <= 0) throw new Error('Invalid amount');

    // Currency conversion logic
    const isEUR = details.method === "stripe" || details.method === "crypto";
    const amountInTND = amount;
    const payoutAmount = isEUR ? Number((amountInTND / 3.4).toFixed(2)) : amount;
    const payoutCurrency = isEUR ? 'EUR' : 'TND';
    const amountStr = isEUR ? `${payoutAmount.toFixed(2)} EUR (${amountInTND.toFixed(2)} TND)` : `${amountInTND.toFixed(2)} TND`;
    const diamondAmountStr = actorType === 'customer' ? ` (${Math.round(amountInTND * 100)} Diamonds)` : '';

    await runTransaction(db, async (firestoreTx) => {
        const walletRef = doc(db, 'wallets', walletId);
        const walletSnap = await firestoreTx.get(walletRef);

        if (!walletSnap.exists()) throw new Error('Wallet not found');

        const wallet = walletSnap.data() as Wallet;

        if (actorType === 'customer') {
            // Support legacy diamonds stored in user profile
            const userRef = doc(db, 'users', actorId);
            const userSnap = await firestoreTx.get(userRef);
            const userData = userSnap.exists() ? userSnap.data() : {};
            
            // Support legacy diamonds: could be userData.wallet.diamonds (object) or userData.wallet (number)
            let legacyDiamonds = 0;
            if (userData.wallet) {
                if (typeof userData.wallet === 'object') {
                    legacyDiamonds = Number(userData.wallet.diamonds) || 0;
                } else {
                    legacyDiamonds = Number(userData.wallet) || 0;
                }
            }
            
            const modernDiamonds = Number(wallet.diamonds) || 0;
            const totalDiamonds = modernDiamonds + legacyDiamonds;
            const diamondAmount = Math.round(amount * 100); // 1 diamond = 0.01 TND

            if (totalDiamonds < diamondAmount) {
                throw new Error('Insufficient diamond balance');
            }

            // Perform "Lazy Migration": Move legacy diamonds to modern wallet document
            // and deduct the withdrawal amount from the consolidated total.
            const newModernDiamonds = totalDiamonds - diamondAmount;
            
            firestoreTx.update(walletRef, {
                diamonds: newModernDiamonds,
                totalWithdrawnTND: increment(amount),
                updatedAt: serverTimestamp(),
            });

            // Wipe legacy diamonds from user profile to prevent double-spending/confusion
            if (legacyDiamonds > 0) {
                if (typeof userData.wallet === 'object') {
                    firestoreTx.update(userRef, {
                        'wallet.diamonds': 0
                    });
                } else {
                    firestoreTx.update(userRef, {
                        wallet: 0
                    });
                }
            }
        } else {
            if (wallet.balance < amount) {
                throw new Error('Insufficient balance');
            }
            // Deduct from available balance
            firestoreTx.update(walletRef, {
                balance: increment(-amount),
                totalWithdrawn: increment(amount),
                updatedAt: serverTimestamp(),
            });
        }

        // 1. Withdrawal request (for Admin review)
        const requestRef = doc(collection(db, 'withdrawal_requests'));
        
        // Clean details object of undefined values to avoid Firestore errors
        const cleanedDetails = Object.fromEntries(
            Object.entries(details).filter(([_, v]) => v !== undefined)
        );

        firestoreTx.set(requestRef, {
            actorId,
            actorType,
            brandId: actorId, // backwards compatibility for existing admin filters
            walletId,
            amount,
            payoutAmount,
            payoutCurrency,
            status: 'pending',
            method: details.method,
            details: cleanedDetails,
            requestedAt: serverTimestamp(),
        } as Omit<WithdrawalRequest, 'id'>);

        // 2. Immutable transaction log
        const txRef = doc(collection(db, 'transactions'));
        firestoreTx.set(txRef, {
            orderId: requestRef.id,
            actorId,
            actorType,
            brandId: actorId, // backwards compatibility
            brandWalletId: walletId,
            deliveryCompanyId: 'platform',
            codAmount: 0,
            productPrice: 0,
            deliveryFee: 0,
            deliveryCommission: 0,
            platformCommission: 0,
            brandRevenue: -amount,
            type: 'withdrawal',
            status: 'pending',
            createdAt: serverTimestamp(),
        });
    });

    // Notify admins about new withdrawal request
    await notifyAdmins(
        "💰 New Withdrawal Request",
        `${actorType.toUpperCase()} ${actorId.slice(0, 8)} requested a withdrawal of ${amountStr}${diamondAmountStr} via ${details.method}.`,
        { actorId, amount, method: details.method, type: 'withdrawal' }
    );
}

/**
 * Admin: Approve a withdrawal request.
 * Marks the request as approved and completes the transaction log.
 */
export async function approveWithdrawal(requestId: string, adminNote?: string): Promise<void> {
    const requestRef = doc(db, 'withdrawal_requests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) throw new Error('Withdrawal request not found');

    const request = requestSnap.data() as WithdrawalRequest;
    if (request.status !== 'pending') throw new Error('Request is already processed');

    await runTransaction(db, async (firestoreTx) => {
        const walletRef = doc(db, 'wallets', request.walletId);
        
        // 1. Update request status
        firestoreTx.update(requestRef, {
            status: 'approved',
            processedAt: serverTimestamp(),
            adminNote: adminNote ?? 'Approved by Admin',
        });

        // 2. Update wallet stats (only if not already done)
        // For customer, totalWithdrawnTND was already incremented in requestWithdrawal
        // For others, totalWithdrawn was already incremented in requestWithdrawal
        // So we don't need to increment them here again.
        // BUT wait, look at requestWithdrawal:
        // it increments totalWithdrawn/totalWithdrawnTND IMMEDIATELY.
        // So we just need to update the status.

        // 3. Find and complete the related transaction
        const txQ = query(
            collection(db, 'transactions'),
            where('orderId', '==', requestId),
            where('type', '==', 'withdrawal'),
            limit(1)
        );
        const txSnap = await getDocs(txQ);
        if (!txSnap.empty) {
            const txRef = doc(db, 'transactions', txSnap.docs[0].id);
            firestoreTx.update(txRef, {
                status: 'completed',
                completedAt: serverTimestamp(),
            });
        }
    });
}

/**
 * Admin: Reject a withdrawal request.
 * Marks the request as rejected, adds back the funds to the wallet, and cancels the transaction log.
 */
export async function rejectWithdrawal(requestId: string, adminNote: string): Promise<void> {
    const requestRef = doc(db, 'withdrawal_requests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) throw new Error('Withdrawal request not found');

    const request = requestSnap.data() as WithdrawalRequest;
    if (request.status !== 'pending') throw new Error('Request is already processed');

    await runTransaction(db, async (firestoreTx) => {
        // 1. Update request status
        firestoreTx.update(requestRef, {
            status: 'rejected',
            processedAt: serverTimestamp(),
            adminNote: adminNote ?? 'Rejected by Admin',
        });

        // 2. Add back funds to the wallet
        const walletRef = doc(db, 'wallets', request.walletId);
        if (request.actorType === 'customer') {
            const diamondAmount = request.amount * 100;
            firestoreTx.update(walletRef, {
                diamonds: increment(diamondAmount),
                totalWithdrawnTND: increment(-request.amount),
                updatedAt: serverTimestamp(),
            });
        } else {
            firestoreTx.update(walletRef, {
                balance: increment(request.amount),
                totalWithdrawn: increment(-request.amount),
                updatedAt: serverTimestamp(),
            });
        }

        // 3. Find and mark transaction as failed/rejected
        const txQ = query(
            collection(db, 'transactions'),
            where('orderId', '==', requestId),
            where('type', '==', 'withdrawal'),
            limit(1)
        );
        const txSnap = await getDocs(txQ);
        if (!txSnap.empty) {
            const txRef = doc(db, 'transactions', txSnap.docs[0].id);
            firestoreTx.update(txRef, {
                status: 'failed',
                notes: `Rejected: ${adminNote}`,
                completedAt: serverTimestamp(),
            });
        }
    });
}

/**
 * Perform an instant currency exchange (coins <-> diamonds).
 */
export async function performExchange(
    userId: string,
    walletId: string,
    fromCurrency: 'coins' | 'diamonds',
    toCurrency: 'coins' | 'diamonds',
    fromAmount: number,
    toAmount: number
): Promise<void> {
    await runTransaction(db, async (firestoreTx) => {
        const walletRef = doc(db, 'wallets', walletId);
        const walletSnap = await firestoreTx.get(walletRef);

        if (!walletSnap.exists()) throw new Error('Wallet not found');

        const walletData = walletSnap.data();
        const currentFromBalance = (walletData as any)[fromCurrency] || 0;

        if (currentFromBalance < fromAmount) {
            throw new Error('Insufficient balance');
        }

        // Update balances
        firestoreTx.update(walletRef, {
            [fromCurrency]: increment(-fromAmount),
            [toCurrency]: increment(toAmount),
            updatedAt: serverTimestamp(),
        });

        // Log transaction
        const txRef = doc(collection(db, 'transactions'));
        firestoreTx.set(txRef, {
            userId,
            walletId,
            fromCurrency,
            toCurrency,
            fromAmount,
            toAmount,
            type: 'exchange',
            status: 'completed',
            createdAt: serverTimestamp(),
            completedAt: serverTimestamp(),
        });
    });
}

/**
 * Perform an instant peer-to-peer transfer.
 */
export async function performTransfer(
    senderId: string,
    senderWalletId: string,
    recipientId: string,
    recipientWalletId: string,
    recipientName: string,
    amount: number,
    currency: 'coins' | 'diamonds'
): Promise<void> {
    await runTransaction(db, async (firestoreTx) => {
        const senderWalletRef = doc(db, 'wallets', senderWalletId);
        const recipientWalletRef = doc(db, 'wallets', recipientWalletId);

        const senderSnap = await firestoreTx.get(senderWalletRef);
        if (!senderSnap.exists()) throw new Error('Sender wallet not found');

        const senderData = senderSnap.data();
        const senderBalance = (senderData as any)[currency] || 0;

        if (senderBalance < amount) {
            throw new Error('Insufficient balance');
        }

        // Deduct from sender
        firestoreTx.update(senderWalletRef, {
            [currency]: increment(-amount),
            updatedAt: serverTimestamp(),
        });

        // Add to recipient
        firestoreTx.update(recipientWalletRef, {
            [currency]: increment(amount),
            updatedAt: serverTimestamp(),
        });

        // Log transaction
        const txRef = doc(collection(db, 'transactions'));
        firestoreTx.set(txRef, {
            senderId,
            senderWalletId,
            recipientId,
            recipientWalletId,
            recipientName,
            amount,
            currency,
            type: 'transfer',
            status: 'completed',
            createdAt: serverTimestamp(),
            completedAt: serverTimestamp(),
        });
    });
}


