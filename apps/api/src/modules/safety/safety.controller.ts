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
import {
  CloseIncidentDto,
  CreateExceptionDto,
  CreateIncidentDto,
  ResolveExceptionDto,
} from './dto/safety.dto';
import { SafetyService } from './safety.service';
import { AuthenticatedUser } from '@tinyride/shared-types';

@ApiTags('Safety, Exceptions & Incidents')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Get('exceptions')
  @Roles('operator', 'admin', 'support_agent')
  @ApiOperation({ summary: 'List operational safety exceptions' })
  @ApiResponse({ status: 200, description: 'Exceptions list' })
  async getExceptions(@Query('state') state?: string) {
    return this.safetyService.getExceptions(state);
  }

  @Post('exceptions')
  @Roles('driver', 'operator', 'admin', 'support_agent')
  @ApiOperation({ summary: 'Log a new operational safety exception' })
  @ApiResponse({ status: 201, description: 'Exception logged with SLA' })
  async createException(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExceptionDto,
  ) {
    return this.safetyService.createException(user, dto);
  }

  @Patch('exceptions/:id/resolve')
  @Roles('operator', 'admin')
  @ApiOperation({ summary: 'Resolve an operational exception with code and note' })
  @ApiResponse({ status: 200, description: 'Exception resolved' })
  async resolveException(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ResolveExceptionDto,
  ) {
    return this.safetyService.resolveException(id, user, dto);
  }

  @Get('incidents')
  @Roles('operator', 'admin', 'support_agent')
  @ApiOperation({ summary: 'List safety incidents' })
  @ApiResponse({ status: 200, description: 'Incidents list' })
  async getIncidents(@Query('status') status?: string) {
    return this.safetyService.getIncidents(status);
  }

  @Post('incidents')
  @Roles('operator', 'admin', 'support_agent', 'driver')
  @ApiOperation({ summary: 'Report a formal safety incident' })
  @ApiResponse({ status: 201, description: 'Incident case initialized' })
  async createIncident(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIncidentDto,
  ) {
    return this.safetyService.createIncident(user, dto);
  }

  @Patch('incidents/:id/close')
  @Roles('operator', 'admin')
  @ApiOperation({ summary: 'Close a safety incident after investigation and review' })
  @ApiResponse({ status: 200, description: 'Incident closed' })
  async closeIncident(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CloseIncidentDto,
  ) {
    return this.safetyService.closeIncident(id, user, dto);
  }
}
