import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Controls how a notification behaves while the app is open/foregrounded.
 * Without this, foreground notifications are silently suppressed by default.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests permission and returns an Expo push token, or null if
 * unavailable. Returning null is EXPECTED right now in Expo Go (Expo Go
 * dropped support for remote push tokens on Android in recent SDKs) -
 * this only returns a real token once running from a development build.
 * Never throws - a missing push token should never block login or booking.
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    // Required on Android 8+ for notifications to actually display with
    // sound/visibility - harmless to call even before permission is granted.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  if (!Device.isDevice) {
    console.log('[Push] Simulators/emulators cannot receive push notifications - skipping.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('[Push] Notification permission was not granted.');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    // Expected until `eas init` has been run once for this project -
    // see the Day 8 EAS Build session notes for when to do this.
    console.log('[Push] No EAS projectId configured yet - skipping remote token registration.');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (err) {
    // Expected in Expo Go on current SDKs - remote push tokens require a
    // development build. Logged, not thrown, so this never breaks the app.
    console.log('[Push] Could not get a push token (expected in Expo Go):', err.message);
    return null;
  }
}

/**
 * Fires an immediate, LOCAL, on-device notification - this is NOT the
 * real server-triggered push, but it IS testable right now in Expo Go,
 * since only remote push was affected by Expo Go's SDK changes. Used as
 * a visible stand-in confirmation while the real pipeline (built this
 * same session) waits on a development build to be fully testable.
 */
export async function fireLocalBookingConfirmation(queueNumber, arrivalWindowText) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Booking Confirmed',
        body: `You're #${queueNumber}. Arrive between ${arrivalWindowText}.`,
        sound: true,
      },
      trigger: null, // null = fire immediately
    });
  } catch (err) {
    console.log('[Push] Could not fire local notification:', err.message);
  }
}