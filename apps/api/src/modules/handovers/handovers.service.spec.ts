import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { HandoversService } from './handovers.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';

describe('HandoversService', () => {
  let service: HandoversService;
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
        HandoversService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<HandoversService>(HandoversService);
  });

  describe('requestOtp', () => {
    it('generates salted hash OTP token and stores in handover_tokens', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'trip_children') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'tc-1',
                child_id: 'child-1',
                trip_id: 'trip-1',
                required_legs: ['home_pickup', 'school_receipt'],
              },
            }),
          };
        }
        if (table === 'handover_tokens') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              is: jest.fn().mockReturnThis(),
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'tok-1', expires_at: '2026-06-01T08:00:00Z' },
                }),
              }),
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const res = await service.requestOtp(
        { userId: 'driver-1', roles: ['driver'], isPrivileged: false, phoneE164: '+919876543210' },
        { tripChildId: 'tc-1', leg: 'home_pickup' },
      );

      expect(res.tokenId).toBe('tok-1');
      expect(res.expiresAt).toBeDefined();
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'insert',
          tableName: 'handover_tokens',
          recordId: 'tok-1',
          reasonCode: 'HANDOVER_OTP_ISSUED',
        }),
      );
    });
  });

  describe('verifyHandover', () => {
    it('verifies matching OTP and transitions child to picked_up', async () => {
      const code = '5678';
      const salt = crypto.randomBytes(16);
      const tokenHash = crypto.createHmac('sha256', salt).update(code).digest();

      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'trip_children') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'tc-1',
                child_id: 'child-1',
                trip_id: 'trip-1',
                state: 'pending',
                required_legs: ['home_pickup', 'school_receipt'],
                children: { id: 'child-1', first_name: 'Aarav' },
              },
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === 'handover_tokens') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'tok-1',
                token_hash: tokenHash,
                token_salt: salt,
                attempts: 0,
                max_attempts: 3,
              },
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === 'handover_attempts') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === 'handovers') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'handover-1', leg: 'home_pickup' },
                }),
              }),
            }),
          };
        }
        if (table === 'trip_child_events') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const res = await service.verifyHandover(
        { userId: 'driver-1', roles: ['driver'], isPrivileged: false, phoneE164: '+919876543210' },
        {
          tripChildId: 'tc-1',
          leg: 'home_pickup',
          method: 'otp',
          otp: '5678',
        },
      );

      expect(res.success).toBe(true);
      expect(res.state).toBe('picked_up');
      expect(res.handoverId).toBe('handover-1');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'insert',
          tableName: 'handovers',
          recordId: 'handover-1',
          reasonCode: 'HANDOVER_HOME_PICKUP_CONFIRMED',
        }),
      );
    });

    it('rejects wrong OTP, increments attempts, and throws BadRequestException', async () => {
      const code = '5678';
      const salt = crypto.randomBytes(16);
      const tokenHash = crypto.createHmac('sha256', salt).update(code).digest();

      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'trip_children') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'tc-1',
                child_id: 'child-1',
                trip_id: 'trip-1',
                state: 'pending',
                required_legs: ['home_pickup'],
              },
            }),
          };
        }
        if (table === 'handover_tokens') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'tok-1',
                token_hash: tokenHash,
                token_salt: salt,
                attempts: 0,
                max_attempts: 3,
              },
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === 'handover_attempts') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      await expect(
        service.verifyHandover(
          { userId: 'driver-1', roles: ['driver'], isPrivileged: false, phoneE164: '+919876543210' },
          {
            tripChildId: 'tc-1',
            leg: 'home_pickup',
            method: 'otp',
            otp: '0000', // Wrong OTP!
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('enforces authorized verified guardian contact check for child dropoff', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'trip_children') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'tc-1',
                child_id: 'child-1',
                trip_id: 'trip-1',
                state: 'at_school',
                required_legs: ['home_dropoff'],
              },
            }),
          };
        }
        if (table === 'child_guardians') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { can_pickup: false, verified_at: null }, // Unverified / not authorized!
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      await expect(
        service.verifyHandover(
          { userId: 'driver-1', roles: ['driver'], isPrivileged: false, phoneE164: '+919876543210' },
          {
            tripChildId: 'tc-1',
            leg: 'home_dropoff',
            method: 'guardian_confirm',
            counterpartyGuardianId: 'guardian-unverified',
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
