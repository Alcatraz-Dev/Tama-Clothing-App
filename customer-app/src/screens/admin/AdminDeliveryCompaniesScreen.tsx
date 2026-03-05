import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
    ScrollView,
} from 'react-native';
import {
    ArrowLeft,
    Truck,
    Plus,
    Search,
    Phone,
    MapPin,
    Edit3,
    Trash2,
    CheckCircle,
    XCircle,
    DollarSign,
    Building2,
    Package,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { db } from '../../api/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    getDocs,
    where,
} from 'firebase/firestore';
import {
    getPlatformWalletSummary,
    getAllBrandRevenues,
    type Wallet,
} from '../../services/codFinancialService';

interface DeliveryCompany {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    zone?: string;
    isActive: boolean;
    apiKey?: string;
    totalDeliveries?: number;
    totalRevenue?: number;
    createdAt?: any;
}

interface AdminDeliveryCompaniesScreenProps {
    onBack: () => void;
    t: (key: string) => string;
}

// ─── Company Card ───────────────────────────────────────────────────────────────
function CompanyCard({ company, onEdit, onToggle, onDelete, colors, theme, t }: any) {
    return (
        <View style={[styles.card, {
            backgroundColor: theme === 'dark' ? '#111118' : '#FFF',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: company.isActive ? '#10B98120' : '#EF444420' }]}>
                    <Truck size={20} color={company.isActive ? '#10B981' : '#EF4444'} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, { color: colors.foreground }]}>{company.name}</Text>
                    {company.zone && (
                        <Text style={[styles.cardZone, { color: colors.textMuted }]}>{company.zone}</Text>
                    )}
                </View>
                <View style={[styles.activeBadge, { backgroundColor: company.isActive ? '#10B98115' : '#EF444415' }]}>
                    <Text style={[styles.activeBadgeText, { color: company.isActive ? '#10B981' : '#EF4444' }]}>
                        {company.isActive ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                    </Text>
                </View>
            </View>

            <View style={styles.cardMeta}>
                {company.phone && (
                    <View style={styles.metaRow}>
                        <Phone size={12} color={colors.textMuted} />
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>{company.phone}</Text>
                    </View>
                )}
                {company.address && (
                    <View style={styles.metaRow}>
                        <MapPin size={12} color={colors.textMuted} />
                        <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>{company.address}</Text>
                    </View>
                )}
            </View>

            <View style={[styles.statsRow, { borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <View style={styles.statItem}>
                    <Package size={14} color={colors.accent} />
                    <Text style={[styles.statVal, { color: colors.foreground }]}>{company.totalDeliveries ?? 0}</Text>
                    <Text style={[styles.statLbl, { color: colors.textMuted }]}>Deliveries</Text>
                </View>
                <View style={styles.statItem}>
                    <DollarSign size={14} color="#10B981" />
                    <Text style={[styles.statVal, { color: colors.foreground }]}>{(company.totalRevenue ?? 0).toFixed(2)} TND</Text>
                    <Text style={[styles.statLbl, { color: colors.textMuted }]}>Revenue</Text>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.accent + '15' }]}
                    onPress={() => onEdit(company)}
                >
                    <Edit3 size={14} color={colors.accent} />
                    <Text style={[styles.actionText, { color: colors.accent }]}>{t('edit') || 'Edit'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: company.isActive ? '#EF444415' : '#10B98115' }]}
                    onPress={() => onToggle(company)}
                >
                    {company.isActive
                        ? <XCircle size={14} color="#EF4444" />
                        : <CheckCircle size={14} color="#10B981" />}
                    <Text style={[styles.actionText, { color: company.isActive ? '#EF4444' : '#10B981' }]}>
                        {company.isActive ? (t('deactivate') || 'Deactivate') : (t('activate') || 'Activate')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#EF444410' }]}
                    onPress={() => onDelete(company)}
                >
                    <Trash2 size={14} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Company Form Modal ─────────────────────────────────────────────────────────
function CompanyFormModal({ visible, onClose, onSave, initial, colors, theme, t }: any) {
    const [name, setName] = useState(initial?.name || '');
    const [phone, setPhone] = useState(initial?.phone || '');
    const [address, setAddress] = useState(initial?.address || '');
    const [zone, setZone] = useState(initial?.zone || '');
    const [apiKey, setApiKey] = useState(initial?.apiKey || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initial) {
            setName(initial.name || '');
            setPhone(initial.phone || '');
            setAddress(initial.address || '');
            setZone(initial.zone || '');
            setApiKey(initial.apiKey || '');
        } else {
            setName(''); setPhone(''); setAddress(''); setZone(''); setApiKey('');
        }
    }, [initial, visible]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert(t('error') || 'Error', t('nameRequired') || 'Name is required');
            return;
        }
        setSaving(true);
        await onSave({ name, phone, address, zone, apiKey });
        setSaving(false);
    };

    const inputStyle = [styles.input, {
        backgroundColor: theme === 'dark' ? '#1A1A28' : '#F5F5F9',
        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        color: colors.foreground,
    }];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
                <View style={[styles.modalHeader, { borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                    <TouchableOpacity onPress={onClose}>
                        <XCircle size={24} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                        {initial ? (t('editCompany') || 'Edit Company') : (t('newDeliveryCompany') || 'New Delivery Company')}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.modalContent}>
                    {[
                        { label: t('companyName') || 'Company Name', value: name, onChange: setName, placeholder: 'First Delivery Group', required: true },
                        { label: t('phone') || 'Phone', value: phone, onChange: setPhone, placeholder: '+216 XX XXX XXX' },
                        { label: t('address') || 'Address', value: address, onChange: setAddress, placeholder: 'Tunis, Tunisie' },
                        { label: t('zone') || 'Zone / Region', value: zone, onChange: setZone, placeholder: 'Grand Tunis' },
                        { label: t('apiKey') || 'API Key (optional)', value: apiKey, onChange: setApiKey, placeholder: 'Bearer ...' },
                    ].map((field, i) => (
                        <View key={i} style={{ marginBottom: 16 }}>
                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                {field.label}{field.required ? ' *' : ''}
                            </Text>
                            <TextInput
                                style={inputStyle}
                                value={field.value}
                                onChangeText={field.onChange}
                                placeholder={field.placeholder}
                                placeholderTextColor={colors.textMuted + '80'}
                                secureTextEntry={field.label.includes('API')}
                            />
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: colors.foreground }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving
                            ? <ActivityIndicator color={theme === 'dark' ? '#000' : '#FFF'} />
                            : <Text style={[styles.saveBtnText, { color: theme === 'dark' ? '#000' : '#FFF' }]}>
                                {initial ? (t('saveChanges') || 'Save Changes') : (t('createCompany') || 'Create Company')}
                            </Text>
                        }
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
    );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────
export default function AdminDeliveryCompaniesScreen({ onBack, t }: AdminDeliveryCompaniesScreenProps) {
    const { colors, theme } = useAppTheme();
    const isDark = theme === 'dark';

    const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCompany, setEditingCompany] = useState<DeliveryCompany | null>(null);

    // Platform finance summary
    const [platformWallet, setPlatformWallet] = useState<Wallet | null>(null);
    const [brandRevenues, setBrandRevenues] = useState<{ brandId: string; brandName: string; totalRevenue: number }[]>([]);

    useEffect(() => {
        const q = query(collection(db, 'deliveryCompanies'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setCompanies(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<DeliveryCompany, 'id'>) })));
            setLoading(false);
        });

        // Load platform finance data
        (async () => {
            try {
                const wallet = await getPlatformWalletSummary();
                setPlatformWallet(wallet);
                const revenues = await getAllBrandRevenues();
                setBrandRevenues(revenues.slice(0, 5));
            } catch (e) {
                console.warn('Failed to load finance summary', e);
            }
        })();

        return () => unsub();
    }, []);

    const handleSave = async (data: Partial<DeliveryCompany>) => {
        try {
            if (editingCompany) {
                await updateDoc(doc(db, 'deliveryCompanies', editingCompany.id), {
                    ...data,
                    updatedAt: serverTimestamp(),
                });
            } else {
                await addDoc(collection(db, 'deliveryCompanies'), {
                    ...data,
                    isActive: true,
                    totalDeliveries: 0,
                    totalRevenue: 0,
                    createdAt: serverTimestamp(),
                });
            }
            setModalVisible(false);
            setEditingCompany(null);
        } catch (err: any) {
            Alert.alert(t('error') || 'Error', err.message);
        }
    };

    const handleToggle = async (company: DeliveryCompany) => {
        await updateDoc(doc(db, 'deliveryCompanies', company.id), {
            isActive: !company.isActive,
            updatedAt: serverTimestamp(),
        });
    };

    const handleDelete = (company: DeliveryCompany) => {
        Alert.alert(
            t('deleteCompany') || 'Delete Company',
            t('confirmDeleteCompany') || 'Are you sure you want to delete this delivery company?',
            [
                { text: t('cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('delete') || 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteDoc(doc(db, 'deliveryCompanies', company.id));
                    },
                },
            ]
        );
    };

    const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft color={colors.foreground} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                    {t('deliveryCompanies') || 'Delivery Companies'}
                </Text>
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.foreground }]}
                    onPress={() => { setEditingCompany(null); setModalVisible(true); }}
                >
                    <Plus size={18} color={isDark ? '#000' : '#FFF'} />
                </TouchableOpacity>
            </View>

            {/* Platform Finance Summary */}
            {platformWallet && (
                <View style={[styles.financeBar, {
                    backgroundColor: isDark ? '#0F0E2E' : '#EEF2FF',
                    borderColor: isDark ? '#2D2B6E' : '#C7D2FE',
                }]}>
                    <Building2 size={16} color="#6C63FF" />
                    <Text style={[styles.financeText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>
                        {t('platformRevenue') || 'Platform Revenue'}: {(platformWallet.totalEarned ?? 0).toFixed(2)} TND
                        {'  ·  '}Balance: {(platformWallet.balance ?? 0).toFixed(2)} TND
                    </Text>
                </View>
            )}

            {/* Search */}
            <View style={[styles.searchBar, {
                backgroundColor: isDark ? '#1A1A28' : '#F5F5F9',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            }]}>
                <Search size={16} color={colors.textMuted} />
                <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    value={search}
                    onChangeText={setSearch}
                    placeholder={t('searchCompanies') || 'Search companies...'}
                    placeholderTextColor={colors.textMuted + '80'}
                />
            </View>

            {loading ? (
                <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Truck size={48} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                {t('noDeliveryCompanies') || 'No delivery companies yet'}
                            </Text>
                            <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
                                {t('addFirstCompany') || 'Add your first delivery company to start managing logistics.'}
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <CompanyCard
                            company={item}
                            colors={colors}
                            theme={theme}
                            t={t}
                            onEdit={(c: DeliveryCompany) => { setEditingCompany(c); setModalVisible(true); }}
                            onToggle={handleToggle}
                            onDelete={handleDelete}
                        />
                    )}
                />
            )}

            <CompanyFormModal
                visible={modalVisible}
                onClose={() => { setModalVisible(false); setEditingCompany(null); }}
                onSave={handleSave}
                initial={editingCompany}
                colors={colors}
                theme={theme}
                t={t}
            />
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 55, paddingBottom: 14,
    },
    headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    addBtn: {
        width: 34, height: 34, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    financeBar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: 16, borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1,
    },
    financeText: { fontSize: 12, fontWeight: '700', flex: 1 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        marginHorizontal: 16, borderRadius: 14, paddingHorizontal: 14, height: 44,
        borderWidth: 1, marginBottom: 12,
    },
    searchInput: { flex: 1, fontSize: 13, fontWeight: '500' },
    list: { padding: 16, paddingBottom: 100 },

    // Card
    card: {
        borderRadius: 20, padding: 16, marginBottom: 12,
        borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardInfo: { flex: 1 },
    cardName: { fontSize: 15, fontWeight: '800' },
    cardZone: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    activeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    activeBadgeText: { fontSize: 10, fontWeight: '800' },
    cardMeta: { gap: 6, marginBottom: 12 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 11, fontWeight: '500', flex: 1 },
    statsRow: {
        flexDirection: 'row', paddingTop: 12, marginBottom: 12,
        borderTopWidth: 1, gap: 20,
    },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statVal: { fontSize: 13, fontWeight: '800' },
    statLbl: { fontSize: 10, fontWeight: '600' },
    cardActions: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 8, borderRadius: 10, gap: 4,
    },
    actionText: { fontSize: 11, fontWeight: '700' },

    // Empty
    empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyText: { fontSize: 15, fontWeight: '700' },
    emptySubText: { fontSize: 12, fontWeight: '500', textAlign: 'center', lineHeight: 18, paddingHorizontal: 30 },

    // Modal
    modalRoot: { flex: 1 },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1,
    },
    modalTitle: { fontSize: 15, fontWeight: '800' },
    modalContent: { padding: 20, paddingBottom: 60 },
    fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
    input: {
        height: 48, borderRadius: 14, paddingHorizontal: 14,
        fontSize: 14, fontWeight: '600', borderWidth: 1,
    },
    saveBtn: {
        height: 52, borderRadius: 16, alignItems: 'center',
        justifyContent: 'center', marginTop: 10,
    },
    saveBtnText: { fontSize: 15, fontWeight: '800' },
});
