"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/services/firebase";
import {
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "firebase/auth";
import {
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    limit
} from "firebase/firestore";
import {
    User,
    Lock,
    Shield,
    Mail,
    Plus,
    Check,
    AlertCircle,
    Trash2,
    Globe,
    Share2,
    MessageCircle
} from "lucide-react";
import styles from "./settings.module.css";

export default function SettingsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"account" | "team" | "socials" | "legal">("account");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Account Form
    const [email, setEmail] = useState(user?.email || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // Team Form
    const [managerEmail, setManagerEmail] = useState("");
    const [managerRole, setManagerRole] = useState("admin");
    const [admins, setAdmins] = useState<any[]>([]);

    // Socials Form
    const [socials, setSocials] = useState({
        facebook: "",
        instagram: "",
        tiktok: "",
        whatsapp: "",
        youtube: "",
        website: ""
    });

    // Legal Form
    const [legal, setLegal] = useState({
        privacy: "",
        privacyAr: "",
        terms: "",
        termsAr: ""
    });

    const ROLES = [
        { value: 'admin', label: 'Administrateur (Accès complet)' },
        { value: 'editor', label: 'Éditeur (Gestion contenu)' },
        { value: 'support', label: 'Support (Gestion Chat)' },
        { value: 'viewer', label: 'Lecteur (Lecture seule)' },
    ];

    useEffect(() => {
        if (activeTab === "team") {
            fetchAdmins();
        } else if (activeTab === "socials") {
            fetchSocials();
        } else if (activeTab === "legal") {
            fetchLegal();
        }
    }, [activeTab]);

    const fetchLegal = async () => {
        try {
            const snap = await getDocs(query(collection(db, "settings"), where("__name__", "==", "legal")));
            const defaultPrivacy = `At Tama Clothing, we prioritize your privacy. This policy outlines how we collect, use, and protect your information.

1. Information Collection
We collect personal data (name, email, shipping address) when you create an account or place an order. We may also collect browsing data to improve your experience.

2. Usage of Information
Your data is used solely for processing orders, improving our services, and sending relevant updates (if opted in). We do not sell your data to third parties.

3. Data Security
We implement industry-standard security measures to protect your personal information. However, no method of transmission is 100% secure.

4. Contact Us
If you have questions about this policy, please contact our support team.`;

            const defaultTerms = `Welcome to Tama Clothing. By accessing or using our mobile application, you agree to be bound by these terms.

1. Usage Rights
You are granted a limited license to access and use the app for personal shopping purposes. Misuse or unauthorized access is strictly prohibited.

2. Purchases & Payments
All prices are in TND. We reserve the right to change prices at any time. Orders are subject to acceptance and availability.

3. Intellectual Property
All content (images, text, designs) is owned by Tama Clothing and protected by copyright laws.

4. Limitation of Liability
Tama Clothing is not liable for indirect damages arising from your use of the app.

5. Governing Law
These terms are governed by the laws of Tunisia.`;

            const defaultPrivacyAr = `في Tama Clothing، نولي أولوية قصوى لخصوصيتك. توضح هذه السياسة كيفية جمعنا لمعلوماتك واستخدامها وحمايتها.

1. جمع المعلومات
نقوم بجمع البيانات الشخصية (الاسم، البريد الإلكتروني، عنوان الشحن) عند إنشاء حساب أو تقديم طلب. قد نجمع أيضًا بيانات التصفح لتحسين تجربتك.

2. استخدام المعلومات
تُستخدم بياناتك فقط لمعالجة الطلبات، وتحسين خدماتنا، وإرسال التحديثات ذات الصلة (إذا وافقت على ذلك). نحن لا نبيع بياناتك لأطراف ثالثة.

3. أمان البيانات
نحن نطبق إجراءات أمنية قياسية في الصناعة لحماية معلوماتك الشخصية. ومع ذلك، لا توجد طريقة نقل آمنة بنسبة 100%.

4. اتصل بنا
إذا كانت لديك أسئلة حول هذه السياسة، يرجى الاتصال بفريق الدعم لدينا.`;

            const defaultTermsAr = `مرحبًا بكم في Tama Clothing. من خلال الوصول إلى تطبيق الهاتف المحمول الخاص بنا أو استخدامه، فإنك توافق على الالتزام بهذه الشروط.

1. حقوق الاستخدام
يتم منحك ترخيصًا محدودًا للوصول إلى التطبيق واستخدامه لأغراض التسوق الشخصي. يُمنع إساءة الاستخدام أو الوصول غير المصرح به منعًا باتًا.

2. المشتريات والمدفوعات
جميع الأسعار بالدينار التونسي. نحتفظ بالحق في تغيير الأسعار في أي وقت. تخضع الطلبات للقبول والتوافر.

3. الملكية الفكرية
جميع المحتويات (الصور، النصوص، التصميمات) مملوكة لـ Tama Clothing ومحمية بموجب قوانين حقوق النشر.

4. تحديد المسؤولية
Tama Clothing ليست مسؤولة عن الأضرار غير المباشرة الناشئة عن استخدامك للتطبيق.

5. القانون الحاكم
تخضع هذه الشروط لقوانين تونس.`;

            if (!snap.empty) {
                const data = snap.docs[0].data();
                setLegal({
                    privacy: data.privacy || defaultPrivacy,
                    privacyAr: data.privacyAr || defaultPrivacyAr,
                    terms: data.terms || defaultTerms,
                    termsAr: data.termsAr || defaultTermsAr
                });
            } else {
                setLegal({
                    privacy: defaultPrivacy,
                    privacyAr: defaultPrivacyAr,
                    terms: defaultTerms,
                    termsAr: defaultTermsAr
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSocials = async () => {
        try {
            const snap = await getDocs(query(collection(db, "settings"), where("__name__", "==", "socials")));
            if (!snap.empty) {
                const data = snap.docs[0].data();
                setSocials({
                    facebook: data.facebook || "",
                    instagram: data.instagram || "",
                    tiktok: data.tiktok || "",
                    whatsapp: data.whatsapp || "",
                    youtube: data.youtube || "",
                    website: data.website || ""
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchAdmins = async () => {
        try {
            const q = query(collection(db, "users"), where("role", "in", ["admin", "editor", "viewer", "support"]));
            const snap = await getDocs(q);
            setAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            // Re-authenticate user first (required for email/password changes)
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);

            if (email !== user.email) {
                await updateEmail(user, email);
                // Also update firestore
                await updateDoc(doc(db, "users", user.uid), { email });
            }

            if (newPassword) {
                await updatePassword(user, newPassword);
            }

            setMessage({ type: "success", text: "Compte mis à jour avec succès !" });
            setCurrentPassword("");
            setNewPassword("");
        } catch (error: any) {
            console.error(error);
            setMessage({ type: "error", text: "Erreur: " + (error.code === 'auth/wrong-password' ? 'Mot de passe actuel incorrect' : 'Une erreur est survenue') });
        } finally {
            setLoading(false);
        }
    };

    const handleAddManager = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            // Find user by email
            const q = query(collection(db, "users"), where("email", "==", managerEmail), limit(1));
            const snap = await getDocs(q);

            if (snap.empty) {
                setMessage({ type: "error", text: "Utilisateur non trouvé. Le manager doit d'abord créer un compte." });
            } else {
                const userDoc = snap.docs[0];
                await updateDoc(doc(db, "users", userDoc.id), { role: managerRole });
                setMessage({ type: "success", text: `${managerEmail} est maintenant un membre de l'équipe !` });
                setManagerEmail("");
                fetchAdmins();
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "Erreur lors de l'ajout du manager." });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveManager = async (adminId: string, adminEmail: string) => {
        if (adminEmail === user?.email) return alert("Vous ne pouvez pas vous retirer vous-même.");
        if (!confirm(`Retirer ${adminEmail} de l'équipe ?`)) return;

        try {
            await updateDoc(doc(db, "users", adminId), { role: "customer" });
            fetchAdmins();
        } catch (error) {
            console.error(error);
        }
    };

    const handleChangeRole = async (userId: string, newRole: string) => {
        if (userId === user?.uid) return; // Prevent changing own role for safety
        try {
            await updateDoc(doc(db, "users", userId), { role: newRole });
            fetchAdmins();
        } catch (error) {
            console.error(error);
        }
    };
    const handleUpdateSocials = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const { setDoc, doc } = await import("firebase/firestore");
            await setDoc(doc(db, "settings", "socials"), {
                ...socials,
                updatedAt: new Date()
            });
            setMessage({ type: "success", text: "Liens sociaux mis à jour !" });
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "Erreur lors de la mise à jour." });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLegal = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const { setDoc, doc } = await import("firebase/firestore");
            await setDoc(doc(db, "settings", "legal"), {
                ...legal,
                updatedAt: new Date()
            });
            setMessage({ type: "success", text: "Pages légales mises à jour !" });
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "Erreur lors de la mise à jour." });
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Paramètres</h1>
                <p className={styles.subtitle}>Gérez votre compte et votre équipe d'administration</p>
            </div>

            <div className={styles.tabs}>
                <div
                    className={`${styles.tab} ${activeTab === "account" ? styles.activeTab : ""}`}
                    onClick={() => { setActiveTab("account"); setMessage({ type: "", text: "" }); }}
                >
                    Mon Compte
                </div>
                <div
                    className={`${styles.tab} ${activeTab === "team" ? styles.activeTab : ""}`}
                    onClick={() => { setActiveTab("team"); setMessage({ type: "", text: "" }); }}
                >
                    Équipe & Managers
                </div>
                <div
                    className={`${styles.tab} ${activeTab === "socials" ? styles.activeTab : ""}`}
                    onClick={() => { setActiveTab("socials"); setMessage({ type: "", text: "" }); }}
                >
                    Réseaux Sociaux
                </div>
                <div
                    className={`${styles.tab} ${activeTab === "legal" ? styles.activeTab : ""}`}
                    onClick={() => { setActiveTab("legal"); setMessage({ type: "", text: "" }); }}
                >
                    Pages Légales
                </div>
            </div>

            {message.text && (
                <div className={message.type === "success" ? styles.successMsg : styles.errorMsg} style={{ marginBottom: '24px' }}>
                    {message.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            {activeTab === "account" ? (
                <div className={styles.section}>
                    <form onSubmit={handleUpdateAccount} className={styles.card}>
                        <div className={styles.inputGroup}>
                            <label>Email Admin</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="votre@email.com"
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Mot de passe actuel (Requis pour confirmer)</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Nouveau Mot de passe (Laisser vide pour ne pas changer)</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                minLength={6}
                            />
                        </div>
                        <div className={styles.btnContainer}>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? "Mise à jour..." : "Enregistrer les modifications"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : activeTab === "team" ? (
                <div className={styles.section} style={{ maxWidth: '800px' }}>
                    {/* ... team management content ... */}
                    <div className={styles.card}>
                        <h3>Gérer l'équipe</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                            Ajoutez des membres et attribuez des rôles spécifiques.
                        </p>
                        <form onSubmit={handleAddManager} className={styles.addManagerForm}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                                <div className={styles.inputGroup}>
                                    <label>Email Utilisateur</label>
                                    <input
                                        type="email"
                                        value={managerEmail}
                                        onChange={e => setManagerEmail(e.target.value)}
                                        placeholder="collegue@tama.com"
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Rôle</label>
                                    <select value={managerRole} onChange={e => setManagerRole(e.target.value)}>
                                        {ROLES.map(role => (
                                            <option key={role.value} value={role.value}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'fit-content', marginTop: '10px' }}>
                                <Plus size={18} /> {loading ? "Ajout..." : "Ajouter membre"}
                            </button>
                        </form>

                        <div className={styles.userList}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Membres Actuels ({admins.length})</label>
                            {admins.map(admin => (
                                <div key={admin.id} className={styles.userItem}>
                                    <div className={styles.userInfo}>
                                        <strong>{admin.fullName || "Utilisateur sans nom"}</strong>
                                        <span>{admin.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <select
                                            value={admin.role}
                                            onChange={(e) => handleChangeRole(admin.id, e.target.value)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                background: 'var(--input-bg)',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                color: 'var(--foreground)'
                                            }}
                                            disabled={admin.email === user?.email}
                                        >
                                            {ROLES.map(role => (
                                                <option key={role.value} value={role.value}>{role.label}</option>
                                            ))}
                                        </select>

                                        {admin.email !== user?.email && (
                                            <button
                                                className={styles.removeBtn}
                                                onClick={() => handleRemoveManager(admin.id, admin.email)}
                                                title="Retirer de l'équipe"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : activeTab === 'legal' ? (
                <div className={styles.section} style={{ maxWidth: '800px' }}>
                    <form onSubmit={handleUpdateLegal} className={styles.card}>
                        <h3>Pages Légales (Mobile & Web)</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                            Définissez le contenu affiché dans "Politique de confidentialité" et "Conditions d'utilisation".
                        </p>

                        <div className={styles.inputGroup}>
                            <label>Politique de Confidentialité (FR/EN)</label>
                            <textarea
                                value={legal.privacy}
                                onChange={e => setLegal({ ...legal, privacy: e.target.value })}
                                placeholder="Contenu de la politique..."
                                style={{ minHeight: '150px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--foreground)' }}
                            />
                        </div>

                        <div className={styles.inputGroup} style={{ marginTop: '20px' }}>
                            <label>Politique de Confidentialité (AR)</label>
                            <textarea
                                value={legal.privacyAr}
                                onChange={e => setLegal({ ...legal, privacyAr: e.target.value })}
                                placeholder="سياسة الخصوصية بالعربية..."
                                style={{ minHeight: '150px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--foreground)', textAlign: 'right', direction: 'rtl' }}
                            />
                        </div>

                        <div className={styles.inputGroup} style={{ marginTop: '20px' }}>
                            <label>Conditions d'Utilisation (FR/EN)</label>
                            <textarea
                                value={legal.terms}
                                onChange={e => setLegal({ ...legal, terms: e.target.value })}
                                placeholder="Contenu des conditions..."
                                style={{ minHeight: '150px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--foreground)' }}
                            />
                        </div>

                        <div className={styles.inputGroup} style={{ marginTop: '20px' }}>
                            <label>Conditions d'Utilisation (AR)</label>
                            <textarea
                                value={legal.termsAr}
                                onChange={e => setLegal({ ...legal, termsAr: e.target.value })}
                                placeholder="شروط الخدمة بالعربية..."
                                style={{ minHeight: '150px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--foreground)', textAlign: 'right', direction: 'rtl' }}
                            />
                        </div>

                        <div className={styles.btnContainer} style={{ marginTop: '30px' }}>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? "Mise à jour..." : "Enregistrer les textes"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className={styles.section} style={{ maxWidth: '800px' }}>
                    <form onSubmit={handleUpdateSocials} className={styles.card}>
                        <h3>Liens Sociaux</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                            Ces liens seront affichés sur l'application mobile pour vos clients.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className={styles.inputGroup}>
                                <label><Share2 size={14} style={{ marginRight: '6px' }} /> Instagram</label>
                                <input
                                    type="url"
                                    value={socials.instagram}
                                    onChange={e => setSocials({ ...socials, instagram: e.target.value })}
                                    placeholder="https://instagram.com/tama_clothing"
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label><Share2 size={14} style={{ marginRight: '6px' }} /> Facebook</label>
                                <input
                                    type="url"
                                    value={socials.facebook}
                                    onChange={e => setSocials({ ...socials, facebook: e.target.value })}
                                    placeholder="https://facebook.com/tamaclothing"
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label><Share2 size={14} style={{ marginRight: '6px' }} /> TikTok</label>
                                <input
                                    type="url"
                                    value={socials.tiktok}
                                    onChange={e => setSocials({ ...socials, tiktok: e.target.value })}
                                    placeholder="https://tiktok.com/@tamaclothing"
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label><MessageCircle size={14} style={{ marginRight: '6px' }} /> WhatsApp (Numéro)</label>
                                <input
                                    type="text"
                                    value={socials.whatsapp}
                                    onChange={e => setSocials({ ...socials, whatsapp: e.target.value })}
                                    placeholder="+216 20 000 000"
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label><Globe size={14} style={{ marginRight: '6px' }} /> Site Web</label>
                                <input
                                    type="url"
                                    value={socials.website}
                                    onChange={e => setSocials({ ...socials, website: e.target.value })}
                                    placeholder="https://tamaclothing.tn"
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label><Share2 size={14} style={{ marginRight: '6px' }} /> YouTube</label>
                                <input
                                    type="url"
                                    value={socials.youtube}
                                    onChange={e => setSocials({ ...socials, youtube: e.target.value })}
                                    placeholder="https://youtube.com/@tamaclothing"
                                />
                            </div>
                        </div>

                        <div className={styles.btnContainer} style={{ marginTop: '30px' }}>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? "Mise à jour..." : "Enregistrer les liens"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
