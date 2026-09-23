import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ExceptionSeverity, ExceptionType } from '@tinyride/shared-types';

export class CreateExceptionDto {
  @ApiProperty({
    description: 'Type of exception',
    enum: [
      'handover_failed',
      'handover_missing',
      'child_no_show',
      'driver_absent',
      'vehicle_breakdown',
      'unapproved_substitution',
      'school_mismatch',
      'capacity_conflict',
      'payment_mismatch',
      'document_expired',
      'offline_conflict',
      'other',
    ],
    example: 'handover_failed',
  })
  @IsIn([
    'handover_failed',
    'handover_missing',
    'child_no_show',
    'driver_absent',
    'vehicle_breakdown',
    'unapproved_substitution',
    'school_mismatch',
    'capacity_conflict',
    'payment_mismatch',
    'document_expired',
    'offline_conflict',
    'other',
  ])
  @IsNotEmpty()
  exceptionType: ExceptionType;

  @ApiPropertyOptional({
    description: 'Severity level (determines SLA timer)',
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  })
  @IsIn(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  severity?: ExceptionSeverity = 'medium';

  @ApiProperty({ description: 'Short summary of the exception' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Trip UUID' })
  @IsUUID()
  @IsOptional()
  tripId?: string;

  @ApiPropertyOptional({ description: 'Trip Child UUID' })
  @IsUUID()
  @IsOptional()
  tripChildId?: string;

  @ApiPropertyOptional({ description: 'Booking UUID' })
  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Driver UUID' })
  @IsUUID()
  @IsOptional()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Additional structured context' })
  @IsObject()
  @IsOptional()
  details?: Record<string, unknown>;
}

export class ResolveExceptionDto {
  @ApiProperty({ description: 'Resolution code', example: 'GUARDIAN_VERIFIED_BY_PHONE' })
  @IsString()
  @IsNotEmpty()
  resolutionCode: string;

  @ApiProperty({ description: 'Resolution explanation note' })
  @IsString()
  @IsNotEmpty()
  resolutionNote: string;
}

export class CreateIncidentDto {
  @ApiProperty({
    description: 'Incident severity',
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high',
  })
  @IsIn(['low', 'medium', 'high', 'critical'])
  @IsNotEmpty()
  severity: ExceptionSeverity;

  @ApiProperty({ description: 'Incident category', example: 'safety_handover' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: 'Headline summary', example: 'Child pickup OTP mismatch and unauthorized person at stop' })
  @IsString()
  @IsNotEmpty()
  summary: string;

  @ApiPropertyOptional({ description: 'Detailed report' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Trip UUID' })
  @IsUUID()
  @IsOptional()
  tripId?: string;

  @ApiPropertyOptional({ description: 'Child UUID' })
  @IsUUID()
  @IsOptional()
  childId?: string;

  @ApiPropertyOptional({ description: 'Driver UUID' })
  @IsUUID()
  @IsOptional()
  driverId?: string;
}

export class CloseIncidentDto {
  @ApiProperty({ description: 'Mandatory closure note' })
  @IsString()
  @IsNotEmpty()
  closureNote: string;

  @ApiProperty({ description: 'UUID of user approving the incident closure' })
  @IsUUID()
  @IsNotEmpty()
  closureApprovedBy: string;
}
