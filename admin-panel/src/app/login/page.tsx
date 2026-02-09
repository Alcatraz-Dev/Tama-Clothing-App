"use client";

import { useState } from "react";
import { auth, db } from "@/services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import styles from "./login.module.css";



export default function LoginPage() {
    const { user, isAdmin } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message || "Échec de la connexion. Vérifiez vos identifiants.");
        } finally {
            setLoading(false);
        }
    };

    const handleSetupAdmin = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: "admin",
                updatedAt: serverTimestamp(),
            }, { merge: true });
            window.location.reload();
        } catch (err: any) {
            setError("Erreur de promotion: " + err.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className={styles.container}>
            <div className={`${styles.loginCard} animate-fade`}>
                <div className={styles.header}>
                    <h1 className={styles.brand}>TAMA</h1>
                    <p className={styles.subtitle}>Admin Dashboard</p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@tamaclothing.com"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}
                    {user && !isAdmin && (
                        <div style={{ textAlign: 'center' }}>
                            <p className={styles.error}>
                                Accès refusé. Vous n'avez pas de droits administrateur.
                            </p>
                            <button
                                type="button"
                                onClick={handleSetupAdmin}
                                className="btn-secondary"
                                style={{ marginTop: 10, width: '100%' }}
                            >
                                Configurer mon compte comme Admin
                            </button>
                        </div>
                    )}



                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? "Chargement..." : "Se connecter"}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>&copy; {new Date().getFullYear()} Tama Clothing Tunisia</p>
                </div>
            </div>
        </div>
    );
}
