/**
 * AgoraService - Robust Agora SDK wrapper
 * Handles simulator/emulator vs real device differences
 * and provides fallback for demo mode
 */
import { Platform } from "react-native";

const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || "";
const IS_SIMULATOR = Platform.OS === "ios" && !Platform.isPad;

interface AgoraUser {
  uid: number;
  userId: string;
  userName: string;
  hasVideo: boolean;
  hasAudio: boolean;
}

interface AgoraCallbacks {
  onJoinChannelSuccess?: (channel: string, uid: number) => void;
  onUserJoined?: (user: AgoraUser) => void;
  onUserLeft?: (uid: number) => void;
  onError?: (error: any) => void;
}

class AgoraService {
  private static instance: AgoraService;
  private engine: any = null;
  private isInitialized = false;
  private isJoined = false;
  private channelId = "";
  private localUid = 0;
  private callbacks: AgoraCallbacks = {};
  private remoteUsers: Map<number, AgoraUser> = new Map();

  static getInstance(): AgoraService {
    if (!AgoraService.instance) {
      AgoraService.instance = new AgoraService();
    }
    return AgoraService.instance;
  }

  // Check if we can use real Agora (real device only)
  canUseRealAgora(): boolean {
    if (!AGORA_APP_ID) {
      console.log("[Agora] No App ID configured");
      return false;
    }
    if (IS_SIMULATOR) {
      console.log("[Agora] Running on simulator - using demo mode");
      return false;
    }
    return true;
  }

  // Initialize Agora engine
  async initialize(callbacks?: AgoraCallbacks): Promise<boolean> {
    if (this.isInitialized) return true;
    
    if (this.canUseRealAgora()) {
      return this.initializeRealAgora(callbacks);
    } else {
      // Demo mode - simulate initialization
      console.log("[Agora] Running in DEMO mode (no real video)");
      this.isInitialized = true;
      this.callbacks = callbacks || {};
      return true;
    }
  }

  private async initializeRealAgora(callbacks?: AgoraCallbacks): Promise<boolean> {
    try {
      const { createAgoraRtcEngine } = await import("react-native-agora");
      this.engine = createAgoraRtcEngine();
      
      await this.engine.initialize({
        appId: AGORA_APP_ID,
        channelProfile: 1, // LIVE_BROADCASTING
      });

      await this.engine.enableVideo();
      
      this.engine.addListener("JoinChannelSuccess", (channel: string, uid: number) => {
        console.log("[Agora] Joined channel:", channel, uid);
        this.callbacks.onJoinChannelSuccess?.(channel, uid);
      });

      this.engine.addListener("UserJoined", (uid: number) => {
        console.log("[Agora] User joined:", uid);
        const user: AgoraUser = {
          uid,
          userId: uid.toString(),
          userName: `User ${uid}`,
          hasVideo: true,
          hasAudio: true,
        };
        this.remoteUsers.set(uid, user);
        this.callbacks.onUserJoined?.(user);
      });

      this.engine.addListener("UserOffline", (uid: number) => {
        console.log("[Agora] User left:", uid);
        this.remoteUsers.delete(uid);
        this.callbacks.onUserLeft?.(uid);
      });

      this.isInitialized = true;
      console.log("[Agora] Real Agora initialized successfully");
      return true;
    } catch (error) {
      console.error("[Agora] Real initialization failed:", error);
      // Fall back to demo mode
      this.isInitialized = true;
      this.callbacks = callbacks || {};
      return true;
    }
  }

  // Join a channel
  async joinChannel(
    channelId: string,
    userId: string,
    userName: string,
    role: "host" | "audience",
    token?: string
  ): Promise<number> {
    this.channelId = channelId;

    if (this.canUseRealAgora() && this.engine) {
      try {
        const uid = await this.engine.joinChannel(
          {
            token: token || null,
            channel: channelId,
            uid: 0,
            clientRole: role === "host" ? 1 : 2,
          },
          userId
        );
        this.localUid = uid;
        this.isJoined = true;
        return uid;
      } catch (error) {
        console.error("[Agora] Join channel failed:", error);
        this.callbacks.onError?.(error);
        // Use demo mode
        return this.getDemoUid();
      }
    }

    // Demo mode
    return this.getDemoUid();
  }

  private getDemoUid(): number {
    this.localUid = Math.floor(Math.random() * 100000);
    this.isJoined = true;
    console.log("[Agora] Demo mode - joined as:", this.localUid);
    this.callbacks.onJoinChannelSuccess?.(this.channelId, this.localUid);
    return this.localUid;
  }

  // Leave channel
  async leaveChannel(): Promise<void> {
    if (this.canUseRealAgora() && this.engine && this.isJoined) {
      try {
        await this.engine.leaveChannel();
      } catch (error) {
        console.error("[Agora] Leave channel error:", error);
      }
    }
    this.isJoined = false;
    this.channelId = "";
    this.localUid = 0;
    this.remoteUsers.clear();
    console.log("[Agora] Left channel (demo or real)");
  }

  // Toggle camera
  async toggleCamera(enabled: boolean): Promise<void> {
    if (this.canUseRealAgora() && this.engine) {
      try {
        await this.engine.enableLocalVideo(enabled);
      } catch (error) {
        console.error("[Agora] Toggle camera error:", error);
      }
    }
  }

  // Toggle microphone
  async toggleMicrophone(enabled: boolean): Promise<void> {
    if (this.canUseRealAgora() && this.engine) {
      try {
        await this.engine.muteLocalAudioStream(!enabled);
      } catch (error) {
        console.error("[Agora] Toggle mic error:", error);
      }
    }
  }

  // Switch camera
  async switchCamera(): Promise<void> {
    if (this.canUseRealAgora() && this.engine) {
      try {
        await this.engine.switchCamera();
      } catch (error) {
        console.error("[Agora] Switch camera error:", error);
      }
    }
  }

  // Get local UID
  getLocalUid(): number {
    return this.localUid;
  }

  // Get remote users
  getRemoteUsers(): AgoraUser[] {
    return Array.from(this.remoteUsers.values());
  }

  // Check if joined
  isChannelJoined(): boolean {
    return this.isJoined;
  }

  // Cleanup
  destroy(): void {
    if (this.engine) {
      try {
        this.engine.destroy();
      } catch (error) {
        console.error("[Agora] Destroy error:", error);
      }
    }
    this.engine = null;
    this.isInitialized = false;
    this.isJoined = false;
    console.log("[Agora] Service destroyed");
  }
}

export const agoraService = AgoraService.getInstance();
export default AgoraService;