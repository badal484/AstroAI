import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ReportSummaryDTO } from '@astroai/shared-types';
import { reportApi } from '../../lib/reportApi';
import type { AppStackParamList } from '../../navigation/AppStack';
import { colors, radius, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function ReportHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const [reports, setReports] = useState<ReportSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await reportApi.listReports({ limit: 50 });
      setReports(res.items);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'COMPLETED', bg: colors.successBackground, text: colors.success };
      case 'failed':
        return { label: 'FAILED', bg: colors.dangerBackground, text: colors.danger };
      case 'queued':
        return { label: 'QUEUED', bg: colors.warningBackground, text: colors.warning };
      case 'calculating':
        return { label: 'CALCULATING', bg: colors.indigoMuted, text: colors.primary };
      case 'interpreting':
        return { label: 'SYNTHESIZING', bg: colors.indigoMuted, text: colors.primary };
      case 'generating_pdf':
        return { label: 'GENERATING PDF', bg: colors.backgroundElevated, text: colors.textSecondary };
      default:
        return { label: status.toUpperCase(), bg: colors.backgroundElevated, text: colors.textMuted };
    }
  };

  const renderReportItem = ({ item }: { item: ReportSummaryDTO }) => {
    const badge = getStatusBadge(item.status);
    const dateStr = new Date(item.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ReportViewer' as any, { reportId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle}>{item.reportType.replace(/_/g, ' ').toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.cardDetailRow}>
          <Text style={styles.cardDate}>Ordered on {dateStr}</Text>
          <Text style={styles.cardCredits}>{item.title}</Text>
        </View>

        {item.status === 'failed' && (
          <View style={styles.failureNoteContainer}>
            <View style={styles.failureDot} />
            <Text style={styles.failureNote} numberOfLines={2}>
              Generation pipeline encountered an error. Tap to retry.
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading report history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBadge}>
            <Text style={styles.emptyIconLetter}>R</Text>
          </View>
          <Text style={styles.emptyTitle}>No Astrology Reports Yet</Text>
          <Text style={styles.emptySubtitle}>
            Order a full Vedic Kundli, Ashtakoota compatibility Milan, or Career forecast.
          </Text>
          <TouchableOpacity
            style={styles.orderBtn}
            onPress={() => navigation.navigate('ReportCatalog' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.orderBtnText}>Explore Report Catalog</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderReportItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.xs + 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cardCredits: {
    ...typography.bodySecondary,
    color: colors.primary,
    fontWeight: '600',
  },
  failureNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerBackground,
    padding: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  failureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
  failureNote: {
    ...typography.caption,
    color: colors.danger,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyIconBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.indigoMuted,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyIconLetter: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  orderBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  orderBtnText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
