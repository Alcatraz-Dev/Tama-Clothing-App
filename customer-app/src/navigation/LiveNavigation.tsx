/**
 * LiveNavigation - React Navigation setup for live streaming
 * Integrates with existing app navigation
 */
import React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useColorScheme } from "react-native";

// Import screens
import { LiveHomeScreen } from "../screens/LiveHomeScreen";
import { LiveRoomScreen } from "../screens/LiveRoomScreen";
import { VoiceRoomScreen } from "../screens/VoiceRoomScreen";
import { PKBattleScreen } from "../screens/PKBattleScreen";
import { KaraokeScreen } from "../screens/KaraokeScreen";
import { MultiHostScreen } from "../screens/MultiHostScreen";
import { LiveShoppingScreen } from "../screens/LiveShoppingScreen";
import { WalletScreen } from "../screens/WalletScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { AdminScreen } from "../screens/AdminScreen";

// Import icons
import { Home, Search, Video, Bell, User, Wallet as WalletIcon } from "lucide-react-native";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Navigation theme
const LiveTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#FF0066",
    background: "#0a0a0a",
    card: "#1a1a1a",
    text: "#ffffff",
    border: "#333333",
    notification: "#FF0066",
  },
};

// Live Stack Navigator - for full screen experiences
export const LiveStack: React.FC<{ userId: string; userName: string; userAvatar: string }> = ({
  userId,
  userName,
  userAvatar,
}) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_bottom",
        contentStyle: { backgroundColor: "#0a0a0a" },
      }}
    >
      <Stack.Screen name="LiveHome" component={LiveHomeScreenFn} />
      <Stack.Screen 
        name="LiveRoom" 
        component={LiveRoomScreen as any} 
        options={{ animation: "fade" }}
      />
      <Stack.Screen 
        name="VoiceRoom" 
        component={VoiceRoomScreen as any} 
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen 
        name="PKBattle" 
        component={PKBattleScreen as any} 
        options={{ animation: "fade" }}
      />
      <Stack.Screen 
        name="Karaoke" 
        component={KaraokeScreen as any} 
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen 
        name="MultiHost" 
        component={MultiHostScreen as any} 
        options={{ animation: "fade" }}
      />
      <Stack.Screen 
        name="LiveShopping" 
        component={LiveShoppingScreen as any} 
        options={{ animation: "slide_from_right" }}
      />
    </Stack.Navigator>
  );
};

// Wrapper component to pass props to LiveHomeScreen
const LiveHomeScreenFn: React.FC<any> = (props: any) => (
  <LiveHomeScreen
    isHost={true}
    currentUserId={props.route?.params?.userId || "demo"}
    currentUserName={props.route?.params?.userName || "User"}
    currentUserAvatar={props.route?.params?.userAvatar || ""}
  />
);

// Bottom Tab Navigator - Main app navigation
export const LiveTabNavigator: React.FC<{ userId: string; userName: string; userAvatar: string }> = ({
  userId,
  userName,
  userAvatar,
}) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopColor: "#333",
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#FF0066",
        tabBarInactiveTintColor: "#666",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          switch (route.name) {
            case "LiveHome":
              IconComponent = Home;
              break;
            case "LiveSearch":
              IconComponent = Search;
              break;
            case "GoLive":
              IconComponent = Video;
              break;
            case "LiveNotifications":
              IconComponent = Bell;
              break;
            case "LiveWallet":
              IconComponent = WalletIcon;
              break;
            case "LiveProfile":
              IconComponent = User;
              break;
            default:
              IconComponent = Home;
          }
          return <IconComponent size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="LiveHome" 
        component={() => <LiveHomeScreen userId={userId} userName={userName} userAvatar={userAvatar} />}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen 
        name="LiveSearch" 
        component={SearchScreen}
        options={{ tabBarLabel: "Search" }}
      />
      <Tab.Screen 
        name="GoLive" 
        component={PlaceholderScreen}
        options={{ tabBarLabel: "Go Live" }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // Show quick actions modal
            navigation.navigate("QuickActions");
          },
        })}
      />
      <Tab.Screen 
        name="LiveNotifications" 
        component={NotificationsScreen}
        options={{ tabBarLabel: "Alerts" }}
      />
      <Tab.Screen 
        name="LiveWallet" 
        component={() => <WalletScreen userId={userId} />}
        options={{ tabBarLabel: "Wallet" }}
      />
      <Tab.Screen 
        name="LiveProfile" 
        component={() => <ProfileScreen userId={userId} isOwnProfile={true} />}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
};

// Placeholder for Go Live tab
const PlaceholderScreen: React.FC = () => null;

// Root Navigator - wraps everything
export const LiveNavigationRoot: React.FC<{
  userId: string;
  userName: string;
  userAvatar: string;
  isAdmin?: boolean;
}> = ({ userId, userName, userAvatar, isAdmin = false }) => {
  return (
    <NavigationContainer theme={LiveTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main">
          {() => (
            <LiveTabNavigator
              userId={userId}
              userName={userName}
              userAvatar={userAvatar}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Admin" component={() => <AdminScreen adminId={userId} />} />
        <Stack.Screen 
          name="UserProfile" 
          component={ProfileScreen}
          options={{ animation: "slide_from_right" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default LiveNavigationRoot;