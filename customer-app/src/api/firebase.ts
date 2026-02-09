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
    apiKey: "AIzaSyARYACJ1kXfSAXGYp2xc65LTUyjnX5hqpY",
    authDomain: "tama-clothing-tunisia.firebaseapp.com",
    projectId: "tama-clothing-tunisia",
    storageBucket: "tama-clothing-tunisia.firebasestorage.app",
    messagingSenderId: "720312684180",
    appId: "1:720312684180:web:b56c9ef0cd926f00172e81"
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
