// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARYACJ1kXfSAXGYp2xc65LTUyjnX5hqpY",
  authDomain: "tama-clothing-tunisia.firebaseapp.com",
  projectId: "tama-clothing-tunisia",
  storageBucket: "tama-clothing-tunisia.firebasestorage.app",
  messagingSenderId: "720312684180",
  appId: "1:720312684180:web:b56c9ef0cd926f00172e81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
