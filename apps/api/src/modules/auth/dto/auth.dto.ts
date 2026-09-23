import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    example: '+919876543210',
    description: 'International E.164 phone number',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+[1-9][0-9]{7,14}$/, {
    message: 'phoneE164 must be a valid E.164 international phone number (e.g. +919876543210)',
  })
  phoneE164!: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    example: '+919876543210',
    description: 'International E.164 phone number',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+[1-9][0-9]{7,14}$/, {
    message: 'phoneE164 must be a valid E.164 international phone number (e.g. +919876543210)',
  })
  phoneE164!: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit SMS OTP token',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{4,6}$/, {
    message: 'token must be a 4 to 6 digit numerical OTP',
  })
  token!: string;
}
