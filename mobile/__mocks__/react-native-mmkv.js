// Manual Jest mock for react-native-mmkv (auto-applied to every test file —
// see https://jestjs.io/docs/manual-mocks#mocking-node-modules). The real
// package calls into a native Nitro Module at import time, which does not
// exist in the Jest (JS-only) environment. Backed by a plain in-memory Map
// so tests exercising secureStorage.ts still see real read/write behavior.
class FakeMMKV {
  constructor() {
    this.store = new Map();
  }

  set(key, value) {
    this.store.set(key, value);
  }

  getString(key) {
    const value = this.store.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  remove(key) {
    return this.store.delete(key);
  }

  clearAll() {
    this.store.clear();
  }
}

function createMMKV() {
  return new FakeMMKV();
}

module.exports = { createMMKV };
