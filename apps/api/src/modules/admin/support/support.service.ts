import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { CreateTicketDto, UpdateTicketDto } from './dto/support.dto';

export interface SupportTicketSummary {
  id: string;
  reference: string;
  requesterId: string;
  requesterName: string;
  requesterPhone: string;
  category: string;
  subject: string;
  state: string;
  severity: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Retrieves all support tickets with requester and assignee profile details.
   */
  async getTickets(stateFilter?: string): Promise<SupportTicketSummary[]> {
    const client = this.supabaseService.getServiceRoleClient();

    let query = client
      .from('support_tickets')
      .select(`
        id,
        reference,
        requester_id,
        category,
        subject,
        state,
        severity,
        assigned_to,
        created_at,
        updated_at,
        requester:profiles!support_tickets_requester_id_fkey (
          id,
          full_name,
          phone_e164
        ),
        assignee:profiles!support_tickets_assigned_to_fkey (
          id,
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (stateFilter) {
      query = query.eq('state', stateFilter);
    }

    const { data: tickets, error } = await query;

    if (error) {
      this.logger.error(`Failed to fetch support tickets: ${error.message}`);
      return [];
    }

    return (tickets || []).map((t: any) => ({
      id: t.id,
      reference: t.reference || `TKT-${t.id.substring(0, 8)}`,
      requesterId: t.requester_id,
      requesterName: t.requester?.full_name || 'Requester',
      requesterPhone: t.requester?.phone_e164 || 'N/A',
      category: t.category,
      subject: t.subject,
      state: t.state,
      severity: t.severity || 'low',
      assignedTo: t.assigned_to,
      assignedToName: t.assignee?.full_name,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
  }

  /**
   * Creates a new support ticket (can be requested by parent or driver)
   */
  async createTicket(userId: string, dto: CreateTicketDto) {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: ticket, error } = await client
      .from('support_tickets')
      .insert({
        requester_id: userId,
        category: dto.category,
        subject: dto.subject,
        severity: dto.severity || 'low',
        state: 'open',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ticket: ${error.message}`);
    }

    // Insert initial message
    await client.from('ticket_messages').insert({
      ticket_id: ticket.id,
      author_id: userId,
      body: dto.message,
    });

    return ticket;
  }

  /**
   * Updates ticket state, assignee, or resolution note
   */
  async updateTicket(ticketId: string, actorId: string, dto: UpdateTicketDto) {
    const client = this.supabaseService.getServiceRoleClient();

    const updates: Record<string, any> = {};
    if (dto.state) {
      updates.state = dto.state;
      if (dto.state === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      } else if (dto.state === 'closed') {
        updates.closed_at = new Date().toISOString();
      }
    }
    if (dto.assignedTo) {
      updates.assigned_to = dto.assignedTo;
    }

    const { data: updated, error } = await client
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update ticket: ${error.message}`);
    }

    if (!updated) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    // Add note as message if provided
    if (dto.note) {
      await client.from('ticket_messages').insert({
        ticket_id: ticketId,
        author_id: actorId,
        body: dto.note,
      });
    }

    return updated;
  }
}
