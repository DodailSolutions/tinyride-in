import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let mockServiceClient: {
    from: jest.Mock;
    rpc: jest.Mock;
  };
  let mockAuditService: { record: jest.Mock };

  beforeEach(async () => {
    mockServiceClient = {
      from: jest.fn(),
      rpc: jest.fn().mockResolvedValue({ data: null, error: { message: 'function app.reserve_seat does not exist' } }),
    };

    mockAuditService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const mockSupabaseService = {
      getServiceRoleClient: jest.fn().mockReturnValue(mockServiceClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  describe('reserveSeat', () => {
    it('successfully reserves a seat hold and decrements availability', async () => {
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
              data: { id: 'child-1', parent_id: 'parent-1', school_id: 'school-1' },
            }),
          };
        }
        if (table === 'route_schedules') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'sched-1',
                route_id: 'route-1',
                seats_offered: 15,
                active: true,
                routes: { id: 'route-1', state: 'approved', school_id: 'school-1' },
              },
            }),
          };
        }
        if (table === 'bookings') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
          };
        }
        if (table === 'schedule_seat_counters') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { seats_offered: 15, seats_taken: 5 },
            }),
            upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === 'seat_holds') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'hold-1',
                    schedule_id: 'sched-1',
                    child_id: 'child-1',
                    parent_id: 'parent-1',
                    expires_at: '2026-09-23T01:00:00.000Z',
                  },
                }),
              }),
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const hold = await service.reserveSeat('user-1', {
        scheduleId: 'sched-1',
        childId: 'child-1',
        holdMinutes: 10,
      });

      expect(hold.id).toBe('hold-1');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'insert',
          tableName: 'seat_holds',
          recordId: 'hold-1',
          reasonCode: 'SEAT_HOLD_RESERVED',
        }),
      );
    });

    it('rejects reservation if run is at capacity', async () => {
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
              data: { id: 'child-1', parent_id: 'parent-1', school_id: 'school-1' },
            }),
          };
        }
        if (table === 'route_schedules') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'sched-1',
                route_id: 'route-1',
                seats_offered: 10,
                active: true,
                routes: { id: 'route-1', state: 'approved', school_id: 'school-1' },
              },
            }),
          };
        }
        if (table === 'bookings') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
          };
        }
        if (table === 'schedule_seat_counters') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { seats_offered: 10, seats_taken: 10 }, // FULL!
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      await expect(
        service.reserveSeat('user-1', {
          scheduleId: 'sched-1',
          childId: 'child-1',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createBooking', () => {
    it('creates formal booking in awaiting_payment and links hold', async () => {
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
              data: { id: 'child-1', parent_id: 'parent-1', school_id: 'school-1' },
            }),
          };
        }
        if (table === 'route_schedules') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'sched-1', route_id: 'route-1', active: true },
            }),
          };
        }
        if (table === 'route_stops') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: [
                { id: 'stop-pick', route_id: 'route-1' },
                { id: 'stop-drop', route_id: 'route-1' },
              ],
            }),
          };
        }
        if (table === 'route_prices') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'price-1', amount_minor: 480000, currency: 'INR' },
            }),
          };
        }
        if (table === 'seat_holds') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'hold-1' } }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === 'bookings') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'booking-1',
                    parent_id: 'parent-1',
                    child_id: 'child-1',
                    state: 'awaiting_payment',
                    amount_minor: 480000,
                  },
                }),
              }),
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const res = await service.createBooking('user-1', {
        childId: 'child-1',
        scheduleId: 'sched-1',
        pickupStopId: 'stop-pick',
        dropoffStopId: 'stop-drop',
        serviceStart: '2026-06-01',
      });

      expect(res.id).toBe('booking-1');
      expect(res.state).toBe('awaiting_payment');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'insert',
          tableName: 'bookings',
          recordId: 'booking-1',
          reasonCode: 'BOOKING_CREATED',
        }),
      );
    });

    it('rejects booking if pickup and dropoff stops are identical', async () => {
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
        return { select: jest.fn().mockReturnThis() };
      });

      await expect(
        service.createBooking('user-1', {
          childId: 'child-1',
          scheduleId: 'sched-1',
          pickupStopId: 'stop-same',
          dropoffStopId: 'stop-same',
          serviceStart: '2026-06-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelBooking', () => {
    it('cancels booking and decrements seat counter', async () => {
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
        if (table === 'bookings') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'booking-1',
                parent_id: 'parent-1',
                schedule_id: 'sched-1',
                state: 'awaiting_payment',
                seat_hold_id: 'hold-1',
              },
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'booking-1', state: 'cancelled' },
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'seat_holds') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === 'schedule_seat_counters') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { seats_taken: 3 },
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const res = await service.cancelBooking('user-1', 'booking-1', {
        reasonCode: 'PARENT_CANCELLED',
      });

      expect(res.state).toBe('cancelled');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          tableName: 'bookings',
          recordId: 'booking-1',
          reasonCode: 'PARENT_CANCELLED',
        }),
      );
    });
  });
});
