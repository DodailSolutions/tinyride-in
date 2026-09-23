import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';

describe('SupportService', () => {
  let service: SupportService;

  const mockSupabaseClient = {
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'support_tickets') {
        return {
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'e2d1d054-933d-4c3e-967a-1158a74e5087',
                  reference: 'TKT-20260923-1A2B3C',
                  requester_id: 'user-uuid-1',
                  category: 'booking',
                  subject: 'Seat schedule modification request',
                  state: 'open',
                  severity: 'medium',
                  requester: { id: 'user-uuid-1', full_name: 'Ananya Sharma', phone_e164: '+919876543210' },
                  assignee: null,
                  created_at: '2026-09-23T04:00:00Z',
                  updated_at: '2026-09-23T04:00:00Z',
                },
              ],
              error: null,
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'e2d1d054-933d-4c3e-967a-1158a74e5087',
                  reference: 'TKT-20260923-1A2B3C',
                  state: 'open',
                },
                error: null,
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: {
                    id: 'e2d1d054-933d-4c3e-967a-1158a74e5087',
                    state: 'resolved',
                    resolved_at: '2026-09-23T04:15:00Z',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'ticket_messages') {
        return {
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return { select: jest.fn().mockResolvedValue({ data: [] }) };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: SupabaseService,
          useValue: {
            getServiceRoleClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list support tickets with requester profile info', async () => {
    const tickets = await service.getTickets();
    expect(tickets).toHaveLength(1);
    expect(tickets[0].reference).toBe('TKT-20260923-1A2B3C');
    expect(tickets[0].requesterName).toBe('Ananya Sharma');
    expect(tickets[0].state).toBe('open');
  });

  it('should create support ticket and initial message', async () => {
    const ticket = await service.createTicket('user-uuid-1', {
      category: 'booking',
      subject: 'Schedule change inquiry',
      severity: 'medium',
      message: 'Can I change my pickup stop to Stop B?',
    });
    expect(ticket).toBeDefined();
    expect(ticket.id).toBe('e2d1d054-933d-4c3e-967a-1158a74e5087');
  });

  it('should update ticket state and record resolution note', async () => {
    const updated = await service.updateTicket('e2d1d054-933d-4c3e-967a-1158a74e5087', 'admin-uuid', {
      state: 'resolved',
      note: 'Stop change approved and updated in route schedule.',
    });
    expect(updated).toBeDefined();
    expect(updated.state).toBe('resolved');
  });
});
