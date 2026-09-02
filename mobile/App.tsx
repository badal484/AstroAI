/**
 * AstroAI mobile app entry point.
 *
 * @format
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { refreshSession } from './src/lib/authApi';
import { secureStorage } from './src/lib/secureStorage';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/authStore';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const queryClientRef = useRef<QueryClient>(new QueryClient());
  const status = useAuthStore(state => state.status);
  const setLoading = useAuthStore(state => state.setLoading);
  const setSession = useAuthStore(state => state.setSession);
  const setUnauthenticated = useAuthStore(state => state.setUnauthenticated);

  // Cold-start session restore ("session persistence" / "authentication
  // loading state"): a refresh token surviving in encrypted storage from a
  // previous launch is exchanged for a fresh access token before any
  // protected screen renders. No token, or an unrecoverable one (expired
  // past rotation, revoked), lands the user on the Auth stack instead.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading();
      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken) {
        if (!cancelled) setUnauthenticated();
        return;
      }

      try {
        const result = await refreshSession(refreshToken);
        if (cancelled) return;
        await secureStorage.setRefreshToken(result.tokens.refreshToken);
        setSession(result.user, result.tokens.accessToken);
      } catch {
        if (!cancelled) {
          await secureStorage.clearRefreshToken();
          setUnauthenticated();
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
    // Runs once on mount only — this is a cold-start bootstrap, not a
    // reaction to auth-state changes (which the actions themselves cause).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Logging out (locally or via a forced session teardown from apiClient's
  // refresh failure) must not leave stale protected data behind for a
  // moment before navigation swaps away — clearing the query cache here
  // covers "logout during API request": any query that resolves after
  // logout is discarded rather than rendered.
  useEffect(() => {
    if (status === 'unauthenticated') {
      queryClientRef.current.clear();
    }
  }, [status]);

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <RootNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default App;
