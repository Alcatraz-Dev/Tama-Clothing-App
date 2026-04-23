import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
    StyleSheet,
    Animated,
    Platform,
    Linking,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { doc, updateDoc, serverTimestamp, collection, addDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../api/firebase';
import { ChevronLeft, Upload, CheckCircle2, XCircle, Clock, Building2, Store, Star, Zap, Shield, ArrowRight, ArrowDown, ArrowUp, Instagram, Facebook, Phone, Mail, MapPin, FileText, Download, RefreshCw, AlertTriangle, CreditCard } from 'lucide-react-native';
import { Theme } from '../theme';
import { uploadToSanity } from '../utils/sanity';

// Vendor Tier Types
export type VendorTier = 'starter' | 'basic' | 'professional' | 'premium' | 'enterprise' | 'ultimate';

// Account Type
export type AccountType = 'particulier' | 'venteOccasionnelle' | 'entreprise' | 'activiteCommerciale';

interface VendorTierInfo {
    id: VendorTier;
    name: string; // translation key
    description: string; // translation key
    price: number;
    features: string[]; // translation keys
    limits: {
        products: number | 'unlimited';
        ordersPerMonth: number | 'unlimited';
        storage: string;
    };
    benefits: string[]; // translation keys
    popular?: boolean;
    bestValue?: boolean;
}

// Feature comparison data structure
export interface PlanFeature {
    key: string; // translation key
    tiers: {
        [key in VendorTier]: boolean | string | number;
    };
}

export const VENDOR_TIERS: VendorTierInfo[] = [
    {
        id: 'starter',
        name: 'tierStarter',
        description: 'starterDesc',
        price: 0,
        features: [
            'featureProducts',
            'featureAnalyticsBasic',
            'featureSupportStandard',
            'featureSocialMedia',
        ],
        limits: {
            products: 50,
            ordersPerMonth: 100,
            storage: '1 GB',
        },
        benefits: [],
    },
    {
        id: 'basic',
        name: 'tierBasic',
        description: 'basicDesc',
        price: 19,
        features: [
            'featureProducts',
            'featureAnalyticsBasic',
            'featureSupportStandard',
            'featureSocialMedia',
            'featureStorage',
        ],
        limits: {
            products: 150,
            ordersPerMonth: 300,
            storage: '5 GB',
        },
        benefits: ['featureLowCommission'],
    },
    {
        id: 'professional',
        name: 'tierProfessional',
        description: 'professionalDesc',
        price: 49,
        popular: true,
        features: [
            'featureProductsUnlimited',
            'featureAnalyticsAdvanced',
            'featureSupportPriority',
            'featureSocialMedia',
            'featureLiveStreaming',
            'featureCustomBranding',
            'featureAPI',
        ],
        limits: {
            products: 'unlimited',
            ordersPerMonth: 1000,
            storage: '25 GB',
        },
        benefits: ['featureLowCommission', 'featureFeaturedListing'],
    },
    {
        id: 'premium',
        name: 'tierPremium',
        description: 'premiumDesc',
        price: 99,
        bestValue: true,
        features: [
            'featureProductsUnlimited',
            'featureAnalyticsRealtime',
            'featureSupportPriority',
            'featureSocialMedia',
            'featureLiveStreaming',
            'featureCustomBranding',
            'featureAPI',
            'featureAdsCredits',
        ],
        limits: {
            products: 'unlimited',
            ordersPerMonth: 5000,
            storage: '100 GB',
        },
        benefits: ['featureLowCommission', 'featureFeaturedListing', 'featurePriorityDelivery'],
    },
    {
        id: 'enterprise',
        name: 'tierEnterprise',
        description: 'enterpriseDesc',
        price: 149,
        features: [
            'featureProductsUnlimited',
            'featureAnalyticsRealtime',
            'featureSupportDedicated',
            'featureSocialMedia',
            'featureLiveStreaming',
            'featureCustomBranding',
            'featureAPI',
            'featureWhiteLabel',
            'featureIntegrations',
        ],
        limits: {
            products: 'unlimited',
            ordersPerMonth: 10000,
            storage: '500 GB',
        },
        benefits: ['featureLowCommission', 'featureFeaturedListing', 'featurePriorityDelivery', 'featureAccountManager'],
    },
    {
        id: 'ultimate',
        name: 'tierUltimate',
        description: 'ultimateDesc',
        price: 299,
        features: [
            'featureProductsUnlimited',
            'featureAnalyticsRealtime',
            'featureSupportDedicated',
            'featureSocialMedia',
            'featureLiveStreaming',
            'featureCustomBranding',
            'featureAPI',
            'featureWhiteLabel',
            'featureIntegrations',
            'featureBulkUpload',
            'featureMultiUser',
        ],
        limits: {
            products: 'unlimited',
            ordersPerMonth: 'unlimited',
            storage: 'Unlimited',
        },
        benefits: ['featureLowCommission', 'featureFeaturedListing', 'featurePriorityDelivery', 'featureAccountManager', 'featureBannerAds'],
    },
];

// Feature comparison matrix
export const PLAN_FEATURES: PlanFeature[] = [
    {
        key: 'featureProducts',
        tiers: {
            starter: 50,
            basic: 150,
            professional: 'unlimited',
            premium: 'unlimited',
            enterprise: 'unlimited',
            ultimate: 'unlimited',
        },
    },
    {
        key: 'featureOrders',
        tiers: {
            starter: 100,
            basic: 300,
            professional: 1000,
            premium: 5000,
            enterprise: 10000,
            ultimate: 'unlimited',
        },
    },
    {
        key: 'featureStorage',
        tiers: {
            starter: '1 GB',
            basic: '5 GB',
            professional: '25 GB',
            premium: '100 GB',
            enterprise: '500 GB',
            ultimate: 'Unlimited',
        },
    },
    {
        key: 'featureAnalytics',
        tiers: {
            starter: 'featureAnalyticsBasic',
            basic: 'featureAnalyticsBasic',
            professional: 'featureAnalyticsAdvanced',
            premium: 'featureAnalyticsRealtime',
            enterprise: 'featureAnalyticsRealtime',
            ultimate: 'featureAnalyticsRealtime',
        },
    },
    {
        key: 'featureSupport',
        tiers: {
            starter: 'featureSupportStandard',
            basic: 'featureSupportStandard',
            professional: 'featureSupportPriority',
            premium: 'featureSupportPriority',
            enterprise: 'featureSupportDedicated',
            ultimate: 'featureSupportDedicated',
        },
    },
    {
        key: 'featureSocialMedia',
        tiers: {
            starter: true,
            basic: true,
            professional: true,
            premium: true,
            enterprise: true,
            ultimate: true,
        },
    },
    {
        key: 'featureLiveStreaming',
        tiers: {
            starter: false,
            basic: false,
            professional: true,
            premium: true,
            enterprise: true,
            ultimate: true,
        },
    },
    {
        key: 'featureCustomBranding',
        tiers: {
            starter: false,
            basic: false,
            professional: true,
            premium: true,
            enterprise: true,
            ultimate: true,
        },
    },
    {
        key: 'featureAPI',
        tiers: {
            starter: false,
            basic: false,
            professional: true,
            premium: true,
            enterprise: true,
            ultimate: true,
        },
    },
    {
        key: 'featureWhiteLabel',
        tiers: {
            starter: false,
            basic: false,
            professional: false,
            premium: false,
            enterprise: true,
            ultimate: true,
        },
    },
    {
        key: 'featureIntegrations',
        tiers: {
            starter: false,
            basic: false,
            professional: false,
            premium: false,
            enterprise: true,
            ultimate: true,
        },
    },
    {
        key: 'featureBulkUpload',
        tiers: {
            starter: false,
            basic: false,
            professional: false,
            premium: false,
            enterprise: false,
            ultimate: true,
        },
    },
    {
        key: 'featureMultiUser',
        tiers: {
            starter: false,
            basic: false,
            professional: false,
            premium: false,
            enterprise: false,
            ultimate: true,
        },
    },
    {
        key: 'featureLowCommission',
        tiers: {
            starter: false,
            basic: '10%',
            professional: '8%',
            premium: '5%',
            enterprise: '3%',
            ultimate: '0%',
        },
    },
    {
        key: 'featureAccountManager',
        tiers: {
            starter: false,
            basic: false,
            professional: false,
            premium: false,
            enterprise: true,
            ultimate: true,
        },
    },
];

interface VendorRegistrationScreenProps {
    onBack: () => void;
    user: any;
    profileData: any;
    updateProfile: any;
    theme: 'light' | 'dark';
    t: (key: string) => string;
    language: string;
}

// French Contract Text - 13 Articles - BEY3A
const CONTRACT_ARTICLES = `
<h1 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px;">
CONTRAT DE PARTENARIAT - VENDEUR BEY3A
</h1>

<p style="text-align: center; font-size: 14px; margin-bottom: 20px;">
<strong>BEY3A</strong><br>
Plateforme de vente en ligne<br>
Tunisie
</p>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 15px;">PRÉAMBULE</h2>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
Le présent contrat de partenariat (ci-après « le Contrat ») définit les conditions de collaboration entre :
</p>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
<strong>BEY3A</strong>, plateforme de vente en ligne opérant sur le territoire tunisien, représentée par son gérant (ci-après « la Plateforme »),
</p>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
D'UNE PART,
</p>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
ET
</p>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
<strong>LE VENDEUR</strong>, tel que décrit dans le formulaire d'inscription (ci-après « le Vendeur »),
</p>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
D'AUTRE PART.
</p>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 15px;">ARTICLE 1 : OBJET DU CONTRAT</h2>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
Le présent Contrat a pour objet de définir les conditions dans lesquelles le Vendeur propose et vend ses produits/services sur la plateforme BEY3A. La Plateforme agit en qualité d'intermédiaire de vente et de paiement pour le compte du Vendeur.
</p>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 15px;">ARTICLE 2 : INSCRIPTION ET OBLIGATIONS DU VENDEUR</h2>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
2.1. Le Vendeur doit compléter le formulaire d'inscription et fournir les documents requis (pièce d'identité, justificatif de domicile, extrait de registre de commerce ou carte d'artisan).{'
'}
2.2. Le Vendeur s'engage à proposer des produits/services conformes aux descriptions fournies et conformes aux normes tunisiennes en vigueur.{'
'}
2.3. Le Vendeur doit maintenir un stock suffisant et informer immédiatement la Plateforme de toute rupture de stock.{'
'}
2.4. Le Vendeur s'engage à respecter les délais de livraison convenus.
</p>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 15px;">ARTICLE 3 : COMMISSIONS ET TARIFS</h2>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
3.1. BEY3A perçoit une commission sur chaque vente réussie. Le taux de commission actuel est de <strong>15% TTC</strong> sur le montant total de la commande.{'
'}
3.2. Des frais de service supplémentaires peuvent s'appliquer selon le type de produits/services.{'
'}
3.3. Les frais de livraison sont à la charge de l'acheteur, sauf stipulation contraire.
</p>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 15px;">ARTICLE 4 : PAIEMENTS</h2>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
4.1. Les paiements sont effectués par virement bancaire sur le compte fourni par le Vendeur.{'
'}
4.2. Les versements sont effectués mensuellement, dans un délai de 30 jours suivant la fin de chaque mois civil.{'
'}
4.3. Compte bancaire : « à remplir par le Vendeur »{'
'}
4.4. Le montant minimum de paiement est de 50 DT. Les montants inférieurs seront reportés au mois suivant.
</p>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 15px;">ARTICLE 5 : CRÉATION DES ANNONCES</h2>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
5.1. Chaque produit doit faire l'objet d'une annonce complète (photos, description, prix, tailles, conditions de livraison).{'
'}
5.2. BEY3A se réserve le droit de refuser ou de supprimer toute annonce non conforme aux règles de publication.{'
'}
5.3. Le Vendeur est responsable du contenu de ses annonces.
</p>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 15px;">ARTICLE 6 : RESPONSABILITÉ</h2>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
6.1. Le Vendeur est seul responsable de la conformité de ses produits aux normes légales.{'
'}
6.2. BEY3A ne peut être tenue responsable des vices cachés ou défauts de conformité des produits.{'
'}
6.3. Le Vendeur garantit BEY3A contre toute réclamation liée à ses produits.
</p>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 15px;">ARTICLE 7 : PROPRIÉTÉ INTELLECTUELLE</h2>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
Le Vendeur garantit être propriétaire des droits de propriété intellectuelle relatifs aux produits et images fournis. Il autorise BEY3A à utiliser ces éléments à des fins de promotion.
</p>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 15px;">ARTICLE 8 : DURÉE ET RENOUVELLEMENT</h2>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
8.1. Le présent Contrat est conclu pour une durée de <strong>1 (un) an</strong> à compter de la date de signature.{'
'}
8.2. Il est tacitement renouvelé pour des périodes successives d'un an, sauf notification contraire 30 jours avant l'échéance.
</p>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 15px;">ARTICLE 9 : RÉSILIATION</h2>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
9.1. Chaque partie peut résilier le Contrat en cas de manquement grave, après mise en demeure de 15 jours sans effet.{'
'}
9.2. BEY3A peut résilier immédiatement en cas de comportement frauduleux ou de violation des lois applicables.
</p>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 15px;">ARTICLE 10 : CONFIDENTIALITÉ</h2>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
Les parties s'engagent à respecter la confidentialité des informations échangées.
</p>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 15px;">ARTICLE 11 : DROIT APPLICABLE</h2>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
11.1. Le présent Contrat est régi par le droit tunisien.{'
'}
11.2. Tout litige sera de la compétence exclusive des tribunaux de Tunis.
</p>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 15px;">ARTICLE 12 : MODIFICATIONS</h2>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
BEY3A se réserve le droit de modifier les présentes conditions. Les modifications seront notifiées et applicables 30 jours après notification.
</p>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 15px;">ARTICLE 13 : ACCEPTATION</h2>
<p style="font-size: 11px; text-align: justify; line-height: 1.6;">
Le Vendeur reconnaît avoir lu, compris et accepté sans réserve l'ensemble des dispositions du présent Contrat de partenariat.
</p>

<div style="margin-top: 30px; page-break-inside: avoid;">
<h2 style="font-size: 14px; font-weight: bold; margin-top: 20px;">INFORMATIONS BANCAIRES (à compléter)</h2>

<table style="width: 100%; margin-top: 10px; border-collapse: collapse;">
<tr>
<td style="padding: 8px; border: 1px solid #ccc;">
<p style="font-size: 11px;"><strong>Nom de la banque :</strong> ........................................</p>
<p style="font-size: 11px;"><strong>Numéro de compte :</strong> ........................................</p>
<p style="font-size: 11px;"><strong>Code IBAN :</strong> ........................................</p>
</td>
</tr>
</table>

<h2 style="font-size: 14px; font-weight: bold; margin-top: 20px;">SIGNATURES</h2>

<table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
<tr>
<td style="width: 50%; padding: 10px; vertical-align: top;">
<p style="font-size: 11px; font-weight: bold;">Pour BEY3A</p>
<br/><br/>
<p style="font-size: 11px; border-top: 1px solid #000; padding-top: 5px;">Signature et tampon</p>
</td>
<td style="width: 50%; padding: 10px; vertical-align: top;">
<p style="font-size: 11px; font-weight: bold;">Pour le Vendeur</p>
<p style="font-size: 11px;">Dénomination : _________________</p>
<p style="font-size: 11px;">Adresse : _________________</p>
<p style="font-size: 11px;">CIN/RC : _________________</p>
<br/>
<p style="font-size: 11px; border-top: 1px solid #000; padding-top: 5px;">Signature</p>
</td>
</tr>
</table>
</div>
`;

// Company details for PDF - BEY3A
const COMPANY_DETAILS = {
    name: 'BEY3A',
    address: 'Tunisie',
    representative: 'Représentant BEY3A',
    role: 'Gérant'
};

export default function VendorRegistrationScreen({ 
    onBack, 
    user, 
    profileData, 
    updateProfile, 
    theme, 
    t, 
    language 
}: VendorRegistrationScreenProps) {
    const isDark = theme === 'dark';
    const colors = isDark ? Theme.dark.colors : Theme.light.colors;
    const accent = '#6C63FF'; // App's primary accent color
    const insets = useSafeAreaInsets();

    // Form steps: 1=Tier Selection, 2=Business Info, 3=Documents, 4=Contract, 5=Review
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [contractAccepted, setContractAccepted] = useState(false);
    const contractScrollViewRef = useRef<ScrollView>(null);
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

    // Selected tier
    const [selectedTier, setSelectedTier] = useState<VendorTier | null>(null);
    const [showComparison, setShowComparison] = useState(false);

    // Business Information
    const [businessName, setBusinessName] = useState('');
    const [businessEmail, setBusinessEmail] = useState(user?.email || '');
    const [businessPhone, setBusinessPhone] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [businessDescription, setBusinessDescription] = useState('');
    const [businessCategory, setBusinessCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [taxId, setTaxId] = useState('');

    // Account Type
    const [accountType, setAccountType] = useState<AccountType | null>(null);

    // Social Media
    const [instagram, setInstagram] = useState('');
    const [facebook, setFacebook] = useState('');
    const [whatsapp, setWhatsapp] = useState('');

    // Documents
    const [businessLicense, setBusinessLicense] = useState<string | null>(null);
    const [idCardFront, setIdCardFront] = useState<string | null>(null);
    const [idCardBack, setIdCardBack] = useState<string | null>(null);
    const [storeFront, setStoreFront] = useState<string | null>(null);

    // Payment Proof
    const [paymentProof, setPaymentProof] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'bank' | 'post' | null>(null);
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);
    const [paymentProofForApproval, setPaymentProofForApproval] = useState<string | null>(null);
    const [uploadingPaymentProof, setUploadingPaymentProof] = useState(false);
    const [isChangingPlan, setIsChangingPlan] = useState(false);

    // ── Vendor status check ────────────────────────────────────────────────────
    // If user already has a pending/approved/rejected vendor record, show status screen
    const existingVendorData = profileData?.vendorData;
    const existingStatus = existingVendorData?.status; // 'pending' | 'approved' | 'rejected'

    // ── Helper Functions ────────────────────────────────────────────────────────
    
    // Get the final category value (handles 'other' category)
    const getFinalCategory = () => {
        if (businessCategory === 'other' && customCategory) {
            return customCategory;
        }
        return businessCategory;
    };

    // Upload image to cloud
    const uploadImage = async (uri: string): Promise<string> => {
        return uploadToSanity(uri);
    };

    // Pick image for document
    const pickImage = async (type: 'license' | 'idFront' | 'idBack' | 'front' | 'payment') => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert(t('permissionDenied') || 'Permission Required', t('mediaPermissionMessage') || 'Please allow access to your photo library.');
                return;
            }
            
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: (type === 'idFront' || type === 'idBack') ? [4, 3] : [16, 9],
                quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                if (type === 'license') setBusinessLicense(result.assets[0].uri);
                if (type === 'idFront') setIdCardFront(result.assets[0].uri);
                if (type === 'idBack') setIdCardBack(result.assets[0].uri);
                if (type === 'front') setStoreFront(result.assets[0].uri);
                if (type === 'payment') setPaymentProof(result.assets[0].uri);
            }
        } catch (error: any) {
            console.log('Image picker error:', error);
            Alert.alert(t('error') || 'Error', error.message || 'Could not select image');
        }
    };

    // Validate form
    const validateStep = (currentStep: number): boolean => {
        switch (currentStep) {
            case 1:
                return selectedTier !== null;
            case 2:
                const hasCategory = !!businessCategory;
                const hasCustomCategory = businessCategory === 'other' ? !!customCategory : true;
                return !!accountType && !!businessName && !!businessEmail && !!businessPhone && !!businessAddress && hasCategory && hasCustomCategory;
            case 3:
                // ID card no longer required as per user request
                return true;
            case 4:
                return contractAccepted && hasScrolledToEnd;
            default:
                return true;
        }
    };

    // Handle next step
    const handleNext = () => {
        if (!validateStep(step)) {
            if (step === 3) {
                // Simplified KYC info
            } else if (step === 2 && !accountType) {
                Alert.alert(
                    t('error') || 'Error',
                    t('accountType') || 'Please select your account type'
                );
            } else if (step === 4 && !hasScrolledToEnd) {
                Alert.alert(
                    t('error') || 'Erreur',
                    'Veuillez lire le contrat en entier avant de continuer.'
                );
            } else if (step === 4 && !contractAccepted) {
                Alert.alert(
                    t('error') || 'Erreur',
                    'Vous devez accepter les conditions du contrat pour continuer.'
                );
            } else {
                Alert.alert(t('error') || 'Error', t('vendorFillAllFields') || 'Please fill all required fields');
            }
            return;
        }
        setStep(step + 1);
    };

    // Handle previous step
    const handleBack = () => {
        if (step === 1) {
            onBack();
        } else {
            setStep(step - 1);
        }
    };

    // Submit registration
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const uid = user.uid;
            
            // Upload documents if provided
            let licenseUrl = null;
            let idCardFrontUrl = null;
            let idCardBackUrl = null;
            let frontUrl = null;
    
            if (businessLicense) licenseUrl = businessLicense.startsWith('http') ? businessLicense : await uploadImage(businessLicense);
            if (storeFront) frontUrl = storeFront.startsWith('http') ? storeFront : await uploadImage(storeFront);
    
            let paymentProofUrl = null;
            if (paymentProof) paymentProofUrl = paymentProof.startsWith('http') ? paymentProof : await uploadImage(paymentProof);
    
            // Find selected tier info to verify price
            const selectedInfo = VENDOR_TIERS.find(t => t.id === selectedTier);
    
            const vendorData = {
                userId: uid,
                tier: selectedTier,
                accountType,
                businessName,
                businessEmail,
                businessPhone,
                businessAddress,
                businessDescription,
                businessCategory: getFinalCategory(),
                customCategory: businessCategory === 'other' ? customCategory : null,
                taxId,
                socialMedia: {
                    instagram,
                    facebook,
                    whatsapp,
                },
                documents: {
                    businessLicense: licenseUrl,
                    idCardFront: idCardFrontUrl,
                    idCardBack: idCardBackUrl,
                    storeFront: frontUrl,
                },
                paymentProof: paymentProofUrl,
                paymentMethod: selectedInfo?.price && selectedInfo.price > 0 ? paymentMethod : null,
                contractAccepted: true,
                contractAcceptedAt: serverTimestamp(),
                status: 'pending', // pending, approved, rejected
                kycStatus: 'pending', // pending, verified, rejected
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
    
            // Save vendor application
            await addDoc(collection(db, 'vendorApplications'), vendorData);
    
            // Update user profile with vendor role
            await updateProfile({
                role: 'vendor',
                vendorData: {
                    businessName,
                    tier: selectedTier,
                    status: 'pending',
                }
            });

            // Send notification to user
            try {
                await addDoc(collection(db, "notifications"), {
                    userId: uid,
                    title: t("notifVendorAppliedTitle") || "Application Sent",
                    body: t("notifVendorAppliedBody") || "Your vendor registration is under review.",
                    read: false,
                    createdAt: serverTimestamp(),
                    type: "general"
                });
            } catch (err) {
                console.error("Vendor application notification error:", err);
            }

            Alert.alert(
                t('successTitle') || 'Success',
                t('vendorApplicationSubmitted') || 'Your vendor application has been submitted! We will review it within 2-3 business days.',
                [{ text: 'OK', onPress: onBack }]
            );
        } catch (error: any) {
            console.error('Vendor registration error:', error);
            // Show more helpful error message
            if (error.code === 'permission-denied' || error.message?.includes('permission')) {
                Alert.alert(
                    t('error') || 'Error', 
                    'Unable to submit application. Please contact support or try again later.'
                );
            } else {
                Alert.alert(t('error') || 'Error', error.message || 'Failed to submit application');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivatePlan = () => {

        Alert.alert(
            t('deactivatePlan') || 'Désactiver le plan',
            t('deactivatePlanConfirm') || 'Êtes-vous sûr de vouloir désactiver votre plan vendeur ?',
            [
                { text: t('cancel') || 'Annuler', style: 'cancel' },
                {
                    text: t('deactivate') || 'Désactiver',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateProfile({ vendorData: null, role: 'customer' });
                            Alert.alert(t('successTitle') || 'Succès', t('planDeactivated') || 'Votre plan a été désactivé.');
                            onBack();
                        } catch (e) {
                            Alert.alert(t('error') || 'Erreur', t('failedToSave') || 'Échec de la mise à jour.');
                        }
                    }
                }
            ]
        );
    };

    const handleChangePlan = async () => {
        setIsChangingPlan(true);
        setStep(1); // Start from the beginning
        
        // Try to fetch previous application to prefill the form
        if (user?.uid) {
            try {
                setLoading(true);
                const q = query(collection(db, 'vendorApplications'), where('userId', '==', user.uid), limit(1));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const appDoc = querySnapshot.docs[0].data();
                    if (appDoc.accountType) setAccountType(appDoc.accountType);
                    if (appDoc.businessName) setBusinessName(appDoc.businessName);
                    if (appDoc.businessEmail) setBusinessEmail(appDoc.businessEmail);
                    if (appDoc.businessPhone) setBusinessPhone(appDoc.businessPhone);
                    if (appDoc.businessAddress) setBusinessAddress(appDoc.businessAddress);
                    if (appDoc.taxId) setTaxId(appDoc.taxId);
                    if (appDoc.idCardFront) setIdCardFront(appDoc.idCardFront);
                    if (appDoc.idCardBack) setIdCardBack(appDoc.idCardBack);
                    if (appDoc.businessLicense) setBusinessLicense(appDoc.businessLicense);
                    if (appDoc.storeFront) setStoreFront(appDoc.storeFront);
                    if (appDoc.paymentMethod) setPaymentMethod(appDoc.paymentMethod);
                    if (appDoc.paymentProof) setPaymentProof(appDoc.paymentProof);
                    
                    if (appDoc.businessCategory) {
                        const predefinedCategories = ['retail', 'wholesale', 'manufacturing', 'services', 'clothing', 'fashion'];
                        if (predefinedCategories.includes(appDoc.businessCategory.toLowerCase())) {
                            setBusinessCategory(appDoc.businessCategory.toLowerCase() as any);
                        } else {
                            setBusinessCategory('other');
                            setCustomCategory(appDoc.businessCategory);
                        }
                    }
                }
            } catch (e) {
                console.error("Error fetching previous application data", e);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSubmitPaymentProof = async () => {
        if (!paymentProofForApproval) return;
        setUploadingPaymentProof(true);
        try {
            const proofUrl = await uploadImage(paymentProofForApproval);
            
            // Find application doc
            const q = query(collection(db, 'vendorApplications'), where('userId', '==', user?.uid), where('status', '==', 'approved'));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const appDoc = querySnapshot.docs[0];
                await updateDoc(doc(db, 'vendorApplications', appDoc.id), {
                    paymentProof: proofUrl,
                    updatedAt: serverTimestamp()
                });

                // Also update user vendorData to reflect that payment proof is uploaded
                await updateProfile({
                    vendorData: {
                        ...existingVendorData,
                        paymentProofUrl: proofUrl
                    }
                });

                Alert.alert(t('successTitle') || 'Succès', t('vendorPaymentSent') || 'Preuve de paiement envoyée avec succès.');
                setPaymentProofForApproval(null);
            } else {
                Alert.alert(t('error') || 'Erreur', t('adminVendorLoadError') || 'Impossible de trouver votre demande.');
            }
        } catch (e) {
            console.error(e);
            Alert.alert(t('error') || 'Erreur', t('failedToSave') || 'Échec de l\'envoi.');
        } finally {
            setUploadingPaymentProof(false);
        }
    };

    // ── Status screen for already-registered vendors ────────────────────────────
    if (!isChangingPlan && existingStatus === 'pending') {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <ChevronLeft size={24} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t('becomeVendor') || 'Vendeur'}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', padding: 32, paddingBottom: 60 }}>
                    <View style={[styles.statusIconCircle, { backgroundColor: isDark ? '#2A2520' : '#FFF8F0', borderColor: '#F59E0B' }]}>
                        <Clock size={48} color="#F59E0B" />
                    </View>
                    <Text style={[styles.statusTitle, { color: colors.foreground }]}>
                        {t('applicationPending') || 'Demande en cours d\'examen'}
                    </Text>
                    <Text style={[styles.statusDesc, { color: colors.textMuted }]}>
                        {t('applicationPendingDesc') || 'Votre demande est en cours de vérification. Nous vous contacterons sous 2-3 jours ouvrables.'}
                    </Text>

                    {/* Info card */}
                    <View style={[styles.statusCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: '#F59E0B30', width: '100%' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={[styles.statusCardLabel, { color: colors.textMuted }]}>{t('plan') || 'Plan'}</Text>
                            <Text style={[styles.statusCardValue, { color: accent }]}>{existingVendorData?.tier?.toUpperCase() || '—'}</Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.statusCardLabel, { color: colors.textMuted }]}>{t('businessName') || 'Entreprise'}</Text>
                            <Text style={[styles.statusCardValue, { color: colors.foreground }]}>{existingVendorData?.businessName || '—'}</Text>
                        </View>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7', marginTop: 8 }]}>
                        <Clock size={14} color="#D97706" />
                        <Text style={{ color: '#D97706', fontWeight: '700', marginLeft: 6, fontSize: 13 }}>{t('vendorPending') || 'En attente de confirmation'}</Text>
                    </View>

                    <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 }}>
                        {'⏱ Délai de réponse : 2 à 3 jours ouvrables\nVous recevrez une notification dès que votre demande sera traitée.'}
                    </Text>
                </ScrollView>
            </View>
        );
    }

    if (!isChangingPlan && (existingStatus === 'approved' || existingStatus === 'active')) {
        const currentTier = VENDOR_TIERS.find(t => t.id === existingVendorData?.tier);
        const isActive = existingStatus === 'active';
        const hasPaymentProofUploaded = !!existingVendorData?.paymentProofUrl;

        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <ChevronLeft size={24} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t('myVendorPlan') || 'Mon Plan Vendeur'}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
                    <View style={[styles.statusIconCircle, { backgroundColor: isDark ? '#0D2520' : '#F0FFF8', borderColor: isActive ? '#10B981' : '#3B82F6', alignSelf: 'center' }]}>
                        <CheckCircle2 size={48} color={isActive ? '#10B981' : '#3B82F6'} />
                    </View>
                    <Text style={[styles.statusTitle, { color: colors.foreground, textAlign: 'center' }]}>
                        {isActive
                            ? (t('vendorPlanActiveTitle') || 'Plan actif !')
                            : (t('applicationApproved') || 'Demande approuvée !')
                        }
                    </Text>
                    <Text style={[styles.statusDesc, { color: colors.textMuted, textAlign: 'center' }]}>
                        {isActive
                            ? (t('vendorPlanActiveDesc') || 'Votre plan vendeur est confirmé et actif.')
                            : (t('applicationApprovedDesc') || 'Félicitations ! Votre demande a été approuvée.')
                        }
                    </Text>

                    {currentTier && (
                        <View style={[styles.activePlanCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: accent }]}>
                            <View style={styles.activePlanHeader}>
                                <View>
                                    <Text style={[styles.activePlanLabel, { color: colors.textMuted }]}>{t('currentPlan') || 'Plan actuel'}</Text>
                                    <Text style={[styles.activePlanName, { color: colors.foreground }]}>{t(currentTier.name) || currentTier.name}</Text>
                                </View>
                                <View style={[styles.activePlanBadge, { backgroundColor: accent + '20' }]}>
                                    <Text style={[styles.activePlanBadgeText, { color: accent }]}>
                                        {currentTier.price === 0 ? t('free') || 'Gratuit' : `${currentTier.price} TND/${t('month') || 'mois'}`}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />
                            <View style={{ gap: 8 }}>
                                {currentTier.features.slice(0, 4).map((f, i) => (
                                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <CheckCircle2 size={14} color={accent} />
                                        <Text style={{ color: colors.foreground, fontSize: 13 }}>{t(f) || f}</Text>
                                    </View>
                                ))}
                            </View>
                            {isActive && (
                                <>
                                    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <TouchableOpacity
                                            style={[styles.planActionBtn, { borderColor: accent, backgroundColor: accent }]}
                                            onPress={handleChangePlan}
                                        >
                                            <RefreshCw size={16} color="#FFF" />
                                            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>{t('changePlan') || 'Changer'}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.planActionBtn, { borderColor: '#EF4444', backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}
                                            onPress={handleDeactivatePlan}
                                        >
                                            <XCircle size={16} color="#EF4444" />
                                            <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 13 }}>{t('deactivate') || 'Désactiver'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* ─── Payment Proof Section (only for approved, not yet active) ─── */}
                    {!isActive && currentTier && currentTier.price > 0 && (
                        <View style={[styles.paymentProofSection, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: '#3B82F640' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <CreditCard size={20} color="#3B82F6" />
                                <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 16 }}>
                                    {t('vendorPaymentProofTitle') || 'Preuve de paiement'}
                                </Text>
                            </View>
                            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 16, lineHeight: 19 }}>
                                {t('vendorPaymentProofDesc') || 'Veuillez télécharger la preuve de paiement de votre plan pour finaliser l\'activation.'}
                            </Text>

                            {hasPaymentProofUploaded ? (
                                <>
                                    {/* Already submitted — waiting for admin */}
                                    <View style={[styles.paymentProofWaiting, { backgroundColor: isDark ? '#1A1A10' : '#FFFBEB', borderColor: '#F59E0B40' }]}>
                                        <Clock size={20} color="#F59E0B" />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 14, marginBottom: 4 }}>
                                                {t('vendorPaymentSent') || 'Preuve envoyée'}
                                            </Text>
                                            <Text style={{ color: isDark ? '#FDE68A' : '#92400E', fontSize: 13, lineHeight: 19 }}>
                                                {t('vendorPaymentSentDesc') || 'Votre preuve de paiement a été envoyée. L\'administrateur va vérifier et activer votre plan.'}
                                            </Text>
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <>
                                    {/* Upload payment proof */}
                                    <TouchableOpacity
                                        style={[styles.uploadBox, {
                                            backgroundColor: isDark ? '#0D0D1A' : '#F5F5FF',
                                            borderColor: paymentProofForApproval ? '#10B981' : colors.border
                                        }]}
                                        onPress={async () => {
                                            try {
                                                const result = await ImagePicker.launchImageLibraryAsync({
                                                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                                    quality: 0.8,
                                                    allowsEditing: false,
                                                });
                                                if (!result.canceled && result.assets[0]) {
                                                    setPaymentProofForApproval(result.assets[0].uri);
                                                }
                                            } catch (e: any) {
                                                Alert.alert(t('error') || 'Error', e.message || 'Could not select image');
                                            }
                                        }}
                                    >
                                        {paymentProofForApproval ? (
                                            <View style={{ alignItems: 'center' }}>
                                                <Image source={{ uri: paymentProofForApproval }} style={{ width: 200, height: 200, borderRadius: 12 }} resizeMode="cover" />
                                                <Text style={{ color: '#10B981', fontSize: 13, marginTop: 8, fontWeight: '600' }}>
                                                    {t('vendorChangeImage') || 'Appuyez pour changer'}
                                                </Text>
                                            </View>
                                        ) : (
                                            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                                                <Upload size={32} color={colors.textMuted} />
                                                <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 8 }}>
                                                    {t('vendorUploadPaymentProof') || 'Télécharger la preuve de paiement'}
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    {/* Submit Button */}
                                    <TouchableOpacity
                                        style={[styles.submitPaymentBtn, {
                                            backgroundColor: paymentProofForApproval ? '#10B981' : colors.border,
                                            opacity: paymentProofForApproval && !uploadingPaymentProof ? 1 : 0.5,
                                        }]}
                                        disabled={!paymentProofForApproval || uploadingPaymentProof}
                                        onPress={handleSubmitPaymentProof}
                                    >
                                        {uploadingPaymentProof ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <ArrowRight size={20} color="#FFF" />
                                        )}
                                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16, marginLeft: 8 }}>
                                            {t('vendorSendPaymentProof') || 'Envoyer la preuve de paiement'}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    )}

                    {/* Free plan approved — already active info */}
                    {!isActive && currentTier && currentTier.price === 0 && (
                        <View style={[styles.paymentProofSection, { backgroundColor: isDark ? '#0A1A0A' : '#F0FFF4', borderColor: '#10B98140' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <CheckCircle2 size={20} color="#10B981" />
                                <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 15 }}>
                                    {t('vendorFreePlanActive') || 'Plan gratuit actif !'}
                                </Text>
                            </View>
                            <Text style={{ color: isDark ? '#A7F3D0' : '#166534', fontSize: 13, marginTop: 8, lineHeight: 19 }}>
                                {t('vendorFreePlanActiveDesc') || 'Votre plan gratuit est déjà activé. Vous pouvez commencer à ajouter vos produits.'}
                            </Text>
                        </View>
                    )}

                    <View style={[styles.statusCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: colors.border, marginTop: 16 }]}>
                        <Text style={[styles.statusCardLabel, { color: colors.textMuted }]}>{t('businessName') || 'Entreprise'}</Text>
                        <Text style={[styles.statusCardValue, { color: colors.foreground }]}>{existingVendorData?.businessName || '—'}</Text>
                    </View>
                </ScrollView>
            </View>
        );
    }

    if (!isChangingPlan && existingStatus === 'rejected') {
        const rejectionReason = existingVendorData?.rejectionReason;
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <ChevronLeft size={24} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t('becomeVendor') || 'Vendeur'}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 28, paddingBottom: 60 }}>
                    <View style={[styles.statusIconCircle, { backgroundColor: isDark ? '#201515' : '#FFF5F5', borderColor: '#EF4444', marginTop: 20 }]}>
                        <XCircle size={48} color="#EF4444" />
                    </View>
                    <Text style={[styles.statusTitle, { color: colors.foreground }]}>{t('applicationRejected') || 'Demande refusée'}</Text>
                    <Text style={[styles.statusDesc, { color: colors.textMuted }]}>
                        {t('applicationRejectedDesc') || "Votre demande n'a pas pu être acceptée."}
                    </Text>

                    {/* Rejection reason card */}
                    {rejectionReason ? (
                        <View style={[
                            styles.rejectionReasonCard,
                            { backgroundColor: isDark ? '#1A0808' : '#FFF5F5', borderColor: '#EF444440' }
                        ]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <AlertTriangle size={18} color="#EF4444" />
                                <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 14 }}>
                                    {t('rejectionReason') || 'Raison du refus'}
                                </Text>
                            </View>
                            <Text style={{ color: isDark ? '#FCA5A5' : '#7F1D1D', fontSize: 14, lineHeight: 22 }}>
                                {rejectionReason}
                            </Text>
                        </View>
                    ) : (
                        <View style={[styles.rejectionReasonCard, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5', borderColor: colors.border }]}>
                            <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', fontStyle: 'italic' }}>
                                {t('contactSupport') || 'Veuillez contacter notre équipe pour plus d\'informations.'}
                            </Text>
                        </View>
                    )}

                    <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 19 }}>
                        {t('reapplyHint') || 'Corrigez les problèmes mentionnés ci-dessus et soumettez une nouvelle demande.'}
                    </Text>

                    <TouchableOpacity
                        style={[styles.reapplyBtn, { backgroundColor: accent }]}
                        onPress={async () => {
                            await updateProfile({ vendorData: null });
                        }}
                    >
                        <RefreshCw size={18} color="#FFF" />
                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15, marginLeft: 8 }}>{t('reapply') || 'Nouvelle demande'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }


    // Generate and download PDF contract
    const generateContractPDF = async () => {
        try {
            const vendorInfo = `
                <p style="font-size: 12px;"><strong>Dénomination/Raison sociale :</strong> ${businessName || '_________________'}</p>
                <p style="font-size: 12px;"><strong>Adresse :</strong> ${businessAddress || '_________________'}</p>
                <p style="font-size: 12px;"><strong>CIN/Registre de Commerce :</strong> ${taxId || '_________________'}</p>
                <p style="font-size: 12px;"><strong>Téléphone :</strong> ${businessPhone || '_________________'}</p>
                <p style="font-size: 12px;"><strong>Email :</strong> ${businessEmail || '_________________'}</p>
            `;
            
            const fullContractHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Contrat de Partenariat - BEY3A</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; line-height: 1.6; }
                        @media print { body { padding: 0; } }
                    </style>
                </head>
                <body>
                    ${CONTRACT_ARTICLES.replace('Le Vendeur doit compléter le formulaire d\'inscription', `<strong>Informations du Vendeur :</strong><br/>${vendorInfo}<br/><br/>Le Vendeur doit compléter le formulaire d'inscription`)}
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({
                html: fullContractHTML,
                base64: false,
            });

            // Share the PDF
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Contrat de Partenariat - BEY3A',
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert(
                    t('success') || 'Succès',
                    'Le contrat a été généré. Vous pouvez le trouver dans vos fichiers.'
                );
            }
        } catch (error: any) {
            console.error('PDF generation error:', error);
            Alert.alert(
                t('error') || 'Erreur',
                'Impossible de générer le PDF. Veuillez réessayer.'
            );
        }
    };

    // Get category translations
    const getCategoryLabel = (category: string) => {
        const categories: Record<string, string> = {
            fashion: t('fashion') || 'Fashion',
            electronics: t('electronics') || 'Electronics',
            food: t('food') || 'Food & Beverages',
            services: t('services') || 'Services',
            handmade: t('handmade') || 'Handmade',
            beauty: t('beauty') || 'Beauty & Cosmetics',
            sports: t('sports') || 'Sports & Outdoors',
            home_living: t('home_living') || 'Home & Living',
            toys: t('toys') || 'Toys & Games',
            books: t('books') || 'Books & Media',
            automotive: t('automotive') || 'Automotive',
            health: t('health') || 'Health & Wellness',
            jewelry: t('jewelry') || 'Jewelry & Watches',
            pet: t('pet') || 'Pet Supplies',
            garden: t('garden') || 'Garden & Outdoor',
            office: t('office') || 'Office & School',
            other: t('other') || 'Other',
        };
        return categories[category] || category;
    };


    const categories = [
        'fashion', 'electronics', 'food', 'services', 'handmade', 
        'beauty', 'sports', 'home_living', 'toys', 'books', 'automotive',
        'health', 'jewelry', 'pet', 'garden', 'office', 'other'
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <ChevronLeft size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                    {t('becomeVendor') || 'Become a Vendor'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Progress indicator */}
            <View style={styles.progressContainer}>
                {[1, 2, 3, 4, 5].map((s) => (
                    <View key={s} style={styles.progressStep}>
                        <View style={[
                            styles.progressDot,
                            { 
                                backgroundColor: s <= step ? accent : colors.border,
                            }
                        ]}>
                            {s < step && <CheckCircle2 size={14} color="#FFF" />}
                            {s === step && <Text style={styles.progressText}>{s}</Text>}
                        </View>
                        {s < 5 && (
                            <View style={[
                                styles.progressLine,
                                { backgroundColor: s < step ? accent : colors.border }
                            ]} />
                        )}
                    </View>
                ))}
            </View>

            <ScrollView 
                style={styles.content}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Step 1: Select Tier */}
                {step === 1 && (
                    <View>
                        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                            {t('selectPlan') || 'Select Your Plan'}
                        </Text>
                        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
                            {t('choosePlanDesc') || 'Choose the plan that best fits your business needs'}
                        </Text>

                        {/* Compare Plans Toggle */}
                        <TouchableOpacity 
                            style={[styles.compareButton, { borderColor: accent, marginBottom: 16 }]}
                            onPress={() => setShowComparison(!showComparison)}
                        >
                            <Text style={[styles.compareButtonText, { color: accent }]}>
                                {showComparison ? t('hideFeatures') || 'Hide Features' : t('comparePlans') || 'Compare Plans'}
                            </Text>
                        </TouchableOpacity>

                        {/* Feature Comparison Table */}
                        {showComparison && (
                            <View style={[styles.comparisonContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', marginBottom: 16 }]}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View>
                                        {/* Header Row */}
                                        <View style={styles.comparisonRow}>
                                            <View style={[styles.comparisonCell, styles.comparisonFeatureHeader, { width: 120 }]}>
                                                <Text style={[styles.comparisonHeaderText, { color: colors.textMuted }]}></Text>
                                            </View>
                                            {VENDOR_TIERS.map((tier) => (
                                                <View key={tier.id} style={[styles.comparisonCell, styles.comparisonTierHeader, { width: 100 }]}>
                                                    <Text style={[styles.comparisonHeaderText, { color: colors.foreground, fontWeight: 'bold' }]}>
                                                        {t(tier.name)}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                        {/* Feature Rows */}
                                        {PLAN_FEATURES.map((feature, idx) => (
                                            <View key={idx} style={[styles.comparisonRow, { backgroundColor: idx % 2 === 0 ? (isDark ? '#252525' : '#F5F5F5') : 'transparent' }]}>
                                                <View style={[styles.comparisonCell, styles.comparisonFeatureCell, { width: 120 }]}>
                                                    <Text style={[styles.comparisonFeatureText, { color: colors.textMuted }]}>
                                                        {t(feature.key)}
                                                    </Text>
                                                </View>
                                                {VENDOR_TIERS.map((tier) => {
                                                    const value = feature.tiers[tier.id];
                                                    return (
                                                        <View key={tier.id} style={[styles.comparisonCell, { width: 100 }]}>
                                                            {typeof value === 'boolean' ? (
                                                                value ? (
                                                                    <CheckCircle2 size={16} color={accent} />
                                                                ) : (
                                                                    <Text style={{ color: colors.textMuted }}>—</Text>
                                                                )
                                                            ) : (
                                                                <Text style={[styles.comparisonValueText, { color: colors.foreground }]}>
                                                                    {typeof value === 'string' ? t(value) : value}
                                                                </Text>
                                                            )}
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        )}

                        {VENDOR_TIERS.map((tier) => (
                            <TouchableOpacity
                                key={tier.id}
                                style={[
                                    styles.tierCard,
                                    { 
                                        backgroundColor: isDark ? '#1C1C1E' : '#FFF',
                                        borderColor: selectedTier === tier.id ? accent : colors.border,
                                    }
                                ]}
                                onPress={() => setSelectedTier(tier.id)}
                            >
                                {(tier.popular || tier.bestValue) && (
                                    <View style={[styles.popularBadge, { backgroundColor: tier.bestValue ? '#10B981' : accent }]}>
                                        <Text style={styles.popularText}>
                                            {tier.bestValue ? (t('bestValue') || 'BEST VALUE') : (t('popular') || 'POPULAR')}
                                        </Text>
                                    </View>
                                )}
                                
                                <View style={styles.tierHeader}>
                                    <View>
                                        <Text style={[styles.tierName, { color: colors.foreground }]}>
                                            {t(tier.name) || tier.name}
                                        </Text>
                                        <Text style={[styles.tierDesc, { color: colors.textMuted }]}>
                                            {t(tier.description) || ''}
                                        </Text>
                                    </View>
                                    {selectedTier === tier.id && (
                                        <CheckCircle2 size={24} color={accent} />
                                    )}
                                </View>

                                <View style={styles.tierPricing}>
                                    {tier.price === 0 ? (
                                        <Text style={[styles.tierPrice, { color: accent }]}>
                                            {t('free') || 'FREE'}
                                        </Text>
                                    ) : (
                                        <View style={styles.priceRow}>
                                            <Text style={[styles.tierPrice, { color: accent }]}>
                                                {tier.price} TND
                                            </Text>
                                            <Text style={[styles.tierPriceUnit, { color: colors.textMuted }]}>
                                                {t('perMonth') || '/month'}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Limits Display */}
                                <View style={styles.tierLimits}>
                                    <View style={styles.limitItem}>
                                        <Text style={[styles.limitLabel, { color: colors.textMuted }]}>
                                            {t('featureProducts')}:
                                        </Text>
                                        <Text style={[styles.limitValue, { color: colors.foreground }]}>
                                            {typeof tier.limits.products === 'number' ? tier.limits.products : t('featureProductsUnlimited')}
                                        </Text>
                                    </View>
                                    <View style={styles.limitItem}>
                                        <Text style={[styles.limitLabel, { color: colors.textMuted }]}>
                                            {t('featureOrders')}:
                                        </Text>
                                        <Text style={[styles.limitValue, { color: colors.foreground }]}>
                                            {typeof tier.limits.ordersPerMonth === 'number' ? tier.limits.ordersPerMonth : t('featureProductsUnlimited')}
                                        </Text>
                                    </View>
                                    <View style={styles.limitItem}>
                                        <Text style={[styles.limitLabel, { color: colors.textMuted }]}>
                                            {t('featureStorage')}:
                                        </Text>
                                        <Text style={[styles.limitValue, { color: colors.foreground }]}>
                                            {tier.limits.storage}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.tierFeatures}>
                                    {tier.features.map((feature, idx) => (
                                        <View key={idx} style={styles.featureRow}>
                                            <Zap size={14} color={accent} />
                                            <Text style={[styles.featureText, { color: colors.textMuted }]}>
                                                {t(feature)}
                                            </Text>
                                        </View>
                                    ))}
                                    {tier.benefits.map((benefit, idx) => (
                                        <View key={`benefit-${idx}`} style={styles.featureRow}>
                                            <Star size={14} color="#10B981" />
                                            <Text style={[styles.featureText, { color: '#10B981' }]}>
                                                {t(benefit)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Step 2: Business Information */}
                {step === 2 && (
                    <View>
                        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                            {t('businessInfo') || 'Business Information'}
                        </Text>
                        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
                            {t('businessInfoDesc') || 'Tell us about your business'}
                        </Text>

                        {/* Account Type Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                                {t('accountType') || 'Account Type'} *
                            </Text>
                            <Text style={[styles.inputSubLabel, { color: colors.textMuted }]}>
                                {t('accountTypeDesc') || 'Select your business type'}
                            </Text>
                            <View style={styles.accountTypeContainer}>
                                {(['particulier', 'venteOccasionnelle', 'entreprise', 'activiteCommerciale'] as AccountType[]).map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.accountTypeCard,
                                            { 
                                                backgroundColor: accountType === type ? accent : (isDark ? '#1C1C1E' : '#FFF'),
                                                borderColor: accountType === type ? accent : colors.border,
                                            }
                                        ]}
                                        onPress={() => setAccountType(type)}
                                    >
                                        <View style={styles.accountTypeContent}>
                                            {accountType === type && (
                                                <CheckCircle2 size={20} color="#FFF" />
                                            )}
                                            <Text style={[
                                                styles.accountTypeText,
                                                { color: accountType === type ? '#FFF' : colors.foreground }
                                            ]}>
                                                {t(type)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Business Name */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                                {t('businessName') || 'Business Name'} *
                            </Text>
                            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: colors.border }]}>
                                <Building2 size={18} color={colors.textMuted} />
                                <TextInput
                                    style={[styles.input, { color: colors.foreground }]}
                                    value={businessName}
                                    onChangeText={setBusinessName}
                                    placeholder={t('businessNamePlaceholder') || 'Enter your business name'}
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        </View>

                        {/* Category */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                                {t('vendorCategory') || 'Category'} *
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.categoryChip,
                                            { 
                                                backgroundColor: businessCategory === cat ? accent : (isDark ? '#1C1C1E' : '#FFF'),
                                                borderColor: businessCategory === cat ? accent : colors.border,
                                            }
                                        ]}
                                        onPress={() => setBusinessCategory(cat)}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            { color: businessCategory === cat ? '#FFF' : colors.foreground }
                                        ]}>
                                            {getCategoryLabel(cat)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Custom Category Input - Show when "other" is selected */}
                        {businessCategory === 'other' && (
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                                    {t('specifyCategory') || 'Specify your category'} *
                                </Text>
                                <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: colors.border }]}>
                                    <TextInput
                                        style={[styles.input, { color: colors.foreground }]}
                                        value={customCategory}
                                        onChangeText={setCustomCategory}
                                        placeholder={t('specifyCategoryPlaceholder') || 'e.g., Baby products, Music instruments...'}
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>
                            </View>
                        )}

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                                {t('vendorEmail') || 'Email'} *
                            </Text>
                            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: colors.border }]}>
                                <Mail size={18} color={colors.textMuted} />
                                <TextInput
                                    style={[styles.input, { color: colors.foreground }]}
                                    value={businessEmail}
                                    onChangeText={setBusinessEmail}
                                    placeholder={t('emailPlaceholder') || 'business@email.com'}
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Phone */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                                {t('vendorPhone') || 'Phone'} *
                            </Text>
                            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: colors.border }]}>
                                <Phone size={18} color={colors.textMuted} />
                                <TextInput
                                    style={[styles.input, { color: colors.foreground }]}
                                    value={businessPhone}
                                    onChangeText={setBusinessPhone}
                                    placeholder={t('vendorPhonePlaceholder') || '+216 XX XXX XXX'}
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        {/* Address */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                                {t('address') || 'Address'} *
                            </Text>
                            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: colors.border }]}>
                                <MapPin size={18} color={colors.textMuted} />
                                <TextInput
                                    style={[styles.input, { color: colors.foreground ,marginTop:18}]}
                                    value={businessAddress}
                                    onChangeText={setBusinessAddress}
                                    placeholder={t('addressPlaceholder') || 'Enter your business address'}
                                    placeholderTextColor={colors.textMuted}
                                    multiline
                                />
                            </View>
                        </View>

                        {/* Description */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                                {t('vendorDescription') || 'Description'}
                            </Text>
                            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: colors.border, minHeight: 100 }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.foreground, textAlignVertical: 'top' }]}
                                    value={businessDescription}
                                    onChangeText={setBusinessDescription}
                                    placeholder={t('vendorDescriptionPlaceholder') || 'Tell customers about your business...'}  
                                    placeholderTextColor={colors.textMuted}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </View>

                        {/* Social Media */}
                        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>
                            {t('vendorSocialMedia') || 'Social Media'} ({t('optional') || 'Optional'})
                        </Text>

                        <View style={styles.inputGroup}>
                            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: colors.border }]}>
                                <Instagram size={18} color="#E4405F" />
                                <TextInput
                                    style={[styles.input, { color: colors.foreground }]}
                                    value={instagram}
                                    onChangeText={setInstagram}
                                    placeholder="Instagram"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: colors.border }]}>
                                <Facebook size={18} color="#1877F2" />
                                <TextInput
                                    style={[styles.input, { color: colors.foreground }]}
                                    value={facebook}
                                    onChangeText={setFacebook}
                                    placeholder="Facebook"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: colors.border }]}>
                                <Phone size={18} color="#25D366" />
                                <TextInput
                                    style={[styles.input, { color: colors.foreground }]}
                                    value={whatsapp}
                                    onChangeText={setWhatsapp}
                                    placeholder="WhatsApp"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>
                    </View>
                )}

                {/* Step 3: Documents */}
                {step === 3 && (
                    <View>
                        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                            {t('documents') || 'Documents'}
                        </Text>
                        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
                            {t('documentsDesc') || 'Upload required documents for verification'}
                        </Text>

                        {/* Profile/Store Verification - Simplified */}
                        <View style={[styles.kycSection, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: accent }]}>
                            <View style={styles.kycHeader}>
                                <Shield size={20} color={accent} />
                                <Text style={[styles.kycTitle, { color: colors.foreground }]}>
                                    {t('storeVerification') || 'Store Verification'}
                                </Text>
                            </View>
                            <Text style={[styles.kycDesc, { color: colors.textMuted }]}>
                                {t('storeVerificationDesc') || 'Please upload photos of your store or business licenses if available.'}
                            </Text>
                        </View>

                        {/* Business License - Optional */}
                        <View style={styles.documentSection}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                                {t('businessLicense') || 'Business License'} ({t('optional') || 'Optional'})
                            </Text>
                            <TouchableOpacity
                                style={[styles.uploadBox, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: colors.border }]}
                                onPress={() => pickImage('license')}
                            >
                                {businessLicense ? (
                                    <Image source={{ uri: businessLicense }} style={styles.uploadedImage} />
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <Upload size={32} color={colors.textMuted} />
                                        <Text style={[styles.uploadText, { color: colors.textMuted }]}>
                                            {t('vendorTapToUpload') || 'Tap to upload'}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Store Front - Optional */}
                        <View style={styles.documentSection}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                                {t('storeFront') || 'Store Front Photo'} ({t('optional') || 'Optional'})
                            </Text>
                            <TouchableOpacity
                                style={[styles.uploadBox, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: colors.border }]}
                                onPress={() => pickImage('front')}
                            >
                                {storeFront ? (
                                    <Image source={{ uri: storeFront }} style={styles.uploadedImage} />
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <Upload size={32} color={colors.textMuted} />
                                        <Text style={[styles.uploadText, { color: colors.textMuted }]}>
                                            {t('vendorTapToUpload') || 'Tap to upload'}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Payment Proof Section - IF PAID TIER */}
                        {(() => {
                            const selectedInfo = VENDOR_TIERS.find(t => t.id === selectedTier);
                            if (selectedInfo && selectedInfo.price > 0) {
                                return (
                                    <View style={styles.documentSection}>
                                        <Text style={[styles.inputLabel, { color: colors.foreground, fontSize: 18, marginTop: 16, marginBottom: 8 }]}>
                                            {t('paymentDetails') || 'Paiement du plan'}
                                        </Text>
                                        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
                                            {t('paymentAmount') || 'Montant à payer :'}{' '}
                                            <Text style={{ color: accent, fontWeight: '700' }}>{selectedInfo.price} TND / {t('month') || 'mois'}</Text>
                                        </Text>
                                        
                                        <Text style={[styles.inputLabel, { color: colors.foreground, marginTop: 12 }]}>
                                            {t('selectPaymentMethod') || 'Méthode de paiement'} *
                                        </Text>
                                        <View style={styles.paymentMethods}>
                                            <TouchableOpacity 
                                                style={[
                                                    styles.paymentMethodBtn, 
                                                    { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: paymentMethod === 'bank' ? accent : colors.border }
                                                ]}
                                                onPress={() => { setPaymentMethod('bank'); setShowPaymentDetails(false); }}
                                            >
                                                <Building2 size={24} color={paymentMethod === 'bank' ? accent : colors.textMuted} />
                                                <Text style={[styles.paymentMethodText, { color: paymentMethod === 'bank' ? accent : colors.foreground }]}>
                                                    {t('bankTransfer') || 'Virement bancaire'}
                                                </Text>
                                                {paymentMethod === 'bank' && <CheckCircle2 size={16} color={accent} />}
                                            </TouchableOpacity>

                                            <TouchableOpacity 
                                                style={[
                                                    styles.paymentMethodBtn, 
                                                    { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: paymentMethod === 'post' ? accent : colors.border }
                                                ]}
                                                onPress={() => { setPaymentMethod('post'); setShowPaymentDetails(false); }}
                                            >
                                                <Mail size={24} color={paymentMethod === 'post' ? accent : colors.textMuted} />
                                                <Text style={[styles.paymentMethodText, { color: paymentMethod === 'post' ? accent : colors.foreground }]}>
                                                    {t('postTransfer') || 'Mandat postal'}
                                                </Text>
                                                {paymentMethod === 'post' && <CheckCircle2 size={16} color={accent} />}
                                            </TouchableOpacity>
                                        </View>

                                        {/* Expandable payment details accordion */}
                                        {paymentMethod && (
                                            <View style={{ marginBottom: 16 }}>
                                                <TouchableOpacity
                                                    style={[styles.paymentDetailsToggle, { backgroundColor: isDark ? '#1C1C1E' : '#F8F8FB', borderColor: accent + '50' }]}
                                                    onPress={() => setShowPaymentDetails(!showPaymentDetails)}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        {paymentMethod === 'bank' ? <Building2 size={18} color={accent} /> : <Mail size={18} color={accent} />}
                                                        <Text style={{ color: accent, fontWeight: '700', fontSize: 14 }}>
                                                            {paymentMethod === 'bank' 
                                                                ? (t('viewBankDetails') || 'Voir les coordonnées bancaires') 
                                                                : (t('viewPostDetails') || 'Voir les coordonnées du mandat')
                                                            }
                                                        </Text>
                                                    </View>
                                                    {showPaymentDetails ? <ArrowUp size={18} color={accent} /> : <ArrowDown size={18} color={accent} />}
                                                </TouchableOpacity>

                                                {showPaymentDetails && (
                                                    <View style={[styles.paymentDetailsBox, { backgroundColor: isDark ? '#111118' : '#F0F0FF', borderColor: accent + '30' }]}>
                                                        {paymentMethod === 'bank' ? (
                                                            <>
                                                                <Text style={[styles.paymentDetailsTitle, { color: colors.foreground }]}>
                                                                    🏦 {t('bankTransferDetails') || 'Coordonnées bancaires'}
                                                                </Text>
                                                                <View style={styles.paymentDetailRow}>
                                                                    <Text style={[styles.paymentDetailLabel, { color: colors.textMuted }]}>Banque</Text>
                                                                    <Text style={[styles.paymentDetailValue, { color: colors.foreground }]}>Attijari Bank</Text>
                                                                </View>
                                                                <View style={styles.paymentDetailRow}>
                                                                    <Text style={[styles.paymentDetailLabel, { color: colors.textMuted }]}>Bénéficiaire</Text>
                                                                    <Text style={[styles.paymentDetailValue, { color: colors.foreground }]}>BEY3A SARL</Text>
                                                                </View>
                                                                <View style={styles.paymentDetailRow}>
                                                                    <Text style={[styles.paymentDetailLabel, { color: colors.textMuted }]}>RIB</Text>
                                                                    <Text style={[styles.paymentDetailValue, { color: accent, fontWeight: '700' }]}>12345 67890 00000 12345</Text>
                                                                </View>
                                                                <View style={styles.paymentDetailRow}>
                                                                    <Text style={[styles.paymentDetailLabel, { color: colors.textMuted }]}>Montant</Text>
                                                                    <Text style={[styles.paymentDetailValue, { color: '#10B981', fontWeight: '700' }]}>{selectedInfo.price} TND</Text>
                                                                </View>
                                                                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 10, fontStyle: 'italic' }}>
                                                                    {t('paymentRef') || 'Mentionnez votre nom et email en référence du virement.'}
                                                                </Text>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Text style={[styles.paymentDetailsTitle, { color: colors.foreground }]}>
                                                                    📮 {t('postTransferDetails') || 'Coordonnées du mandat postal'}
                                                                </Text>
                                                                <View style={styles.paymentDetailRow}>
                                                                    <Text style={[styles.paymentDetailLabel, { color: colors.textMuted }]}>Bénéficiaire</Text>
                                                                    <Text style={[styles.paymentDetailValue, { color: colors.foreground }]}>BEY3A SARL</Text>
                                                                </View>
                                                                <View style={styles.paymentDetailRow}>
                                                                    <Text style={[styles.paymentDetailLabel, { color: colors.textMuted }]}>Numéro de compte</Text>
                                                                    <Text style={[styles.paymentDetailValue, { color: accent, fontWeight: '700' }]}>1234-5678-90</Text>
                                                                </View>
                                                                <View style={styles.paymentDetailRow}>
                                                                    <Text style={[styles.paymentDetailLabel, { color: colors.textMuted }]}>Montant</Text>
                                                                    <Text style={[styles.paymentDetailValue, { color: '#10B981', fontWeight: '700' }]}>{selectedInfo.price} TND</Text>
                                                                </View>
                                                                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 10, fontStyle: 'italic' }}>
                                                                    {t('paymentRef') || 'Mentionnez votre nom et email en référence du mandat.'}
                                                                </Text>
                                                            </>
                                                        )}
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 8 }]}>
                                            {t('paymentProof') || 'Reçu / Preuve de paiement'} *
                                        </Text>
                                        <TouchableOpacity
                                            style={[styles.uploadBox, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: paymentProof ? accent : colors.border }]}
                                            onPress={() => pickImage('payment')}
                                        >
                                            {paymentProof ? (
                                                <View>
                                                    <Image source={{ uri: paymentProof }} style={styles.uploadedImage} />
                                                    <View style={styles.successOverlay}>
                                                        <CheckCircle2 color="#10B981" size={24} />
                                                    </View>
                                                </View>
                                            ) : (
                                                <View style={styles.uploadPlaceholder}>
                                                    <Upload size={32} color={colors.textMuted} />
                                                    <Text style={[styles.uploadText, { color: colors.textMuted }]}>
                                                        {t('vendorTapToUpload') || 'Appuyer pour télécharger'}
                                                    </Text>
                                                    <Text style={[styles.uploadHint, { color: colors.textMuted, marginTop: 4, fontSize: 12 }]}>
                                                        {t('uploadReceiptHint') || 'Téléchargez une photo de votre reçu de paiement'}
                                                    </Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                );
                            }
                            return null;
                        })()}

                    </View>
                )}

                {/* Step 4: Contract Agreement */}
                {step === 4 && (
                    <View>
                        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                            Contrat de Consignation
                        </Text>
                        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
                            Veuillez lire attentivement le contrat avant de continuer
                        </Text>

                        {/* PDF Download Button */}
                        <TouchableOpacity
                            style={[styles.downloadContractButton, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: accent }]}
                            onPress={generateContractPDF}
                        >
                            <FileText size={20} color={accent} />
                            <Text style={[styles.downloadContractText, { color: accent }]}>
                                Télécharger le contrat PDF
                            </Text>
                            <Download size={18} color={accent} />
                        </TouchableOpacity>

                        {/* Contract Scroll View */}
                        <View style={[styles.contractContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: colors.border }]}>
                            <ScrollView
                                ref={contractScrollViewRef}
                                style={styles.contractScrollView}
                                showsVerticalScrollIndicator={true}
                                onScroll={(event) => {
                                    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                                    const isAtEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
                                    if (isAtEnd && !hasScrolledToEnd) {
                                        setHasScrolledToEnd(true);
                                    }
                                }}
                                scrollEventThrottle={16}
                            >
                                <Text style={styles.contractTitle}>CONTRAT DE PARTENARIAT - VENDEUR BEY3A</Text>
                                <Text style={styles.contractCompany}>BEY3A</Text>
                                <Text style={styles.contractDetails}>Plateforme de vente en ligne - Tunisie</Text>
                                <Text style={styles.contractDetails}>Capital : 1 000 DT | RC : 1927947DAM000</Text>

                                <Text style={styles.articleTitle}>PRÉAMBULE</Text>
                                <Text style={styles.articleText}>
                                    Le présent contrat de partenariat (ci-après « le Contrat ») est conclu entre :
                                    BEY3A, plateforme de vente en ligne opérant sur le territoire tunisien, représentée par son gérant (ci-après « la Plateforme »), D'UNE PART, ET LE VENDEUR, tel que décrit dans le formulaire d'inscription (ci-après « le Vendeur »), D'AUTRE PART.
                                </Text>

                                <Text style={styles.articleTitle}>ARTICLE 1 : OBJET DU CONTRAT</Text>
                                <Text style={styles.articleText}>
                                    Le présent Contrat a pour objet de définir les conditions dans lesquelles le Vendeur propose et vend ses produits/services sur la plateforme BEY3A. La Plateforme agit en qualité d'intermédiaire de vente et de paiement pour le compte du Vendeur.
                                </Text>

                                <Text style={styles.articleTitle}>ARTICLE 2 : OBLIGATIONS DU VENDEUR</Text>
                                <Text style={styles.articleText}>
                                    2.1. Le Vendeur s'engage à deposer des produits conformes aux descriptions fournies, en bon état et conformes aux normes tunisiennes en vigueur.{'\n'}
                                    2.2. Le Vendeur doit fournir toutes les informations obligatoires relatives aux produits (composition, origine, prix, caractéristiques, etc.).{'\n'}
                                    2.3. Le Vendeur s'engage à maintenir un stock suffisant et à informer immédiatement BEY3A de toute rupture de stock.{'\n'}
                                    2.4. Le Vendeur doit respecter les délais de livraison convenus et assurer la qualité du service après-vente.
                                </Text>

                                <Text style={styles.articleTitle}>ARTICLE 3 : COMMISSIONS</Text>
                                <Text style={styles.articleText}>
                                    3.1. BEY3A perçoit une commission de 24% TTC (toutes taxes comprises) sur chaque vente réalisée par l'intermédiaire de la Plateforme.{'\n'}
                                    3.2. Cette commission est prelevee sur le prix de vente hors taxes et inclut toutes les taxes applicables (TVA 19%).{'\n'}
                                    3.3. Le Vendeur recoit donc 76% du prix de vente hors taxes pour chaque produit vendu.
                                </Text>

                                <Text style={styles.articleTitle}>ARTICLE 4 : MODALITÉS DE PAIEMENT</Text>
                                <Text style={styles.articleText}>
                                    4.1. Les paiements au Vendeur sont effectués mensuellement, dans un délai de 30 jours suivant la fin de chaque mois civil.{'\n'}
                                    4.2. Le paiement est effectué par virement bancaire sur le compte fourni par le Vendeur lors de son inscription.{'\n'}
                                    4.3. En cas de litige sur une commande, le paiement correspondant peut être suspendu jusqu'à résolution dudit litige.{'\n'}
                                    4.4. Le montant minimum de paiement est de 100 DT. Les montants inférieurs seront reportés au mois suivant.
                                </Text>

                                <Text style={styles.articleTitle}>ARTICLE 5 : CONDITIONS D'INSCRIPTION ET DE CRÉATION DES ANNONCES</Text>
                                <Text style={styles.articleText}>
                                    5.1. Le Vendeur doit compléter le formulaire d'inscription et fournir les documents requis.{'\n'}
                                    5.2. Chaque produit doit faire l'objet d'une annonce complète incluant photos, description, prix, tailles disponibles et conditions de livraison.{'\n'}
                                    5.3. BEY3A se réserve le droit de refuser ou de supprimer toute annonce non conforme à ses règles de publication.
                                </Text>

                                <Text style={styles.articleTitle}>ARTICLE 6 : RESPONSABILITÉ</Text>
                                <Text style={styles.articleText}>
                                    6.1. Le Vendeur est seul responsable de la conformité de ses produits aux normes légales et réglementaires en vigueur en Tunisie.{'\n'}
                                    6.2. BEY3A ne peut être tenue responsable des vices cachés, défauts de conformité ou autres problèmes relatifs aux produits vendus.{'\n'}
                                    6.3. Le Vendeur s'engage à garantir BEY3A contre toute réclamation, action ou dommage résultant de ses produits.
                                </Text>

                                <Text style={styles.articleTitle}>ARTICLE 7 : PROPRIÉTÉ INTELLECTUELLE</Text>
                                <Text style={styles.articleText}>
                                    Le Vendeur garantit être propriétaire des droits de propriété intellectuelle. Il autorise BEY3A à utiliser ces éléments.
                                </Text>

                                <Text style={styles.articleTitle}>ARTICLE 8 : DURÉE DU CONTRAT</Text>
                                <Text style={styles.articleText}>
                                    8.1. Le présent Contrat est conclu pour une durée de 10 (dix) ans à compter de la date de sa signature par les deux parties.{'\n'}
                                    8.2. Le Contrat est tacitement renouvelé pour des périodes successives de 10 ans, sauf notification contraire par l'une des parties, par lettre recommandée avec accusé de réception, au moins 3 (trois) mois avant l'expiration de la période en cours.
                                </Text>

                                <Text style={styles.articleTitle}>ARTICLE 9 : RÉSILIATION</Text>
                                <Text style={styles.articleText}>
                                    9.1. Chaque partie peut résilier le Contrat de plein droit en cas de manquement grave de l'autre partie à ses obligations, après mise en demeure restée sans effet pendant 30 jours.{'\n'}
                                    9.2. AZOOLO MARKETPLACE peut résilier immédiatement le Contrat en cas de comportement frauduleux, de violation des lois applicables ou de non-respect des règles de la Plateforme.
                                </Text>

                                <Text style={styles.articleTitle}>ARTICLE 10 : CONFIDENTIALITÉ</Text>
                                <Text style={styles.articleText}>
                                    Les parties s'engagent à respecter la confidentialité des informations échangées dans le cadre de l'exécution du présent Contrat.
                                </Text>

                                <Text style={styles.articleTitle}>ARTICLE 11 : DROIT APPLICABLE ET JURIDICTION</Text>
                                <Text style={styles.articleText}>
                                    11.1. Le présent Contrat est régi par le droit tunisien.{'\n'}
                                    11.2. Tout litige relatif à l'interprétation ou à l'exécution du présent Contrat sera de la compétence exclusive des tribunaux de Tunis (Tunisie).
                                </Text>

                                <Text style={styles.articleTitle}>ARTICLE 12 : DISPOSITIONS GÉNÉRALES</Text>
                                <Text style={styles.articleText}>
                                    12.1. Le fait pour l'une des parties de ne pas se prévaloir d'une disposition du Contrat ne vaut pas renonciation à cette disposition.{'\n'}
                                    12.2. Si une disposition du Contrat est déclarée nulle ou non exécutoire, les autres dispositions demeurent en vigueur.{'\n'}
                                    12.3. AZOOLO MARKETPLACE se réserve le droit de modifier les présentes conditions générales.
                                </Text>

                                <Text style={styles.articleTitle}>ARTICLE 13 : ACCEPTATION EXPRESSE</Text>
                                <Text style={styles.articleText}>
                                    Le Vendeur reconnaît avoir lu, compris et accepté sans réserve l'ensemble des dispositions du présent Contrat de dépôt-vente. Il reconnaît que l'acceptation du présent Contrat constitue un élément essentiel sans lequel BEY3A ne permettrait pas l'activation de son compte vendeur.
                                </Text>

                                {!hasScrolledToEnd && (
                                    <Text style={styles.scrollIndicator}>
                                        ▼ Veuillez faire défiler jusqu'en bas pour accepter ▼
                                    </Text>
                                )}
                            </ScrollView>
                        </View>

                        {/* Contract Acceptance Checkbox */}
                        <TouchableOpacity 
                            style={styles.contractAcceptanceContainer}
                            onPress={() => setContractAccepted(!contractAccepted)}
                            disabled={!hasScrolledToEnd}
                        >
                            <View style={[
                                styles.contractCheckbox, 
                                { borderColor: contractAccepted ? accent : (hasScrolledToEnd ? colors.border : colors.textMuted) }
                            ]}>
                                {contractAccepted && <CheckCircle2 size={18} color={accent} />}
                            </View>
                            <Text style={[
                                styles.contractAcceptanceText, 
                                { color: hasScrolledToEnd ? colors.foreground : colors.textMuted }
                            ]}>
                                Je reconnais avoir lu et accepté les 13 articles du présent Contrat de dépôt-vente et ses conditions générales
                            </Text>
                        </TouchableOpacity>

                        {!hasScrolledToEnd && (
                            <Text style={[styles.warningText, { color: '#FF6B6B' }]}>
                                * Vous devez lire le contrat en entier avant de pouvoir l'accepter
                            </Text>
                        )}
                    </View>
                )}

                {/* Step 5: Review */}
                {step === 5 && (
                    <View>
                        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                            {t('reviewSubmit') || 'Review & Submit'}
                        </Text>
                        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
                            {t('reviewDesc') || 'Review your application before submitting'}
                        </Text>

                        {/* Summary Card */}
                        <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: colors.border }]}>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                                    {t('plan') || 'Plan'}
                                </Text>
                                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                                    {selectedTier && VENDOR_TIERS.find(t => t.id === selectedTier)?.name}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                                    {t('businessName') || 'Business Name'}
                                </Text>
                                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                                    {businessName}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                                    {t('vendorEmail') || 'Email'}
                                </Text>
                                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                                    {businessEmail}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                                    {t('vendorPhone') || 'Phone'}
                                </Text>
                                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                                    {businessPhone}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                                    {t('vendorCategory') || 'Category'}
                                </Text>
                                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                                    {businessCategory && getCategoryLabel(businessCategory)}
                                </Text>
                            </View>
                        </View>

                        {/* Terms */}
                        <TouchableOpacity style={styles.termsContainer}>
                            <View style={[styles.checkbox, { borderColor: accent }]}>
                                <CheckCircle2 size={16} color={accent} />
                            </View>
                            <Text style={[styles.termsText, { color: colors.textMuted }]}>
                                {t('agreeTerms') || 'I agree to the'} <Text style={{ color: accent }}>{t('termsOfService') || 'Terms of Service'}</Text> {t('and') || 'and'} <Text style={{ color: accent }}>{t('privacyPolicy') || 'Privacy Policy'}</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 10, backgroundColor: colors.background, borderTopColor: colors.border }]}>
                {step > 1 && (
                    <TouchableOpacity
                        style={[styles.backButton, { borderColor: colors.border }]}
                        onPress={handleBack}
                    >
                        <Text style={[styles.backButtonText, { color: colors.foreground }]}>
                            {t('back') || 'Back'}
                        </Text>
                    </TouchableOpacity>
                )}
                {step < 5 ? (
                    <TouchableOpacity
                        style={[styles.nextButton, { backgroundColor: accent }]}
                        onPress={handleNext}
                    >
                        <Text style={styles.nextButtonText}>
                            {t('next') || 'Next'}
                        </Text>
                        <ArrowRight size={18} color="#FFF" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: accent }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>
                                    {t('submitApplication') || 'Submit Application'}
                                </Text>
                                <ArrowRight size={18} color="#FFF" />
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
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
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 40,
    },
    progressStep: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    progressLine: {
        width: 40,
        height: 2,
        marginHorizontal: 4,
    },
    content: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    tierCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        right: 16,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    popularText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
    tierHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    tierName: {
        fontSize: 20,
        fontWeight: '700',
    },
    tierPrice: {
        fontSize: 24,
        fontWeight: '800',
        marginTop: 4,
    },
    tierDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    tierPricing: {
        marginBottom: 12,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    tierPriceUnit: {
        fontSize: 14,
        marginLeft: 2,
    },
    tierLimits: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    limitItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    limitLabel: {
        fontSize: 11,
        marginRight: 4,
    },
    limitValue: {
        fontSize: 11,
        fontWeight: '600',
    },
    compareButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    compareButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    comparisonContainer: {
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
    },
    comparisonRow: {
        flexDirection: 'row',
    },
    comparisonCell: {
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    comparisonFeatureHeader: {
        justifyContent: 'flex-end',
    },
    comparisonTierHeader: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    comparisonFeatureCell: {
        justifyContent: 'flex-start',
    },
    comparisonHeaderText: {
        fontSize: 11,
        fontWeight: '600',
    },
    comparisonFeatureText: {
        fontSize: 10,
    },
    comparisonValueText: {
        fontSize: 11,
        fontWeight: '500',
    },
    tierFeatures: {
        gap: 8,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        fontSize: 13,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        gap: 10,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 15,
  
    },
    inputSubLabel: {
        fontSize: 12,
        marginBottom: 8,
    },
    accountTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    accountTypeCard: {
        flex: 1,
        minWidth: '45%',
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
    },
    accountTypeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    accountTypeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    categoryScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    documentSection: {
        marginBottom: 20,
    },
    uploadBox: {
        height: 150,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadText: {
        marginTop: 8,
        fontSize: 13,
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    // KYC Styles
    kycSection: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 2,
    },
    kycHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    kycTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    kycDesc: {
        fontSize: 13,
        marginBottom: 8,
    },
    paymentMethods: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        marginBottom: 16,
    },
    paymentMethodBtn: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        gap: 8,
    },
    paymentMethodText: {
        fontSize: 14,
        fontWeight: '600',
    },
    successOverlay: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FFF',
        borderRadius: 12,
    },
    uploadHint: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    kycRequired: {
        fontSize: 12,
        fontWeight: '600',
    },
    summaryCard: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128,128,128,0.1)',
    },
    summaryLabel: {
        fontSize: 13,
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: '600',
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 20,
        gap: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    termsText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
    },
    bottomActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 10,
        gap: 12,
        borderTopWidth: 1,
    },
    backButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    nextButton: {
        flex: 2,
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    nextButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    submitButton: {
        flex: 2,
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    // Contract Agreement Styles
    downloadContractButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 2,
        marginBottom: 16,
        gap: 8,
    },
    downloadContractText: {
        fontSize: 14,
        fontWeight: '600',
    },
    contractContainer: {
        borderRadius: 12,
        borderWidth: 1,
        maxHeight: 350,
        marginBottom: 16,
    },
    contractScrollView: {
        padding: 16,
    },
    contractTitle: {
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
        color: '#333',
    },
    contractCompany: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
        color: '#333',
    },
    contractDetails: {
        fontSize: 11,
        textAlign: 'center',
        marginBottom: 8,
        color: '#666',
    },
    articleTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 14,
        marginBottom: 6,
        color: '#333',
    },
    articleText: {
        fontSize: 11,
        lineHeight: 18,
        color: '#555',
        textAlign: 'justify',
    },
    scrollIndicator: {
        textAlign: 'center',
        fontSize: 12,
        color: '#6C63FF',
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    contractAcceptanceContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginTop: 8,
    },
    contractCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contractAcceptanceText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
    },
    warningText: {
        fontSize: 12,
        marginTop: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // Payment accordion styles
    paymentDetailsToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        marginBottom: 4,
    },
    paymentDetailsBox: {
        borderRadius: 10,
        borderWidth: 1,
        padding: 16,
        gap: 10,
    },
    paymentDetailsTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 8,
    },
    paymentDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(128,128,128,0.15)',
    },
    paymentDetailLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    paymentDetailValue: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Vendor status screen styles
    statusIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        alignSelf: 'center',
    },
    statusTitle: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
    },
    statusDesc: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    statusCard: {
        width: '100%',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        marginBottom: 20,
    },
    statusCardLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statusCardValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        marginTop: 8,
    },
    activePlanCard: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        marginBottom: 16,
    },
    activePlanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activePlanLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    activePlanName: {
        fontSize: 20,
        fontWeight: '800',
    },
    activePlanBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    activePlanBadgeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    planActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    reapplyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 8,
        width: '100%',
    },
    rejectionReasonCard: {
        width: '100%',
        borderWidth: 1.5,
        borderRadius: 14,
        padding: 16,
        marginTop: 4,
        marginBottom: 16,
    },
    paymentProofSection: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1.5,
        padding: 20,
        marginTop: 16,
    },
    paymentProofWaiting: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    submitPaymentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 16,
    },
});
