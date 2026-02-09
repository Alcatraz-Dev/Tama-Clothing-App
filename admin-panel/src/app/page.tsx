"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/services/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import styles from "./dashboard.module.css";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function Home() {
  const { user, isBrandOwner, brandId } = useAuth();
  const { t, isRTL } = useTranslation();
  const [stats, setStats] = useState({
    ordersToday: 0,
    revenueToday: 0,
    activeProducts: 0,
    totalClients: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [isBrandOwner, brandId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get today's range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);

      // 1. Fetch Today's Orders & Revenue
      const ordersSnap = await getDocs(query(collection(db, 'orders'), where('createdAt', '>=', todayTimestamp)));
      let todayOrdersCount = 0;
      let revenue = 0;

      ordersSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.status !== 'cancelled') {
          if (isBrandOwner && brandId) {
            const myItems = (data.items || []).filter((i: any) => i.brandId === brandId);
            if (myItems.length > 0) {
              todayOrdersCount++;
              revenue += myItems.reduce((acc: number, i: any) => acc + (parseFloat(i.price) * (i.quantity || 1)), 0);
            }
          } else {
            todayOrdersCount++;
            revenue += (data.total || 0);
          }
        }
      });

      // 2. Fetch Active Products
      let productsSnap;
      if (isBrandOwner && brandId) {
        productsSnap = await getDocs(query(collection(db, 'products'), where('brandId', '==', brandId)));
      } else {
        productsSnap = await getDocs(collection(db, 'products'));
      }

      // 3. Fetch Total Clients
      const usersSnap = await getDocs(collection(db, 'users'));
      const customerCount = usersSnap.docs.filter(doc => doc.data().role !== 'admin').length;

      // 4. Fetch Recent Orders (latest 10)
      const allRecentSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50)));
      let recentList = allRecentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (isBrandOwner && brandId) {
        recentList = recentList.filter((o: any) => (o.items || []).some((i: any) => i.brandId === brandId));
        recentList = recentList.map((o: any) => {
          const myItems = o.items.filter((i: any) => i.brandId === brandId);
          const myTotal = myItems.reduce((acc: number, i: any) => acc + (parseFloat(i.price) * (i.quantity || 1)), 0);
          return { ...o, total: myTotal };
        });
      }
      recentList = recentList.slice(0, 5);

      setStats({
        ordersToday: todayOrdersCount,
        revenueToday: revenue,
        activeProducts: productsSnap.size,
        totalClients: customerCount
      });
      setRecentOrders(recentList);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return styles.badgePending;
      case 'shipped': return styles.badgeShipped;
      case 'delivered': return styles.badgeSuccess; // Assuming you have this or use shipped
      case 'cancelled': return styles.badgeCancelled;
      default: return styles.badgePending;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t('pending');
      case 'shipped': return t('shipped');
      case 'delivered': return t('delivered');
      case 'cancelled': return t('cancelled');
      default: return status;
    }
  };

  const getName = (field: any) => {
    if (!field) return t('customer');
    if (typeof field === "string") return field;
    return field.fr || field["ar-tn"] || Object.values(field)[0] || t('customer');
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader2 className={styles.spin} size={48} />
        <p>{isRTL ? "جاري تحميل لوحة التحكم..." : "Chargement du dashboard..."}</p>
      </div>
    );
  }

  return (
    <div className={styles.mainContent}>
      <div className={styles.welcomeSection}>
        <h2 className="section-title">{t('dashboard')}</h2>
        <p className={styles.date}>{new Date().toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className={styles.statsGrid}>
        <div className="card">
          <h3>{isBrandOwner ? t('ordersThisBrand') : t('orders')}</h3>
          <div className={styles.statValue}>{stats.ordersToday}</div>
          <p className={styles.statLabel}>{isRTL ? "اليوم" : "Aujourd'hui"}</p>
        </div>
        <div className="card">
          <h3>{isBrandOwner ? t('revenueThisBrand') : t('totalSales')}</h3>
          <div className={styles.statValue}>{stats.revenueToday.toFixed(3)} TND</div>
          <p className={styles.statLabel}>{isRTL ? "اليوم" : "Aujourd'hui"}</p>
        </div>
        <div className="card">
          <h3>{t('activeProducts')}</h3>
          <div className={styles.statValue}>{stats.activeProducts}</div>
          <p className={styles.statLabel}>{isRTL ? "إجمالي" : "Total en ligne"}</p>
        </div>
        {!isBrandOwner && (
          <div className="card">
            <h3>{t('totalClients')}</h3>
            <div className={styles.statValue}>{stats.totalClients}</div>
            <p className={styles.statLabel}>{isRTL ? "مسجلين" : "Inscrits"}</p>
          </div>
        )}
      </div>

      <div className={styles.recentActivity}>
        <div className="card">
          <h3>{t('recentOrders')}</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('customer')}</th>
                  <th>{t('status')}</th>
                  <th>{t('total')}</th>
                  <th>{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id.substring(0, 8)}</td>
                    <td>{getName(order.customer || order.shippingAddress)}</td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>{order.total?.toFixed(3)} TND</td>
                    <td>{new Date(order.createdAt?.seconds * 1000 || order.createdAt).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR')}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>{t('noRecentOrders')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
