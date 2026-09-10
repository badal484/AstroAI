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

interface AstrologerProfile {
  id: string;
  name: string;
  avatarText: string;
  title: string;
  specialties: string[];
  languages: string;
  expYears: number;
  rating: number;
  consultations: string;
  isOnline: boolean;
  cost: string;
}

const TOP_ASTROLOGERS: AstrologerProfile[] = [
  {
    id: 'acharya-vashishta',
    name: 'Acharya Vashishta',
    avatarText: 'AV',
    title: 'Senior Vedic Scholar',
    specialties: ['Vedic Jyotish', 'Prashna', 'D9 Navamsha'],
    languages: 'Hindi, English',
    expYears: 18,
    rating: 4.95,
    consultations: '18.4k',
    isOnline: true,
    cost: '1 Coin/msg',
  },
  {
    id: 'devi-katyayani',
    name: 'Vidushi Katyayani',
    avatarText: 'VK',
    title: 'Relationship & Milan Expert',
    specialties: ['Kundli Milan', 'Love & Marriage', 'Nadi'],
    languages: 'Hindi, English',
    expYears: 14,
    rating: 4.92,
    consultations: '12.1k',
    isOnline: true,
    cost: '1 Coin/msg',
  },
  {
    id: 'pandit-radheshyam',
    name: 'Pandit Radheshyam',
    avatarText: 'PR',
    title: 'Career & Wealth Astrologer',
    specialties: ['Career Timing', 'D10 Dasamsa', 'Panchang'],
    languages: 'Hindi, Sanskrit',
    expYears: 22,
    rating: 4.88,
    consultations: '24.6k',
    isOnline: true,
    cost: '1 Coin/msg',
  },
];

export function AstrologersCarousel() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionOverline}>LIVE CONSULTATION</Text>
          <Text style={styles.sectionTitle}>Verified Vedic Acharyas</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('ConversationList')}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>View All ›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TOP_ASTROLOGERS.map((astrologer) => (
          <View key={astrologer.id} style={styles.card}>
            {/* Header: Avatar, Online Dot, Rating */}
            <View style={styles.cardHeader}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>{astrologer.avatarText}</Text>
                </View>
                {astrologer.isOnline && <View style={styles.onlineDot} />}
              </View>

              <View style={styles.infoCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.nameText} numberOfLines={1}>
                    {astrologer.name}
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedCheck}>✓</Text>
                  </View>
                </View>
                <Text style={styles.titleText}>{astrologer.title}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.starText}>★ {astrologer.rating}</Text>
                  <Text style={styles.consultCountText}>
                    ({astrologer.consultations})
                  </Text>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.expText}>{astrologer.expYears} yrs</Text>
                </View>
              </View>
            </View>

            {/* Specialties & Language */}
            <View style={styles.specialtyRow}>
              {astrologer.specialties.map((spec) => (
                <View key={spec} style={styles.specialtyPill}>
                  <Text style={styles.specialtyText}>{spec}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.langText}>Languages: {astrologer.languages}</Text>

            {/* Consultation Action Button */}
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => navigation.navigate('ConversationList')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Chat with ${astrologer.name}`}
            >
              <Text style={styles.chatButtonText}>Chat with Acharya • {astrologer.cost}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  sectionOverline: {
    ...typography.overline,
    color: colors.gold,
    marginBottom: 2,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textGold,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  card: {
    width: 270,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.backgroundCard,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.textInverse,
  },
  titleText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  starText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  consultCountText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  bulletDot: {
    fontSize: 10,
    color: colors.textMuted,
  },
  expText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  specialtyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.xs,
  },
  specialtyPill: {
    backgroundColor: colors.backgroundCardElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  specialtyText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  langText: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  chatButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
