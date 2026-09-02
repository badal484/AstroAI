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

type ChatRoute = RouteProp<AppStackParamList, 'Chat'>;

const LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'hi', label: 'हिं' },
  { value: 'hinglish', label: 'Hinglish' },
];

function sendErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Couldn't connect. Check your internet connection and try again.";
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
  const { streamingText, connectionStatus } =
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
      // A short delay lets the new row actually lay out before we ask the
      // list to scroll to it — scrolling on the same tick as the data
      // change can silently no-op on Android.
      const timer = setTimeout(
        () => listRef.current?.scrollToEnd({ animated: true }),
        50,
      );
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      sendMessage(conversationId, {
        content,
        clientMessageId: generateClientId(),
      }),
    onSuccess: userMessage => {
      setDraft('');
      setSendError(null);
      queryClient.setQueryData<PaginatedResult<ChatMessage>>(
        ['messages', conversationId],
        old =>
          old
            ? { ...old, items: [...old.items, userMessage] }
            : { items: [userMessage], nextCursor: null },
      );
    },
    onError: (error: unknown) => {
      setSendError(sendErrorMessage(error));
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: (messageId: string) =>
      regenerateMessage(conversationId, messageId),
    onSuccess: message => {
      queryClient.setQueryData<PaginatedResult<ChatMessage>>(
        ['messages', conversationId],
        old => {
          if (!old) return { items: [message], nextCursor: null };
          const index = old.items.findIndex(item => item.id === message.id);
          if (index === -1) return { ...old, items: [...old.items, message] };
          const items = [...old.items];
          items[index] = message;
          return { ...old, items };
        },
      );
    },
    onError: () => {
      Alert.alert(
        "Couldn't do that",
        'Please check your connection and try again.',
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
    onSuccess: message => {
      queryClient.setQueryData<PaginatedResult<ChatMessage>>(
        ['messages', conversationId],
        old => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map(item =>
              item.id === message.id ? message : item,
            ),
          };
        },
      );
    },
  });

  function handleSend() {
    const content = draft.trim();
    if (content.length === 0 || sendMutation.isPending) return;
    sendMutation.mutate(content);
  }

  function handleSuggestedQuestion(question: string) {
    if (sendMutation.isPending) return;
    sendMutation.mutate(question);
  }

  async function loadOlderMessages() {
    if (!messagesQuery.data?.nextCursor) return;
    const older = await listMessages(
      conversationId,
      messagesQuery.data.nextCursor,
    );
    queryClient.setQueryData<PaginatedResult<ChatMessage>>(
      ['messages', conversationId],
      old =>
        old
          ? {
              items: [...older.items, ...old.items],
              nextCursor: older.nextCursor,
            }
          : older,
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {connectionStatus !== 'connected' && (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionBannerText}>
            {connectionStatus === 'connecting'
              ? 'Reconnecting…'
              : "You're offline — messages will send once you're back online."}
          </Text>
        </View>
      )}

      {messagesQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : messagesQuery.isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Couldn't load this conversation.</Text>
          <TouchableOpacity
            onPress={() => {
              void messagesQuery.refetch();
            }}
            accessibilityRole="button"
          >
            <Text style={styles.retryLink}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Ask Astra anything</Text>
          <Text style={styles.emptySubtitle}>
            Love, career, today's outlook, or what your chart means.
          </Text>
          <View style={styles.languageRow}>
            {LANGUAGE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.languagePill,
                  language === option.value && styles.languagePillActive,
                ]}
                onPress={() => setLanguage(option.value)}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.languagePillText,
                    language === option.value && styles.languagePillTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {suggestedQuestionsQuery.data?.questions.map(question => (
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
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
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
              >
                <Text style={styles.loadOlderText}>Load earlier messages</Text>
              </TouchableOpacity>
            ) : undefined
          }
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              streamingText={streamingText[item.id]}
              onRetry={messageId => regenerateMutation.mutate(messageId)}
              onRegenerate={messageId => regenerateMutation.mutate(messageId)}
              onFeedback={(messageId, rating) =>
                feedbackMutation.mutate({ messageId, rating })
              }
            />
          )}
        />
      )}

      {sendError && (
        <Text accessibilityRole="alert" style={styles.sendErrorText}>
          {sendError}
        </Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask about your chart…"
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
        >
          {sendMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  connectionBanner: {
    backgroundColor: '#fff4e5',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  connectionBannerText: { color: '#8a5a00', fontSize: 12, textAlign: 'center' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: {
    fontSize: 13,
    color: '#6b6b75',
    textAlign: 'center',
    marginBottom: 8,
  },
  languageRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  languagePill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d0d0d5',
  },
  languagePillActive: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  languagePillText: { fontSize: 12, color: '#3a3a42' },
  languagePillTextActive: { color: '#fff', fontWeight: '600' },
  suggestedQuestion: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    width: '100%',
  },
  suggestedQuestionText: { fontSize: 13, color: '#1a1a1f' },
  loadOlderText: {
    color: '#1a73e8',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 10,
  },
  sendErrorText: {
    color: '#c0392b',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f2',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d0d0d5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
