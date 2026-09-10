import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export interface PlanetStrengthItem {
  planet: string;
  sign?: string;
  house?: number;
  score: number;
  status: string;
  color?: string;
}

interface Props {
  planets: PlanetStrengthItem[];
  overallStrength?: string;
  primaryBenefic?: string;
}

export function PlanetaryStrengthGauge({
  planets = [],
  overallStrength = '82%',
  primaryBenefic = 'Jupiter',
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>GRAHA BALA (PLANETARY STRENGTH)</Text>
          <Text style={styles.subtitle}>
            Primary Benefic: <Text style={styles.beneficHighlight}>{primaryBenefic}</Text>
          </Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{overallStrength}</Text>
          <Text style={styles.scoreLabel}>Potency</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.planetList}>
        {planets.map((p, idx) => {
          const barColor = p.color || (p.score >= 75 ? colors.primary : p.score >= 50 ? colors.success : colors.danger);

          return (
            <View key={idx} style={styles.planetRow}>
              <View style={styles.planetMeta}>
                <Text style={styles.planetName}>
                  {p.planet} {p.house ? `(H${p.house})` : ''}
                </Text>
                <Text style={[styles.planetStatus, { color: barColor }]}>{p.status}</Text>
              </View>

              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(Math.max(p.score, 10), 100)}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>

              <Text style={styles.scoreNumber}>{p.score}%</Text>
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
    borderRadius: radius.sm,
    padding: spacing.xs + 2,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  beneficHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  scoreBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  scoreLabel: {
    fontSize: 7,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 4,
  },
  planetList: {
    gap: 6,
    marginTop: 2,
  },
  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planetMeta: {
    width: 85,
  },
  planetName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  planetStatus: {
    fontSize: 8,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.backgroundHighlight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreNumber: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    width: 28,
    textAlign: 'right',
  },
});
