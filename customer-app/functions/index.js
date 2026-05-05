/**
 * Firebase Cloud Functions for Live Streaming Platform
 * 
 * Deploy with: firebase deploy --only functions
 * 
 * Functions:
 * - processGiftTransaction: Split gifts 70% host / 30% platform
 * - createLiveRoom: Create and manage live room
 * - endLiveSession: Process session end, calculate earnings
 * - processPayment: Handle Stripe payments
 * - sendPushNotification: Push notification dispatch
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe?.secret || "sk_test_xxx");

admin.initializeApp();

// === CONSTANTS ===
const HOST_SHARE = 0.70; // 70% to host
const PLATFORM_SHARE = 0.30; // 30% to platform
const DIAMOND_TO_COIN_RATE = 10; // 1 diamond = 10 coins

// === GIFT PROCESSING ===
/**
 * Process gift transaction with revenue sharing
 * Triggered when a gift is sent in a live room
 */
exports.processGiftTransaction = functions.firestore
  .document("live_rooms/{roomId}/gifts/{giftId}")
  .onCreate(async (snap, context) => {
    const { roomId, giftId } = context.params;
    const giftData = snap.data();

    const { senderId, receiverId, giftType, quantity, totalValue } = giftData;

    console.log(`Processing gift ${giftId}: ${giftType}x${quantity} = ${totalValue} diamonds`);

    try {
      // Get room info to verify host
      const roomDoc = await admin.firestore().collection("live_rooms").doc(roomId).get();
      if (!roomDoc.exists) {
        console.error("Room not found:", roomId);
        return;
      }

      const roomData = roomDoc.data();

      // Calculate revenue split
      const hostEarnings = Math.floor(totalValue * HOST_SHARE);
      const platformEarnings = Math.floor(totalValue * PLATFORM_SHARE);

      // Convert to coins (1 diamond = 10 coins)
      const hostCoins = hostEarnings * DIAMOND_TO_COIN_RATE;

      // Update host's wallet (diamonds -> coins for withdrawal)
      const hostRef = admin.firestore().collection("users").doc(receiverId);
      await hostRef.update({
        "wallet.diamonds": admin.firestore.FieldValue.increment(hostEarnings),
        "wallet.totalEarnings": admin.firestore.FieldValue.increment(hostEarnings),
        "wallet.lastGiftTime": admin.firestore.FieldValue.serverTimestamp(),
      });

      // Record transaction
      await admin.firestore()
        .collection("users")
        .doc(receiverId)
        .collection("transactions")
        .add({
          type: "gift_received",
          amountDiamonds: hostEarnings,
          amount: totalValue,
          description: `Received ${quantity}x ${giftType} from ${senderId}`,
          senderId,
          roomId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: "completed",
          giftId,
        });

      // Update sender's coin balance
      await admin.firestore()
        .collection("users")
        .doc(senderId)
        .update({
          "wallet.coins": admin.firestore.FieldValue.increment(-totalValue),
        });

      // Update room analytics
      await admin.firestore()
        .collection("live_rooms")
        .doc(roomId)
        .update({
          "analytics.totalGifts": admin.firestore.FieldValue.increment(totalValue),
          "analytics.giftCount": admin.firestore.FieldValue.increment(quantity),
          "lastGiftAt": admin.firestore.FieldValue.serverTimestamp(),
        });

      // Send notification to host
      if (senderId !== receiverId) {
        await sendPushNotification(receiverId, {
          title: "🎁 New Gift!",
          body: `You received ${quantity}x ${giftType}!`,
          data: { type: "gift", roomId, giftId },
        });
      }

      console.log(`Gift processed: Host +${hostEarnings}d, Platform +${platformEarnings}d`);
      return { success: true, hostEarnings, platformEarnings };
    } catch (error) {
      console.error("Error processing gift:", error);
      return { success: false, error: error.message };
    }
  });

// === LIVE ROOM MANAGEMENT ===
/**
 * Create a new live room
 */
exports.createLiveRoom = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { roomType, title, category } = data;
  const userId = context.auth.uid;

  try {
    // Get user info
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Create room
    const roomRef = admin.firestore().collection("live_rooms").doc();
    const roomId = roomRef.id;

    const roomData = {
      id: roomId,
      hostId: userId,
      hostName: userData?.displayName || "Unknown",
      hostAvatar: userData?.avatar || "",
      title: title || `${userData?.displayName}'s Live`,
      category: category || "General",
      roomType: roomType || "video", // video, voice, karaoke, pk, multi
      status: "live",
      viewerCount: 0,
      likeCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      analytics: {
        totalGifts: 0,
        giftCount: 0,
        peakViewers: 0,
        duration: 0,
      },
      settings: {
        allowGift: true,
        allowChat: true,
        allowPk: roomType === "pk",
        maxGuests: roomType === "multi" ? 9 : 0,
      },
    };

    await roomRef.set(roomData);

    // Update user's live status
    await admin.firestore()
      .collection("users")
      .doc(userId)
      .update({
        isLive: true,
        currentRoomId: roomId,
        lastLiveAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log(`Room created: ${roomId} by ${userId}`);
    return { success: true, roomId, roomData };
  } catch (error) {
    console.error("Error creating room:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * End live session and calculate earnings
 */
exports.endLiveSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { roomId } = data;
  const userId = context.auth.uid;

  try {
    const roomRef = admin.firestore().collection("live_rooms").doc(roomId);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Room not found");
    }

    const roomData = roomDoc.data();
    const duration = Math.floor(
      (Date.now() - roomData.startedAt.toMillis()) / 1000
    );

    // Calculate earnings
    const totalGifts = roomData.analytics?.totalGifts || 0;
    const earnings = Math.floor(totalGifts * HOST_SHARE);

    // Update room status
    await roomRef.update({
      status: "ended",
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
      duration,
      "analytics.duration": duration,
    });

    // Update user status
    await admin.firestore()
      .collection("users")
      .doc(userId)
      .update({
        isLive: false,
        currentRoomId: null,
        "stats.totalLiveTime": admin.firestore.FieldValue.increment(duration),
        "stats.totalEarnings": admin.firestore.FieldValue.increment(earnings),
      });

    // Store session for replay (if recording enabled)
    if (roomData.recordingUrl) {
      await admin.firestore()
        .collection("users")
        .doc(userId)
        .collection("recordings")
        .add({
          roomId,
          duration,
          views: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    console.log(`Session ended: ${roomId}, Duration: ${duration}s, Earnings: ${earnings}`);
    return { success: true, duration, earnings };
  } catch (error) {
    console.error("Error ending session:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// === PAYMENT PROCESSING ===
/**
 * Process Stripe payment for coin recharge
 */
exports.processPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { amount, paymentMethodId, coinPackage } = data;
  const userId = context.auth.uid;

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe uses cents
      currency: "usd",
      customer: userId,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    if (paymentIntent.status !== "succeeded") {
      return { success: false, status: paymentIntent.status };
    }

    // Calculate coins (with bonus)
    const bonus = coinPackage?.bonus || 0;
    const totalCoins = coinPackage.coins + bonus;

    // Update user's wallet
    await admin.firestore()
      .collection("users")
      .doc(userId)
      .update({
        "wallet.coins": admin.firestore.FieldValue.increment(totalCoins),
        "wallet.totalRecharged": admin.firestore.FieldValue.increment(amount),
      });

    // Record transaction
    await admin.firestore()
      .collection("users")
      .doc(userId)
      .collection("transactions")
      .add({
        type: "recharge",
        amountCoins: totalCoins,
        amount,
        bonus,
        description: `Recharged ${totalCoins} coins (${coinPackage?.name || "Custom"})`,
        paymentId: paymentIntent.id,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: "completed",
      });

    console.log(`Payment processed: ${userId}, ${amount}USD -> ${totalCoins} coins`);
    return { success: true, coins: totalCoins };
  } catch (error) {
    console.error("Payment error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// === PUSH NOTIFICATIONS ===
/**
 * Send push notification helper
 */
async function sendPushNotification(userId, payload) {
  try {
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.fcmToken) return;

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      token: userData.fcmToken,
    };

    await admin.messaging().send(message);
    console.log("Notification sent to:", userId);
    return true;
  } catch (error) {
    console.error("Notification error:", error);
    return false;
  }
}

/**
 * Register FCM token
 */
exports.registerFcmToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { token } = data;
  const userId = context.auth.uid;

  await admin.firestore()
    .collection("users")
    .doc(userId)
    .update({
      fcmToken: token,
      notificationSettings: {
        liveAlerts: true,
        giftNotifications: true,
        followerNotifications: true,
      },
    });

  return { success: true };
});

/**
 * Notify followers when user goes live
 */
exports.notifyFollowersLive = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { roomId, title } = data;
  const userId = context.auth.uid;

  try {
    // Get user's followers
    const followersSnapshot = await admin.firestore()
      .collection("users")
      .doc(userId)
      .collection("followers")
      .limit(100) // Batch limit
      .get();

    const notifications = followersSnapshot.docs.map(async (doc) => {
      const followerId = doc.id;
      const followerData = doc.data();

      // Create in-app notification
      await admin.firestore()
        .collection("users")
        .doc(followerId)
        .collection("notifications")
        .add({
          type: "live",
          title: "Your favorite is live!",
          body: `${context.auth.token?.name || "Someone"} started a live stream`,
          data: { roomId, userId },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Send push notification
      if (followerData.fcmToken && followerData.notificationSettings?.liveAlerts !== false) {
        await sendPushNotification(followerId, {
          title: "🔴 Live!",
          body: `${context.auth.token?.name || "Someone"} is now live`,
          data: { type: "live", roomId },
        });
      }
    });

    await Promise.all(notifications);
    return { success: true, count: followersSnapshot.size };
  } catch (error) {
    console.error("Notification error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// === ANALYTICS ===
/**
 * Update viewer count (called from client)
 */
exports.updateViewerCount = functions.https.onCall(async (data, context) => {
  const { roomId, delta } = data;

  await admin.firestore()
    .collection("live_rooms")
    .doc(roomId)
    .update({
      viewerCount: admin.firestore.FieldValue.increment(delta),
    });

  return { success: true };
});

/**
 * Scheduled: Clean up old live rooms
 */
exports.cleanupOldRooms = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    const cutoff = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days
    );

    const oldRooms = await admin.firestore()
      .collection("live_rooms")
      .where("endedAt", "<", cutoff)
      .get();

    const batch = admin.firestore().batch();
    oldRooms.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${oldRooms.size} old rooms`);
    return null;
  });

module.exports = {
  processGiftTransaction,
  createLiveRoom,
  endLiveSession,
  processPayment,
  registerFcmToken,
  notifyFollowersLive,
  updateViewerCount,
  cleanupOldRooms,
};