'use client';

import { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import {
    collection,
    getDocs,
    query,
    orderBy,
    where,
    deleteDoc,
    doc,
    updateDoc
} from 'firebase/firestore';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Search,
    Loader2,
    Trash2,
    Ban,
    UserCheck
} from 'lucide-react';
import styles from './users.module.css';

interface UserProfile {
    uid: string;
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    createdAt?: any;
    isBanned?: boolean;
    role?: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, 'users'));
            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
            // Filter out admins from the clients list if you only want customers
            setUsers(list.filter(u => u.role !== 'admin'));
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (uid: string) => {
        if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
        try {
            await deleteDoc(doc(db, 'users', uid));
            setUsers(users.filter(u => u.uid !== uid));
        } catch (error) {
            console.error(error);
        }
    };

    const toggleBan = async (u: UserProfile) => {
        const action = u.isBanned ? 'débloquer' : 'bannir';
        if (!confirm(`Voulez-vous vraiment ${action} cet utilisateur ?`)) return;
        try {
            await updateDoc(doc(db, 'users', u.uid), { isBanned: !u.isBanned });
            setUsers(users.map(user => user.uid === u.uid ? { ...user, isBanned: !user.isBanned } : user));
        } catch (error) {
            console.error(error);
        }
    };

    const filteredUsers = users.filter(u => {
        const name = u.fullName?.toLowerCase() || '';
        const email = u.email?.toLowerCase() || '';
        const query = search.toLowerCase();
        return name.includes(query) || email.includes(query);
    });

    const getInitials = (name?: string) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Clients</h1>
                    <p className={styles.subtitle}>Consultez la liste de vos clients inscrits</p>
                </div>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className={styles.loader}>
                    <Loader2 className={styles.spin} size={32} />
                    <p>Chargement des clients...</p>
                </div>
            ) : (
                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Contact</th>
                                <th>Adresse de livraison</th>
                                <th>Inscrit le</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => (
                                <tr key={u.uid}>
                                    <td>
                                        <div className={styles.userCell}>
                                            <div className={`${styles.avatar} ${u.isBanned ? styles.bannedAvatar : ''}`}>
                                                {getInitials(u.fullName || u.email)}
                                            </div>
                                            <div className={styles.userInfo}>
                                                <strong style={{ color: u.isBanned ? 'var(--error)' : 'inherit' }}>
                                                    {u.fullName || 'Utilisateur sans nom'} {u.isBanned && '(Banni)'}
                                                </strong>
                                                <span>{u.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.contactCell}>
                                            <div className={styles.contactItem}>
                                                <Mail size={14} className={styles.icon} />
                                                <span style={{ fontSize: '0.85rem' }}>{u.email}</span>
                                            </div>
                                            {u.phone && (
                                                <div className={styles.contactItem} style={{ marginTop: '4px' }}>
                                                    <Phone size={14} className={styles.icon} />
                                                    <span style={{ fontSize: '0.85rem' }}>{u.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {u.address ? (
                                            <div className={styles.addressCell}>
                                                <MapPin size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--text-muted)' }} />
                                                <span style={{ fontSize: '0.85rem' }}>{u.address}</span>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Non renseignée</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString('fr-FR') : 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={styles.iconBtn}
                                                onClick={() => toggleBan(u)}
                                                title={u.isBanned ? "Débloquer" : "Bannir"}
                                                style={{ color: u.isBanned ? 'var(--success)' : 'var(--text-muted)' }}
                                            >
                                                {u.isBanned ? <UserCheck size={18} /> : <Ban size={18} />}
                                            </button>
                                            <button
                                                className={styles.iconBtn}
                                                onClick={() => handleDelete(u.uid)}
                                                title="Supprimer"
                                                style={{ color: 'var(--error)' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                        Aucun client trouvé.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
