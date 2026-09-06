import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ReferralStatus, WalletTransactionType } from '@astroai/shared-types';
import { referralService } from '../../../src/modules/promotions/referral.service';
import { referralRepository } from '../../../src/modules/promotions/repositories/referral.repository';
import { walletService } from '../../../src/modules/wallet/wallet.service';

vi.mock('../../../src/modules/promotions/repositories/referral.repository', () => ({
  referralRepository: {
    create: vi.fn(),
    findByRefereeId: vi.fn(),
    listByReferrerId: vi.fn(),
    updateStatus: vi.fn(),
    listAll: vi.fn(),
  },
}));

vi.mock('../../../src/modules/wallet/wallet.service', () => ({
  walletService: {
    credit: vi.fn(),
  },
}));

const mockCreateReferral = vi.mocked(referralRepository.create);
const mockFindByRefereeId = vi.mocked(referralRepository.findByRefereeId);
const mockWalletCredit = vi.mocked(walletService.credit);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReferralService Unit Tests', () => {
  it('generates deterministic referral code for user', () => {
    const code = referralService.getUserReferralCode('usr_99887766aabb');
    expect(code).toBe('ASTRO66AABB');
  });

  it('rejects self-referral attempts', async () => {
    vi.spyOn(referralService, 'findUserByReferralCode').mockResolvedValue({
      id: 'usr_self',
      email: 'self@test.com',
    });

    await expect(
      referralService.claimReferralCode({
        refereeId: 'usr_self',
        referralCode: 'ASTROSELF',
      }),
    ).rejects.toThrow('You cannot redeem your own referral code');
  });

  it('rejects duplicate referral claim for same referee', async () => {
    vi.spyOn(referralService, 'findUserByReferralCode').mockResolvedValue({
      id: 'usr_referrer_1',
      email: 'ref1@test.com',
    });

    mockFindByRefereeId.mockResolvedValue({
      id: 'ref_rec_1',
      referrerId: 'usr_prev_referrer',
      referrerCode: 'ASTROPREV',
      refereeId: 'usr_referee_2',
      status: ReferralStatus.PENDING,
      referrerRewardCredits: 25,
      refereeRewardCredits: 25,
      abuseSignals: [],
      rewardedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await expect(
      referralService.claimReferralCode({
        refereeId: 'usr_referee_2',
        referralCode: 'ASTRO1',
      }),
    ).rejects.toThrow('You have already applied a referral code');
  });

  it('claims valid referral and immediately credits referee welcome bonus', async () => {
    vi.spyOn(referralService, 'findUserByReferralCode').mockResolvedValue({
      id: 'usr_friend_1',
      email: 'friend@test.com',
    });

    mockFindByRefereeId.mockResolvedValue(null);
    mockCreateReferral.mockResolvedValue({
      id: 'ref_rec_new',
      referrerId: 'usr_friend_1',
      referrerCode: 'ASTROFRIEND',
      refereeId: 'usr_new_referee',
      status: ReferralStatus.PENDING,
      referrerRewardCredits: 25,
      refereeRewardCredits: 25,
      abuseSignals: [],
      rewardedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const result = await referralService.claimReferralCode({
      refereeId: 'usr_new_referee',
      referralCode: 'ASTROFRIEND',
    });

    expect(result.status).toBe(ReferralStatus.PENDING);
    expect(mockWalletCredit).toHaveBeenCalledWith(
      'usr_new_referee',
      expect.objectContaining({
        amount: 25,
        type: WalletTransactionType.REFERRAL_CREDIT,
      }),
    );
  });
});
