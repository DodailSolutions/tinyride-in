import { Test, TestingModule } from '@nestjs/testing';
import { RoutesService } from './routes.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RoutesService', () => {
  let service: RoutesService;
  let mockServiceClient: { from: jest.Mock };
  let mockAuditService: { record: jest.Mock };

  beforeEach(async () => {
    mockServiceClient = { from: jest.fn() };
    mockAuditService = { record: jest.fn().mockResolvedValue(undefined) };

    const mockSupabaseService = {
      getServiceRoleClient: jest.fn().mockReturnValue(mockServiceClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutesService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<RoutesService>(RoutesService);
  });

  describe('assignSchedule safety invariants', () => {
    it('rejects assignment if driver is not approved', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'route_schedules') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'sched-1', seats_offered: 4 } }),
          };
        }
        if (table === 'drivers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'driver-1', state: 'pending_verification' }, // Not approved!
            }),
          };
        }
        return {};
      });

      await expect(
        service.assignSchedule('admin-user', {
          scheduleId: 'sched-1',
          driverId: 'driver-1',
          vehicleId: 'veh-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects assignment if vehicle is not approved', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'route_schedules') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'sched-1', seats_offered: 4 } }),
          };
        }
        if (table === 'drivers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'driver-1', state: 'approved' } }),
          };
        }
        if (table === 'vehicles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'veh-1', state: 'pending_verification', usable_capacity: 4 }, // Not approved!
            }),
          };
        }
        return {};
      });

      await expect(
        service.assignSchedule('admin-user', {
          scheduleId: 'sched-1',
          driverId: 'driver-1',
          vehicleId: 'veh-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects assignment if seats offered exceeds vehicle usable capacity', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'route_schedules') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'sched-1', seats_offered: 6 } }),
          };
        }
        if (table === 'drivers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'driver-1', state: 'approved' } }),
          };
        }
        if (table === 'vehicles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'veh-1', state: 'approved', usable_capacity: 4 }, // Capacity is 4, offered is 6!
            }),
          };
        }
        return {};
      });

      await expect(
        service.assignSchedule('admin-user', {
          scheduleId: 'sched-1',
          driverId: 'driver-1',
          vehicleId: 'veh-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('successfully assigns schedule when all safety checks pass', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'route_schedules') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'sched-1', seats_offered: 4 } }),
          };
        }
        if (table === 'drivers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'driver-1', state: 'approved' } }),
          };
        }
        if (table === 'vehicles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'veh-1', state: 'approved', usable_capacity: 4 },
            }),
          };
        }
        if (table === 'driver_vehicle_assignments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'dva-1' } }),
          };
        }
        if (table === 'route_assignments') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'assign-1', schedule_id: 'sched-1', driver_id: 'driver-1', vehicle_id: 'veh-1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await service.assignSchedule('admin-user', {
        scheduleId: 'sched-1',
        driverId: 'driver-1',
        vehicleId: 'veh-1',
      });

      expect(res.id).toBe('assign-1');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          reasonCode: 'DRIVER_VEHICLE_ASSIGNED_TO_SCHEDULE',
        }),
      );
    });
  });
});
