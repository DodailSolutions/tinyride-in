import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { CorrelationIdInterceptor } from '../src/common/interceptors/correlation-id.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Provide test environment variables
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.SUPABASE_URL = 'https://bfdcxaenmdomjsbvcbpj.supabase.co';
    process.env.SUPABASE_ANON_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZGN4YWVubWRvbWpzYnZjYnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDAxOTcsImV4cCI6MjEwNTY3NjE5N30.ngaWwnbpmEFjxpHYYZ-v43v3vdxNKBgUClwfb77_O1A';
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZGN4YWVubWRvbWpzYnZjYnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDEwMDE5NywiZXhwIjoyMTA1Njc2MTk3fQ.HPDqVlYay99Vo9IovoEvng4TV_JzNk8FfSg4qWk03kQ';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new CorrelationIdInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/health/liveness (GET) returns 200 OK with TinyRide brand details', async () => {
    const res = await request(app.getHttpServer()).get('/health/liveness');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'TinyRide');
    expect(res.body).toHaveProperty('company', 'Dodail Solutions Private Limited');
    expect(res.body).toHaveProperty('tagline', 'Little Rides. Big Peace of Mind.');
    expect(res.headers).toHaveProperty('x-correlation-id');
  });

  it('/non-existent-route (GET) returns standardized 404 error with correlation ID', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('correlationId');
    expect(res.headers).toHaveProperty('x-correlation-id');
  });
});
