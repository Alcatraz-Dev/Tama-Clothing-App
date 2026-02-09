'use client';
import { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';
import styles from '../dashboard.module.css';
import { Trash2, CheckCircle, XCircle, Plus, Minus } from 'lucide-react';

export default function Coupons() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [code, setCode] = useState('');
    const [type, setType] = useState('percentage');
    const [value, setValue] = useState('');
    const [minOrder, setMinOrder] = useState('');

    // Bundle Price State
    const [targetProductId, setTargetProductId] = useState('');
    const [tiers, setTiers] = useState<{ qty: number, price: number }[]>([{ qty: 1, price: 0 }]);
    const [showProductSelector, setShowProductSelector] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'coupons'), (snap) => {
            setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        // Fetch products for bundle selection
        getDocs(collection(db, 'products')).then(snap => {
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => unsub();
    }, []);

    const handleCreate = async () => {
        if (!code) return alert('Missing code');

        let couponData: any = {
            code: code.trim().toUpperCase(),
            type,
            isActive: true,
            createdAt: serverTimestamp(),
            minOrder: minOrder ? parseFloat(minOrder) : 0,
        };

        if (type === 'bundle_price') {
            if (!targetProductId) return alert('Select a product for the bundle');
            const validTiers = tiers.filter(t => t.qty > 0 && t.price >= 0);
            if (validTiers.length === 0) return alert('Add at least one price tier');
            couponData.targetProductId = targetProductId;
            couponData.tiers = validTiers;
        } else if (type === 'percentage' || type === 'fixed') {
            if (!value) return alert('Missing value');
            couponData.value = parseFloat(value);
        } else {
            // free_shipping
            couponData.value = 0;
        }

        try {
            await addDoc(collection(db, 'coupons'), couponData);
            resetForm();
            alert('Coupon Created');
        } catch (e) {
            console.error(e);
            alert('Error creating coupon');
        }
    };

    const resetForm = () => {
        setCode('');
        setValue('');
        setMinOrder('');
        setTargetProductId('');
        setTiers([{ qty: 1, price: 0 }]);
        setType('percentage');
    };

    const deleteCoupon = async (id: string) => {
        if (confirm('Delete coupon?')) {
            await deleteDoc(doc(db, 'coupons', id));
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        await updateDoc(doc(db, 'coupons', id), { isActive: !currentStatus });
    };

    const addTier = () => setTiers([...tiers, { qty: 0, price: 0 }]);
    const removeTier = (index: number) => setTiers(tiers.filter((_, i) => i !== index));
    const updateTier = (index: number, field: 'qty' | 'price', val: string) => {
        const newTiers = [...tiers];
        newTiers[index][field] = parseFloat(val) || 0;
        setTiers(newTiers);
    };

    const getProductName = (id: string) => {
        const p = products.find(prod => prod.id === id);
        if (!p) return 'Unknown Product';
        if (typeof p.name === 'object' && p.name !== null) {
            return p.name.en || p.name.fr || Object.values(p.name)[0] || 'Unknown Product';
        }
        return p.name || 'Unknown Product';
    };

    return (
        <div>
            <div className={styles.header}>
                <h1>Manage Coupons</h1>
            </div>

            <div className={styles.card}>
                <h3>Create New Coupon</h3>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label>Coupon Code</label>
                        <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. SAVE20" />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (TND)</option>
                            <option value="free_shipping">Free Shipping</option>
                            <option value="bundle_price">Bundle / Quantity Price</option>
                        </select>
                    </div>

                    {type === 'bundle_price' ? (
                        <>
                            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                <label>Target Product</label>
                                <div style={{ position: 'relative' }}>
                                    <div
                                        onClick={() => setShowProductSelector(!showProductSelector)}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: 8,
                                            border: '1px solid #333',
                                            background: '#111',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            minHeight: 42
                                        }}
                                    >
                                        {targetProductId ? (
                                            <>
                                                {products.find(p => p.id === targetProductId)?.images?.[0] && (
                                                    <img
                                                        src={products.find(p => p.id === targetProductId)?.images[0]}
                                                        alt=""
                                                        style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }}
                                                    />
                                                )}
                                                <span>{getProductName(targetProductId)}</span>
                                            </>
                                        ) : (
                                            <span style={{ color: '#888' }}>Select Product...</span>
                                        )}
                                    </div>

                                    {showProductSelector && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            marginTop: 4,
                                            background: '#111',
                                            border: '1px solid #333',
                                            borderRadius: 8,
                                            maxHeight: 250,
                                            overflowY: 'auto',
                                            zIndex: 100,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                        }}>
                                            {products.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        setTargetProductId(p.id);
                                                        setShowProductSelector(false);
                                                    }}
                                                    style={{
                                                        padding: '10px 12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid #222',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#222'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    {p.images?.[0] && (
                                                        <img
                                                            src={p.images[0]}
                                                            alt=""
                                                            style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }}
                                                        />
                                                    )}
                                                    <span style={{ color: '#fff' }}>{getProductName(p.id)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#aaa', marginBottom: 8, display: 'block' }}>Price Tiers</label>
                                {tiers.map((tier, index) => (
                                    <div key={index} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                value={tier.qty || ''}
                                                onChange={(e) => updateTier(index, 'qty', e.target.value)}
                                                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <input
                                                type="number"
                                                placeholder="Total Price (TND)"
                                                value={tier.price || ''}
                                                onChange={(e) => updateTier(index, 'price', e.target.value)}
                                                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff' }}
                                            />
                                        </div>
                                        {tiers.length > 1 && (
                                            <button onClick={() => removeTier(index)} style={{ background: '#3e1a1a', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}>
                                                <Trash2 size={16} color="#ef5350" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button onClick={addTier} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, background: '#222', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                                    <Plus size={14} /> Add Tier
                                </button>
                            </div>
                        </>
                    ) : (
                        type !== 'free_shipping' && (
                            <div className={styles.formGroup}>
                                <label>Value</label>
                                <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" />
                            </div>
                        )
                    )}

                    <div className={styles.formGroup}>
                        <label>Min Order (TND)</label>
                        <input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="Optional" />
                    </div>
                </div>
                <button onClick={handleCreate} className={styles.saveBtn} style={{ marginTop: 20 }}>Create Coupon</button>
            </div>

            <div className={styles.grid}>
                {coupons.map(coupon => (
                    <div key={coupon.id} className={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{coupon.code}</h3>
                                <div style={{ color: '#ccc', fontSize: 14, marginTop: 4 }}>
                                    {coupon.type === 'free_shipping' && 'Free Shipping'}
                                    {coupon.type === 'percentage' && `${coupon.value}% OFF`}
                                    {coupon.type === 'fixed' && `${coupon.value} TND OFF`}
                                    {coupon.type === 'bundle_price' && (
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                {products.find(p => p.id === coupon.targetProductId)?.images?.[0] && (
                                                    <img
                                                        src={products.find(p => p.id === coupon.targetProductId)?.images[0]}
                                                        alt="product"
                                                        style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }}
                                                    />
                                                )}
                                                <strong>{getProductName(coupon.targetProductId)}</strong>
                                            </div>
                                            <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                                                {coupon.tiers?.map((t: any, i: number) => (
                                                    <li key={i}>Buy {t.qty} for {t.price} TND</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                {coupon.minOrder > 0 && <p style={{ fontSize: 12, color: '#888', margin: '4px 0' }}>Min Order: {coupon.minOrder} TND</p>}
                                <span style={{ fontSize: 12, color: coupon.isActive ? '#4caf50' : '#f44336', fontWeight: 'bold', display: 'inline-block', marginTop: 8 }}>
                                    {coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => toggleActive(coupon.id, coupon.isActive)} className={styles.iconBtn}>
                                    {coupon.isActive ? <XCircle size={20} color="orange" /> : <CheckCircle size={20} color="green" />}
                                </button>
                                <button onClick={() => deleteCoupon(coupon.id)} className={styles.iconBtn}>
                                    <Trash2 size={20} color="red" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
