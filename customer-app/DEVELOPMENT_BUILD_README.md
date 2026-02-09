# Development Build for Live Streaming with Agora

## Problem
Standard **Expo Go** doesn't support packages with native code like `react-native-agora`. You'll see a white screen or the app won't load.

## Solution
Use **Expo Development Build** instead of Expo Go. This creates a custom version of the Expo client with Agora pre-built.

---

## Quick Start (For Real Device Testing)

### Option 1: EAS Build (Recommended for Device Testing)

1. **Install the development build on your device:**
   ```bash
   # iOS (requires Apple Developer account)
   npx eas build --platform ios --profile development

   # Android
   npx eas build --platform android --profile development
   ```

2. **Download and install** the resulting .ipa (iOS) or .apk/.aab (Android) on your device.

3. **Start the development server:**
   ```bash
   npx expo start --dev-client
   ```

4. **Open the development build app** on your device and scan the QR code.

---

### Option 2: Local Prebuild (For iOS Simulator)

If you want to run on iOS Simulator:

```bash
# Generate native code
npx expo prebuild --clean

# Start on iOS simulator
npx expo start --ios
```

---

## EAS Build Setup (One-time)

If you haven't set up EAS Build yet:

```bash
# Login to Expo
eas login

# Configure build
eas build:configure
```

This creates `eas.json` with build profiles.

---

## Current Build Profiles (eas.json)

The app is configured with these profiles:
- **development** - For local development with full debugging
- **preview** - For testing before production
- **production** - For release builds

---

## Troubleshooting

### White Screen on Launch
- Make sure you're using the **Development Build** app, not standard Expo Go
- Check that `expo-dev-client` is installed: `npm list expo-dev-client`

### QR Code Not Working
- Make sure your phone and computer are on the **same WiFi network**
- Try using LAN instead of tunnel: `npx expo start --lan`

### Agora Connection Issues
- Check that camera/microphone permissions are granted
- Verify your AGORA_APP_ID in `src/config/agora.ts`
- Test on simulator first (simulator supports Agora)

---

## Useful Commands

```bash
# Start dev server with development client
npx expo start --dev-client

# Build for iOS device
npx eas build --platform ios --profile development

# Build for Android device
npx eas build --platform android --profile development

# Clear cache and rebuild
npx expo start --clear
```
