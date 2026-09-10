import { randomUUID } from 'crypto';
import {
  PujaOrderStatus,
  WalletTransactionSource,
  type BookPujaInput,
  type PujaItemDTO,
  type PujaOrderDTO,
} from '@astroai/shared-types';
import { SACRED_PUJA_CATALOG } from './pujaCatalog';
import { PujaOrderModel, type PujaOrderDocument } from './pujaOrder.model';
import { walletService } from '../wallet/wallet.service';
import { logger } from '../../shared/logger';

function toPujaOrderDTO(doc: PujaOrderDocument): PujaOrderDTO {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    pujaId: doc.pujaId,
    pujaTitle: doc.pujaTitle,
    templeName: doc.templeName,
    templeLocation: doc.templeLocation,
    tier: doc.tier as any,
    amountINR: doc.amountINR,
    creditsDeducted: doc.creditsDeducted,
    sankalpaName: doc.sankalpaName,
    gotra: doc.gotra,
    nakshatra: doc.nakshatra,
    prayerIntent: doc.prayerIntent,
    status: doc.status as any,
    scheduledDate: doc.scheduledDate,
    liveStreamUrl: doc.liveStreamUrl,
    prasadTrackingNumber: doc.prasadTrackingNumber,
    prasadCourier: doc.prasadCourier,
    isPrasadDeliveryRequested: doc.isPrasadDeliveryRequested,
    createdAt: (doc as any).createdAt ? (doc as any).createdAt.toISOString() : new Date().toISOString(),
    updatedAt: (doc as any).updatedAt ? (doc as any).updatedAt.toISOString() : new Date().toISOString(),
  };
}

export class PujaService {
  /**
   * Return full or filtered catalog of sacred temple pujas
   */
  public getCatalog(category?: string): PujaItemDTO[] {
    if (!category || category === 'ALL') {
      return SACRED_PUJA_CATALOG;
    }
    return SACRED_PUJA_CATALOG.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase(),
    );
  }

  /**
   * Find a specific sacred puja by its ID
   */
  public getPujaById(id: string): PujaItemDTO | null {
    return SACRED_PUJA_CATALOG.find((item) => item.id === id) ?? null;
  }

  /**
   * Book an authentic temple puja with Vedic Sankalpa
   */
  public async bookPuja(
    userId: string,
    input: BookPujaInput,
  ): Promise<PujaOrderDTO> {
    const puja = this.getPujaById(input.pujaId);
    if (!puja) {
      throw new Error(`Puja with ID '${input.pujaId}' was not found in sacred catalog.`);
    }

    const selectedTier = puja.tiers.find((t) => t.tier === input.tier) || puja.tiers[0];
    if (!selectedTier) {
      throw new Error(`Tier '${input.tier}' is invalid for this puja.`);
    }
    const creditsToDeduct = selectedTier.creditsRequired;

    // Check balance and deduct credits from user's wallet
    const idempotencyKey = `puja-sankalpa-${userId}-${input.pujaId}-${Date.now()}`;
    await walletService.debit(userId, {
      amount: creditsToDeduct,
      source: WalletTransactionSource.PUJA,
      idempotencyKey,
      referenceId: input.pujaId,
      metadata: {
        pujaTitle: puja.title,
        templeName: puja.templeName,
        tier: selectedTier.tier,
        sankalpaName: input.sankalpaName,
      },
    });

    // Schedule within 3 days (auspicious upcoming muhurat)
    const scheduled = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const scheduledDateStr = scheduled.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const liveStreamUrl = puja.isLiveStreamAvailable
      ? `https://live.astroai.vedic/temple-stream/${input.pujaId}-${randomUUID().slice(0, 8)}`
      : null;

    const prasadTrackingNumber = input.isPrasadDeliveryRequested
      ? `VEDIC-EXP-${Math.floor(100000 + Math.random() * 900000)}`
      : null;

    const orderDoc = await PujaOrderModel.create({
      userId,
      pujaId: puja.id,
      pujaTitle: puja.title,
      templeName: puja.templeName,
      templeLocation: puja.templeLocation,
      tier: selectedTier.tier,
      amountINR: selectedTier.priceINR,
      creditsDeducted: creditsToDeduct,
      sankalpaName: input.sankalpaName,
      gotra: input.gotra,
      nakshatra: input.nakshatra,
      prayerIntent: input.prayerIntent,
      status: PujaOrderStatus.CONFIRMED,
      scheduledDate: scheduledDateStr,
      liveStreamUrl,
      prasadTrackingNumber,
      prasadCourier: input.isPrasadDeliveryRequested ? 'India Post Sacred SpeedPost' : null,
      isPrasadDeliveryRequested: input.isPrasadDeliveryRequested,
      deliveryAddress: input.deliveryAddress ?? null,
    });

    logger.info(
      { orderId: orderDoc._id, userId, pujaId: puja.id, tier: selectedTier.tier },
      'Vedic Temple Puja booked successfully with Sankalpa',
    );

    return toPujaOrderDTO(orderDoc);
  }

  /**
   * Get all Puja orders for a specific user
   */
  public async getUserOrders(userId: string): Promise<PujaOrderDTO[]> {
    const docs = await PujaOrderModel.find({ userId }).sort({ createdAt: -1 });
    return docs.map(toPujaOrderDTO);
  }

  /**
   * Get specific Puja order by ID
   */
  public async getOrderById(userId: string, orderId: string): Promise<PujaOrderDTO | null> {
    const doc = await PujaOrderModel.findOne({ _id: orderId, userId });
    return doc ? toPujaOrderDTO(doc) : null;
  }
}

export const pujaService = new PujaService();
