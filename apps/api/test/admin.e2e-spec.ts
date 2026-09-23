import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { CorrelationIdInterceptor } from '../src/common/interceptors/correlation-id.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AuthService } from '../src/modules/auth/auth.service';
import { OpsService } from '../src/modules/admin/ops/ops.service';
import { FinanceService } from '../src/modules/admin/finance/finance.service';
import { SupportService } from '../src/modules/admin/support/support.service';

describe('Admin Operations Pipeline (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let opsService: OpsService;
  let financeService: FinanceService;
  let supportService: SupportService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3006';
    process.env.SUPABASE_URL = 'https://bfdcxaenmdomjsbvcbpj.supabase.co';
    process.env.SUPABASE_ANON_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZGN4YWVubWRvbWpzYnZjYnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDAxOTcsImV4cCI6MjEwNTY3NjE5N30.ngaWwnbpmEFjxpHYYZ-v43v3vdxNKBgUClwfb77_O1A';
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZGN4YWVubWRvbWpzYnZjYnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDEwMDE5NywiZXhwIjoyMTA1Njc2MTk3fQ.HPDqVlYay99Vo9IovoEvng4TV_JzNk8FfSg4qWk03kQ';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: ['health/(.*)', 'health'],
    });
    app.useGlobalInterceptors(new CorrelationIdInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    authService = moduleFixture.get<AuthService>(AuthService);
    opsService = moduleFixture.get<OpsService>(OpsService);
    financeService = moduleFixture.get<FinanceService>(FinanceService);
    supportService = moduleFixture.get<SupportService>(SupportService);

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Operations Dashboard & Live Trips', () => {
    it('rejects unauthenticated request to /admin/ops/overview (401)', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/admin/ops/overview');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('Unauthorized');
    });

    it('returns dashboard overview metrics for operator role', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValueOnce({
        userId: 'e2d1d054-933d-4c3e-967a-1158a74e5087',
        phoneE164: '+919876543210',
        email: 'admin@dodail.com',
        isPrivileged: false,
        roles: ['operator'],
      });

      jest.spyOn(opsService, 'getDashboardOverview').mockResolvedValueOnce({
        activeTripsCount: 4,
        inTransitChildrenCount: 18,
        pendingKycCount: 5,
        openExceptionsCount: 1,
        activeIncidentsCount: 0,
        todayRevenuePaise: 120000,
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/ops/overview')
        .set('Authorization', 'Bearer mock-operator-token');

      expect(res.status).toBe(200);
      expect(res.body.activeTripsCount).toBe(4);
      expect(res.body.inTransitChildrenCount).toBe(18);
    });

    it('returns live trips array for admin role', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValueOnce({
        userId: 'e2d1d054-933d-4c3e-967a-1158a74e5087',
        phoneE164: '+919876543210',
        email: 'admin@dodail.com',
        isPrivileged: false,
        roles: ['admin'],
      });

      jest.spyOn(opsService, 'getLiveTrips').mockResolvedValueOnce([
        {
          id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          tripNumber: 'TRIP-HYD-001',
          serviceDate: '2026-09-23',
          state: 'in_progress',
          routeId: 'r1',
          routeName: 'Jubilee Hills Route 1',
          schoolName: 'Delhi Public School',
          driverId: 'd1',
          driverName: 'Suresh Kumar',
          vehicleRegistration: 'TS09UB9999',
          seatingCapacity: 7,
          childrenTotal: 5,
          childrenCompletedHandovers: 3,
          isDelayed: false,
          hasOpenException: false,
        },
      ]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/ops/trips/live')
        .set('Authorization', 'Bearer mock-admin-token');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].tripNumber).toBe('TRIP-HYD-001');
    });
  });

  describe('Finance & Ledger Reconciliation RBAC', () => {
    it('rejects support_agent from accessing financial reconciliation (403 Forbidden)', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValueOnce({
        userId: 'e2d1d054-933d-4c3e-967a-1158a74e5087',
        phoneE164: '+919876543210',
        email: 'admin@dodail.com',
        isPrivileged: false,
        roles: ['support_agent'],
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/finance/reconciliation')
        .set('Authorization', 'Bearer mock-support-token');

      expect(res.status).toBe(403);
    });

    it('returns double-entry reconciliation report for finance_admin role', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValueOnce({
        userId: 'e2d1d054-933d-4c3e-967a-1158a74e5087',
        phoneE164: '+919876543210',
        email: 'admin@dodail.com',
        isPrivileged: false,
        roles: ['finance_admin'],
      });

      jest.spyOn(financeService, 'getReconciliationReport').mockResolvedValueOnce({
        totalGrossCollectionsPaise: 1000000,
        totalPlatformRevenuePaise: 150000,
        totalOwnerPayablesPaise: 850000,
        netDiscrepancyPaise: 0,
        isBalanced: true,
        totalLedgerTransactionsCount: 12,
        ownerPayableBreakdown: [],
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/finance/reconciliation')
        .set('Authorization', 'Bearer mock-finance-token');

      expect(res.status).toBe(200);
      expect(res.body.isBalanced).toBe(true);
      expect(res.body.netDiscrepancyPaise).toBe(0);
    });
  });

  describe('Support Desk Queue', () => {
    it('retrieves support tickets for support_agent role', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValueOnce({
        userId: 'e2d1d054-933d-4c3e-967a-1158a74e5087',
        phoneE164: '+919876543210',
        email: 'admin@dodail.com',
        isPrivileged: false,
        roles: ['support_agent'],
      });

      jest.spyOn(supportService, 'getTickets').mockResolvedValueOnce([
        {
          id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          reference: 'TKT-20260923-ABCDEF',
          requesterId: 'u1',
          requesterName: 'Pooja Reddy',
          requesterPhone: '+919988776655',
          category: 'booking',
          subject: 'Change pickup time',
          state: 'open',
          severity: 'low',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/support/tickets')
        .set('Authorization', 'Bearer mock-support-token');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].reference).toBe('TKT-20260923-ABCDEF');
    });
  });
});
