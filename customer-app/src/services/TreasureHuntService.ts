import { db } from "../api/firebase";
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
  Timestamp,
  onSnapshot,
  limit,
  increment,
} from "firebase/firestore";

// Types
export interface Campaign {
  id: string;
  name: { fr: string; "ar-tn": string };
  description?: { fr: string; "ar-tn": string };
  status:
    | "draft"
    | "scheduled"
    | "active"
    | "paused"
    | "completed"
    | "cancelled";
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
  name: { fr: string; "ar-tn": string };
  hint?: { fr: string; "ar-tn": string };
  note?: { fr: string; "ar-tn": string };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  qrCode: string;
  order: number;
  radius: number;
  captureMethod?: "virtual" | "qr";
  isActive: boolean;
  isDiscoverable: boolean;
  discoveryOrder?: "sequential" | "any";
  specialReward?: "none" | "first_finder" | "top3" | "top10";
  bonusRewardValue?: number;
  bonusRewardValue2?: number;
  bonusRewardValue3?: number;
  requiresKey?: boolean;
  keysRequired?: number;
}

export interface TreasureKey {
  id: string;
  campaignId: string;
  latitude: number;
  longitude: number;
  isDemo?: boolean;
}

export interface Bomb {
  id: string;
  campaignId: string;
  treasureId: string; // The treasure it's guarding
  latitude: number;
  longitude: number;
  type?: "static" | "moving";
  difficulty?: number;
}

export interface Participation {
  id: string;
  campaignId: string;
  userId: string;
  status: "enrolled" | "in_progress" | "completed" | "abandoned";
  progress: {
    totalLocations: number;
    discoveredLocations: number;
    discoveredLocationIds: string[];
    currentLocationId: string | null;
  };
  rewards?: {
    locationId: string;
    type: string;
    value: any;
    code?: string;
    timestamp: any;
  }[];
  claimedRewards: any[];
  finalReward: any;
  enrolledAt: Timestamp;
  completedAt?: Timestamp;
  abandonedAt?: Timestamp;
  inventory?: {
    keys: number;
    lives: number;
  };
}

class TreasureHuntService {
  // Get all products for reward selection
  async getAllProducts(): Promise<
    { id: string; name: any; price: number; image?: string }[]
  > {
    try {
      const snap = await getDocs(collection(db, "products"));
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name:
            data.name || data.nameFr || data.name["fr"] || "Unnamed Product",
          price: data.price || 0,
          image: data.image || data.images?.[0] || null,
        };
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }

  // Check for duplicate campaign name
  async checkDuplicateCampaignName(
    name: string,
    excludeId?: string,
  ): Promise<boolean> {
    try {
      const q = query(
        collection(db, "treasure_campaigns"),
        where("name.fr", "==", name),
      );
      const snap = await getDocs(q);
      if (snap.empty) return false;
      // If excludeId provided, check if the duplicate is the same document
      if (excludeId) {
        return snap.docs.some((d) => d.id !== excludeId);
      }
      return snap.size > 0;
    } catch (error) {
      console.error("Error checking duplicate campaign:", error);
      return false;
    }
  }

  // Check for duplicate QR code
  async checkDuplicateQRCode(
    qrCode: string,
    excludeId?: string,
  ): Promise<boolean> {
    try {
      const q = query(
        collection(db, "treasure_locations"),
        where("qrCode", "==", qrCode),
      );
      const snap = await getDocs(q);
      if (snap.empty) return false;
      if (excludeId) {
        return snap.docs.some((d) => d.id !== excludeId);
      }
      return snap.size > 0;
    } catch (error) {
      console.error("Error checking duplicate QR code:", error);
      return false;
    }
  }

  // Generate unique QR code
  async generateUniqueQRCode(): Promise<string> {
    let qrCode = `TH_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    let isDuplicate = await this.checkDuplicateQRCode(qrCode);
    let attempts = 0;
    while (isDuplicate && attempts < 10) {
      qrCode = `TH_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      isDuplicate = await this.checkDuplicateQRCode(qrCode);
      attempts++;
    }
    return qrCode;
  }

  // Get all active public campaigns
  async getActiveCampaigns(): Promise<Campaign[]> {
    try {
      const now = Timestamp.now();
      // First get all active public campaigns, then filter by dates in memory
      // This is needed because Firestore doesn't support multiple range filters
      const q = query(
        collection(db, "treasure_campaigns"),
        where("status", "==", "active"),
        where("isPublic", "==", true),
      );

      const snapshot = await getDocs(q);
      const campaigns = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Campaign[];

      // Filter by date in memory - show campaign if:
      // 1. No start date is set (show immediately)
      // 2. Start date is in the past
      // 3. Current time is within campaign period
      return campaigns
        .filter((campaign) => {
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
        })
        .sort((a, b) => {
          // Sort by start date, most recent first
          const aDate = a.startDate as Timestamp | undefined;
          const bDate = b.startDate as Timestamp | undefined;
          const aSeconds = aDate?.seconds || 0;
          const bSeconds = bDate?.seconds || 0;
          return bSeconds - aSeconds;
        });
    } catch (error) {
      console.error("Error fetching active campaigns:", error);
      return [];
    }
  }

  // Get all public campaigns (including future ones) for countdown display
  async getAllPublicCampaigns(): Promise<Campaign[]> {
    try {
      const q = query(
        collection(db, "treasure_campaigns"),
        where("isPublic", "==", true),
      );

      const snapshot = await getDocs(q);
      const campaigns = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
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
      console.error("Error fetching public campaigns:", error);
      return [];
    }
  }

  // Get campaign by ID
  async getCampaign(campaignId: string): Promise<Campaign | null> {
    try {
      const docRef = doc(db, "treasure_campaigns", campaignId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Campaign;
      }
      return null;
    } catch (error) {
      console.error("Error fetching campaign:", error);
      return null;
    }
  }

  // Get locations for a campaign
  async getLocations(campaignId: string): Promise<TreasureLocation[]> {
    try {
      const q = query(
        collection(db, "treasure_locations"),
        where("campaignId", "==", campaignId),
        where("isActive", "==", true),
      );

      const snapshot = await getDocs(q);
      const locations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TreasureLocation[];

      return locations.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error("Error fetching locations:", error);
      return [];
    }
  }

  // Get user's participation in a campaign
  async getParticipation(
    campaignId: string,
    userId: string,
  ): Promise<Participation | null> {
    if (!campaignId || !userId) {
      console.warn("getParticipation called with missing campaignId or userId");
      return null;
    }
    try {
      const q = query(
        collection(db, "treasure_participations"),
        where("campaignId", "==", campaignId),
        where("userId", "==", userId),
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const participations = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Participation,
        );
        participations.sort((a, b) => {
          const timeA = a.enrolledAt?.seconds || 0;
          const timeB = b.enrolledAt?.seconds || 0;
          return timeB - timeA;
        });
        return participations[0];
      }
      return null;
    } catch (error) {
      console.error("Error fetching participation:", error);
      return null;
    }
  }

  // Get all user participations
  async getUserParticipations(userId: string): Promise<Participation[]> {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, "treasure_participations"),
        where("userId", "==", userId),
      );

      const snapshot = await getDocs(q);
      const participations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Participation[];

      return participations.sort((a, b) => {
        const timeA = a.enrolledAt?.seconds || 0;
        const timeB = b.enrolledAt?.seconds || 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error("Error fetching participations:", error);
      return [];
    }
  }

  // Get combined user stats (XP, Level)
  async getUserStats(userId: string) {
    const participations = await this.getUserParticipations(userId);
    let totalXP = 0;

    participations.forEach((p) => {
      if (p.rewards) {
        p.rewards.forEach((r) => {
          if (r.type === "points") {
            totalXP += parseInt(String(r.value)) || 0;
          }
        });
      }
    });

    const level = Math.floor(totalXP / 1000) + 1;
    const currentLevelXP = totalXP % 1000;
    const nextLevelXP = 1000;
    const progress = (currentLevelXP / nextLevelXP) * 100;
    const remainingXP = nextLevelXP - currentLevelXP;

    return {
      totalXP,
      level,
      currentLevelXP,
      nextLevelXP,
      progress,
      remainingXP,
    };
  }

  // Get leaderboard (top users by XP)
  async getLeaderboard() {
    try {
      // For performance in a real app, this should be a cloud function or
      // aggregate collection. For now, we fetch the 100 most recent completed participations
      // to generate a dynamic winner list.
      const q = query(
        collection(db, "treasure_participations"),
        where("status", "==", "completed"),
        orderBy("completedAt", "desc"),
        limit(100),
      );

      const snapshot = await getDocs(q);
      const participations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Participation[];

      // Group by userId and calculate total rewards
      const userXPMap: Record<
        string,
        { userId: string; xp: number; count: number }
      > = {};

      participations.forEach((p) => {
        if (!userXPMap[p.userId]) {
          (userXPMap[p.userId] as any) = {
            userId: p.userId,
            xp: 0,
            count: 0,
            p,
          }; // Store p for demo names
        }

        userXPMap[p.userId].count += 1;
        if (p.rewards) {
          p.rewards.forEach((r) => {
            if (r.type === "points") {
              userXPMap[p.userId].xp += parseInt(String(r.value)) || 0;
            }
          });
        }
      });

      // Convert to array and sort
      const leaderboard = await Promise.all(
        Object.values(userXPMap).map(async (entry) => {
          // Fetch user info for each entry
          const userDoc = await getDoc(doc(db, "users", entry.userId));
          const userData = userDoc.exists() ? userDoc.data() : {};

          return {
            ...entry,
            userName:
              userData.fullName ||
              userData.displayName ||
              ((entry as any).p ? (entry as any).p.userName : "Explorer"),
            avatar: userData.avatarUrl || "",
          };
        }),
      );

      return leaderboard.sort((a, b) => b.xp - a.xp).slice(0, 10);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  }

  async deleteDemoKeys() {
    try {
      const q = query(
        collection(db, "treasure_keys"),
        where("isDemo", "==", true),
      );
      const snapshot = await getDocs(q);
      const promises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(promises);
    } catch (error) {
      console.error("Error deleting demo keys:", error);
    }
  }

  // Generate demo data for leaderboard testing
  async createDemoLeaderboard() {
    try {
      const demoUsers = [
        { name: "Elite Hunter", xp: 2500 },
        { name: "Treasure Master", xp: 2100 },
        { name: "Swift Seeker", xp: 1850 },
        { name: "Hidden Gem", xp: 1500 },
        { name: "Map Expert", xp: 1200 },
        { name: "Brave Explorer", xp: 950 },
        { name: "Lucky Finder", xp: 800 },
        { name: "Shadow Tracker", xp: 650 },
      ];

      // Get an active campaign to link data
      const campaigns = await this.getActiveCampaigns();
      let campaignId: string;
      
      if (campaigns.length === 0) {
        // Fallback: search for any campaign if no active one
        const allCampaigns = await this.getAllPublicCampaigns();
        if (allCampaigns.length === 0) {
          throw new Error("No campaigns found to attach demo data. Create a campaign first.");
        }
        campaignId = allCampaigns[0].id;
      } else {
        campaignId = campaigns[0].id;
      }

      const promises = demoUsers.map((user) => {
        return addDoc(collection(db, "treasure_participations"), {
          userId: `demo_${user.name.toLowerCase().replace(" ", "_")}`,
          campaignId,
          status: "completed",
          isDemo: true,
          userName: user.name, // Direct name for demo display
          rewards: [
            {
              type: "points",
              value: user.xp,
              timestamp: Timestamp.now(),
            },
          ],
          enrolledAt: serverTimestamp(),
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error("Error creating demo leaderboard:", error);
      throw error;
    }
  }

  // Delete all demo leaderboard data
  async deleteDemoLeaderboard() {
    try {
      const q = query(
        collection(db, "treasure_participations"),
        where("isDemo", "==", true),
      );
      const snap = await getDocs(q);
      const deletions = snap.docs.map((d) =>
        deleteDoc(doc(db, "treasure_participations", d.id)),
      );
      await Promise.all(deletions);
      return snap.size;
    } catch (error) {
      console.error("Error deleting demo leaderboard:", error);
      return 0;
    }
  }

  // Create a demo location at current coordinates for testing
  async createDemoLocation(
    userId: string,
    latitude: number,
    longitude: number,
  ) {
    try {
      // Find an active campaign to attach to
      const campaigns = await this.getActiveCampaigns();
      let campaignId: string;
      
      if (campaigns.length === 0) {
        // Fallback: search for any campaign if no active one
        const allCampaigns = await this.getAllPublicCampaigns();
        if (allCampaigns.length === 0) {
          throw new Error("No campaigns found to add demo location");
        }
        campaignId = allCampaigns[0].id;
      } else {
        campaignId = campaigns[0].id;
      }

      const qrCode = await this.generateUniqueQRCode();

      const locationData = {
        campaignId,
        name: { fr: "Demo Treasure", "ar-tn": "كنز تجريبي" },
        hint: { fr: "Test capture here!", "ar-tn": "اختبار الالتقاط هنا!" },
        coordinates: { latitude, longitude },
        qrCode,
        radius: 100,
        isActive: true,
        isDiscoverable: true,
        isDemo: true, // Tag it as demo
        order: 99,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "treasure_locations"),
        locationData,
      );

      // Auto-enroll user if not enrolled
      const participation = await this.getParticipation(campaignId, userId);
      if (!participation) {
        await this.enrollInCampaign(campaignId, userId);
      } else {
        // Update participation total locations if we added one
        const locations = await this.getLocations(campaignId);
        await updateDoc(doc(db, "treasure_participations", participation.id), {
          "progress.totalLocations": locations.length,
        });
      }

      return { id: docRef.id, ...locationData };
    } catch (error) {
      console.error("Error creating demo location:", error);
      throw error;
    }
  }

  // Delete all demo locations
  async deleteDemoLocations() {
    try {
      const q = query(
        collection(db, "treasure_locations"),
        where("isDemo", "==", true),
      );
      const snap = await getDocs(q);

      const deletions = snap.docs.map((d) =>
        deleteDoc(doc(db, "treasure_locations", d.id)),
      );
      await Promise.all(deletions);
      return snap.size;
    } catch (error) {
      console.error("Error deleting demo locations:", error);
      return 0;
    }
  }

  // Create a demo bomb at user location
  async createDemoBomb(userId: string, latitude: number, longitude: number) {
    try {
      // Find a campaign to link it to
      const q = query(collection(db, "treasure_campaigns"), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("No campaign found to add bomb to");

      const campaignId = snap.docs[0].id;

      const bombData = {
        campaignId,
        treasureId: "demo_treasure",
        latitude: latitude + (Math.random() - 0.5) * 0.0005, // Offset slightly
        longitude: longitude + (Math.random() - 0.5) * 0.0005,
        type: "static",
        difficulty: 1,
        isDemo: true,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "treasure_bombs"), bombData);
      return { id: docRef.id, ...bombData };
    } catch (error) {
      console.error("Error creating demo bomb:", error);
      throw error;
    }
  }

  // Create a demo key at user location
  async createDemoKey(userId: string, latitude: number, longitude: number) {
    try {
      const q = query(collection(db, "treasure_campaigns"), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("No campaign found to add key to");

      const campaignId = snap.docs[0].id;

      const keyData = {
        campaignId,
        latitude: latitude + (Math.random() - 0.5) * 0.0005,
        longitude: longitude + (Math.random() - 0.5) * 0.0005,
        isDemo: true,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "treasure_keys"), keyData);
      return { id: docRef.id, ...keyData };
    } catch (error) {
      console.error("Error creating demo key:", error);
      throw error;
    }
  }

  // Delete all demo bombs
  async deleteDemoBombs() {
    try {
      await this.deleteDemoKeys();
      const q = query(
        collection(db, "treasure_bombs"),
        where("isDemo", "==", true),
      );
      const snap = await getDocs(q);

      const deletions = snap.docs.map((d) =>
        deleteDoc(doc(db, "treasure_bombs", d.id)),
      );
      await Promise.all(deletions);
      return snap.size;
    } catch (error) {
      console.error("Error deleting demo bombs:", error);
      return 0;
    }
  }

  // Subscribe to all user participations for real-time rewards
  subscribeToUserParticipations(
    userId: string,
    callback: (participations: Participation[]) => void,
  ) {
    if (!userId) return () => {};

    const q = query(
      collection(db, "treasure_participations"),
      where("userId", "==", userId),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const participations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Participation[];

        participations.sort((a, b) => {
          const timeA = a.enrolledAt?.seconds || 0;
          const timeB = b.enrolledAt?.seconds || 0;
          return timeB - timeA;
        });
        callback(participations);
      },
      (error) => {
        console.error("Error subscribing to user participations:", error);
      },
    );
  }

  // Enroll in a campaign
  async enrollInCampaign(
    campaignId: string,
    userId: string,
  ): Promise<Participation | null> {
    try {
      // Check if already enrolled or abandoned (lost)
      const existing = await this.getParticipation(campaignId, userId);
      if (existing) {
        if (existing.status === "abandoned") {
          throw new Error("ABANDONED"); // Special error so UI can handle it differently
        }
        throw new Error("Already enrolled in this campaign");
      }

      // Get campaign locations (optional - allow enrollment without locations)
      const locations = await this.getLocations(campaignId);

      // If no locations, create participation without current location
      const firstLocation = locations.length > 0 ? locations[0] : null;

      // Calculate initial hearts: min(3, locations.length - 1), at least 1 if locations exist
      const initialLives =
        locations.length > 0
          ? Math.min(3, Math.max(1, locations.length - 1))
          : 0;

      // Create participation
      const participationData = {
        campaignId,
        userId,
        status: locations.length > 0 ? "in_progress" : "pending",
        progress: {
          totalLocations: locations.length,
          discoveredLocations: 0,
          discoveredLocationIds: [] as string[],
          currentLocationId: firstLocation?.id || null,
        },
        claimedRewards: [],
        finalReward: null,
        metrics: {
          timeSpentMinutes: 0,
          hintsUsed: 0,
          socialShares: 0,
        },
        enrolledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        inventory: {
          keys: 0,
          lives: initialLives,
        },
      };

      const docRef = await addDoc(
        collection(db, "treasure_participations"),
        participationData,
      );

      // Return null - caller should fetch the participation if needed
      return null;
    } catch (error: any) {
      console.error("Error enrolling in campaign:", error);
      throw error;
    }
  }

  // Revive/re-enroll an abandoned participation (taste button)
  async reviveParticipation(
    campaignId: string,
    userId: string,
  ): Promise<Participation | null> {
    try {
      // Check if there's an existing abandoned participation
      const existing = await this.getParticipation(campaignId, userId);
      if (!existing || existing.status !== "abandoned") {
        throw new Error("No abandoned participation found");
      }

      // Get campaign locations
      const locations = await this.getLocations(campaignId);

      // Reset lives for the revival (give 1 life to start)
      const initialLives = 1;

      // Reset the participation to in_progress
      await updateDoc(doc(db, "treasure_participations", existing.id), {
        status: "in_progress",
        "inventory.lives": initialLives,
        "inventory.keys": 0,
        "progress.discoveredLocationIds": [],
        "progress.discoveredLocations": 0,
        "progress.currentLocationId":
          locations.length > 0 ? locations[0].id : null,
        rewards: [],
        abandonedAt: null,
        updatedAt: serverTimestamp(),
      });

      // Return the updated participation
      return await this.getParticipation(campaignId, userId);
    } catch (error: any) {
      console.error("Error reviving participation:", error);
      throw error;
    }
  }

  // Abandon/"Fail" a participation (e.g. hit a bomb)
  async abandonCampaign(campaignId: string, userId: string): Promise<boolean> {
    try {
      const participation = await this.getParticipation(campaignId, userId);
      if (!participation) return false;

      // Mark as abandoned so user cannot re-enroll in this campaign
      await updateDoc(doc(db, "treasure_participations", participation.id), {
        status: "abandoned",
        abandonedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("Error abandoning campaign:", error);
      return false;
    }
  }

  // Handle bomb hit - decrement lives or eliminate
  async handleBombHit(
    campaignId: string,
    userId: string,
    bombId?: string,
  ): Promise<{
    success: boolean;
    livesRemaining: number;
    eliminated: boolean;
  }> {
    try {
      if (bombId) {
        try {
          await deleteDoc(doc(db, "treasure_bombs", bombId));
        } catch (e) {
          console.error("Error removing bomb globally", e);
        }
      }
      const participation = await this.getParticipation(campaignId, userId);
      if (!participation)
        return { success: false, livesRemaining: 0, eliminated: false };

      const currentLives = participation.inventory?.lives || 0;

      if (currentLives > 1) {
        // Just lose a heart
        const newLives = currentLives - 1;
        await updateDoc(doc(db, "treasure_participations", participation.id), {
          "inventory.lives": newLives,
          updatedAt: serverTimestamp(),
        });
        return { success: true, livesRemaining: newLives, eliminated: false };
      } else {
        // Eliminated
        await this.abandonCampaign(campaignId, userId);
        return { success: true, livesRemaining: 0, eliminated: true };
      }
    } catch (error) {
      console.error("Error handling bomb hit:", error);
      return { success: false, livesRemaining: 0, eliminated: false };
    }
  }

  // Process QR scan
  async processScan(
    qrCode: string,
    userId: string,
    userLatitude?: number,
    userLongitude?: number,
  ): Promise<{
    success: boolean;
    location?: TreasureLocation;
    isNewDiscovery?: boolean;
    message?: string;
    isWithinRadius?: boolean;
    isAlreadyDiscovered?: boolean;
    isCompleted?: boolean;
    reward?: {
      type: string;
      value: any;
      code?: string;
    };
    progress?: {
      discovered: number;
      total: number;
    };
    nextLocation?: TreasureLocation;
    keysRequired?: number;
  }> {
    try {
      // Find location by QR code
      const q = query(
        collection(db, "treasure_locations"),
        where("qrCode", "==", qrCode),
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return { success: false, message: "Invalid QR code" };
      }

      const location = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      } as TreasureLocation;

      // Get user's participation
      const participation = await this.getParticipation(
        location.campaignId,
        userId,
      );
      if (!participation) {
        return { success: false, message: "Not enrolled in this campaign" };
      }

      const isAlreadyDiscovered =
        participation.progress.discoveredLocationIds.includes(location.id);

      // Check radius if user location provided
      let isWithinRadius = true;
      if (userLatitude && userLongitude && location.coordinates) {
        const distance = this.calculateDistance(
          userLatitude,
          userLongitude,
          location.coordinates.latitude,
          location.coordinates.longitude,
        );
        isWithinRadius = distance <= (location.radius || 50);
      }

      // Log scan
      await addDoc(collection(db, "treasure_scans"), {
        campaignId: location.campaignId,
        locationId: location.id,
        userId,
        scanData: {
          qrCode,
          timestamp: serverTimestamp(),
          userLocation:
            userLatitude && userLongitude
              ? { latitude: userLatitude, longitude: userLongitude }
              : null,
        },
        validation: {
          isValid: isWithinRadius && !isAlreadyDiscovered,
          isWithinRadius,
          isAlreadyDiscovered,
        },
      });

      if (isAlreadyDiscovered) {
        return {
          success: false,
          message: "Already discovered",
          isAlreadyDiscovered: true,
        };
      }

      if (!isWithinRadius) {
        return {
          success: false,
          message: "Not close enough",
          isWithinRadius: false,
        };
      }

      return await this.finalizeDiscovery(location, participation, userId);
    } catch (error) {
      console.error("Error processing scan:", error);
      return { success: false, message: "Error processing scan" };
    }
  }

  // Virtual capture (Pokemon Go style)
  async captureTreasure(
    locationId: string,
    userId: string,
    userLatitude: number,
    userLongitude: number,
  ): Promise<{
    success: boolean;
    location?: TreasureLocation;
    isNewDiscovery?: boolean;
    message?: string;
    reward?: any;
    progress?: any;
    nextLocation?: TreasureLocation;
    keysRequired?: number;
  }> {
    try {
      const locationDoc = await getDoc(
        doc(db, "treasure_locations", locationId),
      );
      if (!locationDoc.exists()) {
        return { success: false, message: "Location not found" };
      }
      const location = {
        id: locationDoc.id,
        ...locationDoc.data(),
      } as TreasureLocation;

      const participation = await this.getParticipation(
        location.campaignId,
        userId,
      );
      if (!participation) {
        return { success: false, message: "Not enrolled" };
      }

      const isAlreadyDiscovered =
        participation.progress.discoveredLocationIds.includes(location.id);
      if (isAlreadyDiscovered) {
        return { success: false, message: "Already discovered" };
      }

      const distance = this.calculateDistance(
        userLatitude,
        userLongitude,
        location.coordinates.latitude,
        location.coordinates.longitude,
      );

      if (distance > (location.radius || 100)) {
        // 100m for virtual capture
        return { success: false, message: "Too far away" };
      }

      return await this.finalizeDiscovery(location, participation, userId);
    } catch (error) {
      console.error("Capture error:", error);
      return { success: false, message: "Capture failed" };
    }
  }

  private async finalizeDiscovery(
    location: TreasureLocation,
    participation: Participation,
    userId: string,
  ) {
    // Check if key is required and available
    const currentKeys = participation.inventory?.keys || 0;
    const keysNeeded = location.keysRequired || (location.requiresKey ? 1 : 0);

    if (keysNeeded > 0 && currentKeys < keysNeeded) {
      return {
        success: false,
        message: "REQUIRES_KEY",
        keysRequired: keysNeeded,
      };
    }

    // Logic from processScan to update participation and rewards
    const newDiscoveredIds = [
      ...participation.progress.discoveredLocationIds,
      location.id,
    ];

    const locations = await this.getLocations(location.campaignId);
    const nextLocation = locations.find(
      (loc) => loc.order === (location.order || 0) + 1,
    );

    const campaign = await this.getCampaign(location.campaignId);
    const campaignRewardType = campaign?.rewardType || "points";
    const campaignRewardValue = campaign?.rewardValue || 10;

    let rewardDetails: any = null;

    if (campaignRewardType === "points") {
      const rewardPoints = parseInt(String(campaignRewardValue)) || 10;
      rewardDetails = {
        type: "points",
        value: rewardPoints,
        isRedeemed: false,
      };
    } else if (campaignRewardType === "discount") {
      rewardDetails = {
        type: "discount",
        value: campaignRewardValue,
        code: `DISCOUNT_${location.id.slice(0, 8).toUpperCase()}`,
        isRedeemed: false,
      };
    } else if (campaignRewardType === "coupon") {
      rewardDetails = {
        type: "coupon",
        code: campaignRewardValue,
        isRedeemed: false,
      };
    } else if (campaignRewardType === "free_product") {
      rewardDetails = {
        type: "free_product",
        value: campaignRewardValue,
        code: `FREE_${location.id.slice(0, 8).toUpperCase()}`,
        isRedeemed: false,
      };
    } else {
      rewardDetails = {
        type: campaignRewardType,
        value: campaignRewardValue,
        isRedeemed: false,
      };
    }

    const updateData: any = {
      "progress.discoveredLocationIds": newDiscoveredIds,
      "progress.discoveredLocations": newDiscoveredIds.length,
      "progress.currentLocationId": nextLocation?.id || null,
      rewards: [
        ...(participation.rewards || []),
        {
          locationId: location.id,
          ...rewardDetails,
          timestamp: Timestamp.now(),
        },
      ],
      updatedAt: serverTimestamp(),
    };

    // Consume key if used
    if (keysNeeded > 0) {
      updateData["inventory.keys"] = currentKeys - keysNeeded;
    }

    await updateDoc(
      doc(db, "treasure_participations", participation.id),
      updateData,
    );

    return {
      success: true,
      isNewDiscovery: true,
      location,
      isCompleted:
        newDiscoveredIds.length >= participation.progress.totalLocations,
      reward: rewardDetails,
      progress: {
        discovered: newDiscoveredIds.length,
        total: participation.progress.totalLocations,
      },
      nextLocation: nextLocation || undefined,
    };
  }

  // Claim a previously discovered reward
  async claimReward(
    userId: string,
    participationId: string,
    rewardIndex: number,
  ): Promise<boolean> {
    try {
      const pRef = doc(db, "treasure_participations", participationId);
      const pSnap = await getDoc(pRef);
      if (!pSnap.exists()) return false;
      const data = pSnap.data();
      const rewards = data.rewards || [];
      if (rewardIndex >= rewards.length) return false;

      const reward = rewards[rewardIndex];
      if (reward.isRedeemed) return true;

      // Assign to user wallet/coupons
      if (reward.type === "points") {
        await this.addPointsToUser(
          userId,
          reward.value,
          data.campaignId,
          reward.locationId,
        );
      } else if (reward.type === "discount") {
        await this.createDiscountCoupon(
          userId,
          reward.value,
          data.campaignId,
          reward.locationId,
        );
      } else if (reward.type === "coupon") {
        await this.applyCouponReward(
          userId,
          reward.code,
          data.campaignId,
          reward.locationId,
        );
      } else if (reward.type === "free_product") {
        await addDoc(collection(db, "user_coupons"), {
          userId,
          code: reward.code,
          discountType: "percentage",
          discountValue: 100, // 100% off
          minOrderAmount: 0,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isUsed: false,
          productId: reward.value,
          source: "treasure_hunt",
          campaignId: data.campaignId,
          locationId: reward.locationId,
          createdAt: serverTimestamp(),
        });
      }

      // Mark as redeemed
      rewards[rewardIndex].isRedeemed = true;
      rewards[rewardIndex].claimedAt = Timestamp.now();

      // Notify User
      try {
        await addDoc(collection(db, "notifications"), {
          userId: userId,
          title: "Gift Earned! / Cadeau gagné!",
          body: "You just received a new gift! / Vous venez de recevoir un nouveau cadeau !",
          read: false,
          createdAt: serverTimestamp(),
          type: "general",
        });
      } catch (err) {
        console.error("Gift notification error:", err);
      }

      await updateDoc(pRef, { rewards });
      return true;
    } catch (e) {
      console.error("Error claiming reward:", e);
      return false;
    }
  }

  // Get map data for campaign
  async getMapData(
    campaignId: string,
    userId?: string,
  ): Promise<{
    locations: (TreasureLocation & {
      isDiscovered?: boolean;
      isCurrentTarget?: boolean;
    })[];
  }> {
    try {
      const locations = await this.getLocations(campaignId);

      let result = locations.map((loc) => ({
        ...loc,
        isDiscovered: false,
        isCurrentTarget: false,
      }));

      // If user is enrolled, filter based on progress
      if (userId) {
        const participation = await this.getParticipation(campaignId, userId);
        if (participation) {
          const discoveredIds = participation.progress.discoveredLocationIds;
          result = locations.map((loc) => ({
            ...loc,
            isDiscovered: discoveredIds.includes(loc.id),
            isCurrentTarget:
              loc.id === participation.progress.currentLocationId,
          }));
        }
      }

      return { locations: result };
    } catch (error) {
      console.error("Error fetching map data:", error);
      return { locations: [] };
    }
  }

  // Get all campaigns (admin - includes all statuses)
  async getAllCampaigns(): Promise<Campaign[]> {
    try {
      const q = query(
        collection(db, "treasure_campaigns"),
        orderBy("startDate", "desc"),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Campaign[];
    } catch (error) {
      console.error("Error fetching all campaigns:", error);
      return [];
    }
  }

  // Create a new campaign
  async createCampaign(
    campaignData: Partial<Campaign>,
  ): Promise<Campaign | null> {
    try {
      const now = Timestamp.now();
      const newCampaign = {
        name: campaignData.name || { fr: "", "ar-tn": "" },
        description: campaignData.description || { fr: "", "ar-tn": "" },
        status: campaignData.status || "draft",
        startDate: campaignData.startDate || now,
        endDate: campaignData.endDate || now,
        rewardType: campaignData.rewardType || "points",
        rewardValue: campaignData.rewardValue || 100,
        isPublic: campaignData.isPublic || false,
        maxParticipants: campaignData.maxParticipants || 1000,
        currentParticipants: 0,
        metrics: {
          totalScans: 0,
          uniqueParticipants: 0,
          treasuresFound: 0,
          rewardsClaimed: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "treasure_campaigns"),
        newCampaign,
      );
      return {
        id: docRef.id,
        ...newCampaign,
        startDate: now,
        endDate: now,
      } as Campaign;
    } catch (error) {
      console.error("Error creating campaign:", error);
      return null;
    }
  }

  // Update a campaign
  async updateCampaign(
    campaignId: string,
    campaignData: Partial<Campaign>,
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, "treasure_campaigns", campaignId), {
        ...campaignData,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error updating campaign:", error);
      return false;
    }
  }

  // Delete a campaign
  async deleteCampaign(campaignId: string): Promise<boolean> {
    try {
      // Delete all locations first
      const locations = await this.getAllLocations(campaignId);
      for (const location of locations) {
        await deleteDoc(doc(db, "treasure_locations", location.id));
      }

      // Delete the campaign
      await deleteDoc(doc(db, "treasure_campaigns", campaignId));
      return true;
    } catch (error) {
      console.error("Error deleting campaign:", error);
      return false;
    }
  }

  // Publish a campaign
  async publishCampaign(campaignId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, "treasure_campaigns", campaignId), {
        status: "active",
        isPublic: true,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error publishing campaign:", error);
      return false;
    }
  }

  // Pause a campaign
  async pauseCampaign(campaignId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, "treasure_campaigns", campaignId), {
        status: "paused",
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error pausing campaign:", error);
      return false;
    }
  }

  // Get all locations for a campaign (admin - includes inactive)
  async getAllLocations(campaignId: string): Promise<TreasureLocation[]> {
    try {
      const q = query(
        collection(db, "treasure_locations"),
        where("campaignId", "==", campaignId),
        orderBy("order", "asc"),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TreasureLocation[];
    } catch (error) {
      console.error("Error fetching all locations:", error);
      return [];
    }
  }

  // Create a treasure location
  async createLocation(
    locationData: Partial<TreasureLocation>,
  ): Promise<TreasureLocation | null> {
    try {
      const newLocation = {
        campaignId: locationData.campaignId || "",
        name: locationData.name || { fr: "", "ar-tn": "" },
        hint: locationData.hint || { fr: "", "ar-tn": "" },
        coordinates: locationData.coordinates || { latitude: 0, longitude: 0 },
        qrCode:
          locationData.qrCode ||
          `TH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        order: locationData.order || 1,
        radius: locationData.radius || 50,
        captureMethod: locationData.captureMethod || "virtual",
        requiresKey: locationData.requiresKey || false,
        keysRequired: locationData.keysRequired || 0,
        isActive: locationData.isActive !== false,
        isDiscoverable: locationData.isDiscoverable !== false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "treasure_locations"),
        newLocation,
      );
      return {
        id: docRef.id,
        ...newLocation,
      } as TreasureLocation;
    } catch (error) {
      console.error("Error creating location:", error);
      return null;
    }
  }

  // Update a location
  async updateLocation(
    locationId: string,
    locationData: Partial<TreasureLocation>,
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, "treasure_locations", locationId), {
        ...locationData,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error updating location:", error);
      return false;
    }
  }

  // Get bombs for a campaign
  async getBombs(campaignId: string): Promise<Bomb[]> {
    try {
      const q = query(
        collection(db, "treasure_bombs"),
        where("campaignId", "==", campaignId),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Bomb[];
    } catch (error) {
      console.error("Error fetching bombs:", error);
      return [];
    }
  }

  // Create a bomb (for admin)
  async createBomb(bombData: Partial<Bomb>): Promise<Bomb | null> {
    try {
      const newBomb = {
        campaignId: bombData.campaignId || "",
        treasureId: bombData.treasureId || "",
        latitude: bombData.latitude || 0,
        longitude: bombData.longitude || 0,
        type: bombData.type || "static",
        difficulty: bombData.difficulty || 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "treasure_bombs"), newBomb);
      return {
        id: docRef.id,
        ...newBomb,
      } as Bomb;
    } catch (error) {
      console.error("Error creating bomb:", error);
      return null;
    }
  }

  // Delete a bomb
  async deleteBomb(bombId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "treasure_bombs", bombId));
      return true;
    } catch (error) {
      console.error("Error deleting bomb:", error);
      return false;
    }
  }

  // Delete a location
  async deleteLocation(locationId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "treasure_locations", locationId));
      return true;
    } catch (error) {
      console.error("Error deleting location:", error);
      return false;
    }
  }

  // Calculate distance between two points in meters
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Add points to user's wallet
  private async addPointsToUser(
    userId: string,
    points: number,
    campaignId: string,
    locationId: string,
  ): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentPoints = userData.points || 0;
        await updateDoc(userRef, {
          points: currentPoints + points,
        });
      }

      // Log the reward
      await addDoc(collection(db, "point_transactions"), {
        userId,
        amount: points,
        type: "treasure_hunt_reward",
        campaignId,
        locationId,
        description: "Treasure Hunt Discovery Reward",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding points to user:", error);
    }
  }

  // Create discount coupon for user
  private async createDiscountCoupon(
    userId: string,
    discountValue: number,
    campaignId: string,
    locationId: string,
  ): Promise<string> {
    try {
      const couponCode = `TH_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      await addDoc(collection(db, "user_coupons"), {
        userId,
        code: couponCode,
        discountType: "percentage",
        discountValue: discountValue,
        minOrderAmount: 0,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isUsed: false,
        source: "treasure_hunt",
        campaignId,
        locationId,
        createdAt: serverTimestamp(),
      });

      return couponCode;
    } catch (error) {
      console.error("Error creating discount coupon:", error);
      return "";
    }
  }

  // Apply coupon reward directly
  private async applyCouponReward(
    userId: string,
    couponCode: string,
    campaignId: string,
    locationId: string,
  ): Promise<void> {
    try {
      // Check if it's an existing coupon code
      const couponsRef = collection(db, "coupons");
      const couponSnap = await getDocs(
        query(couponsRef, where("code", "==", couponCode)),
      );

      if (!couponSnap.empty) {
        // Link existing coupon to user
        const couponId = couponSnap.docs[0].id;
        await addDoc(collection(db, "user_coupons"), {
          userId,
          couponId,
          code: couponCode,
          source: "treasure_hunt",
          campaignId,
          locationId,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error applying coupon reward:", error);
    }
  }

  // Subscribe to all active campaigns
  subscribeToCampaigns(callback: (campaigns: Campaign[]) => void) {
    const q = query(
      collection(db, "treasure_campaigns"),
      where("status", "==", "active"),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const campaigns = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Campaign,
        );
        campaigns.sort((a, b) => {
          const timeA = a.startDate?.seconds || 0;
          const timeB = b.startDate?.seconds || 0;
          return timeB - timeA;
        });
        callback(campaigns);
      },
      (error) => {
        console.error("Campaign subscription error:", error);
      },
    );
  }

  // Subscribe to user participation
  subscribeToParticipation(
    campaignId: string,
    userId: string,
    callback: (participation: Participation | null) => void,
  ) {
    if (!campaignId || !userId) return () => {};

    const q = query(
      collection(db, "treasure_participations"),
      where("campaignId", "==", campaignId),
      where("userId", "==", userId),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const participations = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Participation,
          );
          // Sort locally to get latest
          participations.sort((a, b) => {
            const timeA = a.enrolledAt?.seconds || 0;
            const timeB = b.enrolledAt?.seconds || 0;
            return timeB - timeA;
          });
          callback(participations[0]);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Participation subscription error:", error);
      },
    );
  }

  // Get keys for a campaign
  async getKeys(campaignId: string): Promise<TreasureKey[]> {
    try {
      const q = query(
        collection(db, "treasure_keys"),
        where("campaignId", "==", campaignId),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as TreasureKey,
      );
    } catch (error) {
      console.error("Error getting keys:", error);
      return [];
    }
  }

  // Collect a key
  async collectKey(keyId: string, participationId: string): Promise<boolean> {
    try {
      const participationRef = doc(
        db,
        "treasure_participations",
        participationId,
      );
      const participationSnap = await getDoc(participationRef);
      if (!participationSnap.exists()) return false;

      const participation = participationSnap.data() as Participation;
      const currentKeys = participation.inventory?.keys || 0;

      await updateDoc(participationRef, {
        "inventory.keys": currentKeys + 1,
        updatedAt: serverTimestamp(),
      });

      // Remove key from map
      await deleteDoc(doc(db, "treasure_keys", keyId));

      return true;
    } catch (error) {
      console.error("Error collecting key:", error);
      return false;
    }
  }

  // Create a key
  async createKey(
    keyData: Omit<TreasureKey, "id">,
  ): Promise<TreasureKey | null> {
    try {
      const docRef = await addDoc(collection(db, "treasure_keys"), keyData);
      return { id: docRef.id, ...keyData };
    } catch (error) {
      console.error("Error creating key:", error);
      return null;
    }
  }

  // Delete a key
  async deleteKey(keyId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "treasure_keys", keyId));
      return true;
    } catch (error) {
      console.error("Error deleting key:", error);
      return false;
    }
  }

  // Log a treasure hunt event publicly
  async logHuntEvent(
    campaignId: string,
    userId: string,
    userName: string,
    eventType: "bomb" | "key",
  ): Promise<void> {
    try {
      await addDoc(collection(db, "treasure_events"), {
        campaignId,
        userId,
        userName,
        eventType,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error logging hunt event:", e);
    }
  }
}

export const treasureHuntService = new TreasureHuntService();
