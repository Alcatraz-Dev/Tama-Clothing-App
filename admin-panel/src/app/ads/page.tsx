"use client";

import { useState, useEffect } from "react";
import { db } from "@/services/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import styles from "./ads.module.css";
import { Plus, Trash2, Edit, ImageIcon, X, Loader2, Play } from "lucide-react";

interface Ad {
    id: string;
    title: { fr: string; "ar-tn": string };
    description?: { fr: string; "ar-tn": string };
    url: string;
    type: "image" | "video";
    isActive: boolean;
    targetType: 'none' | 'product' | 'category';
    targetId: string;
    link?: string; // Legacy
    order: number;
}

export default function AdsPage() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [categories, setCategories] = useState<any[]>([]); // To populate link dropdown
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [titleFr, setTitleFr] = useState("");
    const [titleAr, setTitleAr] = useState("");
    const [descFr, setDescFr] = useState("");
    const [descAr, setDescAr] = useState("");
    const [url, setUrl] = useState("");
    const [type, setType] = useState<"image" | "video">("image");
    const [targetType, setTargetType] = useState<'none' | 'product' | 'category'>('none');
    const [targetId, setTargetId] = useState("");
    const [products, setProducts] = useState<any[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [uploading, setUploading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "ads"), orderBy("order", "asc"));
            const snapshot = await getDocs(q);
            setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ad[]);

            const catSnap = await getDocs(collection(db, "categories"));
            setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const prodSnap = await getDocs(collection(db, "products"));
            setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
                    setUrl(data.url);

                    // Automatically detect type from file mime or extension
                    const isVideo = file.type.startsWith('video/') || data.url.endsWith('.mp4') || data.url.endsWith('.mov');
                    if (isVideo) {
                        setType('video');
                    } else {
                        setType('image');
                    }
                } else {
                    setError("Failed to upload file");
                }
            } catch (err) {
                setError("Error uploading file");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return setError("Le média est obligatoire");
        setSubmitting(true);

        try {
            const data = {
                title: { fr: titleFr, "ar-tn": titleAr },
                description: { fr: descFr, "ar-tn": descAr },
                url,
                type,
                targetType,
                targetId,
                isActive,
                updatedAt: serverTimestamp()
            };

            if (editingAd) {
                await updateDoc(doc(db, "ads", editingAd.id), data);
            } else {
                await addDoc(collection(db, "ads"), {
                    ...data,
                    order: ads.length,
                    createdAt: serverTimestamp()
                });
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            setError("Error saving ad");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (ad: Ad) => {
        setEditingAd(ad);
        setTitleFr(ad.title.fr);
        setTitleAr(ad.title["ar-tn"]);
        setDescFr(ad.description?.fr || "");
        setDescAr(ad.description?.["ar-tn"] || "");
        setUrl(ad.url);
        setType(ad.type);
        setTargetType(ad.targetType || (ad.link ? 'category' : 'none'));
        setTargetId(ad.targetId || ad.link || "");
        setIsActive(ad.isActive);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cette publicité ?")) return;
        try {
            await deleteDoc(doc(db, "ads", id));
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleStatus = async (ad: Ad) => {
        try {
            await updateDoc(doc(db, "ads", ad.id), {
                isActive: !ad.isActive
            });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setEditingAd(null);
        setTitleFr("");
        setTitleAr("");
        setDescFr("");
        setDescAr("");
        setUrl("");
        setType("image");
        setTargetType("none");
        setTargetId("");
        setIsActive(true);
        setError("");
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Publicités & Campagnes</h1>
                    <p className={styles.subtitle}>Gérez les publicités (Image ou Vidéo) de l'application</p>
                </div>
                <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={20} /> <span>Nouvelle Publicité</span>
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
                                <th>Média</th>
                                <th>Type</th>
                                <th>Titre</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ads.map((ad) => (
                                <tr key={ad.id}>
                                    <td>
                                        {ad.type === 'video' ? (
                                            <video
                                                src={ad.url}
                                                className={styles.adThumb}
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                                style={{ objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <img src={ad.url} className={styles.adThumb} alt="Ad" />
                                        )}
                                    </td>
                                    <td>
                                        <span className={styles.typeBadge}>{ad.type.toUpperCase()}</span>
                                    </td>
                                    <td>
                                        <div className={styles.adInfo}>
                                            <strong>{ad.title.fr}</strong>
                                            <p style={{ fontSize: 11, color: '#999' }}>
                                                {ad.targetType ? `${ad.targetType.toUpperCase()}: ${ad.targetId}` : "Aucune action"}
                                            </p>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => toggleStatus(ad)}
                                            className={`${styles.statusBadge} ${ad.isActive ? styles.activeBadge : styles.inactiveBadge}`}
                                        >
                                            {ad.isActive ? "Active" : "Inactive"}
                                        </button>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.iconBtn} onClick={() => handleEdit(ad)}><Edit size={18} /></button>
                                            <button className={styles.iconBtn} onClick={() => handleDelete(ad.id)}><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {ads.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                        Aucune publicité configurée.
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
                            <h2>{editingAd ? "Modifier la Publicité" : "Nouvelle Publicité"}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {error && <div className={styles.error}>{error}</div>}

                            <div className={styles.inputGroup}>
                                <label>Média (Image ou Vidéo)</label>
                                <label className={styles.imageUploadArea}>
                                    {url ? (
                                        type === 'video' ? (
                                            <video
                                                src={url}
                                                className={styles.previewImage}
                                                controls
                                                autoPlay
                                                muted
                                                style={{ backgroundColor: '#000', objectFit: 'contain' }}
                                            />
                                        ) : (
                                            <img src={url} alt="Preview" className={styles.previewImage} />
                                        )
                                    ) : (
                                        <div className={styles.uploadPrompt}>
                                            {uploading ? <Loader2 className={styles.spin} /> : <ImageIcon size={40} />}
                                            <p>{uploading ? "Upload en cours..." : "Cliquez pour uploader"}</p>
                                        </div>
                                    )}
                                    <input type="file" className={styles.hiddenInput} onChange={handleFileChange} accept="image/*,video/*" />
                                </label>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Type de Média</label>
                                <select value={type} onChange={e => setType(e.target.value as any)}>
                                    <option value="image">Image</option>
                                    <option value="video">Vidéo</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className={styles.inputGroup}>
                                    <label>Titre (FR)</label>
                                    <input value={titleFr} onChange={e => setTitleFr(e.target.value)} placeholder="ex: OFFRE SPÉCIALE" required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Titre (AR)</label>
                                    <input value={titleAr} onChange={e => setTitleAr(e.target.value)} placeholder="عرض خاص" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className={styles.inputGroup}>
                                    <label>Description (FR)</label>
                                    <textarea value={descFr} onChange={e => setDescFr(e.target.value)} placeholder="Histoire de la campagne..." />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Description (AR)</label>
                                    <textarea value={descAr} onChange={e => setDescAr(e.target.value)} placeholder="قصة الحملة..." dir="rtl" />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Action au clic (Target)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    {['none', 'product', 'category'].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            className={`${styles.typeToggle} ${targetType === t ? styles.activeType : ''}`}
                                            onClick={() => setTargetType(t as any)}
                                        >
                                            {t.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {targetType !== 'none' && (
                                <div className={styles.inputGroup}>
                                    <label>{targetType === 'product' ? 'Sélectionner un Produit' : 'Sélectionner une Catégorie'}</label>
                                    <select value={targetId} onChange={e => setTargetId(e.target.value)} required>
                                        <option value="">Choisir...</option>
                                        {targetType === 'product' ? (
                                            products.map(p => <option key={p.id} value={p.id}>{p.name.fr}</option>)
                                        ) : (
                                            categories.map(c => <option key={c.id} value={c.id}>{c.name.fr}</option>)
                                        )}
                                    </select>
                                </div>
                            )}

                            <div className={styles.modalActions}>
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={submitting || uploading}>
                                    {submitting ? "Enregistrement..." : (editingAd ? "Sauvegarder" : "Ajouter la Publicité")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
