import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NotificationLogDTO } from '@astroai/shared-types';
import { notificationApi } from '../../lib/notificationApi';
import type { AppStackParamList } from '../../navigation/AppStack';
import { colors, radius, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function NotificationCenterScreen() {
  const navigation = useNavigation<Nav>();
  const [notifications, setNotifications] = useState<NotificationLogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInbox = useCallback(async () => {
    try {
      const res = await notificationApi.getInbox({ limit: 50 });
      setNotifications(res.items);
    } catch {
      // Best-effort
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchInbox();
    }, [fetchInbox]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchInbox();
  };

  const handleNotificationPress = (item: NotificationLogDTO) => {
    const actionUrl = item.data?.actionUrl || '';
    if (actionUrl.includes('report')) {
      navigation.navigate('ReportHistory' as any);
    } else if (actionUrl.includes('wallet')) {
      navigation.navigate('Wallet' as any);
    } else if (actionUrl.includes('chat')) {
      navigation.navigate('ConversationList' as any);
    } else if (actionUrl.includes('birth-profile')) {
      navigation.navigate('BirthProfileList' as any);
    }
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'transactional':
        return { color: colors.success, bg: colors.successBackground };
      case 'horoscope':
      case 'transit':
        return { color: colors.primary, bg: colors.indigoMuted };
      case 'consultation':
        return { color: colors.indigoLight, bg: colors.indigoMuted };
      case 'marketing':
        return { color: colors.primary, bg: colors.indigoMuted };
      default:
        return { color: colors.textSecondary, bg: colors.backgroundInput };
    }
  };

  const renderItem = ({ item }: { item: NotificationLogDTO }) => {
    const badge = getCategoryTheme(item.category);

    return (
      <TouchableOpacity
        style={styles.notificationCard}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: badge.bg, borderColor: badge.color }]}>
            <Text style={[styles.categoryBadgeText, { color: badge.color }]}>
              {item.category.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.timestampText}>
            {new Date(item.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.bodyText}>{item.body}</Text>

        {item.data?.actionUrl && (
          <View style={styles.actionRow}>
            <Text style={styles.actionLinkText}>View Details →</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Settings shortcut */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>Cosmic Inbox</Text>
          <Text style={styles.headerSubtitle}>Updates, alerts, and planetary transits</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('NotificationPreferences' as any)}
          style={styles.settingsButton}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsButtonText}>Preferences</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyBadge}>
                <Text style={styles.emptyBadgeLetter}>N</Text>
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>
                You are all caught up. Astrological transit updates and report delivery alerts will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.backgroundCard,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingsButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.indigoMuted,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  settingsButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  notificationCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timestampText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  titleText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  bodyText: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  actionLinkText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.indigoMuted,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyBadgeLetter: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '700',
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

