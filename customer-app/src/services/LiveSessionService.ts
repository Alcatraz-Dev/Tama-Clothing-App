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
    deleteDoc,
    or
} from 'firebase/firestore';

export interface LiveSession {
    channelId: string;
    publisherType: 'brand' | 'influencer';
    identityRing: boolean;
    currentProductId?: string;
    viewCount: number;
    totalViewers?: number;
    peakViewers?: number;
    status: 'live' | 'ended';
    hostName?: string;
    hostAvatar?: string;
    hostId?: string; // Original host user ID
    collaboratorIds?: string[]; // List of collaborators who can manage
    adminIds?: string[]; // List of admin IDs
    startedAt?: any;
    endedAt?: any;
    lastHeartbeat?: any; // Track when host was last active (for auto-cleanup)
    recordingUrl?: string;
    pinnedTimeline?: { productId: string; timestamp: number }[];
    activeCoupon?: {
        code: string;
        discount: number;
        type: 'percentage' | 'fixed';
        endTime?: number;
        expiryMinutes?: number;
    };
    brandId?: string;
    moderatorIds?: string[];
    collabId?: string; // Link to collaboration if applicable
    participantIds?: string[]; // Active participants
    pkScore?: number; // PK Battle sync score
    totalLikes?: number; // Flame Count (Combined Score)
    likesCount?: number; // Separate likes counter
    giftsCount?: number; // Separate gifts points counter
    pkWins?: number; // Total PK battles won in this session
    pkLosses?: number; // Total PK battles lost in this session
    pkState?: { // Comprehensive PK State for Audience Sync
        isActive: boolean;
        hostScore: number;
        guestScore: number;
        opponentName?: string;
        opponentChannelId?: string; // Link to opponent's session for Host recovery
        startTime?: number;
        duration?: number; // Duration in seconds (180, 300, 420, 600)
        endTime?: number; // Timestamp when battle ends
        winner?: string; // Winner's name when battle ends
        hostName?: string; // Host's name for winner display
    };
    lastGift?: { // Real-time gift animation sync
        giftName: string;
        icon: string;
        points: number;
        senderName: string;
        timestamp: number;
    };
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
            lastHeartbeat: serverTimestamp(),
            pinnedTimeline: [],
            activeCoupon: null
        }, { merge: true });
    },

    // End a session
    endSession: async (channelId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await setDoc(sessionRef, {
            status: 'ended',
            endedAt: serverTimestamp(),
            activeCoupon: null // Deactivate coupon on end
        }, { merge: true });
    },

    // Join a session (Viewer) uses this to track view count
    joinSession: async (channelId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            viewCount: increment(1),
            totalViewers: increment(1) // Track total join attempts for analytics
        });
    },

    // Leave a session
    leaveSession: async (channelId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            viewCount: increment(-1)
        });
    },

    // Track peak viewers
    updatePeakViewers: async (channelId: string, count: number) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await updateDoc(sessionRef, {
            peakViewers: count
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
    // Activate a coupon for the session
    activateCoupon: async (channelId: string, coupon: { code: string; discount: number; type: 'percentage' | 'fixed'; endTime?: number; expiryMinutes?: number }) => {
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

    // Subscribe to all active sessions with Heartbeat Filtering
    subscribeToAllSessions: (callback: (sessions: LiveSession[]) => void) => {
        const q = query(collection(db, SESSIONS_COLLECTION), where('status', '==', 'live'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = Date.now();
            const sessions = snapshot.docs
                .map(doc => ({ ...doc.data() } as LiveSession))
                .filter(s => {
                    // 1. If explicitly ended (should be filtered by query, but double check)
                    if (s.status === 'ended') return false;

                    // 2. Heartbeat Check (Grace period: 3 minutes)
                    if (s.lastHeartbeat) {
                        const hbTime = s.lastHeartbeat.toMillis ? s.lastHeartbeat.toMillis() : (s.lastHeartbeat.seconds * 1000);
                        return (now - hbTime) < 180000; 
                    }

                    // 3. If no heartbeat, check start time (Grace period: 5 minutes for new sessions)
                    if (s.startedAt) {
                         const startTime = s.startedAt.toMillis ? s.startedAt.toMillis() : (s.startedAt.seconds * 1000);
                         return (now - startTime) < 300000;
                    }

                    return true; // Fallback: show if no time data (unlikely)
                });
            
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
            lastHeartbeat: serverTimestamp(),
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

    subscribeToCollabSessions: (id: string, callback: (session: LiveSession | null) => void, brandId?: string) => {
        // Query by Collab ID
        const qCollab = query(
            collection(db, SESSIONS_COLLECTION),
            where('status', '==', 'live'),
            where('collabId', '==', id)
        );

        // Query by Brand ID (using the primary id)
        const qBrand = query(
            collection(db, SESSIONS_COLLECTION),
            where('status', '==', 'live'),
            where('brandId', '==', id)
        );

        let sessionCollab: LiveSession | null = null;
        let sessionBrand: LiveSession | null = null;
        let sessionBrandExplicit: LiveSession | null = null;

        const updateCallback = () => {
             const now = Date.now();
             const zombieCheck = (s: LiveSession | null) => {
                if (!s) return null;
                // 1. Explicitly ended
                if (s.status === 'ended') return null;

                // 2. Heartbeat Check (3 mins)
                if (s.lastHeartbeat) {
                    const hbTime = s.lastHeartbeat.toMillis ? s.lastHeartbeat.toMillis() : (s.lastHeartbeat.seconds * 1000);
                    if ((now - hbTime) > 180000) return null;
                }
                
                // 3. Start Time Check (5 mins) if no heartbeat
                else if (s.startedAt) {
                     const startTime = s.startedAt.toMillis ? s.startedAt.toMillis() : (s.startedAt.seconds * 1000);
                     if ((now - startTime) > 300000) return null;
                }

                return s;
             };

             const validCollab = zombieCheck(sessionCollab);
             const validBrand = zombieCheck(sessionBrand);
             const validBrandExplicit = zombieCheck(sessionBrandExplicit);

            // Prioritize specific collab, then explicit brand, then ID brand match
            callback(validCollab || validBrandExplicit || validBrand);
        };

        const unsubCollab = onSnapshot(qCollab, (snapshot) => {
            sessionCollab = !snapshot.empty ? snapshot.docs[0].data() as LiveSession : null;
            updateCallback();
        }, (error) => console.error('Collab sub error:', error));

        const unsubBrand = onSnapshot(qBrand, (snapshot) => {
            sessionBrand = !snapshot.empty ? snapshot.docs[0].data() as LiveSession : null;
            updateCallback();
        }, (error) => console.error('Brand sub error:', error));

        let unsubBrandExplicit = () => {};
        if (brandId && brandId !== id) {
             const qBrandExplicit = query(
                collection(db, SESSIONS_COLLECTION),
                where('status', '==', 'live'),
                where('brandId', '==', brandId)
            );
            unsubBrandExplicit = onSnapshot(qBrandExplicit, (snapshot) => {
                sessionBrandExplicit = !snapshot.empty ? snapshot.docs[0].data() as LiveSession : null;
                updateCallback();
            }, (error) => console.error('Brand Explicit sub error:', error));
        }

        return () => {
            unsubCollab();
            unsubBrand();
            unsubBrandExplicit();
        };
    },

    // Get the most recent session for a brand (including ended ones)
    getLatestSessionByBrand: async (brandId: string): Promise<LiveSession | null> => {
        try {
            const q = query(
                collection(db, SESSIONS_COLLECTION),
                where('brandId', '==', brandId),
                orderBy('startedAt', 'desc'),
                limit(1)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return snapshot.docs[0].data() as LiveSession;
            }
        } catch (error) {
            console.log('⚠️ [LiveSessionService] Indexed query failed, falling back to in-memory sort:', error);
            // Fallback: fetch without ordering and sort in memory (safe for small number of sessions)
            const q = query(
                collection(db, SESSIONS_COLLECTION),
                where('brandId', '==', brandId)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const sessions = snapshot.docs.map(d => d.data() as LiveSession);
                sessions.sort((a, b) => {
                    const timeA = a.startedAt?.toMillis?.() || (a.startedAt?.seconds ? a.startedAt.seconds * 1000 : 0);
                    const timeB = b.startedAt?.toMillis?.() || (b.startedAt?.seconds ? b.startedAt.seconds * 1000 : 0);
                    return timeB - timeA;
                });
                return sessions[0];
            }
        }
        return null;
    },

    // Get the most recent session for a host (including ended ones)
    getLatestSessionByHost: async (hostId: string): Promise<LiveSession | null> => {
        try {
            const q = query(
                collection(db, SESSIONS_COLLECTION),
                where('hostId', '==', hostId),
                orderBy('startedAt', 'desc'),
                limit(1)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return snapshot.docs[0].data() as LiveSession;
            }
        } catch (error) {
            console.log('⚠️ [LiveSessionService] Indexed query failed for hostId, falling back to in-memory sort:', error);
            const q = query(
                collection(db, SESSIONS_COLLECTION),
                where('hostId', '==', hostId)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const sessions = snapshot.docs.map(d => d.data() as LiveSession);
                sessions.sort((a, b) => {
                    const timeA = a.startedAt?.toMillis?.() || (a.startedAt?.seconds ? a.startedAt.seconds * 1000 : 0);
                    const timeB = b.startedAt?.toMillis?.() || (b.startedAt?.seconds ? b.startedAt.seconds * 1000 : 0);
                    return timeB - timeA;
                });
                return sessions[0];
            }
        }
        return null;
    },

    // Update Host Score specifically for Host-to-Host Sync
    updatePKScore: async (channelId: string, score: number) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await setDoc(sessionRef, {
            pkScore: score
        }, { merge: true });
    },

    // Increment Total Likes (Flame Count) and separate likesCount
    incrementLikes: async (channelId: string, amount: number) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await setDoc(sessionRef, {
            totalLikes: increment(amount),
            likesCount: increment(amount)
        }, { merge: true });
    },

    // Increment Total Likes (Flame Count) and separate giftsCount
    incrementGifts: async (channelId: string, amount: number) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await setDoc(sessionRef, {
            totalLikes: increment(amount),
            giftsCount: increment(amount)
        }, { merge: true });
    },

    // Increment PK battles won
    incrementPKWin: async (channelId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await setDoc(sessionRef, {
            pkWins: increment(1)
        }, { merge: true });
    },

    // Increment PK battles lost
    incrementPKLoss: async (channelId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await setDoc(sessionRef, {
            pkLosses: increment(1)
        }, { merge: true });
    },

    // Update comprehensive PK State for Audience Sync
    updatePKState: async (channelId: string, state: { 
        isActive: boolean; 
        hostScore: number; 
        guestScore: number; 
        opponentName?: string; 
        opponentChannelId?: string; 
        startTime?: number;
        duration?: number;
        endTime?: number;
        winner?: string;
        hostName?: string;
    }) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await setDoc(sessionRef, {
            pkState: state
        }, { merge: true });
    },

    // Broadcast Gift for Real-time Animation Sync
    broadcastGift: async (channelId: string, gift: { giftName: string; icon: string; points: number; senderName: string; }) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await setDoc(sessionRef, {
            lastGift: {
                ...gift,
                timestamp: Date.now()
            }
        }, { merge: true });
    },

    // Update heartbeat to indicate host is still active
    updateHeartbeat: async (channelId: string) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, channelId);
        await setDoc(sessionRef, {
            lastHeartbeat: serverTimestamp()
        }, { merge: true });
    }
};
