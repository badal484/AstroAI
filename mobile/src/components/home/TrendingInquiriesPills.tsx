import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/AppStack';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AppStackParamList>;

interface InquiryPill {
  id: string;
  tag: string;
  question: string;
}

const TRENDING_INQUIRIES: InquiryPill[] = [
  { id: '1', tag: 'MARRIAGE', question: 'When will I get married?' },
  { id: '2', tag: 'CAREER', question: 'Job switch & promotion timing 2026' },
  { id: '3', tag: 'LOVE', question: 'Does my partner love me truly?' },
  { id: '4', tag: 'ABROAD', question: 'Chances of foreign settlement?' },
  { id: '5', tag: 'FINANCE', question: 'When will my financial crisis end?' },
  { id: '6', tag: 'REMEDY', question: "Today's lucky color, number & remedy" },
  { id: '7', tag: 'EXAM', question: 'Will I crack government competitive exam?' },
];

export function TrendingInquiriesPills() {
  const navigation = useNavigation<Nav>();

  const handleSelectQuestion = (_question: string) => {
    navigation.navigate('ConversationList');
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionOverline}>TRENDING QUESTIONS</Text>
        <Text style={styles.sectionTitle}>Ask Acharya Instantly</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TRENDING_INQUIRIES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.pill}
            onPress={() => handleSelectQuestion(item.question)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={item.question}
          >
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{item.tag}</Text>
            </View>
            <Text style={styles.questionText}>{item.question}</Text>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm + 2,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs + 2,
  },
  sectionOverline: {
    ...typography.overline,
    color: colors.primary,
    marginBottom: 2,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    ...shadows.card,
  },
  tagBadge: {
    backgroundColor: colors.indigoMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  tagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  arrowText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
});
