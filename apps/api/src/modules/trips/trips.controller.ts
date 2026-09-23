import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { GenerateTripsDto, ReportAbsenceDto, UpdateTripStateDto } from './dto/trips.dto';
import { TripsService } from './trips.service';
import { AuthenticatedUser } from '@tinyride/shared-types';

@ApiTags('Trips & Daily Manifests')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post('generate')
  @Roles('operator', 'admin')
  @ApiOperation({ summary: 'Generate daily trips and manifests for a given date' })
  @ApiResponse({ status: 201, description: 'Trips and manifests generated' })
  async generateTrips(
    @CurrentUser('userId') userId: string,
    @Body() dto: GenerateTripsDto,
  ) {
    return this.tripsService.generateTrips(dto, userId);
  }

  @Get('manifest/today')
  @Roles('driver', 'operator', 'admin')
  @ApiOperation({ summary: "Get current driver's trip execution manifest for today" })
  @ApiResponse({ status: 200, description: "Driver's daily manifest" })
  async getDriverManifestToday(
    @CurrentUser('userId') userId: string,
    @Query('date') date?: string,
  ) {
    return this.tripsService.getDriverManifestToday(userId, date);
  }

  @Get(':tripId/manifest')
  @Roles('driver', 'operator', 'admin', 'parent')
  @ApiOperation({ summary: 'Get full manifest and child stop sequences for a trip' })
  @ApiResponse({ status: 200, description: 'Trip manifest details' })
  async getTripManifest(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tripsService.getTripManifest(tripId, user);
  }

  @Patch(':tripId/state')
  @Roles('driver', 'operator', 'admin')
  @ApiOperation({ summary: 'Transition trip state (ready, in_progress, completed, cancelled)' })
  @ApiResponse({ status: 200, description: 'Trip state updated' })
  async updateTripState(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTripStateDto,
  ) {
    return this.tripsService.updateTripState(tripId, user, dto);
  }

  @Post('absences')
  @Roles('parent', 'admin')
  @ApiOperation({ summary: 'Report child absence to exclude child from manifests' })
  @ApiResponse({ status: 201, description: 'Absence recorded' })
  async reportAbsence(
    @CurrentUser('userId') userId: string,
    @Body() dto: ReportAbsenceDto,
  ) {
    return this.tripsService.reportAbsence(userId, dto);
  }
}
