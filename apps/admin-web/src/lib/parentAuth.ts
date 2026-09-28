export interface ParentUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'parent';
  onboardingStatus: 'incomplete' | 'complete';
  createdAt: string;
}

export interface ParentChild {
  id: string;
  name: string;
  grade: string;
  age?: number;
  schoolName: string;
  schoolBranch: string;
  pickupLocation: string;
  pickupTime: string;
  dropTime: string;
  safeKey: string;
  medicalNotes?: string;
  vehicleNumber: string;
  vehicleModel: string;
  driverName: string;
  driverPhone: string;
}

export interface ParentSession {
  token: string;
  user: ParentUser;
  children: ParentChild[];
  activeChildId: string;
}

const STORAGE_KEY = 'tinyride_parent_session';
const PENDING_SIGNUP_KEY = 'tinyride_parent_pending_auth';

export const DEFAULT_DEMO_CHILD: ParentChild = {
  id: 'c-1',
  name: 'Aarav Sharma',
  grade: 'Grade 3A',
  age: 8,
  schoolName: 'Olive Mount',
  schoolBranch: 'Gachibowli, Hyderabad',
  pickupLocation: 'Gate 2, Rainbow Vistas, Hitec City',
  pickupTime: '8:35 AM',
  dropTime: '3:30 PM',
  safeKey: '482-910',
  medicalNotes: 'Mild dust allergy. Inhaler kept in outer backpack pouch.',
  vehicleNumber: 'TS09-TR-102',
  vehicleModel: 'Force Traveller 18-Seater',
  driverName: 'Ravi Kumar',
  driverPhone: '+91 98765 43210',
};

/**
 * Retrieve current active parent session
 */
export function getParentSession(): ParentSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ParentSession;
  } catch {
    return null;
  }
}

/**
 * Save / update active parent session
 */
export function saveParentSession(session: ParentSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    // Also set lightweight cookie so server middleware or hydration can read if needed
    document.cookie = `tinyride_parent_auth=true; path=/; max-age=2592000; SameSite=Lax`;
  } catch (err) {
    console.warn('Failed to save parent session:', err);
  }
}

/**
 * Remove parent session on logout
 */
export function clearParentSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PENDING_SIGNUP_KEY);
    document.cookie = `tinyride_parent_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  } catch (err) {
    console.warn('Failed to clear parent session:', err);
  }
}

/**
 * Check if current user is an authenticated parent
 */
export function isAuthenticatedParent(): boolean {
  const session = getParentSession();
  return Boolean(session?.token && session?.user?.role === 'parent');
}

/**
 * Store pending signup/login inputs before OTP verification
 */
export function setPendingAuth(data: { name?: string; phone: string; email?: string; mode: 'signup' | 'login' }): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = JSON.stringify(data);
    sessionStorage.setItem(PENDING_SIGNUP_KEY, payload);
    localStorage.setItem(PENDING_SIGNUP_KEY, payload);
  } catch (err) {
    console.warn('Failed to store pending auth:', err);
  }
}

/**
 * Get pending signup/login inputs for OTP verification
 */
export function getPendingAuth(): { name?: string; phone: string; email?: string; mode: 'signup' | 'login' } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PENDING_SIGNUP_KEY) || localStorage.getItem(PENDING_SIGNUP_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Log in an existing or demo parent user with completed profile, routing to parent app
 */
export function createOrResumeParentLoginSession(phone: string): ParentSession {
  const existing = getParentSession();
  if (existing && existing.token && existing.user) {
    const updated: ParentSession = {
      ...existing,
      token: existing.token || `tr-parent-${Date.now()}`,
      user: {
        ...existing.user,
        phone: phone || existing.user.phone,
        onboardingStatus: 'complete',
      },
    };
    saveParentSession(updated);
    return updated;
  }

  // Create active completed session for logging-in parent
  const session: ParentSession = {
    token: `tr-parent-${Date.now()}`,
    user: {
      id: `usr-${Date.now()}`,
      name: 'Radhika Sharma',
      phone: phone || '+91 98765 43210',
      email: 'radhika.sharma@example.com',
      role: 'parent',
      onboardingStatus: 'complete',
      createdAt: new Date().toISOString(),
    },
    children: [DEFAULT_DEMO_CHILD],
    activeChildId: DEFAULT_DEMO_CHILD.id,
  };
  saveParentSession(session);
  return session;
}

/**
 * Create a fresh pending signup session that will proceed to onboarding
 */
export function createPendingSignupSession(phone: string): ParentSession {
  const existing = getParentSession();
  const session: ParentSession = {
    token: `tr-parent-${Date.now()}`,
    user: {
      id: `usr-${Date.now()}`,
      name: existing?.user?.name || '',
      phone: phone || '+91 98765 43210',
      email: existing?.user?.email || '',
      role: 'parent',
      onboardingStatus: 'incomplete',
      createdAt: new Date().toISOString(),
    },
    children: existing?.children?.length ? existing.children : [DEFAULT_DEMO_CHILD],
    activeChildId: existing?.activeChildId || DEFAULT_DEMO_CHILD.id,
  };
  saveParentSession(session);
  return session;
}

/**
 * Complete onboarding and mark user profile complete
 */
export function completeOnboarding(
  childData: Omit<ParentChild, 'id' | 'safeKey' | 'vehicleNumber' | 'vehicleModel' | 'driverName' | 'driverPhone'>,
  parentData?: { name?: string; email?: string }
): ParentSession | null {
  const current = getParentSession();
  if (!current) return null;

  const newChild: ParentChild = {
    id: `c-${Date.now()}`,
    name: childData.name,
    grade: childData.grade,
    age: childData.age,
    schoolName: childData.schoolName,
    schoolBranch: childData.schoolBranch,
    pickupLocation: childData.pickupLocation,
    pickupTime: childData.pickupTime || '07:35 AM',
    dropTime: childData.dropTime || '02:45 PM',
    safeKey: `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`,
    medicalNotes: childData.medicalNotes,
    vehicleNumber: 'TS09-TR-102',
    vehicleModel: 'Force Traveller 18-Seater',
    driverName: 'Ravi Kumar',
    driverPhone: '+91 98765 43210',
  };

  const updatedSession: ParentSession = {
    ...current,
    user: {
      ...current.user,
      name: parentData?.name || current.user.name,
      email: parentData?.email || current.user.email,
      onboardingStatus: 'complete',
    },
    children: [newChild, ...(current.children || [])],
    activeChildId: newChild.id,
  };

  saveParentSession(updatedSession);
  return updatedSession;
}
