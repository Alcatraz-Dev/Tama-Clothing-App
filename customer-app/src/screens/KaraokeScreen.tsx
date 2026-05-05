/**
 * KaraokeScreen - High-quality audio with lyrics timing
 * Background music sync, dual video, and live duet
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
  Dimensions,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Mic,
  MicOff,
  Music,
  Disc,
  Heart,
  MessageCircle,
  Gift,
  Users,
  Camera,
  Monitor,
} from "lucide-react-native";
import * as Animatable from "react-native-animatable";
import { db } from "../api/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, increment } from "firebase/firestore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface KaraokeScreenProps {
  channelId: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  isHost?: boolean;
  userId: string;
  userName: string;
  onClose: () => void;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number; // seconds
  lyrics: { time: number; text: string }[];
}

interface Viewer {
  id: string;
  name: string;
  isSinging: boolean;
  avatar?: string;
}

// Demo songs
const DEMO_SONGS: Song[] = [
  {
    id: "1",
    title: "Bentley",
    artist: "Stormy",
    coverUrl: "https://picsum.photos/200/200?random=10",
    duration: 210,
    lyrics: [
      { time: 0, text: "🎵 Intro 🎵" },
      { time: 5, text: "Bentley continental" },
      { time: 10, text: "She want the money money" },
      { time: 15, text: "She want the fame fame" },
      { time: 20, text: "I'm in my Bentley" },
      { time: 25, text: "Racing through the night" },
      { time: 30, text: "Got my girl beside me" },
      { time: 35, text: "Everything feels right" },
      { time: 40, text: "🎵 Chorus 🎵" },
      { time: 45, text: "We going V12" },
      { time: 50, text: "No limits tonight" },
      { time: 55, text: "Running lights" },
      { time: 60, text: "Feel the speed" },
    ],
  },
  {
    id: "2",
    title: "Ya Rayah",
    artist: "Dahmane El Harrachi",
    coverUrl: "https://picsum.photos/200/200?random=11",
    duration: 300,
    lyrics: [
      { time: 0, text: "🎵 instrumentation 🎵" },
      { time: 10, text: "Ya rayah, ya rayah" },
      { time: 20, text: "Khlas mouch kil ou had driss" },
      { time: 30, text: "Maandamesh menlek ou3loud" },
      { time: 40, text: "Ouled sidi embarek" },
      { time: 50, text: "Maandesh menlek wahd quest" },
    ],
  },
];

export const KaraokeScreen: React.FC<KaraokeScreenProps> = ({
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
  const [currentSong, setCurrentSong] = useState<Song>(DEMO_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [isMuted, setIsMuted] = useState(false);
  const [isHostMicOn, setIsHostMicOn] = useState(true);
  const [duetPartner, setDuetPartner] = useState<Viewer | null>(null);
  const [viewers, setViewers] = useState<Viewer[]>([
    { id: "1", name: "Viewer1", isSinging: false },
    { id: "2", name: "Viewer2", isSinging: false },
    { id: "3", name: "Viewer3", isSinging: false },
  ]);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ userName: string; message: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(1234);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Start/pause playback
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          if (newTime >= currentSong.duration) {
            setIsPlaying(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentSong]);

  // Update current lyric based on time
  useEffect(() => {
    const index = currentSong.lyrics.findIndex(
      (lyric, i) => {
        const nextLyric = currentSong.lyrics[i + 1];
        return currentTime >= lyric.time && (!nextLyric || currentTime < nextLyric.time);
      }
    );
    setCurrentLyricIndex(index);
  }, [currentTime, currentSong]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleHostMic = () => {
    setIsHostMicOn(!isHostMicOn);
  };

  const selectSong = (song: Song) => {
    setCurrentSong(song);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const requestDuet = () => {
    if (duetPartner) {
      setDuetPartner(null);
    } else {
      // In real app, this would request host approval
      Alert.alert("Request Sent", "Waiting for host approval...");
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { userName, message: chatInput }]);
    setChatInput("");
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = (currentTime / currentSong.duration) * 100;

  return (
    <View style={styles.container}>
      {/* Background Video Area */}
      <View style={styles.videoContainer}>
        {/* Background Image (Album Art) */}
        <Image
          source={{ uri: currentSong.coverUrl }}
          style={styles.backgroundImage}
          blurRadius={50}
        />
        
        {/* Main Cover Art */}
        <View style={styles.albumContainer}>
          <Animatable.View
            animation={isPlaying ? "rotate" : undefined}
            duration={3000}
            iterationCount="infinite"
            easing="linear"
            style={styles.albumArtWrapper}
          >
            <Image
              source={{ uri: currentSong.coverUrl }}
              style={styles.albumArt}
            />
          </Animatable.View>
          
          {/* Duet Partner Display */}
          {duetPartner && (
            <View style={styles.duetPartner}>
              <Image
                source={{ uri: duetPartner.avatar || `https://ui-avatars.com/api/?name=${duetPartner.name}&background=random` }}
                style={styles.duetAvatar}
              />
              <Text style={styles.duetName}>{duetPartner.name}</Text>
            </View>
          )}
        </View>

        {/* Song Info Overlay */}
        <View style={styles.songOverlay}>
          <View style={styles.songInfo}>
            <Text style={styles.songTitle}>{currentSong.title}</Text>
            <Text style={styles.songArtist}>{currentSong.artist}</Text>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.timeText}>{formatTime(currentSong.duration)}</Text>
          </View>

          {/* Playback Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton}>
              <SkipBack size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.playButton}
              onPress={togglePlay}
            >
              {isPlaying ? (
                <Pause size={32} color="#000" fill="#000" />
              ) : (
                <Play size={32} color="#000" fill="#000" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton}>
              <SkipForward size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Host Info Top */}
        <View style={styles.hostInfo}>
          <Image
            source={{ uri: hostAvatar || `https://ui-avatars.com/api/?name=${hostName}&background=random` }}
            style={styles.hostAvatar}
          />
          <View style={styles.hostDetails}>
            <Text style={styles.hostName}>{hostName}</Text>
            <Text style={styles.hostRole}>Singing Live</Text>
          </View>
          <TouchableOpacity 
            style={[styles.micButton, !isHostMicOn && styles.micButtonOff]}
            onPress={toggleHostMic}
          >
            {isHostMicOn ? (
              <Mic size={20} color="#fff" />
            ) : (
              <MicOff size={20} color="#888" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Lyrics Section */}
      <ScrollView 
        style={styles.lyricsContainer}
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
      >
        {currentSong.lyrics.map((lyric, index) => (
          <Text
            key={index}
            style={[
              styles.lyricText,
              index === currentLyricIndex && styles.lyricTextActive,
              index < currentLyricIndex && styles.lyricTextPast,
            ]}
          >
            {lyric.text}
          </Text>
        ))}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.actionButton, liked && styles.actionButtonActive]}
          onPress={handleLike}
        >
          <Heart 
            size={24} 
            color={liked ? "#FF0066" : "#fff"} 
            fill={liked ? "#FF0066" : "none"} 
          />
          <Text style={styles.actionCount}>{likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowChat(!showChat)}
        >
          <MessageCircle size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Gift size={24} color="#FFD700" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, duetPartner && styles.actionButtonActive]}
          onPress={requestDuet}
        >
          <Music size={24} color={duetPartner ? "#2ECC71" : "#fff"} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={toggleMute}
        >
          {isMuted ? (
            <Volume2 size={24} color="#888" />
          ) : (
            <Volume2 size={24} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Song List Modal (Long Press) */}
      <View style={styles.songList}>
        <Text style={styles.songListTitle}>Select Song</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DEMO_SONGS.map(song => (
            <TouchableOpacity
              key={song.id}
              style={[
                styles.songCard,
                currentSong.id === song.id && styles.songCardActive,
              ]}
              onPress={() => selectSong(song)}
            >
              <Image source={{ uri: song.coverUrl }} style={styles.songCardImage} />
              <Text style={styles.songCardTitle} numberOfLines={1}>{song.title}</Text>
              <Text style={styles.songCardArtist}>{song.artist}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chat Panel */}
      {showChat && (
        <View style={styles.chatPanel}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Karaoke Chat</Text>
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
              placeholder="Sing along..."
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
  },
  videoContainer: {
    height: SCREEN_HEIGHT * 0.45,
    backgroundColor: "#1a1a1a",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  albumContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  albumArtWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#FF0066",
  },
  albumArt: {
    width: "100%",
    height: "100%",
  },
  duetPartner: {
    position: "absolute",
    bottom: 20,
    alignItems: "center",
  },
  duetAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#2ECC71",
  },
  duetName: {
    color: "#2ECC71",
    fontSize: 12,
    marginTop: 4,
  },
  songOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  songInfo: {
    alignItems: "center",
    marginBottom: 12,
  },
  songTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  songArtist: {
    color: "#888",
    fontSize: 14,
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeText: {
    color: "#888",
    fontSize: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FF0066",
    borderRadius: 2,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    marginTop: 12,
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF0066",
    justifyContent: "center",
    alignItems: "center",
  },
  hostInfo: {
    position: "absolute",
    top: 50,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 25,
  },
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FF0066",
  },
  hostDetails: {
    marginLeft: 10,
  },
  hostName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  hostRole: {
    color: "#FF0066",
    fontSize: 10,
  },
  micButton: {
    marginLeft: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2ECC71",
    justifyContent: "center",
    alignItems: "center",
  },
  micButtonOff: {
    backgroundColor: "#333",
  },
  lyricsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  lyricText: {
    color: "#444",
    fontSize: 18,
    textAlign: "center",
    paddingVertical: 8,
    lineHeight: 28,
  },
  lyricTextActive: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "700",
    textShadowColor: "#FF0066",
    textShadowRadius: 10,
  },
  lyricTextPast: {
    color: "#333",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  actionButton: {
    alignItems: "center",
    padding: 8,
  },
  actionButtonActive: {
    transform: [{ scale: 1.1 }],
  },
  actionCount: {
    color: "#fff",
    fontSize: 10,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  songList: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  songListTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  songCard: {
    width: 80,
    marginLeft: 16,
    alignItems: "center",
  },
  songCardActive: {
    transform: [{ scale: 1.1 }],
  },
  songCardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  songCardTitle: {
    color: "#fff",
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },
  songCardArtist: {
    color: "#666",
    fontSize: 9,
    marginTop: 2,
  },
  chatPanel: {
    position: "absolute",
    left: 0,
    bottom: 140,
    width: SCREEN_WIDTH * 0.65,
    height: 250,
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
    marginBottom: 6,
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

export default KaraokeScreen;