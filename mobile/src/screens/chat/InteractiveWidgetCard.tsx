import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { InteractiveWidget } from '@astroai/shared-types';
import { KundliChartSVG } from '../../components/astrology/KundliChartSVG';
import { PlanetaryStrengthGauge } from './PlanetaryStrengthGauge';
import { PrashnaChartCard } from './PrashnaChartCard';
import { PalmistryCard } from './PalmistryCard';
import { PujaBookingCard } from './PujaBookingCard';
import { AstroIcon } from '../../components/ui/AstroIcon';
import { colors, radius, spacing, typography } from '../../theme';

interface Props {
  widget: InteractiveWidget;
}

export function InteractiveWidgetCard({ widget }: Props) {
  const [sankalpaTaken, setSankalpaTaken] = useState(false);
  const { type, title, subtitle, data } = widget;

  if (type === 'puja_booking') {
    return <PujaBookingCard data={data as any} />;
  }

  if (type === 'prashna_chart') {
    return <PrashnaChartCard data={data as any} />;
  }

  if (type === 'palmistry_analysis') {
    return <PalmistryCard data={data as any} />;
  }

  if (type === 'planetary_strength') {
    return (
      <View style={[styles.cardContainer, styles.planetaryStrengthBorder]}>
        <PlanetaryStrengthGauge
          planets={data.planets || []}
          overallStrength={data.overallStrength || '82%'}
          primaryBenefic={data.primaryBenefic || 'Jupiter'}
        />
      </View>
    );
  }

  if (type === 'muhurat') {
    const isAuspicious = data.rating === 'auspicious';
    const isModerate = data.rating === 'moderate';

    return (
      <View style={[styles.cardContainer, styles.muhuratBorder]}>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Text style={styles.cardHeaderTitle}>{title}</Text>
            {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
          </View>
          <View
            style={[
              styles.statusPill,
              isAuspicious
                ? styles.statusPillAuspicious
                : isModerate
                ? styles.statusPillModerate
                : styles.statusPillInauspicious,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                isAuspicious
                  ? styles.statusTextAuspicious
                  : isModerate
                  ? styles.statusTextModerate
                  : styles.statusTextInauspicious,
              ]}
            >
              {data.verdict || (isAuspicious ? 'Shubh' : 'Savdhan')}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.gridContainer}>
          {data.abhijitMuhurat ? (
            <View style={styles.gridItem}>
              <View style={styles.gridLabelRow}>
                <AstroIcon name="sun" size={10} color={colors.primary} />
                <Text style={styles.gridLabel}>Abhijit Muhurat</Text>
              </View>
              <Text style={styles.gridValueAuspicious}>{data.abhijitMuhurat}</Text>
            </View>
          ) : null}

          {data.rahuKaal ? (
            <View style={styles.gridItem}>
              <View style={styles.gridLabelRow}>
                <AstroIcon name="node" size={10} color={colors.warning} />
                <Text style={styles.gridLabel}>Rahu Kaal (Varjya)</Text>
              </View>
              <Text style={styles.gridValueCaution}>{data.rahuKaal}</Text>
            </View>
          ) : null}

          {data.currentChoghadiya ? (
            <View style={styles.gridItem}>
              <View style={styles.gridLabelRow}>
                <AstroIcon name="clock" size={10} color={colors.primary} />
                <Text style={styles.gridLabel}>Current Choghadiya</Text>
              </View>
              <Text style={styles.gridValue}>{data.currentChoghadiya}</Text>
            </View>
          ) : null}

          {data.moonNakshatra ? (
            <View style={styles.gridItem}>
              <View style={styles.gridLabelRow}>
                <AstroIcon name="moon" size={10} color={colors.primary} />
                <Text style={styles.gridLabel}>Moon Nakshatra</Text>
              </View>
              <Text style={styles.gridValue}>{data.moonNakshatra}</Text>
            </View>
          ) : null}

          {data.favorableDirections ? (
            <View style={[styles.gridItem, styles.fullWidthItem]}>
              <View style={styles.gridLabelRow}>
                <AstroIcon name="compass" size={10} color={colors.primary} />
                <Text style={styles.gridLabel}>Shubh Directions (Disha Shool Mukt)</Text>
              </View>
              <Text style={styles.gridValue}>{data.favorableDirections}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  if (type === 'remedy') {
    return (
      <View style={[styles.cardContainer, styles.remedyBorder]}>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Text style={styles.cardHeaderTitle}>{title}</Text>
            {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
          </View>
          <View style={styles.sacredBadge}>
            <AstroIcon name="flame" size={10} color={colors.primary} />
            <Text style={styles.sacredBadgeText}>Vedic Remedy</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {data.mantra ? (
          <View style={styles.mantraBox}>
            <Text style={styles.mantraLabel}>SACRED MANTRA</Text>
            <Text style={styles.mantraText}>{data.mantra}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Deity / Ishta Dev:</Text>
          <Text style={styles.infoValue}>{data.deity || 'Surya Dev / Shiva'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Best Day:</Text>
          <Text style={styles.infoValue}>{data.bestDay || 'Thursday / Monday'}</Text>
        </View>

        {data.gemstoneOrDaan ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Charity & Daan:</Text>
            <Text style={styles.infoValue}>{data.gemstoneOrDaan}</Text>
          </View>
        ) : null}

        {data.ritual ? (
          <View style={styles.ritualBox}>
            <Text style={styles.ritualText}>{data.ritual}</Text>
          </View>
        ) : null}

        {/* Interactive Take Sankalpa Button */}
        <TouchableOpacity
          style={[styles.sankalpaBtn, sankalpaTaken && styles.sankalpaBtnActive]}
          onPress={() => setSankalpaTaken(!sankalpaTaken)}
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          <AstroIcon
            name={sankalpaTaken ? 'check' : 'flame'}
            size={12}
            color={sankalpaTaken ? colors.success : colors.primary}
          />
          <Text style={[styles.sankalpaBtnText, sankalpaTaken && styles.sankalpaBtnTextActive]}>
            {sankalpaTaken
              ? 'Sankalpa Active (Added to Nitya Sadhana)'
              : 'Take 21-Day Sankalpa (Add to Altar)'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (type === 'kundli_snapshot') {
    return (
      <View style={[styles.cardContainer, styles.kundliBorder]}>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Text style={styles.cardHeaderTitle}>{title}</Text>
            {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
          </View>
          <View style={styles.kundliBadge}>
            <AstroIcon name="kundli" size={10} color={colors.primary} />
            <Text style={styles.kundliBadgeText}>Kundli Chakra</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.gridContainer}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Lagna (Ascendant)</Text>
            <Text style={styles.gridValue}>{data.ascendant || 'Aries'}</Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Moon Nakshatra</Text>
            <Text style={styles.gridValue}>{data.moonNakshatra || 'Rohini'}</Text>
          </View>

          <View style={[styles.gridItem, styles.fullWidthItem]}>
            <Text style={styles.gridLabel}>Active Mahadasha</Text>
            <Text style={styles.gridValueAuspicious}>{data.activeDasha || 'Jupiter Mahadasha'}</Text>
          </View>
        </View>

        {Array.isArray(data.keyPlanets) && data.keyPlanets.length > 0 ? (
          <View style={styles.planetsPillRow}>
            {data.keyPlanets.map((p: any, idx: number) => (
              <View key={idx} style={styles.planetPill}>
                <Text style={styles.planetPillText}>
                  {p.planet} ({p.sign || `House ${p.house}`})
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Interactive North Indian Kundli Diamond Chart Visualizer */}
        <View style={styles.chartWrapper}>
          <KundliChartSVG
            ascendantSign={data.ascendant || 'Leo'}
            planets={
              Array.isArray(data.keyPlanets)
                ? data.keyPlanets.map((p: any) => ({
                    planet: p.planet,
                    shortCode: p.planet.slice(0, 2),
                    house: p.house || 1,
                    sign: p.sign || 'Leo',
                    isRetrograde: p.isRetrograde,
                  }))
                : []
            }
            size={240}
          />
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  muhuratBorder: {
    borderColor: colors.borderSubtle,
  },
  remedyBorder: {
    borderColor: colors.primary,
  },
  planetaryStrengthBorder: {
    borderColor: colors.borderSubtle,
    backgroundColor: colors.backgroundElevated,
  },
  kundliBorder: {
    borderColor: colors.borderSubtle,
  },
  sankalpaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 7,
  },
  sankalpaBtnActive: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  sankalpaBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  sankalpaBtnTextActive: {
    color: colors.success,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  titleGroup: {
    flex: 1,
  },
  cardHeaderTitle: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  cardSubtitle: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusPillAuspicious: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
  },
  statusPillModerate: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  statusPillInauspicious: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.error,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextAuspicious: {
    color: colors.success,
  },
  statusTextModerate: {
    color: colors.warning,
  },
  statusTextInauspicious: {
    color: colors.error,
  },
  sacredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  sacredBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  kundliBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  kundliBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.xs + 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  gridItem: {
    width: '48%',
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.sm,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  gridLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  fullWidthItem: {
    width: '100%',
  },
  gridLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  gridValueAuspicious: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '700',
  },
  gridValueCaution: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '700',
  },
  mantraBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    padding: spacing.xs + 2,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    alignItems: 'center',
  },
  mantraLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  mantraText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },
  ritualBox: {
    marginTop: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
  },
  ritualText: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 14,
  },
  planetsPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: spacing.xs,
  },
  planetPill: {
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  planetPillText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chartWrapper: {
    marginTop: spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
});
