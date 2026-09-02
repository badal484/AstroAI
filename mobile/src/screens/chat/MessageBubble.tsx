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
import type { ChatMessage } from '@astroai/shared-types';

interface Props {
  message: ChatMessage;
  /** Live-accumulated text while this message is still streaming in —
   * falls back to `message.content` once it's complete. */
  streamingText?: string;
  onRetry: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
  onFeedback: (messageId: string, rating: 'up' | 'down') => void;
}

export function MessageBubble({
  message,
  streamingText,
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
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        {message.status === 'pending' ||
        (message.status === 'streaming' && displayText.length === 0) ? (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color="#6b6b75" />
            <Text style={styles.typingText}>Astra is thinking…</Text>
          </View>
        ) : message.status === 'failed' ? (
          <View>
            <Text style={styles.errorText}>
              {message.errorMessage ?? "This couldn't be generated."}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => onRetry(message.id)}
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {displayText}
          </Text>
        )}
      </View>

      {!isUser && message.status === 'complete' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={handleCopy}
            accessibilityRole="button"
            accessibilityLabel="Copy"
          >
            <Text style={styles.actionText}>{copied ? 'Copied' : 'Copy'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onFeedback(message.id, 'up')}
            accessibilityRole="button"
            accessibilityLabel="Good response"
          >
            <Text
              style={[
                styles.actionText,
                message.feedback?.rating === 'up' && styles.actionTextActive,
              ]}
            >
              👍
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onFeedback(message.id, 'down')}
            accessibilityRole="button"
            accessibilityLabel="Poor response"
          >
            <Text
              style={[
                styles.actionText,
                message.feedback?.rating === 'down' && styles.actionTextActive,
              ]}
            >
              👎
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onRegenerate(message.id)}
            accessibilityRole="button"
            accessibilityLabel="Regenerate response"
          >
            <Text style={styles.actionText}>Regenerate</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 6, paddingHorizontal: 16 },
  rowUser: { alignItems: 'flex-end' },
  rowAssistant: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: { backgroundColor: '#1a73e8', borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: '#f0f0f4', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21, color: '#1a1a1f' },
  bubbleTextUser: { color: '#fff' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 13, color: '#6b6b75', fontStyle: 'italic' },
  errorText: { fontSize: 13, color: '#c0392b', marginBottom: 6 },
  retryButton: { alignSelf: 'flex-start' },
  retryButtonText: { color: '#1a73e8', fontWeight: '600', fontSize: 13 },
  actionsRow: { flexDirection: 'row', gap: 16, marginTop: 4, paddingLeft: 4 },
  actionText: { fontSize: 12, color: '#6b6b75' },
  actionTextActive: { color: '#1a73e8', fontWeight: '700' },
});
