/**
 * AnalyticsService - Track live streaming events
 * Integrated with Firebase Analytics
 */
import { Platform } from "react-native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../api/firebase";

interface EventParams {
  [key: string]: any;
}

interface UserMetrics {
  sessionId: string;
  userId: string;
  startTime: number;
  events: AnalyticsEvent[];
  errors: ErrorEvent[];
}

interface AnalyticsEvent {
  name: string;
  params?: EventParams;
  timestamp: number;
}

interface ErrorEvent {
  error: string;
  stack?: string;
  context?: string;
  timestamp: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string | null = null;
  private userId: string | null = null;
  private events: AnalyticsEvent[] = [];
  private errors: ErrorEvent[] = [];
  private isSessionActive = false;
  private flushInterval: NodeJS.Timeout | null = null;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  startSession(userId: string): string {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.userId = userId;
    this.events = [];
    this.errors = [];
    this.isSessionActive = true;

    // Auto-flush every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000);

    this.trackEvent("session_start", {
      platform: Platform.OS,
      version: Platform.Version,
    });

    console.log("[Analytics] Session started:", this.sessionId);
    return this.sessionId;
  }

  endSession(): void {
    if (!this.isSessionActive) return;

    this.trackEvent("session_end", {
      duration: Date.now() - (this.events[0]?.timestamp || Date.now()),
      eventCount: this.events.length,
    });

    this.flush();

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    this.isSessionActive = false;
    console.log("[Analytics] Session ended:", this.sessionId);
  }

  trackEvent(name: string, params?: EventParams): void {
    if (!this.isSessionActive) {
      console.warn("[Analytics] No active session");
      return;
    }

    const event: AnalyticsEvent = {
      name,
      params,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Also log to Firebase Analytics
    try {
      // logEvent(analytics, name, params);
    } catch (e) {
      console.log("[Analytics] Firebase log:", name, params);
    }
  }

  trackError(error: string, context?: string): void {
    const errorEvent: ErrorEvent = {
      error,
      context,
      timestamp: Date.now(),
    };

    this.errors.push(errorEvent);
    console.error("[Analytics] Error:", error, context);
  }

   private async flush(): Promise<void> {
     if (!this.sessionId || (this.events.length === 0 && this.errors.length === 0)) {
       return;
     }

     try {
       // Store in Firestore for detailed analysis
       await addDoc(collection(db, "analytics", "events", "live"), {
         sessionId: this.sessionId,
         userId: this.userId,
         events: this.events.slice(-100), // Keep last 100 events
         errors: this.errors.slice(-50),
         platform: Platform.OS,
         timestamp: serverTimestamp(),
       });

       // Clear sent events
       this.events = [];
       this.errors = [];

       console.log("[Analytics] Flushed to Firestore");
     } catch (error) {
       console.error("[Analytics] Flush failed:", error);
     }
   }

  // Pre-defined event tracking methods
  trackLiveRoomJoined(roomId: string, isHost: boolean): void {
    this.trackEvent("live_room_joined", {
      roomId,
      isHost,
      role: isHost ? "host" : "viewer",
    });
  }

  trackLiveRoomLeft(roomId: string, duration: number): void {
    this.trackEvent("live_room_left", {
      roomId,
      watchDuration: duration,
    });
  }

  trackGiftSent(giftId: string, quantity: number, value: number): void {
    this.trackEvent("gift_sent", {
      giftId,
      quantity,
      value,
    });
  }

  trackGiftReceived(giftId: string, value: number): void {
    this.trackEvent("gift_received", {
      giftId,
      value,
    });
  }

  trackPkStarted(roomId: string, opponentId: string): void {
    this.trackEvent("pk_started", {
      roomId,
      opponentId,
    });
  }

  trackPkEnded(roomId: string, winnerId: string, scoreDiff: number): void {
    this.trackEvent("pk_ended", {
      roomId,
      winnerId,
      scoreDiff,
    });
  }

  trackProductViewed(productId: string, price: number): void {
    this.trackEvent("product_viewed", {
      productId,
      price,
    });
  }

  trackProductPurchased(productId: string, quantity: number, total: number): void {
    this.trackEvent("product_purchased", {
      productId,
      quantity,
      total,
    });
  }

  trackScreenShareStarted(roomId: string): void {
    this.trackEvent("screen_share_started", { roomId });
  }

  trackScreenShareStopped(roomId: string, duration: number): void {
    this.trackEvent("screen_share_stopped", {
      roomId,
      duration,
    });
  }
}

// Error handling wrapper
export function withErrorHandling(
  componentName: string,
  handler: () => void
): () => void {
  return () => {
    try {
      handler();
    } catch (error) {
      const analytics = AnalyticsService.getInstance();
      analytics.trackError(
        error instanceof Error ? error.message : "Unknown error",
        componentName
      );
      console.error(`[${componentName}] Error:`, error);
    }
  };
}

// Async error handling wrapper
export async function withAsyncErrorHandling<T>(
  componentName: string,
  handler: () => Promise<T>
): Promise<T | null> {
  try {
    return await handler();
  } catch (error) {
    const analytics = AnalyticsService.getInstance();
    analytics.trackError(
      error instanceof Error ? error.message : "Unknown error",
      componentName
    );
    console.error(`[${componentName}] Error:`, error);
    return null;
  }
}

export const analyticsService = AnalyticsService.getInstance();
export default AnalyticsService;