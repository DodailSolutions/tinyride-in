import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { SupabaseService } from '../../common/supabase/supabase.service';

describe('AuditService', () => {
  let service: AuditService;
  let mockInsert: jest.Mock;

  beforeEach(async () => {
    mockInsert = jest.fn().mockResolvedValue({ error: null });

    const mockSupabaseService = {
      getServiceRoleClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          insert: mockInsert,
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should format and insert an audit log record', async () => {
    await service.record({
      actorUserId: 'admin-1',
      actorRole: 'admin',
      action: 'role_change',
      tableName: 'user_roles',
      recordId: 'role-grant-1',
      reasonCode: 'ONBOARDING_APPROVED',
      correlationId: 'corr-xyz-123',
      afterData: { active: true },
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_user_id: 'admin-1',
        actor_role: 'admin',
        action: 'role_change',
        table_name: 'user_roles',
        record_id: 'role-grant-1',
        reason_code: 'ONBOARDING_APPROVED',
        correlation_id: 'corr-xyz-123',
        after_data: JSON.stringify({ active: true }),
      }),
    );
  });
});
