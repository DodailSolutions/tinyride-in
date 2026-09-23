import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { CorrelationIdInterceptor } from '../src/common/interceptors/correlation-id.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AuthService } from '../src/modules/auth/auth.service';
import { KycService } from '../src/modules/admin/kyc/kyc.service';

describe('Supply & KYC Pipeline (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let kycService: KycService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3003';
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
    kycService = moduleFixture.get<KycService>(KycService);

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /api/v1/routes (Public)', () => {
    it('allows unauthenticated access to discover approved routes', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/routes');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.headers).toHaveProperty('x-correlation-id');
    });
  });

  describe('POST /api/v1/vehicles (RBAC)', () => {
    it('rejects vehicle registration when caller only has parent role (403 Forbidden)', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'parent-user-1',
        phoneE164: '+919876543210',
        email: 'parent@example.com',
        roles: ['parent'],
        isPrivileged: false,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .set('Authorization', 'Bearer mock-parent-token')
        .send({
          registrationNumber: 'TS09AB1234',
          vehicleType: 'auto',
          seatingCapacity: 4,
          usableCapacity: 4,
          hasAttendant: false,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Requires one of role\(s\): \[vehicle_owner, admin\]/);
    });
  });

  describe('POST /api/v1/admin/kyc/decision (RBAC & Approval)', () => {
    it('rejects KYC decision from non-reviewer caller (403 Forbidden)', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'driver-user-1',
        phoneE164: '+919876543211',
        email: 'driver@example.com',
        roles: ['driver'],
        isPrivileged: false,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/kyc/decision')
        .set('Authorization', 'Bearer mock-driver-token')
        .send({
          subjectType: 'driver',
          subjectId: 'b567d287-7333-4f93-b6d4-d50d0358e658',
          decision: 'approved',
          reasonCode: 'CHECKED',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Requires one of role\(s\): \[kyc_reviewer, operator, admin\]/);
    });

    it('processes KYC approval when caller has kyc_reviewer role', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'kyc-officer-1',
        phoneE164: '+919876543212',
        email: 'officer@example.com',
        roles: ['kyc_reviewer'],
        isPrivileged: true,
      });

      jest.spyOn(kycService, 'submitDecision').mockResolvedValue({
        review: { id: 'rev-123', decision: 'approved', reason_code: 'DOCS_OK' } as any,
        updatedEntityId: 'b567d287-7333-4f93-b6d4-d50d0358e658',
        newState: 'approved',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/kyc/decision')
        .set('Authorization', 'Bearer mock-kyc-token')
        .send({
          subjectType: 'driver',
          subjectId: 'b567d287-7333-4f93-b6d4-d50d0358e658',
          decision: 'approved',
          reasonCode: 'DOCS_OK',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('newState', 'approved');
      expect(res.headers).toHaveProperty('x-correlation-id');
    });
  });
});
