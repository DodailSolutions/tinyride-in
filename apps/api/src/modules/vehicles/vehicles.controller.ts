import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { AssignDriverToVehicleDto, RegisterOwnerDto, RegisterVehicleDto } from './dto/vehicles.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '@tinyride/shared-types';

@ApiTags('Driver & Supply')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post('owners/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register as Vehicle Owner',
    description: 'Registers the authenticated user as a vehicle owner entity and grants the vehicle_owner role.',
  })
  @ApiResponse({ status: 201, description: 'Vehicle owner profile registered' })
  async registerOwner(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterOwnerDto) {
    return this.vehiclesService.registerOwner(user.userId, dto);
  }

  @Post()
  @Roles('vehicle_owner', 'admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register Vehicle',
    description: 'Registers a school transit vehicle (auto/van) in pending_verification state.',
  })
  @ApiResponse({ status: 201, description: 'Vehicle submitted for KYC review' })
  @ApiResponse({ status: 400, description: 'Usable capacity exceeds seating capacity' })
  @ApiResponse({ status: 409, description: 'Vehicle plate already registered' })
  async registerVehicle(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterVehicleDto) {
    return this.vehiclesService.registerVehicle(user.userId, dto);
  }

  @Get()
  @Roles('vehicle_owner', 'admin')
  @ApiOperation({
    summary: 'List Registered Vehicles',
    description: 'Lists all vehicles owned by the authenticated owner with driver assignments.',
  })
  @ApiResponse({ status: 200, description: 'List of owned vehicles' })
  async listVehicles(@CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.listOwnerVehicles(user.userId);
  }

  @Post('assign-driver')
  @Roles('vehicle_owner', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authorize Driver Assignment',
    description: 'Authorizes an approved driver to operate an owner-registered vehicle.',
  })
  @ApiResponse({ status: 200, description: 'Driver assigned to vehicle' })
  @ApiResponse({ status: 403, description: 'User does not own this vehicle' })
  async assignDriver(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssignDriverToVehicleDto,
  ) {
    return this.vehiclesService.assignDriverToVehicle(user.userId, dto);
  }
}
