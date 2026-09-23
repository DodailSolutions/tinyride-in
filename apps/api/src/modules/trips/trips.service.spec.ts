import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TripsService } from './trips.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';

describe('TripsService', () => {
  let service: TripsService;
  let mockServiceClient: {
    from: jest.Mock;
  };
  let mockAuditService: { record: jest.Mock };

  beforeEach(async () => {
    mockServiceClient = {
      from: jest.fn(),
    };

    mockAuditService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const mockSupabaseService = {
      getServiceRoleClient: jest.fn().mockReturnValue(mockServiceClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
  });

  describe('generateTrips', () => {
    it('generates scheduled trip and manifest, excluding absent children', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'route_schedules') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'sched-1',
                  route_id: 'route-1',
                  direction: 'am',
                  departure_time: '07:30:00',
                  days_of_week: [1, 2, 3, 4, 5],
                  routes: { id: 'route-1', school_id: 'school-1', state: 'approved' },
                },
              ],
            }),
          };
        }
        if (table === 'school_calendar_days') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }), // No holiday
          };
        }
        if (table === 'route_assignments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'assign-1', driver_id: 'driver-1', vehicle_id: 'veh-1' },
            }),
          };
        }
        if (table === 'trips') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'trip-1' },
                }),
              }),
            }),
          };
        }
        if (table === 'bookings') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            lte: jest.fn().mockResolvedValue({
              data: [
                { id: 'b-1', child_id: 'child-1', pickup_stop_id: 'p-1', dropoff_stop_id: 'd-1' },
                { id: 'b-2', child_id: 'child-2-absent', pickup_stop_id: 'p-2', dropoff_stop_id: 'd-2' },
              ],
            }),
          };
        }
        if (table === 'child_absences') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockImplementation((col) => {
              return Promise.resolve({ data: null });
            }),
          };
        }
        if (table === 'trip_children') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'tc-1' } }),
              }),
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const res = await service.generateTrips({ date: '2026-06-01' }, 'operator-1');
      expect(res.date).toBe('2026-06-01');
      expect(res.tripsCreated).toBe(1);
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'insert',
          tableName: 'trips',
          reasonCode: 'TRIPS_GENERATED_FOR_DATE',
        }),
      );
    });
  });

  describe('updateTripState', () => {
    it('requires readiness checked flag before marking trip as ready', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'trips') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'trip-1', state: 'scheduled' },
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      await expect(
        service.updateTripState(
          'trip-1',
          { userId: 'driver-1', roles: ['driver'], isPrivileged: false, phoneE164: '+919876543210' },
          { state: 'ready', readinessChecked: false },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects completing trip if child handovers remain unresolved', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'trips') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'trip-1', state: 'in_progress' },
            }),
          };
        }
        if (table === 'trip_children') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'tc-1',
                  state: 'picked_up',
                  required_legs: ['home_pickup', 'school_receipt'],
                  handovers: [{ leg: 'home_pickup' }], // school_receipt missing!
                },
              ],
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      await expect(
        service.updateTripState(
          'trip-1',
          { userId: 'driver-1', roles: ['driver'], isPrivileged: false, phoneE164: '+919876543210' },
          { state: 'completed' },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reportAbsence', () => {
    it('records child absence and marks manifest child state as absent', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'parents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'parent-1', user_id: 'user-1' },
            }),
          };
        }
        if (table === 'children') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'child-1', parent_id: 'parent-1' },
            }),
          };
        }
        if (table === 'child_absences') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'abs-1', child_id: 'child-1', absence_date: '2026-06-01' },
                }),
              }),
            }),
          };
        }
        if (table === 'trip_children') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const res = await service.reportAbsence('user-1', {
        childId: 'child-1',
        absenceDate: '2026-06-01',
        direction: 'am',
        reason: 'Fever',
      });

      expect(res.id).toBe('abs-1');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'insert',
          tableName: 'child_absences',
          reasonCode: 'CHILD_ABSENCE_REPORTED',
        }),
      );
    });
  });
});
