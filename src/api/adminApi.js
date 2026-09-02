import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { API_BASE_URL } from "./config";

export async function getTodayBookings(token) {
  const response = await fetch(`${API_BASE_URL}/admin/today`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Could not load today's list.");
  }
  return data;
}

export async function createWalkInBooking(token, name, phoneNumber, village) {
  const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, phoneNumber, village }),
  });
  const data = await response.json();

  if (!response.ok && !data?.status) {
    const firstMessage =
      typeof data === "object" ? Object.values(data)[0] : null;
    throw new Error(firstMessage || "Booking failed.");
  }

  return { httpStatus: response.status, data };
}

export async function downloadTodayPdf(token) {
  const response = await fetch(`${API_BASE_URL}/admin/today/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(
      `Could not download PDF (status ${response.status}). Make sure you're still logged in as admin.`,
    );
  }

  const blob = await response.blob();
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const today = new Date().toISOString().slice(0, 10);
  const fileUri = `${FileSystem.documentDirectory}todays-patients-${today}.pdf`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/pdf",
      dialogTitle: "Today's Patient List",
    });
  }

  return fileUri;
}

/** New - holiday management, all require admin auth. */
export async function getHolidays(token) {
  const response = await fetch(`${API_BASE_URL}/admin/holidays`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Could not load holidays.");
  }
  return data; // [{ id, date, reason }]
}

export async function addHoliday(token, date, reason) {
  const response = await fetch(`${API_BASE_URL}/admin/holidays`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ date, reason: reason || null }),
  });
  const data = await response.json();
  if (!response.ok) {
    const firstMessage =
      typeof data === "object" ? Object.values(data)[0] : null;
    throw new Error(firstMessage || data?.error || "Could not add holiday.");
  }
  return data;
}

export async function removeHoliday(token, id) {
  const response = await fetch(`${API_BASE_URL}/admin/holidays/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Could not remove holiday.");
  }
}
