import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PalmistryAnalysisResult } from '@astroai/shared-types';
import { analyzePalm } from '../../lib/astrologyApi';
import type { AppStackParamList } from '../../navigation/AppStack';
import { colors, radius, spacing, typography } from '../../theme';
import { AstroIcon } from '../../components/ui/AstroIcon';

export function PalmScannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [selectedHand, setSelectedHand] = useState<'right' | 'left'>('right');
  const [isScanning, setIsScanning] = useState(false);
  const [analysis, setAnalysis] = useState<PalmistryAnalysisResult | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: () => analyzePalm({ hand: selectedHand }),
    onSuccess: (result) => {
      setAnalysis(result);
      setIsScanning(false);
    },
    onError: () => {
      setIsScanning(false);
    },
  });

  function handleStartScan() {
    setIsScanning(true);
    setTimeout(() => {
      analyzeMutation.mutate();
    }, 1800);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Top Sacred Title */}
      <View style={styles.titleSection}>
        <Text style={styles.badge}>SAMUDRIKA SHASTRA (सामुद्रिक शास्त्र)</Text>
        <Text style={styles.screenTitle}>AI Palmistry Scanner</Text>
        <Text style={styles.screenSubtitle}>
          Computer vision line mapping cross-referenced with your Janma Kundli
        </Text>
      </View>

      {/* Hand Switcher */}
      <View style={styles.handSwitcher}>
        <TouchableOpacity
          style={[styles.handBtn, selectedHand === 'right' && styles.handBtnActive]}
          onPress={() => setSelectedHand('right')}
          accessibilityRole="button"
        >
          <Text style={[styles.handBtnText, selectedHand === 'right' && styles.handBtnTextActive]}>
            Right Hand (Active Karma)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.handBtn, selectedHand === 'left' && styles.handBtnActive]}
          onPress={() => setSelectedHand('left')}
          accessibilityRole="button"
        >
          <Text style={[styles.handBtnText, selectedHand === 'left' && styles.handBtnTextActive]}>
            Left Hand (Inherent Prana)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Camera Viewfinder / Scanner Frame */}
      <View style={styles.viewfinder}>
        <View style={styles.viewfinderGuide}>
          <AstroIcon name="palm" size={64} color={colors.primary} />
          {isScanning && (
            <View style={styles.scanningOverlay}>
              <View style={styles.scanBeam} />
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.scanningText}>Detecting Mounts & Sacred Lines…</Text>
            </View>
          )}
        </View>

        {!isScanning && (
          <TouchableOpacity
            style={styles.scanActionBtn}
            onPress={handleStartScan}
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Text style={styles.scanActionBtnText}>
              {analysis ? 'Scan Another Palm' : 'Align Palm & Scan Now'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Analysis Results Display */}
      {analysis && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultHeader}>
            <View>
              <Text style={styles.resultTitle}>Samudrika Synthesis</Text>
              <Text style={styles.resultSubtitle}>{analysis.elementalHandType}</Text>
            </View>
            <View style={styles.scorePill}>
              <Text style={styles.scorePillText}>{analysis.overallScore}% Synergy</Text>
            </View>
          </View>

          <Text style={styles.synthesisText}>{analysis.samudrikaSynthesis}</Text>

          {/* Lines Breakdown */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DETECTED SACRED LINES (रेखाएं)</Text>
          </View>

          <View style={styles.lineCard}>
            <View style={styles.lineCardHeader}>
              <Text style={styles.lineCardTitle}>{analysis.lines.lifeLine.sanskritName}</Text>
              <Text style={styles.lineProminence}>{analysis.lines.lifeLine.prominence}</Text>
            </View>
            <Text style={styles.lineDesc}>{analysis.lines.lifeLine.interpretation}</Text>
            <Text style={styles.lineKundli}>{analysis.lines.lifeLine.kundliCorrelation}</Text>
          </View>

          <View style={styles.lineCard}>
            <View style={styles.lineCardHeader}>
              <Text style={styles.lineCardTitle}>{analysis.lines.heartLine.sanskritName}</Text>
              <Text style={styles.lineProminence}>{analysis.lines.heartLine.prominence}</Text>
            </View>
            <Text style={styles.lineDesc}>{analysis.lines.heartLine.interpretation}</Text>
            <Text style={styles.lineKundli}>{analysis.lines.heartLine.kundliCorrelation}</Text>
          </View>

          <View style={styles.lineCard}>
            <View style={styles.lineCardHeader}>
              <Text style={styles.lineCardTitle}>{analysis.lines.headLine.sanskritName}</Text>
              <Text style={styles.lineProminence}>{analysis.lines.headLine.prominence}</Text>
            </View>
            <Text style={styles.lineDesc}>{analysis.lines.headLine.interpretation}</Text>
            <Text style={styles.lineKundli}>{analysis.lines.headLine.kundliCorrelation}</Text>
          </View>

          <View style={styles.lineCard}>
            <View style={styles.lineCardHeader}>
              <Text style={styles.lineCardTitle}>{analysis.lines.fateLine.sanskritName}</Text>
              <Text style={styles.lineProminence}>{analysis.lines.fateLine.prominence}</Text>
            </View>
            <Text style={styles.lineDesc}>{analysis.lines.fateLine.interpretation}</Text>
            <Text style={styles.lineKundli}>{analysis.lines.fateLine.kundliCorrelation}</Text>
          </View>

          {/* Mounts Strengths */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>GRAHA MOUNT POTENCY (पर्वत शक्ति)</Text>
          </View>

          <View style={styles.mountsGrid}>
            {analysis.mounts.map((mount) => (
              <View key={mount.name} style={styles.mountCard}>
                <View style={styles.mountCardHeader}>
                  <Text style={styles.mountName}>{mount.name}</Text>
                  <Text style={styles.mountScore}>{mount.strength}%</Text>
                </View>
                <View style={styles.mountBarBg}>
                  <View style={[styles.mountBarFill, { width: `${mount.strength}%` }]} />
                </View>
                <Text style={styles.mountDesc}>{mount.interpretation}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    ...typography.overline,
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  screenTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  screenSubtitle: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
  },
  handSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  handBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  handBtnActive: {
    backgroundColor: colors.indigoMuted,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  handBtnText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  handBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  viewfinder: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  viewfinderGuide: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.backgroundInput,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  viewfinderIcon: {
    fontSize: 80,
    opacity: 0.7,
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  scanBeam: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowRadius: 10,
    shadowOpacity: 1,
  },
  scanningText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.indigoLight,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  scanActionBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  scanActionBtnText: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },
  resultsContainer: {
    marginTop: spacing.xs,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  resultTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  resultSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  scorePill: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  scorePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22c55e',
  },
  synthesisText: {
    ...typography.bodySecondary,
    fontSize: 12.5,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: spacing.md,
    backgroundColor: colors.indigoMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  sectionHeader: {
    marginBottom: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.overline,
    fontSize: 9.5,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  lineCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  lineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lineCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  lineProminence: {
    fontSize: 10,
    color: colors.textMuted,
  },
  lineDesc: {
    fontSize: 11,
    color: colors.textPrimary,
    lineHeight: 16,
    marginBottom: 4,
  },
  lineKundli: {
    fontSize: 10.5,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  mountsGrid: {
    gap: spacing.xs + 2,
  },
  mountCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  mountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mountName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  mountScore: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  mountBarBg: {
    height: 5,
    backgroundColor: colors.backgroundInput,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  mountBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  mountDesc: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
  },
});
