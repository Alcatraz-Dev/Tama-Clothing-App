import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import {
  StreamVideoClient,
  StreamVideo,
  User,
  LivestreamPlayer,
  useCallStateHooks,
  Call,
  StreamCall,
} from "@stream-io/video-react-native-sdk";
import { useAppTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { STREAM_API_KEY } from "../config/stream";

interface LivestreamScreenProps {
  callId?: string;
  isHost?: boolean;
  onClose?: () => void;
}

const DEMO_USER_ID = "demo-host-user";
const DEMO_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZGVtby1ob3N0LXVzZXIiLCJzdWIiOiJ1c2VyL2RlbW8taG9zdC11c2VyIiwiYXBpS2V5IjoiNnV3cjlyMnlweHc5IiwiaWF0IjoxNzc3ODI5NDYxLCJleHAiMTc3NzgzMzA2MX0.Z8kR8JQ5LhR6sKxYwGvT9nW4P2oE3yX7dK9mV1uT8cA";

export const LivestreamScreen: React.FC<LivestreamScreenProps> = ({
  callId: propCallId,
  isHost: propIsHost = false,
}) => {
  const { colors, theme } = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { useIsCallLive, useParticipantCount, useLocalParticipant } = useCallStateHooks();
  const isLive = useIsCallLive();
  const participantCount = useParticipantCount();
  const localParticipant = useLocalParticipant();

  useEffect(() => {
    const initClient = async () => {
      try {
        const user: User = {
          id: DEMO_USER_ID,
          name: "Demo Host",
        };

        const newClient = StreamVideoClient.getOrCreateInstance({
          apiKey: STREAM_API_KEY,
          user,
          token: DEMO_TOKEN,
        });

        setClient(newClient);
      } catch (err) {
        console.error("Failed to init client:", err);
        setError("Failed to initialize video client");
        setIsLoading(false);
      }
    };

    initClient();
  }, []);

  useEffect(() => {
    if (!client || !propCallId) return;

    const joinCall = async () => {
      try {
        const newCall = client.call("livestream", propCallId);
        await newCall.join({ create: propIsHost });
        setCall(newCall);
        console.log("✅ Joined call:", propCallId);
      } catch (err) {
        console.error("Failed to join call:", err);
        setError("Failed to join livestream");
      } finally {
        setIsLoading(false);
      }
    };

    joinCall();

    return () => {
      call?.leave().catch(console.error);
    };
  }, [client, propCallId, propIsHost]);

  useEffect(() => {
    if (isLive) {
      // Audio routing handled by SDK automatically for livestreams
    }
  }, [isLive]);

  const handleGoLive = useCallback(async () => {
    if (!call) return;
    try {
      await call.goLive();
      Alert.alert("Success", "You are now live!");
    } catch (err) {
      console.error("Failed to go live:", err);
    }
  }, [call]);

  const handleStopLive = useCallback(async () => {
    if (!call) return;
    try {
      await call.stopLive();
      Alert.alert("Stopped", "Livestream ended");
    } catch (err) {
      console.error("Failed to stop live:", err);
    }
  }, [call]);

  const handleLeave = useCallback(async () => {
    if (!call) return;
    try {
      await call.leave();
    } catch (err) {
      console.error("Failed to leave:", err);
    }
    navigation.goBack();
  }, [call, navigation]);

  if (isLoading || !client) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.foreground }]}>
          Connecting to livestream...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call!}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          {propIsHost ? (
            <HostView
              call={call!}
              isLive={isLive}
              participantCount={participantCount}
              localParticipant={localParticipant}
              onGoLive={handleGoLive}
              onStopLive={handleStopLive}
              onLeave={handleLeave}
              colors={colors}
            />
          ) : (
            <ViewerView
              callId={propCallId!}
              call={call!}
              participantCount={participantCount}
              colors={colors}
              onLeave={handleLeave}
            />
          )}
        </SafeAreaView>
      </StreamCall>
    </StreamVideo>
  );
};

interface HostViewProps {
  call: Call;
  isLive: boolean;
  participantCount: number;
  localParticipant: any;
  onGoLive: () => void;
  onStopLive: () => void;
  onLeave: () => void;
  colors: any;
}

const HostView: React.FC<HostViewProps> = ({
  isLive,
  participantCount,
  onGoLive,
  onStopLive,
  onLeave,
  colors,
}) => {
  return (
    <View style={styles.hostContainer}>
      <View style={styles.header}>
        <Text style={[styles.liveBadge, { backgroundColor: isLive ? "#ff4444" : "#666" }]}>
          {isLive ? "🔴 LIVE" : "⏸ BACKSTAGE"}
        </Text>
        <Text style={[styles.participantCount, { color: colors.foreground }]}>
          👥 {participantCount} viewers
        </Text>
      </View>

      <View style={styles.videoContainer}>
        <View style={[styles.placeholderVideo, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.foreground }}>📹 Your camera preview</Text>
        </View>
      </View>

      <View style={styles.controls}>
        {isLive ? (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={onStopLive}
          >
            <Text style={styles.buttonText}>⏹ Stop Live</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.goLiveButton]}
            onPress={onGoLive}
          >
            <Text style={styles.buttonText}>🎬 Go Live</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.leaveButton]}
          onPress={onLeave}
        >
          <Text style={styles.buttonText}>🚪 Leave</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface ViewerViewProps {
  callId: string;
  call: Call;
  participantCount: number;
  colors: any;
  onLeave: () => void;
}

const ViewerView: React.FC<ViewerViewProps> = ({
  callId,
  participantCount,
  colors,
  onLeave,
}) => {
  return (
    <View style={styles.viewerContainer}>
      <View style={styles.header}>
        <Text style={[styles.liveBadge, { backgroundColor: "#ff4444" }]}>
          🔴 LIVE
        </Text>
        <Text style={[styles.participantCount, { color: colors.foreground }]}>
          👥 {participantCount} viewers
        </Text>
      </View>

      <View style={styles.videoContainer}>
        <LivestreamPlayer callType="livestream" callId={callId} />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.leaveButton]}
          onPress={onLeave}
        >
          <Text style={styles.buttonText}>🚪 Leave</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  hostContainer: {
    flex: 1,
  },
  viewerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  liveBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  participantCount: {
    fontSize: 16,
    fontWeight: "600",
  },
  videoContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  placeholderVideo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 16,
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goLiveButton: {
    backgroundColor: "#4CAF50",
  },
  stopButton: {
    backgroundColor: "#f44336",
  },
  leaveButton: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LivestreamScreen;