import { Test, TestingModule } from '@nestjs/testing';
import { KycService } from './kyc.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { AuditService } from '../../audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('KycService', () => {
  let service: KycService;
  let mockServiceClient: { from: jest.Mock };
  let mockAuditService: { record: jest.Mock };

  beforeEach(async () => {
    mockServiceClient = { from: jest.fn() };
    mockAuditService = { record: jest.fn().mockResolvedValue(undefined) };

    const mockSupabaseService = {
      getServiceRoleClient: jest.fn().mockReturnValue(mockServiceClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<KycService>(KycService);
  });

  describe('submitDecision', () => {
    it('approves driver and sets approved state with timestamp', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'drivers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'driver-1', state: 'pending_verification' },
            }),
            update: mockUpdate,
          };
        }
        if (table === 'verification_reviews') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'rev-1', decision: 'approved', reason_code: 'DOCUMENTS_VERIFIED' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await service.submitDecision('reviewer-1', {
        subjectType: 'driver',
        subjectId: 'driver-1',
        decision: 'approved',
        reasonCode: 'DOCUMENTS_VERIFIED',
        notes: 'Telangana police verification and DL checked',
      });

      expect(res.newState).toBe('approved');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'approved',
        }),
      );
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          actorRole: 'kyc_reviewer',
          reasonCode: 'DOCUMENTS_VERIFIED',
        }),
      );
    });

    it('throws NotFoundException if subject does not exist', async () => {
      mockServiceClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null }),
      });

      await expect(
        service.submitDecision('reviewer-1', {
          subjectType: 'driver',
          subjectId: 'non-existent-driver',
          decision: 'approved',
          reasonCode: 'CHECK',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
