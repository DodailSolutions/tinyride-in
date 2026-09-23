import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { AuthenticatedUser } from '@tinyride/shared-types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: Partial<AuthenticatedUser>): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if route has no @Roles declaration', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ roles: ['parent'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user is missing on request', () => {
    reflector.getAllAndOverride.mockReturnValue(['driver']);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should permit access if user has matching role', () => {
    reflector.getAllAndOverride.mockReturnValue(['driver']);
    const context = createMockContext({
      userId: 'driver-1',
      roles: ['driver'],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should permit access if user has admin role (admin bypass)', () => {
    reflector.getAllAndOverride.mockReturnValue(['driver', 'kyc_reviewer']);
    const context = createMockContext({
      userId: 'admin-1',
      roles: ['admin'],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject access if user lacks required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['driver']);
    const context = createMockContext({
      userId: 'parent-1',
      roles: ['parent'],
    });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Access denied. Requires one of role(s): [driver]. Caller has: [parent]'),
    );
  });
});
