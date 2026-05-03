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
const streami18n = new Streami18n({ language: "en" });

export const ChatWrapper = ({ children }: PropsWithChildren<{}>) => {
  const tokenRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const getToken = async () => {
      try {
        const { token } = await getStreamTokenForCurrentUser();
        tokenRef.current = token;
        setIsReady(true);
      } catch (error) {
        console.error("Failed to get token:", error);
        setIsReady(true);
      }
    };
    getToken();
  }, []);

  // Build user object based on Firebase auth
  const userData = useMemo(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return undefined;
    return {
      id: currentUser.uid,
      name: currentUser.displayName || currentUser.email?.split('@')[0] || "User",
      image: currentUser.photoURL || "",
    };
  }, []);

  // Token provider function - returns the token when called
  const tokenProvider = useMemo(() => {
    return async () => {
      if (!tokenRef.current) {
        const { token } = await getStreamTokenForCurrentUser();
        tokenRef.current = token;
      }
      return tokenRef.current;
    };
  }, []);

  const chatClient = useCreateChatClient({
    apiKey: STREAM_API_KEY,
    userData: userData,
    tokenProvider: tokenProvider,
  });

  if (!isReady || !chatClient) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Connecting to chat...</Text>
      </SafeAreaView>
    );
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
