import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { AssignScheduleDto, ProposeRouteDto } from './dto/routes.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from '@tinyride/shared-types';

@ApiTags('Driver & Supply')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post('propose')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('driver', 'vehicle_owner', 'operator', 'admin')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Propose Route',
    description: 'Proposes a school transit route with stops, schedules, and pricing for administrative approval.',
  })
  @ApiResponse({ status: 201, description: 'Route created in pending_review status' })
  async proposeRoute(@CurrentUser() user: AuthenticatedUser, @Body() dto: ProposeRouteDto) {
    return this.routesService.proposeRoute(user.userId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Discover Routes',
    description: 'Lists transport routes matching school, city, or status filter.',
  })
  @ApiQuery({ name: 'schoolId', required: false, type: String })
  @ApiQuery({ name: 'cityId', required: false, type: String })
  @ApiQuery({ name: 'state', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of matching routes' })
  async listRoutes(
    @Query('schoolId') schoolId?: string,
    @Query('cityId') cityId?: string,
    @Query('state') state?: string,
  ) {
    return this.routesService.listRoutes({ schoolId, cityId, state: state || 'approved' });
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get Route Details',
    description: 'Returns the full route graph including stops, schedules, pricing, and driver assignments.',
  })
  @ApiResponse({ status: 200, description: 'Route details' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  async getRoute(@Param('id') id: string) {
    return this.routesService.getRouteById(id);
  }

  @Post('schedules/assign')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('operator', 'admin')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign Driver and Vehicle to Schedule',
    description: 'Validates that driver and vehicle are both approved, and links them to the route schedule.',
  })
  @ApiResponse({ status: 200, description: 'Schedule assigned successfully' })
  @ApiResponse({ status: 400, description: 'Driver/vehicle not approved or capacity violation' })
  async assignSchedule(@CurrentUser() user: AuthenticatedUser, @Body() dto: AssignScheduleDto) {
    return this.routesService.assignSchedule(user.userId, dto);
  }
}
