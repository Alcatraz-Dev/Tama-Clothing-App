/**
 * PushNotificationService - Live stream notifications
 */
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { auth, db, functions } from "../api/firebase";
import { doc, updateDoc, setDoc, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, limit, where, getDocs, writeBatch } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface LiveNotification {
  id: string;
  type: "live" | "gift" | "follow" | "system";
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: any;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private expoToken: string | null = null;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log("[Push] Must use physical device");
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Push] Permission denied");
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("live", {
        name: "Live Streams",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF0066",
        sound: "default",
      });

      await Notifications.setNotificationChannelAsync("gifts", {
        name: "Gifts & Rewards",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: "default",
      });
    }

    return true;
  }

  async registerToken(): Promise<string | null> {
    try {
      const { data: token } = await Notifications.getExpoPushTokenAsync();
      this.expoToken = token;

      // Save to Firebase
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          fcmToken: token,
          expoPushToken: token,
        });
      }

      // Also call Cloud Function to register
      try {
        const registerFn = httpsCallable(functions, "registerFcmToken");
        await registerFn({ token });
      } catch (e) {
        console.log("[Push] Cloud function not available, using direct update");
      }

      console.log("[Push] Token registered:", token.substring(0, 20) + "...");
      return token;
    } catch (error) {
      console.error("[Push] Token registration error:", error);
      return null;
    }
  }

  async sendLocalNotification(payload: NotificationPayload): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: "default",
      },
      trigger: null, // Send immediately
    });
  }

  // Subscribe to in-app notifications
  subscribeToNotifications(
    userId: string,
    callback: (notifications: LiveNotification[]) => void
  ): () => void {
    const q = query(
      collection(db, "users", userId, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LiveNotification[];
      callback(notifications);
    });
  }

  // Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await updateDoc(
      doc(db, "users", userId, "notifications", notificationId),
      { read: true }
    );
  }

   // Mark all as read
   async markAllAsRead(userId: string): Promise<void> {
     const snapshot = await getDocs(
       query(
         collection(db, "users", userId, "notifications"),
         where("read", "==", false)
       )
     );

     const batch = writeBatch(db);
     snapshot.docs.forEach((doc) => {
       batch.update(doc.ref, { read: true });
     });
     await batch.commit();
   }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    const snapshot = await getDocs(
      query(
        collection(db, "users", userId, "notifications"),
        where("read", "==", false)
      )
    );
    return snapshot.size;
  }

  // Notification tap handler
  setupNotificationHandlers(
    onLiveNotification: (roomId: string) => void,
    onGiftNotification: (giftId: string) => void,
    onFollowNotification: (userId: string) => void
   ): void {
     Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
       const data = notification.request.content.data;
       
       switch (data?.type) {
         case "live":
           onLiveNotification(data.roomId);
           break;
         case "gift":
           onGiftNotification(data.giftId);
           break;
         case "follow":
           onFollowNotification(data.userId);
           break;
       }
     });

     Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
       const data = response.notification.request.content.data;
       
       switch (data?.type) {
         case "live":
           onLiveNotification(data.roomId);
           break;
         case "gift":
           onGiftNotification(data.giftId);
           break;
         case "follow":
           onFollowNotification(data.userId);
           break;
       }
     });
   }

  getToken(): string | null {
    return this.expoToken;
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
export default PushNotificationService;