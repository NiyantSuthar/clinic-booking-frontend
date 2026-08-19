import { todayIsoDate } from './date';

/**
 * The backend's BookingHistoryItemResponse has no status field - it's
 * purely derived here from comparing the booking's date to today, since
 * "Upcoming / Today / Completed" is a display concern, not something
 * that needs to be stored or computed server-side. String comparison
 * works correctly here because both sides are 'YYYY-MM-DD' - that
 * format sorts identically as strings or as actual dates.
 */
export function getBookingStatus(bookingDateIso) {
  const today = todayIsoDate();
  if (bookingDateIso === today) return 'TODAY';
  if (bookingDateIso > today) return 'UPCOMING';
  return 'COMPLETED';
}

export const STATUS_LABELS = {
  TODAY: 'Today',
  UPCOMING: 'Upcoming',
  COMPLETED: 'Completed',
};