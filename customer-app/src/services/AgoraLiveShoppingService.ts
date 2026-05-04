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
import {
  AGORA_CONFIG,
  LIVE_UI_THEME,
  RTM_EVENTS,
  BEAUTY_PRESETS,
} from "../config/stream";
import { LiveShoppingService } from "./LiveShoppingService";

// Agora SDK imports - these will only work on real devices
// Using require for proper dynamic loading
let RtcSurfaceView: any = null;

export const getAgoraComponents = async () => {
  if (RtcSurfaceView) {
    return { RtcSurfaceView };
  }
  
  try {
    // Try to load the Agora module dynamically
    const agoraModule = require("react-native-agora");
    RtcSurfaceView = agoraModule.RtcSurfaceView;
    return { RtcSurfaceView };
  } catch (e) {
    console.warn("[Agora] Failed to load Agora modules:", e);
    return { RtcSurfaceView: null };
  }
};

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
  onUserMuted?: (uid: number, muted: boolean) => void;
  onCoHostRequested?: (uid: number) => void;
  onPKStarted?: (pkData: any) => void;
  onPKUpdated?: (pkData: any) => void;
  onPKEnded?: (winner: string) => void;
  onGiftReceived?: (giftData: any) => void;
  onChatMessage?: (message: any) => void;
}

export class AgoraLiveShoppingService extends RNEventEmitter {
  private static instance: AgoraLiveShoppingService | null = null;
  private rtcEngine: any = null;
  private rtmEngine: any = null;
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

  // Co-host state
  private coHostUids: Set<number> = new Set();
  private pkOpponentChannel: string | null = null;

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

    // Store callbacks for external use
    const self = this;

    // Try to set up event listeners using react-native-agora API
    try {
      // Check if addListener method exists (newer versions)
      if (typeof this.rtcEngine.addListener === "function") {
        this.rtcEngine.addListener("UserJoined", (uid: number) => {
          console.log("[AgoraLiveShopping] User joined:", uid);
          // Add to remote users
          self.remoteUsers.set(uid, {
            uid,
            userId: uid.toString(),
            userName: "User " + uid,
            role: "audience",
            hasVideo: true,
            hasAudio: true,
          });
          self.emit("user-joined", uid);
          self.callbacks.onUserJoined?.({
            uid,
            userId: uid.toString(),
            userName: "User " + uid,
            role: "audience",
            hasVideo: true,
            hasAudio: true,
          });
        });

        this.rtcEngine.addListener("UserOffline", (uid: number) => {
          console.log("[AgoraLiveShopping] User left:", uid);
          self.remoteUsers.delete(uid);
          self.emit("user-left", uid);
          self.callbacks.onUserLeft?.(uid);
        });

        this.rtcEngine.addListener("UserPublished", (uid: number, mediaType: number) => {
          console.log("[AgoraLiveShopping] User published:", uid, mediaType);
          self.emit("user-published", uid, mediaType === 1 ? "video" : "audio");
          self.callbacks.onUserPublished?.(uid, mediaType === 1 ? "video" : "audio");
        });

        this.rtcEngine.addListener("UserUnpublished", (uid: number, mediaType: number) => {
          console.log("[AgoraLiveShopping] User unpublished:", uid, mediaType);
          self.emit("user-unpublished", uid, mediaType === 1 ? "video" : "audio");
          self.callbacks.onUserUnpublished?.(uid, mediaType === 1 ? "video" : "audio");
        });

        this.rtcEngine.addListener("RemoteVideoStateChanged", (uid: number, state: number) => {
          console.log("[AgoraLiveShopping] Remote video state changed:", uid, state);
          const user = self.remoteUsers.get(uid);
          if (user) {
            user.hasVideo = state === 2; // 2 = playing
            self.remoteUsers.set(uid, user);
          }
        });

        this.rtcEngine.addListener("RemoteAudioStateChanged", (uid: number, state: number) => {
          console.log("[AgoraLiveShopping] Remote audio state changed:", uid, state);
          const user = self.remoteUsers.get(uid);
          if (user) {
            user.hasAudio = state === 2; // 2 = playing
            self.remoteUsers.set(uid, user);
          }
        });

        console.log("[AgoraLiveShopping] Event listeners set up (addListener)");
        return;
      }

      // Fallback: try addEventListener (older versions)
      if (typeof this.rtcEngine.addEventListener === "function") {
        this.rtcEngine.addEventListener("user-joined", (uid: number) => {
          console.log("[AgoraLiveShopping] User joined:", uid);
          self.remoteUsers.set(uid, {
            uid,
            userId: uid.toString(),
            userName: "User " + uid,
            role: "audience",
            hasVideo: true,
            hasAudio: true,
          });
          self.emit("user-joined", uid);
          self.callbacks.onUserJoined?.({
            uid,
            userId: uid.toString(),
            userName: "User " + uid,
            role: "audience",
            hasVideo: true,
            hasAudio: true,
          });
        });

this.rtcEngine.addEventListener("user-left", (uid: number) => {
           console.log("[AgoraLiveShopping] User left:", uid);
           self.remoteUsers.delete(uid);
           self.emit("user-left", uid);
           self.callbacks.onUserLeft?.(uid);
         });

         this.rtcEngine.addEventListener("user-published", (uid: number, mediaType: number) => {
           console.log("[AgoraLiveShopping] User published:", uid, mediaType);
           self.emit("user-published", uid, mediaType === 1 ? "video" : "audio");
           self.callbacks.onUserPublished?.(uid, mediaType === 1 ? "video" : "audio");
         });

         this.rtcEngine.addEventListener("user-unpublished", (uid: number, mediaType: number) => {
           console.log("[AgoraLiveShopping] User unpublished:", uid, mediaType);
           self.emit("user-unpublished", uid, mediaType === 1 ? "video" : "audio");
           self.callbacks.onUserUnpublished?.(uid, mediaType === 1 ? "video" : "audio");
         });

         console.log("[AgoraLiveShopping] Event listeners set up (addEventListener)");
        return;
      }

      // If no event listener methods available, log warning
      console.warn("[AgoraLiveShopping] No event listener methods available - remote users won't be tracked");
    } catch (e) {
      console.warn("[AgoraLiveShopping] Event listener setup failed:", e);
    }
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

  // ==================== CO-HOSTING ====================

  async requestCoHost(uid: number): Promise<void> {
    if (!this.rtcEngine || this.localRole !== "host") return;

    try {
      await this.rtcEngine.setClientRole(1);
      this.coHostUids.add(uid);

      const user = this.remoteUsers.get(uid);
      if (user) {
        user.role = "cohost";
        this.remoteUsers.set(uid, user);
      }

      console.log("[AgoraLiveShopping] User", uid, "is now co-host");
    } catch (error) {
      console.error("[AgoraLiveShopping] Co-host request error:", error);
    }
  }

  async removeCoHost(uid: number): Promise<void> {
    if (!this.rtcEngine) return;

    this.coHostUids.delete(uid);

    const user = this.remoteUsers.get(uid);
    if (user) {
      user.role = "audience";
      this.remoteUsers.set(uid, user);
    }

    console.log("[AgoraLiveShopping] Removed co-host:", uid);
  }

  async muteUser(uid: number, muted: boolean): Promise<void> {
    if (!this.rtcEngine || this.localRole !== "host") return;

    try {
      await this.rtcEngine.muteRemoteAudioStream(uid, muted);
      await this.rtcEngine.muteRemoteVideoStream(uid, muted);
      this.callbacks.onUserMuted?.(uid, muted);
      console.log("[AgoraLiveShopping] Muted user", uid, ":", muted);
    } catch (error) {
      console.error("[AgoraLiveShopping] Mute user error:", error);
    }
  }

  // ==================== REMOTE VIDEO/AUDIO SUBSCRIPTION ====================

  async subscribeToRemoteUser(uid: number, mediaType: "video" | "audio" = "video"): Promise<void> {
    if (!this.rtcEngine) return;

    try {
      await this.rtcEngine.subscribe(uid, mediaType);
      console.log("[AgoraLiveShopping] Subscribed to", mediaType, "of user", uid);
    } catch (error) {
      console.error("[AgoraLiveShopping] Subscribe error:", error);
    }
  }

  async unsubscribeFromRemoteUser(uid: number, mediaType: "video" | "audio" = "video"): Promise<void> {
    if (!this.rtcEngine) return;

    try {
      await this.rtcEngine.unsubscribe(uid, mediaType);
      console.log("[AgoraLiveShopping] Unsubscribed from", mediaType, "of user", uid);
    } catch (error) {
      console.error("[AgoraLiveShopping] Unsubscribe error:", error);
    }
  }

  // ==================== RTM (MESSAGING) ====================

  async initializeRTM(userId: string, token?: string): Promise<boolean> {
    try {
      // @ts-ignore - agora-rtm types may not be available
      const agoraRTM = require("agora-rtm");
      // @ts-ignore
      this.rtmEngine = new agoraRTM.RTM(AGORA_CONFIG.appId, userId, { token });
      await this.rtmEngine.login({});

      console.log("[AgoraLiveShopping] RTM initialized");
      return true;
    } catch (error) {
      console.error("[AgoraLiveShopping] RTM init error:", error);
      return false;
    }
  }

  async joinRTMChannel(channelId: string): Promise<void> {
    if (!this.rtmEngine) return;

    try {
      // Handle both versions - createChannel or getChannel
      let channel;
      if (typeof this.rtmEngine.createChannel === "function") {
        channel = this.rtmEngine.createChannel(channelId);
      } else if (typeof this.rtmEngine.getChannel === "function") {
        channel = this.rtmEngine.getChannel(channelId);
      } else {
        throw new Error("Cannot create RTM channel");
      }
      
      await channel.join();

      channel.on("ChannelMessage", (message: any) => {
        const data = JSON.parse(message.text);
        this.handleRTMMessage(data);
      });

      this.emit("rtm-channel-joined", channelId);
      console.log("[AgoraLiveShopping] RTM channel joined:", channelId);
    } catch (error) {
      console.error("[AgoraLiveShopping] RTM channel join error:", error);
    }
  }

  private handleRTMMessage(data: any): void {
    switch (data.event) {
      case RTM_EVENTS.GIFT:
        this.callbacks.onGiftReceived?.(data.payload);
        break;
      case RTM_EVENTS.CHAT_MESSAGE:
        this.callbacks.onChatMessage?.(data.payload);
        break;
      case RTM_EVENTS.PK_START:
        this.pkOpponentChannel = data.payload.opponentChannelId;
        this.callbacks.onPKStarted?.(data.payload);
        break;
      case RTM_EVENTS.PK_VOTE:
        this.callbacks.onPKUpdated?.(data.payload);
        break;
      case RTM_EVENTS.PK_END:
        this.pkOpponentChannel = null;
        this.callbacks.onPKEnded?.(data.payload.winner);
        break;
    }
  }

  async sendRTMMessage(channelId: string, event: string, payload: any): Promise<void> {
    if (!this.rtmEngine) return;

    try {
      const channel = this.rtmEngine.getChannel(channelId);
      await channel.sendMessage({
        text: JSON.stringify({ event, payload }),
      });
    } catch (error) {
      console.error("[AgoraLiveShopping] RTM send error:", error);
    }
  }

  // ==================== PK BATTLES ====================

  async startPKBattle(
    opponentChannelId: string,
    opponentName: string,
    durationMinutes: number,
  ): Promise<void> {
    this.pkOpponentChannel = opponentChannelId;

    await this.sendRTMMessage(opponentChannelId, RTM_EVENTS.PK_START, {
      opponentChannelId: this.currentChannelId,
      opponentName: this.localUserName,
      durationMinutes,
    });

    console.log("[AgoraLiveShopping] PK battle started");
  }

  async votePK(score: number): Promise<void> {
    if (!this.pkOpponentChannel) return;

    await this.sendRTMMessage(this.pkOpponentChannel, RTM_EVENTS.PK_VOTE, {
      score,
      voterId: this.localUserId,
    });
  }

  async endPKBattle(winner: "host" | "guest" | "draw"): Promise<void> {
    if (!this.pkOpponentChannel) return;

    await this.sendRTMMessage(this.pkOpponentChannel, RTM_EVENTS.PK_END, {
      winner,
    });

    this.pkOpponentChannel = null;
    console.log("[AgoraLiveShopping] PK battle ended, winner:", winner);
  }

  // ==================== GETTERS ====================

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
      coHostCount: this.coHostUids.size,
      isPKBattle: !!this.pkOpponentChannel,
    };
  }

  // ==================== BEAUTY PRESETS ====================

  async setBeautyPreset(preset: "natural" | "radiant" | "dramatic"): Promise<void> {
    const options = BEAUTY_PRESETS[preset];
    if (options) {
      await this.setBeautyEffect(true, options);
    }
  }

  // ==================== CALLBACK MANAGEMENT ====================

  updateCallbacks(callbacks: LiveShoppingCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Cleanup
  destroy(): void {
    this.leaveChannel();
    if (this.rtcEngine) {
      this.rtcEngine.destroy();
      this.rtcEngine = null;
    }
    if (this.rtmEngine) {
      this.rtmEngine.logout();
      this.rtmEngine = null;
    }
    this.isInitialized = false;
    this.coHostUids.clear();
    this.pkOpponentChannel = null;
    this.removeAllListeners();
    AgoraLiveShoppingService.instance = null;
    console.log("[AgoraLiveShopping] Service destroyed");
  }
}

// Export singleton instance
export const agoraService = AgoraLiveShoppingService.getInstance();
export const liveShoppingService = LiveShoppingService.getInstance();
export default agoraService;
