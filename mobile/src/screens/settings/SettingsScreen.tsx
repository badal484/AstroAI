import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CreditBalanceBadge } from '../../components/ui/CreditBalanceBadge';
import { deleteAccount, logoutSession } from '../../lib/authApi';
import { secureStorage } from '../../lib/secureStorage';
import { useAuthStore } from '../../stores/authStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/AppStack';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const user = useAuthStore((state) => state.user);
  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated);
  const [isBusy, setIsBusy] = useState(false);

  async function handleLogout() {
    setIsBusy(true);
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        await logoutSession(refreshToken).catch(() => undefined);
      }
    } finally {
      await secureStorage.clearRefreshToken();
      setUnauthenticated();
      setIsBusy(false);
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account and all associated Vedic birth profiles and consultation history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => {
            void handleDeleteAccount();
          },
        },
      ],
    );
  }

  async function handleDeleteAccount() {
    setIsBusy(true);
    try {
      await deleteAccount();
    } catch {
      // Best effort deletion
    } finally {
      await secureStorage.clearRefreshToken();
      setUnauthenticated();
      setIsBusy(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>Settings & Profile</Text>
          <Text style={styles.screenSubtitle}>Manage your cosmic account</Text>
        </View>
        <CreditBalanceBadge />
      </View>

      {/* Seeker Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'V'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{user?.name ?? 'Seeker'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? 'No email'}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>Active Seeker</Text>
          </View>
        </View>
      </View>

      {/* Account & Astrological Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Astrology & Profiles</Text>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('BirthProfileList')}
          activeOpacity={0.7}
        >
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Birth Profiles & Kundlis</Text>
            <Text style={styles.menuSubtitle}>Manage birth dates, times, and planetary charts</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('KundliExplorer')}
          activeOpacity={0.7}
        >
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Kundli Chart Viewer</Text>
            <Text style={styles.menuSubtitle}>Inspect D1 Lagna and D9 Navamsha charts</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('ReportHistory')}
          activeOpacity={0.7}
        >
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Purchased Reports & PDFs</Text>
            <Text style={styles.menuSubtitle}>View and download your completed astrology reports</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Preferences & Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Preferences</Text>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('NotificationPreferences')}
          activeOpacity={0.7}
        >
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Notification & Quiet Hours</Text>
            <Text style={styles.menuSubtitle}>Daily horoscopes, transit alerts, and quiet hours</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('Referral')}
          activeOpacity={0.7}
        >
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Invite & Earn Credits</Text>
            <Text style={styles.menuSubtitle}>Share referral link, earn 50 credits per friend</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone / Logout */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Account & Security</Text>

        <TouchableOpacity
          style={[styles.menuRow, styles.logoutRow]}
          onPress={() => {
            void handleLogout();
          }}
          disabled={isBusy}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuRow, styles.destructiveRow]}
          onPress={confirmDeleteAccount}
          disabled={isBusy}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text style={styles.destructiveText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>AstroAI Mobile • Version 1.0.0 (Vedic Engine v2)</Text>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundHighlight,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.goldLight,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  userEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusPill: {
    backgroundColor: colors.successBackground,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  statusText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  section: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textGold,
    marginBottom: spacing.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    gap: spacing.md,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 22,
    color: colors.textMuted,
  },
  logoutRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  logoutText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.goldLight,
  },
  destructiveRow: {
    borderBottomWidth: 0,
  },
  destructiveText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.danger,
  },
  versionText: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
