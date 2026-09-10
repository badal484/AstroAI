import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  PujaOrderStatus,
  type PujaOrderDTO,
} from '@astroai/shared-types';
import { fetchMyPujaOrders } from '../../lib/pujaApi';
import { CreditBalanceBadge } from '../../components/ui/CreditBalanceBadge';
import { AstroIcon } from '../../components/ui/AstroIcon';
import { colors, radius, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/AppStack';

function getStatusBadge(status: PujaOrderStatus) {
  switch (status) {
    case PujaOrderStatus.CONFIRMED:
      return { label: 'Confirmed & Scheduled', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' };
    case PujaOrderStatus.SANKALPA_RECORDED:
      return { label: 'Sankalpa Chanted', color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)' };
    case PujaOrderStatus.LIVE_PERFORMED:
      return { label: 'Puja Consecrated', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' };
    case PujaOrderStatus.PRASAD_DISPATCHED:
      return { label: 'Prasad in Transit', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' };
    case PujaOrderStatus.COMPLETED:
      return { label: 'Completed & Blessed', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
    default:
      return { label: status, color: colors.primary, bg: 'rgba(79, 70, 229, 0.12)' };
  }
}

export function PujaOrderHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [orders, setOrders] = useState<PujaOrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMyPujaOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch your booked pujas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenStream = (url?: string | null) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Live Stream', `Connecting to temple sanctum live feed:\n${url}`);
      });
    } else {
      Alert.alert('Live Stream', 'Live streaming link will activate on the day of the scheduled puja.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>My Sacred Bookings</Text>
          <Text style={styles.screenSubtitle}>Sankalpas, Live Feeds & Prasad Tracking</Text>
        </View>
        <CreditBalanceBadge />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching your consecrated orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadOrders}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBadge}>
            <AstroIcon name="flame" size={32} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Temple Bookings Yet</Text>
          <Text style={styles.emptySub}>
            Perform a sacred Vedic Anushthan with your Gotra & Nakshatra at sacred Jyotirlingas.
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => (navigation as any).navigate('PujaCatalog')}
            activeOpacity={0.85}
          >
            <Text style={styles.exploreBtnText}>Explore Devasthanam</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <Text style={styles.pujaTitle}>{order.pujaTitle}</Text>
                <View style={styles.templeRow}>
                  <AstroIcon name="location" size={13} color={colors.primary} />
                  <Text style={styles.templeName}>{order.templeName}</Text>
                </View>

                {/* Sankalpa Meta */}
                <View style={styles.sankalpaBox}>
                  <Text style={styles.sankalpaHeading}>Vedic Sankalpa Registered:</Text>
                  <Text style={styles.sankalpaLine}>
                    <Text style={styles.boldText}>Seeker:</Text> {order.sankalpaName} •{' '}
                    <Text style={styles.boldText}>Gotra:</Text> {order.gotra} •{' '}
                    <Text style={styles.boldText}>Nakshatra:</Text> {order.nakshatra}
                  </Text>
                  <Text style={styles.intentLine}>
                    <Text style={styles.boldText}>Prayer Intent:</Text> "{order.prayerIntent}"
                  </Text>
                </View>

                {/* Scheduled Date */}
                <View style={styles.scheduleRow}>
                  <Text style={styles.scheduleLabel}>Scheduled Performing Date:</Text>
                  <Text style={styles.scheduleValue}>{order.scheduledDate}</Text>
                </View>

                {/* Prasad Tracker */}
                {order.isPrasadDeliveryRequested && (
                  <View style={styles.prasadBox}>
                    <View style={styles.prasadHeader}>
                      <AstroIcon name="package" size={14} color="#9333ea" />
                      <Text style={styles.prasadTitle}>Consecrated Prasad Package</Text>
                    </View>
                    {order.prasadTrackingNumber ? (
                      <Text style={styles.prasadInfo}>
                        Tracking: <Text style={styles.trackingNumber}>{order.prasadTrackingNumber}</Text> ({order.prasadCourier})
                      </Text>
                    ) : (
                      <Text style={styles.prasadPending}>
                        Will dispatch via SpeedPost post-puja consecration.
                      </Text>
                    )}
                  </View>
                )}

                {/* Live Stream Button */}
                {order.liveStreamUrl && (
                  <TouchableOpacity
                    style={styles.streamBtn}
                    onPress={() => handleOpenStream(order.liveStreamUrl)}
                    activeOpacity={0.8}
                  >
                    <AstroIcon name="live" size={14} color="#ef4444" />
                    <Text style={styles.streamBtnText}>Watch Live Sanctum Stream</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  screenTitle: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  screenSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
  },
  orderCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    gap: spacing.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
  },
  orderDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  pujaTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  templeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templeName: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  sankalpaBox: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 4,
  },
  sankalpaHeading: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  sankalpaLine: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  boldText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  intentLine: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  scheduleLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  scheduleValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  prasadBox: {
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  prasadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  prasadTitle: {
    ...typography.caption,
    color: '#9333ea',
    fontWeight: '700',
  },
  prasadInfo: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  trackingNumber: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  prasadPending: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  streamBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: 4,
  },
  streamBtnText: {
    ...typography.body,
    color: '#ef4444',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  retryBtnText: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  emptySub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  exploreBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  exploreBtnText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '700',
  },
});
