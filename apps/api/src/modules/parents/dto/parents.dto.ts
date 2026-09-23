import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { GuardianRelationship } from '@tinyride/shared-types';

export class CreateChildDto {
  @ApiProperty({ description: "Child's first name", example: 'Aarav' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiPropertyOptional({ description: "Child's last name", example: 'Sharma' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({ description: 'School UUID', example: 'd3b07384-d113-4a15-b778-98e3b5df9a20' })
  @IsUUID()
  @IsNotEmpty()
  schoolId: string;

  @ApiPropertyOptional({ description: 'Date of birth (YYYY-MM-DD)', example: '2018-05-15' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateOfBirth must be in YYYY-MM-DD format' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Grade or Class', example: '3' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  grade?: string;

  @ApiPropertyOptional({ description: 'Section', example: 'B' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  section?: string;

  @ApiPropertyOptional({ description: 'Emergency contact phone (E.164)', example: '+919876543210' })
  @IsString()
  @IsOptional()
  @Matches(/^\+[1-9][0-9]{7,14}$/, { message: 'emergencyContact must be valid E.164 format' })
  emergencyContact?: string;

  @ApiPropertyOptional({ description: 'Special medical notes or instructions' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  medicalNotes?: string;

  @ApiPropertyOptional({ description: 'Known allergies' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  allergies?: string;

  @ApiPropertyOptional({ description: 'Special assistance or physical needs' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  specialNeeds?: string;
}

export class CreateGuardianDto {
  @ApiProperty({ description: 'Full name of guardian', example: 'Priya Sharma' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ description: 'Guardian phone in E.164 format', example: '+919876543211' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9][0-9]{7,14}$/, { message: 'phoneE164 must be valid E.164 format' })
  phoneE164: string;

  @ApiProperty({
    description: 'Relationship to child',
    example: 'mother',
    enum: [
      'mother',
      'father',
      'grandparent',
      'aunt',
      'uncle',
      'sibling',
      'nanny',
      'family_friend',
      'other',
    ],
  })
  @IsEnum([
    'mother',
    'father',
    'grandparent',
    'aunt',
    'uncle',
    'sibling',
    'nanny',
    'family_friend',
    'other',
  ])
  relationship: GuardianRelationship;

  @ApiPropertyOptional({ description: 'Pickup priority (1 = highest)', default: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  priority?: number = 1;

  @ApiPropertyOptional({ description: 'Pre-authorized for child pickup', default: false })
  @IsBoolean()
  @IsOptional()
  canPickup?: boolean = false;

  @ApiPropertyOptional({ description: 'Emergency contact flag', default: false })
  @IsBoolean()
  @IsOptional()
  isEmergencyContact?: boolean = false;
}
