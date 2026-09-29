import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';

// Global singleton event emitter for in-process real-time SSE broadcasts
declare global {
  // eslint-disable-next-line no-var
  var __tinyrideEventBus: EventEmitter | undefined;
}

export const realtimeBus: EventEmitter =
  global.__tinyrideEventBus || (global.__tinyrideEventBus = new EventEmitter());
realtimeBus.setMaxListeners(200);

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

let serviceClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing required Supabase configuration: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server environment.'
    );
  }
  if (!serviceClient) {
    serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return serviceClient;
}

export function getAnonSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing required Supabase configuration: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
    );
  }
  if (!anonClient) {
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
    });
  }
  return anonClient;
}


/**
 * Parses PostGIS EWKB geometry hex string into longitude and latitude
 */
export function parsePointHex(hex: string | null | undefined): { lng: number; lat: number } | null {
  if (!hex || typeof hex !== 'string') return null;
  try {
    const buf = Buffer.from(hex, 'hex');
    const isLittleEndian = buf.readUInt8(0) === 1;
    const type = isLittleEndian ? buf.readUInt32LE(1) : buf.readUInt32BE(1);
    const hasSRID = (type & 0x20000000) !== 0;
    const offset = hasSRID ? 9 : 5;
    const lng = isLittleEndian ? buf.readDoubleLE(offset) : buf.readDoubleBE(offset);
    const lat = isLittleEndian ? buf.readDoubleLE(offset + 8) : buf.readDoubleBE(offset + 8);
    if (isNaN(lng) || isNaN(lat)) return null;
    return { lng: Number(lng.toFixed(6)), lat: Number(lat.toFixed(6)) };
  } catch {
    return null;
  }
}

/**
 * Formats longitude and latitude into PostGIS WKT Point string
 */
export function formatPointWKT(lng: number, lat: number): string {
  return `POINT(${lng} ${lat})`;
}
