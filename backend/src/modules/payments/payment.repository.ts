import type { ClientSession } from 'mongoose';
import {
  PaymentOrderStatus,
  PaymentTransactionStatus,
  type PaymentGateway,
  type PricingSnapshot,
} from '@astroai/shared-types';
import {
  PaymentOrderModel,
  type PaymentOrderDocument,
} from './paymentOrder.model';
import {
  PaymentTransactionModel,
  type PaymentTransactionDocument,
} from './paymentTransaction.model';
import {
  PaymentRefundModel,
  type PaymentRefundDocument,
} from './paymentRefund.model';
import {
  PaymentWebhookEventModel,
  type PaymentWebhookEventDocument,
} from './paymentWebhookEvent.model';

export const paymentRepository = {
  async findOrderById(
    id: string,
    session?: ClientSession,
  ): Promise<PaymentOrderDocument | null> {
    return PaymentOrderModel.findById(id).session(session ?? null);
  },

  async findOrderByGatewayOrderId(
    gatewayOrderId: string,
    session?: ClientSession,
  ): Promise<PaymentOrderDocument | null> {
    return PaymentOrderModel.findOne({ gatewayOrderId }).session(session ?? null);
  },

  async findOrderByUserAndIdempotencyKey(
    userId: string,
    idempotencyKey: string,
    session?: ClientSession,
  ): Promise<PaymentOrderDocument | null> {
    return PaymentOrderModel.findOne({ userId, idempotencyKey }).session(
      session ?? null,
    );
  },

  async countPaidOrdersByUser(userId: string): Promise<number> {
    return PaymentOrderModel.countDocuments({
      userId,
      status: PaymentOrderStatus.PAID,
    }).exec();
  },

  async createOrder(
    data: {
      userId: string;
      packId: string;
      gateway: PaymentGateway;
      gatewayOrderId: string;
      amount: number;
      currency: string;
      credits: number;
      bonusCredits: number;
      totalCredits: number;
      status: PaymentOrderStatus;
      idempotencyKey: string;
      pricingSnapshot: PricingSnapshot;
      metadata?: Record<string, unknown>;
    },
    session?: ClientSession,
  ): Promise<PaymentOrderDocument> {
    const [order] = await PaymentOrderModel.create([data], { session });
    return order!;
  },

  async updateOrderStatus(
    orderId: string,
    status: PaymentOrderStatus,
    extraUpdates: Record<string, unknown> = {},
    session?: ClientSession,
  ): Promise<PaymentOrderDocument | null> {
    return PaymentOrderModel.findByIdAndUpdate(
      orderId,
      { $set: { status, ...extraUpdates } },
      { new: true, session },
    );
  },

  async createTransaction(
    data: {
      orderId: string;
      userId: string;
      gatewayPaymentId: string;
      gatewayOrderId: string;
      amount: number;
      currency: string;
      method?: string | null;
      status: PaymentTransactionStatus;
      errorCode?: string | null;
      errorDescription?: string | null;
      signatureVerified: boolean;
      rawResponse?: Record<string, unknown>;
    },
    session?: ClientSession,
  ): Promise<PaymentTransactionDocument> {
    const [tx] = await PaymentTransactionModel.create([data], { session });
    return tx!;
  },

  async findTransactionByGatewayPaymentId(
    gatewayPaymentId: string,
    session?: ClientSession,
  ): Promise<PaymentTransactionDocument | null> {
    return PaymentTransactionModel.findOne({ gatewayPaymentId }).session(
      session ?? null,
    );
  },

  async findTransactionsByOrderId(
    orderId: string,
    session?: ClientSession,
  ): Promise<PaymentTransactionDocument[]> {
    return PaymentTransactionModel.find({ orderId })
      .sort({ createdAt: -1 })
      .session(session ?? null);
  },

  async createRefund(
    data: {
      orderId: string;
      paymentId: string;
      gatewayRefundId: string | null;
      amount: number;
      currency: string;
      reason: string;
      status: string;
      adminId: string | null;
      rawResponse?: Record<string, unknown>;
    },
    session?: ClientSession,
  ): Promise<PaymentRefundDocument> {
    const [refund] = await PaymentRefundModel.create([data], { session });
    return refund!;
  },

  async findRefundsByOrderId(
    orderId: string,
    session?: ClientSession,
  ): Promise<PaymentRefundDocument[]> {
    return PaymentRefundModel.find({ orderId })
      .sort({ createdAt: -1 })
      .session(session ?? null);
  },

  async recordWebhookEvent(
    data: {
      eventId: string;
      eventType: string;
      gatewayOrderId?: string | null;
      gatewayPaymentId?: string | null;
      payload: Record<string, unknown>;
      processed?: boolean;
      errorMessage?: string | null;
    },
    session?: ClientSession,
  ): Promise<PaymentWebhookEventDocument> {
    try {
      const [event] = await PaymentWebhookEventModel.create([data], { session });
      return event!;
    } catch (err: any) {
      if (err.code === 11000 || err.name === 'MongoServerError') {
        const existing = await PaymentWebhookEventModel.findOne({ eventId: data.eventId }).session(
          session ?? null,
        );
        if (existing) return existing;
      }
      throw err;
    }
  },

  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    const existing = await PaymentWebhookEventModel.findOne({ eventId });
    return Boolean(existing && existing.processed);
  },

  async listUserOrders(
    userId: string,
    limit = 20,
    cursor?: string,
  ): Promise<PaymentOrderDocument[]> {
    const query: Record<string, unknown> = { userId };
    if (cursor) {
      query._id = { $lt: cursor };
    }
    return PaymentOrderModel.find(query)
      .sort({ _id: -1 })
      .limit(limit);
  },

  async listAllOrders(
    limit = 20,
    cursor?: string,
    status?: PaymentOrderStatus,
  ): Promise<PaymentOrderDocument[]> {
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (cursor) query._id = { $lt: cursor };

    return PaymentOrderModel.find(query)
      .sort({ _id: -1 })
      .limit(limit);
  },
};
