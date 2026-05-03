import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  Dimensions,
  StyleSheet,
  TextInput as RNTextInput,
} from "react-native";
import {
  Channel,
  MessageList,
  MessageInput,
  useChatContext,
  Channel as ChannelType,
  Message,
} from "stream-chat-react-native";
import { BlurView } from "expo-blur";
import { X, Send } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LiveChatOverlayProps = {
  visible: boolean;
  channelId: string;
  onClose: () => void;
  currentUserId?: string;
};

export const LiveChatOverlay = ({
  visible,
  channelId,
  onClose,
  currentUserId,
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
  
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const insets = useSafeAreaInsets();

  // Show message when chat is not available
  if (!client) {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={onClose} />
          <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={styles.title}>Live Chat</Text>
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

    const ch = client.channel("messaging", channelId);

    // Try to watch the channel; if it doesn't exist, create it
    const setupChannel = async () => {
      try {
        await ch.watch();
        setChannel(ch);
      } catch (error: any) {
        console.log("Chat channel not found, creating...", error);
        try {
          // Create channel with host as initial member - for now we add just system?
          // We'll add the current user later when they join as viewer
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
      // but we could stop if needed
    };
  }, [client, channelId, visible]);

  if (!client || !channel) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
          {/* Header */}
          <View style={styles.header}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={styles.title}>Live Chat</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <Channel channel={channel}>
            <MessageList
              style={styles.messageList}
              // Show avatars, etc.
              renderMessage={(props) => {
                // Custom message rendering can be done here
                return <Message {...props} />;
              }}
            />

            {/* Message Input */}
            <View style={styles.inputContainer}>
              <MessageInput
                style={styles.messageInput}
                placeholder="Type a message..."
                placeholderTextColor="#888"
                sendButton={(props: any) => (
                  <TouchableOpacity onPress={props.onSubmit} style={styles.sendButton}>
                    <Send size={20} color="#FF0066" />
                  </TouchableOpacity>
                )}
              />
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
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: "#0F0F13",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get("window").height * 0.65,
    overflow: "hidden",
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
    fontSize: 18,
    fontWeight: "bold",
    position: "relative",
    zIndex: 1,
  },
  messageList: {
    flex: 1,
    backgroundColor: "transparent",
  },
  inputContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
    backgroundColor: "#1A1A1F",
  },
  messageInput: {
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: 10,
    minHeight: 44,
  },
  sendButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
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
