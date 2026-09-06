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
import type { Conversation } from '@astroai/shared-types';
import { listBirthProfiles } from '../../lib/birthProfileApi';
import {
  createConversation,
  deleteConversation,
  listConversations,
} from '../../lib/chatApi';
import { formatRelativeTime } from '../../lib/relativeTime';
import type { AppStackParamList } from '../../navigation/AppStack';
import { colors, radius, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AppStackParamList, 'ConversationList'>;

export function ConversationListScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: () => listConversations(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const profiles = await listBirthProfiles().catch(() => ({ items: [] }));
      const birthProfileId = profiles.items[0]?.id;
      return createConversation(birthProfileId ? { birthProfileId } : {});
    },
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        title: conversation.title,
      });
    },
    onError: () => {
      Alert.alert(
        "Couldn't start consultation",
        'Please check your connection and try again.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  function confirmDelete(conversation: Conversation) {
    Alert.alert(
      'Delete consultation',
      `Remove "${conversation.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(conversation.id),
        },
      ],
    );
  }

  if (conversationsQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (conversationsQuery.isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Unable to load your consultations.</Text>
        <TouchableOpacity
          onPress={() => {
            void conversationsQuery.refetch();
          }}
          accessibilityRole="button"
          style={styles.retryButton}
        >
          <Text style={styles.retryLink}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = conversationsQuery.data?.items ?? [];

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyAvatarBadge}>
              <Text style={styles.emptyAvatarLetter}>V</Text>
            </View>
            <Text style={styles.emptyTitle}>No consultations yet</Text>
            <Text style={styles.emptySubtitle}>
              Consult with Acharya Vashishta on career timing, marriage, wealth, and your planetary Dasha.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('Chat', {
                conversationId: item.id,
                title: item.title,
              })
            }
            onLongPress={() => confirmDelete(item)}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <View style={styles.cardIconBadge}>
              <Text style={styles.cardIconLetter}>V</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.lastMessageAt && (
                <Text style={styles.cardMeta}>
                  {formatRelativeTime(item.lastMessageAt)}
                </Text>
              )}
            </View>
            <Text style={styles.cardArrow}>›</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={[
          styles.newChatButton,
          createMutation.isPending && styles.newChatButtonDisabled,
        ]}
        onPress={() => createMutation.mutate()}
        disabled={createMutation.isPending}
        accessibilityRole="button"
        activeOpacity={0.8}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.newChatButtonText}>+ New Consultation</Text>
        )}
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
  centered: {
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
  emptyAvatarBadge: {
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
  emptyAvatarLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gold,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  cardIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.backgroundHighlight,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gold,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardMeta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  cardArrow: {
    fontSize: 18,
    color: colors.textMuted,
    paddingRight: 4,
  },
  newChatButton: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    alignItems: 'center',
    margin: spacing.md,
    borderRadius: radius.md,
  },
  newChatButtonDisabled: {
    opacity: 0.5,
  },
  newChatButtonText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '700',
  },
});
