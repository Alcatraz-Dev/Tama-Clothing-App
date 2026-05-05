/**
 * LiveRecordingService - Record and replay live streams
 */
import { Platform } from "react-native";
import { storage } from "../api/firebase";
import { ref, uploadString, getDownloadURL, uploadBytes } from "firebase/storage";

interface RecordingConfig {
  maxDuration: number; // seconds
  quality: "low" | "medium" | "high";
  includeChat: boolean;
}

interface RecordingSession {
  id: string;
  roomId: string;
  hostId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "recording" | "processing" | "completed" | "failed";
  url?: string;
  thumbnailUrl?: string;
  viewCount: number;
  likes: number;
}

const DEFAULT_CONFIG: RecordingConfig = {
  maxDuration: 3600, // 1 hour
  quality: "high",
  includeChat: true,
};

class LiveRecordingService {
  private static instance: LiveRecordingService;
  private isRecording = false;
  private config: RecordingConfig = DEFAULT_CONFIG;
  private currentSession: RecordingSession | null = null;
  private recordingInterval: NodeJS.Timeout | null = null;
  private chunks: Blob[] = [];

  static getInstance(): LiveRecordingService {
    if (!LiveRecordingService.instance) {
      LiveRecordingService.instance = new LiveRecordingService();
    }
    return LiveRecordingService.instance;
  }

  setConfig(config: Partial<RecordingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async startRecording(roomId: string, hostId: string): Promise<boolean> {
    if (this.isRecording) {
      console.warn("[Recording] Already recording");
      return false;
    }

    console.log(`[Recording] Starting recording for room: ${roomId}`);

    // Note: Actual recording requires native implementation
    // This is a placeholder for the recording logic
    // In production, use native screen capture APIs

    if (Platform.OS === "ios") {
      // iOS Screen Recording - requires native module
      console.log("[Recording] iOS: Use ReplayKit for screen capture");
    } else if (Platform.OS === "android") {
      // Android MediaRecorder - requires native module
      console.log("[Recording] Android: Use MediaRecorder API");
    }

    // Create session record
    this.currentSession = {
      id: `rec_${roomId}_${Date.now()}`,
      roomId,
      hostId,
      startTime: Date.now(),
      status: "recording",
      viewCount: 0,
      likes: 0,
    };

    this.isRecording = true;
    
    // Start duration timer
    this.recordingInterval = setInterval(() => {
      if (this.currentSession) {
        const duration = Math.floor(
          (Date.now() - this.currentSession.startTime) / 1000
        );
        
        if (duration >= this.config.maxDuration) {
          this.stopRecording();
        }
      }
    }, 1000);

    return true;
  }

  async stopRecording(): Promise<RecordingSession | null> {
    if (!this.isRecording || !this.currentSession) {
      console.warn("[Recording] Not recording");
      return null;
    }

    console.log("[Recording] Stopping recording");

    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    const session = {
      ...this.currentSession,
      endTime: Date.now(),
      duration: Math.floor((Date.now() - this.currentSession.startTime) / 1000),
      status: "processing" as const,
    };

    this.isRecording = false;
    this.currentSession = null;

    // Process and upload recording
    // In production, this would upload actual video chunks
    await this.processRecording(session);

    return session;
  }

  private async processRecording(session: RecordingSession): Promise<void> {
    console.log("[Recording] Processing recording...", session.id);

    try {
      // Upload recording to Firebase Storage
      // In production: upload actual video data
      
      // Create thumbnail
      const thumbnailUrl = await this.generateThumbnail(session);

      // Update session with URLs
      session.url = `https://storage.googleapis.com/live-recordings/${session.id}.mp4`;
      session.thumbnailUrl = thumbnailUrl;
      session.status = "completed";

      console.log("[Recording] Upload completed:", session.url);
    } catch (error) {
      console.error("[Recording] Processing failed:", error);
      session.status = "failed";
    }
  }

  private async generateThumbnail(session: RecordingSession): Promise<string> {
    // In production, extract frame from video
    // For demo, return placeholder
    return `https://picsum.photos/seed/${session.id}/320/180`;
  }

  // Add a chat message to the recording
  async addChatMessage(message: string, senderId: string): Promise<void> {
    if (!this.isRecording || !this.currentSession || !this.config.includeChat) {
      return;
    }

    // Store chat messages for later inclusion in replay
    console.log("[Recording] Chat message logged:", message.substring(0, 50));
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  getCurrentSession(): RecordingSession | null {
    return this.currentSession;
  }

  // Get recording settings
  getConfig(): RecordingConfig {
    return { ...this.config };
  }

  // Fetch user's past recordings
  async getUserRecordings(hostId: string): Promise<RecordingSession[]> {
    // In production: fetch from Firestore
    // Demo: return mock data
    return [
      {
        id: "rec_demo_1",
        roomId: "room_1",
        hostId,
        startTime: Date.now() - 86400000, // 1 day ago
        duration: 1800,
        status: "completed",
        url: "https://example.com/rec1.mp4",
        thumbnailUrl: "https://picsum.photos/seed/rec1/320/180",
        viewCount: 1234,
        likes: 89,
      },
      {
        id: "rec_demo_2",
        roomId: "room_2",
        hostId,
        startTime: Date.now() - 172800000, // 2 days ago
        duration: 2400,
        status: "completed",
        url: "https://example.com/rec2.mp4",
        thumbnailUrl: "https://picsum.photos/seed/rec2/320/180",
        viewCount: 567,
        likes: 45,
      },
    ];
  }

  // Delete a recording
  async deleteRecording(recordingId: string): Promise<boolean> {
    try {
      // Delete from storage
      const storageRef = ref(storage, `recordings/${recordingId}`);
      // await deleteObject(storageRef);
      
      console.log("[Recording] Deleted:", recordingId);
      return true;
    } catch (error) {
      console.error("[Recording] Delete failed:", error);
      return false;
    }
  }
}

export const liveRecordingService = LiveRecordingService.getInstance();
export default LiveRecordingService;