import React from 'react';
import {
  RefreshControl,
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
import { StoriesCarousel } from '../components/home/StoriesCarousel';
import { AstrologersCarousel } from '../components/home/AstrologersCarousel';
import { ServicesBentoGrid } from '../components/home/ServicesBentoGrid';
import { TrendingInquiriesPills } from '../components/home/TrendingInquiriesPills';
import { LivePanchangCard } from '../components/home/LivePanchangCard';
import { AstroIcon } from '../components/ui/AstroIcon';
import type { AppStackParamList } from '../navigation/AppStack';
import { useAuthStore } from '../stores/authStore';
import { colors, radius, shadows, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<AppStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((state) => state.user);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  const userFirstName = user?.name ? user.name.split(' ')[0] : 'Seeker';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Sticky App Header */}
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
              Moon in Cancer • Rohini
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
            <AstroIcon name="bell" size={16} color={colors.textSecondary} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {/* 1. Astrotalk Top Stories / Live Highlights */}
        <StoriesCarousel />

        {/* 2. Today's Dainik Panchang & Muhurat Card */}
        <LivePanchangCard />

        {/* 3. Verified Astrologers Live Consultation Showcase */}
        <AstrologersCarousel />

        {/* 4. Trending 1-Tap Inquiries */}
        <TrendingInquiriesPills />

        {/* 5. Comprehensive Astrological Services Bento Grid */}
        <ServicesBentoGrid />

        {/* 7. Transparent Recharge & Wallet Offer Banner */}
        <TouchableOpacity
          style={styles.walletBanner}
          onPress={() => navigation.navigate('Wallet')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Recharge consultation coins"
        >
          <View style={styles.walletBannerContent}>
            <View style={styles.coinIconCircle}>
              <AstroIcon name="coin" size={18} color={colors.primary} />
            </View>
            <View style={styles.walletBannerTextCol}>
              <View style={styles.walletTagRow}>
                <Text style={styles.walletBannerLabel}>VEDIC COIN WALLET</Text>
                <View style={styles.offerPill}>
                  <Text style={styles.offerPillText}>100% BONUS</Text>
                </View>
              </View>
              <Text style={styles.walletBannerTitle}>Recharge Consultation Coins</Text>
              <Text style={styles.walletBannerSubtitle}>
                Get extra bonus coins on your first recharge
              </Text>
            </View>
          </View>
          <View style={styles.walletActionBtn}>
            <Text style={styles.walletActionBtnText}>Add Coins ›</Text>
          </View>
        </TouchableOpacity>

        {/* 8. Family Birth Profiles Quick Access */}
        <TouchableOpacity
          style={styles.profileRow}
          onPress={() => navigation.navigate('BirthProfileList')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Manage family birth profiles"
        >
          <View style={styles.profileRowLeft}>
            <View style={styles.profileIconCircle}>
              <AstroIcon name="compatibility" size={14} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.profileRowTitle}>Saved Birth Profiles</Text>
              <Text style={styles.profileRowSubtitle}>
                Kundli charts for family & loved ones
              </Text>
            </View>
          </View>
          <Text style={styles.profileRowArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.footerSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.xs,
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 6,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  greetingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subGreeting: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  walletBanner: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.card,
  },
  walletBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
  coinIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinEmoji: {
    fontSize: 22,
  },
  walletBannerTextCol: {
    flex: 1,
  },
  walletTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  walletBannerLabel: {
    ...typography.overline,
    fontSize: 9,
    color: colors.primary,
  },
  offerPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.full,
  },
  offerPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  walletBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  walletBannerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  walletActionBtn: {
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 7,
    alignItems: 'center',
    marginTop: 4,
  },
  walletActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    backgroundColor: colors.backgroundCard,
    padding: spacing.md - 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.card,
  },
  profileRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconEmoji: {
    fontSize: 18,
  },
  profileRowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  profileRowSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  profileRowArrow: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  footerSpacing: {
    height: 76,
  },
});
