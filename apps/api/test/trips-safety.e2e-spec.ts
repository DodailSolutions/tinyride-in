import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { CorrelationIdInterceptor } from '../src/common/interceptors/correlation-id.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AuthService } from '../src/modules/auth/auth.service';
import { TripsService } from '../src/modules/trips/trips.service';
import { HandoversService } from '../src/modules/handovers/handovers.service';
import { SafetyService } from '../src/modules/safety/safety.service';

describe('Daily Trips & Safety Ops Pipeline (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let tripsService: TripsService;
  let handoversService: HandoversService;
  let safetyService: SafetyService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3005';
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
    tripsService = moduleFixture.get<TripsService>(TripsService);
    handoversService = moduleFixture.get<HandoversService>(HandoversService);
    safetyService = moduleFixture.get<SafetyService>(SafetyService);

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/v1/trips/generate (Trip Generation)', () => {
    it('allows operators to trigger trip generation for date', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'operator-user-1',
        phoneE164: '+919876543299',
        roles: ['operator'],
        isPrivileged: true,
      });

      jest.spyOn(tripsService, 'generateTrips').mockResolvedValue({
        date: '2026-06-01',
        tripsCreated: 2,
        manifestEntriesCreated: 14,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/trips/generate')
        .set('Authorization', 'Bearer mock-operator-token')
        .send({ date: '2026-06-01' });

      expect(res.status).toBe(201);
      expect(res.body.tripsCreated).toBe(2);
      expect(res.body.manifestEntriesCreated).toBe(14);
    });

    it('rejects trip generation from unauthorized parents (403 Forbidden)', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'parent-user-1',
        phoneE164: '+919876543210',
        roles: ['parent'],
        isPrivileged: false,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/trips/generate')
        .set('Authorization', 'Bearer mock-parent-token')
        .send({ date: '2026-06-01' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Requires one of role\(s\): \[operator, admin\]/);
    });
  });

  describe('Child Handover Verification Flow', () => {
    it('requests OTP token for pickup leg', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'driver-user-1',
        phoneE164: '+919876543211',
        roles: ['driver'],
        isPrivileged: false,
      });

      jest.spyOn(handoversService, 'requestOtp').mockResolvedValue({
        tokenId: 'token-uuid-1',
        expiresAt: '2026-06-01T08:15:00Z',
        testOtp: '4589',
      });

      const validTripChildId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

      const res = await request(app.getHttpServer())
        .post('/api/v1/handovers/otp/request')
        .set('Authorization', 'Bearer mock-driver-token')
        .send({
          tripChildId: validTripChildId,
          leg: 'home_pickup',
        });

      expect(res.status).toBe(201);
      expect(res.body.tokenId).toBe('token-uuid-1');
    });

    it('verifies pickup handover with OTP and transitions child state', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'driver-user-1',
        phoneE164: '+919876543211',
        roles: ['driver'],
        isPrivileged: false,
      });

      jest.spyOn(handoversService, 'verifyHandover').mockResolvedValue({
        success: true,
        handoverId: 'handover-uuid-1',
        leg: 'home_pickup',
        method: 'otp',
        state: 'picked_up',
      });

      const validTripChildId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

      const res = await request(app.getHttpServer())
        .post('/api/v1/handovers/verify')
        .set('Authorization', 'Bearer mock-driver-token')
        .send({
          tripChildId: validTripChildId,
          leg: 'home_pickup',
          method: 'otp',
          otp: '4589',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.state).toBe('picked_up');
    });
  });

  describe('Safety Exceptions & Incidents', () => {
    it('creates operational safety exception with SLA timer', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'driver-user-1',
        phoneE164: '+919876543211',
        roles: ['driver'],
        isPrivileged: false,
      });

      jest.spyOn(safetyService, 'createException').mockResolvedValue({
        id: 'exc-uuid-1',
        exceptionType: 'handover_failed',
        severity: 'high',
        state: 'open',
        title: 'Child not present at designated stop',
        autoRaised: false,
        slaDueAt: '2026-06-01T10:00:00Z',
        createdAt: '2026-06-01T06:00:00Z',
      } as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/safety/exceptions')
        .set('Authorization', 'Bearer mock-driver-token')
        .send({
          exceptionType: 'handover_failed',
          severity: 'high',
          title: 'Child not present at designated stop',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('exc-uuid-1');
      expect(res.body.severity).toBe('high');
    });

    it('creates formal safety incident and closes with approval', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'operator-user-1',
        phoneE164: '+919876543299',
        roles: ['operator'],
        isPrivileged: true,
      });

      jest.spyOn(safetyService, 'createIncident').mockResolvedValue({
        id: 'inc-uuid-1',
        reference: 'INC-20260601-ABC123',
        severity: 'critical',
        status: 'open',
        category: 'safety_handover',
        summary: 'Wrong pickup vehicle attempted handover',
        reportedByUserId: 'operator-user-1',
        createdAt: '2026-06-01T06:00:00Z',
      } as any);

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/safety/incidents')
        .set('Authorization', 'Bearer mock-operator-token')
        .send({
          severity: 'critical',
          category: 'safety_handover',
          summary: 'Wrong pickup vehicle attempted handover',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.reference).toBe('INC-20260601-ABC123');

      // Close incident
      const validIncidentId = 'e2d1d054-933d-4c3e-967a-1158a74e5087';
      const validAdminId = 'd3b07384-d113-4a15-b778-98e3b5df9a20';

      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: validAdminId,
        phoneE164: '+919876543298',
        roles: ['admin'],
        isPrivileged: true,
      });

      jest.spyOn(safetyService, 'closeIncident').mockResolvedValue({
        id: validIncidentId,
        reference: 'INC-20260601-ABC123',
        status: 'closed',
        closedAt: '2026-06-01T09:00:00Z',
      } as any);

      const closeRes = await request(app.getHttpServer())
        .patch(`/api/v1/safety/incidents/${validIncidentId}/close`)
        .set('Authorization', 'Bearer mock-admin-token')
        .send({
          closureNote: 'Investigation resolved. Misunderstanding cleared with school authority.',
          closureApprovedBy: validAdminId,
        });

      expect(closeRes.status).toBe(200);
      expect(closeRes.body.status).toBe('closed');
    });
  });
});
