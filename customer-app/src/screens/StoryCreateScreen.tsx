import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  TextInput,
  PanResponder,
  Modal,
} from "react-native";
import { Text } from "../components/ui/text";
import { Avatar } from "../components/ui/avatar";
import {
  X,
  ChevronLeft,
  Clock,
  Sparkles,
  Send,
  Zap,
  Music2,
  Type,
  Sticker,
  Plus,
  Camera,
  Image as ImageIcon,
  Video,
} from "lucide-react-native";
import { Camera as CameraUI } from "@/components/ui/camera";
import { Image as ExpoImage } from "expo-image";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MediaPicker, MediaAsset } from "@/components/ui/media-picker";
import { db } from "../api/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { uploadToSanity } from "@/utils/sanity";
import * as FileSystem from "expo-file-system/legacy";
import MusicPicker, { SelectedTrack } from "@/components/story/MusicPicker";
import StoryStickerPicker from "@/components/story/StoryStickerPicker";
import { GifPicker } from "@/components/ui/gif-picker";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type FilterType = "none" | "warm" | "cool" | "noir" | "vivid";
type DurationType = 6 | 12 | 24;

interface StoryCreateScreenProps {
  user: any;
  media?: MediaAsset;
  onClose: () => void;
  onPublish: (story: any) => void;
  t: (key: string) => string;
  theme: "light" | "dark";
}

const FILTERS: { id: FilterType; name: string; colors: [string, string] }[] = [
  { id: "none", name: "Normal", colors: ["#888", "#888"] as [string, string] },
  {
    id: "warm",
    name: "Warm",
    colors: ["#FF6B35", "#FF9F1C"] as [string, string],
  },
  {
    id: "cool",
    name: "Cool",
    colors: ["#4ECDC4", "#556270"] as [string, string],
  },
  {
    id: "noir",
    name: "Noir",
    colors: ["#2C3E50", "#000000"] as [string, string],
  },
  {
    id: "vivid",
    name: "Vivid",
    colors: ["#FF0080", "#FF8C00"] as [string, string],
  },
];

const DURATIONS: { value: DurationType; label: string }[] = [
  { value: 6, label: "6h" },
  { value: 12, label: "12h" },
  { value: 24, label: "24h" },
];

export default function StoryCreateScreen({
  user,
  media,
  onClose,
  onPublish,
  t,
  theme,
}: StoryCreateScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(
    media || null,
  );
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("none");
  const [selectedDuration, setSelectedDuration] = useState<DurationType>(24);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"camera" | "editor">("camera");
  const [isMediaModalVisible, setIsMediaModalVisible] = useState(!media);
  const [isGifPickerVisible, setIsGifPickerVisible] = useState(false);
  const [activePickerTab, setActivePickerTab] = useState<"emoji" | "sticker">("sticker");
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Editor States
  const [floatingTexts, setFloatingTexts] = useState<
    { id: string; text: string; x: number; y: number }[]
  >([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const textSubmittedRef = useRef(false);
  const [selectedMusic, setSelectedMusic] = useState<SelectedTrack | null>(
    null,
  );
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [activeStickers, setActiveStickers] = useState<
    { id: string; url: string; x: number; y: number }[]
  >([]);

  const isDark = theme === "dark";

  useEffect(() => {
    if (isMediaModalVisible && !media) {
      // Animation for picker
    }
  }, [isMediaModalVisible, media]);

  const handleMediaSelect = (assets: MediaAsset[]) => {
    if (assets.length > 0) {
      setSelectedMedia(assets[0]);
      setViewMode("editor");
      setIsMediaModalVisible(false);
    }
  };

  const handleCameraResult = (uri: string, type: "image" | "video") => {
    setSelectedMedia({
      id: Date.now().toString(),
      uri,
      type: type as any,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });
    setViewMode("editor");
    setIsMediaModalVisible(false);
  };

  const handlePublish = async () => {
    if (!selectedMedia || !user) {
      Alert.alert("Error", "Please select a media file");
      return;
    }

    setUploading(true);

    try {
      let uploadUri = selectedMedia.uri;

      // Check if file is HEIC/HEIF and convert to JPEG
      const fileExtension = uploadUri.split(".").pop()?.toLowerCase() || "";
      if (["heic", "heif"].includes(fileExtension)) {
        try {
          const cacheDir = (FileSystem as any).cacheDirectory || "";
          const jpegUri = `${cacheDir}story_${Date.now()}.jpg`;

          // Copy HEIC to JPEG (Bunny will handle it better)
          await FileSystem.copyAsync({
            from: uploadUri,
            to: jpegUri,
          });
          uploadUri = jpegUri;
        } catch (heicError) {
          console.log("HEIC conversion failed, trying original:", heicError);
        }
      }

      // Upload to Sanity
      const sanityUrl = await uploadToSanity(uploadUri);

      const now = new Date();
      const expiryDate = new Date(
        now.getTime() + selectedDuration * 60 * 60 * 1000,
      );

      const storyData = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        mediaUrl: sanityUrl,
        url: sanityUrl, // keep for backward compat
        type: selectedMedia.type === "video" ? "video" : "image",
        userId: user.uid,
        userName: user.displayName || user.fullName || user.name || "User",
        userPhoto: user.avatarUrl || user.photoURL || null,
        filter: selectedFilter,
        duration: selectedDuration,
        music: selectedMusic
          ? {
              url: selectedMusic.url,
              title: selectedMusic.title,
              artist: selectedMusic.artist,
              startTime: selectedMusic.startTime,
              duration: selectedMusic.duration,
            }
          : null,
        elements: {
          texts: floatingTexts,
          stickers: activeStickers,
        },
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + selectedDuration * 3600 * 1000,
        expiryAt: expiryDate.toISOString(),
        views: 0,
      };

      // Save to Firestore
      await setDoc(doc(db, "global_reels", storyData.id), storyData);

      onPublish(storyData);
    } catch (error: any) {
      console.error("Error publishing story:", error);
      const errorMessage =
        error?.message || "Failed to publish story. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const getFilterOverlay = () => {
    switch (selectedFilter) {
      case "warm":
        return "rgba(255, 150, 50, 0.2)";
      case "cool":
        return "rgba(50, 150, 180, 0.2)";
      case "noir":
        return "rgba(0, 0, 0, 0.4)";
      case "vivid":
        return "rgba(255, 0, 128, 0.15)";
      default:
        return "transparent";
    }
  };

  const renderMediaPicker = () => {
    return (
      <Modal
        visible={isMediaModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsMediaModalVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          activeOpacity={1}
          onPress={() => setIsMediaModalVisible(false)}
        />
        <View
          style={{
            backgroundColor: isDark ? "#121212" : "#FFF",
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            padding: 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          <View
            style={{
              height: 5,
              width: 40,
              backgroundColor: isDark ? "#333" : "#DDD",
              borderRadius: 3,
              alignSelf: "center",
              marginBottom: 20,
            }}
          />

          <Text
            style={{
              color: isDark ? "#FFF" : "#000",
              fontSize: 20,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 5,
            }}
          >
            {t("Create Story") || "Create Story"}
          </Text>
          <Text
            style={{
              color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
              fontSize: 14,
              textAlign: "center",
              marginBottom: 25,
            }}
          >
            {t("Share a moment with your followers") || "Share a moment with your followers"}
          </Text>
          
          <View style={{ gap: 12 }}>
            {/* Camera Option */}
            <TouchableOpacity
              onPress={() => {
                setIsMediaModalVisible(false);
                setViewMode("camera");
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
                padding: 16,
                borderRadius: 16,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#3B82F6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 15,
                }}
              >
                <Camera size={22} color="#FFF" />
              </View>
              <View>
                <Text style={{ color: isDark ? "#FFF" : "#000", fontSize: 16, fontWeight: "600" }}>
                  {t("Camera") || "Camera"}
                </Text>
                <Text style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: 13, marginTop: 1 }}>
                  {t("Take a photo or video") || "Take a photo or video"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Photo Gallery Option */}
            <MediaPicker
              gallery={true}
              mediaType="image"
              onSelectionChange={(assets) => {
                if (assets && assets.length > 0) {
                  setIsMediaModalVisible(false);
                  handleMediaSelect(assets);
                }
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
                  padding: 16,
                  borderRadius: 16,
                  width: '100%',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#A855F7",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 15,
                  }}
                >
                  <ImageIcon size={22} color="#FFF" />
                </View>
                <View>
                  <Text style={{ color: isDark ? "#FFF" : "#000", fontSize: 16, fontWeight: "600" }}>
                    {t("Photos") || "Photos"}
                  </Text>
                  <Text style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: 13, marginTop: 1 }}>
                    {t("Choose from Gallery") || "Choose from Gallery"}
                  </Text>
                </View>
              </View>
            </MediaPicker>

            {/* Video Gallery Option */}
            <MediaPicker
              gallery={true}
              mediaType="video"
              onSelectionChange={(assets) => {
                if (assets && assets.length > 0) {
                  setIsMediaModalVisible(false);
                  handleMediaSelect(assets);
                }
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
                  padding: 16,
                  borderRadius: 16,
                  width: '100%',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#EF4444",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 15,
                  }}
                >
                  <Video size={22} color="#FFF" />
                </View>
                <View>
                  <Text style={{ color: isDark ? "#FFF" : "#000", fontSize: 16, fontWeight: "600" }}>
                    {t("Videos") || "Videos"}
                  </Text>
                  <Text style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: 13, marginTop: 1 }}>
                    {t("Choose from Gallery") || "Choose from Gallery"}
                  </Text>
                </View>
              </View>
            </MediaPicker>

            {/* GIF Option */}
            <TouchableOpacity
              onPress={() => {
                setIsMediaModalVisible(false);
                setIsGifPickerVisible(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
                padding: 16,
                borderRadius: 16,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#10B981",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 15,
                }}
              >
                <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 12 }}>GIF</Text>
              </View>
              <View>
                <Text style={{ color: isDark ? "#FFF" : "#000", fontSize: 16, fontWeight: "600" }}>GIF</Text>
                <Text style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: 13, marginTop: 1 }}>
                  {t("Search and share GIFs") || "Search and share GIFs"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Sticker Option */}
            <TouchableOpacity
              onPress={() => {
                setIsMediaModalVisible(false);
                setIsEmojiPickerVisible(true);
                setActivePickerTab("sticker");
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
                padding: 16,
                borderRadius: 16,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#F59E0B",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 15,
                }}
              >
                <Sticker size={22} color="#FFF" />
              </View>
              <View>
                <Text style={{ color: isDark ? "#FFF" : "#000", fontSize: 16, fontWeight: "600" }}>
                  {t("Stickers") || "Stickers"}
                </Text>
                <Text style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: 13, marginTop: 1 }}>
                  {t("Add stickers to your story") || "Add stickers to your story"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderFilters = () => (
    <View style={styles.toolSection}>
      <Text style={styles.toolTitle}>{t("Filter") || "Filter"}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersRow}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            onPress={() => setSelectedFilter(filter.id)}
            style={styles.filterItem}
          >
            <View
              style={[
                styles.filterCircle,
                selectedFilter === filter.id && styles.filterCircleSelected,
              ]}
            >
              <LinearGradient
                colors={filter.colors}
                style={styles.filterPreview}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </View>
            <Text
              style={[
                styles.filterName,
                selectedFilter === filter.id && styles.filterNameSelected,
              ]}
            >
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderDuration = () => (
    <View style={[styles.toolSection, { marginTop: 20 }]}>
      <Text style={styles.toolTitle}>{t("Duration") || "Duration"}</Text>
      <View style={styles.durationRow}>
        {DURATIONS.map((duration) => (
          <TouchableOpacity
            key={duration.value}
            onPress={() => setSelectedDuration(duration.value)}
            style={[
              styles.durationPill,
              selectedDuration === duration.value &&
                styles.durationPillSelected,
            ]}
          >
            <Clock
              size={14}
              color={
                selectedDuration === duration.value
                  ? "#FFF"
                  : "rgba(255,255,255,0.6)"
              }
            />
            <Text
              style={[
                styles.durationLabel,
                {
                  color:
                    selectedDuration === duration.value
                      ? "#FFF"
                      : "rgba(255,255,255,0.6)",
                },
              ]}
            >
              {duration.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleToolPress = (toolId: string) => {
    if (toolId === "text") {
      setIsTyping(true);
    } else if (toolId === "music") {
      setShowMusicPicker(true);
    } else if (toolId === "sticker") {
      setIsEmojiPickerVisible(true);
    } else if (toolId === "filter") {
      const currentIndex = FILTERS.findIndex((f) => f.id === selectedFilter);
      const nextIndex = (currentIndex + 1) % FILTERS.length;
      setSelectedFilter(FILTERS[nextIndex].id);
    }
  };

  const renderPreview = () => {
    if (!selectedMedia) return null;

    return (
      <View style={styles.fullPreviewContainer}>
        {selectedMedia.type === "video" ? (
          <View style={StyleSheet.absoluteFill}>
            {/* In a real app, use expo-video or similar for preview */}
            <ExpoImage
              source={{ uri: selectedMedia.uri }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
            <View
              style={[
                styles.filterOverlay,
                { backgroundColor: getFilterOverlay() },
              ]}
            />
          </View>
        ) : (
          <View style={StyleSheet.absoluteFill}>
            <ExpoImage
              source={{ uri: selectedMedia.uri }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={300}
            />
            <View
              style={[
                styles.filterOverlay,
                { backgroundColor: getFilterOverlay() },
              ]}
            />
          </View>
        )}

        {/* Editor Controls Overlay */}
        <View style={[styles.editorControls, { top: insets.top + 10 }]}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <X color="#FFF" size={24} />
          </TouchableOpacity>

          <View style={styles.rightControls}>
            {[
              { Icon: Type, id: "text" },
              { Icon: Music2, id: "music" },
              { Icon: Sticker, id: "sticker" },
              { Icon: Sparkles, id: "filter" },
            ].map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.iconButton}
                onPress={() => handleToolPress(item.id)}
              >
                <item.Icon
                  color={
                    item.id === "music" && selectedMusic ? "#FFD700" : "#FFF"
                  }
                  size={22}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected music badge */}
        {selectedMusic && (
          <View style={styles.musicOverlay}>
            <Music2 size={14} color="#FFF" />
            <Text style={styles.musicOverlayText} numberOfLines={1}>
              {selectedMusic.title}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedMusic(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={12} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        )}

        {floatingTexts.map((txt) => (
          <DraggableElement
            key={txt.id}
            initialX={txt.x}
            initialY={txt.y}
            onPositionChange={(nx, ny) => {
              setFloatingTexts((prev) =>
                prev.map((t) => (t.id === txt.id ? { ...t, x: nx, y: ny } : t)),
              );
            }}
          >
            <View style={styles.floatingTextContainer}>
              <Text style={styles.floatingText}>{txt.text}</Text>
            </View>
          </DraggableElement>
        ))}

        {activeStickers.map((sticker) => (
          <DraggableElement
            key={sticker.id}
            initialX={sticker.x}
            initialY={sticker.y}
            onPositionChange={(nx, ny) => {
              setActiveStickers((prev) =>
                prev.map((s) =>
                  s.id === sticker.id ? { ...s, x: nx, y: ny } : s,
                ),
              );
            }}
            isSticker
          >
            <View style={styles.floatingStickerContainer}>
              <ExpoImage
                source={{ uri: sticker.url }}
                style={styles.floatingStickerImage}
                contentFit="contain"
              />
              <TouchableOpacity
                style={styles.removeSticker}
                onPress={() =>
                  setActiveStickers((prev) =>
                    prev.filter((s) => s.id !== sticker.id),
                  )
                }
              >
                <X size={12} color="#FFF" />
              </TouchableOpacity>
            </View>
          </DraggableElement>
        ))}

        {/* Typing Overlay - Instagram style */}
        {isTyping && (
          <View style={styles.typingOverlay}>
            {/* Close/Cancel area */}
            <TouchableOpacity
              style={styles.typingOverlayClose}
              onPress={() => {
                setCurrentText("");
                setIsTyping(false);
                textSubmittedRef.current = false;
              }}
            />
            {/* Central text input */}
            <View style={styles.typingInputCard}>
              <TextInput
                autoFocus
                multiline
                style={styles.typingInput}
                placeholder={t("Type something...") || "Type something..."}
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={currentText}
                onChangeText={setCurrentText}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (!textSubmittedRef.current && currentText.trim()) {
                    textSubmittedRef.current = true;
                    setFloatingTexts((prev) => [
                      ...prev,
                      {
                        id: Date.now().toString(),
                        text: currentText.trim(),
                        x: SCREEN_WIDTH / 2 - 80,
                        y: SCREEN_HEIGHT / 2 - 60,
                      },
                    ]);
                  }
                  setCurrentText("");
                  setIsTyping(false);
                  setTimeout(() => {
                    textSubmittedRef.current = false;
                  }, 100);
                }}
              />
              {/* Done button */}
              <TouchableOpacity
                style={styles.typingDoneBtn}
                onPress={() => {
                  if (!textSubmittedRef.current && currentText.trim()) {
                    textSubmittedRef.current = true;
                    setFloatingTexts((prev) => [
                      ...prev,
                      {
                        id: Date.now().toString(),
                        text: currentText.trim(),
                        x: SCREEN_WIDTH / 2 - 80,
                        y: SCREEN_HEIGHT / 2 - 60,
                      },
                    ]);
                  }
                  setCurrentText("");
                  setIsTyping(false);
                  setTimeout(() => {
                    textSubmittedRef.current = false;
                  }, 100);
                }}
              >
                <Text style={styles.typingDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Tools Overlay */}
        <View
          style={[styles.bottomTools, { paddingBottom: insets.bottom + 20 }]}
        >
          <BlurView intensity={60} tint="dark" style={styles.bottomPanel}>
            <View style={styles.userBar}>
              <Avatar
                source={user?.avatarUrl || user?.photoURL}
                size={40}
                fallback={user?.displayName?.[0] || "U"}
                style={{ borderWidth: 2, borderColor: "#FFF" }}
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.userNameText}>
                  {user?.displayName || "You"}
                </Text>
                <Text style={styles.infoText}>{selectedDuration}h story</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {renderFilters()}
            {renderDuration()}

            <TouchableOpacity
              onPress={handlePublish}
              disabled={uploading}
              style={styles.shareFab}
            >
              <LinearGradient
                colors={["#FF0080", "#FF8C00"]}
                style={styles.shareFabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.shareFabText}>
                      {t("Share") || "Share"}
                    </Text>
                    <Send size={16} color="#FFF" style={{ marginLeft: 6 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>
      </View>
    );
  };

  if (!selectedMedia) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: "#000" },
        ]}
      >
        <CameraUI
          onClose={onClose}
          onCapture={({ uri }) => handleCameraResult(uri, "image")}
          onVideoCapture={({ uri }) => handleCameraResult(uri, "video")}
          onGalleryPress={() => setIsMediaModalVisible(true)}
        />
        {renderMediaPicker()}
        
        {/* GIF Picker Integration */}
        <GifPicker
          visible={isGifPickerVisible}
          onClose={() => setIsGifPickerVisible(false)}
          onGifSelect={(gifUrl) => {
            setIsGifPickerVisible(false);
            handleMediaSelect([{
              id: Date.now().toString(),
              uri: gifUrl,
              type: "image",
              width: 400,
              height: 400
            }]);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderPreview()}

      {/* Full-screen MusicPicker modal */}
      <Modal
        visible={showMusicPicker}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMusicPicker(false)}
      >
        <MusicPicker
          initialTrack={selectedMusic}
          onClose={() => setShowMusicPicker(false)}
          onSelect={(track) => {
            setSelectedMusic(track);
            setShowMusicPicker(false);
          }}
        />
      </Modal>

      {/* Stipop Story Sticker Picker */}
      <StoryStickerPicker
        visible={isEmojiPickerVisible}
        onClose={() => setIsEmojiPickerVisible(false)}
        onSelect={(sticker) => {
          setActiveStickers([
            ...activeStickers,
            {
              id: Date.now().toString(),
              url: sticker.url,
              x: SCREEN_WIDTH / 2 - 50,
              y: SCREEN_HEIGHT / 2 - 50,
            },
          ]);
          setIsEmojiPickerVisible(false);
        }}
      />
    </View>
  );
}

const DraggableElement = ({
  children,
  initialX,
  initialY,
  onPositionChange,
  isSticker,
}: {
  children: any;
  initialX: number;
  initialY: number;
  onPositionChange: (x: number, y: number) => void;
  isSticker?: boolean;
}) => {
  const pan = useRef(
    new Animated.ValueXY({ x: initialX, y: initialY }),
  ).current;

  // Track current position internally to avoid losing it on multiple drags
  const position = useRef({ x: initialX, y: initialY }).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: position.x, y: position.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        position.x += gestureState.dx;
        position.y += gestureState.dy;
        onPositionChange(position.x, position.y);
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        pan.getLayout(),
        { position: "absolute", zIndex: 50, padding: isSticker ? 10 : 0 },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#000",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  mediaPickerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#000",
  },
  pickerHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  pickerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  pickerSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  pickerButton: {
    width: SCREEN_WIDTH * 0.75,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  pickerGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerButtonInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
  fullPreviewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullPreviewImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "absolute",
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  overlayHeader: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  blurCircle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  shareFab: {
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 20,
  },
  shareFabGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  shareFabText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  bottomTools: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  bottomPanel: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  userBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  userNameText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  infoText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
  },
  toolSection: {
    marginBottom: 8,
  },
  toolTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    marginHorizontal: 4,
    opacity: 0.8,
  },
  filtersRow: {
    marginBottom: 4,
  },
  filterItem: {
    alignItems: "center",
    marginRight: 20,
  },
  filterCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 8,
  },
  filterCircleSelected: {
    backgroundColor: "#FFF",
  },
  filterPreview: {
    flex: 1,
    borderRadius: 25,
  },
  filterName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
  },
  editorControls: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  rightControls: {
    flexDirection: "row",
    gap: 15,
  },
  filterNameSelected: {
    color: "#FFF",
  },
  durationRow: {
    flexDirection: "row",
  },
  durationPill: {
    flex: 1,
    flexDirection: "row",
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  durationPillSelected: {
    backgroundColor: "#FF0080",
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },
  musicOverlay: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 40,
  },
  musicOverlayText: {
    color: "#FFF",
    fontSize: 13,
    marginLeft: 6,
    fontWeight: "600",
  },
  floatingTextContainer: {
    zIndex: 50,
  },
  floatingText: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    textAlign: "center",
  },
  floatingStickerContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingStickerImage: {
    width: "100%",
    height: "100%",
  },
  removeSticker: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    padding: 2,
  },
  typingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  typingOverlayClose: {
    ...StyleSheet.absoluteFillObject,
  },
  typingInputCard: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: "rgba(30,30,30,0.92)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    zIndex: 101,
  },
  typingInput: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    minHeight: 50,
    maxHeight: 160,
  },
  typingDoneBtn: {
    marginTop: 12,
    backgroundColor: "#FF0080",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  typingDoneText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
  },
  pickerHeaderIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(120,120,120,0.3)",
    borderRadius: 2,
    marginBottom: 20,
  },

  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  optionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
