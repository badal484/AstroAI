import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getDailyDispatch } from '../../lib/astrologyApi';
import { AstroIcon } from '../ui/AstroIcon';
import { colors, radius, spacing, typography } from '../../theme';

export function DailyDispatchCard() {
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: dispatch, isLoading } = useQuery({
    queryKey: ['dailyDispatch'],
    queryFn: () => getDailyDispatch(),
  });

  if (isLoading || !dispatch) {
    return null;
  }

  return (
    <View style={styles.card}>
      {/* Top Sacred Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <AstroIcon name="sun" size={20} color={colors.primary} />
          <View>
            <Text style={styles.headerTitle}>Brahma Muhurat Daily Dispatch</Text>
            <Text style={styles.headerSubtitle}>{dispatch.nakshatra}</Text>
          </View>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{dispatch.cosmicScore}% Cosmic Aura</Text>
        </View>
      </View>

      {/* Audio Brief Player Banner */}
      <TouchableOpacity
        style={[styles.audioPlayer, isPlaying && styles.audioPlayerActive]}
        onPress={() => setIsPlaying(!isPlaying)}
        accessibilityRole="button"
        activeOpacity={0.8}
      >
        <View style={styles.playBtn}>
          <AstroIcon name={isPlaying ? 'pause' : 'play'} size={12} color="#FFFFFF" />
        </View>
        <View style={styles.audioMeta}>
          <Text style={styles.audioTitle}>
            {isPlaying ? 'Listening to Morning Cosmic Briefing…' : 'Listen to Morning Cosmic Briefing'}
          </Text>
          <Text style={styles.audioDuration}>1:30 min • Personalized by Acharya</Text>
        </View>
      </TouchableOpacity>

      {/* Auspicious Timings Strip */}
      <View style={styles.timingsRow}>
        <View style={[styles.timingPill, styles.timingPillSuccess]}>
          <Text style={styles.timingLabel}>ABHIJIT MUHURAT</Text>
          <Text style={styles.timingValue}>{dispatch.abhijitMuhurat}</Text>
        </View>
        <View style={[styles.timingPill, styles.timingPillCaution]}>
          <Text style={styles.timingLabelCaution}>RAHU KAAL</Text>
          <Text style={styles.timingValueCaution}>{dispatch.rahuKaal}</Text>
        </View>
      </View>

      {/* Daily Micro-Sadhana Mantra */}
      {dispatch.dailySadhanaMantra && (
        <View style={styles.mantraCard}>
          <View style={styles.mantraHeader}>
            <Text style={styles.mantraTitle}>DAILY SANKALPA MANTRA</Text>
            <Text style={styles.mantraCount}>{dispatch.dailySadhanaMantra.targetChants} Chants</Text>
          </View>
          <Text style={styles.sanskritMantra}>{dispatch.dailySadhanaMantra.sanskrit}</Text>
          <Text style={styles.mantraMeaning}>{dispatch.dailySadhanaMantra.meaning}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    flex: 1,
  },
  sunIcon: {
    fontSize: 22,
  },
  headerTitle: {
    ...typography.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.goldLight,
  },
  headerSubtitle: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  scoreBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  audioPlayerActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnIcon: {
    fontSize: 14,
  },
  audioMeta: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  audioDuration: {
    fontSize: 9.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  timingsRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  timingPill: {
    flex: 1,
    padding: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  timingPillSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  timingPillCaution: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  timingLabel: {
    ...typography.overline,
    fontSize: 8,
    color: '#22c55e',
    marginBottom: 2,
  },
  timingLabelCaution: {
    ...typography.overline,
    fontSize: 8,
    color: '#ef4444',
    marginBottom: 2,
  },
  timingValue: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timingValueCaution: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mantraCard: {
    backgroundColor: colors.backgroundCardElevated,
    borderRadius: radius.sm,
    padding: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  mantraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  mantraTitle: {
    ...typography.overline,
    fontSize: 8.5,
    color: colors.textGold,
  },
  mantraCount: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.gold,
  },
  sanskritMantra: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.goldLight,
    textAlign: 'center',
    marginVertical: 2,
  },
  mantraMeaning: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
