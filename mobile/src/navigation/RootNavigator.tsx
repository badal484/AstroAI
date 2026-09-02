import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';

/**
 * Switches the entire navigator (not just a screen) based on auth status —
 * the "protected navigation" requirement: an unauthenticated user can never
 * reach an AppStack screen because that navigator is never mounted for
 * them, and vice versa. `idle`/`loading` render the bootstrap loading state
 * (see App.tsx's silent-refresh-on-cold-start) with no navigator mounted
 * yet, so nothing flashes before the auth check resolves.
 */
export function RootNavigator() {
  const status = useAuthStore(state => state.status);

  if (status === 'idle' || status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {status === 'authenticated' ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
