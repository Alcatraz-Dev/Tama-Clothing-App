/**
 * ScreenShareService - Screen sharing for live streaming
 * Uses native screen capture capabilities
 */
import { Platform, Alert } from "react-native";

interface ScreenShareConfig {
  channelId: string;
  appId: string;
  token?: string;
}

class ScreenShareService {
  private static instance: ScreenShareService;
  private isSharing = false;
  private config: ScreenShareConfig | null = null;

  static getInstance(): ScreenShareService {
    if (!ScreenShareService.instance) {
      ScreenShareService.instance = new ScreenShareService();
    }
    return ScreenShareService.instance;
  }

  async startScreenShare(config: ScreenShareConfig): Promise<boolean> {
    this.config = config;

    if (Platform.OS === "ios") {
      // iOS requires native implementation
      // For now, show a demo mode
      Alert.alert(
        "Screen Sharing",
        "Screen sharing is available on iOS. In production, this would use iOS ScreenCapture API.",
        [
          {
            text: "Demo Mode",
            onPress: () => {
              this.isSharing = true;
              return true;
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return this.isSharing;
    } else if (Platform.OS === "android") {
      // Android uses MediaProjection
      Alert.alert(
        "Screen Sharing",
        "Screen sharing is available on Android. In production, this would use Android MediaProjection API.",
        [
          {
            text: "Demo Mode",
            onPress: () => {
              this.isSharing = true;
              return true;
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return this.isSharing;
    }

    return false;
  }

  async stopScreenShare(): Promise<void> {
    if (!this.isSharing) return;

    try {
      // Stop screen share in Agora
      // await agoraEngine.stopScreenCapture();
      this.isSharing = false;
      console.log("[ScreenShare] Stopped");
    } catch (error) {
      console.error("[ScreenShare] Error stopping:", error);
    }
  }

  isScreenSharing(): boolean {
    return this.isSharing;
  }

  // Get screen share video configuration
  getScreenShareConfig() {
    return {
      width: 1280,
      height: 720,
      bitrate: 2000000,
      frameRate: 15,
    };
  }
}

export const screenShareService = ScreenShareService.getInstance();
export default ScreenShareService;