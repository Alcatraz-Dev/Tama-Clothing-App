import React, { PropsWithChildren, useCallback, useMemo } from "react";
import {
  Chat,
  OverlayProvider,
  Streami18n,
  useCreateChatClient,
} from "stream-chat-react-native";
import { SafeAreaView, ActivityIndicator, StyleSheet } from "react-native";
import { getStreamTokenForCurrentUser } from "../services/streamAuth";
import { auth } from "../api/firebase";

const STREAM_API_KEY = require("../config/stream").STREAM_API_KEY;
const streami18n = new Streami18n({ language: "en" });

export const ChatWrapper = ({ children }: PropsWithChildren<{}>) => {
  // Fetch token dynamically using Firebase auth
  const tokenProvider = useCallback(async () => {
    try {
      const { token } = await getStreamTokenForCurrentUser();
      return token;
    } catch (error) {
      console.error("Failed to get chat token:", error);
      return null;
    }
  }, []);

  const userData = useMemo(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    return {
      id: currentUser.uid,
      name: currentUser.displayName || currentUser.email || currentUser.uid,
      image: currentUser.photoURL || undefined,
    };
  }, []);

  const chatClient = useCreateChatClient({
    apiKey: STREAM_API_KEY,
    userData: userData || undefined,
    tokenProvider: tokenProvider,
  });

  if (!chatClient || !userData) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" style={StyleSheet.absoluteFill} />
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
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
