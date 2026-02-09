"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/services/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminShell.module.css";
import { useTranslation } from "@/context/LanguageContext";
import {
    LayoutDashboard,
    Package,
    ListTree,
    ShoppingCart,
    Users,
    LogOut,
    Settings,
    ImageIcon,
    Menu,
    X,
    Megaphone,
    Zap,
    Ticket,
    Bell,
    MessageCircle,
    Globe
} from "lucide-react";

export default function AdminShell({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, isSupport, isBrandOwner } = useAuth();
    const { t, language, setLanguage, isRTL } = useTranslation();
    const pathname = usePathname();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        if (window.confirm(language === 'ar' ? "هل تريد حقاً تسجيل الخروج؟" : "Voulez-vous vraiment vous déconnecter ?")) {
            signOut(auth);
        }
    };
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    // Filter navigation based on role
    const navItems = [
        { label: t('dashboard'), href: "/", icon: <LayoutDashboard size={20} />, roles: ["admin", "support", "brand_owner"] },
        { label: t('products'), href: "/products", icon: <Package size={20} />, roles: ["admin", "brand_owner"] },
        { label: t('categories'), href: "/categories", icon: <ListTree size={20} />, roles: ["admin"] },
        { label: t('brands'), href: "/brands", icon: <Package size={20} />, roles: ["admin"] },
        { label: t('banners'), href: "/banners", icon: <ImageIcon size={20} />, roles: ["admin"] },
        { label: t('ads'), href: "/ads", icon: <Megaphone size={20} />, roles: ["admin"] },
        { label: t('flashSale'), href: "/flash-sale", icon: <Zap size={20} />, roles: ["admin"] },
        { label: t('promoBanners'), href: "/promo-banners", icon: <Ticket size={20} />, roles: ["admin"] },
        { label: t('coupons'), href: "/coupons", icon: <Ticket size={20} />, roles: ["admin"] },
        { label: t('notifications'), href: "/notifications", icon: <Bell size={20} />, roles: ["admin"] },
        { label: t('support'), href: "/support", icon: <MessageCircle size={20} />, roles: ["admin", "support"] },
        { label: t('orders'), href: "/orders", icon: <ShoppingCart size={20} />, roles: ["admin", "support", "brand_owner"] },
        { label: t('clients'), href: "/users", icon: <Users size={20} />, roles: ["admin"] },
        { label: t('settings'), href: "/settings", icon: <Settings size={20} />, roles: ["admin"] },
    ].filter(item => {
        if (isAdmin) return true;
        if (isSupport && item.roles.includes("support")) return true;
        if (isBrandOwner && item.roles.includes("brand_owner")) return true;
        return false;
    });

    if (pathname === "/login") return <>{children}</>;

    return (
        <div className={styles.wrapper}>
            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <h1 className={styles.brand}>TAMA CLOTHING</h1>
                <button onClick={toggleMobileMenu} className={styles.menuToggle}>
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {isMobileMenuOpen && (
                <div className={styles.backdrop} onClick={closeMobileMenu} />
            )}

            <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.sidebarHeader}>
                    <h1 className={styles.brand}>TAMA CLOTHING</h1>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}
                            onClick={closeMobileMenu}
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.languageSwitcher}>
                        <Globe size={16} />
                        <button
                            className={`${styles.langBtn} ${language === 'fr' ? styles.activeLang : ''}`}
                            onClick={() => setLanguage('fr')}
                        >
                            FR
                        </button>
                        <button
                            className={`${styles.langBtn} ${language === 'ar' ? styles.activeLang : ''}`}
                            onClick={() => setLanguage('ar')}
                        >
                            AR
                        </button>
                    </div>
                    <div className={styles.userInfo}>
                        <p className={styles.userEmail}>{user?.email}</p>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <LogOut size={20} /> <span>{t('logout')}</span>
                    </button>
                </div>
            </aside>

            <main className={styles.main}>
                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
}
