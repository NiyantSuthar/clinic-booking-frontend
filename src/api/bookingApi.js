import { API_BASE_URL } from './config';

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Received an invalid response from the server. Please try again.');
  }
}

export async function getDailyStatus(date, signal) {
  const response = await fetch(`${API_BASE_URL}/bookings/status?date=${date}`, { signal });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data?.error || 'Could not load status for that date.');
  }
  return data;
}

/** Client change #2 - the "when should I arrive" table data. */
export async function getQueueSchedule(date) {
  const response = await fetch(`${API_BASE_URL}/bookings/queue-schedule?date=${date}`);
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data?.error || 'Could not load queue schedule.');
  }
  return data;
}

export async function createBooking(token, beneficiaryId, date) {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ beneficiaryId, date }),
  });
  const data = await parseJsonSafe(response);

  if (!response.ok && !data?.status) {
    const firstMessage = typeof data === 'object' && data ? Object.values(data)[0] : null;
    throw new Error(firstMessage || 'Booking failed.');
  }

  return { httpStatus: response.status, data };
}

export async function getBookingHistory(token) {
  const response = await fetch(`${API_BASE_URL}/bookings/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data?.error || 'Could not load booking history.');
  }
  return data;
}