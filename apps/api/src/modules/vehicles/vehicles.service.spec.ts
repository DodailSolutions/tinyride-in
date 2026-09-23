import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesService } from './vehicles.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('VehiclesService', () => {
  let service: VehiclesService;
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
        VehiclesService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  describe('registerVehicle', () => {
    it('throws BadRequestException if usable capacity exceeds physical seating capacity', async () => {
      await expect(
        service.registerVehicle('user-1', {
          registrationNumber: 'TS09AB1234',
          vehicleType: 'auto',
          seatingCapacity: 4,
          usableCapacity: 6, // Overcapacity!
          hasAttendant: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('successfully registers vehicle in pending_verification', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'vehicle_owners') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'owner-1' } }),
          };
        }
        if (table === 'vehicles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'veh-1',
                    registration_number: 'TS09AB1234',
                    usable_capacity: 4,
                    state: 'pending_verification',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await service.registerVehicle('user-1', {
        registrationNumber: 'ts 09 ab 1234',
        vehicleType: 'auto',
        seatingCapacity: 4,
        usableCapacity: 4,
        hasAttendant: false,
      });

      expect(res.id).toBe('veh-1');
      expect(res.registration_number).toBe('TS09AB1234');
      expect(res.state).toBe('pending_verification');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          reasonCode: 'VEHICLE_ONBOARDING_SUBMITTED',
        }),
      );
    });
  });

  describe('assignDriverToVehicle', () => {
    it('rejects assignment if caller does not own the vehicle', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'vehicles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'veh-1',
                vehicle_owners: { user_id: 'different-owner-user' },
              },
            }),
          };
        }
        return {};
      });

      await expect(
        service.assignDriverToVehicle('caller-user-id', {
          driverId: 'driver-1',
          vehicleId: 'veh-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('assigns driver when caller is the verified vehicle owner', async () => {
      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'vehicles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'veh-1',
                vehicle_owners: { user_id: 'owner-user-id' },
              },
            }),
          };
        }
        if (table === 'drivers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'driver-1', state: 'approved' } }),
          };
        }
        if (table === 'driver_vehicle_assignments') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'dva-1', driver_id: 'driver-1', vehicle_id: 'veh-1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await service.assignDriverToVehicle('owner-user-id', {
        driverId: 'driver-1',
        vehicleId: 'veh-1',
      });

      expect(res.id).toBe('dva-1');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          reasonCode: 'OWNER_DRIVER_ASSIGNED',
        }),
      );
    });
  });
});
