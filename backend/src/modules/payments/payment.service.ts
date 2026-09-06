import mongoose from 'mongoose';
import {
  PaymentGateway,
  PaymentOrderStatus,
  PaymentRefundStatus,
  PaymentTransactionStatus,
  WalletTransactionSource,
  type AdminPaymentRefundInput,
  type CreatePaymentOrderInput,
  type PaginatedResult,
  type PaymentHistoryQuery,
  type PaymentOrderDTO,
  type PaymentReconciliationResult,
  type PaymentRefundDTO,
  type PaymentTransactionDTO,
  type PaymentVerificationInput,
  type PricingSnapshot,
} from '@astroai/shared-types';
import {
  InvalidRefundAmountError,
  NotFoundError,
  PaymentOrderAlreadyPaidError,
  PaymentOrderNotFoundError,
  PaymentSignatureInvalidError,
  UnauthorizedError,
  WebhookSignatureInvalidError,
} from '../../shared/errors';
import { logger } from '../../shared/logger';
import { eventBus } from '../../shared/eventBus';
import { pricingService } from '../pricing/pricing.service';
import { walletService } from '../wallet/wallet.service';
import { promotionsService } from '../promotions/promotions.service';
import { referralService } from '../promotions/referral.service';
import { paymentRepository } from './payment.repository';
import type { PaymentOrderDocument } from './paymentOrder.model';
import type { PaymentRefundDocument } from './paymentRefund.model';
import type { PaymentTransactionDocument } from './paymentTransaction.model';
import { razorpayGateway } from './razorpayGateway';

function toPricingSnapshot(snap: any): PricingSnapshot {
  return {
    pricingVersion: snap.pricingVersion,
    unitPrice: snap.unitPrice,
    netAmount: snap.netAmount,
    unitsCalculated: snap.unitsCalculated ?? undefined,
    billingUnit: snap.billingUnit ?? undefined,
    discountAppliedPercent: snap.discountAppliedPercent ?? undefined,
    grossAmount: snap.grossAmount ?? undefined,
  };
}

function toOrderDTO(doc: PaymentOrderDocument): PaymentOrderDTO {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    packId: doc.packId,
    gateway: doc.gateway,
    gatewayOrderId: doc.gatewayOrderId,
    amount: doc.amount,
    currency: doc.currency,
    credits: doc.credits,
    bonusCredits: doc.bonusCredits,
    totalCredits: doc.totalCredits,
    status: doc.status,
    idempotencyKey: doc.idempotencyKey,
    pricingSnapshot: toPricingSnapshot(doc.pricingSnapshot),
    refundedAmount: doc.refundedAmount || 0,
    paidAt: doc.paidAt ? doc.paidAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toTransactionDTO(doc: PaymentTransactionDocument): PaymentTransactionDTO {
  return {
    id: doc._id.toString(),
    orderId: doc.orderId,
    userId: doc.userId,
    gatewayPaymentId: doc.gatewayPaymentId,
    gatewayOrderId: doc.gatewayOrderId,
    amount: doc.amount,
    currency: doc.currency,
    method: doc.method ?? null,
    status: doc.status,
    errorCode: doc.errorCode ?? null,
    errorDescription: doc.errorDescription ?? null,
    rawResponse: doc.rawResponse,
    createdAt: doc.createdAt.toISOString(),
  };
}

function toRefundDTO(doc: PaymentRefundDocument): PaymentRefundDTO {
  return {
    id: doc._id.toString(),
    orderId: doc.orderId,
    gatewayRefundId: doc.gatewayRefundId ?? null,
    amount: doc.amount,
    currency: doc.currency,
    reason: doc.reason,
    status: doc.status as PaymentRefundStatus,
    adminId: doc.adminId ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export const paymentService = {
  /**
   * Creates a payment order for a credit pack with Razorpay and stores record.
   */
  async createOrder(
    userId: string,
    input: CreatePaymentOrderInput,
  ): Promise<PaymentOrderDTO> {
    // 1. Idempotency check: Return existing order if key matches
    const existing = await paymentRepository.findOrderByUserAndIdempotencyKey(
      userId,
      input.idempotencyKey,
    );
    if (existing && existing.status !== PaymentOrderStatus.FAILED && existing.status !== PaymentOrderStatus.CANCELLED) {
      return toOrderDTO(existing);
    }

    // 2. Fetch active pricing and validate credit pack
    const activeConfig = await pricingService.getActiveConfig();
    const pack = activeConfig.creditPacks.find((p) => p.id === input.packId && p.active);
    if (!pack) {
      throw new NotFoundError(`Credit pack "${input.packId}" not found or inactive`);
    }

    // 3. Evaluate promo code if provided
    let effectiveAmount = pack.priceAmount;
    let promoBonusCredits = 0;
    let promoDiscountAmount = 0;
    let promoCodeApplied: string | undefined;

    if (input.promoCode) {
      const validation = await promotionsService.validatePromoCode(userId, {
        code: input.promoCode,
        amount: pack.priceAmount,
        targetType: 'credit_pack',
        targetId: pack.id,
      });
      if (validation.valid) {
        promoDiscountAmount = validation.discountAmount;
        promoBonusCredits = validation.bonusCredits;
        effectiveAmount = validation.finalAmount;
        promoCodeApplied = validation.code;
      }
    }

    // 4. Create order on Razorpay gateway (ensure min ₹1 / 100 paise)
    const gatewayAmount = Math.max(100, effectiveAmount);
    const receipt = `rcpt_${Date.now()}_${userId.slice(-6)}`;
    const totalCredits = pack.credits + pack.bonusCredits + promoBonusCredits;

    const rzpOrder = await razorpayGateway.createOrder({
      amount: gatewayAmount,
      currency: pack.currency,
      receipt,
      notes: {
        userId,
        packId: pack.id,
        credits: String(pack.credits),
        bonusCredits: String(pack.bonusCredits + promoBonusCredits),
        promoCode: promoCodeApplied || '',
      },
    });

    // 5. Persist internal PaymentOrder
    try {
      const orderDoc = await paymentRepository.createOrder({
        userId,
        packId: pack.id,
        gateway: PaymentGateway.RAZORPAY,
        gatewayOrderId: rzpOrder.id,
        amount: gatewayAmount,
        currency: pack.currency,
        credits: pack.credits,
        bonusCredits: pack.bonusCredits + promoBonusCredits,
        totalCredits,
        status: PaymentOrderStatus.CREATED,
        idempotencyKey: input.idempotencyKey,
        pricingSnapshot: {
          pricingVersion: activeConfig.version,
          unitPrice: pack.priceAmount,
          netAmount: gatewayAmount,
          discountAppliedPercent: promoDiscountAmount > 0 ? Math.round((promoDiscountAmount / pack.priceAmount) * 100) : undefined,
        },
        metadata: {
          packName: pack.name,
          receipt,
          promoCode: promoCodeApplied,
          discountAmount: promoDiscountAmount,
        },
      });

      return toOrderDTO(orderDoc);
    } catch (err: any) {
      if (err.code === 11000 || err.name === 'MongoServerError') {
        const existingOrder = await paymentRepository.findOrderByUserAndIdempotencyKey(
          userId,
          input.idempotencyKey,
        );
        if (existingOrder) {
          return toOrderDTO(existingOrder);
        }
      }
      throw err;
    }
  },

  /**
   * Verifies client checkout return and atomically credits user wallet.
   */
  async verifyPayment(
    userId: string,
    input: PaymentVerificationInput,
  ): Promise<{ order: PaymentOrderDTO; walletBalance: any }> {
    // 1. Cryptographic HMAC verification of Razorpay signature
    const isValidSignature = razorpayGateway.verifyPaymentSignature(
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature,
    );

    if (!isValidSignature) {
      logger.warn(
        { userId, input },
        'Payment signature verification failed - Possible client tampering',
      );
      throw new PaymentSignatureInvalidError();
    }

    // 2. Lookup order by internal ID or gateway order ID
    let order = await paymentRepository.findOrderById(input.orderId);
    if (!order) {
      order = await paymentRepository.findOrderByGatewayOrderId(input.razorpayOrderId);
    }
    if (!order) {
      throw new PaymentOrderNotFoundError();
    }

    if (order.userId !== userId) {
      throw new UnauthorizedError('Order does not belong to this user');
    }

    // 3. Idempotent return if order is already paid
    if (order.status === PaymentOrderStatus.PAID) {
      const balance = await walletService.getBalance(userId);
      return { order: toOrderDTO(order), walletBalance: balance };
    }

    // 4. Atomic verification and wallet credit inside MongoDB transaction
    const targetOrder = order;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // Record payment transaction attempt
        await paymentRepository.createTransaction(
          {
            orderId: targetOrder._id.toString(),
            userId,
            gatewayPaymentId: input.razorpayPaymentId,
            gatewayOrderId: input.razorpayOrderId,
            amount: targetOrder.amount,
            currency: targetOrder.currency,
            status: PaymentTransactionStatus.CAPTURED,
            signatureVerified: true,
          },
          session,
        );

        // Transition order status to PAID
        const updatedOrder = await paymentRepository.updateOrderStatus(
          targetOrder._id.toString(),
          PaymentOrderStatus.PAID,
          { paidAt: new Date() },
          session,
        );

        if (!updatedOrder) {
          throw new PaymentOrderNotFoundError();
        }
        order = updatedOrder;
      });
    } finally {
      await session.endSession();
    }

    // Atomically credit user wallet with immutable ledger entry
    await walletService.credit(userId, {
      amount: targetOrder.totalCredits,
      source: WalletTransactionSource.PAYMENT,
      idempotencyKey: `pay_credit_${input.razorpayPaymentId}`,
      referenceId: input.razorpayPaymentId,
      pricingSnapshot: toPricingSnapshot(targetOrder.pricingSnapshot),
      metadata: {
        orderId: targetOrder._id.toString(),
        gatewayOrderId: input.razorpayOrderId,
        gatewayPaymentId: input.razorpayPaymentId,
      },
    });

    eventBus.emit('payment.purchased', {
      userId,
      orderId: targetOrder._id.toString(),
      amount: targetOrder.amount,
      credits: targetOrder.totalCredits,
      currency: targetOrder.currency,
    });

    // Record promotion redemption if promo code was used
    const promoCode = (targetOrder.metadata as any)?.promoCode;
    const discountAmount = (targetOrder.metadata as any)?.discountAmount || 0;
    if (promoCode) {
      promotionsService
        .applyPromoCodeInTransaction(
          userId,
          {
            valid: true,
            code: promoCode,
            discountAmount,
            bonusCredits: 0,
            originalAmount: targetOrder.pricingSnapshot?.unitPrice || targetOrder.amount,
            finalAmount: targetOrder.amount,
            message: 'Redeemed',
          },
          targetOrder._id.toString(),
        )
        .catch(() => {});
    }

    // Process referral reward for referee's qualifying first purchase
    referralService
      .handleQualifyingPurchase({
        refereeId: userId,
        orderId: targetOrder._id.toString(),
        orderAmount: targetOrder.amount,
      })
      .catch(() => {});

    const currentBalance = await walletService.getBalance(userId);
    return { order: toOrderDTO(order), walletBalance: currentBalance };
  },

  /**
   * Processes Razorpay Webhook events with signature verification & deduplication.
   */
  async handleWebhook(
    rawBody: string | Buffer,
    signature: string,
  ): Promise<{ status: string }> {
    // 1. Verify Webhook HMAC signature
    const isValid = razorpayGateway.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      logger.warn('Razorpay webhook HMAC signature verification failed');
      throw new WebhookSignatureInvalidError();
    }

    // 2. Parse payload
    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const eventJson = JSON.parse(bodyStr);
    const eventId = eventJson.id || eventJson.event_id || `evt_${Date.now()}`;
    const eventType = eventJson.event;
    const paymentEntity = eventJson.payload?.payment?.entity;
    const orderEntity = eventJson.payload?.order?.entity;

    // 3. Webhook Deduplication Check
    const alreadyProcessed = await paymentRepository.isWebhookEventProcessed(eventId);
    if (alreadyProcessed) {
      logger.info({ eventId, eventType }, 'Webhook event already processed. Skipping.');
      return { status: 'already_processed' };
    }

    // 4. Process event types
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const gatewayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const gatewayPaymentId = paymentEntity?.id || `pay_${Date.now()}`;

      if (gatewayOrderId) {
        const order = await paymentRepository.findOrderByGatewayOrderId(gatewayOrderId);
        if (order && order.status !== PaymentOrderStatus.PAID) {
          const session = await mongoose.startSession();
          try {
            await session.withTransaction(async () => {
              // Create transaction attempt if not exists
              const existingTx = await paymentRepository.findTransactionByGatewayPaymentId(
                gatewayPaymentId,
                session,
              );
              if (!existingTx) {
                await paymentRepository.createTransaction(
                  {
                    orderId: order._id.toString(),
                    userId: order.userId,
                    gatewayPaymentId,
                    gatewayOrderId,
                    amount: order.amount,
                    currency: order.currency,
                    method: paymentEntity?.method ?? null,
                    status: PaymentTransactionStatus.CAPTURED,
                    signatureVerified: true,
                    rawResponse: paymentEntity,
                  },
                  session,
                );
              }

              // Update order status to PAID
              await paymentRepository.updateOrderStatus(
                order._id.toString(),
                PaymentOrderStatus.PAID,
                { paidAt: new Date() },
                session,
              );
            });
          } finally {
            await session.endSession();
          }

          // Atomically credit user wallet
          await walletService.credit(order.userId, {
            amount: order.totalCredits,
            source: WalletTransactionSource.PAYMENT,
            idempotencyKey: `pay_credit_${gatewayPaymentId}`,
            referenceId: gatewayPaymentId,
            pricingSnapshot: toPricingSnapshot(order.pricingSnapshot),
            metadata: {
              orderId: order._id.toString(),
              gatewayOrderId,
              gatewayPaymentId,
              source: 'webhook',
            },
          });
        }
      }
    } else if (eventType === 'payment.failed') {
      const gatewayOrderId = paymentEntity?.order_id;
      const gatewayPaymentId = paymentEntity?.id;

      if (gatewayOrderId) {
        const order = await paymentRepository.findOrderByGatewayOrderId(gatewayOrderId);
        if (order && order.status === PaymentOrderStatus.CREATED) {
          await paymentRepository.updateOrderStatus(
            order._id.toString(),
            PaymentOrderStatus.FAILED,
          );

          if (gatewayPaymentId) {
            await paymentRepository.createTransaction({
              orderId: order._id.toString(),
              userId: order.userId,
              gatewayPaymentId,
              gatewayOrderId,
              amount: order.amount,
              currency: order.currency,
              status: PaymentTransactionStatus.FAILED,
              errorCode: paymentEntity?.error_code ?? null,
              errorDescription: paymentEntity?.error_description ?? null,
              signatureVerified: true,
              rawResponse: paymentEntity,
            });
          }
        }
      }
    }

    // 5. Record event in webhook audit log
    await paymentRepository.recordWebhookEvent({
      eventId,
      eventType,
      gatewayOrderId: paymentEntity?.order_id || orderEntity?.id,
      gatewayPaymentId: paymentEntity?.id,
      payload: eventJson,
      processed: true,
    });

    return { status: 'processed' };
  },

  /**
   * Executes a full or partial refund on Razorpay and debits corresponding credits from wallet.
   */
  async refundOrder(
    adminId: string,
    orderId: string,
    input: AdminPaymentRefundInput,
  ): Promise<PaymentRefundDTO> {
    const order = await paymentRepository.findOrderById(orderId);
    if (!order) {
      throw new PaymentOrderNotFoundError();
    }

    if (
      order.status !== PaymentOrderStatus.PAID &&
      order.status !== PaymentOrderStatus.PARTIALLY_REFUNDED
    ) {
      throw new PaymentOrderAlreadyPaidError('Only paid orders can be refunded');
    }

    const remainingRefundable = order.amount - (order.refundedAmount || 0);
    const refundAmount = input.amount ?? remainingRefundable;

    if (refundAmount <= 0 || refundAmount > remainingRefundable) {
      throw new InvalidRefundAmountError(
        `Invalid refund amount. Remaining refundable is ₹${(remainingRefundable / 100).toFixed(2)}`,
      );
    }

    // 1. Locate captured payment transaction ID
    const transactions = await paymentRepository.findTransactionsByOrderId(orderId);
    const capturedTx = transactions.find(
      (t) => t.status === PaymentTransactionStatus.CAPTURED,
    );
    const gatewayPaymentId = capturedTx?.gatewayPaymentId || `pay_mock_${Date.now()}`;

    // 2. Call Razorpay API to execute refund
    const rzpRefund = await razorpayGateway.createRefund(gatewayPaymentId, {
      amount: refundAmount,
      notes: { reason: input.reason, adminId, orderId },
    });

    // 3. Proportional credits to debit from wallet
    const creditsToDebit = Math.max(
      1,
      Math.round((refundAmount / order.amount) * order.totalCredits),
    );

    let refundDoc: PaymentRefundDocument;

    // 4. Multi-document transaction: update order, record refund, debit wallet
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        refundDoc = await paymentRepository.createRefund(
          {
            orderId,
            paymentId: gatewayPaymentId,
            gatewayRefundId: rzpRefund.id,
            amount: refundAmount,
            currency: order.currency,
            reason: input.reason,
            status: PaymentRefundStatus.PROCESSED,
            adminId,
            rawResponse: rzpRefund as unknown as Record<string, unknown>,
          },
          session,
        );

        const newRefundedAmount = (order.refundedAmount || 0) + refundAmount;
        const newStatus =
          newRefundedAmount >= order.amount
            ? PaymentOrderStatus.REFUNDED
            : PaymentOrderStatus.PARTIALLY_REFUNDED;

        await paymentRepository.updateOrderStatus(
          orderId,
          newStatus,
          { refundedAmount: newRefundedAmount },
          session,
        );
      });
    } finally {
      await session.endSession();
    }

    // Debit corresponding credits from user wallet
    await walletService.debit(order.userId, {
      amount: creditsToDebit,
      source: WalletTransactionSource.PAYMENT,
      idempotencyKey: `pay_refund_debit_${refundDoc!._id.toString()}`,
      referenceId: refundDoc!._id.toString(),
      pricingSnapshot: toPricingSnapshot(order.pricingSnapshot),
      metadata: {
        orderId,
        gatewayRefundId: rzpRefund.id,
        reason: input.reason,
        adminId,
      },
    });

    return toRefundDTO(refundDoc!);
  },

  /**
   * Reconciles order state with Razorpay gateway truth.
   */
  async reconcileOrder(orderId: string): Promise<PaymentReconciliationResult> {
    const order = await paymentRepository.findOrderById(orderId);
    if (!order) {
      throw new PaymentOrderNotFoundError();
    }

    // Check transactions
    const txs = await paymentRepository.findTransactionsByOrderId(orderId);
    const capturedTx = txs.find((t) => t.status === PaymentTransactionStatus.CAPTURED);

    let gatewayStatus = 'created';
    if (capturedTx) {
      const rzpPayment = await razorpayGateway.fetchPayment(capturedTx.gatewayPaymentId);
      gatewayStatus = rzpPayment.status;
    }

    const isSynced =
      (gatewayStatus === 'captured' && order.status === PaymentOrderStatus.PAID) ||
      (gatewayStatus !== 'captured' && order.status !== PaymentOrderStatus.PAID);

    return {
      orderId: order._id.toString(),
      gatewayOrderId: order.gatewayOrderId,
      gatewayStatus,
      internalStatus: order.status,
      isSynced,
      walletCredited: order.status === PaymentOrderStatus.PAID,
    };
  },

  async getUserPayments(
    userId: string,
    query: PaymentHistoryQuery,
  ): Promise<PaginatedResult<PaymentOrderDTO>> {
    const orders = await paymentRepository.listUserOrders(
      userId,
      query.limit + 1,
      query.cursor,
    );

    const hasMore = orders.length > query.limit;
    const items = hasMore ? orders.slice(0, query.limit) : orders;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!._id.toString() : null;

    return {
      items: items.map(toOrderDTO),
      nextCursor,
    };
  },

  async adminListPayments(
    query: PaymentHistoryQuery,
  ): Promise<PaginatedResult<PaymentOrderDTO>> {
    const orders = await paymentRepository.listAllOrders(
      query.limit + 1,
      query.cursor,
      query.status,
    );

    const hasMore = orders.length > query.limit;
    const items = hasMore ? orders.slice(0, query.limit) : orders;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!._id.toString() : null;

    return {
      items: items.map(toOrderDTO),
      nextCursor,
    };
  },

  async getOrderDetails(orderId: string): Promise<{
    order: PaymentOrderDTO;
    transactions: PaymentTransactionDTO[];
    refunds: PaymentRefundDTO[];
  }> {
    const order = await paymentRepository.findOrderById(orderId);
    if (!order) {
      throw new PaymentOrderNotFoundError();
    }

    const [transactions, refunds] = await Promise.all([
      paymentRepository.findTransactionsByOrderId(orderId),
      paymentRepository.findRefundsByOrderId(orderId),
    ]);

    return {
      order: toOrderDTO(order),
      transactions: transactions.map(toTransactionDTO),
      refunds: refunds.map(toRefundDTO),
    };
  },
};
