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
import {
  AssignDriverToVehicleDto,
  RegisterOwnerDto,
  RegisterVehicleDto,
} from './dto/vehicles.dto';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Registers a vehicle owner account and grants the 'vehicle_owner' role.
   */
  async registerOwner(userId: string, dto: RegisterOwnerDto) {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: existingOwner } = await client
      .from('vehicle_owners')
      .select('id, status')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingOwner) {
      return existingOwner;
    }

    const { data: newOwner, error } = await client
      .from('vehicle_owners')
      .insert({
        user_id: userId,
        legal_name: dto.legalName,
        pan_or_gstin: dto.panOrGstin || null,
        payout_account_ref: dto.payoutAccountRef || null,
        status: 'active',
      })
      .select()
      .single();

    if (error || !newOwner) {
      throw new Error(`Failed to create vehicle owner: ${error?.message}`);
    }

    // Grant vehicle_owner role
    const { data: role } = await client.from('roles').select('id').eq('code', 'vehicle_owner').single();
    if (role) {
      await client.from('user_roles').insert({
        user_id: userId,
        role_id: role.id,
      });
    }

    await this.auditService.record({
      actorUserId: userId,
      actorRole: 'vehicle_owner',
      action: 'insert',
      tableName: 'vehicle_owners',
      recordId: newOwner.id,
      reasonCode: 'OWNER_REGISTERED',
    });

    return newOwner;
  }

  /**
   * Registers a vehicle in pending_verification state.
   * Strictly enforces usable_capacity <= seating_capacity (anti-overcrowding invariant).
   */
  async registerVehicle(userId: string, dto: RegisterVehicleDto) {
    const client = this.supabaseService.getServiceRoleClient();

    if (dto.usableCapacity > dto.seatingCapacity) {
      throw new BadRequestException(
        `Usable child capacity (${dto.usableCapacity}) cannot exceed manufacturer seating capacity (${dto.seatingCapacity})`,
      );
    }

    const { data: owner } = await client
      .from('vehicle_owners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!owner) {
      throw new ForbiddenException('User is not a registered vehicle owner. Register as an owner first.');
    }

    const normalizedPlate = dto.registrationNumber.toUpperCase().replace(/\s+/g, '');

    // Check for duplicate registration
    const { data: duplicate } = await client
      .from('vehicles')
      .select('id')
      .eq('registration_number', normalizedPlate)
      .maybeSingle();

    if (duplicate) {
      throw new ConflictException(`Vehicle with registration number [${normalizedPlate}] is already registered`);
    }

    const { data: newVehicle, error } = await client
      .from('vehicles')
      .insert({
        owner_id: owner.id,
        registration_number: normalizedPlate,
        make_model: dto.makeModel || null,
        vehicle_type: dto.vehicleType,
        seating_capacity: dto.seatingCapacity,
        usable_capacity: dto.usableCapacity,
        has_attendant: dto.hasAttendant,
        fitness_expires_at: dto.fitnessExpiresAt || null,
        insurance_expires_at: dto.insuranceExpiresAt || null,
        permit_expires_at: dto.permitExpiresAt || null,
        state: 'pending_verification',
      })
      .select()
      .single();

    if (error || !newVehicle) {
      throw new Error(`Failed to register vehicle: ${error?.message}`);
    }

    await this.auditService.record({
      actorUserId: userId,
      actorRole: 'vehicle_owner',
      action: 'insert',
      tableName: 'vehicles',
      recordId: newVehicle.id,
      reasonCode: 'VEHICLE_ONBOARDING_SUBMITTED',
      afterData: {
        registration_number: normalizedPlate,
        usable_capacity: dto.usableCapacity,
        state: 'pending_verification',
      },
    });

    this.logger.log(`Vehicle registered [${newVehicle.id}] in pending_verification`);
    return newVehicle;
  }

  /**
   * Authorizes a driver to operate a vehicle owned by this owner.
   */
  async assignDriverToVehicle(userId: string, dto: AssignDriverToVehicleDto) {
    const client = this.supabaseService.getServiceRoleClient();

    // Verify ownership
    const { data: vehicle } = await client
      .from('vehicles')
      .select('id, owner_id, vehicle_owners(user_id)')
      .eq('id', dto.vehicleId)
      .maybeSingle();

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID [${dto.vehicleId}] not found`);
    }

    const ownerUserId = (vehicle.vehicle_owners as unknown as { user_id: string })?.user_id;
    if (ownerUserId !== userId) {
      throw new ForbiddenException('You do not own this vehicle. Only the vehicle owner can authorize drivers.');
    }

    // Verify driver exists
    const { data: driver } = await client
      .from('drivers')
      .select('id, state')
      .eq('id', dto.driverId)
      .maybeSingle();

    if (!driver) {
      throw new NotFoundException(`Driver with ID [${dto.driverId}] not found`);
    }

    const { data: assignment, error } = await client
      .from('driver_vehicle_assignments')
      .insert({
        driver_id: dto.driverId,
        vehicle_id: dto.vehicleId,
        authorized_by_owner: userId,
        authorized_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !assignment) {
      throw new Error(`Failed to assign driver to vehicle: ${error?.message}`);
    }

    await this.auditService.record({
      actorUserId: userId,
      actorRole: 'vehicle_owner',
      action: 'insert',
      tableName: 'driver_vehicle_assignments',
      recordId: assignment.id,
      reasonCode: 'OWNER_DRIVER_ASSIGNED',
    });

    return assignment;
  }

  /**
   * Lists all vehicles registered by the owner
   */
  async listOwnerVehicles(userId: string) {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: owner } = await client
      .from('vehicle_owners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!owner) {
      return [];
    }

    const { data: vehicles } = await client
      .from('vehicles')
      .select('*, driver_vehicle_assignments(driver_id, drivers(license_number, state))')
      .eq('owner_id', owner.id);

    return vehicles || [];
  }
}
