import Clipboard from '@react-native-clipboard/clipboard';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ChatMessage, ConsultationStreamPhase, GuruProfile } from '@astroai/shared-types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { InteractiveWidgetCard } from './InteractiveWidgetCard';
import { AstroIcon } from '../../components/ui/AstroIcon';

interface Props {
  message: ChatMessage;
  guru?: GuruProfile;
  /** Live-accumulated text while this message is still streaming in —
   * falls back to `message.content` once it's complete. */
  streamingText?: string;
  phase?: ConsultationStreamPhase;
  onRetry: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
  onFeedback: (messageId: string, rating: 'up' | 'down') => void;
}

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FAFF}\u{1F900}-\u{1F9FF}]/gu;

function getPhaseText(phase?: ConsultationStreamPhase): string {
  switch (phase) {
    case 'UNDERSTANDING':
      return 'Listening…';
    case 'ANALYZING_CHART':
      return 'Analyzing your Kundli…';
    case 'GENERATING':
    case 'STREAMING':
      return 'Acharya is typing…';
    default:
      return 'Acharya is typing…';
  }
}

/**
 * Animated 3-dot bouncing typing indicator.
 */
function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounce = (anim: Animated.Value) =>
      Animated.sequence([
        Animated.timing(anim, {
          toValue: -4,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);

    const loop = Animated.loop(
      Animated.stagger(150, [
        createBounce(dot1),
        createBounce(dot2),
        createBounce(dot3),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View
        style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]}
      />
      <Animated.View
        style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]}
      />
      <Animated.View
        style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]}
      />
    </View>
  );
}

/**
 * Blinking golden typing cursor rendered at the end of streaming text.
 */
function BlinkingCursor() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [opacity]);

  return (
    <Animated.Text style={[styles.cursor, { opacity }]}>
      {' ▍'}
    </Animated.Text>
  );
}

function renderFormattedText(text: string, isUser: boolean, isStreaming = false) {
  const cleanedText = text.replace(EMOJI_REGEX, '').replace(/  +/g, ' ');
  if (isUser) {
    return <Text style={[styles.bubbleText, styles.bubbleTextUser]}>{cleanedText}</Text>;
  }

  // Split by double asterisks to bold designated Vedic topics & alignments
  const parts = cleanedText.split(/(\*\*[^*]+\*\*)/g);

  return (
    <Text style={styles.bubbleText}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2);
          return (
            <Text key={index} style={styles.boldText}>
              {content}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
      {isStreaming && <BlinkingCursor />}
    </Text>
  );
}

function formatTime(dateStr?: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function MessageBubble({
  message,
  streamingText,
  phase,
  onRetry,
  onFeedback,
}: Props) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const hasLiveStreamingText =
    streamingText !== undefined && streamingText.length > 0;
  const isCurrentlyStreaming =
    message.status === 'streaming' ||
    (hasLiveStreamingText && message.status !== 'complete');
  const displayText =
    hasLiveStreamingText
      ? streamingText
      : message.content;

  function handleLongPress() {
    Clipboard.setString(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const timeLabel = formatTime(message.createdAt);

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <TouchableOpacity
        activeOpacity={0.92}
        onLongPress={handleLongPress}
        delayLongPress={300}
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        {message.status === 'pending' ||
        (isCurrentlyStreaming && displayText.length === 0) ? (
          <View style={styles.typingRow}>
            <TypingDots />
            <Text style={styles.typingText}>{getPhaseText(phase)}</Text>
          </View>
        ) : message.status === 'failed' ? (
          <View>
            <Text style={styles.errorText}>
              {message.errorMessage ?? "We couldn't load your reading right now."}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => onRetry(message.id)}
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Retry Consultation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {renderFormattedText(displayText, isUser, isCurrentlyStreaming)}
            {!isUser && message.interactiveWidget && !isCurrentlyStreaming ? (
              <InteractiveWidgetCard widget={message.interactiveWidget} />
            ) : null}

            {/* Subtle Timestamp, Copied & Feedback Indicator */}
            <View style={styles.timeRow}>
              {copied && <Text style={styles.copiedText}>Copied  </Text>}
              {!isUser && message.status === 'complete' && !isCurrentlyStreaming && (
                <View style={styles.feedbackRow}>
                  <TouchableOpacity
                    onPress={() => onFeedback(message.id, 'up')}
                    accessibilityRole="button"
                    accessibilityLabel="Helpful guidance"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <AstroIcon
                      name="heart"
                      size={12}
                      color={message.feedback?.rating === 'up' ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              )}
              {timeLabel ? <Text style={styles.timeText}>{timeLabel}</Text> : null}
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 4,
    paddingHorizontal: spacing.md,
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
    ...shadows.card,
  },
  bubbleAssistant: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderBottomLeftRadius: 4,
    ...shadows.card,
  },
  bubbleText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  boldText: {
    fontWeight: '700',
    color: colors.primary,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  copiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.gold,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 14,
    paddingHorizontal: 2,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  cursor: {
    color: colors.gold,
    fontWeight: '900',
    fontSize: 15,
  },
  typingText: {
    fontSize: 12,
    color: colors.textGold,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  retryButtonText: {
    fontSize: 12,
    color: colors.gold,
    fontWeight: '700',
  },
  feedbackRow: {
    marginRight: 6,
  },
  feedbackIcon: {
    fontSize: 12,
    opacity: 0.8,
  },
});
