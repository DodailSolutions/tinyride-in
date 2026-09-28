import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/server/supabase';

export const dynamic = 'force-dynamic';

function maskKey(key?: string): string | null {
  if (!key) return null;
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

export async function GET() {
  const mapProvider = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'osm';
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  const twilioVerifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const devOtpBypass = process.env.DEV_OTP_BYPASS === 'true';
  const demoMode = process.env.DEMO_MODE === 'true';

  // Test Supabase connection and measure roundtrip latency
  let dbStatus: 'connected' | 'error' = 'error';
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const start = performance.now();
    const supabase = getServiceSupabase();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const end = performance.now();
    if (error) {
      dbError = error.message;
    } else {
      dbStatus = 'connected';
      dbLatencyMs = Math.round(end - start);
    }
  } catch (err: any) {
    dbError = err.message || 'Failed to ping database';
  }

  // Determine Map status
  let mapStatus: 'configured' | 'missing' | 'warning' = 'configured';
  let mapMessage = 'Using OpenStreetMap standard tiles (zero external key dependency).';

  if (mapProvider === 'mapbox') {
    if (mapboxToken) {
      mapStatus = 'configured';
      mapMessage = 'Mapbox vector tiles active with access token.';
    } else {
      mapStatus = 'missing';
      mapMessage = 'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is missing.';
    }
  } else if (mapProvider === 'maptiler') {
    if (maptilerKey) {
      mapStatus = 'configured';
      mapMessage = 'MapTiler tiles active with API key.';
    } else {
      mapStatus = 'missing';
      mapMessage = 'NEXT_PUBLIC_MAPTILER_API_KEY is missing.';
    }
  } else if (mapProvider === 'carto') {
    if (cartoKey) {
      mapStatus = 'configured';
      mapMessage = 'CartoDB Voyager tiles active with API key.';
    } else {
      mapStatus = 'missing';
      mapMessage = 'NEXT_PUBLIC_CARTO_API_KEY is missing.';
    }
  }

  // Determine SMS status
  const hasTwilioCredentials = Boolean(twilioSid && twilioToken && (twilioPhone || twilioVerifySid));
  let smsStatus: 'configured' | 'missing' | 'warning' = 'missing';
  let smsMessage = 'No SMS gateway configured. Phone OTP requires TWILIO credentials or DEV_OTP_BYPASS in staging.';

  if (hasTwilioCredentials) {
    smsStatus = 'configured';
    smsMessage = 'Twilio SMS gateway active for production phone verification.';
  } else if (devOtpBypass) {
    smsStatus = 'warning';
    smsMessage = 'Running in Development OTP Bypass mode (fixed codes 482910 / 123456 accepted). SMS gateway not active.';
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    system: {
      nodeEnv: process.env.NODE_ENV || 'production',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      demoMode,
      devOtpBypass,
    },
    integrations: {
      maps: {
        provider: mapProvider,
        status: mapStatus,
        message: mapMessage,
        keys: {
          mapbox: maskKey(mapboxToken),
          maptiler: maskKey(maptilerKey),
          carto: maskKey(cartoKey),
        },
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        error: dbError,
        url: supabaseUrl ? supabaseUrl.replace(/^(https?:\/\/)([^.]+)(.*)$/, '$1$2$3') : null,
        hasServiceKey: Boolean(supabaseService),
        hasAnonKey: Boolean(supabaseAnon),
      },
      sms: {
        status: smsStatus,
        message: smsMessage,
        provider: hasTwilioCredentials ? 'Twilio' : devOtpBypass ? 'Dev Bypass' : 'None',
        configured: hasTwilioCredentials,
        twilioSid: maskKey(twilioSid),
        twilioPhone: twilioPhone ? `${twilioPhone.slice(0, 3)}••••${twilioPhone.slice(-4)}` : null,
      },
      realtime: {
        status: dbStatus === 'connected' ? 'connected' : 'disconnected',
        provider: 'Supabase Realtime (PostgreSQL CDC)',
        channels: ['trips', 'telemetry', 'notifications'],
      },
    },
  });
}
