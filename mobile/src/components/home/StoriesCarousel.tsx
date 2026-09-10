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
import { AstroIcon, type AstroIconName } from '../ui/AstroIcon';
import { colors, radius, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<AppStackParamList>;

interface StoryItem {
  id: string;
  title: string;
  iconName: AstroIconName;
  badge?: string;
  badgeColor?: string;
  action: (nav: Nav) => void;
}

const STORIES: StoryItem[] = [
  {
    id: 'panchang',
    title: 'Panchang',
    iconName: 'sun',
    badge: 'LIVE',
    badgeColor: colors.danger,
    action: (nav) => nav.navigate('KundliExplorer'),
  },
  {
    id: 'horoscope',
    title: 'Horoscope',
    iconName: 'rashi',
    badge: 'TODAY',
    badgeColor: colors.primary,
    action: (nav) => nav.navigate('KundliExplorer'),
  },
  {
    id: 'matching',
    title: 'Kundli Milan',
    iconName: 'compatibility',
    badge: 'HOT',
    badgeColor: colors.indigoLight,
    action: (nav) => nav.navigate('Compatibility'),
  },
  {
    id: 'palmistry',
    title: 'Palm Scan',
    iconName: 'palm',
    badge: 'AI',
    badgeColor: colors.mysticPurple,
    action: (nav) => nav.navigate('PalmScanner'),
  },
  {
    id: 'puja',
    title: 'Sanctuary',
    iconName: 'puja',
    badge: 'TEMPLE',
    badgeColor: '#D97706',
    action: (nav) => nav.navigate('PujaCatalog'),
  },
  {
    id: 'dasha',
    title: 'Dasha Clock',
    iconName: 'saturn',
    action: (nav) => nav.navigate('DashaTimeline'),
  },
  {
    id: 'reports',
    title: 'Reports',
    iconName: 'report',
    badge: 'NEW',
    badgeColor: colors.success,
    action: (nav) => nav.navigate('ReportCatalog'),
  },
];

export function StoriesCarousel() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {STORIES.map((story) => (
          <TouchableOpacity
            key={story.id}
            style={styles.storyItem}
            onPress={() => story.action(navigation)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={story.title}
          >
            <View style={styles.ringOuter}>
              <View style={styles.avatarInner}>
                <AstroIcon name={story.iconName} size={20} color={colors.primary} />
              </View>
              {story.badge && (
                <View
                  style={[
                    styles.badgeContainer,
                    { backgroundColor: story.badgeColor || colors.primary },
                  ]}
                >
                  <Text style={styles.badgeText}>{story.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.storyTitle} numberOfLines={1}>
              {story.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: 10,
  },
  storyItem: {
    alignItems: 'center',
    width: 62,
  },
  ringOuter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: -4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storyTitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 6,
    textAlign: 'center',
  },
});
