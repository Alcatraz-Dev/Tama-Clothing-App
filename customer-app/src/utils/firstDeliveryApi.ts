/**
 * First Delivery API (FDG) Integration
 * Documentation: https://www.firstdeliverygroup.com/api/v2/documentation#fdg_order
 *
 * This module handles creating shipments via the First Delivery Group API
 * and syncing the result (tracking number, status) back to Firestore.
 */

import { db } from '../api/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// ─── Configuration ─────────────────────────────────────────────────────────────
const FDG_BASE_URL = 'https://www.firstdeliverygroup.com/api/v2';
const FDG_API_KEY = process.env.EXPO_PUBLIC_FDG_API_KEY || '';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface FDGOrderPayload {
  /** Customer full name */
  customerName: string;
  /** Customer phone number (Tunisian format: +216XXXXXXXX or 2XXXXXXX) */
  phone: string;
  /** Delivery street address */
  address: string;
  /** Tunisian governorate / city (e.g. "Tunis", "Sfax") */
  city: string;
  /** Short description of package contents */
  description: string;
  /** Cash-on-delivery amount in TND (what the delivery company collects) */
  codAmount: number;
  /** Number of pieces in the package */
  pieces?: number;
  /** Package weight in kg */
  weight?: number;
  /** Internal reference (your order ID) */
  reference?: string;
  /** Seller / merchant name */
  sellerName?: string;
  /** Seller phone */
  sellerPhone?: string;
  /** Seller address (pickup point) */
  sellerAddress?: string;
}

export interface FDGOrderResult {
  success: boolean;
  trackingNumber?: string;
  fdgOrderId?: string;
  barcode?: string;
  error?: string;
  rawResponse?: any;
}

// ─── Create Shipment on FDG Platform ───────────────────────────────────────────
/**
 * POSTs a new order to the First Delivery Group API.
 * On success, returns the tracking number that can be used on
 * https://track.firstdeliverygroup.com/?code=<trackingNumber>
 */
export async function createFDGShipment(payload: FDGOrderPayload): Promise<FDGOrderResult> {
  if (!FDG_API_KEY) {
    console.warn('[FDG] No API key configured. Skipping external shipment creation.');
    return { success: false, error: 'FDG API key not configured.' };
  }

  const body = {
    receiver_name: payload.customerName,
    receiver_phone: payload.phone,
    address: payload.address,
    governorate: payload.city,
    description: payload.description,
    cod_amount: payload.codAmount,
    pieces: payload.pieces ?? 1,
    weight: payload.weight ?? 1,
    reference: payload.reference ?? '',
    sender_name: payload.sellerName ?? 'TamaClothing',
    sender_phone: payload.sellerPhone ?? '+21600000000',
    sender_address: payload.sellerAddress ?? 'Tunis, Tunisie',
  };

  try {
    const response = await fetch(`${FDG_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FDG_API_KEY}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await response.json();

    if (!response.ok) {
      const msg = json?.message || json?.error || `HTTP ${response.status}`;
      console.error('[FDG] Create order failed:', msg, json);
      return { success: false, error: msg, rawResponse: json };
    }

    // The FDG API returns { tracking_number, id, barcode, ... }
    return {
      success: true,
      trackingNumber: json.tracking_number ?? json.trackingNumber,
      fdgOrderId: json.id ?? json.order_id,
      barcode: json.barcode,
      rawResponse: json,
    };
  } catch (err: any) {
    console.error('[FDG] Network error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Sync FDG Tracking Info Back to Firestore ──────────────────────────────────
/**
 * After a shipment is created on FDG, call this to write the
 * FDG tracking number & order ID into the local Firestore shipment document.
 */
export async function syncFDGTrackingToFirestore(
  shipmentDocId: string,
  result: FDGOrderResult
): Promise<void> {
  if (!result.success || !shipmentDocId) return;
  try {
    await updateDoc(doc(db, 'shipments', shipmentDocId), {
      fdgTrackingNumber: result.trackingNumber ?? null,
      fdgOrderId: result.fdgOrderId ?? null,
      fdgBarcode: result.barcode ?? null,
      deliveryCompanyId: 'first_delivery_group',
      deliveryCompanyName: 'First Delivery Group',
      fdgSyncedAt: serverTimestamp(),
    });
    console.log('[FDG] Firestore synced for shipment', shipmentDocId);
  } catch (err) {
    console.error('[FDG] Failed to sync to Firestore:', err);
  }
}

// ─── Get FDG Order Status ───────────────────────────────────────────────────────
/**
 * Fetches the latest status for a single FDG order.
 * Returns a normalised status string matching the app's ShipmentStatus type.
 */
export async function getFDGOrderStatus(fdgOrderId: string): Promise<{ status: string; rawStatus?: string } | null> {
  if (!FDG_API_KEY || !fdgOrderId) return null;
  try {
    const response = await fetch(`${FDG_BASE_URL}/orders/${fdgOrderId}`, {
      headers: {
        Authorization: `Bearer ${FDG_API_KEY}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) return null;
    const json = await response.json();
    const rawStatus: string = json.status ?? '';
    // Normalise FDG statuses → our internal statuses
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Pending',
      picked_up: 'In Transit',
      in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      returned: 'Cancelled',
    };
    const status = statusMap[rawStatus.toLowerCase()] ?? rawStatus;
    return { status, rawStatus };
  } catch {
    return null;
  }
}

// ─── Cancel a FDG Order ────────────────────────────────────────────────────────
export async function cancelFDGOrder(fdgOrderId: string): Promise<boolean> {
  if (!FDG_API_KEY || !fdgOrderId) return false;
  try {
    const response = await fetch(`${FDG_BASE_URL}/orders/${fdgOrderId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FDG_API_KEY}`,
        Accept: 'application/json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
