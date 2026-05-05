/**
 * MainTabBar - Bottom tab navigation for live streaming app
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  Home,
  Search,
  Video,
  Bell,
  User,
  Plus,
  Wallet,
  ShoppingBag,
  Mic,
  Music,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TabItem {
  key: string;
  label: string;
  icon: any;
  activeIcon?: any;
}

interface MainTabBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  isHost?: boolean;
}

export const MainTabBar: React.FC<MainTabBarProps> = ({
  activeTab,
  onTabPress,
  isHost = false,
}) => {
  const tabs: TabItem[] = [
    { key: "home", label: "Home", icon: Home },
    { key: "search", label: "Search", icon: Search },
    { key: "live", label: "Go Live", icon: Plus, activeIcon: Video },
    { key: "wallet", label: "Wallet", icon: Wallet },
    { key: "profile", label: "Profile", icon: User },
  ];

  // Insert notifications tab after live for audience
  if (!isHost) {
    tabs.splice(4, 0, { key: "notifications", label: "Alerts", icon: Bell });
  }

  return (
    <BlurView intensity={90} tint="dark" style={styles.container}>
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isLiveTab = tab.key === "live";

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isLiveTab && styles.liveTab,
                isActive && styles.activeTab,
              ]}
              onPress={() => onTabPress(tab.key)}
            >
              {isLiveTab ? (
                <View style={styles.liveButton}>
                  <Video size={20} color="#fff" fill="#fff" />
                </View>
              ) : (
                <tab.icon
                  size={22}
                  color={isActive ? "#FF0066" : "#666"}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              )}
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.activeLabel,
                  isLiveTab && styles.liveLabel,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
};

// Quick Actions Floating Menu
interface QuickActionsMenuProps {
  visible: boolean;
  onClose: () => void;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  visible,
  onClose,
}) => {
  if (!visible) return null;

  const actions = [
    { key: "video", label: "Video Live", icon: Video, color: "#FF0066" },
    { key: "voice", label: "Voice Room", icon: Mic, color: "#00D4FF" },
    { key: "shopping", label: "Live Shop", icon: ShoppingBag, color: "#FFD700" },
    { key: "karaoke", label: "Karaoke", icon: Music, color: "#9B59B6" },
  ];

  return (
    <TouchableOpacity 
      style={styles.menuOverlay} 
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={styles.menuContainer}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Start a Live</Text>
        </View>
        {actions.map((action) => (
          <TouchableOpacity 
            key={action.key}
            style={styles.menuItem}
            onPress={() => {
              onClose();
              // Navigate to selected type
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: action.color }]}>
              <action.icon size={20} color="#fff" />
            </View>
            <Text style={styles.menuItemText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tab: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "rgba(255, 0, 102, 0.1)",
  },
  liveTab: {
    transform: [{ translateY: -15 }],
  },
  liveButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FF0066",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF0066",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabel: {
    color: "#666",
    fontSize: 10,
    marginTop: 4,
  },
  activeLabel: {
    color: "#FF0066",
  },
  liveLabel: {
    color: "#fff",
    fontWeight: "600",
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  menuHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  menuTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuItemText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default MainTabBar;