import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { GuruPersonaId, type GuruProfile, GURU_PROFILES } from '@astroai/shared-types';
import { AstroIcon } from '../../components/ui/AstroIcon';
import { colors, radius, spacing, typography } from '../../theme';

interface Props {
  visible: boolean;
  selectedPersonaId?: GuruPersonaId | null;
  onSelectPersona: (persona: GuruProfile) => void;
  onClose: () => void;
}

const GURUS: GuruProfile[] = Object.values(GURU_PROFILES);

export function GuruPickerModal({
  visible,
  selectedPersonaId = GuruPersonaId.ACHARYA_VASHISHTA,
  onSelectPersona,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Guru Mandala</Text>
              <Text style={styles.subtitle}>Choose your specialized Vedic Astrologer</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button">
              <AstroIcon name="close" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.guruList} showsVerticalScrollIndicator={false}>
            {GURUS.map((guru) => {
              const isSelected = (selectedPersonaId || GuruPersonaId.ACHARYA_VASHISHTA) === guru.id;
              return (
                <TouchableOpacity
                  key={guru.id}
                  style={[styles.guruCard, isSelected && styles.guruCardActive]}
                  onPress={() => {
                    onSelectPersona(guru);
                    onClose();
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatar, isSelected && styles.avatarActive]}>
                      <Text style={[styles.avatarLetter, isSelected && styles.avatarLetterActive]}>
                        {guru.avatarLetter}
                      </Text>
                    </View>
                    <View style={styles.info}>
                      <View style={styles.nameRow}>
                        <Text style={styles.guruName}>{guru.name}</Text>
                        {isSelected && (
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>Active</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.guruTitle}>{guru.title}</Text>
                      <View style={styles.expRow}>
                        <AstroIcon name="sparkle" size={9} color={colors.primary} />
                        <Text style={styles.experienceText}>{guru.experienceYears}+ yrs Vedic Experience</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.specialtyContainer}>
                    <Text style={styles.specialtyLabel}>Specialty</Text>
                    <Text style={styles.specialtyText}>{guru.specialty}</Text>
                  </View>

                  <View style={styles.mantraBox}>
                    <AstroIcon name="sparkle" size={10} color={colors.primary} />
                    <Text style={styles.mantraText}>{guru.greetingMantra}</Text>
                  </View>

                  <Text style={styles.tagline}>{guru.tagline}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  guruList: {
    padding: spacing.md,
    gap: spacing.md,
  },
  guruCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  guruCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  avatarLetterActive: {
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guruName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  activeBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  guruTitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  experienceText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  specialtyContainer: {
    marginTop: spacing.xs + 2,
    backgroundColor: colors.backgroundElevated,
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  specialtyLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specialtyText: {
    fontSize: 11,
    color: colors.textPrimary,
    marginTop: 1,
  },
  mantraBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
  },
  mantraText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  tagline: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
