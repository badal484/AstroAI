import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { HomeScreen } from '../screens/HomeScreen';
import { BirthProfileFormScreen } from '../screens/birthProfiles/BirthProfileFormScreen';
import { BirthProfileListScreen } from '../screens/birthProfiles/BirthProfileListScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ConversationListScreen } from '../screens/chat/ConversationListScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { VoiceCallScreen } from '../screens/voice/VoiceCallScreen';
import { ReportCatalogScreen } from '../screens/reports/ReportCatalogScreen';
import { ReportHistoryScreen } from '../screens/reports/ReportHistoryScreen';
import { ReportViewerScreen } from '../screens/reports/ReportViewerScreen';
import { NotificationCenterScreen } from '../screens/notifications/NotificationCenterScreen';
import { NotificationPreferencesScreen } from '../screens/notifications/NotificationPreferencesScreen';
import { ReferralScreen } from '../screens/promotions/ReferralScreen';
import { KundliExplorerScreen } from '../screens/astrology/KundliExplorerScreen';
import { CompatibilityScreen } from '../screens/astrology/CompatibilityScreen';
import { DoshaAnalysisScreen } from '../screens/reports/DoshaAnalysisScreen';
import { PalmScannerScreen } from '../screens/palmistry/PalmScannerScreen';
import { PujaCatalogScreen } from '../screens/puja/PujaCatalogScreen';
import { PujaOrderHistoryScreen } from '../screens/puja/PujaOrderHistoryScreen';
import { DashaTimelineScreen } from '../screens/astrology/DashaTimelineScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { colors } from '../theme';

export type AppStackParamList = {
  Home: undefined;
  BirthProfileList: undefined;
  BirthProfileForm: { profileId?: string };
  ConversationList: undefined;
  Chat: { conversationId: string; title?: string };
  Wallet: undefined;
  VoiceCall: { astrologerId?: string; astrologerName?: string; birthProfileId?: string | null };
  ReportCatalog: { initialType?: string } | undefined;
  ReportHistory: undefined;
  ReportViewer: { reportId: string };
  NotificationCenter: undefined;
  NotificationPreferences: undefined;
  Referral: undefined;
  KundliExplorer: undefined;
  Compatibility: undefined;
  DoshaAnalysis: undefined;
  PalmScanner: undefined;
  PujaCatalog: undefined;
  PujaOrderHistory: undefined;
  DashaTimeline: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

/**
 * Every screen reachable from this navigator is, by construction, only
 * ever mounted while status === 'authenticated' (RootNavigator swaps the
 * whole navigator, not individual screens) — this IS the "protected
 * navigation" requirement: there is no route path from here that doesn't
 * require an authenticated session.
 */
export function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.backgroundElevated },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Home"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BirthProfileList"
        component={BirthProfileListScreen}
        options={{ title: 'Birth profiles' }}
      />
      <Stack.Screen
        name="BirthProfileForm"
        component={BirthProfileFormScreen}
        options={({ route }) => ({
          title: route.params?.profileId
            ? 'Edit birth profile'
            : 'Add birth profile',
        })}
      />
      <Stack.Screen
        name="ConversationList"
        component={ConversationListScreen}
        options={{ title: 'Conversations' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ title: 'Wallet & Credits' }}
      />
      <Stack.Screen
        name="VoiceCall"
        component={VoiceCallScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReportCatalog"
        component={ReportCatalogScreen}
        options={{ title: 'Astrology Reports' }}
      />
      <Stack.Screen
        name="ReportHistory"
        component={ReportHistoryScreen}
        options={{ title: 'Report History' }}
      />
      <Stack.Screen
        name="ReportViewer"
        component={ReportViewerScreen}
        options={{ title: 'Report Details' }}
      />
      <Stack.Screen
        name="NotificationCenter"
        component={NotificationCenterScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{ title: 'Notification Settings' }}
      />
      <Stack.Screen
        name="Referral"
        component={ReferralScreen}
        options={{ title: 'Invite Friends & Rewards' }}
      />
      <Stack.Screen
        name="KundliExplorer"
        component={KundliExplorerScreen}
        options={{ title: 'Kundli Explorer' }}
      />
      <Stack.Screen
        name="Compatibility"
        component={CompatibilityScreen}
        options={{ title: 'Kundli Milan (36 Guna)' }}
      />
      <Stack.Screen
        name="DoshaAnalysis"
        component={DoshaAnalysisScreen}
        options={{ title: 'Vedic Dosha Scanner' }}
      />
      <Stack.Screen
        name="PalmScanner"
        component={PalmScannerScreen}
        options={{ title: 'AI Palmistry Scanner' }}
      />
      <Stack.Screen
        name="PujaCatalog"
        component={PujaCatalogScreen}
        options={{ title: 'Devasthanam Sanctuary' }}
      />
      <Stack.Screen
        name="PujaOrderHistory"
        component={PujaOrderHistoryScreen}
        options={{ title: 'My Sacred Bookings' }}
      />
      <Stack.Screen
        name="DashaTimeline"
        component={DashaTimelineScreen}
        options={{ title: 'Vimshottari Dasha' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings & Profile' }}
      />
    </Stack.Navigator>
  );
}
