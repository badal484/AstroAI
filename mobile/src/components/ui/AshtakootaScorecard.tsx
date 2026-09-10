import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export interface KootaScore {
  name: string;
  sanskritName: string;
  obtained: number;
  maximum: number;
  description: string;
}

export interface CompatibilityReportData {
  totalScore: number;
  maximumScore: number;
  percentage: number;
  verdict: string;
  hasManglikDosha: boolean;
  hasNadiDosha: boolean;
  kootas: KootaScore[];
  summary: string;
}

const DEFAULT_KOOTAS: KootaScore[] = [
  { name: 'Varna', sanskritName: 'वर्ण', obtained: 1, maximum: 1, description: 'Spiritual inclination & ego compatibility' },
  { name: 'Vashya', sanskritName: 'वश्य', obtained: 2, maximum: 2, description: 'Mutual attraction & emotional dominance balance' },
  { name: 'Tara', sanskritName: 'तारा', obtained: 3, maximum: 3, description: 'Destiny, health & longevity synergy' },
  { name: 'Yoni', sanskritName: 'योनि', obtained: 3, maximum: 4, description: 'Biological & intimacy affinity' },
  { name: 'Graha Maitri', sanskritName: 'ग्रह मैत्री', obtained: 5, maximum: 5, description: 'Mental harmony & psychological bonding' },
  { name: 'Gana', sanskritName: 'गण', obtained: 6, maximum: 6, description: 'Temperament (Deva, Manushya, Rakshasa)' },
  { name: 'Bhakoot', sanskritName: 'भकूट', obtained: 7, maximum: 7, description: 'Family welfare, prosperity & romance' },
  { name: 'Nadi', sanskritName: 'नाड़ी', obtained: 8, maximum: 8, description: 'Genetics, progeny & biological compatibility' },
];

export function AshtakootaScorecard({
  data = {
    totalScore: 35,
    maximumScore: 36,
    percentage: 97.2,
    verdict: 'Uttam Vivah Yog (Excellent Harmony)',
    hasManglikDosha: false,
    hasNadiDosha: false,
    kootas: DEFAULT_KOOTAS,
    summary: 'The planetary alignment exhibits profound emotional, intellectual, and dharmic alignment between both birth charts.',
  },
}: {
  data?: CompatibilityReportData;
}) {
  const isExcellent = data.totalScore >= 28;
  const isModerate = data.totalScore >= 18 && data.totalScore < 28;

  return (
    <View style={styles.container}>
      {/* Overall Score Banner */}
      <View style={styles.scoreBanner}>
        <View style={styles.scoreRing}>
          <Text style={styles.scoreNumber}>{data.totalScore}</Text>
          <Text style={styles.scoreMax}>/ {data.maximumScore}</Text>
        </View>

        <View style={styles.scoreInfo}>
          <Text
            style={[
              styles.verdictText,
              isExcellent && styles.verdictExcellent,
              isModerate && styles.verdictModerate,
            ]}
          >
            {data.verdict}
          </Text>
          <Text style={styles.percentageText}>{data.percentage.toFixed(1)}% Guna Alignment</Text>
          <Text style={styles.summaryText}>{data.summary}</Text>
        </View>
      </View>

      {/* Dosha Status Badges */}
      <View style={styles.doshaRow}>
        <View style={[styles.doshaBadge, !data.hasManglikDosha && styles.doshaClear]}>
          <View style={[styles.statusDot, { backgroundColor: data.hasManglikDosha ? colors.warning : colors.success }]} />
          <Text style={styles.doshaText}>
            {data.hasManglikDosha ? 'Manglik Dosha Detected' : 'No Manglik Dosha'}
          </Text>
        </View>

        <View style={[styles.doshaBadge, !data.hasNadiDosha && styles.doshaClear]}>
          <View style={[styles.statusDot, { backgroundColor: data.hasNadiDosha ? colors.warning : colors.success }]} />
          <Text style={styles.doshaText}>
            {data.hasNadiDosha ? 'Nadi Dosha Present' : 'Nadi Compatible'}
          </Text>
        </View>
      </View>

      {/* 8-Koota Detailed Table */}
      <Text style={styles.sectionTitle}>ASHTAKOOTA 36 GUNA MILAN BREAKDOWN</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colKoota]}>Koota</Text>
          <Text style={[styles.thText, styles.colSignificance]}>Significance</Text>
          <Text style={[styles.thText, styles.colPoints]}>Score</Text>
        </View>

        {data.kootas.map((k, index) => {
          const isFullPoints = k.obtained === k.maximum;
          return (
            <View
              key={k.name}
              style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
            >
              <View style={styles.colKoota}>
                <Text style={styles.kootaName}>{k.name}</Text>
                <Text style={styles.kootaSanskrit}>{k.sanskritName}</Text>
              </View>

              <View style={styles.colSignificance}>
                <Text style={styles.significanceText}>{k.description}</Text>
              </View>

              <View style={[styles.colPoints, styles.scoreTagContainer]}>
                <View
                  style={[
                    styles.scoreTag,
                    isFullPoints ? styles.scoreTagFull : styles.scoreTagPartial,
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreTagText,
                      isFullPoints ? styles.scoreTextFull : styles.scoreTextPartial,
                    ]}
                  >
                    {k.obtained} / {k.maximum}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginVertical: spacing.xs,
  },
  scoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    gap: spacing.md,
  },
  scoreRing: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  scoreNumber: {
    ...typography.h1,
    color: colors.primary,
    lineHeight: 26,
  },
  scoreMax: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  scoreInfo: {
    flex: 1,
  },
  verdictText: {
    ...typography.h3,
    fontSize: 15,
    color: colors.primary,
  },
  verdictExcellent: {
    color: colors.success,
  },
  verdictModerate: {
    color: colors.warning,
  },
  percentageText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginVertical: 2,
  },
  summaryText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  doshaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  doshaBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningBackground,
    borderWidth: 1,
    borderColor: colors.warning,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  doshaClear: {
    backgroundColor: colors.successBackground,
    borderColor: colors.success,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  doshaText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  sectionTitle: {
    ...typography.overline,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  table: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundElevated,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  thText: {
    ...typography.overline,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  colKoota: {
    width: '28%',
  },
  colSignificance: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  colPoints: {
    width: '22%',
    alignItems: 'flex-end',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  tableRowAlt: {
    backgroundColor: colors.backgroundElevated,
  },
  kootaName: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  kootaSanskrit: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primary,
  },
  significanceText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 14,
  },
  scoreTagContainer: {
    alignItems: 'flex-end',
  },
  scoreTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
  },
  scoreTagFull: {
    backgroundColor: colors.successBackground,
    borderWidth: 1,
    borderColor: colors.success,
  },
  scoreTagPartial: {
    backgroundColor: colors.warningBackground,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  scoreTagText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  scoreTextFull: {
    color: colors.success,
  },
  scoreTextPartial: {
    color: colors.warning,
  },
});
