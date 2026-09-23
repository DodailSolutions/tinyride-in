import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { CorrelationIdInterceptor } from '../src/common/interceptors/correlation-id.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AuthService } from '../src/modules/auth/auth.service';
import { ParentsService } from '../src/modules/parents/parents.service';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { PaymentsService } from '../src/modules/payments/payments.service';

describe('Booking & Payments Pipeline (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let parentsService: ParentsService;
  let bookingsService: BookingsService;
  let paymentsService: PaymentsService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3004';
    process.env.SUPABASE_URL = 'https://bfdcxaenmdomjsbvcbpj.supabase.co';
    process.env.SUPABASE_ANON_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZGN4YWVubWRvbWpzYnZjYnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDAxOTcsImV4cCI6MjEwNTY3NjE5N30.ngaWwnbpmEFjxpHYYZ-v43v3vdxNKBgUClwfb77_O1A';
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZGN4YWVubWRvbWpzYnZjYnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDEwMDE5NywiZXhwIjoyMTA1Njc2MTk3fQ.HPDqVlYay99Vo9IovoEvng4TV_JzNk8FfSg4qWk03kQ';
    process.env.RAZORPAY_KEY_ID = 'rzp_test_e2e';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'secret_webhook_e2e';

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
    parentsService = moduleFixture.get<ParentsService>(ParentsService);
    bookingsService = moduleFixture.get<BookingsService>(BookingsService);
    paymentsService = moduleFixture.get<PaymentsService>(PaymentsService);

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Parent & Child Registration', () => {
    it('creates a child record under authenticated parent', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'parent-user-1',
        phoneE164: '+919876543210',
        email: 'parent@example.com',
        roles: ['parent'],
        isPrivileged: false,
      });

      jest.spyOn(parentsService, 'createChild').mockResolvedValue({
        id: '2a492f25-b46f-40e9-9189-e1fb6a5e04cb',
        parent_id: 'parent-1',
        school_id: '8cb385bc-66ae-4328-8742-8328eb97eeb4',
        first_name: 'Aarav',
        last_name: 'Sharma',
        date_of_birth: '2018-05-15',
        status: 'active',
      } as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/parents/children')
        .set('Authorization', 'Bearer mock-parent-token')
        .send({
          firstName: 'Aarav',
          lastName: 'Sharma',
          schoolId: '8cb385bc-66ae-4328-8742-8328eb97eeb4',
          dateOfBirth: '2018-05-15',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('2a492f25-b46f-40e9-9189-e1fb6a5e04cb');
      expect(res.body.first_name).toBe('Aarav');
    });

    it('rejects child creation with invalid dateOfBirth format (ValidationPipe)', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'parent-user-1',
        phoneE164: '+919876543210',
        roles: ['parent'],
        isPrivileged: false,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/parents/children')
        .set('Authorization', 'Bearer mock-parent-token')
        .send({
          firstName: 'Aarav',
          schoolId: '8cb385bc-66ae-4328-8742-8328eb97eeb4',
          dateOfBirth: '15-05-2018', // Invalid format
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const msg = Array.isArray(res.body.error.message)
        ? res.body.error.message.join(' ')
        : res.body.error.message;
      expect(msg).toMatch(/dateOfBirth must be in YYYY-MM-DD format/);
    });
  });

  describe('Seat Hold & Booking Lifecycle', () => {
    it('creates a transactional seat reservation hold', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'parent-user-1',
        phoneE164: '+919876543210',
        roles: ['parent'],
        isPrivileged: false,
      });

      jest.spyOn(bookingsService, 'reserveSeat').mockResolvedValue({
        id: 'hold-uuid-1',
        schedule_id: '42b827e8-54e7-4974-9f79-c5c9ee17f5ea',
        child_id: '2a492f25-b46f-40e9-9189-e1fb6a5e04cb',
        parent_id: 'parent-1',
        seat_count: 1,
        expires_at: '2026-09-23T05:00:00.000Z',
      } as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings/reserve')
        .set('Authorization', 'Bearer mock-parent-token')
        .send({
          scheduleId: '42b827e8-54e7-4974-9f79-c5c9ee17f5ea',
          childId: '2a492f25-b46f-40e9-9189-e1fb6a5e04cb',
          holdMinutes: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('hold-uuid-1');
      expect(res.body.seat_count).toBe(1);
    });

    it('creates formal booking transitioning to awaiting_payment', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'parent-user-1',
        phoneE164: '+919876543210',
        roles: ['parent'],
        isPrivileged: false,
      });

      jest.spyOn(bookingsService, 'createBooking').mockResolvedValue({
        id: '6ff1fb91-b3b3-466a-8531-1e967a57a877',
        parent_id: 'parent-1',
        child_id: '2a492f25-b46f-40e9-9189-e1fb6a5e04cb',
        schedule_id: '42b827e8-54e7-4974-9f79-c5c9ee17f5ea',
        state: 'awaiting_payment',
        amount_minor: 450000,
        currency: 'INR',
      } as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', 'Bearer mock-parent-token')
        .send({
          childId: '2a492f25-b46f-40e9-9189-e1fb6a5e04cb',
          scheduleId: '42b827e8-54e7-4974-9f79-c5c9ee17f5ea',
          pickupStopId: '5e054fc2-aa59-4d92-bbff-4b13d2fbc6c1',
          dropoffStopId: '9fa14e76-8316-41ee-a947-2cb8380cf05d',
          serviceStart: '2026-06-01',
          billingPeriod: 'monthly',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('6ff1fb91-b3b3-466a-8531-1e967a57a877');
      expect(res.body.state).toBe('awaiting_payment');
      expect(res.body.amount_minor).toBe(450000);
    });
  });

  describe('Payments & Razorpay Webhook', () => {
    it('generates a Razorpay payment order for booking', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        userId: 'parent-user-1',
        phoneE164: '+919876543210',
        roles: ['parent'],
        isPrivileged: false,
      });

      jest.spyOn(paymentsService, 'createPaymentOrder').mockResolvedValue({
        paymentId: '802f1a60-93cb-4f3d-9d41-55f69f20c427',
        orderId: 'order_rzp_mock_12345',
        amountMinor: 450000,
        currency: 'INR',
        keyId: 'rzp_test_e2e',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/order')
        .set('Authorization', 'Bearer mock-parent-token')
        .send({
          bookingId: '6ff1fb91-b3b3-466a-8531-1e967a57a877',
        });

      expect(res.status).toBe(201);
      expect(res.body.orderId).toBe('order_rzp_mock_12345');
      expect(res.body.keyId).toBe('rzp_test_e2e');
    });

    it('processes public webhook with HMAC verification and confirms booking', async () => {
      const payload = {
        event: 'payment.captured',
        event_id: 'evt_rzp_webhook_999',
        payload: {
          payment: {
            entity: {
              id: 'pay_987654321',
              order_id: 'order_rzp_mock_12345',
              amount: 450000,
            },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', 'secret_webhook_e2e')
        .update(rawBody)
        .digest('hex');

      jest.spyOn(paymentsService, 'handleWebhook').mockResolvedValue({
        status: 'processed',
        event: 'payment.captured',
        eventId: 'evt_rzp_webhook_999',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook/razorpay')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('processed');
      expect(res.body.event).toBe('payment.captured');
    });
  });
});
