import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AstroIcon } from '../../components/ui/AstroIcon';
import { colors, radius, spacing, typography } from '../../theme';

export function DoshaAnalysisScreen() {
  const [expandedSection, setExpandedSection] = useState<'manglik' | 'sadeSati' | 'kaalSarp' | null>('manglik');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header & Karmic Shield Meter */}
      <View style={styles.shieldCard}>
        <View style={styles.shieldMeter}>
          <Text style={styles.shieldScore}>85%</Text>
          <Text style={styles.shieldUnit}>Karmic Shield</Text>
        </View>
        <View style={styles.shieldInfo}>
          <Text style={styles.shieldTitle}>Vedic Dosha & Karmic Analysis</Text>
          <Text style={styles.shieldDesc}>
            Deep planetary scan of Lagna, Moon chart, and Rahu-Ketu nodal axes.
          </Text>
        </View>
      </View>

      {/* 1. Manglik Dosha Card */}
      <View style={styles.doshaCard}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedSection(expandedSection === 'manglik' ? null : 'manglik')}
          accessibilityRole="button"
        >
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <AstroIcon name="flame" size={20} color={colors.danger} />
            </View>
            <View>
              <Text style={styles.doshaTitle}>Manglik Dosha (Kuja Dosha)</Text>
              <Text style={styles.doshaSubtitle}>Mars in 1st House (Lagna)</Text>
            </View>
          </View>
          <View style={styles.statusPillSafe}>
            <Text style={styles.statusPillTextSafe}>Cancelled (Shubh)</Text>
          </View>
        </TouchableOpacity>

        {expandedSection === 'manglik' && (
          <View style={styles.expandedContent}>
            <View style={styles.cancellationBox}>
              <Text style={styles.cancellationTitle}>VEDIC CANCELLATION DETECTED</Text>
              <Text style={styles.cancellationText}>
                Mars is in its own Moolatrikona sign (Aries). The fiery intensity is channeled into dynamic leadership rather than marital discord.
              </Text>
            </View>

            <Text style={styles.remedySectionHeader}>RECOMMENDED VEDIC NIVARAN:</Text>
            <View style={styles.remedyItem}>
              <Text style={styles.remedyBullet}>•</Text>
              <Text style={styles.remedyText}>Chant Hanuman Chalisa or Mangal Gayatri Mantra on Tuesdays.</Text>
            </View>
            <View style={styles.remedyItem}>
              <Text style={styles.remedyBullet}>•</Text>
              <Text style={styles.remedyText}>Feed jaggery and roasted chickpeas (Chana) to birds/animals.</Text>
            </View>
          </View>
        )}
      </View>

      {/* 2. Shani Sade Sati Card */}
      <View style={styles.doshaCard}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedSection(expandedSection === 'sadeSati' ? null : 'sadeSati')}
          accessibilityRole="button"
        >
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <AstroIcon name="saturn" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.doshaTitle}>Shani Sade Sati / Dhaiya</Text>
              <Text style={styles.doshaSubtitle}>Saturn Transit Analysis</Text>
            </View>
          </View>
          <View style={styles.statusPillNeutral}>
            <Text style={styles.statusPillTextNeutral}>Not Active</Text>
          </View>
        </TouchableOpacity>

        {expandedSection === 'sadeSati' && (
          <View style={styles.expandedContent}>
            <Text style={styles.cancellationText}>
              Saturn is currently in a harmonious transit relative to your Janma Rasi (Moon sign). Karmic obstacles are minimal; maintain steady discipline and ethical conduct.
            </Text>

            <Text style={styles.remedySectionHeader}>PROTECTIVE SHANI UPAAY:</Text>
            <View style={styles.remedyItem}>
              <Text style={styles.remedyBullet}>•</Text>
              <Text style={styles.remedyText}>Light a mustard oil lamp near a Peepal tree on Saturday evenings.</Text>
            </View>
            <View style={styles.remedyItem}>
              <Text style={styles.remedyBullet}>•</Text>
              <Text style={styles.remedyText}>Chant Shani Beej Mantra (Om Pram Preem Proum Sah Shanaischaraya Namah).</Text>
            </View>
          </View>
        )}
      </View>

      {/* 3. Kaal Sarp Yoga Card */}
      <View style={styles.doshaCard}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedSection(expandedSection === 'kaalSarp' ? null : 'kaalSarp')}
          accessibilityRole="button"
        >
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <AstroIcon name="node" size={20} color={colors.mysticPurple} />
            </View>
            <View>
              <Text style={styles.doshaTitle}>Kaal Sarp Yoga</Text>
              <Text style={styles.doshaSubtitle}>Rahu-Ketu Axis Evaluation</Text>
            </View>
          </View>
          <View style={styles.statusPillSafe}>
            <Text style={styles.statusPillTextSafe}>Clean (Mukta)</Text>
          </View>
        </TouchableOpacity>

        {expandedSection === 'kaalSarp' && (
          <View style={styles.expandedContent}>
            <Text style={styles.cancellationText}>
              All 7 major planets are freely dispersed and not hemmed between Rahu and Ketu. Your chart is free from Kaal Sarp restrictions.
            </Text>

            <Text style={styles.remedySectionHeader}>SPIRITUAL EMPOWERMENT:</Text>
            <View style={styles.remedyItem}>
              <Text style={styles.remedyBullet}>•</Text>
              <Text style={styles.remedyText}>Perform daily Maha Mrityunjaya Japa for continuous vitality and spiritual clarity.</Text>
            </View>
          </View>
        )}
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
    padding: spacing.md,
    gap: spacing.md,
  },
  shieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  shieldMeter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldScore: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  shieldUnit: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  shieldInfo: {
    flex: 1,
  },
  shieldTitle: {
    ...typography.h2,
    fontSize: 15,
    color: colors.textPrimary,
  },
  shieldDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  doshaCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doshaIcon: {
    fontSize: 22,
  },
  doshaTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  doshaSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  statusPillSafe: {
    backgroundColor: colors.successBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.success,
  },
  statusPillTextSafe: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  statusPillNeutral: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statusPillTextNeutral: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  expandedContent: {
    padding: spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: spacing.xs,
  },
  cancellationBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginVertical: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
  },
  cancellationTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  cancellationText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  remedySectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  remedyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 2,
  },
  remedyBullet: {
    fontSize: 12,
    color: colors.primary,
  },
  remedyText: {
    fontSize: 11,
    color: colors.textPrimary,
    lineHeight: 16,
    flex: 1,
  },
});
