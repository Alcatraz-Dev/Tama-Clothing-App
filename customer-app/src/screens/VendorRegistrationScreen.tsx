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
    Platform,
    Linking,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../api/firebase';
import { ChevronLeft, Upload, CheckCircle2, Building2, Store, Star, Zap, Shield, ArrowRight, Instagram, Facebook, Phone, Mail, MapPin, FileText, Download } from 'lucide-react-native';
import { Theme } from '../theme';
import { uploadToBunny } from '../utils/bunny';

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

    // Pick image for document
    const pickImage = async (type: 'license' | 'idFront' | 'idBack' | 'front') => {
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

            if (!result.canceled && result.assets && result.assets[0]) {
                if (type === 'license') setBusinessLicense(result.assets[0].uri);
                if (type === 'idFront') setIdCardFront(result.assets[0].uri);
                if (type === 'idBack') setIdCardBack(result.assets[0].uri);
                if (type === 'front') setStoreFront(result.assets[0].uri);
            }
        } catch (error: any) {
            console.log('Image picker error:', error);
            Alert.alert(t('error') || 'Error', error.message || 'Could not select image');
        }
    };

    // Upload image to cloud
    const uploadImage = async (uri: string): Promise<string> => {
        return uploadToBunny(uri);
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
                // KYC documents are mandatory - ID card front and back required
                return !!idCardFront && !!idCardBack;
            case 4:
                return contractAccepted && hasScrolledToEnd;
            default:
                return true;
        }
    };

    // Handle next step
    const handleNext = () => {
        if (!validateStep(step)) {
            if (step === 3 && (!idCardFront || !idCardBack)) {
                Alert.alert(
                    t('error') || 'Error',
                    t('idCardRequired') || 'ID card (front and back) is required for verification'
                );
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

            if (businessLicense) licenseUrl = await uploadImage(businessLicense);
            if (idCardFront) idCardFrontUrl = await uploadImage(idCardFront);
            if (idCardBack) idCardBackUrl = await uploadImage(idCardBack);
            if (storeFront) frontUrl = await uploadImage(storeFront);

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

    // Get the final category value (handles 'other' category)
    const getFinalCategory = () => {
        if (businessCategory === 'other' && customCategory) {
            return customCategory;
        }
        return businessCategory;
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

                        {/* KYC Identity Verification - Mandatory */}
                        <View style={[styles.kycSection, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: accent }]}>
                            <View style={styles.kycHeader}>
                                <Shield size={20} color={accent} />
                                <Text style={[styles.kycTitle, { color: colors.foreground }]}>
                                    {t('kycDocuments') || 'Identity Verification'}
                                </Text>
                            </View>
                            <Text style={[styles.kycDesc, { color: colors.textMuted }]}>
                                {t('kycDocumentsDesc') || 'Upload your ID card (front and back) for verification'}
                            </Text>
                            <Text style={[styles.kycRequired, { color: '#EF4444' }]}>
                                {t('idCardRequired') || 'ID card is required for verification'}
                            </Text>
                        </View>

                        {/* ID Card Front - Mandatory */}
                        <View style={styles.documentSection}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                                {t('idCardFront') || 'ID Card (Front)'} *
                            </Text>
                            <TouchableOpacity
                                style={[styles.uploadBox, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: idCardFront ? accent : colors.border }]}
                                onPress={() => pickImage('idFront')}
                            >
                                {idCardFront ? (
                                    <Image source={{ uri: idCardFront }} style={styles.uploadedImage} />
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <Upload size={32} color={colors.textMuted} />
                                        <Text style={[styles.uploadText, { color: colors.textMuted }]}>
                                            {t('uploadIdCardFront') || 'Upload front side of ID card'}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* ID Card Back - Mandatory */}
                        <View style={styles.documentSection}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                                {t('idCardBack') || 'ID Card (Back)'} *
                            </Text>
                            <TouchableOpacity
                                style={[styles.uploadBox, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: idCardBack ? accent : colors.border }]}
                                onPress={() => pickImage('idBack')}
                            >
                                {idCardBack ? (
                                    <Image source={{ uri: idCardBack }} style={styles.uploadedImage} />
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <Upload size={32} color={colors.textMuted} />
                                        <Text style={[styles.uploadText, { color: colors.textMuted }]}>
                                            {t('uploadIdCardBack') || 'Upload back side of ID card'}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
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
});
