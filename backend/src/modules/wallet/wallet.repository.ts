import type { ClientSession } from 'mongoose';
import {
  WalletBalanceModel,
  type WalletBalanceDocument,
} from './balance.model';
import {
  WalletTransactionModel,
  type WalletTransactionDocument,
  type WalletTransactionSchemaType,
} from './ledger.model';
import {
  WalletHoldModel,
  type WalletHoldDocument,
  type WalletHoldSchemaType,
} from './hold.model';
import {
  WalletHoldStatus,
  WalletTransactionType,
  type WalletTransactionsQuery,
} from '@astroai/shared-types';

export const walletRepository = {
  /**
   * Retrieves user's wallet balance document, creating an initial empty balance
   * if one does not exist yet.
   */
  async findOrCreateBalance(
    userId: string,
    session?: ClientSession,
  ): Promise<WalletBalanceDocument> {
    const existing = await WalletBalanceModel.findOne({ userId }).session(session ?? null);
    if (existing) return existing;

    const [created] = await WalletBalanceModel.create(
      [{ userId, balance: 0, heldBalance: 0, lifetimeEarned: 0, lifetimeSpent: 0, version: 0 }],
      { session },
    );
    return created!;
  },

  async findBalance(
    userId: string,
    session?: ClientSession,
  ): Promise<WalletBalanceDocument | null> {
    return WalletBalanceModel.findOne({ userId }).session(session ?? null);
  },

  /**
   * Check for an existing ledger transaction by idempotency key.
   */
  async findTransactionByIdempotencyKey(
    userId: string,
    idempotencyKey: string,
    session?: ClientSession,
  ): Promise<WalletTransactionDocument | null> {
    return WalletTransactionModel.findOne({ userId, idempotencyKey }).session(session ?? null);
  },

  /**
   * Append an immutable transaction to the ledger inside the active session.
   */
  async appendTransaction(
    data: Partial<WalletTransactionSchemaType> & {
      userId: string;
      idempotencyKey: string;
      type: string;
      amount: number;
      balanceBefore: number;
      balanceAfter: number;
      source: string;
    },
    session?: ClientSession,
  ): Promise<WalletTransactionDocument> {
    const [transaction] = await WalletTransactionModel.create([data], { session });
    return transaction!;
  },

  /**
   * Atomically executes balance increment/decrement with conditional checks.
   */
  async updateBalanceAtomic(
    userId: string,
    queryCondition: Record<string, unknown>,
    update: Record<string, unknown>,
    session?: ClientSession,
  ): Promise<WalletBalanceDocument | null> {
    const { $inc: userInc, ...restUpdate } = update as {
      $inc?: Record<string, number>;
      [key: string]: unknown;
    };
    const mergedInc = {
      version: 1,
      ...(userInc ?? {}),
    };

    return WalletBalanceModel.findOneAndUpdate(
      { userId, ...queryCondition },
      {
        ...restUpdate,
        $inc: mergedInc,
      },
      { new: true, session },
    );
  },

  /**
   * Query user's transaction ledger with pagination and filters.
   */
  async findTransactionsByUser(
    userId: string,
    query: WalletTransactionsQuery = { limit: 20 },
  ): Promise<WalletTransactionDocument[]> {
    const filter: Record<string, unknown> = { userId };

    if (query.type) {
      filter.type = query.type;
    }
    if (query.source) {
      filter.source = query.source;
    }
    if (query.cursor) {
      filter._id = { $lt: query.cursor };
    }

    return WalletTransactionModel.find(filter)
      .sort({ _id: -1 })
      .limit(query.limit + 1);
  },

  /**
   * Admin: List all balances with pagination.
   */
  async listBalances(
    limit = 20,
    cursor?: string,
  ): Promise<WalletBalanceDocument[]> {
    const query: Record<string, unknown> = {};
    if (cursor) {
      query._id = { $lt: cursor };
    }
    return WalletBalanceModel.find(query).sort({ _id: -1 }).limit(limit + 1);
  },

  /**
   * Hold reservation management.
   */
  async createHold(
    data: Partial<WalletHoldSchemaType> & {
      holdId: string;
      userId: string;
      amount: number;
      source: string;
      status: WalletHoldStatus;
      expiresAt: Date;
    },
    session?: ClientSession,
  ): Promise<WalletHoldDocument> {
    const [hold] = await WalletHoldModel.create([data], { session });
    return hold!;
  },

  async findHold(
    holdId: string,
    session?: ClientSession,
  ): Promise<WalletHoldDocument | null> {
    return WalletHoldModel.findOne({ holdId }).session(session ?? null);
  },

  async updateHoldStatus(
    holdId: string,
    status: WalletHoldStatus,
    session?: ClientSession,
  ): Promise<WalletHoldDocument | null> {
    return WalletHoldModel.findOneAndUpdate(
      { holdId },
      { status },
      { new: true, session },
    );
  },

  /**
   * Reconciles all transactions in the ledger for a user by computing
   * sum(credits) - sum(debits).
   */
  async computeLedgerSum(userId: string): Promise<{
    computedBalance: number;
    totalCredits: number;
    totalDebits: number;
    transactionCount: number;
  }> {
    const transactions = await WalletTransactionModel.find({ userId });

    let totalCredits = 0;
    let totalDebits = 0;

    for (const tx of transactions) {
      if (
        tx.type === WalletTransactionType.CREDIT ||
        tx.type === WalletTransactionType.BONUS ||
        tx.type === WalletTransactionType.PROMOTIONAL_CREDIT ||
        tx.type === WalletTransactionType.REFERRAL_CREDIT ||
        tx.type === WalletTransactionType.REFUND
      ) {
        totalCredits += tx.amount;
      } else if (tx.type === WalletTransactionType.DEBIT) {
        totalDebits += tx.amount;
      } else if (tx.type === WalletTransactionType.ADJUSTMENT) {
        // Look at metadata or diff in balance to determine direction
        if (tx.balanceAfter > tx.balanceBefore) {
          totalCredits += tx.amount;
        } else {
          totalDebits += tx.amount;
        }
      }
    }

    return {
      computedBalance: totalCredits - totalDebits,
      totalCredits,
      totalDebits,
      transactionCount: transactions.length,
    };
  },
};
