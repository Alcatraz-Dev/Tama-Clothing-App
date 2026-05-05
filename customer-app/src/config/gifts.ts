/**
 * Modern Gift System Configuration
 * Premium visual design with smooth animations
 */

export interface Gift {
  id: string;
  name: string;
  points: number;
  price: number; // in coins
  emoji: string; // Modern emoji representation
  color: string;
  category: "basic" | "premium" | "rare" | "legendary";
  animation: "float" | "pulse" | "spiral" | "explode" | "rain" | "firework";
  duration: number; // ms
  soundEffect?: string;
  imageUrl?: string;
  isAvailable: boolean;
  sortOrder: number;
}

export const MODERN_GIFTS: Gift[] = [
  // Basic Gifts (1-10 coins)
  {
    id: "bubble",
    name: "Bubble",
    points: 1,
    price: 1,
    emoji: "🫧",
    color: "#87CEEB",
    category: "basic",
    animation: "float",
    duration: 1500,
    sortOrder: 1,
    isAvailable: true,
  },
  {
    id: "sparkle",
    name: "Sparkle",
    points: 2,
    price: 2,
    emoji: "✨",
    color: "#FFD700",
    category: "basic",
    animation: "pulse",
    duration: 1200,
    sortOrder: 2,
    isAvailable: true,
  },
  {
    id: "heart",
    name: "Heart",
    points: 5,
    price: 5,
    emoji: "❤️",
    color: "#FF3366",
    category: "basic",
    animation: "float",
    duration: 1800,
    sortOrder: 3,
    isAvailable: true,
  },
  {
    id: "rose",
    name: "Rose",
    points: 10,
    price: 10,
    emoji: "🌹",
    color: "#FF6B9D",
    category: "basic",
    animation: "float",
    duration: 2000,
    sortOrder: 4,
    isAvailable: true,
  },

  // Premium Gifts (20-100 coins)
  {
    id: "crystal",
    name: "Crystal",
    points: 20,
    price: 20,
    emoji: "💎",
    color: "#00D4FF",
    category: "premium",
    animation: "spiral",
    duration: 2500,
    sortOrder: 5,
    isAvailable: true,
  },
  {
    id: "fire",
    name: "Fire",
    points: 30,
    price: 30,
    emoji: "🔥",
    color: "#FF4500",
    category: "premium",
    animation: "pulse",
    duration: 2200,
    sortOrder: 6,
    isAvailable: true,
  },
  {
    id: "star",
    name: "Star",
    points: 50,
    price: 50,
    emoji: "⭐",
    color: "#FFD700",
    category: "premium",
    animation: "spiral",
    duration: 2800,
    sortOrder: 7,
    isAvailable: true,
  },
  {
    id: "diamond",
    name: "Diamond",
    points: 100,
    price: 100,
    emoji: "💠",
    color: "#9BFDFF",
    category: "premium",
    animation: "explode",
    duration: 3000,
    sortOrder: 8,
    isAvailable: true,
  },

  // Rare Gifts (200-500 coins)
  {
    id: "crown",
    name: "Crown",
    points: 200,
    price: 200,
    emoji: "👑",
    color: "#FFD700",
    category: "rare",
    animation: "rain",
    duration: 3500,
    sortOrder: 9,
    isAvailable: true,
  },
  {
    id: "rocket",
    name: "Rocket",
    points: 300,
    price: 300,
    emoji: "🚀",
    color: "#FF6B35",
    category: "rare",
    animation: "explode",
    duration: 4000,
    sortOrder: 10,
    isAvailable: true,
  },
  {
    id: "drama",
    name: "Drama",
    points: 400,
    price: 400,
    emoji: "🎭",
    color: "#9B59B6",
    category: "rare",
    animation: "rain",
    duration: 3800,
    sortOrder: 11,
    isAvailable: true,
  },
  {
    id: "plane",
    name: "Private Jet",
    points: 500,
    price: 500,
    emoji: "✈️",
    color: "#3498DB",
    category: "rare",
    animation: "explode",
    duration: 4500,
    sortOrder: 12,
    isAvailable: true,
  },

  // Legendary Gifts (1000+ coins)
  {
    id: "castle",
    name: "Castle",
    points: 1000,
    price: 1000,
    emoji: "🏰",
    color: "#F39C12",
    category: "legendary",
    animation: "firework",
    duration: 5000,
    sortOrder: 13,
    isAvailable: true,
  },
  {
    id: "car",
    name: "Luxury Car",
    points: 1500,
    price: 1500,
    emoji: "🏎️",
    color: "#E74C3C",
    category: "legendary",
    animation: "firework",
    duration: 5500,
    sortOrder: 14,
    isAvailable: true,
  },
  {
    id: "yacht",
    name: "Yacht",
    points: 2000,
    price: 2000,
    emoji: "🛥️",
    color: "#1ABC9C",
    category: "legendary",
    animation: "firework",
    duration: 6000,
    sortOrder: 15,
    isAvailable: true,
  },
  {
    id: "dragon",
    name: "Dragon",
    points: 5000,
    price: 5000,
    emoji: "🐉",
    color: "#8E44AD",
    category: "legendary",
    animation: "firework",
    duration: 8000,
    sortOrder: 16,
    isAvailable: true,
  },
];

// Gift bundles for quick send
export const GIFT_BUNDLES = [
  { id: "pack_10", name: "Starter Pack", gifts: ["bubble", "sparkle", "heart"], price: 15, discount: 10 },
  { id: "pack_50", name: "Love Pack", gifts: ["rose", "heart", "sparkle"], price: 50, discount: 15 },
  { id: "pack_100", name: "Premium Pack", gifts: ["crystal", "fire", "star"], price: 90, discount: 20 },
  { id: "pack_500", name: "Royal Pack", gifts: ["crown", "rocket", "diamond"], price: 450, discount: 25 },
];

// Animation configs
export const GIFT_ANIMATIONS = {
  float: { translateY: -300, duration: 2000, easing: "easeOut" },
  pulse: { scale: [1, 1.3, 1], duration: 1000, loop: true },
  spiral: { rotate: 360, translateY: -200, duration: 2500 },
  explode: { scale: [0, 2, 0], opacity: [0, 1, 0], duration: 2000 },
  rain: { translateY: [100, -400], duration: 1500, count: 10 },
  firework: { scale: [0, 3, 0], opacity: [0, 1, 0], duration: 3000, count: 5 },
};

// Category colors
export const CATEGORY_COLORS = {
  basic: { bg: "rgba(255,255,255,0.1)", border: "rgba(255,255,255,0.2)", text: "#fff" },
  premium: { bg: "rgba(0,212,255,0.15)", border: "rgba(0,212,255,0.3)", text: "#00D4FF" },
  rare: { bg: "rgba(255,165,0,0.15)", border: "rgba(255,165,0,0.3)", text: "#FFA500" },
  legendary: { bg: "rgba(155,89,182,0.2)", border: "rgba(155,89,182,0.4)", text: "#9B59B6" },
};

// Backward compatibility - Legacy gift format for old screens
export const GIFTS = MODERN_GIFTS.map(gift => ({
  id: gift.id,
  name: gift.name,
  points: gift.points,
  price: gift.price,
  emoji: gift.emoji,
  icon: gift.emoji, // Legacy property
  url: gift.emoji,   // Legacy property
  color: gift.color,
  category: gift.category.toUpperCase() as "POPULAIRE" | "SPÉCIAL" | "LUXE",
}));

export default MODERN_GIFTS;