/**
 * StripePaymentService - Wallet recharge via Stripe
 */
import { Platform } from "react-native";

interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

interface RechargeOption {
  id: string;
  coins: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

const RECHARGE_OPTIONS: RechargeOption[] = [
  { id: "pack_100", coins: 100, price: 0.99, bonus: 0 },
  { id: "pack_500", coins: 500, price: 4.99, bonus: 25 },
  { id: "pack_1000", coins: 1000, price: 9.99, bonus: 100, popular: true },
  { id: "pack_2500", coins: 2500, price: 24.99, bonus: 300 },
  { id: "pack_5000", coins: 5000, price: 49.99, bonus: 750 },
  { id: "pack_10000", coins: 10000, price: 99.99, bonus: 2000 },
];

class StripePaymentService {
  private static instance: StripePaymentService;
  private stripe: any = null;

  static getInstance(): StripePaymentService {
    if (!StripePaymentService.instance) {
      StripePaymentService.instance = new StripePaymentService();
    }
    return StripePaymentService.instance;
  }

  async initialize(): Promise<void> {
    // Initialize Stripe with publishable key
    // In production: this.stripe = await loadStripe(EXPO_PUBLIC_STRIPE_KEY);
    console.log("[Stripe] Initialized (demo mode)");
  }

  getRechargeOptions(): RechargeOption[] {
    return RECHARGE_OPTIONS;
  }

  async createPaymentIntent(amount: number, currency: string = "usd"): Promise<PaymentIntent> {
    // In production, this would call your backend to create a Stripe PaymentIntent
    // Backend would use: stripe.paymentIntents.create({ amount, currency })
    
    console.log(`[Stripe] Creating payment intent for ${amount} ${currency}`);
    
    // Demo mode - simulate successful payment
    return {
      clientSecret: "pi_demo_" + Date.now() + "_secret",
      amount,
      currency,
    };
  }

  async processPayment(
    paymentIntentClientSecret: string,
    cardDetails: {
      number: string;
      expMonth: number;
      expYear: number;
      cvc: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    // In production, use:
    // const { error, paymentIntent } = await this.stripe.confirmCardPayment(
    //   paymentIntentClientSecret,
    //   { payment_method: { card: cardElement } }
    // );

    // Demo mode - simulate successful payment
    console.log("[Stripe] Processing payment (demo)");
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    return { success: true };
  }

  // Apple Pay / Google Pay
  async checkWalletAvailability(): Promise<{
    applePay: boolean;
    googlePay: boolean;
  }> {
    return {
      applePay: Platform.OS === "ios",
      googlePay: Platform.OS === "android",
    };
  }

  async processWalletPayment(
    amount: number,
    walletType: "apple" | "google"
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // In production, use:
    // if (walletType === 'apple') {
    //   const { error, paymentMethod } = await stripe.applePay.createPaymentMethod({...});
    // } else {
    //   const { error, paymentMethod } = await stripe.googlePay.createPaymentMethod({...});
    // }

    console.log(`[Stripe] Processing ${walletType} payment for ${amount}`);

    // Demo mode
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      transactionId: "txn_demo_" + Date.now(),
    };
  }
}

export const stripePaymentService = StripePaymentService.getInstance();
export default StripePaymentService;