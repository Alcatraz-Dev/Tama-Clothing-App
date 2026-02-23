import { db, rtdb } from '../api/firebase';
import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    serverTimestamp,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    writeBatch
} from 'firebase/firestore';
import { ref, set, onValue, off, push, update } from 'firebase/database';
import * as Location from 'expo-location';
import {
    Driver,
    Delivery,
    DeliveryBatch,
    DriverMatchResult,
    RouteOptimizationResult,
    GeoPoint,
    DeliveryStatus,
    DriverStatus,
    DriverMetrics,
    DEFAULT_TIME_WINDOWS,
    PRIORITY_LEVELS,
    DeliveryPriority,
    TimeWindow,
    RoutePoint,
    ProofOfDelivery
} from '../types/delivery';

const DRIVERS_COLLECTION = 'Drivers';
const DELIVERIES_COLLECTION = 'Deliveries';
const BATCHES_COLLECTION = 'DeliveryBatches';

export class DeliveryService {
    private locationSubscription: Location.LocationSubscription | null = null;

    async initializeDriver(driverData: Partial<Driver>): Promise<string> {
        const defaultMetrics: DriverMetrics = {
            totalDeliveries: 0,
            completedDeliveries: 0,
            cancelledDeliveries: 0,
            onTimeRate: 100,
            averageRating: 5,
            totalEarnings: 0,
            currentStreak: 0,
            bestStreak: 0,
            weeklyDeliveries: 0,
            monthlyDeliveries: 0,
            totalDistanceKm: 0,
        };

        const docRef = await addDoc(collection(db, DRIVERS_COLLECTION), {
            ...driverData,
            status: 'offline',
            isAvailable: false,
            isVerified: false,
            metrics: defaultMetrics,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return docRef.id;
    }

    async updateDriverStatus(driverId: string, status: DriverStatus, location?: GeoPoint): Promise<void> {
        const updateData: any = {
            status,
            updatedAt: serverTimestamp(),
        };

        if (location) {
            updateData.currentLocation = location;
            updateData.lastActive = serverTimestamp();
        }

        if (status === 'online') {
            updateData.isAvailable = true;
        } else if (status === 'offline') {
            updateData.isAvailable = false;
        }

        await updateDoc(doc(db, DRIVERS_COLLECTION, driverId), updateData);

        const rtdbRef = ref(rtdb, `driverStatus/${driverId}`);
        await set(rtdbRef, {
            status,
            location,
            updatedAt: Date.now(),
        });
    }

    async updateDriverMetrics(driverId: string, updates: Partial<DriverMetrics>): Promise<void> {
        const driverDoc = await getDoc(doc(db, DRIVERS_COLLECTION, driverId));
        if (!driverDoc.exists()) return;

        const currentMetrics = driverDoc.data().metrics || {};
        const newMetrics = { ...currentMetrics, ...updates };

        await updateDoc(doc(db, DRIVERS_COLLECTION, driverId), {
            metrics: newMetrics,
            updatedAt: serverTimestamp(),
        });
    }

    async acceptDelivery(driverId: string, deliveryId: string): Promise<void> {
        const batch = await this.getBatchByDriver(driverId);
        
        const deliveryDoc = await getDoc(doc(db, DELIVERIES_COLLECTION, deliveryId));
        if (!deliveryDoc.exists()) throw new Error('Delivery not found');

        const deliveryData = deliveryDoc.data();

        if (batch && batch.status === 'active') {
            await updateDoc(doc(db, DELIVERIES_COLLECTION, deliveryId), {
                driverId,
                batchId: batch.id,
                status: 'assigned',
                assignedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            const batchDeliveries = [...batch.deliveries, deliveryId];
            const routePoints = await this.getDeliveryLocations(batchDeliveries);
            const optimized = this.optimizeRoute(routePoints);

            await updateDoc(doc(db, BATCHES_COLLECTION, batch.id), {
                deliveries: batchDeliveries,
                route: optimized.optimizedRoute.map(p => p.location),
                optimizedOrder: optimized.optimizedRoute.map(p => p.sequence),
                estimatedDuration: optimized.totalDuration,
                estimatedDistance: optimized.totalDistance,
            });
        } else {
            const newBatch = await this.createBatch(driverId, [deliveryId]);
            
            await updateDoc(doc(db, DELIVERIES_COLLECTION, deliveryId), {
                driverId,
                batchId: newBatch.id,
                status: 'assigned',
                assignedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }

        await updateDoc(doc(db, DRIVERS_COLLECTION, driverId), {
            status: 'busy',
            isAvailable: false,
            currentDeliveryId: deliveryId,
            updatedAt: serverTimestamp(),
        });
    }

    async createBatch(driverId: string, deliveryIds: string[]): Promise<DeliveryBatch> {
        const routePoints = await this.getDeliveryLocations(deliveryIds);
        const optimized = this.optimizeRoute(routePoints);

        const batchDoc = await addDoc(collection(db, BATCHES_COLLECTION), {
            driverId,
            status: 'pending',
            deliveries: deliveryIds,
            route: optimized.optimizedRoute.map(p => p.location),
            optimizedOrder: optimized.optimizedRoute.map(p => p.sequence),
            estimatedDuration: optimized.totalDuration,
            estimatedDistance: optimized.totalDistance,
            createdAt: serverTimestamp(),
        });

        for (const deliveryId of deliveryIds) {
            await updateDoc(doc(db, DELIVERIES_COLLECTION, deliveryId), {
                batchId: batchDoc.id,
            });
        }

        return {
            id: batchDoc.id,
            driverId,
            status: 'pending',
            deliveries: deliveryIds,
            route: optimized.optimizedRoute.map(p => p.location),
            optimizedOrder: optimized.optimizedRoute.map(p => p.sequence),
            estimatedDuration: optimized.totalDuration,
            estimatedDistance: optimized.totalDistance,
            createdAt: new Date(),
        };
    }

    async getDeliveryLocations(deliveryIds: string[]): Promise<RoutePoint[]> {
        const points: RoutePoint[] = [];
        
        for (let i = 0; i < deliveryIds.length; i++) {
            const deliveryDoc = await getDoc(doc(db, DELIVERIES_COLLECTION, deliveryIds[i]));
            if (!deliveryDoc.exists()) continue;
            
            const data = deliveryDoc.data();
            
            if (data.senderLocation) {
                points.push({
                    location: data.senderLocation,
                    type: 'pickup',
                    deliveryId: deliveryIds[i],
                    sequence: i * 2,
                });
            }
            
            if (data.deliveryLocation) {
                points.push({
                    location: data.deliveryLocation,
                    type: 'delivery',
                    deliveryId: deliveryIds[i],
                    sequence: i * 2 + 1,
                });
            }
        }
        
        return points;
    }

    optimizeRoute(points: RoutePoint[]): RouteOptimizationResult {
        if (points.length <= 2) {
            const totalDistance = this.calculateTotalDistance(points.map(p => p.location));
            const totalDuration = totalDistance / 30 * 60;
            return {
                totalDistance,
                totalDuration,
                optimizedRoute: points,
                savings: { distanceSaved: 0, timeSaved: 0 },
            };
        }

        const optimized = this.nearestNeighborRoute(points);
        const originalDistance = this.calculateTotalDistance(points.map(p => p.location));
        const optimizedDistance = this.calculateTotalDistance(optimized.map(p => p.location));
        
        return {
            totalDistance: optimizedDistance,
            totalDuration: optimizedDistance / 30 * 60,
            optimizedRoute: optimized,
            savings: {
                distanceSaved: originalDistance - optimizedDistance,
                timeSaved: ((originalDistance - optimizedDistance) / 30) * 60,
            },
        };
    }

    private nearestNeighborRoute(points: RoutePoint[]): RoutePoint[] {
        if (points.length === 0) return [];
        
        const result: RoutePoint[] = [points[0]];
        const remaining = points.slice(1);
        
        while (remaining.length > 0) {
            const last = result[result.length - 1];
            let nearestIndex = 0;
            let nearestDistance = Infinity;
            
            for (let i = 0; i < remaining.length; i++) {
                const distance = this.calculateDistance(
                    last.location.latitude,
                    last.location.longitude,
                    remaining[i].location.latitude,
                    remaining[i].location.longitude
                );
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }
            
            result.push(remaining[nearestIndex]);
            remaining.splice(nearestIndex, 1);
        }
        
        return result.map((p, i) => ({ ...p, sequence: i }));
    }

    async findBestDrivers(
        deliveryLocation: GeoPoint,
        deliveryZone: string,
        vehicleCapacity: number,
        count: number = 5
    ): Promise<DriverMatchResult[]> {
        const driversQuery = query(
            collection(db, DRIVERS_COLLECTION),
            where('isAvailable', '==', true),
            where('serviceAreas', 'array-contains', deliveryZone),
            orderBy('metrics.averageRating', 'desc'),
            limit(20)
        );

        const snapshot = await getDocs(driversQuery);
        const drivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Driver[];

        const results: DriverMatchResult[] = [];

        for (const driver of drivers) {
            if (!driver.currentLocation || driver.vehicleCapacity < vehicleCapacity) continue;

            const distanceToPickup = this.calculateDistance(
                driver.currentLocation.latitude,
                driver.currentLocation.longitude,
                deliveryLocation.latitude,
                deliveryLocation.longitude
            );

            const pickupTime = (distanceToPickup / 30) * 60;
            
            const score = this.calculateDriverScore(driver, distanceToPickup);

            results.push({
                driver,
                score,
                estimatedPickupTime: pickupTime,
                estimatedDeliveryTime: pickupTime + 15,
                distanceToPickup,
                reasons: this.getMatchReasons(driver, distanceToPickup),
            });
        }

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, count);
    }

    private calculateDriverScore(driver: Driver, distanceToPickup: number): number {
        let score = 100;

        const ratingWeight = driver.metrics.averageRating * 10;
        score += ratingWeight;

        const onTimeWeight = driver.metrics.onTimeRate * 0.5;
        score += onTimeWeight;

        if (driver.metrics.currentStreak > 5) {
            score += driver.metrics.currentStreak * 2;
        }

        const distancePenalty = Math.min(distanceToPickup * 2, 30);
        score -= distancePenalty;

        const workloadPenalty = driver.metrics.weeklyDeliveries * 0.5;
        score -= workloadPenalty;

        return Math.max(0, Math.min(150, score));
    }

    private getMatchReasons(driver: Driver, distanceToPickup: number): string[] {
        const reasons: string[] = [];

        if (driver.metrics.averageRating >= 4.5) {
            reasons.push('Excellent rating');
        }
        if (driver.metrics.onTimeRate >= 95) {
            reasons.push('High on-time rate');
        }
        if (driver.metrics.currentStreak >= 3) {
            reasons.push(`${driver.metrics.currentStreak} delivery streak`);
        }
        if (distanceToPickup < 2) {
            reasons.push('Very close to pickup');
        } else if (distanceToPickup < 5) {
            reasons.push('Nearby pickup location');
        }

        return reasons;
    }

    async autoAssignDelivery(deliveryId: string): Promise<DriverMatchResult | null> {
        const deliveryDoc = await getDoc(doc(db, DELIVERIES_COLLECTION, deliveryId));
        if (!deliveryDoc.exists()) return null;

        const delivery = deliveryDoc.data() as Delivery;

        if (!delivery.deliveryLocation || !delivery.zoneId) return null;

        const bestDrivers = await this.findBestDrivers(
            delivery.deliveryLocation,
            delivery.zoneId,
            delivery.weight,
            1
        );

        if (bestDrivers.length === 0) return null;

        const bestDriver = bestDrivers[0];
        
        await this.acceptDelivery(bestDriver.driver.id, deliveryId);

        return bestDriver;
    }

    async groupNearbyDeliveries(deliveryZone: string, maxDistance: number = 5): Promise<string[][]> {
        const pendingQuery = query(
            collection(db, DELIVERIES_COLLECTION),
            where('status', '==', 'pending'),
            where('zoneId', '==', deliveryZone)
        );

        const snapshot = await getDocs(pendingQuery);
        const deliveries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Delivery[];

        const groups: string[][] = [];
        const assigned = new Set<string>();

        for (const delivery of deliveries) {
            if (assigned.has(delivery.id) || !delivery.deliveryLocation) continue;

            const group = [delivery.id];
            assigned.add(delivery.id);

            for (const other of deliveries) {
                if (assigned.has(other.id) || !other.deliveryLocation) continue;

                const distance = this.calculateDistance(
                    delivery.deliveryLocation.latitude,
                    delivery.deliveryLocation.longitude,
                    other.deliveryLocation.latitude,
                    other.deliveryLocation.longitude
                );

                if (distance <= maxDistance) {
                    group.push(other.id);
                    assigned.add(other.id);
                }
            }

            if (group.length > 1 || (group.length === 1 && delivery.priority === 'urgent')) {
                groups.push(group);
            }
        }

        return groups;
    }

    async startDelivery(driverId: string, deliveryId: string): Promise<void> {
        await updateDoc(doc(db, DELIVERIES_COLLECTION, deliveryId), {
            status: 'in_transit',
            pickedUpAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            timeline: {
                status: 'in_transit',
                timestamp: new Date(),
            },
        });

        await this.startLocationTracking(driverId, deliveryId);
    }

    async completeDelivery(
        deliveryId: string, 
        driverId: string, 
        proof: ProofOfDelivery
    ): Promise<void> {
        const deliveryDoc = await getDoc(doc(db, DELIVERIES_COLLECTION, deliveryId));
        if (!deliveryDoc.exists()) throw new Error('Delivery not found');

        const delivery = deliveryDoc.data();
        const driverDoc = await getDoc(doc(db, DRIVERS_COLLECTION, driverId));
        
        if (!driverDoc.exists()) throw new Error('Driver not found');
        
        const driverMetrics = driverDoc.data().metrics;

        await updateDoc(doc(db, DELIVERIES_COLLECTION, deliveryId), {
            status: 'delivered',
            deliveredAt: serverTimestamp(),
            proofOfDelivery: proof,
            updatedAt: serverTimestamp(),
        });

        await this.updateDriverMetrics(driverId, {
            totalDeliveries: driverMetrics.totalDeliveries + 1,
            completedDeliveries: driverMetrics.completedDeliveries + 1,
            currentStreak: driverMetrics.currentStreak + 1,
            bestStreak: Math.max(driverMetrics.bestStreak, driverMetrics.currentStreak + 1),
            weeklyDeliveries: driverMetrics.weeklyDeliveries + 1,
            monthlyDeliveries: driverMetrics.monthlyDeliveries + 1,
        });

        await this.checkBatchCompletion(driverId, deliveryId);
    }

    async rateDelivery(deliveryId: string, rating: number, comment?: string): Promise<void> {
        const deliveryDoc = await getDoc(doc(db, DELIVERIES_COLLECTION, deliveryId));
        if (!deliveryDoc.exists() || !deliveryDoc.data().driverId) return;

        const driverId = deliveryDoc.data().driverId;
        const driverDoc = await getDoc(doc(db, DRIVERS_COLLECTION, driverId));
        
        if (!driverDoc.exists()) return;

        const currentMetrics = driverDoc.data().metrics;
        const newRatingCount = currentMetrics.totalDeliveries;
        const newAverageRating = (
            (currentMetrics.averageRating * newRatingCount + rating) / 
            (newRatingCount + 1)
        );

        await updateDoc(doc(db, DELIVERIES_COLLECTION, deliveryId), {
            rating,
            ratingComment: comment,
        });

        await this.updateDriverMetrics(driverId, {
            averageRating: newAverageRating,
        });
    }

    private async checkBatchCompletion(driverId: string, completedDeliveryId: string): Promise<void> {
        const batchQuery = query(
            collection(db, BATCHES_COLLECTION),
            where('driverId', '==', driverId),
            where('status', '==', 'active')
        );

        const snapshot = await getDocs(batchQuery);
        
        for (const batchDoc of snapshot.docs) {
            const batch = { id: batchDoc.id, ...batchDoc.data() } as DeliveryBatch;
            
            if (batch.deliveries.includes(completedDeliveryId)) {
                const deliveryStatuses = await Promise.all(
                    batch.deliveries.map(async (id) => {
                        const dDoc = await getDoc(doc(db, DELIVERIES_COLLECTION, id));
                        return dDoc.exists() && dDoc.data()?.status === 'delivered';
                    })
                );

                const allDelivered = deliveryStatuses.every(status => status);

                if (allDelivered) {
                    await updateDoc(doc(db, BATCHES_COLLECTION, batch.id), {
                        status: 'completed',
                        completedAt: serverTimestamp(),
                    });

                    await updateDoc(doc(db, DRIVERS_COLLECTION, driverId), {
                        status: 'online',
                        isAvailable: true,
                        currentBatchId: null,
                        currentDeliveryId: null,
                    });
                }
            }
        }
    }

    private async getBatchByDriver(driverId: string): Promise<DeliveryBatch | null> {
        const batchQuery = query(
            collection(db, BATCHES_COLLECTION),
            where('driverId', '==', driverId),
            where('status', '==', 'active'),
            limit(1)
        );

        const snapshot = await getDocs(batchQuery);
        if (snapshot.empty) return null;

        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as DeliveryBatch;
    }

    async startLocationTracking(driverId: string, deliveryId: string): Promise<() => void> {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
            throw new Error('Location permission denied');
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        const updateLocation = async () => {
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const locationData: GeoPoint = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            };

            await this.updateDeliveryLocation(deliveryId, locationData);
            
            await updateDoc(doc(db, DRIVERS_COLLECTION, driverId), {
                currentLocation: locationData,
                lastActive: serverTimestamp(),
            });

            const rtdbRef = ref(rtdb, `driverLocation/${driverId}`);
            await set(rtdbRef, {
                ...locationData,
                timestamp: Date.now(),
                deliveryId,
            });
        };

        updateLocation();
        
        this.locationSubscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                distanceInterval: 10,
                timeInterval: 5000,
            },
            async (loc) => {
                const locationData: GeoPoint = {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                };

                await this.updateDeliveryLocation(deliveryId, locationData);

                const rtdbRef = ref(rtdb, `driverLocation/${driverId}`);
                await set(rtdbRef, {
                    ...locationData,
                    timestamp: Date.now(),
                    deliveryId,
                });
            }
        );

        return () => {
            if (this.locationSubscription) {
                this.locationSubscription.remove();
            }
        };
    }

    stopLocationTracking(): void {
        if (this.locationSubscription) {
            this.locationSubscription.remove();
            this.locationSubscription = null;
        }
    }

    async updateDeliveryLocation(deliveryId: string, location: GeoPoint): Promise<void> {
        const rtdbRef = ref(rtdb, `tracking/${deliveryId}/location`);
        await set(rtdbRef, {
            ...location,
            timestamp: Date.now(),
        });

        await updateDoc(doc(db, DELIVERIES_COLLECTION, deliveryId), {
            currentLocation: location,
            updatedAt: serverTimestamp(),
        });
    }

    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    calculateTotalDistance(points: GeoPoint[]): number {
        let total = 0;
        for (let i = 0; i < points.length - 1; i++) {
            total += this.calculateDistance(
                points[i].latitude,
                points[i].longitude,
                points[i + 1].latitude,
                points[i + 1].longitude
            );
        }
        return total;
    }

    calculatePrice(
        distance: number,
        weight: number,
        timeWindow?: TimeWindow,
        priority: DeliveryPriority = 'normal'
    ): { basePrice: number; distancePrice: number; timeWindowCost: number; priorityCost: number; total: number } {
        const basePrice = 8;
        const pricePerKg = 0.5;
        const pricePerKm = 1.5;

        const distancePrice = distance * pricePerKm;
        const weightPrice = weight * pricePerKg;
        const timeWindowCost = timeWindow?.additionalCost || 0;
        const priorityCost = basePrice * (PRIORITY_LEVELS[priority].multiplier - 1);

        const total = basePrice + distancePrice + weightPrice + timeWindowCost + priorityCost;

        return {
            basePrice,
            distancePrice: Math.max(0, distancePrice - 5),
            timeWindowCost,
            priorityCost,
            total: Math.round(total * 100) / 100,
        };
    }

    subscribeToDriverLocation(driverId: string, callback: (location: GeoPoint | null) => void): () => void {
        const rtdbRef = ref(rtdb, `driverLocation/${driverId}`);
        
        onValue(rtdbRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                callback({
                    latitude: data.latitude,
                    longitude: data.longitude,
                });
            } else {
                callback(null);
            }
        });

        return () => off(rtdbRef);
    }

    subscribeToDelivery(deliveryId: string, callback: (delivery: Partial<Delivery> | null) => void): () => void {
        const unsubscribe = onSnapshot(doc(db, DELIVERIES_COLLECTION, deliveryId), (snapshot) => {
            if (snapshot.exists()) {
                callback({ id: snapshot.id, ...snapshot.data() });
            } else {
                callback(null);
            }
        });

        return unsubscribe;
    }

    subscribeToDriverDeliveries(driverId: string, callback: (deliveries: Delivery[]) => void): () => void {
        const q = query(
            collection(db, DELIVERIES_COLLECTION),
            where('driverId', '==', driverId),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const deliveries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Delivery[];
            callback(deliveries);
        });
    }

    subscribeToPendingDeliveries(zoneId: string, callback: (deliveries: Delivery[]) => void): () => void {
        const q = query(
            collection(db, DELIVERIES_COLLECTION),
            where('status', '==', 'pending'),
            where('zoneId', '==', zoneId),
            orderBy('priority', 'desc'),
            orderBy('createdAt', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const deliveries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Delivery[];
            callback(deliveries);
        });
    }
}

export const deliveryService = new DeliveryService();
