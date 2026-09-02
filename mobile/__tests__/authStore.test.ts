import { useAuthStore } from '../src/stores/authStore';

const user = {
  id: 'user-1',
  email: 'user@astroai.test',
  name: 'Test User',
  avatarUrl: null,
  language: 'en',
  role: 'user' as const,
  status: 'active' as const,
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  useAuthStore.setState({ status: 'idle', user: null, accessToken: null });
});

describe('authStore', () => {
  test('starts idle', () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe('idle');
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  test('setLoading flips status without touching user/token', () => {
    useAuthStore.getState().setSession(user, 'token-1');
    useAuthStore.getState().setLoading();
    const state = useAuthStore.getState();
    expect(state.status).toBe('loading');
  });

  test('setSession stores the user and access token', () => {
    useAuthStore.getState().setSession(user, 'token-1');
    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe('token-1');
  });

  test('setUnauthenticated clears user and access token', () => {
    useAuthStore.getState().setSession(user, 'token-1');
    useAuthStore.getState().setUnauthenticated();
    const state = useAuthStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });
});
