import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EnvConfig } from '../config/env.config';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private serviceRoleClient: SupabaseClient | null = null;
  private anonClient: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  /**
   * Returns a privileged service-role Supabase client.
   * STRICT SECURITY: Use only in server-side authorization guards,
   * trusted workflows, and audit-logged operations.
   */
  getServiceRoleClient(): SupabaseClient {
    if (!this.serviceRoleClient) {
      const url = this.configService.get('SUPABASE_URL', { infer: true });
      const key = this.configService.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true });

      this.serviceRoleClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      this.logger.debug('Initialized Supabase privileged service-role client');
    }
    return this.serviceRoleClient;
  }

  /**
   * Returns a public anon Supabase client.
   */
  getAnonClient(): SupabaseClient {
    if (!this.anonClient) {
      const url = this.configService.get('SUPABASE_URL', { infer: true });
      const key = this.configService.get('SUPABASE_ANON_KEY', { infer: true });

      this.anonClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      this.logger.debug('Initialized Supabase anon client');
    }
    return this.anonClient;
  }

  /**
   * Returns a scoped Supabase client authenticated as the caller's JWT.
   * All database queries through this client strictly adhere to Row Level Security (RLS).
   */
  getUserClient(jwtToken: string): SupabaseClient {
    const url = this.configService.get('SUPABASE_URL', { infer: true });
    const anonKey = this.configService.get('SUPABASE_ANON_KEY', { infer: true });

    return createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${jwtToken.replace(/^Bearer\s+/i, '')}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Diagnostic check to verify connectivity to Supabase.
   */
  async checkHealth(): Promise<{ status: 'healthy' | 'unhealthy'; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const client = this.getServiceRoleClient();
      // Probe auth service as a standard health check
      const { error } = await client.auth.getSession();
      const latencyMs = Date.now() - start;

      if (error) {
        return { status: 'unhealthy', latencyMs, error: error.message };
      }
      return { status: 'healthy', latencyMs };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      const error = err instanceof Error ? err.message : String(err);
      return { status: 'unhealthy', latencyMs, error };
    }
  }
}
