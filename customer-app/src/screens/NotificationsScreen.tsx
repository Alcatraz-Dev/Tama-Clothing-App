/**
 * NotificationsScreen - Live notifications, gift alerts, follows
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  Heart,
  Gift,
  UserPlus,
  MessageCircle,
  Video,
  X,
  Check,
} from "lucide-react-native";
import { db, auth } from "../api/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, limit, deleteDoc, updateDoc } from "firebase/firestore";

interface Notification {
  id: string;
  type: "live_start" | "gift_received" | "new_follower" | "like" | "comment" | "system";
  title: string;
  message: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  timestamp: any;
  isRead: boolean;
  data?: any;
}

export const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = auth?.currentUser?.uid || "demo_user";

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const q = query(
      collection(db, "notifications", currentUserId, "items"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
      setNotifications(notifs);
      setIsLoading(false);
    });
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", currentUserId, "items", notificationId), {
        isRead: true,
      });
    } catch (e) {
      console.log("[Notifications] Mark read error:", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      for (const notif of notifications) {
        if (!notif.isRead) {
          await updateDoc(doc(db, "notifications", currentUserId, "items", notif.id), {
            isRead: true,
          });
        }
      }
    } catch (e) {
      console.log("[Notifications] Mark all read error:", e);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, "notifications", currentUserId, "items", notificationId));
    } catch (e) {
      console.log("[Notifications] Delete error:", e);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "live_start":
        return <Video size={18} color="#FF0066" />;
      case "gift_received":
        return <Gift size={18} color="#FFD700" />;
      case "new_follower":
        return <UserPlus size={18} color="#2ECC71" />;
      case "like":
        return <Heart size={18} color="#FF0066" fill="#FF0066" />;
      case "comment":
        return <MessageCircle size={18} color="#00D4FF" />;
      default:
        return <Bell size={18} color="#888" />;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.notificationUnread]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationIcon}>
        {item.userAvatar ? (
          <Image source={{ uri: item.userAvatar }} style={styles.userAvatar} />
        ) : (
          getNotificationIcon(item.type)
        )}
      </View>

      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
      </View>

      <View style={styles.notificationActions}>
        {!item.isRead && (
          <View style={styles.unreadDot} />
        )}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteNotification(item.id)}
        >
          <X size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Demo notifications
  const demoNotifications: Notification[] = [
    {
      id: "1",
      type: "new_follower",
      title: "New Follower",
      message: "Sarah started following you",
      userName: "Sarah",
      userAvatar: "https://ui-avatars.com/api/?name=Sarah&background=FF0066&color=fff",
      timestamp: { toDate: () => new Date(Date.now() - 300000) },
      isRead: false,
    },
    {
      id: "2",
      type: "gift_received",
      title: "You received a gift!",
      message: "John sent you a Diamond worth 100 coins",
      userName: "John",
      userAvatar: "https://ui-avatars.com/api/?name=John&background=FFD700&color=000",
      timestamp: { toDate: () => new Date(Date.now() - 1800000) },
      isRead: false,
    },
    {
      id: "3",
      type: "live_start",
      title: "Live Started",
      message: "Your favorite host Mike is now live!",
      userName: "Mike",
      userAvatar: "https://ui-avatars.com/api/?name=Mike&background=00D4FF&color=fff",
      timestamp: { toDate: () => new Date(Date.now() - 3600000) },
      isRead: true,
    },
    {
      id: "4",
      type: "like",
      title: "New Like",
      message: "Your live stream received 50 new likes",
      timestamp: { toDate: () => new Date(Date.now() - 7200000) },
      isRead: true,
    },
    {
      id: "5",
      type: "comment",
      title: "New Comment",
      message: "Emma commented: Amazing show! 🔥",
      userName: "Emma",
      userAvatar: "https://ui-avatars.com/api/?name=Emma&background=9B59B6&color=fff",
      timestamp: { toDate: () => new Date(Date.now() - 14400000) },
      isRead: true,
    },
  ];

  const displayNotifications = notifications.length > 0 ? notifications : demoNotifications;
  const unreadCount = displayNotifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Check size={16} color="#FF0066" />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Bell size={16} color="#FF0066" />
          <Text style={styles.unreadBannerText}>
            {unreadCount} new notifications
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={displayNotifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={50} color="#333" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  markAllText: {
    color: "#FF0066",
    fontSize: 14,
  },
  unreadBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 0, 102, 0.1)",
    paddingVertical: 10,
    gap: 8,
  },
  unreadBannerText: {
    color: "#FF0066",
    fontSize: 14,
    fontWeight: "600",
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  notificationUnread: {
    backgroundColor: "rgba(255, 0, 102, 0.05)",
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  notificationMessage: {
    color: "#888",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  notificationTime: {
    color: "#555",
    fontSize: 11,
    marginTop: 6,
  },
  notificationActions: {
    alignItems: "center",
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF0066",
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
  },
});

export default NotificationsScreen;