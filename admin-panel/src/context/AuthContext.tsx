"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/services/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: (User & { role?: string, brandId?: string, brandName?: string }) | null;
    loading: boolean;
    isAdmin: boolean;
    isSupport: boolean;
    isBrandOwner: boolean;
    brandId: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    isSupport: false,
    isBrandOwner: false,
    brandId: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSupport, setIsSupport] = useState(false);
    const [isBrandOwner, setIsBrandOwner] = useState(false);
    const [brandId, setBrandId] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Check if user is admin or support in Firestore
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const role = userData.role;
                    const hasAdminAccess = role === "admin";
                    const hasSupportAccess = role === "support";
                    const hasBrandOwnerAccess = role === "brand_owner";

                    setIsAdmin(hasAdminAccess);
                    setIsSupport(hasSupportAccess);
                    setIsBrandOwner(hasBrandOwnerAccess);
                    setBrandId(userData.brandId || null);
                    setUser({ ...currentUser, ...userData });

                    if (hasAdminAccess || hasSupportAccess || hasBrandOwnerAccess) {
                        if (pathname === "/login") {
                            router.push("/");
                        }
                    } else {
                        // Not authorized for admin panel
                        if (pathname !== "/login") {
                            router.push("/login");
                        }
                    }
                } else {
                    setIsAdmin(false);
                    setIsSupport(false);
                    setIsBrandOwner(false);
                    setUser(null);
                    if (pathname !== "/login") {
                        router.push("/login");
                    }
                }
            } else {
                setIsAdmin(false);
                setIsSupport(false);
                setIsBrandOwner(false);
                setUser(null);
                if (pathname !== "/login") {
                    router.push("/login");
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, pathname]);

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, isSupport, isBrandOwner, brandId }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
