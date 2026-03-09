import { db } from '../api/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Types
export interface Campaign {
  id: string;
  name: { fr: string; 'ar-tn': string };
  description?: { fr: string; 'ar-tn': string };
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: Timestamp;
  endDate: Timestamp;
  rewardType: string;
  rewardValue: any;
  isPublic: boolean;
  maxParticipants: number;
  currentParticipants: number;
  metrics: {
    totalScans: number;
    uniqueParticipants: number;
    treasuresFound: number;
    rewardsClaimed: number;
  };
}

export interface TreasureLocation {
  id: string;
  campaignId: string;
  name: { fr: string; 'ar-tn': string };
  hint?: { fr: string; 'ar-tn': string };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  qrCode: string;
  rewardType: string;
  rewardValue: any;
  order: number;
  radius: number;
  isActive: boolean;
  isDiscoverable: boolean;
  startDate?: Timestamp;
  endDate?: Timestamp;
  discoveryOrder?: 'sequential' | 'any';
  specialReward?: 'none' | 'first_finder' | 'top3' | 'top10';
  bonusRewardValue?: number;
  bonusRewardValue2?: number;
  bonusRewardValue3?: number;
}

export interface Participation {
  id: string;
  campaignId: string;
  userId: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'abandoned';
  progress: {
    totalLocations: number;
    discoveredLocations: number;
    discoveredLocationIds: string[];
    currentLocationId: string | null;
  };
  claimedRewards: any[];
  finalReward: any;
  enrolledAt: Timestamp;
  completedAt?: Timestamp;
}

class TreasureHuntService {
  // Get all active public campaigns
  async getActiveCampaigns(): Promise<Campaign[]> {
    try {
      const now = Timestamp.now();
      // First get all active public campaigns, then filter by dates in memory
      // This is needed because Firestore doesn't support multiple range filters
      const q = query(
        collection(db, 'treasure_campaigns'),
        where('status', '==', 'active'),
        where('isPublic', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const campaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Campaign[];

      // Filter by date in memory - show campaign if:
      // 1. No start date is set (show immediately)
      // 2. Start date is in the past
      // 3. Current time is within campaign period
      return campaigns.filter(campaign => {
        const startDate = campaign.startDate as Timestamp | undefined;
        const endDate = campaign.endDate as Timestamp | undefined;
        
        // If no start date, show the campaign
        if (!startDate) return true;
        
        const startSeconds = startDate?.seconds || 0;
        
        // If no end date, show if started
        if (!endDate) return now.seconds >= startSeconds;
        
        const endSeconds = endDate?.seconds || 0;
        
        // Show if current time is between start and end
        return now.seconds >= startSeconds && now.seconds <= endSeconds;
      }).sort((a, b) => {
        // Sort by start date, most recent first
        const aDate = a.startDate as Timestamp | undefined;
        const bDate = b.startDate as Timestamp | undefined;
        const aSeconds = aDate?.seconds || 0;
        const bSeconds = bDate?.seconds || 0;
        return bSeconds - aSeconds;
      });
    } catch (error) {
      console.error('Error fetching active campaigns:', error);
      return [];
    }
  }

  // Get all public campaigns (including future ones) for countdown display
  async getAllPublicCampaigns(): Promise<Campaign[]> {
    try {
      const q = query(
        collection(db, 'treasure_campaigns'),
        where('isPublic', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const campaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Campaign[];

      // Sort by start date - upcoming first
      return campaigns.sort((a, b) => {
        const aDate = a.startDate as Timestamp | undefined;
        const bDate = b.startDate as Timestamp | undefined;
        const aSeconds = aDate?.seconds || 0;
        const bSeconds = bDate?.seconds || 0;
        // If no start date, put it at the end
        if (aSeconds === 0) return 1;
        if (bSeconds === 0) return -1;
        return aSeconds - bSeconds;
      });
    } catch (error) {
      console.error('Error fetching public campaigns:', error);
      return [];
    }
  }

  // Get campaign by ID
  async getCampaign(campaignId: string): Promise<Campaign | null> {
    try {
      const docRef = doc(db, 'treasure_campaigns', campaignId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Campaign;
      }
      return null;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      return null;
    }
  }

  // Get locations for a campaign
  async getLocations(campaignId: string): Promise<TreasureLocation[]> {
    try {
      const q = query(
        collection(db, 'treasure_locations'),
        where('campaignId', '==', campaignId),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TreasureLocation[];
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  }

  // Get user's participation in a campaign
  async getParticipation(campaignId: string, userId: string): Promise<Participation | null> {
    try {
      const q = query(
        collection(db, 'treasure_participations'),
        where('campaignId', '==', campaignId),
        where('userId', '==', userId),
        orderBy('enrolledAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Participation;
      }
      return null;
    } catch (error) {
      console.error('Error fetching participation:', error);
      return null;
    }
  }

  // Get all user participations
  async getUserParticipations(userId: string): Promise<Participation[]> {
    try {
      const q = query(
        collection(db, 'treasure_participations'),
        where('userId', '==', userId),
        orderBy('enrolledAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Participation[];
    } catch (error) {
      console.error('Error fetching participations:', error);
      return [];
    }
  }

  // Enroll in a campaign
  async enrollInCampaign(campaignId: string, userId: string): Promise<Participation | null> {
    try {
      // Check if already enrolled
      const existing = await this.getParticipation(campaignId, userId);
      if (existing) {
        throw new Error('Already enrolled in this campaign');
      }

      // Get campaign locations (optional - allow enrollment without locations)
      const locations = await this.getLocations(campaignId);
      
      // If no locations, create participation without current location
      const firstLocation = locations.length > 0 ? locations[0] : null;

      // Create participation
      const participationData = {
        campaignId,
        userId,
        status: locations.length > 0 ? 'in_progress' : 'pending',
        progress: {
          totalLocations: locations.length,
          discoveredLocations: 0,
          discoveredLocationIds: [] as string[],
          currentLocationId: firstLocation?.id || null
        },
        claimedRewards: [],
        finalReward: null,
        metrics: {
          timeSpentMinutes: 0,
          hintsUsed: 0,
          socialShares: 0
        },
        enrolledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'treasure_participations'), participationData);

      // Update campaign participant count
      await updateDoc(doc(db, 'treasure_campaigns', campaignId), {
        currentParticipants: 1 // This should use increment in real app
      });

      return {
        id: docRef.id,
        campaignId,
        userId,
        status: 'enrolled',
        progress: {
          totalLocations: locations.length,
          discoveredLocations: 0,
          discoveredLocationIds: [],
          currentLocationId: locations[0]?.id || null
        },
        claimedRewards: [],
        finalReward: null,
        enrolledAt: Timestamp.now(),
        completedAt: undefined
      } as Participation;
    } catch (error: any) {
      console.error('Error enrolling:', error);
      throw error;
    }
  }

  // Process QR scan
  async processScan(
    qrCode: string, 
    userId: string, 
    userLatitude?: number, 
    userLongitude?: number
  ): Promise<{
    success: boolean;
    location?: TreasureLocation;
    isNewDiscovery?: boolean;
    message?: string;
    isWithinRadius?: boolean;
    isAlreadyDiscovered?: boolean;
    isCompleted?: boolean;
    progress?: {
      discovered: number;
      total: number;
    };
    nextLocation?: TreasureLocation;
  }> {
    try {
      // Find location by QR code
      const q = query(
        collection(db, 'treasure_locations'),
        where('qrCode', '==', qrCode)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return { success: false, message: 'Invalid QR code' };
      }

      const location = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as TreasureLocation;

      // Get user's participation
      const participation = await this.getParticipation(location.campaignId, userId);
      if (!participation) {
        return { success: false, message: 'Not enrolled in this campaign' };
      }

      const isAlreadyDiscovered = participation.progress.discoveredLocationIds.includes(location.id);

      // Check radius if user location provided
      let isWithinRadius = true;
      if (userLatitude && userLongitude && location.coordinates) {
        const distance = this.calculateDistance(
          userLatitude, userLongitude,
          location.coordinates.latitude, location.coordinates.longitude
        );
        isWithinRadius = distance <= (location.radius || 50);
      }

      // Log scan
      await addDoc(collection(db, 'treasure_scans'), {
        campaignId: location.campaignId,
        locationId: location.id,
        userId,
        scanData: {
          qrCode,
          timestamp: serverTimestamp(),
          userLocation: userLatitude && userLongitude ? { latitude: userLatitude, longitude: userLongitude } : null
        },
        validation: {
          isValid: isWithinRadius && !isAlreadyDiscovered,
          isWithinRadius,
          isAlreadyDiscovered
        }
      });

      if (isAlreadyDiscovered) {
        return { success: false, message: 'Already discovered', isAlreadyDiscovered: true };
      }

      if (!isWithinRadius) {
        return { success: false, message: 'Not close enough', isWithinRadius: false };
      }

      // Success - update participation
      const newDiscoveredIds = [...participation.progress.discoveredLocationIds, location.id];
      
      // Find next location
      const locations = await this.getLocations(location.campaignId);
      const nextLocation = locations.find(loc => loc.order === (location.order || 0) + 1);

      await updateDoc(doc(db, 'treasure_participations', participation.id), {
        'progress.discoveredLocationIds': newDiscoveredIds,
        'progress.discoveredLocations': newDiscoveredIds.length,
        'progress.currentLocationId': nextLocation?.id || null,
        updatedAt: serverTimestamp()
      });

      const isCompleted = newDiscoveredIds.length >= participation.progress.totalLocations;

      return {
        success: true,
        isNewDiscovery: true,
        location,
        isCompleted,
        progress: {
          discovered: newDiscoveredIds.length,
          total: participation.progress.totalLocations
        },
        nextLocation: nextLocation || undefined
      };
    } catch (error) {
      console.error('Error processing scan:', error);
      return { success: false, message: 'Error processing scan' };
    }
  }

  // Get map data for campaign
  async getMapData(campaignId: string, userId?: string): Promise<{
    locations: (TreasureLocation & { isDiscovered?: boolean; isCurrentTarget?: boolean })[];
  }> {
    try {
      const locations = await this.getLocations(campaignId);
      
      let result = locations.map(loc => ({
        ...loc,
        isDiscovered: false,
        isCurrentTarget: false
      }));

      // If user is enrolled, filter based on progress
      if (userId) {
        const participation = await this.getParticipation(campaignId, userId);
        if (participation) {
          const discoveredIds = participation.progress.discoveredLocationIds;
          result = locations.map(loc => ({
            ...loc,
            isDiscovered: discoveredIds.includes(loc.id),
            isCurrentTarget: loc.id === participation.progress.currentLocationId
          }));
        }
      }

      return { locations: result };
    } catch (error) {
      console.error('Error fetching map data:', error);
      return { locations: [] };
    }
  }

  // Get all campaigns (admin - includes all statuses)
  async getAllCampaigns(): Promise<Campaign[]> {
    try {
      const q = query(
        collection(db, 'treasure_campaigns'),
        orderBy('startDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Campaign[];
    } catch (error) {
      console.error('Error fetching all campaigns:', error);
      return [];
    }
  }

  // Create a new campaign
  async createCampaign(campaignData: Partial<Campaign>): Promise<Campaign | null> {
    try {
      const now = Timestamp.now();
      const newCampaign = {
        name: campaignData.name || { fr: '', 'ar-tn': '' },
        description: campaignData.description || { fr: '', 'ar-tn': '' },
        status: campaignData.status || 'draft',
        startDate: campaignData.startDate || now,
        endDate: campaignData.endDate || now,
        rewardType: campaignData.rewardType || 'points',
        rewardValue: campaignData.rewardValue || 100,
        isPublic: campaignData.isPublic || false,
        maxParticipants: campaignData.maxParticipants || 1000,
        currentParticipants: 0,
        metrics: {
          totalScans: 0,
          uniqueParticipants: 0,
          treasuresFound: 0,
          rewardsClaimed: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'treasure_campaigns'), newCampaign);
      return {
        id: docRef.id,
        ...newCampaign,
        startDate: now,
        endDate: now
      } as Campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      return null;
    }
  }

  // Update a campaign
  async updateCampaign(campaignId: string, campaignData: Partial<Campaign>): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'treasure_campaigns', campaignId), {
        ...campaignData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating campaign:', error);
      return false;
    }
  }

  // Delete a campaign
  async deleteCampaign(campaignId: string): Promise<boolean> {
    try {
      // Delete all locations first
      const locations = await this.getAllLocations(campaignId);
      for (const location of locations) {
        await deleteDoc(doc(db, 'treasure_locations', location.id));
      }
      
      // Delete the campaign
      await deleteDoc(doc(db, 'treasure_campaigns', campaignId));
      return true;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      return false;
    }
  }

  // Publish a campaign
  async publishCampaign(campaignId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'treasure_campaigns', campaignId), {
        status: 'active',
        isPublic: true,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error publishing campaign:', error);
      return false;
    }
  }

  // Pause a campaign
  async pauseCampaign(campaignId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'treasure_campaigns', campaignId), {
        status: 'paused',
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error pausing campaign:', error);
      return false;
    }
  }

  // Get all locations for a campaign (admin - includes inactive)
  async getAllLocations(campaignId: string): Promise<TreasureLocation[]> {
    try {
      const q = query(
        collection(db, 'treasure_locations'),
        where('campaignId', '==', campaignId),
        orderBy('order', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TreasureLocation[];
    } catch (error) {
      console.error('Error fetching all locations:', error);
      return [];
    }
  }

  // Create a treasure location
  async createLocation(locationData: Partial<TreasureLocation>): Promise<TreasureLocation | null> {
    try {
      const newLocation = {
        campaignId: locationData.campaignId || '',
        name: locationData.name || { fr: '', 'ar-tn': '' },
        hint: locationData.hint || { fr: '', 'ar-tn': '' },
        coordinates: locationData.coordinates || { latitude: 0, longitude: 0 },
        qrCode: locationData.qrCode || `TH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        rewardType: locationData.rewardType || 'points',
        rewardValue: locationData.rewardValue || 10,
        order: locationData.order || 1,
        radius: locationData.radius || 50,
        isActive: locationData.isActive !== false,
        isDiscoverable: locationData.isDiscoverable !== false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'treasure_locations'), newLocation);
      return {
        id: docRef.id,
        ...newLocation
      } as TreasureLocation;
    } catch (error) {
      console.error('Error creating location:', error);
      return null;
    }
  }

  // Update a location
  async updateLocation(locationId: string, locationData: Partial<TreasureLocation>): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'treasure_locations', locationId), {
        ...locationData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      return false;
    }
  }

  // Delete a location
  async deleteLocation(locationId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'treasure_locations', locationId));
      return true;
    } catch (error) {
      console.error('Error deleting location:', error);
      return false;
    }
  }

  // Calculate distance between two points in meters
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const treasureHuntService = new TreasureHuntService();
