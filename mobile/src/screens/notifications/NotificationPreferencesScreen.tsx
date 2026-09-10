import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { UserNotificationPreferenceDTO } from '@astroai/shared-types';
import { notificationApi } from '../../lib/notificationApi';
import { colors, radius, spacing, typography } from '../../theme';

export function NotificationPreferencesScreen() {
  const [preferences, setPreferences] = useState<UserNotificationPreferenceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [optedOut, setOptedOut] = useState(false);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [startHour, setStartHour] = useState(22);
  const [endHour, setEndHour] = useState(8);

  // Category Toggles
  const [horoscopeEnabled, setHoroscopeEnabled] = useState(true);
  const [consultationEnabled, setConsultationEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(true);
  const [lifecycleEnabled, setLifecycleEnabled] = useState(true);
  const [language, setLanguage] = useState('en');

  const fetchPrefs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getPreferences();
      setPreferences(data);
      setPushEnabled(data.channels.push);
      setEmailEnabled(data.channels.email);
      setOptedOut(data.optedOut);
      setQuietHoursEnabled(data.quietHours.enabled);
      setStartHour(data.quietHours.startHour);
      setEndHour(data.quietHours.endHour);
      setHoroscopeEnabled(data.categories.horoscope);
      setConsultationEnabled(data.categories.consultation);
      setMarketingEnabled(data.categories.marketing);
      setLifecycleEnabled(data.categories.lifecycle);
      setLanguage(data.language || 'en');
    } catch {
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPrefs();
    }, [fetchPrefs]),
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await notificationApi.updatePreferences({
        channels: {
          push: pushEnabled,
          email: emailEnabled,
          sms: false,
          inApp: true,
        },
        categories: {
          transactional: true,
          horoscope: horoscopeEnabled,
          consultation: consultationEnabled,
          marketing: marketingEnabled,
          lifecycle: lifecycleEnabled,
        },
        quietHours: {
          enabled: quietHoursEnabled,
          startHour,
          startMinute: 0,
          endHour,
          endMinute: 0,
        },
        language,
        optedOut,
      });
      setPreferences(updated);
      Alert.alert('Saved', 'Your notification preferences have been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenHeader}>Notification Preferences</Text>
      <Text style={styles.subHeader}>
        Customize celestial alerts, quiet hours, and promotional notifications.
      </Text>

      {/* Global Opt Out */}
      <View style={styles.sectionCard}>
        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>Do Not Disturb (Global Opt-Out)</Text>
            <Text style={styles.switchDesc}>Mute all non-transactional notifications</Text>
          </View>
          <Switch
            value={optedOut}
            onValueChange={setOptedOut}
            trackColor={{ false: colors.borderSubtle, true: colors.danger }}
            thumbColor={optedOut ? '#FFFFFF' : '#CBD5E1'}
          />
        </View>
      </View>

      {/* Quiet Hours */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        <Text style={styles.sectionDesc}>
          Non-urgent updates will be delayed until quiet hours end (Timezone: {preferences?.timezone || 'Local'}).
        </Text>

        <View style={styles.switchRow}>
          <Text style={styles.rowLabel}>Enable Quiet Hours</Text>
          <Switch
            value={quietHoursEnabled}
            onValueChange={setQuietHoursEnabled}
            trackColor={{ false: colors.borderSubtle, true: colors.primary }}
            thumbColor={quietHoursEnabled ? '#FFFFFF' : '#CBD5E1'}
          />
        </View>

        {quietHoursEnabled && (
          <View style={styles.quietHoursContainer}>
            <View style={styles.hourSelector}>
              <Text style={styles.hourLabel}>Starts (Night)</Text>
              <View style={styles.hourButtonsRow}>
                {[21, 22, 23, 0].map((h) => (
                  <TouchableOpacity
                    key={h}
                    testID={`hour-start-${h}`}
                    onPress={() => setStartHour(h)}
                    style={[styles.hourBadge, startHour === h && styles.hourBadgeActive]}
                  >
                    <Text style={[styles.hourBadgeText, startHour === h && styles.hourBadgeTextActive]}>
                      {h === 0 ? '12 AM' : `${h > 12 ? h - 12 : h} PM`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.hourSelector, { marginTop: 12 }]}>
              <Text style={styles.hourLabel}>Ends (Morning)</Text>
              <View style={styles.hourButtonsRow}>
                {[6, 7, 8, 9].map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setEndHour(h)}
                    style={[styles.hourBadge, endHour === h && styles.hourBadgeActive]}
                  >
                    <Text style={[styles.hourBadgeText, endHour === h && styles.hourBadgeTextActive]}>
                      {h} AM
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Delivery Channels */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Notification Channels</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>Push Notifications</Text>
            <Text style={styles.switchDesc}>Real-time alerts on your device</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: colors.borderSubtle, true: colors.primary }}
            thumbColor={pushEnabled ? '#FFFFFF' : '#CBD5E1'}
          />
        </View>
        <View style={[styles.switchRow, { borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 12 }]}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>Email Notifications</Text>
            <Text style={styles.switchDesc}>Report PDF links and payment receipts</Text>
          </View>
          <Switch
            value={emailEnabled}
            onValueChange={setEmailEnabled}
            trackColor={{ false: colors.borderSubtle, true: colors.primary }}
            thumbColor={emailEnabled ? '#FFFFFF' : '#CBD5E1'}
          />
        </View>
      </View>

      {/* Notification Categories */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Content Topics</Text>
        <View style={styles.switchRow}>
          <Text style={styles.rowLabel}>Daily Horoscope & Transits</Text>
          <Switch
            value={horoscopeEnabled}
            onValueChange={setHoroscopeEnabled}
            trackColor={{ false: colors.borderSubtle, true: colors.primary }}
            thumbColor={horoscopeEnabled ? '#FFFFFF' : '#CBD5E1'}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.rowLabel}>AI Consultation Followups</Text>
          <Switch
            value={consultationEnabled}
            onValueChange={setConsultationEnabled}
            trackColor={{ false: colors.borderSubtle, true: colors.primary }}
            thumbColor={consultationEnabled ? '#FFFFFF' : '#CBD5E1'}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.rowLabel}>Kundli & Lifecycle Milestones</Text>
          <Switch
            value={lifecycleEnabled}
            onValueChange={setLifecycleEnabled}
            trackColor={{ false: colors.borderSubtle, true: colors.primary }}
            thumbColor={lifecycleEnabled ? '#FFFFFF' : '#CBD5E1'}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.rowLabel}>Special Offers & Wallet Bonuses</Text>
          <Switch
            value={marketingEnabled}
            onValueChange={setMarketingEnabled}
            trackColor={{ false: colors.borderSubtle, true: colors.primary }}
            thumbColor={marketingEnabled ? '#FFFFFF' : '#CBD5E1'}
          />
        </View>
      </View>

      {/* Language */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Notification Language</Text>
        <View style={styles.hourButtonsRow}>
          <TouchableOpacity
            onPress={() => setLanguage('en')}
            style={[styles.langBadge, language === 'en' && styles.hourBadgeActive]}
          >
            <Text style={[styles.hourBadgeText, language === 'en' && styles.hourBadgeTextActive]}>
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLanguage('hi')}
            style={[styles.langBadge, language === 'hi' && styles.hourBadgeActive]}
          >
            <Text style={[styles.hourBadgeText, language === 'hi' && styles.hourBadgeTextActive]}>
              हिंदी (Hindi)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        testID="save-preferences-btn"
        onPress={handleSave}
        disabled={saving}
        style={[styles.saveButton, saving && styles.buttonDisabled]}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Preferences</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  screenHeader: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subHeader: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionDesc: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  switchTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  switchDesc: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  quietHoursContainer: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  hourSelector: {
    marginBottom: 4,
  },
  hourLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  hourButtonsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  hourBadge: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  langBadge: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  hourBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  hourBadgeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  hourBadgeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
