import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchWalletBalance } from '../../lib/walletApi';
import { colors, radius, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/AppStack';

interface CreditBalanceBadgeProps {
  balance?: number;
  showAddButton?: boolean;
  onPress?: () => void;
}

export function CreditBalanceBadge({
  balance: propBalance,
  showAddButton = true,
  onPress,
}: CreditBalanceBadgeProps) {
  let navigation: any = null;
  try {
    navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  } catch {
    // Isolated tests without NavigationContainer
  }

  const { data } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: fetchWalletBalance,
    enabled: propBalance === undefined,
    staleTime: 15_000,
  });

  const available = propBalance !== undefined ? propBalance : (data?.availableBalance ?? 0);

  function handlePress() {
    if (onPress) {
      onPress();
    } else if (navigation) {
      navigation.navigate('Wallet');
    }
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Wallet balance: ${available} credits. Tap to manage wallet.`}
      activeOpacity={0.8}
    >
      <View style={styles.coinDot} />
      <View style={styles.textContainer}>
        <Text style={styles.balanceText}>{available}</Text>
        <Text style={styles.label}>Credits</Text>
      </View>
      {showAddButton && (
        <View style={styles.plusContainer}>
          <Text style={styles.plusText}>+</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.md,
    paddingVertical: spacing.xxs + 2,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  coinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textGoldLight,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  plusContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  plusText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textInverse,
    lineHeight: 12,
  },
});
