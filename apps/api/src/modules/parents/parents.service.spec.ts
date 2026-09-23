import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { ParentsService } from './parents.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';

describe('ParentsService', () => {
  let service: ParentsService;
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
        ParentsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ParentsService>(ParentsService);
  });

  describe('getMe', () => {
    it('returns parent details, locations, and children', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'parents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'parent-1', user_id: 'user-1', city_id: 'city-1' },
            }),
          };
        }
        if (table === 'family_locations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ id: 'loc-1', label: 'Home', address: 'Banjara Hills' }],
            }),
          };
        }
        if (table === 'children') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [{ id: 'child-1', first_name: 'Aarav', school_id: 'school-1' }],
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const res = await service.getMe('user-1');
      expect(res.parent.id).toBe('parent-1');
      expect(res.locations).toHaveLength(1);
      expect(res.children).toHaveLength(1);
    });
  });

  describe('createChild', () => {
    it('creates child record, health notes, and audits event', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'parents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'parent-1', user_id: 'user-1' },
            }),
          };
        }
        if (table === 'schools') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'school-1', name: 'Oakridge International' },
            }),
          };
        }
        if (table === 'children') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'child-1',
                    parent_id: 'parent-1',
                    school_id: 'school-1',
                    first_name: 'Aarav',
                    status: 'active',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'child_health_notes') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const result = await service.createChild('user-1', {
        firstName: 'Aarav',
        schoolId: 'school-1',
        medicalNotes: 'Asthma inhaler required',
        allergies: 'Peanuts',
      });

      expect(result.id).toBe('child-1');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'insert',
          tableName: 'children',
          recordId: 'child-1',
          reasonCode: 'CHILD_REGISTERED',
        }),
      );
    });

    it('throws NotFoundException if school does not exist', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'parents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'parent-1', user_id: 'user-1' },
            }),
          };
        }
        if (table === 'schools') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      await expect(
        service.createChild('user-1', {
          firstName: 'Aarav',
          schoolId: 'invalid-school',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createGuardian', () => {
    it('creates and links guardian with authorized pickup timestamp', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'parents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'parent-1', user_id: 'user-1' },
            }),
          };
        }
        if (table === 'children') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'child-1', parent_id: 'parent-1' },
            }),
          };
        }
        if (table === 'guardians') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'guardian-1', full_name: 'Priya Sharma' },
                }),
              }),
            }),
          };
        }
        if (table === 'child_guardians') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'cg-1',
                    child_id: 'child-1',
                    guardian_id: 'guardian-1',
                    relationship: 'mother',
                    can_pickup: true,
                    verified_at: '2026-09-23T00:00:00.000Z',
                  },
                }),
              }),
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const res = await service.createGuardian('user-1', 'child-1', {
        fullName: 'Priya Sharma',
        phoneE164: '+919876543211',
        relationship: 'mother',
        canPickup: true,
      });

      expect(res.guardian_id).toBe('guardian-1');
      expect(res.can_pickup).toBe(true);
      expect(res.verified_at).toBeDefined();
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'insert',
          tableName: 'child_guardians',
          reasonCode: 'GUARDIAN_LINKED',
        }),
      );
    });

    it('rejects if child does not belong to parent', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'parents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'parent-1', user_id: 'user-1' },
            }),
          };
        }
        if (table === 'children') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'child-1', parent_id: 'other-parent' },
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      await expect(
        service.createGuardian('user-1', 'child-1', {
          fullName: 'Priya Sharma',
          phoneE164: '+919876543211',
          relationship: 'mother',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
