import React from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../context/ThemeContext";

interface StreamLivestreamTestProps {
  isHost?: boolean;
}

export const StreamLivestreamTest: React.FC<StreamLivestreamTestProps> = ({ isHost = false }) => {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();

  const handlePress = () => {
    Alert.alert(
      "Test Stream Livestream",
      `This will open the Stream-based livestream as ${isHost ? "host" : "viewer"}. Note: Requires backend token generation for full functionality.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => {
            navigation.navigate("StreamLivestream", { isHost });
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.primary }]}
      onPress={handlePress}
    >
      <Text style={styles.buttonText}>
        {isHost ? "🎬 Test Stream Host" : "📺 Test Stream Viewer"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 4,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default StreamLivestreamTest;