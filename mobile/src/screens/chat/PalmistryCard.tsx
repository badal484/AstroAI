import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AstroIcon } from '../../components/ui/AstroIcon';
import { colors, radius, spacing, typography } from '../../theme';

interface PalmistryCardProps {
  data: {
    hand?: string;
    elementalType?: string;
    overallScore?: number;
    lines?: {
      lifeLine?: { name: string; prominence: string; vitality?: string };
      heartLine?: { name: string; prominence: string; quality?: string };
      headLine?: { name: string; prominence: string; focus?: string };
      fateLine?: { name: string; prominence: string; career?: string };
    };
    mounts?: Array<{ name: string; status: string; score: number }>;
    synthesis?: string;
  };
}

export function PalmistryCard({ data }: PalmistryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AstroIcon name="palm" size={14} color={colors.primary} />
          <Text style={styles.title}>Hasta Rekha Samudrika</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{data.overallScore ?? 89}% Match</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        {data.hand ?? 'Right Hand'} • {data.elementalType ?? 'Earth (Prithvi) Element'}
      </Text>

      {/* Primary Lines Grid */}
      <View style={styles.linesContainer}>
        <View style={styles.lineRow}>
          <View style={styles.lineBullet} />
          <View style={styles.lineInfo}>
            <Text style={styles.lineName}>आयुष्य रेखा (Life Line)</Text>
            <Text style={styles.lineDetail}>
              {data.lines?.lifeLine?.prominence ?? 'Deep & Curved'} • {data.lines?.lifeLine?.vitality ?? 'High Vitality'}
            </Text>
          </View>
        </View>

        <View style={styles.lineRow}>
          <View style={styles.lineBullet} />
          <View style={styles.lineInfo}>
            <Text style={styles.lineName}>हृदय रेखा (Heart Line)</Text>
            <Text style={styles.lineDetail}>
              {data.lines?.heartLine?.prominence ?? 'Extends to Jupiter'} • {data.lines?.heartLine?.quality ?? 'Devotional Attachment'}
            </Text>
          </View>
        </View>

        <View style={styles.lineRow}>
          <View style={styles.lineBullet} />
          <View style={styles.lineInfo}>
            <Text style={styles.lineName}>मस्तिष्क रेखा (Head Line)</Text>
            <Text style={styles.lineDetail}>
              {data.lines?.headLine?.prominence ?? 'Long & Sloping'} • {data.lines?.headLine?.focus ?? 'Analytical Wisdom'}
            </Text>
          </View>
        </View>

        <View style={styles.lineRow}>
          <View style={styles.lineBullet} />
          <View style={styles.lineInfo}>
            <Text style={styles.lineName}>भाग्य रेखा (Fate Line)</Text>
            <Text style={styles.lineDetail}>
              {data.lines?.fateLine?.prominence ?? 'Clear to Saturn'} • {data.lines?.fateLine?.career ?? 'Self-Earned Expansion'}
            </Text>
          </View>
        </View>
      </View>

      {data.synthesis && (
        <View style={styles.synthesisBox}>
          <Text style={styles.synthesisText}>{data.synthesis}</Text>
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
    marginBottom: 2,
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
  scoreBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderFocus,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: 4,
  },
  linesContainer: {
    gap: 6,
    marginBottom: spacing.xs + 2,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.backgroundElevated,
    padding: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  lineBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  lineInfo: {
    flex: 1,
  },
  lineName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 1,
  },
  lineDetail: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 14,
  },
  synthesisBox: {
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: spacing.xs + 2,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  synthesisText: {
    fontSize: 11,
    color: colors.textPrimary,
    lineHeight: 15,
  },
});
