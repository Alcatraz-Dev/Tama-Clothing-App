/**
 * AgoraLiveShoppingService - Complete Live Shopping Video Engine
 * Using react-native-agora for TikTok-style live streaming
 * Handles: Video, Audio, Beauty Effects, Screen Share, Co-hosting
 */
import {
  NativeModules,
  NativeEventEmitter,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { AGORA_CONFIG, LIVE_UI_THEME, RTM_EVENTS } from "../config/stream";
import { LiveShoppingService } from "./LiveShoppingService";

// Simple event emitter for React Native (replaces Node.js events)
class RNEventEmitter {
  private listeners: { [key: string]: ((...args: any[]) => void)[] } = {};

  addListener(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeListener(event: string, callback: (...args: any[]) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback,
      );
    }
  }

  emit(event: string, ...args: any[]): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(...args));
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

export interface LiveShoppingUser {
  uid: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: "host" | "cohost" | "audience";
  hasVideo: boolean;
  hasAudio: boolean;
}

export interface LiveShoppingConfig {
  channelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: "host" | "audience";
  token?: string;
  isPKMode?: boolean;
  pkHostId?: string;
}

export interface LiveShoppingCallbacks {
  onUserJoined?: (user: LiveShoppingUser) => void;
  onUserLeft?: (uid: number) => void;
  onUserPublished?: (uid: number, mediaType: "video" | "audio") => void;
  onUserUnpublished?: (uid: number, mediaType: "video" | "audio") => void;
  onConnectionStateChanged?: (state: string, reason: string) => void;
  onTokenExpired?: () => void;
  onError?: (error: any) => void;
  onNetworkQuality?: (quality: { uplink: number; downlink: number }) => void;
  onLiveStarted?: () => void;
  onLiveEnded?: () => void;
}

export class AgoraLiveShoppingService extends RNEventEmitter {
  private static instance: AgoraLiveShoppingService | null = null;
  private rtcEngine: any = null;
  private isInitialized = false;
  private isJoined = false;
  private currentChannelId: string = "";
  private localUid: number = 0;
  private localUserId: string = "";
  private localUserName: string = "";
  private localRole: "host" | "audience" = "audience";

  // State
  private isVideoEnabled = true;
  private isAudioEnabled = true;
  private isBeautyEnabled = false;
  private isFrontCamera = true;
  private remoteUsers: Map<number, LiveShoppingUser> = new Map();
  private networkQuality = { downlink: 5, uplink: 5 };

  // Callbacks
  private callbacks: LiveShoppingCallbacks = {};

  // private constructor() {
  //   // RNEventEmitter doesn't require super() call
  // }

  static getInstance(): AgoraLiveShoppingService {
    if (!AgoraLiveShoppingService.instance) {
      AgoraLiveShoppingService.instance = new AgoraLiveShoppingService();
    }
    return AgoraLiveShoppingService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      const agora = await import("react-native-agora");
      const createAgoraRtcEngine = agora.default || agora.createAgoraRtcEngine;

      this.rtcEngine = createAgoraRtcEngine();

      // Initialize with app ID
      await this.rtcEngine.initialize({
        appId: AGORA_CONFIG.appId,
        channelProfile: AGORA_CONFIG.channelProfile,
      });

      // Enable video
      await this.rtcEngine.enableVideo();

      // Set up channel profile for live broadcasting
      await this.rtcEngine.setClientRole(
        this.localRole === "host"
          ? AGORA_CONFIG.clientRoleBroadcaster
          : AGORA_CONFIG.clientRoleAudience,
      );

      // Configure video encoder
      await this.rtcEngine.setVideoEncoderConfiguration(
        AGORA_CONFIG.videoEncoderConfig,
      );

      // Enable dual stream for better performance
      if (AGORA_CONFIG.enableDualStream) {
        await this.rtcEngine.enableDualStreamMode(true);
      }

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log("[AgoraLiveShopping] Initialized successfully");
      return true;
    } catch (error) {
      console.error("[AgoraLiveShopping] Init error:", error);
      this.callbacks.onError?.(error);
      return false;
    }
  }

  private setupEventListeners(): void {
    if (!this.rtcEngine) return;

    // User joined
    this.rtcEngine.addEventListener("user-joined", (uid: number) => {
      console.log("[AgoraLiveShopping] User joined:", uid);
      this.emit("user-joined", uid);
    });

    // User left
    this.rtcEngine.addEventListener("user-left", (uid: number) => {
      console.log("[AgoraLiveShopping] User left:", uid);
      this.remoteUsers.delete(uid);
      this.emit("user-left", uid);
      this.callbacks.onUserLeft?.(uid);
    });

    // User published
    this.rtcEngine.addEventListener(
      "user-published",
      async (uid: number, mediaType: number) => {
        console.log("[AgoraLiveShopping] User published:", uid, mediaType);

        // Subscribe to the user
        await this.rtcEngine?.subscribe(uid, mediaType);

        const user = this.remoteUsers.get(uid);
        if (user) {
          if (mediaType === 0) user.hasVideo = true;
          if (mediaType === 1) user.hasAudio = true;
        }

        this.callbacks.onUserPublished?.(
          uid,
          mediaType === 0 ? "video" : "audio",
        );
      },
    );

    // User unpublished
    this.rtcEngine.addEventListener(
      "user-unpublished",
      (uid: number, mediaType: number) => {
        console.log("[AgoraLiveShopping] User unpublished:", uid, mediaType);

        const user = this.remoteUsers.get(uid);
        if (user) {
          if (mediaType === 0) user.hasVideo = false;
          if (mediaType === 1) user.hasAudio = false;
        }

        this.callbacks.onUserUnpublished?.(
          uid,
          mediaType === 0 ? "video" : "audio",
        );
      },
    );

    // Connection state changed
    this.rtcEngine.addEventListener(
      "connectionStateChanged",
      (state: number, reason: number) => {
        const stateStr = this.getConnectionStateString(state);
        const reasonStr = this.getConnectionReasonString(reason);
        console.log(
          "[AgoraLiveShopping] Connection state:",
          stateStr,
          reasonStr,
        );

        this.callbacks.onConnectionStateChanged?.(stateStr, reasonStr);

        if (state === 6) {
          // DISCONNECTED
          this.isJoined = false;
        }
      },
    );

    // Network quality
    this.rtcEngine.addEventListener(
      "network-quality",
      (uid: number, stats: any) => {
        if (uid === 0) {
          this.networkQuality = {
            uplink: stats?.txQuality || 5,
            downlink: stats?.rxQuality || 5,
          };
          this.callbacks.onNetworkQuality?.(this.networkQuality);
        }
      },
    );

    // Token expired
    this.rtcEngine.addEventListener("tokenPrivilegeWillExpire", () => {
      console.log("[AgoraLiveShopping] Token expired");
      this.callbacks.onTokenExpired?.();
    });

    // Error
    this.rtcEngine.addEventListener("error", (error: any) => {
      console.error("[AgoraLiveShopping] Error:", error);
      this.callbacks.onError?.(error);
    });
  }

  private getConnectionStateString(state: number): string {
    const states: { [key: number]: string } = {
      0: "DISCONNECTED",
      1: "CONNECTING",
      2: "CONNECTED",
      3: "RECONNECTING",
      4: "FAILED",
      5: "ABORTED",
    };
    return states[state] || "UNKNOWN";
  }

  private getConnectionReasonString(reason: number): string {
    const reasons: { [key: number]: string } = {
      0: "JOIN_SUCCESS",
      1: "INVALID_APP_ID",
      2: "INVALID_CHANNEL_NAME",
      3: "INVALID_TOKEN",
      4: "TOKEN_EXPIRED",
      5: "REJECTED",
      6: "SERVER_ERROR",
      7: "NOT_LEAVING",
      8: "NOT_INITIALIZED",
    };
    return reasons[reason] || "UNKNOWN";
  }

  async joinChannel(
    config: LiveShoppingConfig,
    callbacks?: LiveShoppingCallbacks,
  ): Promise<number> {
    if (!this.rtcEngine) {
      await this.initialize();
    }

    this.callbacks = callbacks || {};
    this.currentChannelId = config.channelId;
    this.localUserId = config.userId;
    this.localUserName = config.userName;
    this.localRole = config.role;

    try {
      // Request permissions
      await this.requestPermissions();

      // Set client role
      await this.rtcEngine.setClientRole(
        config.role === "host"
          ? AGORA_CONFIG.clientRoleBroadcaster
          : AGORA_CONFIG.clientRoleAudience,
      );

      // Enable/disable video based on role
      if (config.role === "host") {
        await this.rtcEngine.enableVideo();
        await this.rtcEngine.enableLocalVideo(true);
      } else {
        await this.rtcEngine.enableVideo();
      }

      // Join channel
      const uid = await this.rtcEngine.joinChannel(
        {
          token: config.token || null,
          channel: config.channelId,
          uid: 0,
          clientRole: config.role === "host" ? 1 : 2,
        },
        config.userId,
      );

      this.localUid = uid;
      this.isJoined = true;

      // Add self to remote users (for co-host scenarios)
      this.remoteUsers.set(uid, {
        uid,
        userId: config.userId,
        userName: config.userName,
        userAvatar: config.userAvatar,
        role: config.role,
        hasVideo: config.role === "host",
        hasAudio: true,
      });

      console.log(
        "[AgoraLiveShopping] Joined channel:",
        config.channelId,
        "with uid:",
        uid,
      );
      this.callbacks.onLiveStarted?.();

      return uid;
    } catch (error) {
      console.error("[AgoraLiveShopping] Join channel error:", error);
      this.callbacks.onError?.(error);
      throw error;
    }
  }

  private async requestPermissions(): Promise<void> {
    if (Platform.OS === "android") {
      try {
        const cameraGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "App needs camera permission for live streaming",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          },
        );

        const micGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "App needs microphone permission for live streaming",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          },
        );

        if (
          cameraGranted !== PermissionsAndroid.RESULTS.GRANTED ||
          micGranted !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.warn("[AgoraLiveShopping] Permissions not granted");
        }
      } catch (err) {
        console.warn("[AgoraLiveShopping] Permission error:", err);
      }
    }
  }

  async leaveChannel(): Promise<void> {
    if (!this.rtcEngine || !this.isJoined) return;

    try {
      await this.rtcEngine.leaveChannel();
      this.isJoined = false;
      this.remoteUsers.clear();
      this.callbacks.onLiveEnded?.();
      console.log("[AgoraLiveShopping] Left channel");
    } catch (error) {
      console.error("[AgoraLiveShopping] Leave error:", error);
    }
  }

  // Video Controls
  async toggleCamera(): Promise<boolean> {
    if (!this.rtcEngine) return false;

    this.isVideoEnabled = !this.isVideoEnabled;
    await this.rtcEngine.enableLocalVideo(this.isVideoEnabled);
    console.log(
      "[AgoraLiveShopping] Camera:",
      this.isVideoEnabled ? "ON" : "OFF",
    );
    return this.isVideoEnabled;
  }

  async toggleMic(): Promise<boolean> {
    if (!this.rtcEngine) return false;

    this.isAudioEnabled = !this.isAudioEnabled;
    await this.rtcEngine.enableLocalAudio(this.isAudioEnabled);
    console.log("[AgoraLiveShopping] Mic:", this.isAudioEnabled ? "ON" : "OFF");
    return this.isAudioEnabled;
  }

  async switchCamera(): Promise<void> {
    if (!this.rtcEngine) return;

    await this.rtcEngine.switchCamera();
    this.isFrontCamera = !this.isFrontCamera;
    console.log(
      "[AgoraLiveShopping] Camera switched, isFront:",
      this.isFrontCamera,
    );
  }

  // Beauty Effects
  async setBeautyEffect(enabled: boolean, options?: any): Promise<void> {
    if (!this.rtcEngine) return;

    this.isBeautyEnabled = enabled;

    if (enabled) {
      const beautyOptions = options || AGORA_CONFIG.beautyOptions;
      await this.rtcEngine.setBeautyEffectOptions(true, {
        lighteningContrastLevel: beautyOptions.lighteningContrastLevel || 0.5,
        smoothnessLevel: beautyOptions.smoothnessLevel || 0.5,
        colorLevel: beautyOptions.colorLevel || 0.5,
        redLevel: beautyOptions.redLevel || 0.5,
        sharpnessLevel: 0,
      });
    } else {
      await this.rtcEngine.setBeautyEffectOptions(false, {});
    }

    console.log("[AgoraLiveShopping] Beauty effect:", enabled ? "ON" : "OFF");
  }

  // Screen Sharing
  async startScreenShare(): Promise<void> {
    if (!this.rtcEngine || Platform.OS !== "android") return;

    try {
      await this.rtcEngine.startScreenCapture({
        captureVideo: 1,
        captureAudio: 1,
      });
      console.log("[AgoraLiveShopping] Screen share started");
    } catch (error) {
      console.error("[AgoraLiveShopping] Screen share error:", error);
    }
  }

  async stopScreenShare(): Promise<void> {
    if (!this.rtcEngine) return;

    try {
      await this.rtcEngine.stopScreenCapture();
      console.log("[AgoraLiveShopping] Screen share stopped");
    } catch (error) {
      console.error("[AgoraLiveShopping] Stop screen share error:", error);
    }
  }

  // Getters
  getLocalUid(): number {
    return this.localUid;
  }

  getRemoteUsers(): LiveShoppingUser[] {
    return Array.from(this.remoteUsers.values());
  }

  getRemoteUser(uid: number): LiveShoppingUser | undefined {
    return this.remoteUsers.get(uid);
  }

  isVideoOn(): boolean {
    return this.isVideoEnabled;
  }

  isMicOn(): boolean {
    return this.isAudioEnabled;
  }

  isBeautyOn(): boolean {
    return this.isBeautyEnabled;
  }

  isJoinedToChannel(): boolean {
    return this.isJoined;
  }

  getNetworkQuality(): { uplink: number; downlink: number } {
    return this.networkQuality;
  }

  getStats() {
    return {
      isVideoEnabled: this.isVideoEnabled,
      isAudioEnabled: this.isAudioEnabled,
      isBeautyEnabled: this.isBeautyEnabled,
      networkQuality: this.networkQuality,
      remoteUsersCount: this.remoteUsers.size,
      channelId: this.currentChannelId,
      localUid: this.localUid,
      isJoined: this.isJoined,
    };
  }

  // Cleanup
  destroy(): void {
    this.leaveChannel();
    if (this.rtcEngine) {
      this.rtcEngine.destroy();
      this.rtcEngine = null;
    }
    this.isInitialized = false;
    this.removeAllListeners();
    AgoraLiveShoppingService.instance = null;
    console.log("[AgoraLiveShopping] Service destroyed");
  }
}

// Export singleton instance
export const agoraService = AgoraLiveShoppingService.getInstance();
export const liveShoppingService = LiveShoppingService.getInstance();
export default agoraService;
