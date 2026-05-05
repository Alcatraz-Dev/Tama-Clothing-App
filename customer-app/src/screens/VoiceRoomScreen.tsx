/**
 * VoiceRoomScreen - Audio-only live room
 * Supports multiple speakers and listeners
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  X,
  Mic,
  MicOff,
  Hand,
  MessageCircle,
  Users,
  Star,
  Crown,
  Gift,
} from "lucide-react-native";
import { db } from "../api/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, limit } from "firebase/firestore";

interface VoiceRoomScreenProps {
  roomId: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  isHost?: string;
  onClose: () => void;
}

interface Speaker {
  id: string;
  name: string;
  avatar?: string;
  role: "host" | "speaker" | "listener";
  isMuted?: boolean;
  isHandRaised?: boolean;
}

export const VoiceRoomScreen: React.FC<VoiceRoomScreenProps> = ({
  roomId,
  hostId,
  hostName,
  hostAvatar,
  isHost = "false",
  onClose,
}) => {
  const [isLive, setIsLive] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [listeners, setListeners] = useState<Speaker[]>([]);
  const [currentUserId, setCurrentUserId] = useState("demo_user");
  const [isMuted, setIsMuted] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ userName: string; message: string }[]>([]);
  const [chatInput, setChatInput] = useState("");

  const isHostBoolean = isHost === "true";

  useEffect(() => {
    // Initialize speakers with host
    setSpeakers([
      {
        id: hostId,
        name: hostName,
        avatar: hostAvatar,
        role: "host",
        isMuted: false,
      },
    ]);

    // Simulate some listeners
    setListeners([
      { id: "1", name: "User 1", role: "listener" },
      { id: "2", name: "User 2", role: "listener" },
      { id: "3", name: "User 3", role: "listener" },
    ]);

    // Subscribe to chat
    const chatRef = collection(db, "voiceChats", roomId, "messages");
    const q = query(chatRef, orderBy("createdAt", "desc"), limit(30));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => doc.data()) as any[];
      setChatMessages(messages.reverse().map(m => ({ userName: m.userName, message: m.message })));
    });

    return () => unsubscribe();
  }, [roomId]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const raiseHand = () => {
    setIsHandRaised(!isHandRaised);
  };

  const becomeSpeaker = () => {
    // In real implementation, this would request host approval
    const newSpeaker: Speaker = {
      id: currentUserId,
      name: "You",
      role: "speaker",
      isMuted: true,
    };
    setSpeakers(prev => [...prev.filter(s => s.id !== currentUserId), newSpeaker]);
    setListeners(prev => prev.filter(l => l.id !== currentUserId));
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    try {
      await addDoc(collection(db, "voiceChats", roomId, "messages"), {
        userId: currentUserId,
        userName: isHostBoolean ? hostName : "Listener",
        message: chatInput,
        createdAt: serverTimestamp(),
      });
      setChatInput("");
    } catch (e) {
      console.log("[VoiceRoom] Send message error:", e);
    }
  };

  const startRoom = () => {
    setIsLive(true);
  };

  return (
    <View style={styles.container}>
      {/* Room Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.roomTitle}>Voice Room</Text>
          <View style={styles.listenerCount}>
            <Users size={14} color="#888" />
            <Text style={styles.listenerCountText}>{listeners.length + speakers.length}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Speakers Section */}
      <View style={styles.speakersSection}>
        <Text style={styles.sectionTitle}>
          <Crown size={16} color="#FFD700" /> Speakers
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.speakersContainer}>
          {speakers.map(speaker => (
            <View key={speaker.id} style={styles.speakerCard}>
              <View style={[styles.avatarContainer, speaker.isMuted && styles.avatarMuted]}>
                <Image
                  source={{ uri: speaker.avatar || `https://ui-avatars.com/api/?name=${speaker.name}&background=random` }}
                  style={styles.avatar}
                />
                {speaker.role === "host" && (
                  <View style={styles.hostBadge}>
                    <Crown size={10} color="#FFD700" />
                  </View>
                )}
                {speaker.isMuted && (
                  <View style={styles.mutedBadge}>
                    <MicOff size={10} color="#fff" />
                  </View>
                )}
              </View>
              <Text style={styles.speakerName} numberOfLines={1}>{speaker.name}</Text>
              {speaker.isHandRaised && (
                <View style={styles.handRaisedBadge}>
                  <Hand size={10} color="#FFD700" />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Listeners Section */}
      <View style={styles.listenersSection}>
        <Text style={styles.sectionTitle}>Listeners</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listenersContainer}>
          {listeners.map(listener => (
            <View key={listener.id} style={styles.listenerCard}>
              <Image
                source={{ uri: listener.avatar || `https://ui-avatars.com/api/?name=${listener.name}&background=random` }}
                style={styles.listenerAvatar}
              />
              <Text style={styles.listenerName} numberOfLines={1}>{listener.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          {isMuted ? <MicOff size={24} color="#fff" /> : <Mic size={24} color="#fff" />}
          <Text style={styles.controlText}>{isMuted ? "Unmute" : "Mute"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isHandRaised && styles.handRaisedButton]}
          onPress={raiseHand}
        >
          <Hand size={24} color={isHandRaised ? "#FFD700" : "#fff"} />
          <Text style={[styles.controlText, isHandRaised && styles.handRaisedText]}>
            {isHandRaised ? "Hand Up" : "Raise Hand"}
          </Text>
        </TouchableOpacity>

        {!isHostBoolean && speakers.length < 6 && (
          <TouchableOpacity style={styles.speakButton} onPress={becomeSpeaker}>
            <Mic size={20} color="#000" />
            <Text style={styles.speakButtonText}>Speak</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, showChat && styles.controlButtonActive]}
          onPress={() => setShowChat(!showChat)}
        >
          <MessageCircle size={24} color="#fff" />
          <Text style={styles.controlText}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Panel */}
      {showChat && (
        <View style={styles.chatPanel}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Room Chat</Text>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.chatMessages}>
            {chatMessages.map((msg, i) => (
              <Text key={i} style={styles.chatMessage}>
                <Text style={styles.chatUserName}>{msg.userName}: </Text>
                {msg.message}
              </Text>
            ))}
          </View>
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Say something..."
              placeholderTextColor="#666"
            />
            <TouchableOpacity onPress={sendMessage}>
              <Text style={styles.sendButton}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  roomTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  listenerCount: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listenerCountText: {
    color: "#888",
    fontSize: 12,
    marginLeft: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  speakersSection: {
    paddingVertical: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  speakersContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  speakerCard: {
    alignItems: "center",
    width: 70,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#FF0066",
  },
  avatarMuted: {
    borderColor: "#666",
  },
  hostBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#000",
    borderRadius: 10,
    padding: 2,
  },
  mutedBadge: {
    position: "absolute",
    bottom: -4,
    left: -4,
    backgroundColor: "#FF0000",
    borderRadius: 10,
    padding: 4,
  },
  speakerName: {
    color: "#fff",
    fontSize: 12,
    marginTop: 8,
    maxWidth: 70,
    textAlign: "center",
  },
  handRaisedBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FFD700",
    borderRadius: 10,
    padding: 4,
  },
  listenersSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  listenersContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  listenerCard: {
    alignItems: "center",
    width: 50,
  },
  listenerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  listenerName: {
    color: "#666",
    fontSize: 10,
    marginTop: 4,
    maxWidth: 50,
  },
  controls: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  controlButton: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    minWidth: 70,
  },
  controlButtonActive: {
    backgroundColor: "#FF0066",
  },
  controlText: {
    color: "#fff",
    fontSize: 10,
    marginTop: 4,
  },
  handRaisedButton: {
    backgroundColor: "#FFD700",
  },
  handRaisedText: {
    color: "#000",
  },
  speakButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
  },
  speakButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  chatPanel: {
    position: "absolute",
    right: 0,
    top: 100,
    bottom: 100,
    width: 280,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    borderRadius: 12,
    padding: 12,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chatTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  chatMessages: {
    flex: 1,
  },
  chatMessage: {
    color: "#fff",
    fontSize: 12,
    marginBottom: 8,
  },
  chatUserName: {
    color: "#FF0066",
    fontWeight: "600",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 8,
  },
  chatInput: {
    flex: 1,
    color: "#fff",
    fontSize: 12,
    marginRight: 8,
  },
  sendButton: {
    color: "#FF0066",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default VoiceRoomScreen;