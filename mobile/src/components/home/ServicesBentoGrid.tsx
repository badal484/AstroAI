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
import { AstroIcon, type AstroIconName } from '../ui/AstroIcon';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AppStackParamList>;

interface ServiceCardItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: AstroIconName;
  badge?: string;
  badgeColor?: string;
  borderColor?: string;
  bgTint?: string;
  onPress: (nav: Nav) => void;
}

const SERVICES: ServiceCardItem[] = [
  {
    id: 'kundli-milan',
    title: 'Kundli Milan',
    subtitle: '36 Gunas & Match',
    iconName: 'compatibility',
    badge: 'POPULAR',
    badgeColor: colors.primary,
    borderColor: colors.borderSubtle,
    bgTint: colors.backgroundCard,
    onPress: (nav) => nav.navigate('Compatibility'),
  },
  {
    id: 'free-kundli',
    title: 'Janam Kundli',
    subtitle: 'D1 Lagna & D9 Chart',
    iconName: 'kundli',
    badge: 'FREE',
    badgeColor: colors.success,
    borderColor: colors.borderSubtle,
    bgTint: colors.backgroundCard,
    onPress: (nav) => nav.navigate('KundliExplorer'),
  },
  {
    id: 'palmistry',
    title: 'Palmistry AI',
    subtitle: 'Scan Palm Lines',
    iconName: 'palm',
    badge: 'AI SCAN',
    badgeColor: colors.indigo,
    borderColor: colors.borderSubtle,
    bgTint: colors.backgroundCard,
    onPress: (nav) => nav.navigate('PalmScanner'),
  },
  {
    id: 'dasha-clock',
    title: 'Dasha Timeline',
    subtitle: 'Mahadasha & Sub-cycles',
    iconName: 'saturn',
    borderColor: colors.borderSubtle,
    bgTint: colors.backgroundCard,
    onPress: (nav) => nav.navigate('DashaTimeline'),
  },
  {
    id: 'puja',
    title: 'Temple Sanctuary',
    subtitle: 'Sacred Temple Rituals',
    iconName: 'puja',
    badge: 'TEMPLE',
    badgeColor: colors.primary,
    borderColor: colors.borderSubtle,
    bgTint: colors.backgroundCard,
    onPress: (nav) => nav.navigate('PujaCatalog'),
  },
  {
    id: 'reports',
    title: 'Life Reports',
    subtitle: '50+ Page Vedic PDF',
    iconName: 'report',
    borderColor: colors.borderSubtle,
    bgTint: colors.backgroundCard,
    onPress: (nav) => nav.navigate('ReportCatalog'),
  },
];

export function ServicesBentoGrid() {
  const navigation = useNavigation<Nav>();

  const rows: ServiceCardItem[][] = [];
  for (let i = 0; i < SERVICES.length; i += 2) {
    rows.push(SERVICES.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionOverline}>VEDIC SERVICES</Text>
          <Text style={styles.sectionTitle}>Astrology & Remedial Tools</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {rows.map((pair, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {pair.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  {
                    borderColor: item.borderColor || colors.borderSubtle,
                    backgroundColor: item.bgTint || '#FFFFFF',
                  },
                ]}
                onPress={() => item.onPress(navigation)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}: ${item.subtitle}`}
              >
                <View style={styles.topRow}>
                  <View style={styles.emojiWrapper}>
                    <AstroIcon name={item.iconName} size={18} color={colors.primary} />
                  </View>
                  {item.badge && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: item.badgeColor || colors.primary },
                      ]}
                    >
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionOverline: {
    ...typography.overline,
    color: colors.primary,
    marginBottom: 2,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  grid: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: '#FFFFFF',
    ...shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs + 2,
  },
  emojiWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
