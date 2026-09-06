import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ReportType } from '@astroai/shared-types';
import type { BirthProfile, WalletBalanceDTO } from '@astroai/shared-types';
import { birthProfileApi } from '../../lib/birthProfileApi';
import { reportApi } from '../../lib/reportApi';
import { walletApi } from '../../lib/walletApi';
import type { AppStackParamList } from '../../navigation/AppStack';
import { colors, radius, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AppStackParamList>;

interface ReportOption {
  type: ReportType;
  title: string;
  subtitle: string;
  credits: number;
  tag: string;
  isCompatibility?: boolean;
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    type: ReportType.FULL_KUNDLI,
    title: 'Comprehensive Vedic Kundli',
    subtitle: 'Complete 12-house natal analysis, planetary yogas, and life overview.',
    credits: 20,
    tag: 'NATAL',
  },
  {
    type: ReportType.RELATIONSHIP_COMPATIBILITY,
    title: 'Ashtakoota Compatibility Milan',
    subtitle: 'Deterministic 36-point Guna Milan, Mangal Dosha, and relationship synthesis.',
    credits: 25,
    tag: 'MILAN',
    isCompatibility: true,
  },
  {
    type: ReportType.CAREER_FINANCE,
    title: 'Career & Financial Dasha',
    subtitle: '10th House career lord, wealth prospects, and favorable planetary periods.',
    credits: 15,
    tag: 'CAREER',
  },
  {
    type: ReportType.TRANSIT_DASHA,
    title: 'Annual Transit & Mahadasha',
    subtitle: 'Yearly Gochara transits of Jupiter, Saturn & Rahu combined with active Vimshottari.',
    credits: 15,
    tag: 'TRANSIT',
  },
];

export function ReportCatalogScreen() {
  const navigation = useNavigation<Nav>();
  const [selectedType, setSelectedType] = useState<ReportType>(ReportType.FULL_KUNDLI);
  const [profiles, setProfiles] = useState<BirthProfile[]>([]);
  const [primaryProfileId, setPrimaryProfileId] = useState<string | null>(null);
  const [partnerProfileId, setPartnerProfileId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalanceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, bal] = await Promise.all([
        birthProfileApi.list(),
        walletApi.getBalance(),
      ]);
      setProfiles(profilesRes.items);
      setWalletBalance(bal);

      setPrimaryProfileId((prev) => prev || (profilesRes.items.length > 0 ? profilesRes.items[0].id : null));
      setPartnerProfileId((prev) => prev || (profilesRes.items.length > 1 ? profilesRes.items[1].id : null));
    } catch {
      // Ignored: UI handles empty profiles
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const selectedOption = REPORT_OPTIONS.find((r) => r.type === selectedType) || REPORT_OPTIONS[0];
  const isComp = selectedOption.isCompatibility;

  const handlePurchase = async () => {
    if (!primaryProfileId) {
      Alert.alert('Profile Required', 'Please select or add a primary birth profile first.');
      return;
    }

    if (isComp && !partnerProfileId) {
      Alert.alert('Partner Profile Required', 'Compatibility reports require selecting both Person A and Person B birth profiles.');
      return;
    }

    if (isComp && primaryProfileId === partnerProfileId) {
      Alert.alert('Different Profiles Required', 'Please select two different profiles for compatibility analysis.');
      return;
    }

    const available = walletBalance?.availableBalance ?? 0;
    if (available < selectedOption.credits) {
      Alert.alert(
        'Insufficient Credits',
        `You have ${available} credits. This report requires ${selectedOption.credits} credits.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Credits', onPress: () => navigation.navigate('Wallet') },
        ],
      );
      return;
    }

    setIsPurchasing(true);
    try {
      const idempotencyKey = `rep_order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const result = await reportApi.createReport({
        reportType: selectedType,
        primaryBirthProfileId: primaryProfileId,
        partnerBirthProfileId: isComp ? partnerProfileId : null,
        language: 'en',
        idempotencyKey,
      });

      Alert.alert('Reading Generated', 'Your Vedic report has been prepared successfully.', [
        {
          text: 'View Report',
          onPress: () => navigation.navigate('ReportViewer', { reportId: result.id }),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Order Failed', err.message || 'Unable to generate report.');
    } finally {
      setIsPurchasing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Vedic Astrology Reports</Text>
          <Text style={styles.screenSubtitle}>Personalized Jyotish Readings & PDF Reports</Text>
        </View>
        <View style={styles.balancePill}>
          <Text style={styles.balanceText}>{walletBalance?.availableBalance ?? 0} Credits</Text>
        </View>
      </View>

      {/* Report Types Catalog */}
      <Text style={styles.sectionHeader}>SELECT REPORT TYPE</Text>
      <View style={styles.catalogGrid}>
        {REPORT_OPTIONS.map((opt) => {
          const isSelected = opt.type === selectedType;
          return (
            <TouchableOpacity
              key={opt.type}
              style={[styles.reportCard, isSelected && styles.reportCardSelected]}
              onPress={() => setSelectedType(opt.type)}
              activeOpacity={0.8}
            >
              <View style={styles.reportTopRow}>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>{opt.tag}</Text>
                </View>
                <View style={styles.costBadge}>
                  <Text style={styles.costBadgeText}>{opt.credits} Credits</Text>
                </View>
              </View>
              <Text style={styles.reportTitle}>{opt.title}</Text>
              <Text style={styles.reportSubtitle}>{opt.subtitle}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Profile Selection */}
      <Text style={styles.sectionHeader}>SELECT BIRTH PROFILES</Text>
      <View style={styles.profileSection}>
        <Text style={styles.fieldLabel}>Primary Person</Text>
        {profiles.length === 0 ? (
          <TouchableOpacity
            style={styles.addProfileButton}
            onPress={() => navigation.navigate('BirthProfileList')}
            activeOpacity={0.8}
          >
            <Text style={styles.addProfileText}>+ Add Birth Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.profileChipsRow}>
            {profiles.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.profileChip,
                  primaryProfileId === p.id && styles.profileChipSelected,
                ]}
                onPress={() => setPrimaryProfileId(p.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.profileChipText,
                    primaryProfileId === p.id && styles.profileChipTextSelected,
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isComp && (
          <>
            <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Partner (Person B)</Text>
            <View style={styles.profileChipsRow}>
              {profiles.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.profileChip,
                    partnerProfileId === p.id && styles.profileChipSelected,
                  ]}
                  onPress={() => setPartnerProfileId(p.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.profileChipText,
                      partnerProfileId === p.id && styles.profileChipTextSelected,
                    ]}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Action Purchase Button */}
      <TouchableOpacity
        style={[styles.purchaseButton, isPurchasing && styles.purchaseButtonDisabled]}
        onPress={() => void handlePurchase()}
        disabled={isPurchasing}
        activeOpacity={0.85}
      >
        {isPurchasing ? (
          <ActivityIndicator color={colors.textInverse} size="small" />
        ) : (
          <Text style={styles.purchaseButtonText}>
            Generate {selectedOption.title} ({selectedOption.credits} Credits)
          </Text>
        )}
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
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
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
  balancePill: {
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  balanceText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.goldLight,
  },
  sectionHeader: {
    ...typography.overline,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  catalogGrid: {
    gap: spacing.sm,
  },
  reportCard: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  reportCardSelected: {
    borderColor: colors.borderGold,
    backgroundColor: colors.backgroundCardElevated,
  },
  reportTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tagBadge: {
    backgroundColor: colors.backgroundHighlight,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.sm,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  tagBadgeText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.gold,
  },
  costBadge: {
    backgroundColor: colors.backgroundInput,
    borderRadius: radius.sm,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
  costBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textGoldLight,
  },
  reportTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  reportSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  profileSection: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  profileChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  profileChip: {
    backgroundColor: colors.backgroundInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  profileChipSelected: {
    borderColor: colors.borderGold,
    backgroundColor: colors.backgroundHighlight,
  },
  profileChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  profileChipTextSelected: {
    color: colors.goldLight,
    fontWeight: '600',
  },
  addProfileButton: {
    backgroundColor: colors.backgroundHighlight,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  addProfileText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.gold,
  },
  purchaseButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    marginTop: spacing.xs,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
