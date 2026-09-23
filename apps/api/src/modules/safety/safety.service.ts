import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { AuthenticatedUser } from '@tinyride/shared-types';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import {
  CloseIncidentDto,
  CreateExceptionDto,
  CreateIncidentDto,
  ResolveExceptionDto,
} from './dto/safety.dto';

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper to determine SLA deadline by severity.
   */
  private computeSlaDueAt(severity: string = 'medium'): string {
    const minutes =
      severity === 'critical'
        ? 60
        : severity === 'high'
          ? 240
          : severity === 'medium'
            ? 1440
            : 4320;
    return new Date(Date.now() + minutes * 60 * 1000).toISOString();
  }

  /**
   * Creates an operational exception with an SLA timer.
   */
  async createException(user: AuthenticatedUser, dto: CreateExceptionDto) {
    const client = this.supabaseService.getServiceRoleClient();
    const severity = dto.severity || 'medium';
    const slaDueAt = this.computeSlaDueAt(severity);

    const { data: exception, error } = await client
      .from('exceptions')
      .insert({
        exception_type: dto.exceptionType,
        severity,
        title: dto.title.trim(),
        details: dto.details || {},
        trip_id: dto.tripId || null,
        trip_child_id: dto.tripChildId || null,
        booking_id: dto.bookingId || null,
        driver_id: dto.driverId || null,
        raised_by: user.userId,
        auto_raised: false,
        state: 'open',
        sla_due_at: slaDueAt,
      })
      .select()
      .single();

    if (error || !exception) {
      this.logger.error(`Exception creation failed: ${error?.message}`);
      throw new BadRequestException(`Could not create exception: ${error?.message}`);
    }

    // Audit log
    await this.auditService.record({
      actorUserId: user.userId,
      actorRole: user.roles[0] || 'operator',
      action: 'insert',
      tableName: 'exceptions',
      recordId: exception.id,
      reasonCode: `EXCEPTION_${dto.exceptionType.toUpperCase()}`,
      afterData: { title: dto.title, severity, slaDueAt },
    });

    return exception;
  }

  /**
   * Resolves an open exception with mandatory resolution note and code.
   */
  async resolveException(
    exceptionId: string,
    user: AuthenticatedUser,
    dto: ResolveExceptionDto,
  ) {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: existing } = await client
      .from('exceptions')
      .select('id, state')
      .eq('id', exceptionId)
      .maybeSingle();

    if (!existing) {
      throw new NotFoundException(`Exception [${exceptionId}] not found`);
    }

    if (existing.state === 'resolved') {
      throw new BadRequestException('Exception is already resolved');
    }

    const now = new Date().toISOString();
    const { data: updated, error } = await client
      .from('exceptions')
      .update({
        state: 'resolved',
        resolved_at: now,
        resolution_code: dto.resolutionCode,
        resolution_note: dto.resolutionNote,
      })
      .eq('id', exceptionId)
      .select()
      .single();

    if (error || !updated) {
      throw new BadRequestException(`Failed to resolve exception: ${error?.message}`);
    }

    // Audit log
    await this.auditService.record({
      actorUserId: user.userId,
      actorRole: user.roles[0] || 'operator',
      action: 'update',
      tableName: 'exceptions',
      recordId: exceptionId,
      reasonCode: dto.resolutionCode,
      beforeData: { state: existing.state },
      afterData: { state: 'resolved', resolvedAt: now },
    });

    return updated;
  }

  /**
   * Lists operational exceptions in the queue.
   */
  async getExceptions(state?: string) {
    const client = this.supabaseService.getServiceRoleClient();

    let query = client
      .from('exceptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (state) {
      query = query.eq('state', state);
    }

    const { data: exceptions, error } = await query;
    if (error) {
      throw new BadRequestException(error.message);
    }
    return exceptions || [];
  }

  /**
   * Creates a formal safety incident case with SLA and generated reference.
   */
  async createIncident(user: AuthenticatedUser, dto: CreateIncidentDto) {
    const client = this.supabaseService.getServiceRoleClient();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const reference = `INC-${dateStr}-${randSuffix}`;
    const slaDueAt = this.computeSlaDueAt(dto.severity);

    const { data: incident, error } = await client
      .from('incidents')
      .insert({
        reference,
        severity: dto.severity,
        category: dto.category,
        summary: dto.summary.trim(),
        description: dto.description || null,
        trip_id: dto.tripId || null,
        child_id: dto.childId || null,
        driver_id: dto.driverId || null,
        reported_by_user_id: user.userId,
        status: 'open',
        sla_due_at: slaDueAt,
      })
      .select()
      .single();

    if (error || !incident) {
      this.logger.error(`Incident creation failed: ${error?.message}`);
      throw new BadRequestException(`Could not create incident: ${error?.message}`);
    }

    // Record initial incident event
    await client.from('incident_events').insert({
      incident_id: incident.id,
      event_type: 'opened',
      actor_user_id: user.userId,
      to_status: 'open',
      note: 'Incident case initialized',
    });

    // Audit log
    await this.auditService.record({
      actorUserId: user.userId,
      actorRole: user.roles[0] || 'operator',
      action: 'insert',
      tableName: 'incidents',
      recordId: incident.id,
      reasonCode: 'INCIDENT_REPORTED',
      afterData: { reference, severity: dto.severity, summary: dto.summary },
    });

    return incident;
  }

  /**
   * Closes a safety incident case. Requires explicit closure note and approver.
   */
  async closeIncident(
    incidentId: string,
    user: AuthenticatedUser,
    dto: CloseIncidentDto,
  ) {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: existing } = await client
      .from('incidents')
      .select('id, status, reference')
      .eq('id', incidentId)
      .maybeSingle();

    if (!existing) {
      throw new NotFoundException(`Incident [${incidentId}] not found`);
    }

    if (existing.status === 'closed') {
      throw new BadRequestException('Incident case is already closed');
    }

    const now = new Date().toISOString();
    const { data: updated, error } = await client
      .from('incidents')
      .update({
        status: 'closed',
        closed_at: now,
        closed_by: user.userId,
        closure_approved_by: dto.closureApprovedBy,
        closure_note: dto.closureNote,
      })
      .eq('id', incidentId)
      .select()
      .single();

    if (error || !updated) {
      throw new BadRequestException(`Failed to close incident: ${error?.message}`);
    }

    // Record event
    await client.from('incident_events').insert({
      incident_id: incidentId,
      event_type: 'closed',
      actor_user_id: user.userId,
      from_status: existing.status,
      to_status: 'closed',
      note: dto.closureNote,
    });

    // Audit log
    await this.auditService.record({
      actorUserId: user.userId,
      actorRole: user.roles[0] || 'operator',
      action: 'update',
      tableName: 'incidents',
      recordId: incidentId,
      reasonCode: 'INCIDENT_CLOSED',
      beforeData: { status: existing.status },
      afterData: { status: 'closed', closedAt: now, approvedBy: dto.closureApprovedBy },
    });

    return updated;
  }

  /**
   * Lists safety incidents.
   */
  async getIncidents(status?: string) {
    const client = this.supabaseService.getServiceRoleClient();

    let query = client
      .from('incidents')
      .select(`
        *,
        incident_events (*)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: incidents, error } = await query;
    if (error) {
      throw new BadRequestException(error.message);
    }
    return incidents || [];
  }
}
