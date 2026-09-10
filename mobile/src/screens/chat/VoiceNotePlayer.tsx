import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AstroIcon } from '../../components/ui/AstroIcon';
import { colors, radius, spacing, typography } from '../../theme';

interface Props {
  durationSeconds?: number | null;
}

export function VoiceNotePlayer({ durationSeconds = 48 }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1.0x' | '1.5x'>('1.0x');
  const [elapsed, setElapsed] = useState(0);

  const total = durationSeconds ?? 48;

  // Animated wave bars
  const bar1 = useRef(new Animated.Value(6)).current;
  const bar2 = useRef(new Animated.Value(12)).current;
  const bar3 = useRef(new Animated.Value(18)).current;
  const bar4 = useRef(new Animated.Value(10)).current;
  const bar5 = useRef(new Animated.Value(15)).current;
  const bar6 = useRef(new Animated.Value(8)).current;
  const bar7 = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      timer = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= total) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / (playbackSpeed === '1.5x' ? 1.5 : 1));
    }
    return () => clearInterval(timer);
  }, [isPlaying, total, playbackSpeed]);

  useEffect(() => {
    if (!isPlaying) return;

    const animateBar = (anim: Animated.Value, min: number, max: number, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: max,
            duration: dur,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: min,
            duration: dur,
            useNativeDriver: false,
          }),
        ]),
      );

    const anim1 = animateBar(bar1, 4, 16, 250);
    const anim2 = animateBar(bar2, 6, 20, 320);
    const anim3 = animateBar(bar3, 5, 22, 280);
    const anim4 = animateBar(bar4, 4, 18, 350);
    const anim5 = animateBar(bar5, 6, 21, 290);
    const anim6 = animateBar(bar6, 3, 15, 310);
    const anim7 = animateBar(bar7, 5, 19, 270);

    anim1.start();
    anim2.start();
    anim3.start();
    anim4.start();
    anim5.start();
    anim6.start();
    anim7.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
      anim4.stop();
      anim5.stop();
      anim6.stop();
      anim7.stop();
    };
  }, [isPlaying, bar1, bar2, bar3, bar4, bar5, bar6, bar7]);

  function togglePlay() {
    setIsPlaying((prev) => !prev);
  }

  function toggleSpeed() {
    setPlaybackSpeed((prev) => (prev === '1.0x' ? '1.5x' : '1.0x'));
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.playButton}
        onPress={togglePlay}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause Acharya Voice Note' : 'Play Acharya Voice Note'}
      >
        <AstroIcon name={isPlaying ? 'pause' : 'play'} size={12} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.audioContent}>
        <View style={styles.labelRow}>
          <View style={styles.voiceTitleRow}>
            <AstroIcon name="mic" size={11} color={colors.primary} />
            <Text style={styles.voiceTitle}>Suniye Acharya Ji ki Vani</Text>
          </View>
          <Text style={styles.durationText}>
            {isPlaying ? formatTime(elapsed) : formatTime(total)}
          </Text>
        </View>

        {/* Animated Waveform */}
        <View style={styles.waveformContainer}>
          {[bar1, bar2, bar3, bar4, bar5, bar6, bar7, bar3, bar2, bar4, bar6, bar5].map(
            (anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.waveformBar,
                  {
                    height: anim,
                    backgroundColor: isPlaying ? colors.primary : colors.borderFocus,
                  },
                ]}
              />
            ),
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.speedButton}
        onPress={toggleSpeed}
        accessibilityRole="button"
        accessibilityLabel={`Playback speed ${playbackSpeed}`}
      >
        <Text style={styles.speedText}>{playbackSpeed}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.xs + 2,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioContent: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  voiceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voiceTitle: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  durationText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    gap: 3,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
  speedButton: {
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  speedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
