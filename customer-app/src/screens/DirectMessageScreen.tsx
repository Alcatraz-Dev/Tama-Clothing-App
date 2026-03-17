import React, { useState, useEffect, useRef, JSX } from "react";
import { GifPicker } from "@/components/ui/gif-picker";
import {
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
  Dimensions,
  View,
  Alert,
  ScrollView,
} from "react-native";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  increment,
  deleteDoc,
  arrayUnion,
} from "firebase/firestore";
import UniversalVideoPlayer from "../components/common/UniversalVideoPlayer";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  X,
  SendHorizonal,
  Image as ImageIcon,
  MessageCircle,
  MessageSquare,
  Camera,
  MoreVertical,
  Plus,
  Trash,
  EyeOff,
  Shield,
  Send,
  Video,
  Smile,
  Mic,
  MicOff,
  Trash2,
  StopCircle,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react-native";
import { db } from "../api/firebase";
import { useAppTheme } from "../context/ThemeContext";
import { uploadToBunny } from "../utils/bunny";
import { sendPushNotification } from "../utils/notifications";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
interface DirectMessageScreenProps {
  user: any;
  targetUser: any;
  onBack: () => void;
  onNavigate?: (screen: string, params?: any) => void;
  t: (key: string) => string;
  language: string;
  currentUserData?: any;
}
import { Avatar } from "@/components/ui/avatar";
import { AvoidKeyboard } from "@/components/ui/avoid-keyboard";
import { Button } from "@/components/ui/button";
import { Camera as CameraUI } from "@/components/ui/camera";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { MediaPicker, MediaAsset } from "@/components/ui/media-picker";
import { AudioPlayer } from "@/components/ui/audio-player";
import { AudioWaveform } from "@/components/ui/audio-waveform";
import {
  AudioModule,
  RecordingPresets,
  useAudioRecorder,
  useAudioPlayer,
} from "expo-audio";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
} from "@/components/ui/popover";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function DirectMessageScreen({
  user,
  targetUser,
  onBack,
  onNavigate,
  t,
  language,
  currentUserData,
}: DirectMessageScreenProps): React.ReactElement {
  const { theme } = useAppTheme();
  const colors = {
    background: useColor("background"),
    foreground: useColor("foreground"),
    card: useColor("card"),
    accent: useColor("accent"),
    border: useColor("border"),
    textMuted: useColor("textMuted"),
    blue: useColor("blue"),
  };

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isMediaModalVisible, setIsMediaModalVisible] = useState(false);
  const [isGifPickerVisible, setIsGifPickerVisible] = useState(false);
  const [viewMode, setViewMode] = useState<"chat" | "camera">("chat");
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<any>(null);
  const blurTargetRef = useRef<View>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recorderPermission, setRecorderPermission] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingWaveform, setRecordingWaveform] = useState<number[]>([]);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [recordedWaveform, setRecordedWaveform] = useState<number[]>([]);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewPlayer = useAudioPlayer(recordedUri);

  useEffect(() => {
    (async () => {
      const { status } = await AudioModule.getRecordingPermissionsAsync();
      setRecorderPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    if (previewPlayer) {
      const sub = previewPlayer.addListener("playbackStatusUpdate", (status) => {
        setIsPreviewPlaying(status.playing);
      });
      return () => sub.remove();
    }
  }, [previewPlayer]);




  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
        // Simulate waveform data
        setRecordingWaveform((prev) => {
          const newLevel = 0.2 + Math.random() * 0.8;
          const updated = [...prev, newLevel];
          if (updated.length > 40) return updated.slice(1);
          return updated;
        });
      }, 100);
    } else {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      setRecordingDuration(0);
      setRecordingWaveform([]);
    }
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
    };
  }, [isRecording]);

  const insets = useSafeAreaInsets();

  const chatId = [user?.uid, targetUser?.uid].sort().join("_");

  const tr = (fr: string, ar: string, en: string) => {
    if (language === "ar") return ar;
    if (language === "fr") return fr;
    return en;
  };

  const emojiCategories = React.useMemo(() => [
    {
      title: tr("Visages", "وجوه", "Faces"),
      emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"],
    },
    {
      title: tr("Cœurs", "قلوب", "Hearts"),
      emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"],
    },
    {
      title: tr("Mains", "أيدي", "Hands"),
      emojis: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "🤳", "💪", "🦾", "🖕", "✍️", "🙏", "🤝", "🤲", "🤜", "🤛", "👐", "🙌", "👏", "👍", "👎", "👊", "✊"],
    },
    {
      title: tr("Activités", "أنشطة", "Activities"),
      emojis: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥅", "🏒", "🏑", "🏏", "⛳", "🏹", "🎣", "🛶", "🎿", "🏂", "🏋️‍♀️", "🏋️‍♂️", "🚴‍♀️", "🚴‍♂️", "🚵‍♀️", "🚵‍♂️", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🎫", "🎟️", "🎭", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🎸", "🎻"],
    },
  ], [language]);

  useEffect(() => {
    if (!chatId || !user?.uid) return;

    const messagesRef = collection(db, "direct_chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgs);
        setLoading(false);

        // Mark unread messages as read
        snapshot.docs.forEach(async (mDoc) => {
          const data = mDoc.data();
          if (data.senderId !== user.uid && !data.read) {
            try {
              await updateDoc(
                doc(db, "direct_chats", chatId, "messages", mDoc.id),
                { read: true },
              );
            } catch (e) {}
          }
        });

        // Reset unread count on the chat document
        try {
          await setDoc(
            doc(db, "direct_chats", chatId),
            {
              [`unreadCount_${user.uid}`]: 0,
            },
            { merge: true },
          );
        } catch (e) {}
      },
      (err) => {
        console.error("DirectMessageScreen Error:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [chatId, user?.uid]);
  const handleEmojiSelect = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    Haptics.selectionAsync();
  };

  const handleStartRecording = async () => {
    if (!recorderPermission) {
      Alert.alert(
        tr("Permission requise", "الإذن مطلوب", "Permission required"),
        tr(
          "Veuillez autoriser l'accès au microphone.",
          "يرجى السماح بالوصول إلى الميكروفون.",
          "Please allow microphone access.",
        ),
      );
      return;
    }

    try {
      setIsEmojiPickerVisible(false);
      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
      await recorder.record();
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.error("Error starting recording:", e);
    }
  };

  const handleStopRecording = async (shouldKeep: boolean = true) => {
    try {
      await recorder.stop();
      setIsRecording(false);
      
      if (shouldKeep && recorder.uri) {
        setRecordedUri(recorder.uri);
        setRecordedDuration(recordingDuration / 10);
        setRecordedWaveform([...recordingWaveform]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setRecordingDuration(0);
        setRecordingWaveform([]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      console.error("Error stopping recording:", e);
      setIsRecording(false);
    }
  };

  const discardRecordedAudio = () => {
    setRecordedUri(null);
    setRecordedDuration(0);
    setRecordedWaveform([]);
    setIsPreviewPlaying(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  const sendMessage = async (
    overrideText?: string | null,
    imageUrl?: string | null,
    videoUrl?: string | null,
    gifUrl?: string | null,
    audioUrl?: string | null,
    audioDuration?: number | null,
  ) => {
    const textToSend = overrideText !== undefined ? overrideText : inputText;
    if (
      (!textToSend?.trim() && !imageUrl && !videoUrl && !gifUrl && !audioUrl) ||
      !user?.uid ||
      !targetUser?.uid
    )
      return;

    setSending(true);
    try {
      const messagesRef = collection(db, "direct_chats", chatId, "messages");
      const senderName =
        currentUserData?.fullName ||
        currentUserData?.displayName ||
        user.displayName ||
        "User";

      const messageData: any = {
        text: textToSend?.trim() || "",
        senderId: user.uid,
        senderName: senderName,
        timestamp: serverTimestamp(),
        read: false,
      };

      if (imageUrl) messageData.imageUrl = imageUrl;
      if (videoUrl) messageData.videoUrl = videoUrl;
      if (gifUrl) messageData.gifUrl = gifUrl;
      if (audioUrl) {
        messageData.audioUrl = audioUrl;
        messageData.audioDuration = audioDuration;
      }

      if (replyingTo) {
        messageData.replyTo = {
          id: replyingTo.id,
          text: replyingTo.text,
          senderName: replyingTo.senderName,
          senderId: replyingTo.senderId,
          imageUrl: replyingTo.imageUrl || null,
          videoUrl: replyingTo.videoUrl || null,
          gifUrl: replyingTo.gifUrl || null,
          audioUrl: replyingTo.audioUrl || null,
        };
      }

      await addDoc(messagesRef, messageData);

      setReplyingTo(null);

      const lastMessageText = audioUrl
        ? tr("Message vocal 🎤", "رسالة صوتية 🎤", "Voice message 🎤")
        : imageUrl
          ? tr("Photo 📸", "تصويرة 📸", "Photo 📸")
          : videoUrl
            ? tr("Vidéo 📹", "فيديو 📹", "Video 📹")
            : gifUrl
              ? "GIF 🖼️"
              : (textToSend || "");

      const chatDocRef = doc(db, "direct_chats", chatId);
      await setDoc(
        chatDocRef,
        {
          lastMessage: lastMessageText,
          lastMessageTime: serverTimestamp(),
          participants: [user.uid, targetUser.uid],
          participantData: {
            [user.uid]: {
              name: senderName,
              photo: currentUserData?.avatarUrl || user.photoURL || null,
            },
            [targetUser.uid]: {
              name: targetUser.fullName || targetUser.displayName || "User",
              photo: targetUser.avatarUrl || targetUser.photoURL || null,
            },
          },
          [`unreadCount_${targetUser.uid}`]: increment(1),
        },
        { merge: true },
      );

      if (overrideText === undefined) {
        setInputText("");
      }

      if (targetUser.expoPushToken) {
        sendPushNotification(
          targetUser.expoPushToken,
          tr(
            `Message de ${senderName}`,
            `ميساج من عند ${senderName}`,
            `Message from ${senderName}`,
          ),
          lastMessageText,
        );
      }
    } catch (e) {
      console.error("Error sending DM:", e);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await updateDoc(doc(db, "direct_chats", chatId, "messages", messageId), {
        deleted: true,
        text: tr("Message supprimé", "تم حذف الرسالة", "Message deleted"),
        imageUrl: null,
        videoUrl: null,
        gifUrl: null,
      });
      setReplyingTo(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error("Error deleting message:", e);
    }
  };

  const handleDeleteConversation = () => {
    Alert.alert(
      tr("Supprimer", "حذف", "Delete"),
      tr(
        "Voulez-vous supprimer cette conversation ?",
        "هل تريد حذف هذه المحادثة؟",
        "Do you want to delete this conversation?",
      ),
      [
        { text: tr("Annuler", "إلغاء", "Cancel"), style: "cancel" },
        {
          text: tr("Supprimer", "حذف", "Delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "direct_chats", chatId));
              onBack();
            } catch (e) {
              console.error(e);
            }
          },
        },
      ],
    );
  };

  const handleHideConversation = async () => {
    try {
      await updateDoc(doc(db, "direct_chats", chatId), {
        [`hidden_${user.uid}`]: true,
      });
      onBack();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlockUser = () => {
    Alert.alert(
      tr("Bloquer", "حظر", "Block"),
      tr(
        "Voulez-vous bloquer cet utilisateur ?",
        "هل تريد حظر هذا المستخدم؟",
        "Do you want to block this user?",
      ),
      [
        { text: tr("Annuler", "إلغاء", "Cancel"), style: "cancel" },
        {
          text: tr("Bloquer", "حظر", "Block"),
          style: "destructive",
          onPress: async () => {
            try {
              const blockRef = doc(db, "users", user.uid);
              await updateDoc(blockRef, {
                blockedUsers: arrayUnion(targetUser.uid),
              });
              onBack();
            } catch (e) {
              console.error(e);
            }
          },
        },
      ],
    );
  };

  const handleMediaSelection = async (assets: MediaAsset[]) => {
    if (assets.length === 0) return;
    const asset = assets[0];
    handleMediaUpload(asset.uri);
  };

  // Media choice modal handlers - using MediaPicker component
  const openCamera = async () => {
    // Camera functionality is handled by MediaPicker component
    setIsMediaModalVisible(false);
  };

  const handleCameraCapture = () => {
    setIsMediaModalVisible(false);
    if (onNavigate) {
      onNavigate("Camera", {
        onCapture: (uri: string) => {
          handleMediaUpload(uri);
        },
      });
    } else {
      setViewMode("camera");
    }
  };

  const handleCameraResult = async (uri: string, type: "image" | "video") => {
    setViewMode("chat");
    if (uri) {
      handleMediaUpload(uri);
    }
  };

  const handleGalleryPick = async () => {
    // Gallery is handled by MediaPicker component
    setIsMediaModalVisible(false);
  };

  const handleMediaUpload = async (uri: string) => {
    setUploading(true);
    try {
      const fileType = uri.split(".").pop()?.toLowerCase();
      const isVideo = ["mp4", "mov", "avi", "mkv"].includes(fileType || "");
      const bunnyUrl = await uploadToBunny(uri);

      setUploading(false);
      await sendMessage(null, isVideo ? null : bunnyUrl, isVideo ? bunnyUrl : null);
    } catch (e) {
      console.error("Error uploading media:", e);
      Alert.alert("Error", "Failed to upload media");
    } finally {
      setUploading(false);
    }
  };

  const handleAudioUpload = async (uri: string, duration: number) => {
    setUploading(true);
    try {
      const bunnyUrl = await uploadToBunny(uri);
      await sendMessage(null, null, null, null, bunnyUrl, duration);
    } catch (e) {
      console.error("Error uploading audio:", e);
    } finally {
      setUploading(false);
    }
  };



  const handleGifSelection = async (gifUrl: string) => {
    setIsGifPickerVisible(false);
    if (!gifUrl || !user?.uid || !targetUser?.uid) return;

    setSending(true);
    try {
      await sendMessage(null, null, null, gifUrl);
    } catch (e) {
      console.error("Error sending GIF:", e);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isOwn = item.senderId === user.uid;
    const prevMessage = messages[index - 1];
    const nextMessage = messages[index + 1];

    const isFirstInGroup =
      !prevMessage || prevMessage.senderId !== item.senderId;
    const isLastInGroup =
      !nextMessage || nextMessage.senderId !== item.senderId;
    const showAvatar = !isOwn && isLastInGroup;

    return (
      <View
        style={{
          marginBottom: isLastInGroup ? 16 : 4,
          alignItems: isOwn ? "flex-end" : "flex-start",
          flexDirection: "row",
          justifyContent: isOwn ? "flex-end" : "flex-start",
          paddingHorizontal: 16,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => {
            if (item.deleted) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const options: any[] = [
              {
                text: tr("Répondre", "رد", "Reply"),
                onPress: () => {
                  setReplyingTo(item);
                  Haptics.selectionAsync();
                },
              },
            ];

            if (isOwn) {
              options.push({
                text: tr("Supprimer", "حذف", "Delete"),
                style: "destructive",
                onPress: () => {
                  Alert.alert(
                    tr("Supprimer", "حذف", "Delete"),
                    tr(
                      "Voulez-vous supprimer ce message ?",
                      "هل تريد حذف هذه الرسالة؟",
                      "Do you want to delete this message?",
                    ),
                    [
                      {
                        text: tr("Annuler", "إلغاء", "Cancel"),
                        style: "cancel",
                      },
                      {
                        text: tr("Supprimer", "حذف", "Delete"),
                        style: "destructive",
                        onPress: () => deleteMessage(item.id),
                      },
                    ],
                  );
                },
              });
            }

            options.push({
              text: tr("Annuler", "إلغاء", "Cancel"),
              style: "cancel",
            });

            Alert.alert(tr("Options", "خيارات", "Options"), "", options);
          }}
          delayLongPress={300}
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            maxWidth: "80%",
          }}
        >
          {!isOwn && (
            <View
              style={{ width: 32, marginRight: 8, justifyContent: "flex-end" }}
            >
              {showAvatar && (
                <Avatar
                  source={
                    targetUser.avatarUrl ||
                    targetUser.photoURL ||
                    targetUser.image ||
                    targetUser.photo
                  }
                  size={32}
                />
              )}
            </View>
          )}
          <View
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            {isOwn ? (
              <View
                style={{
                  padding:
                    item.imageUrl || item.videoUrl || item.gifUrl ? 4 : 12,
                  paddingHorizontal:
                    (item.imageUrl || item.videoUrl || item.gifUrl) &&
                    !item.replyTo
                      ? 4
                      : 16,
                  borderRadius: 20,
                  borderBottomRightRadius: isLastInGroup ? 4 : 20,
                  backgroundColor: item.deleted
                    ? (theme === "dark" ? "#2c2c2e" : "#f2f2f7")
                    : (isOwn
                      ? (theme === "dark" ? "#FFFFFF" : "#000000")
                      : (theme === "dark" ? "#1c1c1e" : "#f2f2f7")),
                  borderWidth: item.deleted ? 1 : 0,
                  borderColor: theme === "dark" ? "#3a3a3c" : "#d1d1d6",
                }}
              >
                {renderMessageContent(item, isOwn)}
              </View>
            ) : (
              <View
                style={{
                  padding: item.imageUrl || item.videoUrl || item.gifUrl ? 4 : 12,
                  paddingHorizontal: (item.imageUrl || item.videoUrl || item.gifUrl) && !item.replyTo ? 4 : 16,
                  borderRadius: 20,
                  borderBottomLeftRadius: isLastInGroup ? 4 : 20,
                  backgroundColor: theme === "dark" ? "#1c1c1e" : "#f2f2f7",
                }}
              >
                {renderMessageContent(item, false)}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMessageContent = (item: any, isOwn: boolean) => {
    const timestamp = item.timestamp?.toDate
      ? item.timestamp.toDate()
      : new Date();
    return (
      <View>
        {item.replyTo && (
          <View
            style={{
              padding: 8,
              backgroundColor: isOwn ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.03)",
              borderRadius: 12,
              marginBottom: 8,
              borderLeftWidth: 4,
              borderLeftColor: isOwn
                ? theme === "dark"
                  ? "#000"
                  : "#FFF"
                : colors.blue,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: isOwn
                  ? theme === "dark"
                    ? "#000"
                    : "#FFF"
                  : colors.blue,
              }}
            >
              {item.replyTo.senderId === user.uid
                ? tr("Vous", "أنت", "You")
                : item.replyTo.senderName}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                fontSize: 13,
                color: isOwn
                  ? theme === "dark"
                    ? "rgba(0,0,0,0.6)"
                    : "rgba(255,255,255,0.7)"
                  : colors.textMuted,
              }}
            >
              {item.replyTo.imageUrl
                ? tr("Photo 📸", "تصويرة 📸", "Photo 📸")
                : item.replyTo.videoUrl
                  ? tr("Vidéo 📹", "فيديو 📹", "Video 📹")
                  : item.replyTo.gifUrl
                    ? "GIF 🖼️"
                    : item.replyTo.audioUrl
                      ? tr("Message vocal 🎤", "رسالة صوتية 🎤", "Voice message 🎤")
                      : item.replyTo.text}
            </Text>
          </View>
        )}
        {item.imageUrl ? (
          <TouchableOpacity
            onPress={() => setFullScreenImage(item.imageUrl)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={{
                width: SCREEN_WIDTH * 0.7,
                height: SCREEN_WIDTH * 0.7,
                borderRadius: 16,
              }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : item.videoUrl ? (
          <View
            style={{
              width: SCREEN_WIDTH * 0.7,
              height: SCREEN_WIDTH * 0.7,
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: "#000",
            }}
          >
            <UniversalVideoPlayer
              source={{ uri: item.videoUrl }}
              style={{ width: "100%", height: "100%" }}
              useNativeControls={false}
              resizeMode="cover"
            />
          </View>
        ) : item.gifUrl ? (
          <ExpoImage
            source={{ uri: item.gifUrl }}
            style={{
              width: SCREEN_WIDTH * 0.7,
              height: SCREEN_WIDTH * 0.7,
              borderRadius: 16,
            }}
            contentFit="cover"
            cachePolicy="disk"
          />
        ) : item.audioUrl ? (
          <AudioPlayer
            source={{ uri: item.audioUrl }}
            showWaveform={true}
            showControls={true}
            showTimer={true}
            style={{
              backgroundColor: isOwn ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)",
              borderRadius: 16,
              width: SCREEN_WIDTH * 0.65,
              padding: 10,
            }}
          />
        ) : (
          <Text
            style={{
              color: item.deleted
                ? colors.textMuted
                : isOwn
                  ? theme === "dark"
                    ? "black"
                    : "white"
                  : colors.foreground,
              fontSize: 16,
              lineHeight: 22,
              fontWeight: item.deleted ? "400" : "500",
              fontStyle: item.deleted ? "italic" : "normal",
            }}
          >
            {item.deleted 
              ? tr("Message supprimé", "تم حذف الرسالة", "Message deleted")
              : item.text}
          </Text>
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            marginTop: item.imageUrl || item.videoUrl || item.gifUrl ? -24 : 2,
            paddingHorizontal:
              item.imageUrl || item.videoUrl || item.gifUrl ? 8 : 0,
            paddingBottom:
              item.imageUrl || item.videoUrl || item.gifUrl ? 8 : 0,
          }}
        >
          <Text
            style={{
              color: isOwn
                ? theme === "dark"
                  ? "rgba(0,0,0,0.5)"
                  : "rgba(255,255,255,0.7)"
                : colors.textMuted,
              fontSize: 10,
              fontWeight: "600",
              textShadowColor:
                item.imageUrl || item.videoUrl || item.gifUrl
                  ? "rgba(0,0,0,0.3)"
                  : "transparent",
              textShadowRadius:
                item.imageUrl || item.videoUrl || item.gifUrl ? 2 : 0,
            }}
          >
            {timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {isOwn && (
            <View style={{ marginLeft: 4 }}>
              <CheckCheck
                size={12}
                color={
                  item.read
                    ? "#A855F7"
                    : theme === "dark"
                      ? "rgba(0,0,0,0.4)"
                      : "rgba(255,255,255,0.6)"
                }
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  if (viewMode === "camera") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <CameraUI
            onClose={() => setViewMode("chat")}
            onCapture={({ uri }) => handleCameraResult(uri, "image")}
            onVideoCapture={({ uri }) => handleCameraResult(uri, "video")}
            enableVideo={true}
            maxVideoDuration={60}
          />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Modern Blue Header - Consistent with App Theme */}
      <View
        style={[
          { paddingTop: insets.top + 10, height: insets.top + 64 },
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            overflow: "hidden",
          },
        ]}
      >
        <BlurView
          intensity={80}
          tint={theme ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 8,
            paddingBottom: 12,
            gap: 20,
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <TouchableOpacity
              onPress={onBack}
              style={[
                {
                  backgroundColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <ChevronLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginLeft: 15,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ position: "relative" }}>
                  <Avatar
                    source={
                      targetUser?.avatarUrl ||
                      targetUser?.photoURL ||
                      targetUser?.image ||
                      targetUser?.photo
                    }
                    size={44}
                    fallback={(targetUser?.fullName ||
                      targetUser?.displayName ||
                      targetUser?.name ||
                      "U")[0].toUpperCase()}
                  />
                  <View
                    style={{
                      position: "absolute",
                      bottom: 1,
                      right: 1,
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: "#31A24C",
                      borderWidth: 2,
                      borderColor: colors.background,
                    }}
                  />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 17,
                      fontWeight: "700",
                    }}
                  >
                    {[
                      targetUser?.fullName,
                      targetUser?.displayName,
                      targetUser?.name,
                    ].find((n) => n) || "User"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#31A24C",
                        marginRight: 6,
                      }}
                    />
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 13,
                        opacity: 0.8,
                      }}
                    >
                      {tr("En ligne", "متصل", "Online")}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {/* Camera icon removed from header as per user request */}

            <TouchableOpacity
              onPress={() => {
                Alert.alert(tr("Options", "خيارات", "Options"), "", [
                  { text: tr("Annuler", "إلغاء", "Cancel"), style: "cancel" },
                  {
                    text: tr(
                      "Supprimer la conversation",
                      "حذف المحادثة",
                      "Delete conversation",
                    ),
                    style: "destructive",
                    onPress: handleDeleteConversation,
                  },
                  {
                    text: tr(
                      "Masquer la conversation",
                      "إخفاء المحادثة",
                      "Hide conversation",
                    ),
                    onPress: handleHideConversation,
                  },
                  {
                    text: tr(
                      "Bloquer l'utilisateur",
                      "بلوك المستخدم",
                      "Block user",
                    ),
                    style: "destructive",
                    onPress: handleBlockUser,
                  },
                ]);
              }}
            >
              <Button
                variant="ghost"
                size="icon"
                style={{ width: 40, height: 40, borderRadius: 20 }}
                disabled
              >
                <MoreVertical size={24} color={colors.foreground} />
              </Button>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Messages */}
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: insets.top + 74,
            paddingBottom: insets.bottom + 90,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            !loading ? (
              <View
                style={{
                  alignItems: "center",
                  marginTop: 150,
                  paddingHorizontal: 40,
                }}
              >
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: colors.card,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                  }}
                >
                  <MessageCircle
                    size={48}
                    color={colors.textMuted}
                    strokeWidth={1}
                  />
                </View>
                <Text
                  variant="title"
                  style={{ fontSize: 20, textAlign: "center" }}
                >
                  {tr("Dites bonjour 👋", "قل مرحباً 👋", "Say hello 👋")}
                </Text>
                <Text
                  style={{
                    color: colors.textMuted,
                    textAlign: "center",
                    marginTop: 8,
                    fontSize: 14,
                  }}
                >
                  {tr("Dites bonjour à", "قل مرحباً لـ", "Say hello to")}{" "}
                  {targetUser.fullName ||
                    targetUser.displayName ||
                    "your friend"}
                  !
                </Text>
              </View>
            ) : (
              <ActivityIndicator
                color={colors.blue}
                style={{ marginTop: 100 }}
              />
            )
          }
        />
      </View>

      {/* Input Area */}
      <BlurView
        intensity={Platform.OS === "ios" ? 90 : 100}
        tint={theme === "dark" ? "dark" : "light"}
        blurMethod="dimezisBlurView"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
        }}
      >
        {replyingTo && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor:
                theme === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              padding: 10,
              borderRadius: 12,
              marginBottom: 8,
              borderLeftWidth: 4,
              borderLeftColor: colors.blue,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "bold", color: colors.blue }}
              >
                {replyingTo.senderId === user.uid
                  ? tr(
                      "Répondre à vous-même",
                      "رد على نفسك",
                      "Replying to yourself",
                    )
                  : tr(
                      `Répondre à ${replyingTo.senderName}`,
                      `رد على ${replyingTo.senderName}`,
                      `Replying to ${replyingTo.senderName}`,
                    )}
              </Text>
             </View>
            <TouchableOpacity
              onPress={() => setReplyingTo(null)}
              style={{ padding: 4 }}
            >
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {isEmojiPickerVisible && (
          <View
            style={{
              height: 200,
              backgroundColor: theme === "dark" ? "#1c1c1e" : "#f2f2f7",
              borderRadius: 20,
              padding: 10,
              marginBottom: 10,
              overflow: "hidden",
            }}
          >
            <ScrollView 
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              contentContainerStyle={{ paddingBottom: 15 }}
            >
              {emojiCategories.map((category, catIndex) => (
                <View key={`cat-${catIndex}`} style={{ marginBottom: 15 }}>
                  <Text style={{ 
                    fontSize: 12, 
                    fontWeight: "600", 
                    color: colors.textMuted,
                    marginBottom: 8,
                    marginLeft: 5,
                    textTransform: "uppercase",
                    letterSpacing: 1
                  }}>
                    {category.title}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {category.emojis.map((emoji, index) => (
                      <TouchableOpacity
                        key={`emoji-${catIndex}-${index}`}
                        onPress={() => handleEmojiSelect(emoji)}
                        style={{
                          width: "14.28%", // 7 items per row
                          aspectRatio: 1,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontSize: 24 }}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {isRecording && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              backgroundColor: colors.blue + "15",
              borderRadius: 22,
              marginBottom: 10,
              paddingHorizontal: 15,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#EF4444",
              }}
            />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.foreground,
                minWidth: 45,
              }}
            >
              {(recordingDuration / 10).toFixed(1)}s
            </Text>
            <View style={{ flex: 1, height: 30, justifyContent: "center" }}>
              <AudioWaveform
                data={recordingWaveform}
                height={20}
                activeColor={colors.blue}
                inactiveColor={colors.blue + "40"}
              />
            </View>
            <TouchableOpacity
              onPress={() => handleStopRecording(false)}
              style={{ padding: 8 }}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleStopRecording(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.blue,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StopCircle size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {recordedUri && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              backgroundColor: theme === "dark" ? "#1c1c1e" : "#f2f2f7",
              borderRadius: 22,
              marginBottom: 10,
              paddingHorizontal: 15,
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={discardRecordedAudio}
              style={{ padding: 8 }}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
            
             <TouchableOpacity
               onPress={() => isPreviewPlaying ? previewPlayer.pause() : previewPlayer.play()}
               style={{
                 width: 32,
                 height: 32,
                 borderRadius: 16,
                 backgroundColor: colors.blue + "20",
                 alignItems: "center",
                 justifyContent: "center",
               }}
             >
               {isPreviewPlaying ? (
                 <Pause size={16} color={colors.blue} />
               ) : (
                 <Play size={16} color={colors.blue} fill={colors.blue} />
               )}
             </TouchableOpacity>

             <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  {recordedDuration.toFixed(1)}s
                </Text>
                <View style={{ flex: 1, height: 30, justifyContent: "center" }}>
                  <AudioWaveform
                    data={recordedWaveform}
                    height={20}
                    activeColor={colors.blue}
                    inactiveColor={colors.blue + "40"}
                  />
                </View>
             </View>

            <TouchableOpacity
              onPress={() => handleAudioUpload(recordedUri, recordedDuration)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.blue,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={() => setIsMediaModalVisible(true)}
            disabled={uploading || isRecording}
            style={{
              width: 44,
              height: 44,
              backgroundColor:
                theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              opacity: isRecording ? 0.3 : 1,
            }}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.blue} />
            ) : (
              <ImageIcon size={22} color={colors.foreground} />
            )}
          </TouchableOpacity>

          {!isRecording && !recordedUri && (
            <>
              <TouchableOpacity
                onPress={() => setIsEmojiPickerVisible(!isEmojiPickerVisible)}
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: isEmojiPickerVisible
                    ? colors.blue + "20"
                    : theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                }}
              >
                <Smile
                  size={22}
                  color={isEmojiPickerVisible ? colors.blue : colors.foreground}
                />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Input
                  ref={inputRef}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder={tr(
                    "Tapez votre message...",
                    "اكتب رسالة...",
                    "Type a message...",
                  )}
                  variant="ghost"
                  multiline
                  containerStyle={{
                    minHeight: 44,
                    backgroundColor: theme === "dark" ? "#1c1c1e" : "#f2f2f7",
                    borderRadius: 22,
                    paddingHorizontal: 12,
                    borderWidth: 0,
                  }}
                  inputStyle={{
                    maxHeight: 120,
                    fontSize: 16,
                    paddingVertical: 10,
                    color: colors.foreground,
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={
                  inputText.trim()
                    ? () => sendMessage()
                    : handleStartRecording
                }
                disabled={sending}
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: colors.blue,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 22,
                }}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : inputText.trim() ? (
                  <Send size={20} color="white" />
                ) : (
                  <Mic size={20} color="white" />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </BlurView>

      {/* Keyboard avoidance */}
      <AvoidKeyboard />

      {/* Modals */}
      <Modal
        visible={!!fullScreenImage}
        transparent
        onRequestClose={() => setFullScreenImage(null)}
      >
        <View
          style={{ flex: 1, backgroundColor: "#000", justifyContent: "center" }}
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              top: insets.top + 10,
              right: 20,
              zIndex: 10,
            }}
            onPress={() => setFullScreenImage(null)}
          >
            <X size={32} color="white" />
          </TouchableOpacity>
          {fullScreenImage && (
            <Image
              source={{ uri: fullScreenImage }}
              style={{ width: "100%", height: "80%" }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Media Choice Modal - like ChatScreen */}
      <Modal
        visible={isMediaModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMediaModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
          }}
          onPress={() => setIsMediaModalVisible(false)}
          activeOpacity={1}
        >
          <View
            style={{
              backgroundColor: theme === "dark" ? "#1c1c1e" : "#FFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: 40,
              paddingHorizontal: 20,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: theme === "dark" ? "#3a3a3c" : "#E5E5EA",
                borderRadius: 2,
                alignSelf: "center",
                marginTop: 12,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 15,
                marginBottom: 25,
              }}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 19,
                  fontWeight: "700",
                }}
              >
                {tr("Choisir un média", "اختر وسائط", "Choose media")}
              </Text>
              <TouchableOpacity
                onPress={() => setIsMediaModalVisible(false)}
                style={{ padding: 4 }}
              >
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <MediaPicker
                mediaType="image"
                onSelectionChange={(assets) => {
                  if (assets.length > 0) {
                    setIsMediaModalVisible(false);
                    handleMediaUpload(assets[0].uri);
                  }
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme === "dark" ? "#2c2c2e" : "#F2F2F7",
                    padding: 16,
                    borderRadius: 16,
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
                    <Text
                      style={{
                        color: colors.foreground,
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      {tr("Photo", "صورة", "Photo")}
                    </Text>
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 13,
                        marginTop: 1,
                      }}
                    >
                      {tr(
                        "Choisir depuis la galerie",
                        "اختر من المعرض",
                        "Choose from gallery",
                      )}
                    </Text>
                  </View>
                </View>
              </MediaPicker>

              <MediaPicker
                mediaType="video"
                onSelectionChange={(assets) => {
                  if (assets.length > 0) {
                    setIsMediaModalVisible(false);
                    handleMediaUpload(assets[0].uri);
                  }
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme === "dark" ? "#2c2c2e" : "#F2F2F7",
                    padding: 16,
                    borderRadius: 16,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "#FF2D55",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 15,
                    }}
                  >
                    <Video size={22} color="#FFF" />
                  </View>
                  <View>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      {tr("Vidéo", "فيديو", "Video")}
                    </Text>
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 13,
                        marginTop: 1,
                      }}
                    >
                      {tr(
                        "Partager une vidéo",
                        "مشاركة فيديو",
                        "Share a video",
                      )}
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
                  backgroundColor: theme === "dark" ? "#2c2c2e" : "#F2F2F7",
                  padding: 16,
                  borderRadius: 16,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#00B2FF",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 15,
                  }}
                >
                  <Smile size={22} color="#FFF" />
                </View>
                <View>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    {tr("GIF", "GIF", "GIF")}
                  </Text>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 13,
                      marginTop: 1,
                    }}
                  >
                    {tr(
                      "Rechercher et envoyer des GIFs",
                      "بحث وإرسال صور GIF",
                      "Search and send GIFs",
                    )}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* GIF Picker Modal */}
      <GifPicker
        onGifSelect={handleGifSelection}
        onClose={() => setIsGifPickerVisible(false)}
        visible={isGifPickerVisible}
      />
    </SafeAreaView>
  );
}
