import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { 
  Smartphone, 
  Sparkles, 
  UtensilsCrossed, 
  Home, 
  Watch, 
  Shirt,
  ArrowRight,
  Grid3X3,
  Video,
  Heart,
  Gift,
  Zap,
  Trophy,
  ShoppingBag,
  Users,
  Star
} from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';

interface CategoryOnboardingScreenProps {
  onFinish: () => void;
  onCategorySelect?: (category: string) => void;
  t: any;
}

const CATEGORIES = [
  { id: 'fashion', icon: Shirt, gradient: ['#FF6B6B', '#FF8E53'], color: '#FF6B6B' },
  { id: 'electronics', icon: Smartphone, gradient: ['#4ECDC4', '#44A08D'], color: '#4ECDC4' },
  { id: 'beauty', icon: Sparkles, gradient: ['#C9D6FF', '#E2E2E2'], color: '#A8A4FF' },
  { id: 'food', icon: UtensilsCrossed, gradient: ['#F093FB', '#F5576C'], color: '#F093FB' },
  { id: 'home', icon: Home, gradient: ['#4FACFE', '#00F2FE'], color: '#4FACFE' },
  { id: 'accessories', icon: Watch, gradient: ['#43E97B', '#38F9D7'], color: '#43E97B' },
  { id: 'live', icon: Video, gradient: ['#FF0844', '#FFB199'], color: '#FF0844' },
  { id: 'feed', icon: Heart, gradient: ['#F43B47', '#453A94'], color: '#F43B47' },
  { id: 'fidelity', icon: Star, gradient: ['#FFD700', '#FFA500'], color: '#FFD700' },
  { id: 'treasure', icon: Trophy, gradient: ['#834D9B', '#D04ED6'], color: '#834D9B' },
  { id: 'flashsale', icon: Zap, gradient: ['#FFE000', '#799F0C'], color: '#FFE000' },
  { id: 'collab', icon: Users, gradient: ['#C33764', '#1D2671'], color: '#C33764' },
];

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function CategoryOnboardingScreen({ onFinish, onCategorySelect, t }: CategoryOnboardingScreenProps) {
  const { colors, theme } = useAppTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getCategoryTitle = (id: string) => {
    const titles: any = {
      fashion: t('categoryFashion') || 'Fashion',
      electronics: t('categoryElectronics') || 'Electronics',
      beauty: t('categoryBeauty') || 'Beauty',
      food: t('categoryFood') || 'Food',
      home: t('categoryHome') || 'Home',
      accessories: t('categoryAccessories') || 'Accessories',
      live: t('categoryLive') || 'Live Shopping',
      feed: t('categoryFeed') || 'Feed',
      fidelity: t('categoryFidelity') || 'Loyalty',
      treasure: t('treasureHunt') || 'Treasure Hunt',
      flashsale: t('categoryFlashSale') || 'Flash Sale',
      collab: t('categoryCollab') || 'Collaborations',
    };
    return titles[id] || id;
  };

  const getCategoryDesc = (id: string) => {
    const descs: any = {
      fashion: t('categoryFashionDesc') || 'Clothing, shoes, and style',
      electronics: t('categoryElectronicsDesc') || 'Latest gadgets and tech',
      beauty: t('categoryBeautyDesc') || 'Skincare and cosmetics',
      food: t('categoryFoodDesc') || 'Homemade meals',
      home: t('categoryHomeDesc') || 'Furniture and decor',
      accessories: t('categoryAccessoriesDesc') || 'Jewelry and bags',
      live: t('categoryLiveDesc') || 'Shop live with your favorite creators',
      feed: t('categoryFeedDesc') || 'Discover trending content and products',
      fidelity: t('categoryFidelityDesc') || 'Earn points and unlock rewards',
      treasure: t('treasureHuntFind') || 'Find hidden treasures and win prizes',
      flashsale: t('categoryFlashSaleDesc') || 'Limited time deals and discounts',
      collab: t('categoryCollabDesc') || 'Exclusive brand collaborations',
    };
    return descs[id] || '';
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    
    // Show feedback
    Alert.alert(
      getCategoryTitle(categoryId),
      `Welcome to ${getCategoryTitle(categoryId)}! Explore all ${getCategoryDesc(categoryId).toLowerCase()}.`,
      [
        { text: 'Continue', onPress: () => setSelectedCategory(null) }
      ]
    );
    
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animatable.View 
        animation="fadeInDown" 
        duration={800}
        style={styles.header}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Grid3X3 size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('marketplaceTitle') || 'DISCOVER THE MARKETPLACE'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {t('marketplaceDesc') || 'Explore all features and categories'}
        </Text>
      </Animatable.View>

      {/* Categories Grid */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <Animatable.View
                key={category.id}
                animation="fadeInUp"
                duration={500}
                delay={index * 50}
                style={styles.categoryCardWrapper}
              >
                <TouchableOpacity
                  onPress={() => handleCategoryPress(category.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={category.gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.selectedCard
                    ]}
                  >
                    <View style={styles.iconBackground}>
                      <Icon size={32} color="#FFF" />
                    </View>
                    <Text style={styles.categoryTitle}>
                      {getCategoryTitle(category.id)}
                    </Text>
                    <Text style={styles.categoryDesc} numberOfLines={2}>
                      {getCategoryDesc(category.id)}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedText}>✓</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animatable.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <Animatable.View 
        animation="fadeInUp" 
        duration={600}
        delay={300}
        style={styles.bottomContainer}
      >
        <TouchableOpacity
          onPress={onFinish}
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.continueButtonText}>
            {t('browseCategories') || 'BROWSE ALL'}
          </Text>
          <ArrowRight size={20} color="#FFF" />
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 12,
  },
  categoryCard: {
    borderRadius: 16,
    padding: 16,
    minHeight: 130,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  iconBackground: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 13,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
