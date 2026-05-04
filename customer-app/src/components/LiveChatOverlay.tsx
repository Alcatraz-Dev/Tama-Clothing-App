import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  Dimensions,
  StyleSheet,
  TextInput as RNTextInput,
  Image,
} from "react-native";
import {
  Channel,
  MessageList,
  MessageInput,
  useChatContext,
  Message,
  MessageStatus,
} from "stream-chat-react-native";
import { BlurView } from "expo-blur";
import { X, Send, Crown } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LiveChatOverlayProps = {
  visible: boolean;
  channelId: string;
  onClose: () => void;
  currentUserId?: string;
  hostAvatar?: string;
  hostName?: string;
};

export const LiveChatOverlay = ({
  visible,
  channelId,
  onClose,
  currentUserId,
  hostAvatar,
  hostName,
}: LiveChatOverlayProps) => {
  // Try to use chat context, but handle if not available
  let client = null;
  try {
    const context = useChatContext();
    client = context.client;
  } catch (e) {
    // Chat context not available - chat is disabled
    console.log("Chat context not available");
  }
  
  const [channel, setChannel] = useState<any>(null);
  const insets = useSafeAreaInsets();

  // Custom message component with avatar (TikTok style)
  const renderMessage = (message: any) => {
    const isHost = message.user?.id === channel?.data?.created_by?.id || 
                   message.user?.name === hostName;
    const avatarUri = message.user?.image || 
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(message.user?.name || "User")}&background=random`;
    
    return (
      <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 4 }}>
        <Image 
          source={{ uri: avatarUri }} 
          style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} 
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {isHost && <Crown size={12} color="#FFD700" style={{ marginRight: 4 }} />}
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>
              {message.user?.name || "User"}
            </Text>
          </View>
          <Text style={{ color: "#ddd", fontSize: 14, marginTop: 2 }}>
            {message.text}
          </Text>
        </View>
      </View>
    );
  };

  // Show message when chat is not available
  if (!client) {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={onClose} />
          <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
             <View style={styles.header}>
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {hostAvatar && (
                  <Image source={{ uri: hostAvatar }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} />
                )}
                <Text style={styles.title}>{hostName || "Live Chat"}</Text>
                {hostName && <Crown size={14} color="#FFD700" style={{ marginLeft: 4 }} />}
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.noChatContainer}>
              <Text style={styles.noChatText}>Chat is currently unavailable</Text>
              <Text style={styles.noChatSubtext}>Please try again later</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  useEffect(() => {
    if (!client || !channelId || !visible) return;

    const ch = client.channel("livestream", channelId);

    // Try to watch the channel; if it doesn't exist, create it
    const setupChannel = async () => {
      try {
        await ch.watch();
        setChannel(ch);
      } catch (error: any) {
        console.log("Chat channel not found, creating...", error);
        try {
          await ch.create();
          await ch.watch();
          setChannel(ch);
        } catch (createErr) {
          console.error("Failed to create chat channel:", createErr);
        }
      }
    };

    setupChannel();

    return () => {
      // We don't stop watching on close to keep messages cached
    };
  }, [client, channelId, visible]);

  if (!client || !channel) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header with Host Info - TikTok Style */}
          <View style={styles.header}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {hostAvatar && (
                <Image 
                  source={{ uri: hostAvatar }} 
                  style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: "#fff" }} 
                />
              )}
              <Text style={styles.title}>{hostName || "Live Chat"}</Text>
              <Crown size={14} color="#FFD700" />
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <Channel channel={channel}>
            <View style={styles.messageListContainer}>
              <MessageList />
            </View>

            {/* Message Input */}
            <View style={styles.inputContainer}>
              <MessageInput />
            </View>
          </Channel>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    marginBottom: 20, // To allow the container to extend to the bottom edge
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: "#0F0F13",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get("window").height * 0.85,

  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
    position: "relative",
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    position: "relative",
    zIndex: 1,
  },
  messageListContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  inputContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
    backgroundColor: "#1A1A1F",
    paddingBottom: 20,
  },
  noChatContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noChatText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  noChatSubtext: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
