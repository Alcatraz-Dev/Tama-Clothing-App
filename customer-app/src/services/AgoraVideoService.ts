/**
 * AgoraVideoService - Premium Live Shopping Video Engine
 * Provides high-quality RTMP/RTMSP streaming (TikTok/Agora standard)
 * Real-time events remain on Stream Chat custom events for reliability
 */
import { EventEmitter } from "events";
import { AGORA_CONFIG } from "../config/stream";

export class AgoraVideoService extends EventEmitter {
  private rtcEngine: any = null;
  private isInitialized = false;
  private isJoined = false;
  private currentChannelId: string = "";
  private localUid: number = 0;
  private isVideoEnabled = true;
  private isAudioEnabled = true;
  private networkQuality = { downlink: 5, uplink: 5 };
  private remoteUsers = new Map<number, any>();

  constructor() {
    super();
  }

  async initialize(): Promise<boolean> {
    try {
      const agora = await import("react-native-agora");
      const createAgoraRtcEngine = agora.default || agora.createAgoraRtcEngine;
      this.rtcEngine = createAgoraRtcEngine();
      await this.rtcEngine.initialize({ appId: AGORA_CONFIG.appId });
      await this.rtcEngine.setChannelProfile(1);
      await this.rtcEngine.setClientRole(1);
      await this.rtcEngine.setVideoEncoderConfiguration({
        dimensions: { width: AGORA_CONFIG.videoEncoderConfig.width, height: AGORA_CONFIG.videoEncoderConfig.height },
        frameRate: AGORA_CONFIG.videoEncoderConfig.frameRate,
        bitrate: AGORA_CONFIG.videoEncoderConfig.bitrate,
        orientationMode: 0,
      });
      if (AGORA_CONFIG.beautyEffects) {
        await this.rtcEngine.setBeautyEffectOptions(true, AGORA_CONFIG.beautyOptions);
      }
      await this.rtcEngine.enableLowLightEnhancement(true);
      await this.rtcEngine.enableDualStreamMode(true);
      this.setupRtcEventListeners();
      this.isInitialized = true;
      console.log("[AgoraVideoService] Ready - Video engine initialized");
      return true;
    } catch (error) {
      console.error("[AgoraVideoService] Init error:", error);
      this.emit("stream-error", { error, type: "init" });
      return false;
    }
  }

  async joinChannel(channelId: string, token: string | null = null, uid?: number): Promise<number> {
    if (!this.rtcEngine) throw new Error("Agora not initialized");
    this.currentChannelId = channelId;
    this.localUid = await this.rtcEngine.joinChannel(
      { token, uid: uid || 0, clientRole: 1 },
      channelId
    );
    this.isJoined = true;
    return this.localUid;
  }

  private setupRtcEventListeners(): void {
    if (!this.rtcEngine) return;
    this.rtcEngine.addEventListener("user-published", async (uid: number, mediaType: number) => {
      await this.rtcEngine?.subscribe(uid, mediaType);
    });
    this.rtcEngine.addEventListener("user-unpublished", (uid: number) => {
      this.remoteUsers.delete(uid);
      this.emit("user-left", { uid });
    });
    this.rtcEngine.addEventListener("user-joined", (uid: number) => {
      this.emit("user-joined", { uid });
    });
    this.rtcEngine.addEventListener("network-quality", (uid: number, stats: any) => {
      if (uid === 0) {
        this.networkQuality = { uplink: stats.txQuality, downlink: stats.rxQuality };
        this.emit("network-quality", stats);
      }
    });
  }

  async toggleCamera(): Promise<boolean> {
    if (!this.rtcEngine) return false;
    this.isVideoEnabled = !this.isVideoEnabled;
    await this.rtcEngine.enableLocalVideo(this.isVideoEnabled);
    return this.isVideoEnabled;
  }

  async toggleMic(): Promise<boolean> {
    if (!this.rtcEngine) return false;
    this.isAudioEnabled = !this.isAudioEnabled;
    await this.rtcEngine.enableLocalAudio(this.isAudioEnabled);
    return this.isAudioEnabled;
  }

  async switchCamera(): Promise<void> {
    if (!this.rtcEngine) return;
    await this.rtcEngine.switchCamera();
  }

  getStats() {
    return {
      isVideoEnabled: this.isVideoEnabled,
      isAudioEnabled: this.isAudioEnabled,
      networkQuality: this.networkQuality,
      remoteUsersCount: this.remoteUsers.size,
      channelId: this.currentChannelId,
    };
  }

  async leaveChannel(): Promise<void> {
    try {
      if (this.rtcEngine && this.isJoined) {
        await this.rtcEngine.leaveChannel();
        this.isJoined = false;
        this.remoteUsers.clear();
      }
    } catch (error) {
      console.error("[AgoraVideoService] Leave error:", error);
    }
  }

  destroy(): void {
    this.leaveChannel();
    if (this.rtcEngine) {
      this.rtcEngine.destroy();
      this.rtcEngine = null;
    }
    this.isInitialized = false;
    this.removeAllListeners();
  }
}

export const AgoraVideoServiceInstance = new AgoraVideoService();
