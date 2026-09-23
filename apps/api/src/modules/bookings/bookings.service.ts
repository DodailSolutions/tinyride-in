import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { CancelBookingDto, CreateBookingDto, HoldSeatDto } from './dto/bookings.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper to resolve parent record for user.
   */
  private async getParent(userId: string) {
    const client = this.supabaseService.getServiceRoleClient();
    const { data: parent } = await client
      .from('parents')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!parent) {
      throw new ForbiddenException('User is not registered as a parent');
    }
    return parent;
  }

  /**
   * Reserves a seat on a route schedule for 10 minutes (or specified holdMinutes).
   * Enforces zero oversell via counter and database constraints.
   */
  async reserveSeat(userId: string, dto: HoldSeatDto) {
    const client = this.supabaseService.getServiceRoleClient();
    const parent = await this.getParent(userId);

    // Verify child belongs to parent
    const { data: child, error: childErr } = await client
      .from('children')
      .select('id, parent_id, school_id, first_name')
      .eq('id', dto.childId)
      .maybeSingle();

    if (!child) {
      throw new NotFoundException(`Child [${dto.childId}] not found`);
    }

    if (child.parent_id !== parent.id) {
      throw new ForbiddenException('Data Isolation Violation: Child does not belong to you');
    }

    const holdMinutes = dto.holdMinutes || 10;

    // First attempt to call the database function app.reserve_seat
    const { data: rpcHold, error: rpcErr } = await client.rpc('reserve_seat', {
      p_child_id: dto.childId,
      p_schedule_id: dto.scheduleId,
      p_hold_minutes: holdMinutes,
    });

    if (!rpcErr && rpcHold) {
      await this.auditService.record({
        actorUserId: userId,
        actorRole: 'parent',
        action: 'insert',
        tableName: 'seat_holds',
        recordId: rpcHold.id,
        reasonCode: 'SEAT_HOLD_RESERVED_RPC',
        afterData: { scheduleId: dto.scheduleId, childId: dto.childId, expiresAt: rpcHold.expires_at },
      });
      return rpcHold;
    }

    // Fallback: perform capacity-checked reservation directly
    // 1. Fetch schedule and route
    const { data: schedule, error: schedErr } = await client
      .from('route_schedules')
      .select(`
        id,
        route_id,
        seats_offered,
        active,
        routes:route_id (
          id,
          state,
          school_id
        )
      `)
      .eq('id', dto.scheduleId)
      .maybeSingle();

    if (!schedule) {
      throw new NotFoundException(`Route schedule [${dto.scheduleId}] not found`);
    }

    const route = Array.isArray(schedule.routes) ? schedule.routes[0] : (schedule.routes as any);

    if (!schedule.active || route?.state !== 'approved') {
      throw new BadRequestException('Schedule or route is not currently open for bookings');
    }

    if (child.school_id !== route.school_id) {
      throw new BadRequestException('Child enrolled school does not match route destination school');
    }

    // 2. Check live booking duplicate
    const { data: existingBooking } = await client
      .from('bookings')
      .select('id')
      .eq('child_id', dto.childId)
      .eq('schedule_id', dto.scheduleId)
      .in('state', ['pending_reservation', 'awaiting_payment', 'awaiting_review', 'confirmed', 'active'])
      .maybeSingle();

    if (existingBooking) {
      throw new ConflictException('Child already has an active or pending booking on this schedule');
    }

    // 3. Check capacity in schedule_seat_counters
    const { data: counter } = await client
      .from('schedule_seat_counters')
      .select('seats_offered, seats_taken')
      .eq('schedule_id', dto.scheduleId)
      .maybeSingle();

    const seatsOffered = counter?.seats_offered ?? schedule.seats_offered;
    const seatsTaken = counter?.seats_taken ?? 0;

    if (seatsTaken >= seatsOffered) {
      throw new ConflictException('Vehicle run is fully booked. No seats currently available.');
    }

    // 4. Check existing live seat hold for child
    const { data: existingHold } = await client
      .from('seat_holds')
      .select('*')
      .eq('schedule_id', dto.scheduleId)
      .eq('child_id', dto.childId)
      .is('released_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingHold) {
      return existingHold;
    }

    // 5. Insert new seat hold
    const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000).toISOString();
    const { data: newHold, error: holdErr } = await client
      .from('seat_holds')
      .insert({
        schedule_id: dto.scheduleId,
        parent_id: parent.id,
        child_id: dto.childId,
        seat_count: 1,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (holdErr || !newHold) {
      this.logger.error(`Seat hold failed: ${holdErr?.message}`);
      throw new BadRequestException(`Could not reserve seat: ${holdErr?.message}`);
    }

    // 6. Update counter
    await client
      .from('schedule_seat_counters')
      .upsert({
        schedule_id: dto.scheduleId,
        seats_offered: seatsOffered,
        seats_taken: seatsTaken + 1,
      });

    // 7. Audit log
    await this.auditService.record({
      actorUserId: userId,
      actorRole: 'parent',
      action: 'insert',
      tableName: 'seat_holds',
      recordId: newHold.id,
      reasonCode: 'SEAT_HOLD_RESERVED',
      afterData: { scheduleId: dto.scheduleId, childId: dto.childId, expiresAt },
    });

    return newHold;
  }

  /**
   * Creates a formal booking record transitioning to 'awaiting_payment'.
   */
  async createBooking(userId: string, dto: CreateBookingDto) {
    const client = this.supabaseService.getServiceRoleClient();
    const parent = await this.getParent(userId);

    // Verify child belongs to parent
    const { data: child } = await client
      .from('children')
      .select('id, parent_id, school_id')
      .eq('id', dto.childId)
      .maybeSingle();

    if (!child || child.parent_id !== parent.id) {
      throw new ForbiddenException('Data Isolation Violation: Child does not belong to you');
    }

    // Verify pickup and dropoff stops are distinct
    if (dto.pickupStopId === dto.dropoffStopId) {
      throw new BadRequestException('Pickup and dropoff stops must be distinct locations');
    }

    // Verify schedule and route
    const { data: schedule } = await client
      .from('route_schedules')
      .select('id, route_id, active')
      .eq('id', dto.scheduleId)
      .maybeSingle();

    if (!schedule || !schedule.active) {
      throw new BadRequestException('Selected route schedule is invalid or inactive');
    }

    const routeId = schedule.route_id;

    // Verify stops belong to route
    const { data: stops } = await client
      .from('route_stops')
      .select('id, route_id')
      .in('id', [dto.pickupStopId, dto.dropoffStopId]);

    if (!stops || stops.length < 2 || stops.some((s) => s.route_id !== routeId)) {
      throw new BadRequestException('Selected stops must belong to the scheduled route');
    }

    // Verify hold if provided or check if active hold exists
    let seatHoldId = dto.seatHoldId;
    if (!seatHoldId) {
      const { data: activeHold } = await client
        .from('seat_holds')
        .select('id')
        .eq('schedule_id', dto.scheduleId)
        .eq('child_id', dto.childId)
        .is('released_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (activeHold) {
        seatHoldId = activeHold.id;
      }
    }

    // Determine amount in minor units (paise)
    let amountMinor = 450000; // Default ₹4,500/month
    let priceId = dto.priceId || null;

    if (priceId) {
      const { data: priceRow } = await client
        .from('route_prices')
        .select('id, amount_minor, currency')
        .eq('id', priceId)
        .maybeSingle();

      if (priceRow) {
        amountMinor = Number(priceRow.amount_minor);
      }
    } else {
      const { data: routePrice } = await client
        .from('route_prices')
        .select('id, amount_minor, currency')
        .eq('route_id', routeId)
        .eq('billing_period', dto.billingPeriod || 'monthly')
        .maybeSingle();

      if (routePrice) {
        priceId = routePrice.id;
        amountMinor = Number(routePrice.amount_minor);
      }
    }

    // Create booking row
    const { data: booking, error: bookingErr } = await client
      .from('bookings')
      .insert({
        parent_id: parent.id,
        child_id: dto.childId,
        route_id: routeId,
        schedule_id: dto.scheduleId,
        pickup_stop_id: dto.pickupStopId,
        dropoff_stop_id: dto.dropoffStopId,
        seat_count: 1,
        service_start: dto.serviceStart,
        service_end: dto.serviceEnd || null,
        price_id: priceId,
        amount_minor: amountMinor,
        currency: 'INR',
        billing_period: dto.billingPeriod || 'monthly',
        state: 'awaiting_payment',
        seat_hold_id: seatHoldId || null,
      })
      .select()
      .single();

    if (bookingErr || !booking) {
      this.logger.error(`Booking creation failed: ${bookingErr?.message}`);
      throw new BadRequestException(`Could not create booking: ${bookingErr?.message}`);
    }

    // Bind hold to booking
    if (seatHoldId) {
      await client
        .from('seat_holds')
        .update({ booking_id: booking.id })
        .eq('id', seatHoldId);
    }

    // Record audit event
    await this.auditService.record({
      actorUserId: userId,
      actorRole: 'parent',
      action: 'insert',
      tableName: 'bookings',
      recordId: booking.id,
      reasonCode: 'BOOKING_CREATED',
      afterData: {
        bookingId: booking.id,
        amountMinor,
        state: 'awaiting_payment',
        scheduleId: dto.scheduleId,
      },
    });

    return booking;
  }

  /**
   * Retrieves all bookings for the parent.
   */
  async getBookings(userId: string) {
    const client = this.supabaseService.getServiceRoleClient();
    const parent = await this.getParent(userId);

    const { data: bookings, error } = await client
      .from('bookings')
      .select(`
        *,
        children (
          id,
          first_name,
          last_name
        ),
        routes (
          id,
          name,
          schools (
            id,
            name
          )
        ),
        route_schedules (
          id,
          name,
          direction,
          departure_time
        ),
        pickup_stop:pickup_stop_id (
          id,
          name,
          address
        ),
        dropoff_stop:dropoff_stop_id (
          id,
          name,
          address
        )
      `)
      .eq('parent_id', parent.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return bookings || [];
  }

  /**
   * Retrieves single booking details.
   */
  async getBookingById(userId: string, bookingId: string) {
    const client = this.supabaseService.getServiceRoleClient();
    const parent = await this.getParent(userId);

    const { data: booking, error } = await client
      .from('bookings')
      .select(`
        *,
        children (*),
        routes (*),
        route_schedules (*),
        pickup_stop:pickup_stop_id (*),
        dropoff_stop:dropoff_stop_id (*),
        payments (*)
      `)
      .eq('id', bookingId)
      .maybeSingle();

    if (!booking) {
      throw new NotFoundException(`Booking [${bookingId}] not found`);
    }

    if (booking.parent_id !== parent.id) {
      throw new ForbiddenException('Data Isolation Violation: Access denied to booking');
    }

    return booking;
  }

  /**
   * Cancels a booking according to allowed state transitions.
   */
  async cancelBooking(userId: string, bookingId: string, dto: CancelBookingDto) {
    const client = this.supabaseService.getServiceRoleClient();
    const parent = await this.getParent(userId);

    const { data: booking } = await client
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (!booking) {
      throw new NotFoundException(`Booking [${bookingId}] not found`);
    }

    if (booking.parent_id !== parent.id) {
      throw new ForbiddenException('Data Isolation Violation: Access denied');
    }

    const cancelableStates = ['awaiting_payment', 'awaiting_review', 'confirmed', 'active', 'suspended'];
    if (!cancelableStates.includes(booking.state)) {
      throw new BadRequestException(`Cannot cancel booking in current state: ${booking.state}`);
    }

    const now = new Date().toISOString();
    const { data: updated, error } = await client
      .from('bookings')
      .update({
        state: 'cancelled',
        cancelled_at: now,
        cancel_reason_code: dto.reasonCode,
        cancelled_by: userId,
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error || !updated) {
      throw new BadRequestException(`Failed to cancel booking: ${error?.message}`);
    }

    // Release seat hold if linked
    if (booking.seat_hold_id) {
      await client
        .from('seat_holds')
        .update({ released_at: now })
        .eq('id', booking.seat_hold_id);
    }

    // Decrement counter if seat was consumed
    const { data: counter } = await client
      .from('schedule_seat_counters')
      .select('seats_taken')
      .eq('schedule_id', booking.schedule_id)
      .maybeSingle();

    if (counter && counter.seats_taken > 0) {
      await client
        .from('schedule_seat_counters')
        .update({ seats_taken: counter.seats_taken - 1 })
        .eq('schedule_id', booking.schedule_id);
    }

    // Audit log
    await this.auditService.record({
      actorUserId: userId,
      actorRole: 'parent',
      action: 'update',
      tableName: 'bookings',
      recordId: bookingId,
      reasonCode: dto.reasonCode,
      beforeData: { state: booking.state },
      afterData: { state: 'cancelled', cancelled_at: now },
    });

    return updated;
  }
}
