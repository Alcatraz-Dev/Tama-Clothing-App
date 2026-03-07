/**
 * Coupon and Discount Calculation Utilities
 * Supports: percentage, fixed amount, free shipping, and bundle price discounts
 */

export type CouponType = 'percentage' | 'fixed' | 'free_shipping' | 'bundle_price';

export interface Coupon {
    id?: string;
    code: string;
    type: CouponType;
    value: number;
    minOrder?: number;
    isActive?: boolean;
    brandId?: string;
    targetProductId?: string;
    tiers?: { qty: number; price: number }[];
    [key: string]: any;
}

/**
 * Calculate the discount amount based on coupon type
 * @param coupon - The coupon object
 * @param orderTotal - The total order amount before discount
 * @returns The discount amount in TND
 */
export function calculateDiscount(coupon: Coupon, orderTotal: number): number {
    if (!coupon || !coupon.isActive) return 0;
    
    // Check minimum order requirement
    if (coupon.minOrder && orderTotal < coupon.minOrder) {
        return 0;
    }

    switch (coupon.type) {
        case 'percentage':
            // Percentage discount: value% of order total
            return (orderTotal * coupon.value) / 100;

        case 'fixed':
            // Fixed amount discount: directly subtract value
            // Cannot exceed order total
            return Math.min(coupon.value, orderTotal);

        case 'free_shipping':
            // Free shipping is handled separately in shipping calculation
            return 0;

        case 'bundle_price':
            // Bundle pricing is calculated differently based on quantity tiers
            return 0;

        default:
            return 0;
    }
}

/**
 * Calculate final price after applying coupon
 * @param coupon - The coupon object
 * @param orderTotal - The total order amount before discount
 * @param shippingCost - Optional shipping cost (for free shipping coupons)
 * @returns The final price after all discounts
 */
export function calculateFinalPrice(
    coupon: Coupon | null, 
    orderTotal: number, 
    shippingCost: number = 0
): number {
    let finalPrice = orderTotal;

    // Apply coupon discount if valid
    if (coupon) {
        const discount = calculateDiscount(coupon, orderTotal);
        finalPrice -= discount;
    }

    // Apply free shipping if applicable
    if (coupon?.type === 'free_shipping') {
        finalPrice -= shippingCost;
    }

    // Ensure price doesn't go below 0
    return Math.max(0, finalPrice);
}

/**
 * Validate if a coupon can be applied to an order
 * @param coupon - The coupon to validate
 * @param orderTotal - The total order amount
 * @returns Object with isValid and error message (if invalid)
 */
export function validateCoupon(coupon: Coupon, orderTotal: number): { isValid: boolean; error?: string } {
    if (!coupon) {
        return { isValid: false, error: 'Coupon not found' };
    }

    if (!coupon.isActive) {
        return { isValid: false, error: 'Coupon is no longer active' };
    }

    if (coupon.minOrder && orderTotal < coupon.minOrder) {
        return { 
            isValid: false, 
            error: `Minimum order of ${coupon.minOrder} TND required` 
        };
    }

    if (coupon.type === 'percentage') {
        if (coupon.value <= 0 || coupon.value > 100) {
            return { isValid: false, error: 'Invalid percentage value' };
        }
    }

    if (coupon.type === 'fixed') {
        if (coupon.value <= 0) {
            return { isValid: false, error: 'Invalid discount amount' };
        }
        if (coupon.value > orderTotal) {
            return { 
                isValid: false, 
                error: `Discount cannot exceed order total (${orderTotal} TND)` 
            };
        }
    }

    return { isValid: true };
}

/**
 * Calculate bundle price based on quantity tiers
 * @param coupon - The bundle price coupon
 * @param quantity - The quantity being purchased
 * @returns The bundle price for the given quantity
 */
export function calculateBundlePrice(coupon: Coupon, quantity: number): number {
    if (coupon.type !== 'bundle_price' || !coupon.tiers) {
        return 0;
    }

    // Find the applicable tier based on quantity
    const sortedTiers = [...coupon.tiers].sort((a, b) => b.qty - a.qty);
    const applicableTier = sortedTiers.find(tier => quantity >= tier.qty);

    if (!applicableTier) {
        return 0;
    }

    return applicableTier.price * quantity;
}

/**
 * Format discount value for display
 * @param coupon - The coupon with discount value
 * @returns Formatted string like "20% OFF" or "10 TND OFF"
 */
export function formatDiscountDisplay(coupon: Coupon): string {
    switch (coupon.type) {
        case 'percentage':
            return `${coupon.value}% OFF`;
        case 'fixed':
            return `${coupon.value} TND OFF`;
        case 'free_shipping':
            return 'FREE SHIPPING';
        case 'bundle_price':
            return 'BUNDLE PRICE';
        default:
            return '';
    }
}
