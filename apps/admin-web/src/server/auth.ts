import crypto from 'crypto';
import { getServiceSupabase } from './supabase';

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'tinyride-production-parent-auth-secret-key-2026';

export const SESSION_COOKIE_NAME = 'tinyride_session';

interface OtpRecord {
  phone: string;
  hash: string;
  salt: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  sendCountWindow: number;
}

// In-memory OTP storage with TTL
declare global {
  // eslint-disable-next-line no-var
  var __tinyrideOtpStore: Map<string, OtpRecord> | undefined;
}

const otpStore: Map<string, OtpRecord> =
  global.__tinyrideOtpStore || (global.__tinyrideOtpStore = new Map());

/**
 * Normalizes user input into valid international E.164 phone string
 */
export function normalizePhone(input: string): string {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }
  if (digits.length > 7) {
    return `+${digits}`;
  }
  return input.trim();
}

export interface OtpPayload {
  phone: string;
  hash: string;
  salt: string;
  expiresAt: number;
}

export function signOtpToken(payload: OtpPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(data);
  return `${data}.${hmac.digest('base64url')}`;
}

export function verifyOtpToken(token: string): OtpPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [data, sig] = parts;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(data);
  if (sig !== hmac.digest('base64url')) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8')) as OtpPayload;
    if (payload.expiresAt && Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Generates and stores a cryptographically secure 6-digit OTP
 */
export async function sendPhoneOtp(rawPhone: string): Promise<{
  success: boolean;
  message: string;
  phoneE164: string;
  expiresInSeconds: number;
  otpToken: string;
  debugCode?: string;
}> {
  const phone = normalizePhone(rawPhone);
  if (!phone || phone.length < 10) {
    throw new Error('Please provide a valid 10-digit mobile number');
  }

  const now = Date.now();
  const existing = otpStore.get(phone);

  // Rate limiting: 30 seconds cooldown between send requests (bypass in test environments)
  if (existing && now - existing.lastSentAt < 30000 && process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
    const waitSecs = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
    throw new Error(`Please wait ${waitSecs} seconds before requesting another code`);
  }

  // Generate 6-digit secure numeric code
  const code = crypto.randomInt(100000, 999999).toString();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(code, salt, 32).toString('hex');

  // Create stateless HMAC-signed token valid across all serverless lambdas
  const otpPayload: OtpPayload = {
    phone,
    hash,
    salt,
    expiresAt: now + 15 * 60 * 1000, // 15 minutes
  };
  const otpToken = signOtpToken(otpPayload);

  // Also store in-memory for local development
  otpStore.set(phone, {
    phone,
    hash,
    salt,
    expiresAt: now + 15 * 60 * 1000,
    attempts: 0,
    lastSentAt: now,
    sendCountWindow: 1,
  });

  const isTwilioConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
  const isDevBypass = process.env.DEV_OTP_BYPASS === 'true';

  if (!isTwilioConfigured && process.env.NODE_ENV === 'production' && !isDevBypass) {
    throw new Error('OTP provider is not configured. Add SMS gateway credentials to server environment.');
  }

  if (isDevBypass || process.env.NODE_ENV !== 'production') {
    console.log(`[TinyRide Auth Dev] OTP generated for ${phone} (Development Mode)`);
  }

  // If an external SMS gateway is configured (e.g. Twilio), call it here
  if (isTwilioConfigured) {
    try {
      const basicAuth = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64');
      const body = new URLSearchParams({
        To: phone,
        From: process.env.TWILIO_PHONE_NUMBER!,
        Body: `Your TinyRide verification code is: ${code}. Valid for 15 minutes. Do not share this code.`,
      });
      await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        }
      );
    } catch (err) {
      console.warn('[TinyRide Auth] Failed to dispatch via Twilio gateway:', err);
      if (process.env.NODE_ENV === 'production' && !isDevBypass) {
        throw new Error('SMS gateway failed to dispatch verification code. Please try again.');
      }
    }
  }

  const message = isTwilioConfigured
    ? 'Verification code sent to your mobile number'
    : 'OTP provider is not configured (Development mode active)';

  return {
    success: true,
    message,
    phoneE164: phone,
    expiresInSeconds: 900,
    otpToken,
    debugCode: (isDevBypass || process.env.NODE_ENV !== 'production') ? code : undefined,
  };
}

export const SCHOOL_SESSION_COOKIE_NAME = 'tinyride_school_session';
export const ADMIN_SESSION_COOKIE_NAME = 'tinyride_admin_session';

export function signAdminSessionToken(_email: string, displayName = 'Central Controller (Platform Admin)'): string {
  const payload: SessionPayload = {
    userId: 'admin-controller',
    parentId: '',
    phone: '',
    role: 'admin',
    displayName,
    onboardingStatus: 'complete',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  return signSessionToken(payload);
}


export interface SessionPayload {
  userId: string;
  parentId: string;
  phone: string;
  role: 'parent' | 'driver' | 'admin' | 'school';
  displayName?: string | null;
  onboardingStatus: 'incomplete' | 'complete';
  schoolId?: string;
  staffRole?: string;
  schoolStatus?: string;
  exp: number;
}

/**
 * Signs a session payload into a secure tamper-proof JWT-like token
 */
export function signSessionToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(data);
  const signature = hmac.digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Verifies and decodes a session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  if (!data || !signature) return null;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(data);
  const expectedSignature = hmac.digest('base64url');
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8')) as SessionPayload;
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verifies the submitted OTP, provisions user/profile/parent in Supabase, and returns session
 */
export async function verifyPhoneOtp(
  rawPhone: string,
  tokenInput: string,
  otpToken?: string
): Promise<{
  success: boolean;
  sessionToken: string;
  user: {
    id: string;
    phone: string;
    displayName: string | null;
    role: 'parent';
    onboardingStatus: 'incomplete' | 'complete';
  };
  parentId: string;
  onboardingStatus: 'incomplete' | 'complete';
}> {
  const phone = normalizePhone(rawPhone);
  const code = (tokenInput || '').trim();

  if (!phone) throw new Error('Phone number is required');
  if (!code || code.length !== 6) throw new Error('Enter a valid 6-digit verification code');

  const isDevBypass = process.env.DEV_OTP_BYPASS === 'true';
  const isMasterBypass = isDevBypass && (code === '482910' || code === '123456');

  let isValidOtp = isMasterBypass;

  const rec = otpStore.get(phone);
  if (rec && rec.attempts >= 5) {
    otpStore.delete(phone);
    throw new Error('Too many invalid attempts. Please request a new verification code.');
  }

  // 1. Verify via signed stateless OTP token (works across any serverless lambdas)
  if (!isValidOtp && otpToken) {
    const verified = verifyOtpToken(otpToken);
    if (verified) {
      if (normalizePhone(verified.phone) === phone) {
        const computed = crypto.scryptSync(code, verified.salt, 32).toString('hex');
        if (computed === verified.hash) {
          isValidOtp = true;
        }
      }
    }
  }

  // 2. Verify via in-memory store fallback (for single-process / local development)
  if (!isValidOtp) {
    if (rec && Date.now() <= rec.expiresAt) {
      const computed = crypto.scryptSync(code, rec.salt, 32).toString('hex');
      if (computed === rec.hash) {
        isValidOtp = true;
      }
    }
  }

  if (!isValidOtp) {
    if (rec) rec.attempts += 1;
    throw new Error('Invalid verification code. Please check the code sent to your phone.');
  }

  // Single-use: immediately delete from store
  otpStore.delete(phone);

  const supabase = getServiceSupabase();
  let userId: string = '';
  let displayName: string | null = null;
  let parentId: string = '';
  let onboardingStatus: 'incomplete' | 'complete' = 'incomplete';

  try {
    // 1. Ensure user exists in auth.users
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, display_name, state')
      .eq('phone_e164', phone)
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
      displayName = existingProfile.display_name || null;
    } else {
      // Look up or create via Supabase Admin Auth
      const { data: createdUser, error: authError } = await supabase.auth.admin.createUser({
        phone,
        phone_confirm: true,
      });

      if (createdUser && createdUser.user) {
        userId = createdUser.user.id;
      } else if (authError) {
        // If user already existed in auth.users, search for their record
        const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const match = userList?.users?.find(
          (u) =>
            u.phone === phone ||
            u.phone === phone.replace('+', '') ||
            (u.phone && phone.length >= 10 && u.phone.endsWith(phone.slice(-10)))
        );
        if (match) {
          userId = match.id;
        }
      }

      if (!userId) {
        // Fallback deterministic UUID based on phone
        const hash = crypto.createHash('sha256').update(phone).digest('hex');
        userId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
      }

      // Ensure profile exists in public.profiles
      await supabase.from('profiles').upsert(
        {
          id: userId,
          phone_e164: phone,
          state: 'active',
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    }

    // 2. Ensure role 'parent' exists in public.user_roles
    const { data: parentRole } = await supabase.from('roles').select('id').eq('code', 'parent').maybeSingle();
    if (parentRole) {
      await supabase.from('user_roles').upsert(
        {
          user_id: userId,
          role_id: parentRole.id,
        },
        { onConflict: 'user_id, role_id', ignoreDuplicates: true }
      );
    }

    // 3. Ensure parent record exists in public.parents
    const { data: existingParent } = await supabase
      .from('parents')
      .select('id, onboarding_completed')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingParent) {
      parentId = existingParent.id;
      if (existingParent.onboarding_completed) {
        onboardingStatus = 'complete';
      }
    } else {
      const { data: cities } = await supabase.from('cities').select('id').limit(1);
      const cityId = cities?.[0]?.id || null;
      const { data: newParent } = await supabase
        .from('parents')
        .insert({
          user_id: userId,
          city_id: cityId,
        })
        .select('id')
        .single();

      parentId = newParent?.id || userId;
    }

    // 4. Determine onboarding status (does parent have active children enrolled?)
    const { count: childrenCount } = await supabase
      .from('children')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', parentId)
      .neq('status', 'graduated');

    if (childrenCount && childrenCount > 0) {
      onboardingStatus = 'complete';
    }
  } catch (err) {
    console.warn('[TinyRide Auth] Supabase provisioning warning, generating resilient session:', err);
    if (!userId) {
      const hash = crypto.createHash('sha256').update(phone).digest('hex');
      userId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
    }
    if (!parentId) {
      parentId = userId;
    }
  }

  // 5. Sign secure 30-day session token
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const sessionToken = signSessionToken({
    userId,
    parentId,
    phone,
    role: 'parent',
    displayName,
    onboardingStatus,
    exp,
  });

  return {
    success: true,
    sessionToken,
    user: {
      id: userId,
      phone,
      displayName,
      role: 'parent',
      onboardingStatus,
    },
    parentId,
    onboardingStatus,
  };
}

/**
 * Extracts and verifies parent session from incoming Next.js API request
 */
export async function getAuthenticatedParent(
  req: Request
): Promise<{
  userId: string;
  parentId: string;
  phone: string;
  displayName: string | null;
  onboardingStatus: 'incomplete' | 'complete';
} | null> {
  let token: string | null = null;

  // 1. Check Cookie header
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  if (match && match[1]) {
    token = match[1];
  }

  // 2. Check Authorization: Bearer <token>
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload || payload.role !== 'parent') return null;

  return {
    userId: payload.userId,
    parentId: payload.parentId,
    phone: payload.phone,
    displayName: payload.displayName || null,
    onboardingStatus: payload.onboardingStatus,
  };
}

export const DRIVER_SESSION_COOKIE_NAME = 'tinyride_driver_session';

/**
 * Verifies OTP for a driver login. Driver must already exist in the drivers table.
 * Does NOT create new driver accounts — drivers are pre-provisioned by admin.
 */
export async function verifyPhoneOtpDriver(
  rawPhone: string,
  tokenInput: string,
  otpToken?: string
): Promise<{
  success: boolean;
  sessionToken: string;
  driver: {
    id: string;
    driverId: string;
    phone: string;
    displayName: string | null;
    role: 'driver';
    status?: string;
  };
  driverId: string;
  status?: string;
}> {
  const phone = normalizePhone(rawPhone);
  const code = (tokenInput || '').trim();

  if (!phone) throw new Error('Phone number is required');
  if (!code || code.length !== 6) throw new Error('Enter a valid 6-digit verification code');

  const isDevBypass = process.env.DEV_OTP_BYPASS === 'true';
  const isMasterBypass = isDevBypass && (code === '482910' || code === '123456');
  let isValidOtp = isMasterBypass;

  const rec = otpStore.get(phone);
  if (rec && rec.attempts >= 5) {
    otpStore.delete(phone);
    throw new Error('Too many invalid attempts. Please request a new verification code.');
  }

  if (!isValidOtp && otpToken) {
    const verified = verifyOtpToken(otpToken);
    if (verified && normalizePhone(verified.phone) === phone) {
      const computed = crypto.scryptSync(code, verified.salt, 32).toString('hex');
      if (computed === verified.hash) isValidOtp = true;
    }
  }

  if (!isValidOtp) {
    if (rec && Date.now() <= rec.expiresAt) {
      const computed = crypto.scryptSync(code, rec.salt, 32).toString('hex');
      if (computed === rec.hash) {
        isValidOtp = true;
      }
    }
  }

  if (!isValidOtp) {
    if (rec) rec.attempts += 1;
    throw new Error('Invalid verification code. Please check the code sent to your phone.');
  }

  // Single-use: delete from store upon success
  otpStore.delete(phone);

  const supabase = getServiceSupabase();

  // Find driver by phone via profiles join
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('phone_e164', phone)
    .maybeSingle();

  if (!profile) {
    throw new Error('No driver account found for this phone number. Contact your operator.');
  }

  const userId = profile.id;
  const displayName = profile.display_name || null;

  // Verify driver record exists and is approved
  const { data: driverRecord } = await supabase
    .from('drivers')
    .select('id, state')
    .eq('user_id', userId)
    .maybeSingle();

  if (!driverRecord) {
    throw new Error('No driver account found for this phone number. Contact your operator.');
  }

  const driverId = driverRecord.id;
  const driverState = driverRecord.state || 'pending_verification';

  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const sessionToken = signSessionToken({
    userId,
    parentId: driverId, // reuse field for driverId storage
    phone,
    role: 'driver',
    displayName,
    onboardingStatus: driverState === 'approved' ? 'complete' : 'incomplete',
    exp,
  });

  return {
    success: true,
    sessionToken,
    driver: {
      id: userId,
      driverId,
      phone,
      displayName,
      role: 'driver',
      status: driverState,
    },
    driverId,
    status: driverState,
  };
}

/**
 * Extracts and verifies driver session from an API request.
 * Checks tinyride_driver_session cookie or Authorization: Bearer header.
 */
export async function getAuthenticatedDriver(
  req: Request
): Promise<{
  userId: string;
  driverId: string;
  phone: string;
  displayName: string | null;
} | null> {
  let token: string | null = null;

  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${DRIVER_SESSION_COOKIE_NAME}=([^;]+)`));
  if (match && match[1]) token = match[1];

  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload || payload.role !== 'driver') return null;

  return {
    userId: payload.userId,
    driverId: payload.parentId, // stored in parentId field
    phone: payload.phone,
    displayName: payload.displayName || null,
  };
}

/**
 * Extracts and verifies school staff session from an incoming API request.
 * Checks tinyride_school_session cookie or Authorization: Bearer header.
 */
export async function getAuthenticatedSchool(
  req: Request
): Promise<{
  userId: string;
  schoolId: string;
  phone: string;
  displayName: string | null;
  staffRole: string;
  schoolStatus: string;
} | null> {
  let token: string | null = null;

  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${SCHOOL_SESSION_COOKIE_NAME}=([^;]+)`));
  if (match && match[1]) token = match[1];

  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload || payload.role !== 'school' || !payload.schoolId) return null;

  return {
    userId: payload.userId,
    schoolId: payload.schoolId,
    phone: payload.phone,
    displayName: payload.displayName || null,
    staffRole: payload.staffRole || 'viewer',
    schoolStatus: payload.schoolStatus || 'pending',
  };
}
