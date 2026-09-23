import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReviewSubject, VerificationDecision } from '@tinyride/shared-types';

export class KycDecisionDto {
  @ApiProperty({
    example: 'driver',
    enum: ['driver', 'vehicle', 'owner', 'route', 'school', 'document'],
    description: 'Entity type under review',
  })
  @IsEnum(['driver', 'vehicle', 'owner', 'route', 'school', 'document'])
  subjectType!: ReviewSubject;

  @ApiProperty({ example: 'b567d287-7333-4f93-b6d4-d50d0358e658', description: 'Target entity UUID' })
  @IsNotEmpty()
  @IsUUID()
  subjectId!: string;

  @ApiProperty({ example: 'approved', enum: ['approved', 'rejected', 'needs_info'] })
  @IsEnum(['approved', 'rejected', 'needs_info'])
  decision!: VerificationDecision;

  @ApiProperty({ example: 'KYC_DOCUMENTS_VERIFIED', description: 'Mandatory standard reason code' })
  @IsNotEmpty()
  @IsString()
  reasonCode!: string;

  @ApiPropertyOptional({ example: 'All documents verified against RTA database', description: 'Reviewer notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
