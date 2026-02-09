"use client";

import { useState, useEffect } from "react";
import { db } from "@/services/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import styles from "./promo-banners.module.css";
import { Plus, Trash2, Edit, ImageIcon, X, Loader2, Save } from "lucide-react";

interface PromoBanner {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    isActive: boolean;
    order: number;
    backgroundColor?: string;
}

export default function PromoBannersPage() {
    const [banners, setBanners] = useState<PromoBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [backgroundColor, setBackgroundColor] = useState("#FF2D55");
    const [uploading, setUploading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "promoBanners"), orderBy("order", "asc"));
            const snapshot = await getDocs(q);
            setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PromoBanner[]);
        } catch (error) {
            console.error("Error fetching promo banners:", error);
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
                title,
                description,
                imageUrl,
                isActive,
                backgroundColor,
                updatedAt: serverTimestamp()
            };

            if (editingBanner) {
                await updateDoc(doc(db, "promoBanners", editingBanner.id), data);
            } else {
                await addDoc(collection(db, "promoBanners"), {
                    ...data,
                    order: banners.length,
                    createdAt: serverTimestamp()
                });
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            setError("Error saving promo banner");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (banner: PromoBanner) => {
        setEditingBanner(banner);
        setTitle(banner.title);
        setDescription(banner.description);
        setImageUrl(banner.imageUrl);
        setIsActive(banner.isActive);
        setBackgroundColor(banner.backgroundColor || "#FF2D55");
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cette promotion ?")) return;
        try {
            await deleteDoc(doc(db, "promoBanners", id));
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setEditingBanner(null);
        setTitle("");
        setDescription("");
        setImageUrl("");
        setIsActive(true);
        setBackgroundColor("#FF2D55");
        setError("");
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Promotions (Pink Banners)</h1>
                    <p className={styles.subtitle}>Gérez les bannières promotionnelles horizontales</p>
                </div>
                <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={20} /> <span>Nouvelle Promotion</span>
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
                                <th>Titre</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners.map((banner) => (
                                <tr key={banner.id}>
                                    <td>
                                        <div className={styles.bannerThumbWrapper} style={{ backgroundColor: banner.backgroundColor }}>
                                            <img src={banner.imageUrl} className={styles.bannerThumb} alt="Promo" />
                                        </div>
                                    </td>
                                    <td>
                                        <strong>{banner.title}</strong>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${banner.isActive ? styles.activeBadge : styles.inactiveBadge}`}>
                                            {banner.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.iconBtn} onClick={() => handleEdit(banner)}><Edit size={18} /></button>
                                            <button className={styles.iconBtn} onClick={() => handleDelete(banner.id)}><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editingBanner ? "Modifier la Promotion" : "Nouvelle Promotion"}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {error && <div className={styles.error}>{error}</div>}

                            <div className={styles.inputGroup}>
                                <label className={styles.columnLabel}>Image (Asset promotionnel)</label>
                                <label className={styles.imageUploadArea}>
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="Preview" className={styles.previewImage} />
                                    ) : (
                                        <div className={styles.uploadPrompt}>
                                            {uploading ? <Loader2 className={styles.spin} /> : <ImageIcon size={40} />}
                                            <p>{uploading ? "Upload..." : "Cliquez pour uploader"}</p>
                                        </div>
                                    )}
                                    <input type="file" className={styles.hiddenInput} onChange={handleImageChange} accept="image/*" />
                                </label>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Titre de la Promotion</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="ex: SUMMER SALE" required />
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Description / Offre</label>
                                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="ex: UP TO 50% OFF" />
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Couleur de Fond</label>
                                <input type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} style={{ height: '40px', padding: '2px' }} />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={submitting || uploading}>
                                    <Save size={18} /> <span>{submitting ? "Enregistrement..." : "Enregistrer"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
