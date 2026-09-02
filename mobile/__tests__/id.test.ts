import { generateClientId } from '../src/lib/id';

describe('generateClientId', () => {
  it('generates a non-empty, unique id on each call', () => {
    const first = generateClientId();
    const second = generateClientId();

    expect(first.length).toBeGreaterThan(0);
    expect(second.length).toBeGreaterThan(0);
    expect(first).not.toBe(second);
  });

  it('falls back to a timestamp+random id when crypto.randomUUID is unavailable', () => {
    const globalWithCrypto = globalThis as {
      crypto?: { randomUUID?: () => string };
    };
    const original = globalWithCrypto.crypto;
    globalWithCrypto.crypto = undefined;

    try {
      const id = generateClientId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    } finally {
      globalWithCrypto.crypto = original;
    }
  });
});
