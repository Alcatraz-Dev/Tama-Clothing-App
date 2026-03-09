import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Dimensions,
    StyleSheet,
    Animated,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Plus,
    Pencil,
    Trash2,
    QrCode,
    MapPin,
    Gift,
    Calendar,
    Users,
    Play,
    Pause,
    Check,
    X,
    Trophy,
    RefreshCw,
    Target,
    Award,
    Clock,
} from 'lucide-react-native';
import { Timestamp } from 'firebase/firestore';

import { db } from '../../api/firebase';
import { useAppTheme } from '../../context/ThemeContext';
import {
    AdminCard,
    InputLabel,
    SectionLabel,
    ModernSwitch,
    AdminInput,
    AdminHeader,
} from '../../components/admin/AdminUI';
import { DatePicker } from '../../components/ui/date-picker';
import { Picker } from '../../components/ui/picker';
import { Button } from '../../components/ui/button';
import { treasureHuntService, Campaign, TreasureLocation } from '../../services/TreasureHuntService';

const { width } = Dimensions.get('window');

interface AdminTreasureHuntScreenProps {
    onBack: () => void;
    t: any;
    theme?: any;
}

type TabType = 'campaigns' | 'locations';

export default function AdminTreasureHuntScreen({ onBack, t, theme }: AdminTreasureHuntScreenProps) {
    const { colors, theme: appTheme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isDark = appTheme === 'dark';
    const scrollY = useRef(new Animated.Value(0)).current;
    
    // Translation helper with fallback values for missing keys
    const tr = (key: string, fallback: string = key) => {
        const translated = t(key);
        return translated === key ? fallback : translated;
    };

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [locations, setLocations] = useState<TreasureLocation[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('campaigns');
    const [showHistory, setShowHistory] = useState(false);
    const [activeCampaignLocations, setActiveCampaignLocations] = useState(0);
    
    // Modal states
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [editingLocation, setEditingLocation] = useState<TreasureLocation | null>(null);
    
    // Form states
    const [campaignNameFr, setCampaignNameFr] = useState('');
    const [campaignNameAr, setCampaignNameAr] = useState('');
    const [campaignDescFr, setCampaignDescFr] = useState('');
    const [campaignDescAr, setCampaignDescAr] = useState('');
    const [rewardType, setRewardType] = useState<string>('points');
    const [rewardValue, setRewardValue] = useState('100');
    const [maxParticipants, setMaxParticipants] = useState('1000');
    const [isPublic, setIsPublic] = useState(false);
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    
    // Time state for campaigns
    const [startTime, setStartTime] = useState<string>('00:00');
    const [endTime, setEndTime] = useState<string>('23:59');
    
    // Location form states
    const [locationNameFr, setLocationNameFr] = useState('');
    const [locationNameAr, setLocationNameAr] = useState('');
    const [locationHintFr, setLocationHintFr] = useState('');
    const [locationHintAr, setLocationHintAr] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [locationOrder, setLocationOrder] = useState('1');
    const [locationRadius, setLocationRadius] = useState('50');
    const [locationRewardType, setLocationRewardType] = useState('points');
    const [locationRewardValue, setLocationRewardValue] = useState('10');
    const [locationStartDate, setLocationStartDate] = useState<Date | undefined>(new Date());
    const [locationEndDate, setLocationEndDate] = useState<Date | undefined>(undefined);
    const [locationDiscoveryOrder, setLocationDiscoveryOrder] = useState<'sequential' | 'any'>('any');
    const [locationSpecialReward, setLocationSpecialReward] = useState<'none' | 'first_finder' | 'top3' | 'top10'>('none');
    const [locationBonusReward1, setLocationBonusReward1] = useState('50');
    const [locationBonusReward2, setLocationBonusReward2] = useState('30');
    const [locationBonusReward3, setLocationBonusReward3] = useState('20');

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    useEffect(() => {
        if (selectedCampaign) {
            fetchLocations(selectedCampaign.id);
        }
    }, [selectedCampaign]);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const data = await treasureHuntService.getAllCampaigns();
            setCampaigns(data);
            if (data.length > 0 && !selectedCampaign) {
                setSelectedCampaign(data[0]);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        }
        setLoading(false);
    };

    const fetchLocations = async (campaignId: string) => {
        try {
            const data = await treasureHuntService.getAllLocations(campaignId);
            setLocations(data);
        } catch (error) {
            console.error('Error fetching locations:', error);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchCampaigns().then(() => setRefreshing(false));
    };

    const handleTrophyPress = () => {
        handleRefresh();
    };

    // Get active/paused campaign
    const activeCampaign = campaigns.find(c => c.status === 'active' || c.status === 'paused');
    // Get history campaigns (completed, cancelled)
    const historyCampaigns = campaigns.filter(c => c.status === 'completed' || c.status === 'cancelled');
    
    // Fetch locations for active campaign
    useEffect(() => {
        const fetchActiveCampaignLocations = async () => {
            if (activeCampaign) {
                try {
                    const data = await treasureHuntService.getAllLocations(activeCampaign.id);
                    setActiveCampaignLocations(data.length);
                } catch (error) {
                    console.error('Error fetching active campaign locations:', error);
                }
            }
        };
        fetchActiveCampaignLocations();
    }, [activeCampaign]);
    
    // Calculate completion rate
    const completionRate = activeCampaign && activeCampaignLocations > 0 
        ? Math.round(((activeCampaign.metrics?.treasuresFound || 0) / activeCampaignLocations) * 100) 
        : 0;

    const resetCampaignForm = () => {
        setCampaignNameFr('');
        setCampaignNameAr('');
        setCampaignDescFr('');
        setCampaignDescAr('');
        setRewardType('points');
        setRewardValue('100');
        setMaxParticipants('1000');
        setIsPublic(false);
        setStartDate(new Date());
        setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        // Default to current time for immediate activation
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        setStartTime(`${hours}:${minutes}`);
        setEndTime('23:59');
        setEditingCampaign(null);
    };

    const handleCreateCampaign = () => {
        resetCampaignForm();
        setShowCampaignModal(true);
    };

    const handleEditCampaign = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setCampaignNameFr(campaign.name.fr || '');
        setCampaignNameAr(campaign.name['ar-tn'] || '');
        setCampaignDescFr(campaign.description?.fr || '');
        setCampaignDescAr(campaign.description?.['ar-tn'] || '');
        setRewardType(campaign.rewardType || 'points');
        setRewardValue(String(campaign.rewardValue || 100));
        setMaxParticipants(String(campaign.maxParticipants || 1000));
        setIsPublic(campaign.isPublic || false);
        
        if (campaign.startDate) {
            const start = campaign.startDate instanceof Timestamp 
                ? campaign.startDate.toDate() 
                : new Date(campaign.startDate as any);
            setStartDate(start);
        }
        if (campaign.endDate) {
            const end = campaign.endDate instanceof Timestamp 
                ? campaign.endDate.toDate() 
                : new Date(campaign.endDate as any);
            setEndDate(end);
        }
        
        setShowCampaignModal(true);
    };

    const handleSaveCampaign = async () => {
        if (!campaignNameFr.trim()) {
            Alert.alert(t('error'), t('treasureHuntEnterName'));
            return;
        }

        setSaving(true);
        try {
            // Combine date and time
            const combineDateTime = (date: Date | undefined, time: string): Date | undefined => {
                if (!date) return undefined;
                const [hours, minutes] = time.split(':').map(Number);
                const combined = new Date(date);
                combined.setHours(hours, minutes, 0, 0);
                return combined;
            };

            const campaignData: Partial<Campaign> = {
                name: { fr: campaignNameFr, 'ar-tn': campaignNameAr },
                description: { fr: campaignDescFr, 'ar-tn': campaignDescAr },
                rewardType,
                rewardValue: parseInt(rewardValue) || 100,
                maxParticipants: parseInt(maxParticipants) || 1000,
                isPublic: true, // Always set to true for new campaigns
                status: 'active', // Set status to active by default
            };

            const startDateTime = combineDateTime(startDate, startTime);
            const endDateTime = combineDateTime(endDate, endTime);

            if (startDateTime) {
                campaignData.startDate = Timestamp.fromDate(startDateTime);
            }
            if (endDateTime) {
                campaignData.endDate = Timestamp.fromDate(endDateTime);
            }

            if (editingCampaign) {
                await treasureHuntService.updateCampaign(editingCampaign.id, campaignData);
                Alert.alert(t('success'), t('treasureHuntCampaignUpdated'));
            } else {
                await treasureHuntService.createCampaign(campaignData);
                Alert.alert(t('success'), t('treasureHuntCampaignCreated'));
            }

            setShowCampaignModal(false);
            resetCampaignForm();
            fetchCampaigns();
        } catch (error) {
            console.error('Error saving campaign:', error);
            Alert.alert(t('error'), t('treasureHuntErrorSaving'));
        }
        setSaving(false);
    };

    const handlePublishCampaign = async (campaign: Campaign) => {
        try {
            const success = await treasureHuntService.publishCampaign(campaign.id);
            if (success) {
                Alert.alert(t('success'), t('treasureHuntCampaignPublished'));
                fetchCampaigns();
            }
        } catch (error) {
            console.error('Error publishing campaign:', error);
            Alert.alert(t('error'), t('treasureHuntErrorPublishing'));
        }
    };

    const handlePauseCampaign = async (campaign: Campaign) => {
        try {
            const success = await treasureHuntService.pauseCampaign(campaign.id);
            if (success) {
                Alert.alert(t('success'), t('treasureHuntCampaignPaused'));
                fetchCampaigns();
            }
        } catch (error) {
            console.error('Error pausing campaign:', error);
            Alert.alert(t('error'), t('treasureHuntErrorPausing'));
        }
    };

    const handleDeleteCampaign = async (campaign: Campaign) => {
        Alert.alert(
            t('confirmDelete'),
            t('treasureHuntDeleteConfirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await treasureHuntService.deleteCampaign(campaign.id);
                            Alert.alert(t('success'), t('treasureHuntCampaignDeleted'));
                            if (selectedCampaign?.id === campaign.id) {
                                setSelectedCampaign(null);
                            }
                            fetchCampaigns();
                        } catch (error) {
                            console.error('Error deleting campaign:', error);
                            Alert.alert(t('error'), t('treasureHuntErrorDeleting'));
                        }
                    },
                },
            ]
        );
    };

    const handleCreateLocation = () => {
        if (!selectedCampaign) {
            Alert.alert(t('error'), t('treasureHuntSelectCampaignFirst'));
            return;
        }
        resetLocationForm();
        setShowLocationModal(true);
    };

    const resetLocationForm = () => {
        setLocationNameFr('');
        setLocationNameAr('');
        setLocationHintFr('');
        setLocationHintAr('');
        setLatitude('');
        setLongitude('');
        setLocationOrder(String(locations.length + 1));
        setLocationRadius('50');
        setLocationRewardType('points');
        setLocationRewardValue('10');
        setLocationStartDate(new Date());
        setLocationEndDate(undefined);
        setLocationDiscoveryOrder('any');
        setLocationSpecialReward('none');
        setLocationBonusReward1('50');
        setLocationBonusReward2('30');
        setLocationBonusReward3('20');
        setShowLocationModal(true);
    };

    const handleEditLocation = (location: TreasureLocation) => {
        setEditingLocation(location);
        setLocationNameFr(location.name.fr || '');
        setLocationNameAr(location.name['ar-tn'] || '');
        setLocationHintFr(location.hint?.fr || '');
        setLocationHintAr(location.hint?.['ar-tn'] || '');
        setLatitude(String(location.coordinates.latitude));
        setLongitude(String(location.coordinates.longitude));
        setLocationOrder(String(location.order || 1));
        setLocationRadius(String(location.radius || 50));
        setLocationRewardType(location.rewardType || 'points');
        setLocationRewardValue(String(location.rewardValue || 10));
        
        if (location.startDate) {
            const start = location.startDate instanceof Timestamp 
                ? location.startDate.toDate() 
                : new Date(location.startDate as any);
            setLocationStartDate(start);
        } else {
            setLocationStartDate(new Date());
        }
        
        if (location.endDate) {
            const end = location.endDate instanceof Timestamp 
                ? location.endDate.toDate() 
                : new Date(location.endDate as any);
            setLocationEndDate(end);
        } else {
            setLocationEndDate(undefined);
        }
        
        setLocationDiscoveryOrder(location.discoveryOrder || 'any');
        setLocationSpecialReward(location.specialReward || 'none');
        setLocationBonusReward1(String(location.bonusRewardValue || 50));
        setLocationBonusReward2(String(location.bonusRewardValue2 || 30));
        setLocationBonusReward3(String(location.bonusRewardValue3 || 20));
        setShowLocationModal(true);
    };

    const handleSaveLocation = async () => {
        if (!locationNameFr.trim() || !latitude || !longitude) {
            Alert.alert(t('error'), t('treasureHuntFillRequired'));
            return;
        }

        setSaving(true);
        try {
            const locationData: Partial<TreasureLocation> = {
                campaignId: selectedCampaign!.id,
                name: { fr: locationNameFr, 'ar-tn': locationNameAr },
                hint: { fr: locationHintFr, 'ar-tn': locationHintAr },
                coordinates: {
                    latitude: parseFloat(latitude) || 0,
                    longitude: parseFloat(longitude) || 0,
                },
                order: parseInt(locationOrder) || 1,
                radius: parseInt(locationRadius) || 50,
                rewardType: locationRewardType,
                rewardValue: parseInt(locationRewardValue) || 10,
                discoveryOrder: locationDiscoveryOrder,
                specialReward: locationSpecialReward,
                bonusRewardValue: parseInt(locationBonusReward1) || 50,
                bonusRewardValue2: parseInt(locationBonusReward2) || 30,
                bonusRewardValue3: parseInt(locationBonusReward3) || 20,
            };

            if (locationStartDate) {
                locationData.startDate = Timestamp.fromDate(locationStartDate);
            }
            if (locationEndDate) {
                locationData.endDate = Timestamp.fromDate(locationEndDate);
            }

            if (editingLocation) {
                await treasureHuntService.updateLocation(editingLocation.id, locationData);
                Alert.alert(t('success'), t('treasureHuntLocationUpdated'));
            } else {
                await treasureHuntService.createLocation(locationData);
                Alert.alert(t('success'), t('treasureHuntLocationCreated'));
            }

            setShowLocationModal(false);
            resetLocationForm();
            fetchLocations(selectedCampaign!.id);
        } catch (error) {
            console.error('Error saving location:', error);
            Alert.alert(t('error'), t('treasureHuntErrorSaving'));
        }
        setSaving(false);
    };

    const handleDeleteLocation = async (location: TreasureLocation) => {
        Alert.alert(
            t('confirmDelete'),
            t('treasureHuntDeleteLocationConfirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await treasureHuntService.deleteLocation(location.id);
                            Alert.alert(t('success'), t('treasureHuntLocationDeleted'));
                            fetchLocations(selectedCampaign!.id);
                        } catch (error) {
                            console.error('Error deleting location:', error);
                            Alert.alert(t('error'), t('treasureHuntErrorDeleting'));
                        }
                    },
                },
            ]
        );
    };

    const showQRCode = (location: TreasureLocation) => {
        setEditingLocation(location);
        setShowQRModal(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return '#34C759';
            case 'paused':
                return '#FF9500';
            case 'draft':
                return '#8E8E93';
            case 'completed':
                return '#5856D6';
            case 'cancelled':
                return '#FF3B30';
            default:
                return '#8E8E93';
        }
    };

    const getStatusLabel = (status: string) => {
        return t(`treasureHuntStatus${status.charAt(0).toUpperCase() + status.slice(1)}`) || status;
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '-';
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    const renderCampaignCard = (campaign: Campaign) => (
        <TouchableOpacity
            key={campaign.id}
            style={[
                styles.campaignCard,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: selectedCampaign?.id === campaign.id ? 2 : 1,
                },
            ]}
            onPress={() => setSelectedCampaign(campaign)}
            onLongPress={() => handleEditCampaign(campaign)}
        >
            <View style={styles.campaignCardHeader}>
                <View style={styles.campaignCardTitleRow}>
                    <Text style={[styles.campaignCardTitle, { color: colors.foreground }]}>
                        {campaign.name.fr || campaign.name['ar-tn'] || t('untitled')}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) }]}>
                        <Text style={styles.statusBadgeText}>{getStatusLabel(campaign.status)}</Text>
                    </View>
                </View>
            </View>
            
            <View style={styles.campaignCardStats}>
                <View style={styles.statItem}>
                    <Calendar size={14} color={colors.textMuted} />
                    <Text style={[styles.statText, { color: colors.textMuted }]}>
                        {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Users size={14} color={colors.textMuted} />
                    <Text style={[styles.statText, { color: colors.textMuted }]}>
                        {campaign.currentParticipants || 0} / {campaign.maxParticipants}
                    </Text>
                </View>
            </View>

            <View style={styles.campaignCardRewards}>
                <Gift size={14} color={colors.primary} />
                <Text style={[styles.rewardText, { color: colors.primary }]}>
                    {campaign.rewardType === 'points'
                        ? `${campaign.rewardValue} ${tr('treasureHuntPoints', 'Points')}`
                        : campaign.rewardType === 'discount'
                        ? `${campaign.rewardValue}% ${tr('treasureHuntDiscount', 'Discount')}`
                        : campaign.rewardType === 'free_product'
                        ? tr('treasureHuntFreeProduct', 'Free Product')
                        : campaign.rewardType === 'coupon'
                        ? tr('treasureHuntCoupon', 'Coupon')
                        : tr('treasureHuntSpecialReward', 'Special Reward')
                    }
                </Text>
            </View>

            {selectedCampaign?.id === campaign.id && (
                <View style={styles.campaignActions}>
                    {campaign.status === 'draft' || campaign.status === 'paused' ? (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#34C759' }]}
                            onPress={() => handlePublishCampaign(campaign)}
                        >
                            <Play size={16} color="#FFF" />
                            <Text style={styles.actionButtonText}>{t('treasureHuntPublish')}</Text>
                        </TouchableOpacity>
                    ) : null}
                    {campaign.status === 'active' ? (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#FF9500' }]}
                            onPress={() => handlePauseCampaign(campaign)}
                        >
                            <Pause size={16} color="#FFF" />
                            <Text style={styles.actionButtonText}>{t('treasureHuntPause')}</Text>
                        </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleEditCampaign(campaign)}
                    >
                        <Pencil size={16} color="#FFF" />
                        <Text style={styles.actionButtonText}>{t('edit')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
                        onPress={() => handleDeleteCampaign(campaign)}
                    >
                        <Trash2 size={16} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderLocationCard = (location: TreasureLocation) => (
        <View
            key={location.id}
            style={[
                styles.locationCard,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
            ]}
        >
            <View style={styles.locationCardHeader}>
                <View style={styles.locationOrderBadge}>
                    <Text style={styles.locationOrderText}>{location.order}</Text>
                </View>
                <View style={styles.locationCardTitleRow}>
                    <Text style={[styles.locationCardTitle, { color: colors.foreground }]}>
                        {location.name.fr || location.name['ar-tn'] || t('untitled')}
                    </Text>
                    <View style={[styles.locationStatusBadge, { backgroundColor: location.isActive ? '#34C759' : '#8E8E93' }]}>
                        <Text style={styles.locationStatusText}>
                            {location.isActive ? t('active') : t('inactive')}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.locationCardCoords}>
                <MapPin size={14} color={colors.textMuted} />
                            <Text style={[styles.cardCoordText, { color: colors.textMuted }]}>
                    {location.coordinates.latitude.toFixed(6)}, {location.coordinates.longitude.toFixed(6)}
                </Text>
            </View>

            {location.hint?.fr && (
                <Text style={[styles.hintText, { color: colors.textMuted }]} numberOfLines={2}>
                    💡 {location.hint.fr}
                </Text>
            )}

            <View style={styles.locationCardRewards}>
                <Gift size={14} color={colors.primary} />
                <Text style={[styles.rewardText, { color: colors.primary }]}>
                    {location.rewardType === 'points'
                        ? `${location.rewardValue} ${t('treasureHuntPoints')}`
                        : location.rewardType === 'discount'
                        ? `${location.rewardValue}% ${t('treasureHuntDiscount')}`
                        : t('treasureHuntSpecialReward')
                    }
                </Text>
            </View>

            <View style={styles.locationActions}>
                <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: colors.primary }]}
                    onPress={() => showQRCode(location)}
                >
                    <QrCode size={16} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: '#007AFF' }]}
                    onPress={() => handleEditLocation(location)}
                >
                    <Pencil size={16} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: '#FF3B30' }]}
                    onPress={() => handleDeleteLocation(location)}
                >
                    <Trash2 size={16} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <AdminHeader 
                title={t('treasureHuntManagement')} 
                onBack={onBack}
                rightElement={
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={handleCreateCampaign}
                            style={[styles.trophyButton, { backgroundColor: '#34C759', marginRight: 8 }]}
                        >
                            <Plus size={20} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleTrophyPress}
                            style={[styles.trophyButton, { backgroundColor: colors.primary }]}
                            disabled={refreshing}
                        >
                            {refreshing ? (
                                <ActivityIndicator size={18} color="#FFF" />
                            ) : (
                                <Trophy size={20} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Active Campaign Info Section */}
            {activeCampaign && (
                <View style={[styles.activeCampaignInfo, { backgroundColor: colors.card, borderColor: colors.border, margin: 16, marginTop: 24}]}>
                    <View style={styles.activeCampaignHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Trophy size={18} color={colors.primary} style={{ marginRight: 8 }} />
                            <Text style={[styles.activeCampaignTitle, { color: colors.foreground }]}>
                                {t('treasureHuntActiveCampaign') || 'Active Campaign'}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activeCampaign.status) }]}>
                            <Text style={styles.statusBadgeText}>{getStatusLabel(activeCampaign.status)}</Text>
                        </View>
                    </View>
                    
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>
                        {activeCampaign.name.fr || activeCampaign.name['ar-tn']}
                    </Text>
                    
                    <View style={styles.activeCampaignStats}>
                        <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                            <Calendar size={16} color={colors.primary} style={styles.statBoxIcon} />
                            <Text style={[styles.statBoxValue, { color: colors.foreground }]}>
                                {formatDate(activeCampaign.startDate)}
                            </Text>
                            <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>
                                {t('treasureHuntStartDate') || 'Start'}
                            </Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                            <Calendar size={16} color={colors.primary} style={styles.statBoxIcon} />
                            <Text style={[styles.statBoxValue, { color: colors.foreground }]}>
                                {formatDate(activeCampaign.endDate)}
                            </Text>
                            <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>
                                {t('treasureHuntEndDate') || 'End'}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.activeCampaignStats}>
                        <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                            <Users size={16} color={colors.primary} style={styles.statBoxIcon} />
                            <Text style={[styles.statBoxValue, { color: colors.foreground }]}>
                                {activeCampaign.currentParticipants || 0}
                            </Text>
                            <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>
                                {t('treasureHuntParticipants') || 'Participants'}
                            </Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                            <Target size={16} color={colors.primary} style={styles.statBoxIcon} />
                            <Text style={[styles.statBoxValue, { color: colors.foreground }]}>
                                {completionRate}%
                            </Text>
                            <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>
                                {t('treasureHuntCompletionRate') || 'Completion'}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.activeCampaignStats}>
                        <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                            <MapPin size={16} color={colors.primary} style={styles.statBoxIcon} />
                            <Text style={[styles.statBoxValue, { color: colors.foreground }]}>
                                {activeCampaignLocations}
                            </Text>
                            <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>
                                {t('treasureHuntLocations') || 'Locations'}
                            </Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                            <Award size={16} color={colors.primary} style={styles.statBoxIcon} />
                            <Text style={[styles.statBoxValue, { color: colors.foreground }]}>
                                {activeCampaign.metrics?.treasuresFound || 0}
                            </Text>
                            <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>
                                {t('treasureHuntDiscoveries') || 'Discoveries'}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* History Section */}
            {historyCampaigns.length > 0 && (
                <View style={[styles.historySection, { backgroundColor: colors.card, borderColor: colors.border , marginTop:20 }]}>
                    <TouchableOpacity 
                        style={styles.historySectionHeader}
                        onPress={() => setShowHistory(!showHistory)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Clock size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                            <Text style={[styles.historySectionTitle, { color: colors.foreground }]}>
                                {t('treasureHuntHistory') || 'Campaign History'}
                            </Text>
                            <Text style={{ color: colors.textMuted, marginLeft: 8 }}>
                                ({historyCampaigns.length})
                            </Text>
                        </View>
                        <Text style={{ color: colors.primary }}>
                            {showHistory ? '▲' : '▼'}
                        </Text>
                    </TouchableOpacity>
                    
                    {showHistory && historyCampaigns.map((campaign) => (
                        <View key={campaign.id} style={[styles.historyCard, { backgroundColor: colors.background }]}>
                            <View style={styles.historyCardInfo}>
                                <Text style={[styles.historyCardTitle, { color: colors.foreground }]}>
                                    {campaign.name.fr || campaign.name['ar-tn']}
                                </Text>
                                <Text style={[styles.historyCardDates, { color: colors.textMuted }]}>
                                    {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                                </Text>
                            </View>
                            <View style={styles.historyCardStats}>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) }]}>
                                    <Text style={styles.statusBadgeText}>{getStatusLabel(campaign.status)}</Text>
                                </View>
                                <Text style={[styles.historyCardStat, { color: colors.textMuted }]}>
                                    {campaign.metrics?.treasuresFound || 0} {t('treasureHuntFound') || 'found'}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* Campaign Selector */}
            <View style={[styles.campaignSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                        {t('treasureHuntCampaigns') || 'Campaigns'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: '#34C759' }]}
                        onPress={handleCreateCampaign}
                    >
                        <Plus size={16} color="#FFF" />
                        <Text style={styles.createButtonText}>
                            {t('create')}
                        </Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[
                            styles.campaignSelectorItem,
                            { backgroundColor: !selectedCampaign ? colors.primary : colors.background },
                        ]}
                        onPress={handleCreateCampaign}
                    >
                        <Plus size={16} color="#FFF" />
                        <Text style={[styles.campaignSelectorText, { color: '#FFF' }]}>
                            {t('create')}
                        </Text>
                    </TouchableOpacity>
                    {campaigns.map((campaign) => (
                        <TouchableOpacity
                            key={campaign.id}
                            style={[
                                styles.campaignSelectorItem,
                                {
                                    backgroundColor: selectedCampaign?.id === campaign.id
                                        ? colors.primary
                                        : colors.background,
                                },
                            ]}
                            onPress={() => setSelectedCampaign(campaign)}
                        >
                            <Text
                                style={[
                                    styles.campaignSelectorText,
                                    { color: selectedCampaign?.id === campaign.id ? '#FFF' : colors.foreground },
                                ]}
                                numberOfLines={1}
                            >
                                {campaign.name.fr || campaign.name['ar-tn'] || t('untitled')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Tabs */}
            <View style={[styles.tabs, { borderBottomColor: colors.border , marginTop:20 }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'campaigns' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('campaigns')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'campaigns' ? colors.primary : colors.textMuted }]}>
                        {t('treasureHuntCampaigns')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'locations' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('locations')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'locations' ? colors.primary : colors.textMuted }]}>
                        {t('treasureHuntLocations')} ({locations.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView style={[styles.content, { marginTop: 20 }]} showsVerticalScrollIndicator={false}>
                    {activeTab === 'campaigns' ? (
                        <View style={styles.campaignsList}>
                            {campaigns.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Gift size={48} color={colors.textMuted} />
                                    <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                                        {t('treasureHuntNoCampaigns')}
                                    </Text>
                                    <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                                        {t('treasureHuntCreateFirst')}
                                    </Text>
                                </View>
                            ) : (
                                campaigns.map(renderCampaignCard)
                            )}
                        </View>
                    ) : selectedCampaign ? (
                        <View style={styles.locationsList}>
                            <TouchableOpacity
                                style={[styles.addLocationButton, { backgroundColor: colors.primary }]}
                                onPress={handleCreateLocation}
                            >
                                <Plus size={20} color="#FFF" />
                                <Text style={styles.addLocationButtonText}>
                                    {t('treasureHuntAddLocation')}
                                </Text>
                            </TouchableOpacity>

                            {locations.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <MapPin size={48} color={colors.textMuted} />
                                    <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                                        {t('treasureHuntNoLocations')}
                                    </Text>
                                    <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                                        {t('treasureHuntAddFirstLocation')}
                                    </Text>
                                </View>
                            ) : (
                                locations.map(renderLocationCard)
                            )}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Gift size={48} color={colors.textMuted} />
                            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                                {t('treasureHuntSelectCampaign')}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Campaign Modal */}
            <Modal visible={showCampaignModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                                {editingCampaign ? t('treasureHuntEditCampaign') : t('treasureHuntNewCampaign')}
                            </Text>
                            <TouchableOpacity onPress={() => setShowCampaignModal(false)}>
                                <X size={24} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.formGroup}>
                                <InputLabel text={`${t('name')} (FR) *`} />
                                <AdminInput
                                    value={campaignNameFr}
                                    onChangeText={setCampaignNameFr}
                                    placeholder={t('treasureHuntNameFrPlaceholder')}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <InputLabel text={`${t('name')} (AR)`} />
                                <AdminInput
                                    value={campaignNameAr}
                                    onChangeText={setCampaignNameAr}
                                    placeholder={t('treasureHuntNameArPlaceholder')}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <InputLabel text={`${t('description')} (FR)`} />
                                <AdminInput
                                    value={campaignDescFr}
                                    onChangeText={setCampaignDescFr}
                                    placeholder={t('treasureHuntDescFrPlaceholder')}
                                    multiline
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <InputLabel text={`${t('description')} (AR)`} />
                                <AdminInput
                                    value={campaignDescAr}
                                    onChangeText={setCampaignDescAr}
                                    placeholder={t('treasureHuntDescArPlaceholder')}
                                    multiline
                                />
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                    <InputLabel text={t('treasureHuntStartDate')} />
                                    <DatePicker
                                        value={startDate}
                                        onChange={setStartDate}
                                        placeholder={t('selectDate')}
                                    />
                                    <AdminInput
                                        value={startTime}
                                        onChangeText={setStartTime}
                                        placeholder="00:00"
                                        style={{ marginTop: 4 }}
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                    <InputLabel text={t('treasureHuntEndDate')} />
                                    <DatePicker
                                        value={endDate}
                                        onChange={setEndDate}
                                        placeholder={t('selectDate')}
                                    />
                                    <AdminInput
                                        value={endTime}
                                        onChangeText={setEndTime}
                                        placeholder="23:59"
                                        style={{ marginTop: 4 }}
                                    />
                                </View>
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                    <InputLabel text={t('treasureHuntRewardType')} />
                                    <Picker
                                        value={rewardType}
                                        onValueChange={(value) => setRewardType(value)}
                                        options={[
                                            { label: tr('treasureHuntPoints', 'Points'), value: 'points' },
                                            { label: tr('treasureHuntDiscount', 'Discount %'), value: 'discount' },
                                            { label: tr('treasureHuntFreeProduct', 'Free Product'), value: 'free_product' },
                                            { label: tr('treasureHuntCoupon', 'Coupon Code'), value: 'coupon' },
                                        ]}
                                        
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                    <InputLabel text={t('treasureHuntRewardValue')} />
                                    <AdminInput
                                        value={rewardValue}
                                        onChangeText={setRewardValue}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <InputLabel text={t('treasureHuntMaxParticipants')} />
                                <AdminInput
                                    value={maxParticipants}
                                    onChangeText={setMaxParticipants}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.switchRow}>
                                <Text style={[styles.switchLabel, { color: colors.foreground }]}>
                                    {t('treasureHuntPublic')}
                                </Text>
                                <ModernSwitch
                                    active={isPublic}
                                    onPress={() => setIsPublic(!isPublic)}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                                onPress={handleSaveCampaign}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <Check size={20} color="#FFF" />
                                        <Text style={styles.saveButtonText}>
                                            {editingCampaign ? t('update') : t('create')}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Location Modal */}
            <Modal visible={showLocationModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                                {editingLocation ? t('treasureHuntEditLocation') : t('treasureHuntNewLocation')}
                            </Text>
                            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                                <X size={24} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.formGroup}>
                                <InputLabel text={`${t('name')} (FR) *`} />
                                <AdminInput
                                    value={locationNameFr}
                                    onChangeText={setLocationNameFr}
                                    placeholder={t('treasureHuntLocationNameFrPlaceholder')}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <InputLabel text={`${t('name')} (AR)`} />
                                <AdminInput
                                    value={locationNameAr}
                                    onChangeText={setLocationNameAr}
                                    placeholder={t('treasureHuntLocationNameArPlaceholder')}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <InputLabel text={`${t('treasureHuntHint')} (FR)`} />
                                <AdminInput
                                    value={locationHintFr}
                                    onChangeText={setLocationHintFr}
                                    placeholder={t('treasureHuntHintFrPlaceholder')}
                                    multiline
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <InputLabel text={`${t('treasureHuntHint')} (AR)`} />
                                <AdminInput
                                    value={locationHintAr}
                                    onChangeText={setLocationHintAr}
                                    placeholder={t('treasureHuntHintArPlaceholder')}
                                    multiline
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <InputLabel text={tr('treasureHuntCoordinates', 'Coordinates') + ' *'} />
                                <View style={styles.locationInputRow}>
                                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                        <InputLabel text={tr('treasureHuntLatitude', 'Latitude')} />
                                        <AdminInput
                                            value={latitude}
                                            onChangeText={setLatitude}
                                            placeholder="36.8065"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                        <InputLabel text={tr('treasureHuntLongitude', 'Longitude')} />
                                        <AdminInput
                                            value={longitude}
                                            onChangeText={setLongitude}
                                            placeholder="10.1815"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    style={[styles.mapSelectButton, { backgroundColor: colors.primary }]}
                                    onPress={() => setShowMapPicker(true)}
                                >
                                    <MapPin size={18} color="#FFF" />
                                    <Text style={styles.mapSelectButtonText}>
                                        {tr('treasureHuntSelectOnMap', 'Select on Map')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                    <InputLabel text={t('treasureHuntOrder')} />
                                    <AdminInput
                                        value={locationOrder}
                                        onChangeText={setLocationOrder}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                    <InputLabel text={`${t('treasureHuntRadius')} (m)`} />
                                    <AdminInput
                                        value={locationRadius}
                                        onChangeText={setLocationRadius}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                    <InputLabel text={t('treasureHuntRewardType')} />
                                    <View style={styles.rewardTypeSelector}>
                                        <TouchableOpacity
                                            style={[
                                                styles.rewardTypeOption,
                                                { backgroundColor: locationRewardType === 'points' ? colors.primary : colors.card, borderColor: colors.border },
                                            ]}
                                            onPress={() => setLocationRewardType('points')}
                                        >
                                            <Text style={{ color: locationRewardType === 'points' ? '#FFF' : colors.foreground }}>
                                                {t('treasureHuntPoints')}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.rewardTypeOption,
                                                { backgroundColor: locationRewardType === 'discount' ? colors.primary : colors.card, borderColor: colors.border },
                                            ]}
                                            onPress={() => setLocationRewardType('discount')}
                                        >
                                            <Text style={{ color: locationRewardType === 'discount' ? '#FFF' : colors.foreground }}>
                                                {t('treasureHuntDiscount')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                    <InputLabel text={t('treasureHuntRewardValue')} />
                                    <AdminInput
                                        value={locationRewardValue}
                                        onChangeText={setLocationRewardValue}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <InputLabel text={t('treasureHuntStartDate') || 'Start Date'} />
                                <DatePicker
                                    value={locationStartDate}
                                    onChange={setLocationStartDate}
                                    mode="date"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <InputLabel text={t('treasureHuntEndDate') || 'End Date (Optional)'} />
                                <DatePicker
                                    value={locationEndDate}
                                    onChange={setLocationEndDate}
                                    mode="date"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <InputLabel text={t('treasureHuntDiscoveryOrder') || 'Discovery Order'} />
                                <Picker
                                    value={locationDiscoveryOrder}
                                    onValueChange={(value) => setLocationDiscoveryOrder(value as 'sequential' | 'any')}
                                    options={[
                                        { label: t('treasureHuntDiscoveryAny') || 'Any Order', value: 'any' },
                                        { label: t('treasureHuntDiscoverySequential') || 'Sequential', value: 'sequential' },
                                    ]}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <InputLabel text={t('treasureHuntSpecialReward') || 'Special Reward for Winners'} />
                                <Picker
                                    value={locationSpecialReward}
                                    onValueChange={(value) => setLocationSpecialReward(value as 'none' | 'first_finder' | 'top3' | 'top10')}
                                    options={[
                                        { label: t('treasureHuntSpecialNone') || 'None', value: 'none' },
                                        { label: t('treasureHuntSpecialFirst') || 'First Finder Only', value: 'first_finder' },
                                        { label: t('treasureHuntSpecialTop3') || 'Top 3 Finders', value: 'top3' },
                                        { label: t('treasureHuntSpecialTop10') || 'Top 10 Finders', value: 'top10' },
                                    ]}
                                />
                            </View>

                            {locationSpecialReward !== 'none' && (
                                <View style={[styles.formGroup, { backgroundColor: colors.card, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border }]}>
                                    <Text style={{ color: colors.primary, fontWeight: '600', marginBottom: 12 }}>
                                        {t('treasureHuntBonusRewards') || 'Bonus Rewards for Top Finders'}
                                    </Text>
                                    
                                    {locationSpecialReward === 'first_finder' && (
                                        <View style={styles.formGroup}>
                                            <InputLabel text={t('treasureHuntFirstPlace') || '1st Place Bonus'} />
                                            <AdminInput
                                                value={locationBonusReward1}
                                                onChangeText={setLocationBonusReward1}
                                                keyboardType="numeric"
                                                placeholder="50"
                                            />
                                        </View>
                                    )}
                                    
                                    {locationSpecialReward === 'top3' && (
                                        <>
                                            <View style={styles.formGroup}>
                                                <InputLabel text={t('treasureHuntFirstPlace') || '1st Place'} />
                                                <AdminInput
                                                    value={locationBonusReward1}
                                                    onChangeText={setLocationBonusReward1}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                            <View style={styles.formGroup}>
                                                <InputLabel text={t('treasureHuntSecondPlace') || '2nd Place'} />
                                                <AdminInput
                                                    value={locationBonusReward2}
                                                    onChangeText={setLocationBonusReward2}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                            <View style={styles.formGroup}>
                                                <InputLabel text={t('treasureHuntThirdPlace') || '3rd Place'} />
                                                <AdminInput
                                                    value={locationBonusReward3}
                                                    onChangeText={setLocationBonusReward3}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        </>
                                    )}
                                    
                                    {locationSpecialReward === 'top10' && (
                                        <View style={styles.formGroup}>
                                            <InputLabel text={t('treasureHuntTop10Bonus') || 'Bonus for Each Top 10 Finder'} />
                                            <AdminInput
                                                value={locationBonusReward1}
                                                onChangeText={setLocationBonusReward1}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    )}
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                                onPress={handleSaveLocation}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <Check size={20} color="#FFF" />
                                        <Text style={styles.saveButtonText}>
                                            {editingLocation ? t('update') : t('create')}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* QR Code Modal */}
            <Modal visible={showQRModal} animationType="fade" transparent>
                <View style={styles.qrModalOverlay}>
                    <View style={[styles.qrModalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.qrModalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                                {t('treasureHuntQRCode')}
                            </Text>
                            <TouchableOpacity onPress={() => setShowQRModal(false)}>
                                <X size={24} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.qrCodeContainer}>
                            <View style={[styles.qrCodePlaceholder, { backgroundColor: colors.background }]}>
                                <QrCode size={100} color={colors.primary} />
                            </View>
                            <Text style={[styles.qrCodeLabel, { color: colors.textMuted }]}>
                                {editingLocation?.qrCode}
                            </Text>
                            <Text style={[styles.qrCodeHint, { color: colors.textMuted }]}>
                                {t('treasureHuntScanToDiscover')}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowQRModal(false)}
                        >
                            <Text style={styles.closeButtonText}>{t('close')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Map Picker Modal */}
            <Modal visible={showMapPicker} animationType="slide" transparent>
                <View style={styles.mapPickerOverlay}>
                    <View style={[styles.mapPickerContent, { backgroundColor: colors.background }]}>
                        <View style={styles.mapPickerHeader}>
                            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                                {t('treasureHuntSelectLocation') || 'Select Location on Map'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowMapPicker(false)}>
                                <X size={24} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.mapPickerInstructions}>
                            <Text style={[styles.mapPickerText, { color: colors.textMuted }]}>
                                {t('treasureHuntTapToSelect') || 'Tap on the map to select a location'}
                            </Text>
                        </View>

                        <View style={styles.mapPickerCoords}>
                            <Text style={[styles.pickerCoordText, { color: colors.foreground }]}>
                                Lat: {latitude || '36.8065'}
                            </Text>
                            <Text style={[styles.pickerCoordText, { color: colors.foreground }]}>
                                Lng: {longitude || '10.1815'}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.confirmLocationButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowMapPicker(false)}
                        >
                            <Check size={20} color="#FFF" />
                            <Text style={styles.confirmLocationText}>
                                {t('confirm') || 'Confirm'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    campaignSelector: {
        padding: 16,
        borderBottomWidth: 1,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    campaignSelectorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    campaignSelectorText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '500',
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    campaignsList: {
        padding: 16,
    },
    campaignCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    campaignCardHeader: {
        marginBottom: 12,
    },
    campaignCardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    campaignCardTitle: {
        fontSize: 17,
        fontWeight: '700',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusBadgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    campaignCardStats: {
        marginBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    statText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#666',
    },
    campaignCardRewards: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        padding: 10,
        borderRadius: 10,
    },
    rewardText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    campaignActions: {
        flexDirection: 'row',
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        marginRight: 10,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    locationsList: {
        padding: 16,
    },
    addLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 14,
        marginBottom: 20,
        backgroundColor: '#5856D6',
        shadowColor: '#5856D6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addLocationButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    locationCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 14,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    locationCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationOrderBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#5856D6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    locationOrderText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    locationCardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
    },
    locationCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    locationStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
    },
    locationStatusText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
    },
    locationCardCoords: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#F5F5F5',
        padding: 8,
        borderRadius: 8,
    },
    cardCoordText: {
        marginLeft: 8,
        fontSize: 12,
        color: '#666',
    },
    hintText: {
        fontSize: 13,
        marginBottom: 10,
        fontStyle: 'italic',
        color: '#888',
    },
    locationCardRewards: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        backgroundColor: '#F5F5F5',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 20,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 10,
        textAlign: 'center',
        color: '#888',
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        maxHeight: '90%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    formGroup: {
        marginBottom: 20,
    },
    formRow: {
        flexDirection: 'row',
    },
    rewardTypeSelector: {
        flexDirection: 'row',
        marginTop: 4,
    },
    rewardTypeOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        marginHorizontal: 2,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 16,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 14,
        marginTop: 12,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
        marginLeft: 8,
    },
    qrModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    qrModalContent: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    qrModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
    },
    qrCodeContainer: {
        alignItems: 'center',
        marginVertical: 24,
    },
    qrCodePlaceholder: {
        width: 200,
        height: 200,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    qrCodeLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
    },
    qrCodeHint: {
        fontSize: 12,
        textAlign: 'center',
    },
    closeButton: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    closeButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // New styles for UI enhancements
    trophyButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeCampaignInfo: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
        marginTop:20
    },
    activeCampaignHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    activeCampaignTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    activeCampaignStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    statBoxIcon: {
        marginBottom: 4,
    },
    statBoxValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    statBoxLabel: {
        fontSize: 10,
        marginTop: 2,
    },
    historySection: {
        margin: 16,
        marginTop: 0,
    },
    historySectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    historySectionTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    historyCard: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyCardInfo: {
        flex: 1,
    },
    historyCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    historyCardDates: {
        fontSize: 12,
    },
    historyCardStats: {
        alignItems: 'flex-end',
    },
    historyCardStat: {
        fontSize: 12,
        marginBottom: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    locationInputRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    mapSelectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 4,
    },
    mapSelectButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    mapPickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    mapPickerContent: {
        height: '40%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    mapPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    mapPickerInstructions: {
        marginBottom: 16,
    },
    mapPickerText: {
        fontSize: 14,
        textAlign: 'center',
    },
    mapPickerCoords: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        paddingVertical: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
    },
    pickerCoordText: {
        fontSize: 14,
        fontWeight: '600',
    },
    confirmLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
    },
    confirmLocationText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
});
