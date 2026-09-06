import { describe, expect, it } from 'vitest';
import {
  WalletHoldStatus,
  WalletTransactionSource,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@astroai/shared-types';
import { walletService } from '../../src/modules/wallet/wallet.service';
import {
  InsufficientWalletBalanceError,
  InvalidTransactionAmountError,
} from '../../src/shared/errors';
import { WalletBalanceModel } from '../../src/modules/wallet/balance.model';

describe('Wallet Integration Tests', () => {
  const userId = 'user_test_wallet_1';

  it('initial balance for a new user is 0 with 0 earned/spent', async () => {
    const balance = await walletService.getBalance(userId);
    expect(balance.userId).toBe(userId);
    expect(balance.balance).toBe(0);
    expect(balance.heldBalance).toBe(0);
    expect(balance.availableBalance).toBe(0);
    expect(balance.lifetimeEarned).toBe(0);
    expect(balance.lifetimeSpent).toBe(0);
  });

  it('credits wallet atomically and writes an immutable ledger entry', async () => {
    const tx = await walletService.credit(userId, {
      amount: 100,
      source: WalletTransactionSource.PAYMENT,
      idempotencyKey: 'pay_order_1001',
      referenceId: 'order_1001',
      pricingSnapshot: {
        pricingVersion: 1,
        unitPrice: 100,
        netAmount: 100,
      },
    });

    expect(tx.userId).toBe(userId);
    expect(tx.type).toBe(WalletTransactionType.CREDIT);
    expect(tx.amount).toBe(100);
    expect(tx.balanceBefore).toBe(0);
    expect(tx.balanceAfter).toBe(100);
    expect(tx.status).toBe(WalletTransactionStatus.COMPLETED);

    const balance = await walletService.getBalance(userId);
    expect(balance.balance).toBe(100);
    expect(balance.availableBalance).toBe(100);
    expect(balance.lifetimeEarned).toBe(100);
    expect(balance.lifetimeSpent).toBe(0);
  });

  it('rejects non-positive integer amounts', async () => {
    await expect(
      walletService.credit(userId, {
        amount: -50,
        source: WalletTransactionSource.PAYMENT,
        idempotencyKey: 'invalid_credit',
      }),
    ).rejects.toThrow(InvalidTransactionAmountError);

    await expect(
      walletService.debit(userId, {
        amount: 0,
        source: WalletTransactionSource.CHAT,
        idempotencyKey: 'invalid_debit',
      }),
    ).rejects.toThrow(InvalidTransactionAmountError);
  });

  it('debits wallet atomically and checks available balance', async () => {
    // Seed initial 100 credits
    await walletService.credit(userId, {
      amount: 100,
      source: WalletTransactionSource.PAYMENT,
      idempotencyKey: 'debit_test_seed_100',
    });

    const tx = await walletService.debit(userId, {
      amount: 30,
      source: WalletTransactionSource.CHAT,
      idempotencyKey: 'chat_msg_101',
      referenceId: 'msg_101',
      pricingSnapshot: {
        pricingVersion: 1,
        unitPrice: 30,
        netAmount: 30,
      },
    });

    expect(tx.type).toBe(WalletTransactionType.DEBIT);
    expect(tx.amount).toBe(30);
    expect(tx.balanceBefore).toBe(100);
    expect(tx.balanceAfter).toBe(70);

    const balance = await walletService.getBalance(userId);
    expect(balance.balance).toBe(70);
    expect(balance.availableBalance).toBe(70);
    expect(balance.lifetimeEarned).toBe(100);
    expect(balance.lifetimeSpent).toBe(30);
  });

  it('prevents debit when balance is insufficient', async () => {
    // Seed 70 credits
    await walletService.credit(userId, {
      amount: 70,
      source: WalletTransactionSource.PAYMENT,
      idempotencyKey: 'insufficient_test_seed_70',
    });

    await expect(
      walletService.debit(userId, {
        amount: 200,
        source: WalletTransactionSource.REPORT,
        idempotencyKey: 'report_purchase_fail',
      }),
    ).rejects.toThrow(InsufficientWalletBalanceError);

    // Balance remains unmodified at 70
    const balance = await walletService.getBalance(userId);
    expect(balance.balance).toBe(70);
  });

  it('supports bonus, promotional, and referral credits', async () => {
    const bonusTx = await walletService.credit(userId, {
      amount: 15,
      source: WalletTransactionSource.SIGNUP_BONUS,
      idempotencyKey: 'signup_bonus_user1',
      type: WalletTransactionType.BONUS,
    });
    expect(bonusTx.type).toBe(WalletTransactionType.BONUS);

    const promoTx = await walletService.credit(userId, {
      amount: 20,
      source: WalletTransactionSource.PROMO_COUPON,
      idempotencyKey: 'promo_welcome20',
      type: WalletTransactionType.PROMOTIONAL_CREDIT,
    });
    expect(promoTx.type).toBe(WalletTransactionType.PROMOTIONAL_CREDIT);

    const refTx = await walletService.credit(userId, {
      amount: 25,
      source: WalletTransactionSource.REFERRAL_REWARD,
      idempotencyKey: 'ref_friend_1',
      type: WalletTransactionType.REFERRAL_CREDIT,
    });
    expect(refTx.type).toBe(WalletTransactionType.REFERRAL_CREDIT);

    const balance = await walletService.getBalance(userId);
    expect(balance.balance).toBe(15 + 20 + 25); // 60
  });

  it('processes refund referencing original transaction', async () => {
    // Start with 100, debit 30 -> 70
    await walletService.credit(userId, {
      amount: 100,
      source: WalletTransactionSource.PAYMENT,
      idempotencyKey: 'refund_seed_100',
    });
    await walletService.debit(userId, {
      amount: 30,
      source: WalletTransactionSource.CHAT,
      idempotencyKey: 'refund_debit_30',
      referenceId: 'msg_101',
    });

    const refundTx = await walletService.refund(userId, {
      amount: 30,
      referenceId: 'msg_101',
      idempotencyKey: 'refund_msg_101',
      reason: 'Failed AI generation',
    });

    expect(refundTx.type).toBe(WalletTransactionType.REFUND);
    expect(refundTx.amount).toBe(30);
    expect(refundTx.referenceId).toBe('msg_101');

    const balance = await walletService.getBalance(userId);
    expect(balance.balance).toBe(100);
  });

  it('executes admin adjustments with mandatory reason audit', async () => {
    // 1. Admin Credit
    const adminCredit = await walletService.adjustment('admin_999', userId, {
      type: WalletTransactionType.CREDIT,
      amount: 100,
      reason: 'Support courtesy credit for downtime',
    });
    expect(adminCredit.type).toBe(WalletTransactionType.ADJUSTMENT);
    expect(adminCredit.metadata?.adminId).toBe('admin_999');
    expect(adminCredit.metadata?.reason).toBe('Support courtesy credit for downtime');

    const balanceAfterCredit = await walletService.getBalance(userId);
    expect(balanceAfterCredit.balance).toBe(100);

    // 2. Admin Debit
    const adminDebit = await walletService.adjustment('admin_999', userId, {
      type: WalletTransactionType.DEBIT,
      amount: 10,
      reason: 'Chargeback fee correction',
    });
    expect(adminDebit.type).toBe(WalletTransactionType.DEBIT);
    expect(adminDebit.metadata?.isAdjustment).toBe(true);

    const balanceAfterDebit = await walletService.getBalance(userId);
    expect(balanceAfterDebit.balance).toBe(90);
  });

  describe('Hold / Reserve & Capture Cycle', () => {
    const voiceUserId = 'user_voice_test_1';

    it('reserves funds, reduces available balance, captures actual amount, releases remaining', async () => {
      // Seed wallet with 50 credits
      await walletService.credit(voiceUserId, {
        amount: 50,
        source: WalletTransactionSource.PAYMENT,
        idempotencyKey: 'voice_seed_50',
      });

      // 1. Reserve 30 credits for a voice call session
      const hold = await walletService.reserve(voiceUserId, {
        amount: 30,
        source: WalletTransactionSource.VOICE,
        referenceId: 'voice_session_777',
      });

      expect(hold.status).toBe(WalletHoldStatus.ACTIVE);
      expect(hold.amount).toBe(30);

      // Check balance: total is 50, held is 30, available is 20
      const balAfterHold = await walletService.getBalance(voiceUserId);
      expect(balAfterHold.balance).toBe(50);
      expect(balAfterHold.heldBalance).toBe(30);
      expect(balAfterHold.availableBalance).toBe(20);

      // Cannot debit 25 credits because available balance is only 20
      await expect(
        walletService.debit(voiceUserId, {
          amount: 25,
          source: WalletTransactionSource.CHAT,
          idempotencyKey: 'chat_during_hold_fail',
        }),
      ).rejects.toThrow(InsufficientWalletBalanceError);

      // 2. Capture only 15 credits (actual talk time was shorter)
      const captureTx = await walletService.capture(
        hold.id,
        15,
        'capture_voice_session_777',
      );

      expect(captureTx.type).toBe(WalletTransactionType.DEBIT);
      expect(captureTx.amount).toBe(15);
      expect(captureTx.balanceBefore).toBe(50);
      expect(captureTx.balanceAfter).toBe(35);

      // Hold is released: heldBalance should now be 0, availableBalance should be 35
      const balAfterCapture = await walletService.getBalance(voiceUserId);
      expect(balAfterCapture.balance).toBe(35);
      expect(balAfterCapture.heldBalance).toBe(0);
      expect(balAfterCapture.availableBalance).toBe(35);
    });

    it('releases hold without debiting when session is cancelled', async () => {
      await walletService.credit(voiceUserId, {
        amount: 50,
        source: WalletTransactionSource.PAYMENT,
        idempotencyKey: 'voice_cancel_seed_50',
      });

      const hold = await walletService.reserve(voiceUserId, {
        amount: 20,
        source: WalletTransactionSource.VOICE,
        referenceId: 'voice_session_cancelled',
      });

      const released = await walletService.release(hold.id);
      expect(released.status).toBe(WalletHoldStatus.RELEASED);

      const bal = await walletService.getBalance(voiceUserId);
      expect(bal.balance).toBe(50);
      expect(bal.heldBalance).toBe(0);
      expect(bal.availableBalance).toBe(50);
    });
  });

  describe('Reconciliation & Audit Integrity', () => {
    it('verifies ledger mathematically matches balance and detects drift', async () => {
      // Seed 2 transactions: +150, -50 -> expected 100
      await walletService.credit(userId, {
        amount: 150,
        source: WalletTransactionSource.PAYMENT,
        idempotencyKey: 'rec_seed_150',
      });
      await walletService.debit(userId, {
        amount: 50,
        source: WalletTransactionSource.CHAT,
        idempotencyKey: 'rec_debit_50',
      });

      const recResult = await walletService.reconcile(userId);
      expect(recResult.reconciled).toBe(true);
      expect(recResult.cachedBalance).toBe(100);
      expect(recResult.ledgerBalance).toBe(100);

      // Artificially corrupt cached balance to simulate an external drift
      await WalletBalanceModel.updateOne({ userId }, { $set: { balance: 9999 } });

      const driftCheck = await walletService.reconcile(userId);
      expect(driftCheck.reconciled).toBe(false);
      expect(driftCheck.cachedBalance).toBe(9999);
      expect(driftCheck.ledgerBalance).toBe(100);

      // Ensure balance was self-healed back to immutable ledger truth (100)
      const healedBalance = await walletService.getBalance(userId);
      expect(healedBalance.balance).toBe(100);
    });
  });

  describe('Transaction History Querying', () => {
    it('retrieves paginated transaction history for user', async () => {
      // Seed 6 transactions
      for (let i = 1; i <= 6; i++) {
        await walletService.credit(userId, {
          amount: 10 * i,
          source: WalletTransactionSource.PAYMENT,
          idempotencyKey: `history_seed_${i}`,
        });
      }

      const result = await walletService.getTransactions(userId, { limit: 5 });
      expect(result.items.length).toBe(5);
      expect(result.nextCursor).toBeTruthy();

      // Ensure all items belong to this user
      for (const item of result.items) {
        expect(item.userId).toBe(userId);
        expect(item.balanceAfter).toBeDefined();
      }
    });
  });
});
