import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { CorrelationIdInterceptor } from '../src/common/interceptors/correlation-id.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AuthService } from '../src/modules/auth/auth.service';

describe('AuthController & Security (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3002';
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

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/v1/auth/otp/send', () => {
    it('rejects invalid phone number with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/otp/send')
        .send({ phoneE164: 'not-a-phone-number' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errMsg = Array.isArray(res.body.error.message)
        ? res.body.error.message[0]
        : res.body.error.message;
      expect(errMsg).toMatch(/phoneE164 must be a valid E.164/);
      expect(res.headers).toHaveProperty('x-correlation-id');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toMatch(/unauthorized/i);
      expect(res.headers).toHaveProperty('x-correlation-id');
    });

    it('rejects malformed authorization header with 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Token malformed');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Malformed Authorization header/);
    });

    it('returns 200 OK and authenticated profile when valid Bearer token provided', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'test-user-123',
        phoneE164: '+919876543210',
        email: 'parent@example.com',
        roles: ['parent'],
        isPrivileged: false,
      });

      jest.spyOn(authService, 'getMe').mockResolvedValue({
        id: 'test-user-123',
        phoneE164: '+919876543210',
        displayName: 'Aarav Parent',
        email: 'parent@example.com',
        state: 'active',
        roles: ['parent'],
        isPrivileged: false,
        parentId: 'parent-record-uuid',
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer mock-valid-jwt-token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 'test-user-123');
      expect(res.body).toHaveProperty('roles', ['parent']);
      expect(res.body).toHaveProperty('parentId', 'parent-record-uuid');
      expect(res.headers).toHaveProperty('x-correlation-id');
    });
  });
});
