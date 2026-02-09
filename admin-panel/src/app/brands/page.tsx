"use client";

import { useState, useEffect } from "react";
import { db } from "@/services/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import styles from "./brands.module.css";
import { Plus, Trash2, Edit, ImageIcon, X, Loader2, Camera } from "lucide-react";

interface Brand {
    id: string;
    name: {
        fr: string;
        "ar-tn": string;
    };
    image?: string;
    createdAt?: any;
    updatedAt?: any;
}

export default function BrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [nameFr, setNameFr] = useState("");
    const [nameAr, setNameAr] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "brands"), orderBy("name.fr", "asc"));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Brand[];
            setBrands(data);
        } catch (error) {
            console.error("Error fetching brands:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
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
                    setError("Échec de l'upload de l'image");
                }
            } catch (err) {
                setError("Erreur lors de l'upload");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const data = {
                name: { fr: nameFr, "ar-tn": nameAr },
                image: imageUrl,
                updatedAt: serverTimestamp()
            };

            if (editingBrand) {
                await updateDoc(doc(db, "brands", editingBrand.id), data);
            } else {
                await addDoc(collection(db, "brands"), {
                    ...data,
                    createdAt: serverTimestamp()
                });
            }

            setShowModal(false);
            resetForm();
            fetchBrands();
        } catch (error: any) {
            console.error("Error saving brand:", error);
            setError("Erreur lors de l'enregistrement: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (brand: Brand) => {
        setEditingBrand(brand);
        setNameFr(brand.name.fr);
        setNameAr(brand.name["ar-tn"]);
        setImageUrl(brand.image || "");
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette marque ?")) return;
        try {
            await deleteDoc(doc(db, "brands", id));
            fetchBrands();
        } catch (error) {
            console.error("Error deleting brand:", error);
        }
    };

    const resetForm = () => {
        setEditingBrand(null);
        setNameFr("");
        setNameAr("");
        setImageUrl("");
        setError("");
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Gestion des Marques</h1>
                    <p className={styles.subtitle}>Gérez les marques de vos produits</p>
                </div>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary">
                    <Plus size={18} /> <span>Nouvelle Marque</span>
                </button>
            </header>

            <div className={styles.tableCard}>
                {loading ? (
                    <div className={styles.loader}>
                        <Loader2 className={styles.spin} />
                        <p>Chargement...</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Logo</th>
                                <th>Nom (Français)</th>
                                <th>Nom (Arabe)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {brands.map((brand) => (
                                <tr key={brand.id}>
                                    <td>
                                        <div className={styles.brandThumb}>
                                            {brand.image ? (
                                                <img src={brand.image} alt={brand.name.fr} />
                                            ) : (
                                                <ImageIcon size={20} />
                                            )}
                                        </div>
                                    </td>
                                    <td>{brand.name.fr}</td>
                                    <td>{brand.name["ar-tn"]}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button onClick={() => handleEdit(brand)} className={styles.iconBtn}><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(brand.id)} className={styles.iconBtn}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {brands.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: "center", padding: "40px" }}>
                                        Aucune marque trouvée.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editingBrand ? "Modifier la Marque" : "Ajouter une Marque"}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {error && <div className={styles.error}>{error}</div>}

                            <div className={styles.inputGroup}>
                                <label className={styles.columnLabel}>Logo de la marque</label>
                                <label className={styles.imageUploadArea}>
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="Preview" className={styles.previewImage} />
                                    ) : (
                                        <div className={styles.uploadPrompt}>
                                            {uploading ? <Loader2 className={styles.spin} /> : <Camera size={32} />}
                                            <p>{uploading ? "Upload..." : "Sélectionner un logo"}</p>
                                        </div>
                                    )}
                                    <input type="file" className={styles.hiddenInput} onChange={handleImageChange} accept="image/*" />
                                </label>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Nom (Français)</label>
                                <input value={nameFr} onChange={(e) => setNameFr(e.target.value)} placeholder="Ex: Nike" required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Nom (Arabe)</label>
                                <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="Ex: نايكي" required />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                                <button type="submit" className="btn-primary" disabled={submitting || uploading}>
                                    {submitting ? "Enregistrement..." : "Enregistrer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
