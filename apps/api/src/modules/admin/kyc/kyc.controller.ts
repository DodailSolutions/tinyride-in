import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { KycDecisionDto } from './dto/kyc-review.dto';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '@tinyride/shared-types';

@ApiTags('Admin Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('admin/kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('drivers/pending')
  @Roles('kyc_reviewer', 'operator', 'admin')
  @ApiOperation({
    summary: 'Pending Driver KYC Queue',
    description: 'Lists all drivers waiting for identity and driving document review.',
  })
  @ApiResponse({ status: 200, description: 'List of pending drivers' })
  async getPendingDrivers() {
    return this.kycService.getPendingDriverQueue();
  }

  @Get('vehicles/pending')
  @Roles('kyc_reviewer', 'operator', 'admin')
  @ApiOperation({
    summary: 'Pending Vehicle Verification Queue',
    description: 'Lists all vehicles waiting for RC, fitness, permit, and insurance verification.',
  })
  @ApiResponse({ status: 200, description: 'List of pending vehicles' })
  async getPendingVehicles() {
    return this.kycService.getPendingVehicleQueue();
  }

  @Get('routes/pending')
  @Roles('operator', 'admin')
  @ApiOperation({
    summary: 'Pending Route Review Queue',
    description: 'Lists all proposed routes waiting for operations review and approval.',
  })
  @ApiResponse({ status: 200, description: 'List of pending routes' })
  async getPendingRoutes() {
    return this.kycService.getPendingRouteQueue();
  }

  @Post('decision')
  @Roles('kyc_reviewer', 'operator', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit KYC or Route Review Decision',
    description: 'Submits a formal approval, rejection, or resubmission request with reason code.',
  })
  @ApiResponse({ status: 200, description: 'Review recorded and entity state updated' })
  async submitDecision(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: KycDecisionDto,
  ) {
    return this.kycService.submitDecision(user.userId, dto);
  }
}
