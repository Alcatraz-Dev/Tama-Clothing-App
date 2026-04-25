/**
 * Flouci Payment Service
 * Integration with Flouci (Tunisian Payment Gateway)
 */

const axios = require("axios");

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
    const response = await axios.post(
      `${FLOUCI_API_BASE}/generate_payment`,
      {
        amount: amount.toString(),
        developer_tracking_id: trackingId,
        accept_card: true,
        success_link: "tama-clothing://payment-success",
        fail_link: "tama-clothing://payment-fail",
        webhook: "https://your-api-domain.com/api/payment/flouci/webhook",
        client_id: clientId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PUBLIC_KEY}:${PRIVATE_KEY}`,
        },
      },
    );

    if (response.data && response.data.result && response.data.result.success) {
      return {
        success: true,
        payment_id: response.data.result.payment_id,
        link: response.data.result.link,
      };
    } else {
      throw new Error(
        response.data.message || "Failed to generate payment link",
      );
    }
  } catch (error) {
    console.error(
      "Flouci generatePayment error:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.message || "Error communicating with Flouci",
    );
  }
}

/**
 * Verify a Flouci payment status
 * @param {string} paymentId - Flouci payment ID
 * @returns {Object} - { success: true, status: 'SUCCESS'|'PENDING'|'FAILURE' }
 */
async function verifyPayment(paymentId) {
  try {
    const response = await axios.get(
      `${FLOUCI_API_BASE}/verify_payment/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${PUBLIC_KEY}:${PRIVATE_KEY}`,
        },
      },
    );

    if (response.data && response.data.success) {
      return {
        success: true,
        status: response.data.result.status,
        amount: response.data.result.amount,
        trackingId: response.data.result.developer_tracking_id,
      };
    } else {
      throw new Error("Failed to verify payment");
    }
  } catch (error) {
    console.error(
      "Flouci verifyPayment error:",
      error.response?.data || error.message,
    );
    throw new Error("Error verifying payment with Flouci");
  }
}

module.exports = {
  generatePayment,
  verifyPayment,
};
