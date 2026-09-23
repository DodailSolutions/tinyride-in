import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { TripDirection } from '@tinyride/shared-types';

export class GenerateTripsDto {
  @ApiProperty({ description: 'Trip run date (YYYY-MM-DD)', example: '2026-06-01' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date: string;
}

export class ReportAbsenceDto {
  @ApiProperty({ description: 'Child UUID', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  childId: string;

  @ApiProperty({ description: 'Date of absence (YYYY-MM-DD)', example: '2026-06-01' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'absenceDate must be in YYYY-MM-DD format' })
  absenceDate: string;

  @ApiPropertyOptional({
    description: 'Trip direction: am, pm, or omit for whole day',
    enum: ['am', 'pm'],
  })
  @IsIn(['am', 'pm'])
  @IsOptional()
  direction?: TripDirection;

  @ApiPropertyOptional({ description: 'Reason for child absence', example: 'Mild fever' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateTripStateDto {
  @ApiProperty({
    description: 'Target trip state',
    enum: ['ready', 'in_progress', 'completed', 'cancelled'],
  })
  @IsIn(['ready', 'in_progress', 'completed', 'cancelled'])
  @IsNotEmpty()
  state: 'ready' | 'in_progress' | 'completed' | 'cancelled';

  @ApiPropertyOptional({
    description: 'Flag indicating pre-trip safety readiness check completed (required for "ready")',
  })
  @IsBoolean()
  @IsOptional()
  readinessChecked?: boolean;

  @ApiPropertyOptional({
    description: 'Reason code if cancelling the trip (required if state is "cancelled")',
    example: 'VEHICLE_BREAKDOWN',
  })
  @IsString()
  @IsOptional()
  cancelReasonCode?: string;
}
