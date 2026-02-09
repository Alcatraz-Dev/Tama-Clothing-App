"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/services/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { Zap, Clock, CheckCircle2, Save, Loader2 } from "lucide-react";
import styles from "./flash-sale.module.css";

export default function FlashSalePage() {
    const [active, setActive] = useState(false);
    const [title, setTitle] = useState("");
    const [endTime, setEndTime] = useState("");
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const flashSnap = await getDoc(doc(db, "settings", "flashSale"));
            if (flashSnap.exists()) {
                const data = flashSnap.data();
                setActive(data.active || false);
                setTitle(data.title || "");
                setEndTime(data.endTime || "");
                setSelectedProductIds(data.productIds || []);
            }

            const prodSnap = await getDocs(collection(db, "products"));
            setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
            setError("Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            await setDoc(doc(db, "settings", "flashSale"), {
                active,
                title,
                endTime,
                productIds: selectedProductIds,
                updatedAt: new Date(),
            });
            setSuccess("Vente flash mise à jour avec succès !");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error(err);
            setError("Erreur lors de la sauvegarde");
        } finally {
            setSaving(false);
        }
    };

    const toggleProduct = (id: string) => {
        if (selectedProductIds.includes(id)) {
            setSelectedProductIds(selectedProductIds.filter(pid => pid !== id));
        } else {
            setSelectedProductIds([...selectedProductIds, id]);
        }
    };

    if (loading) {
        return (
            <div className={styles.loader}>
                <Loader2 className={styles.spin} />
                <p>Chargement des paramètres...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>Vente Flash</h2>
                    <p className={styles.subtitle}>Gérez le compte à rebours et les produits en promotion</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ gap: '8px', display: 'flex', alignItems: 'center' }}
                >
                    {saving ? <Loader2 size={18} className={styles.spin} /> : <Save size={18} />}
                    {saving ? "Sauvegarde..." : "Enregistrer"}
                </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <div className={styles.grid}>
                <div className={styles.settingsCard}>
                    <div className={styles.cardHeader}>
                        <Zap size={20} />
                        <h3>Paramètres Généraux</h3>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.switchRow}>
                            <span>Activer la vente flash sur l'application</span>
                            <div
                                className={`${styles.switch} ${active ? styles.switchActive : ""}`}
                                onClick={() => setActive(!active)}
                            >
                                <div className={styles.switchDot} />
                            </div>
                        </label>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Titre de la campagne (ex: FLASH SALE -50%)</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Entrez le titre..."
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Date et heure de fin</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="datetime-local"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                            />
                        </div>
                        <p className={styles.helpText}>Sélectionnez le moment précis où la promotion doit s'arrêter.</p>
                    </div>
                </div>

                <div className={styles.productsCard}>
                    <div className={styles.cardHeader}>
                        <Package size={20} />
                        <h3>Produits Sélectionnés ({selectedProductIds.length})</h3>
                    </div>

                    <div className={styles.productGrid}>
                        {products.map(p => {
                            const isSelected = selectedProductIds.includes(p.id);
                            return (
                                <div
                                    key={p.id}
                                    className={`${styles.productItem} ${isSelected ? styles.productSelected : ""}`}
                                    onClick={() => toggleProduct(p.id)}
                                >
                                    <div className={styles.productImgWrapper}>
                                        <img src={p.mainImage} alt={p.name?.fr} />
                                        {isSelected && (
                                            <div className={styles.checkBadge}>
                                                <CheckCircle2 size={16} color="white" fill="var(--foreground)" />
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.productInfo}>
                                        <p className={styles.productName}>{p.name?.fr}</p>
                                        <p className={styles.productPrice}>{p.price} TND</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

const Package = ({ size }: { size: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1.5" />
        <path d="M21 7.5H3" />
        <path d="M21 7.5v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5" />
        <path d="M12 7.5V17" />
        <path d="M12 12H3" />
        <path d="M12 12h9" />
    </svg>
);
