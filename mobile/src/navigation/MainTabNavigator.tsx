import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { ConversationListScreen } from '../screens/chat/ConversationListScreen';
import { KundliExplorerScreen } from '../screens/astrology/KundliExplorerScreen';
import { ReportCatalogScreen } from '../screens/reports/ReportCatalogScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { colors, radius } from '../theme';
import { AstroIcon, type AstroIconName } from '../components/ui/AstroIcon';

export type MainTabParamList = {
  HomeTab: undefined;
  ConsultTab: undefined;
  KundliTab: undefined;
  ReportsTab: undefined;
  WalletTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabIconProps {
  focused: boolean;
  name: string;
  iconName: AstroIconName;
}

function TabIcon({ focused, name, iconName }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <View
        style={[
          styles.glyphWrapper,
          focused && styles.glyphWrapperFocused,
        ]}
      >
        <AstroIcon
          name={iconName}
          size={20}
          color={focused ? colors.primary : colors.textMuted}
          focused={focused}
        />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]} numberOfLines={1}>
        {name}
      </Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: Platform.OS === 'ios' ? 64 + insets.bottom : 64,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          },
        ],
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="Home" iconName="home" />
          ),
        }}
      />
      <Tab.Screen
        name="ConsultTab"
        component={ConversationListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="Consult" iconName="consult" />
          ),
        }}
      />
      <Tab.Screen
        name="KundliTab"
        component={KundliExplorerScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="Kundli" iconName="kundli" />
          ),
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportCatalogScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="Reports" iconName="report" />
          ),
        }}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="Wallet" iconName="wallet" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
    position: 'relative',
  },
  glyphWrapper: {
    width: 32,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  glyphWrapperFocused: {
    backgroundColor: colors.goldMuted,
    transform: [{ scale: 1.05 }],
  },
  glyphText: {
    fontSize: 18,
    opacity: 0.55,
  },
  glyphTextFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  tabLabelFocused: {
    color: colors.textGold,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
    marginTop: 2,
  },
});
