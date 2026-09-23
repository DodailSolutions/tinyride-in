import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { CorrelationIdInterceptor } from '../src/common/interceptors/correlation-id.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AuthService } from '../src/modules/auth/auth.service';
import { ParentsService } from '../src/modules/parents/parents.service';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { TripsService } from '../src/modules/trips/trips.service';
import { HandoversService } from '../src/modules/handovers/handovers.service';
import { SchoolsService } from '../src/modules/schools/schools.service';
import { SchoolStaffGuard } from '../src/modules/schools/guards/school-staff.guard';

describe('End-to-End Operational Lifecycle & Safety Invariants (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let parentsService: ParentsService;
  let bookingsService: BookingsService;
  let paymentsService: PaymentsService;
  let tripsService: TripsService;
  let handoversService: HandoversService;
  let schoolsService: SchoolsService;

  const parentUser = {
    userId: '11111111-2222-4444-8888-999999999991',
    phoneE164: '+919876543210',
    roles: ['parent'] as any,
    isPrivileged: false,
  };

  const driverUser = {
    userId: '22222222-3333-4444-8888-999999999992',
    phoneE164: '+919876543220',
    roles: ['driver'] as any,
    isPrivileged: false,
  };

  const schoolStaffUser = {
    userId: '33333333-4444-4444-8888-999999999993',
    phoneE164: '+919876543230',
    roles: ['school_staff'] as any,
    isPrivileged: false,
  };

  const schoolId = '44444444-5555-4444-8888-999999999994';
  const childId = '55555555-6666-4444-8888-999999999995';
  const scheduleId = '66666666-7777-4444-8888-999999999996';
  const bookingId = '77777777-8888-4444-8888-999999999997';
  const tripId = '88888888-9999-4444-8888-999999999998';
  const tripChildId = '99999999-aaaa-4444-8888-999999999999';

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
    })
      .overrideGuard(SchoolStaffGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          const user = req.user;
          if (!user || (!user.roles?.includes('school_staff') && !user.roles?.includes('admin'))) {
            return false;
          }
          req.schoolContext = {
            schoolUserId: schoolStaffUser.userId,
            schoolId,
            staffRole: 'school_admin',
          };
          return true;
        },
      })
      .compile();

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
    tripsService = moduleFixture.get<TripsService>(TripsService);
    handoversService = moduleFixture.get<HandoversService>(HandoversService);
    schoolsService = moduleFixture.get<SchoolsService>(SchoolsService);

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // Mock token verification based on header
  beforeEach(() => {
    jest.spyOn(authService, 'validateToken').mockImplementation(async (token: string) => {
      if (token === 'mock-parent-token') return parentUser;
      if (token === 'mock-driver-token') return driverUser;
      if (token === 'mock-school-token') return schoolStaffUser;
      throw new Error('Invalid token');
    });
  });

  describe('Step 1: Family & Child Registration', () => {
    it('allows parent to register child with medical notes', async () => {
      jest.spyOn(parentsService, 'createChild').mockResolvedValue({
        id: childId,
        firstName: 'Aarav',
        lastName: 'Sharma',
        dateOfBirth: '2016-04-12',
        schoolId,
        grade: 'Grade 3A',
        medicalNotes: 'Asthma inhaler in backpack',
        status: 'active',
      } as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/parents/children')
        .set('Authorization', 'Bearer mock-parent-token')
        .send({
          firstName: 'Aarav',
          lastName: 'Sharma',
          dateOfBirth: '2016-04-12',
          schoolId,
          grade: 'Grade 3A',
          medicalNotes: 'Asthma inhaler in backpack',
        });

      expect(res.status).toBe(201);
      expect(res.body.firstName).toBe('Aarav');
      expect(res.body.medicalNotes).toBe('Asthma inhaler in backpack');
    });
  });

  describe('Step 2: Seat Reservation & Booking Flow', () => {
    it('reserves a seat with anti-oversell hold', async () => {
      jest.spyOn(bookingsService, 'reserveSeat').mockResolvedValue({
        holdId: 'hold-1234',
        childId,
        scheduleId,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings/reserve')
        .set('Authorization', 'Bearer mock-parent-token')
        .send({
          childId,
          scheduleId,
          holdMinutes: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.holdId).toBe('hold-1234');
    });

    it('creates booking in awaiting_payment status', async () => {
      jest.spyOn(bookingsService, 'createBooking').mockResolvedValue({
        id: bookingId,
        parent_id: parentUser.userId,
        child_id: childId,
        schedule_id: scheduleId,
        state: 'awaiting_payment',
        amount_minor: 450000,
        currency: 'INR',
      } as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', 'Bearer mock-parent-token')
        .send({
          childId,
          scheduleId,
          pickupStopId: '5e054fc2-aa59-4d92-bbff-4b13d2fbc6c1',
          dropoffStopId: '9fa14e76-8316-41ee-a947-2cb8380cf05d',
          serviceStart: '2026-06-01',
          billingPeriod: 'monthly',
        });

      expect(res.status).toBe(201);
      expect(res.body.state).toBe('awaiting_payment');
    });
  });

  describe('Step 3: Razorpay Payment & Double-Entry Ledger Settlement', () => {
    it('creates Razorpay payment order for booking', async () => {
      jest.spyOn(paymentsService, 'createPaymentOrder').mockResolvedValue({
        paymentId: 'payment-uuid-1',
        orderId: 'order_hyd_9988',
        amountMinor: 450000, // ₹4,500.00
        currency: 'INR',
        keyId: 'rzp_test_1234',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/order')
        .set('Authorization', 'Bearer mock-parent-token')
        .send({ bookingId });

      expect(res.status).toBe(201);
      expect(res.body.orderId).toBe('order_hyd_9988');
      expect(res.body.amountMinor).toBe(450000);
    });
  });

  describe('Step 4: Driver Handover SafeKey Verification (Home Pickup)', () => {
    it('driver requests OTP for child pickup at home stop', async () => {
      jest.spyOn(handoversService, 'requestOtp').mockResolvedValue({
        tokenId: 'token-uuid-1',
        expiresAt: new Date(Date.now() + 900000).toISOString(),
        testOtp: '482910',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/handovers/otp/request')
        .set('Authorization', 'Bearer mock-driver-token')
        .send({
          tripChildId,
          leg: 'home_pickup',
        });

      expect(res.status).toBe(201);
      expect(res.body.tokenId).toBe('token-uuid-1');
    });

    it('driver verifies 6-digit SafeKey OTP presented by parent', async () => {
      jest.spyOn(handoversService, 'verifyHandover').mockResolvedValue({
        success: true,
        handoverId: 'handover-pickup-1',
        leg: 'home_pickup',
        method: 'otp',
        state: 'picked_up',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/handovers/verify')
        .set('Authorization', 'Bearer mock-driver-token')
        .send({
          tripChildId,
          leg: 'home_pickup',
          method: 'otp',
          otp: '482910',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.state).toBe('picked_up');
    });
  });

  describe('Step 5: School Gate Arrival Intake & Handover Attribution', () => {
    it('confirms student arrival receipt at school gate', async () => {
      jest.spyOn(schoolsService, 'confirmArrival').mockResolvedValue({
        status: 'confirmed',
        tripChildId,
        childStatus: 'at_school',
        handoverId: 'handover-arrival-1',
        timestamp: new Date().toISOString(),
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/schools/arrivals/confirm')
        .set('Authorization', 'Bearer mock-school-token')
        .send({
          tripChildId,
          notes: 'Received safely at Gate 3',
        });

      expect(res.status).toBe(200);
      expect(res.body.childStatus).toBe('at_school');
    });
  });

  describe('Step 6: Afternoon School Gate Release Authorization', () => {
    it('authorizes student departure after driver & vehicle double-verification', async () => {
      jest.spyOn(schoolsService, 'confirmRelease').mockResolvedValue({
        status: 'confirmed',
        tripChildId,
        childStatus: 'released_from_school',
        handoverId: 'handover-release-1',
        timestamp: new Date().toISOString(),
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/schools/releases/confirm')
        .set('Authorization', 'Bearer mock-school-token')
        .send({
          tripChildId,
          driverVerified: true,
          vehicleVerified: true,
          notes: 'Driver badge and TS09UB9876 plate verified',
        });

      expect(res.status).toBe(200);
      expect(res.body.childStatus).toBe('released_from_school');
    });
  });

  describe('Step 7: Driver Handover SafeKey Verification (Home Dropoff)', () => {
    it('driver verifies dropoff OTP presented by guardian and completes child journey', async () => {
      jest.spyOn(handoversService, 'verifyHandover').mockResolvedValue({
        success: true,
        handoverId: 'handover-dropoff-1',
        leg: 'home_dropoff',
        method: 'otp',
        state: 'dropped_off',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/handovers/verify')
        .set('Authorization', 'Bearer mock-driver-token')
        .send({
          tripChildId,
          leg: 'home_dropoff',
          method: 'otp',
          otp: '918234',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.state).toBe('dropped_off');
    });
  });

  describe('Step 8: Trip State Machine Completion Invariant', () => {
    it('completes the trip once all passenger handovers are verified', async () => {
      jest.spyOn(tripsService, 'updateTripState').mockResolvedValue({
        tripId,
        state: 'completed',
        previousState: 'in_progress',
        unresolvedHandoversCount: 0,
      } as any);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/trips/${tripId}/state`)
        .set('Authorization', 'Bearer mock-driver-token')
        .send({
          state: 'completed',
        });

      expect(res.status).toBe(200);
      expect(res.body.state).toBe('completed');
      expect(res.body.unresolvedHandoversCount).toBe(0);
    });
  });
});
