import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BirthProfile } from '@astroai/shared-types';
import {
  deleteBirthProfile,
  listBirthProfiles,
} from '../../lib/birthProfileApi';
import { formatTime12Hour } from '../../lib/time';
import type { AppStackParamList } from '../../navigation/AppStack';
import { colors, radius, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AppStackParamList, 'BirthProfileList'>;

const TIME_CONFIDENCE_LABEL: Record<BirthProfile['timeConfidence'], string> = {
  exact: 'Exact Time',
  approximate: 'Approximate Time',
  unknown: 'Time Unknown',
};

export function BirthProfileListScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const profilesQuery = useQuery({
    queryKey: ['birthProfiles'],
    queryFn: listBirthProfiles,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBirthProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['birthProfiles'] });
    },
  });

  function confirmDelete(profile: BirthProfile) {
    Alert.alert(
      'Delete birth profile',
      `Remove "${profile.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(profile.id),
        },
      ],
    );
  }

  if (profilesQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (profilesQuery.isError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Couldn't load birth profiles.</Text>
        <TouchableOpacity
          onPress={() => {
            void profilesQuery.refetch();
          }}
          accessibilityRole="button"
          style={styles.retryButton}
        >
          <Text style={styles.retryLink}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = profilesQuery.data?.items ?? [];

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBadge}>
              <Text style={styles.emptyIconLetter}>K</Text>
            </View>
            <Text style={styles.emptyTitle}>No birth profiles yet</Text>
            <Text style={styles.emptySubtitle}>
              Add birth details to compute your Lagna chart, planetary Dashas, and personalized readings.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('BirthProfileForm', { profileId: item.id })
            }
            onLongPress={() => confirmDelete(item)}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.nameRow}>
                <Text style={styles.cardName}>{item.name}</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {TIME_CONFIDENCE_LABEL[item.timeConfidence]}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </View>

            <View style={styles.cardDetails}>
              <Text style={styles.detailText}>
                {item.dateOfBirth}
                {item.birthTime ? ` • ${formatTime12Hour(item.birthTime)}` : ''}
              </Text>
              <Text style={styles.detailText}>
                {item.location.canonicalName}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('BirthProfileForm', {})}
        accessibilityRole="button"
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>+ Add Birth Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.bodySecondary,
    color: colors.danger,
  },
  retryButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  retryLink: {
    ...typography.caption,
    color: colors.goldLight,
    fontWeight: '600',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyIconBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyIconLetter: {
    fontSize: 22,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  cardName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  confidenceBadge: {
    backgroundColor: colors.backgroundHighlight,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  confidenceText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.goldLight,
    fontWeight: '600',
  },
  cardArrow: {
    fontSize: 18,
    color: colors.textMuted,
  },
  cardDetails: {
    marginTop: spacing.xxs,
    gap: 2,
  },
  detailText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
  addButton: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    alignItems: 'center',
    margin: spacing.md,
    borderRadius: radius.md,
  },
  addButtonText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '700',
  },
});
