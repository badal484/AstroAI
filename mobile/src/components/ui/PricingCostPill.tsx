import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface PricingCostPillProps {
  cost: number | string;
  unit?: string;
  isFree?: boolean;
  freeLabel?: string;
  variant?: 'gold' | 'green' | 'muted' | 'subtle';
}

export function PricingCostPill({
  cost,
  unit,
  isFree = false,
  freeLabel = 'Included',
  variant = 'gold',
}: PricingCostPillProps) {
  if (isFree) {
    return (
      <View style={[styles.pill, styles.freePill]}>
        <View style={styles.greenDot} />
        <Text style={styles.freeText}>{freeLabel}</Text>
      </View>
    );
  }

  const isGreen = variant === 'green';
  const isMuted = variant === 'muted';
  const isSubtle = variant === 'subtle';

  return (
    <View
      style={[
        styles.pill,
        isGreen && styles.greenPill,
        isMuted && styles.mutedPill,
        isSubtle && styles.subtlePill,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Cost: ${cost} ${unit ?? 'Credits'}`}
    >
      <View style={[styles.goldDot, isGreen && styles.greenDot]} />
      <Text
        style={[
          styles.costText,
          isGreen && styles.greenText,
          isMuted && styles.mutedText,
          isSubtle && styles.subtleText,
        ]}
      >
        {cost} {unit ? unit : 'Credits'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundHighlight,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.sm,
    paddingVertical: 3,
    paddingHorizontal: spacing.xs + 2,
    gap: 5,
    alignSelf: 'flex-start',
  },
  goldDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.gold,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.success,
  },
  costText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textGold,
  },
  freePill: {
    backgroundColor: colors.successBackground,
    borderColor: colors.success,
  },
  freeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  greenPill: {
    backgroundColor: colors.successBackground,
    borderColor: colors.success,
  },
  greenText: {
    color: colors.success,
  },
  mutedPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: colors.borderSubtle,
  },
  mutedText: {
    color: colors.textSecondary,
  },
  subtlePill: {
    backgroundColor: 'transparent',
    borderColor: colors.borderSubtle,
  },
  subtleText: {
    color: colors.textSecondary,
  },
});
