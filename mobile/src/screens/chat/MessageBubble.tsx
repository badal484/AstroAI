import Clipboard from '@react-native-clipboard/clipboard';
import { useState } from 'react';
import {
  ActivityIndicator,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ChatMessage, ConsultationStreamPhase } from '@astroai/shared-types';
import { colors, radius, spacing, typography } from '../../theme';

interface Props {
  message: ChatMessage;
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
      return 'Acharya is understanding your question…';
    case 'ANALYZING_CHART':
      return 'Acharya is reading your chart…';
    case 'GENERATING':
      return 'Acharya is preparing your reading…';
    case 'STREAMING':
      return 'Acharya is speaking…';
    default:
      return 'Acharya is reading your chart…';
  }
}

function renderFormattedText(text: string, isUser: boolean) {
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
    </Text>
  );
}

export function MessageBubble({
  message,
  streamingText,
  phase,
  onRetry,
  onRegenerate,
  onFeedback,
}: Props) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const displayText =
    message.status === 'streaming' && streamingText !== undefined
      ? streamingText
      : message.content;

  function handleCopy() {
    Clipboard.setString(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleShare() {
    void Share.share({ message: message.content });
  }

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {!isUser && (
        <View style={styles.astrologerHeaderRow}>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarLetter}>V</Text>
          </View>
          <Text style={styles.astrologerName}>Acharya Vashishta</Text>
          <View style={styles.onlineDot} />
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        {message.status === 'pending' ||
        (message.status === 'streaming' && displayText.length === 0) ? (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={colors.gold} />
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
          renderFormattedText(displayText, isUser)
        )}
      </View>

      {!isUser && message.status === 'complete' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={handleCopy}
            accessibilityRole="button"
            accessibilityLabel="Copy guidance"
          >
            <Text style={styles.actionText}>{copied ? 'Copied' : 'Copy'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share reading"
          >
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onFeedback(message.id, 'up')}
            accessibilityRole="button"
            accessibilityLabel="Helpful guidance"
          >
            <Text
              style={[
                styles.actionText,
                message.feedback?.rating === 'up' && styles.actionTextActive,
              ]}
            >
              Helpful
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onFeedback(message.id, 'down')}
            accessibilityRole="button"
            accessibilityLabel="Unclear guidance"
          >
            <Text
              style={[
                styles.actionText,
                message.feedback?.rating === 'down' && styles.actionTextActive,
              ]}
            >
              Unclear
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onRegenerate(message.id)}
            accessibilityRole="button"
            accessibilityLabel="Re-consult on this question"
          >
            <Text style={styles.actionText}>Re-consult</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowAssistant: {
    alignItems: 'flex-start',
  },
  astrologerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 2,
    gap: 6,
  },
  avatarBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold,
  },
  astrologerName: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textGold,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.success,
  },
  bubble: {
    maxWidth: '90%',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  bubbleUser: {
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderBottomRightRadius: radius.sm,
  },
  bubbleAssistant: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderBottomLeftRadius: radius.sm,
  },
  bubbleText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: colors.textPrimary,
  },
  boldText: {
    fontWeight: '700',
    color: colors.goldLight,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  typingText: {
    ...typography.caption,
    color: colors.textGold,
    fontStyle: 'italic',
  },
  errorText: {
    ...typography.bodySecondary,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  retryButtonText: {
    ...typography.caption,
    color: colors.gold,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 4,
    paddingLeft: 4,
  },
  actionText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  actionTextActive: {
    color: colors.gold,
    fontWeight: '700',
  },
});
