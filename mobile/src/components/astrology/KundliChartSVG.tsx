import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export interface PlanetPlacement {
  planet: string;
  shortCode: string;
  house: number;
  sign: string;
  isRetrograde?: boolean;
  isExalted?: boolean;
  isDebilitated?: boolean;
}

interface Props {
  ascendantSign?: string;
  ascendantDegree?: number;
  planets?: PlanetPlacement[];
  onSelectHouse?: (houseNumber: number, signNumber: number, planets: PlanetPlacement[]) => void;
  size?: number;
}

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const SIGN_TO_NUM: Record<string, number> = {
  aries: 1, mesha: 1,
  taurus: 2, vrishabha: 2,
  gemini: 3, mithuna: 3,
  cancer: 4, karka: 4,
  leo: 5, simha: 5,
  virgo: 6, kanya: 6,
  libra: 7, tula: 7,
  scorpio: 8, vrishchika: 8,
  sagittarius: 9, dhanu: 9,
  capricorn: 10, makara: 10,
  aquarius: 11, kumbha: 11,
  pisces: 12, meena: 12,
};

const HOUSE_NAMES = [
  'Tanu Bhava (Self/Lagna)',
  'Dhana Bhava (Wealth/Speech)',
  'Sahaja Bhava (Courage/Siblings)',
  'Sukha Bhava (Mother/Home)',
  'Putra Bhava (Intellect/Progeny)',
  'Ripu Bhava (Obstacles/Health)',
  'Kalatra Bhava (Spouse/Partnership)',
  'Ayur Bhava (Longevity/Transformation)',
  'Bhagya Bhava (Fortune/Dharma)',
  'Karma Bhava (Career/Authority)',
  'Labha Bhava (Gains/Aspirations)',
  'Vyaya Bhava (Expenditure/Moksha)',
];

export function KundliChartSVG({
  ascendantSign = 'Leo',
  planets = [],
  onSelectHouse,
  size = 280,
}: Props) {
  const [activeHouse, setActiveHouse] = useState<number | null>(null);

  const lagnaNum = SIGN_TO_NUM[ascendantSign.toLowerCase()] ?? 5;

  function getSignForHouse(h: number): number {
    return ((lagnaNum + h - 2) % 12) + 1;
  }

  function getPlanetsInHouse(h: number): PlanetPlacement[] {
    return planets.filter((p) => p.house === h);
  }

  function handleHousePress(h: number) {
    const signNum = getSignForHouse(h);
    const inHouse = getPlanetsInHouse(h);
    setActiveHouse(h);
    onSelectHouse?.(h, signNum, inHouse);
  }

  // 12 House Relative Layout Positions
  const housePositions: Record<number, { top: number; left: number; width: number; height: number }> = {
    1: { top: 0.12, left: 0.35, width: 0.3, height: 0.25 }, // Center-top diamond
    2: { top: 0.02, left: 0.12, width: 0.22, height: 0.18 }, // Top-left triangle
    3: { top: 0.15, left: 0.02, width: 0.18, height: 0.22 }, // Upper-left
    4: { top: 0.37, left: 0.12, width: 0.25, height: 0.26 }, // Left diamond
    5: { top: 0.62, left: 0.02, width: 0.18, height: 0.22 }, // Lower-left
    6: { top: 0.78, left: 0.12, width: 0.22, height: 0.18 }, // Bottom-left
    7: { top: 0.62, left: 0.35, width: 0.3, height: 0.25 }, // Center-bottom diamond
    8: { top: 0.78, left: 0.65, width: 0.22, height: 0.18 }, // Bottom-right
    9: { top: 0.62, left: 0.8, width: 0.18, height: 0.22 }, // Lower-right
    10: { top: 0.37, left: 0.62, width: 0.25, height: 0.26 }, // Right diamond
    11: { top: 0.15, left: 0.8, width: 0.18, height: 0.22 }, // Upper-right
    12: { top: 0.02, left: 0.65, width: 0.22, height: 0.18 }, // Top-right
  };

  const innerDiamondSize = size / Math.SQRT2;

  return (
    <View style={[styles.outerContainer, { width: size, height: size }]}>
      {/* Outer Square */}
      <View style={[styles.outerSquare, { width: size, height: size }]}>
        {/* Diagonal Cross 1: Top-Left to Bottom-Right */}
        <View
          style={[
            styles.diagonalLine,
            {
              width: size * Math.SQRT2,
              top: (size - 1) / 2,
              left: (size - size * Math.SQRT2) / 2,
              transform: [{ rotate: '45deg' }],
            },
          ]}
        />

        {/* Diagonal Cross 2: Top-Right to Bottom-Left */}
        <View
          style={[
            styles.diagonalLine,
            {
              width: size * Math.SQRT2,
              top: (size - 1) / 2,
              left: (size - size * Math.SQRT2) / 2,
              transform: [{ rotate: '-45deg' }],
            },
          ]}
        />

        {/* Inner Diamond (Kendra Squares) */}
        <View
          style={[
            styles.innerDiamond,
            {
              width: innerDiamondSize,
              height: innerDiamondSize,
              top: (size - innerDiamondSize) / 2,
              left: (size - innerDiamondSize) / 2,
              transform: [{ rotate: '45deg' }],
            },
          ]}
        />

        {/* 12 House Nodes with Planetary Placements */}
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
          const pos = housePositions[h]!;
          const signNum = getSignForHouse(h);
          const housePlanets = getPlanetsInHouse(h);
          const isSelected = activeHouse === h;

          return (
            <TouchableOpacity
              key={h}
              style={[
                styles.houseHitBox,
                {
                  top: pos.top * size,
                  left: pos.left * size,
                  width: pos.width * size,
                  height: pos.height * size,
                },
                isSelected && styles.houseSelected,
              ]}
              onPress={() => handleHousePress(h)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`House ${h}, Sign ${signNum}`}
            >
              <Text style={[styles.signNumberText, h === 1 && styles.lagnaSignText]}>
                {signNum}
              </Text>

              {/* Placed Planets in this House */}
              <View style={styles.planetsColumn}>
                {housePlanets.map((p, idx) => (
                  <Text key={idx} style={[styles.planetText, p.isRetrograde && styles.retrogradePlanet]}>
                    {p.shortCode || p.planet.slice(0, 2)}
                    {p.isRetrograde ? 'ᴿ' : ''}
                  </Text>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected House Insight Footer */}
      {activeHouse !== null && (
        <View style={styles.houseDetailBanner}>
          <Text style={styles.houseDetailTitle}>
            House {activeHouse}: {HOUSE_NAMES[activeHouse - 1]}
          </Text>
          <Text style={styles.houseDetailSub}>
            Rasi: {ZODIAC_SIGNS[getSignForHouse(activeHouse) - 1]} • Planets: {getPlanetsInHouse(activeHouse).map(p => p.planet).join(', ') || 'None (Kendra empty)'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignSelf: 'center',
    marginVertical: spacing.xs,
  },
  outerSquare: {
    backgroundColor: '#0c0a09',
    borderWidth: 2,
    borderColor: colors.borderGold,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  diagonalLine: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: colors.borderGold,
  },
  innerDiamond: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: colors.borderGold,
    backgroundColor: 'transparent',
  },
  houseHitBox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: 4,
    padding: 2,
  },
  houseSelected: {
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  signNumberText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.goldLight,
    opacity: 0.85,
  },
  lagnaSignText: {
    color: colors.gold,
    fontSize: 10,
  },
  planetsColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
    marginTop: 1,
  },
  planetText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fef3c7',
  },
  retrogradePlanet: {
    color: '#f87171',
  },
  houseDetailBanner: {
    marginTop: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.backgroundCardElevated,
    borderRadius: radius.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.gold,
  },
  houseDetailTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.goldLight,
  },
  houseDetailSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
