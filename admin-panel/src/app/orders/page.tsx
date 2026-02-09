'use client';

import { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import {
    collection,
    getDocs,
    orderBy,
    query,
    where,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import {
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    Truck,
    Trash2,
    Eye,
    ChevronDown,
    Loader2,
    Search
} from 'lucide-react';
import styles from './orders.module.css';
import { useTranslation } from "@/context/LanguageContext";

interface Order {
    id: string;
    items: any[];
    total: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: any;
    customer?: {
        fullName: string;
        email: string;
        phone: string;
        address: string;
    };
    shippingAddress?: {
        fullName: string;
        phone: string;
        address: string;
        email?: string;
    };
    userId?: string; // Add userId if it exists
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const { isBrandOwner, brandId } = useAuth();
    const { t, isRTL } = useTranslation();

    useEffect(() => {
        fetchOrders();
    }, [isBrandOwner, brandId]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

            if (isBrandOwner && brandId) {
                // Filter orders that have items from my brand
                list = list.filter((o: any) => (o.items || []).some((i: any) => i.brandId === brandId));
                // Recalculate totals for display to show only this brand's share
                list = list.map((o: any) => {
                    const myItems = o.items.filter((i: any) => i.brandId === brandId);
                    const myTotal = myItems.reduce((acc: number, i: any) => acc + (parseFloat(i.price) * (i.quantity || 1)), 0);
                    return { ...o, total: myTotal };
                });
            }
            setOrders(list);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, 'orders', orderId), { status: newStatus });

            // Send Notification
            const targetOrder = orders.find(o => o.id === orderId);
            if (targetOrder && targetOrder.userId) {
                try {
                    await addDoc(collection(db, 'notifications'), {
                        userId: targetOrder.userId,
                        title: `Order Update`,
                        message: `Your order #${orderId.slice(0, 8)} is now ${newStatus.toUpperCase()}.`,
                        read: false,
                        type: 'order_update',
                        data: { orderId: orderId },
                        createdAt: serverTimestamp()
                    });
                } catch (e) { console.error("Notification failed", e); }
            }

            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus as any });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const deleteOrder = async (id: string) => {
        if (!confirm('Voulez-vous vraiment supprimer cette commande ?')) return;
        try {
            await deleteDoc(doc(db, 'orders', id));
            setOrders(orders.filter(o => o.id !== id));
            setSelectedOrder(null);
        } catch (error) {
            console.error(error);
        }
    };

    const formatDate = (ts: any) => {
        if (!ts) return isRTL ? 'لا يوجد تاريخ' : 'No date';
        const date = ts instanceof Timestamp ? ts.toDate() : new Date((ts.seconds || ts._seconds) * 1000 || ts);
        return date.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCustomer = (order: Order) => {
        const c = order.customer || order.shippingAddress;
        return {
            fullName: c?.fullName || (isRTL ? 'عميل غير معروف' : 'Client Inconnu'),
            phone: c?.phone || (isRTL ? 'غير متوفر' : 'Non renseigné'),
            address: c?.address || (isRTL ? 'غير متوفر' : 'Non renseignée'),
            email: c?.email || (isRTL ? 'غير متوفر' : 'Non renseigné')
        };
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock size={16} className={styles.iconPending} />;
            case 'processing': return <Loader2 size={16} className={styles.iconProcessing} />;
            case 'shipped': return <Truck size={16} className={styles.iconShipped} />;
            case 'delivered': return <CheckCircle2 size={16} className={styles.iconDelivered} />;
            case 'cancelled': return <XCircle size={16} className={styles.iconCancelled} />;
            default: return null;
        }
    };

    const filteredOrders = orders.filter(o => {
        const customer = getCustomer(o);
        const matchesSearch = customer.fullName.toLowerCase().includes(search.toLowerCase()) ||
            o.id.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t('orders')}</h1>
                    <p className={styles.subtitle}>{isBrandOwner ? (isRTL ? "إدارة مبيعاتك" : "Gérez vos ventes") : (isRTL ? "إدارة المبيعات والتوصيل" : "Gérez les ventes et les livraisons")}</p>
                </div>
                <div className={styles.stats}>
                    <div className={styles.statCard}>
                        <span>{isBrandOwner ? (isRTL ? "مبيعاتك" : "Vos Ventes") : (isRTL ? "إجمالي المبيعات" : "Total Ventes")}</span>
                        <strong>{orders.reduce((acc, o) => acc + (o.status !== 'cancelled' ? o.total : 0), 0).toFixed(3)} TND</strong>
                    </div>
                </div>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder={t('search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className={styles.filterWrapper}>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">{isRTL ? "جميع الحالات" : "Tous les statuts"}</option>
                        <option value="pending">{t('pending')}</option>
                        <option value="processing">{t('processing')}</option>
                        <option value="shipped">{t('shipped')}</option>
                        <option value="delivered">{t('delivered')}</option>
                        <option value="cancelled">{t('cancelled')}</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className={styles.loader}>
                    <Loader2 className={styles.spin} />
                    <p>{isRTL ? "جاري تحميل الطلبات..." : "Chargement des commandes..."}</p>
                </div>
            ) : (
                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{t('date')} & ID</th>
                                <th>{t('customer')}</th>
                                <th>{isRTL ? "المقالات" : "Articles"}</th>
                                <th>{t('total')}</th>
                                <th>{t('status')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => {
                                const customer = getCustomer(order);
                                return (
                                    <tr key={order.id} className={selectedOrder?.id === order.id ? styles.activeRow : ''}>
                                        <td className={styles.idCell}>
                                            <strong>{formatDate(order.createdAt)}</strong>
                                            <span>#{order.id.substring(0, 8)}</span>
                                        </td>
                                        <td className={styles.customerCell}>
                                            <strong>{customer.fullName}</strong>
                                            <span>{customer.phone}</span>
                                        </td>
                                        <td className={styles.itemsCell}>
                                            {order.items?.length} articles
                                        </td>
                                        <td className={styles.priceCell}>
                                            {order.total?.toFixed(3)} TND
                                        </td>
                                        <td>
                                            <div className={`${styles.statusBadge} ${styles[order.status]}`}>
                                                {getStatusIcon(order.status)}
                                                {t(order.status).toUpperCase()}
                                            </div>
                                        </td>
                                        <td className={styles.actions}>
                                            <button className={styles.iconBtn} onClick={() => setSelectedOrder(order)}>
                                                <Eye size={18} />
                                            </button>
                                            <button className={styles.iconBtn} onClick={() => deleteOrder(order.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedOrder && (
                <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Détails de la Commande</h2>
                            <button className={styles.closeBtn} onClick={() => setSelectedOrder(null)}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className={styles.modalContent}>
                            <div className={styles.detailsGrid}>
                                <div className={styles.detailsCol}>
                                    <h3>Informations Client</h3>
                                    {(() => {
                                        const c = getCustomer(selectedOrder);
                                        return (
                                            <>
                                                <p><strong>Nom:</strong> {c.fullName}</p>
                                                <p><strong>Email:</strong> {c.email}</p>
                                                <p><strong>Tel:</strong> {c.phone}</p>
                                                <p><strong>Adresse:</strong> {c.address}</p>
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className={styles.detailsCol}>
                                    <h3>Changer le Statut</h3>
                                    <div className={styles.statusButtons}>
                                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                                            <button
                                                key={s}
                                                className={`${styles.statusBtn} ${selectedOrder.status === s ? styles.activeStatus : ''}`}
                                                onClick={() => updateStatus(selectedOrder.id, s)}
                                            >
                                                {s.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalItems}>
                                <h3>Articles</h3>
                                {selectedOrder.items.map((item, idx) => {
                                    if (isBrandOwner && item.brandId !== brandId) return null;
                                    return (
                                        <div key={idx} className={styles.orderItem}>
                                            <img src={item.mainImage} alt="" className={styles.itemThumb} />
                                            <div className={styles.itemInfo}>
                                                <strong>{item.name?.fr || item.name}</strong>
                                                <span>Taille: {item.selectedSize} | Couleur: {item.selectedColor}</span>
                                            </div>
                                            <span className={styles.itemPrice}>{item.price} TND</span>
                                        </div>
                                    );
                                })}
                                <div className={styles.orderTotal}>
                                    <span>TOTAL {isBrandOwner && "(VOTRE PART)"}</span>
                                    <strong>{selectedOrder.total.toFixed(3)} TND</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
