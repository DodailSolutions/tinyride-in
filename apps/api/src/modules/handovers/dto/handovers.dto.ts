import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { HandoverLeg, HandoverMethod } from '@tinyride/shared-types';

export class RequestHandoverOtpDto {
  @ApiProperty({ description: 'Trip Child UUID', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  tripChildId: string;

  @ApiProperty({
    description: 'Handover leg',
    enum: ['home_pickup', 'school_receipt', 'school_release', 'home_dropoff'],
    example: 'home_pickup',
  })
  @IsIn(['home_pickup', 'school_receipt', 'school_release', 'home_dropoff'])
  @IsNotEmpty()
  leg: HandoverLeg;
}

export class VerifyHandoverDto {
  @ApiProperty({ description: 'Trip Child UUID', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  tripChildId: string;

  @ApiProperty({
    description: 'Handover leg',
    enum: ['home_pickup', 'school_receipt', 'school_release', 'home_dropoff'],
  })
  @IsIn(['home_pickup', 'school_receipt', 'school_release', 'home_dropoff'])
  @IsNotEmpty()
  leg: HandoverLeg;

  @ApiProperty({
    description: 'Handover verification method',
    enum: ['otp', 'qr_code', 'photo', 'signature', 'guardian_confirm', 'ops_override'],
    default: 'otp',
  })
  @IsIn(['otp', 'qr_code', 'photo', 'signature', 'guardian_confirm', 'ops_override'])
  @IsNotEmpty()
  method: HandoverMethod;

  @ApiPropertyOptional({ description: 'Submitted OTP (required if method is otp)', example: '4589' })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{4,6}$/, { message: 'OTP must be 4 to 6 numeric digits' })
  otp?: string;

  @ApiPropertyOptional({ description: 'Counterparty guardian UUID (for dropoff/pickup confirm)' })
  @IsUUID()
  @IsOptional()
  counterpartyGuardianId?: string;

  @ApiPropertyOptional({ description: 'Counterparty school staff user ID (for school receipt/release)' })
  @IsUUID()
  @IsOptional()
  counterpartySchoolUser?: string;

  @ApiPropertyOptional({ description: 'Mandatory reason explanation if using ops_override' })
  @IsString()
  @IsOptional()
  overrideReason?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate for GPS validation' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate for GPS validation' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;
}
