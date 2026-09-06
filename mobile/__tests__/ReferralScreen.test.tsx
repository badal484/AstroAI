import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ReferralStatus } from '@astroai/shared-types';
import { ReferralScreen } from '../src/screens/promotions/ReferralScreen';
import { promotionApi } from '../src/lib/promotionApi';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
    useFocusEffect: (cb: any) => {
      const react = require('react');
      react.useEffect(() => {
        return cb();
      }, [cb]);
    },
  };
});

jest.mock('../src/lib/promotionApi', () => ({
  promotionApi: {
    getUserReferralSummary: jest.fn(),
    claimReferralCode: jest.fn(),
    validatePromoCode: jest.fn(),
    getAvailableOffers: jest.fn(),
  },
}));

const mockGetUserReferralSummary = jest.mocked(promotionApi.getUserReferralSummary);
const mockClaimReferralCode = jest.mocked(promotionApi.claimReferralCode);

beforeEach(() => {
  jest.clearAllMocks();

  mockGetUserReferralSummary.mockResolvedValue({
    referralCode: 'ASTRO7788',
    referralLink: 'https://astroai.app/join?ref=ASTRO7788',
    totalReferrals: 3,
    successfulReferrals: 2,
    pendingReferrals: 1,
    totalCreditsEarned: 50,
    referrerRewardPerInvite: 25,
    refereeRewardOnSignup: 25,
    history: [
      {
        id: 'ref_rec_1',
        referrerId: 'usr_me',
        referrerCode: 'ASTRO7788',
        refereeId: 'usr_friend_abc123',
        status: ReferralStatus.REWARDED,
        referrerRewardCredits: 25,
        refereeRewardCredits: 25,
        abuseSignals: [],
        rewardedAt: '2026-09-02T12:00:00Z',
        createdAt: '2026-09-02T10:00:00Z',
        updatedAt: '2026-09-02T12:00:00Z',
      },
      {
        id: 'ref_rec_2',
        referrerId: 'usr_me',
        referrerCode: 'ASTRO7788',
        refereeId: 'usr_friend_def456',
        status: ReferralStatus.PENDING,
        referrerRewardCredits: 25,
        refereeRewardCredits: 25,
        abuseSignals: [],
        rewardedAt: null,
        createdAt: '2026-09-02T11:00:00Z',
        updatedAt: '2026-09-02T11:00:00Z',
      },
    ],
  });
});

describe('Mobile ReferralScreen Tests', () => {
  it('renders user referral code, rewards summary, and invite history', async () => {
    render(<ReferralScreen />);

    await waitFor(() => {
      expect(screen.getByText('Invite Friends, Share Cosmic Wisdom')).toBeTruthy();
      expect(screen.getByText('ASTRO7788')).toBeTruthy();
      expect(screen.getByText('+50')).toBeTruthy();
      expect(screen.getByText('REWARDED')).toBeTruthy();
      expect(screen.getByText('PENDING')).toBeTruthy();
    });
  });

  it('triggers copy action when Copy button is pressed', async () => {
    render(<ReferralScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('copy-referral-btn')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('copy-referral-btn'));
    expect(screen.getByTestId('copy-referral-btn')).toBeTruthy();
  });

  it('claims friend referral code and updates input', async () => {
    mockClaimReferralCode.mockResolvedValue({
      id: 'ref_new_claimed',
      referrerId: 'usr_other',
      referrerCode: 'ASTRO999',
      refereeId: 'usr_me',
      status: ReferralStatus.PENDING,
      referrerRewardCredits: 25,
      refereeRewardCredits: 25,
      abuseSignals: [],
      rewardedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<ReferralScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('claim-code-input')).toBeTruthy();
    });

    const input = screen.getByTestId('claim-code-input');
    fireEvent.changeText(input, 'ASTRO999');

    await waitFor(() => {
      expect(input.props.value).toBe('ASTRO999');
    });

    fireEvent.press(screen.getByTestId('submit-claim-btn'));

    await waitFor(() => {
      expect(mockClaimReferralCode).toHaveBeenCalledWith({
        referralCode: 'ASTRO999',
      });
    });
  });
});
