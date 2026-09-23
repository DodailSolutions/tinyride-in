import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { RegisterDriverDto, RequestDocumentUploadDto } from './dto/drivers.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '@tinyride/shared-types';

@ApiTags('Driver & Supply')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Driver Registration & Onboarding',
    description: 'Registers a driver profile in pending_verification status and assigns the driver role.',
  })
  @ApiResponse({ status: 201, description: 'Driver registered in pending_verification state' })
  @ApiResponse({ status: 409, description: 'Driver profile or license number already exists' })
  async register(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterDriverDto) {
    return this.driversService.registerDriver(user.userId, dto);
  }

  @Get('me')
  @Roles('driver', 'admin')
  @ApiOperation({
    summary: 'Get Driver Profile & Verification Status',
    description: 'Returns the current driver details, compliance status, and uploaded documents.',
  })
  @ApiResponse({ status: 200, description: 'Driver profile details' })
  @ApiResponse({ status: 404, description: 'Driver profile not found' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.driversService.getDriverProfile(user.userId);
  }

  @Post('documents/upload-url')
  @Roles('driver', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request Document Upload Slot',
    description: 'Creates a pending document record and generates a signed upload URL for private storage.',
  })
  @ApiResponse({ status: 200, description: 'Signed upload URL generated' })
  async requestUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestDocumentUploadDto,
  ) {
    return this.driversService.createDocumentUploadSlot(user.userId, dto);
  }

  @Get('documents')
  @Roles('driver', 'admin')
  @ApiOperation({
    summary: 'List Driver Documents',
    description: 'Lists all compliance documents submitted by this driver with their status.',
  })
  @ApiResponse({ status: 200, description: 'List of driver documents' })
  async getDocuments(@CurrentUser() user: AuthenticatedUser) {
    return this.driversService.getDriverDocuments(user.userId);
  }
}
