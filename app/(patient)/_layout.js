import { useContext, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { AuthContext } from '../../src/context/AuthContext';
import { registerForPushNotificationsAsync } from '../../src/notifications/pushNotifications';
import { updatePushToken } from '../../src/api/accountApi';

export default function PatientTabsLayout() {
  const { token } = useContext(AuthContext);

  // Runs once when the patient tabs mount (i.e. right after a successful
  // login). Entirely best-effort: a failure anywhere in this chain is
  // logged and swallowed, never shown to the user or allowed to block
  // navigation - notifications are an enhancement, not a requirement.
  useEffect(() => {
    (async () => {
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        try {
          await updatePushToken(token, pushToken);
        } catch (err) {
          console.log('[Push] Could not save push token to backend:', err.message);
        }
      }
    })();
  }, []);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'booking') iconName = 'calendar-outline';
          else if (route.name === 'history') iconName = 'time-outline';
          else if (route.name === 'profile') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
      })}
    >
      <Tabs.Screen name="booking" options={{ title: 'Booking' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}