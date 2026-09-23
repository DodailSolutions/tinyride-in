import { Test, TestingModule } from '@nestjs/testing';
import { DriversService } from './drivers.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('DriversService', () => {
  let service: DriversService;
  let mockServiceClient: {
    from: jest.Mock;
    storage: { from: jest.Mock };
  };
  let mockAuditService: { record: jest.Mock };

  beforeEach(async () => {
    mockServiceClient = {
      from: jest.fn(),
      storage: {
        from: jest.fn().mockReturnValue({
          createSignedUploadUrl: jest.fn().mockResolvedValue({
            data: { signedUrl: 'https://storage.supabase.co/signed-url', token: 'upload-tok' },
            error: null,
          }),
        }),
      },
    };

    mockAuditService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const mockSupabaseService = {
      getServiceRoleClient: jest.fn().mockReturnValue(mockServiceClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<DriversService>(DriversService);
  });

  describe('registerDriver', () => {
    it('registers new driver in pending_verification and grants driver role', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'drivers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'driver-1',
                    license_number: 'TS0920230001',
                    state: 'pending_verification',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'roles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'role-driver' } }),
          };
        }
        if (table === 'user_roles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        return {};
      });

      const result = await service.registerDriver('user-1', {
        licenseNumber: 'ts 09 20230001 ',
      });

      expect(result.id).toBe('driver-1');
      expect(result.state).toBe('pending_verification');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          actorRole: 'driver',
          reasonCode: 'DRIVER_ONBOARDING_SUBMITTED',
        }),
      );
    });

    it('rejects duplicate driver registration for same account', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'drivers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing-driver' } }),
          };
        }
        return {};
      });

      await expect(
        service.registerDriver('user-1', { licenseNumber: 'TS09 1111' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createDocumentUploadSlot', () => {
    it('creates pending document metadata and returns signed upload URL', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'drivers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'driver-1' } }),
          };
        }
        if (table === 'documents') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'doc-1',
                    document_type: 'license',
                    verification_status: 'pending',
                    storage_path: 'drivers/driver-1/license_123.pdf',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await service.createDocumentUploadSlot('user-1', {
        documentType: 'license',
        fileName: 'license.pdf',
      });

      expect(res.document.id).toBe('doc-1');
      expect(res.uploadUrl).toBe('https://storage.supabase.co/signed-url');
      expect(res.document.verification_status).toBe('pending');
    });

    it('throws NotFoundException if user has no driver profile', async () => {
      mockServiceClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null }),
      });

      await expect(
        service.createDocumentUploadSlot('unknown-user', {
          documentType: 'license',
          fileName: 'license.pdf',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
