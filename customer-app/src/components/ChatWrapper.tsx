import React, { PropsWithChildren, useMemo, useState, useEffect, useRef } from "react";
import {
  Chat,
  OverlayProvider,
  Streami18n,
  useCreateChatClient,
} from "stream-chat-react-native";
import { SafeAreaView, ActivityIndicator, StyleSheet, Text } from "react-native";
import { getStreamTokenForCurrentUser } from "../services/streamAuth";
import { auth } from "../api/firebase";

const STREAM_API_KEY = require("../config/stream").STREAM_API_KEY;
const STREAM_TOKEN = require("../config/stream").STREAM_TOKEN;
const streami18n = new Streami18n({ language: "en" });

export const ChatWrapper = ({ children }: PropsWithChildren<{}>) => {
  const tokenRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser: any) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        try {
          const { token } = await getStreamTokenForCurrentUser();
          tokenRef.current = token;
        } catch (error) {
          console.warn("⚠️ Failed to get token, using demo token:", error);
          tokenRef.current = STREAM_TOKEN;
        }
      } else {
        setUserId(null);
        tokenRef.current = STREAM_TOKEN;
      }
      setIsReady(true);
    });

    return unsubscribe;
  }, []);

  // Build user object based on Firebase auth - only create valid user
  const userData = useMemo(() => {
    if (!userId) return null;
    const currentUser = auth.currentUser;
    return {
      id: userId,
      name: currentUser?.displayName || currentUser?.email?.split('@')[0] || "User",
      image: currentUser?.photoURL || "",
    };
  }, [userId]);

  // Token provider function - returns the token when called
  const tokenProvider = useMemo(() => {
    return async () => {
      if (!tokenRef.current) {
        try {
          const { token } = await getStreamTokenForCurrentUser();
          tokenRef.current = token;
        } catch (err) {
          console.warn("⚠️ Token fetch failed, using demo token");
          tokenRef.current = STREAM_TOKEN;
        }
      }
      return tokenRef.current || "";
    };
  }, []);

  // Always create chat client but with fallback user when not logged in
  const chatClient = useCreateChatClient({
    apiKey: STREAM_API_KEY,
    userData: userData || {
      id: userId || "guest-" + Date.now(),
      name: "Guest User",
      image: "",
    },
    tokenOrProvider: tokenProvider,
  });

  if (!isReady || !chatClient) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Connecting to chat...</Text>
      </SafeAreaView>
    );
  }

  // If no user is logged in, render children without Chat context  
  if (!userId) {
    return <>{children}</>;
  }

  return (
    <OverlayProvider i18nInstance={streami18n}>
      <Chat client={chatClient} i18nInstance={streami18n}>
        {children}
      </Chat>
    </OverlayProvider>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
});
