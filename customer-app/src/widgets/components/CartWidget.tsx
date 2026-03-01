/**
 * Cart Widget Component
 * 
 * Displays current cart information with support for
 * small, medium, and large widget sizes.
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { CartWidgetData, WidgetSize, WidgetTheme } from '../types';
import { formatCurrency, truncateText } from '../utils';

interface CartWidgetProps {
  data: CartWidgetData;
  size: WidgetSize;
  theme: WidgetTheme;
}

/**
 * Small cart widget - shows item count and total
 */
export const SmallCartWidget: React.FC<CartWidgetProps> = ({ data, theme }) => {
  return (
    <View style={[styles.smallContainer, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.smallIconContainer}>
        <Text style={[styles.cartIcon, { color: theme.accentColor }]}>🛒</Text>
      </View>
      <Text style={[styles.smallItemCount, { color: theme.textColor }]}>
        {data.itemCount} {data.itemCount === 1 ? 'Item' : 'Items'}
      </Text>
      <Text style={[styles.smallTotal, { color: theme.accentColor }]}>
        {formatCurrency(data.totalAmount, data.currency)}
      </Text>
    </View>
  );
};

/**
 * Medium cart widget - shows items with images
 */
export const MediumCartWidget: React.FC<CartWidgetProps> = ({ data, theme }) => {
  return (
    <View style={[styles.mediumContainer, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.mediumHeader}>
        <Text style={[styles.mediumTitle, { color: theme.textColor }]}>Your Cart</Text>
        <Text style={[styles.cartIcon, { color: theme.accentColor }]}>🛒</Text>
      </View>
      
      <View style={styles.mediumItems}>
        {data.items.slice(0, 3).map((item, index) => (
          <View key={item.id} style={styles.mediumItem}>
            <View style={[styles.mediumItemImage, { backgroundColor: theme.borderColor }]}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              ) : (
                <Text style={[styles.itemImagePlaceholder, { color: theme.textSecondaryColor }]}>
                  📦
                </Text>
              )}
            </View>
            <Text 
              style={[styles.mediumItemName, { color: theme.textColor }]} 
              numberOfLines={1}
            >
              {truncateText(item.name, 15)}
            </Text>
            <Text style={[styles.mediumItemPrice, { color: theme.accentColor }]}>
              {formatCurrency(item.price, data.currency)}
            </Text>
          </View>
        ))}
      </View>
      
      <View style={[styles.mediumFooter, { borderTopColor: theme.borderColor }]}>
        <Text style={[styles.mediumTotalLabel, { color: theme.textSecondaryColor }]}>Total</Text>
        <Text style={[styles.mediumTotalAmount, { color: theme.accentColor }]}>
          {formatCurrency(data.totalAmount, data.currency)}
        </Text>
      </View>
    </View>
  );
};

/**
 * Large cart widget - shows all items with details
 */
export const LargeCartWidget: React.FC<CartWidgetProps> = ({ data, theme }) => {
  return (
    <View style={[styles.largeContainer, { backgroundColor: theme.backgroundColor }]}>
      <View style={[styles.largeHeader, { borderBottomColor: theme.borderColor }]}>
        <Text style={[styles.largeTitle, { color: theme.textColor }]}>Shopping Cart</Text>
        <View style={styles.largeHeaderRight}>
          <Text style={[styles.cartIcon, { color: theme.accentColor }]}>🛒</Text>
          <Text style={[styles.largeItemCount, { color: theme.textSecondaryColor }]}>
            {data.itemCount} items
          </Text>
        </View>
      </View>
      
      <View style={styles.largeItems}>
        {data.items.map((item) => (
          <View key={item.id} style={[styles.largeItem, { borderBottomColor: theme.borderColor }]}>
            <View style={[styles.largeItemImage, { backgroundColor: theme.borderColor }]}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              ) : (
                <Text style={[styles.itemImagePlaceholder, { color: theme.textSecondaryColor }]}>
                  📦
                </Text>
              )}
              <View style={[styles.quantityBadge, { backgroundColor: theme.accentColor }]}>
                <Text style={styles.quantityText}>{item.quantity}</Text>
              </View>
            </View>
            <View style={styles.largeItemInfo}>
              <Text 
                style={[styles.largeItemName, { color: theme.textColor }]} 
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <Text style={[styles.largeItemPrice, { color: theme.accentColor }]}>
                {formatCurrency(item.price, data.currency)}
              </Text>
            </View>
          </View>
        ))}
      </View>
      
      <View style={[styles.largeFooter, { borderTopColor: theme.borderColor }]}>
        <View style={styles.largeFooterRow}>
          <Text style={[styles.largeTotalLabel, { color: theme.textSecondaryColor }]}>Subtotal</Text>
          <Text style={[styles.largeTotalAmount, { color: theme.textColor }]}>
            {formatCurrency(data.totalAmount, data.currency)}
          </Text>
        </View>
        <View style={[styles.largeCheckoutButton, { backgroundColor: theme.accentColor }]}>
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </View>
      </View>
    </View>
  );
};

/**
 * Main CartWidget component that renders appropriate size
 */
export const CartWidget: React.FC<CartWidgetProps> = (props) => {
  switch (props.size) {
    case WidgetSize.SMALL:
      return <SmallCartWidget {...props} />;
    case WidgetSize.MEDIUM:
      return <MediumCartWidget {...props} />;
    case WidgetSize.LARGE:
      return <LargeCartWidget {...props} />;
    default:
      return <SmallCartWidget {...props} />;
  }
};

const styles = StyleSheet.create({
  // Small widget styles
  smallContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12
  },
  smallIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  cartIcon: {
    fontSize: 32
  },
  smallItemCount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  smallTotal: {
    fontSize: 18,
    fontWeight: '700'
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
    marginBottom: 12
  },
  mediumTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  mediumItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  mediumItem: {
    alignItems: 'center',
    flex: 1
  },
  mediumItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8
  },
  itemImagePlaceholder: {
    fontSize: 24
  },
  mediumItemName: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 2
  },
  mediumItemPrice: {
    fontSize: 11,
    fontWeight: '600'
  },
  mediumFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1
  },
  mediumTotalLabel: {
    fontSize: 12
  },
  mediumTotalAmount: {
    fontSize: 16,
    fontWeight: '700'
  },
  
  // Large widget styles
  largeContainer: {
    flex: 1,
    padding: 16
  },
  largeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12
  },
  largeTitle: {
    fontSize: 20,
    fontWeight: '700'
  },
  largeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  largeItemCount: {
    fontSize: 12
  },
  largeItems: {
    flex: 1
  },
  largeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  largeItemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  quantityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quantityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  },
  largeItemInfo: {
    flex: 1
  },
  largeItemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4
  },
  largeItemPrice: {
    fontSize: 14,
    fontWeight: '600'
  },
  largeFooter: {
    paddingTop: 12,
    borderTopWidth: 1
  },
  largeFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  largeTotalLabel: {
    fontSize: 14
  },
  largeTotalAmount: {
    fontSize: 20,
    fontWeight: '700'
  },
  largeCheckoutButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  }
});

export default CartWidget;
