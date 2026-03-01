/**
 * Order Tracking Widget Component
 * 
 * Displays order status and tracking information
 * with support for small, medium, and large widget sizes.
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { OrderTrackingWidgetData, WidgetSize, WidgetTheme, OrderStatus } from '../types';
import { formatDate, getOrderStatusColor, truncateText } from '../utils';

interface OrderTrackingWidgetProps {
  data: OrderTrackingWidgetData;
  size: WidgetSize;
  theme: WidgetTheme;
}

/**
 * Small order tracking widget - shows status only
 */
export const SmallOrderTrackingWidget: React.FC<OrderTrackingWidgetProps> = ({ data, theme }) => {
  const statusColor = getOrderStatusColor(data.status, theme);
  
  return (
    <View style={[styles.smallContainer, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.smallHeader}>
        <Text style={styles.orderIcon}>📦</Text>
      </View>
      <Text style={[styles.smallOrderId, { color: theme.textColor }]}>
        #{data.orderId.slice(-6)}
      </Text>
      <View style={[styles.smallStatusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.smallStatusText}>{data.statusText}</Text>
      </View>
    </View>
  );
};

/**
 * Medium order tracking widget - shows progress
 */
export const MediumOrderTrackingWidget: React.FC<OrderTrackingWidgetProps> = ({ data, theme }) => {
  const completedSteps = data.trackingSteps.filter(s => s.isCompleted).length;
  const totalSteps = data.trackingSteps.length;
  const progress = (completedSteps / totalSteps) * 100;
  
  return (
    <View style={[styles.mediumContainer, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.mediumHeader}>
        <View style={styles.mediumHeaderLeft}>
          <Text style={styles.orderIcon}>📦</Text>
          <View>
            <Text style={[styles.mediumOrderId, { color: theme.textColor }]}>
              Order #{data.orderId.slice(-6)}
            </Text>
            <Text style={[styles.mediumStatus, { color: theme.textSecondaryColor }]}>
              {data.statusText}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.mediumProgressContainer}>
        <View style={[styles.mediumProgressBar, { backgroundColor: theme.borderColor }]}>
          <View 
            style={[
              styles.mediumProgressFill, 
              { backgroundColor: theme.accentColor, width: `${progress}%` }
            ]} 
          />
        </View>
        <View style={styles.mediumSteps}>
          {data.trackingSteps.map((step, index) => (
            <View 
              key={step.status} 
              style={[
                styles.mediumStepDot,
                { 
                  backgroundColor: step.isCompleted ? theme.accentColor : theme.borderColor,
                  borderColor: step.isCurrent ? theme.accentColor : 'transparent'
                }
              ]}
            />
          ))}
        </View>
      </View>
      
      {data.estimatedDelivery && (
        <View style={[styles.mediumDelivery, { borderTopColor: theme.borderColor }]}>
          <Text style={[styles.mediumDeliveryLabel, { color: theme.textSecondaryColor }]}>
            Estimated Delivery
          </Text>
          <Text style={[styles.mediumDeliveryDate, { color: theme.accentColor }]}>
            {formatDate(data.estimatedDelivery, { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * Large order tracking widget - shows full tracking details
 */
export const LargeOrderTrackingWidget: React.FC<OrderTrackingWidgetProps> = ({ data, theme }) => {
  return (
    <View style={[styles.largeContainer, { backgroundColor: theme.backgroundColor }]}>
      <View style={[styles.largeHeader, { borderBottomColor: theme.borderColor }]}>
        <View style={styles.largeHeaderLeft}>
          <Text style={styles.orderIcon}>📦</Text>
          <View>
            <Text style={[styles.largeOrderId, { color: theme.textColor }]}>
              Order #{data.orderId}
            </Text>
            <Text style={[styles.largeStatus, { color: theme.textSecondaryColor }]}>
              {data.statusText}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.largeTrackingSteps}>
        {data.trackingSteps.map((step, index) => (
          <View key={step.status} style={styles.largeStepRow}>
            <View style={styles.largeStepLeft}>
              <View 
                style={[
                  styles.largeStepIndicator,
                  { 
                    backgroundColor: step.isCompleted ? theme.accentColor : theme.borderColor,
                    borderColor: step.isCurrent ? theme.accentColor : 'transparent'
                  }
                ]}
              >
                {step.isCompleted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              {index < data.trackingSteps.length - 1 && (
                <View 
                  style={[
                    styles.largeStepLine,
                    { 
                      backgroundColor: step.isCompleted ? theme.accentColor : theme.borderColor 
                    }
                  ]} 
                />
              )}
            </View>
            <View style={styles.largeStepContent}>
              <Text 
                style={[
                  styles.largeStepTitle, 
                  { color: step.isCompleted || step.isCurrent ? theme.textColor : theme.textSecondaryColor }
                ]}
              >
                {step.title}
              </Text>
              <Text style={[styles.largeStepDescription, { color: theme.textSecondaryColor }]}>
                {step.description}
              </Text>
              {step.timestamp && (
                <Text style={[styles.largeStepTime, { color: theme.textSecondaryColor }]}>
                  {formatDate(step.timestamp, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
      
      {data.estimatedDelivery && (
        <View style={[styles.largeDelivery, { borderTopColor: theme.borderColor }]}>
          <View style={styles.largeDeliveryRow}>
            <Text style={[styles.largeDeliveryLabel, { color: theme.textSecondaryColor }]}>
              Estimated Delivery
            </Text>
            <Text style={[styles.largeDeliveryDate, { color: theme.accentColor }]}>
              {formatDate(data.estimatedDelivery, { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          {data.currentLocation && (
            <Text style={[styles.largeLocation, { color: theme.textSecondaryColor }]}>
              📍 {data.currentLocation}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * Main OrderTrackingWidget component that renders appropriate size
 */
export const OrderTrackingWidget: React.FC<OrderTrackingWidgetProps> = (props) => {
  switch (props.size) {
    case WidgetSize.SMALL:
      return <SmallOrderTrackingWidget {...props} />;
    case WidgetSize.MEDIUM:
      return <MediumOrderTrackingWidget {...props} />;
    case WidgetSize.LARGE:
      return <LargeOrderTrackingWidget {...props} />;
    default:
      return <SmallOrderTrackingWidget {...props} />;
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
  smallHeader: {
    marginBottom: 8
  },
  orderIcon: {
    fontSize: 28
  },
  smallOrderId: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8
  },
  smallStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  smallStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
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
    marginBottom: 16
  },
  mediumHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  mediumOrderId: {
    fontSize: 14,
    fontWeight: '700'
  },
  mediumStatus: {
    fontSize: 11
  },
  mediumProgressContainer: {
    marginBottom: 16
  },
  mediumProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8
  },
  mediumProgressFill: {
    height: '100%',
    borderRadius: 3
  },
  mediumSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4
  },
  mediumStepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2
  },
  mediumDelivery: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1
  },
  mediumDeliveryLabel: {
    fontSize: 11
  },
  mediumDeliveryDate: {
    fontSize: 12,
    fontWeight: '600'
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16
  },
  largeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  largeOrderId: {
    fontSize: 18,
    fontWeight: '700'
  },
  largeStatus: {
    fontSize: 12
  },
  largeTrackingSteps: {
    flex: 1
  },
  largeStepRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  largeStepLeft: {
    alignItems: 'center',
    marginRight: 12,
    width: 24
  },
  largeStepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 1
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  largeStepLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: -4
  },
  largeStepContent: {
    flex: 1,
    paddingBottom: 16
  },
  largeStepTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2
  },
  largeStepDescription: {
    fontSize: 12,
    marginBottom: 2
  },
  largeStepTime: {
    fontSize: 10
  },
  largeDelivery: {
    paddingTop: 16,
    borderTopWidth: 1
  },
  largeDeliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  largeDeliveryLabel: {
    fontSize: 12
  },
  largeDeliveryDate: {
    fontSize: 14,
    fontWeight: '600'
  },
  largeLocation: {
    fontSize: 12
  }
});

export default OrderTrackingWidget;
