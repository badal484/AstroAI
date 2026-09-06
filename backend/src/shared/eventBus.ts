import { EventEmitter } from 'node:events';
import { logger } from './logger';

/**
 * In-process event bus for cross-module decoupling (ARCHITECTURE.md §2:
 * "an in-process event emitter... is used instead of a direct call, so the
 * wallet module doesn't need to know notifications exist"). Not a message
 * queue — same process, synchronous dispatch order, no persistence. Use
 * BullMQ instead when a job must survive a process restart.
 */
export interface DomainEvents {
  'birthProfile.changed': { birthProfileId: string };
  'birthProfile.deleted': { birthProfileId: string };
  'user.registered': { userId: string; email?: string | null; name?: string | null; language?: string };
  'birthProfile.completed': { userId: string; birthProfileId: string; name: string; dateOfBirth: string };
  'chat.firstMessage': { userId: string; conversationId: string; title?: string };
  'wallet.lowBalance': { userId: string; availableBalance: number; threshold: number };
  'report.ready': { userId: string; reportId: string; reportType: string; pdfUrl?: string | null };
  'horoscope.ready': { userId: string; rashi: string; date: string; summary?: string };
  'payment.purchased': { userId: string; orderId: string; amount: number; credits: number; currency: string };
  'user.inactivity': { userId: string; inactiveDays: number };
  'user.birthday': { userId: string; birthProfileId: string; name: string };
  'campaign.triggered': { campaignId: string; targetUserIds?: string[] };
  'referral.reward': { userId: string; referrerId: string; creditsAwarded: number };
}

class TypedEventBus {
  private readonly emitter = new EventEmitter();

  on<K extends keyof DomainEvents>(event: K, listener: (payload: DomainEvents[K]) => void): void {
    this.emitter.on(event, (payload: DomainEvents[K]) => {
      try {
        listener(payload);
      } catch (error) {
        logger.error({ err: error, event }, 'Unhandled error in event listener');
      }
    });
  }

  emit<K extends keyof DomainEvents>(event: K, payload: DomainEvents[K]): void {
    this.emitter.emit(event, payload);
  }
}

export const eventBus = new TypedEventBus();
