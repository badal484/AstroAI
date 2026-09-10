import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {
  DashaPeriodDetail,
  DashaTimelineResult,
} from '@astroai/shared-types';
import { fetchDashaTimeline } from '../../lib/pujaApi';
import { CreditBalanceBadge } from '../../components/ui/CreditBalanceBadge';
import { AstroIcon } from '../../components/ui/AstroIcon';
import { colors, radius, spacing, typography } from '../../theme';

function getNatureColor(nature: 'BENEFIC' | 'MALEFIC' | 'NEUTRAL') {
  switch (nature) {
    case 'BENEFIC':
      return { text: colors.success, bg: colors.successBackground, label: 'Benefic (शुभ)' };
    case 'MALEFIC':
      return { text: colors.danger, bg: colors.dangerBackground, label: 'Challenging (अशुभ)' };
    case 'NEUTRAL':
    default:
      return { text: colors.warning, bg: colors.warningBackground, label: 'Transformative (मिश्रित)' };
  }
}

export function DashaTimelineScreen() {
  const [timeline, setTimeline] = useState<DashaTimelineResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMahadasha, setSelectedMahadasha] = useState<DashaPeriodDetail | null>(null);

  useEffect(() => {
    loadDasha();
  }, []);

  const loadDasha = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDashaTimeline();
      setTimeline(data);
      setSelectedMahadasha(data.currentMahadasha);
    } catch (err: any) {
      setError(err?.message || 'Failed to calculate Vimshottari dasha timeline');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Calculating 120-Year Vimshottari Cycles...</Text>
      </View>
    );
  }

  if (error || !timeline) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Failed to load timeline'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadDasha}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { currentMahadasha, currentAntardasha, currentPratyantardasha } = timeline;
  const currentNature = getNatureColor(currentMahadasha.nature);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>Vimshottari Dasha Explorer</Text>
          <Text style={styles.screenSubtitle}>120-Year Planetary Life Timeline</Text>
        </View>
        <CreditBalanceBadge />
      </View>

      {/* Hero: Active Planetary Period Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={[styles.natureBadge, { backgroundColor: currentNature.bg }]}>
            <Text style={[styles.natureText, { color: currentNature.text }]}>
              {currentNature.label}
            </Text>
          </View>
          <Text style={styles.nakshatraTag}>Moon: {timeline.moonNakshatra}</Text>
        </View>

        <Text style={styles.heroMahadashaTitle}>{currentMahadasha.sanskritName}</Text>
        <Text style={styles.heroDates}>
          {currentMahadasha.startDate} to {currentMahadasha.endDate} ({currentMahadasha.durationYears} Years)
        </Text>

        {/* 3-Level Sub-Period Grid */}
        <View style={styles.subPeriodGrid}>
          <View style={styles.subPeriodItem}>
            <Text style={styles.subPeriodLabel}>MAHADASHA</Text>
            <Text style={styles.subPeriodVal}>{currentMahadasha.planet}</Text>
            <Text style={styles.subPeriodScore}>{currentMahadasha.auspiciousScore}% Auspicious</Text>
          </View>
          <View style={styles.subPeriodItem}>
            <Text style={styles.subPeriodLabel}>ANTARDASHA</Text>
            <Text style={styles.subPeriodVal}>{currentAntardasha.planet}</Text>
            <Text style={styles.subPeriodScore}>{currentAntardasha.auspiciousScore}% Potency</Text>
          </View>
          <View style={styles.subPeriodItem}>
            <Text style={styles.subPeriodLabel}>PRATYANTAR</Text>
            <Text style={styles.subPeriodVal}>{currentPratyantardasha.planet}</Text>
            <Text style={styles.subPeriodScore}>Active Now</Text>
          </View>
        </View>

        {/* Focus Keywords */}
        <View style={styles.keywordsRow}>
          {currentMahadasha.focusKeywords.map((kw, i) => (
            <View key={i} style={styles.keywordBadge}>
              <Text style={styles.keywordText}>{kw}</Text>
            </View>
          ))}
        </View>

        {/* Parashara Effects Summary */}
        <Text style={styles.effectsText}>{currentMahadasha.effectsSummary}</Text>
      </View>

      {/* Classical Upay & Sadhana Card */}
      <View style={styles.remedyCard}>
        <Text style={styles.remedyCardTitle}>Active Dasha Remedies & Graha Upay</Text>
        <Text style={styles.remedyCardSub}>
          Recommended remedies for running {currentMahadasha.planet}-{currentAntardasha.planet} period
        </Text>
        <View style={styles.remedyList}>
          {currentMahadasha.recommendedUpays.map((upay, idx) => (
            <View key={idx} style={styles.remedyRow}>
              <AstroIcon name="sparkle" size={9} color={colors.primary} style={{ marginTop: 2, marginRight: 6 }} />
              <Text style={styles.remedyItemText}>{upay}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 120-Year Full Cycle Timeline */}
      <View style={styles.cycleSection}>
        <Text style={styles.cycleSectionTitle}>120-Year Vimshottari Mahadasha Cycles</Text>
        <Text style={styles.cycleSectionSub}>
          Tap any planetary period to view deep Parashara interpretations
        </Text>

        <View style={styles.cycleList}>
          {timeline.allMahadashas.map((md, idx) => {
            const isSelected = selectedMahadasha?.planet === md.planet;
            const mdNature = getNatureColor(md.nature);
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.cycleCard,
                  md.isCurrent && styles.cycleCardCurrent,
                  isSelected && styles.cycleCardSelected,
                ]}
                onPress={() => setSelectedMahadasha(md)}
                activeOpacity={0.8}
              >
                <View style={styles.cycleCardHeader}>
                  <View style={styles.cyclePlanetRow}>
                    <Text style={styles.cyclePlanetName}>{md.planet}</Text>
                    {md.isCurrent && (
                      <View style={styles.runningBadge}>
                        <Text style={styles.runningBadgeText}>RUNNING</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.cycleNature, { color: mdNature.text }]}>
                    {md.auspiciousScore}% {md.nature}
                  </Text>
                </View>

                <Text style={styles.cycleDates}>
                  {md.startDate} to {md.endDate} • {md.durationYears} yrs
                </Text>

                <View style={styles.cycleKeywordsRow}>
                  {md.focusKeywords.slice(0, 3).map((k, ki) => (
                    <Text key={ki} style={styles.cycleKeywordPill}>
                      • {k}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
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
    color: colors.textPrimary,
    fontWeight: '700',
  },
  screenSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  heroCard: {
    backgroundColor: colors.backgroundCard,
    margin: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  natureBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  natureText: {
    ...typography.caption,
    fontWeight: '700',
  },
  nakshatraTag: {
    ...typography.caption,
    color: colors.textMuted,
  },
  heroMahadashaTitle: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  heroDates: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  subPeriodGrid: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: spacing.xs,
  },
  subPeriodItem: {
    flex: 1,
    alignItems: 'center',
  },
  subPeriodLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  subPeriodVal: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  subPeriodScore: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  keywordBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  keywordText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  effectsText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  remedyCard: {
    backgroundColor: colors.backgroundCard,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  remedyCardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  remedyCardSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  remedyList: {
    gap: spacing.xs,
  },
  remedyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  remedyBullet: {
    color: colors.primary,
    fontSize: 10,
    marginRight: 6,
    marginTop: 3,
  },
  remedyItemText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  cycleSection: {
    marginHorizontal: spacing.md,
    gap: spacing.xs,
  },
  cycleSectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  cycleSectionSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cycleList: {
    gap: spacing.xs,
  },
  cycleCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.sm,
    gap: 4,
  },
  cycleCardCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cycleCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cycleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cyclePlanetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cyclePlanetName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  runningBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  runningBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cycleNature: {
    ...typography.caption,
    fontWeight: '700',
  },
  cycleDates: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cycleKeywordsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  cycleKeywordPill: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
