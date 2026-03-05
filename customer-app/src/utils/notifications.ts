import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo && Platform.OS === 'android') {
    console.warn('Push notifications (remote) are not supported in Expo Go on Android SDK 53+. Use a development build.');
    return null;
  }
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    
    // Create a separate channel for image notifications with higher priority
    await Notifications.setNotificationChannelAsync('image-notifications', {
      name: 'Image Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      enableVibrate: true,
      showBadge: true,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData.data;
      } else {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = tokenData.data;
      }
      console.log('Mobile Push Token:', token);
    } catch (e) {
      console.log('Error getting expo token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Send a push notification with image support
 * Supports both iOS and Android with proper image handling
 * 
 * @param expoPushToken - The device push token
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Additional data payload
 * @param imageUrl - Optional image URL to display in notification
 * @param channelId - Optional channel ID (defaults to 'image-notifications' for image notifications)
 */
export async function sendPushNotification(
  expoPushToken: string, 
  title: string, 
  body: string, 
  data: Record<string, any> = {},
  imageUrl?: string,
  channelId?: string
) {
  if (!expoPushToken) return;
  
  // Build the base message
  const message: any = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: {
      ...data,
      // Include image URL in data for app handling
      imageUrl: imageUrl || null,
    },
  };

  // Add image support for iOS (using aps -> data)
  if (Platform.OS === 'ios' && imageUrl) {
    message.aps = {
      'mutable-content': 1,
      alert: {
        title,
        body,
      },
      sound: 'default',
      // iOS 10+ supports attachments in notification
      categoryId: 'IMAGE_NOTIFICATION',
    };
    
    // Add image data for iOS notification service extension
    message.data = {
      ...message.data,
      imageUrl,
      image: imageUrl,
    };
  }

  // Add image support for Android
  if (Platform.OS === 'android' && imageUrl) {
    // Use image-notifications channel for image notifications
    message.channelId = channelId || 'image-notifications';
    
    // Android supports big picture style notifications
    message.android = {
      priority: 'high' as const,
      channelId: channelId || 'image-notifications',
      style: {
        type: 'bigpicture' as const,
        picture: imageUrl,
        contentTitle: title,
        summaryText: body,
        // Large icon for the notification
        largeIcon: imageUrl,
      },
      // Enable expandable notification
      collapsible: true,
      autoCancel: true,
      sticky: false,
      // Custom notification icon
      icon: 'notification_icon',
      imageUrl: imageUrl,
    };
  }

  // Add badge count for iOS
  if (Platform.OS === 'ios') {
    message.aps = {
      ...message.aps,
      badge: 1,
    };
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    if (!response.ok) {
      console.log('Push notification error:', await response.text());
    }
    
    return response;
  } catch (e) {
    console.log('Error sending notification:', e);
    throw e;
  }
}

/**
 * Send notification with type for categorization
 * Automatically selects appropriate icon and handling
 */
export async function sendTypedPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  type: 'order' | 'delivery' | 'payment' | 'promo' | 'flash_sale' | 'like' | 'comment' | 'follow' | 'general',
  additionalData: Record<string, any> = {},
  imageUrl?: string
) {
  // Map notification types to channels and icons
  const typeConfig = {
    order: { channelId: 'order-notifications', icon: 'shopping_bag' },
    delivery: { channelId: 'delivery-notifications', icon: 'local_shipping' },
    payment: { channelId: 'payment-notifications', icon: 'payment' },
    promo: { channelId: 'promo-notifications', icon: 'campaign' },
    flash_sale: { channelId: 'flash-sale-notifications', icon: 'flash_on' },
    like: { channelId: 'social-notifications', icon: 'favorite' },
    comment: { channelId: 'social-notifications', icon: 'comment' },
    follow: { channelId: 'social-notifications', icon: 'person_add' },
    general: { channelId: 'default', icon: 'notifications' },
  };

  const config = typeConfig[type] || typeConfig.general;

  return sendPushNotification(
    expoPushToken,
    title,
    body,
    {
      ...additionalData,
      notificationType: type,
    },
    imageUrl,
    config.channelId
  );
}
