// Manual Jest mock for @react-native-google-signin/google-signin (auto-
// applied — see https://jestjs.io/docs/manual-mocks#mocking-node-modules).
// The real package touches native modules at import time; tests that need
// specific sign-in behavior mock ../src/services/googleAuth directly
// instead (see __tests__/LoginScreen.test.tsx) — this only exists so
// merely *importing* the chain (App.tsx -> ... -> services/googleAuth.ts)
// doesn't crash in tests that don't care about Google Sign-In at all.
const GoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn().mockResolvedValue(true),
  signIn: jest.fn(),
};

const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

function isErrorWithCode(error) {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function isSuccessResponse(response) {
  return response?.type === 'success';
}

module.exports = {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
};
