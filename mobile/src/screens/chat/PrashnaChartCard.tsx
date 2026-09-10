import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AstroIcon } from '../../components/ui/AstroIcon';
import { colors, radius, spacing, typography } from '../../theme';

interface PrashnaChartCardProps {
  data: {
    prashnaLagna: string;
    moonNakshatra: string;
    moonSign?: string;
    verdict: string;
    verdictBadge?: string;
    timingEstimate: string;
    yoga?: string;
    remedy: string;
  };
}

export function PrashnaChartCard({ data }: PrashnaChartCardProps) {
  const isFavorable = data.verdictBadge === 'favorable' || data.verdict?.toLowerCase().includes('shubh') || data.verdict?.toLowerCase().includes('favorable');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AstroIcon name="bolt" size={13} color={colors.primary} />
          <Text style={styles.title}>Horary Prashna Kundli</Text>
        </View>
        <View style={[styles.badge, isFavorable ? styles.badgeSuccess : styles.badgeWarning]}>
          <Text style={[styles.badgeText, isFavorable ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
            {data.verdict || 'Favorable'}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>PRASHNA LAGNA</Text>
          <Text style={styles.metricValue}>{data.prashnaLagna?.toUpperCase()}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>MOON NAKSHATRA</Text>
          <Text style={styles.metricValue}>{data.moonNakshatra}</Text>
        </View>
      </View>

      {data.yoga && (
        <View style={styles.yogaPill}>
          <AstroIcon name="sparkle" size={11} color={colors.primary} />
          <Text style={styles.yogaText}>{data.yoga}</Text>
        </View>
      )}

      <View style={styles.timingSection}>
        <Text style={styles.sectionLabel}>TIMING WINDOW</Text>
        <Text style={styles.timingText}>{data.timingEstimate}</Text>
      </View>

      {data.remedy && (
        <View style={styles.remedyBox}>
          <View style={styles.remedyLabelRow}>
            <AstroIcon name="flame" size={10} color={colors.primary} />
            <Text style={styles.remedyLabel}>PRASHNA UPAY</Text>
          </View>
          <Text style={styles.remedyText}>{data.remedy}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  badgeWarning: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextSuccess: {
    color: colors.success,
  },
  badgeTextWarning: {
    color: colors.warning,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs + 2,
  },
  metricItem: {
    flex: 1,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.sm,
    padding: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  metricLabel: {
    ...typography.overline,
    fontSize: 8.5,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
  },
  yogaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    marginBottom: spacing.xs + 2,
  },
  yogaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  timingSection: {
    marginBottom: spacing.xs + 2,
  },
  sectionLabel: {
    ...typography.overline,
    fontSize: 8.5,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  timingText: {
    ...typography.bodySecondary,
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  remedyBox: {
    backgroundColor: colors.backgroundElevated,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: spacing.xs + 2,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  remedyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  remedyLabel: {
    ...typography.overline,
    fontSize: 9,
    color: colors.primary,
  },
  remedyText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
});
