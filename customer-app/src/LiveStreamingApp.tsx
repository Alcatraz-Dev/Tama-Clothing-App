/**
 * LiveStreamingApp - Integration Example
 * Shows how to connect all live streaming screens together
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "./api/firebase";

// Import all screens
import { LiveHomeScreen } from "./screens/LiveHomeScreen";
import { LiveRoomScreen } from "./screens/LiveRoomScreen";
import { VoiceRoomScreen } from "./screens/VoiceRoomScreen";
import { PKBattleScreen } from "./screens/PKBattleScreen";
import { KaraokeScreen } from "./screens/KaraokeScreen";
import { MultiHostScreen } from "./screens/MultiHostScreen";
import { LiveShoppingScreen } from "./screens/LiveShoppingScreen";
import { WalletScreen } from "./screens/WalletScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { AdminScreen } from "./screens/AdminScreen";
import { MainTabBar } from "./components/MainTabBar";

// Demo user data
const DEMO_USER = {
  id: "demo_user_123",
  name: "Demo User",
  email: "demo@example.com",
  avatar: "https://ui-avatars.com/api/?name=Demo+User&background=FF0066&color=fff",
  isHost: true,
  isAdmin: false,
};

type ScreenName = 
  | "home" 
  | "live" 
  | "voice" 
  | "pk" 
  | "karaoke" 
  | "multi" 
  | "shopping" 
  | "wallet" 
  | "profile" 
  | "notifications" 
  | "search" 
  | "admin"
  | "liveRoom";

interface NavigationState {
  screen: ScreenName;
  params?: any;
}

export const LiveStreamingApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(DEMO_USER);
  const [activeTab, setActiveTab] = useState("home");
  const [currentScreen, setCurrentScreen] = useState<NavigationState>({ screen: "home" });
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Demo live room data
  const demoRoom = {
    roomId: "live_demo_123",
    hostId: currentUser.id,
    hostName: currentUser.name,
    hostAvatar: currentUser.avatar,
  };

  const handleTabPress = (tab: string) => {
    if (tab === "live") {
      // Show quick actions for starting different live types
      setShowQuickActions(true);
    } else {
      setActiveTab(tab);
      setCurrentScreen({ screen: tab as ScreenName });
    }
  };

  const navigateToScreen = (screen: ScreenName, params?: any) => {
    setCurrentScreen({ screen, params });
    setShowQuickActions(false);
  };

  const goBack = () => {
    setCurrentScreen({ screen: activeTab as ScreenName });
  };

  // Render the appropriate screen
  const renderScreen = () => {
    const { screen, params } = currentScreen;

    switch (screen) {
      case "home":
        return (
          <LiveHomeScreen
            isHost={currentUser.isHost}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            currentUserAvatar={currentUser.avatar}
          />
        );

      case "liveRoom":
        return (
          <LiveRoomScreen
            roomId={params?.roomId || demoRoom.roomId}
            hostId={params?.hostId || demoRoom.hostId}
            hostName={params?.hostName || demoRoom.hostName}
            hostAvatar={params?.hostAvatar || demoRoom.hostAvatar}
            isHost={params?.isHost || "false"}
          />
        );

      case "voice":
        return (
          <VoiceRoomScreen
            roomId="voice_demo_123"
            hostId={currentUser.id}
            hostName={currentUser.name}
            hostAvatar={currentUser.avatar}
            isHost="true"
            onClose={goBack}
          />
        );

      case "pk":
        return (
          <PKBattleScreen
            roomId="pk_demo_123"
            hostAId={currentUser.id}
            hostAName={currentUser.name}
            hostAAvatar={currentUser.avatar}
            hostBId="opponent_123"
            hostBName="Opponent"
            hostBAvatar="https://ui-avatars.com/api/?name=Opponent&background=00D4FF&color=fff"
            userId={currentUser.id}
            userName={currentUser.name}
            onClose={goBack}
          />
        );

      case "karaoke":
        return (
          <KaraokeScreen
            channelId="karaoke_demo_123"
            hostId={currentUser.id}
            hostName={currentUser.name}
            hostAvatar={currentUser.avatar}
            isHost={true}
            userId={currentUser.id}
            userName={currentUser.name}
            onClose={goBack}
          />
        );

      case "multi":
        return (
          <MultiHostScreen
            channelId="multi_demo_123"
            hostId={currentUser.id}
            hostName={currentUser.name}
            hostAvatar={currentUser.avatar}
            isHost={true}
            userId={currentUser.id}
            userName={currentUser.name}
            onClose={goBack}
          />
        );

      case "shopping":
        return (
          <LiveShoppingScreen
            channelId="shopping_demo_123"
            hostId={currentUser.id}
            isHost={true}
            onClose={goBack}
          />
        );

      case "wallet":
        return <WalletScreen userId={currentUser.id} />;

      case "profile":
        return <ProfileScreen userId={currentUser.id} isOwnProfile={true} />;

      case "notifications":
        return <NotificationsScreen />;

       case "search":
         return (
           <SearchScreen
             onSelectUser={(userId: string) => console.log("Selected user:", userId)}
             onSelectRoom={(roomId: string) => navigateToScreen("liveRoom", { roomId, isHost: "false" })}
           />
         );

      case "admin":
        return currentUser.isAdmin ? (
          <AdminScreen adminId={currentUser.id} />
        ) : (
          <View style={styles.accessDenied}>
            <Text style={styles.accessDeniedText}>Admin access required</Text>
          </View>
        );

      default:
        return (
          <LiveHomeScreen
            isHost={currentUser.isHost}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            currentUserAvatar={currentUser.avatar}
          />
        );
    }
  };

  // If we're on a full-screen page (not tab-based), don't show tab bar
  const showTabBar = !["liveRoom", "voice", "pk", "karaoke", "multi", "shopping"].includes(currentScreen.screen);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {showTabBar && (
        <MainTabBar
          activeTab={activeTab}
          onTabPress={handleTabPress}
          isHost={currentUser.isHost}
        />
      )}

      {/* Quick Actions Menu */}
      {showQuickActions && (
        <View style={styles.quickActionsOverlay}>
          <TouchableOpacity 
            style={styles.quickActionsBackdrop}
            onPress={() => setShowQuickActions(false)}
          />
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Start Live</Text>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigateToScreen("liveRoom", { 
                ...demoRoom, 
                isHost: "true" 
              })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: "#FF0066" }]}>
                <Text style={styles.quickActionEmoji}>🎥</Text>
              </View>
              <View style={styles.quickActionInfo}>
                <Text style={styles.quickActionTitle}>Video Live</Text>
                <Text style={styles.quickActionDesc}>Start a video broadcast</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigateToScreen("voice")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: "#00D4FF" }]}>
                <Text style={styles.quickActionEmoji}>🎙️</Text>
              </View>
              <View style={styles.quickActionInfo}>
                <Text style={styles.quickActionTitle}>Voice Room</Text>
                <Text style={styles.quickActionDesc}>Audio-only conversation</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigateToScreen("karaoke")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: "#9B59B6" }]}>
                <Text style={styles.quickActionEmoji}>🎤</Text>
              </View>
              <View style={styles.quickActionInfo}>
                <Text style={styles.quickActionTitle}>Karaoke</Text>
                <Text style={styles.quickActionDesc}>Sing with lyrics</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigateToScreen("pk")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: "#FFD700" }]}>
                <Text style={styles.quickActionEmoji}>⚔️</Text>
              </View>
              <View style={styles.quickActionInfo}>
                <Text style={styles.quickActionTitle}>PK Battle</Text>
                <Text style={styles.quickActionDesc}>Compete with another host</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigateToScreen("multi")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: "#2ECC71" }]}>
                <Text style={styles.quickActionEmoji}>👥</Text>
              </View>
              <View style={styles.quickActionInfo}>
                <Text style={styles.quickActionTitle}>Multi-Host</Text>
                <Text style={styles.quickActionDesc}>Multiple streamers</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    flex: 1,
  },
  accessDenied: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  accessDeniedText: {
    color: "#666",
    fontSize: 16,
  },
  quickActionsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  quickActionsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  quickActionsContainer: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  quickActionsTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionInfo: {
    marginLeft: 16,
    flex: 1,
  },
  quickActionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  quickActionDesc: {
    color: "#666",
    fontSize: 13,
    marginTop: 2,
  },
});

export default LiveStreamingApp;