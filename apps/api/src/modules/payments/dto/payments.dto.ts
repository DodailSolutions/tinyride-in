import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreatePaymentOrderDto {
  @ApiProperty({ description: 'Booking UUID to pay for', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiPropertyOptional({ description: 'Amount in minor units (paise). Defaults to booking amount.' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  amountMinor?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string = 'INR';
}
