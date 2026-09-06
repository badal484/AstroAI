import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { env } from '../config/env';
import { signInWithGoogle as apiSignInWithGoogle } from '../lib/authApi';
import { ApiError } from '../lib/apiError';
import { secureStorage } from '../lib/secureStorage';
import {
  configureGoogleSignIn,
  isGoogleSignInCancelled,
  signInWithGoogle as nativeSignInWithGoogle,
} from '../services/googleAuth';
import { useAuthStore } from '../stores/authStore';
import { colors, radius, spacing, typography } from '../theme';

let configured = false;
function ensureConfigured(): void {
  if (configured) return;
  configureGoogleSignIn(env.googleWebClientId);
  configured = true;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'ACCOUNT_SUSPENDED') {
      return 'This account has been suspended. Contact support for help.';
    }
    if (error.code === 'ACCOUNT_DELETED') {
      return 'This account no longer exists.';
    }
    if (error.code === 'INVALID_CREDENTIALS') {
      return 'Sign-in failed. Please try again.';
    }
    return error.message;
  }
  return "Couldn't connect. Check your internet connection and try again.";
}

export function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePress() {
    if (isSubmitting) return; // guards against duplicate double-tap requests
    ensureConfigured();
    setError(null);
    setIsSubmitting(true);

    try {
      const idToken = await nativeSignInWithGoogle();
      const result = await apiSignInWithGoogle(idToken);
      await secureStorage.setRefreshToken(result.tokens.refreshToken);
      setSession(result.user, result.tokens.accessToken);
    } catch (caught) {
      if (!isGoogleSignInCancelled(caught)) {
        setError(errorMessage(caught));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDevLogin() {
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await apiSignInWithGoogle('dev_token:explorer@astroai.test');
      await secureStorage.setRefreshToken(result.tokens.refreshToken);
      setSession(result.user, result.tokens.accessToken);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Cosmic Branding & Emblem */}
        <View style={styles.brandContainer}>
          <View style={styles.emblemRing}>
            <Text style={styles.emblemText}>A</Text>
          </View>
          <Text style={styles.title}>AstroAI</Text>
          <Text style={styles.tagline}>Vedic Astrology & AI Guidance</Text>
        </View>

        {/* Value Proposition Pills */}
        <View style={styles.pillarsContainer}>
          <View style={styles.pillarRow}>
            <View style={styles.pillarIndicator} />
            <Text style={styles.pillarText}>100% Private Vedic Calculations</Text>
          </View>
          <View style={styles.pillarRow}>
            <View style={styles.pillarIndicator} />
            <Text style={styles.pillarText}>Live Voice & AI Chat Astrologers</Text>
          </View>
          <View style={styles.pillarRow}>
            <View style={styles.pillarIndicator} />
            <Text style={styles.pillarText}>Accurate Kundli & 36-Guna Milan</Text>
          </View>
        </View>

        {/* Sign In Action Card */}
        <View style={styles.actionCard}>
          <Text style={styles.subtitle}>Sign in to continue</Text>
          <Text style={styles.subtext}>
            Access your birth profiles, Kundlis, and personalized consultations.
          </Text>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={() => {
              void handlePress();
            }}
            disabled={isSubmitting}
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.buttonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity
              style={[styles.devButton, isSubmitting && styles.buttonDisabled]}
              onPress={() => {
                void handleDevLogin();
              }}
              disabled={isSubmitting}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={styles.devButtonText}>Instant Demo Login (Dev Mode)</Text>
            </TouchableOpacity>
          )}

          {error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}

          <Text style={styles.privacyNote}>
            Your birth details and consultations are encrypted and private.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emblemRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.backgroundHighlight,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emblemText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.gold,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  tagline: {
    ...typography.caption,
    color: colors.goldLight,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  pillarsContainer: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pillarIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  pillarText: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
  },
  actionCard: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  button: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    width: '100%',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textInverse,
  },
  buttonText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textInverse,
  },
  devButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: colors.gold,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    width: '100%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  devButtonText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.gold,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  privacyNote: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
