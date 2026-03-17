import React, { useState, useEffect, useRef } from "react";
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
  Share,
} from "react-native";
import * as Print from "expo-print";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  Printer,
  Bomb,
  ShieldAlert,
  Key,
} from "lucide-react-native";
import {
  Timestamp,
  deleteDoc,
  doc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { APP_ICON, LOGO } from "@/src/constants/layout";
import { db } from "../../api/firebase";
import { useAppTheme } from "../../context/ThemeContext";
import {
  AdminCard,
  InputLabel,
  SectionLabel,
  ModernSwitch,
  AdminInput,
  AdminHeader,
  StatCard,
  AdminTabNav,
  AdminButton,
  ModalHeader,
} from "../../components/admin/AdminUI";
import { DatePicker } from "../../components/ui/date-picker";
import { Picker } from "../../components/ui/picker";
// Remove unused Button import if not needed
import {
  treasureHuntService,
  Campaign,
  TreasureLocation,
  Bomb as BombType,
  TreasureKey,
} from "../../services/TreasureHuntService";

const { width } = Dimensions.get("window");

interface AdminTreasureHuntScreenProps {
  onBack: () => void;
  t: any;
  theme?: any;
}

type TabType = "campaigns" | "locations";

export default function AdminTreasureHuntScreen({
  onBack,
  t,
  theme,
}: AdminTreasureHuntScreenProps) {
  const { colors, theme: appTheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isDark = appTheme === "dark";
  const scrollY = useRef(new Animated.Value(0)).current;

  // Translation helper with fallback values for missing keys
  const tr = (key: string, fallback: string = key) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [locations, setLocations] = useState<TreasureLocation[]>([]);
  const [products, setProducts] = useState<
    { id: string; name: any; price: number; image?: string }[]
  >([]);
  const [activeTab, setActiveTab] = useState<TabType>("campaigns");
  const [showHistory, setShowHistory] = useState(false);
  const [activeCampaignLocations, setActiveCampaignLocations] = useState(0);

  // Modal states
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  // Don't use separate map picker - integrate into location modal
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [locationModalView, setLocationModalView] = useState<"form" | "map">(
    "form",
  );
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingLocation, setEditingLocation] =
    useState<TreasureLocation | null>(null);
  const [showBombModal, setShowBombModal] = useState(false);
  const [locationForBombs, setLocationForBombs] =
    useState<TreasureLocation | null>(null);
  const [bombsForLocation, setBombsForLocation] = useState<BombType[]>([]);
  const [isAddingBomb, setIsAddingBomb] = useState(false);
  
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [locationForKeys, setLocationForKeys] = useState<TreasureLocation | null>(null);
  const [keysForCampaign, setKeysForCampaign] = useState<TreasureKey[]>([]);
  const [isAddingKey, setIsAddingKey] = useState(false);

  // Form states
  const [campaignNameFr, setCampaignNameFr] = useState("");
  const [campaignNameAr, setCampaignNameAr] = useState("");
  const [campaignDescFr, setCampaignDescFr] = useState("");
  const [campaignDescAr, setCampaignDescAr] = useState("");
  const [rewardType, setRewardType] = useState<string>("points");
  const [rewardValue, setRewardValue] = useState("100");
  const [maxParticipants, setMaxParticipants] = useState("1000");
  const [isPublic, setIsPublic] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  );

  // Time state for campaigns
  const [startTime, setStartTime] = useState<string>("00:00");
  const [endTime, setEndTime] = useState<string>("23:59");

  // Location form states
  const [locationNameFr, setLocationNameFr] = useState("");
  const [locationNameAr, setLocationNameAr] = useState("");
  const [locationHintFr, setLocationHintFr] = useState("");
  const [locationHintAr, setLocationHintAr] = useState("");
  const [locationNoteFr, setLocationNoteFr] = useState("");
  const [locationNoteAr, setLocationNoteAr] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const mapRef = useRef<MapView>(null);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 36.8065,
    longitude: 10.1815,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Handle map press to set location
  const handleMapPress = (event: any) => {
    try {
      // Handle both standard React Native Maps and expo-maps events
      let coordinate = null;

      if (event.nativeEvent?.coordinate) {
        // Standard react-native-maps format
        coordinate = event.nativeEvent.coordinate;
      } else if (event.nativeEvent?.location?.latLng) {
        // Expo maps format
        coordinate = {
          latitude: event.nativeEvent.location.latLng.latitude,
          longitude: event.nativeEvent.location.latLng.longitude,
        };
      } else if (event.coordinate) {
        // Alternative format
        coordinate = event.coordinate;
      }

      if (coordinate && coordinate.latitude && coordinate.longitude) {
        const lat = coordinate.latitude.toFixed(6);
        const lng = coordinate.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setMapPickerCoords({
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        });
      }
    } catch (error) {
      console.error("Error selecting location:", error);
    }
  };

  // Open map picker with correct initial coordinates
  const openMapPicker = () => {
    // Set initial coordinates from existing values or default to Tunis
    const initialLat = latitude ? parseFloat(latitude) : 36.8065;
    const initialLng = longitude ? parseFloat(longitude) : 10.1815;

    setMapRegion({
      latitude: initialLat,
      longitude: initialLng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    // Set the map picker coordinates if we have existing coordinates
    if (latitude && longitude) {
      setMapPickerCoords({ latitude: initialLat, longitude: initialLng });
    } else {
      setMapPickerCoords(null);
    }

    setShowMapPicker(true);
  };

  // Handle confirm location from map picker
  const handleConfirmLocation = () => {
    // Update form state with map picker coordinates if selected
    if (mapPickerCoords) {
      setLatitude(mapPickerCoords.latitude.toFixed(6));
      setLongitude(mapPickerCoords.longitude.toFixed(6));
    }
    setShowMapPicker(false);
  };

  // Handle print QR code
  const handlePrintQRCode = async () => {
    if (!editingLocation) return;

    const qrCode = editingLocation.qrCode || "";
    const locationName =
      typeof editingLocation.name === "object"
        ? editingLocation.name.fr || editingLocation.name["ar-tn"] || ""
        : editingLocation.name || "";
    const campaignName = selectedCampaign
      ? typeof selectedCampaign.name === "object"
        ? selectedCampaign.name.fr || selectedCampaign.name["ar-tn"] || ""
        : selectedCampaign.name
      : "";

    // Multi-language instructions
    const instructions = {
      en: "📱 Scan this QR code to discover this treasure location!",
      fr: "📱 Scannez ce code QR pour découvrir ce lieu au trésor !",
      ar: "📱 ! امسح رمز  QR هذا لاكتشاف موقع الكنز هذا",
      darija: "📱 ! سكان هاد الريال QR باش تكتشف هاد المكان",
    };

    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Treasure Hunt QR Code</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        padding: 20px;
                        text-align: center;
                        background: #ffffff;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }
                    .logo {
                        width: 80px;
                        height: 80px;
                        margin-bottom: 15px;
                        object-fit: contain;
                    }
                    .app-name {
                        font-size: 16px;
                        color: #333333;
                        margin-bottom: 20px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                    }
                    .container {
                        max-width: 450px;
                        width: 100%;
                        margin: 0 auto;
                        padding: 30px;
                        border: 4px solid #1a1a1a;
                        border-radius: 24px;
                        background: #fafafa;
                    }
                    .qr-code {
                        width: 320px;
                        height: 320px;
                        margin: 20px auto;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #fff;
                        padding: 10px;
                        border-radius: 12px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .qr-code img {
                        width: 100%;
                        height: 100%;
                    }
                    .location-name {
                        font-size: 32px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: #1a1a1a;
                        line-height: 1.2;
                    }
                    .campaign-name {
                        font-size: 20px;
                        color: #666666;
                        margin-bottom: 20px;
                        font-weight: 500;
                    }
                    .instructions {
                        font-size: 15px;
                        color: #333333;
                        margin-top: 25px;
                        padding-top: 20px;
                        border-top: 2px dashed #cccccc;
                        line-height: 1.8;
                    }
                    .footer {
                        margin-top: 30px;
                        font-size: 14px;
                        color: #999999;
                        font-weight: 500;
                    }
                    @media print {
                        body {
                            padding: 10px;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .container {
                            border-width: 3px;
                            box-shadow: none;
                        }
                    }
                </style>
            </head>
            <body>
                <img class="logo" src=${LOGO} alt="Bey3a Logo" onerror="this.style.display='none'" />
                <div class="app-name">Bey3a</div>
                <div class="container">
                    <div class="location-name">${locationName}</div>
                    <div class="campaign-name">${campaignName}</div>
                    <div class="qr-code">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}" alt="QR Code" />
                    </div>
                    <div class="instructions">
                        ${instructions.en}<br/>
                        ${instructions.fr}<br/>
                        ${instructions.ar}<br/>
                    </div>
                    <div class="footer">
                        🏆🏴 Bey3a Treasure Hunt
                    </div>
                </div>
            </body>
            </html>
        `;

    try {
      await Print.printAsync({
        html,
      });
    } catch (error) {
      console.error("Print error:", error);
      // Try alternative approach - share as message
      try {
        await Share.share({
          message: `🏆 Treasure Hunt - ${locationName}\n\n📍 ${campaignName}\n\n📱 Scan QR Code to discover this location!\n\n🔗 ${qrCode}`,
          title: "Treasure Hunt QR Code",
        });
      } catch (shareError) {
        console.error("Share error:", shareError);
        Alert.alert(
          t("error") || "Error",
          t("printFailed") || "Failed to print QR code. Please try again.",
        );
      }
    }
  };
  const [locationOrder, setLocationOrder] = useState("1");
  const [locationRadius, setLocationRadius] = useState("50");
  const [locationRewardType, setLocationRewardType] = useState("points");
  const [locationRewardValue, setLocationRewardValue] = useState("10");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [locationCaptureMethod, setLocationCaptureMethod] = useState<"virtual"|"qr">("virtual");
  const [campaignSelectedProductId, setCampaignSelectedProductId] = useState<
    string | null
  >(null);
  const [locationStartDate, setLocationStartDate] = useState<Date | undefined>(
    new Date(),
  );
  const [locationEndDate, setLocationEndDate] = useState<Date | undefined>(
    undefined,
  );
  const [locationDiscoveryOrder, setLocationDiscoveryOrder] = useState<
    "sequential" | "any"
  >("any");
  const [locationSpecialReward, setLocationSpecialReward] = useState<
    "none" | "first_finder" | "top3" | "top10"
  >("none");
  const [locationBonusReward1, setLocationBonusReward1] = useState("50");
  const [locationBonusReward2, setLocationBonusReward2] = useState("30");
  const [locationBonusReward3, setLocationBonusReward3] = useState("20");
  const [requiresKey, setRequiresKey] = useState(false);
  const [keysRequired, setKeysRequired] = useState("1");

  // Map picker state
  const [mapPickerCoords, setMapPickerCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Debug: Log showMapPicker changes
  useEffect(() => {
    console.log("showMapPicker changed to:", showMapPicker);
  }, [showMapPicker]);

  useEffect(() => {
    if (selectedCampaign) {
      fetchLocations(selectedCampaign.id);
    }
  }, [selectedCampaign]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const [data, productsData] = await Promise.all([
        treasureHuntService.getAllCampaigns(),
        treasureHuntService.getAllProducts(),
      ]);
      setCampaigns(data);
      setProducts(productsData);
      if (data.length > 0 && !selectedCampaign) {
        setSelectedCampaign(data[0]);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
    setLoading(false);
  };

  const fetchLocations = async (campaignId: string) => {
    try {
      const data = await treasureHuntService.getAllLocations(campaignId);
      setLocations(data);
    } catch (error) {
      console.error("Error fetching locations:", error);
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
  const activeCampaign = campaigns.find(
    (c) => c.status === "active" || c.status === "paused",
  );
  // Get history campaigns (completed, cancelled)
  const historyCampaigns = campaigns.filter(
    (c) => c.status === "completed" || c.status === "cancelled",
  );

  // Fetch locations for active campaign
  useEffect(() => {
    const fetchActiveCampaignLocations = async () => {
      if (activeCampaign) {
        try {
          const data = await treasureHuntService.getAllLocations(
            activeCampaign.id,
          );
          setActiveCampaignLocations(data.length);
        } catch (error) {
          console.error("Error fetching active campaign locations:", error);
        }
      }
    };
    fetchActiveCampaignLocations();
  }, [activeCampaign]);

  // Calculate completion rate
  const completionRate =
    activeCampaign && activeCampaignLocations > 0
      ? Math.round(
          ((activeCampaign.metrics?.treasuresFound || 0) /
            activeCampaignLocations) *
            100,
        )
      : 0;

  const resetCampaignForm = () => {
    setCampaignNameFr("");
    setCampaignNameAr("");
    setCampaignDescFr("");
    setCampaignDescAr("");
    setRewardType("points");
    setRewardValue("100");
    setMaxParticipants("1000");
    setIsPublic(false);
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    // Default to current time for immediate activation
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    setStartTime(`${hours}:${minutes}`);
    setEndTime("23:59");
    setEditingCampaign(null);
  };

  const handleCreateCampaign = () => {
    resetCampaignForm();
    setShowCampaignModal(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignNameFr(campaign.name.fr || "");
    setCampaignNameAr(campaign.name["ar-tn"] || "");
    setCampaignDescFr(campaign.description?.fr || "");
    setCampaignDescAr(campaign.description?.["ar-tn"] || "");
    setRewardType(campaign.rewardType || "points");
    setRewardValue(String(campaign.rewardValue || 100));

    // Set product ID if reward type is free_product
    if (campaign.rewardType === "free_product") {
      setCampaignSelectedProductId(String(campaign.rewardValue || ""));
    } else {
      setCampaignSelectedProductId(null);
    }

    setMaxParticipants(String(campaign.maxParticipants || 1000));
    setIsPublic(campaign.isPublic || false);

    if (campaign.startDate) {
      const start =
        campaign.startDate instanceof Timestamp
          ? campaign.startDate.toDate()
          : new Date(campaign.startDate as any);
      setStartDate(start);
    }
    if (campaign.endDate) {
      const end =
        campaign.endDate instanceof Timestamp
          ? campaign.endDate.toDate()
          : new Date(campaign.endDate as any);
      setEndDate(end);
    }

    setShowCampaignModal(true);
  };

  const handleSaveCampaign = async () => {
    if (!campaignNameFr.trim()) {
      Alert.alert(t("error"), t("treasureHuntEnterName"));
      return;
    }

    setSaving(true);
    try {
      // Combine date and time
      const combineDateTime = (
        date: Date | undefined,
        time: string,
      ): Date | undefined => {
        if (!date) return undefined;
        const [hours, minutes] = time.split(":").map(Number);
        const combined = new Date(date);
        combined.setHours(hours, minutes, 0, 0);
        return combined;
      };

      const campaignData: Partial<Campaign> = {
        name: { fr: campaignNameFr, "ar-tn": campaignNameAr },
        description: { fr: campaignDescFr, "ar-tn": campaignDescAr },
        rewardType,
        rewardValue: parseInt(rewardValue) || 100,
        maxParticipants: parseInt(maxParticipants) || 1000,
        isPublic: true, // Always set to true for new campaigns
        status: "active", // Set status to active by default
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
        await treasureHuntService.updateCampaign(
          editingCampaign.id,
          campaignData,
        );
        Alert.alert(t("success"), t("treasureHuntCampaignUpdated"));
      } else {
        await treasureHuntService.createCampaign(campaignData);
        Alert.alert(t("success"), t("treasureHuntCampaignCreated"));
      }

      setShowCampaignModal(false);
      resetCampaignForm();
      fetchCampaigns();
    } catch (error) {
      console.error("Error saving campaign:", error);
      Alert.alert(t("error"), t("treasureHuntErrorSaving"));
    }
    setSaving(false);
  };

  const handlePublishCampaign = async (campaign: Campaign) => {
    try {
      const success = await treasureHuntService.publishCampaign(campaign.id);
      if (success) {
        Alert.alert(t("success"), t("treasureHuntCampaignPublished"));
        fetchCampaigns();
      }
    } catch (error) {
      console.error("Error publishing campaign:", error);
      Alert.alert(t("error"), t("treasureHuntErrorPublishing"));
    }
  };

  const handlePauseCampaign = async (campaign: Campaign) => {
    try {
      const success = await treasureHuntService.pauseCampaign(campaign.id);
      if (success) {
        Alert.alert(t("success"), t("treasureHuntCampaignPaused"));
        fetchCampaigns();
      }
    } catch (error) {
      console.error("Error pausing campaign:", error);
      Alert.alert(t("error"), t("treasureHuntErrorPausing"));
    }
  };

  const handleDeleteCampaign = async (campaign: Campaign) => {
    Alert.alert(t("confirmDelete"), t("treasureHuntDeleteConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await treasureHuntService.deleteCampaign(campaign.id);
            Alert.alert(t("success"), t("treasureHuntCampaignDeleted"));
            if (selectedCampaign?.id === campaign.id) {
              setSelectedCampaign(null);
            }
            fetchCampaigns();
          } catch (error) {
            console.error("Error deleting campaign:", error);
            Alert.alert(t("error"), t("treasureHuntErrorDeleting"));
          }
        },
      },
    ]);
  };

  const handleCreateLocation = () => {
    if (!selectedCampaign) {
      Alert.alert(t("error"), t("treasureHuntSelectCampaignFirst"));
      return;
    }
    setEditingLocation(null);
    resetLocationForm();
    setShowLocationModal(true);
  };

  const resetLocationForm = () => {
    setLocationNameFr("");
    setLocationNameAr("");
    setLocationHintFr("");
    setLocationHintAr("");
    setLocationNoteFr("");
    setLocationNoteAr("");
    setLatitude("");
    setLongitude("");
    setMapPickerCoords(null);
    setLocationOrder(String(locations.length + 1));
    setLocationRadius("50");
    setLocationCaptureMethod("virtual");
    setLocationStartDate(new Date());
    setLocationEndDate(undefined);
    setLocationDiscoveryOrder("any");
    setLocationSpecialReward("none");
    setLocationBonusReward1("50");
    setLocationBonusReward2("30");
    setLocationBonusReward3("20");
    setRequiresKey(false);
  };

  const handleEditLocation = (location: TreasureLocation) => {
    setEditingLocation(location);
    setLocationNameFr(location.name.fr || "");
    setLocationNameAr(location.name["ar-tn"] || "");
    setLocationHintFr(location.hint?.fr || "");
    setLocationHintAr(location.hint?.["ar-tn"] || "");
    setLocationNoteFr(location.note?.fr || "");
    setLocationNoteAr(location.note?.["ar-tn"] || "");
    setLatitude(String(location.coordinates.latitude));
    setLongitude(String(location.coordinates.longitude));
    setLocationOrder(String(location.order || 1));
    setLocationRadius(String(location.radius || 50));
    setLocationCaptureMethod(location.captureMethod || "virtual");
    setRequiresKey(location.requiresKey || false);
    setKeysRequired(String(location.keysRequired || 1));

    // Note: Rewards are now managed at campaign level, not location level
    setLocationStartDate(new Date());
    setLocationEndDate(undefined);

    setLocationDiscoveryOrder(location.discoveryOrder || "any");
    setLocationSpecialReward(location.specialReward || "none");
    setLocationBonusReward1(String(location.bonusRewardValue || 50));
    setLocationBonusReward2(String(location.bonusRewardValue2 || 30));
    setLocationBonusReward3(String(location.bonusRewardValue3 || 20));
    setShowLocationModal(true);
  };

  const handleSaveLocation = async () => {
    if (!locationNameFr.trim()) {
      Alert.alert(t("error"), t("treasureHuntEnterName"));
      return;
    }

    if (!latitude || !longitude) {
      Alert.alert(
        t("error"),
        t("treasureHuntSelectLocation") ||
          "Please select a location on the map",
      );
      return;
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      Alert.alert(
        t("error"),
        t("treasureHuntInvalidCoordinates") ||
          "Please select valid coordinates",
      );
      return;
    }

    setSaving(true);
    try {
      // Generate QR code for new locations
      const qrCode =
        editingLocation?.qrCode ||
        `TREASURE_${Date.now().toString(36).toUpperCase()}`;

      // Build location data object - only include defined values
      const locationData: Partial<TreasureLocation> = {
        campaignId: selectedCampaign!.id,
        name: { fr: locationNameFr, "ar-tn": locationNameAr },
        coordinates: {
          latitude: lat,
          longitude: lng,
        },
        qrCode: qrCode,
        order: parseInt(locationOrder) || 1,
        radius: parseInt(locationRadius) || 50,
        captureMethod: locationCaptureMethod,
        isActive: true,
        isDiscoverable: true,
        discoveryOrder: locationDiscoveryOrder as "sequential" | "any",
        specialReward: locationSpecialReward as
          | "none"
          | "first_finder"
          | "top3"
          | "top10",
        bonusRewardValue: parseInt(locationBonusReward1) || 50,
        bonusRewardValue2: parseInt(locationBonusReward2) || 30,
        bonusRewardValue3: parseInt(locationBonusReward3) || 20,
        requiresKey,
        keysRequired: requiresKey ? parseInt(keysRequired) || 1 : 0,
      };

      // Only add hint if it has values
      if (locationHintFr.trim() || locationHintAr.trim()) {
        locationData.hint = { fr: locationHintFr, "ar-tn": locationHintAr };
      }

      // Only add note if it has values
      if (locationNoteFr.trim() || locationNoteAr.trim()) {
        locationData.note = { fr: locationNoteFr, "ar-tn": locationNoteAr };
      }

      if (editingLocation) {
        await treasureHuntService.updateLocation(
          editingLocation.id,
          locationData,
        );
        Alert.alert(t("success"), t("treasureHuntLocationUpdated"));
      } else {
        await treasureHuntService.createLocation(locationData);
        Alert.alert(t("success"), t("treasureHuntLocationCreated"));
      }

      setShowLocationModal(false);
      resetLocationForm();
      fetchLocations(selectedCampaign!.id);
    } catch (error) {
      console.error("Error saving location:", error);
      Alert.alert(t("error"), t("treasureHuntErrorSaving"));
    }
    setSaving(false);
  };

  const handleDeleteLocation = async (location: TreasureLocation) => {
    Alert.alert(t("confirmDelete"), t("treasureHuntDeleteLocationConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await treasureHuntService.deleteLocation(location.id);
            Alert.alert(t("success"), t("treasureHuntLocationDeleted"));
            fetchLocations(selectedCampaign!.id);
          } catch (error) {
            console.error("Error deleting location:", error);
            Alert.alert(t("error"), t("treasureHuntErrorDeleting"));
          }
        },
      },
    ]);
  };

  const showQRCode = (location: TreasureLocation) => {
    setEditingLocation(location);
    setShowQRModal(true);
  };

  const handleManageBombs = async (location: TreasureLocation) => {
    setLocationForBombs(location);
    setIsAddingBomb(false);
    setLoading(true);
    try {
      const bombs = await treasureHuntService.getBombs(selectedCampaign!.id);
      // Filter bombs for this location
      setBombsForLocation(bombs.filter((b) => b.treasureId === location.id));
      setShowBombModal(true);
    } catch (error) {
      console.error("Error fetching bombs:", error);
    }
    setLoading(false);
  };

  const handleManageKeys = async (location: TreasureLocation) => {
    setLocationForKeys(location);
    setIsAddingKey(false);
    setLoading(true);
    try {
      const keys = await treasureHuntService.getKeys(selectedCampaign!.id);
      setKeysForCampaign(keys);
      setShowKeyModal(true);
    } catch (error) {
      console.error("Error fetching keys:", error);
    }
    setLoading(false);
  };

  const handleAddKeyAtCoordinate = async (coordinate: {
    latitude: number;
    longitude: number;
  }) => {
    if (!selectedCampaign) return;

    try {
      const newKey = await treasureHuntService.createKey({
        campaignId: selectedCampaign.id,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });

      if (newKey) {
        setKeysForCampaign((prev) => [...prev, newKey]);
      }
    } catch (error) {
      console.error("Error adding key:", error);
      Alert.alert(
        t("error"),
        tr("treasureHuntErrorAddingKey", "Failed to add key."),
      );
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const success = await treasureHuntService.deleteKey(keyId);
      if (success) {
        setKeysForCampaign((prev) => prev.filter((k) => k.id !== keyId));
      }
    } catch (error) {
      console.error("Error deleting key:", error);
    }
  };

  const handleAddBombAtCoordinate = async (coordinate: {
    latitude: number;
    longitude: number;
  }) => {
    if (!locationForBombs || !selectedCampaign) return;

    try {
      const newBomb = await treasureHuntService.createBomb({
        campaignId: selectedCampaign.id,
        treasureId: locationForBombs.id,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        type: "static",
      });

      if (newBomb) {
        setBombsForLocation((prev) => [...prev, newBomb]);
        // Alert.alert(
        //   t("success"),
        //   tr("treasureHuntBombAdded", "Bomb added successfully!"),
        // );
      }
    } catch (error) {
      console.error("Error adding bomb:", error);
      Alert.alert(
        t("error"),
        tr("treasureHuntErrorAddingBomb", "Failed to add bomb."),
      );
    }
  };

  const handleGenerateRandomBombs = async (count: number) => {
    if (!locationForBombs || !selectedCampaign) return;

    setLoading(true);
    try {
      const { latitude, longitude } = locationForBombs.coordinates;
      const radius = 0.005; // ~500m radius in degrees (approximate)

      const newBombs: BombType[] = [];
      for (let i = 0; i < count; i++) {
        // Random offset within radius
        const latOffset = (Math.random() - 0.5) * radius * 2;
        const lngOffset = (Math.random() - 0.5) * radius * 2;

        const bomb = await treasureHuntService.createBomb({
          campaignId: selectedCampaign.id,
          treasureId: locationForBombs.id,
          latitude: latitude + latOffset,
          longitude: longitude + lngOffset,
          type: "static",
        });

        if (bomb) newBombs.push(bomb);
      }

      setBombsForLocation((prev) => [...prev, ...newBombs]);
      Alert.alert(
        t("success"),
        tr(
          "treasureHuntBombsGenerated",
          `${newBombs.length} bombs generated successfully!`,
        ),
      );
    } catch (error) {
      console.error("Error generating bombs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBomb = async (bombId: string) => {
    try {
      const success = await treasureHuntService.deleteBomb(bombId);
      if (success) {
        setBombsForLocation(bombsForLocation.filter((b) => b.id !== bombId));
        Alert.alert(
          t("success"),
          tr("treasureHuntBombDeleted", "Bomb removed."),
        );
      }
    } catch (error) {
      console.error("Error deleting bomb:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#34C759";
      case "paused":
        return "#FF9500";
      case "draft":
        return "#8E8E93";
      case "completed":
        return colors.primary;
      case "cancelled":
        return "#FF3B30";
      default:
        return "#8E8E93";
    }
  };

  const getStatusLabel = (status: string) => {
    return (
      t(
        `treasureHuntStatus${status.charAt(0).toUpperCase() + status.slice(1)}`,
      ) || status
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date =
      timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
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
          <Text
            style={[styles.campaignCardTitle, { color: colors.foreground }]}
          >
            {campaign.name.fr || campaign.name["ar-tn"] || t("untitled")}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(campaign.status) },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {getStatusLabel(campaign.status)}
            </Text>
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
          {campaign.rewardType === "points"
            ? `${campaign.rewardValue} ${tr("treasureHuntPoints", "Points")}`
            : campaign.rewardType === "discount"
              ? `${campaign.rewardValue}% ${tr("treasureHuntDiscount", "Discount")}`
              : campaign.rewardType === "free_product"
                ? tr("treasureHuntFreeProduct", "Free Product")
                : campaign.rewardType === "coupon"
                  ? tr("treasureHuntCoupon", "Coupon")
                  : tr("treasureHuntSpecialReward", "Special Reward")}
        </Text>
      </View>

      {selectedCampaign?.id === campaign.id && (
        <View style={styles.campaignActions}>
          {campaign.status === "draft" || campaign.status === "paused" ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#34C759" }]}
              onPress={() => handlePublishCampaign(campaign)}
            >
              <Play size={16} color="#FFF" />
              <Text style={styles.actionButtonText}>
                {t("treasureHuntPublish")}
              </Text>
            </TouchableOpacity>
          ) : null}
          {campaign.status === "active" ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#FF9500" }]}
              onPress={() => handlePauseCampaign(campaign)}
            >
              <Pause size={16} color="#FFF" />
              <Text style={styles.actionButtonText}>
                {t("treasureHuntPause")}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleEditCampaign(campaign)}
          >
            <Pencil size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>{t("edit")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#FF3B30" }]}
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
        <View style={[styles.locationOrderBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.locationOrderText}>{location.order}</Text>
        </View>
        <View style={styles.locationCardTitleRow}>
          <Text
            style={[styles.locationCardTitle, { color: colors.foreground }]}
          >
            {location.name.fr || location.name["ar-tn"] || t("untitled")}
          </Text>
          <View
            style={[
              styles.locationStatusBadge,
              { backgroundColor: location.isActive ? "#34C759" : "#8E8E93" },
            ]}
          >
            <Text style={styles.locationStatusText}>
              {location.isActive ? t("active") : t("inactive")}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.locationCardCoords}>
        <MapPin size={14} color={colors.textMuted} />
        <Text style={[styles.cardCoordText, { color: colors.textMuted }]}>
          {location.coordinates.latitude.toFixed(6)},{" "}
          {location.coordinates.longitude.toFixed(6)}
        </Text>
        {/* Capture method chip */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          marginLeft: 'auto',
          backgroundColor: location.captureMethod === 'qr' ? '#4F46E5' + '20' : '#FF3366' + '15',
          borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: location.captureMethod === 'qr' ? '#4F46E5' : '#FF3366' }}>
            {location.captureMethod === 'qr' ? '📷 QR' : '👆 Virtual'}
          </Text>
        </View>
      </View>

      {location.hint?.fr && (
        <Text
          style={[styles.hintText, { color: colors.textMuted }]}
          numberOfLines={2}
        >
          💡 {location.hint.fr}
        </Text>
      )}

      {location.note?.fr && (
        <Text
          style={[styles.noteText, { color: colors.primary }]}
          numberOfLines={2}
        >
          📝 {location.note.fr}
        </Text>
      )}

      <View style={styles.locationCardRewards}>
        <Gift size={14} color={colors.primary} />
        <Text style={[styles.rewardText, { color: colors.primary }]}>
          {/* Show campaign-level rewards since location rewards are now unified */}
          {selectedCampaign?.rewardType === "points"
            ? `${selectedCampaign.rewardValue} ${t("treasureHuntPoints")}`
            : selectedCampaign?.rewardType === "discount"
              ? `${selectedCampaign.rewardValue}% ${t("treasureHuntDiscount")}`
              : selectedCampaign?.rewardType === "coupon"
                ? t("treasureHuntCoupon")
                : selectedCampaign?.rewardType === "free_product"
                  ? t("treasureHuntFreeProduct")
                  : t("treasureHuntSpecialReward")}
        </Text>
      </View>

      <View style={styles.locationActions}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: "#FF9500" }]}
          onPress={() => handleManageBombs(location)}
        >
          <Bomb size={16} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: "#10B981" }]}
          onPress={() => handleManageKeys(location)}
        >
          <Key size={16} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.primary }]}
          onPress={() => showQRCode(location)}
        >
          <QrCode size={16} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: "#007AFF" }]}
          onPress={() => handleEditLocation(location)}
        >
          <Pencil size={16} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: "#FF3B30" }]}
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
        title={tr("treasureHuntAdmin", "TREASURE HUNTS")}
        onBack={onBack}
        scrollY={scrollY}
        rightElement={
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.headerRefresh}
          >
            <RefreshCw size={20} color={colors.foreground} />
          </TouchableOpacity>
        }
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        {/* Summary Statistics */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          <StatCard
            label={tr("treasureHuntTotal", "TOTAL")}
            value={String(campaigns.length)}
            icon={Trophy}
            color={colors.primary}
            style={styles.statCard}
          />
          <StatCard
            label={tr("treasureHuntActive", "ACTIVE")}
            value={String(
              campaigns.filter((c) => c.status === "active").length,
            )}
            icon={Play}
            color="#34C759"
            style={styles.statCard}
          />
          <StatCard
            label={tr("treasureHuntTreasures", "TREASURES")}
            value={String(locations.length)}
            icon={Gift}
            color="#FF9500"
            style={styles.statCard}
          />
          <StatCard
            label={tr("treasureHuntFound", "FOUND")}
            value={String(
              campaigns.reduce(
                (acc, c) => acc + (c.metrics?.treasuresFound || 0),
                0,
              ),
            )}
            icon={Target}
            color={colors.primary}
            style={styles.statCard}
          />
        </ScrollView>

        {/* Tab Navigation */}
        <AdminTabNav
          tabs={[
            {
              id: "campaigns",
              label: tr("treasureHuntCampaigns", "Campaigns"),
            },
            {
              id: "locations",
              label: tr("treasureHuntLocations", "Locations"),
            },
          ]}
          active={activeTab}
          onChange={(tab: any) => setActiveTab(tab)}
          // style={{ marginHorizontal: 16, marginBottom: 20 }} // AdminTabNav doesn't accept style prop in this version
        />

        {activeTab === "campaigns" ? (
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            {/* History Toggle Badge */}
            {historyCampaigns.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.historyBadge,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => setShowHistory(!showHistory)}
              >
                <Clock size={16} color={colors.textMuted} />
                <Text
                  style={[
                    styles.historyBadgeText,
                    { color: colors.foreground },
                  ]}
                >
                  {tr("treasureHuntHistory", "Campaign History")} (
                  {historyCampaigns.length})
                </Text>
                <Text style={{ color: colors.primary, marginLeft: "auto" }}>
                  {showHistory ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>
            )}

            {/* History List */}
            {showHistory &&
              historyCampaigns.map((campaign) => (
                <View key={campaign.id} style={{ marginBottom: 12 }}>
                  {renderCampaignCard(campaign)}
                </View>
              ))}

            {/* Recent/Active Campaigns Section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {tr("treasureHuntAllCampaigns", "All Campaigns")}
              </Text>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: "#34C759" }]}
                onPress={handleCreateCampaign}
              >
                <Plus size={16} color="#FFF" />
                <Text style={styles.createButtonText}>{t("create")}</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <View style={styles.campaignsList}>
                {campaigns.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Gift size={48} color={colors.textMuted} />
                    <Text
                      style={[styles.emptyTitle, { color: colors.foreground }]}
                    >
                      {tr("treasureHuntNoCampaigns", "No campaigns yet")}
                    </Text>
                    <Text
                      style={[
                        styles.emptySubtitle,
                        { color: colors.textMuted },
                      ]}
                    >
                      {tr(
                        "treasureHuntCreateFirst",
                        "Create your first campaign to start",
                      )}
                    </Text>
                  </View>
                ) : (
                  campaigns
                    .filter(
                      (c) =>
                        c.status !== "completed" && c.status !== "cancelled",
                    )
                    .map(renderCampaignCard)
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            {/* Campaign Selector for Locations */}
            <View style={styles.campaignSelectorWrapper}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.foreground, marginBottom: 12 },
                ]}
              >
                {tr("treasureHuntSelectCampaign", "Select Campaign")}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {campaigns.map((campaign) => (
                  <TouchableOpacity
                    key={campaign.id}
                    style={[
                      styles.campaignSelectorItem,
                      {
                        backgroundColor:
                          selectedCampaign?.id === campaign.id
                            ? colors.primary
                            : colors.card,
                        borderColor:
                          selectedCampaign?.id === campaign.id
                            ? colors.primary
                            : colors.border,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => setSelectedCampaign(campaign)}
                  >
                    <Text
                      style={[
                        styles.campaignSelectorText,
                        {
                          color:
                            selectedCampaign?.id === campaign.id
                              ? "#FFF"
                              : colors.foreground,
                        },
                      ]}
                    >
                      {campaign.name.fr ||
                        campaign.name["ar-tn"] ||
                        t("untitled")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Locations List */}
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : selectedCampaign ? (
              <View style={styles.locationsList}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[styles.sectionTitle, { color: colors.foreground }]}
                  >
                    {tr("treasureHuntLocations", "Locations")} (
                    {locations.length})
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.createButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={handleCreateLocation}
                  >
                    <Plus size={16} color="#FFF" />
                    <Text style={styles.createButtonText}>
                      {tr("treasureHuntAddLocation", "Add Location")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {locations.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MapPin size={48} color={colors.textMuted} />
                    <Text
                      style={[styles.emptyTitle, { color: colors.foreground }]}
                    >
                      {tr("treasureHuntNoLocations", "No locations")}
                    </Text>
                    <Text
                      style={[
                        styles.emptySubtitle,
                        { color: colors.textMuted },
                      ]}
                    >
                      {tr(
                        "treasureHuntAddFirstLocation",
                        "Add a location to this campaign",
                      )}
                    </Text>
                  </View>
                ) : (
                  locations.map(renderLocationCard)
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Target size={48} color={colors.textMuted} />
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: colors.textMuted, textAlign: "center" },
                  ]}
                >
                  {tr(
                    "treasureHuntSelectToSeeLocations",
                    "Select a campaign above to manage its locations",
                  )}
                </Text>
              </View>
            )}
          </View>
        )}
      </Animated.ScrollView>

      {/* Campaign Modal */}
      <Modal visible={showCampaignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingCampaign
                  ? t("treasureHuntEditCampaign")
                  : t("treasureHuntNewCampaign")}
              </Text>
              <TouchableOpacity onPress={() => setShowCampaignModal(false)}>
                <X size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <InputLabel text={`${t("name")} (FR) *`} />
                <AdminInput
                  value={campaignNameFr}
                  onChangeText={setCampaignNameFr}
                  placeholder={t("treasureHuntNameFrPlaceholder")}
                />
              </View>

              <View style={styles.formGroup}>
                <InputLabel text={`${t("name")} (AR)`} />
                <AdminInput
                  value={campaignNameAr}
                  onChangeText={setCampaignNameAr}
                  placeholder={t("treasureHuntNameArPlaceholder")}
                />
              </View>

              <View style={styles.formGroup}>
                <InputLabel text={`${t("description")} (FR)`} />
                <AdminInput
                  value={campaignDescFr}
                  onChangeText={setCampaignDescFr}
                  placeholder={t("treasureHuntDescFrPlaceholder")}
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <InputLabel text={`${t("description")} (AR)`} />
                <AdminInput
                  value={campaignDescAr}
                  onChangeText={setCampaignDescAr}
                  placeholder={t("treasureHuntDescArPlaceholder")}
                  multiline
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <InputLabel text={t("treasureHuntStartDate")} />
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder={t("selectDate")}
                    style={{ minHeight: 48 }}
                  />
                  <AdminInput
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="00:00"
                    style={{ marginTop: 4 }}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <InputLabel text={t("treasureHuntEndDate")} />
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    placeholder={t("selectDate")}
                    style={{ minHeight: 48 }}
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
                  <InputLabel text={t("treasureHuntRewardType")} />
                  <Picker
                    value={rewardType}
                    onValueChange={(value) => {
                      setRewardType(value);
                      if (value !== "free_product")
                        setCampaignSelectedProductId(null);
                      if (value !== "coupon") setRewardValue("");
                    }}
                    options={[
                      {
                        label: tr("treasureHuntPoints", "Points"),
                        value: "points",
                      },
                      {
                        label: tr("treasureHuntDiscount", "Discount %"),
                        value: "discount",
                      },
                      {
                        label: tr("treasureHuntFreeProduct", "Free Product"),
                        value: "free_product",
                      },
                      {
                        label: tr("treasureHuntCoupon", "Coupon Code"),
                        value: "coupon",
                      },
                    ]}
                    style={{ minHeight: 48 }}
                  />
                </View>
              </View>

              {/* Dynamic Reward Input based on reward type */}
              {rewardType === "free_product" ? (
                <View style={styles.formGroup}>
                  <InputLabel text={t("selectProduct") || "Select Product"} />
                  <Picker
                    value={campaignSelectedProductId || ""}
                    onValueChange={(value) => {
                      setCampaignSelectedProductId(value);
                      setRewardValue(value);
                    }}
                    options={[
                      {
                        label: t("selectProduct") || "Select a product",
                        value: "",
                      },
                      ...products.map((product) => ({
                        label:
                          typeof product.name === "object"
                            ? product.name.fr ||
                              product.name["ar-tn"] ||
                              "Product"
                            : product.name,
                        value: product.id,
                      })),
                    ]}
                    style={{ minHeight: 48 }}
                  />
                  {campaignSelectedProductId && (
                    <Text
                      style={{
                        marginTop: 8,
                        color: colors.primary,
                        fontSize: 12,
                      }}
                    >
                      {
                        products.find((p) => p.id === campaignSelectedProductId)
                          ?.price
                      }{" "}
                      TND
                    </Text>
                  )}
                </View>
              ) : rewardType === "coupon" ? (
                <View style={styles.formGroup}>
                  <InputLabel text={t("couponCode") || "Coupon Code"} />
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <AdminInput
                      value={rewardValue}
                      onChangeText={setRewardValue}
                      placeholder="CODE50"
                    />
                    <TouchableOpacity
                      style={{
                        marginLeft: 8,
                        backgroundColor: colors.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 8,
                      }}
                      onPress={() => {
                        // Generate a new coupon code
                        const newCode = `TH_${Date.now().toString(36).toUpperCase()}`;
                        setRewardValue(newCode);
                      }}
                    >
                      <Plus size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={{
                      marginTop: 8,
                      color: colors.textMuted,
                      fontSize: 12,
                    }}
                  >
                    {t("treasureHuntCouponHint") ||
                      "Enter an existing coupon code or tap + to generate a new one"}
                  </Text>
                </View>
              ) : rewardType === "discount" ? (
                <View style={styles.formGroup}>
                  <InputLabel
                    text={t("treasureHuntDiscount") || "Discount %"}
                  />
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <AdminInput
                      value={rewardValue}
                      onChangeText={setRewardValue}
                      keyboardType="numeric"
                      placeholder="20"
                    />
                    <Text
                      style={{
                        marginLeft: 8,
                        color: colors.foreground,
                        fontWeight: "600",
                      }}
                    >
                      %
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <InputLabel text={t("treasureHuntPoints") || "Points"} />
                  <AdminInput
                    value={rewardValue}
                    onChangeText={setRewardValue}
                    keyboardType="numeric"
                    placeholder="100"
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <InputLabel text={t("treasureHuntMaxParticipants")} />
                <AdminInput
                  value={maxParticipants}
                  onChangeText={setMaxParticipants}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.switchRow}>
                <Text
                  style={[styles.switchLabel, { color: colors.foreground }]}
                >
                  {t("treasureHuntPublic")}
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
                      {editingCampaign ? t("update") : t("create")}
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
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  if (locationModalView === "map") {
                    setLocationModalView("form");
                  } else {
                    setShowLocationModal(false);
                  }
                }}
              >
                <ChevronLeft size={24} color={colors.foreground} />
              </TouchableOpacity>
              <Text
                style={[
                  styles.modalTitle,
                  {
                    color: colors.foreground,
                    flex: 1,
                    textAlign: "center",
                    marginRight: 24,
                  },
                ]}
              >
                {locationModalView === "map"
                  ? "📍 Select Location"
                  : editingLocation
                    ? t("treasureHuntEditLocation")
                    : t("treasureHuntNewLocation")}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Conditional: Map View or Form View */}
            {locationModalView === "map" ? (
              <View style={{ flex: 1 }}>
                {/* Inline Map */}
                <View
                  style={{
                    height: 450,
                    width: "100%",
                    borderRadius: 15,
                    overflow: "hidden",
                    marginBottom: 15,
                  }}
                >
                  <MapView
                    style={{ flex: 1, width: "100%", height: "100%" }}
                    initialRegion={{
                      latitude:
                        mapPickerCoords?.latitude ||
                        (latitude ? parseFloat(latitude) : 36.8065),
                      longitude:
                        mapPickerCoords?.longitude ||
                        (longitude ? parseFloat(longitude) : 10.1815),
                      latitudeDelta: 0.015,
                      longitudeDelta: 0.015,
                    }}
                    onPress={handleMapPress}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                  >
                    {mapPickerCoords && (
                      <Marker coordinate={mapPickerCoords} pinColor="#FF6B6B" />
                    )}
                  </MapView>
                </View>

                {/* Selected Coordinates Display */}
                <View
                  style={{
                    marginBottom: 15,
                    padding: 12,
                    backgroundColor: colors.card,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: colors.foreground,
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: 15,
                    }}
                  >
                    {mapPickerCoords
                      ? `✅ Selected: ${mapPickerCoords.latitude.toFixed(6)}, ${mapPickerCoords.longitude.toFixed(6)}`
                      : "👆 Tap on the map to select a location"}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: colors.background,
                      padding: 14,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    onPress={() => setLocationModalView("form")}
                  >
                    <Text
                      style={{
                        color: colors.foreground,
                        textAlign: "center",
                        fontWeight: "600",
                      }}
                    >
                      ← Back to Form
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: colors.primary,
                      padding: 14,
                      borderRadius: 10,
                    }}
                    onPress={() => {
                      if (mapPickerCoords) {
                        setLatitude(mapPickerCoords.latitude.toFixed(6));
                        setLongitude(mapPickerCoords.longitude.toFixed(6));
                      }
                      setLocationModalView("form");
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFF",
                        textAlign: "center",
                        fontWeight: "bold",
                        fontSize: 15,
                      }}
                    >
                      ✓ Confirm Location
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <InputLabel text={`${t("name")} (FR) *`} />
                  <AdminInput
                    value={locationNameFr}
                    onChangeText={setLocationNameFr}
                    placeholder={t("treasureHuntLocationNameFrPlaceholder")}
                  />
                </View>

                <View style={styles.formGroup}>
                  <InputLabel text={`${t("name")} (AR)`} />
                  <AdminInput
                    value={locationNameAr}
                    onChangeText={setLocationNameAr}
                    placeholder={t("treasureHuntLocationNameArPlaceholder")}
                  />
                </View>

                <View style={styles.formGroup}>
                  <InputLabel text={`${t("treasureHuntHint")} (FR)`} />
                  <AdminInput
                    value={locationHintFr}
                    onChangeText={setLocationHintFr}
                    placeholder={t("treasureHuntHintFrPlaceholder")}
                    multiline
                  />
                </View>

                <View style={styles.formGroup}>
                  <InputLabel text={`${t("treasureHuntHint")} (AR)`} />
                  <AdminInput
                    value={locationHintAr}
                    onChangeText={setLocationHintAr}
                    placeholder={t("treasureHuntHintArPlaceholder")}
                    multiline
                  />
                </View>

                <View style={styles.formGroup}>
                  <InputLabel text={tr("treasureHuntNote", "Note") + " (FR)"} />
                  <AdminInput
                    value={locationNoteFr}
                    onChangeText={setLocationNoteFr}
                    placeholder={tr(
                      "treasureHuntNoteFrPlaceholder",
                      "Optional note in French",
                    )}
                    multiline
                  />
                </View>

                <View style={styles.formGroup}>
                  <InputLabel text={tr("treasureHuntNote", "Note") + " (AR)"} />
                  <AdminInput
                    value={locationNoteAr}
                    onChangeText={setLocationNoteAr}
                    placeholder={tr(
                      "treasureHuntNoteArPlaceholder",
                      "ملاحظة اختيارية بالعربية",
                    )}
                    multiline
                  />
                </View>

                <View style={styles.formGroup}>
                  <InputLabel
                    text={tr("treasureHuntCoordinates", "Coordinates") + " *"}
                  />
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity
                      style={[
                        styles.mapSelectButton,
                        {
                          backgroundColor: colors.primary,
                          minHeight: 48,
                          flex: 1,
                        },
                      ]}
                      onPress={() => {
                        // Close location modal, open map picker
                        setShowLocationModal(false);
                        setTimeout(() => {
                          setShowMapPicker(true);
                        }, 300);
                      }}
                      activeOpacity={0.7}
                    >
                      <MapPin size={18} color="#FFF" />
                      <Text style={styles.mapSelectButtonText}>
                        {latitude && longitude
                          ? `${tr("treasureHuntSelected", "Selected")}: ${latitude}, ${longitude}`
                          : tr("treasureHuntSelectOnMap", "Select on Map")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <InputLabel text={t("treasureHuntOrder")} />
                    <AdminInput
                      value={locationOrder}
                      onChangeText={setLocationOrder}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <InputLabel text={`${t("treasureHuntRadius")} (m)`} />
                    <AdminInput
                      value={locationRadius}
                      onChangeText={setLocationRadius}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <InputLabel text={t("treasureHuntCaptureMethod") || "Capture Method"} />
                  <Picker
                    value={locationCaptureMethod}
                    onValueChange={(value) => setLocationCaptureMethod(value as "virtual"|"qr")}
                    options={[
                      { label: t("treasureHuntVirtualCapture") || "Virtual (Capture Button)", value: "virtual" },
                      { label: t("treasureHuntQRCapture") || "Scan QR Code", value: "qr" }
                    ]}
                    style={{ minHeight: 48 }}
                  />
                </View>

                {/* Note: Rewards are now managed at the campaign level */}
                <View
                  style={[
                    styles.formGroup,
                    {
                      backgroundColor: colors.card,
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    {t("treasureHuntRewardNote") ||
                      "💡 Rewards are defined at the campaign level and apply to all locations."}
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <InputLabel
                    text={t("treasureHuntStartDate") || "Start Date"}
                  />
                  <DatePicker
                    value={locationStartDate}
                    onChange={setLocationStartDate}
                    mode="date"
                    style={{ minHeight: 48 }}
                  />
                </View>

                <View style={styles.formGroup}>
                  <InputLabel
                    text={t("treasureHuntEndDate") || "End Date (Optional)"}
                  />
                  <DatePicker
                    value={locationEndDate}
                    onChange={setLocationEndDate}
                    mode="date"
                    style={{ minHeight: 48 }}
                  />
                </View>

                <View style={styles.formGroup}>
                  <InputLabel
                    text={t("treasureHuntDiscoveryOrder") || "Discovery Order"}
                  />
                  <Picker
                    value={locationDiscoveryOrder}
                    onValueChange={(value) =>
                      setLocationDiscoveryOrder(value as "sequential" | "any")
                    }
                    options={[
                      {
                        label: t("treasureHuntDiscoveryAny") || "Any Order",
                        value: "any",
                      },
                      {
                        label:
                          t("treasureHuntDiscoverySequential") || "Sequential",
                        value: "sequential",
                      },
                    ]}
                    style={{ minHeight: 48 }}
                  />
                </View>

                <View style={styles.formGroup}>
                  <InputLabel
                    text={
                      t("treasureHuntSpecialReward") ||
                      "Special Reward for Winners"
                    }
                  />
                  <Picker
                    value={locationSpecialReward}
                    onValueChange={(value) =>
                      setLocationSpecialReward(
                        value as "none" | "first_finder" | "top3" | "top10",
                      )
                    }
                    options={[
                      {
                        label: t("treasureHuntSpecialNone") || "None",
                        value: "none",
                      },
                      {
                        label:
                          t("treasureHuntSpecialFirst") || "First Finder Only",
                        value: "first_finder",
                      },
                      {
                        label: t("treasureHuntSpecialTop3") || "Top 3 Finders",
                        value: "top3",
                      },
                      {
                        label:
                          t("treasureHuntSpecialTop10") || "Top 10 Finders",
                        value: "top10",
                      },
                    ]}
                    style={{ minHeight: 48 }}
                  />
                </View>

                {locationSpecialReward !== "none" && (
                  <View
                    style={[
                      styles.formGroup,
                      {
                        backgroundColor: colors.card,
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: colors.primary,
                        fontWeight: "600",
                        marginBottom: 12,
                      }}
                    >
                      {t("treasureHuntBonusRewards") ||
                        "Bonus Rewards for Top Finders"}
                    </Text>

                    {locationSpecialReward === "first_finder" && (
                      <View style={styles.formGroup}>
                        <InputLabel
                          text={
                            t("treasureHuntFirstPlace") || "1st Place Bonus"
                          }
                        />
                        <AdminInput
                          value={locationBonusReward1}
                          onChangeText={setLocationBonusReward1}
                          keyboardType="numeric"
                          placeholder="50"
                        />
                      </View>
                    )}

                    {locationSpecialReward === "top3" && (
                      <>
                        <View style={styles.formGroup}>
                          <InputLabel
                            text={t("treasureHuntFirstPlace") || "1st Place"}
                          />
                          <AdminInput
                            value={locationBonusReward1}
                            onChangeText={setLocationBonusReward1}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.formGroup}>
                          <InputLabel
                            text={t("treasureHuntSecondPlace") || "2nd Place"}
                          />
                          <AdminInput
                            value={locationBonusReward2}
                            onChangeText={setLocationBonusReward2}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.formGroup}>
                          <InputLabel
                            text={t("treasureHuntThirdPlace") || "3rd Place"}
                          />
                          <AdminInput
                            value={locationBonusReward3}
                            onChangeText={setLocationBonusReward3}
                            keyboardType="numeric"
                          />
                        </View>
                      </>
                    )}

                    {locationSpecialReward === "top10" && (
                      <View style={styles.formGroup}>
                        <InputLabel
                          text={
                            t("treasureHuntTop10Bonus") ||
                            "Bonus for Each Top 10 Finder"
                          }
                        />
                        <AdminInput
                          value={locationBonusReward1}
                          onChangeText={setLocationBonusReward1}
                          keyboardType="numeric"
                        />
                      </View>
                    )}
                  </View>
                )}

                <View style={[styles.formGroup, { marginTop: 10 }]}>
                    <SectionLabel text={tr("treasureHuntSettings", "Extra Settings")} />
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: colors.card,
                        padding: 12,
                        borderRadius: 12,
                        marginTop: 8
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Key size={18} color={colors.primary} style={{ marginRight: 10 }} />
                            <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                                {tr("treasureHuntRequiresKey", "Requires Key to Open")}
                            </Text>
                        </View>
                        <ModernSwitch 
                            active={requiresKey}
                            onPress={() => setRequiresKey(!requiresKey)}
                        />
                    </View>

                    {requiresKey && (
                        <View style={{ marginTop: 12 }}>
                            <InputLabel text={tr("treasureHuntKeysNeeded", "Number of Keys Needed")} />
                            <AdminInput 
                                value={keysRequired}
                                onChangeText={setKeysRequired}
                                keyboardType="numeric"
                                placeholder="1"
                            />
                        </View>
                    )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleSaveLocation}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Check size={20} color="#FFF" />
                      <Text style={styles.saveButtonText}>
                        {editingLocation ? t("update") : t("create")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal visible={showQRModal} animationType="fade" transparent>
        <View style={styles.qrModalOverlay}>
          <View
            style={[styles.qrModalContent, { backgroundColor: colors.card }]}
          >
            <View style={styles.qrModalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {t("treasureHuntQRCode")}
              </Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <X size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrCodeContainer}>
              <View
                style={[
                  styles.qrCodePlaceholder,
                  { backgroundColor: colors.background },
                ]}
              >
                <QrCode size={100} color={colors.primary} />
              </View>
              <Text style={[styles.qrCodeLabel, { color: colors.textMuted }]}>
                {editingLocation?.qrCode}
              </Text>
              <Text style={[styles.qrCodeHint, { color: colors.textMuted }]}>
                {t("treasureHuntScanToDiscover")}
              </Text>
              {editingLocation?.name && (
                <Text
                  style={[
                    styles.qrCodeLocationName,
                    { color: colors.foreground },
                  ]}
                >
                  {typeof editingLocation.name === "object"
                    ? editingLocation.name.fr ||
                      editingLocation.name["ar-tn"] ||
                      ""
                    : editingLocation.name}
                </Text>
              )}
              {selectedCampaign && (
                <Text
                  style={[styles.qrCodeCampaignName, { color: colors.primary }]}
                >
                  {typeof selectedCampaign.name === "object"
                    ? selectedCampaign.name.fr ||
                      selectedCampaign.name["ar-tn"] ||
                      ""
                    : selectedCampaign.name}
                </Text>
              )}
            </View>

            <View style={styles.qrButtonRow}>
              <TouchableOpacity
                style={[
                  styles.printButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handlePrintQRCode}
              >
                <Printer size={20} color="#FFF" />
                <Text style={styles.printButtonText}>
                  {t("print") || "Print"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => setShowQRModal(false)}
              >
                <Text
                  style={[styles.closeButtonText, { color: colors.foreground }]}
                >
                  {t("close")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Map Picker Modal */}
      <Modal visible={showMapPicker} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 20,
              padding: 20,
              width: "100%",
              maxHeight: "90%",
            }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              {t("treasureHuntSelectLocation") || "Select Location"}
            </Text>

            {/* Map */}
            <View
              style={{
                height: 450,
                width: "100%",
                borderRadius: 15,
                overflow: "hidden",
                marginBottom: 15,
              }}
            >
              <MapView
                style={{ flex: 1, width: "100%", height: "100%" }}
                initialRegion={{
                  latitude:
                    mapPickerCoords?.latitude ||
                    (latitude ? parseFloat(latitude) : 36.8065),
                  longitude:
                    mapPickerCoords?.longitude ||
                    (longitude ? parseFloat(longitude) : 10.1815),
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.015,
                }}
                onPress={handleMapPress}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                {mapPickerCoords && (
                  <Marker coordinate={mapPickerCoords}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.primary,
                        justifyContent: "center",
                        alignItems: "center",
                        borderWidth: 3,
                        borderColor: "#FFF",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 5,
                      }}
                    >
                      <Trophy size={20} color="#FFF" />
                    </View>
                  </Marker>
                )}
              </MapView>
            </View>

            {/* Selected Coordinates */}
            <View
              style={{
                marginBottom: 15,
                padding: 12,
                backgroundColor: colors.card,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  color: colors.foreground,
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: 15,
                }}
              >
                {mapPickerCoords
                  ? `${t("treasureHuntSelected") || "Selected"}: ${mapPickerCoords.latitude.toFixed(6)}, ${mapPickerCoords.longitude.toFixed(6)}`
                  : t("treasureHuntTapToSelect") ||
                    "Tap on the map to select a location"}
              </Text>
            </View>

            {/* Buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.background,
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={() => {
                  setShowMapPicker(false);
                  setShowLocationModal(true);
                }}
              >
                <Text
                  style={{
                    color: colors.foreground,
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  {t("cancel") || "Cancel"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  padding: 14,
                  borderRadius: 10,
                }}
                onPress={() => {
                  // Save coordinates and re-open location modal
                  if (mapPickerCoords) {
                    setLatitude(mapPickerCoords.latitude.toFixed(6));
                    setLongitude(mapPickerCoords.longitude.toFixed(6));
                  }
                  setShowMapPicker(false);
                  setTimeout(() => {
                    setShowLocationModal(true);
                  }, 300);
                }}
              >
                <Text
                  style={{
                    color: "#FFF",
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: 15,
                  }}
                >
                  {t("confirm") || "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bomb Management Modal */}
      <Modal visible={showBombModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background, height: "90%" },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 20,
                paddingBottom: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: colors.foreground,
                }}
              >
                💣 {tr("treasureHuntManageBombs", "Manage Bombs")}
              </Text>
              <TouchableOpacity onPress={() => setShowBombModal(false)}>
                <X size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20 }}
            >
              <Text style={{ color: colors.textMuted, marginBottom: 16 }}>
                {locationForBombs?.name.fr || locationForBombs?.name["ar-tn"]}
              </Text>

              <View
                style={{
                  height: 350,
                  borderRadius: 20,
                  overflow: "hidden",
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: locationForBombs?.coordinates.latitude || 36.8065,
                    longitude:
                      locationForBombs?.coordinates.longitude || 10.1815,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  onPress={(e) => {
                    if (isAddingBomb) {
                      handleAddBombAtCoordinate(e.nativeEvent.coordinate);
                      setIsAddingBomb(false);
                    }
                  }}
                >
                  {/* Treasure Location Marker */}
                  {locationForBombs && (
                    <Marker
                      coordinate={locationForBombs.coordinates}
                      title="Treasure"
                    >
                      <View
                        style={{
                          padding: 8,
                          backgroundColor: "rgba(255, 51, 102, 0.2)",
                          borderRadius: 25,
                          borderWidth: 2,
                          borderColor: "#FF3366",
                        }}
                      >
                        <Trophy size={28} color="#FF3366" />
                      </View>
                    </Marker>
                  )}

                  {/* Bomb Markers */}
                  {bombsForLocation.map((bomb) => (
                    <Marker
                      key={bomb.id}
                      coordinate={{
                        latitude: bomb.latitude,
                        longitude: bomb.longitude,
                      }}
                      onPress={() => handleDeleteBomb(bomb.id)}
                    >
                      <View
                        style={{
                          padding: 6,
                          backgroundColor: "rgba(0, 0, 0, 0.6)",
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: "#FFF",
                        }}
                      >
                        <Bomb size={16} color="#FFF" />
                      </View>
                    </Marker>
                  ))}
                </MapView>

                <TouchableOpacity
                  onPress={() => setIsAddingBomb(!isAddingBomb)}
                  style={{
                    position: "absolute",
                    bottom: 15,
                    right: 15,
                    backgroundColor: isAddingBomb ? "#FF3B30" : colors.primary,
                    padding: 12,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Plus size={20} color="#FFF" />
                  <Text
                    style={{ color: "#FFF", fontWeight: "bold", marginLeft: 8 }}
                  >
                    {isAddingBomb
                      ? t("cancel")
                      : tr("treasureHuntAddBomb", "Add Bomb")}
                  </Text>
                </TouchableOpacity>

                {isAddingBomb && (
                  <View
                    style={{
                      position: "absolute",
                      top: 15,
                      left: 15,
                      right: 15,
                      backgroundColor: "rgba(255,149,0,0.95)",
                      padding: 12,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFF",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      {tr(
                        "treasureHuntTapToPlaceBomb",
                        "Tap on map to place a bomb",
                      )}
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={{
                  padding: 15,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    color: colors.foreground,
                    marginBottom: 12,
                    fontSize: 16,
                  }}
                >
                  ⚡ {tr("treasureHuntAutoGenerate", "Auto-Generate Bombs")}
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => handleGenerateRandomBombs(5)}
                    style={{
                      flex: 1,
                      backgroundColor: colors.primary,
                      padding: 12,
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                      +5
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleGenerateRandomBombs(10)}
                    style={{
                      flex: 1,
                      backgroundColor: colors.primary,
                      padding: 12,
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                      +10
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleGenerateRandomBombs(20)}
                    style={{
                      flex: 1,
                      backgroundColor: colors.primary,
                      padding: 12,
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                      +20
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 18,
                    fontWeight: "700",
                  }}
                >
                  {tr("treasureHuntBombList", "Current Bombs")} (
                  {bombsForLocation.length})
                </Text>
                {bombsForLocation.length > 0 && (
                  <TouchableOpacity
                    onPress={async () => {
                      for (const b of bombsForLocation)
                        await handleDeleteBomb(b.id);
                    }}
                  >
                    <Text style={{ color: "#FF3B30", fontWeight: "600" }}>
                      {tr("treasureHuntClearAll", "Clear All")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {bombsForLocation.length === 0 ? (
                <View
                  style={{
                    padding: 40,
                    alignItems: "center",
                    backgroundColor: colors.card,
                    borderRadius: 15,
                    borderStyle: "dashed",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Bomb size={40} color={colors.textMuted} opacity={0.3} />
                  <Text
                    style={{
                      color: colors.textMuted,
                      marginTop: 10,
                      fontWeight: "500",
                    }}
                  >
                    {tr("treasureHuntNoBombs", "No bombs placed.")}
                  </Text>
                </View>
              ) : (
                bombsForLocation.map((bomb, index) => (
                  <View
                    key={bomb.id}
                    style={{
                      flexDirection: "row",
                      padding: 15,
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      marginBottom: 10,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.background,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "bold",
                          color: colors.primary,
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ color: colors.foreground, fontWeight: "600" }}
                      >
                        {bomb.latitude.toFixed(6)}, {bomb.longitude.toFixed(6)}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                        {tr("treasureHuntStaticBomb", "Static Mine")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteBomb(bomb.id)}
                      style={{ padding: 8 }}
                    >
                      <Trash2 size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Key Management Modal */}
      <Modal visible={showKeyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background, height: "90%" },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 20,
                paddingBottom: 5,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Key size={22} color={colors.primary} style={{ marginRight: 10 }} />
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "900",
                    color: colors.foreground,
                    letterSpacing: 0.5
                  }}
                >
                  {tr("treasureHuntManageKeys", "MANAGE KEYS")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowKeyModal(false)}
                style={{
                  backgroundColor: colors.card,
                  padding: 8,
                  borderRadius: 20,
                }}
              >
                <X size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20 }}
            >
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>
                  {tr("treasureHuntCampaign", "CAMPAIGN")}
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: colors.foreground,
                    marginTop: 4
                  }}
                >
                  {selectedCampaign?.name.fr || selectedCampaign?.name["ar-tn"]}
                </Text>
              </View>

              <View
                style={{
                  height: 380,
                  borderRadius: 24,
                  overflow: "hidden",
                  marginBottom: 20,
                  borderWidth: 2,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                }}
              >
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: locationForKeys?.coordinates.latitude || 36.8065,
                    longitude:
                      locationForKeys?.coordinates.longitude || 10.1815,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  onPress={(e) => {
                    if (isAddingKey) {
                      handleAddKeyAtCoordinate(e.nativeEvent.coordinate);
                      setIsAddingKey(false);
                    }
                  }}
                >
                  {/* Current Treasure Markers for context */}
                  {locations.map((loc) => (
                    <Marker
                      key={loc.id}
                      coordinate={loc.coordinates}
                      opacity={0.6}
                    >
                      <View
                        style={{
                          padding: 6,
                          backgroundColor: loc.id === locationForKeys?.id ? colors.primary : colors.card,
                          borderRadius: 20,
                          borderWidth: 2,
                          borderColor: loc.id === locationForKeys?.id ? "#FFF" : colors.border,
                        }}
                      >
                        <Trophy size={16} color={loc.id === locationForKeys?.id ? "#FFF" : colors.textMuted} />
                      </View>
                    </Marker>
                  ))}

                  {/* Key Markers */}
                  {keysForCampaign.map((key) => (
                    <Marker
                      key={key.id}
                      coordinate={{
                        latitude: key.latitude,
                        longitude: key.longitude,
                      }}
                      onPress={() => handleDeleteKey(key.id)}
                    >
                      <View
                        style={{
                          padding: 8,
                          backgroundColor: "#10B981",
                          borderRadius: 22,
                          borderWidth: 2,
                          borderColor: "#FFF",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 3,
                          elevation: 4
                        }}
                      >
                        <Key size={18} color="#FFF" />
                      </View>
                    </Marker>
                  ))}
                </MapView>

                {/* Map Overlay for Adding Mode */}
                {isAddingKey && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 15,
                      left: 15,
                      right: 15,
                      backgroundColor: 'rgba(16, 185, 129, 0.95)',
                      padding: 12,
                      borderRadius: 12,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                      {tr("treasureHuntTapToPlaceKey", "Tap on the map to place a key")}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setIsAddingKey(!isAddingKey)}
                  style={{
                    position: "absolute",
                    bottom: 20,
                    right: 20,
                    backgroundColor: isAddingKey ? "#EF4444" : "#10B981",
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                    elevation: 8,
                  }}
                >
                  {isAddingKey ? (
                    <X size={26} color="#FFF" />
                  ) : (
                    <Plus size={28} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 30 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.foreground }}>
                    {tr("treasureHuntKeyList", "COLLECTIBLE KEYS")} ({keysForCampaign.length})
                  </Text>
                  {keysForCampaign.length > 0 && (
                    <TouchableOpacity onPress={() => {
                        Alert.alert(
                            tr("confirm", "Confirm"),
                            tr("treasureHuntClearAllKeysConfirm", "Are you sure you want to delete all keys?"),
                            [
                                { text: tr("cancel", "Cancel"), style: 'cancel' },
                                { 
                                    text: tr("delete", "Delete"), 
                                    style: 'destructive',
                                    onPress: async () => {
                                        for (const key of keysForCampaign) {
                                            await treasureHuntService.deleteKey(key.id);
                                        }
                                        setKeysForCampaign([]);
                                    }
                                }
                            ]
                        );
                    }}>
                        <Text style={{ color: '#EF4444', fontWeight: '700' }}>{tr("clearAll", "Clear All")}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {keysForCampaign.length === 0 ? (
                  <View style={{
                      padding: 40,
                      alignItems: 'center',
                      backgroundColor: colors.card,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      borderStyle: 'dashed'
                  }}>
                    <Key size={48} color={colors.textMuted} opacity={0.4} />
                    <Text style={{ color: colors.textMuted, marginTop: 15, textAlign: 'center', fontWeight: '600' }}>
                      {tr("treasureHuntNoKeysDescription", "No keys have been added to this campaign yet. Tap the green + button to place keys on the map.")}
                    </Text>
                  </View>
                ) : (
                  keysForCampaign.map((key, index) => (
                    <View
                      key={key.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 15,
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        marginBottom: 10,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: "#10B981" + "15",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 15,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "800",
                            color: "#10B981",
                          }}
                        >
                          {index + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: colors.foreground,
                            fontWeight: "700",
                            fontSize: 15,
                          }}
                        >
                          {key.latitude.toFixed(6)}, {key.longitude.toFixed(6)}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                          {tr("treasureHuntKeyPoint", "Key Pickup Point")}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteKey(key.id)}
                        style={{
                            padding: 8,
                            backgroundColor: '#EF4444' + '10',
                            borderRadius: 10
                        }}
                      >
                        <Trash2 size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  campaignSelector: {
    padding: 16,
    borderBottomWidth: 1,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  campaignSelectorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  campaignSelectorText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
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
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  campaignCardHeader: {
    marginBottom: 12,
  },
  campaignCardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  campaignCardTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  campaignCardStats: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  statText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#666",
  },
  campaignCardRewards: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    padding: 10,
    borderRadius: 10,
  },
  rewardText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  campaignActions: {
    flexDirection: "row",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  locationsList: {
    padding: 16,
  },
  addLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addLocationButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  locationCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  locationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationOrderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationOrderText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  locationCardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  locationCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  locationStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  locationStatusText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  locationCardCoords: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#F5F5F5",
    padding: 8,
    borderRadius: 8,
  },
  cardCoordText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#666",
  },
  hintText: {
    fontSize: 13,
    marginBottom: 10,
    fontStyle: "italic",
    color: "#888",
  },
  noteText: {
    fontSize: 13,
    marginBottom: 10,
    fontWeight: "500",
  },
  locationCardRewards: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    backgroundColor: "#F5F5F5",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
    color: "#888",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    maxHeight: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: "row",
  },
  rewardTypeSelector: {
    flexDirection: "row",
    marginTop: 4,
  },
  rewardTypeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 14,
    marginTop: 12,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 8,
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  qrModalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  qrModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  qrCodeContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  qrCodeLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  qrCodeHint: {
    fontSize: 12,
    textAlign: "center",
  },
  qrCodeLocationName: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  qrCodeCampaignName: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
  },
  qrButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
    gap: 12,
  },
  printButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  printButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // New styles for UI enhancements
  trophyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  activeCampaignInfo: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  activeCampaignHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  activeCampaignTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  activeCampaignStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statBoxIcon: {
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: "700",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historySectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  historyCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyCardInfo: {
    flex: 1,
  },
  historyCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  historyCardDates: {
    fontSize: 12,
  },
  historyCardStats: {
    alignItems: "flex-end",
  },
  historyCardStat: {
    fontSize: 12,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  locationInputRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  mapSelectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  mapSelectButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  mapPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  mapPickerContent: {
    height: "75%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  mapContainer: {
    height: 250,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  mapPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  mapPickerInstructions: {
    marginBottom: 16,
  },
  mapPickerText: {
    fontSize: 14,
    textAlign: "center",
  },
  mapPickerCoords: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
  },
  pickerCoordText: {
    fontSize: 14,
    fontWeight: "600",
  },
  confirmLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmLocationText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  productSelectCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 10,
    minWidth: 120,
    alignItems: "center",
  },
  productSelectName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  productSelectPrice: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  // New styles for UI refactor
  scrollContent: {
    paddingBottom: 100,
  },
  headerRefresh: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    marginTop: 150,
    gap: 12,
  },
  statCard: {
    minWidth: 140,
  },
  historyBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  historyBadgeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  campaignSelectorWrapper: {
    marginBottom: 20,
  },
});
