import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { deleteAccount, logoutSession } from '../lib/authApi';
import { secureStorage } from '../lib/secureStorage';
import type { AppStackParamList } from '../navigation/AppStack';
import { useAuthStore } from '../stores/authStore';

type Nav = NativeStackNavigationProp<AppStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore(state => state.user);
  const setUnauthenticated = useAuthStore(state => state.setUnauthenticated);
  const [isBusy, setIsBusy] = useState(false);

  async function handleLogout() {
    setIsBusy(true);
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        // Best-effort: the session is torn down locally regardless of
        // whether this network call succeeds (CLAUDE.md's "network
        // failure" and "logout during API request" handling) — the user
        // should never be stuck signed in locally just because the
        // logout request itself failed to reach the server.
        await logoutSession(refreshToken).catch(() => undefined);
      }
    } finally {
      await secureStorage.clearRefreshToken();
      setUnauthenticated();
      setIsBusy(false);
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void handleDeleteAccount();
          },
        },
      ],
    );
  }

  async function handleDeleteAccount() {
    setIsBusy(true);
    try {
      await deleteAccount();
    } catch {
      // Even if the request fails, fall through to a local sign-out below
      // rather than leaving the user stuck on a broken "delete" attempt —
      // they can retry once signed back in.
    } finally {
      await secureStorage.clearRefreshToken();
      setUnauthenticated();
      setIsBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Welcome{user?.name ? `, ${user.name}` : ''}
      </Text>
      <Text style={styles.subtitle}>{user?.email ?? 'No email on file'}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('BirthProfileList')}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Birth profiles</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          void handleLogout();
        }}
        disabled={isBusy}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.destructive]}
        onPress={confirmDeleteAccount}
        disabled={isBusy}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Delete account</Text>
      </TouchableOpacity>
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
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 180,
    alignItems: 'center',
  },
  destructive: {
    backgroundColor: '#c0392b',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
