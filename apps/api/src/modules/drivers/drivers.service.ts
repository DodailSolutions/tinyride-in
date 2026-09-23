import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDriverDto, RequestDocumentUploadDto } from './dto/drivers.dto';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Registers an onboarding driver, initializing the driver entity in 'pending_verification'
   * and assigning the 'driver' role.
   */
  async registerDriver(userId: string, dto: RegisterDriverDto) {
    const client = this.supabaseService.getServiceRoleClient();
    const normalizedLicense = dto.licenseNumber.toUpperCase().replace(/\s+/g, '');

    // Check if user already has a driver profile
    const { data: existingDriver } = await client
      .from('drivers')
      .select('id, state, license_number')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingDriver) {
      throw new ConflictException('Driver profile already exists for this account');
    }

    // Check for duplicate license number
    const { data: duplicateLicense } = await client
      .from('drivers')
      .select('id')
      .eq('license_number', normalizedLicense)
      .maybeSingle();

    if (duplicateLicense) {
      throw new ConflictException('Driving license number is already registered in TinyRide');
    }

    // Insert driver record in pending_verification
    const { data: newDriver, error: insertErr } = await client
      .from('drivers')
      .insert({
        user_id: userId,
        city_id: dto.cityId || null,
        license_number: normalizedLicense,
        license_expires_at: dto.licenseExpiresAt || null,
        state: 'pending_verification',
      })
      .select()
      .single();

    if (insertErr || !newDriver) {
      this.logger.error(`Failed to register driver for user ${userId}: ${insertErr?.message}`);
      throw new Error(`Database error while creating driver: ${insertErr?.message}`);
    }

    // Assign 'driver' role in user_roles if not already present
    const { data: driverRole } = await client
      .from('roles')
      .select('id')
      .eq('code', 'driver')
      .single();

    if (driverRole) {
      const { data: existingRole } = await client
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', driverRole.id)
        .is('revoked_at', null)
        .maybeSingle();

      if (!existingRole) {
        await client.from('user_roles').insert({
          user_id: userId,
          role_id: driverRole.id,
        });
      }
    }

    // Record audit event
    await this.auditService.record({
      actorUserId: userId,
      actorRole: 'driver',
      action: 'insert',
      tableName: 'drivers',
      recordId: newDriver.id,
      reasonCode: 'DRIVER_ONBOARDING_SUBMITTED',
      afterData: { state: 'pending_verification', license_number: normalizedLicense },
    });

    this.logger.log(`Driver registered [${newDriver.id}] in pending_verification`);
    return newDriver;
  }

  /**
   * Retrieves current driver profile and compliance status
   */
  async getDriverProfile(userId: string) {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: driver, error } = await client
      .from('drivers')
      .select('*, documents(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !driver) {
      throw new NotFoundException('Driver profile not found. Please complete driver registration.');
    }

    return driver;
  }

  /**
   * Creates a pending document record and generates a signed upload URL
   * using private Supabase storage.
   */
  async createDocumentUploadSlot(userId: string, dto: RequestDocumentUploadDto) {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: driver } = await client
      .from('drivers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!driver) {
      throw new NotFoundException('Driver profile not found. Please register first.');
    }

    const fileExt = dto.fileName.split('.').pop() || 'bin';
    const storagePath = `drivers/${driver.id}/${dto.documentType}_${Date.now()}.${fileExt}`;

    // Generate signed upload URL for private storage bucket
    const { data: signedData, error: storageErr } = await client.storage
      .from('documents')
      .createSignedUploadUrl(storagePath);

    if (storageErr) {
      this.logger.warn(`Storage signed URL creation failed (will provide fallback path): ${storageErr.message}`);
    }

    // Create document record in public.documents
    const { data: docRecord, error: docErr } = await client
      .from('documents')
      .insert({
        subject_type: 'driver',
        subject_id: driver.id,
        document_type: dto.documentType,
        document_number: dto.documentNumber || null,
        expires_at: dto.expiresAt || null,
        storage_path: storagePath,
        verification_status: 'pending',
      })
      .select()
      .single();

    if (docErr || !docRecord) {
      this.logger.error(`Failed to create document record for driver ${driver.id}: ${docErr?.message}`);
      throw new Error(`Failed to create document metadata: ${docErr?.message}`);
    }

    await this.auditService.record({
      actorUserId: userId,
      actorRole: 'driver',
      action: 'insert',
      tableName: 'documents',
      recordId: docRecord.id,
      reasonCode: 'DOCUMENT_UPLOADED',
    });

    return {
      document: docRecord,
      uploadUrl: signedData?.signedUrl || null,
      storagePath,
      token: signedData?.token || null,
    };
  }

  /**
   * Lists all documents submitted by this driver
   */
  async getDriverDocuments(userId: string) {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: driver } = await client
      .from('drivers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const { data: documents } = await client
      .from('documents')
      .select('*')
      .eq('subject_type', 'driver')
      .eq('subject_id', driver.id);

    return documents || [];
  }
}
