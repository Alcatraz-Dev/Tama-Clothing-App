import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import * as FirebaseAuth from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get config from expo.extra (injected from app.json at build time)
const expoExtra = Constants.expoConfig?.extra || (Constants as any).manifest?.extra;
const apiKey = expoExtra?.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

if (!apiKey) {
  throw new Error(
    'Firebase API key missing. Set EXPO_PUBLIC_FIREBASE_API_KEY in .env (dev) or app.json extra (production). Current expoExtra: ' +
    JSON.stringify(expoExtra)
  );
}

const firebaseConfig = {
  apiKey,
  authDomain: "tama-clothing-v2-alcatraz.firebaseapp.com",
  projectId: "tama-clothing-v2-alcatraz",
  storageBucket: "tama-clothing-v2-alcatraz.firebasestorage.app",
  messagingSenderId: "32411249289",
  appId: "1:32411249289:web:fd4b30ad0233dec21df458",
  databaseURL: "https://tama-clothing-v2-alcatraz-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use casting to bypass TypeScript errors if the member is not in the type definition
const { initializeAuth, getReactNativePersistence } = FirebaseAuth as any;

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

export default app;
