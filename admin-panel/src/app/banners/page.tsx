"use client";

import { useState, useEffect } from "react";
import { db } from "@/services/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import styles from "./banners.module.css";
import { Plus, Trash2, Edit, ImageIcon, X, Loader2, Check, ExternalLink } from "lucide-react";

interface Banner {
    id: string;
    title: { fr: string; "ar-tn": string };
    subtitle: { fr: string; "ar-tn": string };
    imageUrl: string;
    isActive: boolean;
    link?: string;
    order: number;
}

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [titleFr, setTitleFr] = useState("");
    const [titleAr, setTitleAr] = useState("");
    const [subtitleFr, setSubtitleFr] = useState("");
    const [subtitleAr, setSubtitleAr] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [link, setLink] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [uploading, setUploading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "banners"), orderBy("order", "asc"));
            const snapshot = await getDocs(q);
            setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Banner[]);
        } catch (error) {
            console.error("Error fetching banners:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploading(true);
            setError("");

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    setImageUrl(data.url);
                } else {
                    setError("Failed to upload image");
                }
            } catch (err) {
                setError("Error uploading image");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageUrl) return setError("L'image est obligatoire");
        setSubmitting(true);

        try {
            const data = {
                title: { fr: titleFr, "ar-tn": titleAr },
                subtitle: { fr: subtitleFr, "ar-tn": subtitleAr },
                imageUrl,
                link,
                isActive,
                updatedAt: serverTimestamp()
            };

            if (editingBanner) {
                await updateDoc(doc(db, "banners", editingBanner.id), data);
            } else {
                await addDoc(collection(db, "banners"), {
                    ...data,
                    order: banners.length,
                    createdAt: serverTimestamp()
                });
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            setError("Error saving banner");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (banner: Banner) => {
        setEditingBanner(banner);
        setTitleFr(banner.title.fr);
        setTitleAr(banner.title["ar-tn"]);
        setSubtitleFr(banner.subtitle.fr);
        setSubtitleAr(banner.subtitle["ar-tn"]);
        setImageUrl(banner.imageUrl);
        setLink(banner.link || "");
        setIsActive(banner.isActive);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cette bannière ?")) return;
        try {
            await deleteDoc(doc(db, "banners", id));
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleStatus = async (banner: Banner) => {
        try {
            await updateDoc(doc(db, "banners", banner.id), {
                isActive: !banner.isActive
            });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setEditingBanner(null);
        setTitleFr("");
        setTitleAr("");
        setSubtitleFr("");
        setSubtitleAr("");
        setImageUrl("");
        setLink("");
        setIsActive(true);
        setError("");
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Bannières & Carousel</h1>
                    <p className={styles.subtitle}>Gérez les bannières publicitaires de la page d'accueil</p>
                </div>
                <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={20} /> <span>Nouvelle Bannière</span>
                </button>
            </div>

            {loading ? (
                <div className={styles.loader}>
                    <Loader2 className={styles.spin} />
                    <p>Chargement...</p>
                </div>
            ) : (
                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Aperçu</th>
                                <th>Contenu</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners.map((banner) => (
                                <tr key={banner.id}>
                                    <td>
                                        <img src={banner.imageUrl} className={styles.bannerThumb} alt="Banner" />
                                    </td>
                                    <td>
                                        <div className={styles.bannerInfo}>
                                            <strong>{banner.title.fr}</strong>
                                            <p>{banner.subtitle.fr}</p>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => toggleStatus(banner)}
                                            className={`${styles.statusBadge} ${banner.isActive ? styles.activeBadge : styles.inactiveBadge}`}
                                        >
                                            {banner.isActive ? "Active" : "Inactive"}
                                        </button>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.iconBtn} onClick={() => handleEdit(banner)}><Edit size={18} /></button>
                                            <button className={styles.iconBtn} onClick={() => handleDelete(banner.id)}><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {banners.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                        Aucune bannière configurée.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editingBanner ? "Modifier la Bannière" : "Nouvelle Bannière"}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {error && <div className={styles.error}>{error}</div>}

                            <div className={styles.inputGroup}>
                                <label className={styles.columnLabel}>Image de Fond (16:9 recommandé)</label>
                                <label className={styles.imageUploadArea}>
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="Preview" className={styles.previewImage} />
                                    ) : (
                                        <div className={styles.uploadPrompt}>
                                            {uploading ? <Loader2 className={styles.spin} /> : <ImageIcon size={40} />}
                                            <p>{uploading ? "Upload en cours..." : "Cliquez pour uploader"}</p>
                                        </div>
                                    )}
                                    <input type="file" className={styles.hiddenInput} onChange={handleImageChange} accept="image/*" />
                                </label>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className={styles.inputGroup}>
                                    <label>Titre (FR)</label>
                                    <input value={titleFr} onChange={e => setTitleFr(e.target.value)} placeholder="ex: NOUVELLE COLLECTION" required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Titre (AR)</label>
                                    <input value={titleAr} onChange={e => setTitleAr(e.target.value)} placeholder="تشكيلة جديدة" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className={styles.inputGroup}>
                                    <label>Sous-titre (FR)</label>
                                    <input value={subtitleFr} onChange={e => setSubtitleFr(e.target.value)} placeholder="ex: Explorez le minimalisme" />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Sous-titre (AR)</label>
                                    <input value={subtitleAr} onChange={e => setSubtitleAr(e.target.value)} placeholder="اكتشف الأناقة" />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Lien / Catégorie ID (Optionnel)</label>
                                <input value={link} onChange={e => setLink(e.target.value)} placeholder="ex: sneakers" />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={submitting || uploading}>
                                    {submitting ? "Enregistrement..." : (editingBanner ? "Sauvegarder" : "Ajouter la Banniére")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
