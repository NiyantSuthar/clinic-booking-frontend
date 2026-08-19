/**
 * Formats a 'YYYY-MM-DD' string into something readable, e.g. '10 Aug 2026'.
 * Parses the parts manually rather than `new Date(isoString)` directly -
 * that constructor treats a bare 'YYYY-MM-DD' as UTC midnight, which can
 * silently roll over to the previous day when displayed in a timezone
 * behind UTC (not an issue for IST, but a common trap worth avoiding).
 */
export function formatDisplayDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}