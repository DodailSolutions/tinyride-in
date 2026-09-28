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

/**
 * Generates and stores a cryptographically secure 6-digit OTP
 */
export async function sendPhoneOtp(rawPhone: string): Promise<{
  success: boolean;
  message: string;
  phoneE164: string;
  expiresInSeconds: number;
  debugCode?: string;
}> {
  const phone = normalizePhone(rawPhone);
  if (!phone || phone.length < 10) {
    throw new Error('Please provide a valid 10-digit mobile number');
  }

  const now = Date.now();
  const existing = otpStore.get(phone);

  // Rate limiting: 30 seconds cooldown between send requests
  if (existing && now - existing.lastSentAt < 30000) {
    const waitSecs = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
    throw new Error(`Please wait ${waitSecs} seconds before requesting another code`);
  }

  // Rate limiting: maximum 6 sends per rolling 1 hour
  if (existing && existing.sendCountWindow >= 6 && now - existing.lastSentAt < 3600000) {
    throw new Error('Too many OTP attempts. Please wait an hour before requesting again');
  }

  // Generate 6-digit secure numeric code
  const code = crypto.randomInt(100000, 999999).toString();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(code, salt, 32).toString('hex');

  const sendCount = existing && now - existing.lastSentAt < 3600000 ? existing.sendCountWindow + 1 : 1;

  otpStore.set(phone, {
    phone,
    hash,
    salt,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes
    attempts: 0,
    lastSentAt: now,
    sendCountWindow: sendCount,
  });

  console.log(`[TinyRide Auth] SMS OTP dispatched for ${phone}: ${code} (Valid for 5 mins)`);

  // If an external SMS gateway is configured (e.g. Twilio / Fast2SMS), call it here
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const basicAuth = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64');
      const body = new URLSearchParams({
        To: phone,
        From: process.env.TWILIO_PHONE_NUMBER,
        Body: `Your TinyRide verification code is: ${code}. Valid for 5 minutes. Do not share this code.`,
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
    }
  }

  return {
    success: true,
    message: 'Verification code sent to your mobile number',
    phoneE164: phone,
    expiresInSeconds: 300,
    // Provide debugCode for testability in non-production or test runs
    debugCode: process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_OTP === 'true' ? code : undefined,
  };
}

export interface SessionPayload {
  userId: string;
  parentId: string;
  phone: string;
  role: 'parent' | 'driver' | 'admin';
  displayName?: string | null;
  onboardingStatus: 'incomplete' | 'complete';
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
  tokenInput: string
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

  const rec = otpStore.get(phone);
  if (!rec) {
    throw new Error('No active verification code found for this number. Please request a new code');
  }

  if (Date.now() > rec.expiresAt) {
    otpStore.delete(phone);
    throw new Error('Verification code has expired. Please request a new code');
  }

  if (rec.attempts >= 3) {
    otpStore.delete(phone);
    throw new Error('Maximum verification attempts exceeded. Please request a new code');
  }

  // Verify hash
  const computed = crypto.scryptSync(code, rec.salt, 32).toString('hex');
  if (computed !== rec.hash) {
    rec.attempts += 1;
    throw new Error('Incorrect verification code. Please check and try again');
  }

  // Token valid! Clear OTP
  otpStore.delete(phone);

  const supabase = getServiceSupabase();

  // 1. Ensure user exists in auth.users
  let userId: string;
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, display_name, state')
    .eq('phone_e164', phone)
    .maybeSingle();

  if (existingProfile) {
    userId = existingProfile.id;
  } else {
    // Look up or create via Supabase Admin Auth
    const { data: createdUser, error: authError } = await supabase.auth.admin.createUser({
      phone,
      phone_confirm: true,
    });

    if (authError && !authError.message.includes('already exists')) {
      console.error('[TinyRide Auth] Failed to create auth user:', authError);
      throw new Error(`Authentication provisioning error: ${authError.message}`);
    }

    if (createdUser && createdUser.user) {
      userId = createdUser.user.id;
    } else {
      // If user existed in auth.users, find their ID
      const { data: userList } = await supabase.auth.admin.listUsers();
      const match = userList?.users?.find(
        (u) => u.phone === phone || u.phone === phone.replace('+', '')
      );
      if (!match) {
        throw new Error('Failed to resolve authenticated user identity');
      }
      userId = match.id;
    }

    // 2. Ensure profile exists in public.profiles
    const { error: profileErr } = await supabase.from('profiles').upsert(
      {
        id: userId,
        phone_e164: phone,
        state: 'active',
      },
      { onConflict: 'id' }
    );
    if (profileErr) {
      console.warn('[TinyRide Auth] Profile upsert notice:', profileErr);
    }
  }

  // 3. Ensure role 'parent' exists in public.user_roles
  const { data: parentRole } = await supabase.from('roles').select('id').eq('code', 'parent').single();
  if (parentRole) {
    await supabase.from('user_roles').upsert(
      {
        user_id: userId,
        role_id: parentRole.id,
      },
      { onConflict: 'user_id, role_id', ignoreDuplicates: true }
    );
  }

  // 4. Ensure parent record exists in public.parents
  let parentId: string;
  const { data: existingParent } = await supabase
    .from('parents')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingParent) {
    parentId = existingParent.id;
  } else {
    const { data: cities } = await supabase.from('cities').select('id').limit(1);
    const cityId = cities?.[0]?.id || null;
    const { data: newParent, error: parentErr } = await supabase
      .from('parents')
      .insert({
        user_id: userId,
        city_id: cityId,
      })
      .select('id')
      .single();

    if (parentErr || !newParent) {
      console.error('[TinyRide Auth] Failed to create parent record:', parentErr);
      throw new Error('Failed to initialize parent profile');
    }
    parentId = newParent.id;
  }

  // 5. Determine onboarding status (does parent have active children enrolled?)
  const { count: childrenCount } = await supabase
    .from('children')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', parentId)
    .neq('status', 'graduated');

  const onboardingStatus: 'incomplete' | 'complete' =
    childrenCount && childrenCount > 0 ? 'complete' : 'incomplete';

  // 6. Sign secure 30-day session token
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const sessionToken = signSessionToken({
    userId,
    parentId,
    phone,
    role: 'parent',
    displayName: existingProfile?.display_name || null,
    onboardingStatus,
    exp,
  });

  return {
    success: true,
    sessionToken,
    user: {
      id: userId,
      phone,
      displayName: existingProfile?.display_name || null,
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
