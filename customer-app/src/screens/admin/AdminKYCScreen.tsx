import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Dimensions
} from 'react-native';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { ChevronLeft, CheckCircle2, XCircle, Search, User, CreditCard, Calendar, Clock, ShieldCheck } from 'lucide-react-native';
import { Theme } from '../../theme';
import { AdminHeader } from '../../components/admin/AdminUI';

const { width } = Dimensions.get('window');

interface AdminKYCScreenProps {
    onBack: () => void;
    t: (key: string) => string;
    theme: 'light' | 'dark';
    profileData?: any;
}

export default function AdminKYCScreen({ onBack, t, theme, profileData }: AdminKYCScreenProps) {
    const isDark = theme === 'dark';
    const colors = isDark ? Theme.dark.colors : Theme.light.colors;

    const [requests, setRequests] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [userHistory, setUserHistory] = useState<any[]>([]);

    useEffect(() => {
        const q = query(
            collection(db, 'users'),
            where('kycStatus', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Enrich data with previous count if needed, but client-side sort is primary
            const enriched = await Promise.all(data.map(async (u: any) => {
                const historyQ = query(
                    collection(db, 'kyc_history'),
                    where('userId', '==', u.id)
                );
                const historySnap = await getDocs(historyQ);
                return { ...u, previousAttempts: historySnap.size };
            }));

            enriched.sort((a: any, b: any) => {
                const dateA = a.kycData?.submittedAt ? new Date(a.kycData.submittedAt).getTime() : 0;
                const dateB = b.kycData?.submittedAt ? new Date(b.kycData.submittedAt).getTime() : 0;
                return dateB - dateA;
            });

            setRequests(enriched);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching KYC requests:', err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch history (approved/rejected)
    useEffect(() => {
        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                const q = query(
                    collection(db, 'kyc_history'),
                    orderBy('verifiedAt', 'desc')
                );
                const snap = await getDocs(q);
                const historyData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setHistory(historyData);
            } catch (err) {
                console.error('Error fetching KYC history:', err);
            } finally {
                setLoadingHistory(false);
            }
        };

        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedUser) {
            fetchUserHistory(selectedUser.id);
        } else {
            setUserHistory([]);
        }
    }, [selectedUser]);

    const fetchUserHistory = async (userId: string) => {
        try {
            const q = query(
                collection(db, 'kyc_history'),
                where('userId', '==', userId),
                orderBy('verifiedAt', 'desc')
            );
            const snap = await getDocs(q);
            setUserHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('Error fetching user KYC history:', err);
        }
    };

    const handleAction = async (status: 'approved' | 'rejected') => {
        if (!selectedUser) return;
        setProcessing(true);
        try {
            const updates: any = {
                kycStatus: status,
                'kycData.verifiedAt': new Date().toISOString(),
                'kycData.status': status
            };

            if (status === 'approved' && selectedUser.kycData?.requestedRole) {
                updates.role = selectedUser.kycData.requestedRole;
            }

            await updateDoc(doc(db, 'users', selectedUser.id), updates);

            // Add to kyc_history collection
            await addDoc(collection(db, 'kyc_history'), {
                userId: selectedUser.id,
                userName: selectedUser.kycData?.fullName || selectedUser.fullName || selectedUser.displayName || 'Unknown',
                userEmail: selectedUser.email || 'N/A',
                status: status,
                verifiedAt: new Date().toISOString(),
                verifierId: profileData?.id || 'admin',
                requestedRole: selectedUser.kycData?.requestedRole || 'user',
                rejectionReason: status === 'rejected' ? 'Incomplete or invalid documents' : null
            });

            Alert.alert(
                status === 'approved' ? 'Approved' : 'Rejected',
                `User KYC has been ${status}.`
            );
            setSelectedUser(null);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update status');
        } finally {
            setProcessing(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: isDark ? '#1A1A1A' : '#FFF', borderColor: colors.border }]}
            onPress={() => setSelectedUser(item)}
        >
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                <View style={styles.avatarWrapper}>
                    {item.avatarUrl ? (
                        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#333' : '#F0F0F5' }]}>
                            <User size={22} color={colors.textMuted} />
                        </View>
                    )}
                    {item.previousAttempts > 0 && (
                        <View style={styles.retryBadge}>
                            <Text style={styles.retryText}>{item.previousAttempts} ATTEMPTS</Text>
                        </View>
                    )}
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.name, { color: isDark ? '#FFF' : '#000' }]} numberOfLines={1}>
                            {item.kycData?.fullName || item.fullName || item.displayName || 'Unknown User'}
                        </Text>
                    </View>
                    <Text style={[styles.email, { color: isDark ? '#AAA' : '#666' }]} numberOfLines={1}>
                        {item.email || 'No Email'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                        <Clock size={12} color={colors.warning} />
                        <Text style={{ fontSize: 11, color: colors.warning, fontWeight: '600' }}>Pending Review</Text>
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>
                        {item.kycData?.submittedAt ? new Date(item.kycData.submittedAt).toLocaleDateString() : 'N/A'}
                    </Text>
                    <ChevronLeft size={16} color={colors.textMuted} style={{ transform: [{ rotate: '180deg' }], marginTop: 5 }} />
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderHistoryItem = ({ item }: { item: any }) => {
        const isApproved = item.status === 'approved';
        return (
            <View
                style={[styles.card, { backgroundColor: isDark ? '#1A1A1A' : '#FFF', borderColor: colors.border }]}
            >
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#333' : '#E5E5E5' }]}>
                        <User size={20} color={colors.textMuted} />
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={[styles.name, { color: isDark ? '#FFF' : '#000' }]}>
                            {item.userName || 'Unknown User'}
                        </Text>
                        <Text style={[styles.email, { color: isDark ? '#AAA' : '#666' }]}>
                            {item.userEmail || 'No Email'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                            {isApproved ? (
                                <CheckCircle2 size={12} color="#34C759" />
                            ) : (
                                <XCircle size={12} color="#FF3B30" />
                            )}
                            <Text style={{ fontSize: 11, color: isApproved ? '#34C759' : '#FF3B30', textTransform: 'uppercase' }}>
                                {item.status}
                            </Text>
                            {item.rejectionReason && !isApproved && (
                                <Text style={{ fontSize: 10, color: colors.textMuted, marginLeft: 5 }} numberOfLines={1}>
                                    • {item.rejectionReason}
                                </Text>
                            )}
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>
                            {item.verifiedAt ? new Date(item.verifiedAt).toLocaleDateString() : 'N/A'}
                        </Text>
                        <ShieldCheck size={16} color={isApproved ? '#34C759' : '#FF3B30'} style={{ marginTop: 5 }} />
                    </View>
                </View>
            </View>
        );
    };

    const renderDetailModal = () => {
        if (!selectedUser) return null;
        const kyc = selectedUser.kycData || {};

        return (
            <Modal
                visible={!!selectedUser}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setSelectedUser(null)}
            >
                <View style={[styles.modalContainer, { backgroundColor: isDark ? '#111' : '#FFF' }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border, marginTop: 40 }]}>
                        <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('identityVerification').toUpperCase()}</Text>
                        <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.closeBtn}>
                            <XCircle size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {/* User Info Section */}
                        <View style={[styles.section, { backgroundColor: isDark ? '#1A1A1A' : '#FAFAFA' }]}>
                            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>APPLICANT DETAILS</Text>
                            <View style={styles.infoRow}>
                                <User size={16} color={colors.textMuted} />
                                <Text style={[styles.infoText, { color: colors.foreground }]}>{kyc.fullName}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <CreditCard size={16} color={colors.textMuted} />
                                <Text style={[styles.infoText, { color: colors.foreground }]}>{kyc.idNumber}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Calendar size={16} color={colors.textMuted} />
                                <Text style={[styles.infoText, { color: colors.foreground }]}>{kyc.dob}</Text>
                            </View>
                            {kyc.requestedRole && (
                                <View style={styles.infoRow}>
                                    <ShieldCheck size={16} color={'#5856D6'} />
                                    <View>
                                        <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>REQUESTED ROLE</Text>
                                        <Text style={[styles.infoText, { color: colors.foreground, textTransform: 'uppercase' }]}>{kyc.requestedRole.replace('_', ' ')}</Text>
                                    </View>
                                </View>
                            )}
                            {kyc.vehicleType && (
                                <View style={styles.infoRow}>
                                    <CreditCard size={16} color={colors.textMuted} />
                                    <View>
                                        <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>VEHICLE TYPE</Text>
                                        <Text style={[styles.infoText, { color: colors.foreground }]}>{kyc.vehicleType}</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* ID Images */}
                        <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 20 }]}>ID DOCUMENTS</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
                            <View style={{ marginRight: 15 }}>
                                <Text style={{ color: colors.textMuted, marginBottom: 5, fontSize: 12 }}>Front Side</Text>
                                <Image source={{ uri: kyc.idFrontUrl }} style={styles.docImage} />
                            </View>
                            <View>
                                <Text style={{ color: colors.textMuted, marginBottom: 5, fontSize: 12 }}>Back Side</Text>
                                <Image source={{ uri: kyc.idBackUrl }} style={styles.docImage} />
                            </View>
                        </ScrollView>

                        {/* Selfie */}
                        <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 20 }]}>SELFIE VERIFICATION</Text>
                        <View style={{ alignItems: 'center', marginTop: 10 }}>
                            <Image source={{ uri: kyc.selfieUrl }} style={styles.selfieImage} />
                        </View>

                        {/* Verification History for this User */}
                        {userHistory.length > 0 && (
                            <View style={{ marginTop: 30, marginBottom: 20 }}>
                                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PREVIOUS ATTEMPTS</Text>
                                {userHistory.map((h, idx) => (
                                    <View key={h.id || idx} style={[styles.historyRow, { borderBottomColor: colors.border, borderBottomWidth: idx === userHistory.length - 1 ? 0 : 1 }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                {h.status === 'approved' ? <CheckCircle2 size={14} color="#34C759" /> : <XCircle size={14} color="#FF3B30" />}
                                                <Text style={[styles.historyStatus, { color: h.status === 'approved' ? '#34C759' : '#FF3B30' }]}>
                                                    {h.status.toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={{ fontSize: 11, color: colors.textMuted }}>
                                                {new Date(h.verifiedAt).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>Role: {h.requestedRole?.toUpperCase()}</Text>
                                        {h.status === 'rejected' && <Text style={{ fontSize: 12, color: colors.error, marginTop: 2 }}>{h.rejectionReason}</Text>}
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    {/* Action Bar */}
                    <View style={[styles.actionBar, { borderTopColor: colors.border, backgroundColor: isDark ? '#111' : '#FFF', paddingBottom: 50 }]}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#FF3B3015' }]}
                            onPress={() => handleAction('rejected')}
                            disabled={processing}
                        >
                            {processing ? <ActivityIndicator color="#FF3B30" /> : (
                                <>
                                    <XCircle size={20} color="#FF3B30" />
                                    <Text style={{ color: '#FF3B30', fontWeight: '700', marginLeft: 8 }}>REJECT</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#34C759' }]}
                            onPress={() => handleAction('approved')}
                            disabled={processing}
                        >
                            {processing ? <ActivityIndicator color="#FFF" /> : (
                                <>
                                    <CheckCircle2 size={20} color="#FFF" />
                                    <Text style={{ color: '#FFF', fontWeight: '700', marginLeft: 8 }}>APPROVE</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <AdminHeader title={t('identityVerification')} onBack={onBack} />

            {/* Tab Selector */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 15 }}>
                <View style={[styles.tabContainer, { backgroundColor: isDark ? '#1A1A1A' : '#F0F0F0', borderColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'pending' && { backgroundColor: isDark ? '#333' : '#FFF' }]}
                        onPress={() => setActiveTab('pending')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'pending' ? colors.foreground : colors.textMuted }]}>
                            Pending ({requests.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'history' && { backgroundColor: isDark ? '#333' : '#FFF' }]}
                        onPress={() => setActiveTab('history')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'history' ? colors.foreground : colors.textMuted }]}>
                            History
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {activeTab === 'pending' ? (
                loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={colors.foreground} />
                    </View>
                ) : requests.length === 0 ? (
                    <View style={styles.centered}>
                        <ShieldCheck size={60} color={colors.border} style={{ marginBottom: 15 }} />
                        <Text style={{ color: colors.textMuted, fontSize: 16 }}>No pending verifications</Text>
                    </View>
                ) : (
                    <FlatList
                        data={requests}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 20 }}
                    />
                )
            ) : (
                loadingHistory ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={colors.foreground} />
                    </View>
                ) : history.length === 0 ? (
                    <View style={styles.centered}>
                        <ShieldCheck size={60} color={colors.border} style={{ marginBottom: 15 }} />
                        <Text style={{ color: colors.textMuted, fontSize: 16 }}>No verification history</Text>
                    </View>
                ) : (
                    <FlatList
                        data={history}
                        keyExtractor={item => item.id}
                        renderItem={renderHistoryItem}
                        contentContainerStyle={{ padding: 20 }}
                    />
                )
            )}

            {renderDetailModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 15,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    card: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    avatarWrapper: {
        position: 'relative',
    },
    retryBadge: {
        position: 'absolute',
        top: -6,
        left: -6,
        backgroundColor: '#FF9500',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    retryText: {
        color: 'white',
        fontSize: 6,
        fontWeight: '900',
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
    },
    avatarPlaceholder: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {
        fontSize: 15,
        fontWeight: '800',
    },
    email: {
        fontSize: 12,
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    closeBtn: {
        padding: 5,
    },
    section: {
        padding: 16,
        borderRadius: 16,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        marginBottom: 12,
        letterSpacing: 1.2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 12,
    },
    infoText: {
        fontSize: 15,
        fontWeight: '700',
    },
    docImage: {
        width: 280,
        height: 180,
        borderRadius: 16,
        resizeMode: 'cover',
        backgroundColor: '#eee'
    },
    selfieImage: {
        width: 220,
        height: 220,
        borderRadius: 110,
        resizeMode: 'cover',
        backgroundColor: '#eee'
    },
    actionBar: {
        flexDirection: 'row',
        padding: 20,
        gap: 15,
        paddingBottom: 45,
        borderTopWidth: 1,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 28,
    },
    historyRow: {
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    historyStatus: {
        fontSize: 11,
        fontWeight: '900',
    }
});
