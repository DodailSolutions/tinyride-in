import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class HoldSeatDto {
  @ApiProperty({ description: 'Route Schedule UUID', example: 'c56a4180-65aa-42ec-a945-5fd21dec0538' })
  @IsUUID()
  @IsNotEmpty()
  scheduleId: string;

  @ApiProperty({ description: 'Child UUID', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  childId: string;

  @ApiPropertyOptional({ description: 'Hold window in minutes (1 - 30)', default: 10 })
  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  holdMinutes?: number = 10;
}

export class CreateBookingDto {
  @ApiProperty({ description: 'Child UUID', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  childId: string;

  @ApiProperty({ description: 'Schedule UUID', example: 'c56a4180-65aa-42ec-a945-5fd21dec0538' })
  @IsUUID()
  @IsNotEmpty()
  scheduleId: string;

  @ApiProperty({ description: 'Pickup stop UUID', example: '4a0f44bc-38bf-4c74-9844-3d02a0a2df3c' })
  @IsUUID()
  @IsNotEmpty()
  pickupStopId: string;

  @ApiProperty({ description: 'Dropoff stop UUID', example: '7d0d0f2a-b7ec-4482-a9b0-4660d1ba801a' })
  @IsUUID()
  @IsNotEmpty()
  dropoffStopId: string;

  @ApiPropertyOptional({ description: 'Seat hold UUID if seat was previously reserved' })
  @IsUUID()
  @IsOptional()
  seatHoldId?: string;

  @ApiProperty({ description: 'Service start date (YYYY-MM-DD)', example: '2026-06-01' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'serviceStart must be in YYYY-MM-DD format' })
  serviceStart: string;

  @ApiPropertyOptional({ description: 'Service end date (YYYY-MM-DD)', example: '2027-04-30' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'serviceEnd must be in YYYY-MM-DD format' })
  serviceEnd?: string;

  @ApiPropertyOptional({
    description: 'Billing cycle plan',
    enum: ['one_time', 'weekly', 'monthly', 'term'],
    default: 'monthly',
  })
  @IsIn(['one_time', 'weekly', 'monthly', 'term'])
  @IsOptional()
  billingPeriod?: 'one_time' | 'weekly' | 'monthly' | 'term' = 'monthly';

  @ApiPropertyOptional({ description: 'Price plan UUID' })
  @IsUUID()
  @IsOptional()
  priceId?: string;
}

export class CancelBookingDto {
  @ApiProperty({ description: 'Cancellation reason code', example: 'PARENT_REQUESTED' })
  @IsString()
  @IsNotEmpty()
  reasonCode: string;

  @ApiPropertyOptional({ description: 'Optional explanation' })
  @IsString()
  @IsOptional()
  notes?: string;
}
