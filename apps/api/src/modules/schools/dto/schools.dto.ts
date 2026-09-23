import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ConfirmSchoolArrivalDto {
  @ApiProperty({ description: 'Trip child record UUID' })
  @IsUUID('4')
  tripChildId: string;

  @ApiPropertyOptional({ description: 'Optional arrival gate observation notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ConfirmSchoolReleaseDto {
  @ApiProperty({ description: 'Trip child record UUID' })
  @IsUUID('4')
  tripChildId: string;

  @ApiProperty({ description: 'True if driver badge and identity matched scheduled run' })
  @IsBoolean()
  driverVerified: boolean;

  @ApiProperty({ description: 'True if vehicle registration plate matched scheduled run' })
  @IsBoolean()
  vehicleVerified: boolean;

  @ApiPropertyOptional({ description: 'Gate release observation notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReportSchoolExceptionDto {
  @ApiPropertyOptional({ description: 'Trip UUID if linked to active run' })
  @IsOptional()
  @IsUUID('4')
  tripId?: string;

  @ApiProperty({ description: 'Child UUID involved in gate discrepancy' })
  @IsUUID('4')
  childId: string;

  @ApiProperty({
    description: 'Exception discrepancy type',
    enum: ['STUDENT_ABSENT_AT_GATE', 'UNAUTHORIZED_DRIVER_PICKUP', 'VEHICLE_MISMATCH', 'GATE_DELAY', 'OTHER'],
  })
  @IsEnum(['STUDENT_ABSENT_AT_GATE', 'UNAUTHORIZED_DRIVER_PICKUP', 'VEHICLE_MISMATCH', 'GATE_DELAY', 'OTHER'])
  exceptionType: string;

  @ApiPropertyOptional({ description: 'Severity level', enum: ['low', 'medium', 'high', 'critical'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity?: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({ description: 'Detailed discrepancy description' })
  @IsString()
  @IsNotEmpty()
  notes: string;
}
