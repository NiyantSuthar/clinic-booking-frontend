import { API_BASE_URL } from "./config";

export async function login(phoneNumber, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber, password: password || undefined }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Login failed");
  }
  return data; // { requiresOtp, requiresPassword, message, token, role }
}

export async function forgotPassword(phoneNumber) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Could not send OTP");
  }
}

export async function verifyOtpAndSetPassword(
  phoneNumber,
  otpCode,
  newPassword,
  confirmPassword,
) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumber,
      otpCode,
      newPassword,
      confirmPassword,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    const firstMessage =
      typeof data === "object" && data ? Object.values(data)[0] : null;
    throw new Error(firstMessage || "Verification failed");
  }
  return data; // { token, accountId, phoneNumber }
}
