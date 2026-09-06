import { describe, expect, it } from 'vitest';
import { WalletTransactionSource } from '@astroai/shared-types';
import { walletService } from '../../src/modules/wallet/wallet.service';
import { WalletTransactionModel } from '../../src/modules/wallet/ledger.model';

describe('Wallet Idempotency & Duplicate Request Prevention', () => {
  it('deduplicates 10 simultaneous concurrent requests with the same idempotency key', async () => {
    const user = 'user_idempotency_concurrent_1';

    // Seed wallet with 100 credits
    await walletService.credit(user, {
      amount: 100,
      source: WalletTransactionSource.PAYMENT,
      idempotencyKey: 'seed_idem_100',
    });

    const sharedKey = 'duplicate_send_message_uuid_999';

    // Fire 10 simultaneous debit requests with the identical idempotencyKey
    const duplicateRequests = Array.from({ length: 10 }).map(() =>
      walletService.debit(user, {
        amount: 20,
        source: WalletTransactionSource.CHAT,
        idempotencyKey: sharedKey,
        referenceId: 'msg_uuid_999',
      }),
    );

    const results = await Promise.all(duplicateRequests);

    // All 10 requests should succeed and return the exact same transaction ID
    const firstTxId = results[0]!.id;
    for (const res of results) {
      expect(res.id).toBe(firstTxId);
      expect(res.idempotencyKey).toBe(sharedKey);
      expect(res.amount).toBe(20);
      expect(res.balanceBefore).toBe(100);
      expect(res.balanceAfter).toBe(80);
    }

    // Balance should only have been debited ONCE (100 - 20 = 80)
    const balance = await walletService.getBalance(user);
    expect(balance.balance).toBe(80);
    expect(balance.lifetimeSpent).toBe(20);

    // Only 1 ledger transaction exists for this key
    const count = await WalletTransactionModel.countDocuments({
      userId: user,
      idempotencyKey: sharedKey,
    });
    expect(count).toBe(1);
  });

  it('safely handles sequential retry attempts without duplicate deductions', async () => {
    const user = 'user_idempotency_sequential_1';

    await walletService.credit(user, {
      amount: 100,
      source: WalletTransactionSource.PAYMENT,
      idempotencyKey: 'seed_idem_seq_100',
    });

    const retryKey = 'sequential_retry_key_42';

    // First attempt
    const firstAttempt = await walletService.debit(user, {
      amount: 25,
      source: WalletTransactionSource.REPORT,
      idempotencyKey: retryKey,
    });

    expect(firstAttempt.amount).toBe(25);
    expect(firstAttempt.balanceAfter).toBe(75);

    // Sequential second attempt (simulating client retry on timeout/network reconnect)
    const secondAttempt = await walletService.debit(user, {
      amount: 25,
      source: WalletTransactionSource.REPORT,
      idempotencyKey: retryKey,
    });

    expect(secondAttempt.id).toBe(firstAttempt.id);
    expect(secondAttempt.balanceBefore).toBe(firstAttempt.balanceBefore);
    expect(secondAttempt.balanceAfter).toBe(firstAttempt.balanceAfter);

    // Final balance is still 75, not 50
    const finalBalance = await walletService.getBalance(user);
    expect(finalBalance.balance).toBe(75);
    expect(finalBalance.lifetimeSpent).toBe(25);
  });
});
