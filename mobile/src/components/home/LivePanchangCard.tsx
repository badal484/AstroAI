import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/AppStack';
import { AstroIcon } from '../ui/AstroIcon';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function LivePanchangCard() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header with Live Badge */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.iconCircle}>
              <AstroIcon name="sun" size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Today's Dainik Panchang</Text>
              <Text style={styles.cardDate}>Shukla Paksha • Navami Tithi</Text>
            </View>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>TODAY</Text>
          </View>
        </View>

        {/* 2x2 Panchang Grid */}
        <View style={styles.grid}>
          {/* Row 1: Nakshatra & Yoga */}
          <View style={styles.gridRow}>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>NAKSHATRA</Text>
              <Text style={styles.cellValue}>Rohini</Text>
              <Text style={styles.cellSub}>Till 04:12 PM</Text>
            </View>

            <View style={styles.cell}>
              <Text style={styles.cellLabel}>YOGA & KARANA</Text>
              <Text style={styles.cellValue}>Shobhana</Text>
              <Text style={styles.cellSub}>Kaulava</Text>
            </View>
          </View>

          {/* Row 2: Abhijit Muhurat & Rahu Kaal */}
          <View style={styles.gridRow}>
            <View style={[styles.cell, styles.auspiciousCell]}>
              <View style={styles.cellHeaderRow}>
                <Text style={styles.auspiciousLabel}>ABHIJIT MUHURAT</Text>
                <View style={styles.auspiciousDot} />
              </View>
              <Text style={styles.auspiciousValue}>11:54 AM - 12:44 PM</Text>
              <Text style={styles.auspiciousSub}>Auspicious Window</Text>
            </View>

            <View style={[styles.cell, styles.cautionCell]}>
              <View style={styles.cellHeaderRow}>
                <Text style={styles.cautionLabel}>RAHU KAAL</Text>
                <View style={styles.cautionDot} />
              </View>
              <Text style={styles.cautionValue}>03:20 PM - 04:52 PM</Text>
              <Text style={styles.cautionSub}>Avoid new starts</Text>
            </View>
          </View>
        </View>

        {/* Quick Action Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('KundliExplorer')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>
            View Full Planetary Positions & Horas ›
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md - 2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.15)',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  grid: {
    gap: 8,
    marginBottom: spacing.xs + 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cellHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cellLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cellValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cellSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  auspiciousCell: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  auspiciousLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  auspiciousDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16a34a',
  },
  auspiciousValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#14532D',
  },
  auspiciousSub: {
    fontSize: 9.5,
    color: '#166534',
    marginTop: 1,
  },
  cautionCell: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  cautionLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#9F1239',
    letterSpacing: 0.5,
  },
  cautionDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#e11d48',
  },
  cautionValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#881337',
  },
  cautionSub: {
    fontSize: 9.5,
    color: '#9F1239',
    marginTop: 1,
  },
  actionButton: {
    paddingTop: 8,
    paddingBottom: 2,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
  },
});
