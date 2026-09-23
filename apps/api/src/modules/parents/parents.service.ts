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
import { CreateChildDto, CreateGuardianDto } from './dto/parents.dto';

@Injectable()
export class ParentsService {
  private readonly logger = new Logger(ParentsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper to resolve the parent record for a user, creating one if not exists.
   */
  async getOrCreateParent(userId: string) {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: parent } = await client
      .from('parents')
      .select('id, user_id, city_id, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (parent) {
      return parent;
    }

    // Insert new parent record
    const { data: newParent, error } = await client
      .from('parents')
      .insert({ user_id: userId })
      .select('id, user_id, city_id, created_at')
      .single();

    if (error || !newParent) {
      this.logger.error(`Failed to create parent profile for user ${userId}: ${error?.message}`);
      throw new Error(`Database error creating parent profile: ${error?.message}`);
    }

    return newParent;
  }

  /**
   * Returns current parent's profile, saved locations, and children.
   */
  async getMe(userId: string) {
    const client = this.supabaseService.getServiceRoleClient();
    const parent = await this.getOrCreateParent(userId);

    const [locationsRes, childrenRes] = await Promise.all([
      client.from('family_locations').select('*').eq('parent_id', parent.id),
      client
        .from('children')
        .select(`
          id,
          first_name,
          last_name,
          date_of_birth,
          grade,
          section,
          status,
          school_id,
          schools (
            id,
            name,
            address,
            verification_status
          ),
          child_health_notes (
            allergies,
            medical_notes,
            special_needs,
            emergency_instructions
          )
        `)
        .eq('parent_id', parent.id)
        .order('created_at', { ascending: false }),
    ]);

    return {
      parent,
      locations: locationsRes.data || [],
      children: childrenRes.data || [],
    };
  }

  /**
   * Registers a new child for this parent.
   */
  async createChild(userId: string, dto: CreateChildDto) {
    const client = this.supabaseService.getServiceRoleClient();
    const parent = await this.getOrCreateParent(userId);

    // Verify school exists
    const { data: school, error: schoolErr } = await client
      .from('schools')
      .select('id, name, verification_status')
      .eq('id', dto.schoolId)
      .maybeSingle();

    if (!school) {
      throw new NotFoundException(`School with ID [${dto.schoolId}] not found`);
    }

    // Format date of birth or default to 8 years ago to satisfy chk_children_dob constraint
    let dob = dto.dateOfBirth;
    if (!dob) {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 8);
      dob = date.toISOString().split('T')[0];
    }

    // Insert child
    const { data: child, error: childErr } = await client
      .from('children')
      .insert({
        parent_id: parent.id,
        school_id: dto.schoolId,
        first_name: dto.firstName.trim(),
        last_name: dto.lastName?.trim() || null,
        date_of_birth: dob,
        grade: dto.grade || null,
        section: dto.section || null,
        status: 'active',
      })
      .select()
      .single();

    if (childErr || !child) {
      this.logger.error(`Failed to register child: ${childErr?.message}`);
      throw new BadRequestException(`Failed to register child: ${childErr?.message}`);
    }

    // Insert health notes if provided
    if (dto.medicalNotes || dto.allergies || dto.specialNeeds || dto.emergencyContact) {
      await client.from('child_health_notes').insert({
        child_id: child.id,
        allergies: dto.allergies || null,
        medical_notes: dto.medicalNotes || null,
        special_needs: dto.specialNeeds || null,
        emergency_instructions: dto.emergencyContact
          ? `Emergency Phone: ${dto.emergencyContact}`
          : null,
      });
    }

    // Audit log
    await this.auditService.record({
      actorUserId: userId,
      actorRole: 'parent',
      action: 'insert',
      tableName: 'children',
      recordId: child.id,
      reasonCode: 'CHILD_REGISTERED',
      afterData: { childId: child.id, firstName: child.first_name, schoolId: child.school_id },
    });

    return child;
  }

  /**
   * Retrieves all children belonging to the parent.
   */
  async getChildren(userId: string) {
    const client = this.supabaseService.getServiceRoleClient();
    const parent = await this.getOrCreateParent(userId);

    const { data: children, error } = await client
      .from('children')
      .select(`
        *,
        schools:school_id (
          id,
          name,
          address
        ),
        child_health_notes (*)
      `)
      .eq('parent_id', parent.id)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch children for parent ${parent.id}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return children || [];
  }

  /**
   * Retrieves a single child with health notes and authorized guardians.
   */
  async getChildById(userId: string, childId: string) {
    const client = this.supabaseService.getServiceRoleClient();
    const parent = await this.getOrCreateParent(userId);

    const { data: child, error } = await client
      .from('children')
      .select(`
        *,
        schools:school_id (
          id,
          name,
          address
        ),
        child_health_notes (*),
        child_guardians (
          id,
          relationship,
          priority,
          can_pickup,
          is_emergency_contact,
          verified_at,
          guardians (*)
        )
      `)
      .eq('id', childId)
      .maybeSingle();

    if (!child) {
      throw new NotFoundException(`Child with ID [${childId}] not found`);
    }

    if (child.parent_id !== parent.id) {
      throw new ForbiddenException('You do not have permission to view this child');
    }

    return child;
  }

  /**
   * Creates/links an authorized guardian for a child.
   */
  async createGuardian(userId: string, childId: string, dto: CreateGuardianDto) {
    const client = this.supabaseService.getServiceRoleClient();
    const parent = await this.getOrCreateParent(userId);

    // Verify child ownership
    const { data: child } = await client
      .from('children')
      .select('id, parent_id')
      .eq('id', childId)
      .maybeSingle();

    if (!child) {
      throw new NotFoundException(`Child [${childId}] not found`);
    }

    if (child.parent_id !== parent.id) {
      throw new ForbiddenException('You do not have permission to manage guardians for this child');
    }

    // Check or insert guardian record (unique by parent_id, phone_e164)
    let guardianId: string;
    const { data: existingGuardian } = await client
      .from('guardians')
      .select('id')
      .eq('parent_id', parent.id)
      .eq('phone_e164', dto.phoneE164)
      .maybeSingle();

    if (existingGuardian) {
      guardianId = existingGuardian.id;
    } else {
      const { data: newGuardian, error: gErr } = await client
        .from('guardians')
        .insert({
          parent_id: parent.id,
          full_name: dto.fullName.trim(),
          phone_e164: dto.phoneE164,
        })
        .select('id')
        .single();

      if (gErr || !newGuardian) {
        throw new BadRequestException(`Failed to create guardian: ${gErr?.message}`);
      }
      guardianId = newGuardian.id;
    }

    // Check if link already exists
    const { data: existingLink } = await client
      .from('child_guardians')
      .select('id')
      .eq('child_id', childId)
      .eq('guardian_id', guardianId)
      .maybeSingle();

    if (existingLink) {
      throw new ConflictException('This guardian is already linked to the child');
    }

    // DB check: chk_child_guardian_pickup_verified: check (not can_pickup or verified_at is not null)
    // When parent authorizes pickup, verified_at is recorded as verified by parent
    const verifiedAt = dto.canPickup ? new Date().toISOString() : null;

    const { data: link, error: linkErr } = await client
      .from('child_guardians')
      .insert({
        child_id: childId,
        guardian_id: guardianId,
        relationship: dto.relationship,
        priority: dto.priority || 1,
        can_pickup: dto.canPickup || false,
        is_emergency_contact: dto.isEmergencyContact || false,
        verified_at: verifiedAt,
      })
      .select(`
        *,
        guardians (*)
      `)
      .single();

    if (linkErr || !link) {
      throw new BadRequestException(`Failed to link guardian: ${linkErr?.message}`);
    }

    // Audit log
    await this.auditService.record({
      actorUserId: userId,
      actorRole: 'parent',
      action: 'insert',
      tableName: 'child_guardians',
      recordId: link.id,
      reasonCode: 'GUARDIAN_LINKED',
      afterData: { childId, guardianId, relationship: dto.relationship, canPickup: dto.canPickup },
    });

    return link;
  }

  /**
   * Retrieves all authorized guardians for a child.
   */
  async getGuardians(userId: string, childId: string) {
    const client = this.supabaseService.getServiceRoleClient();
    const parent = await this.getOrCreateParent(userId);

    // Verify child ownership
    const { data: child } = await client
      .from('children')
      .select('id, parent_id')
      .eq('id', childId)
      .maybeSingle();

    if (!child || child.parent_id !== parent.id) {
      throw new ForbiddenException('Access denied to child guardians');
    }

    const { data: guardians, error } = await client
      .from('child_guardians')
      .select(`
        id,
        child_id,
        relationship,
        priority,
        can_pickup,
        is_emergency_contact,
        verified_at,
        guardians (
          id,
          full_name,
          phone_e164,
          photo_path
        )
      `)
      .eq('child_id', childId)
      .is('revoked_at', null)
      .order('priority', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return guardians || [];
  }
}
