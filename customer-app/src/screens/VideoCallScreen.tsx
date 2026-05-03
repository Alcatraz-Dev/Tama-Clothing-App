import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import {
  StreamCall,
  Call,
  CallContent,
  useStreamVideoClient,
  useCreateCall,
} from "@stream-io/video-react-native-sdk";
import { useLayout } from "../contexts/LayoutContext";
import LayoutSwitcherButton from "../components/LayoutSwitcherButton";

interface VideoCallScreenProps {
  callId?: string;
  channelId?: string;
  memberId?: string;
}

/**
 * Example VideoCallScreen demonstrating runtime layout switching.
 *
 * This component shows how to:
 * 1. Create or join a call
 * 2. Use the LayoutProvider context to get selected layout
 * 3. Pass the layout to CallContent
 * 4. Include a layout switcher button in custom controls
 */
export const VideoCallScreen: React.FC<VideoCallScreenProps> = ({
  callId,
  channelId = "default",
  memberId,
}) => {
  const client = useStreamVideoClient();
  const [call, setCall] = useState<Call | null>(null);
  const { selectedLayout } = useLayout();

  // Create a call when component mounts
  React.useEffect(() => {
    if (!client) return;

    const createCall = async () => {
      try {
        // Create a new call or get existing one
        const newCall = client.call("default", callId || `call-${Date.now()}`);
        await newCall.getOrCreate();
        setCall(newCall);
      } catch (error) {
        console.error("Failed to create call:", error);
        Alert.alert("Error", "Failed to join call");
      }
    };

    createCall();

    return () => {
      if (call) {
        call.leave().catch(console.error);
      }
    };
  }, [client, callId]);

  // Handle joining the call
  const handleJoinCall = useCallback(async () => {
    if (!call) return;
    try {
      await call.join();
    } catch (error) {
      console.error("Failed to join call:", error);
    }
  }, [call]);

  if (!client) {
    return (
      <View style={styles.center}>
        <Text>Loading client...</Text>
      </View>
    );
  }

  if (!call) {
    return (
      <View style={styles.center}>
        <Text>Creating call...</Text>
      </View>
    );
  }

  return (
    <StreamCall call={call}>
      <View style={styles.container}>
        {/* Custom header with layout switcher */}
        <View style={styles.header}>
          <Text style={styles.title}>Video Call</Text>
          <LayoutSwitcherButton />
        </View>

        {/* CallContent with dynamic layout */}
        <CallContent
          layout={selectedLayout}
          // You can also customize other props
          // e.g., your own CallControls, ParticipantLabel, etc.
        />

        {/* Optional: Join button if not yet joined */}
        {!call.state.joined && (
          <TouchableOpacity style={styles.joinButton} onPress={handleJoinCall}>
            <Text style={styles.joinButtonText}>Join Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </StreamCall>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  joinButton: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default VideoCallScreen;
