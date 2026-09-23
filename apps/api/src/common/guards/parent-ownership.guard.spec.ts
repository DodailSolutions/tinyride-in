import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ParentOwnershipGuard } from './parent-ownership.guard';
import { SupabaseService } from '../supabase/supabase.service';

describe('ParentOwnershipGuard', () => {
  let guard: ParentOwnershipGuard;
  let supabaseService: jest.Mocked<Partial<SupabaseService>>;
  let mockServiceClient: { from: jest.Mock };

  beforeEach(() => {
    mockServiceClient = {
      from: jest.fn(),
    };

    supabaseService = {
      getServiceRoleClient: jest.fn().mockReturnValue(mockServiceClient),
    };

    guard = new ParentOwnershipGuard(supabaseService as SupabaseService);
  });

  const createMockContext = (
    user: Record<string, unknown>,
    params: Record<string, string> = {},
    body: Record<string, unknown> = {},
  ): ExecutionContext => {
    const request = { user, params, body };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow operators or admins without child checks', async () => {
    const context = createMockContext({ userId: 'admin-1', roles: ['admin'] });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockServiceClient.from).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if user has no parent profile', async () => {
    mockServiceClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    const context = createMockContext({ userId: 'user-not-parent', roles: ['driver'] });
    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('User is not registered as a parent'),
    );
  });

  it('should reject access if child belongs to another parent', async () => {
    // 1. Resolve parent: returns parent_id = 'parent-A'
    // 2. Resolve child: returns child with parent_id = 'parent-B'
    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'parents') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'parent-A' }, error: null }),
        };
      }
      if (table === 'children') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'child-1', parent_id: 'parent-B' },
            error: null,
          }),
        };
      }
      return {};
    });

    const context = createMockContext(
      { userId: 'user-parent-A', roles: ['parent'] },
      { childId: 'child-1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('Data Isolation Violation: You are not authorized to access this child record.'),
    );
  });

  it('should allow access if child belongs to the authenticated parent', async () => {
    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'parents') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'parent-A' }, error: null }),
        };
      }
      if (table === 'children') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'child-1', parent_id: 'parent-A' },
            error: null,
          }),
        };
      }
      return {};
    });

    const context = createMockContext(
      { userId: 'user-parent-A', roles: ['parent'] },
      { childId: 'child-1' },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw NotFoundException if child does not exist', async () => {
    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'parents') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'parent-A' }, error: null }),
        };
      }
      if (table === 'children') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {};
    });

    const context = createMockContext(
      { userId: 'user-parent-A', roles: ['parent'] },
      { childId: 'non-existent-child' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      new NotFoundException('Child with ID [non-existent-child] not found'),
    );
  });
});
