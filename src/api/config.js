// ---------------------------------------------------------------------------
// Flip this one flag to switch between your local backend (for active
// development, e.g. testing brand-new endpoints before they're deployed)
// and the real hosted backend on Render (for testing the actual live app,
// or when your PC's backend isn't running).
//
// USE_LOCAL_BACKEND = true  -> uses your PC's LAN IP (must have
//   ClinicBookingApplication running locally, Postgres running, and your
//   phone on the same Wi-Fi network as your PC)
// USE_LOCAL_BACKEND = false -> uses the real Render URL (works from
//   anywhere, on any network - phone doesn't need to be near your PC at all)
// ---------------------------------------------------------------------------
const USE_LOCAL_BACKEND = false;

// Update this if your LAN IP changes (e.g. after reconnecting to Wi-Fi,
// or a new DHCP lease) - same as before, find it via `ipconfig` on
// Windows, look for "IPv4 Address" under "Wireless LAN adapter Wi-Fi".
const LOCAL_URL = "http://192.168.1.11:8080";

// Your real, permanently-live backend on Render.
const PRODUCTION_URL = "https://clinic-booking-app-fnkk.onrender.com";

export const API_BASE_URL = USE_LOCAL_BACKEND ? LOCAL_URL : PRODUCTION_URL;
