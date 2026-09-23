/**
 * TinyRide Shared Types
 * Mirroring v3 PostgreSQL Schema for TinyRide by Dodail Solutions.
 */

// -----------------------------------------------------------------------------
// Role Codes
// -----------------------------------------------------------------------------
export type RoleCode =
  | 'parent'
  | 'driver'
  | 'vehicle_owner'
  | 'school_staff'
  | 'operator'
  | 'kyc_reviewer'
  | 'finance_admin'
  | 'support_agent'
  | 'admin';

export const PRIVILEGED_ROLES: RoleCode[] = [
  'operator',
  'kyc_reviewer',
  'finance_admin',
  'support_agent',
  'admin',
];

// -----------------------------------------------------------------------------
// Lifecycle State Domains & States
// -----------------------------------------------------------------------------
export type StateDomain =
  | 'profile'
  | 'driver'
  | 'vehicle'
  | 'route'
  | 'booking'
  | 'subscription'
  | 'payment'
  | 'payout'
  | 'trip'
  | 'trip_child'
  | 'incident'
  | 'exception'
  | 'ticket'
  | 'reassignment';

export type ProfileState = 'active' | 'suspended' | 'deleted';

export type DriverState =
  | 'pending_verification'
  | 'needs_resubmission'
  | 'approved'
  | 'suspended'
  | 'rejected'
  | 'inactive';

export type VehicleState =
  | 'pending_verification'
  | 'needs_resubmission'
  | 'approved'
  | 'maintenance'
  | 'suspended'
  | 'retired';

export type RouteState =
  | 'draft'
  | 'pending_review'
  | 'needs_changes'
  | 'approved'
  | 'suspended'
  | 'retired';

export type BookingState =
  | 'draft'
  | 'pending_reservation'
  | 'awaiting_payment'
  | 'confirmed'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type PaymentStatus =
  | 'created'
  | 'authorized'
  | 'captured'
  | 'refunded'
  | 'partially_refunded'
  | 'failed';

export type TripState =
  | 'scheduled'
  | 'ready'
  | 'in_progress'
  | 'completed'
  | 'delayed'
  | 'cancelled'
  | 'interrupted';

export type TripChildState =
  | 'expected'
  | 'picked_up'
  | 'at_school'
  | 'released_from_school'
  | 'dropped_off'
  | 'absent'
  | 'no_show'
  | 'exception';

export type IncidentState = 'reported' | 'investigating' | 'escalated' | 'resolved' | 'closed';

export type ExceptionState = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'escalated';

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------
export type TripDirection = 'am' | 'pm'; // AM = home->school, PM = school->home

export type AssignmentType = 'primary' | 'backup' | 'temporary';

export type StopType = 'pickup' | 'dropoff' | 'school' | 'waypoint';

export type VehicleType = 'auto' | 'van' | 'minibus' | 'car';

export type DocumentType =
  | 'license'
  | 'insurance'
  | 'registration'
  | 'background_check'
  | 'police_verification'
  | 'medical_certificate'
  | 'vehicle_inspection'
  | 'fitness_certificate'
  | 'permit'
  | 'owner_authorization'
  | 'school_authorization'
  | 'other';

export type DocumentSubject = 'driver' | 'vehicle' | 'owner' | 'school';

export type ReviewSubject = 'driver' | 'vehicle' | 'owner' | 'route' | 'school' | 'document';

export type VerificationDecision = 'approved' | 'rejected' | 'needs_info';

export type GuardianRelationship =
  | 'mother'
  | 'father'
  | 'grandparent'
  | 'aunt'
  | 'uncle'
  | 'sibling'
  | 'nanny'
  | 'family_friend'
  | 'other';

export type HandoverLeg = 'home_pickup' | 'school_receipt' | 'school_release' | 'home_dropoff';

export type HandoverMethod =
  | 'otp'
  | 'qr_code'
  | 'photo'
  | 'signature'
  | 'guardian_confirm'
  | 'ops_override';

export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ExceptionType =
  | 'handover_failed'
  | 'handover_missing'
  | 'child_no_show'
  | 'driver_absent'
  | 'vehicle_breakdown'
  | 'unapproved_substitution'
  | 'school_mismatch'
  | 'capacity_conflict'
  | 'payment_mismatch'
  | 'document_expired'
  | 'offline_conflict'
  | 'other';

export type LedgerEntryType =
  | 'charge'
  | 'refund'
  | 'adjustment'
  | 'platform_fee'
  | 'gateway_fee'
  | 'payout'
  | 'credit'
  | 'chargeback';

export type LedgerAccountType =
  | 'parent_receivable'
  | 'platform_revenue'
  | 'gateway_clearing'
  | 'owner_payable'
  | 'cash';

export type AuditAction =
  | 'insert'
  | 'update'
  | 'delete'
  | 'login'
  | 'admin_override'
  | 'role_change'
  | 'data_export'
  | 'privileged_read'
  | 'suspend'
  | 'reinstate';

// -----------------------------------------------------------------------------
// Core Domain Entities (Matching SQL Schema)
// -----------------------------------------------------------------------------
export interface Profile {
  id: string; // uuid
  phoneE164: string;
  displayName: string | null;
  email: string | null;
  cityId: string | null;
  locale: string;
  state: ProfileState;
  suspendedReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  roleCode: RoleCode;
  active: boolean;
  grantedAt: string;
  revokedAt?: string | null;
}

export interface Parent {
  id: string;
  userId: string;
  cityId?: string | null;
  createdAt: string;
}

export interface Child {
  id: string;
  parentId: string;
  schoolId: string;
  firstName: string;
  lastName?: string | null;
  dateOfBirth?: string | null;
  emergencyContact?: string | null;
  createdAt: string;
}

export interface Guardian {
  id: string;
  parentId: string;
  fullName: string;
  phoneE164: string;
  email?: string | null;
}

export interface ChildGuardian {
  id: string;
  childId: string;
  guardianId: string;
  relationship: GuardianRelationship;
  priority: number;
  canPickup: boolean;
  isEmergencyContact: boolean;
  verifiedAt?: string | null;
  revokedAt?: string | null;
}

export interface LedgerTransaction {
  id: string;
  entryType: LedgerEntryType;
  currency: string;
  paymentId?: string | null;
  bookingId?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  amountMinor: number;
  currency: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  cityId?: string | null;
  licenseNumber: string;
  licenseExpiresAt?: string | null;
  state: DriverState;
  approvedAt?: string | null;
  createdAt: string;
}

export interface VehicleOwner {
  id: string;
  userId: string;
  legalName?: string | null;
  panOrGstin?: string | null;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  registrationNumber: string;
  makeModel?: string | null;
  vehicleType: VehicleType;
  seatingCapacity: number;
  usableCapacity: number;
  hasAttendant: boolean;
  fitnessExpiresAt?: string | null;
  insuranceExpiresAt?: string | null;
  permitExpiresAt?: string | null;
  state: VehicleState;
  approvedAt?: string | null;
  createdAt: string;
}

export interface Route {
  id: string;
  cityId: string;
  schoolId: string;
  zoneId?: string | null;
  name: string;
  proposedBy: string;
  ownerId?: string | null;
  state: RouteState;
  maxDetourMinutes: number;
  approvedAt?: string | null;
  createdAt: string;
}

export interface RouteStop {
  id: string;
  routeId: string;
  stopType: StopType;
  name: string;
  address: string;
  geo: { latitude: number; longitude: number };
  schoolId?: string | null;
}

export interface RouteSchedule {
  id: string;
  routeId: string;
  name: string;
  direction: TripDirection;
  departureTime: string;
  arrivalTime?: string | null;
  seatsOffered: number;
  active: boolean;
}

export interface Booking {
  id: string;
  parentId: string;
  childId: string;
  routeId: string;
  scheduleId: string;
  pickupStopId: string;
  dropoffStopId: string;
  seatCount: number;
  serviceStart: string;
  serviceEnd?: string | null;
  amountMinor: number;
  currency: string;
  state: BookingState;
  seatHoldId?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
}

export interface SeatHold {
  id: string;
  scheduleId: string;
  parentId: string;
  childId: string;
  seatCount: number;
  expiresAt: string;
  releasedAt?: string | null;
  bookingId?: string | null;
  createdAt: string;
}

export interface Trip {
  id: string;
  scheduleId: string;
  routeId: string;
  tripDate: string;
  direction: TripDirection;
  driverId: string;
  vehicleId: string;
  scheduledStart: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  state: TripState;
  createdAt: string;
}

export interface TripChild {
  id: string;
  tripId: string;
  childId: string;
  bookingId: string;
  pickupStopId: string;
  dropoffStopId: string;
  state: TripChildState;
  plannedSequence: number;
  pickedUpAt?: string | null;
  schoolReceivedAt?: string | null;
  schoolReleasedAt?: string | null;
  droppedOffAt?: string | null;
}

export interface ChildAbsence {
  id: string;
  childId: string;
  bookingId?: string | null;
  scheduleId?: string | null;
  absenceDate: string;
  direction?: TripDirection | null;
  reason?: string | null;
  reportedBy: string;
  cancelledAt?: string | null;
  createdAt: string;
}

export interface Handover {
  id: string;
  tripChildId: string;
  leg: HandoverLeg;
  method: HandoverMethod;
  performedBy: string;
  counterpartyGuardianId?: string | null;
  counterpartySchoolUser?: string | null;
  tokenId?: string | null;
  evidencePath?: string | null;
  occurredAt: string;
  overrideReason?: string | null;
  createdAt: string;
}

export interface SafetyException {
  id: string;
  exceptionType: ExceptionType;
  severity: ExceptionSeverity;
  state: ExceptionState;
  tripId?: string | null;
  tripChildId?: string | null;
  bookingId?: string | null;
  driverId?: string | null;
  title: string;
  details?: Record<string, unknown>;
  autoRaised: boolean;
  slaDueAt?: string | null;
  resolvedAt?: string | null;
  resolutionCode?: string | null;
  createdAt: string;
}

export interface Incident {
  id: string;
  reference: string;
  tripId?: string | null;
  tripChildId?: string | null;
  childId?: string | null;
  driverId?: string | null;
  severity: ExceptionSeverity;
  status: IncidentState;
  category?: string | null;
  summary: string;
  description?: string | null;
  reportedByUserId: string;
  slaDueAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId?: string | null;
  subscriptionId?: string | null;
  parentId: string;
  provider: 'razorpay';
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  capturedAt?: string | null;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Standard API Request & Response Contracts
// -----------------------------------------------------------------------------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    correlationId?: string;
  };
  timestamp: string;
}

export interface AuthenticatedUser {
  userId: string;
  phoneE164: string;
  email?: string | null;
  roles: RoleCode[];
  isPrivileged: boolean;
}
