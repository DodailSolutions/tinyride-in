import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { VehicleType } from '@tinyride/shared-types';

export class RegisterOwnerDto {
  @ApiProperty({ example: 'Dodail Fleet Services Ltd', description: 'Legal entity or individual name' })
  @IsNotEmpty()
  @IsString()
  legalName!: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F', description: 'PAN or GSTIN number' })
  @IsOptional()
  @IsString()
  panOrGstin?: string;

  @ApiPropertyOptional({ example: 'tok_bank_settlement_01', description: 'Tokenized bank settlement reference' })
  @IsOptional()
  @IsString()
  payoutAccountRef?: string;
}

export class RegisterVehicleDto {
  @ApiProperty({ example: 'TS09AB1234', description: 'Vehicle registration number (RC)' })
  @IsNotEmpty()
  @IsString()
  registrationNumber!: string;

  @ApiPropertyOptional({ example: 'Bajaj Maxima Z', description: 'Make and model' })
  @IsOptional()
  @IsString()
  makeModel?: string;

  @ApiProperty({ example: 'auto', enum: ['auto', 'van', 'minibus', 'car'], description: 'Vehicle category' })
  @IsNotEmpty()
  @IsEnum(['auto', 'van', 'minibus', 'car'])
  vehicleType!: VehicleType;

  @ApiProperty({ example: 4, description: 'Manufacturer certified seating capacity' })
  @IsInt()
  @Min(1)
  @Max(50)
  seatingCapacity!: number;

  @ApiProperty({ example: 4, description: 'Approved usable capacity for school children' })
  @IsInt()
  @Min(1)
  @Max(50)
  usableCapacity!: number;

  @ApiProperty({ example: false, description: 'Whether an adult female attendant is assigned' })
  @IsBoolean()
  hasAttendant!: boolean;

  @ApiPropertyOptional({ example: '2027-06-30', description: 'Fitness certificate expiration date' })
  @IsOptional()
  @IsDateString()
  fitnessExpiresAt?: string;

  @ApiPropertyOptional({ example: '2027-06-30', description: 'Insurance certificate expiration date' })
  @IsOptional()
  @IsDateString()
  insuranceExpiresAt?: string;

  @ApiPropertyOptional({ example: '2027-06-30', description: 'Commercial transport permit expiration date' })
  @IsOptional()
  @IsDateString()
  permitExpiresAt?: string;
}

export class AssignDriverToVehicleDto {
  @ApiProperty({ example: 'b567d287-7333-4f93-b6d4-d50d0358e658', description: 'Driver UUID' })
  @IsNotEmpty()
  @IsUUID()
  driverId!: string;

  @ApiProperty({ example: 'c123d287-7333-4f93-b6d4-d50d0358e789', description: 'Vehicle UUID' })
  @IsNotEmpty()
  @IsUUID()
  vehicleId!: string;
}
