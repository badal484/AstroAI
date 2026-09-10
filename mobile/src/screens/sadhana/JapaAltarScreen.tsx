import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AstroIcon } from '../../components/ui/AstroIcon';
import { colors, radius, spacing, typography } from '../../theme';

interface MantraOption {
  id: string;
  name: string;
  deity: string;
  sanskrit: string;
  transliteration: string;
  benefit: string;
}

const MANTRAS: MantraOption[] = [
  {
    id: 'maha_mrityunjaya',
    name: 'Maha Mrityunjaya Mantra',
    deity: 'Lord Shiva',
    sanskrit: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्व्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात्॥',
    transliteration: 'Om Tryambakam Yajamahe Sugandhim Pushti-Vardhanam | Urvarukamiva Bandhanan Mrityor Mukshiya Mamritat ||',
    benefit: 'Overcomes fears, bestows supreme vitality, health, and karmic protection.',
  },
  {
    id: 'gayatri',
    name: 'Gayatri Mahamantra',
    deity: 'Goddess Gayatri / Surya',
    sanskrit: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्॥',
    transliteration: 'Om Bhur Bhuvah Swaha Tat Savitur Varenyam | Bhargo Devasya Dheemahi Dhiyo Yo Nah Prachodayat ||',
    benefit: 'Awakens higher intellect, spiritual illumination, and inner peace.',
  },
  {
    id: 'ganesh_beej',
    name: 'Ganesh Beej Mantra',
    deity: 'Lord Ganesha',
    sanskrit: 'ॐ गं गणपतये नमः॥',
    transliteration: 'Om Gam Ganapataye Namaha ||',
    benefit: 'Removes all obstacles, brings auspicious beginnings, and wisdom.',
  },
  {
    id: 'shani_shanti',
    name: 'Shani Shanti Mantra',
    deity: 'Lord Shani Dev',
    sanskrit: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः॥',
    transliteration: 'Om Praam Preem Proum Sah Shanaishcharaya Namaha ||',
    benefit: 'Harmonizes Saturn influences, brings patience, discipline, and stability.',
  },
];

export function JapaAltarScreen() {
  const [selectedMantra, setSelectedMantra] = useState<MantraOption>(MANTRAS[0]!);
  const [beadCount, setBeadCount] = useState(0);
  const [completedMalas, setCompletedMalas] = useState(1);
  const [streakDays] = useState(7);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const beadScaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  function handleChantBead() {
    Animated.sequence([
      Animated.timing(beadScaleAnim, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(beadScaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    if (beadCount + 1 >= 108) {
      setBeadCount(0);
      setCompletedMalas((prev) => prev + 1);
      // Trigger golden celebration shimmer
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    } else {
      setBeadCount((prev) => prev + 1);
    }
  }

  function handleReset() {
    setBeadCount(0);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Sadhana Streak Header */}
      <View style={styles.streakBar}>
        <View style={styles.streakBadge}>
          <AstroIcon name="flame" size={16} color={colors.primary} />
          <Text style={styles.streakCount}>{streakDays} Days</Text>
          <Text style={styles.streakLabel}>Sadhana Streak</Text>
        </View>
        <View style={styles.totalMalasBadge}>
          <AstroIcon name="sanctuary" size={16} color={colors.primary} />
          <Text style={styles.malaCount}>{completedMalas} Malas</Text>
          <Text style={styles.streakLabel}>Completed Today</Text>
        </View>
      </View>

      {/* Mantra Selector Carousel */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mantraScroll}>
        {MANTRAS.map((m) => {
          const isSelected = selectedMantra.id === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.mantraTab, isSelected && styles.mantraTabActive]}
              onPress={() => setSelectedMantra(m)}
              accessibilityRole="button"
            >
              <Text style={[styles.mantraTabText, isSelected && styles.mantraTabTextActive]}>
                {m.name}
              </Text>
              <Text style={styles.mantraDeityText}>{m.deity}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sacred Mantra Display Box */}
      <View style={styles.mantraCard}>
        <Text style={styles.sanskritText}>{selectedMantra.sanskrit}</Text>
        <Text style={styles.transliterationText}>{selectedMantra.transliteration}</Text>
        <View style={styles.benefitRow}>
          <AstroIcon name="sparkle" size={10} color={colors.primary} />
          <Text style={styles.benefitText}>{selectedMantra.benefit}</Text>
        </View>
      </View>

      {/* Interactive 108 Japa Mala Counter Ring */}
      <View style={styles.japaAltarContainer}>
        <TouchableOpacity
          style={styles.japaTouchZone}
          onPress={handleChantBead}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Chant bead ${beadCount} of 108`}
        >
          <Animated.View style={[styles.malaRing, { transform: [{ scale: beadScaleAnim }] }]}>
            {/* 108 Bead Ring Simulation */}
            <View style={styles.innerCounterCircle}>
              <Text style={styles.countLarge}>{beadCount}</Text>
              <Text style={styles.countTarget}>/ 108</Text>
              <Text style={styles.tapPrompt}>Tap to Chant</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Action Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.audioButton}
            onPress={() => setIsPlayingAudio(!isPlayingAudio)}
            accessibilityRole="button"
          >
            <AstroIcon name={isPlayingAudio ? 'pause' : 'play'} size={12} color="#FFFFFF" />
            <Text style={styles.audioButtonText}>
              {isPlayingAudio ? 'Pause Sacred Chant' : 'Play Sacred Audio'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset} accessibilityRole="button">
            <Text style={styles.resetButtonText}>Reset Count</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  streakBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  streakBadge: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    gap: 2,
  },
  totalMalasBadge: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    gap: 2,
  },
  streakCount: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 2,
  },
  malaCount: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 2,
  },
  streakLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  mantraScroll: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  mantraTab: {
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  mantraTabActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  mantraTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  mantraTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  mantraDeityText: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 1,
  },
  mantraCard: {
    width: '100%',
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  sanskritText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 22,
  },
  transliterationText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    width: '100%',
  },
  benefitText: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    flex: 1,
  },
  japaAltarContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  japaTouchZone: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  malaRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primaryLight,
    borderWidth: 8,
    borderColor: colors.borderFocus,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  innerCounterCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countLarge: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
  },
  countTarget: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: -4,
  },
  tapPrompt: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  audioButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resetButton: {
    backgroundColor: colors.backgroundCard,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  resetButtonText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
