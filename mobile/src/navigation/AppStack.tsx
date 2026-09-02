import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';

export type AppStackParamList = {
  Home: undefined;
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
    </Stack.Navigator>
  );
}
