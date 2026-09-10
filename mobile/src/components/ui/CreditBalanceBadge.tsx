import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchWalletBalance } from '../../lib/walletApi';
import { colors, radius, shadows, spacing, typography } from '../../theme';
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
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.15)',
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  coinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  plusContainer: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 1,
  },
  plusText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textInverse,
    lineHeight: 11,
  },
});
