import { Test, TestingModule } from '@nestjs/testing';
import { OpsService } from './ops.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';

describe('OpsService', () => {
  let service: OpsService;

  const mockSupabaseClient = {
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'trips') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'e2d1d054-933d-4c3e-967a-1158a74e5087',
                    trip_number: 'TRIP-HYD-001',
                    service_date: '2026-09-23',
                    state: 'in_progress',
                    route_schedule_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
                    driver_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
                    vehicle_id: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f',
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'driver_profiles' || table === 'vehicles' || table === 'routes') {
        const resultPromise: any = Promise.resolve({
          count: 2,
          data: {
            id: 'mock-id',
            profiles: { full_name: 'Ramesh Kumar' },
            registration_number: 'TS09UB1234',
            seating_capacity: 7,
          },
        });
        resultPromise.maybeSingle = jest.fn().mockResolvedValue({
          data: {
            id: 'mock-id',
            profiles: { full_name: 'Ramesh Kumar' },
            registration_number: 'TS09UB1234',
            seating_capacity: 7,
          },
        });
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(resultPromise),
          }),
        };
      }
      if (table === 'exceptions' || table === 'incidents') {
        const eqFn = jest.fn().mockResolvedValue({ count: 1 });
        const chainableEq = jest.fn().mockReturnValue({
          eq: eqFn,
          then: (resolve: any) => resolve({ count: 1 }),
        });
        return {
          select: jest.fn().mockReturnValue({
            eq: chainableEq,
            in: jest.fn().mockResolvedValue({ count: 0 }),
          }),
        };
      }
      if (table === 'ledger_entries') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockResolvedValue({
                data: [{ amount_paise: -75000 }],
              }),
            }),
          }),
        };
      }
      if (table === 'trip_children') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                { id: '1', status: 'picked_up', is_absent: false },
                { id: '2', status: 'at_school', is_absent: false },
              ],
            }),
            in: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 1 }),
            }),
          }),
        };
      }
      if (table === 'route_schedules') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
                  routes: { id: 'r1', name: 'Madhapur Express', schools: { name: 'Oakridge International' } },
                },
              }),
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { full_name: 'Ramesh Kumar', registration_number: 'TS09UB1234', seating_capacity: 7 },
            }),
          }),
        }),
      };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpsService,
        {
          provide: SupabaseService,
          useValue: {
            getServiceRoleClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<OpsService>(OpsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should compute operational overview metrics correctly', async () => {
    const overview = await service.getDashboardOverview();
    expect(overview).toBeDefined();
    expect(overview.pendingKycCount).toBe(6); // 2 drivers + 2 vehicles + 2 routes
    expect(overview.openExceptionsCount).toBe(1);
    expect(overview.todayRevenuePaise).toBe(75000);
  });

  it('should aggregate live trip summaries with children handover count', async () => {
    const liveTrips = await service.getLiveTrips();
    expect(liveTrips).toHaveLength(1);
    expect(liveTrips[0].tripNumber).toBe('TRIP-HYD-001');
    expect(liveTrips[0].state).toBe('in_progress');
    expect(liveTrips[0].childrenTotal).toBe(2);
    expect(liveTrips[0].childrenCompletedHandovers).toBe(1); // 1 is at_school
  });
});
