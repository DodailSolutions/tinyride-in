import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';

describe('SafetyService', () => {
  let service: SafetyService;
  let mockServiceClient: {
    from: jest.Mock;
  };
  let mockAuditService: { record: jest.Mock };

  beforeEach(async () => {
    mockServiceClient = {
      from: jest.fn(),
    };

    mockAuditService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const mockSupabaseService = {
      getServiceRoleClient: jest.fn().mockReturnValue(mockServiceClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SafetyService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<SafetyService>(SafetyService);
  });

  describe('createException', () => {
    it('creates operational exception with severity-derived SLA timer', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'exceptions') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'exc-1',
                    exception_type: 'handover_failed',
                    severity: 'critical',
                    title: 'Repeated OTP mismatch at home pickup',
                    state: 'open',
                  },
                }),
              }),
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const res = await service.createException(
        { userId: 'operator-1', roles: ['operator'], isPrivileged: true, phoneE164: '+919876543210' },
        {
          exceptionType: 'handover_failed',
          severity: 'critical',
          title: 'Repeated OTP mismatch at home pickup',
        },
      );

      expect(res.id).toBe('exc-1');
      expect(res.severity).toBe('critical');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'insert',
          tableName: 'exceptions',
          recordId: 'exc-1',
          reasonCode: 'EXCEPTION_HANDOVER_FAILED',
        }),
      );
    });
  });

  describe('resolveException', () => {
    it('resolves an open exception with resolution code and note', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'exceptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'exc-1', state: 'open' },
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'exc-1',
                      state: 'resolved',
                      resolution_code: 'PARENT_VERIFIED',
                    },
                  }),
                }),
              }),
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const res = await service.resolveException(
        'exc-1',
        { userId: 'operator-1', roles: ['operator'], isPrivileged: true, phoneE164: '+919876543210' },
        { resolutionCode: 'PARENT_VERIFIED', resolutionNote: 'Confirmed via parent phone call' },
      );

      expect(res.state).toBe('resolved');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          tableName: 'exceptions',
          recordId: 'exc-1',
          reasonCode: 'PARENT_VERIFIED',
        }),
      );
    });
  });

  describe('createIncident and closeIncident', () => {
    it('creates formal safety incident and later closes with approval', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'incidents') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'inc-1',
                    reference: 'INC-20260601-ABCDEF',
                    severity: 'high',
                    status: 'open',
                  },
                }),
              }),
            }),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'inc-1', status: 'open', reference: 'INC-20260601-ABCDEF' },
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'inc-1', status: 'closed' },
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'incident_events') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      // 1. Create incident
      const inc = await service.createIncident(
        { userId: 'operator-1', roles: ['operator'], isPrivileged: true, phoneE164: '+919876543210' },
        {
          severity: 'high',
          category: 'handover_dispute',
          summary: 'Unauthorized person attempted to collect child',
        },
      );

      expect(inc.id).toBe('inc-1');
      expect(inc.reference).toMatch(/^INC-/);

      // 2. Close incident
      const closed = await service.closeIncident(
        'inc-1',
        { userId: 'admin-1', roles: ['admin'], isPrivileged: true, phoneE164: '+919876543211' },
        {
          closureNote: 'Police verification and guardian identity validated. False alarm.',
          closureApprovedBy: 'admin-1',
        },
      );

      expect(closed.status).toBe('closed');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          tableName: 'incidents',
          recordId: 'inc-1',
          reasonCode: 'INCIDENT_CLOSED',
        }),
      );
    });
  });
});
