import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import {
  ConfirmSchoolArrivalDto,
  ConfirmSchoolReleaseDto,
  ReportSchoolExceptionDto,
} from './dto/schools.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolStaffGuard } from './guards/school-staff.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@tinyride/shared-types';

@ApiTags('School Portal Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, RolesGuard, SchoolStaffGuard)
@Roles('school_staff', 'admin')
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get('my-school')
  @ApiOperation({
    summary: 'Get Authenticated School Details',
    description: 'Retrieves details and gate timetable for the school affiliated with the caller.',
  })
  @ApiResponse({ status: 200, description: 'School profile details' })
  async getMySchool(@CurrentUser() user: AuthenticatedUser) {
    return this.schoolsService.getMySchool(user.userId);
  }

  @Get('roster')
  @ApiOperation({
    summary: 'Get Student Transport Roster',
    description: 'Returns all students enrolled in TinyRide transport for this school with emergency contacts.',
  })
  @ApiResponse({ status: 200, description: 'Student transport roster' })
  async getRoster(@Req() req: any) {
    const schoolId = req.schoolContext.schoolId;
    return this.schoolsService.getRoster(schoolId);
  }

  @Get('arrivals/today')
  @ApiOperation({
    summary: 'Get Today Morning Inbound Arrivals',
    description: 'Lists all morning inbound runs, vehicle details, driver credentials, and arriving students.',
  })
  @ApiResponse({ status: 200, description: 'Today arrival trips and student rosters' })
  async getTodayArrivals(@Req() req: any) {
    const schoolId = req.schoolContext.schoolId;
    return this.schoolsService.getTodayArrivals(schoolId);
  }

  @Post('arrivals/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm Student School Arrival (Check-In)',
    description: 'Records student arrival receipt handover attributed to staff member and marks child at_school.',
  })
  @ApiResponse({ status: 200, description: 'Arrival receipt recorded' })
  async confirmArrival(
    @Req() req: any,
    @Body() dto: ConfirmSchoolArrivalDto,
  ) {
    const { schoolId, schoolUserId } = req.schoolContext;
    return this.schoolsService.confirmArrival(schoolId, schoolUserId, dto);
  }

  @Get('releases/today')
  @ApiOperation({
    summary: 'Get Today Afternoon Outbound Releases',
    description: 'Lists all afternoon outbound runs, driver credentials, and students awaiting gate release.',
  })
  @ApiResponse({ status: 200, description: 'Afternoon release schedules and student rosters' })
  async getTodayReleases(@Req() req: any) {
    const schoolId = req.schoolContext.schoolId;
    return this.schoolsService.getTodayReleases(schoolId);
  }

  @Post('releases/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authorize Student Gate Release',
    description: 'Authorizes student departure to verified driver/vehicle and advances status to released_from_school.',
  })
  @ApiResponse({ status: 200, description: 'Gate release authorized and handover logged' })
  async confirmRelease(
    @Req() req: any,
    @Body() dto: ConfirmSchoolReleaseDto,
  ) {
    const { schoolId, schoolUserId } = req.schoolContext;
    return this.schoolsService.confirmRelease(schoolId, schoolUserId, dto);
  }

  @Post('exceptions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Report School Gate Exception',
    description: 'Logs a safety exception for student no-shows, unauthorized pickup attempts, or gate delays.',
  })
  @ApiResponse({ status: 201, description: 'Safety exception recorded' })
  async reportException(
    @Req() req: any,
    @Body() dto: ReportSchoolExceptionDto,
  ) {
    const { schoolId, schoolUserId } = req.schoolContext;
    return this.schoolsService.reportException(schoolId, schoolUserId, dto);
  }
}
