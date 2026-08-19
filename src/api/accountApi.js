import { API_BASE_URL } from "./config";

export async function getProfile(token) {
  const response = await fetch(`${API_BASE_URL}/account/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Could not load profile.");
  }
  return data;
}

export async function updateProfile(token, { name, village }) {
  const response = await fetch(`${API_BASE_URL}/account/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, village }),
  });
  const data = await response.json();
  if (!response.ok) {
    const firstMessage =
      typeof data === "object" ? Object.values(data)[0] : null;
    throw new Error(firstMessage || data?.error || "Could not update profile.");
  }
  return data;
}

export async function updatePushToken(token, expoPushToken) {
  const response = await fetch(`${API_BASE_URL}/account/push-token`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ expoPushToken }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Could not save push token.");
  }
}
