import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KundliChart, type PlanetPosition } from '../../components/ui/KundliChart';
import { CreditBalanceBadge } from '../../components/ui/CreditBalanceBadge';
import { colors, radius, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/AppStack';

const DETAILED_PLANETS: (PlanetPosition & { nakshatra: string; pada: number })[] = [
  { name: 'Sun (Surya)', symbol: 'Su', sign: 'Leo (Simha)', signIndex: 5, house: 1, degree: 14.5, nakshatra: 'Purva Phalguni', pada: 1 },
  { name: 'Moon (Chandra)', symbol: 'Mo', sign: 'Cancer (Karka)', signIndex: 4, house: 12, degree: 22.1, nakshatra: 'Ashlesha', pada: 2 },
  { name: 'Mars (Mangal)', symbol: 'Ma', sign: 'Aries (Mesha)', signIndex: 1, house: 9, degree: 8.3, nakshatra: 'Ashwini', pada: 3 },
  { name: 'Mercury (Budha)', symbol: 'Me', sign: 'Virgo (Kanya)', signIndex: 6, house: 2, degree: 28.0, nakshatra: 'Chitra', pada: 2, isRetrograde: true },
  { name: 'Jupiter (Guru)', symbol: 'Ju', sign: 'Sagittarius (Dhanu)', signIndex: 9, house: 5, degree: 19.4, nakshatra: 'Purva Ashadha', pada: 2 },
  { name: 'Venus (Shukra)', symbol: 'Ve', sign: 'Taurus (Vrishabha)', signIndex: 2, house: 10, degree: 11.2, nakshatra: 'Rohini', pada: 1 },
  { name: 'Saturn (Shani)', symbol: 'Sa', sign: 'Aquarius (Kumbha)', signIndex: 11, house: 7, degree: 4.8, nakshatra: 'Dhanishta', pada: 4 },
  { name: 'Rahu (North Node)', symbol: 'Ra', sign: 'Pisces (Meena)', signIndex: 12, house: 8, degree: 16.0, nakshatra: 'Uttara Bhadrapada', pada: 4 },
  { name: 'Ketu (South Node)', symbol: 'Ke', sign: 'Virgo (Kanya)', signIndex: 6, house: 2, degree: 16.0, nakshatra: 'Hasta', pada: 2 },
];

export function KundliExplorerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [chartType, setChartType] = useState<'D1_LAGNA' | 'D9_NAVAMSHA'>('D1_LAGNA');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Bar with Balance */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>Vedic Kundli Explorer</Text>
          <Text style={styles.screenSubtitle}>Lagna, Navamsha & Planetary Dignities</Text>
        </View>
        <CreditBalanceBadge />
      </View>

      {/* Chart Selector Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, chartType === 'D1_LAGNA' && styles.tabActive]}
          onPress={() => setChartType('D1_LAGNA')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, chartType === 'D1_LAGNA' && styles.tabTextActive]}>
            D1 Lagna Chart
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, chartType === 'D9_NAVAMSHA' && styles.tabActive]}
          onPress={() => setChartType('D9_NAVAMSHA')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, chartType === 'D9_NAVAMSHA' && styles.tabTextActive]}>
            D9 Navamsha Chart
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Kundli Chart */}
      <KundliChart
        chartType={chartType}
        ascendantSignIndex={5}
        planets={DETAILED_PLANETS}
      />

      {/* Planetary Degrees & Nakshatra Table */}
      <View style={styles.tableCard}>
        <View style={styles.tableHeaderSection}>
          <Text style={styles.tableCardTitle}>Planetary Positions & Nakshatra Padas</Text>
          <Text style={styles.ayanKey}>Lahiri Ayanamsha (Chitra Paksha)</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colPlanet]}>Graha</Text>
          <Text style={[styles.thText, styles.colSign]}>Rashi & Degree</Text>
          <Text style={[styles.thText, styles.colNakshatra]}>Nakshatra (Pada)</Text>
        </View>

        {DETAILED_PLANETS.map((p, idx) => (
          <View
            key={p.name}
            style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
          >
            <View style={styles.colPlanet}>
              <Text style={styles.planetNameText}>{p.name}</Text>
              {p.isRetrograde && <Text style={styles.retrogradeBadge}>Vakri (R)</Text>}
            </View>

            <View style={styles.colSign}>
              <Text style={styles.signText}>{p.sign}</Text>
              <Text style={styles.degreeText}>{p.degree.toFixed(2)}°</Text>
            </View>

            <View style={styles.colNakshatra}>
              <Text style={styles.nakshatraText}>{p.nakshatra}</Text>
              <Text style={styles.padaText}>Pada {p.pada}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Action to Consult Acharya Vashishta on Chart Placements */}
      <TouchableOpacity
        style={styles.chatCta}
        onPress={() => navigation.navigate('ConversationList')}
        activeOpacity={0.85}
      >
        <View style={styles.acharyaBadgeSmall}>
          <Text style={styles.acharyaBadgeLetter}>V</Text>
        </View>
        <View style={styles.chatCtaTextContainer}>
          <Text style={styles.chatCtaTitle}>Have questions about your Kundli?</Text>
          <Text style={styles.chatCtaSubtitle}>Consult Acharya Vashishta for timing & remedies</Text>
        </View>
        <Text style={styles.chatCtaArrow}>→</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  screenTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  screenSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: 3,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  tabText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.goldLight,
  },
  tableCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
  },
  tableHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tableCardTitle: {
    ...typography.h3,
    fontSize: 14,
    color: colors.textPrimary,
  },
  ayanKey: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingVertical: spacing.xs,
  },
  thText: {
    ...typography.overline,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  colPlanet: { flex: 1.2 },
  colSign: { flex: 1.2 },
  colNakshatra: { flex: 1.4 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  planetNameText: {
    ...typography.bodySecondary,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  retrogradeBadge: {
    ...typography.caption,
    fontSize: 9,
    color: colors.warning,
  },
  signText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  degreeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.goldLight,
  },
  nakshatraText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  padaText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  chatCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  acharyaBadgeSmall: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  acharyaBadgeLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
  },
  chatCtaTextContainer: {
    flex: 1,
  },
  chatCtaTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chatCtaSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  chatCtaArrow: {
    fontSize: 18,
    color: colors.gold,
    marginLeft: spacing.sm,
  },
});
