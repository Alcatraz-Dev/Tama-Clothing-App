import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import * as FirebaseAuth from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: "tama-clothing-v2-alcatraz.firebaseapp.com",
    projectId: "tama-clothing-v2-alcatraz",
    storageBucket: "tama-clothing-v2-alcatraz.firebasestorage.app",
    messagingSenderId: "32411249289",
    appId: "1:32411249289:web:fd4b30ad0233dec21df458"
};

// Singleton pattern for Firebase initialization
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
