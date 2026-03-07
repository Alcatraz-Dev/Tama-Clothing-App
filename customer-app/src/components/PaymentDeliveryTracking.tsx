import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { 
  Wallet, 
  CreditCard, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MapPin,
  DollarSign,
  RefreshCw,
  Shield
} from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';
import { 
  useDeliveryZone, 
  useDeliveryPerson, 
  usePaymentStatus, 
  useOrderTransactions,
  useWallet,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  DeliveryZone,
  TransactionInfo
} from '../hooks/useDeliveryPaymentTracking';

interface PaymentDeliveryTrackingProps {
  orderId?: string;
  zoneId?: string | null;
  driverId?: string | null;
  userId?: string;
  userType?: 'vendor' | 'delivery' | 'customer';
  language?: string;
  translate?: (key: string) => string;
  onViewTransactions?: () => void;
}

export const PaymentDeliveryTracking: React.FC<PaymentDeliveryTrackingProps> = ({
  orderId,
  zoneId,
  driverId,
  userId,
  userType,
  language = 'en',
  translate = (k) => k,
  onViewTransactions
}) => {
  const { colors } = useAppTheme();

  // Fetch delivery zone
  const { zone, loading: zoneLoading } = useDeliveryZone(zoneId || null);
  
  // Fetch delivery person
  const { person: deliveryPerson, loading: personLoading } = useDeliveryPerson(driverId || null);
  
  // Fetch payment status
  const { paymentStatus, loading: paymentLoading } = usePaymentStatus(orderId || null);
  
  // Fetch transactions
  const { transactions, loading: transactionsLoading } = useOrderTransactions(orderId || null);
  
  // Fetch wallet for delivery person
  const { wallet, loading: walletLoading } = useWallet(driverId || null, 'delivery');

  const isLoading = zoneLoading || personLoading || paymentLoading || transactionsLoading || walletLoading;

  // Get payment method icon
  const getPaymentMethodIcon = (method: string | null | undefined) => {
    switch (method) {
      case 'wallet':
        return <Wallet size={16} color={colors.accent} />;
      case 'cod':
      case 'cash':
        return <CreditCard size={16} color={colors.accent} />;
      case 'card':
        return <CreditCard size={16} color={colors.accent} />;
      default:
        return <CreditCard size={16} color={colors.textMuted} />;
    }
  };

  // Get payment method label
  const getPaymentMethodLabel = (method: string | null | undefined): string => {
    switch (method) {
      case 'wallet':
        return translate('vonder_wallet') || 'Vonder Wallet';
      case 'cod':
        return translate('cash_on_delivery') || 'Cash on Delivery';
      case 'cash':
        return translate('cash') || 'Cash';
      case 'card':
        return translate('card') || 'Card';
      default:
        return translate('pending') || 'Pending';
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `${(amount || 0).toFixed(2)} TND`;
  };

  // Get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <DollarSign size={14} color="#34C759" />;
      case 'payout':
        return <DollarSign size={14} color="#FF9500" />;
      case 'refund':
        return <RefreshCw size={14} color="#FF3B30" />;
      case 'commission':
        return <Shield size={14} color="#8E8E93" />;
      case 'delivery_fee':
        return <Truck size={14} color="#007AFF" />;
      default:
        return <DollarSign size={14} color={colors.textMuted} />;
    }
  };

  // Get transaction status color
  const getTransactionStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'pending':
      case 'processing':
        return '#FF9500';
      case 'failed':
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  // Format date
  const formatDate = (date: Date | undefined): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-TN' : 'en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          {translate('loading') || 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Payment Status Section */}
      {paymentStatus && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {translate('payment_info') || 'Payment Information'}
          </Text>
          
          {/* Payment Status Badge */}
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(paymentStatus.paymentStatus) + '20' }]}>
              {paymentStatus.paymentStatus === 'paid' || paymentStatus.paymentStatus === 'completed' ? (
                <CheckCircle size={16} color={getPaymentStatusColor(paymentStatus.paymentStatus)} />
              ) : paymentStatus.paymentStatus === 'pending' || paymentStatus.paymentStatus === 'processing' ? (
                <Clock size={16} color={getPaymentStatusColor(paymentStatus.paymentStatus)} />
              ) : (
                <AlertCircle size={16} color={getPaymentStatusColor(paymentStatus.paymentStatus)} />
              )}
              <Text style={[styles.statusText, { color: getPaymentStatusColor(paymentStatus.paymentStatus) }]}>
                {getPaymentStatusLabel(paymentStatus.paymentStatus, language)}
              </Text>
            </View>
            
            {getPaymentMethodIcon(paymentStatus.paymentMethod)}
            <Text style={[styles.paymentMethodText, { color: colors.textMuted }]}>
              {getPaymentMethodLabel(paymentStatus.paymentMethod)}
            </Text>
          </View>

          {/* Amount Details */}
          <View style={styles.amountContainer}>
            <View style={styles.amountRow}>
              <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
                {translate('total_amount') || 'Total Amount'}
              </Text>
              <Text style={[styles.amountValue, { color: colors.foreground }]}>
                {formatCurrency(paymentStatus.amount)}
              </Text>
            </View>
            
            {paymentStatus.paymentMethod === 'cod' && (
              <>
                <View style={styles.amountRow}>
                  <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
                    {translate('cod_status') || 'COD Status'}
                  </Text>
                  <View style={styles.codStatusContainer}>
                    {paymentStatus.codCollected ? (
                      <CheckCircle size={14} color="#34C759" />
                    ) : (
                      <Clock size={14} color="#FF9500" />
                    )}
                    <Text style={[styles.codStatusText, { color: paymentStatus.codCollected ? '#34C759' : '#FF9500' }]}>
                      {paymentStatus.codCollected ? translate('collected') || 'Collected' : translate('pending_collection') || 'Pending Collection'}
                    </Text>
                  </View>
                </View>
                
                {paymentStatus.codDeposited && paymentStatus.depositDate && (
                  <View style={styles.amountRow}>
                    <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
                      {translate('deposited_on') || 'Deposited On'}
                    </Text>
                    <Text style={[styles.amountValue, { color: colors.foreground }]}>
                      {formatDate(paymentStatus.depositDate)}
                    </Text>
                  </View>
                )}
              </>
            )}
            
            {paymentStatus.refundedAmount > 0 && (
              <View style={[styles.amountRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 8 }]}>
                <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
                  {translate('refunded') || 'Refunded'}
                </Text>
                <Text style={[styles.amountValue, { color: '#FF3B30' }]}>
                  {formatCurrency(paymentStatus.refundedAmount)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Delivery Zone Section */}
      {zone && (
        <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {translate('delivery_info') || 'Delivery Information'}
          </Text>
          
          <View style={styles.zoneContainer}>
            <View style={styles.zoneRow}>
              <MapPin size={16} color={colors.accent} />
              <Text style={[styles.zoneLabel, { color: colors.textMuted }]}>
                {translate('delivery_zone') || 'Delivery Zone'}
              </Text>
            </View>
            <Text style={[styles.zoneValue, { color: colors.foreground }]}>
              {zone.name} ({zone.governorate})
            </Text>
          </View>

          {/* Fee Breakdown */}
          <View style={styles.feeContainer}>
            <Text style={[styles.feeTitle, { color: colors.foreground }]}>
              {translate('delivery_fee_breakdown') || 'Delivery Fee Breakdown'}
            </Text>
            <View style={styles.feeRow}>
              <Text style={[styles.feeLabel, { color: colors.textMuted }]}>
                {translate('base_fee') || 'Base Fee'}
              </Text>
              <Text style={[styles.feeValue, { color: colors.foreground }]}>
                {formatCurrency(zone.basePrice)}
              </Text>
            </View>
            {zone.freeDistanceKm > 0 && (
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: colors.textMuted }]}>
                  {translate('free_distance') || 'Free Distance'}
                </Text>
                <Text style={[styles.feeValue, { color: colors.foreground }]}>
                  {zone.freeDistanceKm} km
                </Text>
              </View>
            )}
            {zone.freeDeliveryThreshold > 0 && (
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: colors.textMuted }]}>
                  {translate('free_delivery_threshold') || 'Free Delivery Over'}
                </Text>
                <Text style={[styles.feeValue, { color: colors.foreground }]}>
                  {formatCurrency(zone.freeDeliveryThreshold)}
                </Text>
              </View>
            )}
            {zone.estimatedDeliveryHours > 0 && (
              <View style={styles.feeRow}>
                <View style={styles.zoneRow}>
                  <Clock size={14} color={colors.accent} />
                  <Text style={[styles.feeLabel, { color: colors.textMuted, marginLeft: 4 }]}>
                    {translate('estimated_delivery') || 'Estimated Delivery'}
                  </Text>
                </View>
                <Text style={[styles.feeValue, { color: colors.accent }]}>
                  {zone.estimatedDeliveryHours}h
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Delivery Person Section */}
      {deliveryPerson && (
        <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {translate('delivery_person') || 'Delivery Person'}
          </Text>
          
          <View style={styles.driverContainer}>
            {deliveryPerson.photoUrl ? (
              <View style={[styles.driverAvatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.driverInitial}>
                  {deliveryPerson.fullName?.charAt(0)?.toUpperCase() || 'D'}
                </Text>
              </View>
            ) : (
              <View style={[styles.driverAvatar, { backgroundColor: colors.accent }]}>
                <Truck size={20} color="#FFF" />
              </View>
            )}
            
            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { color: colors.foreground }]}>
                {deliveryPerson.fullName}
              </Text>
              <View style={styles.driverMeta}>
                {deliveryPerson.rating > 0 && (
                  <View style={styles.ratingContainer}>
                    <Text style={[styles.ratingText, { color: '#FBBF24' }]}>
                      ★ {deliveryPerson.rating.toFixed(1)}
                    </Text>
                    <Text style={[styles.deliveriesText, { color: colors.textMuted }]}>
                      • {deliveryPerson.completedDeliveries} {translate('deliveries_count') || 'deliveries'}
                    </Text>
                  </View>
                )}
                <View style={styles.vehicleContainer}>
                  <Truck size={12} color={colors.textMuted} />
                  <Text style={[styles.vehicleText, { color: colors.textMuted }]}>
                    {deliveryPerson.vehicleType}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={[styles.onlineStatus, { backgroundColor: deliveryPerson.isOnline ? '#34C75920' : '#8E8E9320' }]}>
              <View style={[styles.onlineDot, { backgroundColor: deliveryPerson.isOnline ? '#34C759' : '#8E8E93' }]} />
              <Text style={[styles.onlineText, { color: deliveryPerson.isOnline ? '#34C759' : '#8E8E93' }]}>
                {deliveryPerson.isOnline ? translate('online') || 'Online' : translate('offline') || 'Offline'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Wallet Balance Section (for delivery personnel) */}
      {wallet && driverId && (
        <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {translate('wallet_balance') || 'Wallet Balance'}
          </Text>
          
          <View style={styles.walletContainer}>
            <View style={[styles.walletCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.walletRow}>
                <View>
                  <Text style={[styles.walletLabel, { color: colors.textMuted }]}>
                    {translate('available_balance') || 'Available'}
                  </Text>
                  <Text style={[styles.walletBalance, { color: '#34C759' }]}>
                    {formatCurrency(wallet.balance)}
                  </Text>
                </View>
                <View style={styles.walletDivider} />
                <View>
                  <Text style={[styles.walletLabel, { color: colors.textMuted }]}>
                    {translate('pending') || 'Pending'}
                  </Text>
                  <Text style={[styles.walletBalance, { color: '#FF9500' }]}>
                    {formatCurrency(wallet.pendingBalance)}
                  </Text>
                </View>
              </View>
              
              {wallet.totalEarnings > 0 && (
                <View style={[styles.walletRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Text style={[styles.walletLabel, { color: colors.textMuted }]}>
                    {translate('total_earnings') || 'Total Earnings'}
                  </Text>
                  <Text style={[styles.walletTotal, { color: colors.foreground }]}>
                    {formatCurrency(wallet.totalEarnings)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Transaction History Section */}
      {transactions && transactions.length > 0 && (
        <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {translate('transactions') || 'Transactions'}
            </Text>
            {onViewTransactions && (
              <TouchableOpacity onPress={onViewTransactions}>
                <Text style={[styles.viewAllText, { color: colors.accent }]}>
                  {translate('view_all') || 'View All'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.transactionsList}>
            {transactions.slice(0, 5).map((tx: TransactionInfo) => (
              <View key={tx.id} style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
                <View style={[styles.txIcon, { backgroundColor: getTransactionStatusColor(tx.status) + '20' }]}>
                  {getTransactionIcon(tx.type)}
                </View>
                <View style={styles.txInfo}>
                  <Text style={[styles.txDescription, { color: colors.foreground }]} numberOfLines={1}>
                    {tx.description}
                  </Text>
                  <Text style={[styles.txDate, { color: colors.textMuted }]}>
                    {formatDate(tx.createdAt)}
                  </Text>
                </View>
                <View style={styles.txAmountContainer}>
                  <Text style={[
                    styles.txAmount, 
                    { color: tx.type === 'refund' || tx.type === 'payout' ? '#FF3B30' : '#34C759' }
                  ]}>
                    {tx.type === 'refund' || tx.type === 'payout' ? '-' : '+'}{formatCurrency(tx.amount)}
                  </Text>
                  <View style={[styles.txStatusBadge, { backgroundColor: getTransactionStatusColor(tx.status) + '20' }]}>
                    <Text style={[styles.txStatusText, { color: getTransactionStatusColor(tx.status) }]}>
                      {tx.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Payment Status Styles
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  paymentMethodText: {
    fontSize: 14,
    marginLeft: 6,
  },
  amountContainer: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    padding: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  amountLabel: {
    fontSize: 14,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  codStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codStatusText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  // Zone Styles
  zoneContainer: {
    marginBottom: 12,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  zoneLabel: {
    fontSize: 14,
    marginLeft: 6,
  },
  zoneValue: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 22,
  },
  feeContainer: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    padding: 12,
  },
  feeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  feeLabel: {
    fontSize: 13,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Driver Styles
  driverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInitial: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
  },
  driverMeta: {
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deliveriesText: {
    fontSize: 12,
    marginLeft: 4,
  },
  vehicleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  vehicleText: {
    fontSize: 12,
    marginLeft: 4,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Wallet Styles
  walletContainer: {
    marginTop: 4,
  },
  walletCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  walletLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: '700',
  },
  walletDivider: {
    width: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 16,
  },
  walletTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Transaction Styles
  transactionsList: {
    marginTop: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  txIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 10,
  },
  txDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  txDate: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmountContainer: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  txStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  txStatusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
});

export default PaymentDeliveryTracking;
