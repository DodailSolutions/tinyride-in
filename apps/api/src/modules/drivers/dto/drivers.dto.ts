import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { DocumentType } from '@tinyride/shared-types';

export class RegisterDriverDto {
  @ApiProperty({ example: 'TS09 20230001', description: 'Indian Driving License number' })
  @IsNotEmpty()
  @IsString()
  licenseNumber!: string;

  @ApiPropertyOptional({ example: '2028-12-31', description: 'License expiration date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  licenseExpiresAt?: string;

  @ApiPropertyOptional({ example: 'b567d287-7333-4f93-b6d4-d50d0358e658', description: 'City UUID' })
  @IsOptional()
  @IsUUID()
  cityId?: string;
}

export class RequestDocumentUploadDto {
  @ApiProperty({
    example: 'license',
    enum: [
      'license',
      'insurance',
      'registration',
      'background_check',
      'police_verification',
      'medical_certificate',
      'vehicle_inspection',
      'fitness_certificate',
      'permit',
      'owner_authorization',
      'school_authorization',
      'other',
    ],
    description: 'Document category',
  })
  @IsNotEmpty()
  @IsEnum([
    'license',
    'insurance',
    'registration',
    'background_check',
    'police_verification',
    'medical_certificate',
    'vehicle_inspection',
    'fitness_certificate',
    'permit',
    'owner_authorization',
    'school_authorization',
    'other',
  ])
  documentType!: DocumentType;

  @ApiPropertyOptional({ example: 'DL-987654321', description: 'Physical document reference number' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({ example: '2028-12-31', description: 'Expiration date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ example: 'driver_license.pdf', description: 'Filename including extension' })
  @IsNotEmpty()
  @IsString()
  fileName!: string;
}
