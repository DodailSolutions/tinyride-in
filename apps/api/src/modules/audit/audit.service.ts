import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditAction, RoleCode } from '@tinyride/shared-types';

export interface RecordAuditParams {
  actorUserId?: string | null;
  actorRole?: RoleCode | string | null;
  action: AuditAction;
  tableName?: string;
  recordId?: string;
  reasonCode?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Appends an immutable audit log record to public.audit_logs.
   * Uses the privileged service-role client because audit_logs is protected
   * by forbid_mutation() triggers and restricted write grants.
   */
  async record(params: RecordAuditParams): Promise<void> {
    try {
      const client = this.supabaseService.getServiceRoleClient();

      const { error } = await client.from('audit_logs').insert({
        actor_user_id: params.actorUserId || null,
        actor_role: params.actorRole || null,
        action: params.action,
        table_name: params.tableName || null,
        record_id: params.recordId || null,
        reason_code: params.reasonCode || null,
        correlation_id: params.correlationId || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        before_data: params.beforeData ? JSON.stringify(params.beforeData) : null,
        after_data: params.afterData ? JSON.stringify(params.afterData) : null,
      });

      if (error) {
        this.logger.error(
          `Failed to record audit log for table [${params.tableName}], action [${params.action}]: ${error.message}`,
        );
      } else {
        this.logger.debug(
          `[Audit] Action [${params.action}] recorded on [${params.tableName}:${params.recordId}] by [${params.actorUserId ?? 'system'}]`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Exception while recording audit log: ${msg}`);
    }
  }
}
