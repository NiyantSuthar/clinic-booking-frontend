import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import AuthGate from '../src/navigation/AuthGate';

/**
 * Expo Router's root layout - this replaces App.js + NavigationContainer
 * from the manual-navigation approach. Stack with no explicit
 * Stack.Screen children is intentional: Expo Router auto-generates
 * screens from whatever files exist under app/, this just sets shared
 * options (no header) for all of them.
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGate>
    </AuthProvider>
  );
}