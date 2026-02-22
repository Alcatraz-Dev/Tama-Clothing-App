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
import { collection, query, where, getDocs, doc, updateDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../api/firebase';
import { ChevronLeft, CheckCircle2, XCircle, Search, User, CreditCard, Calendar, Clock, ShieldCheck } from 'lucide-react-native';
import { Theme } from '../theme';
import { BlurView } from 'expo-blur';

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
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const q = query(
            collection(db, 'users'),
            where('kycStatus', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort client-side as composite index might be missing for mixed query
            data.sort((a: any, b: any) => {
                const dateA = a.kycData?.submittedAt ? new Date(a.kycData.submittedAt).getTime() : 0;
                const dateB = b.kycData?.submittedAt ? new Date(b.kycData.submittedAt).getTime() : 0;
                return dateB - dateA; // Newest first
            });
            setRequests(data);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching KYC requests:', err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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
                {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#333' : '#E5E5E5' }]}>
                        <User size={20} color={colors.textMuted} />
                    </View>
                )}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={[styles.name, { color: isDark ? '#FFF' : '#000' }]}>
                        {item.kycData?.fullName || item.fullName || item.displayName || 'Unknown User'}
                    </Text>
                    <Text style={[styles.email, { color: isDark ? '#AAA' : '#666' }]}>
                        {item.email || 'No Email'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                        <Clock size={12} color={colors.warning} />
                        <Text style={{ fontSize: 11, color: colors.warning }}>Pending Review</Text>
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>
                        {item.kycData?.submittedAt ? new Date(item.kycData.submittedAt).toLocaleDateString() : 'N/A'}
                    </Text>
                    <ChevronLeft size={16} color={colors.textMuted} style={{ transform: [{ rotate: '180deg' }], marginTop: 5 }} />
                </View>
            </View>
        </TouchableOpacity>
    );

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
                        <Text style={[styles.modalTitle, { color: colors.foreground }]}>KYC Verification</Text>
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
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F2F2F7' }]}>
                    <ChevronLeft size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>KYC Requests</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
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
    card: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    email: {
        fontSize: 13,
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 20, // Modal default safe area usually checks out or use SafeAreaView
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 5,
    },
    section: {
        padding: 15,
        borderRadius: 12,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 10,
        letterSpacing: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    infoText: {
        fontSize: 16,
        fontWeight: '600',
    },
    docImage: {
        width: 250,
        height: 160,
        borderRadius: 12,
        resizeMode: 'cover',
        backgroundColor: '#eee'
    },
    selfieImage: {
        width: 200,
        height: 200,
        borderRadius: 100,
        resizeMode: 'cover',
        backgroundColor: '#eee'
    },
    actionBar: {
        flexDirection: 'row',
        padding: 20,
        gap: 15,
        paddingBottom: 40,
        borderTopWidth: 1,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 54,
        borderRadius: 27,
    }
});
