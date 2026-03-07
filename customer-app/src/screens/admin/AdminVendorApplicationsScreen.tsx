import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Image,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { ChevronLeft, Check, X, Eye, User, Building2, Mail, Phone, MapPin, FileText, CreditCard } from 'lucide-react-native';
import { Theme } from '../../theme';

interface VendorApplication {
    id: string;
    userId: string;
    tier: string;
    businessName: string;
    businessEmail: string;
    businessPhone: string;
    businessAddress: string;
    businessDescription: string;
    businessCategory: string;
    socialMedia?: {
        instagram?: string;
        facebook?: string;
        whatsapp?: string;
    };
    documents?: {
        businessLicense?: string;
        idCard?: string;
        storeFront?: string;
    };
    paymentProof?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
    updatedAt: any;
}

interface AdminVendorApplicationsScreenProps {
    onBack: () => void;
    t: (key: string) => string;
    theme: 'light' | 'dark';
}

export default function AdminVendorApplicationsScreen({ onBack, t, theme }: AdminVendorApplicationsScreenProps) {
    const isDark = theme === 'dark';
    const colors = isDark ? Theme.dark.colors : Theme.light.colors;
    const insets = useSafeAreaInsets();
    const accent = '#6C63FF';

    const [applications, setApplications] = useState<VendorApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const q = query(collection(db, 'vendorApplications'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const apps: VendorApplication[] = [];
            snapshot.forEach((doc) => {
                apps.push({ id: doc.id, ...doc.data() } as VendorApplication);
            });
            setApplications(apps);
        } catch (error) {
            console.error('Error fetching vendor applications:', error);
            Alert.alert(t('error') || 'Error', 'Failed to load vendor applications');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchApplications();
    };

    const handleApprove = async (application: VendorApplication) => {
        Alert.alert(
            t('approve') || 'Approve',
            `Are you sure you want to approve ${application.businessName}?`,
            [
                { text: t('cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('approve') || 'Approve',
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'vendorApplications', application.id), {
                                status: 'approved',
                                updatedAt: new Date(),
                            });
                            // Update user profile to vendor
                            await updateDoc(doc(db, 'users', application.userId), {
                                role: 'vendor',
                                vendorData: {
                                    businessName: application.businessName,
                                    tier: application.tier,
                                    status: 'approved',
                                },
                            });
                            Alert.alert(t('successTitle') || 'Success', 'Vendor application approved!');
                            fetchApplications();
                            setSelectedApp(null);
                        } catch (error: any) {
                            console.error('Error approving vendor:', error);
                            Alert.alert(t('error') || 'Error', error.message);
                        }
                    },
                },
            ]
        );
    };

    const handleReject = async (application: VendorApplication) => {
        Alert.alert(
            t('reject') || 'Reject',
            `Are you sure you want to reject ${application.businessName}?`,
            [
                { text: t('cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('reject') || 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'vendorApplications', application.id), {
                                status: 'rejected',
                                updatedAt: new Date(),
                            });
                            Alert.alert(t('successTitle') || 'Success', 'Vendor application rejected.');
                            fetchApplications();
                            setSelectedApp(null);
                        } catch (error: any) {
                            console.error('Error rejecting vendor:', error);
                            Alert.alert(t('error') || 'Error', error.message);
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return '#F59E0B';
            case 'approved':
                return '#10B981';
            case 'rejected':
                return '#EF4444';
            default:
                return colors.textMuted;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return t('vendorPending') || 'Pending';
            case 'approved':
                return t('approved') || 'Approved';
            case 'rejected':
                return t('rejected') || 'Rejected';
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={accent} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ChevronLeft size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                    {t('vendorApplications') || 'Vendor Applications'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {selectedApp ? (
                /* Application Details View */
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.detailTitle, { color: colors.foreground }]}>
                            {selectedApp.businessName}
                        </Text>
                        
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedApp.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(selectedApp.status) }]}>
                                {getStatusLabel(selectedApp.status)}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <User size={18} color={colors.textMuted} />
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>User ID:</Text>
                            <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                                {selectedApp.userId}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Building2 size={18} color={colors.textMuted} />
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Tier:</Text>
                            <Text style={[styles.detailValue, { color: colors.foreground }]}>
                                {selectedApp.tier}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Mail size={18} color={colors.textMuted} />
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Email:</Text>
                            <Text style={[styles.detailValue, { color: colors.foreground }]}>
                                {selectedApp.businessEmail}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Phone size={18} color={colors.textMuted} />
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Phone:</Text>
                            <Text style={[styles.detailValue, { color: colors.foreground }]}>
                                {selectedApp.businessPhone}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <MapPin size={18} color={colors.textMuted} />
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Address:</Text>
                            <Text style={[styles.detailValue, { color: colors.foreground }]}>
                                {selectedApp.businessAddress}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <FileText size={18} color={colors.textMuted} />
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Category:</Text>
                            <Text style={[styles.detailValue, { color: colors.foreground }]}>
                                {selectedApp.businessCategory}
                            </Text>
                        </View>

                        {selectedApp.businessDescription && (
                            <View style={styles.descriptionSection}>
                                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Description:</Text>
                                <Text style={[styles.description, { color: colors.foreground }]}>
                                    {selectedApp.businessDescription}
                                </Text>
                            </View>
                        )}

                        {selectedApp.socialMedia && (
                            <View style={styles.socialSection}>
                                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Social Media:</Text>
                                {selectedApp.socialMedia.instagram && (
                                    <Text style={[styles.socialText, { color: colors.foreground }]}>
                                        Instagram: {selectedApp.socialMedia.instagram}
                                    </Text>
                                )}
                                {selectedApp.socialMedia.facebook && (
                                    <Text style={[styles.socialText, { color: colors.foreground }]}>
                                        Facebook: {selectedApp.socialMedia.facebook}
                                    </Text>
                                )}
                                {selectedApp.socialMedia.whatsapp && (
                                    <Text style={[styles.socialText, { color: colors.foreground }]}>
                                        WhatsApp: {selectedApp.socialMedia.whatsapp}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Documents Section */}
                        {selectedApp.documents && (
                            <View style={styles.documentsSection}>
                                <Text style={[styles.sectionHeader, { color: colors.foreground }]}>Uploaded Documents</Text>
                                
                                {selectedApp.documents.businessLicense && (
                                    <TouchableOpacity 
                                        style={[styles.documentCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                                        onPress={() => setSelectedImage(selectedApp.documents?.businessLicense || null)}
                                    >
                                        <FileText size={24} color={accent} />
                                        <View style={styles.documentInfo}>
                                            <Text style={[styles.documentLabel, { color: colors.foreground }]}>Business License</Text>
                                            <Text style={[styles.documentHint, { color: accent }]}>Tap to view</Text>
                                        </View>
                                        <Eye size={20} color={accent} />
                                    </TouchableOpacity>
                                )}

                                {selectedApp.documents.idCard && (
                                    <TouchableOpacity 
                                        style={[styles.documentCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                                        onPress={() => setSelectedImage(selectedApp.documents?.idCard || null)}
                                    >
                                        <User size={24} color={accent} />
                                        <View style={styles.documentInfo}>
                                            <Text style={[styles.documentLabel, { color: colors.foreground }]}>ID Card</Text>
                                            <Text style={[styles.documentHint, { color: accent }]}>Tap to view</Text>
                                        </View>
                                        <Eye size={20} color={accent} />
                                    </TouchableOpacity>
                                )}

                                {selectedApp.documents.storeFront && (
                                    <TouchableOpacity 
                                        style={[styles.documentCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                                        onPress={() => setSelectedImage(selectedApp.documents?.storeFront || null)}
                                    >
                                        <Building2 size={24} color={accent} />
                                        <View style={styles.documentInfo}>
                                            <Text style={[styles.documentLabel, { color: colors.foreground }]}>Store Front Photo</Text>
                                            <Text style={[styles.documentHint, { color: accent }]}>Tap to view</Text>
                                        </View>
                                        <Eye size={20} color={accent} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Payment Proof Section */}
                        {selectedApp.paymentProof && (
                            <View style={styles.documentsSection}>
                                <Text style={[styles.sectionHeader, { color: colors.foreground }]}>Payment Proof</Text>
                                <TouchableOpacity 
                                    style={[styles.documentCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={() => setSelectedImage(selectedApp.paymentProof || null)}
                                >
                                    <CreditCard size={24} color={accent} />
                                    <View style={styles.documentInfo}>
                                        <Text style={[styles.documentLabel, { color: colors.foreground }]}>Payment Receipt</Text>
                                        <Text style={[styles.documentHint, { color: accent }]}>Tap to view payment proof</Text>
                                    </View>
                                    <Eye size={20} color={accent} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {selectedApp.status === 'pending' && (
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.approveBtn, { backgroundColor: '#10B981' }]}
                                    onPress={() => handleApprove(selectedApp)}
                                >
                                    <Check size={20} color="#FFF" />
                                    <Text style={styles.actionBtnText}>{t('approve') || 'Approve'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.rejectBtn, { backgroundColor: '#EF4444' }]}
                                    onPress={() => handleReject(selectedApp)}
                                >
                                    <X size={20} color="#FFF" />
                                    <Text style={styles.actionBtnText}>{t('reject') || 'Reject'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.closeBtn, { borderColor: colors.border }]}
                            onPress={() => setSelectedApp(null)}
                        >
                            <Text style={[styles.closeBtnText, { color: colors.foreground }]}>
                                {t('vendorClose') || 'Close'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            ) : (
                /* Applications List View */
                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={accent} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {applications.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                {t('noVendorApplications') || 'No vendor applications'}
                            </Text>
                        </View>
                    ) : (
                        applications.map((app) => (
                            <TouchableOpacity
                                key={app.id}
                                style={[styles.appCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => setSelectedApp(app)}
                            >
                                <View style={styles.appHeader}>
                                    <View style={styles.appInfo}>
                                        <Text style={[styles.appName, { color: colors.foreground }]}>
                                            {app.businessName}
                                        </Text>
                                        <Text style={[styles.appEmail, { color: colors.textMuted }]}>
                                            {app.businessEmail}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) + '20' }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>
                                            {getStatusLabel(app.status)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.appDetails}>
                                    <Text style={[styles.appTier, { color: accent }]}>
                                        {app.tier?.toUpperCase()}
                                    </Text>
                                    <Text style={[styles.appCategory, { color: colors.textMuted }]}>
                                        {app.businessCategory}
                                    </Text>
                                </View>
                                <View style={styles.viewButton}>
                                    <Eye size={16} color={accent} />
                                    <Text style={[styles.viewText, { color: accent }]}>
                                        {t('viewDetails') || 'View Details'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
    },
    appCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    appHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    appInfo: {
        flex: 1,
    },
    appName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    appEmail: {
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    appDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    appTier: {
        fontSize: 12,
        fontWeight: '600',
    },
    appCategory: {
        fontSize: 12,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    viewText: {
        fontSize: 14,
        fontWeight: '500',
    },
    // Detail View Styles
    detailCard: {
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
    },
    detailTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    detailLabel: {
        fontSize: 14,
        width: 80,
    },
    detailValue: {
        fontSize: 14,
        flex: 1,
    },
    descriptionSection: {
        marginTop: 8,
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 8,
    },
    socialSection: {
        marginTop: 8,
        marginBottom: 12,
    },
    socialText: {
        fontSize: 14,
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    approveBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    rejectBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    closeBtn: {
        marginTop: 12,
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    // Documents Section Styles
    documentsSection: {
        marginTop: 20,
        marginBottom: 12,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    documentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
    },
    documentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    documentLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    documentHint: {
        fontSize: 12,
        marginTop: 2,
    },

    closeBtnText: {
        fontSize: 16,
        fontWeight: '500',
    },
});
