/**
 * School client-side session utilities.
 * The actual session cookie (tinyride_school_session) is httpOnly.
 * We store a minimal public profile in sessionStorage for UI state.
 * The backend re-validates the cookie for every authenticated request.
 */

const SCHOOL_PROFILE_KEY = 'tinyride_school_profile';

export interface SchoolProfile {
  userId: string;
  schoolId: string;
  schoolName: string;
  adminName: string | null;
  phone: string;
  staffRole: string;
  verificationStatus: string;
}

export function saveSchoolProfile(profile: SchoolProfile): void {
  try {
    sessionStorage.setItem(SCHOOL_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export function getSchoolProfile(): SchoolProfile | null {
  try {
    const raw = sessionStorage.getItem(SCHOOL_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SchoolProfile;
  } catch {
    return null;
  }
}

export function isApprovedSchool(): boolean {
  const profile = getSchoolProfile();
  return profile?.verificationStatus === 'verified';
}

export function clearSchoolProfile(): void {
  try {
    sessionStorage.removeItem(SCHOOL_PROFILE_KEY);
  } catch {}
}

export async function verifySchoolSession(): Promise<{
  authenticated: boolean;
  user?: { id: string; name: string | null; phone: string; staffRole: string };
  school?: {
    id: string;
    name: string;
    verificationStatus: string;
    city?: string;
  } | null;
}> {
  try {
    const res = await fetch('/api/school/session');
    if (!res.ok) return { authenticated: false };
    return await res.json();
  } catch {
    return { authenticated: false };
  }
}
