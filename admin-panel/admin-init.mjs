import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARYACJ1kXfSAXGYp2xc65LTUyjnX5hqpY",
  authDomain: "tama-clothing-tunisia.firebaseapp.com",
  projectId: "tama-clothing-tunisia",
  storageBucket: "tama-clothing-tunisia.firebasestorage.app",
  messagingSenderId: "720312684180",
  appId: "1:720312684180:web:b56c9ef0cd926f00172e81"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const promote = async () => {
    try {
        console.log("Attempting to promote TS79YgeGNlXCtOHbNSyEeqV7W603...");
        const ref = doc(db, "users", "TS79YgeGNlXCtOHbNSyEeqV7W603");
        await setDoc(ref, {
            role: "admin",
            lastPromoted: new Date().toISOString()
        }, { merge: true });
        console.log("SUCCESS");
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e.message);
        process.exit(1);
    }
};

promote();
