import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { LoginScreen } from '../src/screens/LoginScreen';
import { ApiError } from '../src/lib/apiError';
import { signInWithGoogle as apiSignInWithGoogle } from '../src/lib/authApi';
import {
  GoogleSignInCancelledError,
  signInWithGoogle as nativeSignInWithGoogle,
} from '../src/services/googleAuth';
import { useAuthStore } from '../src/stores/authStore';

// The cancelled-error class is declared inside this factory (not referenced
// from outer scope) — jest.mock factories may only close over module-scope
// bindings whose name starts with "mock" (case-insensitive).
jest.mock('../src/services/googleAuth', () => {
  class MockGoogleSignInCancelledError extends Error {}
  return {
    configureGoogleSignIn: jest.fn(),
    signInWithGoogle: jest.fn(),
    isGoogleSignInCancelled: (error: unknown) =>
      error instanceof MockGoogleSignInCancelledError,
    GoogleSignInCancelledError: MockGoogleSignInCancelledError,
  };
});

jest.mock('../src/lib/authApi', () => ({
  signInWithGoogle: jest.fn(),
}));

jest.mock('../src/lib/secureStorage', () => ({
  secureStorage: { setRefreshToken: jest.fn() },
}));

const mockNativeSignIn = jest.mocked(nativeSignInWithGoogle);
const mockApiSignIn = jest.mocked(apiSignInWithGoogle);

const authResponse = {
  user: {
    id: 'user-1',
    email: 'user@astroai.test',
    name: 'Test User',
    avatarUrl: null,
    language: 'en',
    role: 'user' as const,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  },
  tokens: {
    accessToken: 'access-token',
    accessTokenExpiresAt: new Date().toISOString(),
    refreshToken: 'refresh-token',
    refreshTokenExpiresAt: new Date().toISOString(),
  },
};

beforeEach(() => {
  mockNativeSignIn.mockReset();
  mockApiSignIn.mockReset();
  useAuthStore.setState({ status: 'idle', user: null, accessToken: null });
});

describe('LoginScreen', () => {
  test('renders a Continue with Google button', async () => {
    await render(<LoginScreen />);
    expect(screen.getByText('Continue with Google')).toBeTruthy();
  });

  test('signs the user in and updates the auth store on success', async () => {
    mockNativeSignIn.mockResolvedValue('google-id-token');
    mockApiSignIn.mockResolvedValue(authResponse);

    await render(<LoginScreen />);
    fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe('authenticated'),
    );
    expect(useAuthStore.getState().user?.id).toBe('user-1');
    expect(mockApiSignIn).toHaveBeenCalledWith('google-id-token');
  });

  test('shows a specific message when the account is suspended', async () => {
    mockNativeSignIn.mockResolvedValue('google-id-token');
    mockApiSignIn.mockRejectedValue(
      new ApiError({
        code: 'ACCOUNT_SUSPENDED',
        status: 403,
        message: 'suspended',
        requestId: 'req-1',
      }),
    );

    await render(<LoginScreen />);
    fireEvent.press(screen.getByText('Continue with Google'));

    expect(await screen.findByText(/account has been suspended/i)).toBeTruthy();
    expect(useAuthStore.getState().status).toBe('idle');
  });

  test('shows a network-failure message on a non-ApiError rejection', async () => {
    mockNativeSignIn.mockResolvedValue('google-id-token');
    mockApiSignIn.mockRejectedValue(new TypeError('Network request failed'));

    await render(<LoginScreen />);
    fireEvent.press(screen.getByText('Continue with Google'));

    expect(await screen.findByText(/couldn't connect/i)).toBeTruthy();
  });

  test('shows no error when the user cancels the Google sign-in sheet', async () => {
    mockNativeSignIn.mockRejectedValue(new GoogleSignInCancelledError());

    await render(<LoginScreen />);
    fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() => expect(mockNativeSignIn).toHaveBeenCalled());
    expect(mockApiSignIn).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
