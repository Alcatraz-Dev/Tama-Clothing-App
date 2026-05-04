/**
 * LiveShoppingService - Firestore Integration for Real-time Shopping
 * Handles: Live sessions, Products, Chat, Gifts, Coupons, PK Battles
 */
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  increment,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "../api/firebase";
import { RTM_EVENTS } from "../config/stream";

export interface LiveSession {
  id: string;
  channelId: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  brandId?: string;
  collabId?: string;
  status: "upcoming" | "live" | "ended";
  viewerCount: number;
  totalLikes: number;
  totalGifts: number;
  totalSales: number;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;

  // Shopping
  pinnedProduct?: {
    productId: string;
    endTime: number;
  };
  featuredProducts: string[];
  activeCoupon?: {
    code: string;
    discount: number;
    type: string;
    endTime: number;
  };

  // PK
  pkState?: {
    isActive: boolean;
    opponentId?: string;
    opponentName?: string;
    opponentChannelId?: string;
    hostScore: number;
    guestScore: number;
    endTime?: number;
    winner?: string;
  };
}

export interface LiveProduct {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  images: string[];
  colors?: string[];
  sizes?: string[];
  stock: number;
  category?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  type: "message" | "gift" | "system" | "coupon" | "product";
  createdAt: Date;

  // Optional data
  giftData?: {
    giftName: string;
    points: number;
    combo?: number;
  };
  productData?: {
    productId: string;
    productName: string;
  };
}

export class LiveShoppingService {
  private static instance: LiveShoppingService;
  private unsubscribers: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): LiveShoppingService {
    if (!LiveShoppingService.instance) {
      LiveShoppingService.instance = new LiveShoppingService();
    }
    return LiveShoppingService.instance;
  }

  // ==================== LIVE SESSIONS ====================

  async createSession(session: Partial<LiveSession>): Promise<string> {
    const sessionRef = doc(collection(db, "liveSessions"));
    const sessionId = sessionRef.id;

    await setDoc(sessionRef, {
      ...session,
      id: sessionId,
      status: "upcoming",
      viewerCount: 0,
      totalLikes: 0,
      totalGifts: 0,
      totalSales: 0,
      featuredProducts: [],
      createdAt: serverTimestamp(),
    });

    console.log("[LiveShopping] Created session:", sessionId);
    return sessionId;
  }

  async startSession(sessionId: string): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    await updateDoc(sessionRef, {
      status: "live",
      startedAt: serverTimestamp(),
    });
    console.log("[LiveShopping] Started session:", sessionId);
  }

  async endSession(sessionId: string): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    await updateDoc(sessionRef, {
      status: "ended",
      endedAt: serverTimestamp(),
    });
    console.log("[LiveShopping] Ended session:", sessionId);
  }

  async updateViewerCount(sessionId: string, count: number): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    await updateDoc(sessionRef, {
      viewerCount: count,
    });
  }

  async incrementViewerCount(sessionId: string): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    await updateDoc(sessionRef, {
      viewerCount: increment(1),
    });
  }

  async decrementViewerCount(sessionId: string): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    await updateDoc(sessionRef, {
      viewerCount: increment(-1),
    });
  }

  // ==================== LIKES & ENGAGEMENT ====================

  async sendLike(sessionId: string, count: number = 1): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    await updateDoc(sessionRef, {
      totalLikes: increment(count),
    });
  }

  async sendGift(sessionId: string, giftValue: number): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    await updateDoc(sessionRef, {
      totalGifts: increment(giftValue),
    });
  }

  async recordSale(sessionId: string, amount: number): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    await updateDoc(sessionRef, {
      totalSales: increment(amount),
    });
  }

  // ==================== PRODUCTS ====================

  async pinProduct(
    sessionId: string,
    productId: string,
    durationMinutes: number = 5,
  ): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    const endTime = Date.now() + durationMinutes * 60 * 1000;

    await updateDoc(sessionRef, {
      pinnedProduct: {
        productId,
        endTime,
      },
    });
    console.log(
      "[LiveShopping] Pinned product:",
      productId,
      "for",
      durationMinutes,
      "minutes",
    );
  }

  async unpinProduct(sessionId: string): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    await updateDoc(sessionRef, {
      pinnedProduct: null,
    });
    console.log("[LiveShopping] Unpinned product");
  }

  async addToFeaturedProducts(
    sessionId: string,
    productIds: string[],
  ): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    await updateDoc(sessionRef, {
      featuredProducts: productIds,
    });
  }

  // ==================== COUPONS ====================

  async dropCoupon(
    sessionId: string,
    coupon: {
      code: string;
      discount: number;
      type: "percentage" | "fixed" | "free_shipping";
      durationMinutes: number;
    },
  ): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    const endTime = Date.now() + coupon.durationMinutes * 60 * 1000;

    await updateDoc(sessionRef, {
      activeCoupon: {
        code: coupon.code,
        discount: coupon.discount,
        type: coupon.type,
        endTime,
      },
    });
    console.log("[LiveShopping] Dropped coupon:", coupon.code);
  }

  async deactivateCoupon(sessionId: string): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    await updateDoc(sessionRef, {
      activeCoupon: null,
    });
  }

  // ==================== PK BATTLES ====================

  async startPKBattle(
    sessionId: string,
    opponentId: string,
    opponentName: string,
    durationMinutes: number,
  ): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    const endTime = Date.now() + durationMinutes * 60 * 1000;

    await updateDoc(sessionRef, {
      pkState: {
        isActive: true,
        opponentId,
        opponentName,
        hostScore: 0,
        guestScore: 0,
        endTime,
      },
    });
    console.log("[LiveShopping] Started PK battle");
  }

  async updatePKScore(
    sessionId: string,
    isHost: boolean,
    points: number,
  ): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);

    // Get current PK state first
    const sessionSnap = await getDoc(sessionRef);
    const sessionData = sessionSnap.data();
    const pkState = sessionData?.pkState || {};

    if (isHost) {
      await updateDoc(sessionRef, {
        "pkState.hostScore": (pkState.hostScore || 0) + points,
      });
    } else {
      await updateDoc(sessionRef, {
        "pkState.guestScore": (pkState.guestScore || 0) + points,
      });
    }
  }

  async endPKBattle(
    sessionId: string,
    winner: "host" | "guest" | "draw",
  ): Promise<void> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    await updateDoc(sessionRef, {
      "pkState.isActive": false,
      "pkState.winner": winner,
    });
    console.log("[LiveShopping] Ended PK battle, winner:", winner);
  }

  // ==================== REAL-TIME LISTENERS ====================

  subscribeToSession(
    sessionId: string,
    callback: (session: LiveSession | null) => void,
  ): () => void {
    const sessionRef = doc(db, "liveSessions", sessionId);

    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as LiveSession);
      } else {
        callback(null);
      }
    });

    this.unsubscribers.set(`session_${sessionId}`, unsubscribe);
    return unsubscribe;
  }

  subscribeToActiveSessions(
    callback: (sessions: LiveSession[]) => void,
  ): () => void {
    const sessionsRef = collection(db, "liveSessions");
    const q = query(sessionsRef, where("status", "==", "live"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map((doc) => doc.data() as LiveSession);
      callback(sessions);
    });

    this.unsubscribers.set("active_sessions", unsubscribe);
    return unsubscribe;
  }

  subscribeToChat(
    channelId: string,
    callback: (messages: ChatMessage[]) => void,
  ): () => void {
    const chatRef = collection(db, "liveChats", channelId, "messages");
    const q = query(
      chatRef,
      where("createdAt", ">", new Date(Date.now() - 3600000)),
    ); // Last hour

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as ChatMessage;
      });
      // Sort by time
      messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      callback(messages);
    });

    this.unsubscribers.set(`chat_${channelId}`, unsubscribe);
    return unsubscribe;
  }

  subscribeToProducts(
    brandId: string,
    callback: (products: LiveProduct[]) => void,
  ): () => void {
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("brandId", "==", brandId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as LiveProduct,
      );
      callback(products);
    });

    this.unsubscribers.set(`products_${brandId}`, unsubscribe);
    return unsubscribe;
  }

  // ==================== SEND MESSAGES ====================

  async sendChatMessage(
    channelId: string,
    message: Omit<ChatMessage, "id" | "createdAt">,
  ): Promise<string> {
    const chatRef = collection(db, "liveChats", channelId, "messages");
    const newDocRef = doc(chatRef);

    await setDoc(newDocRef, {
      ...message,
      createdAt: serverTimestamp(),
    });

    return newDocRef.id;
  }

  // ==================== UTILITY ====================

  unsubscribeAll(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers.clear();
    console.log("[LiveShopping] Unsubscribed from all listeners");
  }

  async getSession(sessionId: string): Promise<LiveSession | null> {
    const sessionRef = doc(db, "liveSessions", sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      return sessionSnap.data() as LiveSession;
    }
    return null;
  }

  async getProduct(productId: string): Promise<LiveProduct | null> {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      return {
        id: productSnap.id,
        ...productSnap.data(),
      } as LiveProduct;
    }
    return null;
  }

  async getProductsByBrand(brandId: string): Promise<LiveProduct[]> {
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("brandId", "==", brandId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as LiveProduct,
    );
  }
}

// Export singleton
export const liveShoppingService = LiveShoppingService.getInstance();
export default liveShoppingService;
