import React, { useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import {
  ReportStatus,
  ReportType,
  TimeConfidence,
} from '@astroai/shared-types';
import { birthProfileApi } from '../src/lib/birthProfileApi';
import { reportApi } from '../src/lib/reportApi';
import { walletApi } from '../src/lib/walletApi';
import { ReportCatalogScreen } from '../src/screens/reports/ReportCatalogScreen';
import { ReportHistoryScreen } from '../src/screens/reports/ReportHistoryScreen';
import { ReportViewerScreen } from '../src/screens/reports/ReportViewerScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
    useFocusEffect: (cb: () => void) => {
      React.useEffect(() => {
        cb();
      }, [cb]);
    },
    useRoute: () => ({
      params: { reportId: 'rep_12345678' },
    }),
  };
});

const mockBirthProfiles = jest.fn();
const mockGetBalance = jest.fn();
const mockCreateReport = jest.fn();
const mockListReports = jest.fn();
const mockGetReport = jest.fn();
const mockRetryReport = jest.fn();

jest.mock('../src/lib/birthProfileApi', () => ({
  birthProfileApi: {
    list: () => mockBirthProfiles(),
    listBirthProfiles: () => mockBirthProfiles(),
  },
  listBirthProfiles: () => mockBirthProfiles(),
}));

jest.mock('../src/lib/walletApi', () => ({
  walletApi: {
    getBalance: () => mockGetBalance(),
    fetchWalletBalance: () => mockGetBalance(),
  },
  fetchWalletBalance: () => mockGetBalance(),
}));

jest.mock('../src/lib/reportApi', () => ({
  reportApi: {
    createReport: (...args: unknown[]) => mockCreateReport(...args),
    listReports: (...args: unknown[]) => mockListReports(...args),
    getReport: (...args: unknown[]) => mockGetReport(...args),
    retryReport: (...args: unknown[]) => mockRetryReport(...args),
    getPdfDownloadUrl: (id: string) => `/api/v1/reports/${id}/download`,
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Mobile Report Screens', () => {
  describe('ReportCatalogScreen', () => {
    it('renders report options, user birth profiles, and wallet balance', async () => {
      mockBirthProfiles.mockResolvedValue({
        items: [
          {
            id: 'prof_1',
            userId: 'user_1',
            name: 'Arjun Verma',
            dateOfBirth: '1995-04-14',
            birthTime: '10:30',
            timeConfidence: TimeConfidence.EXACT,
            canonicalLocation: 'New Delhi, India',
            coordinates: { latitude: 28.6139, longitude: 77.209 },
            timezone: 'Asia/Kolkata',
            isSelf: true,
            notes: null,
            createdAt: '2026-09-01T00:00:00Z',
            updatedAt: '2026-09-01T00:00:00Z',
          },
        ],
      });

      mockGetBalance.mockResolvedValue({
        userId: 'user_1',
        balance: 100,
        heldBalance: 0,
        availableBalance: 100,
        currency: 'CREDITS',
        lifetimeEarned: 100,
        lifetimeSpent: 0,
        updatedAt: new Date().toISOString(),
      });

      await render(<ReportCatalogScreen />);

      await waitFor(() => {
        expect(screen.getByText('100 Credits')).toBeTruthy();
        expect(screen.getByText('Comprehensive Vedic Kundli')).toBeTruthy();
        expect(screen.getByText('Ashtakoota Compatibility Milan')).toBeTruthy();
        expect(screen.getByText('Arjun Verma')).toBeTruthy();
      });
    });

    it('submits purchase and navigates when purchase button is tapped', async () => {
      mockBirthProfiles.mockResolvedValue({
        items: [
          {
            id: 'prof_1',
            userId: 'user_1',
            name: 'Arjun Verma',
            dateOfBirth: '1995-04-14',
            birthTime: '10:30',
            timeConfidence: TimeConfidence.EXACT,
            canonicalLocation: 'New Delhi, India',
            coordinates: { latitude: 28.6139, longitude: 77.209 },
            timezone: 'Asia/Kolkata',
            isSelf: true,
            notes: null,
            createdAt: '2026-09-01T00:00:00Z',
            updatedAt: '2026-09-01T00:00:00Z',
          },
        ],
      });

      mockGetBalance.mockResolvedValue({
        userId: 'user_1',
        balance: 50,
        heldBalance: 0,
        availableBalance: 50,
        currency: 'CREDITS',
        lifetimeEarned: 50,
        lifetimeSpent: 0,
        updatedAt: new Date().toISOString(),
      });

      mockCreateReport.mockResolvedValue({
        id: 'rep_new_999',
        userId: 'user_1',
        reportType: ReportType.FULL_KUNDLI,
        primaryBirthProfileId: 'prof_1',
        partnerBirthProfileId: null,
        status: ReportStatus.QUEUED,
        creditsCharged: 20,
        pricingSnapshot: { pricingVersion: 1, unitPrice: 20, netAmount: 20 },
        pdfUrl: null,
        failureStage: null,
        failureReason: null,
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      });

      await render(<ReportCatalogScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Generate Comprehensive Vedic Kundli/i)).toBeTruthy();
      });

      fireEvent.press(screen.getByText(/Generate Comprehensive Vedic Kundli/i));

      await waitFor(() => {
        expect(mockCreateReport).toHaveBeenCalledWith(
          expect.objectContaining({
            reportType: ReportType.FULL_KUNDLI,
            primaryBirthProfileId: 'prof_1',
          }),
        );
      });
    });
  });

  describe('ReportHistoryScreen', () => {
    it('renders list of generated reports with status badges', async () => {
      mockListReports.mockResolvedValue({
        items: [
          {
            id: 'rep_123',
            reportType: ReportType.FULL_KUNDLI,
            title: 'Comprehensive Vedic Kundli',
            status: ReportStatus.COMPLETED,
            pdfUrl: '/api/v1/reports/rep_123/pdf',
            createdAt: '2026-09-02T12:00:00Z',
            completedAt: '2026-09-02T12:01:00Z',
          },
        ],
        nextCursor: null,
      });

      await render(<ReportHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('FULL KUNDLI')).toBeTruthy();
        expect(screen.getByText('COMPLETED')).toBeTruthy();
        expect(screen.getByText('Comprehensive Vedic Kundli')).toBeTruthy();
      });
    });
  });

  describe('ReportViewerScreen', () => {
    it('renders report details with Ashtakoota Milan and AI sections', async () => {
      mockGetReport.mockResolvedValue({
        report: {
          id: 'rep_12345678',
          userId: 'user_1',
          reportType: ReportType.RELATIONSHIP_COMPATIBILITY,
          primaryBirthProfileId: 'prof_1',
          partnerBirthProfileId: 'prof_2',
          status: ReportStatus.COMPLETED,
          creditsCharged: 25,
          pricingSnapshot: { pricingVersion: 1, unitPrice: 25, netAmount: 25 },
          pdfUrl: '/api/v1/reports/rep_12345678/pdf',
          failureStage: null,
          failureReason: null,
          retryCount: 0,
          createdAt: '2026-09-02T12:00:00Z',
          updatedAt: '2026-09-02T12:01:00Z',
          completedAt: '2026-09-02T12:01:00Z',
        },
        astrologyData: {
          ascendant: { sign: 'Aries', degree: 15 },
          moonNakshatra: { name: 'Ashwini' },
        },
        compatibilityScore: {
          totalScore: 28,
          maxScore: 36,
          percentage: 78,
          isAuspicious: true,
          categories: [
            { name: 'Nadi', maxScore: 8, score: 8, area: 'Genetic Compatibility', description: 'Madhya - Antya match' },
          ],
          nadiDosha: false,
          nadiDoshaCancelled: false,
          bhakootDosha: false,
          bhakootDoshaCancelled: false,
          mangalDoshaA: false,
          mangalDoshaB: false,
        },
        sections: [
          {
            title: 'Compatibility Synthesis',
            category: 'summary',
            content: 'The alignment between Arjun and Priya exhibits strong auspicious harmony.',
          },
        ],
      });

      await render(<ReportViewerScreen />);

      await waitFor(() => {
        expect(screen.getByText('COMPLETED')).toBeTruthy();
        expect(screen.getByText('Natal Chart Highlights')).toBeTruthy();
        expect(screen.getByText('Compatibility Synthesis')).toBeTruthy();
        expect(screen.getByText('Aries')).toBeTruthy();
      });

      // Switch to compatibility tab
      fireEvent.press(screen.getByText('Compatibility'));

      await waitFor(() => {
        expect(screen.getByText('8 Ashtakoota Categories')).toBeTruthy();
        expect(screen.getByText('Nadi')).toBeTruthy();
        expect(screen.getByText('8 / 8')).toBeTruthy();
      });
    });
  });
});
