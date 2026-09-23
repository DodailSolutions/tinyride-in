import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RequestHandoverOtpDto, VerifyHandoverDto } from './dto/handovers.dto';
import { HandoversService } from './handovers.service';
import { AuthenticatedUser } from '@tinyride/shared-types';

@ApiTags('Handovers & Safety OTP')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('handovers')
export class HandoversController {
  constructor(private readonly handoversService: HandoversService) {}

  @Post('otp/request')
  @Roles('driver', 'parent', 'operator', 'admin')
  @ApiOperation({ summary: 'Request a salted OTP token for child handover' })
  @ApiResponse({ status: 201, description: 'OTP token created and dispatched' })
  async requestOtp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestHandoverOtpDto,
  ) {
    return this.handoversService.requestOtp(user, dto);
  }

  @Post('verify')
  @Roles('driver', 'school_staff', 'operator', 'admin')
  @ApiOperation({ summary: 'Verify handover leg (OTP, school receipt, guardian confirm, or ops override)' })
  @ApiResponse({ status: 201, description: 'Handover verified and recorded' })
  async verifyHandover(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyHandoverDto,
  ) {
    return this.handoversService.verifyHandover(user, dto);
  }
}
