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
      // A nice-to-have default, not a hard requirement: if the user has a
      // birth profile already, link the most recent one automatically so
      // the conversation has real astrology context from its first
      // message, without making "new chat" a multi-step flow.
      const profiles = await listBirthProfiles().catch(() => ({ items: [] }));
      const birthProfileId = profiles.items[0]?.id;
      return createConversation(birthProfileId ? { birthProfileId } : {});
    },
    onSuccess: async conversation => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        title: conversation.title,
      });
    },
    onError: () => {
      Alert.alert(
        "Couldn't start a new chat",
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
      'Delete conversation',
      `Delete "${conversation.title}"? This cannot be undone.`,
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (conversationsQuery.isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Couldn't load your conversations.</Text>
        <TouchableOpacity
          onPress={() => {
            void conversationsQuery.refetch();
          }}
          accessibilityRole="button"
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
        keyExtractor={item => item.id}
        contentContainerStyle={items.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              Ask Astra anything — love, career, today's outlook, or just what
              your chart means.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate('Chat', {
                conversationId: item.id,
                title: item.title,
              })
            }
            onLongPress={() => confirmDelete(item)}
            accessibilityRole="button"
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.lastMessageAt && (
                <Text style={styles.rowMeta}>
                  {formatRelativeTime(item.lastMessageAt)}
                </Text>
              )}
            </View>
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
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.newChatButtonText}>+ New chat</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: { color: '#c0392b' },
  retryLink: { color: '#1a73e8' },
  emptyContainer: { flexGrow: 1 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#6b6b75', textAlign: 'center' },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f2',
  },
  rowText: { gap: 3 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 12, color: '#6b6b75' },
  newChatButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    alignItems: 'center',
    margin: 16,
    borderRadius: 8,
  },
  newChatButtonDisabled: { opacity: 0.6 },
  newChatButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
