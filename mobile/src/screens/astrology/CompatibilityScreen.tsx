import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AshtakootaScorecard } from '../../components/ui/AshtakootaScorecard';
import { CreditBalanceBadge } from '../../components/ui/CreditBalanceBadge';
import { PricingCostPill } from '../../components/ui/PricingCostPill';
import { colors, radius, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/AppStack';

export function CompatibilityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [partner1Name, setPartner1Name] = useState('Seeker (You)');
  const [partner2Name, setPartner2Name] = useState('Prospective Match');
  const [isCalculated, setIsCalculated] = useState(true);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>36-Guna Kundli Milan</Text>
          <Text style={styles.screenSubtitle}>Vedic Ashtakoota Matchmaking & Dosha Check</Text>
        </View>
        <CreditBalanceBadge />
      </View>

      {/* Profile Selector Cards */}
      <View style={styles.inputsCard}>
        <View style={styles.inputRow}>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>Partner 1 (Seeker)</Text>
            <TextInput
              style={styles.textInput}
              value={partner1Name}
              onChangeText={setPartner1Name}
              placeholder="Name"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>&</Text>
          </View>

          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>Partner 2 (Match)</Text>
            <TextInput
              style={styles.textInput}
              value={partner2Name}
              onChangeText={setPartner2Name}
              placeholder="Partner Name"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.calcFooter}>
          <PricingCostPill cost="Included" isFree={true} freeLabel="Instant Analysis" />
          <TouchableOpacity
            style={styles.calcButton}
            onPress={() => setIsCalculated(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.calcButtonText}>Analyze Match</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Matchmaking Scorecard */}
      {isCalculated && (
        <>
          <AshtakootaScorecard />

          {/* Detailed Full Matchmaking Report CTA */}
          <TouchableOpacity
            style={styles.reportCta}
            onPress={() => navigation.navigate('ReportCatalog', { initialType: 'compatibility' })}
            activeOpacity={0.85}
          >
            <View style={styles.reportCtaTag}>
              <Text style={styles.reportCtaTagText}>PDF</Text>
            </View>
            <View style={styles.reportCtaTextContainer}>
              <Text style={styles.reportCtaTitle}>Complete 15-Page Kundli Milan Reading</Text>
              <Text style={styles.reportCtaSubtitle}>
                Includes Guna Milan, Dasha Sandhi, Manglik remedies & timing
              </Text>
            </View>
            <PricingCostPill cost={40} unit="Credits" />
          </TouchableOpacity>
        </>
      )}
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
  inputsCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.backgroundInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    color: colors.textPrimary,
    fontSize: 14,
  },
  vsContainer: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  vsText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.gold,
  },
  calcFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm,
  },
  calcButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calcButtonText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textInverse,
  },
  reportCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  reportCtaTag: {
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
  reportCtaTagText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold,
  },
  reportCtaTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  reportCtaTitle: {
    ...typography.bodySecondary,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reportCtaSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
    lineHeight: 15,
  },
});
