import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let mockAnonClient: {
    auth: {
      signInWithOtp: jest.Mock;
      verifyOtp: jest.Mock;
      getUser: jest.Mock;
    };
  };
  let mockServiceClient: { from: jest.Mock };
  let mockAuditService: { record: jest.Mock };

  beforeEach(async () => {
    mockAnonClient = {
      auth: {
        signInWithOtp: jest.fn(),
        verifyOtp: jest.fn(),
        getUser: jest.fn(),
      },
    };

    mockServiceClient = {
      from: jest.fn(),
    };

    mockAuditService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const mockSupabaseService = {
      getAnonClient: jest.fn().mockReturnValue(mockAnonClient),
      getServiceRoleClient: jest.fn().mockReturnValue(mockServiceClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('sendOtp', () => {
    it('should successfully send OTP', async () => {
      mockAnonClient.auth.signInWithOtp.mockResolvedValue({ data: {}, error: null });

      const res = await service.sendOtp({ phoneE164: '+919876543210' });
      expect(res.phoneE164).toBe('+919876543210');
      expect(mockAnonClient.auth.signInWithOtp).toHaveBeenCalledWith({ phone: '+919876543210' });
    });

    it('should throw BadRequestException if Supabase returns an error', async () => {
      mockAnonClient.auth.signInWithOtp.mockResolvedValue({
        data: null,
        error: { message: 'Invalid phone format' },
      });

      await expect(service.sendOtp({ phoneE164: '+919876543210' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyOtp', () => {
    it('should throw UnauthorizedException on invalid OTP', async () => {
      mockAnonClient.auth.verifyOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid token' },
      });

      await expect(
        service.verifyOtp({ phoneE164: '+919876543210', token: '000000' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login if account is suspended', async () => {
      mockAnonClient.auth.verifyOtp.mockResolvedValue({
        data: {
          user: { id: 'suspended-user', phone: '+919876543210' },
          session: { access_token: 'jwt-token', refresh_token: 'ref-token' },
        },
        error: null,
      });

      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'suspended-user', state: 'suspended', suspended_reason: 'KYC violation' },
              error: null,
            }),
          };
        }
        return {};
      });

      await expect(
        service.verifyOtp({ phoneE164: '+919876543210', token: '123456' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('validateToken', () => {
    it('should throw UnauthorizedException if token verification fails', async () => {
      mockAnonClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' },
      });

      await expect(service.validateToken('expired-jwt')).rejects.toThrow(UnauthorizedException);
    });

    it('should resolve user with active roles for valid token', async () => {
      mockAnonClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'valid-user', phone: '+919876543210', email: 'parent@example.com' },
        },
        error: null,
      });

      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'valid-user',
                phone_e164: '+919876543210',
                email: 'parent@example.com',
                state: 'active',
              },
              error: null,
            }),
          };
        }
        if (table === 'user_roles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({
              data: [{ roles: { code: 'driver' } }],
              error: null,
            }),
          };
        }
        return {};
      });

      const user = await service.validateToken('valid-jwt');
      expect(user.userId).toBe('valid-user');
      expect(user.roles).toContain('driver');
      expect(user.phoneE164).toBe('+919876543210');
    });
  });
});
