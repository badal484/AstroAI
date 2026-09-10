import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export interface CosmicRadarProps {
  score?: number;
  rating?: string;
  horaName?: string;
  horaActivities?: string;
  rahuKaalStatus?: string;
  abhijitMuhurat?: string;
  luckyColor?: string;
  luckyColorHex?: string;
  luckyNumber?: number;
  luckyDirection?: string;
  gemstone?: string;
  onAskMuhurat?: () => void;
}

export function CosmicRadarCard({
  score = 88,
  rating = 'Param Shubh (Exceptional)',
  horaName = 'Guru Hora (Jupiter)',
  horaActivities = 'Financial growth, auspicious beginnings, learning',
  rahuKaalStatus = 'Starts in 1h 15m',
  abhijitMuhurat = '11:48 AM - 12:36 PM',
  luckyColor = 'Electric Indigo',
  luckyColorHex = '#4F46E5',
  luckyNumber = 3,
  luckyDirection = 'North-East (Ishanya)',
  gemstone = 'Yellow Sapphire (Pukhraj)',
  onAskMuhurat,
}: CosmicRadarProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>LIVE COSMIC RADAR</Text>
          <Text style={styles.headerSubtitle}>Real-time Planetary Energy & Transit Index</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.radarMainRow}>
        {/* Animated Score Meter */}
        <Animated.View style={[styles.scoreCircle, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.scoreNumber}>{score}%</Text>
          <Text style={styles.scoreUnit}>Alignment</Text>
        </Animated.View>

        <View style={styles.radarMainInfo}>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
          <Text style={styles.horaTitle}>{horaName}</Text>
          <Text style={styles.horaDesc}>{horaActivities}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Real-Time Muhurat Windows */}
      <View style={styles.muhuratGrid}>
        <View style={styles.muhuratBox}>
          <Text style={styles.muhuratLabel}>ABHIJIT MUHURAT</Text>
          <Text style={styles.muhuratValueAuspicious}>{abhijitMuhurat}</Text>
        </View>

        <View style={styles.muhuratBox}>
          <Text style={styles.muhuratLabel}>RAHU KAAL</Text>
          <Text style={styles.muhuratValueCaution}>{rahuKaalStatus}</Text>
        </View>
      </View>

      {/* Lucky Day Factors */}
      <View style={styles.luckyRow}>
        <View style={styles.luckyChip}>
          <View style={[styles.colorDot, { backgroundColor: luckyColorHex }]} />
          <Text style={styles.luckyText}>{luckyColor}</Text>
        </View>

        <View style={styles.luckyChip}>
          <Text style={styles.luckyTag}>NUM</Text>
          <Text style={styles.luckyText}>{luckyNumber}</Text>
        </View>

        <View style={styles.luckyChip}>
          <Text style={styles.luckyTag}>DIR</Text>
          <Text style={styles.luckyText}>{luckyDirection.split(' ')[0]}</Text>
        </View>

        <View style={styles.luckyChip}>
          <Text style={styles.luckyTag}>GEM</Text>
          <Text style={styles.luckyText}>{gemstone.split(' ')[0]}</Text>
        </View>
      </View>

      {onAskMuhurat && (
        <TouchableOpacity style={styles.actionButton} onPress={onAskMuhurat} accessibilityRole="button">
          <Text style={styles.actionButtonText}>Consult Acharya on Today's Muhurat ›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.overline,
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerSubtitle: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ef4444',
  },
  radarMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 2,
  },
  scoreCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  scoreUnit: {
    fontSize: 8,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  radarMainInfo: {
    flex: 1,
  },
  ratingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.successBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.success,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  horaTitle: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  horaDesc: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 14,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.sm,
  },
  muhuratGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  muhuratBox: {
    flex: 1,
    backgroundColor: colors.backgroundElevated,
    padding: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  muhuratLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  muhuratValueAuspicious: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    marginTop: 2,
  },
  muhuratValueCaution: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
    marginTop: 2,
  },
  luckyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  luckyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  luckyIcon: {
    fontSize: 10,
  },
  luckyTag: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  luckyText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
