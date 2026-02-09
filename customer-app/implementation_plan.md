# Integrated Live Commerce Implementation Plan

## 1. Technical Engine (Infrastructure)
### Video Streaming (Agora)
- [x] Install `react-native-agora` and `agora-react-native-rtm`.
- [ ] Initialize Agora Engine in `LiveStreamScreen`.
- [ ] Implement `joinChannel`, `leaveChannel`, and event listeners.
- [ ] Configure permissions (Camera, Microphone) using `expo-av` / `expo-camera` permissions flow.

### Database (Firebase Firestore)
- [ ] Verify `Live_sessions` collection data structure.
- [ ] Verify `Live_events` sub-collection for comments/interactions.
- [ ] Implement `LiveSessionService` for fetching and subscribing to session data.

### Storage (Cloudinary)
- [ ] Integrate Cloudinary for product images/videos (if not already).
- [ ] Ensure product data in Firestore includes Cloudinary URLs.

## 2. Data Architecture
### `Live_sessions` Collection
- **Document ID**: `channelId` (or auto-generated)
- **Fields**:
  - `channelId`: string
  - `publisherType`: 'brand' | 'influencer'
  - `identityRing`: boolean (for highlighting profile)
  - `currentProductId`: string (ID of product currently featured)
  - `viewCount`: number
  - `status`: 'live' | 'ended'
  - `products`: Array<{ id: string, cloudinaryUrl: string, ... }>

### `Live_events` Sub-collection
- **Document ID**: Auto-generated
- **Fields**:
  - `type`: 'comment' | 'reaction' | 'purchase'
  - `userId`: string
  - `userName`: string
  - `content`: string (for comments)
  - `timestamp`: serverTimestamp

## 3. User Interface (The Live UI/UX)
- [ ] **LiveStreamScreen**:
  - Full-screen video view (`RtcSurfaceView`).
  - Overlay:
    - Top Left: Live badge, Participant count.
    - Bottom Sheet/List: Pinned Product.
    - Bottom Left: Transparent comment stream.
    - Bottom Right: Floating reaction button (hearts).
- [ ] **Product Layer**:
  - "Smart card" for quick purchase.
  - Integration with Cart (using `CartContext` or similar).

## 4. "Point" Permissions (Killer Features)
- [ ] **Momentary Offers**: Logic to display coupons/alerts based on stream events.
- [ ] **Collaborative Streaming**: (Advanced) Split screen support if requested (start with single stream).

## 5. Management & Protection
- [ ] **Moderation**: Basic keyword filtering in `LiveSessionService` before sending message.
- [ ] **Admin/Seller Dashboard**: Ability to "pin" products (update `currentProductId` in Firestore).

## 6. Implementation Roadmap
1.  **Dependencies**: Install & Configure.
2.  **Service Layer**: Create `LiveSessionService`.
3.  **UI Construction**: Build `LiveStreamScreen` layout.
4.  **Integration**: Connect Agora and Firebase.
5.  **Polishing**: Animations, gradients, "wow" factor.
