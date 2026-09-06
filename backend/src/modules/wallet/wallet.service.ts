import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import {
  WalletHoldStatus,
  WalletTransactionSource,
  WalletTransactionStatus,
  WalletTransactionType,
  type AdminWalletAdjustmentInput,
  type PricingSnapshot,
  type WalletBalanceDTO,
  type WalletHoldDTO,
  type WalletTransactionDTO,
  type WalletTransactionsQuery,
} from '@astroai/shared-types';
import {
  DuplicateIdempotencyKeyError,
  InsufficientWalletBalanceError,
  InvalidTransactionAmountError,
  WalletHoldExpiredError,
  WalletHoldNotFoundError,
} from '../../shared/errors';
import { eventBus } from '../../shared/eventBus';
import { logger } from '../../shared/logger';
import type { WalletBalanceDocument } from './balance.model';
import type { WalletHoldDocument } from './hold.model';
import type { WalletTransactionDocument } from './ledger.model';
import { walletRepository } from './wallet.repository';

export interface CreditInput {
  amount: number;
  source: WalletTransactionSource;
  idempotencyKey: string;
  type?: WalletTransactionType;
  referenceId?: string | null;
  pricingSnapshot?: PricingSnapshot | null;
  metadata?: Record<string, unknown> | null;
}

export interface DebitInput {
  amount: number;
  source: WalletTransactionSource;
  idempotencyKey: string;
  referenceId?: string | null;
  pricingSnapshot?: PricingSnapshot | null;
  metadata?: Record<string, unknown> | null;
}

export interface ReserveInput {
  amount: number;
  source: WalletTransactionSource;
  referenceId?: string | null;
  expiresInSeconds?: number;
}

export interface RefundInput {
  amount: number;
  referenceId: string;
  idempotencyKey: string;
  reason?: string;
  metadata?: Record<string, unknown> | null;
}

function toWalletBalanceDTO(doc: WalletBalanceDocument): WalletBalanceDTO {
  const availableBalance = Math.max(0, doc.balance - doc.heldBalance);
  return {
    userId: doc.userId,
    balance: doc.balance,
    heldBalance: doc.heldBalance,
    availableBalance,
    currency: doc.currency,
    lifetimeEarned: doc.lifetimeEarned,
    lifetimeSpent: doc.lifetimeSpent,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
  };
}

function toWalletTransactionDTO(doc: WalletTransactionDocument): WalletTransactionDTO {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    idempotencyKey: doc.idempotencyKey,
    type: doc.type as WalletTransactionType,
    amount: doc.amount,
    currency: doc.currency,
    balanceBefore: doc.balanceBefore,
    balanceAfter: doc.balanceAfter,
    source: doc.source as WalletTransactionSource,
    referenceId: doc.referenceId ?? null,
    status: doc.status as WalletTransactionStatus,
    pricingSnapshot: doc.pricingSnapshot
      ? {
          pricingVersion: doc.pricingSnapshot.pricingVersion,
          unitPrice: doc.pricingSnapshot.unitPrice,
          unitsCalculated: doc.pricingSnapshot.unitsCalculated ?? undefined,
          billingUnit: doc.pricingSnapshot.billingUnit ?? undefined,
          discountAppliedPercent: doc.pricingSnapshot.discountAppliedPercent ?? undefined,
          grossAmount: doc.pricingSnapshot.grossAmount ?? undefined,
          netAmount: doc.pricingSnapshot.netAmount,
        }
      : null,
    metadata: doc.metadata as Record<string, unknown> | null,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
  };
}

function toWalletHoldDTO(doc: WalletHoldDocument): WalletHoldDTO {
  return {
    id: doc.holdId,
    userId: doc.userId,
    amount: doc.amount,
    referenceId: doc.referenceId ?? null,
    source: doc.source as WalletTransactionSource,
    status: doc.status as WalletHoldStatus,
    expiresAt: doc.expiresAt.toISOString(),
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
  };
}

export const walletService = {
  /**
   * Retrieves current wallet balance summary for a user.
   */
  async getBalance(userId: string): Promise<WalletBalanceDTO> {
    const doc = await walletRepository.findOrCreateBalance(userId);
    return toWalletBalanceDTO(doc);
  },

  /**
   * Executes an atomic credit operation to the user's wallet.
   * Enforces idempotency via compound index on (userId, idempotencyKey).
   */
  async credit(userId: string, input: CreditInput): Promise<WalletTransactionDTO> {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new InvalidTransactionAmountError('Credit amount must be a positive integer');
    }

    // Idempotency check before starting session
    const existing = await walletRepository.findTransactionByIdempotencyKey(
      userId,
      input.idempotencyKey,
    );
    if (existing) {
      return toWalletTransactionDTO(existing);
    }

    const session = await mongoose.startSession();
    try {
      let createdTx: WalletTransactionDocument | undefined;

      await session.withTransaction(async () => {
        // Double check inside transaction for concurrency
        const concurrentExisting = await walletRepository.findTransactionByIdempotencyKey(
          userId,
          input.idempotencyKey,
          session,
        );
        if (concurrentExisting) {
          createdTx = concurrentExisting;
          return;
        }

        const balanceDoc = await walletRepository.findOrCreateBalance(userId, session);
        const balanceBefore = balanceDoc.balance;
        const balanceAfter = balanceBefore + input.amount;

        await walletRepository.updateBalanceAtomic(
          userId,
          {},
          {
            $inc: {
              balance: input.amount,
              lifetimeEarned: input.amount,
            },
          },
          session,
        );

        createdTx = await walletRepository.appendTransaction(
          {
            userId,
            idempotencyKey: input.idempotencyKey,
            type: input.type ?? WalletTransactionType.CREDIT,
            amount: input.amount,
            currency: 'CREDITS',
            balanceBefore,
            balanceAfter,
            source: input.source,
            referenceId: input.referenceId ?? null,
            status: WalletTransactionStatus.COMPLETED,
            pricingSnapshot: input.pricingSnapshot ?? null,
            metadata: input.metadata ?? null,
          },
          session,
        );
      });

      return toWalletTransactionDTO(createdTx!);
    } catch (error: any) {
      // Catch duplicate key race condition if duplicate key error occurred
      if (error?.code === 11000) {
        const found = await walletRepository.findTransactionByIdempotencyKey(
          userId,
          input.idempotencyKey,
        );
        if (found) return toWalletTransactionDTO(found);
      }
      throw error;
    } finally {
      await session.endSession();
    }
  },

  /**
   * Executes an atomic debit operation from the user's wallet.
   * Guarantees non-negative balance and prevents double-spending.
   */
  async debit(userId: string, input: DebitInput): Promise<WalletTransactionDTO> {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new InvalidTransactionAmountError('Debit amount must be a positive integer');
    }

    // Idempotency check before starting session
    const existing = await walletRepository.findTransactionByIdempotencyKey(
      userId,
      input.idempotencyKey,
    );
    if (existing) {
      return toWalletTransactionDTO(existing);
    }

    const session = await mongoose.startSession();
    try {
      let createdTx: WalletTransactionDocument | undefined;

      await session.withTransaction(async () => {
        // Double check inside transaction for concurrency
        const concurrentExisting = await walletRepository.findTransactionByIdempotencyKey(
          userId,
          input.idempotencyKey,
          session,
        );
        if (concurrentExisting) {
          createdTx = concurrentExisting;
          return;
        }

        const balanceDoc = await walletRepository.findOrCreateBalance(userId, session);
        const availableBalance = balanceDoc.balance - balanceDoc.heldBalance;

        if (availableBalance < input.amount) {
          throw new InsufficientWalletBalanceError(
            `Insufficient balance (${availableBalance} available, ${input.amount} required)`,
          );
        }

        const balanceBefore = balanceDoc.balance;
        const balanceAfter = balanceBefore - input.amount;

        // Atomic update conditioned on available balance
        const updated = await walletRepository.updateBalanceAtomic(
          userId,
          { balance: { $gte: input.amount + balanceDoc.heldBalance } },
          {
            $inc: {
              balance: -input.amount,
              lifetimeSpent: input.amount,
            },
          },
          session,
        );

        if (!updated) {
          throw new InsufficientWalletBalanceError('Insufficient balance due to concurrent transaction');
        }

        createdTx = await walletRepository.appendTransaction(
          {
            userId,
            idempotencyKey: input.idempotencyKey,
            type: WalletTransactionType.DEBIT,
            amount: input.amount,
            currency: 'CREDITS',
            balanceBefore,
            balanceAfter,
            source: input.source,
            referenceId: input.referenceId ?? null,
            status: WalletTransactionStatus.COMPLETED,
            pricingSnapshot: input.pricingSnapshot ?? null,
            metadata: input.metadata ?? null,
          },
          session,
        );
      });

      if (createdTx && createdTx.balanceAfter <= 5) {
        eventBus.emit('wallet.lowBalance', {
          userId,
          availableBalance: createdTx.balanceAfter,
          threshold: 5,
        });
      }

      return toWalletTransactionDTO(createdTx!);
    } catch (error: any) {
      if (error?.code === 11000) {
        const found = await walletRepository.findTransactionByIdempotencyKey(
          userId,
          input.idempotencyKey,
        );
        if (found) return toWalletTransactionDTO(found);
      }
      throw error;
    } finally {
      await session.endSession();
    }
  },

  /**
   * Holds/reserves funds in the wallet before starting a metered session (e.g. Voice).
   */
  async reserve(userId: string, input: ReserveInput): Promise<WalletHoldDTO> {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new InvalidTransactionAmountError('Hold amount must be a positive integer');
    }

    const expiresInSeconds = input.expiresInSeconds ?? 300;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const holdId = `hold_${randomUUID()}`;

    const session = await mongoose.startSession();
    try {
      let createdHold: WalletHoldDocument | undefined;

      await session.withTransaction(async () => {
        const balanceDoc = await walletRepository.findOrCreateBalance(userId, session);
        const availableBalance = balanceDoc.balance - balanceDoc.heldBalance;

        if (availableBalance < input.amount) {
          throw new InsufficientWalletBalanceError(
            `Insufficient balance for reservation (${availableBalance} available, ${input.amount} required)`,
          );
        }

        const updated = await walletRepository.updateBalanceAtomic(
          userId,
          { balance: { $gte: input.amount + balanceDoc.heldBalance } },
          {
            $inc: { heldBalance: input.amount },
          },
          session,
        );

        if (!updated) {
          throw new InsufficientWalletBalanceError('Insufficient balance for reservation under concurrent load');
        }

        createdHold = await walletRepository.createHold(
          {
            holdId,
            userId,
            amount: input.amount,
            referenceId: input.referenceId ?? null,
            source: input.source,
            status: WalletHoldStatus.ACTIVE,
            expiresAt,
          },
          session,
        );
      });

      return toWalletHoldDTO(createdHold!);
    } finally {
      await session.endSession();
    }
  },

  /**
   * Captures an active hold, debiting the actual amount used and releasing the remainder.
   */
  async capture(
    holdId: string,
    actualAmount: number,
    idempotencyKey: string,
    pricingSnapshot?: PricingSnapshot | null,
  ): Promise<WalletTransactionDTO> {
    if (!Number.isInteger(actualAmount) || actualAmount < 0) {
      throw new InvalidTransactionAmountError('Capture amount must be a non-negative integer');
    }

    const hold = await walletRepository.findHold(holdId);
    if (!hold) {
      throw new WalletHoldNotFoundError(`Hold '${holdId}' not found`);
    }

    if (hold.status === WalletHoldStatus.CAPTURED) {
      const existing = await walletRepository.findTransactionByIdempotencyKey(
        hold.userId,
        idempotencyKey,
      );
      if (existing) return toWalletTransactionDTO(existing);
      throw new DuplicateIdempotencyKeyError('Hold has already been captured');
    }

    if (hold.status !== WalletHoldStatus.ACTIVE) {
      throw new WalletHoldExpiredError(`Hold is in '${hold.status}' status and cannot be captured`);
    }

    if (new Date() > hold.expiresAt) {
      await this.release(holdId);
      throw new WalletHoldExpiredError('Hold reservation has expired');
    }

    const session = await mongoose.startSession();
    try {
      let createdTx: WalletTransactionDocument | undefined;

      await session.withTransaction(async () => {
        const balanceDoc = await walletRepository.findOrCreateBalance(hold.userId, session);
        const balanceBefore = balanceDoc.balance;
        const balanceAfter = balanceBefore - actualAmount;

        // Release the heldBalance by hold.amount and debit balance by actualAmount
        await walletRepository.updateBalanceAtomic(
          hold.userId,
          {},
          {
            $inc: {
              heldBalance: -hold.amount,
              balance: -actualAmount,
              lifetimeSpent: actualAmount,
            },
          },
          session,
        );

        await walletRepository.updateHoldStatus(holdId, WalletHoldStatus.CAPTURED, session);

        createdTx = await walletRepository.appendTransaction(
          {
            userId: hold.userId,
            idempotencyKey,
            type: WalletTransactionType.DEBIT,
            amount: actualAmount,
            currency: 'CREDITS',
            balanceBefore,
            balanceAfter,
            source: hold.source as WalletTransactionSource,
            referenceId: hold.referenceId ?? holdId,
            status: WalletTransactionStatus.COMPLETED,
            pricingSnapshot: pricingSnapshot ?? null,
            metadata: { holdId, holdOriginalAmount: hold.amount },
          },
          session,
        );
      });

      return toWalletTransactionDTO(createdTx!);
    } finally {
      await session.endSession();
    }
  },

  /**
   * Releases an active hold reservation back to available balance.
   */
  async release(holdId: string): Promise<WalletHoldDTO> {
    const hold = await walletRepository.findHold(holdId);
    if (!hold) {
      throw new WalletHoldNotFoundError(`Hold '${holdId}' not found`);
    }

    if (hold.status !== WalletHoldStatus.ACTIVE) {
      return toWalletHoldDTO(hold);
    }

    const session = await mongoose.startSession();
    try {
      let updatedHold: WalletHoldDocument | null = null;

      await session.withTransaction(async () => {
        await walletRepository.updateBalanceAtomic(
          hold.userId,
          {},
          {
            $inc: { heldBalance: -hold.amount },
          },
          session,
        );

        updatedHold = await walletRepository.updateHoldStatus(
          holdId,
          WalletHoldStatus.RELEASED,
          session,
        );
      });

      return toWalletHoldDTO(updatedHold!);
    } finally {
      await session.endSession();
    }
  },

  /**
   * Processes a refund to the user's wallet.
   */
  async refund(userId: string, input: RefundInput): Promise<WalletTransactionDTO> {
    return this.credit(userId, {
      amount: input.amount,
      source: WalletTransactionSource.PAYMENT,
      idempotencyKey: input.idempotencyKey,
      type: WalletTransactionType.REFUND,
      referenceId: input.referenceId,
      metadata: { reason: input.reason ?? 'Refund processed' },
    });
  },

  /**
   * Admin manual balance adjustment (Credit or Debit) with mandatory reason.
   */
  async adjustment(
    adminId: string,
    targetUserId: string,
    input: AdminWalletAdjustmentInput,
  ): Promise<WalletTransactionDTO> {
    const idempotencyKey = input.idempotencyKey ?? `adj_${adminId}_${randomUUID()}`;

    if (input.type === WalletTransactionType.CREDIT) {
      return this.credit(targetUserId, {
        amount: input.amount,
        source: WalletTransactionSource.ADMIN,
        idempotencyKey,
        type: WalletTransactionType.ADJUSTMENT,
        referenceId: input.referenceId ?? null,
        metadata: { adminId, reason: input.reason },
      });
    } else {
      return this.debit(targetUserId, {
        amount: input.amount,
        source: WalletTransactionSource.ADMIN,
        idempotencyKey,
        referenceId: input.referenceId ?? null,
        metadata: { adminId, reason: input.reason, isAdjustment: true },
      });
    }
  },

  /**
   * Reconciles user balance against the immutable ledger.
   * If any drift is detected, synchronizes the cached balance to the ledger.
   */
  async reconcile(userId: string): Promise<{
    reconciled: boolean;
    cachedBalance: number;
    ledgerBalance: number;
    transactionCount: number;
  }> {
    const balanceDoc = await walletRepository.findOrCreateBalance(userId);
    const { computedBalance, transactionCount } = await walletRepository.computeLedgerSum(userId);

    const drift = balanceDoc.balance !== computedBalance;

    if (drift) {
      logger.warn(
        { userId, cached: balanceDoc.balance, computed: computedBalance },
        'Wallet balance drift detected during reconciliation. Correcting cached balance to match ledger truth.',
      );

      await walletRepository.updateBalanceAtomic(
        userId,
        {},
        {
          $set: { balance: computedBalance },
        },
      );
    }

    return {
      reconciled: !drift,
      cachedBalance: balanceDoc.balance,
      ledgerBalance: computedBalance,
      transactionCount,
    };
  },

  /**
   * Retrieves paginated transaction ledger entries for a user.
   */
  async getTransactions(
    userId: string,
    query: WalletTransactionsQuery = { limit: 20 },
  ): Promise<{ items: WalletTransactionDTO[]; nextCursor: string | null }> {
    const docs = await walletRepository.findTransactionsByUser(userId, query);
    const hasMore = docs.length > query.limit;
    const items = hasMore ? docs.slice(0, query.limit) : docs;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!._id.toString() : null;

    return {
      items: items.map(toWalletTransactionDTO),
      nextCursor,
    };
  },

  /**
   * Admin: List all user wallet balances.
   */
  async listAllWallets(
    limit = 20,
    cursor?: string,
  ): Promise<{ items: WalletBalanceDTO[]; nextCursor: string | null }> {
    const docs = await walletRepository.listBalances(limit, cursor);
    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!._id.toString() : null;

    return {
      items: items.map(toWalletBalanceDTO),
      nextCursor,
    };
  },
};
