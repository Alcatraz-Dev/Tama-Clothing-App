import { db } from "../services/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Run this function (e.g., from a button in a hidden setup page or via a one-time terminal script)
 * to promote the currently logged-in user to Admin.
 */
export const promoteToAdmin = async (uid: string, email: string) => {
    try {
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
            email,
            role: "admin",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, { merge: true });
        console.log("User promoted to Admin successfully!");
        return true;
    } catch (error) {
        console.error("Error promoting user:", error);
        return false;
    }
};
