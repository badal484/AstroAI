// Manual Jest mock for @react-native-clipboard/clipboard (auto-applied —
// see https://jestjs.io/docs/manual-mocks#mocking-node-modules). The real
// package bridges to native clipboard APIs, which Jest can't exercise.
module.exports = {
  setString: jest.fn(),
  getString: jest.fn(() => Promise.resolve('')),
};
