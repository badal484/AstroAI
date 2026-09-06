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
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              {summary.successfulReferrals}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>
              {summary.pendingReferrals}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Credits Earned</Text>
            <Text style={[styles.statValue, { color: '#6366f1' }]}>
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
              placeholderTextColor="#64748b"
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
                <ActivityIndicator size="small" color="#030712" />
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
          <ActivityIndicator size="large" color="#f59e0b" />
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
              tintColor="#f59e0b"
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
    backgroundColor: '#090d16',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerWrapper: {
    marginBottom: 8,
  },
  heroCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 16,
  },
  heroBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 16,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  codeTextGroup: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  codeValue: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#fbbf24',
    letterSpacing: 1,
    marginTop: 2,
  },
  copyButton: {
    backgroundColor: '#1f2937',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  copyButtonText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  shareButtonText: {
    color: '#030712',
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  claimSection: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    marginBottom: 12,
  },
  claimRow: {
    flexDirection: 'row',
    gap: 8,
  },
  claimInput: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  claimButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimButtonDisabled: {
    opacity: 0.4,
  },
  claimButtonText: {
    color: '#030712',
    fontWeight: '700',
    fontSize: 13,
  },
  historyCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 8,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyUserText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeRewarded: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statusBadgeRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextRewarded: {
    color: '#10b981',
  },
  statusTextPending: {
    color: '#f59e0b',
  },
  statusTextRejected: {
    color: '#ef4444',
  },
  historyBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyRewardText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  historyDateText: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  emptySubtext: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
    textAlign: 'center',
  },
});
