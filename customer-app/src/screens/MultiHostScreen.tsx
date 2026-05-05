/**
 * MultiHostScreen - Grid layout with multiple streamers
 * Supports co-hosting, stage invitations, and grid views
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  X,
  Grid,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  Crown,
  Plus,
  MessageCircle,
  Heart,
  Gift,
  Share2,
  Maximize,
} from "lucide-react-native";
import { db } from "../api/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot } from "firebase/firestore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MultiHostScreenProps {
  channelId: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  isHost?: boolean;
  userId: string;
  userName: string;
  onClose: () => void;
}

interface Host {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  isMuted: boolean;
  hasVideo: boolean;
  isSpeaking: boolean;
  isHandRaised: boolean;
}

interface AudienceMember {
  id: string;
  name: string;
  avatar?: string;
  isInvited: boolean;
}

export const MultiHostScreen: React.FC<MultiHostScreenProps> = ({
  channelId,
  hostId,
  hostName,
  hostAvatar,
  isHost = false,
  userId,
  userName,
  onClose,
}) => {
  // State
  const [gridSize, setGridSize] = useState<2 | 4 | 6 | 9>(4);
  const [hosts, setHosts] = useState<Host[]>([
    {
      id: hostId,
      name: hostName,
      avatar: hostAvatar,
      isHost: true,
      isMuted: false,
      hasVideo: true,
      isSpeaking: true,
      isHandRaised: false,
    },
    {
      id: "co1",
      name: "Co-Host 1",
      avatar: "https://ui-avatars.com/api/?name=CoHost1&background=FF0066&color=fff",
      isHost: false,
      isMuted: false,
      hasVideo: true,
      isSpeaking: false,
      isHandRaised: false,
    },
    {
      id: "co2",
      name: "Co-Host 2",
      avatar: "https://ui-avatars.com/api/?name=CoHost2&background=00D4FF&color=fff",
      isHost: false,
      isMuted: true,
      hasVideo: true,
      isSpeaking: false,
      isHandRaised: false,
    },
    {
      id: "co3",
      name: "Co-Host 3",
      avatar: "https://ui-avatars.com/api/?name=CoHost3&background=FFD700&color=000",
      isHost: false,
      isMuted: false,
      hasVideo: false,
      isSpeaking: false,
      isHandRaised: true,
    },
  ]);
  const [audience, setAudience] = useState<AudienceMember[]>([
    { id: "a1", name: "Viewer1", avatar: undefined, isInvited: false },
    { id: "a2", name: "Viewer2", avatar: undefined, isInvited: false },
    { id: "a3", name: "Viewer3", avatar: undefined, isInvited: false },
    { id: "a4", name: "Viewer4", avatar: undefined, isInvited: false },
    { id: "a5", name: "Viewer5", avatar: undefined, isInvited: false },
  ]);
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [showAudienceList, setShowAudienceList] = useState(false);
  const [totalViewers, setTotalViewers] = useState(1234);
  const [likes, setLikes] = useState(5678);

  const hostPositions = gridSize <= 4 ? gridSize : gridSize === 9 ? 9 : 6;
  const emptySlots = hostPositions - hosts.length;

  // Invite audience member to stage
  const inviteToStage = async (member: AudienceMember) => {
    // In real app, send invitation via RTM/Firestore
    Alert.alert(
      "Invite to Stage",
      `Invite ${member.name} to become a co-host?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Invite",
          onPress: () => {
            setAudience(prev => prev.map(m => 
              m.id === member.id ? { ...m, isInvited: true } : m
            ));
          },
        },
      ]
    );
  };

  // Remove host from stage
  const removeFromStage = (hostId: string) => {
    if (hostId === hostId) {
      Alert.alert("Cannot remove", "You cannot remove the main host");
      return;
    }
    setHosts(prev => prev.filter(h => h.id !== hostId));
  };

  // Toggle mute for audience member (if invited)
  const toggleMute = (hostId: string) => {
    setHosts(prev => prev.map(h => 
      h.id === hostId ? { ...h, isMuted: !h.isMuted } : h
    ));
  };

  // Render grid item
  const renderHostGrid = () => {
    const isWide = gridSize === 2;
    const isMedium = gridSize === 4;
    const isLarge = gridSize === 6 || gridSize === 9;

    return (
      <View style={[
        styles.gridContainer,
        isWide && styles.grid2,
        isMedium && styles.grid4,
        isLarge && styles.grid6,
      ]}>
        {hosts.map((host, index) => (
          <TouchableOpacity
            key={host.id}
            style={[
              styles.hostTile,
              selectedHost === host.id && styles.hostTileSelected,
            ]}
            onPress={() => setSelectedHost(selectedHost === host.id ? null : host.id)}
            activeOpacity={0.8}
          >
            {host.hasVideo ? (
              <Image
                source={{ uri: host.avatar || `https://ui-avatars.com/api/?name=${host.name}&background=random` }}
                style={styles.hostImage}
              />
            ) : (
              <View style={styles.hostImagePlaceholder}>
                <Image
                  source={{ uri: host.avatar || `https://ui-avatars.com/api/?name=${host.name}&background=random` }}
                  style={styles.hostAvatarLarge}
                />
              </View>
            )}
            
            {/* Speaking Indicator */}
            {host.isSpeaking && (
              <View style={styles.speakingIndicator}>
                <View style={styles.speakingDot} />
              </View>
            )}

            {/* Host Info Overlay */}
            <View style={styles.hostOverlay}>
              {host.isHost && (
                <View style={styles.hostBadge}>
                  <Crown size={10} color="#FFD700" fill="#FFD700" />
                </View>
              )}
              
              <View style={styles.hostInfoBar}>
                <Text style={styles.hostTileName} numberOfLines={1}>
                  {host.name}
                </Text>
                <View style={styles.hostActions}>
                  {host.isMuted ? (
                    <MicOff size={12} color="#FF0000" />
                  ) : (
                    <Mic size={12} color="#fff" />
                  )}
                  {!host.hasVideo && <VideoOff size={12} color="#FF0000" />}
                </View>
              </View>
            </View>

            {/* Hand Raised */}
            {host.isHandRaised && (
              <View style={styles.handRaisedIndicator}>
                <Hand size={14} color="#FFD700" />
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Empty Slots */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <TouchableOpacity 
            key={`empty-${i}`}
            style={styles.emptySlot}
            onPress={() => setShowAudienceList(true)}
          >
            <Plus size={30} color="#444" />
            <Text style={styles.emptySlotText}>Invite</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onClose}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Multi-Host Live</Text>
            <View style={styles.viewerCount}>
              <Users size={14} color="#888" />
              <Text style={styles.viewerCountText}>{totalViewers}</Text>
            </View>
          </View>
        </View>

        {/* Grid Size Selector */}
        <View style={styles.gridSelector}>
          <TouchableOpacity
            style={[styles.gridButton, gridSize === 2 && styles.gridButtonActive]}
            onPress={() => setGridSize(2)}
          >
            <Text style={styles.gridButtonText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gridButton, gridSize === 4 && styles.gridButtonActive]}
            onPress={() => setGridSize(4)}
          >
            <Text style={styles.gridButtonText}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gridButton, gridSize === 6 && styles.gridButtonActive]}
            onPress={() => setGridSize(6)}
          >
            <Text style={styles.gridButtonText}>6</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gridButton, gridSize === 9 && styles.gridButtonActive]}
            onPress={() => setGridSize(9)}
          >
            <Text style={styles.gridButtonText}>9</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Host Grid */}
      <View style={styles.gridSection}>
        {renderHostGrid()}
      </View>

      {/* Selected Host Controls */}
      {selectedHost && (
        <View style={styles.selectedHostControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => toggleMute(selectedHost)}
          >
            <Mic size={20} color="#fff" />
            <Text style={styles.controlButtonText}>Mute</Text>
          </TouchableOpacity>
          
          {!isHost && (
            <TouchableOpacity style={styles.controlButton}>
              <MessageCircle size={20} color="#fff" />
              <Text style={styles.controlButtonText}>DM</Text>
            </TouchableOpacity>
          )}

          {isHost && (
            <TouchableOpacity 
              style={[styles.controlButton, styles.removeButton]}
              onPress={() => removeFromStage(selectedHost)}
            >
              <X size={20} color="#fff" />
              <Text style={styles.controlButtonText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setLikes(l => l + 1)}>
          <Heart size={24} color="#FF0066" fill="#FF0066" />
          <Text style={styles.actionCount}>{likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowAudienceList(true)}
        >
          <Users size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Gift size={24} color="#FFD700" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Share2 size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Audience List Modal */}
      {showAudienceList && (
        <View style={styles.audienceModal}>
          <BlurView intensity={90} tint="dark" style={styles.audienceModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite to Stage</Text>
              <TouchableOpacity onPress={() => setShowAudienceList(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.audienceList}>
              {audience.map(member => (
                <View key={member.id} style={styles.audienceItem}>
                  <Image
                    source={{ uri: member.avatar || `https://ui-avatars.com/api/?name=${member.name}&background=random` }}
                    style={styles.audienceAvatar}
                  />
                  <Text style={styles.audienceName}>{member.name}</Text>
                  {member.isInvited ? (
                    <Text style={styles.invitedText}>Invited</Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.inviteButton}
                      onPress={() => inviteToStage(member)}
                    >
                      <Plus size={16} color="#fff" />
                      <Text style={styles.inviteButtonText}>Invite</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          </BlurView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    marginLeft: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  viewerCount: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  viewerCountText: {
    color: "#888",
    fontSize: 12,
    marginLeft: 4,
  },
  gridSelector: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 4,
  },
  gridButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  gridButtonActive: {
    backgroundColor: "#FF0066",
  },
  gridButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  gridSection: {
    flex: 1,
    padding: 8,
  },
  gridContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  grid2: {
    gap: 16,
  },
  grid4: {
    gap: 8,
  },
  grid6: {
    gap: 4,
  },
  hostTile: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  hostTileSelected: {
    borderWidth: 3,
    borderColor: "#FF0066",
  },
  hostImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  hostImagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  hostAvatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  speakingIndicator: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2ECC71",
    justifyContent: "center",
    alignItems: "center",
  },
  speakingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  hostOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  hostBadge: {
    position: "absolute",
    top: -20,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  hostInfoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hostTileName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  hostActions: {
    flexDirection: "row",
    gap: 6,
  },
  handRaisedIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 215, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptySlot: {
    aspectRatio: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  emptySlotText: {
    color: "#444",
    fontSize: 12,
    marginTop: 4,
  },
  selectedHostControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  removeButton: {
    backgroundColor: "#FF0000",
  },
  controlButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  actionButton: {
    alignItems: "center",
    padding: 8,
  },
  actionCount: {
    color: "#fff",
    fontSize: 10,
    marginTop: 2,
  },
  audienceModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  audienceModalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  audienceList: {
    flex: 1,
  },
  audienceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  audienceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  audienceName: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
    marginLeft: 12,
  },
  invitedText: {
    color: "#2ECC71",
    fontSize: 12,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF0066",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  inviteButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default MultiHostScreen;