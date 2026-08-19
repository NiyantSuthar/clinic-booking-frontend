/**
 * Single source of truth for the app's color palette. Every screen
 * imports from here instead of hardcoding hex values - changing the
 * clinic's brand color later means editing this one file, not hunting
 * through every screen.
 *
 * primary/primaryDark are currently the blue already used throughout
 * the app (#2563eb) - swap these once real brand colors are decided
 * from the logo. secondary is a placeholder teal, not yet used anywhere
 * yet but here so it's ready when needed (e.g. a secondary button style).
 */
export const colors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  secondary: '#0d9488',

  background: '#ffffff',
  surfaceMuted: '#f3f4f6',

  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textDisabled: '#9ca3af',

  border: '#d1d5db',
  borderError: '#dc2626',

  error: '#dc2626',
  success: '#16a34a',
};