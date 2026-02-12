# Expo Go Live Session Bug Fix

## Problem Description

When using Expo Go to test the app, clicking on a collaboration that should start a live stream causes the following issues:

1. **Session Created But Can't Stream**: The Firestore session is created with `status: 'live'`, but ZEGO streaming modules aren't available in Expo Go
2. **Can't End Session**: The "Close" button in the Expo Go error screen only closes the UI but doesn't end the Firestore session
3. **Stale Live Indicators**: The collaboration continues showing as "EN DIRECT" (live) even though no actual stream is running
4. **Stuck in Live State**: The session remains marked as live indefinitely

## Root Cause

The `HostLiveScreen` component was calling `startFirestoreSession()` immediately on mount (line 411), **before** checking if ZEGO modules are available. This meant:

```typescript
useEffect(() => {
    startFirestoreSession(); // ❌ Called even in Expo Go!
    // ... rest of code
}, []);

// Later in the component...
if (!ZegoUIKitPrebuiltLiveStreaming) {
    return <ExpoGoErrorScreen />; // ⚠️ Too late, session already created!
}
```

## Solution Implemented

### 1. Check ZEGO Availability Before Starting Session

Modified the auto-start useEffect to check if ZEGO modules are available before creating the session:

```typescript
useEffect(() => {
    // ✅ CRITICAL: Don't start session if ZEGO modules aren't available (Expo Go)
    if (!ZegoUIKitPrebuiltLiveStreaming) {
        console.log('⚠️ ZEGO modules not available - skipping session start');
        return; // Exit early, don't create session
    }

    console.log('🚀 HostLiveScreen mounted, auto-starting session...');
    startFirestoreSession(); // ✅ Only called if ZEGO is available
    
    // ... rest of code
}, []);
```

### 2. Existing Cleanup Mechanisms Still Apply

The cleanup mechanisms we added in the previous fix still work:

- **Component unmount**: Ends session when navigating away
- **AppState changes**: Ends session when app goes to background (mobile)
- **Page unload**: Ends session when page is refreshed/closed (web)
- **Heartbeat**: Tracks session activity for potential auto-cleanup

## How It Works Now

### Expo Go Flow (Fixed)
1. User clicks on collaboration to start live
2. `HostLiveScreen` component mounts
3. useEffect checks: `if (!ZegoUIKitPrebuiltLiveStreaming)` → **true** (not available in Expo Go)
4. Returns early, **no session created** ✅
5. Component renders Expo Go error screen
6. User clicks "Close" → component unmounts → no cleanup needed (no session was created)

### Development Build / Production Flow (Unchanged)
1. User clicks on collaboration to start live
2. `HostLiveScreen` component mounts
3. useEffect checks: `if (!ZegoUIKitPrebuiltLiveStreaming)` → **false** (available in dev build)
4. Continues to create session ✅
5. Component renders ZEGO live streaming UI
6. User ends stream or closes app → cleanup mechanisms end the session

## Files Modified

**`/Users/haythem_dhahri/Desktop/projects/website/TamaClothing/customer-app/src/screens/HostLiveScreen.tsx`**

- Added ZEGO availability check before starting session (line 410-414)
- Prevents session creation in Expo Go environment

## Testing

### Test in Expo Go
1. ✅ Open app in Expo Go
2. ✅ Navigate to a collaboration
3. ✅ Click "START LIVE" button
4. ✅ Verify: Error screen shows "Live Streaming Unavailable"
5. ✅ Click "Close"
6. ✅ Verify: Collaboration does NOT show as "EN DIRECT"
7. ✅ Verify: No session created in Firestore `Live_sessions` collection

### Test in Development Build
1. ✅ Open app in development build
2. ✅ Navigate to a collaboration
3. ✅ Click "START LIVE" button
4. ✅ Verify: Live streaming starts successfully
5. ✅ Verify: Collaboration shows as "EN DIRECT"
6. ✅ End stream or close app
7. ✅ Verify: Session status changes to 'ended' in Firestore
8. ✅ Verify: Collaboration no longer shows as "EN DIRECT"

## Cleanup for Existing Stale Sessions

If there are existing stale sessions from before this fix, you can clean them up using one of these methods:

### Option 1: Manual Cleanup (Firebase Console)
1. Go to Firebase Console → Firestore Database
2. Navigate to `Live_sessions` collection
3. Find sessions with `status: 'live'` but old `lastHeartbeat` timestamps
4. Delete or update them to `status: 'ended'`

### Option 2: Automatic Cleanup (Cloud Function - Future Enhancement)
Create a Cloud Function that runs periodically to clean up stale sessions:

```typescript
// Example Cloud Function (not implemented yet)
export const cleanupStaleSessions = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async (context) => {
        const now = admin.firestore.Timestamp.now();
        const staleThreshold = 30; // seconds
        
        const staleSessions = await admin.firestore()
            .collection('Live_sessions')
            .where('status', '==', 'live')
            .where('lastHeartbeat', '<', new Date(now.toMillis() - (staleThreshold * 1000)))
            .get();
        
        const batch = admin.firestore().batch();
        staleSessions.docs.forEach(doc => {
            batch.update(doc.ref, {
                status: 'ended',
                endedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        console.log(`Cleaned up ${staleSessions.size} stale sessions`);
    });
```

## Benefits

✅ **No stale sessions in Expo Go** - Sessions are never created if streaming isn't available
✅ **Clear error messaging** - Users see why live streaming isn't available
✅ **Proper cleanup** - All cleanup mechanisms still work for actual live sessions
✅ **Better developer experience** - Can test other features in Expo Go without creating ghost sessions
✅ **Production-ready** - Development builds and production apps work perfectly

## Related Fixes

This fix builds on the previous cleanup fix that added:
- Component unmount cleanup
- AppState monitoring
- Page unload handlers
- Heartbeat system

Together, these ensure that live sessions are always properly managed, whether in Expo Go, development builds, or production.
