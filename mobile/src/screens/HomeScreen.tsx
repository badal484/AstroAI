import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditBalanceBadge } from '../components/ui/CreditBalanceBadge';
import { PricingCostPill } from '../components/ui/PricingCostPill';
import type { AppStackParamList } from '../navigation/AppStack';
import { useAuthStore } from '../stores/authStore';
import { colors, radius, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<AppStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((state) => state.user);

  const userFirstName = user?.name ? user.name.split(' ')[0] : 'Seeker';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Header: Identity, Astrological Context, Balance */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIdentity}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
            accessibilityLabel="View settings and profile"
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'V'}
              </Text>
            </View>

            <View style={styles.greetingContainer}>
              <Text style={styles.greetingTitle} numberOfLines={1}>
                Pranam, {userFirstName}
              </Text>
              <Text style={styles.subGreeting} numberOfLines={1}>
                Moon in Cancer • Rohini Nakshatra
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <CreditBalanceBadge />
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('NotificationCenter')}
              accessibilityLabel="Notifications"
              activeOpacity={0.8}
            >
              <View style={styles.bellIconShape}>
                <View style={styles.bellDot} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary Astrologer Sanctuary Hero: Acharya Vashishta */}
        <View style={styles.sanctuaryCard}>
          <View style={styles.sanctuaryHeader}>
            <View style={styles.astrologerBadge}>
              <View style={styles.astrologerOnlineDot} />
              <Text style={styles.astrologerBadgeText}>ACHARYA VASHISHTA</Text>
            </View>
            <Text style={styles.sanctuarySubtitle}>Vedic Jyotish Guide</Text>
          </View>

          <Text style={styles.sanctuaryPrompt}>
            Seek clarity on your life path, planetary transits, and Vedic timings.
          </Text>

          {/* Life Domain Quick Inquiries - 2x2 Grid */}
          <View style={styles.topicGrid}>
            {[
              { label: 'Career & Purpose', topic: 'career' },
              { label: 'Marriage & Love', topic: 'relationship' },
              { label: 'Wealth & Finance', topic: 'wealth' },
              { label: 'Remedies & Peace', topic: 'health' },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.topicCard}
                onPress={() => navigation.navigate('ConversationList')}
                activeOpacity={0.7}
              >
                <Text style={styles.topicCardText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Triggers: Primary Chat & Secondary Voice Consultations */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => navigation.navigate('ConversationList')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Begin written consultation with Acharya Vashishta"
            >
              <View style={styles.actionTextContainer}>
                <Text style={styles.primaryActionTitle}>Consult Acharya</Text>
                <Text style={styles.primaryActionSubtitle}>Instant written guidance</Text>
              </View>
              <View style={styles.primaryCostBadge}>
                <Text style={styles.primaryCostBadgeText}>1 Credit</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={() =>
                navigation.navigate('VoiceCall', {
                  astrologerName: 'Acharya Vashishta',
                })
              }
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Live voice consultation with Acharya Vashishta"
            >
              <View style={styles.actionTextContainer}>
                <Text style={styles.secondaryActionTitle}>Voice Consultation</Text>
                <Text style={styles.secondaryActionSubtitle}>Real-time spoken dialogue</Text>
              </View>
              <PricingCostPill cost={5} unit="Cr/min" isFree={true} freeLabel="30s Free" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Celestial Reflection & Transit Note */}
        <View style={styles.transitSection}>
          <View style={styles.transitHeader}>
            <Text style={styles.sectionLabel}>CELESTIAL TRANSIT</Text>
            <Text style={styles.tithiLabel}>Shukla Dashami • Abhijit Muhurat</Text>
          </View>

          <Text style={styles.transitBody}>
            Jupiter transits your 9th House, casting supportive Drishti on your Lagna. This period favors dharmic clarity, long-term planning, and career decisions.
          </Text>
        </View>

        {/* Vedic Astrology Explorations - 2x2 Grid */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>VEDIC EXPLORATIONS</Text>

          <View style={styles.toolsGrid}>
            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => navigation.navigate('KundliExplorer')}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={styles.toolCardHeader}>
                <Text style={styles.toolTitle}>Kundli Explorer</Text>
                <View style={styles.toolTagContainer}>
                  <Text style={styles.toolTag}>D1 / D9</Text>
                </View>
              </View>
              <Text style={styles.toolSubtitle}>
                Birth chart, planetary dignities and dasha periods.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => navigation.navigate('Compatibility')}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={styles.toolCardHeader}>
                <Text style={styles.toolTitle}>Kundli Milan</Text>
                <View style={styles.toolTagContainer}>
                  <Text style={styles.toolTag}>36 Gunas</Text>
                </View>
              </View>
              <Text style={styles.toolSubtitle}>
                Ashtakoota compatibility and dharmic alignment.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => navigation.navigate('ReportCatalog')}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={styles.toolCardHeader}>
                <Text style={styles.toolTitle}>Astrology Reports</Text>
                <View style={styles.toolTagContainer}>
                  <Text style={styles.toolTag}>PDF</Text>
                </View>
              </View>
              <Text style={styles.toolSubtitle}>
                Comprehensive life, career, and marriage readings.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => navigation.navigate('Referral')}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={styles.toolCardHeader}>
                <Text style={styles.toolTitle}>Invite Friends</Text>
                <View style={styles.toolTagContainer}>
                  <Text style={styles.toolTag}>+50 Cr</Text>
                </View>
              </View>
              <Text style={styles.toolSubtitle}>
                Share Vedic astrology and earn bonus credits.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transparent Wallet Ledger Overview */}
        <TouchableOpacity
          style={styles.walletBanner}
          onPress={() => navigation.navigate('Wallet')}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <View style={styles.walletBannerLeft}>
            <Text style={styles.walletBannerLabel}>VEDIC WALLET</Text>
            <Text style={styles.walletBannerTitle}>Recharge Consultation Credits</Text>
            <Text style={styles.walletBannerSubtitle}>
              Transparent pricing with bonus credit packs
            </Text>
          </View>
          <View style={styles.walletBannerAction}>
            <Text style={styles.walletBannerActionText}>View Packs →</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Family Profiles Access */}
        <TouchableOpacity
          style={styles.profileRow}
          onPress={() => navigation.navigate('BirthProfileList')}
          activeOpacity={0.7}
        >
          <View style={styles.profileRowLeft}>
            <Text style={styles.profileRowTitle}>Birth Profiles</Text>
            <Text style={styles.profileRowSubtitle}>
              Manage family and loved ones birth charts
            </Text>
          </View>
          <Text style={styles.profileRowArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gold,
  },
  greetingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    fontSize: 15,
  },
  subGreeting: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  notificationButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIconShape: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  sanctuaryCard: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sanctuaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  astrologerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  astrologerOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  astrologerBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 0.8,
  },
  sanctuarySubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  sanctuaryPrompt: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  topicCard: {
    width: '48%',
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  topicCardText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionsContainer: {
    gap: spacing.xs,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  primaryActionTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textInverse,
    fontSize: 14,
  },
  primaryActionSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textInverse,
    opacity: 0.8,
  },
  primaryCostBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  primaryCostBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textInverse,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  secondaryActionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    fontSize: 14,
  },
  secondaryActionSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  transitSection: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  transitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '700',
    color: colors.goldLight,
    letterSpacing: 0.8,
  },
  tithiLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  transitBody: {
    ...typography.bodySecondary,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  sectionContainer: {
    marginBottom: spacing.md,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  toolCard: {
    width: '48%',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  toolCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  toolTitle: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  toolTagContainer: {
    backgroundColor: colors.backgroundHighlight,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 4,
  },
  toolTag: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.goldLight,
  },
  toolSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  walletBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  walletBannerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  walletBannerLabel: {
    ...typography.overline,
    fontSize: 9,
    color: colors.goldLight,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  walletBannerTitle: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 2,
  },
  walletBannerSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  walletBannerAction: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.backgroundHighlight,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.sm,
  },
  walletBannerActionText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.goldLight,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  profileRowLeft: {
    flex: 1,
  },
  profileRowTitle: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 13,
    color: colors.textPrimary,
  },
  profileRowSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  profileRowArrow: {
    fontSize: 18,
    color: colors.textMuted,
  },
});
