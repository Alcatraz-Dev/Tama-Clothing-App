import { auth } from '../api/firebase';
import { API_BASE_URL } from '../config/api';

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

  // Get fresh Firebase ID token (automatically refreshed if needed)
  const firebaseIdToken = await currentUser.getIdToken(/* forceRefresh */ false);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/stream-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseIdToken }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Stream token request failed: ${response.status}`);
    }

    return response.json(); // { token, userId, name }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Connection to stream token service timed out. Please check your internet or server status.');
    }
    throw error;
  }
}
