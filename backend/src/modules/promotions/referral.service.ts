import {
  ReferralRecordDTO,
  ReferralStatus,
  UserReferralSummaryDTO,
  WalletTransactionSource,
  WalletTransactionType,
} from '@astroai/shared-types';
import { eventBus } from '../../shared/eventBus';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import { UserModel } from '../users/user.model';
import { walletService } from '../wallet/wallet.service';
import { referralRepository } from './repositories/referral.repository';

export class ReferralService {
  private readonly DEFAULT_REFERRER_REWARD = 25; // 25 credits
  private readonly DEFAULT_REFEREE_REWARD = 25; // 25 credits

  /**
   * Derives or generates a user's unique referral code.
   */
  getUserReferralCode(userId: string): string {
    const cleanId = userId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `ASTRO${cleanId.slice(-6)}`;
  }

  /**
   * Resolves a user ID from a referral code.
   */
  async findUserByReferralCode(code: string): Promise<{ id: string; email: string | null } | null> {
    const uppercaseCode = code.toUpperCase();
    const users = await UserModel.find({ status: 'active' }).exec();
    for (const u of users) {
      if (this.getUserReferralCode(u._id.toString()) === uppercaseCode) {
        return {
          id: u._id.toString(),
          email: u.email || null,
        };
      }
    }
    return null;
  }

  /**
   * Applies and claims a referral code for a referee user.
   */
  async claimReferralCode(input: {
    refereeId: string;
    referralCode: string;
    refereeName?: string;
    refereeEmail?: string;
    deviceId?: string;
    ipAddress?: string;
  }): Promise<ReferralRecordDTO> {
    const normalizedCode = input.referralCode.trim().toUpperCase();
    const referrer = await this.findUserByReferralCode(normalizedCode);

    if (!referrer) {
      throw new NotFoundError(`Referral code "${normalizedCode}" is invalid`);
    }

    // 1. Prevent self-referral
    if (referrer.id === input.refereeId) {
      throw new ValidationError('You cannot redeem your own referral code');
    }

    // 2. Prevent duplicate referral claim for referee
    const existing = await referralRepository.findByRefereeId(input.refereeId);
    if (existing) {
      throw new ConflictError('You have already applied a referral code');
    }

    // 3. Prevent multi-hop circular referral loops (e.g. A -> B -> A or A -> B -> C -> A)
    let currentAncestorId: string | null = referrer.id;
    const visited = new Set<string>([input.refereeId]);
    while (currentAncestorId) {
      if (visited.has(currentAncestorId)) {
        throw new ValidationError('Circular referral loop detected between accounts');
      }
      visited.add(currentAncestorId);
      const ancestorReferral = await referralRepository.findByRefereeId(currentAncestorId);
      currentAncestorId = ancestorReferral ? ancestorReferral.referrerId : null;
    }

    // 4. Record abuse signals if any
    const abuseSignals: string[] = [];
    if (input.refereeEmail && referrer.email && input.refereeEmail.toLowerCase() === referrer.email.toLowerCase()) {
      abuseSignals.push('MATCHING_EMAIL');
    }

    // 5. Persist referral record
    const referral = await referralRepository.create({
      referrerId: referrer.id,
      referrerCode: normalizedCode,
      refereeId: input.refereeId,
      refereeName: input.refereeName,
      refereeEmail: input.refereeEmail,
      status: ReferralStatus.PENDING,
      referrerRewardCredits: this.DEFAULT_REFERRER_REWARD,
      refereeRewardCredits: this.DEFAULT_REFEREE_REWARD,
      abuseSignals,
    });

    // 6. Credit referee signup welcome bonus immediately
    try {
      await walletService.credit(input.refereeId, {
        amount: this.DEFAULT_REFEREE_REWARD,
        source: WalletTransactionSource.REFERRAL_REWARD,
        type: WalletTransactionType.REFERRAL_CREDIT,
        idempotencyKey: `ref_welcome_${referral.id}`,
        metadata: { description: `Welcome referral bonus credits via ${normalizedCode}` },
      });
    } catch {
      // Best-effort credit
    }

    return referral;
  }

  /**
   * Called upon successful payment verification to reward the referrer for referee's first purchase.
   */
  async handleQualifyingPurchase(input: {
    refereeId: string;
    orderId: string;
    orderAmount: number;
  }): Promise<void> {
    const referral = await referralRepository.findByRefereeId(input.refereeId);
    if (!referral || referral.status !== ReferralStatus.PENDING) {
      return;
    }

    // Credit referrer with referral reward
    try {
      await walletService.credit(referral.referrerId, {
        amount: referral.referrerRewardCredits,
        source: WalletTransactionSource.REFERRAL_REWARD,
        type: WalletTransactionType.REFERRAL_CREDIT,
        idempotencyKey: `ref_reward_${referral.id}`,
        metadata: { description: `Referral reward credits for friend's first purchase` },
      });

      // Update referral record status
      await referralRepository.updateStatus(referral.id, ReferralStatus.REWARDED, {
        qualifyingOrderId: input.orderId,
        rewardedAt: new Date(),
      });

      // Emit referral.reward event to trigger notification
      eventBus.emit('referral.reward', {
        userId: referral.refereeId,
        referrerId: referral.referrerId,
        creditsAwarded: referral.referrerRewardCredits,
      });
    } catch (err) {
      // Best-effort reward processing
    }
  }

  /**
   * Retrieves summary metrics and list of referrals for user.
   */
  async getUserReferralSummary(userId: string): Promise<UserReferralSummaryDTO> {
    const code = this.getUserReferralCode(userId);
    const link = `https://astroai.app/join?ref=${code}`;
    const history = await referralRepository.listByReferrerId(userId);

    const successfulReferrals = history.filter((r) => r.status === ReferralStatus.REWARDED).length;
    const pendingReferrals = history.filter((r) => r.status === ReferralStatus.PENDING).length;
    const totalCreditsEarned = history
      .filter((r) => r.status === ReferralStatus.REWARDED)
      .reduce((sum, r) => sum + r.referrerRewardCredits, 0);

    return {
      referralCode: code,
      referralLink: link,
      totalReferrals: history.length,
      successfulReferrals,
      pendingReferrals,
      totalCreditsEarned,
      referrerRewardPerInvite: this.DEFAULT_REFERRER_REWARD,
      refereeRewardOnSignup: this.DEFAULT_REFEREE_REWARD,
      history,
    };
  }

  /**
   * Lists all referral records for admin inspection.
   */
  async listAllReferrals(limit = 100): Promise<ReferralRecordDTO[]> {
    return referralRepository.listAll(limit);
  }
}

export const referralService = new ReferralService();
