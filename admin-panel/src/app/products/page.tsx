"use client";

import { useState, useEffect } from "react";
import { db, storage } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from "@/context/LanguageContext";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
    where
} from 'firebase/firestore';
import styles from "./products.module.css";
import { Plus, Trash2, Edit, ImageIcon, X, Loader2, Copy } from "lucide-react";

interface Product {
    id: string;
    name: { fr: string; "ar-tn": string };
    price: number;
    discountPrice?: number;
    deliveryPrice?: number;
    categoryId: string;
    mainImage: string;
    images?: string[]; // Additional images
    description?: { fr: string, "ar-tn": string };
    sizes?: string[];
    colors?: string[];
    brandId?: string;
    brandName?: string;
    status?: string;
    createdAt: any;
}

interface Category {
    id: string;
    name: { fr: string; "ar-tn": string };
}

interface Brand {
    id: string;
    name: { fr: string; "ar-tn": string };
}

export default function ProductsPage() {
    const { isBrandOwner, brandId: authBrandId } = useAuth();
    const { t, isRTL } = useTranslation();
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [nameFr, setNameFr] = useState("");
    const [nameAr, setNameAr] = useState("");
    const [price, setPrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("");
    const [deliveryPrice, setDeliveryPrice] = useState("7");
    const [categoryId, setCategoryId] = useState("");
    const [selectedBrandId, setSelectedBrandId] = useState("");
    const [descriptionFr, setDescriptionFr] = useState("");
    const [descriptionAr, setDescriptionAr] = useState("");
    const [sizes, setSizes] = useState<string[]>([]);
    const [colors, setColors] = useState<string[]>([]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [mainImageUrl, setMainImageUrl] = useState("");
    const [additionalImages, setAdditionalImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSoldOut, setIsSoldOut] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            let pQuery;
            if (isBrandOwner && authBrandId) {
                pQuery = query(collection(db, "products"), where("brandId", "==", authBrandId), orderBy("createdAt", "desc"));
            } else {
                pQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
            }
            const pSnapshot = await getDocs(pQuery);
            setProducts(pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);

            const cSnapshot = await getDocs(collection(db, "categories"));
            setCategories(cSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]);

            const bSnapshot = await getDocs(collection(db, "brands"));
            setBrands(bSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Brand[]);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean = true) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (isMain) setImagePreview(URL.createObjectURL(file));
            setUploading(true);
            setUploadProgress(0);
            setError("");

            try {
                const formData = new FormData();
                formData.append('file', file);

                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/upload', true);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const progress = (event.loaded / event.total) * 100;
                        setUploadProgress(progress);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        const response = JSON.parse(xhr.responseText);
                        if (isMain) {
                            setMainImageUrl(response.url);
                        } else {
                            setAdditionalImages(prev => [...prev, response.url]);
                        }
                        setUploading(false);
                    } else {
                        const errResponse = JSON.parse(xhr.responseText);
                        setError("Upload failed: " + (errResponse.error || xhr.statusText));
                        setUploading(false);
                    }
                };

                xhr.onerror = () => {
                    setError("Network error during upload.");
                    setUploading(false);
                };

                xhr.send(formData);
            } catch (err: any) {
                console.error("Cloudinary upload error:", err);
                setError("Échec de l'upload: " + err.message);
                setUploading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (uploading) {
            setError("Veuillez attendre la fin de l'upload de l'image.");
            return;
        }
        setSubmitting(true);
        setError("");

        try {
            const bName = brands.find(b => b.id === (isBrandOwner ? authBrandId : selectedBrandId))?.name;

            const productData = {
                name: { fr: nameFr, "ar-tn": nameAr || nameFr },
                price: parseFloat(price),
                discountPrice: discountPrice ? parseFloat(discountPrice) : null,
                deliveryPrice: parseFloat(deliveryPrice || "7"),
                categoryId,
                brandId: isBrandOwner ? authBrandId : selectedBrandId,
                brandName: bName,
                description: { fr: descriptionFr, "ar-tn": descriptionAr || descriptionFr },
                sizes,
                colors,
                mainImage: mainImageUrl,
                images: additionalImages,
                status: isSoldOut ? "sold_out" : "active",
                updatedAt: serverTimestamp(),
            };

            if (editingProduct) {
                await updateDoc(doc(db, "products", editingProduct.id), productData);
            } else {
                await addDoc(collection(db, "products"), {
                    ...productData,
                    createdAt: serverTimestamp(),
                });
            }

            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            console.error("Final error:", error);
            setError("Erreur fatale: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (p: Product) => {
        setEditingProduct(p);
        setNameFr(p.name.fr);
        setNameAr(p.name["ar-tn"]);
        setPrice(p.price.toString());
        setDiscountPrice(p.discountPrice?.toString() || "");
        setDeliveryPrice(p.deliveryPrice?.toString() || "7");
        setCategoryId(p.categoryId);
        setSelectedBrandId(p.brandId || "");
        setDescriptionFr(p.description?.fr || "");
        setDescriptionAr(p.description?.["ar-tn"] || "");
        setSizes(p.sizes || []);
        setColors(p.colors || []);
        setMainImageUrl(p.mainImage);
        setImagePreview(p.mainImage);
        setAdditionalImages(p.images || []);
        setIsSoldOut(p.status === "sold_out");
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingProduct(null);
        setNameFr("");
        setNameAr("");
        setPrice("");
        setDiscountPrice("");
        setDeliveryPrice("7");
        setCategoryId("");
        setSelectedBrandId("");
        setDescriptionFr("");
        setDescriptionAr("");
        setSizes([]);
        setColors([]);
        setImagePreview(null);
        setMainImageUrl("");
        setAdditionalImages([]);
        setIsSoldOut(false);
        setUploading(false);
        setUploadProgress(0);
        setError("");
    };

    const handleDelete = async (id: string) => {
        if (confirm("Voulez-vous supprimer ce produit ?")) {
            try {
                await deleteDoc(doc(db, "products", id));
                fetchData();
            } catch (error) {
                console.error("Error deleting product:", error);
            }
        }
    };

    const handleDuplicate = async (product: Product) => {
        try {
            // Create a copy of the product with modified name
            const duplicateData = {
                name: {
                    fr: product.name.fr + " (Copie)",
                    "ar-tn": product.name["ar-tn"] ? product.name["ar-tn"] + " (نسخة)" : ""
                },
                price: product.price,
                discountPrice: product.discountPrice || null,
                deliveryPrice: product.deliveryPrice || 7,
                categoryId: product.categoryId,
                mainImage: product.mainImage,
                images: product.images || [],
                description: product.description || { fr: "", "ar-tn": "" },
                sizes: product.sizes || [],
                colors: product.colors || [],
                brandId: product.brandId || null,
                brandName: product.brandName || "",
                status: "draft", // Set as draft so it needs review
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "products"), duplicateData);
            fetchData();
            alert(isRTL ? "تم نسخ المنتج بنجاح" : "Produit copié avec succès");
        } catch (error) {
            console.error("Error duplicating product:", error);
            alert(isRTL ? "خطأ في نسخ المنتج" : "Erreur lors de la copie du produit");
        }
    };

    const toggleSize = (size: string) => {
        setSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    };

    const addColor = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.currentTarget.value.trim();
            if (val && !colors.includes(val)) {
                console.log('Adding color:', val);
                setColors([...colors, val]);
                e.currentTarget.value = "";
            } else if (colors.includes(val)) {
                alert('Color already added');
            }
        }
    };

    const removeColor = (color: string) => {
        setColors(colors.filter(c => c !== color));
    };

    const removeAdditionalImage = (idx: number) => {
        setAdditionalImages(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Gestion des Produits</h1>
                    <p className={styles.subtitle}>{products.length} produits enregistrés</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => { setEditingProduct(null); resetForm(); setShowModal(true); }}
                >
                    <Plus size={20} />
                    <span>{isRTL ? "منتج جديد" : "Nouveau Produit"}</span>
                </button>
            </div>

            {loading ? (
                <div className={styles.loader}>
                    <Loader2 className={styles.spin} />
                    <p>{isRTL ? "جاري تحميل المنتجات..." : "Chargement des produits..."}</p>
                </div>
            ) : (
                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{t('image')}</th>
                                <th>{t('name')}</th>
                                <th>{t('price')}</th>
                                <th>{t('category')} / {t('brand')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className={styles.productThumb}>
                                            {(p.mainImage || p.images?.[0]) ? (
                                                <img src={p.mainImage || p.images?.[0]} alt={p.name.fr} className={styles.productImage} />
                                            ) : (
                                                <div className={styles.imagePlaceholder}><ImageIcon size={20} /></div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.productNameCell}>
                                            <strong>{p.name.fr}</strong>
                                            <span>{p.name["ar-tn"]}</span>
                                            {p.status === 'sold_out' && <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>● RUPTURE DE STOCK</span>}
                                        </div>
                                    </td>
                                    <td className={styles.priceCell}>{p.price.toFixed(3)} DT</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className={styles.categoryBadge}>
                                                {categories.find(c => c.id === p.categoryId)?.name[isRTL ? "ar-tn" : "fr"] || (isRTL ? "غير معروف" : "Inconnu")}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 'bold' }}>•</span>
                                            <span className={styles.categoryBadge} style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                                                {brands.find(b => b.id === p.brandId)?.name[isRTL ? "ar-tn" : "fr"] || (isRTL ? "لا يوجد" : "Aucune")}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button onClick={() => handleDuplicate(p)} className={styles.iconBtn} title={isRTL ? "نسخ" : "Copier"}><Copy size={16} /></button>
                                            <button onClick={() => handleEdit(p)} className={styles.iconBtn} title="Modifier"><Edit size={16} /></button>
                                            <button
                                                className={styles.iconBtn}
                                                onClick={() => handleDelete(p.id)}
                                                title="Supprimer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
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
                            <h2>{editingProduct ? (isRTL ? "تعديل المنتج" : "Modifier le Produit") : (isRTL ? "منتج جديد" : "Nouveau Produit")}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGrid} style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)' }}>
                                <div className={styles.formColumn}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '15px', backgroundColor: 'var(--input-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '14px' }}>{isRTL ? "حالة نفاذ الكمية" : "Statut Rupture de Stock"}</h4>
                                            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{isRTL ? "تحديد إذا كان المنتج غير متوفر" : "Cocher si le produit n'est plus disponible"}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={isSoldOut}
                                            onChange={(e) => setIsSoldOut(e.target.checked)}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className={styles.inputGroup}>
                                            <label>{isRTL ? "الاسم (فرنسي)" : "Nom (Français)"}</label>
                                            <input value={nameFr} onChange={(e) => setNameFr(e.target.value)} placeholder="Nom FR" required />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>{isRTL ? "الاسم (عربي)" : "Nom (Arabe)"}</label>
                                            <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="Nom AR" required dir="rtl" />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className={styles.inputGroup}>
                                            <label>{isRTL ? "السعر (د.ت)" : "Prix (DT)"}</label>
                                            <input type="number" step="0.001" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.000" required />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>{isRTL ? "سعر التوصيل (د.ت)" : "Prix de Livraison (DT)"}</label>
                                            <input type="number" step="0.001" value={deliveryPrice} onChange={(e) => setDeliveryPrice(e.target.value)} placeholder="7.000" required />
                                        </div>
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>{t('category')}</label>
                                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                                            <option value="">{isRTL ? "اختر" : "Sélectionner"}</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{isRTL ? c.name["ar-tn"] : c.name.fr}</option>)}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Marque</label>
                                        <select
                                            value={isBrandOwner ? authBrandId || "" : selectedBrandId}
                                            onChange={(e) => setSelectedBrandId(e.target.value)}
                                            disabled={isBrandOwner}
                                            required
                                        >
                                            <option value="">{isRTL ? "اختر علامة تجارية" : "Sélectionner une marque"}</option>
                                            {brands.map(b => (
                                                <option key={b.id} value={b.id}>{b.name?.fr || (b.name as any)}</option>
                                            ))}
                                        </select>
                                    </div>         <div className={styles.inputGroup}>
                                        <label>{isRTL ? "الوصف (فرنسي)" : "Description (Français)"}</label>
                                        <textarea
                                            value={descriptionFr}
                                            onChange={(e) => setDescriptionFr(e.target.value)}
                                            placeholder="Description en français..."
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Description (Arabe)</label>
                                        <textarea
                                            value={descriptionAr}
                                            onChange={(e) => setDescriptionAr(e.target.value)}
                                            placeholder="الوصف بالعربية..."
                                            dir="rtl"
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label style={{ marginBottom: 0 }}>Tailles Disponibles</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSizes(['XS', 'S', 'M', 'L', 'XL', 'XXL'])}
                                                    className={styles.sizeQuickBtn}
                                                >
                                                    + Alpha
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSizes(['36', '38', '40', '42', '44', '46'])}
                                                    className={styles.sizeQuickBtn}
                                                >
                                                    + Numérique
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.sizeSelectionGrid}>
                                            {['TU', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44', '46'].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => toggleSize(s)}
                                                    className={`${styles.sizeTag} ${sizes.includes(s) ? styles.activeSize : ''}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.formColumn}>
                                    <label className={styles.columnLabel}>{isRTL ? "الصورة الرئيسية" : "Image Principale"}</label>
                                    <div className={styles.imageUploadArea} onClick={() => document.getElementById('imageInput')?.click()}>
                                        {imagePreview ? (
                                            <div className={styles.previewContainer}>
                                                <img src={imagePreview} className={styles.preview} alt="Preview" />
                                                {uploading && <div className={styles.uploadOverlay}><div className={styles.progressCircle}><span>{Math.round(uploadProgress)}%</span></div></div>}
                                                {mainImageUrl && !uploading && <div className={styles.successBadge}>{isRTL ? "جاهز" : "PRÊT"}</div>}
                                            </div>
                                        ) : (
                                            <div className={styles.uploadPrompt}>
                                                <ImageIcon size={40} strokeWidth={1} />
                                                <p>{isRTL ? "اضغط لإضافة صورة" : "Cliquer pour ajouter une image"}</p>
                                            </div>
                                        )}
                                        <input id="imageInput" type="file" accept="image/*" onChange={handleImageChange} className={styles.hiddenInput} disabled={uploading} />
                                    </div>

                                    <div className={styles.inputGroup} style={{ marginTop: '20px' }}>
                                        <label className={styles.columnLabel}>{isRTL ? "صور إضافية" : "Images Additionnelles"}</label>
                                        <div className={styles.additionalImagesGrid}>
                                            {additionalImages.map((img, idx) => (
                                                <div key={idx} className={styles.additionalImageItem}>
                                                    <img src={img} alt="" />
                                                    <button type="button" onClick={() => removeAdditionalImage(idx)} className={styles.removeImgBtn}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                className={styles.addImgBtn}
                                                onClick={() => document.getElementById('additionalImageInput')?.click()}
                                                disabled={uploading}
                                            >
                                                {uploading ? <Loader2 className={styles.spin} size={20} /> : <Plus size={24} />}
                                            </button>
                                            <input
                                                id="additionalImageInput"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageChange(e, false)}
                                                className={styles.hiddenInput}
                                                disabled={uploading}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.inputGroup} style={{ marginTop: '20px' }}>
                                        <label>{isRTL ? "الألوان (الاسم أو الكود، مثال: #FF0000 أو Red)" : "Couleurs (Hex ou Nom, ex: #FF0000 ou Red)"}</label>
                                        <input onKeyDown={addColor} placeholder={isRTL ? "مثال: Blue أو #000000" : "ex: #000000 ou Red, Blue, etc."} />
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                                            {colors.map(c => (
                                                <div key={c} style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--input-bg)', padding: '4px 10px', borderRadius: '8px', gap: '8px', border: '1px solid var(--border)' }}>
                                                    <div style={{ width: '16px', height: '16px', borderRadius: '8px', backgroundColor: c, border: '1px solid var(--border)' }} />
                                                    <span style={{ fontSize: '11px', fontWeight: 600 }}>{c}</span>
                                                    <button type="button" onClick={() => removeColor(c)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '10px', color: 'var(--text-muted)' }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && <p className={styles.error}>{error}</p>}

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ backgroundColor: 'transparent', color: 'var(--foreground)' }}>{t('cancel')}</button>
                                <button type="submit" className="btn-primary" disabled={submitting || uploading}>
                                    {submitting ? (isRTL ? "جاري الحفظ..." : "Enregistrement...") : (editingProduct ? t('save') : (isRTL ? "إنشاء المنتج" : "Créer le produit"))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
