import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { API_BASE_URL } from "./config";

export async function getTodayBookings(token) {
  const response = await fetch(`${API_BASE_URL}/admin/today`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Could not load today's list.");
  }

  return data;
}

export async function createWalkInBooking(token, name, phoneNumber) {
  const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, phoneNumber }),
  });

  const data = await response.json();

  if (!response.ok && !data?.status) {
    const firstMessage =
      typeof data === "object" ? Object.values(data)[0] : null;

    throw new Error(firstMessage || "Booking failed.");
  }

  return {
    httpStatus: response.status,
    data,
  };
}

/**
 * Downloads a fresh PDF from the backend and opens
 * the native share/save sheet.
 */
export async function downloadTodayPdf(token) {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Create a reference to the destination file
    const destination = new File(
      Paths.document,
      `todays-patients-${today}.pdf`,
    );

    // Download using the NEW Expo FileSystem API
    const result = await File.downloadFileAsync(
      `${API_BASE_URL}/admin/today/pdf`,
      destination,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        idempotent: true,
      },
    );

    console.log("PDF downloaded:", result.uri);
    console.log("File exists:", result.exists);

    const canShare = await Sharing.isAvailableAsync();

    if (canShare) {
      await Sharing.shareAsync(result.uri, {
        mimeType: "application/pdf",
        dialogTitle: "Today's Patient List",
      });
    }

    return result.uri;
  } catch (error) {
    console.error("========== PDF DOWNLOAD ERROR ==========");
    console.error(error);
    console.error("========================================");

    throw new Error(
      error?.message || "Could not download the patient list PDF.",
    );
  }
}
