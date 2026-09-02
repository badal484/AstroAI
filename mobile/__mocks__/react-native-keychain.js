// Manual Jest mock for react-native-keychain (auto-applied — see
// https://jestjs.io/docs/manual-mocks#mocking-node-modules). Backed by an
// in-memory map keyed by `service`, so secureStorage.ts's "generate once,
// reuse thereafter" key logic is exercised the same way it would be
// against the real OS Keychain/Keystore.
const store = new Map();

async function getGenericPassword(options) {
  const service = options?.service ?? 'default';
  const entry = store.get(service);
  return entry ? { username: entry.username, password: entry.password } : false;
}

async function setGenericPassword(username, password, options) {
  const service = options?.service ?? 'default';
  store.set(service, { username, password });
  return { service };
}

module.exports = { getGenericPassword, setGenericPassword };
