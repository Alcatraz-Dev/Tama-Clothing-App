"use client";

import { useState } from "react";
import { db } from "@/services/firebase";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { Megaphone, Loader2, ImageIcon, X } from "lucide-react";
import styles from "./notifications.module.css";

export default function NotificationsPage() {
    const [title, setTitle] = useState("");
    const [titleAr, setTitleAr] = useState("");
    const [message, setMessage] = useState("");
    const [messageAr, setMessageAr] = useState("");
    const [sending, setSending] = useState(false);

    // Image Upload State
    const [image, setImage] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploading(true);

            try {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();
                if (res.ok) {
                    setImage(data.url);
                } else {
                    alert("Upload failed: " + (data.error || "Unknown error"));
                }
            } catch (err) {
                console.error("Upload error:", err);
                alert("Upload failed");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSend = async () => {
        if (!title || !message) return alert("Title and Message are required");
        setSending(true);
        try {
            await addDoc(collection(db, "notifications"), {
                userId: "ALL",
                title,
                titleAr: titleAr || title,
                message,
                messageAr: messageAr || message,
                image: image || null,
                read: false,
                type: "broadcast",
                createdAt: serverTimestamp()
            });

            // Broadcast Push Notification
            const usersSnap = await getDocs(collection(db, "users"));
            const tokens: string[] = [];
            usersSnap.forEach((doc) => {
                const d = doc.data();
                if (d.expoPushToken) tokens.push(d.expoPushToken);
            });
            const uniqueTokens = [...new Set(tokens)];

            if (uniqueTokens.length > 0) {
                const chunkArray = (myArray: string[], chunk_size: number) => {
                    let results = [];
                    while (myArray.length) {
                        results.push(myArray.splice(0, chunk_size));
                    }
                    return results;
                };

                const chunks = chunkArray([...uniqueTokens], 100);

                // Combined push notification text for broadcast
                const combinedTitle = titleAr ? `${titleAr} | ${title}` : title;
                const combinedBody = messageAr ? `${messageAr} | ${message}` : message;

                for (const chunk of chunks) {
                    const pushMessages = chunk.map(token => ({
                        to: token,
                        sound: 'default',
                        title: combinedTitle,
                        body: combinedBody,
                        data: { type: 'broadcast', image: image || null },
                    }));

                    await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'Accept-encoding': 'gzip, deflate',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(pushMessages),
                    });
                }
            }

            alert("Broadcast sent successfully to " + uniqueTokens.length + " devices");
            setTitle("");
            setTitleAr("");
            setMessage("");
            setMessageAr("");
            setImage("");
        } catch (error) {
            console.error(error);
            alert("Failed to send");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Broadcast Notifications</h1>
                <p className={styles.subtitle}>Send push notifications to all your users instantly.</p>
            </div>

            <div className={styles.card}>
                {/* Image Upload Section */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>NOTIFICATION IMAGE (OPTIONAL)</label>
                    <div
                        className={styles.imageUploadArea}
                        onClick={() => !image && document.getElementById('notif-image-input')?.click()}
                    >
                        {image ? (
                            <>
                                <img src={image} alt="Notification" className={styles.preview} />
                                <button
                                    className={styles.removeImageBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setImage("");
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <div className={styles.uploadPrompt}>
                                {uploading ? (
                                    <Loader2 className={styles.spin} size={24} />
                                ) : (
                                    <>
                                        <ImageIcon size={32} />
                                        <p>CLICK TO UPLOAD BANNER</p>
                                    </>
                                )}
                            </div>
                        )}
                        <input
                            id="notif-image-input"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                            disabled={uploading}
                        />
                    </div>
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>TITLE (FRENCH)</label>
                    <input
                        className={styles.input}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Flash Sale Alert!"
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label} style={{ textAlign: 'right', width: '100%' }}>عنوان الإشعار (العربية)</label>
                    <input
                        className={styles.input}
                        style={{ textAlign: 'right', direction: 'rtl' }}
                        value={titleAr}
                        onChange={(e) => setTitleAr(e.target.value)}
                        placeholder="مثلاً: تنبيه تخفيضات!"
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>MESSAGE (FRENCH)</label>
                    <textarea
                        className={styles.textarea}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message to all users..."
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label} style={{ textAlign: 'right', width: '100%' }}>رسالة الإشعار (العربية)</label>
                    <textarea
                        className={styles.textarea}
                        style={{ textAlign: 'right', direction: 'rtl' }}
                        value={messageAr}
                        onChange={(e) => setMessageAr(e.target.value)}
                        placeholder="اكتب رسالتك لجميع المستخدمين..."
                    />
                </div>

                <button
                    className={styles.button}
                    onClick={handleSend}
                    disabled={sending || uploading}
                >
                    {sending ? <Loader2 className={styles.spin} size={20} /> : <><Megaphone size={18} /> SEND BROADCAST</>}
                </button>
            </div>

            <p className={styles.disclaimer}>
                This will send a notification to ALL registered users.
            </p>
        </div>
    );
}
