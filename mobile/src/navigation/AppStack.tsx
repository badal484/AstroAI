import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { BirthProfileFormScreen } from '../screens/birthProfiles/BirthProfileFormScreen';
import { BirthProfileListScreen } from '../screens/birthProfiles/BirthProfileListScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ConversationListScreen } from '../screens/chat/ConversationListScreen';

export type AppStackParamList = {
  Home: undefined;
  BirthProfileList: undefined;
  BirthProfileForm: { profileId?: string };
  ConversationList: undefined;
  Chat: { conversationId: string; title?: string };
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
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'AstroAI' }}
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
        options={{ title: 'Chats' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.title ?? 'Chat' })}
      />
    </Stack.Navigator>
  );
}
