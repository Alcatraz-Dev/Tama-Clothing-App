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

// ─── Constants ─────────────────────────────────────────────────────────────────
/** Platform wallet document ID (singleton) */
export const PLATFORM_WALLET_ID = 'platform_main';

/** Commission rates (as decimals) */
export const COMMISSION_RATES = {
    /** What the delivery company keeps per delivery (on top of deliveryFee) */
    delivery: 0.03,   // 3% of COD amount
    /** What the platform keeps */
    platform: 0.02,   // 2% of COD amount
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────────
export type WalletType = 'brand' | 'delivery' | 'platform';

export interface Wallet {
    id: string;
    ownerId: string;         // userId or 'platform'
    ownerName?: string;
    balance: number;
    pendingBalance: number;  // funds awaiting COD confirmation
    totalEarned: number;
    totalWithdrawn: number;
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
    const walletRef = await addDoc(collection(db, 'wallets'), {
        ownerId,
        ownerName: ownerName ?? ownerId,
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        type,
        currency: 'TND',
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

export type WithdrawalMethod = 'flouci' | 'bank_transfer' | 'post_office';

export interface WithdrawalDetails {
    method: WithdrawalMethod;
    // Flouci
    flouciPhone?: string;
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
    brandId: string;
    walletId: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    method: WithdrawalMethod;
    details: WithdrawalDetails;
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
    brandId: string,
    amount: number,
    details: WithdrawalDetails,
): Promise<void> {
    if (amount <= 0) throw new Error('Invalid amount');

    await runTransaction(db, async (firestoreTx) => {
        const walletRef = doc(db, 'wallets', walletId);
        const walletSnap = await firestoreTx.get(walletRef);

        if (!walletSnap.exists()) throw new Error('Wallet not found');

        const wallet = walletSnap.data() as Wallet;
        if (wallet.balance < amount) {
            throw new Error('Insufficient balance');
        }

        // Deduct from available balance
        firestoreTx.update(walletRef, {
            balance: increment(-amount),
            totalWithdrawn: increment(amount),
            updatedAt: serverTimestamp(),
        });

        // 1. Withdrawal request (for Admin review)
        const requestRef = doc(collection(db, 'withdrawal_requests'));
        firestoreTx.set(requestRef, {
            brandId,
            walletId,
            amount,
            status: 'pending',
            method: details.method,
            details,
            requestedAt: serverTimestamp(),
        } as Omit<WithdrawalRequest, 'id'>);

        // 2. Immutable transaction log
        const txRef = doc(collection(db, 'transactions'));
        firestoreTx.set(txRef, {
            orderId: requestRef.id,
            brandId,
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
}

