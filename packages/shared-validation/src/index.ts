import { z } from 'zod';

/**
 * Common Zod Schemas for TinyRide by Dodail Solutions
 */

// E.164 international phone number format (matching database constraint)
export const phoneE164Schema = z
  .string()
  .regex(/^\+[1-9][0-9]{7,14}$/, 'Must be a valid E.164 phone number (e.g. +919876543210)');

// Indian phone number helper (+91 followed by 10 digits)
export const indianPhoneSchema = z
  .string()
  .regex(/^\+91[6-9][0-9]{9}$/, 'Must be a valid 10-digit Indian mobile number with +91 country code');

// Indian Vehicle Registration Number (e.g., TS09AB1234, AP28XY9999)
export const vehicleRegistrationSchema = z
  .string()
  .min(6)
  .max(15)
  .transform((val) => val.toUpperCase().replace(/\s+/g, ''))
  .refine(
    (val) => /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/.test(val),
    'Must be a valid Indian vehicle registration number (e.g. TS09AB1234)'
  );

// Indian Driving License format
export const drivingLicenseSchema = z
  .string()
  .min(8)
  .max(25)
  .transform((val) => val.toUpperCase().replace(/\s+/g, ''));

// OTP verification schema (numeric 4 to 6 digits)
export const otpSchema = z
  .string()
  .regex(/^[0-9]{4,6}$/, 'OTP must be 4 to 6 numerical digits');

// Seat Reservation Request Schema
export const seatReservationRequestSchema = z.object({
  scheduleId: z.string().uuid('Schedule ID must be a valid UUID'),
  childId: z.string().uuid('Child ID must be a valid UUID'),
  seatCount: z.number().int().positive().default(1),
  holdMinutes: z.number().int().min(1).max(30).default(10),
});

// Handover Verification Schema
export const handoverVerificationRequestSchema = z.object({
  tripId: z.string().uuid('Trip ID must be a valid UUID'),
  childId: z.string().uuid('Child ID must be a valid UUID'),
  leg: z.enum(['home_pickup', 'school_receipt', 'school_release', 'home_dropoff']),
  otp: otpSchema,
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// Driver Onboarding Schema
export const driverOnboardingSchema = z.object({
  licenseNumber: drivingLicenseSchema,
  licenseExpiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format'),
  cityId: z.string().uuid().optional(),
});

// Vehicle Registration Schema
export const createVehicleSchema = z.object({
  registrationNumber: vehicleRegistrationSchema,
  makeModel: z.string().min(2).max(100).optional(),
  vehicleType: z.enum(['auto', 'van', 'minibus', 'car']),
  seatingCapacity: z.number().int().min(1).max(50),
  usableCapacity: z.number().int().min(1).max(50),
  hasAttendant: z.boolean().default(false),
  fitnessExpiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  insuranceExpiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  permitExpiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine((data) => data.usableCapacity <= data.seatingCapacity, {
  message: 'Usable child capacity cannot exceed physical seating capacity',
  path: ['usableCapacity'],
});

// KYC Review Decision Schema
export const kycDecisionSchema = z.object({
  subjectType: z.enum(['driver', 'vehicle', 'owner', 'route', 'document']),
  subjectId: z.string().uuid('Subject ID must be a valid UUID'),
  decision: z.enum(['approved', 'rejected', 'needs_info']),
  reasonCode: z.string().min(2).max(50),
  notes: z.string().max(1000).optional(),
});

// Child Registration Schema
export const createChildSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().max(50).optional(),
  schoolId: z.string().uuid('School ID must be a valid UUID'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format').optional(),
  grade: z.string().max(20).optional(),
  section: z.string().max(10).optional(),
  emergencyContact: phoneE164Schema.optional(),
  medicalNotes: z.string().max(500).optional(),
  allergies: z.string().max(500).optional(),
  specialNeeds: z.string().max(500).optional(),
});

// Guardian Creation Schema
export const createGuardianSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  phoneE164: phoneE164Schema,
  relationship: z.enum([
    'mother',
    'father',
    'grandparent',
    'aunt',
    'uncle',
    'sibling',
    'nanny',
    'family_friend',
    'other',
  ]),
  priority: z.number().int().min(1).max(10).default(1),
  canPickup: z.boolean().default(false),
  isEmergencyContact: z.boolean().default(false),
});

// Booking Creation Schema
export const createBookingSchema = z.object({
  childId: z.string().uuid('Child ID must be a valid UUID'),
  scheduleId: z.string().uuid('Schedule ID must be a valid UUID'),
  pickupStopId: z.string().uuid('Pickup Stop ID must be a valid UUID'),
  dropoffStopId: z.string().uuid('Dropoff Stop ID must be a valid UUID'),
  seatHoldId: z.string().uuid().optional(),
  serviceStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Service start must be in YYYY-MM-DD format'),
  serviceEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Service end must be in YYYY-MM-DD format').optional(),
  billingPeriod: z.enum(['one_time', 'weekly', 'monthly', 'term']).default('monthly'),
  priceId: z.string().uuid().optional(),
}).refine((data) => data.pickupStopId !== data.dropoffStopId, {
  message: 'Pickup and dropoff stops must be distinct',
  path: ['dropoffStopId'],
});

// Payment Order Creation Schema
export const createPaymentOrderSchema = z.object({
  bookingId: z.string().uuid('Booking ID must be a valid UUID'),
  amountMinor: z.number().int().positive().optional(),
  currency: z.string().length(3).default('INR'),
});
