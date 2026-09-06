import { describe, expect, it } from 'vitest';
import {
  WalletTransactionSource,
} from '@astroai/shared-types';
import { walletService } from '../../src/modules/wallet/wallet.service';
import { WalletTransactionModel } from '../../src/modules/wallet/ledger.model';

describe('Wallet Concurrency & Double-Spending Prevention', () => {
  it('prevents double-spending when 25 concurrent debits compete for limited balance', async () => {
    const concurrentUser = 'user_concurrency_race_1';

    // 1. Credit 100 credits
    await walletService.credit(concurrentUser, {
      amount: 100,
      source: WalletTransactionSource.PAYMENT,
      idempotencyKey: 'seed_concurrency_100',
    });

    // 2. Launch 25 simultaneous debit requests for 10 credits each (total 250 credits requested)
    const debitPromises = Array.from({ length: 25 }).map((_, index) =>
      walletService.debit(concurrentUser, {
        amount: 10,
        source: WalletTransactionSource.CHAT,
        idempotencyKey: `concurrent_debit_msg_${index}`,
      }),
    );

    const results = await Promise.allSettled(debitPromises);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 10 debits should succeed (10 * 10 = 100 credits)
    expect(fulfilled.length).toBe(10);
    // Exactly 15 debits should fail due to insufficient balance
    expect(rejected.length).toBe(15);

    for (const rej of rejected) {
      if (rej.status === 'rejected') {
        expect(rej.reason.message).toMatch(/insufficient/i);
      }
    }

    // 3. Final balance must be EXACTLY 0, never negative
    const finalBalance = await walletService.getBalance(concurrentUser);
    expect(finalBalance.balance).toBe(0);
    expect(finalBalance.availableBalance).toBe(0);
    expect(finalBalance.lifetimeSpent).toBe(100);

    // 4. Ledger must contain exactly 11 transactions (1 credit + 10 debits)
    const txCount = await WalletTransactionModel.countDocuments({ userId: concurrentUser });
    expect(txCount).toBe(11);
  });

  it('handles interleaved simultaneous concurrent credits and debits accurately', async () => {
    const mixedUser = 'user_concurrency_mixed_1';

    // Start with 600 credits (sufficient to buffer debits regardless of interleaving order)
    await walletService.credit(mixedUser, {
      amount: 600,
      source: WalletTransactionSource.PAYMENT,
      idempotencyKey: 'seed_mixed_600',
    });

    // Launch 20 credits of +50 each and 20 debits of -30 each
    const creditOps = Array.from({ length: 20 }).map((_, i) =>
      walletService.credit(mixedUser, {
        amount: 50,
        source: WalletTransactionSource.PAYMENT,
        idempotencyKey: `mixed_credit_${i}`,
      }),
    );

    const debitOps = Array.from({ length: 20 }).map((_, i) =>
      walletService.debit(mixedUser, {
        amount: 30,
        source: WalletTransactionSource.CHAT,
        idempotencyKey: `mixed_debit_${i}`,
      }),
    );

    // Interleave operations
    const allOps: Promise<unknown>[] = [];
    for (let i = 0; i < 20; i++) {
      allOps.push(creditOps[i]!, debitOps[i]!);
    }

    const results = await Promise.allSettled(allOps);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled.length).toBe(40);

    // Expected final balance = 600 + (20 * 50) - (20 * 30) = 600 + 1000 - 600 = 1000
    const finalBalance = await walletService.getBalance(mixedUser);
    expect(finalBalance.balance).toBe(1000);
    expect(finalBalance.lifetimeEarned).toBe(1600);
    expect(finalBalance.lifetimeSpent).toBe(600);

    // Ledger audit reconciliation
    const reconciliation = await walletService.reconcile(mixedUser);
    expect(reconciliation.reconciled).toBe(true);
    expect(reconciliation.ledgerBalance).toBe(1000);
    expect(reconciliation.transactionCount).toBe(41);
  });
});
