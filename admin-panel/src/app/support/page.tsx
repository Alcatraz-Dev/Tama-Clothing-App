"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/services/firebase";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    updateDoc,
    doc,
    where,
    getDocs
} from "firebase/firestore";
import { Send, MessageCircle, User, Clock, Image as ImageIcon, Loader2, X, ChevronLeft } from "lucide-react";
import styles from "./support.module.css";
import { getDoc } from "firebase/firestore";

async function sendPushNotification(expoPushToken: string, title: string, body: string, data = {}) {
    if (!expoPushToken) return;
    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
    };

    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
    } catch (error) {
        console.error('Push notification error:', error);
    }
}

interface Message {
    id: string;
    text?: string;
    imageUrl?: string;
    senderId: string;
    senderName: string;
    senderRole: 'customer' | 'support';
    timestamp: any;
    read: boolean;
}

interface Chat {
    id: string;
    chatId: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    lastMessage: string;
    lastMessageTime: any;
    status: 'open' | 'closed';
    unreadCount: number;
}

export default function SupportPage() {
    const { user } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch all active chats
    useEffect(() => {
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, orderBy("lastMessageTime", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Chat));
            setChats(chatList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Clear unread count when chat is selected
    useEffect(() => {
        if (!selectedChat) return;

        const clearUnread = async () => {
            try {
                const chatRef = doc(db, "chats", selectedChat.id);
                await updateDoc(chatRef, {
                    unreadCount: 0
                });
            } catch (error) {
                console.error("Error clearing unread count:", error);
            }
        };

        clearUnread();
    }, [selectedChat?.id]);

    // Fetch messages for selected chat
    useEffect(() => {
        if (!selectedChat) return;

        const messagesRef = collection(db, "chats", selectedChat.chatId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            setMessages(msgs);

            // Mark unread messages as read
            snapshot.docs.forEach(async (messageDoc) => {
                const data = messageDoc.data();
                if (data.senderRole === 'customer' && !data.read) {
                    try {
                        await updateDoc(doc(db, "chats", selectedChat.chatId, "messages", messageDoc.id), {
                            read: true
                        });
                    } catch (err) {
                        console.error("Error marking message as read:", err);
                    }
                }
            });

            // Scroll to bottom
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        });

        return () => unsubscribe();
    }, [selectedChat?.chatId]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedChat || !user) return;

        try {
            const messagesRef = collection(db, "chats", selectedChat.chatId, "messages");
            await addDoc(messagesRef, {
                text: inputText.trim(),
                senderId: user.uid,
                senderName: user.email?.split('@')[0] || 'Support',
                senderRole: 'support',
                timestamp: serverTimestamp(),
                read: false
            });

            // Update chat metadata
            const chatRef = doc(db, "chats", selectedChat.id);
            await updateDoc(chatRef, {
                lastMessage: inputText.trim() || 'Sent an image',
                lastMessageTime: serverTimestamp(),
                unreadCount: 0,
                status: 'open'
            });

            setInputText("");

            // Send push notification to customer
            if (selectedChat.customerId) {
                const userDoc = await getDoc(doc(db, "users", selectedChat.customerId));
                if (userDoc.exists() && userDoc.data().expoPushToken) {
                    sendPushNotification(
                        userDoc.data().expoPushToken,
                        "New message from Support",
                        inputText.trim()
                    );
                }
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const sendImageMessage = async (url: string) => {
        if (!url || !selectedChat || !user) return;

        try {
            const messagesRef = collection(db, "chats", selectedChat.chatId, "messages");
            await addDoc(messagesRef, {
                imageUrl: url,
                senderId: user.uid,
                senderName: user.email?.split('@')[0] || 'Support',
                senderRole: 'support',
                timestamp: serverTimestamp(),
                read: false
            });

            // Update chat metadata
            const chatRef = doc(db, "chats", selectedChat.id);
            await updateDoc(chatRef, {
                lastMessage: 'Sent an image',
                lastMessageTime: serverTimestamp(),
                unreadCount: 0,
                status: 'open'
            });

            // Send push notification to customer
            if (selectedChat.customerId) {
                const userDoc = await getDoc(doc(db, "users", selectedChat.customerId));
                if (userDoc.exists() && userDoc.data().expoPushToken) {
                    sendPushNotification(
                        userDoc.data().expoPushToken,
                        "Support sent an image",
                        "View the message in support chat"
                    );
                }
            }
        } catch (error) {
            console.error("Error sending image message:", error);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if file is image
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                await sendImageMessage(data.url);
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp?.toDate) return '';
        const date = timestamp.toDate();
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp?.toDate) return '';
        const date = timestamp.toDate();
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Support Chat</h1>
                <p className={styles.subtitle}>Manage customer conversations</p>
            </div>

            <div className={styles.chatLayout}>
                {/* Chat List */}
                <div className={`${styles.chatList} ${selectedChat ? styles.hideOnMobile : ""}`}>
                    <div className={styles.chatListHeader}>
                        <MessageCircle size={20} color="var(--accent)" />
                        <span>Conversations ({chats.length})</span>
                    </div>

                    {loading ? (
                        <div className={styles.loadingState}>Loading chats...</div>
                    ) : chats.length === 0 ? (
                        <div className={styles.emptyState}>
                            <MessageCircle size={48} color="var(--accent)" style={{ opacity: 0.3 }} />
                            <p>No conversations yet</p>
                        </div>
                    ) : (
                        <div className={styles.chatItems}>
                            {chats.map(chat => (
                                <div
                                    key={chat.id}
                                    className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.activeChatItem : ''}`}
                                    onClick={() => setSelectedChat(chat)}
                                >
                                    <div className={styles.chatItemAvatar}>
                                        <User size={20} />
                                    </div>
                                    <div className={styles.chatItemContent}>
                                        <div className={styles.chatItemHeader}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span className={styles.chatItemName}>{chat.customerName}</span>
                                                <span className={`${styles.statusBadge} ${chat.status === 'open' ? styles.statusOpen : styles.statusClosed}`} style={{ fontSize: '8px', padding: '1px 5px' }}>
                                                    {chat.status?.toUpperCase() || 'OPEN'}
                                                </span>
                                            </div>
                                            <span className={styles.chatItemTime}>
                                                {formatTime(chat.lastMessageTime)}
                                            </span>
                                        </div>
                                        <p className={styles.chatItemMessage}>{chat.lastMessage}</p>
                                    </div>
                                    {chat.unreadCount > 0 && (
                                        <div className={styles.unreadBadge}>{chat.unreadCount}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Messages Area */}
                <div className={`${styles.messagesArea} ${!selectedChat ? styles.hideOnMobile : ""}`}>
                    {selectedChat ? (
                        <>
                            <div className={styles.messagesHeader}>
                                <div className={styles.customerInfo}>
                                    <button
                                        className={styles.backButtonMobile}
                                        onClick={() => setSelectedChat(null)}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <div className={styles.customerAvatar}>
                                        <User size={24} />
                                    </div>
                                    <div className={styles.customerDetails}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <h3>{selectedChat.customerName}</h3>
                                            <span className={`${styles.statusBadge} ${selectedChat.status === 'open' ? styles.statusOpen : styles.statusClosed}`}>
                                                {selectedChat.status?.toUpperCase() || 'OPEN'}
                                            </span>
                                        </div>
                                        <p>{selectedChat.customerEmail}</p>
                                    </div>
                                    {selectedChat.status === 'open' && (
                                        <button
                                            onClick={async () => {
                                                const chatRef = doc(db, "chats", selectedChat.id);
                                                await updateDoc(chatRef, { status: 'closed' });
                                                setSelectedChat(prev => prev ? { ...prev, status: 'closed' } : null);
                                            }}
                                            className={styles.closeBtn}
                                        >
                                            CLOSE
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className={styles.messagesContainer}>
                                {messages.map(message => (
                                    <div
                                        key={message.id}
                                        className={`${styles.message} ${message.senderRole === 'support' ? styles.ownMessage : styles.customerMessage}`}
                                    >
                                        <div className={styles.messageBubble}>
                                            {message.senderRole === 'customer' && (
                                                <div className={styles.messageSender}>{message.senderName}</div>
                                            )}
                                            {message.imageUrl ? (
                                                <div className={styles.messageImageContainer}>
                                                    <img src={message.imageUrl} alt="Message" className={styles.messageImage} onClick={() => setPreviewImage(message.imageUrl || null)} />
                                                </div>
                                            ) : (
                                                <div className={styles.messageText}>{message.text}</div>
                                            )}
                                            <div className={styles.messageTime}>
                                                {formatTime(message.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {previewImage && (
                                <div className={styles.previewOverlay} onClick={() => setPreviewImage(null)}>
                                    <div className={styles.previewContent}>
                                        <img src={previewImage} alt="Preview" />
                                        <button className={styles.closePreview} onClick={() => setPreviewImage(null)}>
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={sendMessage} className={styles.inputContainer}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <button
                                    type="button"
                                    className={styles.uploadButton}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? <Loader2 className={styles.spin} size={20} /> : <ImageIcon size={20} />}
                                </button>
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type your message..."
                                    className={styles.input}
                                    maxLength={500}
                                />
                                <button
                                    type="submit"
                                    className={styles.sendButton}
                                    disabled={!inputText.trim() || uploading}
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className={styles.noSelection}>
                            <MessageCircle size={64} color="var(--accent)" style={{ opacity: 0.2 }} />
                            <p>Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
