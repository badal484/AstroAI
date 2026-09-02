/** A client-generated id for idempotency keys (ARCHITECTURE.md's "mutations
 * that are financially or state-sensitive carry a client-generated
 * idempotency key"). Prefers the platform's real UUID generator; falls
 * back to a timestamp+random string if it's ever unavailable in a given
 * Hermes build, so message sending never hard-crashes on this. */
interface CryptoLike {
  randomUUID?: () => string;
}

export function generateClientId(): string {
  // Cast rather than relying on ambient `crypto` typings: this project's
  // tsconfig has no DOM lib (mobile is not a browser environment), so
  // `crypto` isn't a known `globalThis` property even though modern
  // Hermes/React Native provides it at runtime.
  const cryptoObj = (globalThis as { crypto?: CryptoLike }).crypto;
  if (typeof cryptoObj?.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
