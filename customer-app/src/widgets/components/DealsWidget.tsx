/**
 * Deals Widget Component
 * 
 * Displays current promotions, flash sales, and deals
 * with support for small, medium, and large widget sizes.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { DealsWidgetData, WidgetSize, WidgetTheme } from '../types';
import { formatCurrency, formatTimeRemaining, calculateDiscount, truncateText } from '../utils';

interface DealsWidgetProps {
  data: DealsWidgetData;
  size: WidgetSize;
  theme: WidgetTheme;
}

/**
 * Small deals widget - shows discount badge
 */
export const SmallDealsWidget: React.FC<DealsWidgetProps> = ({ data, theme }) => {
  const [timeLeft, setTimeLeft] = useState<string>('--');
  
  useEffect(() => {
    if (data.flashSaleEndTime) {
      const interval = setInterval(() => {
        setTimeLeft(formatTimeRemaining(data.flashSaleEndTime!));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [data.flashSaleEndTime]);

  const topDeal = data.activeDeals[0];

  return (
    <View style={[styles.smallContainer, { backgroundColor: theme.backgroundColor }]}>
      <View style={[styles.smallHeader, { backgroundColor: theme.accentColor }]}>
        <Text style={styles.flashIcon}>⚡</Text>
        <Text style={styles.flashText}>FLASH SALE</Text>
      </View>
      
      {topDeal && (
        <View style={styles.smallContent}>
          <Text style={[styles.smallDiscount, { color: theme.errorColor }]}>
            {topDeal.discount}% OFF
          </Text>
          <Text 
            style={[styles.smallProductName, { color: theme.textColor }]} 
            numberOfLines={2}
          >
            {truncateText(topDeal.title, 30)}
          </Text>
          {data.flashSaleEndTime && (
            <View style={styles.smallTimer}>
              <Text style={[styles.smallTimerText, { color: theme.textSecondaryColor }]}>
                {timeLeft}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * Medium deals widget - shows multiple deals
 */
export const MediumDealsWidget: React.FC<DealsWidgetProps> = ({ data, theme }) => {
  const [timeLeft, setTimeLeft] = useState<string>('--');
  
  useEffect(() => {
    if (data.flashSaleEndTime) {
      const interval = setInterval(() => {
        setTimeLeft(formatTimeRemaining(data.flashSaleEndTime!));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [data.flashSaleEndTime]);

  return (
    <View style={[styles.mediumContainer, { backgroundColor: theme.backgroundColor }]}>
      <View style={[styles.mediumHeader, { borderBottomColor: theme.borderColor }]}>
        <View style={styles.mediumHeaderLeft}>
          <Text style={[styles.mediumTitle, { color: theme.textColor }]}>⚡ Deals</Text>
          {data.flashSaleEndTime && (
            <View style={[styles.mediumTimerBadge, { backgroundColor: theme.accentColor }]}>
              <Text style={styles.mediumTimerText}>{timeLeft}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.mediumDeals}>
        {data.activeDeals.slice(0, 3).map((deal) => (
          <View key={deal.id} style={[styles.mediumDealCard, { borderColor: theme.borderColor }]}>
            <View style={[styles.mediumDealImage, { backgroundColor: theme.borderColor }]}>
              {deal.imageUrl ? (
                <Image source={{ uri: deal.imageUrl }} style={styles.dealImage} />
              ) : (
                <Text style={styles.dealImagePlaceholder}>🏷️</Text>
              )}
              <View style={[styles.discountBadge, { backgroundColor: theme.errorColor }]}>
                <Text style={styles.discountText}>-{deal.discount}%</Text>
              </View>
            </View>
            <Text 
              style={[styles.mediumDealName, { color: theme.textColor }]} 
              numberOfLines={1}
            >
              {truncateText(deal.title, 12)}
            </Text>
            <View style={styles.mediumDealPrices}>
              <Text style={[styles.mediumDealSalePrice, { color: theme.accentColor }]}>
                {formatCurrency(deal.salePrice)}
              </Text>
              <Text style={[styles.mediumDealOriginalPrice, { color: theme.textSecondaryColor }]}>
                {formatCurrency(deal.originalPrice)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * Large deals widget - shows more deals with details
 */
export const LargeDealsWidget: React.FC<DealsWidgetProps> = ({ data, theme }) => {
  const [timeLeft, setTimeLeft] = useState<string>('--');
  
  useEffect(() => {
    if (data.flashSaleEndTime) {
      const interval = setInterval(() => {
        setTimeLeft(formatTimeRemaining(data.flashSaleEndTime!));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [data.flashSaleEndTime]);

  return (
    <View style={[styles.largeContainer, { backgroundColor: theme.backgroundColor }]}>
      <View style={[styles.largeHeader, { backgroundColor: theme.accentColor }]}>
        <View style={styles.largeHeaderContent}>
          <Text style={styles.largeFlashIcon}>⚡</Text>
          <View>
            <Text style={styles.largeTitle}>Flash Sale</Text>
            <Text style={styles.largeSubtitle}>Limited time offers</Text>
          </View>
        </View>
        {data.flashSaleEndTime && (
          <View style={styles.largeTimerBadge}>
            <Text style={styles.largeTimerText}>{timeLeft}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.largeDeals}>
        {data.activeDeals.map((deal) => (
          <View key={deal.id} style={[styles.largeDealRow, { borderBottomColor: theme.borderColor }]}>
            <View style={[styles.largeDealImage, { backgroundColor: theme.borderColor }]}>
              {deal.imageUrl ? (
                <Image source={{ uri: deal.imageUrl }} style={styles.dealImage} />
              ) : (
                <Text style={styles.dealImagePlaceholder}>🏷️</Text>
              )}
            </View>
            <View style={styles.largeDealInfo}>
              <Text 
                style={[styles.largeDealName, { color: theme.textColor }]} 
                numberOfLines={2}
              >
                {deal.title}
              </Text>
              <Text 
                style={[styles.largeDealDescription, { color: theme.textSecondaryColor }]} 
                numberOfLines={1}
              >
                {deal.description}
              </Text>
              <View style={styles.largeDealPrices}>
                <Text style={[styles.largeDealSalePrice, { color: theme.accentColor }]}>
                  {formatCurrency(deal.salePrice)}
                </Text>
                <Text style={[styles.largeDealOriginalPrice, { color: theme.textSecondaryColor }]}>
                  {formatCurrency(deal.originalPrice)}
                </Text>
                <View style={[styles.largeDiscountBadge, { backgroundColor: theme.errorColor }]}>
                  <Text style={styles.largeDiscountText}>-{deal.discount}%</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
      
      <View style={[styles.largeFooter, { borderTopColor: theme.borderColor }]}>
        <Text style={[styles.largeFooterText, { color: theme.textSecondaryColor }]}>
          {data.activeDeals.length} active deals
        </Text>
        <Text style={[styles.largeViewAll, { color: theme.accentColor }]}>View All →</Text>
      </View>
    </View>
  );
};

/**
 * Main DealsWidget component that renders appropriate size
 */
export const DealsWidget: React.FC<DealsWidgetProps> = (props) => {
  switch (props.size) {
    case WidgetSize.SMALL:
      return <SmallDealsWidget {...props} />;
    case WidgetSize.MEDIUM:
      return <MediumDealsWidget {...props} />;
    case WidgetSize.LARGE:
      return <LargeDealsWidget {...props} />;
    default:
      return <SmallDealsWidget {...props} />;
  }
};

const styles = StyleSheet.create({
  // Small widget styles
  smallContainer: {
    flex: 1,
    overflow: 'hidden'
  },
  smallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6
  },
  flashIcon: {
    fontSize: 14
  },
  flashText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  smallContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12
  },
  smallDiscount: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8
  },
  smallProductName: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8
  },
  smallTimer: {
    marginTop: 4
  },
  smallTimerText: {
    fontSize: 11,
    fontWeight: '600'
  },
  
  // Medium widget styles
  mediumContainer: {
    flex: 1,
    padding: 12
  },
  mediumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 10
  },
  mediumHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  mediumTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  mediumTimerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  mediumTimerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600'
  },
  mediumDeals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  mediumDealCard: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1
  },
  mediumDealImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative'
  },
  dealImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6
  },
  dealImagePlaceholder: {
    fontSize: 20
  },
  discountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700'
  },
  mediumDealName: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center'
  },
  mediumDealPrices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  mediumDealSalePrice: {
    fontSize: 11,
    fontWeight: '700'
  },
  mediumDealOriginalPrice: {
    fontSize: 9,
    textDecorationLine: 'line-through'
  },
  
  // Large widget styles
  largeContainer: {
    flex: 1,
    overflow: 'hidden'
  },
  largeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  largeHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  largeFlashIcon: {
    fontSize: 28
  },
  largeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700'
  },
  largeSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12
  },
  largeTimerBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  largeTimerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  largeDeals: {
    flex: 1,
    paddingHorizontal: 16
  },
  largeDealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  largeDealImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative'
  },
  largeDealInfo: {
    flex: 1,
    marginLeft: 12
  },
  largeDealName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2
  },
  largeDealDescription: {
    fontSize: 12,
    marginBottom: 6
  },
  largeDealPrices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  largeDealSalePrice: {
    fontSize: 16,
    fontWeight: '700'
  },
  largeDealOriginalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through'
  },
  largeDiscountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  largeDiscountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  },
  largeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1
  },
  largeFooterText: {
    fontSize: 12
  },
  largeViewAll: {
    fontSize: 12,
    fontWeight: '600'
  }
});

export default DealsWidget;
