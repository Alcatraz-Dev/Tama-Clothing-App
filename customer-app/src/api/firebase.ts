import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
    getAuth,
    initializeAuth,
    Auth,
    // @ts-ignore
    getReactNativePersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
    apiKey: "AIzaSyAZYgY-PsjDK5vSxssjsWmUI9J8CE6FUFw",
    authDomain: "tama-clothing-v2-alcatraz.firebaseapp.com",
    projectId: "tama-clothing-v2-alcatraz",
    storageBucket: "tama-clothing-v2-alcatraz.firebasestorage.app",
    messagingSenderId: "32411249289",
    appId: "1:32411249289:web:fd4b30ad0233dec21df458"
};

// Singleton pattern for Firebase initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
} else {
    try {
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
        });
    } catch (e: any) {
        auth = getAuth(app);
    }
}

export const db = getFirestore(app);
export const storage = getStorage(app);

export { auth };
export default app;
