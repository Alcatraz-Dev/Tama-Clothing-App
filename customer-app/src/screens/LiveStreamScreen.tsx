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
  const { colors } = useAppTheme();
  const navigation = useNavigation();

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to init client:", err);
        setError("Failed to initialize video client");
        setIsLoading(false);
      }
    };

    initClient();
  }, []);

  const handleLeave = useCallback(() => {
    if (propIsHost) {
      // Host will handle leave in HostView
    } else {
      navigation.goBack();
    }
    if (onClose) onClose();
  }, [navigation, propIsHost, onClose]);

  if (isLoading || !client) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.foreground }]}>
          Connecting to Stream...
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

  const callId = propCallId || "live_" + Date.now();

  return (
    <StreamVideo client={client}>
      <StreamCallWrapper
        callId={callId}
        isHost={propIsHost}
        colors={colors}
        onLeave={handleLeave}
      />
    </StreamVideo>
  );
};

interface StreamCallWrapperProps {
  callId: string;
  isHost: boolean;
  colors: any;
  onLeave: () => void;
}

const StreamCallWrapper: React.FC<StreamCallWrapperProps> = ({
  callId,
  isHost,
  colors,
  onLeave,
}) => {
  const [call, setCall] = useState<Call | null>(null);
  const [isJoining, setIsJoining] = useState(true);

  useEffect(() => {
    const client = StreamVideoClient.getOrCreateInstance({ apiKey: STREAM_API_KEY });
    const newCall = client.call("livestream", callId);

    newCall.join({ create: isHost })
      .then(() => {
        setCall(newCall);
        setIsJoining(false);
      })
      .catch((err) => {
        console.error("Failed to join call:", err);
        setIsJoining(false);
      });

    return () => {
      newCall.leave().catch(console.error);
    };
  }, [callId, isHost]);

  if (isJoining) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.foreground }]}>
          Joining livestream...
        </Text>
      </SafeAreaView>
    );
  }

  if (!call) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Failed to join livestream
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onLeave}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <StreamCall call={call}>
      {isHost ? (
        <HostView call={call} colors={colors} onLeave={onLeave} />
      ) : (
        <ViewerView callId={callId} colors={colors} onLeave={onLeave} />
      )}
    </StreamCall>
  );
};

interface HostViewProps {
  call: Call;
  colors: any;
  onLeave: () => void;
}

const HostView: React.FC<HostViewProps> = ({ call, colors, onLeave }) => {
  const [isLive, setIsLive] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        const session = await call.getSession();
        setIsLive(session?.mode === "live");
      } catch (e) {}
    };

    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 5000);
    return () => clearInterval(interval);
  }, [call]);

  const handleGoLive = useCallback(async () => {
    try {
      await call.goLive();
      setIsLive(true);
      Alert.alert("Success", "You are now live!");
    } catch (err) {
      console.error("Failed to go live:", err);
    }
  }, [call]);

  const handleStopLive = useCallback(async () => {
    try {
      await call.stopLive();
      setIsLive(false);
      Alert.alert("Stopped", "Livestream ended");
    } catch (err) {
      console.error("Failed to stop live:", err);
    }
  }, [call]);

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
          <Text style={{ color: colors.foreground, marginTop: 8 }}>
            Call ID: {call.id}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        {isLive ? (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStopLive}
          >
            <Text style={styles.buttonText}>⏹ Stop Live</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.goLiveButton]}
            onPress={handleGoLive}
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
  colors: any;
  onLeave: () => void;
}

const ViewerView: React.FC<ViewerViewProps> = ({
  callId,
  colors,
  onLeave,
}) => {
  return (
    <View style={styles.viewerContainer}>
      <View style={styles.header}>
        <Text style={[styles.liveBadge, { backgroundColor: "#ff4444" }]}>
          🔴 LIVE
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