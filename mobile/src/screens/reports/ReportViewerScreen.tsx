import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ReportStatus } from '@astroai/shared-types';
import type { ReportDetailDTO } from '@astroai/shared-types';
import { env } from '../../config/env';
import { reportApi } from '../../lib/reportApi';

type RouteParams = {
  ReportViewer: { reportId: string };
};

export function ReportViewerScreen() {
  const route = useRoute<RouteProp<RouteParams, 'ReportViewer'>>();
  const reportId = route.params.reportId;

  const [detail, setDetail] = useState<ReportDetailDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [retrying, setRetrying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'compatibility' | 'astrology' | 'ai'>('overview');

  const loadReport = async () => {
    try {
      const data = await reportApi.getReport(reportId);
      setDetail(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to load report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportId]);

  // Auto-polling for queued/processing reports
  useEffect(() => {
    if (!detail) return;
    const isProcessing =
      detail.report.status === ReportStatus.QUEUED ||
      detail.report.status === ReportStatus.CALCULATING ||
      detail.report.status === ReportStatus.INTERPRETING ||
      detail.report.status === ReportStatus.GENERATING_PDF;

    if (!isProcessing) return;

    const interval = setInterval(() => {
      loadReport();
    }, 3000);

    return () => clearInterval(interval);
  }, [detail?.report.status]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await reportApi.retryReport(reportId);
      Alert.alert('Report Requeued', 'Generation has been restarted.');
      await loadReport();
    } catch (err: any) {
      Alert.alert('Retry Failed', err.message || 'Unable to retry report at this time.');
    } finally {
      setRetrying(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!detail?.report.pdfUrl) return;
    const url = detail.report.pdfUrl.startsWith('http')
      ? detail.report.pdfUrl
      : `${env.apiBaseUrl}${detail.report.pdfUrl}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Download Link', url);
      }
    } catch {
      Alert.alert('Download', `PDF available at: ${url}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Fetching report details...</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Report not found.</Text>
      </View>
    );
  }

  const { report, compatibilityScore, astrologyData, sections } = detail;
  const isCompleted = report.status === ReportStatus.COMPLETED;
  const isFailed = report.status === ReportStatus.FAILED;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <Text style={styles.reportTypeTitle}>
            {report.reportType.replace(/_/g, ' ').toUpperCase()}
          </Text>
          <View
            style={[
              styles.statusBadge,
              isCompleted
                ? styles.badgeCompleted
                : isFailed
                ? styles.badgeFailed
                : styles.badgeProcessing,
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {report.status.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.reportDate}>
          Generated on {new Date(report.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
        </Text>

        {/* Processing State Animation */}
        {!isCompleted && !isFailed && (
          <View style={styles.processingBanner}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.processingBannerText}>
              Pipeline active: Calculating celestial charts & AI insights...
            </Text>
          </View>
        )}

        {/* Failure Box */}
        {isFailed && (
          <View style={styles.failureBox}>
            <Text style={styles.failureText}>
              Failed at {report.failureStage || 'unknown'}: {report.failureReason}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, retrying && styles.disabledBtn]}
              onPress={handleRetry}
              disabled={retrying}
            >
              {retrying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.retryBtnText}>Retry Generation</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Download PDF CTA */}
        {isCompleted && report.pdfUrl && (
          <TouchableOpacity style={styles.downloadPdfBtn} onPress={handleDownloadPdf}>
            <Text style={styles.downloadPdfBtnText}>Download PDF Report</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'overview' && styles.activeTabBtn]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>

        {compatibilityScore && (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'compatibility' && styles.activeTabBtn]}
            onPress={() => setActiveTab('compatibility')}
          >
            <Text style={[styles.tabText, activeTab === 'compatibility' && styles.activeTabText]}>
              Compatibility
            </Text>
          </TouchableOpacity>
        )}

        {sections && sections.length > 0 && (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ai' && styles.activeTabBtn]}
            onPress={() => setActiveTab('ai')}
          >
            <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>
              AI Insights
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <View style={styles.tabContent}>
          {compatibilityScore && (
            <View style={styles.scoreSummaryCard}>
              <Text style={styles.scoreSummaryLabel}>Ashtakoota Milan Score</Text>
              <Text style={styles.scoreSummaryValue}>
                {compatibilityScore.totalScore} / 36
              </Text>
              <Text style={styles.scoreSummaryPercent}>
                {compatibilityScore.percentage}% Compatibility Match
              </Text>
            </View>
          )}

          {Boolean(astrologyData && typeof astrologyData === 'object') && (
            <View style={styles.astrologyCard}>
              <Text style={styles.cardSectionTitle}>Natal Chart Highlights</Text>
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Lagna (Ascendant):</Text>
                <Text style={styles.factValue}>
                  {String((astrologyData as any)?.ascendant?.sign || 'Aries')}
                </Text>
              </View>
              {(astrologyData as any)?.moonNakshatra && (
                <View style={styles.factRow}>
                  <Text style={styles.factLabel}>Moon Nakshatra:</Text>
                  <Text style={styles.factValue}>
                    {String((astrologyData as any)?.moonNakshatra?.name || 'Ashwini')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {sections && sections.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.cardSectionTitle}>{sections[0].title}</Text>
              <Text style={styles.sectionBodyText}>{sections[0].content}</Text>
            </View>
          )}
        </View>
      )}

      {/* Tab 2: Compatibility Ashtakoota */}
      {activeTab === 'compatibility' && compatibilityScore && (
        <View style={styles.tabContent}>
          <View style={styles.ashtakootaTable}>
            <Text style={styles.cardSectionTitle}>8 Ashtakoota Categories</Text>
            {compatibilityScore.categories?.map((cat) => (
              <View key={cat.name} style={styles.kootaRow}>
                <View style={styles.kootaLeft}>
                  <Text style={styles.kootaName}>{cat.name}</Text>
                  <Text style={styles.kootaDesc}>{cat.description}</Text>
                </View>
                <Text style={styles.kootaScore}>
                  {cat.score} / {cat.maxScore}
                </Text>
              </View>
            ))}
          </View>

          {(compatibilityScore.mangalDoshaA || compatibilityScore.mangalDoshaB) && (
            <View style={styles.mangalCard}>
              <Text style={styles.mangalTitle}>Mangal Dosha Assessment</Text>
              <Text style={styles.mangalDesc}>
                Mangal Dosha detected in alignment. Planetary remedial poojas recommended.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Tab 3: AI Insights */}
      {activeTab === 'ai' && sections && (
        <View style={styles.tabContent}>
          {sections.map((sec, idx) => (
            <View key={idx} style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionCardTitle}>{sec.title}</Text>
                <Text style={styles.sectionCategoryTag}>{sec.category.toUpperCase()}</Text>
              </View>
              <Text style={styles.sectionBodyText}>{sec.content}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  headerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportTypeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    flex: 1,
    marginRight: 8,
  },
  reportDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeCompleted: {
    backgroundColor: '#064e3b',
  },
  badgeFailed: {
    backgroundColor: '#7f1d1d',
  },
  badgeProcessing: {
    backgroundColor: '#312e81',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e1b4b',
    padding: 10,
    borderRadius: 8,
  },
  processingBannerText: {
    fontSize: 12,
    color: '#a5b4fc',
    flex: 1,
  },
  failureBox: {
    backgroundColor: '#450a0a',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  failureText: {
    fontSize: 12,
    color: '#fca5a5',
  },
  retryBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  downloadPdfBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  downloadPdfBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabBtn: {
    backgroundColor: '#334155',
  },
  tabText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabContent: {
    gap: 14,
  },
  scoreSummaryCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  scoreSummaryLabel: {
    fontSize: 13,
    color: '#a5b4fc',
    fontWeight: '600',
  },
  scoreSummaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  scoreSummaryPercent: {
    fontSize: 13,
    color: '#34d399',
    fontWeight: '700',
    marginTop: 2,
  },
  astrologyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  factLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  factValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  ashtakootaTable: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  kootaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  kootaLeft: {
    flex: 1,
    marginRight: 8,
  },
  kootaName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  kootaDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  kootaScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#a5b4fc',
  },
  mangalCard: {
    backgroundColor: '#451a03',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#78350f',
    gap: 6,
  },
  mangalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
  },
  mangalDesc: {
    fontSize: 12,
    color: '#fde68a',
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  sectionCategoryTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a5b4fc',
    backgroundColor: '#312e81',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionBodyText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 19,
  },
});
