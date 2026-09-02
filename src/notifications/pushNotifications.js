import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * UPDATED: shouldShowAlert is deprecated in newer expo-notifications
 * versions - replaced with shouldShowBanner (the pop-up banner) and
 * shouldShowList (whether it appears in the notification shade/history).
 * Both true = same visible behavior as before, just using the current API.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  if (!Device.isDevice) {
    console.log(
      "[Push] Simulators/emulators cannot receive push notifications - skipping.",
    );
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.log("[Push] Notification permission was not granted.");
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.log(
      "[Push] No EAS projectId configured yet - skipping remote token registration.",
    );
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (err) {
    console.log("[Push] Could not get a push token:", err.message);
    return null;
  }
}

export async function fireLocalBookingConfirmation(
  queueNumber,
  arrivalWindowText,
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Booking Confirmed",
        body: `You're #${queueNumber}. Arrive between ${arrivalWindowText}.`,
        sound: true,
      },
      trigger: null,
    });
  } catch (err) {
    console.log("[Push] Could not fire local notification:", err.message);
  }
}
