import { auth } from '../api/firebase';
import { API_BASE_URL } from '../config/api';

// Debug log the API URL
console.log("🔍 StreamAuth API_URL:", API_BASE_URL);

/**
 * Fetches a valid Stream Video JWT for the currently signed-in Firebase user.
 * The backend endpoint verifies the Firebase ID token and mints a signed
 * Stream token using the Stream API secret.
 */
export async function getStreamTokenForCurrentUser(): Promise<{
  token: string;
  userId: string;
  name: string;
}> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated Firebase user found.');
  }

  console.log("🔍 Current user UID:", currentUser.uid);

  // Get fresh Firebase ID token (automatically refreshed if needed)
  const firebaseIdToken = await currentUser.getIdToken(/* forceRefresh */ false);
  console.log("🔍 Got Firebase token, length:", firebaseIdToken?.length);

  const url = `${API_BASE_URL}/api/stream-token`;
  console.log("🔍 Making request to:", url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseIdToken }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log("🔍 Response status:", response.status);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("🔍 Response error:", err);
      throw new Error(err.error || `Stream token request failed: ${response.status}`);
    }

    const result = await response.json();
    console.log("🔍 Got token, userId:", result.userId);
    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("🔍 Fetch error:", error.message || error);
    if (error.name === 'AbortError') {
      throw new Error('Connection to stream token service timed out. Please check your internet or server status.');
    }
    throw error;
  }
}
