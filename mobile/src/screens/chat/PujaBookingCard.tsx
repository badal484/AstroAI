import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AstroIcon } from '../../components/ui/AstroIcon';
import { colors, radius, spacing, typography } from '../../theme';

interface PujaBookingCardProps {
  data: {
    recommendedPujaId?: string;
    title: string;
    templeName: string;
    deity: string;
    startingPriceINR: number;
    creditsRequired: number;
    benefits: string[];
    upcomingTithi: string;
    isLiveStreamAvailable?: boolean;
    isPrasadDeliveryAvailable?: boolean;
  };
}

export function PujaBookingCard({ data }: PujaBookingCardProps) {
  const navigation = useNavigation<any>();

  const handleBook = () => {
    navigation.navigate('PujaCatalog');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.deityTag}>
          <AstroIcon name="flame" size={10} color={colors.primary} />
          <Text style={styles.deityTagText}>{data.deity}</Text>
        </View>
        <View style={styles.liveTag}>
          <AstroIcon name="live" size={10} color={colors.error} />
          <Text style={styles.liveTagText}>Live Video & Prasad</Text>
        </View>
      </View>

      <Text style={styles.title}>{data.title}</Text>
      <View style={styles.templeRow}>
        <AstroIcon name="location" size={11} color={colors.primary} />
        <Text style={styles.templeName}>{data.templeName}</Text>
      </View>

      {/* Benefits */}
      <View style={styles.benefitsBox}>
        {data.benefits.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <AstroIcon name="sparkle" size={9} color={colors.primary} style={{ marginTop: 2, marginRight: 6 }} />
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      <View style={styles.tithiRow}>
        <Text style={styles.tithiLabel}>Next Muhurat:</Text>
        <Text style={styles.tithiVal}>{data.upcomingTithi}</Text>
      </View>

      <TouchableOpacity style={styles.bookBtn} onPress={handleBook} activeOpacity={0.85}>
        <Text style={styles.bookBtnText}>
          Book Temple Puja • ₹{data.startingPriceINR} ({data.creditsRequired} Credits)
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  deityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  deityTagText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  liveTagText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  templeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templeName: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  benefitsBox: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 4,
    marginVertical: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 16,
  },
  tithiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tithiLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  tithiVal: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  bookBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  bookBtnText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
