import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsService } from './schools.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('SchoolsService', () => {
  let service: SchoolsService;

  const mockSupabaseClient = {
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'school_users') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: {
                    id: 'staff-user-uuid-1',
                    school_id: 'school-uuid-oakridge',
                    staff_role: 'school_admin',
                    revoked_at: null,
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'schools') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'school-uuid-oakridge',
                  name: 'Oakridge International School',
                  address: 'Khajaguda, Hyderabad',
                  contact_phone_e164: '+914023456789',
                  am_arrive_by: '08:15:00',
                  pm_release_at: '15:30:00',
                  verification_status: 'verified',
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'children') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'child-1', school_id: 'school-uuid-oakridge' },
                error: null,
              }),
              then: (resolve: any) =>
                resolve({
                  data: [
                    {
                      id: 'child-1',
                      first_name: 'Aarav',
                      last_name: 'Sharma',
                      grade: 'Grade 3A',
                      date_of_birth: '2017-05-12',
                      medical_notes: 'Asthma inhaler in backpack',
                      child_guardians: [
                        {
                          id: 'cg-1',
                          relationship: 'mother',
                          is_emergency_contact: true,
                          can_pickup: true,
                          guardians: { full_name: 'Ananya Sharma', phone_e164: '+919876543210' },
                        },
                      ],
                      bookings: [],
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === 'trip_children') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'tc-1',
                  trip_id: 'trip-1',
                  child_id: 'child-1',
                  status: 'picked_up',
                  trips: {
                    id: 'trip-1',
                    route_schedule_id: 'sched-1',
                    route_schedules: {
                      routes: {
                        school_id: 'school-uuid-oakridge',
                      },
                    },
                  },
                },
                error: null,
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'handovers') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'handover-receipt-1',
                  trip_child_id: 'tc-1',
                  leg: 'school_receipt',
                  recorded_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'trip_child_events') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'exceptions') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'exc-gate-1',
                  exception_type: 'STUDENT_ABSENT_AT_GATE',
                  status: 'open',
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return { select: jest.fn().mockResolvedValue({ data: [] }) };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolsService,
        {
          provide: SupabaseService,
          useValue: {
            getServiceRoleClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<SchoolsService>(SchoolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should resolve authenticated school staff member school details', async () => {
    const school = await service.getMySchool('staff-user-uuid-1');
    expect(school).toBeDefined();
    expect(school.name).toBe('Oakridge International School');
    expect(school.amArriveBy).toBe('08:15:00');
  });

  it('should return student transport roster for school', async () => {
    const roster = await service.getRoster('school-uuid-oakridge');
    expect(roster).toHaveLength(1);
    expect(roster[0].fullName).toBe('Aarav Sharma');
    expect(roster[0].grade).toBe('Grade 3A');
    expect(roster[0].emergencyContact.name).toBe('Ananya Sharma');
  });

  it('should confirm school receipt and advance child status to at_school', async () => {
    const result = await service.confirmArrival(
      'school-uuid-oakridge',
      'staff-user-uuid-1',
      {
        tripChildId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        notes: 'Arrived on time',
      },
    );
    expect(result.status).toBe('confirmed');
    expect(result.childStatus).toBe('at_school');
  });

  it('should reject arrival confirmation if trip child belongs to another school', async () => {
    await expect(
      service.confirmArrival(
        'other-school-uuid-dps',
        'staff-user-uuid-1',
        {
          tripChildId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject gate release if driver or vehicle is not verified', async () => {
    await expect(
      service.confirmRelease(
        'school-uuid-oakridge',
        'staff-user-uuid-1',
        {
          tripChildId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          driverVerified: false,
          vehicleVerified: true,
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should record school gate exception for missing child', async () => {
    const exc = await service.reportException(
      'school-uuid-oakridge',
      'staff-user-uuid-1',
      {
        childId: 'child-1',
        exceptionType: 'STUDENT_ABSENT_AT_GATE',
        notes: 'Child did not report to dismissal bay',
      },
    );
    expect(exc).toBeDefined();
    expect(exc.exception_type).toBe('STUDENT_ABSENT_AT_GATE');
  });
});
