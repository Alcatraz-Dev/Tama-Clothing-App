import { db } from '../api/firebase';
import { 
    collection, 
    doc, 
    setDoc, 
    updateDoc, 
    onSnapshot, 
    increment, 
    addDoc, 
    getDoc,
    getDocs,
    serverTimestamp, 
    query, 
    where,
    orderBy, 
    limit,
    arrayUnion,
    arrayRemove,
    deleteDoc
} from 'firebase/firestore';

export interface LiveSession {
    channelId: string;
    publisherType: 'brand' | 'influencer';
    identityRing: boolean;
    currentProductId?: string;
    viewCount: number;
    status: 'live' | 'ended';
    hostName?: string;
    hostAvatar?: string;
    hostId?: string; // Original host user ID
    collaboratorIds?: string[]; // List of collaborators who can manage
    adminIds?: string[]; // List of admin IDs
    startedAt?: any;
    endedAt?: any;
    recordingUrl?: string;
    pinnedTimeline?: { productId: string; timestamp: number }[];
    activeCoupon?: {
        code: string;
        discount: number;
        type: 'percentage' | 'fixed';
    };
    brandId?: string;
    moderatorIds?: string[];
    collabId?: string; // Link to collaboration if applicable
    participantIds?: string[]; // Active participants
}

export interface LiveEvent {
    id?: string;
    type: 'comment' | 'reaction' | 'purchase' | 'join';
    userId: string;
    userName: string;
    userAvatar?: string;
    content?: string; // For comments
    timestamp: any;
}

const SESSIONS_COLLECTION = 'Live_sessions';
const EVENTS_SUBCOLLECTION = 'Live_events';

export const LiveSessionService = {
    // Create or start a session (Broadcaster)
    startSession: async (channelId: string, hostName: string, brandId?: string, hostAvatar?: string, hostUserId?: string, collaboratorIds?: string[]) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await setDoc(sessionRef, {
            channelId,
            brandId: brandId || null,
            publisherType: 'brand', 
            identityRing: true,
            viewCount: 0,
            status: 'live',
            hostName,
            hostAvatar: hostAvatar || null,
            hostId: hostUserId || null,
            collaboratorIds: collaboratorIds || [],
            startedAt: serverTimestamp(),
            pinnedTimeline: [],
            activeCoupon: null
        }, { merge: true });
    },

    // End a session
    endSession: async (channelId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            status: 'ended',
            endedAt: serverTimestamp(),
            activeCoupon: null // Deactivate coupon on end
        });
    },

    // Join a session (Viewer) uses this to track view count
    joinSession: async (channelId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            viewCount: increment(1)
        });
    },

    // Leave a session
    leaveSession: async (channelId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            viewCount: increment(-1)
        });
    },

    // Subscribe to session updates (e.g., current product, view count)
    subscribeToSession: (channelId: string, callback: (data: LiveSession) => void) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        const unsubscribe = onSnapshot(sessionRef, (doc) => {
            if (doc.exists()) {
                callback(doc.data() as LiveSession);
            }
        }, (error) => {
            console.error('Error subscribing to session:', error);
        });
        return unsubscribe;
    },

    // Send a message or reaction
    sendEvent: async (channelId: string, event: Omit<LiveEvent, 'timestamp'>) => {
        const eventsRef = collection(db, SESSIONS_COLLECTION, channelId, EVENTS_SUBCOLLECTION);
        await addDoc(eventsRef, {
            ...event,
            timestamp: serverTimestamp(),
        });
    },

    // Subscribe to events (comments, hearts)
    subscribeToEvents: (channelId: string, callback: (events: LiveEvent[]) => void) => {
        const eventsRef = collection(db, SESSIONS_COLLECTION, channelId, EVENTS_SUBCOLLECTION);
        const q = query(eventsRef, orderBy('timestamp', 'desc'), limit(50)); // Last 50 events
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveEvent));
            callback(events.reverse()); // Show oldest first (top to bottom) or reverse for bottom-up chat
        }, (error) => {
            console.error('Error subscribing to events:', error);
        });
        return unsubscribe;
    },

    // Admin: Pin a product and track it in timeline
    pinProduct: async (channelId: string, productId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        const sessionSnap = await getDoc(sessionRef);
        
        if (sessionSnap.exists()) {
            const data = sessionSnap.data();
            const startedAt = data.startedAt?.toDate?.() || new Date();
            const now = new Date();
            const offset = (now.getTime() - startedAt.getTime()) / 1000; // Offset in seconds

            await updateDoc(sessionRef, {
                currentProductId: productId,
                pinnedTimeline: [...(data.pinnedTimeline || []), { productId, timestamp: offset }]
            });
        }
    },

    // Unpin current product
    unpinProduct: async (channelId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            currentProductId: null
        });
    },

    // Activate a coupon for the session
    activateCoupon: async (channelId: string, coupon: { code: string; discount: number; type: 'percentage' | 'fixed' }) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            activeCoupon: coupon
        });
    },

    // Deactivate current coupon
    deactivateCoupon: async (channelId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            activeCoupon: null
        });
    },

    // Save recording URL (usually called by backend or after recording is finished)
    saveRecording: async (channelId: string, recordingUrl: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            recordingUrl
        });
    },

    // Get replays for a brand/person
    getReplays: async (brandId: string) => {
        const q = query(
            collection(db, SESSIONS_COLLECTION), 
            where('brandId', '==', brandId), 
            where('status', '==', 'ended'),
            where('recordingUrl', '!=', null)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as LiveSession));
    },

    // Subscribe to all active sessions
    subscribeToAllSessions: (callback: (sessions: LiveSession[]) => void) => {
        const q = query(collection(db, SESSIONS_COLLECTION), where('status', '==', 'live'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessions = snapshot.docs.map(doc => ({ ...doc.data() } as LiveSession));
            callback(sessions);
        }, (error) => {
            console.error('Error subscribing to all sessions:', error);
        });
        return unsubscribe;
    },

    // Moderator Management
    addModerator: async (channelId: string, userId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            moderatorIds: arrayUnion(userId)
        });
    },

    removeModerator: async (channelId: string, userId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            moderatorIds: arrayRemove(userId)
        });
    },

    // Delete a comment or event
    deleteEvent: async (channelId: string, eventId: string) => {
        const eventRef = doc(db, SESSIONS_COLLECTION, channelId, EVENTS_SUBCOLLECTION, eventId);
        await deleteDoc(eventRef);
    },

    // Check if user is a collaborator of the session
    isCollaborator: async (channelId: string, userId: string): Promise<boolean> => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        const sessionSnap = await getDoc(sessionRef);
        if (sessionSnap.exists()) {
            const data = sessionSnap.data();
            return (data.collaboratorIds || []).includes(userId);
        }
        return false;
    },

    // Add a collaborator to the session
    addCollaborator: async (channelId: string, userId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            collaboratorIds: arrayUnion(userId)
        });
    },

    // Remove a collaborator from the session
    removeCollaborator: async (channelId: string, userId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            collaboratorIds: arrayRemove(userId)
        });
    },

    // Get session by channel ID
    getSession: async (channelId: string): Promise<LiveSession | null> => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        const sessionSnap = await getDoc(sessionRef);
        if (sessionSnap.exists()) {
            return sessionSnap.data() as LiveSession;
        }
        return null;
    },

    // Start a live stream for a collaboration
    startCollabSession: async (channelId: string, hostName: string, hostId: string, collabId: string, brandId?: string, hostAvatar?: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await setDoc(sessionRef, {
            channelId,
            collabId,
            brandId: brandId || null,
            publisherType: 'influencer',
            identityRing: true,
            viewCount: 0,
            status: 'live',
            hostName,
            hostId,
            hostAvatar: hostAvatar || null,
            collaboratorIds: [],
            moderatorIds: [],
            participantIds: [hostId], // Host is first participant
            startedAt: serverTimestamp(),
            pinnedTimeline: [],
            activeCoupon: null
        }, { merge: true });
    },

    // Add participant to session
    addParticipant: async (channelId: string, userId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            participantIds: arrayUnion(userId)
        });
    },

    // Remove participant from session
    removeParticipant: async (channelId: string, userId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            participantIds: arrayRemove(userId)
        });
    },

    // Get active participants count
    getParticipantCount: async (channelId: string): Promise<number> => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        const sessionSnap = await getDoc(sessionRef);
        if (sessionSnap.exists()) {
            const data = sessionSnap.data();
            return (data.participantIds || []).length;
        }
        return 0;
    },

    // Get live session by collaboration ID
    getSessionByCollabId: async (collabId: string): Promise<LiveSession | null> => {
        const q = query(
            collection(db, SESSIONS_COLLECTION),
            where('collabId', '==', collabId),
            where('status', '==', 'live'),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs[0].data() as LiveSession;
        }
        return null;
    },

    // Subscribe to sessions for a specific collaboration
    subscribeToCollabSessions: (collabId: string, callback: (session: LiveSession | null) => void) => {
        const q = query(
            collection(db, SESSIONS_COLLECTION),
            where('collabId', '==', collabId),
            where('status', '==', 'live')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                callback(snapshot.docs[0].data() as LiveSession);
            } else {
                callback(null);
            }
        }, (error) => {
            console.error('Error subscribing to collab sessions:', error);
        });
        return unsubscribe;
    }
};
