#!/bin/bash

# Expo Development Build Script for Live Streaming with Agora
# This script sets up and runs the development build for real device testing

echo "==================================="
echo "Tama Clothing - Development Build"
echo "==================================="
echo ""

# Check if running on macOS (for iOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected macOS - iOS development available"
    echo ""
fi

# Step 1: Install dependencies
echo "Step 1: Installing dependencies..."
npm install
echo ""

# Step 2: Generate native code
echo "Step 2: Generating native code (prebuild)..."
npx expo prebuild --clean
echo ""

# Step 3: Build development client
echo "Step 3: Building development client..."
echo "This may take a few minutes on first run..."
npx expo export --platform all
echo ""

# Step 4: Start development server
echo "Step 4: Starting development server..."
echo ""
echo "Options:"
echo "1. Run on iOS simulator"
echo "2. Run on Android emulator"
echo "3. Build for device (creates .ipa/.apk)"
echo "4. Just start server for existing build"
echo ""

read -p "Select an option (1-4): " option

case $option in
    1)
        echo "Starting iOS simulator..."
        npx expo start --ios
        ;;
    2)
        echo "Starting Android emulator..."
        npx expo start --android
        ;;
    3)
        echo "Building for devices..."
        echo "For iOS: npx eas build --platform ios --profile development"
        echo "For Android: npx eas build --platform android --profile development"
        ;;
    4)
        echo "Starting development server..."
        npx expo start --dev-client
        ;;
    *)
        echo "Invalid option. Starting development server..."
        npx expo start --dev-client
        ;;
esac
