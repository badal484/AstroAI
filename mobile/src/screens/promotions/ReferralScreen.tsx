import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ReferralRecordDTO, UserReferralSummaryDTO } from '@astroai/shared-types';
import { promotionApi } from '../../lib/promotionApi';
import { colors, radius, spacing, typography } from '../../theme';

export function ReferralScreen() {
  const [summary, setSummary] = useState<UserReferralSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [claiming, setClaiming] = useState(false);

  const fetchReferralData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await promotionApi.getUserReferralSummary();
      setSummary(data);
    } catch {
      Alert.alert('Error', 'Failed to load referral summary');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReferralData();
    }, [fetchReferralData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReferralData();
  };

  const handleShare = async () => {
    if (!summary) return;
    try {
      await Share.share({
        message: `Join me on AstroAI to unlock personalized Vedic Kundli & astrological guidance! Use my invite code: ${summary.referralCode} to get 25 FREE bonus credits! ${summary.referralLink}`,
      });
    } catch {
      // Dismiss
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    Alert.alert('Copied to Clipboard', `Referral code "${summary.referralCode}" copied!`);
  };

  const handleClaim = async () => {
    if (!claimCode.trim() || claiming) {
      return;
    }
    setClaiming(true);
    try {
      await promotionApi.claimReferralCode({ referralCode: claimCode.trim() });
      Alert.alert('Success', 'Referral code claimed! 25 bonus credits added to your wallet.');
      setClaimCode('');
      await fetchReferralData();
    } catch (err: any) {
      Alert.alert('Claim Error', err.message || 'Failed to claim referral code');
    } finally {
      setClaiming(false);
    }
  };

  const renderHeader = () => {
    if (!summary) return null;

    return (
      <View style={styles.headerWrapper}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroBadge}>CELESTIAL REWARD PROGRAM</Text>
          <Text style={styles.heroTitle}>Invite Friends, Share Cosmic Wisdom</Text>
          <Text style={styles.heroSubtitle}>
            Give friends 25 free credits upon sign-up. Earn 25 credits when they make their first consultation or report purchase!
          </Text>

          {/* Referral Code Box */}
          <View style={styles.codeBox}>
            <View style={styles.codeTextGroup}>
              <Text style={styles.codeLabel}>YOUR UNIQUE INVITE CODE</Text>
              <Text testID="user-referral-code" style={styles.codeValue}>
                {summary.referralCode}
              </Text>
            </View>
            <TouchableOpacity
              testID="copy-referral-btn"
              onPress={handleCopy}
              style={styles.copyButton}
            >
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>

          {/* Share Button */}
          <TouchableOpacity
            testID="share-referral-btn"
            onPress={handleShare}
            style={styles.shareButton}
          >
            <Text style={styles.shareButtonText}>Share Invite Link</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Invites</Text>
            <Text style={styles.statValue}>{summary.totalReferrals}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Rewarded</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {summary.successfulReferrals}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {summary.pendingReferrals}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Credits Earned</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              +{summary.totalCreditsEarned}
            </Text>
          </View>
        </View>

        {/* Claim Code Section */}
        <View style={styles.claimSection}>
          <Text style={styles.sectionTitle}>Have an Invite Code?</Text>
          <Text style={styles.sectionSubtitle}>
            Enter your friend's referral code to instantly receive 25 welcome credits.
          </Text>
          <View style={styles.claimRow}>
            <TextInput
              testID="claim-code-input"
              value={claimCode}
              onChangeText={(t) => setClaimCode(t.toUpperCase())}
              placeholder="e.g. ASTRO89X"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              style={styles.claimInput}
            />
            <TouchableOpacity
              testID="submit-claim-btn"
              onPress={handleClaim}
              disabled={claiming}
              style={[styles.claimButton, (!claimCode.trim() || claiming) && styles.claimButtonDisabled]}
            >
              {claiming ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.claimButtonText}>Claim</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>
          Invite History ({summary.history.length})
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: ReferralRecordDTO }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyTopRow}>
        <Text style={styles.historyUserText}>
          Friend ({item.refereeId.slice(-6).toUpperCase()})
        </Text>
        <View
          style={[
            styles.statusBadge,
            item.status === 'rewarded'
              ? styles.statusBadgeRewarded
              : item.status === 'pending'
                ? styles.statusBadgePending
                : styles.statusBadgeRejected,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.status === 'rewarded'
                ? styles.statusTextRewarded
                : item.status === 'pending'
                  ? styles.statusTextPending
                  : styles.statusTextRejected,
            ]}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.historyBottomRow}>
        <Text style={styles.historyRewardText}>
          Reward: +{item.referrerRewardCredits} Credits
        </Text>
        <Text style={styles.historyDateText}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && !summary ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={summary?.history || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader() || undefined}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No friend invites yet.</Text>
              <Text style={styles.emptySubtext}>Share your code above to start earning bonus credits!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  headerWrapper: {
    marginBottom: spacing.xs,
  },
  heroCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  heroBadge: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroTitle: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  heroSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  codeTextGroup: {
    flex: 1,
  },
  codeLabel: {
    ...typography.overline,
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  codeValue: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: colors.primary,
    letterSpacing: 1,
    marginTop: 2,
  },
  copyButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  copyButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  claimSection: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  claimRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  claimInput: {
    flex: 1,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  claimButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimButtonDisabled: {
    opacity: 0.4,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  historyCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.xs,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyUserText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusBadgeRewarded: {
    backgroundColor: colors.successBackground,
    borderWidth: 1,
    borderColor: colors.success,
  },
  statusBadgePending: {
    backgroundColor: colors.warningBackground,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  statusBadgeRejected: {
    backgroundColor: colors.dangerBackground,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  statusText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextRewarded: {
    color: colors.success,
  },
  statusTextPending: {
    color: colors.warning,
  },
  statusTextRejected: {
    color: colors.danger,
  },
  historyBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyRewardText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  historyDateText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
