import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssignmentType, StopType, TripDirection } from '@tinyride/shared-types';

export class RouteStopDto {
  @ApiProperty({ example: 'pickup', enum: ['pickup', 'dropoff', 'school', 'waypoint'] })
  @IsEnum(['pickup', 'dropoff', 'school', 'waypoint'])
  stopType!: StopType;

  @ApiProperty({ example: 'KPHB Phase 1 Bus Stop' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Near Pillar 712, KPHB Colony, Hyderabad' })
  @IsNotEmpty()
  @IsString()
  address!: string;

  @ApiProperty({ example: 17.4933, description: 'Latitude (-90 to 90)' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 78.3914, description: 'Longitude (-180 to 180)' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ example: 'b567d287-7333-4f93-b6d4-d50d0358e658', description: 'School UUID if school stop' })
  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @ApiProperty({ example: 1, description: 'Sequence order of the stop along the route' })
  @IsInt()
  @Min(1)
  sequenceNo!: number;
}

export class RouteScheduleDto {
  @ApiProperty({ example: 'Morning Pickup Run' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'am', enum: ['am', 'pm'] })
  @IsEnum(['am', 'pm'])
  direction!: TripDirection;

  @ApiProperty({ example: '07:30', description: 'Departure time in HH:MM format' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'departureTime must be HH:MM (e.g. 07:30)' })
  departureTime!: string;

  @ApiPropertyOptional({ example: '08:15', description: 'Arrival time in HH:MM format' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'arrivalTime must be HH:MM (e.g. 08:15)' })
  arrivalTime?: string;

  @ApiProperty({ example: 4, description: 'Number of passenger seats offered' })
  @IsInt()
  @Min(1)
  @Max(50)
  seatsOffered!: number;

  @ApiProperty({ example: 350000, description: 'Monthly fee in minor currency units (paise), e.g. 350000 = ₹3,500' })
  @IsInt()
  @Min(0)
  amountMinor!: number;
}

export class ProposeRouteDto {
  @ApiProperty({ example: 'Kukatpally to Little Scholars Run' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'b567d287-7333-4f93-b6d4-d50d0358e658', description: 'City UUID' })
  @IsNotEmpty()
  @IsUUID()
  cityId!: string;

  @ApiProperty({ example: 'c123d287-7333-4f93-b6d4-d50d0358e789', description: 'Destination School UUID' })
  @IsNotEmpty()
  @IsUUID()
  schoolId!: string;

  @ApiPropertyOptional({ example: 'd456d287-7333-4f93-b6d4-d50d0358e999', description: 'Zone UUID' })
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiProperty({ example: 15, description: 'Maximum allowed detour minutes' })
  @IsInt()
  @Min(0)
  @Max(60)
  maxDetourMinutes!: number;

  @ApiProperty({ type: [RouteStopDto], description: 'Ordered stops including pickup and school' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  stops!: RouteStopDto[];

  @ApiProperty({ type: [RouteScheduleDto], description: 'Schedules (e.g. AM and PM runs)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteScheduleDto)
  schedules!: RouteScheduleDto[];
}

export class AssignScheduleDto {
  @ApiProperty({ example: 'e789d287-7333-4f93-b6d4-d50d0358e111', description: 'Route Schedule UUID' })
  @IsNotEmpty()
  @IsUUID()
  scheduleId!: string;

  @ApiProperty({ example: 'f012d287-7333-4f93-b6d4-d50d0358e222', description: 'Driver UUID' })
  @IsNotEmpty()
  @IsUUID()
  driverId!: string;

  @ApiProperty({ example: 'a345d287-7333-4f93-b6d4-d50d0358e333', description: 'Vehicle UUID' })
  @IsNotEmpty()
  @IsUUID()
  vehicleId!: string;

  @ApiPropertyOptional({ example: 'primary', enum: ['primary', 'backup', 'temporary'] })
  @IsOptional()
  @IsEnum(['primary', 'backup', 'temporary'])
  assignmentType?: AssignmentType;
}
