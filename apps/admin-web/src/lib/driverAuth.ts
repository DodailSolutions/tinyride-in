/**
 * Driver client-side session utilities.
 * The actual session cookie (tinyride_driver_session) is httpOnly —
 * we can't read it from JS. We store a minimal public profile in
 * sessionStorage for UI purposes only. The backend always re-validates
 * the cookie for every authenticated request.
 */

const DRIVER_PROFILE_KEY = 'tinyride_driver_profile';

export interface DriverProfile {
  name: string | null;
  phone: string;
  driverId: string;
}

export function saveDriverProfile(profile: DriverProfile): void {
  try {
    sessionStorage.setItem(DRIVER_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export function getDriverProfile(): DriverProfile | null {
  try {
    const raw = sessionStorage.getItem(DRIVER_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DriverProfile;
  } catch {
    return null;
  }
}

export function clearDriverProfile(): void {
  try {
    sessionStorage.removeItem(DRIVER_PROFILE_KEY);
  } catch {}
}

/**
 * Calls /api/driver/session to verify the httpOnly cookie is still valid.
 * Returns driver data or null if not authenticated.
 */
export async function verifyDriverSession(): Promise<{
  authenticated: boolean;
  driver?: { id: string; name: string | null; phone: string };
  vehicle?: {
    id: string;
    registrationNumber: string;
    makeModel: string;
    vehicleType: string;
    capacity: number | null;
  } | null;
}> {
  try {
    const res = await fetch('/api/driver/session', { credentials: 'include' });
    if (!res.ok) return { authenticated: false };
    return await res.json();
  } catch {
    return { authenticated: false };
  }
}

/**
 * Clears driver session on the server and local profile.
 */
export async function logoutDriver(): Promise<void> {
  clearDriverProfile();
  try {
    await fetch('/api/auth/driver/logout', { method: 'POST', credentials: 'include' });
  } catch {}
}
