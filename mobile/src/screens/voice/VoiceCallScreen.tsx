import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  VoiceAudioFormat,
  VoiceEndReason,
  VoiceSessionStatus,
  type VoiceSessionDTO,
  type VoiceSessionSummaryDTO,
  type VoiceTurnDTO,
} from '@astroai/shared-types';
import {
  endVoiceSession,
  sendVoiceHeartbeat,
  sendVoiceTurn,
  startVoiceSession,
} from '../../lib/voiceApi';
import { fetchWalletBalance } from '../../lib/walletApi';
import { colors, radius, spacing, typography } from '../../theme';

export type VoiceCallState = 'CONNECTING' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ENDED';

interface VoiceCallScreenProps {
  astrologerId?: string;
  astrologerName?: string;
  birthProfileId?: string | null;
  onClose?: () => void;
}

function stringToBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let encoded = '';
  for (let i = 0; i < str.length; i += 3) {
    const b1 = str.charCodeAt(i);
    const b2 = str.charCodeAt(i + 1);
    const b3 = str.charCodeAt(i + 2);

    const c1 = b1 >> 2;
    const c2 = ((b1 & 3) << 4) | (isNaN(b2) ? 0 : b2 >> 4);
    const c3 = isNaN(b2) ? 64 : ((b2 & 15) << 2) | (isNaN(b3) ? 0 : b3 >> 6);
    const c4 = isNaN(b3) ? 64 : b3 & 63;

    encoded +=
      chars.charAt(c1) +
      chars.charAt(c2) +
      chars.charAt(c3) +
      chars.charAt(c4);
  }
  return encoded;
}

export function VoiceCallScreen({
  astrologerId = 'vedic-sage-1',
  astrologerName = 'Acharya Vashishta',
  birthProfileId = null,
  onClose,
}: VoiceCallScreenProps) {
  const queryClient = useQueryClient();

  const [callState, setCallState] = useState<VoiceCallState>('CONNECTING');
  const [session, setSession] = useState<VoiceSessionDTO | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [turns, setTurns] = useState<VoiceTurnDTO[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [summary, setSummary] = useState<VoiceSessionSummaryDTO | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim1 = useRef(new Animated.Value(0)).current;
  const rippleAnim2 = useRef(new Animated.Value(0)).current;
  const speechTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };
  }, []);

  // Pulse animation for Listening
  useEffect(() => {
    if (callState === 'LISTENING') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [callState, pulseAnim]);

  // Rotation animation for Processing
  useEffect(() => {
    if (callState === 'PROCESSING') {
      const loop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loop.start();
      return () => loop.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [callState, rotateAnim]);

  // Concentric ripple animation for Speaking
  useEffect(() => {
    if (callState === 'SPEAKING') {
      const createRipple = (anim: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1600,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        );

      const loop1 = createRipple(rippleAnim1, 0);
      const loop2 = createRipple(rippleAnim2, 800);
      loop1.start();
      loop2.start();

      return () => {
        loop1.stop();
        loop2.stop();
      };
    }
  }, [callState, rippleAnim1, rippleAnim2]);

  // 1. Initialize Voice Session
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const wallet = await fetchWalletBalance();
        if (isMounted) setAvailableCredits(wallet.availableBalance);

        const newSession = await startVoiceSession({
          astrologerId,
          birthProfileId,
          language: 'hi',
          idempotencyKey: `voice_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        });

        if (!isMounted) return;
        setSession(newSession);
        setCallState('LISTENING');
        setActiveTranscript('Pranam. Acharya Vashishta is listening. Please ask your question.');
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMessage(err.message || 'Unable to establish voice consultation');
        setCallState('ENDED');
      }
    }

    void initSession();

    return () => {
      isMounted = false;
    };
  }, [astrologerId, birthProfileId]);

  // Timer & Heartbeat Loop
  useEffect(() => {
    if (callState === 'ENDED' || !session) return;

    const interval = setInterval(() => {
      setDurationSeconds((prev) => {
        const nextSec = prev + 1;

        // Send heartbeat every 10 seconds
        if (nextSec % 10 === 0 && session) {
          sendVoiceHeartbeat(session.id, { currentDurationSeconds: nextSec })
            .then((res) => {
              if (res.shouldEnd) {
                handleEndCall(VoiceEndReason.TIMEOUT);
              }
            })
            .catch(() => undefined);
        }

        return nextSec;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [callState, session]);

  // 2. Simulated Audio Turn
  const handleSimulateTurn = async (userPrompt: string) => {
    if (!session || callState === 'PROCESSING' || callState === 'ENDED') return;

    try {
      setCallState('PROCESSING');
      setActiveTranscript(`Seeking guidance for: "${userPrompt}"...`);
      setErrorMessage(null);

      const fakePcm = stringToBase64(`PCM_AUDIO_DATA_FOR_${userPrompt}`);

      const response = await sendVoiceTurn(session.id, {
        audioBase64: fakePcm,
        audioFormat: VoiceAudioFormat.WEBM,
        language: 'hi',
      });

      setTurns((prev) => [...prev, response.turn]);
      setCallState('SPEAKING');
      setActiveTranscript(response.turn.assistantText);

      // Return to listening state after simulated speech duration
      const speechTimeMs = Math.max(3000, (response.turn.durationSeconds || 3) * 1000);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = setTimeout(() => {
        setCallState('LISTENING');
        setActiveTranscript('Acharya is listening for your next question...');
      }, speechTimeMs);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing audio guidance');
      setCallState('LISTENING');
    }
  };

  // 3. End Call & Settle Billing
  const handleEndCall = async (reason: VoiceEndReason = VoiceEndReason.USER_ENDED) => {
    if (!session || callState === 'ENDED') {
      if (onClose) onClose();
      return;
    }

    setCallState('ENDED');
    try {
      const res = await endVoiceSession(session.id, {
        reason,
        clientDurationSeconds: durationSeconds,
      });
      setSummary(res);
      setShowSummaryModal(true);
      void queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
    } catch {
      if (onClose) onClose();
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Top Header: Session Status, Live Timer, Rate Info */}
      <View style={styles.header}>
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  callState === 'CONNECTING'
                    ? colors.warning
                    : callState === 'LISTENING'
                    ? colors.success
                    : callState === 'PROCESSING'
                    ? colors.celestialIndigo
                    : callState === 'SPEAKING'
                    ? colors.gold
                    : colors.danger,
              },
            ]}
          />
          <Text style={styles.statusText}>
            {callState === 'CONNECTING'
              ? 'Connecting...'
              : callState === 'LISTENING'
              ? 'Listening'
              : callState === 'PROCESSING'
              ? 'Reflecting on Chart'
              : callState === 'SPEAKING'
              ? 'Acharya Speaking'
              : 'Session Ended'}
          </Text>
        </View>

        {/* Live Timer */}
        <Text style={styles.timerText}>{formatTimer(durationSeconds)}</Text>

        {/* Rate & Free Tier Indicator */}
        <View style={styles.ratePill}>
          <Text style={styles.rateText}>5 Credits/min • First 30s Free</Text>
        </View>
      </View>

      {/* Astrologer Identity & Resonant Audio Visualizer */}
      <View style={styles.centerSection}>
        <Text style={styles.astrologerName}>{astrologerName}</Text>
        <Text style={styles.astrologerSubtitle}>Vedic Astrological Voice Consultation</Text>

        {/* Dynamic Celestial Visualizer */}
        <View style={styles.visualizerWrapper}>
          {/* Concentric Speaking Resonances */}
          {callState === 'SPEAKING' && (
            <>
              <Animated.View
                style={[
                  styles.rippleCircle,
                  {
                    transform: [
                      {
                        scale: rippleAnim1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2.1],
                        }),
                      },
                    ],
                    opacity: rippleAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 0],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.rippleCircle,
                  {
                    transform: [
                      {
                        scale: rippleAnim2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2.1],
                        }),
                      },
                    ],
                    opacity: rippleAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 0],
                    }),
                  },
                ]}
              />
            </>
          )}

          {/* Processing Geometric Indicator */}
          {callState === 'PROCESSING' && (
            <Animated.View
              style={[
                styles.processingRing,
                {
                  transform: [{ rotate: spin }],
                },
              ]}
            />
          )}

          {/* Core Celestial Sphere */}
          <Animated.View
            style={[
              styles.orbCore,
              callState === 'LISTENING' && { transform: [{ scale: pulseAnim }] },
              callState === 'SPEAKING' && { borderColor: colors.gold },
              callState === 'PROCESSING' && { borderColor: colors.celestialIndigo },
            ]}
          >
            {callState === 'CONNECTING' ? (
              <ActivityIndicator color={colors.gold} size="large" />
            ) : callState === 'LISTENING' ? (
              <View style={styles.activeListeningRing}>
                <View style={styles.coreDot} />
              </View>
            ) : callState === 'PROCESSING' ? (
              <View style={styles.coreDot} />
            ) : callState === 'SPEAKING' ? (
              <View style={[styles.coreDot, { backgroundColor: colors.gold }]} />
            ) : (
              <View style={[styles.coreDot, { backgroundColor: colors.danger }]} />
            )}
          </Animated.View>
        </View>

        {/* Live Audio Transcript Box */}
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptText} numberOfLines={3}>
            {activeTranscript}
          </Text>
        </View>

        {/* Balance Warning */}
        {warningMessage && (
          <View style={styles.warningPill}>
            <Text style={styles.warningText}>{warningMessage}</Text>
          </View>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <View style={styles.errorPill}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </View>

      {/* Suggested Quick Questions */}
      {callState === 'LISTENING' && (
        <View style={styles.quickQuestionsContainer}>
          <Text style={styles.quickQuestionsLabel}>SUGGESTED TOPICS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickQuestionsScroll}
          >
            {[
              'Career Dasha guidance',
              'Marriage timing & 7th house',
              'Current transit effects',
              'Financial prospects',
            ].map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.questionPill}
                onPress={() => void handleSimulateTurn(q)}
                activeOpacity={0.7}
              >
                <Text style={styles.questionPillText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Audio Controls Bar */}
      <View style={styles.controlsRow}>
        {/* Mute Button */}
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={() => setIsMuted((prev) => !prev)}
          activeOpacity={0.8}
          accessibilityLabel={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          <Text style={styles.controlButtonLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        {/* End Call Button */}
        <TouchableOpacity
          style={styles.endCallButton}
          onPress={() => void handleEndCall(VoiceEndReason.USER_ENDED)}
          activeOpacity={0.85}
          accessibilityLabel="End consultation"
        >
          <Text style={styles.endCallText}>End Session</Text>
        </TouchableOpacity>

        {/* Speaker Toggle Button */}
        <TouchableOpacity
          style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
          onPress={() => setIsSpeakerOn((prev) => !prev)}
          activeOpacity={0.8}
          accessibilityLabel="Toggle speaker"
        >
          <Text style={styles.controlButtonLabel}>{isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text>
        </TouchableOpacity>
      </View>

      {/* Session Settle Billing Summary Modal */}
      <Modal visible={showSummaryModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Consultation Completed</Text>
            <Text style={styles.modalSubtitle}>Session summary with Acharya Vashishta</Text>

            <View style={styles.summaryTable}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Duration</Text>
                <Text style={styles.summaryValue}>{formatTimer(summary?.durationSeconds ?? durationSeconds)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Free Allowance</Text>
                <Text style={styles.summaryValue}>{summary?.isFreeTier ? 'Complimentary period' : '30s applied'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Billable Duration</Text>
                <Text style={styles.summaryValue}>{summary?.billableSeconds ?? 0}s</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
                <Text style={styles.summaryLabelGold}>Credits Debited</Text>
                <Text style={styles.summaryValueGold}>{summary?.creditsCharged ?? 0} Credits</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remaining Balance</Text>
                <Text style={styles.summaryValue}>{summary?.availableBalance ?? availableCredits} Credits</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowSummaryModal(false);
                if (onClose) onClose();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCardElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timerText: {
    ...typography.display,
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
  ratePill: {
    backgroundColor: colors.indigoMuted,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    borderRadius: radius.sm,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  rateText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  astrologerName: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  astrologerSubtitle: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    marginTop: 2,
  },
  visualizerWrapper: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
  rippleCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  processingRing: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  orbCore: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeListeningRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  transcriptBox: {
    minHeight: 56,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: 320,
    justifyContent: 'center',
  },
  transcriptText: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },
  warningPill: {
    backgroundColor: colors.warningBackground,
    borderRadius: radius.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
  },
  errorPill: {
    backgroundColor: colors.dangerBackground,
    borderRadius: radius.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
  quickQuestionsContainer: {
    gap: spacing.xs,
  },
  quickQuestionsLabel: {
    ...typography.overline,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  quickQuestionsScroll: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  questionPill: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 2,
  },
  questionPillText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  controlButton: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 80,
    alignItems: 'center',
  },
  controlButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.indigoMuted,
  },
  controlButtonLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  endCallButton: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallText: {
    ...typography.body,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  summaryTable: {
    backgroundColor: colors.backgroundInput,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowHighlight: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.bodySecondary,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryLabelGold: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryValueGold: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  modalCloseButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  modalCloseButtonText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
