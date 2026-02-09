# Live Stream Complete Implementation Guide

## ✅ Completed Features

### 1. **Live Analytics Screen** 📊
**Location**: `/src/screens/LiveAnalyticsScreen.tsx`

**Features**:
- Total views, sales, revenue, and average duration stats
- Grid of replay videos with thumbnails
- Click to watch any replay
- Bilingual support (French/Arabic)
- Dark/Light theme support

**Access**: For brand owners and admin users only

---

### 2. **Settings Icon for Manager Management** ⚙️
**Location**: `LiveStreamScreen.tsx` (line 598-608)

**Features**:
- Settings icon visible only to live host
- Opens manager management modal
- Add/remove moderators during live stream

**Status**: Icon added, modal implementation needed (see below)

---

## 🔧 Remaining Implementation Tasks

### Task 1: Complete Manager Management Modal

Add this modal to `LiveStreamScreen.tsx` after the Coupon Modal (around line 830):

```tsx
{/* Manager Management Modal */}
<Modal visible={showManagerModal} transparent animationType="slide" onRequestClose={() => setShowManagerModal(false)}>
    <View style={styles.modalOverlay}>
        <BlurView intensity={100} tint="dark" style={styles.couponModalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>MANAGE TEAM</Text>
                <TouchableOpacity onPress={() => setShowManagerModal(false)} style={styles.closeModalBtn}>
                    <X color="#FFF" size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Search User */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: '#999', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                        ADD MODERATOR
                    </Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.checkoutInputWithIcon}
                            placeholder="Enter user email"
                            placeholderTextColor="#666"
                            value={searchEmail}
                            onChangeText={setSearchEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.confirmCheckoutBtn, { marginTop: 12 }]}
                        onPress={async () => {
                            // Search and add moderator
                            try {
                                const { collection, query, where, getDocs } = require('firebase/firestore');
                                const { db } = require('../api/firebase');
                                const q = query(collection(db, 'users'), where('email', '==', searchEmail.trim()));
                                const snapshot = await getDocs(q);
                                
                                if (!snapshot.empty) {
                                    const userData = snapshot.docs[0];
                                    await LiveSessionService.addModerator(channelId, userData.id);
                                    Alert.alert('Success', `${userData.data().name} added as moderator`);
                                    setSearchEmail('');
                                } else {
                                    Alert.alert('Error', 'User not found');
                                }
                            } catch (error) {
                                console.error(error);
                                Alert.alert('Error', 'Failed to add moderator');
                            }
                        }}
                    >
                        <UserPlus size={18} color="#FFF" />
                        <Text style={styles.confirmCheckoutText}>ADD MODERATOR</Text>
                    </TouchableOpacity>
                </View>

                {/* Current Moderators */}
                <View>
                    <Text style={{ color: '#999', fontSize: 12, fontWeight: '600', marginBottom: 12 }}>
                        CURRENT MODERATORS ({sessionData?.moderatorIds?.length || 0})
                    </Text>
                    {sessionData?.moderatorIds?.map((modId) => (
                        <View key={modId} style={[styles.replayCard, { marginBottom: 8, padding: 12 }]}>
                            <Shield size={20} color="#FFD700" />
                            <Text style={{ color: '#FFF', flex: 1, marginLeft: 12, fontWeight: '600' }}>
                                Moderator {modId.substring(0, 8)}
                            </Text>
                            <TouchableOpacity
                                onPress={async () => {
                                    await LiveSessionService.removeModerator(channelId, modId);
                                    Alert.alert('Success', 'Moderator removed');
                                }}
                            >
                                <UserMinus size={20} color="#E63946" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </BlurView>
    </View>
</Modal>
```

---

### Task 2: Add Live Analytics Tab to Profile/Admin

**In `App.tsx`, add new tab for brand owners/admins:**

1. Add state for the new tab:
```tsx
const [showLiveAnalytics, setShowLiveAnalytics] = useState(false);
```

2. Add menu item in ProfileScreen (around line 2465):
```tsx
{isBrandOwner && (
    <TouchableOpacity 
        style={[styles.menuRow, { paddingVertical: 18, borderBottomColor: colors.border }]} 
        onPress={() => onNavigate('LiveAnalytics')}
    >
        <View style={styles.menuRowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#17171F' : '#F9F9FB' }]}>
                <TrendingUp size={20} color={colors.foreground} strokeWidth={2} />
            </View>
            <Text style={[styles.menuRowText, { color: colors.foreground }]}>
                {language === 'ar' ? 'تحليلات البث المباشر' : 'Live Analytics'}
            </Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
    </TouchableOpacity>
)}
```

3. Add screen rendering in main App navigation:
```tsx
{activeTab === 'LiveAnalytics' && profileData?.brandId && (
    <LiveAnalyticsScreen
        brandId={profileData.brandId}
        onBack={() => setActiveTab('Profile')}
        onNavigate={handleNavigate}
        theme={theme}
        language={language}
    />
)}
```

4. Import the screen:
```tsx
import LiveAnalyticsScreen from './src/screens/LiveAnalyticsScreen';
```

---

### Task 3: Add Replays to CollaborationDetailScreen

**In `CollaborationDetailScreen.tsx`:**

1. Add state for replays:
```tsx
const [replays, setReplays] = useState<any[]>([]);
const [loadingReplays, setLoadingReplays] = useState(true);
```

2. Fetch replays in useEffect:
```tsx
useEffect(() => {
    if (collab?.id) {
        fetchReplays();
    }
}, [collab]);

const fetchReplays = async () => {
    try {
        const { LiveSessionService } = require('../services/LiveSessionService');
        const replayList = await LiveSessionService.getReplays(collab.id);
        setReplays(replayList);
    } catch (error) {
        console.error('Error fetching replays:', error);
    } finally {
        setLoadingReplays(false);
    }
};
```

3. Add Replays Section (after the products section):
```tsx
{/* Live Replays Section */}
{replays.length > 0 && (
    <View style={{ marginTop: 30 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {language === 'ar' ? 'إعادات البث المباشر' : 'LIVE REPLAYS'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {replays.map((replay) => (
                <TouchableOpacity
                    key={replay.id}
                    style={{
                        width: 200,
                        borderRadius: 12,
                        overflow: 'hidden',
                        backgroundColor: colors.cardBg,
                        borderWidth: 1,
                        borderColor: colors.border
                    }}
                    onPress={() => onNavigate('LiveStream', {
                        channelId: replay.channelId,
                        isReplay: true,
                        replayUrl: replay.recordingUrl
                    })}
                >
                    <View style={{ width: '100%', height: 120, position: 'relative' }}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400' }}
                            style={{ width: '100%', height: '100%' }}
                        />
                        <View style={{
                            ...StyleSheet.absoluteFillObject,
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Play size={40} color="#FFF" fill="#FFF" />
                        </View>
                        <View style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            backgroundColor: '#E63946',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4
                        }}>
                            <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900' }}>REPLAY</Text>
                        </View>
                    </View>
                    <View style={{ padding: 12 }}>
                        <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                            {replay.hostName || 'Live Session'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
                            <Eye size={12} color={colors.textMuted} />
                            <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                                {replay.viewCount || 0} views
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    </View>
)}
```

4. Add imports:
```tsx
import { Play, Eye } from 'lucide-react-native';
```

---

### Task 4: Complete Replay Logic in LiveStreamScreen

The replay logic is already partially implemented. To complete it:

1. **Ensure replay URL is passed correctly** when navigating to LiveStream
2. **Video component** already handles replay (line 545-560)
3. **Timeline sync** for pinned products is implemented (line 349-370)

**Test the replay by**:
1. Ending a live stream (saves recording URL)
2. Navigating to LiveAnalytics or CollaborationDetail
3. Clicking a replay video
4. Verifying video playback and pinned product timeline sync

---

## 📋 Implementation Checklist

- [x] Create LiveAnalyticsScreen.tsx
- [x] Add Settings icon to LiveStreamScreen
- [ ] Add Manager Management Modal to LiveStreamScreen
- [ ] Add LiveAnalytics tab to Profile (for brand owners)
- [ ] Add Replays section to CollaborationDetailScreen
- [ ] Test replay functionality end-to-end
- [ ] Add TrendingUp icon import to App.tsx
- [ ] Test manager add/remove functionality

---

## 🎯 User Roles & Access

| Feature | Viewer | Moderator | Host | Brand Owner | Admin |
|---------|--------|-----------|------|-------------|-------|
| Watch Live | ✅ | ✅ | ✅ | ✅ | ✅ |
| Watch Replay | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add Moderators | ❌ | ❌ | ✅ | ✅ | ✅ |
| View Analytics | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Products | ❌ | ✅ | ✅ | ✅ | ✅ |
| End Live | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 🚀 Next Steps

1. **Copy the Manager Modal code** into LiveStreamScreen.tsx
2. **Add LiveAnalytics navigation** to App.tsx ProfileScreen
3. **Add Replays section** to CollaborationDetailScreen
4. **Test all features** thoroughly
5. **Add proper error handling** for all async operations

All the code snippets are ready to copy-paste into the respective files!
