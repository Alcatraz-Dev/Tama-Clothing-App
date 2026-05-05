# Agora Video Fix Implementation

## Changes needed:

### 1. AgoraHostLiveScreen - Add proper video rendering
- Load RtcSurfaceView and VideoCanvas
- Create canvas for local video
- Subscribe to remote user changes
- Render RtcSurfaceView for each remote user
- Add debug overlay

### 2. AgoraAudienceScreen - Add video rendering
- Load Agora components
- Track remote users (host)
- Render RtcSurfaceView
