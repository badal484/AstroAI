import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreditPack,
  WalletTransactionDTO,
} from '@astroai/shared-types';
import { createPaymentOrder, verifyPayment } from '../../lib/paymentApi';
import { fetchPricingExplanation } from '../../lib/pricingApi';
import { fetchWalletBalance, fetchWalletTransactions } from '../../lib/walletApi';
import { colors, radius, spacing, typography } from '../../theme';

export function WalletScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'packs' | 'pricing' | 'history'>('packs');
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  const [paymentErrorMsg, setPaymentErrorMsg] = useState<string | null>(null);

  const balanceQuery = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: fetchWalletBalance,
  });

  const pricingQuery = useQuery({
    queryKey: ['pricing', 'explanation'],
    queryFn: fetchPricingExplanation,
  });

  const transactionsQuery = useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: () => fetchWalletTransactions({ limit: 30 }),
    enabled: activeTab === 'history',
  });

  const buyPackMutation = useMutation({
    mutationFn: async (pack: CreditPack) => {
      setPurchasingPackId(pack.id);
      setPaymentErrorMsg(null);
      setPaymentSuccessMsg(null);

      // 1. Create order on server
      const idempotencyKey = `mobile_pack_${pack.id}_${Date.now()}`;
      const order = await createPaymentOrder({
        packId: pack.id,
        idempotencyKey,
      });

      // 2. Client verification against authoritative backend
      const paymentId = `pay_rzp_${Date.now()}`;
      const mockSignature = `mock_valid_sig_${Date.now()}`;

      return verifyPayment({
        orderId: order.id,
        razorpayOrderId: order.gatewayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: mockSignature,
      });
    },
    onSuccess: (result) => {
      setPurchasingPackId(null);
      setPaymentSuccessMsg(
        `Recharge successful. Added ${result.order.totalCredits} credits to your Vedic wallet.`,
      );
      void queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
    },
    onError: (err: any) => {
      setPurchasingPackId(null);
      setPaymentErrorMsg(err?.message || 'Payment could not be completed.');
    },
  });

  const isRefreshing = balanceQuery.isRefetching || pricingQuery.isRefetching;

  const onRefresh = () => {
    void balanceQuery.refetch();
    void pricingQuery.refetch();
    if (activeTab === 'history') {
      void transactionsQuery.refetch();
    }
  };

  const balanceData = balanceQuery.data;
  const pricingData = pricingQuery.data;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.gold} />
      }
    >
      {/* Balance Summary Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceSubtitle}>AVAILABLE CONSULTATION CREDITS</Text>
          <View style={styles.currencyPill}>
            <Text style={styles.currencyPillText}>Vedic Wallet</Text>
          </View>
        </View>

        <View style={styles.balanceRow}>
          <Text style={styles.balanceValue}>
            {balanceQuery.isPending ? '—' : balanceData?.availableBalance ?? 0}
          </Text>
          <Text style={styles.balanceUnit}>Credits</Text>
        </View>

        <View style={styles.statsDivider} />

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Balance</Text>
            <Text style={styles.statValue}>{balanceData?.balance ?? 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Active Sessions</Text>
            <Text style={styles.statValue}>{balanceData?.heldBalance ?? 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Lifetime Used</Text>
            <Text style={styles.statValue}>{balanceData?.lifetimeSpent ?? 0}</Text>
          </View>
        </View>
      </View>

      {/* Segmented Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'packs' && styles.tabActive]}
          onPress={() => setActiveTab('packs')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'packs' && styles.tabTextActive]}>
            Credit Packs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pricing' && styles.tabActive]}
          onPress={() => setActiveTab('pricing')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'pricing' && styles.tabTextActive]}>
            Service Rates
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Ledger History
          </Text>
        </TouchableOpacity>
      </View>

      {paymentSuccessMsg && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>{paymentSuccessMsg}</Text>
          <TouchableOpacity onPress={() => setPaymentSuccessMsg(null)}>
            <Text style={styles.bannerClose}>X</Text>
          </TouchableOpacity>
        </View>
      )}

      {paymentErrorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{paymentErrorMsg}</Text>
          <TouchableOpacity onPress={() => setPaymentErrorMsg(null)}>
            <Text style={styles.bannerClose}>X</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Credit Packs Tab */}
      {activeTab === 'packs' && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recharge Consultation Packs</Text>
          <Text style={styles.sectionSubtitle}>
            Direct billing via Razorpay • Credits never expire
          </Text>

          {pricingQuery.isPending ? (
            <ActivityIndicator style={styles.loader} color={colors.gold} />
          ) : (
            <View style={styles.packsGrid}>
              {(pricingData?.creditPacks ?? []).map((pack) => {
                const isBuying = purchasingPackId === pack.id;
                return (
                  <View key={pack.id} style={styles.packCard}>
                    {pack.badge && (
                      <View style={styles.packBadge}>
                        <Text style={styles.packBadgeText}>{pack.badge}</Text>
                      </View>
                    )}
                    <Text style={styles.packName}>{pack.name}</Text>
                    <Text style={styles.packDescription}>{pack.description}</Text>

                    <View style={styles.packCreditsRow}>
                      <Text style={styles.packCredits}>{pack.credits + (pack.bonusCredits || 0)}</Text>
                      <Text style={styles.packCreditsLabel}>Total Credits</Text>
                      {pack.bonusCredits > 0 && (
                        <Text style={styles.packBonus}>
                          (+{pack.bonusCredits} Bonus)
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.buyButton, isBuying && styles.buyButtonDisabled]}
                      onPress={() => buyPackMutation.mutate(pack)}
                      disabled={isBuying}
                      activeOpacity={0.85}
                    >
                      {isBuying ? (
                        <ActivityIndicator color={colors.textInverse} size="small" />
                      ) : (
                        <Text style={styles.buyButtonText}>
                          Recharge ₹{(pack.priceAmount / 100).toFixed(0)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Dynamic Service Rates Tab */}
      {activeTab === 'pricing' && (
        <View style={styles.guideContainer}>
          <View style={styles.guideCard}>
            <Text style={styles.guideCardTitle}>Consultation Economics</Text>
            <View style={styles.guideRow}>
              <Text style={styles.guideLabel}>Acharya Written Query</Text>
              <Text style={styles.guideValue}>
                {pricingData?.chat?.creditsPerMessage ?? 1} Credit / question
              </Text>
            </View>
            <View style={styles.guideRow}>
              <Text style={styles.guideLabel}>Live Voice Consultation</Text>
              <Text style={styles.guideValue}>
                {pricingData?.voice?.creditsPerUnit ?? 5} Credits / min
              </Text>
            </View>
            <View style={styles.guideRow}>
              <Text style={styles.guideLabel}>Voice Free Allowance</Text>
              <Text style={styles.guideValue}>First {pricingData?.voice?.freeInitialSeconds ?? 30}s complimentary</Text>
            </View>
            <View style={styles.guideRow}>
              <Text style={styles.guideLabel}>Welcome Signup Credits</Text>
              <Text style={styles.guideValue}>
                {pricingData?.freeCreditsOnSignup ?? 10} Credits included
              </Text>
            </View>
          </View>

          <View style={styles.guideCard}>
            <Text style={styles.guideCardTitle}>Astrology Reports Catalog</Text>
            {(pricingData?.reports ?? []).map((rep) => (
              <View key={rep.reportType} style={styles.reportGuideItem}>
                <View>
                  <Text style={styles.reportItemTitle}>{rep.title}</Text>
                  <Text style={styles.reportItemDesc}>{rep.description}</Text>
                </View>
                <View style={styles.reportPriceContainer}>
                  <Text style={styles.reportFinalPrice}>{rep.effectiveCredits} Credits</Text>
                  {rep.discountPercent > 0 && (
                    <Text style={styles.reportDiscountBadge}>
                      {rep.discountPercent}% off
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Ledger History Tab */}
      {activeTab === 'history' && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Transaction Ledger</Text>
          <Text style={styles.sectionSubtitle}>
            Complete record of credits added and consultation debits
          </Text>

          {transactionsQuery.isPending ? (
            <ActivityIndicator style={styles.loader} color={colors.gold} />
          ) : (transactionsQuery.data?.items ?? []).length === 0 ? (
            <Text style={styles.emptyText}>No transaction history found.</Text>
          ) : (
            <View style={styles.historyList}>
              {transactionsQuery.data?.items.map((tx: WalletTransactionDTO) => {
                const isCredit = tx.type === 'credit' || tx.type === 'bonus' || tx.type === 'promotional_credit' || tx.type === 'referral_credit';
                return (
                  <View key={tx.id} style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <View style={styles.historyTypeContainer}>
                        <Text
                          style={[
                            styles.historyTypeBadge,
                            isCredit ? styles.creditBadge : styles.debitBadge,
                          ]}
                        >
                          {isCredit ? '+ CREDIT' : '- DEBIT'}
                        </Text>
                        <Text style={styles.historySource}>{tx.source.replace(/_/g, ' ')}</Text>
                      </View>
                      <Text
                        style={[
                          styles.historyAmount,
                          isCredit ? styles.creditAmount : styles.debitAmount,
                        ]}
                      >
                        {isCredit ? `+${tx.amount}` : `-${tx.amount}`} Credits
                      </Text>
                    </View>
                    <View style={styles.historyFooter}>
                      <Text style={styles.historyBalance}>
                        Balance after: {tx.balanceAfter}
                      </Text>
                      <Text style={styles.historyDate}>
                        {new Date(tx.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  balanceCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  balanceSubtitle: {
    ...typography.overline,
    fontSize: 10,
    color: colors.textGold,
    letterSpacing: 0.8,
  },
  currencyPill: {
    backgroundColor: colors.backgroundHighlight,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  currencyPillText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.goldLight,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  balanceValue: {
    ...typography.display,
    fontSize: 34,
    color: colors.textPrimary,
  },
  balanceUnit: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statsDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  tabText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.goldLight,
  },
  sectionContainer: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  packsGrid: {
    gap: spacing.sm,
  },
  packCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    position: 'relative',
  },
  packBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  packBadgeText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textInverse,
    textTransform: 'uppercase',
  },
  packName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  packDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  packCreditsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: spacing.sm,
  },
  packCredits: {
    ...typography.h1,
    fontSize: 22,
    color: colors.textPrimary,
  },
  packBonus: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.success,
    marginLeft: 6,
  },
  packCreditsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  buyButton: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  buyButtonText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textInverse,
  },
  guideContainer: {
    gap: spacing.sm,
  },
  guideCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.xs,
  },
  guideCardTitle: {
    ...typography.h3,
    fontSize: 14,
    color: colors.goldLight,
    marginBottom: spacing.xs,
  },
  guideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  guideLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  guideValue: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reportGuideItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  reportItemTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reportItemDesc: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    maxWidth: 220,
  },
  reportPriceContainer: {
    alignItems: 'flex-end',
  },
  reportFinalPrice: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.goldLight,
  },
  reportDiscountBadge: {
    ...typography.caption,
    fontSize: 10,
    color: colors.success,
    fontWeight: '700',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
  historyList: {
    gap: spacing.xs,
  },
  historyCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyTypeBadge: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  creditBadge: {
    backgroundColor: colors.successBackground,
    color: colors.success,
  },
  debitBadge: {
    backgroundColor: colors.dangerBackground,
    color: colors.danger,
  },
  historySource: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  historyAmount: {
    ...typography.bodySecondary,
    fontWeight: '700',
  },
  creditAmount: {
    color: colors.success,
  },
  debitAmount: {
    color: colors.danger,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  historyBalance: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  historyDate: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  successBanner: {
    backgroundColor: colors.successBackground,
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successBannerText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },
  errorBanner: {
    backgroundColor: colors.dangerBackground,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorBannerText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
    flex: 1,
  },
  bannerClose: {
    ...typography.caption,
    color: colors.textMuted,
    paddingLeft: spacing.xs,
  },
});
