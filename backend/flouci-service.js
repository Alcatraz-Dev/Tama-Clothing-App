/**
 * Flouci Payment Service
 * Integration with Flouci (Tunisian Payment Gateway)
 */

// Flouci API Configuration
const FLOUCI_API_BASE = "https://developers.flouci.com/api/v2";
const PUBLIC_KEY = process.env.FLOUCI_PUBLIC_KEY || "YOUR_FLOUCI_PUBLIC_KEY";
const PRIVATE_KEY = process.env.FLOUCI_PRIVATE_KEY || "YOUR_FLOUCI_PRIVATE_KEY";

/**
 * Generate a Flouci payment link
 * @param {number} amount - Amount in Millimes (1 TND = 1000 Millimes)
 * @param {string} trackingId - Unique internal ID for the transaction
 * @param {string} clientId - Reference for the customer
 * @returns {Object} - { success: true, payment_id, link }
 */
async function generatePayment(amount, trackingId, clientId) {
  try {
    const response = await fetch(`${FLOUCI_API_BASE}/generate_payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PUBLIC_KEY}:${PRIVATE_KEY}`
      },
      body: JSON.stringify({
        amount: amount.toString(),
        developer_tracking_id: trackingId,
        accept_card: true,
        success_link: "tama-clothing://payment-success",
        fail_link: "tama-clothing://payment-fail",
        webhook: "https://your-api-domain.com/api/payment/flouci/webhook",
        client_id: clientId,
      }),
    });

    const data = await response.json();

    if (data && data.result && data.result.success) {
      return {
        success: true,
        payment_id: data.result.payment_id,
        link: data.result.link,
      };
    } else {
      throw new Error(data.message || "Failed to generate payment link");
    }
  } catch (error) {
    console.error("Flouci generatePayment error:", error.message);
    throw new Error("Error communicating with Flouci: " + error.message);
  }
}

/**
 * Verify a Flouci payment status
 * @param {string} paymentId - Flouci payment ID
 * @returns {Object} - { success: true, status: 'SUCCESS'|'PENDING'|'FAILURE' }
 */
async function verifyPayment(paymentId) {
  try {
    const response = await fetch(`${FLOUCI_API_BASE}/verify_payment/${paymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PUBLIC_KEY}:${PRIVATE_KEY}`
      },
    });

    const data = await response.json();

    if (data && data.success) {
      return {
        success: true,
        status: data.result.status,
        amount: data.result.amount,
        trackingId: data.result.developer_tracking_id,
      };
    } else {
      throw new Error(data.message || "Failed to verify payment");
    }
  } catch (error) {
    console.error("Flouci verifyPayment error:", error.message);
    throw new Error("Error verifying payment with Flouci: " + error.message);
  }
}

module.exports = {
  generatePayment,
  verifyPayment,
};
