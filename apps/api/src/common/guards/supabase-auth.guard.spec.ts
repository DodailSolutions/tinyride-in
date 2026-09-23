import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { AuthService } from '../../modules/auth/auth.service';
import { AuthenticatedUser } from '@tinyride/shared-types';

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let authService: jest.Mocked<Partial<AuthService>>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    authService = {
      validateToken: jest.fn(),
    };

    guard = new SupabaseAuthGuard(reflector, authService as AuthService);
  });

  const createMockContext = (headers: Record<string, string>): ExecutionContext => {
    const request = { headers };
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if route is marked @Public()', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext({});

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(authService.validateToken).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if Authorization header is missing', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Missing Authorization header. Bearer token is required.'),
    );
  });

  it('should throw UnauthorizedException if Authorization header is not Bearer format', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext({ authorization: 'Basic 123456' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Malformed Authorization header. Format: Bearer <token>'),
    );
  });

  it('should validate token and attach user to request', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const mockUser: AuthenticatedUser = {
      userId: 'user-uuid-1',
      phoneE164: '+919876543210',
      email: 'parent@example.com',
      roles: ['parent'],
      isPrivileged: false,
    };
    (authService.validateToken as jest.Mock).mockResolvedValue(mockUser);

    const context = createMockContext({ authorization: 'Bearer valid-jwt-token' });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(authService.validateToken).toHaveBeenCalledWith('valid-jwt-token');
    const req = context.switchToHttp().getRequest() as Record<string, unknown>;
    expect(req['user']).toEqual(mockUser);
  });

  it('should propagate UnauthorizedException if token is invalid or expired', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    (authService.validateToken as jest.Mock).mockRejectedValue(
      new UnauthorizedException('Invalid, revoked, or expired authentication token'),
    );

    const context = createMockContext({ authorization: 'Bearer expired-jwt-token' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
