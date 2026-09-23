import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { CorrelationIdInterceptor } from '../src/common/interceptors/correlation-id.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AuthService } from '../src/modules/auth/auth.service';
import { SchoolsService } from '../src/modules/schools/schools.service';
import { SchoolStaffGuard } from '../src/modules/schools/guards/school-staff.guard';

describe('School Portal Pipeline (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let schoolsService: SchoolsService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3007';
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
            schoolUserId: 'staff-uuid-1',
            schoolId: 'school-uuid-oakridge',
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
    schoolsService = moduleFixture.get<SchoolsService>(SchoolsService);

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('School Staff Authentication & Profile', () => {
    it('rejects unauthenticated request to /schools/my-school (401)', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/schools/my-school');
      expect(res.status).toBe(401);
    });

    it('rejects parent role without school_staff role (403 Forbidden)', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValueOnce({
        userId: 'parent-user-1',
        phoneE164: '+919876543210',
        email: 'parent@example.com',
        roles: ['parent'],
        isPrivileged: false,
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/schools/my-school')
        .set('Authorization', 'Bearer mock-parent-token');

      expect(res.status).toBe(403);
    });

    it('returns school details for authenticated school_staff', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValueOnce({
        userId: 'staff-user-1',
        phoneE164: '+919876543210',
        email: 'staff@oakridge.edu',
        roles: ['school_staff'],
        isPrivileged: false,
      });

      jest.spyOn(schoolsService, 'getMySchool').mockResolvedValueOnce({
        id: 'school-uuid-oakridge',
        name: 'Oakridge International School',
        address: 'Khajaguda, Hyderabad',
        contactPhone: '+914023456789',
        amArriveBy: '08:15:00',
        pmReleaseAt: '15:30:00',
        verificationStatus: 'verified',
        staffRole: 'school_admin',
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/schools/my-school')
        .set('Authorization', 'Bearer mock-staff-token');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Oakridge International School');
      expect(res.body.staffRole).toBe('school_admin');
    });
  });

  describe('Morning Arrival & Afternoon Release Gate Checks', () => {
    it('confirms morning student arrival receipt at school gate', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValueOnce({
        userId: 'staff-user-1',
        phoneE164: '+919876543210',
        email: 'staff@oakridge.edu',
        roles: ['school_staff'],
        isPrivileged: false,
      });

      jest.spyOn(schoolsService, 'confirmArrival').mockResolvedValueOnce({
        status: 'confirmed',
        tripChildId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        childStatus: 'at_school',
        handoverId: 'handover-receipt-1',
        timestamp: new Date().toISOString(),
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/schools/arrivals/confirm')
        .set('Authorization', 'Bearer mock-staff-token')
        .send({
          tripChildId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          notes: 'Received at school main gate',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('confirmed');
      expect(res.body.childStatus).toBe('at_school');
    });

    it('rejects gate release authorization if driver or vehicle is unverified (400)', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValueOnce({
        userId: 'staff-user-1',
        phoneE164: '+919876543210',
        email: 'staff@oakridge.edu',
        roles: ['school_staff'],
        isPrivileged: false,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/schools/releases/confirm')
        .set('Authorization', 'Bearer mock-staff-token')
        .send({
          tripChildId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          driverVerified: false,
          vehicleVerified: true,
        });

      expect(res.status).toBe(400);
    });

    it('authorizes afternoon gate release with positive driver and vehicle verification', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValueOnce({
        userId: 'staff-user-1',
        phoneE164: '+919876543210',
        email: 'staff@oakridge.edu',
        roles: ['school_staff'],
        isPrivileged: false,
      });

      jest.spyOn(schoolsService, 'confirmRelease').mockResolvedValueOnce({
        status: 'confirmed',
        tripChildId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        childStatus: 'released_from_school',
        handoverId: 'handover-release-1',
        timestamp: new Date().toISOString(),
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/schools/releases/confirm')
        .set('Authorization', 'Bearer mock-staff-token')
        .send({
          tripChildId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          driverVerified: true,
          vehicleVerified: true,
          notes: 'Released to regular van driver Suresh',
        });

      expect(res.status).toBe(200);
      expect(res.body.childStatus).toBe('released_from_school');
    });
  });
});
