import { useRoute, type RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {
  ChatMessage,
  PaginatedResult,
  SupportedLanguage,
} from '@astroai/shared-types';
import { useConversationSocket } from '../../hooks/useConversationSocket';
import { ApiError } from '../../lib/apiError';
import {
  getSuggestedQuestions,
  listMessages,
  regenerateMessage,
  sendMessage,
  submitFeedback,
} from '../../lib/chatApi';
import { generateClientId } from '../../lib/id';
import type { AppStackParamList } from '../../navigation/AppStack';
import { MessageBubble } from './MessageBubble';
import { CreditBalanceBadge } from '../../components/ui/CreditBalanceBadge';
import { PricingCostPill } from '../../components/ui/PricingCostPill';
import { colors, radius, spacing, typography } from '../../theme';

type ChatRoute = RouteProp<AppStackParamList, 'Chat'>;

const LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी' },
  { value: 'hinglish', label: 'Hinglish' },
];

function sendErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Unable to connect to the consultation server. Please verify your connection.";
}

export function ChatScreen() {
  const route = useRoute<ChatRoute>();
  const { conversationId } = route.params;
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => listMessages(conversationId),
  });
  const { streamingText, streamPhases, connectionStatus } =
    useConversationSocket(conversationId);

  const messages = messagesQuery.data?.items ?? [];
  const isEmpty = !messagesQuery.isLoading && messages.length === 0;

  const suggestedQuestionsQuery = useQuery({
    queryKey: ['suggestedQuestions', conversationId, language],
    queryFn: () => getSuggestedQuestions(conversationId, language),
    enabled: isEmpty,
  });

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(
        () => listRef.current?.scrollToEnd({ animated: true }),
        50,
      );
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: ({
      content,
      clientMessageId,
    }: {
      content: string;
      clientMessageId: string;
    }) =>
      sendMessage(conversationId, {
        content,
        clientMessageId,
      }),
    onSuccess: (userMessage) => {
      setDraft('');
      setSendError(null);
      queryClient.setQueryData<PaginatedResult<ChatMessage>>(
        ['messages', conversationId],
        (old) => {
          if (!old) return { items: [userMessage], nextCursor: null };
          if (old.items.some((m) => m.id === userMessage.id)) return old;
          return { ...old, items: [...old.items, userMessage] };
        },
      );
      void queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
    },
    onError: (error) => {
      setSendError(sendErrorMessage(error));
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: (messageId: string) =>
      regenerateMessage(conversationId, messageId),
    onSuccess: (updated) => {
      queryClient.setQueryData<PaginatedResult<ChatMessage>>(
        ['messages', conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((m) => (m.id === updated.id ? updated : m)),
          };
        },
      );
    },
    onError: (error) => {
      Alert.alert(
        'Regeneration failed',
        error instanceof ApiError ? error.message : 'Please try again.',
      );
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: ({
      messageId,
      rating,
    }: {
      messageId: string;
      rating: 'up' | 'down';
    }) => submitFeedback(conversationId, messageId, { rating }),
    onSuccess: (updatedMessage, { messageId }) => {
      queryClient.setQueryData<PaginatedResult<ChatMessage>>(
        ['messages', conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((m) =>
              m.id === messageId ? updatedMessage : m,
            ),
          };
        },
      );
    },
  });

  async function loadOlderMessages() {
    const cursor = messagesQuery.data?.nextCursor;
    if (!cursor) return;
    try {
      const older = await listMessages(conversationId, cursor);
      queryClient.setQueryData<PaginatedResult<ChatMessage>>(
        ['messages', conversationId],
        (current) => ({
          items: [...older.items, ...(current?.items ?? [])],
          nextCursor: older.nextCursor,
        }),
      );
    } catch {
      // Best-effort pagination
    }
  }

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || sendMutation.isPending) return;
    const clientMessageId = generateClientId();
    sendMutation.mutate({ content: trimmed, clientMessageId });
  }

  function handleSuggestedQuestion(question: string) {
    if (sendMutation.isPending) return;
    const clientMessageId = generateClientId();
    sendMutation.mutate({ content: question, clientMessageId });
  }

  if (messagesQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (messagesQuery.isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {sendErrorMessage(messagesQuery.error)}
        </Text>
        <TouchableOpacity
          onPress={() => messagesQuery.refetch()}
          accessibilityRole="button"
          style={styles.retryAction}
        >
          <Text style={styles.retryLink}>Tap to retry consultation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Top Consultation Rate & Balance Bar */}
      <View style={styles.topInfoBar}>
        <View style={styles.pricingPillContainer}>
          <PricingCostPill cost={1} unit="Credit / query" variant="subtle" />
        </View>
        <CreditBalanceBadge />
      </View>

      {(connectionStatus === 'disconnected' || connectionStatus === 'connecting') && (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionBannerText}>
            Reconnecting to consultation session…
          </Text>
        </View>
      )}

      {isEmpty ? (
        <View style={styles.emptyState}>
          <View style={styles.acharyaAvatarBadge}>
            <Text style={styles.acharyaAvatarLetter}>V</Text>
          </View>
          <Text style={styles.emptyTitle}>Acharya Vashishta</Text>
          <Text style={styles.emptySubtitle}>
            Vedic Jyotish Consultation • Kundli & Grah Dasha Guidance
          </Text>

          {/* Language Selection Chips */}
          <View style={styles.languageRow}>
            {LANGUAGE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.languageChip,
                  language === opt.value && styles.languageChipActive,
                ]}
                onPress={() => setLanguage(opt.value)}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.languageChipText,
                    language === opt.value && styles.languageChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Contextual Guidance Starters */}
          <View style={styles.suggestedContainer}>
            <Text style={styles.suggestedSectionHeader}>RECOMMENDED INQUIRIES</Text>
            {suggestedQuestionsQuery.data?.questions?.map((question) => (
              <TouchableOpacity
                key={question}
                style={styles.suggestedQuestion}
                onPress={() => handleSuggestedQuestion(question)}
                accessibilityRole="button"
              >
                <Text style={styles.suggestedQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          ListHeaderComponent={
            messagesQuery.data?.nextCursor ? (
              <TouchableOpacity
                onPress={() => {
                  void loadOlderMessages();
                }}
                accessibilityRole="button"
                style={styles.loadOlderButton}
              >
                <Text style={styles.loadOlderText}>View earlier consultation history</Text>
              </TouchableOpacity>
            ) : undefined
          }
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              streamingText={streamingText[item.id]}
              phase={streamPhases[item.id]}
              onRetry={(messageId) => regenerateMutation.mutate(messageId)}
              onRegenerate={(messageId) => regenerateMutation.mutate(messageId)}
              onFeedback={(messageId, rating) =>
                feedbackMutation.mutate({ messageId, rating })
              }
            />
          )}
        />
      )}

      {sendError && (
        <View style={styles.errorBannerContainer}>
          <Text accessibilityRole="alert" style={styles.sendErrorText}>
            {sendError}
          </Text>
        </View>
      )}

      {/* Seeker Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask Acharya (e.g. When is the favorable time for a career change?)..."
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={4000}
          editable={!sendMutation.isPending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (draft.trim().length === 0 || sendMutation.isPending) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={draft.trim().length === 0 || sendMutation.isPending}
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          {sendMutation.isPending ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Ask</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    zIndex: 10,
    elevation: 4,
  },
  pricingPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    ...typography.bodySecondary,
    color: colors.danger,
    textAlign: 'center',
  },
  retryAction: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  retryLink: {
    ...typography.caption,
    color: colors.goldLight,
    fontWeight: '600',
  },
  connectionBanner: {
    backgroundColor: colors.warningBackground,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGold,
  },
  connectionBannerText: {
    ...typography.caption,
    color: colors.textGold,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  acharyaAvatarBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  acharyaAvatarLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gold,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  emptySubtitle: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    maxWidth: 300,
  },
  languageRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  languageChip: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
  languageChipActive: {
    backgroundColor: colors.backgroundHighlight,
    borderColor: colors.borderGold,
  },
  languageChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  languageChipTextActive: {
    color: colors.goldLight,
    fontWeight: '600',
  },
  suggestedContainer: {
    width: '100%',
    maxWidth: 380,
    marginTop: spacing.xs,
  },
  suggestedSectionHeader: {
    ...typography.overline,
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  suggestedQuestion: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  suggestedQuestionText: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  loadOlderButton: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  loadOlderText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  errorBannerContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.dangerBackground,
  },
  sendErrorText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.backgroundInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    color: colors.textPrimary,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
