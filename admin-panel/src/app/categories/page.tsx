"use client";

import { useState, useEffect } from "react";
import { db } from "@/services/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import styles from "./categories.module.css";
import { Plus, Trash2, Edit, ImageIcon, X, Loader2 } from "lucide-react";

interface Category {
    id: string;
    name: {
        fr: string;
        "ar-tn": string;
    };
    slug: string;
    image?: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [nameFr, setNameFr] = useState("");
    const [nameAr, setNameAr] = useState("");
    const [slug, setSlug] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "categories"), orderBy("name.fr", "asc"));
            const querySnapshot = await getDocs(q);
            const cats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
            setCategories(cats);
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
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
                slug: slug.toLowerCase().replace(/\s+/g, "-"),
                image: imageUrl,
                updatedAt: serverTimestamp()
            };

            if (editingCategory) {
                await updateDoc(doc(db, "categories", editingCategory.id), data);
            } else {
                await addDoc(collection(db, "categories"), {
                    ...data,
                    createdAt: serverTimestamp()
                });
            }

            setShowModal(false);
            resetForm();
            fetchCategories();
        } catch (error: any) {
            console.error("Error saving category:", error);
            setError("Erreur lors de l'enregistrement: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setNameFr(category.name.fr);
        setNameAr(category.name["ar-tn"]);
        setSlug(category.slug);
        setImageUrl(category.image || "");
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette catégorie ?")) return;
        try {
            await deleteDoc(doc(db, "categories", id));
            fetchCategories();
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    const resetForm = () => {
        setEditingCategory(null);
        setNameFr("");
        setNameAr("");
        setSlug("");
        setImageUrl("");
        setError("");
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Gestion des Catégories</h1>
                    <p className={styles.subtitle}>Organisez vos produits par types</p>
                </div>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary">
                    <Plus size={18} /> <span>Nouvelle Catégorie</span>
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
                                <th>Image</th>
                                <th>Nom (Français)</th>
                                <th>Nom (Derja)</th>
                                <th>Slug</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id}>
                                    <td>
                                        <div className={styles.categoryThumb}>
                                            {cat.image ? (
                                                <img src={cat.image} alt={cat.name.fr} />
                                            ) : (
                                                <ImageIcon size={20} />
                                            )}
                                        </div>
                                    </td>
                                    <td>{cat.name.fr}</td>
                                    <td>{cat.name["ar-tn"]}</td>
                                    <td><code>{cat.slug}</code></td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button onClick={() => handleEdit(cat)} className={styles.iconBtn}><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(cat.id)} className={styles.iconBtn}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: "40px" }}>
                                        Aucune catégorie trouvée.
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
                            <h2>{editingCategory ? "Modifier la Catégorie" : "Ajouter une Catégorie"}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {error && <div className={styles.error}>{error}</div>}

                            <div className={styles.inputGroup}>
                                <label className={styles.columnLabel}>Image de la catégorie</label>
                                <label className={styles.imageUploadArea}>
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="Preview" className={styles.previewImage} />
                                    ) : (
                                        <div className={styles.uploadPrompt}>
                                            {uploading ? <Loader2 className={styles.spin} /> : <ImageIcon size={32} />}
                                            <p>{uploading ? "Upload..." : "Sélectionner une image"}</p>
                                        </div>
                                    )}
                                    <input type="file" className={styles.hiddenInput} onChange={handleImageChange} accept="image/*" />
                                </label>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Nom (Français)</label>
                                <input value={nameFr} onChange={(e) => setNameFr(e.target.value)} placeholder="Ex: Femmes" required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Nom (Derja)</label>
                                <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="Ex: نساء" required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Slug</label>
                                <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="women" required />
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
