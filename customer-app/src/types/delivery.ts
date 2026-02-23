export type DriverStatus = 'offline' | 'online' | 'busy' | 'on_delivery';

export type DeliveryPriority = 'low' | 'normal' | 'high' | 'urgent';

export type DeliveryStatus = 
    | 'pending' 
    | 'assigned' 
    | 'picked_up' 
    | 'in_transit' 
    | 'out_for_delivery' 
    | 'delivered' 
    | 'cancelled'
    | 'failed';

export interface GeoPoint {
    latitude: number;
    longitude: number;
}

export interface DeliveryZone {
    id: string;
    name: string;
    boundaries: GeoPoint[];
    basePrice: number;
    pricePerKm: number;
    estimatedDeliveryTime: number;
}

export interface TimeWindow {
    start: string;
    end: string;
    label: string;
    additionalCost: number;
}

export interface DriverMetrics {
    totalDeliveries: number;
    completedDeliveries: number;
    cancelledDeliveries: number;
    onTimeRate: number;
    averageRating: number;
    totalEarnings: number;
    currentStreak: number;
    bestStreak: number;
    weeklyDeliveries: number;
    monthlyDeliveries: number;
    totalDistanceKm: number;
}

export interface Driver {
    id: string;
    uid: string;
    fullName: string;
    phone: string;
    email?: string;
    profileImage?: string;
    status: DriverStatus;
    currentLocation?: GeoPoint;
    lastActive?: Date;
    
    vehicleType: 'car' | 'motorcycle' | 'bicycle' | 'van';
    vehiclePlate?: string;
    vehicleCapacity: number;
    
    serviceAreas: string[];
    
    metrics: DriverMetrics;
    
    isVerified: boolean;
    isAvailable: boolean;
    
    currentDeliveryId?: string;
    currentBatchId?: string;
    
    createdAt: Date;
    updatedAt: Date;
}

export interface DeliveryBatch {
    id: string;
    driverId: string;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    deliveries: string[];
    route: GeoPoint[];
    optimizedOrder: number[];
    estimatedDuration: number;
    estimatedDistance: number;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
}

export interface Delivery {
    id: string;
    trackingId: string;
    orderId?: string;
    
    senderId: string;
    senderName: string;
    senderPhone: string;
    senderAddress: string;
    senderLocation?: GeoPoint;
    
    receiverName: string;
    receiverPhone: string;
    deliveryAddress: string;
    deliveryLocation?: GeoPoint;
    
    zoneId?: string;
    
    items: DeliveryItem[];
    weight: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
    
    status: DeliveryStatus;
    priority: DeliveryPriority;
    
    driverId?: string;
    batchId?: string;
    
    scheduledDate?: string;
    timeWindow?: TimeWindow;
    estimatedDeliveryTime?: Date;
    
    route: GeoPoint[];
    
    currentLocation?: GeoPoint;
    
    proofOfDelivery?: ProofOfDelivery;
    
    rating?: number;
    ratingComment?: string;
    
    pricing: {
        basePrice: number;
        distancePrice: number;
        timeWindowCost: number;
        priorityCost: number;
        total: number;
    };
    
    timeline: DeliveryTimelineEvent[];
    
    notes?: string;
    specialInstructions?: string;
    
    createdAt: Date;
    updatedAt: Date;
    assignedAt?: Date;
    pickedUpAt?: Date;
    deliveredAt?: Date;
}

export interface DeliveryItem {
    name: string;
    quantity: number;
    weight?: number;
    price?: number;
    sku?: string;
    imageUrl?: string;
}

export interface ProofOfDelivery {
    photoUrl?: string;
    signatureUrl?: string;
    recipientName?: string;
    notes?: string;
    verified: boolean;
    verifiedAt?: Date;
}

export interface DeliveryTimelineEvent {
    status: DeliveryStatus;
    timestamp: Date;
    location?: GeoPoint;
    notes?: string;
}

export interface DriverMatchResult {
    driver: Driver;
    score: number;
    estimatedPickupTime: number;
    estimatedDeliveryTime: number;
    distanceToPickup: number;
    reasons: string[];
}

export interface RoutePoint {
    location: GeoPoint;
    type: 'pickup' | 'delivery';
    deliveryId: string;
    sequence: number;
    estimatedArrival?: Date;
    actualArrival?: Date;
}

export interface RouteOptimizationResult {
    totalDistance: number;
    totalDuration: number;
    optimizedRoute: RoutePoint[];
    savings: {
        distanceSaved: number;
        timeSaved: number;
    };
}

export const DEFAULT_TIME_WINDOWS: TimeWindow[] = [
    { start: '09:00', end: '12:00', label: 'Morning (9AM-12PM)', additionalCost: 0 },
    { start: '12:00', end: '14:00', label: 'Midday (12PM-2PM)', additionalCost: 0 },
    { start: '14:00', end: '17:00', label: 'Afternoon (2PM-5PM)', additionalCost: 0 },
    { start: '17:00', end: '20:00', label: 'Evening (5PM-8PM)', additionalCost: 2 },
    { start: '20:00', end: '22:00', label: 'Night (8PM-10PM)', additionalCost: 5 },
];

export const PRIORITY_LEVELS: Record<DeliveryPriority, { multiplier: number; label: string }> = {
    low: { multiplier: 0.8, label: 'Low Priority' },
    normal: { multiplier: 1.0, label: 'Normal' },
    high: { multiplier: 1.3, label: 'High Priority' },
    urgent: { multiplier: 1.5, label: 'Urgent' },
};
