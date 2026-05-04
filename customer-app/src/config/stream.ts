// ============================================
// LIVE SHOPPING UI/UX CONFIGURATION
// TikTok & Agora Premium Standard
// ============================================

// Stream Video Configuration
export const STREAM_API_KEY =
  process.env.EXPO_PUBLIC_STREAM_API_KEY || "6uwr9r2ypxw9";

export const STREAM_TOKEN =
  process.env.EXPO_PUBLIC_STREAM_TOKEN ||
  "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZGVtby11c2VyLTdsUE5zTE9XIiwic3ViIjoidXNlci9kZW1vLXVzZXItN2xQTnNMT1ciLCJhcGlLZXkiOiI2dXdyOXIyeXB4dzkiLCJpYXQiOjE3Nzc4MDgxNTcsImV4cCI6MTc3NzgxMTc1N30.QcPMsY1jHFY8Kj1DFBoVbIViFNc1TZTKBDMKpEwlDFY";

// ============================================
// AGORA PREMIUM VIDEO CONFIGURATION
// For TikTok-level interactive features
// ============================================
export const AGORA_CONFIG = {
  // Credentials - Set in .env
  appId: process.env.EXPO_PUBLIC_AGORA_APP_ID || "",
  token: process.env.EXPO_PUBLIC_AGORA_TOKEN || "",

  // Channel & Roles
  channelProfile: 1, // LIVE_BROADCASTING
  clientRoleBroadcaster: 1,
  clientRoleAudience: 2,

  // Ultra HD Video (TikTok Shop Standard)
  videoEncoderConfig: {
    width: 1280,
    height: 720,
    frameRate: 30,
    bitrate: 2000,
    orientationMode: 0,
  },

  // Beauty & Filters (Agora Beauty Effects)
  beautyEffects: true,
  beautyOptions: {
    lighteningContrastLevel: 0.7,
    smoothnessLevel: 0.6,
    colorLevel: 0.4,
    redLevel: 0.2,
    sharpness: 0.3,
  },

  // Audio Optimized for Shopping
  audioProfile: 1,
  audioScenario: 2, // LIVE_BROADCASTING

  // Interactive features
  enableDualStream: true,
  enableLowLightEnhancement: true,
  enableVirtualBackground: false,
};

// ============================================
// MODERN UI/UX DESIGN SYSTEM - TikTok Style
// ============================================
export const LIVE_UI_THEME = {
  // Core Colors (Premium Dark Theme)
  colors: {
    primary: "#F59E0B", // Gold - trust & premium
    primaryGradient: ["#F59E0B", "#D97706"],
    accentBlue: "#3B82F6",
    accentPink: "#EF4444",
    accentGreen: "#10B981",
    success: "#22C55E",

    // Glass & Overlay
    glassDark: "rgba(15, 15, 19, 0.85)",
    glassLight: "rgba(255, 255, 255, 0.08)",
    blurOverlay: "rgba(0, 0, 0, 0.4)",
    overlayDark: "rgba(0, 0, 0, 0.6)",

    // Text
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    textMuted: "rgba(255, 255, 255, 0.4)",

    // Status
    live: "#EF4444",
    liveGlow: "rgba(239, 68, 68, 0.3)",
    online: "#22C55E",
  },

  // Layout Zones (safe area aware)
  layout: {
    topBarHeight: 44,
    bottomDockHeight: 85,
    bottomDockSafeBottom: 34,
    sideProductBarWidth: 85,
    topSafeArea: 60,
  },

  // Interactive Touch Zones
  touchZones: {
    likeButtonSize: 50,
    shareButtonSize: 44,
    giftButtonSize: 52,
    chatButtonSize: 48,
    hostControlSize: 56,
  },

  // Animations
  animations: {
    spring: { damping: 12, stiffness: 150, mass: 0.8 },
    fadeIn: { duration: 250 },
    slideUp: {
      duration: 300,
      easing: { type: "timing", config: { damping: 15 } },
    },
    pulse: {
      duration: 1000,
      loop: true,
      from: { scale: 1 },
      to: { scale: 1.08 },
    },
    productPin: {
      duration: 400,
      fromValue: 0,
      toValue: 1,
      easing: "easeOutBack",
    },
    giftPopup: { duration: 450, delay: 0 },
  },

  // Shadows & Glows
  shadows: {
    glowPrimary: {
      shadowRadius: 20,
      shadowOpacity: 0.3,
      shadowColor: "#F59E0B",
      elevation: 10,
    },
    glowBlue: {
      shadowRadius: 16,
      shadowOpacity: 0.2,
      shadowColor: "#3B82F6",
      elevation: 6,
    },
    float: {
      shadowRadius: 12,
      shadowOpacity: 0.15,
      shadowColor: "#000",
      elevation: 8,
    },
  },

  // Typography
  typography: {
    fontBold: "System",
    fontMedium: "System",
    fontRegular: "System",
    sizes: {
      tiny: 10,
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
};

// ============================================
// LIVE SHOPPING LAYOUT CONFIGURATION
// TikTok Shop & Amazon Live Style
// ============================================
export const LIVE_LAYOUT = {
  // Host Video Overlay Positioning
  hostOverlay: {
    default: { top: 50, left: 12, right: 12 },
    minimized: { top: 20, left: 70, width: 90, height: 120 },
  },

  // Product Carousel (horizontal scroll at bottom)
  productCarousel: {
    height: 120,
    spacing: 12,
    cardWidth: 100,
    cardHeight: 110,
    borderRadius: 16,
    maxVisible: 4,
  },

  // Floating Stickers (product info)
  floatingSticker: {
    width: 180,
    height: 200,
    borderRadius: 20,
    maxOnScreen: 3,
  },

  // Live Indicator (top left)
  liveIndicator: {
    width: 60,
    height: 24,
    borderRadius: 12,
    dotSize: 6,
    pulseDuration: 1500,
  },

  // Viewer Count Badge
  viewerBadge: {
    width: "auto",
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 12,
  },

  // Central Action Buttons (right side)
  actionColumn: {
    width: 60,
    paddingVertical: 8,
    gap: 16,
  },

  // Bottom Control Dock
  bottomDock: {
    height: 85,
    paddingBottom: 34, // safe area
    gradientHeight: 240,
  },
};

// ============================================
// SHOPPING FEATURES CONFIG
// ============================================
export const SHOPPING_CONFIG = {
  // Product Card Timings
  autoDismissDelay: 5000,
  pinDuration: 300, // 5 minutes default

  // Cart & Checkout
  cartMaxItems: 50,
  checkoutTimeout: 900, // 15 minutes

  // Gift Settings
  giftComboWindow: 3000, // 3s to combo
  bigGiftThreshold: 500, // 500+ points = big animation
  giftQueueSize: 10,

  // Coupon Settings
  couponMaxCount: 5,
  couponDuration: 3600, // 1 hour

  // Poll Settings
  pollMaxOptions: 4,
  pollDuration: 1800, // 30 minutes

  // Order Notifications
  purchaseSoundEnabled: true,
  orderTtsEnabled: true,
};

// ============================================
// RTM (Real-Time Messenging) EVENTS
// For Agora-compatible event sync
// ============================================
export const RTM_EVENTS = {
  // Shopping
  PRODUCT_PIN: "product:pin",
  PRODUCT_UNPIN: "product:unpin",
  PRODUCT_QUICK_VIEW: "product:quickview",
  ADD_TO_CART: "cart:add",
  PURCHASE: "purchase:complete",
  COUPON_CLAIM: "coupon:claim",

  // Engagement
  LIKE: "stream:like",
  LIKE_BURST: "like:burst",
  GIFT: "gift:send",
  GIFT_COMBO: "gift:combo",
  REACTION: "reaction:send",

  // Chat
  CHAT_MESSAGE: "chat:message",
  CHAT_REACTION: "chat:reaction",
  CHAT_TIP: "chat:tip",

  // Social
  FOLLOW: "follow",
  SHARE: "share:click",
  REPORT: "report:user",

  // PK Battle
  PK_START: "pk:start",
  PK_VOTE: "pk:vote",
  PK_END: "pk:end",
};

// ============================================
// BEAUTY & FILTER PRESETS
// Agora Beauty Effects
// ============================================
export const BEAUTY_PRESETS = {
  natural: {
    lighteningContrastLevel: 0.5,
    smoothnessLevel: 0.4,
    colorLevel: 0.3,
    redLevel: 0.1,
    sharpness: 0.2,
  },
  radiant: {
    lighteningContrastLevel: 0.7,
    smoothnessLevel: 0.6,
    colorLevel: 0.5,
    redLevel: 0.3,
    sharpness: 0.4,
  },
  dramatic: {
    lighteningContrastLevel: 0.9,
    smoothnessLevel: 0.8,
    colorLevel: 0.7,
    redLevel: 0.4,
    sharpness: 0.5,
  },
};

// ============================================
// GIFTS CONFIG (Enhanced)
// TikTok-style gift animations
// ============================================
export const ENHANCED_GIFTS = {
  rose: {
    id: "rose",
    name: "Rose",
    points: 1,
    color: "#FF6B9D",
    animation: "floatUp",
    sound: "soft_pop",
  },
  heart: {
    id: "heart",
    name: "Heart",
    points: 5,
    color: "#FF3366",
    animation: "heartBeat",
    sound: "heartbeat",
  },
  star: {
    id: "star",
    name: "Star",
    points: 10,
    color: "#FFD700",
    animation: "sparkle",
    sound: "twinkle",
  },
  diamond: {
    id: "diamond",
    name: "Diamond",
    points: 50,
    color: "#00D4FF",
    animation: "spiralUp",
    sound: "shimmer",
  },
  crown: {
    id: "crown",
    name: "Crown",
    points: 100,
    color: "#FFA500",
    animation: "royalDrop",
    sound: "royal",
  },
  rocket: {
    id: "rocket",
    name: "Rocket",
    points: 200,
    color: "#FF4500",
    animation: "launch",
    sound: "launch",
  },
  galaxy: {
    id: "galaxy",
    name: "Galaxy",
    points: 500,
    color: "#9B59B6",
    animation: "galaxyExplosion",
    sound: "epic",
  },
  dragon: {
    id: "dragon",
    name: "Dragon",
    points: 1000,
    color: "#E74C3C",
    animation: "dragonFly",
    sound: "dragon",
  },
};

// Agora RTM channels
export const AGORA_RTM_CHANNELS = {
  STREAM_CONTROL: "stream_control",
  SHOPPING: "shopping_events",
  GIFTS: "gift_feed",
  CHAT: "live_chat",
  NOTIFICATIONS: "notifications",
};

// Stream call types
export const CALL_TYPES = {
  LIVE_SHOPPING: "livestream",
  GROUP_CALL: "default",
};

// Session integrity
export const SESSION_CONFIG = {
  heartbeatInterval: 5000,
  deadSessionTimeout: 180000, // 3 minutes
  tokenRefreshMargin: 300000, // 5 minutes
};

// Format helper
export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m}:${s.toString().padStart(2, "0")}`;
};

export default {
  STREAM_API_KEY,
  STREAM_TOKEN,
  AGORA_CONFIG,
  LIVE_UI_THEME,
  LIVE_LAYOUT,
  SHOPPING_CONFIG,
  RTM_EVENTS,
  BEAUTY_PRESETS,
  ENHANCED_GIFTS,
  AGORA_RTM_CHANNELS,
  CALL_TYPES,
  SESSION_CONFIG,
  formatDuration,
};
