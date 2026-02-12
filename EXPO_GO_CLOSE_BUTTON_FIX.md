# Expo Go Close Button Session Cleanup

## Enhancement

Added proper session cleanup when clicking the "Close" button in the Expo Go error screen for both Host and Audience live screens.

## Why This Matters

Even though we prevent session creation in Expo Go (from the previous fix), there could be edge cases where:
1. A session was created before the check runs
2. The user navigates to the live screen multiple times
3. Network delays cause timing issues

This enhancement ensures that clicking "Close" in the Expo Go error screen **always** cleans up any potential session state.

## Changes Made

### 1. HostLiveScreen - End Session on Close

**File**: `HostLiveScreen.tsx`

**Before**:
```typescript
<TouchableOpacity onPress={onClose}>
    <Text>Close</Text>
</TouchableOpacity>
```

**After**:
```typescript
<TouchableOpacity
    onPress={() => {
        // ✅ End any potential session before closing (safety measure)
        console.log('🎬 Expo Go: Ending session before close');
        endFirestoreSession();
        onClose();
    }}
>
    <Text>Close</Text>
</TouchableOpacity>
```

**What it does**:
- Calls `endFirestoreSession()` to mark any session as 'ended'
- Then closes the screen with `onClose()`
- Ensures no stale "live" sessions remain

### 2. AudienceLiveScreen - Leave Session on Close

**File**: `AudienceLiveScreen.tsx`

**Before**:
```typescript
<TouchableOpacity onPress={onClose}>
    <Text>Close</Text>
</TouchableOpacity>
```

**After**:
```typescript
<TouchableOpacity
    onPress={async () => {
        // ✅ Leave session before closing (decrement view count)
        console.log('🎬 Expo Go: Leaving session before close');
        try {
            await LiveSessionService.leaveSession(channelId);
        } catch (error) {
            console.error('Error leaving session:', error);
        }
        onClose();
    }}
>
    <Text>Close</Text>
</TouchableOpacity>
```

**What it does**:
- Calls `LiveSessionService.leaveSession()` to decrement view count
- Handles any errors gracefully
- Then closes the screen with `onClose()`
- Ensures accurate viewer counts

## How It Works

### Host Flow in Expo Go
1. User clicks "START LIVE" on collaboration
2. `HostLiveScreen` mounts
3. Check: ZEGO not available → shows error screen
4. **User clicks "Close"**:
   - ✅ Calls `endFirestoreSession()` (safety cleanup)
   - ✅ Calls `onClose()` (returns to collaboration)
5. Result: No stale session, collaboration not marked as live

### Audience Flow in Expo Go
1. User clicks "JOIN LIVE" on active stream
2. `AudienceLiveScreen` mounts
3. `joinSession()` called (increments view count)
4. Check: ZEGO not available → shows error screen
5. **User clicks "Close"**:
   - ✅ Calls `leaveSession()` (decrements view count)
   - ✅ Calls `onClose()` (returns to previous screen)
6. Result: View count accurate, no ghost viewers

## Benefits

✅ **Double safety** - Even if session creation check fails, cleanup still happens
✅ **Accurate metrics** - View counts remain accurate even in Expo Go
✅ **No ghost sessions** - Host sessions are always properly ended
✅ **No ghost viewers** - Audience properly leaves sessions
✅ **Better UX** - Users can safely test in Expo Go without side effects

## Testing

### Test Host Close in Expo Go
1. Open app in Expo Go
2. Navigate to collaboration (as owner/admin)
3. Click "START LIVE"
4. Verify: Error screen shows
5. **Click "Close"**
6. Check Firestore `Live_sessions`:
   - ✅ No session with this channelId, OR
   - ✅ Session exists but `status: 'ended'`
7. Check collaboration screen:
   - ✅ Does NOT show "EN DIRECT"

### Test Audience Close in Expo Go
1. Create a live session (using dev build or another device)
2. Open app in Expo Go on test device
3. Navigate to the live collaboration
4. Click "JOIN LIVE"
5. Verify: Error screen shows
6. Note the view count before clicking close
7. **Click "Close"**
8. Check Firestore session:
   - ✅ View count decremented by 1
9. Check collaboration screen:
   - ✅ Still shows "EN DIRECT" (session is still active from real host)

## Files Modified

1. **`HostLiveScreen.tsx`**
   - Updated Expo Go error screen Close button
   - Calls `endFirestoreSession()` before closing

2. **`AudienceLiveScreen.tsx`**
   - Updated Expo Go error screen Close button
   - Calls `leaveSession()` before closing

## Complete Protection Stack

With all fixes combined, we now have **4 layers of protection**:

### Layer 1: Prevention
- Don't create session if ZEGO unavailable (previous fix)

### Layer 2: Expo Go Cleanup
- End/leave session when clicking Close in error screen (this fix)

### Layer 3: Component Lifecycle
- Cleanup on unmount, AppState changes, page unload

### Layer 4: Heartbeat Monitoring
- Track session activity for potential auto-cleanup

This ensures live sessions are **always** properly managed! 🎉
