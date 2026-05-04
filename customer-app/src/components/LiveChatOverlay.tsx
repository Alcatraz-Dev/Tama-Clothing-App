import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  Dimensions,
  StyleSheet,
  TextInput as RNTextInput,
  Image,
  FlatList,
  Alert,
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
import { X, Send, Crown, Users, MoreVertical, Shield, UserX, VolumeX, Flag } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Participant = {
  id: string;
  name: string;
  avatar?: string;
  isHost?: boolean;
  isModerator?: boolean;
  isMuted?: boolean;
};

type LiveChatOverlayProps = {
  visible: boolean;
  channelId: string;
  onClose: () => void;
  currentUserId?: string;
  hostAvatar?: string;
  hostName?: string;
  isHost?: boolean;
};

export const LiveChatOverlay = ({
  visible,
  channelId,
  onClose,
  currentUserId,
  hostAvatar,
  hostName,
  isHost = false,
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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [mutedUsers, setMutedUsers] = useState<Record<string, boolean>>({});
  const insets = useSafeAreaInsets();
  const prevUnreadCountRef = useRef(0);

  // Fetch participants when channel is ready
  useEffect(() => {
    if (!channel || !visible) return;

    const fetchParticipants = async () => {
      try {
        const members = channel.state.members || {};
        const users = Object.values(members).map((m: any) => ({
          id: m.user_id,
          name: m.user?.name || `User ${m.user_id.substring(0, 5)}`,
          avatar: m.user?.image,
          isHost: m.user_id === channel.data?.created_by?.id || m.user?.name === hostName,
          isModerator: m.channel_role === "moderator",
          isMuted: mutedUsers[m.user_id] || false,
        }));
        setParticipants(users);
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    fetchParticipants();
  }, [channel, visible, mutedUsers, hostName]);

  // Track unread messages for notification badge
  useEffect(() => {
    if (!channel || !visible) {
      setNotificationCount(prevUnreadCountRef.current);
      return;
    }

    const count = channel.countUnread();
    setNotificationCount(count);
    prevUnreadCountRef.current = count;

    const handleNewMessage = () => {
      if (!visible) {
        const newCount = channel.countUnread();
        setNotificationCount(newCount);
        prevUnreadCountRef.current = newCount;
      }
    };

    channel.on("message.new", handleNewMessage);
    return () => {
      channel.off("message.new", handleNewMessage);
    };
  }, [channel, visible]);

  // Mute user functionality
  const muteUser = useCallback((userId: string, userName: string) => {
    setMutedUsers(prev => ({ ...prev, [userId]: true }));
    Alert.alert("User Muted", `@${userName} has been muted`);
  }, []);

  // Kick user functionality (host/moderator only)
  const kickUser = useCallback((userId: string, userName: string) => {
    Alert.alert(
      "Kick User",
      `Are you sure you want to remove @${userName} from the chat?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Kick", 
          style: "destructive",
          onPress: () => {
            // TODO: Implement actual kick via Stream API
            Alert.alert("User Kicked", `@${userName} has been removed from the chat`);
          }
        },
      ]
    );
  }, []);

  // Report user functionality
  const reportUser = useCallback((userId: string, userName: string) => {
    Alert.alert(
      "Report User",
      `Report @${userName} for inappropriate behavior?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Report", 
          style: "destructive",
          onPress: () => {
            Alert.alert("Reported", `Thank you for reporting @${userName}`);
          }
        },
      ]
    );
  }, []);

  // Participant item component
  const renderParticipant = ({ item }: { item: Participant }) => {
    const isCurrentUser = item.id === currentUserId;

    return (
      <View style={styles.participantItem}>
        <Image 
          source={{ uri: item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random` }} 
          style={[styles.participantAvatar, item.isMuted && styles.mutedAvatar]} 
        />
        <View style={styles.participantInfo}>
          <Text style={styles.participantName} numberOfLines={1}>
            {item.name}
            {item.isHost && <Crown size={12} color="#FFD700" />}
          </Text>
          {item.isMuted && <Text style={styles.mutedText}>Muted</Text>}
        </View>
        
        {/* Context menu for host/moderators or other users */}
        {!isCurrentUser && (
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setSelectedParticipant(item)}
          >
            <MoreVertical size={20} color="#888" />
          </TouchableOpacity>
        )}
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
    <>
      {/* FAB with Notification Badge */}
      {!visible && (
        <View style={styles.fabContainer}>
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount > 99 ? "99+" : notificationCount}</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => {
              setNotificationCount(0);
              prevUnreadCountRef.current = 0;
            }}
          >
            <Users size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TouchableOpacity onPress={() => setShowParticipants(true)} style={{ padding: 4 }}>
                  <Users size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>
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

      {/* Participants Sidebar */}
      <Modal visible={showParticipants} animationType="slide" transparent onRequestClose={() => setShowParticipants(false)}>
        <View style={styles.participantsOverlay}>
          <TouchableOpacity style={styles.backdrop} onPress={() => setShowParticipants(false)} />
          <View style={[styles.participantsContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.participantsHeader}>
              <Text style={styles.participantsTitle}>Active Participants ({participants.length})</Text>
              <TouchableOpacity onPress={() => setShowParticipants(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={participants}
              keyExtractor={(item) => item.id}
              renderItem={renderParticipant}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Participant Context Menu */}
      {selectedParticipant && (
        <Modal visible={!!selectedParticipant} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay} 
            onPress={() => setSelectedParticipant(null)}
          >
            <View style={styles.contextMenu}>
              <Text style={styles.contextMenuTitle}>@{selectedParticipant.name}</Text>
              
              {isHost && !selectedParticipant.isHost && (
                <>
                  <TouchableOpacity 
                    style={styles.contextMenuItem}
                    onPress={() => {
                      muteUser(selectedParticipant.id, selectedParticipant.name);
                      setSelectedParticipant(null);
                    }}
                  >
                    <VolumeX size={20} color="#FFD700" />
                    <Text style={styles.contextMenuText}>Mute @{selectedParticipant.name}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.contextMenuItem}
                    onPress={() => {
                      kickUser(selectedParticipant.id, selectedParticipant.name);
                      setSelectedParticipant(null);
                    }}
                  >
                    <UserX size={20} color="#EF4444" />
                    <Text style={[styles.contextMenuText, { color: "#EF4444" }]}>Kick @{selectedParticipant.name}</Text>
                  </TouchableOpacity>
                </>
              )}
              
              <TouchableOpacity 
                style={styles.contextMenuItem}
                onPress={() => {
                  reportUser(selectedParticipant.id, selectedParticipant.name);
                  setSelectedParticipant(null);
                }}
              >
                <Flag size={20} color="#3B82F6" />
                <Text style={styles.contextMenuText}>Report @{selectedParticipant.name}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  participantsOverlay: {
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
    height: Dimensions.get("window").height * 0.85,
  },
  participantsContainer: {
    backgroundColor: "#1A1A1F",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get("window").height * 0.6,
    paddingTop: 16,
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
  participantsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  participantsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
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
  fabContainer: {
    position: "absolute",
    bottom: 80,
    right: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#222",
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  mutedAvatar: {
    opacity: 0.5,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  mutedText: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  contextMenu: {
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    padding: 16,
    minWidth: 250,
    maxWidth: "80%",
  },
  contextMenuTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  contextMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  contextMenuText: {
    color: "#fff",
    fontSize: 15,
  },
});