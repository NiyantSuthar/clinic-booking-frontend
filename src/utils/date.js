function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIsoDate() {
  return toIsoDate(new Date());
}

/**
 * Next 7 days (today through 6 days ahead) - matches the backend's
 * bookable window in BookingService.bookSlot(). isSunday drives the
 * UI's visual disabling here, but the backend independently rejects
 * Sunday bookings too - this is a UX convenience, not the source of truth.
 */
export function getBookableDates() {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    dates.push({
      iso: toIsoDate(d),
      dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: d.getDate(),
      isSunday: d.getDay() === 0,
      isToday: i === 0,
    });
  }
  return dates;
}
