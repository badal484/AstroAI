import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export interface PlanetPosition {
  name: string;
  symbol: string;
  sign: string;
  signIndex: number; // 1-12
  house: number; // 1-12
  degree: number;
  isRetrograde?: boolean;
}

export interface KundliChartProps {
  ascendantSignIndex?: number;
  planets?: PlanetPosition[];
  chartType?: 'D1_LAGNA' | 'D9_NAVAMSHA';
  onHousePress?: (houseNumber: number) => void;
}

const ZODIAC_SIGNS = [
  'Aries (Mesha)',
  'Taurus (Vrishabha)',
  'Gemini (Mithuna)',
  'Cancer (Karka)',
  'Leo (Simha)',
  'Virgo (Kanya)',
  'Libra (Tula)',
  'Scorpio (Vrishchika)',
  'Sagittarius (Dhanu)',
  'Capricorn (Makara)',
  'Aquarius (Kumbha)',
  'Pisces (Meena)',
];

const DEFAULT_PLANETS: PlanetPosition[] = [
  { name: 'Sun', symbol: 'Su', sign: 'Leo', signIndex: 5, house: 1, degree: 14.5 },
  { name: 'Moon', symbol: 'Mo', sign: 'Cancer', signIndex: 4, house: 12, degree: 22.1 },
  { name: 'Mars', symbol: 'Ma', sign: 'Aries', signIndex: 1, house: 9, degree: 8.3 },
  { name: 'Mercury', symbol: 'Me', sign: 'Virgo', signIndex: 6, house: 2, degree: 28.0, isRetrograde: true },
  { name: 'Jupiter', symbol: 'Ju', sign: 'Sagittarius', signIndex: 9, house: 5, degree: 19.4 },
  { name: 'Venus', symbol: 'Ve', sign: 'Taurus', signIndex: 2, house: 10, degree: 11.2 },
  { name: 'Saturn', symbol: 'Sa', sign: 'Aquarius', signIndex: 11, house: 7, degree: 4.8 },
  { name: 'Rahu', symbol: 'Ra', sign: 'Pisces', signIndex: 12, house: 8, degree: 16.0 },
  { name: 'Ketu', symbol: 'Ke', sign: 'Virgo', signIndex: 6, house: 2, degree: 16.0 },
];

const HOUSE_SIGNIFICATIONS: Record<number, string> = {
  1: 'Tanu Bhava: Physical self, personality, vitality, longevity & appearance.',
  2: 'Dhana Bhava: Wealth, family lineage, speech, assets & food habits.',
  3: 'Sahaja Bhava: Courage, siblings, communications, willpower & short journeys.',
  4: 'Sukha Bhava: Mother, home, inner peace, vehicles & real estate.',
  5: 'Putra Bhava: Children, creativity, intellect, past-life karma & romance.',
  6: 'Ari Bhava: Health, enemies, debts, daily work & overcoming obstacles.',
  7: 'Yuvati Bhava: Marriage, spouse, partnerships, business & contracts.',
  8: 'Randhra Bhava: Longevity, transformation, occult, secrets & inheritance.',
  9: 'Dharma Bhava: Fortune, higher wisdom, spirituality, father & pilgrimages.',
  10: 'Karma Bhava: Career, fame, leadership, social status & achievements.',
  11: 'Labha Bhava: Gains, friendships, aspirations, cashflow & networks.',
  12: 'Vyaya Bhava: Foreign lands, spiritual liberation (Moksha), sleep & expenses.',
};

export function KundliChart({
  ascendantSignIndex = 5,
  planets = DEFAULT_PLANETS,
  chartType = 'D1_LAGNA',
  onHousePress,
}: KundliChartProps) {
  const [selectedHouse, setSelectedHouse] = useState<number>(1);

  // Group planets by house (1-12)
  const planetsByHouse: Record<number, PlanetPosition[]> = {};
  for (let i = 1; i <= 12; i++) {
    planetsByHouse[i] = [];
  }
  for (const p of planets) {
    if (planetsByHouse[p.house]) {
      planetsByHouse[p.house].push(p);
    }
  }

  function handleSelectHouse(houseNum: number) {
    setSelectedHouse(houseNum);
    if (onHousePress) onHousePress(houseNum);
  }

  function getSignNumberForHouse(houseNum: number): number {
    // Zodiac sign index for house: (ascendantSignIndex + houseNum - 2) % 12 + 1
    return ((ascendantSignIndex - 1 + houseNum - 1) % 12) + 1;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.chartTitle}>
            {chartType === 'D1_LAGNA' ? 'Vedic Birth Kundli (D1 Lagna)' : 'Navamsha Chart (D9)'}
          </Text>
          <Text style={styles.ascendantSubtitle}>
            Ascendant (Lagna): {ZODIAC_SIGNS[ascendantSignIndex - 1] ?? 'Aries'}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>North Indian</Text>
        </View>
      </View>

      {/* 12-House Vedic Interactive Grid */}
      <View style={styles.chartGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((houseNum) => {
          const isSelected = selectedHouse === houseNum;
          const isLagna = houseNum === 1;
          const housePlanets = planetsByHouse[houseNum] ?? [];
          const signNum = getSignNumberForHouse(houseNum);

          return (
            <TouchableOpacity
              key={houseNum}
              style={[
                styles.houseCell,
                isSelected && styles.houseCellSelected,
                isLagna && styles.lagnaCell,
              ]}
              onPress={() => handleSelectHouse(houseNum)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`House ${houseNum}, Sign ${signNum}, ${housePlanets.length} planets`}
            >
              <View style={styles.houseTopRow}>
                <Text style={[styles.houseNumText, isLagna && styles.lagnaNumText]}>
                  H{houseNum} {isLagna ? '(Asc)' : ''}
                </Text>
                <Text style={styles.signNumText}>#{signNum}</Text>
              </View>

              <View style={styles.planetContainer}>
                {housePlanets.length > 0 ? (
                  housePlanets.map((p) => (
                    <View key={p.name} style={styles.planetTag}>
                      <Text
                        style={[
                          styles.planetSymbol,
                          p.isRetrograde && styles.retrogradeSymbol,
                        ]}
                      >
                        {p.symbol}
                        {p.isRetrograde ? '(R)' : ''}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyHouseText}>-</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* House Inspector & Signification Details */}
      <View style={styles.inspectorCard}>
        <View style={styles.inspectorHeader}>
          <Text style={styles.inspectorTitle}>
            House {selectedHouse} — Sign #{getSignNumberForHouse(selectedHouse)}{' '}
            ({ZODIAC_SIGNS[getSignNumberForHouse(selectedHouse) - 1]})
          </Text>
        </View>
        <Text style={styles.significationText}>
          {HOUSE_SIGNIFICATIONS[selectedHouse]}
        </Text>

        {planetsByHouse[selectedHouse]?.length > 0 && (
          <View style={styles.planetDetailsRow}>
            <Text style={styles.placedPlanetsLabel}>Occupying Grahas:</Text>
            {planetsByHouse[selectedHouse].map((p) => (
              <View key={p.name} style={styles.planetDetailBadge}>
                <Text style={styles.planetDetailText}>
                  {p.name} {p.isRetrograde ? '(Retrograde)' : ''} at {p.degree.toFixed(1)}°
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  ascendantSubtitle: {
    ...typography.caption,
    color: colors.goldLight,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.backgroundHighlight,
    borderWidth: 1,
    borderColor: colors.borderGold,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.goldLight,
  },
  chartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  houseCell: {
    width: '31.5%',
    minHeight: 70,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    padding: spacing.xs,
    justifyContent: 'space-between',
  },
  houseCellSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.backgroundHighlight,
  },
  lagnaCell: {
    borderWidth: 1.5,
    borderColor: colors.borderGold,
  },
  houseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  houseNumText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  lagnaNumText: {
    color: colors.goldLight,
    fontWeight: '700',
  },
  signNumText: {
    ...typography.caption,
    fontSize: 9,
    color: colors.textMuted,
  },
  planetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 4,
  },
  planetTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  planetSymbol: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.goldLight,
  },
  retrogradeSymbol: {
    color: '#F87171',
  },
  emptyHouseText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  inspectorCard: {
    marginTop: spacing.md,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  inspectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  inspectorTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.goldLight,
  },
  significationText: {
    ...typography.bodySecondary,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  planetDetailsRow: {
    marginTop: spacing.sm,
    gap: 4,
  },
  placedPlanetsLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  planetDetailBadge: {
    backgroundColor: colors.backgroundHighlight,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  planetDetailText: {
    ...typography.caption,
    color: colors.goldLight,
  },
});
