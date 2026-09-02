import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
  const setSession = useAuthStore(state => state.setSession);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AstroAI</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={() => {
          void handlePress();
        }}
        disabled={isSubmitting}
        accessibilityRole="button"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue with Google</Text>
        )}
      </TouchableOpacity>

      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 220,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#c0392b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});
