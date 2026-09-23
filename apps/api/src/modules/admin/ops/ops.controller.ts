import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OpsService, DashboardOverview, LiveTripSummary } from './ops.service';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Admin Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('admin/ops')
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  @Get('overview')
  @Roles('admin', 'operator', 'kyc_reviewer', 'finance_admin')
  @ApiOperation({
    summary: 'Executive Operational Overview',
    description: 'Returns real-time platform KPIs, active trip counts, pending items, and today collections.',
  })
  @ApiResponse({ status: 200, description: 'Current operational metrics' })
  async getOverview(): Promise<DashboardOverview> {
    return this.opsService.getDashboardOverview();
  }

  @Get('trips/live')
  @Roles('admin', 'operator')
  @ApiOperation({
    summary: 'Live Fleet Trip Monitor',
    description: 'Retrieves all trips scheduled or in progress today across Hyderabad with handover progress.',
  })
  @ApiResponse({ status: 200, description: 'Live trip list with status and driver/vehicle assignments' })
  async getLiveTrips(): Promise<LiveTripSummary[]> {
    return this.opsService.getLiveTrips();
  }
}
