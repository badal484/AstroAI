import { createMMKV, type MMKV } from 'react-native-mmkv';
import * as Keychain from 'react-native-keychain';

const KEYCHAIN_SERVICE = 'app.astroai.mmkv-encryption-key';
const REFRESH_TOKEN_KEY = 'refreshToken';

// AES-256 keys are 32 bytes; generating exactly 32 hex characters keeps the
// key at 32 bytes as a raw string (react-native-mmkv measures the
// encryptionKey string's byte length directly, not decoded hex bytes).
const ENCRYPTION_KEY_LENGTH = 32;

/**
 * The MMKV encryption key must NOT be a literal in application code — a
 * hardcoded key is identical across every install and trivially extracted
 * from the app binary, which defeats the point of encrypting at rest
 * (CLAUDE.md §36). Instead, a random key is generated once per device and
 * held in the OS-level Keychain (iOS) / Keystore (Android) via
 * react-native-keychain — the actual security boundary is that hardware-
 * backed store, not the key's own entropy.
 */
async function getOrCreateEncryptionKey(): Promise<string> {
  const existing = await Keychain.getGenericPassword({
    service: KEYCHAIN_SERVICE,
  });
  if (existing) return existing.password;

  const key = generateRandomHex(ENCRYPTION_KEY_LENGTH);
  await Keychain.setGenericPassword('mmkv', key, { service: KEYCHAIN_SERVICE });
  return key;
}

function generateRandomHex(length: number): string {
  const chars = 'abcdef0123456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

let storagePromise: Promise<MMKV> | null = null;

function getStorage(): Promise<MMKV> {
  storagePromise ??= getOrCreateEncryptionKey().then(encryptionKey =>
    createMMKV({
      id: 'astroai-auth',
      encryptionKey,
      encryptionType: 'AES-256',
    }),
  );
  return storagePromise;
}

export const secureStorage = {
  async getRefreshToken(): Promise<string | null> {
    const storage = await getStorage();
    return storage.getString(REFRESH_TOKEN_KEY) ?? null;
  },
  async setRefreshToken(token: string): Promise<void> {
    const storage = await getStorage();
    storage.set(REFRESH_TOKEN_KEY, token);
  },
  async clearRefreshToken(): Promise<void> {
    const storage = await getStorage();
    storage.remove(REFRESH_TOKEN_KEY);
  },
};
