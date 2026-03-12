// Feature types for access control
export type FeatureName = 
    // Core features
    | 'products'
    | 'analytics'
    | 'support'
    | 'socialMedia'
    | 'liveStreaming'
    | 'customBranding'
    | 'api'
    | 'whiteLabel'
    | 'integrations'
    | 'bulkUpload'
    | 'multiUser'
    // Premium features
    | 'adsCredits'
    | 'featuredListing'
    | 'priorityDelivery'
    | 'accountManager'
    | 'bannerAds'
    // Limits
    | 'productsLimit'
    | 'ordersLimit'
    | 'storageLimit'
    | 'commissionRate'
    | 'marketing'
    | 'treasureHunt'
    | 'banners'
    | 'brandRevenue'
    | 'notifications';

export type VendorTier = 'starter' | 'basic' | 'professional' | 'premium' | 'enterprise' | 'ultimate';

// Account types
export type AccountType = 'particulier' | 'venteOccasionnelle' | 'entreprise' | 'activiteCommerciale';

// Permission levels
export type PermissionLevel = 'none' | 'view' | 'limited' | 'full';

// Max team members type
export type MaxTeamMembers = number | 'unlimited';

// Feature permissions for each tier
export interface TierPermissions {
    features: Record<FeatureName, boolean | number | string>;
    permissionLevel: PermissionLevel;
    maxTeamMembers: MaxTeamMembers;
}

// All plan tier permissions
export const TIER_PERMISSIONS: Record<VendorTier, TierPermissions> = {
    starter: {
        features: {
            products: true,
            analytics: true,
            support: true,
            socialMedia: true,
            liveStreaming: false,
            customBranding: false,
            api: false,
            whiteLabel: false,
            integrations: false,
            bulkUpload: false,
            multiUser: false,
            adsCredits: false,
            featuredListing: false,
            priorityDelivery: false,
            accountManager: false,
            bannerAds: false,
            productsLimit: 50,
            ordersLimit: 100,
            storageLimit: '1 GB',
            commissionRate: '15%',
            marketing: false,
            treasureHunt: false,
            banners: false,
            brandRevenue: true,
            notifications: false,
        },
        permissionLevel: 'limited',
        maxTeamMembers: 1,
    },
    basic: {
        features: {
            products: true,
            analytics: true,
            support: true,
            socialMedia: true,
            liveStreaming: false,
            customBranding: false,
            api: false,
            whiteLabel: false,
            integrations: false,
            bulkUpload: false,
            multiUser: false,
            adsCredits: false,
            featuredListing: false,
            priorityDelivery: false,
            accountManager: false,
            bannerAds: false,
            productsLimit: 150,
            ordersLimit: 300,
            storageLimit: '5 GB',
            commissionRate: '10%',
            marketing: true,
            treasureHunt: false,
            banners: false,
            brandRevenue: true,
            notifications: false,
        },
        permissionLevel: 'limited',
        maxTeamMembers: 1,
    },
    professional: {
        features: {
            products: true,
            analytics: true,
            support: true,
            socialMedia: true,
            liveStreaming: true,
            customBranding: true,
            api: true,
            whiteLabel: false,
            integrations: false,
            bulkUpload: false,
            multiUser: false,
            adsCredits: false,
            featuredListing: true,
            priorityDelivery: false,
            accountManager: false,
            bannerAds: false,
            productsLimit: 'unlimited',
            ordersLimit: 1000,
            storageLimit: '25 GB',
            commissionRate: '8%',
            marketing: true,
            treasureHunt: false,
            banners: true,
            brandRevenue: true,
            notifications: false,
        },
        permissionLevel: 'full',
        maxTeamMembers: 2,
    },
    premium: {
        features: {
            products: true,
            analytics: true,
            support: true,
            socialMedia: true,
            liveStreaming: true,
            customBranding: true,
            api: true,
            whiteLabel: false,
            integrations: false,
            bulkUpload: false,
            multiUser: false,
            adsCredits: true,
            featuredListing: true,
            priorityDelivery: true,
            accountManager: false,
            bannerAds: false,
            productsLimit: 'unlimited',
            ordersLimit: 5000,
            storageLimit: '100 GB',
            commissionRate: '5%',
            marketing: true,
            treasureHunt: true,
            banners: true,
            brandRevenue: true,
            notifications: true,
        },
        permissionLevel: 'full',
        maxTeamMembers: 3,
    },
    enterprise: {
        features: {
            products: true,
            analytics: true,
            support: true,
            socialMedia: true,
            liveStreaming: true,
            customBranding: true,
            api: true,
            whiteLabel: true,
            integrations: true,
            bulkUpload: false,
            multiUser: false,
            adsCredits: true,
            featuredListing: true,
            priorityDelivery: true,
            accountManager: true,
            bannerAds: false,
            productsLimit: 'unlimited',
            ordersLimit: 10000,
            storageLimit: '500 GB',
            commissionRate: '3%',
            marketing: true,
            treasureHunt: true,
            banners: true,
            brandRevenue: true,
            notifications: true,
        },
        permissionLevel: 'full',
        maxTeamMembers: 5,
    },
    ultimate: {
        features: {
            products: true,
            analytics: true,
            support: true,
            socialMedia: true,
            liveStreaming: true,
            customBranding: true,
            api: true,
            whiteLabel: true,
            integrations: true,
            bulkUpload: true,
            multiUser: true,
            adsCredits: true,
            featuredListing: true,
            priorityDelivery: true,
            accountManager: true,
            bannerAds: true,
            productsLimit: 'unlimited',
            ordersLimit: 'unlimited',
            storageLimit: 'Unlimited',
            commissionRate: '0%',
            marketing: true,
            treasureHunt: true,
            banners: true,
            brandRevenue: true,
            notifications: true,
        },
        permissionLevel: 'full',
        maxTeamMembers: 'unlimited',
    },
};

// Account type modifiers (some features may be restricted based on account type)
export const ACCOUNT_TYPE_MODIFIERS: Record<AccountType, Partial<Record<FeatureName, boolean | number | string>>> = {
    particulier: {
        // Individual sellers have fewer features
        api: false,
        whiteLabel: false,
        integrations: false,
        bulkUpload: false,
        multiUser: false,
    },
    venteOccasionnelle: {
        // Occasional sellers have limited features
        api: false,
        whiteLabel: false,
        multiUser: false,
    },
    entreprise: {
        // Companies get full features
    },
    activiteCommerciale: {
        // Commercial activity gets full features
    },
};

// Check if a feature is available for a given tier and account type
export function hasFeature(tier: VendorTier, feature: FeatureName, accountType?: AccountType): boolean {
    const tierPerms = TIER_PERMISSIONS[tier];
    let hasAccess = !!tierPerms.features[feature];
    
    // Apply account type modifiers
    if (accountType && typeof tierPerms.features[feature] === 'boolean' && tierPerms.features[feature]) {
        const modifier = ACCOUNT_TYPE_MODIFIERS[accountType];
        if (modifier[feature] !== undefined) {
            hasAccess = !!modifier[feature];
        }
    }
    
    return hasAccess;
}

// Get feature value (for limits, commission rates, etc.)
export function getFeatureValue(tier: VendorTier, feature: FeatureName, accountType?: AccountType): boolean | number | string {
    const tierPerms = TIER_PERMISSIONS[tier];
    let value = tierPerms.features[feature];
    
    // Apply account type modifiers
    if (accountType) {
        const modifier = ACCOUNT_TYPE_MODIFIERS[accountType];
        if (modifier[feature] !== undefined) {
            value = modifier[feature];
        }
    }
    
    return value;
}

// Get permission level for a tier
export function getPermissionLevel(tier: VendorTier): PermissionLevel {
    return TIER_PERMISSIONS[tier].permissionLevel;
}

// Get max team members for a tier
export function getMaxTeamMembers(tier: VendorTier): number | 'unlimited' {
    return TIER_PERMISSIONS[tier].maxTeamMembers;
}

// Check if user can add more collaborators
export function canAddCollaborator(tier: VendorTier, currentMembers: number): boolean {
    const maxMembers = getMaxTeamMembers(tier);
    if (maxMembers === 'unlimited') return true;
    return currentMembers < maxMembers;
}

// Get all available features for a tier
export function getAvailableFeatures(tier: VendorTier, accountType?: AccountType): FeatureName[] {
    const features: FeatureName[] = [];
    const tierPerms = TIER_PERMISSIONS[tier];
    
    for (const [key, value] of Object.entries(tierPerms.features)) {
        if (hasFeature(tier, key as FeatureName, accountType)) {
            features.push(key as FeatureName);
        }
    }
    
    return features;
}

// Feature display labels
export const FEATURE_LABELS: Record<FeatureName, { en: string; fr: string; ar: string }> = {
    products: { en: 'Products', fr: 'Produits', ar: 'المنتجات' },
    analytics: { en: 'Analytics', fr: 'Analytique', ar: 'التحليلات' },
    support: { en: 'Support', fr: 'Support', ar: 'الدعم' },
    socialMedia: { en: 'Social Media Links', fr: 'Liens réseaux sociaux', ar: 'روابط التواصل' },
    liveStreaming: { en: 'Live Streaming', fr: 'Diffusion en direct', ar: 'البث المباشر' },
    customBranding: { en: 'Custom Branding', fr: 'Personnalisation marque', ar: 'العلامة المخصصة' },
    api: { en: 'API Access', fr: 'Accès API', ar: 'وصول API' },
    whiteLabel: { en: 'White-label Solution', fr: 'Solution white-label', ar: 'حل White-label' },
    integrations: { en: 'Custom Integrations', fr: 'Intégrations personnalisées', ar: 'تكاملات مخصصة' },
    bulkUpload: { en: 'Bulk Upload', fr: 'Upload en masse', ar: 'رفع Bulk' },
    multiUser: { en: 'Multi-user Access', fr: 'Accès multi-utilisateurs', ar: 'وصول متعدد' },
    adsCredits: { en: 'Ad Credits', fr: 'Crédits publicitaires', ar: 'إعلانات مدفوعة' },
    featuredListing: { en: 'Featured Listings', fr: 'Annonces en vedette', ar: 'إعلانات مميزة' },
    priorityDelivery: { en: 'Priority Delivery', fr: 'Livraison prioritaire', ar: 'أولوية التوصيل' },
    accountManager: { en: 'Account Manager', fr: 'Gestionnaire de compte', ar: 'مدير الحساب' },
    bannerAds: { en: 'Banner Ads', fr: 'Bannières publicitaires', ar: 'إعلانات بانر' },
    productsLimit: { en: 'Products Limit', fr: 'Limite produits', ar: 'حد المنتجات' },
    ordersLimit: { en: 'Orders Limit', fr: 'Limite commandes', ar: 'حد الطلبات' },
    storageLimit: { en: 'Storage Limit', fr: 'Limite stockage', ar: 'حد التخزين' },
    commissionRate: { en: 'Commission Rate', fr: 'Taux de commission', ar: 'نسبة العمولة' },
    marketing: { en: 'Marketing Tools', fr: 'Outils Marketing', ar: 'أدوات التسويق' },
    treasureHunt: { en: 'Treasure Hunt', fr: 'Chasse au Trésor', ar: 'حملات الكنز' },
    banners: { en: 'Banner Management', fr: 'Gestion des bannières', ar: 'إدارة البانرات' },
    brandRevenue: { en: 'Revenue Analytics', fr: 'Analyse des revenus', ar: 'تحليل الإيرادات' },
    notifications: { en: 'Push Notifications', fr: 'Notifications Push', ar: 'إشعارات بوش' },
};
