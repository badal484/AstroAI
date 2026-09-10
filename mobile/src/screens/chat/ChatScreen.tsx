import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type {
  ChatMessage,
  PaginatedResult,
  SupportedLanguage,
} from '@astroai/shared-types';
import { GuruPersonaId, GURU_PROFILES } from '@astroai/shared-types';
import { useConversationSocket } from '../../hooks/useConversationSocket';
import { ApiError } from '../../lib/apiError';
import {
  getProactiveGreeting,
  getSuggestedQuestions,
  listMessages,
  regenerateMessage,
  sendMessage,
  submitFeedback,
} from '../../lib/chatApi';
import { generateClientId } from '../../lib/id';
import type { AppStackParamList } from '../../navigation/AppStack';
import { MessageBubble } from './MessageBubble';
import { GuruPickerModal } from './GuruPickerModal';
import { CreditBalanceBadge } from '../../components/ui/CreditBalanceBadge';
import { AstroIcon } from '../../components/ui/AstroIcon';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type ChatRoute = RouteProp<AppStackParamList, 'Chat'>;
type Nav = NativeStackNavigationProp<AppStackParamList>;

const LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी' },
  { value: 'hinglish', label: 'Hinglish' },
];

function sendErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Unable to connect to consultation server. Please check your connection.";
}

export function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ChatRoute>();
  const { conversationId } = route.params;
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [selectedPersonaId, setSelectedPersonaId] = useState<GuruPersonaId>(
    GuruPersonaId.ACHARYA_VASHISHTA,
  );
  const [showGuruPicker, setShowGuruPicker] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  function handleVoiceToggle() {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
    } else {
      setIsRecordingVoice(true);
      setTimeout(() => {
        setDraft((prev) =>
          prev ? prev + ' When is my career transit favorable?' : 'When is my career transit favorable for promotion?',
        );
        setIsRecordingVoice(false);
      }, 1500);
    }
  }

  const currentGuru =
    GURU_PROFILES[selectedPersonaId] ??
    GURU_PROFILES[GuruPersonaId.ACHARYA_VASHISHTA];

  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => listMessages(conversationId),
  });
  const { streamingText, streamPhases, connectionStatus } =
    useConversationSocket(conversationId);

  const messages = messagesQuery.data?.items ?? [];
  const isEmpty = !messagesQuery.isLoading && messages.length === 0;

  const latestAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && m.status === 'complete');
  const activeChips = latestAssistantMessage?.quickReplyChips ?? [];

  const suggestedQuestionsQuery = useQuery({
    queryKey: ['suggestedQuestions', conversationId, language],
    queryFn: () => getSuggestedQuestions(conversationId, language),
    enabled: isEmpty,
  });

  const proactiveGreetingQuery = useQuery({
    queryKey: ['proactiveGreeting', conversationId, language, selectedPersonaId],
    queryFn: () => getProactiveGreeting(conversationId, language, selectedPersonaId),
    enabled: isEmpty,
  });
  const cosmicRadar = proactiveGreetingQuery.data?.cosmicRadar;

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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. Ultra-Clean Unified WhatsApp/Telegram Top Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileTapArea}
            onPress={() => setShowGuruPicker(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Switch Vedic Astrologer"
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{currentGuru.avatarLetter}</Text>
              <View style={styles.onlineStatusDot} />
            </View>

            <View style={styles.headerTextCol}>
              <View style={styles.nameRow}>
                <Text style={styles.astrologerNameText} numberOfLines={1}>
                  {currentGuru.name}
                </Text>
                <Text style={styles.dropdownCaret}>▾</Text>
              </View>
              <Text style={styles.onlineStatusText}>Vedic Jyotish • Online</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <CreditBalanceBadge />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {connectionStatus === 'disconnected' && (
          <View style={styles.connectionBanner}>
            <Text style={styles.connectionBannerText}>
              Reconnecting to consultation session…
            </Text>
          </View>
        )}

        {isEmpty ? (
          <ScrollView
            style={styles.emptyScrollView}
            contentContainerStyle={styles.emptyState}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.acharyaAvatarBadge}
              onPress={() => setShowGuruPicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Switch Astrologer"
              activeOpacity={0.8}
            >
              <Text style={styles.acharyaAvatarLetter}>{currentGuru.avatarLetter}</Text>
            </TouchableOpacity>
            <Text style={styles.emptyTitle}>{currentGuru.name}</Text>
            <Text style={styles.emptySubtitle}>
              {currentGuru.title} • {currentGuru.experienceYears}+ yrs Experience
            </Text>
            <View style={styles.mantraPill}>
              <AstroIcon name="sparkle" size={11} color={colors.primary} />
              <Text style={styles.mantraPillText}>
                {selectedPersonaId === GuruPersonaId.ACHARYA_VASHISHTA
                  ? 'Senior Vedic Scholar • Prashna Expert'
                  : selectedPersonaId === GuruPersonaId.VIDUSHI_KATYAYANI
                    ? 'Relationship & Milan Specialist'
                    : 'Career, Finance & Transit Astrologer'}
              </Text>
            </View>

            {/* Language Selector Chips */}
            <View style={styles.languageRow}>
              {(['en', 'hi', 'hinglish'] as const).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageChip,
                    language === lang && styles.languageChipActive,
                  ]}
                  onPress={() => setLanguage(lang)}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.languageChipText,
                      language === lang && styles.languageChipTextActive,
                    ]}
                  >
                    {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'Hinglish'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Daily Cosmic Alignment Card */}
            {cosmicRadar && (
              <View style={styles.proactiveCard}>
                <View style={styles.proactiveCardHeader}>
                  <View style={styles.proactiveCardTitleRow}>
                    <AstroIcon name="sparkle" size={14} color={colors.primary} />
                    <Text style={styles.proactiveCardTitle}>
                      {cosmicRadar.title}
                    </Text>
                  </View>
                  <View style={styles.proactiveLiveBadge}>
                    <View style={styles.proactiveLiveDot} />
                    <Text style={styles.proactiveLiveText}>
                      {cosmicRadar.cosmicScore}% Align
                    </Text>
                  </View>
                </View>

                <Text style={styles.proactiveCardBody}>
                  {cosmicRadar.summary}
                </Text>

                <View style={styles.proactiveChipsSection}>
                  <Text style={styles.proactiveChipsHeader}>
                    EXPLORE TODAY'S ALIGNMENT
                  </Text>
                  <View style={styles.proactiveChipsWrap}>
                    {cosmicRadar.quickActions.map((action, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.proactiveChipBtn}
                        onPress={() => handleSuggestedQuestion(action.prompt)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.proactiveChipBtnText}>
                          {action.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Suggested Starter Inquiries */}
            <View style={styles.suggestedContainer}>
              <Text style={styles.suggestedSectionHeader}>
                FREQUENTLY ASKED VEDIC INQUIRIES
              </Text>
              {(
                suggestedQuestionsQuery.data?.questions ?? [
                  'When is my next favorable career transit for job growth?',
                  'What does my 7th house and Venus position reveal about marriage?',
                  'How is my current Mahadasha influencing my mental peace and decisions?',
                  'What auspicious remedial pujas will harmonize my planetary alignments?',
                ]
              ).map((q, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestedQuestion}
                  onPress={() => handleSuggestedQuestion(q)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ask: ${q}`}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestedQuestionText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
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
                guru={currentGuru}
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

        {/* 2. Single Clean Horizontal Quick Suggestion Chips Row */}
        {draft.length === 0 && !sendMutation.isPending && (
          <View style={styles.quickChipsBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickChipsContent}
            >
              {(activeChips.length > 0
                ? activeChips
                : [
                    { id: '1', label: 'Career Timing 2026', query: 'When is my next favorable career transit?' },
                    { id: '2', label: 'Marriage & 7th House', query: 'What does my 7th house indicate for marriage?' },
                    { id: '3', label: 'Shani Sade Sati', query: 'Is Sade Sati currently active in my chart?' },
                    { id: '4', label: 'Wealth & Finance', query: 'When will my financial growth cycle begin?' },
                    { id: '5', label: 'Shubh Upayas', query: 'What Satvik Vedic remedies will harmonize my period?' },
                  ]
              ).map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={styles.quickChip}
                  onPress={() => handleSuggestedQuestion(chip.query)}
                  accessibilityRole="button"
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickChipText}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 3. Sleek Capsule Input Bar (WhatsApp / iMessage style) */}
        <View style={styles.bottomBar}>
          <View style={styles.inputCapsule}>
            <TextInput
              style={styles.input}
              placeholder="Ask Acharya..."
              placeholderTextColor={colors.textMuted}
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={4000}
              editable={!sendMutation.isPending}
            />
          </View>

          {/* Glowing Circular Send Button */}
          <TouchableOpacity
            style={[
              styles.sendCircleButton,
              draft.trim().length > 0 && styles.sendCircleButtonActive,
            ]}
            onPress={handleSend}
            disabled={draft.trim().length === 0 || sendMutation.isPending}
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <Text style={styles.sendArrowIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>

        <GuruPickerModal
          visible={showGuruPicker}
          selectedPersonaId={selectedPersonaId}
          onSelectPersona={(g) => setSelectedPersonaId(g.id)}
          onClose={() => setShowGuruPicker(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    ...shadows.card,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backArrow: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.textPrimary,
    lineHeight: 30,
  },
  profileTapArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarLetter: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  onlineStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    borderWidth: 1.5,
    borderColor: colors.backgroundElevated,
  },
  headerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  astrologerNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  dropdownCaret: {
    fontSize: 11,
    color: colors.primary,
  },
  onlineStatusText: {
    fontSize: 11,
    color: colors.textEmerald,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  callIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIconText: {
    fontSize: 15,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  messagesList: {
    flex: 1,
  },
  connectionBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 4,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGoldSubtle,
  },
  connectionBannerText: {
    fontSize: 11,
    color: colors.textGold,
    fontWeight: '500',
  },
  emptyScrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  acharyaAvatarBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  acharyaAvatarLetter: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  emptySubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  mantraPill: {
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  mantraPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.primary,
  },
  languageRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  languageChip: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
  },
  languageChipActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.10)',
    borderColor: colors.primary,
  },
  languageChipText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  languageChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  proactiveCard: {
    width: '100%',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  proactiveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  proactiveCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proactiveCardIcon: {
    fontSize: 16,
  },
  proactiveCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  proactiveLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  proactiveLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.success,
  },
  proactiveLiveText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textEmerald,
  },
  proactiveCardBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  proactiveChipsSection: {
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.xs,
  },
  proactiveChipsHeader: {
    ...typography.overline,
    fontSize: 9,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  proactiveChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  proactiveChipBtn: {
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  proactiveChipBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.primary,
  },
  suggestedContainer: {
    width: '100%',
    gap: spacing.xs + 2,
  },
  suggestedSectionHeader: {
    ...typography.overline,
    fontSize: 9,
    color: colors.textMuted,
    marginBottom: 2,
  },
  suggestedQuestion: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    ...shadows.card,
  },
  suggestedQuestionText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  loadOlderButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  loadOlderText: {
    fontSize: 11,
    color: colors.primary,
  },
  errorBannerContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.20)',
  },
  sendErrorText: {
    fontSize: 11,
    color: colors.danger,
    textAlign: 'center',
  },
  quickChipsBar: {
    paddingVertical: 6,
    backgroundColor: colors.background,
  },
  quickChipsContent: {
    paddingHorizontal: spacing.sm,
    gap: 6,
  },
  quickChip: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    ...shadows.card,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    backgroundColor: colors.backgroundElevated,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: 8,
  },
  inputCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 22,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
    minHeight: 44,
    maxHeight: 110,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    paddingVertical: 4,
  },
  micIconBtn: {
    padding: 4,
    marginLeft: 4,
  },
  micIconBtnRecording: {
    opacity: 0.8,
  },
  micIcon: {
    fontSize: 18,
  },
  sendCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCircleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sendArrowIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textInverse,
    marginTop: -2,
  },
  retryAction: {
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  retryLink: {
    color: colors.gold,
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
  },
});
